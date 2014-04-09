---
layout: post
title: New Open Source Gosu 0.10.2
---

The Gosu team is happy to announce  the official release of Gosu 0.10.2 and Gosu Plugin 3.2 for IntelliJ 12.

In this release we open sourced the last missing parts:  
* The Web Services Type Loader
* The XML Type Loader
* The entire IntelliJ IDEA Plugin

Gosu language
-------------

The changes to the language in this release are minor:

* New assert statement 
<pre class="prettyprint"> assert 1 &gt; 2 : &quot;foo&quot; </pre>
* In the for loop statement, the local variable is now optional with numeric intervals 
<pre class="prettyprint"> for(1..3) print(&#39;hi&#39;) </pre>
* Final local variable and class variable can be initialized after being declared 
<pre class="prettyprint">  final var a : int  a = 10</pre>
* The new expression is now also a statement 
<pre class="prettyprint"> var a = new String() vs new String())</pre>
* Support  for annotations on function parameters 
<pre class="prettyprint"> function area(@Deprecated r : int) {} </pre>
* Added the finally clause to the using statement   

<pre class="prettyprint">
  using(var a = new FileWriter(&quot;Temp.txt&quot;))
  {
    a.write(&quot;Hello&quot;) 
  }
  finally
  {
    print(&quot;more cleanup/final code&quot;)
  }
</pre>

Intellij Gosu Editor
--------------------
Several bugs have been fixed in the past months. The Gosu plugin is much more reliable now and the installation process is less error prone.
The refactoring support has been enhanced and several &quot;Quick fixes&quot; and &quot;Inspections&quot; has been added. (ex &quot;The &#39;new expression&#39; can be replaced by a block&quot;, &quot;The method can be replaced by a property&quot;, etc). A Java to Gosu translator has been implemented, Java code can be copied and pasted as Gosu on the fly in the editor.
The plugin is available from the JetBrains repository, which is directly accessible from your IntelliJ 12 plugins setup dialog.  Select &quot;Gosu&quot;, right click and install (see <a href="http://gosu-lang.github.io/downloads.html">this page</a> more detailed instructions). 

