  ----------------------

  ----------------------

Student Name

  -------------------------------------------------------------------
  Mathematics Stage 5 Core
  -------------------------------------------------------------------
  **Probability A**

  -------------------------------------------------------------------

+--------+-----------------------------------+-------------------------+
| **Book | Solve problems for multistage\    | Version: 250816         |
| 2**    | chance experiments                |                         |
|        |                                   | Report mistakes &       |
|        |                                   | suggest improvements:\  |
|        |                                   | https://MrDingMaths.com |
+========+===================================+=========================+

+-----------------------------------------------------------------------------------------------+
| # Contents {#contents .TOC-Heading}                                                           |
|                                                                                               |
| [Overview [2](#overview)](#overview)                                                          |
|                                                                                               |
| [List Outcomes using Tables [3](#list-outcomes-using-tables)](#list-outcomes-using-tables)    |
|                                                                                               |
| [List Outcomes using Tree Diagrams                                                            |
| [9](#list-outcomes-using-tree-diagrams)](#list-outcomes-using-tree-diagrams)                  |
|                                                                                               |
| [Complementary Events in Multistage Probability [15](#_Toc179224926)](#_Toc179224926)         |
|                                                                                               |
| [Probability Trees with Independent Events                                                    |
| [16](#probability-trees-with-independent-events)](#probability-trees-with-independent-events) |
|                                                                                               |
| [Probability Trees with Dependent Events                                                      |
| [24](#probability-trees-with-dependent-events)](#probability-trees-with-dependent-events)     |
|                                                                                               |
| [The Multiplication Rule [30](#the-multiplication-rule)](#the-multiplication-rule)            |
|                                                                                               |
| [Check your Understanding [36](#check-your-understanding)](#check-your-understanding)         |
+===============================================================================================+

# Overview

## Syllabus Content

**MA5-PRO-C-01** solves problems involving probabilities in multistage
chance experiments and simulations

**Solve problems for multistage chance experiments**

- Record all possible outcomes for multistage chance experiments

- Determine the probabilities of outcomes for multistage independent
  events using $P(A\ and\ B) = P(A) \times P(B),$ where necessary

- Determine the probabilities of outcomes for multistage dependent
  events

- Associate complementary events with probabilities in multistage chance
  experiments

# List Outcomes using Tables

+------------------------------------+
| **Fundamental Counting Principle** |
|                                    |
| **For Independent Events**         |
+====================================+
| If there are $\mathbf{p}$ ways to  |
| do one thing, and $\mathbf{q}$     |
| ways to do another thing, then     |
| there are $\mathbf{p \times q}$    |
| ways to do both things.            |
+------------------------------------+

- Use the **fundamental counting principle** to check you've found all
  the possible outcomes.

- A two-way table helps find all possible outcomes in a two-step
  experiment.

### **Example** Record all possible outcomes for a two-step experiment.

+-----------------------------------------------------------------------------+
| Tim has three pairs of trousers (blue, brown and grey) and two shirts (one  |
| long-sleeved and one short - sleeved) in his wardrobe.\                     |
| Find all the possible combinations of trousers and shirts he can wear by    |
| using a table.                                                              |
|                                                                             |
| +-----------+-------+-----------------------------------+                   |
| |           |       | Trousers                          |                   |
| |           |       +-----------+-----------+-----------+                   |
| |           |       | Blue      | Brown     | Grey      |                   |
| +==========:+:=====:+:=========:+:=========:+:=========:+                   |
| | Shirts    | Long  | (L, Bl)   | (L, Br)   | (L, Gr)   |                   |
| |           +-------+-----------+-----------+-----------+                   |
| |           | Short | (S, Bl)   | (S, Br)   | (S, Gr)   |                   |
| +-----------+-------+-----------+-----------+-----------+                   |
|                                                                             |
| How many outcomes are there?                                                |
| ........................................................................... |
|                                                                             |
| Does this match the fundamental counting principle?                         |
| ...................................................                         |
|                                                                             |
| The probability of randomly picking a short-sleeved shirt and grey trousers |
| is: .....................                                                   |
+=============================================================================+

A two-step experiment involves flipping a coin then rolling a die.\
Fill in the table.

![A picture containing line, screenshot, number, plot Description
automatically
generated](media/Probability A 2_Solve problems for multistage chance experiments/media/image1.png){width="3.4833333333333334in"
height="0.9583333333333334in"} What is the total number of outcomes?

12

What is $P(tail)$?

0.5

What is $P(head,\ 4)$?

$$\frac{1}{12}$$

What is $P(head\ and\ odd\ number)$?

$$\frac{1}{4}$$

### **Example** Record all possible outcomes for a two-step experiment

+--------------------------------------------------------------------------------------------------------------------------+
| ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image2.png){width="2.834329615048119in" |
| height="2.138077427821522in"}Two letters are taken from the word TREE without replacement.                               |
|                                                                                                                          |
| List the outcomes in a table.                                                                                            |
|                                                                                                                          |
| Why does the table have X in some cells?                                                                                 |
|                                                                                                                          |
| *.................. ..................... means it is not possible*                                                      |
|                                                                                                                          |
| *to get an outcome with two of the same letter.*                                                                         |
|                                                                                                                          |
| Find the probability that both letters chosen are E.                                                                     |
|                                                                                                                          |
| ........................................................................                                                 |
+==========================================================================================================================+

> Fill in these tables to show all the outcomes then count the number of
> outcomes.

+-------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image3.png){width="2.1875in" | b.  Rolling a die and flipping a coin.                                                                                                |
|     height="1.3875in"}Picking cards numbered 1, 2, 3 out of a bag with replacement.                               |                                                                                                                                       |
|                                                                                                                   | ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image3.png){width="3.495138888888889in"              |
| Total outcomes: .........                                                                                         | height="1.1218744531933509in"}                                                                                                        |
|                                                                                                                   |                                                                                                                                       |
| 9                                                                                                                 | Total outcomes: .........                                                                                                             |
|                                                                                                                   |                                                                                                                                       |
|                                                                                                                   | 12                                                                                                                                    |
+===================================================================================================================+=======================================================================================================================================+
| c.  Picking cards numbered A, B, C out of a bag without replacement.                                              | d.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image3.png){width="2.375in"                      |
|                                                                                                                   |     height="1.40625in"}![](media/Probability A 2_Solve problems for multistage chance experiments/media/image3.png){width="2.21875in" |
| Total outcomes: .........                                                                                         |     height="1.3875in"}Picking marbles out of a bag with 1 black and 2 white marbles without replacement.                              |
|                                                                                                                   |                                                                                                                                       |
| 6                                                                                                                 | Total outcomes: .........                                                                                                             |
|                                                                                                                   |                                                                                                                                       |
|                                                                                                                   | 6                                                                                                                                     |
+-------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------+

**Key ideas**

+-------------------------------------------------------------------+
| 1.  To list all possible outcomes of a two-step experiment, we    |
|     can draw up a .........-......... table.                      |
+===================================================================+

Foundation

1.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image4.png){width="4.00625in"
    height="1.1020833333333333in"}Complete these tables.

+-------------------------------------------------------------------------------------------------------------------------------+----------------------------------------+
| a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image4.png){width="2.0548611111111112in" | b.                                     |
|     height="1.1020833333333333in"}                                                                                            |                                        |
|                                                                                                                               | B, 2                                   |
| T, T                                                                                                                          |                                        |
+===============================================================================================================================+========================================+

a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image4.png){width="5.3012817147856515in"
    height="1.1020833333333333in"}

2, 3

2.  This is a two-way table for rolling two dice and adding the results.

    a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image5.png){width="2.4520833333333334in"
        height="2.3333333333333335in"}How many possibilities are there
        in total?

> $$6 \times 6 = 36$$

b.  How many of these add up to 8?

> 5

c.  What it the probability of scoring an 8?

> $$\frac{5}{36}$$

d.  What is the most likely result?

> Getting a sum of 7

e.  What is the probability of this result?

> $$\frac{6}{36} = \frac{1}{6}$$

1.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image6.png){width="3.5395833333333333in"
    height="1.523611111111111in"}Complete this two-way table for rolling
    these two spinners and then adding their results.\
    What is the probability of scoring

    a.  6?

$$\frac{2}{12} = \frac{1}{6}$$

b.  7?

$$\frac{1}{12}$$

c.  6 or 7?

$$\frac{1}{6} + \frac{1}{12} = \frac{1}{4}$$

2.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image7.png){width="6.447326115485565in"
    height="1.4319444444444445in"}These two tables list the outcomes for
    the selection of two letters from the word MAT.

    a.  Which table shows selection where replacement is allowed (with
        replacement)?

Table A

b.  Which table shows selection where replacement is not allowed
    (without replacement)?

Table B

c.  What is the probability of choosing the outcome (T, M) from:

    i.  Table A

$$\frac{1}{9}$$

ii. Table B

$$\frac{1}{6}$$

3.  Two four-sided dice (numbered 1, 2, 3, 4) are rolled.

    a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image8.png){width="2.6368055555555556in"
        height="1.4979166666666666in"}Complete the table to list the
        outcomes.

    b.  Find the probability of obtaining (2, 3).

    c.  Find P(double). A double is an outcome with\
        two of the same number.

4.  A six-sided die is rolled twice.

    a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image9.png){width="3.14035542432196in"
        height="1.8698972003499563in"}How many possible outcomes are
        there?

36

b.  What is the probability of rolling a double?

$$\frac{1}{6}$$

c.  What is the probability of not rolling a double?

$$\frac{5}{6}$$

d.  What is the probability of rolling a 2 and a 3, in any order?

$$\frac{1}{18}$$

e.  What is the probability of rolling two odd numbers?

$$\frac{1}{4}$$

f.  What is the probability of rolling a sum of 5?

$$\frac{1}{4}$$

Development

5.  A coin is tossed and a six-sided die is rolled. List all the
    outcomes using a table.

Find the probability of:

a.  a head and a 6

$$\frac{1}{12}$$

b.  A tail and a 3

$$\frac{1}{12}$$

c.  A head and an even number

$$\frac{1}{4}$$

d.  A tail and a number less than 3

$$\frac{1}{6}$$

6.  Jill guesses the answers to two multiple-choice questions with
    options A, B, C, D or E. Fill in the table.

The answers were A for the first question and D for the second.\
What is the probability that Jill will get:

a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image10.png){width="3.5034722222222223in"
    height="1.7277777777777779in"}Both answers correct

$$\frac{1}{25}$$

b.  Only one answer correct

$$\frac{8}{25}$$

7.  Two fair dice are rolled. The numbers of the dice are added
    together.

    a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image11.png){width="3.196527777777778in"
        height="2.243351924759405in"}What is the probability of rolling
        a score of 8?

$$\frac{5}{36}$$

b.  What is the probability of rolling a score greater than or equal to
    10?

$$\frac{1}{6}$$

c.  Which is more likely, rolling a score of 7 or rolling a score less
    than 4?

$$P(7) = \frac{6}{36},\ P( < 4) = \frac{3}{36}$$

Rolling 7 is more likely

8.  **2023 HSC standard 2 Band 3**

![A dice and a target Description automatically
generated](media/Probability A 2_Solve problems for multistage chance experiments/media/image12.png){width="2.9789588801399827in"
height="1.1388888888888888in"} A game involves throwing a die and
spinning a spinner.

The sum of the two numbers obtained is the score.

The table of scores below is partially completed.

What is the probability of getting a score 7 or more?

![A white grid with black numbers and text Description automatically
generated](media/Probability A 2_Solve problems for multistage chance experiments/media/image13.png){width="2.6597222222222223in"
height="1.9184219160104987in"}

$$\frac{10}{24} = \frac{5}{12}$$

9.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image14.png){width="2.411111111111111in"
    height="1.2055555555555555in"}**2011 HSC Standard 2 Band 4**

The two spinners shown are used in a game.

> ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image15.png){width="2.9569444444444444in"
> height="1.4361111111111111in"}Each arrow is spun once. The score is
> the total of the two numbers shown by the arrows.\
> A table is drawn to show all scores that can be obtained.

