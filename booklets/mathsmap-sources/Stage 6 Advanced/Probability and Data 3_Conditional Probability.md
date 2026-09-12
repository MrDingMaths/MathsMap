+-------------------------------------------------------------------+
| Mathematics Advanced Year 11                                      |
+===================================================================+
| **Probability &**                                                 |
|                                                                   |
| **Data**                                                          |
+-------------------------------------------------------------------+

+-------------------------+-----------------------------------+-------------------------+
| **Book 1**              | Sample Subtopic                   | Version: 251102         |
|                         |                                   |                         |
|                         |                                   | Feedback:\              |
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

**MAV-11-10** displays and analyses datasets using summary statistics
and graphical representations

**Conditional probability**

- Define conditional probability as the probability that an event $A$
  occurs given that another event $B$ has already occurred, and use the
  notation $P(A\left| B) \right.\$

- Examine conditional probability by restricting the sample space and
  event spaces in a Venn diagram, using a two-way table, a tree diagram
  and other arrays

- Establish that $P\left( A|B \right) = \frac{|A \cap B|}{|B|}$ when all
  outcomes are equally likely by restricting the sample space and event
  space, and hence $P\left( A|B \right) = \frac{P(A \cap B)}{P(B)}$,
  provided $|B| \neq 0$

- Use the formulas for $P(A|B)$ to solve practical problems involving
  conditional probability

- Define two events to be independent if the occurrence of one event
  does not affect the probability that the other event occurs

- Explain that two events $A$ and $B$ are independent means
  $P\left( A \middle| B \right) = P(A)$ and
  $P\left( B \middle| A \right) = P(B)$, and show algebraically that if
  one of these formulas is true, then the other is also true

- Use the formula $P\left( A|B \right) = \frac{P(A \cap B)}{P(B)}$, and
  the test $P\left( A \middle| B \right) = P(A)$ for independence to
  prove that if two events are independent, then
  $P(A \cap B) = P(A) \times P(B)$, and to prove conversely that if
  $P(A \cap B) = P(A) \times P(B)$, then $A$ and $B$ are independent

- Solve practical problems involving independent events

# Conditional Probability

+-------------------------------------------------------------------+
| - **Conditional Probability**                                     |
+===================================================================+
| **Conditional probability** measures how likely one event will    |
| occur when we already know another event has happened.            |
|                                                                   |
| Conditional probability only applies when two events are          |
|                                                                   |
| - **dependent** (for multistage experiments)                      |
|                                                                   |
| - **not mutually exclusive** (for compound events).               |
|                                                                   |
| Key phrases that signal conditional probability:                  |
|                                                                   |
| \"**If\... then**\" - \"If it\'s raining, then what\'s the        |
| probability of carrying an umbrella?\"                            |
|                                                                   |
| \"**Given**\" - \"Given that a student studies, what\'s the       |
| probability they pass?\"                                          |
|                                                                   |
| \"**Knowing that**\" - \"Knowing that someone is tall, what\'s    |
| the probability they play basketball?\"                           |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Conditional probability.                                                                                                                                                                                                       |
+====================================================================================================================================================================================================================================================+
| **Compound events scenario:**                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                    |
| Jenny will win a game if she rolls an odd number on a die.                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                    |
| The sample space is the possible numbers.: $S = \left\{ 1,\ 2,\ 3,\ 4,\ 5,\ 6 \right\}$                                                                                                                                                            |
|                                                                                                                                                                                                                                                    |
| The event space is the odd numbers: $A = \{ 1,\ 3,\ 5\}$                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                    |
| As she rolls the die, she closes her eyes. Someone shouts out "It's a prime number!"                                                                                                                                                               |
|                                                                                                                                                                                                                                                    |
| Prime numbers are odd numbers are n......-m.................. e.....................                                                                                                                                                               |
|                                                                                                                                                                                                                                                    |
| From this information, we can write:                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                    |
| The **reduced sample space** is prime numbers: $B = \{$ ......, ......, ...... }                                                                                                                                                                   |
|                                                                                                                                                                                                                                                    |
| The **reduced event space** is prime odd numbers: $A \cap B = \{$ ......, ...... $\}$                                                                                                                                                              |
|                                                                                                                                                                                                                                                    |
| For her, what is the probability of winning?                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                    |
| $$P(Jenny\ wins,\ given\ that\ the\ number\ is\ prime) = \frac{|reduced\ event\ space|}{|reduced\ sample\ space|}$$                                                                                                                                |
|                                                                                                                                                                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{\ }{\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ }$$ |
|                                                                                                                                                                                                                                                    |
| Illustrate this on the Venn diagram.                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                    |
| ![](media/Probability and Data 3_Conditional Probability/media/image5.png){width="1.9145297462817148in" height="1.3288713910761154in"}                                                                                                             |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Conditional Probability Formula**                                                                                                                                                                                                              |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| The probability of A, **given** B:                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                    |
| The sample space is reduced to $B$ and the event space is reduced to $A \cap B$                                                                                                                                                                    |
|                                                                                                                                                                                                                                                    |
| ![](media/Probability and Data 3_Conditional Probability/media/image6.png){width="2.08in" height="1.4421216097987752in"}                                                                                                                           |
|                                                                                                                                                                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \ P\left( A \middle| B \right) = \frac{|A \cap B|}{|B|} = \frac{P(A \cap B)}{P(B)}$$                                                                                                                                           |
|                                                                                                                                                                                                                                                    |
| - $P\left( A \middle| B \right) \neq P\left( B \middle| A \right)$ unless $P(A) = P(B)$                                                                                                                                                            |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------+
| - **Example** Apply conditional probability formula (compound events).                                                  |
+============================================================+============================================================+
| In a population, 35% of people have blond hair, 15% green eyes, and 10% have both.                                      |
|                                                                                                                         |
| ![](media/Probability and Data 3_Conditional Probability/media/image7.png){width="1.9972167541557306in"                 |
| height="1.3779527559055118in"}A person is chosen from this population at random.                                        |
+------------------------------------------------------------+------------------------------------------------------------+
| a.  Find the probability they have green eyes, given they  | b.  Find the probability that have blond hair, given they  |
|     have blond hair.                                       |     have green eyes.                                       |
|                                                            |                                                            |
| $${P\left( G \middle| B \right) = \frac{P(G \cap B)}{P(B)} | $${P\left( B \middle| G \right) = \frac{P(B \cap G)}{P(G)} |
| }{= \frac{0.1}{0.35}                                       | }{= \frac{0.1}{0.15}                                       |
| }{= \frac{2}{7}}$$                                         | }{= \frac{2}{3}}$$                                         |
+------------------------------------------------------------+------------------------------------------------------------+

