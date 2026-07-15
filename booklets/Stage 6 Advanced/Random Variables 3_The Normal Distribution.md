  -------------------------------------------------------------------
  Mathematics Advanced Year 12
  -------------------------------------------------------------------
  **The Normal Distribution**

  -------------------------------------------------------------------

+------------------------------+-----------------------------------+------------------------------+
| **Book 1**                   | The normal distribution           | Version: 260508              |
|                              |                                   |                              |
|                              |                                   | Feedback:\                   |
|                              |                                   | https://MrDingMaths.com      |
+==============================+===================================+==============================+
| **Contents**                                                                                    |
|                                                                                                 |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                                    |
|                                                                                                 |
| [Learning Intention                                                                             |
| [3](#properties-of-the-normal-distribution)](#properties-of-the-normal-distribution)            |
+-------------------------------------------------------------------------------------------------+

# Syllabus Content

**MAV-12-07** solves problems involving discrete probability
distributions, continuous random variables and the normal distribution

**The normal distribution**

- Identify the normal distribution as a continuous probability
  distribution that is used to model many naturally occurring phenomena

- Identify the graph of the probability density function of a normal
  distribution, the normal curve, as an 'ideal' bell-shaped curve,
  symmetrical about its mean which is equal to its mode and median, and
  as having most values concentrated about the mean

- Identify contexts that can be approximately modelled by a normal
  random variable

- Use the notation $X \sim N\left( \mu,\sigma^{2} \right)$ to represent
  a normally distributed random variable that has mean $\mu$ and
  standard deviation $\sigma$

- Represent probabilities associated with the normal distribution by
  areas of shaded regions under the normal curve, which may extend to
  $\pm \infty$

- Apply the empirical rule to make judgements and solve problems
  involving probabilities of normally distributed data: that for normal
  distributions, approximately 68% of data lie within one standard
  deviation of the mean, approximately 95% within two standard
  deviations of the mean and approximately 99.7% within three standard
  deviations of the mean

- Use graphing applications to explore the normal distribution, graph
  the probability density function
  $f(x) = \frac{1}{\sigma\sqrt{2\pi}}e^{- \frac{({x - \mu)}^{2}}{2\sigma^{2}}}$,
  verify the empirical rule and graph the cumulative distribution
  function

- Recognise features of the normal curve, and identify the global
  maximum and points of inflection

- Distinguish between a standard normal distribution with mean 0 and
  standard deviation 1, and the non-standard normal distribution with
  mean $\mu$ and standard deviation $\sigma$

- Define the $z$-score, or standardised score, by the formula
  $z = \frac{x - \mu}{\sigma}$, where $\mu$ is the mean and $\sigma$ is
  the standard deviation, and $x$ is an observed value of a random
  variable

- Interpret the $z$-score as the number of standard deviations a score
  lies above or below the mean

- Use $z$-scores to compare scores from different sets of data and
  justify conclusions

- Use $z$-scores to identify probabilities of events less or more
  extreme than a given outcome and solve problems using tables for the
  standard normal distribution

- Solve problems involving finding the mean or standard deviation of a
  normal random variable given the probability of an event less or more
  extreme than a given outcome

- Use $z$-scores to make judgements related to probabilities of certain
  events or given sets of data assuming an underlying normal
  distribution

# Properties of the Normal Distribution

+------------------------------------------------------------------------+
| - **The Normal Distribution**                                          |
+========================================================================+
| - The normal distribution is a special continuous probability          |
|   distribution.                                                        |
|                                                                        |
| - A normal distribution is **bell-shaped** and **symmetric** about its |
|   mean.                                                                |
|                                                                        |
| - The **mean, median,** and **mode** are all **equal**.                |
|                                                                        |
| - Values are **concentrated near the mean**, with fewer values further |
|   away.                                                                |
|                                                                        |
| ![](media/Random Variables 3_The Normal Distribution/media/image3.png) |
|                                                                        |
| Mean                                                                   |
|                                                                        |
| Median                                                                 |
|                                                                        |
| Mode                                                                   |
+------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** a normal distribution                                                                                                                                                                                                                                                                                                                |
+=================================================================================================================+=================================================================================================================+=================================================================================================================+
| Identify which of the following histograms roughly follow a normal distribution.                                                                                                                                                                                                                                                                    |
+-----------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------+
| a.  ![A graph with a green line AI-generated content may be                                                     | b.                                                                                                              | c.                                                                                                              |
|     incorrect.](media/Random Variables 3_The Normal Distribution/media/image4.png){width="1.968503937007874in"  |                                                                                                                 |                                                                                                                 |
|     height="1.5737849956255467in"}                                                                              | ![A graph with green line and orange line AI-generated content may be                                           | ![A graph with a green line AI-generated content may be                                                         |
|                                                                                                                 | incorrect.](media/Random Variables 3_The Normal Distribution/media/image5.png){width="1.9680555555555554in"     | incorrect.](media/Random Variables 3_The Normal Distribution/media/image6.png){width="2.182638888888889in"      |
| Yes. Symmetrical and bell-shaped.                                                                               | height="1.2979166666666666in"}                                                                                  | height="1.1979166666666667in"}                                                                                  |
+-----------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------+
| d.  ![A graph with numbers and lines AI-generated content may be                                                | e.  ![A graph with numbers and lines AI-generated content may be                                                | f.  ![A graph with numbers and lines AI-generated content may be                                                |
|     incorrect.](media/Random Variables 3_The Normal Distribution/media/image7.png){width="1.9680555555555554in" |     incorrect.](media/Random Variables 3_The Normal Distribution/media/image8.png){width="1.9678149606299213in" |     incorrect.](media/Random Variables 3_The Normal Distribution/media/image9.png){width="1.9680555555555554in" |
|     height="1.2694444444444444in"}                                                                              |     height="1.616505905511811in"}                                                                               |     height="1.4805555555555556in"}                                                                              |
+-----------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Central limit theorem                                                                                                                                                                               |
+=========================================================================================================================================================================================================================+
| Imagine you toss a coin 10 times. How many heads would you expect to get?                                                                                                                                               |
|                                                                                                                                                                                                                         |
| Why would you be unlikely to always get this number of heads?                                                                                                                                                           |
|                                                                                                                                                                                                                         |
| Let's see what happens when you do lots of trials.                                                                                                                                                                      |
|                                                                                                                                                                                                                         |
| - <https://mrdingmaths.github.io/LawofLargeNumbers/>                                                                                                                                                                    |
|                                                                                                                                                                                                                         |
| +------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+ |
| | **10 experiments of 10 coin tosses**                                                                 | **100 experiments of 10 coin tosses**                                                                        | |
| |                                                                                                      |                                                                                                              | |
| | ![](media/Random Variables 3_The Normal Distribution/media/image10.png){width="3.300498687664042in"  | ![](media/Random Variables 3_The Normal Distribution/media/image11.png){width="3.300498687664042in"          | |
| | height="1.6153849518810148in"}                                                                       | height="1.5903280839895013in"}                                                                               | |
| +======================================================================================================+==============================================================================================================+ |
| | **1000 experiments of 10 coin tosses**                                                               | **10000 experiments of 10 coin                                                                               | |
| |                                                                                                      | tosses**![](media/Random Variables 3_The Normal Distribution/media/image13.png){width="3.2305369641294837in" | |
| | ![](media/Random Variables 3_The Normal Distribution/media/image12.png){width="3.2334711286089237in" | height="1.5903280839895013in"}                                                                               | |
| | height="1.5903280839895013in"}                                                                       |                                                                                                              | |
| +------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+ |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------+
| - **Central Limit Theorem**                                                                         |
+=====================================================================================================+
| The **normal distribution** is a bell-shaped probability distribution.\                             |
| Many naturally occurring characteristics follow this shape when the data set is large enough.       |
|                                                                                                     |
| ![](media/Random Variables 3_The Normal Distribution/media/image14.png){width="6.251776027996501in" |
| height="4.274055118110236in"}                                                                       |
|                                                                                                     |
| As the number of trials increases, a frequency distribution approaches a normal curve.              |
|                                                                                                     |
| This is the **Central Limit Theorem**.                                                              |
|                                                                                                     |
| The Central Limit Theorem lets us assume that large data sets will have a predictable bell shape,   |
| making it possible to calculate probabilities for many real-world phenomena.                        |
+-----------------------------------------------------------------------------------------------------+

Foundation

1.  

+-----------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| a.  Which normal curve has the higher mean?                                                         | b.  ![](media/Random Variables 3_The Normal Distribution/media/image16.png){width="1.6652777777777779in" |
|                                                                                                     |     height="1.6375in"}Which normal curve has the higher standard deviation?                              |
| ![](media/Random Variables 3_The Normal Distribution/media/image15.png){width="2.722916666666667in" |                                                                                                          |
| height="0.9263888888888889in"}                                                                      | Z                                                                                                        |
|                                                                                                     |                                                                                                          |
| Y                                                                                                   |                                                                                                          |
+=====================================================================================================+==========================================================================================================+

2.  The normal curves below are drawn with the same scale on each
    horizontal axis and the same scale on each vertical axis. Which
    distribution has the:

    a.  Largest standard deviation? ...............

A

b.  Smallest standard deviation? ...............

C

c.  Largest mean? ...............

B

d.  Smallest mean? ...............

![A line graph with orange lines AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image17.png){width="6.4736843832021in"
height="1.4234076990376203in"}C

3.  Draw two normal curves with:

+---------------------------------+---------------------------------+
| a.  the same mean but different | b.  different means but the     |
|     standard deviations         |     same standard deviation.    |
+=================================+=================================+

4.  The number of tomatoes on each plant of a large sample of a
    particular species of tomato is shown in the table.

  ---------------------------
    **Number of     **Number
   tomatoes on a       of
      plant**       plants**
  ---------------- ----------
         6             20

         7             32

         8             76

         9            142

         10           160

         11           146

         12            70

         13            38

         14            16
  ---------------------------

a.  Draw a frequency polygon of the data.

![](media/Random Variables 3_The Normal Distribution/media/image18.png){width="4.833816710411199in"
height="2.810003280839895in"}

b.  Calculate the mean, mode, median of the data.\
    Reminder: you will need to make the $xf$ and $cf$ columns on the
    table.

Mean: 10, Mode: 10, Median: 10

c.  Justify whether this is approximately a normal distribution.

Yes, the mean median mode are all 10, and the data has a bell-shaped
distribution.

5.  ![A graph with numbers and lines AI-generated content may be
    incorrect.](media/Random Variables 3_The Normal Distribution/media/image19.png){width="3.9555555555555557in"
    height="2.3534722222222224in"}Tommy says "The mean, median, mode of
    this dataset is 31, therefore it must be normally distributed." By
    drawing the frequency polygon, explain why Tommy is wrong.

  ---------------------------
   **Score**   **Frequency**
  ----------- ---------------
      30            10

      31            28

      32             6

      33             4

      34             2

      35             1
  ---------------------------

The distribution is not symmetrical, not "bell-shaped"

# The z-score

+-----------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                              |
+===========================================================================================================+
| - Work with mean $\mu\$and standard deviation $\sigma$                                                    |
|                                                                                                           |
| 1.  A dataset has mean 10 and standard deviation 2.                                                       |
|                                                                                                           |
| +------------------------------+------------------------------+                                           |
| | a.  How many standard        | b.  How many standard        |                                           |
| |     deviations above the     |     deviations below the     |                                           |
| |     mean is a score of 14?   |     mean is a score of 6?    |                                           |
| +==============================+==============================+                                           |
| | c.  How many standard        | d.  How many standard        |                                           |
| |     deviations above the     |     deviations below the     |                                           |
| |     mean is a score of 13?   |     mean is a score of 9?    |                                           |
| +------------------------------+------------------------------+                                           |
|                                                                                                           |
| 2.  A dataset has mean 50 and standard deviation 5.                                                       |
|                                                                                                           |
| +------------------------------+------------------------------+                                           |
| | a.  A score is 2 standard    | b.  A score is 1 standard    |                                           |
| |     deviations above the     |     deviation below the      |                                           |
| |     mean. What is the score? |     mean. What is the score? |                                           |
| +==============================+==============================+                                           |
| | c.  A score is 3 standard    | d.  A score is 1.5 standard  |                                           |
| |     deviations below the     |     deviations above the     |                                           |
| |     mean. What is the score? |     mean. What is the score? |                                           |
| +------------------------------+------------------------------+                                           |
|                                                                                                           |
| - Substitute into formulas                                                                                |
|                                                                                                           |
| +---------------------------------------------------+---------------------------------------------------+ |
| | a.  $z\  =$ $\frac{x\  - \ \mu}{\sigma}$\         | b.  $z\  =$ $\frac{x\  - \ \mu}{\sigma}$\         | |
| |     find $z$ when                                 |     find $z$ when                                 | |
| |     $x\  = \ 85,\ \mu\  = \ 70,\ \sigma\  = \ 5$. |     $x\  = \ 40,\ \mu\  = \ 55,\ \sigma\  = \ 5$. | |
| +===================================================+===================================================+ |
+-----------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **The z-score**                                                 |
+===================================================================+
| The z-score is the number of **standard deviations** that a value |
| lies above or below the mean.                                     |
|                                                                   |
| The z-score is **positive** if the data value is **above the      |
| mean**, and **negative** if the data value is **below the mean**. |
| If the data value **equals the mean**, the z-score is **zero**.   |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------+
| - **Identify** sign of z-score                                              |
+=========================+=========================+=========================+
| Value: 80               | Value: 60               | Value: 70               |
|                         |                         |                         |
| Mean: 70                | Mean: 70                | Mean: 70                |
|                         |                         |                         |
| $z$ is positive         | $z$ is negative         | $z$ is zero             |
+-------------------------+-------------------------+-------------------------+
| Identify whether the z-score would be positive, negative, or zero.          |
+-------------------------+-------------------------+-------------------------+
| a.  value = 45,\        | b.  value = 85,\        | c.  mean = 33,\         |
|     mean = 50           |     mean = 70           |     value = 40          |
|                         |                         |                         |
| $z$-score:              | $z$-score:              | $z$-score:              |
|                         |                         |                         |
| Positive \| Negative \| | Positive \| Negative \| | Positive \| Negative \| |
| Zero                    | Zero                    | Zero                    |
+-------------------------+-------------------------+-------------------------+
| d.  value = 87,\        | e.  value = 112,\       | f.  mean = 180,\        |
|     mean = 87           |     mean = 98           |     value = 100         |
|                         |                         |                         |
| $z$-score:              | $z$-score               | $z$-score:              |
|                         |                         |                         |
| Positive \| Negative \| | Positive \| Negative \| | Positive \| Negative \| |
| Zero                    | Zero                    | Zero                    |
+-------------------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------------+
| - **Interpret** z-score                                                     |
+=========================+=========================+=========================+
| $$z = 2$$               | $$z = 1.5$$             | $$z = - 1$$             |
|                         |                         |                         |
| 2 standard deviations   | 1.5 standard deviations | 1 standard deviation    |
| above the mean.         | above the mean.         | below the mean.         |
+-------------------------+-------------------------+-------------------------+
| Interpret these z-scores in context:                                        |
+-------------------------+-------------------------+-------------------------+
| a.  $z = - 2$           | b.  $z = 3$             | c.  $z = - 1.2$         |
|                         |                         |                         |
| 2 SD ...............    |                         |                         |
| mean                    |                         |                         |
+-------------------------+-------------------------+-------------------------+
| d.  $z = 1.5$           | e.  $z = - 2.3$         | f.  $z = 4$             |
+-------------------------+-------------------------+-------------------------+

+-------------------------------------------------------------------+
| - **Calculating the z-score**                                     |
+===================================================================+
| The z-score is how many standard deviations a score is from the   |
| mean.                                                             |
|                                                                   |
| raw score mean                                                    |
|                                                                   |
| $$z = \frac{x - \mu}{\sigma}$$                                    |
|                                                                   |
| standard deviation                                                |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Example** Calculate z-score                                       |
+===================================+===================================+
| $\mu$                             | $x$                               |
|                                   |                                   |
| In an English essay, the mean was | A person is 178 cm tall. Heights  |
| 60 and the standard deviation was | are normally distributed with     |
| 10.                               | mean 168 cm and SD 7 cm.          |
|                                   |                                   |
| $\sigma$ $x$                      | $\mu$ $\sigma$                    |
|                                   |                                   |
| Calculate the z-score for a mark  | Calculate the person's z-score to |
| of 55.                            | 3 d.p.                            |
|                                   |                                   |
| $${z = \frac{55 - 60}{10}         | $${z = \frac{178 - 168}{7}        |
| }{= - 0.5}$$                      | }{= 1.429}$$                      |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| a.  IQ scores are normally        | b.  IQ scores have mean 100 and   |
|     distributed with mean 100 and |     SD 15.                        |
|     standard deviation 15.        |                                   |
|                                   | Find the z-score for an IQ of 85. |
| Find the z-score for an IQ of     |                                   |
| 127.                              | $$- 1$$                           |
|                                   |                                   |
| 1.8                               |                                   |
+-----------------------------------+-----------------------------------+
| c.  The birth masses of newborns  | d.  Millie scored 85 in a maths   |
|     are normally distributed with |     exam.\                        |
|     mean 3.4 kg and SD 0.5 kg.    |     Find her z-score if the       |
|                                   |     scores for the maths exam are |
| Find the z-score for a newborn    |     normally distributed with     |
| with mass 2.9 kg                  |     mean 79 and standard          |
|                                   |     deviation 4.2.                |
| $$- 1$$                           |                                   |
|                                   | 1.43                              |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Calculating the Raw Score from the z-score**                  |
+===================================================================+
| mean z-score                                                      |
|                                                                   |
| $$x = \mu + z\sigma$$                                             |
|                                                                   |
| standard deviation                                                |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** Convert z-scores to raw scores                      |
+===================================================================+
| In a normal distribution the mean was 30 and the standard         |
| deviation was 3.5.                                                |
|                                                                   |
| Blake achieved a z-score score of 2. Calculate Blake's actual     |
| score.                                                            |
|                                                                   |
| $${x = \mu + z\sigma                                              |
| }{= 30 + 2(3.5)                                                   |
| }{= 37}$$                                                         |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| a.  The marks on a test are       | b.  The marks on a test are       |
|     normally distributed with a   |     normally distributed with a   |
|     mean of 65 and a standard     |     mean of 65 and a standard     |
|     deviation of 8.               |     deviation of 8.               |
|                                   |                                   |
| What mark corresponds to z-score  | What mark is a z-score of $- 2$?  |
| of 1?                             |                                   |
|                                   | 49                                |
| 73                                |                                   |
+-----------------------------------+-----------------------------------+
| c.  A class test has a mean mark  | d.  Jordan achieved a z-score of  |
|     of 34 and a standard          |     2.5 for a reading test.\      |
|     deviation of 4.               |     The mean for this reading     |
|     Mary's standardised test mark |     test was 71.5 and the         |
|     was                           |     standard deviation was 6.4.\  |
|                                   |     What mark did Jordan get?     |
| $z\  = \  - 1.5$.\                |                                   |
| What was Mary's actual mark?      | 87.5                              |
|                                   |                                   |
| 28                                |                                   |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The z-score is how many ..................                    |
|     ..................... a score is from the mean.               |
|                                                                   |
| 2.  A z-score is .................. when it is below the mean,    |
|     and .................. when it is above.                      |
+-------------------------------------------------------------------+

Foundation

1.  What is the z-score that corresponds to a score that is:

    a.  Two standard deviations above the mean?

2

b.  Two standard deviations below the mean?

$$- 2$$

c.  Three standard deviations above the mean?

3

d.  0.23 standard deviations below the mean?

$$- 0.23$$

2.  Calculate the z-score, correct to one decimal place, for each of the
    following:

+----------------------------------+----------------------------------+-----------------------------------+
| a.  $x = 60,\mu = 75,\sigma = 9$ | b.  $x = 22,\mu = 27,\sigma = 2$ | c.  $x = 10,\mu = 5,\ \sigma = 4$ |
|                                  |                                  |                                   |
| $$- 1.7$$                        | $$- 2.5$$                        | $$1.3$$                           |
+==================================+==================================+===================================+

3.  The mean height for a group of students is 180 cm with a standard
    deviation of 6 cm.\
    What is Julie's standardised score (z-score) if her height is 171cm?

$$- 1.5$$

4.  In an examination the mean was 65 and the standard deviation 10.\
    Write the raw examination mark corresponding to these standardised
    scores.

+----------------------+----------------------+----------------------+
| a.  1                | b.  $- 1$            | c.  2                |
|                      |                      |                      |
| 75                   | 55                   | 85                   |
+======================+======================+======================+
| d.  3                | e.  $- 3$            | f.  1.5              |
|                      |                      |                      |
| 95                   | 35                   | 80                   |
+----------------------+----------------------+----------------------+
| g.  0.8              | h.  $- 2.3$          | i.  $2.7$            |
|                      |                      |                      |
| 73                   | 42                   | 92                   |
+----------------------+----------------------+----------------------+

5.  The monthly rainfall in Rockwaters has a mean of 55 mm and a
    standard deviation of 1.8 mm. What is the monthly rainfall if the
    standardised score was 3.2?

$60.8$ mm

6.  A normally distributed data set has mean 23 and standard deviation
    2.\
    Which raw score has a $z$-score of 2.5?

$$x = \mu + z\sigma = 23 + 2.5(2)$$

$$= 28$$

7.  In a History examination the mean was 56 and the standard deviation
    8. \
    Complete the table, which shows the marks scored by some students.

  ---------------------------------------------------------------------------------------
   **Student**   **Mark**   **Standardised      **Student**   **Mark**   **Standardised
                               score**                                   score**
  ------------- ---------- ---------------- --- ------------- ---------- ----------------
      Julie         65          1.125           Sam           40         $$- 2$$

      Imran         48         $$- 1$$          Megumi        56         0

      Sevvy         72          $$2$$           Sasha         38         $$- 2.25$$
  ---------------------------------------------------------------------------------------

8.  Holly gained a standardised score (z-score) of −3 for a fitness
    test.

    a.  Describe Holly's results in terms of the mean and standard
        deviation of the test.

Holly\'s result was 3 standard deviations below the mean of the fitness
test.

b.  The fitness test has a mean of 75 and a standard deviation of 7.\
    What is the actual mark scored by Holly?

54

9.  A normally distributed data set has standard deviation 4.5. A score
    of 39 has a $z$-score of 2.7. Find the mean.

$$z = \frac{x - \mu}{\sigma}$$

$$2.7 = \frac{39 - \mu}{4.5}$$

$$\mu = 39 - 12.15 = 26.85$$

10. The standard deviation of a normal distribution is 3.3 and the
    $z$-score of 45 is $- 1$.\
    Find the mean.

$$- 1 = \frac{45 - \mu}{3.3}$$

$$\mu = 45 + 3.3 = 48.3$$

Development

11. Find the standard deviation of a normally distributed data set with
    mean 89, if a raw score of 59 has $z$-score $- 0.6$.

$$- 0.6 = \frac{59 - 89}{\sigma}$$

$$\sigma = \frac{- 30}{- 0.6} = 50$$

12. An assessment task is marked out of 20. The results of the test are
    shown below.

10 11 19 17 14 15 17 11 12 14 8 16 18 20 14 13

a.  Calculate the mean and population standard deviation for these
    scores.

> Answer correct to one decimal place.

Mean: 14.3, $\sigma = 3.3$

b.  What is the z-score of the student who scored the lowest on the
    test? Answer to 1 d.p.

$$- 1.9$$

c.  Lucy was absent for this task, but her mark is usually 1.5 standard
    deviations above the mean. What mark should her teacher give her as
    an estimate?

19.25

13. An assessment task is marked out of 100. The results of the test are
    shown below.

75 80 65 66 79 83 61 77 87 88 67 74 79 75 80 81

a.  Calculate the mean and population standard deviation for these
    scores.\
    Answer correct to one decimal place.

$$\mu = 76.1,\ \sigma = 7.6$$

b.  What is his z-score of the student who scored the highest on the
    test? Answer to 1 dp.

1.6

c.  Mason was absent for this task, but his mark is usually 1.9 standard
    deviations below the mean. What mark should his teacher give him as
    an estimate?

61.66

# Comparing Performance using the z-score

+-------------------------------------------------------------------+
| - **Review**                                                      |
+===================================================================+
| - Interpret z-score                                               |
|                                                                   |
| +------------------------------+------------------------------+   |
| | a.  A student has            | b.  A student has $z = - 2$  |   |
| |     $z\  = \ 2$ in their     |     in their maths test and  |   |
| |     maths test and $z = 3$   |     $z = - 3$ in their       |   |
| |     in their science test.\  |     science test.\           |   |
| |     In which test did they   |     In which test did they   |   |
| |     perform better relative  |     perform better relative  |   |
| |     to the class?            |     to the class?            |   |
| +==============================+==============================+   |
| | c.  For time to swim 50      | d.  For time to swim 50      |   |
| |     metres, a student has    |     metres, a student has    |   |
| |     $z = 2$ for freestyle    |     $z = - 1$ for freestyle  |   |
| |     and $z = 3$ for          |     and $z = 0$ for          |   |
| |     butterfly. In which were |     butterfly. In which were |   |
| |     they faster?             |     they faster?             |   |
| +------------------------------+------------------------------+   |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Applications of the z-score                                                                                    |
+====================================================================================================================================+
| Consider two tests with scores that are normally distributed with the same mean, but different standard deviations:                |
|                                                                                                                                    |
| Mean: 70, SD: 5 Mean: 70, SD: 10                                                                                                   |
|                                                                                                                                    |
| ![](media/Random Variables 3_The Normal Distribution/media/image20.png){width="2.6933759842519684in"                               |
| height="0.9448818897637795in"}                                                                                                     |
|                                                                                                                                    |
| ![](media/Random Variables 3_The Normal Distribution/media/image20.png){width="2.987179571303587in"                                |
| height="0.47357720909886264in"}                                                                                                    |
|                                                                                                                                    |
| ![](media/Random Variables 3_The Normal Distribution/media/image21.png){width="3.301281714785652in"                                |
| height="0.31530621172353457in"}![](media/Random Variables 3_The Normal Distribution/media/image21.png){width="3.301281714785652in" |
| height="0.31530621172353457in"}                                                                                                    |
|                                                                                                                                    |
| If someone scored 85. In which test have they performed better, relative to the cohort?\                                           |
| What would your answer be, without any calculation?                                                                                |
|                                                                                                                                    |
| Confirm this by calculating the z-score for each test.                                                                             |
|                                                                                                                                    |
| If you score 85 in the first test, what would the **equivalent** score of the same z-score be in the second test?                  |
+------------------------------------------------------------------------------------------------------------------------------------+
| - **Comparing Performance using z-scores**                                                                                         |
+------------------------------------------------------------------------------------------------------------------------------------+
| A higher z-score is usually better, such as in test scores.                                                                        |
|                                                                                                                                    |
| A lower z-score can sometimes be better, such as time to complete a task.                                                          |
+------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| - **Example** Compare performance using z-scores                             |
+======================================+=======================================+
| Cate's test scores are shown below:  | In the swimming carnival, Olivia      |
|                                      | participated in two events:           |
| English: score: 55, mean: 50, SD:    |                                       |
| 6.                                   | Freestyle: time: 50 s, mean: 50, SD:  |
|                                      | 5,                                    |
| Maths: score: 64, mean: 59, SD: 9.   |                                       |
|                                      | Backstroke: time: 80s, mean: 90, SD:  |
| In which test did she perform        | 4.                                    |
| better?                              |                                       |
|                                      | In which event did she perform        |
| $$z_{E} = \frac{55 - 50}{6} = 0.83$$ | better?                               |
|                                      |                                       |
| $$z_{M} = \frac{64 - 59}{9} = 0.56$$ | $$z_{F} = \frac{50 - 50}{5} = 0$$     |
|                                      |                                       |
| She performed better in English, as  | $$Z_{B} = \frac{80 - 90}{4} = - 2.5$$ |
| a higher test score is better.       |                                       |
|                                      | She performed better in backstroke,   |
|                                      | as a faster time is better.           |
+--------------------------------------+---------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| a.  In which subject was Amelie's test performance better?\       |
|     Justify your answer using the z-scores.                       |
|                                                                   |
| Maths: score 78, mean 70, SD 4.                                   |
|                                                                   |
| English: score 83, mean 79, SD 4.                                 |
|                                                                   |
| Maths. Her score was 2 standard deviations above the mean,        |
| compared to 1 in English.                                         |
+-------------------------------------------------------------------+
| b.  In which subject was Willa's test performance better?         |
|                                                                   |
| Justify your answer using the z-scores.                           |
|                                                                   |
| Maths: score 55, mean 60, SD 5                                    |
|                                                                   |
| English: score 68, mean 70, SD 4                                  |
|                                                                   |
| English. Her score was only 0.5 standard deviations below the     |
| mean, compared to 1 in Maths.                                     |
+-------------------------------------------------------------------+
| c.  In which event was Aspen's performance better?                |
|                                                                   |
| Justify your answer using the z-scores.                           |
|                                                                   |
| 100 m: time: 10, mean 12, SD 3                                    |
|                                                                   |
| 200 m: time: 22, mean 25, SD 5                                    |
|                                                                   |
| 100 m. Her z-score was more negative, meaning she was further     |
| below the mean time.                                              |
+-------------------------------------------------------------------+
| - **Finding the Equivalent Score**                                |
+-------------------------------------------------------------------+
| For a score in dataset A, to find the equivalent score in dataset |
| B:                                                                |
|                                                                   |
| 1\. Calculate z-score of the raw score in dataset A. $z_{A} =$    |
| $\frac{x_{A} - \mu_{A}}{\sigma_{A}}$                              |
|                                                                   |
| 2\. Calculate the raw score in dataset B using dataset A's        |
| z-score. $x_{B} = \mu_{B} + z_{A}\sigma_{B}$                      |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------+
| - **Example** Find the equivalent score using the z-score                            |
+===============================================+======================================+
| Charlotte scored 64 in a mathematics test in which the mean was 59 and SD was 9.     |
|                                                                                      |
| The English test has a mean of 50 and SD of 6.                                       |
|                                                                                      |
| What mark would she have to score in English for her performance to be equivalent?   |
+-----------------------------------------------+--------------------------------------+
| 1\. Calculate z-score for maths               | 2\. Calculate equivalent score in    |
|                                               | English using maths z-score          |
| $${z_{M} = \frac{x_{M} - \mu_{M}}{\sigma_{M}} |                                      |
| }{z_{M} = \frac{64 - 59}{9}                   | $${x_{E} = \mu_{E} + z_{M}\sigma_{E} |
| }{= 0.56}$$                                   | }{= 50 + 0.56(6)                     |
|                                               | }{= 53.36}$$                         |
+-----------------------------------------------+--------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| Liam scored 72 in a science test in which the mean was 60 and the |
| SD was 8.                                                         |
|                                                                   |
| The history test has a mean of 55 and SD of 4.                    |
|                                                                   |
| What mark would he need to score in history for his performance   |
| to be equivalent?                                                 |
|                                                                   |
| 61                                                                |
|                                                                   |
| Maya scored 45 in a geography test in which the mean was 50 and   |
| the SD was 5.                                                     |
|                                                                   |
| The art test has a mean of 60 and SD of 8.                        |
|                                                                   |
| What mark in art would represent an equivalent performance?       |
|                                                                   |
| 52                                                                |
+-------------------------------------------------------------------+

Foundation

1.  ![A green rectangular object with black text AI-generated content
    may be
    incorrect.](media/Random Variables 3_The Normal Distribution/media/image22.png){width="3.8569444444444443in"
    height="1.176388888888889in"}The table shows the mean and standard
    deviation of the results in a Chinese and a Vietnamese exam.

Hoang scored 81 in Chinese and 77 in Vietnamese.

a.  What is Hoang's z-score for his result in Chinese?

1.5

b.  What is Hoang's z-score for his result in Vietnamese?

2

c.  In which of the two exams was his result better? Justify your
    answer.

Vietnamese, he has a higher z-score in Vietnamese so his performance
relative to the group was stronger.

2.  Tom scored 78% on a Science test and 72% on a Mathematics test.

    a.  In which test does Tom appear to have performed better?

Looking only at the raw scores, Tom appears to have performed better in
the Science test (78%) than in the Mathematics test (72%).

b.  The mean score for the Science test was 66% and the mean score for
    the Mathematics test was 62%. Using this information and Tom's test
    scores, in which test does he appear to have performed better?

Tom still appears to have performed better in Science as he scored 12%
above the mean, compared to 10% above the mean in Mathematics.

c.  The standard deviation of the scores for the Science test was 6% and
    the standard deviation of the scores for the Mathematics test was
    4%. Using all the information you now have, in which test has Tom
    performed better? Explain your answer.

Tom performed better in Mathematics with a z-score of 2.5 compared to
2.0 in Science.

The standard deviation in Mathematics (4%) was smaller than in Science
(6%), indicating that scores were more tightly clustered around the
mean.\
This makes Tom\'s achievement of scoring 10% above the mean in
Mathematics more significant than scoring 12% above the mean in Science.

3.  Complete the following table, which shows Issy's marks in her yearly
    examinations.

  ----------------------------------------------------------
   **Subject**   **Mark**   **Mean**   **SD**  **Z-score**
  ------------- ---------- ---------- -------- -------------
     English        51         55        5     $$- 0.8$$

      Maths         64         60        12    0.33

     Biology        62         58        8     0.5

       Art          76         56        9     2.22

    Economics       58         58        14    0

     History        51         60        11    $$- 0.82$$
  ----------------------------------------------------------

a.  In which subject was her relative performance the best?

Art

b.  Did she perform better in English or History?

English. $- 0.8$ is greater than $- 0.82$

c.  In which subject was her relative performance the worst?

History

4.  The marks for five students in the Physics examination are shown.\
    In the half-yearly the mean was 60 and the standard deviation was
    16.\
    In the yearly examination the mean was 58 and the standard deviation
    is 12.

    a.  Fill in the tables, also calculate the change in the z-score.

  ---------------------------------------------------------------------------------
   **Student**   **Mark**  **z score**       **Mark**  **z score**     **Change**
  ------------- ---------- ------------ --- ---------- ----------- --- ------------
     Olivia         71     0.69                 69     0.92            +0.23

     Harriet        41     $$- 1.19$$           40     $$- 1.5$$       -0.31

     Trinity        84     1.5                  80     1.83            +0.33

     Hannah         51     $$- 0.56$$           59     0.08            +0.64

      Karla         62     0.13                 52     $$- 0.5$$       -0.63
  ---------------------------------------------------------------------------------

b.  With reference to the z-score, which students improved the most?

Hannah, her z-score increased the most

c.  Which students performed worse in the second examination?

Harriet and Karla

d.  Which student's performance decreased the most?

Karla, her z-score decreased the most

e.  Which student's performance was the most consistent?

Olivia, her z-score changed the least.

![A table with numbers and letters AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image23.png){width="5.0777777777777775in"
height="1.4650678040244969in"}Development

5.  The table shows Melissa's marks in four Mathematics tests.

1.17

1.3

1.13

1.5

a.  Add a z-score column to the table and calculate the standardised
    scores.

b.  In which term was her relative performance best?

Term 1

c.  In which term was her relative performance worst?

Term 3

d.  Did her performance improve or worsen from:

    i.  Term 1 to term 2?

improved

ii. Term 2 to term 3?

worsened

iii. Term 3 to term 4?

improved

6.  ![A table with numbers and text AI-generated content may be
    incorrect.](media/Random Variables 3_The Normal Distribution/media/image24.png){width="5.274261811023622in"
    height="1.8222222222222222in"}The table below contains the scores a
    student obtained in the Trial HSC.\
    Also shown is the mean and standard deviation for each subject

0

-2.25

2.25

3

1.1

a.  Add a new column to the table and calculate their z-score for each
    subject.

b.  Use the z-score to rate their performance in each subject from the
    best performing subject to the worst performing subject.

Business studies, Biology, Legal Studies, English, Mathematics

c.  The Mathematics result was entered incorrectly. The mean was 62 not
    82.\
    How did above error affect the z-score Mathematics? Give reasons for
    your answer.

The change to the mean changes her z-score from -2.25 to 2.75. This
means the student performed exceptionally well in Maths.

7.  Michael compared his recent marks in two subjects:

Construction: mark 77, mean 64.6, standard deviation 10.1

Legal studies: mark 74, mean $\overline{x}$, standard deviation 12.5

a.  What is Michael's z-score (correct to two decimal places) for his
    mark in Construction?

1.23

b.  Michael achieved the same z-score in both Construction and Legal
    studies.\
    What is the mean for Legal studies? Answer correct to one decimal
    place.

58.6

c.  What mark does Michael require in Construction to achieve a z-score
    of 2?

84.8

d.  What mark does Michael require in Legal studies to achieve a z-score
    of 2?

83.6

# The 68 -- 95 -- 99.7 (or Empirical) Rule

+-------------------------------------------------------------------+
| - **Review**                                                      |
+===================================================================+
| - Work with z-score                                               |
|                                                                   |
| +------------------------------+------------------------------+   |
| | a.  A distribution has mean  | b.  A distribution has mean  |   |
| |     450 and SD 35. Find the  |     450 and SD 35. Find the  |   |
| |     z-score for a value of   |     z-score for a value of   |   |
| |     380.                     |     520.                     |   |
| +==============================+==============================+   |
| | c.  A normal distribution    | d.  A normal distribution    |   |
| |     has mean 72.\            |     has mean 50.\            |   |
| |     If z = 1 corresponds to  |     If z = 2 corresponds to  |   |
| |     the value 80, what value |     the value 75, what value |   |
| |     corresponds to z = −1?   |     corresponds to z = −2?   |   |
| +------------------------------+------------------------------+   |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Empirical Rule**                                                                                                                                                   |
+===================================+====================================================================================================================================+
| In a normal distribution, specific percentages of data always fall within certain standard deviation ranges.                                                           |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
| 68% of data have z-scores\        | 95% of data have z-scores\                                                                                                         |
| between −1 and 1                  | between −2 and 2                                                                                                                   |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
| 99.7% of data have z-scores\      | ![A diagram of a normal distribution AI-generated content may be                                                                   |
| between −3 and 3                  | incorrect.](media/Random Variables 3_The Normal Distribution/media/image25.png){width="2.4621216097987753in"                       |
|                                   | height="0.9627329396325459in"}![](media/Random Variables 3_The Normal Distribution/media/image26.png){width="2.4618055555555554in" |
|                                   | height="0.9in"}![](media/Random Variables 3_The Normal Distribution/media/image27.png){width="2.4618055555555554in"                |
|                                   | height="0.9909722222222223in"}![](media/Random Variables 3_The Normal Distribution/media/image28.png){width="2.4541666666666666in" |
|                                   | height="0.9770833333333333in"}50% of data lie above the mean and\                                                                  |
|                                   | 50% of data lie below the mean.                                                                                                    |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------+
| - **Empirical Rule**                                                                                |
+=====================================================================================================+
| ![](media/Random Variables 3_The Normal Distribution/media/image29.png){width="5.159090113735783in" |
| height="3.738471128608924in"}                                                                       |
+-----------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Apply** empirical rule                                                                                                                                                                  |
+=======================================+=======================================+=============================================================================================================+
| ![A diagram of a function AI-generated content may be incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in"                           |
| height="1.457638888888889in"}![A diagram of a function AI-generated content may be                                                                                                          |
| incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in" height="1.457638888888889in"}![A diagram of a function AI-generated content may |
| be incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in" height="1.457638888888889in"}Shade in these normal curves to and give the    |
| percentage of scores in the given z-score range                                                                                                                                             |
+---------------------------------------+---------------------------------------+-------------------------------------------------------------------------------------------------------------+
| $$z \leq 0$$                          | $$z \geq 0$$                          | $$0 \leq z \leq 1$$                                                                                         |
|                                       |                                       |                                                                                                             |
|                                       |                                       | ![A diagram of a function AI-generated content may be                                                       |
|                                       |                                       | incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in" |
|                                       |                                       | height="1.457638888888889in"}                                                                               |
+---------------------------------------+---------------------------------------+-------------------------------------------------------------------------------------------------------------+
| $$- 2 \leq z \leq 0$$                 | $$1 \leq z \leq 2$$                   | $$z \leq 1$$                                                                                                |
|                                       |                                       |                                                                                                             |
|                                       |                                       | ![](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in"         |
|                                       |                                       | height="1.457638888888889in"}![A diagram of a function AI-generated content may be                          |
|                                       |                                       | incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in" |
|                                       |                                       | height="1.457638888888889in"}                                                                               |
+---------------------------------------+---------------------------------------+-------------------------------------------------------------------------------------------------------------+

Foundation

1.  Use the graphs to answer these questions.

    a.  ![A diagram of a normal distribution AI-generated content may be
        incorrect.](media/Random Variables 3_The Normal Distribution/media/image31.png){width="3.1479166666666667in"
        height="1.7166666666666666in"}What percentage of scores have a
        z-score:

+--------------+--------------+
| between −1   | between 0    |
| and 1?       | and 1?       |
|              |              |
| 68\$         | 34%          |
+==============+==============+
| between 0    | greater than |
| and −1?      | 0?           |
|              |              |
| 34%          | 50%          |
+--------------+--------------+
| less than 0? | greater than |
|              | 1?           |
| 50%          |              |
|              | 16%          |
+--------------+--------------+
| less than    | greater than |
| −1?          | −1?          |
|              |              |
| 16%          | 84%          |
+--------------+--------------+

b.  ![A diagram of a normal distribution AI-generated content may be
    incorrect.](media/Random Variables 3_The Normal Distribution/media/image32.png){width="3.1479166666666667in"
    height="1.6319444444444444in"}What percentage of scores have a
    z-score:

+--------------+--------------+
| between −2   | between 0    |
| and 2?       | and 2?       |
|              |              |
| 95%          | 47.5%        |
+==============+==============+
| between 0    | greater than |
| and −2?      | 2?           |
|              |              |
| 47.5%        | 2.5%         |
+--------------+--------------+
| less than    | greater than |
| −2?          | −2?          |
|              |              |
| 2.5%         | 97.5%        |
+--------------+--------------+
| less than 2? |              |
|              |              |
| 97.5%        |              |
+--------------+--------------+

c.  ![A diagram of a normal distribution AI-generated content may be
    incorrect.](media/Random Variables 3_The Normal Distribution/media/image33.png){width="3.0755872703412073in"
    height="1.6319444444444444in"}What percentage of scores have a
    z-score:

+--------------+--------------+
| between −3   | between 0    |
| and 3?       | and 3?       |
|              |              |
| 99.7%        | 49.85%       |
+==============+==============+
| between 0    | greater than |
| and −3?      | 3?           |
|              |              |
| 49.85%       | 0.15%        |
+--------------+--------------+
| less than    | greater than |
| −3?          | −3?          |
|              |              |
| 0.15%        | 99.85%       |
+--------------+--------------+
| less than 3? |              |
|              |              |
| 99.85%       |              |
+--------------+--------------+

Development

2.  What proportion of scores is shaded in each diagram?

+----------------------+----------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+
| a.                   | b.  ![](media/Random Variables 3_The Normal Distribution/media/image34.png){width="1.8784722222222223in" | c.  ![](media/Random Variables 3_The Normal Distribution/media/image35.png){width="1.8194444444444444in"                               |
|                      |     height="1.1833333333333333in"}                                                                       |     height="1.1833333333333333in"}![](media/Random Variables 3_The Normal Distribution/media/image36.png){width="1.8790791776027997in" |
| 34%                  |                                                                                                          |     height="1.2380391513560804in"}                                                                                                     |
|                      | 68%                                                                                                      |                                                                                                                                        |
|                      |                                                                                                          | 47.5%                                                                                                                                  |
+======================+==========================================================================================================+========================================================================================================================================+
| d.                   | e.  ![](media/Random Variables 3_The Normal Distribution/media/image37.png){width="1.7756944444444445in" | f.  ![](media/Random Variables 3_The Normal Distribution/media/image38.png){width="1.7756944444444445in"                               |
|                      |     height="1.1756944444444444in"}                                                                       |     height="1.1215277777777777in"}![](media/Random Variables 3_The Normal Distribution/media/image39.png){width="1.8194444444444444in" |
| 99.7%                |                                                                                                          |     height="1.1756944444444444in"}                                                                                                     |
|                      | 83.85%                                                                                                   |                                                                                                                                        |
|                      |                                                                                                          | 16%                                                                                                                                    |
+----------------------+----------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+

3.  What percentage of scores have a z-score between:

+----------------------+----------------------+----------------------+
| a.  1 and 2?         | b.  1 and 3?         | c.  2 and 3?         |
|                      |                      |                      |
| 13.5%                | 15.85%               | 2.35%                |
+======================+======================+======================+
| d.  −1 and 2?        | e.  −1 and 3?        | f.  −2 and 1?        |
|                      |                      |                      |
| 81.5%                | 83.85%               | 81.5%                |
+----------------------+----------------------+----------------------+
| g.  −2 and 3?        | h.  −3 and 1?        | i.  −3 and 2?        |
|                      |                      |                      |
| 97.35%               | 83.85%               | 97.35%               |
+----------------------+----------------------+----------------------+

4.  Using only the given information, fill in the missing percentages of
    the normal curve.

> (you will need to do this in an exam as the normal curve is not given
> to you)

![A diagram of a function AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="3.29545384951881in"
height="2.2184601924759404in"}

![](media/Random Variables 3_The Normal Distribution/media/image29.png){width="3.688888888888889in"
height="0.6625in"}

See diagram in notes section for answer

# Applications of the Empirical Rule

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** raw-scores on a normal distribution curve                                                                                                                                                                 |
+=============================================================================================================+=============================================================================================================+
| Write the corresponding raw score under the z-score for these datasets                                                                                                                                                    |
+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| mean 25, SD 5                                                                                               | ![A diagram of a function AI-generated content may be                                                       |
|                                                                                                             | incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.338581583552056in" |
| ![A diagram of a function AI-generated content may be                                                       | height="1.5444444444444445in"}mean 450, SD 35                                                               |
| incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.338581583552056in" |                                                                                                             |
| height="1.5444444444444445in"}                                                                              |                                                                                                             |
|                                                                                                             |                                                                                                             |
| 10 15 20 25 30 35 40                                                                                        |                                                                                                             |
+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| mean 12, SD 2                                                                                               | ![A diagram of a function AI-generated content may be                                                       |
|                                                                                                             | incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.338581583552056in" |
| ![A diagram of a function AI-generated content may be                                                       | height="1.5444444444444445in"}mean 10, SD 4                                                                 |
| incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.338581583552056in" |                                                                                                             |
| height="1.5444444444444445in"}                                                                              |                                                                                                             |
+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| mean 100, SD 20                                                                                             | ![A diagram of a function AI-generated content may be                                                       |
|                                                                                                             | incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.338581583552056in" |
| ![A diagram of a function AI-generated content may be                                                       | height="1.5444444444444445in"}mean $-$`<!-- -->`{=html}10, SD 5                                             |
| incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.338581583552056in" |                                                                                                             |
| height="1.5444444444444445in"}                                                                              |                                                                                                             |
+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Applying the Empirical Rule**                                 |
+===================================================================+
| When answering normal distribution questions related to the       |
| empirical rule, always sketch the normal curve and put on the     |
| corresponding raw scores.                                         |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------+
| - **Example** Apply the empirical rule to solve problems                                             |
+======================================================================================================+
| ![](media/Random Variables 3_The Normal Distribution/media/image29.png){width="2.5781255468066493in" |
| height="1.2911461067366579in"}The distribution of delivery times for pizzas made by Pizza House is   |
| approximately normal, with a mean of 25 minutes and a standard deviation (SD) of 5 minutes.          |
|                                                                                                      |
| 10 15 20 25 30 35 40                                                                                 |
|                                                                                                      |
| a.  What percentage of pizzas have delivery times of between 20 and 30 minutes?                      |
|                                                                                                      |
| This is $- 1 \leq z \leq 1$. So, 68%                                                                 |
|                                                                                                      |
| b.  What percentage of pizzas have delivery times of greater than 30 minutes?                        |
|                                                                                                      |
| This is $z \geq 1$. So, 16%                                                                          |
|                                                                                                      |
| c.  In a month, Pizza House delivers 2000 pizzas. How many of these pizzas are delivered in less     |
|     than 10 minutes?                                                                                 |
|                                                                                                      |
| This is $z < - 3$. $0.15\% \times 2000 = 3$                                                          |
+------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| In a normal distribution, the mean recovery time after            |
| contracting a certain disease is 12 days with a standard          |
| deviation (SD) of 2 days.                                         |
|                                                                   |
| a.  What percentage of patients would recover within 8 to 16      |
|     days?                                                         |
|                                                                   |
| b.  What percentage of patients would recover within 16 days?     |
|                                                                   |
| c.  If 400 patients contracted the disease last year, how many    |
|     recovered within 10 days?                                     |
|                                                                   |
| 95%, 97.5%, 64                                                    |
+-------------------------------------------------------------------+

Development

1.  The lifetimes of batteries used in a toy have a mean of 12 hours and
    a standard deviation of 3 hours. The battery lifetimes are normally
    distributed.

    a.  write the corresponding mark underneath each z-score then answer
        the questions.

![](media/Random Variables 3_The Normal Distribution/media/image40.png){width="2.6442705599300087in"
height="1.3787882764654418in"}

b.  50% of the batteries have lifetimes above ...............

12 hours

c.  68% of the batteries have lifetimes between ...............and
    ...............

9 hours and 15 hours

d.  95% of the batteries have lifetimes between ...............and
    ...............

6 hours and 18 hours

e.  99.7% of the batteries have lifetimes between ...............and
    ...............

3 hours and 21 hours

2.  The blood pressure readings for seniors are normally distributed
    with a mean systolic blood pressure of 134 and a standard deviation
    of 20. Given this information it can be concluded that:

    a.  ![](media/Random Variables 3_The Normal Distribution/media/image41.png){width="2.5539490376202973in"
        height="1.3316918197725285in"}Sketch the normal curve and answer
        these questions.

    b.  68% of the seniors have blood pressures between
        ...............and ...............

114 and 154

c.  95% of the seniors have blood pressures between ...............and
    ...............

94 and 174

d.  99.7% of the seniors have blood pressures between ...............and
    ...............

74 and 194

e.  16% of the seniors have blood pressures above ...............

154

f.  2.5% of the seniors have blood pressures below ...............

94

g.  0.15% of the seniors have blood pressures below ...............

74

h.  50% of the seniors have blood pressures above ...............

134

3.  The mean length of a garden stake is 180 cm. The standard deviation
    of the lengths is 3 cm. The length of the garden stakes is normally
    distributed.\
    What percentage of the garden stakes lie between:

    a.  ![A diagram of a function AI-generated content may be
        incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.2651443569553806in"
        height="1.1811023622047243in"}177 cm and 183 cm?
        ...........................

68%

b.  174 cm and 186 cm? ...........................

95%

c.  171 cm and 189 cm? ...........................

99.7%

4.  ![A diagram of a function AI-generated content may be
    incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.2651443569553806in"
    height="1.1811023622047243in"}The weights of packets of potato chips
    are normally distributed.\
    The mean is 200 grams and the standard deviation is 8 grams.

    a.  What percentage of packets have a weight between 184 grams and
        216 grams?

95%

b.  What percentage of packets have a weight between 192 grams and 208
    grams?

68%

c.  What percentage of packets have a weight between 176 grams and 224
    grams?

99.7%

d.  What percentage of packets have a weight greater than 200 grams?

50%

5.  The distribution of heights of 19-year-old women is approximately
    normal, with a mean of 170cm and a standard deviation of 5cm.

    a.  ![A diagram of a function AI-generated content may be
        incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.2651443569553806in"
        height="1.1811023622047243in"}What percentage of these women
        have heights:

        i.  between 155 and 185cm? ..................

> 99.7%

ii. greater than 180cm? ..................

> 2.5%

iii. between 160 and 180cm? ..................

95%

b.  In a sample of 5000 of these women, how many have heights:

    i.  between 155 and 185cm? ..................

4985

ii. greater than 180cm? ..................

125

iii. between 160 and 180cm? ..................

4750

6.  A machine fi­lls packets of lollies. The mean number of lollies in
    each packet is 40 with a standard deviation of 1.5 lollies. The
    number of lollies is normally distributed. Rory claims that he
    bought a packet that had 48 lollies in it. Discuss Rory's claim.

This is a z-score of 5.33, which is extremely unlikely.

7.  Nathan sells a diet plan with a money-back guarantee if the customer
    does not lose 9 kg in the first three months. The weight loss after
    three months is normally distributed with a mean loss of 13.2 kg and
    a standard deviation of 1.4 kg.

    a.  What is the z-score corresponding to a weight loss of 9 kg?

$$- 3$$

b.  What percentage of customers will not reach the 9 kg in three
    months?

0.15% of data is below a z-score of $- 3$

c.  Nathan has sold 2000 diet plans. How many refunds are expected?

3 refunds

8.  A train is timetabled to arrive at Central station at 8:44 am each
    day of the week. After 3 months the mean arrival time was 8:44 am
    with a standard deviation of 3 minutes. The data is normally
    distributed.

    a.  What percentage of times will the train arrive between 8:38 am
        and 8:50 am?

95%

b.  What percentage of times will the train arrive between 8:35 am and
    8:47 am?

99.85%

c.  What percentage of times will the train arrive before 8:38 am?

2.5%

d.  What percentage of times will the train arrive after 8:47 am?

16%

e.  What percentage of times will the train arrive on time or earlier?

50%

f.  Sydney Trains does not classify a train as late unless it arrives 6
    minutes later than the scheduled time. What percentage of times will
    the train arrive late?

2.5%

g.  How often will this train run late, according to Sydney Trains, in
    200 days?

5 days

Mastery

9.  A normal distribution has a standard deviation of 3. If 16% of the
    scores are at least 29,\
    fi­nd the mean.

16 represents a z-score of $- 1$

So, the mean is 19

10. A normal distribution has a mean of 95. If 2.5% of the scores are
    below 73, ­\
    find the standard deviation.

73 represents a z-score of $- 2$

The difference between the mean, 95, and the score, 73, is 22

22 represents 2 standard deviations.

11 is the standard deviation.

11. A set of data is normally distributed with mean 18 and standard
    deviation 2.\
    Find the percentage of data between:

+----------------------+----------------------+----------------------+
| a.  16 and 20        | b.  14 and 22        | c.  12 and 24        |
|                      |                      |                      |
| 68%                  | 95%                  | 99.7%                |
+======================+======================+======================+
| d.  16 and 18        | e.  18 and 24        | f.  12 and 22        |
|                      |                      |                      |
| 34%                  | 49.85%               | 97.35%               |
+----------------------+----------------------+----------------------+

12. A normal distribution has mean 65 and standard deviation 4.

    a.  ![](media/Random Variables 3_The Normal Distribution/media/image42.png){width="3.2274540682414696in"
        height="1.2409722222222221in"}Sketch the graph.

    b.  Find the percentage of data between:

+---------------------+---------------------+---------------------+
| i.  57 and 73       | ii. 61 and 65       | iii. 65 and 77      |
|                     |                     |                     |
| 95%                 | 34%                 | 49.85%              |
+=====================+=====================+=====================+
| iv. 57 and 69       | v.  61 and 73       |                     |
|                     |                     |                     |
| 81.5%               | 81.5%               |                     |
+---------------------+---------------------+---------------------+

13. Fish lengths in a competition had mean 53.1 cm and standard
    deviation 8.7.

    a.  Between which lengths would fish almost certainly lie (within 3
        standard deviations)?

$\mu \pm 3\sigma = 53.1 \pm 26.1$

27 cm to 79.2 cm

b.  Find the $z$-score for each length:

+---------------+---------------+---------------+---------------+
| i.  53.1 cm   | ii. 61.8 cm   | iii. 44.4 cm  | iv. 70.5 cm   |
|               |               |               |               |
| 0             | 1             | $$- 1$$       | 2             |
+===============+===============+===============+===============+
| v.  35.7 cm   | vi. 79.2 cm   | vii. 27 cm    | viii. 65 cm   |
|               |               |               |               |
| $$- 2$$       | 3             | $$- 3$$       | 1.4           |
+---------------+---------------+---------------+---------------+

14. Overnight temperatures at Thredbo in June had mean 6.8°C and
    standard deviation 1.1.

    a.  Within what range do almost all temperatures lie (3 standard
        deviations)?

$\mu \pm 3\sigma = 6.8 \pm 3.3$

3.5°C to 10.1°C

b.  Find the $z$-score for:

+---------------+---------------+---------------+---------------+
| i.  6.8°C     | ii. 7.9°C     | iii. 9°C      | iv. 10.1°C    |
|               |               |               |               |
| 0             | 1             | 2             | 3             |
+===============+===============+===============+===============+
| v.  5.7°C     | vi. 4.6°C     | vii. 3.5°C    | viii. 6°C     |
|               |               |               |               |
| $$- 1$$       | $$- 2$$       | $$- 3$$       | $$- 0.7$$     |
+---------------+---------------+---------------+---------------+

15. A normally distributed data set has mean 16 and standard deviation
    1.9.

    a.  Find the scores between which:

+----------------------------------+---------------------+---------------------+
| i.  95% of data lies             | ii. 68% of data     | iii. 99.7% of data  |
|                                  |     lies            |      lies           |
| $$\mu \pm 2\sigma = 16 \pm 3.8$$ |                     |                     |
|                                  | $\mu \pm \sigma$    | $$\mu \pm 3\sigma$$ |
| 12.2 to 19.8                     |                     |                     |
|                                  | 14.1 to 17.9        | 10.3 to 21.7        |
+==================================+=====================+=====================+

a.  Calculate the $z$-score of:

    i.  20

    ii. 13.5

$$\mathbf{i}\ z = \frac{20 - 16}{1.9} \approx 2.1$$

$$\mathbf{ii}\ z = \frac{13.5 - 16}{1.9} \approx - 1.3$$

b.  Find the raw score with $z$-score:

    i.  $- 3$

    ii. $1.1$

**i** $x = 16 + ( - 3)(1.9) = 10.3$

**ii** $x = 16 + 1.1(1.9) = 18.09$

16. Apple diameters are normally distributed with mean 7.5 cm and
    standard deviation 0.3 cm. Only apples within 2 standard deviations
    are allowed.

    a.  What percentage of apples are allowed?

95%

b.  What is the largest diameter allowed?

$\mu + 2\sigma = 8.1$ cm

c.  What is the smallest diameter allowed?

$\mu - 2\sigma = 6.9$ cm

17. Bread mix bags have mean weight 4.95 kg and standard deviation 0.15
    kg.\
    Bags are rejected if under 4.65 kg or over 5.25 kg.

    a.  What percentage are rejected?

$$z(4.65) = \frac{4.65 - 4.95}{0.15} = - 2;\ \ z(5.25) = \frac{5.25 - 4.95}{0.15} = 2$$

95% accepted, so 5% rejected

b.  What percentage are rejected for being too light?

$$P(X < 4.65) = P(Z < - 2) = 2.5\%$$

c.  The manager changes the rule: only bags outside 3 standard
    deviations are rejected.

    i.  What percentage will be rejected?

0.3%

ii. What weights will be rejected?

$x < \mu - 3\sigma = 4.5$ kg

or $x > \mu + 3\sigma = 5.4$ kg

18. Steel rods have mean diameter 10.6 cm and standard deviation 0.5 cm.

    a.  If 0.3% of rods are rejected, find:

        i.  the percentage accepted

99.7% accepted

ii. the largest diameter accepted

$\mu + 3\sigma = 12.1$ cm

iii. the smallest diameter accepted

$\mu - 3\sigma = 9.1$ cm

b.  In one batch, diameters are 10.9 cm, 9.6 cm, 8.3 cm, 11.4 cm, 12.6
    cm.\
    Which are rejected?

Acceptable range: 9.1 to 12.1 cm. Rejected: 8.3 cm and 12.6 cm.

19. A canned fruit manufacturer guarantees minimum weight 250 g.\
    The cans have mean 252.5 g and standard deviation 0.4 g. Is the
    guarantee realistic? Why?

Minimum expected weight at when $z = - 3$:

$\mu - 3\sigma = 252.5 - 1.2 = 251.3$ g $> 250$ g. The guarantee is
realistic.

20. The width of a door type almost certainly lies in the range 814 mm
    to 826 mm (3 standard deviations from the mean).

    a.  Find the standard deviation.

Range 814 to 826 spans $2 \times 3\sigma$.

$$6\sigma = 826 - 814 = 12$$

$\sigma = 2$ mm

b.  Find the mean width.

$\mu = \frac{814 + 826}{2} = 820$ mm

c.  Within what widths do 95% of doors lie?

$$\mu \pm 2\sigma = 820 \pm 4$$

816 mm to 824 mm

21. A ferry's mean travel time is 3.1 hours. About 47.5% of the time the
    ferry takes between 3.1 and 3.5 hours.

    a.  Find the standard deviation.

47.5% from $\mu$ to 3.5 h means $\mu + 2\sigma = 3.5$, so
$2\sigma = 0.4$.

$$\sigma = 0.2$$

b.  Find the minimum expected travel time (3 $\sigma$ below the mean).

$\mu - 3\sigma = 3.1 - 0.6 = 2.5$ h

22. Apple diameters are normally distributed with mean 68 mm and
    standard deviation 2 mm. Apples are discarded if diameter is more
    than 72 mm or less than 64 mm.\
    What percentage are discarded?

$\mu = 68$, $\sigma = 2$. $z(64) = - 2$, $z(72) = 2$.

Within $\mu \pm 2\sigma$: 95% accepted.

Discarded: 5%.

# Probabilities using z-scores

+---------------------------------------------------------------------------------+
| - **Review**                                                                    |
+=================================================================================+
| - Recall the empirical rule                                                     |
|                                                                                 |
| 1.  What percentage of a normal distribution lies between:                      |
|                                                                                 |
| +-------------------------+-------------------------+-------------------------+ |
| | a.  $- 1 \leq z \leq 1$ | b.  $- 2 \leq z \leq 2$ | c.  $- 3 \leq z \leq 3$ | |
| +=========================+=========================+=========================+ |
|                                                                                 |
| 2.  A normal distribution has 95% of values between $- 2 \leq z \leq 2$.\       |
|     What percentage lies outside this interval?                                 |
|                                                                                 |
| 3.  A normal distribution has 84% of values $z \leq 1$\                         |
|     What percentage is $z \geq 1$?                                              |
+---------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Probability and the Normal Distribution**                                                                                                                                                                                                     |
+====================================================================================================================================+==============================================================================================================+
| **Probability** is the **area under a normal distribution graph.**                                                                                                                                                                                |
|                                                                                                                                                                                                                                                   |
| The total area under the graph is 1 as it represents the probability of all outcomes.                                                                                                                                                             |
|                                                                                                                                                                                                                                                   |
| We can use the empirical rule to find the probability that a randomly chosen score will lie within one, two or three standard deviations of the mean.                                                                                             |
+------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| $$P( - 1 \leq z \leq 1) = 0.68$$                                                                                                   | $$P( - 2 \leq z \leq 2) = 0.95$$                                                                             |
|                                                                                                                                    |                                                                                                              |
| ![](media/Random Variables 3_The Normal Distribution/media/image27.png){width="2.4618055555555554in"                               |                                                                                                              |
| height="0.9909722222222223in"}![](media/Random Variables 3_The Normal Distribution/media/image28.png){width="2.4541666666666666in" |                                                                                                              |
| height="0.9770833333333333in"}                                                                                                     |                                                                                                              |
+------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| $$P( - 3 \leq z \leq 3) = 0.997$$                                                                                                  | $P(z \leq 0) = 0.5\$and $P(z \geq 0) = 0.5$                                                                  |
|                                                                                                                                    |                                                                                                              |
|                                                                                                                                    | ![](media/Random Variables 3_The Normal Distribution/media/image26.png){width="2.4618055555555554in"         |
|                                                                                                                                    | height="0.9in"}![A diagram of a normal distribution AI-generated content may be                              |
|                                                                                                                                    | incorrect.](media/Random Variables 3_The Normal Distribution/media/image25.png){width="2.4618055555555554in" |
|                                                                                                                                    | height="0.9625in"}                                                                                           |
+------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------+
| - **Empirical Rule**                                                                                |
+=====================================================================================================+
| ![](media/Random Variables 3_The Normal Distribution/media/image29.png){width="5.159090113735783in" |
| height="3.738471128608924in"}                                                                       |
+-----------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** Probability notation                                                                                                                                                                                                                                                                                                    |
+=============================================================================================================+=============================================================================================================+=============================================================================================================+
| Indicate these areas on the normal distribution and state the answer.                                                                                                                                                                                                                                                                   |
+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| a.  $P(z < 3)$                                                                                              | b.  $P(z < - 1)$                                                                                            | c.  $P(z > - 1)$                                                                                            |
|                                                                                                             |                                                                                                             |                                                                                                             |
| ![A diagram of a function AI-generated content may be                                                       | ![A diagram of a function AI-generated content may be                                                       | ![A diagram of a function AI-generated content may be                                                       |
| incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in" | incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in" | incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in" |
| height="1.457638888888889in"}                                                                               | height="1.457638888888889in"}                                                                               | height="1.457638888888889in"}                                                                               |
+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| d.  $P( - 2 < z < 1)$                                                                                       | e.  $P(z < 2)$                                                                                              | f.  $P(z > 2)$                                                                                              |
|                                                                                                             |                                                                                                             |                                                                                                             |
|                                                                                                             |                                                                                                             | ![A diagram of a function AI-generated content may be                                                       |
|                                                                                                             |                                                                                                             | incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in" |
|                                                                                                             |                                                                                                             | height="1.457638888888889in"}![A diagram of a function AI-generated content may be                          |
|                                                                                                             |                                                                                                             | incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in" |
|                                                                                                             |                                                                                                             | height="1.457638888888889in"}![A diagram of a function AI-generated content may be                          |
|                                                                                                             |                                                                                                             | incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.165277777777778in" |
|                                                                                                             |                                                                                                             | height="1.457638888888889in"}                                                                               |
+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+

Foundation

1.  Find these probabilities for a standard normal distribution curve.\
    Answer as a decimal.

+-----------------------+----------------------+-----------------------+
| a.  $P(z\  > \ 1)$    | b.  $P(z\  > \ 2)$   | c.  $P(z\  < \  - 3)$ |
|                       |                      |                       |
| 0.16                  | 0.025                | 0.0015                |
+=======================+======================+=======================+
| d.  $P(z\  < \  - 1)$ | e.  $P(z < 3)$       | f.  $P(z < - 2)$      |
|                       |                      |                       |
| 0.16                  | 0.9985               | 0.025                 |
+-----------------------+----------------------+-----------------------+
| g.  $P(z > \  - 1)$   | h.  $P(z > 3)$       | i.  $P(z > - 2)$      |
|                       |                      |                       |
| 0.84                  | 0.0015               | 0.975                 |
+-----------------------+----------------------+-----------------------+

2.  What do you notice about $P(z < - 1)$ and $P(z > - 1)$?

They add to 1

3.  What do you notice about $P(z < 3)$ and $P(z > 3)$?

They add to 1

4.  What do you notice about $P(z < - 2)$ and $P(z > - 2)$?

They add to 1

5.  For a dataset that is normally distributed with a mean of 50 and a
    standard deviation of 6, ­

![A diagram of a function AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image30.png){width="2.6125in"
height="1.3611111111111112in"}

Find the probability, as a percentage, that a randomly chosen score is:

+----------------------+----------------------+----------------------+
| a.  between 44 and   | b.  between 50 and   | c.  less than 56     |
|     56               |     62               |                      |
|                      |                      | 84%                  |
| 68%                  | 47.5%                |                      |
+======================+======================+======================+
| d.  between 38 and   | e.  less than 38     | f.  more than 44     |
|     56               |                      |                      |
|                      | 2.5%                 | 84%                  |
| 81.5%                |                      |                      |
+----------------------+----------------------+----------------------+
| g.  between 56 and   | h.  between 32 and   | i.  more than 68     |
|     62               |     44               |                      |
|                      |                      | 0.15%                |
| 13.5%                | 13.5%                |                      |
+----------------------+----------------------+----------------------+

6.  Given the mean and SD, find the probability.

    a.  Mean 172, SD 8. Find $P(X\  > \ 188)$

0.025

b.  Mean 172, SD 8. Find $P(X\  < \ 156)$

0.025

c.  Mean 172, SD 8. Find $P(X\  > \ 164)$

0.84

d.  Mean 50, SD 5. Find $P(X\  > \ 60)$

0.025

e.  Mean 50, SD 5. Find $P(X\  < \ 35)$

0.0015

f.  Mean 50, SD 5. Find $P(X\  > \ 45)$

0.84

7.  The heights of adults in a population are normally distributed with
    mean 172 cm and SD 8 cm.

    a.  Find the probability that a randomly selected adult has height
        greater than 188 cm.

    b.  Find the probability that a randomly selected adult has height
        less than 156 cm.

    c.  Find the probability that a randomly selected adult has height
        greater than 196 cm.

    d.  Find $P(164\  < \ X\  < \ 188).$

a\) 0.025

b\) 0.025

c\) 0.0015

