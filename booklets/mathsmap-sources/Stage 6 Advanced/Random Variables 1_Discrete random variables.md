+-------------------------------------------------------------------+
| Mathematics Advanced Year 11                                      |
+===================================================================+
| **Probability &**                                                 |
|                                                                   |
| **Data**                                                          |
+-------------------------------------------------------------------+

+-------------------------+-----------------------------------+-------------------------+
| **Book 1**              | Sample Subtopic                   | Version: 251017         |
|                         |                                   |                         |
|                         |                                   | Feedback:\              |
|                         |                                   | https://MrDingMaths.com |
+=========================+===================================+=========================+
| **Contents**                                                                          |
|                                                                                       |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                          |
|                                                                                       |
| [Learning Intention [9](#_Toc202480289)](#_Toc202480289)                              |
+---------------------------------------------------------------------------------------+

# Syllabus Content

**MAV-12-07** solves problems involving discrete probability
distributions, continuous random variables and the normal distribution

**Discrete random variables**

- Use the relative frequencies of discrete random variable datasets to
  estimate the probabilities that the random variable $X$ takes each of
  its values, and explain why these estimated probabilities add to 1

- Denote the probability that the discrete random variable $X$ takes the
  value $x$ by $P(X = x)$, or by $P(x)$ if the discrete random variable
  $X$ is understood

- Define a discrete probability distribution to be the set of values $x$
  taken by a discrete random variable $X$, together with the
  probabilities $P(x)$ that $x$ is the outcome of the experiment

- Define a discrete random variable to be uniformly distributed if it
  has finitely many values, all with the same probability, and use it to
  model random phenomena with equally likely outcomes

- Recognise the mean, or expected value, $\mu$ or $\text{E}(X)$, of a
  discrete random variable $X$ as a measure of centre for its
  distribution

- Generate and use the formulas $\text{E}(X) = \mu = \Sigma xP(x)$ and
  $Var(X) = \sigma^{2} = \Sigma(x - \mu)^{2}P(x) = \Sigma x^{2}P(x) - \mu^{2}$
  for the random variable $X$, where $Var(X)$ is the variance and
  $\sigma$ is the standard deviation of the distribution

- Recognise that the variance is an expected value because
  $\text{Var}(X) = \text{E}\left( (X - \mu)^{2} \right)$

- Generate a probability distribution for a given discrete random
  variable and represent the probability distribution in graphical and
  tabular form

- Solve problems involving probabilities, expectation and variance of
  discrete random variables

# Discrete Probability Distributions

+-------------------------------------------------------------------+
| - **Discrete Probability Distributions**                          |
+===================================================================+
| A **discrete probability distribution** is a function that        |
| assigns a probability to each possible outcome of a discrete      |
| random variable.                                                  |
|                                                                   |
| - **Domain** $\mathbf{x:}$ all possible outcomes that a random    |
|   variable $X$ can take.                                          |
|                                                                   |
| - **Function rule** $P(X = x)$: the probability that $X$ equals   |
|   $x$.\                                                           |
|   When it\'s clear which random variable we\'re discussing, we    |
|   can shorten this to $P(x)$.                                     |
|                                                                   |
| - **Range:** the probability, each probability must be between 0  |
|   and 1.                                                          |
|                                                                   |
| <!-- -->                                                          |
|                                                                   |
| - All probabilities must sum to 1.                                |
|                                                                   |
| - All outcomes $x$ must be mutually exclusive.                    |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** discrete probability distributions.                                                                                            |
+================================================================================================================================================+
| Three coins are tossed, and the number of heads is recorded.                                                                                   |
|                                                                                                                                                |
| Using the tree diagram, complete the table below.                                                                                              |
|                                                                                                                                                |
| +----------+----------+----------+--------------+                                                                                              |
| | **1^st^  | **2^nd^  | **3^rd^  | **Outcomes** |                                                                                              |
| | Coin**   | Coin**   | Coin**   |              |                                                                                              |
| +==========+==========+==========+==============+                                                                                              |
| | H        | H        | H\       | HHH          |                                                                                              |
| |          |          | T        |              |                                                                                              |
| | T        | T        |          | HHT          |                                                                                              |
| |          |          | H        |              |                                                                                              |
| |          | H        |          | HTH          |                                                                                              |
| |          |          | T        |              |                                                                                              |
| |          | T        |          | HTT          |                                                                                              |
| |          |          | H        |              |                                                                                              |
| |          |          |          | THH          |                                                                                              |
| |          |          | T        |              |                                                                                              |
| |          |          |          | THT          |                                                                                              |
| |          |          | H        |              |                                                                                              |
| |          |          |          | TTH          |                                                                                              |
| |          |          | T        |              |                                                                                              |
| |          |          |          | TTT          |                                                                                              |
| +----------+----------+----------+--------------+                                                                                              |
|                                                                                                                                                |
|   -----------------------------------------                                                                                                    |
|   **Number of         0     1     2     3                                                                                                      |
|   heads**                                                                                                                                      |
|   ----------------- ----- ----- ----- -----                                                                                                    |
|   **Probability**                                                                                                                              |
|                                                                                                                                                |
|   -----------------------------------------                                                                                                    |
|                                                                                                                                                |
| a.  The discrete random variable $X$ is the number of heads in three coin tosses.                                                              |
|                                                                                                                                                |
| b.  The set of all possible outcomes $x$ is: $X =$ {...........................}                                                               |
|                                                                                                                                                |
| c.  Rewrite the table using probability notation:                                                                                              |
|                                                                                                                                                |
|   ---------------------------------------------------------------------                                                                        |
|   $$\mathbf{x}$$                                                                                                                               |
|   --------------------------------------------- ----- ----- ----- -----                                                                        |
|   $$\mathbf{P}\left( \mathbf{X = x} \right)$$                                                                                                  |
|                                                                                                                                                |
|   ---------------------------------------------------------------------                                                                        |
|                                                                                                                                                |
| d.  Write the meaning of $P(X = 1) =$ $\frac{3}{8}$ for this scenario:                                                                         |
|                                                                                                                                                |
| The p..................... of getting ......... head is ...............                                                                        |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** discrete probability distributions.                                                                                            |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| Four coins are tossed, and the number of heads is recorded.                                                                                    |
|                                                                                                                                                |
| A completed table is given below.                                                                                                              |
|                                                                                                                                                |
|   -------------------------------------------------------------------------------------------------------------------------------------------- |
|                  $$\mathbf{x}$$                         0                  1                  2                  3                  4          |
|   --------------------------------------------- ------------------ ------------------ ------------------ ------------------ ------------------ |
|    $$\mathbf{P}\left( \mathbf{X = x} \right)$$   $$\frac{1}{16}$$   $$\frac{4}{16}$$   $$\frac{6}{16}$$   $$\frac{4}{16}$$   $$\frac{1}{16}$$  |
|                                                                                                                                                |
|   -------------------------------------------------------------------------------------------------------------------------------------------- |
|                                                                                                                                                |
| a.  The discrete random variable $X$ is ............................................................                                           |
|                                                                                                                                                |
| b.  The set of all possible outcomes $x$ is: $X =$ {...........................}                                                               |
|                                                                                                                                                |
| c.  Write the meaning of $P(X = 1) =$ $\frac{4}{16}$ for this scenario:                                                                        |
|                                                                                                                                                |
| ..................................................................................................................                             |
|                                                                                                                                                |
| d.  Write the meaning of $P(X = 2) =$ $\frac{6}{16}$ for this scenario:                                                                        |
|                                                                                                                                                |
| ..................................................................................................................                             |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| Three dice are rolled, and the number of times a two shows up is recorded.                                                                     |
|                                                                                                                                                |
| Find the missing number in the table below.                                                                                                    |
|                                                                                                                                                |
|   -------------------------------------------------------------------------------------------------------------------                          |
|                  $$\mathbf{x}$$                           0             1             2                    3                                   |
|   --------------------------------------------- --------------------- ------ -------------------- -------------------                          |
|    $$\mathbf{P}\left( \mathbf{X = x} \right)$$   $$\frac{125}{216}$$          $$\frac{15}{216}$$   $$\frac{1}{216}$$                           |
|                                                                                                                                                |
|   -------------------------------------------------------------------------------------------------------------------                          |
|                                                                                                                                                |
| a.  Find the missing value in the table.                                                                                                       |
|                                                                                                                                                |
| b.  The discrete random variable $X$ is ............................................................                                           |
|                                                                                                                                                |
| c.  The set of all possible outcomes $x$ is: $X =$ {...........................}                                                               |
|                                                                                                                                                |
| d.  Write the meaning of $P(X = 0) =$ $\frac{125}{216}$ for this scenario:                                                                     |
|                                                                                                                                                |
| ..................................................................................................................                             |
|                                                                                                                                                |
| e.  Write the meaning of $P(X = 3) =$ $\frac{1}{216}$ for this scenario:                                                                       |
|                                                                                                                                                |
| ..................................................................................................................                             |
+------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------+
| - **Graphs of Probability Distributions**                                                                                           |
+=====================================================================================================================================+
| We represent probability distributions using tables, histograms, polygons, and ordered pairs.                                       |
|                                                                                                                                     |
|   -----------------------------------------------------------------                                                                 |
|                $$\mathbf{x}$$                 1     2     3     4                                                                   |
|   ----------------------------------------- ----- ----- ----- -----                                                                 |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$   0.1   0.4   0.3   0.2                                                                  |
|                                                                                                                                     |
|   -----------------------------------------------------------------                                                                 |
|                                                                                                                                     |
| ![](media/Random Variables 1_Discrete random variables/media/image1.png){width="2.842361111111111in"                                |
| height="2.0055555555555555in"}![](media/Random Variables 1_Discrete random variables/media/image2.png){width="2.8424726596675414in" |
| height="2.009440069991251in"}                                                                                                       |
+-------------------------------------------------------------------------------------------------------------------------------------+

'

+-----------------------------------------------------------------------------------------------------------------------+
| - **Uniform Probability Distributions**                                                                               |
+=======================================================================================================================+
| A probability distribution is **uniform** if the probability of each outcome is the same.                             |
|                                                                                                                       |
| - For a uniform distribution with $n$ outcomes, the probability of each outcome is $\frac{1}{n}$                      |
|                                                                                                                       |
|   -----------------------------------------------------------------------                                             |
|                $$\mathbf{x}$$                 5     6     7     8     9                                               |
|   ----------------------------------------- ----- ----- ----- ----- -----                                             |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$   0.2   0.2   0.2   0.2   0.2                                              |
|                                                                                                                       |
|   -----------------------------------------------------------------------                                             |
|                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image3.png){width="3.127083333333333in"                  |
| height="2.175in"}![](media/Random Variables 1_Discrete random variables/media/image4.png){width="3.127083333333333in" |
| height="2.178772965879265in"}                                                                                         |
+-----------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find the discrete probability distribution for an experiment.                                                                                                                                                        |
+====================================================================================================================================================================================================================================+
| A bag contains 5 black marbles and 3 white marbles.\                                                                                                                                                                               |
| Two balls are randomly selected without replacement.\                                                                                                                                                                              |
| Represent the probability distribution for the number of black marbles selected as a\                                                                                                                                              |
| table, histogram, and polygon.                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                    |
| +----------+----------+---------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+ |
| | **1^st^  | **2^nd^  | **Events**                |   ----------------------------------------------------------------------------------------------------                                                                       | |
| | Stage**  | Stage**  |                           |                 $\mathbf{x}$                0                   1                   2                                                                                        | |
| |          |          |                           |   ----------------------------------------- ------------------- ------------------- ------------------                                                                       | |
| |          |          |                           |    $$\mathbf{P}\left( \mathbf{x} \right)$$  $$\frac{20}{56}$$   $$\frac{30}{56}$$   $$\frac{6}{56}$$                                                                         | |
| |          |          |                           |                                                                                                                                                                              | |
| |          |          |                           |   ----------------------------------------------------------------------------------------------------                                                                       | |
| |          |          |                           |                                                                                                                                                                              | |
| |          |          |                           | ![](media/Random Variables 1_Discrete random variables/media/image6.png)![](media/Random Variables 1_Discrete random variables/media/image7.png){width="3.205980971128609in" | |
| |          |          |                           | height="2.205323709536308in"}                                                                                                                                                | |
| +----------+----------+---------------------------+                                                                                                                                                                              | |
| | W        | W        | $$P(BB) = \frac{20}{56}$$ |                                                                                                                                                                              | |
| |          |          |                           |                                                                                                                                                                              | |
| |          |          | $$P(BW) = \frac{15}{56}$$ |                                                                                                                                                                              | |
| |          |          |                           |                                                                                                                                                                              | |
| |          |          | $$P(WB) = \frac{15}{56}$$ |                                                                                                                                                                              | |
| |          |          |                           |                                                                                                                                                                              | |
| |          |          | $$P(WW) = \frac{6}{56}$$  |                                                                                                                                                                              | |
| +==========+==========+===========================+==============================================================================================================================================================================+ |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                                                                                                                            |
+===========================================================================================================================================================================================================================================+
| Two fair four-sided dice are rolled.                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                           |
| Represent the probability distribution for the sum of the top two faces as a table, histogram, and polygon.                                                                                                                               |
|                                                                                                                                                                                                                                           |
| +----------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+ |
| |   ------------------------------------------------ |   ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | |
| |    $$\mathbf{+}$$   **1**   **2**   **3**   **4**  |                 $\mathbf{x}$                        2                  3                  4                  5                  6                  7                  8          | |
| |   ---------------- ------- ------- ------- ------- |   ----------------------------------------- ------------------ ------------------ ------------------ ------------------ ------------------ ------------------ ------------------ | |
| |        **1**          2       3       4       5    |    $$\mathbf{P}\left( \mathbf{x} \right)$$   $$\frac{1}{16}$$   $$\frac{2}{16}$$   $$\frac{3}{16}$$   $$\frac{4}{16}$$   $$\frac{3}{16}$$   $$\frac{2}{16}$$   $$\frac{1}{16}$$  | |
| |                                                    |                                                                                                                                                                                  | |
| |        **2**          3       4       5       6    |   ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | |
| |                                                    |                                                                                                                                                                                  | |
| |        **3**          4       5       6       7    | ![](media/Random Variables 1_Discrete random variables/media/image8.png){width="3.1006944444444446in"                                                                            | |
| |                                                    | height="2.126388888888889in"}![](media/Random Variables 1_Discrete random variables/media/image9.png){width="3.1006944444444446in" height="2.122916666666667in"}                 | |
| |        **4**          5       6       7       8    |                                                                                                                                                                                  | |
| |   ------------------------------------------------ |                                                                                                                                                                                  | |
| +====================================================+==================================================================================================================================================================================+ |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  a.  Complete the table for the probability distribution when two
        coins are tossed.

  -----------------------------------------------------------------------------------------
  **Outcome**       TT                HT                TH                HH
  ----------------- ----------------- ----------------- ----------------- -----------------
  **Probability**   $$\frac{1}{4}$$   $$\frac{1}{4}$$   $$\frac{1}{4}$$   $$\frac{1}{4}$$

  -----------------------------------------------------------------------------------------

b.  What type of distribution is this?

Uniform.

c.  Define the discrete random variable $\mathbf{X:}$ **Number of heads
    when two coins are tossed.**

> List all possible outcomes for $X$.
>
> $X = \{$ ......, ......, ...... }

$$X = \left\{ 0,\ 1,\ 2 \right\}$$

d.  Complete the table to the left below, then again using formal
    probability notation.

+---------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+
|   ----------------------------------------------------------------------- |   --------------------------------------------------------------------------------------------------- |
|   **Number of       0                 1                 2                 |                  $$\mathbf{x}$$                 0                 1                 2                 |
|   Heads**                                                                 |   --------------------------------------------- ----------------- ----------------- ----------------- |
|   ----------------- ----------------- ----------------- ----------------- |    $$\mathbf{P}\left( \mathbf{X = x} \right)$$  $$\frac{1}{4}$$   $$\frac{1}{2}$$   $$\frac{1}{4}$$   |
|   **Probability**   $$\frac{1}{4}$$   $$\frac{1}{2}$$   $$\frac{1}{4}$$   |                                                                                                       |
|                                                                           |   --------------------------------------------------------------------------------------------------- |
|   ----------------------------------------------------------------------- |                                                                                                       |
+===========================================================================+=======================================================================================================+

2.  Create a probability distribution table for each of these scenarios.

+---------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+
| a.  The word lengths in the     | b.  A digit is chosen at random from the 12-digit number 1.41421356237.                                                             |
|     sentence, \'The ginger cat  |                                                                                                                                     |
|     ran off with the meat.\'    | ![](media/Random Variables 1_Discrete random variables/media/image10.png){width="3.4430555555555555in"                              |
|                                 | height="0.8520833333333333in"}![](media/Random Variables 1_Discrete random variables/media/image11.png){width="3.030452755905512in" |
|                                 | height="0.8520833333333333in"}                                                                                                      |
+=================================+=====================================================================================================================================+