+---------------------------------------------------------------------------------------------+
| - **Practice**                                                                              |
+==============================================+==============================================+
| Lara is an athlete who enters a swimming and | All 30 students in a class study either      |
| running race.\                               | history or geography. If 18 do only          |
| She has a 44% chance of winning the swimming | geography and                                |
| race and a 37% chance of winning both. Find  |                                              |
| the probability that she wins the running    | 8 do both subjects, find the probability     |
| race if she has won the swimming race.       | that a student does geography, given that    |
|                                              | the                                          |
| $$84\%$$                                     |                                              |
|                                              | student does history.                        |
|                                              |                                              |
|                                              | $$\frac{8}{12} = \frac{2}{3}$$               |
+----------------------------------------------+----------------------------------------------+
| - **Conditional Probability for Multistage Events**                                         |
+---------------------------------------------------------------------------------------------+
| The conditional probability formula also applies to multistage events.                      |
|                                                                                             |
| +----------------+----------------+----------------------------------------------------+    |
| | **Stage 1**    | **Stage 2**    | **Events**                                         |    |
| +================+================+====================================================+    |
| | $A$            | $\overline{B}$ | $$P(A \cap B)$$                                    |    |
| |                |                |                                                    |    |
| | $\overline{A}$ |                | $$P\left( A \cap \overline{B} \right)$$            |    |
| |                |                |                                                    |    |
| |                |                | $$P\left( \overline{A} \cap B \right)$$            |    |
| |                |                |                                                    |    |
| |                |                | $$P\left( \overline{A} \cap \overline{B} \right)$$ |    |
| +----------------+----------------+----------------------------------------------------+    |
|                                                                                             |
| - For $P\left( B \middle| A \right)$, $A$ is the first event.                               |
|                                                                                             |
| - Remember that for multistage events, order matters:                                       |
|                                                                                             |
| - $P(A \cap B) \neq P(B \cap A)$                                                            |
|                                                                                             |
| - $P\left( A \middle| B \right) \neq P\left( B \middle| A \right)$                          |
+---------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------+
| - **Interpret** conditional probability scenario.                                                         |
+===========================================================================================================+
| For each scenario, identify the first event, and the probabilities that are given.                        |
|                                                                                                           |
| Then find the missing probabilities by filling in the tree diagram.                                       |
+-----------------------------------------------------------------------------------------------------------+
| a.  A weather forecast shows there\'s a 35% chance of rain tomorrow.\                                     |
|     When it rains, Sarah takes the bus 90% of the time.\                                                  |
|     When it doesn\'t rain, she takes the bus only 25% of the time.                                        |
|                                                                                                           |
| +----------------+----------------+------------------------------------------------------+--------------+ |
| | $R$            | $B$            | $$P(R \cap B) =$$                                    | $P(Bus) =$   | |
| |                |                |                                                      |              | |
| | $\overline{R}$ | $\overline{B}$ | $$P\left( R \cap \overline{B} \right) =$$            |              | |
| |                |                |                                                      |              | |
| |                | $B$            | $$P\left( \overline{R} \cap B \right) =$$            |              | |
| |                |                |                                                      |              | |
| |                | $\overline{B}$ | $$P\left( \overline{R} \cap \overline{B} \right) =$$ |              | |
| +================+================+======================================================+==============+ |
+-----------------------------------------------------------------------------------------------------------+
| b.  In a school, 60% of students study regularly.\                                                        |
|     Among students who study regularly, 15% still fail their exams.\                                      |
|     Among students who don\'t study regularly, 40% will pass their exams.                                 |
|                                                                                                           |
|   -----------------------------------------------------                                                   |
|                                          $P(Pass) =$                                                      |
|   ----------- ----------- -------------- --------------                                                   |
|                                                                                                           |
|   -----------------------------------------------------                                                   |
+-----------------------------------------------------------------------------------------------------------+
| - **Conditional Probability for Multistage Events**                                                       |
+-----------------------------------------------------------------------------------------------------------+
| 1\. Read scenario and identify the probabilities given.\                                                  |
| Carefully determine which is the first event.                                                             |
|                                                                                                           |
| 2\. Set up tree diagram with given probabilities.                                                         |
|                                                                                                           |
| 3\. Find missing probabilities.                                                                           |
|                                                                                                           |
| 4\. Use formula $P\left( A \middle| B \right) =$ $\frac{P(A \cap B)}{P(B)}$ to answer question.           |
+-----------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Apply conditional probability formula (multistage events)                                                            |
+====================================================================================================================================+
| The probability of the zoo having an animal born on a day is 40%.                                                                  |
|                                                                                                                                    |
| The zoo publishes an article 80% of the time when there is a birth of a baby animal.                                               |
|                                                                                                                                    |
| When there is no birth, there is a 30% probability the zoo will publish an article.                                                |
|                                                                                                                                    |
| Find the probability that a baby animal was born given that an article was published.                                              |
|                                                                                                                                    |
| 1\. $40\% = P(B)$ $80\% = P\left( A \middle| B \right)$ $30\% = P\left( A \middle| \overline{B} \right)$                           |
|                                                                                                                                    |
| 2\.                                                                                                                                |
|                                                                                                                                    |
| +----------------+----------------+------------------------------------------------------+                                         |
| | **Baby**       | **Article**    | **Events**                                           |                                         |
| +================+================+======================================================+                                         |
| | $B$            | $A$            | $$P(B \cap A) =$$                                    |                                         |
| |                |                |                                                      |                                         |
| | $\overline{B}$ | $\overline{A}$ | $$P\left( B \cap \overline{A} \right) =$$            |                                         |
| |                |                |                                                      |                                         |
| |                | $A$            | $$P\left( \overline{B} \cap A \right) =$$            |                                         |
| |                |                |                                                      |                                         |
| |                | $\overline{A}$ | $$P\left( \overline{B} \cap \overline{A} \right) =$$ |                                         |
| +----------------+----------------+------------------------------------------------------+                                         |
|                                                                                                                                    |
| +----------------+----------------+-----------------------------------------------------------+                                    |
| | **Baby**       | **Article**    | **Events**                                                |                                    |
| +================+================+===========================================================+                                    |
| | $\overline{B}$ | $A$            | $$P(B \cap A) = 0.32$$                                    |                                    |
| |                |                |                                                           |                                    |
| |                | $\overline{A}$ | $$P\left( B \cap \overline{A} \right) = 0.08$$            |                                    |
| |                |                |                                                           |                                    |
| |                | $A$            | $$P\left( \overline{B} \cap A \right) = 0.18$$            |                                    |
| |                |                |                                                           |                                    |
| |                | $\overline{A}$ | $$P\left( \overline{B} \cap \overline{A} \right) = 0.42$$ |                                    |
| +----------------+----------------+-----------------------------------------------------------+                                    |
|                                                                                                                                    |
| 4\.                                                                                                                                |
|                                                                                                                                    |
| $${P\left( B \middle| A \right) = \frac{P(B \cap A)}{P(A)} = \frac{P(B \cap A)}{P(B \cap A) + P\left( \overline{B} \cap A \right)} |
| }{= \frac{0.32}{0.32 + 0.18} = 0.64}$$                                                                                             |
+------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                     |
+------------------------------------------------------------------------------------------------------------------------------------+
| The probability that a patient arriving at the hospital has a serious condition is 25%.                                            |
|                                                                                                                                    |
| When a patient has a serious condition, the hospital orders additional tests 90% of the time.                                      |
|                                                                                                                                    |
| When a patient does not have a serious condition, the hospital still orders additional tests 15% of the time.                      |
|                                                                                                                                    |
| Find the probability that a patient has a serious condition given that additional tests were ordered.                              |
|                                                                                                                                    |
| $$\frac{2}{3}$$                                                                                                                    |
+------------------------------------------------------------------------------------------------------------------------------------+
| A factory produces items where 12% are defective.\                                                                                 |
| Non-defective items pass the quality check 92% of the time.                                                                        |
|                                                                                                                                    |
| Defective items fail the quality check 85% of the time.\                                                                           |
| Find the probability that an item is defective given that it failed the quality check.                                             |
|                                                                                                                                    |
| $$\approx 59.2\%$$                                                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Identify** conditional probability for independent and        |
|   mutually exclusive events.                                      |
+===================================================================+
| **Multistage independent events**                                 |
|                                                                   |
| a.  Two coins are flipped one after the other.                    |
|                                                                   |
| What is the probability that the second coin is heads, given the  |
| first is tails?                                                   |
|                                                                   |
| b.  Two dice are rolled one after the other.                      |
|                                                                   |
| What is the probability that the second dice shows a 4, given the |
| first dice showed an odd number?                                  |
|                                                                   |
| c.  Complete the sentence: For multistage .....................   |
|     events, $P\left( A \middle| B \right) =$                      |
|                                                                   |
| **Mutually exclusive events**                                     |
|                                                                   |
| d.  A die is rolled.\                                             |
|     What is the probability that it shows a 4, given that an odd  |
|     number was rolled?                                            |
|                                                                   |
| e.  A letter from the 26 in the alphabet is picked out of a hat.\ |
|     What is the probability that it is a vowel, given that it is  |
|     a consonant?                                                  |
|                                                                   |
| f.  Complete the sentence: For .....................              |
|     ..................... events,                                 |
|     $P\left( A \middle| B \right) =$                              |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------+
| - **Conditional Probability for Independent/Mutually Exclusive Events**                                                                       |
+:=====================================================================:+:=====================================================================:+
| multistage **independent** events                                     | **mutually exclusive** events                                         |
+-----------------------------------------------------------------------+-----------------------------------------------------------------------+
| $$P(A \cap B) = P(A) \times P(B)$$                                    | $$P(A \cap B) = 0$$                                                   |
|                                                                       |                                                                       |
| $${\therefore P\left( A \middle| B \right) = \frac{P(A \cap B)}{P(B)} | $${\therefore P\left( A \middle| B \right) = \frac{P(A \cap B)}{P(B)} |
| }{= \frac{P(A) \times P(B)}{P(B)}                                     | }{= 0}$$                                                              |
| }{= P(A)}$$                                                           |                                                                       |
|                                                                       | If B has occurred, A cannot happen at the same time.                  |
| Knowing B happened doesn\'t change A\'s probability.                  |                                                                       |
|                                                                       | Similarly,                                                            |
| Similarly,                                                            |                                                                       |
|                                                                       | $$P\left( B \middle| A \right) = 0$$                                  |
| $$P\left( B \middle| A \right) = P(B)$$                               |                                                                       |
+-----------------------------------------------------------------------+-----------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------+
| - **Example** Determine whether multistage events are independent.                                                      |
+==============================================+==========================================================================+
| $P(X) = \ 0.2,\ \ P(X \cap \ Y) = \ 0.06\ ,$ | $$P(C) = \frac{1}{9},\ P(C \cap A) = \frac{1}{18},\ P(A) = \frac{1}{2}$$ |
| $P(Y) = 0.6$                                 |                                                                          |
|                                              | Determine whether $C$ and $A$ are independent.                           |
| Determine whether $X$ and $Y$ are            |                                                                          |
| independent.                                 | $${P(C) \times P(A) = \frac{1}{9} \times \frac{1}{2}                     |
|                                              | }{= \frac{1}{18}                                                         |
| $${P(X) \times P(Y) = 0.2 \times 0.6         | }{= P(C \cap A)}$$                                                       |
| }{= 0.12                                     |                                                                          |
| }{\neq P(X \cap Y)}$$                        | $\therefore$ independent                                                 |
|                                              |                                                                          |
| $\therefore$ not independent                 |                                                                          |
+----------------------------------------------+--------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                              |
+==================================================+==========================================================================+
| $P(X) = \ 0.2,\ \ P(X\  \cap \ Y\ ) = \ 0.06\ ,$ | $$P(B) = \frac{1}{2},\ P(B \cap C) = \frac{1}{12},\ P(C) = \frac{1}{9}$$ |
| $P(Y) = 0.3$                                     |                                                                          |
|                                                  | Determine whether $B$ and $C$ are independent.                           |
| Determine whether $X$ and $Y$ are independent    |                                                                          |
|                                                  | Not independent                                                          |
| Independent                                      |                                                                          |
+--------------------------------------------------+--------------------------------------------------------------------------+