a.  What is the value of X in the table?

5

b.  What is the probability of obtaining a score less than 4?

$$\frac{6}{12} = \frac{1}{2}$$

c.  On Spinner *B*, a 2 is obtained. What is the probability of
    obtaining a score of 3?

$$\frac{2}{3}$$

# List Outcomes using Tree Diagrams

## Multi-Stage Experiments

- A **multi-stage experiment** consists of two or more steps.

- The steps can be independent or dependent events.

## Tree Diagrams

- Two-way tables are unsuitable for multi-stage experiments.

<!-- -->

- **Tree diagrams** are more useful for multi-stage experiments.

- It shows each event as a branch of a tree.

- All possible outcomes are listed at the tree's end.

### **Investigation** Tossing a coin three times.

+---------------------------------------------------------------------+
| Construct a tree diagram for tossing a fair coin three times.       |
|                                                                     |
| +---------------+---------------+---------------+-----------------+ |
| | 1^st^ Toss    | 2^nd^ Toss    | 3^rd^ toss    | Outcomes        | |
| +===============+===============+===============+=================+ |
| |               |               |               | ............... | |
| |               |               |               |                 | |
| |               |               |               | ............... | |
| |               |               |               |                 | |
| |               |               |               | ............... | |
| |               |               |               |                 | |
| |               |               |               | ............... | |
| |               |               |               |                 | |
| |               |               |               | ............... | |
| |               |               |               |                 | |
| |               |               |               | ............... | |
| |               |               |               |                 | |
| |               |               |               | ............... | |
| |               |               |               |                 | |
| |               |               |               | ............... | |
| +---------------+---------------+---------------+-----------------+ |
|                                                                     |
| There are .................. possible outcomes, which agrees with   |
| the fundamental counting principle, which says there are ......     |
| $\times$ ...... $\times$ ...... $=$ ......... outcomes.             |
|                                                                     |
| The probability of tossing two heads and one tail, **in that        |
| order**, is: ........................                               |
|                                                                     |
| The probability of tossing two heads and one tail, **in             |
| [any]{.underline} order**, is: ........................             |
+=====================================================================+

a.  Complete this tree diagram to find all the possible ways you can
    answer two questions on a True or False test.

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image16.png){width="3.9868055555555557in"
height="1.6208333333333333in"}

b.  A bag contains 3 red discs and 1 green disc. A coin is tossed and a
    disc is chosen at random from the bag. Complete the tree diagram and
    answer the following questions.

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image17.png){width="1.9277777777777778in"
height="2.05in"} Find the probability of getting tails and a red disc.

$$\frac{3}{8}$$

Find the probability of getting heads and a green disc.

$$\frac{1}{8}$$

c.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image18.png){width="1.020138888888889in"
    height="4.379166666666666in"}A bag contains 2 blue, 3 red and 2
    white counters. A coin is tossed and a counter is chosen at random
    from the bag. Complete the tree diagram and answer the following
    questions.

Find the probability of getting tails and a red counter.

$$\frac{3}{14}$$

Find the probability of getting tails and a blue counter.

$$\frac{1}{7}$$

**Key ideas**

+-------------------------------------------------------------------+
| 1.  A ..................... is not a good way to represent a      |
|     multi-stage experiment, because it can be too large or        |
|     complex to show all the possible outcomes                     |
|                                                                   |
| 2.  A .................. diagram is a better way to represent a   |
|     multi-stage experiment, it shows each possible event as a     |
|     ............... of a tree                                     |
+===================================================================+

**Check your understanding**

+-----------------------------------------------------------------------------------------------------------------------------+
| 1.  The tree diagram below shows the different outcomes when Sophie plays a game of football and a game of rugby.           |
|                                                                                                                             |
| > Which path(s) show the probability of her winning both games?                                                             |
| >                                                                                                                           |
| > ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image19.png){width="2.625767716535433in" |
| > height="1.2037160979877515in"}                                                                                            |
|                                                                                                                             |
|   -----------------------------------------------------------------------------------                                       |
|   **a**   Path 1       **b**   Path 3       **c**   Paths 1 and  **d**   Paths 1, 2,                                        |
|                                                     3                    3                                                  |
|   ------- ------------ ------- ------------ ------- ------------ ------- ------------                                       |
|                                                                                                                             |
|   -----------------------------------------------------------------------------------                                       |
+=============================================================================================================================+
| 2.  The tree diagram below shows the different outcomes when Sophie plays a game of football and a game of rugby.           |
|                                                                                                                             |
| > Which path(s) show the probability of her winning at least one game?                                                      |
| >                                                                                                                           |
| > ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image19.png){width="2.625767716535433in" |
| > height="1.2037160979877515in"}                                                                                            |
|                                                                                                                             |
|   -----------------------------------------------------------------------------------                                       |
|   **a**   Path 1       **b**   Path 3       **c**   Paths 1 and  **d**   Paths 1, 2,                                        |
|                                                     3                    3                                                  |
|   ------- ------------ ------- ------------ ------- ------------ ------- ------------                                       |
|                                                                                                                             |
|   -----------------------------------------------------------------------------------                                       |
+-----------------------------------------------------------------------------------------------------------------------------+
| 3.  The tree diagram below shows the different outcomes when Sophie plays a game of football and a game of rugby.           |
|                                                                                                                             |
| > Which path(s) show the probability of her winning exactly one game?                                                       |
| >                                                                                                                           |
| > ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image19.png){width="2.625767716535433in" |
| > height="1.2037160979877515in"}                                                                                            |
|                                                                                                                             |
|   -----------------------------------------------------------------------------------                                       |
|   **a**   Paths 2 and  **b**   Path 3       **c**   Paths 1 and  **d**   Paths 1, 2,                                        |
|           3                                         3                    3                                                  |
|   ------- ------------ ------- ------------ ------- ------------ ------- ------------                                       |
|                                                                                                                             |
|   -----------------------------------------------------------------------------------                                       |
+-----------------------------------------------------------------------------------------------------------------------------+
| 4.  The tree diagram below shows the different outcomes when picking two counters out of a bag of red and black counters.   |
|                                                                                                                             |
| > Which path(s) show the probability picking two counters of the same colour?                                               |
| >                                                                                                                           |
| > ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image20.png){width="2.371748687664042in" |
| > height="1.2037160979877515in"}                                                                                            |
|                                                                                                                             |
|   -----------------------------------------------------------------------------------                                       |
|   **a**   Path 1       **b**   Paths 1 and  **c**   Paths 1 and  **d**   Paths 2 and                                        |
|                                4                    3                    3                                                  |
|   ------- ------------ ------- ------------ ------- ------------ ------- ------------                                       |
|                                                                                                                             |
|   -----------------------------------------------------------------------------------                                       |
+-----------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image21.png){width="2.9659722222222222in"
    height="1.723150699912511in"}Two coins are tossed and the results
    recorded.

    a.  List all outcomes by completing the diagram.

    b.  Find the probability of the following results:

        i.  Two tails

$$\frac{1}{4}$$

ii. Head then a tail

$$\frac{1}{4}$$

iii. One head and one tail

$$\frac{1}{2}$$

iv. Explain why the answer to parts **ii** and **iii** are different.

ii\) specifies an order and iii) does not

2.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image22.png){width="3.6194444444444445in"
    height="2.5145833333333334in"}There are three questions in a True or
    False test.

    a.  Fill in the partially drawn tree diagram and list the outcomes
        to the right of the branches.

    b.  How many outcomes are there?

8

c.  Find the probability of the following random selections:

    i.  All of the selections are false.

$$\frac{1}{8}$$

ii. Two true selections and one false selection.

$$\frac{3}{8}$$

iii. At least one of the selections is false.

$$\frac{7}{8}$$

3.  Explain why this is incorrect:\
    "When two coins are tossed together, there are three events: two
    heads, two tails and one of each. Hence the probability of getting
    one of each is $\frac{1}{3}$"

There are two ways to get one of each: HT and TH, so it is
$\frac{2}{4} = \frac{1}{2}$

4.  Complete each tree diagram for the experiments *without
    replacement*.

+---------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+
| a.  Selecting two letters from the word TWO                                                                               | b.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image23.png){width="2.63992782152231in" |
|                                                                                                                           |     height="2.394767060367454in"}Selecting two people from a group of three ( A, B and C).                                   |
| ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image23.png){width="2.636111111111111in" |                                                                                                                              |
| height="2.3847222222222224in"}                                                                                            | AB, AC, BA, BC, CA, CB                                                                                                       |
|                                                                                                                           |                                                                                                                              |
| TW, TO, WT, WO, OT, OW                                                                                                    |                                                                                                                              |
+===========================================================================================================================+==============================================================================================================================+

