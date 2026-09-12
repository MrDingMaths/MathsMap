+-------------------------------------------------------------------+
| Mathematics Advanced Year 11                                      |
+===================================================================+
| **Probability &**                                                 |
|                                                                   |
| **Data**                                                          |
+-------------------------------------------------------------------+

+-------------------------+-----------------------------------+-------------------------+
| **Book 2**              | Probability                       | Version: 251102         |
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

**Probability**

- Define an experiment or a trial to be any procedure that can be
  infinitely repeated and has a well-defined set of possible outcomes
  known as the sample space, denoted $S$

- Identify an event $A$ as a subset $A$ of the sample space $S$

- Define the probability of each outcome to be $\frac{1}{|S|}$ when all
  the outcomes are equally likely and the probability of the event $A$
  to be $P(A) = \frac{|A|}{|S|}$

- Interpret the notation $\overline{A}$ to be the event '$A$ does not
  occur', interpret $A \cap B$ to be the event '$A$ and $B$ both occur',
  and interpret $A \cup B$ to be the event '$A$ or $B$ occurs'

- Use Venn diagrams to represent the relationship between events within
  the same sample space, including mutually exclusive events, that is,
  events that as subsets of the sample space are disjoint

- Establish and use the rules $P\left( \overline{A} \right) = 1 - P(A)$
  and $P(A \cup B) = P(A) + P(B) - P(A \cap B)$

- Use arrays and tree diagrams to determine the outcomes and
  probabilities for multistage events

# Probability using Set Notation

+-------------------------------------------------------------------+
| - **Experiments and Sample Space**                                |
+===================================================================+
| An **experiment** in probability is any activity that produces    |
| results called **outcomes**.                                      |
|                                                                   |
| Each time we repeat an experiment, we call it a **trial**.        |
|                                                                   |
| We cannot predict the exact result beforehand. This uncertainty   |
| is called **randomness**.                                         |
|                                                                   |
| The **sample space** $\mathbf{S}$ is the set of all possible      |
| outcomes for an experiment, without repeats.                      |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** list the sample space of an experiment.                                                                                                                                     |
+=============================================================================================+=============================================================================================+
| ![](media/Probability and Data 2_Probability/media/image1.png){width="0.7868055555555555in" | ![](media/Probability and Data 2_Probability/media/image2.png){width="1.1729166666666666in" |
| height="0.7868055555555555in"}A coin is flipped.                                            | height="1.1416666666666666in"}Consider the spinner.                                         |
|                                                                                             |                                                                                             |
| a.  List all the outcomes.                                                                  | a.  List all the outcomes.                                                                  |
|                                                                                             |                                                                                             |
| $Heads,\ Tails$                                                                             | $G,\ G,\ G,\ B,\ B,\ R$                                                                     |
|                                                                                             |                                                                                             |
| b.  List the sample space.                                                                  | b.  List the sample space.                                                                  |
|                                                                                             |                                                                                             |
| $S = \{ Heads,Tails\}$                                                                      | $S = \{ G,\ B,\ R\}$                                                                        |
|                                                                                             |                                                                                             |
| c.  Is each outcome equally likely? Yes.                                                    | c.  Is each outcome equally likely? No.                                                     |
+---------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| A standard 6-sided die is rolled. | A jar contains 2 red, 3 yellow,   |
|                                   | and 4 blue lollies. One is picked |
| a.  List the outcomes             | out at random.                    |
|                                   |                                   |
| 1, 2, 3, 4, 5, 6                  | a.  List the outcomes.            |
|                                   |                                   |
| b.  List the sample space.        | R ,R, Y, Y, Y, B, B, B, B         |
|                                   |                                   |
| {1, 2, 3, 4, 5, 6}                | b.  List the sample space.        |
|                                   |                                   |
| c.  Is each number equally        | {R, Y, B}                         |
|     likely?                       |                                   |
|                                   | c.  Is each colour equally        |
| Yes                               |     likely?                       |
|                                   |                                   |
|                                   | No                                |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  An outcome is a possible ..................... of a chance    |
|     experiment.                                                   |
|                                                                   |
| 2.  The sample space lists ............ possible outcomes,        |
|     without repeats.                                              |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Events**                                                      |
+===================================================================+
| An **event** is a collection of outcomes.                         |
|                                                                   |
| An event $E$ is a subset of the sample space $S$.                 |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Probability of an Event**                                     |
+===================================================================+
| If all outcomes are equally likely, then the probability of a     |
| single outcome is $\frac{1}{|S|}$                                 |
|                                                                   |
| The probability of an event is $P(E) =$ $\frac{|E|}{|S|}$         |
|                                                                   |
| Where $|E|$ and $|S|$ are the number of elements in $E$ and $S.$  |
|                                                                   |
| - If the outcomes are not equally likely, define the sample space |
|   such that each outcome is equally likely.                       |
|                                                                   |
| - The probability of every possible outcome must sum to 1.        |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate probability of an event.                                                                                                             |
+================================================================+=============================================================================================+
| Consider a six-sided die numbered one to six. An experiment    | ![](media/Probability and Data 2_Probability/media/image2.png){width="1.1729166666666666in" |
| involves rolling the die and recording the top face.           | height="1.1416666666666666in"}Consider the spinner.                                         |
|                                                                |                                                                                             |
| a.  What is $|S|$?                                             | An experiment involves\                                                                     |
|                                                                | spinning and recording the\                                                                 |
| $$S = \left\{ 1,\ 2,\ 3,\ 4,\ 5,\ 6 \right\}$$                 | section it lands on.                                                                        |
|                                                                |                                                                                             |
| $$|S| = 6$$                                                    | a.  What is $|S|$?                                                                          |
|                                                                |                                                                                             |
| b.  What is the probability of rolling a four?                 | $$S = \left\{ G_{1},G_{2},G_{3},B_{1},B_{2},R \right\}$$                                    |
|                                                                |                                                                                             |
| $$four = \left\{ 4 \right\}$$                                  | so that each outcome is equally likely.\                                                    |
|                                                                | $$\therefore|S| = 6$$                                                                       |
| $$P(four) = \frac{|four|}{|S|} = \frac{1}{6}$$                 |                                                                                             |
|                                                                | b.  What is the probability that the spinner lands on a red section $P(Red)$?               |
| c.  What is the probability of rolling a prime number?         |                                                                                             |
|                                                                | $$red = \left\{ R \right\}$$                                                                |
| $$prime = \left\{ 1,\ 2,\ 3,\ 5 \right\}$$                     |                                                                                             |
|                                                                | $$P(red) = \frac{|red|}{|S|} = \frac{1}{6}$$                                                |
| $$P(prime) = \frac{|prime|}{|S|} = \frac{4}{6} = \frac{2}{3}$$ |                                                                                             |
|                                                                | c.  What is the probability that the spinner lands on a green section $P(Green)$?           |
|                                                                |                                                                                             |
|                                                                | $$green = \left\{ G_{1},G_{2},G_{3} \right\}$$                                              |
|                                                                |                                                                                             |
|                                                                | $$P(green) = \frac{|green|}{|S|} = \frac{3}{6} = \frac{1}{2}$$                              |
+----------------------------------------------------------------+---------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| A 12-sided die numbered 1 to 12   | 20 people were surveyed on their  |
| is rolled.                        | favourite sport. The results are: |
|                                   |                                   |
| a.  What is the probability of    | Football: 11, Basketball: 2,      |
|     rolling a factor of 12?       | Tennis: 7                         |
|                                   |                                   |
| b.  What is the probability of    | What is the probability a         |
|     rolling a prime number?       | randomly picked person favourites |
|                                   | football?                         |
| $$\frac{1}{2},\frac{5}{12}$$      |                                   |
|                                   | $$\frac{11}{20}$$                 |
+-----------------------------------+-----------------------------------+
| - **Expected Frequency**                                              |
+-----------------------------------------------------------------------+
| A **trial** is a repetition of an experiment.                         |
|                                                                       |
| **Frequency** is how often something happens.                         |
|                                                                       |
| **Expected frequency** is how many times we think an event will       |
| happen in a number of trials.                                         |
|                                                                       |
| $${\begin{matrix}                                                     |
| Expected\  \\                                                         |
| frequency                                                             |
| \end{matrix} = \begin{matrix}                                         |
| Number\ of \\                                                         |
| trials                                                                |
| \end{matrix} \times Probability                                       |
| }{f = np}$$                                                           |
|                                                                       |
| To find expected frequency:                                           |
|                                                                       |
| 1.  Find the probability.                                             |
|                                                                       |
| 2.  Multiply number of trials by the probability.                     |
+-----------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate expected frequency of an event.                                                                         |
+===================================+=============================================================================================+
| A coin is flipped 100 times.      | ![](media/Probability and Data 2_Probability/media/image3.png){width="0.9540813648293963in" |
|                                   | height="0.9639971566054243in"}You spin this spinner 120 times.                              |
| How many times would you expect   |                                                                                             |
| it to land on heads?              | How many times would you\                                                                   |
|                                   | expect it to land on red or green?                                                          |
| 1\. $P(heads) =$ $\frac{1}{2}$    |                                                                                             |
|                                   | 1\. $P(red\ or\ green) =$ $\frac{5}{6}$                                                     |
| 2\. $f = np$ $= 100 \times$       |                                                                                             |
| $\frac{1}{2}$ $\ \ \  = 50$ times | 2\. $f = np$ $= 120 \times$ $\frac{5}{6}$ $\ \ \  = 100$ times                              |
+-----------------------------------+---------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                  |
+===================================+=============================================================================================+
| A fair 6-sided die is rolled.     | Consider the spinner.                                                                       |
|                                   |                                                                                             |
| What is the expected frequency of | How many times would you expect it to land on green or red in 200 spins?                    |
| it landing on a four if you roll  |                                                                                             |
| it 300 times?                     | ![](media/Probability and Data 2_Probability/media/image4.png){width="0.9604527559055118in" |
|                                   | height="0.956667760279965in"}                                                               |
| $50$ times                        |                                                                                             |
|                                   | 120 times                                                                                   |
+-----------------------------------+---------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Complementary Events**                                        |
+===================================================================+
| $\overline{E}$ is the **complement** of $E$. It is the event $E$  |
| **not** taking place.                                             |
|                                                                   |
| An event and its complement cover the sample space.               |
|                                                                   |
| $$E + \overline{E} = S$$                                          |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Interpret** Complementary events.                                 |
+===================================+===================================+
| The event is rolling a three on a | A bag contains red, green, and    |
| six-sided die.                    | blue marbles. The event is        |
|                                   | picking red or blue.              |
| The complementary event is:       |                                   |
|                                   | The complementary event is:       |
| not rolling a three: {1,2,4,5,6}  |                                   |
|                                   | Not picking red or blue: {green}  |
+-----------------------------------+-----------------------------------+
| Identify the complement of these events.                              |
+-----------------------------------+-----------------------------------+
| a.  Rolling an even number on a   | b.  Winning a game of table       |
|     six-sided die.                |     tennis.                       |
+-----------------------------------+-----------------------------------+
| c.  Picking fruit from a box      | d.  Sunny day tomorrow.           |
|     containing chocolates,        |                                   |
|     lollies, fruit.               |                                   |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Complement Rule of Probability**                              |
+===================================================================+
| The probability of an event and its complement sum to 1.          |
|                                                                   |
| $${P(E) + P\left( \overline{E} \right) = 1                        |
| }{\therefore P\left( \overline{E} \right) = 1 - P(E)}$$           |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Calculate** complementary probability.                                                                                                     |
+===========================================+=================================================+==================================================+
| $P(A) = 0.6$                              | $$P(A) = \frac{7}{10}$$                         | $$P\left( \overline{A} \right) = \frac{17}{21}$$ |
|                                           |                                                 |                                                  |
| $P\left( \overline{A} \right) = 0.4$      | $$P\left( \overline{A} \right) = \frac{3}{10}$$ | $$P(A) = \frac{4}{21}$$                          |
+-------------------------------------------+-------------------------------------------------+--------------------------------------------------+
| Determine the probabilities of the following events in each scenario.                                                                          |
+-------------------------------------------+-------------------------------------------------+--------------------------------------------------+
| a.  $P(A) = 0.2$                          | b.  $P(sunny) =$ $\frac{13}{20}$                | c.  $P(B) = 0.23$                                |
|                                           |                                                 |                                                  |
| $$P\left( \overline{A} \right) =$$        | $$P(not\ sunny) =$$                             | $$P\left( \overline{B} \right) =$$               |
+-------------------------------------------+-------------------------------------------------+--------------------------------------------------+
| d.  $P\left( \overline{A} \right) = 0.75$ | e.  $P(green) =$ $\frac{11}{30}$                | f.  $P(blue) = 0.23$                             |
|                                           |                                                 |                                                  |
| $$P(A) =$$                                | $$P(not\ green) =$$                             | $$P(red) =$$                                     |
+-------------------------------------------+-------------------------------------------------+--------------------------------------------------+

+--------------------------------------------------------------------------------+
| - **Example** Calculate probabilities using complementary outcomes             |
+============================================+===================================+
| A pack of 20 cards contains 10 blue, 3 yellow, 3 red, and 4 green.\            |
| One card is drawn from the pack.                                               |
+--------------------------------------------+-----------------------------------+
| a.  Find the probability that the card is  | Calculate the probability that    |
|     green.                                 | the card is not green by adding   |
|                                            | up $P(B) + P(Y) + P(R)$           |
| $$P(G) = \frac{4}{20} = \frac{1}{5}$$      |                                   |
|                                            | What is the advantage of using    |
| b.  Find the probability that the card is  | complementary events?             |
|     not green.                             |                                   |
|                                            | *In using* $1 - P(G),$ *we only   |
| $${P\left( \overline{G} \right) = 1 - P(G) | had to calculate ............     |
| }{= 1 - \frac{1}{5}                        | probability instead of three.*    |
| }{= \frac{4}{5}}$$                         |                                   |
|                                            | *The more ............... there   |
|                                            | are, the more time saved.*        |
+--------------------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| A pack of 20 cards contains\      | A bag of 25 cubes contains 3      |
| 10 blue, 6 yellow and 4 green.\   | colours.\                         |
| One card is drawn from the pack.\ | There are 7 green cubes.\         |
| Find the probability that the     | What is the probability of        |
| card is not yellow.               | picking a cube that is not green? |
|                                   |                                   |
| $$\frac{7}{10}$$                  | $$\frac{18}{25}$$                 |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The complement of an event is the event ............          |
|     happening.                                                    |
|                                                                   |
| 2.  The probability of an event and its complement must sum to    |
|     ...............                                               |
|                                                                   |
| 3.  We can write "the probability of an event not happening" as   |
|     $P(\ \ \ \ \ )$                                               |
|                                                                   |
| 4.  We can calculate the complement probability by using the      |
|     formula ..............................                        |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------+
| - **Deck of Cards**                                                                        |
+============================================================================================+
| Many questions are based on a deck of 52 playing cards.                                    |
|                                                                                            |
| - There are four **suits**: ♠ Spades, ♣ Clubs, ♦ Diamonds, ♥ Hearts.                       |
|                                                                                            |
| - Spades and clubs are **black**, diamonds and hearts are **red**.                         |
|                                                                                            |
| - The **number cards** are Ace (1), 2, 3, 4, 5, 6, 7, 8, 9, 10.                            |
|                                                                                            |
| - The **face cards,** or **picture cards,** are Jack, Queen, King.                         |
|                                                                                            |
| ![](media/Probability and Data 2_Probability/media/image5.png){width="4.225405730533684in" |
| height="2.5053532370953633in"}                                                             |
+--------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------+
| - **Identify** number of cards meeting a condition in a deck of cards.      |
+=========================+=========================+=========================+
| Using the image of a deck of cards above, identify how many cards are:      |
+-------------------------+-------------------------+-------------------------+
| a.  Picture cards       | b.  Number cards        | c.  Red cards           |
+-------------------------+-------------------------+-------------------------+
| d.  Black picture cards | e.  Red number cards    | f.  Multiples of 2      |
+-------------------------+-------------------------+-------------------------+
| g.  Spades              | h.  Number cards that   | i.  Black cards that    |
|                         |     are hearts          |     are diamonds        |
+-------------------------+-------------------------+-------------------------+
| j.  King or jacks       | k.  Less than 5         | l.  Red queens          |
+-------------------------+-------------------------+-------------------------+

