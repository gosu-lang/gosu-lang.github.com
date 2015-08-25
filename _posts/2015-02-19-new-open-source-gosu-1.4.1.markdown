---
layout: post
title: New Open Source Gosu 1.4.1
authors:
- Gosu Team
---

The Gosu team is happy to announce the official release of Gosu 1.4.1 and Gosu 
Plugin 3.8.1 for IntelliJ 12.

Changes in this release
-----------------------

This release was mainly focused on refining the Gosu build, eliminating obsolete modules and breaking 
superfluous dependencies:

- the Gosu build now takes approximately 50% less time.
- Gosu now depends on only 5 external libraries versus 48 in the previous release.
- the Gosu distribution [zip](http://gosu-lang.org/nexus/content/repositories/gosu/org/gosu-lang/gosu/gosu/1.4.1/gosu-1.4.1-full.zip) is 50% smaller than the previous version.
- now Gosu compiles separately from the Gosu Intellij Plugin with a simple 'mvn compile'.
 
Stay tuned for the next release, it will include Java 8 support, many bug fixes and we will deploy directly on Maven central.

The Intellij plugin is available from the JetBrains repository, which is directly accessible from your IntelliJ 12 plugins setup dialog. Select "Gosu", right click and install (see [this](http://gosu-lang.github.io/downloads.html) page more detailed instructions). 
