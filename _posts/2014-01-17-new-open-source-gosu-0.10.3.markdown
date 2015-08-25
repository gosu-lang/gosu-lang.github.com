---
layout: post
title: New Open Source Gosu 0.10.3
authors:
- Gosu Team
---

The Gosu team is happy to announce  the official release of Gosu 0.10.3 and Gosu Plugin 3.3 for IntelliJ 12.
IntelliJ 13 support is not complete yet but we wanted to make a new release to have early feedback on the new rich features of the language.
In the next release we will improve those features based on your comments and provide proper documentation

New Gosu features
-----------------

Changes to the language in this release:

* Support for dynamic typing in a similar fashion to C#.
  For those rare circumstances dynamic typing may be more desirable than static typing, Gosu allows you to use the Dynamic type.
  In essence a variable of Dynamic type can be assigned to/from any other variable. The type checking will be deferred from compile time to run time.
  This feature is mainly useful where you need that extra flexibility in order to easily integrate with other code.
  For more information about its usage and design decisions please refer to the a future blog post.
  
        uses dynamic.Dynamic

        var a : Dynamic = "Hello world"
        print(a) // it prints Hello world
        a = 123
        var b : int = a
        print(b) // it prints 123

* Support for structural typing, similar Go's interfaces.
  Gosu is a statically typed language employing a Nominal type system, which generally means type assignability is based on declared type names.  For instance, in Gosu a type is assignable to interface, Foo, only if it declares Foo in its hierarchy.  Another form of static typing, called Structural Typing, determines assignability based on declared type features.  Roughly a type is structurally assignable to Foo if compatible versions of all Foo's methods and properties exist in the type -- the type doesn't have to formally declare that it implements Foo. 
  The extra flexibility to use a type based on its capability, not its name, it's especially useful when dealing with third party libraries.
  The type checking is performed at compile time and this features enables a form of "static duck typing".
  For more information about its usage and design decisions please refer to the a future blog post.
  
        structure Quacker{
          function quack();
        }

        class Duck {
          function quack() { print("Quack!") }
        }

        class Dog {
          function quack() { print("Qu..Woof!") }
        }

        var animal : Quacker = new Duck()
        animal.quack()  // it prints Quack!
        animal = new Dog()
        animal.quack()  // it prints Qu..Woof!

* The logical compound assignment operators: &&= and ||=.
  They work with boolean types (boolean and Boolean).
  
        var b = false
        b &&= true // same as b = b && true and it evaluates to false
    
* Nested comments: it's now possible to write a comment inside  another comment. It is manly useful when you comment out a block of code that includes comments. 
 
        /*
            // if x is true
            if(x) {
              print("Hello!") /* print */
            } else {
              /* x is not true
                 let's print world
               */
              print("world")
            }
        */

The plugin is available from the JetBrains repository, which is directly accessible from your IntelliJ 12 plugins setup dialog. Select "Gosu", right click and install (see [this](http://gosu-lang.github.io/downloads.html) page more detailed instructions). 