Foundation

1.  A pupil has 3 tickets in the class raffle. If there are 60 tickets
    in the raffle and one ticket is drawn, find the probability that the
    pupil:

+-------------------------------------------+-------------------------------------------------------+
| a.   wins                                 | b.  does not win                                      |
|                                           |                                                       |
| $$P(wins) = \frac{3}{60} = \frac{1}{20}$$ | $$P(does\ not\ win) = \frac{57}{60} = \frac{19}{20}$$ |
+===========================================+=======================================================+

2.  A coin is tossed. Write down the probability that it shows:

+---------------------------------------+-----------------------------------------+
| a.  a head                            | b.  a tail                              |
|                                       |                                         |
| $$P(head) = \frac{1}{2}$$             | $$P(tail) = \frac{1}{2}$$               |
+=======================================+=========================================+
| c.  either a head or a tail           | d.  neither a head nor a tail           |
|                                       |                                         |
| $$P(either\ head\ or\ tail)\  = \ 1$$ | $$P(neither\ head\ nor\ tail)\  = \ 0$$ |
+---------------------------------------+-----------------------------------------+

3.  If a die is rolled, find the probability that the uppermost face is:

+----------------------------------------------------------------+---------------------------------------------------------------+
| a.  a three                                                    | b.  an even number                                            |
|                                                                |                                                               |
| $$P(three) = \frac{1}{6}$$                                     | $$P(even) = \ P(2,4,6) = \frac{3}{6} = \frac{1}{2}$$          |
+================================================================+===============================================================+
| c.  a number greater than four                                 | d.  a multiple of three                                       |
|                                                                |                                                               |
| $$P(greater\ than\ 4) = \ P(5,6) = \frac{2}{6} = \frac{1}{3}$$ | $$P(multiple\ of\ 3) = \ P(3,6) = \frac{2}{6} = \frac{1}{3}$$ |
+----------------------------------------------------------------+---------------------------------------------------------------+

4.  A bag contains five red and seven blue marbles. If one marble is
    drawn from the bag at random, find the probability that it is:

+---------------------------+----------------------------+----------------------+
| a.   red                  | b.  blue                   | c.  green            |
|                           |                            |                      |
| $$P(red) = \frac{5}{12}$$ | $$P(blue) = \frac{7}{12}$$ | $$P(green)\  = \ 0$$ |
+===========================+============================+======================+

5.  A bag contains eight red balls, seven yellow balls and three green
    balls. A ball is selected at random. Find the probability that it
    is:

+-----------------------------------------+---------------------------------------------------------------------------+-------------------------------------------------------+
| a.  red                                 | b.  yellow or green                                                       | c.  not yellow                                        |
|                                         |                                                                           |                                                       |
| $$P(red) = \frac{8}{18} = \frac{4}{9}$$ | $$P(yellow\ or\ green) = \frac{7 + 3}{18} = \frac{10}{18} = \frac{5}{9}$$ | $$P(not\ yellow) = \frac{8 + 3}{18} = \frac{11}{18}$$ |
+=========================================+===========================================================================+=======================================================+

6.  In a bag there are four red capsicums, three green capsicums, six
    red apples and five green apples. One item is chosen at random. Find
    the probability that it is:

+--------------------------------------------------------------+-------------------------------------------------------------+-----------------------------------------------------+
| a.  green                                                    | b.  red                                                     | c.  an apple                                        |
|                                                              |                                                             |                                                     |
| $$P(green) = \frac{3 + 5}{18} = \frac{8}{18} = \frac{4}{9}$$ | $$P(red) = \frac{4 + 6}{18} = \frac{10}{18} = \frac{5}{9}$$ | $$P(apple) = \frac{6 + 5}{18} = \frac{11}{18}$$     |
+==============================================================+=============================================================+=====================================================+
| d.  a capsicum                                               | e.  a red apple                                             | f.  a green capsicum                                |
|                                                              |                                                             |                                                     |
| $$P(capsicum) = \frac{4 + 3}{18} = \frac{7}{18}$$            | $$P(red\ apple) = \frac{6}{18} = \frac{1}{3}$$              | $$P(green\ capsicum) = \frac{3}{18} = \frac{1}{6}$$ |
+--------------------------------------------------------------+-------------------------------------------------------------+-----------------------------------------------------+

7.  A letter is randomly selected from the 26 letters in the English
    alphabet.\
    Find the probability that the letter is:

+-------------------------------------------------------------+-------------------------------+-----------------------------------------------------+
| a.  the letter S                                            | b.  a vowel                   | c.  a consonant                                     |
|                                                             |                               |                                                     |
| $$\ P(S) = \frac{1}{26}$$                                   | $$P(vowel) = \frac{5}{26}$$   | $$P(consonant) = \frac{21}{26}$$                    |
+=============================================================+===============================+=====================================================+
| d.  the letter $\delta$                                     | e.  either C, D or E          | f.  one of the letters of the word MATHS            |
|                                                             |                               |                                                     |
| $$P(\delta)\  = \ 0\ (\delta\ not\ in\ English\ alphabet)$$ | $$\ P(C,D,E) = \frac{3}{26}$$ | $$MATHS\ has\ letters\ M,A,T,H,S\  = \frac{5}{26}$$ |
+-------------------------------------------------------------+-------------------------------+-----------------------------------------------------+

8.  A student has a 22% chance of being chosen as a prefect.\
    What is the chance that he will not be chosen as a prefect?

P(not chosen) = 1 - 0.22 = 0.78 = 78%

9.  When breeding labradors, the probability of breeding a black dog is
    $\frac{5}{7}$.

    a.  What is the probability of breeding a dog that is not black?

    b.  If you bred 56 dogs, how many would you expect not to be black?

$$a)\ P(not\ black) = \ 1\  - \frac{5}{7} = \frac{2}{7}$$

$$b)\ Expected\ not\ black\  = \ 56\  \times \ \left( \frac{2}{7} \right) = \ 16$$

10. A box containing a light bulb has a chance of $\frac{1}{15}$ of
    holding a defective bulb.

    a.  If 120 boxes were checked, how many would you expect to hold
        defective bulbs?

    b.  What is the probability that the box holds a bulb that works?

$$a)\ Expected\ defective\  = \ 120\  \times \ \left( \frac{1}{15} \right) = \ 8$$

$$b)\ P(works) = 1 - P(defective) = \frac{14}{15}$$

11. A number is selected at random from the integers 1, 2, 3, \..., 19,
    20.\
    Find the probability of choosing:

+--------------------------------------------------+---------------------------------------------------------+----------------------------------------------+
| a.  the number 4                                 | b.  a number greater than 15                            | c.  an even number                           |
|                                                  |                                                         |                                              |
| $$P(4) = \frac{1}{20}$$                          | $$P(16,17,18,19,20) = \frac{5}{20} = \frac{1}{4}$$      | $$P(even) = \frac{10}{20} = \frac{1}{2}$$    |
+==================================================+=========================================================+==============================================+
| d.  an odd number                                | e.  a prime number                                      | f.  a square number                          |
|                                                  |                                                         |                                              |
| $$P(odd) = \frac{10}{20} = \frac{1}{2}$$         | $$P(2,3,5,7,11,13,17,19) = \frac{8}{20} = \frac{2}{5}$$ | $$P(1,4,9,16) = \frac{4}{20} = \frac{1}{5}$$ |
+--------------------------------------------------+---------------------------------------------------------+----------------------------------------------+
| g.  a multiple of 4                              | h.  the number $\sqrt{2}$                               | i.  a rational number                        |
|                                                  |                                                         |                                              |
| $$P(4,8,12,16,20) = \frac{5}{20} = \frac{1}{4}$$ | $$P\left( \sqrt{2} \right) = \ 0$$                      | $$P(rational) = \ 1$$                        |
+--------------------------------------------------+---------------------------------------------------------+----------------------------------------------+

Development

12. From a standard pack of 52 cards, one card is drawn at random. Find
    the probability that:

+-------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------+
| a.  it is black                                       | b.  it is red                                             | c.  it is a king                                    |
|                                                       |                                                           |                                                     |
| $$P(black) = \frac{26}{52} = \frac{1}{2}$$            | $$P(red) = \frac{26}{52} = \frac{1}{2}$$                  | $$P(king) = \frac{4}{52} = \frac{1}{13}$$           |
+=======================================================+===========================================================+=====================================================+
| d.  it is the jack of hearts                          | e.  it is a club                                          | f.  it is a picture card                            |
|                                                       |                                                           |                                                     |
| $$P(jack\ of\ hearts) = \frac{1}{52}$$                | $$P(club) = \frac{13}{52} = \frac{1}{4}$$                 | $$P(picture) = \frac{12}{52} = \frac{3}{13}$$       |
+-------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------+
| g.  it is a heart or a spade                          | h.  it is a red five or a black seven                     | i.  it is less than a four                          |
|                                                       |                                                           |                                                     |
| $$P(heart\ or\ spade) = \frac{26}{52} = \frac{1}{2}$$ | $$P(red\ 5\ or\ black\ 7) = \frac{4}{52} = \frac{1}{13}$$ | $$P(less\ than\ 4) = \frac{12}{52} = \frac{3}{13}$$ |
+-------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------+

13. A book has 150 pages. The book is randomly opened at a page.\
    Find the probability that the page number is:

+-----------------------------------------------+---------------------------------------------------+---------------------------------------------------------------------+
| a.  greater than 140,                         | b.  a multiple of 20                              | c.  an odd number                                                   |
|                                               |                                                   |                                                                     |
| $$P( > 140) = \frac{10}{150} = \frac{1}{15}$$ | $$P(multiple\ of\ 20) = \frac{7}{150}$$           | $$P(odd) = \frac{75}{150} = \frac{1}{2}$$                           |
+===============================================+===================================================+=====================================================================+
| d.  a number less than 25,                    | e.  either 72 or 111                              | f.  a three-digit number                                            |
|                                               |                                                   |                                                                     |
| $$P( < 25) = \frac{24}{150} = \frac{4}{25}$$  | $$P(72\ or\ 111) = \frac{2}{150} = \frac{1}{75}$$ | $$P(three\ digits) = \frac{51}{150} = \frac{17}{50}(100\ to\ 150)$$ |
+-----------------------------------------------+---------------------------------------------------+---------------------------------------------------------------------+

14. A bag contains three times as many yellow marbles as blue marbles,
    and no other colours.\
    If a marble is chosen at random, find the probability that it is
    yellow.

$$Let\ blue\  = \ x,\ then\ yellow\  = \ 3x,\ total\  = \ 4x$$

$$P(yellow) = \frac{3x}{4x} = \frac{3}{4}$$

15. Comment on the following arguments, whether they are correct or
    incorrect and why.

    a.  \'When I buy a lottery ticket, there are only two outcomes,
        either I win or lose.\
        So, the probability I win is 50%\'

Incorrect, the outcomes are not equally likely.

b.  \'When answering a multiple-choice test in which there are four
    possible answers to each question, the chance that Peter answers a
    question correctly is $\frac{1}{4}$.\'

Incorrect, assumes random guessing, Peter likely has knowledge making
random guesses unlikely

c.  \'A bag contains a number of red, white and black beads. If you
    choose one bead at random from the bag, the probability that it is
    black is $\frac{1}{3}$.\'

Valid only if equal numbers of each colour, otherwise outcomes not
equally likely

# Listing Outcomes in Multistage Experiments

+-------------------------------------------------------------------+
| - **Multistage Experiments**                                      |
+===================================================================+
| A **multistage experiment** consists of two or more steps.        |
|                                                                   |
| For example:                                                      |
|                                                                   |
| - rolling two dice                                                |
|                                                                   |
| - flipping three coins                                            |
|                                                                   |
| - flipping a coin, then rolling a die, then picking a card from a |
|   deck.                                                           |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Independent and Dependent Events**                            |
+===================================================================+
| An **independent event** doesn\'t change based on previous        |
| results.                                                          |
|                                                                   |
| Example: Flipping a coin twice - the second flip doesn\'t depend  |
| on the first.                                                     |
|                                                                   |
| A **dependent event** changes based on previous results.          |
|                                                                   |
| Example: Taking two marbles from a bag - the second pick depends  |
| on the first.                                                     |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Identify** events as independent or dependent.                    |
+===================================+===================================+
| a.  Tossing a coin then tossing   | b.  Rolling a die then rolling    |
|     another.                      |     another.                      |
|                                   |                                   |
| - Independent                     | - Independent                     |
|                                   |                                   |
| - Dependent                       | - Dependent                       |
+-----------------------------------+-----------------------------------+
| c.  Picking a card from a deck,   | d.  Picking a card from a deck,   |
|     then picking another one      |     replacing it, then picking    |
|     without replacing it.         |     another card after shuffling. |
|                                   |                                   |
| - Independent                     | - Independent                     |
|                                   |                                   |
| - Dependent                       | - Dependent                       |
+-----------------------------------+-----------------------------------+
| e.  Tossing a coin then rolling a | f.  Choosing a marble from a jar, |
|     die.                          |     replacing it, shaking the     |
|                                   |     jar, then choosing another.   |
| - Independent                     |                                   |
|                                   | - Independent                     |
| - Dependent                       |                                   |
|                                   | - Dependent                       |
+-----------------------------------+-----------------------------------+
| g.  Choosing a chocolate from a   | h.  Choosing a marble from a jar  |
|     box,\                         |     then choosing another marble. |
|     eating it, then choosing      |                                   |
|     another.                      | - Independent                     |
|                                   |                                   |
| - Independent                     | - Dependent                       |
|                                   |                                   |
| - Dependent                       |                                   |
+-----------------------------------+-----------------------------------+
| When an experiment is conducted **with replacement**, is it           |
| independent or dependent?                                             |
|                                                                       |
| When an experiment is conducted **without replacement**, is it        |
| independent or dependent?                                             |
+-----------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Fundamental Counting Principle for Independent Events**       |
+===================================================================+
| For two **independent** events:                                   |
|                                                                   |
| If one event can occur in $\mathbf{m}$ ways and another event can |
| occur in $\mathbf{n}$ ways,\                                      |
| then both events can occur in $\mathbf{m\  \times \ n}$ ways.     |
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

