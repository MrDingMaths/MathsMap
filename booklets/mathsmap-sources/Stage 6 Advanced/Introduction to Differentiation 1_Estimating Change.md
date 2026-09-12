  -------------------------------------------------------------------
  Mathematics Advanced Year 12
  -------------------------------------------------------------------
  **Introduction to Differentiation**

  -------------------------------------------------------------------

+-------------------------+-----------------------------------+-------------------------+
| **Book 1**              | Estimating change                 | Version: 260210         |
|                         |                                   |                         |
|                         | The derivative                    | Feedback:\              |
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

**MAV-11-06** interprets the meaning of the derivative and determines
the derivative of functions to solve problems

**Estimating change**

- Define the average rate of change of $y$ with respect to $x$ for a
  function $y = f(x)$ over the domain $\lbrack a,b\rbrack$ as
  $\frac{\Delta y}{\Delta x} = \frac{\text{change~in~}y}{\text{change~in~}x}$,
  that is $\frac{\Delta y}{\Delta x} = \frac{f(b) - f(a)}{b - a}$, and
  recognise $\frac{f(b) - f(a)}{b - a}$ as the gradient of the secant
  through $\left( a,f(a) \right)$ and $\left( b,f(b) \right)$ on the
  graph of $y = f(x)$

- Recognise speed as a rate of change of distance with respect to time

- Use the definition for average rate of change to determine the average
  speed of an object from a given distance--time graph

- Describe the difference between the average speed of an object and its
  instantaneous speed

- Determine that the instantaneous speed of an object at time $t$ can be
  approximated by the average speed between its position at time $t$ and
  its position some time later, and explain how this approximation can
  be improved

- Relate the instantaneous speed of an object to the gradient of the
  tangent at that point on its distance--time graph

- Estimate the instantaneous speed of an object from its distance--time
  graph

- Recognise when modelling with a linear function that its gradient is
  the rate of change and determine the rate of change for linear
  functions in practical situations

- Recognise when modelling with a non-linear function that the rate of
  change is not constant and is represented by the gradient of the
  tangent to the curve at each point on the curve

- Estimate the instantaneous rate of change of a non-linear function at
  a given point from a given graph of a practical situation

**The derivative**

- Examine the gradient of a curve at a point on the curve using graphing
  applications

- Approximate the gradient of a curve $f(x) = x^{n}$ at a point
  $P\left( c,f(c) \right)$ by considering the gradient of the secant
  through $P$ and $Q\left( c + h,f(c + h) \right)$ as the magnitude of
  $h$ approaches zero, using graphing applications or a spreadsheet

- Infer that $nx^{n - 1}$ is the gradient of $f(x) = x^{n}$ and verify
  the result using graphing applications

- Define $f'(x)$, for any function $f(x)$ and any value $x$, to be the
  gradient of the tangent to the curve $y = f(x)$ at the point
  $P\left( x,f(x) \right)$ if the tangent exists and is not vertical

- Refer to $f'(x)$ as the derivative of $f(x)$ or the gradient, or
  derived, function of $f(x)$

- Define differentiation as the process of finding the derivative of a
  function

- Find derivatives of constant and linear functions

- Define the derivative of the function $f(x)$ from first principles, as
  the limiting value of the gradient of the secant
  $\frac{f(x + h) - f(x)}{h}$ as $h$ approaches zero, when this limiting
  value exists, and use the notation
  $f'(x) = \lim_{h \rightarrow 0}\frac{f(x + h) - f(x)}{h}$

- Use first principles to find the derivative of quadratic functions

# Estimating Change

