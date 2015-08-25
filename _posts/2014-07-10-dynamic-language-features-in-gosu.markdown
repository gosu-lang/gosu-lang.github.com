---
layout: post
title: Dynamic Language Features in Gosu
authors:
- Scott McKinney
---

Static typing is the lifeblood of Gosu.  But in rare situations it gets in the way or just isn't appropriate for the problem at hand.  For those _rare_ circumstances dynamic typing may be more desirable. To that end we introduced rich dynamic typing features in Gosu.


The Dynamic Type
----------------

Gosu currently supports a minimal set of dynamic features.  These include the `eval()` expression, associative array syntax, and reflection.  These are powerful and useful features but together they fall far short of a complete dynamic feature set.  

Types aren't declared on variables in a dynamic language, thus a variable can be assigned a value of any type and can reference a member of any name – all names and operations are resolved at runtime.  Normally dynamic typing is an anti-feature, it makes code harder to understand and maintain.  Sometimes, however, it comes in handy.  Let's say, for example, you want to write a script that processes some claim data. Let's assume there are several forms of the Claim type in existence, some are Java entity types from different releases, some are in XML nodes, some could be JSON objects, or what have you, but for the purposes of the script the type definition is insignificant because you know they can all adhere to a common, albeit undeclared, API.  What you desire is a function like this:

    function printClaim( claim: Dynamic ) {
      print( "Claim Number: " + claim.ClaimNumber )
    }
  
The claim parameter here is dynamically typed; we want the parser to take it on faith that a ClaimNumber property exists at runtime.  Essentially, the Dynamic type is an anti-type, it tells the parser to completely escape the rigors of the static type system.  Exactly what our statically typed language needs to behave dynamically.  We can modify the parser to do that without much trouble and we introduce a new type loader that can resolve the `Dynamic` type name among other things.  The loader is dirt simple, it resolves one and only one type, `Dynamic`, which resides in its exclusive dynamic package, thus the fully qualified name is `dynamic.Dynamic`.  Type information for the Dynamic type needs to be, well, dynamic; when asked for a property of a given name, it must produce a shell for that property, likewise for methods.  Constructors are different, we'll talk about those later. In any respect there's not a lot of work involved to get the foundation of a dynamic type in place for Gosu, in fact much of it is already in place with Gosu's support for the general _placeholder_ type.

Property and Method Dispatching
-------------------------------

Back to the `printClaim()` example.  I should be able to invoke this method with an object of any type that can by hook or by crook produce a `ClaimNumber` property:

    // An entity.Claim
    var claim = new entity.Claim()
    printClaim( claim )
     
    // A JsonObject
    var jsonClaim = Json.createObjectBuilder().add( "ClaimNumber", "12345678" )
    printClaim( jsonClaim )
  
The idea is _anything_ should work that _can_ work.  The first call to claim is a simple example of late binding; the bytecode generated for the call can simply invoke the ClaimNumber property reflectively or via INVOKEDYNAMIC.  Basically, if the type of the object at runtime has a direct property matching the name, it should just work.

