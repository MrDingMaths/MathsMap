  -------------------------------------------------------------------
  Mathematics Advanced Year 12
  -------------------------------------------------------------------
  **Applications of\
  Calculus**

  -------------------------------------------------------------------

+-------------------------+-----------------------------------+-------------------------+
| **Book 1**              | Turning points, inflections, and  | Version: 251202         |
|                         | curve-sketching                   |                         |
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

**MAV-12-06** applies calculus to graph functions and model and solve
problems involving optimisation, rates of change and motion in a line

**Turning points, inflections and curve-sketching**

- Define a function $f(x)$to be differentiable at $x = a$ if
  $\lim_{h \rightarrow 0}\frac{f(a + h) - f(a)}{h}$ exists, that is if
  there is a non-vertical tangent to the curve at the point
  $P\left( a,f(a) \right)$ and recognise that if $f(x)$ is
  differentiable at $x = a$ then it is continuous at $x = a$

- Identify any values of $x$ where a function is continuous, but not
  differentiable, given either the equation of the function or its graph

- Use repeated differentiation to find second derivatives of a function
  $y = f(x)$, denoting them by $f''(x)$ or $\frac{d^{2}y}{dx^{2}}$ or
  $y''$

- Analyse the stationary points of a function by testing values for
  $f'(x)$, then classify the stationary points as local minima or local
  maxima where gradients change around the point, or horizontal points
  of inflection where gradients have the same sign on both sides of the
  point

- Interpret the second derivative $y''$ as the gradient function of the
  first derivative $y'$, and deduce that if $y'' > 0$ the curve is
  concave up and if $y'' < 0$ the curve is concave down

- Define a point of inflection on a curve as a point where the concavity
  changes

- Analyse the value of $f''(x)$ either side of the roots of
  $f''(x) = 0$, and use the resulting concavities to identify which
  zeroes of $f''(x)$ are points of inflection

- Use the second derivative to classify a stationary point as a local
  maximum, local minimum or a horizontal point of inflection

- Graph a function by determining local maxima and minima and points of
  inflection, horizontal and non-horizontal, considering any even or odd
  symmetry, the domain, any vertical asymptotes or other
  discontinuities, and where applicable, the behaviour of a function as
  $x \rightarrow \pm \infty$

- Graph $y = f'(x)$ and $y = f''(x)$ for a function $y = f(x)$, given
  only a graph of $y = f(x)$

# Continuous and Differentiable