3.  Identify which of the following represents a valid probability
    distribution. Remember that all probabilities must be between 0 and
    1, and sum to 1.

+--------------------------------------------------+----------------------------------------------------------------------------------------------+
| a.                                               | b.                                                                                           |
|                                                  |                                                                                              |
|   ------------------------------------------     |   -------------------------------------------                                                |
|   $$x$$                1     2     3     4       |   $$x$$                1     2     3      4                                                  |
|   ------------------ ----- ----- ----- -----     |   ------------------ ----- ----- ------ -----                                                |
|   $$P(X\  = \ x)$$    0.1   0.6   0.2   0.1      |   $$P(X\  = \ x)$$    0.5   0.3   -0.2   0.4                                                 |
|                                                  |                                                                                              |
|   ------------------------------------------     |   -------------------------------------------                                                |
|                                                  |                                                                                              |
| valid                                            | Not valid                                                                                    |
+==================================================+==============================================================================================+
| c.                                               | d.                                                                                           |
|                                                  |                                                                                              |
|   ---------------------------------------------- |   ------------------------------------------                                                 |
|   $$x$$                1      2      3      4    |   $$x$$                1     2     3     4                                                   |
|   ------------------ ------ ------ ------ ------ |   ------------------ ----- ----- ----- -----                                                 |
|   $$P(X\  = \ x)$$    0.25   0.25   0.25   0.25  |   $$P(X\  = \ x)$$    30%   20%   40%   10%                                                  |
|                                                  |                                                                                              |
|   ---------------------------------------------- |   ------------------------------------------                                                 |
|                                                  |                                                                                              |
| valid                                            | valid                                                                                        |
+--------------------------------------------------+----------------------------------------------------------------------------------------------+
| e.                                               | f.                                                                                           |
|                                                  |                                                                                              |
|   ------------------------------------------     |   ------------------------------------------------------------------------------------------ |
|   $$x$$                1     2     3     4       |   $$x$$                      1                 2                 3                 4         |
|   ------------------ ----- ----- ----- -----     |   ------------------ ----------------- ----------------- ----------------- ----------------- |
|   $$P(X\  = \ x)$$    0.7   0.2   0.4   0.2      |   $$P(X\  = \ x)$$    $$\frac{1}{6}$$   $$\frac{1}{3}$$   $$\frac{1}{4}$$   $$\frac{1}{4}$$  |
|                                                  |                                                                                              |
|   ------------------------------------------     |   ------------------------------------------------------------------------------------------ |
|                                                  |                                                                                              |
| Not valid                                        | valid                                                                                        |
+--------------------------------------------------+----------------------------------------------------------------------------------------------+

4.  A discrete probability distribution is given below.

  --------------------------------------------------------
  $$x$$                0     1     2     3      4      5
  ------------------ ----- ----- ----- ------ ------ -----
  $$P(X\  = \ x)$$    0.1   0.2   0.3   0.25   0.05   0.1

  --------------------------------------------------------

Find:

+----------------------+--------------------------+-----------------------+
| a.   $P(X = 1)$      | b.  $P(2 \leq X \leq 4)$ | c.  $P(1 \leq X < 4)$ |
|                      |                          |                       |
| $$0.2$$              | $$0.6$$                  | $$0.75$$              |
+======================+==========================+=======================+
| d.  $P(X = 6)$       | e.  $P(X \leq 2)$        | f.  $P(X < 4)$        |
|                      |                          |                       |
| $$0$$                | $$0.6$$                  | $$0.85$$              |
+----------------------+--------------------------+-----------------------+
| g.  $P(X \geq 1)$    | h.  $P(X > 1)$           | i.  $P(X\ is\ even)$  |
|                      |                          |                       |
| $$0.9$$              | $$0.7$$                  | $$0.45$$              |
+----------------------+--------------------------+-----------------------+

5.  A function is given by $P(x) =$ $\frac{x - 2}{6}$ for the domain
    $x \in \left\{ 3,\ 4,\ 5 \right\}$.

    a.  Complete the probability distribution table.

  ----------------------------------------------------------------
  $$x$$      3                 4                 5
  ---------- ----------------- ----------------- -----------------
  $$P(x)$$   $$\frac{1}{6}$$   $$\frac{1}{3}$$   $$\frac{1}{2}$$

  ----------------------------------------------------------------

b.  Show that this is a probability distribution.

$$\frac{1}{6} + \frac{1}{3} + \frac{1}{2} = 1$$

c.  Find:

+---------------------+---------------------+---------------------------+
| i.  $P(X > 3)$      | ii. $P(X =$ odd)    | iii. $P(3 \leq X \leq 5)$ |
|                     |                     |                           |
| $$\frac{5}{6}$$     | $$\frac{2}{3}$$     | $$\frac{1}{2}$$           |
+=====================+=====================+===========================+

6.  Draw a histogram of this probability distribution.

  --------------------------------------------------
  $$x$$                0      1     2      3     4
  ------------------ ------ ----- ------ ----- -----
  $$P(X\  = \ x)$$    0.05   0.4   0.25   0.1   0.2

  --------------------------------------------------

![](media/Random Variables 1_Discrete random variables/media/image12.png){width="3.6666666666666665in"
height="2.4784733158355206in"}![A graph with numbers and a bar
AI-generated content may be
incorrect.](media/Random Variables 1_Discrete random variables/media/image13.png){width="3.5922331583552056in"
height="2.493931539807524in"}

Development

7.  Decide whether these functions can be a probability distribution.

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------+
| a.                                                                                                                                                                | b.                                                            |
|                                                                                                                                                                   |                                                               |
| $$\left( 0,\frac{1}{5} \right)\ \ \left( 1,\frac{2}{5} \right)\ \ \left( 2, - \frac{1}{5} \right)\ \left( 3,\frac{2}{5} \right)\ \ \left( 4,\frac{1}{5} \right)$$ | $$P(x) = \frac{x + 2}{4}\ for\ x \in \left\{ 0,1,2 \right\}$$ |
|                                                                                                                                                                   |                                                               |
| No, can't have negative $P(x)$                                                                                                                                    | No, sum of all $P(x) > 1$                                     |
+===================================================================================================================================================================+===============================================================+

8.  These questions require you to find the probabilities using a tree
    diagram, or otherwise.\
    Construct a probability distribution table for the given discrete
    random variable.

    a.  A pack of cards has 52 cards, of which 12 are court cards.\
        Two cards are drawn with replacement, and it is recorded whether
        or not it is a court card.\
        Let $X$ be the number of court cards drawn.

![](media/Random Variables 1_Discrete random variables/media/image14.png){width="3.779166666666667in"
height="1.9471205161854768in"}

![](media/Random Variables 1_Discrete random variables/media/image15.png){width="3.1680555555555556in"
height="0.8723031496062992in"}

b.  Three dice are thrown, and the number of even numbers is recorded.