d\) 0.815

8.  The lifetimes of a brand of light bulb are normally distributed with
    mean 1200 hours and SD 80 hours. Find P($X\  <$ 960 hours).

0.0015

9.  A butcher gives a free leg of lamb to any customer who can prove a 1
    kg mince packet weighs under 980 g. Mean weight is 1 kg, standard
    deviation 10 g. What percentage of customers should expect a free
    leg?

$$z = \frac{980 - 1000}{10} = - 2$$

$$P(X < 980) = P(Z < - 2) = 2.5\%$$

10. English exam results are normally distributed with mean 70 and
    standard deviation 10.

    a.  What percentage of pupils score over 50?

$$z = \frac{50 - 70}{10} = - 2$$

$P(X > 50) = P(Z > - 2) = P(Z \leq 2) = 97.5\%$

b.  What percentage score under 80?

$$z = \frac{80 - 70}{10} = 1$$

$$P(X < 80) = P(Z < 1) = 84\%$$

11. Exam results are normally distributed with mean 68 and standard
    deviation 9.\
    In a cohort of 2000, how many students will score:

    a.  more than 95

$$z = \frac{95 - 68}{9} = 3$$

$$P(Z > 3) = 0.15\%$$

$0.0015 \times 2000 = 3$ students

b.  less than 50