The second example is more involved.  It builds a [JsonObject](http://docs.oracle.com/javaee/7/api/javax/json/JsonObject.html) with a ClaimNumber name-value pair, but JsonObject itself does not have a ClaimNumber property directly.  To get the value of ClaimNumber you have to call `JsonObject#get()`.  How can we connect the dots?  We need two things.  1) We need to somehow modify JsonObject to expose to our compiler the means to get ClaimNumber as a property from the name-value pair. 2) The compiler needs to define some API or convention to make that possible.

Some dynamic languages let you override method dispatching.  Groovy, for instance, lets you intercept property and method invocation by overriding [set/getProperty() and invokeMethod()](http://groovy.codehaus.org/Using+invokeMethod+and+getProperty) for a given type.  Gosu can do that too with the help of enhancements.  Let's say we enhance JsonObject like so:

    enhancement JsonObjectEnhancement :JsonObject {
      function $getProperty( name: String ) : Object {
        var value: JsonValue = this.get( name )
        if(value != null) {
          switch (value.ValueType) {
            /* ... */
            case NUMBER:
              return (value as JsonNumber).doubleValue()
            case TRUE:
              return true
            case FALSE:
              return false
            case NULL:
             return null
          }
        }
        return IPlaceholder.UNHANDLED
     }

      function $setProperty( name: String, value: Object ) : Object {
        var obj : JsonValue = this.getJsonObject( name )

        if( value typeis Double ) {
          var x = Json.createObjectBuilder().add( "X", value ).build().getJsonObject( "X" )
          this.put( name, x)
        }
        /* ... */
        else if( value == null ){
          var x = Json.createObjectBuilder().addNull( "X" ).build().getJsonObject( "X" )
          this.put( name, x )
        }
        return IPlaceholder.UNHANDLED
      }

      function $invokeMethod( name: String, args: Object[] ) : Object {
        return IPlaceholder.UNHANDLED
      }
    }

As you can probably guess we've defined a convention where if methods `$getProperty()` and `$setProperty()` exist, dispatching of properties is delegated to them, likewise for `$invokeMethod()`.  Since we don't own the implementation of JsonObject we resort to enhancing it, otherwise we could implement the methods directly in its class definition.  In addition we support `$getMissingProperty()`, `$setMissingProperty()`, and `$invokeMissingMethod()`, which invert control back to normal dispatching where these methods are called only if the type does not explicitly declare a property or method.

With property invocation now in the hands of the enhancement the second call to `printClaim()` above works; the JsonObject can be used as if it's name-value pairs were actual properties indistinguishable from the entity type.

You might be asking yourself, but how can I work with JsonObject as a static type now?  First, notice the methods return `UNHANDLED` if the property or method is not present in JsonObject's map.  Basically, if any of these methods returns `UNHANDLED`, normal dispatching takes over.  This means you can still utilize the type's declared features even when you're working with it dynamically, but only where there is no overlap with actual properties and name-value pairs.  But if you want to use the type's declared features, you should normally use them statically:

    var jsonObj : JsonObject // static use of JsonObject
    jsonObj = Json.createObjectBuilder().add( "ClaimNumber", "12345678" )
    jsonObj.size() // compiled directly as call to INVOKEINTERFACE, no dynamic interference
     
    var dynJsonObj : Dynamic = jsoObj // dynamic use of JsonObject
    dynJsonObj.size() // compiled as a reflective call, which first goes through your $invokeMethod()
    
Expando Objects
---------------

Most dynamic langauges provide what is called expando objects, in fact some provide only expando objects.  In general an expando object is one where its properties and/or methods are defined dynamically on assignment.  Essentially, an expando object behaves a lot like a map – you associate named keys with values – only with expando objects the keys appear as fields directly on the map.  To facilitate this behavior the Gosu API provides the `IExpando` interface:

    public interface IExpando {
      Object getFieldValue( String field );
      void setFieldValue( String field, Object value );
      void setDefaultFieldValue( String field );
      Object invoke( String methodName, Object... args );
      Map getMap();
    }

Any implementation of this interface can behave as an expando object in the context of the Dynamic type.  Gosu provides a default implementation that delegates to a Map:

    public class Expando implements IExpando {
      private Map<String, Object> _map = new ListOrderedMap();

      @Override
      public Object getFieldValue( String field ) {
        return _map.get( field );
      }

      @Override
      public void setFieldValue( String field, Object value ) {
        _map.put( field, value );
      }

      @Override
      public Object invoke( String methodName, Object... args ) {
        Object f = _map.get( methodName );
        if( f instanceof IBlock ) {
          return ((IBlock)f).invokeWithArgs( args );
        }
        return IPlaceholder.UNHANDLED;
      }

      @Override
      public void setDefaultFieldValue( String name ) {
        setFieldValue( name, new Expando() );
      }

      @Override
      public Map getMap() {
        return _map;
      }
    }
    
Now you can rock out and write expando code just like the script kiddies:


    uses gw.lang.reflect.Expando
    uses dynamic.Dynamic

    var villain : Dynamic = new Expando()

    villain.Name = "Doctor Polaris"
    villain.Powers = {"ferrokinesis", "create a localized magnetic storm in a person's brain, killing them instantly"}
    villain.Health = 10
    villain.punch = \->  { if( villain.Health > 0 ) villain.Health-- }
    villain.isDead = \-> villain.Health == 0

    while( !villain.isDead() ) {
      villain.punch()
      print(villain.Health)
    }

 
On a more practical note expandos allow for a nicer JSON-like code format:

    var person = new Dynamic() { // creates an Expando
      :name = "Joe",
      :address = new() {
        :line1 = "123 Main St.",
        :city = "Cupertino",
        :state = "CA"
      },
      :hobbies = {
        "miniature golf",
        "sperm doning",
        "cage fighting"
      },
      :cars = {
        new() {
          :make = "Acura",
          :model = "Integra",
          :year = 1991
        },
        new() {
          :make = "Audi",
          :model = "POS A6",
          :year = 2003
        }
      }
    }
    
Yes, that is legal Gosu code right there.  Notice there's no need for the initial `new Expando()` assignment to the `Dynanic var`. This is because the Dynamic type information provides two constructors: one default no-argument one and another with an `IExpando` argument.  The example here uses the default one, which simply returns a new instance of our `Expando` class.  The one that takes an `IExpando` argument simply returns the argument – the idea with both is to provide a simpler way to start working with an Expando.  Also note the inner use of `new()` with no type moniker.  This is possible by way of type inference – all Dynamic type properties are themselves Dynamic, thus the new operator can omit the name.  Not for everybody, but it's a decent way to format expandos as dynamic JSON objects in Gosu.

Assignability
-------------

Fundamentally any type is assignable to Dynamic type.  Similarly the Dynamic type is assignable to any type.  These include arrays, primitives, generics, closures, Gosu, Java, and all custom types.  The following code provides a sampling of assignments to a Dynamic typed variable.
Press the "Eval Me..." button to execute it.

<pre class="prettyprint eval-gs"> 
uses dynamic.Dynamic
uses java.util.ArrayList

var dyn : Dynamic
dyn = 1 // int type auto-boxed as Integer
dyn = true // boolean type auto-boxed as Boolean
dyn = 1BD // BigDecimal
 
dyn = "hello"
print( dyn.substring( 1 ) ) // "ello"
 
dyn = new int[] {1, 2, 3}
print( dyn[0] ) // Dynamic vars can use array access syntax
for( n in dyn ) {
  print( n )
}
 
dyn = new ArrayList&lt;String&gt;()
dyn.add( "hello" )
 
dyn = new ArrayList&lt;Dynamic&gt;()
dyn.add( 1 )
dyn.get( 0 ).intValue()
dyn.add( "hi" )
dyn.get( 1 ).charAt( 1 )
 
dyn = \-&gt; print( "hello" )
dyn()
 
dyn = 8
var sum = dyn + 1 // Dynamic vars can be operands in arithmetic expressions
</pre>

Notice the primitive values are auto-boxed on assignment to a Dynamic type.  This is because at runtime the Dynamic type erases to Object; the JVM does not provide support for treating primitives and Object alike.  Keep this in mind when using Dynamic types with heavy number crunching, performance-critical code. Also notice Dynamic variables can be used directly as arrays and as operands in arithmetic operations.

Here's some code demonstrating assigning the other way, from Dynamic to other types.

<pre class="prettyprint eval-gs"> 
uses dynamic.Dynamic
uses java.util.List

var dyn : Dynamic = 1
var i : int = dyn // dynamically auto-unboxes the Integer held by the Dynamic var
 
dyn = {"abc", "123"}
var list : List&lt;String&gt; = dyn
 
dyn = \-&gt;print( "hi" )
var callMe() = dyn
callMe()
</pre>

Basically a variable of any type can be assigned an expression of dynamic type.

Related Work
-------------

* Structural typing (aka static duck typing) is another somewhat dynamic feature we have planned on the short horizon.  We'll write a blog post for that soon.
* The Goson project provides a specification, JSchema, for JSON and a nice type loader for JSON objects.  So if JSON is your game, have a look at Goson.
* Gosu borrowed basic ideas for dynamic features from Groovy and C#.  Check out Groovy's meta-programming capabilities.
* Some languages provided something called _elastic_ objects, which are similar to expando objects with the additional capability to automatically assign values to null elements in a member path as the lhs of an assignment.  Gosu has a feature similar to that via @Autocreate; we are contemplating using that to provide our own elastic object.
* The Dynamic type loader proposed here, although technically "custom", poses no extra burden on tooling given it's dynamic nature.