> Let $X$ be the number of even numbers when the three dice are thrown.
>
> ![](media/Random Variables 1_Discrete random variables/media/image16.png){width="3.4700656167979003in"
> height="0.8472222222222222in"}

c.  A class has 10 girls and 15 boys. Mr Ding calls on three students at
    random to answer a question, not caring whether he has called that
    name before.\
    Let $X$ be the number of girls called.

![](media/Random Variables 1_Discrete random variables/media/image17.png){width="3.4700656167979003in"
height="0.7588199912510936in"}

9.  Find the unknown constant $a$ in these probability distributions.

    a.  

  ---------------------------------------------------------------
  $$\mathbf{x}$$        1        2        3        4        5
  ------------------ -------- -------- -------- -------- --------
  $$P(X\  = \ x)$$    $$4a$$   $$2a$$   $$9a$$   $$3a$$   $$7a$$

  ---------------------------------------------------------------

$$a = \frac{1}{25}$$

b.  

  -------------------------------------------------------------
  $$\mathbf{x}$$        1        2       3        4       5
  ------------------ -------- ------- -------- ------- --------
  $$P(X\  = \ x)$$    $$3a$$   $$a$$   $$4a$$   $$a$$   $$5a$$

  -------------------------------------------------------------

$$a = \frac{1}{14}$$

c.  

  ---------------------------------------------------------------
  $$\mathbf{x}$$       -2       -1       0        1         2
  ------------------ ------- -------- -------- -------- ---------
  $$P(X\  = \ x)$$    $$a$$   $$3a$$   $$5a$$   $$7a$$   $$11a$$

  ---------------------------------------------------------------

$$a = \frac{1}{27}$$

d.  

  --------------------------------------------------------------------------------------
  $$\mathbf{x}$$            10          20           30               40           50
  ------------------ ---------------- ------- ---------------- ----------------- -------
  $$P(X\  = \ x)$$    $$1\  - \ 3a$$   $$a$$   $$1\  - \ 9a$$   $$1\  - \ 10a$$   $$a$$

  --------------------------------------------------------------------------------------

$$a = \frac{1}{10}$$

e.  

  -------------------------------------------------------------------------
  $$\mathbf{x}$$         1          2          3          4          5
  ------------------ ---------- ---------- ---------- ---------- ----------
  $$P(X\  = \ x)$$    $$0.2a$$   $$0.1a$$   $$0.5a$$   $$0.1a$$   $$0.1a$$

  -------------------------------------------------------------------------

$$a = 1$$

f.  $P(x) = a(x + 1)$ for $x \in \left\{ 1,\ 2,\ 3,\ 4 \right\}$

$$a = \frac{1}{14}$$

g.  $(1,a)\ \ \left( 2,\frac{1}{10} \right)\ \ (3,0)\ \ \left( 4,\frac{1}{5} \right)\ \ \left( 5,\frac{3}{10} \right)\ \ \left( 6,\ \frac{2}{5} \right)$

$$a = 0$$

h.  $P(x) =$ $\frac{ax^{2}}{x + 5}$ for
    $x \in \left\{ 1,\ 2,\ 3,\ 4 \right\}$

$$a = \frac{504}{1835}$$

10. These questions require you to find the probabilities using a tree
    diagram, or otherwise.\
    Construct a probability distribution table for the given discrete
    random variable.

    a.  A bag contains six marbles numbered 1, 2, 3, 4, 5, 6. A marble
        is drawn, and it is recorded whether the number is odd or even.
        Without replacing the marble, a second marble is drawn. Draw up
        a probability distribution table for the number $X$ of even
        numbers chosen.

![](media/Random Variables 1_Discrete random variables/media/image18.png){width="2.7461537620297465in"
height="0.8388702974628172in"}

b.  Two students are chosen from a group of four boys and two girls.
    Draw up a probability distribution table for the number $X$ of girls
    chosen.

> ![](media/Random Variables 1_Discrete random variables/media/image19.png){width="2.516609798775153in"
> height="0.8388702974628172in"}

c.  Five tiles marked E, E, E, R, T are turned upside down, and two are
    selected at random one after the other. Draw up a probability
    distribution table for the number $X$ of Es selected.

![](media/Random Variables 1_Discrete random variables/media/image20.png){width="2.987257217847769in"
height="0.823076334208224in"}

11. A company makes washing machines. On average, there are 3 faulty
    machines for every 1000.\
    Two washing machines are selected at random for a quality control
    inspection.

    a.  ![A white square with black numbers AI-generated content may be
        incorrect.](media/Random Variables 1_Discrete random variables/media/image21.png){width="3.4455435258092737in"
        height="0.783979658792651in"}Draw a probability distribution
        table for the number of machines that could be faulty.

    b.  Find the probability that:

        i.  One will be faulty.

$$\frac{5982}{1000\ 000}$$

ii. At least one will be faulty.

$$\frac{5991}{1000\ 000}$$

12. A bag contains 7 red, 6 white, and 8 blue balls. Create a
    probability distribution table for the number of white balls
    selected when drawing two balls at random:

+------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| a.  With replacement                                                                                                   | b.  Without replacement         |
|                                                                                                                        |                                 |
| ![](media/Random Variables 1_Discrete random variables/media/image22.png){width="2.5430555555555556in"                 |                                 |
| height="0.95in"}![](media/Random Variables 1_Discrete random variables/media/image23.png){width="2.5941163604549433in" |                                 |
| height="0.9503554243219597in"}                                                                                         |                                 |
+========================================================================================================================+=================================+

# Expected Value (Mean)

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** Expected value.                                                                                                                                                                                                                                                          |
+==========================================================================================================================================================================================================================================================================================+
| Five dice are rolled.                                                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                          |
| $X$ is the number of dice that lands with a six on the top face.                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                          |
| The probability distribution is shown below.                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                          |
|   ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------                                                                                                |
|                  $$\mathbf{x}$$                            0                       1                       2                      3                      4                    5                                                                                                          |
|   --------------------------------------------- ----------------------- ----------------------- ----------------------- ---------------------- --------------------- --------------------                                                                                                |
|    $$\mathbf{P}\left( \mathbf{X = x} \right)$$   $$\frac{3125}{7776}$$   $$\frac{3125}{7776}$$   $$\frac{1250}{7776}$$   $$\frac{250}{7776}$$   $$\frac{25}{7776}$$   $$\frac{1}{7776}$$                                                                                                 |
|                                                                                                                                                                                                                                                                                          |
|   ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------                                                                                                |
|                                                                                                                                                                                                                                                                                          |
| a.  Imagine you would like to know how many sixes to "expect" when rolling five dice.\                                                                                                                                                                                                   |
|     Would it make sense to say that the expected number of sixes is 2.5?                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                          |
| > ![](media/Random Variables 1_Discrete random variables/media/image24.png){width="2.234783464566929in" height="2.2969444444444442in"}........., because .............................................................................................                                   |
|                                                                                                                                                                                                                                                                                          |
| b.  Consider the graph of the probability distribution,\                                                                                                                                                                                                                                 |
|     if you had to estimate the "expected" number of sixes,\                                                                                                                                                                                                                              |
|     what would you say?                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                          |
| Find the mean $\overline{x}$ of a list of $n$ numbers, by adding them and dividing by $n$.                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                          |
| 0, 1, 2, 3, 4, 5                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                          |
| $$\ \ \ \ \ \ \ \ \ \ \ \overline{x} = \frac{0 + 1 + 2 + 3 + 4 + 5}{6}$$                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                          |
| You can also multiply each number by $\frac{1}{n}$ and add the results.                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                          |
| $$\ \ \ \ \ \ \ \ \ \ \ \overline{x} = \left( 0 \cdot \frac{1}{6} \right) + \left( 1 \cdot \frac{1}{6} \right) + \left( 2 \cdot \frac{1}{6} \right) + \left( 3 \cdot \frac{1}{6} \right) + \left( 4 \cdot \frac{1}{6} \right) + \left( 5 \cdot \frac{1}{6} \right)$$                     |
|                                                                                                                                                                                                                                                                                          |
| When outcomes are **not equally likely** we *weight* each outcome by multiplying by its probability instead of $\frac{1}{n}$. This is the **expected value**.                                                                                                                            |
|                                                                                                                                                                                                                                                                                          |
| $$\ \ \ \ \ \ \ \ \ \ E(X) = \left( 0 \cdot \frac{3125}{7776} \right) + \left( 1 \cdot \frac{3125}{7776} \right) + \left( 2 \cdot \frac{1250}{7776} \right) + \left( 3 \cdot \frac{250}{7776} \right) + \left( 4 \cdot \frac{25}{7776} \right) + \left( 5 \cdot \frac{1}{7776} \right)$$ |
|                                                                                                                                                                                                                                                                                          |
| $\mathbf{\approx}1.32$                                                                                                                                                                                                                                                                   |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Expected Value (Mean)**                                       |
+===================================================================+
| The expected value, $E(X)$, also called the mean or $\mu$, of a   |
| probability distribution measures the centre of the distribution. |
|                                                                   |
| $$E(X) = \mu = \sum_{}^{}{xP(x)}$$                                |
|                                                                   |
| 1.  Create a row for the product of the outcome and its           |
|     probability $xP(x).$                                          |
|                                                                   |
| 2.  $E(X)$ is the sum of all $xP(x)$.                             |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate expected value from a table.                                                           |
+================================================================================================================+
| Calculate the expected value.                                                                                  |
|                                                                                                                |
| +------------------------------------------------------------------------+-----------------------------------+ |
| |   -------------------------------------------------------------------- | $$E(X) = 0.2 + 0.15 + 2.6 + 1$$   | |
| |                 $$\mathbf{x}$$                 2     3      4      5   |                                   | |
| |   ------------------------------------------ ----- ------ ------ ----- | $$\ \ \ \ \ \ \ \ \ \ \  = 3.95$$ | |
| |    $$\mathbf{P}\left( \mathbf{x} \right)$$    0.1   0.05   0.65   0.2  |                                   | |
| |                                                                        |                                   | |
| |    $$\mathbf{xP}\left( \mathbf{x} \right)$$   0.2   0.15   2.6     1   |                                   | |
| |   -------------------------------------------------------------------- |                                   | |
| +========================================================================+===================================+ |
+----------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                                                                       |
+=======================================================================================================+==============================================================================+
| Calculate the expected value.                                                                                                                                                        |
+-------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------+
|   --------------------------------------------------------------------                                |   -------------------------------------------------------------------------- |
|                 $$\mathbf{x}$$                 5      6     7     8                                   |                 $$\mathbf{x}$$                 10    11    12    13     14   |
|   ------------------------------------------ ------ ----- ----- ------                                |   ------------------------------------------ ------ ----- ----- ----- ------ |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$    0.05   0.6   0.2   0.15                                 |    $$\mathbf{P}\left( \mathbf{x} \right)$$    0.05   0.6   0.2   0.1   0.05  |
|                                                                                                       |                                                                              |
|    $$\mathbf{xP}\left( \mathbf{x} \right)$$                                                           |    $$\mathbf{xP}\left( \mathbf{x} \right)$$                                  |
|   --------------------------------------------------------------------                                |   -------------------------------------------------------------------------- |
|                                                                                                       |                                                                              |
| 6.45                                                                                                  | 11.5                                                                         |
+-------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------+
|   --------------------------------------------------------------------------------------------------- |   --------------------------------------------------------                   |
|    $\mathbf{x}$  $$\mathbf{P}\left( \mathbf{x} \right)$$    $$\mathbf{xP}\left( \mathbf{x} \right)$$  |    $\mathbf{x}$   $$\mathbf{P}\left( \mathbf{x} \right)$$                    |
|   -------------- ----------------------------------------- ------------------------------------------ |   -------------- -----------------------------------------                   |
|         5        $$\frac{7}{30}$$                                                                     |         1                           0.1                                      |
|                                                                                                       |                                                                              |
|         6        $$\frac{9}{30}$$                                                                     |         2                           0.3                                      |
|                                                                                                       |                                                                              |
|         7        $$\frac{8}{30}$$                                                                     |         3                           0.2                                      |
|                                                                                                       |                                                                              |
|         8        $$\frac{3}{30}$$                                                                     |         4                           0.1                                      |
|                                                                                                       |                                                                              |
|         9        $$\frac{2}{20}$$                                                                     |         5                           0.3                                      |
|                                                                                                       |   --------------------------------------------------------                   |
|         10       $$\frac{1}{30}$$                                                                     |                                                                              |
|   --------------------------------------------------------------------------------------------------- | 3.2                                                                          |
|                                                                                                       |                                                                              |
| 6.57                                                                                                  |                                                                              |
+-------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------+

