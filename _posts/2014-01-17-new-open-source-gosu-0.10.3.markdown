---
layout: post
title: New Open Source Gosu 0.10.3
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
  
<pre class="prettyprint">
uses dynamic.Dynamic

var a : Dynamic = &quot;Hello world&quot;
print(a) // it prints Hello world
a = 123
var b : int = a
print(b) // it prints 123
</pre>

* Support for structural typing, similar Go&#39;s interfaces.

  Gosu is a statically typed language employing a Nominal type system, which generally means type assignability is based on declared type names.  For instance, in Gosu a type is assignable to interface, Foo, only if it declares Foo in its hierarchy.  Another form of static typing, called Structural Typing, determines assignability based on declared type features.  Roughly a type is structurally assignable to Foo if compatible versions of all Foo&#39;s methods and properties exist in the type &dash;&dash; the type doesn&#39;t have to formally declare that it implements Foo. 
  The extra flexibility to use a type based on its capability, not its name, it&#39;s especially useful when dealing with third party libraries.
  The type checking is performed at compile time and this features enables a form of &quot;static duck typing&quot;.
  For more information about its usage and design decisions please refer to the a future blog post.
<pre class="prettyprint">
structure Quacker{
  function quack();
}

class Duck {
  function quack() { print(&quot;Quack!&quot;) }
}

class Dog {
  function quack() { print(&quot;Qu..Woof!&quot;) }
}

var animal : Quacker = new Duck()
animal.quack()  // it prints Quack!
animal = new Dog()
animal.quack()  // it prints Qu..Woof!
</pre>

* The logical compound assignment operators: &amp;&amp;= and ||=.
  
  They work with boolean types (boolean and Boolean).
  
<pre class="prettyprint"> 
var b = false
b &amp;&amp;= true // same as b = b &amp;&amp; true and it evaluates to false
</pre>

* Nested comments: it&#39;s now possible to write a comment inside  another comment.
  
  It is manly useful when you comment out a block of code that includes comments.
  
<pre class="prettyprint"> 
/*
    // if x is true
    if(x) {
      print(&quot;Hello!&quot;) /* print */
    } else {
      /* x is not true
         let's print world
       */
      print(&quot;world&quot;)
    }
*/
</pre>

The plugin is available from the JetBrains repository, which is directly accessible from your IntelliJ 12 plugins setup dialog.  Select &quot;Gosu&quot;, right click and install (see <a href="http://gosu-lang.github.io/downloads.html">this page</a> more detailed instructions). 