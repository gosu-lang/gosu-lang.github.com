---
layout: post
title: New JSON Support in Gosu
authors:
- Scott McKinney
---

Within the last few years [JSON](https://en.wikipedia.org/wiki/JSON) has become the [wire protocol of choice](http://www.google.com/trends/explore?q=xml+api#q=xml%20api%2C%20json%20api&cmpt=q&tz=Etc%2FGMT%2B8) and, more generally, the preferred structured data format over XML.  For instance, most REST web service APIs speak JSON as the lingua franca between web servers and clients.  Thus, as an API producer/consumer Gosu is motivated to provide top-notch JSON support.  Here I'll cover some exciting new JSON features in the up coming Gosu release.  Hint: We made JSON statically typed.  Shhhhhh.

JSON is as JavaScript Does
--------------------------

There is no standard schema for JSON, I'll talk about that more in a bit.  Regardless, JSON itself is simple.  It's basically a binding of name/value pairs where a value is either a simple type, like a string or a number, or another binding of name/value pairs, or a List of values.  Because JSON itself *is* JavaScript it is completely void of type information, thus JSON is not type-safe and is consumed dynamically.

Gosu already supports dynamic typing with objects such as JSON via its builtin Dynamic [Expando]({{ site.url }}/2014/07/10/dynamic-language-features-in-gosu.html) type.  But currently Gosu does not parse JSON to produce such an object.  To remedy this Gosu now directly consumes JSON as a Dynamic type via this new core Gosu API:

    gw.lang.reflect.json.Json#fromJson( String json ) : javax.script.Bindings

As the signature of the method suggests, you pass in a JSON string and receive standard script [Bindings](https://docs.oracle.com/javase/8/docs/api/javax/script/Bindings.html) in return.  Bindings is basically a map mirroring the tree structure of the JSON object.  Internally Gosu supports any Bindings instance as a Dynamic Expando object. Essentially this means you can directly cast any Bindings instance to Dynamic and treat it as an Expando.

The following JSON example illustrates this:

Sample Person JSON:

    {
      "Name": "Dickson Yamada",
      "Age": 39,
      "Address": {
        "Number": 9604,
        "Street": "Donald Court",
        "City": "Golden Shores",
        "State": "FL"
      },
      "Hobby": [
        {
          "Category": "Sport",
          "Name": "Baseball"
        },
        {
          "Category": "Recreation",
          "Name": "Hiking"
        }
      ]
    }

And the dynamic Gosu code to access it:

    var personUrl = new URL( "http://gosu-lang.github.io/data/person.json" )
    var person: Dynamic = personUrl.JsonContent
    print( person.Name )

Notice the new JsonContent property on URL:

    personUrl.JsonContent

This is a convenient enhancement property Gosu provides for Java's URL class.  It does all the work to get the JSON text and calls the new Json#fromJson() method for you.  It also declares the Dynamic type for you as its return type, so the declared Dynamic type on the person var is unnecessary; it's there to clearly demonstrate that the person var is indeed Dynamic.

As you can see we can access the Name property from the JSON object from the person var.  This is all well and good, but falls short of our desired level of JSON support. Gosu being a static language, we really want that Name reference to be statically verified as well as code-completed in the IDE.

Structural Typing Magic
-----------------------

At compile-time a JSON object is basically a Map.  Worse, it represents an *instance* of a make-believe type; there's no type information to go along with it. So the best we can do is find a really good sample JSON object and do our best to infer a type -- "Type by Example", if you will.  This is more or less what people are doing in their minds when they use JSON from JavaScript.  As such if Gosu wants static JSON, it needs to infer the type (and all nested types) and generate it so it can be used in place of Dynamic.

At first this sounds maybe too hard.  What kind of type are we talking about here?  How will the JSON object map to this type?  How will we handle the nesting of types implied by the object?  And how will the Binding be represented?  Will we have to resort to anonymous types e.g., Tuples?  Will the JSON object lose object identity i.e., will there be proxying or transformation?  As you can probably surmise, initially I was pessimistic about doing static JSON.

Then it dawned on me.  We have a ready-made solution to this problem, namely [Structural Typing]({{ site.url }}/2014/04/22/structural-types-in-gosu.html).  But before I get into that, let's ponder some of the worrisome questions.  A main concern is the nesting of types inherent in JSON.  Going back to our JSON sample we have Person as the top-level type, with nested Address and Hobby types.  Note these type names reflect the name of the field that references them; this is not ideal, but it's all we have.  The problem is mainly one of name/namespace conflict.  Imagine a more complex Person where another field deeply nested in it is also named "Address", but with different fields than the one in the example:

    {
    ...
      "Address": {
        "Number": 9604,
        "Street": "Donald Court",
        "City": "Golden Shores",
        "State": "FL"
      },
      "FishingHole": {
        "Name": "Snook Spot",
        "Address": {
          "Longitude": 9.96233,
          "Latitude": 49.80404
        }
      }
    }

This implies there are two separate types for Address, thus their names must be unique.  This makes life difficult if we want the types to be all top-level types, especially if we plan to share namespaces.  Suffice it to say, our best option is to preserve the nesting of types inherent in JSON. For instance, the first Address is an inner type of Person.

As an alternative, we could invent anonymous types to handle JSON. The main problem, though, with anonymous types is... they're anonymous!  They are impractical in function signatures or as properties or fields etc.  DOA, anonymous types are as a solution to static JSON.

Another concern is object identity.  Basically we don't want to lose the Binding instance we are trying to make statically typed.  This is hard.  Because if we make a static type, be it via proxied interfaces or classes using builders or what have you, just about any static type involves wrapping or transforming the original Binding instance and losing the Binding object identity in the process.

What's the big deal with object identity?  Well in the proxied interface case, any instanceof checks on the object won't work.  For example, you can't cast the proxy to a Binding and use it as a binding.  Your original JSON object is swallowed up inside the proxy.  Maybe this isn't such a big deal, but in my own experience proxies such as these invariably suffer from losing object identity.

Similar issues exist for builder/class solutions.  Basically the problem boils down to nominal typing -- the JSON Binding instance can't satisfy your generated interface or class nominally, so you have to wrap or otherwise transform the original object.

This is where structural typing steps in; it's the ideal solution to the problem.  With a small change Gosu structural typing can directly support Bindings as satisfying a structure type.  Since structure types are a special kind of interface, we can nest them to any level we need, thus satisfying our unique naming problem.  In addition, since Gosu structure types maintain object identity, we solve that problem too.  Effectively, we can *directly* expose an untyped Map of things (javax.script.Bindings is basically a Map) as a *statically typed* nesting of structures.  This is magic.

Details
-------

Here's how we make the previous example work statically:

    print( person.toStructure( "Person", false ) )

Gosu enhances Bindings with the method, `toStructure( name: String, mutable: boolean )`.  Note the resulting structure is optionally mutable via the mutable argument. This method generates the complete nesting of types plus convenient factory methods:

    structure Person {
      static function fromJson( jsonText: String ): Person {
        return gw.lang.reflect.json.Json.fromJson( jsonText ) as Person
      }
      static function fromJsonUrl( url: String ): Person {
        return new java.net.URL( url ).JsonContent
      }
      static function fromJsonUrl( url: java.net.URL ): Person {
        return url.JsonContent
      }
      static function fromJsonFile( file: java.io.File ) : Person {
        return fromJsonUrl( file.toURI().toURL() )
      }
      property get Address(): Address
      property get Hobby(): List<Hobby>
      property get Age(): Integer
      property get Name(): String
      structure Address {
        property get Number(): Integer
        property get State(): String
        property get Street(): String
        property get City(): String
      }
      structure Hobby {
        property get Category(): String
        property get Name(): String
      }
    }

As you can see, the Person structure reflects the JSON object's implied type nesting.  You can do whatever you like with this type.  You can embed it as an inner structure in an existing class or make a top-level type.  In any case all the types in the JSON object are uniquely preserved in one structure.  Use it like this:

    var person = Person.fromJsonUrl( personUrl )
    print( person.Name )
    print( person.Address.City )
    print( person.Hobby[0].Name )

All statically verified and fully code completion friendly!

Naming Issues
-------------

One troubling aspect of JSON is that the field names are not restricted in any way; they can have spaces or be reserved keywords or... anything.  As far as I know, this is legal JSON:

    {
      "Space Available": "8",
      "new": "true",
      "class": 1984
    }

These names can't be used as identifiers in Gosu, or in JavaScript for that matter.

    jsonObj.new // 'new' is a reserved keyword in both Gosu and JavaScript

Illegal names are not uncommon in JSON, and even with "clean" JSON, it may not be clean for all languages.  For instance, Gosu's reserved keywords are different from JavaScript's.  There's no guarantee field names won't conflict with Gosu.

To handle this Gosu generates alternative names.  It substitutes '_' for illegal characters and flips the initial upper/lower case of reserved keywords.  Gosu preserves the original names, however, via the new ActualName annotation.  The structure generated for the preceding example looks like this:

    structure Correct {
    ...
      @gw.lang.reflect.ActualName( "new" )
      property get New(): String
      @gw.lang.reflect.ActualName( "class" )
      property get Class(): Integer
      @gw.lang.reflect.ActualName( "Space Available" )
      property get Space_Available(): String
    }

Basically, Gosu compiles a structural type call site involving Bindings using the corresponding name from the ActualName annotation, if one exists.  This way we can use legal alternative names in our code, yet maintain the original name bindings internally.

Other Features
--------------

But wait, there's more!  Several other supporting features are included to complete Gosu's JSON support.  For example, Gosu supports tight JSON-like syntax directly in its grammar.  Here is Gosu code for the Person JSON:

    var person: Dynamic = new() {
      :Name = "Dickson Yamada",
      :Age = 39,
      :Address = new() {
        :Number = 9604,
        :Street = "Donald Court",
        :City = "Golden Shores",
        :State = "FL"
      },
      :Hobby = {
        new() {
          :Category = "Sport",
          :Name = "Baseball"
        },
        new() {
          :Category = "Recreation",
          :Name = "Hiking"
        }
      }
    }


    print( person.Name )

We leverage Gosu's object initializer syntax and type inference to produce a superset of JSON-like syntax.  The underlying object is a Dynamic Expando instance.  Since Expando implements javax.script.Bindings we get convenient transformation enhancement methods that let us easily convert from Gosu to JSON:

    print( person.toJson() ) // toJson() generates the Expando bindings to a JSON string

Likewise, we can convert any Bindings instance to Gosu and XML:

    print( person.toGosu() ) // toGosu() generates any Bindings instance to a Gosu Expando initializer string
    print( person.toXml() ) // toXml() generates any Bindings instance to standard XML

And similar to JavaScript, you can directly evaluate a Gosu Expando initializer string:

    var clone = eval( person.toGosu() )

Lastly, a fun code snippet:

    uses javax.script.SimpleBindings

    structure Foo {
      function hello() : String
      property get Hi() : String
    }

    var bindings = new SimpleBindings()
    bindings.put( "hello", \-> "Hey, there!" )
    bindings.put( "Hi", "Howdy!" )

    // Treat a Bindings map *directly* as a static Foo
    var foo: Foo = bindings as Dynamic
    print( foo.hello() ) // static reference, code-completed
    print( foo.Hi ) // static reference, code-completed

This code demonstrates the flexibility of structural typing in Gosu as it relates to dynamic bindings.  Pretty nice when you have to deal with dynamic data, but prefer to use static types in your code and APIs.

Conclusion
----------

Today JSON is the structured data format of choice and Gosu now supports it directly both dynamically as Expando/Bindings objects and statically as structures.  With these new features you can produce and consume JSON naturally within Gosu.  Convenient enhancements and utilities give you straightforward access to REST web services, text files, and other data sources involving JSON.  And with simple method calls you can easily transform between Gosu, JSON, and XML data.  Altogether you should be well equipped for your next Gosu project involving JSON.  As always let us know what you think!

