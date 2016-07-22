---
layout: post
title: Introducing Gosu Binding Expressions
authors:
- Scott McKinney
---

> **Note:**
>
> New language features take time to find their way into the Gosu IntelliJ plugin. To address this the Gosu team has an editor of their own for this kind of work aptly named, Gosu Lab. Please use this editor when experimenting with new Gosu features or if you just want a lighter weight editor. After you clone the repo you can load the Gosu project in Intellij then run the Gosu Lab editor from a new IJ configuration like this:
>
> ![benchmark]({{ site.url }}/data/labconfig.png)
>
> You only need to run the editor.RunMe class.
> We'll write more about Gosu Lab in a separate post.


Gosu has long supported the concept of dimensions via `gw.lang.IDimension`.  A dimension can be physical like Length, Time, Weight, etc.  A dimension can also be abstract or intangible such as Money or Memory.  Basically a dimension represents something that can be measured in specific units, like: 9 ft, 150 mph, 9.8 m/s/s, 49.99 USD, etc.

Because we reference dimensions as measurable quantities, they can also participate directly as operands in arithmetic expressions.  For instance, you can add, subtract, and divide dimensions directly.  Further, a dimension can provide custom implementations of arithmetic operators (+ - * / %) for any operand type.  A `Velocity` dimension, for example, can define a `multiply()` method with a `Time` dimension resulting in a `Length` dimension:
    
    function multiply( t: Time ) : Length

Gosu uses structural typing to verify `Velocity` and `Time` can be operands in a multiplication expression:

    var velocity = new Velocity( 50, VelocityUnit.get( Mile, Hour ) )
    var time = new Time( 3, Hour )
    var distance = velocity * time   // a Length of 150 miles