$$z = \frac{50 - 68}{9} = - 2$$

$P(Z < - 2) = 2.5\%$

$0.025 \times 2000 = 50$ students

c.  between 59 and 86?

$z(59) = - 1$, $z(86) = 2$.

$P( - 1 < Z < 2) = 34\% + 47.5\% = 81.5\%$.

$0.815 \times 2000 = 1630$ students

12. Screw lengths are normally distributed with mean 2 cm and standard
    deviation 0.1 cm.

    a.  What is the probability a screw is undersized\
        (more than 2 standard deviations below the mean)?

$$P(Z < - 2) = 2.5\%$$

b.  In a batch of 2400, use $z$-scores to find how many screws are
    longer than 2.3 cm.

$$z = \frac{2.3 - 2}{0.1} = 3$$

$P(Z > 3) = 0.15\%$

$0.0015 \times 2400 = 3.6 \approx 4$ screws

# The z-score Table

The table represents the area under a normal curve to the **left** of a
given z-score.

**Table of values** $\mathbf{P}\left( \mathbf{Z \leq z} \right)$ **for
the normal distribution**

![](media/Random Variables 3_The Normal Distribution/media/image43.png){width="2.7693350831146106in"
height="1.2152777777777777in"}

  ---------------------------------------------------------------------------------------------------
             *0.00*   *0.01*   *0.02*   *0.03*   *0.04*   *0.05*   *0.06*   *0.07*   *0.08*   *0.09*
  --------- -------- -------- -------- -------- -------- -------- -------- -------- -------- --------
  **0.0**    0.5000   0.5040   0.5080   0.5120   0.5160   0.5199   0.5239   0.5279   0.5319   0.5359

  **0.1**    0.5398   0.5438   0.5478   0.5517   0.5557   0.5596   0.5636   0.5675   0.5714   0.5753

  **0.2**    0.5793   0.5832   0.5871   0.5910   0.5948   0.5987   0.6026   0.6064   0.6103   0.6141

  **0.3**    0.6179   0.6217   0.6255   0.6293   0.6331   0.6368   0.6406   0.6443   0.6480   0.6517

  **0.4**    0.6554   0.6591   0.6628   0.6664   0.6700   0.6736   0.6772   0.6808   0.6844   0.6879

  **0.5**    0.6915   0.6950   0.6985   0.7019   0.7054   0.7088   0.7123   0.7157   0.7190   0.7224

  **0.6**    0.7257   0.7291   0.7324   0.7357   0.7389   0.7422   0.7454   0.7486   0.7517   0.7549

  **0.7**    0.7580   0.7611   0.7642   0.7673   0.7704   0.7734   0.7764   0.7794   0.7823   0.7852

  **0.8**    0.7881   0.7910   0.7939   0.7967   0.7995   0.8023   0.8051   0.8078   0.8106   0.8133

  **0.9**    0.8159   0.8186   0.8212   0.8238   0.8264   0.8289   0.8315   0.8340   0.8365   0.8389

  **1.0**    0.8413   0.8438   0.8461   0.8485   0.8508   0.8531   0.8554   0.8577   0.8599   0.8621

  **1.1**    0.8643   0.8665   0.8686   0.8708   0.8729   0.8749   0.8770   0.8790   0.8810   0.8830

  **1.2**    0.8849   0.8869   0.8888   0.8907   0.8925   0.8944   0.8962   0.8980   0.8997   0.9015

  **1.3**    0.9032   0.9049   0.9066   0.9082   0.9099   0.9115   0.9131   0.9147   0.9162   0.9177

  **1.4**    0.9192   0.9207   0.9222   0.9236   0.9251   0.9265   0.9279   0.9292   0.9306   0.9319

  **1.5**    0.9332   0.9345   0.9357   0.9370   0.9382   0.9394   0.9406   0.9418   0.9429   0.9441

  **1.6**    0.9452   0.9463   0.9474   0.9484   0.9495   0.9505   0.9515   0.9525   0.9535   0.9545

  **1.7**    0.9554   0.9564   0.9573   0.9582   0.9591   0.9599   0.9608   0.9616   0.9625   0.9633

  **1.8**    0.9641   0.9649   0.9656   0.9664   0.9671   0.9678   0.9686   0.9693   0.9699   0.9706

  **1.9**    0.9713   0.9719   0.9726   0.9732   0.9738   0.9744   0.9750   0.9756   0.9761   0.9767

  **2.0**    0.9772   0.9778   0.9783   0.9788   0.9793   0.9798   0.9803   0.9808   0.9812   0.9817

  **2.1**    0.9821   0.9826   0.9830   0.9834   0.9838   0.9842   0.9846   0.9850   0.9854   0.9857

  **2.2**    0.9861   0.9864   0.9868   0.9871   0.9875   0.9878   0.9881   0.9884   0.9887   0.9890

  **2.3**    0.9893   0.9896   0.9898   0.9901   0.9904   0.9906   0.9909   0.9911   0.9913   0.9916

  **2.4**    0.9918   0.9920   0.9922   0.9925   0.9927   0.9929   0.9931   0.9932   0.9934   0.9936

  **2.5**    0.9938   0.9940   0.9941   0.9943   0.9945   0.9946   0.9948   0.9949   0.9951   0.9952

  **2.6**    0.9953   0.9955   0.9956   0.9957   0.9959   0.9960   0.9961   0.9962   0.9963   0.9964

  **2.7**    0.9965   0.9966   0.9967   0.9968   0.9969   0.9970   0.9971   0.9972   0.9973   0.9974

  **2.8**    0.9974   0.9975   0.9976   0.9977   0.9977   0.9978   0.9979   0.9979   0.9980   0.9981

  **2.9**    0.9981   0.9982   0.9982   0.9983   0.9984   0.9984   0.9985   0.9985   0.9986   0.9986

  **3.0**    0.9987   0.9987   0.9987   0.9988   0.9988   0.9989   0.9989   0.9989   0.9990   0.9990

  **3.1**    0.9990   0.9991   0.9991   0.9991   0.9992   0.9992   0.9992   0.9992   0.9993   0.9993

  **3.2**    0.9993   0.9993   0.9994   0.9994   0.9994   0.9994   0.9994   0.9995   0.9995   0.9995
  ---------------------------------------------------------------------------------------------------

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** probability less than or greater than positive z-score from a table                                                                                                                                                                |
+=========================================================================================================================+=========================================================================================================================+
| For $P(z \leq c)$, read the value off the table.                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                   |
| Since $P(z \leq c) + P(z \geq c) = 1$                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                   |
| $P(z \geq c) = 1 - P(z \leq c)$                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                   |
| ![](media/Random Variables 3_The Normal Distribution/media/image44.png){width="1.9680555555555554in" height="1.0145833333333334in"}![](media/Random Variables 3_The Normal Distribution/media/image45.png){width="1.9680555555555554in"           |
| height="1.0145833333333334in"}![](media/Random Variables 3_The Normal Distribution/media/image46.png){width="1.968503937007874in" height="1.014818460192476in"}                                                                                   |
|                                                                                                                                                                                                                                                   |
| $=$ $-$                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                   |
| $P(z \geq c)\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ 1\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  - \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ P(z \leq c)$.    |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| a.  Find $P(z \leq 1.2)$                                                                                                | b.  Find $P(z \leq 0.67)$                                                                                               |
|                                                                                                                         |                                                                                                                         |
| ![A diagram of a normal distribution AI-generated content may be                                                        | ![](media/Random Variables 3_The Normal Distribution/media/image48.png){width="1.9680555555555554in"                    |
| incorrect.](media/Random Variables 3_The Normal Distribution/media/image47.png){width="1.968503937007874in"             | height="1.1423611111111112in"}                                                                                          |
| height="1.3289610673665793in"}                                                                                          |                                                                                                                         |
|                                                                                                                         |                                                                                                                         |
| Reading off the table, $P(z \leq 1.2) = 0.8849$                                                                         |                                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| c.  Find $P(z \leq 1.83)$                                                                                               | d.  Find $P(z \leq 2.34)$                                                                                               |
|                                                                                                                         |                                                                                                                         |
| ![](media/Random Variables 3_The Normal Distribution/media/image48.png){width="1.9680555555555554in"                    | ![](media/Random Variables 3_The Normal Distribution/media/image48.png){width="1.9680555555555554in"                    |
| height="1.1423611111111112in"}                                                                                          | height="1.1423611111111112in"}                                                                                          |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| e.  Find $P(z \geq 2.34)$                                                                                               | f.  Find $P(z \geq 1.23)$                                                                                               |
|                                                                                                                         |                                                                                                                         |
| ![](media/Random Variables 3_The Normal Distribution/media/image48.png){width="1.9680555555555554in"                    | ![](media/Random Variables 3_The Normal Distribution/media/image48.png){width="1.9680555555555554in"                    |
| height="1.1423611111111112in"}                                                                                          | height="1.1423611111111112in"}                                                                                          |
|                                                                                                                         |                                                                                                                         |
| $${P(z > 2.34) = 1 - P(z < 2.34)                                                                                        |                                                                                                                         |
| }{= 1 - 0.9904                                                                                                          |                                                                                                                         |
| }{= 0.0096}$$                                                                                                           |                                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** probability between positive z-scores from a table                                                                                                                                                           |
+==============================================================================================================+==============================================================================================================+
| $$P(a \leq z \leq b) = P(z \leq b) - P(z \leq a)$$                                                                                                                                                                          |
|                                                                                                                                                                                                                             |
| ![](media/Random Variables 3_The Normal Distribution/media/image49.png){width="1.9685028433945757in"                                                                                                                        |
| height="1.0148173665791775in"}![](media/Random Variables 3_The Normal Distribution/media/image50.png){width="1.9685028433945757in"                                                                                          |
| height="1.014818460192476in"}![](media/Random Variables 3_The Normal Distribution/media/image51.png){width="1.968503937007874in" height="1.014818460192476in"}                                                              |
|                                                                                                                                                                                                                             |
| $=$ $-$                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                             |
| $P(a \leq z \leq b)\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ P(z \leq b)\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  - \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ P(z \leq a)$    |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| a.  Find $P(1.2 \leq z \leq 2.34)$                                                                           | b.  Find $P(0.67 \leq z \leq 1.83)$                                                                          |
|                                                                                                              |                                                                                                              |
| ![A diagram of a normal distribution AI-generated content may be                                             | ![](media/Random Variables 3_The Normal Distribution/media/image48.png){width="1.9680555555555554in"         |
| incorrect.](media/Random Variables 3_The Normal Distribution/media/image52.png){width="1.9861111111111112in" | height="1.1423611111111112in"}                                                                               |
| height="1.3160061242344707in"}                                                                               |                                                                                                              |
|                                                                                                              |                                                                                                              |
| $${P(1.2 < z < 2.34) = P(z < 2.34) - P(z < 1.2)                                                              |                                                                                                              |
| }{= 0.9904 - 0.8849                                                                                          |                                                                                                              |
| }{= 0.1055}$$                                                                                                |                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| c.  Find $P(0.86 \leq z \leq 1.77)$                                                                          | d.  Find $P(1.05 \leq z \leq 1.92)$                                                                          |
|                                                                                                              |                                                                                                              |
| ![](media/Random Variables 3_The Normal Distribution/media/image48.png){width="1.9680555555555554in"         | ![](media/Random Variables 3_The Normal Distribution/media/image48.png){width="1.9680555555555554in"         |
| height="1.1423611111111112in"}                                                                               | height="1.1423611111111112in"}                                                                               |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Z-score Identities (positive z-scores)**                      |
+===================================================================+
| $P(z \leq c):$ read off table                                     |
|                                                                   |
| $$P(z \geq c) = 1 - P(z \leq c)$$                                 |
|                                                                   |
| $$P(a \leq z \leq b) = P(z \leq b) - P(z \leq a)$$                |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Finding Probabilities using a Calculator**                                                                                                                                                                                                                                                                         |
+========================================================================================================================================================================================================================================================================================================================+
| ![](media/Random Variables 3_The Normal Distribution/media/image53.png){width="0.30219706911636046in" height="0.2772222222222222in"}**Casio FX 8200AU:**                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                                        |
| 1\. Press HOME                                                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                        |
| ![](media/Random Variables 3_The Normal Distribution/media/image54.png){width="0.7368055555555556in" height="0.37859580052493436in"}                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                        |
| 2\. Select                                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                        |
| ![](media/Random Variables 3_The Normal Distribution/media/image55.png){width="0.29097222222222224in" height="0.29375in"}3. Select \[Normal CD\] (normal cumulative density; this finds $P(X \leq c)$)                                                                                                                 |
|                                                                                                                                                                                                                                                                                                                        |
| 4\. Enter data using the arrow keys and                                                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                        |
| ![](media/Random Variables 3_The Normal Distribution/media/image56.png){width="0.9513112423447069in" height="0.1800349956255468in"}5. After entering your data, press                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                        |
| **Examples:**                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                        |
| +------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------+ |
| | Mean: 100, SD: 10                                                                                    | Mean: 168, SD: 9                                                                                     | When working with z-scores                                                                           | |
| |                                                                                                      |                                                                                                      |                                                                                                      | |
| | Find $P(X \leq 110)$                                                                                 | **Find** $\mathbf{P(X \geq 175}$**)**                                                                | **Find** $\mathbf{P}\left( \mathbf{- 1 \leq z \leq 1} \right)$                                       | |
| |                                                                                                      |                                                                                                      |                                                                                                      | |
| | Lower: $- \infty$ (put -10000)                                                                       | Lower: 175                                                                                           | Lower: $- 1$                                                                                         | |
| |                                                                                                      |                                                                                                      |                                                                                                      | |
| | Upper: 110                                                                                           | Upper: $\infty$ (put 10000)                                                                          | Upper: 1                                                                                             | |
| |                                                                                                      |                                                                                                      |                                                                                                      | |
| | $\mu:$ 100                                                                                           | $\mu:$ 168                                                                                           | $\mu$: 0                                                                                             | |
| |                                                                                                      |                                                                                                      |                                                                                                      | |
| | $\sigma:$ 10                                                                                         | $\sigma:$ 9                                                                                          | $\sigma:$ 1                                                                                          | |
| |                                                                                                      |                                                                                                      |                                                                                                      | |
| | ![](media/Random Variables 3_The Normal Distribution/media/image57.png){width="2.0208333333333335in" | ![](media/Random Variables 3_The Normal Distribution/media/image58.png){width="2.0208333333333335in" | ![](media/Random Variables 3_The Normal Distribution/media/image59.png){width="2.0208333333333335in" | |
| | height="0.7604166666666666in"}                                                                       | height="0.7604166666666666in"}                                                                       | height="0.7604166666666666in"}                                                                       | |
| +======================================================================================================+======================================================================================================+======================================================================================================+ |
|                                                                                                                                                                                                                                                                                                                        |
| - If a table is given in an exam, use the provided table.                                                                                                                                                                                                                                                              |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Foundation