+-------------------------------------------------------------------+
| - **Listing Outcomes using Tables**                               |
+===================================================================+
| A two-way table to records all possible combinations of outcomes  |
| for a two-step experiment.                                        |
|                                                                   |
| - Use the fundamental counting principle to check you have        |
|   recorded all possible ways.                                     |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** List all possible outcomes using a two-way table.   |
+===================================================================+
| Two four-sided die are rolled and then their results are added.   |
|                                                                   |
| Complete the table to list all outcomes                           |
|                                                                   |
| +------+------+-----------------------------------------------+   |
| |      |      | Dice 2                                        |   |
| |      |      +-----------+-----------+-----------+-----------+   |
| |      |      | 1         | 2         | 3         | 4         |   |
| +=====:+:====:+:=========:+:=========:+:=========:+:=========:+   |
| | Dice | 1    | 2         | 3         | 4         | 5         |   |
| | 1    |      |           |           |           |           |   |
| |      +------+-----------+-----------+-----------+-----------+   |
| |      | 2    | 3         | 4         | 5         | 6         |   |
| |      +------+-----------+-----------+-----------+-----------+   |
| |      | 3    | 4         | 5         | 6         | 7         |   |
| |      +------+-----------+-----------+-----------+-----------+   |
| |      | 4    | 5         | 6         | 7         | 8         |   |
| +------+------+-----------+-----------+-----------+-----------+   |
|                                                                   |
| a.  How many outcomes are there? 16                               |
|                                                                   |
| b.  What is the probability that the dice sum is 4?               |
|     $\frac{3}{16}$                                                |
|                                                                   |
| c.  What is the probability that the dice sum is 5 or greater?    |
|     $\frac{10}{16} = \frac{5}{8}$                                 |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------+
| - **Practice**                                                              |
+=============================================================================+
| A two-step experiment involves flipping a coin then rolling a die.          |
|                                                                             |
| Complete the table to list all outcomes.                                    |
|                                                                             |
| +------+------+-----------------------------------------------------------+ |
| |      |      | Dice                                                      | |
| |      |      +---------+---------+---------+---------+---------+---------+ |
| |      |      | 1       | 2       | 3       | 4       | 5       | 6       | |
| +=====:+:====:+:=======:+:=======:+:=======:+:=======:+:=======:+:=======:+ |
| | Coin | H    |         |         |         |         |         |         | |
| |      +------+---------+---------+---------+---------+---------+---------+ |
| |      | T    |         |         |         |         |         |         | |
| +------+------+---------+---------+---------+---------+---------+---------+ |
|                                                                             |
| a.  What is the total number of outcomes?                                   |
|                                                                             |
| 12                                                                          |
|                                                                             |
| b.  What is $P(tail)$?                                                      |
|                                                                             |
| $$\frac{1}{2}$$                                                             |
|                                                                             |
| c.  What is $P(head\ and\ 4)$?                                              |
|                                                                             |
| $$\frac{1}{12}$$                                                            |
|                                                                             |
| d.  What is the probability of a head and an odd number?                    |
|                                                                             |
| $$\frac{1}{4}$$                                                             |
+-----------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Listing Outcomes using a Tree Diagram**                       |
+===================================================================+
| A tree diagram records all possible combinations of outcomes for  |
| a multistage experiment.                                          |
|                                                                   |
| Branches represent each possible outcome at every stage.          |
|                                                                   |
| Outcomes are listed at the end of each complete path.             |
|                                                                   |
| - Use the fundamental counting principle to check you have        |
|   recorded all possible ways.                                     |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** Construct a tree diagram                            |
+===================================================================+
| A fair coin is tossed three times. Use a tree diagram to list all |
| possible outcomes.                                                |
|                                                                   |
| +----------+----------+----------+--------------+                 |
| | **1^st^  | **2^nd^  | **3^rd^  | **Outcomes** |                 |
| | Toss**   | Toss**   | toss**   |              |                 |
| +==========+==========+==========+==============+                 |
| |          |          |          | HHH          |                 |
| |          |          |          |              |                 |
| |          |          |          | HHT          |                 |
| |          |          |          |              |                 |
| |          |          |          | HTH          |                 |
| |          |          |          |              |                 |
| |          |          |          | HTT          |                 |
| |          |          |          |              |                 |
| |          |          |          | THH          |                 |
| |          |          |          |              |                 |
| |          |          |          | THT          |                 |
| |          |          |          |              |                 |
| |          |          |          | TTH          |                 |
| |          |          |          |              |                 |
| |          |          |          | TTT          |                 |
| +----------+----------+----------+--------------+                 |
|                                                                   |
| a.  How many outcomes are there? 8                                |
|                                                                   |
| b.  What is the probability of two heads and a tail, in that      |
|     order? $\frac{1}{8}$                                          |
|                                                                   |
| c.  What is the probability of two heads and a tail, in any       |
|     order? $\frac{3}{8}$                                          |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Practice**                                                    |
+===================================================================+
| A bag contains 2 red discs and 1 green disc. A coin is tossed,    |
| and a disc is randomly chosen.                                    |
|                                                                   |
| List all possible outcomes using the tree diagram.                |
|                                                                   |
|   --------------------------------------                          |
|   **Coin      **Pick      **Outcomes**                            |
|   Toss**      Disc**                                              |
|   ----------- ----------- --------------                          |
|                                                                   |
|                                                                   |
|   --------------------------------------                          |
|                                                                   |
| a.  How many outcomes are there?                                  |
|                                                                   |
| 6                                                                 |
|                                                                   |
| a.  What is the probability of getting tails and a red disc?      |
|                                                                   |
| $$\frac{1}{3}$$                                                   |
|                                                                   |
| b.  What is the probability of getting a red disc?                |
|                                                                   |
| $$\frac{2}{3}$$                                                   |
+-------------------------------------------------------------------+

Foundation

1.  A coin is tossed twice.

    a.  ![](media/Probability and Data 2_Probability/media/image6.png){width="2.6354790026246717in"
        height="1.5748031496062993in"}Complete this tree diagram to show
        all the possible outcomes.

All outcomes are HH HT TH TT

b.  What is the total number of outcomes?

4

c.  Find the probability of obtaining:

+-----------------+-----------------+-----------------+-----------------+
| i.  two heads   | ii. one head    | iii. at least   | iv. at least    |
|                 |                 |      one head   |     one tail    |
| $$\frac{1}{4}$$ | $$\frac{1}{2}$$ |                 |                 |
|                 |                 | $$\frac{3}{4}$$ | $$\frac{3}{4}$$ |
+=================+=================+=================+=================+

2.  A drawer contains two red socks (R), one blue sock (B) and one
    yellow sock (Y).\
    Two socks are selected at random **without replacement**.

    a.  ![](media/Probability and Data 2_Probability/media/image7.png){width="3.3113593613298336in"
        height="2.7559055118110236in"}Complete this tree diagram.

    b.  Find the probability of obtaining:

+-----------------+-----------------+-----------------+-----------------+
| i.  a red sock  | ii. two red     | iii. any pair   | iv. any pair of |
|     and a blue  |     socks       |      of socks   |     socks of    |
|     sock        |                 |      of the     |     different   |
|                 | $$\frac{1}{6}$$ |      same       |     colour      |
| $$\frac{1}{3}$$ |                 |      colour     |                 |
|                 |                 |                 | $$\frac{5}{6}$$ |
|                 |                 | $$\frac{1}{6}$$ |                 |
+=================+=================+=================+=================+

3.  Two six-sided die are rolled.

    a.  Complete the table below.

+---------+-------+-----------------------------------------------+
|         |       | **Die 2**                                     |
+:=======:+:=====:+:=====:+:=====:+:=====:+:=====:+:=====:+:=====:+
|         |       | **1** | **2** | **3** | **4** | **5** | **6** |
+---------+-------+-------+-------+-------+-------+-------+-------+
| > **Die | **1** | (1,1) | (2,1) | (3,1) | (4,1) | (5,1) | (6,1) |
| > 1**   |       |       |       |       |       |       |       |
|         +-------+-------+-------+-------+-------+-------+-------+
|         | **2** | (1,2) | (2,2) | (3,2) | (4,2) | (5,2) | (6,2) |
|         +-------+-------+-------+-------+-------+-------+-------+
|         | **3** | (1,3) | (2,3) | (3,3) | (4,3) | (5,3) | (6,3) |
|         +-------+-------+-------+-------+-------+-------+-------+
|         | **4** | (1,4) | (2,4) | (3,4) | (4,4) | (5,4) | (6,4) |
|         +-------+-------+-------+-------+-------+-------+-------+
|         | **5** | (1,5) | (2,5) | (3,5) | (4,5) | (5,5) | (6,5) |
|         +-------+-------+-------+-------+-------+-------+-------+
|         | **6** | (1,6) | (2,6) | (3,6) | (4,6) | (5,6) | (6,6) |
+---------+-------+-------+-------+-------+-------+-------+-------+

b.  What is the total number of outcomes?

$$36$$

c.  Find the probability that the outcome is:

+------------------+-----------------+------------------+-----------------+
| i.  (1,1)        | ii. Two of the  | iii. A sum of 4  | iv. Any outcome |
|                  |     same number |                  |     with 1 or 6 |
| $$\frac{1}{36}$$ |                 | $$\frac{1}{12}$$ |                 |
|                  | $$\frac{1}{6}$$ |                  | $$\frac{5}{9}$$ |
+==================+=================+==================+=================+

4.  The total sum is recorded from rolling two four-sided dice.

    a.  Complete the table.

+---------+-------+-------------------------------+
|         |       | **Die 2**                     |
+:=======:+:=====:+:=====:+:=====:+:=====:+:=====:+
|         |       | **1** | **2** | **3** | **4** |
+---------+-------+-------+-------+-------+-------+
| > **Die | **1** | 2     | 3     | 4     | 5     |
| > 1**   |       |       |       |       |       |
|         +-------+-------+-------+-------+-------+
|         | **2** | 3     | 4     | 5     | 6     |
|         +-------+-------+-------+-------+-------+
|         | **3** | 4     | 5     | 6     | 7     |
|         +-------+-------+-------+-------+-------+
|         | **4** | 5     | 6     | 7     | 8     |
+---------+-------+-------+-------+-------+-------+

b.  Find the probability that the outcome is:

+------------------+------------------+-----------------+------------------+
| i.  2            | ii. 2 or 3       | iii. Less than  | iv. More than 6  |
|                  |                  |      or equal   |                  |
| $$\frac{1}{16}$$ | $$\frac{3}{16}$$ |      to 4       | $$\frac{3}{16}$$ |
|                  |                  |                 |                  |
|                  |                  | $$\frac{3}{8}$$ |                  |
+==================+==================+=================+==================+

5.  A spinner with three numbers, 1, 2 and 3, is spun twice.\
    Each number is equally likely to be spun on a single spin.

    a.  ![](media/Probability and Data 2_Probability/media/image8.png){width="2.045703193350831in"
        height="2.2703051181102363in"}List the set of possible outcomes,
        using a tree diagram.

    b.  What is the total number of possible outcomes?

9

c.  Find the probability of spinning:

+-----------------+-----------------+-----------------+-----------------+
| i.  two 3s      | ii. at least    | iii. no more    | iv. two odd     |
|                 |     one 3       |      than one 2 |     numbers     |
| $$\frac{1}{9}$$ |                 |                 |                 |
|                 | $$\frac{5}{9}$$ | $$\frac{8}{9}$$ | $$\frac{4}{9}$$ |
+=================+=================+=================+=================+

6.  Two lollipops are selected at random **without replacement** from a
    group of three:\
    strawberry (S), grape (G) and cola (C).

    a.  ![](media/Probability and Data 2_Probability/media/image9.png){width="2.7304352580927382in"
        height="2.783248031496063in"}List all the possible outcomes for
        the selection using a tree diagram.

    b.  Find the probability that the selection will contain:

+---------------------+---------------------+---------------------+
| i.  strawberry and  | ii. grape           | iii. grape or cola  |
|     cola            |                     |                     |
|                     | $$\frac{2}{3}$$     | $$1$$               |
| $$\frac{1}{3}$$     |                     |                     |
+=====================+=====================+=====================+

# The Multiplication Rule and Probability Trees