As you can see using dimensions you can specify units and perform arithmetic directly.  (Note the classes used in these example come from new libraries I'll talk about later)

But wouldn't it be cool if Gosu let you condense all of this and express quantities concisely as you'd normally write them:

    var distance = 50 mph * 3 hr   // a Length of 150 miles

This is exactly what the new _Binding Expressions_ language feature accomplishes, and quite a bit more.  Here I'll introduce Binding Expressions and some supporting features along the way.

Basic Mechanics
---------------

Normally with most programming languages expressions are connected together with operators like dot or * or method names or what have you. A _binding expression_, however, consists of two adjacent expressions where the type of one expression supports a binding relationship with the type of the other expression. The expression type providing the binding relationship is called a binder type; it implements `IPostfixBinder#postfixBind()` and/or `IPrefixBinder#prefixBind()`. The return types of these methods determines the type of the resulting binding expression. As such the result of evaluating a binding expression is the result of either method call.

In the previous example we have an expression of Time representing 3 hours:

    class TimeUnit ... {  
      function postfixBind( amount: Number ) : Time {
        return new Time( amount, this )
      }
    }

This method tells the parser that an expression with type, `TimeUnit`, following an expression of type, `Number`, combines with that expression to form a single expression of type, Time.  In our example, the hr identifier is defined elsewhere as an alias for `TimeUnit.HOUR`, thus the expression is a valid binding expression of type, `Time`.  Note there is nothing special about `TimeUnit` other than its `postfixBind()` method; any type can be a binder type.

Unit Grouping
-------------

In addition binding expressions support unit grouping involving unit products or quotients such as `miles/hour`, where the type of one of the operands is a type implementing `multiply()` or `divide()` on the other operand's type. So together with Dimensions we can write expressions like these:

    55 mi/hr
      
    9.8 m/s/s 
      
    9 kg*m/s/s

Note the binding expression grammar gives precedence to unit grouping expressions.  This way the components of a unit expression parse separate from the corresponding quantity expression.  In addition, this allows a unit type to also be a binder type to allow the absence of an operator behave as a multiplication operator, which facilitates standard SI unit expression formatting such as this one:

    9 kg m/s/s
    
Notice there is no multiplication operator between `kg` and `m/s/s`.  This works because the `AccelerationUnit` type corresponding with the `m/s/s` expression defines a `postfixBind()` method on `MassUnit` and returns a `ForceUnit`.  And `ForceUnit`, like all other unit types, binds with `Number` via `postfixBind()` to produce a measure, in this case the `Force` dimension.

Bidirectional Flexibility
-------------------------

Because Binders can work in either direction Gosu supports powerful and concise expressions like these date expressions:

    var monthDay = May 18
     
    var yearMonth = 2016 May
     
    var localDate = 2016 May 18

Notice the 'May 18' expression.  This is different from the previous examples because it is a _prefix_ expression -- `May` is an instance of the `Month` type, which implements **prefixBind()** on `Integer`.  Basically `prefixBind()` lets you put units on the _left-hand_ side of a quantity, in addition to the right-hand via `postfixBind()`.  As such binder expressions behave _bidirectionally_, which means they can be both left and right-associative, depending on the Binder implementation.  In the case of the `Month` type, it implements both `prefixBind()` and `postfixBind()` on `Number` to produce `MonthDay` and `YearMonth` expressions, respectively.

In addition the binder expression grammar is context sensitive with respect to expression types.  So for a given complex binder expression consisting of nested binder expressions, the parser recursively parses and backtracks until it successfully parses the entire expression or exhausts all possibilities and results in a parse error.  In the case of the `2016 May 18` expression, since bind expressions favor right-associativity we first parse `May 18`, then because the `MonthDay` type implements `postfixBind()` on `Number`, we parse `2016` and combine it with `May 18` to form a `LocalDate`.

This next example demonstrates how context sensitivity can result in a left-associative binding expression, if that's the only way it can parse:

    var fiftyMillionBucks = 50M USD

The `M` has postfix binder type, `MetricScaleUnit`, on `Number` returning a scaled number.  In this case, since `M` is short for Mega or Million, the binding expression `50M` evaluates to 50,000,000.  Similarly, `USD` has postfix binder type, `java.util.Currency`, on `Number` returning `Money`.  Thus, the whole expression `50M USD` evaluates left-to-right to an instance of `Money` with value 50,000,000 USD currency.

Note there is no ambiguity possible with a given nesting of binding expressions i.e., the binding expression grammar is deterministic.  By the same token a large, deeply nested binding expression could result in a combinatoric explosion of complexity.  This won't happen under normal circumstances, however, given well designed, narrowly targeted binder types.  Therefore, _add new binder types judiciously!_

Binder Separators
-----------------

Many SI formats such as those for dates and times use separator characters for improved readability.  For instance, date components are separated by dashes and time components are separated by colons:

    2:35 PM
    2016-May-22
    2016-May-22 2:35:53:909 PM PST

For this reason binder types have the option to declare separator characters as part of their expression grammar.  The `@BinderSeparators` annotation makes this possible. For example, the `Month` type declares the dash as an acceptable separator between the month and day:

    @BinderSeparators( :accepted = {"-"})
    function prefixBind( day: Integer ) : MonthDay {
      return MonthDay.of( this, day )
    }

Likewise, a dash is declared as an acceptable character between month and year.  Note `accepted` means it's optional – a blank space is still ok.  However, if a separator character is required, use the `required` parameter of the BinderSeparators annotation.  For example, the `HourAmPm` class declares the colon as a required separator between Hour and Minute:

    @BinderSeparators( :required = {":"} )
    function postfixBind( comp: Integer ) : HourMinuteAmPm {
      return new( _amPm, comp, _hour )
    }

With separator characters specified we can express dates and times more clearly and conform to SI formats:

    var date1 = 2016-May-19 12:35:03:789 Z
    var date2 = 2016-May-19 2:35 PM Z
    var date3 = 2016-May-19 2:35:53 PM PST

Note the resulting types of all date/time binding expressions are all standard `java.time` classes, such as `LocalDateTime`, `MonthDay`, etc.  We also provide binder types for standard Japanese Era formats:

    var jdate = Heisei 28-May-18

Note binder separators are currently limited to the following characters:

    ":", "-", "/", "|", "\\", "#"

Enhancements
------------

As you may have surmised the previous examples utilize enhancements to make binder types from existing types such as `java.time.MonthDay`, `java.time.LocalDateTime`, etc.  Enhancements make all this happen with existing types such as those in `java.time` and others.  For example, Gosu provides enhancements on `java.time.Month` to facilitate date/time binder types:

    enhancement CoreMonthEnhancement : Month
    {
      @BinderSeparators( :accepted = {"-"} )
      function prefixBind( day: Integer ) : MonthDay {
        return MonthDay.of( this, day )
      }   
      
      @BinderSeparators( :accepted = {"-"} )
      function postfixBind( year: Integer ) : YearMonth {
        return YearMonth.of( year, this )
      }
      
      @BinderSeparators( :accepted = {"-"} )
      function postfixBind( jer: JapaneseEraYear ) : JapaneseEraYearMonth {
        return new JapaneseEraYearMonth( jer, this )
      }
    }

Enhancements provide the glue necessary to enable existing Java library classes as binder types.

New Libraries
-------------

As most of the examples illustrate so far binding expressions are especially useful for expressing concise, type-safe quantities.  All of the types used so far reside in new utility libraries.  Although these libraries are useful in their own right, they are designed to work seamlessly with binding expressions.  The libraries are divided into three separate packages:

* gw.util.money
* gw.util.science
* gw.util.time

I'll cover each of these in greater detail in separate posts. Here I'll provide a quick summary of each them and how they are intended to be used.

### Money

Many software applications today need some common foundation for money and currency.  Java provides a decent abstraction for currency via `java.util.Currency`. But, surprisingly, Java's core libraries don't provide any support for money or amounts of money.  Gosu's money library attempts to fill the void with its `gw.util.money.Money` class and supporting classes.  Basically, Money makes it easy for you to work with amounts of money in any currency.  You can easily perform arithmetic on `Money` amounts using normal arithmetic expressions.  In addition you can easily mix currencies in single amounts of `Money`:

    var investment = 5000 EUR + 10000 USD

### Science

It's not meant to be comprehensive – it ain't Mathematica – but the science library is fun to play with and it may even help you model physical attributes of your application a little better.  Generally, the science library is composed of a bunch of physical dimensions like `Length`, `Time`, `Mass`, and even something called, `MagneticFluxDensity`.  As you probably guessed each of these classes implements Gosu's `IDimension` interface, which among other things allows them to work in normal arithmetic expressions like this:

    var area = 360 ft * 160 ft

Most classical physics dimensions and formulas are supported; you can straightforwardly calculate any type of physical measurement:

    var work = 5kg * 9.8 m/s/s * 10m
    print( work )  // prints 490 J

Here we enter different values to compute work.  We can do this in any number of ways and with any units we choose:

    var work = 49 kg m/s/s * 10m         // 490 Joules
    var work = 49 lb ft/hr/min * 10 km   // 490 lb ft/hr/min km (wut?)
    print( work.to( J ) )                // 0.3136336684444444444444444444444444 J

There's a ton more to cover in the science lib.  I'll save that for another post.

### Time

Java finally got it pretty much correct in Java 8 with its latest crack at time via the `java.time` package of classes.  Gosu's `gw.util.time` package takes it a bit further by making it easier to express standard Java dates and times as binding expressions:

    var date1 = 1966 May 5
    var time1 = 1 day - 1 s
    var date2 = 1966 May 5 time1
    var time2 = 2:35:53:555 PM
    var date3 = 1966-May-5 2:35:53:909 PM Z
    var date4 = 1966-May-5 2:35:53:909 PM PST
    var date5 = 1966-May-5 12:35:03:789 Z
    var date6 = 1966-May-5 0235     
    var date7 = 1966 May 5 (2hr+35min) AM
    var jdate = Heisei 27-May-19

Note all of the resulting values are properly typed as standard `java.time` classes such as `LocalDate`, `LocalDateTime`, etc.

Static Imports
--------------

While designing binder expressions it became clear Gosu could no longer avoid static imports.  In my view static imports is a feature that tends to be more abused than not.  Even so, if there ever were a poster child for the feature, binding expressions would be it.  For example, the science library defines a lot of unit types each having a bunch of local constants for unique units.  The constants in the unit classes aren't readily usable; their names are too long to use as binding expression names.  We could make an interface and define variables to alias the constants and then "implement" the interface wherever we need the constants, but this is a terrible anti-pattern; precisely what static imports is meant to address.  So instead of misusing inheritance to access the static features of the interface we should statically import from it.  

Gosu follows Java's basic syntax, but goes a little further in that you can import specific features (methods, properties and fields).  And because static imports is fundamentally about importing features, for consistency Gosu utilizes its existing Feature Literal syntax:

    uses gw.util.money.IMoneyConstants#*   // imports all static features from IMoneyConstants
    uses org.junit.Assert#assertEquals(String, Object, Object)  // imports a specific method from junit's 

This syntax makes a bit more sense and doesn't require the clumsy `static` keyword as with Java's syntax.  It's also more flexible because it lets you import only the features you want.

Note most of the examples in this post use static imports for units.  These include:

    // Timezones, AM/PM, months, and Japanese eras
    uses gw.util.time.TimeConstants#*
     
    // Common science units
    uses gw.util.science.UnitConstants#*
     
    // Currency constants and utilities
    uses gw.util.money.IMoneyConstants#*
     
    // Byte-related units: KB, MB, GB, etc.
    uses gw.util.science.InformationCapacityUnit#*
     
    // Metric scale units: k, M, G, etc.
    uses gw.util.science.MetricScaleUnit#*
            
    // Angle constants: North, SE, NNE, etc.
    uses gw.util.science.AngleConstants#*

Rational Numbers
----------------

BigDecimals got under my skin while developing the science and money libraries.  The main problem was writing tests and having to deal with errors in scale mostly resulting from mishandling repeating decimals that invariably worked their way into the math.  BigDecimals are great until you run into this problem.  Basically BigDecimal can't preserve a repeating decimal value like 1/3, so you have to round it, which means you have scale issues to deal with, which means you can unintentionally propagate rounding errors and produce bad data.  For instance, the value 0.000000000000000000001427 is probably zero, probably, but it's not going to pass the zero check in your code... unless you scale the value correctly.

Anyway, what I really want is for my number type to preserve whatever value I put in it.  If I divide some value by 3, I want the resulting rational value preserved exactly.  I don't want to think about scale until I need to convert the value to a decimal.  So essentially what I want is a Rational number -- a numerator and denominator as one logical number and only deal with decimals when necessary. 

Enter `gw.util.Rational`.  It has infinite scale and doesn't suffer from BigDecimal's repeating decimal related problems.  Both money and science libraries store values as Rationals.  As a result using and testing the libraries is much easier and more accurate.

`Rational` is a first-class number in Gosu, which means you can use it directly in arithmetic expressions and declare Rational literals:

    var one = 1r  // r is a literal suffix for Rational
    var oneThird = one/3  // preserves the quotient 1/3 exactly

You can get an instance of `Rational` using one of various `get()` calls:

    Rational.get( anyNumber )
    Rational.get( "3.14" )
    Rational.get( "1 / 3" )

`Rational` stores its value in reduced form:

    var value = 10r / 30
    print( value )  // prints "1 / 3"

Also like other first-class number types, Rationals are sequenceable:

    for( n in (1r..3r).step( 1/3 ) ) {
       print( n )
    }
      
    1 / 1
    4 / 3
    5 / 3
    2 / 1
    7 / 3
    8 / 3
    3 / 1

Conclusion
----------

There's a lot more to cover regarding Binding Expressions and the new libraries.  This post is meant to give you a taste; I plan to cover each of them in greater detail in separate posts.  But I hope I've gotten across the basics of binding expressions.  Generally, they provide a great deal of expressive power to significantly enhance readability where you would otherwise write boilerplate initialization code and the like.  They also give you, the programmer, the power to create your own binder types, either on your own classes or, via enhancements, on classes you otherwise can't modify.

The new money, science, and time libraries not only work well as binder expressions they're also intended for general use as utility classes in your everyday programming.  They are still a work in progress, though, so I hope you won't be shy with feedback.  In addition, feel free to clone the Gosu repo and experiment with your ideas.  In any case I hope you enjoy these new capabilities and use them to improve your experience with Gosu.  Thanks!