[]{#_Toc202480289 .anchor}Foundation

1.  Complete each table to find the expected value $E(X)$ for the
    distribution.

+--------------------------------------------------------------------------------------------------+----------------------------------------------------------------------+
| a.                                                                                               | b.                                                                   |
|                                                                                                  |                                                                      |
|   ------------------------------------------------------------------                             |   ------------------------------------------------------------------ |
|                 $$\mathbf{x}$$                 0     1     2     3                               |                 $$\mathbf{x}$$                 2     4     6     8   |
|   ------------------------------------------ ----- ----- ----- -----                             |   ------------------------------------------ ----- ----- ----- ----- |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$    0.4   0.1   0.2   0.3                              |    $$\mathbf{P}\left( \mathbf{x} \right)$$    0.1   0.4   0.4   0.1  |
|                                                                                                  |                                                                      |
|    $$\mathbf{xP}\left( \mathbf{x} \right)$$    0    0.1   0.4   0.9                              |    $$\mathbf{xP}\left( \mathbf{x} \right)$$   0.2   1.6   2.4   0.8  |
|   ------------------------------------------------------------------                             |   ------------------------------------------------------------------ |
|                                                                                                  |                                                                      |
| $$E(X) = 1.4$$                                                                                   | $$E(X) = 5$$                                                         |
+==================================================================================================+======================================================================+
| c.                                                                                                                                                                      |
|                                                                                                                                                                         |
|   -------------------------------------------------------------------------------------                                                                                 |
|                 $$\mathbf{x}$$                $$- 50$$   $$- 20$$     0     30    100                                                                                   |
|   ------------------------------------------ ---------- ---------- ------- ----- ------                                                                                 |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$      0.1        0.35      0.4    0.1   0.05                                                                                  |
|                                                                                                                                                                         |
|    $$\mathbf{xP}\left( \mathbf{x} \right)$$   $$- 5$$    $$- 7$$    $$0$$    3     5                                                                                    |
|   -------------------------------------------------------------------------------------                                                                                 |
|                                                                                                                                                                         |
| $$E(X) = - 4$$                                                                                                                                                          |
+--------------------------------------------------------------------------------------------------+----------------------------------------------------------------------+
| d.                                                                                               | e.                                                                   |
|                                                                                                  |                                                                      |
| $$\left( 0,\frac{1}{4} \right)\ \ \left( 1,\frac{1}{2} \right)\ \ \left( 2,\frac{1}{4} \right)$$ | $$P(x) = \frac{x + 1}{8},\ x \in \left\{ 0,\ 1,\ 4 \right\}$$        |
|                                                                                                  |                                                                      |
| $$1$$                                                                                            | $$2.75$$                                                             |
+--------------------------------------------------------------------------------------------------+----------------------------------------------------------------------+

2.  For each question, first find $k$, then find the mean of the
    probability distribution.

+------------------------------------------------------------------------------------------------------------+--------------------------------------------------------+
| a.                                                                                                         | b.                                                     |
|                                                                                                            |                                                        |
| $$(1,\ k)\ \ \left( 2,\frac{1}{5} \right)\ \ \left( 3,\frac{3}{10} \right)\ \left( 4,\frac{2}{5} \right)$$ | $$P(x) = k(x + 3)\ for\ x \in \left\{ 0,1,2 \right\}$$ |
|                                                                                                            |                                                        |
| $$k = \frac{1}{10},\ \mu = 3$$                                                                             | $$k = \frac{1}{12},\ \mu = \frac{7}{6}$$               |
+============================================================================================================+========================================================+
| c.                                                                                                                                                                  |
|                                                                                                                                                                     |
|   -----------------------------------------------------------------------------------                                                                               |
|                $$\mathbf{x}$$                 1     2      3      4       5      6                                                                                  |
|   ----------------------------------------- ----- ------ ------ ------ ------- ------                                                                               |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$   0.1   0.02   0.17   0.24   $$k$$   0.32                                                                                |
|                                                                                                                                                                     |
|   -----------------------------------------------------------------------------------                                                                               |
|                                                                                                                                                                     |
| $$k = 0.15,\ \mu = 4.28$$                                                                                                                                           |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Development

3.  Find the expected value by first drawing up a table for each
    probability distribution.

+---------------------------------+---------------------------------+
| a.  The number of heads when    | b.  The sum of the two numbers  |
|     tossing 2 coins             |     rolled on a pair of dice.   |
|                                 |                                 |
| $$1$$                           | $$7$$                           |
+=================================+=================================+
| c.  The number of girls in a    | d.  The number of faulty cars   |
|     3-child family              |     when testing 3 cars, if 1   |
|                                 |     in every 1000 cars is       |
| $$1.5$$                         |     faulty.                     |
|                                 |                                 |
|                                 | $$\frac{3}{1000}$$              |
+---------------------------------+---------------------------------+

4.  $E(X) = 6.35$ for this probability distribution.\
    Find $p$ and $q$ by setting up two equations and solving
    simultaneously.

  -----------------------------------------------------------------------
               $$\mathbf{x}$$                  3      7      8       9
  ----------------------------------------- ------- ------ ------ -------
   $$\mathbf{P}\left( \mathbf{x} \right)$$   $$p$$   0.25   0.35   $$q$$

  -----------------------------------------------------------------------

$$p = 0.3,\ q = 0.1$$

5.  The mean for this probability distribution is $3.75$. Find $a$ and
    $b$.

$$(1,a)\ \left( 2,\frac{1}{8} \right)\ \ (3,\ b)\ \ \left( 4,\frac{1}{4} \right)\ \ \left( 5,\frac{3}{8} \right)\ $$

$$a = \frac{1}{16},\ b = \frac{3}{16}$$

6.  A uniform discrete random variable $X$ has values
    $x \in \left\{ 1,\ 2,\ 3,\ 4 \right\}$.\
    Find the expected value for $X$.

$$2.5$$

7.  A bag contains 8 white and 3 marbles. If 3 marbles are selected at
    random, find the mean number of white marbles if they were selected:

+---------------------------------+---------------------------------+
| a.  With replacement.           | b.  Without replacement.        |
|                                 |                                 |
| $$2.22\ldots$$                  | $$2.22\ldots$$                  |
+=================================+=================================+

8.  Staff at a call centre must make at least one phone sale every hour.
    The probability that Yasmin will make a sale on a phone call is 0.4.
    She makes 4 phone calls in an hour.

    a.  ![](media/Random Variables 1_Discrete random variables/media/image25.png){width="3.0763003062117233in"
        height="0.7613648293963254in"}Draw up a probability distribution
        table for the number of sales in an hour.

    b.  Find the expected value.

1.6

c.  Will Yasmin expect to make at least one phone sale in an hour?

On average, yes.

9.  A coin is tossed three times, and the number of heads is recorded.\
    Construct a table and calculate the expected value.

![](media/Random Variables 1_Discrete random variables/media/image26.png){width="2.5507141294838145in"
height="1.0454538495188102in"}

$$E(X) = 1.5$$

10. Two cards are selected at random without replacement from a standard
    pack, and the number of hearts is recorded. Find the expected value.

![](media/Random Variables 1_Discrete random variables/media/image27.png){width="1.9069433508311462in"
height="1.0454538495188102in"}

$$E(X) = \frac{1}{2}$$

11. In this question we will investigate what happens if we apply a
    transformation to the random variable, such as by doubling all
    values, or increasing each value by 1.\
    Calculate the expected value for all three of these random
    variables.

    a.  

  -----------------------------------------------------------------
               $$\mathbf{x}$$                 1     2     3     4
  ----------------------------------------- ----- ----- ----- -----
   $$\mathbf{P}\left( \mathbf{x} \right)$$   0.1   0.1   0.5   0.3

  -----------------------------------------------------------------

$$E(X) = 3$$

b.  

  -----------------------------------------------------------------
               $$\mathbf{y}$$                 2     4     6     8
  ----------------------------------------- ----- ----- ----- -----
   $$\mathbf{P}\left( \mathbf{y} \right)$$   0.1   0.1   0.5   0.3

  -----------------------------------------------------------------

$$E(Y) = 6$$

c.  

  -----------------------------------------------------------------
               $$\mathbf{z}$$                 2     3     4     5
  ----------------------------------------- ----- ----- ----- -----
   $$\mathbf{P}\left( \mathbf{z} \right)$$   0.1   0.1   0.5   0.3

  -----------------------------------------------------------------

$$E(Z) = 4$$

d.  If $E(X) = \mu,$ what is $E(2X)$?

$$2\mu$$

e.  If $E(X) = \mu$, what is $E(X + 1)$?

$$\mu + 1$$

> This is called the **linearity of expectation**
> $E(aX\  + \ b) = aE(X) + b$.

Use this fact to calculate the following, given that $E(X) = 5$.

+----------------------+----------------------+-----------------------------------+
| f.  $E(3X)$          | g.  $E(X + 5)$       | h.  $E\left( \frac{X}{2} \right)$ |
|                      |                      |                                   |
| $$15$$               | $$10$$               | $$2.5$$                           |
+======================+======================+===================================+
| i.  $E(X - 2)$       | j.  $E(10 - 2X)$     | k.  $E(4X - 2)$                   |
|                      |                      |                                   |
| $$3$$                | $$0$$                | $$18$$                            |
+----------------------+----------------------+-----------------------------------+

# Standard Deviation and Variance

+-------------------------------------------------------------------+
| - **Standard Deviation and Variance**                             |
+===================================================================+
| Standard deviation and variance both measure how spread-out data  |
| values are from the mean using the average distance between each  |
| data point and the centre of the data set.                        |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** standard deviation and variance.                                                                                                                         |
+==========================================================================================================================================================================+
| Consider the two datasets:                                                                                                                                               |
|                                                                                                                                                                          |
| +--------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+ |
| | **Dataset A:**                 | ![](media/Random Variables 1_Discrete random variables/media/image28.png){width="1.8729166666666666in"                              | |
| |                                | height="1.9673611111111111in"}![](media/Random Variables 1_Discrete random variables/media/image29.png){width="1.873134295713036in" | |
| | 1, 2, 3, 4, 5                  | height="1.963396762904637in"}**Dataset B:**                                                                                         | |
| |                                |                                                                                                                                     | |
| |                                | 1, 1, 3, 5, 5                                                                                                                       | |
| +================================+=====================================================================================================================================+ |
|                                                                                                                                                                          |
| a.  Which dataset is more "spread out"?                                                                                                                                  |
|                                                                                                                                                                          |
| Calculate the **standard deviation** by following these steps:                                                                                                           |
|                                                                                                                                                                          |
| 1.  Calculate the mean $\mu$.                                                                                                                                            |
|                                                                                                                                                                          |
| 2.  Find the distance of each data value from the mean $x - \mu$.                                                                                                        |
|                                                                                                                                                                          |
| 3.  Square these distances $(x - \mu)^{2}$                                                                                                                               |
|                                                                                                                                                                          |
| 4.  Find the mean of squared distances. $\frac{\Sigma(x - \mu)^{2}}{n}$\                                                                                                 |
|     This number is the **variance**.                                                                                                                                     |
|                                                                                                                                                                          |
| 5.  Square root the variance to find the standard deviation. $\sqrt{\frac{\Sigma(x - \mu)^{2}}{n}}$                                                                      |
|                                                                                                                                                                          |
| +------------------------------------------------+------------------------------------------------+                                                                      |
| | **Dataset A:**                                 | **Dataset B:**                                 |                                                                      |
| |                                                |                                                |                                                                      |
| | $\mu =$ ............                           | $\mu =$ ............                           |                                                                      |
| |                                                |                                                |                                                                      |
| |   -------------------------------------------- |   -------------------------------------------- |                                                                      |
| |   $$x$$                1    2    3    4    5   |   $$x$$                1    1    3    5    5   |                                                                      |
| |   ------------------- ---- ---- ---- ---- ---- |   ------------------- ---- ---- ---- ---- ---- |                                                                      |
| |   $$(x - \mu)$$                                |   $$(x - \mu)$$                                |                                                                      |
| |                                                |                                                |                                                                      |
| |   $$(x - \mu)^{2}$$                            |   $$(x - \mu)^{2}$$                            |                                                                      |
| |   -------------------------------------------- |   -------------------------------------------- |                                                                      |
| |                                                |                                                |                                                                      |
| | $$\frac{\Sigma(x - \mu)^{2}}{n} =$$            | 1.79                                           |                                                                      |
| |                                                |                                                |                                                                      |
| | $$\sqrt{\frac{\Sigma(x - \mu)^{2}}{n}} =$$     |                                                |                                                                      |
| |                                                |                                                |                                                                      |
| | 1.41                                           |                                                |                                                                      |
| +================================================+================================================+                                                                      |
|                                                                                                                                                                          |
| b.  Which dataset has a greater standard deviation, and is therefore more "spread out"?                                                                                  |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Variance**                                                                                                                                                           |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Variance** measures how spread-out data values are. To calculate it, subtract the mean from each value and square these differences. Then, multiply each squared       |
| difference by its probability and add them all together.                                                                                                                 |
|                                                                                                                                                                          |
| $$Var(X) = \sum_{}^{}(x - \mu)^{2}P(x)$$                                                                                                                                 |
|                                                                                                                                                                          |
| This is the same as the expected value (or mean) of the squared differences.                                                                                             |
|                                                                                                                                                                          |
| $$Var(X) = E\left( (X - \mu)^{2} \right)$$                                                                                                                               |
|                                                                                                                                                                          |
| We can therefore use the simpler formula:                                                                                                                                |
|                                                                                                                                                                          |
| $${Var(X) = E(X^{2}) - \mu^{2}                                                                                                                                           |
| }{Var(X) = \sum_{}^{}\left( x^{2}P(x) \right) - \mu^{2}}$$                                                                                                               |
|                                                                                                                                                                          |
| For the proof, see the textbook.                                                                                                                                         |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Standard Deviation**                                          |
+===================================================================+
| The standard deviation is the square root of the variance.        |
|                                                                   |
| $${\sigma = \sqrt{Var(X)}                                         |
| }{\sigma^{2} = Var(X)}$$                                          |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------+
| - **Calculate** variance and standard deviation using both methods.                                                                           |
+===============================================================================================================================================+
| We will calculate standard deviation using both methods.                                                                                      |
|                                                                                                                                               |
| +---------------------------------------------------------------------+---------------------------------------------------------------------+ |
| | **Method 1:** $\sum_{}^{}(x - \mu)^{2}P(x)$                         | **Method 2:**                                                       | |
| |                                                                     | $Var(X) = \sum_{}^{}\left( x^{2}P(x) \right) - \mu^{2}$             | |
| |   ----------------------------------------------------------------- |                                                                     | |
| |                $$\mathbf{x}$$                 5     6     7     8   |   ----------------------------------------------------------------- | |
| |   ----------------------------------------- ----- ----- ----- ----- |                $$\mathbf{x}$$                 5     6     7     8   | |
| |    $$\mathbf{P}\left( \mathbf{x} \right)$$   0.2   0.2   0.5   0.1  |   ----------------------------------------- ----- ----- ----- ----- | |
| |                                                                     |    $$\mathbf{P}\left( \mathbf{x} \right)$$   0.2   0.2   0.5   0.1  | |
| |   ----------------------------------------------------------------- |                                                                     | |
| |                                                                     |   ----------------------------------------------------------------- | |
| | $\mu = E(X) =$                                                      |                                                                     | |
| |                                                                     | $\mu = E(X) =$                                                      | |
| |   -------------------------------------------                       |                                                                     | |
| |        $$(x - \mu)$$                                                |   -----------------------------------                               | |
| |   ----------------------- ---- ---- ---- ----                       |      $$x^{2}$$                                                      | |
| |      $$(x - \mu)^{2}$$                                              |   --------------- ---- ---- ---- ----                               | |
| |                                                                     |    $$x^{2}P(x)$$                                                    | |
| |    $$(x - \mu)^{2}P(x)$$                                            |                                                                     | |
| |   -------------------------------------------                       |   -----------------------------------                               | |
| |                                                                     |                                                                     | |
| | $$Var(X) = \sum_{}^{}(x - \mu)^{2}P(x)$$                            | $$\sum_{}^{}{x^{2}P(x)} =$$                                         | |
| |                                                                     |                                                                     | |
| | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \  =$$                                  | $$Var(X) = \sum_{}^{}\left( x^{2}P(x) \right) - \mu^{2}$$           | |
| |                                                                     |                                                                     | |
| | $$\sigma = \sqrt{Var(X)} =$$                                        | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \  =$$                                  | |
| |                                                                     |                                                                     | |
| | 0.92                                                                | $$\sigma = \sqrt{Var(X)} =$$                                        | |
| |                                                                     |                                                                     | |
| |                                                                     | 0.92                                                                | |
| +=====================================================================+=====================================================================+ |
+-----------------------------------------------------------------------------------------------------------------------------------------------+
| - **Variance and Standard Deviation**                                                                                                         |
+-----------------------------------------------------------------------------------------------------------------------------------------------+
| 1.  **Calculate** $\mathbf{E}\left( \mathbf{X} \right)$**:** Find the expected value by multiplying each outcome by its probability, then add |
|     all results.                                                                                                                              |
|                                                                                                                                               |
| $$\mu = \sum_{}^{}{xP(x)}$$                                                                                                                   |
|                                                                                                                                               |
| 2.  **Calculate** $\mathbf{E}\left( \mathbf{X}^{\mathbf{2}} \right)$**:** Square each outcome, multiply by its probability, then add all      |
|     results.                                                                                                                                  |
|                                                                                                                                               |
| $$E\left( X^{2} \right) = \sum_{}^{}\left( x^{2}P(x) \right)$$                                                                                |
|                                                                                                                                               |
| 3.  **Find Variance**: Subtract $\mu^{2}$ from the expected value of the squares.\                                                            |
|     $$Var(X) = E\left( X^{2} \right) - \mu^{2}$$                                                                                              |
|                                                                                                                                               |
| 4.  **Find Standard Deviation**: Square root the variance.                                                                                    |
|                                                                                                                                               |
| $$\sigma = \sqrt{Var(X)}$$                                                                                                                    |
+-----------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| - **Example** Calculate variance and standard deviation.                          |
+===================================================================================+
|   -----------------------------------------------------------------               |
|                $$\mathbf{x}$$                 1     2     3     4                 |
|   ----------------------------------------- ----- ----- ----- -----               |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$   0.2   0.3   0.4   0.1                |
|                                                                                   |
|   -----------------------------------------------------------------               |
|                                                                                   |
| 1\. $E(X) = 1(0.2) + 2(0.3) + 3(0.4) + 4(0.1) = 2.4$                              |
|                                                                                   |
| 2\.                                                                               |
| $E\left( X^{2} \right) = 1^{2}(0.2) + 2^{2}(0.3) + 3^{2}(0.4) + 4^{2}(0.1) = 6.6$ |
|                                                                                   |
| 3\. $Var(X) = E\left( X^{2} \right) - \mu^{2}$                                    |
|                                                                                   |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = 6.6 - {2.4}^{2} = 0.84$$             |
|                                                                                   |
| 4\. $\sigma = \sqrt{0.84} \approx 0.92$                                           |
+-----------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                        |
+=======================================================================================================================================+
| Calculate variance and standard deviation from the probability distribution.                                                          |
+---------------------------------------------------------------------------------------------------------------------------------------+
| a.                                                                                                                                    |
|                                                                                                                                       |
|   --------------------------------------------------------------------------                                                          |
|                 $$\mathbf{x}$$                 10    11    12    13     14                                                            |
|   ------------------------------------------ ------ ----- ----- ----- ------                                                          |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$    0.05   0.6   0.2   0.1   0.05                                                           |
|                                                                                                                                       |
|    $$\mathbf{xP}\left( \mathbf{x} \right)$$                                                                                           |
|   --------------------------------------------------------------------------                                                          |
|                                                                                                                                       |
| 0.92                                                                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------------+
| b.                                                                                                                                    |
|                                                                                                                                       |
|   --------------------------------------------------------                                                                            |
|    $\mathbf{x}$   $$\mathbf{P}\left( \mathbf{x} \right)$$                                                                             |
|   -------------- -----------------------------------------                                                                            |
|         1                           0.1                                                                                               |
|                                                                                                                                       |
|         2                           0.3                                                                                               |
|                                                                                                                                       |
|         3                           0.2                                                                                               |
|                                                                                                                                       |
|         4                           0.1                                                                                               |
|                                                                                                                                       |
|         5                           0.3                                                                                               |
|   --------------------------------------------------------                                                                            |
|                                                                                                                                       |
| 1.4                                                                                                                                   |
+---------------------------------------------------------------------------------------------------------------------------------------+
| - **Expected Value, Standard Deviation, Variance on a Calculator.**                                                                   |
+---------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Random Variables 1_Discrete random variables/media/image30.png){width="0.30219706911636046in"                               |
| height="0.2772222222222222in"}**Casio FX 8200AU:**                                                                                    |
|                                                                                                                                       |
| 1\. Press HOME                                                                                                                        |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image31.png){width="0.7403641732283465in"                                |
| height="0.37859580052493436in"}                                                                                                       |
|                                                                                                                                       |
| 2\. Select                                                                                                                            |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image32.png){width="0.29097222222222224in" height="0.29375in"}3. Select  |
| \[1-Variable\]                                                                                                                        |
|                                                                                                                                       |
| 4\. Enter data using the arrow keys and                                                                                               |
|                                                                                                                                       |
| $\mathbf{x}$ is the outcomes, **Freq** is the probabilities/relative frequencies                                                      |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image33.png){width="0.2912095363079615in"                                |
| height="0.29575896762904635in"} If you do not have a frequency column:                                                                |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image34.png){width="0.27569444444444446in"                               |
| height="0.2951388888888889in"} a. Press and select \[Frequency\] \> \[On\]                                                            |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image32.png){width="0.29097222222222224in" height="0.29375in"} b. Press  |
| to return to the table.                                                                                                               |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image35.png){width="0.26997484689413825in"                               |
| height="0.26997484689413825in"}5. After entering your data, press \[1-Var Results\]                                                   |
|                                                                                                                                       |
| 6\. Press for the full list of variables.                                                                                             |
+---------------------------------------------------------------------------------------------------------------------------------------+
| **Casio FX 82AU:**                                                                                                                    |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image36.png){width="0.38333333333333336in"                               |
| height="0.2638888888888889in"}![](media/Random Variables 1_Discrete random variables/media/image37.png){width="0.5618055555555556in"  |
| height="0.2548611111111111in"}![](media/Random Variables 1_Discrete random variables/media/image38.png){width="0.6972222222222222in"  |
| height="0.1840277777777778in"}1.                                                                                                      |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image39.png){width="0.31666666666666665in"                               |
| height="0.2638888888888889in"}2. Enter data using arrow keys and\                                                                     |
| $\mathbf{x}$ is the outcomes, **Freq** is the probabilities/relative frequencies                                                      |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image40.png){width="1.364928915135608in" height="0.5680555555555555in"}  |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image41.png){width="0.7472528433945756in"                                |
| height="0.24583333333333332in"} If you do not have a frequency column:                                                                |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image41.png){width="0.31319444444444444in"                               |
| height="0.24513888888888888in"} a. Enter the setup menu                                                                               |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image42.png){width="0.575in" height="0.16527777777777777in"} b. Scroll   |
| down and select                                                                                                                       |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image43.png){width="1.7104166666666667in"                                |
| height="0.39305555555555555in"} c.                                                                                                    |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image44.png){width="0.31666666666666665in"                               |
| height="0.2746992563429571in"}3. Press to save your data.                                                                             |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image45.png){width="0.7746106736657917in"                                |
| height="0.2653565179352581in"}4. Enter the data menu                                                                                  |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image46.png){width="0.725in"                                             |
| height="0.17569444444444443in"}![](media/Random Variables 1_Discrete random variables/media/image47.png){width="1.609309930008749in"  |
| height="0.21978018372703412in"}                                                                                                       |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image46.png){width="0.725in"                                             |
| height="0.17569444444444443in"}![](media/Random Variables 1_Discrete random variables/media/image48.png){width="1.5652777777777778in" |
| height="0.3951388888888889in"}                                                                                                        |
|                                                                                                                                       |
| ![](media/Random Variables 1_Discrete random variables/media/image46.png){width="1.0659722222222223in"                                |
| height="0.17569444444444443in"}![](media/Random Variables 1_Discrete random variables/media/image49.png){width="1.8506944444444444in" |
| height="0.5465277777777777in"}                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------+
| - **Expected Value, Standard Deviation, Variance on a Calculator.**                               |
+===================================================================================================+
| +-----------------------------------------------+-----------------------------------------------+ |
| | $$\overline{\mathbf{x}}$$                     | Mean, or expected value.                      | |
| +===============================================+===============================================+ |
| | $$\mathbf{\Sigma}\mathbf{x}$$                 | Sum of all sample data.                       | |
| |                                               |                                               | |
| |                                               | This is the same as the mean $E(X)$ for       | |
| |                                               | probability distributions .                   | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | $$\mathbf{\Sigma}\mathbf{x}^{\mathbf{2}}$$    | Sum of squares of sample data.                | |
| |                                               |                                               | |
| |                                               | This is the same as $E(X^{2})$ for            | |
| |                                               | probability distributions.                    | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | $$\mathbf{\sigma}_{\mathbf{x}}^{\mathbf{2}}$$ | Population variance.                          | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | $$\mathbf{\sigma}_{\mathbf{x}}$$              | Population standard deviation.                | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | $$\mathbf{s}_{\mathbf{x}}^{\mathbf{2}}$$      | Sample variance. Not used in the HSC course.  | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | $$\mathbf{s}_{\mathbf{x}}$$                   | Sample standard deviation. Not used in the    | |
| |                                               | HSC course.                                   | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | $$\mathbf{n}$$                                | Total number of data values.\                 | |
| |                                               | For a probability distribution, this is the   | |
| |                                               | sum of probabilities, 1.                      | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | **min(**$\mathbf{x)}$                         | Minimum value.                                | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | $$\mathbf{Q}_{\mathbf{1}}$$                   | Quartile 1.                                   | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | **Med**                                       | Median.                                       | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | $$\mathbf{Q}_{\mathbf{3}}$$                   | Quartile 3.                                   | |
| +-----------------------------------------------+-----------------------------------------------+ |
| | **Max(**$\mathbf{x)}$                         | Maximum value.                                | |
| +-----------------------------------------------+-----------------------------------------------+ |
+---------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Calculate** Summary statistics using a calculator.                                                                                                                        |
+===============================================================================================================================================================================+
| Calculate expected value, variance, standard deviation, and median from the probability distribution using a calculator. Confirm with the values provided.                    |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  **b**                                                                                                                                                                     |
|                                                                                                                                                                               |
| +-----------------------------------------------------------------------------+------------------------------------------------------------+--------------------------------+ |
| |   ------------------------------------------------------------------------- |   -------------------------------------------------------- | $$E(X) = \overline{x} = 3.2$$  | |
| |                $$\mathbf{x}$$                 10    11    12    13     14   |    $\mathbf{x}$   $$\mathbf{P}\left( \mathbf{x} \right)$$  |                                | |
| |   ----------------------------------------- ------ ----- ----- ----- ------ |   -------------- ----------------------------------------- | $$Var(X) = \sigma^{2} = 1.96$$ | |
| |    $$\mathbf{P}\left( \mathbf{x} \right)$$   0.05   0.6   0.2   0.1   0.05  |         1                           0.1                    |                                | |
| |                                                                             |                                                            | $\sigma = 1.4$                 | |
| |   ------------------------------------------------------------------------- |         2                           0.3                    |                                | |
| |                                                                             |                                                            | Med $=$ 3                      | |
| | $E(X) = \overline{x} = 11.5$ $Var(X) = \sigma^{2} = 0.85$                   |         3                           0.2                    |                                | |
| |                                                                             |                                                            |                                | |
| | $\sigma = 0.92$ Med $=$ 11                                                  |         4                           0.1                    |                                | |
| |                                                                             |                                                            |                                | |
| |                                                                             |         5                           0.3                    |                                | |
| |                                                                             |   -------------------------------------------------------- |                                | |
| +=============================================================================+============================================================+================================+ |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                                                               |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Why have two measures of spread?**                            |
+===================================================================+
| Variance squares deviations from the mean so positive and         |
| negative differences do not cancel out. However, this leaves      |
| variance in squared units, such as cm², which is hard to          |
| interpret.                                                        |
|                                                                   |
| Standard deviation is the square root of variance, so it returns  |
| the spread to the original units. For example, a variance of 100  |
| cm² corresponds to a standard deviation of 10 cm.                 |
|                                                                   |
| We still use variance because it is easier to manipulate          |
| mathematically, especially in algebra, calculus, and statistical  |
| modelling. For a transformed variable, variance has the linearity |
| property: $Var(aX + b) = aVar(X) + b$ while standard deviation    |
| does not.                                                         |
+-------------------------------------------------------------------+