The following table gives $P(Z \leq z)$ for the standard normal
distribution to 1 d.p.

  ----------------------------------------------------------------------------------------------------------
   $$\mathbf{z}$$   **.0**   **.1**   **.2**   **.3**   **.4**   **.5**   **.6**   **.7**   **.8**   **.9**
  ---------------- -------- -------- -------- -------- -------- -------- -------- -------- -------- --------
       **0.**       0.5000   0.5398   0.5793   0.6179   0.6554   0.6915   0.7257   0.7580   0.7881   0.8159

       **1.**       0.8413   0.8643   0.8849   0.9032   0.9192   0.9332   0.9452   0.9554   0.9641   0.9713

       **2.**       0.9772   0.9821   0.9861   0.9893   0.9918   0.9938   0.9953   0.9965   0.9974   0.9981

       **3.**       0.9987   0.9990   0.9993   0.9995   0.9997   0.9998   0.9998   0.9999   0.9999   1.0000
  ----------------------------------------------------------------------------------------------------------

1.  Use the table to find (correct to 4 d.p.):

+-------------------+---------------------+-------------------+---------------------+
| a.  $P(Z \leq 0)$ | b.  $P(Z \leq 1)$   | c.  $P(Z \leq 2)$ | d.  $P(Z \leq 1.5)$ |
|                   |                     |                   |                     |
| 0.5000            | 0.8413              | 0.9772            | 0.9332              |
+===================+=====================+===================+=====================+
| e.  $P(Z < 0.4)$  | f.  $P(Z \leq 2.3)$ | g.  $P(Z < 1.2)$  | h.  $P(Z \leq 5)$   |
|                   |                     |                   |                     |
| 0.6554            | 0.9893              | 0.8849            | 1.0000              |
+-------------------+---------------------+-------------------+---------------------+

