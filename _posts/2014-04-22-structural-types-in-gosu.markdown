---
layout: post
title: Structural Types in Gosu
authors:
- Scott McKinney
---

Gosu is a statically typed language employing a [Nominal type system](http://en.wikipedia.org/wiki/Nominative_type_system), which generally means type assignability is based on declared type _names_.  For instance, in Gosu a type is assignable to interface, Foo, only if it declares Foo in its hierarchy.  Another form of static typing, called [Structural Typing](http://en.wikipedia.org/wiki/Structural_type_system), determines assignability based on declared type _features_.  Roughly a type is structurally assignable to Foo if compatible versions of all Foo's methods and properties exist in the type -- the type doesn't have to formally declare that it implements Foo.  While this method of type comparison is more involved and carries with it performance penalties, it is much less rigid than nominal typing because it measures a type based on its capability, not its name.  Several newer languages acknowledge this flexibility and now incorporate structural typing into their type systems, among them are [Go](http://golang.org/), [Scala](http://docs.scala-lang.org/style/types.html), and [TypeScript](http://blogs.msdn.com/b/typescript/archive/2013/01/24/interfaces-walkthrough.aspx).  The Gosu team is inspired by their efforts and is motivated by recent demand to integrate structural typing into the language.

Combining Forces
----------------

Structural typing vs. nominal typing isn't an either/or proposition. Rather the idea here is to recognize the benefits of each and let them cooperate within Gosu.  In any respect most of us can probably agree that more type information is better than less in keeping with a sound type system.  More to the point, as the author of a class it's better to declare your class's intentions explicitly if you can.  For instance, if your class intentionally implements the methods of an interface, it's better to declare this intention via the implements clause.  Doing so helps readers of your class comprehend more information about your class and your overall design faster.  Furthermore, explicit type information facilitates faster, more capable and more reliable tooling.  Everyday we rely on deterministic refactoring, navigation, usage searching, and code inspection, all of which would be at best less useful without nominal typing.

Life isn't always sunshine and roses with purely nominal types, however. There are times when their rigidity is more of a liability.  Consider the following three nominally unrelated types from the Java runtime library, simplified here for brevity.

    class Rectangle {
      public double getX();
      public double getY();
      public double getWidth();
      public double getHeight();
      ...
    }

    class Point {
      public double getX();
      public double getY();
      public void setLocation(double x, double y);
      ...
    }

    class Component {
      public int getX();
      public int getY();
      public int getWidth();
      public int getHeight();
      ...
    }

These are three commonly used classes in a typical Java Swing application. Let's say we're tasked with sorting instances of them according to their location in the coordinate plane, say as a [Comparator](http://docs.oracle.com/javase/7/docs/api/java/util/Comparator.html) implementation. Each class defines methods for obtaining X, Y coordinates, but these properties don't implement a common interface.  We don't own the implementation of these classes, so we're saddled with having to write three distinct, yet nearly identical, Comparators – a clear violation of the [DRY principle](https://en.wikipedia.org/wiki/Don%27t_Repeat_Yourself), for those of you keeping score.

This is where we'd like structural typing to step in.  Basically we want to declare an interface with the `getX()` and `getY()` properties, use that as the basis of our Comparator, and somehow have Gosu be cool with that:

    interface Coordinate {
      property get X() : double
      property get Y() : double
    }

    var coordSorter = new Comparator<Coordinate>() {
      override function compare( c1: Coordinate, c2: Coordinate ): int {
        var res = c1.Y == c2.Y ? c1.X - c2.X : c2.Y - c1.Y
        return res < 0 ? -1 : res > 0 ? 1 : 0;
     }
    }

    var points: List<Point> = {new(2, 1), new(3, 5), new(1, 1)}
    Collections.sort( points, coordSorter ) // Not cool

Of course Gosu is not cool with that.  Even if Gosu were cool with that, the Java bytecode verifier would be none too pleased, otherwise the corresponding [INVOKEINTERFACE](http://docs.oracle.com/javase/specs/jvms/se7/html/jvms-6.html#jvms-6.5.invokeinterface) bytecode instructions for `getX()` and `getY()` calls would crash and burn.

Situations like this are not uncommon.  As Java programmers we tend to accept them as facts of life and proceed to write or generate junk code.  That being the case we'd like to extend Gosu's type system to accommodate structural typing so that the previous example works with minimal impact on the language and without compromising the integrity of existing type constructs.  There are several options to consider, none of them are perfect at least in part because ultimately the JVM does not provide allowances for structural type assignment, nor does it support structural method invocation.  Fortunately we have a reasonable alternative we'll cover later.  But first we'll examine different ways we can go about integrating structural typing and the one we believe is most suitable for Gosu.  Then we'll detail our preferred implementation and show how it integrates with other parts of the type system.  Finally we'll introduce an additional utility that fills some gaps.

Use Site vs. Declaration Site
-----------------------------

There are several options on the table regarding how we could integrate structural typing, but there are really just two fundamental approaches: use-site and declaration-site.  Basically the difference concerns where we place responsibility for handling structural typing -- where a structure is used or where it's declared?

### Use-Site Approach

Continuing with our Coordinate interface, here's a simple example of potential use-site structural typing:

    printX( new Point() as Coordinate )

    function printX( coord: Coordinate ) {
      print( coord.X )  // INVOKEINTERFACE => coord must be a Coordinate binarily
    }

Since Point isn't really a Coordinate, a use-site strategy must somehow signal that Point satisfies Coordinate's structure.  In this example we do that with a cast and pretend the parser verifies the types are structurally compatible and accepts the cast.  Note the language could be made to simply accept the assignment without a cast, it's a matter of taste and tolerance.  Above all, what truly makes this an example of use-site structural typing happens at the bytecode level where the coord parameter has type Coordinate.  This means a method call or property access on coord must be made from an actual Coordinate at runtime, otherwise the INVOKEINTERFACE bytecode instruction fails.  So not only does the compiler have to verify that Point is structurally assignable to Coordinate, it must also proxy (or wrap) the Point argument as a Coordinate before invoking `printX()`.  On the plus side this means the author of the `printX()` method doesn't need to think about whether or not the coord parameter should be structurally typed – it'll work with both nominal and structural implementors of Coordinate.  This is the main selling point for the use-site approach, sounds nice too.  On the minus side use-site typing requires proxies for each type, which isn't so bad considering a bit of caching can make it tolerable from a performance standpoint.  What's troubling about proxies, however, isn't so much the performance of a single proxy; it's the fact that object identity is lost – a proxied object is no longer an instance of the original object.  In the example it's not such a big deal, but consider a more involved use-case – consider our Coordinate Comparator:

    var points: List<Point> = {new(2, 1), new(3, 5), new(1, 1)}
    Collections.sort( points, coordSorter )

Collections and arrays complicate proxying to a point where the use-site approach becomes intolerable  The compiler has to generate code to proxy each Point in the list and then add the proxies to a new list of the same type.  Considering the capacity of the list could be arbitrarily large we now have a problem on our hands.  Performance suddenly becomes an issue – what should be a method call of constant time is instead an iteration and proxy creation of at least O(n) complexity.  Worse, we have to preserve the type (or at least the behaviour) of the collection.  This part of the problem is intractable since collection types are open-ended; it's impossible to know ahead of time how to properly create and initialize a type the semantics of which we can't know.  Finally, modifications made on a mutable collection or return results gathered into a separate collection in terms of the proxied one would have to somehow be reconciled with the original one.  Our Comparator, for instance, sorts the proxied list, this means the use-site must generate more code to reflect the new order in the original list after the call to `sort()`, which on a good hair day entails an additional O(n) performance hit.  Suffice it to say, the use-site approach has some issues.

### Declaration-Site Approach

With the use-site strategy pretty much off the table we look toward a declaration-site solution.  The takeaway from our struggle with proxies at the use-site is that it's best, especially in light of collections, to support direct assignment of values.  But as we've already discussed the JVM is serious about not letting that happen, it won't let us assign a Point to a Coordinate.  Yet precisely what we need is for an object of _any type_ that structurally conforms with Coordinate to be assignable to a Coordinate.  In JVM terms the only type that is assignable from any type is Object.  So it follows that our compiler in a declaration-site solution should erase the Coordinate type at runtime to Object.  This way we can assign any type we desire to Coordinate, so long as it's structurally compatible.  How might the language help us declare that Coordinate is as structure?  There are several ways we could do this, these include:

1. a special annotation such as @Structure
2. a new modifier such as "struct"
3. a new type called "structure".

All of them accomplish the same basic thing, which is to signal to the parser and compiler it is dealing with a structural type.  A @Structure annotation is an attractive idea because it involves zero changes to the language.  One problem with it, however, is that it's difficult to control where it's used.  The @Target meta-annotation restricts where an annotation can be used, but only at the granularity of Type; it won't let us choose the kind of type (class, enum, interface, etc.)  In our case we want to restrict it to interface types because they conveniently provide the level of structure we need.  More on this later.  More critically, nothing prevents a _Java_ interface from declaring that it's a @Structure.  While the idea is alluring, treating Java interfaces as structural types isn't feasible from Gosu because our compiler (currently) doesn't compile Java source and, therefore, doesn't have the opportunity to generate code necessary to make structural typing work from within Java, such as erasing the structural type to Object.  Also, in my judgement, using an annotation as a declarative modifier for a feature of this magnitude is kind of sloppy.  My personal preference is to integrate the feature more directly into the language.

Adding a new "struct" modifier is another idea.  It's Gosu-specific, so it solves the problems we otherwise have with an annotation – its use is limited to Gosu interfaces and it's more naturally integrated into the language.  Not too bad, but it still doesn't feel quite right.  A structure has it's own identity as a type, it's a unique kind of type.  It looks and in most ways behaves like an interface, but it's not an interface, it's a structure!  Consequently, modifying an interface with "struct" doesn't quite jibe with reality.

We're left with the final option, a new "structure" type.  This feels right.  Like the modifier option it solves the problems with the annotation approach. Internally we can leverage 99% of the existing code for interfaces as-is, but a structure is a different animal and, so, deserves it's own seat at the table with class, interface, and enum.  The grammar change is minimal: add a new keyword and support it in the grammar as the new structure type.  Following our Coordinate example we only need to change our interface to a structure:


    structure Coordinate {
      property get X() : double
      property get Y() : double
    }

With structural types in the grammar we can revisit the details of our Coordinate example.

    printX( new Point() )

    function printX( coord: Coordinate ) {
      print( coord.X )
    }

Notice we no longer need to cast the new Point instance to Coordinate, that is a use-site remnant.  Because Coordinate is declared as a structure Gosu knows to test for structural assignability.  Also, as we covered earlier, the compiler knows to erase the Coordinate type to Object, so in bytecode we generate the signature of `printX()` to look like this:

    printX( java.lang.Object ): void

This is what enables us to pass Point, or any other structurally compatible type, to `printX()`. Now we're left with the property access:

    coord.X

If coord's type were not erased, we would use INVOKEINTERFACE on the bytecode-generated method, `getX()`, from the Coordinate interface (structures exist in bytecode as interfaces, more on this later). We could take the low road and generate dynamic reflection code:

        INVOKEVIRTUAL java/lang/Object.getClass ()Ljava/lang/Class;
        LDC "getX"
    ...
        ANEWARRAY java/lang/Class
        INVOKEVIRTUAL java/lang/Class.getMethod (Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    ...
        ANEWARRAY java/lang/Object
        INVOKEVIRTUAL java/lang/reflect/Method.invoke (Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

This isn't so bad, but it entails significant overhead compared with a quick INVOKEINTERFACE instruction.  The slowest part of the reflection overhead is the call to `Class#getMethod()`, a notoriously expensive call involving hierarchical method iteration, parameter array comparison, return type covariance checking, and method cloning – every single time.  The `Method#invoke()` reflection call isn't cheap either.  We could improve performance some by employing an elaborate method caching technique a la [Scala](http://infoscience.epfl.ch/record/138931/files/2009_structural.pdf).  But, as it turns out we don't want to use `Class#getMethod()`, less because it's slow, more because it doesn't satisfy our use-case.  For starters, we need to match methods based on looser criteria, mainly signature variance (more on this later).  We want the following code to work:

    structure Capitalizer {
      function capitalize( s: String ) : CharSequence
    }

    class MyCapitalizer {
     function capitalize( s: CharSequence ) : String {
        return s.toString().toUpperCase()
      }
    }

    var cap : Capitalizer = new MyCapitalizer()
    var capitalized = cap.capitalize( "coffee" )

Following the reflection-based approach we'd need to roll our own, more involved `getMethod()` to satisfy this criteria.  Not that big a deal, but additional friction nonetheless.

A tougher problem lurks, however.  What if MyCapitalizer didn't directly implement the capitalize method, but instead got it from an enhancement?  While this is a powerful and compelling aspect of using structural types in Gosu, it complicates our reflective method look-up and invocation code beyond our comfort zone.  We'd have to either use Gosu reflection at runtime or generate code to search for and cache enhancement classes, neither approach is desirable. Even if we could generate semi-efficient code to find and cache the right method, we'd still have to generate code to invoke it.  This is nontrivial considering hidden parameter types such as those supporting generic method reification and so forth.  To get this right, we'd more or less find ourselves rewriting a major part of our compiler, but in different terms.  Yes, our compiler already handles the myriad special cases relating to method call code generation, but it does so from the perspective of parsed Gosu source.  Wait.  Why not generate Gosu?  We can totally burn down the reflective call idea and dynamically generate a simple Gosu proxy, compile it on the fly, and cache it by structure type.  The proxy we generate for MyCapitalizer looks like this:

    class <proxy-name-prefix>_MyCapitalizer implements Capitalizer {
      var _root : MyCapitalizer

      construct( root: MyCapitalizer ) {
        _root = root
      }

      override function capitalize( s: String ) : CharSequence {
        return _root.capitalize( s )
      }
    }



Our compiler generates code to dynamically create this proxy code at runtime, compile it on the spot, and cache it.  With a proxy in hand we can use INVOKEINTERFACE to make the structural call, which in turn makes an INVOKEVIRTUAL or INVOKESTATIC call in the proxy depending on whether the method is implemented directly or implemented in an enhancement.  Going back to our Coordinate example, the bytecode looks about like this:

    ...
    INVOKESTATIC gw/.../Compiler.findProxy (Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/Object;
    ...
    INVOKEINTERFACE gw/.../Coordinate.getX ()D

The expensive part, of course, is building the initial proxy, however that's a one time hit.  Normally findProxy is two cache.get() calls and then a new instance of a proxy.  After some rudimentary micro-benchmarks a structural call is ~8x slower than INVOKEINTERFACE.  Not bad, not great, but acceptable for most use-cases.

After much experimentation and consideration we've concluded that declaration-site structural typing is the way to go.  There are no complexity explosions like those we discovered with wrapping collections at the use-site to satisfy the JVM's rigid type assignability rules and INVOKEINTERFACE limitations.  Instead, by erasing the structural type and controlling individual method and property invocations we work _with_ the JVM, not against it.


### Wait, what about INVOKEDYNAMIC?

What we'd really like is a new kind of invoke bytecode instruction similar to INVOKEVIRTUAL, but works dynamically on the caller's type.  The idea being the JVM could handle a structural invocation more efficiently than our comparatively clumsy solution. Naturally I had high hopes for the new INVOKEDYNAMIC instruction and its counterpart, [MethodHandle](http://docs.oracle.com/javase/7/docs/api/java/lang/invoke/MethodHandle.html). Of course this was the way forward for any kind of dynamic call, or so I presumed.  After several hours of research and experimentation it turns out INVOKEDYNAMIC isn't all that dynamic.  It's of little use if the implementing classes of the method are unrelated, which is precisely our use-case.  Without getting into too much detail the fundamental problem for us is that INVOKEDYNAMIC initiates a method call in terms of the caller's class, not the callee's (or receiving) class – a dynamic call-site is designed to refer to a single method handle from the caller's perspective.  Since we don't know all the implementing classes ahead of time, we can't build a useful single method handle to dispatch the call.  Consequently our method handle implementation would be nothing more than a wrapper around a call to the implementation we already have, which is kinda silly.

In retrospect it's not surprising that INVOKEDYNAMIC works the way it does.  As strange as it may sound it wasn't designed to handle a dynamic call through Object on a method directly implemented in a conventionally compiled Java Class.  In fact it wasn't designed for static languages at all, rather it was specifically designed to accommodate dynamically typed languages compiled for the JVM.  Anyway, that's the short story behind why INVOKEDYNAMIC is unsuitable for our structural invocation needs...  Hey Oracle, how about INVOKESTRUCTURAL?

The structure Type
-------------------

We introduce structural typing as a complement to Gosu's existing type system.  We do not intend to compromise in any way Gosu's mainstay of nominal static typing.  Quite the opposite, structural typing exists in Gosu as a means to provide _more_ type information where there would otherwise be less.  Our earlier example illustrates this concept succinctly where we introduce the Coordinate type to statically identify shared structure; Coordinate statically unifies types that are otherwise unrelated.  So although structures are statically weaker than interfaces in terms of the amount of type information they promote, their flexibility allows them to be used in situations where interfaces are ineffective.  In this way structure types extend static typing to include a broader set of use-cases without sacrificing architecture.

### Structures Are Interfaces

That last bit about not sacrificing architecture is important to understand because, unfortunately, with some languages architecture suffers from structural typing because they've made it an all or nothing proposition.  Lets continue with our Coordinate example to illustrate the problem.  Let's say we need to define a new class, Location, and requirements dictate that it satisfy Coordinate.  Thus we have:

    class Location {
     var _x : double as X // X property of Coordinate
     var _y: double as Y  // Y property of Coordinate
    ...
    }

Location is _our_ class, we own it, and we fully intend for it to satisfy Coordinate.  But since Coordinate is a structure we don't implement it directly.  Sigh.  Readability suffers, tooling suffers, as does performance, which flies in the face of our objective to not compromise static typing.   Does it have to be this way?  No, it doesn't and it shouldn't.  We should be able to express Location's intention to implement Coordinate:

    class Location implements Coordinate

This is better, no?  Human beings are more informed as are tools, the parser, the compiler, and runtime.

To facilitate this capability, internally we maintain structure types as interfaces -- they are identical in every way.  Even at the bytecode level a structure is a named interface.  What does this mean to the type system?  First, the parser is in a much better position to determine if Location can be assigned to a Coordinate.  Since Location nominally implements Coordinate there's no guesswork, no performance penalty; nominal typing rocks.  Second, consider a method call on Coordinate from the compiler's perspective.  If a class is permitted to declare that it implements Coordinate as a real live interface, the compiler can emit an extra INSTANCEOF check and make a direct INVOKEINTERFACE call, totally bypassing the structural runtime overhead -- Advance to GO (collect $200).

In effect by granting structures full interface privileges the only penalty for using them in Gosu is the added INSTANCEOF instruction gating a potential INVOKEINTERFACE, which we accept with enthusiasm.  Following our example, the classes, Point, Rectangle, and Component, for which we originally created the Coordinate structure happily integrate structurally, while classes under our ownership are more expressive and better performing as nominal implementors.

I've mentioned the DRY principle a couple times here already and at the expense of violating that principle I'm going to mention it again.  Back to our Coordinate example, what if Coordinate already existed somewhere else in our architecture as an interface, but was not ours to modify.  We still want Point, Rectangle, and Component to be Coordinates, but because it's an interface they can't be.  We could define a new structure and copy/paste the body of the Coordinate interface, but then we'd have two systems of record for a single interface... and one fat DRY demerit.  It would be better if we could nominally define our structure in terms of the Coordinate interface:

    structure CoordinateStruct extends Coordinate {
    }

This way we don't risk having two separate definitions of what we intend to be the same data structure.  Most importantly, we can still define our Comparator using CoordinateStruct and have it work with all the same classes, including implementors of Coordinate not under our control.  This is because Coordinate is structurally assignable to CoordinateStruct, so long as CoordinateStruct doesn't add any new methods or properties.  The cherry on top: our compiler can recognize this relationship and generate an instanceof check on Coordinate, not CoordinateStruct, so that performance is maintained with indirect implementors -- we call them via INVOKEINTERFACE.

Avoiding DRY demerits further, a structure can also extend other structures as well as other interfaces.  So, although a structure essentially represents a flat nameless collection of methods and properties, it is free to express its declaration nominally as a composition of other types.  The reverse is also possible.  We've demonstrated that a class can nominally implement a structure, so if you surmised an interface can extend a structure, you'd be right.  Nominal yin meets structural yang and all that.

### Assignability

With all of the crossbreeding going on between structural and nominal types we've got some 'splaining to do regarding type assignability.  First let's cover the general rules by which Gosu tests for structural assignability.  Essentially a type is assignable to a structure if it provides compatible versions of all the methods and properties declared in the structure. The use of the term "compatible" here instead of "identical" is deliberate.  The looser term concerns the notion that a structure method is variant with respect to the types in it's signature.  Specifically its parameter types are contravariant and its return type is covariant.  Let's revisit the Capitalizer example:

    structure Capitalizer {
      function capitalize( s: String ) : CharSequence
    }

    class MyCapitalizer {
     function capitalize( s: CharSequence ) : String {
        return s.toString().toUpperCase()
      }
    }

At first glance one might conclude MyCapitaizer does not satisfy Capitalizer's structure.  After careful inspection, however, we discover the two methods are _call-compatible_ from Capitalizer's perspective:

    var cap: Capitalizer = new MyCapitalizer()
    var res = cap.capitalize( "gosu" )

Indeed we can call MyCapitalizer's method with Capitalizer's String parameter because MyCapitalizer's CharSequence parameter is assignable _from_ String -- _contravariant_ parameter types support call-compatibility.  Similarly we can accept MyCapitaizer's String return type because it is assignable _to_ Capitalizer's CharSequence return type -- _covariant_ return types support call-compatibility.  Therefore, even though their method signatures aren't identical, MyCapitalizer is _structurally assignable_ to Capitalizer because it can be safely used in terms of Capitalizer's features.

Note the application of signature variance on structural assignability also extends to primitive types.  You may have spotted this in the AWT Component class referenced earlier in our Coordinate example where Component's X property returns an int, not a double as declared in Coordinate's X property.  Because an int can coerce to a double with no loss of precision the property is call-compatible.  As a result signature variance on structure methods holds for primitive types as well as reference types.

With variance squared away we can define structural assignability rules as follows.

Given type T and structure S, method foo() in T is structurally assignable to method foo() in S if:

* the number of parameters in both methods is the same
* the parameter types of `T#foo()` are assignable _from_ the parameter types of `S#foo()`
* the return type of `T#foo()` is assignable _to_ the return type of `S#foo()`

OK, we've established assignability _to_ a structure, but what about _from_ a structure?  Simply stated, a structure is assignable to itself, possibly other structures, and Object, no more no less.  But what if a structure extends an interface, what then?

    structure RunnableIsh extends Runnable {}

    class Runner {
      function run() {
      }
    }

    var runnableIsh: RunnableIsh = new Runner()
    var runnable: Runnable = runnableIsh // Illegal, runnableIsh is a structure

Remember structural assignability is purely structural.  The RunnableIsh structure, although it extends Runnable, doesn't really have Runnable in its hierarchy, it's merely composing itself with Runnable's features.  The Runner class illustrates the relationship, it doesn't implement Runnable yet it's assignable to RunnableIsh.  Runner isn't assignable to Runnable, therefore RunnableIsh is not assignable to Runnable.

### Enhancements on Structures

Back to our Coordinate example, let's say we'd like to sort the AWT [Insets](http://docs.oracle.com/javase/7/docs/api/java/awt/Insets.html) class with our Comparator.  Looking at the class, however, we find it doesn't satisfy Coordinate:

    public class Insets {
      public int top;
      public int left;
      public int bottom;
      public int right;
    }

We'd like the left and top fields to correspond with Coordinate's X and Y.  We can accomplish that with the help of an enhancement:

    enhancement InsetsEnh : java.awt.Insets {
      property get X(): double {
        return this.left
      }
      property get Y(): double {
        return this.top
      }
    }

Voila!  java.awt.Insets is now a Coordinate:

    var coord: Coordinate = new Insets( 10, 1, 0, 11 )
    print( coord.X )

Enhancements combined with structures provide the ultimate architectural glue to connect and unify disparate systems.  This capability provides an option for us to abstract and unify concrete classes without having to create interface wrappers and factories.  This level of flexibility is normally reserved for dynamic languages via meta-programming, but only at runtime – parsers, tooling, and humans are none the wiser.  So it's refreshing to see it in action inside Gosu where we can fully leverage it at code-time.

Use-Site Revisited
------------------

Hopefully we're at a point now where structure types as they're presented here seem like a compelling idea.  But our declaration-site-based implementation isn't quite complete.  If you recall, the primary benefit of the use-site approach is that there's no premeditation involved – you simply use interfaces and don't concern yourself with structural types.  As we discovered there's no free lunch with this technique, all the heavy lifting is foisted on the use-site.  And because object identity lost in the process we're faced with insurmountable problems dealing with collections and so forth.  But what if we still need to make a structural call involving an interface over which we have no control?  This scenario is still quite real.  What if, for instance, we need to call into a 3rd party library like so:

    // Your code
    var notMine = new NotMyClass()
    notMyMethod( notMine ) // thanks for playing

    // 3rd-party code
    interface NotMyInterface {
     function doSomething( s: String )
    }
    ...
    class NotMyClass {
     function doSomething( s: String ) {
     }
    }

    ...
    function notMyMethod( value: NotMyInterface ) ...

No amount of our proposed structural typing will help us call notMyMethod() with NotMyClass.  Remember Gosu's approach works because it handles structural typing at the declaration site where it erases structure type references to Object.  But in this case since NotMyInterface is declared as an interface and notMyMethod() is not ours to modify, we're stuck with having to satisfy the parameter type nominally.  We saw before that use-site structural typing handles this via proxies. Although our proposed structural typing is accomplished at the declaration site, that doesn't mean we can't also provide a separate solution for this basic use-case.

In this example, use-site structural typing isn't so bad.  No collections or arrays involved.  The only real issue is the "magic" involved with the proxy getting created with no indication to the reader or writer of the code that the notMine argument is losing its identity in the process.  What we would prefer is some way for this call to work, yet require the code to be more explicit about what is going on.  For instance, a library that handles the proxying for us would do the job:

    class ProxyFactory {
      function proxy<T>( o: Object, iface: Type<T> ): T {
        ...
      }
    }

With this utility we can change our call to look like this:

    notMyMethod( ProxyFactory.proxy( notMine, NotMyInterface ) )

It gets the job done and it's explicit – there's definitely something going on there!  But it is a bit wordy.  We can do a little better:

    enhancement ObjectProxyFactoryEnhancement : Object {
      function $proxy<T>( iface: Type<T> ): T {
        ...
      }
    }

Now we have:

    notMyMethod( notMine.$proxy( NotMyInterface ) )

That's better, a bit easier on the eye and less obscure than a one-off library.  Now we have a simple way to handle basic use-site structural typing without compromising the type system's integrity and without sacrificing performance.  More importantly, it's explicit nature makes it clear to readers of the code that object identity is lost during this call.

Conclusion
----------

Arguably the primary goal of static typing is to help _programmers_ in their day to day work.  If it gets in the way more than not or results in more confusion than insight, it's not serving it's purpose, regardless of how "sound" it may be. That has always been the attitude of the Gosu team and is the fundamental motivation for our consideration to include structural typing as a first-class language feature.

As we've discussed there are real-world problems we can't adequately solve using an exclusively nominal type system.  Rather than continue to force programmers to write "clever" code to work or generate their way around these problems, we prefer to enable them with proper language-level tools. We've demonstrated several use-cases where structural typing not only relieves the pressure to write hacky code, but also promotes cleaner and more maintainable architecture.  But it's critical that we implement structural typing in a way that integrates well with Gosu and befits the JVM for most use-cases.  We explored the pros and cons of the two basic strategies, use-site and declaration-site, and are confident our declaration-site approach is the more suitable choice.

The new structure type we present solves most of the problems facing our current nominal type system.  With it our parser and compiler coordinate with the JVM to provide a balanced, reasonably performing solution.  And in cases where Gosu can leverage its nominative roots there is only a marginal difference in speed compared with a straight interface invocation.  Combining the two static models helps to achieve the performance we need.

The synergy resulting from our integration of nominal and structural typing goes beyond performance gains, however.  For instance, we showed how structures express composition using Gosu's existing nominal hierarchical constructs and how internally we implement structures as interfaces.  We also demonstrated how, combining structures and enhancements, we can unify otherwise disparate classes with a single structural API, a unique and powerful aspect of our solution.

Finally we consider an additional, library-level change to more cleanly bridge our code with existing code out of reach of structure types. With a simple enhancement we enable our code to explicitly, yet cleanly, integrate structurally with untouchable code.

On the whole after a good deal of exploration and experimentation we're content with integrating structural typing as we've described it. It straightforwardly compensates for deficiencies in our current exclusively nominal type system without compromising its integrity. Further, the synergy resulting from the integration of the two static models provides something much more than the addition of structural typing alone; the entire type system benefits from the additional capability.  Still the success of this feature will be measured by the productivity gained by programmers using the language.  We're cautiously optimistic the ideas presented here will not disappoint.