Foundation

Read the question carefully to identify whether to use a Venn diagram or
a Tree diagram.\
It is also possible to use the formulas and multiplication rule to solve
many of these questions.

1.  In a particular class, 20 students study history, 15 study chemistry
    and 5 study both.

A student is chosen randomly.

What is the probability that they study chemistry, given that they study
history?

$$P\left( C \middle| H \right) = \frac{|H \cap C|}{|H|} = \frac{5}{20} = \frac{1}{4}$$

2.  Amy buys 4 tickets in a raffle in which 50 tickets are sold. The
    tickets are drawn for first and second prizes. What is the
    probability that Amy winning

    a.  first prize?

    b.  second prize, given that she wins first prize?

    c.  second prize, given that she does not win first prize?

$$P(first\ prize) = \frac{4}{50} = \frac{2}{25}$$

$$P\left( second \middle| first \right) = \frac{3}{49}(3\ tickets\ left\ out\ of\ 49)$$

$$P\left( second \middle| not\ first \right) = \frac{4}{49}(4\ tickets\ left\ out\ of\ 49)$$

3.  Two dice are rolled. Find the probability of rolling:

    a.  a double six if the first die was a six.

    b.  a total of 8 or more if the first die was a 3.

$$a)\frac{1}{6},\ the\ two\ events\ are\ independent.$$

