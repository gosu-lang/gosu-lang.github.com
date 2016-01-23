---
layout: post
title: New Open Source Gosu 1.10.1 + Gradle support
authors:
- Kyle Moore
---

The Gosu team is happy to announce the official release of Gosu 1.10.1 **and** our new plugin for Gradle.

Changes in this release
-----------------------

This new version of Gosu features mainly internal improvements designed for interaction with our new Gradle plugin.

##Gradle, eh?

Yes! The Gradle plugin lives [here](https://plugins.gradle.org/plugin/org.gosu-lang.gosu), or can quickly be located at [plugins.gradle.org](https://plugins.gradle.org/) by searching for `gosu`.

While a reasonably stable alpha version of the plugin has been available since November, we wanted to really put it through its paces before making this official announcement. This plugin is now used in production at Guidewire Software, where it manages the compilation of millions of lines of Gosu code!

###Importing

Applying the Gradle plugin to a project couldn't be any easier. Simply paste this block at the top of your `build.gradle` file:

    plugins {
      id 'org.gosu-lang.gosu' version '0.1.3'
    }

Next, you'll need to include 1) one or more repositories to locate and download Gosu, and 2) a dependency on Gosu itself. It's easy:

    repositories {
        mavenLocal()
        mavenCentral()
    }
    dependencies {
        compile 'org.gosu-lang.gosu:gosu-core-api:1.10.1'
    }

If you forget the repositories closure or the Gosu compile-time dependency, helpful error messages will remind you what needs to be done.

###Tasks

The Gosu plugin "extends" Gradle's bundled Java plugin. So once the plugin is applied to your project, all the usual Java-related tasks will become available, plus three new Gosu-specific ones:

    compileGosu
    compileTestGosu
    gosudoc

The default roots for sources and tests are `src/main/gosu` and `src/test/gosu`, respectively. The gosudoc task needs no configuration on its own - it automatically processes the Gosu classes from the project's source roots.

###Putting it all together

At this point, Gosu will behave just like any other Java, Groovy or Scala project in Gradle. Call the `test` or `build` tasks to compile your code and execute tests. Need to JAR the build artifacts or deploy to a remote server?  No problem - everything is just stock Gradle.

Two sample repositories showing minimal project setup are available: have a look at [example-gradle-simple](https://github.com/gosu-lang/example-gradle-simple) and [example-gradle-hybrid](https://github.com/gosu-lang/example-gradle-hybrid). And the plugin's source is [here](https://github.com/gosu-lang/gradle-gosu-plugin) - please feel free to contribute!

Just like with our [Maven compiler for Gosu](/2015/09/17/continuous-integration-with-gosu.html), the team is thrilled to be opening up yet another way for developers to incorporate Gosu into their projects. When combined with the [OS Gosu IntelliJ IDEA editor plugin](https://plugins.jetbrains.com/plugin/7140?pr=idea_ce), the Gradle plugin is a major step forward in making Gosu easier to use and more accessible for everyone.
