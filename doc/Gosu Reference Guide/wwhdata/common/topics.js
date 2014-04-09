/*
 *   Title: TopicUtils-JavaScript.js
 *   
 *  JavaScript related to the TopicUtils code. This file gets COPIED into the output webworks files to support
 *  the link to this page code.
 */

 
// extracts the src=myfilename from the URL
function Guidewire_ExtractSrcFromURL() {
	var VarDocumentURL = window.WWHFrame.location;
	var TheParametersArray = VarDocumentURL.hash.split("&");
	var thisParam;
	var FMSourceFile = "UNKNOWN_FRAMEMAKER_SOURCE_FILE";

	k = TheParametersArray.length;
	for (i= 0 ; i < k; i++) {
	   thisParam = unescape(TheParametersArray[i]);
	   if (thisParam.search(/^src=/) != -1) {
		  FMSourceFile = thisParam.substring(4); // strip off the "src=" at the beginning
		}
	 }
	return FMSourceFile;
}

// takes a file name of format "myfilename.4.3" and gets the beginning part and returns "myfilename" only
function Guidewire_FMSourceFileExtract(FullFileName)
{
  var VarSplitURL= FullFileName.split(".");
  return VarSplitURL[0];
}

// is the src=myfile arg from the URL (which means it was from myfile.fm) match the desired file
// generally speaking we do not care since we just want it unique per book
// so we just say yes, but we say false if it's a special file that allows duplicates in one book
function Guidewire_FMSourceFileMatch(FROM_URL,LOCAL_FILENAME) {
	var varFileURL = FROM_URL.toLowerCase();
	var varFileActual = LOCAL_FILENAME.toLowerCase();

	// SPECIAL CASE FOR UPGRADE GUIDE PROCEDURES -- BASICALLY 
	if (varFileURL.search(/^procedure-/) != -1) {
	  if  (varFileActual.search(/^procedure-/) != -1)  { 
		  return (varFileURL == Guidewire_FMSourceFileExtract(varFileActual)); 
		} else { 
		 return false; 
	   }
	 }
	else {
	   // basically, the default is to say they match... 
	   // if it's one of these specially-handled files, just let it work  
	   return true; 
	}
}