+--------------------------------------------------------------------------------------------------------------+
| - **Investigation** The rate of change of a linear function                                                  |
+==============================================================================================================+
| **Calculus studies change.**                                                                                 |
|                                                                                                              |
| Calculus forms the foundation of mathematics and has essential applications in physics, chemistry, medicine, |
| engineering, computing, statistics, business, finance, and economics.                                        |
|                                                                                                              |
| We begin by studying the **derivative** - a function that describes how another function changes             |
|                                                                                                              |
| Imagine the flight of a bumblebee.                                                                           |
|                                                                                                              |
| Barry makes a beeline from his hive to a nearby flower that is 100 m away.                                   |
|                                                                                                              |
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image3.png){width="2.9756944444444446in" |
| height="1.7020833333333334in"}                                                                               |
|                                                                                                              |
| He gets there in 20 seconds by travelling at a **constant speed,** without accelerating\                     |
| (no speeding up or slowing down).                                                                            |
|                                                                                                              |
| What is his speed?                                                                                           |
|                                                                                                              |
| +--------------+--------------------------------------------------+                                          |
| | a.  5 m/s    | Explanation:                                     |                                          |
| |              |                                                  |                                          |
| | b.  10 m/s   | *To find speed, we use the formula ......... =   |                                          |
| |              | ......... ÷ ............*                        |                                          |
| | c.  20 m/s   |                                                  |                                          |
| +==============+==================================================+                                          |
+--------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------+
| - **Investigation** The rate of change of a linear function                                                 |
+=============================================================================================================+
| Let's look at the same problem using our knowledge of functions.                                            |
|                                                                                                             |
| Since the **distance** $D$ between Barry and the hive changes depending on **time** $t$,\                   |
| we can write distance as a function of time.                                                                |
|                                                                                                             |
| $$D(t)$$                                                                                                    |
|                                                                                                             |
| Since Barry isn't accelerating, the graph of this function will be **linear** (straight line).              |
|                                                                                                             |
| At $t = 0$ s, Barry is at his hive, so $D(0\ s) = 0\ m \rightarrow point\ (0,0)$                            |
|                                                                                                             |
| At $t = 20\$s, Barry is at the flower 100 m away, so $D(20) = 100$ m $\rightarrow point\ (20,100)$          |
|                                                                                                             |
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image4.png){width="2.857143482064742in" |
| height="2.706988188976378in"}                                                                               |
|                                                                                                             |
| What does the gradient of the line represent?                                                               |
|                                                                                                             |
| +------------------+--------------------------------------------------+                                     |
| | a.  Acceleration | *The gradient formula is r............ ÷         |                                     |
| |                  | r...............*                                |                                     |
| | b.  Speed        |                                                  |                                     |
| |                  | *In this scenario, it is ............ ÷          |                                     |
| | c.  Position     | ............,\                                   |                                     |
| |                  | which is the formula for ...............*        |                                     |
| +==================+==================================================+                                     |
|                                                                                                             |
| **Important calculus fact:**                                                                                |
|                                                                                                             |
| The rate of change of a linear function is its ........................                                     |
+-------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The rate of change of a linear function is its                |
|     ........................                                      |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Rate of Change of a Linear Function**                         |
+===================================================================+
| The **gradient** of a linear function is its rate of change.      |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** rate of change of linear functions                                                                                                                                                                          |
+==============================================================================================================+==============================================================================================================+
| 1.  The volume of water in a bottle, in mL, after $t$ seconds is given by $v(t)$, shown below.                                                                                                                              |
|                                                                                                                                                                                                                             |
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image5.png){width="2.890174978127734in" height="2.8381944444444445in"} How much water is added to the bottle each second?                               |
|                                                                                                                                                                                                                             |
|   --------------------                                                                                                                                                                                                      |
|   **a**   20 mL/s                                                                                                                                                                                                           |
|   ------- ------------                                                                                                                                                                                                      |
|   **b**   30 mL/s                                                                                                                                                                                                           |
|                                                                                                                                                                                                                             |
|   **c**   50 mL/s                                                                                                                                                                                                           |
|                                                                                                                                                                                                                             |
|   **d**   60 mL/s                                                                                                                                                                                                           |
|   --------------------                                                                                                                                                                                                      |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| 2.  The function relates distance (m) and time (s).                                                          | 3.  The function relates velocity (m/s) and time (s)                                                         |
|                                                                                                              |                                                                                                              |
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image6.png){width="2.8229352580927385in" | ![](media/Introduction to Differentiation 1_Estimating Change/media/image7.png){width="2.8228937007874015in" |
| height="2.8381944444444445in"}                                                                               | height="2.8381944444444445in"}                                                                               |
|                                                                                                              |                                                                                                              |
| Find the rate of change: .....................                                                               | Find the rate of change: .....................                                                               |
|                                                                                                              |                                                                                                              |
| Hence write the equation of the function:                                                                    | Hence write the equation of the function:                                                                    |
|                                                                                                              |                                                                                                              |
| $d(t) =$ ......... $t +$ ...............                                                                     | $v(t) =$ ......... $t +$ ...............                                                                     |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------+
| - **Investigation** The rate of change of a non-linear function                 |
+=================================================================================+
| Suppose a hungry bear comes and knocks down the hive.                           |
|                                                                                 |
| Objects don't fall at a constant speed; they **accelerate** due to gravity.     |
|                                                                                 |
| The function of height against time $h(t)$ is **non-linear** (curved)           |
|                                                                                 |
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image9.png) |
|                                                                                 |
| Draw a line between the two endpoints, what is the **average** speed at which   |
| the hive falls?                                                                 |
|                                                                                 |
| +--------------+--------------------------------------------------+             |
| | a.  5 m/s    | Average speed = ............... ÷                |             |
| |              | ............... =                                |             |
| | b.  10 m/s   |                                                  |             |
| |              |                                                  |             |
| | c.  20 m/s   |                                                  |             |
| +==============+==================================================+             |
|                                                                                 |
| Would it make sense to say that the hive's speed is 10 at every moment of the   |
| fall?                                                                           |
|                                                                                 |
| +--------------+--------------------------------------------------+             |
| | a.  Yes      | *The hive ..................... as it falls, it  |             |
| |              | starts slowly and gets faster.*                  |             |
| | b.  No       |                                                  |             |
| |              | *The speed we calculated is the ...............  |             |
| |              | speed, not the speed at every moment.*           |             |
| +==============+==================================================+             |
|                                                                                 |
| *If* the graph of $h(t)$ were linear, then we can find its speed by finding the |
| gradient.                                                                       |
|                                                                                 |
| However, since $h(t)$ is non-linear due to acceleration, we can only find the   |
| average speed.                                                                  |
+---------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The gradient is the ............... ......                    |
|     ........................ of a linear function.                |
|                                                                   |
| 2.  We can calculate the average rate of change of a non-linear   |
|     function by constructing a straight line between two points   |
|     on the function and calculating the ........................  |
|     of this line.                                                 |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------+
| - **Investigation** Secants and tangents                                                                      |
+===============================================================================================================+
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image10.png){width="1.7715277777777778in" |
| height="1.7791666666666666in"}Consider the **non-linear** function to the right.                              |
|                                                                                                               |
| We call this function **smooth,** or **continuous**.\                                                         |
| It doesn't have sharp corners, holes, or jumps.                                                               |
|                                                                                                               |
| For now, **continuous** means you can draw it with a single stroke of the pen without lifting your hand.      |
|                                                                                                               |
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image15.png)Let's zoom in on the          |
| function.                                                                                                     |
|                                                                                                               |
| What do you notice about the function as you zoom in?                                                         |
|                                                                                                               |
| *When we zoom in far enough to any curve, it looks like a ............... ...............*                    |
|                                                                                                               |
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image20.png)                              |
|                                                                                                               |
| Consider the graph of $f(x) = x^{2}$.\                                                                        |
| The graph shows three **secant** lines joining $( - 1,1)$\                                                    |
| to three points on the parabola.                                                                              |
|                                                                                                               |
| If we wanted to calculate the gradient,\                                                                      |
| or rate of change, of the curve at $( - 1,1)$,\                                                               |
| which line would be the most accurate?                                                                        |
|                                                                                                               |
| +--------------+--------------------------------------------------+                                           |
| | a.  A        | *The ............ two points are on a curve, the |                                           |
| |              | more the line passing through them, called the   |                                           |
| | b.  B        | .................., matches the original curve.* |                                           |
| |              |                                                  |                                           |
| | c.  C        |                                                  |                                           |
| +==============+==================================================+                                           |
+---------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The ............ ...... .................. of a linear        |
|     function is its gradient.                                     |
|                                                                   |
| 2.  We can calculate the .................. rate of change of a   |
|     non-linear function by constructing a ..................      |
|     ............ between two points on the function and           |
|     calculating the gradient of this line.                        |
|                                                                   |
| 3.  By choosing two points that are very .................. to    |
|     each other, our calculation of the rate of change at that     |
|     point becomes more ........................                   |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** Most accurate estimate of rate of change                                                                                                                                                                                                                                                                                                                |
+========================================================================================================================================================================================================================================================================================================================================================================+
| 1.  Which secant line would be most accurate when finding the rate of change of the function at $x = a$?                                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                                                                                        |
|   -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   **a**   ![](media/Introduction to Differentiation 1_Estimating Change/media/image21.png){width="1.811023622047244in"   **b**   ![](media/Introduction to Differentiation 1_Estimating Change/media/image21.png){width="1.811023622047244in"   **c**   ![](media/Introduction to Differentiation 1_Estimating Change/media/image21.png){width="1.811023622047244in"   |
|           height="1.3657917760279965in"}                                                                                         height="1.3657917760279965in"}                                                                                         height="1.3657917760279965in"}                                                                                 |
|   ------- -------------------------------------------------------------------------------------------------------------- ------- -------------------------------------------------------------------------------------------------------------- ------- -------------------------------------------------------------------------------------------------------------- |
|                                                                                                                                                                                                                                                                                                                                                                        |
|   -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 2.  Which secant line would be most accurate when finding the rate of change of the function at $x = a$?                                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                                                                                        |
|   -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   **a**   ![](media/Introduction to Differentiation 1_Estimating Change/media/image22.png){width="1.811023622047244in"   **b**   ![](media/Introduction to Differentiation 1_Estimating Change/media/image22.png){width="1.811023622047244in"   **c**   ![](media/Introduction to Differentiation 1_Estimating Change/media/image22.png){width="1.811023622047244in"   |
|           height="1.372872922134733in"}                                                                                          height="1.372872922134733in"}                                                                                          height="1.3188768591426072in"}                                                                                 |
|   ------- -------------------------------------------------------------------------------------------------------------- ------- -------------------------------------------------------------------------------------------------------------- ------- -------------------------------------------------------------------------------------------------------------- |
|                                                                                                                                                                                                                                                                                                                                                                        |
|   -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 3.  What would be the best estimate for the rate of change at $x = - 1$?                                                                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                                                                                        |
|   ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------                                                                              |
|   **a**                    **b**   ![](media/Introduction to Differentiation 1_Estimating Change/media/image23.png){width="1.8in"   **c**   ![](media/Introduction to Differentiation 1_Estimating Change/media/image24.png){width="1.8208956692913385in"                                                                                                              |
|                                    height="2.1881944444444446in"}                                                                           height="2.1951826334208224in"}![](media/Introduction to Differentiation 1_Estimating Change/media/image25.png){width="1.8641108923884515in"                                                                                |
|                                                                                                                                             height="2.1959153543307086in"}                                                                                                                                                                                             |
|   ------- ---------------- ------- ------------------------------------------------------------------------------------------------ ------- ---------------------------------------------------------------------------------------------------------------------------------------------                                                                              |
|                                                                                                                                                                                                                                                                                                                                                                        |
|   ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------                                                                              |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Summary of Estimating Change**                                                                                                                                                                                            |
+===============================================================================================================+===============================================================================================================+
| The **gradient** is the **rate of change** of a function.                                                                                                                                                                     |
|                                                                                                                                                                                                                               |
| We calculate the **average rate of change** of a curved function by drawing a **secant** **line** between two points on the curve and finding its gradient.                                                                   |
|                                                                                                                                                                                                                               |
| A **tangent line** touches the curve at exactly one point and has the same gradient as the curve at that point.                                                                                                               |
|                                                                                                                                                                                                                               |
| The **instantaneous rate of change** is the gradient of the tangent.                                                                                                                                                          |
|                                                                                                                                                                                                                               |
| We call the instantaneous rate of change at a point the **derivative**.                                                                                                                                                       |
|                                                                                                                                                                                                                               |
| We write the gradient of the tangent of $f(x)$ at $x = a$ as $\mathbf{f}^{\mathbf{'}}\left( \mathbf{a} \right)$, read as "$f$ prime $a$."                                                                                     |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Rate of Change of Non-Linear Functions**                                                                                                                                                                                    |
+---------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------+
| **Secant**                                                                                                    | **Tangent**                                                                                                   |
|                                                                                                               |                                                                                                               |
| Gradient is **average** rate of change                                                                        | Gradient is **instantaneous** rate of change                                                                  |
|                                                                                                               |                                                                                                               |
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image26.png){width="1.9680555555555554in" | ![](media/Introduction to Differentiation 1_Estimating Change/media/image27.png){width="1.9680555555555554in" |
| height="1.8430555555555554in"}                                                                                | height="1.8631944444444444in"}                                                                                |
+---------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** Instantaneous rate of change as the gradient of the tangent                                                                                                                                                       |
+===============================================================================================================+===================================================================================================================+
| 1.  Find the instantaneous rate of change at $x = 4$.                                                         | 2.  ![](media/Introduction to Differentiation 1_Estimating Change/media/image29.png){width="2.6729166666666666in" |
|                                                                                                               |     height="2.8229166666666665in"}Find the instantaneous rate of change at $x = 4$.                               |
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image28.png){width="2.7559055118110236in" |                                                                                                                   |
| height="2.826311242344707in"}                                                                                 | $f'(4) =$ ...............                                                                                         |
|                                                                                                               |                                                                                                                   |
| $f'(4) =$ ...............                                                                                     |                                                                                                                   |
+---------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------+