Foundation

1.  Consider the random variable $X$ whose probability distribution is
    given in the table.

+-----------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------+
| a.  Use the formula $Var(X) = E(X - \mu)^{2}$ to calculate the variance and standard deviation $\sigma$.        | b.  Use the formula $Var(X) = E\left( X^{2} \right) - \mu^{2}$ to calculate the variance   |
|                                                                                                                 |     and standard deviation $\sigma$.                                                       |
|   ------------------------------------------------------------------------------------------------------------- |                                                                                            |
|                                      $$\mathbf{x}$$                                       1     2     3     4   |   ---------------------------------------------------------------------------------------- |
|   ------------------------------------------------------------------------------------- ----- ----- ----- ----- |                            $$\mathbf{x}$$                            1     2     3     4   |
|                                     $$\mathbf{P(x)}$$                                    0.3   0.5   0.1   0.1  |   ---------------------------------------------------------------- ----- ----- ----- ----- |
|                                                                                                                 |                          $$\mathbf{P(x)}$$                          0.3   0.5   0.1   0.1  |
|                                    $$\mathbf{xP(x)}$$                                                           |                                                                                            |
|                                                                                                                 |                          $$\mathbf{xP(x)}$$                                                |
|                            $$\left( \mathbf{x - \mu} \right)$$                                                  |                                                                                            |
|                                                                                                                 |                     $$\mathbf{x}^{\mathbf{2}}$$                                            |
|                     $$\left( \mathbf{x - \mu} \right)^{\mathbf{2}}$$                                            |                                                                                            |
|                                                                                                                 |    $$\mathbf{x}^{\mathbf{2}}\mathbf{P}\left( \mathbf{x} \right)$$                          |
|    $$\left( \mathbf{x - \mu} \right)^{\mathbf{2}}\mathbf{P}\left( \mathbf{x} \right)$$                          |   ---------------------------------------------------------------------------------------- |
|   ------------------------------------------------------------------------------------------------------------- |                                                                                            |
|                                                                                                                 | $$\mu = \Sigma xP(x) =$$                                                                   |
| $$\mu = \Sigma xP(x) =$$                                                                                        |                                                                                            |
|                                                                                                                 | $$Var(X) = \Sigma x^{2}P(x) - \mu^{2} =$$                                                  |
| $$Var(X) = \Sigma(x - \mu)^{2}P(x) =$$                                                                          |                                                                                            |
|                                                                                                                 | $$\mu = 2,\ Var(X) = 0.8,\ \sigma \approx 0.89$$                                           |
| $$\sigma = \sqrt{Var(X)} =$$                                                                                    |                                                                                            |
|                                                                                                                 |                                                                                            |
| $$\mu = 2,\ Var(X) = 0.8,\ \sigma \approx 0.89$$                                                                |                                                                                            |
+=================================================================================================================+============================================================================================+