2.  Explain why $P(Z > a) = 1 - P(Z \leq a)$. Hence find:

+------------------+------------------+---------------------+---------------------+
| a.  $P(Z > 0)$   | b.  $P(Z > 1)$   | c.  $P(Z > 2)$      | d.  $P(Z \geq 2.4)$ |
|                  |                  |                     |                     |
| 0.5              | 0.1587           | 0.0228              | 0.0082              |
+==================+==================+=====================+=====================+
| e.  $P(Z > 1.3)$ | f.  $P(Z > 0.7)$ | g.  $P(Z \geq 1.6)$ | h.  $P(Z > 8)$      |
|                  |                  |                     |                     |
| 0.0968           | 0.2420           | 0.0548              | 0.0000              |
+------------------+------------------+---------------------+---------------------+

3.  Use the standard normal distribution table to find the probability
    of finding a value with z-score:

+----------------------+----------------------+----------------------+
| a.  Less than 1      | b.  Less than 1.4    | c.  More than 1.8    |
|                      |                      |                      |
| $P(z < 1) =$         | 0.9192               | 0.0359               |
| ...............      |                      |                      |
|                      |                      |                      |
| 0.8413               |                      |                      |
+======================+======================+======================+
| d.  More than 2.25   | e.  Between 0.4 and  | f.  Between 1.32 and |
|                      |     1.78             |     1.78             |
| 0.0122               |                      |                      |
|                      | 0.3071               | 0.0559               |
+----------------------+----------------------+----------------------+

4.  A dataset is normally distributed with a mean of 75 and a standard
    deviation of 12. By first calculating the standardised score and
    using the standard normal distribution table, ­find the probability
    that a randomly chosen score is:

+----------------------+----------------------+----------------------+
| a.  less than 84     | b.  less than 79     | c.  less than 100    |
|                      |                      |                      |
| > z-score:           | 0.6293               | 0.9812               |
| > .................. |                      |                      |
| >                    |                      |                      |
| > $P(z <$            |                      |                      |
| > ......$) =$        |                      |                      |
| > ............       |                      |                      |
|                      |                      |                      |
| 0.7734               |                      |                      |
+======================+======================+======================+
| d.  more than 76     | e.  more than 90     | f.  more than 87     |
|                      |                      |                      |
| 0.4681               | 0.1057               | 0.1587               |
+----------------------+----------------------+----------------------+
| g.  between 79 and   | h.  between 80 and   | i.  between 87 and   |
|     84               |     100              |     106              |
|                      |                      |                      |
| 0.1441               | 0.3185               | 0.1538               |
+----------------------+----------------------+----------------------+

5.  Adriana scored 70 in a test for which the marks were normally
    distributed with a mean of 64 and a standard deviation of 12. What
    is the probability that a randomly chosen student scored a lower
    mark than Adriana?

0.6915

6.  IQ is approximately normally distributed in Australia with mean 98
    and standard deviation 15.

    a.  A genius is defined as IQ over 140. What percentage of the
        population is this?

$$z = \frac{140 - 98}{15} = 2.8$$

$P(Z > 2.8) = 1 - 0.9974 = 0.0026 = 0.26\%$

b.  In 25 million people, how many geniuses would you expect?

$0.0026 \times 25\, 000\, 000 = 65\, 000$ geniuses

7.  A study found mean cholesterol level 219 mg/mL with standard
    deviation 41 mg/mL for adult males without heart disease.\
    Doctors classify a reading above 240 mg/mL as high.\
    What percentage of this population has high cholesterol?

