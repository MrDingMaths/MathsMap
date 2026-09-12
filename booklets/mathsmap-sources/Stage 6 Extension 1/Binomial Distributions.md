  -------------------------------------------------------------------
  Mathematics Extension 1 Year 12
  -------------------------------------------------------------------
  **Binomial Distributions**

  -------------------------------------------------------------------

+-------------------------+-----------------------------------+-------------------------+
| **Book 1**              | Bernoulli distributions\          | Version: 260711         |
|                         | Binomial distributions\           |                         |
|                         | Normal approximation              | Feedback:\              |
|                         |                                   | https://MrDingMaths.com |
+=========================+===================================+=========================+
| **Contents**                                                                          |
|                                                                                       |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                          |
|                                                                                       |
| [Learning Intention [**Error! Bookmark not                                            |
| defined.**](#_Toc202480289)](#_Toc202480289)                                          |
+---------------------------------------------------------------------------------------+

# Syllabus Content

**ME1-12-06** solves problems involving binomial distributions, sampling
distribution of the mean and the central limit theorem

**Bernoulli distributions**

- Define a Bernoulli random variable as a model for two-outcome
  situations, referred to as success and failure

- Model a Bernoulli trial using a random variable, $X$, where the
  probability of success, $X = 1$, is $p$ and the probability of
  failure, $X = 0$, is $q = 1 - p$

- Define a Bernoulli distribution as the discrete probability
  distribution of a Bernoulli random variable

- Establish and use the formulae $\text{E}(X) = \mu = p$ to find the
  mean, and $Var(X) = p(1 - p)$ to find the variance of the Bernoulli
  distribution with parameter $p$

- Identify contexts suitable to be modelled by Bernoulli random
  variables

- Solve practical problems involving Bernoulli random variables

**Binomial distributions**

- Define a binomial random variable, $X$, as the number of 'successes'
  in $n$ independent and identically distributed Bernoulli trials, with
  the same probability of success $p$ in each trial, where $n$ is a
  fixed finite number

- Identify contexts suitable to be modelled using binomial distributions

- Define a binomial experiment as a fixed number of Bernoulli trials

- Use the notation $X\sim Bin(n,p)$ to represent a binomial random
  variable, $X$, where $n$ is the number of trials and probability of
  success is $p$

- Recognise the significance of$\ ^{n}C_{r}$ as the number of ways in
  which an outcome with $r$ successes can occur in $n$ trials

- Use the formula $P(X = r) = \ ^{n}C_{r}p^{r}{(1 - p)}^{n - r}$ to find
  the probability of $r$ successes in a binomial experiment involving
  $n$ trials

- Calculate the expected frequencies of the various possible outcomes
  from a binomial experiment, where the expected frequency of an outcome
  happening $r$ times in $n$ trials is $n \times P(X = r)$

- Use the formulae $\text{E}(X) = \mu = np$ to find the mean, and
  $Var(X) = np(1 - p)$ to find the variance when $X\sim Bin(n,p)$

- Solve practical problems involving binomial distributions and binomial
  probabilities with and without online computational applications,
  excluding the normal approximation to the binomial distribution

**Sampling distribution of the mean and the central limit theorem**

- Define a statistical population as the entire group of people or
  objects about which information is sought

- Define a sample as a selection of people or objects drawn from a
  population

- Recognise that a statistic taken from a sample will be a good
  approximation if the sample is random and the sample size is large
  enough, typically $n \geq 30$

- Recognise that, in general, the distribution of a population and a
  statistic, such as its mean, are unknown

- Recognise that it is likely that the distribution of a random sample
  will resemble the distribution of the population when the sample size,
  $n$, is large enough, typically $n \geq 30$

- Define the sample mean for a sample $X_{1},X_{2},\ldots,X_{n}\$taken
  from a population as $\overline{X} = \frac{1}{n}\sum_{i = 1}^{n}X_{i}$

- Recognise that the sample means obtained from repeated sampling may be
  different, even if all the samples are of the same size

- Define, for a given sample size $n$, the sampling distribution of the
  mean to be the distribution of the sample means of all samples of size
  $n$

- Recognise that sample mean, $\overline{X}$, is a random variable that
  estimates the population mean, $\mu$, when the size of the sample is
  large enough and consider its usefulness in making predictions in a
  variety of contexts including politics, finance, agriculture and
  biology

- State the central limit theorem as: for a population with mean $\mu$
  and variance $\sigma^{2}$, provided the sample size $n$ is large
  enough ($n \geq 30$), the sampling distribution is approximately
  normal with mean $\mu\$and variance $\frac{\sigma^{2}}{n}$; that is,
  $\overline{X}$ is
  approximately$\ N\left( \mu,\frac{\sigma^{2}}{n} \right)$

- Recognise the significance of the central limit theorem for
  populations that are not necessarily normally distributed; that,
  irrespective of the population distribution, for a sufficiently large
  sample size, the sampling distribution of the mean is approximately
  normal

- Use the formulas $E\left( \overline{X} \right) = \mu$ and
  $\text{Var}\left( \overline{X} \right) = \frac{\sigma^{2}}{n}$ as the
  mean and the variance of the sampling distribution of the mean for
  samples of size $n$ drawn from a population with mean $\mu$ and
  variance $\sigma^{2}$

- Examine the effect of the sample size on the variance of sample means
  with digital tools

- Apply the central limit theorem to estimate the probability that the
  sample mean lies within given bounds

# Counting Arrangements of Two Elements

+-----------------------------------------------------------------------------------------------+
| - **Review**                                                                                  |
+===============================================================================================+
| - Recall permutations                                                                         |
|                                                                                               |
| +------------------------------+------------------------------+                               |
| | a.  How many ways to arrange | b.  How many ways to arrange |                               |
| |     the letters:\            |     the letters:\            |                               |
| |     \                        |     \                        |                               |
| |     TOAST                    |     COOGEE                   |                               |
| +==============================+==============================+                               |
| | c.  There are 4 blue and 8   | d.  There are                |                               |
| |     red cups on a shelf. How |                              |                               |
| |     many ways are there to   |                              |                               |
| |     arrange them?            |                              |                               |
| +------------------------------+------------------------------+                               |
|                                                                                               |
| - Recall combinations                                                                         |
|                                                                                               |
| +------------------------------+------------------------------------------------------------+ |
| | a.  How many ways are there  | b.  Write the combinations formula:                        | |
| |     to choose 4 people out   |                                                            | |
| |     of 10 to form a          | $\ \ \ \ \ \ \ \ \ \ \ ^{n}C_{r} = \left( \begin{array}{r} | |
| |     committee?               | n \\                                                       | |
| |                              | r                                                          | |
| |                              | \end{array} \right) =$                                     | |
| +==============================+============================================================+ |
| | c.  There are 10 chairs in a | d.  Explain, using a combinatorial argument, why           | |
| |     row.\                    |     $\left( \begin{array}{r}                               | |
| |     How many ways are there  |     12 \\                                                  | |
| |     to choose 4 to paint     |     5                                                      | |
| |     red?                     |     \end{array} \right) = \left( \begin{array}{r}          | |
| |                              |     12 \\                                                  | |
| |                              |     7                                                      | |
| |                              |     \end{array} \right)$                                   | |
| +------------------------------+------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Investigation** List arrangements of two elements             |
+===================================================================+
| Imagine you have two colours of marbles.                          |
|                                                                   |
| Let the two colours be green (G) and red (R).                     |
|                                                                   |
| Let $n$ represent number of marbles. Let $r$ be the number of     |
| green marbles (G).                                                |
|                                                                   |
| List all possible marble arrangements for $n = 4,$ $r = 2\$(there |
| are 6)                                                            |
|                                                                   |
| GGRR GRGR ............ ............ ............ ............     |
|                                                                   |
| List all possible marble arrangements for $n = 5,\ r = 2$ (there  |
| are 10)                                                           |
|                                                                   |
| List all possible marble arrangements for $n = 5,\ r = 3$ (there  |
| are 10)                                                           |
|                                                                   |
| Now imagine you need to count the number of arrangements for      |
| $n = 10,\ r = 4.$                                                 |
|                                                                   |
| One possible arrangement is                                       |
| .......................................                           |
|                                                                   |
| To count all possible arrangements, we can use **permutations     |
| with identical elements**:                                        |
|                                                                   |
| We can write this much more concisely using the **combinations    |
| formula**:                                                        |
|                                                                   |
| **So, arranging 4 green and 6 red marbles in a row is             |
| mathematically identical to choosing 4 objects out of 10** 😮     |
|                                                                   |
| Imagine you have 10 numbered slots in a row. Focus entirely on    |
| placing the 4 green marbles.                                      |
|                                                                   |
| To place them, you must choose **4 slots out of the available     |
| 10**.                                                             |
|                                                                   |
| Because the green marbles are identical, their order does not     |
| matter; swapping two green marbles changes nothing.               |
|                                                                   |
| Once those 4 slots are chosen, the 6 identical red marbles are    |
| forced into the remaining 6 slots. There is only 1 way to do      |
| this.                                                             |
|                                                                   |
| Therefore, counting the arrangements is exactly equal to choosing |
| the slots.                                                        |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------+
| - **Arrangements of Successes and Failures**                                                           |
+========================================================================================================+
| Imagine you have $n$ trials of an experiment.                                                          |
|                                                                                                        |
| The number of arrangements of $r$ successes and $(n - r)$ failures is:                                 |
|                                                                                                        |
| $$^{n}C_{r}\mspace{6mu} = \mspace{6mu}\binom{n}{r}\mspace{6mu} = \mspace{6mu}\frac{n!}{r!\,(n - r)!}$$ |
|                                                                                                        |
| We can use this formula if we have **binary** (two) outcomes with no restrictions.                     |
|                                                                                                        |
| - Successes and failures                                                                               |
|                                                                                                        |
| - Yes or no                                                                                            |
|                                                                                                        |
| - Green and red                                                                                        |
|                                                                                                        |
| - Heads and tails, etc.                                                                                |
+--------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Interpret** whether $^{n}C_{r}$ is appropriate                    |
+===================================+===================================+
| Identify whether you can use $^{n}C_{r}$ to count how many ways to:   |
+-----------------------------------+-----------------------------------+
| a.  arrange 5 green marbles and 7 | b.  arrange 5 green marbles, 7    |
|     red marbles in a line.        |     red marbles, and an orange    |
|                                   |     marble in a line.             |
+-----------------------------------+-----------------------------------+
| c.  arrange the letters Y Y N N N | d.  choose 3 students out of 9    |
|                                   |     for a committee               |
+-----------------------------------+-----------------------------------+
| e.  5 unpainted marbles in a      | f.  Number of strings of length 5 |
|     line.\                        |     made from 1s and 0s           |
|     How many ways to paint 3 red. |     containing exactly two 1s.    |
+-----------------------------------+-----------------------------------+
| g.  choose 3 students out of 9    | h.  how many ways there are to    |
|     for a committee, then         |     get 2 heads and 3 tails in    |
|     assigning them roles of       |     five coin flips               |
|     president, treasurer,         |                                   |
|     secretary                     |                                   |
+-----------------------------------+-----------------------------------+

Foundation

1.  a.  List every arrangement of 3 successes and 1 failure in 4 trials.

SSSF

SSFS

SFSS

FSSS

b.  How many are there?

4

c.  Is this the same as $\left( \begin{array}{r}
    4 \\
    1
    \end{array} \right)$?

Yes

2.  Without calculating either, state which of $^{8}C_{2}$ and
    $^{8}C_{6}$ is larger. Justify your answer.

They are equal by the identity $\left( \begin{array}{r}
n \\
r
\end{array} \right) = \left( \begin{array}{r}
n \\
n - r
\end{array} \right)$

3.  In how many orders can 2 successes and 4 failures occur in 6 trials?

15

4.  In how many orders can 4 successes and 3 failures occur in 7 trials?

35

5.  How many ways are there to get exactly 6 heads in 9 coin flips, with
    the rest being tails?

84

6.  In how many orders can 3 successes and 5 failures occur in 8 trials,
    if the **first** trial is a failure?

$$\left( \begin{array}{r}
7 \\
3
\end{array} \right) = 35$$

7.  In how many orders can 3 successes and 5 failures occur in 8 trials,
    if **no two successes are adjacent**?

Write the 5 failures first: $\_\, F\,\_\, F\,\_\, F\,\_\, F\,\_\, F\,\_$
.

This creates 6 gaps. Choosing 3 different gaps for the 3 successes
guarantees no two are adjacent. $^{6}C_{3} = 20$.

# Bernoulli Random Variables

+-------------------------------------------------------------------------------------------------+
| - **Review**                                                                                    |
+=================================================================================================+
| - Recall complementary probabilities                                                            |
|                                                                                                 |
| +------------------------------+-------------------------------------+                          |
| | a.  $P(A) = 0.4$             | b.  A spinner lands on red with     |                          |
| |                              |     probability 0.6.                |                          |
| | What is $P(not\ A)$?         |                                     |                          |
| |                              | What is $P(not\ red)?$              |                          |
| +==============================+=====================================+                          |
| | c.  A random variable only   | d.  If $P(a) = 0.3$, what is        |                          |
| |     takes on values 0 and 1. |     $P\left( \overline{a} \right)$? |                          |
| |     $P(X = 1) = 0.2$. What   |                                     |                          |
| |     is $P(X = 0)$?           |                                     |                          |
| +------------------------------+-------------------------------------+                          |
|                                                                                                 |
| - Complete probability tables and find $E(X),\ \ E\left( X^{2} \right)$                         |
|                                                                                                 |
| +----------------------------------------------+----------------------------------------------+ |
| | a.                                           | b.                                           | |
| |                                              |                                              | |
| |   ------------------------------             |   ------------------------------             | |
| |   $$x$$                0     1               |   $$x$$                1     2               | |
| |   ------------------ ----- -----             |   ------------------ ----- -----             | |
| |   $$P(X\  = \ x)$$          0.4              |   $$P(X\  = \ x)$$    0.6                    | |
| |                                              |                                              | |
| |   ------------------------------             |   ------------------------------             | |
| |                                              |                                              | |
| | $E(X) = \Sigma xP(x) =$                      | $E(X) = \Sigma xP(x) =$                      | |
| | ..............................               | ..............................               | |
| |                                              |                                              | |
| | $E\left( X^{2} \right) = \Sigma x^{2}P(x) =$ | $E\left( X^{2} \right) = \Sigma x^{2}P(x) =$ | |
| | ...........................                  | ...........................                  | |
| +==============================================+==============================================+ |
+-------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Bernoulli Trial**                                             |
+===================================================================+
| A situation is a Bernoulli trial when there are **exactly 2**     |
| possible outcomes.                                                |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
| - **Identify** Bernoulli trials                                               |
+:=================:+:=================:+:=================:+:=================:+
| ✖                 | ✔                 | ✔                 | ✖                 |
|                   |                   |                   |                   |
| A die is rolled.  | A die is rolled.  | A biased coin     | A biased coin is  |
| The number        | It is recorded    | with P(head) =    | tossed 20 times.  |
| showing is        | whether the       | 0.99 is tossed.   | The number of     |
| recorded.         | number showing is | It is recorded    | heads is          |
|                   | 6.                | whether it shows  | recorded.         |
|                   |                   | a head.           |                   |
+-------------------+-------------------+-------------------+-------------------+
| Decide whether these are Bernoulli trials.                                    |
+---------------------------------------+---------------------------------------+
| a.  A patient is given a new drug. It | b.  One card is drawn from a deck. It |
|     is recorded whether their blood   |     is recorded whether the card is a |
|     pressure falls.                   |     heart.                            |
+---------------------------------------+---------------------------------------+
| c.  A single traffic light is         | d.  A single traffic light is         |
|     observed once. It is recorded     |     observed once. Its colour, red,   |
|     whether the light is green.       |     yellow or green, is recorded.     |
+---------------------------------------+---------------------------------------+
| e.  One student is chosen at random   | f.  One seed is planted. It is        |
|     from a school. Their year group   |     recorded whether the seed         |
|     is recorded.                      |     germinates.                       |
+---------------------------------------+---------------------------------------+
| g.  A basketballer takes 10 free      | h.  Surveyors ask voters for whether  |
|     throws.\                          |     they voted 'yes' in a referendum. |
|     The number scored is recorded.    |                                       |
+---------------------------------------+---------------------------------------+

+-------------------------------------------------------------------+
| - **Bernoulli Trial**                                             |
+===================================================================+
| A situation is a Bernoulli trial when there are **exactly 2**     |
| possible outcomes.                                                |
|                                                                   |
| We model the two outcomes as either a 'success' or a 'failure'    |
| and give them values 0 and 1.                                     |
|                                                                   |
| Let $X = \left\{ 0,1 \right\}$ be a Bernoulli trial.              |
|                                                                   |
| $P(X = 0)$: probability of failure.                               |
|                                                                   |
| $P(X = 1)$: probability of success.                               |
|                                                                   |
| 'Success' and 'failure' are defined by the question.              |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| - **Interpret** Bernoulli trials                                                  |
+===============================================+===================================+
| State in words what is a success is and then write $P(X = 1)$.                    |
+-----------------------------------------------+-----------------------------------+
| $X$ represents whether a light is green.      | $X$ represents whether a light is |
|                                               | green.                            |
| $X = 1$ if the light is green.                |                                   |
|                                               | $X = 1$ if the light is not       |
| A light is green with probability 0.6.        | green.                            |
|                                               |                                   |
| Success: the light is green.                  | A light is green with probability |
|                                               | 0.6.                              |
| $$P(X = 1) = 0.6$$                            |                                   |
|                                               | Success: the light is not green.  |
|                                               |                                   |
|                                               | $$P(X = 1) = 0.4$$                |
+-----------------------------------------------+-----------------------------------+
| a.  A component is faulty in 15% of cases.    | b.  A seed germinates with        |
|     Let $X\  = \ 1$ if the component is       |     probability 0.85. $X\  = \ 1$ |
|     faulty                                    |     if the seed germinates.       |
|                                               |                                   |
| Success:                                      |                                   |
| ............................................. |                                   |
|                                               |                                   |
| $P(X = 1) =$ ............                     |                                   |
+-----------------------------------------------+-----------------------------------+
| c.  A seed germinates with probability 0.85.  | d.  A machine part passes         |
|     $X\  = \ 1$ if the seed fails to          |     inspection 92% of the time.   |
|     germinate.                                |     $X\  = \ 1$ if the part fails |
|                                               |     inspection.                   |
+-----------------------------------------------+-----------------------------------+
| e.  A biased die shows a six with probability | f.  A biased die shows a six with |
|     $\frac{1}{5}$. $X\  = \ 1$ if the die     |     probability                   |
|     shows a six.                              |     $\frac{1}{5}.\ X\  = \ 1$ if  |
|                                               |     the die does not show a six.  |
+-----------------------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Bernoulli Random Variables**                                  |
+===================================================================+
| A situation is a Bernoulli trial when there are **exactly 2**     |
| possible outcomes.                                                |
|                                                                   |
| We model the two outcomes as either a 'success' or a 'failure'    |
| and give them values 0 and 1.                                     |
|                                                                   |
| Let the probability of success be $p$, the probability of failure |
| $1 - p$.                                                          |
|                                                                   |
| $$P(X = x) = \left\{ \begin{array}{r}                             |
| p\ \ \ \ \ \ \ \ \ \ \ \ x = 1 \\                                 |
| 1 - p\ \ \ \ x = 0                                                |
| \end{array} \right.\ $$                                           |
|                                                                   |
| or using a table:                                                 |
|                                                                   |
|   ------------------------------                                  |
|     $$x$$    0           1                                        |
|   ---------- ----------- -------                                  |
|    $$P(x)$$  $$1 - p$$   $$p$$                                    |
|                                                                   |
|   ------------------------------                                  |
|                                                                   |
| A Bernoulli random variable is defined only by probability of     |
| success $p$.                                                      |
|                                                                   |
| We can write                                                      |
|                                                                   |
| $$X\sim Bernoulli(p)$$                                            |
|                                                                   |
| to say '$X$ is a Bernoulli random variable with probability of    |
| success $p$.'                                                     |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
| - **Interpret** Bernoulli random variables                                                                            |
+==================================================+====================================================================+
| Let $X$ be rolling a 6 on a die.                 | Success $X = 1$ is: ..............................                 |
|                                                  |                                                                    |
| $$P(X = x) = \left\{ \begin{array}{r}            | Failure $X = 0$ is: ..............................                 |
| \frac{1}{6}\ \ \ \ \ \ x = 1 \\                  |                                                                    |
| \frac{5}{6}\ \ \ \ \ \ x = 0                     | The probability of success $P(X = 1)$ is .........                 |
| \end{array} \right.\ $$                          |                                                                    |
|                                                  | The probability of failure $P(X = 0)$ is .........                 |
|   ---------------------------------------------- |                                                                    |
|     $$x$$            0                 1         | $X\sim Bernoulli\left( \frac{1}{6} \right)$ means '$X$ is a random |
|   ---------- ----------------- ----------------- | variable with only ......... outcomes, s.................. or      |
|    $$P(x)$$   $$\frac{5}{6}$$   $$\frac{1}{6}$$  | f................... The probability of success is ............'   |
|                                                  |                                                                    |
|   ---------------------------------------------- |                                                                    |
|                                                  |                                                                    |
| $$X\sim Bernoulli\left( \frac{1}{6} \right)$$    |                                                                    |
+--------------------------------------------------+--------------------------------------------------------------------+
| Write the piecewise function, table of values, and $X\sim$ notation for these Bernoulli scenarios                     |
+--------------------------------------------------+--------------------------------------------------------------------+
| a.  Let $X$ be flipping a heads on a fair coin.  | b.  Let $X$ be choosing a vowel from letters of the alphabet.      |
+--------------------------------------------------+--------------------------------------------------------------------+
| - **Expected Value and Variance of Bernoulli Distributions**                                                          |
+-----------------------------------------------------------------------------------------------------------------------+
| A Bernoulli distribution shows the probability of 'success' and 'failure.'                                            |
|                                                                                                                       |
| Calculate expected value using the same formulas as discrete random variables.                                        |
+--------------------------------------------------+--------------------------------------------------------------------+
| **Expected Value**                               | **Variance & Standard Deviation**                                  |
|                                                  |                                                                    |
| $$E(X) = \Sigma xP(x)$$                          | $${Var(X) = \left\lbrack \Sigma x^{2}P(x) \right\rbrack - E(X)^{2} |
|                                                  | }{\sigma(X) = \sqrt{Var(X)}}$$                                     |
+--------------------------------------------------+--------------------------------------------------------------------+

+---------------------------------------------------------------------------------------+
| - **Example** Calculate expected value and variance for a Bernoulli distribution      |
+===========================================+===========================================+
| A biased coin shows heads with probability 0.3.                                       |
|                                                                                       |
| Let $X\  = \ 1$ if the coin shows heads.                                              |
|                                                                                       |
| Construct the Bernoulli distribution table and find $E(X)$, $Var(X)$, and             |
| $\sigma(X)$.                                                                          |
+-------------------------------------------+-------------------------------------------+
|   ----------------------                  | $${Var(X) = \Sigma x^{2}P(x) - E(X)^{2}   |
|     $$x$$      0     1                    | }{= 0^{2}(0.7) + 1^{2}(0.3) - (0.3)^{2}   |
|   ---------- ----- -----                  | }{= 0.21}$$                               |
|    $$P(x)$$   0.7   0.3                   |                                           |
|                                           | $$\sigma(X) = \sqrt{0.21} \approx 0.458$$ |
|   ----------------------                  |                                           |
|                                           |                                           |
| $$E(X) = \Sigma xP(x) = 0(0.7) + 1(0.3)$$ |                                           |
|                                           |                                           |
| $= 0.3$                                   |                                           |
+-------------------------------------------+-------------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| a.  A biased coin shows heads with probability 0.8.\              |
|     Let $X\  = \ 1$ if the coin shows heads. Find $E(X),$         |
|     $Var(X)$ and $\sigma(X)$.                                     |
|                                                                   |
| $$E(X) = \ 0.8\ $$                                                |
|                                                                   |
| $$Var(X) = \ 0.16$$                                               |
|                                                                   |
| $$\sigma(X)\  = \ 0.4$$                                           |
+-------------------------------------------------------------------+
| b.  Consider the general case for a Bernoulli distribution where  |
|     $P(X = 1) = p.$                                               |
|                                                                   |
| Find $E(X)$, $Var(X)$, and $\sigma(X)$.                           |
|                                                                   |
| $$E(X) = \ p\ $$                                                  |
|                                                                   |
| $$Var(X) = \ p(1 - p)$$                                           |
|                                                                   |
| $$\sigma(X)\  = \sqrt{p(1 - p)}$$                                 |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Expected Value and Variance of Bernoulli Distributions**          |
+:=================================:+:=================================:+
| **Expected Value**                | **Variance & Standard Deviation** |
|                                   |                                   |
| $$E(X) = \Sigma xP(x) = p$$       | $${Var(X) = p(1 - p)              |
|                                   | }{\sigma(X) = \sqrt{p(1 - p)}}$$  |
+-----------------------------------+-----------------------------------+

# Binomial Random Variables

+-------------------------------------------------------------------+
| - **Binomial Random Variables**                                   |
+===================================================================+
| A binomial random variable counts the number of 'successes' in    |
| repeated Bernoulli trials.                                        |
|                                                                   |
| A binomial random variable requires these conditions:             |
|                                                                   |
| 1.  The number of trials $n$ is finite and fixed.                 |
|                                                                   |
| 2.  Each trial has exactly two outcomes: success or failure.      |
|                                                                   |
| 3.  The trials are independent.                                   |
|                                                                   |
| 4.  Probability $p$ is the same in every trial.                   |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------+
| - **Identify** whether number of trials is fixed                                     |
+:=======================:+=========================:+================================:+
| ✖                       | A student guesses answers to a multiple-choice quiz        |
|                         | **until she gets one correct**, and records how many       |
|                         | questions she attempted.                                   |
+-------------------------+------------------------------------------------------------+
| ✔                       | A student guesses answers to **all 20** questions, and     |
|                         | records how many she gets correct.                         |
+-------------------------+------------------------------------------------------------+
| ✔                       | A die is rolled **60 times**; the number of sixes is       |
|                         | recorded.                                                  |
+-------------------------+------------------------------------------------------------+
| ✔                       | **Eight** patients are given a new drug; the number who    |
|                         | recover is recorded.                                       |
+-------------------------+------------------------------------------------------------+
| ✖                       | A die is rolled **until the first six** appears; the       |
|                         | number of rolls is recorded.                               |
+-------------------------+------------------------------------------------------------+
| Determine whether the number of trials is fixed.                                     |
+----------------------------------------------------+---------------------------------+
| a.  A coin is tossed 30 times.                     | b.  A coin is tossed until a    |
|                                                    |     head appears.               |
+----------------------------------------------------+---------------------------------+
| c.  A coin is tossed until a head appears, or 10   | d.  Twelve free throws are      |
|     times, whichever comes first.                  |     taken.                      |
+----------------------------------------------------+---------------------------------+
| e.  Free throws are taken until three are scored.  | f.  Every one of the 25 globes  |
|                                                    |     in a box is tested.         |
+----------------------------------------------------+---------------------------------+

+--------------------------------------------------------------------------------------+
| - **Identify** whether each trial only has two outcomes                              |
+:=======================:+=========================:+================================:+
| ✖                       | A die is rolled 20 times and **the number shown** on each  |
|                         | roll is recorded.                                          |
+-------------------------+------------------------------------------------------------+
| ✔                       | A die is rolled 20 times and **whether each roll shows a   |
|                         | six** is recorded.                                         |
+-------------------------+------------------------------------------------------------+
| ✔                       | A 20-question quiz has four options per question. For each |
|                         | question we record **whether the answer is correct**.      |
+-------------------------+------------------------------------------------------------+
| ✔                       | Fifteen voters each name one of six parties. For each      |
|                         | voter we record **whether they name Party A**.             |
+-------------------------+------------------------------------------------------------+
| ✖                       | Ten chess games are played. For each game we record **win, |
|                         | draw or loss**.                                            |
+-------------------------+------------------------------------------------------------+
| Determine whether each trial has two outcomes or not.                                |
+----------------------------------------------------+---------------------------------+
| a.  Record whether each of 20 globes is faulty.    | b.  Record the lifetime in      |
|                                                    |     hours of each of 20 globes. |
+----------------------------------------------------+---------------------------------+
| c.  Record whether each of 20 globes lasts more    | d.  Record the suit of each of  |
|     than 1000 hours.                               |     10 cards drawn.             |
+----------------------------------------------------+---------------------------------+
| e.  Record whether each of 10 cards drawn is a     | f.  Record whether each of 10   |
|     heart.                                         |     patients recovers fully,    |
|                                                    |     partially, or not at all.   |
+----------------------------------------------------+---------------------------------+

+--------------------------------------------------------------------------------------+
| - **Identify** whether each trial is independent                                     |
+:=======================:+=========================:+================================:+
| ✖                       | Six people **share a house**. We record whether each of    |
|                         | the six catches the flu this winter.                       |
+-------------------------+------------------------------------------------------------+
| ✔                       | Six people **living in six different suburbs** are chosen. |
|                         | We record whether each catches the flu this winter.        |
+-------------------------+------------------------------------------------------------+
| ✔                       | A card is drawn from a shuffled deck, its suit noted, and  |
|                         | it is **replaced**. This is repeated 10 times. The number  |
|                         | of hearts is recorded.                                     |
+-------------------------+------------------------------------------------------------+
| ✔                       | Twenty adults are chosen at random from a population of    |
|                         | five million and asked whether they support a proposal.    |
|                         |                                                            |
|                         | - We treat this as independent as removing a few people    |
|                         |   from 5 million barely changes the probability.           |
+-------------------------+------------------------------------------------------------+
| ✖                       | Twenty adults are chosen at random, but they are surveyed  |
|                         | **in pairs, and each pair discusses the question before    |
|                         | answering**.                                               |
+-------------------------+------------------------------------------------------------+
| Determine whether each trial is independent (or approximately independent).          |
+----------------------------------------------------+---------------------------------+
| a.  Ten rolls of a die.                            | b.  Ten cards drawn with        |
|                                                    |     replacement.                |
+----------------------------------------------------+---------------------------------+
| c.  Ten cards drawn without replacement.           | d.  Whether each of 30 randomly |
|                                                    |     chosen Australians owns a   |
|                                                    |     car.                        |
+----------------------------------------------------+---------------------------------+
| e.  Whether each of 30 students in one class       | f.  Whether each of 5 children  |
|     passes a test they sat while allowed to talk   |     in one family has blue      |
|     to each other.                                 |     eyes.                       |
+----------------------------------------------------+---------------------------------+
| - **Identify** whether $p$ is the same in every trial                                |
+-------------------------+------------------------------------------------------------+
| ✖                       | An athlete takes 30 shots at goal. She **tires as she      |
|                         | goes**, so each shot is a little less likely to score than |
|                         | the one before.                                            |
+-------------------------+------------------------------------------------------------+
| ✔                       | An athlete takes 30 shots at goal, **resting fully between |
|                         | shots**. Each shot has probability 0.4 of scoring.         |
+-------------------------+------------------------------------------------------------+
| ✔                       | A die is rolled 20 times; the number of sixes is recorded. |
+-------------------------+------------------------------------------------------------+
| ✔                       | A 20-question quiz has four options per question and is    |
|                         | guessed throughout.                                        |
+-------------------------+------------------------------------------------------------+
| ✖                       | A 20-question quiz is guessed throughout. **The first 10   |
|                         | questions have four options; the last 10 have five         |
|                         | options.**                                                 |
+-------------------------+------------------------------------------------------------+
| Determine whether each trial has the same probability                                |
+----------------------------------------------------+---------------------------------+
| a.  Twenty tosses of the same fair coin.           | b.  Twenty tosses, ten with a   |
|                                                    |     fair coin and ten with a    |
|                                                    |     biased coin.                |
+----------------------------------------------------+---------------------------------+
| c.  Twenty cards drawn with replacement; record    | d.  Twenty cards drawn without  |
|     whether each is a heart.                       |     replacement; record whether |
|                                                    |     each is a heart.            |
+----------------------------------------------------+---------------------------------+
| e.  A surgeon performs 40 operations over her      | f.  A machine stamps 500 parts; |
|     career; she improves with experience.          |     it is serviced hourly and   |
|                                                    |     the fault rate stays at 2%. |
+----------------------------------------------------+---------------------------------+

+-----------------------------------------------------------------------+
| - **Identify** whether a scenario can be modelled as a binomial       |
|   random variable                                                     |
+===================================+===================================+
| A fair coin is tossed 40 times.\  | A die is rolled until the first   |
| The number of heads is recorded.  | six appears.\                     |
|                                   | The number of rolls is recorded.  |
| Yes.                              |                                   |
|                                   | No.                               |
|                                   |                                   |
|                                   | 'until the first six' means $n$   |
|                                   | not fixed.                        |
+-----------------------------------+-----------------------------------+
| Identify whether the context can be modelled as a binomial random     |
| variable.                                                             |
+-----------------------------------+-----------------------------------+
| c.  3% of globes made by a        | d.  A die is rolled 20 times and  |
|     machine are faulty.           |     the number shown on each roll |
|     Twenty-five globes are chosen |     is recorded.                  |
|     at random from 40 000. The    |                                   |
|     number of faulty globes is    |                                   |
|     recorded.                     |                                   |
+-----------------------------------+-----------------------------------+
| e.  A card is drawn from a        | f.  An athlete takes 30 shots at  |
|     shuffled deck, its suit       |     goal. She tires as the        |
|     noted, and it is replaced.    |     session goes on, so each shot |
|     This is repeated 12 times.    |     is less likely to score than  |
|     The number of hearts is       |     the last. The number of goals |
|     recorded.                     |     is recorded.                  |
+-----------------------------------+-----------------------------------+
| g.  Twenty people are chosen at   | h.  A student guesses every       |
|     random from a city of two     |     answer on a 15-question quiz. |
|     million and asked whether     |     Each question has five        |
|     they cycle to work. The       |     options, one correct. The     |
|     number who say yes is         |     number of correct answers is  |
|     recorded.                     |     recorded.                     |
+-----------------------------------+-----------------------------------+
| i.  Free throws are taken until   | j.  A student guesses every       |
|     three have been scored. The   |     answer on a 20-question quiz. |
|     number of throws is recorded. |     The first 10 questions have   |
|                                   |     four options; the last 10     |
|                                   |     have five. The number of      |
|                                   |     correct answers is recorded.  |
+-----------------------------------+-----------------------------------+
| k.  Six housemates are recorded   | l.  Five cards are drawn one at a |
|     as catching influenza or not  |     time, **without               |
|     this winter. The number who   |     replacement**, from a         |
|     catch it is recorded.         |     shuffled deck. The number of  |
|                                   |     hearts is recorded.           |
|                                   |                                   |
|                                   | Yes: a, c, e, f                   |
+-----------------------------------+-----------------------------------+
| - **Binomial Random Variables**                                       |
+-----------------------------------------------------------------------+
| A binomial random variable is defined by:                             |
|                                                                       |
| number of trials                                                      |
|                                                                       |
| $$X\sim Bin(n,p)$$                                                    |
|                                                                       |
| probability of 'success' for each trial                               |
+-----------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** Write $X\sim Bin(n,p)$ for a binomial distribution  |
+===================================================================+
| A 20-question multiple-choice quiz is set. Each question has      |
| **four** options, one of which is correct. A student guesses the  |
| answer to every question at random, and her answer to one         |
| question has no effect on her answer to any other. The number of  |
| questions she answers correctly is recorded.                      |
|                                                                   |
| $$X \sim \text{Bin}(20,0.25)$$                                    |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| a.  Same quiz, same student as above, but each question has       |
|     **five** options.                                             |
|                                                                   |
| $$X \sim \text{Bin}(20,0.2)$$                                     |
+-------------------------------------------------------------------+
| b.  Same five-option quiz, but there are only **12 questions**.   |
|                                                                   |
| $$X \sim \text{Bin}(12,0.2)$$                                     |
+-------------------------------------------------------------------+
| c.  Same five-option quiz of 20 questions but the student's score |
|     is recorded as **the number she gets wrong**.                 |
|                                                                   |
| $$X \sim \text{Bin}(20,0.8)$$                                     |
+-------------------------------------------------------------------+
| d.  A machine fills 500 mL bottles. 4% of bottles are             |
|     underfilled. An inspector takes 30 bottles at random from a   |
|     pallet of 6000 and records how many are underfilled           |
|                                                                   |
| $$X \sim \text{Bin}(30,0.04)$$                                    |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  A random variable $X$ is binomial if it satisfies these       |
|     conditions:\                                                  |
|     a. the number of trials $n$ is ............\                  |
|     b. each trial has exactly ......... outcomes\                 |
|     c. the trials are ..................\                         |
|     d. the probability of success $p$ is .................. in    |
|     every trial                                                   |
|                                                                   |
| 2.  $X$ counts the number of .................., we write         |
|     $X\sim Bin(n,p)$                                              |
+-------------------------------------------------------------------+

# Probability of $\mathbf{r\ }$successes

+---------------------------------------------------------------------+
| - **Review**                                                        |
+=====================================================================+
| - Calculate multistage probability of independent events\           |
|   A basketball player scores a three-point show with probability    |
|   0.3.\                                                             |
|   Each shot is independent.                                         |
|                                                                     |
| +------------------------------+------------------------------+     |
| | a.  She takes two shots.     | b.  She takes two shots.     |     |
| |     Find the probability she |     Find the probability she |     |
| |     scores both.             |     scores the first and     |     |
| |                              |     misses the second.       |     |
| +==============================+==============================+     |
| | c.  She takes three shots.   | d.  She takes four shots.    |     |
| |     Find the probability she |     Write, as a product of   |     |
| |     misses all three.        |     powers, the probability  |     |
| |                              |     she scores the first two |     |
| |                              |     and misses the last two. |     |
| +------------------------------+------------------------------+     |
|                                                                     |
| - Count arrangements of successes and failures                      |
|                                                                     |
| +------------------------------+------------------------------+     |
| | a.  How many arrangements of | b.  How many arrangements of |     |
| |     two S's and two F's are  |     two $S$s and four $F$s   |     |
| |     there in four trials?    |     are there in six trials? |     |
| +==============================+==============================+     |
|                                                                     |
| - State 'success' event, then $n$ then $p$ of a binomial            |
|   distribution                                                      |
|                                                                     |
| +--------------------------------+--------------------------------+ |
| | a.  A player takes 6           | b.  A die is rolled 10 times.  | |
| |     three-point shots. Each is |     We are interested in the   | |
| |     scored with probability    |     number of sixes.           | |
| |     $0.3$.                     |                                | |
| |                                |                                | |
| | Success: ..................... |                                | |
| |                                |                                | |
| | $n:$ .........                 |                                | |
| |                                |                                | |
| | $p:$ .........                 |                                | |
| +================================+================================+ |
| | c.  Twelve components are tested. Each is defective with        | |
| |     probability $0.1$.\                                         | |
| |     We are interested in the number of defectives.              | |
| +-----------------------------------------------------------------+ |
+---------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------+
| - **Investigation** binomial distributions                                                                         |
+================================================================================+===================================+
| A fair die is rolled 4 times and we record the number of times six is rolled.                                      |
|                                                                                                                    |
| We will take *six* to represent a 'success' and *not six* to be a 'failure'.                                       |
+--------------------------------------------------------------------------------+-----------------------------------+
| ![](media/Binomial Distributions/media/image1.png){width="2.936923665791776in" | a.  What is the probability of    |
| height="6.004616141732283in"}                                                  |     four successes in a row S S S |
|                                                                                |     S?                            |
|                                                                                |                                   |
|                                                                                | b.  What is the probability of    |
|                                                                                |     four failures in a row F F F  |
|                                                                                |     F?                            |
|                                                                                |                                   |
|                                                                                | c.  What is the probability of S  |
|                                                                                |     S S F,\                       |
|                                                                                |     in that order?                |
|                                                                                |                                   |
|                                                                                | d.  What is the probability of S  |
|                                                                                |     S F S,\                       |
|                                                                                |     in that order?                |
|                                                                                |                                   |
|                                                                                | e.  What is the probability of 3  |
|                                                                                |     S, 1 F\                       |
|                                                                                |     in any order?                 |
|                                                                                |                                   |
|                                                                                | f.  What is the probability of S  |
|                                                                                |     S F F,\                       |
|                                                                                |     in that order?                |
|                                                                                |                                   |
|                                                                                | g.  How many ways are there to    |
|                                                                                |     get 2 S and 2 F?              |
|                                                                                |                                   |
|                                                                                | h.  Therefore, what is the        |
|                                                                                |     probability of 2 S and 2 F,   |
|                                                                                |     in any order?                 |
+--------------------------------------------------------------------------------+-----------------------------------+
| Suppose an experiment is repeated several times, and each trial results in either a success or a failure.          |
|                                                                                                                    |
| To find the probability of one specific sequence of successes and failures, such as S S S F, we .................. |
| the probabilities of the individual outcomes.                                                                      |
|                                                                                                                    |
| Since we can multiply in any order without changing the result, two sequences have the same probability when they  |
| contain the same number of successes and failures, so S S S F and ............... have the same probability.       |
|                                                                                                                    |
| To find the probability of exactly 3 successes out of 4 in any order, we first count the number of possible        |
| ........................ containing 3 successes out of 4. We then multiply the number of arrangements by the       |
| probability of each such arrangement.                                                                              |
+--------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Probability of** $\mathbf{r}$ **successes**                   |
+===================================================================+
| For a binomial random variable $X\sim Bin(n,p)$, the probability  |
| of $r$ successes is:                                              |
|                                                                   |
| number of ways to arrange $r$ successes out of $n$                |
|                                                                   |
| $$P(X = r) =^{n}C_{r}\, p^{r}(1 - p)^{n - r}$$                    |
|                                                                   |
| probability of each sequence of $r$ successes and $n - r$         |
| failures                                                          |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** probability of $r$ successes formula                                                                      |
+=============================================================+=============================================================+
| $X \sim \text{Bin}(6,0.3)$, find $P(X = 2)$.                | $X \sim \text{Bin}(6,0.3)$, find $P(X = 3)$.                |
|                                                             |                                                             |
| $$P(X = 2) =^{6}C_{2} \cdot {0.3}^{2} \cdot (1 - 0.3)^{4}$$ | $$P(X = 3) =^{6}C_{3} \cdot {0.3}^{3} \cdot (1 - 0.3)^{3}$$ |
+-------------------------------------------------------------+-------------------------------------------------------------+
| Find the probability of:                                                                                                  |
+-------------------------------------------------------------+-------------------------------------------------------------+
| a.  $X \sim \text{Bin}(6,0.4)$, $P(X = 3)$                  | b.  $X \sim \text{Bin}(6,0.3)$, $P(X = 4)$                  |
+-------------------------------------------------------------+-------------------------------------------------------------+
| c.  $X \sim \text{Bin}(8,0.3)$, $P(X = 4)$                  | d.  $X \sim \text{Bin}(7,0.4)$, $P(X = 2)$                  |
+-------------------------------------------------------------+-------------------------------------------------------------+
| e.  $X \sim \text{Bin}(9,0.15)$, $P(X = 3)$                 | f.  $X \sim \text{Bin}(5,0.2)$, $P(X = 2)$                  |
+-------------------------------------------------------------+-------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** calculate probability of $r$ successes in a         |
|   binomial distribution                                           |
+===================================================================+
| A basketball player scores a shot with probability 0.3.           |
|                                                                   |
| She takes 6 shots, with each shot independent of the previous.    |
|                                                                   |
| Let $X$ be the number of shots that she scores. Find the          |
| probability she gets 2 shots in.                                  |
|                                                                   |
| $$X \sim \text{Bin}(6,0.3)$$                                      |
|                                                                   |
| $n = 6$, $p = 0.3$, $r = 2$                                       |
|                                                                   |
| $${P(X = 2) =^{6}C_{2} \cdot {0.3}^{2} \cdot (1 - 0.3)^{4}        |
| }{= 0.324135}$$                                                   |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| a.  Same player as above, same 6 shots, same probability $0.3$.\  |
|     Find the probability she gets 3 shots in.                     |
|                                                                   |
| 0.1852                                                            |
+-------------------------------------------------------------------+
| b.  The player improves. She now scores with probability $0.4$.   |
|     She still takes 6 shots.\                                     |
|     Find the probability she gets 3 shots in                      |
|                                                                   |
| 0.2765                                                            |
+-------------------------------------------------------------------+
| c.  She takes 7 shots instead of 6, still scoring with            |
|     probability $0.4$. Find $P(X = 3)$.                           |
|                                                                   |
| 0.2903                                                            |
+-------------------------------------------------------------------+
| d.  A machine produces components. Each component is defective    |
|     with probability $0.15$, independently of the others. A       |
|     sample of 8 components is taken. Find the probability that    |
|     exactly 3 are defective, correct to four decimal places.      |
|                                                                   |
| $$0.0839$$                                                        |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------+
| - **Key Ideas**                                                                                               |
+===============================================================================================================+
| 1.  If $X \sim \text{Bin}(n,p)$, then                                                                         |
|     $P(X = r) = \underline{\quad\quad} \times p^{\underline{\quad}} \times (1 - p)^{\underline{\quad\quad}}$. |
|                                                                                                               |
| 2.  The factor $^{n}C_{r}$ counts the number of ............... in which $r$ successes can occur in $n$       |
|     trials.                                                                                                   |
|                                                                                                               |
| 3.  The exponent $r$ is the number of .................. and the exponent $n - r$ is the number of            |
|     ...............                                                                                           |
|                                                                                                               |
| 4.  The two exponents always add to .........                                                                 |
|                                                                                                               |
| 5.  Every arrangement with $r$ successes has the ............... probability, which is why the arrangements   |
|     may be counted and then multiplied.                                                                       |
+---------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------+
| - **Binomial Distribution on a Calculator**                                                                  |
+==============================================================================================================+
| ![](media/Binomial Distributions/media/image2.png){width="0.30219706911636046in"                             |
| height="0.2772222222222222in"}**Casio FX 8200AU:**                                                           |
|                                                                                                              |
| 1\. Press HOME                                                                                               |
|                                                                                                              |
| ![](media/Binomial Distributions/media/image3.png){width="0.7368055555555556in"                              |
| height="0.37859580052493436in"}                                                                              |
|                                                                                                              |
| 2\. Select                                                                                                   |
|                                                                                                              |
| 3\. Select \[Binomial PD\] (binomial probability distribution)                                               |
|                                                                                                              |
| To see the binomial probability distribution of $X\sim Bin(6,0.3)$:                                          |
|                                                                                                              |
| a\. \[List\]                                                                                                 |
|                                                                                                              |
| b\. Enter data from 0 to 6. Here, $x$ represents number of successes, $r$.\                                  |
| (if you want a specific number of successes, just enter that one).                                           |
|                                                                                                              |
| ![](media/Binomial Distributions/media/image4.png){width="0.28823490813648295in"                             |
| height="0.2698370516185477in"}c. Press and enter the number of trials $N$and probability of success $p$      |
|                                                                                                              |
| ![](media/Binomial Distributions/media/image5.png){width="0.9513112423447069in"                              |
| height="0.1800349956255468in"}d. Press                                                                       |
|                                                                                                              |
| ![](media/Binomial Distributions/media/image6.png){width="2.123530183727034in"                               |
| height="0.7990605861767279in"}![](media/Binomial Distributions/media/image7.png){width="2.123530183727034in" |
| height="0.7990605861767279in"}![](media/Binomial Distributions/media/image8.png){width="2.128883420822397in" |
| height="0.801075021872266in"}                                                                                |
|                                                                                                              |
| You can see that $P(X = 2) = 0.3241$ like we calculated using                                                |
| $^{6}C_{2} \cdot {0.3}^{2} \cdot (1 - 0.3)^{4}$                                                              |
+--------------------------------------------------------------------------------------------------------------+

# At Least, At Most, More Than

+------------------------------------------------------------------------------+
| - **Review**                                                                 |
+==============================================================================+
| - Recall language of compound events                                         |
|                                                                              |
| > A set of numbers is $\{ 0,\ 1,\ 2,\ 3,\ 4,\ 5,\ 6\}$                       |
| >                                                                            |
| > Write the subset for:                                                      |
|                                                                              |
| +------------------------------+------------------------------+              |
| | a.  More than 2              | b.  At least 2               |              |
| +==============================+==============================+              |
| | c.  2 or more                | d.  Not fewer than 2         |              |
| +------------------------------+------------------------------+              |
| | e.  Fewer than 2             | f.  At most 2                |              |
| +------------------------------+------------------------------+              |
| | g.  Not more than 2          | h.  Not more than 5          |              |
| +------------------------------+------------------------------+              |
| | i.  Between 2 and 4,         | j.  No more than 2           |              |
| |     inclusive                |                              |              |
| +------------------------------+------------------------------+              |
|                                                                              |
| A binomial distribution is $X\sim Bin(n,p)$ write the set of $r$ for these   |
| phrases:                                                                     |
|                                                                              |
| +------------------------+------------------------+------------------------+ |
| | a.  $X\sim Bin(5,0.3)$ | b.  $X\sim Bin(4,0.3)$ | c.  $X\sim Bin(4,0.3)$ | |
| |                        |                        |                        | |
| | At least 2             | At least 2             | No more than 2         | |
| +========================+========================+========================+ |
|                                                                              |
| - Identify complement set\                                                   |
|   Sometimes it is more efficient to do                                       |
|   $P(A) = 1 - P\left( \overline{A} \right)$ if the complement set is         |
|   smaller.\                                                                  |
|   For $X = \left\{ 0,1,2,3,4,5,6 \right\}$, identify the direct set and the  |
|   complement set and decide whether finding the complement would be more     |
|   efficient.                                                                 |
|                                                                              |
| +------------------------------+------------------------------+              |
| | a.  $X \geq 4$               | b.  $X \geq 2$               |              |
| +==============================+==============================+              |
| | c.  $X \leq 5$               | d.  $X > 1$                  |              |
| +------------------------------+------------------------------+              |
| | e.  At least 2               | f.  At most 3                |              |
| +------------------------------+------------------------------+              |
+------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------+
| - **Example** Solve binomial distribution problems involving at most, at least etc.                   |
+=====================================+=================================================================+
| A machine produces components. 30% of components are faulty.                                          |
|                                                                                                       |
| A sample of 6 components is taken.                                                                    |
|                                                                                                       |
| Find the probability that at least 2 components are faulty.                                           |
+-------------------------------------+-----------------------------------------------------------------+
| Success: a component is faulty      | $$P(X \geq 2) = 1 - P(X = 0) - P(X = 1)$$                       |
|                                     |                                                                 |
| $n = 6$, $p = 0.3$,                 | $$P(X = 0) =^{6}C_{0}(0.3)^{0}(1 - 0.3)^{6} = (0.7)^{6}$$       |
|                                     |                                                                 |
| $$X \sim \text{Bin}(6,0.3)$$        | $$P(X = 1) =^{6}C_{1}(0.3)^{1}(1 - 0.3)^{5} = 6(0.3)(0.7)^{5}$$ |
|                                     |                                                                 |
| "At least 2" means                  | $${\therefore P(X \geq 2) = 1 - (0.7)^{6} - 6(0.3)(0.7)^{5}     |
| $r \in \left\{ 2,3,4,5,6 \right\}$; | }{\approx 0.5798}$$                                             |
| 5 terms                             |                                                                 |
|                                     |                                                                 |
| Complement $\{ 0,1\}$: 2 terms.     |                                                                 |
+-------------------------------------+-----------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| a.  $X \sim \text{Bin}(6,0.3)$.   | b.  $X \sim \text{Bin}(6,0.3)$.   |
|     Find $P(X > 2)$.              |     Find $P(X \leq 2)$.           |
|                                   |                                   |
| $$0.2557$$                        | $$0.7443$$                        |
+-----------------------------------+-----------------------------------+
| c.  A set of traffic lights is    | d.  $X \sim \text{Bin}(6,0.3)$.   |
|     red on 20% of approaches. A   |     Find $P(2 \leq X \leq 4)$.    |
|     driver passes 5 such lights.  |                                   |
|     Find the probability that     | $$0.5689$$                        |
|     **at most 1** is red.         |                                   |
|                                   |                                   |
| $$0.7373$$                        |                                   |
+-----------------------------------+-----------------------------------+

+----------------------------------------------------------------------------------------------------------------+
| - **Binomial Cumulative Probabilities using a Calculator**                                                     |
+================================================================================================================+
| ![](media/Binomial Distributions/media/image2.png){width="0.30219706911636046in"                               |
| height="0.2772222222222222in"}**Casio FX 8200AU:**                                                             |
|                                                                                                                |
| 1\. Press HOME                                                                                                 |
|                                                                                                                |
| ![](media/Binomial Distributions/media/image3.png){width="0.7368055555555556in"                                |
| height="0.37859580052493436in"}                                                                                |
|                                                                                                                |
| 2\. Select                                                                                                     |
|                                                                                                                |
| 3\. Select \[Binomial CD\] (binomial cumulative density; this finds $P(X \leq x)$)                             |
|                                                                                                                |
| To see the cumulative binomial probability distribution of $X\sim Bin(6,0.3)$:                                 |
|                                                                                                                |
| a\. \[List\]                                                                                                   |
|                                                                                                                |
| b\. Enter data from 0 to 6 (if you want a specific number of successes, just enter that one).                  |
|                                                                                                                |
| ![](media/Binomial Distributions/media/image4.png){width="0.28823490813648295in"                               |
| height="0.2698370516185477in"}c. Press and enter the number of trials $N$and probability of success $p$        |
|                                                                                                                |
| ![](media/Binomial Distributions/media/image5.png){width="0.9513112423447069in"                                |
| height="0.1800349956255468in"}d. Press                                                                         |
|                                                                                                                |
| ![](media/Binomial Distributions/media/image9.png){width="2.122916666666667in"                                 |
| height="0.7986111111111112in"}![](media/Binomial Distributions/media/image10.png){width="2.122916666666667in"  |
| height="0.7986111111111112in"}![](media/Binomial Distributions/media/image11.png){width="2.1284722222222223in" |
| height="0.8006944444444445in"}                                                                                 |
|                                                                                                                |
| The values show $P(X \leq x)$.                                                                                 |
|                                                                                                                |
| To find $P(X \geq 2),$ you would do $1 - P(X \leq 1) = 1 - 0.4201 = 0.5798$, as we found earlier.              |
+----------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** Binomial cumulative distribution                                                                         |
+========================================+========================================+========================================+
| Binomial CD for $X \sim \text{Bin}(6,0.3)$ is shown.                                                                     |
|                                                                                                                          |
| ![](media/Binomial Distributions/media/image9.png){width="2.6152777777777776in"                                          |
| height="0.9840277777777777in"}![](media/Binomial Distributions/media/image12.png){width="2.6156824146981625in"           |
| height="0.984251968503937in"}                                                                                            |
+--------------------------------------------------------------------------------------------------------------------------+
| Find:                                                                                                                    |
+----------------------------------------+----------------------------------------+----------------------------------------+
| a.  $P(X \leq 3)$                      | b.  $P(X < 3)$                         | c.  $P(X > 3)$                         |
|                                        |                                        |                                        |
| 0.9295                                 | 0.7443                                 | 0.0705                                 |
+----------------------------------------+----------------------------------------+----------------------------------------+

# Mean, Variance, Expected Frequency of Binomial Distributions

+-------------------------------------------------------------------+
| - **Investigation** Mean, variance of binomial distributions      |
+===================================================================+
| Suppose a basketball player is taking a free throw, and he has an |
| 80% chance of getting it in.                                      |
|                                                                   |
| $X$ is a ........................... random variable, with        |
| success probability ............ and failure probability          |
| ............                                                      |
|                                                                   |
|   ----------------------                                          |
|     $$x$$    0     1                                              |
|   ---------- ----- -----                                          |
|    $$P(x)$$                                                       |
|                                                                   |
|   ----------------------                                          |
|                                                                   |
| The expected value is ............                                |
|                                                                   |
| The variance is ............                                      |
|                                                                   |
| Suppose now that the same player is taking $n = 10$ independent   |
| free throws, each with the same success probability of 80%.       |
|                                                                   |
| This is a .................. random variable. You would *expect*  |
| him to score ............ shots.                                  |
|                                                                   |
| This is due to the **linearity of expectation** (not strictly in  |
| the course)                                                       |
|                                                                   |
| $$E(X + Y) = E(X) + E(Y)\ and\ E(aX + b) = aE(X) + b$$            |
|                                                                   |
| Variance is also linear for independent events.                   |
|                                                                   |
| $$Var(X + Y) = Var(X) + Var(Y)$$                                  |
|                                                                   |
| The expected value for a Bernoulli random variable is $p$ and     |
| variance is $p(1 - p);$                                           |
|                                                                   |
| so, for a binomial random variable, expected value is             |
| ............ and variance is ............                         |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Variance is not linear**                                          |
+===================================+===================================+
| Be very careful with variance.                                        |
|                                                                       |
| $$Var(X + Y) = Var(X) + Var(Y)$$                                      |
|                                                                       |
| The above relationship is only true for independent events.           |
|                                                                       |
| Variance is not linear:                                               |
|                                                                       |
| $${Var(aX) = a^{2}\ Var(X)                                            |
| }{Var(3X) = 9\ Var(X)}$$                                              |
|                                                                       |
| Imagine $X$ is a random jump of either $+ 1$ or $- 1$ metres.         |
|                                                                       |
| For $X + Y$, you could jump forward 1 and jump backwards 1, the       |
| spread stays controlled as they can cancel out.                       |
|                                                                       |
| For $X + X + X,$ this is a single jump tripled (+1 metre would become |
| +3 metres), so the final spread is much wider as you don't have       |
| randomness cancelling each other out.                                 |
+-----------------------------------------------------------------------+
| - **Mean, Variance, Standard Deviation of Binomial Distributions**    |
+-----------------------------------------------------------------------+
| Let a binomial random variable $X$ be $n$ repetitions of a Bernoulli  |
| trial; we multiply the Bernoulli expected value and variance by $n$:  |
+-----------------------------------+-----------------------------------+
| **Expected Value**                | **Variance & Standard Deviation** |
|                                   |                                   |
| $$E(X) = np$$                     | $${Var(X) = np(1 - p)             |
|                                   | }{\sigma(X) = \sqrt{np(1 - p)}}$$ |
+-----------------------------------+-----------------------------------+
| - $\sigma(X)$ is **not** $n$ times the Bernoulli standard deviation   |
|   $\neq n\sqrt{p(1 - p)}$ as standard deviation does not have the     |
|   linearity property.                                                 |
+-----------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - $\mathbf{n}$ **or** $\mathbf{N}$                                |
+===================================================================+
| When solving problems related to expected frequency, we need to   |
| read the question carefully.                                      |
|                                                                   |
| $n$ is the number of trials **inside one experiment**.            |
|                                                                   |
| $N$ is the number of times the **whole experiment** is repeated.  |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Interpret** each number in a binomial probability scenario        |
+===================================+===================================+
| A batch contains 40 items. Each item is defective with probability    |
| 0.15.\                                                                |
| 200 such batches are inspected. How many batches contain exactly 2    |
| defective items?                                                      |
|                                                                       |
| 40 = $n$ 0.15 = $p$ 200 = $N$ 2 = $r$                                 |
+-----------------------------------------------------------------------+
| Identify whether each number represents $n,\ p,\ N$ or $r$            |
+-----------------------------------+-----------------------------------+
| a.  In 180 packets of 12 seeds,   | b.  120 boxes each hold 25 eggs.  |
|     how many packets have exactly |     Each egg is cracked with      |
|     3 germinate, if each seed has |     probability 0.04. In how many |
|     an 80% chance of germinating? |     boxes are exactly 3 eggs      |
|                                   |     cracked?                      |
+-----------------------------------+-----------------------------------+
| c.  A quiz has 20 multiple-choice | d.  A batch of 40 items has each  |
|     questions. 300 students guess |     item defective with           |
|     every answer, each with       |     probability 0.15. Find the    |
|     probability 0.25 of being     |     probability that exactly 2    |
|     right. How many students get  |     are defective.                |
|     exactly 5 correct*?*          |                                   |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Expected Frequency**                                          |
+===================================================================+
| For entire experiment repeated $N$ times, the expected number of  |
| repetitions in which $X = r$ is:                                  |
|                                                                   |
| $$N \cdot P(X = r)$$                                              |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate mean, sd, and expected frequency of a binomial distribution                                |
+==========================================================+=========================================================+
| A batch contains 40 items. Each item is defective, independently, with probability 0.15.\                          |
| Let $X$ be the number of defective items in a batch.                                                               |
|                                                                                                                    |
| a.  Find $E(X)$, $\text{Var}(X)$ and $\text{sd}(X)$.                                                               |
|                                                                                                                    |
| b.  200 such batches are inspected.\                                                                               |
|     Find the expected number of batches containing exactly 2 defective items.                                      |
+----------------------------------------------------------+---------------------------------------------------------+
| a\.                                                      | b\.                                                     |
|                                                          |                                                         |
| $$E(X) = np = 40(0.15) = 6$$                             | $${N \cdot P(X = 2) = 200 \cdot \left( \begin{array}{r} |
|                                                          | 40 \\                                                   |
| $$Var(X) = np(1 - p) = 40(0.15)(0.85) = 5.1$$            | 2                                                       |
|                                                          | \end{array} \right)(0.15)^{2}(0.85)^{38}                |
| $\sigma(X) = \sqrt{np(1 - p)} = \sqrt{5.1} \approx 2.26$ | }{\approx 7\ batches}$$                                 |
| (2 d.p.)                                                 |                                                         |
|                                                          | Note that being defective is taken to be 'success' here |
+----------------------------------------------------------+---------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| a.  A batch contains 40 items.    | b.  A batch of 30 items has each  |
|     Each item is defective with   |     item defective with           |
|     probability **0.2**.\         |     probability 0.1. In 500       |
|     Find $E(X)$ and               |     batches, how many are         |
|     $\text{Var}(X)$.              |     expected to contain exactly 3 |
|                                   |     defectives?                   |
| $$E(X) = 8,\ Var(X) = 6.4$$       |                                   |
|                                   | 118                               |
+-----------------------------------+-----------------------------------+
| c.  $X \sim \text{Bin}(40,0.15)$. | d.  $X \sim \text{Bin}(n,p)$ with |
|     Of 200 batches, how many are  |     $E(X) = 12$ and               |
|     expected to contain **at      |     $\text{Var}(X) = 9.6$. Find   |
|     least 2** defective items?    |     $n$ and $p$.                  |
|                                   |                                   |
| $200 \times P(X \geq 2)$ = 198    | $$p = 0.2,\ n = 60$$              |
| batches                           |                                   |
+-----------------------------------+-----------------------------------+

# The Sample Proportion

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** The sample proportion                                                                                                                                             |
+==============================================================+==================================================================+=====================================================+
| Imagine that a city has a population of 1 million people, with 40% owning a bicycle.                                                                                                  |
|                                                                                                                                                                                       |
| You repeatedly survey random samples of 1000 people and record the results.                                                                                                           |
|                                                                                                                                                                                       |
| Let $X$ be the number of bicycle owners in a sample. Since each person either owns a bicycle or doesn't, $X$ is a ..................... random variable.                              |
|                                                                                                                                                                                       |
| Calculate the proportion $\widehat{p}$ of people in each sample who own a bike.                                                                                                       |
|                                                                                                                                                                                       |
| Sample A: 437 out of 1000 people own a bike. ${\widehat{p}}_{A} =$ ............                                                                                                       |
|                                                                                                                                                                                       |
| Sample B: 412 out of 1000 people own a bike. ${\widehat{p}}_{B} =$ ............                                                                                                       |
|                                                                                                                                                                                       |
| Sample C: 385 out of 1000 people own a bike. ${\widehat{p}}_{C} =$ ............                                                                                                       |
|                                                                                                                                                                                       |
| The **sample proportion** $\widehat{p}$ is the number of successes recorded in a sample ($X\sim Bin(n,p)$), divided by the sample size $n$.                                           |
|                                                                                                                                                                                       |
| $$\widehat{p} = \frac{X}{n}$$                                                                                                                                                         |
|                                                                                                                                                                                       |
| The distribution of $\widehat{p}$ is just the distribution of $X$ horizontally dilated by factor $\frac{1}{n}$.                                                                       |
|                                                                                                                                                                                       |
| ![](media/Binomial Distributions/media/image13.png){width="3.408333333333333in" height="1.9756944444444444in"}Notice that the probabilities are the same                              |
| $P\left( \widehat{p} = \frac{r}{n} \right) = P(X = r) = \left( \begin{array}{r}                                                                                                       |
| n \\                                                                                                                                                                                  |
| r                                                                                                                                                                                     |
| \end{array} \right)p^{r}q^{n - r}$ since we are relabelling each $x$ value: 400 $\mapsto$ 0.4.                                                                                        |
|                                                                                                                                                                                       |
| ![](media/Binomial Distributions/media/image14.png){width="3.407638888888889in" height="1.9756944444444444in"}                                                                        |
|                                                                                                                                                                                       |
| If we take lots of samples and average the results, we get a good estimate of the true probability (**law of large numbers**) and the sampling proportion becomes approximately       |
| normal (**central limit theorem**).                                                                                                                                                   |
|                                                                                                                                                                                       |
| Statisticians usually work with sample proportions because proportions can be compared across samples of different sizes and directly estimate a population percentage. Saying "40%   |
| of people own a bicycle" is generally more useful than saying "400 people own a bicycle", because the second statement depends on the sample size.                                    |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Sample Proportions**                                                                                                                                                              |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| The **sample proportion** $\widehat{p}$ is the number of successes recorded in a sample ($X\sim Bin(n,p)$), divided by the sample size $n$.                                           |
|                                                                                                                                                                                       |
| $$\widehat{p} = \frac{X}{n}$$                                                                                                                                                         |
+--------------------------------------------------------------+------------------------------------------------------------------+-----------------------------------------------------+
| **Expected Value**                                           | **Variance**                                                     | **Standard Deviation**                              |
|                                                              |                                                                  |                                                     |
| $${E\left( \widehat{p} \right) = E\left( \frac{X}{n} \right) | $${Var\left( \widehat{p} \right) = Var\left( \frac{X}{n} \right) | $${\sigma\left( \widehat{p} \right) = \sqrt{Var(X)} |
| }{= \frac{E(X)}{n}                                           | }{= \frac{E(X)}{n^{2}}                                           | }{= \sqrt{\frac{np(1 - p)}{n^{2}}}                  |
| }{= \frac{np}{n}                                             | }{= \frac{np(1 - p)}{n^{2}}                                      | }{= \frac{\sqrt{np(1 - p)}}{n}}$$                   |
| }{= p}$$                                                     | }{= \frac{p(1 - p)}{n}}$$                                        |                                                     |
+--------------------------------------------------------------+------------------------------------------------------------------+-----------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate $E\left( \widehat{p} \right),\ Var\left( \widehat{p} \right)$ and $\sigma\left( \widehat{p} \right)$             |
+===========================================+==============================================================================================+
| A factory produces circuit boards. In the long run, 30% of boards are faulty. A random sample of 150 boards is taken. Let $X$ be the     |
| number of faulty boards in the sample, and let $\widehat{p} = \frac{X}{150}$                                                             |
|                                                                                                                                          |
| Find $E\left( \widehat{p} \right)$ and $\sigma\left( \widehat{p} \right)$                                                                |
+-------------------------------------------+----------------------------------------------------------------------------------------------+
| $$X \sim \text{Bin}(150,0.3)$$            | $${Var(X) = \frac{p(1 - p)}{n} = \frac{0.3(1 - 0.3)}{150} = 0.0014                           |
|                                           | }{\sigma\left( \widehat{p} \right) = \sqrt{Var\left( \widehat{p} \right)} = \sqrt{0.0014}}$$ |
| $$E\left( \widehat{p} \right) = p = 0.3$$ |                                                                                              |
+-------------------------------------------+----------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| 12% of all emails arriving at a large server are spam. A random   |
| sample of 300 emails is taken. Let $\widehat{p}$ be the           |
| proportion of spam emails in the sample. Find $E(\widehat{p})$    |
| and $\text{sd}(\widehat{p})$, correct to four decimal places      |
|                                                                   |
| $$E\left( \widehat{p} \right) = 0.12$$                            |
|                                                                   |
| $$\text{sd}(\widehat{p}) = \sqrt{0.000352} = 0.0188$$             |
+-------------------------------------------------------------------+
| In the factory circuit board example,                             |
| $X \sim \text{Bin}(150,0.3)$ and $\widehat{p} = \frac{X}{150}$*,* |
| what is the smallest sample size $n$ for which                    |
| $\sigma\left( \widehat{p} \right) < 0.01$?                        |
|                                                                   |
| 21                                                                |
+-------------------------------------------------------------------+

# Normal Approximation of Sample Proportions

+---------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                            |
+=========================================================================================================+
| - Calculate mean and sd of $\widehat{p}$                                                                |
|                                                                                                         |
| +------------------------------+-------------------------------+                                        |
| | a.  $p = 0.6$, $n = 200$.    | b.  $p = 0.6$, $n = 200$.     |                                        |
| |     Write down               |     Find                      |                                        |
| |     $E(\widehat{p})$         |     $\text{Var}(\widehat{p})$ |                                        |
| |                              |                               |                                        |
| | 0.6                          | 0.0012                        |                                        |
| +==============================+===============================+                                        |
| | c.  $p = 0.6$, $n = 200$.    | d.  $p = 0.4$, $n = 600$.     |                                        |
| |     Find                     |     Find                      |                                        |
| |     $\text{sd}(\widehat{p})$ |     $\text{sd}(\widehat{p})$  |                                        |
| |     to four decimal places.  |                               |                                        |
| |                              | 0.02                          |                                        |
| | 0.0346                       |                               |                                        |
| +------------------------------+-------------------------------+                                        |
|                                                                                                         |
| - Find the z-score for a normal distribution $X\sim N\left( \mu,\sigma^{2} \right)$                     |
|                                                                                                         |
| +-------------------------------------+---------------------------+-----------------------------------+ |
| | a.  $X \sim N(0.6,\ {0.0346}^{2})$. | b.  $X \sim N(50,8^{2})$. | c.  $X \sim N(0.4,\ {0.02}^{2})$. | |
| |     Find the $z$-score of           |     Find the $z$-score of |     Find the $z$-score of         | |
| |     $x = 0.65$                      |     $x = 62$              |     $x = 0.37$                    | |
| |                                     |                           |                                   | |
| | 1.45                                | 1.5                       | $$1.5$$                           | |
| +=====================================+===========================+===================================+ |
|                                                                                                         |
| - Calculate z-score probability                                                                         |
|                                                                                                         |
| +------------------------------+------------------------------+                                         |
| | a.  $P(Z < 1.44)$            | b.  $P(Z > 1.44)$            |                                         |
| |                              |                              |                                         |
| | 0.0749                       | 0.9251                       |                                         |
| +==============================+==============================+                                         |
| | c.  $P(Z < - 1.44)$          | d.  $( - 1 < Z < 2)$         |                                         |
| |                              |                              |                                         |
| | 0.0749                       | 0.8185                       |                                         |
| +------------------------------+------------------------------+                                         |
+---------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------+
| - **Normal Approximation of Binomial Sample Proportions**                                          |
+====================================================================================================+
| For large samples, the distribution of sample proportions for a binomial random variable is        |
| approximately normally distributed with the same mean and standard deviation.                      |
|                                                                                                    |
| For large $n$, and $X\sim Bin(n,p)$:                                                               |
|                                                                                                    |
| $$X\sim N\left( np,np(1 - p) \right),\ \ \widehat{p}\ \sim\ N\left( p,\frac{p(1 - p)}{n} \right)$$ |
|                                                                                                    |
| We then also need to convert the raw score or sample proportion to a z-score:                      |
|                                                                                                    |
| $$z = \frac{x - \mu}{\sigma},\ \ z = \frac{\widehat{p} - \mu}{\sigma}$$                            |
+----------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------+
| - **Standardise** value of $\widehat{p}$                                            |
+==========================================+==========================================+
| $p = 0.4$, $n = 600$, $\widehat{p} = 0.43$.                                         |
|                                                                                     |
| $$\mu = p = 0.4$$                                                                   |
|                                                                                     |
| $$\sigma = \frac{p(1 - p)}{n} = \sqrt{\frac{0.4 \times (1 - 0.4)}{600}} = 0.02$$    |
|                                                                                     |
| $$z = \frac{\widehat{p} - \mu}{\sigma} = \frac{0.43 - 0.40}{0.02} = 1.5$$           |
+-------------------------------------------------------------------------------------+
| Write $\widehat{p}$ or $x$ as a standardised z-score for a normal approximation.    |
+------------------------------------------+------------------------------------------+
| a.  $p = 0.4$, $n = 600$,                | b.  $p = 0.4$, $n = 150$,                |
|     $\widehat{p} = 0.37$                 |     $\widehat{p} = 0.43$                 |
|                                          |                                          |
| $$- 1.5$$                                | 0.75                                     |
+------------------------------------------+------------------------------------------+
| c.  $p = 0.25$, $n = 1200$,              | d.  $p = 0.6$, $n = 200$,                |
|     $\widehat{p} = 0.275$                |     $\widehat{p} = 0.65$                 |
|                                          |                                          |
| 2                                        | 1.44                                     |
+------------------------------------------+------------------------------------------+
| e.  $p = 0.6$, $n = 200$,                | f.  $p = 0.6$, $n = 200$, $x = 110$      |
|     $\widehat{p} = 0.55$                 |                                          |
|                                          | $$- 1.44$$                               |
| $$- 1.44$$                               |                                          |
+------------------------------------------+------------------------------------------+

+----------------------------------------------------------------------------------------------------+
| - **Normal Approximation of Binomial Sample Proportions**                                          |
+====================================================================================================+
| For large $n$, and $X\sim Bin(n,p)$:                                                               |
|                                                                                                    |
| $$X\sim N\left( np,np(1 - p) \right),\ \ \widehat{p}\ \sim\ N\left( p,\frac{p(1 - p)}{n} \right)$$ |
|                                                                                                    |
| $$z = \frac{x - \mu}{\sigma},\ \ z = \frac{\widehat{p} - \mu}{\sigma}$$                            |
|                                                                                                    |
| 1\. Find the mean and standard deviation of the normal approximation.                              |
|                                                                                                    |
| 2\. Calculate the z-score.                                                                         |
|                                                                                                    |
| 3\. Solve for the probability using a calculator or a table.                                       |
+----------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Solve problems involving normal approximation                                                                                                                    |
+======================================================================================+=========================================================================================+
| 60% of all voters in a large electorate support a policy. A random sample of 200 voters is taken. Find the probability that the sample proportion in favour of the policy      |
| exceeds $0.65$.                                                                                                                                                                |
+--------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------+
| 1\. Normal approximation                                                             | 2\. z-score                                                                             |
|                                                                                      |                                                                                         |
| $$\mu = 0.6$$                                                                        | $${P\left( \widehat{p} > 0.65 \right) = P\left( Z > \frac{0.65 - 0.6}{0.034641} \right) |
|                                                                                      | }{= P(Z > 1.44)}$$                                                                      |
| $$\sigma = \sqrt{\frac{p(1 - p)}{n}} = \sqrt{\frac{0.6(0.4)}{200}} = \sqrt{0.0012}$$ |                                                                                         |
|                                                                                      | 3\. Solve                                                                               |
| $$\widehat{p}\ \sim\ N(0.6,0.0012)$$                                                 |                                                                                         |
|                                                                                      | $${P(Z > 1.44) = 1 - P(Z < 1.44)                                                        |
|                                                                                      | }{= 1 - 0.9251                                                                          |
|                                                                                      | }{= 0.0749}$$                                                                           |
+--------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| a.  Redo the example but use a sample size of 800 rather than     |
|     200.                                                          |
|                                                                   |
| $$0.0019$$                                                        |
+-------------------------------------------------------------------+
| b.  In a large city, 25% of households own a cat. A random sample |
|     of 400 households is taken. Find the probability that the     |
|     sample proportion of cat-owning households is less than       |
|     $0.22$.                                                       |
|                                                                   |
| $$0.0823$$                                                        |
+-------------------------------------------------------------------+
| c.  A pollster surveys 10,000 people and asks whether they intend |
|     to vote for a particular political party in the next          |
|     election. Assume that the true proportion of the population   |
|     who intend to vote for this party is $\frac{1}{3}$.\          |
|     Using a normal approximation to the binomial distribution,    |
|     calculate the probability that between 3,300 and 3,400        |
|     people, inclusive, say they intend to vote for the party.\    |
|     \                                                             |
|     Explain why calculating this probability using the binomial   |
|     distribution would be impractical without a normal            |
|     approximation.                                                |
|                                                                   |
| $$P(0.71 \leq z \leq 1.41) = 0.6816$$                             |
|                                                                   |
| An exact binomial calculation would require evaluating and adding |
| many terms containing very large combinations such as             |
| $\left( \begin{array}{r}                                          |
| 10000 \\                                                          |
| x                                                                 |
| \end{array} \right)$                                              |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Sample Size Requirement and Continuity Correction**           |
+===================================================================+
| **Neither of the following are in the syllabus but are covered by |
| some textbooks.**                                                 |
|                                                                   |
| When is a sample 'large' enough to allow normal approximation?    |
|                                                                   |
| $X\sim Bin(n,p)$ is skewed unless $p = 0.5$. Normal distributions |
| are symmetric.\                                                   |
| The rule of thumb is to use normal approximation when             |
| $np \geq 10$ and $n(1 - p) \geq 10,$ which gives you a large      |
| enough sample to reduce the skewness.                             |
|                                                                   |
| A normal distribution is continuous, but a binomial distribution  |
| is discrete.\                                                     |
| Some textbooks require you to apply a continuity correction to    |
| adjust for this.                                                  |
|                                                                   |
| This is not in the syllabus.                                      |
+-------------------------------------------------------------------+