5.  A drawer contains 2 red socks (R), 1 blue sock (B) and 1 yellow sock
    (Y).\
    Two socks are selected at random without replacement. Complete the
    tree diagram.

    a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image24.png){width="3.154861111111111in"
        height="2.740972222222222in"}Find the probability of obtaining:

        i.  a red sock then a blue sock.

$$\frac{2}{12} = \frac{1}{6}$$

ii. a red sock and a blue sock, in any order.

$$\frac{4}{12} = \frac{1}{3}$$

iii. two red socks

$$\frac{2}{12} = \frac{1}{6}$$

iv. any pair of socks of the same colour

$$\frac{1}{6}$$

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image25.png){width="2.182341426071741in"
height="3.2428827646544183in"}

6.  A bag contains 3 black discs and 1 green disc.\
    Two discs are selected at random from the bag.\
    The first disc is not replaced before the second disc is selected.

    a.  Complete the tree diagram.

    b.  Calculate the probability that the discs are different colours.

$$\frac{1}{2}$$

Development

7.  A bag contains one red, one blue and one white marble.\
    One marble is chosen at random from the bag, and then **replaced**
    into the bag.\
    A second marble is chosen.

    a.  Draw a tree diagram of the situation.

    b.  List the outcomes to the right of the branches.

    c.  Find the probability that:

+-----------------+-----------------+-----------------+-----------------+
| i.  both        | ii. both        | iii. both       | iv. the first   |
|     marbles are |     marbles are |      marbles    |     marble is   |
|     red         |     the same    |      are        |     red         |
|                 |     colour      |      different  |                 |
| $$\frac{1}{9}$$ |                 |      colours    | $$\frac{1}{3}$$ |
|                 | $$\frac{1}{3}$$ |                 |                 |
|                 |                 | $$\frac{2}{3}$$ |                 |
+=================+=================+=================+=================+
| v.  there is    | vi. exactly one | vii. at least   | viii. no        |
|     one blue    |     marble is   |      one marble |       marbles   |
|     and one     |     red         |      is red     |       are blue  |
|     white       |                 |                 |                 |
|     marble      | $$\frac{4}{9}$$ | $$\frac{5}{9}$$ | $$\frac{4}{9}$$ |
|                 |                 |                 |                 |
| $$\frac{2}{9}$$ |                 |                 |                 |
+-----------------+-----------------+-----------------+-----------------+

8.  A bag contains one red, one blue and one white marble.\
    One marble is chosen at random from the bag, and **NOT**
    **replaced** into the bag.\
    A second marble is chosen.

    a.  Draw a tree diagram of the situation.

    b.  List the outcomes to the right of the branches.

    c.  Find the probability that:

+-------------------------------+-------------------------------+-------------------------------+-------------------------------+
| i.  []{#_Toc179224926         | ii. both marbles are the same | iii. both marbles are         | iv. the first marble is red   |
|     .anchor}both marbles are  |     colour                    |      different colours        |                               |
|     red                       |                               |                               | $$\frac{1}{3}$$               |
|                               | $$0$$                         | $$1$$                         |                               |
| $$0$$                         |                               |                               |                               |
+===============================+===============================+===============================+===============================+
| v.  there is one blue and one | vi. exactly one marble is red | vii. at least one marble is   | viii. no marbles are blue     |
|     white marble              |                               |      red                      |                               |
|                               | $$\frac{4}{6} = \frac{2}{3}$$ |                               | $$\frac{2}{6} = \frac{1}{3}$$ |
| $$\frac{2}{6} = \frac{1}{3}$$ |                               | $$\frac{4}{6} = \frac{2}{3}$$ |                               |
+-------------------------------+-------------------------------+-------------------------------+-------------------------------+

9.  **2022 HSC Standard 2 Band 4**

The numbers 1, 2, 3, 4, 5 and 6 are each written on separate cards.

> Amy has cards 1, 3 and 5 and Bob has cards 2, 4 and 6.
>
> They play a game in which each person randomly chooses one of their
> own cards and compares it with the other person\'s card. The person
> with the higher card wins.

a.  ![A group of triangles with points and lines Description
    automatically
    generated](media/Probability A 2_Solve problems for multistage chance experiments/media/image26.png){width="2.2743055555555554in"
    height="2.9256944444444444in"}Complete the tree diagram and find the
    probability that Bob wins.

$$\frac{6}{9} = \frac{2}{3}$$

b.  Suppose Amy and Bob play this game 30 times.\
    How many times would Bob be expected to win?

$$30 \times \frac{2}{3} = 20$$

10. A three-letter word is chosen in the following way:\
    The first and last letters are chosen from the three vowels 'A', 'O'
    and 'U', with no repetition,\
    and the middle letter is chosen from 'L' and 'M'.

> Fill in the tree diagram,

![A diagram of a letter Description automatically generated with medium
confidence](media/Probability A 2_Solve problems for multistage chance experiments/media/image27.png){width="3.4107633420822396in"
height="3.0729166666666665in"}

a.  Find $P(alphabetical\ order)$

$$\frac{1}{2}$$

b.  Find $P(no\ 'O")$

$$\frac{1}{3}$$

# Complementary Events in Multistage Probability

## At Least One

- The complement of \"**at least one**\" is \"**none**\"

### **Example** Identify the complement of "at least one".

+---------------------------------+---------------------------------+
| A coin is flipped four times.   | You roll a fair six-sided die   |
|                                 | three times.                    |
| What is the complementary event |                                 |
| to\                             | What is the complementary event |
| "at least one head"?            | to \"at least one roll is a     |
|                                 | 6\"?                            |
+=================================+=================================+
| A bag contains 5 red marbles, 3 | You flip a fair coin five       |
| blue marbles, and 2 green       | times.                          |
| marbles.                        |                                 |
|                                 | What is the complementary event |
| Three marbles are drawn.        | to \"at least one flip results  |
|                                 | in tails\"?                     |
| What is the complementary event |                                 |
| to \"at least one marble drawn  |                                 |
| is red\"?                       |                                 |
+---------------------------------+---------------------------------+
| A standard deck of 52 playing   | In a class of 30 students, 15   |
| cards is shuffled and six cards | are male and 15 are female. If  |
| are drawn.                      | three students are randomly     |
|                                 | selected, what is the           |
| What is the complementary event | complementary event to \"at     |
| to \"at least one card drawn is | least one student selected is   |
| a spade\"?                      | male\"?                         |
+---------------------------------+---------------------------------+

  -----------------------------------
    **Probability of at Least One**
  -----------------------------------
   $$P(At\ least\ 1) = 1 - P(none)$$

  -----------------------------------

1.  3 coins are flipped. The probability of no tails is $\frac{1}{8}$.

What is the probability of at least one tail?
..............................

> ![A diagram of a diagram Description automatically
> generated](media/Probability A 2_Solve problems for multistage chance experiments/media/image28.png){width="2.2786734470691163in"
> height="1.9444444444444444in"}Check that this is true by using the
> tree diagram.

2.  2 coins are flipped.

    a.  What is the probability of no heads? ..................

    b.  What is the probability of at least one head? ..................

# Probability Trees with Independent Events

- A **probability tree** is a tree diagram with probabilities on its
  branches.

- We use probability trees when each event has a different probability,
  or when there are too many outcomes to list.

- Calculate an event's probability by **multiplying** the probabilities
  along the branches.

### **Investigation** Tree diagram with probability.

+---------------------------------------------------------------------------------------------------------------+
| A bag contains 10 purple and 3 green marbles, and a second bag contains 3 purple and 3 green marbles.         |
|                                                                                                               |
| A marble is picked out of each bag.                                                                           |
|                                                                                                               |
|   -----------------------------------------------------------------                                           |
|   **Bag 1**                        **Bag 2**                                                                  |
|   -------------------------------- --------------------------------                                           |
|                                                                                                               |
|   -----------------------------------------------------------------                                           |
|                                                                                                               |
| ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image29.png){width="2.475in" |
| height="1.5194444444444444in"}                                                                                |
|                                                                                                               |
| a.  Why is the tree diagram **NOT** sufficient to represent this scenario?                                    |
|                                                                                                               |
| > *This tree diagram suggests that the chance of getting* $P$ *and* $G$ *are ..................,\             |
| > which is not true.*                                                                                         |
|                                                                                                               |
| b.  Label the tree diagram with the probability of choosing the marble at each stage.                         |
|                                                                                                               |
| c.  Calculate the probability of selecting one green and one purple marble, in that order.                    |
|                                                                                                               |
| $P(GP) =$                                                                                                     |
+===============================================================================================================+

## Probability Trees with Independent Events

1.  Draw a tree diagram with each single-stage event as a branch of the
    tree.

2.  Label the branches with the probability of each single-stage event.

3.  Calculate probability of each multi-stage event by multiplying the
    probabilities along branches.

4.  If the question asks for more the probability of than one event,
    either:

    a.  Add the probabilities of the events.

    b.  Use $1 - P(E')$ if the question asks for "at least one."

### **Example** Calculate probabilities using probability trees.

+----------------------------------------------------------------------------------------------------------------------------------------------------------+
| A bag contains 7 red and 5 blue marbles.\                                                                                                                |
| A second bag has 4 red and 3 blue.                                                                                                                       |
|                                                                                                                                                          |
| a.  What is the probability of drawing a red marble and a blue marble, in any order?                                                                     |
|                                                                                                                                                          |
| b.  What is the probability of drawing at least one red marble?                                                                                          |
|                                                                                                                                                          |
| ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image30.png){width="2.641768372703412in"                                |
| height="1.8544214785651794in"}![](media/Probability A 2_Solve problems for multistage chance experiments/media/image31.png){width="2.6424956255468066in" |
| height="1.7524048556430447in"}1. Draw a tree diagram 2. Label branches                                                                                   |
|                                                                                                                                                          |
| ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image32.png){width="3.4220778652668415in"                               |
| height="1.9044346019247593in"}3. Calculate probabilities                                                                                                 |
|                                                                                                                                                          |
| 4\. Answer questions                                                                                                                                     |
|                                                                                                                                                          |
| 4\. Answer questions                                                                                                                                     |
|                                                                                                                                                          |
| a\. $P(RB) + P(RB) =$ $\frac{21}{84}$ $+$ $\frac{20}{84}$ $=$ $\frac{41}{84}$                                                                            |
|                                                                                                                                                          |
| b\. $1 - P(BB) = 1 -$ $\frac{15}{84}$ $=$ $\frac{69}{84}$                                                                                                |
+==========================================================================================================================================================+