+-------------------------------------------------------------------+
| - **Multiplication Rule for Multistage Experiments**              |
+===================================================================+
| If two successive events $A$ and $B$ in a multistage experiment   |
| are **independent**, then:                                        |
|                                                                   |
| $$P(A\ and\ B) = P(A) \times P(B)                                 |
| $$                                                                |
|                                                                   |
| - We can write $P(A\ and\ B)$ as $P(AB)$ and $P(A,B)$ and         |
|   $P(A \cap B)$.                                                  |
|                                                                   |
| - Note that $P(A\ and\ B)$ is not always equal to $P(B\ and\ A)$  |
|   for multistage probability.                                     |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Determine probabilities for independent events using                                                                                       |
+======================================================================================================+===================================================+
| ![A hexagon with letters and numbers AI-generated content may be                                     | What does $P(2\ and\ B)$ mean?                    |
| incorrect.](media/Probability and Data 2_Probability/media/image10.png){width="0.6675929571303587in" |                                                   |
| height="0.6162390638670167in"}![A green dice with black dots AI-generated content may be             | *Probability of getting ......... in the first    |
| incorrect.](media/Probability and Data 2_Probability/media/image11.png){width="0.5840277777777778in" | stage and ......... in the second stage.*         |
| height="0.6131944444444445in"}Alex is rolling a dice and spinning a spinner.                         |                                                   |
|                                                                                                      | Where did the fractions $\frac{1}{6}$ and         |
| What is the probability that he gets:                                                                | $\frac{1}{5}$ come from?                          |
|                                                                                                      |                                                   |
| a.  2 on the die and B on the spinner?                                                               | *The probability of getting ...... is*            |
|                                                                                                      | $\frac{1}{6}$                                     |
| $${P(2,B) = P(2) \times P(B)                                                                         |                                                   |
| }{= \frac{1}{6} \times \frac{1}{5} = \frac{1}{30}}$$                                                 | *The probability of getting ...... is*            |
|                                                                                                      | $\frac{1}{5}$                                     |
| b.  An odd number on the die and a vowel on the spinner?                                             |                                                   |
|                                                                                                      | Show why this works using the table.              |
| $${P(odd,\ vowel) = P(odd) \times P(vowel)                                                           |                                                   |
| }{= \frac{3}{6} \times \frac{2}{5} = \frac{6}{30} = \frac{1}{5}}$$                                   |   ----------------------------------------------- |
|                                                                                                      |           **A**   **B**   **C**   **D**   **E**   |
|                                                                                                      |   ------- ------- ------- ------- ------- ------- |
|                                                                                                      |   **1**   1,A     1,B     1,C     1,D     1,E     |
|                                                                                                      |                                                   |
|                                                                                                      |   **2**   2,A     2,B     2,C     2,D     2,E     |
|                                                                                                      |                                                   |
|                                                                                                      |   **3**   3,A     3,B     3,C     3,D     3,E     |
|                                                                                                      |                                                   |
|                                                                                                      |   **4**   4,A     4,B     4,C     4,D     4,E     |
|                                                                                                      |                                                   |
|                                                                                                      |   **5**   5,A     5,B     5,C     5,D     5,E     |
|                                                                                                      |                                                   |
|                                                                                                      |   **6**   6,A     6,B     6,C     6,D     6,E     |
|                                                                                                      |   ----------------------------------------------- |
+------------------------------------------------------------------------------------------------------+---------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                               |
+====================================+====================================+====================================+
| Alison is rolling a die and spinning a spinner.                                                              |
|                                                                                                              |
| ![A square with black letters and a cross AI-generated content may be                                        |
| incorrect.](media/Probability and Data 2_Probability/media/image12.png){width="0.6041666666666666in"         |
| height="0.6111111111111112in"}![A green dice with black dots AI-generated content may be                     |
| incorrect.](media/Probability and Data 2_Probability/media/image11.png){width="0.59375in"                    |
| height="0.6229166666666667in"}                                                                               |
|                                                                                                              |
| What is the probability that she gets:                                                                       |
+------------------------------------+------------------------------------+------------------------------------+
| a.  1 on the die and\              | b.  An even number and a           | c.  A number greater than 4 and a  |
|     C on the spinner.              |     consonant.                     |     vowel.                         |
|                                    |                                    |                                    |
| $$\frac{1}{24}$$                   | $$\frac{3}{8}$$                    | $$\frac{1}{12}$$                   |
+------------------------------------+------------------------------------+------------------------------------+
| - **Probability Trees with Independent Events**                                                              |
+--------------------------------------------------------------------------------------------------------------+
| - A **probability tree** is a tree diagram with probabilities on its branches.                               |
|                                                                                                              |
| - We use probability trees when each event has a different probability, or when there are too many outcomes  |
|   to list.                                                                                                   |
|                                                                                                              |
| - Calculate an event's probability by **multiplying** the probabilities along the branches.                  |
+--------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------+
| - **Interpret** probability trees                                                      |
+========================================================================================+
| A bag contains 4 purple and 3 green marbles, and a second bag contains 2 purple and 3  |
| green marbles. A marble is picked out of each bag.                                     |
|                                                                                        |
|   -----------------------------------------------------------------                    |
|   **Bag 1**                        **Bag 2**                                           |
|   -------------------------------- --------------------------------                    |
|                                                                                        |
|   -----------------------------------------------------------------                    |
+----------------------------------------------------------------------------------------+
| The tree diagram of this situation is below to the left.\                              |
| Comment on its appropriateness for representing this problem.                          |
|                                                                                        |
| When working with probability, we do not need to list each outcome.\                   |
| We can calculate the probability of each **event** instead.\                           |
| A **probability tree** shows the events and their probabilities at each stage.         |
|                                                                                        |
| To find the probability of an event, we **multiply** **the probabilities** **along the |
| branches**                                                                             |
|                                                                                        |
| Calculate the probability of selecting a green marble and a purple marble, in that     |
| order,\                                                                                |
| using both trees.                                                                      |
|                                                                                        |
| +------------------------------------------+-----------------------------------------+ |
| | **Tree diagram** listing outcomes        | **Probability tree** listing events     | |
| +:===========:+:===========:+=============:+:===========:+:===========:+============:+ |
| | **Bag 1**   | **Bag 2**   | **Outcomes** | **Bag 1**   | **Bag 2**   | **Events**  | |
| +-------------+-------------+--------------+-------------+-------------+-------------+ |
| | P           | P           | PP           | P           | G           | $$P(PP) =$$ | |
| |             |             |              |             |             |             | |
| | P           | P           | PP           | G           |             | $$P(PG) =$$ | |
| |             |             |              |             |             |             | |
| | P           | G           | PG           |             |             | $$P(GP) =$$ | |
| |             |             |              |             |             |             | |
| | P           | G           | PG           |             |             | $$P(GG) =$$ | |
| |             |             |              |             |             |             | |
| | G           | G           | PG           |             |             |             | |
| |             |             |              |             |             |             | |
| | G           | P           | PP           |             |             |             | |
| |             |             |              |             |             |             | |
| | G           | P           | PP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | PG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | PG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | PG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | P           | PP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | P           | PP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | PG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | PG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | PG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | P           | PP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | P           | PP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | PG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | PG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | PG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | P           | GP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | P           | GP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | GG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | GG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | GG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | P           | GP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | P           | GP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | GG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | GG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | GG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | P           | GP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | P           | GP           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | GG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | GG           |             |             |             | |
| |             |             |              |             |             |             | |
| |             | G           | GG           |             |             |             | |
| +-------------+-------------+--------------+-------------+-------------+-------------+ |
+----------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Probability Trees with Independent Events**                   |
+===================================================================+
| 1.  **Draw** a tree diagram where each stage appears as a         |
|     separate branch.                                              |
|                                                                   |
| 2.  **Label** each branch with the probability of that            |
|     single-stage event occurring.                                 |
|                                                                   |
| 3.  **Calculate** probability of each event by multiplying        |
|     probabilities along each path.                                |
|                                                                   |
| 4.  **Answer** question. When the question asks for multiple      |
|     events, choose one method:                                    |
|                                                                   |
|     a.  Add the probabilities of all relevant events together, OR |
|                                                                   |
|     b.  Use $1 - P(none)$ when the question asks for "at least    |
|         one."                                                     |
|                                                                   |
| - The probabilities on any pair of branches should sum to 1.      |
|                                                                   |
| - All final events should sum to 1.                               |
|                                                                   |
| - It is a good idea to leave probabilities as unsimplified        |
|   fractions.                                                      |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------+
| - **Example** Calculate probability of multistage events using probability trees.                        |
+==========================================================================================================+
| A bag contains 7 red and 5 blue marbles.\                                                                |
| A second bag has 4 red and 3 blue.                                                                       |
|                                                                                                          |
| a.  What is the probability of drawing a red marble and a blue marble, in any order?                     |
|                                                                                                          |
| b.  What is the probability of drawing at least one red marble?                                          |
|                                                                                                          |
| 1\. Draw tree diagram                                                                                    |
|                                                                                                          |
| +----------+----------+------------+                                                                     |
| | **1^st^  | **2^nd^  | **Events** |                                                                     |
| | Stage**  | Stage**  |            |                                                                     |
| +==========+==========+============+                                                                     |
| | R        | R        | RR         |                                                                     |
| |          |          |            |                                                                     |
| | B        | B        | RB         |                                                                     |
| |          |          |            |                                                                     |
| |          | R        | BR         |                                                                     |
| |          |          |            |                                                                     |
| |          | B        | BB         |                                                                     |
| +----------+----------+------------+                                                                     |
|                                                                                                          |
| 2\. Label branches                                                                                       |
|                                                                                                          |
| 3\. Calculate probabilities                                                                              |
|                                                                                                          |
| +----------+----------+-------------------------------------------------------------+                    |
| | **1^st^  | **2^nd^  | **Events**                                                  |                    |
| | Stage**  | Stage**  |                                                             |                    |
| +==========+==========+=============================================================+                    |
| | B        | B        | $$P(RR) = \frac{7}{12} \times \frac{4}{7} = \frac{28}{84}$$ |                    |
| |          |          |                                                             |                    |
| |          |          | $$P(RB) = \frac{7}{12} \times \frac{3}{7} = \frac{21}{84}$$ |                    |
| |          |          |                                                             |                    |
| |          |          | $$P(BR) = \frac{5}{12} \times \frac{4}{7} = \frac{20}{84}$$ |                    |
| |          |          |                                                             |                    |
| |          |          | $$P(BB) = \frac{5}{12} \times \frac{3}{7} = \frac{15}{84}$$ |                    |
| +----------+----------+-------------------------------------------------------------+                    |
|                                                                                                          |
| 4\. Answer questions                                                                                     |
|                                                                                                          |
| $$a.\ \ P(RB) + P(RB) = \frac{21}{84} + \frac{20}{84} = \frac{41}{84}$$                                  |
|                                                                                                          |
| $$b.\ \ P(RR) + P(RB) + P(BR) = \frac{28}{84} + \frac{21}{84} + \frac{20}{24} = \frac{69}{84}$$          |
|                                                                                                          |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ OR:\ 1 - P(BB) = 1 - \frac{15}{84} = \frac{69}{84}$$ |
+----------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                           |
+----------------------------------------------------------------------------------------------------------+
| A bag contains 12 green counters and 8 red counters.\                                                    |
| Faith removes a counter, writes down its colour then puts it back in the bag.\                           |
| She then selects another counter and writes down its colour.                                             |
|                                                                                                          |
| a.  Find the probability that Faith selects two green counters.                                          |
|                                                                                                          |
| b.  Find the probability that Faith selects at least one green counter.                                  |
|                                                                                                          |
| $$a)\ \frac{144}{400} = \frac{9}{25}$$                                                                   |
|                                                                                                          |
| $$b)\ \frac{336}{400} = \frac{21}{25}$$                                                                  |
+----------------------------------------------------------------------------------------------------------+
| Becky has a maths test and then a science test.\                                                         |
| She has a 80% chance of passing her maths test.\                                                         |
| She has a 60% chance of passing her science test.                                                        |
|                                                                                                          |
| a.  Find the probability she passes only one of the exams.                                               |
|                                                                                                          |
| b.  Find the probability she passes at least one of the exams.                                           |
|                                                                                                          |
| $$a)\ 44\%$$                                                                                             |
|                                                                                                          |
| $$b)\ 92\%$$                                                                                             |
+----------------------------------------------------------------------------------------------------------+
| - **Complementary Events of "At Least One"**                                                             |
+----------------------------------------------------------------------------------------------------------+
| The complement of \"**at least one**\" is \"**none**\".                                                  |
+----------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Identify** the complementary event of "at least one"              |
+===================================+===================================+
| Identify the complement of these scenarios.                           |
+-----------------------------------+-----------------------------------+
| A coin is flipped four times.     | You roll a fair six-sided die     |
|                                   | three times.                      |
| What is the complementary event   |                                   |
| to\                               | What is the complementary event   |
| "at least one head"?              | to\                               |
|                                   | \"at least one roll is a 6\"?     |
+-----------------------------------+-----------------------------------+
| From a shuffled deck of 52 cards, | You flip a fair coin five times.  |
| 6 cards are drawn.                |                                   |
|                                   | What is the complementary event   |
| What is the complementary event   | to\                               |
| to\                               | \"at least one flip results in    |
| \"at least one card drawn is a    | tails\"?                          |
| spade\"?                          |                                   |
+-----------------------------------+-----------------------------------+
| A bag contains 5 red marbles, 3   | In a class of 30 students, 15 are |
| blue marbles, and 2 green         | male and 15 are female. Three     |
| marbles.                          | students are randomly selected    |
|                                   |                                   |
| Three marbles are drawn.          | What is the complementary event   |
|                                   | to\                               |
| What is the complementary event   | \"at least one student selected   |
| to\                               | is male\"?                        |
| \"at least one marble drawn is    |                                   |
| red\"?                            |                                   |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Probability of "At Least One"**                               |
+===================================================================+
| $$P(a\ least\ one) = 1 - P(none)$$                                |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------+
| - **Interpret** the complementary event of "at least one"                                               |
+====================================================+====================================================+
| ![A diagram of a diagram Description automatically                                                      |
| generated](media/Probability and Data 2_Probability/media/image13.png){width="3.0515857392825896in"     |
| height="2.6039873140857392in"}Three coins are flipped. The tree diagram is given.                       |
|                                                                                                         |
| a.  What is the probability of no tails?                                                                |
|                                                                                                         |
| b.  What is the probability of at least one tail?                                                       |
|                                                                                                         |
| c.  Does $P(at\ least\ one) = 1 - P(none)?$                                                             |
+----------------------------------------------------+----------------------------------------------------+
| a.  A fair die is rolled twice.\                   | b.  A spinner has 4 equal sections: red, blue,     |
|     \                                              |     green, yellow. It\'s spun 3 times.\            |
|     What is the probability of no 6s?\             |     \                                              |
|     \                                              |     What is the probability of no reds?            |
|     \                                              |                                                    |
|     What is the probability of at least one 6?     | What is the probability of at least one red?       |
+----------------------------------------------------+----------------------------------------------------+
| c.  A bag contains 3 red balls and 7 blue balls.   | d.  A student guesses on 3 multiple-choice         |
|     Two balls are drawn with replacement.\         |     questions. Each question has probability ¼ of  |
|     \                                              |     being correct.\                                |
|     What is the probability of at least one red    |     \                                              |
|     ball?                                          |     What is the probability of at least one        |
|                                                    |     correct answer?                                |
+----------------------------------------------------+----------------------------------------------------+
| e.  A basketball player has a 60% free-throw       | f.  A quality control test checks 5 items. Each    |
|     success rate. She attempts 3 shots.            |     item has a 5% chance of being defective.       |
|                                                    |                                                    |
| What is the probability of at least one successful | What is the probability of at least one defective  |
| shot?                                              | item?                                              |
+----------------------------------------------------+----------------------------------------------------+

+-------------------------------------------------------------------+
| - **Probability Trees with Dependent Events**                     |
+===================================================================+
| - Dependent events occur when there is **no replacement**.        |
|                                                                   |
| 1.  **Draw** a tree diagram where each stage appears as a         |
|     separate branch.                                              |
|                                                                   |
| 2.  **Label** each branch with the probability of that            |
|     single-stage event occurring.                                 |
|                                                                   |
| 3.  **Calculate** probability of each event by multiplying        |
|     probabilities along each path.                                |
|                                                                   |
| 4.  **Answer** question. When the question asks for multiple      |
|     events, choose one method:                                    |
|                                                                   |
|     a.  Add the probabilities of all relevant events together, OR |
|                                                                   |
|     b.  Use $1 - P(none)$ when the question asks for "at least    |
|         one."                                                     |
|                                                                   |
| - The probabilities on any pair of branches should sum to 1.      |
|                                                                   |
| - All final events should sum to 1.                               |
|                                                                   |
| - It is a good idea to leave probabilities as unsimplified        |
|   fractions.                                                      |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate probability of multistage events using probability trees.                             |
+===============================================================================================================+
| A bag contains 3 red marbles and 5 blue marbles.\                                                             |
| Two are taken from the same bag **without replacement**.                                                      |
|                                                                                                               |
| a.  What is the probability of drawing a red marble and a blue marble, in any order?                          |
|                                                                                                               |
| b.  What is the probability of drawing at least one red marble?                                               |
|                                                                                                               |
| +----------+----------+------------------------------------------------------------+                          |
| | **1^st^  | **2^nd^  | **Events**                                                 |                          |
| | Stage**  | Stage**  |                                                            |                          |
| +==========+==========+============================================================+                          |
| | B        | B        | $$P(RR) = \frac{3}{8} \times \frac{2}{7} = \frac{6}{56}$$  |                          |
| |          |          |                                                            |                          |
| |          |          | $$P(RB) = \frac{3}{8} \times \frac{5}{7} = \frac{15}{56}$$ |                          |
| |          |          |                                                            |                          |
| |          |          | $$P(BR) = \frac{5}{8} \times \frac{3}{7} = \frac{15}{56}$$ |                          |
| |          |          |                                                            |                          |
| |          |          | $$P(BB) = \frac{5}{8} \times \frac{4}{7} = \frac{20}{56}$$ |                          |
| +----------+----------+------------------------------------------------------------+                          |
|                                                                                                               |
| $$a.\ \ P(RB) + P(RB) = \frac{15}{56} + \frac{15}{56} = \frac{30}{56}$$                                       |
|                                                                                                               |
| $$b.\ \ P(RR) + P(RB) + P(BR) = \frac{6}{56} + \frac{15}{56} + \frac{15}{56} = \frac{36}{56} = \frac{9}{14}$$ |
|                                                                                                               |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ OR:\ 1 - P(BB) = 1 - \frac{20}{56} = \frac{9}{14}$$       |
+---------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Practice**                                                    |
+===================================================================+
| A bag contains 4 black counters and 8 white counters.             |
|                                                                   |
| Hannah takes two counters out of the bag at random without        |
| replacing the first.                                              |
|                                                                   |
| a.  Find the probability that Hannah selects two counters of the  |
|     same colour.                                                  |
|                                                                   |
| b.  Find the probability that Hannah selects at least one white   |
|     counter.                                                      |
|                                                                   |
| $$a)\ \frac{68}{132} = \frac{17}{33}$$                            |
|                                                                   |
| $$b)\ \frac{120}{132} = \frac{10}{11}$$                           |
+-------------------------------------------------------------------+
| A box contains 2 milk chocolates and 7 dark chocolates.\          |
| Miki selects a chocolate at random, eats it, and selects a        |
| second.                                                           |
|                                                                   |
| Find the probability:                                             |
|                                                                   |
| a.  She picks two milk chocolates.                                |
|                                                                   |
| b.  Two different types of chocolates.                            |
|                                                                   |
| c.  Two chocolates of the same type.                              |
|                                                                   |
| d.  At least one dark chocolate.                                  |
|                                                                   |
| $$a)\frac{2}{72} = \frac{1}{36}$$                                 |
|                                                                   |
| $$b)\frac{28}{72} = \frac{7}{18}$$                                |
|                                                                   |
| $$c)\frac{44}{72} = \frac{11}{18}$$                               |
|                                                                   |
| $$d)\frac{70}{72} = \frac{35}{36}$$                               |
+-------------------------------------------------------------------+

