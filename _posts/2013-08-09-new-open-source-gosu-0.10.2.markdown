---
layout: post
title: New Open Source Gosu 0.10.2
author: Gosu Team
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

        assert 1 > 2 : "foo" 

* In the for loop statement, the local variable is now optional with numeric intervals 

        for(1..3) print('hi') 

* Final local variable and class variable can be initialized after being declared 

        final var a : int  a = 10

* The new expression is now also a statement 

        var a = new String() vs new String()

* Support  for annotations on function parameters 

        function area(@Deprecated r : int) {} 

* Added the finally clause to the using statement   

        using(var a = new FileWriter("Temp.txt"))
        {
          a.write("Hello") 
        }
        finally
        {
          print("more cleanup/final code")
        }

Intellij Gosu Editor
--------------------

Several bugs have been fixed in the past months. The Gosu plugin is much more reliable now and the installation process is less error prone. The refactoring support has been enhanced and several "Quick fixes" and "Inspections" have been added. (ex "The 'new expression' can be replaced by a block", "The method can be replaced by a property", etc). A Java to Gosu translator has been implemented, Java code can be copied and pasted as Gosu on the fly in the editor. The plugin is available from the JetBrains repository, which is directly accessible from your IntelliJ 12 plugins setup dialog. Select "Gosu", right click and install (see [this](http://gosu-lang.github.io/downloads.html) page more detailed instructions). 