a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image33.png){width="3.3020833333333335in"
    height="2.0590277777777777in"}![](media/Probability A 2_Solve problems for multistage chance experiments/media/image34.png){width="2.5729166666666665in"
    height="1.1805555555555556in"}A bag contains five purple and four
    green marbles, and a second bag contains three purple and five green
    marbles. A marble is selected at random from each bag,

What is the probability of selecting:

two purple marbles? $P(PP) =$

$$\frac{15}{72} = \frac{5}{24}$$

two green marbles? $P(GG) =$

$$\frac{20}{72} = \frac{5}{18}$$

a purple marble then a green marble? $P(PG) =$

$$\frac{25}{72}$$

a green marble then a purple marble? $P(GP) =$

$$\frac{12}{72} = \frac{1}{6}$$

a green marble and a purple marble, in any order? $P(PG) + P(GP) =$

$$\frac{37}{72}$$

at least one green marble? $1 - P(PP) =$

$$\frac{57}{72} = \frac{19}{24}$$

b.  A bag contains two red and one blue marble, and another bag contains
    two red, one blue and one green marble. One marble is drawn from
    each bag.

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image35.png){width="3.3523272090988625in"
height="2.2688495188101485in"}What is the probability of drawing:\
two red marbles?

$$\frac{1}{3}$$

a blue marble, then a red marble?

$$\frac{1}{6}$$

a red marble, then a blue marble?

$$\frac{1}{6}$$

One green marble, in any order?

$$\frac{1}{4}$$

**Key ideas**

+-------------------------------------------------------------------+
| 1.  We write the probabilities of each event on the               |
|     ..................... of the tree.                            |
|                                                                   |
| 2.  A probability tree allows us to find the probability of an    |
|     outcome by ........................ the probabilities along   |
|     the branches that lead to it                                  |
+===================================================================+

Foundation

1.  A bag contains two red and one blue marble, and another bag contains
    two red, one blue and one green marble. One marble is drawn from
    each bag.

> ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image36.png){width="3.1381944444444443in"
> height="2.625in"}![](media/Probability A 2_Solve problems for multistage chance experiments/media/image37.png){width="2.7993055555555557in"
> height="2.1215277777777777in"}The left diagram shows a tree diagram
> without probabilities.\
> The right diagram shows a probability tree. Both trees represent the
> scenario.

Compare the two trees and state the advantages of using a probability
tree.

There are less branches to draw

2.  A jar contains 7 red discs and 3 blue discs.\
    Another jar contains 4 red discs and 5 blue discs.\
    A disc is chosen from each jar.

    a.  Complete the probability tree diagram.

    b.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image38.png){width="2.578472222222222in"
        height="1.7368055555555555in"}![](media/Probability A 2_Solve problems for multistage chance experiments/media/image39.png){width="2.5206211723534557in"
        height="0.902985564304462in"}Complete to calculate the
        probability that the discs\
        chosen are the same colours.

$$\frac{28}{90}$$

$$\frac{15}{90}$$

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image39.png){width="1.4104483814523185in"
height="0.51875in"}

$$\frac{43}{90}$$

3.  ![A diagram of a rugby game Description automatically
    generated](media/Probability A 2_Solve problems for multistage chance experiments/media/image40.png){width="3.7045931758530184in"
    height="1.9402985564304462in"}The probability of Jakub winning a
    hockey match is $\frac{1}{3}$\
    The probability of Jakub winning a rugby match is $\frac{2}{5}$\
    Complete the probability tree diagram.

Find the probability that Jakub:

a.  wins exactly one game.

$$\frac{7}{15}$$

b.  does not win either game.

$$\frac{6}{15}$$

4.  Two light bulbs are selected at random from a large batch of bulbs
    in which 5% are defective.

    a.  ![A diagram of a diagram Description automatically
        generated](media/Probability A 2_Solve problems for multistage chance experiments/media/image41.png){width="2.089583333333333in"
        height="1.9341983814523185in"}By multiplying along the branches
        of the tree, find as a percentage to 2 d.p.

        i.  $P(both\ work)\$

90.25%

ii. $P(first\ works,\ second\ defective)$

4.75%

iii. $P(first\ defective,\ second\ works)$

4.75%

iv. $P(both\ defective)$

0.25%

b.  Hence find the probability that at least one bulb works.

99.75%

5.  One bag has three red and two blue balls. Another bag has two red
    and three blue balls.\
    A ball is drawn at random from each bag.

    a.  ![A diagram of a mathematical problem Description automatically
        generated](media/Probability A 2_Solve problems for multistage chance experiments/media/image42.png){width="2.089583333333333in"
        height="1.9341983814523185in"}By multiplying along the branches,
        find:

        i.  $P(RR)$

$$\frac{6}{25}$$

ii. $P(RB)$

$$\frac{9}{25}$$

iii. $P(BR)$

$$\frac{4}{25}$$

iv. $P(BB)$

$$\frac{6}{25}$$

b.  By adding, find the probability that:

    i.  The balls are the same colour.

$$\frac{12}{25}$$

ii. The balls are different colours.

$$\frac{13}{25}$$

6.  A bag contains 3 white and 4 red balls. Another bag contains 2 white
    and 3 red balls.\
    A ball is chosen from each bag.\
    Find the probability of getting:

    a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image43.png){width="2.5881944444444445in"
        height="1.6729166666666666in"}2 white balls

$$\frac{6}{35}$$

b.  2 red balls

$$\frac{12}{35}$$

c.  a white and a red ball, in that order

$$\frac{9}{35}$$

d.  a white and a red ball, in any order

$$\frac{17}{35}$$

e.  at least 1 red ball.

$$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \frac{29}{35}$$

7.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image44.png){width="2.5729166666666665in"
    height="1.4864238845144357in"}A bag contains three red and four blue
    marbles, and a second bag contains 5 red and 4 blue.\
    A marble is selected from each bag.

    a.  Complete the probability tree diagram.

    b.  What is the probability of getting two blue marbles?

$$\frac{16}{63}$$

8.  When a child is born, the probability of a boy is 0.51 and the
    probability of a girl is 0.49.\
    Draw a probability tree diagram for a family's two children.

    a.  Calculate the probability, as a decimal:

        i.  Two boys

0.2601

ii. A boy then a girl, in that order.

0.2499

iii. A girl and a boy, in any order.

0.4998

iv. At least one girl.

0.7399

9.  There is an 80% chance that Garry will pass his driving test and a
    90% chance that Emma will pass hers. Draw a probability tree
    diagram, and find the probability as a decimal:

    a.  Garry passes and Emma fails.

0.08

b.  Garry fails and Emma passes.

0.18

c.  only one of Garry and Emma passes.

0.26

d.  at least one fails.

0.28

Development

10. A student enters the 100 m and 400 m events at the school swimming
    carnival.\
    Her chance of winning the 100 m event is 0.8 and her chance of
    winning the 400 m event is 0.6. Draw a probability tree showing the
    possible results for each event and the combined results.

    a.  Calculate the probability that she will (answer as a decimal):

        i.  win both events.

0.48

ii. not win either event.

0.08

iii. win the 100 m but not win the 400 m.

0.32

iv. win at least one event.

0.92

11. A council is running two raffles. The probability of winning in each
    raffle is 1 in 100.\
    Jared buys one ticket for each raffle. Answer these questions
    without drawing a tree diagram.

    a.  What is the probability that he wins both?

$$\frac{1}{100} \times \frac{1}{100} = \frac{1}{10000}$$

b.  What is the probability he wins at least one?

$$1 - \left( \frac{99}{100} \times \frac{99}{100} \right) = \frac{199}{10000}$$

12. A magician deals cards from two different decks for a trick.\
    The probability of dealing a red card from deck 1 is 0.3.\
    The probability of a red card from deck 2 is three times the
    probability of a red from deck 1.

    a.  What is the probability of picking two reds?

$$0.27$$

b.  What is the probability of picking a red from deck 1\
    and a black from deck 2?

$$0.03$$

c.  What is the probability of picking a black from deck 1\
    and a red from deck 2?

$$0.63$$

d.  What is the probability of picking no reds?

$$0.07$$

Mastery

13. **2016 HSC Standard 2 Band 5**

A cricket team is about to play two matches. The probability of the team
having a win, a loss or a draw is 0.7, 0.1 and 0.2 respectively in each
match. The possible results in the two matches are displayed in the
probability tree diagram.

a.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image45.png){width="2.7944444444444443in"
    height="3.2569444444444446in"}What is the probability of the team
    having a win and a draw, in any order?

$$0.28$$

b.  Paul claims that 1.4 is the probability of the team winning both
    matches.\
    Give one reason why this is NOT correct.

Probability cannot be greater than one.

He added instead of multiplying along the branches.

14. **2007 HSC Standard 2 Band 5**

> In a stack of 10 DVDs, there are 5 rated PG, 3 rated G and 2 rated M

Grant chooses two DVDs at random from the stack.

Calculate the probability that Grant chooses two DVDs with the same
rating.

![A diagram of a group of triangles Description automatically
generated](media/Probability A 2_Solve problems for multistage chance experiments/media/image46.png){width="2.861761811023622in"
height="3.4381944444444446in"}

$$\frac{14}{45}$$

# Probability Trees with Dependent Events

- **Dependent events** occur when there's **no replacement**.

1.  Draw tree diagram.

2.  Label branches, **the probability of the second event depends on the
    first event.**

3.  Calculate probabilities.

4.  Answer questions.

### **Example** Probability trees with dependent events.