// this function takes a topic Name and converts it to a simpler string, such as underscores instead of space chars
// This is also important because FrameMaker + ePubs's  native handling of topic alias names mirror this behavior
//
// IMPORTANT: IF YOU CHANGE THIS CODE IN CONTROLS.JS (IN TEMPLATE OVERRIDES), ALSO CHANGE THE MIRROR FUNCTION IN TOPICUTILS-JAVASCRIPT.JS
// IMPORTANT: IF YOU CHANGE THIS CODE IN TOPICUTILS.FSL, ALSO CHANGE THE MIRROR FUNCTION IN CONTROLS.JS (IN TEMPLATE OVERRIDES)
// THE CONTROLS.JS FUNCTION ENCODES THE URL, AND THIS FUNCTION ENCODES it and compares against the input string with the full name for each topic (potentially with funny characters)
function Guidewire_SafeTopicName(theTitle) {
theTitle = theTitle.replace(/ /g, "_");  // converts space char
theTitle = theTitle.replace(/\u00a0/g, "_");  // converts nbsp char
// censor (remove) characters that mess up epublisher in URLs: forward slash, backslash, question mark, &amp;
theTitle= theTitle.replace(/[\\\/\?]/g, "");
theTitle = theTitle.replace(/&/g, "");
theTitle = theTitle.replace(/\u201c/g, ""); // double quote smart L
theTitle = theTitle.replace(/\u201d/g, "");// double quote smart R
theTitle = theTitle.replace(/\u2018/g, "");// single quote smart L
theTitle = theTitle.replace(/\u2019/g, "");// single quote smart R
theTitle = theTitle.replace(/\u2022/g, "");// trademark
theTitle = theTitle.replace(/'/g, "");// apparently a dumb single quote gets stripped by webworks
theTitle = theTitle.replace(/"/g, "");// to be safe let us strip double quotes too
theTitle = theTitle.replace(/\</g, "(");  // open bracket
theTitle = theTitle.replace(/\>/g, ")");   // close bracket
theTitle = theTitle.replace(/:/g, "_");    // colon
theTitle = theTitle.replace(/&/g, "");
return (theTitle);  }




function Guidewire_TopicMatch(FROMEPUB,WHATTOMATCH) {
var varLower1 = FROMEPUB.toLowerCase();
var varLower2 = WHATTOMATCH.toLowerCase();
var varLower2Safe = Guidewire_SafeTopicName(varLower2)

// match positively if they naturally match, or they match the safe version (convert spaces to underscores...)
var varMatches = (varLower1 == varLower2 || varLower1 == Guidewire_SafeTopicName(varLower2))

// console.log(Guidewire_TopicMatch, varLower1, varLower2, varLower2Safe, varMatches)
return varMatches
}
function GUIDEWIRE_TOPIC_TO_FILE(TOPIC, SRCFILE) { 
if (Guidewire_TopicMatch(TOPIC,"cover")) return "index.html"

else if (Guidewire_TopicMatch(TOPIC,"Gosu Reference Guide") && Guidewire_FMSourceFileMatch(SRCFILE,"cover-gscript.html") ) { return "cover-gscript.html";}
else if (Guidewire_TopicMatch(TOPIC,"About This Document") && Guidewire_FMSourceFileMatch(SRCFILE,"about.html") ) { return "about.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Introduction") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.01.html") ) { return "intro.03.01.html";}
else if (Guidewire_TopicMatch(TOPIC,"Welcome to Gosu") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.02.html") ) { return "intro.03.02.html";}
else if (Guidewire_TopicMatch(TOPIC,"Running Gosu Programs and Calling Other Classes") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.03.html") ) { return "intro.03.03.html";}
else if (Guidewire_TopicMatch(TOPIC,"More About the Gosu Type System") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.04.html") ) { return "intro.03.04.html";}
else if (Guidewire_TopicMatch(TOPIC,"Compile Time Error Prevention") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.05.html") ) { return "intro.03.05.html";}
else if (Guidewire_TopicMatch(TOPIC,"Type Inference") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.06.html") ) { return "intro.03.06.html";}
else if (Guidewire_TopicMatch(TOPIC,"Intelligent Code Completion and Other Gosu Editor Tools") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.07.html") ) { return "intro.03.07.html";}
else if (Guidewire_TopicMatch(TOPIC,"Null Safety for Properties and Other Operators") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.08.html") ) { return "intro.03.08.html";}
else if (Guidewire_TopicMatch(TOPIC,"Generics in Gosu") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.09.html") ) { return "intro.03.09.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Primitives Types") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.10.html") ) { return "intro.03.10.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Case Sensitivity and Capitalization") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.11.html") ) { return "intro.03.11.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Statement Terminators") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.12.html") ) { return "intro.03.12.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Comments") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.13.html") ) { return "intro.03.13.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Reserved Words") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.14.html") ) { return "intro.03.14.html";}
else if (Guidewire_TopicMatch(TOPIC,"Notable Differences Between Gosu and Java") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.15.html") ) { return "intro.03.15.html";}
else if (Guidewire_TopicMatch(TOPIC,"Get Ready for Gosu") && Guidewire_FMSourceFileMatch(SRCFILE,"intro.03.16.html") ) { return "intro.03.16.html";}
else if (Guidewire_TopicMatch(TOPIC,"Getting Started with Gosu Community Release") && Guidewire_FMSourceFileMatch(SRCFILE,"getting-started-gosu-opensource.04.1.html") ) { return "getting-started-gosu-opensource.04.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Getting Started With IntelliJ IDEA Gosu Plugin") && Guidewire_FMSourceFileMatch(SRCFILE,"getting-started-gosu-opensource.04.2.html") ) { return "getting-started-gosu-opensource.04.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Getting Started With Gosu Command Line Tools") && Guidewire_FMSourceFileMatch(SRCFILE,"getting-started-gosu-opensource.04.3.html") ) { return "getting-started-gosu-opensource.04.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Using XML and SOAP Libraries with Gosu Community Release") && Guidewire_FMSourceFileMatch(SRCFILE,"getting-started-gosu-opensource.04.4.html") ) { return "getting-started-gosu-opensource.04.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Advanced Examples") && Guidewire_FMSourceFileMatch(SRCFILE,"getting-started-gosu-opensource.04.5.html") ) { return "getting-started-gosu-opensource.04.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"What\u2019s New and Changed in Gosu Community Release") && Guidewire_FMSourceFileMatch(SRCFILE,"gosu-opensource-whatsnew.05.1.html") ) { return "gosu-opensource-whatsnew.05.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"What\u2019s New in Gosu 0.10.2-C") && Guidewire_FMSourceFileMatch(SRCFILE,"gosu-opensource-whatsnew.05.2.html") ) { return "gosu-opensource-whatsnew.05.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Changed in Gosu 0.10.2-C") && Guidewire_FMSourceFileMatch(SRCFILE,"gosu-opensource-whatsnew.05.3.html") ) { return "gosu-opensource-whatsnew.05.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Command Line Shell") && Guidewire_FMSourceFileMatch(SRCFILE,"gosu-commandline-emerald.06.1.html") ) { return "gosu-commandline-emerald.06.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Command Line Tool Basics") && Guidewire_FMSourceFileMatch(SRCFILE,"gosu-commandline-emerald.06.2.html") ) { return "gosu-commandline-emerald.06.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Command Line Arguments") && Guidewire_FMSourceFileMatch(SRCFILE,"gosu-commandline-emerald.06.3.html") ) { return "gosu-commandline-emerald.06.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Interactive Shell") && Guidewire_FMSourceFileMatch(SRCFILE,"gosu-commandline-emerald.06.4.html") ) { return "gosu-commandline-emerald.06.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Helpful APIs for Command Line Gosu Programs") && Guidewire_FMSourceFileMatch(SRCFILE,"gosu-commandline-emerald.06.5.html") ) { return "gosu-commandline-emerald.06.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Programs") && Guidewire_FMSourceFileMatch(SRCFILE,"gosu-programs.07.1.html") ) { return "gosu-programs.07.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"The Structure of a Gosu Program") && Guidewire_FMSourceFileMatch(SRCFILE,"gosu-programs.07.2.html") ) { return "gosu-programs.07.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Types") && Guidewire_FMSourceFileMatch(SRCFILE,"datatypes.08.1.html") ) { return "datatypes.08.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Access to Java Types") && Guidewire_FMSourceFileMatch(SRCFILE,"datatypes.08.2.html") ) { return "datatypes.08.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Primitive Types") && Guidewire_FMSourceFileMatch(SRCFILE,"datatypes.08.3.html") ) { return "datatypes.08.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Objects") && Guidewire_FMSourceFileMatch(SRCFILE,"datatypes.08.4.html") ) { return "datatypes.08.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Boolean Values") && Guidewire_FMSourceFileMatch(SRCFILE,"datatypes.08.5.html") ) { return "datatypes.08.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"Sequences of Characters") && Guidewire_FMSourceFileMatch(SRCFILE,"datatypes.08.6.html") ) { return "datatypes.08.6.html";}
else if (Guidewire_TopicMatch(TOPIC,"Array Types") && Guidewire_FMSourceFileMatch(SRCFILE,"datatypes.08.7.html") ) { return "datatypes.08.7.html";}
else if (Guidewire_TopicMatch(TOPIC,"Numeric Literals") && Guidewire_FMSourceFileMatch(SRCFILE,"datatypes.08.8.html") ) { return "datatypes.08.8.html";}
else if (Guidewire_TopicMatch(TOPIC,"Compatibility with Earlier Gosu Releases") && Guidewire_FMSourceFileMatch(SRCFILE,"datatypes.08.9.html") ) { return "datatypes.08.9.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Operators and Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.01.html") ) { return "expressions.09.01.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Operators") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.02.html") ) { return "expressions.09.02.html";}
else if (Guidewire_TopicMatch(TOPIC,"Operator Precedence") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.03.html") ) { return "expressions.09.03.html";}
else if (Guidewire_TopicMatch(TOPIC,"Standard Gosu Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.04.html") ) { return "expressions.09.04.html";}
else if (Guidewire_TopicMatch(TOPIC,"Arithmetic Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.05.html") ) { return "expressions.09.05.html";}
else if (Guidewire_TopicMatch(TOPIC,"Equality Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.06.html") ) { return "expressions.09.06.html";}
else if (Guidewire_TopicMatch(TOPIC,"Evaluation Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.07.html") ) { return "expressions.09.07.html";}
else if (Guidewire_TopicMatch(TOPIC,"Existence Testing Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.08.html") ) { return "expressions.09.08.html";}
else if (Guidewire_TopicMatch(TOPIC,"Logical Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.09.html") ) { return "expressions.09.09.html";}
else if (Guidewire_TopicMatch(TOPIC,"New Object Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.10.html") ) { return "expressions.09.10.html";}
else if (Guidewire_TopicMatch(TOPIC,"Relational Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.11.html") ) { return "expressions.09.11.html";}
else if (Guidewire_TopicMatch(TOPIC,"Unary Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.12.html") ) { return "expressions.09.12.html";}
else if (Guidewire_TopicMatch(TOPIC,"Importing Types and Package Namespaces") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.13.html") ) { return "expressions.09.13.html";}
else if (Guidewire_TopicMatch(TOPIC,"Conditional Ternary Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.14.html") ) { return "expressions.09.14.html";}
else if (Guidewire_TopicMatch(TOPIC,"Special Gosu Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.15.html") ) { return "expressions.09.15.html";}
else if (Guidewire_TopicMatch(TOPIC,"Function Calls") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.16.html") ) { return "expressions.09.16.html";}
else if (Guidewire_TopicMatch(TOPIC,"Static Method Calls") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.17.html") ) { return "expressions.09.17.html";}
else if (Guidewire_TopicMatch(TOPIC,"Static Property Paths") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.18.html") ) { return "expressions.09.18.html";}
else if (Guidewire_TopicMatch(TOPIC,"Handling Null Values In Expressions") && Guidewire_FMSourceFileMatch(SRCFILE,"expressions.09.19.html") ) { return "expressions.09.19.html";}
else if (Guidewire_TopicMatch(TOPIC,"Statements") && Guidewire_FMSourceFileMatch(SRCFILE,"statements.10.1.html") ) { return "statements.10.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Statements") && Guidewire_FMSourceFileMatch(SRCFILE,"statements.10.2.html") ) { return "statements.10.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Variables") && Guidewire_FMSourceFileMatch(SRCFILE,"statements.10.3.html") ) { return "statements.10.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Conditional Execution and Looping") && Guidewire_FMSourceFileMatch(SRCFILE,"statements.10.4.html") ) { return "statements.10.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Functions") && Guidewire_FMSourceFileMatch(SRCFILE,"statements.10.5.html") ) { return "statements.10.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"Intervals") && Guidewire_FMSourceFileMatch(SRCFILE,"intervals.11.1.html") ) { return "intervals.11.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"What are Intervals") && Guidewire_FMSourceFileMatch(SRCFILE,"intervals.11.2.html") ) { return "intervals.11.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Writing Your Own Interval Type") && Guidewire_FMSourceFileMatch(SRCFILE,"intervals.11.3.html") ) { return "intervals.11.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Exception Handling") && Guidewire_FMSourceFileMatch(SRCFILE,"exceptionhandling.12.1.html") ) { return "exceptionhandling.12.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Try-Catch-Finally Constructions") && Guidewire_FMSourceFileMatch(SRCFILE,"exceptionhandling.12.2.html") ) { return "exceptionhandling.12.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Throw Statements") && Guidewire_FMSourceFileMatch(SRCFILE,"exceptionhandling.12.3.html") ) { return "exceptionhandling.12.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Catching Exceptions in Gosu") && Guidewire_FMSourceFileMatch(SRCFILE,"exceptionhandling.12.4.html") ) { return "exceptionhandling.12.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Object Lifecycle Management (\u2018using\u2019 Clauses)") && Guidewire_FMSourceFileMatch(SRCFILE,"exceptionhandling.12.5.html") ) { return "exceptionhandling.12.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"Assert Statements") && Guidewire_FMSourceFileMatch(SRCFILE,"exceptionhandling.12.6.html") ) { return "exceptionhandling.12.6.html";}
else if (Guidewire_TopicMatch(TOPIC,"Classes") && Guidewire_FMSourceFileMatch(SRCFILE,"classes.13.1.html") ) { return "classes.13.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"What Are Classes") && Guidewire_FMSourceFileMatch(SRCFILE,"classes.13.2.html") ) { return "classes.13.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Creating and Instantiating Classes") && Guidewire_FMSourceFileMatch(SRCFILE,"classes.13.3.html") ) { return "classes.13.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Properties") && Guidewire_FMSourceFileMatch(SRCFILE,"classes.13.4.html") ) { return "classes.13.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Modifiers") && Guidewire_FMSourceFileMatch(SRCFILE,"classes.13.5.html") ) { return "classes.13.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"Inner Classes") && Guidewire_FMSourceFileMatch(SRCFILE,"classes.13.6.html") ) { return "classes.13.6.html";}
else if (Guidewire_TopicMatch(TOPIC,"Enumerations") && Guidewire_FMSourceFileMatch(SRCFILE,"enumerations.14.1.html") ) { return "enumerations.14.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Using Enumerations") && Guidewire_FMSourceFileMatch(SRCFILE,"enumerations.14.2.html") ) { return "enumerations.14.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Interfaces") && Guidewire_FMSourceFileMatch(SRCFILE,"interfaces.15.1.html") ) { return "interfaces.15.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"What is an Interface") && Guidewire_FMSourceFileMatch(SRCFILE,"interfaces.15.2.html") ) { return "interfaces.15.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Defining and Using an Interface") && Guidewire_FMSourceFileMatch(SRCFILE,"interfaces.15.3.html") ) { return "interfaces.15.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Composition") && Guidewire_FMSourceFileMatch(SRCFILE,"composition.16.1.html") ) { return "composition.16.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Using Gosu Composition") && Guidewire_FMSourceFileMatch(SRCFILE,"composition.16.2.html") ) { return "composition.16.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Annotations") && Guidewire_FMSourceFileMatch(SRCFILE,"annotations.17.1.html") ) { return "annotations.17.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Annotating a Class, Method, Type, Class Variable, or Argument") && Guidewire_FMSourceFileMatch(SRCFILE,"annotations.17.2.html") ) { return "annotations.17.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Annotations at Run Time") && Guidewire_FMSourceFileMatch(SRCFILE,"annotations.17.3.html") ) { return "annotations.17.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Defining Your Own Annotations") && Guidewire_FMSourceFileMatch(SRCFILE,"annotations.17.4.html") ) { return "annotations.17.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Enhancements") && Guidewire_FMSourceFileMatch(SRCFILE,"enhancements.18.1.html") ) { return "enhancements.18.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Using Enhancements") && Guidewire_FMSourceFileMatch(SRCFILE,"enhancements.18.2.html") ) { return "enhancements.18.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Blocks") && Guidewire_FMSourceFileMatch(SRCFILE,"blocks.19.1.html") ) { return "blocks.19.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"What Are Blocks") && Guidewire_FMSourceFileMatch(SRCFILE,"blocks.19.2.html") ) { return "blocks.19.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Basic Block Definition and Invocation") && Guidewire_FMSourceFileMatch(SRCFILE,"blocks.19.3.html") ) { return "blocks.19.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Variable Scope and Capturing Variables In Blocks") && Guidewire_FMSourceFileMatch(SRCFILE,"blocks.19.4.html") ) { return "blocks.19.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Argument Type Inference Shortcut In Certain Cases") && Guidewire_FMSourceFileMatch(SRCFILE,"blocks.19.5.html") ) { return "blocks.19.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"Block Type Literals") && Guidewire_FMSourceFileMatch(SRCFILE,"blocks.19.6.html") ) { return "blocks.19.6.html";}
else if (Guidewire_TopicMatch(TOPIC,"Blocks and Collections") && Guidewire_FMSourceFileMatch(SRCFILE,"blocks.19.7.html") ) { return "blocks.19.7.html";}
else if (Guidewire_TopicMatch(TOPIC,"Blocks as Shortcuts for Anonymous Classes") && Guidewire_FMSourceFileMatch(SRCFILE,"blocks.19.8.html") ) { return "blocks.19.8.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Generics") && Guidewire_FMSourceFileMatch(SRCFILE,"generics.20.1.html") ) { return "generics.20.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Generics Overview") && Guidewire_FMSourceFileMatch(SRCFILE,"generics.20.2.html") ) { return "generics.20.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Using Gosu Generics") && Guidewire_FMSourceFileMatch(SRCFILE,"generics.20.3.html") ) { return "generics.20.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Other Unbounded Generics Wildcards") && Guidewire_FMSourceFileMatch(SRCFILE,"generics.20.4.html") ) { return "generics.20.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Generics and Blocks") && Guidewire_FMSourceFileMatch(SRCFILE,"generics.20.5.html") ) { return "generics.20.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"How Generics Help Define Collection APIs") && Guidewire_FMSourceFileMatch(SRCFILE,"generics.20.6.html") ) { return "generics.20.6.html";}
else if (Guidewire_TopicMatch(TOPIC,"Multiple Dimensionality Generics") && Guidewire_FMSourceFileMatch(SRCFILE,"generics.20.7.html") ) { return "generics.20.7.html";}
else if (Guidewire_TopicMatch(TOPIC,"Generics With Custom \u2018Containers\u2019") && Guidewire_FMSourceFileMatch(SRCFILE,"generics.20.8.html") ) { return "generics.20.8.html";}
else if (Guidewire_TopicMatch(TOPIC,"Collections") && Guidewire_FMSourceFileMatch(SRCFILE,"collections.21.1.html") ) { return "collections.21.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Basic Lists") && Guidewire_FMSourceFileMatch(SRCFILE,"collections.21.2.html") ) { return "collections.21.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Basic Hash Maps") && Guidewire_FMSourceFileMatch(SRCFILE,"collections.21.3.html") ) { return "collections.21.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"List and Array Expansion (*.)") && Guidewire_FMSourceFileMatch(SRCFILE,"collections.21.4.html") ) { return "collections.21.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Enhancement Reference for Collections and Related Types") && Guidewire_FMSourceFileMatch(SRCFILE,"collections.21.5.html") ) { return "collections.21.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"Collections Enhancement Methods") && Guidewire_FMSourceFileMatch(SRCFILE,"collections.21.6.html") ) { return "collections.21.6.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu and XML") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.01.html") ) { return "xml.22.01.html";}
else if (Guidewire_TopicMatch(TOPIC,"Manipulating XML Overview") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.02.html") ) { return "xml.22.02.html";}
else if (Guidewire_TopicMatch(TOPIC,"Introduction to the XML Element in Gosu") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.03.html") ) { return "xml.22.03.html";}
else if (Guidewire_TopicMatch(TOPIC,"Dollar Sign Prefix for Properties that Are XSD Types") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.04.html") ) { return "xml.22.04.html";}
else if (Guidewire_TopicMatch(TOPIC,"Exporting XML Data") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.05.html") ) { return "xml.22.05.html";}
else if (Guidewire_TopicMatch(TOPIC,"Parsing XML Data into an XML Element") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.06.html") ) { return "xml.22.06.html";}
else if (Guidewire_TopicMatch(TOPIC,"Creating Many Qualified Names in the Same Namespace") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.07.html") ) { return "xml.22.07.html";}
else if (Guidewire_TopicMatch(TOPIC,"XSD-based Properties and Types") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.08.html") ) { return "xml.22.08.html";}
else if (Guidewire_TopicMatch(TOPIC,"Getting Data From an XML Element") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.09.html") ) { return "xml.22.09.html";}
else if (Guidewire_TopicMatch(TOPIC,"Simple Values") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.10.html") ) { return "xml.22.10.html";}
else if (Guidewire_TopicMatch(TOPIC,"Access the Nillness of an Element") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.11.html") ) { return "xml.22.11.html";}
else if (Guidewire_TopicMatch(TOPIC,"Automatic Creation of Intermediary Elements") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.12.html") ) { return "xml.22.12.html";}
else if (Guidewire_TopicMatch(TOPIC,"Default and Fixed Attribute Values") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.13.html") ) { return "xml.22.13.html";}
else if (Guidewire_TopicMatch(TOPIC,"Substitution Group Hierarchies") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.14.html") ) { return "xml.22.14.html";}
else if (Guidewire_TopicMatch(TOPIC,"Element Sorting for XSD-based Elements") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.15.html") ) { return "xml.22.15.html";}
else if (Guidewire_TopicMatch(TOPIC,"Built-in Schemas") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.16.html") ) { return "xml.22.16.html";}
else if (Guidewire_TopicMatch(TOPIC,"Schema Access Type") && Guidewire_FMSourceFileMatch(SRCFILE,"xml.22.17.html") ) { return "xml.22.17.html";}
else if (Guidewire_TopicMatch(TOPIC,"Calling WS-I Web Services from Gosu") && Guidewire_FMSourceFileMatch(SRCFILE,"webservice-wsi-consuming.23.1.html") ) { return "webservice-wsi-consuming.23.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Adding WS-I Configuration Options") && Guidewire_FMSourceFileMatch(SRCFILE,"webservice-wsi-consuming.23.2.html") ) { return "webservice-wsi-consuming.23.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"One-Way Methods") && Guidewire_FMSourceFileMatch(SRCFILE,"webservice-wsi-consuming.23.3.html") ) { return "webservice-wsi-consuming.23.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Asynchronous Methods") && Guidewire_FMSourceFileMatch(SRCFILE,"webservice-wsi-consuming.23.4.html") ) { return "webservice-wsi-consuming.23.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"MTOM Attachments") && Guidewire_FMSourceFileMatch(SRCFILE,"webservice-wsi-consuming.23.5.html") ) { return "webservice-wsi-consuming.23.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"Calling Java from Gosu") && Guidewire_FMSourceFileMatch(SRCFILE,"java-gosu.24.1.html") ) { return "java-gosu.24.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Overview of Writing Gosu Code that Calls Java") && Guidewire_FMSourceFileMatch(SRCFILE,"java-gosu.24.2.html") ) { return "java-gosu.24.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Deploying Your Java for Command Line Use") && Guidewire_FMSourceFileMatch(SRCFILE,"java-gosu.24.3.html") ) { return "java-gosu.24.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Templates") && Guidewire_FMSourceFileMatch(SRCFILE,"templates.25.1.html") ) { return "templates.25.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Template Overview") && Guidewire_FMSourceFileMatch(SRCFILE,"templates.25.2.html") ) { return "templates.25.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"When to Escape Special Characters for Templates") && Guidewire_FMSourceFileMatch(SRCFILE,"templates.25.3.html") ) { return "templates.25.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Using Template Files") && Guidewire_FMSourceFileMatch(SRCFILE,"templates.25.4.html") ) { return "templates.25.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Type System") && Guidewire_FMSourceFileMatch(SRCFILE,"typesystem.26.1.html") ) { return "typesystem.26.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"The Type of All Types") && Guidewire_FMSourceFileMatch(SRCFILE,"typesystem.26.2.html") ) { return "typesystem.26.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Basic Type Checking") && Guidewire_FMSourceFileMatch(SRCFILE,"typesystem.26.3.html") ) { return "typesystem.26.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Using Reflection") && Guidewire_FMSourceFileMatch(SRCFILE,"typesystem.26.4.html") ) { return "typesystem.26.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Compound Types") && Guidewire_FMSourceFileMatch(SRCFILE,"typesystem.26.5.html") ) { return "typesystem.26.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"Type Loaders") && Guidewire_FMSourceFileMatch(SRCFILE,"typesystem.26.6.html") ) { return "typesystem.26.6.html";}
else if (Guidewire_TopicMatch(TOPIC,"Running Local Shell Commands") && Guidewire_FMSourceFileMatch(SRCFILE,"gw-util-shell.html") ) { return "gw-util-shell.html";}
else if (Guidewire_TopicMatch(TOPIC,"Checksums") && Guidewire_FMSourceFileMatch(SRCFILE,"checksums.28.1.html") ) { return "checksums.28.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Overview of Checksums") && Guidewire_FMSourceFileMatch(SRCFILE,"checksums.28.2.html") ) { return "checksums.28.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Concurrency") && Guidewire_FMSourceFileMatch(SRCFILE,"concurrency.29.1.html") ) { return "concurrency.29.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"Overview of Thread Safety and Concurrency") && Guidewire_FMSourceFileMatch(SRCFILE,"concurrency.29.2.html") ) { return "concurrency.29.2.html";}
else if (Guidewire_TopicMatch(TOPIC,"Gosu Scoping Classes (Pre-scoped Maps)") && Guidewire_FMSourceFileMatch(SRCFILE,"concurrency.29.3.html") ) { return "concurrency.29.3.html";}
else if (Guidewire_TopicMatch(TOPIC,"Concurrent Lazy Variables") && Guidewire_FMSourceFileMatch(SRCFILE,"concurrency.29.4.html") ) { return "concurrency.29.4.html";}
else if (Guidewire_TopicMatch(TOPIC,"Concurrent Cache") && Guidewire_FMSourceFileMatch(SRCFILE,"concurrency.29.5.html") ) { return "concurrency.29.5.html";}
else if (Guidewire_TopicMatch(TOPIC,"Concurrency with Monitor Locks and Reentrant Objects") && Guidewire_FMSourceFileMatch(SRCFILE,"concurrency.29.6.html") ) { return "concurrency.29.6.html";}
else if (Guidewire_TopicMatch(TOPIC,"Properties Files") && Guidewire_FMSourceFileMatch(SRCFILE,"propertiesfiles.html") ) { return "propertiesfiles.html";}
else if (Guidewire_TopicMatch(TOPIC,"Coding Style") && Guidewire_FMSourceFileMatch(SRCFILE,"style.31.1.html") ) { return "style.31.1.html";}
else if (Guidewire_TopicMatch(TOPIC,"General Coding Guidelines") && Guidewire_FMSourceFileMatch(SRCFILE,"style.31.2.html") ) { return "style.31.2.html";}
else { return("../wwhelp/topic_cannot_be_found.html"); } }

function  WWHBookData_MatchTopic(P)
{
var C=null;P=decodeURIComponent(decodeURIComponent(escape(P)));//workaround epub bug with UTF8 processing!
if(P=="The_Gosu_Language")C="intro.03.02.html";
if(P=="Gosu_Case_Sensitivity")C="intro.03.11.html";
if(P=="Gosu_Code_Comments")C="intro.03.13.html";
if(P=="Gosu_Interactive_Shell")C="gosu-commandline-emerald.06.4.html";
if(P=="Gosu_Shell")C="gosu-programs.07.1.html";
if(P=="Annotating_a_Class,_Method,_Type,_or_Constructor")C="annotations.17.2.html";
if(P=="Collections_in_Gosu")C="collections.21.1.html";
if(P=="GScript_and_XML_")C="xml.22.01.html";
if(P=="Java_and_Gosu")C="java-gosu.24.1.html";
if(P=="Calling_Java_from_Gosu")C="java-gosu.24.1.html";
if(P=="Gosu-to-Java_Class_Deployment")C="java-gosu.24.3.html";
if(P=="Type_System_and_Reflection")C="typesystem.26.1.html";
if(P=="Running_Command_Line_Tools_from_Gosu")C="gw-util-shell.html#2186018";
if(P=="Gosu_Scoping_Classes")C="concurrency.29.3.html";
if (C) { return C } else { return GUIDEWIRE_TOPIC_TO_FILE(P,Guidewire_ExtractSrcFromURL());}
}