Foundation

1.  ![](media/Introduction to Differentiation 1_Estimating Change/media/image30.png){width="7.478209755030621in"
    height="3.8585115923009625in"}A bottle of water was taken out of the
    fridge on a hot day.\
    Its temperature started at 0°C and started rising.

    a.  What is the average rate of change of the temperature in the
        first 20 minutes?

1° C per minute.

b.  Is the temperature increasing at this rate the whole time?\
    Explain how you know by referring to the graph.

No. The graph is not a straight line, so the rate of change is not
constant.

If the temperature increased at this rate, then at 80 minutes it would
be 80°C, which is not the case.

c.  Estimate the *instantaneous* rate of temperature change at 0 minutes
    by finding the gradient of the tangent at O. We call this $f'(0)$.

$$\approx 1.39{^\circ}C/min$$

d.  Find $f'(20).$

$$\approx 0.7{^\circ}C/min$$

e.  Find $f'(60)$.

$$\approx 0.2{^\circ}C/min$$

f.  What do you think will happen to the value of $f'(x)$ as
    $x \rightarrow \infty$?

> Interpret your answer in relation to the context.

The gradient of the tangent will eventually go to zero.\
This is because the temperature will stop increasing once the water
bottle reaches room temperature.

2.  We will continue this investigation using DESMOS.