Foundation

1.  Suppose that A, B, C and D are independent events, with\
    $$P(A) = \frac{1}{8},\ \ P(B) = \frac{1}{3},\ \ P(C) = \frac{1}{4}\ \ \ \ \ \ \ and\ \ \ \ \ \ \ \ P(D) = \frac{2}{7}$$

Use the product rule to find:

+----------------------+----------------------+----------------------+
| a.  P(AB)            | b.  P(AD)            | c.  P(BC)            |
|                      |                      |                      |
| $$\frac{1}{24}$$     | $$\frac{1}{28}$$     | $$\frac{1}{12}$$     |
+======================+======================+======================+
| d.  P(ABC)           | e.  P(BCD)           | f.  P(ABCD)          |
|                      |                      |                      |
| $$\frac{1}{96}$$     | $$\frac{1}{42}$$     | $$\frac{1}{336}$$    |
+----------------------+----------------------+----------------------+

2.  A coin and a die are tossed. Use the product rule to find the
    probability of obtaining:

+-----------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+
| a.  a three and a head                                                                                    | b.  a six and a tail                                                                                      |
|                                                                                                           |                                                                                                           |
| $$P(3\ and\ H) = \ \left( \frac{1}{6} \right)\left( \frac{1}{2} \right) = \frac{1}{12}$$                  | $$P(6\ and\ T) = \ \left( \frac{1}{6} \right)\left( \frac{1}{2} \right) = \frac{1}{12}$$                  |
+===========================================================================================================+===========================================================================================================+
| c.  an even number and a tail                                                                             | d.  a number less than five and a head                                                                    |
|                                                                                                           |                                                                                                           |
| $$P(even\ and\ T) = \ \left( \frac{3}{6} \right)\left( \frac{1}{2} \right) = \frac{3}{12} = \frac{1}{4}$$ | $$P( < 5\ and\ H) = \ \left( \frac{4}{6} \right)\left( \frac{1}{2} \right) = \frac{4}{12} = \frac{1}{3}$$ |
+-----------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+

3.  Two marbles are picked at random, one from a bag containing three
    red and four blue marbles, and the other from a bag containing five
    red and two blue marbles.\
    Find the probability of drawing:

+----------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------+
| a.  two red marbles                                                                    | b.  two blue marbles                                                                   | c.  a red marble from the first bag and a blue marble from the second                |
|                                                                                        |                                                                                        |                                                                                      |
| $$P(2\ red) = \ \left( \frac{3}{7} \right)\left( \frac{5}{7} \right) = \frac{15}{49}$$ | $$P(2\ blue) = \ \left( \frac{4}{7} \right)\left( \frac{2}{7} \right) = \frac{8}{49}$$ | $$P(R,\ B) = \ \left( \frac{3}{7} \right)\left( \frac{2}{7} \right) = \frac{6}{49}$$ |
+========================================================================================+========================================================================================+======================================================================================+

4.  A box of chocolates contains 3 Freddo Frogs and 1 Caramello Koalas.

Two chocolates are taken out of the box **without replacement**.

a.  If the first chocolate was a Freddo Frog,

What is the probability the second chocolate is a Freddo Frog?

$$\frac{2}{3}$$

b.  If the first chocolate was a Freddo Frog,

What is the probability the second chocolate is a Caramello Koala?

$$\frac{1}{3}$$

c.  If the first chocolate was a Caramello Koala,

What is the probability the second chocolate is Freddo Frog?

$$1$$

d.  If the first chocolate was a Caramello Koala,

What is the probability the second chocolate is Caramello Koala?

$$0$$

5.  A box contains five light bulbs, two of which are faulty.\
    Two bulbs are selected, one at a time **without replacement**. Find
    the probability that:

+----------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+
| a.  both bulbs are faulty                                                                                            | b.  neither bulb is faulty                                                                                                   |
|                                                                                                                      |                                                                                                                              |
| $$P(both\ faulty) = \ \left( \frac{2}{5} \right)\left( \frac{1}{4} \right) = \frac{2}{20} = \frac{1}{10}$$           | $$P(neither\ faulty) = \ \left( \frac{3}{5} \right)\left( \frac{2}{4} \right) = \frac{6}{20} = \frac{3}{10}$$                |
+======================================================================================================================+==============================================================================================================================+
| c.  the first bulb is faulty and the second one is not                                                               | d.  the second bulb is faulty and the first one is not                                                                       |
|                                                                                                                      |                                                                                                                              |
| $$P(1st\ faulty,\ 2nd\ not) = \ \left( \frac{2}{5} \right)\left( \frac{3}{4} \right) = \frac{6}{20} = \frac{3}{10}$$ | $$P(1st\ not\ faulty,\ 2nd\ faulty) = \ \left( \frac{3}{5} \right)\left( \frac{2}{4} \right) = \frac{6}{20} = \frac{3}{10}$$ |
+----------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+

6.  A box contains twelve red and ten green discs.\
    Three discs are selected, one at a time **with replacement**

    a.  What is the probability that the discs selected are red, green,
        red in that order?

$$P(R,G,R) = \ \left( \frac{12}{22} \right)\left( \frac{10}{22} \right)\left( \frac{12}{22} \right) = \frac{1440}{10648} = \frac{180}{1331}$$

b.  What is the probability of this event if the disc is **not
    replaced** after each draw?

$$P(R,G,R) = \ \left( \frac{12}{22} \right)\left( \frac{10}{21} \right)\left( \frac{11}{20} \right) = \frac{1320}{9240} = \frac{1}{7}$$

7.  A bag contains three black and four white discs. A disc is selected
    from the bag, its colour is noted, and it is then returned to the
    bag before a second disc is drawn.

    a.  ![](media/Probability and Data 2_Probability/media/image14.png){width="2.3596084864391953in"
        height="2.234782370953631in"}By multiplying along the branches
        of the tree, find:

        i.  P(BB)

$$\frac{9}{49}$$

ii. P(BW)

$$\frac{12}{49}$$

iii. P(WB)

$$\frac{12}{49}$$

iv. P(WW)

$$\frac{16}{49}$$

b.  Hence, by adding, find the probability that:

    i.  both discs drawn have the same colour,

$$P(same\ colour) = \ P(BB) + \ P(WW) = \frac{9}{49} + \frac{16}{49} = \frac{25}{49}$$

ii. the discs drawn have different colours.

$$P(different\ colours) = \ P(BW) + \ P(WB) = \frac{12}{49} + \frac{12}{49} = \frac{24}{49}$$

8.  Two light bulbs are selected at random from a large batch of bulbs
    in which 5% are defective.

    a.  By multiplying along the branches of the tree, find:

        i.  P(both bulbs work),

![](media/Probability and Data 2_Probability/media/image15.png){width="2.1506944444444445in"
height="2.0479166666666666in"}

P(both work) = (0.95)(0.95) = 0.9025 = 90.25%

ii. P(the first works, but the second is defective),

P(1st works, 2nd defective) = (0.95)(0.05) = 0.0475 = 4.75%

iii. P(the first is defective, but the second works),

P(1st defective, 2nd works) = (0.05)(0.95) = 0.0475 = 4.75%

iv. P(both bulbs are defective).

P(both defective) = (0.05)(0.05) = 0.0025 = 0.25%

b.  Hence find the probability that at least one bulb works.

P(at least one works) = 1 - P(both defective) = 1 - 0.0025 = 0.9975 =
99.75%

9.  One bag contains three red and two blue balls and another bag
    contains two red and three blue balls. A ball is drawn at random
    from each bag.

    a.  Complete the tree diagram by writing the probabilities on the
        branches.

    b.  By multiplying along the branches of the tree, find:

        i.  ![](media/Probability and Data 2_Probability/media/image16.png){width="2.2322276902887137in"
            height="1.9002559055118111in"}![](media/Probability and Data 2_Probability/media/image17.png){width="2.253533464566929in"
            height="1.744070428696413in"}P(RR)

$$P(RR) = \ \left( \frac{3}{5} \right)\left( \frac{2}{5} \right) = \frac{6}{25}$$

ii. P(RB)

$$P(RB) = \ \left( \frac{3}{5} \right)\left( \frac{3}{5} \right) = \frac{9}{25}$$

iii. P(BR)

$$P(BR) = \ \left( \frac{2}{5} \right)\left( \frac{2}{5} \right) = \frac{4}{25}$$

iv. P(BB)

$$P(BB) = \ \left( \frac{2}{5} \right)\left( \frac{3}{5} \right) = \frac{6}{25}$$

c.  Hence, by adding, find the probability that:

    i.  the balls have the same colour,

$$P(RR) + \ P(BB) = \frac{6}{25} + \frac{6}{25} = \frac{12}{25}$$

ii. the balls have different colours.

$$P(RB) + \ P(BR) = \frac{9}{25} + \frac{4}{25} = \frac{13}{25}$$

Development

10. A bag contains 5 blue (B) and 3 white (W) marbles.\
    Mary picks 2 marbles **without replacement.**

    a.  Complete the tree diagram by writing the probabilities on the
        branches and the probability of each event.

![](media/Probability and Data 2_Probability/media/image18.png){width="3.9756944444444446in"
height="2.0229166666666667in"}![](media/Probability and Data 2_Probability/media/image19.png){width="1.6875in"
height="1.8770833333333334in"}

b.  Find the probability of selecting:

+------------------+-------------------+---------------------------------------------------+-------------------------------+
| i.  Two blue     | ii. A blue and a  | iii. One of each colour                           | iv. At least one blue marble  |
|     marbles      |     white in that |                                                   |                               |
|                  |     order         | $$P(BW) + P(WB) = \frac{30}{56} = \frac{15}{28}$$ | $$1 - P(WW) = \frac{25}{28}$$ |
| $$\frac{5}{14}$$ |                   |                                                   |                               |
|                  | $$\frac{15}{56}$$ |                                                   |                               |
+==================+===================+===================================================+===============================+

11. In group A there are three girls and seven boys, and in group B
    there are six girls and four boys. One person is chosen at random
    from each group.

    a.  ![](media/Probability and Data 2_Probability/media/image20.png){width="2.4397287839020123in"
        height="1.968503937007874in"}Draw a probability tree diagram.

    b.  By multiplying along the branches of the tree, find:

+------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------+
| i.  P(GG)                                                                                            | ii. P(GB)                                                                                            | iii. P(BG)                                                                                            | iv. P(BB)                                                                                            |
|                                                                                                      |                                                                                                      |                                                                                                       |                                                                                                      |
| $$P(GG) = \ \left( \frac{3}{10} \right)\left( \frac{6}{10} \right) = \frac{18}{100} = \frac{9}{50}$$ | $$P(GB) = \ \left( \frac{3}{10} \right)\left( \frac{4}{10} \right) = \frac{12}{100} = \frac{3}{25}$$ | $$P(BG) = \ \left( \frac{7}{10} \right)\left( \frac{6}{10} \right) = \frac{42}{100} = \frac{21}{50}$$ | $$P(BB) = \ \left( \frac{7}{10} \right)\left( \frac{4}{10} \right) = \frac{28}{100} = \frac{7}{25}$$ |
+======================================================================================================+======================================================================================================+=======================================================================================================+======================================================================================================+

a.  Hence, by adding, find the probability that:

+--------------------------------------------------------------------+--------------------------------------------------------------------+
| i.  two boys or two girls are chosen                               | ii. one boy and one girl are chosen                                |
|                                                                    |                                                                    |
| $$P(GG) + \ P(BB) = \frac{9}{50} + \frac{14}{50} = \frac{23}{50}$$ | $$P(GB) + \ P(BG) = \frac{6}{50} + \frac{21}{50} = \frac{27}{50}$$ |
+====================================================================+====================================================================+

12. ![](media/Probability and Data 2_Probability/media/image21.png){width="2.3840004374453194in"
    height="1.8273501749781278in"}There is an 80% chance that Garry will
    pass his driving test and a 90% chance that Emma will pass hers.\
    Draw a probability tree diagram.

find the chance that

+-----------------------------------+-----------------------------------------------------------+
| a.  Garry passes and Emma fails   | b.  Garry fails and Emma passes                           |
|                                   |                                                           |
| $$(0.8)(0.1) = \ 0.08\  = \ 8\%$$ | $$(0.2)(0.9) = \ 0.18\  = \ 18\%$$                        |
+===================================+===========================================================+
| c.  only one of Garry and Emma    | d.  at least one fails                                    |
|     passes                        |                                                           |
|                                   | $$1\  - \ P(both\ pass) = \ 1\  - \ (0.8)(0.9) = \ 28\%$$ |
| $$8\%\  + \ 18\%\  = \ 26\%\ $$   |                                                           |
+-----------------------------------+-----------------------------------------------------------+

13. Two animals are selected from rabbits (R) and 4 guinea pigs (G)
    **without replacement.**

Draw a tree diagram and the find the probability of each possible event.

![](media/Probability and Data 2_Probability/media/image22.png){width="3.6233497375328083in"
height="2.0570603674540684in"}

What is the probability of selecting

+---------------------------------+---------------------------------+
| a.  1 of each animal            | b.  2 of the same animal        |
|                                 |                                 |
| $$P(RG) + P(GR) = \frac{4}{7}$$ | $$P(RR) + P(GG) = \frac{3}{7}$$ |
+=================================+=================================+
| c.  No rabbits                  | d.  At least one rabbit         |
|                                 |                                 |
| $$P(GG) = \frac{2}{7}$$         | $$1 - P(GG) = \frac{5}{7}$$     |
+---------------------------------+---------------------------------+

14. The probability that a set of traffic lights will be green when you
    arrive at them is 0.6.\
    A motorist drives through two sets of lights. Assuming that the two
    sets of traffic lights are independent of each other, find the
    probability that:

    a.  both sets of lights will be green,

    b.  at least one set of lights will be green.

$$a)\ P(both\ green) = \ \left( \frac{3}{5} \right)\left( \frac{3}{5} \right) = \frac{9}{25}$$

$$b)\ P(at\ least\ one\ green) = \ 1\  - \ P(both\ not\ green) = \ 1\  - \ \left( \frac{2}{5} \right)\left( \frac{2}{5} \right) = \ 1\  - \frac{4}{25} = \frac{21}{25}$$

15. A factory assembles calculators. Each calculator requires a chip and
    a battery.\
    It is known that 1% of chips and 4% of batteries are defective.\
    Find the probability that a calculator selected at random will have
    at least one defective component.

P(at least one defective) = 1 - P(both work) = 1 - (0.99)(0.96) = 1 -
0.9504 = 0.0496 = 4.96%

16. The probability of a woman being alive at 80 years of age is 0.2,
    and the probability of her husband being alive at 80 years of age is
    0.05. Find the probability that:

    a.  they will both live to be 80 years of age,

    b.  only one of them will live to be 80.

a\) P(both alive at 80) = (0.2)(0.05) = 0.01

b\) P(only one alive at 80) = (0.2)(0.95) + (0.8)(0.05) = 0.19 + 0.04 =
0.23

Mastery

17. In a raffle in which there are 200 tickets, the first prize is drawn
    and then the second prize is drawn without replacing the winning
    ticket. If you buy 15 tickets, find the probability that you win:

    a.  both prizes,

    b.  at least one prize.

$$P(both\ prizes) = \ \left( \frac{15}{200} \right) \times \ \left( \frac{14}{199} \right) = \frac{210}{39800} = \frac{21}{3980}$$

