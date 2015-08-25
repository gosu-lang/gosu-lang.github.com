---
layout: post
title: Checked Arithmetic in Gosu
authors:
- Luca Boasso
---

A type safe language must enforce the invariants of its types. For example in a declaration like this one:

    var x : int[]

We associate the type (array of integers) with the variable `x`. The type of `x` will never change, it represents information about the variable `x` which is permanent, unlike the value of the elements of the array which can vary. This information will be used by the compiler to enforce the operations that are allowed on `x` such as indexing (i.e. `x[0]`). In the case of arrays the JVM will also enforce that the index is within the bounds of the array, otherwise it will throw `ArrayIndexOutOfBoundsException`.

With checked arithmetic we want to enforce that the value of variable of type `int` or `long` falls in the type's respective ranges.

For example in the following assignment

    var r : int = Integer.MAX_VALUE + 1

the value `Integer.MAX_VALUE + 1` does not fit in a 32-bits integer. The Java compiler will generate a `IADD` instruction and the JVM will execute the instruction by keeping the 32 low-order bits of the true mathematical result in [two's-complement](https://en.wikipedia.org/wiki/Two%27s_complement) format. In this example this means that `r` will be `Integer.MIN_VALUE` as the result is said to wrap in the range of possible values: `Integer.MIX_VALUE..Integer.MAX_VALUE`.

If overflow occurs, as in this example, then the sign of the result may not be the same as the sign of the mathematical sum of the two values. This can have security implications. For instance your code might rely on a variable to be always positive but, if the malicious user can control directly/indirectly that variable and make it overflow, your code can take an unexpected path at runtime.

For example we can call the following method like this `checkPaidTimeOff({10, 4, 8 })`  or like this `checkPaidTimeOff({10, 4, Integer.MAX_VALUE })`.

    function checkPaidTimeOff(pto : List<Integer>)  {
      var MAX_HOURS = 200
      var totalHours = pto.reduce( 0, \ sum, x  ->  sum + x  )
      if(totalHours < MAX_HOURS) {
        print("Enjoy your ${totalHours} hours of vacation!")
      }
    }

In the last case we will enjoy very long holidays as `totalHours` will become a negative number due to overflow :)

Of course this example is artificial but the bug found by Joshua Bloch in the JDK lurking for 9 years is real. The bug was in the implementation of the binary search in `java.util.Arrays`:

    int mid = (low + high) / 2;
    