- Gradient of Tangent Calculator:
  https://www.desmos.com/calculator/bae2ab60nl

  a.  For the graph of $y = x^{2}$, this DESMOS applet will calculate
      the gradient of the tangent, called the derivative, at a given
      point.\
      Complete the table of values. You may need to zoom in.

  ------------------------------------------------------------------------------------------------------------------
                $$\mathbf{x}$$               -- 5    -- 4   -- 3   -- 2   -- 1   0     1     2     3     4     5
  ------------------------------------------ ------- ------ ------ ------ ------ ----- ----- ----- ----- ----- -----
   $$\mathbf{f'}\left( \mathbf{x} \right)$$  -- 10   -- 8   -- 6   -- 4   -- 2   0     2     4     6     8     10

  ------------------------------------------------------------------------------------------------------------------

b.  ![](media/Introduction to Differentiation 1_Estimating Change/media/image31.png){width="3.1663888888888887in"
    height="3.1496062992125986in"}Therefore, sketch the graph of
    $y = f'(x)$ and determine the equation of $f'(x)$.

$f'(x)\  =$ ........................

$$f'(x) = 2x$$

c.  Repeat for $y = x^{3}$. Use the left menu of the DESMOS app to
    change the equation.

  ----------------------------------------------------------------------------------------------------
                $$\mathbf{x}$$               -- 4   -- 3   -- 2   -- 1   0     1     2     3     4
  ------------------------------------------ ------ ------ ------ ------ ----- ----- ----- ----- -----
   $$\mathbf{f'}\left( \mathbf{x} \right)$$  48     27     12     3      0     3     12    27    48

  ----------------------------------------------------------------------------------------------------

![](media/Introduction to Differentiation 1_Estimating Change/media/image32.png){width="3.1663888888888887in"
height="3.1496052055993in"}

$f'(x)\  =$ ........................

$$f'(x) = 3x^{2}$$

3.  We will continue this investigation using GeoGebra.

- Derivative tracer: https://www.geogebra.org/m/xqmt2tfk

This applet will automatically sketch $f'(x)$ for given values of $x$.

Use the slider to create the derivative function. SHOW DERIVATIVE will
give the equation $f'(x)$.

Use the RESET SCREEN button between questions.

a.  What is equation of $f'(x)$ when $f(x) = x^{2}$?

$$f'(x) = 2x$$

b.  What is equation of $f'(x)$ when $f(x) = - x^{2}$?

$$f'(x) = - 2x$$

c.  What is equation of $f'(x)$ when $f(x) = 3x^{2}$?

$$f'(x) = 6x$$

d.  What is equation of $f'(x)$ when $f(x) = 3x^{2} + 1$?

$$f'(x) = 6x$$

e.  What type of graph is the derivative function when $f(x)$ is
    quadratic?

Linear.

f.  Does the constant term influence the derivative?\
    Explain your observation by referring to the gradient.

No. The constant term does not affect the derivative.

The constant term shifts the curve vertically, so it does not change the
gradient.

g.  What is equation of $f'(x)$ when $f(x) = x^{3}$?

$$f'(x) = 3x^{2}$$

h.  What is equation of $f'(x)$ when $f(x) = - x^{3}$?

$$f'(x) = - 3x^{2}$$

i.  What is equation of $f'(x)$ when $f(x) = 2x^{3} - 4x^{2} + 5x$?

$$f'(x) = 6x^{2} - 8x + 5$$

j.  What type of graph is the derivative function when $f(x)$ is cubic?

Quadratic, or parabola.

k.  Come up with a way to quickly find the derivative function $f'(x)$
    from the equation of $f(x)$.

For each term, multiply the term by the power, then reduce the power by
1.

l.  What is equation of $f'(x)$ when $f(x) = x$

$$f'(x) = 1$$

m.  What is equation of $f'(x)$ when $f(x) = 3x + 5$

$$f'(x) = 3$$

n.  What is equation of $f'(x)$ when $f(x) = - 3x + 5$

$$f'(x) = - 3$$

o.  What is equation of $f'(x)$ when $f(x) = x^{4}$?

$$f'(x) = 4x^{3}$$

p.  What is equation of $f'(x)$ when $f(x) = \sin x$?

$$y = \cos x$$

# The Derivative of a Linear Function

+-------------------------------------------------------------------+
| - **The Gradient Function**                                       |
+===================================================================+
| For a function $y = f(x)$, the **derivative function** $f'(x)$,   |
| also called the gradient function or simply the derivative, gives |
| the **gradient of the tangent** at $x$.                           |
|                                                                   |
| We can write the derivative as $\frac{\mathbf{dy}}{\mathbf{dx}}$  |
| or $\mathbf{f}^{\mathbf{'}}\left( \mathbf{x} \right)$ or          |
| $\mathbf{y}^{\mathbf{'}}$                                         |
|                                                                   |
| We call the process of finding the derivative                     |
| **differentiation**.                                              |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **The Derivative of Linear Functions**                          |
+===================================================================+
| A linear function has a constant rate of change.                  |
|                                                                   |
| A linear function's derivative is its gradient.                   |
|                                                                   |
| for $f(x) = mx + c$                                               |
|                                                                   |
| $$f'(x) = m$$                                                     |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** the derivative of a linear function                                                                               |
+===============================+=========================================================+========================================+
| $${f(x) = 3x + 5              | $${f(x) = - x + 15                                      | $${f(x) = 7                            |
| }{f'(x) = 3}$$                | }{f'(x) = - 1}$$                                        | }{f'(x) = 0}$$                         |
+-------------------------------+---------------------------------------------------------+----------------------------------------+
| Find $f'(x)$ for these linear functions                                                                                          |
+-------------------------------+---------------------------------------------------------+----------------------------------------+
| a.  $f(x) = 2x + 3$           | b.  $f(x) = 5 - 3x$                                     | c.  $f(x) = \frac{x}{2} - 7$           |
+-------------------------------+---------------------------------------------------------+----------------------------------------+
| d.  $f(x) = - 4$              | e.  $f(x) = ax + b$                                     | f.  $f(x) = \frac{2}{3}(x + 4)$        |
+-------------------------------+---------------------------------------------------------+----------------------------------------+
| g.  $f(x) = \frac{3 - 5x}{4}$ | h.  $f(x) = \frac{5}{2}\left( 7 - \frac{4x}{3} \right)$ | i.  $f(x) = \frac{1}{2} + \frac{1}{3}$ |
+-------------------------------+---------------------------------------------------------+----------------------------------------+

# Differentiation by First Principles

+---------------------------------------------------------------------------------------------------------------+
| - **Investigation** Differentiation by First Principles                                                       |
+===============================================================================================================+
| **Differentiation** is the process of finding the derivative.                                                 |
|                                                                                                               |
| We can find the derivative geometrically by sketching graphs and tangents, or algebraically using the method  |
| we will develop below.                                                                                        |
|                                                                                                               |
| We will now formally define the derivative function, which describes the "**instantaneous**" rate of change   |
| of another function at a point.                                                                               |
|                                                                                                               |
| Consider the graph of $y = f(x)$.                                                                             |
|                                                                                                               |
| Two points on the graph are chosen, $x$ and $(x + h)$, where $h$ is some small distance.                      |
|                                                                                                               |
| Find the **gradient of the secant** that connects these two points.                                           |
|                                                                                                               |
| ![](media/Introduction to Differentiation 1_Estimating Change/media/image33.png){width="3.0416666666666665in" |
| height="3.1104943132108485in"}                                                                                |
|                                                                                                               |
| Rise: .................................                                                                       |
|                                                                                                               |
| Run: .................................                                                                        |
|                                                                                                               |
| $m_{secant}$ .................................                                                                |
|                                                                                                               |
| The **gradient of the secant** is called the **difference quotient.**                                         |
|                                                                                                               |
| We define the **derivative** $f'(x)$ of a function as the **gradient of the tangent** (when                   |
| $h \rightarrow 0)$ at a point $x$.                                                                            |
|                                                                                                               |
| $$f'(x) = m_{tangent} = \lim_{h \rightarrow 0}\frac{f(x + h) - f(x)}{h}$$                                     |
|                                                                                                               |
| The derivative function describes the "instantaneous" rate of change of another function.                     |
+---------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **First Principles Differentiation**                            |
+===================================================================+
| $$f'(x) = \lim_{h \rightarrow 0}\frac{f(x + h) - f(x)}{h}$$       |
|                                                                   |
| - Gradient of Tangent Calculator:                                 |
|   https://www.desmos.com/calculator/bae2ab60nl                    |
|                                                                   |
| <!-- -->                                                          |
|                                                                   |
| - Derivative tracer: https://www.geogebra.org/m/xqmt2tfk          |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Review** (Questions as relevant to the planned examples as    |
|   possible)                                                       |
+===================================================================+
| - Recall                                                          |
|                                                                   |
| - Identify                                                        |
|                                                                   |
| 1.                                                                |
|                                                                   |
| +------------------------------+------------------------------+   |
| | a.                           | b.                           |   |
| +==============================+==============================+   |
|                                                                   |
| +--------------------+--------------------+--------------------+  |
| | a.                 | b.                 | c.                 |  |
| +====================+====================+====================+  |
|                                                                   |
| +--------------+--------------+--------------+--------------+     |
| | a.           | b.           | c.           | d.           |     |
| +==============+==============+==============+==============+     |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Definition \| Formula \| Procedure**                              |
+===================================+===================================+
| A power function has a single term in the form:                       |
|                                                                       |
| $$f(x) = kx^{n}$$                                                     |
|                                                                       |
| -                                                                     |
+-----------------------------------+-----------------------------------+
|                                   |                                   |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** Language \| Decision                                                                                                       |
+=============+=============+=============+=============+=============+=============+=============+=============+=============+=============+
| Scenario                                                                                                                                  |
+---------------------------+-----------------------------------------+-----------------------------------------+---------------------------+
| ✖                         | ✔                                       | ✔                                       | ✖                         |
+-------------+-------------+---------------------------+-------------+-------------+---------------------------+-------------+-------------+
| ✖           | ✔                                       | ✔                         | ✔                                       | ✖           |
+-------------+-----------------------------------------+---------------------------+-----------------------------------------+-------------+
| Testing Sequence                                                                                                                          |
+-------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                           |
+---------------------------------------------------------------------+---------------------------------------------------------------------+
| a.                                                                  | b.                                                                  |
+-----------------------------------------+---------------------------+---------------------------+-----------------------------------------+
| a.                                      | b.                                                    | c.                                      |
+---------------------------+-------------+---------------------------+---------------------------+-------------+---------------------------+
| a.                        | b.                                      | c.                                      | d.                        |
+---------------------------+-----------------------------------------+-----------------------------------------+---------------------------+

+-----------------------------------------------------------------------------------------------------------+
| - **Interpret** Transformation                                                                            |
+=================+=================+=================+=================+=================+=================+
| Scenario                                                                                                  |
+-----------------------------------------------------+-----------------------------------------------------+
|                                                     |                                                     |
+-----------------------------------+-----------------+-----------------+-----------------------------------+
|                                   |                                   |                                   |
+-----------------+-----------------+-----------------+-----------------+-----------------+-----------------+
|                 |                                   |                                   |                 |
+-----------------+-----------------------------------+-----------------------------------+-----------------+
| Testing Sequence                                                                                          |
+-----------------------------------------------------------------------------------------------------------+
| a.                                                                                                        |
+-----------------------------------------------------+-----------------------------------------------------+
| b.                                                  | c.                                                  |
+-----------------------------------+-----------------+-----------------+-----------------------------------+
| d.                                | e.                                | f.                                |
+-----------------+-----------------+-----------------+-----------------+-----------------+-----------------+
| d.              | e.                                | f.                                | g.              |
+-----------------+-----------------------------------+-----------------------------------+-----------------+

+-------------------------------------------------------------------------------------+
| - **Example** Success Criteria                                                      |
+=========================+=========================+=================================+
| Scenario                                                                            |
+---------------------------------------------------+---------------------------------+
| Worked example                                    | Checks for listening            |
+---------------------------------------------------+---------------------------------+
|                                                   |                                 |
+-------------------------+-------------------------+---------------------------------+
|                         |                                                           |
+-------------------------+-----------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| Test the same skill as the I Do but still require genuine thinking -  |
| not just pattern matching.                                            |
|                                                                       |
| Sequence of examples varying critical features                        |
+-----------------------------------------------------------------------+
| a.                                                                    |
+-----------------------------------+-----------------------------------+
| b.                                | c.                                |
+-----------------------------------+-----------------------------------+
| d.                                | e.                                |
+-----------------------------------+-----------------------------------+
|                                   |                                   |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 4.  Fact atoms                                                    |
|                                                                   |
| 5.  Procedure                                                     |
+-------------------------------------------------------------------+

$$proj_{\mathbf{b}}\mathbf{a}\ $$

$$proj_{\mathbf{u}}\mathbf{v}\ $$

Foundation

+---------------------------------+---------------------------------+
| a.                              | b.                              |
|                                 |                                 |
| $$Type\ equation\ here.$$       | $$Type\ equation\ here.$$       |
+=================================+=================================+

+-------------------------------+-------------------------------+
| i.                            | ii.                           |
+===============================+===============================+

+---------------------------+---------------------------+---------------------------+
| j.                        | k.                        | l.                        |
|                           |                           |                           |
| $$Type\ equation\ here.$$ | $$Type\ equation\ here.$$ | $$Type\ equation\ here.$$ |
+===========================+===========================+===========================+

+---------------------+---------------------+---------------------+
| i.                  | ii.                 | iii.                |
+=====================+=====================+=====================+

+---------------------------+---------------------------+---------------------------+---------------------------+
| a.                        | b.                        | c.                        | d.                        |
|                           |                           |                           |                           |
| $$Type\ equation\ here.$$ | $$Type\ equation\ here.$$ | $$Type\ equation\ here.$$ | $$Type\ equation\ here.$$ |
+===========================+===========================+===========================+===========================+

+---------------+---------------+---------------+---------------+
| i.            | ii.           | iii.          | iv.           |
+===============+===============+===============+===============+

- Desmos

<!-- -->

- GeoGebra

Symbols:

¯¯¯

✔

✖

$$\overset{̰}{a}$$

![](media/Introduction to Differentiation 1_Estimating Change/media/image34.png){width="2.4208333333333334in"
height="2.3645833333333335in"}