+---------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image47.png){width="3.491175634295713in" | Why is the probability of       |
| height="1.9166666666666667in"}A bag contains 3 red marbles and 5 blue marbles. Two are taken from the bag without         | picking the first red counter   |
| replacement.                                                                                                              | $\frac{3}{8}$ ?                 |
|                                                                                                                           |                                 |
| What is the probability of drawing a red marble and a blue marble, in any order?                                          | *The bag has ...... red marbles |
|                                                                                                                           | and ......... marbles total.*   |
| $P(R,B) + P(R,B) =$ $\frac{15}{56}$ $+$ $\frac{15}{56}$ $=$ $\frac{30}{56}$                                               |                                 |
|                                                                                                                           | Why is the probability of       |
| What is the probability of drawing at least one red marble?                                                               | picking the second red counter  |
|                                                                                                                           | $\frac{2}{7}$ ?                 |
| $1 - P(B,B) = 1 -$ $\frac{20}{56}$ $=$ $\frac{36}{56}$                                                                    |                                 |
|                                                                                                                           | *Because the first red counter  |
|                                                                                                                           | is not .....................,   |
|                                                                                                                           | there are ...... red counters   |
|                                                                                                                           | left out of ............*       |
+===========================================================================================================================+=================================+

> A box contains 2 black balls and 7 white balls. Two balls are drawn at
> random.\
> Balls are not replaced after being picked.

Draw and label a tree diagram, then calculate the probability of:

+-----------------------------------+
| a.  two white balls?              |
|                                   |
| $$\frac{42}{72} = \frac{7}{12}$$  |
+===================================+
| b.  two balls of different        |
|     colour?                       |
|                                   |
| $$\frac{28}{72} = \frac{7}{18}$$  |
+-----------------------------------+
| c.  two balls of the same colour? |
|                                   |
| $$\frac{44}{72} = \frac{11}{18}$$ |
+-----------------------------------+
| d.  at least one white ball?      |
|                                   |
| $$\frac{70}{72} = \frac{35}{36}$$ |
+-----------------------------------+

Foundation

1.  There are 8 cookbooks and 13 maths books on a bookshelf.\
    Two books are selected at random from the bookshelf.

    a.  The first book **is replaced** before the second book is
        selected.\
        Complete to find the probability that the books are the same
        type.

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image48.png){width="2.640972222222222in"
height="1.6659722222222222in"}![](media/Probability A 2_Solve problems for multistage chance experiments/media/image49.png){width="3.3340277777777776in"
height="0.7069444444444445in"}

$$\frac{233}{441}$$

b.  The first book **is** **not replaced** before the second book is
    selected.\
    Complete to find the probability that the books are the same type.

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image50.png){width="3.3055555555555554in"
height="0.7409722222222223in"}![](media/Probability A 2_Solve problems for multistage chance experiments/media/image48.png){width="2.641456692913386in"
height="1.6662620297462818in"}

$$\frac{53}{105}$$

2.  ![A diagram of different fruit flavors Description automatically
    generated with medium
    confidence](media/Probability A 2_Solve problems for multistage chance experiments/media/image51.png){width="4.868055555555555in"
    height="1.9594455380577427in"}A freezer contains 3 lemon ice lollies
    and 5 strawberry ice lollies.\
    Two ice lollies are selected at random without replacement.\
    Complete the probability tree diagram

Find the probability that

a.  both ice lollies are strawberry

$$\frac{5}{14}$$

b.  at least one ice lolly is strawberry.

$$\frac{25}{28}$$

Development

3.  A bag contains 3 red and 4 white counters. Two are taken without
    replacement.

    a.  Draw a tree diagram and label the branches with the
        corresponding probability.

    b.  What is the probability of picking exactly one white counter?

$$\frac{4}{7}$$

c.  What is the probability of picking exactly one red counter?

$$\frac{4}{7}$$

d.  What is the probability of picking no red balls?

$$\frac{2}{7}$$

e.  What is the probability of picking at least one red?

$$\frac{5}{7}$$

4.  There are 12 novels and 9 science books on a bookshelf. Two books
    are selected at random from the bookshelf.

    a.  The first book is replaced before the second book is selected.\
        Draw a tree diagram

Find the probability of choosing:

i.  novel and then a science book.

$$\frac{12}{49}$$

ii. 2 novels.

$$\frac{16}{49}$$

iii. at least one science book.

$$\frac{33}{49}$$

b.  The first book is **NOT** replaced before the second book is
    selected.\
    Draw a tree diagram.

Find the probability of choosing:

i.  novel and then a science book.

$$\frac{9}{35}$$

ii. 2 novels.

$$\frac{11}{35}$$

iii. at least one science book.

$$\frac{24}{35}$$

5.  There are 4 green and 7 pink counters in a bag. Two are picked at
    random.\
    Counters are not replaced after each pick. What is the probability
    of picking at least one pink?

$$\frac{49}{55}$$

6.  I have a 6-sided die and a coin.

    a.  You roll the die twice. Draw a tree diagram to calculate the
        probability you get exactly 1 six.

$$\frac{5}{18}$$

b.  If you roll the die 72 times, how many sixes would you expect to
    get?

12

c.  You flip the coin and roll the die.\
    Draw a two-way table to find the probability you get tails and an
    even number.

  -------------------------------------------------------
          **1**   **2**   **3**   **4**   **5**   **6**
  ------- ------- ------- ------- ------- ------- -------
  Heads   H1      H2      H3      H4      H5      H6

  Tails   T1      T2      T3      T4      T5      T6
  -------------------------------------------------------

$$\frac{1}{4}$$

d.  You flip the coin 3 times.\
    List all the possible outcomes and find the probability of getting
    at least 1 head.

$$\frac{7}{8}$$

e.  How could you use complementary events to calculate the answer to
    part **d** quickly?

$$1\  - \ P(no\ heads) = 1 - P(all\ tails)$$

$$\frac{7}{8}$$

Mastery

7.  There are $x$ green and $y$ pink counters in a bag. Two are picked
    at random.\
    Counters are not replaced after each pick.\
    What probability should be written in space 𝐴 and 𝐵 on the tree
    diagram?

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image52.png){width="2.203038057742782in"
height="1.358620953630796in"}

$$A = \frac{4}{8},\ B = \frac{4}{8}$$

8.  There are 3 yellow and 5 white counters in a bag.\
    Three are picked at random. Counters are not replaced after each
    pick.\
    What is the probability of picking three of the same colour?

$$\frac{11}{56}$$

9.  There are 3 grey, 2 yellow and 5 white counters in a bag.\
    Three are picked at random. Counters are not replaced after each
    pick.\
    What is the probability of picking two greys and a white?

$$\frac{1}{8}$$

10. **2022 HSC Standard 1**

> A jar contains 12 red, 10 black and 13 white lollies.\
> Alex picks out a red lolly and eats it. He then randomly picks a
> second lolly.\
> What is the probability that the second lolly is also red?

$$\frac{11}{34}$$

11. **2021 HSC Standard 2 Band 5**

> ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image53.png){width="2.45in"
> height="1.8111111111111111in"}A box has 8 chocolates. 3 have
> peppermint centres (P) and 5 have caramel centres (C).\
> Kim randomly chooses a chocolate from the box and eats it.\
> Sam then randomly chooses and eats one of the remaining chocolates.

A partially completed probability tree is shown.

> What is the probability that Kim and Sam choose\
> chocolates with different centres?

$$\frac{15}{28}$$

12. **2019 HSC Standard 2 Band 5**

A bowl of fruit contains 17 apples of which 9 are red and 8 are green.

> Dennis takes one apple at random and eats it.\
> Margaret also takes an apple at random and eats it.
>
> By drawing a probability tree diagram, or otherwise, find the
> probability that Dennis and Margaret eat apples of the same colour.

$$\frac{8}{17}$$

13. **2023 HSC Standard 2 Band 4**

> One hundred tickets are sold in a raffle which offers two prizes.\
> Hazel buys five of the tickets.
>
> A ticket is drawn at random for the first prize.\
> A second ticket is drawn from the remaining tickets for the other
> prize.
>
> What is the probability that Hazel wins both prizes?

$$\frac{1}{495}$$

14. **2017 HSC Standard 2 Band 6**

A deck of 52 playing cards contains 12 picture cards.\
Two cards from the deck are drawn at random and placed on a table.\
What is the probability, correct to four decimal places, that exactly
one picture card is on the table?

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image54.png){width="0.9583333333333334in"
height="1.3493055555555555in"}

D

# The Multiplication Rule

- The **multiplication rule** quickly calculates probabilities for
  multistage **independent** events without a tree diagram.

  -------------------------------------
        **Multiplication Rule for
              Probability**
  -------------------------------------
   $$P(A\ and\ B) = P(A) \times P(B)$$

  -------------------------------------

### **Example** Determine probabilities for independent events $P(A\ and\ B) = P(A) \times P(B)$

+----------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image55.png){width="0.6675929571303587in"                               | What does $P(2,B)$ mean?        |
| height="0.6162390638670167in"}![](media/Probability A 2_Solve problems for multistage chance experiments/media/image56.png){width="0.5840277777777778in" |                                 |
| height="0.6131944444444445in"}Alex is rolling a dice and spinning a spinner.                                                                             | *Probability of getting         |
|                                                                                                                                                          | ......... in the first stage    |
| What is the probability that he gets:\                                                                                                                   | and ......... in the second     |
| 2 on the die and B on the spinner?                                                                                                                       | stage.*                         |
|                                                                                                                                                          |                                 |
| $${P(2,B) = P(2) \times P(B)                                                                                                                             | Where did the fractions         |
| }{= \frac{1}{6} \times \frac{1}{5} = \frac{1}{30}}$$                                                                                                     | $\frac{1}{6}$ and $\frac{1}{5}$ |
|                                                                                                                                                          | come from?                      |
| An odd number and a vowel?                                                                                                                               |                                 |
|                                                                                                                                                          | *The probability of getting     |
| $${P(odd,\ vowel) = P(odd) \times P(vowel)                                                                                                               | ...... is* $\frac{1}{6}$        |
| }{= \frac{3}{6} \times \frac{2}{5} = \frac{6}{30}}$$                                                                                                     |                                 |
|                                                                                                                                                          | *The probability of getting     |
|                                                                                                                                                          | ...... is* $\frac{1}{5}$        |
|                                                                                                                                                          |                                 |
|                                                                                                                                                          | When do we multiply             |
|                                                                                                                                                          | probabilities?                  |
|                                                                                                                                                          |                                 |
|                                                                                                                                                          | *We multiply the probabilities  |
|                                                                                                                                                          | of multistage                   |
|                                                                                                                                                          | .................. events.*     |
+==========================================================================================================================================================+=================================+

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image56.png){width="0.59375in"
height="0.6229166666666667in"}![](media/Probability A 2_Solve problems for multistage chance experiments/media/image57.png){width="0.6041666666666666in"
height="0.6111111111111112in"}Allie is rolling a die and spinning a
spinner.