$$b)\ Need\ 5\ or\ 6\ on\ the\ second\ die,\frac{2}{6} = \frac{1}{3}$$

4.  A team has a probability of 52% of winning its first season and a
    39% chance of winning both seasons 1 and 2. What is the probability
    of the team winning the second season given that it wins the first
    season?

$$P\left( second \middle| first \right) = \frac{P(both)}{P(first)} = \frac{0.39}{0.52} = \frac{3}{4}$$

5.  A missile has a probability of 0.75 of hitting a target. It has a
    probability of 0.65 of hitting two targets in a row. What is the
    probability that the missile will hit the second target given that
    it has hit the first target?

$$P\left( second\ hit \middle| first\ hit \right) = \frac{P(both\ hits)}{P(first\ hit)} = \frac{0.65}{0.75} = \frac{13}{15}$$

6.  Danuta has an 80% probability of passing her first English
    assessment and she has a 45% probability of passing both the first
    and second assessments. Find the probability that Danuta will pass
    the second assessment given that she passes the first one.

$$P\left( second\ pass \middle| first\ pass \right) = \frac{P(both\ pass)}{P(first\ pass)} = \frac{0.45}{0.80} = \frac{9}{16}$$

7.  A group of 10 friends all prepared to go out in the sun by putting
    on either sunscreen or a hat.\
    If 5 put on only sunscreen and 3 put on both sunscreen and a hat,
    find the probability that a friend who:

    a.  put on sunscreen also put on a hat

    b.  put on a hat didn\'t put on sunscreen.

