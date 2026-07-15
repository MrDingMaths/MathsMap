  -------------------------------------------------------------------
  Mathematics Advanced Year 12
  -------------------------------------------------------------------
  **Applications of\
  Calculus**

  -------------------------------------------------------------------

+-----------------------------------+-----------------------------------+-----------------------------------+
| **Book 2**                        | Optimisation                      | Version: 251202                   |
|                                   |                                   |                                   |
|                                   |                                   | Feedback:\                        |
|                                   |                                   | https://MrDingMaths.com           |
+===================================+===================================+===================================+
| **Contents**                                                                                              |
|                                                                                                           |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                                              |
|                                                                                                           |
| [Global Maxima and Minima [3](#global-maxima-and-minima)](#global-maxima-and-minima)                      |
|                                                                                                           |
| [Optimisation Problems [7](#optimisation-problems)](#optimisation-problems)                               |
|                                                                                                           |
| [Modelling Mathematical Scenarios                                                                         |
| [11](#modelling-mathematical-scenarios)](#modelling-mathematical-scenarios)                               |
|                                                                                                           |
| [Modelling and Solving Optimisation Problems                                                              |
| [21](#modelling-and-solving-optimisation-problems)](#modelling-and-solving-optimisation-problems)         |
|                                                                                                           |
| [Exam Questions [45](#exam-questions)](#exam-questions)                                                   |
+-----------------------------------------------------------------------------------------------------------+

# Syllabus Content

**MAV-12-06** applies calculus to graph functions and model and solve
problems involving optimisation, rates of change and motion in a line

**Optimisation**

- Define a global maximum of a function $f(x)$ to be a point
  $P\left( a,f(a) \right)$ on the graph where $f(x) \leq f(a)$, for all
  $x$ in the domain, and define a global minimum similarly

- Examine whether any discontinuities or endpoints of the domain on
  which $f(x)$ is being considered are points of maxima or minima

- Model optimisation problems in a variety of contexts by defining
  variables, noting domain restrictions if necessary, and establishing
  functions to represent the relationship between variables

- Solve optimisation problems by using calculus to find local and global
  maxima and minima of differentiable functions, checking
  discontinuities of $f'(x)$ and endpoints of the domain if applicable

- Formulate conclusions to optimisation problems by evaluating solutions
  given the constraints of the domain

# Global Maxima and Minima

+-----------------------------------------------------------------------+
| - **Local and Global Minimum/Maximum**                                |
+=======================================================================+
| ![](media/Applications of Calculus 2_Optimisation/media/image2.png)Mt |
| Kosciuszko is the tallest mountain in Australia.                      |
|                                                                       |
| Mt Everest is the tallest mountain in the world.                      |
|                                                                       |
| Similarly, a turning point can be:                                    |
|                                                                       |
| - A local maximum: the largest value in its *neighbourhood*.          |
|                                                                       |
| - A global maximum: the largest value in its entire domain.           |
|                                                                       |
| - A local minimum: the smallest value in its *neighbourhood*.         |
|                                                                       |
| - A global minimum: the smallest value in its entire domain.          |
|                                                                       |
| A *neighbourhood* in mathematics is\                                  |
| \"the area immediately around a point\"\                              |
| (you will learn the formal definition in university)                  |
|                                                                       |
| To find global maxima and minima, examine and compare the function    |
| value $f(x)$ at:                                                      |
|                                                                       |
| - Turning points.                                                     |
|                                                                       |
| - Domain boundaries.                                                  |
|                                                                       |
| - Discontinuities of $f'(x)$.                                         |
+-----------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------+
| - **Example** Find global maxima and minima.                                                     |
+==================================================================================================+
| ![](media/Applications of Calculus 2_Optimisation/media/image3.png){width="2.4213779527559054in" |
| height="2.3622047244094486in"}Find global maxima and minima in the domain                        |
| $\lbrack 0.5,\ 5\rbrack$ for $f(x) = x^{3} - 6x^{2} + 9x - 4$.                                   |
|                                                                                                  |
| $$f'(x) = 3x^{2} - 12x + 9$$                                                                     |
|                                                                                                  |
| Let $f'(x) = 0$                                                                                  |
|                                                                                                  |
| $$3x^{2} - 12x + 9 = 0$$                                                                         |
|                                                                                                  |
| $x^{2} - 4x + 3 = 0$                                                                             |
|                                                                                                  |
| $$(x - 3)(x + 1) = 0$$                                                                           |
|                                                                                                  |
| $x = 3,\  - 1$                                                                                   |
|                                                                                                  |
| Stationary points at $x = 3, - 1$.                                                               |
|                                                                                                  |
| Only $x = 3$ is in the domain.                                                                   |
|                                                                                                  |
| Checking $f(3) = - 4$                                                                            |
|                                                                                                  |
| Checking endpoints:                                                                              |
|                                                                                                  |
| $$f(0.5) = - \frac{7}{8}$$                                                                       |
|                                                                                                  |
| $$f(5) = 16$$                                                                                    |
|                                                                                                  |
| $\therefore$ global max at $(5,16)$                                                              |
|                                                                                                  |
| global min at $(3, - 4)$                                                                         |
+--------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                   |
+--------------------------------------------------------------------------------------------------+
| Find global minimum and maximum for $y = x^{4} - 2x + 1$ in the domain $\lbrack - 2,\ 3\rbrack$  |
|                                                                                                  |
| ![](media/Applications of Calculus 2_Optimisation/media/image4.png){width="2.4213779527559054in" |
| height="2.3622047244094486in"}                                                                   |
|                                                                                                  |
| Global maximum at $(3,64)$, global minimum at $(1,0)$                                            |
+--------------------------------------------------------------------------------------------------+
| Find global minimum and maximum for $y = 5 - \sqrt[3]{(x - 2)^{2}}$ in the domain                |
| $\lbrack - 10,\ 10\rbrack$                                                                       |
|                                                                                                  |
| ![](media/Applications of Calculus 2_Optimisation/media/image5.png){width="2.4213779527559054in" |
| height="2.3622036307961505in"}                                                                   |
|                                                                                                  |
| Global maximum at $(2,5)$, global minimum at $\left( - 10,\ 5 - \sqrt[3]{144} \right)$           |
+--------------------------------------------------------------------------------------------------+

Foundation

1.  In the diagrams below, classify each labelled point as a:

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image6.png){width="7.094339457567804in"
height="1.6745472440944882in"}Global maximum, global minimum, local
maximum, local minimum, horizontal inflection

A local max B local min C global max D local min E local max F global
min\
G global max H horizontal inflection I horizontal inflection J global
min

2.  State the global minimum and maximum of these functions. A sketch
    can help.

+--------------------------------------------------------------------------------+------------------------------------------------------------------+
| a.  $y\  = \ x^{2},\ \ \ \  - 2\  \leq \ x\  \leq \ 2$                         | b.  $y\  = \ 5\  - \ x,\ \ \ \ 0\  \leq \ x\  \leq \ 3\$         |
|                                                                                |                                                                  |
| Global minimum: 0                                                              | Global minimum: 2                                                |
|                                                                                |                                                                  |
| Global maximum: 4                                                              | Global maximum: 5                                                |
+================================================================================+==================================================================+
| c.  $y\  = \ \sqrt{16\  - \ x^{2}},\ \ \ \ \  - 4\  \leq \ x\  \leq \ 4$       | d.  $y\  = \ |x|,\ \ \ \  - 5\  \leq \ x\  \leq \ 1$             |
|                                                                                |                                                                  |
| Global minimum: 0                                                              | Global minimum: 0                                                |
|                                                                                |                                                                  |
| Global maximum: 4                                                              | Global maximum: 5                                                |
+--------------------------------------------------------------------------------+------------------------------------------------------------------+
| e.  $y\  = \ \sqrt{x},\ \ \ \ 0\  \leq \ x\  \leq \ 8$                         | f.  $y\  = \frac{1}{x},\ \ \ \ \  - 4\  \leq \ x\  \leq \  - 1$  |
|                                                                                |                                                                  |
| Global minimum: 0                                                              | Global minimum: -1                                               |
|                                                                                |                                                                  |
| Global maximum: $2\sqrt{2}$                                                    | Global maximum: $- \frac{1}{4}$                                  |
+--------------------------------------------------------------------------------+------------------------------------------------------------------+
| g.  $y\  = \ 3x^{2} - 16x + 5,\ \ \ \ 0\  \leq \ x\  \leq \ 4$                 | h.  $y\  = \sqrt[3]{x^{2}}$, $- 2\  \leq \ x\  \leq \ 8$         |
|                                                                                |                                                                  |
| Global minimum: $- \frac{49}{3}$                                               | Global minimum:$0$                                               |
|                                                                                |                                                                  |
| Global maximum: $5$                                                            | Global maximum: $4$                                              |
+--------------------------------------------------------------------------------+------------------------------------------------------------------+
| i.  $y\  = - 3x^{4} - 4x^{3} + 12x^{2} + 3,\ \ \ \ x \in \lbrack - 2,2\rbrack$ | j.  $y\  = \frac{1}{x - 2},\ \ \ \ \  - 3\  \leq \ x\  \leq \ 3$ |
|                                                                                |                                                                  |
| Global minimum: $- 29$                                                         | Global minimum: $- \infty$                                       |
|                                                                                |                                                                  |
| Global maximum: $35$                                                           | Global maximum: $\infty$                                         |
+--------------------------------------------------------------------------------+------------------------------------------------------------------+

# Optimisation Problems

+-------------------------------------------------------------------+
| - **Optimisation Problems**                                       |
+===================================================================+
| An optimisation problem involves finding the global maximum or    |
| minimum in a given domain.                                        |
|                                                                   |
| 1\. Find $f'(x)$.                                                 |
|                                                                   |
| 2\. Find stationary points in the domain and determine their      |
| nature using $f^{''}(x)$.                                         |
|                                                                   |
| 3\. Find $f(x)$ at the stationary points.                         |
|                                                                   |
| 4\. Check $f(x)$ at endpoints of the domain.                      |
|                                                                   |
| 5\. State the maximum or minimum value of $f(x)$.                 |
|                                                                   |
| - Be mindful of units given by the question.                      |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** Solve optimisation problems where equation is       |
|   given.                                                          |
+===================================================================+
| The annual expense of running a business is given by              |
| $E(x) = x^{2} - 6x + 14,$ $0 \leq x \leq 20$.\                    |
| where $E$ is in units of \$10 000 and $x$ is the number of items  |
| (in 100s) manufactured.                                           |
|                                                                   |
| Find the number of items needed to minimise the expense of the    |
| business, and the expense of the business at this production      |
| level.                                                            |
|                                                                   |
| 1\. $E'(x) = 2x - 6$                                              |
|                                                                   |
| 2\. $let\ 2x - 6 = 0$                                             |
|                                                                   |
| $x = 3$                                                           |
|                                                                   |
| $E^{''}(x) = 2$                                                   |
|                                                                   |
| $E^{''}(3) = 2 > 0$, so minimum at $x = 3$                        |
|                                                                   |
| 3\. $E(3) = 5$                                                    |
|                                                                   |
| 4\. Check endpoints: $E(0) = 14,\ E(20) = 294$                    |
|                                                                   |
| 5\. Minimum at $(3,5)$                                            |
|                                                                   |
| Producing 300 items gives minimum expense of \$50 000             |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                   |
+==================================================================================================+
| The cost, $C(v)$ in dollars of a 100 km yacht journey depends the speed $v$ of the boat in km/h. |
|                                                                                                  |
| The cost formula is given by:                                                                    |
|                                                                                                  |
| $$C(v) = \frac{50000}{v} + 4000 + 500v$$                                                         |
|                                                                                                  |
| Where $v \geq 0$.                                                                                |
|                                                                                                  |
| Find the speed of the boat that will minimise the cost, and the minimum cost.                    |
|                                                                                                  |
| 10 km/h, \$14000                                                                                 |
+--------------------------------------------------------------------------------------------------+
| A box is made by cutting out square corners from a rectangular piece of cardboard.               |
|                                                                                                  |
| The volume in cm³ depends on the length of the squares $x$ that are cut out.                     |
|                                                                                                  |
| ![](media/Applications of Calculus 2_Optimisation/media/image7.png){width="1.6041666666666667in" |
| height="1.0347222222222223in"}The volume formula is given by                                     |
|                                                                                                  |
| $$V(x) = x(12\  - \ 2x)²$$                                                                       |
|                                                                                                  |
| Where $0 \leq x \leq 6$.                                                                         |
|                                                                                                  |
| Find the length of the squares that maximises the volume of the box,\                            |
| and the maximum volume.                                                                          |
|                                                                                                  |
| 2 cm, 128 cm³                                                                                    |
+--------------------------------------------------------------------------------------------------+

Foundation

1.  The revenue equation for a manufacturer is $R(x) =$
    $\frac{80x\  - \ x^{2}}{4}$, where $x$ is the number of units sold,
    in hundreds, and $R$ is the revenue, in tens of thousands.

    a.  How many units must be sold to achieve maximum revenue?

$$\frac{dR}{dx} = \frac{80\  - \ 2x}{4} = \frac{40\  - \ x}{2}$$

Stationary point when $\frac{dR}{dx} = \ 0:$

$$40\  - \ x\  = \ 0$$

$$x\  = \ 40$$

$\frac{d^{2}R}{dx^{2}} = \  - \frac{1}{2} < \ 0$, so $x\  = \ 40$ is a
maximum

4000 units sold.

b.  What is the maximum revenue?

$$R(40)\  = \ 400$$

Revenue maximised at \$$4000\ 000$

2.  A company finds that the function
    $f(x) = \ x^{3} - \ 96x^{2} + \ 2880x\$provides a good approximation
    for their profit $f(x)$ in dollars, where $x$ is the advertising
    expenditure in thousands of dollars.

    a.  What expenditure on advertising would produce the maximum
        profit?

    b.  What is this maximum profit?

$$f'(x)\  = \ 3x²\  - \ 192x\  + \ 2880$$

Stationary points when $f'(x)\  = \ 0:$

$$x²\  - \ 64x\  + \ 960\  = \ 0$$

$x\  = \ 40$ or $x\  = \ 24$

$$f''(x)\  = \ 6x\  - \ 192$$

$f''(24)\  = \  - 48\  < \ 0,\$so $x\  = \ 24\$is a maximum

$f''(40)\  = \ 48\  > \ 0,$ so $x\  = \ 40$ is a minimum

$$f(24)\  = \ 13824\  - \ 55296\  + \ 69120\  = \ 27648$$

Maximum value: $f(24)\  = \ 27648\ at\ x\  = \ 24$

3.  Wobbly Skateboards looked at their sales in relation to their
    advertising budget. They found that the relationship between sales,
    $f(x),$ and thousands of dollars spent on advertising, $x$, was
    given by
    $f(x) = \frac{x^{3}}{3} - \ \frac{45x^{2}}{2} + \ 450x,\ \ 10\  \leq \ x\  \leq \ 40$.

    a.  What number of advertising dollars can be expected to maximise
        number of sales?

    b.  What sales can be expected for that amount of advertising?

$$f'(x) = \ x^{2} - \ 45x\  + \ 450$$

Stationary points when $f'(x)\  = \ 0:$

$$x^{2} - \ 45x\  + \ 450\  = \ 0$$

$$x\  = \ 30\ or\ x\  = \ 15$$

$$f^{''}(x) = \ 2x\  - \ 45$$

$f''(15)\  = \  - 15\  < \ 0$, so $x\  = \ 15$ is a maximum

$f''(30)\  = \ 15\  > \ 0$, so $x\  = \ 30$ is a minimum

$$f(15) = \ 1125\  - \ 5062.5\  + \ 6750\  = \ 2812.5$$

Check endpoints:

$$f(10)\  = \ 2583.33$$

$$f(40)\  = \ 3333.33$$

Maximum value: $f(40)\  = \ 3333.33\ at\ x\  = \ 40$

4.  The displacement of a particle from the origin is given by
    $x(t)\  = \ 2t³\  - \ 6t²\  - \ 30t$,\
    where $x$ is metres from the origin and $t$ is time in seconds,
    $0 \leq t \leq 3.5$.

    a.  Find the velocity and acceleration at any time $t$.

    b.  Find the initial velocity and acceleration.

    c.  At what time is the velocity zero?

    d.  What is the furthest the particle travels from the origin?

    e.  During what time interval is the velocity negative?

    f.  When is the velocity greatest in this domain? (Hint: greatest
        velocity when $\frac{dv}{dt}$ $= 0)$\
        What was the velocity at the time, and what is the significance
        of this point graphically?

$$a)\ v\  = \frac{dx}{dt} = \ 6t^{2} - \ 12t\  - \ 30$$

$$a\  = \frac{dv}{dt} = \ 12t\  - \ 12$$

b\) At $t\  = \ 0:$

$$v\  = \  - 30\ m/s$$

$$a\  = \  - 12\ m/s²$$

$c)\ v\  = \ 0\$when $6t²\  - \ 12t\  - \ 30\  = \ 0$

$$t²\  - \ 2t\  - \ 5\  = \ 0$$

$$t\  = \frac{2\  \pm \ \sqrt{24}}{2} = \ 1\  \pm \ \sqrt{6}$$

Since $t\  \geq \ 0:\ t\  = \ 1\  + \ \sqrt{6}\  \approx \ 3.45$ s

d\) particle furthest from origin, check $x(t)$ at $t = 0,\ 3.5$ and
$1 + \sqrt{6}$\
global max: 0, global min: $- 92.79$

92.79 metres.

$$e)\ v\  = \ 6t^{2} - \ 12t\  - \ 30\  = \ 6\left( t^{2} - \ 2t\  - \ 5 \right) > 0$$

Parabola opens upward, roots at $t\  = \ 1\  \pm \ \sqrt{6}$

$v\  < \ 0$ between roots

Since $1\  - \ \sqrt{6}\  < \ 0$ and particle starts at $t\  = \ 0$:

$v\  < \ 0$ for $0\  \leq \ t\  < \ 1\  + \ \sqrt{6}\  \approx \ 3.45$ s

f\) Maximum velocity when $\frac{dv}{dt}$ $= a(t)\  = \ 0$:

$$12t\  - \ 12\  = \ 0$$

$t\  = \ 1$ second

$v(1)\  = \  - 36$ m/s

Graphically, this is a global minimum on the velocity-time graph (the
turning point of the parabola).

This is a non-stationary inflection point of the displacement-time
graph.

# Modelling Mathematical Scenarios

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                                                                                                                  |
+===============================================================================================================================================================================================================+
| - Write equations relating sides, areas, volumes of geometrical figures.                                                                                                                                      |
|                                                                                                                                                                                                               |
| +---------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+ |
| | a.  The area of the triangle is 20 cm².                                                           | b.  Write an equation for $y$ in terms of $x$.                                                        | |
| |                                                                                                   |                                                                                                       | |
| | ![](media/Applications of Calculus 2_Optimisation/media/image8.png){width="1.0320002187226596in"  | ![](media/Applications of Calculus 2_Optimisation/media/image9.png){width="1.3560608048993876in"      | |
| | height="1.1186876640419947in"}Write an equation for $y$ in terms of $x.$                          | height="1.087769028871391in"}                                                                         | |
| +===================================================================================================+=======================================================================================================+ |
| | c.  Write an equation for $y$ in terms of $a$.                                                    | d.  Write an equation for shaded area of the rectangle in terms of $x$.                               | |
| |                                                                                                   |                                                                                                       | |
| | ![](media/Applications of Calculus 2_Optimisation/media/image10.png){width="1.8426531058617672in" | ![](media/Applications of Calculus 2_Optimisation/media/image11.png){width="1.5120002187226598in"     | |
| | height="1.0in"}                                                                                   | height="1.1526093613298338in"}                                                                        | |
| +---------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+ |
| | e.  Write an equation for the surface area of the cylinder in terms of $x$.                       | f.  ![](media/Applications of Calculus 2_Optimisation/media/image13.png){width="1.2640004374453193in" | |
| |                                                                                                   |     height="1.2820056867891514in"}Write an equation for the volume of the cone in terms of $x$.       | |
| | ![](media/Applications of Calculus 2_Optimisation/media/image12.png){width="1.0880008748906387in" |                                                                                                       | |
| | height="1.4532031933508311in"}                                                                    |                                                                                                       | |
| +---------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+ |
| | g.  Write an equation for the area of the triangle in terms of $\theta$.                          | h.  The volume of a square prism of height $h$ cm and base lengths $x$ cm is 400 cm². Write an        | |
| |                                                                                                   |     equation for $h$ in terms of $x.$                                                                 | |
| | ![](media/Applications of Calculus 2_Optimisation/media/image14.png){width="1.4131944444444444in" |                                                                                                       | |
| | height="1.4083333333333334in"}                                                                    | ![](media/Applications of Calculus 2_Optimisation/media/image15.png){width="1.6850196850393702in"     | |
| |                                                                                                   | height="1.174407261592301in"}                                                                         | |
| +---------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Model** mathematical scenarios using an equation.                                                                                                                                                        |
+==========================================================================================================+===================================================================================================+
| A rectangular prism has length twice its width $x,\$and height $h$ cm. Its volume is 300 cm³.            | A prism with square base has volume 64 cm³. The base has side length $x$ cm.                      |
|                                                                                                          |                                                                                                   |
| Show that $h =$ $\frac{300}{2x^{2}}$                                                                     | Show that the equation for the total surface area is $S = 2x^{2} +$ $\frac{256}{x}$               |
|                                                                                                          |                                                                                                   |
| Hence show that the surface area is given by $S = 4x^{2} +$ $\frac{900}{x}$.                             |                                                                                                   |
+----------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------+
| ABCD is a rectangle inscribed inside a right-angled triangle FED.                                        | A right-angled triangle has base 12 cm and height 8 cm.                                           |
|                                                                                                          |                                                                                                   |
| Show that $y =$ $\frac{80}{x}$                                                                           | A rectangle is inscribed inside the triangle so that the length $x$ cm lies along the base of the |
|                                                                                                          | triangle.\                                                                                        |
| Show that the triangle FED has area\                                                                     | Show that the area of the rectangle is                                                            |
| $A = 80 + 5x +$ $\frac{320}{x}$                                                                          |                                                                                                   |
|                                                                                                          | $A = 8x -$ $\frac{2x^{2}}{3}$                                                                     |
| ![A triangle with numbers and letters AI-generated content may be                                        |                                                                                                   |
| incorrect.](media/Applications of Calculus 2_Optimisation/media/image16.png){width="2.089430227471566in" | ![](media/Applications of Calculus 2_Optimisation/media/image17.png){width="1.7913735783027123in" |
| height="2.289320866141732in"}                                                                            | height="1.4086964129483814in"}                                                                    |
+----------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Model** mathematical scenarios using an equation.                                                                                                        |
+==================================================+===========================================================================================================+
| A piece of wire 12 cm long is bent into a shape  | A farmer has 60 metres of fencing to enclose a rectangular field.                                         |
| of a rectangle.                                  |                                                                                                           |
|                                                  | One side of the field is bordered by a river so needs no fencing.                                         |
| The length of the rectangle is $x$ cm and its    |                                                                                                           |
| width is $y$ cm.                                 | The side parallel to the river has length $x$ cm.                                                         |
|                                                  |                                                                                                           |
| Show that the area of the rectangle is\          | Show that the area of the field is                                                                        |
| $$A = 6x - x^{2}$$                               |                                                                                                           |
|                                                  | $A = 30x -$ $\frac{x^{2}}{2}$                                                                             |
|                                                  |                                                                                                           |
|                                                  | ![A blue and white rectangle with a black line AI-generated content may be                                |
|                                                  | incorrect.](media/Applications of Calculus 2_Optimisation/media/image18.png){width="1.4816688538932634in" |
|                                                  | height="0.984251968503937in"}                                                                             |
+--------------------------------------------------+-----------------------------------------------------------------------------------------------------------+
| A rectangular piece of cardboard of sides 50 cm and 20 cm has squares of side $x$ cm cut from each corner. The cardboard is then folded to make an open box. |
|                                                                                                                                                              |
| ![](media/Applications of Calculus 2_Optimisation/media/image19.png){width="4.95625in" height="1.6423611111111112in"}Show that the volume of the box is      |
| $V = 4x^{3} - 140x^{2} + 1000x$                                                                                                                              |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------+
| A square piece of cardboard with sides 20 cm has squares of side $x$ cm cut from each corner. The cardboard is then folded to make an open box.\             |
| Show that the volume of the box is $4x^{3} - 80x^{2} + 400x$.                                                                                                |
|                                                                                                                                                              |
| ![](media/Applications of Calculus 2_Optimisation/media/image20.png){width="1.13043416447944in" height="1.0915573053368328in"}                               |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  The product of 2 numbers is 20. Show that the sum of the numbers is
    $S\  = \ x\  +$ $\frac{20}{x}$

Product: $20\  = \ xy$

$$y = \frac{20}{x}$$

Sum: $S\  = \ x\  + \ y$

$$S\  = \ x\  + \frac{20}{x}$$

2.  The area of a rectangle is to be 50 m².\
    Show that its perimeter is given by the equation $P\  = \ 2x\  + \$
    $\frac{100}{x}$.

![A blue and white rectangle with black x AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image21.png){width="1.57793416447944in"
height="0.9033967629046369in"}Area: $50\  = \ xy$

$$\left( \frac{50}{x} \right) = \ y$$

Perimeter: $P\  = \ 2x\  + \ 2y$

$$\therefore P\  = \ 2x\  + \ 2\left( \frac{50}{x} \right)$$

$$= \ 2x\  + \frac{100}{x}$$

3.  A rectangular paddock on a farm is to have a fence with a 120 m
    perimeter.\
    Show that the area of the paddock is given by
    $A\  = \ 60x\  - \ x².$

![](media/Applications of Calculus 2_Optimisation/media/image22.png){width="1.357509842519685in"
height="0.9033967629046369in"}Perimeter: $2x\  + \ 2y\  = \ 120$

$$y\  = \ 60\  - \ x$$

$$A\  = \ xy$$

$$\ A\  = \ x(60\  - \ x)$$

$$A\  = \ 60x\  - \ x²$$

4.  A rain gutter is made from a 30 cm wide strip of metal by bending up
    the sides at right angles.

Each side is bent up by $x$ cm.\
Show that the cross-sectional area A of the gutter is
$A = \ 30x\  - \ 2x²$.

![A white rectangular object with a dotted line AI-generated content may
be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image23.png){width="1.292361111111111in"
height="0.8798611111111111in"}

Base width: $30\  - \ 2x$ (since both sides are bent up)

Height: $x$

Cross-sectional area $A\  = \ x(30\  - \ 2x)$

$$= \ 30x\  - \ 2x²$$

5.  A closed cylinder is to have a volume of 400 cm³.\
    Show that its surface area is $S\  = \ 2\pi r²\  + \$
    $\frac{800}{r}$

![](media/Applications of Calculus 2_Optimisation/media/image24.png){width="0.9458978565179352in"
height="1.3983737970253718in"}Volume: $400\  = \ \pi r²h$

$$\frac{400}{\pi r^{2}} = \ h$$

Surface area: $S\  = \ 2\pi r²\  + \ 2\pi rh$

$$S\  = \ 2\pi r²\  + \ 2\pi r\left( \frac{400}{\pi r^{2}} \right)$$

$$S\  = \ 2\pi r^{2} + \frac{800}{r}$$

6.  A closed cylindrical tin can is to hold 500 cm³ of food.

Let the radius of the base be $r$ cm.\
Show that the total surface area $S = \ 2\pi r^{2} + \frac{1000}{r}$

![A black and white cylinder AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image25.png){width="0.8780489938757655in"
height="1.205246062992126in"}$\pi r^{2}h = 500$

$$h\  = \frac{500}{\pi r^{2}}$$

$S\  = \ 2\pi r^{2} + \ 2\pi rh$

$$= \ 2\pi r^{2} + \ 2\pi r\left( \frac{500}{\pi r^{2}} \right)$$

$$= \ 2\pi r^{2} + \frac{1000}{r}$$

7.  A rectangular timber post is to be cut out of a circular log with a
    diameter of 280 mm as shown.

    a.  Show that $y\  = \ \sqrt{78400\  - \ x^{2}}.$

    b.  Show that the cross-sectional area is given by
        $A\  = \ x\sqrt{78400\  - \ x^{2}}$.

![A diagram of a circle with a rectangle and a triangle AI-generated
content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image26.png){width="2.1586067366579176in"
height="1.5732655293088365in"}

$$x^{2} + \ y^{2} = \ 280^{2} = \ 78400$$

$$y²\  = \ 78400\  - \ x²\ $$

$$y\  = \ \sqrt{78400\  - \ x^{2}}$$

$$A\  = \ xy$$

$$A\  = \ x\sqrt{78400\  - \ x^{2}}$$

8.  A 30 cm length of wire is cut into 2 pieces and each piece bent to
    form a square as shown.

    a.  Show that $y\  = \ 30\  - \ x$.

    b.  ![A line with a square and a number of letters AI-generated
        content may be
        incorrect.](media/Applications of Calculus 2_Optimisation/media/image27.png){width="3.4084251968503936in"
        height="1.5719510061242346in"}Show that the total area of the 2
        squares is given by $A\  =$ $\frac{x^{2} - \ 30x\  + \ 450}{8}$.

$$x\  + \ y\  = \ 30$$

$$y\  = \ 30\  - \ x$$

The perimeter of one square is $x$, so its side is $\frac{x}{4}.$\
The other square has side $\frac{y}{4}$.

$$A\  = \ \left( \frac{x}{4} \right)^{2} + \ \left( \frac{x}{4} \right)^{2}$$

$$A\  = \ \frac{x^{2} + y^{2}}{16}$$

$$A\  = \ \ \frac{{x^{2} + (30\  - \ x)}^{2}}{16}$$

$$A = \frac{900 - 60x + 2x^{2}}{16}$$

$$= \frac{x^{2} - 30x + 450}{8}$$

9.  A rectangle is inscribed in a semicircle of radius 5 cm with one
    side along the diameter.

The rectangle has width $2x$ cm (centred on the diameter).\
Show that the area of the rectangle is
$A = \ 2x\sqrt{25\  - \ x^{2}}$*.*

![A black and white outline of a bucket AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image28.png){width="1.8025054680664916in"
height="0.9674792213473316in"}By Pythagoras, height $h$
satisfies$\ x²\  + \ h²\  = \ 25$

$$h\  = \ \sqrt{25\  - \ x^{2}}$$

$$A = \ width\  \times \ height\ $$

$$= \ 2x \cdot \sqrt{25\  - \ x^{2}}$$

Development

10. ![A diagram of a rectangular object with a measuring tape
    AI-generated content may be
    incorrect.](media/Applications of Calculus 2_Optimisation/media/image29.png){width="4.3658541119860015in"
    height="1.4935181539807525in"}A 10 cm by 7 cm rectangular piece of
    cardboard has square corners with side $x$ cm cut out.\
    The sides are folded up to make an open box as shown.\
    Show that the volume of the box is
    $V\  = \ 70x\  - \ 34x²\  + \ 4x³\$.

$$V\  = \ x(10\  - \ 2x)(7\  - \ 2x)$$

$$= \ x\left( 70\  - \ 20x\  - \ 14x\  + \ 4x^{2} \right)$$

$$= \ x\left( 70\  - \ 34x\  + \ 4x^{2} \right)$$

$$= \ 70x\  - \ 34x²\  + \ 4x³$$

11. A farmer has 80 metres of fencing to enclose a rectangular paddock.

One side of the paddock is bordered by a straight river and requires no
fencing.

The side parallel to the river has length $x$ metres.\
Show that the area $A$ is $A$ $= \ 40x\  - \frac{x^{2}}{2}$

![A blue and white rectangle with a black line AI-generated content may
be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image18.png){width="1.4972812773403326in"
height="0.9946227034120735in"}Let width = $w$

$$x\  + \ 2w\  = \ 80$$

$$w\  = \frac{80\  - \ x}{2}$$

$$A\  = \ xw\ $$

$$= \ x\left( \frac{80\  - \ x}{2} \right)$$

$$= \ 40x\  - \frac{x^{2}}{2}$$

12. A closed box with a rectangular base has length three times its
    width.

The width is $x$ cm and the total surface area is 216 cm².\
Show that the volume is $V = \ 81x\  - \frac{9x^{3}}{4}$

![A black and white rectangular object AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image30.png){width="1.1803215223097112in"
height="1.5447156605424321in"}Length = 3x, width = x, height = h

2(3x)(x) + 2(x)(h) + 2(3x)(h) = 216

$$6x^{2} + \ 2xh\  + \ 6xh\  = \ 216,\ $$

$$6x^{2} + \ 8xh\  = \ 216$$

$$h\  = \frac{216\  - \ 6x^{2}}{8x} = \frac{27}{x} - \frac{3x}{4}$$

$$V\  = \ 3x \cdot x \cdot h\ $$

$$= \ 3x^{2}\left( \frac{27}{x} - \frac{3x}{4} \right)$$

$$= \ 81x\  - \frac{9x^{3}}{4}$$

13. ![A black and white vertical lines AI-generated content may be
    incorrect.](media/Applications of Calculus 2_Optimisation/media/image31.png){width="1.0946380139982501in"
    height="1.6643635170603674in"}A rectangular enclosure of area 288 m²
    is to be divided into three equal pens by two internal fences
    parallel to one side. Let the external width (perpendicular to the
    dividers) be $x$ metres. Show that the equation for the total
    fencing is $F = 2x + \frac{1152}{8}$

$x \times$ length $= \ 288,$

length $=$ $\frac{288}{x}$

Total fencing = 2 widths + 4 lengths

$$F\  = \ 2x + \ 4\left( \frac{288}{x} \right)\ $$

$$= 2x + \frac{1152}{8}$$

14. A farmer uses 200 m of fencing to create four adjacent rectangular
    pens of equal size.\
    Each pen has width $x$ metres (perpendicular to the shared sides).\
    Show that the total enclosed area $A = 160x - \frac{32x^{2}}{5}$

![](media/Applications of Calculus 2_Optimisation/media/image32.png){width="1.1788615485564304in"
height="1.2781583552055993in"}Let length of each pen $\mathcal{= \ l}$

$$2(4x)\  + \ 5\mathcal{l\  = \ }200$$

$$\mathcal{l\  =}\frac{200\  - 8x}{5}$$

$$= \ 40 - \frac{8}{5}x$$

$$A\  = \ 4x\mathcal{l\ }$$

$$= \ 4x\left( 40 - \frac{8}{5}x \right)$$

$$= 160x - \frac{32x^{2}}{5}$$

15. An isosceles triangle has base 16 cm and height 12 cm.

An isosceles trapezium is inscribed with its longer parallel side along
the base of the triangle.

The trapezium has height $x$ cm. Show that the area of the trapezium is
$A = \ 16x\  - \frac{2x^{2}}{3}$

![A black triangle with a white background AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image33.png){width="1.2357720909886265in"
height="1.7884547244094489in"}

By similar triangles, at height $x$, the width of triangle is
$\frac{16(12 - x)}{12}$

Top of trapezium $=$ $\frac{16(12 - x)}{12}$

$$= \ 16\  - \frac{4x}{3}$$

Bottom of trapezium $= \ 16$

$$A\  = \ \left( \frac{1}{2} \right)(top\  + \ bottom) \times height\  = \ \left( \frac{1}{2} \right)\left( 16\  - \frac{4x}{3} + \ 16 \right) \times x$$

$$= \ 16x\  - \frac{2x^{2}}{3}$$

16. A cylinder of radius $r$ cm is inscribed in a sphere of radius 8 cm.

Show that the volume of the cylinder is
$V = \ 2\pi r^{2}\sqrt{64\  - \ r^{2}}$

![A black and white circle with a cylinder in it AI-generated content
may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image34.png){width="1.6666666666666667in"
height="1.6055555555555556in"}Let half-height of cylinder $= \ h$ (so
full height = $2h$)

By Pythagoras: $r^{2} + \ h^{2} = \ 64,\$

$$h\  = \ \sqrt{64\  - \ r^{2}}$$

$$V\  = \ \pi r^{2}(2h)$$

$$= \ 2\pi r^{2}\sqrt{64\  - \ r^{2}}$$

17. A travel agency calculates the expense $E$ per person of organising
    a holiday in a group of $x$ people as $E\  = \ 200\  + \ 400x$. The
    cost $C$ for each person taking a holiday is $C = 900 - 100x$. Show
    that the profit to the travel agency with a group of $x$ people is
    given by $P = 700x - 500x²$.

Profit per person = Cost - Expenses

$$P\  = \ (900\  - \ 100x)\  - \ (200\  + \ 400x)$$

$$= \ 700\  - \ 500x$$

Profit = $x$ people $\times$ profit per person

$$P\  = \ x(700\  - \ 500x)$$

$$= 700x - 500x^{2}$$

18. A theatre has 500 seats. When tickets are priced at \$20, all seats
    are sold.

For each \$2 increase in price, 25 fewer tickets are sold. Let $x$ be
the number of \$2 increases. Show that the total revenue is
$R\  = \ 10000\  + \ 500x\  - \ 50x^{2}$

Price $= \ 20\  + \ 2x$ dollars

Number sold $= \ 500\  - \ 25x$

$$R\  = \ (20\  + \ 2x)(500\  - \ 25x)$$

$$= \ 10000\  - \ 500x\  + \ 1000x\  - \ 50x^{2}$$

$$R\  = \ 10000\  + \ 500x\  - \ 50x^{2}$$

19. A newsagent currently sells 600 newspapers per day at 80c each.\
    Research suggests that for every 5c reduction in price, an
    additional 50 papers will be sold.

Let $x$ be the number of 5c reductions. Show that the daily revenue in
cents is *\*
$$R\  = \ 48000\  + \ 1000x\  - \ 250x²$$

Price $= \ 80\  - \ 5x$ cents

Number sold $= \ 600\  + \ 50x$

$$R\  = \ (80\  - \ 5x)(600\  + \ 50x)$$

$$R\  = \ 48000\  + \ 1000x\  - \ 250x²$$

20. A poster has 150 cm² of printed area with margins of 4 cm at top and
    bottom and 3 cm on sides. The printed area has width $x$ cm. Show
    that the total area of the poster is *\*
    $$A\  = \ 198\  + \ 8x\  + \frac{900}{x}$$

![](media/Applications of Calculus 2_Optimisation/media/image35.png){width="1.4320866141732282in"
height="1.8181813210848643in"}Printed width $= \ x$, printed area
$= \ 150$

So printed height $=$ $\frac{150}{x}$

Total width $= \ x\  + \ 6$, total height $=$ $\frac{150}{x}$ $\  + \ 8$

$$A\  = \ (x\  + \ 6)\left( \frac{150}{x} + \ 8 \right)$$

$$= \ 150\  + \ 8x\  + \frac{900}{x} + \ 48$$

$$A\  = \ 198\  + \ 8x\  + \frac{900}{x}$$

21. A rectangular billboard displays 48 m² of advertising with border of
    width $x$ metres on all sides. The advertising area is twice as long
    as it is wide. Let the width of the advertising be $w$ metres. Show
    that the total area of the billboard is
    $A = \ 48\  + \ 12\sqrt{6}\ x\  + \ 4x^{2}$.

![A black and white rectangular frame AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image36.png){width="2.178845144356955in"
height="1.2936887576552931in"}

Advertising dimensions: width $w$, length $2w$

Advertising area: $w\  \times \ 2w\  = \ 48$

$$\therefore w\  = \ 2\sqrt{6}$$

Total dimensions: width $= \ w\  + \ 2x$, length $= \ 2w\  + \ 2x$

Total area $A\  = \ (w\  + \ 2x)(2w\  + \ 2x)$

$$= \ 2w²\  + \ 2wx\  + \ 4wx\  + \ 4x^{2}$$

$$A\  = \ 2w^{2} + \ 6wx\  + \ 4x^{2}$$

$$= \ 48\  + \ 12\sqrt{6}\ x\  + \ 4x^{2}$$

Mastery

22. Joel is 700 km north of a town, travelling towards it at an average
    speed of 75 km h⁻¹.\
    Nick is 680 km east of the town, travelling towards it at 80 km
    h⁻¹.\
    Show that, after $t$ hours, the distance between Joel and Nick is\
    $d\  = \ \sqrt{952\ 400\  - \ 213\ 800t\  + \ 12\ 025t^{2}}$.

![A diagram of a height AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image37.png){width="2.7159087926509184in"
height="1.529400699912511in"}

After $t$ hours, Joel has travelled $75t\$km. He is $700\  - \ 75t$ km
from the town.

After $t$ hours, Nick has travelled $80t$ km. He is $680\  - \ 80t$ km
from the town.

$$d^{2} = \ (700\  - \ 75t)^{2} + \ (680\  - \ 80t)^{2}$$

$$= \ 490000\  - \ 105000t\  + \ 5625t²\  + \ 462400\  - \ 108800t\  + \ 6400t²$$

$$= \ 952400t²\  - \ 213800t\  + \ 12025t²$$

$$d\  = \ \sqrt{952\ 400t^{2} - \ 213\ 800t\  + \ 12\ 025t^{2}}$$

23. Taylor swims from point $A$ to point $B$ across a 500 m wide river,
    then walks along the river to point C. The distance along the river
    is 7 km. If she swims at 5 km h⁻¹ and walks at 4 km h⁻¹, show that
    the time taken to reach point C is given by $t\  =$
    $\frac{\sqrt{x^{2} + \ 0.25}}{5}$ $+$ $\frac{7\  - \ x}{4}$.

The river is 500 m, or 0.5 km, wide.

![A diagram of a straight line AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image38.png){width="3.021126421697288in"
height="1.4393252405949257in"}Distance AB:

$$d\  = \ \sqrt{x^{2} + \ {0.5}^{2}}$$

$$d\  = \ \sqrt{x^{2} + \ 0.25}$$

time = $\left( \frac{distance}{speed} \right)$

$$t_{AB}\  = \frac{\sqrt{x^{2} + \ 0.25}}{5}$$

Distance BC:

$$d\  = \ 7\  - \ x$$

$$t_{BC}\  = \frac{7\  - \ x}{4}$$

So total time taken is

$$t\  = \frac{\sqrt{x^{2} + \ 0.25}}{5} + \frac{7\  - \ x}{4}$$

24. A pipeline is to connect a refinery at point R to a storage facility
    at point $S$.

$R$ is 6 km from a straight shoreline and $S$ is 10 km along the shore
from the point nearest $R$.

The pipeline costs £80,000 per km underwater and £50,000 per km on land.

The pipeline goes underwater to a point $x$ km along the shore, then
continues on land.

Show that the total cost in pounds is
$C\  = \ 80000\sqrt{36\  + \ x^{2}} + \ 500000\  - \ 50000x$

![](media/Applications of Calculus 2_Optimisation/media/image39.png){width="1.4729166666666667in"
height="1.1847222222222222in"}

Underwater distance
$= \ \sqrt{6^{2} + \ x^{2}} = \ \sqrt{36\  + \ x^{2}}$

Land distance $= \ 10\  - \ x$

$$C\  = \ 80000\sqrt{36\  + \ x^{2}} + \ 50000(10\  - \ x)$$

$$C\  = \ 80000\sqrt{36\  + \ x^{2}} + \ 500000\  - \ 50000x$$

25. A person at point $A$ on a straight beach wants to reach point $B$,
    which is 3 km along the beach and 2 km out to sea.

They can run along the beach at 10 km/h and swim at 4 km/h.

They run $x$ km along the beach before swimming.\
Show that the total time required in hours is
$T\  = \frac{x}{10} + \frac{\sqrt{(3 - x)^{2} + \ 4}}{4}$.

![](media/Applications of Calculus 2_Optimisation/media/image40.png){width="1.4812128171478565in"
height="1.1849704724409449in"}Running time = $\frac{x}{10}$

Swimming distance
$= \ \sqrt{(3 - x)^{2} + \ 2^{2}} = \ \sqrt{(3 - x)^{2} + \ 4}$

Swimming time $=$ $\frac{\sqrt{(3 - x)^{2} + \ 4}}{4}$

Total time:

$$T\  = \frac{x}{10} + \frac{\sqrt{(3 - x)^{2} + \ 4}}{4}$$

26. A sector with angle $\theta$ radians is cut from a circle of radius
    12 cm and formed into a cone by joining the straight edges so that
    the arc length becomes the circumference of the base.

![](media/Applications of Calculus 2_Optimisation/media/image41.png){width="3.3153226159230096in"
height="1.0446423884514435in"}Show that the volume $V$ of the cone is
$V\  = \frac{12\theta^{2}}{\pi}\sqrt{144 - \frac{36\theta^{2}}{\pi^{2}}}$.

Arc length = $12\theta\$= circumference of base = $2\pi r$

$$r\  = \frac{6\theta}{\pi}$$

Slant height $= \ 12$, so $h^{2} = \ 144\  - \ r^{2} = \ 144\  -$
$\frac{36\theta^{2}}{\pi^{2}}$

$$h\  = \ \sqrt{144\  - \frac{36\theta^{2}}{\pi^{2}}}$$

$$V\  = \ \left( \frac{1}{3} \right)\pi r^{2}h\ $$

$$V\  = \frac{12\theta^{2}}{\pi}\sqrt{144 - \frac{36\theta^{2}}{\pi^{2}}}$$

27. A rain gutter is to be constructed from a sheet of metal of width 30
    cm by bending up one third of the sheet on each side though an angle
    $\theta$.\
    Show that the cross-sectional area of the gutter is
    $A = 100\sin\theta + 100\sin\theta\cos\theta$.

![A diagram of a measurement AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image42.png){width="2.8752734033245844in"
height="1.0597014435695538in"}Height of trapezium: $10\sin\theta$

Top parallel length of the trapezium: $10 + 20\cos\theta$

Bottom length of trapezium:

$$A = \frac{h}{2}(a + b)$$

$$A = \frac{10\sin\theta}{2}(10 + \left( 10 + 20\cos{\theta)} \right)$$

$$= 5\sin\theta\left( 20 + 20\cos\theta \right)$$

$$= 100\sin\theta + 100\sin\theta\cos\theta$$

# Modelling and Solving Optimisation Problems

+-------------------------------------------------------------------+
| - **Modelling a Scenario**                                        |
+===================================================================+
| 1\. Form an equation for the quantity being maximised or          |
| minimised with only one variable,                                 |
|                                                                   |
| 2\. Note any restrictions, e.g. most real-life quantities can't   |
| be negative.                                                      |
|                                                                   |
| 3\. Find global minima and maxima.\                               |
| You **must** check that a point is a maximum or minimum using     |
| $f^{''}(x)$ or slope table.                                       |
|                                                                   |
| 4\. Answer the question.                                          |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------+
| - **Example** Model and solve an optimisation problem.                                                     |
+============================================================================================================+
| A sheet of cardboard measures 15 cm by 7 cm. Four equal squares are cut out of the corners and the sides   |
| are turned up to form an open rectangular box.                                                             |
|                                                                                                            |
| ![](media/Applications of Calculus 2_Optimisation/media/image43.png){width="1.8069444444444445in"          |
| height="1.167361111111111in"}Find the side length of the squares that makes the maximises the volume of    |
| the box, and the maximised volume..                                                                        |
|                                                                                                            |
| 1\.                                                                                                        |
|                                                                                                            |
| The dimensions of the base of the box are                                                                  |
|                                                                                                            |
| $(15 - 2x)$ and $(7 - 2x)$ cm                                                                              |
|                                                                                                            |
| The height will be $x\$cm.                                                                                 |
|                                                                                                            |
| $$V(x) = x(15 - 2x)(7 - 2x)$$                                                                              |
|                                                                                                            |
| $$V(x) = 4x^{3} - 44x^{2} + 105x$$                                                                         |
|                                                                                                            |
| 2\.                                                                                                        |
|                                                                                                            |
| $x$ must be less than half the shortest side and can't be negative.                                        |
|                                                                                                            |
| $$0 \leq x < 3.5$$                                                                                         |
|                                                                                                            |
| 3\.                                                                                                        |
|                                                                                                            |
| Find stationary points:                                                                                    |
|                                                                                                            |
| $$V'(x) = 12x^{2} - 88x + 105 = 0$$                                                                        |
|                                                                                                            |
| $(2x - 3)(6x - 35) = 0$                                                                                    |
|                                                                                                            |
| $$x = \frac{3}{2}\ or\frac{35}{6}$$                                                                        |
|                                                                                                            |
| Only $\frac{3}{2}$ is in the domain.                                                                       |
|                                                                                                            |
| Checking maximum:                                                                                          |
|                                                                                                            |
| $$V^{''}(x) = 24x - 88$$                                                                                   |
|                                                                                                            |
| $$V^{''}\left( \frac{3}{2} \right) = - 52 < 0\therefore maximum\ at\ x = \frac{3}{2}.$$                    |
|                                                                                                            |
| 4\.                                                                                                        |
|                                                                                                            |
| $$Cut\ out\ side\ lengths\ of\ 1.5\ cm,\ maximised\ volume\ is\ V\left( \frac{3}{2} \right) = 72\ cm^{3}$$ |
+------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                             |
+------------------------------------------------------------------------------------------------------------+
| An open rectangular box is made from cutting square corners out of a piece of 60 x 60 cm cardboard and     |
| folding up the sides. What is the maximum volume of the box and what are the dimensions of the box?        |
|                                                                                                            |
| ![](media/Applications of Calculus 2_Optimisation/media/image20.png){width="1.3125in"                      |
| height="1.2673611111111112in"}                                                                             |
|                                                                                                            |
| 10 x 40 x 40 cm; 16 000 cm³                                                                                |
+------------------------------------------------------------------------------------------------------------+
| The council wants to make a rectangular swimming area at the beach using the seashore on one side and 300  |
| m of shark-proof netting for 3 sides. What are the dimensions of the rectangle that encloses the greatest  |
| area?                                                                                                      |
|                                                                                                            |
| ![A blue and white rectangle with a black line AI-generated content may be                                 |
| incorrect.](media/Applications of Calculus 2_Optimisation/media/image18.png){width="1.4568963254593177in"  |
| height="0.9677952755905512in"}                                                                             |
|                                                                                                            |
| 150 x 75 m; 11250 m²                                                                                       |
+------------------------------------------------------------------------------------------------------------+
| Sophie needs to get from point A to point B across a wide river.\                                          |
| The river is 20 m wide, and B is 80 m horizontally from A.\                                                |
| She swims across the river at a speed of 7 km/h and runs at 11 km/h.\                                      |
| Find the swimming distance $x$ that will minimise her total travel time.                                   |
|                                                                                                            |
| Hint: $t =$ $\frac{d}{s}$                                                                                  |
|                                                                                                            |
| ![](media/Applications of Calculus 2_Optimisation/media/image44.png){width="2.2738440507436573in"          |
| height="1.0779221347331585in"}                                                                             |
|                                                                                                            |
| 25.9 m                                                                                                     |
+------------------------------------------------------------------------------------------------------------+

Foundation

1.  a.  Given that $P = xy$ and $2x + y = 12$, write $P$ as a function
        of $x$.

    b.  Find $\frac{dP}{dx}$, and hence determine the value of $x$ that
        maximises $P$.

    c.  Hence find the maximum value of $P$.

$$y\  = \ 12\  - \ 2x\ $$

$$P\  = \ x(12\  - \ 2x)$$

$$P\  = \ 12x\  - \ 2x^{2}$$

$$\frac{dP}{dx} = \ 12\  - \ 4x = 0$$

$$x\  = \ 3$$

  ----------------------------------------------------
  $$x$$               $$0$$   $$3$$   $$4$$
  ------------------- ------- ------- ----------------
  $$\frac{dP}{dx}$$   $$/$$   $$-$$   $$\backslash$$

  ----------------------------------------------------

Stationary point at $x\  = \ 3$ is a maximum.

Don't need to check endpoints as this is a parabola with no restriction.

The value of $x$ that maximises P is 3.

P(3) = 18. Maximum value of P is 18.

2.  a.  Given that $Q\  = \ x²\  + \ y²$ and $x\  + \ y\  = \ 8$, write
        $Q$ as a function of $x$.

    b.  Find $\frac{dQ}{dx}$ and hence determine the value of $x$ that
        minimises $Q$.

    c.  Hence find the minimum value of $P$.

$y\  = \ 8\  - \ x$

$Q\  = \ x^{2} + \ (8\  - \ x)^{2}$

$$Q\  = \ 2x²\  - \ 16x\  + \ 64$$

$$\frac{dQ}{dx} = \ 4x\  - \ 16\  = \ 0$$

$$x\  = \ 4$$

  ----------------------------------------------------
  $$x$$               $$0$$            $$4$$   $$5$$
  ------------------- ---------------- ------- -------
  $$\frac{dQ}{dx}$$   $$\backslash$$   $$-$$   $$/$$

  ----------------------------------------------------

Stationary point at $x\  = \ 3$ is a maximum.

Don't need to check endpoints as this is a parabola with no restriction.

The value of $x$ that minimises $Q$ is 4.

$Q(4)$ = 32. Minimum value of $Q$ is 32.

3.  The quantity $V$ grams of vitamins present in a patient\'s
    bloodstream $t$ hours after taking vitamin tablets is given by
    $V\  = \ 4t²\  - \ t³$, for $0\  \leq \ t\  \leq \ 3.$ Find
    $\frac{dV}{dt}\$and hence determine when the quantity of vitamins in
    the patient\'s bloodstream is at its maximum.

$$\frac{dV}{dt} = \ 8t\  - \ 3t^{2}\ $$

$$8t\  - \ 3t^{2} = \ 0$$

$t(8\  - \ 3t) = \ 0$

Stationary points at $t\  = \ 0$ and $t\  =$ $\frac{8}{3}$

  -------------------------------------------------------------------------------
  $$t$$               $$- 1$$          $$0$$   $$1$$   $$8/3$$   $$3$$
  ------------------- ---------------- ------- ------- --------- ----------------
  $$\frac{dV}{dt}$$   $$\backslash$$   $$-$$   $$/$$   $$-$$     $$\backslash$$

  -------------------------------------------------------------------------------

minimum at $t\  = \ 0$, maximum at $t\  =$ $\frac{8}{3}$.

$$V\left( \frac{8}{3} \right) = 9.48$$

Check endpoints: $V(0) = 0,\ V(3) = 9$

$\therefore$ Maximum occurs when t = $\frac{8}{3}$ hours (or 2 h 40 min)

4.  A landscaper is constructing a rectangular garden bed.\
    Three of the sides are to be fenced using 40 metres of fencing,
    while an existing wall will form the fourth side of the rectangle.

    a.  Let $x$ be the length of each of the two sides perpendicular to
        the wall.\
        Show that the side parallel to the wall has length
        $40\  - \ 2x$.

    b.  Show that the area of the garden bed is given by
        $A\  = \ 40x\  - \ 2x²$.

    c.  Find $\frac{dA}{dx}$ and hence find the value of $x$ that
        maximises $A$.

    d.  Find the maximum possible area of the garden bed.

Let y be the length parallel to the wall.\
Perimeter: $40 = 2x + y$

$$y = 40 - 2x$$

$A\  = \ xy$ and $y\  = \ 40\  - \ 2x,\$

$$A\  = \ x(40\  - \ 2x)$$

$$A\  = \ 40x\  - \ 2x²$$

$$\frac{dA}{dx} = \ 40\  - \ 4x = 0$$

$$x\  = \ 10$$

  -----------------------------------------------------
  $$x$$               $$0$$   $$10$$   $$11$$
  ------------------- ------- -------- ----------------
  $$\frac{dA}{dx}$$   $$/$$   $$-$$    $$\backslash$$

  -----------------------------------------------------

maximum at $x\  = \ 10$.\
The value of $x$ that maximises the area is 10 metres.

$$A(10)\  = \ 200\ m^{2}$$

5.  A rectangle has a constant area of 36 cm².

    a.  If $x$ is the length of the rectangle, show that the width is
        $\frac{36}{x}$.

    b.  Show that the perimeter of the rectangle is given by
        $P\  = \ 2x\  +$ $\frac{72}{x}$.

    c.  Show that $\frac{dP}{dx}$ $= \ 2\  -$ $\frac{72}{x^{2}}$ and
        hence that the minimum value of $P$ occurs at $x\  = \ 6$.

    d.  Find the minimum possible perimeter of the rectangle.

Area $= \ xy\  = \ 36$

$$y\  = \frac{36}{x}$$

$$P\  = \ 2x\  + \ 2y$$

$$= \ 2x\  + \ 2\left( \frac{36}{x} \right)\ $$

$$= \ 2x\  + \frac{72}{x}$$

$$P\  = \ 2x\  + \ 72x^{- 1}$$

$$\frac{dP}{dx} = \ 2\  - \ 72x^{- 2}$$

$$2\  - \frac{72}{x^{2}} = \ 0$$

$$x\  = \ 6\ (as\ x\  > \ 0)$$

  ------------------------------------------------------------------------
  $$x$$               $$- 7$$   $$- 6$$   $$0$$            $$6$$   $$7$$
  ------------------- --------- --------- ---------------- ------- -------
  $$\frac{dP}{dx}$$   $$/$$     $$-$$     $$\backslash$$   $$-$$   $$/$$

  ------------------------------------------------------------------------

Minimum value of P occurs when$\ x\  = \ 6.$

$$P(6) = \ 24\ cm$$

6.  A 10 cm length of wire is cut into two pieces from which two squares
    are formed.

    a.  If one piece has length $x$, find the side length of each
        square.

    b.  Show that the combined area of the two squares is
        $A\  = \frac{x^{2} - \ 10x\  + \ 50}{8}$.

    c.  Find $\frac{dA}{dx}$ and hence find the value of $x$ that
        minimises $A$.

    d.  Find the least possible combined area.

Side length of one square: $\frac{x}{4}$

Side length of other square: $\frac{10\  - \ x}{4}$

$$A\  = \ \left( \frac{x}{4} \right)^{2} + \ \left( \frac{10\  - \ x}{4} \right)^{2}\ $$

$$A\  = \frac{2x^{2} - \ 20x\  + \ 100}{16}$$

$$A\  = \frac{x^{2} - \ 10x\  + \ 50}{8}$$

$$\frac{dA}{dx} = \frac{(2x\  - \ 10)}{8}$$

$\frac{dA}{dx} = \frac{(x\  - \ 5)}{4}$

$\frac{dA}{dx}$ $= \ 0$ when $x\  = \ 5$

Since $\frac{d^{2}A}{dx^{2}} = \frac{1}{4}$ $\  > \ 0$ for all $x$, the
function is concave up.

The value of $x$ that minimises $A$ is 5.

$A(5) =$ $\frac{25}{8}$ Least possible combined area is $\frac{25}{8}$
cm²

7.  A window frame consisting of six equal rectangles is shown.\
    Only 12 metres of frame is available for its construction.

    a.  If the entire frame has height $h$ metres and width w metres,
        show that $w\  =$ $\frac{12\  - \ 3h}{4}$

    b.  Show that the area of the window is $A = 3h - \frac{3}{4}h²$.

    c.  Find $\frac{dA}{dh}$ and hence find the dimensions of the frame
        for which the area of the window is maximised.

![A grid of white squares AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image45.png){width="1.0952482502187226in"
height="1.249128390201225in"}Perimeter: $3h\  + \ 4w\  = \ 12$

$$w\  = \frac{12\  - \ 3h}{4}$$

$A\  = \ hw$

$$A\  = \frac{h(12\  - \ 3h)}{4}\ $$

$$A\  = \ 3h\  - \frac{3h^{2}}{4}$$

$$\frac{dA}{dh} = \ 3\  - \frac{3h}{2}$$

$$3\  - \frac{3h}{2} = \ 0$$

$$h\  = \ 2$$

  ----------------------------------------------------
  $$h$$               $$0$$   $$2$$   $$3$$
  ------------------- ------- ------- ----------------
  $$\frac{dA}{dh}$$   $$/$$   $$-$$   $$\backslash$$

  ----------------------------------------------------

Maximum at $h = 2$ m. $w(2)\  = \ 1.5$ m

Development

8.  a.  An open rectangular box is to be formed by cutting squares of
        side length $x$ cm from the corners of a rectangular sheet of
        metal that has length 40 cm and width 15 cm.

    b.  Show that the volume of the box is given by
        $V\  = \ 600x\  - \ 110x²\  + \ 4x³.$

    c.  Find $\frac{dV}{dx}$ and hence find the value of $x$ that
        maximises the volume of the box.

$$V\  = \ l\  \times \ w\  \times \ h$$

$$V\  = \ (40\  - \ 2x)(15\  - \ 2x)x$$

$$V\  = \ x(600\  - \ 110x\  + \ 4x²)$$

$$V\  = \ 600x\  - \ 110x²\  + \ 4x^{3}$$

$$\frac{dV}{dx} = \ 600\  - \ 220x\  + \ 12x^{2}$$

$$= \ 4\left( 150\  - \ 55x\  + \ 3x^{2} \right)$$

$$= \ 4(3x\  - \ 10)(x\  - \ 15)$$

$\frac{dV}{dx}$ $= \ 0$ when $4(3x\  - \ 10)(x\  - \ 15)\  = \ 0$

Stationary points at $x\  =$ $\frac{10}{3}$ and $x\  = \ 15$

  ---------------------------------------------------------------------------------
  $$x$$               $$0$$   $$\frac{10}{3}$$   $$5$$            $$15$$   $$16$$
  ------------------- ------- ------------------ ---------------- -------- --------
  $$\frac{dV}{dx}$$   $$/$$   $$-$$              $$\backslash$$   $$-$$    $$/$$

  ---------------------------------------------------------------------------------

Local maximum at $x\  =$ $\frac{10}{3}$. The value of $x$ that maximises
the volume is $\frac{10}{3}$.

9.  The sum of the height $h$ of a cylinder and the circumference of its
    base is 10 metres.

    a.  Show that $h = 10 - 2\pi r$, where $r$ is the radius of the
        cylinder.

    b.  Show that the volume of the cylinder is
        $V\  = \ \pi r²(10\  - \ 2\pi r).$

    c.  Find $\frac{dV}{dr}$ and hence find the value of $r$ at which
        the volume is a maximum.

    d.  Hence find the maximum possible volume of the cylinder.

$$h\  + \ 2\pi r\  = \ 10$$

$$h\  = \ 10\  - \ 2\pi r$$

$$V\  = \ \pi r²\  \times \ h\  = \ \pi r^{2}(10\  - \ 2\pi r)$$

$$\frac{dV}{dr} = \ 20\pi r\  - \ 6\pi^{2}r^{2} = \ r\left( 20\pi\  - \ 6\pi^{2}r \right)$$

V has stationary points when $r\  = \ 0$ or $20\pi\  - \ 6\pi ²r\  =$ 0,
so $r\  =$ $0,\$ $\frac{10}{3\pi}$

  -------------------------------------------------------------------------
  $$r$$                       $$0$$           $$\frac{10}{3\pi}$$   
  ------------------- ------- ------- ------- --------------------- -------
  $$\frac{dV}{dr}$$   $$-$$   $$0$$   $$+$$   $$0$$                 $$-$$

  -------------------------------------------------------------------------

$r\  =$ $\frac{10}{3\pi}$ is a maximum turning point.

Maximum volume:
$V\  = \ \pi\left( \frac{10}{3\pi} \right)^{2}\left( 10\  - \ 2\pi\left( \frac{10}{3\pi} \right) \right)$

$$= \frac{1000}{27\pi}$$

10. A closed cylindrical can is to have a surface area of $60\pi$ cm².

    a.  Let the cylinder have height $h$ and radius $r$. Show that
        $h\  = \frac{30\  - \ r^{2}}{r}.$

    b.  Show that the volume of the can is $V\  = \ \pi r(30\  - \ r²).$

    c.  Find $\frac{dV}{dr}$ and hence find the maximum possible volume
        of the can.

$2\pi rh\  + \ 2\pi r²\  = \ 60\pi$

$$h\  = \frac{60\pi\  - \ 2\pi r^{2}}{2\pi r} = \frac{30\  - \ r^{2}}{r}$$

$$V\  = \ \pi r^{2} \times \ h\  = \ \pi r^{2} \times \frac{30\  - \ r^{2}}{r} = \ \pi r\left( 30\  - \ r^{2} \right)$$

$\frac{dV}{dr} = \frac{d\left( 30\pi r\  - \ \pi r^{3} \right)}{dr}$
$= \ 30\pi\  - \ 3\pi r^{2} = \ 0\$

$r²\  = \ 10$, so $r\  = \ \sqrt{10}$

  ---------------------------------------------------
  $$r$$               0       $$\sqrt{10}$$   4
  ------------------- ------- --------------- -------
  $$\frac{dV}{dr}$$   $$+$$   $$0$$           $$-$$

  ---------------------------------------------------

Maximum turning point at $r\  = \ \sqrt{10}$.

Maximum volume: $V\left( \sqrt{10} \right) = 20\sqrt{10}\pi$ cm³

11. A piece of wire 10 m long is broken into 2 parts, which are bent
    into the shape of a rectangle and a square as shown. Find the
    dimensions $x$ and $y$ that make the total area a maximum.

![A rectangular rectangles with a black x AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image46.png){width="3.173912948381452in"
height="1.2062751531058618in"}

$$P\  = \ 2x\  + \ 2y\  + \ 4x$$

$$P\  = \ 6x\  + \ 2y$$

$$10\  = \ 6x\  + \ 2y$$

$$y\  = \ 5\  - \ 3x$$

$$A\  = \ xy\  + \ x²$$

$$A\  = \ x(5\  - \ 3x)\  + \ x²$$

$$A\  = \ 5x\  - \ 3x²\  + \ x²$$

$$A\  = \ 5x\  - \ 2x²$$

$$A'\  = \ 5\  - \ 4x$$

$$0\  = \ 5\  - \ 4x$$

$$x\  = \ 1.25\ m$$

$$A''\  = \  - 4\  < \ 0,\ maximum.$$

$$y\  = \ 1.25\ m$$

12. A poster consists of a photograph bordered by a 5 cm margin.\
    The area of the poster is to be 400 cm².

    a.  Show that the area of the photograph is given by the equation
        $A\  = \ 500\  - \ 10x\  - \frac{4000}{x}$.

    b.  ![A rectangular object with a rectangular object in the middle
        AI-generated content may be
        incorrect.](media/Applications of Calculus 2_Optimisation/media/image47.png){width="2.817390638670166in"
        height="1.6628969816272965in"}Find the maximum area possible for
        the photograph.

$$400\  = \ xy$$

$$\left( \frac{400}{x} \right) = \ y$$

$$A_{photo}\  = \ (x\  - \ 10)(y\  - \ 10)$$

$$= (x\  - \ 10)\left( \frac{400}{x}\  - \ 10 \right)$$

$$= \ 500\  - \ 10x\  - \ \left( \frac{4000}{x} \right)$$

$$A'\  = \  - 10\  + \ \left( \frac{4000}{x^{2}} \right)$$

$$0\  = \  - 10\  + \ \left( \frac{4000}{x^{2}} \right)$$

$$0\  = \  - 10x²\  + \ 4000$$

$$x\  = \ 20$$

$$A(20) = \ 100\ {cm}^{2}$$

$$A''\  = \  - \left( \frac{8000}{x^{3}} \right)$$

$$A^{''}(20) = - 1\  < \ 0,\ maximum.$$

13. $X$ is a point on the curve $y\  = \ x²\  - \ 2x\  + \ 5$.\
    Point $Y$ lies directly below $X$ and is on the curve
    $y\  = \ 4x\  - \ x²$.

    a.  Show that the distance, $d$, between $X$ and $Y$ is
        $d\  = \ 2x²\  - \ 6x\  + \ 5$.

    b.  Find the minimum distance between $X$ and $Y$.

![A graph of x and y AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image48.png){width="2.0089457567804025in"
height="2.0522648731408575in"}

$$d\  = \ (x²\  - \ 2x\  + \ 5)\  - \ \left( 4x\  - \ x^{2} \right)$$

$$= \ 2x²\  - \ 6x\  + \ 5$$

$$d\  = \ 2x²\  - \ 6x\  + \ 5$$

$$d'\  = \ 4x\  - \ 6$$

$$0\  = \ 4x\  - \ 6$$

$$x\  = \ 1.5$$

$$d(1.5) = \ 2(1.5)^{2} - \ 6(1.5) + \ 5\  = \ 0.5\ units$$

$d''\  = \ 4\  > \ 0$, so a minimum.

14. A farmer has a field of total area 1200 m².\
    He sets up his field with fences at AC, CD and BE, as shown in the
    diagram.\
    The side AD is beside a river, so no fence is needed there.\
    The point B is the midpoint of AC, and CD is twice the length of BE.
    Let AB = $x$ and BE = $y$.

    a.  Show that the total length of fencing is $L\  = \ 2x\  +$
        $\frac{1800}{x}$.

    b.  Hence find the values of $x$ and $y$ that allow the farmer to
        use the least possible fencing.

![A yellow rectangular object with black text AI-generated content may
be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image49.png){width="2.0071970691163603in"
height="1.6103904199475065in"}Area ΔACD = $\left( \frac{1}{2} \right)$ ×
base × height

$$\left( \frac{1}{2} \right)(2y)(2x) = \ 1200$$

$$2xy\  = \ 1200\ $$

$$y\  = \frac{600}{x}$$

Total length of fencing: $L\  = \ 2x\  + \ 3y\$

$$L\  = \ 2x\  + \ 3\left( \frac{600}{x} \right)$$

$$L\  = \ 2x\  + \frac{1800}{x}$$

$$L'\  = \ 2\  - \ 1800x^{- 2}$$

$$L' = \frac{2x^{2} - \ 1800}{x^{2}}$$

Let $2x^{2} - \ 1800\  = \ 0$

$$x = \ 30\ (as\ x\  > \ 0)$$

  --------------------------------------------------------------------
  $$x$$       $$- 40$$   $$- 30$$   $$10$$           $$30$$   $$40$$
  ----------- ---------- ---------- ---------------- -------- --------
  $$L'$$      $$+$$      $$0$$      $$-$$            $$0$$    $$+$$

  $$slope$$   $$/$$      $$-$$      $$\backslash$$   $$-$$    $$/$$
  --------------------------------------------------------------------

Minimum turning point at $x\  = \ 30.$

Least possible length: $L(30)\  = \ 120\ m$

15. A transport company runs a truck from Hobart to Launceston, a
    distance of 250 km, at a constant speed of $v$ km/h. For a given
    speed $v$, the cost per hour is $6400\  + \ v²$ cents.

    a.  Show that the cost of the trip, in cents, is
        $C\  = \ 250\left( \frac{6400}{v} + \ v \right).$

    b.  Find the speed at which the cost of the journey is minimised.

    c.  Find the minimum cost of the journey.

$$time\  = \frac{distance}{speed} = \frac{250}{v}hours$$

Total cost: $C\  = \ (cost\ per\ hour) \times \ (time\ for\ trip)$

$$= \ \left( 6400\  + \ v^{2} \right) \times \frac{250}{v}\ $$

$$= \ 250\left( \frac{6400}{v} + \ v \right)$$

C = 250(6400/v + v) where v \> 0

$$\frac{dC}{dv} = \ 250\left( - \frac{6400}{v^{2}} + \ 1 \right)\ $$

$$= \frac{250\left( v^{2} - \ 6400 \right)}{v^{2}}\ $$

$$= \frac{250(v\  - \ 80)(v\  + \ 80)}{v^{2}}$$

$\frac{dC}{dv}$ has single zero at $v\  = \ 80$ in domain $v\  > \ 0$.

$$\frac{d^{2}C}{dv^{2}} = \frac{250\  \times \ 12800}{v^{3}} > 0\ $$

$v\  = \ 80$ gives global minimum in domain $v\  > \ 0$. Speed is 80
km/h.

When $v\  = \ 80$, $C\  = \ 40000$ cents. Minimum cost is \$400.

16. A man in a rowing boat is presently 6 km from the nearest point A on
    the shore.\
    He wants to reach, as soon as possible, a point B that is a further
    20 km along the shore from A.

    a.  He can row at 8 km/h and he can run at 10 km/h. He rows to a
        point on the shore $x$ km from A, and then he runs to B.\
        Show that the time taken for the journey is
        $T\  = \frac{\sqrt{36\  + \ x^{2}}}{8} + \frac{(20\  - \ x)}{10}.$

    b.  Show that the time for the journey is minimised if he lands 8 km
        from A.

![A diagram of a rectangle with a point and a line AI-generated content
may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image50.png){width="1.7811417322834646in"
height="1.4477909011373578in"}

Distance rowed: $\sqrt{36\  + \ x^{2}}$ km at 8 km/h

Distance run: $20\  - \ x$ km at 10 km/h

$$time\  = \frac{distance}{speed}$$

$$T = T_{row} + T_{run}\  = \frac{\sqrt{36\  + \ x^{2}}}{8} + \frac{20\  - \ x}{10}$$

$$\frac{dT}{dx} = \frac{x}{8\sqrt{36\  + \ x^{2}}} - \frac{1}{10}$$

$\frac{dT}{dx}\  = \ 0$ when:

$$\frac{x}{8\sqrt{36\  + \ x^{2}}} - \frac{1}{10} = \ 0$$

$$10x\  = \ 8\sqrt{36\  + \ x^{2}}\ $$

$$100x²\  = \ 64(36\  + \ x²)\ $$

$$100x²\  - \ 64x²\  = \ 64\  \times \ 36\ $$

$$36x²\  - \ 64\  \times \ 36\  = \ 0\ $$

$$36(x²\  - \ 64)\  = \ 0\ $$

$$x\  = \ 8\ (0\  \leq \ x\  \leq \ 20)$$

  -----------------------------------------------------------
  $$x$$               $$7$$            $$8$$   $$9$$
  ------------------- ---------------- ------- --------------
  $$\frac{dT}{dx}$$   $$- 0.005...$$   $$0$$   $$0.004...$$

  $$slope$$           $$\backslash$$   $$-$$   $$/$$
  -----------------------------------------------------------

$T$ has local minimum at $x\  = \ 8$.

17. The sum of the radii $r₁$ and $r₂$ of two circles is such that
    $r₁\  + \ r₂\  = \ k$, where $k$ is a constant.

    a.  Find an expression for the sum $S$ of the areas of the circles
        in terms of $r₁$.

    b.  Hence show that the sum of the areas is least when
        $r₁\  = \ r₂$.

$S\  = \ \pi r₁²\  + \ \pi r₂²\$and $r₁\  + \ r₂\  = \ k$

$$S\  = \ \pi r₁²\  + \ \pi\left( k\  - \ r_{1} \right)^{2}$$

$$\frac{dS}{dr_{1}} = \ 2\pi r₁\  - \ 2\pi(k\  - \ r₁)\ $$

$\frac{dS}{dr_{1}}$ $=$ 2π(r₁ - r₂) = 0, so stationary point at
$r₁\  = \ r₂$

Since $\frac{dS^{2}}{d^{2}r_{1}} = 4\pi > 0$, stationary point is
maximum.

18. A piece of wire of length $L$ is bent to form a sector of a circle
    of radius $r$.

    a.  If the sector subtends an angle of $\theta$ radians at the
        centre, show that $\theta\  = \frac{L}{r}\  - \ 2$.

    b.  Show that the area of the sector is maximised when $r\  =$
        $\frac{L}{4}$.

$\theta$ is the ratio of the circumference to the radius (definition of
radians)

$$\theta\  = \frac{L\  - \ 2r}{r} = \frac{L}{r} - \ 2$$

$$A\  = \ \pi r^{2} \times \frac{L - 2}{2\pi}$$

$$= \frac{r(L\  - \ 2r)}{2}$$

maximum when $\frac{dA}{dr} = \ 0$

$$\frac{d\left( Lr\  - \ 2r^{2} \right)}{dr} = \frac{L}{2} - \ 2r\  = \ 0$$

$$L\  = \ 4r\ or\ r\  = \frac{L}{4}$$

19. A half-pipe is to be made from a rectangular piece of metal of
    length $x$ m.\
    The perimeter of the rectangle is 30 m.

    a.  Find the dimensions of the rectangle that will give the maximum
        surface area.

    b.  Find the height from the ground up to the top of the half-pipe
        with this maximum area, correct to 1 decimal place.

![A blue line drawing of a paper scroll AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image51.png){width="2.243477690288714in"
height="1.3277734033245845in"}

$$30\  = \ 2x\  + \ 2\pi r$$

$$15\  = \ x\  + \ \pi r$$

$$x\  = \ 15\  - \ \pi r$$

$$Surface\ area:\ S\  = \ \pi rx$$

$$S\  = \ \pi r(15\  - \ \pi r)$$

$$= \ 15\pi r\  - \ \pi ²r²$$

$$S'\  = \ 15\pi\  - \ 2\pi ²r$$

$$0\  = \ 15\pi\  - \ 2\pi ²r$$

$$r\  = \ \left( \frac{15}{2\pi} \right)m$$

$$S''\  = \  - 2\pi ²\  < \ 0,\ maximum.$$

$$x\  = \ 15\  - \ \pi\left( \frac{15}{2\pi} \right) = \ 7.5\ m$$

$$7.5\ m\ by\ 7.5\ m$$

$$h\  = \ r\  = \ \left( \frac{15}{2\pi} \right) \approx \ 2.4\ m$$

20. A certain cylindrical soft drink can is required to have a volume of
    250 cm³.

    a.  Show that the height of the can is $\frac{250}{\pi r^{2}}\$,
        where r is the base radius.

    b.  Show that the total surface area is $S\  = \ 2\pi r^{2} +$
        $\frac{500}{r}$.

    c.  Show that $r\  = \frac{5}{\sqrt[3]{\pi}}$ gives a global minimum
        of $S$ in the domain $r\  > \ 0$.

    d.  Show that to minimise the can's surface area, the base diameter
        should equal its height.

![A cylinder with arrows and a straight line AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image52.png){width="1.3826082677165354in"
height="1.7102143482064742in"}

Let the height of the can be $h$ cm. Then volume $= \ \pi r²h$

$250\  = \ \pi r²h$

$$h\  = \frac{250}{\pi r^{2}}$$

Each end has area $\pi r²$ and the curved side has area $2\pi rh,$

$$S\  = \ 2\pi r^{2} + \ 2\pi rh\ $$

$$= \ 2\pi r^{2} + \ 2\pi r\  \times \frac{250}{\pi r^{2}}$$

$$= \ 2\pi r^{2} + \frac{500}{r},\ where\ r\  > \ 0.$$

$$\frac{dS}{dr} = \ 4\pi r\  - \frac{500}{r^{2}} = \frac{4\pi r^{3} - \ 500}{r^{2}}$$

$$\frac{dS}{dr} = \ 0$$

$$4\pi r^{3} = \ 500\ $$

$$r^{3} = \frac{125}{\pi}$$

$$r\  = \frac{5}{\sqrt[3]{\pi}}$$

$$\frac{d^{2}S}{dr^{2}} = \ 4\pi\  + \frac{1000}{r^{3}}$$

which is positive for all $r\  > \ 0$. Hence the stationary point is a
global minimum in the domain $r\  > \ 0$.

$$When\ r\  = \frac{5}{\sqrt[3]{\pi}},\ h\  = \frac{250}{\pi r^{2}}$$

$$= \ \frac{250}{\pi\left( \frac{5}{\sqrt[3]{\pi}} \right)^{2}}$$

$$= \frac{250}{\pi\left( \frac{25}{\pi^{\frac{2}{3}}} \right)}$$

$$= \frac{10}{\pi^{\frac{1}{3}}}$$

$$= \ 2r.$$

Hence the minimum surface area occurs when the diameter equals the
height.

21. A 3 m piece of wire is cut into 2 pieces and bent around to form a
    square and a circle.

Find the size of the 2 lengths, correct to 2 decimal places, that will
make the total area of the square and circle a minimum.

$$Perimeter:\ P\  = \ 4x\  + \ 2\pi r$$

$$3\  = \ 4x\  + \ 2\pi r$$

$$r\  = \frac{3\  - \ 4x}{2\pi}$$

$$A\  = \ x²\  + \ \pi r²$$

$$A\  = \ x²\  + \ \pi\left( \frac{3\  - \ 4x}{2\pi} \right)^{2}$$

$$A\  = \ x²\  + \ \frac{(3\  - \ 4x)^{2}}{4\pi}$$

$$A' = \ 2x\  + \frac{8x\  - \ 6}{\pi}$$

$$0\  = \ 2x\  + \frac{8x\  - \ 6}{\pi}$$

$$0\  = \ 2\pi x\  + \ 8x\  - \ 6$$

$$0\  = \ \pi x\  + \ 4x\  - \ 3$$

$$3\  = \ \pi x\  + \ 4x$$

$$x(\pi\  + \ 4)\  = \ 3$$

$$x\  = \frac{3}{\pi\  + \ 4}$$

$$A^{''} = \ 2\  + \frac{8}{\pi} > \ 0,\ \ \ minimum.$$

$$Square\ perimeter\  = \ 4\left( \frac{3}{\pi\  + \ 4} \right) \approx \ 1.68\ m$$

$$Circle\ perimeter\  = \ 3\  - \ 1.68\  = \ 1.32\ m.$$

22. Two cars are travelling along roads that intersect at right angles
    to one another.\
    One starts 200 km away and travels towards the intersection at 80 km
    h⁻¹,\
    while the other starts at 120 km away and travels towards the
    intersection at 60 km h⁻¹.

    a.  Show that their distance apart after t hours is given by
        $d^{2} = 10000t^{2} - 46400t + 54400$.

    b.  Hence find their minimum distance apart.

$$d²\  = \ (200\  - \ 80t)²\  + \ (120\  - \ 60t)^{2}$$

$$= \ 10\ 000t^{2} - \ 46\ 400t\  + \ 54\ 400$$

$$d\  = \ \sqrt{10\ 000t^{2} - \ 46\ 400t\  + \ 54\ 400}$$

$$d' = \frac{20\ 000t\  - \ 46\ 400}{2\sqrt{10\ 000t^{2} - \ 46\ 400t\  + \ 54\ 400}}$$

$$0\  = \frac{20\ 000t\  - \ 46\ 400}{2\sqrt{10\ 000t^{2} - \ 46\ 400t\  + \ 54\ 400}}$$

$$0\  = \ 20\ 000t\  - \ 46\ 400$$

$$t\  = \ 2.32\ h$$

$$d(2.32) = \ \sqrt{10\ 000(2.32)^{2} - \ 46\ 400(2.32) + \ 54400} = \ 24\ km$$

  -------------------------------------
  $$t$$       $$2$$   $$2.32$$   3
  ----------- ------- ---------- ------
  $$d'(t)$$   --80    $$0$$      94.3

  -------------------------------------

Gradient changes from decreasing to increasing, so minimum distance of
24 km

23. A truck travels 1500 km at an hourly cost given by $s²\  + \ 9000$
    cents where $s$ is the average speed of the truck.

    a.  Show that the cost for the trip is given by
        $C\  = \ 1500\left( s\  + \frac{9000}{s} \right)$.

    b.  Find, to the nearest km h⁻¹, the speed that minimises the cost
        of the trip.

    c.  Find the cost of the trip to the nearest dollar.

$$s\  = \frac{d}{t},\ so\ t\  = \frac{d}{s} = \frac{1500}{s}$$

$$Cost\ of\ trip\ taking\ t\ hours:\ C\  = \ \left( s^{2} + \ 9000 \right)t$$

$$= \ \left( s^{2} + \ 9000 \right)\left( \frac{1500}{s} \right)$$

$$= \ \left( \frac{1500}{s} \right)\left( s^{2} + \ 9000 \right)$$

$$C\  = \ 1500s\  + \ \frac{13\ 500\ 000}{s}$$

$$C'\  = \ 1500\  - \ \frac{13\ 500000}{s^{2}}$$

$$0\  = \ 1500\  - \ \frac{13\ 500000}{s^{2}}$$

$$0\  = \ 1500s²\  - \ 13\ 500\ 000$$

$$s²\  = \ 9000$$

$$s\  = \ 94.8683...\  \approx \ 95\ km/h\ $$

$$C''\  = \ \left( \frac{27\ 000\ 000}{s^{3}} \right)$$

$$C^{''}(95) > \ 0,\ so\ a\ minimum.$$

$$C(95)\  = \ \$ 2846.05\  \approx \ \$ 2846$$

24. ABCD is a square of unit length.\
    Points $E$ and $F$ are on the sides $AB$ and $AD$ respectively so
    that $AE\  = \ AF\  = \ x$.

    a.  Express the area of the quadrilateral CDFE as a function of $x$.

    b.  Find the greatest area that the quadrilateral can have.

![A square with a triangle and a triangle with black letters
AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image53.png){width="1.5304341644794401in"
height="1.3560804899387577in"}$A_{ABCD} = 1^{2} - A_{CBE} = A_{FEA}$

$$A = 1^{2} - \frac{(1)(1 - x)}{2} - \frac{x^{2}}{2}$$

$$= \frac{1}{2} + \frac{x}{2} - \frac{x^{2}}{2}$$

$$A' = \frac{1}{2} - x$$

$$A' = 0\ when\ x = \frac{1}{2}$$

$$A^{''} = - 1 < 0\therefore max\ at\ x = \frac{1}{2}$$

$$\therefore max\ area\ of\ A\left( \frac{1}{2} \right) = \frac{5}{8}\ {units}^{2}$$

25. Engineers have determined that the strength $s$ of a rectangular
    beam varies as the product of the width $w$ and the square of the
    depth d of the beam, that is, $s\  = \ kwd²$ for some $k > 0$.

    a.  A particular cylindrical log has a diameter of 48 cm. Use
        Pythagoras\' theorem to show that $s\  = \ kw(2304\  - \ w²)$.

    b.  Hence find the dimensions of the strongest rectangular beam that
        can be cut from the log.

![A circle with a black circle and a black circle with black circles and
black text AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image54.png){width="1.4090912073490813in"
height="1.390926290463692in"}

$$w²\  + \ d²\  = \ 48²\ $$

$$d²\  = \ 2304\  - \ w²$$

Substitute into s = kwd² for k \> 0:
$s\  = \ kw\left( 2304\  - \ w^{2} \right)$

$s\  = \ 2304kw\  - \ kw^{3}$

$$\frac{ds}{dw} = \ 2304k\  - \ 3kw^{2}$$

$2304k\  - \ 3kw²\  = \ 0$

$w²\  = \ 768$

$$w\  = \ 16\sqrt{3}(as\ w\  > \ 0)$$

$$\frac{d^{2}s}{dw^{2}} = \  - 6kw$$

For $k\  > \ 0$, $\frac{d^{2}s}{dw^{2}}$ $< \ 0$ when
$w\  = \ 16\sqrt{3}$ cm,

so maximum width is $16\sqrt{3}$ cm.

Substitute $w\  = \ 16\sqrt{3}$ into $d²\  = \ 2304\  - \ w²$:

$d²\  = \ 2304\  - \ \left( 16\sqrt{3} \right)^{2}$

$d\  = \ 16\sqrt{6}$ cm

Dimensions are width $16\sqrt{3}$ cm and depth $16\sqrt{6}$ cm.

26. A closed rectangular box has length $x$ cm, width $y$ cm and height
    $h$ cm.\
    It is to be made from 300 cm² of thin sheet metal, and the perimeter
    of the base is to be 40 cm.

    a.  Show that the volume of the box is given by
        $V\  = \ 150h\  - \ 20h²$.

    b.  Hence find the dimensions of the box that meets all the
        requirements and has the maximum possible volume.

$V\  = \ xyh$

$$P\  = \ 2x\  + \ 2y\  = \ 40$$

$$x\  + \ y\  = \ 20$$

$$A\  = \ 2xy\  + \ 2xh\  + \ 2yh\ $$

$$300\  = \ 2xy\  + \ 2xh\  + \ 2yh\ $$

$$150\  = \ xy\  + \ xh\  + \ yh\ $$

$$= \ xy\  + \ h(x\  + \ y)\ $$

$$= \ xy\  + \ 20h$$

Sub $xy\  = \ 150\  - \ 20h$ into $V\  = \ xyh$

$$V\  = \ 150h\  - \ 20h^{2}$$

$V\  = \ 150h\  - \ 20h²$ where $0\  < \ h\  < \ 7.5$

$$V' = \ 150\  - \ 40h = 0$$

$$h\  = \ 3.75\ $$

$$V''\  = \  - 40\ ( < \ 0)$$

maximum at $h\  = \ 3.75.$

$150\  = \ xy\  + \ 75$,

$xy\  = \ 75$

$x\  + \ y\  = \ 20$,

$$y\  = \ 20\  - \ x$$

Substitute $y\  = \ 20\  - \ x$ into $xy\  = \ 75$

$$x(20\  - \ x)\  = \ 75\ $$

$$x²\  - \ 20x\  + \ 75\  = \ 0\ $$

$(x\  - \ 5)(x\  - \ 15)\  = \ 0$

$$x\  = \ 5,\ 15$$

So $y\  = \ 15,\ 5.$

Dimensions are 15 cm by 5 cm by 3.75 cm.

27. PQRS is a rectangle with sides PQ = 6 cm and QR = 4 cm. The points
    $T$ and $U$ lie on the lines SP and SR respectively so that T, Q and
    U are collinear. Let $PT\  = \ x$ and $RU\  = \ y$.

    a.  Show that $xy\  = \ 24$.

    b.  Show that the area of $\bigtriangleup TSU$ is given by
        $A\  = \ 24\  + \ 3x\  + \frac{48}{x}$.

    c.  ![A triangle with black text AI-generated content may be
        incorrect.](media/Applications of Calculus 2_Optimisation/media/image55.png){width="1.8159820647419072in"
        height="1.4214370078740157in"}Hence find the minimum possible
        area of $\bigtriangleup TSU$.

$$\frac{x}{x + 4} = \frac{6}{y + 6}$$

$x(y\  + \ 6)\  = \ 6(x\  + \ 4)$

$xy\  + \ 6x\  = \ 6x\  + \ 24\$

$$xy\  = \ 24$$

$$A\  = \frac{bh}{2}\ $$

$$A\  = \frac{(x\  + \ 4)(y\  + \ 6)}{2}$$

$xy\  = \ 24$, so $y\  =$ $\frac{24}{x}$

$$= \frac{(x + 4)\left( \frac{24}{x} + 6\  \right)}{2}$$

$$= \frac{24 + 6x + \frac{96}{x} + 24}{2}$$

$A = \ 24\  + \ 3x\  +$ $\frac{48}{x}$

$$\frac{dA}{dx} = \ 3\  - \frac{48}{x^{2}}$$

$\frac{dA}{dx}$ $= 0$ when $3\  -$ $\frac{48}{x^{2}}$ $= \ 0$

$$3x²\  - \ 48\  = \ 0$$

$$3\left( x^{2} - \ 16 \right) = \ 0$$

$$x\  = \ 4\ (x\  > \ 0)$$

$$\frac{d^{2}A}{dx^{2}} = \frac{96}{x^{3}}$$

When $x\  = \ 4$, $\frac{d^{2}A}{dx^{2}}$ $\  =$ $\frac{96}{64}$ $> 0$

Global minimum in domain $x\  > \ 0$.

$$A(4) = \ 48$$

Minimum possible area is 48 cm².

28. A page of a book is to have 80 cm² of printed material.\
    There is to be a 2 cm margin at the top and bottom and a 1 cm margin
    on each side.\
    Let the page have width $x$ and height $y$.

    a.  Show that $(y\  - \ 4)(x\  - \ 2)\  = \ 80$ and hence that
        $y\  = \ 4\  +$ $\frac{80}{x\  - \ 2}$

    b.  Show that the area of the page is $A\  =$
        $\frac{4x^{2} + \ 72x}{x\  - \ 2}$.

    c.  Use the quotient rule to show that $\frac{dA}{dx}$ $=$
        $\frac{4\left( x^{2} - \ 4x\  - \ 36 \right)}{(x\  - \ 2)^{2}}$

    d.  What should be the dimensions of the page in order to use the
        least amount of paper?

Area of printed material = 80 cm²

$(y\  - \ 2\  - \ 2)(x\  - \ 1\  - \ 1) = \ 80$

$$(y\  - \ 4)(x\  - \ 2) = \ 80$$

$xy\  - \ 2y\  - \ 4x\  + \ 8\  = \ 80$

$y(x\  - \ 2) = \ 4(x\  - \ 2) + \ 80$

$$y\  = \ 4\  + \frac{80}{x\  - \ 2}$$

Substitute $y\  = \ 4\  +$ $\frac{80}{x\  - \ 2}$ into $A\  = \ xy:\$

$$A\  = \ x\left( 4\  + \frac{80}{x\  - \ 2} \right)\ $$

$$= \frac{x(4x\  - \ 8\  + \ 80)}{x\  - \ 2}\ $$

$$= \frac{x(4x\  + \ 72)}{x\  - \ 2}$$

$$= \frac{4x^{2} + \ 72x}{x\  - \ 2}$$

$$\frac{dA}{dx} = \frac{u'v - \ uv'}{v^{2}}\ $$

$$= \frac{(x\  - \ 2)(8x\  + \ 72) - \ \left( 4x^{2} + \ 72x \right)}{(x\  - \ 2)^{2}}$$

$$= \frac{4x^{2} - \ 16x\  - \ 144}{(x\  - \ 2)^{2}}$$

$$\frac{dA}{dx} = \frac{4\left( x^{2} - \ 4x\  - \ 36 \right)}{(x\  - \ 2)^{2}}$$

$\frac{dA}{dx} = \ 0$ when $4\left( x^{2} - \ 4x\  - \ 36 \right) = \ 0$

$$x\  = \frac{4\  \pm \ \sqrt{( - 4)^{2} - \ 4(1)( - 36)}}{2}\ $$

$$= \frac{4\  \pm \ \sqrt{160}}{2}\ $$

$$= \ 2\left( 1\  \pm \ \sqrt{10} \right)$$

$$x\  > \ 0,\ so\ x\  = \ 2(1\  + \ \sqrt{}10)$$

  ------------------------------------------------------------------------------------------
  $$x$$               $$8$$            $$2\left( 1\  + \ \sqrt{10} \right)\ $$   $$9$$
  ------------------- ---------------- ----------------------------------------- -----------
  $$\frac{dA}{dx}$$   $$4/9$$          $$0$$                                     $$36/49$$

  slope               $$\backslash$$   $$-$$                                     $$/$$
  ------------------------------------------------------------------------------------------

Global minimum in domain $x\  > \ 0$.

Substitute $x\  = \ 2\left( 1\  + \ \sqrt{10} \right)$ into
$y\  = \ 4\  + \frac{80}{x\  - \ 2}:$

$$y\  = \ 4\  + \frac{80}{2\  + \ 2\sqrt{10} - \ 2}$$

$$= \ 4\  + \frac{80}{2\sqrt{10}}$$

$$\ 4\left( 1\  + \ \sqrt{10} \right)$$

Dimensions are $2\left( \sqrt{10} + \ 1 \right)$ cm by
$4\left( \sqrt{10} + \ 1 \right)$ cm.

Mastery

29. A cylinder $h$ cm high with radius $r$ cm is enclosed in a cone of
    height 40 cm and radius 12 cm.

    a.  Explain why △ABC \|\|\| △ADE.

    b.  By using ratios of corresponding sides, show that
        $h\  = \ 40\  - \frac{10r}{3}$.

    c.  Show that the volume of the cylinder is given by
        $V\  = \ 40\pi r^{2} - \frac{10\pi r^{3}}{3}$.

    d.  Find $\frac{dV}{dr}$ and hence find the value of r for which the
        volume of the cylinder is maximised.

ΔABC \~ ΔADE because

∠ABC = ∠ADE = 90°

∠ACB = ∠AED (BC ∥ DE and AE is a straight line)

(therefore equiangular, at least two pairs of corresponding angles
equal)

Since ΔABC \~ ΔADE,

$$\frac{BC}{DE} = \frac{AB}{AD}$$

$$\frac{r}{12} = \frac{40\  - \ h}{40}$$

$$\frac{40r}{12} = \ 40\  - \ h$$

$$\therefore h\  = \ 40\  - \frac{10r}{3}$$

$$V\  = \ \pi r^{2} \times \ h\  = \ \pi r^{2}\left( 40\  - \frac{10r}{3} \right)$$

$$= \ 40\pi r^{2} - \frac{10\pi r^{3}}{3}$$

$$\frac{dV}{dr} = \ 80\pi r\  - \ 10\pi r^{2} = \ 10\pi r(8\  - \ r)$$

$$\frac{dv}{dr} = \ 0\ when\ r\  = \ 0\ or\ r\  = \ 8$$

The value of $r$ that maximises $V$ is $r\  = \ 8.$

30. A symmetrical gutter is made from a sheet of metal 30 cm wide by
    bending it twice as shown:

    a.  Show that the cross-sectional area of the gutter is given by
        $A = 100\cos\theta\left( 1 + \sin\theta \right)$ cm².

    b.  For what value of $\theta$ does the gutter have maximum carrying
        capacity?

    c.  Find the cross-sectional area for this value of $\theta$.

![A rectangular object with text below AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image56.png){width="2.365972222222222in"
height="1.4256944444444444in"}

Total width = 30 cm, base = 10 cm

Each slanted side length = 10 cm

Vertical height of slanted sides = 10cosθ

Horizontal projection of each side = 10sinθ

Cross-section is a trapezium:

Lower base = 10 cm

Upper base = 10 + 2(10sinθ) = 10 + 20sinθ

Height = 10cosθ

$$A = \frac{1}{2}(a + b)$$

$$A\  = \ \left( \frac{1}{2} \right)\left( 10\  + \ 10 + 20\sin\theta \right)(10cos\theta)$$

$$A\  = \ \left( \frac{1}{2} \right)\left( 20\  + \ 20\sin\theta \right)(10cos\theta)$$

$$A\  = \ 100cos\theta(1\  + \ \sin\theta)\ cm²$$

$$A\  = \ 100cos\theta\  + \ 100cos\theta sin\theta$$

$$\frac{dA}{d\theta} = \  - 100sin\theta\  + \ 100\left( \cos^{2}\theta\  - \ \sin^{2}\theta \right)$$

Using $\cos^{2}\theta = 1 - \sin^{2}\theta:$

$$\frac{dA}{d\theta} = \ 100\left( - \sin\theta + 1\  - \ 2\sin^{2}\theta \right)$$

$$\frac{dA}{d\theta} = \  - 100\left( 2\sin^{2}\theta\  + \ sin\theta\  - \ 1 \right)$$

$$For\frac{dA}{d\theta} = \ 0:$$

$$2sin²\theta\  + \ sin\theta\  - \ 1\  = \ 0$$

$$(2sin\theta\  - \ 1)(sin\theta\  + \ 1)\  = \ 0$$

$$sin\theta\  = \frac{1}{2}or\ sin\theta\  = \  - 1$$

$sin\ \theta\  = \  - 1;\$no solution as $0 \leq \theta \leq$
$\frac{\pi}{2}$

$$\sin\theta\  = \frac{1}{2};\theta = \frac{\pi}{6}$$

$$\frac{d^{2}A}{d\theta^{2}} = - 100\left( 4\sin\theta\cos\theta + \cos\theta \right)$$

$$at\ x = \frac{\pi}{6},\frac{d^{2}A}{d\theta^{2}} < 0,\ \therefore\max$$

$$A\left( \frac{\pi}{6} \right) = \ 100\left( \frac{\sqrt{3}}{2} \right)\left( 1\  + \frac{1}{2} \right)$$

$$A\  = \ 100\left( \frac{\sqrt{3}}{2} \right)\left( \frac{3}{2} \right)$$

$$A\  = \ 75\sqrt{3}\ cm²\  \approx \ 130\ cm²$$

31. An open cylindrical water tank has base radius $x$ metres and height
    $h$ metres. Each square metre of the base costs $a$ dollars to
    manufacture and each square metre of the curved surface costs $b$
    dollars. The combined cost of the base and curved surface is $c$
    dollars.

    a.  Find $c$ in terms of $a$, $b$, $x$ and $h$.

    b.  Show that the volume of the tank is given by $V\  =$
        $\frac{x}{(2b)\left( c\  - \ \pi ax^{2} \right)}$

    c.  As $x$ varies, prove that $V$ is at its maximum when the cost of
        the base is $\frac{c}{3}$ dollars.

Base area $=$ $\pi x²$ m² with cost $a\pi x²$ dollars

Curved area $= 2\pi xh$ m² with cost $2\pi xhb$ dollars

Total cost: $c\  = \ \pi x²a\  + \ 2\pi xhb$

$$V = \pi x^{2} \times \ h\ $$

$$h\  = \frac{c\  - \ \pi x^{2}a}{2\pi xb}$$

$$V\  = \pi x^{2}\  \times \frac{c\  - \ \pi x^{2}a}{2\pi xb}$$

$$= \ \left( \frac{x}{2b} \right)\left( c\  - \ \pi x^{2}a \right)$$

$$\frac{dV}{dx} = \frac{c\  - \ 3\pi x^{2}a}{2b}\ $$

$$\frac{dV}{dx} = \ 0\ when\ c\  - \ 3\pi x²a\  = \ 0,\ so\ x\  = \ \sqrt{\frac{c}{3\pi a}}$$

$$\frac{d^{2}V}{dx^{2}} = - \frac{3\pi ax}{b},\ which\ is\ always\ negative,\ since\ a,x,b > 0$$

∴ maximum at $x\  =$ $\sqrt{\frac{c}{3\pi a}}$

Cost of base when $x\  = \$ $\sqrt{\frac{c}{3\pi a}}$ is

$$c = a\  \times \ \pi x^{2}$$

$$= \ a\  \times \ \pi\  \times \frac{c}{3\pi a}$$

$$= \frac{c}{3}$$

32. Prove that for all rectangles with a fixed perimeter, the one with
    the greatest area is a square.

Perimeter: $k\  = \ 2x\  + \ 2y,\ so\ y\  = \frac{k\  - \ 2x}{2}$

Area: A(x) = x × (k - 2x)/2

$$A'(x) = \ x\  \times \frac{k\  - \ 2x}{2} = \frac{k}{2} - \ 2x\ $$

$$A'(x) = \ 0\ when\ x = \frac{k}{4}$$

$$A^{''}(x) = - 2 < 0\therefore\max$$

Area is maximum when $x\  =$ $\frac{k}{4}$.

$$When\ y\  = \frac{k\  - \ 2\left( \frac{k}{4} \right)}{2} = \frac{k}{4}$$

This means the length and width are equal and each a quarter of the
perimeter, therefore the shape is a square.

33. A cylinder of height $h$ metres is inscribed in a sphere of constant
    radius $R$ metres.

    a.  If the cylinder has radius $r$ metres, show that
        $r^{2} = \ R^{2} - \frac{1}{4}h^{2}$.

    b.  Show that the volume of the cylinder is given by
        $V\  = \frac{\pi}{4}h\left( 4R^{2} - \ h^{2} \right)$.

    c.  Show that the volume of the cylinder is maximised when
        $h\  = \frac{2\sqrt{3}}{3}R.$

    d.  Hence show that the ratio of the volume of the sphere to the
        maximum volume of the cylinder is $\sqrt{3}:\ 1$.

![A diagram of a cylinder AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image57.png){width="1.3472222222222223in"
height="1.4006944444444445in"}

$$R^{2} = \ \left( \frac{h}{2} \right)^{2} + \ r^{2}$$

$$r^{2} = \ R^{2} - \frac{1}{4}h^{2}$$

$$V\  = \ \pi r²h$$

$$= \ \pi\left( R^{2} - \frac{1}{4}h^{2} \right)h\ $$

$$= \frac{\pi}{4}h\left( 4R^{2} - \ h^{2} \right)$$

$$\frac{dV}{dh} = \frac{\pi}{4}\left( 4R^{2} - \ 3h^{2} \right)$$

$$\frac{dV}{dh} = \ 0\ when\ 4R^{2} - \ 3h^{2} = \ 0$$

$$h\  = \ \sqrt{\frac{4R^{2}}{3}} = \frac{2\sqrt{3}}{3}R$$

$$\frac{d^{2}h}{dh^{2}} = - \frac{6\pi h}{4} < 0\ as\ h > 0,\ \therefore max\ at\ h\  = \ \frac{2\sqrt{3}}{3}R\ $$

$$\frac{V_{sphere}}{V_{cylinder}} = \frac{\frac{4}{3}\pi R^{3}}{\pi\ r^{2}h}$$

$$= \frac{\left( \frac{4}{3} \right)\pi R^{3}}{\pi\left( R^{2} - \frac{1}{4}h^{2} \right) \times \frac{2\sqrt{3}}{3}R}\ \ $$

$$= \frac{\left( \frac{4}{3} \right)\pi R^{3}}{\pi\left( R^{2} - \frac{1}{4}\left( \frac{4R^{2}}{3} \right)^{2} \right) \times \frac{2\sqrt{3}}{3}R}\ \ $$

This simplifies to $\sqrt{3}$, so $\sqrt{3}:1$

34. ![A diagram of a cone with a circle and a circle with arrows
    AI-generated content may be
    incorrect.](media/Applications of Calculus 2_Optimisation/media/image58.png){width="1.9217388451443569in"
    height="2.253074146981627in"}A cone of height $h$ is inscribed in a
    sphere of constant radius $R$.\
    Find the ratio $h\ :\ R$ when the volume of the cone is maximised.

$$V_{cone} = \frac{\pi r^{2}h}{3}$$

where $r$ and $h$ are the radius and height of the cone.

$$\left( \frac{h}{2} \right)^{2} + \ r^{2} = \ R^{2},\ so\ h^{2} = \ 4\left( R^{2} - \ r^{2} \right)\ and\ h\  = \ 2\sqrt{R^{2} - \ r^{2}}$$

$$V_{cone} = \frac{\pi r^{2} \times \ 2\sqrt{R^{2} - \ r^{2}}}{3} = \ \left( \frac{2\pi}{3} \right)\sqrt{R^{2}r^{4} - \ r^{6}}$$

$$\frac{d\left( V_{cone} \right)}{dr} = \ \frac{2\pi}{3} \times \frac{4R^{2}r^{3} - \ 6r^{5}}{2\sqrt{R^{2}r^{4} - \ r^{6}}}$$

$$= \ \left( \frac{\pi}{3} \right) \times \frac{2r^{3}\left( 2R^{2} - \ 3r^{2} \right)}{\sqrt{R^{2}r^{4} - \ r^{6}}} = \ 0\ when\ r\  = \ 0\ or\ 2R^{2} - \ 3r^{2} = \ 0,\ so\ r^{2} = \frac{2R^{2}}{3}$$

When volume is maximised,

$$r^{2} = \frac{2R^{2}}{3}$$

$$\frac{h^{2}}{R^{2}} = \frac{4\left( R^{2} - \ r^{2} \right)}{R^{2}} = \frac{4\left( R^{2} - \frac{2R^{2}}{3} \right)}{R^{2}}$$

$$\frac{h^{2}}{R^{2}} = \frac{4}{3}\ $$

$$\frac{h}{R} = \frac{2}{\sqrt{3}}$$

Ratio of $h$ to $R$ is $2\ :\ \sqrt{3}.$

35. The rectangle PQRS has two vertices on the $x$-axis and two on the
    curve $y\  = \ e^{- x^{2}},$ as shown in the diagram. Find:

    a.  the value of $x$ for which the rectangle has a maximum area

    b.  ![A diagram of a function AI-generated content may be
        incorrect.](media/Applications of Calculus 2_Optimisation/media/image59.png){width="2.6007086614173227in"
        height="1.5391305774278214in"}the maximum area of the rectangle.

the curve has even symmetry, P is at $\left( x,\ e^{- x^{2}} \right)$
and Q is at $\left( - x,\ e^{- x^{2}} \right)$

Width = $2x$

Height = $e^{- x^{2}}$

Area $A(x)\  = \ 2xe^{- x^{2}}$

$$\frac{dA}{dx} = \ 2e^{- x^{2}}\left\lbrack 1\  - \ 2x^{2} \right\rbrack$$

For stationary points: $1\  - \ 2x²\  = \ 0$

$$x^{2} = \frac{1}{2}$$

$$x\  = \  \pm \frac{1}{\sqrt{2}}$$

$$When\ x\  = \frac{\sqrt{2}}{2}$$

$$A\  = \ 2\left( \frac{\sqrt{2}}{2} \right)e^{- \left( \frac{1}{2} \right)}$$

$$A\  = \ \sqrt{2} \cdot e^{- \frac{1}{2}}$$

$$A\  = \ \sqrt{\frac{2}{e}}$$

36. An isosceles triangle PQR is inscribed in a circle with centre O of
    radius 1 unit, as shown in the diagram to the right. Let
    $\angle QOR\  = \ 2\theta$, where $\theta$ is acute.

    a.  Join PO and extend it to meet QR at M. Then prove that
        $QM\  = \ \sin\ \theta$ and $OM\  = \ \cos\ \theta$.

    b.  Show that the area $A$ of $\bigtriangleup PQR$ is
        $A\  = \ \sin\ \theta(\cos\ \theta\  + \ 1).$

    c.  Hence show that, as $\theta$ varies, $\bigtriangleup PQR$ has
        its maximum possible area when it is equilateral.

![A triangle with a triangle in the center AI-generated content may be
incorrect.](media/Applications of Calculus 2_Optimisation/media/image60.png){width="1.5034722222222223in"
height="1.5805555555555555in"}

$$\sin\ \theta\  = \frac{QM}{OQ} = \frac{QM}{1} = \ QM$$

$$\cos\ \theta\  = \frac{OM}{OR} = \frac{OM}{1} = \ OM$$

$$A\  = \ \left( \frac{1}{2} \right)bh$$

$$= \ \left( \frac{1}{2} \right)QR\  \times \ PM$$

$$= \ \left( \frac{1}{2} \right)(2QM)(PO\  + \ OM)$$

$$= \ \left( \frac{1}{2} \right) \cdot 2\ sin\ \theta(1\  + \ cos\ \theta)$$

$$= \ sin\ \theta(1\  + \ cos\ \theta)$$

$$A\  = \ sin\ \theta(1\  + \ cos\ \theta)$$

$$= \ sin\ \theta\  + \ sin\ \theta\ cos\ \theta$$

$$= \ sin\ \theta\  + \ \left( \frac{1}{2} \right)sin\ 2\theta$$

$$\frac{dA}{d\theta} = \ cos\ \theta\  + \ cos\ 2\theta$$

$$= \ cos\ \theta\  + \ 2\ cos²\ \theta\  - \ 1$$

$$= \ (2\ cos\ \theta\  - \ 1)(cos\ \theta\  + \ 1)$$

$$For\ maxima/minima,\ \frac{dA}{d\theta} = \ 0.$$

$$(2\ cos\ \theta\  - \ 1)(cos\ \theta\  + \ 1)\  = \ 0$$

$$2\ cos\ \theta\  - \ 1\  = \ 0\ or\ cos\ \theta\  + \ 1\  = \ 0$$

For our angles to be acute, $cos\ \theta\  > \ 0.$

So $cos\ \theta\  = \  - 1$ or $\theta\  = \ \pi$ is not a solution.
Hence:

$$2\ cos\ \theta\  - \ 1\  = \ 0$$

$$2\ cos\ \theta\  = \ 1$$

$$cos\ \theta\  = \frac{1}{2}$$

$$\theta\  = \frac{\pi}{3}$$

$$\frac{d^{2}A}{d\theta^{2}} = \  - sin\ \theta\  - \ 2\ sin\ 2\theta$$

When $\theta\  = \frac{\pi}{3},\frac{d^{2}A}{d\theta^{2}} < \ 0,$ hence
the curve is concave down and this is a maximum.

Hence the maximum area occurs when $\theta\  = \frac{\pi}{3}.$

The triangle is equilateral as:

$\Delta POQ$ and $\Delta POR\$are congruent (SSS)

$$\angle QOR\  = \ 2\theta\  = \frac{2\pi}{3}and\ \angle POQ\  = \ \angle POR\  = \ \left( \frac{1}{2} \right)(2\pi\  - \ \angle QOR) = \ \left( \frac{1}{2} \right)\left( 2\pi\  - \frac{2\pi}{3} \right) = \frac{2\pi}{3}.$$

Hence all vertices of the triangle are evenly spaced from one another
around the unit circle\
hence they must be the vertices of an equilateral triangle.

37. A straight line passes through the point (2, 1) and has positive
    $x$- and $y$-intercepts at $P$ and $Q$ respectively. Suppose
    $\angle OPQ\  = \ \alpha$, where $O$ is the origin.

    a.  Explain why the line has gradient $- \tan\alpha$.

    b.  Find the $x$- and $y$-intercepts in terms of $\alpha$.

    c.  Show that the area of $\bigtriangleup OPQ$ is given by
        $A\  = \frac{\left( 2\tan\ \alpha\  + \ 1 \right)^{2}}{2\tan\ \alpha}$.

    d.  By letting $u = \tan\alpha$, find $\frac{dA}{du}$ and hence show
        that this area is maximised when tan $\alpha =$ $\frac{1}{2}$.

The angle of inclination is $\pi\  - \ \alpha$ and so
$m\  = \ \tan(\pi\  - \ \alpha)\  = \  - \tan\ \alpha$

The line is of form $y\  = \ mx\  + \ b$, since
$m\  = \  - tan\ \alpha,$ $y\  = \  - x\ tan\ \alpha\  + \ b$.
Substituting in (2, 1),

$$1\  = \  - 2\ \tan\ \alpha\  + \ b$$

$$b\  = \ 1\  + \ 2\ \tan\ \alpha$$

$$\therefore\ y\  = \  - x\ \tan\ \alpha\  + \ 1\  + \ 2\ \tan\ \alpha$$

$x$-intercept when $y\  = \ 0$

$$0\  = \  - x\ tan\ \alpha\  + \ 1\  + \ 2\ tan\ \alpha$$

$$x\ tan\ \alpha\  = \ 1\  + \ 2\ tan\ \alpha$$

$$x\  = \frac{1}{tan\ \alpha} + \ 2$$

$$x\ int\ is\ P\  = \ \left( \frac{1}{\tan\ \alpha} + \ 2,\ 0 \right)$$

$y$-intercept when $x\  = \ 0$

$$y\  = \ 0\  + \ 1\  + \ 2\ tan\ \alpha\  = \ 1\  + \ 2\ tan\ \alpha$$

Thus the $y$-intercept is

$$Q\  = \ (0,\ 2\ tan\ \alpha\  + \ 1)$$

$$A\  = \frac{1}{2}bh$$

$$= \frac{1}{2}(2\ tan\ \alpha\  + \ 1)\left( \frac{1}{tan\ \alpha} + \ 2 \right)$$

$$= \frac{1}{2}(2\ tan\ \alpha\  + \ 1)\left( \frac{1\  + \ 2\ tan\ \alpha}{tan\ \alpha} \right)$$

$$= \frac{(2\ tan\ \alpha\  + \ 1)^{2}}{2\ tan\ \alpha}$$

Let $tan\ \alpha\  = \ u$

$$A = \frac{(2u + 1)^{2}}{2u}$$

$$\frac{dA}{du} = \frac{2(2u + 1)(2)(2u) - (2u + 1)^{2}(2)}{4u^{2}}$$

$$\frac{dA}{du} = \frac{(2u\  - \ 1)(2u\  + \ 1)}{2u^{2}}$$

For maximum area, $\frac{dA}{du} = \ 0$

$$u = \frac{1}{2}or\ u = \  - \frac{1}{2}.$$

$$\therefore\tan\alpha = \frac{1}{2}\ or - \frac{1}{2}$$

Since $\alpha$ is acute, tan $\alpha\  =$ $\frac{1}{2}$.

Check using table of slopes

  --------------------------------------------------
  $$u$$               0.1     $$\frac{1}{2}$$   1
  ------------------- ------- ----------------- ----
  $$\frac{dA}{du}$$   $$-$$   $$0$$             \+

  --------------------------------------------------

Therefore, maximum at $\tan\alpha = \frac{1}{2}$

# Exam Questions

1.  **2022 HSC Advanced Band 4**

> ![A math problem with numbers and equations AI-generated content may
> be
> incorrect.](media/Applications of Calculus 2_Optimisation/media/image61.png){width="3.6743055555555557in"
> height="3.2916666666666665in"}Find the global maximum and minimum
> values of $y = x^{3} - 6x^{2} + 8$ where $- 1 \leq x \leq 7$.
>
> ![A math problem with numbers and equations AI-generated content may
> be
> incorrect.](media/Applications of Calculus 2_Optimisation/media/image61.png){width="3.6743055555555557in"
> height="2.8125in"}

2.  ![](media/Applications of Calculus 2_Optimisation/media/image62.png){width="2.3175142169728784in"
    height="1.851469816272966in"}**2024 VCE Methods Band 4**

> A trapezium has the following dimensions.

a.  Show that the total area of the trapezium is given by

$$A\  = \ 2x\sqrt{100\  - \ x^{2}}$$

b.  Find the value of $x$ which maximises the area\
    of the trapezium.

![](media/Applications of Calculus 2_Optimisation/media/image63.png){width="3.484027777777778in"
height="3.5972222222222223in"}![](media/Applications of Calculus 2_Optimisation/media/image63.png){width="3.484722222222222in"
height="2.798611111111111in"}

3.  **2016 HSC Advanced Band 4**

> ![](media/Applications of Calculus 2_Optimisation/media/image64.png){width="3.1103904199475068in"
> height="1.2115758967629047in"}A farmer wishes to make a rectangular
> enclosure of area 720 m².\
> She uses an existing straight boundary as one side of the enclosure.\
> She uses wire fencing for the remaining three sides and also to divide
> the enclosure into four equal rectangular areas of width $x$ m as
> shown.

a.  Show that the total length, $l$ m, of the wire fencing is given by

$$l\  = \ 5x\  + \frac{720}{x}$$

b.  Find the minimum length of wire fencing required, showing why this
    is the minimum length.

![](media/Applications of Calculus 2_Optimisation/media/image65.png){width="2.392735126859143in"
height="3.577450787401575in"}![](media/Applications of Calculus 2_Optimisation/media/image65.png){width="2.815987532808399in"
height="3.935812554680665in"}

4.  **2016 HSC Advanced Band 4**

> A rainwater tank is designed in the shape of a cylinder with radius
> $r$ metres and height $h$ metres.
>
> ![](media/Applications of Calculus 2_Optimisation/media/image66.png){width="1.4870133420822398in"
> height="1.0679461942257218in"}
>
> The volume of the tank is to be 10 cubic metres.\
> Let $A$ be the surface area of the tank, including its top and base,
> in square metres.

a.  Given that $A\  = \ 2\pi r²\  + \ 2\pi rh$, show that
    $A\  = \ 2\pi r^{2} +$ $\frac{20}{r}$

b.  Show that $A$ has a minimum value and find the value of $r$ for
    which the minimum occurs.

![](media/Applications of Calculus 2_Optimisation/media/image67.png){width="2.9909470691163604in"
height="3.827248468941382in"}![](media/Applications of Calculus 2_Optimisation/media/image67.png){width="3.1341152668416448in"
height="2.046855861767279in"}

5.  **2021 HSC Advanced Band 4**

> A particle is shot vertically upwards from a point 100 metres above
> ground level.
>
> The position of the particle, $y$ metres above the ground after $t$
> seconds, is given by
>
> $$y(t) = \  - 5t^{2} + \ 70t\  + \ 100$$

a.  Find the maximum height above ground level reached by the particle.

b.  Find the velocity of the particle, in metres per second, immediately
    before it hits the ground, leaving your answer in the form
    $a\sqrt{b}$, where $a$ and $b$ are integers.

![](media/Applications of Calculus 2_Optimisation/media/image68.png){width="3.1284722222222223in"
height="2.990972222222222in"}![](media/Applications of Calculus 2_Optimisation/media/image69.png){width="3.1610017497812772in"
height="4.023999343832021in"}

6.  **2011 HSC Advanced Band 4**

> The velocity of a particle moving along the x-axis is given by
>
> $$v\  = \ 8\  - \ 8e^{- 2t}$$
>
> where $t$ is the time in seconds and $x$ is the displacement in
> metres.

a.  Show that the particle is initially at rest.

b.  Show that the acceleration of the particle is always positive.

c.  Explain why the particle is moving in the positive direction for all
    $t\  > \ 0$.

d.  As$\ t\  \rightarrow \ \infty$, the velocity of the particle
    approaches a constant.

> Find the value of this constant.

e.  Sketch the graph of the particle\'s velocity as a function of time.

![](media/Applications of Calculus 2_Optimisation/media/image70.png){width="3.2862226596675415in"
height="3.68799978127734in"}

![](media/Applications of Calculus 2_Optimisation/media/image71.png){width="3.4079997812773404in"
height="5.138821084864392in"}

7.  **2020 HSC Advanced Band 5**

> A landscape gardener wants to build a garden in the shape of a
> rectangle attached to a quarter-circle. Let $x$ and $y$ be the
> dimensions of the rectangle in metres, as shown in the diagram.
>
> ![](media/Applications of Calculus 2_Optimisation/media/image72.png){width="3.155844269466317in"
> height="1.1532403762029746in"}
>
> The garden bed is required to have an area of 36 m² and to have a
> perimeter which is as small as possible. Let $P$ metres be the
> perimeter of the garden bed.

a.  Show that $P\  = \ 2x\  +$ $\frac{72}{x}$

b.  Find the smallest possible perimeter of the garden bed, showing why
    this is the minimum perimeter.

![](media/Applications of Calculus 2_Optimisation/media/image73.png){width="2.3382250656167978in"
height="5.870944881889764in"}![](media/Applications of Calculus 2_Optimisation/media/image74.png){width="2.641757436570429in"
height="4.1329855643044615in"}

8.  **2023 HSC Advanced Band 5**

> A gardener wants to build a rectangular garden of area 50 m² against
> an existing wall as shown in the diagram. A concrete path of width 1
> metre is to be built around the other three sides of the garden.
>
> Let $x$ and $y$ be the dimensions, in metres, of the outer rectangle
> as shown.
>
> ![](media/Applications of Calculus 2_Optimisation/media/image75.png){width="4.122916666666667in"
> height="1.7083333333333333in"}

a.  Show that $y\  =$ $\frac{50}{x - 2}$ $+ \ 1$

b.  Find the value of x such that the area of the concrete path is a
    minimum. Show that your answer gives a minimum area.

> ![](media/Applications of Calculus 2_Optimisation/media/image76.png){width="2.4325568678915137in"
> height="6.701313429571304in"}![](media/Applications of Calculus 2_Optimisation/media/image77.png){width="2.6431627296587927in"
> height="2.5048753280839895in"}

9.  **2005 HSC Advanced Band 5**

> A cylinder of radius $x$ and height $2h$ is to be inscribed in a
> sphere of radius $R$ centred at $O$.

a.  ![](media/Applications of Calculus 2_Optimisation/media/image78.png){width="2.408695319335083in"
    height="2.319116360454943in"}Show that the volume of the cylinder is
    given by

> $$V\  = \ 2\pi h(R²\  - \ h²)$$

b.  Hence, or otherwise, show that the cylinder has\
    a maximum volume when $h\  =$ $\frac{R}{\sqrt{3}}$

![](media/Applications of Calculus 2_Optimisation/media/image79.png){width="2.921527777777778in"
height="2.2868055555555555in"}![](media/Applications of Calculus 2_Optimisation/media/image80.png){width="2.9399726596675415in"
height="4.498158355205599in"}

10. **2018 HSC Advanced Band 5**

> A sector with radius 10 cm and angle $\theta$ is used to form the
> curved surface of a cone with base radius $x$ cm, as shown in the
> diagram.
>
> ![](media/Applications of Calculus 2_Optimisation/media/image81.png){width="3.452174103237095in"
> height="1.4271248906386702in"}The volume of a cone of radius $r$ and
> height $h$ is given by $V\  = \frac{1}{3}\pi r^{2}h$.

a.  Show that the volume, $V$ cm³, of the cone described above is given
    by

> $$V\  = \ \left( \frac{1}{3} \right)\pi x^{2}\sqrt{100\  - \ x^{2}}$$

b.  Show that $\frac{dV}{dx}$ $=$
    $\frac{\pi x\left( 200\  - \ 3x^{2} \right)}{3\sqrt{100\  - \ x^{2}}}$

c.  Find the exact value of $\theta$ for which $V$ is a maximum.

![](media/Applications of Calculus 2_Optimisation/media/image82.png){width="2.7564063867016624in"
height="6.4883727034120735in"}

![](media/Applications of Calculus 2_Optimisation/media/image83.png){width="2.4459492563429572in"
height="1.8285772090988626in"}

![](media/Applications of Calculus 2_Optimisation/media/image84.png){width="3.8720931758530184in"
height="2.490164041994751in"}

11. **HSC Advanced Sample Question Band 6**

> ![](media/Applications of Calculus 2_Optimisation/media/image85.png){width="2.0194619422572178in"
> height="1.7922080052493439in"}The figure shown represents a wire frame
> where $ABCE$ is a convex quadrilateral.\
> The point $D$ is on line segment $EC$ with $AB\  = \ ED\  = \ 2$ cm
> and $BC\  = \ a$ cm, where $a$ is a positive constant.

Let $\angle CBD\  = \ \theta$ where $0\  < \ \theta\  < \frac{\pi}{2}$.

a.  Find $BD$ and $CD$ in terms of $a$ and $\theta$.

b.  Find the length, $L$ cm, of the wire in the frame,\
    including length $BD$, in terms of $a$ and $\theta$.

c.  Find $\frac{dL}{d\theta}$, and hence show that
    $\frac{dL}{d\theta} = \ 0$ when $BD\  = \ 2CD$.

d.  Find the maximum value of $L$ if $a\  = \ 3\sqrt{5}$.

![](media/Applications of Calculus 2_Optimisation/media/image86.png){width="4.001919291338583in"
height="5.168000874890638in"}![](media/Applications of Calculus 2_Optimisation/media/image87.png){width="3.148050087489064in"
height="5.479196194225722in"}

12. **2024 HSC Advanced Band 6**

> Two circles have the same centre O.\
> The smaller circle has radius 1 cm, while the larger circle has radius
> (1 + x) cm.\
> The circles enclose a region $QRST$, which is subtended by an angle
> $\theta$ at $O$, as shaded.

![](media/Applications of Calculus 2_Optimisation/media/image88.png){width="2.0519488188976376in"
height="2.0678554243219596in"}The area of $QRST$ is $A$ cm², where $A$
is a constant and $A\  > \ 0$.

Let $P$ cm be the perimeter of $QRST$.

a.  By finding expressions for the area and perimeter of $QRST$,\
    show that $P(x) = \ 2x\  +$ $\frac{24}{x}$.

b.  Show that if the perimeter, $P(x),$ is minimised,\
    then $\theta$ must be less than 2.

![](media/Applications of Calculus 2_Optimisation/media/image89.png){width="2.9993536745406826in"
height="5.864000437445319in"}![](media/Applications of Calculus 2_Optimisation/media/image90.png){width="3.995139982502187in"
height="4.642410323709536in"}

13. **2022 HSC Advanced Band 6**

A line passes through the point $P(1,\ 2)$ and meets the axes at
$X(x,\ 0)$ and $Y(0,\ y),$ where $x\  > \ 1$.

a.  ![](media/Applications of Calculus 2_Optimisation/media/image91.png){width="2.354795494313211in"
    height="2.025974409448819in"}Show that $y\  =$ $\frac{2x}{x - 1}$

b.  Find the minimum value of the area of triangle $XOY$.

![](media/Applications of Calculus 2_Optimisation/media/image92.png){width="2.9194444444444443in"
height="7.823611111111111in"}![](media/Applications of Calculus 2_Optimisation/media/image93.png){width="2.6730358705161854in"
height="3.9686800087489065in"}