2.  Calculate the expected value, then $Var(X)$ and $\sigma$ using
    $Var(X) = E\left( X^{2} \right) - \mu^{2}$.

    a.  

  -------------------------------------------------
    $$\mathbf{x}$$      0     1     2     3     4
  ------------------- ----- ----- ----- ----- -----
   $$\mathbf{P(x)}$$   0.2   0.2   0.2   0.2   0.2

  -------------------------------------------------

$E(X) = 2,\ Var(X) = 2$

b.  

  ------------------------------------------------
    $$\mathbf{x}$$     0     1     2     3     4
  ------------------- ---- ----- ----- ----- -----
   $$\mathbf{P(x)}$$   0    0.1   0.2   0.3   0.4

  ------------------------------------------------

$$E(X) = 3,\ Var(X) = 1\ $$

c.  

  --------------------------------------------------------
   $\mathbf{x}$   $$\mathbf{P}\left( \mathbf{x} \right)$$
  -------------- -----------------------------------------
     $$- 2$$                        0.3

     $$- 1$$                        0.1

        0                           0.2

        1                           0.1

        2                           0.3
  --------------------------------------------------------

$$E(X) = 0,\ Var(X) = 2.6$$

Development

3.  Calculate the expected value, variance, and standard deviation using
    $Var(X) = E\left( X^{2} \right) - \mu^{2}.$

+----------------------------------------------------+----------------------------------------------------+
| a.                                                 | b.                                                 |
|                                                    |                                                    |
|   ----------------------------------------------   |   ----------------------------------------------   |
|     $$\mathbf{y}$$     0     1    2     3    4     |     $$\mathbf{z}$$      0    1    2    3     4     |
|   ------------------- ---- ----- ---- ----- ----   |   ------------------- ----- ---- ---- ---- -----   |
|    $$\mathbf{P(y)}$$   0    0.5   0    0.5   0     |    $$\mathbf{P(z)}$$   0.5   0    0    0    0.5    |
|                                                    |                                                    |
|   ----------------------------------------------   |   ----------------------------------------------   |
|                                                    |                                                    |
| $$E(Y) = 3,\ Var(Y) = 1\ ,\ \sigma = 1$$           | $$E(Z) = 2,\ Var(Z) = 4,\ \sigma = 2\ $$           |
+====================================================+====================================================+
| c.                                                 | d.                                                 |
|                                                    |                                                    |
|   ------------------------------------------------ |   ------------------------------------------------ |
|     $$\mathbf{v}$$      0     1     2     3    4   |     $$\mathbf{w}$$     0     1     2     3     4   |
|   ------------------- ----- ----- ----- ----- ---- |   ------------------- ---- ----- ----- ----- ----- |
|    $$\mathbf{P(v)}$$   0.3   0.5   0.1   0.1   0   |    $$\mathbf{P(w)}$$   0    0.1   0.1   0.5   0.3  |
|                                                    |                                                    |
|   ------------------------------------------------ |   ------------------------------------------------ |
|                                                    |                                                    |
| $$E(V) = 1,\ Var(V) = 0.8,\ \sigma = 0.89\ $$      | $$E(W) = 3,\ Var(W) = 0.8,\ \sigma = 0.89$$        |
+----------------------------------------------------+----------------------------------------------------+
| e.  Which random variable, $Y,\ Z,\ V,\$ or $W$ has the greatest spread?                                |
|                                                                                                         |
| $$Z$$                                                                                                   |
+---------------------------------------------------------------------------------------------------------+
| f.  With reference to the probability distribution, explain why the standard deviation for $V$ and $W$  |
|     are equal.                                                                                          |
|                                                                                                         |
| The probability distributions are reflections of each other.\                                           |
| A reflection does not change the shape of the distribution, so the measure of spread stays the same.    |
+---------------------------------------------------------------------------------------------------------+

