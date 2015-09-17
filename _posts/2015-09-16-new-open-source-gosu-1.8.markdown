---
layout: post
title: New Open Source Gosu 1.8 And IntelliJ 14 support
authors:
- Gosu Team
date: 2015-09-16 17:00:00 -0700
---

The Gosu team is happy to announce the official release of Gosu 1.8. A new IntelliJ IDEA editor plugin, [OS Gosu v4.0.2.11a](https://plugins.jetbrains.com/plugin/download?pr=&updateId=21368), is also released to the Jetbrains repository.

Changes in this release
-----------------------

This release introduces a Gosu compiler component for Maven - read more about it [here]({{ site.url }}/2015/09/17/continuous-integration-with-gosu.html). A pre-compiled artifact containing the Gosu API is also reintroduced.  Several bug fixes and performance improvements are also included, though there are no notable syntactic changes in this release.

IntelliJ IDEA support is vastly improved as well. The Gosu SDK installed by previous versions of the plugin may be safely deleted. In order to execute Gosu code in the IDE, projects must explicitly include the gosu-core and gosu-core-api JARs on their classpath - a helpful error is displayed if these are missing.

As a side note, a RSS feed is now available for the gosu-lang website. Look for the <i class="fa fa-rss"></i> icon to find the feed URL.