What is the probability she gets:

+----------------------+----------------------+----------------------+
| a.  1 on the dice    | b.  An even number   | c.  A number more    |
|     and C on the     |     and a consonant. |     than 4 and a     |
|     spinner.         |                      |     vowel.           |
|                      | $$\frac{3}{8}$$      |                      |
| $$\frac{1}{24}$$     |                      | $$\frac{1}{12}$$     |
+======================+======================+======================+

**Key ideas**

+-------------------------------------------------------------------+
| 1.  The multiplication rule for multistage                        |
|     ........................ events is *\*                        |
|     $P(A\ and\ B) =$ ............ $\times$ ............           |
+===================================================================+

Foundation

1.  a.  I roll a fair 6-sided die. What is the probability of scoring a
        5?

$$\frac{1}{6}$$

b.  I flip a fair coin. What is the probability of getting Tails?

$$\frac{1}{2}$$

c.  I do both of the above. What is the probability of getting both a 5
    and Tails?

$$\left( \frac{1}{6} \right)\left( \frac{1}{2} \right) = \frac{1}{12}$$

2.  If I roll two fair, 6-sided dice, what is the probability that both
    show even numbers?

$$\left( \frac{1}{2} \right)\left( \frac{1}{2} \right) = \frac{1}{4}$$

3.  Alex has 2 red, 4 blue, 1 yellow and 3 green pens in his pencil
    case.\
    He picks a pen at random, draws a circle, then replaces the pen.\
    Then he does the same for a second circle.\
    What is the probability that both circles are green?

$$\left( \frac{3}{10} \right)\left( \frac{3}{10} \right) = \frac{9}{100}$$

4.  There is a $\frac{3}{5}$ probability that I sleep through my alarm.\
    There is a $\frac{3}{7}$ probability that my bus is late.

What is the probability that I sleep through my alarm and my bus is
**not** late?

$$\left( \frac{3}{5} \right)\left( \frac{4}{7} \right) = \frac{12}{35}$$

5.  $A,B,\ C$ and $D$ are independent events, with $P(A) =$
    $\frac{1}{8}$, $P(B) =$ $\frac{1}{3}$, $P(C) =$ $\frac{1}{4}$,
    $P(D) =$ $\frac{2}{7}$.\
    Use the product rule to find:

+---------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+
| a.  $P(AB)$                                                                                       | b.  $P(AD)$                                                                                       | c.  $P(BC)$                                                                                                                  |
|                                                                                                   |                                                                                                   |                                                                                                                              |
| $$\left( \frac{1}{8} \right)\left( \frac{1}{3} \right) = \frac{1}{24}$$                           | $$\left( \frac{1}{8} \right)\left( \frac{2}{7} \right) = \frac{1}{28}$$                           | $$\left( \frac{1}{3} \right)\left( \frac{1}{4} \right) = \frac{1}{12}$$                                                      |
+===================================================================================================+===================================================================================================+==============================================================================================================================+
| d.  $P(ABC)$                                                                                      | e.  $P(BCD)$                                                                                      | f.  $P(ABCD)$                                                                                                                |
|                                                                                                   |                                                                                                   |                                                                                                                              |
| $$\left( \frac{1}{8} \right)\left( \frac{1}{3} \right)\left( \frac{1}{4} \right) = \frac{1}{96}$$ | $$\left( \frac{1}{3} \right)\left( \frac{1}{4} \right)\left( \frac{2}{7} \right) = \frac{1}{42}$$ | $$\left( \frac{1}{8} \right)\left( \frac{1}{3} \right)\left( \frac{1}{4} \right)\left( \frac{2}{7} \right) = \frac{1}{336}$$ |
+---------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+

6.  A coin and a die are tossed. Use the product rule to find the
    probability of obtaining:

+-------------------------------------------------------------------------+-------------------------------------------------------------------------+------------------------------------------------------------------------+------------------------------------------------------------------------+
| a.  A three and\                                                        | b.  A six and\                                                          | c.  An even number\                                                    | d.  less than 5 and a head                                             |
|     a head                                                              |     a tail                                                              |     and a tail                                                         |                                                                        |
|                                                                         |                                                                         |                                                                        | $$\left( \frac{4}{6} \right)\left( \frac{1}{2} \right) = \frac{1}{3}$$ |
| $$\left( \frac{1}{6} \right)\left( \frac{1}{2} \right) = \frac{1}{12}$$ | $$\left( \frac{1}{6} \right)\left( \frac{1}{2} \right) = \frac{1}{12}$$ | $$\left( \frac{3}{6} \right)\left( \frac{1}{2} \right) = \frac{1}{4}$$ |                                                                        |
+=========================================================================+=========================================================================+========================================================================+========================================================================+

7.  Two marbles are picked at random, one from a bag containing three
    red and four blue marbles, and the other from a bag containing five
    red and two blue. Find the probability of:

+--------------------------------------------------------------------------+-------------------------------------------------------------------------+-------------------------------------------------------------------------+
| a.  Two red marbles                                                      | b.  Two blue marbles                                                    | c.  A red from the first bag and blue from second                       |
|                                                                          |                                                                         |                                                                         |
| $$\left( \frac{3}{7} \right)\left( \frac{5}{7} \right) = \frac{15}{49}$$ | $$\left( \frac{4}{7} \right)\left( \frac{2}{7} \right) = \frac{8}{49}$$ | $$\left( \frac{3}{7} \right)\left( \frac{2}{7} \right) = \frac{6}{49}$$ |
+==========================================================================+=========================================================================+=========================================================================+

8.  A die is rolled twice. Find the probability of:

+-------------------------------------------------------------------------+-------------------------------------------------------------------------+-------------------------------------------------------------------------+
| a.  A six then a five                                                   | b.  A one then an odd number                                            | c.  A double six                                                        |
|                                                                         |                                                                         |                                                                         |
| $$\left( \frac{1}{6} \right)\left( \frac{1}{6} \right) = \frac{1}{36}$$ | $$\left( \frac{1}{6} \right)\left( \frac{3}{6} \right) = \frac{1}{12}$$ | $$\left( \frac{1}{6} \right)\left( \frac{1}{6} \right) = \frac{1}{36}$$ |
+=========================================================================+=========================================================================+=========================================================================+
| d.  Two numbers greater than four                                       | e.  A number greater than four and then\                                                                                                          |
|                                                                         |     a number less than four.                                                                                                                      |
| $$\left( \frac{2}{6} \right)\left( \frac{2}{6} \right) = \frac{1}{9}$$  |                                                                                                                                                   |
|                                                                         | $$\left( \frac{2}{6} \right)\left( \frac{3}{6} \right) = \frac{1}{6}$$                                                                            |
+-------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+

9.  A box contains five light bulbs, two of which are faulty.\
    Two bulbs are selected, one at a time without replacement. Find the
    probability that:

+-------------------------------------------------------------------------+-------------------------------------------------------------------------+-------------------------------------------------------------------------+
| a.  Both bulbs are faulty.                                              | b.  Neither bulb is faulty.                                             | c.  First bulb is faulty and the second not.                            |
|                                                                         |                                                                         |                                                                         |
| $$\left( \frac{2}{5} \right)\left( \frac{1}{4} \right) = \frac{1}{10}$$ | $$\left( \frac{3}{5} \right)\left( \frac{2}{4} \right) = \frac{3}{10}$$ | $$\left( \frac{2}{5} \right)\left( \frac{3}{4} \right) = \frac{3}{10}$$ |
+=========================================================================+=========================================================================+=========================================================================+
| d.  The second bulb is faulty and the first is not.                     | e.  One of the bulbs is faulty.                                         | f.  At least one bulb is faulty.                                        |
|                                                                         |                                                                         |                                                                         |
| $$\left( \frac{3}{5} \right)\left( \frac{2}{4} \right) = \frac{3}{10}$$ | $$\frac{3}{10} + \frac{3}{10} = \frac{3}{5}$$                           | $$1\  - \frac{3}{10} = \frac{7}{10}$$                                   |
+-------------------------------------------------------------------------+-------------------------------------------------------------------------+-------------------------------------------------------------------------+

10. A box contains 12 red and 10 green discs.\
    Three discs are selected, one at a time with replacement.\
    What is the probability that the discs selected are red, green, red
    in that order?

$$\left( \frac{12}{22} \right)\left( \frac{10}{22} \right)\left( \frac{12}{22} \right) = \frac{180}{1331}$$

11. From a standard deck of 52 cards, two cards are drawn at random with
    replacement.\
    Find the probability of drawing:

+-----------------------------------------------------------------------------+-----------------------------------------------------------------------------+
| a.  A spade then a heart                                                    | b.  Two clubs                                                               |
|                                                                             |                                                                             |
| $$\left( \frac{13}{52} \right)\left( \frac{13}{52} \right) = \frac{1}{16}$$ | $$\left( \frac{13}{52} \right)\left( \frac{13}{52} \right) = \frac{1}{16}$$ |
+=============================================================================+=============================================================================+
| c.  A jack then a queen                                                     | d.  The king of diamonds then the ace of clubs.                             |
|                                                                             |                                                                             |
| $$\left( \frac{4}{52} \right)\left( \frac{4}{52} \right) = \frac{1}{169}$$  | $$\left( \frac{1}{52} \right)\left( \frac{1}{52} \right) = \frac{1}{2704}$$ |
+-----------------------------------------------------------------------------+-----------------------------------------------------------------------------+

12. I roll two 6-sided dice, and then add the results.

    a.  How many ways can I get a total of 4? List them.

(1,3), (2,2), (3,1)

Three ways

b.  What is the probability of getting a total of 4?

$$\frac{3}{36} = \frac{1}{12}$$

Or

$$\left( \frac{1}{6} \right)\left( \frac{1}{6} \right) + \left( \frac{1}{6} \right)\left( \frac{1}{6} \right) + \left( \frac{1}{6} \right)\left( \frac{1}{6} \right) = \frac{3}{36} = \frac{1}{12}$$

13. ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image58.png){width="1.5887007874015748in"
    height="0.7708333333333334in"}I spin both these two spinners.

> What is the probability that:

