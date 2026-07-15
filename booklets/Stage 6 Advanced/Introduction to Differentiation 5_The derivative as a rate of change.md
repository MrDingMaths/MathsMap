+-------------------------------------------------------------------+
| Mathematics Advanced Year 11                                      |
+===================================================================+
| **Introduction to**                                               |
|                                                                   |
| **Differentiation**                                               |
+-------------------------------------------------------------------+

+-------------------------+-----------------------------------+-------------------------+
| **Book 5**              | The derivative as a rate of       | Version: 250818         |
|                         | change                            |                         |
|                         |                                   | Feedback:\              |
|                         |                                   | https://MrDingMaths.com |
+=========================+===================================+=========================+
| **Contents**                                                                          |
|                                                                                       |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                          |
|                                                                                       |
| [Learning Intention [4](#_Toc202480289)](#_Toc202480289)                              |
+---------------------------------------------------------------------------------------+

# Syllabus Content

**MAV-11-06** interprets the meaning of the derivative and determines
the derivative of functions to solve problems

**The derivative as a rate of change**

- Interpret $f'(c)$ as the instantaneous rate of change of the function
  $f(x)$ at $x = c$

- Define and distinguish between displacement and distance and between
  velocity and speed

- Use graphs of functions and their derivatives, without the use of
  algebraic techniques, to describe and interpret physical phenomena

- Use the notation $\frac{dx}{dt}$ or $\dot{x}$ to represent the
  velocity of a particle with displacement $x$ from a point as a
  function of time $t$

- Solve problems by determining the velocity of a particle moving in a
  straight line, given its displacement from a point as a function of
  time

# Average Rate of Change

+-------------------------------------------------------------------------------------------------------------------------------+
| - **Average Rate of Change**                                                                                                  |
+===============================================================================================================================+
| ![](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image3.png){width="1.9058202099737533in" |
| height="1.7716535433070866in"}The **average rate of change** between $x = a$ and $x = b$ is the **gradient of the**           |
| **secant**.                                                                                                                   |
|                                                                                                                               |
| $${\ \ \ \ \ \ \ \ \ \ \ \ \begin{matrix}                                                                                     |
| Average \\                                                                                                                    |
| rate\ of\ change                                                                                                              |
| \end{matrix} = \ \frac{\Delta y}{\Delta x}                                                                                    |
| }{= \frac{f(b) - f(a)}{b - a}}$$                                                                                              |
+-------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------+
| - **Example** Find average rate of change across an interval.                                                        |
+===========================================================+==========================================================+
| A container is being filled with water.\                  | The temperature $T$, in °C, of a glass of water over $t$ |
| The volume $V$, in litres, after $t$ minutes is given by\ | minutes is changing according to                         |
| $$V(t) = t^{2} + t + 1$$                                  |                                                          |
|                                                           | $$T(t) = 30 \times 2^{- t} + 20$$                        |
| Find the average rate of change of volume between $t = 1$ |                                                          |
| and $t = 5$                                               | Find the average rate of change in temperature over the  |
|                                                           | first two minutes.                                       |
| $$\frac{\Delta y}{\Delta x} = \frac{V(5) - V(1)}{5 - 1}$$ |                                                          |
|                                                           | $${\frac{\Delta y}{\Delta x} = \frac{T(2) - T(0)}{2 - 0} |
| $$= \frac{31 - 3}{4}$$                                    | }{= \frac{27.5 - 50}{2}                                  |
|                                                           | }{= - 11.25\ {^\circ}C/min}$$                            |
| $$= 7\ L/min$$                                            |                                                          |
+-----------------------------------------------------------+----------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| A model rocket is launched into the air. Its height after $t$ seconds |
| is given by $h(t) = - t^{2} + 10t$, where $h$ is in metres.           |
+-----------------------------------+-----------------------------------+
| Find the average rate of change   | Find the average rate of change   |
| of height\                        | of height\                        |
| between $t = 0$ and $t = 4$.      | between $t = 6$ and $t = 10$.     |
|                                   |                                   |
| $6$ m/s                           | $- 6$ m/s                         |
+-----------------------------------+-----------------------------------+

Foundation

1.  $Q = 8t - t^{2}$

    a.  Find the values of $Q$ when $t = 1$ and $t = 3$.

7 and 15

b.  Hence find the average rate of change from $t = 1$ to $t = 3$.

4

c.  Similarly find the average rate of change from $t = 5$ to $t = 7$.

$$- 4$$

2.  A bucket full of water has a leak, and the volume after $t$ minutes
    is given by

$$V(t) = t^{2} - 4t + 4$$

Where V is measured in litres.

a.  Find the average rate of change of V during the first minute.\
    Remember to have units in your answer.

$- 3$ L/min

b.  Find the average rate of change of V over the first two minutes.

$- 2$ L/min

c.  Explain why the model is only valid for t ∈ \[0, 2\].\
    What happens to a leaky bucket eventually?

The bucket is empty at $t = 2$

3.  The value of a car, in \$, is modelled by the equation
    $V(t) = \ 50000(1.15)^{- t},$ where $t$ is in years. What is the
    average rate of change in the value of the car over the first five
    years?

$$- \$ 5028.23/yr$$

# Instantaneous Rate of Change

+-------------------------------------------------------------------------------------------------------------------------------+
| - **Instantaneous Rate of Change**                                                                                            |
+===============================================================================================================================+
| ![](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image4.png){width="1.7919510061242345in" |
| height="1.7716535433070866in"}The **instantaneous rate of change** at $x = a$ is the **gradient of the** **tangent**.         |
|                                                                                                                               |
| $${\ \ \ \ \ \ \ \ \ \ \ \ \begin{matrix}                                                                                     |
| Instantaneous \\                                                                                                              |
| rate\ of\ change                                                                                                              |
| \end{matrix} = \ \frac{dy}{dx}                                                                                                |
| }{= f'(a)}$$                                                                                                                  |
+-------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------+
| - **Identify** rate of change formula.                                                      |
+=====================================+=========================+=============================+
| Find the formula for the rate of change of each function.                                   |
+-------------------------------------+-------------------------+-----------------------------+
| a.  $h = 50t^{2} + 3t$              | b.  $A = (h + 2)^{5}$   | c.  $V = 7(2t + 5)^{3}$     |
|                                     |                         |                             |
| $$\ \ \ \ \ \ \ \ \frac{dh}{dt} =$$ |                         |                             |
+-------------------------------------+-------------------------+-----------------------------+
| d.  $y = \sqrt{4 - x^{2}}$          | e.  $S = 4\pi r^{2}$    | f.  $P =$                   |
|                                     |                         |     $\frac{5 + 2t}{10 - t}$ |
+-------------------------------------+-------------------------+-----------------------------+

+-------------------------------------------------------------------------+
| - **Interpret** rate of change scenarios.                               |
+====================================+====================================+
| A ball shoots up and comes down. Its height is $h(t)$ where $h$ is in   |
| metres and $t$ in seconds.\                                             |
| This is what each mathematical operation means.                         |
|                                                                         |
| Find $\mathbf{h}\left( \mathbf{a} \right):$ Calculate the height at     |
| $t = a$ seconds.                                                        |
|                                                                         |
| Solve $\mathbf{h}\left( \mathbf{t} \right)\mathbf{= a}:$ Find when the  |
| ball reaches a height of $a$ metres.                                    |
|                                                                         |
| Find $\mathbf{h}^{\mathbf{'}}\left( \mathbf{t} \right)$: Find the rate  |
| of change of the ball\                                                  |
| Find an equation describing how the height is increasing/decreasing.    |
|                                                                         |
| Find $\mathbf{h}^{\mathbf{'}}\left( \mathbf{a} \right):$ Find how       |
| quickly the ball's height changes at $t = a$ seconds.                   |
|                                                                         |
| Solve                                                                   |
| $\mathbf{h}^{\mathbf{'}}\left( \mathbf{t} \right)\mathbf{= a}:\$Find    |
| when the height of the ball is changing/increasing/decreasing at $a$    |
| m/s.                                                                    |
|                                                                         |
| Identify what the following questions are asking you to find.           |
+------------------------------------+------------------------------------+
| a.  What was the height of the     | b.  At what rate was the height    |
|     ball when it was thrown?       |     changing 20 seconds after      |
|                                    |     being thrown?                  |
+------------------------------------+------------------------------------+
| c.  When was the ball at maximum   | d.  When was the ball 20 m high?   |
|     height?                        |                                    |
+------------------------------------+------------------------------------+
| e.  When was the ball's height     | f.  What is the formula that       |
|     increasing by $20$ m/s?        |     describes the rate of change   |
|                                    |     over time?                     |
+------------------------------------+------------------------------------+
| The volume of water in a leaky tank is given by $V(t)$, where $V$ is in |
| litres and $t\$in minutes.                                              |
+------------------------------------+------------------------------------+
| a.  How fast was the water leaking | b.  How much water was in the tank |
|     out after 5 minutes?           |     initially?                     |
+------------------------------------+------------------------------------+
| c.  How long did it take for the   | d.  When was the volume decreasing |
|     tank to become completely      |     by\                            |
|     empty?                         |     $20$ cm/min?                   |
+------------------------------------+------------------------------------+
| The height of a bungee jumper is given by $h(t)$, where $h$ is in       |
| metres and $t\$in seconds.                                              |
+------------------------------------+------------------------------------+
| a.  What was the height of the     | b.  When was the bungee jumper's   |
|     bungee jumper after 20         |     height increasing by 20        |
|     seconds?                       |     cm/min?                        |
+------------------------------------+------------------------------------+
| c.  When was the bungee jumper's   | d.  What was the minimum height of |
|     height minimum?                |     the bungee jumper?             |
+------------------------------------+------------------------------------+

+-----------------------------------------------------------------------+
| - **Example** Solve rate of change problems.                          |
+===================================+===================================+
| A ball is thrown into the air; its height is given by the function    |
| $h(t) = - 5t^{2} + 20t + 1\$\                                         |
| where $h$ is in metres and $t$ in seconds.                            |
+-----------------------------------+-----------------------------------+
| a.  Find the initial height of    | b.  Find the initial rate at      |
|     the ball.                     |     which the height was          |
|                                   |     changing.                     |
| $$h(0) = - 5(0)^{2} + 20(0) + 1$$ |                                   |
|                                   | $$h'(t) = - 10t + 20$$            |
| $= 1$ m                           |                                   |
|                                   | $$h'(0) = - 10(0) + 20$$          |
|                                   |                                   |
|                                   | $= 20$ m/s                        |
+-----------------------------------+-----------------------------------+
| c.  Find the height after 3       | d.  Find the rate at which the    |
|     seconds.                      |     height is changing after 3    |
|                                   |     seconds.                      |
| $$h(3) = - 5(3)^{2} + 20(3) + 1$$ |                                   |
|                                   | $$h'(3) = - 10(3) + 20$$          |
| $= 16$ m                          |                                   |
|                                   | $= - 10$ m/s                      |
+-----------------------------------+-----------------------------------+
| e.  Find when ball was at the     | f.  Find the maximum height of    |
|     maximum height.               |     the ball.                     |
|                                   |                                   |
| $h'(t) = 0$                       | $$h(2) = - 5(2)^{2} + 20(2) + 1$$ |
|                                   |                                   |
| $$- 10t + 20 = 0$$                | $\ \ \ \ \ \ \ \ \ \  = 21$ m     |
|                                   |                                   |
| $\therefore t = 2$ m              |                                   |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| An infestation of ants hit a Year 7's locker but was gradually        |
| brought under control.\                                               |
| The ant population $P$, in hundreds, $t$ hours after it was           |
| discovered, is $P(t) = 7 + 6t - t^{2}$.                               |
+-----------------------------------+-----------------------------------+
| a.  Find the initial population   | b.  Find the initial rate at      |
|     of the ants.                  |     which the population was      |
|                                   |     changing.                     |
| $P(0) = 7$ hundred                |                                   |
|                                   | $$P'(t) = 6 - 2t$$                |
|                                   |                                   |
|                                   | $P'(0) = 6$ hundred per hour      |
+-----------------------------------+-----------------------------------+
| c.  Find the rate at which the    | d.  Find when the ant population  |
|     ant population is changing    |     was at its maximum.           |
|     after 4 hours.                |                                   |
|                                   | $$P'(t) = 0$$                     |
| $P'(4) =$ $- 2$ hundred per hour  |                                   |
|                                   | $t = 3$ hours                     |
+-----------------------------------+-----------------------------------+
| e.  Find the maximum population   | f.  When were the ants finally    |
|     of the ants.                  |     eliminated?                   |
|                                   |                                   |
| $P(3) = 16$ hundred               | $$P(t) = 0$$                      |
|                                   |                                   |
|                                   | $t = - 1$ or $7$                  |
|                                   |                                   |
|                                   | They were eliminated after 7      |
|                                   | hours.                            |
+-----------------------------------+-----------------------------------+

Foundation

1.  Find the formula for the rate of change for each function.

+--------------------------------------------------+-------------------------------------------------+--------------------------------------------------+
| a.  $h\  = \ 20t\  - \ 4t²$                      | b.  $D\  = \ 5t³\  + \ 2t²\  + \ 1$             | c.  $A\  = \ 16x\  - \ 2x²$                      |
|                                                  |                                                 |                                                  |
| $$\frac{dh}{dt} = \ 20\  - \ 8t$$                | $$\frac{dD}{dt} = \ 15t^{2} + \ 4t$$            | $$\frac{dA}{dx} = \ 16\  - \ 4x$$                |
+==================================================+=================================================+==================================================+
| d.  $x\  = \ 3t⁵\  - \ t⁴\  + \ 2t\  - \ 3$      | e.  $V\  = \frac{4}{3}\pi r³$                   | f.  $S\  = \ 2\pi r\  +$ $\frac{50}{r^{2}}$      |
|                                                  |                                                 |                                                  |
| $$\frac{dx}{dt} = \ 15t^{4} - \ 4t^{3} + \ 2$$   | $$\frac{dV}{dr} = \ 4\pi r^{2}$$                | $$\frac{dS}{dr} = \ 2\pi\  - \frac{100}{r^{3}}$$ |
+--------------------------------------------------+-------------------------------------------------+--------------------------------------------------+
| g.  $D\  = \ \sqrt{x^{2} - \ 4}$                 | h.  $S\  = \ 800r\  +$ $\frac{400}{r}$          |                                                  |
|                                                  |                                                 |                                                  |
| $$\frac{dD}{dx} = \frac{x}{\sqrt{x^{2} - \ 4}}$$ | $$\frac{dS}{dr} = \ 800\  - \frac{400}{r^{2}}$$ |                                                  |
+--------------------------------------------------+-------------------------------------------------+--------------------------------------------------+

2.  If $h = t³ - 7t + 5$, find:

    a.  the average rate of change of $h$ between $t = 3$ and $t = 4.$

30

b.  the instantaneous rate of change of $h$ when $t = 3$.

20

3.  The volume of water $V$ in litres flowing through a pipe after $t$
    seconds is given by $V = t² + 3t$. Find the rate at which the water
    is flowing when $t = 5$.

13 L/s

4.  The mass in grams of a melting ice block is given by the formula
    $M = t - 2t² + 100$, where $t$ is time in minutes.

    a.  Find the average rate of change at which the ice block is
        melting between:

        i.  1 and 3 minutes

--7 g/min

ii. 2 and 5 minutes.

--13 g/min

b.  Find the rate at which it is melting at 5 minutes.

19 g/min

5.  The surface area in cm² of a balloon being inflated is given by
    $S = t³ - 2t² + 5t + 2$, where $t$ is time in seconds. Find the rate
    of increase in the balloon\'s surface area at 8 $s$.

165 cm² /s

6.  A circular disc expands as it is heated. The area, in cm², of the
    disc increases according to the formula $A = 4t² + t$, where $t$ is
    time in minutes. Find the rate of increase in the area after 5
    minutes.

41 cm²/min

7.  Orange juice is being poured at a constant rate into a glass. After
    $t$ seconds there are $V$ mL of juice in the glass, where $V = 60t$.

    a.  How much juice is in the glass after 3 seconds?

180 mL

b.  Show that the glass was empty to begin with.

$$V(0) = 60(0) = 0$$

c.  If the glass takes 5 seconds to fill, what is its capacity?

$V(5) = 300$ mL

d.  Differentiate to find the rate at which the glass is being filled.

$\frac{dV}{dt}$ $= \$`<!-- -->`{=html}60 mL/s

e.  What sort of function is the derivative in part **d**?

The derivative is a constant function.

8.  The volume $V$ litres of fuel in a tanker, $t$ minutes after it has
    started to empty, is given by\
    $Q = 200(400 - t²)$. Initially the tanker was full.

    a.  Find the initial volume of fuel in the tanker.

80 000 L

b.  Find the volume of fuel in the tanker after 15 minutes.

35 000 L

c.  Find the time taken for the tanker to empty.

20 min

d.  Show that $\frac{dV}{dt}$ $= - 400t$, and hence find the rate at
    which the tanker is emptying after 5 minutes.

Decreasing by 2000 L/min

Development

9.  The volume of water in a container can be modelled by the equation

$$V\  = \frac{10 - t}{2 + t}$$

where $t$ is time in minutes and $V$ is measured in litres.

a.  How much water was in the container initially?

5 L

b.  Show that $V'(t) = -$ $\frac{12}{(2\  + \ t)^{2}}$

Using quotient rule\
$$V'(t) = \frac{- 1(2 + t) - (10 - t)(1)}{(2 + t)^{2}}$$

$$= - \frac{12}{(2 + t)^{2}}$$

c.  Explain why the container is always losing water.

The derivative $-$ $\frac{12}{(2 + t)^{2}}$ is always negative

d.  Find the rate at which $V$ is decreasing initially.

3 L/min

e.  Find the rate at which $V$ is decreasing when $t = 2$.

0.75 L/min

10. A ball is dropped from the top of a building, and the distance of
    the ball from the ground after $t$ seconds is given by the equation
    $h = 100 - 5t²,$ where h is measured in metres.

    a.  How tall is the building?

100 m

b.  How long does it take for the ball to hit the ground?

$\sqrt{20} =$ 4.47 s

c.  Hence, state the time interval $t\  \in \ \lbrack a,b\rbrack$ where
    this model is valid.

$$t \in \left\lbrack 0,\sqrt{20} \right\rbrack$$

d.  What is the rate of change $\frac{dh}{dt}$ of the height:

    i.  initially?

0 m/s

ii. when it hits the ground?

$- 10\sqrt{20}$ m/s

e.  When is the rate at which $h$ decreases the largest?

$t = 4.47$, just when it is about to hit the ground.

11. A circular disc expands as it is being heated. The area, in of the
    disc after $t$ minutes is given by $A\  = \ 3t²\  + \ t$, where $A$
    is in cm².

    a.  Find the rate at which the area increases after 4 minutes.

25 cm² /min

b.  Find the average rate of change during the 4^th^ minute. (4^th^
    minute is between $t = 3$ and $4$).

22 cm² /min

12. The rate of water flow into a tank is given by $\frac{dV}{dt}$
    $= 10(2 - t),$ where $\frac{dV}{dt}$ is measured in litres per
    minute. The tank initially had 60 litres of water in it.

    a.  Describe the difference in the water flow when $t = 1$ and
        $t = 4$.\
        In your answer, refer to the direction of water flow.

The rate is positive when $t = 1$ (water is flowing in)

The rate is negative when $t = 4$ (water is flowing out)

b.  Show that the volume of water increases for a certain amount of
    time, and then decreases afterwards.

Consider the derivative $10(2 - t)$, it is a decreasing straight line
that is positive when $t < 2$ and negative $t > 2$.

When $t < 2$, volume is increasing, when $t > 2,$ the volume is
decreasing.

c.  Show that the formula $V = 20t - 5t² + 60$ satisfies the given
    information.

$$\frac{dV}{dt} = 20 - 10t = 10(2 - t)$$

13. A water tank is being emptied. The quantity Q litres of water
    remaining in the tank at any time t minutes after it starts to empty
    is given by $Q(t) = 1000(20 - t)²,\ t \geq 0$.

    a.  At what rate is the tank being emptied at any time $t$?

$2000(20 - t)$ L/min

b.  How much time does it take to empty the tank? (When is $V = 0$?)

After 20 minutes

c.  At what time is the water flowing out at a rate of 20 000 litres per
    minute?

After 10 minutes

d.  What is the average rate at which the water flows out in the first 5
    minutes?

35 000 L/min

14. A block of ice of mass 8 kg melts according to the formula $M = 8 -$
    $\frac{t^{2}}{32}$, where $M$ is the mass remaining, in kilograms,
    after $t$ minutes.

    a.  Find the time taken for all the ice to melt.

16 minutes

b.  Find the rate at which the ice is melting after 4 minutes.

--0.25 kg/min

c.  Find the rate at which the ice is melting when 2 kg of ice has
    melted.

--0.5 kg/min

d.  Is the melting rate faster initially, or just before it is gone
    completely.

It is faster just before its gone.

15. Water is poured into a tank and the volume $V$, in litres, after $t$
    seconds is $V = 200 + 80t - 2t²$.

    a.  Find the amount of water initially.

200 L

b.  If the container was full in 20 seconds, what is the capacity of the
    bottle?

1000 L

c.  Find the average rate of change during the first 10 seconds and
    compare it with the

> instantaneous rate of change after 10 seconds.

60 L/s vs 40 L/s

d.  When was the flow rate the greatest?

At $t = 0$

Mastery

16. Water surges into a rock pool, and then out again. The mass $M$ in
    kilograms of water in the pool $t$ seconds after time zero is given
    by the function $M = 10t - t²$.

    a.  Find the rate $\frac{dM}{dt}$ as a function of time $t$.

$$\frac{dM}{dt} = 10 - 2t$$

b.  Find (with units) the values of $M$ and $\frac{dM}{dt}$ when
    $t = 4$.

$$M = 24\ kg,\ \ \frac{dM}{dt} = 2\ kg/s$$

c.  Find the value of $M$ when $t = 2$, and hence find the average rate
    of change over the time interval from $t = 2$ to $t = 4$.

$$M = 16\ kg,\ \ avg\ rate\ of\ change = 4\ kg/s$$

d.  At what times is $M$ zero?

$$M = t(10 - t),\ $$

$0$ and $10$ seconds

e.  Therefore, for how long was there water in the pool?

10 seconds

f.  How long after time zero is $\frac{dM}{dt}$ zero?

$$\frac{dM}{dt} = 10 - 2t = 0$$

$t =$ 5 seconds

g.  For how long was the water level in the pool rising, and for how
    long was it falling?

$\frac{dM}{dt} > 0$ for the first 5 seconds and $< 0$ for the next 5
seconds

h.  Sketch the graphs of $M$ and $\frac{dM}{dt}$ as functions of $t$,
    showing these results.\
    Add the chord corresponding to the result in part **c** and the
    tangent corresponding to the result in part **f**.

![A graph of a function and a line AI-generated content may be
incorrect.](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image5.png){width="3.077419072615923in"
height="1.5102154418197726in"}

17. The share price \$$P$ of a bank $t$ years after it opened on 1 Jan
    1970 was $P = - 0.4t² + 4t + 2$.

    a.  What was the initial share price?

\$2

b.  What was the share price after one year?

\$5.60

c.  At what rate was the share price increasing after two years?

$$\frac{dP}{dt} = - 0.8t + 4$$

$$\$ 2.40/yr$$

d.  Find when the share price was stationary.

$t = 5$, at the start of 1975

e.  Explain why the maximum share price was \$12, at the start of 1975.

$t = 5$ is the turning point of $P$.

The share price was increasing before then, and decreasing after.

f.  Explain why the rate of change of the price decreased at a constant
    rate.

$\frac{dP}{dt}$ is linear with negative gradient $- 0.8$

g.  The directors decided to close the bank when the share price fell
    back to its initial value. When did this happen?

By symmetry of a parabola, it would take another 5 years to go from the
maximum back to the starting value.

$\therefore$ At the start of 1980.

18. The graph shows the share price $P$ in a company $t$ months after
    the start of the year.

    a.  ![A graph of a function AI-generated content may be
        incorrect.](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image6.png){width="2.0275863954505686in"
        height="1.9680555555555554in"}When is the price stationary,
        neither increasing/decreasing?

> $$t = 0,\ 6$$

b.  When is the price maximum?

> $$t = 0,\ 6$$

c.  When is the price increasing and when is it decreasing?

> Increasing between $t = 2$ and $t = 6$, decreasing everywhere else.

d.  ![A graph of a function AI-generated content may be
    incorrect.](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image7.png){width="1.9862915573053368in"
    height="1.968503937007874in"}When is the share price increasing most
    rapidly?

> $$t = 4$$

e.  When is the share price increasing at an increasing rate?

> Between $t = 2$ and $t = 4$

f.  Sketch the graph of $\frac{dP}{dt}$ as a function of time $t$.

<!-- -->

19. A lightning bolt hits the ground with a tremendous noise. The noise
    spreads out across the suburbs in a circle of area $A$, startling
    people.

    a.  The speed of sound in air is about $\frac{1}{3}$ km/s. Show that
        the area $A$ in which people are startled as a function of the
        time $t$ in seconds after the strike is $A\  = \frac{\pi}{9}t²$.

Using distance = speed $\times$ time:

$$r = \frac{1}{3}t$$

$$A = \pi r^{2} = \pi\left( \frac{t}{3} \right)^{2} = \frac{\pi}{9}t^{2}$$

b.  Find the rate at which the area of startled people is increasing.

$$\frac{dA}{dt} = \frac{2\pi}{9}t$$

c.  Find, correct to four significant figures, the time when the area is
    5 km².

$$t = \sqrt{\frac{45}{\pi}} \approx 3.785\ s$$

d.  Find the rate at which the area is increasing at that time

$$\frac{dA}{dt}\ when\ t = \sqrt{\frac{45}{\pi}}$$

$$= 2.642\ {km}^{2}/s$$

20. **HSC Advanced Sample Question Band 4**

> A magpie plague hit Sydney but was eventually brought under control. A
> researcher estimated that the population $M$, in hundreds, $t$ months
> after 1^st^ January, was $M = 7 + 20t - 3t^{2}$.

a.  Find the magpie population on 1^st^ March.

$M(2) = 35$, 3500 magpies

b.  At what rate was the population changing at this time?

$$M'(t) = 20 - 6t$$

$$M'(2) = 8$$

Increasing by 800 magpies per month

c.  In what month does the magpie population start to decrease?

Find turning point

$M'(t) = 0$ when $t =$ $\frac{10}{3} = 3\frac{1}{3}$

Population starts to decrease in April, since $t = 0\$is January

# Applications of Differentiation to Motion

+----------------------------------------------------------------------------------------------------------+
| - **Displacement, Velocity, Acceleration**                                                               |
+=========================+=======================================+========================================+
| - **Magnitude** is the distance from zero.                                                               |
|                                                                                                          |
| - **Direction** is positive or negative.                                                                 |
|                                                                                                          |
| - **Distance** and **speed** are called **scalar** quantities, they only have magnitude, no direction.   |
|                                                                                                          |
| - **Displacement**, **velocity**, and **acceleration** are **vector** quantities.\                       |
|   They have magnitude *and* direction.                                                                   |
|                                                                                                          |
| - In questions, it is important to define the positive direction to be able to interpret results.\       |
|   e.g. up is positive, down is negative; or right is positive, left is negative.                         |
+-------------------------+---------------------------------------+----------------------------------------+
| **Displacement**        | **Velocity**                          | **Acceleration**                       |
+-------------------------+---------------------------------------+----------------------------------------+
| Position relative to a  | Rate of change of displacement over   | Rate of change of\                     |
|                         | time.                                 | velocity over time                     |
| starting point.         |                                       |                                        |
|                         | $$v\ or\ \dot{x}\ or\ \frac{dx}{dt}$$ | $$a\ or\ \ddot{x}\ or\ \frac{dv}{dt}$$ |
| $$x$$                   |                                       |                                        |
|                         | E.g. 5 m/s west.                      | E.g. 9.8 m/s^2^ down.                  |
| E.g. 3 metres north.    |                                       |                                        |
|                         | Speed is the magnitude.               |                                        |
| Distance is the         |                                       |                                        |
| magnitude.              |                                       |                                        |
+-------------------------+---------------------------------------+----------------------------------------+

+-------------------------------------------------------------------+
| - **Language of Motion**                                          |
+===================================================================+
| *Initial:* $t = 0$ *At rest/stationary:* $v = 0$                  |
|                                                                   |
| *At the origin:* $x = 0$ *Constant velocity:* $a = 0$             |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Interpret** language of motion                                    |
+===================================+===================================+
| Identify what the question is asking you to find, answer in function  |
| notation in terms of $x,\ \dot{x},$ or $\ddot{x}$.                    |
|                                                                       |
| The movement of a particle over time is given by $x(t)$.              |
+-----------------------------------+-----------------------------------+
| a.  Find the initial              | b.  Find when the particle is     |
|     displacement.                 |     stationary.                   |
+-----------------------------------+-----------------------------------+
| c.  Find the initial velocity.    | d.  Find when the particle is at  |
|                                   |     the origin.                   |
+-----------------------------------+-----------------------------------+
| e.  Find when the particle is at  | f.  Find the initial              |
|     rest.                         |     acceleration.                 |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| - **Example** Solve motion problems involving differentiation.        |
+===================================+===================================+
| A ball is dropped from a platform, its vertical displacement is       |
| $x = 50 - 5t^{2}$, where $x$ is in metres and $t$ is in seconds.      |
+-----------------------------------+-----------------------------------+
| a.  Find the initial              | b.  Find its displacement at 2 s. |
|     displacement.\                |                                   |
|     What does this represent?     | $x(2) = 50 - 5(2)^{2}$            |
|                                   |                                   |
| $x(0) = 50$ m.                    | $= 30$ m.                         |
|                                   |                                   |
| This is the height of the         |                                   |
| platform.                         |                                   |
+-----------------------------------+-----------------------------------+
| c.  Find its velocity at 2 s.     | d.  Find its acceleration at 2 s. |
|                                   |                                   |
| $\dot{x} = - 10t$                 | What do you notice about the      |
|                                   | acceleration?                     |
| $\dot{x}(2) = - 20$ m/s           |                                   |
|                                   | $$\ddot{x} = - 10$$               |
|                                   |                                   |
|                                   | $\ddot{x}(2) = - 10$ m/s^2^       |
|                                   |                                   |
|                                   | The acceleration doesn't change.  |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| A rocket is launched upwards. Its vertical displacement is            |
| $x = - 5t^{2} + 20t + 5$.                                             |
+-----------------------------------+-----------------------------------+
| a.  Find the initial              | b.  Find the velocity after 3     |
|     displacement.                 |     seconds.                      |
|                                   |                                   |
| 5 m                               | $- 10\$m/s                        |
+-----------------------------------+-----------------------------------+
| c.  Find when the rocket is       | d.  Find the acceleration of the  |
|     stationary.\                  |     rocket.                       |
|     What is the significance of   |                                   |
|     this point?                   | $- 10$ m/s^2^                     |
|                                   |                                   |
| $$t = 2$$                         |                                   |
|                                   |                                   |
| This is the maximum height of the |                                   |
| rocket.                           |                                   |
+-----------------------------------+-----------------------------------+

Foundation

1.  A car is $d$ km from home after $t$ hours according to the formula
    $d = 10t² + 5t + 11$.

    a.  How far is the car from home:

        i.  initially?

11 km

ii. after 3 hours?

116 km

b.  At what speed is the car travelling after:

    i.  3 hours?

65 km/h

ii. 5 hours?

105 kmh

2.  The displacement of a particle is $x\  = \ t³\  - \ 9t$ cm, where
    $t$ is time in seconds.

    a.  Find the velocity of the particle at 3 s.

18 cm/s

b.  Find the acceleration at 2 s.

12 cm/s

c.  Show that the particle is initially at the origin, and find any
    other times that the particle will be at the origin.

When $t = 0,\ x = 0$

At $t = 3$

d.  At what time will the acceleration be 30 cm s⁻²?

$$t = 5$$

3.  A particle is moving with displacement $x = 2t² - 8t + 3$, where $x$
    is in metres and $t$ is in seconds.

    a.  Find its initial velocity.

$\dot{x}(0) = - 8$ m/s

b.  Show that its acceleration is constant and find its value.

$\ddot{x} = 4$, constant acceleration of 4 m/s^2^

c.  Find its displacement at 5 s.

13 m

d.  Find when the particle\'s velocity is zero.

2 s

e.  What will the particle\'s displacement be at that time?

--5 m

4.  A stone is dropped from the top of a tall building. The stone\'s
    height $h$ metres above the ground $t$ seconds later is
    $h\  = \ 80\  - \ 5t²$.

    a.  How high is the building?

$h(0) = 80$. 80 metres

b.  How many seconds does the stone take to reach the ground?

$h = 0$ when $t = 4$, so 4 seconds

c.  The velocity $v$ is the rate of change $\frac{dh}{dt}$ of the
    height. Find the velocity function.

$$v = \frac{dh}{dt} = - 10t$$

d.  How fast is the stone travelling when it hits the ground?

At $t = 4$, $v(4) = - 40$. It hits the ground at 40 m/s

e.  Acceleration is the rate of change dv/dt of the velocity. Find the
    acceleration of the stone (the units are \'metres-per-second, per
    second\', usually written as m/s²).

$$\frac{dv}{dt} = - 10\ m/s^{2}$$

5.  A particle moves in a straight line so that its displacement x m
    from a fixed point O on the line at any time $t$ seconds
    ($t\  \geq \ 0$) is given by $x = t² - 5t + 6$. Find:

    a.  its initial displacement.

6 m

b.  its initial velocity.

--5 m/s

c.  when it first passes through O and with what velocity.

$t = 2$, $v =$ --1 m/s

d.  when it passes through O the second time and with what velocity.

$t = 3,\ v = 1$ m/s

e.  when and where its velocity is zero.

$t = 2.5,$ $x = - 0.25$ m

6.  The displacement $x$ m at time $t$ seconds ($t\  \geq \ 0$) of a
    particle moving in a straight line is given by $x = t² - 5t + 4$.

    a.  At what time is its velocity zero?

$t = 2.5$ s

b.  What is the acceleration at this time?

$a = 2$ m/s²

c.  What is the distance travelled in the first 4 seconds?

8.5 m

d.  At what time is the velocity 8 m s⁻¹?

6.5 s

Development

7.  A point moving in a straight line is distant $x$ m from the origin
    $O$ at time $t$, where

$x = 2t³ - 15t² + 36t$.

a.  Find the velocity and acceleration at any time $t$.

$$\dot{x} = 6t^{2} - 30t + 36$$

$$\ddot{x} = 12t - 30$$

b.  Find the initial velocity and acceleration.

$36\$m/s, --30 m/s²

c.  At what times is the velocity zero?

$t = 2,\ 3$ s

d.  At what time is the acceleration zero? Find the velocity and
    position at this time.

$t = 2.5\$s

$\dot{x}(2.5) = - 1.5$ m/s

$x(2.5) = 27.5$ m

e.  During what interval of time is the velocity negative?

$$6t^{2} - 30t + 36 < 0$$

$$(t - 3)(t - 2) < 0$$

$$2 < t < 3$$

8.  Two bodies move along a straight path, starting at the same time, so
    their displacement $x$ m from a fixed point O at any time $t$ is
    given by $x\  = \ t\  + \ 6$ and $x\  = \ t²\  + \ 4$ respectively.\
    At what times are they:

    a.  Together.

$$t + 6 = t^{2} + 4$$

$$t = 2$$

b.  Travelling with the same velocity?

Velocities of each particle are $\dot{x} = 1$ and $\dot{x} = 2t$

$$1 = 2t$$

$t = 0.5$ s

9.  The velocity $v$ m s⁻¹ at time $t$ seconds $(t\  \geq \ 0)$ of a
    body moving in a straight line is given by
    $v\  = \ 6t²\  + \ 6t\  - \ 12$. Find:

    a.  the acceleration when the velocity is zero.

Velocity 0 at $t = 1,\ a = 18$ m/s²

b.  the initial velocity and acceleration.

At $t = 0,\ \ v = - 12$ m/s, $a = 6$ m/s²

Mastery

10. A cricket ball is thrown vertically upwards. Its height $x$ in
    metres at time $t\$seconds after it is thrown is given by
    $x = 20t - 5t²$.

    a.  Find $v$ and $a$ as functions of $t$, and show that the ball is
        always accelerating downwards. Then sketch graphs of $x$, $v$
        and $a$ against $t$.

> ![A diagram of a square and a square with arrows AI-generated content
> may be
> incorrect.](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image8.png){width="2.660416666666667in"
> height="1.1368055555555556in"}![A graph of a function AI-generated
> content may be
> incorrect.](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image9.png){width="1.3284722222222223in"
> height="1.1805555555555556in"}

$x = 5t(4 - t)$

$$v = 20 - 10t$$

$$a = - 10$$

b.  Find the speed at which the ball was thrown.

$v(0) = 20$ m/s

c.  Find when it returns to the ground (that is, when $x = 0$) and show
    that its speed then is equal to the initial speed.

It returns to the ground at $t = 4$. At both times, the speeds are 20
m/s

d.  Find its maximum height above the ground and the time taken to reach
    this height.

Max height at $t = 2\$s, $h = 20$ m

e.  Find the acceleration at the top of the flight, and explain why the
    acceleration can be non-zero when the ball is stationary.

$- 10\$m/s². Although the ball has stopped, its velocity is changing,
meaning its acceleration is non--zero.

11. A particle is moving horizontally so that its displacement $x$
    metres to the right of the origin at time $t$ seconds is given by
    the graph.

    a.  ![A graph of a function AI-generated content may be
        incorrect.](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image10.png){width="1.4575174978127734in"
        height="1.2816097987751531in"}In the first 10 seconds, what is
        its maximum distance from the origin and when does it occur?

8 metres at $t = 3$ s

b.  By examining the gradient, find when the particle is:

    i.  stationary,

> $$t = 3,\ t = 9$$

ii. moving to the right,

> Moving to the right when derivative is positive.\
> $0 \leq t < 3$ (gradient is positive)

iii. moving to the left.

> Moving to the left when derivative is negative.\
> $3 < t < 9$ (gradient is negative)

c.  When does it return to the origin and what is its velocity then?

$t = 9$, velocity is 0.

12. ![A graph of a function AI-generated content may be
    incorrect.](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image11.png){width="1.880550087489064in"
    height="1.1811023622047243in"}A particle is moving vertically
    according to the graph shown, where upwards is positive.

    a.  At what times is this particle:

        i.  below the origin?

$$0 \leq t < 8$$

ii. moving downwards?

$0 \leq t < 4$ and $t > 12$

b.  At about what time is its speed greatest?

Gradient steepest a $t \approx 8$

c.  At about what time is:

    i.  the distance from the origin about the same as at $t = 3$?

$$t \approx 5,\ 11,\ 13$$

ii. the velocity about the same as at $t = 3$?

Gradient of tangent about the same when $t \approx 13$ and
$t \approx 20$

d.  Draw an approximate sketch of the graph of $v$ as a function of
    time.

![A graph of a function AI-generated content may be
incorrect.](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image12.png){width="2.367290026246719in"
height="1.1691196412948381in"}

13. **2019 HSC Advanced Band 4**

> ![A graph of a function AI-generated content may be
> incorrect.](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image13.png){width="4.094086832895888in"
> height="1.4480577427821522in"}A particle is moving along a straight
> line. The graph shows the **acceleration** of the particle.

![A group of black letters AI-generated content may be
incorrect.](media/Introduction to Differentiation 5_The derivative as a rate of change/media/image14.png){width="0.6295002187226597in"
height="1.2758628608923885in"} For what value of $t$ is the **velocity**
$v$ a maximum?

C

Velocity is at min or max when $a = 0$

At $t = 3$, acceleration changes from positive to negative,\
so velocity changes from speeding up to slowing down.

Therefore, maximum velocity at $t = 3$.

In contrast, $t = 5$ would be minimum velocity.