$$\ P(at\ least\ one)\  = \ 1\  - \ P(no\ prizes) = \ 1\  - \ \left( \frac{185}{200} \right) \times \ \left( \frac{184}{199} \right) = \ \frac{144}{995}$$

18. A box contains 10 chocolates, all of identical appearance. Three of
    the chocolates have caramel centres and the other seven have mint
    centres. Hugo randomly selects and eats three chocolates from the
    box. Find the probability that:

    a.  the first chocolate Hugo eats is caramel,

    b.  Hugo eats three mint chocolates,

    c.  Hugo eats exactly one caramel chocolate.

$$P(1st\ is\ caramel) = \frac{3}{10}$$

$$P(three\ mint) = \ \left( \frac{7}{10} \right) \times \ \left( \frac{6}{9} \right) \times \ \left( \frac{5}{8} \right) = \frac{210}{720} = \frac{7}{24}$$

$$P(exactly\ one\ caramel) = \ 3\  \times \ \left( \frac{3}{10} \right) \times \ \left( \frac{7}{9} \right) \times \ \left( \frac{6}{8} \right) = \frac{378}{720} = \frac{21}{40}$$

19. In an aviary there are four canaries, five cockatoos and three
    budgerigars. If two birds are selected at random, find the
    probability that:

    a.  both are canaries,

    b.  neither is a canary,

    c.  one is a canary and one is a cockatoo,

    d.  at least one is a canary.

$$P(both\ canaries) = \ \left( \frac{4}{12} \right) \times \ \left( \frac{3}{11} \right) = \frac{12}{132} = \frac{1}{11}$$

$$P(neither\ canary) = \ \left( \frac{8}{12} \right) \times \ \left( \frac{7}{11} \right) = \frac{56}{132} = \frac{14}{33}$$

$$P(one\ canary,\ one\ cockatoo) = \ 2\  \times \ \left( \frac{4}{12} \right) \times \ \left( \frac{5}{11} \right) = \frac{40}{132} = \frac{10}{33}$$

$$P(at\ least\ one\ canary) = \ 1\  - \ P(neither\ canary) = \ 1\  - \frac{14}{33} = \frac{19}{33}$$

20. Max and Jack each throw a die. Find the probability that:

    a.  they do not throw the same number,

    b.  the number thrown by Max is greater than the number thrown by
        Jack,

    c.  the numbers they throw differ by three.

A two-way table is useful for this question.

$$P(different\ numbers) = \ 1\  - \ P(same) = \ 1\  - \frac{6}{36} = \frac{30}{36} = \frac{5}{6}$$

$$P(Max\  > \ Jack) = \frac{15}{36} = \frac{5}{12}$$

$$P(differ\ by\ 3) = \frac{6}{36} = \frac{1}{6}$$

21. A game is played in which two coloured dice are rolled once.\
    The six faces of the black die are numbered 5, 7, 8, 10, 11, 14.\
    The six faces of the white die are numbered 3, 6, 9, 12, 13, 15.\
    The player wins if the number on the black die is bigger than the
    number on the white die.

    a.  Calculate the probability of a player winning the game.

    b.  Calculate the probability that a player will lose at least once
        in two consecutive games.

    c.  How many games must be played before you have a 90% chance of
        winning at least one game? (hint: set up an equation and use
        logarithms)

A two-way table is useful for this question

$$P(win) = \frac{16}{36} = \frac{4}{9}$$

$$P(lose\ at\ least\ once\ in\ 2\ games) = \ 1\  - \ P(win\ both)$$

$$= \ 1\  - \ \left( \frac{4}{9} \right)^{2} = \ 1\  - \frac{16}{81} = \frac{65}{81}$$

$$P(win\ at\ least\ once\ in\ n\ games)\  \geq \ 0.9$$

$$1\  - \ \left( \frac{5}{9} \right)^{n}\  \geq \ 0.9$$

$$\left( \frac{5}{9} \right)^{n}\  \leq \ 0.1$$

$$n\  \geq \log_{\frac{5}{9}}{0.1} \geq 3.917\ldots$$

$$\therefore 4\ games\ or\ more$$

Note: we flip the inequality when taking a log of a base that is less
than one.

You do not need to know this fact; intuitively, it must be more than 4
games, not less than 4.

22. An interviewer conducts a poll in Sydney and Melbourne on the
    popularity of the prime minister. In Sydney, 52% of the population
    approve of the prime minister, and in Melbourne her approval rating
    is 60%. If one of the two capital cities is selected at random and
    two electors from that city are surveyed, find the probability that:

    a.  both electors approve of the prime minister,

    b.  at least one elector approves of the prime minister.

A three-stage tree diagram is needed here.

$$a)\ P(Syd,Approve,Approve) + P(Mel,\ Approve,Approve) = (0.5)(0.52)(0.52) + (0.5)(0.6)(0.6) = 31.52\%$$

$$b)\ 1 - P(both\ disapprove) = 1 - \left( P(Syd,\ Disapprove,Disapprove) + P(Mel,Disapprove,Disapprove) \right)$$

$$= 1 - \left( (0.5)(0.48)(0.48) + (0.5)(0.4)(0.4) \right)$$

$$= 80.48\%$$

23. In a bag there are four green, three blue and five red discs.

> Two discs are drawn at random, and the first disc is not replaced
> before the second disc is drawn. Find the probability of drawing:

a.  two red discs,

b.  one red and one blue disc,

c.  at least one green disc,

d.  a blue disc on the first draw,

e.  two discs of the same colour,

f.  two differently coloured discs.

$$P(two\ red) = \ \left( \frac{5}{12} \right)\left( \frac{4}{11} \right) = \frac{20}{132} = \frac{5}{33}$$

$$P(one\ red,\ one\ blue) = \ \left( \frac{5}{12} \right)\left( \frac{3}{11} \right) + \ \left( \frac{3}{12} \right)\left( \frac{5}{11} \right) = \frac{30}{132} = \frac{5}{22}$$

$$P(at\ least\ one\ green) = \ 1\  - \ P(no\ green) = \ 1\  - \ \left( \frac{8}{12} \right)\left( \frac{7}{11} \right) = \ 1\  - \frac{56}{132} = \frac{76}{132} = \frac{19}{33}$$

$$P(blue\ first) = \frac{3}{12} = \frac{1}{4}$$

$$P(same\ colour)\  = \ P(two\ green)\  + \ P(two\ blue)\  + \ P(two\ red)$$

$$= \ \left( \frac{4}{12} \right)\left( \frac{3}{11} \right) + \ \left( \frac{3}{12} \right)\left( \frac{2}{11} \right) + \ \left( \frac{5}{12} \right)\left( \frac{4}{11} \right) = \frac{19}{66}$$

$$P(different\ colours) = \ 1\  - \ P(same\ colour) = \ 1\  - \frac{19}{66} = \frac{47}{66}$$

24. **HSC Advanced Sample Question Band 5**

> A box contains $n$ marbles, of which $k$ marbles are coloured red and
> the remainder of the marbles are coloured green. Two marbles are drawn
> randomly from the box.
>
> ![](media/Probability and Data 2_Probability/media/image23.png){width="3.471213910761155in"
> height="3.7830194663167105in"}If the first marble is not replaced into
> the box before the second marble is drawn, then the probability that
> the two marbles drawn are the same colour is:

![](media/Probability and Data 2_Probability/media/image24.png){width="2.6981135170603676in"
height="2.032344706911636in"}

D

25. **2008 HSC Advanced Band 5**

> ![](media/Probability and Data 2_Probability/media/image25.png){width="3.1343285214348207in"
> height="2.6230074365704286in"}![](media/Probability and Data 2_Probability/media/image26.png){width="3.8048140857392827in"
> height="2.013011811023622in"}Xena and Gabrielle compete in a series of
> games. The series finishes when one player has won two games. In any
> game, the probability that Xena wins is $\frac{2}{3}$ and the
> probability that Gabrielle wins is $\frac{1}{3}$. Part of the tree
> diagram for this series of games is shown.

a.  Complete the tree diagram, showing the possible outcomes (there are
    only 6).

b.  What is the probability Gabrielle wins the series?

$$P(XGG) + P(GXG) + P(GG) = \frac{2}{27} + \frac{2}{27} + \frac{1}{9} = \frac{7}{27}$$

c.  What is the probability three games are played in the series?

$$1 - \left( P(XX) + P(GG) \right) = 1 - \left( \frac{4}{9} + \frac{1}{9} \right) = \frac{4}{9}$$

# Probability of Compound Events using Venn Diagrams

+--------------------------------------------------------------------------------------------------------------------------------------+
| - **Mutually Exclusive Events**                                                                                                      |
+:================================================================================================:+:=================================:+
| **Mutually Exclusive**                                                                           | **Non-mutually exclusive**        |
|                                                                                                  |                                   |
| Mutually exclusive events cannot occur at the same time.                                         | Non-mutually exclusive events can |
|                                                                                                  | occur at the same time.           |
| ![2 Venn diagrams of mutually and non-mutually exclusive events. Details in text following the   |                                   |
| image.](media/Probability and Data 2_Probability/media/image27.png){width="2.3895833333333334in" | The Venn diagram overlaps.        |
| height="1.8in"}![2 Venn diagrams of mutually and non-mutually exclusive events. Details in text  |                                   |
| following the                                                                                    |                                   |
| image.](media/Probability and Data 2_Probability/media/image27.png){width="2.3895833333333334in" |                                   |
| height="1.8in"}The Venn diagram does not overlap.                                                |                                   |
+--------------------------------------------------------------------------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| - **Identify** events as mutually exclusive or not.                   |
+===================================+===================================+
| a.  Liking maths, liking science  | b.  Liking maths, not liking      |
|                                   |     maths                         |
| - Mutually exclusive              |                                   |
|                                   | - Mutually exclusive              |
| - Non-mutually exclusive          |                                   |
|                                   | - Non-mutually exclusive          |
+-----------------------------------+-----------------------------------+
| c.  Even number, odd number       | d.  Owning a dog, owning a cat    |
|                                   |                                   |
| - Mutually exclusive              | - Mutually exclusive              |
|                                   |                                   |
| - Non-mutually exclusive          | - Non-mutually exclusive          |
+-----------------------------------+-----------------------------------+
| e.  Vowel, consonant              | f.  Tossing a head, tossing a     |
|                                   |     tail                          |
| - Mutually exclusive              |                                   |
|                                   | - Mutually exclusive              |
| - Non-mutually exclusive          |                                   |
|                                   | - Non-mutually exclusive          |
+-----------------------------------+-----------------------------------+
| g.  Having a tail, having four    | h.  Winning a game, not winning a |
|     legs                          |     game                          |
|                                   |                                   |
| - Mutually exclusive              | - Mutually exclusive              |
|                                   |                                   |
| - Non-mutually exclusive          | - Non-mutually exclusive          |
+-----------------------------------+-----------------------------------+

+---------------------------------------------------------------------------------------------+
| - **Venn Diagrams**                                                                         |
+=============================================================================================+
| ![](media/Probability and Data 2_Probability/media/image28.png){width="2.325153105861767in" |
| height="1.6047364391951007in"}Venn diagrams visualise two events and their overlap.\        |
| When working with probability, the numbers represent the size of the sets.                  |
+---------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** Venn diagrams                                                                                                                                                                                                                |
+===================================================================================+=========================+================================================================================================================================+
| The Venn diagrams below represent a group of people who were surveyed on whether they like tea and coffee. Shade the area on the Venn diagram and two-way table that represents:                                                             |
+-----------------------------------------------------------------------------------+-------------------------+--------------------------------------------------------------------------------------------------------------------------------+
| a.  People who like tea                                                           | b.  People who like     | c.  ![](media/Probability and Data 2_Probability/media/image29.png){width="1.76875in"                                          |
|                                                                                   |     coffee              |     height="1.2305555555555556in"}![](media/Probability and Data 2_Probability/media/image29.png){width="1.7690955818022747in" |
|                                                                                   |                         |     height="1.2308016185476816in"}People who like tea only                                                                     |
|                                                                                   |                         |                                                                                                                                |
|                                                                                   |                         | ![](media/Probability and Data 2_Probability/media/image29.png){width="1.7690955818022747in" height="1.2308016185476816in"}    |
+-----------------------------------------------------------------------------------+-------------------------+--------------------------------------------------------------------------------------------------------------------------------+
| d.  People who like coffee only                                                   | e.  People who like     | f.  ![](media/Probability and Data 2_Probability/media/image29.png){width="1.76875in"                                          |
|                                                                                   |     both tea and coffee |     height="1.2305555555555556in"}![](media/Probability and Data 2_Probability/media/image29.png){width="1.76875in"            |
|                                                                                   |                         |     height="1.2305555555555556in"}![](media/Probability and Data 2_Probability/media/image29.png){width="1.7690955818022747in" |
|                                                                                   |                         |     height="1.2308016185476816in"}People who like tea or people who like coffee                                                |
+-----------------------------------------------------------------------------------+-------------------------+--------------------------------------------------------------------------------------------------------------------------------+
| g.  People who don't like tea                                                     | h.  People who don't    | i.  ![](media/Probability and Data 2_Probability/media/image29.png){width="1.76875in"                                          |
|                                                                                   |     like coffee         |     height="1.2305555555555556in"}![](media/Probability and Data 2_Probability/media/image29.png){width="1.76875in"            |
|                                                                                   |                         |     height="1.2305555555555556in"}![](media/Probability and Data 2_Probability/media/image29.png){width="1.76875in"            |
|                                                                                   |                         |     height="1.2305555555555556in"}People who like neither tea nor coffee                                                       |
+-----------------------------------------------------------------------------------+-------------------------+--------------------------------------------------------------------------------------------------------------------------------+
| j.  Everyone surveyed                                                             | k.  People who like tea |                                                                                                                                |
|                                                                                   |     or coffee, but not  |                                                                                                                                |
| ![](media/Probability and Data 2_Probability/media/image29.png){width="1.76875in" |     both.               |                                                                                                                                |
| height="1.2305555555555556in"}                                                    |                         |                                                                                                                                |
|                                                                                   |                         |                                                                                                                                |
| ![](media/Probability and Data 2_Probability/media/image29.png){width="1.76875in" |                         |                                                                                                                                |
| height="1.2305555555555556in"}                                                    |                         |                                                                                                                                |
+-----------------------------------------------------------------------------------+-------------------------+--------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------+
| - **Example** Interpret Venn diagrams and two-way tables.                                       |
+================================================+================================================+
| ![](media/Probability and Data 2_Probability/media/image30.png){width="1.9712839020122486in"    |
| height="1.3779527559055118in"}A survey was conducted to see people's preferences on tea and     |
| coffee.\                                                                                        |
| The data is recorded in the Venn diagram.                                                       |
|                                                                                                 |
| How many students:                                                                              |
+------------------------------------------------+------------------------------------------------+
| a.  Were surveyed in total? 50                 | b.  Like tea and coffee? 20                    |
+------------------------------------------------+------------------------------------------------+
| c.  Like tea or like coffee? 45                | d.  Like neither tea nor coffee? 5             |
+------------------------------------------------+------------------------------------------------+
| e.  Like coffee only? 10                       | f.  Like tea only? 15                          |
+------------------------------------------------+------------------------------------------------+
| g.  Like tea? 35                               | h.  Like coffee? 30                            |
+------------------------------------------------+------------------------------------------------+
| i.  Dislike coffee? 20                         | j.  Dislike tea? 15                            |
+------------------------------------------------+------------------------------------------------+
| What is the probability that a randomly selected person:                                        |
+------------------------------------------------+------------------------------------------------+
| k.  Likes coffee?                              | l.  Likes tea and coffee?                      |
|                                                |                                                |
| $$P(T) = \frac{30}{50} = \frac{3}{5}$$         | $$P(T) = \frac{20}{50} = \frac{2}{5}$$         |
+------------------------------------------------+------------------------------------------------+