+-------------------------------------------------------------------------+-------------------------------------------------------------------------+------------------------------------------------+
| a.  I get 1 on both spinners?                                           | b.  I get 2 on both spinners?                                           | c.  I get 1 on both spinners or 2 on both      |
|                                                                         |                                                                         |     spinners?                                  |
| $$\left( \frac{1}{3} \right)\left( \frac{1}{5} \right) = \frac{1}{15}$$ | $$\left( \frac{1}{3} \right)\left( \frac{1}{5} \right) = \frac{1}{15}$$ |                                                |
|                                                                         |                                                                         | $$\frac{1}{15} + \frac{1}{15} = \frac{2}{15}$$ |
+=========================================================================+=========================================================================+================================================+
| d.  I get the same number on both spinners?                             | e.  I get a sum of 3?                                                   | f.  I get a sum of 4?                          |
|                                                                         |                                                                         |                                                |
| (1,1) (2,2) or (3,3)                                                    | 2 ways: (1, 2) or (2,1)                                                 | 3 ways: (1,3), (2,2), (3,1)                    |
|                                                                         |                                                                         |                                                |
| $$\frac{3}{15} = \frac{1}{5}$$                                          | $$\frac{2}{15}$$                                                        | $$\frac{3}{15}$$                               |
+-------------------------------------------------------------------------+-------------------------------------------------------------------------+------------------------------------------------+

Development

14. I roll a fair 6-sided die and spin a spinner. The probability that I
    get a 6 on the die and 3 on the spinner is $\frac{1}{42}$. What is
    the smallest number of sides my spinner could have?

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image59.png){width="1.820138888888889in"
height="0.6590277777777778in"}

$$\frac{1}{6} \times \frac{1}{x} = \frac{1}{42}$$

7

15. The probability that on any given day it will rain is ⅓.\
    The probability that on any given day I will wear my coat is ½.

    a.  What is the probability of it raining and I wear my coat,
        assuming these are independent events?

$$\frac{1}{3} \times \frac{1}{2} = \frac{1}{6}$$

b.  Explain why, in real life, there is **not** a probability of ⅙ that
    it rains and I wear my coat.

These are not independent events. I am more liekly to wear my coat if it
rains.

16. a.  I flip three fair coins. What is the probability that I get a
        head on each?

$$\left( \frac{1}{2} \right)\left( \frac{1}{2} \right)\left( \frac{1}{2} \right) = \frac{1}{8}$$

b.  I have already flipped two coins and both are heads.\
    Explain why the probability that the next coin I flip will also be
    heads is $\frac{1}{2}$.

These are independent events. Probability of heads is always
$\frac{1}{2}$

17. **2007 HSC Standard 2 Band 4**

Each time she throws a dart, the probability that Mary hits the
dartboard is $\frac{2}{7}$

She throws two darts, one after the other.

What is the probability that she hits the dartboard with both darts?

$$\left( \frac{2}{7} \right)\left( \frac{2}{7} \right) = \frac{4}{49}$$

Mastery

18. **2012 HSC Standard 2 Band 5**

Two unbiased dice, each with faces numbered 1, 2, 3, 4, 5, 6, are
rolled. 

What is the probability of a 6 appearing on at least one of the dice? 

$$1 - \left( \frac{5}{6} \right)\left( \frac{5}{6} \right) = \frac{11}{36}$$

19. **2004 HSC Standard 2 Band 5**

Two dice are rolled. What is the probability that only one of the dice
shows a six?

$$P(6,\ not\ 6) + P(not\ 6,\ 6)$$

$$\left( \frac{1}{6} \right)\left( \frac{5}{6} \right) + \left( \frac{5}{6} \right)\left( \frac{1}{6} \right) = \frac{5}{18}$$

20. **2020 HSC Standard 2 Band 5**

The top of a rectangular table is divided into 8 equal sections as
shown.

![](media/Probability A 2_Solve problems for multistage chance experiments/media/image60.png){width="2.2819444444444446in"
height="0.9986111111111111in"}

A standard die with faces labelled 1 to 6 is rolled onto the table.\
The die is equally likely to land in any of the 8 sections of the
table.\
If the die does not land entirely in one section of the table, it is
rolled again.

A score is calculated by multiplying the value shown on the top face of
the die by the number shown in the section of the table where the die
lands.

What is the probability of getting a score of 6?

Combinations that score 6: (1,6) (2,3) (3,2) (6,1)

Each combination has
$\left( \frac{1}{8} \right)\left( \frac{1}{6} \right)$ chance

$$\therefore\frac{4}{48} = \frac{1}{12}$$

15. **2013 HSC Advanced Band 4**

> A bag contains 4 red marbles and 6 blue marbles. Three marbles are
> selected at random without replacement.

What is the probability that at least one of the marbles selected is
red?

$$1 - P(no\ red)$$

$$1 - P(BBB)$$

$$1 - \left( \frac{6}{10} \right)\left( \frac{5}{9} \right)\left( \frac{4}{8} \right) = \frac{5}{6}$$

# Check your Understanding

**List outcomes using tables**

+--------------------------------------------------------------------------------------------------------------------------------+
| 1.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image61.png){width="0.84375in"            |
|     height="0.9090277777777778in"}This is a fair spinner.\                                                                     |
|     How many possible outcomes are there if it is spun once?\                                                                  |
|     (Hint: the number of outcomes, not the size of the sample space)                                                           |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------                                          |
|   **a**   6            **b**   3            **c**   1            **d**   1, 3, 5                                               |
|   ------- ------------ ------- ------------ ------- ------------ ------- ------------                                          |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------                                          |
+================================================================================================================================+
| 2.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image62.png){width="1.9653182414698163in" |
|     height="1.0109667541557306in"}These are fair spinners.\                                                                    |
|     How many possible outcomes are there if\                                                                                   |
|     they are spin together and both scores are recorded?                                                                       |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------                                          |
|   **a**   12           **b**   6            **c**   9            **d**   36                                                    |
|   ------- ------------ ------- ------------ ------- ------------ ------- ------------                                          |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------                                          |
+--------------------------------------------------------------------------------------------------------------------------------+
| 3.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image63.png){width="2.552080052493438in"  |
|     height="1.0055194663167104in"}These are fair spinners.\                                                                    |
|     How many possible outcomes are there if\                                                                                   |
|     they are spin together and both scores are recorded?                                                                       |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------                                          |
|   **a**   20           **b**   9            **c**   5            **d**   2                                                     |
|   ------- ------------ ------- ------------ ------- ------------ ------- ------------                                          |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------                                          |
+--------------------------------------------------------------------------------------------------------------------------------+
| 4.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image63.png){width="2.552080052493438in"  |
|     height="1.0055194663167104in"}These spinners are spin and the scores are added.\                                           |
|     What should go in the highlighted cell of the two-way table?                                                               |
|                                                                                                                                |
| +-------+-----------+-------+-----------+-------+-------+-------+-------+-------+-------------+-----------+-------+            |
| |       |           |       |           |       |       |       | **1** | **2** | **3**       | **4**     | **5** |            |
| +=======+===========+=======+===========+=======+=======+:=====:+:=====:+:=====:+:======+:===:+:===:+:===:+:=====:+            |
| |       |           |       |           |       |       | **1** |       |       |             |           |       |            |
| +-------+-----------+-------+-----------+-------+-------+-------+-------+-------+-------------+-----------+-------+            |
| |       |           |       |           |       |       | **2** |       |       |             |           | ?     |            |
| +-------+-----------+-------+-----------+-------+-------+-------+-------+-------+-------------+-----------+-------+            |
| |       |           |       |           |       |       | **3** |       |       |             |           |       |            |
| +-------+-----------+-------+-----------+-------+-------+-------+-------+-------+-------------+-----------+-------+            |
| |       |           |       |           |       |       | **4** |       |       |             |           |       |            |
| +-------+-----------+-------+-----------+-------+-------+-------+-------+-------+-------+-----+-----+-----+-------+            |
| | **a** | 52        | **b** | 7         | **c** | 10                                    | **d**     | 3           |            |
| +-------+-----------+-------+-----------+-------+---------------------------------------+-----------+-------------+            |
+--------------------------------------------------------------------------------------------------------------------------------+
| 5.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image64.png){width="2.4632567804024497in" |
|     height="1.0055194663167104in"}These spinners are spin and the scores are added.\                                           |
|     How many cells would have an outcome of 4?                                                                                 |
|                                                                                                                                |
| +-------+-----------+-------+-----------+-----+-------------+-------+-------+-------+-------------+-----------+-------+        |
| |       |           |       |           |     |             | **1** | **3** | **3** | **5**       | **5**     | **5** |        |
| +=======+===========+=======+===========+=====+:====+:=====:+:=====:+:=====:+:=====:+:=====:+:===:+:===:+:===:+:=====:+        |
| |       |           |       |           |     | **1**       |       |       |       |             |           |       |        |
| +-------+-----------+-------+-----------+-----+-------------+-------+-------+-------+-------------+-----------+-------+        |
| |       |           |       |           |     | **3**       |       |       |       |             |           |       |        |
| +-------+-----------+-------+-----------+-----+-------------+-------+-------+-------+-------------+-----------+-------+        |
| |       |           |       |           |     | **3**       |       |       |       |             |           |       |        |
| +-------+-----------+-------+-----------+-----+-------------+-------+-------+-------+-------------+-----------+-------+        |
| |       |           |       |           |     | **5**       |       |       |       |             |           |       |        |
| +-------+-----------+-------+-----------+-----+-------------+-------+-------+-------+-------------+-----------+-------+        |
| |       |           |       |           |     | **5**       |       |       |       |             |           |       |        |
| +-------+-----------+-------+-----------+-----+-------------+-------+-------+-------+-------------+-----------+-------+        |
| |       |           |       |           |     | **5**       |       |       |       |             |           |       |        |
| +-------+-----------+-------+-----------+-----+-----+-------+-------+-------+-------+-------+-----+-----+-----+-------+        |
| | **a** | 1         | **b** | 2         | **c**     | 4                                     | **d**     | 0           |        |
| +-------+-----------+-------+-----------+-----------+---------------------------------------+-----------+-------------+        |
+--------------------------------------------------------------------------------------------------------------------------------+

**Multiplication rule**