$$z = \frac{240 - 219}{41} \approx 0.51$$

$$P(Z > 0.51) = 1 - 0.6950 \approx 31\%$$

8.  The weights of 10 000 newborn babies in NSW are normally
    distributed. These weights have a mean of 3.1 kg and a standard
    deviation of 0.35 kg.

    a.  What is the probability that a randomly chosen baby has a weight
        between 3.24 kg and 3.66 kg?

0.2898

b.  How many of the 10 000 newborn babies would have a weight between
    3.24 kg and 3.66 kg?

2898

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Z-score Identities (negative z-scores)**                                                                                                                                      |
+===================================================================================================================================================================================+
| The z-score table only gives positive values; for negative values we need to use symmetry.                                                                                        |
|                                                                                                                                                                                   |
| $$P(z \leq - c) = P(z \geq c)$$                                                                                                                                                   |
|                                                                                                                                                                                   |
| $= 1 - P(z \leq c)$                                                                                                                                                               |
|                                                                                                                                                                                   |
| ![](media/Random Variables 3_The Normal Distribution/media/image60.png){width="1.9680555555555554in"                                                                              |
| height="1.0145833333333334in"}![](media/Random Variables 3_The Normal Distribution/media/image61.png){width="1.968503937007874in" height="1.014818460192476in"}                   |
|                                                                                                                                                                                   |
| $P(z \leq - c)\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ P(z \geq c)$                                                     |
|                                                                                                                                                                                   |
| ![](media/Random Variables 3_The Normal Distribution/media/image46.png){width="1.9680555555555554in"                                                                              |
| height="1.0145833333333334in"}![](media/Random Variables 3_The Normal Distribution/media/image45.png){width="1.9680555555555554in" height="1.0145833333333334in"}                 |
|                                                                                                                                                                                   |
| $= \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ 1\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  - \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ P(z \leq c)$ |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** probability using negative z-scores from a table                                                                                                                                             |
+======================================================================================================+======================================================================================================+
| a.  Find $P(z \leq - 0.86)$                                                                          | b.  Find $P(z \geq - 1.35)$                                                                          |
|                                                                                                      |                                                                                                      |
| ![](media/Random Variables 3_The Normal Distribution/media/image62.png){width="1.920110454943132in"  | ![](media/Random Variables 3_The Normal Distribution/media/image63.png){width="1.9680555555555554in" |
| height="1.3041666666666667in"}                                                                       | height="1.3138888888888889in"}                                                                       |
|                                                                                                      |                                                                                                      |
| $${P(z \leq - 0.86) = P(z \geq 0.86)                                                                 | $\ \ \ \ \ P(z \geq \  - 1.35)$                                                                      |
| }{= 1 - P(z \leq 0.86)                                                                               |                                                                                                      |
| }{= 1 - 0.8051                                                                                       | $= P(z \leq 1.35)$                                                                                   |
| }{\approx 0.1949}$$                                                                                  |                                                                                                      |
|                                                                                                      | $= 0.9115$                                                                                           |
+------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------+
| c.  Find $P(z \leq - 0.78)$                                                                          | d.  Find $P(z \geq - 0.33)$                                                                          |
|                                                                                                      |                                                                                                      |
| ![](media/Random Variables 3_The Normal Distribution/media/image48.png){width="1.9680555555555554in" | ![](media/Random Variables 3_The Normal Distribution/media/image48.png){width="1.9680555555555554in" |
| height="1.1423611111111112in"}                                                                       | height="1.1423611111111112in"}                                                                       |
|                                                                                                      |                                                                                                      |
| 0.2177                                                                                               | 0.6293                                                                                               |
+------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------+

Development

9.  a.  Use symmetry of the normal distribution to explain why, for
        $a > 0$,\
        $P(Z < - a) = 1 - P(Z \leq a)$.

By the line symmetry of the bell curve about $z = 0$, the area to the
left of $- a$ equals the area to the right of $a$:

$P(Z < - a) = P(Z > a) = 1 - P(Z \leq a)$.

b.  Use this to find:

+-------------------------+-------------------------+-------------------------+-------------------------+
| i.  $P(Z < - 1.2)$      | ii. $P(Z \leq - 2.3)$   | iii. $P(Z < - 0.2)$     | iv. $P(Z < - 3.2)$      |
|                         |                         |                         |                         |
| $$1 - 0.8849 = 0.1151$$ | $$1 - 0.9893 = 0.0107$$ | $$1 - 0.5793 = 0.4207$$ | $$1 - 0.9993 = 0.0007$$ |
+=========================+=========================+=========================+=========================+
| v.  $P(Z < - 5)$        | vi. $P(Z \leq - 0.7)$   | vii. $P(Z < - 1.6)$     | viii. $P(Z \leq - 1.4)$ |
|                         |                         |                         |                         |
| 0.0000                  | $$1 - 0.7580 = 0.2420$$ | $$1 - 0.9452 = 0.0548$$ | $$1 - 0.9192 = 0.0808$$ |
+-------------------------+-------------------------+-------------------------+-------------------------+

10. Match these eight probabilities into four pairs with equal values:

> **a** $P(Z \leq 2)$ **b** $P(Z \leq - 1)$ **c** $P(Z \leq 1.2)$ **d**
> $P(Z = 4)$\
> **e** $P(Z < 2)$ **f** $P(Z = 2.3)$ **g** $P(Z \geq 1)$ **h**
> $P(Z > - 1.2)$

**a & e** (both equal $P(Z \leq 2) = 0.9772$)

**b & g** ($P(Z \leq - 1) = 1 - 0.8413 = 0.1587 = P(Z \geq 1)$)

**c & h** ($P(Z \leq 1.2) = 0.8849 = P(Z > - 1.2)$)

**d & f** (both equal 0, since $P(Z = c) = 0$ for any constant $c$)

11. Match these eight probabilities into four pairs with equal values:

> **a** $P(Z \leq 5)$ **b** $P(Z > - 1.7)$ **c** $P(Z < 5)$ **d**
> $P(Z \geq 2)$
>
> **e** $P(Z = 3)$ **f** $P(Z \leq - 2)$ **g** $P(Z \leq 1.7)$ **h**
> $P(Z = 1.2)$

**a & c** (both $P(Z \leq 5) \approx 1.0000$)

**b & g** ($P(Z > - 1.7) = P(Z \leq 1.7) = 0.9554$)

**d & f** ($P(Z \geq 2) = 1 - 0.9772 = 0.0228 = P(Z \leq - 2)$)

**e & h** (both equal 0)

12. a.  Use symmetry to explain why $P(Z \leq 0) = 0.5$.

By symmetry, the bell curve is symmetric about $z = 0$, so the area to
the left and right of 0 are equal, each $= 0.5$.

b.  Hence use $P(0 < Z \leq a) = P(Z \leq a) - 0.5$ to find:

+----------------------------+---------------------------------+----------------------------+
| i.  $P(0 < Z \leq 1.3)$    | ii. $P(0 < Z \leq 2.4)$         | iii. $P(0 < Z \leq 0.7)$   |
|                            |                                 |                            |
| $$0.9032 - 0.5 = 0.4032$$  | $$0.9918 - 0.5 = 0.4918$$       | $$0.7580 - 0.5 = 0.2580$$  |
+============================+=================================+============================+
| iv. $P( - 2.4 \leq Z < 0)$ | v.  $P( - 1.1 \leq Z < 0)$      | vi. $P( - 0.7 \leq Z < 0)$ |
|                            |                                 |                            |
| 0.4918                     | $$0.8643 - 0.5 = 0.3643$$       | 0.2580                     |
+----------------------------+---------------------------------+----------------------------+
| vii. $P(0 < Z \leq 1.6)$   | viii. $P( - 1.3 \leq Z \leq 0)$ | ix. $P(0 < Z \leq 5)$      |
|                            |                                 |                            |
| $0.9452 - 0.5 = 0.4452$    | 0.4032                          | $$1.0000 - 0.5 = 0.5000$$  |
+----------------------------+---------------------------------+----------------------------+

a.  Show that $P( - a \leq Z \leq a) = 2P(Z \leq a) - 1$

$$LHS\  = \ P( - a \leq Z \leq a) = P(Z \leq a) - P(Z < - a)$$

$$= P(Z \leq a) - \left\lbrack 1 - P(Z \leq a) \right\rbrack$$

$$= P(Z \leq a) - 1 + P(Z \leq a)$$

$$2P(Z \leq a) - 1$$

b.  Hence find:

+---------------------------------+------------------------------+------------------------------+
| i.  $P( - 1.3 \leq Z \leq 1.3)$ | ii. $P( - 2.4 < Z \leq 2.4)$ | iii. $P( - 0.8 < Z < 0.8)$   |
|                                 |                              |                              |
| $$2(0.9032) - 1 = 0.8064$$      | $$2(0.9918) - 1 = 0.9836$$   | $$2(0.7881) - 1 = 0.5762$$   |
+=================================+==============================+==============================+
| iv. $P( - 2.9 < Z \leq 2.9)$    | v.  $P( - 0.4 \leq Z < 0.4)$ | vi. $P( - 1.5 < Z \leq 1.5)$ |
|                                 |                              |                              |
| $$2(0.9981) - 1 = 0.9962$$      | $$2(0.6554) - 1 = 0.3108$$   | $$2(0.9332) - 1 = 0.8664$$   |
+---------------------------------+------------------------------+------------------------------+

13. For a dataset that is normally distributed, find the probability
    that a randomly chosen score has a z-score:

+--------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------+
| a.  less than --1.42                                                                                         | b.  less than --2.21                                                                                             |
|                                                                                                              |                                                                                                                  |
| ![A diagram of a function AI-generated content may be                                                        | ![A diagram of a function AI-generated content may be                                                            |
| incorrect.](media/Random Variables 3_The Normal Distribution/media/image64.png){width="1.5743055555555556in" | incorrect.](media/Random Variables 3_The Normal Distribution/media/image64.png){width="1.5743055555555556in"     |
| height="0.9173611111111111in"}                                                                               | height="0.9173611111111111in"}                                                                                   |
|                                                                                                              |                                                                                                                  |
| $$P(Z\  < \  - 1.42) = \ 1\  - \ P(Z\  < \ 1.42)$$                                                           | $$P(Z\  < \  - 2.21)\  = \ 1\  - \ P(Z\  < \ 2.21)\ $$                                                           |
|                                                                                                              |                                                                                                                  |
| $$\  = \ 1\  - \ 0.9222\  = \ 0.0778$$                                                                       | $$= \ 1\  - \ 0.9864\  = \ 0.0136$$                                                                              |
+==============================================================================================================+==================================================================================================================+
| c.  more than --1.19                                                                                         | d.  ![A diagram of a function AI-generated content may be                                                        |
|                                                                                                              |     incorrect.](media/Random Variables 3_The Normal Distribution/media/image64.png){width="1.5743055555555556in" |
| $$P(Z\  > \  - 1.19)$$                                                                                       |     height="0.9173611111111111in"}more than --2.07                                                               |
|                                                                                                              |                                                                                                                  |
| $$= \ P(Z\  < \ 1.19)\  = \ 0.8830$$                                                                         | ![A diagram of a function AI-generated content may be                                                            |
|                                                                                                              | incorrect.](media/Random Variables 3_The Normal Distribution/media/image64.png){width="1.5743055555555556in"     |
|                                                                                                              | height="0.9173611111111111in"}                                                                                   |
|                                                                                                              |                                                                                                                  |
|                                                                                                              | $$P(Z\  > \  - 2.07)$$                                                                                           |
|                                                                                                              |                                                                                                                  |
|                                                                                                              | $$= \ P(Z\  < \ 2.07)\  = \ 0.9808$$                                                                             |
+--------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------+

14. Use $P(a \leq Z \leq b) = P(Z \leq b) - P(Z \leq a)$ to find:

+---------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------+
| a.  between --0.95 and --0.52                                                               | b.  ![A diagram of a function AI-generated content may be                                                        |
|                                                                                             |     incorrect.](media/Random Variables 3_The Normal Distribution/media/image64.png){width="1.5743055555555556in" |
| $$P( - 0.95\  < \ Z\  < \  - 0.52)$$                                                        |     height="0.9173611111111111in"}between --1.96 and --1.24                                                      |
|                                                                                             |                                                                                                                  |
| $$= \ P(Z\  < \  - 0.52)\  - \ P(Z\  < \  - 0.95)$$                                         | ![A diagram of a function AI-generated content may be                                                            |
|                                                                                             | incorrect.](media/Random Variables 3_The Normal Distribution/media/image64.png){width="1.5743055555555556in"     |
| $$= \ \lbrack 1\  - \ P(Z\  < \ 0.52)\rbrack\  - \ \lbrack 1\  - \ P(Z\  < \ 0.95)\rbrack$$ | height="0.9173611111111111in"}                                                                                   |
|                                                                                             |                                                                                                                  |
| $$= \ P(Z\  < \ 0.95)\  - \ P(Z\  < \ 0.52)$$                                               | $$P( - 1.96\  < \ Z\  < \  - 1.24)$$                                                                             |
|                                                                                             |                                                                                                                  |
| $$= \ 0.8289\  - \ 0.6985\  = \ 0.1304$$                                                    | $$= \ P(Z\  < \  - 1.24)\  - \ P(Z\  < \  - 1.96)$$                                                              |
|                                                                                             |                                                                                                                  |
|                                                                                             | $$= \ \lbrack 1\  - \ P(Z\  < \ 1.24)\rbrack\  - \ \lbrack 1\  - \ P(Z\  < \ 1.96)\rbrack$$                      |
|                                                                                             |                                                                                                                  |
|                                                                                             | $$= \ P(Z\  < \ 1.96)\  - \ P(Z\  < \ 1.24)$$                                                                    |
|                                                                                             |                                                                                                                  |
|                                                                                             | $$= \ 0.9750\  - \ 0.8925\  = \ 0.0825$$                                                                         |
+=============================================================================================+==================================================================================================================+
| c.                                                                                          |                                                                                                                  |
+---------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------+

+-------------------------------------+-------------------------------------+-------------------------------+
| i.  $P(1.2 \leq Z < 1.5)$           | ii. $P(0.2 \leq Z < 2.3)$           | iii. $P(0.6 \leq Z < 1.7)$    |
|                                     |                                     |                               |
| $$0.9332 - 0.8849 = 0.0483$$        | $$0.9893 - 0.5793 = 0.4100$$        | $$0.9554 - 0.7257 = 0.2297$$  |
+=====================================+=====================================+===============================+
| iv. $P( - 2 \leq Z < - 1.2)$        | v.  $P( - 4 \leq Z < - 0.2)$        | vi. $P( - 2.7 \leq Z < - 1)$  |
|                                     |                                     |                               |
| $$P(Z \leq - 1.2) - P(Z \leq - 2)$$ | $$P(Z \leq - 0.2) - P(Z \leq - 4)$$ | $$P(Z < - 1) - P(Z < - 2.7)$$ |
|                                     |                                     |                               |
| $$= 0.1151 - 0.0228$$               | $$= 0.4207 - 0$$                    | $$= 0.1587 - 0.0035$$         |
|                                     |                                     |                               |
| $$= 0.0923$$                        | $$= 0.4207$$                        | $$= 0.1552$$                  |
+-------------------------------------+-------------------------------------+-------------------------------+

15. A machine produces cylindrical pipes. The mean of the diameters of
    the pipes is 7.00 cm and the standard deviation is 0.03 cm. Assuming
    a normal distribution, what is the probability that a randomly
    chosen pipe has a diameter less than 6.95 cm?

P(x \< 6.95) = P(z \< −1.67) = 0.0475

16. ![](media/Random Variables 3_The Normal Distribution/media/image65.png){width="2.729861111111111in"
    height="1.4402777777777778in"}![](media/Random Variables 3_The Normal Distribution/media/image66.png){width="2.348218503937008in"
    height="1.5541349518810148in"}Complete the following to calculate
    $P( - 1.28 < z < 0.94)$.

P(−1.28 \< z \< 0.94)

= P(z \< 0.94) − P(z \< −1.28)

= P(z \< 0.94) − P(z \> 1.28)

= P(z \< 0.94) − \[1 − P(z \< 1.28)\]

= 0.8264 − (1 − 0.8997) ≈ 0.7261

17. For a dataset that is normally distributed, nd the probability that
    a randomly chosen score has a z-score:

    a.  ![A diagram of a function AI-generated content may be
        incorrect.](media/Random Variables 3_The Normal Distribution/media/image64.png){width="1.5743055555555556in"
        height="0.9173611111111111in"}between --0.67 and 1.83

0.7150

b.  ![A diagram of a function AI-generated content may be
    incorrect.](media/Random Variables 3_The Normal Distribution/media/image64.png){width="1.5743055555555556in"
    height="0.9173611111111111in"}between --1.41 and 2.15

0.9050

c.  ![A diagram of a function AI-generated content may be
    incorrect.](media/Random Variables 3_The Normal Distribution/media/image64.png){width="1.5743055555555556in"
    height="0.9173611111111111in"}between --0.82 and 1.36

0.7070

18. Packets of sugar are filled and labelled as having a weight of 1 kg.
    The weights of these packets are normally distributed with a mean of
    1.01 kg and a standard deviation of 0.01 kg. A packet of sugar is
    rejected if its weight is lower than 985 g.

    a.  What is the probability that a randomly chosen packet of sugar
        is rejected?

P(x \< 0.985) = P(z \< −2.5) = 0.0062

b.  From a batch of 1000 packets of sugar, how many packets would you
    expect to be rejected?

0.006 2 × 1000 ≈ 6; expect 6 packets to be rejected

19. The lengths jumped by Year 8 long-jump competitors follow a normal
    distribution with a mean of 432 cm and a standard deviation of 14
    cm.

    a.  Find the probability that a competitor jumps:

        i.  more than 445 cm

P(x \> 445) = P(z \> 0.93) = 0.1762

ii. at least 410 cm

P(x \> 410) = P(z \> −1.57) = 0.9418

iii. between 420 cm and 458 cm.

P(420 \< x \< 458) = P(−0.86 \< z \< 1.86) = 0.7737

b.  A competitor jumps 486 cm. Is this unusual?

Yes, this is unusual as this length is nearly four standard deviations
above the mean, which is a very small probability.