4.  Using your calculator, find the expected value, variance, and
    standard deviation.

+----------------------------------------------------------+-------------------------------------------------------------------+
| a.                                                       | b.                                                                |
|                                                          |                                                                   |
|   ------------------------------------------------------ | $$P(x) = \frac{x + 1}{9}\ for\ x \in \left\{ 0,\ 2,\ 4 \right\}$$ |
|     $$\mathbf{x}$$      1      4      7      9      10   |                                                                   |
|   ------------------- ------ ------ ------ ------ ------ | $$E(X) = 2.89$$                                                   |
|    $$\mathbf{P(x)}$$   0.09   0.18   0.26   0.32   0.15  |                                                                   |
|                                                          | $$Var(X) = 1.87$$                                                 |
|   ------------------------------------------------------ |                                                                   |
|                                                          | $$\sigma = 1.37$$                                                 |
| $$E(X) = 7.01$$                                          |                                                                   |
|                                                          |                                                                   |
| $$Var(X) = 7.49$$                                        |                                                                   |
|                                                          |                                                                   |
| $$\sigma = 2.74$$                                        |                                                                   |
+==========================================================+===================================================================+
| c.                                                                                                                           |
|                                                                                                                              |
|   -----------------------------------------------------------------------------------------------------                      |
|     $$\mathbf{x}$$            1                 2                   3                   4           5                        |
|   ------------------- ----------------- ------------------ -------------------- ------------------ ----                      |
|    $$\mathbf{P(x)}$$   $$\frac{2}{5}$$   $$\frac{1}{10}$$   $$\frac{3}{20}\ $$   $$\frac{1}{20}$$                            |
|                                                                                                                              |
|   -----------------------------------------------------------------------------------------------------                      |
|                                                                                                                              |
| $$E(X) = 2.75,\ Var(X) = 2,89,\ \sigma = 1.7$$                                                                               |
+------------------------------------------------------------------------------------------------------------------------------+

5.  John and Liam keep track of the number of baskets they score in
    their basketball games.

From a large dataset, they have estimated their probabilities of scoring
in any one game.\
Let the random variables $J$ and $L$ be the number of baskets scored by
John and Liam.

a.  Calculate the expected value and variance for J and L using
    $Var(X) = E\left( X^{2} \right) - \mu^{2}$.

+-------------------------------------------------------+----------------------------------------------------+
|   --------------------------------------------------- |   ------------------------------------------------ |
|     $$\mathbf{j}$$      0      1     2     3      4   |     $$\mathbf{l}$$      0     1     2     3    4   |
|   ------------------- ------ ----- ----- ------ ----- |   ------------------- ----- ----- ----- ----- ---- |
|    $$\mathbf{P(j)}$$   0.35   0.2   0.1   0.25   0.1  |    $$\mathbf{P(l)}$$   0.2   0.3   0.4   0.1   0   |
|                                                       |                                                    |
|   --------------------------------------------------- |   ------------------------------------------------ |
|                                                       |                                                    |
| $$E(J) = 1.55,\ Var(J) = 2.05$$                       | $$E(L) = 1.4,\ Var(L) = 0.84$$                     |
+=======================================================+====================================================+

b.  With reference to the expected value, comment on who would score
    more baskets throughout the season.

John, as he has a higher expected value.

c.  With reference to the variance, comment on who is the more
    consistent player.

Liam, as he has the lower standard deviation.

6.  The random variable $X$ with values
    $X = \left\{ 1,\ 2,\ 3,\ 4 \right\}$ has a probability function
    defined by

$P(X = x) = kx$ for $x = 1,\ 2,\ 3,\ 4$

Find the expected value and standard deviation.

The distribution is:

$$x\ |\ 1\ |\ \ \ 2\ \ |\ \ 3\ \ |\ \ \ 4\ \ $$

$$P(x)|\ k\ |\ 2k\ |\ 3k\ |\ 4k\ $$

$$k = \frac{1}{10},\ E(X) = 3,\ \sigma = 1$$

7.  The probability distribution below has $E(X) = 3.32$. Find the
    standard deviation.

  ------------------------------------------------------
    $$\mathbf{x}$$       1       2      3      4     5
  ------------------- ------- ------- ------ ----- -----
   $$\mathbf{P(x)}$$   $$a$$   $$b$$   0.17   0.2   0.3

  ------------------------------------------------------

$$a = 0.15,\ b = 0.18,\ Var(X) = 2.08,\ \sigma = 1.44$$

8.  The probability of selecting a black jellybean from a packet is 4%.\
    If 2 jellybeans are selected at random, find the expected number of
    black jellybeans, standard deviation, and variance.

$$E(X) = 0.08,\ Var(X) = 0.28,\ \sigma = 0.08$$

9.  A set of cards contains 5 blue and 7 white cards. 3 are drawn at
    random. Let $X$ be the number of blue cards drawn. Find the mean and
    variance of $X$ if the cards are drawn:

+---------------------------------+---------------------------------+
| a.  With replacement            | b.  Without replacement         |
|                                 |                                 |
| $$E(X) = 1.25,\ Var(X) = 0.73$$ | $$E(X) = 1.25,\ Var(X) = 0.60$$ |
+=================================+=================================+

# Mixed Applications

+-------------------------------------------------------------------+
| - **Expected Value in Games of Chance**                           |
+===================================================================+
| We use expected value to make decisions in games of chance.       |
|                                                                   |
| To analyse these games, we define the random variable as points   |
| (such as in board games) or gain or loss of money (in gambling).  |
|                                                                   |
| For gambling,                                                     |
|                                                                   |
| - A positive expected value means you will win money in the long  |
|   run.                                                            |
|                                                                   |
| - A negative expected value means you lose money in the long run. |
|                                                                   |
| - A **zero** expected value means it is a **fair** game.          |
|                                                                   |
| 1\. Define the random variable as points or gain/net gain of      |
| money.                                                            |
|                                                                   |
| 2\. Calculate the probability of each outcome, you may need to    |
| draw a tree diagram.                                              |
|                                                                   |
| 3\. Calculate expected value.                                     |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate expected value in games of chance.                                                      |
+=================================================================================================================+
| A card game involves selecting a card from a standard deck of 52 cards.                                         |
|                                                                                                                 |
| If you draw the numbers 2 to 10, you score 2 points.                                                            |
|                                                                                                                 |
| If you draw a picture card (Jack, Queen, King) you score 5 points.                                              |
|                                                                                                                 |
| If you draw an ace, you score 10 points.                                                                        |
|                                                                                                                 |
| a.  Find the expected number of points for a card draw.                                                         |
|                                                                                                                 |
| 1\. Let $X =$ number of points from one card draw.                                                              |
|                                                                                                                 |
| 2\.                                                                                                             |
|                                                                                                                 |
|   ----------------------------------------------------------------------------------------------------          |
|                $$\mathbf{x}$$                        2                   5                  10                  |
|   ----------------------------------------- ------------------- ------------------- ------------------          |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$   $$\frac{32}{52}$$   $$\frac{12}{52}$$   $$\frac{4}{52}$$           |
|                                                                                                                 |
|   ----------------------------------------------------------------------------------------------------          |
|                                                                                                                 |
| 3\.                                                                                                             |
|                                                                                                                 |
| $$E(X) = 2\left( \frac{32}{52} \right) + 5\left( \frac{12}{52} \right) + 10\left( \frac{4}{52} \right) = 3.15$$ |
|                                                                                                                 |
| b.  If the game requires you to pay 3 points to draw a card, should you do it?                                  |
|                                                                                                                 |
| Yes, in the long run, you expect to get 3.15 points back for the 3 points you spend.                            |
|                                                                                                                 |
| c.  If the game requires you to pay 4 points to draw a card, should you do it?                                  |
|                                                                                                                 |
| No, in the long run, you would lose points as you only expect to get 3.15 points back.                          |
+-----------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Practice**                                                    |
+===================================================================+
| A game of chance involves paying \$10 to draw a card from a       |
| shuffled deck.                                                    |
|                                                                   |
| If you draw the ace of spades, you win \$100.                     |
|                                                                   |
| If you draw a court card, you win \$20.                           |
|                                                                   |
| Otherwise, you win nothing.                                       |
|                                                                   |
| a.  Find the expected value for playing this game.                |
|                                                                   |
| b.  Should you pay to play this game?                             |
|                                                                   |
| 1\. Let $X =$                                                     |
|                                                                   |
| 2\.                                                               |
|                                                                   |
|   -----------------------------------------------------------     |
|                $$\mathbf{x}$$                                     |
|   ----------------------------------------- ----- ----- -----     |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$                        |
|                                                                   |
|   -----------------------------------------------------------     |
|                                                                   |
| 3\.                                                               |
|                                                                   |
| $$E(X) =$$                                                        |
|                                                                   |
| Expected return from \$10 is \$6.54, or --\$3.46                  |
|                                                                   |
| No you should not play. On average you expect to lose money       |
+-------------------------------------------------------------------+
| A game of chance involves flipping three coins.                   |
|                                                                   |
| If you flip three heads, you win \$10.                            |
|                                                                   |
| If you flip two heads, you win \$5.                               |
|                                                                   |
| If you flip one head, you get nothing.                            |
|                                                                   |
| If you flip zero heads, you lose \$5.                             |
|                                                                   |
| a.  Find the expected value for playing a round of this game.     |
|                                                                   |
| b.  If you wanted to make this game "fair," how much should you   |
|     charge someone to play one round of this game?                |
|                                                                   |
| Expected value is \$2.50, for a fair game, you'd have to charge   |
| \$2.50 to play                                                    |
+-------------------------------------------------------------------+

Foundation

1.  In a game, two coins are flipped. If there are two heads, then you
    win \$10.\
    For exactly one head, you win \$5. If there are two tails, you lose
    \$20

    a.  Complete the table for $X$, the dollar return for this game.

  -------------------------------------------------------------------------
    $$\mathbf{x}$$    $$- 20$$          5                 10
  ------------------- ----------------- ----------------- -----------------
   $$\mathbf{P(x)}$$  $$\frac{1}{4}$$   $$\frac{1}{2}$$   $$\frac{1}{4}$$

  -------------------------------------------------------------------------

b.  What is the expected return?

0

c.  Is this game fair?

Yes

2.  A casino runs a game involving the throw of a die.\
    Players are charged 40c if the die shows 1, 2, or 3.\
    They are charged nothing for 4.\
    They receive 30c for a 5\
    They receive 60c for a 6.

> Let the random variable $X$ be the payout to the player.

a.  Complete the probability distribution table and find the expected
    value.

  ----------------------------------------------------------
   $$\mathbf{x}$$  $$\mathbf{P}\left( \mathbf{x} \right)$$
  ---------------- -----------------------------------------
      $$- 40$$     $$\frac{1}{2}$$

         0         $$\frac{1}{6}$$

         30        $$\frac{1}{6}$$

         60        $$\frac{1}{6}$$
  ----------------------------------------------------------

$$E(X) = - 5$$

b.  What does this expected value represent?

A player is expected to lose 5c on average each time they play this
game.

c.  How much profit would the casino expect to make in 100 games?

$5 \times 100 = 500c$ or \$5

3.  Matt tries his luck on a dating app. The table shows the probability
    distribution of $X$, the number of matches. How many matches does he
    expect to receive per day?

  ---------------------------------------------------
    $$\mathbf{x}$$      0     1      2      3     4
  ------------------- ----- ------ ------ ------ ----
   $$\mathbf{P(x)}$$   0.9   0.05   0.03   0.02   0

  ---------------------------------------------------