+------------------------------------------------------------------------------------------------------------------------------------+
| - **Continuous at a Point**                                                                                                        |
+====================================================================================================================================+
| A function is **continuous** at a point $x = a$ if the graph of $y = f(x)$ can be drawn through the point in a single pen stroke   |
| without lifting the pen. In the graph below, the function is continuous everywhere except for the **discontinuities** at           |
| $x \in \left\{ c,\ d,\ e,\ f \right\}$.                                                                                            |
|                                                                                                                                    |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image1.png){width="3.0819444444444444in" |
| height="1.5569444444444445in"}                                                                                                     |
+------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** discontinuities in graphs.                                                                                                                                                                                                                                                                                                                                                                                                     |
+======================================================================================================================================================================+===================================================================================================================================+====================================================================================================================================+
| Identify any discontinuities in these curves, if any.                                                                                                                                                                                                                                                                                                                                                                                         |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image2.png){width="1.9090277777777778in"                               | b.                                                                                                                                | c.                                                                                                                                 |
|     height="1.9680555555555554in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image3.png){width="1.9090277777777778in" |                                                                                                                                   |                                                                                                                                    |
|     height="1.9680555555555554in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image4.png){width="1.9091655730533683in" |                                                                                                                                   |                                                                                                                                    |
|     height="1.968503937007874in"}                                                                                                                                    |                                                                                                                                   |                                                                                                                                    |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
| d.                                                                                                                                                                   | e.                                                                                                                                | f.                                                                                                                                 |
|                                                                                                                                                                      |                                                                                                                                   |                                                                                                                                    |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image5.png){width="2.010709755030621in" height="1.968503937007874in"}      | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image6.png){width="2.012322834645669in" | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image7.png){width="2.0157742782152233in" |
|                                                                                                                                                                      | height="1.968503937007874in"}                                                                                                     | height="1.968503937007874in"}                                                                                                      |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Continuous from an Equation**                                 |
+===================================================================+
| A function is **discontinuous** at $x = a$ if:                    |
|                                                                   |
| - The function is undefined at that point (e.g. asymptote,        |
|   denominator = 0).                                               |
|                                                                   |
| - If a piecewise function doesn't join up at $x = a;$ $f(a)$ is   |
|   different to the left and right                                 |
|                                                                   |
| We will assume the curve is continuous everywhere else.           |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Determine continuous or differentiable from an equation.                                                                                                                                                                                                  |
+====================================================================================================================================+====================================================================================================================================+
| Decide whether these functions are continuous at $x = 1$ using the equation. A sketch is given.                                                                                                                                                                         |
+------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
| $$f(x) = \frac{3x - 3}{4x - 4}$$                                                                                                   | $$f(x) = \left\{ \begin{array}{r}                                                                                                  |
|                                                                                                                                    | 2 - x,\ \ x < 1 \\                                                                                                                 |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image8.png){width="1.8340015310586177in" | x^{2},\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ x \geq 1                                                                                       |
| height="1.7716535433070866in"}                                                                                                     | \end{array} \right.\ $$                                                                                                            |
|                                                                                                                                    |                                                                                                                                    |
| $f(x)$ is undefined when $4x - 4 = 0$                                                                                              | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image9.png){width="1.8291732283464568in" |
|                                                                                                                                    | height="1.7716535433070866in"}                                                                                                     |
| $x = 1$                                                                                                                            |                                                                                                                                    |
|                                                                                                                                    | Let $g(x) = 2 - x$                                                                                                                 |
| Since $f(x)$ is undefined at $x = 1$, it is not continuous at $x = 1$.                                                             |                                                                                                                                    |
|                                                                                                                                    | $$g(1) = 1$$                                                                                                                       |
|                                                                                                                                    |                                                                                                                                    |
|                                                                                                                                    | Let $h(x) = x^{2}$                                                                                                                 |
|                                                                                                                                    |                                                                                                                                    |
|                                                                                                                                    | $$h(1) = 1$$                                                                                                                       |
|                                                                                                                                    |                                                                                                                                    |
|                                                                                                                                    | The graphs join up at $x = 1$, $\therefore$ continuous.                                                                            |
+------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                                                                                                                                                            |
+=====================================================================================================================================+=====================================================================================================================================+
| Decide whether these functions are continuous at $x = 3$.                                                                                                                                                                                                                 |
+-------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image10.png){width="1.8360772090988626in" | $$f(x) = \frac{5}{x^{2} - 4}$$                                                                                                      |
| height="1.7716535433070866in"}$f(x) = \left\{ \begin{array}{r}                                                                      |                                                                                                                                     |
| 2^{x},\ \ \ \ \ x < 3 \\                                                                                                            | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image11.png){width="1.8313199912510936in" |
| x^{2},\ \ \ \ \ x \geq 3                                                                                                            | height="1.7716535433070866in"}                                                                                                      |
| \end{array} \right.\$                                                                                                               |                                                                                                                                     |
|                                                                                                                                     | Continuous at $x = 3$                                                                                                               |
| Discontinuity at $x = 3$                                                                                                            |                                                                                                                                     |
+-------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+
| - **Differentiable at a Point**                                                                                                                                                                                                                                           |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| A function is differentiable (or smooth) at a point $x = a$ if $\lim_{h \rightarrow 0}\frac{f(a + h) - f(a)}{h}$ exists;\                                                                                                                                                 |
| in other words: there is a **non-vertical tangent** at the point $P\left( a,\ f(a) \right)$ and there is **no sharp change in direction**.\                                                                                                                               |
| in other words: if you zoom in enough, you get a non-vertical straight line through the point.                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                           |
| In the graphs below, $f(x) = x^{2}$ is differentiable for all $x$, while $y = |x|$ is differentiable everywhere except $x = 0.$                                                                                                                                           |
|                                                                                                                                                                                                                                                                           |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image12.png){width="1.725in"                                                                                                                                                    |
| height="1.707638888888889in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image13.png){width="1.725in" height="1.7625in"}                                                                                                    |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** non-differentiable points in graphs.                                                                                                                                                                                                                                                                                                                                                                      |
+========================================================================================================================================+========================================================================================================================================+========================================================================================================================================+
| Identify any non-differentiable points in these curves, if any.                                                                                                                                                                                                                                                                                                                                                          |
+----------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image14.png){width="2.014783464566929in" | b.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image15.png){width="2.009027777777778in" | c.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image16.png){width="2.009027777777778in" |
|     height="1.9679866579177603in"}                                                                                                     |     height="1.9680555555555554in"}                                                                                                     |     height="1.9680555555555554in"}                                                                                                     |
+----------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+
| d.                                                                                                                                     | e.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image18.png){width="2.009027777777778in" | f.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image19.png){width="2.015277777777778in" |
|                                                                                                                                        |     height="1.9673611111111111in"}                                                                                                     |     height="1.9673611111111111in"}                                                                                                     |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image17.png){width="2.0097222222222224in"    |                                                                                                                                        |                                                                                                                                        |
| height="1.9680555555555554in"}                                                                                                         |                                                                                                                                        |                                                                                                                                        |
+----------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Differentiable from an Equation**                             |
+===================================================================+
| A function is **not differentiable** (not smooth) at $x = a$ if:  |
|                                                                   |
| - It is **discontinuous** at $x = a$.                             |
|                                                                   |
| - If the **tangent is vertical,**                                 |
|   $\mathbf{f}^{\mathbf{'}}\left( \mathbf{a} \right)$ **is         |
|   undefined**, e.g. ends of a semicircle, square root function.   |
|                                                                   |
| - There is a **sharp change in direction**, e.g. where absolute   |
|   value curves change direction.                                  |
|                                                                   |
| - If a piecewise function has **different**                       |
|   $\mathbf{f}^{\mathbf{'}}\left( \mathbf{a} \right)$ at $x = a$.  |
|                                                                   |
| <!-- -->                                                          |
|                                                                   |
| - Remember that an absolute value function is a piecewise-defined |
|   function.                                                       |
|                                                                   |
| $$f(x) = |x - a| = \left\{ \begin{array}{r}                       |
|  - (x - a),\ \ x < a \\                                           |
| x - a,\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ x \geq a                    |
| \end{array} \right.\ $$                                           |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Determine continuous or differentiable from an equation.                                                              |
+=====================================================================================================================================+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image20.png){width="2.4126793525809274in" |
| height="2.3622047244094486in"}Decide whether $f(x)$ is differentiable at $x = 0.$                                                   |
|                                                                                                                                     |
| $$f(x) = \left\{ \begin{array}{r}                                                                                                   |
| x,\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ x < 0 \\                                                                                            |
| x - x^{2},\ \ \ \ \ x \geq 0                                                                                                        |
| \end{array} \right.\ $$                                                                                                             |
|                                                                                                                                     |
| Let $g(x) = x$, $h(x) = x - x^{2}$                                                                                                  |
|                                                                                                                                     |
| First, test continuity at $x = 0$                                                                                                   |
|                                                                                                                                     |
| $g(0) = 0,\ h(0) = 0$ ∴ continuous                                                                                                  |
|                                                                                                                                     |
| Differentiate and test $f'(x)$                                                                                                      |
|                                                                                                                                     |
| $$f'(x) = \left\{ \begin{array}{r}                                                                                                  |
| 1,\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ x \leq 0 \\                                                                                         |
| 1 - 2x,\ \ \ \ \ x \geq 0                                                                                                           |
| \end{array} \right.\ $$                                                                                                             |
|                                                                                                                                     |
| $g'(0) = 1,\ h'(0) = 1$ ∴ differentiable                                                                                            |
+-------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image21.png){width="2.4126793525809274in" |
| height="2.3620352143482064in"}Decide whether $f(x)$ is differentiable at $x = 2.$                                                   |
|                                                                                                                                     |
| $$f(x) = 3|x - 2|$$                                                                                                                 |
|                                                                                                                                     |
| $$f(x) = \left\{ \begin{array}{r}                                                                                                   |
|  - 3(x - 2),\ \ \ \ \ \ \ x < 2 \\                                                                                                  |
| 3(x - 2),\ \ \ \ \ \ \ \ \ \ \ x \geq 2                                                                                             |
| \end{array} \right.\ $$                                                                                                             |
|                                                                                                                                     |
| Let $g(x) = - 3(x - 2)$, $h(x) = 3(x - 2)$                                                                                          |
|                                                                                                                                     |
| First, test continuity at $x = 2$                                                                                                   |
|                                                                                                                                     |
| $g(2) = 0,\ h(2) = 0$ ∴ continuous                                                                                                  |
|                                                                                                                                     |
| Differentiate and test $f'(x)$                                                                                                      |
|                                                                                                                                     |
| $$f'(x) = \left\{ \begin{array}{r}                                                                                                  |
|  - 3,\ \ \ \ \ x \leq 2 \\                                                                                                          |
| 3,\ \ \ \ \ \ \ \ \ x \geq 2                                                                                                        |
| \end{array} \right.\ $$                                                                                                             |
|                                                                                                                                     |
| $g'(2) = - 3,\ h'(2) = 3$ ∴ not differentiable                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                     |
+====================================================================================================================================+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image22.png){width="2.010709755030621in" |
| height="1.968503937007874in"}Decide whether $f(x)$ is differentiable at $x = 0$.                                                   |
|                                                                                                                                    |
| $$f(x) = \left\{ \begin{array}{r}                                                                                                  |
| x^{2} - 1,\ \ \ \ \ x \leq 0 \\                                                                                                    |
| x^{2} + 1,\ \ \ \ \ x > 0                                                                                                          |
| \end{array} \right.\ $$                                                                                                            |
|                                                                                                                                    |
| No, the function is not continuous at $x = 0$                                                                                      |
+------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image23.png){width="2.014087926509186in" |
| height="1.968503937007874in"}Decide whether $f(x)$ is differentiable at $x = 4$.                                                   |
|                                                                                                                                    |
| $$f(x) = \left\{ \begin{array}{r}                                                                                                  |
|  - 1,\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ x < 4 \\                                                                    |
| x^{2} - 8x + 15,\ \ \ \ \ x \geq 4                                                                                                 |
| \end{array} \right.\ $$                                                                                                            |
+------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image24.png){width="2.010709755030621in" |
| height="1.961913823272091in"}Decide whether $f(x)$ is differentiable at $x = 0$.                                                   |
|                                                                                                                                    |
| $$f(x) = \sqrt[3]{x^{2}}\ $$                                                                                                       |
+------------------------------------------------------------------------------------------------------------------------------------+

# Classifying Stationary Points using the Derivative

+------------------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                                       |
+====================================================================================================================================+
| - Identify whether a curve is increasing/decreasing/stationary at a point graphically.                                             |
|                                                                                                                                    |
| On the given diagram, annotate the points to says whether $f'(x) > 0$, $f'(x) < 0$, or $f'(x) = 0$                                 |
|                                                                                                                                    |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image25.png){width="2.967361111111111in" |
| height="2.145138888888889in"}                                                                                                      |
|                                                                                                                                    |
| - Identify whether a curve is increasing/decreasing/stationary at a point algebraically.                                           |
|                                                                                                                                    |
|   a.  Differentiate $y = x^{3} - 4x$                                                                                               |
|                                                                                                                                    |
|   b.  Determine whether the curve is increasing, decreasing, or stationary at:                                                     |
|                                                                                                                                    |
|       i.  $x = - 3$                                                                                                                |
|                                                                                                                                    |
|       ii. $x = 0$                                                                                                                  |
|                                                                                                                                    |
|       iii. $x = 2$                                                                                                                 |
|                                                                                                                                    |
| - Find stationary points                                                                                                           |
|                                                                                                                                    |
|   a.  $f(x) = x^{2} - 2x - 3$                                                                                                      |
|                                                                                                                                    |
|   b.  $f(x) = 2x^{3} + 3x^{2} - 36x + 9$                                                                                           |
+------------------------------------------------------------------------------------------------------------------------------------+

- A **stationary point** can be a **maximum**/**minimum** turning point,
  or a point of **inflection**.

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Types of stationary points**                                                                                                                                                                                                                                                                                                                                                           |
+:============================================================================================================================:+:============================================================================================================================:+:============================================================================================================================:+
| **Maximum**                                                                                                                  | **Minimum**                                                                                                                  | **Stationary inflection**                                                                                                    |
+------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+
| ![A graph of a person Description automatically generated with medium                                                        | ![A graph of a person Description automatically generated with medium                                                        | ![A graph of a person Description automatically generated with medium                                                        |
| confidence](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image26.png){width="1.5in" | confidence](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image26.png){width="1.5in" | confidence](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image26.png){width="3.1in" |
| height="1.1444444444444444in"}                                                                                               | height="1.1444444444444444in"}                                                                                               | height="1.461111111111111in"}\\                                                                                              |
+------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+
| $f'(x)$ changes from positive to negative                                                                                    | $f'(x)$ changes from negative to positive                                                                                    | $f'(x)$ doesn't change sign                                                                                                  |
+------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** a slope table.                                                                                                                                                                                             |
+=====================================+======================================+===============================================================================================================================================+
| A **slope table** finds the derivative immediately to the left and right of a stationary point.\                                                                                                                           |
| This helps us classify the stationary point.\                                                                                                                                                                              |
| For each function, the stationary point and derivative is given.\                                                                                                                                                          |
| Classify the turning point and check using the provided sketch.                                                                                                                                                            |
+-------------------------------------+--------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+
| $$f(x) = x^{2} + 2x$$               | $$f(x) = x^{3} - 9x^{2} + 27x - 28$$ | $$f(x) = x^{3} + \ 3x^{2} - \ 4$$                                                                                                             |
|                                     |                                      |                                                                                                                                               |
| $$f'(x) = 2x + 2$$                  | $f'(x) = 3x^{2} - 18x + 27$          | $$f'(x) = 3x^{2} + 6x$$                                                                                                                       |
|                                     |                                      |                                                                                                                                               |
|   --------------------------------- |   -----------------------------      |   ---------------------------------                                                                                                           |
|   $$x$$              $$- 1$$        |   $$x$$               3              |   $$x$$              $$- 2$$                                                                                                                  |
|   ----------- ----- --------- ----- |   ----------- ----- ----- -----      |   ----------- ----- --------- -----                                                                                                           |
|   $$f'(x)$$             0           |   $$f'(x)$$           0              |   $$f'(x)$$             0                                                                                                                     |
|                                     |                                      |                                                                                                                                               |
|   Slope                             |   Slope                              |   Slope                                                                                                                                       |
|   --------------------------------- |   -----------------------------      |   ---------------------------------                                                                                                           |
|                                     |                                      |                                                                                                                                               |
| Classify point at $x = - 1$:        | Classify point at $x = 3$:           | Classify point at $x = - 2$:                                                                                                                  |
|                                     |                                      |                                                                                                                                               |
| - Max                               | - Max                                | - Max                                                                                                                                         |
|                                     |                                      |                                                                                                                                               |
| - Min                               | - Min                                | - Min                                                                                                                                         |
|                                     |                                      |                                                                                                                                               |
| - Inflection                        | - Inflection                         | - ![A graph of a function AI-generated content may be                                                                                         |
|                                     |                                      |   incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image27.png){width="1.975in"              |
|                                     |                                      |   height="1.9673611111111111in"}![A graph of a function AI-generated content may be                                                           |
|                                     |                                      |   incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image28.png){width="1.9819444444444445in" |
|                                     |                                      |   height="1.9680555555555554in"}![A graph of a function AI-generated content may be                                                           |
|                                     |                                      |   incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image29.png){width="1.975in"              |
|                                     |                                      |   height="1.9680555555555554in"}Inflection                                                                                                    |
+-------------------------------------+--------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Classifying Stationary Points using a Slope Table**           |
+===================================================================+
| To find and classify stationary points of $f(x):$                 |
|                                                                   |
| 1.  Find the derivative $f'(x)$.                                  |
|                                                                   |
| 2.  Find the $x$-coordinate of stationary points using            |
|     $f'(x) = 0$.                                                  |
|                                                                   |
| 3.  Draw a slope table to classify the turning points.            |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find and classify points of inflection using a slope table.                                                          |
+====================================================================================================================================+
| Find the stationary points of $f(x) = 2x^{3} - 15x^{2} + 24x - 7$ and determine their nature.\                                     |
| A sketch is provided for you to check your answer.                                                                                 |
|                                                                                                                                    |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image30.png){width="1.983830927384077in" |
| height="1.968503937007874in"}1. Differentiate                                                                                      |
|                                                                                                                                    |
| $f'(x) = 6x^{2} - 30x + 24$                                                                                                        |
|                                                                                                                                    |
| 2\. Solve $f'(x) = 0$                                                                                                              |
|                                                                                                                                    |
| $6x^{2} - 30x + 24 = 0$                                                                                                            |
|                                                                                                                                    |
| $x^{2} - 5x + 4 = 0$                                                                                                               |
|                                                                                                                                    |
| $(x - 1)(x - 4) = 0$                                                                                                               |
|                                                                                                                                    |
| $x = 1,\ 4$                                                                                                                        |
|                                                                                                                                    |
| 3\. Slope table and classify                                                                                                       |
|                                                                                                                                    |
|   ---------------------------------------------------------------------------------                                                |
|   $$x$$          0            1                2                 4             5                                                   |
|   ----------- ------- ----------------- ---------------- ------------------ -------                                                |
|   $$f'(x)$$     24            0             $$- 12$$             0            24                                                   |
|                                                                                                                                    |
|   Slope        $$/$$   $$\overline{}$$   $$\backslash$$   $$\underline{}$$   $$/$$                                                 |
|   ---------------------------------------------------------------------------------                                                |
|                                                                                                                                    |
| Maximum at $(1,4)$                                                                                                                 |
|                                                                                                                                    |
| Minimum at $(4, - 23)$                                                                                                             |
+------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                     |
+====================================================================================================================================+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image31.png){width="1.983830927384077in" |
| height="1.968503937007874in"}Find the stationary points of $y = - x^{3} + 6x^{2} - 9x + 4$ and determine their nature.\            |
| A sketch is provided for you to check your answer.                                                                                 |
|                                                                                                                                    |
| Minimum at $(1,0)$, maximum (3,4)                                                                                                  |
+------------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  For these quadratics, find the derivative of each function and
    complete the given table to determine the nature of the given
    stationary point.

+---------------------------------------------+-------------------------------------------+
| a.  $f(x) = x^{2} - 4x + 3$                 | b.  $f(x) = 12 + 4x - x^{2}$              |
|                                             |                                           |
|   -----------------------------------       |   -----------------------------------     |
|   $$x$$        $$1$$   $$2$$   $$3$$        |   $$x$$        $$1$$   $$2$$   $$3$$      |
|   ----------- ------- ------- -------       |   ----------- ------- ------- -------     |
|   $$f'(x)$$                                 |   $$f'(x)$$                               |
|                                             |                                           |
|   Slope                                     |   Slope                                   |
|   -----------------------------------       |   -----------------------------------     |
|                                             |                                           |
| Min at $x = 2$                              | Max at $x = 2$                            |
+=============================================+===========================================+
| c.  $f(x) = x^{2} + 6x + 8$                 | d.  $f(x) = 15 - 2x - x^{2}$              |
|                                             |                                           |
|   ----------------------------------------- |   --------------------------------------- |
|   $$x$$        $$- 4$$   $$- 3$$   $$- 2$$  |   $$x$$        $$- 2$$   $$- 1$$   $$0$$  |
|   ----------- --------- --------- --------- |   ----------- --------- --------- ------- |
|   $$f'(x)$$                                 |   $$f'(x)$$                               |
|                                             |                                           |
|   Slope                                     |   Slope                                   |
|   ----------------------------------------- |   --------------------------------------- |
|                                             |                                           |
| Min at $x = - 3$                            | Max at $x = - 1$                          |
+---------------------------------------------+-------------------------------------------+

2.  Find the stationary points of each function then find the missing
    turning points on each graph.

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $y\  = \ 2x^{3} + \ 3x^{2} - \ 36x\  + \ 15$                                                                                                                  | b.  $y\  = \ x^{3} + \ 4x^{2} + \ 4x$                                                                                                                 |
|                                                                                                                                                                   |                                                                                                                                                       |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image32.png){width="1.4090277777777778in"                               | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image33.png){width="1.4006944444444445in"                   |
| height="1.3909722222222223in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image32.png){width="1.4090277777777778in" | height="1.4375in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image33.png){width="1.4008770778652668in" |
| height="1.3909722222222223in"}                                                                                                                                    | height="1.4375in"}                                                                                                                                    |
+===================================================================================================================================================================+=======================================================================================================================================================+
| c.  $y\  = \ 16\  + \ 4x^{3} - \ x^{4}$                                                                                                                           | d.  $y\  = \ 3x^{4} - \ 16x^{3} + \ 24x^{2} + \ 11$                                                                                                   |
|                                                                                                                                                                   |                                                                                                                                                       |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image32.png){width="1.4090277777777778in"                               | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image33.png){width="1.4008770778652668in"                   |
| height="1.3909722222222223in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image32.png){width="1.4091983814523183in" | height="1.4375in"}                                                                                                                                    |
| height="1.391509186351706in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image33.png){width="1.4008770778652668in"  |                                                                                                                                                       |
| height="1.4375in"}                                                                                                                                                |                                                                                                                                                       |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------+

Development

3.  The curve $y\  = \ x³\  - \ 6x²\  + \ 5$ has 2 turning points.\
    Find them and use the derivative to determine their nature.

$$\frac{dy}{dx} = \ 3x^{2} - \ 12x\  = \ 3x(x\  - \ 4)$$

$$3x(x\  - \ 4) = \ 0,\ so\ stationary\ points\ at\ x\  = \ 0\ or\ x\  = \ 4$$

When $x\  = \ 0:\ y\  = \ 5$

When $x\  = \ 4:\ y\  = \  - 27$

  -----------------------------------------------------------------------------
  $$x$$               $$- 1$$    $$0$$   $$1$$     $$3$$     $$4$$   $$5$$
  ------------------- ---------- ------- --------- --------- ------- ----------
  $$\frac{dy}{dx}$$   $$+ 15$$   $$0$$   $$- 9$$   $$- 9$$   $$0$$   $$+ 15$$

  -----------------------------------------------------------------------------

(0, 5) maximum, (4, -27) minimum

4.  Find the turning points on the curve y = x³ - 3x² + 5 and determine
    their nature.

$$\frac{dy}{dx} = \ 3x^{2} - \ 6x\  = \ 3x(x\  - \ 2)$$

stationary points: $x\  = \ 0\ or\ x\  = \ 2$

When $x\  = \ 0:\ y\  = \ 5$

When $x\  = \ 2:\ y\  = \ 1$

  -----------------------------------------------------------------
  $$x$$               $$- 1$$   $$0$$   $$1$$     $$2$$   $$3$$
  ------------------- --------- ------- --------- ------- ---------
  $$\frac{dy}{dx}$$   $$+ 9$$   $$0$$   $$- 3$$   $$0$$   $$+ 9$$

  -----------------------------------------------------------------

(0, 5) maximum, (2, 1) minimum

5.  Find any stationary points on the curve
    $f(x)\  = \ x⁴\  - \ 2x²\  - \ 3$.\
    What type of stationary points are they?

$$f'(x)\  = \ 4x³\  - \ 4x\  = \ 4x(x²\  - \ 1)\  = \ 4x(x\  - \ 1)(x\  + \ 1)$$

Stationary points: $x\  = \ 1,\ x\  = \  - 1$

When x = 0: f(0) = -3 When x = 1: f(1) = 1 - 2 - 3 = -4

When x = -1: f(-1) = 1 - 2 - 3 = -4

  -----------------------------------------------------------------------------------
  $$x$$       $$- 2$$    $$- 1$$   $$- 0.5$$   $$0$$   $$0.5$$     $$1$$   $$2$$
  ----------- ---------- --------- ----------- ------- ----------- ------- ----------
  $$f'(x)$$   $$- 24$$   $$0$$     $$+ 1.5$$   $$0$$   $$- 1.5$$   $$0$$   $$+ 24$$

  -----------------------------------------------------------------------------------

(0, -3) maximum, (1, -4) minimum, (-1, -4) minimum

6.  The curve $y\  = \ x³\  - \ 3x\  + \ 2$ has 2 stationary points.\
    Find their coordinates and determine their type.

$$\frac{dy}{dx} = \ 3x^{2} - \ 3\  = \ 3\left( x^{2} - \ 1 \right) = \ 3(x\  - \ 1)(x\  + \ 1)$$

stationary points: $x\  = \ 1\ or\ x\  = \  - 1$

When x = 1: y = 0

When x = -1: y = 4

  -------------------------------------------------------------------
  $$x$$               $$- 2$$   $$- 1$$   $$0$$     $$1$$   $$2$$
  ------------------- --------- --------- --------- ------- ---------
  $$\frac{dy}{dx}$$   $$+ 9$$   $$0$$     $$- 3$$   $$0$$   $$+ 9$$

  -------------------------------------------------------------------

(1, 0) minimum, (-1, 4) maximum

7.  a.  Differentiate $P\  = \ 2x\  +$ $\frac{50}{x}$ with respect to
        $x$.

$$\frac{dP}{dx} = \ 2\  - \frac{50}{x^{2}} = \ 2\  - \ 50x^{- 2}$$

b.  Find any stationary points on the curve and determine their nature.

$$2\  - \frac{50}{x^{2}} = \ 0$$

$$2x^{2} = \ 50\ x^{2} = \ 25\ x\  = \  \pm 5$$

When $x\  = \ 5:\ P = 20$

When $x\  = \  - 5:\ P\  = \  - 20$

  -----------------------------------------------------------------------------------------
  $$x$$               $$- 6$$   $$- 5$$   $$- 4$$          $4$              $5$     $6$
  ------------------- --------- --------- ---------------- ---------------- ------- -------
  $$\frac{dP}{dx}$$   $$/$$     $$-$$     $$\backslash$$   $$\backslash$$   $$-$$   $$/$$

  -----------------------------------------------------------------------------------------

(-5, -20) maximum, (5, 20) minimum

Note that this curve has a discontinuity at $x = 0$

8.  a.  Differentiate $A\  = \ x\sqrt{3600\  - \ x^{2}}.$

$$A\  = \ x\left( 3600\  - \ x^{2} \right)^{\frac{1}{2}}$$

$$\frac{dA}{dx} = \ \left( 3600\  - \ x^{2} \right)^{\frac{1}{2}}\  + \ x\left( \frac{1}{2} \right)\left( 3600\  - \ x^{2} \right)^{\left( - \frac{1}{2} \right)}( - 2x)\ $$

$$= \frac{3600\  - \ x^{2} - \ x^{2}}{\sqrt{3600\  - \ x^{2}}}$$

$$= \frac{3600\  - \ 2x^{2}}{\sqrt{3600\  - \ x^{2}}}$$

b.  Find any stationary points on $A\  = \ x\sqrt{3600\  - \ x^{2}}$ (to
    1 decimal place) and determine their nature.

$$3600\  - \ 2x²\  = \ 0\ x²\  = \ 1800\ x\  = \  \pm 42.4\ (1\ d.p.)$$

When x = 42.4: A = 42.4√(3600 - 1800) = 1800

When x = -42.4: A = -42.4√(3600 - 1800) = -1800

  --------------------------------------------------------------------------------
  $$x$$               $$- 50$$     $$- 42.4$$   $$0$$      $$42.4$$   $$50$$
  ------------------- ------------ ------------ ---------- ---------- ------------
  $$\frac{dA}{dx}$$   $$- 8.37$$   $$0$$        $$+ 60$$   $$0$$      $$- 8.37$$

  --------------------------------------------------------------------------------

(42.4, 1800) maximum, (-42.4, -1800) minimum

# Sketching Cubic Curves using Calculus

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                                                                                      |
+===================================================================================================================================================================================+
| - Sketch cubics in factored form, showing intercepts.                                                                                                                             |
|                                                                                                                                                                                   |
| +---------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+ |
| | a.  $y = (x + 2)(x - 1)(x - 3)$ | b.  $y = x(x - 2)(x + 3)^{2}$                                                                                                               | |
| |                                 |                                                                                                                                             | |
| |                                 | ![A graph of a function AI-generated content may be                                                                                         | |
| |                                 | incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image34.png){width="2.0153313648293962in" | |
| |                                 | height="1.968503937007874in"}                                                                                                               | |
| |                                 |                                                                                                                                             | |
| |                                 | ![A cross with arrows and a cross AI-generated content may be                                                                               | |
| |                                 | incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image34.png){width="2.0153313648293962in" | |
| |                                 | height="1.968503937007874in"}                                                                                                               | |
| +=================================+=============================================================================================================================================+ |
|                                                                                                                                                                                   |
| - Find stationary points of a function using calculus and classify them using a slope table.                                                                                      |
|                                                                                                                                                                                   |
| +--------------------------+------------------------------+------------------------------+                                                                                        |
| | a.  $y = 3 + 6x - x^{2}$ | b.  $y = x^{3} - 3x^{2} + 5$ | c.  $y = (x - 1)^{2}(x + 2)$ |                                                                                        |
| +==========================+==============================+==============================+                                                                                        |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Sketching cubic curves using calculus**                       |
+===================================================================+
| 1.  Sketch cubic from factored form.                              |
|                                                                   |
|     a.  Identify $x$-intercepts from factors.                     |
|                                                                   |
|     b.  Determine behaviour as $x \rightarrow \infty$ using       |
|         leading term.                                             |
|                                                                   |
|     c.  Determine $y$-intercept using constant term.              |
|                                                                   |
| 2.  Find the derivative $f'(x)$.                                  |
|                                                                   |
| 3.  Find the $x$-coordinate of stationary points using            |
|     $f'(x) = 0$.                                                  |
|                                                                   |
| 4.  Draw a **slope** **table** to classify the turning points.    |
|                                                                   |
| 5.  Find $y$-coordinates of the turning points.                   |
|                                                                   |
| 6.  Complete sketch by adding stationary points.                  |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Sketch cubics using calculus.                                                                                                 |
+=============================================================================================================================================+
| ![A graph of a function AI-generated content may be                                                                                         |
| incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image35.png){width="2.2103805774278213in" |
| height="2.1653543307086616in"}Sketch $f(x) = (x - 4)(x - 1)^{2},\$showing the turning points.                                               |
|                                                                                                                                             |
| $1.\ f'(x) = (x - 1)^{2} + (x - 4)(2)(x - 1)$ 0.                                                                                            |
|                                                                                                                                             |
| $= x^{2} - 2x + 1 + x^{2} - 10x - 10$                                                                                                       |
|                                                                                                                                             |
| $= 3x^{2} - 12x + 9$                                                                                                                        |
|                                                                                                                                             |
| 2\. Let $f'(x) = 0:$ $\ \ 3x^{2} - 12x + 9 = 0$                                                                                             |
|                                                                                                                                             |
| $x^{2} - 4x + 3 = 0$                                                                                                                        |
|                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ (x - 3)(x - 1) = 0$$                                                        |
|                                                                                                                                             |
| $\therefore$ Stationary points at $x = 1,\ x = 3$                                                                                           |
|                                                                                                                                             |
| 3\.                                                                                                                                         |
|                                                                                                                                             |
|   ---------------------------------------------------------------------------------                                                         |
|   $$x$$          0            1                2                 3             4                                                            |
|   ----------- ------- ----------------- ---------------- ------------------ -------                                                         |
|   $$f'(x)$$      9            0             $$- 3$$              0             9                                                            |
|                                                                                                                                             |
|   Slope        $$/$$   $$\overline{}$$   $$\backslash$$   $$\underline{}$$   $$/$$                                                          |
|   ---------------------------------------------------------------------------------                                                         |
|                                                                                                                                             |
| $\therefore$ max turning point at $x = 1$                                                                                                   |
|                                                                                                                                             |
| $\therefore$ min turning point at $x = 3$                                                                                                   |
|                                                                                                                                             |
| ![A graph of a function AI-generated content may be                                                                                         |
| incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image36.png){width="2.2082928696412947in" |
| height="2.1653543307086616in"}                                                                                                              |
|                                                                                                                                             |
| 4\. Max at $(1,0),\$Min at $(3, - 4)$ 5.                                                                                                    |
+---------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                                                                                                                                                                            |
+=============================================================================================================================================+=============================================================================================================================================+
| Find the stationary points of these functions, determine their nature, then sketch the curve.\                                                                                                                                                                                            |
| Check your answer using DESMOS.                                                                                                                                                                                                                                                           |
+---------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $y = (x - 1)^{2}(x + 2)$                                                                                                                | b.  $y = (x - 3)(x + 2)(x - 6)$                                                                                                             |
|                                                                                                                                             |                                                                                                                                             |
| 0\. Sketch (below)                                                                                                                          | ![A graph of a function AI-generated content may be                                                                                         |
|                                                                                                                                             | incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image38.png){width="2.404547244094488in"  |
| 1\. $f'(x)$                                                                                                                                 | height="2.3645833333333335in"}![A graph of a function AI-generated content may be                                                           |
|                                                                                                                                             | incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image34.png){width="2.4208333333333334in" |
| 2\. $f'(x) = 0$                                                                                                                             | height="2.3645833333333335in"}                                                                                                              |
|                                                                                                                                             |                                                                                                                                             |
| 3\.                                                                                                                                         |                                                                                                                                             |
|                                                                                                                                             |                                                                                                                                             |
|   -----------------------------------------                                                                                                 |                                                                                                                                             |
|   $$x$$                                                                                                                                     |                                                                                                                                             |
|   ----------- ----- ----- ----- ----- -----                                                                                                 |                                                                                                                                             |
|   $$f'(x)$$                                                                                                                                 |                                                                                                                                             |
|                                                                                                                                             |                                                                                                                                             |
|   Slope                                                                                                                                     |                                                                                                                                             |
|   -----------------------------------------                                                                                                 |                                                                                                                                             |
|                                                                                                                                             |                                                                                                                                             |
| 4\. Points                                                                                                                                  |                                                                                                                                             |
|                                                                                                                                             |                                                                                                                                             |
| ![A graph of a function AI-generated content may be                                                                                         |                                                                                                                                             |
| incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image37.png){width="2.4131944444444446in" |                                                                                                                                             |
| height="2.3618055555555557in"}5. Complete sketch                                                                                            |                                                                                                                                             |
|                                                                                                                                             |                                                                                                                                             |
| ![A graph of a function AI-generated content may be                                                                                         |                                                                                                                                             |
| incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image34.png){width="2.4208333333333334in" |                                                                                                                                             |
| height="2.3645833333333335in"}                                                                                                              |                                                                                                                                             |
+---------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+
| c.  ![A graph of a function AI-generated content may be incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image39.png){width="2.417361111111111in" height="2.3645833333333335in"}![A graph of a function AI-generated content may be      |
|     incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image34.png){width="2.4208333333333334in" height="2.3645833333333335in"} $y = - 2(x - 3)^{3}$                                                                                       |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  $f(x) = x^{2} - 4x + 3$

    a.  Find the derivative of the function.

$$f'(x) = 2x - 4$$

b.  Find the coordinates of the stationary point.

$2x - 4 = 0$; $x = 2$

$$f(2) = 4 - 4(2) + 3 = - 1$$

$$\therefore(2, - 1)$$

c.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image40.png){width="2.0720002187226596in"
    height="2.016000656167979in"}Use the given table to determine the
    nature of the stationary point.

  -----------------------------
  $$x$$       1       2     3
  ----------- ----- ----- -----
  $$f'(x)$$               

  Slope                   
  -----------------------------

$\therefore$ Min at $(2, - 1)$

d.  Sketch the graph.

e.  Check your answer by completing the square for
    $f(x) = x^{2} - 4x + 3$.

By completing the square, this is

$$f(x) = x^{2} - 4x + 4 - 4 + 3$$

$$= (x - 2)^{2} - 1$$

Which is a parabola with minimum at $(2, - 1)$

2.  a.  Show that the derivative of $f(x) = x^{3} - 3x^{2}$ is
        $f'(x) = 3x(x - 2)$.

$$f'(x) = 3x^{2} - 6x = 3x(x - 2)$$

b.  Find the $x$-values of the turning points.

$$x = 0\ or\ 2$$

c.  Using a slope table, determine the nature of the turning points.

  -----------------------------------------
  $$x$$               0           2   
  ----------- ----- ----- ----- ----- -----
  $$f'(x)$$                           

  Slope                               
  -----------------------------------------

Max at $x = 0$, Min at $x = 2$

d.  Find the coordinates of the stationary points.

$$(0,0),\ (2, - 4)$$

e.  ![A graph of a function AI-generated content may be
    incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image41.png){width="2.0166666666666666in"
    height="2.0236111111111112in"}![A graph of a function AI-generated
    content may be
    incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image34.png){width="2.071527777777778in"
    height="2.0236111111111112in"}Sketch the graph of $y = f(x)$, by
    factorising it first.\
    Show all important features.

Development

3.  a.  Show that the derivative of $y = 12x - x^{3}$ is
        $y' = 3(2 - x)(2 + x)$.

$$y' = 12 - 3x^{2} = 3\left( 4 - x^{2} \right)$$

$$= 3(2 - x)(2 + x)$$

b.  Use a table of values to find the nature of the turning points.![A
    graph of a function AI-generated content may be
    incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image34.png){width="2.015277777777778in"
    height="1.9680555555555554in"}![A graph of function with numbers and
    lines AI-generated content may be
    incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image42.png){width="1.958144138232721in"
    height="1.968503937007874in"}

  -----------------------------------------
  $$x$$                               
  ----------- ----- ----- ----- ----- -----
  $$f'(x)$$                           

  Slope                               
  -----------------------------------------

Max at $(2,16)$ Min at $( - 2, - 16)$

c.  Sketch the graph of $y = 12x - x^{3}$

<!-- -->

4.  Sketch these cubic curves, showing all intercepts and turning
    points.

+---------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $y = x^{2}(x - 3)$                                                                                                                      | b.  $y = x(x + 2)^{2}$                                                                                                                      |
|                                                                                                                                             |                                                                                                                                             |
| ![A graph of a function AI-generated content may be                                                                                         | ![A graph of a function AI-generated content may be                                                                                         |
| incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image43.png){width="2.408856080489939in"  | incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image44.png){width="2.408333333333333in"  |
| height="2.3622047244094486in"}                                                                                                              | height="2.359722222222222in"}                                                                                                               |
+=============================================================================================================================================+=============================================================================================================================================+
| c.  $y = (x - 1)^{2}(x - 4)$                                                                                                                | d.  $y = (2x - 1)(x - 2)^{2}$                                                                                                               |
|                                                                                                                                             |                                                                                                                                             |
| ![A graph of a function AI-generated content may be                                                                                         | ![A graph of a function AI-generated content may be                                                                                         |
| incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image45.png){width="2.408333333333333in"  | incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image46.png){width="2.408333333333333in"  |
| height="2.359722222222222in"}                                                                                                               | height="2.359027777777778in"}                                                                                                               |
+---------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+
| e.  $y = (x - 1)^{2}(x - 4)$                                                                                                                | f.  $y = (3x + 1)^{3} + 1$                                                                                                                  |
|                                                                                                                                             |                                                                                                                                             |
| ![A graph of a function AI-generated content may be                                                                                         | ![A graph of a function AI-generated content may be                                                                                         |
| incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image47.png){width="2.408333333333333in"  | incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image48.png){width="2.407638888888889in"  |
| height="2.359027777777778in"}                                                                                                               | height="2.359027777777778in"}                                                                                                               |
+---------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+
| g.  $y = (x - 5)^{2}(2x + 1)$                                                                                                               | h.  $y = (2x - 1)^{2}(x - 2)$                                                                                                               |
|                                                                                                                                             |                                                                                                                                             |
| ![A graph of a function AI-generated content may be                                                                                         | ![A graph of a function AI-generated content may be                                                                                         |
| incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image49.png){width="2.3715277777777777in" | incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image50.png){width="2.3715277777777777in" |
| height="2.359027777777778in"}                                                                                                               | height="2.3229166666666665in"}                                                                                                              |
+---------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+
| i.  $y = (x - 1)(x + 2)(x - 3)$                                                                                                             | j.  $y = - x(x + 1)(x - 2)$                                                                                                                 |
|                                                                                                                                             |                                                                                                                                             |
| ![A graph of a function AI-generated content may be                                                                                         | ![A graph of a function AI-generated content may be                                                                                         |
| incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image51.png){width="2.3715277777777777in" | incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image52.png){width="2.370833333333333in"  |
| height="2.3229166666666665in"}                                                                                                              | height="2.3229166666666665in"}                                                                                                              |
+---------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+

Mastery

5.  The tangent to $y = x^{2} + ax - 15\$is horizontal at the point
    $x = 4$.

Find the value of $a$

$$y' = 2x + a$$

$$y'(4) = 8 + a = 0$$

$$a\  = \  - 8$$

6.  The curve $y = x^{2} + ax + 7$ has a turning point at $x = - 1$.\
    Find the value of $a$.

$$y' = 2x + a$$

$$y'( - 1) = - 2 + a = 0$$

$$\ a\  = \ 2$$

7.  The curve $f(x) = ax^{2} + 4x + c$ has a turning point at
    $( - 1,1)$. Find $a$ and $c$.

$$f'(x) = 2ax + 4$$

$$f( - 1) = a - 4 + c = 1$$

$$f'( - 1) = - 2a + 4 = 0$$

$$\ a\  = \ 2,\ c\  = \ 3$$

8.  Find $b$ and $c$ if $y = x^{3} + bx^{2} + cx + 5$ has stationary
    points at $x = - 2$ and $x = 4$.

$$f'(x) = 3x^{2} + 2bx + c$$

$$f'( - 2) = 12 - 4b + c = 0$$

$$f'(4) = 24 + 8bx + c = 0$$

Solving simultaneously,

$$\ b\  = \  - 3\ c\  = \  - 2$$

9.  The curve $y = ax^{2} + bx + c$ passes through the points $(1,4)$
    and $( - 1,6)$. There is a maximum turning point at $x = - 0.5$.

    a.  Show that $a + b + c = 4,\ a - b + c = 6,\$and $- a + b = 0$

$$y(1) = a + b + c = 1$$

$$y( - 1) = a - b + c = 6$$

$$y' = 2ax + b$$

$$y'( - 0.5) = - a + b = 0$$

b.  Find the values of $a,\ b,\ c$.

$$a\  = \ b\  = \  - 1,\ c\  = \ 6$$

10. The line $y = 2x$ is tangent to the curve $y = ax^{2} + bx + c$ at
    the origin, and there is a maximum turning point at $x = 1$.

    a.  Explain why $c = 0.$

The curve passes through the origin, so y-intercept is 0.

b.  Explain why $b = 2$.

$$y' = 2ax + b$$

$$y'(0) = b = 2$$

c.  Show that $2a + b = 0$ and hence find the value of $a$.

$$y'(1) = 2a + b = 0$$

$$a = - 1$$

11. The function $y = 2x^{3} + bx^{2} + cx + d$ has $y$-intercept at
    $(0,7)$, a maximum turning point at\
    $x = - 2$ and a minimum turning point at $x = 1$. Find the values of
    $b,c,d.$

$$d = 7$$

$$y' = 6x^{2} + 2bx + c$$

$$y'( - 2) = 24 - 4b + c = 0$$

$$\therefore - 4b + c = - 24$$

$$y'(1) = 6 + 2b + c = 0$$

$$\therefore 2b + c = - 6$$

Solving simultaneously,

$$b = 3,\ c = - 12$$

12. Sketch $y = 6x^{3} + x^{2} - 35x$, showing all intercepts and
    turning points.\
    Give turning points as decimals to 3 d.p.

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image53.png){width="2.411324365704287in"
height="2.3622047244094486in"}

13. a.  Use the product rule to show that if $y\  = \ x(x\  - \ 2)^{3},$
        then $y'\  = \ 2(2x\  - \ 1)(x\  - \ 2)^{2}.$

    b.  Find any stationary points and use a table of gradients to
        classify them.

    c.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image54.png){width="2.084944225721785in"
        height="1.8807010061242344in"}Sketch the graph of the function,
        indicating all important features.

14. a.  Use the product rule to show that if
        $y\  = \ x^{2}(x\  - \ 4)^{2}$, then $\frac{dy}{dx}$
        $= \ 4x(x\  - \ 4)(x\  - \ 2).$

    b.  Find any stationary points and use a table of gradients to
        classify them.

    c.  Sketch the graph of the function, indicating all important
        features.

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image54.png){width="2.084944225721785in"
height="1.8807010061242344in"}

15. a.  Use the product rule to show that if
        $y\  = \ (x\  - \ 5)^{2}(2x\  + \ 1),\$then
        $y'\  = \ 2(x\  - \ 5)(3x\  - \ 4).$

    b.  Find any stationary points and use a table of gradients to
        classify them.

    c.  Sketch the graph of the function, indicating all important
        features.

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image54.png){width="2.084944225721785in"
height="1.8807010061242344in"}

# The Second Derivative

+-----------------------------------------------------------------------+
| - **The Second Derivative**                                           |
+=======================================================================+
| The **second derivative** is the derivative of the derivative. There  |
| are many notations:                                                   |
|                                                                       |
| $$f^{''}(x) = f^{(2)}(x) = y^{''} = y^{(2)} = \frac{d^{2}y}{dx^{2}}$$ |
+-----------------------------------------------------------------------+

Foundation

1.  Find the first and second derivative.

+--------------------------------------+--------------------------------------------+--------------------------------------------+
| a.  $y\  = \ 4\  - \ 3x$             | b.  $y\  = \ 4x³\  - \ x²$                 | c.  $y\  = \ x(x\  + \ 3)$                 |
|                                      |                                            |                                            |
| $$- 3$$                              | $$12x²\  - \ 2x$$                          | $$2x\  + \ 3\ $$                           |
|                                      |                                            |                                            |
| $$0$$                                | $$24x\  - \ 2$$                            | $$2$$                                      |
+======================================+============================================+============================================+
| d.  $y\  = \ (x\  - \ 2)(x\  + \ 1)$ | e.  $\ y\  = \ 3x²(2x³\  - \ 3x²)$         | f.  $y\  =$ $\frac{1}{x^{3}}$              |
|                                      |                                            |                                            |
| $$2x\  - \ 1$$                       | $$30x^{4} - \ 36x^{3}$$                    | $$- \frac{3}{x^{4}}$$                      |
|                                      |                                            |                                            |
| $$2$$                                | $$120x³\  - \ 108x²$$                      | $$\frac{12}{x^{5}}$$                       |
+--------------------------------------+--------------------------------------------+--------------------------------------------+
| g.  $y\  =$ $\frac{3}{x^{2}}$        | h.  $\ y\  = \ (x\  + \ 1)²$               | i.  $y\  = \ (1\  - \ 4x)²$                |
|                                      |                                            |                                            |
| $$\  - \frac{6}{x^{3}}$$             | $$2(x\  + \ 1)$$                           | $$8(4x\  - \ 1)$$                          |
|                                      |                                            |                                            |
| $$\frac{18}{x^{4}}$$                 | $$2$$                                      | $$32$$                                     |
+--------------------------------------+--------------------------------------------+--------------------------------------------+
| j.  $y\  =$ $\frac{1}{x\  + \ 2}$    | k.  $\ y\  =$ $\frac{1}{(5x\  + \ 4)^{3}}$ | l.  $y\  = \ \sqrt{x}$                     |
|                                      |                                            |                                            |
| $$- \frac{1}{(x\  + \ 2)^{2}}$$      | $$- \frac{15}{(5x\  + \ 4)^{4}}$$          | $$\frac{1}{2\sqrt{x}},$$                   |
|                                      |                                            |                                            |
| $$\frac{2}{(x\  + \ 2)^{3}}$$        | $$\frac{300}{5x\  + \ 4^{5}}\ $$           | $$\  - \frac{1}{4x\sqrt{x}}$$              |
+--------------------------------------+--------------------------------------------+--------------------------------------------+
| m.  $y\  = \ x\sqrt{x}$              | n.  $\ y\  = \ \sqrt{x\  + \ 2}$           | o.  $y\  = \ \sqrt{1 - 4x}$                |
|                                      |                                            |                                            |
| $$\frac{3\sqrt{x}}{2},\ $$           | $$\frac{1}{2\sqrt{x\  + \ 2}},\ $$         | $$- \frac{2}{\sqrt{1\  - \ 4x}},\ $$       |
|                                      |                                            |                                            |
| $$\frac{3}{4\sqrt{x}}$$              | $$- \frac{1}{4(x\  + \ 2)^{\frac{3}{2}}}$$ | $$- \frac{4}{(1\  - \ 4x)^{\frac{3}{2}}}$$ |
+--------------------------------------+--------------------------------------------+--------------------------------------------+

2.  a.  Find $f'(x)$ and $f^{''}(x)$ for
        $f(x) = x^{3} + 3x^{2} + 5x - 6$.

$$f'(x)\  = \ 3x²\  + \ 6x\  + \ 5,\ $$

$$f''(x)\  = \ 6x\  + \ 6$$

b.  Hence evaluate:

+---------------+-----------------+------------------+-----------------+
| i.  $f'(0)$   | ii. $f^{''}(1)$ | iii. $f^{''}(0)$ | iv. $f^{''}(1)$ |
|               |                 |                  |                 |
| 5             | 14              | 6                | 12              |
+===============+=================+==================+=================+

3.  a.  Find $f'(x)$ and $f^{''}(x)$ for $f(x) = (2x - 3)^{4}$

$$f'(x)\  = \ 8(2x\  - \ 3)³,\ \ $$

$$f''(x)\  = \ 48(2x\  - \ 3)^{2}$$

b.  Hence evaluate:

+-------------------------------+-------------------------------+
| i.  $f'(1)$                   | ii. $f^{''}(1)$               |
|                               |                               |
| -8                            | 48                            |
+===============================+===============================+

4.  Use the quotient rule to find the first derivative of each
    function.\
    Then use the chain rule to find the second derivative.

+--------------------------------------------------------+--------------------------------------------------------------+
| a.  $y\  =$ $\frac{x}{x\  + \ 1}$                      | b.  $y\  =$ $\frac{x\  - \ 1}{2x\  + \ 5}$                   |
|                                                        |                                                              |
| $$\frac{dy}{dx} = \frac{1}{(x + 1)^{2}};$$             | $$\frac{dy}{dx} = \frac{7}{(2x\  + \ 5)^{2}};$$              |
|                                                        |                                                              |
| $$\frac{d^{2}y}{dx^{2}} = \  - \frac{2}{(x + 1)^{3}}$$ | $$\frac{d^{2}y}{dx^{2}} = \  - \frac{28}{(2x\  + \ 5)^{3}}$$ |
+========================================================+==============================================================+

5.  If $f(x)\  = \ x(x\  - \ 1)⁴$, use the product rule to find $f'(x)$
    and $f^{''}(x)$ in fully factored form.

$$f'(x) = \ (x\  - \ 1)^{3}(5x\  - \ 1)$$

$$\ f''(x)\  = \ 4(x\  - \ 1)²(5x\  - \ 2)$$

6.  Find the values of $x$ for which $y''\  = \ 0$ if:

+----------------------------------------+--------------------------------------------+
| a.  $y\  = \ x⁴\  - \ 6x²\  + \ 11$    | b.  $y\  = \ x³\  + \ x²\  - \ 5x\  + \ 7$ |
|                                        |                                            |
| $$y''\  = \ 12x²\  - \ 12\  = \ 0;\ $$ | $$y''\  = \ 6x\  + \ 2\  = \ 0;\ $$        |
|                                        |                                            |
| $$x\  = \ 1,\  - 1$$                   | $$x\  = \  - \frac{1}{3}$$                 |
+========================================+============================================+

# Concavity and Points of Inflection

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Concavity**                                                                                                                                                                                       |
+:=================================:+:=================================================================================================================================================================:+
| **Concave Up** $\mathbf{\cup}$    | **Concave Down** $\mathbf{\cap}$                                                                                                                                  |
|                                   |                                                                                                                                                                   |
| The curve bends upwards.\         | The curve bends downwards.\                                                                                                                                       |
| The slope increases as you move   | The slope decreases as you move left to right.                                                                                                                    |
| left to right.                    |                                                                                                                                                                   |
|                                   | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image55.png){width="2.1222222222222222in"                               |
|                                   | height="1.2284722222222222in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image56.png){width="2.1791043307086615in" |
|                                   | height="1.2291633858267716in"}                                                                                                                                    |
+-----------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** Concavity at a point from a graph.                                                                                                                                                                                                                                                                                                                                                              |
+====================================================================================================================================+=====================================================================================================================================+=====================================================================================================================================+
| Identify whether the graph is concave up or down at $x = a.$                                                                                                                                                                                                                                                                                                                                                   |
+------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+
| Concave down                                                                                                                       | Concave down                                                                                                                        | Concave up                                                                                                                          |
|                                                                                                                                    |                                                                                                                                     |                                                                                                                                     |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image57.png){width="2.167923228346457in" | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image58.png){width="2.2159722222222222in" | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image59.png){width="2.2020833333333334in" |
| height="2.182293307086614in"}                                                                                                      | height="2.161111111111111in"}                                                                                                       | height="2.183333333333333in"}                                                                                                       |
+------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image60.png){width="2.167923228346457in" | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image61.png){width="2.1458333333333335in" | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image62.png){width="2.1568088363954505in" |
| height="2.102884951881015in"}                                                                                                      | height="2.1458333333333335in"}                                                                                                      | height="2.1458333333333335in"}                                                                                                      |
+------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Concavity and the Second Derivative**                             |
+===================================+===================================+
| The second derivative tells us the rate of change of the gradient,    |
| and therefore the concavity.                                          |
+-----------------------------------+-----------------------------------+
| **Concave Up** $\mathbf{\cup}$    | **Concave Down** $\mathbf{\cap}$  |
|                                   |                                   |
| $$f^{''}(x) > 0$$                 | $$f^{''}(x) < 0$$                 |
+-----------------------------------+-----------------------------------+
| To find domain over which a curve has a certain concavity:            |
|                                                                       |
| 1\. Find the second derivative $f^{''}(x)$.                           |
|                                                                       |
| 2\. Find where $f^{''}(x) > 0$ for concave up, $f^{''}(x) < 0$ for    |
| concave down.                                                         |
+-----------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find domain over which a curve has a certain concavity.                                                               |
+=====================================================================================================================================+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image63.png){width="1.9837128171478564in" |
| height="1.9663495188101487in"}Find the domain over which the curve $f(x) = 2x^{3} - 7x^{2} - 5x + 4$ is concave downwards.          |
|                                                                                                                                     |
| $$f'(x) = 6x^{2} - 14x - 5$$                                                                                                        |
|                                                                                                                                     |
| $$f^{''}(x) = 12x - 14$$                                                                                                            |
|                                                                                                                                     |
| For concave downwards:                                                                                                              |
|                                                                                                                                     |
| $$f^{''}(x) < 0$$                                                                                                                   |
|                                                                                                                                     |
| $$12x - 14 < 0$$                                                                                                                    |
|                                                                                                                                     |
| $$x < \frac{7}{6}$$                                                                                                                 |
|                                                                                                                                     |
| $\therefore$ concave down for $\left( - \infty,\frac{7}{6} \right)$                                                                 |
+-------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                                                                                                                                                                                                                          |
+============================================================================================================================================+============================================================================================================================================+===============================================+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image64.png){width="1.9837117235345583in" height="1.9663495188101487in"}Find the domain over which the curve $f(x) = x^{3} - 6x^{2} + 9x$ is concave upwards.                                                                                 |
|                                                                                                                                                                                                                                                                                                                                         |
| $$(2.\infty)$$                                                                                                                                                                                                                                                                                                                          |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Points of Inflection**                                                                                                                                                                                                                                                                                                              |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| When $f^{''}(x) = 0$, it *may* be a **point of inflection**, where a curve changes between concave up and down. There are three possibilities:                                                                                                                                                                                          |
+--------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------+
| **Inflection point\**                                                                                                                      | **Horizontal inflection point**                                                                                                            | **Very flat turning point\**                  |
| (Fastest rate of change in a *neighbourhood*)                                                                                              |                                                                                                                                            | (*not* an inflection point,\                  |
|                                                                                                                                            | $f^{''}(x)$ changes sign &                                                                                                                 | called an undulation point)                   |
| $f^{''}(x)\$changes sign &                                                                                                                 |                                                                                                                                            |                                               |
|                                                                                                                                            | $f'(x) = 0$.                                                                                                                               | $f^{''}(x)$ doesn't change sign.              |
| $f'(x) \neq 0$.                                                                                                                            |                                                                                                                                            |                                               |
|                                                                                                                                            | ![A collage of a blue curved line Description automatically                                                                                |                                               |
| ![A collage of a blue curved line Description automatically                                                                                | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.7739129483814524in" |                                               |
| generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.0138888888888888in" | height="1.0011504811898513in"}                                                                                                             |                                               |
| height="0.8173611111111111in"}![A collage of a blue curved line Description automatically                                                  |                                                                                                                                            |                                               |
| generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.0604166666666666in" |                                                                                                                                            |                                               |
| height="0.8180555555555555in"}                                                                                                             |                                                                                                                                            |                                               |
+--------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------+
| To find and classify inflection points:                                                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                                                                         |
| 1\. Find the second derivative $f^{''}(x)$ and find possible inflection points.                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                         |
| 2\. Draw up a table of concavities to see if they are inflection points; sign must change.\                                                                                                                                                                                                                                             |
| Substitute inflection points into $f'(x)$ to check if it is a horizontal inflection point.\                                                                                                                                                                                                                                             |
| Remember to find the $y$ value at the inflection point.                                                                                                                                                                                                                                                                                 |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find and classify points of inflection.                                                                               |
+=====================================================================================================================================+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image66.png){width="2.0142322834645667in" |
| height="1.968503937007874in"}Find and classify point(s) of inflection on $f(x) = x^{5} - 5x^{4}$.                                   |
|                                                                                                                                     |
| 1\. $f'(x) = 5x^{4} - 20x^{3}$                                                                                                      |
|                                                                                                                                     |
| $f^{''}(x) = 20x^{3} - 60x^{2}$                                                                                                     |
|                                                                                                                                     |
| $20x^{3} - 60x^{2} = 0$                                                                                                             |
|                                                                                                                                     |
| $20x^{2}(x - 3) = 0$                                                                                                                |
|                                                                                                                                     |
| $x = 0,\ 3$ are possible inflection points                                                                                          |
|                                                                                                                                     |
| 2\.                                                                                                                                 |
|                                                                                                                                     |
|   ---------------------------------------------------------------------                                                             |
|   $$x$$         $$- 1$$        0          1           3        $$4$$                                                                |
|   ------------ ---------- ----------- ---------- ----------- ----------                                                             |
|   $$f''(x)$$    $$- 80$$       0       $$- 40$$     $$0$$     $$320$$                                                               |
|                                                                                                                                     |
|   concavity     $$\cap$$   $$\cdot$$   $$\cap$$   $$\cdot$$   $$\cup$$                                                              |
|   ---------------------------------------------------------------------                                                             |
|                                                                                                                                     |
| At $x = 0$, no point of inflection                                                                                                  |
|                                                                                                                                     |
| At $x = 3$, inflection point, $f(3) = - 165$ $\therefore$ point is $(3, - 165)$                                                     |
|                                                                                                                                     |
| $$f'(3) = - 135$$                                                                                                                   |
|                                                                                                                                     |
| $\therefore$ at $(3, - 165)$ there is an inflection point; fastest decrease in that neighbourhood.                                  |
+-------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                      |
+=====================================================================================================================================+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image67.png){width="1.9858847331583551in" |
| height="1.968503937007874in"}Find the point(s) of inflection on the curve $y = x^{3} - 6x^{2} + 5x + 9$.                            |
|                                                                                                                                     |
| 1\. Find $y''$ and possible inflection points                                                                                       |
|                                                                                                                                     |
| 2\. Test whether point(s) are inflection points and whether they are\                                                               |
| horizontal inflection point(s)                                                                                                      |
|                                                                                                                                     |
|   -------------------------------------                                                                                             |
|   $$x$$                                                                                                                             |
|   ------------ ---- ---- ---- ---- ----                                                                                             |
|   $$f''(x)$$                                                                                                                        |
|                                                                                                                                     |
|   concavity                                                                                                                         |
|   -------------------------------------                                                                                             |
|                                                                                                                                     |
| Inflection point at $(2,3)$                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------------------+
| Find any points of inflection on the curve $y = x^{4} - 5x^{3} + 6x^{2} + 4x - 7$.                                                  |
|                                                                                                                                     |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image68.png){width="1.9858847331583551in" |
| height="1.9641568241469816in"}                                                                                                      |
|                                                                                                                                     |
| $$\left( \frac{1}{2},\  - \frac{65}{16} \right):Inflection\ point$$                                                                 |
|                                                                                                                                     |
| $$(2,\ 1):Horizontal\ inflection\ point$$                                                                                           |
+-------------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  Complete the table below for the function shown.\
    At each point, state whether the first and second derivatives are
    positive, negative or zero.

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image69.png){width="3.5074628171478563in"
height="1.6811811023622047in"}

  -----------------------------------------------------------------------------------
  **Point**   **A**   **B**   **C**   **D**   **E**   **F**   **G**   **H**   **I**
  ----------- ------- ------- ------- ------- ------- ------- ------- ------- -------
  $$y'$$      0       \+      0       −       0       −       0       \+      0

  $$y''$$     \+      0       −       0       0       0       \+      0       0
  -----------------------------------------------------------------------------------

2.  Find $f''(x)$ for each function. By evaluating$\ f''(0)$, state
    whether the curve is concave up $(f''(x)\  > \ 0)$ or concave down
    $(f''(x)\  < \ 0)$ at $x\  = \ 0$.

+---------------------------------------+------------------------------------------------+
| a.  $f(x) = \ x^{3} - \ 3x^{2}$       | b.  $f(x) = \ x^{3} + \ 4x^{2} - \ 5x\  + \ 7$ |
|                                       |                                                |
| $$f'(x)\  = \ 3x²\  - \ 6x\ $$        | $$f'(x)\  = \ 3x²\  + \ 8x\  - \ 5\ $$         |
|                                       |                                                |
| $$f''(x)\  = \ 6x\  - \ 6$$           | $$f''(x)\  = \ 6x\  + \ 8\ $$                  |
|                                       |                                                |
| $$\ f''(0)\  = \  - 6\ $$             | $$f''(0)\  = \ 8\ $$                           |
|                                       |                                                |
| $$Concave\ down\ at\ x\  = \ 0$$      | $$Concave\ up\ at\ x\  = \ 0$$                 |
+=======================================+================================================+
| c.  $f(x) = \ x^{4} + \ 2x^{2} - \ 3$ | d.  $f(x) = \ 6x\  - \ 7x^{2} - \ 8x^{4}$      |
|                                       |                                                |
| $$f'(x)\  = \ 4x³\  + \ 4x\ $$        | $$f'(x)\  = \ 6\  - \ 14x\  - \ 32x³\ $$       |
|                                       |                                                |
| $$f''(x)\  = \ 12x²\  + \ 4\ $$       | $$f''(x)\  = \  - 14\  - \ 96x²\ $$            |
|                                       |                                                |
| $$f''(0)\  = \ 4\ $$                  | $$f''(0)\  = \  - 14\ $$                       |
|                                       |                                                |
| $$Concave\ up\ at\ x\  = \ 0$$        | $$Concave\ down\ at\ x\  = \ 0$$               |
+---------------------------------------+------------------------------------------------+

3.  A curve is concave up when $\frac{d^{2}y}{dx^{2}} > \ 0$ and concave
    down when $\frac{d^{2}y}{dx^{2}} < \ 0$.

    a.  Explain why $y\  = \ x^{2} - \ 3x\  + \ 7$ is concave up for all
        values of $x$.

$$\frac{dy}{dx} = \ 2x\  - \ 3$$

$$\frac{d^{2}y}{dx^{2}} = \ 2$$

Since $\frac{d^{2}y}{dx^{2}} = \ 2\  > \ 0$ for all $x$, the curve is
concave up for all values of $x$.

b.  Explain why $y\  = \  - 3x^{2} + \ 2x\  - \ 4$ is concave down for
    all values of $x$.

$$\frac{dy}{dx} = \  - 6x\  + \ 2$$

$$\frac{d^{2}y}{dx^{2}} = \  - 6$$

Since $\frac{d^{2}y}{dx^{2}} = \  - 6\  < \ 0$ for all $x$, the curve is
concave down for all values of $x$.

Development

4.  a.  Find the second derivative $\frac{d^{2}y}{dx^{2}}$ of
        $y\  = \ x^{3} - \ 3x^{2} - \ 5x\  + \ 2$.

$$\frac{dy}{dx} = \ 3x^{2} - \ 6x\  - \ 5$$

$$\frac{d^{2}y}{dx^{2}} = \ 6x\  - \ 6$$

b.  Hence find the values of $x$ for which the curve is:

+-------------------------------+-------------------------------+
| i.  concave up,               | ii. concave down.             |
|                               |                               |
| $$6x\  - \ 6\  > \ 0$$        | $$6x\  - \ 6\  < \ 0$$        |
|                               |                               |
| $$6x\  > \ 6$$                | $$6x\  < \ 6$$                |
|                               |                               |
| $$x\  > \ 1$$                 | $$x\  < \ 1$$                 |
+===============================+===============================+

5.  a.  Find the second derivative $\frac{d^{2}y}{dx^{2}}$ of
        $y\  = \ x^{3} - \ x^{2} - \ 5x\  + \ 1$.

    b.  Hence find the values of $x$ for which the curve is:

+-------------------------------+-------------------------------+
| i.  concave up,               | ii. concave down.             |
|                               |                               |
| $$6x\  - \ 2\  > \ 0$$        | $$6x\  - \ 2\  < \ 0$$        |
|                               |                               |
| $$6x\  > \ 2$$                | $$6x\  < \ 2$$                |
|                               |                               |
| $$x\  > \frac{1}{3}$$         | $$x\  < \frac{1}{3}$$         |
+===============================+===============================+

6.  A function has second derivative
    $y’’ = \ 3x³(x\  + \ 3)²(x\  - \ 2).$\
    Determine the $x$-coordinates of the points of inflection on the
    graph of the function using a table of concavities.

$$y^{''} = \ 3x^{3}(x\  + \ 3)^{2}(x\  - \ 2) = \ 0$$

$$x = 0,\  - 3,\ or\ 2$$

At x = 0:

  ------------------------
  $$x$$      −1    0   1
  --------- ----- --- ----
  $$y''$$    −48   0   48

  ------------------------

Sign changes, so $x\  = \ 0$ is a point of inflection.

At x = 2:

  -------------------------
  $$x$$      1    2    3
  --------- ---- --- ------
  $$y''$$    48   0   −162

  -------------------------

Sign changes, so $x\  = \ 2\$is a point of inflection.

At x = −3:

  ---------------------------
  $$x$$       −4    −3   −2
  --------- ------ ---- -----
  $$y''$$    −384   0    −48

  ---------------------------

No sign change, so $x\  = \  - 3\$is not a point of inflection.

7.  Find the range of values of x for which the curve
    $y\  = \ 2x^{3} - \ 3x^{2} - \ 12x\  + \ 8$ is:

$$y' = \ 6x^{2} - \ 6x\  - \ 12\  = \ 6(x\  - \ 2)(x\  + \ 1)$$

$$y'' = \ 12x\  - \ 6\  = \ 6(2x\  - \ 1)$$

+---------------------------------+---------------------------------+
| a.  increasing                  | b.  decreasing                  |
|                                 |                                 |
| $$x\  > \ 2\ or\ x\  < \  - 1$$ | $$- 1\  < \ x\  < \ 2$$         |
+=================================+=================================+
| c.  concave up                  | d.  concave down                |
|                                 |                                 |
| $$x\  > \frac{1}{2}$$           | $$x\  < \frac{1}{2}$$           |
+---------------------------------+---------------------------------+

8.  a.  If $y\  = \ x^{3} + \ 3x^{2} - \ 72x\  + \ 14$, find $y'$ and
        $y''$.

$$y' = \ 3x^{2} + \ 6x\  - \ 72$$

$$y'' = \ 6x\  + \ 6\ $$

b.  Show that the curve has a point of inflection at $( - 1,\ 88).$

$$At\ x\  = \  - 1:$$

$$y'' = \ 6( - 1) + \ 6\  = \ 0$$

At x = −1:

  -----------------------------------------------------------------------
  $$\mathbf{x}$$   $$- \mathbf{2}$$   $$- \mathbf{1}$$   $$\mathbf{0}$$
  ---------------- ------------------ ------------------ ----------------
  $$y''$$          $$- 6$$            $$0$$              $$6$$

  -----------------------------------------------------------------------

Sign changes from negative to positive, confirming point of inflection
at $x\  = \  - 1$.

$$y = ( - 1)^{3} + \ 3( - 1)^{2} - \ 72( - 1) + \ 14 = 88$$

$$Point\ of\ inflection\ at\ ( - 1,\ 88)$$

c.  Show that the gradient of the tangent at the point of inflection is
    $- 75$.

$$At\ x\  = \  - 1:$$

$$y' = \ 3( - 1)^{2} + \ 6( - 1) - \ 72\  = - 75$$

$$Gradient\ is\  - 75$$

d.  Hence find the equation of the tangent at the point of inflection.

$$Using\ y\  - \ y₁\  = \ m(x\  - \ x₁):$$

$$y\  - \ 88\  = \  - 75(x\  - \ ( - 1))$$

$$y\  - \ 88\  = \  - 75x\  - \ 75$$

$$y\  = \  - 75x\  + \ 13$$

9.  Find $a$ if the curve $y\  = \ x^{3} - \ ax^{2} + \ 3x\  - \ 4$ has
    an inflection at the point where $x\  = \ 2$.

$$y' = \ 3x^{2} - \ 2ax\  + \ 3$$

$$y'' = \ 6x\  - \ 2a$$

$$Inflection\ at\ x\  = \ 2:\ y''(2) = \ 0$$

$$6(2)\  - \ 2a\  = \ 0$$

$$12\  - \ 2a\  = \ 0$$

$$a\  = \ 6$$

Mastery

10. For what values of $a$ is $y\  = \ x^{3} + \ 2ax^{2} + \ 3x\  - \ 4$
    concave up at the point where $x\  = \  - 1$?

$$y' = \ 3x^{2} + \ 4ax\  + \ 3$$

$$y'' = \ 6x\  + \ 4a$$

$$Concave\ up\ at\ x\  = \  - 1:\ y'' > \ 0$$

$$6( - 1) + \ 4a\  > \ 0$$

$$- 6\  + \ 4a\  > \ 0$$

$$4a\  > \ 6$$

$$a\  > \frac{3}{2}$$

11. Find $a$ and $b$ if the curve $y\  = \ x⁴\  + \ ax³\  + \ bx²$ has
    an inflection at $(2,\ 0).$

$$y' = \ 4x^{3} + \ 3ax^{2} + \ 2bx$$

$$y'' = \ 12x^{2} + \ 6ax\  + \ 2b$$

$$Inflection\ at\ (2,\ 0):$$

$$y''(2)\  = \ 0:\ 12(2)²\  + \ 6a(2)\  + \ 2b\  = \ 0$$

$$48\  + \ 12a\  + \ 2b\  = \ 0$$

$$24\  + \ 6a\  + \ b\  = \ 0\ ...\ (1)$$

$$y(2)\  = \ 0:\ (2)^{4} + \ a(2)^{3} + \ b(2)^{2} = \ 0$$

$$16\  + \ 8a\  + \ 4b\  = \ 0$$

$$4\  + \ 2a\  + \ b\  = \ 0\ ...\ (2)$$

$$Subtract\ (2)\ from\ (1):$$

$$20\  + \ 4a\  = \ 0$$

$$a\  = \  - 5$$

$$Substitute\ into\ (2):$$

$$4\  + \ 2( - 5)\  + \ b\  = \ 0$$

$$b\  = \ 6$$

a.  For what values of $a$ is $y\  = \ x⁴\  + \ ax³\  - \ x^{2}$ concave
    up and increasing when $x\  = \ 1$?

$$y' = \ 4x^{3} + \ 3ax^{2} - \ 2x$$

$$y'' = \ 12x^{2} + \ 6ax\  - \ 2$$

$$At\ x\  = \ 1,\ concave\ up:\ y'' > \ 0$$

$$12(1)²\  + \ 6a(1)\  - \ 2\  > \ 0$$

$$10\  + \ 6a\  > \ 0$$

$$a\  > \  - \frac{5}{3}$$

$$At\ x\  = \ 1,\ increasing:\ y'(1) > \ 0$$

$$4(1)³\  + \ 3a(1)²\  - \ 2(1)\  > \ 0$$

$$4\  + \ 3a\  - \ 2\  > \ 0$$

$$3a\  > \  - 2$$

$$a\  > \  - \frac{2}{3}$$

$$Both\ conditions\ satisfied\ when:\ a\  > \  - \frac{2}{3}$$

12. ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image70.png){width="1.7784722222222222in"
    height="1.6215277777777777in"}The diagram to shows the graph of the
    derivative $y\  = \ f'(x)$\
    of the function $y\  = \ f(x),$ with domain $x > 0$.

    a.  State whether the graph of $y\  = \ f(x)$ is\
        increasing or decreasing throughout its domain.

Since $f'(x)\  > \ 0$ for all x \> 0, $f(x)$ is increasing throughout
its domain.

b.  State whether the graph of $y\  = \ f(x)$ is\
    concave up or concave down throughout its domain.

Since $f'(x)$ is decreasing (gradient is negative), $f''(x)\  < \ 0$, so
$f(x)$ is concave down throughout its domain.

13. A function has equation
    $y\  = \frac{x^{3}}{3} - \ 3x^{2} + \ 11x\  - \ 9$.

    a.  Show that the function has no stationary points.

$$y' = \ x^{2} - \ 6x\  + \ 11$$

For stationary points: $y' = \ 0$

$$x^{2} - \ 6x\  + \ 11\  = \ 0$$

Discriminant: $\Delta\  = \ ( - 6)^{2} - \ 4(1)(11) = - 8\  < \ 0$

No real solutions, so no stationary points.

b.  Show that there is a point of inflection.

$$y'' = \ 2x\  - \ 6$$

Setting $y'' = \ 0:$

$$2x\  - \ 6\  = \ 0$$

$$x\  = \ 3$$

At x = 3:

  ----------------------
  $$x$$     2    3   4
  --------- ---- --- ---
  $$y''$$   −2   0   2

  ----------------------

Sign changes from negative to positive, confirming a point of inflection
at x = 3.

c.  How many $x$-intercepts does the graph of the function have? Justify
    your answer.

From part **a**, since $f'(x)$ is a positive parabola that never crosses
the axis, $f'(x) > 0$.

Therefore, the graph is always increasing.

A graph that is always increasing without a domain restriction will
cross the $x$-axis once and only once.

# Classifying Stationary Points using the Second Derivative

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **The Second Derivative and Stationary Points**                                                                                                                                                                                                                                                                 |
+:=======================:+:==========================================================================================================================================:+:==========================================================================================================================================:+
| **Minimum Turning       | **Maximum Turning Point**                                                                                                                  | **Horizontal Inflection**                                                                                                                  |
| Point**                 |                                                                                                                                            |                                                                                                                                            |
|                         | $$f'(x) = 0$$                                                                                                                              | $$f'(x) = 0$$                                                                                                                              |
| $$f'(x) = 0$$           |                                                                                                                                            |                                                                                                                                            |
|                         | $$f^{''}(x) < 0$$                                                                                                                          | $$f^{''}(x) = 0$$                                                                                                                          |
| $$f^{''}(x) > 0$$       |                                                                                                                                            |                                                                                                                                            |
|                         | ![A collage of a blue curved line Description automatically                                                                                | ![A collage of a blue curved line Description automatically                                                                                |
|                         | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.575in"              | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.7739129483814524in" |
|                         | height="0.8888888888888888in"}![A collage of a blue curved line Description automatically                                                  | height="1.0011504811898513in"}                                                                                                             |
|                         | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.5753083989501313in" |                                                                                                                                            |
|                         | height="0.8888888888888888in"}                                                                                                             | If $f^{''}(x)$ doesn't change sign, undulation point                                                                                       |
+-------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+
| Instead of the table of slopes method, we can use the second derivative to classify the stationary points.                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                   |
| 1\. Find $f'(x)$                                                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                   |
| 2\. Find stationary points $f'(x) = 0,$ remember to find $y$ values.                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                   |
| 3\. Find $f^{''}(x)$                                                                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                   |
| 4\. Test stationary points by substituting $x$ values into $f^{''}(x)$.                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                   |
| If $f^{''}(x) = 0$, use a table of slopes to find whether it is an inflection or undulation point.                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                   |
| - The second derivative method is faster than the slope table method if there are no inflection points.                                                                                                                                                                                                           |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Classify stationary points using the second derivative.                                                               |
+=====================================================================================================================================+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image71.png){width="1.9858858267716535in" |
| height="1.968503937007874in"}Find and classify the stationary points on $f(x) = 2x^{3} - 3x^{2} - 12x$.                             |
|                                                                                                                                     |
| 1\. $f'(x) = 6x^{2} - 6x - 12$                                                                                                      |
|                                                                                                                                     |
| 2\. $6x^{2} - 6x - 12 = 0$                                                                                                          |
|                                                                                                                                     |
| $x^{2} - x - 2 = 0$                                                                                                                 |
|                                                                                                                                     |
| $$\ \ \ \ \ (x - 2)(x + 1) = 0$$                                                                                                    |
|                                                                                                                                     |
| Stationary points at $x = 2,\  - 1$                                                                                                 |
|                                                                                                                                     |
| $$\therefore(2, - 20),\ ( - 1,7)$$                                                                                                  |
|                                                                                                                                     |
| 3\. $f^{''}(x) = 12x - 6$                                                                                                           |
|                                                                                                                                     |
| 4\. $f^{''}(2) = 18 > 0$, so minimum at $(2, - 20)\$                                                                                |
|                                                                                                                                     |
| $f^{''}( - 1) = - 18 < 0$, so maximum at $( - 1,7)$                                                                                 |
+-------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                      |
+=====================================================================================================================================+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image72.png){width="1.9902788713910762in" |
| height="1.968503937007874in"}Find and classify the stationary point on $f(x) = (x - 3)^{2} + 5$.                                    |
|                                                                                                                                     |
| Min at $(3,\ 5)$                                                                                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image73.png){width="1.9858847331583551in" |
| height="1.968503937007874in"}Find and classify the stationary points on $f(x) = x^{3} - 4x^{2} + 4x$.                               |
|                                                                                                                                     |
| > $$Max\ at\ \left( \frac{2}{3},\frac{32}{27} \right),\ Min\ at\ (2,0)$$                                                            |
+-------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image74.png){width="1.9858847331583551in" |
| height="1.9641568241469816in"}Find and classify the stationary points on $f(x) = x^{4} - 4x^{3}$.                                   |
|                                                                                                                                     |
| > Horizontal inflection point at $(0,0)$, Min at $(3, - 27)$                                                                        |
+-------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Summary of First and Second Derivatives**                                                                                                                                                                                                                                                                                                                                                                                 |
+===================================================================+:================================================================:+:=========================================================================================================================================:+:==========================================================================================================================================:+
|                                                                   | $$\mathbf{f}^{\mathbf{'}}\left( \mathbf{x} \right)\mathbf{> 0}$$ | $$\mathbf{f}^{\mathbf{'}}\left( \mathbf{x} \right)\mathbf{< 0}$$                                                                          | $$\mathbf{f}^{\mathbf{'}}\left( \mathbf{x} \right)\mathbf{= 0}$$                                                                           |
|                                                                   |                                                                  |                                                                                                                                           |                                                                                                                                            |
|                                                                   | **Increasing**                                                   | **Decreasing**                                                                                                                            | **Stationary point**                                                                                                                       |
+-------------------------------------------------------------------+------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+
| $$\mathbf{f}^{\mathbf{''}}\left( \mathbf{x} \right)\mathbf{> 0}$$ | Increasing at an increasing rate                                 | Decreasing at a decreasing rate                                                                                                           | ![A collage of a blue curved line Description automatically                                                                                |
|                                                                   |                                                                  |                                                                                                                                           | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.575in"              |
| **Concave up**                                                    |                                                                  |                                                                                                                                           | height="0.8888888888888888in"}![A collage of a blue curved line Description automatically                                                  |
|                                                                   |                                                                  |                                                                                                                                           | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.575in"              |
|                                                                   |                                                                  |                                                                                                                                           | height="0.8888888888888888in"}![A collage of a blue curved line Description automatically                                                  |
|                                                                   |                                                                  |                                                                                                                                           | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.5753083989501313in" |
|                                                                   |                                                                  |                                                                                                                                           | height="0.8888888888888888in"}Minimum turning point                                                                                        |
+-------------------------------------------------------------------+------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+
| $$\mathbf{f}^{\mathbf{''}}\left( \mathbf{x} \right)\mathbf{< 0}$$ | Increasing at a decreasing rate                                  | Decreasing at an increasing rate                                                                                                          | ![A collage of a blue curved line Description automatically                                                                                |
|                                                                   |                                                                  |                                                                                                                                           | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.575in"              |
| **Concave down**                                                  |                                                                  |                                                                                                                                           | height="0.8888888888888888in"}![A collage of a blue curved line Description automatically                                                  |
|                                                                   |                                                                  |                                                                                                                                           | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.575in"              |
|                                                                   |                                                                  |                                                                                                                                           | height="0.8888888888888888in"}![A collage of a blue curved line Description automatically                                                  |
|                                                                   |                                                                  |                                                                                                                                           | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.575in"              |
|                                                                   |                                                                  |                                                                                                                                           | height="0.8888888888888888in"}Maximum turning point                                                                                        |
+-------------------------------------------------------------------+------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+
| $$\mathbf{f}^{\mathbf{''}}\left( \mathbf{x} \right)\mathbf{= 0}$$ | Fastest rate of increase                                         | ![A collage of a blue curved line Description automatically                                                                               | ![A collage of a blue curved line Description automatically                                                                                |
|                                                                   |                                                                  | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.575in"             | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.575in"              |
| ***Possible* point of inflection,\                                | Concavity changes from positive to negative.                     | height="0.8888888888888888in"}![A collage of a blue curved line Description automatically                                                 | height="0.8888888888888888in"}Stationary inflection point                                                                                  |
| only if** $\mathbf{f}^{\mathbf{''}}\left( \mathbf{x} \right)$     |                                                                  | generated](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image65.png){width="1.600097331583552in" |                                                                                                                                            |
| **changes sign around the point.**                                |                                                                  | height="0.8888888888888888in"}Fastest rate of decrease                                                                                    | If $f^{''}(x)$ doesn't change sign:                                                                                                        |
|                                                                   |                                                                  |                                                                                                                                           |                                                                                                                                            |
|                                                                   |                                                                  | Concavity changes from negative to positive.                                                                                              | very flat turning point                                                                                                                    |
+-------------------------------------------------------------------+------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  Find the stationary point on the curve
    $y\  = \ x^{2} - \ 2x\  + \ 1$ and determine its nature.

$$\frac{dy}{dx} = \ 2x\  - \ 2\  = \ 0\ $$

$$\ x\  = \ 1,\ y\  = \ 0$$

$$\frac{d^{2}y}{dx^{2}} = \ 2\  > \ 0$$

(1, 0), minimum

2.  Find the stationary point on the curve
    $y\  = \ 3x^{2} - \ 12x\  + \ 7$ and show that it is a minimum
    turning point.

$$\frac{dy}{dx} = \ 6x\  - \ 12\  = \ 0\ $$

$$\ x\  = \ 2,\ y\  = \  - 5$$

$$\frac{d^{2}y}{dx^{2}} = \ 6\  > \ 0$$

(2, −5), minimum

3.  Determine the stationary point on $y\  = \ x\  - \ x^{2}$ and show
    that it is a maximum point.

$$\frac{dy}{dx} = \ 1\  - \ 2x\  = \ 0\ $$

$$x\  = \frac{1}{2},\ y\  = \frac{1}{4}$$

$$\frac{d^{2}y}{dx^{2}} = \  - 2\  < \ 0$$

$$\left( \frac{1}{2},\frac{1}{4} \right),\ maximum$$

4.  Show that $f(x) = \ 2x^{3} - \ 5$ has a horizontal point of
    inflection and find its coordinates.

$$f'(x) = \ 6x^{2} = \ 0\ $$

$$x\  = \ 0,\ y\  = \  - 5$$

$$f^{''}(x) = \ 12x$$

$$f^{''}(0) = 0$$

$(0,\  - 5),$ horizontal point of inflection

5.  Does the function $f(x) = \ 2x^{5} + \ 3$ have a stationary point?
    If it does, determine its nature.

$$f'(x) = \ 10x^{4} = \ 0\ $$

$$x\  = \ 0,\ y\  = \ 3\ $$

$$f^{''}(x) = \ 40x^{3} = \ 0$$

$$f''(0) = 0$$

Horizontal point of inflection at $(0,\ 3)$

6.  Find any stationary points on
    $f(x) = \ 2x^{3} + \ 15x^{2} + \ 36x\  - \ 50$ and determine their
    nature.

f\'(x) = 6x² + 30x + 36 = 6(x² + 5x + 6) = 6(x + 2)(x + 3) = 0

x = −2: y = −78; x = −3: y = −77

f\'\'(x) = 12x + 30

At x = −2: f\'\'(−2) = 6 \> 0, minimum

At x = −3: f\'\'(−3) = −6 \< 0, maximum

(−2, −78) minimum, (−3, −77) maximum

7.  For each curve, identify the sign of $\frac{dy}{dx}$ and
    $\frac{d^{2}y}{dx^{2}}$.

+-----------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image75.png){width="1.9622648731408574in" | b.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image75.png){width="1.9622648731408574in" | c.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image75.png){width="1.9622648731408574in" |
|     height="1.5044028871391075in"}                                                                                                      |     height="1.5044028871391075in"}                                                                                                      |     height="1.5044028871391075in"}                                                                                                      |
|                                                                                                                                         |                                                                                                                                         |                                                                                                                                         |
| $$\frac{dy}{dx} > 0$$                                                                                                                   | $$\frac{dy}{dx} < 0$$                                                                                                                   | $$\frac{dy}{dx} > 0$$                                                                                                                   |
|                                                                                                                                         |                                                                                                                                         |                                                                                                                                         |
| $$\frac{d^{2}y}{dx^{2}} > 0$$                                                                                                           | $$\frac{d^{2}y}{dx^{2}} < 0$$                                                                                                           | $$\frac{d^{2}y}{dx^{2}} < 0$$                                                                                                           |
+=========================================================================================================================================+=========================================================================================================================================+=========================================================================================================================================+
| d.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image75.png){width="1.9622648731408574in" | e.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image75.png){width="1.9618055555555556in" height="1.8583333333333334in"}                                                                                                            |
|     height="1.5044028871391075in"}                                                                                                      |                                                                                                                                                                                                                                                                                   |
|                                                                                                                                         | $$\frac{dy}{dx} > 0$$                                                                                                                                                                                                                                                             |
| $$\frac{dy}{dx} < 0$$                                                                                                                   |                                                                                                                                                                                                                                                                                   |
|                                                                                                                                         | $$\frac{d^{2}y}{dx^{2}} > 0$$                                                                                                                                                                                                                                                     |
| $$\frac{d^{2}y}{dx^{2}} > 0$$                                                                                                           |                                                                                                                                                                                                                                                                                   |
+-----------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

8.  The population P of fish in a certain lake was studied over time. At
    the start of the study the number of fish was 2500.

    a.  During the study, $\frac{dP}{dt} < \ 0$. What does this say
        about the number of fish during the study?

Number of fish are decreasing

b.  If at the same time, $\frac{d^{2}P}{dt^{2}} > \ 0$, what can you say
    about the population rate of change?

Rate of population growth is increasing

c.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image76.png){width="2.632075678040245in"
    height="1.8572659667541558in"}Sketch a possible graph of the
    population $P$ against $t$.

Development

9.  a.  If $f(x)\  = \ x³\$and $g(x)\  = \ x⁴$, find
        $f'(x),\ f''(x),\ g'(x)$ and $g''(x).$

$$f'(x)\  = \ 3x^{2}$$

$$f^{''}(x) = \ 6x$$

$$g'(x)\  = \ 4x^{3}$$

$$g''(x)\  = \ 12x^{2}$$

b.  Both$\ f(x)$ and $g(x)$ have a stationary point at $(0,\ 0)$.
    Evaluate $f''(x)$ and $g''(x)$ when $x = 0$. Can you determine the
    nature of the stationary points from this calculation?

$$f^{''}(0) = \ 0,\ g^{''}(0) = \ 0$$

No, cannot determine nature when second derivative equals zero

c.  Use tables of values of $f'(x)$ and $g'(x)$ to determine the nature
    of the stationary points.

For $f(x)\  = \ x³:$

  -----------------------------
  $$x$$       −0.1   0   0.1
  ----------- ------ --- ------
  $$f'(x)$$   0.03   0   0.03

  -----------------------------

f\'(x) does not change sign, so (0, 0) is a horizontal (or stationary)
point of inflection

For $g(x)\  = \ x⁴:$

  --------------------------------
  $$x$$       −0.1     0   0.1
  ----------- -------- --- -------
  $$g'(x)$$   −0.004   0   0.004

  --------------------------------

g\'(x) changes from − to +, so (0, 0) is a minimum turning point

10. Find any stationary points on the curve
    $y\  = \ \left( 4x^{2} - \ 1 \right)^{4}$ and determine their
    nature.

$$\frac{dy}{dx} = \ 4\left( 4x^{2} - \ 1 \right)^{3}(8x)$$

$$= \ 32x\left( 2x - 1)(2x + 1) \right)^{3}$$

Stationary points at
$(0,\ 1)\ \left( \frac{1}{2},\ 0 \right)\ \left( - \frac{1}{2},\ 0 \right)$

$$\frac{d^{2}y}{dx^{2}} = \ 32\left( 4x^{2} - \ 1 \right)^{3} + \ 32x \cdot 3\left( 4x^{2} - \ 1 \right)^{2}(8x)$$

$$= \ 32\left( 4x^{2} - \ 1 \right)^{2}\left( 4x^{2} - \ 1\  + \ 24x^{2} \right)$$

$$= \ 32\left( 4x^{2} - \ 1 \right)^{2}\left( 28x^{2} - \ 1 \right)$$

At $x\  = \ 0:\frac{d^{2}y}{dx^{2}} = \  - 32\  < \ 0$, maximum

At $x\  = \frac{1}{2}:\frac{d^{2}y}{dx^{2}} = \ 0$, need further
analysis

At $x\  = \  - \frac{1}{2}:\frac{d^{2}y}{dx^{2}} = \ 0,$ need further
analysis

Using first derivative test: $\frac{dy}{dx}$ changes from − to + at
$x\  = \  \pm \frac{1}{2}$

(0, 1) maximum, $\left( \frac{1}{2},\ 0 \right)$ minimum,
$\left( - \frac{1}{2},\ 0 \right)$ minimum

11. a.  Find any stationary points on the curve
        $y\  = \ 2x^{3} - \ 27x^{2} + \ 120x$ and distinguish between
        them.

$$\frac{dy}{dx} = \ 6x^{2} - \ 54x\  + \ 120\ $$

$$= \ 6\left( x^{2} - \ 9x\  + \ 20 \right)$$

$$= \ 6(x\  - \ 4)(x\  - \ 5)$$

Stationary points at $(4,176)\ (5,\ 175)$

$$\frac{d^{2}y}{dx^{2}} = \ 12x\  - \ 54$$

At $x\  = \ 4:\frac{d^{2}y}{dx^{2}} = \  - 6\  < \ 0$, maximum

At $x\  = \ 5:\frac{d^{2}y}{dx^{2}} = \ 6\  > \ 0$, minimum

(4, 176) maximum, (5, 175) minimum

b.  Find any points of inflection on the curve.

$$\frac{d^{2}y}{dx^{2}} = \ 12x\  - \ 54\  = \ 0\ $$

$$x\  = \ 4.5,\ y\  = \ 175.5$$

Using table of concavities, concavity changes from negative to positive
across $x = 4.5$

Point of inflection at $(4.5,\ 175.5)$

12. Find any stationary points on the curve
    $f(x) = \ x^{4} + \ 8x^{3} + \ 16x^{2} - \ 1$ and their nature.

$$f'(x) = \ 4x^{3} + \ 24x^{2} + \ 32x\ $$

$$= \ 4x\left( x^{2} + \ 6x\  + \ 8 \right)$$

$$= \ 4x(x\  + \ 2)(x\  + \ 4) = \ 0$$

$$x\  = \ 0:\ y\  = \  - 1;\ x\  = \  - 2:\ y\  = \ 15;\ x\  = \  - 4:\ y\  = \  - 1$$

$$f^{''}(x) = \ 12x^{2} + \ 48x\  + \ 32$$

At $x\  = \ 0:\ f''(0)\  = \ 32\  > \ 0$, minimum

At $x\  = \  - 2:\ f''( - 2)\  = \  - 16\  < \ 0$, maximum

At $x\  = \  - 4:\ f''( - 4)\  = \ 32\  > \ 0$, minimum

(0, −1) minimum, (−2, 15) maximum, (−4, −1) minimum

13. The curve $y\  = \ ax^{2} - \ 4x\  + \ 1$ has a stationary point
    where $x\  = \frac{1}{2}$.

    a.  Find the value of $a$.

$$\frac{dy}{dx} = \ 2ax\  - \ 4\  = \ 0\ at\ x\  = \frac{1}{2}$$

$$2a\left( \frac{1}{2} \right) - \ 4\  = \ 0\ $$

$$a\  = \ 4\ $$

b.  Hence, or otherwise, find the stationary point and determine its
    nature.

$$y\  = \ 4x^{2} - \ 4x\  + \ 1$$

$$At\ x\  = \frac{1}{2}:\ y\  = \ 0$$

$$\frac{d^{2}y}{dx^{2}} = \ 8\  > \ 0$$

$\left( \frac{1}{2},\ 0 \right),$ minimum

# Curve Sketching using Calculus

+-------------------------------------------------------------------+
| - **Systematic Curve Sketching Method**                           |
+===================================================================+
| **Non-Calculus Methods**                                          |
|                                                                   |
| 1.  **Domain** of the function, and any **vertical asymptotes**.  |
|                                                                   |
| 2.  **Symmetry** of the function: odd, even, neither.             |
|                                                                   |
| 3.  **Intercepts:** $x$ and $y$-intercepts.                       |
|                                                                   |
| 4.  **Behaviour as** $\mathbf{x \rightarrow}$ **asymptotes:**     |
|                                                                   |
| If there is an asymptote at $x = a$, find $y$ value when          |
| $x \rightarrow a^{-}$ and $x \rightarrow a^{+}$                   |
|                                                                   |
| 5.  **Behaviour as** $\mathbf{x \rightarrow \pm \infty}$**:\**    |
|     If the $y$ approaches a particular value, this is the         |
|     horizontal asymptote.                                         |
|                                                                   |
| **Calculus Methods**                                              |
|                                                                   |
| Used to find stationary points and points of inflection. Not all  |
| curves have stationary points, so use non-calculus sketching      |
| methods to find the general shape of the curve first.             |
|                                                                   |
| 1.  **First derivative**\                                         |
|     $f'(x) = 0$ finds turning points, then determine their nature |
|     by using a table of slopes.                                   |
|                                                                   |
| 2.  **Second derivative**\                                        |
|     $f^{''}(x) = 0$ finds possible inflection points, then        |
|     determine their nature using a table of concavities.          |
|                                                                   |
| **Other considerations**                                          |
|                                                                   |
| If the curve is a known function, e.g., parabola, exponential,    |
| hyperbola, logarithm, we can sketch by identifying the            |
| transformations.                                                  |
|                                                                   |
| Trigonometric graphs are periodic; they repeat.                   |
|                                                                   |
| You can always draw up a table of values and hope for the best.   |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Investigation** Sketch curves using a systematic method.      |
+===================================================================+
| Sketch $y = xe^{x}$                                               |
+-------------------------------------------------------------------+
| Sketch $y = x^{4} - 8x^{2}$                                       |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------+
| - **Investigation** Sketch curves using a systematic method.                              |
+===========================================================================================+
| Sketch $y =$ $\frac{1}{x(x - 4)}$, given that the second derivative is                    |
| $y^{''} = \frac{2}{x^{3}(x - 4)} + \frac{2}{x^{2}(x - 4)^{2}} + \frac{2}{x(x - 4)^{3}\ }$ |
+-------------------------------------------------------------------------------------------+
| Sketch $y = e^{x}\sin x$ in the domain $\lbrack 0,\ 2\pi\rbrack$.                         |
+-------------------------------------------------------------------------------------------+

Foundation

1.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image77.png){width="1.7673611111111112in"
    height="1.7520833333333334in"}The diagram to the right shows a curve
    $y\  = \ f(x).$\
    From the sketch, find the values of $x$ for which:

    a.  $f'(x) = 0$,

a\) $x = - 1,\ 2$

b.  $f''(x)\  = \ 0$,

b\) $x = 0$

c.  $f(x)\$is increasing,

c\) $- 1 < x < 2$

d.  $f''(x)\  > \ 0.$

d\) $x < 0$

2.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image78.png){width="1.8541666666666667in"
    height="1.7524420384951882in"}The diagram to the right shows a
    sketch of $y = 6x² - x^{3}.$\
    The curve cuts the $x$-axis at $A$, has a maximum turning point at
    $B$\
    and a point of inflection at $C$.

    a.  Find the coordinates of $A$.

    b.  Find the coordinates of $B$.

    c.  Find the coordinates of $C$.

a\) (6,0)

b\) (4,32)

c\) (2,16)

3.  a.  Show that $y\  = \ 27x\  - \ x³$ is an odd function. What
        symmetry does its graph display?

    b.  Show that $y'\  = \ 3(9\  - \ x²)$ and $y''\  = \  - 6x$.

    c.  Find the coordinates of the stationary points. Then determine
        their nature, either by examining the sign of $f''(3)$ and
        $f''( - 3),$ or by means of a table of test values of $y'$.

    d.  Show, using a table of test values of $y''$, that $x\  = \ 0$ is
        a point of inflection.

    e.  By substituting into the gradient function $y'$, find the
        gradient at the inflection.

    f.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image79.png){width="2.222428915135608in"
        height="2.3622047244094486in"}Sketch the graph of the function,
        indicating all important features.

a\) Show that $f( - x) = - f(x)$ 180 degree rotational symmetry about
origin.

c\) maximum at (3, 54), minimum at (-3, -54)

d\) concavity changes sign at $x = 0$

e\) Gradient at inflection is 27

4.  a.  If $f(x)\  = \ 2x³\  - \ 3x²\  + \ 5,$ show that
        $f'(x)\  = \ 6x(x\  - \ 1)\$and $f''(x)\  = \ 6(2x\  - \ 1)$.

    b.  Find the coordinates of the stationary points. Then determine
        their nature, either by examining the sign of $f''(0)$ and
        $f''(1),$ or by means of a table of test values of $y'$.

    c.  Explain why there is a point of inflection at
        $x\  = \frac{1}{2}$, and find the gradient there.

    d.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image80.png){width="2.4294346019247595in"
        height="2.3622047244094486in"}Sketch the graph of $f(x)$,
        indicating all important features.

b\) maximum at (0, 5) minimum at (1, 4)

c\) $f^{''}(x) = \ 0$

$$6(2x\  - \ 1) = \ 0;\ x\  = \frac{1}{2}$$

Gradient is $- \frac{3}{2}$

5.  a.  If $y\  = \ 12x³\  - \ 3x⁴\  + \ 11$, show that
        $y'\  = \ 12x²(3\  - \ x)$ and $y''\  = \ 36x(2\  - \ x).$

    b.  By solving $y'\  = \ 0,$ find the coordinates of any stationary
        points.

    c.  By examining the sign of $y'',$ establish the nature of the
        stationary point at $x\  = \ 3$.\
        Why does this method fail for the stationary point at
        $x\  = \ 0$?

    d.  Use a table of test values of $y'$ to show that there is a
        stationary inflection at $x\  = \ 0$.

    e.  Show that there is a change in concavity at $x\  = \ 2$.

    f.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image81.png){width="2.4294346019247595in"
        height="2.3622047244094486in"}Sketch the graph of the function,
        showing all important features.\
        You do not need to find the $x$ intercepts.

b\) (0, 11) (3, 92)

c\) maximum at (3,92) $f^{''}(0) = 0$ so can't determine nature using
second derivative at $x = 0$.

Development

6.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image82.png){width="2.4388998250218723in"
    height="2.3622047244094486in"}Using the method outlined in the
    previous question, sketch
    $y\  = \ x^{4} - \ 16x^{3} + \ 72x^{2} + \ 10$.

7.  a.  If $f(x)\  = \ x³\  - \ 3x$, show that
        $f'(x)\  = \ 3(x\  - \ 1)(x\  + \ 1)$ and $f''(x)\  = \ 6x$.

    b.  By solving $f'(x)\  = \ 0$, find the coordinates of any
        stationary points.

    c.  Examine the sign of $f''(1)$ and $f''( - 1)$ to determine their
        nature.

    d.  Find the coordinates of the point of inflection. Remember that
        you must show that the sign of $f''(x)\$changes about this
        point.

    e.  Sketch the graph of $f(x),$ indicating all important features.

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image83.png){width="2.4294346019247595in"
height="2.3622047244094486in"}

b\) (-1, 2), (1, -2)

c\) maximum at (-1, 2) minimum at (1, -2)

d\) (0, 0)

8.  a.  If $f(x) = x^{3} - 6x^{2} - 15x + 1$, show that
        $f'(x) = 3(x - 5)(x + 1)$ and$\ f''(x) = 6(x - 2)$.

    b.  Find any stationary points and use the sign of $f''(x)$ to
        determine their nature.

    c.  Find the coordinates of any points of inflection.

    d.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image84.png){width="2.4156211723534557in"
        height="2.3622047244094486in"}Sketch the graph of $f(x)$,
        indicating all important features.

9.  a.  If $y = x^{3} - 3x^{2} - 9x + 11$, show that
        $y' = 3(x - 3)(x + 1)$ and $y'' = 6(x - 1).$

    b.  Find any stationary points and use the sign of y\'\' to
        determine their nature.

    c.  Find the coordinates of any points of inflection.

    d.  Sketch the graph of the function, indicating all important
        features.

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image85.png){width="2.3444444444444446in"
height="2.3618055555555557in"}

10. a.  If $y = 3 + 4x³ - x⁴,$ show that $y' = 4x²(3 - x)\$and
        $y'' = 12x(2 - x)$.

    b.  Find any stationary points and use a table of test values of y\'
        to determine their nature.

    c.  Find the coordinates of any points of inflection.

    d.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image86.png){width="2.3444444444444446in"
        height="2.3027777777777776in"}Sketch the graph of the function,
        indicating all important features.

11. a.  Show that the derivative of $f(x) = \frac{1}{x^{2} - \ 4}$ is
        $f'(x)\  = \  - \frac{2x}{\left( x^{2} - \ 4 \right)^{2}}.$

    b.  Show that $y\  = \ f(x)$ has a stationary point at $x\  = \ 0$.\
        Then determine its nature, using a table of values of $f'(x)$.

    c.  Show that the function is even. What symmetry does its graph
        exhibit?

    d.  State the domain of the function and the equations of any
        vertical asymptotes.

    e.  What value does $f(x)$ approach as $x\  \rightarrow \ \infty$
        and as $x\  \rightarrow \  - \infty?$\
        Hence write down the equation of the horizontal asymptote.

    f.  Sketch the graph of $y\  = \ f(x),$ showing all important
        features.

    g.  Use the graph to state the range of the function.

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image87.png){width="2.5360717410323708in"
height="2.3622047244094486in"}

c\) line symmetry across $y$ axis

d\) domain $x\mathbb{\in R}$, $x \neq - 2,\ 2$ where there are vertical
asymptotes

e\) $y = 0$

$$g)\left( - \infty, - \frac{1}{4} \right\rbrack,\ (0,\ \infty)$$

12. The graphs of $f(x)$, $f'(x)$ and $f^{''}(x)$ have been sketched
    below.\
    Describe your observations.

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image88.png){width="2.7252121609798774in"
height="2.677221128608924in"}

Where $f'(x)$ crosses the x-axis, $f$ has stationary points

Where$\ f''(x)$ crosses the $x$-axis, $f$ has points of inflection
and$\ f'$ has turning points

The sign of $f'$ tells us where $f$ is increasing/decreasing

The sign of $f''\$tells us where$\ f$ is concave up/down

At $x\  = \frac{1}{4}$ $f\$has a minimum

At $x\  = \ 1$: $f$ has a stationary point of inflection (f\'(x) = 0 and
f\'\'(x) = 0)

13. 

+------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  By considering the sign of the graph, sketch $f'(x)$ and then sketch $f^{''}(x)$                                                                             | b.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image93.png){width="2.7534722222222223in"                          |
|                                                                                                                                                                  |     height="2.7152777777777777in"}By considering the sign of the graph,\                                                                                         |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image89.png){width="2.753613298337708in"                               |     sketch $f'(x)$ and then sketch $f^{''}(x)$                                                                                                                   |
| height="2.715417760279965in"}$f(x)$                                                                                                                              |                                                                                                                                                                  |
|                                                                                                                                                                  | $$f'(x)$$                                                                                                                                                        |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image90.png){width="2.7534722222222223in"                              |                                                                                                                                                                  |
| height="2.7083333333333335in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image91.png){width="2.745833333333333in" | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image94.png){width="2.7534722222222223in"                              |
| height="2.701388888888889in"}$f'(x)$                                                                                                                             | height="2.7152777777777777in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image91.png){width="2.745833333333333in" |
|                                                                                                                                                                  | height="2.701388888888889in"}                                                                                                                                    |
| $$f^{''}(x)$$                                                                                                                                                    |                                                                                                                                                                  |
|                                                                                                                                                                  | $$f^{''}(x)$$                                                                                                                                                    |
| ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image92.png){width="2.746428258967629in"                               |                                                                                                                                                                  |
| height="2.7083333333333335in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image91.png){width="2.745833333333333in" | ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image95.png){width="2.745833333333333in"                               |
| height="2.701388888888889in"}                                                                                                                                    | height="2.7083333333333335in"}![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image91.png){width="2.745833333333333in" |
|                                                                                                                                                                  | height="2.701388888888889in"}                                                                                                                                    |
+==================================================================================================================================================================+==================================================================================================================================================================+

Mastery

14. a.  Show that the derivative of $f(x) = \frac{x}{x^{2} - \ 4}\$is
        $f'(x)\  = \  - \frac{x^{2} + \ 4}{\left( x^{2} - \ 4 \right)^{2}}.$

    b.  Explain why the curve $y\  = \ f(x)$ has no stationary points,
        and why the curve is always decreasing.

    c.  Given that
        $f^{''}(x) = \frac{2x^{3} + \ 24x}{\left( x^{2} - \ 4 \right)^{3}}$,
        show that (0, 0) is a point of inflection.\
        Then find the gradient of the tangent at this point.

    d.  State the domain of the function and the equations of any
        vertical asymptotes.

    e.  What value does $f(x)$ approach as $x$ becomes large?\
        Hence write down the equation of the horizontal asymptote.

    f.  Show that the function is odd. What symmetry does its graph
        have?

    g.  Analyse the behaviour of the function as it approaches the
        vertical asymptotes.

    h.  Sketch the graph of $y\  = \ f(x)$, showing all important
        features.

    i.  ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image96.png){width="2.4821128608923884in"
        height="2.3622047244094486in"}Use the graph to state the range
        of the function.

c\) gradient = $- \frac{1}{4}$

d\) domain $x\mathbb{\in R}$, $x \neq - 2,\ 2$ where there are vertical
asymptotes

e\) $y = 0$

f\) 180 degree rotational symmetry about origin

i\) all real $y$

15. a.  If $f(x) = \frac{x^{2}}{1\  + \ x^{2}},$ show that
        $f'(x) = \frac{2x}{\left( 1\  + \ x^{2} \right)^{2}}$ and
        $f^{''}(x) = \frac{2\  - \ 6x^{2}}{\left( 1\  + \ x^{2} \right)^{3}}.$

    b.  Hence find the coordinates of any stationary points and
        determine their nature.

    c.  Find the coordinates of any points of inflection.

    d.  State the equation of the horizontal asymptote.

    e.  Sketch the graph of the function, indicating all important
        features.

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image97.png){width="2.4305555555555554in"
height="2.3618055555555557in"}

16. a.  Show that if $y\  = \frac{x\  + \ 2}{x\  - \ 3}$, then
        $y^{''} = \frac{10}{(x\  - \ 3)^{3}}.$

    b.  By examining the sign of $(x\  - \ 3)³,$ determine when the
        curve is concave up, and when it is concave down.

    c.  Sketch the graph of $y\  = \frac{x\  + \ 2}{x\  - \ 3}.$

    d.  Confirm your answer by showing that $y = \frac{x + 2}{x - 3}$
        can be written as $y = 1 + \frac{5}{x - 3}$ and sketching using
        transformations.

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image98.png){width="2.3947550306211722in"
height="2.3622047244094486in"}

b\) concave up when $x > 3,\$concave down when $x < 3$

$$d)\ y = \frac{x + 2}{x - 3} = \frac{x - 3 + 5}{x - 3} = \frac{x - 3}{x - 3} + \frac{5}{x - 3}$$

$$= 1 + \frac{5}{x - 3}$$

This is indeed a hyperbola dilated by a factor of 5 and shifted right by
3, up by 1.

17. Consider the curve $y\  = \ xeˣ$.

    a.  Where is the function zero, positive and negative? Is it even,
        odd or neither?

    b.  Show that $y'\  = \ (1\  + \ x)eˣ$ and
        $y''\  = \ (2\  + \ x)eˣ$.

    c.  Show that there is one stationary point, and determine its
        nature.

    d.  Find the coordinates of the lone point of inflection.

    e.  What happens to $y$,$\ y'\$and $y''$ as
        $x\  \rightarrow \ \infty?$

    f.  Given that $y\  \rightarrow \ 0$ as
        $x\  \rightarrow \  - \infty,$ sketch the curve, then write down
        its range.

    g.  Hence also sketch $y\  = \  - xe⁻ˣ$ by recognising the simple
        transformation.

a\) $f(x) = 0$ when $x = 0$. It is negative for $x < 0$ and positive for
$x > 0$

e\) They all tend towards $\infty$,\
meaning the curve is increasing at an increasing rate above the $x$
axis.

f\) $y \geq -$ $\frac{1}{e}$

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image99.png){width="2.654739720034996in"
height="2.3622047244094486in"}![A graph of a function AI-generated
content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image100.png){width="2.3756944444444446in"
height="2.3618055555555557in"}

18. Consider the function $y\  = \ (1\  - \ x)eˣ$.

    a.  Find the zero.

    b.  Find $y'$ and $y''$.

    c.  Show that the curve has a maximum turning point at its
        y-intercept, and a point of inflection at $( - 1,\ 2e⁻¹).$

    d.  What happens to $y,\ y'$ and $y''$ as
        $x\  \rightarrow \ \infty$?

    e.  Given that $y\  \rightarrow \ 0$ as
        $x\  \rightarrow \  - \infty$, sketch the graph and write down
        its range.

a\) Zero at $x = 1$![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image101.png){width="2.3958333333333335in"
height="2.3618055555555557in"}

b\) $y' = - xe^{x},\ y^{''} = - (x + 1)e^{x}$

d\) They all tend towards $- \infty$,\
meaning the curve is decreasing at an increasing rate below the $x$
axis.

e\) $y \leq 1$

19. a.  What is the natural domain of $y\  = \frac{eˣ}{x}$?

    b.  Show that the curve has a local minimum at $(1,\ e)\$but no
        inflection points.

    c.  Sketch the curve and state its range.

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image102.png){width="2.396943350831146in"
height="2.3622047244094486in"}a) $x\mathbb{\in R,\ }x \neq 0$

c\) $y < 0,\ y \geq e$

20. a.  Write down the domain of $y\  = \frac{1}{x} + \ \ln\ x$.

    b.  Show that the first and second derivatives may be expressed as
        single fractions as $y' = \frac{x\  - \ 1}{x^{2}}$ and
        $y'' = \frac{2\  - \ x}{x^{3}}$.

    c.  Show that the curve has a minimum at $(1,\ 1)$ and an inflection
        at $\left( 2,\frac{1}{2} + \ \ln\ 2 \right)$.

    d.  Sketch the graph and write down its range.

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image103.png){width="2.538817804024497in"
height="2.3622047244094486in"}

a\) $x > 0$

d\) $y \geq 1$

21. Consider the curve $y\  = \ x\ \log_{e}\ x\  - \ x$.

    a.  Write down the domain and $x$-intercept.

    b.  Show that $y'\  = \ \log_{e}\ x$ and find $y''$.

    c.  Hence show that there is one stationary point and determine its
        nature.

    d.  What does $y''$ tell you about the curve?

    e.  Given that$\ y\  \rightarrow \ 0⁻$ as $x\  \rightarrow \ 0⁺$,
        and that the tangent approaches vertical
        as$\ x\  \rightarrow \ 0⁺$, sketch the curve and write down its
        range.

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image104.png){width="2.564038713910761in"
height="2.3622047244094486in"}

a\) $x > 0$, $(e,0)$

$$b)\ y^{''} = \frac{1}{x}$$

c\) $(1, - 1)$ is a minimum

d\) $y^{''} > 0$, so concave up throughout its domain

e\) $y \geq - 1$

22. a.  Write down the domain of $y\  = \ \log_{e}(1\  + \ x²)$.

    b.  Is the curve, even, odd or neither?

    c.  Find where the function is zero, and explain what its sign is
        otherwise.

    d.  Show that $y' = \frac{2x}{1\  + \ x^{2}}\$and
        $y'' = \frac{2\left( 1\  - \ x^{2} \right)}{\left( 1\  + \ x^{2} \right)^{2}}.$

    e.  Hence show that y$\  = \ \log_{e}(1\  + \ x²)\$has one
        stationary point, and determine its nature.

    f.  Find the coordinates of the two points of inflection.

    g.  Hence sketch the curve, and then write down its range.

![A graph of function with arrows AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image105.png){width="2.5380172790901137in"
height="2.3622047244094486in"}a) $x\mathbb{\in R}$

b\) even

c\) zero at $x = 0$, and positive everywhere else as $\log{}$of a number
greater than 1 are positive

e\) $(0,0)$ min

f\) $\left( 1,\ln 2 \right)\ ( - 1,\ln 2)$

g\) $y \geq 0$

23. a.  Find the domain of $y\  = \ (ln\ x)²$.

    b.  Find where the function is zero, and explain what its sign is
        otherwise.

    c.  Find $y'$ and show that$\ y'' = \frac{2(1\  - \ ln\ x)}{x^{2}}$.

    d.  Hence show that the curve has an inflection at $x\  = \ e$.

    e.  Classify the stationary point at $x\  = \ 1$, sketch the curve,
        and write down the range.

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image106.png){width="2.466114391951006in"
height="2.3622047244094486in"}a) $x > 0$

b\) it is zero at $x = 1$ and positive everywhere else as squares must
be positive

$$c)\ y' = \frac{2}{x}\ln x$$

d\) $y \geq 0$

24. a.  Find and classify the lone stationary point of
        $y\  = x^{2}\ln x\$in its natural domain.

    b.  Show that there is an inflection at $x\  = \ e^{- \frac{3}{2}}$.

    c.  Examine the behaviour of $y$ and$\ y'$ as
        $x\  \rightarrow \ 0⁺$.

    d.  Hence sketch the graph of this function, then write down its
        range.

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image107.png){width="2.397147856517935in"
height="2.3622047244094486in"}a) Natural domain is $x > 0$. Minimum at
$\left( \frac{1}{\sqrt{e}},\  - \frac{1}{2e} \right)$

c\) $y$ and $y' \rightarrow 0^{+}$

Graph becomes horizontal approaching the origin

d\) $y \geq \  -$ $\frac{1}{2e}$

25. a.  What is the natural domain of $y\  = \ ln(ln\ x)?$

    b.  What is the $x$-intercept?

    c.  Find $y'$ and $y''$, and explain why there are no stationary
        points.

    d.  Explain why there is no inflection at $x\  = \ e⁻¹$.

    e.  Sketch the curve.

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image108.png){width="2.317879483814523in"
height="2.3622047244094486in"}a) $\ln x > 0,\ so\ x > 1$

b\) $x = e$

c\) $y' =$ $\frac{1}{x\ln x}$ which can never be zero or negative, so
always increasing

$y^{''} = -$ $\frac{1 + \ln x}{\left( x\ln x \right)^{2}}$

d\) This is outside the domain

26. Consider the curve $y\  = \ \sin\ x\  + \ \cos\ x\$in the interval
    $0\  \leq \ x\  \leq \ 2\pi$.

    a.  Find the values of the function at the endpoints of the domain.

    b.  Find the $x$-intercepts of the graph.

    c.  Find any stationary points and determine their nature.

    d.  Find any points of inflection and sketch the curve.

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image109.png){width="3.930923009623797in"
height="2.0521741032370953in"}

a\) $f(0) = 1$

$$f(2\pi) = 1$$

$$b)\ x = \frac{3\pi}{4}\ or\frac{5\pi}{4}$$

$$c)\ \left( \frac{\pi}{4},\sqrt{2} \right)\ max,\ \left( \frac{5\pi}{4},\  - \sqrt{2} \right)\ min$$

$d)$ The $x$-intercepts are also inflection points.

27. a.  Find the first and second derivatives of
        $y = \cos\ x + \sqrt{3}\ \sin\ x$.

    b.  Find the stationary points in the domain
        $0\  \leq \ x\  \leq \ 2\pi$, and use the second derivative to
        determine their nature.

    c.  Find the points of inflection.

    d.  Hence sketch the curve, for $0\  \leq \ x\  \leq \ 2\pi$.

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image110.png){width="2.8154188538932634in"
height="2.3622047244094486in"}

a\) $y' = - \sin x + \sqrt{3}\cos x$

$$y^{''} = - \cos x - \sqrt{3}\sin x$$

$$b)maxat\ \left( \frac{\pi}{3},2 \right)\ minat\ \left( \frac{4\pi}{3},\  - 2 \right)$$

$$c)\ \left( \frac{5\pi}{6},0 \right),\ \left( \frac{11\pi}{6},0 \right)$$

28. a.  Find the derivative of $y\  = \ x\  + \ \sin\ x$, and show that
        $y''\  = \  - \sin\ x$.

    b.  Find the stationary points in the domain
        $- 2\pi\  < \ x\  < \ 2\pi$, and determine their nature.

    c.  Find the points of inflection.

    d.  Hence sketch the curve, for $- 2\pi\  \leq \ x\  \leq \ 2\pi.$

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image111.png){width="2.3984536307961504in"
height="2.3622047244094486in"}a) $y' = 1 + \cos x$

Since $y' \geq 0$ the gradient is always increasing or zero

$$y^{''} = - \sin x$$

Concavity changes between positive and negative

b\) $( - \pi, - \pi)$ and $(\pi,\pi)$ are horizontal inflection points

c\) (0,0)

29. ![A graph of mathematical equations AI-generated content may be
    incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image112.png){width="2.3432567804024496in"
    height="2.3622047244094486in"}Find any stationary points and
    inflections of the curve $y = 2\sin\ x + x$ in the interval
    $0 \leq x \leq 2\pi$, then sketch the curve.

$$Maximum\ at\ \left( \frac{2\pi}{3},\frac{2\pi}{3} + \sqrt{3} \right)$$

$$Minimum\ at\ \left( \frac{4\pi}{3},\frac{4\pi}{3} - \sqrt{3} \right)$$

Inflection at $(\pi,\pi)$

30. ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image113.png){width="2.7605588363954507in"
    height="2.7987554680664917in"}Sketch $y = x\sqrt{16 - x^{2}}$

31. Sketch $y = x^{2}\ln x$

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image114.png){width="2.7503215223097115in"
height="2.7987554680664917in"}

Inflection point (not shown) at
$\left( \frac{1}{\sqrt{e^{3}}},\  - \frac{3}{2e^{3}} \right)$

32. Sketch $y =$ $\frac{x}{e^{x}}$

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image115.png){width="2.75in"
height="2.673611111111111in"}

# Exam Questions

1.  **2017 HSC Advanced Band 4**

The function $f(x)$ is defined for $a \leq x \leq b$.

On this interval, $f'(x) > 0$ and $f^{''}(x) < 0$

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image116.png){width="4.651744313210848in"
height="3.8096620734908138in"}Which graph best represents $y = f(x)?$

Gradient always positive and concave down

A

2.  ![A graph of a function AI-generated content may be
    incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image117.png){width="2.833404418197725in"
    height="2.0405424321959753in"}**2021 HSC Advanced Band 4\**
    The diagram shows part of $y = f(x)$ which has a local minimum at
    $x = - 2$ and local maximum at $x = 3$.

Which of the following shows the correct relationship between
$f^{''}( - 2),f(0),f'(3)$?

![A number of mathematical equations AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image118.png){width="2.1041207349081366in"
height="1.3112642169728783in"}

$f^{''}( - 2)$ is concave up so positive

$f(0)$ is negative

$$f'(3) = 0$$

A

3.  **2023 HSC Advanced Band 4**

The following table gives the signs of the first and second derivatives
of a function $y = f(x)$ for different values of $x$.

![A white rectangular box with black numbers and symbols AI-generated
content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image119.png){width="3.0437970253718287in"
height="1.0in"}

Which of the following is a possible sketch of $y = f(x)$?

![A graph of function and function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image120.png){width="4.817325021872266in"
height="3.741342957130359in"}

Gradient is positive at $x = - 2$ and 2,\
so eliminate B and D

SP and POI at $x = 0$, so eliminate A

C is the answer

4.  **2014 HSC Advanced Band 4**

Find the coordinates of the stationary point on $y = e^{x} - ex$ and
determine its nature.

![A math equations on a white background AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image121.png){width="1.7046194225721785in"
height="3.1544542869641297in"}

5.  **2022 HSC Advanced Band 4**

Let $f(x)\  = \ xe⁻²ˣ$.

It is given that $f'(x)\  = \ e⁻²ˣ\  - \ 2xe⁻²ˣ.$

a.  Show that $f''(x)\  = \ 4(x\  - \ 1)e⁻²ˣ$.

b.  Find any stationary points of $f(x)$ and determine their nature.

c.  Sketch the curve $y\  = \ xe⁻²ˣ$, showing any stationary points,
    points of inflection and intercepts with the axes.

![A graph and diagram of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image122.png){width="3.6145833333333335in"
height="4.749179790026247in"}![A white background with black and white
text AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image123.png){width="3.058089457567804in"
height="4.816721347331583in"}

6.  **2018 HSC Advanced Band 5**

The diagram shows the graph of $f'(x)$.

For what value of $x$ does $f(x)$ have a point of inflection?

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image124.png){width="3.421887576552931in"
height="2.182609361329834in"}

Stationary point of $f'(x)$ is where $f^{''}(x) = 0$

So, b or d

Point of inflection when $f^{''}(x)$ changes sign

Gradient of $f'(x)$ changes sign at b only

$x = b$ is the answer

7.  **2024 HSC Advanced Band 4**

Sketch the curve $y = x^{4} - 2x^{3} + 2$ by first finding all
stationary points, checking their nature, and finding the points of
inflection.

![A math problem with numbers and equations AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image125.png){width="4.292206911636045in"
height="3.5596587926509184in"}![A math problem with numbers and
equations AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image126.png){width="2.4493055555555556in"
height="3.077777777777778in"}

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image127.png){width="2.808695319335083in"
height="3.209938757655293in"}

8.  **2014 HSC Advanced Band 4**

> ![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image128.png){width="2.439583333333333in"
> height="1.476388888888889in"}The graph shows the displacement $x$ of a
> particle moving along a straight line as a function of time $t$. Which
> statement describes the motion of the particle at the point $P$?

![](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image129.png){width="3.8199704724409447in"
height="1.1517497812773403in"}

Gradient negative $f'(x) < 0$, so velocity negative

Concave up $f^{''}(x) > 0$, so acceleration positive

A

9.  **2025 HSC Advanced Band 4**

Consider $f(x) =$ $\frac{x^{2}}{e^{x}}$

Find the stationary points of the function and determine their nature.

![A graph of function and numbers AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image130.png){width="4.252173009623797in"
height="2.9372834645669292in"}![A graph of a function AI-generated
content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image131.png){width="4.321738845144357in"
height="2.9323797025371827in"}A partially completed graph of $f(x)$ is
shown below. Use your answer to complete the graph.

![A math problem with numbers and equations AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image132.png){width="2.4256944444444444in"
height="5.362965879265092in"}

10. **2013 HSC Advanced Band 5**

The diagram shows points A, B, C, D on the graph $y = f(x)$.

At which point is $f'(x) > 0$ and $f^{''}(x) = 0$?

![A line graph with points and dots AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image133.png){width="3.1233213035870517in"
height="2.4340048118985127in"}

Positive gradient: B or D

D is concave up,

so B is the answer

11. **2020 HSC Advanced Band 4**

Sketch $y = - x^{3} + 3x^{2} - 1$, labelling stationary points and
points of inflection.\
Do **not** determine the $x$-intercepts.

![A math problem with numbers and equations AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image134.png){width="2.595138888888889in"
height="3.520138888888889in"}![A white paper with black text and numbers
AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image135.png){width="2.595206692913386in"
height="7.086614173228346in"}

![A graph of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image136.png){width="3.279258530183727in"
height="2.504348206474191in"}

12. **2024 VCE Methods Band 5**

A function is defined as $f(x) =$ $\frac{x - h}{(x + 1)(x - 4)}$.

Determine the range of $h$ where the graph $f(x)$ have no turning
points.

![A math problem with numbers and equations AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image137.png){width="3.5506944444444444in"
height="1.051388888888889in"}![A math problem with numbers and equations
AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image137.png){width="3.5509262904636922in"
height="2.9791666666666665in"}

13. **2023 HSC Advanced Band 5**

$$f(x) = e^{- x}\sin x$$

a.  Find the coordinates of the stationary points of $f(x)$ in
    $0 \leq x \leq 2\pi$.\
    You do **not** need to check the nature of the points.

b.  Without further calculus, sketch the graph of $f(x)$ in the domain
    $0 \leq x \leq 2\pi$, showing stationary points and intercepts.

![A graph of mathematical equations AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image138.png){width="3.4254286964129483in"
height="2.6260870516185477in"}![A math problem with equations
AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image139.png){width="3.523912948381452in"
height="4.466227034120735in"}![A white background with black lines
AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image140.png){width="3.356521216097988in"
height="2.439179790026247in"}

![A close up of black letters AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image141.png){width="2.0221861329833772in"
height="0.263924978127734in"}

16. **2009 HSC Advanced Band 6**

> The diagram illustrates the design for part of a roller-coaster
> track.\
> The section RO is a straight line with slope 1.2.\
> The section PQ is a straight line with slope $- 1.8$.\
> The section OP is a parabola $y = ax^{2} + bx$.\
> The horizontal distance from $y$-axis to $P$ is 30 m.

![A diagram of a function AI-generated content may be
incorrect.](media/Applications of Calculus 1_Turning points inflections and curve-sketching/media/image142.png){width="3.4180555555555556in"
height="1.8486439195100612in"}

For a smooth ride, the straight-line sections must be tangent to the
parabola at O and P.

a.  Find the values of $a$ and $b$ so that the ride is smooth.

$$y' = 2ax + b$$

$$y'(0) = b = 1.2$$

$$y'(30) = 60a + b = - 1.8$$

$$60a + 1.2 = - 1.8$$

$$\therefore a = - 0.05$$

b.  Find the distance $d$ from the vertex to the horizontal line at $P$,
    as shown on the diagram.

Find vertex:

$$y = - 0.05x^{2} + 1.2x$$

$$y' = - 0.1x + 1.2 = 0$$

$$x = 12$$

At $x = 12,\ y = 7.2$

$$\therefore Vertex(12,7.2)$$

Point $P$ is $(30,\  - 9)$

$$\therefore d = 7.2 + 9 = 16.2\ m$$