Mastery

20. The heights of 1000 Year 12 males are found to be approximately
    normally distributed with a mean of 168 cm and standard deviation of
    9 cm. Bradley is a Year 12 male whose height puts him just inside
    the top 10%. Find Bradley's height, answer to 1 d.p.

    a.  Find the probability that a randomly chosen Year 12 male is
        taller than 175 cm.

P(x \> 175) = P(z \> 0.78) = 0.2177

b.  Find the probability that a randomly chosen Year 12 male has a
    height less than 165 cm.

P(x \< 165) = P(z \< −0.33) = 0.3707

c.  Find the probability that a randomly chosen Year 12 male has a
    height between 170 cm and 175 cm.

P(170 \< x \< 175) = P(0.22 \< z \< 0.78) = 0.1952

d.  How many Year 12 males in the sample have a height between 170 cm
    and 175 cm?

0.1952 × 1000 ≈ 195; 195 Year 12 males

21. Human gestation is approximately normally distributed with mean 266
    days and standard deviation 16 days.

    a.  About $0.75 \times 365 \approx 274$ days is nine months. What
        percentage of females give birth before 274 days?

$$z = \frac{274 - 266}{16} = 0.5$$

$$P(Z < 0.5) = 0.6915 \approx 69\%$$

b.  If 266 days is "on time", what percentage give birth more than:

    i.  1 week early

$$z = \frac{259 - 266}{16} = - 0.4375 \approx - 0.44$$

$P(Z < - 0.44) = 1 - 0.6700 \approx 33\%$

ii. 1 week late?

1 week late: birth after day 273

$$z = \frac{273 - 266}{16} \approx 0.44$$

$$P(Z > 0.44) \approx 33\%$$

22. A Jack Russell terrier has mean height 28 cm and standard deviation
    0.833 cm.

    a.  What range of heights (to 1 d.p.) would you expect?

$\mu \pm 3\sigma = 28 \pm 2.5$

25.5 cm to 30.5 cm

b.  Find the $z$-score of 27.2 cm.

$$z = \frac{27.2 - 28}{0.833} \approx - 0.96$$

c.  What percentage of dogs are between 27.2 and 30 cm tall?

$$z(27.2) \approx - 0.96$$

$$z(30) = \frac{30 - 28}{0.833} \approx 2.4$$

$$P( - 0.96 \leq Z \leq 2.4) = 0.9918 - (1 - 0.8315)$$

$$= 82.33\%$$

d.  Would a dog 24 cm tall be typical? Why?

$$z = \frac{24 - 28}{0.833} \approx - 4.8$$

Far outside normal range; not typical.

23. Pulse rates for adult males aged 20--39 are approximately normally
    distributed with mean 71 and standard deviation 9.

    a.  Bradycardia is a pulse rate below 60 beats/minute.\
        What percentage of this population has bradycardia?

$$z = \frac{60 - 71}{9} = - 1.22 \approx - 1.2$$

$$P(Z < - 1.2) = 1 - 0.8849 \approx 12\%$$

b.  Tachycardia is a pulse rate above 100 beats/minute. What percentage?

$$z = \frac{100 - 71}{9} \approx 3.2$$

$$P(Z > 3.2) = 1 - 0.9993 \approx 0.07\%$$

c.  Repeat **a** and **b** for females aged 20--39 with mean 76 and
    standard deviation 9.5.

Bradycardia:

$$z = \frac{60 - 76}{9.5} \approx - 1.7$$

$P(Z < - 1.7) = 1 - 0.9554 \approx 4.5\%$

Tachycardia:

$$z = \frac{100 - 76}{9.5} \approx 2.5$$

$$P(Z > 2.5) = 1 - 0.9938 \approx 0.6\%$$

# Finding $\mathbf{\mu}$ or $\mathbf{\sigma}$ given a Probability

+-----------------------------------------------------------------------+
| - **Identify** z from the table, given probability                    |
+===================================+===================================+
| a.  $P(Z\  < \ z)\  = \ 0.9772$.\ | b.  $P(Z\  < \ z)\  = \ 0.9332$.\ |
|     Find the value of $z$.        |     Find the value of $z$.        |
+-----------------------------------+-----------------------------------+
| c.  $P(Z\  < \ z)\  = 0.8413$.\   | d.  $P(Z\  < \ z)\  = \ 0.0228.$\ |
|     Find the value of $z$.        |     Find the value of $z$.        |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Finding** $\mathbf{\mu}$ **or** $\mathbf{\sigma}$             |
+===================================================================+
| Sometimes you are given the probability and asked to find the     |
| mean or standard deviation.                                       |
|                                                                   |
| 1\. Find $z$ using the table.                                     |
|                                                                   |
| 2\. Set up an equation using $z =$ $\frac{x - \mu}{\sigma}$.      |
|                                                                   |
| 3\. Solve for the unknown.                                        |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Example** Find $\mu$ or $\sigma$ given the probability            |
+===================================+===================================+
| X is normally distributed with    | A company manufactures chocolate  |
| standard deviation 6. Given that  | bars with standard deviation 2 g. |
| $P(X\  < \ 47)\  = \ 0.9772$,     | What would the mean weight need   |
| find the mean $\mu$.              | to be for there to be less than   |
|                                   | 0.1% chance of a bar being under  |
| Using the table,                  | 100 g?                            |
| $P(Z \leq 2) = 0.9772$.           |                                   |
|                                   | We want $P(Z \leq z) = 0.001$     |
| So $z = 2$:                       |                                   |
|                                   | This would be a negative z-score, |
| $${2 = \frac{47 - \mu}{6}         | so                                |
| }{12 = 47 - \mu                   |                                   |
| }{\mu = 35}$$                     | $${P(Z \leq - z) = P(Z \geq z)    |
|                                   | }{= 1 - P(Z \leq z)               |
|                                   | }{= 1 - 0.001                     |
|                                   | }{= 0.999}$$                      |
|                                   |                                   |
|                                   | Using the table,                  |
|                                   | $P(Z \leq 3.1) = 0.999$           |
|                                   |                                   |
|                                   | So $z = - 3.1:$                   |
|                                   |                                   |
|                                   | $${- 3.1 = \frac{100 - \mu}{2}    |
|                                   | }{- 6.2 = 100 - \mu               |
|                                   | }{\mu = 106.2\ g}$$               |
+-----------------------------------+-----------------------------------+
| - **Guided Practice**                                                 |
+-----------------------------------------------------------------------+
| a.  $X$ is normally distributed with mean 35. Given                   |
|     $P(X\  < \ 47)\  = \ 0.9772$, find $\sigma$.                      |
|                                                                       |
| 6                                                                     |
+-----------------------------------------------------------------------+
| b.  $X$ is normally distributed with SD 6. Given                      |
|     $P(X\  < \ 47)\  = \ 0.0228$, find $\mu$.                         |
|                                                                       |
| 59                                                                    |
+-----------------------------------------------------------------------+
| c.  $X$ is normally distributed with SD 10. Given                     |
|     $P(X\  > \ 85)\  = \ 0.0668$, find $\mu$.                         |
|                                                                       |
| 70                                                                    |
+-----------------------------------------------------------------------+
| d.  A machine fills bottles of water with a standard deviation of 5   |
|     mL. What mean volume must be set so that fewer than 0.13% of      |
|     bottles contain less than 330 mL?                                 |
|                                                                       |
| 345 mL                                                                |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Finding Probabilities using a Calculator**                                                                                                                                                                  |
+=================================================================================================================================================================================================================+
| ![](media/Random Variables 3_The Normal Distribution/media/image53.png){width="0.30219706911636046in" height="0.2772222222222222in"}**Casio FX 8200AU:**                                                        |
|                                                                                                                                                                                                                 |
| 1\. Press HOME                                                                                                                                                                                                  |
|                                                                                                                                                                                                                 |
| ![](media/Random Variables 3_The Normal Distribution/media/image54.png){width="0.7368055555555556in" height="0.37859580052493436in"}                                                                            |
|                                                                                                                                                                                                                 |
| 2\. Select                                                                                                                                                                                                      |
|                                                                                                                                                                                                                 |
| ![](media/Random Variables 3_The Normal Distribution/media/image55.png){width="0.29097222222222224in" height="0.29375in"}3. Select \[Inverse Normal\] (this finds $x$ for $P(X \leq x) = c$)                    |
|                                                                                                                                                                                                                 |
| 4\. Enter data using the arrow keys and                                                                                                                                                                         |
|                                                                                                                                                                                                                 |
| ![](media/Random Variables 3_The Normal Distribution/media/image56.png){width="0.9513112423447069in" height="0.1800349956255468in"}5. After entering your data, press                                           |
|                                                                                                                                                                                                                 |
| **Examples:**                                                                                                                                                                                                   |
|                                                                                                                                                                                                                 |
| +------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------+ |
| | Mean: 100, SD: 10                                                                                    | When working with z-scores                                                                           | |
| |                                                                                                      |                                                                                                      | |
| | Find the value of $x$ such that\                                                                     | Find the value of $z$ such that\                                                                     | |
| | $$P(X \leq x) = 0.9$$                                                                                | $$P(Z \leq z) = 0.8$$                                                                                | |
| |                                                                                                      |                                                                                                      | |
| | Area: 0.9                                                                                            | Area: 0.8                                                                                            | |
| |                                                                                                      |                                                                                                      | |
| | $\mu$: 100                                                                                           | $\mu$: 0                                                                                             | |
| |                                                                                                      |                                                                                                      | |
| | $\sigma:$ 10                                                                                         | $\sigma:$ 1                                                                                          | |
| |                                                                                                      |                                                                                                      | |
| | ![](media/Random Variables 3_The Normal Distribution/media/image67.png){width="2.0208333333333335in" | ![](media/Random Variables 3_The Normal Distribution/media/image68.png){width="2.0208333333333335in" | |
| | height="0.7604166666666666in"}                                                                       | height="0.7604166666666666in"}                                                                       | |
| |                                                                                                      |                                                                                                      | |
| | This means a measurement of 112.82 is better than 90% of measurements (top 10%)                      | This means a z-score of 0.84 is better than 80% of measurements (top 20%)                            | |
| +======================================================================================================+======================================================================================================+ |
|                                                                                                                                                                                                                 |
| - If a table is given in an exam, use the provided table.                                                                                                                                                       |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  Find the z-score such that a value just beats 80% of values (the top
    20%) of a normal distribution.

We want a z-score with $P(Z\  \leq \ z)\  = \ 0.80$

Using the table, or inverse normal on a calculator, this corresponds to
a z-score of $\approx \ 0.84$

2.  Find the z-score for the value that is better than 65% of all
    measurements.

We want a z-score with $P(Z\  \leq \ z)\  = \ 0.65$

Using the table, or inverse normal on a calculator, this corresponds to
a z-score of $\approx \ 0.39$

3.  Exam scores are normally distributed with mean 65 and standard
    deviation 12.\
    A student scores better than 80% of the cohort. Find their score to
    1 d.p.

We want a z-score with $P(Z\  \leq \ z)\  = \ 0.80$

Using the table, or inverse normal on a calculator, this corresponds to
a z-score of $\approx \ 0.84$

$$x\  = \ 65\  + \ 0.84(12)\  = \ 75.1$$

4.  The lifespan of a brand of light bulb is normally distributed with
    mean 1200 hours and standard deviation 80 hours. A bulb lasts longer
    than 95% of bulbs of this brand. Find its lifespan to 1 d.p.

We want a z-score with $P(Z\  \leq \ z)\  = \ 0.95$

Using the table, or inverse normal on a calculator, this corresponds to
a z-score of $\approx \ 1.64$

$x\  = \ 1200\  + \ 1.64(80)\  =$ 1331.2 hours

5.  Daily rainfall in a city is normally distributed with mean 4.2 mm
    and standard deviation 1.5 mm. On a particular day, rainfall exceeds
    75% of all recorded days. Find that day\'s rainfall to 1 d.p.

We want a z-score with $P(Z\  \leq \ z)\  = \ 0.75$

Using the table, or inverse normal on a calculator, this corresponds to
a z-score of $\approx \ 0.67$

$x\  = \ 4.2\  + \ 0.67(1.5)\  = \ 5.2$ mm

Development

6.  Heights of Year 12 males are approximately normally distributed with
    mean 168 cm and standard deviation 9 cm. Bradley is a Year 12 male
    whose height puts him just inside the top 10%. Find Bradley's
    height, answer to 1 d.p.

We want a z-score with $P(Z \leq z) = 0.9$

Using the table, or inverse normal on a calculator, this corresponds to
a z-score of $\approx \$`<!-- -->`{=html}1.28

$x = 168 + 1.28(9) =$ 179.5 cm

7.  IQ scores are normally distributed with mean 100. 10% of the
    population score above 125.\
    Find the standard deviation to 1 d.p.

z = invNorm(0.9) ≈ 1.2816;

125 = 100 + 1.2816σ

σ = 25 ÷ 1.2816 = 19.5

8.  Apple weights from an orchard are normally distributed with standard
    deviation 15 g.\
    20% of apples weigh more than 185 g. Find the mean weight to 1 d.p.

z = invNorm(0.80) ≈ 0.8416;

185 = μ + 0.8416(15)

μ = 185 − 12.6 = 172.4 g

9.  Phone battery lives are normally distributed with mean 18 hours.\
    8% of phones last fewer than 14 hours. Find the standard deviation
    to 1 d.p.

z = invNorm(0.08) ≈ −1.4051;

14 = 18 − 1.4051σ

σ = 4 ÷ 1.4051 = 2.8 hours

10. Australian adult male heights are normally distributed with mean 176
    cm and standard deviation 7.5 cm. A doorway is designed so 90% can
    enter without ducking.

    a.  Find the $z$-score such that $P(Z < z) = 90\%$ (to 1 d.p.).

Need $P(Z < z) = 0.90$. From table: $P(Z \leq 1.2) = 0.8849$,
$P(Z \leq 1.3) = 0.9032$.

$z \approx 1.3$.

b.  Find the minimum doorway height, to nearest cm.

$x \approx 176 + 1.3(7.5) \approx 186$ cm

c.  In the Dinaric Alps, male heights have mean 185 cm and standard
    deviation 7.5 cm.\
    A doorway is needed so 95% can enter without ducking.

    i.  Explain why a reasonable estimate for $P(Z < z) = 0.95$ is
        $z = 1.65$.

$P(Z \leq 1.6) = 0.9452$ and $P(Z \leq 1.7) = 0.9554$.

Since $0.95$ lies between these, a reasonable estimate is the midpoint
$z \approx 1.65$.

ii. Find the minimum design height.

$x = 185 + 1.65(7.5) = 185 + 12.375 \approx 197$ cm

11. A machine fills cereal boxes with mean 500 g and standard deviation
    2 g. To ensure boxes are above the advertised weight at least 95% of
    the time, what weight should be printed on the box?

Need $P(X \geq x_{0}) = 0.95$, so $P(X < x_{0}) = 0.05$, giving
$z_{0} \approx - 1.65$. $x_{0} = 500 + ( - 1.65)(2) = 496.7$ g.

The box should be marked 496 g (2σ below mean, so 97.5% of boxes weigh
above this).

# Equation of the PDF

+-------------------------------------------------------------------+
| - **Normal Distribution Notation**                                |
+===================================================================+
| Concise notation for '$X$ is normally distributed with mean $\mu$ |
| and standard deviation $\sigma$':                                 |
|                                                                   |
| $$X\sim N\left( \mu,\sigma^{2} \right)$$                          |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** mean and standard deviation                                                                                   |
+========================================+=========================================+===========================================+
| a.  $X\sim N\left( 70,\ 5^{2} \right)$ | b.  $X\sim N(70,\ 25)$                  | c.  $X\sim N\left( - {10,28}^{2} \right)$ |
+----------------------------------------+-----------------------------------------+-------------------------------------------+
| d.  $X\sim N( - 10,\ 30)$              | e.  $X\sim N\left( 268,\ 9^{2} \right)$ | f.  $X\sim N(0,\ 1)$                      |
+----------------------------------------+-----------------------------------------+-------------------------------------------+

+-----------------------------------------------------------------------------------------------------+
| - **Standard Normal Curve**                                                                         |
+=====================================================================================================+
| The standard normal curve is $X\sim N(0,1)$.                                                        |
|                                                                                                     |
| It has a mean of 0 and standard deviation 1.                                                        |
|                                                                                                     |
| It describes the spread of z-scores.                                                                |
|                                                                                                     |
| ![](media/Random Variables 3_The Normal Distribution/media/image69.png){width="2.148956692913386in" |
| height="1.457638888888889in"}Any normal distribution can be transformed to the standard normal      |
| curve using the mapping:                                                                            |
|                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ x \mapsto \frac{x - \mu}{\sigma}$$                                  |
|                                                                                                     |
| ![](media/Random Variables 3_The Normal Distribution/media/image70.png)                             |
|                                                                                                     |
| raw scores $x$                                                                                      |
+-----------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------+
| - **PDF for Standard Normal Curve**                                                                  |
+======================================================================================================+
| For any normal curve with $\mu\$and $\sigma$:                                                        |
|                                                                                                      |
| $$f(x) = \frac{1}{\sigma\sqrt{2\pi}} \cdot \ e^{- \frac{(x\  - \ \mu)^{2}}{2\sigma^{2}}}$$           |
|                                                                                                      |
| For the standard normal curve $\mu = 0,\ \sigma = 1$:                                                |
|                                                                                                      |
| $$\phi(z) = \frac{1}{\sqrt{2\pi}}e^{- \frac{1}{2}\ z^{2}}$$                                          |
|                                                                                                      |
| Notice that every normal curve is a transformation of the standard curve                             |
| $f(x) = \phi\left( \frac{x - \mu}{\sigma} \right)$                                                   |
|                                                                                                      |
| ![](media/Random Variables 3_The Normal Distribution/media/image72.png){width="1.9429494750656169in" |
| height="1.9517541557305338in"}The standard curve $\phi(z)$ has these properties:                     |
|                                                                                                      |
| - Total area under the curve is 1.                                                                   |
|                                                                                                      |
| - Even symmetry.                                                                                     |
|                                                                                                      |
| - Mean, median, mode (global max) at $z = 0$.                                                        |
|                                                                                                      |
| - $y$-intercept at $\frac{1}{\sqrt{2\pi}}$ $\approx 0.4$.                                            |
|                                                                                                      |
| - $y \rightarrow 0$ as $z \rightarrow \pm \infty$                                                    |
|                                                                                                      |
| - Points of inflection are 1 SD from the mean.                                                       |
+------------------------------------------------------------------------------------------------------+