+-------------------------------------------------------------------------------------------------+
| - **Example** Interpret Venn diagrams and two-way tables.                                       |
+================================================+================================================+
| ![](media/Probability and Data 2_Probability/media/image31.png){width="2.008121172353456in"     |
| height="1.3779527559055118in"}A survey was conducted to see people's elective subjects.\        |
| The data is recorded in the Venn diagram.                                                       |
|                                                                                                 |
| How many students:                                                                              |
+------------------------------------------------+------------------------------------------------+
| a.  Were surveyed?                             | b.  Take Chinese and art?                      |
|                                                |                                                |
| 50                                             | 9                                              |
+------------------------------------------------+------------------------------------------------+
| c.  Take Chinese or art?                       | d.  Take neither Chinese nor art?              |
|                                                |                                                |
| 42                                             | 8                                              |
+------------------------------------------------+------------------------------------------------+
| e.  Take Art only?                             | f.  Take Chinese only?                         |
|                                                |                                                |
| 12                                             | 21                                             |
+------------------------------------------------+------------------------------------------------+
| g.  Take Art?                                  | h.  Take Chinese?                              |
|                                                |                                                |
| 21                                             | 30                                             |
+------------------------------------------------+------------------------------------------------+
| i.  Don't take Chinese?                        | j.  Don't take art?                            |
|                                                |                                                |
| 20                                             | 29                                             |
+------------------------------------------------+------------------------------------------------+
| What is the probability that a randomly selected person:                                        |
+------------------------------------------------+------------------------------------------------+
| a.  Takes Chinese?                             | b.  Takes art only?                            |
|                                                |                                                |
| $$\frac{30}{50} = \frac{3}{5}$$                | $$\frac{12}{50} = \frac{6}{25}$$               |
+------------------------------------------------+------------------------------------------------+

+-------------------------------------------------------------------+
| - **Constructing Venn Diagrams from a Scenario**                  |
+===================================================================+
| 1.  Read the entire scenario and identify what is given.          |
|                                                                   |
| 2.  Place "A only, "B only", "both", "neither" in its region.     |
|                                                                   |
| 3.  Find missing values by subtraction.                           |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------+
| - **Construct** Venn diagrams from a scenario.                                               |
+==============================================================================================+
| 12 friends are at a party.\                                                                  |
| 9 people eat chicken nuggets.\                                                               |
| 6 people eat salad.\                                                                         |
| 2 people eat neither.                                                                        |
|                                                                                              |
| a.  Draw a Venn diagram to represent this information.                                       |
|                                                                                              |
| ![](media/Probability and Data 2_Probability/media/image32.png){width="2.2663462379702537in" |
| height="1.5748031496062993in"}                                                               |
|                                                                                              |
| b.  Find the probability that a randomly chosen person ate both.                             |
+----------------------------------------------------------------------------------------------+
| There are 30 girls in a class.\                                                              |
| 13 play tennis.\                                                                             |
| 23 play netball.\                                                                            |
| 7 girls play both.                                                                           |
|                                                                                              |
| a.  Draw a Venn diagram to represent this information.                                       |
|                                                                                              |
| ![](media/Probability and Data 2_Probability/media/image33.png){width="2.2644214785651795in" |
| height="1.5748031496062993in"}                                                               |
|                                                                                              |
| b.  What is the probability that a girl chosen at random plays neither sport?                |
+----------------------------------------------------------------------------------------------+

Foundation

1.  A survey of 30 people found that 21 play AFL and 12 play soccer.\
    Also, 7 people play both AFL and soccer and 4 play neither AFL nor
    soccer.

    a.  Construct the Venn diagram for the survey results.

![](media/Probability and Data 2_Probability/media/image34.png){width="2.0440452755905514in"
height="1.1811023622047243in"}

b.  If one of the 30 people was randomly selected, find:

+-----------------------------------+---------------------------------+----------------------------------+
| i.  $P(AFL\ or\ soccer)$          | ii. $P(do\ not\ play\ soccer)$  | iii. $P(only\ AFL)$              |
|                                   |                                 |                                  |
| $$\frac{26}{30} = \frac{13}{15}$$ | $$\frac{18}{30} = \frac{3}{5}$$ | $$\frac{14}{30} = \frac{7}{15}$$ |
+===================================+=================================+==================================+

2.  For each Venn diagram, find the probabilities.

+-------------------------------------------------------------------------------------------------------------------+---------------------------------+
| a.  ![](media/Probability and Data 2_Probability/media/image35.png){width="1.44375in"                             | b.                              |
|     height="0.825in"}![](media/Probability and Data 2_Probability/media/image36.png){width="1.4434787839020122in" |                                 |
|     height="0.835155293088364in"}                                                                                 | $$P(A)$$                        |
|                                                                                                                   |                                 |
| $$P(A)$$                                                                                                          | $$\frac{3}{7}$$                 |
|                                                                                                                   |                                 |
| $$\frac{2}{5}$$                                                                                                   | $$P(A\ only)$$                  |
|                                                                                                                   |                                 |
| $$P(A\ only)$$                                                                                                    | $$\frac{12}{35}$$               |
|                                                                                                                   |                                 |
| $$\frac{1}{3}$$                                                                                                   | $$P(not\ B)$$                   |
|                                                                                                                   |                                 |
| $$P(not\ B)$$                                                                                                     | $$\frac{13}{35}$$               |
|                                                                                                                   |                                 |
| $$\frac{7}{15}$$                                                                                                  | $$P(A\ and\ B)$$                |
|                                                                                                                   |                                 |
| $$P(A\ and\ B)$$                                                                                                  | $$\frac{3}{35}$$                |
|                                                                                                                   |                                 |
| $$\frac{1}{15}$$                                                                                                  | $$P(A\ or\ B)$$                 |
|                                                                                                                   |                                 |
| $$P(A\ or\ B)$$                                                                                                   | $$\frac{34}{35}$$               |
|                                                                                                                   |                                 |
| $$\frac{13}{15}$$                                                                                                 | $$P(neither\ A\ nor\ B)$$       |
|                                                                                                                   |                                 |
| $$P(neither\ A\ nor\ B)$$                                                                                         | $$\frac{1}{35}$$                |
|                                                                                                                   |                                 |
| $$\frac{2}{15}$$                                                                                                  |                                 |
+===================================================================================================================+=================================+

Development

3.  The Venn diagram below shows the number of students speaking French
    and Italian in a classroom of 80 students.

First find the missing information, then find the probability that a
randomly chosen student:

a.  ![](media/Probability and Data 2_Probability/media/image37.png){width="2.3819444444444446in"
    height="1.5934022309711287in"}Speaks neither French nor Italian.

$$\frac{21}{80}$$

b.  Speaks Italian or French, but not both.

$$\frac{5}{8}$$

c.  Speaks Italian and French.

$$\frac{9}{80}$$

d.  Speaks Italian or French.

$$\frac{59}{80}$$

4.  In a group of 50 students, there are 26 who study Latin, 15 who
    study Greek and 8 who study both languages. Draw a Venn diagram and
    find the probability that a student chosen at random:

    a.  studies only Latin,

    b.  studies only Greek,

    c.  does not study either

$$a)\frac{9}{25}$$

$$b)\frac{7}{50}$$

$$c)\frac{17}{50}$$

5.  Each student in a music class of 28 studies either the piano or the
    violin or both. It is known that 20 study the piano and 15 study the
    violin. Find the probability that a student selected at random
    studies both instruments.

$$\frac{1}{4}$$

Mastery

6.  Of 15 courier companies:\
    9 offer a local service (L), 7 offer an interstate service (S) and 6
    offer an international service (I). 2 companies offer all three
    services, 3 offer both local and interstate services, 5 offer only
    local services and 1 offers only an international service.

    a.  Complete the Venn diagram to display the given information.

![](media/Probability and Data 2_Probability/media/image38.png){width="1.8740332458442694in"
height="1.5277777777777777in"}![](media/Probability and Data 2_Probability/media/image39.png){width="1.8742016622922135in"
height="1.540398075240595in"}

b.  If a courier is chosen at random from the 15, find these
    probabilities:

+-----------------+------------------+--------------------+--------------------------+
| i.  $P(L)$      | ii. $P(L\ only)$ | iii. $P(L\ or\ S)$ | iv. $P(L\ and\ S\ only)$ |
|                 |                  |                    |                          |
| $$\frac{3}{5}$$ | $$\frac{1}{3}$$  | $$\frac{13}{15}$$  | $$\frac{1}{15}$$         |
+=================+==================+====================+==========================+

7.  58 people took a trip to Europe to visit either France, England or
    Spain. Of this group,\
    26 visited France, 38 visited England, 29 visited Spain, 10 visited
    France and Spain,\
    12 visited only Spain, 13 visited only England and 8 visited all
    three countries.

> ![](media/Probability and Data 2_Probability/media/image40.png){width="2.1597222222222223in"
> height="2.0930555555555554in"}
>
> A person from the group of 58 was chosen at random. What is the
> probability that the person:

+----------------------+----------------------+----------------------+
| a.  Visited France   | b.  Visited England  | c.  Visited only one |
|     only             |     and France       |     country?         |
|                      |                      |                      |
| $$\frac{3}{29}$$     | $$\frac{9}{29}$$     | $$\frac{31}{58}$$    |
+======================+======================+======================+

8.  Thirty-eight people were interviewed about their travelling
    experience in the past 12 months. The interviewer remembers the
    following information.

- 2 people travelled overseas, interstate and within their own state.

- 2 people travelled overseas and within their own state only.

- 7 people travelled interstate only.

- 22 people travelled within their own state.

- 3 people did not travel at all.

- The number of people who travelled interstate and within their own
  state only was twice the number of people who travelled overseas and
  interstate only.

- The number of people who travelled overseas was equal to the number of
  people who travelled within their own state only.

  a.  Fill in the Venn diagram.

![](media/Probability and Data 2_Probability/media/image41.png){width="4.410416666666666in"
height="2.03125in"}![](media/Probability and Data 2_Probability/media/image42.png){width="4.41044728783902in"
height="2.0052143482064744in"}

b.  Let $x$ be the number of people two travelled overseas and
    interstate only.\
    Let $y$ be the number of travelled overseas only.

> Solve simultaneously to find $x$ and $y$

$$x = 4,\ y = 2$$

c.  If one person from the 38 is chosen at random, find the probability
    that they have travelled:

    i.  Within their own state only

$$\frac{5}{19}$$

ii. Overseas only

$$\frac{1}{19}$$

iii. Interstate only

$$\frac{7}{38}$$

iv. Overseas or interstate or within their own state

$$\frac{35}{38}$$

v.  Interstate or overseas

$$\frac{25}{38}$$

# Compound Events, Venn Diagrams, Set Notation

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Compound Events using Venn Diagrams and Set Notation**                                                                                                                                                                |
+:============================================================================================:+===========================================================================================================================:+
| $$P(A \cup B)$$                                                                              | $$P(A \cap B)$$                                                                                                            |
|                                                                                              |                                                                                                                            |
| Probability of either A or B.                                                                | Probability of both A and B.                                                                                               |
|                                                                                              |                                                                                                                            |
| ![](media/Probability and Data 2_Probability/media/image43.png){width="1.5748031496062993in" |                                                                                                                            |
| height="1.0944761592300962in"}                                                               |                                                                                                                            |
+----------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------+
| $$P\left( A \cap \overline{B} \right)$$                                                      | $$P\left( \overline{A} \cap B \right)$$                                                                                    |
|                                                                                              |                                                                                                                            |
| Probability of A only.                                                                       | ![](media/Probability and Data 2_Probability/media/image45.png){width="1.5743055555555556in"                               |
|                                                                                              | height="1.0993055555555555in"}Probability of B only.                                                                       |
| ![](media/Probability and Data 2_Probability/media/image44.png){width="1.5673611111111112in" |                                                                                                                            |
| height="1.086111111111111in"}                                                                | ![](media/Probability and Data 2_Probability/media/image46.png){width="1.5722222222222222in"                               |
|                                                                                              | height="1.0895833333333333in"}![](media/Probability and Data 2_Probability/media/image47.png){width="1.5673611111111112in" |
|                                                                                              | height="1.0868055555555556in"}                                                                                             |
+----------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------+
| $$P\left( \overline{A} \cap \overline{B} \right) = 1 - P(A \cup B)$$                         | $$P(A \cup B) - P(A \cap B)$$                                                                                              |
|                                                                                              |                                                                                                                            |
| Probability of neither A nor B.                                                              | Probability of A or B but not both.                                                                                        |
|                                                                                              |                                                                                                                            |
| ![](media/Probability and Data 2_Probability/media/image48.png){width="1.5673611111111112in" |                                                                                                                            |
| height="1.09375in"}                                                                          |                                                                                                                            |
+----------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------+
| - **Addition Rule of Probability**                                                                                         |
+============================================================================================================================+
| $$P(A \cup B) = P(A) + P(B) - P(A \cap B)$$                                                                                |
|                                                                                                                            |
| ![](media/Probability and Data 2_Probability/media/image49.png){width="1.1805555555555556in"                               |
| height="0.8166666666666667in"}![](media/Probability and Data 2_Probability/media/image50.png){width="1.1805555555555556in" |
| height="0.8208333333333333in"}![](media/Probability and Data 2_Probability/media/image51.png){width="1.1805555555555556in" |
| height="0.8215277777777777in"}![](media/Probability and Data 2_Probability/media/image52.png){width="1.1805555555555556in" |
| height="0.8222222222222222in"}                                                                                             |
|                                                                                                                            |
| $=$ $+$ $-$                                                                                                                |
|                                                                                                                            |
| For two events that are mutually exclusive, $P(A \cap B) = 0$, so:                                                         |
|                                                                                                                            |
| $$P(A \cup B) = P(A) + P(B)$$                                                                                              |
|                                                                                                                            |
| Always draw a Venn diagram to visualise the scenario rather than relying on the formulas.                                  |
+----------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------+
| - **Example** Applying the addition rule to probability.                                                                 |
+=====================================================+====================================================================+
| One card is selected at random from a pack of 100   | In a class of 30 girls, 13 play tennis and 23 play netball. 7      |
| cards numbered from 1 to 100.                       | girls play both sports.                                            |
|                                                     |                                                                    |
| Let $A = \left\{ even\ cards \right\}$              | Let $T = \left\{ students\ who\ do\ tennis \right\}$               |
|                                                     |                                                                    |
| Let $B = \left\{ cards\ less\ than\ 20 \right\}$    | Let $N = \left\{ students\ who\ do\ netball \right\}$              |
|                                                     |                                                                    |
| Find $P(A \cup B)$                                  | Find $P\left( \overline{T} \cap \overline{N} \right)$              |
|                                                     |                                                                    |
| $${P(A \cup B) = P(A) + P(B) - P(A \cap B)          | $${P(T \cup N) = P(T) + P(N) - P(T \cap N)                         |
| }{= \frac{50}{100} + \frac{19}{100} - \frac{9}{100} | }{= \frac{13}{30} + \frac{23}{30} - \frac{7}{30}                   |
| }{= \frac{3}{5}}$$                                  | }{= \frac{29}{30}                                                  |
|                                                     | }{P\left( \overline{T} \cap \overline{N} \right) = 1 - P(T \cup N) |
|                                                     | }{= \frac{1}{30}}$$                                                |
+-----------------------------------------------------+--------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------+
| - **Practice**                                                                              |
+=====================================================+=======================================+
| A survey of 40 Year 9 students found that 18        | In a library of 200 books, 85 books   |
| students study French and 25 students study Drama.  | are fiction and 60 books were         |
| 8 students study both French and Drama.             | published recently. 30 books are both |
|                                                     | fiction and recent.                   |
| Let                                                 |                                       |
| $F = \left\{ students\ who\ study\ French \right\}$ | Let                                   |
|                                                     | $F = \left\{ Fiction\ books \right\}$ |
| Let                                                 |                                       |
| $D = \left\{ student\ who\ study\ drama \right\}$   | Let                                   |
|                                                     | $R = \left\{ Recent\ books \right\}$  |
| Find $P(F \cap D)$                                  |                                       |
|                                                     | Find                                  |
| $$\frac{1}{5}$$                                     | $P\left( F \cap \overline{R} \right)$ |
|                                                     |                                       |
|                                                     | $$\frac{11}{40}$$                     |
+-----------------------------------------------------+---------------------------------------+

