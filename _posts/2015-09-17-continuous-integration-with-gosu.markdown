---
layout: post
title: Continuous Integration with Gosu
authors:
- Kyle Moore
date: 2015-09-17 16:00:00 -0700
---

One of Gosu's many advantages over other JVM languages is that sources are dynamically compiled to bytecode at runtime - no need to run javac, make/rebuild the project or waste time troubleshooting why sources and class files were somehow out of sync.

But this advantage quickly erodes when considered from the rich ecosystem of testing tools and continuous integration platforms for Java. Writing JUnit tests in Gosu is a breeze, but how can they be executed outside of the IDE? Take [Maven](http://maven.apache.org/index.html) for example: in order to execute unit tests, the [Surefire Plugin](http://maven.apache.org/surefire/maven-surefire-plugin/index.html) expects to find .class files in each project module's target folder. No .class files means that no tests will run.

So what if Maven could be told how to compile Gosu down to class files, if only for the sake of running tests? It turns out it can - via the pluggable 'compilerId' parameter of the [Maven compiler plugin](http://maven.apache.org/plugins/maven-compiler-plugin/). I have created a compiler component for Plexus - Maven's dependency injection container. With a little bit of XML configuration any project with Gosu-based tests can now compiled and executed from the command line.

###Examples

Three sample repositories demonstrate example configuration for the plugin:

  * #####[example-gosuc-simple](https://github.com/gosu-lang/example-gosuc-simple) A simple project, only Gosu sources and no Java
  * #####[example-gosuc-hybrid](https://github.com/gosu-lang/example-gosuc-hybrid) Combines Java and Gosu sources; Gosu depends on Java
  * #####[example-gosuc-inverted](https://github.com/gosu-lang/example-gosuc-inverted) Combines Java and Gosu sources; but in an unusual step, Java depends on Gosu

More technical details are available in the README and pom.xml files of the above repositories.

###Continuous Integration

Perhaps the greatest benefit of the the compiler plugin is enablement of automated testing. The Gosu language specification has over 15,000 tests (and growing), but until now relied on our IDE to execute. No longer. Thanks to GitHub's seamless integration with [CircleCI](https://circleci.com/about), all tests found in the gosu-test module are now running "in the cloud": [https://circleci.com/gh/gosu-lang/gosu-lang/tree/master](https://circleci.com/gh/gosu-lang/gosu-lang/tree/master)

###Next Steps and Future Functionality

The compiler component is available beginning from Gosu release [1.8]({{ site.url }}/2015/09/16/new-open-source-gosu-1.8.html), but the work does not end here. [Gradle](http://gradle.org/) is increasing in popularity and is the likely successor to Maven as a build platform. Choice is always good, so I look forward to duplicating the Maven compilation capability in Gradle.

Compiling Gosu sources to .class also opens the door for consideration of releasing a library written in Gosu via JARs.

Finally, this enables the Gosu team to improve its build-test-release process: upon a successful build with no failed tests, it will be possible to automate snapshot and release deployment directly to Maven Central.

Compiling Gosu's tests to bytecode makes our lives easier by automating test execution. But more than that, it is my sincere hope that "playing nice" with the prevalent tools of the Java/JVM ecosystem will further increase Gosu's appeal and continue to attract contributors to our open-source project.
