  -------------------------------------------------------------------
  Mathematics Extension 1 Year 11
  -------------------------------------------------------------------
  **The Pigeonhole Principle**

  -------------------------------------------------------------------

+-------------------------+-----------------------------------+-------------------------+
| **Book 1**              | Sample Subtopic                   | Version: 251012         |
|                         |                                   |                         |
|                         |                                   | Feedback:\              |
|                         |                                   | https://MrDingMaths.com |
+=========================+===================================+=========================+
| **Contents**                                                                          |
|                                                                                       |
| [Syllabus Content [2](#_Toc202480288)](#_Toc202480288)                                |
|                                                                                       |
| [Learning Intention [3](#_Toc202480289)](#_Toc202480289)                              |
+---------------------------------------------------------------------------------------+

# Pigeonhole Principle

+-------------------------------------------------------------------+
| - **Investigation** Pigeonhole Principle                          |
+===================================================================+
| 1.  A classroom has 11 students and 10 tables, and each student   |
|     must sit at a table.                                          |
|                                                                   |
| There will be at least 1 table with ...... students.              |
|                                                                   |
| 2.  A classroom has 25 students and 10 tables, and each student   |
|     must sit at a table.                                          |
|                                                                   |
| There will be at least 1 table with ...... students.              |
|                                                                   |
| 3.  If there are 10 tables, how many students are needed to       |
|     guarantee at least one table with 4 students?                 |
|                                                                   |
| 4.  In a game of "musical tables," students distribute themselves |
|     amongst tables.\                                              |
|     The table that has more students than anyone else wins (if    |
|     there is a tie, no one wins)\                                 |
|     In a class of 23 students and 10 tables, what is the minimum  |
|     number of students on a table to be able to win?              |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Pigeonhole Principle**                                        |
+===================================================================+
| If there are $n$ pigeons and $d$ pigeonholes,\                    |
| then at least one pigeonhole contains at least                    |
| $\left\lceil \frac{n}{d} \right\rceil$ pigeons (if there is       |
| remainder, round up).                                             |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Interpret** Pigeonhole Principle                              |
+===================================================================+
| a.  There are 11 pigeons and 10 pigeonholes.                      |
|                                                                   |
| At least one pigeonhole contains at least                         |
| $\left\lceil \frac{11}{10} \right\rceil =$ ...... pigeons.        |
|                                                                   |
| b.  There are 31 pigeons and 10 pigeonholes.                      |
|                                                                   |
| At least one pigeonhole contains at least ......... pigeons.      |
|                                                                   |
| c.  There are 39 pigeons and 10 pigeonholes.                      |
|                                                                   |
| At least one pigeonhole contains at least ......... pigeons.      |
|                                                                   |
| d.  There are 39 pigeons and 15 pigeonholes.                      |
|                                                                   |
| At least one pigeonhole contains at least ......... pigeons.      |
|                                                                   |
| e.  There are 39 pigeons and 25 pigeonholes.                      |
|                                                                   |
| At least one pigeonhole contains at least ......... pigeons.      |
|                                                                   |
| f.  There are 7682 pigeons and 498 pigeonholes.                   |
|                                                                   |
| At least one pigeonhole contains at least ......... pigeons.      |
|                                                                   |
| g.  There are 50 pigeons and 10 pigeonholes.                      |
|                                                                   |
| At least one pigeonhole contains at least ......... pigeons.      |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Pigeonhole Principle**                                        |
+===================================================================+
| For $d$ pigeonholes, the least number of pigeons that guarantees  |
| at least one pigeonhole contains at least $q$ pigeons is:         |
|                                                                   |
| $$n\  = \ (q\  - \ 1)d\  + \ 1$$                                  |
|                                                                   |
| If you had one fewer pigeon $(q\  - \ 1)$, you could distribute   |
| them evenly with exactly $(q\  - \ 1)$ pigeons in each            |
| pigeonhole. Adding one more pigeon forces at least one pigeonhole |
| to contain $q$ pigeons.                                           |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Interpret** Pigeonhole Principle                              |
+===================================================================+
| $d$                                                               |
|                                                                   |
| a.  There are 10 pigeonholes.\                                    |
|     $q$\                                                          |
|     You want to guarantee at least one pigeonhole contains at     |
|     least 2 pigeons.                                              |
|                                                                   |
| You need at least $10(2 - 1) + 1 =$ ......... pigeons.            |
|                                                                   |
| b.  There are 10 pigeonholes.\                                    |
|     You want to guarantee at least one pigeonhole contains at     |
|     least 4 pigeons.                                              |
|                                                                   |
| You need at least ......... pigeons.                              |
|                                                                   |
| c.  There are 10 pigeonholes.\                                    |
|     You want to guarantee at least one pigeonhole contains at     |
|     least 6 pigeons.                                              |
|                                                                   |
| You need at least ......... pigeons.                              |
|                                                                   |
| d.  There are 15 pigeonholes.\                                    |
|     You want to guarantee at least one pigeonhole contains at     |
|     least 6 pigeons.                                              |
|                                                                   |
| You need at least ......... pigeons.                              |
|                                                                   |
| e.  There are 25 pigeonholes.\                                    |
|     You want to guarantee at least one pigeonhole contains at     |
|     least 6 pigeons.                                              |
|                                                                   |
| You need at least ......... pigeons.                              |
|                                                                   |
| f.  There are 498 pigeonholes.\                                   |
|     You want to guarantee at least one pigeonhole contains at     |
|     least 16 pigeons.                                             |
|                                                                   |
| You need at least ......... pigeons.                              |
|                                                                   |
| g.  There are 100 pigeonholes.\                                   |
|     You want to guarantee at least one pigeonhole contains at     |
|     least 5 pigeons.\                                             |
|     You need at least ......... pigeons.                          |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Solving Problems involving the Pigeonhole Principle**         |
+===================================================================+
| 1.  Read and interpret the question to identify:                  |
|                                                                   |
| $n$: number of "pigeons".\                                        |
| $d:$ number of "pigeonholes".                                     |
|                                                                   |
| $q$: minimum number of pigeons you want in at least one           |
| pigeonhole                                                        |
|                                                                   |
| 2.  Choose the appropriate formula:                               |
|                                                                   |
| If you know $n$ and $d$, find the guaranteed minimum per          |
| pigeonhole:                                                       |
|                                                                   |
| At least one pigeonhole contains at least                         |
| $\left\lceil \frac{n}{d} \right\rceil$ pigeons                    |
|                                                                   |
| If you know $d$ and $q$, find how many pigeons you need:          |
|                                                                   |
| You need $n = (q - 1)d + 1$ pigeons                               |
|                                                                   |
| 3.  If all else fails, imagine the "worst case scenario" of       |
|     distributing as evenly as possible.                           |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------+
| - **Example** Solve problems involving the pigeonhole principle.        |
+=====================================+===================================+
| 70 guests sit at a restaurant with  | How many guests must there be to  |
| 23 tables. What is the least number | guarantee that at least one of    |
| of guests at least one table must   | the 23 tables has at least 11     |
| have?                               | guests?                           |
|                                     |                                   |
| $$\frac{70}{23} = 3.04$$            | Using $n = qd + 1$,               |
|                                     |                                   |
| By the pigeonhole principle, there  | $$23 \times 10 + 1 = 231$$        |
| must be at least one table with     |                                   |
| $\left\lceil 3.04 \right\rceil = 4$ | 231 guests.                       |
| guests                              |                                   |
|                                     | (With 230 guests, the guests      |
| (If no table had more than 3        | could be organised 10 to each     |
| diners, then there would be at most | table. With 231 guests, at least  |
| 3 × 23 = 69 diners in the           | one table must have at least 11   |
| restaurant. There must be a table   | guests.)                          |
| with at least four diners.)         |                                   |
+-------------------------------------+-----------------------------------+

+-------------------------------------------------------------------------------------+
| - **Practice**                                                                      |
+=================================================+===================================+
| A group of 117 people rated a TV show from 1 to | A suburb has 15 large apartment   |
| 5. At least $r$ people gave the same rating.    | blocks. What is the minimum       |
|                                                 | number of people you must know    |
| Find $r$.                                       | from these blocks to guarantee    |
|                                                 | you know at least 25 people from  |
| $$\left\lceil \frac{117}{5} \right\rceil = 24$$ | at least one block?               |
|                                                 |                                   |
|                                                 | 15 × 24 + 1 = 361                 |
+-------------------------------------------------+-----------------------------------+

Foundation

1.  How many cards must be selected from a standard pack of playing
    cards to make sure that you have two cards of the same suit?

Pigeons: cards

Pigeonholes: suits

$$n = 4(2 - 1) + 1 = 5$$

There are four suits, so four pigeonholes. You need to select five
cards.

2.  If you select five cards from a standard pack of playing cards, at
    least how many must be of the same suit?

$$\left\lceil \frac{5}{4} \right\rceil = 2$$

Each of the five cards can belong to one of four suits. By the
pigeonhole principle, at least two of the cards must belong to the same
suit:

3.  There are three pairs of socks in a drawer, coloured brown, grey and
    black.\
    They are not paired up.\
    How many socks must be selected from the drawer to be sure that you
    have a pair of the same colour?

Pigeons: socks

Pigeonholes: pairs of socks

$$n = 3(2 - 1) + 1 = 4$$

There are three colours, so three pigeonholes. You need to select four
socks.

4.  Six pairs of shoes of different colours and styles have been thrown
    into the bottom of my wardrobe. It is dark. What is the minimum
    number of shoes I need to take from the wardrobe to be sure I have a
    matching pair?

Pigeons: shoes

Pigeonholes: pairs of shoes

$$n = 6(2 - 1) + 1 = 7$$

There are six pairs of shoes, so six pigeonholes. You need to take seven
shoes from the wardrobe.

5.  Twenty-five students attend a class reunion and shake hands with
    each other. If no students shakes hands with the same person twice,
    explain why two students will each have shaken the same number of
    hands.

Pigeons: students

Pigeonholes: handshakes

$$\left\lceil \frac{25}{24} \right\rceil = 2$$

Each student shakes hands with 24 other students,\
so there are 24 pigeonholes for 25 students, thus two students must have
shaken hands with the same number of students.

6.  There are 400 students attending a Senior College. Explain why at
    least two of them will celebrate their birthday on the same day.

Pigeons: students

Pigeonholes: days of the year

$$\left\lceil \frac{400}{366} \right\rceil = 2$$

There are 366 possible birthdays, so 366 pigeonholes.\
Since there are 400 students, then at least two of them will celebrate
their birthday on the same day.

Development

7.  a.  When taking pairs of numbers from the integers 1 to 8, list all
        the pairs of integers that add up to 9.

1 + 8, 2 + 7,

3 + 6 , 4 + 5

b.  How many numbers do you need to select from the integers 1 to 8 to
    be sure that you have a pair of numbers that add up to 9?

Pigeons: Numbers

Pigeonholes: pairs that sum to 9

$$4 \times (2 - 1) + 1 = 5$$

There are four pairs of integers that add up to nine.\
There are four pigeonholes, so you need to pick five numbers to be sure
of having two numbers that add to nine.

8.  Prove that in a group of 13 people there are two people who were
    born in the same month.

Pigeons: people

Pigeonholes: months

$$\left\lceil \frac{13}{12} \right\rceil = 2$$

There are 12 months (pigeonholes) and 13 people (pigeons), so by the
pigeonhole principle two of the people must be born in the same month.

9.  **2022 HSC Extension 1 Band 3**

> A sports association manages 13 junior teams. It decides to check the
> age of all players. Any team that has more than 3 players above the
> age limit will be penalised.
>
> A total of 41 players are found to be above the age limit.
>
> Will any team be penalised? Justify your answer.

$$\frac{41}{13} = 3\ \ r\ 2$$

$$\left\lceil \frac{41}{13} \right\rceil = 4$$

Yes at least one team will have 4 players above the age limit.

10. **2024 HSC Extension 1 Band 4**

> Students from 4 different schools come together to form a choir.
>
> What is the minimum size of the choir to know that there must be at
> least 20 students in the choir from one of the schools?
>
> ![](media/Pigeonhole Principle/media/image5.png){width="0.689443350831146in"
> height="1.417911198600175in"}

$$4(20 - 1) + 1 = 77$$

B

Mastery

11. **HSC Sample Question Extension 1 Band 4**

> To complete a course, a student must choose and pass exactly three
> topics.
>
> There are eight topics from which to choose.
>
> Last year 400 students completed the course.
>
> Show why at least eight students passed exactly the same three topics.

$8C3 = 56$ ways to choose 3 topics

$$\left\lceil \frac{400}{56} \right\rceil = 8$$

12. **2021 HSC Extension 1 Band 5**

> The members of a club voted for a new president. There were 15
> candidates for the position of president and 3543 members voted. Each
> member voted for one candidate only.

One candidate received more votes than anyone else and so became the new
president.

![](media/Pigeonhole Principle/media/image6.png){width="0.7500721784776903in"
height="1.3410400262467193in"}What is the smallest number of votes the
new president could have received?

$$\frac{3543}{15} = 236\ r\ 3$$

If the votes were evenly distributed, each candidate receives 236 votes,
except 3 who receive 237.

But to win the election, you can't have a tie.

$\therefore 238$ votes is the minimum

C

13. **HSC Sample Question Extension 1 Band 5**

A delivery company has 1095 packages to deliver on a given day.

It has 17 delivery vans that will deliver all packages. If one van
delivers more packages than all other vans, the company pays the driver
a \$100 bonus.

What is the minimum number of packages a van could deliver and still win
the \$100 bonus.

$$\frac{1095}{17} = 64\ r\ 7$$

If the packages were distributed evenly, each driver would deliver 64
packages, except 7 who deliver 65

But to win, you can't tie, you must deliver more than all the others, so
you need to deliver a minimum of 66.