$$P\left( H \middle| S \right) = \frac{P(H \cap S)}{P(S)} = \frac{3}{8}$$

$$P\left( S' \middle| H \right) = \frac{P\left( S' \cap H \right)}{P(H)} = \frac{2}{5}:Note:S' \cap H\ means\ hat\ only.$$

8.  A container holds 20 cards numbered 1 to 20. Two cards are selected
    at random.\
    Find the probability that the second card is:

    a.  an odd number given that the first card was a 7

    b.  a number less than 5 given that the first card was a 12

    c.  a number divisible by 3 if the first number was 6.

$$a)\ After\ removing\ 7,\ 19\ cards\ left,\ 9\ odd:\ P\  = \frac{9}{19}$$

$$b)\ After\ removing\ 12,\ 19\ cards\ left,\ 4\ less\ than\ 5:\ P\  = \frac{4}{19}$$

$$c)\ After\ removing\ 6,\ 19\ cards\ left,\ 5\ divisible\ by\ 3:\ P\  = \frac{5}{19}$$

9.  A group of 12 people met at a café for lunch.\
    If 9 people had a pie and 7 had chips, find the probability that one
    of the people:

    a.  had chips, given that this person had a pie

    b.  did not have a pie given that the person had chips.

A Venn diagram is useful here

$$|pie\  \cap \ chips|\  = \ 9\  + \ 7\  - \ 12\  = \ 4$$

$$a)\ P\left( chips \middle| pie \right) = \frac{4}{9}$$

$$b)\ P\left( no\ pie \middle| chips \right) = \frac{3}{7}$$

Development

10. A tennis team has a probability of 76% of winning a match when they
    are at home and 45% of winning a match when they are away. If the
    team plays 58% of their matches away, find the probability that the
    team:

    a.  wins their match given that they are away

    b.  are at home given that they win a match

    c.  are away given that they lose a match.

A tree diagram is useful here.

$$a)\ P(win|away)\  = \ 45\%\ (given)$$

$$b)\ P\left( home \middle| win \right) = \frac{P(home\  \cap \ win)}{P(win)} = \frac{(0.42)(0.76)}{0.58} = \ 55\%$$

$$c)\ P\left( away \middle| lose \right) = \frac{P(away\  \cap \ lose)}{P(lose)} = \frac{(0.58)(0.55)}{0.42} = \ 76\%$$

11. Use the formula P(A\|B) = $\frac{P(A \cap B)}{P(B)}$ to answer the
    following questions.

    a.  Find P(A\|B) if P(A∩B) = 0.5 and P(B) = 0.7.

$$P\left( A \middle| B \right) = \frac{P(A \cap B)}{P(B)} = \frac{0.5}{0.7} = \frac{5}{7}$$

b.  Find P(A\|B) if P(A∩B) = 0.15 and P(B) = 0.4.

$$P\left( A \middle| B \right) = \frac{P(A \cap B)}{P(B)} = \frac{0.15}{0.4} = \frac{3}{8}$$

c.  Find P(E\|F) if P(E∩F) = 0.8 and P(F) = 0.95.

$$P\left( E \middle| F \right) = \frac{P(E \cap F)}{P(F)} = \frac{0.8}{0.95} = \frac{16}{19}$$

12. The two events A and B in the following experiments are known to be
    independent.

    a.  P(A) = 0.4 and P(B) = 0.6. Find P(A∩B).

$$P(A \cap B) = \ P(A) \times \ P(B) = \ 0.4\  \times \ 0.6\  = \ 0.24$$

b.  P(A) = 0.3 and P(B) = 0.5. Find P(A∩B).

$$P(A \cap B) = \ P(A) \times \ P(B) = \ 0.3\  \times \ 0.5\  = \ 0.15$$

c.  P(A) = 0.4 and P(B) = 0.6. Find P(A\|B).

Since A and B are independent: P(A\|B) = P(A) = 0.4

d.  P(A) = 0.7 and P(B) = 0.2. Find P(A\|B).

Since A and B are independent: P(A\|B) = P(A) = 0.7

13. Each of the following experiments involves two events, A and B.\
    State in each case whether they are dependent or independent.

    a.  P(A\|B) = 0.5 and P(A) = 0.4 and P(B) = 0.5

Check: P(A\|B) = P(A)

0.5 ≠ 0.4 ∴ dependent

b.  P(A\|B) = 0.3 and P(A) = 0.3 and P(B) = 0.6

Check: P(A\|B) = P(A)

0.3 = 0.3 ∴ independent

c.  P(A\|B) = $\frac{3}{4}$ and P(A) = $\frac{2}{5}$ and P(B) =
    $\frac{3}{10}$

