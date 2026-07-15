  -------------------------------------------------------------------
  Mathematics Advanced Year 12
  -------------------------------------------------------------------
  **Continuous\
  Random Variables**

  -------------------------------------------------------------------

+----------------------------------------+----------------------------------------+----------------------------------------+
| **Book 1**                             | Continuous random variables            | Version: 260614                        |
|                                        |                                        |                                        |
|                                        |                                        | Feedback:\                             |
|                                        |                                        | https://MrDingMaths.com                |
+========================================+========================================+========================================+
| **Contents**                                                                                                             |
|                                                                                                                          |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                                                             |
|                                                                                                                          |
| [Continuous Random Variables and Relative Frequency                                                                      |
| [3](#continuous-random-variables-and-relative-frequency)](#continuous-random-variables-and-relative-frequency)           |
|                                                                                                                          |
| [Probability Density Functions [6](#_Toc228214833)](#_Toc228214833)                                                      |
|                                                                                                                          |
| [Calculating Probabilities using Integration [10](#_Toc228214834)](#_Toc228214834)                                       |
|                                                                                                                          |
| [Uniform Distributions [13](#_Toc228214835)](#_Toc228214835)                                                             |
|                                                                                                                          |
| [Mode of a Continuous Distribution [16](#mode-of-a-continuous-distribution)](#mode-of-a-continuous-distribution)         |
|                                                                                                                          |
| [Cumulative Distribution Functions [18](#cumulative-distribution-functions)](#cumulative-distribution-functions)         |
|                                                                                                                          |
| [Expected Value and Variance [23](#_Toc228214838)](#_Toc228214838)                                                       |
+--------------------------------------------------------------------------------------------------------------------------+

# Syllabus Content

**MAV-12-07** solves problems involving discrete probability
distributions, continuous random variables and the normal distribution

**Continuous random variables**

- Estimate the probability that a continuous random variable falls in
  some interval using relative frequencies and histograms obtained from
  data

- Recognise that the probability of a particular value for a continuous
  random variable is 0 and hence that
  $P(a < X < b) = P(a \leq X < b) = P(a < X \leq b) = P(a \leq X \leq b)$
  since $P(X = a) = P(X = b) = 0$ when $X$ is a continuous random
  variable

- Define the cumulative distribution function (CDF), $F(x)$, as the
  probability of a random variable, $X$, having values less than or
  equal to $x$, so $F(x) = P(X \leq x)$ and
  $P(a \leq x \leq b) = F(b) - F(a)$

- Recognise that the cumulative distribution function, $F(x)$, is
  non-decreasing for all $x$ in its domain, and graph cumulative
  distribution functions, given a formula for $F(x)$, with and without
  graphing applications

- Define a probability density function (PDF), $f(x)$, for a random
  variable $X$ with cumulative distribution function $F(x)$ as
  $f(x) = F'(x)$ and recognise that
  $P(a < X < b) = \int_{a}^{b}{f(x)}dx$

- Recognise the properties of a probability density function:
  $f(x) \geq 0$ for all $x$ in the domain of $f(x),$ and
  $\int_{a}^{b}{f(x)dx} = 1$ if the domain of $f(x)$ is
  $\lbrack a,b\rbrack$, or $\int_{- \infty}^{\infty}{f(x)dx} = 1$ if the
  domain of $f(x)$ is all real $x$

- Apply the properties of a probability density function to solve
  problems and justify conclusions

- Find the mode from a given probability density function

- Obtain the cumulative distribution function using the formula
  $F(x) = \int_{a}^{x}{f(t)dt}$ where $f(x)$ is a given probability
  density function defined on the interval $\lbrack a,b\rbrack$

- Determine and use the probability density function
  $f(x) = \frac{1}{b - a}$ for a continuous uniform distribution for a
  random variable $X$ taking values in the interval $\lbrack a,b\rbrack$

- Use a cumulative distribution function to calculate the median and
  quartiles for a continuous random variable

- Find the probability density function from a given cumulative
  distribution function

- Generate the expression for the expected value of a continuous random
  variable, $E(X) = \mu = \int_{a}^{b}{xf(x)dx}$, where the probability
  density function $f(x)$ is defined on the interval
  $\lbrack a,b\rbrack$

- Generate the expression for the variance of a continuous random
  variable,
  $\text{Var}(X) = E\left( X^{2} \right) - \mu^{2} = \int_{a}^{b}{x^{2}f(x)dx} - \mu^{2}$,
  where the probability density function $f(x)$ is defined on the
  interval $\lbrack a,b\rbrack$

- Evaluate the expected value and the variance of a continuous random
  variable, where the probability density function $f(x)$ is defined on
  the interval $\lbrack a,b\rbrack$, that involve integration of
  functions within the scope of the Mathematics Advanced course

- Evaluate the expected value and the variance of a continuous random
  variable, where the probability density function $f(x)$ is defined on
  the interval $\lbrack a,b\rbrack$, that involve integration of
  functions beyond the scope of the Mathematics Advanced course using an
  online computational application

# Continuous Random Variables and Relative Frequency

+--------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                           |
+========================================================================================================+
| - Analyse discrete random variables                                                                    |
|                                                                                                        |
|   --------------------------------------------------------                                             |
|   $$x$$                0     1     2     3      4      5                                               |
|   ------------------ ----- ----- ----- ------ ------ -----                                             |
|   $$P(X\  = \ x)$$    0.1   0.2   0.3   0.25   0.05   0.1                                              |
|                                                                                                        |
|   --------------------------------------------------------                                             |
|                                                                                                        |
| +--------------------+--------------------------+-----------------------+                              |
| | a.  $P(X = 1)$     | b.  $P(2 \leq X \leq 4)$ | c.  $P(1 \leq X < 4)$ |                              |
| |                    |                          |                       |                              |
| | $$0.2$$            | $$0.6$$                  | $$0.75$$              |                              |
| +====================+==========================+=======================+                              |
| | d.  $P(X = 6)$     | e.  $P(X \leq 2)$        | f.  $P(X < 4)$        |                              |
| |                    |                          |                       |                              |
| | $$0$$              | $$0.6$$                  | $$0.85$$              |                              |
| +--------------------+--------------------------+-----------------------+                              |
|                                                                                                        |
| - Analyse grouped data                                                                                 |
|                                                                                                        |
| The table shows the times taken, in minutes, to complete a puzzle.                                     |
|                                                                                                        |
| ![](media/Random Variables 2_Continuous random variables/media/image1.png){width="2.740972222222222in" |
| height="1.6271773840769903in"}                                                                         |
|                                                                                                        |
| a.  Which class interval has the lowest frequency?                                                     |
|                                                                                                        |
| $$2 < t \leq 4$$                                                                                       |
|                                                                                                        |
| b.  How many people took longer than 8 minutes to complete the puzzle?                                 |
|                                                                                                        |
| 40                                                                                                     |
|                                                                                                        |
| c.  How many people in total completed the puzzle?                                                     |
|                                                                                                        |
| 120                                                                                                    |
|                                                                                                        |
| d.  What is the relative frequency for people taking $6 < t \leq 10$ to complete the puzzle?           |
|                                                                                                        |
| 13/20                                                                                                  |
|                                                                                                        |
| - Recall the law of large numbers                                                                      |
|                                                                                                        |
| The Law of Large Numbers says that as you ..................... the number of trials, the relative     |
| frequency gets closer to the t..................... p......................                            |
+--------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Continuous Random Variables**                                 |
+===================================================================+
| A **continuous** random variable can take any value in an         |
| interval, not just specific isolated values. Examples include     |
| height, mass, temperature, and waiting time.                      |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Identify** Continuous and discrete random variables               |
+===================================+===================================+
| a.  Number of cars in a car park  | b.  Speed of a car as it passes a |
|                                   |     sensor                        |
| - Discrete                        |                                   |
|                                   | - Discrete                        |
| - Continuous                      |                                   |
|                                   | - Continuous                      |
+-----------------------------------+-----------------------------------+
| c.  Temperature at noon on a      | d.  Number of defective items in  |
|     given day                     |     a batch                       |
|                                   |                                   |
| - Discrete                        | - Discrete                        |
|                                   |                                   |
| - Continuous                      | - Continuous                      |
+-----------------------------------+-----------------------------------+
| e.  Height of a student, in       | f.  Number of students absent on  |
|     centimetres                   |     a day                         |
|                                   |                                   |
| - Discrete                        | - Discrete                        |
|                                   |                                   |
| - Continuous                      | - Continuous                      |
+-----------------------------------+-----------------------------------+
| g.  Time for a Year 7 to swim 50  | h.  Score in a 10-question        |
|     m                             |     multi-choice quiz             |
|                                   |                                   |
| - Discrete                        | - Discrete                        |
|                                   |                                   |
| - Continuous                      | - Continuous                      |
+-----------------------------------+-----------------------------------+
| i.  Mass of a bag of rice         | j.  Number of heads when flipping |
|                                   |     3 coins                       |
| - Discrete                        |                                   |
|                                   | - Discrete                        |
| - Continuous                      |                                   |
|                                   | - Continuous                      |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - $\mathbf{P}\left( \mathbf{X = a} \right)\mathbf{= 0}$ **for     |
|   Continuous Random Variables**                                   |
+===================================================================+
| For a continuous random variable, the **probability of any single |
| exact value is 0**, because infinitely many values are possible   |
| in any interval.                                                  |
|                                                                   |
| In other words,                                                   |
| $\mathbf{P}\left( \mathbf{X = a} \right)\mathbf{= 0}$ for all     |
| $a$.                                                              |
|                                                                   |
| The probability that a student in the school is *exactly*         |
| 158.00000... cm is zero.                                          |
|                                                                   |
| You can only sensibly ask questions like 'what is the probability |
| of someone's height being between 150 and 160 cm;                 |
| $P(150 < X < 160)$?'                                              |
|                                                                   |
| Furthermore, because $P(X = a) = 0$ and $P(X = b) = 0$,           |
| **including or excluding endpoints makes no difference** when     |
| calculating the probability of a value lying within an interval.  |
|                                                                   |
| $$P(a < X < b) = P(a \leq X \leq b)$$                             |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------+
| - **Example** Estimate relative frequencies from class intervals                                         |
+=========================================================+================================================+
| The waiting times (minutes) for 40 patients at a clinic are summarised below:                            |
+---------------------------------------------------------+------------------------------------------------+
|   ----------------------------------------------------- | a.  Verify the relative frequencies sum to 1.  |
|             **Time**           **Freq**   **Relative    |                                                |
|                                           Freq**        | $$0.1 + 0.3 + 0.4 + 0.15 + 0.05 = 1$$          |
|   ---------------------------- ---------- ------------- |                                                |
|     $$0\  \leq \ t\  < \ 3$$   $$4$$      $$0.10$$      | b.  Estimate $P(X < 6).$                       |
|                                                         |                                                |
|     $$3\  \leq \ t\  < \ 6$$   $$12$$     $$0.30$$      | $${P(X < 6) = 0.1 + 0.3                        |
|                                                         | }{= 0.4}$$                                     |
|     $$6\  \leq \ t\  < \ 9$$   $$16$$     $$0.40$$      |                                                |
|                                                         | c.  Estimate $P(3 \leq X < 12).$               |
|    $$9\  \leq \ t\  < \ 12$$   $$6$$      $$0.15$$      |                                                |
|                                                         | $${P(3\  \leq \ X\  < \ 12) = 0.3 + 0.4 + 0.15 |
|    $$12\  \leq \ t\  < \ 15$$  $$2$$      $$0.05$$      | }{= 0.85}$$                                    |
|   ----------------------------------------------------- |                                                |
+---------------------------------------------------------+------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| a.  Using the same table above,   | b.  Using the same table above,   |
|     find                          |     find\                         |
|                                   |     $$P(3 \leq X < 15)$$          |
| $$P(X < 9)$$                      |                                   |
|                                   | 0.9                               |
| 0.8                               |                                   |
+-----------------------------------+-----------------------------------+
| A new sample has classes \[0, 4), \[4, 8), \[8, 12), \[12, 16)\       |
| with relative frequencies 0.08, 0.42, 0.36, 0.14.                     |
+-----------------------------------+-----------------------------------+
| c.  Find $P(X < 8)$               | d.  Find $P(4 \leq X < 12)$       |
|                                   |                                   |
| 0.5                               | 0.78                              |
+-----------------------------------+-----------------------------------+

[]{#_Toc228214833 .anchor}Foundation

1.  State whether each random variable is discrete or continuous.

    a.  The size of T-shirts worn by people

Discrete

b.  The speed of cars as they pass a certain point

continuous

c.  The volume of water in a dam

continuous

d.  The number of seats on an aeroplane

discrete

e.  The weight of babies born in August

Continuous

2.  ![](media/Random Variables 2_Continuous random variables/media/image2.png){width="1.9208333333333334in"
    height="2.057638888888889in"}![](media/Random Variables 2_Continuous random variables/media/image3.png){width="1.9222222222222223in"
    height="2.0in"}A simple experiment generated the following data:

    a.  Construct a frequency histogram and frequency polygon\
        (join centres of data points back to horizontal axis).

  -----------------------
   Score $x$   1   2   3
  ----------- --- --- ---
   Frequency   2   5   3
      $f$             

  -----------------------

b.  Calculate the total area of the histogram rectangles.

Total area = $1(2) + 1(5) + 1(3) = 10$

c.  Calculate the area under the frequency polygon.

Area under polygon = $10$ (triangles cut above fit into gaps below)

d.  What do you notice?

Both areas equal the total frequency.

e.  ![](media/Random Variables 2_Continuous random variables/media/image4.png){width="1.8846391076115485in"
    height="2.057638888888889in"}![](media/Random Variables 2_Continuous random variables/media/image5.png){width="1.852315179352581in"
    height="2.0in"}Add a row of relative frequencies (divide by total
    $n\  = \ 10$).

  -----------------------
   Score $x$   1   2   3
  ----------- --- --- ---
   Frequency   2   5   3
      $f$             

   Rel. Freq          
  -----------------------

$$0.2,0.5,0.3$$

f.  Construct a relative frequency histogram and polygon.

g.  Calculate the total area of the histogram rectangles.

$$Total\ area\  = \ 1(0.2) + 1(0.5) + 1(0.3) = 1$$

h.  Calculate the area under the relative frequency polygon.

Area under polygon = $1$

i.  What do you notice?

Both areas are the sum of the relative frequencies, 1

j.  What is the relationship between relative frequencies and the
    probabilities $P(X\  = \ x)$, according to the Law of Large Numbers?

With a large enough dataset, the relative frequency is an accurate
experimental estimate of the theoretical probability.

3.  The number of cars owned per household in a suburb is recorded from
    census data.\
    Results are shown in a relative frequency histogram.\
    (Relative frequencies equal probabilities since this is a
    population.)

![](media/Random Variables 2_Continuous random variables/media/image6.png){width="3.8625in"
height="2.515in"}

a.  What fraction of households have no cars?

$$P(\text{0 cars}) = \frac{1}{4}$$

b.  What fraction of households have fewer than 2 cars?

$$P(\text{fewer than 2}) = P(0) + P(1) = \frac{3}{4}$$

c.  What is the probability that a randomly selected household has three
    cars?

$$P(\text{3 cars}) = 0.1$$

d.  Planners advise additional on-street parking if more than 40% of
    households have 3 or more cars. Will they advise additional parking?

$P(\text{3 or more}) = 0.10 + 0.025 = 0.125 = 12.5\% < 40\%$.

Planners will not advise additional parking.

e.  Complete the probability distribution table $P(X = x)$ using the
    histogram.

  ----------------------------------
      $$x$$       0   1   2   3   4
  -------------- --- --- --- --- ---
   $$P(X = x)$$                  

  ----------------------------------

$0.25$, $0.50$, $0.125$, $0.10$, $0.025$

f.  Show the sum of probabilities is 1. How does this relate to the
    histogram area?

Sum = $0.25 + 0.5 + 0.125 + 0.1 + 0.025 = 1$.

The area of each rectangle =
$\text{width} \times \text{height} = 1 \times \text{relative frequency} = \text{probability}$.

Total area = sum of probabilities = $1$.

g.  Explain why the area under the relative frequency polygon equals the
    area of the histogram.

Each triangle above the polygon (cut off from a bar) fits into the gap
below the polygon on the other side of that same bar's edge.

Total area is unchanged.

h.  Show the mean number of cars per household is 1.15.

$E(X) = 0(0.25) + 1(0.5) + 2(0.125) + 3(0.1) + 4(0.025) = 0.5 + 0.25 + 0.3 + 0.1 = 1.15$.

This is a population average: for a large number of households, the
total cars divided by number of households approaches $1.15$.

i.  For a street of 100 households, how many cars in total would you
    expect?\
    Are the assumptions reasonable?

Expected cars = $100 \times 1.15 = 115$.

Assumption: the street's car-ownership distribution matches the suburb.

This may not hold, streets near train stations or in wealthier areas may
differ.

j.  Complete the cumulative probability table $P(X\  \leq \ x)$.

  -------------------------------------
        $$x$$        0   1   2   3   4
  ----------------- --- --- --- --- ---
   $$P(X \leq x)$$                  

  -------------------------------------

$0.25$, $0.75$, $0.875$, $0.975$, $1$

k.  Using horizontal lines at 0.25, 0.5, 0.75, find quartiles Q₁, Q₂,
    Q₃.

![](media/Random Variables 2_Continuous random variables/media/image7.png){width="3.244792213473316in"
height="3.43125in"}

$Q_{1}$ at $P = 0.25$ gives $x \approx 0.5$,

$Q_{2}$ at $P = 0.5$ gives $x = 1$,

$Q_{3}$ at $P = 0.75$ gives $x \approx 1.5$.

# Probability Density Functions

+-----------------------------------------------------------------------------+
| - **Review**                                                                |
+=============================================================================+
| - Integrate polynomials                                                     |
|                                                                             |
| +------------------------------+------------------------------------------+ |
| | a.                           | b.                                       | |
| |                              |                                          | |
| | $$\int_{2}^{5}{4x + 1}dx$$   | $$\int_{0}^{4}{\frac{3}{12}(4x + 1)}dx$$ | |
| +==============================+==========================================+ |
|                                                                             |
| - Identify sign of a function                                               |
|                                                                             |
| > Find the domain for which $f(x) > 0$                                      |
|                                                                             |
| +------------------------------+------------------------------+             |
| | a.  $f(x) = 2 - x$           | b.  $f(x) = x^{2} - 9$       |             |
| +==============================+==============================+             |
| | c.  $f(x) =$ $\frac{x}{8}$   | d.  $f(x) =$                 |             |
| |                              |     $\frac{3x^{2}}{32}$      |             |
| +------------------------------+------------------------------+             |
+-----------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------+
| - **Probability Density Functions**                                                                     |
+=========================================================================================================+
| A **probability density function (PDF)** is a smooth curve that models the distribution of a continuous |
| random variable. You can think of it as a relative frequency histogram where the class widths have been |
| made infinitely narrow.                                                                                 |
|                                                                                                         |
| For example, imagine we measured the heights of every year 12 girl in the state:                        |
|                                                                                                         |
| **Relative frequency histogram, range 150 -- 190 cm, grouped in 4 classes of 10 cm width.**             |
|                                                                                                         |
| ![](media/Random Variables 2_Continuous random variables/media/image8.png){width="4.117165354330709in"  |
| height="1.968503937007874in"}                                                                           |
|                                                                                                         |
| **10 classes of 4 cm width:**                                                                           |
|                                                                                                         |
| ![](media/Random Variables 2_Continuous random variables/media/image9.png){width="4.3182042869641295in" |
| height="1.968503937007874in"}                                                                           |
|                                                                                                         |
| **80 classes of 0.5 cm width:**                                                                         |
|                                                                                                         |
| ![](media/Random Variables 2_Continuous random variables/media/image10.png){width="4.13411854768154in"  |
| height="1.968503937007874in"}                                                                           |
|                                                                                                         |
| The **area under the curve** between any two values equals the probability that the variable falls in   |
| that interval.                                                                                          |
+---------------------------------------------------------------------------------------------------------+
| - **Verifying Probability Density Functions**                                                           |
+---------------------------------------------------------------------------------------------------------+
| A function $f(x)$ is a PDF in the domain $\lbrack a,b\rbrack$ if and only if:                           |
|                                                                                                         |
| $$1.\ \ \ f(x) \geq \ 0\ for\ all\ x\ in\ \lbrack a,\ b\rbrack$$                                        |
|                                                                                                         |
| $$2.\ \ \int_{a}^{b}{f(x)}dx = 1$$                                                                      |
+---------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Determine whether function is a probability density function                                                                                                      |
+===================================================================+=============================================================================================================+
| Determine whether the function is a valid probability density function.                                                                                                         |
|                                                                                                                                                                                 |
| $$f(x) = \left\{ \begin{array}{r}                                                                                                                                               |
| \frac{x}{8}\ \ \ \ \ 0 \leq x \leq 4 \\                                                                                                                                         |
| 0\ \ \ \ \ \ otherwise                                                                                                                                                          |
| \end{array} \right.\ $$                                                                                                                                                         |
+-------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| $$1.\ \ \ f(x) \geq \ 0\ for\ all\ x\ in\ \lbrack a,\ b\rbrack:$$ | $$2.\ \ \int_{a}^{b}{f(x)}dx = 1$$                                                                          |
|                                                                   |                                                                                                             |
| $$\frac{x}{8} \geq 0\ for\ x \geq 0,\ $$                          | $$\int_{0}^{4}\frac{x}{8}dx = \left\lbrack \frac{x^{2}}{16} \right\rbrack_{0}^{4} = \frac{16}{16} - 0 = 1$$ |
|                                                                   |                                                                                                             |
| $$\therefore f(x) = \frac{x}{8} \geq 0\ for\ 0 \leq x \leq 4$$    | $\therefore$ area under the curve in given region is 1.                                                     |
+-------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| In $\lbrack 0,4\rbrack,f(x)$ is always positive and its integral is 1. Therefore, it is a PDF.                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                  |
+=================================================+======================================================+
| Determine whether these functions are valid PDFs                                                       |
+-------------------------------------------------+------------------------------------------------------+
| a.                                              | b.                                                   |
|                                                 |                                                      |
| $$f(x) = \frac{x}{18}\ on\ \lbrack 0,6\rbrack$$ | $$f(x) = \frac{3x^{2}}{26}\ on\ \lbrack 1,3\rbrack$$ |
|                                                 |                                                      |
| yes                                             | yes                                                  |
+-------------------------------------------------+------------------------------------------------------+
| c.                                              | d.                                                   |
|                                                 |                                                      |
| $f(x) = x^{2} - 3\ on\ \lbrack 0,3\rbrack$      | $$f(x) = x - 1\ on\ \lbrack 1,3\rbrack$$             |
|                                                 |                                                      |
| No, not always positive                         | No, integral not 1                                   |
+-------------------------------------------------+------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  A PDF must satisfy two conditions: $f(x) \geq 0$ for all $x$  |
|     in the domain, and the integral over the domain equals        |
|     .....................                                         |
+-------------------------------------------------------------------+
| - **Example** Solve problems involving finding a constant in a    |
|   PDF                                                             |
+-------------------------------------------------------------------+
| A continuous probability distribution function has the function   |
| $f(x) = ax^{2}$ defined on $\lbrack 1,\ 4\rbrack.$                |
|                                                                   |
| Find the value of $a$.                                            |
|                                                                   |
| $${\int_{1}^{4}{ax^{2}}dx = 1                                     |
| }{a\left\lbrack \frac{x^{3}}{3} \right\rbrack_{1}^{4} = 1         |
| }{a\left( \frac{64}{3} - \frac{1}{3} \right) = 1                  |
| }{21a = 1                                                         |
| }{a = \frac{1}{21}}$$                                             |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| Find the value of the constant if $f(x)$ is a valid PDF in the given  |
| domain.                                                               |
+-----------------------------------+-----------------------------------+
| a.  $f(x) = ax^{2}$ on            | b.  $f(x) = ax^{3}$ on            |
|     $\lbrack 0,\ 3\rbrack$        |     $\lbrack 1,\ 4\rbrack$        |
|                                   |                                   |
| $$\frac{1}{9}$$                   | $$\frac{4}{255}$$                 |
+-----------------------------------+-----------------------------------+
| c.  $f(x) = kx$ on                | d.  $f(x) = ae^{x}$ on            |
|     $\lbrack 2,\ 6\rbrack$        |     $\lbrack 0,\ 2\rbrack$        |
|                                   |                                   |
| $$\frac{1}{16}$$                  | $$\frac{1}{e^{2} - 1}$$           |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The area under a probability density function must sum to     |
|     ........., this means the integral over the domain must also  |
|     equal ............                                            |
|                                                                   |
| 2.  To find an unknown constant in a PDF, set the integral over   |
|     the domain to equal ......                                    |
+-------------------------------------------------------------------+

[]{#_Toc228214834 .anchor}Foundation

1.  Which of the following functions describe continuous probability
    distributions?

    a.  $f(x) = 0.2$ in the domain $\lbrack 1,\ 6\rbrack$

$f(x)$ always positive

$$\int_{1}^{6}{0.2}\ dx\  = \ 0.2(5) = \ 1,\ f(x) \geq \ 0$$

Valid PDF.

b.  $f(x) =$ $\frac{x}{12}$ in the domain $\lbrack 0,\ 6\rbrack$

$f(x)$ always positive when $x > 0$

$$\int_{0}^{6}\left( \frac{x}{12} \right)dx\  = \ \left\lbrack \frac{x^{2}}{24} \right\rbrack_{0}^{6} = \frac{3}{2} \neq \ 1$$

Not a PDF.

c.  $f(x) =$ $\frac{x^{3}}{324}$ for $0\  \leq \ x\  \leq \ 3$

$f(x)$ always positive for $x > 0$

$$\int_{0}^{3}\left( \frac{x^{3}}{324} \right)dx\  = \ \left\lbrack \frac{x^{4}}{1296} \right\rbrack_{0}^{3} = \frac{81}{1296} = \frac{1}{16} \neq \ 1$$

Not a PDF.

d.  $f(x) =$ $\frac{x^{2}}{21}$ in the interval
    $1\  \leq \ x\  \leq \ 4$

$f(x)$ always positive

$$\int_{1}^{4}\left( \frac{x^{2}}{21} \right)dx\  = \ \left\lbrack \frac{x^{3}}{63} \right\rbrack_{1}^{4} = \frac{63}{63} = \ 1,\ f(x) \geq \ 0$$

Valid PDF.

e.  $f(x) =$ $\frac{x}{8}$ for $1\  \leq \ x\  \leq \ 8$

$f(x)$ always positive for $x > 0$

$$\int_{1}^{8}\left( \frac{x}{8} \right)dx\  = \ \left\lbrack \frac{x^{2}}{16} \right\rbrack_{1}^{8} = \frac{63}{16} \neq \ 1$$

Not a PDF.

4.  Given the continuous probability distribution $f(x)\  = \ kx³$ for
    $0\  \leq \ x\  \leq \ 5$, 0 for all other $x$, find the value of
    $k$.

$$\int_{0}^{5}\left( kx^{3} \right)dx\  = \ k\left\lbrack \frac{x^{4}}{4} \right\rbrack_{0}^{5} = \frac{625k}{4} = \ 1$$

$$k\  = \frac{4}{625}$$

5.  Which of the following graphs are probability density functions?

+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Random Variables 2_Continuous random variables/media/image11.png){width="2.4642771216097987in" | b.  ![](media/Random Variables 2_Continuous random variables/media/image11.png){width="2.4621205161854767in" |
|     height="1.3785958005249344in"}                                                                           |     height="1.3773895450568678in"}                                                                           |
|                                                                                                              |                                                                                                              |
| $$Area\  = \ \left( \frac{1}{6} \right)(6) = \ 1,\ f(x) \geq \ 0$$                                           | $$Area\  = \ \left( \frac{1}{10} \right)(12) = \frac{12}{10} \neq \ 1$$                                      |
|                                                                                                              |                                                                                                              |
| Valid PDF.                                                                                                   | Not a PDF.                                                                                                   |
+==============================================================================================================+==============================================================================================================+
| c.  ![](media/Random Variables 2_Continuous random variables/media/image11.png){width="2.4621205161854767in" | d.  ![](media/Random Variables 2_Continuous random variables/media/image11.png){width="2.4621205161854767in" |
|     height="1.3773895450568678in"}                                                                           |     height="1.3773895450568678in"}                                                                           |
|                                                                                                              |                                                                                                              |
| $$Area\  = \ \left( \frac{1}{2} \right)(20)\left( \frac{1}{10} \right) = \ 1,\ f(x) \geq \ 0$$               | $$Area\  = \ \left( \frac{1}{2} \right)(9)\left( \frac{1}{9} \right) = \frac{1}{2} \neq 1$$                  |
|                                                                                                              |                                                                                                              |
| Valid PDF.                                                                                                   | Not a PDF..                                                                                                  |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+

6.  Find $c$, given $f(x)$ is a PDF on the given domain.

    a.  $y\  = \ cx⁴,$ domain $\lbrack 0,\ 3\rbrack$

$$\int_{0}^{3}cx^{4}\, dx = \frac{243c}{5} = 1$$

$$c = \frac{5}{243}$$

b.  $y\  = \ c$, domain $\lbrack 0,\ 6\rbrack$

$$6c = 1$$

$$c = \frac{1}{6}$$

c.  $y\  = \ c$, domain $\lbrack - 5,\ 5\rbrack$

$$10c = 1$$

$$c = \frac{1}{10}$$

7.  Find $c$, given $f(x)$ is a PDF on the given domain.

    a.  $f(x)\  = \ \frac{8}{3}(1\  - \ x),\$domain
        $\lbrack 0,\ c\rbrack$

$$\frac{8}{3}\int_{0}^{c}(1 - x)\, dx = \frac{8}{3}\left( c - \frac{c^{2}}{2} \right) = 1$$

$$4c^{2} - 8c + 3 = 0$$

$$(2c - 1)(2c - 3) = 0.\ c = \frac{1}{2}or\ c = \frac{3}{2}$$

For $f(x) \geq 0$, need $1 - x \geq 0$ throughout, so $c \leq 1$.

$$c = \frac{1}{2}$$

Development

8.  A function is given by $f(x) =$ $\frac{x^{2}}{72}$. Over what domain
    starting at $x\  = \ 0$ is this a PDF?

$$\int_{0}^{b}\left( \frac{x^{2}}{72} \right)dx\  = \ \left\lbrack \frac{x^{3}}{216} \right\rbrack_{0}^{b} = \frac{b^{3}}{216} = \ 1$$

$$b^{3} = \ 216,\ b\  = \ 6.\ Domain\ \lbrack 0,\ 6\rbrack$$

9.  A PDF is given by $f(x) =$ $\frac{2x^{5}}{87381}$ over the interval
    $1\  \leq \ x\  \leq \ b$. Find the value of $b$.

$$\int_{1}^{b}\left( \frac{2x^{5}}{87381} \right)dx\  = \ \left( \frac{2}{87381} \right)\left\lbrack \frac{x^{6}}{6} \right\rbrack_{1}^{b} = \frac{b^{6} - \ 1}{262143} = \ 1$$

$$b^{6} = \ 262144\  = \ 8^{6},\ b\  = \ 8$$

10. A PDF is given by $f(x)\  = \ ae^{x}$ over a certain domain. Find
    the exact value of $a$ if the domain is:

    a.  $\lbrack 1,\ 7\rbrack$

    b.  $\lbrack 0,\ 4\rbrack$

$$a)\ \ a\left( e^{7} - \ e \right) = \ 1$$

$$\ a\  = \frac{1}{e\left( e^{6} - \ 1 \right)}$$

$$b)\ \ a\left( e^{4} - \ 1 \right) = \ 1$$

$$a\  = \frac{1}{e^{4} - \ 1}$$

11. Let $f(x) =$ $\frac{3}{4}$ $\left( x^{2} - \ 4x\  + \ 3 \right)$ be
    defined on \[0, 4\].

    a.  Show that $\int_{0}^{4}{f(x)}dx\  = \ 1$.

$$\int_{0}^{4}\frac{3}{4}\left( x^{2} - 4x + 3 \right)\, dx = \frac{3}{4}\left\lbrack \frac{x^{3}}{3} - 2x^{2} + 3x \right\rbrack_{0}^{4}$$

$$= \frac{3}{4}\left( \frac{64}{3} - 32 + 12 \right)$$

$$= \frac{3}{4}\left( \frac{4}{3} \right) = 1$$

b.  Show that $f(x)$ is not a valid PDF.

$f(x) = \frac{3}{4}(x - 1)(x - 3)$.

For $1 < x < 3$, $(x - 1) > 0$ and $(x - 3) < 0$, so $f(x) < 0$.

Not a valid PDF as $f(x)$ is not always positive.

# Calculating Probabilities using Integration

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                                                                                                                      |
+===================================================================================================================================================================================================================+
| - ![A graph with numbers and a bar AI-generated content may be incorrect.](media/Random Variables 2_Continuous random variables/media/image12.png){width="2.5555555555555554in"                                   |
|   height="1.7742104111986001in"}Estimate probability in an interval using the relative frequency of classes                                                                                                       |
|                                                                                                                                                                                                                   |
| +--------------------+--------------------+--------------------+                                                                                                                                                  |
| | a.  Find           | b.  Find           | c.  $P(X \geq 2)$  |                                                                                                                                                  |
| |     $P(X = 1)$     |     $P(X \leq 1)$  |                    |                                                                                                                                                  |
| +====================+====================+====================+                                                                                                                                                  |
|                                                                                                                                                                                                                   |
| - Work with area of a rectangle                                                                                                                                                                                   |
|                                                                                                                                                                                                                   |
| > The area of these rectangles is 1. Find the missing length.                                                                                                                                                     |
|                                                                                                                                                                                                                   |
| +--------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------+ |
| | a.  ![](media/Random Variables 2_Continuous random variables/media/image13.png){width="1.7800240594925634in" | b.  ![](media/Random Variables 2_Continuous random variables/media/image14.png){width="1.75in" | |
| |     height="0.9779418197725285in"}                                                                           |     height="0.9779407261592301in"}                                                             | |
| +==============================================================================================================+================================================================================================+ |
|                                                                                                                                                                                                                   |
| - ![](media/Random Variables 2_Continuous random variables/media/image15.png){width="2.4458333333333333in" height="1.7013888888888888in"}Recall uniform distribution properties.\                                 |
|   Consider the uniform distribution below. What is meant by a uniform distribution?                                                                                                                               |
|                                                                                                                                                                                                                   |
| A probability distribution is uniform if the probability of each outcome is .....................                                                                                                                 |
|                                                                                                                                                                                                                   |
| - Recall PDF properties                                                                                                                                                                                           |
|                                                                                                                                                                                                                   |
| The area under a PDF must sum to ............                                                                                                                                                                     |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **The Probability is the Definite Integral**                                                                                                                                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Random Variables 2_Continuous random variables/media/image16.png){width="3.4861122047244093in" height="2.019808617672791in"}For a probability density function (PDF) $f(x)$ defined on                  |
| $\lbrack a,b\rbrack,$ the probability that $X$ falls between $c$ and $d$ is:                                                                                                                                      |
|                                                                                                                                                                                                                   |
| $$P(c \leq X \leq d) = \int_{c}^{d}{f(x)}\, dx,\quad a \leq c \leq d \leq b$$                                                                                                                                     |
|                                                                                                                                                                                                                   |
| If the requested interval extends beyond the domain, the limits of integration are restricted to the domain boundary. For a PDF defined on \[1, 4\]:                                                              |
|                                                                                                                                                                                                                   |
| $P(X \leq 3)$ integrates from 1 to 3, not from $- \infty$ or 0.                                                                                                                                                   |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** integral from probability notation                                                                             |
+============================================+============================================+=====================================+
| Consider a PDF $f(x)$ defined for the domain $\lbrack 1,\ 4\rbrack$. Write the integral for:                                  |
+--------------------------------------------+--------------------------------------------+-------------------------------------+
| a.  $P(2 \leq X \leq 3)$                   | b.  $P(0 \leq X \leq 3)$                   | c.  $P(2\  \leq \ X\  \leq \ 5)$    |
|                                            |                                            |                                     |
| $$\ \ \ \ \ \ \ \ \ \int_{2}^{3}{f(x)}dx$$ | $$\ \ \ \ \ \ \ \ \ \int_{1}^{3}{f(x)}dx$$ |                                     |
+--------------------------------------------+--------------------------------------------+-------------------------------------+
| d.  $P(X\  \leq \ 3)$                      | e.  $P(X\  \geq \ 2)$                      | f.  $P( - 1\  \leq \ X\  \leq \ 6)$ |
+--------------------------------------------+--------------------------------------------+-------------------------------------+
| g.  $P(1.5\  \leq \ X\  \leq \ 4)$         | h.  $P(X\  \leq \ 5)$                      | i.  $P(X\  \geq \ 0)$               |
+--------------------------------------------+--------------------------------------------+-------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate probability of a PDF by integration                                                           |
+===========================================================+===========================================================+
| The continuous random variable $X$ has PDF                                                                            |
|                                                                                                                       |
| $$f(x) = \frac{x^{2}}{21}\ on\ \lbrack 1,\ 4\rbrack$$                                                                 |
+-----------------------------------------------------------+-----------------------------------------------------------+
| Find $P(2 \leq X \leq 3)$                                 | Find $P(X \geq 3)$                                        |
|                                                           |                                                           |
| $$\ \ \ \ \ \int_{2}^{3}\frac{x^{2}}{21}dx$$              | $$\ \ \ \ \ \int_{3}^{4}\frac{x^{2}}{21}dx$$              |
|                                                           |                                                           |
| $$= \left\lbrack \frac{x^{3}}{63} \right\rbrack_{2}^{3}$$ | $$= \left\lbrack \frac{x^{3}}{63} \right\rbrack_{3}^{4}$$ |
|                                                           |                                                           |
| $$= \frac{27}{63} - \frac{8}{63}$$                        | $$= \frac{64}{63} - \frac{27}{63}$$                       |
|                                                           |                                                           |
| $$= \frac{19}{63}$$                                       | $$= \frac{37}{63}$$                                       |
+-----------------------------------------------------------+-----------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| A continuous random variable is given by $f(x) =$                     |
| $\frac{3x^{2}}{117}\$on $\lbrack 2,\ 5\rbrack$. Find:                 |
+-----------------------------------+-----------------------------------+
| a.  $P(3 \leq X \leq 4)$          | b.  $P(X \leq 4)$                 |
|                                   |                                   |
| $$\frac{37}{117}$$                | $$\frac{56}{117}$$                |
+-----------------------------------+-----------------------------------+
| For $f(x) =$ $\frac{x^{2}}{21}$, find the value of $c$ such that      |
| $P(1 \leq X \leq c) =$ $\frac{1}{2}$.                                 |
|                                                                       |
| $$\sqrt[3]{\frac{65}{2}}$$                                            |
+-----------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  For a continuous PDF, the integral $\int_{a}^{b}{f(x)}dx$     |
|     finds $P($ .................. )                               |
|                                                                   |
| 2.  If a requested interval extends beyond the domain, the        |
|     integration limits are ........................... to the     |
|     domain boundary.                                              |
+-------------------------------------------------------------------+

[]{#_Toc228214835 .anchor}

+---------------------------------------------------------------------------------------------------------+
| - **Investigation** Uniform probability distribution functions                                          |
+=========================================================================================================+
| Consider a uniform continuous probability distribution in the domain $\lbrack 5,\ 15\rbrack$.           |
|                                                                                                         |
| ![](media/Random Variables 2_Continuous random variables/media/image17.png){width="3.013888888888889in" |
| height="1.98125in"}                                                                                     |
|                                                                                                         |
| A uniform distribution has equal probabilities throughout its domain, this means $f(x)$ is              |
| ..................                                                                                      |
|                                                                                                         |
| The area under the graph is therefore the shape of a ........................                           |
|                                                                                                         |
| The area of the rectangle is ............                                                               |
|                                                                                                         |
| The width of the rectangle is ............                                                              |
|                                                                                                         |
| ![](media/Random Variables 2_Continuous random variables/media/image18.png){width="2.548611111111111in" |
| height="1.78125in"}Therefore, the height of the rectangle is ............                               |
|                                                                                                         |
| So, $f(x) =$ ............                                                                               |
|                                                                                                         |
| Generalising: For a uniform PDF defined for $\lbrack a,b\rbrack$,                                       |
|                                                                                                         |
| The area of the rectangle is ............                                                               |
|                                                                                                         |
| The width of the rectangle is ............                                                              |
|                                                                                                         |
| So $f(x) =$ ............                                                                                |
+---------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------+
| - **Uniform Distributions**                                                                              |
+==========================================================================================================+
| ![](media/Random Variables 2_Continuous random variables/media/image19.png){width="2.7227427821522308in" |
| height="1.968503937007874in"}For a **uniformly distributed** PDF on $\lbrack a,b\rbrack$,                |
|                                                                                                          |
| The PDF is                                                                                               |
|                                                                                                          |
| $$f(x) = \left\{ \begin{array}{r}                                                                        |
| \frac{1}{b - a}\ \ \ \ \ for\ a \leq x \leq b \\                                                         |
| \ \ \ 0\ \ \ \ \ \ \ \ \ \ otherwise\ \ \ \ \                                                            |
| \end{array} \right.\ $$                                                                                  |
+----------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate probability for a uniform PDF                                                                                                |
+==========================================+===========================================================================================================+
| The continuous random variable $X$ is uniformly distributed on $\lbrack 2,\ 8\rbrack$.                                                               |
+------------------------------------------+-----------------------------------------------------------------------------------------------------------+
| Find the PDF $f(x)$.                     | Find $P(X \leq 5)$.                                                                                       |
|                                          |                                                                                                           |
| $$f(x) = \frac{1}{8 - 2} = \frac{1}{6}$$ | $${\int_{2}^{5}\frac{1}{6}dx = \left\lbrack \frac{x}{6} \right\rbrack_{2}^{5} = \frac{5}{6} - \frac{2}{6} |
|                                          | }{= \frac{1}{2}}$$                                                                                        |
+------------------------------------------+-----------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| $X$ is a continuous random variable defined on                        |
| $\lbrack 7,\ 17\rbrack.$                                              |
+-----------------------------------+-----------------------------------+
| a.  Find the PDF $f(x)$           | b.  Find $P(X > 10)$              |
|                                   |                                   |
| $$f(x) = \frac{1}{10}$$           | $$\frac{7}{10}$$                  |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  A uniform distribution function defined for                   |
|     $\lbrack a,b\rbrack$ is the c..................... function:  |
|                                                                   |
| $f(x) =$ ..................                                       |
+-------------------------------------------------------------------+

Foundation

12. ![](media/Random Variables 2_Continuous random variables/media/image20.png){width="2.380249343832021in"
    height="1.3534186351706037in"}For the continuous probability
    distribution graphed, find:

+----------------------------------------------+----------------------------------------------+
| a.  $P(X\  \leq \ 3)\$                       | b.  $P(1\  \leq \ X\  \leq \ 2)$             |
|                                              |                                              |
| $$P(X\  \leq \ 3) = \frac{1}{2}$$            | $$P(1\  \leq \ X\  \leq \ 2) = \frac{1}{6}$$ |
+==============================================+==============================================+
| c.  $P(1\  \leq \ X\  \leq \ 4)$             | d.  $P(X\  < \ 4)$                           |
|                                              |                                              |
| $$P(1\  \leq \ X\  \leq \ 4) = \frac{1}{2}$$ | $$P(X\  < \ 4) = \frac{2}{3}$$               |
+----------------------------------------------+----------------------------------------------+
| e.  $P(X\  \geq \ 4)$                        | Probability is the area under the curve,     |
|                                              |                                              |
| $$P(X\  \geq \ 4) = \frac{1}{3}$$            | so, for a uniform distribution:              |
|                                              | $\frac{1}{6}$ $\times width$                 |
+----------------------------------------------+----------------------------------------------+

13. ![](media/Random Variables 2_Continuous random variables/media/image21.png){width="2.654861111111111in"
    height="1.5222222222222221in"}A PDF is shown with $f(x)\  = \ ax$.

    a.  Find the equation of the linear function $y\  = \ ax$.

$$\int_{0}^{10}(ax)dx\  = \ 50a\  = \ 1$$

$$a\  = \frac{1}{50}$$

$$y\  = \frac{x}{50}$$

b.  Find:

+---------------------------------------------------------------------------+--------------------------------------------------------------------------+---------------------------------------------------------------------------+
| i.  $P(X\  < \ 9)$                                                        | ii. $P(X\  \leq \ 3)\ \ \ \ \$                                           | iii. $P(4\  \leq \ X\  \leq \ 7)\$                                        |
|                                                                           |                                                                          |                                                                           |
| $$\left\lbrack \frac{x^{2}}{100} \right\rbrack_{0}^{9} = \frac{81}{100}$$ | $$\left\lbrack \frac{x^{2}}{100} \right\rbrack_{0}^{3} = \frac{9}{100}$$ | $$\left\lbrack \frac{x^{2}}{100} \right\rbrack_{4}^{7} = \frac{33}{100}$$ |
+===========================================================================+==========================================================================+===========================================================================+
| iv. $P(2\  < \ X\  < \ 6)\ \ \ \ \$                                       | v.  $P(X\  > \ 5)$                                                       |                                                                           |
|                                                                           |                                                                          |                                                                           |
| $$\left\lbrack \frac{x^{2}}{100} \right\rbrack_{2}^{6} = \frac{8}{25}$$   | $$\left\lbrack \frac{x^{2}}{100} \right\rbrack_{5}^{10} = \frac{3}{4}$$  |                                                                           |
+---------------------------------------------------------------------------+--------------------------------------------------------------------------+---------------------------------------------------------------------------+

Development

14. a.  Show that the uniform distribution $f(x) =$
        $\frac{1}{b\  - \ a}$ for $a\  \leq \ x\  \leq \ b$, 0 for all
        other $x$, is a PDF.

$$Area\  = \ (b\  - \ a) \times \frac{1}{b\  - \ a} = \ 1$$

$$f(x) \geq \ 0\ on\ \lbrack a,\ b\rbrack.\ $$

Therefore, it is a PDF.

b.  If $a\  = \ 3$ and $b\  = \ 7$, find:

    i.  $P(X\  \leq \ 6)\ \ \ \ \$

    ii. $P(X\  \geq \ 5)\ \ \ \ \$

    iii. $P(5\  \leq \ X\  \leq \ 6)$

$$b.\ With\ a\  = \ 3,\ b\  = \ 7,\ f(x) = \frac{1}{4}on\ \lbrack 3,\ 7\rbrack$$

$$i.\ P(X\  \leq \ 6) = \ \left( \frac{1}{4} \right)(3) = \frac{3}{4}$$

$$ii.\ P(X\  \geq \ 5) = \ \left( \frac{1}{4} \right)(2) = \frac{1}{2}$$

$$iii.\ P(5\  \leq \ X\  \leq \ 6) = \ \left( \frac{1}{4} \right)(1) = \frac{1}{4}$$

15. The continuous PDF is defined by $f(x)\  = \ ax²$ in the domain \[0,
    5\].

    a.  Evaluate $a$.

$$\int_{0}^{5}\left( {ax}^{2} \right)dx\  = \frac{125a}{3} = \ 1$$

$$a\  = \frac{3}{125}$$

b.  Find:

+---------------------------------------------------------------------------+---------------------------------------------------------------------------+----------------------------------------------------------------------------+
| i.  $P(X\  \leq \ 3)\ \ \ \ \$                                            | ii. $P(1\  < \ X\  < \ 4)\ \ \ \ \ \ \ \$                                 | iii. $P(X\  > \ 2)\ \$                                                     |
|                                                                           |                                                                           |                                                                            |
| $$\left\lbrack \frac{x^{3}}{125} \right\rbrack_{0}^{3} = \frac{27}{125}$$ | $$\left\lbrack \frac{x^{3}}{125} \right\rbrack_{1}^{4} = \frac{63}{125}$$ | $$\left\lbrack \frac{x^{3}}{125} \right\rbrack_{2}^{5} = \frac{117}{125}$$ |
+===========================================================================+===========================================================================+============================================================================+

16. ![](media/Random Variables 2_Continuous random variables/media/image22.png){width="1.6826388888888888in"
    height="1.5222222222222221in"}The continuous random variable $X$ has
    PDF $f(x)\  = \ ax³$ on \[0, 3\].

    a.  Evaluate $a$.

$$\int_{0}^{3}\left( {ax}^{3} \right)dx\  = \frac{81a}{4} = \ 1$$

$$a\  = \frac{4}{81}$$

b.  Find:

+-------------------------------------------------------------------------+-------------------------------------------------------------------------+
| i.  $P(1\  \leq \ X\  \leq \ 3)$                                        | ii. $P(X\  < \ 2)$                                                      |
|                                                                         |                                                                         |
| $$\left\lbrack \frac{x^{4}}{81} \right\rbrack_{1}^{3} = \frac{80}{81}$$ | $$\left\lbrack \frac{x^{4}}{81} \right\rbrack_{0}^{2} = \frac{16}{81}$$ |
+=========================================================================+=========================================================================+

17. A continuous probability function is given by $f(x)\  = \ keˣ$,
    defined on \[1, 6\].

    a.  Find the exact value of $k$.

$$\int_{1}^{6}\left( ke^{x} \right)dx\  = \ k\left( e^{6} - \ e \right) = \ 1$$

$$k\  = \frac{1}{e\left( e^{5} - \ 1 \right)}$$

b.  Find each exact probability:

+--------------------------------------------------------------------+--------------------------------------------------+-----------------------------------------------------------+
| i.  $P(2\  \leq \ X\  \leq \ 5)$                                   | ii. $P(X\  < \ 4)$                               | iii. $P(X\  \geq \ 3)$                                    |
|                                                                    |                                                  |                                                           |
| $$P(2\  \leq \ X\  \leq \ 5) = \ k\left( e^{5} - \ e^{2} \right)$$ | $$P(X\  < \ 4) = \ k\left( e^{4} - \ e \right)$$ | $$P(X\  \geq \ 3) = \ k\left( e^{6} - \ e^{3} \right)$$   |
|                                                                    |                                                  |                                                           |
| $$= \frac{e\left( e^{3} - \ 1 \right)}{e^{5} - \ 1}$$              | $$= \frac{e^{3} - \ 1}{e^{5} - \ 1}$$            | $$= \frac{e^{2}\left( e^{3} - \ 1 \right)}{e^{5} - \ 1}$$ |
+====================================================================+==================================================+===========================================================+

18. a.  Show that $y\  = \ \sin\ x$ is a PDF in the domain
        $\left\lbrack 0,\frac{\pi}{2} \right\rbrack$.

$$\int_{0}^{\frac{\pi}{2}}\sin x\ \ dx\  = \ \left\lbrack - \cos\ x \right\rbrack_{0}^{\frac{\pi}{2}} = \  - \cos\left( \frac{\pi}{2} \right) + \ \cos(0) = \ 0\  + \ 1\  = \ 1.$$

$\sin\ x\  \geq \ 0\ on\ \left\lbrack 0,\frac{\pi}{2} \right\rbrack$

b.  Find each exact probability:

+---------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
| i.  $P\left( X\  \leq \frac{\pi}{3} \right)$                                                            | ii. $P\left( 0\  < \ X\  < \frac{\pi}{4} \right)$                                               | iii. $P\left( X\  > \frac{\pi}{6} \right)$                                                         |
|                                                                                                         |                                                                                                 |                                                                                                    |
| $$P\left( X\  \leq \frac{\pi}{3} \right) = \ \left\lbrack - \cos\ x \right\rbrack_{0}^{\frac{\pi}{3}}$$ | $$P\left( 0\  < \ X\  < \frac{\pi}{4} \right) = \ \lbrack - cos\ x\rbrack_{0}^{\frac{\pi}{4}}$$ | $$P$$                                                                                              |
|                                                                                                         |                                                                                                 |                                                                                                    |
| $$= \  - \frac{1}{2} + \ 1\  = \frac{1}{2}$$                                                            | $$= \ 1\  - \frac{1}{\sqrt{2}} = \frac{\sqrt{2} - \ 1}{\sqrt{2}}$$                              | $$\left( X\  > \frac{\pi}{6} \right) = \ \lbrack - cos\ x\rbrack_{\frac{\pi}{6}}^{\frac{\pi}{2}}$$ |
|                                                                                                         |                                                                                                 |                                                                                                    |
|                                                                                                         |                                                                                                 | $$= \ 0\  + \frac{\sqrt{3}}{2} = \frac{\sqrt{3}}{2}$$                                              |
+=========================================================================================================+=================================================================================================+====================================================================================================+

# Mode of a Continuous Distribution

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                                                                                                                                                                                                                                                  |
+===============================================================================================================================================================================================================================================================================================================================================+
| - Identify mode from a histogram                                                                                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                                               |
| +--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+ |
| | a.  ![](media/Random Variables 2_Continuous random variables/media/image23.png){width="1.7708333333333333in" | b.  ![](media/Random Variables 2_Continuous random variables/media/image24.png){width="1.7708333333333333in" | c.  ![](media/Random Variables 2_Continuous random variables/media/image25.png){width="1.617361111111111in" | |
| |     height="1.7440419947506562in"}                                                                           |     height="1.73125in"}                                                                                      |     height="1.73125in"}                                                                                     | |
| +==============================================================================================================+==============================================================================================================+=============================================================================================================+ |
|                                                                                                                                                                                                                                                                                                                                               |
| - Find global maxima                                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                               |
| Find global minima and maxima in the domain $\lbrack 0.5,\ 5\rbrack$ for $f(x) = x^{3} - 6x^{2} + 9x - 4$.                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                                                               |
| Remember to confirm the nature of the point and check the endpoints of the domain.                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                                               |
| global max at $(5,16)$                                                                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                               |
| global min at $(3, - 4)$                                                                                                                                                                                                                                                                                                                      |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Mode of a Continuous Distribution**                           |
+===================================================================+
| The mode is the value of $x$ at which the PDF reaches its         |
| maximum.                                                          |
|                                                                   |
| To find the mode, we find the PDF's maximum turning point.        |
|                                                                   |
| 1.  Differentiate $f(x)$                                          |
|                                                                   |
| 2.  Solve $f'(x) = 0$                                             |
|                                                                   |
| 3.  Check $x$ is in the domain of $f(x)$                          |
|                                                                   |
| 4.  Confirm it is the global maximum using the second derivative  |
|     or a gradient table, and by checking the function value at    |
|     the boundaries.                                               |
|                                                                   |
| - For a function that is always increasing $f'(x) > 0$, the mode  |
|   is the end of its domain.                                       |
|                                                                   |
| - For a function that is always decreasing $f'(x) < 0$, the mode  |
|   is the start of its domain.                                     |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------+
| - **Example** Find the mode of a continuous probability function                                   |
+=================================================+==================================================+
| A continuous random variable $X$ has PDF defined on $\lbrack 0,4\rbrack$: $f(x) =$                 |
| $\frac{3x(4 - x)}{32}$                                                                             |
|                                                                                                    |
| Find its mode.                                                                                     |
+-------------------------------------------------+--------------------------------------------------+
| 1\. Differentiate                               | 3\. Check domain                                 |
|                                                 |                                                  |
| $${f(x) = \frac{3}{32}\left( 4x - x^{2} \right) | $x = 2$ is in $\lbrack 0,\ 4\rbrack$ ✓           |
| }{f'(x) = \frac{3}{32}(4 - 2x)                  |                                                  |
| }{f'(x) = \frac{3}{16}(2 - x)}$$                | 4\. Check maximum                                |
|                                                 |                                                  |
| 2\. Solve $f'(x) = 0$                           | $$f^{''}(x) = - \frac{3}{16} < 0\therefore\max$$ |
|                                                 |                                                  |
| $$0 = \frac{3}{16}(2 - x)$$                     | $$f(0) = 0,\ \ f(2) = \frac{3}{8},\ \ f(4) = 0$$ |
|                                                 |                                                  |
| $$x = 2$$                                       | $\therefore x = 2$ is the mode.                  |
+-------------------------------------------------+--------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| a.  Find the mode of $f(x) =$     | b.  Find the mode of $f(x) =$     |
|     $\frac{x(6 - x)}{18}$ on      |     $\frac{3x^{2}}{26}$ on        |
|     $\lbrack 0,\ 6\rbrack$.       |     $\lbrack 1,3\rbrack$.         |
|                                   |                                   |
| $$x = 3$$                         | $$x = 3$$                         |
+-----------------------------------+-----------------------------------+

Foundation

1.  Find the mode of each continuous probability distribution.

+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Random Variables 2_Continuous random variables/media/image26.png){width="2.1666666666666665in" | b.  ![](media/Random Variables 2_Continuous random variables/media/image26.png){width="2.5576924759405073in" |
|     height="1.4358967629046369in"}                                                                           |     height="1.26875in"}                                                                                      |
|                                                                                                              |                                                                                                              |
| $$2$$                                                                                                        | 4                                                                                                            |
+==============================================================================================================+==============================================================================================================+
| c.  ![](media/Random Variables 2_Continuous random variables/media/image26.png){width="2.5576924759405073in" | d.  ![](media/Random Variables 2_Continuous random variables/media/image26.png){width="2.5576924759405073in" |
|     height="1.26875in"}                                                                                      |     height="1.26875in"}                                                                                      |
|                                                                                                              |                                                                                                              |
| 3                                                                                                            | 7                                                                                                            |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+

2.  Find the mode of each continuous probability distribution.

    a.  $f(x)\  = \  -$
        $\frac{3\left( x^{2} - \ 8x\  - \ 9 \right)}{434}$ defined in
        the domain \[0, 7\]

This is a concave down parabola. The turning point must be maximum.

$$f'(x) = \  - \frac{3(2x\  - \ 8)}{434} = \ 0$$

$x\  = \ 4$

Mode = 4

b.  $f(x)\  = \  -$
    $\frac{3\left( x^{2} - \ 16x\  + \ 15 \right)}{1100}$ defined in the
    domain \[1, 11\]

This is a concave down parabola. The turning point must be maximum.

$$f'(x) = \  - \frac{3(2x\  - \ 16)}{1100} = \ 0$$

$$x\  = \ 8$$

Mode = 8.

c.  $f(x) =$ $\frac{4e^{4x}}{e^{8\left( e^{16} - \ 1 \right)}}$ defined
    in the interval $2\  \leq \ x\  \leq \ 6$

$$f'(x) = \frac{16e^{4x}}{e^{8\left( e^{16} - \ 1 \right)}} > \ 0\ always\ increasing\ on\ \lbrack 2,\ 6\rbrack.$$

The maximum is at the end of the domain.

Mode = 6.

3.  Find the mode of $f(x) = \$
    $\frac{2\left( 2x^{3} - \ 33x^{2} + \ 168x\  + \ 3 \right)}{2105}$
    defined in the interval $0\  \leq \ x\  \leq \ 5$

$$f'(x) = \frac{2\left( 6x^{2} - \ 66x\  + \ 168 \right)}{2105} = \ 0$$

$x^{2} - \ 11x\  + \ 28\  = \ 0$

$(x\  - \ 4)(x\  - \ 7) = \ 0.$

$x\  = \ 4\ i$s in \[0, 5\].

Check second derivative:

$$f^{''}(x) = 2x - 11$$

$$f^{''}(4) = - 3 < 0\therefore\max$$

$$Check\ f(0) = \frac{6}{2105},\ f(4) = \frac{110}{421} \approx 0.26,\ f(5) = \frac{536}{2105} \approx 0.25:$$

Mode = 4.

4.  Determine whether each function is a PDF. If it is, find its mode.

    a.  $f(x) = \ 3x^{2},\ where\ 0\  \leq \ x\  \leq \ 1$

$$\int_{0}^{1}3x^{2}\, dx = 1,\ $$

$$f(x) \geq 0\ for\ all\ x$$

$f'(x) = 6x > 0$, increasing. Mode = $1$.

b.  $f(x) = \frac{1}{4}x,\ where\ 1\  \leq \ x\  \leq \ 5$

$$\int_{1}^{5}\frac{1}{4}x\, dx = \frac{24}{8} = 3 \neq 1$$

Not a PDF.

c.  $f(x) =$ $\frac{4\  - \ 2x}{3}$ $,\ where\ 0\  \leq \ x\  \leq \ 3$

$$\int_{0}^{3}\frac{4 - 2x}{3}\, dx = \left\lbrack \frac{4x}{3} - \frac{x^{2}}{3} \right\rbrack_{0}^{3} = 4 - 3 = 1$$

but $f(x) < 0$ for $x > 2$. Not a PDF.

d.  $f(x) = \ (n\  + \ 1)xⁿ,\ where\ 0\  \leq \ x\  \leq \ 1,\ n\  \geq \ 0$

$$\int_{0}^{1}{(\ n + 1)x^{n}}\, dx = \left\lbrack x^{n + 1} \right\rbrack_{0}^{1} = 1$$

$$f(x) \geq 0\ for\ all\ positive\ x$$

$f'(x) = n(n + 1)x^{n - 1} \geq 0$, increasing.

Mode = $1$.

e.  $f(x) = \frac{1}{2}sin\ x,\ where\ 0\  \leq \ x\  \leq \ \pi$

$$\int_{0}^{\pi}\frac{1}{2}\sin x\, dx = \frac{1}{2}\lbrack - cosx\rbrack_{0}^{\pi} = 1$$

$$f(x) \geq 0$$

Mode at max value of sine: $\sin x = 1$: $x = \frac{\pi}{2}$.

# Cumulative Distribution Functions

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                                                                                                                                   |
+================================================================================================================================================================================================================================+
| - Integrate to a variable upper limit                                                                                                                                                                                          |
|                                                                                                                                                                                                                                |
| +-------------------------+------------------------+-------------------------+                                                                                                                                                 |
| | a.                      | b.                     | c.                      |                                                                                                                                                 |
| |                         |                        |                         |                                                                                                                                                 |
| | $$\int_{1}^{x}t^{2}dt$$ | $$\int_{0}^{x}{3t}dt$$ | $$\int_{2}^{x}t^{3}dt$$ |                                                                                                                                                 |
| +=========================+========================+=========================+                                                                                                                                                 |
|                                                                                                                                                                                                                                |
| - Find cumulative frequency for a frequency table                                                                                                                                                                              |
|                                                                                                                                                                                                                                |
| +------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+                                                  |
| | a.                           | b.  ![](media/Random Variables 2_Continuous random variables/media/image27.png){width="2.625in"                                            |                                                  |
| |                              |     height="2.2020833333333334in"}![](media/Random Variables 2_Continuous random variables/media/image28.png){width="2.6217924321959756in" |                                                  |
| |                              |     height="1.921279527559055in"}                                                                                                          |                                                  |
| +==============================+============================================================================================================================================+                                                  |
|                                                                                                                                                                                                                                |
| - Construct cumulative frequency histogram from regular histogram                                                                                                                                                              |
|                                                                                                                                                                                                                                |
| ![](media/Random Variables 2_Continuous random variables/media/image29.png){width="3.191678696412948in"                                                                                                                        |
| height="1.941279527559055in"}![](media/Random Variables 2_Continuous random variables/media/image30.png){width="3.1909722222222223in" height="1.9409722222222223in"}                                                           |
|                                                                                                                                                                                                                                |
| - Find the median and IQR from a cumulative frequency polygon                                                                                                                                                                  |
|                                                                                                                                                                                                                                |
| +-------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+ |
| | a.  ![](media/Random Variables 2_Continuous random variables/media/image31.png){width="2.321527777777778in" | b.  ![](media/Random Variables 2_Continuous random variables/media/image32.png){width="1.8916666666666666in" | |
| |     height="1.6618055555555555in"}                                                                          |     height="1.6833333333333333in"}                                                                           | |
| +=============================================================================================================+==============================================================================================================+ |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Cumulative Distribution Function**                                                                                                                                                                                         |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| For a continuous probability distribution $f(t)$ defined on $\lbrack a,b\rbrack:$                                                                                                                                              |
|                                                                                                                                                                                                                                |
| The **cumulative distribution function (CDF)**, $F(x)$, gives the probability that $X$ is less than or equal to $x$. It is the area under the graph from $a$ to $x,$ so it is the integral from $a$ to $x$.                    |
|                                                                                                                                                                                                                                |
| ![](media/Random Variables 2_Continuous random variables/media/image33.png){width="4.329261811023622in" height="1.968503937007874in"}                                                                                          |
|                                                                                                                                                                                                                                |
| $$F(x) = P(X \leq x) = \int_{a}^{x}{f(t)}dt$$                                                                                                                                                                                  |
|                                                                                                                                                                                                                                |
| **Properties:**                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                |
| - The PDF is the derivative of the CDF.                                                                                                                                                                                        |
|                                                                                                                                                                                                                                |
| - A CDF is **always monotonically increasing**.                                                                                                                                                                                |
|                                                                                                                                                                                                                                |
| The cumulative probability cannot decrease.                                                                                                                                                                                    |
|                                                                                                                                                                                                                                |
| - At the left boundary of the domain, $F(a) = 0$.                                                                                                                                                                              |
|                                                                                                                                                                                                                                |
| - At the right boundary of the domain, $F(b) = 1$.                                                                                                                                                                             |
|                                                                                                                                                                                                                                |
| - For any $x$ between $a$ and $b$, $0 < F(x) < 1$.                                                                                                                                                                             |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------+
| - **Properties of the CDF**                                                                               |
+===========================================================================================================+
| - The function value of the CDF gives the cumulative probability.                                         |
|                                                                                                           |
| ![](media/Random Variables 2_Continuous random variables/media/image34.png){width="3.262399387576553in"   |
| height="1.5748031496062993in"}                                                                            |
|                                                                                                           |
| $$\ \ \ \ \ \ \ F(a) = P(X \leq a)$$                                                                      |
|                                                                                                           |
| - To find the probability of an interval using the CDF,\                                                  |
|   subtract the CDF values at the two endpoints.                                                           |
|                                                                                                           |
| ![](media/Random Variables 2_Continuous random variables/media/image35.png){width="3.306129702537183in"   |
| height="1.5748031496062993in"}                                                                            |
|                                                                                                           |
| $$P(c \leq X \leq d) = F(d) - F(c)$$                                                                      |
|                                                                                                           |
| - ![](media/Random Variables 2_Continuous random variables/media/image36.png){width="3.267577646544182in" |
|   height="1.5748031496062993in"}To find the probability of $X$ greater than or equal to $a$, subtract the |
|   probability less than or equal to $a$ from 1.                                                           |
|                                                                                                           |
| $$P(X \geq a) = 1 - P(X \leq a)$$                                                                         |
|                                                                                                           |
| $= 1 - F(a)$                                                                                              |
+-----------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find the cumulative distribution function                                                                                                                       |
+====================================================================+==========================================================================================================+
| The continuous random variable has PDF $f(x) =$ $\frac{x^{2}}{21}$ defined on $\lbrack 1,\ 4\rbrack$.                                                                         |
|                                                                                                                                                                               |
| Find the CDF and use it to find $P(X \leq 3)$ and $P(2 \leq x \leq 3)$.                                                                                                       |
+--------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| $${F(x) = \int_{1}^{x}\frac{t^{2}}{21}dt                           | ![](media/Random Variables 2_Continuous random variables/media/image37.png){width="2.1457392825896764in" |
| }{= \frac{1}{21}\left\lbrack \frac{t^{3}}{3} \right\rbrack_{1}^{x} | height="2.1208245844269467in"}                                                                           |
| }{= \frac{1}{21}\left( \frac{x^{3}}{3} - \frac{1}{3} \right)       |                                                                                                          |
| }{= \frac{x^{3} - 1}{63}}$$                                        |                                                                                                          |
+--------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| $$P(X \leq 3) = F(3) = \frac{26}{63}$$                             | $$P(2 \leq X \leq 3) = F(3) - F(2) = \frac{26}{63} - \frac{7}{63} = \frac{19}{63}$$                      |
+--------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| A PDF is $f(x) =$ $\frac{3x^{2}}{335}$ on $\lbrack 2,7\rbrack.$                                                                                                               |
+--------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| a.  Find the cumulative distribution function.                     | The CDF has been sketched for you:                                                                       |
|                                                                    |                                                                                                          |
| $$\frac{x^{3} - 8}{335}$$                                          | ![](media/Random Variables 2_Continuous random variables/media/image38.png){width="1.9958333333333333in" |
|                                                                    | height="1.9680555555555554in"}                                                                           |
+--------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| b.  Find $P(X \leq 4)$                                             | c.  $P(3.5 \leq X \leq 6.2)$                                                                             |
|                                                                    |                                                                                                          |
| $$\frac{56}{335}$$                                                 | $$0.583$$                                                                                                |
+--------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| A PDF is $f(x) =$ $\frac{4}{3x^{2}}$ on $\lbrack 1,4\rbrack.$                                                                                                                 |
+--------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| a.  Find the cumulative distribution function.                     | The CDF has been sketched for you:                                                                       |
|                                                                    |                                                                                                          |
| $$\frac{4}{3} - \frac{4}{3x}$$                                     | ![](media/Random Variables 2_Continuous random variables/media/image39.png){width="1.99620406824147in"   |
|                                                                    | height="1.968503937007874in"}                                                                            |
+--------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| b.  Find $P(2 \leq X \leq 3)$                                      | c.  $P(X \geq 2)$                                                                                        |
|                                                                    |                                                                                                          |
| $$\frac{2}{9}$$                                                    | $$\frac{1}{3}$$                                                                                          |
+--------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+

Foundation

1.  Find the cumulative distribution function for each continuous
    probability distribution.

    a.  $f(x) =$ $\frac{x^{2}}{9}$ defined in the domain \[0, 3\]

$$F(x) = \ \int_{0}^{x}\left( \frac{t^{2}}{9} \right)dt\  = \frac{x^{3}}{27}$$

b.  $f(x) =$ $\frac{eˣ}{e^{4} - \ 1}$ in the interval
    $0\  \leq \ x\  \leq \ 4$

$$F(x) = \ \int_{0}^{x}\left( \frac{e^{t}}{e^{4} - 1} \right)dt\  = \frac{eˣ\  - \ 1}{e^{4} - \ 1}$$

c.  $f(x) =$ $\frac{4(x\  - \ 2)^{3}}{625}$ in the domain \[2, 7\]

$$F(x) = \ \int_{2}^{x}\left( \frac{4(t - 2)^{3}}{625} \right)dt\  = \frac{(x\  - \ 2)^{4}}{625}$$

d.  $f(x) =$ $\frac{3x(8\  - \ x)}{135}$ in the domain \[2, 5\]

$$F(x) = \ \int_{2}^{x}\left( \frac{3t(8 - t)}{135} \right)dt\  = \ \left( \frac{3}{135} \right)\left\lbrack 4t^{2} - \frac{t^{3}}{3} \right\rbrack_{2}^{x}$$

$$= \frac{12x^{2} - \ x^{3} - \ 40}{135}$$

2.  For each PDF, find $F(x)$ and confirm $F(b)\  = \ 1$.

    a.  $f(x) = \frac{1}{32}x,\ where\ 0\  \leq \ x\  \leq \ 8$

$$F(x) = \int_{0}^{x}\frac{t}{32}\, dt = \frac{x^{2}}{64}.\ $$

$$F(8) = \frac{64}{64} = 1$$

b.  $f(x) = \frac{3}{16}x^{2},\ where\  - 2\  \leq \ x\  \leq \ 2$

$$F(x) = \int_{- 2}^{x}\frac{3t^{2}}{16}\, dt = \left\lbrack \frac{t^{3}}{16} \right\rbrack_{- 2}^{x} = \frac{x^{3} + 8}{16}.$$

$$\ F(2) = \frac{16}{16} = 1$$

c.  $f(x) = \frac{3}{2}\left( 1\  - \ x^{2} \right),\ where\ 0\  \leq \ x\  \leq \ 1$

$$F(x) = \int_{0}^{x}\frac{3}{2}\left( 1 - t^{2} \right)\, dt = \frac{3x - x^{3}}{2}$$

$$F(1) = \frac{2}{2} = 1$$

d.  $f(x) = \frac{1}{e}(eˣ\  + \ 1),\ where\ 0\  \leq \ x\  \leq \ 1$

$$F(x) = \frac{1}{e}\int_{0}^{x}(e^{t} + 1)\, dt = \frac{1}{e}(e^{x} + x - 1)$$

$$F(1) = \frac{1}{e}(e) = 1$$

3.  The function $y = 2x,\ 0\  \leq \ x\  \leq \ 1,$ is a PDF.

    a.  ![](media/Random Variables 2_Continuous random variables/media/image40.png){width="1.3in"
        height="1.338804680664917in"}Sketch the graph and verify
        $f(x)\  \geq \ 0$.

$f(x) = 2x \geq 0$ for $x \geq 0$,

so $f(x) \geq 0$ in $\lbrack 0,1\rbrack$

b.  Show the area bounded by the function and the $x$-axis is 1; confirm
    by integration.

Triangle with base $1$ and height $2$: area = $\frac{1}{2}(1)(2) = 1$

$$\int_{0}^{1}2x\, dx = \left\lbrack x^{2} \right\rbrack_{0}^{1} = 1$$

c.  ![](media/Random Variables 2_Continuous random variables/media/image41.png){width="1.322548118985127in"
    height="1.3599781277340333in"}Use area formulae to show the CDF is
    $P(X\  \leq \ x)\  = \ x².$

Area is half base times height

$$A = \frac{1}{2}x \times 2x = x^{2}$$

d.  Confirm by calculating $\int_{0}^{x}{2t}dt.$

$$\left\lbrack t^{2} \right\rbrack_{0}^{x} = x^{2}$$

e.  Use the CDF to find Q₁, Q₂ and Q₃.

$$Q1:\ \frac{1}{2}$$

$$Q2:\ \frac{1}{\sqrt{2}}$$

$$Q3:\frac{\sqrt{3}}{2}$$

4.  ![](media/Random Variables 2_Continuous random variables/media/image42.png){width="2.373413167104112in"
    height="1.604235564304462in"}A piecewise function is graphed:
    $f(x)\  = \ 0.125$ for $0\  \leq \ x\  < \ 2,\ f(x)\  = \ 0.25$ for
    $2\  \leq \ x\  \leq \ 5$.

    a.  Verify it forms a valid PDF.

Area = $2(0.125) + 3(0.25) = 0.25 + 0.75 = 1$.

$f(x) \geq 0$. Valid PDF.

b.  Complete the cumulative probability table
    $P(X\  \leq \ x)\ for\ x\  = \ 0,\ 1,\ 2,\ 3,\ 4,\ 5$.

  -----------------------------------------
        $$x$$        0   1   2   3   4   5
  ----------------- --- --- --- --- --- ---
   $$P(X \leq x)$$                      

  -----------------------------------------

$$0,\frac{1}{8},\frac{1}{4},\frac{1}{2},\frac{3}{4},\ 1$$

c.  ![](media/Random Variables 2_Continuous random variables/media/image43.png){width="2.062992125984252in"
    height="1.5748031496062993in"}Plot and graph the CDF and write the
    CDF in piecewise notation.

![](media/Random Variables 2_Continuous random variables/media/image44.png){width="2.0625in"
height="1.5673611111111112in"}

$$F(x) = \left\{ \begin{matrix}
\frac{1}{8}x, & \text{for }0 \leq x < 2 \\
\frac{1}{4}x - \frac{1}{4}, & \text{for }2 \leq x \leq 5
\end{matrix} \right.\ $$

5.  A PDF is defined by

$$f(x) = \left\{ \begin{matrix}
c, & \text{for }0 \leq x \leq 5 \\
2c, & \text{for }5 < x \leq 10
\end{matrix} \right.\ $$

a.  ![](media/Random Variables 2_Continuous random variables/media/image45.png){width="2.372916666666667in"
    height="1.5604166666666666in"}Sketch the PDF.

b.  Find $c$.

Area = $5c + 5(2c) = 15c = 1$

$$c = \frac{1}{15}$$

c.  Find the CDF.

$$F(x) = \left\{ \begin{matrix}
cx = \frac{x}{15}, & \text{for }0 \leq x < 5 \\
2cx - 5c = \frac{2x}{15} - \frac{1}{3}, & \text{for }5 \leq x \leq 10
\end{matrix} \right.\ $$

d.  Use the CDF to find $P(1\  < \ X\  < \ 7).$

$$P(1 < X < 7) = F(7) - F(1)$$

$$= \left( \frac{14}{15} - \frac{1}{3} \right) - \frac{1}{15}$$

$$= \frac{8}{15}$$

Development

6.  A continuous probability distribution is defined by $f(x) =$
    $\frac{2e^{2x}}{e^{10} - \ 1}$ in the domain \[0, 5\].

    a.  Find the CDF.

$$F(x) = \ \int_{0}^{x}\left( \frac{2e^{2t}}{e^{10} - 1} \right)dt\  = \frac{e^{2x} - \ 1}{e^{10} - \ 1}$$

b.  Calculate each probability correct to 2 significant figures.

+---------------------------------------------------------+-------------------------------------------------------+---------------------------------------------------------------+
| i.  $P(X\  \leq \ 2)$                                   | ii. $P(X\  \leq \ 4)$                                 | iii. $P(X\  > \ 3)$                                           |
|                                                         |                                                       |                                                               |
| $$P(X\  \leq \ 2) = F(2)$$                              | $$P(X\  \leq \ 4)$$                                   | $$P(X\  > \ 3)$$                                              |
|                                                         |                                                       |                                                               |
| $$= \frac{e^{4} - \ 1}{e^{10} - \ 1} \approx \ 0.0024$$ | $$= \frac{e^{8} - \ 1}{e^{10} - \ 1} \approx \ 0.14$$ | $$= \ 1\  - \frac{e^{6} - \ 1}{e^{10} - \ 1} \approx \ 0.98$$ |
+=========================================================+=======================================================+===============================================================+
| iv. $P(X\  \geq \ 2.8)$                                 | v.  $P(2\  \leq \ X\  \leq \ 4)$                      |                                                               |
|                                                         |                                                       |                                                               |
| $$P(X\  \geq \ 2.8)$$                                   | $$P(2\  \leq \ X\  \leq \ 4)$$                        |                                                               |
|                                                         |                                                       |                                                               |
| $$= \ 1\  - \ F(2.8) \approx \ 0.99$$                   | $$= \ F(4) - \ F(2) \approx \ 0.13$$                  |                                                               |
+---------------------------------------------------------+-------------------------------------------------------+---------------------------------------------------------------+

7.  a.  Find the exact value of $a$ if $f(x) =$ $\frac{a}{x}$ is a
        continuous PDF defined in the domain \[1, 6\].

$$\int_{1}^{6}\frac{a}{x}dx\  = a\left( \ln 6 - \ln 1 \right) = \ 1$$

$$a\  = \frac{1}{\ln 6}.$$

b.  Find the CDF.

$$F(x) = \ \int_{1}^{x}\left( \frac{1}{t \cdot \ln 6} \right)dt\  = \frac{ln\ x}{\ln 6}$$

c.  Find to 2 decimal places:

+--------------------------------------------------------------------+--------------------------------------------------------------------+-----------------------------------------------------------------+
| i.  $P(X\  \leq \ 3)$                                              | ii. $P(X\  \leq \ 2)$                                              | iii. $P(X\  > \ 5)$                                             |
|                                                                    |                                                                    |                                                                 |
| $$P(X\  \leq \ 3) = \ \frac{\ln 3}{\ln 6}\  \approx \ 0.61\ $$     | $$P(X\  \leq \ 2) = \ \frac{\ln 2}{\ln 6}\  \approx \ 0.39\ $$     | $$P(X\  > \ 5) = \ 1\  - \frac{\ln 5}{\ln 6}\  \approx \ 0.10$$ |
+====================================================================+====================================================================+=================================================================+
| iv. $P(X\  \geq \ 4)$                                              | v.  $P(2\  \leq \ X\  \leq \ 5)$                                   |                                                                 |
|                                                                    |                                                                    |                                                                 |
| $$P(X\  \geq \ 4) = \ 1\  - \ \frac{\ln 4}{\ln 6} \approx \ 0.23$$ | $$P(2\  \leq \ X\  \leq \ 5) = \frac{\ln 5\  - \ln 2}{\ln 6}\ $$   |                                                                 |
|                                                                    |                                                                    |                                                                 |
|                                                                    | $$= \frac{\ln\left( \frac{5}{2} \right)}{\ln 6}\  \approx \ 0.51$$ |                                                                 |
+--------------------------------------------------------------------+--------------------------------------------------------------------+-----------------------------------------------------------------+

8.  a.  Show that $y\  = \ \cos\ x$ is a PDF in the domain
        $\left\lbrack \frac{3\pi}{2},\ 2\pi \right\rbrack.$

$$\int_{\frac{3\pi}{2}}^{2\pi}\cos x\ \ dx\  = \ \lbrack sin\ x\rbrack_{\frac{3\pi}{2}}^{2\pi}$$

$$= \ \sin(2\pi) - \ \sin\left( \frac{3\pi}{2} \right)$$

$$= \ 0\  - \ ( - 1) = \ 1$$

$\cos\ x\  \geq \ 0$ on
$\left\lbrack \frac{3\pi}{2},\ 2\pi \right\rbrack\$(cos positive in Q4)

Therefore, it is a PDF

b.  Find the CDF.

$$F(x) = \ \int_{\frac{3\pi}{2}}^{x}\cos t\ \ dt\ $$

$$= \ \left\lbrack \sin\ t \right\rbrack_{\frac{3\pi}{2}}^{x}$$

$$= \ sin\ x\  + \ 1$$

c.  Find each probability in exact form:

+------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------+
| i.  $P\left( X\  \leq \frac{5\pi}{3} \right)$                                            | ii. $P\left( X\  \geq \frac{7\pi}{4} \right)$                                                                                                             | iii. $P\left( \frac{5\pi}{3} \leq \ X\  \leq \frac{11\pi}{6} \right)$                                                                     |
|                                                                                          |                                                                                                                                                           |                                                                                                                                           |
| $$P\left( X\  \leq \frac{5\pi}{3} \right) = \ sin\left( \frac{5\pi}{3} \right) + \ 1\ $$ | $$P\left( X\  \geq \frac{7\pi}{4} \right) = \ 1\  - \ F\left( \frac{7\pi}{4} \right) = \ 1\  - \ \left( \sin\left( \frac{7\pi}{4} \right) + \ 1 \right)$$ | $$P\left( \frac{5\pi}{3} \leq \ X\  \leq \frac{11\pi}{6} \right) = \ F\left( \frac{11\pi}{6} \right) - \ F\left( \frac{5\pi}{3} \right)$$ |
|                                                                                          |                                                                                                                                                           |                                                                                                                                           |
| $$= \  - \frac{\sqrt{3}}{2} + \ 1\ $$                                                    | $$= \  - sin\left( \frac{7\pi}{4} \right)$$                                                                                                               | $$= \ sin\left( \frac{11\pi}{6} \right) - \ sin\left( \frac{5\pi}{3} \right)$$                                                            |
|                                                                                          |                                                                                                                                                           |                                                                                                                                           |
| $$= \frac{2\  - \ \sqrt{3}}{2}\ $$                                                       | $$= \frac{1}{\sqrt{2}}$$                                                                                                                                  | $$= \  - \frac{1}{2} - \ \left( - \frac{\sqrt{3}}{2} \right)$$                                                                            |
|                                                                                          |                                                                                                                                                           |                                                                                                                                           |
|                                                                                          |                                                                                                                                                           | $$= \frac{\sqrt{3} - \ 1}{2}\ $$                                                                                                          |
+==========================================================================================+===========================================================================================================================================================+===========================================================================================================================================+

9.  a.  Find the CDF for $f(x) =$ $\frac{5x^{4}}{7776}$ for
        $1\  \leq \ x\  \leq \ 6$.

$$F(x) = \ \int_{1}^{x}\left( \frac{5t^{4}}{7776} \right)dt\  = \frac{x^{5} - \ 1}{7776}$$

b.  Find:

+-----------------------------------------------------+-------------------------------------------------------------------+----------------------------------------------+
| i.  $P(X\  \leq \ 3)\ \ \ \ \$                      | ii. $P(X\  \leq \ 2)\ \ \ \ \$                                    | iii. $P(X\  < \ 5)\ \ \ \ \$                 |
|                                                     |                                                                   |                                              |
| $$P(X\  \leq \ 3) = \ F(3) = \frac{121}{3888}$$     | $$P(X\  \leq \ 2) = \ F(2) = \frac{31}{7776}$$                    | $$P(X\  < \ 5) = \ F(5) = \frac{781}{1944}$$ |
+=====================================================+===================================================================+==============================================+
| iv. $P(X\  > \ 4)$                                  | v.  $P(2\  \leq \ X\  \leq \ 4)$                                  |                                              |
|                                                     |                                                                   |                                              |
| $$P(X\  > \ 4) = \ 1\  - \ F(4)$$                   | $$P(2\  \leq \ X\  \leq \ 4) = \ F(4) - \ F(2) = \frac{31}{243}$$ |                                              |
|                                                     |                                                                   |                                              |
| $$= \ 1\  - \frac{1023}{7776} = \frac{2251}{2592}$$ |                                                                   |                                              |
+-----------------------------------------------------+-------------------------------------------------------------------+----------------------------------------------+

10. A probability density function is defined piecewise by

$$f(x) = \left\{ \begin{array}{r}
k(4 + x)\ \ \ \ \ \  - 4 \leq x \leq 0 \\
k(4 - x)\ \ \ \ \ \ \ \ \ \ \ 0 \leq x \leq 4
\end{array} \right.\ $$

a.  ![](media/Random Variables 2_Continuous random variables/media/image46.png){width="2.3277548118985125in"
    height="1.968503937007874in"}Find the value of the constant $k$.
    Hence write the equation of $f(x)$ and sketch it.

$$\int_{- 4}^{4}{f(x)}dx\  = \ 1.\ \ Split\ region\ based\ on\ piecewise\ definition:$$

$$\int_{- 4}^{0}{k(4\  + \ x)}dx\  + \ \int_{0}^{4}{k(4\  - \ x)}dx$$

$$= \ k\left\lbrack 4x\  + \ \left( \frac{1}{2} \right)x^{2} \right\rbrack_{- 4}^{0} + \ k\left\lbrack 4x\  - \ \left( \frac{1}{2} \right)x^{2} \right\rbrack_{0}^{4}$$

$$= \ k\left( (0\  + \ 0) - \ ( - 16\  + \ 8) \right) + \ k\left( (16\  - \ 8) - \ (0\  - \ 0) \right)$$

$$= \ 8k\  + \ 8k\  = \ 16k\  = \ 1$$

$$k\  = \frac{1}{16}$$

$$f(x) = \left\{ \begin{array}{r}
\frac{1}{16}(4 + x)\ \ \ \ \ \  - 4 \leq x \leq 0 \\
\frac{1}{16}(4 - x)\ \ \ \ \ \ \ \ \ \ \ 0 \leq x \leq 4
\end{array} \right.\ $$

b.  What is the probability that $0\  \leq \ X\  \leq \ 2$?

$$P(0\  \leq \ X\  \leq \ 2) = \ \int_{0}^{2}{\left( \frac{1}{16} \right)(4\  - \ x)}dx$$

$$= \ \left( \frac{1}{16} \right)\left\lbrack 4x\  - \ \left( \frac{1}{2} \right)x^{2} \right\rbrack_{0}^{2}$$

$$= \frac{1}{16}\left( (8\  - \ 2) - \ 0 \right) = \frac{3}{8}$$

c.  Why is the median zero, and what is the mode?

$f$ is symmetric about $x\  = \ 0$, so equal area lies either side and
the median = 0.\
The mode is $x = 0$ (global maximum of $f$).

d.  ![](media/Random Variables 2_Continuous random variables/media/image47.png){width="2.3277548118985125in"
    height="1.9496161417322835in"}Find the CDF for
    $- 4\  \leq \ x\  \leq \ 0$, and the CDF for
    $0\  \leq \ x\  \leq \ 4.$ Then sketch the whole CDF.

$$For\  - 4\  \leq \ x\  \leq \ 0:\ $$

$$F(x) = \ \int_{- 4}^{x}{\frac{1}{16}(4\  + \ t)}dt$$

$$= \ \frac{1}{32}\left\lbrack (4\  + \ t)^{2} \right\rbrack_{- 4}^{x}$$

$$= \ \frac{1}{32}\left( (4\  + \ x)^{2} - \ 0 \right) = \ \frac{1}{32}(4\  + \ x)^{2}$$

$$For\ 0\  \leq \ x\  \leq \ 4,\ note\ F(0) = \frac{1}{2}:\ $$

$$F(x) = \frac{1}{2} + \ \int_{0}^{x}{\frac{1}{16}(4\  - \ t)}dt$$

$$= \frac{1}{2}\  - \ \frac{1}{32}\left\lbrack (4\  - \ t)^{2} \right\rbrack_{0}^{x}$$

$$= \frac{1}{2} - \ \frac{1}{32}\left( (4\  - \ x)^{2} - \ 16 \right) = \ 1\  - \ \frac{1}{32}(4\  - \ x)^{2}$$

Mastery

11. Let $f(x)$ and $F(x)\  = \ e^{- kx}$, where $k\  = \frac{1}{8}ln2$,
    be the PDF and CDF respectively for the experiment of observing the
    time $x$ days that a radioactive nucleus survives before decaying.

    a.  Explain why the domain of possible values is the unbounded
        interval $\lbrack 0,\ \infty).$

    b.  Find the formula for the PDF, and sketch the CDF and PDF.

    c.  Find the median, and show it is the half-life.

    d.  ![](media/Random Variables 2_Continuous random variables/media/image48.png){width="1.6753685476815399in"
        height="3.403846237970254in"}Find the probabilities that it
        decays on the first day and after the first day.

a\) Decay can theoretically occur at any time, no matter how large, so
the domain \[0, ∞) is used.

b\) CDF: $F(x)\  = \ 1\  - \ e^{- kx}$

Differentiating: $f(x)\  = \ ke^{- kx}$

c\) Set $F(x)\  = \ 0.5:$

$$1\  - \ e^{- kx} = \frac{1}{2}$$

$$e^{- kx} = \frac{1}{2}$$

$$kx\  = \ ln2$$

$x\  = \frac{ln2}{k} = \frac{ln2}{\left( \frac{1}{8} \right)ln2}$ = 8
days, which is the half-life.

d\) $P(X\  \leq \ 1) = \ F(1) = \ 1\  - \ e^{- k} \approx \ 0.083$

$$P(X\  > \ 1) = \ 1\  - \ F(1) = \ e^{- k} \approx \ 0.917$$

12. a.  Find the shaded area under the curve $y =$ $\frac{1}{x^{2}}$
        over the interval $(1,\ \infty).$

    b.  Hence show that $y =$ $\frac{1}{x^{2}}$ for $x\  \geq \ 1$, is a
        PDF, and find the CDF.

    c.  Sketch the PDF and CDF on two axes.

![](media/Random Variables 2_Continuous random variables/media/image54.png)a)
$\int_{1}^{\infty}\left( \frac{1}{x^{2}} \right)dx\  = \ \left\lbrack - \frac{1}{x} \right\rbrack_{1}^{\infty} = \ 0\  - \ ( - 1) = \ 1$

(The limit of $-$ $\frac{1}{x}$ as $x\  \rightarrow \ \infty$ is 0.)

b\) $f(x) = \frac{1}{x^{2}} \geq \ 0$ for all $x\  \geq \ 1$, and the
integral over $\lbrack 1,\ \infty)$ equals 1, so it is a PDF.

$$F(x) = \ \int_{1}^{x}\left( \frac{1}{t^{2}} \right)dt\  = \ \left\lbrack - \frac{1}{t} \right\rbrack_{1}^{x} = \ 1\  - \frac{1}{x}$$

19. a.  Find the mode of
        $f(x)\  = \  - \frac{3}{22}\left( x^{2} - \ 6x\  + \ 5 \right)$
        defined on \[2, 4\].

This is a concave down parabola, the turning point is the maximum

$$f'(x) = \  - \frac{3}{22}(2x\  - \ 6) = \ 0$$

$x\  = \ 3$

Mode = 3.

b.  Find the CDF.

$$F(x) = \ \int_{2}^{x}\left( - \frac{3}{22}\left( t^{2} - \ 6t\  + \ 5 \right) \right)dt\ $$

$$= \  - \frac{3}{22}\left\lbrack \frac{t^{3}}{3} - \ 3t^{2} + \ 5t \right\rbrack_{2}^{x}$$

$$= \  - \frac{1}{22}\left( x^{3} - \ 9x^{2} + \ 15x\  - \ 2 \right)$$

c.  Find $P(X\  \leq \ a)$ where $a$ is the mode.

$$P(X\  \leq \ 3) = \ F(3) = \  - \frac{1}{22}(27\  - \ 81\  + \ 45\  - \ 2)$$

$$= \  - \frac{1}{22}( - 11) = \frac{1}{2}$$

20. Athletes\' finishing times varied between 3 and 7 minutes,
    represented by the continuous PDF
    $f(x)\  = \ \frac{1}{116}\left( x^{3} - \ 9x^{2} + \ 24x\  + \ 1 \right)$
    on \[3, 7\].

    a.  Find the CDF.

$$F(x) = \ \int_{3}^{x}\left( \frac{1}{116}\left( t^{3} - \ 9t^{2} + \ 24t\  + \ 1 \right) \right)dt\ $$

$$= \ \frac{1}{464}\left( x^{4} - \ 12x^{3} + \ 48x^{2} + \ 4x\  - \ 201 \right)$$

b.  Find the probability that an athlete finishes:

    i.  in less than 5 minutes

$$P(X\  < \ 5) = \ F(5) = \frac{625\  - \ 1500\  + \ 1200\  + \ 20\  - \ 201}{464} = \frac{144}{464} = \frac{9}{29}$$

ii. in 4 minutes or more

$$P(X\  \geq \ 4) = \ 1\  - \ F(4) = \ 1\  - \frac{256\  - \ 768\  + \ 768\  + \ 16\  - \ 201}{464} = \ 1\  - \frac{71}{464} = \frac{393}{464}$$

iii. in between 4 and 5 minutes

$$P(4\  \leq \ X\  \leq \ 5) = \ F(5) - \ F(4) = \frac{144}{464} - \frac{71}{464} = \frac{73}{464}$$

c.  What is the most likely finishing time?

f\'(x) = (1/116)(3x² − 18x + 24) = 0 → x² − 6x + 8 = 0 → x = 2 or x = 4.
Only x = 4 is in \[3, 7\].

Check endpoints: f(3) = 19/116, f(4) = 17/116, f(7) = 71/116. Maximum at
x = 7.

Mode = 7 minutes.

13. A chicken wanders uniformly at random inside a circular enclosure of
    radius 6 m.\
    Let $X$ be its distance from the centre O.

    a.  Find the CDF, which is the probability of finding the chicken a
        distance of $x$ metres or less from the centre of the enclosure.
        $F(x)\  = \ P(X\  \leq \ x).$

$$F(x) = \frac{area\ of\ inner\ circle}{area\ of\ whole\ circle}$$

$$= \frac{\pi x^{2}}{\pi\  \times \ 6^{2}}$$

$$= \ \frac{1}{36}x^{2},\ for\ 0\  \leq \ x\  \leq \ 6$$

b.  Find the probability of finding the chicken 2 metres or less from
    the centre of the enclosure.

$$F(2) = \frac{1}{36}(4) = \frac{1}{9}$$

c.  Find the probability of finding the chicken between two to five
    metres from the centre of the circular enclosure.

$$P(chook\ is\ 2 - 5\ m\ from\ centre) = \ F(5) - \ F(2)$$

$$= \ \left( \frac{1}{36} \right)(25\  - \ 4)$$

$$= \frac{21}{25}$$

d.  Use the CDF to find the probability of finding the chicken within 6
    m of the centre of the enclosure.

$$F(6) = \frac{1}{36}(6)^{2} = 1$$

Based on the context, this makes sense as the enclosure only has a
radius of 6 m

e.  Find the PDF.

PDF is the derivative of the CDF

$$f(x) = \frac{x}{18}$$

# Median and Quartiles using the CDF

+-------------------------------------------------------------------+
| - **Median and Quartiles using the CDF**                          |
+===================================================================+
| The median is the value of $x$ for which $F(x) = 0.5$.            |
|                                                                   |
| The first quartile can be similarly found by $F(x) = 0.25$ and    |
| the third quartile $F(x) = 0.75$.                                 |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------+
| - **Example** Calculate median and quartiles using a CDF                                    |
+==============================================+==============================================+
| The continuous random variable $X$ has CDF $F(x) =$ $\frac{x^{3} - 1}{63}$ on               |
| $\lbrack 1,4\rbrack$.                                                                       |
+----------------------------------------------+----------------------------------------------+
| a.  Find the median                          | b.  Find the first quartile $Q_{1}$          |
|                                              |                                              |
| $${F(x) = \frac{1}{2}                        | $${F(x) = \frac{1}{4}                        |
| }{\frac{x^{3} - 1}{63} = \frac{1}{2}         | }{\frac{x^{3} - 1}{63} = \frac{1}{4}         |
| }{x^{3} - 1 = \frac{63}{2}                   | }{x^{3} - 1 = \frac{63}{4}                   |
| }{x^{3} = \frac{65}{2}                       | }{x^{3} = \frac{67}{4}                       |
| }{x = \sqrt[3]{\frac{65}{2}} \approx 3.19}$$ | }{x = \sqrt[3]{\frac{67}{4}} \approx 2.56}$$ |
+----------------------------------------------+----------------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| A continuous probability distribution has PDF $f(x) =$            |
| $\frac{x^{4}}{11605}$ in the domain $\lbrack 4,9\rbrack$.         |
|                                                                   |
| Find the CDF and then find the median and third quartile.         |
|                                                                   |
| Q2: 7.86                                                          |
|                                                                   |
| Q3: 8.51                                                          |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The median can be found from the .....................        |
|     ..................... .................. by setting it equal  |
|     to 0.5                                                        |
+-------------------------------------------------------------------+

[]{#_Toc228214838 .anchor}Foundation

1.  For the CDF $F(x) = \frac{x^{2}}{64}$, find

    a.  the median Q₂

    b.  Q₁ and Q₃

$$Q_{2} = 4\sqrt{2}$$

$Q_{1}$: $4$

$Q_{3}$: $4\sqrt{3}$.

2.  For the CDF $F(x) = \frac{x^{3} + 8}{16}$, find

    a.  the median Q₂

    b.  Q₁ and Q₃

$$Q_{2} = 0$$

$Q_{1}$: $- \sqrt[3]{4}$

$Q_{3}$: $\sqrt[3]{4}$.

3.  Find the median of each continuous random variable correct to 2
    decimal places.

    a.  $f(x) =$ $\frac{3x^{2}}{511}$, interval
        $1\  \leq \ x\  \leq \ 8$

$$F(x) = \frac{x^{3} - \ 1}{511}$$

$$\frac{m^{3} - \ 1}{511} = \frac{1}{2}\ $$

$$m^{3} = \ 256.5\ $$

$$m\  \approx \ 6.35\ $$

b.  $f(x) =$ $\frac{3(x\  - \ 3)^{2}}{16}$, domain \[1, 5\]

$$F(x) = \frac{(x - 3)^{3} + \ 8}{16}$$

$$(m - 3)^{3} = \ 0$$

$$m\  = \ 3$$

c.  $f(x) =$ $\frac{(2x\  - \ 1)^{4}}{16105}$, domain \[1, 6\]

$$F(x) = \frac{(2x - 1)^{5} - \ 1}{161050}$$

$$(2m - 1)^{5} = \ 80526\ $$

$$2m\  - \ 1\  \approx \ 9.58\ $$

$$m\  \approx \ 5.29$$

d.  $f(x) =$ $\frac{x\left( x^{2} - \ 3 \right)^{3}}{3570}$, domain \[2,
    4\]

$$F(x) = \frac{\left( x^{2} - 3 \right)^{4} - \ 1}{28560}$$

$$\ \left( m^{2} - 3 \right)^{4} = \ 14281\ $$

$$m²\  - \ 3\  \approx \ 10.93$$

$$m\  \approx \ 3.73$$

4.  For $f(x) =$ $\frac{x^{2}}{168}$ defined on
    $2\  \leq \ x\  \leq \ 8$, find:

    a.  the median

$$F(x) = \frac{x^{3} - \ 8}{504} = 0.5$$

$m³\  = \ 260$

$$m\  \approx \ 6.38$$

b.  the 1st quartile

$$F(x) = \frac{x^{3} - \ 8}{504} = 0.25$$

$$m³\  = \ 134\ $$

$$m\  \approx \ 5.12$$

c.  the 3rd quartile

$$F(x) = \frac{x^{3} - \ 8}{504} = 0.75$$

$$m^{3} = \ 386\ $$

$$m\  \approx \ 7.28$$

d.  the 67th **percentile**; 67% probability to get a value this number
    or less.

$$F(x) = \frac{x^{3} - \ 8}{504} = 0.67$$

$$m³\  = \ 345.68\ $$

$$m\  \approx \ 7.02$$

e.  the 8th **decile**; 80% probability to get a value this number or
    less.

$$F(x) = \frac{x^{3} - \ 8}{504} = 0.8$$

$$m³\  = \ 411.2\ $$

$$m\  \approx \ 7.44$$

5.  For $f(x) =$ $\frac{x^{2}}{576}$ on $0 \leq x \leq 12$, find to 2
    d.p.

    a.  the 20th percentile

    b.  the median

    c.  the 3rd quartile

$$F(x) = \frac{x^{3}}{1728}.$$

20^th^ percentile: 7.02

Median: 9.52

3^rd^ quartile: 10.90

Development

6.  Define
    $f(x) = \ \frac{3}{32}x(4\  - \ x),\ 0\  \leq \ x\  \leq \ 4.$

    a.  State the mode.

Mode = $2$. Graph is a concave down parabola with maximum at $x = 2$.

b.  Confirm $\int_{0}^{4}{f(x)}dx\  = \ 1.$

$$\frac{3}{32}\int_{0}^{4}x(4 - x)\, dx = \frac{3}{32}\left\lbrack 2x^{2} - \frac{x^{3}}{3} \right\rbrack_{0}^{4}$$

$$= \frac{3}{32}\left( 32 - \frac{64}{3} \right)$$

$$= 1$$

c.  Write down $P(X\  \leq \ 2).$ What property of the curve allows this
    without integration?

$P(X \leq 2) = \frac{1}{2}$ by symmetry about $x = 2$.

d.  Evaluate $P(X\  \leq \ 1)$ and $P(X\  > \ 1).$ Explain why they add
    to 1.

$$P(X \leq 1) = \frac{3}{32}\left\lbrack 2x^{2} - \frac{x^{3}}{3} \right\rbrack_{0}^{1} = \frac{5}{32}$$

$$P(X > 1) = 1 - \frac{5}{32} = \frac{27}{32}$$

They add to $1$ because total probability is $1$.

e.  Evaluate $P(X\  \leq \ 0.5)$ and $P(X\  \geq \ 3.5).$ What do you
    notice?

$$P(X \leq 0.5) = \frac{3}{32}\left\lbrack 2(0.25) - \frac{0.125}{3} \right\rbrack = \frac{3}{32}\left( \frac{11}{24} \right) = \frac{11}{256}$$

$P(X \geq 3.5) =$ $\frac{11}{256}$ by symmetry.

They are equal.

f.  Find the CDF using $F(x) = \ \int_{0}^{x}{f(t)}dt.$

$$F(x) = \int_{0}^{x}\frac{3}{32}t(4 - t)\, dt = \frac{3}{32}\left\lbrack 2t^{2} - \frac{t^{3}}{3} \right\rbrack_{0}^{x}$$

$$= \frac{x^{2}(6 - x)}{32}$$

g.  Use the CDF to evaluate:

    i.  $P(X\  < \ 1.5)\ \ \$

    ii. $P(1\  < \ X\  < \ 1.5)\ \ \ \ \$

    iii. $P(3\  < \ X\  < \ 3.5)\ \ \ \ \$

    iv. $P(2\  < \ X\  < \ 2.5)$

$$i)\ F(1.5) = \frac{(2.25)(4.5)}{32} = \frac{81}{256}$$

$$ii)\ F(1.5) - F(1) = \frac{81}{256} - \frac{40}{256} = \frac{41}{256}$$

$iii)$ By symmetry = $P(0.5 < X < 1) = F(1) - F(0.5)$

$$= \frac{40}{256} - \frac{11}{256} = \frac{29}{256}$$

$$iv)\ F(2.5) - F(2) = \frac{(6.25)(3.5)}{32} - \frac{16}{32} = \frac{47}{256}$$

h.  ![](media/Random Variables 2_Continuous random variables/media/image50.png){width="1.9826760717410323in"
    height="1.5748031496062993in"}Graph the CDF.

i.  Confirm $P(X\  < \ 2)\  = \ 0.5\$using the CDF.

$$F(2) = \frac{4(4)}{32} = \frac{16}{32} = \frac{1}{2}$$

50% of data lie to the left of $x = 2$.

j.  Find Q₁ and Q₃ by solving $F(x)\  = \ 0.25$ and $F(x)\  = \ 0.75$.

$$Q_{1} \approx 1.3$$

$$Q_{3} \approx 2.7$$

7.  Define $f(x)\  = \ ce⁻ˣ,\ 0\  \leq \ x\  \leq \ 1.$

    a.  ![](media/Random Variables 2_Continuous random variables/media/image51.png){width="1.7638888888888888in"
        height="1.510667104111986in"}Sketch $y\  = \ f(x).$

    b.  Find $c$, given$\ f(x)$ is a PDF.

$$\int_{0}^{1}ce^{- x}\, dx = c\left( 1 - e^{- 1} \right) = \frac{c(e - 1)}{e} = 1$$

$$c = \frac{e}{e - 1}$$

c.  Find the CDF.

$$F(x) = \frac{e}{e - 1}\int_{0}^{x}e^{- t}\, dt = \frac{e}{e - 1}(1 - e^{- x})$$

d.  Find a general equation for finding any percentile by setting
    $F(x) = p$

Set $F(x) = p$

$$e^{- x} = 1 - \frac{p(e - 1)}{e}$$

$$x = log\left( \frac{e}{e - p(e - 1)} \right)$$

e.  Hence find Q₁, Q₂ and Q₃.

$$Q_{1}:\left( p = \frac{1}{4} \right):\ x = \ln\left( \frac{4e}{3e + 1} \right)$$

$$Q_{2}:\left( p = \frac{1}{2} \right):\ x = \ln\left( \frac{2e}{e + 1} \right)$$

$$Q_{3}:\left( p = \frac{3}{4} \right):\ x = \ln\left( \frac{4e}{e + 3} \right)$$

# Expected Value and Variance

+---------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                                                            |
+====================================================+====================================================================================================+
| - Calculate expected value and variance from a discrete random distribution                                                                             |
|                                                                                                                                                         |
| > The table below shows the monetary return for playing a game of chance at a casino.                                                                   |
|                                                                                                                                                         |
| Find the expected value $E(X) = \Sigma xP(x)$                                                                                                           |
|                                                                                                                                                         |
|   -------------------------------------------------------------------------------------------------                                                     |
|                $$\mathbf{x}$$               $$- \$ 10$$       $$\$ 10$$          $$\$ 90$$                                                              |
|   ----------------------------------------- ----------------- ------------------ ------------------                                                     |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$  $$\frac{3}{4}$$   $$\frac{3}{13}$$   $$\frac{1}{52}$$                                                       |
|                                                                                                                                                         |
|   -------------------------------------------------------------------------------------------------                                                     |
|                                                                                                                                                         |
| $$- \$ 3.46$$                                                                                                                                           |
|                                                                                                                                                         |
| Find the variance $Var(X) = E\left( X^{2} \right) - \mu^{2} = \sum_{}^{}\left( x^{2}P(x) \right) - \mu^{2}$\                                            |
| and standard deviation $\sigma = \sqrt{VAR(X)}$                                                                                                         |
|                                                                                                                                                         |
|   -------------------------------------------------------------------------------------------------                                                     |
|                $$\mathbf{x}$$               $$- \$ 10$$       $$\$ 10$$          $$\$ 90$$                                                              |
|   ----------------------------------------- ----------------- ------------------ ------------------                                                     |
|    $$\mathbf{P}\left( \mathbf{x} \right)$$  $$\frac{3}{4}$$   $$\frac{3}{13}$$   $$\frac{1}{52}$$                                                       |
|                                                                                                                                                         |
|   -------------------------------------------------------------------------------------------------                                                     |
|                                                                                                                                                         |
| \$241.86                                                                                                                                                |
|                                                                                                                                                         |
| $$\sigma = 15.55$$                                                                                                                                      |
+---------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Expected Value and Variance of Continuous Random Variables**                                                                                        |
+----------------------------------------------------+----------------------------------------------------------------------------------------------------+
| **Expected Value (mean)**                          | **Variance**                                                                                       |
|                                                    |                                                                                                    |
| Discrete:                                          | **Discrete**:                                                                                      |
|                                                    |                                                                                                    |
| $$E(X) = \mu = \sum_{}^{}{xP(x)}$$                 | $$\text{Var}(X) = E\left( X^{2} \right) - \mu^{2} = \sum_{}^{}\left( x^{2}P(x) \right) - \mu^{2}$$ |
|                                                    |                                                                                                    |
| Continuous:                                        | **Continuous**:                                                                                    |
|                                                    |                                                                                                    |
| $$E(X) = \mu = \int_{a}^{b}{xf(x)dx}$$             | $$\text{Var}(X) = E\left( X^{2} \right) - \mu^{2} = \int_{a}^{b}{x^{2}f(x)dx} - \mu^{2}$$          |
+----------------------------------------------------+----------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate expected value and variance for a PDF                                                                     |
+==========================================================+========================================================================+
| The continuous random variable $X$ has PDF $f(x) =$ $\frac{3x^{2}}{8}$ on $\lbrack 0,2\rbrack$.                                   |
+----------------------------------------------------------+------------------------------------------------------------------------+
| Find the expected value.                                 | Find the variance.                                                     |
|                                                          |                                                                        |
| $${E(X) = \int_{0}^{2}{x \cdot \frac{3x^{2}}{8}}dx       | $${Var(X) = \int_{0}^{2}{x^{2} \cdot \frac{3x^{2}}{8}}dx - \mu^{2}     |
| }{= \int_{0}^{2}\frac{3x^{3}}{8}dx                       | }{= \int_{0}^{2}\frac{3x^{4}}{8}dx - \left( \frac{3}{2} \right)^{2}    |
| }{= \left\lbrack \frac{3x^{4}}{32} \right\rbrack_{0}^{2} | }{= \left\lbrack \frac{3x^{5}}{40} \right\rbrack_{0}^{2} - \frac{9}{4} |
| }{= \frac{3}{32}(16 - 0)                                 | }{= \frac{3}{40}(32 - 0) - \frac{9}{4}                                 |
| }{= \frac{3}{2}}$$                                       | }{= \frac{3}{20}}$$                                                    |
+----------------------------------------------------------+------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| The continuous random variable $X$ has PDF $f(x) =$               |
| $\frac{x^{2}}{21}$ on $\lbrack 1,4\rbrack$. Find $E(X)$ and       |
| $Var(X)$.                                                         |
|                                                                   |
| $$E(X) = \frac{85}{28},\ Var(X) = \frac{2067}{3920}$$             |
+-------------------------------------------------------------------+

Foundation

1.  A function is defined by
    $f(x) = \frac{1}{10},\ 0\  \leq \ x\  \leq \ 10.$

    a.  Show $f(x)$ is a valid PDF.

$$f(x) = \frac{1}{10} \geq 0$$

$$\int_{0}^{10}\frac{1}{10}\, dx = 1$$

b.  Calculate $E(X)$ using $E(X) = \ \int_{a}^{b}{xf(x)}dx.$

$$E(X) = \int_{0}^{10}\frac{x}{10}\, dx = \frac{1}{10}\left\lbrack \frac{x^{2}}{2} \right\rbrack_{0}^{10}$$

$$= 5$$

c.  Does $E(X)$ agree with your understanding of expected value as an
    average?

$E(X) = 5$ is the midpoint of $\lbrack 0,10\rbrack$, the expected
average for a uniform distribution

d.  Calculate
    $Var(X) = \ E\left( X^{2} \right) - \ \left( E(X) \right)^{2}$ then
    find $\sigma$ using $\sigma = \sqrt{Var}$

$$E\left( X^{2} \right) = \frac{1}{10}\int_{0}^{10}x^{2}\, dx = \frac{100}{3}$$

$$\text{Var} = \frac{100}{3} - 25 = \frac{25}{3}$$

$$\sigma = \frac{5}{\sqrt{3}}$$

2.  Define $f(x)\  = \ \frac{3}{2}x^{2},$ domain
    $\lbrack - 1,\ 1\rbrack.$

    a.  Confirm it is a valid PDF.

$$\int_{- 1}^{1}\frac{3}{2}x^{2}\, dx = \frac{3}{2}\left\lbrack \frac{x^{3}}{3} \right\rbrack_{- 1}^{1} = \frac{3}{2}\left( \frac{2}{3} \right) = 1$$

$$f(x) \geq 0\ as\ \frac{3}{2}x^{2} \geq 0$$

b.  Find E(X).

$$E(X) = \frac{3}{2}\int_{- 1}^{1}x^{3}\, dx = 0$$

c.  Find $Var(X)$ and $\sigma$.

$$E(X^{2}) = \frac{3}{2}\int_{- 1}^{1}x^{4}\, dx = \frac{3}{2}\left( \frac{2}{5} \right) = \frac{3}{5}$$

$$\text{Var}(X) = \frac{3}{5} - 0 = \frac{3}{5}$$

$$\sigma = \frac{\sqrt{15}}{5}$$

d.  Calculate $\int_{\mu - \sigma}^{\mu + \sigma}{f(x)}dx$ to find the
    percentage of the population within one standard deviation of the
    mean.

$$P\left( - \frac{\sqrt{15}}{5} \leq X \leq \frac{\sqrt{15}}{5} \right) = \frac{3}{2}\int_{- \frac{\sqrt{15}}{5}}^{\frac{\sqrt{15}}{5}}x^{2}\, dx = 3\left\lbrack \frac{x^{3}}{3} \right\rbrack_{0}^{\frac{\sqrt{15}}{5}}$$

$$= \left( \frac{\sqrt{15}}{5} \right)^{3} \approx 0.46$$

so approximately $46\%$

3.  Find the percentage of the population within one standard deviation
    of the mean, to 2 s.f:

    a.  $f(x)\  = \ 2x$, domain \[0, 1\]

    b.  $f(x)\  = \ |x|$, domain \[−1, 1\]

    c.  $f(x)\  = \ \frac{3}{64}x^{2},$ domain \[0, 4\]

a\) 63%

b\) 50%

c\) 67%