+--------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 1.  You toss two fair coins. What is the probability of getting a heads, then a tail?                                                                        |
|                                                                                                                                                              |
|   -------------------------------------------------------------------------------------------------------                                                    |
|   **a**   $$\frac{1}{2}$$   **b**   $$\frac{1}{3}$$   **c**   $$\frac{2}{3}$$   **d**   $$\frac{1}{4}$$                                                      |
|   ------- ----------------- ------- ----------------- ------- ----------------- ------- -----------------                                                    |
|                                                                                                                                                              |
|   -------------------------------------------------------------------------------------------------------                                                    |
+==============================================================================================================================================================+
| 2.  You toss two fair coins. What is the probability of getting a heads and a tail, in any order?                                                            |
|                                                                                                                                                              |
|   -------------------------------------------------------------------------------------------------------                                                    |
|   **a**   $$\frac{1}{2}$$   **b**   $$\frac{1}{3}$$   **c**   $$\frac{2}{3}$$   **d**   $$\frac{1}{4}$$                                                      |
|   ------- ----------------- ------- ----------------- ------- ----------------- ------- -----------------                                                    |
|                                                                                                                                                              |
|   -------------------------------------------------------------------------------------------------------                                                    |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 3.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image65.png){width="0.6090277777777777in"                               |
|     height="0.6131944444444445in"}![](media/Probability A 2_Solve problems for multistage chance experiments/media/image66.png){width="0.6354166666666666in" |
|     height="0.6111111111111112in"}You spin the above fair spinners. What is the probability of getting a 3 on both spinners?                                 |
|                                                                                                                                                              |
|   ---------------------------------------------------------------------------------------------------------                                                  |
|   **a**   $$\frac{1}{9}$$   **b**   $$\frac{1}{20}$$   **c**   $$\frac{2}{9}$$   **d**   $$\frac{2}{20}$$                                                    |
|   ------- ----------------- ------- ------------------ ------- ----------------- ------- ------------------                                                  |
|                                                                                                                                                              |
|   ---------------------------------------------------------------------------------------------------------                                                  |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 4.  The probability of Shane going to the cinema is 0.2.                                                                                                     |
|                                                                                                                                                              |
| > The probability of Niamh going to bowling is 0.6.                                                                                                          |
|                                                                                                                                                              |
| These two events are independent.\                                                                                                                           |
| What is the probability that Shane goes to the cinema and Niamh goes bowling?                                                                                |
|                                                                                                                                                              |
|   -----------------------------------------------------------------------------------                                                                        |
|   **a**   $$0.12$$     **b**   $$0.5$$      **c**   $$0.8$$      **d**   $$1.2$$                                                                             |
|   ------- ------------ ------- ------------ ------- ------------ ------- ------------                                                                        |
|                                                                                                                                                              |
|   -----------------------------------------------------------------------------------                                                                        |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------+

**Probability trees with independent events**

+--------------------------------------------------------------------------------------------------------------------------------+
| 1.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image67.png){width="2.270138888888889in"  |
|     height="1.2881944444444444in"}Ruby is going to play a game of rounders (a game similar to baseball) and a game of          |
|     netball.\                                                                                                                  |
|     The probability of winning at rounders is 0.2.                                                                             |
|                                                                                                                                |
| > The probability of winning at netball is 0.7                                                                                 |
| >                                                                                                                              |
| > What number should replace the star in the diagram?                                                                          |
|                                                                                                                                |
|   ---------------------------------------------------------------                                                              |
|   **a**   0.3     **b**   0.8     **c**   0.7     **d**   0.2                                                                  |
|   ------- ------- ------- ------- ------- ------- ------- -------                                                              |
|                                                                                                                                |
|   ---------------------------------------------------------------                                                              |
+================================================================================================================================+
| 2.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image68.png){width="2.270138888888889in"  |
|     height="1.2138932633420823in"}Exact same scenario as Q1.\                                                                  |
|     What number should replace the star in the diagram?                                                                        |
|                                                                                                                                |
|   ---------------------------------------------------------------                                                              |
|   **a**   0.3     **b**   0.8     **c**   0.7     **d**   0.2                                                                  |
|   ------- ------- ------- ------- ------- ------- ------- -------                                                              |
|                                                                                                                                |
|   ---------------------------------------------------------------                                                              |
+--------------------------------------------------------------------------------------------------------------------------------+
| 3.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image69.png){width="2.051512467191601in"  |
|     height="1.255178258967629in"}What is the probability of losing both chess and chequers?\                                   |
|     The results of both games are independent.                                                                                 |
|                                                                                                                                |
|   ---------------------------------------------------------------                                                              |
|   **a**   0.18    **b**   0.8     **c**   0.9     **d**   0.08                                                                 |
|   ------- ------- ------- ------- ------- ------- ------- -------                                                              |
|                                                                                                                                |
|   ---------------------------------------------------------------                                                              |
+--------------------------------------------------------------------------------------------------------------------------------+
| 4.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image70.png){width="2.0511067366579177in" |
|     height="1.233636264216973in"}What is the probability of winning only one of the games?\                                    |
|     The results of both games are independent.                                                                                 |
|                                                                                                                                |
|   ----------------------------------------------------------------                                                             |
|   **a**   0.74    **b**   0.0144   **c**   2       **d**   0.72                                                                |
|   ------- ------- ------- -------- ------- ------- ------- -------                                                             |
|                                                                                                                                |
|   ----------------------------------------------------------------                                                             |
+--------------------------------------------------------------------------------------------------------------------------------+
| 5.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image71.png){width="2.0514785651793526in" |
|     height="1.4200634295713035in"}What is the probability of losing both games?\                                               |
|     The results of both games are independent.                                                                                 |
|                                                                                                                                |
|   --------------------------------------------------------------------------------------------------------------               |
|   **a**   $$\frac{10}{24}$$   **b**   $$\frac{15}{24}$$   **c**   $$\frac{52}{83}$$   **d**   $$\frac{7}{11}$$                 |
|   ------- ------------------- ------- ------------------- ------- ------------------- ------- ------------------               |
|                                                                                                                                |
|   --------------------------------------------------------------------------------------------------------------               |
+--------------------------------------------------------------------------------------------------------------------------------+
| 6.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image72.png){width="2.051388888888889in"  |
|     height="1.3396817585301837in"}What is the probability of winning exactly one game?\                                        |
|     The results of both games are independent.                                                                                 |
|                                                                                                                                |
|   --------------------------------------------------------------------------------------------------------------               |
|   **a**   $$\frac{48}{24}$$   **b**   $$\frac{11}{24}$$   **c**   $$\frac{6}{24}$$   **d**   $$\frac{14}{24}$$                 |
|   ------- ------------------- ------- ------------------- ------- ------------------ ------- -------------------               |
|                                                                                                                                |
|   --------------------------------------------------------------------------------------------------------------               |
+--------------------------------------------------------------------------------------------------------------------------------+

**Probability trees with dependent events**

+--------------------------------------------------------------------------------------------------------------------------------+
| 1.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image73.png){width="2.311009405074366in"  |
|     height="1.3268963254593176in"}A bag contains 6 red counters and 5 black counters. The counters are not replaced each time  |
|     one is picked.                                                                                                             |
|                                                                                                                                |
| > What fraction should replace the star?                                                                                       |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------------------------------                  |
|   **a**   $$\frac{4}{10}$$   **b**   $$\frac{5}{11}$$   **c**   $$\frac{4}{11}$$   **d**   $$\frac{5}{10}$$                    |
|   ------- ------------------ ------- ------------------ ------- ------------------ ------- ------------------                  |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------------------------------                  |
+================================================================================================================================+
| 2.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image74.png){width="2.311010498687664in"  |
|     height="1.264258530183727in"}Same scenario as Q1.                                                                          |
|                                                                                                                                |
| > What fraction should replace the star?                                                                                       |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------------------------------                  |
|   **a**   $$\frac{4}{10}$$   **b**   $$\frac{5}{11}$$   **c**   $$\frac{4}{11}$$   **d**   $$\frac{5}{10}$$                    |
|   ------- ------------------ ------- ------------------ ------- ------------------ ------- ------------------                  |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------------------------------                  |
+--------------------------------------------------------------------------------------------------------------------------------+
| 3.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image75.png){width="2.2580643044619424in" |
|     height="1.2638888888888888in"}Same scenario as Q1.                                                                         |
|                                                                                                                                |
| > What fraction should replace the star?                                                                                       |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------------------------------                  |
|   **a**   $$\frac{5}{10}$$   **b**   $$\frac{6}{11}$$   **c**   $$\frac{5}{11}$$   **d**   $$\frac{6}{10}$$                    |
|   ------- ------------------ ------- ------------------ ------- ------------------ ------- ------------------                  |
|                                                                                                                                |
|   -----------------------------------------------------------------------------------------------------------                  |
+--------------------------------------------------------------------------------------------------------------------------------+
| 4.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image76.png){width="2.265748031496063in"  |
|     height="1.312217847769029in"}A bag contains 5 blue counters and 3 yellow counters.                                         |
|                                                                                                                                |
| > The counters are not replaced each time one is picked.                                                                       |
| >                                                                                                                              |
| > What is the probability of picking two blue?                                                                                 |
|                                                                                                                                |
|   ---------------------------------------------------------------------------------------------------------------              |
|   **a**   $$\frac{25}{56}$$   **b**   $$\frac{25}{64}$$   **c**   $$\frac{20}{56}$$   **d**   $$\frac{20}{64}$$                |
|   ------- ------------------- ------- ------------------- ------- ------------------- ------- -------------------              |
|                                                                                                                                |
|   ---------------------------------------------------------------------------------------------------------------              |
+--------------------------------------------------------------------------------------------------------------------------------+
| 5.  ![](media/Probability A 2_Solve problems for multistage chance experiments/media/image76.png){width="2.265748031496063in"  |
|     height="1.312217847769029in"}A bag contains 5 blue counters and 3 yellow counters.                                         |
|                                                                                                                                |
| > The counters are not replaced each time one is picked.                                                                       |
| >                                                                                                                              |
| > What is the probability of picking two of the same colour?                                                                   |
|                                                                                                                                |
|   ---------------------------------------------------------------------------------------------------------------              |
|   **a**   $$\frac{20}{56}$$   **b**   $$\frac{26}{56}$$   **c**   $$\frac{34}{64}$$   **d**   $$\frac{26}{64}$$                |
|   ------- ------------------- ------- ------------------- ------- ------------------- ------- -------------------              |
|                                                                                                                                |
|   ---------------------------------------------------------------------------------------------------------------              |
+--------------------------------------------------------------------------------------------------------------------------------+