Check: P(A\|B) = P(A)

$$\frac{3}{4} \neq \frac{2}{5}\therefore\ dependent$$

d.  P(A) = 0.3 and P(B) = 0.7 and P(A∩B) = 0.21

Check: P(A∩B) = P(A) × P(B)

0.21 = 0.3 × 0.7 = 021 ∴ independent

e.  P(A) = 0.2 and P(B) = 0.4 and P(A∩B) = 0.8

This is impossible as the intersection of two sets cannot be larger than
either set.

f.  P(A) = $\frac{1}{2}$ and P(B) = $\frac{2}{3}$ and P(A∩B) =
    $\frac{1}{3}$

Check: P(A∩B) = P(A) × P(B)?

$$\frac{1}{3} = \frac{1}{2} \times \frac{2}{3} = \frac{1}{3}\therefore\ independent$$

14. a.  ![A grid of numbers with black text AI-generated content may be
        incorrect.](media/Probability and Data 3_Conditional Probability/media/image8.png){width="2.3096883202099736in"
        height="1.7770275590551181in"}Draw a table showing the sample
        space if two dice are thrown in turn and their sum is recorded.

    b.  Highlight the reduced sample space if the sum of the two dice is
        5.

The cases 1 + 4, 2 + 3, and 4 + 1 make up the reduced sample space

c.  Given that the sum of the two dice is 5, what is the probability
    that:

    i.  the first die shows a 1,

$$only\ (1,4):\ \frac{1}{3}$$

ii. at least one die shows a 1,

$$(1,4)and\ (4,1):\ \frac{1}{2}$$

iii. at least one of the dice shows an odd number.

All outcomes in the reduced sample space have a odd number. $1$

15. For two events A and B it is known that P(A∪B) = 0.6 and P(A) = 0.4
    and P(B) = 0.3.

    a.  Use the addition formula P(A∪B) = P(A) + P(B) - P(A∩B) to find
        the probability\
        P(A∩B).

$$0.6\  = \ 0.4\  + \ 0.3\  - \ P(A \cap B)$$

$$P(A \cap B) = \ 0.7\  - \ 0.6\  = \ 0.1$$

b.  Use the formula for conditional probability to find P(A\|B).

$$P\left( A \middle| B \right) = \frac{P(A \cap B)}{P(B)} = \frac{0.1}{0.3} = \frac{1}{3}$$

c.  Find P(B\|A).

$$P\left( B \middle| A \right) = \frac{P(A \cap B)}{P(A)} = \frac{0.1}{0.4} = \frac{1}{4}$$

16. a.  Suppose that P(V∪W) = 0.7 and P(V) = 0.5 and P(W) = 0.35. Find
        P(V\|W).

P(V∪W) = P(V) + P(W) - P(V∩W)

0.7 = 0.5 + 0.35 - P(V∩W)

P(V∩W) = 0.85 - 0.7 = 0.15

$$P\left( V \middle| W \right) = \frac{P(V \cap W)}{P(W)} = \frac{0.15}{0.35} = \frac{3}{7}$$

b.  Find P(X\|Y) if P(X∩Y) = 0.2 and P(X) = 0.3 and P(Y) = 0.4.

$$P\left( X \middle| Y \right) = \frac{P(X \cap Y)}{P(Y)} = \frac{0.2}{0.4} = \frac{1}{2}$$

c.  Find P(A\|B) if P(A∪B) = $\frac{1}{3}$ and P(A) = $\frac{1}{5}$ and
    P(B) = $\frac{3}{10}$.

$$P(A \cup B)\  = \ P(A)\  + \ P(B)\  - \ P(A \cap B)$$

$$\frac{1}{3} = \frac{1}{5} + \frac{3}{10} - \ P(A \cap B)$$

$$P(A \cap B) = \frac{1}{6}$$

$$P\left( A \middle| B \right) = \frac{P(A \cap B)}{P(B)} = \frac{\frac{1}{6}}{\frac{3}{10}} = \frac{5}{9}$$

17. A cricket team knows that in half of the games they played last
    season, they won the game and their star player Arnav was playing.
    Arnav consistently plays in 80% of the games.\
    What is the probability that they will win this Saturday if Arnav is
    playing?

Find: P(W\|A)

Let W = win, A = Arnav plays

Given: P(W∩A) = 0.5, P(A) = 0.8

$$P\left( W \middle| A \right) = \frac{P(W \cap A)}{P(A)} = \frac{0.5}{0.8} = 62.5\%$$

18. A card is drawn from a standard pack.\
    The dealer tells the players that it is a court card (jack, queen or
    king).

    a.  What is the probability that it is a jack?

4 jacks, 12 court cards

$$P\left( J \middle| C \right) = \frac{4}{12} = \frac{1}{3}$$

b.  What is the probability that it is either a jack or a red card?

P(J $\cup$ R \| C)

Jack or red court cards: 2 black jacks + 6 red court cards = 8

$$P\  = \frac{8}{12} = \frac{2}{3}$$

c.  What is the probability that the next card drawn is a jack?\
    Assume that the first card was not replaced.

P(next card is jack \| first was court card, not replaced)

Cards remaining: 51

If first card was jack: 3 jacks left

If first card was queen/king: 4 jacks left

P(first was jack \| court) = 1/3

P(first was queen/king \| court) = 2/3

