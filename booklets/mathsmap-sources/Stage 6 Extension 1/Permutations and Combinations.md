+-------------------------------------------------------------------+
| Mathematics Extension 1 Year 11                                   |
+===================================================================+
| **Permutations &**                                                |
|                                                                   |
| **Combinations**                                                  |
+-------------------------------------------------------------------+

+-----------------------------------------+-----------------------------------------+-----------------------------------------+
| **Book 1**                              | Permutations & Combinations             | Version: 260305                         |
|                                         |                                         |                                         |
|                                         |                                         | Feedback:\                              |
|                                         |                                         | https://MrDingMaths.com                 |
+=========================================+=========================================+=========================================+
| **Contents**                                                                                                                |
|                                                                                                                             |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                                                                |
|                                                                                                                             |
| [Factorial Notation [3](#factorial-notation)](#factorial-notation)                                                          |
|                                                                                                                             |
| [Ordered Selections with Repetition [9](#ordered-selections-with-repetition)](#ordered-selections-with-repetition)          |
|                                                                                                                             |
| [Ordered Selections without Repetition (Permutations)                                                                       |
| [14](#ordered-selections-without-repetition-permutations)](#ordered-selections-without-repetition-permutations)             |
|                                                                                                                             |
| [Permutations with Restrictions [24](#permutations-with-restrictions)](#permutations-with-restrictions)                     |
|                                                                                                                             |
| [Permutations involving Grouping, Complements, and Cases                                                                    |
| [30](#permutations-involving-grouping-complements-and-cases)](#permutations-involving-grouping-complements-and-cases)       |
|                                                                                                                             |
| [Permutations with Identical Elements [39](#permutations-with-identical-elements)](#permutations-with-identical-elements)   |
|                                                                                                                             |
| [Arrangements around a Circle [46](#arrangements-around-a-circle)](#arrangements-around-a-circle)                           |
|                                                                                                                             |
| [Unordered Selections without Repetition (Combinations)                                                                     |
| [52](#unordered-selections-without-repetition-combinations)](#unordered-selections-without-repetition-combinations)         |
|                                                                                                                             |
| [Combination Proofs and Identities [66](#combination-proofs-and-identities)](#combination-proofs-and-identities)            |
|                                                                                                                             |
| [Probability and Mixed Applications [70](#probability-and-mixed-applications)](#probability-and-mixed-applications)         |
|                                                                                                                             |
| [Exam Questions [82](#exam-questions)](#exam-questions)                                                                     |
|                                                                                                                             |
| [Challenge Exercise [85](#challenge-exercise)](#challenge-exercise)                                                         |
+-----------------------------------------------------------------------------------------------------------------------------+

# Syllabus Content

**ME1-11-04** uses permutations and combinations to solve problems
involving counting, ordering and probability

- Use the notation $n!$ (read as $n$ factorial), where
  $n! = n(n - 1)(n - 2) \times \ldots \times 3 \times 2 \times 1$ for
  positive integers $n$

- Use $n! = n \times (n - 1)!$ and the convention $0! = 1$ in
  calculations and to simplify algebraic expressions involving
  factorials

- Establish and use the multiplication principle: if a selection can be
  made in two stages, where there are $m$ choices for the first stage
  and $n$ choices for the second stage then there are $m \times n$
  choices for the selection

- Apply the multiplication principle to explain why the number of ways
  of ordering $n$ distinct objects in a straight line is $n!$

- Define a permutation as an ordered selection of some or all objects
  from a set of distinct objects

- Use the notation$\ ^{n}P_{r}$ to represent an ordered selection of $r$
  objects from $n$ distinct objects and observe that$\ ^{n}P_{n} = n!$
  and$\ ^{n}P_{0} = 1$

- Use the multiplication principle to establish that the number of
  ordered selections of $r$ objects from $n$ distinct objects is
  $n(n - 1)(n - 2) \times \ldots \times (n - r + 1)$ and show
  that$\ ^{n}P_{r} = n(n - 1)(n - 2) \times \ldots \times (n - r + 1) = \frac{n!}{(n - r)!}$

- Solve problems involving permutations, including situations where the
  objects are not all distinct

- Solve problems involving permutations with restrictions on the
  placement of one or more objects

- Explain why the number of ways to arrange $n$ distinct objects in a
  circle is $(n - 1)!$

- Solve problems involving circular arrangements of distinct objects
  with or without restrictions on the placement of one or more objects

- Define a combination and use the notation$\ ^{n}C_{r}$ or
  $\begin{pmatrix}
  n \\
  r
  \end{pmatrix}$ to represent the number of ways of selecting a subset
  of $r$ objects from $n$ distinct objects, where order is not important

- Establish and use the formula$\ ^{n}C_{r} = \frac{n!}{r!(n - r)!}$ 

- Show that$\ ^{n}C_{n} = \ ^{n}C_{0} = 1$
  and$\ ^{n}C_{1} = \ ^{n}C_{n - 1} = n$

- Show that$\ ^{n}C_{r} = \ ^{n}C_{n - r}$, for $0 \leq r \leq n$ by
  selecting $r$ objects from $n$ distinct objects for inclusions and
  $n - r$ objects from $n$ distinct objects for exclusion

- Prove$\ ^{n}C_{r} = \ ^{n - 1}C_{r - 1} + \ ^{n - 1}C_{r}$ for
  $1 \leq r \leq n - 1$ algebraically and using combinatorial arguments

- Solve problems involving combinations with or without restrictions on
  the selection of one or more objects

- Solve problems involving both permutations and combinations, including
  problems which require consideration of cases

- Solve probability problems involving permutations and combinations

# Factorial Notation

+-------------------------------------------------------------------+
| - **Factorials**                                                  |
+===================================================================+
| Factorials let you quickly write products of descending whole     |
| numbers.                                                          |
|                                                                   |
| $n! = n \times (n - 1) \times (n - 2)\ldots \times 2 \times 1$    |
| For $n \in \{ 0,\ 1,\ 2,3\ldots\}$                                |
|                                                                   |
| - Mathematicians define $0! = 1$.                                 |
|                                                                   |
| - You can only have factorials of whole numbers; 1.5! is          |
|   undefined.                                                      |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| - **Interpret** Factorial notation                                                  |
+=====================================================================================+
| $5! = 5 \times 4 \times 3 \times 2 \times 1$                                        |
+-------------------------------------------------------------------------------------+
| $11! = 11 \times 10 \times 9 \times 8\ldots \times 2 \times 1$                      |
+-------------------------------------------------------------------------------------+
| $(n + 2)! = (n + 2) \times (n + 1) \times n \times (n - 1)\ldots \times 2 \times 1$ |
+-------------------------------------------------------------------------------------+
| Write out at least the first four factors of these factorials.                      |
+-------------------------------------------------------------------------------------+
| a.  7!                                                                              |
|                                                                                     |
| b.  29!                                                                             |
|                                                                                     |
| c.  932!                                                                            |
|                                                                                     |
| d.  $(n + 1)!$                                                                      |
|                                                                                     |
| e.  $(n - 2)!$                                                                      |
|                                                                                     |
| f.  $(n + r)!$                                                                      |
+-------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
| - **Factorials on a Calculator**                                                                                      |
+=======================================================================================================================+
| **FX-82 AU**                                                                                                          |
|                                                                                                                       |
| ![](media/Permutations and Combinations/media/image1.png){width="2.1875in"                                            |
| height="0.7708333333333334in"}![](media/Permutations and Combinations/media/image2.png){width="0.36363626421697287in" |
| height="0.32601924759405077in"}Use the button.                                                                        |
|                                                                                                                       |
| **FX-8200 AU**                                                                                                        |
|                                                                                                                       |
| ![](media/Permutations and Combinations/media/image3.png){width="2.6903893263342082in"                                |
| height="0.24975831146106736in"}                                                                                       |
+-----------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Recursive Definition of Factorials**                          |
+===================================================================+
| $$0! = 1$$                                                        |
|                                                                   |
| $n! = n \times (n - 1)!$ For $n \in \{ 0,\ 1,\ 2,3\ldots\}$       |
|                                                                   |
| For example,                                                      |
| $6! = 6 \times 5 \times 4 \times 3 \times 2 \times 1$             |
|                                                                   |
| $= 6 \times 5!$                                                   |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Unrolling Factorials**                                        |
+===================================================================+
| Simplifying factorial expressions usually involves \"unrolling\"  |
| them using the recursive definition.                              |
|                                                                   |
| $8! = 8 \times 7!$ (unrolling once)                               |
|                                                                   |
| $8! = 8 \times 7 \times 6!$ (unrolling twice)                     |
|                                                                   |
| $8! = 8 \times 7 \times 6 \times 5!$ (unrolling three times)      |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------+
| - **Unroll** factorials a given number of times.                                |
+=================================================================================+
| Unroll $5!$ once. $5! = 5 \times 4!$                                            |
+---------------------------------------------------------------------------------+
| Unroll $11!$ three times. $11! = 11 \times 10 \times 9 \times 8!$               |
+---------------------------------------------------------------------------------+
| Unroll $n!$ $r$ times.                                                          |
| $n! = n \times (n - 1) \times (n - 2)\ldots \times (n - r + 1) \times (n - r)!$ |
+---------------------------------------------------------------------------------+
| Unroll these factorials the given number of times.                              |
+---------------------------------------------------------------------------------+
| a.  Unroll 7! two times                                                         |
|                                                                                 |
| b.  Unroll 14! three times                                                      |
|                                                                                 |
| c.  Unroll 14! four times                                                       |
|                                                                                 |
| d.  Unroll 800! four times                                                      |
|                                                                                 |
| e.  Unroll 800! $r$ times                                                       |
|                                                                                 |
| f.  Unroll $(n + 2)!$ two times.                                                |
+---------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Simplify factorial expressions.                                                                                               |
+================================================================+============================================================================+
| $$\frac{10!}{7!}$$                                             | $$\frac{(n + 2)!}{(n - 1)!}$$                                              |
|                                                                |                                                                            |
| $$\frac{10!}{7!} = \frac{10 \times 9 \times 8 \times 7!}{7!}$$ | $$\frac{(n + 2)!}{(n - 1)!} = \frac{(n + 2)(n + 1)(n)(n - 1)!}{(n - 1)!}$$ |
|                                                                |                                                                            |
| $$\ \ \ \ \ \ \ \  = 10 \times 9 \times 8$$                    | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = (n + 2)(n + 1)n$$                   |
|                                                                |                                                                            |
| $$\ \ \ \ \ \ \ \  = 720$$                                     |                                                                            |
+----------------------------------------------------------------+----------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
| - **Practice**                                                           |
+===================================+======================================+
| a.  $\frac{13!}{10!}$             | b.  $\frac{26!}{27!}$                |
|                                   |                                      |
| 1716                              | $$\frac{1}{27}$$                     |
+-----------------------------------+--------------------------------------+
| c.  $\frac{(n - 2)!}{(n + 1)!}$   | d.  $\frac{n!}{(n - r)!\ }$          |
|                                   |                                      |
| $$\frac{1}{(n + 1)n(n - 1)}$$     | $$n(n - 1)(n - 2)\ldots(n - r + 1)$$ |
+-----------------------------------+--------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Simplify factorial expressions.                                                                                                                    |
+============================================================================+=====================================================================================+
| $$\frac{1}{8!} - \frac{1}{10!}$$                                           | $$\frac{1}{n!} + \frac{1}{(n + 1)!}$$                                               |
|                                                                            |                                                                                     |
| $$\frac{1}{8!} - \frac{1}{10!} = \frac{10 \times 9}{10!} - \frac{1}{10!}$$ | $$\frac{1}{n!} + \frac{1}{(n + 1)!} = \frac{n + 1}{(n + 1)!} + \frac{1}{(n + 1)!}$$ |
|                                                                            |                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{89}{10!}$$                    | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{n + 2}{(n + 1)!}$$   |
+----------------------------------------------------------------------------+-------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| - **Practice**                                                               |
+====================================+=========================================+
| a.  $\frac{1}{10!} - \frac{1}{9!}$ | b.  $\frac{1}{(n - 1)!} - \frac{1}{n!}$ |
|                                    |                                         |
| $$- \frac{9}{10!}$$                | $$\frac{n - 1}{n!}$$                    |
+------------------------------------+-----------------------------------------+

Foundation

1.  Use the definition of n! and methods of unrolling factorials to
    evaluate each expression. Do not use a calculator.

+-------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------+
| a.  3!                                                                        | b.  5!                                                                                                                                                                  | c.  1!                                                                                                                           |
|                                                                               |                                                                                                                                                                         |                                                                                                                                  |
| $$3!\  = \ 3\  \times \ 2\  \times \ 1\  = \ 6$$                              | $$5!\  = \ 5\  \times \ 4\  \times \ 3\  \times \ 2\  \times \ 1\  = \ 120$$                                                                                            | $$1!\  = \ 1$$                                                                                                                   |
+===============================================================================+===============================================================================+=========================================================================================+==================================================================================================================================+
| d.  $\frac{15!}{14!}$                                                         | e.  $\frac{10!}{8!\  \times \ 2!}$                                                                                                                                      | f.  $\frac{15!}{13!\  \times \ 3!}$                                                                                              |
|                                                                               |                                                                                                                                                                         |                                                                                                                                  |
| $$\frac{15!}{14!} = \frac{15\  \times \ 14!}{14!} = \ 15$$                    | $$\frac{10!}{8!\  \times \ 2!} = \frac{10\  \times \ 9\  \times \ 8!}{8!\  \times \ 2} = \frac{10\  \times \ 9}{2} = \ 45$$                                             | $$\frac{15!}{13!\  \times \ 3!} = \frac{15\  \times \ 14\  \times \ 13!}{13!\  \times \ 6} = \frac{15\  \times \ 14}{6} = \ 35$$ |
+-------------------------------------------------------------------------------+-------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------+
| g.  $\frac{12!}{3!\  \times \ 9!}$                                                                                                                            | h.  $\frac{8!}{4!\  \times \ 4!}$                                                                                                                                                                                          |
|                                                                                                                                                               |                                                                                                                                                                                                                            |
| $$\frac{12!}{3!\  \times \ 9!} = \frac{12\  \times \ 11\  \times \ 10\  \times \ 9!}{6\  \times \ 9!} = \frac{12\  \times \ 11\  \times \ 10}{6} = \ 220$$    | $$\frac{8!}{4!\  \times \ 4!} = \frac{8\  \times \ 7\  \times \ 6\  \times \ 5\  \times \ 4!}{24\  \times \ 4!} = \frac{8\  \times \ 7\  \times \ 6\  \times \ 5}{24} = \ 70$$                                             |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

2.  Use the factorial button n! on your calculator to evaluate each
    expression.

+----------------------+--------------------------------------------------+----------------------------------------------------------------+
| a.  7!               | b.  0!                                           | c.  10!                                                        |
|                      |                                                  |                                                                |
| $$5040$$             | $$1$$                                            | $$3\ 628\ 800$$                                                |
+======================+==================================================+================================================================+
| d.  $\frac{8!}{3!}$  | e.  $\frac{10!}{5!\  \times \ 3!\  \times \ 2!}$ | f.  $\frac{12!}{2!\  \times \ 3!\  \times \ 4!\  \times \ 5!}$ |
|                      |                                                  |                                                                |
| $$6720$$             | $$2520$$                                         | $$13\ 860$$                                                    |
+----------------------+--------------------------------------------------+----------------------------------------------------------------+

3.  If $f(x)\  = \ x⁶$, find expressions for:

+----------------------+----------------------+----------------------+
| a.  $f'(x)$          | b.  $f^{''}(x)$      | c.  $f'''(x)$        |
|                      |                      |                      |
| $$6x^{5}$$           | $$30x⁴$$             | $$120x³$$            |
+======================+======================+======================+
| d.  $f^{(4)}(x)$     | e.  $f^{(5)}(x)$     | f.  $f^{(6)}(x)$     |
|                      |                      |                      |
| $$360x²$$            | $$720x$$             | $$720$$              |
+----------------------+----------------------+----------------------+

4.  Simplify by unrolling factorials appropriately:

+----------------------------------------------------+----------------------------------------------------+------------------------------------------------------------+
| a.  $\frac{n!}{(n - 1)!}$                          | b.  $n\  \times \ (n - 1)!$                        | c.  $\frac{n(n - 1)!}{n!}$                                 |
|                                                    |                                                    |                                                            |
| $$\frac{n(n - 1)!}{(n - 1)!} = \ n$$               | $$\ n!$$                                           | $$\frac{n(n - 1)!}{n(n - 1)!} = \ 1$$                      |
+====================================================+====================================================+============================================================+
| d.  $\frac{(n + 1)!}{(n - 1)!}$                    | e.  $\frac{(n + 2)!}{n!}$                          | f.  $\frac{(n - 2)!}{n!}$                                  |
|                                                    |                                                    |                                                            |
| $$\frac{(n + 1)n(n - 1)!}{(n - 1)!} = \ n(n + 1)$$ | $$\frac{(n + 2)(n + 1)n!}{n!} = \ (n + 1)(n + 2)$$ | $$\frac{(n - 2)!}{n(n - 1)(n - 2)!} = \frac{1}{n(n - 1)}$$ |
+----------------------------------------------------+----------------------------------------------------+------------------------------------------------------------+

Development

5.  Simplify:

+-----------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------+
| a.  $\frac{(n - 2)!(n - 1)!}{n!(n - 3)!}$                                                                                         | b.  $\frac{n!(n - 1)!}{(n + 1)!}$                         |
|                                                                                                                                   |                                                           |
| $$\frac{(n - 2)!(n - 1)!}{n(n - 1)!(n - 3)!} = \frac{(n - 2)!}{n(n - 3)!} = \frac{(n - 2)(n - 3)!}{n(n - 3)!} = \frac{n - 2}{n}$$ | $$\frac{n!(n - 1)!}{(n + 1)n!} = \frac{(n - 1)!}{n + 1}$$ |
+===================================================================================================================================+===========================================================+

6.  Simplify by factorising:

+------------------------------------------------------+-------------------------------------------------------------------------------+---------------------------------------------------------------------------------+
| a.  8! - 7!                                          | b.  (n+1)! - n!                                                               | c.  8! + 6!                                                                     |
|                                                      |                                                                               |                                                                                 |
| $$8(7!) - \ 7!\  = \ 7!(8 - 1) = \ 7\  \times \ 7!$$ | $$(n + 1)n!\  - \ n!\  = \ n!\left( (n + 1) - 1 \right) = \ n\  \times \ n!$$ | $$8\  \times \ 7\  \times \ 6!\  + \ 6!\  = \ 6!(56 + 1) = \ 57\  \times \ 6!$$ |
+======================================================+===============================================================================+=================================================================================+
| d.  (n+1)! + (n-1)!                                  | e.  9! + 8! + 7!                                                              | f.  (n+1)! + n! + (n-1)!                                                        |
|                                                      |                                                                               |                                                                                 |
| $$(n + 1)n(n - 1)!\  + \ (n - 1)!\ $$                | $$9\  \times \ 8\  \times \ 7!\  + \ 8\  \times \ 7!\  + \ 7!\ $$             | $$(n + 1)n(n - 1)!\  + \ n(n - 1)!\  + \ (n - 1)!\ \ $$                         |
|                                                      |                                                                               |                                                                                 |
| $$= \ (n - 1)!\left( (n + 1)n + 1 \right)$$          | $$= \ 7!(72 + 8 + 1)$$                                                        | $$= \ (n - 1)!\left( (n + 1)n + n + 1 \right)$$                                 |
|                                                      |                                                                               |                                                                                 |
| $$= \ (n² + n + 1)\  \times \ (n - 1)!$$             | $$= \ 9^{2} \times \ 7!$$                                                     | $$= \ (n + 1)^{2} \times \ (n - 1)!$$                                           |
+------------------------------------------------------+-------------------------------------------------------------------------------+---------------------------------------------------------------------------------+

7.  Write each expression as a single fraction.

+----------------------------------------------------+----------------------------------------------------------------------+----------------------------------------------------+
| a.  $\frac{1}{n!} + \frac{1}{(n - 1)!}$            | b.  $\frac{1}{n!} - \frac{1}{(n + 1)!}$                              | c.  $\frac{1}{(n + 1)!} - \frac{1}{(n - 1)!}$      |
|                                                    |                                                                      |                                                    |
| $$\frac{1}{n!} + \frac{n}{n!} = \frac{1 + n}{n!}$$ | $$\frac{n + 1}{(n + 1)!} - \frac{1}{(n + 1)!} = \frac{n}{(n + 1)!}$$ | $$\frac{1}{(n + 1)!} - \frac{n(n + 1)}{(n + 1)!}$$ |
|                                                    |                                                                      |                                                    |
|                                                    |                                                                      | $$= \frac{1 - n(n + 1)}{(n + 1)!}$$                |
|                                                    |                                                                      |                                                    |
|                                                    |                                                                      | $$= \frac{1 - n - n^{2}}{(n + 1)!}$$               |
+====================================================+======================================================================+====================================================+

8.  If $f(x)\  = \ xⁿ$, find:

+----------------+----------------------+------------------+---------------------------------------------------+
| a.  $f'(x)$    | b.  $f^{''}(x)$      | c.  $f^{(n)}(x)$ | d.  $f^{(k)}(x),$ $k \leq n$                      |
|                |                      |                  |                                                   |
| $$nxⁿ⁻¹$$      | $$n(n - 1)xⁿ^{- 2}$$ | $$\ n!\ $$       | $$n(n - 1)(n - 2)\ldots(n - k + 1)xⁿ^{-}ᵏ\ $$     |
|                |                      |                  |                                                   |
|                |                      |                  | $$= \ \left( \frac{n!}{(n - k)!} \right)xⁿ^{-}ᵏ$$ |
+================+======================+==================+===================================================+

9.  If $f(x) =$ $\frac{1}{x}$, find:

+--------------------------+---------------------------------------------+-----------------------------------------------+----------------------------------------------+
| a.  $f'(x)$              | b.  $f^{''}(x)$                             | c.  $f^{(5)}(x)$                              | d.  $f^{(n)}(x)$                             |
|                          |                                             |                                               |                                              |
| $$- 1\  \times \ x⁻²\ $$ | $$( - 1)^{2} \times 2!\  \times \ x^{- 3}$$ | $$( - 1)^{5} \times \ 5!\  \times \ x^{- 6}$$ | $$( - 1)ⁿ\  \times \ n!\  \times \ x⁻⁽ⁿ⁺¹⁾$$ |
+==========================+=============================================+===============================================+==============================================+

10. a.  Show that $k\  \times \ k!\  = \ (k + 1)!\  - \ k!$

$$RHS\  = \ (k + 1)!\  - \ k!\ $$

$$= \ (k + 1)k!\  - \ k!\ $$

$$= \ k!\left( (k + 1) - 1 \right)$$

$$= \ k\  \times \ k!\ $$

b.  Hence by considering each individual term as a difference of two
    terms, sum the series

1 × 1! + 2 × 2! + 3 × 3! + \... + n × n!

1 × 1! = 2! - 1!

2 × 2! = 3! - 2!

3 × 3! = 4! - 3!

n × n! = (n+1)! - n!

so, $(2! - 1!) + (3! - 2!) + (4! - 3!)\ldots(n + 1)! - n!$

Every term cancels except $(n + 1)! - 1!$

11. Find the largest power of 2 that is a factor of 10!

Consider prime factorisation of each factor in 10!

$$10! = 1 \times 2 \times 3 \times 2^{2} \times 5 \times 2(3) \times 7 \times 2^{3} \times 3^{2} \times 2(5) = 2^{8} \times 3^{4} \times 5^{2} \times 7$$

$$\therefore 2^{8}$$

12. Find the largest power of 10 that is a factor of 10!

$$10 = 2(5)$$

$$10! = 2^{8} \times 3^{4} \times 5^{2} \times 7$$

You can make 2 lots of $(2 \times 5)$, so $10^{2}$ is the highest factor

13. Find the largest power of 5 that is a factor of 100!

Consider multiples of 5 in 100!:

There are 20 multiples of 5: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
60, 65, 70, 75, 80, 85, 90, 95, 100

Four of these are multiples of 25: 25, 50, 75, 100

20 multiples of 5 contribute 20 factors of 5.

4 multiples of 25 contribute 4 additional factors of 5.

Total = 20 + 4 = 24 factors of 5.

$\therefore 5^{24}$ is the highest factor.

# Ordered Selections with Repetition

+-------------------------------------------------------------------+
| - **Fundamental Counting Principle**                              |
+===================================================================+
| If one event can occur in $\mathbf{m}$ ways and another event can |
| occur in $\mathbf{n}$ ways,\                                      |
| then both events can occur in $\mathbf{m\  \times \ n}$ ways.     |
|                                                                   |
| This is also called the **multiplication principle**. You have    |
| used this in probability calculations.                            |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Calculate** total number of outcomes.                         |
+===================================================================+
| a.  Timmy has two shirts and three trousers.\                     |
|     How many outfit combinations can he have?                     |
|                                                                   |
| $2 \times 3 = 6$                                                  |
+-------------------------------------------------------------------+
| b.  Tammy has three shirts and five skirts.\                      |
|     How many outfit combinations can she have?                    |
+-------------------------------------------------------------------+
| c.  A restaurant offers a three-course set menu.                  |
|                                                                   |
| Starter: 3 options \| Main: 5 options \| Dessert: 2 options       |
|                                                                   |
| How many meal combinations are there?                             |
+-------------------------------------------------------------------+
| d.  A student ID has six characters. It starts with an English    |
|     letter and has five digits.                                   |
|                                                                   |
| How many students can this ID system support?                     |
+-------------------------------------------------------------------+
| e.  A dice is rolled and a coin is flipped.                       |
|                                                                   |
| How many possible outcomes are there?                             |
+-------------------------------------------------------------------+
| f.  Two dice are rolled and a coin is flipped.                    |
|                                                                   |
| How many possible outcomes are there?                             |
+-------------------------------------------------------------------+
| - **The "Box Method"**                                            |
+-------------------------------------------------------------------+
| Visualise counting problems by placing objects into compartments. |
|                                                                   |
| This helps you organise complex counting questions. Think of each |
| compartment as a separate choice, then work out how many ways you |
| can fill each one.                                                |
|                                                                   |
| 1\. Set up boxes in the order of your choices.                    |
|                                                                   |
| 2\. Determine how many ways you can fill each box.                |
|                                                                   |
| 3\. Multiply all the numbers together.                            |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Ordered Selections with Repetition**                          |
+===================================================================+
| Counting ordered selections with repetition uses repeated         |
| multiplication, so you can calculate them quickly with powers.    |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------+
| - **Example** Count total number of ordered selections with repetition. |
+=====================================+===================================+
| The number plate on a car has 2     | The digits 1 to 9 are used, with  |
| letters, followed by 4 numbers.\    | repetition, to make a five-digit  |
| How many different number plates of | even number such that it          |
| this type are possible?             | alternates between even and odd   |
|                                     | numbers.                          |
|   -----------------------------     |                                   |
|    L    L    N    N    N    N       | How many different numbers are    |
|   ---- ---- ---- ---- ---- ----     | possible?                         |
|    26   26   10   10   10   10      |                                   |
|                                     |   ------------------------        |
|   -----------------------------     |    E    O    E    O    E          |
|                                     |   ---- ---- ---- ---- ----        |
| $$26^{2} \times 10^{3} = 676\ 000$$ |    4    5    4    5    4          |
|                                     |                                   |
|                                     |   ------------------------        |
|                                     |                                   |
|                                     | $$4^{3} \times 5^{2} = 1600$$     |
+-------------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| How many five-letter words can be | A serial code involves 5 letters  |
| formed where the second and       | at the start and then 15 numbers. |
| fourth letters are vowels, and    | How many different serial codes   |
| the other three letters are       | are possible?                     |
| consonants?                       |                                   |
|                                   | $$26^{5} \times 10^{15}$$         |
| $$5^{2} \times 21^{3}$$           |                                   |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  You can arrange $r$ items from $n$ possibilities (reusing     |
|     allowed) in ......... ways.                                   |
+-------------------------------------------------------------------+

Foundation

1.  A password has 4 letters. How many passwords are possible?

  -------------------
  L    L    L    L
  ---- ---- ---- ----
  26   26   26   26

  -------------------

26⁴ = 456976

2.  A motorcycle number plate is made up of 2 letters followed by 2
    numbers.\
    How many number plates of this type are available?

  -------------------
  L    L    N    N
  ---- ---- ---- ----
  26   26   10   10

  -------------------

26² × 10² = 67600

3.  A password has 5 letters followed by 4 numbers. If I could use any
    letter of the alphabet and any number, how many different passwords
    could be formed?\
    Leave your answer in index form.

  --------------------------------------------
  L    L    L    L    L    N    N    N    N
  ---- ---- ---- ---- ---- ---- ---- ---- ----
  26   26   26   26   26   10   10   10   10

  --------------------------------------------

26⁵ × 10⁴

4.  A witness saw most of the number plate made up of 2 letters and two
    numbers on a getaway car except for the first letter and the last
    number. How many different cars do the police need to check in order
    to find this car?

  -----------------
  ?    L   N   ?
  ---- --- --- ----
  26   1   1   10

  -----------------

26 × 10 = 260

5.  A certain brand of computer has a serial number made up of 10
    letters then 15 numbers. How many computers with this type of serial
    number can be made? Leave your answer in index form.

26¹⁰ × 10¹⁵

6.  Victoria has 4-digit postcodes starting with 3.\
    How many different postcodes are available in Victoria?

  ------------------
  3   N    N    N
  --- ---- ---- ----
  1   10   10   10

  ------------------

10³ = 1000

7.  A country town has telephone numbers starting with 63 followed by
    any 6 other numbers from 0 to 9. How many telephone numbers are
    possible in this town?

  -------------------------------------
  6   3   N    N    N    N    N    N
  --- --- ---- ---- ---- ---- ---- ----
  1   1   10   10   10   10   10   10

  -------------------------------------

10⁶ = 1000000

8.  Jarred has 12 tops, 5 pairs of jeans and 5 pairs of shoes in his
    wardrobe.\
    If he chooses a top, a pair of jeans and shoes at random, how many
    combinations are possible?

12 × 5 × 5 = 300

9.  A car manufacturer produces cars in 8 different colours, with either
    manual or automatic gear transmission, and 4 different types of
    wheels. How many different combinations can it produce?

8 × 2 × 4 = 64

10. A city has a population of 3 500 000. How many digits should its
    telephone numbers have so that every person can have one?

Need $10ⁿ\  \geq \ 3500000$

$$n = 7$$

11. A manufacturer of computer parts puts a serial number on each part,
    consisting of 3 letters, 4 numbers, then 4 letters. The number of
    parts sold is estimated to be 5 million. Will there be enough
    combinations on this serial number to cope with these sales?

26⁷ × 10⁴ \> 5 000 000

yes

12. A family of 5 people each choose a flavour of ice cream from
    vanilla, strawberry and chocolate. In how many ways can this happen?

3⁵ = 243

13. How many three-digit numbers can be written down from the digits 0
    to 9?\
    The digits need not be distinct.

Three-digit numbers cannot start with 0

  -------------
  N   N    N
  --- ---- ----
  9   10   10

  -------------

$9 \times 10^{2}$ = 900

14. One hundred people each buy one ticket in a lottery. Tickets are
    selected one by one at random from a barrel and then replaced
    between selections. How many ways can the first three places be
    awarded?

  -----------------
  P     P     P
  ----- ----- -----
  100   100   100

  -----------------

100³ = 1000000

15. A computer sends a string of ten binary digits, that is, each symbol
    can only be 0 or 1.\
    How many such ten-digit strings are possible?

  ---------------------------------------
  B   B   B   B   B   B   B   B   B   B
  --- --- --- --- --- --- --- --- --- ---
  2   2   2   2   2   2   2   2   2   2

  ---------------------------------------

2¹⁰ = 1024

Development

16. a.  If you toss a coin and roll a die, how many outcomes are
        possible?

  -------
  C   D
  --- ---
  2   6

  -------

$$2 \times 6 = 12$$

b.  If you toss two coins and roll three dice, how many outcomes are
    possible?

  -------------------
  C   C   D   D   D
  --- --- --- --- ---
  2   2   6   6   6

  -------------------

$$2^{2} \times 6^{3} = 864$$

17. Users of automatic teller machines are required to enter a
    four-digit PIN. Find how many PINs:

    a.  are possible,

10⁴ = 10000

b.  consist of four distinct digits,

10 × 9 × 8 × 7 = 5040

c.  consist of odd digits only,

5⁴ = 625

d.  start and end with the same digit.

10 × 10 × 10 × 1 = 1000

18. In Sydney, landline phone numbers, ignoring the area code, consist
    of eight digits.\
    Let us consider those starting with the digit 8 or 9.

    a.  How many such phone numbers are possible?

  ---------------------------------------
  8 or N    N    N    N    N    N    N
  9                                  
  ---- ---- ---- ---- ---- ---- ---- ----
  2    10   10   10   10   10   10   10

  ---------------------------------------

2 × 10⁷

b.  How many of these end in an odd number?

5 odd digits: 1, 3, 5, 7, 9

  --------------------------------------
  8 or N    N    N    N    N    N    O
  9                                  
  ---- ---- ---- ---- ---- ---- ---- ---
  2    10   10   10   10   10   10   5

  --------------------------------------

2 × 10⁶ × 5 = 10⁷

c.  How many consist of odd digits only?

First digit must be 9

  -------------------------------
  9   O   O   O   O   O   O   O
  --- --- --- --- --- --- --- ---
  1   5   5   5   5   5   5   5

  -------------------------------

5⁷ = 78125

d.  How many are there that do not contain a zero, and in which the
    consecutive digits alternate between odd and even? (Hint: you need
    to consider 2 cases)

+-----------------------------------+-----------------------------------+
| Starting with 9                   | Starting with 8                   |
|                                   |                                   |
|   ------------------------------- |   ------------------------------- |
|   8   O   E   O   E   O   E   O   |   9   E   O   E   O   E   O   E   |
|   --- --- --- --- --- --- --- --- |   --- --- --- --- --- --- --- --- |
|   1   5   4   5   4   5   4   5   |   1   4   5   4   5   4   5   4   |
|                                   |                                   |
|   ------------------------------- |   ------------------------------- |
|                                   |                                   |
| 5⁴ × 4³ = 625 × 64 = 40000        | 4⁴ × 5³ = 256 × 125 = 32000       |
|                                   |                                   |
|                                   | Total: 72 000                     |
+===================================+===================================+

# Ordered Selections without Repetition (Permutations)

+---------------------------------------------------------------------------+
| - **Investigation** Ordered selections without repetition.                |
+===========================================================================+
| How many ways can you arrange 4 people in a line?                         |
|                                                                           |
| Let the four people be A B C D.                                           |
|                                                                           |
| **Method 1: List them out systematically**                                |
|                                                                           |
|   -------------------------------------------------------------------     |
|   A ... ... ...    B ... ... ...    C ... ... ...    D ... ... ...        |
|   ...              ...              ...              ...                  |
|   ---------------- ---------------- ---------------- ----------------     |
|                                                                           |
|   -------------------------------------------------------------------     |
|                                                                           |
| Each of these rearrangements is called a p........................        |
|                                                                           |
| **Method 2: Box method.**                                                 |
|                                                                           |
| How many ways can you choose the first person in the queue?               |
|                                                                           |
| How many ways can you choose the second person?                           |
|                                                                           |
| How many ways can you choose the third person?                            |
|                                                                           |
| How many ways can you choose the fourth person?                           |
|                                                                           |
|   -------------------------------                                         |
|    1^st^   2^nd^   3^rd^   4^th^                                          |
|   ------- ------- ------- -------                                         |
|                                                                           |
|                                                                           |
|   -------------------------------                                         |
|                                                                           |
| Total number of ways: ............                                        |
|                                                                           |
| This is an example of making an **ordered selection** **without           |
| repetition.**                                                             |
|                                                                           |
| For ordered selections without repetition with $n$ elements,              |
|                                                                           |
| The answer is                                                             |
| $n \times (n - 1) \times (n - 2) \times (n - 3)\ldots \times 2 \times 1$. |
+---------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Permutations**                                                |
+===================================================================+
| A **permutation** is an **ordered** arrangement of distinct       |
| elements from a set without repetition.                           |
|                                                                   |
| Use factorials permutations, since available objects decrease by  |
| 1 at each stage.                                                  |
|                                                                   |
| The number of ways to arrange $n$ distinct objects in a line is   |
| $n!$                                                              |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------+
| - **Example** Count total number of ordered selections without repetition.                        |
+============================================+======================================================+
| How many ways are there to arrange 4       | How many ways can the letters in MATHS be arranged?  |
| different books on a shelf?                |                                                      |
|                                            |   ------------------------                           |
|   -------------------                      |    L1   L2   L3   L4   L5                            |
|    B1   B2   B3   B4                       |   ---- ---- ---- ---- ----                           |
|   ---- ---- ---- ----                      |    5    4    3    2    1                             |
|    4    3    2    1                        |                                                      |
|                                            |   ------------------------                           |
|   -------------------                      |                                                      |
|                                            | $$5 \times 4 \times 3 \times 2 \times 1 = 5! = 120$$ |
| $$4 \times 3 \times 2 \times 1 = 4! = 24$$ |                                                      |
+--------------------------------------------+------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| a.  How many ways can 6 different | b.  How many ways can the letters |
|     students stand in a line?     |     in GENIUS be arranged?        |
|                                   |                                   |
| $$6! = 720$$                      | $6!\  = 720$                      |
+-----------------------------------+-----------------------------------+
| c.  How many ways can 20 people   | d.  How many ways can 10 people   |
|     form a queue?                 |     form a queue, if Maddie must  |
|                                   |     be first?                     |
| $$2.432902008 \times 10^{18}$$    |                                   |
|                                   | $$9! = 362\ 880$$                 |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  You can arrange $n$ elements in a line without repetition in  |
|     ......... ways.                                               |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Investigation** Ordered Selections without Repetition chosen  |
|   from a Larger Set                                               |
+===================================================================+
| How many ways can a club of 16 members select a committee         |
| consisting of a president, vice president, treasurer and          |
| secretary?                                                        |
|                                                                   |
|   -----------------------                                         |
|     P    VP     T     S                                           |
|   ----- ----- ----- -----                                         |
|                                                                   |
|                                                                   |
|   -----------------------                                         |
|                                                                   |
| Would 16! be the correct way to answer this?                      |
| .........................................................         |
|                                                                   |
| Consider that:                                                    |
|                                                                   |
| $16! = 16 \times 15 \times 14 \times 13 \times 12!$               |
|                                                                   |
| Therefore, by rearranging, we can express:                        |
|                                                                   |
| $16 \times 15 \times 14 \times 13 =$                              |
+-------------------------------------------------------------------+
| How many ways can a club of 20 members select a committee         |
| consisting of a president, vice president, treasurer and          |
| secretary?                                                        |
|                                                                   |
|   -----------------------                                         |
|     P    VP     T     S                                           |
|   ----- ----- ----- -----                                         |
|                                                                   |
|                                                                   |
|   -----------------------                                         |
+-------------------------------------------------------------------+
| How many ways can a club of 20 members select a committee         |
| consisting of a president, vice president, treasurer, secretary,  |
| and janitor?                                                      |
|                                                                   |
|   -----------------------------                                   |
|     P    VP     T     S     J                                     |
|   ----- ----- ----- ----- -----                                   |
|                                                                   |
|                                                                   |
|   -----------------------------                                   |
+-------------------------------------------------------------------+
| How many ways can a club of $n$ members select a committee        |
| consisting of $r$ positions?                                      |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Permutations of Subsets**                                     |
+===================================================================+
| To arrange $r$ objects from a set of $n$ objects:                 |
|                                                                   |
| $$\ ^{n}P_{r} = \frac{n!}{(n - r)!}$$                             |
|                                                                   |
| - $\ ^{n}P_{n} = n!$                                              |
|                                                                   |
| - $\ ^{n}P_{0} = 1$                                               |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------+
| - **Interpret** Permutation notation.                                                                     |
+===================================================+===========================+===========================+
| Write an expression for:                                                                                  |
+---------------------------------------------------+---------------------------+---------------------------+
| a.  $\ ^{6}P_{2}$                                 | b.  $\ ^{10}P_{2}$        | c.  $\ ^{10}P_{3}$        |
|                                                   |                           |                           |
| $$\ \ \ \ \ \ \ \  = 6 \times 5 = \frac{6!}{4!}$$ |                           |                           |
+---------------------------------------------------+---------------------------+---------------------------+
| d.  $\ ^{10}P_{10}$                               | e.  $\ ^{n}P_{3}$         | f.  $\ ^{n + 1}P_{3}$     |
+---------------------------------------------------+---------------------------+---------------------------+
| Write the following using permutation notation.                                                           |
+---------------------------------------------------+---------------------------+---------------------------+
| a.  $9 \times 8$                                  | b.  $9 \times 8 \times 7$ | c.  $7 \times 6 \times 5$ |
|                                                   |                           |                           |
| $$\ \ \ \ \ \ \ \  = \ ^{9}P_{2}$$                |                           |                           |
+---------------------------------------------------+---------------------------+---------------------------+
| d.  $n(n - 1)(n - 2)$                             | e.  $(n - 4)(n - 5)$      | f.  $5$                   |
+---------------------------------------------------+---------------------------+---------------------------+

+----------------------------------------------------------------------------------------------------------------------+
| - **Permutation Notation on a Calculator**                                                                           |
+======================================================================================================================+
| **FX-82 AU**                                                                                                         |
|                                                                                                                      |
| ![](media/Permutations and Combinations/media/image4.png){width="2.1875in"                                           |
| height="0.7708333333333334in"}![](media/Permutations and Combinations/media/image5.png){width="0.8208092738407698in" |
| height="0.29485345581802275in"}                                                                                      |
|                                                                                                                      |
| **FX-8200 AU**                                                                                                       |
|                                                                                                                      |
| ![](media/Permutations and Combinations/media/image6.png){width="2.8394542869641293in"                               |
| height="0.23699365704286965in"}                                                                                      |
+----------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------+
| - **Example** Count total number of permutation arrangements.             |
+===================================+=======================================+
| How many two-letter codes can be  | How many 3-digit numbers from the     |
| formed from the letters A B C D E | digits 1 to 9 are possible if you     |
| without repetition?               | cannot repeat a digit?                |
|                                   |                                       |
|   ---------------                 |   -----------------------             |
|    1^st^   2^nd^                  |    1^st^   2^nd^   3^rd^              |
|   ------- -------                 |   ------- ------- -------             |
|      5       4                    |      9       8       7                |
|                                   |                                       |
|   ---------------                 |   -----------------------             |
|                                   |                                       |
| $$\ ^{5}P_{2} = 5 \times 4$$      | $$\ ^{9}P_{3} = 9 \times 8 \times 7$$ |
|                                   |                                       |
| $= 20$                            | $= 504$                               |
+-----------------------------------+---------------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| a.  How many four-letter words    | b.  A bookshelf has space for 5   |
|     can you form from the letters |     books. You have 8 different   |
|     Q U I C K L Y without         |     books to choose from. How     |
|     replacing the letters?        |     many ways can you arrange 5   |
|                                   |     books on the shelf?           |
| $$7P4 = 840$$                     |                                   |
|                                   | $$8P5 = 6720$$                    |
+-----------------------------------+-----------------------------------+
| c.  A committee of chairperson,   | d.  A chess manager selects 3     |
|     secretary, and undersecretary |     players to play in a specific |
|     is to be formed from a group  |     order from a team of 6. How   |
|     of 15 people. How many ways   |     many ways is this possible?   |
|     can you form this committee?  |                                   |
|                                   | $$6P3 = 120$$                     |
| $$15P3 = 2730$$                   |                                   |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  A permutation refers to an o............... arrangement of    |
|     d............ elements from a l............ set.              |
|                                                                   |
| 2.  The notation $\ ^{11}P_{4}$ means .....................       |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------+
| - **Investigation**                                                                             |
+=================================================================================================+
| On a school trip, you have 5 single-bed hotel rooms, A B C D E, and 2 students, X Y.\           |
| How many ways can you assign the students to a room?                                            |
|                                                                                                 |
| ![A cartoon of a child AI-generated content may be                                              |
| incorrect.](media/Permutations and Combinations/media/image7.png){width="0.5604166666666667in"  |
| height="0.8243055555555555in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image8.png){width="0.6298611111111111in"  |
| height="0.83125in"}                                                                             |
|                                                                                                 |
| **If position matters, consider the question as ordering in a line\                             |
| (the hotel rooms themselves may not be in a straight line)**                                    |
|                                                                                                 |
| For each student, consider how many room choices they have and multiply.                        |
|                                                                                                 |
| You can place student X in ......... possible rooms.                                            |
|                                                                                                 |
| You can then place Student Y in ......... possible rooms.                                       |
|                                                                                                 |
|   ---------                                                                                     |
|    X    Y                                                                                       |
|   ---- ----                                                                                     |
|                                                                                                 |
|                                                                                                 |
|   ---------                                                                                     |
|                                                                                                 |
| On a school trip, you have 2 single-bed hotel rooms, A B, and 5 students, V W X Y Z.            |
|                                                                                                 |
| How many ways can you assign the students to a room?                                            |
|                                                                                                 |
| ![A cartoon of a child AI-generated content may be                                              |
| incorrect.](media/Permutations and Combinations/media/image9.png){width="0.58125in"             |
| height="0.7666666666666667in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image10.png){width="0.5840277777777778in" |
| height="0.7645833333333333in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image11.png){width="0.5229166666666667in" |
| height="0.7763888888888889in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image12.png){width="0.5701388888888889in" |
| height="0.7805555555555556in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image13.png){width="0.5166666666666667in" |
| height="0.7604166666666666in"}                                                                  |
|                                                                                                 |
| For each room, consider how many ways you can fill it.                                          |
|                                                                                                 |
| You can fill room A with ......... possible students.                                           |
|                                                                                                 |
| You can then fill room B with ......... possible students.                                      |
|                                                                                                 |
|   ---------                                                                                     |
|    A    B                                                                                       |
|   ---- ----                                                                                     |
|                                                                                                 |
|                                                                                                 |
|   ---------                                                                                     |
|                                                                                                 |
| **Key idea:**                                                                                   |
|                                                                                                 |
| The number of ways to arrange 2 objects into 5 positions is the same as arranging 5 objects     |
| into 2 positions, both are $\ ^{5}P_{2}$.                                                       |
+-------------------------------------------------------------------------------------------------+

Foundation

1.  List all the permutations of the letters of the word DOG. How many
    are there?

Permutations: DOG, DGO, ODG, OGD, GOD, GDO

There are 3! = 6

2.  Each of 6 people at a restaurant is given a different-coloured
    glass.\
    How many possible combinations are there?

  -----------------------------------
  1st   2nd   3rd   4th   5th   6th
  ----- ----- ----- ----- ----- -----
  6     5     4     3     2     1

  -----------------------------------

⁶P₆ = 6! = 6 × 5 × 4 × 3 × 2 × 1 = 720

3.  A mountain trail has room for only one person at a time.\
    If 12 people are waiting at the bottom of the trail and are picked
    at random to start out,\
    in how many ways can this happen?

  -------------------------------
  1st   2nd   3rd   \...   12th
  ----- ----- ----- ------ ------
  12    11    10    \...   1

  -------------------------------

¹²P₁₂ = 12! = 479001600

4.  A dog walker has 5 dogs and 5 leashes.\
    In how many different ways is it possible to put a leash on each
    dog?

  -----------------------------
  1st   2nd   3rd   4th   5th
  ----- ----- ----- ----- -----
  5     4     3     2     1

  -----------------------------

⁵P₅ = 5! = 5 × 4 × 3 × 2 × 1 = 120

5.  A row of seats in a theatre seats 8 people.\
    In how many ways could a group of 8 friends be seated at random in
    this row?

  -----------------------------------------------
  1st   2nd   3rd   4th   5th   6th   7th   8th
  ----- ----- ----- ----- ----- ----- ----- -----
  8     7     6     5     4     3     2     1

  -----------------------------------------------

⁸P₈ = 8! = 8 × 7 × 6 × 5 × 4 × 3 × 2 × 1 = 40320

6.  A group of 7 people line up to do karaoke.\
    If they are each given a song at random to sing, how many possible
    outcomes are there?

  -----------------------------------------
  1st   2nd   3rd   4th   5th   6th   7th
  ----- ----- ----- ----- ----- ----- -----
  7     6     5     4     3     2     1

  -----------------------------------------

⁷P₇ = 7! = 7 × 6 × 5 × 4 × 3 × 2 × 1 = 5040

7.  Find how many four-digit numbers can be formed using the digits 5,
    6, 7, 8 and 9 if:

    a.  no digit is to be repeated,

  -----------------------
  1st   2nd   3rd   4th
  ----- ----- ----- -----
  5     4     3     2

  -----------------------

⁵P₄ = 5 × 4 × 3 × 2 = 120

b.  any of the digits can occur more than once.

  -----------------------
  1st   2nd   3rd   4th
  ----- ----- ----- -----
  5     5     5     5

  -----------------------

5⁴ = 625

8.  List all the permutations of the letters ABCD, taken two at a time.

Starting with A: AB, AC, AD

Starting with B: BA, BC, BD

Starting with C: CA, CB, CD

Starting with D: DA, DB, DC

There are 4P3 = 12

9.  Evaluate each permutation.

+----------------------+----------------------+----------------------+
| a.  ⁶P₃              | b.  ⁵P₂              | c.  ⁸P₃              |
|                      |                      |                      |
| $$120$$              | $$20$$               | $$336$$              |
+======================+======================+======================+
| d.  ¹⁰P₇             | e.  ⁹P₆              | f.  ⁷P₅              |
|                      |                      |                      |
| $$604\ 800$$         | $$60\ 480$$          | $$2520$$             |
+----------------------+----------------------+----------------------+

10. Find how many arrangements of the letters of the word FRIEND are
    possible if the letters are taken:

    a.  six at a time.

  -----------------------------------
  1st   2nd   3rd   4th   5th   6th
  ----- ----- ----- ----- ----- -----
  6     5     4     3     2     1

  -----------------------------------

⁶P₆ = 6 × 5 × 4 × 3 × 2 × 1 = 720

b.  four at a time,

  -----------------------
  1st   2nd   3rd   4th
  ----- ----- ----- -----
  6     5     4     3

  -----------------------

⁶P₄ = 6 × 5 × 4 × 3 = 360

11. In how many ways can seven people be seated in a row of five
    different chairs?

  -----------------------------
  1st   2nd   3rd   4th   5th
  ----- ----- ----- ----- -----
  7     6     5     4     3

  -----------------------------

⁷P~5~ = 7 × 6 × 5 × 4 × 3 = 2520

12. Answer the following using the notation $\ ^{n}P_{r}$

    a.  From a group of 10, three people line up to buy tickets. How
        many ways can this happen?

$$¹⁰P₃$$

b.  Five cards are each labelled uniquely with one of the digits 1, 2,
    3, 4, 5. Three of the five cards are placed down in a row. How many
    ways can the cards be arranged?

$$⁵P₃$$

c.  One hundred people each buy one ticket in a lottery. How many ways
    can the first three places be awarded?

$$¹⁰⁰P₃$$

Development

13. There are 12 swimmers in a race.

    a.  In how many ways could they finish?

$$¹²P₁₂\  = \ 12! = \ 479001600$$

b.  In how many ways could they come in first, second and third?

$$¹²P₃\  = \ 12\  \times \ 11\  \times \ 10 = \ 1320$$

14. A set of 26 cards, each with a different letter of the alphabet, is
    placed into a hat and cards drawn out at random without replacement.
    Find the number of \'words\' possible if selecting

    a.  2 cards

$$²⁶P₂\  = \ 650$$

b.  3 cards

$$²⁶P₃\  = \ 15600$$

c.  4 cards

$$²⁶P₄\  = \ 358800$$

d.  5 cards

$$²⁶P₅\  = \ 7893600$$

15. a.  How many arrangements of the letters A, B, C and D are possible
        if no letter can be used twice?

$$⁴P₄ = 24$$

b.  How many arrangements of any 3 of these letters are possible?

$$⁴P₃\  = \ 24$$

c.  Explain why the answers to part a and b are the same.

$$4P4 = 4 \times 3 \times 2 \times 1$$

$$4P3 = 4 \times 3 \times 2$$

So, the two are equal.

Arranging 3 from 4 is the same as arranging all 4, because once you\'ve
arranged 3 letters, you have no choice for what the fourth letter is.

16. If $⁸Pᵣ\  = \ 336$, find the value of $r$.

$$\frac{8!}{(8 - r)!} = 336$$

By guess and check, $r = 3$

(there is no inverse operation for factorials)

Mastery

17. Explain why $n!$ For $n \in \{ 2,\ 3,\ 4,\ 5\ldots\}$ is even.

For numbers 2 or greater, $n!$ will always have a factor of 2, so must
be even

18. Show algebraically that $\ ^{n}P_{n} = \ ^{n}P_{n - 1} = n!$

$$\ ^{n}P_{n} = \frac{n!}{(n - n)!} = \frac{n!}{0!} = n!$$

$$\ ^{n}P_{n - 1} = \frac{n!}{\left( n - (n - 1) \right)!} = \frac{n!}{1!} = n!$$

19. Complete the sentences to give a *combinatorial argument* for why
    $\ ^{n}P_{n - 1} = n!$.

$\ ^{n}P_{n - 1}$ means to arrange ......... objects into .........
positions. You can do this by choosing which one object to leave out,
then arranging the remaining objects. Using the multiplication
principle, this is ......... $\times$ ............ = $n!$

$$n\ |\ n - 1\ |\ n\ |\ (n - 1)!$$

20. If $7\  \times \ ²ⁿPₙ\  = \ 4\  \times \ ²ⁿ⁺¹Pₙ\$, find $n$.

$$7\  \times \frac{(2n)!}{n!} = \ 4\  \times \frac{(2n + 1)!}{(n + 1)!}$$

$$7\  \times \frac{(2n)!}{n!} = \ 4\  \times \ \frac{(2n + 1)(2n)!}{(n + 1)\ n!}$$

Divide both sides by $\frac{(2n)!}{n!}$

$$7\  = \frac{4(2n + 1)}{n + 1}$$

$$7(n + 1)\  = \ 4(2n + 1)$$

$$7n\  + \ 7\  = \ 8n\  + \ 4$$

$$3\  = \ n$$

21. Prove that $ⁿ⁺¹Pᵣ\  = \ ⁿPᵣ\  + \ r\  \times \ ⁿPᵣ₋₁$

$$LHS = \ ⁿ^{+ 1}Pᵣ\  = \frac{(n + 1)!}{(n + 1 - r)!}$$

$$RHS = \ ⁿPᵣ\  + \ r\  \times \ ⁿPᵣ₋₁$$

$$= \frac{n!}{(n - r)!} + \ r\  \times \frac{n!}{(n - r + 1)!}$$

$$= \frac{n!}{(n - r)!} + \ r\  \times \frac{n!}{(n - r + 1)(n - r)!}$$

$$= \frac{n!}{(n - r)!}\  \times \ \left\lbrack 1\  + \frac{r}{n - r + 1} \right\rbrack$$

$$= \frac{n!}{(n - r)!}\  \times \ \left\lbrack \frac{n - r + 1 + r}{n - r + 1} \right\rbrack$$

$$= \frac{n!}{(n - r)!} \times \frac{n + 1}{n + 1 - r}$$

$$= \ (n + 1) \times \frac{n!}{(n + 1 - r)!}$$

$$= \frac{(n + 1)!}{(n + 1 - r)!}$$

$$= \ LHS$$

# Permutations with Restrictions

+-------------------------------------------------------------------+
| - **Dealing with Restrictions**                                   |
+===================================================================+
| When counting ordered selections, deal with any restrictions      |
| first.                                                            |
|                                                                   |
| Set up boxes in the order of the selections, **not** the physical |
| order of the objects.                                             |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------+
| - **Example** Count total number of arrangements involving restrictions.                |
+=====================================================+===================================+
| A five-digit number is formed from the digits 0 to  | Six people form two queues, each  |
| 9 without repeats. How many numbers are possible?   | with three people. Alice will     |
|                                                     | only stand in the left-hand       |
|   ---------------------------------------           | queue, and Bob will only stand in |
|    1^st^   2^nd^   3^rd^   4^th^   5^th^            | the right-hand queue. In how many |
|   ------- ------- ------- ------- -------           | ways can the two queues be        |
|      9       9       8       7       6              | formed?                           |
|                                                     |                                   |
|   ---------------------------------------           |   -----------------------         |
|                                                     |    A    B     4 others            |
| $$9 \times 9 \times 8 \times 7 \times 6 = 27\ 216$$ |   ---- ---- -------------         |
|                                                     |    3    3        4!               |
|                                                     |                                   |
|                                                     |   -----------------------         |
|                                                     |                                   |
|                                                     | $$3 \times 3 \times 4! = 216$$    |
+-----------------------------------------------------+-----------------------------------+

+---------------------------------------------------------------------------------------+
| - **Practice**                                                                        |
+===================================+===================================================+
| A three-digit number is formed    | A race has 8 runners wearing numbered bibs from 1 |
| from the digits 5 to 9 without    | to 8. The top 3 finishers get medals (gold,       |
| repetition. How many numbers      | silver, bronze). How many possible medal outcomes |
| greater than 700 are possible?    | have runner 5, 6, 7, or 8 winning gold?           |
|                                   |                                                   |
| $$3 \times 4 \times 3 = 36$$      | $4 \times 7 \times 6 = 168$ ways                  |
+-----------------------------------+---------------------------------------------------+
| Six people are going on a hike in | Eight people form two queues, each with four      |
| two teams of three. Each team     | people. Albert will only stand in the left-hand   |
| needs a navigator, medic, and     | queue, Beth only in the right-hand queue, and     |
| tent-carrier. Alison is trained   | Charles and Diana insist on standing in the same  |
| as a navigator so would prefer    | queue. In how many ways can the two queues be     |
| that role. Beth and Alison are    | formed?                                           |
| besties so want to go together.   |                                                   |
| How many ways can the two teams   | $$4 \times 4 \times 6 \times 2 \times 4! = 4608$$ |
| be formed?                        |                                                   |
|                                   |                                                   |
| $2 \times 2 \times 4! = 96$ ways  |                                                   |
+-----------------------------------+---------------------------------------------------+

Foundation

1.  A school talent quest has 11 performers and each one is randomly
    given the order in which to perform.

    a.  In how many ways can the order of performances be arranged?

  -------------------------
  1st   2nd   \...   11th
  ----- ----- ------ ------
  11    10    \...   1

  -------------------------

$$¹¹P₁₁\  = \ 11! = \ 39916800$$

b.  If one performer is chosen to perform first, in how many ways can
    the others be arranged?

  -------------------------
  1st   2nd   \...   11th
  ----- ----- ------ ------
  1     10    \...   1

  -------------------------

$$¹⁰P₁₀\  = \ 10!\  = \ 3628800$$

2.  A group of 6 friends sit in the same row at a concert.

    a.  In how many different ways can they arrange themselves?

  ------------------------
  1st   2nd   \...   6th
  ----- ----- ------ -----
  6     5     \...   1

  ------------------------

$$⁶P₆\  = \ 6!\  = \ 720$$

b.  If one friend must sit on the centre aisle, in how many ways can
    they be arranged?

Centre aisle fixed, arrange remaining 5

  -----------------
  Centre   Others
  -------- --------
  1        5!

  -----------------

5! = 120

3.  A random 3-digit number is made from cards containing the numbers 0
    to 9.

    a.  In how many ways can this be done if the cards cannot be used
        more than once and 0 cannot be the first number?

First digit: 1-9 (9 choices)

Second digit: 0-9 except the one used for the first digit (9 choices)

Third digit: 8 choices left

  -----------------
  1st   2nd   3rd
  ----- ----- -----
  9     9     8

  -----------------

9 × 9 × 8 = 648

b.  How many numbers over 400 can be made?

  -----------------
  1st   2nd   3rd
  ----- ----- -----
  6     9     8

  -----------------

First digit: 4-9 (6 choices)

Remaining digits to choose from: 9, then 8

6 × 9 × 8 = 432

c.  How many numbers less than 300 can be made?

  -----------------
  1st   2nd   3rd
  ----- ----- -----
  2     9     8

  -----------------

First digit: 1 or 2 (2 choices) Remaining digits to choose from: 9, then
8

2 × 9 × 8 = 144

4.  A set of 5 cards, each with a number from 1 to 5 on it, is placed in
    a box and 2 cards are drawn out at random to make a number. Find how
    many possible numbers there are:

+-------------------------------------+---------------------------------+
| a.   Altogether                     | b.  of numbers greater than 50  |
|                                     |                                 |
| $$⁵P₂\  = \ 5\  \times \ 4 = \ 20$$ | first digit must be 5           |
|                                     |                                 |
|                                     | 1 × 4 = 4                       |
+=====================================+=================================+
| c.  of odd numbers                  | d.  of even numbers             |
|                                     |                                 |
| The last digit must be 1, 3, or 5.  | There last digit must be 2 or   |
|                                     | 4.                              |
|   ------------                      |                                 |
|   last   1st                        |   ------------                  |
|   ------ -----                      |   last   1st                    |
|   3      4                          |   ------ -----                  |
|                                     |   2      4                      |
|   ------------                      |                                 |
|                                     |   ------------                  |
| $$3 \times 4 = 12$$                 |                                 |
|                                     | $$2 \times 4 = 8$$              |
+-------------------------------------+---------------------------------+

5.  A 4-digit number is to be selected at random from the numbers 0 to 9
    with a non-zero first digit and no repetition. How many arrangements
    are there:

+---------------------------+---------------------------+---------------------------+
| a.  In total?             | b.  over 6000?            | c.  less than 8000?       |
|                           |                           |                           |
|   ----------------------- |   ----------------------- |   ----------------------- |
|   1st   2nd   3rd   4th   |   1st   2nd   3rd   4th   |   1st   2nd   3rd   4th   |
|   ----- ----- ----- ----- |   ----- ----- ----- ----- |   ----- ----- ----- ----- |
|   9     9     8     7     |   4     9     8     7     |   7     9     8     7     |
|                           |                           |                           |
|   ----------------------- |   ----------------------- |   ----------------------- |
|                           |                           |                           |
| First digit: 1-9          | First digit: 6, 7, 8, 9   | First digit: 1-7 (7       |
| Remaining choices: 9, 8,  | (4 choices)               | choices)                  |
| 7                         |                           |                           |
|                           | 4 × 9 × 8 × 7 = 2016      | 7 × 9 × 8 × 7 = 3528      |
| 9 × 9 × 8 × 7 = 4536      |                           |                           |
+===========================+===========================+===========================+

6.  The numbers 1, 2, 3, 4 and 5 are arranged in a line. How many
    arrangements are possible if

+--------------------------------------+----------------------------------------------------+---------------------------------+
| a.  there is no restriction          | b.  the number is less than 30000                  | c.  the number is greater than  |
|                                      |                                                    |     20000                       |
| $$⁵P₅\  = \ 5! = \ 120$$             | first digit is 1 or 2                              |                                 |
|                                      |                                                    | Numbers \> 20000: first digit   |
|                                      |   -----------------------------                    | is 2, 3, 4, or 5                |
|                                      |   1st   2nd   3rd   4th   5th                      |                                 |
|                                      |   ----- ----- ----- ----- -----                    |   ----------------------------- |
|                                      |   2     4     3     2     1                        |   1st   2nd   3rd   4th   5th   |
|                                      |                                                    |   ----- ----- ----- ----- ----- |
|                                      |   -----------------------------                    |   4     4     3     2     1     |
|                                      |                                                    |                                 |
|                                      | 2 × 4! = 48                                        |   ----------------------------- |
|                                      |                                                    |                                 |
|                                      |                                                    | 4 × 4! = 96                     |
+======================================+====================================================+=================================+
| d.  the number is odd                | e.  any 3 numbers are selected at random?          |                                 |
|                                      |                                                    |                                 |
| Odd numbers: last digit is 1, 3, or  | $$⁵P₃\  = \ 5\  \times \ 4\  \times \ 3\  = \ 60$$ |                                 |
| 5                                    |                                                    |                                 |
|                                      |                                                    |                                 |
|   ---------------------------------- |                                                    |                                 |
|   Last   1st   2^nd^   3^rd^   4th   |                                                    |                                 |
|   ------ ----- ------- ------- ----- |                                                    |                                 |
|   3      4     3       2       1     |                                                    |                                 |
|                                      |                                                    |                                 |
|   ---------------------------------- |                                                    |                                 |
|                                      |                                                    |                                 |
| 3 × 4 × 3 × 2 × 1 = 72               |                                                    |                                 |
+--------------------------------------+----------------------------------------------------+---------------------------------+

Development

7.  A group of 5 boys and 5 girls line up outside a cinema. In how many
    ways can they be arranged

+-----------------------------------------------+-----------------------------------------------+
| a.  with no restriction                       | b.  if a particular girl stands in line first |
|                                               |                                               |
| $$¹⁰P₁₀\  = \ 10! = \ 3628800$$               | Particular girl in first position, arrange    |
|                                               | remaining 9                                   |
|                                               |                                               |
|                                               | 9! = 362880                                   |
+===============================================+===============================================+
| c.  if boys and girls alternate (with either a girl or boy in first place)?                   |
|                                                                                               |
| +-------------------------------------------+-------------------------------------------+     |
| | Case 1: Girl first                        | Case 2: Boy first                         |     |
| |                                           |                                           |     |
| |   --------------------------------------- |   --------------------------------------- |     |
| |   G   B   G   B   G   B   G   B   G   B   |   B   G   B   G   B   G   B   G   B   G   |     |
| |   --- --- --- --- --- --- --- --- --- --- |   --- --- --- --- --- --- --- --- --- --- |     |
| |   5   5   4   4   3   3   2   2   1   1   |   5   5   4   4   3   3   2   2   1   1   |     |
| |                                           |                                           |     |
| |   --------------------------------------- |   --------------------------------------- |     |
| |                                           |                                           |     |
| | 5! × 5! = 120 × 120 = 14400               | 5! × 5! = 14400                           |     |
| +===========================================+===========================================+     |
|                                                                                               |
| Total: 14400 + 14400 = 28800                                                                  |
+-----------------------------------------------------------------------------------------------+

8.  4-digit numbers are formed from the digits 1, 2, ... 8, 9, without
    repetition.

+-----------------------------------------------------------------+-----------------------------------+
| a.  How many can be formed, without restriction?                | b.  How many of these end in 1?   |
|                                                                 |                                   |
| $$⁹P₄\  = \ 9\  \times \ 8\  \times \ 7\  \times \ 6 = \ 3024$$ |   -----------------------         |
|                                                                 |   4th   1st   2nd   3rd           |
|                                                                 |   ----- ----- ----- -----         |
|                                                                 |   1     8     7     6             |
|                                                                 |                                   |
|                                                                 |   -----------------------         |
|                                                                 |                                   |
|                                                                 | 8 × 7 × 6 = 336                   |
+=================================================================+===================================+
| c.  How many of these are even?                                 | d.  How many are divisible by 5?  |
|                                                                 |                                   |
| Even: last digit is 2, 4, 6, or 8                               | Divisible by 5: must end in 5     |
|                                                                 |                                   |
|   -----------------------                                       |   -----------------------         |
|   4th   1st   2nd   3rd                                         |   4th   1st   2nd   3rd           |
|   ----- ----- ----- -----                                       |   ----- ----- ----- -----         |
|   4     8     7     6                                           |   1     8     7     6             |
|                                                                 |                                   |
|   -----------------------                                       |   -----------------------         |
|                                                                 |                                   |
| 8 × 7 × 6 × 4 = 1344                                            | 8 × 7 × 6 = 336                   |
+-----------------------------------------------------------------+-----------------------------------+
| e.  How many are greater than 7000?                                                                 |
|                                                                                                     |
| Greater than 7000: first digit is 7, 8, or 9                                                        |
|                                                                                                     |
|   -----------------------                                                                           |
|   1st   2nd   3rd   4th                                                                             |
|   ----- ----- ----- -----                                                                           |
|   3     8     7     6                                                                               |
|                                                                                                     |
|   -----------------------                                                                           |
|                                                                                                     |
| 3 × 8 × 7 × 6 = 1008                                                                                |
+-----------------------------------------------------------------------------------------------------+

9.  Repeat the previous question if repetitions are allowed.

<!-- -->

a)  9⁴ = 6561

b)  9³ = 729

c)  9³ × 4 = 2916

d)  9³ = 729

e)  3 × 9³ = 2187

<!-- -->

10. In Tasmania, a car licence plate consists of two letters followed by
    four digits. Find how many of these are possible:

+-----------------------------------------------------+------------------------------------------+
| a.  if there are no restrictions,                   | b.  if there is no repetition of letters |
|                                                     |     or digits,                           |
| 26² × 10⁴ = 676 × 10000                             |                                          |
|                                                     |   --------------------------             |
| = 6760000                                           |   L    L    N    N   N   N               |
|                                                     |   ---- ---- ---- --- --- ---             |
|                                                     |   26   25   10   9   8   7               |
|                                                     |                                          |
|                                                     |   --------------------------             |
|                                                     |                                          |
|                                                     | $$²⁶P₂\  \times \ ¹⁰P₄\  = \ \ 3276000$$ |
+=====================================================+==========================================+
| c.  if the second letter is X and the third digit   | d.  if the letters are D and Q and the   |
|     is 3,                                           |     digits are 3, 6, 7 and 9.            |
|                                                     |                                          |
|   ------------------------------------------------- |   ---------------------                  |
|   2nd      3rd     1st      1st     2nd     4th     |   Letters   Digits                       |
|   letter   digit   letter   digit   digit   digit   |   (D,Q)     (3,6,7,9)                    |
|   -------- ------- -------- ------- ------- ------- |   --------- -----------                  |
|   \(1\)    \(1\)   26       10      10      10      |   2!        4!                           |
|                                                     |                                          |
|   ------------------------------------------------- |   ---------------------                  |
|                                                     |                                          |
| 26 × 10³ = 26000                                    | 2! × 4! = 2 × 24 = 48                    |
+-----------------------------------------------------+------------------------------------------+

11. a.  In how many ways can the letters of the word NUMBER be arranged?

6! = 720

b.  How many begin with N?

  -----------------
  1st   Remaining
  ----- -----------
  N (1) 5!

  -----------------

5! = 120

c.  How many begin with N and end with U?

  --------------------
  1st   6th   Middle 4
  ----- ----- --------
  N (1) U (1) 4!

  --------------------

4! = 24

d.  In how many is the N somewhere to the left of the U?

Total arrangements: 6! = 720

In exactly half, N is left of U

$$\frac{720}{2} = \ 360$$

12. a.  How many five-digit numbers can be formed from the digits 2, 3,
        4, 5 and 6, without repetition?

5! = 120

b.  How many of these numbers are greater than 56432?

Start with 6: arrange remaining 4 digits

  -----------------
  1st   Remaining
  ----- -----------
  6 (1) 4!

  -----------------

4! = 24

c.  How many of these numbers are less than 56432?

Easiest method is to do total subtract the 24 greater, and subtract 1
(since the question asks for less than, not less than or equal to)

120 - 24 - 1 = 95

Mastery

13. a.  How many five-digit numbers can be formed from the digits 0, 1,
        2, 3 and 4 if repetitions are not allowed?

  ------------------
  1st    Remaining 4
  (not   
  0)     
  ------ -----------
  4      4!

  ------------------

4 × 4! = 96

b.  How many of these are odd?

+-------------------------------+-------------------------------+
| Case 1: Last digit is 1,      | Case 2: Last digit is 3,      |
| first digit can't be 0        | first digit can't be 0        |
|                               |                               |
|   --------------------        |   --------------------        |
|   5th   1st   Middle 3        |   5th   1st   Middle 3        |
|   ----- ----- --------        |   ----- ----- --------        |
|   1     3     3!              |   1     3     3!              |
|                               |                               |
|   --------------------        |   --------------------        |
|                               |                               |
| $$1 \times 3 \times 3! = 18$$ | $$1 \times 3 \times 3! = 18$$ |
|                               |                               |
|                               | Total: 36                     |
+===============================+===============================+

c.  How many are divisible by 5?

Last digit must be 0

  -------------
  5th   First 4
  ----- -------
  1     4!

  -------------

> 4! = 24

14. The letters of the word THEORY are arranged randomly. Find the
    number of arrangements of 4 of these letters if the first letter is
    a consonant and the last letter is a vowel.

  -----------------------------------------
  1st           Last      Middle 2
  (consonant)   (vowel)   
  ------------- --------- -----------------
  4             2         $$\ ^{4}P_{2}$$

  -----------------------------------------

4 × 2 × $\ ^{4}P_{2}$ = 96

15. In how many ways can a boat crew of eight women be arranged if three
    of the women can only row on the bow side and two others can only
    row on the stroke side?

Call bowside women $B_{1},\ B_{2},\ B_{3}$ and stroke side women
$S_{1},\ S_{2}$. Choose spots for these women, then fill the rest.

  ------------------------------------------------------------------
   $$B_{1}$$   $$B_{2}$$   $$B_{3}$$   $$S_{1}$$   $$S_{2}$$   The
                                                               rest
  ----------- ----------- ----------- ----------- ----------- ------
       4           3           2           4           3        3!

  ------------------------------------------------------------------

$$4 \times 3 \times 2 \times 4 \times 3 \times 3! = 1728$$

Alternate method: arrange 3 bowside women in the 4 bowside spots;
arrange 2 stroke side women in 4 stroke side spots, then arrange the 3
remaining

$$4P3 \times 4P2 \times 3! = 1728$$

16. A motor bike can carry three people: the driver, one passenger
    behind the driver and one in the sidecar. If among five people, only
    two can drive, in how many ways can the bike be filled?

Fill driver seat first, then fill the rest.

  -------------------------
   $$D$$      The rest
  ------- -----------------
     2     $$\ ^{4}P_{2}$$

  -------------------------

$$2 \times \ ^{4}P_{2} = 24$$

# Permutations involving Grouping, Complements, and Cases

+-------------------------------------------------------------------+
| - **Grouping Principle**                                          |
+===================================================================+
| Restrictions usually involve grouping objects as a single "unit." |
|                                                                   |
| 1\. Identify the "units."                                         |
|                                                                   |
| 2\. Arrange the units.                                            |
|                                                                   |
| 3\. Arrange the individuals within each unit.                     |
|                                                                   |
| 4\. Multiply the arrangements.                                    |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Example** Count using the grouping principle.                     |
+===================================+===================================+
| Arrange the 7 letters of READING  | 4 boys and 4 girls form a queue   |
| so that all vowels (E, A, I) stay | at a bus stop.\                   |
| together.                         | One boy-girl couple wishes to     |
|                                   | stand together.\                  |
| 1\. Units: (E A I), R, D, N, G    | The other three girls wish to     |
|                                   | stand together.\                  |
| 2\. Arrange units: 5!             | The other three boys don't mind.  |
|                                   |                                   |
| 3\. Arrange within units: 3!      | How many ways are there to form   |
|                                   | the queue?                        |
| 4\. $5! \times 3! = 720$          |                                   |
|                                   | 1\. Units: (B G), (G1 G2 G3), B1, |
|                                   | B2, B3                            |
|                                   |                                   |
|                                   | 2\. Arrange units: 5!             |
|                                   |                                   |
|                                   | 3\. Arrange within units: 2!, 3!  |
|                                   |                                   |
|                                   | 4\.                               |
|                                   | $5! \times 2! \times 3! = 1440$   |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| Arrange the 8 letters of COMPUTER | 3 boys and 4 girls line up for a  |
| so that all consonants (C, M, P,  | photo. In how many ways can they  |
| T, R) stay together.              | arrange themselves if all the     |
|                                   | boys must stand together?         |
| $$4! \times 5! = 2880$$           |                                   |
|                                   | $$5! \times 3! = 720$$            |
+-----------------------------------+-----------------------------------+
| A bookshelf has 6 fiction and 4   | A theatre of 3 experienced and 5  |
| non-fiction books. In how many    | beginners actors line up for a    |
| ways can the books be arranged if | curtain call.\                    |
| all the fiction books must be     | Two of the experienced actors are |
| kept together?                    | siblings and wish to stand        |
|                                   | together.\                        |
| $$5! \times 6! = 86\ 400$$        | The beginners also wish to stand  |
|                                   | together.\                        |
|                                   | The other experienced actor       |
|                                   | doesn\'t mind.\                   |
|                                   | How many ways can they line up?   |
|                                   |                                   |
|                                   | $$3! \times 2! \times 5! = 1440$$ |
+-----------------------------------+-----------------------------------+
| - **Complement Principle**                                            |
+-----------------------------------------------------------------------+
| Words like **"at least" "at most" "not" "excluding"** indicate it is  |
| best solved by considering the complementary situation.               |
|                                                                       |
| 1\. Count total orderings.                                            |
|                                                                       |
| 2\. Count unacceptable orderings.                                     |
|                                                                       |
| 3\. Acceptable orderings = Total -- Unacceptable.                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Example** Count using the complementary principle.                |
+===================================+===================================+
| How many 7-letter words can be    | 9 people are to form a committee  |
| formed using the letters A, B, C, | of three positions: president,    |
| D, E, F, G if the two vowels must | treasurer, secretary.\            |
| be separated by at least one      | Amy and Olivia refuse to serve in |
| consonant?                        | the committee together. How many  |
|                                   | ways are there of forming the     |
| 1\. Total: 7!                     | committee?                        |
|                                   |                                   |
| 2\. Unacceptable orderings:       | 1\. Total: 9P3                    |
|                                   |                                   |
| Treat AE as a single unit.        | 2\. Unacceptable orderings:       |
|                                   |                                   |
| (AE), B, C, D, F, G               | Choose a position for Amy: 3      |
|                                   |                                   |
| Total unacceptable:               | Choose a position for Olivia: 2   |
| $6! \times 2!$                    |                                   |
|                                   | There are 7 people to fill the    |
| 3\. $7!\  - \ (6!\ 2!)\  = 3600$  | last position.                    |
|                                   |                                   |
|                                   | Total unacceptable:               |
|                                   | $3 \times 2 \times 7$             |
|                                   |                                   |
|                                   | 3\.                               |
|                                   | $9P3 - 3 \times 2 \times 7 = 462$ |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| 8 people are to stand in a line.  | 8 students are trying out for a   |
| Georgina and Harriet do not wish  | relay race team with four         |
| to stand together. How many ways  | positions: first leg, second leg, |
| are there of arranging the 8      | third leg, anchor. Two of the     |
| people?                           | students, Marcus and Sophie,      |
|                                   | cannot both be on the team. How   |
| $$8!\  - \ (7!\ 2!) = 30\ 240$$   | many ways are there of selecting  |
|                                   | the team?                         |
|                                   |                                   |
|                                   | 8P4 --                            |
|                                   | ($4 \times 3 \times 6 \times 5)$  |
|                                   | = 1320                            |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Considering Cases**                                           |
+===================================================================+
| Complex questions involve considering cases, you can either:      |
|                                                                   |
| - Consider all non-overlapping cases and add them up.             |
|                                                                   |
| - Consider overlapping cases and subtract the overlap.            |
|                                                                   |
| Try to set up the minimum number of cases.                        |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Example** Count by considering cases.                             |
+===================================+===================================+
| A number is made from the digits  | How many 4-digit numbers can be   |
| 5, 6, 7, 8, 9 using each digit at | formed using the digits 1, 2, 3,  |
| most once. How many of these      | 4, 5, 6 (without repetition) such |
| numbers are less than 800?        | that the number is odd and        |
|                                   | greater than 4000?                |
| Case 1: 3-digit less than 800:    |                                   |
|                                   | Case 1: First digit is 4          |
| 3 possibilities for first digit,  |                                   |
| then arrange 2 digits from 4.     | Last digit must be 1, 3, 5, then  |
|                                   | arrange 2 digits from 4.          |
| $3 \times 4P2$ = 36               |                                   |
|                                   | $$3 \times 4P2 = 36$$             |
| Case 2: 2-digit numbers:          |                                   |
|                                   | Case 2: First digit is 5          |
| 5P2 = 20                          |                                   |
|                                   | Last digit must be 1 or 3, then   |
| Case 3: 1-digit numbers:          | arrange 2 digits from 4.          |
|                                   |                                   |
| 5P1 = 5                           | $$2 \times 4P2 = 24$$             |
|                                   |                                   |
| Total less than 800 = 36 + 20 + 5 | Case 3: First digit is 6          |
| = 61                              |                                   |
|                                   | Last digit must be 1, 3, 5, then  |
|                                   | arrange 2 digits from 4.          |
|                                   |                                   |
|                                   | $$3 \times 4P2 = 36$$             |
|                                   |                                   |
|                                   | Total = 36 + 24 + 36 = 96         |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------------+
| - **Practice**                                                              |
+===================================+=========================================+
| How many numbers greater than     | In how many ways can six students and   |
| 6000 can be formed using the      | two teachers be arranged in a row if    |
| digits 3, 4, 6, 8, 9 if no digit  | there are at least 3 students           |
| can be used more than once per    | separating the teachers?                |
| number?                           |                                         |
|                                   | Hint: subtract unacceptable             |
| 4-digit arrangements:             | arrangements                            |
| $3 \times 4P3 = 72$               |                                         |
|                                   | Total ways: $8!\  = \ 40320$            |
| 5-digit arrangements: $5! = 120$  |                                         |
|                                   | No students between: consider TT as a   |
| Total: 192                        | unit: $7! \times 2! = 10080$            |
|                                   |                                         |
|                                   | 1 student between: consider TST as a    |
|                                   | unit: $6! \times 6 \times 2! = 8640$    |
|                                   |                                         |
|                                   | 2 students between: consider TSST as a  |
|                                   | unit:                                   |
|                                   | $5! \times 6 \times 5 \times 2! = 7200$ |
|                                   |                                         |
|                                   | Total acceptable ways = 14 400          |
+-----------------------------------+-----------------------------------------+

Foundation

1.  How many ways can the following words be arranged, if the vowels
    must be together?

+----------------+----------------+----------------+----------------+
| a.  BOARDS     | b.  RIO        | c.  QUIT       | d.  TROUNCE    |
|                |                |                |                |
| 5 units: (OA), | 2 units: (IO), | 3 units: (UI), | 5 units:       |
| B, R, D        | R              | Q, T           | (OUE), T, R,   |
|                |                |                | N, C           |
| 5! × 2! = 240  | 2! × 2! = 4    | 3! × 2! = 12   |                |
|                |                |                | 5! × 3! = 720  |
+================+================+================+================+

2.  How many arrangements of the word MATHS are possible, if:

+---------------------------------+---------------------------------+
| a.  the T and H must remain     | b.  the TH must remain together |
|     together?                   |     and in this order?          |
|                                 |                                 |
| M, A, (TH), S                   | M, A, (TH), S                   |
|                                 |                                 |
| 4! × 2! = 48                    | But don't rearrange the TH      |
|                                 |                                 |
|                                 | 4! = 42                         |
+=================================+=================================+

3.  How many ways can Andrew, Becky, Courtney, Dion and Ellie sit in a
    row, if Andrew and Becky sit together and Dion and Ellie sit
    together?

(AB), C, (DE)

3! × 2! × 2! = 24

4.  In how many ways can three different Maths books, six different
    Science books and four different English books be placed on a shelf,
    if the books relating to each subject are to be kept together?

Treat each subject as 1 unit, and rearrange books within each subject.

3! (3 subjects) × 3! (rearrange maths books) × 6! (rearrange science
books) × 4! (rearrange English books)

= 622 080

5.  A class is asked to determine how many ways the letters of the word
    SOLAR can be arranged, if the first two positions cannot both be
    vowels.

    a.  Jack decides to use cases (the word either starts with a vowel
        or it does not).\
        Use Jack\'s method to answer the question.

Case 1: First position is consonant

3 × 4 × 3! = 3 × 4 × 6 = 72

Case 2: First position is vowel, second is consonant

2 × 3 × 3! = 2 × 3 × 6 = 36

Total = 72 + 36 = 108

b.  Jill decides to consider the complementary situation (both first
    positions are vowels).\
    Use Jill\'s method to answer the question.

Total arrangements: 5! = 120

Both first positions are vowels: 2 × 1 × 3! = 12

Valid arrangements: 120 - 12 = 108

6.  A family of two parents and two children are going on a car trip.
    Only the parents can drive.\
    If the father drives, then the mother will sit in the back seat
    where she feels safer.\
    The father always sits in a front seat of the car.\
    How many arrangements are possible, if two sit in the front and two
    in the back?

+---------------------------------+---------------------------------+
| Case 1: Father drives           | Case 2: Mother drives           |
|                                 |                                 |
| Father in driver seat, mother   | Mother in driver seat, father   |
| in back (2 back seats)          | in front passenger              |
|                                 |                                 |
| 2 children fill remaining spots | 2 children in back: 2! = 2 ways |
| (1 front, 1 back)               |                                 |
|                                 |                                 |
| 2 × 2 = 4 ways                  |                                 |
+=================================+=================================+

Total: 6 ways

7.  How many numbers can be written down using each digit of 789 at most
    once,\
    if the result must be at least 80?

+---------------------------------+---------------------------------+
| Two-digit numbers:              | Three-digit numbers: 3! = 6     |
|                                 |                                 |
| First digit 8: second is 7 or 9 | Total = 4 + 6 = 10              |
| (2 numbers)                     |                                 |
|                                 |                                 |
| First digit 9: second is 7 or 8 |                                 |
| (2 numbers)                     |                                 |
|                                 |                                 |
| Total two-digit: 4              |                                 |
+=================================+=================================+

8.  Find how many arrangements of the letters of the word UNIFORM are
    possible:

+---------------------------------+---------------------------------+
| a.  if the vowels must occupy   | b.  if the word must start with |
|     the first, middle and last  |     U and end with M,           |
|     positions,                  |                                 |
|                                 | Fix U at start and M at end     |
| Vowels: U, I, O (3)             |                                 |
|                                 | Arrange remaining 5             |
| Consonants: N, F, R, M (4)      |                                 |
|                                 | 5! = 120                        |
| Arrange the 3 vowels in the 3   |                                 |
| positions, then arrange the     |                                 |
| consonants                      |                                 |
|                                 |                                 |
| 3! × 4! = 144                   |                                 |
+=================================+=================================+
| c.  if all the consonants must  | d.  if the M is somewhere to    |
|     be in a group at the end of |     the right of the U.         |
|     the word,                   |                                 |
|                                 | M is to the right in half the   |
| Fix (N, F, R, M) at the end.    | arrangements                    |
|                                 |                                 |
| Arrange the 3 vowels then       | $$\frac{7!}{2} = 2520$$         |
| arrange the 4 consonants.       |                                 |
|                                 |                                 |
| 3! × 4! = 144                   |                                 |
+---------------------------------+---------------------------------+

9.  Find how many arrangements of the letters of the word BEHAVING:

+----------------------+----------------------+----------------------+
| a.  end in NG,       | b.  begin with three | c.  have three       |
|                      |     vowels,          |     vowels occurring |
| NG fixed at end      |                      |     together.        |
|                      | Fix (E, A, I) at     |                      |
| Arrange remaining 6  | start.               | 6 units to arrange:  |
| letters:             |                      | (EAI), B, H, V, N, G |
|                      | Arrange 5            |                      |
| 6! = 720             | consonants, then     | Then rearrange       |
|                      | arrange 3 vowels     | within unit.         |
|                      |                      |                      |
|                      | 5! × 3! = 720        | 6! × 3! = 4320       |
+======================+======================+======================+

10. A Maths test is to consist of six questions. In how many ways can it
    be arranged so that:

+---------------------------------+---------------------------------+
| a.  the easiest question is     | b.  the easiest and hardest     |
|     first and the hardest       |     questions are next to one   |
|     question is last            |     another?                    |
|                                 |                                 |
| Fix easiest at the start and    | Group easiest and hardest as    |
| hardest at the end.             | single unit.                    |
|                                 |                                 |
| Arrange remaining 4             | Arrange 5 units and then        |
|                                 | arrange within the unit         |
| 4! = 24                         |                                 |
|                                 | $$5! \times 2! = 240$$          |
+=================================+=================================+

Development

11. Four boys and four girls are to sit in a row. How many ways can this
    be done if:

+---------------------------------+----------------------------------------------+
| a.  The boys and girls          | b.  The boys and girls sit in distinct       |
|     alternate                   |     groups                                   |
|                                 |                                              |
| Case 1: BGBGBGBG                | Case 1: BBBBGGGG                             |
|                                 |                                              |
| Arrange boys: 4!                | Arrange boys: 4!                             |
|                                 |                                              |
| Arrange girls 4!                | Arrange girls 4!                             |
|                                 |                                              |
| Total: 4! × 4!                  | Total: 4! × 4!                               |
|                                 |                                              |
| Case 2: GBGBGBGB                | Case 2: BBBBGGGG                             |
|                                 |                                              |
| Arrange boys: 4!                | Arrange boys: 4!                             |
|                                 |                                              |
| Arrange girls 4!                | Arrange girls 4!                             |
|                                 |                                              |
| Total: 4! × 4!                  | Total: 4! × 4!                               |
|                                 |                                              |
| 2 × 4! × 4! = 1152              | $$2\  \times \ 4!\  \times \ 4!\  = \ 1152$$ |
|                                 |                                              |
|                                 | Alternate method: Consider 2 units           |
|                                 | (BBBB)(GGGG)                                 |
|                                 |                                              |
|                                 | Arrange 2 units and arrange within unit      |
|                                 |                                              |
|                                 | $$2\  \times \ 4!\  \times \ 4!\  = \ 1152$$ |
+=================================+==============================================+

12. Five-letter words are formed without repetition from the 8 letters
    of PHYSICAL.

+---------------------------------+---------------------------------+
| a.  How many consist only of    | b.  How many begin with P and   |
|     consonants?                 |     end with S?                 |
|                                 |                                 |
| $$⁶P₅\  = 720$$                 |   --------------------          |
|                                 |   1st   5th   Middle 3          |
|                                 |   ----- ----- --------          |
|                                 |   1     1     ⁶P₃               |
|                                 |                                 |
|                                 |   --------------------          |
|                                 |                                 |
|                                 | ⁶P₃ = 120                       |
+=================================+=================================+
| c.  How many begin with a       | d.  How many contain the letter |
|     vowel?                      |     Y?                          |
|                                 |                                 |
|   -----------------             | Total - (words without Y)       |
|   1st   Remaining 4             |                                 |
|   ----- -----------             | ⁸P₅ - ⁷P₅ = 4200                |
|   2     ⁷P₄                     |                                 |
|                                 |                                 |
|   -----------------             |                                 |
|                                 |                                 |
| 2 × $⁷P₄$ = 1680                |                                 |
+---------------------------------+---------------------------------+
| e.  How many have the two       | f.  How many have the letter A  |
|     vowels occurring next to    |     immediately following the   |
|     one another?                |     letter L?                   |
|                                 |                                 |
| Treat (I, A) as single unit     | Treat LA as single unit         |
|                                 |                                 |
| Fix (I, A) in the word, need 3  | Again treat 5-letter word as 4  |
| more consonants from 6,         | units.                          |
|                                 |                                 |
| therefore, treat the 5-letter   | Choose 1 of 4 spots for LA,     |
| word as 4 units.                | then order 3 more letters from  |
|                                 | 6                               |
| Choose 1 of 4 spots for (I,     |                                 |
| A),\                            | Do not rearrange LA             |
| ordered arrangement of 3        |                                 |
| consonants from 6, then arrange | $$4 \times 6P3 = 480$$          |
| (I, A)                          |                                 |
|                                 |                                 |
| $$4 \times 6P3 \times 2 = 960$$ |                                 |
+---------------------------------+---------------------------------+

13. Consider the 7-letter word INCLUDE.

+----------------------------------+---------------------------------+
| a.  How many seven-letter words  | b.  How many of these do not    |
|     can be formed without        |     begin with I?               |
|     repetition?                  |                                 |
|                                  |   -------------------           |
| $$7!\  = \ 5040$$                |   First   Remaining             |
|                                  |   ------- -----------           |
|                                  |   6       6!                    |
|                                  |                                 |
|                                  |   -------------------           |
|                                  |                                 |
|                                  | 6 × 6! = 4320                   |
|                                  |                                 |
|                                  | Alternatively subtract those    |
|                                  | that begin with I from total:   |
|                                  |                                 |
|                                  | 7! -- 6! = 4320                 |
+==================================+=================================+
| c.  How many end in L?           | d.  How many have the vowels    |
|                                  |     and consonants alternating? |
|   -----------                    |                                 |
|   First 6 L                      | There are only 3 vowels, so the |
|   ------- ---                    | only pattern is CVCVCVC         |
|   6!      1                      |                                 |
|                                  | 4! × 3! = 144                   |
|   -----------                    |                                 |
|                                  |                                 |
| 6! = 720                         |                                 |
+----------------------------------+---------------------------------+
| e.  How many have the C          | f.  How many have the letters N |
|     immediately following the D? |     and D separated by exactly  |
|                                  |     1 letter?                   |
| Treat DC as single unit          |                                 |
|                                  | Treat (N \_ D) as a single unit |
| 6 units to arrange: 6! = 720     |                                 |
|                                  | Therefore the 7-letter word     |
|                                  | reduces to 5 units.             |
|                                  |                                 |
|                                  | Rearrange N and D within (N \_  |
|                                  | D),\                            |
|                                  | pick 1 letter to go in the      |
|                                  | middle from 5,\                 |
|                                  | then arrange all units          |
|                                  |                                 |
|                                  | $$2 \times 5 \times 5! = 1200$$ |
+----------------------------------+---------------------------------+
| g.  How many have the letters N  | h.  How many have the letters N |
|     and D separated by exactly   |     and D separated by more     |
|     two letters?                 |     than two letters?           |
|                                  |                                 |
| Treat (N \_ \_ D) as a single    | Total -- Adjacent -- Separated  |
| unit                             | by 1 letter -- Separated by 2   |
|                                  | letters                         |
| Therefore the 7-letter word      |                                 |
| reduces to 4 units.              | Number adjacent:                |
|                                  |                                 |
| Rearrange N and D within (N \_   | Treat ND as single unit.\       |
| \_ D)\                           | 6 units to arrange and then 2   |
| ordered selection of middle 2    | ways to arrange ND              |
| letters, arrange all units       |                                 |
|                                  | $$6! \times 2 = 1440$$          |
| $$2 \times 5P2 \times 4! = 960$$ |                                 |
|                                  | 5040 -- 1440 -- 1200 -- 960 =   |
|                                  | 1440                            |
+----------------------------------+---------------------------------+

14. In how many ways can ten people be arranged in a line:

    a.  without restriction,

10! = 3,628,800

b.  if one particular person must sit at either end,

Sit 1 person at either end, then arrange 9 others

2 × 9! = 725 760

c.  if two particular people must sit next to one another,

Treat the two people as one unit. Arrange 9 units and arrange the 2
within the unit.

9! × 2! = 725 760

d.  if neither of two particular people, A and B, can sit on either end
    of the row?

We will subtract the unacceptable cases:

Unacceptable cases:

Case 1: Person A on either end: $2 \times 9!$

Case 2: Person B on either end: $2 \times 9!$

We then need to subtract the overlapping cases (A and B both on the
ends): $2 \times 8!$

$10!\  - (2 \times 9! + 2 \times 9! - 2 \times 8!) =$ 2 257 920

Mastery

15. Five boys and four girls form a queue at the cinema. There are two
    brothers who want to stand together, the remaining three boys wish
    to stand together, and the four girls don\'t mind where they stand.
    In how many ways can the queue be formed?

Units: {2 brothers}, {3 boys}, {4 girls separately} = 6 units total

  -------------------------
  Units   Brothers   3 boys
  ------- ---------- ------
  6!      2!         3!

  -------------------------

6! × 2! × 3! = 720 × 2 × 6 = 8640

16. Eight people are to form two queues of four. In how many ways can
    this be done if:

+----------------------+---------------------------+---------------------------------------------+
| a.  there are no     | b.  Jim will only stand   | c.  Sean and Liam must stand in the same    |
|     restrictions,    |     in the left-hand      |     queue?                                  |
|                      |     queue,                |                                             |
| $$8! = 40\ 320$$     |                           | Two cases:                                  |
|                      |   ----------------        |                                             |
|                      |   Jim in Arrange 7        |   ----------------------                    |
|                      |   left   others           |   Sean   Liam   6 others                    |
|                      |   ------ ---------        |   in                                        |
|                      |   4      7!               |   left                                      |
|                      |                           |   ------ ------ --------                    |
|                      |   ----------------        |   4      3      6!                          |
|                      |                           |                                             |
|                      | $$4 \times 7! = 20\ 160$$ |   ----------------------                    |
|                      |                           |                                             |
|                      |                           |   -----------------------                   |
|                      |                           |   Sean in Liam   6 others                   |
|                      |                           |   right                                     |
|                      |                           |   ------- ------ --------                   |
|                      |                           |   4       3      6!                         |
|                      |                           |                                             |
|                      |                           |   -----------------------                   |
|                      |                           |                                             |
|                      |                           | $$2 \times 4 \times 3 \times 6! = 17\ 280$$ |
+======================+===========================+=============================================+

17. Five backpackers arrive in a city where there are five youth
    hostels.

    a.  How many different accommodation arrangements are there if there
        are no restrictions on where the backpackers stay?

Each backpacker has 5 choices.

  ---------------------------------------------------------------------
  Backpacker1   Backpacker2   Backpacker3   Backpacker4   Backpacker5
  ------------- ------------- ------------- ------------- -------------
  5             5             5             5             5

  ---------------------------------------------------------------------

$$5⁵\  = \ 3125$$

b.  How many different accommodation arrangements are there if each
    backpacker stays at a different youth hostel?

  ---------------------------------------------------------------------
  Backpacker1   Backpacker2   Backpacker3   Backpacker4   Backpacker5
  ------------- ------------- ------------- ------------- -------------
  5             4             3             2             1

  ---------------------------------------------------------------------

5! = 120

c.  Suppose that two of the backpackers are brother and sister and wish
    to stay in the same youth hostel. How many different accommodation
    arrangements are there if the other three can go to any of the other
    youth hostels?

  --------------------------
  Siblings\'   Other 3
  hostel       backpackers
  ------------ -------------
  5 choices    4³ = 64

  --------------------------

$$5 \times 4^{3} = 320$$

18. Numbers less than 4000 are formed from the digits 1, 3, 5, 8 and 9,
    without repetition.

    a.  How many such numbers are there?

1-digit: 5

2-digit: 5 × 4 = 20

3-digit: 5 × 4 × 3 = 60

4-digit (start 1 or 3): 2 × 4 × 3 × 2 = 48

Total: 5 + 20 + 60 + 48 = 133

b.  How many of them are odd?

1-digit: 4 (1, 3, 5, 9)

2-digit: 4 × 4 = 16

3-digit: 4 × 4 × 3 = 48

4-digit starting 1 or 3:

Start 1, end odd (not 1): 3 × 3 × 2 = 18

Start 3, end odd (not 3): 3 × 3 × 2 = 18

Total: 4 + 16 + 48 + 36 = 104

c.  How many of them are divisible by 5?

Must end in 5

1-digit: 1

2-digit: 4

3-digit: 4 × 3 = 12

4-digit (start 1 or 3, end 5):

Start 1: 3 × 2 = 6

Start 3: 3 × 2 = 6

Total: 1 + 4 + 12 + 12 = 29

d.  How many of them are divisible by 3?

Sum of digits must be divisible by 3.

1-digit possibilities: 3, 9: **2**

2-digit digit possibilities: (1,5), (1,8), (3,9); 3 ways, multiply by 2!
ways to rearrange each set: **6**

3-digit possibilities: {1,3,5}, {1,3,8}, {1,5,9}, {1,8,9}, 4 ways,
multiply by 3! ways to rearrange each set: **24**

4-digit starting with 1: {1, 3, 8, 9}, {1, 3, 5, 9}, 2 ways, multiply by
3! ways to rearrange each set (since 1 must remain fixed at start):
**12**

4-digit starting with 3: (3, 1, 8, 9}, {3, 1, 5, 9}, multiply by 3! ways
to rearrange each set (since 1 must remain fixed at start): **12**

Total: 2 + 6 + 24 + 12 + 12 = 56

# Permutations with Identical Elements

+-------------------------------------------------------------------+
| - **Investigation** Ordered selection with identical elements.    |
+===================================================================+
| Consider the word **ALLY**.                                       |
|                                                                   |
| To understand why we need to account for identical letters,\      |
| we\'ll temporarily label the two Ls as L₁ and L₂.                 |
|                                                                   |
| We can arrange 4 different letters in 4P4 = 4! = 24 ways.         |
|                                                                   |
| +---------------+---------------+---------------+---------------+ |
| | A L₁ L₂ Y     | L₁ A L₂ Y     | L₂ A L₁ Y     | Y A L₁ L₂     | |
| |               |               |               |               | |
| | A L₂ L₁ Y     | L₁ A Y L₂     | L₂ A Y L₁     | Y A L₂ L₁     | |
| |               |               |               |               | |
| | A L₁ Y L₂     | L₁ L₂ A Y     | L₂ L₁ A Y     | Y L₁ A L₂     | |
| |               |               |               |               | |
| | A L₂ Y L₁     | L₁ L₂ Y A     | L₂ L₁ Y A     | Y L₂ A L₁     | |
| |               |               |               |               | |
| | A Y L₁ L₂     | L₁ Y A L₂     | L₂ Y A L₁     | Y L₁ L₂ A     | |
| |               |               |               |               | |
| | A Y L₂ L₁     | L₁ Y L₂ A     | L₂ Y L₁ A     | Y L₂ L₁ A     | |
| +===============+===============+===============+===============+ |
|                                                                   |
| Remove the labels and examine the list again. Notice that many    |
| arrangements are identical.                                       |
|                                                                   |
| +---------------+---------------+---------------+---------------+ |
| | A L L Y       | L A L Y       | L A L Y       | Y A L L       | |
| |               |               |               |               | |
| | A L L Y       | L A Y L       | L A Y L       | Y A L L       | |
| |               |               |               |               | |
| | A L Y L       | L L A Y       | L L A Y       | Y L A L       | |
| |               |               |               |               | |
| | A L Y L       | L L Y A       | L L Y A       | Y L A L       | |
| |               |               |               |               | |
| | A Y L L       | L Y A L       | L Y A L       | Y L L A       | |
| |               |               |               |               | |
| | A Y L L       | L Y L A       | L Y L A       | Y L L A       | |
| +===============+===============+===============+===============+ |
|                                                                   |
| Each unique arrangement appears ...... times because we can swap  |
| L₁ and L₂ without creating a new word.                            |
|                                                                   |
| Therefore, we have overcounted by a factor of ........., and the  |
| total ways to arrange ALLY is                                     |
|                                                                   |
| ............                                                      |
+-------------------------------------------------------------------+
| Consider the word ALLLY. You might think we simply divide by 3 to |
| account for three identical letters. Below are the arrangements   |
| of the three Ls in just the pattern A L L L Y (we won\'t list all |
| 5! = 120 possible permutations):                                  |
|                                                                   |
| A L₁ L₂ L₃ Y                                                      |
|                                                                   |
| A L₁ L₃ L₂ Y                                                      |
|                                                                   |
| A L₂ L₁ L₃ Y                                                      |
|                                                                   |
| A L₂ L₃ L₁ Y                                                      |
|                                                                   |
| A L₃ L₁ L₂ Y                                                      |
|                                                                   |
| A L₃ L₂ L₁ Y                                                      |
|                                                                   |
| How many ways can we rearrange the 3 Ls for each word we make?    |
| ..................                                                |
|                                                                   |
| Therefore, when we use 5!, we overcount by a factor of            |
| ............                                                      |
|                                                                   |
| The total number of ways to arrange the letters in the word ALLLY |
| is:                                                               |
|                                                                   |
| ...............                                                   |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Permutations with Identical Elements**                        |
+===================================================================+
| Number of different ways to arrange $n$ objects where $a$ objects |
| are identical:                                                    |
|                                                                   |
| $$\frac{n!}{a!}$$                                                 |
|                                                                   |
| Number of different ways to arrange $n$ objects where $a$ objects |
| are identical AND $b$ different objects are identical:            |
|                                                                   |
| $$\frac{n!}{a!b!}$$                                               |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------+
| - **Interpret** Transformation                                                                        |
+=========================================+===================+===================+=====================+
| For each scenario, write an expression for the number of different arrangements.                      |
+-----------------------------------------+---------------------------------------+---------------------+
| a.  TREE                                | b.  TAMMY                             | c.  SYDNEY          |
|                                         |                                       |                     |
| $$\ \ \ \ \ \ \ \ \ \ \ \frac{4!}{2!}$$ |                                       |                     |
+-----------------------------------------+---------------------------------------+---------------------+
| d.  CHEESE                              | e.  BANANA                            | f.  ADDRESSESS      |
+-----------------------------------------+-------------------+-------------------+---------------------+
| g.  3 identical wine glasses and 5 identical tumblers are   | h.  4 red, 6 blue, 2 green marbles are  |
|     to be arranged in a shelf.                              |     to be arranged in a line. All the   |
|                                                             |     marbles are identical except for    |
|                                                             |     colour.                             |
+-------------------------------------------------------------+-----------------------------------------+

+-------------------------------------------------------------------+
| - **Example** Count permutations with identical elements by       |
|   considering cases.                                              |
+===================================================================+
| How many 6-letter words can be formed by using the 7 letters of   |
| PRESSES?                                                          |
|                                                                   |
| Case 1: Leave out P                                               |
|                                                                   |
| Letters: R, E, E, S, S, S                                         |
|                                                                   |
| $$\frac{6!}{2! \times 3!} = \frac{720}{12} = \ 60$$               |
|                                                                   |
| Case 2: Leave out R                                               |
|                                                                   |
| Letters: P, E, E, S, S, S                                         |
|                                                                   |
| $$\frac{6!}{2! \times 3!} = \frac{720}{12} = \ 60$$               |
|                                                                   |
| Case 3: Leave out one E                                           |
|                                                                   |
| Letters: P, R, E, S, S, S                                         |
|                                                                   |
| $$\frac{6!}{3!} = \frac{720}{6} = \ 120$$                         |
|                                                                   |
| Case 4: Leave out one S                                           |
|                                                                   |
| Letters: P, R, E, E, S, S                                         |
|                                                                   |
| $$\frac{6!}{2! \times 2!} = \frac{720}{4} = \ 180$$               |
|                                                                   |
| Total = 60 + 60 + 120 + 180 = 420                                 |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| - **Practice**                                                                      |
+===================================+=================================================+
| How many 5-letter words can be    | In how many ways can the letters of MISSISSIPPI |
| formed using the letters of       | be arranged such that no two S\'s are adjacent? |
| PEPPER?                           |                                                 |
|                                   | Hint: use the gaps method                       |
| Case 1: Leave out P               |                                                 |
|                                   | Arrange non-S numbers so there are gaps         |
| Remaining: P, P, E, E, R          |                                                 |
|                                   | \_ M \_ I \_ I \_ I \_ P \_ P \_ I \_           |
| $$\frac{5!}{2!2!} = \ 30$$        |                                                 |
|                                   | $$\frac{7!}{4!2!}$$                             |
| Case 2: Leave out E               |                                                 |
|                                   | Arrange the 4 S into 8 gaps                     |
| Remaining: P, P, P, E, R          |                                                 |
|                                   | $$\frac{8P4}{4!}$$                              |
| $$\frac{5!}{3!} = \ 20$$          |                                                 |
|                                   | $$Total:\frac{7!}{4!2!} \times \frac{8P4}{4!}$$ |
| Case 3: Leave out R               |                                                 |
|                                   | 7350                                            |
| Remaining: P, P, P, E, E          |                                                 |
|                                   |                                                 |
| $$\frac{5!}{3!2!} = \ 10$$        |                                                 |
|                                   |                                                 |
| Total = 30 + 20 + 10 = 60         |                                                 |
+-----------------------------------+-------------------------------------------------+

Foundation

1.  Find the number of permutations of the following words if all the
    letters are used.

+--------------------------------------+-------------------------------+--------------------------------+
| a.  BOB                              | b.  ALAN                      | c.  SNEEZE                     |
|                                      |                               |                                |
| $$\frac{3!}{2!} = 3$$                | $$\frac{4!}{2!} = \ 12$$      | $$\frac{6!}{3!} = \ 120$$      |
+======================================+===============================+================================+
| d.  TASMANIA                         | e.  BEGINNER                  | f.  FOOTBALLS                  |
|                                      |                               |                                |
| $$\frac{8!}{3!} = 6720$$             | $$\frac{8!}{2!2!} = 10\ 080$$ | $$\frac{9!}{2!2!} = 90\ 720$$  |
+--------------------------------------+-------------------------------+--------------------------------+
| g.  EQUILATERAL                      | h.  COMMITTEE                 | i.  WOOLLOOMOOLOO              |
|                                      |                               |                                |
| $$\frac{11!}{2!2!2!} = 4\ 989\ 600$$ | $$\frac{9!}{2!2!2!} = 45360$$ | $$\frac{14!}{7!3!} = 25\ 720$$ |
+--------------------------------------+-------------------------------+--------------------------------+

2.  The six digits 1, 1, 1, 2, 2, 3 are used to form a six-digit
    number.\
    How many numbers can be formed?

$$\frac{6!}{3! \times 2!} = \ 60$$

3.  Six coins are lined up on a table. Find how many patterns are
    possible if there are:

+-----------------------------------+------------------------------------+------------------------------------+
| a.  five tails and one head       | b.  four heads and two tails       | c.  three tails and three heads    |
|                                   |                                    |                                    |
| $$\frac{6!}{5! \times 1!} = \ 6$$ | $$\frac{6!}{4! \times 2!} = \ 15$$ | $$\frac{6!}{3! \times 3!} = \ 20$$ |
+===================================+====================================+====================================+

4.  Eight balls, identical except for colour, are arranged in a line.
    Find how many different arrangements are possible if:

+---------------------------------+-----------------------------------------------+
| a.  all balls are of a          | b.  there are seven red balls and one white   |
|     different colour            |     ball                                      |
|                                 |                                               |
| $$8!\  = \ 40320$$              | $$\frac{8!}{7! \times 1!} = \ 8$$             |
+=================================+===============================================+
| c.  there are six red balls,    | d.  there are three red balls, three white    |
|     one white ball and one      |     balls and two black balls                 |
|     black ball                  |                                               |
|                                 | $$\frac{8!}{3! \times 3! \times 2!} = \ 560$$ |
| $$\frac{8!}{6!} = \ 56$$        |                                               |
+---------------------------------+-----------------------------------------------+

5.  Five identical green chairs and three identical red chairs are
    arranged in a row.\
    Find how many arrangements are possible:

+------------------------------------+---------------------------------+
| a.  if there are no restrictions   | b.  if there must be a green    |
|                                    |     chair on both ends          |
| $$\frac{8!}{5! \times 3!} = \ 56$$ |                                 |
|                                    | Fix green at both ends.\        |
|                                    | Need to select 6 middle         |
|                                    | positions from 3 green 3 red    |
|                                    |                                 |
|                                    | $$\frac{6!}{3!3!} = 20$$        |
+====================================+=================================+

Development

6.  A motorist travels through eight sets of traffic lights, each of
    which is red or green. He is forced to stop at three sets of lights.

+------------------------------------+---------------------------------+
| a.  In how many ways could this    | b.  What other number of red    |
|     happen?                        |     lights would give an        |
|                                    |     identical answer to part a? |
| Arrange 3 red, 5 green             |                                 |
|                                    | By the symmetric property, 5    |
| $$\frac{8!}{3! \times 5!} = \ 56$$ | red and 3 green.                |
+====================================+=================================+

7.  In how many ways can the letters of the word SOCKS be arranged in a
    line:

+---------------------------------+---------------------------------+
| a.  without restriction         | b.  so that the two Ss are      |
|                                 |     together                    |
| $$\frac{5!}{2!} = \ 60$$        |                                 |
|                                 | Treat SS as unit: 4 unique      |
|                                 | units                           |
|                                 |                                 |
|                                 | $$4!\  = \ 24$$                 |
+=================================+=================================+
| c.  so that the two Ss are      | d.  so that the K is somewhere  |
|     separated by at least one   |     to the left of the C        |
|     other letter                |                                 |
|                                 | By symmetry,                    |
| Total - Ss together             |                                 |
|                                 | $$\frac{60}{2} = \ 30$$         |
| 60 - 24 = 36                    |                                 |
+---------------------------------+---------------------------------+

8.  Find the number of arrangements of the letters in SLOOPS if:

+-------------------------------------+---------------------------------+
| a.  there are no restrictions       | b.  the two Os are together     |
|                                     |                                 |
| $$\frac{6!}{2! \times 2!} = \ 180$$ | Treat OO as unit: (OO, S, S, L, |
|                                     | P)                              |
|                                     |                                 |
|                                     | $$\frac{5!}{2!} = \ 60$$        |
+=====================================+=================================+
| c.  the two Os are to be separated  | d.  the Os are together and the |
|                                     |     Ss are together             |
| Total - Os together                 |                                 |
|                                     | Treat OO as unit, SS as unit: 4 |
| 180 - 60 = 120                      | unique units                    |
|                                     |                                 |
|                                     | 4! = 24                         |
+-------------------------------------+---------------------------------+

9.  In how many arrangements of the letters in TATTOO are the two Os
    separated?

Total:

$$\frac{6!}{2! \times 2!} = \ 180$$

Os together:

$$\frac{5!}{2!} = \ 60$$

Os separated: 180 - 60 = 40

10. In how many ways can the letters of the word DECISIONS be arranged:

+------------------------------------------------------------------------------+------------------------------------------------------------------------------+
| a.  without restriction                                                      | b.  so that the vowels and consonants alternate                              |
|                                                                              |                                                                              |
| $$\frac{9!}{2! \times 2!} = \ 90720$$                                        | Vowels E,I,I,O (4), Consonants D,C,S,S,N (5)                                 |
|                                                                              |                                                                              |
|                                                                              | Pattern CVCVCVCVC                                                            |
|                                                                              |                                                                              |
|                                                                              | Arrange consonants: $\frac{5!}{2!}$                                          |
|                                                                              |                                                                              |
|                                                                              | Arrange vowels: $\frac{4!}{2!}$                                              |
|                                                                              |                                                                              |
|                                                                              | $$\left( \frac{5!}{2!} \right) \times \left( \frac{4!}{2!} \right) = \ 720$$ |
+==============================================================================+==============================================================================+
| c.  so that the vowels come first followed by the consonants                 | d.  so that the N is somewhere to the right of the D                         |
|                                                                              |                                                                              |
| VVVVCCCCC                                                                    | Divide total by 2                                                            |
|                                                                              |                                                                              |
| The counting is identical to having them alternate.                          | $$\frac{90720}{2} = \ 45360$$                                                |
|                                                                              |                                                                              |
| $$\left( \frac{5!}{2!} \right) \times \left( \frac{4!}{2!} \right) = \ 720$$ |                                                                              |
+------------------------------------------------------------------------------+------------------------------------------------------------------------------+

11. In how many ways can the letters of the word PROPORTIONALITY be
    arranged so that the vowels and consonants still occupy the same
    places?

Vowels O,O,I,O,A,I

Consonants P,R,P,R,T,N,L,T,Y

$$\frac{6!}{3! \times 2!} \times \frac{9!}{2! \times 2! \times 2!}\  = \ 2721600$$

12. A form has ten questions in order, each of which requires the answer
    \'Yes\' or \'No\'. Find the number of ways the form can be filled
    in:

+-------------------------------------+--------------------------------------+
| a.  without restriction             | b.  if the first and last answers    |
|                                     |     are \'Yes\'                      |
| $$2¹⁰\  = \ 1024$$                  |                                      |
|                                     | Fix first and last as Y, fill 8      |
|                                     | middle positions                     |
|                                     |                                      |
|                                     | $$2^{8} = \ 256$$                    |
+=====================================+======================================+
| c.  if two are \'Yes\' and eight    | d.  if five are \'Yes\' and five are |
|     are \'No\'                      |     \'No\'                           |
|                                     |                                      |
| $$\frac{10!}{2! \times 8!} = \ 45$$ | $$\frac{10!}{5! \times 5!} = \ 252$$ |
+-------------------------------------+--------------------------------------+
| e.  if more than seven answers are  | f.  if an odd number of answers are  |
|     \'Yes\'                         |     \'Yes\'                          |
|                                     |                                      |
| 8 Yes:                              | $$\frac{1024}{2} = \ 512$$           |
| $\frac{10!}{8! \times 2!} = \ 45$   |                                      |
|                                     |                                      |
| 9 Yes:                              |                                      |
| $\frac{10!}{9! \times 1!} = \ 10$   |                                      |
|                                     |                                      |
| 10 Yes: $\frac{10!}{10!} = \ 1$     |                                      |
|                                     |                                      |
| 45 + 10 + 1 = 56                    |                                      |
+-------------------------------------+--------------------------------------+
| g.  if exactly three answers are    | h.  if the first and last answers    |
|     \'Yes\', and they occur         |     are \'Yes\' and exactly four     |
|     together                        |     more are \'Yes\'                 |
|                                     |                                      |
| Treat YYY as a unit. The rest are 7 | Fix first and last as Y.             |
| No's                                |                                      |
|                                     | Rest are 4 Yes and 4 No              |
| $$\frac{8!}{7!} = 8$$               |                                      |
|                                     | $$\frac{8!}{4! \times 4!} = \ 70$$   |
+-------------------------------------+--------------------------------------+

Mastery

13. How many five-letter words can be formed using the letters of the
    word:

+---------------------------------+---------------------------------+
| a.  STRESS                      | b.  BANANA                      |
|                                 |                                 |
| Case 1: leave out an S          | Case 1: Leave out B             |
|                                 |                                 |
| $$\frac{5!}{2!} = 60$$          | $$\frac{5!}{3!2!} = 10$$        |
|                                 |                                 |
| Case 2: leave out a T           | Case 2: Leave out A             |
|                                 |                                 |
| $$\frac{5!}{3!} = 20$$          | $$\frac{5!}{2!2!} = 30$$        |
|                                 |                                 |
| Case 3: Leave out a R           | Case 3: Leave out N             |
|                                 |                                 |
| $$\frac{5!}{3!} = 20$$          | $$\frac{5!}{3!} = 20$$          |
|                                 |                                 |
| Case 4: Leave out an E          | $$10 + 30 + 20 = 60$$           |
|                                 |                                 |
| $$\frac{5!}{3!} = 20$$          |                                 |
|                                 |                                 |
| $$60 + 20 + 20 + 20 = 120$$     |                                 |
+=================================+=================================+

14. Find how many arrangements of the letters of the word TRANSITION are
    possible if:

+-----------------------------------------------------+---------------------------------------+
| a.  there are no restrictions                       | b.  the Is are together               |
|                                                     |                                       |
| 10 letters, I twice, T twice, N twice               | Treat II as unit: 9 objects, T twice, |
|                                                     | N twice                               |
| $$\frac{10!}{2! \times 2! \times 2!} = \ 453\ 600$$ |                                       |
|                                                     | $$\frac{9!}{2! \times 2!} = \ 90720$$ |
+=====================================================+=======================================+
| c.  the Is are together, and so are the Ns, and so  | d.  the Ns occupy the end positions   |
|     are the Ts                                      |                                       |
|                                                     | 8 middle positions: I twice, T twice  |
| Treat II, NN, TT as units: 7 objects                |                                       |
|                                                     | $$\frac{8!}{2! \times 2!} = \ 10080$$ |
| $$7!\  = \ 5040$$                                   |                                       |
+-----------------------------------------------------+---------------------------------------+
| e.  an N occupies the first but not the last        | f.  the letter N is not at either end |
|     position                                        |                                       |
|                                                     | Approach: Total -- First -- Last --   |
| Fix first position as N.                            | First and Last                        |
|                                                     |                                       |
| Place N anywhere other than the last position: 8    | From part e, N first and not last is  |
| options                                             | 80 640                                |
|                                                     |                                       |
| Need to fill 8 positions. I twice, T twice          | N last and not first would also be 80 |
|                                                     | 640                                   |
| $$8 \times \frac{8!}{2!2!} = 80640$$                |                                       |
|                                                     | From part d, first and last is 10 080 |
|                                                     |                                       |
|                                                     | 453600 -- 80640 -- 80640-- 10080 =    |
|                                                     | 282 240                               |
+-----------------------------------------------------+---------------------------------------+
| g.  the vowels are together                                                                 |
|                                                                                             |
| Treat (IIAO) as single object, so 7 objects (IIAO), T twice, N Twice                        |
|                                                                                             |
| Arrange the units:                                                                          |
|                                                                                             |
| $$\frac{7!}{2!2!}$$                                                                         |
|                                                                                             |
| Arrange within unit:                                                                        |
|                                                                                             |
| $$\frac{4!}{2!}$$                                                                           |
|                                                                                             |
| Total:                                                                                      |
|                                                                                             |
| $$\frac{7!}{2!2!} \times \frac{4!}{2!} = 15\ 120$$                                          |
+---------------------------------------------------------------------------------------------+

# Arrangements around a Circle

+-----------------------------------------------------------------------------------------+
| - **Investigation** Counting arrangements around a circle.                              |
+=========================================================================================+
| Consider a very small dinner party where you arrange three people, Ariel, Bec, and Cate |
| around a circular table.                                                                |
|                                                                                         |
| ![](media/Permutations and Combinations/media/image14.png){width="4.007462817147856in"  |
| height="2.423063210848644in"}                                                           |
|                                                                                         |
| At first glance, there are 3! = ......... arrangements.                                 |
|                                                                                         |
| However, circular arrangements have no clear beginning or end, unlike straight lines.   |
|                                                                                         |
| We can rotate the table (or simply walk around) and get the same arrangement.           |
|                                                                                         |
| Since we can rotate each arrangement 3 times, we\'ve overcounted by a factor of 3.      |
|                                                                                         |
| So, the total number of different arrangements are: ............                        |
+-----------------------------------------------------------------------------------------+
| Another way to understand this is: only relative positions matter.                      |
|                                                                                         |
| The first person sits anywhere (this counts as one way since we can rotate the table).  |
|                                                                                         |
| Then ...... ways remain to arrange the other two people.                                |
|                                                                                         |
| ![](media/Permutations and Combinations/media/image15.png){width="1.0713976377952756in" |
| height="1.0356856955380578in"}                                                          |
|                                                                                         |
|   --------------                                                                        |
|    A    B    C                                                                          |
|   ---- ---- ----                                                                        |
|    1    2    1                                                                          |
|                                                                                         |
|   --------------                                                                        |
+-----------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Arrangements around a Circle**                                |
+===================================================================+
| Arranging $n$ objects around a circle is the same as arranging    |
| $(n - 1)$ objects in a line.                                      |
|                                                                   |
| There is only one way to place the first object because all       |
| positions are initially equivalent due to rotation.               |
|                                                                   |
| $$\frac{n!}{n} = (n - 1)!$$                                       |
|                                                                   |
| A diagram and the box method is useful for setting up these       |
| problems.                                                         |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Count arrangements around a circle.                                                                                                                                 |
+=========================================================================================+=========================================================================================+
| ![](media/Permutations and Combinations/media/image16.png){width="1.3194444444444444in" | ![](media/Permutations and Combinations/media/image17.png){width="1.2333333333333334in" |
| height="1.2916666666666667in"}In how many ways can 7 people sit around a circular       | height="1.2916666666666667in"}A, B, C, D, E are to be arranged around a circle. If B    |
| table?                                                                                  | must be directly to the left of A, how many arrangements are there?                     |
|                                                                                         |                                                                                         |
|   -------------------------------------------------------                               |   ------------------------                                                              |
|    1^st^   2^nd^   3^rd^   4^th^   5^th^   6^th^   7^th^                                |    A    B    C    D    E                                                                |
|   ------- ------- ------- ------- ------- ------- -------                               |   ---- ---- ---- ---- ----                                                              |
|      1       6       5       4       3       2       1                                  |    1    1    3    2    1                                                                |
|                                                                                         |                                                                                         |
|   -------------------------------------------------------                               |   ------------------------                                                              |
|                                                                                         |                                                                                         |
| $$\frac{7!}{7} = 6! = 720$$                                                             | $$3! = 6$$                                                                              |
+-----------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                                                                    |
+=========================================================================================+=========================================================================================+
| 10 people sit around a round table.\                                                    | 8 people sit around a round table. Bella and Zoe do not want to sit together. How many  |
| How many ways can this be done?                                                         | possible arrangements are there?                                                        |
|                                                                                         |                                                                                         |
| ![](media/Permutations and Combinations/media/image18.png){width="1.2333333333333334in" | ![](media/Permutations and Combinations/media/image19.png){width="1.2333333333333334in" |
| height="1.2416666666666667in"}                                                          | height="1.2270833333333333in"}                                                          |
|                                                                                         |                                                                                         |
| $$9! = 24$$                                                                             | $$1 \times 5 \times 6 \times 5 \times 4 \times 3 \times 2 \times 1 = 3600$$             |
+-----------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------+
| - **Arrangements around a Circle involving Grouping**                                                                                                                             |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 1\. Identify the units.                                                                                                                                                           |
|                                                                                                                                                                                   |
| 2\. Arrange the units around the circle.                                                                                                                                          |
|                                                                                                                                                                                   |
| 3\. Arrange the individuals within each unit.                                                                                                                                     |
|                                                                                                                                                                                   |
| 4\. Multiply the arrangements.                                                                                                                                                    |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
| - **Example** Count arrangements around a circle.                             |
+===========================================+===================================+
| In how many ways can 6 people sit around  | 6 people are to be arranged       |
| a circular table, if two people must sit  | around a circular table. 3        |
| together?                                 | friends wish to sit together as a |
|                                           | group. How many ways can this     |
| 1\. Let units be (AB), C, D, E, F         | arrangement occur?                |
|                                           |                                   |
| 2\. Arrange 5 units around a circle: $4!$ | 1\. (ABC), D, E, F                |
|                                           |                                   |
|   --------------------------------------- | 2\. Order the 4 units around a    |
|    1^st^   2^nd^   3^rd^   4^th^   5^th^  | circle: 3!                        |
|   ------- ------- ------- ------- ------- |                                   |
|      1       4       3       2       1    |   ------------------------------- |
|                                           |    1^st^   2^nd^   3^rd^   4^th^  |
|   --------------------------------------- |   ------- ------- ------- ------- |
|                                           |      1       3       2       1    |
| 3\. Arrangements of (AB): 2!              |                                   |
|                                           |   ------------------------------- |
| 4\. $4! \times 2! = 48$                   |                                   |
|                                           | 3\. Arrangements of (ABC): 3!     |
|                                           |                                   |
|                                           | 4\. $3! \times 3! = 36$           |
+-------------------------------------------+-----------------------------------+

+------------------------------------------------------------------------------------------+
| - **Practice**                                                                           |
+======================================+===================================================+
| Five boys and five girls sit around  | Five boys and five girls sit around a round       |
| a round table. There are two couples | table. There are four couples who wish to sit     |
| who wish to sit together. How many   | together, and an ex-couple Shane and Penny who do |
| ways can this be done?               | not wish to sit together. How many ways can this  |
|                                      | be done?                                          |
| (BG), (BG), B, B, B, G, G, G         |                                                   |
|                                      | (BG), (BG), (BG), (BG), S, P                      |
| $$7! \times 2! \times 2! = 20\ 160$$ |                                                   |
|                                      | Seat Shane first, then Penny, then 4 couples:     |
|                                      | $1 \times 3 \times 4 \times 3 \times 2 \times 1$\ |
|                                      | then rearrange within couples:                    |
|                                      | $2! \times 2! \times 2! \times 2$                 |
|                                      |                                                   |
|                                      | Total $= 1152$                                    |
+--------------------------------------+---------------------------------------------------+

Foundation

1.  A group of friends go into a restaurant and are seated around a
    circular table. Find how many arrangements are possible if there are

+-------------------------------+---------------------------------+----------------------------------+
| a.  4 friends                 | b.  7 friends                   | c.  8 friends                    |
|                               |                                 |                                  |
| $$(4 - 1)!\  = \ 3!\  = \ 6$$ | $$(7 - 1)!\  = \ 6!\  = \ 720$$ | $$(8 - 1)!\  = \ 7!\  = \ 5040$$ |
+===============================+=================================+==================================+

2.  In how many ways can a group of 6 people be arranged

+---------------------------------+---------------------------------+
| a.  in a line?                  | b.  in a circle?                |
|                                 |                                 |
| $$6!\  = \ 720$$                | $$(6 - 1)!\  = \ 5!\  = \ 120$$ |
+=================================+=================================+

3.  Find how many different ways a group of 9 people can be arranged in

+---------------------------------+-----------------------------------+
| a.  in a line?                  | b.  in a circle?                  |
|                                 |                                   |
| $$9!\  = \ 362880$$             | $$(9 - 1)!\  = \ 8!\  = \ 40320$$ |
+=================================+===================================+

4.  Eight people are arranged so that two particular people sit
    together.\
    How many ways if the people are arranged in:

+---------------------------------+---------------------------------+
| a.  in a line?                  | b.  in a circle?                |
|                                 |                                 |
| Treat two people as one unit:   | Treat two people as one unit in |
| $7!\  = \ 5040$                 | circle:                         |
|                                 | $(7 - 1)!\  = \ 6!\  = \ 720$   |
| Multiply by 2 (internal         |                                 |
| arrangements):                  | Multiply by 2:                  |
| $7!(2)\  = \ 10080$             | $6!(2)\  = \ 1440$              |
+=================================+=================================+

5.  Bob, Betty, Ben, Brad and Belinda are to be seated at a round table.
    In how many ways can this be done:

+-----------------------------------+-----------------------------------+
| a.  if there are no restrictions, | b.  if Betty sits directly at     |
|                                   |     Bob\'s right-hand side,       |
| $$(5 - 1)!\  = \ 4!\  = \ 24$$    |                                   |
|                                   |   --------------------            |
|                                   |   Bob   Betty   The               |
|                                   |                 rest              |
|                                   |   ----- ------- ------            |
|                                   |   1     1       3!                |
|                                   |                                   |
|                                   |   --------------------            |
|                                   |                                   |
|                                   | Fix Bob\'s position, Betty must   |
|                                   | be on his right:                  |
|                                   |                                   |
|                                   | $$\ 3!\  = \ 6$$                  |
+===================================+===================================+
| c.  if Brad is to sit directly    | d.  if Belinda and Betty sit      |
|     between Bob and Ben,          |     apart,                        |
|                                   |                                   |
| Fix Bob\'s position, Ben can be   | Betty and Belinda together        |
| in two positions, and Brad must   |                                   |
| be between (1 position)           | Arrange 4 units around the table, |
|                                   | then 2! internal arrangements     |
|   -------------------------       |                                   |
|   Bob   Ben   Brad   The          | $$(4 - 1)!(2!) = 12$$             |
|                      rest         |                                   |
|   ----- ----- ------ ------       | Total - (Belinda and Betty        |
|   1     2     1      2!           | together)                         |
|                                   |                                   |
|   -------------------------       | $$\ 24\  - \ 12\  = \ 12$$        |
|                                   |                                   |
| $$2 \times 2! = 4$$               |                                   |
|                                   |                                   |
| $$2(3 - 1)!\  = \ 2(2!) = \ 4$$   |                                   |
+-----------------------------------+-----------------------------------+
| e.  if Ben and Belinda sit apart, but Betty sits next to Bob?         |
|                                                                       |
| Treat Betty and Bob as a single unit. 2! ways for internal            |
| arrangement.                                                          |
|                                                                       |
| Fix their position. Brad can only sit in one spot for Ben and Belinda |
| to sit apart.                                                         |
|                                                                       |
| 2 ways to arrange Ben and Belinda in the remaining two spots.         |
|                                                                       |
| $$2 \times 2! = 4$$                                                   |
+-----------------------------------------------------------------------+

Development

6.  Four boys and four girls are arranged in a circle. In how many ways
    can this be done:

+----------------------------------+---------------------------------+
| a.  if there are no              | b.  if the boys and the girls   |
|     restrictions,                |     alternate,                  |
|                                  |                                 |
| $$(8 - 1)!\  = \ 7!\  = \ 5040$$ | Fix one boy\'s position,        |
|                                  | arrange 3 other boys: 3! = 6    |
|                                  |                                 |
|                                  | Arrange 4 girls in gaps: 4! =   |
|                                  | 24                              |
|                                  |                                 |
|                                  | Total: 6(24) = 144              |
+==================================+=================================+
| c.  if the boys and girls are in | d.  if a particular boy and     |
|     distinct groups,             |     girl wish to sit next to    |
|                                  |     one another,                |
| Two units BBBBGGGG               |                                 |
|                                  | Treat them as 1 unit. There are |
| Arrange 2 units around a circle: | now 7 units.                    |
| (2--1)!                          |                                 |
|                                  | Arrange 7 units around a circle |
| Arrange boys 4!                  | (7--1)!                         |
|                                  |                                 |
| Arrange girls 4!                 | Internal arrangement of boy and |
|                                  | girl 2!                         |
| $$4! \times 4! = 576$$           |                                 |
|                                  | $$6! \times 2! = 1440$$         |
+----------------------------------+---------------------------------+
| e.  if two particular boys do    | f.  if one particular boy wants |
|     not wish to sit next to one  |     to sit between two          |
|     another,                     |     particular girls.           |
|                                  |                                 |
| Total -- 2 particular people     | Treat GBG as 1 group. Internal  |
| sitting together                 | rearrangement of girls 2!       |
|                                  |                                 |
| $$5040 - 1440 = 3600$$           | Arrange 6 units around a circle |
|                                  | (6--1)!                         |
|                                  |                                 |
|                                  | $$2! \times 5! = 240$$          |
+----------------------------------+---------------------------------+

7.  Consider a necklace of six differently coloured beads. Because the
    necklace can be turned over, clockwise and anti-clockwise
    arrangements of the beads do not yield different orders. Hence find
    how many different arrangements there are of the six beads on the
    necklace.

$$\frac{(6 - 1)!}{2} = \ 60$$

8.  In how many ways can ten different keys be placed on a key ring?

$$\frac{(10 - 1)!}{2} = \ 181\ 440$$

9.  In how many ways can a set of 10 beads be arranged

+-----------------------+-------------------------------------+---------------------------------------------------+
| a.  in a line         | b.  in a circle?                    | c.  on a bracelet?                                |
|                       |                                     |                                                   |
| $$10!\  = \ 3628800$$ | $$(10 - 1)!\  = \ 9!\  = \ 362880$$ | $$\frac{(10 - 1)!}{2} = \frac{9!}{2} = \ 181440$$ |
+=======================+=====================================+===================================================+

10. A group of 7 people sit around a table. In how many ways can they be
    arranged

+---------------------------------+---------------------------------+
| a.  with no restrictions        | b.  if 2 people want to sit     |
|                                 |     together                    |
| $$(7 - 1)!\  = \ 6!\  = \ 720$$ |                                 |
|                                 | Treat pair as one unit, 2!      |
|                                 | internal arrangements\          |
|                                 | arrange 6 units around a        |
|                                 | circle: 5!                      |
|                                 |                                 |
|                                 | $$2!5! = 240$$                  |
+=================================+=================================+
| c.  if 2 people cannot sit      | d.  if 3 people sit together?   |
|     together                    |                                 |
|                                 | Treat three as one unit, 3!     |
| Total - (2 together): 720 - 240 | internal arrangements\          |
| = 480                           | arrange 5 units around a        |
|                                 | circle: 4!                      |
|                                 |                                 |
|                                 | $$3!4! = 144$$                  |
+---------------------------------+---------------------------------+

Mastery

11. In how many ways can the integers 1, 2, 3, 4, 5, 6, 7, 8 be placed
    in a circle if:

+----------------------------------+---------------------------------+
| a.  there are no restrictions,   | b.  all the even numbers are    |
|                                  |     together,                   |
| $$(8 - 1)!\  = \ 7!\  = \ 5040$$ |                                 |
|                                  | Even numbers (2,4,6,8): 4       |
|                                  | numbers                         |
|                                  |                                 |
|                                  | Treat as one unit with odd      |
|                                  | numbers (1,3,5,7): 5 objects    |
|                                  |                                 |
|                                  | Circular: (5-1)! = 4!           |
|                                  |                                 |
|                                  | Internal even arrangements: 4!  |
|                                  |                                 |
|                                  | Total: 4! 4! = 576              |
+==================================+=================================+
| c.  the odd and even numbers     | d.  at least two odd numbers    |
|     alternate,                   |     are together,               |
|                                  |                                 |
| Fix one odd number, arrange 3    | Approach: Total - (no odd       |
| others: 3!                       | together)                       |
|                                  |                                 |
| Arrange 4 even in gaps: 4!       | Consider alternating (no 3 odd  |
|                                  | together): from part c = 144    |
| Total: 3! 4! = 144               |                                 |
|                                  | 5040 - 144 = 4896               |
+----------------------------------+---------------------------------+
| e.  the numbers 1 and 7 are      | f.  the numbers 3 and 4 are     |
|     adjacent,                    |     separated?                  |
|                                  |                                 |
| Treat 1 and 7 as one unit:       | total - (3 and 4 adjacent):     |
| (7-1)! = 6! = 720                | 5040 - 1440 = 3600              |
|                                  |                                 |
| Multiply by 2: 720(2) = 1440     |                                 |
+----------------------------------+---------------------------------+

12. Find how many arrangements of $n$ people around a circle are
    possible if:

+---------------------------------+---------------------------------+
| a.  there are no restrictions,  | b.  two particular people must  |
|                                 |     sit together,               |
| $$(n - 1)!$$                    |                                 |
|                                 | Treat pair as unit, there are   |
|                                 | $n - 1$ units.\                 |
|                                 | Arrange around circle:          |
|                                 | =$\ (n - 2)!$                   |
|                                 |                                 |
|                                 | Multiply by 2! Internal         |
|                                 | arrangements: $2!(n - 2)!$      |
+=================================+=================================+
| c.  two particular people sit   | d.  three particular people sit |
|     apart,                      |     together.                   |
|                                 |                                 |
| Total - together:               | Treat 3 as unit, there are      |
| $(n - 1)!\  - \ 2(n - 2)!\$     | $n - 2$ units.\                 |
|                                 | Arrange around circle =         |
| $$= (n - 2)!(n - 1 - 2)$$       | $(n - 3)!$                      |
|                                 |                                 |
| $$= (n - 2)!(n - 3)$$           | Multiply by 3!: $6(n - 3)!$     |
+---------------------------------+---------------------------------+

13. Twelve marbles are to be placed in a circle. In how many ways can
    this be done if:

+--------------------------------------------+---------------------------------+
| a.  all the marbles are of different       | b.  there are eight red, three  |
|     colours,                               |     blue and one green marble?  |
|                                            |                                 |
| $$(12 - 1)!\  = \ 11!\  = \ 39\ 916\ 800$$ | Identical items (8 red, 3 blue, |
|                                            | 1 green)                        |
|                                            |                                 |
|                                            | Fix one position, then divide   |
|                                            | to account for identical        |
|                                            | elements                        |
|                                            |                                 |
|                                            | $\frac{11!}{8!3!1!}$ $= \ 165$  |
+============================================+=================================+

14. A sports committee consisting of four rowers, three basketballers
    and two cricketers sit at a circular table.

    a.  How many different arrangements of the committee are possible if
        the rowers and basketballers both sit together in groups, but no
        rower sits next to a basketballer?

Treat as one big group: {RRRR C BBB},

Choose 1 of 2 cricketers to sit in middle: 2

The problem has been simplified to the 1 big unit and a lone cricketer,
2 units total, arrange 2 units around circle: 1!

Arrange rowers: 4!

Arrange basketballers: 3!

Total: $2 \times 4! \times 3! = 288$

b.  One rower and one cricketer are related. If the conditions in part
    **a** apply, what is the probability that these two members of the
    committee will sit next to one another?

The cricketers and rowers are seated in this manner: CRRRRC, there is a
1 in 4 chance the rower sits next to the cricketer he/she's related to

# Unordered Selections without Repetition (Combinations)

+-------------------------------------------------------------------+
| - **Investigation** Unordered selections without repetition.      |
+===================================================================+
| **Permutations** involve **ordered** arrangements from a larger   |
| set.                                                              |
|                                                                   |
| Examples include: Arranging in a line, choosing teams where       |
| positions matter.                                                 |
|                                                                   |
| **Combinations** involve choosing **unordered** subsets from a    |
| larger set.                                                       |
|                                                                   |
| Examples include: Choosing teams where positions don't matter.    |
|                                                                   |
| You have 5 people: A, B, C, D, E. You need to form a team of 3    |
| where order doesn't matter.                                       |
|                                                                   |
| **Method 1: List systematically** (there are 10)                  |
|                                                                   |
| **Method 2: Divide permutations by identical subsets.**           |
|                                                                   |
| The number of ordered arrangements of 3 people from 5 is:         |
| .........                                                         |
|                                                                   |
| Consider the team of {A, B, C}. Since order doesn't matter:       |
|                                                                   |
| A, B, C A, C, B B, A, C B, C, A C, A, B C, B, A are all the same  |
| team.                                                             |
|                                                                   |
| Each team can be arranged in ......! = ...... ways, so we divide  |
| the total permutations by ......!                                 |
|                                                                   |
| Therefore, total number of combinations is:                       |
| $\frac{\ ^{(\ \ \ \ )}P_{(\ \ \ \ )}}{(\ \ \ \ )!}$ which can be  |
| simplified to:                                                    |
|                                                                   |
| **Method 3: Yes-or-No method**                                    |
|                                                                   |
| Think of asking each person: \"Are you in the team?\"             |
|                                                                   |
| For example, choosing {A, C, D} from A B C D E is the same as Y N |
| Y Y N.                                                            |
|                                                                   |
| Order matters here as Y Y Y N N {A, B, C} is different to {A, C,  |
| D}.                                                               |
|                                                                   |
| For a team of 3, this is equivalent to arranging 3 Ys and 2 Ns in |
| a line, which is:                                                 |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Combinations**                                                |
+===================================================================+
| A **combination** is an **unordered** selection of distinct       |
| elements from a set without repetition.                           |
|                                                                   |
| To select $r$ objects from a set of $n$ objects:                  |
|                                                                   |
| $$\ ^{n}C_{r} = \frac{n!}{r!(n - r)!}$$                           |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------+
| - **Interpret** Combination notation.                                                      |
+========================================+=========================+=========================+
| Write an expression for:                                                                   |
+----------------------------------------+-------------------------+-------------------------+
| a.  $\ ^{6}C_{2}$                      | b.  $\ ^{8}C_{2}$       | c.  $\ ^{8}P_{5}$       |
|                                        |                         |                         |
| $$\ \ \ \ \ \ \ \  = \frac{6!}{2!4!}$$ |                         |                         |
+----------------------------------------+-------------------------+-------------------------+
| d.  $\ ^{10}C_{10}$                    | e.  $\ ^{10}C_{0}$      | f.  $\ ^{11}C_{1}$      |
+----------------------------------------+-------------------------+-------------------------+
| g.  $\ ^{11}C_{10}$                    | h.  $\ ^{10}C_{2}$      | i.  $\ ^{10}C_{8}$      |
+----------------------------------------+-------------------------+-------------------------+
| What do you notice about $\ ^{n}C_{n}\$and $\ ^{n}C_{0}$?                                  |
|                                                                                            |
| What do you notice about $\ ^{n}C_{1}$ and $\ ^{n}C_{n - 1}?$                              |
|                                                                                            |
| What do you notice about $\ ^{n}C_{r}$ and $\ ^{n}C_{n - r}$?                              |
+--------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
| - **Combination Notation on a Calculator**                                                                            |
+=======================================================================================================================+
| **FX-82 AU**                                                                                                          |
|                                                                                                                       |
| ![](media/Permutations and Combinations/media/image20.png){width="2.1868055555555554in"                               |
| height="0.7708333333333334in"}![](media/Permutations and Combinations/media/image21.png){width="0.8201388888888889in" |
| height="0.2923611111111111in"}                                                                                        |
|                                                                                                                       |
| **FX-8200 AU**                                                                                                        |
|                                                                                                                       |
| ![](media/Permutations and Combinations/media/image22.png){width="2.8394542869641293in"                               |
| height="0.22212160979877515in"}                                                                                       |
+-----------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------+
| - **Example** Count total number of combination arrangements.                          |
+===================================+====================================================+
| A badminton team of 2 is chosen   | A school has 10 Physics teachers and 15 Maths      |
| from 8 players. How many ways can | teachers. A committee to is to be formed with 4    |
| this be done?                     | Physics teachers and 6 Maths teachers. How many    |
|                                   | ways can this be done?                             |
| $$\ ^{8}C_{2} = 28$$              |                                                    |
|                                   | $$\ ^{10}C_{4} \times \ ^{15}C_{6} = 1\ 051\ 050$$ |
+-----------------------------------+----------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                              |
+===================================+=========================================================================================+
| 10 people meet to play doubles    | A coin is tossed 5 times. How many ways are there of getting 2 heads?                   |
| tennis.                           |                                                                                         |
|                                   | $$5C2 = 10$$                                                                            |
| How many ways can 4 people be     |                                                                                         |
| selected to play the first game   |                                                                                         |
| (ignore subsequent arrangement    |                                                                                         |
| into pairs)                       |                                                                                         |
|                                   |                                                                                         |
| $$10C4 = 210$$                    |                                                                                         |
+-----------------------------------+-----------------------------------------------------------------------------------------+
| A workplace has 4 women and 6     | Ten points are arranged equally around a circle. How many ways are there of drawing a   |
| men. How many ways can you select | triangle using these points?                                                            |
| 2 women and 2 men to form a       |                                                                                         |
| committee?                        | ![](media/Permutations and Combinations/media/image23.png){width="1.5729166666666667in" |
|                                   | height="1.5644149168853894in"}                                                          |
| $$4C2 \times 6C2 = 90$$           |                                                                                         |
|                                   | $$10C3 = 120$$                                                                          |
+-----------------------------------+-----------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------+
| - **Example** Count total number of combination arrangements.                                        |
+================================================+=====================================================+
| Let                                            | Ten cards are selected from a standard deck of 52.  |
| $S = \left\{ 2,\ 4,\ 6,\ 8,\ 10,\ 12 \right\}$ | Find the number of combinations if exactly 7 of the |
|                                                | cards are hearts.                                   |
| How many subsets of S contain at most two      |                                                     |
| elements?                                      | Choose 7 hearts from the 13 hearts, then choose 3   |
|                                                | other cards from remaining 39.                      |
| Case 1: Sets with 0 numbers                    |                                                     |
|                                                | $$\ ^{13}C_{7} \times \ ^{39}C_{3} = 15\ 682\ 524$$ |
| $$\ ^{6}C_{0} = 1$$                            |                                                     |
|                                                |                                                     |
| Case 2: Sets with 1 number                     |                                                     |
|                                                |                                                     |
| $$\ ^{6}C_{1} = 6$$                            |                                                     |
|                                                |                                                     |
| Case 3: sets with 2 numbers                    |                                                     |
|                                                |                                                     |
| $$\ ^{6}C_{2} = 15$$                           |                                                     |
+------------------------------------------------+-----------------------------------------------------+

+------------------------------------------------------------------------------+
| - **Practice**                                                               |
+==========================================+===================================+
| 10 students, 4 boys and 6 girls, travel  | A debating team of 5 members is   |
| from school to a sports ground. 6 go on  | to be chosen from 4 boys and 3    |
| a minibus, 2 take the train and 2 get    | girls. How many ways are there of |
| driven by their parents. How many ways   | choosing the members so that boys |
| is this possible if none of the girls    | outnumber girls?                  |
| take the train and 1 boy and 1 girl get  |                                   |
| driven?                                  | Case 1: BBBGG:                    |
|                                          | $4C3 \times 3C2 = 12$             |
| First deal with the restrictions:\       |                                   |
| 4C2 boys take the train. 2 Boys 6 girls  | Case 2: BBBBG                     |
| remain                                   | $4C4 \times 3C1 = 3$              |
|                                          |                                   |
| $2C1 \times 6C1$ get driven. 1 boy 5     | Case 3: BBBBB is impossible       |
| girls remain                             |                                   |
|                                          | Total: 15                         |
| $6C6$ take the minibus                   |                                   |
|                                          |                                   |
| $4C2 \times 2C1 \times 6C1 \times 6C6 =$ |                                   |
| 72 possible ways                         |                                   |
+------------------------------------------+-----------------------------------+

Foundation

1.  Find in how many ways you can form a group of:

+---------------------------------+---------------------------------+
| a.  two people from a choice of | b.  three people from a choice  |
|     seven,                      |     of seven,                   |
|                                 |                                 |
| $$⁷C₂\  = \ 21$$                | $$⁷C₃\  = \ 35$$                |
+=================================+=================================+
| c.  two people from a choice of | d.  five people from a choice   |
|     six,                        |     of nine.                    |
|                                 |                                 |
| $$⁶C₂\  = \ 15$$                | $$⁹C₅\  = \ 126$$               |
+---------------------------------+---------------------------------+

2.  A bag contains 23 lollies. If I take 6 lollies out, how many
    different combinations are possible?

$$\ ^{23}C_{6} = \ 100\ 947$$

3.  A team of 4 players is chosen at random from a group of 20 tennis
    players to play in an exhibition match. In how many ways could the
    team be chosen?

$$²⁰C₄\  = \ 4845$$

4.  a.  Find how many possible combinations there are if, from a group
        of ten people:

+-------------------------------+-------------------------------+
| i.  two people are chosen,    | ii. eight people are chosen.  |
|                               |                               |
| $$¹⁰C₂ = 45$$                 | $$¹⁰C₈ = 45$$                 |
+===============================+===============================+

a.  Why are the answers identical?

Choosing 2 from 10 is the same as choosing 8 to leave behind.

This is the identity $\ ^{n}C_{r} = \ ^{n}C_{n - r}$

5.  From a party of 12 men and 8 women, find how many groups can be
    chosen consisting of:

+-----------------------------------+---------------------------------+
| a.  five men and three women      | b.  four women and four men     |
|                                   |                                 |
| $$¹²C₅\  \times \ ⁸C₃ = 44\ 352$$ | $$⁸C₄\  \times \ ¹²C₄ = 34650$$ |
+===================================+=================================+

6.  Four numbers are to be selected from the set of the first eight
    positive integers.\
    Find how many possible combinations there are if:

+-----------------------------------+-----------------------------------+
| a.  there are no restrictions,    | b.  there are two odd numbers and |
|                                   |     two even numbers,             |
| $$⁸C₄ = 70$$                      |                                   |
|                                   | Choose 2 odd from 4, then 2 even  |
|                                   | from 4                            |
|                                   |                                   |
|                                   | $$⁴C₂\  \times \ ⁴C₂ = 36$$       |
+===================================+===================================+
| c.  there is exactly one odd      | d.  all the numbers must be even, |
|     number,                       |                                   |
|                                   | $$⁴C₄ = 1$$                       |
| Choose 1 odd, then choose the     |                                   |
| rest from the even.               |                                   |
|                                   |                                   |
| $$4C1\  \times \ 4C3 = 16$$       |                                   |
+-----------------------------------+-----------------------------------+
| e.  there is at least one odd number.                                 |
|                                                                       |
| Total -- all even = 70 -- 1 = 69                                      |
+-----------------------------------------------------------------------+

7.  A bag contains 3 green and 6 blue balls. How many ways are there of
    drawing 4 balls if:

+---------------------------------+-------------------------------------+
| a.  the balls may be of any     | b.  there are exactly two green     |
|     colour,                     |     balls,                          |
|                                 |                                     |
| $$⁹C₄ = 126$$                   | Choose 2 green and 2 blue           |
|                                 |                                     |
|                                 | $$³C₂\  \times \ ⁶C₂ = 45$$         |
+=================================+=====================================+
| c.  there are at least two      | d.  there are more blue balls than  |
|     green balls,                |     green balls.                    |
|                                 |                                     |
| At least two means two cases: 2 | two cases: 3 blue, 4 blue           |
| Green + 3 Green                 |                                     |
|                                 | $$⁶C₃\  \times ³C₁\  + \ ⁶C₄ = 75$$ |
| 2 green: 45 (from part b)       |                                     |
|                                 |                                     |
| 3 green:                        |                                     |
| $³C₃\  \times \ ⁶C₁ = 6$        |                                     |
|                                 |                                     |
| $$45 + 6 = 51$$                 |                                     |
+---------------------------------+-------------------------------------+

8.  A committee of 6 people is to be selected at random from a group of
    11 men and 12 women. Find the number of possible committees if:

+-----------------------------------+------------------------------------------------+
| a.  there is no restriction on    | b.  all committee members are to be male       |
|     who is on the committee       |                                                |
|                                   | $$¹¹C₆ = 462$$                                 |
| $$²³C₆ = 100\ 947$$               |                                                |
+===================================+================================================+
| c.  all committee members are to  | d.  there are to be 3 men and 3 women          |
|     be female                     |                                                |
|                                   | $$\ ^{11}C_{3} \times \ ^{12}C_{3} = 36\ 300$$ |
| $$¹²C₆ = 924$$                    |                                                |
+-----------------------------------+------------------------------------------------+
| e.  Anna is included              | f.  Bruce is not included                      |
|                                   |                                                |
| Fix Anna in the group. Choose 5   | Exclude Bruce. Choose 6 people from 22         |
| people from 22 remaining          | remaining                                      |
|                                   |                                                |
| $$\ ^{22}C_{5} = 26\ 334$$        | $$\ ^{22}C_{6} = 74\ 613$$                     |
+-----------------------------------+------------------------------------------------+
| g.  there are to be 4 women and 2 men.                                             |
|                                                                                    |
| $$\ ^{12}C_{6} \times \ ^{11}C_{2} = 27\ 225$$                                     |
+------------------------------------------------------------------------------------+

Development

9.  Ten cards are selected at random from a set of 52 playing cards.\
    Find the number of combinations selected if:

+-----------------------------------------------------+-----------------------------------+
| a.  there are no restrictions\                      | b.  they are all hearts           |
|     (answer in scientific notation correct to 3     |                                   |
|     significant figures)                            | Choose 10 hearts from 13 hearts   |
|                                                     |                                   |
| $$\ ^{52}C_{10} = 1.58 \times 10^{10}$$             | $$\ ^{13}C_{10} = 286$$           |
+=====================================================+===================================+
| c.  there are 7 hearts                              | d.  they are all red cards        |
|                                                     |                                   |
| Choose 7 hearts from 13, then 3 from the rest       | Choose 10 red from 26 total       |
|                                                     |                                   |
| $$\ ^{13}C_{7} \times \ ^{39}C_{3} = 15\ 682\ 524$$ | $$\ ^{26}C_{10} = 5\ 311\ 735$$   |
+-----------------------------------------------------+-----------------------------------+
| e.  there are 4 aces.                                                                   |
|                                                                                         |
| Choose 4 aces from 4, then 6 from 48 remaining cards                                    |
|                                                                                         |
| $$\ ^{4}C_{4} \times \ ^{48}C_{6} = 12\ 271\ 512$$                                      |
+-----------------------------------------------------------------------------------------+

10. Out of a group of 25 students, 7 walk to school, 12 catch a train
    and 6 catch a bus.\
    If 6 students are selected, find the number of combinations if:

+----------------------------------------------------------------+----------------------------------------------------------------+
| a.  all walk to school                                         | b.  no one catches a bus                                       |
|                                                                |                                                                |
| $$\ ^{7}C_{6} = 7$$                                            | Choose 6 from 19 who walk/train                                |
|                                                                |                                                                |
|                                                                | $$\ ^{19}C_{6} = 27132$$                                       |
+================================================================+================================================================+
| c.  3 walk to school and 1 catches a bus                       | d.  1 walks to school and 4 catch a train                      |
|                                                                |                                                                |
| $$\ ^{7}C_{3} \times \ ^{6}C_{1} \times \ ^{12}C_{2} = 13860$$ | $$\ ^{7}C_{1} \times \ ^{12}C_{4} \times \ ^{6}C_{1} = 20790$$ |
+----------------------------------------------------------------+----------------------------------------------------------------+
| e.  3 catch a train and 1 catches a bus.                                                                                        |
|                                                                                                                                 |
| $$\ ^{12}C_{3} \times \ ^{6}C_{1} \times \ ^{7}C_{2} = 27720$$                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------+

11. A committee of five is to be chosen from six men and eight women.\
    Find how many committees are possible if:

+---------------------------------+--------------------------------------------------------------------+
| a.  there are no restrictions,  | b.  all members are to be female,                                  |
|                                 |                                                                    |
| $$¹⁴C₅\  = \ 2002$$             | $$⁸C₅\  = \ 56$$                                                   |
+=================================+====================================================================+
| c.  all members are to be male, | d.  there are exactly two men,                                     |
|                                 |                                                                    |
| $$⁶C₅\  = \ 6$$                 | $$⁶C₂\  \times \ ⁸C₃\  = 840$$                                     |
+---------------------------------+--------------------------------------------------------------------+
| e.  there are four women and    | f.  there is a majority of women,                                  |
|     one man,                    |                                                                    |
|                                 | three cases: 3 women, 4 women, or 5 women                          |
| $$⁸C₄\  \times \ ⁶C₁ = 420$$    |                                                                    |
|                                 | $$(⁸C₃\  \times \ ⁶C₂)\  + (⁸C₄\  \times \ ⁶C₁)\  + \ ⁸C₅ = 1316$$ |
+---------------------------------+--------------------------------------------------------------------+
| g.  a particular man must be    | h.  a particular man must not be included.                         |
|     included,                   |                                                                    |
|                                 | $$¹³C₅\  = \ 1287$$                                                |
| $$¹³C₄\  = \ 715$$              |                                                                    |
+---------------------------------+--------------------------------------------------------------------+

12. 

+-----------------------------------+-----------------------------------+
| a.  What is the number of         | b.  How many of the four-letter   |
|     combinations of the letters   |     combinations contain four     |
|     of the word EQUATION taken    |     vowels?                       |
|     four at a time (without       |                                   |
|     repetition)?                  | $$⁵C₄\  = \ 5$$                   |
|                                   |                                   |
| $$⁸C₄\  = \ 70$$                  |                                   |
+===================================+===================================+
| c.  How many of the four-letter combinations contain the letter Q?    |
|                                                                       |
| $$⁷C₃\  = \ 35$$                                                      |
+-----------------------------------------------------------------------+

13. A team of seven netballers is to be chosen from a squad of twelve
    players A, B, C, D, E, F, G, H, I, J, K and L. In how many ways can
    they be chosen:

+-----------------------------------+-----------------------------------+
| a.  with no restrictions,         | b.  if the captain C is to be     |
|                                   |     included,                     |
| $$¹²C₇\  = \ 792$$                |                                   |
|                                   | $$11C6\  = \ 462$$                |
+===================================+===================================+
| c.  if J and K are both to be     | d.  if A is included but H is     |
|     excluded,                     |     not,                          |
|                                   |                                   |
| $$¹⁰C₇\  = \ 120$$                | $$¹⁰C₆\  = \ 210$$                |
+-----------------------------------+-----------------------------------+
| e.  if one of F and L is to be included and the other excluded?       |
|                                                                       |
| 2 ways to choose between F and L, then fill 6 positions from 10       |
| remaining                                                             |
|                                                                       |
| $$¹⁰C₆\  \times 2 = \ 420$$                                           |
+-----------------------------------------------------------------------+

14. Consider the digits 9, 8, 7, 6, 5, 4, 3, 2, 1 and 0.\
    Find how many five-digit numbers are possible if the digits are to
    be in:

+-----------------------------------+--------------------------------------------------+
| a.  descending order,             | b.  ascending order.                             |
|                                   |                                                  |
| Choose 5 from 10, arrange in      | Choose 5 from 10, but numbers cannot start with  |
| descending order                  | 0;\                                              |
|                                   | subtract cases where 0 is selected               |
| $$¹⁰C₅\  = \ 252$$                |                                                  |
|                                   | $$¹⁰C₅\  - \ ⁹C₄\  = \ 252\  - \ 126\  = \ 126$$ |
+===================================+==================================================+
| c.  Why do these two questions involve unordered selections?                         |
|                                                                                      |
| Once 5 numbers selected, only one arrangement for ascending/descending is possible,  |
| so we do not need to count rearrangements.                                           |
+--------------------------------------------------------------------------------------+

15. Twelve people arrive at a restaurant. There is one table for six,
    one table for four and one table for two. In how many ways can they
    be assigned to a table?

Choose 6 people for the first table, then 4 for the next, and 2 for the
last.

¹²C₆ × ⁶C₄ × ²C₂ = 13860

16. Twenty students, ten male and ten female, are to travel from school
    to the sports ground.\
    Eight of them go in a minibus, six of them in cars, four of them on
    bikes and two walk.

+-------------------------------------------------------------------------------+-----------------------------------------------------------------------------+
| a.  In how many ways can they be distributed for the trip?                    | b.  In how many ways can they be distributed if none of the boys walk?      |
|                                                                               |                                                                             |
| $$²⁰C₈\  \times \ ¹²C₆\  \times \ ⁶C₄\  \times \ ²C₂\  = \ 1\ 745\ 944\ 200$$ | $$¹⁰C₂\  \times \ ¹⁸C₈\  \times \ ¹⁰C₆\  \times \ ⁴C₄\  = \ 413\ 513\ 100$$ |
+===============================================================================+=============================================================================+

17. Ten points P₁, P₂, \..., P₁₀ are chosen in a plane, no three of the
    points being collinear.

+---------------------------------+---------------------------------+
| a.  How many lines can be drawn | b.  How many triangles can be   |
|     through pairs of the        |     drawn using the given       |
|     points?                     |     points as vertices?         |
|                                 |                                 |
| Choose 2 points to draw a line  | Choose three points to connect  |
| through                         | as a triangle                   |
|                                 |                                 |
| $$¹⁰C₂\  = \ 45$$               | $$¹⁰C₃\  = \ 120$$              |
+=================================+=================================+
| c.  How many of these triangles | d.  How many of these triangles |
|     have P₁ as one of their     |     have P₁ and P₂ as vertices? |
|     vertices?                   |                                 |
|                                 | Fix P1 and P2, choose 1 more    |
| Fix P1 and choose 2 points from | point from 8 to make a triangle |
| 9 remaining                     |                                 |
|                                 | $$⁸C₁\  = \ 8$$                 |
| $$⁹C₂\  = \ 36$$                |                                 |
+---------------------------------+---------------------------------+

18. Ten points are chosen in a plane. Five of the points are collinear,
    but no other set of three of the points is collinear.

+---------------------------------+---------------------------------+
| a.  How many sets of three      | b.  How many triangles can be   |
|     points can be selected from |     formed using three of the   |
|     the five that are           |     ten points as vertices?     |
|     collinear?                  |                                 |
|                                 | Total ways to choose 3 points   |
| Choose 3 points from the 5      | -- collinear ways               |
| collinear                       |                                 |
|                                 | $$¹⁰C₃\  - \ ⁵C₃\  = \ 110$$    |
| $$⁵C₃\  = \ 10$$                |                                 |
+=================================+=================================+

19. From a standard deck of 52 playing cards, find how many five-card
    hands can be dealt:

+------------------------------------------------+-------------------------------------------------------------------+
| a.  consisting of black cards only,            | b.  consisting of diamonds only,                                  |
|                                                |                                                                   |
| $$²⁶C₅\  = \ 65\ 780$$                         | $$13C5\  = \ 1287$$                                               |
+================================================+===================================================================+
| c.  containing all four kings,                 | d.  consisting of three diamonds and two clubs,                   |
|                                                |                                                                   |
| $$⁴C₄\  \times \ ⁴⁸C₁\  = \ 48$$               | $$¹³C₃\  \times \ ¹³C₂\  = \ 22\ 308$$                            |
+------------------------------------------------+-------------------------------------------------------------------+
| e.  consisting of three twos and another pair, | f.  consisting of one pair and three of a kind.                   |
|                                                |                                                                   |
| 4C3 ways to choose three twos                  | For the pair: Choose 1 rank from 13, then 2 from that rank        |
|                                                |                                                                   |
| Then choose any rank from the 12 remaining     | For the three of a kind: Choose 1 rank from 12 (since you cant    |
|                                                | have a pair and a 3 from the same rank) then choose 3 from that   |
| Then choose 2 cards from that rank             | rank.                                                             |
|                                                |                                                                   |
| $$⁴C₃\  \times \ ¹²C₁\  \times \ ⁴C₂\  = 288$$ | $$(¹³C₁\  \times \ ⁴C₂)\  \times (¹²C₁\  \times \ ⁴C₃)\  = 3744$$ |
+------------------------------------------------+-------------------------------------------------------------------+

20. A group of four people A, B, C and D are to be split into two groups
    of two.\
    Jimmy claims that the answer is ⁴C₂ × ²C₂ = 6: first choose two
    people out of four to go into one group, then the remaining two
    people become the other group, by default.

    a.  By listing the possible combinations, how many possible ways can
        the four people be split into two groups of two?

{A,B} & {C,D} {A,C} & {B,D} {A,D} & {B,C}

Only 3

b.  Jimmy insists it's 6, showing you his list:\
    Explain why his answer is exactly double the actual number of
    possible combinations.

  -------------------
   **Group   **Group
     1**       2**
  --------- ---------
    A, B      C, D

    A, C      B, D

    A, D      B, C

    C, D      A, B

    B, D      A, C

    B, C      A, D
  -------------------

Since group 1 and group 2 are indistinguishable (no Group 1 vs Group 2
labels) Bob's method overcounts by a factor of 2.

21. In how many ways can a group of six people be divided into:

+----------------------------------+---------------------------------+
| a.  two unequal groups\          | b.  two equal groups?           |
|     (neither group being empty), |                                 |
|                                  | 6C3, but we need to divide by 2 |
| Possible unequal ways to split   | as the groups are               |
| the group are (1, 5) and (2,3)   | indistinguishable               |
|                                  |                                 |
| $$⁶C₁\  + \ ⁶C₂\  = \ \ 21$$     | $$\frac{⁶C₃}{2}\  = \ 10$$      |
+==================================+=================================+
| c.  Repeat part **a** for four   | d.  Repeat part **b** for four  |
|     people                       |     people                      |
|                                  |                                 |
| $$⁴C₁\  = \ 4$$                  | $$\frac{⁴C₂}{2}\  = \ 3$$       |
+----------------------------------+---------------------------------+
| e.  Repeat part **a** for eight  | f.  Repeat part **b** for eight |
|     people                       |     people                      |
|                                  |                                 |
| $$⁸C₁\  + \ ⁸C₂\  + \ ⁸C₃ = 92$$ | $$\frac{⁸C₄}{2}\  = \ 35$$      |
+----------------------------------+---------------------------------+

22. Find how many diagonals there are in:

+---------------------------------+------------------------------------+
| a.  a quadrilateral,            | b.  a pentagon,                    |
|                                 |                                    |
| A quadrilateral has 4 vertices. | A pentagon has 5 vertices. Choose  |
| Choose 2 points to connect from | 2 points to connect from 5.        |
| 4.                              |                                    |
|                                 | However, 5 of these lines are      |
| However, 4 of these lines are   | sides                              |
| sides (a quadrilateral has 4    |                                    |
| sides)                          | $$⁵C₂\  - \ 5\  = \ 5$$            |
|                                 |                                    |
| $$⁴C₂\  - \ 4\  = \ 2$$         | **Alternative method:**            |
|                                 |                                    |
| **Alternative method:**         | Consider each vertex, there are 4  |
|                                 | other vertices you could connect   |
| Consider each vertex, there are | to, but 2 of those connections are |
| 3 other vertices you could      | sides.\                            |
| connect to, but 2 of those      | Only 2 of those connections is a   |
| connections are sides.\         | diagonal                           |
| Only 1 of those connections is  |                                    |
| a diagonal                      | So $2 \times 5 = 10$               |
|                                 |                                    |
| So, $1 \times 4$                | But you have double counted as     |
|                                 | v~1~v~2~ is the same as v~2~v~1~   |
| But you have double counted as  |                                    |
| v~1~v~2~ is the same as         | $$10 \div 2 = 5$$                  |
| v~2~v~1~                        |                                    |
|                                 |                                    |
| $$4 \div 2 = 2$$                |                                    |
+=================================+====================================+
| c.  a decagon,                  | d.  a polygon with $n$ sides.      |
|                                 |                                    |
| $$¹⁰C₂\  - \ 10\  = \ 35$$      | $$ⁿC₂\  - \ n$$                    |
|                                 |                                    |
|                                 | $$or\ \frac{(n - 3) \times n}{2}$$ |
|                                 |                                    |
|                                 | if you consider both methods,\     |
|                                 | you have a combinatorial argument  |
|                                 | for this identity.                 |
+---------------------------------+------------------------------------+

Mastery

23. ![](media/Permutations and Combinations/media/image18.png){width="1.6574081364829396in"
    height="1.6686067366579178in"}Ten points A, B, \..., J are arranged
    in order around a circle.

    a.  How many triangles can be drawn with these points as vertices?

¹⁰C₃ = 120

b.  How many pairs of such triangles can be drawn, if the vertices of
    the two triangles are distinct?

Choose 6 distinct points to act as vertices. $¹⁰C₆\$

Choose 3 points for the first triangle, once you do this you have
automatically chosen 3 for the other. $\ ^{6}C_{3}$

However, since the two triangles are indistinguishable, divide by 2.
$\frac{\ ^{6}C_{3}}{2}$\
E.g. Triangle 1: {A B C} Triangle 2: {D E F} is the same as Triangle 1:
{D E F} Triangle 2: {A B C}

$$¹⁰C₆\  \times \ \frac{\ ^{6}C_{3}}{2}\  = \ 2100$$

c.  In how many such pairs will the triangles:

    i.  not overlap,

> Hint: For the triangles to not overlap, the points must be in
> consecutive order. List the ways.

For triangles to not overlap, we must choose consecutive points for each
triangle.

Imagine you chose {A B C D E F} as your points, there are exactly three
ways to partition them into two groups in consecutive order.

$$\left\{ A\ B\ C \right\}\ \left\{ D\ E\ F \right\}\ $$

$$\left\{ B\ C\ D \right\}\ \left\{ E\ F\ A \right\}$$

$$\ \left\{ C\ D\ E \right\}\ \left\{ F\ A\ B \right\}$$

^1^⁰C₆ × 3 = 630

ii. overlap?

Not overlapping and overlapping are complementary

2100 - 630 = 1470

24. Twelve points are arranged in order around a circle.

+------------------------------------+-----------------------------------------------------+
| a.  How many triangles can be      | b.  In how many pairs of such triangles are the     |
|     drawn with these points as     |     vertices of the two triangles distinct?         |
|     vertices?                      |                                                     |
|                                    | $$\ ^{12}C_{6} \times \frac{\ ^{6}C₃}{2} = 9240\ $$ |
| $$¹²C₃\  = \ 220$$                 |                                                     |
+====================================+=====================================================+
| c.  In how many such pairs will    | d.  In how many such pairs will the triangles       |
|     the triangles not overlap?     |     overlap?                                        |
|                                    |                                                     |
| Like the previous question, three  | $$9240\  - \ 2772\  = \ 6468$$                      |
| ways to partition six elements     |                                                     |
| into two groups in consecutive     |                                                     |
| order                              |                                                     |
|                                    |                                                     |
| $$\ ^{12}C_{6} \times 3 = 2772\ $$ |                                                     |
+------------------------------------+-----------------------------------------------------+

25. Let S = {1, 3, 5, 7, 9, 11, 13, 15, 17, 19} be the set of the first
    ten positive odd integers.

+-------------------------------------------------+---------------------------------------------------------------------------+
| a.  How many subsets does S have?               | b.  How many subsets of S contain at least three numbers?                 |
|                                                 |                                                                           |
| $$2¹⁰\  = \ 1024$$                              | Subtract subsets of 0 numbers, 1 number, 2 numbers from total.            |
|                                                 |                                                                           |
|                                                 | $$2¹⁰\  - \ ¹⁰C₀\  - \ ¹⁰C₁\  - \ ¹⁰C₂\  = \ 968$$                        |
+=================================================+===========================================================================+
| c.  How many subsets with at least three        | d.  How many subsets with at least three numbers do not contain 7 but do  |
|     numbers do not contain 7?                   |     contain 19?                                                           |
|                                                 |                                                                           |
| Consider 9 elements (exclude 7)                 | Fix 19, at least 2 more from remaining 8 (excluding 7)                    |
|                                                 |                                                                           |
| $$2^{9}\  - \ ⁹C₀\  - \ ⁹C₁\  - \ ⁹C₂\  = 466$$ | $$⁸C₂\  + \ ⁸C₃\  + \ ⁸C₄\  + \ ⁸C₅\  + \ ⁸C₆\  + \ ⁸C₇\  + \ ⁸C₈ = 247$$ |
+-------------------------------------------------+---------------------------------------------------------------------------+

26. In how many ways can two numbers be selected from 1, 2, \..., 8, 9
    so that their sum is:

+-----------------------------------+-----------------------------------+
| a.  even,                         | b.  odd,                          |
|                                   |                                   |
| There are 5 odd and 4 even.       | a sum is odd if one odd, one even |
|                                   |                                   |
| A sum is even if both odd or both | $$5\  \times \ 4\  = \ 20$$       |
| even                              |                                   |
|                                   |                                   |
| $$⁵C₂\  + \ ⁴C₂\  = 16$$          |                                   |
+===================================+===================================+
| c.  divisible by 3,               | d.  divisible by 5,               |
|                                   |                                   |
| list possible ways to sum to a    | (1,4), (1,9), (2,3), (2,8),       |
| multiple of 3:                    | (3,7), (4,6), (5,9), (6,9)        |
|                                   |                                   |
| (1,2), (1,5), (1,8), (2,4),       | $$8$$                             |
| (2,7), (3,6), (3,9), (4,5),       |                                   |
| (4,8), (5,7), (6,9), (7,8)        |                                   |
|                                   |                                   |
| $$12$$                            |                                   |
+-----------------------------------+-----------------------------------+
| e.  divisible by 6?                                                   |
|                                                                       |
| List possible ways to sum to a multiple of 6. Can use part **c:**     |
|                                                                       |
| (1,5), (3,9), (4,8), (5,7), (6,9)                                     |
|                                                                       |
| $$5$$                                                                 |
+-----------------------------------------------------------------------+

27. There are ten basketballers in a team. Find in how many ways:

+---------------------------------+---------------------------------+
| a.  the starting five can be    | b.  they can be split into two  |
|     chosen,                     |     teams of five.              |
|                                 |                                 |
| $$¹⁰C₅\  = \ 252$$              | $$\frac{¹⁰C₅}{2}\  = \ 126$$    |
+=================================+=================================+

28. Nine players are to be divided into two teams of four and one
    umpire.

+------------------------------------------------------+-------------------------------------------------------------+
| a.  In how many ways can the teams be formed?        | b.  If two particular people cannot be on the same team,    |
|                                                      |     how many different combinations are possible?           |
| Choose umpire, then divide remaining 8 into two      |                                                             |
| teams                                                | total -- same team.                                         |
|                                                      |                                                             |
| $$\ ^{9}C_{1}\  \times \frac{\ ^{8}C_{4}}{2} = 315$$ | Choose umpire, fix 2 in same team.                          |
|                                                      |                                                             |
|                                                      | $$\ ^{7}C_{1} \times \ ^{6}C_{2} \times \ ^{4}C_{4} = 105$$ |
|                                                      |                                                             |
|                                                      | $$315 - 105 = 210$$                                         |
+======================================================+=============================================================+

29. Consider the number 18, it has six factors: 1, 2, 3, 6, 9, 18.\
    We can count the number of factors by using the powers of the prime
    factorisation:

$$18 = 2 \cdot 3^{2}$$

Each factor can be made from choosing a power for each prime (up to its
maximum power).

For the prime 2, you can choose powers of 0 or 1.

For the prime 3, you can choose powers of 0, 1, or 2.

Therefore, there are $2 \times 3 = 6$ total choices, which matches the
six factors.

By considering their prime factorisations, find the number of factors
of:

+----------------------------------------------------+---------------------------------+
| a.  2³ × 3²                                        | b.  1 000 000                   |
|                                                    |                                 |
| $$(3 + 1)(2 + 1)\  = \ 12$$                        | $$10^{6} = 2^{6} \cdot 5^{6}$$  |
|                                                    |                                 |
|                                                    | $$(6 + 1)(6 + 1)\  = \ 49$$     |
+====================================================+=================================+
| c.  315 000                                        | d.  2ᵃ × 5ᵇ × 13ᶜ               |
|                                                    |                                 |
| $$315000 = 2^{3} \cdot 3^{2} \cdot 5^{4} \cdot 7$$ | $$(a + 1)(b + 1)(c + 1)$$       |
|                                                    |                                 |
| $$(3 + 1)(2 + 1)(4 + 1)(1 + 1)\  = \ 120$$         |                                 |
+----------------------------------------------------+---------------------------------+

30. ![](media/Permutations and Combinations/media/image24.png){width="1.2126279527559054in"
    height="1.686751968503937in"}The diagram shows a 6 × 4 grid. The aim
    is to walk from point A to the point B by walking along the black
    lines either downwards or to the right.\
    A single move is defined as walking along one side of a single small
    square, thus it always takes you ten moves to get from A to B.

> By treating paths as ordered sequences of D and R:

a.  Find how many different routes are possible:

    i.  without restriction,

Need to count arrangements of 6 Ds and 4 Rs

This is the same as choosing 6 positions to get D, the rest
automatically get R.

$$\frac{10!}{6!4!} = \ ^{10}C_{6} = \ 210$$

(Alternatively, choose 4 positions to get R, the rest automatically get
D. $\ ^{10}C_{6} = \ ^{10}C_{4}$ due to symmetric property.)

ii. ![](media/Permutations and Combinations/media/image25.png){width="1.2171948818897638in"
    height="1.667179571303587in"}if you must pass through C,

C is 2 down, 2 right

Need 2 Ds 2 Rs at the start of the sequence, then 4 Ds 2 Rs

$\ ^{4}C_{2} \times \ ^{6}C_{4} = 90$

iii. if you cannot move along the top line of the grid,

First must be D

Arrange 5 Ds in 9 positions

$\ ^{9}C_{5} = 126$

iv. if you cannot move along the second row from the top of the grid.

This is the same as part iii

$\ ^{9}C_{5} = 126$

b.  Notice that every route must pass through one and only one of the
    five crossed points.\
    This is because a path must cross a diagonal to get from A to B.\
    Hence prove that ¹⁰C₄ = ⁴C₀ × ⁶C₄ + ⁴C₁ × ⁶C₃ + ⁴C₂ × ⁶C₂ + ⁴C₃ ×
    ⁶C₁ + ⁴C₄ × ⁶C₀.

![](media/Permutations and Combinations/media/image26.png){width="1.173076334208224in"
height="1.559332895888014in"}

Total number of paths, from part **a i**, is
$\ ^{10}C_{6} = \ ^{10}C_{4}$

Using the same method as part **a ii**

To pass through the leftmost crossed point you must have 4 Ds at the
start, then 2 D 4 R = $\ ^{4}C_{0} \times \ \ ^{6}C_{4}$

Similarly for the second crossed point from the left, you need 3 Ds 1 R
at the start, then 3 Ds 3Rs = $\ ^{4}C_{1} \times \ \ ^{6}C_{2}$

For the third crossed point = $\ ^{4}C_{2} \times \ \ ^{6}C_{1}$

Fourth crossed point = $\ ^{4}C_{4} \times \ \ ^{6}C_{6}$

Since all the paths must pass through one of the five crossed points, we
add up all the cases and it would equal total number of
paths$\ ^{10}C_{4}$

$$\therefore ¹⁰C₄\  = \ ⁴C₀\  \times \ ⁶C₄\  + \ ⁴C₁\  \times \ ⁶C₃\  + \ ⁴C₂\  \times \ ⁶C₂\  + \ ⁴C₃\  \times \ ⁶C₁\  + \ ⁴C₄\  \times \ ⁶C₀$$

c.  What diagonal would you draw to prove that\
    ¹⁰C₄ = ⁵C₀ × ⁵C₄ + ⁵C₁ × ⁵C₃ + ⁵C₂ × ⁵C₂ + ⁵C₃ × ⁵C₁ + ⁵C₄ × ⁵C₀.

![](media/Permutations and Combinations/media/image27.png){width="1.1444444444444444in"
height="1.554861111111111in"}![](media/Permutations and Combinations/media/image28.png){width="1.1449114173228347in"
height="1.5590277777777777in"}

d.  Using the 6 × 6 grid, then using the same idea as that used in parts
    b and c, prove that ¹²C₆ = (⁶C₀)² + (⁶C₁)² + (⁶C₂)² + (⁶C₃)² +
    (⁶C₄)² + (⁶C₅)² + (⁶C₆)².

![](media/Permutations and Combinations/media/image29.png){width="1.6131944444444444in"
height="1.6006944444444444in"}![](media/Permutations and Combinations/media/image30.png){width="1.5381944444444444in"
height="1.5680555555555555in"}

# Combination Proofs and Identities

+----------------------------------------------------------------------+
| - **Combination Identities**                                         |
+======================================================================+
| $$\ ^{n}C_{n} = \ ^{n}C_{0} = 1$$                                    |
|                                                                      |
| $$\ ^{n}C_{1} = \ ^{n}C_{n - 1} = n$$                                |
|                                                                      |
| $$\ ^{n}C_{r} = \ ^{n}C_{n - r}$$                                    |
|                                                                      |
| $$\ ^{n}C_{r} = \ ^{n - 1}C_{r - 1} + \ ^{n - 1}C_{r}$$              |
|                                                                      |
| $$\ ^{n}C_{0} + \ ^{n}C_{1} + \ ^{n}C_{2}\ldots\ ^{n}C_{n} = 2^{n}$$ |
+----------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------+
| - **Proof** $\ ^{n}C_{r} = \ ^{n}C_{n - r}$ (Symmetry Property)                                 |
+=================================================================================================+
| **Method 1: Algebra**                                                                           |
|                                                                                                 |
|   -----------------------------------------------------------------                             |
|   $LHS\  =$                        $RHS\  =$                                                    |
|   -------------------------------- --------------------------------                             |
|                                                                                                 |
|   -----------------------------------------------------------------                             |
+-------------------------------------------------------------------------------------------------+
| ![A cartoon of a child AI-generated content may be                                              |
| incorrect.](media/Permutations and Combinations/media/image12.png){width="0.5701388888888889in" |
| height="0.7805555555555556in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image13.png){width="0.5166666666666667in" |
| height="0.7604166666666666in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image9.png){width="0.58125in"             |
| height="0.7666666666666667in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image11.png){width="0.5229166666666667in" |
| height="0.7763888888888889in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image10.png){width="0.5840277777777778in" |
| height="0.7645833333333333in"}**Method 2: Combinatorial Argument**                              |
|                                                                                                 |
| Suppose we are choosing 3 people from 5 for a team.\                                            |
| We can do this in two ways:                                                                     |
|                                                                                                 |
| - Choose 3 people from 5 to be in the team: ............                                        |
|                                                                                                 |
| - Choose ... people from 5 to *not* be in the team: ............                                |
|                                                                                                 |
| Therefore, $\ ^{5}C_{3} = \ ^{5}C_{2}$                                                          |
|                                                                                                 |
| Suppose we are choosing $r$ people from $n$ for a team.\                                        |
| We can do this in two ways:                                                                     |
|                                                                                                 |
| - Choose ...... people from ... to be in the team: ............                                 |
|                                                                                                 |
| - Choose ...... people from ... to *not* be in the team: ............                           |
|                                                                                                 |
| Therefore, $\ ^{n}C_{r} = \ ^{n}C_{n - r}$                                                      |
+-------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------+
| - **Proof** $\ ^{n}C_{r} = \ ^{n - 1}C_{r - 1} + \ ^{n - 1}C_{r}$ (Pascal's Identity, or        |
|   Addition Property)                                                                            |
+=================================================================================================+
| Another combinatorial identity is $\ ^{n}C_{r} = \ ^{n - 1}C_{r - 1} + \ ^{n - 1}C_{r}$         |
+-------------------------------------------------------------------------------------------------+
| **Method 1: Algebra**\                                                                          |
| Hint: Make the common denominator $r!(n - r)!$                                                  |
|                                                                                                 |
| $$RHS = \ ^{n - 1}C_{r - 1} + \ ^{n - 1}C_{r}$$                                                 |
+-------------------------------------------------------------------------------------------------+
| ![A cartoon of a child AI-generated content may be                                              |
| incorrect.](media/Permutations and Combinations/media/image12.png){width="0.5701388888888889in" |
| height="0.7805555555555556in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image10.png){width="0.5840277777777778in" |
| height="0.7645833333333333in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image11.png){width="0.5229166666666667in" |
| height="0.7763888888888889in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image13.png){width="0.5166666666666667in" |
| height="0.7604166666666666in"}![A cartoon of a child AI-generated content may be                |
| incorrect.](media/Permutations and Combinations/media/image9.png){width="0.58125in"             |
| height="0.7666666666666667in"}**Method 2: Combinatorial Argument**                              |
|                                                                                                 |
| Suppose we are choosing 3 people from 5 for a team.\                                            |
| In how many ways can you do this? .........                                                     |
|                                                                                                 |
| Let's consider a specific person, let's call her Alice.                                         |
|                                                                                                 |
| - Case 1: Pick Alice to be on the team.\                                                        |
|   You've filled 1 spot, so you need to choose ...... people from the ...... remaining:          |
|   .........                                                                                     |
|                                                                                                 |
| - Case 2: Exclude Alice from the team.                                                          |
|                                                                                                 |
| So, you need to choose ...... people from the ...... remaining: .........                       |
|                                                                                                 |
| These two cases make up all possibilities. Therefore:                                           |
|                                                                                                 |
| $\ ^{5}C_{3} = \ ^{4}C_{2} + \ ^{4}C_{3}$                                                       |
|                                                                                                 |
| Suppose we are choosing $r$ people from $n$ for a team.\                                        |
| In how many ways can you do this? .........                                                     |
|                                                                                                 |
| Let's consider a specific person, let's call them $x$.                                          |
|                                                                                                 |
| - Case 1: Pick $x$ to be on the team.\                                                          |
|   You've filled 1 spot, so you need to choose ...... people from the ...... remaining:          |
|   .........                                                                                     |
|                                                                                                 |
| - Case 2: Exclude $x$ from the team.                                                            |
|                                                                                                 |
| So, you need to choose ...... people from the ...... remaining: .........                       |
|                                                                                                 |
| These two cases make up all possibilities. Therefore:                                           |
|                                                                                                 |
| $\ ^{n}C_{r} = \ ^{n - 1}C_{r - 1} + \ ^{n - 1}C_{r}$                                           |
+-------------------------------------------------------------------------------------------------+
| - **Proof** $\ ^{n}C_{0} + \ ^{n}C_{1} + \ ^{n}C_{2}\ldots\ ^{n}C_{n} = 2^{n}$ (Binomial        |
|   Identity)                                                                                     |
+-------------------------------------------------------------------------------------------------+
| Another combinatorial identity is                                                               |
| $\ ^{n}C_{0} + \ ^{n}C_{1} + \ ^{n}C_{2}\ldots\ ^{n}C_{n} = 2^{n}$                              |
+-------------------------------------------------------------------------------------------------+
| **We cannot prove this using algebra (yet) until we learn proof by induction**                  |
+-------------------------------------------------------------------------------------------------+
| **Combinatorial Argument**                                                                      |
|                                                                                                 |
| Consider the set $S = \left\{ a,b,c \right\}$ with 3 elements.                                  |
|                                                                                                 |
| List all possible subsets of $S$, including the empty set and $S$ itself.                       |
|                                                                                                 |
|   -------------------------------------------------------------------                           |
|   0 element        1 element        2 element        3 element                                  |
|   subsets          subsets          subsets          subsets                                    |
|   ---------------- ---------------- ---------------- ----------------                           |
|                                                                                                 |
|   -------------------------------------------------------------------                           |
|                                                                                                 |
| How many subsets are there of each size? How does this relate to combinations $\ ^{n}C_{r}$?    |
|                                                                                                 |
| How many subsets did you find in total?                                                         |
|                                                                                                 |
| So, we can conclude that $\ ^{3}C_{0} + \ ^{3}C_{1} + \ ^{3}C_{2} + \ ^{3}C_{3} =$ ......       |
|                                                                                                 |
| So, the LHS can be thought of as counting .............................................         |
|                                                                                                 |
| But how is this related to the RHS?                                                             |
|                                                                                                 |
| An alternate method of counting subsets is to decide whether to include each element.           |
|                                                                                                 |
| This is a binary choice of yes or no:                                                           |
|                                                                                                 |
|   -----------------------------                                                                 |
|    Include   Include   Include                                                                  |
|     $a$?      $b$?      $c$?                                                                    |
|   --------- --------- ---------                                                                 |
|                                                                                                 |
|                                                                                                 |
|   -----------------------------                                                                 |
|                                                                                                 |
| By the multiplication principle, the total number of ways is ............                       |
+-------------------------------------------------------------------------------------------------+
| Generalising:                                                                                   |
|                                                                                                 |
| For a set with $n$ elements:                                                                    |
|                                                                                                 |
| How many ways can you choose a subset with exactly $r$ elements? .........                      |
|                                                                                                 |
| What is the total number of subsets of all possible sizes? .................................... |
|                                                                                                 |
| For a set with $n$ elements, each element can either be included in a subset or excluded.\      |
| Using the multiplication principle, how many total subsets are there? ............\             |
| Therefore, we have proved $\ ^{n}C_{0} + \ ^{n}C_{1} + \ ^{n}C_{2}\ldots\ ^{n}C_{n} = 2^{n}$    |
+-------------------------------------------------------------------------------------------------+

Foundation

1.  Solve for $n$.

+------------------------------------------------+---------------------------------------------------+
| a.  $\ ^{10}C_{n} = \ ^{10}C_{3}$              | b.  $\ ^{n}C_{7} = \ ^{n}C_{3}$                   |
|                                                |                                                   |
| $$n = 3\ or\ 7$$                               | $$n = 10$$                                        |
+================================================+===================================================+
| c.  $\ ^{n}C_{6} + \ ^{n}C_{5} = \ ^{11}C_{6}$ | d.  $\ ^{8}C_{n} + \ ^{8}C_{n - 1} = \ ^{9}C_{3}$ |
|                                                |                                                   |
| Using Pascal's identity,                       | Using Pascal's identity                           |
|                                                |                                                   |
| $$n = 10$$                                     | $n = 3$ or 6                                      |
+------------------------------------------------+---------------------------------------------------+

2.  Show that

$$\ ^{2n}P_{n + 1} = 2n \times \ ^{2n - 1}P_{n}$$

$$LHS = \frac{(2n)!}{(2n\  - \ n\  - \ 1)!} = \frac{(2n)!}{(n\  - \ 1)!}$$

$$RHS = \frac{n\  \times \ (2n\  - \ 1)!}{(2n\  - \ 1\  - \ n)!}\  = \frac{2n\  \times \ (2n\  - \ 1)!}{(n\  - \ 1)!} = \frac{(2n)!}{(n - 1)!}$$

$$= LHS$$

3.  Show that

$$\ ^{n}C_{k} = \frac{n - k + 1}{k}\ \ ^{n}C_{k - 1}$$

$$LHS = \frac{n!}{k!(n\  - \ k)!}$$

$$RHS = \left( \frac{n\  - \ k\  + \ 1}{k} \right) \times \frac{n!}{(k\  - \ 1)!(n\  - \ k\  + \ 1)!}$$

$$= \frac{(n\  - \ k\  + \ 1) \times \ n!}{k(k\  - \ 1)!(n\  - \ k\  + \ 1)!}$$

$$= \frac{n!}{k!(n\  - \ k)!}\ $$

We will save the combinatorial argument proofs for the end of the
booklet 😊

# Probability and Mixed Applications

+--------------------------------------------------------------------------------------+
| - **Probability Problems**                                                           |
+======================================================================================+
| $$Probability = \frac{Number\ of\ acceptable\ outcomes}{Total\ possible\ outcomes}$$ |
+--------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------+
| - **Interpret** Permutation and Combination Probability Questions                       |
+=============================================+===========================================+
| For these questions, the answer is provided. Annotate to explain where it comes from.   |
+---------------------------------------------+-------------------------------------------+
| a.  Jenny has 12 pairs of earrings,\        | b.  In a lottery, a machine contains 45   |
|     3 necklaces, 8 rings, and 2 watches.    |     balls, each numbered 1 to 45. 4 balls |
|                                             |     are drawn and players must guess the  |
| If Karla were to guess the combination of   |     correct order to win. Lisa has 3      |
| jewellery, what is the chance she guesses   |     different entries, what is the        |
| correctly?                                  |     probability that she wins?            |
|                                             |                                           |
| $$\frac{1}{12 \times 3 \times 8 \times 2}$$ | $$\frac{3}{45P4}$$                        |
+---------------------------------------------+-------------------------------------------+
| c.  Trinity chooses 13 songs at random from | d.  7 people are seated around a circular |
|     20 songs in her playlist. What is the   |     table. What is the probability that a |
|     probability that her two favourite      |     group of 3 particular people will be  |
|     songs are part of the playlist?         |     sat together?                         |
|                                             |                                           |
| $$\frac{18C11}{20C13}$$                     | $$\frac{3!(5 - 1)!}{(7 - 1)!}$$           |
+---------------------------------------------+-------------------------------------------+
| e.  A coin is tossed 10 times. What is the  | f.  A team of 6 men and 5 women is chosen |
|     probability of getting 5 heads, in any  |     at random from a group of 8 men and 9 |
|     order?                                  |     women. Find the probability that      |
|                                             |     neither Kaya nor Greg are in the      |
| $$\frac{10C5}{2^{10}}$$                     |     team.                                 |
|                                             |                                           |
|                                             | $$\frac{7C6 \times 8C5}{8C6 \times 9C5}$$ |
+---------------------------------------------+-------------------------------------------+

Foundation

1.  A PIN has 4 numbers. If I forget my PIN I am allowed 3 tries to get
    it right.\
    Find the probability that I get it within the 3 tries.

$$\frac{3}{10^{4}} = \frac{3}{10\ 000}$$

2.  A restaurant offers 7 main courses and 4 desserts, as well as 3
    different types of coffee.

    a.  How many different combinations of main course, dessert and
        coffee are possible?

7 × 4 × 3 = 84

b.  Find the probability that I randomly pick the combination most often
    voted as favourite.

$$\frac{1}{84}$$

3.  A password consists of 2 letters followed by 5 numbers.\
    What is the probability that Izak randomly guesses the correct
    password?

$$\frac{1}{26^{2} \times \ 10^{5}} = \frac{1}{67\ 600\ 000}$$

4.  A set of cards is numbered 1 to 100 and 2 cards are chosen at
    random.

    a.  How many different arrangements of ordered pairs are possible?

100 × 99 = 9900

b.  What is the probability that a particular ordered pair is chosen?

$$\frac{1}{9900}$$

5.  Each of 10 cards has a letter written on it from A to J. If 3 cards
    are selected in order at random, find the probability that they
    spell out CAB.

$$\frac{1}{10\  \times \ 9\  \times \ 8} = \frac{1}{720}$$

6.  A bookshelf is to hold 5 mathematics books, 8 novels and 7
    cookbooks.

    a.  In how many different ways could they be arranged?\
        (Leave your answer in factorial notation.)

20!

b.  If the books are grouped in categories, in how many ways can they be
    arranged?\
    (Answer in factorial notation.)

3 units. Arrange units, then arrange within units.

3! × 5! × 8! × 7!

c.  If one book is chosen at random, find the probability that it is a
    cookbook.

$$\frac{7}{20}$$

7.  There are 5 numbers: 3, 4, 5, 5 and 6.

    a.  How many different arrangements can be made from the numbers?

$$\frac{5!}{2!} = \ 60$$

b.  How many arrangements form numbers greater than 40 000?

Consider 3 cases: First digit 4, 5 or 6

First digit 4: 4!/2! = 12

First digit 5: 4! = 24

First digit 6: 4!/2! = 12

Total = 12 + 24 + 12 = 48

c.  How many form numbers less than 50000?

First digit 3 or 4

First digit 3: 4!/2! = 12

First digit 4: 4!/2! = 12

Total = 12 + 24 = 36

d.  If an arrangement is made at random, find the probability that it is
    less than 40000.

Less than 40 000 = Total -- Greater than 40 000\
60 -- 48 = 12

$$\frac{12}{60} = \frac{1}{5}$$

8.  Find the probability that if 10 people sit around a table at random,
    2 particular people will be seated together.

Total: 9!

2 particular people sit together, treat as 1 unit. Arrange 9 units
around a circle and arrange within group: $8! \times 2$

$$\frac{8! \times 2}{9!} = \frac{2}{9}$$

9.  A basketball team of 5 players is selected at random from a group of
    12 PE students.

    a.  In how many ways can the team be selected?

$$¹²C₅\  = \ 792$$

b.  Find the probability that Erik is selected as one of the team
    members.

$$\frac{¹¹C₄}{¹²C₅} = \frac{5}{12}$$

c.  Find the probability that Erik and Jens are both selected.

$$\frac{¹⁰C₃}{¹²C₅} = \frac{5}{33}$$

10. A committee of three is to be selected from the nine members in a
    club.

+---------------------------------+------------------------------------+
| a.  How many different          | b.  If there are five men in the   |
|     committees can be formed?   |     club, what is the probability  |
|                                 |     that the selected committee    |
| $$⁹C₃\  = \ 84$$                |     consists entirely of males?    |
|                                 |                                    |
|                                 | $$\frac{⁵C₃}{⁹C₃} = \frac{5}{42}$$ |
+=================================+====================================+

11. The integers from 1 to 10 inclusive are written on ten separate
    pieces of paper. Four pieces of paper are drawn at random. Find the
    probability that:

    a.  the four numbers drawn are 1, 2, 3 and 6,

$$\frac{1}{¹⁰C₄} = \frac{1}{210}$$

b.  the number 9 is one of the numbers drawn,

$$\frac{⁹C₃}{¹⁰C₄} = \frac{2}{5}$$

c.  the number 8 is not drawn,

$$\frac{⁹C₄}{¹⁰C₄} = \frac{3}{5}$$

d.  the number 7 is drawn but the number 1 is not.

$$\frac{⁸C₃}{¹⁰C₄} = \frac{4}{15}$$

12. A bag contains three red, seven yellow and five blue balls. If three
    balls are drawn from the bag simultaneously, find the probability
    that:

+----------------------------------------------------+-------------------------------------------------------------------+
| a.  all three balls are yellow,                    | b.  all the balls are of the same colour,                         |
|                                                    |                                                                   |
| $$\frac{⁷C₃}{¹⁵C₃} = \frac{1}{13}$$                | $$\frac{³C₃\  + \ ⁷C₃\  + \ ⁵C₃}{¹⁵C₃} = \frac{46}{455}$$         |
+====================================================+===================================================================+
| c.  there are two red balls and one blue ball,     | d.  all the balls are of different colours.                       |
|                                                    |                                                                   |
| $$\frac{³C₂\  \times \ ⁵C₁}{¹⁵C₃} = \frac{3}{91}$$ | $$\frac{³C₁\  \times \ ⁷C₁\  \times \ ⁵C₁}{¹⁵C₃} = \frac{3}{13}$$ |
+----------------------------------------------------+-------------------------------------------------------------------+

13. A sports committee of five members is to be chosen from eight AFL
    footballers and seven soccer players. Find the probability that the
    committee will contain:

+--------------------------------------------------------------+---------------------------------------------+
| a.  only AFL footballers,                                    | b.  only soccer players,                    |
|                                                              |                                             |
| $$\frac{⁸C₅}{¹⁵C₅} = \frac{8}{429}$$                         | $$\frac{⁷C₅}{¹⁵C₅} = \frac{1}{143}$$        |
+==============================================================+=============================================+
| c.  three soccer players and two AFL footballers,            | d.  at least one soccer player,             |
|                                                              |                                             |
| $$\frac{⁷C₃\  \times \ ⁸C₂}{¹⁵C₅} = \frac{140}{429}$$        | $$\ 1\  - \frac{8}{429} = \frac{421}{429}$$ |
+--------------------------------------------------------------+---------------------------------------------+
| e.  at most one soccer player,                               | f.  Ian, a particular soccer player.        |
|                                                              |                                             |
| $$\frac{⁸C₅\  + \ ⁷C₁\  \times \ ⁸C₄}{¹⁵C₅} = \frac{2}{11}$$ | $$\frac{¹⁴C₄}{¹⁵C₅} = \frac{1}{3}$$         |
+--------------------------------------------------------------+---------------------------------------------+

14. From a standard pack of 52 cards, three are selected at random. Find
    the probability that:

+--------------------------------------------------------------------------------------+-------------------------------------------------------------------+
| a.  they are the jack of spades, the two of clubs and the seven of diamonds,         | b.  all three are aces,                                           |
|                                                                                      |                                                                   |
| $$\frac{1}{⁵²C₃} = \frac{1}{22\ 100}$$                                               | $$\frac{⁴C₃}{⁵²C₃} = \frac{1}{5525}$$                             |
+======================================================================================+===================================================================+
| c.  they are all diamonds,                                                           | d.  they are all of the same suit,                                |
|                                                                                      |                                                                   |
| $$\frac{¹³C₃}{⁵²C₃} = \frac{11}{850}$$                                               | $$\frac{4\  \times \ ¹³C₃}{⁵²C₃} = \frac{22}{425}$$               |
+--------------------------------------------------------------------------------------+-------------------------------------------------------------------+
| e.  they are all picture cards,                                                      | f.  two are red and one is black,                                 |
|                                                                                      |                                                                   |
| $$\frac{¹²C₃}{⁵²C₃} = \frac{11}{1105}$$                                              | $$\frac{²⁶C₂\  \times \ ²⁶C₁}{⁵²C₃} = \frac{13}{34}$$             |
+--------------------------------------------------------------------------------------+-------------------------------------------------------------------+
| g.  one is a seven, one is an eight and one is a nine,                               | h.  two are sevens and one is a six,                              |
|                                                                                      |                                                                   |
| $$\frac{\ ^{4}C_{1} \times \ ^{4}C_{1} \times \ ^{4}C_{1}}{⁵²C₃} = \frac{16}{5525}$$ | $$\frac{{⁴C₂ \times \ }^{4}C_{1}}{⁵²C₃} = \frac{6}{5225}$$        |
+--------------------------------------------------------------------------------------+-------------------------------------------------------------------+
| i.  exactly one is a diamond,                                                        | j.  at least two of them are diamonds.                            |
|                                                                                      |                                                                   |
| $$\frac{¹³C₁\  \times \ ³⁹C₂}{⁵²C₃} = \frac{741}{1700}$$                             | $$\frac{¹³C₂\  \times \ ³⁹C₁\  + \ ¹³C₃}{⁵²C₃} = \frac{64}{425}$$ |
+--------------------------------------------------------------------------------------+-------------------------------------------------------------------+

15. Repeat the previous question if the cards are selected from the pack
    one at a time, and each card is replaced before the next one is
    drawn.

+-----------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+
| a.  they are the jack of spades, the two of clubs and the seven of diamonds,            | b.  all three are aces,                                                                                                      |
|                                                                                         |                                                                                                                              |
| $$\left( \frac{1}{52} \right)^{3}$$                                                     | $$\left( \frac{4}{52} \right)^{3}$$                                                                                          |
+=========================================================================================+==============================================================================================================================+
| c.  they are all diamonds,                                                              | d.  they are all of the same suit,                                                                                           |
|                                                                                         |                                                                                                                              |
| $$\left( \frac{13}{52} \right)^{3}$$                                                    | $$4\  \times \ \left( \frac{13}{52} \right)^{3}$$                                                                            |
+-----------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+
| e.  they are all picture cards,                                                         | f.  two are red and one is black,                                                                                            |
|                                                                                         |                                                                                                                              |
| $$\left( \frac{12}{52} \right)^{3}$$                                                    | $$3\  \times \ \left( \frac{26}{52} \right)^{2} \times \ \left( \frac{26}{52} \right)$$                                      |
+-----------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+
| g.  one is a seven, one is an eight and one is a nine,                                  | h.  two are sevens and one is a six,                                                                                         |
|                                                                                         |                                                                                                                              |
| $$3!\  \times \ \left( \frac{4}{52} \right)^{3}$$                                       | $$3\  \times \ \left( \frac{4}{52} \right)^{2} \times \ \left( \frac{4}{52} \right)$$                                        |
+-----------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+
| i.  exactly one is a diamond,                                                           | j.  at least two of them are diamonds.                                                                                       |
|                                                                                         |                                                                                                                              |
| $$3\  \times \ \left( \frac{13}{52} \right) \times \ \left( \frac{39}{52} \right)^{2}$$ | $$3\  \times \ \left( \frac{13}{52} \right)^{2} \times \ \left( \frac{39}{52} \right) + \ \left( \frac{13}{52} \right)^{3}$$ |
+-----------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+

16. Three boys and three girls are to sit in a row. Find the probability
    that:

+-------------------------------------------------------------+-------------------------------------------------------------+----------------------------------------------+
| a.  the boys and girls alternate,                           | b.  the boys sit together and the girls sit together,       | c.  two specific girls sit next to one       |
|                                                             |                                                             |     another.                                 |
| $$\frac{2\  \times \ 3!\  \times \ 3!}{6!} = \frac{1}{10}$$ | $$\frac{2\  \times \ 3!\  \times \ 3!}{6!} = \frac{1}{10}$$ |                                              |
|                                                             |                                                             | $$\frac{2\  \times \ 5!}{6!} = \frac{1}{3}$$ |
+=============================================================+=============================================================+==============================================+

17. On a school trip, there are 5 distinct hotel rooms A, B, C, D, E and
    3 students X, Y, Z.

Find how many ways there are to fill the rooms by:

a.  Using permutations for ordered selection.

Ordered selection of 3 rooms from 5:

$$5P3 = 60$$

b.  Using combinations, then arranging.

Choose 3 hotel rooms from 5 to host students, then arrange the students.

$$5C3 \times 3! = 60$$

18. A parade has 3 music floats and 6 non-music floats.

> How many ways are there of arranging the floats so none of the music
> floats are adjacent to each other?
>
> Follow the steps to solve this problem.
>
> Arrange non-music floats such that there are gaps: ... N ... N ... N
> ... N ... N ... N ...
>
> Ways to arrange 6 non-music floats: ............

6!

> There are ...... gaps. Ways to choose 3 positions for the music
> floats: ............

$$7C3$$

> Ways to arrange the 3 music floats: .........

$$3!$$

> Total: ...............

$$6! \times 3! \times 7C3 = 151\ 200$$

Development

19. A family of five are seated in a row at the cinema. Find the
    probability that:

+------------------------------------------------+-----------------------------------------------+
| a.  the parents sit on the end and the three   | b.  the parents sit next to one another.      |
|     children are in the middle,                |                                               |
|                                                | Treat parents as unit: 4! arrangements        |
| Parents: 2 positions, 2! ways                  |                                               |
|                                                | Parents within unit: 2! arrangements          |
| Children: 3! ways                              |                                               |
|                                                | $$\frac{4!\  \times \ 2!}{5!} = \frac{2}{5}$$ |
| $$\frac{2!\  \times \ 3!}{5!} = \frac{1}{10}$$ |                                               |
+================================================+===============================================+

20. Six people, of whom Patrick and Jessica are two, arrange themselves
    in a row.\
    Find the probability that:

+------------------------------------------------+--------------------------------------------------------------------------+
| a.  Patrick and Jessica occupy the end         | b.  Patrick and Jessica are not next to each other.                      |
|     positions,                                 |                                                                          |
|                                                | P(not next to each other) = 1 - P(together)                              |
| P and J on ends: 2! ways                       |                                                                          |
|                                                | $$P(not\ together) = \ 1\  - \frac{5!\  \times \ 2!}{6!} = \frac{2}{3}$$ |
| Others: 4! ways                                |                                                                          |
|                                                |                                                                          |
| $$\frac{2!\  \times \ 4!}{6!} = \frac{1}{15}$$ |                                                                          |
+================================================+==========================================================================+

21. The letters of PROMISE are arranged randomly in a row. Find the
    probability that:

+---------------------------------------------------------------+-----------------------------------------------+
| a.  the word starts with R and ends with S,                   | b.  the letters P and R are next to one       |
|                                                               |     another,                                  |
| Fix R and S, need to arrange 5 middle letters                 |                                               |
|                                                               | Treat PR as unit: 6! arrangements             |
| $$\frac{5!}{7!} = \frac{1}{42}$$                              |                                               |
|                                                               | PR or RP: 2!                                  |
|                                                               |                                               |
|                                                               | $$\frac{6!\  \times \ 2!}{7!} = \frac{2}{7}$$ |
+===============================================================+===============================================+
| c.  the letters P and R are separated by at least three       | d.  the vowels and the consonants alternate,  |
|     letters,                                                  |                                               |
|                                                               | Only CVCVCVC is possible with 3 vowels        |
| no letters between: 6! 2!                                     |                                               |
|                                                               | $$\frac{4!3!}{7!} = \frac{1}{35}$$            |
| 1 letter between: (5)5! 2!                                    |                                               |
|                                                               |                                               |
| 2 letters between: (5P2) 4! 2!                                |                                               |
|                                                               |                                               |
| $$1 - \frac{6!2! + 5(5!2!) + (5P2)\ 4!2!}{7!} = \frac{2}{7}$$ |                                               |
+---------------------------------------------------------------+-----------------------------------------------+
| e.  the vowels are together.                                                                                  |
|                                                                                                               |
| Vowels OIE together as unit, arrange 5 units 5!\                                                              |
| internal arrangements 3!                                                                                      |
|                                                                                                               |
| $$\frac{5!\  \times \ 3!}{7!} = \frac{1}{7}$$                                                                 |
+---------------------------------------------------------------------------------------------------------------+

22. The digits 3, 3, 4, 4, 4 and 5 are placed in a row to form a
    six-digit number.\
    If one of these numbers is selected at random, find the probability
    that:

+-------------------------------------------------------------------------+---------------------------------------------------------------------+
| a.  it is even,                                                         | b.  it ends in 5,                                                   |
|                                                                         |                                                                     |
| $$Total:\ \frac{6!}{2!\  \times \ 3!} = 60$$                            | $$\frac{\left( \frac{5!}{2!\  \times \ 3!} \right)}{60}\  = \ 1/6$$ |
|                                                                         |                                                                     |
| Even means it must end in 4                                             |                                                                     |
|                                                                         |                                                                     |
| $$\frac{\left( \frac{5!}{2!\  \times \ 2!} \right)}{60} = \frac{1}{2}$$ |                                                                     |
+=========================================================================+=====================================================================+
| c.  the 4s occur together,                                              | d.  the number starts with 5 and then the 4s and 3s alternate,      |
|                                                                         |                                                                     |
| Treat three 4s as unit. 4 units, with repeated 3                        | 5 4 3 4 3 4                                                         |
|                                                                         |                                                                     |
| $$\frac{4!2!}{60} = \frac{1}{5}$$                                       | There is only one way to arrange this.                              |
|                                                                         |                                                                     |
|                                                                         | $$\frac{1}{60}$$                                                    |
+-------------------------------------------------------------------------+---------------------------------------------------------------------+
| e.  the 3s are separated by at least one other number.                                                                                        |
|                                                                                                                                               |
| 1 - P(3s together)                                                                                                                            |
|                                                                                                                                               |
| $$1\  - \frac{\left( \frac{5!}{3!} \right)}{60} = \frac{2}{3}$$                                                                               |
+-----------------------------------------------------------------------------------------------------------------------------------------------+

23. The letters of KETTLE are arranged randomly in a row. Find the
    probability that:

+------------------------------------------------------------+-----------------------------------------------------------------+
| a.  the two letters E are together,                        | b.  the two letters E are not together,                         |
|                                                            |                                                                 |
| $$Total:\frac{6!}{2!\  \times \ 2!} = 180$$                | $$1\  - \frac{1}{3} = \frac{2}{3}$$                             |
|                                                            |                                                                 |
| Treat EE as 1 unit                                         |                                                                 |
|                                                            |                                                                 |
| $$\frac{\left( \frac{5!}{2!} \right)}{180} = \frac{1}{3}$$ |                                                                 |
+============================================================+=================================================================+
| c.  the two letters E are together and the two letters T   | d.  the Es and Ts are together in one group.                    |
|     are together,                                          |                                                                 |
|                                                            | Treat EETT as 1 unit.                                           |
| Treat EE and TT as units                                   |                                                                 |
|                                                            | 3 units. $\frac{4!}{2!2!}$ internal arrangements                |
| $$\frac{4!}{180} = \frac{2}{15}$$                          |                                                                 |
|                                                            | $$\frac{3! \times \frac{4!}{2! \times 2!}}{180} = \frac{1}{5}$$ |
+------------------------------------------------------------+-----------------------------------------------------------------+

24. A tank contains 20 tagged fish and 80 untagged fish. On each day,
    four fish are selected at random, and after noting whether they are
    tagged or untagged, they are returned to the tank. Answer the
    following questions, correct to three significant figures.

+---------------------------------+-------------------------------------------------------------+
| a.  What is the probability of  | b.  What is the probability of selecting at least one       |
|     selecting no tagged fish on |     tagged fish on a given day?                             |
|     a given day?                |                                                             |
|                                 | $$1\  - \ 0.403\  = \ 0.597$$                               |
| $$\frac{⁸⁰C₄}{¹⁰⁰C₄} = 0.403$$  |                                                             |
+=================================+=============================================================+
| c.  Calculate the probability   | d.  What is the probability of selecting no tagged fish on  |
|     of selecting no tagged fish |     exactly three of the seven days during the week?        |
|     on every day for a week.    |                                                             |
|                                 | $$⁷C₃\  \times \ (0.403)³\  \times \ (0.597)⁴\  = \ 0.291$$ |
| $$(0.403)⁷\  = \ 0.00174$$      |                                                             |
+---------------------------------+-------------------------------------------------------------+

25. The letters A, E, I, P, Q and R are arranged in a circle. Find the
    probability that:

+-----------------------------------------+-----------------------------------------------+
| a.  the vowels are together,            | b.  A is opposite R,                          |
|                                         |                                               |
| All arrangements: (6-1)! = 5! = 120     | Fix A, R has 1 possible opposite position.    |
|                                         |                                               |
| Vowels (A,E,I): 3 letters               | Arrange remaining 4: 4! = 24                  |
|                                         |                                               |
| Treat vowels as one unit with           | $$P\  = \frac{24}{120} = \frac{1}{5}$$        |
| consonants (P,Q,R): 4 objects           |                                               |
|                                         |                                               |
| Circular: (4-1)! = 3! = 6               |                                               |
|                                         |                                               |
| Internal vowel arrangements: 3! = 6     |                                               |
|                                         |                                               |
| Total: 6(6) = 36                        |                                               |
|                                         |                                               |
| $$P\  = \frac{36}{120} = \frac{3}{10}$$ |                                               |
+=========================================+===============================================+
| c.  the vowels and consonants           | d.  at least two vowels are next to one       |
|     alternate,                          |     another.                                  |
|                                         |                                               |
| Vowels: A,E,I (3), Consonants: P,Q,R    | Complement: no two vowels adjacent\           |
| (3)                                     | (vowels and consonants alternate)             |
|                                         |                                               |
| Fix one vowel, arrange 2 others in      | $$P\  = \ 1\  - \frac{1}{10} = \frac{9}{10}$$ |
| alternate positions: 2! = 2             |                                               |
|                                         |                                               |
| Arrange 3 consonants: 3! = 6            |                                               |
|                                         |                                               |
| Total: 2(6) = 12                        |                                               |
|                                         |                                               |
| $$P\  = \frac{12}{120} = \frac{1}{10}$$ |                                               |
+-----------------------------------------+-----------------------------------------------+

26. A committee of three women and seven men is to be seated randomly at
    a round table.

+-----------------------------------------------+---------------------------------+
| a.  What is the probability that the three    | b.  The committee elects a      |
|     women will sit together?                  |     president and a             |
|                                               |     vice-president. What is the |
| Treat 3 women as one unit with 7 men: 8       |     probability that they are   |
| objects                                       |     sitting opposite one        |
|                                               |     another?                    |
| Circular: (8-1)! = 7! = 5040                  |                                 |
|                                               | Fix president, vice-president   |
| Internal women arrangements: 3! = 6           | opposite (1 of 9 positions)     |
|                                               |                                 |
| Total: 5040(6) = 30240                        | $$P\  = \frac{1}{9}$$           |
|                                               |                                 |
| All arrangements: (10-1)! = 9! = 362880       |                                 |
|                                               |                                 |
| $$P\  = \frac{30240}{362880} = \frac{1}{12}$$ |                                 |
+===============================================+=================================+

27. There are two round tables, one oak and one mahogany, each with five
    seats. In how many ways may a group of ten people be seated?

Choose 5 for oak table: C(10,5) = 252

Arrange 5 on oak: (5-1)! = 4! = 24

Arrange 5 on mahogany: 4! = 24

Total: 252(24)(24) = 145 152

Mastery

28. A bag contains seven white and five black discs. Three discs are
    chosen from the bag.\
    Find the probability that all three discs are black, if the discs
    are chosen:

+--------------------------------------+--------------------------------------------------------+
| a.  without replacement,             | b.  with replacement,                                  |
|                                      |                                                        |
| $$\frac{⁵C₃}{¹²C₃} = \frac{1}{22}$$  | $$\left( \frac{5}{12} \right)^{3} = \frac{125}{1728}$$ |
+======================================+========================================================+
| c.  so that after each draw the disc is replaced with one of the opposite colour.             |
|                                                                                               |
| A tree diagram may help you visualise this                                                    |
|                                                                                               |
| $$\frac{5}{12} \times \frac{4}{12} \times \frac{3}{12} = \frac{5}{144}$$                      |
+-----------------------------------------------------------------------------------------------+

29. Six people are to be divided into two groups, each with at least one
    person.

+--------------------------------------------+---------------------------------------------------------------------+
| a.  Explain why the total possible ways to | b.  Find the probability that there will be three in each group,    |
|     do this is 31.                         |                                                                     |
|                                            | $$\frac{\left( \frac{\ ^{6}C_{3}}{2} \right)}{31} = \frac{10}{31}$$ |
| Split two groups as (1,5): $\ ^{6}C_{1}$   |                                                                     |
|                                            |                                                                     |
| (2,3): $\ ^{6}C_{2}$                       |                                                                     |
|                                            |                                                                     |
| $$(3,3):\ \frac{\ ^{6}C_{3}}{2}$$          |                                                                     |
|                                            |                                                                     |
| Total: 31                                  |                                                                     |
+============================================+=====================================================================+
| c.  Find the probability that there will   | d.  Find the probability that there will be one group of five and   |
|     be two in one group and four in the    |     an individual.                                                  |
|     other,                                 |                                                                     |
|                                            | $$\frac{\ ^{6}C_{1}}{31} = \frac{6}{31}$$                           |
| $$\frac{\ ^{6}C_{2}}{31} = \frac{15}{31}$$ |                                                                     |
+--------------------------------------------+---------------------------------------------------------------------+

30. A three-digit number is formed from the digits 3, 4, 5, 6 and 7 (no
    repetitions allowed).\
    Find the probability that:

+---------------------------------------------------+--------------------------------------------------------------+
| a.  the number is 473,                            | b.  the number is odd,                                       |
|                                                   |                                                              |
| Total 3-digit numbers = 5P3 = 5 × 4 × 3 = 60      | Odd last digit 3, 5, or 7                                    |
|                                                   |                                                              |
| $$\frac{1}{60}$$                                  | 3 ways for last digit, then 4P2 ways to fill other 2 digits  |
|                                                   |                                                              |
|                                                   | $$\frac{3\  \times \ 4\  \times \ 3}{60} = \frac{3}{5}$$     |
+===================================================+==============================================================+
| c.  the number is divisible by 5,                 | d.  the number is divisible by 3,                            |
|                                                   |                                                              |
| ends in 5, 4P2 ways to fill other 2 digits        | Valid sets: {3,4,5}, {3,6,7}, {4,5,6}, {4,6,7}               |
|                                                   |                                                              |
| $$\frac{4 \times 3}{60} = \frac{1}{5}$$           | Each set has 3! arrangements                                 |
|                                                   |                                                              |
|                                                   | $$\frac{3! \times 4}{60} = \frac{2}{5}$$                     |
+---------------------------------------------------+--------------------------------------------------------------+
| e.  the number starts with 4 and ends with 7,     | f.  the number contains the digit 3,                         |
|                                                   |                                                              |
| 3 choices for middle number                       | subtract cases where there is no 3                           |
|                                                   |                                                              |
| $$\frac{3}{60} = \frac{1}{20}$$                   | $$1 - \frac{4\  \times \ 3\  \times \ 2}{60} = \frac{3}{5}$$ |
+---------------------------------------------------+--------------------------------------------------------------+
| g.  the number contains the digits 3 and 5,       | h.  the number contains the digits 3 or 5,                   |
|                                                   |                                                              |
| Choose 3 positions for digit 3, choose 2          | $$P(3) + P(5) - P(3\ and\ 5)$$                               |
| positions for digit 5, then last digit can be     |                                                              |
| filled with 3 possible digits                     | Using part **f** and **g**                                   |
|                                                   |                                                              |
| $$\frac{3 \times 2 \times 3}{60} = \frac{3}{10}$$ | $$\frac{3}{5} + \frac{3}{5} - \frac{3}{10} = \frac{9}{10}$$  |
+---------------------------------------------------+--------------------------------------------------------------+
| e.  all digits in the number are odd,             | f.  the number is greater than 500.                          |
|                                                   |                                                              |
| can arrange 3, 5, 7 in 3! ways                    | 3 possibilities for first digit, then 4P2 ways to fill other |
|                                                   | two                                                          |
| $$\frac{3!}{60} = \frac{1}{10}$$                  |                                                              |
|                                                   | $$\frac{3 \times 4 \times 3}{60} = \frac{3}{5}$$             |
+---------------------------------------------------+--------------------------------------------------------------+

31. A five-digit number is chosen at random. Find the probability:

+-----------------------------------------------------------------------+---------------------------------------------------------+
| a.  the number contains at least one four                             | b.  the number contains at least one four and at least  |
|                                                                       |     one five                                            |
| Total 5-digit numbers: $9 \times 10^{4} = 90\ 000$                    |                                                         |
|                                                                       | No 4 and no 5: $7 \times 8^{4}$                         |
| Without 4: $8 \times 9^{4}$                                           |                                                         |
|                                                                       | $$1 - \frac{7 \times 8^{4}}{90000} = \frac{856}{5625}$$ |
| $$1 - \frac{8 \times 9^{4}}{90000} = \frac{521}{1250}$$               |                                                         |
+=======================================================================+=========================================================+
| c.  the number contains exactly three sevens                          | d.  the number contains at least three sevens.          |
|                                                                       |                                                         |
| Place 3 sevens in 5 positions: 5C3                                    | Need 3, 4, or 5 sevens                                  |
|                                                                       |                                                         |
| Fill other 2 spots with 9 possible digits: 9²                         | From part **c**, 3 sevens is                            |
|                                                                       | $5C3 \times 9^{2} - 4C3 \times 9$                       |
| But we need to subtract cases where the first digit is 0              |                                                         |
|                                                                       | Similarly, 4 sevens is $5C4 \times 9 - 4C4$             |
| First position is 0                                                   |                                                         |
|                                                                       | Only 1 way to have 5 sevens                             |
| Place 3 sevens in 4 positions 4C3                                     |                                                         |
|                                                                       | $$\therefore\frac{91}{10\ 000}$$                        |
| Fill other position with 9 possible digits: 9                         |                                                         |
|                                                                       |                                                         |
| $$\frac{5C3 \times 9^{2} - 4C3 \times 9}{90\ 000} = \frac{43}{5000}$$ |                                                         |
+-----------------------------------------------------------------------+---------------------------------------------------------+

32. A survey has eight \'Yes/No\'-type questions.\
    How many ways can the survey be answered if there are

+---------------------------------+---------------------------------+
| a.  no restrictions?            | b.  exactly three \'No\'        |
|                                 |     answers?                    |
| $$2^{8} = 256$$                 |                                 |
|                                 | $$⁸C₃ = 56$$                    |
+=================================+=================================+
| c.  at least two \'No\'         | d.  at least six \'Yes\'        |
|     answers?                    |     answers?                    |
|                                 |                                 |
| Total - (0 \'No\') - (1 \'No\') | (6 \'Yes\') + (7 \'Yes\') + (8  |
|                                 | \'Yes\')                        |
| = 2⁸ -- $\ ^{8}C_{0}$ --        |                                 |
| $\ ^{8}C_{1}$                   | = ⁸C₂ + ⁸C₁ + ⁸C₀               |
|                                 |                                 |
| $$247$$                         | $$= 37$$                        |
+---------------------------------+---------------------------------+
| e.  at most two \'No\' answers? | f.  at most six \'Yes\'         |
|                                 |     answers?                    |
| This is the same as 'at least   |                                 |
| six yes': 37                    | This is the same as at least    |
|                                 | two 'no' = 247                  |
+---------------------------------+---------------------------------+

33. How many five-letter codes can be formed from the letters of the
    word COFFEE.

Consider cases: Exclude C, Exclude O, Exclude F, Exclude E

$$\frac{5!}{2!2!} + \frac{5!}{2!2!} + \frac{5!}{2!} + \frac{5!}{2!} = 180$$

34. A poker hand of five cards is dealt from a standard pack of 52.\
    Find the probability of obtaining the following:

+--------------------------------------------------------------------------------------+---------------------------------+
| a.  one pair,                                                                        | b.  two pairs,                  |
|                                                                                      |                                 |
| Total number of ways: ⁵²C₅                                                           | Choose 2 ranks for the pairs    |
|                                                                                      | 13C2,\                          |
| Choose the rank for the pair 13C1,\                                                  | choose 2 cards from each rank:  |
| choose 2 cards from that rank 4C2,\                                                  | (4C2)²,\                        |
| choose 3 different ranks from remaining 12 ranks 12C3,\                              | choose 1 rank from remaining 11 |
| choose one card from each of those ranks: 4³.                                        | for the fifth card 11C1,\       |
|                                                                                      | choose 1 card from that rank:   |
| $$\frac{¹³C₁\  \times \ ⁴C₂\  \times \ ¹²C₃\  \times \ 4³}{⁵²C₅} = \frac{352}{833}$$ | 4C1.                            |
|                                                                                      |                                 |
|                                                                                      | $$\frac{198}{4165}$$            |
+======================================================================================+=================================+
| c.  three of a kind,                                                                 | d.  four of a kind,             |
|                                                                                      |                                 |
| Choose the rank for the triple 13C1,\                                                | Choose the rank for the four    |
| choose 3 cards from that rank 4C3,\                                                  | 13C1,\                          |
| choose 2 different ranks from remaining 12C2,\                                       | choose 4 cards from that rank   |
| choose one card from each: 4².                                                       | 4C4,\                           |
|                                                                                      | choose another card from 48     |
| $$\frac{88}{4165}$$                                                                  | remaining 48C1.                 |
|                                                                                      |                                 |
|                                                                                      | $$\frac{1}{4165}$$              |
+--------------------------------------------------------------------------------------+---------------------------------+
| e.  a full house\                                                                    | f.  a straight (five cards in   |
|     (one pair and three of a kind),                                                  |     sequence regardless of      |
|                                                                                      |     suit, ace high or low),     |
| Choose rank for the triple 13C1,\                                                    |                                 |
| choose 3 cards from that rank 4C3,\                                                  | There are 10 possible sequences |
| choose rank for the pair from remaining 12 ranks 12C1,\                              | (A-2-3-4-5 through 10-J-Q-K-A). |
| choose 2 cards from that rank 4C2.                                                   | For each sequence, choose a     |
|                                                                                      | suit for each card: 4⁵ = 1024.  |
| $$\frac{6}{4165}$$                                                                   |                                 |
|                                                                                      | $$\frac{128}{32487}$$           |
+--------------------------------------------------------------------------------------+---------------------------------+
| g.  a flush (five cards of the same suit),                                           | h.  a royal flush (ten, jack,   |
|                                                                                      |     queen, king and ace in a    |
| Choose a suit 4C1,\                                                                  |     single suit).               |
| choose 5 cards from that suit 13C5.                                                  |                                 |
|                                                                                      | There are only 4 royal flushes, |
| $$\frac{33}{16660}$$                                                                 | one for each suit.              |
|                                                                                      |                                 |
|                                                                                      | Alternatively, using            |
|                                                                                      | combinations: choose a suit     |
|                                                                                      | 4C1,                            |
|                                                                                      |                                 |
|                                                                                      | there is only one way to select |
|                                                                                      | 5 cards from those 5 ranks 5C5  |
|                                                                                      |                                 |
|                                                                                      | $$\frac{1}{649\ 740}$$          |
+--------------------------------------------------------------------------------------+---------------------------------+

# Exam Questions

1.  **2020 HSC Extension 1 Band 4**

Out of 10 contestants, six are to be selected for the final round of a
competition. Four of those six will be placed 1st, 2nd, 3rd and 4th.

![](media/Permutations and Combinations/media/image31.png){width="0.7506769466316711in"
height="1.5826771653543308in"}In how many ways can this process be
carried out?

C

$$10C6 \times 6P4 = \frac{10!}{6!4!} \times \frac{6!}{2!} = \frac{10!}{4!2!}$$

2.  **HSC Sample Question Extension 1 Band 4**

Four girls and four boys are to be seated around a circular table. In
how many ways can the eight children be seated if:

a.  there are no restrictions?

b.  the two tallest boys must not be seated next to each other?

c.  the two youngest children sit together?

a\) (8--1)! = 7!

b\) Fix tallest boy in a seat: 1

2^nd^ tallest: 5 possible non-adjacent seats.

Arrangements of 6 other children: 6!

$$5 \times 6!$$

**Alternatively,**

Total -- cases where they sit together

Consider two tallest as 1 unit, arrange 7 units around a circle and
arrange internally

$7! - (7 - 1)! \times 2!$

c\) Fix youngest in a seat: 1

2^nd^ youngest: 2 possible adjacent seats

Arrangements of 6 other children: 6!

$$2 \times 6!$$

Alternatively, consider two youngest as a group

$(7 - 1)! \times 2!$

3.  **2021 HSC Extension 1 Band 4**

> A committee containing 5 men and 3 women is to be formed from a group
> of 10 men and 8 women.
>
> In how many different ways can the committee be formed?

$$10C5 \times 8C3 = 14\ 112$$

4.  **HSC Sample Question Extension 1 Band 4**

> A table tennis club consists of 6 males and 5 females.
>
> How many committees of 4 players can be chosen that contain no more
> than 2 females?

Consider cases: 0 females, 1 female 2 females

6C4 + (5C1)(6C3) + (5C2)(6C2) = 265

5.  **2019 HSC Extension 1 Band 5**

> In how many ways can all the letters of the word PARALLEL be placed in
> a line with 3 Ls together?
>
> ![](media/Permutations and Combinations/media/image32.png){width="0.9178116797900262in"
> height="1.81081583552056in"}

A

1Treat 3Ls as a single unit, 6 units total, with 2 repeated As

$$\frac{6!}{2!}$$

6.  ![](media/Permutations and Combinations/media/image33.png){width="3.2941174540682416in"
    height="1.4139140419947507in"}**2022 HSC Extension 1 Band 5**

How many smaller triangles can be formed using these shown points as
vertices?

Can't take 3 points from a single side. Consider cases below:

Take 1 point from each side

$$3 \times 4 \times 5 = 60$$

Take 2 points from one side, and 1 point from the others.

Consider 2 points from AB, 2 points from AC, 2 points from BC

$$3C2 \times 9C1 + 4C2 \times 8C1 + 5C2 \times 7C1 = 145$$

Total = 60 + 145 = 205

Alternatively: Do Total $-$ 3 from one side

$12C3 - 3C3 - 4C3 - 5C3 = 205$

7.  **HSC Sample Question Extension 1 Band 5**

    a.  In how many ways can the numbers 9, 8, 7, 6, 5, 4 be arranged in
        a circle?

$$(6 - 1)! = 5! = 120$$

b.  How many of these arrangements have at least 2 odd numbers together?

Total -- no odd together

Consider the pattern OEOEOE

First arrange 3 odd numbers in a circle $(3 - 1)! = 2!$

Arrange 3 odd numbers in the 3 gaps 3!

$2! \times 3! = 12$ ways

$120 - 6 = 108$

8.  **HSC Sample Question Extension 1 Band 5**

> ![](media/Permutations and Combinations/media/image34.png){width="1.941175634295713in"
> height="2.037234251968504in"}Eight points are arranged in order around
> a circle.

a.  How many triangles can be drawn using these points as vertices?

8C3 = 56

b.  How many pairs of triangles can be drawn, where the vertices of each
    triangle are distinct?

Choose 3 from 8, then another 3 from 5 remaining

Divide by 2 as the triangle pairs are indistinguishable

$$\frac{8C3 \times 5C3}{2} = 280$$

9.  **HSC Sample Question Extension 1 Band 5**

    a.  In how many ways can the letters of COOKBOOK be arranged in a
        line?

$$\frac{8!}{4!2!} = 840$$

b.  What is the probability that a random arrangement has four O's
    together?

Treat 4 O's as 1 unit. 5 units, account for duplicate Ks

$$\frac{5!}{2!} = 60$$

$$\frac{60}{840} = \frac{1}{14}$$

10. **HSC Sample Question Extension 1 Band 5**

![](media/Permutations and Combinations/media/image35.png){width="1.64918416447944in"
height="1.316175634295713in"}How many rectangles, including squares, can
be found in the 4 x 5 grid below?

Squares/rectangles are made from 2 horizontal and 2 vertical sides

Choose 2 horizontal from 5, 2 vertical from 6

$$5C2 \times 6C2 = 150$$

# Challenge Exercise

1.  Eight students are trying out for a relay race team with four
    positions: first leg, second leg, third leg, anchor. Two of the
    students, Marcus and Sophie, cannot both be on the team.\
    How many ways are there of selecting the team?

    a.  Solve this by considering the cases:\
        Case 1: Marcus on team, Sophie not;\
        Case 2: Sophie on team, Marcus not;\
        Case 3: neither on team.

+---------------------+---------------------+---------------------+
| Case 1:             | Case 2:             | Case 3: Neither on  |
|                     |                     | team                |
| Position for        | Position for        |                     |
| Marcus: 4 choices   | Sophie: 4 choices   | Fill 4 positions    |
|                     |                     | from 6 others:      |
| Fill 3 remaining    | Fill 3 remaining    | $⁶P₄$ = 360         |
| positions from 6    | positions from 6    |                     |
| others: ⁶P₃         | others: ⁶P₃         |                     |
|                     |                     |                     |
| Total: 4 × $⁶P₃$ =  | Total: 4 × $⁶P₃$ =  |                     |
| 480                 | 480                 |                     |
+=====================+=====================+=====================+

Total: 480 + 480 + 360 = 1320

b.  Solve this by finding the total, then subtracting the cases where
    they are both on the team:

    i.  Using combinations.

Unacceptable ways: Fix Marcus and Sophie in the team, choose two others
$6C2$, then find arrangements 4!

$$8P4 - 6C2 \times 4! = 1320$$

ii. Without using combinations.

Unacceptable ways: choose 1 of 4 spots for Marcus, choose 1 of 3 spots
for Sophie, then fill 2 remaining spots from 6 others

$$8P4 - (4 \times 3 \times 6P2) = 1320$$

2.  How many 4-digit numbers can be formed using the digits 1, 2, 3, 4,
    5, 6 (without repetition) such that the number is odd and greater
    than 4000?

> Jimmy says: "I will find how many are greater than 4000, then divide
> by 2."\
> Explain why he is incorrect and find the correct answer.

Among numbers \> 4000, there is not an equal number of odd and even
numbers.

Consider when the first digit is 4, the last digit can be 1, 3, 5 (3 odd
possibilities)

When the first digit is 5, last digit can be 1, 3 (2 odd possibilities)

When the first digit is 6, last digit can be 4, 5, 6 (3 odd
possibilities)

First digit 4: 3 × ⁴P₂ = 36

First digit 5: 2 × ⁴P₂ = 24

First digit 6: 3 × ⁴P₂ = 36

Total = 96

3.  There are five backpackers and four available rooms in a hotel. How
    many ways can the backpackers be accommodated in the four rooms if
    each room can hold at most four people?

Each backpacker chooses any of 4 rooms

Subtract invalid cases (all 5 in one room)

Ways = 4⁵ - 4

4.  Find how many arrangements there are of the letters of the word
    GUMTREE if:

+---------------------------------+------------------------------------+
| a.  there are no restrictions   | b.  the Es are together            |
|                                 |                                    |
| $$\frac{7!}{2!} = \ 2520$$      | $$6!\  = \ 720\ $$                 |
+=================================+====================================+
| c.  the Es are separated by 1   | d.  the Es are separated by 2      |
|     letter                      |     letters                        |
|                                 |                                    |
| Treat (E_E) as 1 unit, 5 units  | Treat (E\_ \_E) as 1 unit, 4 units |
| total                           | total                              |
|                                 |                                    |
| 5 choices for the gap           | 5P2 choices for the gaps           |
|                                 |                                    |
| $$5 \times 5! = 600$$           | $$4! \times 5P2 = 480$$            |
+---------------------------------+------------------------------------+
| e.  the Es are separated by 3   | f.  the Es are separated by 4      |
|     letters                     |     letters                        |
|                                 |                                    |
| Treat (E\_ \_ \_E) as 1 unit, 3 | Treat (E\_ \_ \_ \_E) as 1 unit, 2 |
| units total                     | units total                        |
|                                 |                                    |
| 5P3 choices for the gaps        | 5P4 choices for the gaps           |
|                                 |                                    |
| $$3! \times 5P3 = 360$$         | $$2! \times 5P4 = 240$$            |
+---------------------------------+------------------------------------+
| g.  the Es are separated by 5   | h.  the G is somewhere between the |
|     letters                     |     two Es                         |
|                                 |                                    |
| This is the same as fixing Es   | Consider part c: Fix G as one in   |
| at the beginning and end.       | the gap 5! = 120                   |
|                                 |                                    |
| 5! ways to fill the middle      | Consider part d: 2 places for G,   |
| letters = 120                   | then 4 other letters to fill other |
|                                 | spot                               |
|                                 |                                    |
|                                 | $4! \times 2 \times 4 = 192$       |
|                                 |                                    |
|                                 | Consider part e: 3 places for G,   |
|                                 | then 4P2 to fill other spots       |
|                                 |                                    |
|                                 | $$3! \times 3 \times 4P2 = 216$$   |
|                                 |                                    |
|                                 | Consider part f: 4 places for G,   |
|                                 | then 4P3 to fill other spots       |
|                                 |                                    |
|                                 | $$2! \times 4 \times 4P3 = 192$$   |
|                                 |                                    |
|                                 | Consider part g, G will always be  |
|                                 | in the middle if E is at the ends  |
|                                 |                                    |
|                                 | 120                                |
|                                 |                                    |
|                                 | 120 + 192 + 216 + 192 +120 = 840   |
|                                 |                                    |
|                                 | **Alternatively**, consider only   |
|                                 | the letters {E, E, G}              |
|                                 |                                    |
|                                 | All arrangements patterns are:     |
|                                 |                                    |
|                                 | \*E\*E\*G\*                        |
|                                 |                                    |
|                                 | \*E\*G\*E\*                        |
|                                 |                                    |
|                                 | \*G\*E\*E\*                        |
|                                 |                                    |
|                                 | So G is in between one third of    |
|                                 | the time (stars represent other    |
|                                 | letters)                           |
|                                 |                                    |
|                                 | $\frac{2520}{3}$ $= 840$           |
|                                 |                                    |
|                                 | **Alternatively**, consider that   |
|                                 | the pattern must be \*G\*E\*E\*    |
|                                 |                                    |
|                                 | Choose 3 positions from 7 for GEE  |
|                                 | (in that order): 7C3               |
|                                 |                                    |
|                                 | Then arrange the 4 other letters   |
|                                 | 4!                                 |
|                                 |                                    |
|                                 | $$7C3 \times 4! = 840$$            |
+---------------------------------+------------------------------------+
| i.  the M is somewhere to the   | j.  the G is somewhere to the left |
|     left of both Es and the U   |     of the U and the M is          |
|     is somewhere between them   |     somewhere to the right of the  |
|                                 |     U                              |
| all 12 possible relative        |                                    |
| orderings of {M, U, E, E}:      | Consider relative orderings of {G, |
|                                 | U, M}                              |
| **MEUE,** MEEU, MUEE, EMUE,     |                                    |
| EMEU, EUME,\                    | **GUM**, GMU, UMG, UGM, MGU, MUG   |
| EEMU, EEUM, UEME, UEEM, UMEE,   |                                    |
| UEEM                            | Condition is satisfied             |
|                                 | $\frac{1}{6}$ of the time.         |
| The condition will be satisfied |                                    |
| $\frac{1}{12}$ of the time.     | $$\frac{2520}{6} = 2420$$          |
|                                 |                                    |
| $$\frac{2520}{12} = 210$$       | **Alternatively**, consider that   |
|                                 | the pattern must be GUM            |
| **Alternatively**, consider     |                                    |
| that the pattern must be MEUE   | Choose 3 positions from 7 for GUM  |
|                                 | in that order: 7C4                 |
| Choose 4 positions from 7 for   |                                    |
| MEUE in that order: 7C4         | Then arrange 4 other letters,      |
|                                 | where there are 2 Es:              |
| Then arrange 3 other letters:   | $\frac{4!}{2!}$                    |
| 3!                              |                                    |
|                                 | $$7C4 \times \frac{4!}{2!} = 420$$ |
| $$7C4 \times 3! = 210$$         |                                    |
+---------------------------------+------------------------------------+

5.  If the letters of the word GUMTREE and the letters of the word KOALA
    are combined and arranged into a single twelve-letter word, in how
    many of these arrangements do the letters of KOALA appear in their
    correct order, but not necessarily together?

Choose 5 positions for {K, O, A, L, A} in that order 12C5

Then fill other 7 positions, remembering to account for 2Es

$$12C5 \times \frac{7!}{2!} = 19\ 995\ 840$$

6.  Consider the digits 1, 2, 3, 4 and 5.

    a.  How many four-digit passwords can be formed if there is no
        repetition?

5 × 4 × 3 × 2 = 5P4

b.  How many five-digit passwords can be formed, if there is no
    repetition?

5 × 4 × 3 × 2 × 1 = 5P5

c.  Explain why the answers from **a** and **b** are the same, even
    though there are differing numbers of digits.

Using the identity $\ ^{n}P_{n} = \ ^{n}P_{n - 1} = n!$

Combinatorial argument: for every answer in **b**, simply delete the
last digit and you have a valid answer for **a**

7.  a.  Assuming a 365-day year, find the probability that in a group of
        three people there will be at least one birthday in common.
        Answer correct to two significant figures.

Total number of ways: $365^{3}$

At least 1 in common: 1 - P(all different)

$$1 - \frac{365 \times 364 \times 363}{365^{3}} = 0.0082$$

b.  If there are $n$ people in the group, find an expression for the
    probability of at least one common birthday.

$$1 - \frac{\ ^{365}P_{n}}{365^{n}}$$

c.  Using Desmos plot a graph of the probability of at least one common
    birthday\
    $P = \left\{ your\ expression\ from\ above \right\}$ against number
    of people, $x$.\
    To plot permutations in Desmos: nPr(a,b).\
    Zoom in to the graph so that $0 \leq x \leq 60$ and
    $0 \leq P \leq 1$

https://www.desmos.com/calculator/v7ul5mtndg

d.  How many people need to be in the group before the probability
    exceeds 0.5?

23

e.  How many people need to be in the group before the probability
    exceeds 90%?

41

4.  A room contains $n\  + \ 1$ people named P₁, P₂, P₃, \..., Pₙ₊₁,
    arranged in a line in that order. Person P₁ shakes hands with
    everybody else in the line and then leaves the room, having shaken
    everybody\'s hand. Afterwards, P₂ shakes hands with the remaining
    people in the room and similarly leaves. This is repeated until
    eventually, everybody has shaken hands with everybody else exactly
    once.

    a.  How many hands did $P_{1}$ shake before leaving?

$n$ hands

b.  When it was their turn, how many people did $P_{2}$ shake hands
    with?

$n - 1$ people

c.  How many hands did $P_{n}$ and $P_{n + 1}$ shake?

$1$ and 0

d.  Explain why there were $\ ^{n + 1}C_{2}$ handshakes in total.

Each person shakes with every other person exactly once.

Number of ways to choose 2 people from n + 1 people = $\ ^{n + 1}C_{2}$

e.  Hence prove

> $$1 + 2 + 3 + 4 + 5\ldots + n = \frac{n}{2}(n + 1)$$

LHS represents total number of handshakes

Total number of handshakes is also $\ ^{n + 1}C_{2}$

$$\ ^{n + 1}C_{2} = \frac{(n + 1)!}{2!(n - 1)!} = \frac{(n + 1)(n)(n - 1)!}{2!(n + 1)!} = \frac{n(n + 1)}{2}$$

Therefore, LHS and RHS are ways to count total number of handshakes in
this scenario, and so are equal.

5.  A group of $k$ people is to be selected from a total of $n + 1$
    people, then placed on $k$ seats in a line.

    a.  How many ways can this be done?

$$\ ^{n + 1}P_{k}$$

b.  Suppose Jimmy is one of the $n + 1$ people. How many ordered
    selections are possible if he is excluded?

$$\ ^{n}P_{k}$$

c.  How many ordered selections are possible if Jimmy is included?\
    Do this by fixing Jimmy first in the row, arranging the rest,\
    then multiplying by how many positions Jimmy can be in.

$$\ ^{n}P_{k - 1} \times k$$

d.  Hence deduce that
    $\ ^{n + 1}P_{k} = \ ^{n}P_{k} + k\left( \ ^{n}P_{k - 1} \right)$

The total number of ordered selections from n+1 people (part a) can be
split into two cases:\
one where Jimmy isn't in the group and the other where Jimmy is.

6.  a.  Consider a sequence of four A\'s and six B\'s arranged
        randomly.\
        Using factorials, write down the number of ways of arranging the
        letters in the sequence.

$$\frac{10!}{4!6!}$$

b.  Express this as a binomial expression in the form $\ ^{n}C_{k}$.

$$\ ^{10}C_{4} = \ ^{10}C_{6}$$

c.  Now consider a sequence of three A\'s and four B\'s arranged
    randomly.\
    Write down the number of possible arrangements, in terms of
    $\ ^{n}C_{k}$.

$$\frac{7!}{3!4!} = \ ^{7}C_{3} = \ ^{7}C_{4}$$

d.  Explain why **a** and **c**, which are clearly permutation
    questions, can be answered using an expression normally used for
    combinations only.

Consider part **a**

Think of arranging four A\'s and six B\'s as making 10 independent
binary decisions:\
For position 1: choose A or B?, For position 2: choose A or B? ... For
position 10: choose A or B?

The constraint is that we must choose exactly 4 As and 6 Bs

We are essentially asking: out of 10 positions, how can I place 4 As?
(the remaining positions must get Bs)

$$\therefore\ ^{10}C_{4}$$

e.  A coin is flipped twenty times. How many ways can there be exactly
    twelve tails?

This is the same as arranging As and Bs, this time the binary choice is
between Hs and Ts

$$\ ^{10}C_{12}$$

7.  Prove that

$$\left( 1 \cdot \ ^{n}C_{1} \right) + \left( 2 \cdot \ ^{n}C_{2} \right) + \left( 3 \cdot \ ^{n}C_{3} \right) + \left( 4 \cdot \ ^{n}C_{4} \right) + \ldots + \left( n \cdot \ ^{n}C_{n} \right) = n \cdot 2^{n - 1}$$

By considering the scenario:\
from $n$ people, choose a non-empty committee and choose a leader for
the committee.

RHS:\
Choose any person from $n$ to be leader: $n$ ways

Each of the remaining $n - 1$ people can either be on the committee or
not: $2^{n - 1}$ ways

Total: $n\  \cdot \ 2^{n - 1}$

LHS:\
For a committee of 1 person: choose 1 person from $n$, then choose 1
person out of 1 to be a leader: $1 \cdot \ ^{n}C_{1}$

For a committee of 2 people: choose 2 people from $n$, then choose 1
person out of 2 to be a leader: $2 \cdot \ ^{n}C_{2}$

For a committee of 3 people: choose 3 people from $n$, then choose 1
person out of 3 to be a leader: $3 \cdot \ ^{n}C_{3}$

Continue until a committee of $n$ people ...

For a committee of $n$ people: choose $n$ people from $n$, then choose 1
person out of $n$ to be a leader: $n \cdot \ ^{n}C_{n}$

Total:
$\left( 1 \cdot \ ^{n}C_{1} \right) + \left( 2 \cdot \ ^{n}C_{2} \right) + \left( 3 \cdot \ ^{n}C_{3} \right) + \left( 4 \cdot \ ^{n}C_{4} \right) + \ldots + \left( n \cdot \ ^{n}C_{n} \right)$

Therefore, proved.

8.  A drop of water is placed at the top of the grid. The drop must run
    downwards along edges of the grid. How many different ways can it
    reach the ground?

![](media/Permutations and Combinations/media/image36.png){width="3.1288484251968502in"
height="1.7933070866141732in"}

The water droplet must make a sequence of 10 moves to get to the ground.

Each move can either be left or right.

$$2^{10}$$

9.  Suppose there are 6 identical lollies and 3 students, A B C. The
    lollies are to be distributed amongst the students. Not all students
    need to be given lollies. The stars and bars below show a way to
    distribute the lollies such that A gets 2, B gets 1, C gets 3.

![](media/Permutations and Combinations/media/image37.png){width="2.0555555555555554in"
height="0.4888888888888889in"}

a.  How many ways are there of distributing the lollies amongst the 3
    students?

This is equivalent to arranging 6 stars and 2 bars

$$\frac{8!}{6!2!} = 28$$

Alternatively, choose 2 places out of 8 positions to put the two bars.
$8C2 = 28$

b.  Hence prove that there are $\ ^{(n + r - 1)}C_{n}$ many ways to
    distribute $n$ items amongst $r$ people.

Distribute $n$ items amongst $r$ people.

This means $n$ stars, $r - 1$ bars.

Ways to choose where to put $r - 1$ bars out of $n + r - 1$ positions:

$$\ ^{(n + r - 1)}C_{(r - 1)}$$

$$= \ ^{(n + r - 1)}C_{n}\ by\ symmetric\ property$$