For very big arrays the sum of the low and the high indexes will overflow resulting in a negative mid index and a consequent `ArrayIndexOutOfBoundsException` when you index the array. For more information read this blog [post](http://googleresearch.blogspot.com/2006/06/extra-extra-read-all-about-it-nearly.html).

A spectacular and expensive failure due to integer overflow is the explosion of the Ariane 5 rocket. It exploded in less than a minute after lifting off the ground. The design and construction of the rocket cost $7 billion while the value of the rocket and cargo was
estimated $500 million [link](https://www.ima.umn.edu/%7Earnold/disasters/ariane.html).

![benchmark]({{ site.url }}/data/ariane.jpg)

The bottom line is integer overflows are rare but they can [happen](http://www.theguardian.com/business/2015/may/01/us-aviation-authority-boeing-787-dreamliner-bug-could-cause-loss-of-control) and when they [do](https://medium.com/@alexleclair/shopify-s-pos-integer-overflow-d280594aacf) they result in a malfunction that is hard to explain. This is because languages like Java silently "wrap around" and so the place where the program misbehave could be far away from the place in which the overflow happened.

We believe that integer overflow checking is as important as array boundchecking in a safe language.

Implementation
--------------

There are several way to implement this feature depending on the platform and how you want to handle the overflow when it happens.

We opted for a solution in line with the new Java 8 Math methods: `addExact`, `subtractExact`, `multiplyExact`.These take two integers as a argument and return the respective math operation as result or throw an `ArithmeticException` if overflow occurs.

For example `addExact` is implemented like this in Math.java:

    public static int addExact(int x, int y) {
      int r = x + y;
      if (((x ^ r) & (y ^ r)) < 0) {
        throw new ArithmeticException("integer overflow");
      }
      return r;
    }
    
The overflow check is very neat. Given `r = x + y`, overflow occurs if both arguments have the opposite sign of the result. This can happen in this two cases:

<table>
  <thead>
    <tr>
      <th style="background-color: #E5E5E5">Expression</th>
      <th style="background-color: #E5E5E5">Comment</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><pre>-r = (+x) + (+y)</pre></td>
      <td>x and y are both positive values</td>
    </tr>
    <tr>
      <td><pre>+r = (-x) + (-y)</pre></td>
      <td>x and y are both negative values </td>
    </tr>
  </tbody>
</table>

In two's complement a negative number has (at least) the most significant bit set to 1.The xor(`^`) is used to check if the arguments have the same sign of the result. (`x ^ r`) is a negative number(`1xxxxx`) when they have different sign, so if both (`x ^ r`) and (`y ^ r`) are negative (`1xxxxx & 1xxxxx` = `1xxxxx < 0`) they have both the opposite sign of the result.

The `subtractExact` and `multiplyExact` methods are implemented in a similar way. As you might have noticed there is no `divideExact` as division between integers truncate the result and it can never overflow (well,  it overflow only in this particular case `Integer.MIN_VALUE / -1` , and we decided to not support it. See the unary minus below for more details).

The Gosu compiler will invoke those static methods instead of generating the regular `ADD`, `SUB`, `MUL` instructions.

Historically compilers had an optional flag to turn on overflow checking for integer arithmetic, the reason it was not "on" by default is that you have a slight performance penalty by checking for overflow. While speed was paramount back in the 80s, with today hardware the price to pay for extra safety outweigh the cost. Unfortunately as there are already thousands of lines of Gosu code out there we opted for providing a compiler flag as well and give the option to the user. The flag is the Java system property: checkedArithmetic. This flag can be also turn on when launching Gosu from the command line: gosu -checkedArithmetic script.gsp

This approach is a everything or nothing proposition and it does not work well in practice. There are some rare cases in which you really want to exploit the "wrap around" behavior. The most prominent example is the `Object#hashCode` method. Turning on the compiler flag in your project could break all the methods that override `Object#hashCode`.

For this reason we decided to always compile the expression in the methods overriding `hasCode()` as unchecked. In the rare case integer overflow is needed elsewhere we provide the following unchecked arithmetic operators: `!+`, `!-`, `!*`.

You can have expression that mixed regular arithmetic operators and unchecked ones. When the compiler flag is off the unchecked operator `!+`, `!-`, `!*` will behave as the regular counterpart. Expressions involving boxed integers will also be checked depending on the compiler flags. The compound assignment and increment/decrement statements don't have an unchecked counterpart.

    var four = new Integer(4)
    var x = Integer.MAX_VALUE !* 2 + four
    print(x)   // it prints 2
    var y = Integer.MAX_VALUE  * 2 + four // it throws ArithmeticException
    
The unary minus(`-`) operator could potentially overflow as in two complement the range of possible values is not symmetric. For example a byte can assume values in this interval -128..127. If we negate -128:  -(-128)  we have an overflow. The JVM `NEG` instruction will evaluate -(-128) as -128 basically a  no op. The Java 8 math library does not provide a negateExact  but we decided to handle this case in Gosu with a subtraction: `-x` is equivalent to  `subtractExact(0, x)`.

The C# language has a similar feature controlled with a compiler flag as well. They decided to have checked and unchecked expressions and statements. Basically instead of having separate operators you can wrap an expression with checked or unchecked like this `unchecked(1+1)` or an entire block of code like this `checked { statements; }`

For information on the design process of the C# checked feature please read these excellent [blog](http://ericlippert.com/2015/04/09/what-is-the-unchecked-keyword-good-for-part-one/) [posts](http://ericlippert.com/2015/04/13/what-is-the-unchecked-keyword-good-for-part-two/) by Eric Lippert (He was the lead developer of the C# compiler and a member of the C# language design committee).