P = (1/3)(3/51) + (2/3)(4/51) = 3/153 + 8/153 = 11/153

19. A set of four cards contains two jacks, a queen and a king. Bob
    selects one card and then, without replacing it, selects another.
    Find the probability that:

    a.  both Bob\'s cards are jacks,

P(both jacks) = (2/4) × (1/3) = 2/12 = 1/6

b.  at least one of Bob\'s cards is a jack,

P(at least one jack) = 1 - P(no jacks)

P(no jacks) = (2/4) × (1/3) = 2/12 = 1/6

P(at least one jack) = 1 - 1/6 = 5/6

c.  given that one of Bob\'s cards is a jack, the other one is also a
    jack.

P(both jacks \| at least one jack) = P(both jacks)/P(at least one jack)
= (1/6)/(5/6) = 1/5

20. A small committee of two is formed from a group of 4 boys and 8
    girls.\
    If at least one of the members is a girl, what is the probability
    that both are girls?

A probability tree is useful here.

$$\frac{7}{15}$$

Mastery

21. **2010 HSC Advanced Band 5**

Events A and B are mutually exclusive events of a sample space with P(A)
= p and P(B) = q where 0 \< p \< 1 and 0 \< q \< 1. P(A\' ∩ B\') is
equal to:

![A grey rectangular object with white circles and black text
AI-generated content may be
incorrect.](media/Probability and Data 3_Conditional Probability/media/image9.png){width="1.7743503937007874in"
height="1.1811023622047243in"}![A math equations with numbers and
symbols AI-generated content may be
incorrect.](media/Probability and Data 3_Conditional Probability/media/image10.png){width="1.648147419072616in"
height="1.2587128171478565in"}

$$P(A' \cap B')\  = \ 1\  - \ P(A \cup B)\  = \ 1\  - \ \left\lbrack P(A) + \ P(B) \right\rbrack\ $$

$$= \ 1\  - \ (p\  + \ q)$$

$$C$$

22. **2013 VCE Band 5**

A and B are events of a sample space.

Given that $P(A|B)\  = \ p$, $P(B)\  = \ p²$ and $P(A) = \sqrt[3]{p},$
$P(B|A)$ is equal to

![A math equations with letters AI-generated content may be
incorrect.](media/Probability and Data 3_Conditional Probability/media/image11.png){width="0.5511811023622047in"
height="1.3779527559055118in"}

$$P\left( A \middle| B \right) = \frac{P(A \cap B)}{P(B)}$$

$$p\  = \frac{P(A \cap B)}{p^{2}}$$

$$P(A \cap B)\  = \ p^{3}$$

$$P\left( B \middle| A \right) = \frac{P(A \cap B)}{P(A)} = \frac{p^{3}}{p^{\frac{1}{3}}} = \ p^{3 - \frac{1}{3}} = \ p^{\frac{8}{3}}$$

D

23. **2020 HSC Advanced Band 5**

![A diagram of a diagram of a history and geography AI-generated content
may be
incorrect.](media/Probability and Data 3_Conditional Probability/media/image12.png){width="1.8205129046369204in"
height="1.223986220472441in"}History and Geography are two subjects
students may decide to study.\
For a group of 40 students:

7 students study neither History nor Geography

20 students study History

18 students study Geography

a.  Find the probability that the student studies both History and
    Geography.

$$\frac{5}{40} = \frac{1}{8}$$

b.  Given that the student studies Geography, what is the probability
    that the student does NOT study History?

$$P\left( \bar{H} \middle| G \right) = \frac{P\left( \bar{H} \cap G \right)}{P(G)} = \frac{13}{18}$$

c.  Two different students are chosen at random, one after the other.
    What is the probability that the first student studies History and
    the second student does NOT study History?

$$P\left( H,\ \bar{H} \right) = \ P(first\ studies\ H) \times \ P\left( second\ doesn't\ study\ H \right)$$

$$= \ \left( \frac{20}{40} \right) \times \ \left( \frac{20}{39} \right) = \frac{10}{39}$$

24. **2009 VCE Band 5**

Four identical balls are numbered 1, 2, 3 and 4 and put into a box. A
ball is randomly drawn from the box, and not returned to the box. A
second ball is then randomly drawn from the box.

a.  What is the probability that the first ball drawn is numbered 4 and
    the second ball drawn is numbered 1?

$$P(4,1) = \ \left( \frac{1}{4} \right) \times \ \left( \frac{1}{3} \right) = \frac{1}{12}$$

b.  What is the probability that the sum of the numbers on the two balls
    is 5?

$$P(Sum\  = \ 5)$$

$$Favorable\ outcomes:\ (1,4),\ (2,3),\ (3,2),\ (4,1)$$

$$P\  = \frac{4}{12} = \frac{1}{3}$$

c.  Given that the sum of the numbers on the two balls is 5, what is the
    probability that the second ball drawn is numbered 1?

$$P(2nd\  = \ 1\ |\ Sum\  = \ 5)$$

$$Only\ (4,1)\ gives\ sum\  = \ 5\ with\ second\ ball\  = \ 1$$

$$P\  = \frac{P(4,1)}{P(Sum\  = \ 5)} = \frac{\frac{1}{12}}{\frac{1}{3}} = \frac{1}{4}$$

25. **2022 HSC Advanced Band 5**

In a bag there are 3 six-sided dice. Two of the dice have faces marked
1, 2, 3, 4, 5, 6.\
The other is a special die with faces marked 1, 2, 3, 5, 5, 5.

One die is randomly selected and tossed.

a.  What is the probability that the die shows a 5?

b.  Given that the die shows a 5, what is the probability that it is the
    special die?

A probability tree is useful here.

$$P(5) = \ \left( \frac{1}{3} \right)\left( \frac{1}{6} \right) + \ \left( \frac{1}{3} \right)\left( \frac{1}{6} \right) + \ \left( \frac{1}{3} \right)\left( \frac{3}{6} \right)$$

$$= \frac{5}{18}$$

$$P(special\ |\ 5\ shown) = \frac{P(special\  \cap \ 5)}{P(5)} = \frac{\frac{1}{3} \times \frac{1}{2}}{\frac{5}{18}} = \ \frac{3}{5}$$

26. **2017 VCE Band 5**

For events A and B from a sample space, P(A\|B) = $\frac{1}{5}$ and
P(B\|A) = $\frac{1}{4}$. Let P(A∩B) = $p$.

a.  Find P(A) in terms of $p$.

$$P(A) = \frac{P(A \cap B)}{P\left( B \middle| A \right)} = \frac{p}{\frac{1}{4}} = \ 4p$$

b.  Find P(A\'∩B\') in terms of $p$.

![A diagram of circles with numbers and a number AI-generated content
may be
incorrect.](media/Probability and Data 3_Conditional Probability/media/image13.png){width="1.691175634295713in"
height="1.092904636920385in"}

Using Venn diagram,

$$P\left( A' \cap B' \right) = \ 1 - 8p$$

c.  Given that $P(A \cup B) \leq$ $\frac{1}{5}$, state the largest
    possible interval for $p$.

$$P(A \cup B) = \ 8p\  \leq \frac{1}{5}$$

$$\therefore\ 0\  < \ p\  \leq \frac{1}{40}$$

27. **2024 VCE Band 5**

At a Year 12 formal, 45% of the students travelled to the event in a
hired limousine, while the remaining 55% were driven to the event by a
parent.

Of the students who travelled in a hired limousine, 30% had a
professional photo taken.

Of the students who were driven by a parent, 60% had a professional
photo taken.

Given that a student had a professional photo taken, what is the
probability that the student travelled to the event in a hired
limousine?

![A diagram of a tree AI-generated content may be
incorrect.](media/Probability and Data 3_Conditional Probability/media/image14.png){width="2.351851487314086in"
height="2.482241907261592in"}

$$\Pr\left( Limo \middle| PP \right) = \frac{\Pr(Limo\  \cap \ PP)}{\Pr(PP)}$$

$$= \frac{0.45\  \times \ 0.30}{\left\lbrack (0.45\  \times \ 0.30) + \ (0.55\  \times \ 0.60) \right\rbrack}$$

$$= \frac{9}{31}$$

28. **2023 HSC Advanced Band 6**

Four Year 12 students want to organise a graduation party.\
All four students have the same probability, P(F), of being available
next Friday.\
All four students have the same probability, P(S), of being available
next Saturday.

It is given that P(F) = $\frac{3}{10}$, P(S\|F) = $\frac{1}{3}$, and
P(F\|S) = $\frac{1}{8}$.

Kim is one of the four students.

a.  Is Kim\'s availability next Friday independent from his availability
    next Saturday?\
    Justify your answer.

b.  Show that the probability that Kim is available next Saturday is
    4/5.

c.  What is the probability that at least one of the four students is
    NOT available next Saturday?

a\) For independence: P(F) = P(F\|S)

$$\frac{3}{10} \neq \frac{1}{8}$$

∴ Not independent

$$b)\ P\left( S \middle| F \right) = \frac{P(S \cap F)}{P(F)}$$

$$\frac{1}{3} = \frac{P(S \cap F)}{\frac{3}{10}}$$

$$P(S \cap F) = \frac{1}{10}$$

$$P\left( F \middle| S \right) = \frac{P(S \cap F)}{P(S)}$$

$$\frac{1}{8} = \frac{\frac{1}{10}}{P(S)}$$

$$P(S) = \ \left( \frac{1}{10} \right) \times \ 8\  = \frac{4}{5}$$

c\) P(at least 1 not available) = 1 - P(all 4 available)

$$= \ 1\  - \ \left( \frac{4}{5} \right)^{4} = \ 1\  - \frac{256}{625}$$

$$= \frac{369}{625}$$

29. ![](media/Probability and Data 3_Conditional Probability/media/image15.png){width="1.6006966316710411in"
    height="1.108801399825022in"}The two events $A$ and $B$ are known to
    be independent.\
    Find the value of $x$ by setting up and solving the equation:

+------------------------------------------------------------------+-------------------------------------------+
| a.  $P(A) \times P(B) = P(A \cap B)$                             | b.  $P\left( A \middle| B \right) = P(A)$ |
|                                                                  |                                           |
| $$\frac{12}{14 + x} \times \frac{3}{14 + x} = \frac{1}{14 + x}$$ | $$\frac{1}{3} = \frac{12}{14 + x}$$       |
|                                                                  |                                           |
| $$\therefore x = 22$$                                            | $$\therefore x = 22$$                     |
+==================================================================+===========================================+