Foundation

1.  Let $X$ denote a normal random variable with mean 0 and standard
    deviation 1. The random variable $X$ has the probability density
    function

$$f(x) = \frac{1}{\sqrt{2\pi}}e^{\frac{- x^{2}}{2}}\quad\text{where }x \in ( - \infty,\infty)$$

The diagram shows the graph of $y = f(x)$.

![](media/Random Variables 3_The Normal Distribution/media/image73.png){width="4.0in"
height="2.033791557305337in"}

a.  Complete the table of values for the given function, correct to four
    decimal places.

  -------------------------------------------------------------------------------------------
        $$\mathbf{X}\mathbf{=}\mathbf{x}$$        $$- 2$$   $$- 1$$   $$0$$   $$1$$    $$2$$
  ---------------------------------------------- --------- --------- ------- -------- -------
   $$\mathbf{f}\mathbf{(}\mathbf{x}\mathbf{)}$$             0.2420            0.2420  

  -------------------------------------------------------------------------------------------

0.0540 0.2420 0.3989 0.2420 0.0540

b.  Use the trapezoidal rule and 5 function values from part **a** to
    estimate $\int_{- 2}^{2}f(x)\, dx$.

Trapezoidal rule with $h = 1$

$$\int_{- 2}^{2}f(x)\, dx \approx \frac{1}{2}\lbrack 0.0540 + 2(0.2420 + 0.3989 + 0.2420) + 0.0540\rbrack \approx 0.9369$$

c.  The weights of Rhodesian ridgebacks are normally distributed with a
    mean of 48 kilograms and a standard deviation of 6 kilograms. Using
    the result from part **b**, calculate the probability of a randomly
    selected Rhodesian ridgeback weighing less than 36 kilograms.

$$z\ score\ (36) = \frac{36 - 48}{6} = - 2$$

$$By\ symmetry,\ P(X < 36) = P(z < - 2) = \frac{1 - 0.9369}{2} = 3.155\%$$

2.  The diastolic measurement for blood pressure in 35-year-old people
    is normally distributed with a mean of 75 and a standard deviation
    of 12.

    a.  A person is considered to have low blood pressure if their
        diastolic measurement is 63 or less. What percentage of
        35-year-olds have low blood pressure?

$$z\ score\ (63) = \frac{63 - 75}{12} = - 1$$

$$P(\text{bp} \leq 63) = P(z \leq - 1) = \frac{100 - 68}{2} = 16\%$$

b.  Calculate the $z$-score for a diastolic measurement of 57.

$$z\text{-score}(57) = \frac{57 - 75}{12} = - 1.5$$

c.  The probability that a 35-year-old person has a diastolic
    measurement between 57 and 63 can be found by evaluating
    $\int_{a}^{b}f(x)\, dx$, where $a$ and $b$ are constants and
    $f(x) = \frac{1}{\sqrt{2\pi}}e^{\frac{- x^{2}}{2}}$ is the standard
    normal PDF. By first finding $a$ and $b$, calculate an approximate
    value for this probability using the trapezoidal rule with 3
    function values.

Convert 57 and 63 to $z$-scores: $a = - 1.5$, $b = - 1$

  --------------------------------------------------
  $$\text{bp}$$   57          60           63
  --------------- ----------- ------------ ---------
  $$x$$           $$- 1.5$$   $$- 1.25$$   $$- 1$$

  $$y$$           0.1295      0.1826       0.2420
  --------------------------------------------------

Trapezoidal rule with $h = 0.25$:

$$\text{Area} \approx \frac{0.25}{2}(0.1295 + 2 \times 0.1826 + 0.2420) \approx 0.0920 \approx 9.2\%$$

d.  Hence, find the approximate probability that a 35-year-old person
    chosen at random has a diastolic measurement of 57 or less.

From part **a**: $P(\text{bp} \leq 63) = 16\%$.

$$P(\text{bp} \leq 57) = 16\% - 9.2\% = 6.8\%$$

# Exam Practice

1.  **2010 HSC Standard 2 Band 3**

![A group of graphs showing different levels of frequency AI-generated
content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image74.png){width="4.30625in"
height="3.3555555555555556in"} Which of the following frequency
histograms shows data that could be normally distributed?

A normal distribution is bell-shaped and symmetric.

Answer: A.

2.  **2017 HSC Standard 2 Band 3**

> ![A group of black text AI-generated content may be
> incorrect.](media/Random Variables 3_The Normal Distribution/media/image75.png){width="0.79375in"
> height="1.167665135608049in"}The heights of Year 12 girls are normally
> distributed with a mean of 165 cm and a standard deviation of 5.5 cm.
> What is the z-score for a height of 154 cm?

$$z = \frac{154 - 165}{5.5} = - 2$$

Answer: A.

3.  **HSC Sample Question Band 4**

> The length of a type of ant is approximately normally distributed with
> a mean of 4.8 mm and a standard deviation of 1.2 mm.

A standardised ant length of  $z = - 0.5$ corresponds to an actual ant
length of:

![A close up of a number AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image76.png){width="0.8783541119860018in"
height="1.24375in"}

$x = \mu + z\sigma = 4.8 + ( - 0.5)(1.2) = 4.2$ mm.

Answer: C.

4.  **2018 HSC Standard 2 Band 4**

> Joanna sits a Physics test and a Biology test. Joanna's mark in the
> Physics test is 70.\
> The mean mark for this test is 58 and the standard deviation is 8.

a.  Calculate the z-score for Joanna's mark in this test.

$$z = \frac{70 - 58}{8} = 1.5$$

b.  In the Biology test, the mean mark is 64 and the standard deviation
    is 10.\
    Joanna's z-score is the same in both the Physics test and the
    Biology test. 

> What was her mark in Biology?

$$x = 64 + 1.5 \times 10 = 79$$

5.  **2020 HSC Standard 2 Band 4**

> John recently did a class test in each of three subjects.\
> The class scores on each test were normally distributed.
>
> The table shows the subjects and John\'s scores as well as the mean
> and standard deviation of the class scores on each test.
>
> ![A table with numbers and words AI-generated content may be
> incorrect.](media/Random Variables 3_The Normal Distribution/media/image77.png){width="3.9125in"
> height="1.1087543744531934in"}
>
> Relative to the rest of class, which row of the table below shows
> John\'s strongest subject and his weakest subject?
>
> ![A table of words AI-generated content may be
> incorrect.](media/Random Variables 3_The Normal Distribution/media/image78.png){width="2.99375in"
> height="1.4285772090988627in"}

French: $z = \frac{82 - 70}{8} = 1.5$

Commerce: $z = \frac{80 - 65}{5} = 3$

Music: $z = \frac{74 - 50}{12} = 2$

Strongest: Commerce ($z = 3$), weakest: French ($z = 1.5$). Answer: A.

6.  **2006 HSC Standard 2 Band 5**

> Which of these graphs best represents positively skewed data with the
> smaller standard deviation?

![A group of graphs showing different types of lines AI-generated
content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image79.png){width="4.472916666666666in"
height="3.0395833333333333in"}

Positively skewed = tail to the right; smaller SD = narrower spread.

Answer: C.

Explain why the graph you have chosen is NOT a normal distribution.

It is not bell-shaped.

7.  **HSC Sample Question Band 5**

> The pulse rates of a large group of 18-year-old students are
> approximately normally distributed with a mean of 75 beats/minute and
> a standard deviation of 11 beats/minute. 
>
> ![A group of numbers on a white background AI-generated content may be
> incorrect.](media/Random Variables 3_The Normal Distribution/media/image80.png){width="0.9361111111111111in"
> height="0.6277777777777778in"}The percentage of 18-year-old students
> with pulse rates less than 53 beats/minute or greater than 86
> beats/minute is closest to

![A group of numbers on a white background AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image80.png){width="0.9366262029746282in"
height="0.6281233595800525in"}

$z_{53} = \frac{53 - 75}{11} = - 2$, so $P(z < - 2) = 2.5\%$

$z_{86} = \frac{86 - 75}{11} = 1$, so $P(z > 1) = 16\%$

$2.5 + 16 = 18.5\%$. Answer: D.

8.  **2011 HSC Standard 2 Band 5**

> Two brands of light bulbs are being compared.\
> For each brand, the life of the light bulbs is normally distributed.

![A table with text and numbers AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image81.png){width="3.452777777777778in"
height="1.1069444444444445in"}

a.  One of the Brand B light bulbs has a life of 400 hours. \
    What is the z-score of the life of this light bulb?

$$z = \frac{400 - 500}{50} = - 2$$

b.  A light bulb is considered defective if it lasts less than 400
    hours.\
    The following claim is made:

'Brand A light bulbs are more likely to be defective than Brand B light
bulbs.'

> Is this claim correct? Justify your answer, with reference to z-scores
> or standard deviations or the normal distribution. 

Brand A: $z = \frac{400 - 450}{25} = - 2$.

Both brands have $z = - 2$ for 400 hours, so equal probability of being
defective. The claim is incorrect.

9.  **2004 HSC Standard 2 Band 5**

![A diagram of a normal distribution AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image82.png){width="3.411648075240595in"
height="1.4784230096237971in"} The normal distribution shown has a mean
of 170 and a standard deviation of 10.

a.  Roberto has a raw score in the shaded region. What could his z-score
    be?

Shaded region is 180 to 190, corresponding to $z = 1$ to $z = 2$.

Any value in that range, e.g., $z = 1.5$.

b.  What percentage of the data lies in the shaded region?

Using empirical rule, $13.5\%$

10. **2014 HSC Standard 2 Band 5**

> The weights of 10 000 newborn babies in NSW are normally distributed.
> These weights have a mean of 3.1 kg and a standard deviation of 0.35
> kg. How many of these newborn babies have a weight between 2.75 kg and
> 4.15 kg?

$z_{2.75} = \frac{2.75 - 3.1}{0.35} = - 1$,
$\quad z_{4.15} = \frac{4.15 - 3.1}{0.35} = 3$

$$P( - 1 < z < 3) = 83.85\%$$

$$0.8385 \times 10\, 000 = 8385$$

11. **2023 HSC Standard 2 Band 5**

> A random variable is normally distributed with a mean of 0 and a
> standard deviation of 1. The table gives the probability that this
> random variable lies below $z$ for some positive values of $z$.

![](media/Random Variables 3_The Normal Distribution/media/image83.png){width="6.476134076990376in"
height="0.7238451443569554in"}

> The weights of adult male koalas form a normal distribution with mean
> $\mu$ = 10.40 kg, and standard deviation $\sigma$ = 1.15 kg.
>
> In 400 adult male koalas, how many would be expected to weigh more
> than 11.93 kg?

$$z = \frac{11.93 - 10.40}{1.15} = 1.33$$

z-score of 11.93 is $z = 1.33$

using the table, $P(z > 1.33) = 1 - 0.9082 = 0.0918$

expected koalas $f = np = 400 \times 0.0918$

$= 37$ koalas

12. **2015 HSC Standard 2 Band 5**

> ![A white rectangular box with black text AI-generated content may be
> incorrect.](media/Random Variables 3_The Normal Distribution/media/image84.png){width="2.948611111111111in"
> height="0.8555555555555555in"}The results of two tests are normally
> distributed. The mean and standard deviation for each test are
> displayed in the table.
>
> Kristoff scored 74 in Mathematics and 80 in English. He claims that he
> has performed better in English. Is Kristoff correct? Justify your
> answer using appropriate calculations.

Maths z-score: 0.6153...

English z-score: 0.625

He is correct.

13. **2013 HSC Standard 2 Band 5**

> Ali's class sits two Geography tests. The results of her class on the
> first Geography test are shown.
>
> ![](media/Random Variables 3_The Normal Distribution/media/image85.png){width="4.158333333333333in"
> height="0.30486111111111114in"}

a.  The mean was 68.5 for the first test. Calculate the standard
    deviation for the first test.

> Give your answer correct to one decimal place.

Using a calculator: 5.2

b.  On the second Geography test, the mean for the class was 74.4 and
    the standard deviation was 12.4. Ali scored 62 on the first test.
    Calculate the mark that she needed to obtain in the second test to
    ensure that her performance relative to the class was maintained. 

Ali's $z$-score in test 1: $z = \frac{62 - 68.5}{5.2} = - 1.25$

Test 2 mark: $x = 74.4 + ( - 1.25)(12.4) = 58.9$

14. **2019 HSC Standard 2 Band 6**

> The scores on an examination are normally distributed with a mean of
> 70 and a standard deviation of 6. Michael received a score on the
> examination between the lower quartile and the upper quartile of the
> scores.

![A diagram of a normal distribution AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image86.png){width="4.610017497812773in"
height="2.275774278215223in"}Which shaded region most accurately
represents where Michael\'s score lies?

The IQR covers the middle 50%, which is narrower than the 68% within one
standard deviation.

The shaded region must be narrower than $\pm 1\sigma$ from the mean.

Answer: A.

15. **2017 HSC Standard 2 Band 6**

![A graph with numbers and points AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image87.png){width="3.5854166666666667in"
height="2.8159722222222223in"}All the students in a class of 30 did a
test. The marks, out of 10, are shown in the dot plot.

a.  Find the median test mark

Median (average of 15th and 16th values) $= 6$

b.  The mean test mark is 5.4. The standard deviation of the test marks
    is 4.22.\
    Using the dot plot, calculate the percentage of the marks which lie
    within one standard deviation of the mean. 

One SD range: $5.4 - 4.22 = 1.18$ to $5.4 + 4.22 = 9.62$, so marks 2 to
9. Count from dot plot: 13 scores.

$$\frac{13}{30} \approx 43\%$$

c.  A student states that for any normally distributed data set, 68% of
    the scores should lie within one standard deviation of the mean
    (this is correct, as you will learn next lesson). With reference to
    the dot plot, explain why the student's statement is NOT relevant in
    this context.

The data is not normally distributed (it is bimodal), so the 68% rule
does not apply.

16. **2022 HSC Standard 2 Band 6**

> ![A number of numbers on a white background AI-generated content may
> be
> incorrect.](media/Random Variables 3_The Normal Distribution/media/image88.png){width="5.563888888888889in"
> height="1.20625in"}A random variable is normally distributed with mean
> 0 and standard deviation 1. The table gives the probability that this
> random variable lies below $z$ for some positive values of $z$.
>
> The probability values given in the table are represented by the
> shaded area in the diagram.

![](media/Random Variables 3_The Normal Distribution/media/image89.png){width="2.624874234470691in"
height="1.2347823709536307in"}

> ![A number of numbers on a white background AI-generated content may
> be
> incorrect.](media/Random Variables 3_The Normal Distribution/media/image90.png){width="0.949922353455818in"
> height="1.2411351706036746in"}What is the probability that a normally
> distributed random variable with mean 0 and standard deviation 1 lies
> between 0 and 1.94?

$$P(0 < z < 1.94) = P(z < 1.94) - 0.5$$

$= 0.9738 - 0.5 = 0.4738$.

Answer: B.

17. **2021 HSC Standard 2 Band 6**

> A random variable is normally distributed with mean 0 and standard
> deviation 1. The table gives the probability that this random variable
> lies below $z$ for some positive values of $z$.

![](media/Random Variables 3_The Normal Distribution/media/image91.png){width="5.996913823272091in"
height="0.7152777777777778in"}

> The probability values given in the table for different values
> of $z$ are represented by the shaded area in the following diagram.

![A diagram of a semicircle AI-generated content may be
incorrect.](media/Random Variables 3_The Normal Distribution/media/image92.png){width="2.7513003062117236in"
height="1.1516076115485565in"}

a.  Using the table, show that the probability that a value from a
    random variable that is normally distributed with mean 0 and
    standard deviation 1 is greater than 0.3 is equal to 0.3821. 

By symmetry, $P(z > 0) = 0.5$.

From table, $P(0 < z < 0.3) = 0.1179$.

$$P(z > 0.3) = 0.5 - 0.1179 = 0.3821$$

b.  Birth weights are normally distributed with a mean of 3300 grams and
    a standard deviation of 570 grams. By first calculating a z-score,
    find how many babies, out of 1000 born, are expected to have a birth
    weight greater than 3471 grams.

$$z = \frac{3471 - 3300}{570} = 0.3$$

$$P(z > 0.3) = 0.3821$$

$$f = 1000 \times 0.3821 = 382$$

18. **2024 HSC Standard 2 Band 6**

> A random variable is normally distributed with a mean of 0 and a
> standard deviation of 1. The table gives the probability that this
> random variable lies below $z$ for some positive values of $z$.
>
> ![](media/Random Variables 3_The Normal Distribution/media/image93.png){width="5.85082895888014in"
> height="0.7104418197725284in"}
>
> ![A diagram of a normal distribution AI-generated content may be
> incorrect.](media/Random Variables 3_The Normal Distribution/media/image89.png){width="3.321527777777778in"
> height="1.5625in"}The probability values given in the table are
> represented by the shaded area in the diagram.
>
> The scores in a university examination with a large number of
> candidates are normally distributed with mean 58 and standard
> deviation 15.

a.  By calculating a z-score, find the percentage of scores that are
    between 58 and 70.

$$z = \frac{70 - 58}{15} = 0.8$$

$$P(58 < x < 70) = P(0 < z < 0.8)$$

$$= 0.7881 - 0.5 = 0.2881 = 28.81\%$$

b.  Explain why the percentage of scores between 46 and 70 is twice your
    answer to part (a)

$46 = 58 - 12$ and $70 = 58 + 12$; both are the same distance from the
mean on opposite sides.

By symmetry of the normal distribution,
$P(46 < x < 58) = P(58 < x < 70)$,

so the percentage between 46 and 70 is double.

c.  By using the values in the table above, find an approximate minimum
    score that a candidate would need to be placed in the top 10% of the
    candidates

Top 10% requires $P(Z < z) \approx 0.90$. From the table,
$P(z < 1.3) = 0.9032 \approx 0.90$.

$$x = 58 + 1.3 \times 15 = 77.5$$