Foundation

1.  ![](media/Probability and Data 2_Probability/media/image53.png){width="1.6110192475940508in"
    height="1.1293744531933507in"}The Venn diagram shows the
    distribution of elements in two sets, A and B.

    a.  Find:

+-------------------+---------------------------------+----------------------------------+----------------------------------+
| i.  $n(A \cap B)$ | ii. $n\left( A' \cap B \right)$ | iii. $n\left( A \cap B' \right)$ | iv. $n\left( A' \cap B' \right)$ |
|                   |                                 |                                  |                                  |
| 2                 | 6                               | 5                                | 3                                |
+===================+=================================+==================================+==================================+
| v.  $n(A)$        | vi. $n\left( B' \right)$        | vii. $n(A \cup B)$               | viii. $n(\xi)$                   |
|                   |                                 |                                  |                                  |
| 7                 | 8                               | 13                               | 16                               |
+-------------------+---------------------------------+----------------------------------+----------------------------------+

a.  Find:

+---------------------+--------------------------+----------------------------------+
| i.  $P(A \cap B)$   | ii. $P\left( A' \right)$ | iii. $P\left( A \cap B' \right)$ |
|                     |                          |                                  |
| $$\frac{1}{8}$$     | $$\frac{9}{16}$$         | $$\frac{5}{16}$$                 |
+=====================+==========================+==================================+

2.  From a total of 10 people, 5 like apples, 6 like bananas, and 4 like
    both.

![](media/Probability and Data 2_Probability/media/image54.png){width="1.9433956692913386in"
height="1.1968471128608924in"}Draw a Venn diagram and find:

+---------------------------------+----------------------------------+
| a.  $n\left( A' \cap B \right)$ | b.  $n\left( A' \cap B' \right)$ |
|                                 |                                  |
| $$2$$                           | $$3$$                            |
+=================================+==================================+
| c.  $P(A \cap B)$               | d.  $P(A \cup B)$                |
|                                 |                                  |
| $$\frac{2}{5}$$                 | $$\frac{7}{10}$$                 |
+---------------------------------+----------------------------------+

3.  A die is thrown. Let $A$ be the event that an even number appears.\
    Let $B$ be the event that a number greater than 2 appears.

    a.  Are A and B mutually exclusive?

No, since $A \cap B = \left\{ 4,6 \right\} \neq \varnothing$

b.  Find:

+--------------------------------------+--------------------------------------+---------------------------------------------------+-------------------------------------------------------------+
| i.  $P(A)$                           | ii. $P(B)$                           | iii. $P(A \cap B)$                                | iv. $P(A \cup B)$                                           |
|                                      |                                      |                                                   |                                                             |
| $$P(A) = \frac{3}{6} = \frac{1}{2}$$ | $$P(B) = \frac{4}{6} = \frac{2}{3}$$ | $$\ P(A\  \cap \ B) = \frac{2}{6} = \frac{1}{3}$$ | $$\ P(A) + \ P(B) - \ P(A\  \cap \ B)$$                     |
|                                      |                                      |                                                   |                                                             |
|                                      |                                      |                                                   | $$= \frac{1}{2} + \frac{2}{3} - \frac{1}{3} = \frac{5}{6}$$ |
+======================================+======================================+===================================================+=============================================================+

4.  A number is chosen from the set of positive integers between 1 and
    20 inclusive.\
    A is the set of multiples of 3 less than 20, and B is the set of
    factors of 15.

Find the probabilities:

+---------------------------------+--------------------------------+----------------------------------+--------------------------------+
| a.  $P(A \cap B)$               | b.  $P(A \cup B)$              | c.  $P(\overline{A})$            | d.  $P(A \cap \overline{B})$   |
|                                 |                                |                                  |                                |
| A ∩ B = {3, 15}                 | A ∪ B = {1, 3, 5, 6, 9, 12,    | Ā = {1, 2, 4, 5, 7, 8, 10, 11,   | A ∩ B̄ = {6, 9, 12, 18}         |
|                                 | 15, 18}                        | 13, 14, 16, 17, 19, 20}          |                                |
| $$\frac{2}{20} = \frac{1}{10}$$ |                                |                                  | $$\frac{4}{20} = \frac{1}{5}$$ |
|                                 | $$\frac{8}{20} = \frac{2}{5}$$ | $$\frac{14}{20} = \frac{7}{10}$$ |                                |
+=================================+================================+==================================+================================+

Development

5.  A card is selected from a standard deck of 52 playing cards (4
    suits, no jokers).\
    Let A be the event \'the card is a diamond\' and B be the event
    \'the card is a jack\'.

    a.  Find:

+---------------------------------+-----------------------------------+---------------------+
| i.  $P(A)$                      | ii. $P\left( A' \right)$          | iii. $P(A \cap B)$  |
|                                 |                                   |                     |
| $$\frac{13}{52} = \frac{1}{4}$$ | $$1 - \frac{1}{4} = \frac{3}{4}$$ | $$\frac{1}{52}$$    |
+=================================+===================================+=====================+

a.  Use the addition rule to find $P(A \cup B)$.

$$P(A \cup B) = P(A) + \ P(B) - \ P(A\  \cap \ B)$$

$$\frac{13}{52} + \frac{4}{52} - \frac{1}{52} = \frac{4}{13}$$

b.  Find the probability that the card is a jack or not a diamond.

$$P\left( B \cup A' \right) = P(B) + P\left( A' \right) - P\left( B \cap A' \right)$$

$$= \frac{4}{52} + \frac{39}{52} - \frac{3}{52} = \frac{10}{13}$$

6.  

+------------------------------------+------------------------------------+----------------------------------------------------------------------------------------------------------------------------+
| a.  $P(A) =$ $\frac{1}{2}$         | b.  $P(A) =$ $\frac{2}{5}$         | c.  $P(A) =$ $\frac{1}{2}$ $P(B) =$ $\frac{1}{3}$                                                                          |
|     $P(B) =$ $\frac{1}{3}$         |     $P(B) =$ $\frac{1}{5}$         |                                                                                                                            |
|                                    |                                    | $P(A \cap B) =$ $\frac{1}{6}$                                                                                              |
| Find:                              | Find:                              |                                                                                                                            |
|                                    |                                    | ![](media/Probability and Data 2_Probability/media/image55.png){width="1.3083333333333333in"                               |
| i.  $P\left( \overline{A} \right)$ | i.  $P\left( \overline{A} \right)$ | height="0.9604166666666667in"}![](media/Probability and Data 2_Probability/media/image56.png){width="1.3263888888888888in" |
|                                    |                                    | height="0.9875in"}![](media/Probability and Data 2_Probability/media/image57.png){width="1.3088702974628172in"             |
| $$\frac{1}{2}$$                    | $$\frac{3}{5}$$                    | height="0.9879057305336832in"}                                                                                             |
|                                    |                                    |                                                                                                                            |
| ii. $P\left( \overline{B} \right)$ | ii. $P\left( \overline{B} \right)$ | Find:                                                                                                                      |
|                                    |                                    |                                                                                                                            |
| $$\frac{2}{3}$$                    | $$\frac{4}{5}$$                    | i.  $P\left( \overline{A} \right)$                                                                                         |
|                                    |                                    |                                                                                                                            |
| iii. $P(A \cap B)$                 | iii. $P(A \cap B)$                 | $$\frac{1}{2}$$                                                                                                            |
|                                    |                                    |                                                                                                                            |
| $$\frac{1}{3}$$                    | $$\frac{3}{5}$$                    | ii. $P\left( \overline{B} \right)$                                                                                         |
|                                    |                                    |                                                                                                                            |
| iv. $P(A \cup B)$                  | iv. $P(A \cup B)$                  | $$\frac{2}{3}$$                                                                                                            |
|                                    |                                    |                                                                                                                            |
| $$\frac{1}{2}$$                    | $$0$$                              | iii. $P(A \cup B)$                                                                                                         |
|                                    |                                    |                                                                                                                            |
| v.  $P(\overline{A \cup B})$       | v.  $P(\overline{A \cup B})$       | $$\frac{2}{3}$$                                                                                                            |
|                                    |                                    |                                                                                                                            |
| $$\frac{1}{2}$$                    | $$1$$                              | iv. $P(\overline{A \cup B})$                                                                                               |
|                                    |                                    |                                                                                                                            |
|                                    |                                    | $$\frac{1}{3}$$                                                                                                            |
|                                    |                                    |                                                                                                                            |
|                                    |                                    | v.  $P(\overline{A \cap B})$                                                                                               |
|                                    |                                    |                                                                                                                            |
|                                    |                                    | $$\frac{5}{6}$$                                                                                                            |
+====================================+====================================+============================================================================================================================+

Mastery

7.  Use the addition rule P(A ∪ B) = P(A) + P(B) - P(A ∩ B) to answer
    the following questions.\
    Drawing a Venn diagram helps.

    a.  If P(A) = $\frac{1}{5}$, P(B) = $\frac{1}{3}$ and P(A ∩ B) =
        $\frac{1}{15}$, find P(A ∪ B).

$$P(A\  \cup \ B) = \ P(A) + \ P(B) - \ P(A\  \cap \ B)$$

$$= \frac{1}{5} + \frac{1}{3} - \frac{1}{15} = \frac{7}{15}$$

b.  If P(A) = $\frac{1}{2}$, P(B) = $\frac{1}{3}$ and P(A ∪ B) =
    $\frac{5}{6}$, find P(A ∩ B).

$$P(A\  \cap \ B) = \ P(A) + \ P(B) - \ P(A\  \cup \ B)$$

$$= \frac{1}{2} + \frac{1}{3} - \frac{5}{6} = \ 0$$

c.  If P(A ∪ B) = $\frac{9}{10}$, (A ∩ B) = $\frac{1}{5}$ and P(A) =
    $\frac{1}{2}$, find P(B).

$$P(B) = \ P(A\  \cup \ B) - \ P(A) + \ P(A\  \cap \ B) = \frac{9}{10} - \frac{1}{2} + \frac{1}{5}$$

$$= \frac{3}{5}$$

d.  If A and B are mutually exclusive and P(A) = $\frac{1}{7}$ and P(B)
    = $\frac{4}{7}$, find P(A ∪ B).

If A and B are mutually exclusive, P(A ∩ B) = 0

$$P(A\  \cup \ B) = \ P(A) + \ P(B) - \ P(A\  \cap \ B) = \frac{1}{7} + \frac{4}{7} - \ 0\  = \frac{5}{7}$$

e.  Find P(A ∩ B\') when P(A ∪ B) = 0.8, P(A) = 0.5 and P(B) = 0.4

$$P(A\  \cup \ B)\  = \ P(A)\  + \ P(B)\  - \ P(A\  \cap \ B)$$

$$0.8\  = \ 0.5\  + \ 0.4\  - \ P(A\  \cap \ B)$$

$$P(A\  \cap \ B)\  = \ 0.1$$

$$P\left( A\  \cap \ B' \right)\  = \ P(A)\  - \ P(A\  \cap \ B)\  = \ 0.5\  - \ 0.1\  = \ 0.4$$

f.  Find P ( A ′ ∩ B) when P (A ∪ B) = 0.76, P (A) = 0.31 and P (B) =
    0.59

$$P(A\  \cup \ B)\  = \ P(A)\  + \ P(B)\  - \ P(A\  \cap \ B)$$

$$0.76\  = \ 0.31\  + \ 0.59\  - \ P(A\  \cap \ B)$$

$$P(A\  \cap \ B)\  = \ 0.14$$

$$P(A' \cap \ B)\  = \ P(B)\  - \ P(A\  \cap \ B)\  = \ 0.59\  - \ 0.14\  = \ 0.45$$

8.  **2012 VCE Band 4**

A car manufacturer is reviewing the performance of its car model $X$.\
It is known that at any given six-month service, the probability of
model X requiring an oil change is $\frac{17}{20}$, the probability of
model $X$ requiring an air filter change is $\frac{3}{20}$, and the
probability of model $X$ requiring both is $\frac{1}{20}$.

a.  ![](media/Probability and Data 2_Probability/media/image58.png){width="1.752396106736658in"
    height="1.1811023622047243in"}State the probability that at any
    given six-month service model $X$ will require an air filter change
    without an oil change.

$$P(A\ without\ O) = \ P\left( A\  \cap \ O' \right) = \ P(A) - \ P(A\  \cap \ O) = \frac{3}{20} - \frac{1}{20} = \frac{2}{20} = \frac{1}{10}$$

b.  The car manufacturer is developing a new model. The production goals
    are that the probability of model $Y$ requiring an oil change at any
    given six-month service will be $\frac{m}{m + n}$, the probability
    of model $Y$ requiring an air filter change will be
    $\frac{n}{m + n}$\
    and the probability of model $Y$ requiring both will be
    $\frac{1}{m + n}$, where m, n ∈ Z⁺.

> Determine $m$ in terms of $n$ if the probability of model $Y$
> requiring an air filter change without an oil change at any given
> six-month service is 0.05.

![](media/Probability and Data 2_Probability/media/image59.png){width="1.7680555555555555in"
height="1.1805555555555556in"}

$$P(A\ without\ O) = \ P(A) - \ P(A\  \cap \ O) = \frac{n}{m + n} - \frac{1}{m + n} = \frac{n - 1}{m + n}$$

$$\frac{n - 1}{m + n} = \frac{1}{20}$$

$$20(n - 1) = \ m + n$$

$$20n\  - \ 20\  = \ m\  + \ n$$

$$19n\  - \ 20\  = \ m$$

$$\therefore\ m\  = \ 19n\  - \ 20$$

9.  **2011 VCE Band 5**

> Two events, A and B, are such that P(A) = 3/5 and P(B) = 1/4.
>
> If A\' denotes the complement of A, calculate P(A\' ∩ B) when:

a.  P(A ∪ B) = $\frac{3}{4}$

b.  A and B are mutually exclusive.

![](media/Probability and Data 2_Probability/media/image60.png){width="1.6395833333333334in"
height="0.98125in"}$a)\ Using\ P(A\  \cup \ B)\  = \ P(A)\  + \ P(B)\  - \ P(A\  \cap \ B)$

$$\frac{3}{4} = \frac{3}{5} + \frac{1}{4} - \ P(A\  \cap \ B)$$

$$P(A\  \cap \ B) = \frac{1}{10}$$

$$P\left( A' \cap \ B \right) = \ P(B) - \ P(A\  \cap \ B) = \frac{1}{4} - \frac{1}{10} = \frac{3}{20}$$

![](media/Probability and Data 2_Probability/media/image61.png){width="1.6262281277340331in"
height="0.98125in"}

$$b)\ P\left( A' \cap B \right) = P(B) = \frac{1}{4}$$