0.17 ☹

4.  A dice game involves rolling 2 dice. The game pays:

\$1 if one of the numbers is a 6.

\$3 for double 6.

\$2 for any other double.

a.  ![A number and a fraction AI-generated content may be
    incorrect.](media/Random Variables 1_Discrete random variables/media/image50.png){width="1.96875in"
    height="0.8215748031496063in"}Draw the probability distribution
    table for $Y:$ game payout.

b.  Find the probability of winning:

+---------------------+---------------------+---------------------+
| i.  \$3             | ii. At least \$2    | iii. Less than \$3  |
|                     |                     |                     |
| $$\frac{1}{36}$$    | $$\frac{1}{6}$$     | $$\frac{35}{36}$$   |
+=====================+=====================+=====================+

5.  Simon plays a game where he selects a card at random from 100 cards
    numbered 1 to 100.\
    He wins \$1 for selecting a number less than 20,\
    \$2 for a number greater than 90,\
    \$3 for any number between 61 and 69 inclusive,

\$5 for any number from 41 to 50 inclusive.

a.  ![A number in a square AI-generated content may be
    incorrect.](media/Random Variables 1_Discrete random variables/media/image51.png){width="2.815254811898513in"
    height="0.8103871391076115in"}Draw a probability distribution table
    for $X$: the prize values.

b.  Find the probability of:

    i.  Winning more than \$2

$$\frac{19}{100}$$

ii. Winning less than \$5

$$\frac{9}{10}$$

Development

6.  In a game, 2 cards are drawn from a standard deck of 52. A player
    wins 5 points if one of the cards is an ace and 10 points for double
    aces.\
    Let the random variable $Y$ be the number of points won.\
    Create a probability distribution table for $Y$ and find the mean,
    variance, and standard deviation.

![](media/Random Variables 1_Discrete random variables/media/image52.png){width="2.563390201224847in"
height="0.8130347769028872in"}

$$E(Y) = 0.77,\ Var(Y) = 3.48,\ \sigma = 1.87$$

7.  In a game, 2 dice are rolled and the difference between the two
    numbers is calculated.

A player wins \$1 if the difference is 3, \$2 if the difference is 4,
and \$3 if the difference is 5.

a.  Draw a probability distribution table.

b.  Find the expected value.

c.  If it costs \$1 to roll the dice, how much would the player be
    expected to win or lose per roll, on average?

![](media/Random Variables 1_Discrete random variables/media/image53.png){width="2.439494750656168in"
height="0.7914227909011373in"}

$E(X) = 56$ cents

The player expects to lose 44 cents per roll.

8.  A game uses a spinner with the numbers 1 to 12 in equal sections.\
    A player wins \$3 for spinning a number greater than 10,\
    wins \$2 for a number less than 4, and\
    loses \$1 for any other number.\
    How much money would a player be expected to win or lose?

42 cents

9.  Albert plays a game where the probability of winning is 0.1 and the
    probability of losing is 0.9.\
    If he wins, the prize is \$100. It costs \$15 to play the game.

    a.  What is Albert\'s expected return?

    b.  In the long run, would it be profitable for Albert to repeatedly
        play the game?\
        Justify your answer.

    c.  How much would the entry fee have to be, at most, for it to be
        worthwhile for Albert to enter the game?

$$E(X) = - \$ 5$$

No, his expected return is negative.

Reduce entry cost by \$5, so \$10

10. **2019 VCE Band 4**

![](media/Random Variables 1_Discrete random variables/media/image54.png){width="4.089583333333334in"
height="0.7819444444444444in"} Consider the probability distribution for
the discrete random variable $X$ shown in the table below.

![](media/Random Variables 1_Discrete random variables/media/image55.png){width="0.8276476377952756in"
height="1.9478258967629047in"} What is the value of $E(X)$?

$$b = \frac{2}{13}$$

$\therefore$ A

11. **2009 VCE Band 4**

![](media/Random Variables 1_Discrete random variables/media/image56.png){width="3.0in"
height="0.7076388888888889in"}A discrete random variable $X$ has the
probability distribution as shown.

![](media/Random Variables 1_Discrete random variables/media/image57.png){width="0.6647364391951006in"
height="1.4695647419072615in"}What is the median of $X$?

Find the cumulative probability

Find the value where the cumulative probability first reaches or exceeds
0.5

The median is 1

B

12. **2017 VCE Band 4**

> ![](media/Random Variables 1_Discrete random variables/media/image58.png){width="2.859722222222222in"
> height="0.7076388888888889in"}The random variable $X$ has the
> following probability distribution where $0 < p <$ $\frac{1}{3}$

The variance of $X$ is:

![](media/Random Variables 1_Discrete random variables/media/image59.png){width="1.3741294838145233in"
height="1.4694444444444446in"}

$$E\left( X^{2} \right) - \left( E(X) \right)^{2}$$

$$D$$

13. **2008 VCE Band 4**

> Jane drives to work each morning and passes through three
> intersections with traffic lights. The number $X$ of traffic lights
> that are red when Jane is driving to work is a random variable with
> probability distribution given by

![](media/Random Variables 1_Discrete random variables/media/image60.png){width="2.904347112860892in"
height="0.708231627296588in"}

a.  What is the mode of $X$?

3

b.  Jane drives to work on two consecutive days. What is the probability
    that the number of traffic lights that are red is the same on both
    days?

$$P(0,0) + P(1,\ 1) + P(2,\ 2) + P(3,\ 3) = 0.3$$

14. Consider the discrete probability distribution of $X$ below.

  -----------------------------------------------------------
      $$\mathbf{x}$$        0     1      2        3      4
  ----------------------- ----- ----- -------- ------- ------
   $$\mathbf{P(X = x)}$$   0.1   0.4   $$2k$$   $$k$$   0.05

  -----------------------------------------------------------

Find:

+----------------------+--------------------------+----------------------+
| a.  $P(X = 2)$       | b.  $P(X = 0)$           | c.  $P(X \geq 2)$    |
|                      |                          |                      |
| $$0.3$$              | $$0.1$$                  | $$0.5$$              |
+======================+==========================+======================+
| d.  $P(X > 2)$       | e.  $P(1 \leq X \leq 4)$ | f.  $P(X\ is\ even)$ |
|                      |                          |                      |
| $$0.2$$              | $$0.9$$                  | $$0.45$$             |
+----------------------+--------------------------+----------------------+

Mastery

15. A person selects a marble from a bag containing 10 red marbles, 4
    blue marbles and 1 white marble. The person wins \$1 for the red
    marble, \$5 for the blue marble and \$20 for the white marble. It
    costs \$4 to enter the game.

    a.  Calculate the expected return from playing the game and explain
        why this shows that the game is unfair.

    b.  Suppose the prize of drawing the red, blue and white marbles
        respectively are $k$, $2k$ and $3k$. What is the value of $k$
        such that the entry cost of \$4 is considered fair?

a\) Expected return is $-$\$0.67, so the game is not fair as the
expected value is not 0.

$$b)\ Expected\ return\  = \ \left( \frac{10}{15} \right)k\  + \ \left( \frac{4}{15} \right)(2k) + \ \left( \frac{1}{15} \right)(3k) = \ 4$$

$$\frac{10k\  + \ 8k\  + \ 3k}{15} = \ 4$$

$$\frac{21k}{15} = \ 4$$

$$k\  = \frac{60}{21} \approx \ \$ 2.86$$

16. **2010 VCE Band 4**

![](media/Random Variables 1_Discrete random variables/media/image61.png){width="3.356521216097988in"
height="0.7296784776902887in"}Find the value of $p$ for this discrete
random variable $X$.

$$p^{2} + p^{2} + \frac{p}{4} + \frac{4p + 1}{8} = 1$$

$$16p^{2} + 6p - 7 = 0$$

$$(2p - 1)(8p + 7) = 0$$

$$p = \frac{1}{2},\  - \frac{7}{8}$$

But $p > 0$

$$\therefore p = \frac{1}{2}$$

17. **2012 VCE Band 5**

> On any given day, the number $X$ of telephone calls that Daniel
> receives is a random variable with probability distribution given by

![](media/Random Variables 1_Discrete random variables/media/image62.png){width="2.565932852143482in"
height="0.6245680227471566in"}

a.  Find the mean of $X$.

1.5

b.  What is the probability that Daniel receives only one phone call on
    each of the three consecutive days?

$P(1,\ 1,\ 1) = {0.2}^{3} =$ 0.008

c.  Daniel receives telephone calls on both Monday and Tuesday.

> What is the probability that Daniel receives a total of four calls
> over these two days?

$$P\left( x = 4 \middle| X \geq 1\ both\ days \right)$$

$$= \frac{P(1,3) + P(2,2) + P(3,1)}{P(X \geq 1\ both\ days)}$$

$$= \frac{(0.2)(0.1) + (0.5)(0.5) + (0.1)(0.2)}{(0.8)(0.8)}$$

$$= \frac{29}{64}$$

18. Prove that this can never represent a probability distribution.

  -------------------------------------------------------------
    $$\mathbf{x}$$         1            2         3        4
  ------------------- ------------ ----------- -------- -------
   $$\mathbf{P(x)}$$   $$2p + 1$$   $$1 - p$$   $$3p$$   $$p$$

  -------------------------------------------------------------

Suppose that this is a probability distribution

then $\Sigma P(x) = 5p + 2 = 1$

Therefore, the value of $p$ would be negative, meaning $P(3)$ and $P(4)$
would be negative,

which is not possible as probabilities cannot be negative.

19. Find the values of $p$ and $q$ such that the following probability
    distribution is uniform.

  ------------------------------------------------------------------
    $$\mathbf{x}$$           0               1               2
  ------------------- --------------- ---------------- -------------
   $$\mathbf{P(x)}$$   $$p + q + 2$$   $$p - 2q + 5$$   $$2p - 3q$$

  ------------------------------------------------------------------

$$p = 6,\ q = 1$$

20. **2013 VCE Band 5**

> ![](media/Random Variables 1_Discrete random variables/media/image63.png){width="3.749998906386702in"
> height="0.720411198600175in"}The probability distribution of a
> discrete random variable, $X$, is given by the table below.

a.  Show that $p =$ $\frac{2}{3}$ or $p = 1$.

$$0.2 + 0.6p^{2} + 0.1 + 1 - p + 0.1 = 1$$

$$0.6p^{2} - p + 0.4 = 0$$

$$6p^{2} - 10p + 4 = 0$$

$$3p^{2} - 5p + 2 = 0$$

$$(p - 1)(3p - 2) = 0$$

$$\therefore p = 1\ or\ \frac{2}{3}$$

b.  Let $p =$ $\frac{2}{3}$, calculate $E(X)$ in exact form.

$$\frac{28}{15}$$

c.  Find $P\left( X \geq E(X) \right)$ for $p =$ $\frac{2}{3}$.

$$P\left( X \geq \frac{28}{15} \right) = P(2) + P(3) + P(4)$$

Using $p =$ $\frac{2}{3}$

$$= 0.1 + \frac{1}{3} + 0.1$$

$$= \frac{8}{15}$$

21. Casino patrons play a coin game where they toss until they get
    heads. The jackpot starts at \$2 and doubles with each tail. Players
    win the entire jackpot when they toss heads.

Payout examples:

- First toss heads = \$2

- TH = \$4

- TTH = \$8

What minimum amount should the casino charge to make a profit?

The expected value is:

$$E(X) = 2\left( \frac{1}{2} \right) + 4\left( \frac{1}{4} \right) + 8\left( \frac{1}{8} \right) + 16\left( \frac{1}{16} \right)\ldots$$

$$= 1 + 1 + 1 + 1\ldots$$

The expected value for this game is infinity, so there is no amount the
casino can charge for this game to make a profit.

Although patrons would also be unwilling to pay a large price for such
low probabilities for the later stages of the game.
