  -------------------------------------------------------------------
  Mathematics Advanced Year 12
  -------------------------------------------------------------------
  **Integral Calculus**

  -------------------------------------------------------------------

+---------------------------------------------+---------------------------------------------+---------------------------------------------+
| **Book 3**                                  | Further Areas under Curves                  | Version: 260412                             |
|                                             |                                             |                                             |
|                                             |                                             | Feedback:\                                  |
|                                             |                                             | https://MrDingMaths.com                     |
+=============================================+=============================================+=============================================+
| **Contents**                                                                                                                            |
|                                                                                                                                         |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                                                                            |
|                                                                                                                                         |
| [Area Bounded by a Curve [3](#area-bounded-by-a-curve)](#area-bounded-by-a-curve)                                                       |
|                                                                                                                                         |
| [Area Bounded by the $\mathbf{y}$-axis [13](#area-bounded-by-the-mathbfy-axis)](#area-bounded-by-the-mathbfy-axis)                      |
|                                                                                                                                         |
| [Area Between Two Curves [21](#area-between-two-curves)](#area-between-two-curves)                                                      |
|                                                                                                                                         |
| [Trapezoidal Rule [34](#trapezoidal-rule)](#trapezoidal-rule)                                                                           |
|                                                                                                                                         |
| [Area under Exponential, Reciprocal, and Trigonometric Curves                                                                           |
| [43](#area-under-exponential-reciprocal-and-trigonometric-curves)](#area-under-exponential-reciprocal-and-trigonometric-curves)         |
+-----------------------------------------------------------------------------------------------------------------------------------------+

# Syllabus Content

**Areas and the definite integral**

- Apply $\int_{a}^{b}{f(x)}dx = F(b) - F(a)$, where $F(x)$ is a
  primitive of $f(x)$, to calculate definite integrals and solve related
  theoretical problems involving functions within the scope of the
  Mathematics Advanced course

- Describe, in the case where $f(x) \geq 0$ for all values of $x$ in the
  interval $a \leq x \leq b$, the area bounded by the graph of the
  continuous function $y = f(x)$, the $x$-axis and the lines $x = a$ and
  $x = b$, as $\int_{a}^{b}{f(x)}dx$

- Recognise, in the case where $f(x) \leq 0$ for all values of $x$ in
  the interval $a \leq x \leq b$, the area bounded by the graph of the
  continuous function $y = f(x)$, the $x$-axis and the lines $x = a$ and
  $x = b$, as $\left| \int_{a}^{b}{f(x)}dx \right|$ or
  $- \int_{a}^{b}{f(x)}dx$

- Conclude, for a continuous function $y = f(x)$ on the interval
  $a \leq x \leq b$, that $\int_{a}^{b}{f(x)}dx =$ (area of regions
  between curve and $x$-axis lying above the $x$-axis) $-$ (area of
  regions between curve and the $x$-axis lying below the $x$-axis)

- Use definite integrals to solve problems involving the areas of
  regions bounded by the graph of the continuous function $y = f(x)$,
  the $x$-axis and the lines $x = a$ and $x = b$, in cases where
  $f(x) \geq 0\$throughout $a \leq x \leq b$, $f(x) \leq 0\$throughout
  $a \leq x \leq b$ or where $f(x)$ changes sign in the interval
  $a \leq x \leq b$, with or without the graph provided

- Use definite integrals to solve problems involving the areas of
  regions bounded by the graph of the continuous function $y = f(x)$,
  the $y$-axis and the lines $y = a$ and $y = b$, in cases where
  $x \geq 0\$throughout $a \leq y \leq b$, $x \leq 0\$throughout
  $a \leq y \leq b$ or where $x$ changes sign in the interval
  $a \leq y \leq b$ with or without the graph provided

- Use the fact that the graphs of $y = a^{x}$ and $y = \log_{a}x$ are
  reflections of each other in the line $y = x$ to solve problems
  involving areas between the $x$-axis or $y$-axis and a curve involving
  either an exponential or logarithmic function

- Recognise and use the result, where $f(x)$ is continuous on the
  interval $a \leq x \leq c$,
  $\int_{a}^{b}{f(x)dx} + \int_{b}^{c}{f(x)dx} = \int_{a}^{c}{f(x)dx}$
  for all $c$ such that $a \leq b \leq c$

- Define and use the result
  $\int_{a}^{b}{f(x)dx} = - \int_{b}^{a}{f(x)dx}$, where $f(x)$ is
  continuous on the interval $a \leq x \leq b$

- Recognise and use symmetry, particularly odd and even functions, to
  simplify and solve integration problems

- Use the Trapezoidal rule to approximate integrals

- Use an online computational application to evaluate definite and
  indefinite integrals involving functions within and beyond the scope
  of the Mathematics Advanced course

- Model and solve practical problems involving integrals and areas of
  regions bounded by a curve and the $x$-axis, or by a curve and the
  $y$-axis, involving functions within the scope of the Mathematics
  Advanced course

# Area Bounded by a Curve

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Area bounded by a curve**                                                                                                                                                                |
+======================================================+=======================================================================================================================================+
| If a question asks for the area bounded by the curve and the $x$-axis, give the positive value.                                                                                              |
+------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------+
| **All**                                              | **All** $\mathbf{f}\left( \mathbf{x} \right)\mathbf{\leq 0}$ **in region**                                                            |
| $\mathbf{f}\left( \mathbf{x} \right)\mathbf{\geq 0}$ |                                                                                                                                       |
| **in region**                                        | ![](media/Integral Calculus 3_Further Areas under Curves/media/image1.png){width="1.6076388888888888in"                               |
|                                                      | height="1.5743055555555556in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image2.png){width="1.6076388888888888in" |
| Area is the definite integral                        | height="1.5743055555555556in"}Area is the absolute value of the integral or the negative of the integral                              |
|                                                      |                                                                                                                                       |
| $$A = \int_{a}^{b}{f(x)dx}$$                         | $$A = \left| \int_{a}^{b}{f(x)dx} \right| = - \int_{a}^{b}{f(x)dx}$$                                                                  |
+------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** the area bounded by the curve and the $x$ axis using the integral                                                                                                                                                                                                                                                |
+=========================================================================================================+=========================================================================================================+=============================================================================================================+
| Find area bounded by:                                                                                                                                                                                                                                                                                                           |
+---------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| a.  $y = 2x + 1$, the $x$-axis, $x = 0$ and $x = 3$                                                     | b.  $y = 4 - x^{2}$, the $x$-axis, $x = - 2$ and $x = 2$                                                | c.  $y = x^{2} - 4$, the $x$-axis, $x = 0$ and $x = 2$                                                      |
|                                                                                                         |                                                                                                         |                                                                                                             |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image3.png){width="1.3993055555555556in" | ![](media/Integral Calculus 3_Further Areas under Curves/media/image4.png){width="1.4041666666666666in" | ![](media/Integral Calculus 3_Further Areas under Curves/media/image5.png){width="1.4041666666666666in"     |
| height="1.3777777777777778in"}                                                                          | height="1.3777777777777778in"}                                                                          | height="1.3777777777777778in"}                                                                              |
+---------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| d.  $y = x^{3} - 4x$, the $x$-axis, $x = - 2$ and $x = - 1$                                             | e.  $y = x^{2} + 1$, the $x$-axis, $x = 0$ and $x = 2$                                                  | f.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image8.png){width="1.3979166666666667in" |
|                                                                                                         |                                                                                                         |     height="1.3777777777777778in"} $y = - x^{2}$, the $x$-axis, $x = 1$ and $x = 3$                         |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image6.png){width="1.4in"                | ![](media/Integral Calculus 3_Further Areas under Curves/media/image7.png){width="1.4013888888888888in" |                                                                                                             |
| height="1.3777777777777778in"}                                                                          | height="1.3777777777777778in"}                                                                          |                                                                                                             |
+---------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| - **Area bounded by a curve**                                                                                                                                                                                                                                                                                                   |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| If a question asks for the area bounded by the curve and the $x$-axis, give the positive value.                                                                                                                                                                                                                                 |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| $\mathbf{f}\left( \mathbf{x} \right)$ **changes sign in region**                                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                                 |
| Split the region into smaller regions based on positive and negative definite integrals.                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                 |
| Add the absolute value of all the sub-integrals, or subtract the negative regions.                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                                 |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image9.png){width="2.761751968503937in" height="1.7716535433070866in"}                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                                 |
| $$A = \int_{a}^{b}{f(x)dx} + \left| \int_{b}^{c}{f(x)}dx \right| + \int_{c}^{d}{f(x)}dx$$                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                                                 |
| $$\ \ \ \  = \int_{a}^{b}{f(x)dx} - \int_{b}^{c}{f(x)}dx + \int_{c}^{d}{f(x)}dx$$                                                                                                                                                                                                                                               |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** how to split a region to find the area bounded by the curve and $x$-axis                                                                                                                                                                                                                                                    |
+==============================================================================================================+==============================================================================================================+==============================================================================================================+
| Find an expression for the area of the given region:                                                                                                                                                                                                                                                                                       |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image10.png){width="1.968503937007874in"  | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image11.png){width="1.968503937007874in"  | c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image12.png){width="1.9680555555555554in" |
|     height="1.9345636482939632in"}                                                                           |     height="1.936826334208224in"}                                                                            |     height="1.9340277777777777in"}                                                                           |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| d.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image13.png){width="1.9680555555555554in" | e.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image14.png){width="1.9442596237970253in" | f.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image15.png){width="1.9652777777777777in" |
|     height="1.9340277777777777in"}                                                                           |     height="1.9340277777777777in"}                                                                           |     height="1.9333333333333333in"}                                                                           |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| - **Area bounded by a curve**                                                                                                                                                                                                                                                                                                              |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| To find the area bounded by $y\  = \ f(x),$ the $x$-axis, and vertical lines$\ x = a$ and $x = b$:                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                            |
| 1.  Find the $x$-intercepts by solving $f(x) = 0$.                                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                            |
| 2.  Split the integral at each intercept that is within the region $\lbrack a,b\rbrack$.                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                                            |
| 3.  Sum the absolute values of each sub-integral.                                                                                                                                                                                                                                                                                          |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find the area bounded by a curve and the $x$-axis                                                                                                                                                     |
+=====================================================================================================================================================================================================================+
| Find the area bounded by $y = x^{2} - 5x + 4$, the $x$-axis, and the lines $x = - 1$ and $x = 4$.                                                                                                                   |
|                                                                                                                                                                                                                     |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image16.png){width="2.0030391513560803in" height="1.968503937007874in"}1. Find $x$-intercepts:                                                       |
|                                                                                                                                                                                                                     |
| $x^{2} - 5x + 4 = 0$ $(x - 4)(x - 1) = 0$                                                                                                                                                                           |
|                                                                                                                                                                                                                     |
| $x = 4,\ 1$                                                                                                                                                                                                         |
|                                                                                                                                                                                                                     |
| 2\. Split integral                                                                                                                                                                                                  |
|                                                                                                                                                                                                                     |
| $$\ \ \ \ \ \int_{- 1}^{1}\left( x^{2} - 5x + 4 \right)dx + \left| \int_{1}^{4}\left( x^{2} - 5x + 4 \right)dx \right|$$                                                                                            |
|                                                                                                                                                                                                                     |
| 3\. Sum absolute values of subintervals                                                                                                                                                                             |
|                                                                                                                                                                                                                     |
| $$= \left\lbrack \frac{x^{3}}{3} - \frac{5x^{2}}{2} + 4x \right\rbrack_{- 1}^{1} + \left| \left\lbrack \frac{x^{3}}{3} - \frac{5x^{2}}{2} + 4x \right\rbrack_{1}^{4} \right|$$                                      |
|                                                                                                                                                                                                                     |
| $$= \left( \frac{1}{3} - \frac{5}{2} + 4 \right) - \left( - \frac{1}{3} - \frac{5}{2} - 4 \right) + \left| \left( \frac{64}{3} - \frac{80}{2} + 16 \right) - \left( \frac{1}{3} - \frac{5}{2} + 4 \right) \right|$$ |
|                                                                                                                                                                                                                     |
| $$= \frac{26}{3} + \left| - \frac{9}{2} \right|$$                                                                                                                                                                   |
|                                                                                                                                                                                                                     |
| $$= \frac{79}{6} = 13.1\dot{6}\ {units}^{2}$$                                                                                                                                                                       |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                    |
+==========================================================================================================+
| a.  Find the area bounded by $y = x² - x - 2$, the $x$-axis, and lines $x = - 2$ and $x = 1$.            |
|                                                                                                          |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image17.png){width="2.003038057742782in"  |
| height="1.968503937007874in"}                                                                            |
|                                                                                                          |
| $$\frac{31}{6}\ u^{2}$$                                                                                  |
+----------------------------------------------------------------------------------------------------------+
| b.  Find the area enclosed between the $x$ axis and $y = x(x + 1)(x - 2)$.                               |
|                                                                                                          |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image18.png){width="2.0006944444444446in" |
| height="1.9680555555555554in"}                                                                           |
|                                                                                                          |
| $$\frac{37}{12}\ u^{2}$$                                                                                 |
+----------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The key difference between \'evaluate the integral\' and      |
|     \'find the area\' is that area is always                      |
|     ........................                                      |
|                                                                   |
| 2.  If you are asked to find the area between $f(x)$ and the      |
|     $x$-axis between $x \in \lbrack a,b\rbrack$:                  |
|                                                                   |
|     a.  If $f(x)\  \geq \ 0$ throughout: Area =                   |
|         ........................                                  |
|                                                                   |
|     b.  If $f(x)\  \leq \ 0$ throughout: Area =                   |
|         ........................                                  |
|                                                                   |
|     c.  If $f(x)$ changes sign: .................. the integral   |
|         at each intercept                                         |
+-------------------------------------------------------------------+

Foundation

1.  Find the area of each shaded region below by evaluating the
    appropriate integral.

+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image19.png){width="1.5357141294838146in" | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image19.png){width="1.5354166666666667in" | c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image19.png){width="1.5354166666666667in" |
|     height="1.6431758530183727in"}                                                                           |     height="1.6428576115485565in"}                                                                           |     height="1.6428576115485565in"}                                                                           |
|                                                                                                              |                                                                                                              |                                                                                                              |
| 4 u²                                                                                                         | 26 u²                                                                                                        | 81 u²                                                                                                        |
+==============================================================================================================+==============================================================================================================+==============================================================================================================+
| d.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image19.png){width="1.5354166666666667in" | e.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image20.png){width="1.5229166666666667in" | f.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image20.png){width="1.5229166666666667in" |
|     height="1.6428576115485565in"}                                                                           |     height="1.36875in"}                                                                                      |     height="1.36875in"}                                                                                      |
|                                                                                                              |                                                                                                              |                                                                                                              |
| 12 u²                                                                                                        | 9 u²                                                                                                         | $$\frac{20}{3}\ u^{2}$$                                                                                      |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| g.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image20.png){width="1.5229166666666667in" | h.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image20.png){width="1.5229166666666667in" | i.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image20.png){width="1.5229166666666667in" |
|     height="1.36875in"}                                                                                      |     height="1.4854166666666666in"}                                                                           |     height="1.4854166666666666in"}                                                                           |
|                                                                                                              |                                                                                                              |                                                                                                              |
| $$\frac{128}{3}\ u^{2}$$                                                                                     | 6 u²                                                                                                         | $$\frac{1}{4}\ u^{2}$$                                                                                       |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| j.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image20.png){width="1.5229166666666667in" | k.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image20.png){width="1.5229166666666667in" | l.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image20.png){width="1.5229166666666667in" |
|     height="1.504854549431321in"}                                                                            |     height="1.5145636482939633in"}                                                                           |     height="1.5145636482939633in"}                                                                           |
|                                                                                                              |                                                                                                              |                                                                                                              |
| $$\frac{343}{6}\ u^{2}$$                                                                                     | 36 u²                                                                                                        | 60 u²                                                                                                        |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+

2.  Find the area of each shaded region below by evaluating the
    appropriate integral.

+--------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image21.png){width="1.5625in" | b.                                                                                                                             |
|     height="1.5339796587926509in"}                                                               |                                                                                                                                |
|                                                                                                  | $$\frac{27}{2}\ u^{2}$$                                                                                                        |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image21.png){width="1.5625in"     |                                                                                                                                |
| height="1.5339796587926509in"}                                                                   |                                                                                                                                |
|                                                                                                  |                                                                                                                                |
| $$\frac{4}{3}\ u^{2}$$                                                                           |                                                                                                                                |
+==================================================================================================+================================================================================================================================+
| c.                                                                                               | d.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image21.png){width="1.5625in"                               |
|                                                                                                  |     height="1.5333333333333334in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image21.png){width="1.5625in" |
| $$\frac{81}{4}\ u^{2}$$                                                                          |     height="1.5339796587926509in"}                                                                                             |
|                                                                                                  |                                                                                                                                |
|                                                                                                  | $$46\frac{2}{5}\ u^{2}$$                                                                                                       |
+--------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------+

3.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image22.png){width="2.044540682414698in"
    height="1.968503937007874in"}The line $y = x + 1$ is graphed.

    a.  Shade the region between the line $y = x + 1$\
        and the $x$-axis from $x = - 3$ to $x = 2$.

    b.  By evaluating $\int_{- 1}^{2}(x\  + \ 1)dx$,\
        find the area of the shaded region above the $x$-axis.

4.5 u²

c.  By evaluating $\int_{- 3}^{- 1}(x\  + \ 1)dx$,\
    find the area of the shaded region below the $x$-axis.

2 u²

d.  Hence find the area of the entire shaded region.

6.5 u²

e.  Find $\int_{- 3}^{2}(x\  + \ 1)dx$, and explain why this integral
    does not give the area of the shaded region.

2.5 u²

This is the area above the $x$-axis minus the area below it, not the
total area.

4.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image23.png){width="1.968503937007874in"
    height="1.6700010936132983in"}The curve
    $y = (x - 1)(x + 3) = x^{2} + 2x - 3$ is graphed.

    a.  Shade the region between the curve $y = (x - 1)(x + 3)$\
        and the $x$-axis from $x = - 3$ to $x = 2$.

    b.  By evaluating
        $\int_{- 3}^{1}\left( x^{2} + \ 2x\  - \ 3 \right)dx$,\
        find the area of the shaded region below the $x$-axis.

$$10\frac{2}{3}\ u^{2}$$

c.  By evaluating $\int_{1}^{2}\left( x^{2} + \ 2x\  - \ 3 \right)dx$,\
    find the area of the shaded region above the $x$-axis.

$$2\frac{1}{3}\ u^{2}$$

d.  Hence find the area of the entire shaded region.

13 u²

e.  Find $\int_{- 3}^{2}\left( x^{2} + \ 2x\  - \ 3 \right)dx$, and
    explain why this integral does not give the area of the shaded
    region.

$$- 8\frac{1}{3}\ u^{2}$$

This is the area above the $x$-axis minus the area below it, not the
total area.

5.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image24.png){width="1.6770833333333333in"
    height="1.6694444444444445in"}The curve
    $y\  = \ x(x\  + \ 1)(x\  - \ 2) = \ x^{3} - \ x^{2} - \ 2x$ is
    graphed.

    a.  Shade the region bounded by the curve and the $x$-axis.

    b.  By evaluating
        $\int_{0}^{2}\left( x^{3} - \ x^{2} - \ 2x \right)dx$,\
        find the area of the shaded region below the $x$-axis.

$$2\frac{2}{3}\ u^{2}$$

c.  By evaluating
    $\int_{- 1}^{0}\left( x^{3} - \ x^{2} - \ 2x \right)dx$,\
    find the area of the shaded region above the $x$-axis.

$$\frac{5}{12}\ u^{2}$$

d.  Hence find the area of the entire region you have shaded.

$$3\frac{1}{12}\ u^{2}$$

e.  Find $\int_{- 1}^{2}\left( x^{3} - \ x^{2} - \ 2x \right)dx$, and
    explain why this integral does not give the area of the shaded
    region.

$$- \ 2\frac{1}{4}\ u^{2}$$

This is the area above the $x$-axis minus the area below it, not the
total area.

Development

6.  In each part, find the area of the region bounded by the graph of
    the function and the $x$-axis between the specified values. Areas
    above and below the $x$-axis must be calculated separately.\
    A sketch of the curve will help.

    a.  $y\  = \ x²,$ between $x\  = \  - 3$ and $x\  = \ 2$

$y\  = \ x²,$ always ≥ 0, so entire region is above x-axis.

$$A\  = \ \int_{- 3}^{2}x^{2}\ dx\  = \ \left\lbrack \frac{x^{3}}{3} \right\rbrack - 3^{2} = \frac{8}{3} + \ 9\  = \frac{35}{3} = \ 11\frac{2}{3}u^{2}$$

b.  $y\  = \ 2x³,$ between $x\  = \  - 4$ and $x\  = \ 1$

$y\  = \ 2x³,$ zero at $x$ = 0. Below $x$-axis on \[−4, 0\], above on
\[0, 1\].

$$Below:\  - \int_{- 4}^{0}{2x^{3}}dx\  = \  - \left\lbrack \frac{x^{4}}{2} \right\rbrack - 4^{0} = \  - (0\  - \ 128) = \ 128$$

$$Above:\ \int_{0}^{1}{2x^{3}}dx\  = \ \left\lbrack \frac{x^{4}}{2} \right\rbrack_{0}^{1} = \frac{1}{2}$$

$$Total\  = \ 128\  + \frac{1}{2} = \ 128\frac{1}{2}u^{2}$$

c.  $y\  = \ 3x(x\  - \ 2),\$between $x\  = \ 0$ and $x\  = \ 2$

$y\  = \ 3x(x\  - \ 2),$ zeros at $x\  = \ 0\$and $x\  = \ 2$. Below
$x$-axis on (0, 2).

$$A\  = \  - \int_{0}^{2}\left( 3x^{2} - \ 6x \right)dx$$

$$= \  - \left\lbrack x^{3} - \ 3x^{2} \right\rbrack_{0}^{2}$$

$$= \  - \left\lbrack (8\  - \ 12) - \ 0 \right\rbrack$$

= 4 u²

d.  $y\  = \ x\  - \ 3$, between $x\  = \  - 1$ and $x\  = \ 4$

$y\  = \ x\  - \ 3$, zero at $x\  = \ 3$. Below $x$-axis on \[−1, 3\],
above on \[3, 4\].

$$Below:\  - \int_{- 1}^{3}(x\  - \ 3)dx\  = \  - \left\lbrack \frac{x^{2}}{2} - \ 3x \right\rbrack - 1^{3} = \  - \left\lbrack \left( \frac{9}{2} - \ 9 \right) - \ \left( \frac{1}{2} + \ 3 \right) \right\rbrack = \ 8$$

$$Above:\ \int_{3}^{4}(x\  - \ 3)dx\  = \ \left\lbrack \frac{x^{2}}{2} - \ 3x \right\rbrack_{3}^{4} = \ (8\  - \ 12) - \ \left( \frac{9}{2} - \ 9 \right) = \frac{1}{2}$$

$$Total\  = \ 8\  + \frac{1}{2} = \ 8\frac{1}{2}u^{2}$$

e.  $y\  = \ (x\  - \ 1)(x\  + \ 3)(x\  - \ 2)$, between $x\  = \  - 3$
    and $x\  = \ 2$

$$y = x³\  - \ 7x\  + \ 6$$

Zeros at $x\  = \  - 3,\ 1,\ 2.\$\
On (−3, 1): check $x\  = \ 0,\ y\  = \ 6\  > \ 0$, above.\
On (1, 2): check $x\  = \ 1.5,\ y\  = \  - 1.125$, below.

$$F(x) = \frac{x^{4}}{4} - \frac{7x^{2}}{2} + \ 6x$$

$$F( - 3) = - \frac{117}{4},\ \ F(1) = \frac{11}{4},\ \ F(2) = \ 2$$

$$Above:\ F(1) - \ F( - 3) = \frac{11}{4} + \frac{117}{4} = 32$$

$$Below:\  - \left\lbrack F(2) - \ F(1) \right\rbrack = \  - \left\lbrack 2\  - \frac{11}{4} \right\rbrack = \frac{3}{4}$$

$$Total\  = \ 32\  + \frac{3}{4} = \ 32\frac{3}{4}u^{2}$$

f.  $y\  = \  - 2x(x\  + \ 1)$, between $x\  = \  - 2$ and $x\  = \ 2$

$y\  = \  - 2x(x\  + \ 1) = \  - 2x^{2} - \ 2x$, zeros at $x\  = \  - 1$
and $x\  = \ 0.$

On (−2, −1): check $x\  = \  - 1.5,\ y\  = \  - 1.5$, below.

On (−1, 0): check $x\  = \  - 0.5,\ y\  = \ 0.5$, above.

On (0, 2): check $x\  = \ 1,\ y\  = \  - 4$, below.

$$F(x) = \  - \frac{2x^{3}}{3} - \ x^{2}$$

$$F( - 2) = \frac{4}{3},\ \ F( - 1) = - \frac{1}{3},\ \ F(0) = \ 0,\ \ F(2)\  = \  - \frac{28}{3}$$

$$Below\ on\ \lbrack - 2,\  - 1\rbrack:\  - \left\lbrack F( - 1) - \ F( - 2) \right\rbrack = \frac{5}{3}$$

$$Above\ on\ \lbrack - 1,\ 0\rbrack:\ F(0) - \ F( - 1) = \frac{1}{3}$$

$$Below\ on\ \lbrack 0,\ 2\rbrack:\  - \left\lbrack F(2) - \ F(0) \right\rbrack = \frac{28}{3}$$

$$Total\  = \frac{5}{3} + \frac{1}{3} + \frac{28}{3} = \frac{34}{3}u^{2}$$

7.  Look carefully for any symmetries that will simplify the
    calculation.

Find the area of the region bounded by the given curve and the x-axis.

a.  $y = x^{7},\$for$\  - 2 \leq x \leq \ 2$

$y\  = \ x⁷$ is odd, so the area on \[−2, 0\] equals the area on \[0,
2\]. On \[0, 2\], curve is above x-axis.

$$A\  = \ 2\int_{0}^{2}x^{7}dx\  = \ 2\left\lbrack \frac{x^{8}}{8} \right\rbrack_{0}^{2} = \ 2\left( \frac{256}{8} \right)\  = \ 64\ u²\ $$

b.  $y = x^{3} - \ 16x = x(x\  - \ 4)(x\  + \ 4),\$for$\  - 4\  \leq \ x\  \leq \ 4$

$y\  = \ x³\  - \ 16x\  = \ x(x\  - \ 4)(x\  + \ 4).$ Odd function, so
symmetric about origin. Zeros at $x\  = \  - 4,\ 0,\ 4.$

On \[0, 4\], $y\  = \ x(x\  - \ 4)(x\  + \ 4)\  \leq \ 0$ (check x = 2:
2(−2)(6) = −24, below x-axis).

By symmetry:
$A\  = \ 2\  \times \ \left( - \int_{0}^{4}\left( x^{3} - \ 16x \right)dx \right)$

$$\int_{0}^{4}\left( x^{3} - \ 16x \right)dx\  = \ \left\lbrack \frac{x^{4}}{4} - \ 8x^{2} \right\rbrack_{0}^{4} = \ (64\  - \ 128) = \  - 64$$

$A\  = \ 2(64)\  = \ 128$ u²

c.  $y = x^{4} - \ 9x^{2} = x^{2}(x\  - \ 3)(x\  + \ 3),\$for$\  - 3\  \leq \ x\  \leq \ 3$

$y\  = \ x⁴\  - \ 9x²\  = \ x²(x\  - \ 3)(x\  + \ 3).$ Even function, so
symmetric about y-axis. Zeros at $x\  = \  - 3,\ 0,\ 3.$

On \[0, 3\], curve is below x-axis (check x = 1: 1 − 9 = −8).

$$A\  = \ 2\  \times \ \left( - \int_{0}^{3}\left( x^{4} - \ 9x^{2} \right)dx \right)$$

$$\int_{0}^{3}\left( x^{4} - \ 9x^{2} \right)dx\  = \ \left\lbrack \frac{x^{5}}{5} - \ 3x^{3} \right\rbrack_{0}^{3} = \ \left( \frac{243}{5} - \ 81 \right) = - \frac{162}{5}$$

$$A\  = \ 2\left( \frac{162}{5} \right) = \frac{324}{5} = \ 64\frac{4}{5}u^{2}$$

8.  Find the area of the region bounded by $y\  = \ |x\  + \ 2|$ and the
    $x$-axis, for −$2\  \leq x \leq \ 2$.

$y\  = \ |x\  + \ 2|,$ zero at $x\  = \  - 2$. For
$- 2\  \leq \ x\  \leq \ 2$, we have $x\  + \ 2\  \geq \ 0$, so
$y\  = \ x\  + \ 2.$

$$A\  = \ \int_{- 2}^{2}(x\  + \ 2)\ dx$$

$$= \ \left\lbrack \frac{x^{2}}{2} + \ 2x \right\rbrack - 2^{2}$$

$$= \ (2\  + \ 4)\  - \ (2\  - \ 4)$$

= 8 u²

# Area Bounded by the $\mathbf{y}$-axis 

+----------------------------------------------------------------------+
| - **Review**                                                         |
+======================================================================+
| - Rearrange to make $x$ the subject                                  |
|                                                                      |
| +--------------------+--------------------+------------------------+ |
| | a.  $y = x + 1$    | b.  $y = x^{3}$    | c.  $y = \sqrt{x + 1}$ | |
| +====================+====================+========================+ |
+----------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------+
| - **Dummy Variable Property**                                                                           |
+=========================================================================================================+
| The value of a definite integral only depends on the limits and the integrand.                          |
|                                                                                                         |
| The variable name can be anything.                                                                      |
|                                                                                                         |
| $$\int_{a}^{b}{f(x)}dx = \int_{a}^{b}{f(y)}dy = \int_{a}^{b}{f(t)}dt = \int_{a}^{b}{f(\theta)}d\theta$$ |
+---------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------+
| - **Integrate** with any variable                                                                                   |
+===========================+============================================+============================================+
| Find each indefinite integral.                                                                                      |
+---------------------------+--------------------------------------------+--------------------------------------------+
| a.  $\int_{}^{}(m + 1)dm$ | b.  $\int_{}^{}\left( t^{2} - 7 \right)dt$ | c.  $\int_{}^{}\left( h^{7} + 5 \right)dh$ |
+---------------------------+--------------------------------------------+--------------------------------------------+
| d.  $\int_{}^{}(y - 3)dy$ | e.  $\int_{}^{}\left( b^{2} + b \right)db$ | f.  $\int_{}^{}(2y + 4)dy$                 |
+---------------------------+--------------------------------------------+--------------------------------------------+
| g.  If $\frac{dx}{dt}$ $= (t - 3)^{2}$ and $x = 7$ when $t = 0,$ find then $t = 4$.                                 |
|                                                                                                                     |
| $$\frac{49}{3}$$                                                                                                    |
+---------------------------------------------------------------------------------------------------------------------+
| h.  The velocity of an object is given by $\frac{dx}{dt}$ $= 6t - 5$. If the object has initial displacement of −2, |
|     find the equation for the displacement.                                                                         |
|                                                                                                                     |
| $$x\  = \ 3t^{2} - \ 5t\  - \ 2$$                                                                                   |
+---------------------------------------------------------------------------------------------------------------------+
| i.  The rate of flow of water into a dam is given by $R = 500 + 20t\ L\ h⁻¹.$ If there is 15 000 L of water         |
|     initially in the dam, how much water will there be in the dam after 10 hours?                                   |
|                                                                                                                     |
| $$21000\ L$$                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------+
| - **Integrating with Respect to** $\mathbf{y}$                                                           |
+==========================================================================================================+
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image25.png){width="1.9965277777777777in" |
| height="1.967937445319335in"}The area bounded by a curve and the $y$-axis is:                            |
|                                                                                                          |
| $$\int_{a}^{b}{f(y)}dy$$                                                                                 |
|                                                                                                          |
| - The definite integral returns a **positive value** when the\                                           |
|   function is to the **right** of the $y$-axis and a **negative value**\                                 |
|   when the function is to the **left** of the $y$-axis.                                                  |
|                                                                                                          |
| - Split the integral at the $y$-intercepts if there are areas left of the $y$-axis.                      |
+----------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------+
| - **Example** Find area bound by a function and the $y$-axis                                             |
+==========================================================================================================+
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image26.png){width="1.9979166666666666in" |
| height="1.9659722222222222in"}Find the area bounded by $x = y^{2}$, the $y$-axis, $y = 1$ and $y = 3.$   |
|                                                                                                          |
| $$\ \ \ \ \ \int_{1}^{3}y^{2}dy$$                                                                        |
|                                                                                                          |
| $$= \left\lbrack \frac{y^{3}}{3} \right\rbrack_{1}^{3}$$                                                 |
|                                                                                                          |
| $$= \left( \frac{27}{3} \right) - \left( \frac{1}{3} \right)$$                                           |
|                                                                                                          |
| $$= \frac{26}{3}\ u^{2}$$                                                                                |
+----------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                                                                                               |
+==========================================================================================================+==========================================================================================================+
| a.  Find the area between $x = \sqrt[3]{y - 1}$\                                                         | b.  Find the area between $x = y(y - 2)$ and the lines $y = 0$ and $y =$ $\frac{5}{2}$                   |
|     the $y$-axis, and $y = 1,\ y = 2$                                                                    |                                                                                                          |
|                                                                                                          | ![](media/Integral Calculus 3_Further Areas under Curves/media/image28.png){width="1.9944444444444445in" |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image27.png){width="1.9945330271216097in" | height="1.9479166666666667in"}                                                                           |
| height="1.9659722222222222in"}                                                                           |                                                                                                          |
|                                                                                                          | $$\frac{13}{8}\ u^{2}$$                                                                                  |
| $$\frac{3}{4}\ u^{2}$$                                                                                   |                                                                                                          |
+----------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| - **Integrating with Respect to** $\mathbf{y}$                                                                                                                                                                      |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Sometimes you may need to find the area between the curve and the $y$-axis.                                                                                                                                         |
|                                                                                                                                                                                                                     |
| 1.  If the function is in terms of $x$, rearrange it in terms of $y$.                                                                                                                                               |
|                                                                                                                                                                                                                     |
| 2.  If the limits are in terms of $x$, convert them to the equivalent in $y$.                                                                                                                                       |
|                                                                                                                                                                                                                     |
| 3.  Integrate with new limits and integrand.                                                                                                                                                                        |
|                                                                                                                                                                                                                     |
| - Split the integral at the $y$-intercepts if there are areas left of the $y$-axis.                                                                                                                                 |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find area bound by a function and the $y$-axis                                                                                                                                                                                                  |
+===============================================================================================================================================================================================================================================================+
| Find the area bounded by $y = x^{3}$, the $y$-axis, $x = 0$ and $x = 2.$                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                               |
| +-------------------------------+----------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+ |
| | 1\. Rearrange function        | 3\. Integrate                                                                                                  | ![](media/Integral Calculus 3_Further Areas under Curves/media/image29.png){width="1.9983989501312336in" | |
| |                               |                                                                                                                | height="1.968503937007874in"}                                                                            | |
| | $$\ \ \ \ \ y = x^{3}$$       | $$\ \ \ \ \int_{0}^{8}\sqrt[3]{y}dy = \left\lbrack \frac{y^{\frac{4}{3}}}{\frac{4}{3}} \right\rbrack_{0}^{8}$$ |                                                                                                          | |
| |                               |                                                                                                                |                                                                                                          | |
| | $$\ \ \ \ \ x = \sqrt[3]{y}$$ | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = 12 - 0$$                                                    |                                                                                                          | |
| |                               |                                                                                                                |                                                                                                          | |
| | 2\. Change limits             | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = 12\ u^{2}$$                                                 |                                                                                                          | |
| |                               |                                                                                                                |                                                                                                          | |
| | When $x = 0,\ y = 0^{3} = 0$  |                                                                                                                |                                                                                                          | |
| |                               |                                                                                                                |                                                                                                          | |
| | $x = 2,\ y = 2^{3} = 8$       |                                                                                                                |                                                                                                          | |
| +===============================+================================================================================================================+==========================================================================================================+ |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                                                     |
+===================================+=======================================================================================================================================+
| a.  Find the area between         | b.  Find the area between $y = \sqrt{x + 1}$ and the lines $x = - 1$ and $x = 8$                                                      |
|     $y = x + 1$,\                 |                                                                                                                                       |
|     the $y$-axis, and             | ![](media/Integral Calculus 3_Further Areas under Curves/media/image30.png){width="2.0097222222222224in"                              |
|     $x = 0,\ x = 4$               | height="1.9680555555555554in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image31.png){width="2.003079615048119in" |
|                                   | height="1.968503937007874in"}                                                                                                         |
| 8                                 |                                                                                                                                       |
|                                   | $$7\frac{1}{3}$$                                                                                                                      |
+-----------------------------------+---------------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  Find the area of each shaded region below by evaluating an integral
    of the form $\int_{y_{1}}^{y_{2}}{g(y)}dy$.

+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image32.png){width="1.5533978565179352in" | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image32.png){width="1.4270833333333333in" | c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image32.png){width="1.4951388888888888in" |
|     height="1.504854549431321in"}                                                                            |     height="1.5041666666666667in"}                                                                           |     height="1.5041666666666667in"}                                                                           |
|                                                                                                              |                                                                                                              |                                                                                                              |
| 25 u²                                                                                                        | 8 u²                                                                                                         | 4 u²                                                                                                         |
+==============================================================================================================+==============================================================================================================+==============================================================================================================+
| d.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image32.png){width="1.4951388888888888in" | e.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image32.png){width="1.4951388888888888in" | f.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image32.png){width="1.4951388888888888in" |
|     height="1.5041666666666667in"}                                                                           |     height="1.5041666666666667in"}                                                                           |     height="1.5041666666666667in"}                                                                           |
|                                                                                                              |                                                                                                              |                                                                                                              |
| 108 u²                                                                                                       | $$\frac{9}{2}\ u^{2}$$                                                                                       | $$34\frac{2}{3}\ u^{2}$$                                                                                     |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| g.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image32.png){width="1.4951388888888888in" | h.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image32.png){width="1.4951388888888888in" | i.                                                                                                           |
|     height="1.5041666666666667in"}                                                                           |     height="1.5041666666666667in"}                                                                           |                                                                                                              |
|                                                                                                              |                                                                                                              |                                                                                                              |
| 18 u²                                                                                                        | 2 u²                                                                                                         |                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+

2.  Find the area of each shaded region below by evaluating the
    appropriate integral.

+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image33.png){width="1.5055555555555555in" | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image33.png){width="1.5055555555555555in" |
|     height="1.5666666666666667in"}                                                                           |     height="1.5666666666666667in"}                                                                           |
|                                                                                                              |                                                                                                              |
| $$\frac{9}{2}\ u^{2}$$                                                                                       | $$\frac{4}{3}\ u^{2}$$                                                                                       |
+==============================================================================================================+==============================================================================================================+
| c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image33.png){width="1.376344050743657in"  | d.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image33.png){width="1.5694444444444444in" |
|     height="1.5666666666666667in"}                                                                           |     height="1.5666666666666667in"}                                                                           |
|                                                                                                              |                                                                                                              |
| $$\frac{45}{4}\ u^{2}$$                                                                                      | 9 u²                                                                                                         |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+

3.  In each part, find the area of the region bounded by function and
    the $y$-axis between the specified values. Areas to the right and to
    the left of the $y$-axis must be calculated separately.

    a.  $x\  = \ y\  - \ 5$, between $y\  = \ 0$ and $y\  = \ 6$

$x\  = \ y\  - \ 5$, zero at $y\  = \ 5$. From $y\  = \ 0$ to
$y\  = \ 5,\ x\  < \ 0$ (left of y-axis). From $y\  = \ 5\$to
$y\  = \ 6,\ x\  > \ 0$.

$$Left: - \int_{0}^{5}(y\  - \ 5)dy\  = \  - \left\lbrack \frac{y^{2}}{2} - \ 5y \right\rbrack_{0}^{5} = \  - \left( \frac{25}{2} - \ 25 \right) = \frac{25}{2}$$

$$Right:\ \int_{5}^{6}(y\  - \ 5)dy\  = \ \left\lbrack \frac{y^{2}}{2} - \ 5y \right\rbrack_{5}^{6} = \ (18\  - \ 30) - \ \left( \frac{25}{2} - \ 25 \right) = \frac{1}{2}$$

$$Total\  = \frac{25}{2} + \frac{1}{2} = \ 13\ u^{2}$$

b.  $x\  = \ 3\  - \ y$, between $y\  = \ 2$ and $y\  = \ 5$

$x\  = \ 3\  - \ y,$ zero at $y\  = \ 3$. From $y\  = \ 2\$to
$y\  = \ 3,\ x\  > \ 0.\$From $y\  = \ 3\$to $y\  = \ 5,\ x\  < \ 0$.

$$Right:\ \int_{2}^{3}(3\  - \ y)dy\  = \ \left\lbrack 3y\  - \frac{y^{2}}{2} \right\rbrack_{2}^{3} = \ \left( 9\  - \frac{9}{2} \right) - \ (6\  - \ 2) = \frac{1}{2}$$

$$Left:\  - \int_{3}^{5}(3\  - \ y)dy\  = \  - \left\lbrack 3y\  - \frac{y^{2}}{2} \right\rbrack_{3}^{5} = \  - \left\lbrack \left( 15\  - \frac{25}{2} \right) - \ \left( 9\  - \frac{9}{2} \right) \right\rbrack = \ \ 2$$

$$Total\  = \frac{1}{2} + \ 2\  = \frac{5}{2} = \ 2\frac{1}{2}u^{2}$$

c.  $x\  = \ y²$, between $y\  = \  - 1$ and $y\  = \ 3$

$x\  = \ y²$, always ≥ 0 (right of y-axis). From $y\  = \  - 1$ to
$y\  = \ 3$, entire region is to the right.

$$A\  = \ \int_{- 1}^{3}y^{2}dy\  = \ \left\lbrack \frac{y^{3}}{3} \right\rbrack - 1^{3} = \ 9\  + \frac{1}{3} = \ 9\frac{1}{3}u^{2}$$

d.  $x\  = \ (y\  - \ 1)(y\  + \ 1)$, between $y\  = \ 3$ and
    $y\  = \ 0$

$x\  = \ (y\  - \ 1)(y\  + \ 1)\  = \ y²\  - \ 1,$ zeros at
$y\  = \  \pm 1$. Right of $y$-axis when $|y|\  > \ 1$, left when
$|y|\  < \ 1$.

From $y\  = \ 0$ to $y\  = \ 1,\ x\  < \ 0$ (left). From $y\  = \ 1$ to
$y\  = \ 3,\ x\  > \ 0$ (right).

$$Left:\  - \int_{0}^{1}\left( y^{2} - \ 1 \right)dy\  = \  - \left\lbrack \frac{y^{3}}{3} - \ y \right\rbrack_{0}^{1} = \  - \left( \frac{1}{3} - \ 1 \right) = \frac{2}{3}$$

$$Right:\ \int_{1}^{3}\left( y^{2} - \ 1 \right)dy\  = \ \left\lbrack \frac{y^{3}}{3} - \ y \right\rbrack_{1}^{3} = \ (9\  - \ 3) - \ \left( \frac{1}{3} - \ 1 \right) = \frac{20}{3}$$

$$Total\  = \frac{2}{3} + \frac{20}{3} = \ 7\frac{1}{3}u^{2}$$

4.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image34.png){width="1.8833125546806648in"
    height="1.7716535433070866in"}Sketch the curve and look carefully
    for any symmetries that will simplify the calculation.\
    Find the area of the region bounded by the given curve and the
    $y$-axis.

    a.  $x = 2y,\$for$\  - 5\  \leq \ y\  \leq \ 5$

![](media/Integral Calculus 3_Further Areas under Curves/media/image35.png){width="1.8763746719160106in"
height="1.7716535433070866in"}

$x\  = \ 2y$ is odd in $y$. Right of $y$-axis on (0, 5), left on (−5,
0). By symmetry:

$$A\  = \ 2\int_{0}^{5}{2y}dy\  = \ 2\left\lbrack y^{2} \right\rbrack_{0}^{5} = \ 2(25) = \ 50\ u^{2}$$

b.  $x = y²,\$for$\  - 3\  \leq \ y\  \leq \ 3$

![](media/Integral Calculus 3_Further Areas under Curves/media/image36.png){width="1.8821861329833771in"
height="1.7716535433070866in"}

$x\  = \ y²$, always ≥ 0. Even function, symmetric about x-axis. By
symmetry:

$$A\  = \ 2\int_{0}^{3}y^{2}dy\  = \ 2\left\lbrack \frac{y^{3}}{3} \right\rbrack_{0}^{3} = \ 2(9) = \ 18\ u^{2}$$

c.  $x = 4 - y^{2} = (2 - y)(2 + y),\$for$\  - 2\  \leq \ y\  \leq \ 2$

$x\  = \ 4\  - \ y²\  = \ (2\  - \ y)(2\  + \ y),$ zeros at
$y\  = \  \pm 2$. Right of $y$-axis on (−2, 2). Even function, so:

$$A\  = \ 2\int_{0}^{2}\left( 4\  - \ y^{2} \right)dy\  = \ 2\left\lbrack 4y\  - \frac{y^{3}}{3} \right\rbrack_{0}^{2} = \ 2\left( 8\  - \frac{8}{3} \right) = \frac{32}{3}u^{2}$$

Development

5.  The diagram shows the parabola $y² = \ 16(2\  - \ x).$

    a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image37.png){width="1.7693449256342957in"
        height="1.6796555118110237in"}Find the $x$-intercept and the
        $y$-intercepts.

$x$-intercept: set $y\  = \ 0,$ so $0\  = \ 16(2\  - \ x),\ x\  = \ 2$.
Intercept: (2, 0).

$y$-intercepts: set $x\  = \ 0$, so
$y²\  = \ 32,\ y\  = \  \pm 4\sqrt{2}$. Intercepts:
$\left( 0,\ 4\sqrt{2} \right)$ and $\left( 0,\  - 4\sqrt{2} \right)$.

b.  Find the exact area of the shaded region:

    i.  by integrating $y\  = \ 4\sqrt{2\  - \ x}$ with respect to $x$.

$$A\  = \ \int_{0}^{2}{4\sqrt{2\  - \ x}}dx$$

$$= \ 4\left\lbrack - \frac{2(2\  - \ x)^{\frac{3}{2}}}{3} \right\rbrack_{0}^{2}$$

$$= \ 4\left\lbrack 0\  + \frac{2\left( 2\sqrt{2} \right)}{3} \right\rbrack$$

$$= \ 16\frac{\sqrt{2}}{3}u^{2}$$

ii. by integrating with respect to $y$. (You will need to make $x$ the
    subject of the equation.)

$$x\  = \ 2\  - \frac{y^{2}}{16}$$

$$A\  = \ \int_{0}^{4\sqrt{2}}\left( 2\  - \frac{y^{2}}{16} \right)dy$$

$$= \ \left\lbrack 2y\  - \frac{y^{3}}{48} \right\rbrack_{0}^{4\sqrt{2}}$$

$$= \ 8\sqrt{2} - \frac{128\sqrt{2}}{48}$$

$$= \ 16\frac{\sqrt{2}}{3}u^{2}$$

6.  Find the area bounded by the line $y = 2x + 1$, the $y$-axis and the
    lines $y\  = \ 3$ and $y\  = \ 4$.

Need to make $x$ the subject. $x =$ $\frac{y - 1}{2}$

$$A\  = \ \int_{3}^{4}\frac{y\  - \ 1}{2}dy$$

$$= \ \left( \frac{1}{2} \right)\left\lbrack \frac{y^{2}}{2} - \ y \right\rbrack_{3}^{4}$$

$$= \ \left( \frac{1}{2} \right)\left\lbrack (8\  - \ 4) - \ \left( \frac{9}{2} - \ 3 \right) \right\rbrack$$

$$= \frac{5}{4} = \ 1\frac{1}{4}units^{2}$$

Mastery

7.  Find the area enclosed by the curve $y\  = \ \sqrt{3x\  - \ 5}$, the
    $y$-axis and the lines $y = 2$ and $y = 3$.

$$A\  = \ \int_{2}^{3}\frac{y^{2} + \ 5}{3}dy$$

$$= \ \left( \frac{1}{3} \right)\left\lbrack \frac{y^{3}}{3} + \ 5y \right\rbrack_{2}^{3}$$

$$= \ \left( \frac{1}{3} \right)\left\lbrack (9\  + \ 15) - \ \left( \frac{8}{3} + \ 10 \right) \right\rbrack$$

$$= \frac{34}{9} = \ 3\frac{7}{9}units^{2}$$

8.  Find the area enclosed between the curve $y\  = \ x^{3} - \ 2$ and
    the $y$-axis between $y\  = \  - 1\$and $y\  = \ 25.$

$$A\  = \ \int_{- 1}^{25}(y\  + \ 2)^{\frac{1}{3}}dy\ $$

$$= \ \left\lbrack \left( \frac{3}{4} \right)(y\  + \ 2)^{\frac{4}{3}} \right\rbrack_{- 1}^{25}\ $$

$$= \ \left( \frac{3}{4} \right)\lbrack 81\  - \ 1\rbrack$$

$$= \ 60\ units²$$

9.  Find the area in the second quadrant enclosed between the lines
    $y\  = \ 4$ and $y\  = \ 1\  - \ x$.

$$A\  = \ \int_{1}^{4}\left( 0\  - \ (1\  - \ y) \right)dy$$

$$= \ \int_{1}^{4}(y\  - \ 1)dy$$

$$= \ \left\lbrack \frac{y^{2}}{2} - \ y \right\rbrack_{1}^{4}$$

$$= \ (8\  - \ 4)\  - \ \left( \frac{1}{2} - \ 1 \right)$$

$$= \frac{9}{2} = \ 4.5\ units^{2}$$

10. Find the area bounded by the curve $y\  = \ \sqrt{x}$, the $y$-axis,
    $x\  = \ 0$ and $x\  = \ 4$.

Need to rearrange for $x$ and change the limits. At $x = 0,\ y = 0,$ at
$x = 0,\ y = 2$

$$A\  = \ \int_{0}^{2}y^{2}dy$$

$$= \ \left\lbrack \frac{y^{3}}{3} \right\rbrack_{0}^{2}$$

$$= \frac{8}{3} = \ 2\frac{2}{3}units^{2}$$

11. Find the area enclosed between the curve $y\  = \ x³,$ the $y$-axis,
    $x\  = \ 0$ and $x\  = \ 2$.

$$A\  = \ \int_{0}^{8}y^{\frac{1}{3}}dy$$

$$= \ \left\lbrack \left( \frac{3}{4} \right)y^{\frac{4}{3}} \right\rbrack_{0}^{8}$$

$$= \ \left( \frac{3}{4} \right)(16)$$

$$= \ 12\ units^{2}$$

# Area Between Two Curves

+-------------------------------------------------------------------+
| - **Review**                                                      |
+===================================================================+
| - Find point of intersection of two curves and sketch both curves |
|   on the same axes.                                               |
|                                                                   |
| +------------------------------+------------------------------+   |
| | a.  $y = x^{2}$ and          | b.  $y = x^{2}$ and          |   |
| |     $y = x + 2$              |     $y = x + 6$              |   |
| +==============================+==============================+   |
| | c.  $y = x^{3}$ and $y = 4x$ | d.  $y = (x - 1)^{2}$ and    |   |
| |                              |     $y = (x + 1)^{2}$        |   |
| +------------------------------+------------------------------+   |
| | e.  $y = x$ and              | f.  $y = x(x - 4)^{2}$ and   |   |
| |     $y = 2(x - 3)^{2}$       |     $y = x$                  |   |
| +------------------------------+------------------------------+   |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Area Under a Combination of Curves**                          |
+===================================================================+
| Sometimes a region is bounded by different curves in different    |
| sections along the $x$-axis. Because no single curve forms the    |
| top boundary across the whole region, you must split the region   |
| at the point(s) of intersection and calculate each section        |
| separately.                                                       |
|                                                                   |
| 1.  Find the intersection points.                                 |
|                                                                   |
| 2.  Set up separate definite integrals for each section.          |
|                                                                   |
| 3.  Integrate and add the results.                                |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find area under a combination of curves                                                                                                                                                                                                                                             |
+===================================================================================================================================================================================================================================================================================================+
| Find the area bounded by $y = x^{2}$, $y = (x - 4)^{2}$ and the axis.                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                   |
| +---------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+ |
| | 1\. Intersection points                                       | 3\. Integrate and add                                                                                               | ![](media/Integral Calculus 3_Further Areas under Curves/media/image38.png){width="2.009994531933508in" | |
| |                                                               |                                                                                                                     | height="1.968503937007874in"}                                                                           | |
| | $$\ \ \ \ \ x^{2} = (x - 4)^{2}$$                             | $$= \left\lbrack \frac{x^{3}}{3} \right\rbrack_{0}^{2} + \left\lbrack \frac{(x - 4)^{3}}{3} \right\rbrack_{2}^{4}$$ |                                                                                                         | |
| |                                                               |                                                                                                                     |                                                                                                         | |
| | $x^{2} = x^{2} - 8x + 16$                                     | $$= \left( \frac{8}{3} - 0 \right) + \left( 0 - \frac{- 8}{3} \right)$$                                             |                                                                                                         | |
| |                                                               |                                                                                                                     |                                                                                                         | |
| | $x = 2$                                                       | $$= \frac{16}{3}\ u^{2}$$                                                                                           |                                                                                                         | |
| |                                                               |                                                                                                                     |                                                                                                         | |
| | 2\. Set up integrals                                          |                                                                                                                     |                                                                                                         | |
| |                                                               |                                                                                                                     |                                                                                                         | |
| | $$\ \ \ \ \ \int_{0}^{2}x^{2}dx + \int_{2}^{4}(x - 4)^{2}dx$$ |                                                                                                                     |                                                                                                         | |
| +===============================================================+=====================================================================================================================+=========================================================================================================+ |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                   |
+=========================================================================================================+
| a.  Find the area of the bounded by $y = x,$ $y\  = 2(x - 3)²,$ and the $x$-axis.                       |
|                                                                                                         |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image39.png){width="2.005297462817148in" |
| height="1.968503937007874in"}                                                                           |
|                                                                                                         |
| $$\frac{8}{3}$$                                                                                         |
+---------------------------------------------------------------------------------------------------------+
| b.  Find the area of the bounded by $y\  = \ 4x²,$ $y\  = \ (x + 3)²,$ and the $x$-axis.                |
|                                                                                                         |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image40.png){width="2.003079615048119in" |
| height="1.968503937007874in"}                                                                           |
|                                                                                                         |
| 4                                                                                                       |
+---------------------------------------------------------------------------------------------------------+
| - **Area Between Two Curves**                                                                           |
+---------------------------------------------------------------------------------------------------------+
| When two curves intersect at two points, they enclose a region between them.\                           |
| To find this area, integrate the **difference between the upper curve and the lower curve**.            |
|                                                                                                         |
| 1.  Find the intersection points.                                                                       |
|                                                                                                         |
| 2.  Identify the upper curve; the one with the larger $y$-values is the upper curve.\                   |
|     A sketch is useful, you can also substitute $x$ values into each function to check.                 |
|                                                                                                         |
| 3.  Set up the integral as $\int(upper\ curve - lower\ curve)\ dx$.\                                    |
|     If the curves cross each other in the domain, split the region into subintervals.                   |
|                                                                                                         |
| Simplify the integrand if possible.                                                                     |
|                                                                                                         |
| 4.  Integrate and evaluate.                                                                             |
+---------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find area between two curves                                                                                                                                                                                    |
+===============================================================================================================================================================================================================================+
| Find the area enclosed between $y = x^{2}\$and $y = x + 2$.                                                                                                                                                                   |
|                                                                                                                                                                                                                               |
| +-----------------------------+-----------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+ |
| | 1\. Intersection points     | 3\. Set up integral                                                               | ![](media/Integral Calculus 3_Further Areas under Curves/media/image41.png){width="2.009994531933508in" | |
| |                             |                                                                                   | height="1.968503937007874in"}                                                                           | |
| | $$\ \ \ \ \ x^{2} = x + 2$$ | $$\ \ \ \ \int_{- 1}^{2}\left( (x + 2) - \left( x^{2} \right) \right)dx$$         |                                                                                                         | |
| |                             |                                                                                   |                                                                                                         | |
| | $x^{2} - x - 2 = 0$         | $$= \int_{- 1}^{2}{(x + 2 - x^{2})}dx$$                                           |                                                                                                         | |
| |                             |                                                                                   |                                                                                                         | |
| | $(x - 2)(x + 1) = 0$        | 4\. Integrate                                                                     |                                                                                                         | |
| |                             |                                                                                   |                                                                                                         | |
| | $$\ \ \ \ \ x = - 1,2$$     | $$= \left\lbrack \frac{x^{2}}{2} + 2x - \frac{x^{3}}{3} \right\rbrack_{- 1}^{2}$$ |                                                                                                         | |
| |                             |                                                                                   |                                                                                                         | |
| | 2\. Identify upper curve    | $$= \frac{10}{3} - \left( - \frac{7}{6} \right)$$                                 |                                                                                                         | |
| |                             |                                                                                   |                                                                                                         | |
| | In the required region,     | $$= 4.5\ u^{2}$$                                                                  |                                                                                                         | |
| |                             |                                                                                   |                                                                                                         | |
| | $y = x + 2$ is the upper    |                                                                                   |                                                                                                         | |
| | curve                       |                                                                                   |                                                                                                         | |
| +=============================+===================================================================================+=========================================================================================================+ |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                        |
+==============================================================================================================+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image42.png){width="2.009994531933508in"  |
|     height="1.954737532808399in"}Find the area enclosed between $y = 3 - x$ and $y = x² - 3x.$               |
|                                                                                                              |
| $$\frac{32}{3}\ u^{2}$$                                                                                      |
+--------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                        |
+--------------------------------------------------------------------------------------------------------------+
| b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image43.png){width="2.009994531933508in"  |
|     height="1.9570395888013998in"}Find the area bounded between $y = x(x - 4)^{2}$ and $y = x$               |
|                                                                                                              |
| $$\frac{253}{12}\ u^{2}$$                                                                                    |
+--------------------------------------------------------------------------------------------------------------+
| c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image44.png){width="2.0097222222222224in" |
|     height="1.9659722222222222in"}Find the area bounded between $y = 6 - 2x$ and $y = x(x - 3)^{2}$          |
|                                                                                                              |
| $$\frac{1}{2}\ u^{2}$$                                                                                       |
+--------------------------------------------------------------------------------------------------------------+

Foundation

1.  Find the area of the shaded region in each diagram below:

+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6285629921259843in" | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236286089238845in" | c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236286089238845in" |
|     height="1.5873337707786526in"}                                                                           |     height="1.5825240594925634in"}                                                                           |     height="1.5825240594925634in"}                                                                           |
|                                                                                                              |                                                                                                              |                                                                                                              |
| $$A\  = \ \int_{0}^{1}\left( x\  - \ x^{2} \right)dx$$                                                       | $$A\  = \ \int_{0}^{1}\left( x\  - \ x^{3} \right)dx$$                                                       | $$A\  = \ \int_{0}^{1}\left( x\  - \ x^{4} \right)dx$$                                                       |
|                                                                                                              |                                                                                                              |                                                                                                              |
| $$= \frac{1}{6}\ u^{2}$$                                                                                     | $$= \frac{1}{4}\ u^{2}$$                                                                                     | $$= \frac{3}{10}\ u^{2}$$                                                                                    |
+==============================================================================================================+==============================================================================================================+==============================================================================================================+
| d.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236286089238845in" | e.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236286089238845in" | f.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236286089238845in" |
|     height="1.5825240594925634in"}                                                                           |     height="1.5825240594925634in"}                                                                           |     height="1.5825240594925634in"}                                                                           |
|                                                                                                              |                                                                                                              |                                                                                                              |
| $$A\  = \ \int_{0}^{1}\left( x^{2} - \ x^{3} \right)dx$$                                                     | $$A\  = \ \int_{0}^{1}\left( x^{4} - \ x^{6} \right)dx$$                                                     | $$A\  = \ \int_{- 1}^{4}\left( 3x\  + \ 4\  - \ x^{2} \right)dx$$                                            |
|                                                                                                              |                                                                                                              |                                                                                                              |
| $$= \frac{1}{12}\ u^{2}$$                                                                                    | $$= \frac{2}{35}\ u^{2}$$                                                                                    | $$= \frac{125}{6}\ u^{2}$$                                                                                   |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| g.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236286089238845in" | h.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236286089238845in" |                                                                                                              |
|     height="1.5825240594925634in"}                                                                           |     height="1.5825240594925634in"}                                                                           |                                                                                                              |
|                                                                                                              |                                                                                                              |                                                                                                              |
| $$A\  = \ \int_{- 4}^{2}\left( 9\  - \ 2x\  - \ x^{2} - \ 1 \right)dx\ $$                                    | $$A\  = \ \int_{- 3}^{2}\left( 10\  - \ x^{2} - \ x\  - \ 4 \right)dx\ $$                                    |                                                                                                              |
|                                                                                                              |                                                                                                              |                                                                                                              |
| $$= \ \int_{- 4}^{2}\left( 8\  - \ 2x\  - \ x^{2} \right)dx$$                                                | $$= \ \int_{- 3}^{2}\left( 6\  - \ x\  - \ x^{2} \right)dx$$                                                 |                                                                                                              |
|                                                                                                              |                                                                                                              |                                                                                                              |
| $$= \ 36\ u^{2}$$                                                                                            | $$= \frac{125}{6}\ u^{2}$$                                                                                   |                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+

2.  By considering regions between the curves and the $y$-axis, find the
    area of the shaded region.

+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236111111111111in" | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236111111111111in"                               |
|     height="1.5819444444444444in"}                                                                           |     height="1.5819444444444444in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236286089238845in" |
|                                                                                                              |     height="1.5825240594925634in"}                                                                                                         |
| $$A\  = \ \int_{0}^{2}\left( 2y\  - \ y^{2} \right)dy$$                                                      |                                                                                                                                            |
|                                                                                                              | $$A\  = \ \int_{1}^{2}\left( 3y\  - \ 2\  - \ y^{2} \right)dy$$                                                                            |
| $$= \frac{4}{3}\ u^{2}$$                                                                                     |                                                                                                                                            |
|                                                                                                              | $$= \frac{1}{6}\ u^{2}$$                                                                                                                   |
+==============================================================================================================+============================================================================================================================================+
| c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image45.png){width="1.6236111111111111in" | d.                                                                                                                                         |
|     height="1.5819444444444444in"}                                                                           |                                                                                                                                            |
|                                                                                                              | $$A\  = \ \int_{- 1}^{2}\left( y\  + \ 4\  - \ y^{2} - \ 2 \right)dy\ $$                                                                   |
| $$A\  = \ \int_{2}^{4}\left( 5y - y^{2} - 4 - 4 + y \right)dy\ $$                                            |                                                                                                                                            |
|                                                                                                              | $$= \ \int_{- 1}^{2}\left( y\  + \ 2\  - \ y^{2} \right)dy$$                                                                               |
| $$= \ \int_{2}^{4}\left( 6y - y^{2} - 8 \right)dy$$                                                          |                                                                                                                                            |
|                                                                                                              | $$= \frac{9}{2}\ u^{2}$$                                                                                                                   |
| $$= \frac{4}{3}\ u^{2}$$                                                                                     |                                                                                                                                            |
+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+

3.  Find the areas of the shaded regions. You will need to find two
    areas and add.

+--------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image46.png){width="1.5978258967629047in" | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image47.png){width="1.6393438320209974in" |
|     height="1.5256353893263341in"}                                                                           |     height="1.5652777777777778in"}                                                                           |
|                                                                                                              |                                                                                                              |
| $$\int_{- 2}^{0}(x - 2)^{2}dx + \int_{0}^{2}(x + 2)^{2}dx$$                                                  | $$\int_{0}^{\frac{3}{2}}x^{2}dx + \int_{\frac{3}{2}}^{3}(x - 3)^{2}dx$$                                      |
|                                                                                                              |                                                                                                              |
| $$5\frac{1}{3}\ u^{2}$$                                                                                      | $$\frac{9}{4}\ u^{2}$$                                                                                       |
+==============================================================================================================+==============================================================================================================+

4.  Find the areas of the shaded regions. You will need to find two
    areas and subtract.

+-------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+
| a.                                        | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image47.png){width="1.6388888888888888in"                               |
|                                           |     height="1.4388888888888889in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image47.png){width="1.6388888888888888in" |
| $$3(6) - \int_{2}^{4}{6x - x^{2} - 8}dx$$ |     height="1.439015748031496in"}                                                                                                          |
|                                           |                                                                                                                                            |
| $$= 16\frac{2}{3}\ u^{2}$$                | $$\int_{- 2}^{2}{4 - x^{2}}dx - \int_{- 1}^{1}{1 - x^{2}}dx$$                                                                              |
|                                           |                                                                                                                                            |
|                                           | $$= 9\frac{1}{3}\ u^{2}$$                                                                                                                  |
+===========================================+============================================================================================================================================+

5.  a.  Show that $y\  = \ x²\  + \ 4$ and $y\  = \ x\  + \ 6$ intersect
        at $( - 1,\ 5)$ and $(2,\ 8)$.

    b.  Sketch the parabola and line, shading the enclosed region.

    c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image48.png){width="2.0942235345581803in"
        height="1.968503937007874in"}Show that
        $\int_{- 1}^{2}\left( (x\  + \ 6) - \ \left( x^{2} + \ 4 \right) \right)dx\  = \ \int_{- 1}^{2}\left( x\  - \ x^{2} + \ 2 \right)dx$,
        and evaluate.

$$x^{2} + \ 4\  = \ x\  + \ 6$$

$$x^{2} - \ x\  - \ 2\  = \ 0$$

$$(x\  - \ 2)(x\  + \ 1) = \ 0$$

$$x\  = \ 2\ or\ x\  = \  - 1$$

$$x\  = \ 2:\ y\  = \ 2\  + \ 6\  = \ 8\  \rightarrow \ (2,\ 8)$$

$$x\  = \  - 1:\ y\  = \  - 1\  + \ 6\  = \ 5\  \rightarrow \ ( - 1,\ 5)$$

$$\int_{- 1}^{2}\left( (x\  + \ 6) - \ \left( x^{2} + \ 4 \right) \right)dx\  = \ \int_{- 1}^{2}\left( x\  - \ x^{2} + \ 2 \right)dx$$

$$= \ \left\lbrack \frac{x^{2}}{2} - \frac{x^{3}}{3} + \ 2x \right\rbrack_{- 1}^{2}$$

$$= \frac{9}{2}\ u^{2}$$

6.  a.  Show that $y\  = \ 3x\  - \ x²\  = \ x(3\  - \ x)$ and
        $y\  = \ x$ intersect at $(0,\ 0)$ and $(2,\ 2).$

    b.  Sketch the parabola and line, shading the enclosed region.

    c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image49.png){width="2.0872069116360454in"
        height="1.968503937007874in"}Show
        that$\ \int_{0}^{2}\left( 3x\  - \ x^{2} - \ x \right)dx\  = \ \int_{0}^{2}\left( 2x\  - \ x^{2} \right)dx$,
        and evaluate.

$$3x\  - \ x^{2} = \ x$$

$$2x\  - \ x^{2} = \ 0$$

$$x(2\  - \ x) = \ 0$$

$$x\  = \ 0\ or\ x\  = \ 2$$

$$x\  = \ 0:\ y\  = \ 0\  \rightarrow \ (0,\ 0)$$

$$x\  = \ 2:\ y\  = \ 2\  \rightarrow \ (2,\ 2)$$

$$\int_{0}^{2}\left( 3x\  - \ x^{2} - \ x \right)dx\  = \ \int_{0}^{2}\left( 2x\  - \ x^{2} \right)dx$$

$$= \ \left\lbrack x^{2} - \frac{x^{3}}{3} \right\rbrack_{0}^{2}$$

$$= \frac{4}{3}\ u^{2}$$

Development

7.  a.  Show that $y\  = \ (x\  - \ 3)^{2}$ and $y\  = \ 14\  - \ 2x\$
        intersect at $( - 1,\ 16)$ and $(5,\ 4).$

    b.  Sketch the parabola and line, shading the enclosed region.

    c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image50.png){width="2.073611111111111in"
        height="1.9680555555555554in"}Show that
        $\int_{- 1}^{5}\left( (14\  - \ 2x) - \ (x\  - \ 3)^{2} \right)dx\  = \ \int_{- 1}^{5}\left( 4x\  + \ 5\  - \ x^{2} \right)dx$,
        and evaluate.

$$(x\  - \ 3)^{2} = \ 14\  - \ 2x$$

$$x^{2} - \ 6x\  + \ 9\  = \ 14\  - \ 2x$$

$$x^{2} - \ 4x\  - \ 5\  = \ 0$$

$$(x\  - \ 5)(x\  + \ 1) = \ 0$$

$$x\  = \ 5\ or\ x\  = \  - 1$$

$$x\  = \ 5:\ y\  = \ 14\  - \ 10\  = \ 4\  \rightarrow \ (5,\ 4)$$

$$x\  = \  - 1:\ y\  = \ 14\  + \ 2\  = \ 16\  \rightarrow \ ( - 1,\ 16)$$

$$(14\  - \ 2x)\  - \ (x\  - \ 3)²\  = \ 4x\  + \ 5\  - \ x²\ $$

$$\int_{- 1}^{5}\left( 4x\  + \ 5\  - \ x^{2} \right)dx\  = \ \left\lbrack 2x^{2} + \ 5x\  - \frac{x^{3}}{3} \right\rbrack_{- 1}^{5}\ $$

$$= \ \left( 50\  + \ 25\  - \frac{125}{3} \right) - \ \left( 2\  - \ 5\  + \frac{1}{3} \right)$$

$$= \ 36\ u^{2}$$

8.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image51.png){width="2.0600481189851267in"
    height="1.9460542432195975in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image52.png){width="2.073611111111111in"
    height="1.9460542432195975in"}Solve simultaneously, sketch, shade
    the enclosed region, and find its area for:

    a.  $y = x + 3\$and$\ y = x² + 1$

$$x\  + \ 3\  = \ x^{2} + \ 1$$

$$x^{2} - \ x\  - \ 2\  = \ 0$$

$$(x\  - \ 2)(x\  + \ 1) = \ 0$$

$$x\  = \ 2\ or\ x\  = \  - 1$$

$$Intersections:\ (2,\ 5)\ and\ ( - 1,\ 2)$$

$$Line\ is\ above\ parabola\ on\ \lbrack - 1,\ 2\rbrack.$$

$$\int_{- 1}^{2}\left( (x\  + \ 3) - \ \left( x^{2} + \ 1 \right) \right)dx\  = \ \int_{- 1}^{2}\left( x\  - \ x^{2} + \ 2 \right)dx$$

$$= \ \left\lbrack \frac{x^{2}}{2} - \frac{x^{3}}{3} + \ 2x \right\rbrack_{- 1}^{2}$$

$$= \ \left( 2\  - \frac{8}{3} + \ 4 \right) - \ \left( \frac{1}{2} + \frac{1}{3} - \ 2 \right)$$

$$= \frac{9}{2}\ u^{2}$$

b.  $y = 9 - x²\$and$\ y = 3 - x$

$$9\  - \ x^{2} = \ 3\  - \ x$$

$$x^{2} - \ x\  - \ 6\  = \ 0$$

$$(x\  - \ 3)(x\  + \ 2) = \ 0$$

$$x\  = \ 3\ or\ x\  = \  - 2\ $$

$$Intersections:\ (3,\ 0)\ and\ ( - 2,\ 5)$$

$$Parabola\ is\ above\ line\ on\ \lbrack - 2,\ 3\rbrack.$$

$$\int_{- 2}^{3}\left( \left( 9\  - \ x^{2} \right) - \ (3\  - \ x) \right)dx\  = \ \int_{- 2}^{3}\left( 6\  + \ x\  - \ x^{2} \right)dx$$

$$= \ \left\lbrack 6x\  + \frac{x^{2}}{2} - \frac{x^{3}}{3} \right\rbrack_{- 2}^{3}$$

$$= \ \left( 18\  + \frac{9}{2} - \ 9 \right) - \ \left( - 12\  + \ 2\  + \frac{8}{3} \right) = \frac{125}{6}\ u^{2}$$

c.  $y = x² - x + 4\$and$\ y = - x² + 3x + 4$

$$x^{2} - \ x\  + \ 4\  = \  - x^{2} + \ 3x\  + \ 4$$

$$2x^{2} - \ 4x\  = \ 0$$

$$2x(x\  - \ 2) = \ 0$$

$$x\  = \ 0\ or\ x\  = \ 2$$

$$Intersections:\ (0,\ 4)\ and\ (2,\ 6)$$

$$Second\ parabola\ is\ above\ first\ on\ \lbrack 0,\ 2\rbrack.$$

$$\int_{0}^{2}\left( \left( - x^{2} + \ 3x\  + \ 4 \right) - \ \left( x^{2} - \ x\  + \ 4 \right) \right)dx\  = \ \int_{0}^{2}\left( 4x\  - \ 2x^{2} \right)dx$$

$$= \ \left\lbrack 2x^{2} - \frac{2x^{3}}{3} \right\rbrack_{0}^{2}$$

$$= \ 8\  - \frac{16}{3} = \frac{8}{3}\ u^{2}$$

9.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image53.png){width="2.053624234470691in"
    height="1.9460542432195975in"}

    a.  Show that $y\  = \ x^{2} + \ 2x\  - \ 8$ and
        $y\  = \ 2x\  + \ 1$ intersect at $(3,\ 7)$ and $( - 3,\  - 5).$

    b.  Sketch both graphs, shading the enclosed region.

    c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image54.png){width="2.0501902887139107in"
        height="1.9460542432195975in"}Show that
        $\int_{- 3}^{3}\left( (2x\  + \ 1) - \ \left( x^{2} + \ 2x\  - \ 8 \right) \right)dx\  = \ \int_{- 3}^{3}\left( 9\  - \ x^{2} \right)dx$.\
        Evaluate and find the area.

$$x^{2} + \ 2x\  - \ 8\  = \ 2x\  + \ 1$$

$$x^{2} - \ 9\  = \ 0$$

$$(x\  - \ 3)(x\  + \ 3) = \ 0$$

$$x\  = \ 3\ or\ x\  = \  - 3$$

$$x\  = \ 3:\ y\  = \ 7\  \rightarrow \ (3,\ 7)$$

$$x\  = \  - 3:\ y\  = \  - 5\  \rightarrow \ ( - 3,\  - 5)$$

$$(2x\  + \ 1)\  - \ (x²\  + \ 2x\  - \ 8)\  = \ 9\  - \ x²\ $$

$$\int_{- 3}^{3}\left( 9\  - \ x^{2} \right)dx\  = \ \left\lbrack 9x\  - \frac{x^{3}}{3} \right\rbrack_{- 3}^{3}$$

$$= \ (27\  - \ 9) - \ ( - 27\  + \ 9)$$

$$= \ 36\ u^{2}$$

10. a.  Show that $y\  = \ x²\  - \ x\  - \ 2$ and $y\  = \ x\  - \ 2$
        intersect at $(0,\  - 2)$ and $(2,\ 0).$

    b.  Sketch both graphs, shading the enclosed region.

    c.  Show that
        $\int_{0}^{2}\left( (x\  - \ 2) - \ \left( x^{2} - \ x\  - \ 2 \right) \right)dx\  = \ \int_{0}^{2}\left( 2x\  - \ x^{2} \right)dx$.
        Evaluate and find the area.

![](media/Integral Calculus 3_Further Areas under Curves/media/image55.png){width="2.0501902887139107in"
height="1.9286373578302711in"}

$$x^{2} - \ x\  - \ 2\  = \ x\  - \ 2$$

$$x^{2} - \ 2x\  = \ 0$$

$$x(x\  - \ 2) = \ 0$$

$$x\  = \ 0\ or\ x\  = \ 2$$

$$x\  = \ 0:\ y\  = \  - 2\  \rightarrow \ (0,\  - 2)$$

$$x\  = \ 2:\ y\  = \ 0\  \rightarrow \ (2,\ 0)$$

$$(x\  - \ 2)\  - \ (x²\  - \ x\  - \ 2)\  = \ 2x\  - \ x²\ $$

$$\int_{0}^{2}\left( 2x\  - \ x^{2} \right)dx\  = \ \left\lbrack x^{2} - \frac{x^{3}}{3} \right\rbrack_{0}^{2}$$

$$= \ 4\  - \frac{8}{3}$$

$$= \frac{4}{3}u^{2}$$

11. ![](media/Integral Calculus 3_Further Areas under Curves/media/image56.png){width="2.0352449693788275in"
    height="1.9286373578302711in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image57.png){width="2.0416108923884515in"
    height="1.9286373578302711in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image58.png){width="2.0501891951006126in"
    height="1.9286373578302711in"}Solve simultaneously, sketch, shade
    the enclosed region, and find its area for:

    a.  $y\  = \ x²\  - \ 6x\  + \ 5\$and$\ y\  = \ x\  - \ 5$

$$x^{2} - \ 6x\  + \ 5\  = \ x\  - \ 5$$

$$x^{2} - \ 7x\  + \ 10\  = \ 0$$

$$(x\  - \ 2)(x\  - \ 5) = \ 0$$

$$x\  = \ 2\ or\ x\  = \ 5$$

$$Intersections:\ (2,\  - 3)\ and\ (5,\ 0)$$

$$Line\ is\ above\ parabola\ on\ \lbrack 2,\ 5\rbrack.$$

$$\int_{2}^{5}\left( (x\  - \ 5) - \ \left( x^{2} - \ 6x\  + \ 5 \right) \right)dx\  = \ \int_{2}^{5}\left( 7x\  - \ 10\  - \ x^{2} \right)dx$$

$$= \ \left\lbrack \frac{7x^{2}}{2} - \ 10x\  - \frac{x^{3}}{3} \right\rbrack_{2}^{5}$$

$$= \ \left( \frac{175}{2} - \ 50\  - \frac{125}{3} \right) - \ \left( 14\  - \ 20\  - \frac{8}{3} \right)$$

$$= \frac{25}{6} - \ \left( - \frac{26}{3} \right)$$

$$= \frac{9}{2}\ u^{2}$$

b.  $y\  = \  - 3x\$and$\ y\  = \ 4\  - \ x²$

$$- 3x\  = \ 4\  - \ x^{2}$$

$$x^{2} - \ 3x\  - \ 4\  = \ 0$$

$$(x\  - \ 4)(x\  + \ 1) = \ 0$$

$$x\  = \ 4\ or\ x\  = \  - 1$$

$$Intersections:\ (4,\  - 12)\ and\ ( - 1,\ 3)$$

$$Parabola\ is\ above\ line\ on\ \lbrack - 1,\ 4\rbrack.$$

$$\int_{- 1}^{4}\left( \left( 4\  - \ x^{2} \right) - \ ( - 3x) \right)dx\  = \ \int_{- 1}^{4}\left( 4\  + \ 3x\  - \ x^{2} \right)dx$$

$$= \ \left\lbrack 4x\  + \frac{3x^{2}}{2} - \frac{x^{3}}{3} \right\rbrack_{- 1}^{4}$$

$$= \ \left( 16\  + \ 24\  - \frac{64}{3} \right) - \ \left( - 4\  + \frac{3}{2} + \frac{1}{3} \right)$$

$$= \frac{56}{3} - \ \left( - \frac{13}{6} \right)$$

$$= \frac{125}{6}u^{2}$$

c.  $y\  = \ x²\  - \ 1\$and$\ y\  = \ 7\  - \ x²$

$$x²\  - \ 1\  = \ 7\  - \ x^{2}$$

$$2x^{2} = \ 8$$

$$x^{2} = \ 4$$

$$x\  = \ 2\ or\ x\  = \  - 2$$

$$Intersections:\ (2,\ 3)\ and\ ( - 2,\ 3)$$

$$Second\ curve\ is\ above\ first\ on\ \lbrack - 2,\ 2\rbrack.$$

$$\int_{- 2}^{2}\left( \left( 7\  - \ x^{2} \right) - \ \left( x^{2} - \ 1 \right) \right)dx\  = \ \int_{- 2}^{2}\left( 8\  - \ 2x^{2} \right)dx$$

$$= \ \left\lbrack 8x\  - \frac{2x^{3}}{3} \right\rbrack_{- 2}^{2}$$

$$= \ \left( 16\  - \frac{16}{3} \right) - \ \left( - 16\  + \frac{16}{3} \right)$$

$$= \frac{32}{3} + \frac{32}{3}$$

$$= \frac{64}{3}u^{2}$$

Mastery

12. Tangents are drawn to $x²\  = \ 8y$ at $A(4,\ 2)$ and $B( - 4,\ 2).$

    a.  Draw a diagram noting symmetry about the y-axis.

    b.  Find the equation of the tangent at A.

    c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image59.png){width="2.0837171916010497in"
        height="1.968503937007874in"}Find the area bounded by the curve
        and the tangents.

$$x^{2} = \ 8y\  \rightarrow \ y\  = \frac{x^{2}}{8}$$

$$y' = \frac{x}{4}$$

$$At\ A(4,\ 2):\ m\  = \frac{4}{4} = \ 1$$

$$y\  - \ 2\  = \ 1(x\  - \ 4)$$

$$y\  = \ x\  - \ 2$$

By symmetry, tangent at B:$\ y\  = \  - x\  - \ 2$

Tangents meet
where$\ x\  - \ 2\  = \  - x\  - \ 2,\$so$\ x\  = \ 0,\ y\  = \  - 2.$

Tangents meet at$\ (0,\  - 2).$

By symmetry, area $= \ 2\  \times \$area
from$\ x\  = \ 0\$to$\ x\  = \ 4\$between curve and tangent at$\ A.$

$$Area\  = \ 2\int_{0}^{4}\left( \frac{x^{2}}{8} - \ (x\  - \ 2) \right)dx\  = \ 2\int_{0}^{4}\left( \frac{x^{2}}{8} - \ x\  + \ 2 \right)dx$$

$$= \ 2\left\lbrack \frac{x^{3}}{24} - \frac{x^{2}}{2} + \ 2x \right\rbrack_{0}^{4}$$

$$= \ 2\left( \frac{64}{24} - \ 8\  + \ 8 \right)$$

$$= \frac{16}{3}\ u²$$

13. a.  Show that the tangent to $y\  = \ x³$ at $x\  = \ 2$ has
        equation $y\  = \ 12x\  - \ 16$.

    b.  Show that the tangent and curve intersect again at
        $( - 4,\  - 64)$.

    c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image60.png){width="2.075577427821522in"
        height="1.968503937007874in"}Find the area enclosed between the
        curve and the tangent.

$$y\  = \ x^{3}$$

$$y'\  = \ 3x²$$

$$At\ x\  = \ 2:\ y\  = \ 8,\ y' = \ 12$$

$$y\  - \ 8\  = \ 12(x\  - \ 2)$$

$$y\  = \ 12x\  - \ 16$$

$$x^{3} = \ 12x\  - \ 16$$

$$x^{3} - \ 12x\  + \ 16\  = \ 0$$

$$(x\  - \ 2)^{2}\ is\ a\ factor\ (tangent\ touches\ at\ x\  = \ 2).$$

$$x³\  - \ 12x\  + \ 16\  = \ (x\  - \ 2)^{2}(x\  + \ 4)$$

$$x\  = \  - 4:\ y\  = \ ( - 4)^{3} = \  - 64$$

$$Intersects\ again\ at\ ( - 4,\  - 64).$$

$$\int_{- 4}^{2}\left( x^{3} - \ (12x\  - \ 16) \right)dx\  = \ \int_{- 4}^{2}\left( x^{3} - \ 12x\  + \ 16 \right)dx$$

$$= \ \left\lbrack \frac{x^{4}}{4} - \ 6x^{2} + \ 16x \right\rbrack_{- 4}^{2}$$

$$= \ (4\  - \ 24\  + \ 32)\  - \ (64\  - \ 96\  - \ 64)$$

$$= \ 108\ u²$$

14. Consider $y\  = \ x³\  - \ 3$ and
    $y\  = \  - x²\  + \ 10x\  - \ 11.$

    a.  Show by substitution that the curves intersect where
        $x\  = \  - 4,\ 1$ and $2$.

    b.  Sketch the curves showing intersection points.

    c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image61.png){width="2.075577427821522in"
        height="1.9685028433945757in"}Find the area enclosed by the two
        curves.

$$Set\ x^{3} - \ 3\  = \  - x^{2} + \ 10x\  - \ 11$$

$$x^{3} + \ x^{2} - \ 10x\  + \ 8\  = \ 0$$

$$x\  = \  - 4:\  - 64\  + \ 16\  + \ 40\  + \ 8\  = \ 0$$

$$x\  = \ 1:\ 1\  + \ 1\  - \ 10\  + \ 8\  = \ 0$$

$$x\  = \ 2:\ 8\  + \ 4\  - \ 20\  + \ 8\  = \ 0$$

$$Intersection\ points:$$

$$x\  = \  - 4:\ y\  = \ ( - 4)³\  - \ 3\  = \  - 67\  \rightarrow \ ( - 4,\  - 67)$$

$$x\  = \ 1:\ y\  = \ 1\  - \ 3\  = \  - 2\  \rightarrow \ (1,\  - 2)$$

$$x\  = \ 2:\ y\  = \ 8\  - \ 3\  = \ 5\  \rightarrow \ (2,\ 5)$$

$$Area\  = \ \int_{- 4}^{1}\left( \left( x^{3} - \ 3 \right) - \ \left( - x^{2} + \ 10x\  - \ 11 \right) \right)dx\  + \ \int_{1}^{2}\left( \left( - x^{2} + \ 10x\  - \ 11 \right) - \ \left( x^{3} - \ 3 \right) \right)dx$$

$$= \ \int_{- 4}^{1}\left( x^{3} + \ x^{2} - \ 10x\  + \ 8 \right)dx\  + \ \int_{1}^{2}\left( - x^{3} - \ x^{2} + \ 10x\  - \ 8 \right)dx$$

$$\int_{- 4}^{1}\left( x^{3} + \ x^{2} - \ 10x\  + \ 8 \right)dx\  = \left\lbrack \frac{x^{4}}{4} + \frac{x^{3}}{3} - \ 5x^{2} + \ 8x \right\rbrack_{- 4}^{1}$$

$$= \frac{43}{12} - \ \left( - \frac{208}{3} \right) = \frac{875}{12}$$

$$\int_{1}^{2}\left( - x^{3} - \ x^{2} + \ 10x\  - \ 8 \right)dx\  = \  - \left\lbrack \frac{x^{4}}{4} + \frac{x^{3}}{3} - \ 5x^{2} + \ 8x \right\rbrack_{1}^{2}$$

$$= \  - \left( \frac{32}{12} - \frac{43}{12} \right) = \frac{11}{12}$$

$$Area\  = \frac{875}{12} + \frac{11}{12} = \frac{443}{6}u^{2}$$

15. a.  Find the points of intersection of $y\  = \ x^{2}(1\  - \ x)$
        and $y\  = \ x(1\  - \ x)^{2}$.

    b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image62.png){width="2.075577427821522in"
        height="1.9668558617672791in"}Find the area bounded by the two
        curves.

$$x²(1\  - \ x)\  = \ x(1\  - \ x)^{2}$$

$$x^{2}(1\  - \ x) - \ x(1\  - \ x)^{2} = \ 0$$

$$x(1\  - \ x)\left\lbrack x\  - \ (1\  - \ x) \right\rbrack = \ 0$$

$$x(1\  - \ x)(2x\  - \ 1) = \ 0$$

$$x\  = \ 0,\ x\  = \ 1,\ x\  = \frac{1}{2}$$

$$x\  = \ 0:\ y\  = \ 0\  \rightarrow \ (0,\ 0)$$

$$x\  = \frac{1}{2}:\ y\  = \ \left( \frac{1}{4} \right)\left( \frac{1}{2} \right) = \frac{1}{8} \rightarrow \ \left( \frac{1}{2},\frac{1}{8} \right)$$

$$x\  = \ 1:\ y\  = \ 0\  \rightarrow \ (1,\ 0)$$

$$Let\ f(x)\  = \ x²(1\  - \ x)\ and\ g(x)\  = \ x(1\  - \ x)²\ $$

$$f(x)\  - \ g(x)\  = \ x(1\  - \ x)(x\  - \ (1\  - \ x))\  = \ x(1\  - \ x)(2x\  - \ 1)$$

$$On\ \left\lbrack 0,\frac{1}{2} \right\rbrack:\ (2x\  - \ 1) < \ 0,\ so\ f\  < \ g\ (second\ curve\ above)$$

$$On\ \left\lbrack \frac{1}{2},\ 1 \right\rbrack:\ (2x\  - \ 1) > \ 0,\ so\ f\  > \ g\ (first\ curve\ above)$$

$$By\ symmetry,\ both\ regions\ have\ equal\ area.$$

$$Area\  = \ 2\int_{0}^{\frac{1}{2}}\left( x(1\  - \ x)^{2} - \ x^{2}(1\  - \ x) \right)dx$$

$$= \ 2\int_{0}^{\frac{1}{2}}{x(1\  - \ x)(1\  - \ 2x)}dx$$

$$= \ 2\int_{0}^{\frac{1}{2}}\left( x\  - \ 3x^{2} + \ 2x^{3} \right)dx$$

$$= \ 2\left\lbrack \frac{x^{2}}{2} - \ x^{3} + \frac{x^{4}}{2} \right\rbrack_{0}^{\frac{1}{2}}$$

$$= \ 2\left( \frac{1}{8} - \frac{1}{8} + \frac{1}{32} \right)$$

$$= \frac{1}{16}\ u^{2}$$

# Trapezoidal Rule

+----------------------------------------------------------------------------------------------------------------------------------------+
| - **Trapezoidal Rule**                                                                                                                 |
+========================================================================================================================================+
| An area with an irregular boundary can be approximated as a trapezium.                                                                 |
|                                                                                                                                        |
| The area of this trapezium is used to estimate the area.                                                                               |
|                                                                                                                                        |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image63.png){width="1.5581288276465441in"                               |
| height="1.5748031496062993in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image63.png){width="1.5581288276465441in" |
| height="1.5748031496062993in"}                                                                                                         |
|                                                                                                                                        |
| > $$A \approx \frac{h}{2}\left( d_{f} + d_{l} \right)$$                                                                                |
+----------------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------+
| - **Example** Estimate area using trapezoidal rule                                                       |
+==========================================================================================================+
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image64.png){width="1.6333333333333333in" |
| height="2.170369641294838in"}Estimate the area by modelling the area as a trapezium.                     |
|                                                                                                          |
| > $$A \approx \frac{h}{2}\left( d_{f} + d_{l} \right)$$                                                  |
| >                                                                                                        |
| > $$\ \ \ \  \approx \frac{18}{2}(26 + 35)$$                                                             |
| >                                                                                                        |
| > $\approx 549\ m^{2}$                                                                                   |
+----------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                    |
+==========================================================================================================+
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image65.png){width="1.4230774278215224in" |
| height="2.1335094050743657in"}Estimate the area by modelling the area as a trapezium.                    |
|                                                                                                          |
| 3000 $m^{2}$                                                                                             |
+----------------------------------------------------------------------------------------------------------+
| - **Trapezoidal Rule with More Applications**                                                            |
+----------------------------------------------------------------------------------------------------------+
| By using more than one application of the trapezoidal rule, we get a more accurate estimate for the      |
| area.                                                                                                    |
|                                                                                                          |
|   -----------------------------------------------------------------                                      |
|   **Actual Area**       **1 Application**     **2 Applications**                                         |
|   --------------------- --------------------- ---------------------                                      |
|                                                                                                          |
|   -----------------------------------------------------------------                                      |
+----------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------+
| - **Example** Estimate area using trapezoidal rule                                                       |
+==========================================================================================================+
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image66.png){width="1.6333333333333333in" |
| height="2.170369641294838in"}Estimate the area by modelling the area as two trapeziums.                  |
|                                                                                                          |
| > $A \approx A_{AFEB} + A_{FDCE}$                                                                        |
| >                                                                                                        |
| > $$\ \ \ \  \approx \frac{9}{2}(26 + 31) + \frac{9}{2}(31 + 35)$$                                       |
| >                                                                                                        |
| > $$\ \ \ \  \approx 256.5 + 297$$                                                                       |
| >                                                                                                        |
| > $\approx 534\ m^{2}$                                                                                   |
+----------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                                                                                                                                                                                             |
+=========================================================================================================================================================+=========================================================================================================================================================+
| Estimate this area to the nearest square metre using two applications of trapezoidal rule.                                                                                                                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image67.png){width="1.648086176727909in" height="1.307755905511811in"}               | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image68.png){width="1.7291666666666667in" height="1.132638888888889in"}              |
|                                                                                                                                                         |                                                                                                                                                         |
| 365 m²                                                                                                                                                  | 372 m²                                                                                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Trapezoidal rule with Functions                                                                                                                                                                                                                                                               |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| We can approximate areas bounded by functions using trapezoidal rule as well.                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                                   |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image69.png){width="2.440850831146107in" height="2.3622047244094486in"}Find the area under $f(x) =$ $\frac{1}{x}$ using:                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                   |
| 1 application of trapezoidal rule:                                                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                   |
| 4 applications of trapezoidal rule:                                                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                                   |
| Check the exact area by evaluating the integral:                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                   |
| $$\ \ \ \ \ \int_{1}^{5}\frac{1}{x}dx$$                                                                                                                                                                                                                                                                           |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image70.png){width="3.2957174103237095in" height="2.3622047244094486in"}Consider a function with $n$ intervals.                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                                   |
| The height of each trapezium is: ...............                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                   |
| The first trapezium has area: ...............                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                                   |
| The second trapezium has area: ............                                                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                                   |
| $$\ \ \ \ \int_{a}^{b}{f(x)}dx$$                                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                   |
| $$\approx \frac{b - a}{2n}\left( f(a) + f\left( x_{1} \right) \right) + \frac{b - a}{2n}\left( f\left( x_{1} \right) + f\left( x_{2} \right) \right) + \frac{b - a}{2n}\left( f\left( x_{2} \right) + f\left( x_{3} \right) \right)\ldots + \frac{b - a}{2n}\left( f\left( x_{n - 1} \right) + f(b) \right)$$     |
|                                                                                                                                                                                                                                                                                                                   |
| $$\approx \frac{b - a}{2n}\left( f(a) + f\left( x_{1} \right) + f\left( x_{1} \right) + f\left( x_{2} \right) + \ldots\left( f_{n - 1} \right) + f(b) \right)$$                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                   |
| $$\approx \frac{b - a}{2n}(f(a) + f(b) + 2\left( f\left( x_{1} \right) + f\left( x_{2} \right) + \ldots + f\left( x_{n - 1} \right) \right)$$                                                                                                                                                                     |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Trapezoidal Rule with Functions**                                                                                                                                                                                                                      |
+==========================================================================================================+=================================================================================================================================================+
| Sometimes we may want to find the area bounded by a curve but:                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                            |
| - We may not have a function rule.                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                            |
| - It may not be possible to integrate a function algebraically $f(x) = e^{x^{2}}$.                                                                                                                                                                         |
|                                                                                                                                                                                                                                                            |
| We can approximate the area by splitting the area up into **trapeziums**\                                                                                                                                                                                  |
| (this is more accurate than the rectangles we use in Riemann Sums).                                                                                                                                                                                        |
+----------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image71.png){width="1.8416666666666666in" | $\mathbf{n}$ **intervals**                                                                                                                      |
| height="1.9736111111111112in"}**One interval**                                                           |                                                                                                                                                 |
|                                                                                                          | $$\int_{a}^{b}{f(x)}dx \approx \frac{h}{2}\left\lbrack f(a) + f(b) + 2(f\left( x_{1} \right) + \ldots f\left( x_{n - 1} \right) \right\rbrack$$ |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image72.png){width="2.1534722222222222in" |                                                                                                                                                 |
| height="1.9736111111111112in"}                                                                           | $$\ \ \ \ \ \ where\ h = \frac{b - a}{2}$$                                                                                                      |
|                                                                                                          |                                                                                                                                                 |
| $$\int_{a}^{b}{f(x)}dx \approx \frac{(b - a)}{2}\left\lbrack f(a) + f(b) \right\rbrack$$                 |                                                                                                                                                 |
+----------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------+
| - A clear way of setting out is to first calculate the height of each trapezium and then setting up a table of values with the function values.                                                                                                            |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Estimate area bounded by functions using trapezoidal rule                                                          |
+==================================================================================================================================+
| $$Find\ \int_{2}^{3}\left( \frac{2}{x - 1} \right)dx\ using\ 4\ subintervals.\ Round\ your\ answer\ to\ 3\ d.p.$$                |
|                                                                                                                                  |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image73.png){width="1.8328904199475065in"                         |
| height="1.7944892825896763in"}The height of each trapezium is                                                                    |
|                                                                                                                                  |
| $$h = \frac{b - a}{n} = \frac{1}{4} = 0.25$$                                                                                     |
|                                                                                                                                  |
|   ----------------------------------------------------                                                                           |
|     $$x$$       2     2.25     2.5      2.75      3                                                                              |
|   ---------- ------- ------- -------- -------- -------                                                                           |
|    $$f(x)$$     2      1.6    1.3333   1.1428     1                                                                              |
|                                                                                                                                  |
|   ----------------------------------------------------                                                                           |
|                                                                                                                                  |
| $$\int_{2}^{3}\left( \frac{2}{x - 1} \right)dx \approx \frac{0.25}{2}\left( f(2) + f(3) + 2(f(2.25) + f(2.5) + f(2.75) \right)$$ |
|                                                                                                                                  |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  \approx 0.125\left( 2 + 1 + 2(1.6 + 1.3333 + 1.1428 \right)$$         |
|                                                                                                                                  |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  \approx 1.394$$                                                       |
+----------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                           |
+=================================================================================================================================================+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image74.png){width="1.968503937007874in" height="1.9272615923009624in"}Use   |
|     trapezoidal rule with 3 subintervals to find an approximation to 3 d.p.                                                                     |
|                                                                                                                                                 |
| $$\ \ \ \ \ \ \ \ \ \ \ \int_{1}^{7}\left( 3\ln x \right)dx$$                                                                                   |
|                                                                                                                                                 |
| The height of each trapezium is .....................                                                                                           |
|                                                                                                                                                 |
|   ------------------------------------------                                                                                                    |
|   $$x$$         1                       7                                                                                                       |
|   ---------- ------- ------- ------- -------                                                                                                    |
|   $$f(x)$$                                                                                                                                      |
|                                                                                                                                                 |
|   ------------------------------------------                                                                                                    |
|                                                                                                                                                 |
| $$\int_{a}^{b}{f(x)}dx \approx \frac{h}{2}\left\lbrack f(a) + f(b) + 2(f\left( x_{1} \right) + \ldots f\left( x_{n - 1} \right) \right\rbrack$$ |
|                                                                                                                                                 |
| $22.086$ vs actual 22.864                                                                                                                       |
+-------------------------------------------------------------------------------------------------------------------------------------------------+
| b.  Use trapezoidal rule with 4 subintervals to find an approximation to 3 d.p.                                                                 |
|                                                                                                                                                 |
| ![](media/Integral Calculus 3_Further Areas under Curves/media/image75.png){width="1.949090113735783in" height="1.9066830708661417in"}          |
|                                                                                                                                                 |
| $$\ \ \ \ \ \ \ \ \ \ \ \int_{0}^{2}\left( 2^{x^{2}} \right)dx$$                                                                                |
|                                                                                                                                                 |
| 8.223 vs actual 7.340                                                                                                                           |
+-------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Accuracy of Trapezoidal Rule**                                |
+===================================================================+
| The more intervals you use, the more accurate the estimate.       |
|                                                                   |
| If the curve is concave up in the region, the trapezoidal rule    |
| overestimates the integral.                                       |
|                                                                   |
| If the curve is concave down in the region, the trapezoidal rule  |
| underestimates the integral.                                      |
|                                                                   |
| If the curve is linear, the trapezoidal rule gives the exact      |
| value of the integral.                                            |
+-------------------------------------------------------------------+

Foundation

1.  Approximate $\int_{2}^{6}{\ f(x)}dx$ using the formula
    $\frac{h}{2}(a\  + \ b)$ for the area of a trapezium.

+--------------------------------------------------------------+-----------------------------------------------------------------+------------------------------------------------------------------------------------+
| a.                                                           | b.                                                              | c.                                                                                 |
|                                                              |                                                                 |                                                                                    |
|   --------------------------------                           |   --------------------------------                              |   --------------------------------                                                 |
|    $$\mathbf{x}$$   **2**   **6**                            |    $$\mathbf{x}$$   **2**   **6**                               |    $$\mathbf{x}$$   **2**   **6**                                                  |
|   ---------------- ------- -------                           |   ---------------- ------- -------                              |   ---------------- ------- -------                                                 |
|       $$f(x)$$        8      12                              |       $$f(x)$$       6.2     4.8                                |       $$f(x)$$       −4      −9                                                    |
|                                                              |                                                                 |                                                                                    |
|   --------------------------------                           |   --------------------------------                              |   --------------------------------                                                 |
|                                                              |                                                                 |                                                                                    |
| $$A\  = \ \left( \frac{1}{2} \right)(8\  + \ 12)(4) = \ 40$$ | $$A\  = \ \left( \frac{1}{2} \right)(6.2\  + \ 4.8)(4) = \ 22$$ | $$A\  = \ \left( \frac{1}{2} \right)\left( - 4\  + \ ( - 9) \right)(4) = \  - 26$$ |
+==============================================================+=================================================================+====================================================================================+

2.  Three function values are given in the table.

  -----------------------------------------
   $$\mathbf{x}$$   **2**   **6**   **10**
  ---------------- ------- ------- --------
      $$f(x)$$       12      20       30

  -----------------------------------------

a.  Approximate $\int_{2}^{10}{\ f(x)}dx$ by calculating the areas of
    two trapezia and then adding.

$$First\ trapezium:\ \left( \frac{1}{2} \right)(12\  + \ 20)(4) = \ 64$$

$$Second\ trapezium:\ \left( \frac{1}{2} \right)(20\  + \ 30)(4) = \ 100$$

$$Total\  = \ 164$$

b.  Check your answer to part **a** by using the formula for the
    trapezoidal rule.

$h\  = \ 4$, using formula:

$$A\  \approx \ \left( \frac{4}{2} \right)\left( 12\  + \ 2(20) + \ 30 \right) = 164$$

3.  Use the trapezoidal rule with the three given function values to
    approximate $\int_{- 5}^{5}{\ f(x)}dx.$

  -----------------------------------------
   $$\mathbf{x}$$   **−5**   **0**   **5**
  ---------------- -------- ------- -------
      $$f(x)$$       2.4      2.6     4.4

  -----------------------------------------

$$h\  = \ 5$$

$$A\  \approx \ \left( \frac{5}{2} \right)\left( 2.4\  + \ 2(2.6) + \ 4.4 \right) = \ \left( \frac{5}{2} \right)(12) = \ 30$$

4.  Use the trapezoidal rule to find the approximate area of each
    irregular figure.

+-------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image76.png){width="2.280939413823272in" | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image77.png){width="2.232143482064742in" |
|     height="1.3102340332458442in"}                                                                          |     height="1.9106955380577428in"}                                                                          |
|                                                                                                             |                                                                                                             |
| $7.45$ m²                                                                                                   | $39.25$ m²                                                                                                  |
+=============================================================================================================+=============================================================================================================+

5.  a.  Complete this table for the function $y\  = \ x(4\  - \ x)$.

  --------------------------------------------------------
   $$\mathbf{x}$$   **0**   **1**   **2**   **3**   **4**
  ---------------- ------- ------- ------- ------- -------
       $$y$$                                       

  --------------------------------------------------------

b.  Hence use the trapezoidal rule with five function values to
    approximate$\ \int_{0}^{4}{\ x(4\  - \ x)}dx.$

$$h\  = \ 1$$

$$A\  \approx \ \left( \frac{1}{2} \right)\left( 0\  + \ 2(3 + 4 + 3) + \ 0 \right) = \ 10$$

c.  What is the exact value of $\int_{0}^{4}{\ x(4\  - \ x)}dx$, and why
    does it exceed the approximation? Sketch the curve and the four
    trapeziums involved.

![](media/Integral Calculus 3_Further Areas under Curves/media/image78.png){width="1.9465277777777779in"
height="1.9680555555555554in"}

$$\int_{0}^{4}{\ \left( 4x\  - \ x^{2} \right)}dx$$

$$= \ \left\lbrack 2x^{2} - \frac{x^{3}}{3} \right\rbrack_{0}^{4}$$

$$= \ 32\  - \frac{64}{3}$$

$$= \ 10\frac{2}{3}$$

The curve $y\  = \ x(4\  - \ x)$ is a concave down parabola (you can
also check second derivative).\
The chords lie below the curve, so the trapezoidal approximation
underestimates the integral.

6.  a.  Complete this table for the function $y\  =$ $\frac{6}{x}$.

  --------------------------------------------------------
   $$\mathbf{x}$$   **1**   **2**   **3**   **4**   **5**
  ---------------- ------- ------- ------- ------- -------
       $$y$$                                       

  --------------------------------------------------------

b.  Use the trapezoidal rule with the five function values above, that
    is with four subintervals, to approximate $\int_{1}^{5}\frac{6}{x}$
    $dx$.

$$h\  = \ 1\ $$

$$A\  \approx \ \left( \frac{1}{2} \right)\left( 6\  + \ 2\left( 3 + 2 + \frac{3}{2} \right) + \frac{6}{5} \right)$$

$$= \frac{101}{10}$$

c.  Show that the second derivative of $y\  =$ $\frac{6}{x}$ is
    $y''\  = \ 12x^{- 3},$ and use this result to explain why the
    approximation will exceed the exact value of the integral.

![](media/Integral Calculus 3_Further Areas under Curves/media/image79.png){width="1.946101268591426in"
height="1.9680555555555554in"}

$$y\  = \ 6x^{- 1}$$

$$y' = \  - 6x^{- 2}$$

$$y''\  = \ 12x^{- 3}$$

For $x\  > \ 0,\ y''\  > \ 0$, so the curve is concave up on \[1, 5\].\
The chords lie above the curve, so the trapezoidal approximation
overestimates the integral.

Development

7.  a.  Complete this table correct to four decimal places for the
        function $y\  = \ \sqrt{x}$.

  ---------------------------------------------------------------------------------------
   $$\mathbf{x}$$   **9**   **10**   **11**   **12**   **13**   **14**   **15**   **16**
  ---------------- ------- -------- -------- -------- -------- -------- -------- --------
       $$y$$                                                                     

  ---------------------------------------------------------------------------------------

b.  Approximate $\int_{9}^{16}{\ \sqrt{x}}dx$, using the trapezoidal
    rule with the eight function values above. Give your answer correct
    to three significant figures.

$$h\  = \ 1$$

$$A\  \approx \ \left( \frac{1}{2} \right)\left( 3\  + \ 2(3.1623 + 3.3166 + 3.4641 + 3.6056 + 3.7417 + 3.8730) + \ 4 \right)$$

$$\approx \ 24.7\ (3\ s.f.)$$

c.  What is the exact value of $\int_{9}^{16}{\ \sqrt{x}}dx$?

$$\int_{9}^{16}{\ \sqrt{x}}dx\  = \ \int_{9}^{16}{\ x^{\frac{1}{2}}}dx\  = \ \left\lbrack \left( \frac{2}{3} \right)x^{\frac{3}{2}} \right\rbrack_{9}^{16}$$

$$= \ \left( \frac{2}{3} \right)(64\  - \ 27)$$

$$= \ 24\frac{2}{3}$$

d.  Show that the second derivative of $y\  = \ x^{\frac{1}{2}}$ is
    $y''\  = \  - \left( \frac{1}{4} \right)x^{- \frac{3}{2}}$, and use
    this result to explain why the approximation is less than the value
    of the definite integral.

$$y\  = \ x^{\frac{1}{2}}$$

$$y'\  = \ \left( \frac{1}{2} \right)x^{- \frac{1}{2}}$$

$$y''\  = \  - \left( \frac{1}{4} \right)x^{- \frac{3}{2}}$$

For $x\  > \ 0,\ y''\  < \ 0$, so the curve is concave down on \[9,
16\].\
The chords lie below the curve, so the trapezoidal approximation is less
than the exact value.

8.  Use the trapezoidal rule with five function values to approximate
    each definite integral, writing your answer correct to three
    significant figures where necessary.

+----------------------------------------------------+------------------------------------------------+
| a.  $\int_{2}^{6}{\ \left( \frac{1}{x} \right)}dx$ | b.  $\int_{0}^{2}\frac{1}{2\  + \ \sqrt{x}}dx$ |
|                                                    |                                                |
| $$\approx \ 1.12\ (3\ s.f.)$$                      | ≈ 0.705 (3 s.f.)                               |
+====================================================+================================================+
| c.  $\int_{4}^{8}{\ \sqrt{x^{2} - \ 3}}dx$         | d.  $\int_{1}^{2}{log_{10}x\ }dx$              |
|                                                    |                                                |
| $$\approx \ 22.9\ (3\ s.f.)$$                      | $$\approx \ 0.167\ (3\ s.f.)$$                 |
+----------------------------------------------------+------------------------------------------------+

9.  An object is moving along the $x$-axis with values of the velocity
    $v$ in m/s at various times $t$ given in the table.

  ----------------------------------------------------------------
   $$\mathbf{t}$$   **0**   **1**   **2**   **3**   **4**   **5**
  ---------------- ------- ------- ------- ------- ------- -------
       $$v$$         1.5     1.3     1.4     2.0     2.4     2.7

  ----------------------------------------------------------------

> Given that the distance travelled may be found by calculating the area
> under the velocity/time graph, use the trapezoidal rule to estimate
> the distance travelled by the particle in the first 5 seconds.

$$h\  = \ 1$$

$$Distance\  \approx \ \left( \frac{1}{2} \right)\left( 1.5\  + \ 2(1.3 + 1.4 + 2.0 + 2.4) + \ 2.7 \right)$$

= 9.2 metres

10. The diagram to the right shows the width of a lake at 10-metre
    intervals.\
    Use the trapezoidal rule to estimate the surface area of the water.

![](media/Integral Calculus 3_Further Areas under Curves/media/image80.png){width="2.072746062992126in"
height="1.2426159230096239in"}

$h\  = \ 10$, widths at
$x\  = \ 0,\ 10,\ 20,\ 30,\ 40:\ 0,\ 20,\ 18,\ 17,\ 0$

$$A\  \approx \ \left( \frac{10}{2} \right)\left( 0\  + \ 2(20) + \ 2(18) + \ 2(17) + \ 0 \right) = \ 5(110) = \ 550\ m^{2}$$

11. The diagram shows a vertical rock cutting of length 300 metres
    alongside a straight horizontal section of highway. The heights of
    the cutting are measured at 50-metre intervals. Use the trapezoidal
    rule to estimate the area of the vertical rock cutting.

![](media/Integral Calculus 3_Further Areas under Curves/media/image81.png){width="2.1326804461942257in"
height="1.1885247156605425in"}

$A\  \approx \frac{50}{2}\left( 5\  + \ 2(10\  + \ 13 + \ 14\  + \ 11\  + \ 7) + \ 3 \right)\ m^{2}$

$= 2950$ m²

12. a.  Use the trapezoidal rule with five function values to
        approximate $\int_{0}^{1}{\ \sqrt{1\  - \ x^{2}}}dx$, giving
        your answer correct to four decimal places.

$$A\  \approx \ 0.7489\ (4\ d.p.)$$

b.  Use part **a** and the fact that $y\  = \ \sqrt{1\  - \ x^{2}}$ is a
    semi-circle to approximate $\pi$. Give your answer correct to one
    decimal place, and explain why your approximation is less than
    $\pi$.

$y\  = \ \sqrt{1\  - \ x^{2}}$ is the upper half of the unit circle
$x²\  + \ y²\  = \ 1.$

So $A \approx 0.7489\$represents one quarter of a unit circle:
$\frac{1}{4}$ $\pi(1)^{2}$

So $\pi\  \approx \ 4\  \times \ 0.7489\  \approx \ 3.0$ (1 d.p.)

Since the semicircle is concave down, the approximation is less than
$\pi$

# Area under Exponential, Reciprocal, and Trigonometric Curves

Foundation

1.  a.  Find the area of the region bounded by the curve
        $y\  = \ e^{\frac{x}{2}}$, the $x$-axis,\
        and the lines $x = - 1$ and $x = 2$.

![](media/Integral Calculus 3_Further Areas under Curves/media/image82.png){width="1.63125in"
height="1.5743055555555556in"}

$$\int_{- 1}^{2}e^{\frac{x}{2}}dx\  = \ \left\lbrack 2e^{\frac{x}{2}} \right\rbrack_{- 1}^{2}$$

$$= \ 2e\  - \ 2e^{- \frac{1}{2}}\ u^{2}$$

b.  Find the area of the region bounded by the curve $y\  = \ e^{- x},$
    the $x$-axis,\
    the $y$-axis and the line $x = 1$.

![](media/Integral Calculus 3_Further Areas under Curves/media/image83.png){width="1.5152777777777777in"
height="1.5743055555555556in"}

$$\int_{0}^{1}e^{- x}dx\  = \ \left\lbrack - e^{- x} \right\rbrack_{0}^{1}$$

$$= \  - e^{- 1} + \ 1\ $$

$$= \ \left( 1\  - \ e^{- 1} \right)\ u^{2}$$

2.  a.  Find the area of the shaded region under $y\  = \frac{1}{x}$
        from $x = 2$ to $x = 3$.

![](media/Integral Calculus 3_Further Areas under Curves/media/image84.png){width="1.5847222222222221in"
height="1.5743055555555556in"}

$$\int_{2}^{3}\left( \frac{1}{x} \right)dx\  = \ \lbrack ln\ x\rbrack_{2}^{3}$$

$$= \ \ln\ 3\  - \ \ln\ 2\ u^{2}$$

b.  Find the area of the shaded region under $y\  = \frac{1}{x}$ from
    $x = \frac{1}{2}$ to $x = 2$.

![](media/Integral Calculus 3_Further Areas under Curves/media/image85.png){width="1.5645833333333334in"
height="1.5743055555555556in"}

$$\int_{\frac{1}{2}}^{2}\left( \frac{1}{x} \right)dx\  = \ \lbrack ln\ x\rbrack_{\frac{1}{2}}^{2}$$

$$= \ln 2 - \ \ln\left( \frac{1}{2} \right)$$

$$= \ 2\ \ln\ 2\ u^{2}$$

3.  a.  Find the area of the region in the first quadrant bounded by the
        coordinate axes and the curve $y = e - e^{x}$.

![](media/Integral Calculus 3_Further Areas under Curves/media/image86.png){width="1.609268372703412in"
height="1.5632884951881014in"}

$$\int_{0}^{1}(e\  - \ eˣ)dx\  = \ \lbrack ex\  - \ eˣ\rbrack_{0}^{1}$$

$$= \ (e\  - \ e) - \ (0\  - \ 1)$$

$$= \ 1\ u^{2}$$

b.  Find the area between the $x$-axis, the curve $y\  = \ eˣ\  - \ 1$
    and the line $x\  = \  - 1$.

![](media/Integral Calculus 3_Further Areas under Curves/media/image87.png){width="1.5977919947506563in"
height="1.5632884951881014in"}

$$- \int_{- 1}^{0}\left( e^{x}\  - \ 1 \right)dx\  = \  - \left\lbrack e^{x} - x \right\rbrack_{- 1}^{0}$$

$$= \  - \left\lbrack (1) - \ \left( e^{- 1} + \ 1 \right) \right\rbrack$$

$$= \ e^{- 1}\ u^{2}$$

c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image88.png){width="1.5765583989501313in"
    height="1.5632884951881014in"}What is the area bounded by
    $x\  = \ 2,\ y\  = \ e^{- x} - \ 2$, the $x$-axis and the $y$-axis?

$$- \int_{0}^{2}\left( e^{- x} - 2 \right)dx = - \left\lbrack - e^{- x} - \ 2x \right\rbrack_{0}^{2}$$

$$= \  - \left\lbrack \left( - e^{- 2} - \ 4 \right) - \ ( - 1) \right\rbrack$$

$$= \ \left( 3\  + \ e^{- 2} \right)\ u^{2}$$

d.  Find the area of the region bounded by the curve
    $y\  = \ e^{- x} - \ e$ and the coordinate axes.

![](media/Integral Calculus 3_Further Areas under Curves/media/image89.png){width="1.5708333333333333in"
height="1.5631944444444446in"}

$$- \int_{- 1}^{0}\left( e^{- x} - \ e \right)dx\  = \  - \left\lbrack - e^{- x} - \ ex \right\rbrack_{- 1}^{0}$$

$$= \  - \left\lbrack ( - 1) - \ ( - e\  + \ e) \right\rbrack$$

$$= \ 1\ u^{2}$$

e.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image90.png){width="1.5421402012248469in"
    height="1.5631944444444446in"}Find the area of the region bounded by
    the curve $y\  = \ 3\  - \ e^{- x}$, the $x$-axis, and the lines
    $x = - 1$ and $x = 2$.

$$\ \int_{- 1}^{2}\left( 3\  - \ e^{- x} \right)dx\  = \ \left\lbrack 3x\  + \ e^{- x} \right\rbrack_{- 1}^{2}$$

$$= \ \left( 6\  + \ e^{- 2} \right) - \ ( - 3\  + \ e)$$

$$= \ \left( 9\  + \ e^{- 2} - \ e \right)\ u^{2}$$

4.  a.  Calculate the area of the shaded region between
        $y\  = \ \sin\ x$ and the $x$-axis from $x\  = \frac{\pi}{6}$ to
        $x\  = \ \pi$.

![](media/Integral Calculus 3_Further Areas under Curves/media/image91.png){width="2.0901935695538056in"
height="1.5748031496062993in"}

$$\int_{\frac{\pi}{6}}^{\frac{\pi}{2}}\sin x\ \ dx\  = \ \left\lbrack - \cos\ x \right\rbrack_{\frac{\pi}{6}}^{\frac{\pi}{2}}$$

$$= \ 0\  + \frac{\sqrt{3}}{2}$$

$$= \ \left( \frac{1}{2} \right)\sqrt{3}u^{2}\ $$

b.  Calculate the area of the shaded region between $y\  = \ \cos\ x$
    and the $x$-axis from $x\  = \frac{\pi}{2}$ to $x\  = \ \pi$.

![](media/Integral Calculus 3_Further Areas under Curves/media/image92.png){width="1.9634426946631671in"
height="1.5748031496062993in"}

$$- \int_{\frac{2\pi}{3}}^{\pi}\cos x\ \ dx\  = \  - \lbrack sin\ x\rbrack_{\frac{2\pi}{3}}^{\pi}$$

$$= \  - \left( 0\  - \frac{\sqrt{3}}{2} \right)$$

$$= \ \left( \frac{1}{2} \right)\sqrt{3}u^{2}$$

5.  a.  Find the area between the curve $y = \ e^{x} + e^{- x}$ and the
        $x$-axis, from $x = - 2$ to $x = 2$.

$$eˣ\  + \ e^{- x} > \ 0\ for\ all\ x.$$

$$Area\  = \ \int_{- 2}^{2}\left( eˣ\  + \ e^{- x} \right)dx\  = \ \left\lbrack eˣ\  - \ e^{- x} \right\rbrack_{- 2}^{2}$$

$$= \ \left( e^{2} - \ e^{- 2} \right) - \ \left( e^{- 2} - \ e^{2} \right)$$

$$= \ 2\left( e^{2} - \ e^{- 2} \right)$$

$$\Doteq \ 14.51\ u^{2}$$

b.  Find the area between the curve $y = x² + eˣ$ and the $x$-axis, from
    $x\  = \  - 3$ to $x\  = \ 3$.

$$x²\  + \ eˣ\  > \ 0\ for\ all\ x.$$

$$Area\  = \ \int_{- 3}^{3}\left( x^{2} + \ eˣ \right)dx\  = \ \left\lbrack \frac{x^{3}}{3} + \ eˣ \right\rbrack_{- 3}^{3}$$

$$= \ \left( 9\  + \ e^{3} \right) - \ \left( - 9\  + \ e^{- 3} \right)$$

$$= \ 18\  + \ e^{3} - \ e^{- 3}$$

$$\Doteq \ 38.04\ u^{2}$$

6.  a.  Find the area enclosed between $y\  = \ \sin\ x$ and the
        $x$-axis over $x\  = \frac{\pi}{3}$ to $x\  = \frac{\pi}{2}$.

$$\ \int_{\frac{\pi}{3}}^{\frac{\pi}{2}}\sin x\ \ dx\  = \ \left\lbrack - \cos\ x \right\rbrack_{\frac{\pi}{3}}^{\frac{\pi}{2}}$$

$$= \ 0\  + \frac{1}{2}$$

$$= \frac{1}{2}u^{2}$$

b.  Find the area enclosed between $y\  = \ \sin\ 2x$ and the $x$-axis
    over $x\  = \frac{\pi}{4}$ to $x\  = \frac{\pi}{2}.$

$$\ \int_{\frac{\pi}{4}}^{\frac{\pi}{2}}\sin 2x\ \ dx\  = \ \left\lbrack - \left( \frac{1}{2} \right)\cos\ 2x \right\rbrack_{\frac{\pi}{4}}^{\frac{\pi}{2}}$$

$$= \ \left( \frac{1}{2} \right) + \ 0\ $$

$$= \frac{1}{2}u^{2}$$

c.  Find the area enclosed between $y\  = \ cos\ x$ and the $x$-axis
    over $x\  = \frac{\pi}{3}$ to $x\  = \frac{\pi}{2}$.

$$\int_{\frac{\pi}{3}}^{\frac{\pi}{2}}\cos x\ \ dx\  = \ \left\lbrack \sin\ x \right\rbrack_{\frac{\pi}{3}}^{\frac{\pi}{2}} = \ 1\  - \frac{\sqrt{3}}{2}$$

$$= \ \left( \frac{1}{2} \right)\left( 2\  - \ \sqrt{3} \right)\ u^{2}$$

d.  Find the area enclosed between $y\  = \ \cos\ 3x$ and the $x$-axis
    over $x\  = \frac{\pi}{12}$ to $x\  = \frac{\pi}{6}$.

$$\int_{\frac{\pi}{12}}^{\frac{\pi}{6}}\cos 3x\ \ dx\  = \ \left\lbrack \left( \frac{1}{3} \right)\sin\ 3x \right\rbrack_{\frac{\pi}{12}}^{\frac{\pi}{6}}$$

$$= \ \left( \frac{1}{3} \right)\left( \sin\left( \frac{\pi}{2} \right) - \ \sin\left( \frac{\pi}{4} \right) \right)$$

$$= \ \left( \frac{1}{6} \right)\left( 2\  - \ \sqrt{2} \right)u^{2}\ $$

e.  Find the area enclosed between $y\  = \ sec²\ x$ and the $x$-axis
    over$\ x\  = \frac{\pi}{6}$ to $x\  = \frac{\pi}{3}.$

$$\int_{\frac{\pi}{6}}^{\frac{\pi}{3}}{sec^{2}x}\ dx\  = \ \left\lbrack \tan\ x \right\rbrack_{\frac{\pi}{6}}^{\frac{\pi}{3}}$$

$$= \ \sqrt{3} - \frac{1}{\sqrt{3}}$$

$$= \ \left( \frac{2}{3} \right)\sqrt{3}u^{2}$$

f.  Find the area enclosed between
    $y\  = \ \sec^{2}\left( \frac{x}{2} \right)$ and the $x$-axis over
    $x\  = \  - \frac{\pi}{2}$ to$\ x\  = \frac{\pi}{2}$.

$$\int_{- \frac{\pi}{2}}^{\frac{\pi}{2}}{sec^{2}\left( \frac{x}{2} \right)}dx\  = \ \left\lbrack 2\ tan\left( \frac{x}{2} \right) \right\rbrack_{- \frac{\pi}{2}}^{\frac{\pi}{2}}$$

$$= \ 2(1) - \ 2( - 1)$$

$$= \ 4\ u^{2}$$

Development

7.  a.  Find the area between $y\  = \frac{1}{3x\  + \ 2}$ and the
        $x$-axis for $0\  \leq \ x\  \leq \ 1$.

$$\int_{0}^{1}\frac{1}{3x\  + \ 2}\ dx\  = \ \left\lbrack \left( \frac{1}{3} \right)\ln(3x\  + \ 2) \right\rbrack_{0}^{1}$$

$$= \ \left( \frac{1}{3} \right)\left( \ln\ 5\  - \ \ln\ 2 \right)\ u^{2}$$

b.  Find the area between $y\  = \frac{3}{x\  - \ 1}$ and the $x$-axis
    for $2\  \leq \ x\  \leq \ e³\  + \ 1$.

$$\int_{2}^{e^{3} + 1}\frac{3}{x\  - \ 1}\ dx\  = \ \left\lbrack 3\ \ln(x\  - \ 1) \right\rbrack_{2}^{e^{3} + 1}$$

$$= \ 3\ln e^{3} - \ 3\ln 1$$

$$= \ 9\ u^{2}$$

c.  Find the area between $y\  = \frac{1}{x} + \ x$ and the $x$-axis,
    from $x\  = \frac{1}{2}$ to $x\  = \ 2$.

$$\int_{\frac{1}{2}}^{2}\left( \frac{1}{x} + \ x \right)dx\  = \ \left\lbrack \ln\ x\  + \frac{x^{2}}{2} \right\rbrack\left( \frac{1}{2} \right)^{2}$$

$$= \ \left( \ln\ 2\  + \ 2 \right) - \ \left( - \ln\ 2\  + \frac{1}{8} \right)$$

$$= \ 2\ \ln\ 2\  + \frac{15}{8}u^{2}$$

d.  Find the area between $y\  = \frac{1}{x} + \ x^{2}$ and the
    $x$-axis, from $x\  = \ 1$ to $x\  = \ 3$.

$$\int_{1}^{3}\left( \frac{1}{x} + \ x^{2} \right)dx\  = \ \left\lbrack ln\ x\  + \frac{x^{3}}{3} \right\rbrack_{1}^{3}$$

$$= \ \left( \ln\ 3\  + \ 9 \right) - \ \left( 0\  + \frac{1}{3} \right)$$

$$= \ \ln\ 3\  + \frac{26}{3}u^{2}$$

8.  a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image93.png){width="1.4551279527559056in"
        height="1.3448917322834646in"}Sketch the region between the
        graphs of $y = e^{x}$ and $y = x$, between the $y$-axis and\
        $x = 2$, then find its area.

$$On\ \lbrack 0,\ 2\rbrack,\ eˣ\  \geq \ x.$$

$$Area\  = \ \int_{0}^{2}(eˣ\  - \ x)dx\  = \ \left\lbrack eˣ\  - \frac{x^{2}}{2} \right\rbrack_{0}^{2}$$

$$= \ \left( e^{2} - \ 2 \right) - \ 1\ $$

$$= \ \left( e^{2} - \ 3 \right)u^{2}$$

b.  Find the intercepts of the curve $y\  = \ 8\  - \ 2^{x}$ and hence
    find the area of the region bounded by this curve and the coordinate
    axes.

$x$-intercept: $8\  - \ 2ˣ\  = \ 0$, so $2ˣ\  = \ 8,\ x\  = \ 3$.
$y$-intercept: $x\  = \ 0,\ y\  = \ 7.$

Intercepts: (0, 7) and (3, 0).

$$Area\  = \ \int_{0}^{3}(8\  - \ 2ˣ)dx\  = \ \left\lbrack 8x\  - \frac{2ˣ}{\ln 2} \right\rbrack_{0}^{3}$$

$$= \ \left( 24\  - \frac{8}{\ln 2} \right) - \ \left( 0\  - \frac{1}{\ln 2} \right)$$

$$= \ 24\  - \frac{7}{\ln 2}\ u²$$

9.  a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image94.png){width="1.7023031496062992in"
        height="1.5748031496062993in"}Find the area of the region
        bounded by $y\  = \ 3\  - \frac{3}{x}$, the $x$-axis and
        $x\  = \ 3$.

$$\ \int_{1}^{3}\left( 3\  - \frac{3}{x} \right)dx\  = \ \left\lbrack 3x\  - \ 3\ \ln\ x \right\rbrack_{1}^{3}$$

$$= \ \left( 9\  - \ 3\ \ln\ 3 \right) - \ 3\ $$

$$= \ \left( 6\  - \ 3\ \ln\ 3 \right)\ u^{2}$$

b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image95.png){width="1.6402777777777777in"
    height="1.5743055555555556in"}Find the area of the region bounded by
    $y\  = \ 2\  - \frac{1}{x}$, the $x$-axis, $x\  = \ 1$ and
    $x\  = \ 3$.

$$\ \int_{1}^{3}\left( 2\  - \frac{1}{x} \right)dx\  = \ \left\lbrack 2x\  - \ln x \right\rbrack_{1}^{3}$$

$$= \ \left( 6\  - \ln 3 \right) - \ 2\ $$

$$= \ (4\  - \ ln\ 3)\ u²$$

10. a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image96.png){width="1.6476017060367454in"
        height="1.5568153980752406in"}Find the area of the region
        bounded by $y\  = \  - \frac{1}{x}$, the $x$-axis, $x\  = \ 1$
        and $x\  = \ 4$.

$$\int_{1}^{4}\left( \frac{1}{x} \right)dx\  = \ \left\lbrack \ln\ x \right\rbrack_{1}^{4}$$

$$= \ \ln\ 4\ u^{2}$$

b.  Find the area of the region bounded by $y\  = \frac{3}{x} - \ 3$,
    the $x$-axis and $x\  = \ 3$.

![](media/Integral Calculus 3_Further Areas under Curves/media/image97.png){width="1.587247375328084in"
height="1.5568186789151357in"}

$$- \int_{1}^{3}\left( \frac{3}{x} - \ 3 \right)dx\  = \  - \lbrack 3\ ln\ x\  - \ 3x\rbrack_{1}^{3}$$

$$= \  - \left\lbrack \left( 3\ \ln\ 3\  - \ 9 \right) - \ ( - 3) \right\rbrack$$

$$= \ \left( 6\  - \ 3\ \ln\ 3 \right)\ u²$$

11. Calculate the area of the shaded region.

    a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image98.png){width="1.9027865266841644in"
        height="1.5099037620297462in"}

$$\int_{0}^{\frac{\pi}{2}}\left( x\  - \ \sin\ x \right)dx\  = \ \left\lbrack \frac{x^{2}}{2} + \ cos\ x \right\rbrack_{0}^{\frac{\pi}{2}}$$

$$= \ \left( \frac{\pi^{2}}{8} + \ 0 \right) - \ (0\  + \ 1)$$

$$= \ \left( \frac{\pi^{2}}{8} - \ 1 \right)u^{2}$$

b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image99.png){width="1.908211942257218in"
    height="1.5077230971128608in"}

$$\ \int_{- \frac{\pi}{2}}^{\frac{\pi}{2}}(1\  - \ cos\ x)dx\  = \ \lbrack x\  - \ sin\ x\rbrack_{- \frac{\pi}{2}}^{\frac{\pi}{2}}$$

$$= \ \left( \frac{\pi}{2} - \ 1 \right) - \ \left( - \frac{\pi}{2} + \ 1 \right)$$

$$= \ (\pi\  - \ 2)\ u^{2}$$

c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image100.png){width="1.9075470253718285in"
    height="1.48872375328084in"}

$$\int_{0}^{\frac{\pi}{4}}\left( \cos\ x\  - \ \sin\ x \right)dx\  + \ \int_{\frac{\pi}{4}}^{\pi}\left( \sin\ x\  - \ \cos\ x \right)dx$$

$$= \ \left\lbrack \sin\ x\  + \ \cos\ x \right\rbrack_{0}^{\frac{\pi}{4}} + \ \left\lbrack - \cos\ x\  - \ \sin\ x \right\rbrack_{\frac{\pi}{4}}^{\pi}$$

$$= \ \left( \sqrt{2} - \ 1 \right) + \ \left( 1\  + \ \sqrt{2} \right)$$

$$= \ 2\sqrt{2}\ u^{2}$$

d.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image101.png){width="1.8458956692913386in"
    height="1.48872375328084in"}

$$\int_{- \frac{\pi}{2}}^{0}(cos\ x\  - \ x\  - \ 1)dx\  + \ \int_{0}^{\frac{\pi}{2}}(x\  + \ 1\  - \ cos\ x)dx$$

$$= \ \left\lbrack sin\ x\  - \frac{x^{2}}{2} - \ x \right\rbrack_{- \frac{\pi}{2}}^{0} + \ \left\lbrack \frac{x^{2}}{2} + \ x\  - \ sin\ x \right\rbrack_{0}^{\frac{\pi}{2}}$$

$$= \ \left( 0\  - \ \left( - 1\  - \frac{\pi^{2}}{8} + \frac{\pi}{2} \right) \right) + \ \left( \frac{\pi^{2}}{8} + \frac{\pi}{2} - \ 1 \right)$$

$$= \frac{\pi^{2}}{4}u^{2}$$

12. ![](media/Integral Calculus 3_Further Areas under Curves/media/image102.png){width="2.1570450568678914in"
    height="1.5748031496062993in"}

    a.  Sketch the curve $y\  = \ 2\ \cos\ \pi x$, for
        −$1\  \leq \ x\  \leq \ 1$,\
        clearly marking the two $x$-intercepts.

    b.  Find the exact area bounded by the curve
        $y\  = \ 2\ \cos\ \pi x$ and\
        the $x$-axis, between the two $x$-intercepts.

$$\int_{- \frac{1}{2}}^{\frac{1}{2}}2\cos{\pi x}\ dx\  = \ \left\lbrack \left( \frac{2}{\pi} \right)\sin\ \pi x \right\rbrack_{- \frac{1}{2}}^{\frac{1}{2}}$$

$$= \ \left( \frac{2}{\pi} \right)(1) - \ \left( \frac{2}{\pi} \right)( - 1) = \frac{4}{\pi}u^{2}\ $$

13. a.  Differentiate $x²\  + \ 1$, and hence find the area under the
        graph $y\  = \frac{x}{x^{2} + \ 1},$ between $x\  = \ 0$ and
        $x\  = \ 2$.

$$\frac{d}{dx}\left( x^{2} + \ 1 \right) = \ 2x$$

$$so\ \int_{}^{}\frac{x}{x^{2} + \ 1}\ dx\  = \ \left( \frac{1}{2} \right)\ln\left( x^{2} + \ 1 \right) + \ C.$$

$$Area\  = \ \left\lbrack \left( \frac{1}{2} \right)\ln\left( x^{2} + \ 1 \right) \right\rbrack_{0}^{2} = \ \left( \frac{1}{2} \right)\ln\ 5\  \Doteq \ 0.805\ u^{2}$$

b.  Differentiate $x²\  + \ 2x\  + \ 3$, and hence find the area under
    the graph $y\  = \frac{x\  + \ 1}{x^{2} + \ 2x\  + \ 3},$ between
    $x\  = \ 0$ and $x\  = \ 1$.

$$\frac{d}{dx}\left( x^{2} + \ 2x\  + \ 3 \right) = \ 2(x\  + \ 1),\ $$

$$so\ \int_{}^{}\frac{x\  + \ 1}{x^{2} + \ 2x\  + \ 3}\ dx\  = \ \left( \frac{1}{2} \right)\ln\left( x^{2} + \ 2x\  + \ 3 \right) + \ C.$$

$$Area\  = \ \left\lbrack \left( \frac{1}{2} \right)\ln\left( x^{2} + \ 2x\  + \ 3 \right) \right\rbrack_{0}^{1}$$

$$= \left( \frac{1}{2} \right)\ln 6 - \left( \frac{1}{2} \right)\ln 3$$

$$= \ \left( \frac{1}{2} \right)\ln\ 2\ u^{2}$$

14. Draw a rough sketch of the area enclosed between each curve and the
    x-axis over the specified domain, and then find the exact value of
    the area. (Make use of symmetry wherever possible.)

    a.  $y\  = \ \cos\ x$, from $x\  = \ 0\$to $x\  = \ \pi$

$$2\int_{0}^{\frac{\pi}{2}}\cos x\ \ dx\  = \ 2\lbrack sin\ x\rbrack_{0}^{\frac{\pi}{2}}$$

$= \ 2\ u^{2}$

b.  $y\  = \ \sin\ x,$ from $x\  = \frac{\pi}{4}$ to
    $x\  = \frac{3\pi}{4}\$

$$\ \int_{\frac{\pi}{4}}^{\frac{3\pi}{4}}\sin x\ \ dx\  = \ \left\lbrack - \cos\ x \right\rbrack_{\frac{\pi}{4}}^{\frac{3\pi}{4}}$$

$$= \frac{\sqrt{2}}{2} + \frac{\sqrt{2}}{2}$$

$$= \ \sqrt{2}\ u^{2}$$

c.  $y\  = \ \cos\ 2x,$ from $x\  = \ 0$ to $x\  = \ \pi\$

Four half-arches of equal area

$$4\int_{0}^{\frac{\pi}{4}}\cos 2x\ \ dx\  = \ 4\left\lbrack \left( \frac{1}{2} \right)sin\ 2x \right\rbrack_{0}^{\frac{\pi}{4}}$$

$$= \ 4\left( \frac{1}{2} \right)$$

$$= \ 2\ u^{2}$$

d.  $y\  = \ \sin\ 2x$, from $x\  = \frac{\pi}{3}$ to
    $x\  = \frac{2\pi}{3}$

By symmetry about $x\  = \frac{\pi}{2}:$

$2\int_{\frac{\pi}{3}}^{\frac{\pi}{2}}\sin 2x\ \ dx\  = \ 2\left\lbrack - \left( \frac{1}{2} \right)\cos\ 2x \right\rbrack_{\frac{\pi}{3}}^{\frac{\pi}{2}} = \ \frac{1}{2}\ u^{2}$

15. ![](media/Integral Calculus 3_Further Areas under Curves/media/image103.png){width="1.5748031496062993in"
    height="1.62331583552056in"}An arch window 3 metres high and 2
    metres wide is made in the shape of the curve\
    $y\  = \ 3\ \cos\left( \frac{\pi x}{2} \right)$. Find the area of
    the window in square metres, correct to one decimal place.

$$\int_{- 1}^{1}3\cos\left( \frac{\pi x}{2} \right)\ dx\  = \ \left\lbrack \left( \frac{6}{\pi} \right)\sin\left( \frac{\pi x}{2} \right) \right\rbrack_{- 1}^{1}$$

$$= \ \left( \frac{6}{\pi} \right)(1) - \ \left( \frac{6}{\pi} \right)( - 1)$$

$$= \frac{12}{\pi} \Doteq \ 3.8\ m^{2}$$

16. The region $R$ is bounded by the curve $y\  = \ \tan\ x$, the
    $x$-axis and the vertical line $x\  = \frac{\pi}{3}$.\
    Show that $R$ has area ln 2 square units.

$$\int_{0}^{\frac{\pi}{3}}\tan x\ \ dx\  = \ \left\lbrack - \ln(cos\ x) \right\rbrack_{0}^{\frac{\pi}{3}}$$

$$= \  - \ln\left( \frac{1}{2} \right) + \ln 1$$

$$= \ \ln\ 2\ u^{2}$$

17. ![](media/Integral Calculus 3_Further Areas under Curves/media/image104.png){width="1.6252416885389327in"
    height="1.5748031496062993in"}The diagram shows the region above the
    $x$-axis,\
    below both $y\  = \ e\  - \ e^{- x}$ and $y\  = \ e\  - \ e^{x}$.

    a.  Explain why the area of this region\
        may be written as area $= \ 2\int_{0}^{1}{(e\  - \ eˣ)dx}$.

The curves $y\  = \ e\  - \ e^{- x}$ and $y\  = \ e\  - \ eˣ$ are
reflections of each other in the $y$-axis (swapping $x$ with $- x$ swaps
the two curves).\
For $x\  \in \ \lbrack 0,\ 1\rbrack,$ the region above the x-axis lies
below $y\  = \ e\  - \ eˣ$ (which reaches 0 at $x\  = \ 1$). By
symmetry, area = $2\int_{0}^{1}(e\  - \ eˣ)dx$.

b.  Hence find the area of this region.

$$2\lbrack ex\  - \ eˣ\rbrack_{0}^{1} = \ 2\left\lbrack (e\  - \ e) - \ (0\  - \ 1) \right\rbrack = \ 2\ u^{2}$$

13. a.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image105.png){width="1.8118055555555554in"
        height="1.7583333333333333in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image106.png){width="1.7932895888013998in"
        height="1.7549300087489064in"}Consider the area
        $\int_{0}^{2}{\ln x}dy$ on the left.\
        Explain why this is equivalent to finding $\int_{0}^{2}e^{x}dx$
        on the right.

$y = \ln x$ and $y = e^{x}$ are reflections of\
each other across $y = x$.

So, the areas are equivalent.

b.  Hence find $\int_{0}^{2}{\ln x}dy$.

$$\int_{0}^{2}{\ln xdy} = \int_{0}^{2}e^{x}dx$$

$$= \left\lbrack e^{x} \right\rbrack_{0}^{2}$$

$= e^{2} - 1$ $u^{2}$

14. ![](media/Integral Calculus 3_Further Areas under Curves/media/image107.png){width="1.6392563429571303in"
    height="1.5748031496062993in"}Find the area between the curve
    $y = \ln x$, the $y$-axis and the lines $y = 2$ and $y = 4$.

$$A = \int_{2}^{4}e^{x}dx$$

$= e^{4} - e^{2}$ $u^{2}$

15. ![](media/Integral Calculus 3_Further Areas under Curves/media/image108.png){width="1.6222222222222222in"
    height="1.5743055555555556in"}Find the area between the curve
    $y = e^{x}$, the $y$-axis and the lines $y = 1$ and $y = 3$.\
    Hint: subtract the area under the curve from the bounding
    rectangle.\
    You will need to change the limits.

Change limits: $y = 1;x = 0$

$$y = 3,\ x = \ln 3$$

Bounding rectangle: $3 \times \ln 3 = 3\ln 3$

Area under curve: $A = \int_{0}^{\ln 3}e^{x}dx = 3 - 1 = 2$

Area required = $3\ln 3 - 2$ $u^{2}$

16. ![](media/Integral Calculus 3_Further Areas under Curves/media/image109.png){width="1.6222222222222222in"
    height="1.5722222222222222in"}Find the area between the curve
    $y = 2e^{x}$, the $y$-axis, and the lines $y = 3$ and $y = 5$.

$$5\ln\frac{5}{3} - 2\ u^{2}$$

17. Consider $\int_{1}^{3}{\ln x}dx$. We have no direct integration rule
    for $\ln x$.\
    Instead, use the fact that $y = \ln x$ and $y = e^{x}$ are
    reflections of each other across $y = x$.\
    This means $\int_{1}^{3}{\ln x}dx = \int_{1}^{3}e^{x}dy$. We can
    find the area under $y = e^{x}$ by integrating with respect to $x$,
    then subtracting this area from the bounding rectangle:
    $\int_{1}^{3}e^{x}dy = rectangle - \int_{\ln 1}^{\ln 3}e^{x}dx$

![](media/Integral Calculus 3_Further Areas under Curves/media/image110.png){width="1.6041666666666667in"
height="1.5743055555555556in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image111.png){width="1.6333333333333333in"
height="1.5743055555555556in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image112.png){width="1.5979943132108487in"
height="1.5748031496062993in"}

We will find the area bounded by $y = \ln x$, the $x$ axis, $x = 1$ and
$x = 3$ by following these steps:

a.  $\int_{1}^{3}{\ln x}dx \equiv \int_{1}^{3}e^{x}dy$. We also have no
    way of finding this directly. But we can find the area under the
    curve, first, change limits to in terms of $x$.\
    Show that the area under the curve is $\int_{0}^{\ln 3}e^{x}dx$.

$$y = e^{x},\ x = \ln y$$

$$y = 1,\ x = \ln 1 = 0$$

$$y = 3,\ x = \ln 3$$

b.  Therefore, find the area under $y = e^{x}$ from $y = 0$ to
    $y = \ln 3$.

$$\int_{0}^{\ln 3}e^{x}dx = \left\lbrack e^{x} \right\rbrack_{0}^{\ln 3}$$

$= 3 - 1 = 2$ $u^{2}$

c.  Calculate the area of the bounding rectangle with width $\ln 3$ and
    height $3$.

$A_{rect} = 3\ln 3$ $u^{2}$

d.  Therefore, find $\int_{1}^{3}{\ln x}dx$.

$$\int_{1}^{3}{\ln x}dx = rectangle - \int_{0}^{\ln 3}e^{x}dx$$

$= 3\ln 3 - 2$ $u^{2}$

18. Use a similar idea to find these integrals:

+---------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+
| a.                              | b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image113.png){width="1.792361111111111in"                                |
|                                 |     height="1.7715277777777778in"}![](media/Integral Calculus 3_Further Areas under Curves/media/image114.png){width="1.7929965004374453in" |
| $$\int_{1}^{5}{\ln x}dx$$       |     height="1.7715332458442694in"}                                                                                                          |
|                                 |                                                                                                                                             |
| $$5\ln 5 - 4$$                  | $$\int_{1}^{3}{2\ln x}dx$$                                                                                                                  |
|                                 |                                                                                                                                             |
|                                 | $$6\ln 3 - 4$$                                                                                                                              |
+=================================+=============================================================================================================================================+

Mastery

18. ![](media/Integral Calculus 3_Further Areas under Curves/media/image115.png){width="1.5208333333333333in"
    height="1.5743055555555556in"}The diagram shows the region between
    the curve $y\  = \ e^{x}\  - \ e^{- x}$, the $x$-axis and the lines\
    $x\  = \  - 3$ and $x\  = \ 3$.

    a.  Show that $y\  = \ e^{x}\  - \ e^{- x}$ is an odd function.

$f(x)\  = \ eˣ\  - \ e^{- x}.$

$f( - x) = \ e^{- x} - \ eˣ\  = \  - f(x).$ So $f$ is odd.

b.  Hence write down the value of
    $\int_{- 3}^{3}{\left( eˣ\  - \ e^{- x} \right)dx}$ without finding
    a primitive.

$$\int_{- 3}^{3}\left( eˣ\  - \ e^{- x} \right)dx\  = \ 0$$

c.  Explain why the area of this region may be written as area =
    $2\int_{0}^{3}{\left( e^{x} - \ e^{- x} \right)dx}$.

The areas are equal by the odd symmetry

d.  Hence find the area of this region.

$$\ 2\left\lbrack eˣ\  + \ e^{- x} \right\rbrack_{0}^{3}$$

$$= \ 2\left\lbrack \left( e^{3} + \ e^{- 3} \right) - \ 2 \right\rbrack$$

$$= \ 2\left( e^{3} + \ e^{- 3} - \ 2 \right)\ u²$$

19. In this question, give all approximations correct to four decimal
    places.

    a.  Find the area between the curve $y\  = \ e^{x}$ and the
        $x$-axis, for $0\  \leq \ x\  \leq \ 1$, by evaluating an
        appropriate integral. Then approximate the result.

$$Area\  = \ \int_{0}^{1}{eˣ}\ dx\  = \ \lbrack eˣ\rbrack_{0}^{1} = \ e\  - \ 1\  \Doteq \ 1.7183$$

b.  Estimate the area using the trapezoidal rule with two subintervals
    (that is, with three function values).

$$h\  = \ 0.5,f(0) = \ 1,\ f(0.5) = \ e^{0.5},\ f(1) = \ e.$$

$$Area\  \Doteq \ \left( \frac{0.5}{2} \right)\left( 1\  + \ 2e^{0.5} + \ e \right) \Doteq \ 1.7539$$

c.  Is the trapezoidal-rule approximation greater than or less than the
    exact value?\
    Give a geometric explanation.

The approximation is greater than the exact value. $y\  = \ eˣ$ is
concave up $(y''\  = \ eˣ\  > \ 0),$ so the chords lie above the curve.

20. a.  Differentiate $e^{- x^{2}}$ and hence write down a primitive of
        $xe^{- x^{2}}.$

$$\frac{d}{dx}\left( e^{- x^{2}} \right) = \  - 2xe^{- x^{2}}$$

$$So\ a\ primitive\ of\ xe^{- x^{2}}is\  - \left( \frac{1}{2} \right)e^{- x^{2}}.$$

b.  Hence find the area between the curve $y\  = \ xe^{- x^{2}}$ and the
    $x$-axis from $x\  = \ 0$ to $x\  = \ 2$, and from $x\  = \  - 2\$to
    $x\  = \ 2$.

From $x\  = \ 0\ to\ x\  = \ 2:$

$$\int_{0}^{2}{xe^{- x^{2}}}dx\  = \ \left\lbrack - \left( \frac{1}{2} \right)e^{- x^{2}} \right\rbrack_{0}^{2} = \frac{1}{2} - \ \left( \frac{1}{2} \right)e^{- 4}$$

$f(x)\  = \ xe^{- x^{2}}$ is odd, so the signed integral from −2 to 2 is
0. The unsigned area from −2 to 0 equals the area from 0 to 2.

Total area from
$- 2\ to\ 2\  = \ 2\left( \frac{1}{2} - \ \left( \frac{1}{2} \right)e^{- 4} \right) = \ 1\  - \ e^{- 4}u^{2}$

21. a.  Find the two intersection points of the curve
        $y\  = \frac{1}{x}\$with the line $y\  = \ 4\  - \ 3x$.

$$\frac{1}{x} = \ 4\  - \ 3x$$

$$3x²\  - \ 4x\  + \ 1\  = \ 0\ $$

$$(3x\  - \ 1)(x\  - \ 1)\  = \ 0\ $$

$$x\  = \frac{1}{3}or\ x\  = \ 1.$$

$$Intersection\ points:\ \left( \frac{1}{3},\ 3 \right)and\ (1,\ 1).$$

b.  Find the area between these two curves.

$$On\ \left\lbrack \frac{1}{3},\ 1 \right\rbrack,\ the\ line\ y\  = \ 4\  - \ 3x\ is\ above\ y\  = \frac{1}{x}.$$

$$Area\  = \ \int_{\frac{1}{3}}^{1}\left( (4\  - \ 3x) - \frac{1}{x} \right)dx\  = \ \left\lbrack 4x\  - \frac{3x^{2}}{2} - \ ln\ x \right\rbrack_{\frac{1}{3}}^{1}$$

$$= \ (4\  - \ 3/2)\  - \ \left( \frac{4}{3} - \frac{1}{6} - \ \ln\left( \frac{1}{3} \right) \right)$$

$$= \frac{5}{2} - \ \left( \frac{7}{6} + \ \ln\ 3 \right)$$

$$= \ \left( \frac{4}{3} - \ \ln\ 3 \right)u^{2}$$

22. a.  Evaluate the integral $\int_{N}^{0}{eˣ}dx$.

$$\int_{N}^{0}{eˣ}\ dx\  = \ \lbrack eˣ\rbrack_{N}^{0} = \ 1\  - \ e^{N}$$

b.  What is its limit as $N\  \rightarrow \  - \infty?$

$$As\ N\  \rightarrow \  - \infty,\ e^{N} \rightarrow \ 0.\ $$

$$Limit\  = \ 1.$$

23. a.  Use the trapezoidal rule with four subintervals to approximate
        the area between the curve $y\  = \ln x$ and the $x$-axis,
        between $x\  = \ 1$ and $x\  = \ 5$. Answer correct to four
        decimal places.

$$h\  = \ 1,\ x\  = \ 1,\ 2,\ 3,\ 4,\ 5,\ f(x)\  = \ \ln\ x.$$

$$Area\  \Doteq \ \left( \frac{1}{2} \right)\left( \ln 1 + \ 2\left( \ln 2 + \ln 3 + \ln 4 \right) + \ln 5 \right)$$

$$\Doteq \ 3.9828$$

b.  Differentiate $y\  = \ x\ log_{e}x$. Hence find the exact value of
    the area, and approximate it correct to four decimal places.

$$\frac{d}{dx}\left( x\ln x \right) = \ln x + \ 1$$

$$so\ \int_{}^{}\ln x\ \ dx\  = \ x\ \ln\ x\  - \ x\  + \ C.$$

$$Area\  = \ \lbrack x\ ln\ x\  - \ x\rbrack_{1}^{5}$$

$$= \ (5\ ln\ 5\  - \ 5) - \ (0\  - \ 1)$$

$$= \ 5\ \ln\ 5\  - \ 4\  \Doteq \ 4.0472$$

c.  Is the estimate greater than or less than the exact value? Explain
    how the graph could have predicted this.

The estimate is less than the exact value. $y\  =$ ln $x\$is concave
down $\left( y'' = \  - \frac{1}{x^{2}} \right)$, so the chords lie
below the curve.

24. a.  Show that the curves $y\  = \frac{6}{x}$ and
        $y\  = \ x²\  - \ 6x\  + \ 11$ intersect when $x\  = \ 1,\ 2$
        and $3$.

At $x\  = \ 1:\frac{6}{1} = \ 6\ and\ 1\  - \ 6\  + \ 11\  = \ 6$

At $x\  = \ 2:\frac{6}{2} = \ 3\ and\ 4\  - \ 12\  + \ 11\  = \ 3$

At $x\  = \ 3:\frac{6}{3} = \ 2\ and\ 9\  - \ 18\  + \ 11\  = \ 2$

so $(1,6)\ (2,\ 3)\ (3,\ 2)$ lie on both curves

b.  Graph these two curves and shade the two areas enclosed by them.

c.  Find the total area enclosed by the two curves.

On \[1, 2\]: parabola above hyperbola. On \[2, 3\]: hyperbola above
parabola.

$$\ \int_{1}^{2}\left( \left( x^{2} - \ 6x\  + \ 11 \right) - \frac{6}{x} \right)dx\  + \ \int_{2}^{3}\left( \frac{6}{x} - \ \left( x^{2} - \ 6x\  + \ 11 \right) \right)dx$$

$$= \ \left( 2\  - \ 6\ \ln\left( \frac{4}{3} \right) \right)u^{2}$$

25. a.  Sketch the region bounded by the graphs of $y\  = \ \sin\ x\$and
        $y\  = \ cos\ x$, and by the vertical lines
        $x\  = \  - \frac{\pi}{2}\$and $x\  = \frac{\pi}{6}.$

    b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image116.png){width="2.915703193350831in"
        height="2.102063648293963in"}Find the area of the region in part
        a.

$$\int_{- \frac{\pi}{2}}^{\frac{\pi}{6}}\left( \cos\ x\  - \ \sin\ x \right)dx\  = \ \lbrack sin\ x\  + \ cos\ x\rbrack_{- \frac{\pi}{2}}^{\frac{\pi}{6}}$$

$$= \ \left( \frac{1}{2} + \frac{\sqrt{3}}{2} \right) - \ ( - 1\  + \ 0)$$

$$= \frac{3\  + \ \sqrt{3}}{2}u^{2}$$

26. a.  Show by substitution that $y\  = \ sin\ x$ and
        $y\  = \ \cos\ 2x$ meet at $x\  = \  - \frac{\pi}{2}$ and
        $x\  = \frac{\pi}{6}$.

$$\sin x = \cos{2x} = \ 1\  - \ 2\ sin^{2}x\ $$

$$2\ sin^{2}x\  + \sin x - \ 1\  = \ 0\ $$

$$\left( 2\ \sin\ x\  - \ 1 \right)\left( \sin\ x\  + \ 1 \right) = \ 0$$

$$\sin x = \frac{1}{2},\ x\  = \frac{\pi}{6}$$

$$or\ sin\ x\  = \  - 1,\ x\  = \  - \frac{\pi}{2}$$

b.  On the same number plane, sketch $y\  = \ \sin\ x$ and
    $y\  = \ \cos\ 2x$, for
    $- \frac{\pi}{2} \leq \ x\  \leq \frac{\pi}{6}$.

![](media/Integral Calculus 3_Further Areas under Curves/media/image117.png){width="2.915277777777778in"
height="2.1034722222222224in"}

c.  Hence find the area of the region bounded by the two curves.

$$On\ \left\lbrack - \frac{\pi}{2},\frac{\pi}{6} \right\rbrack,\ \cos\ 2x\  \geq \ \sin\ x.$$

$$\ \int_{- \frac{\pi}{2}}^{\frac{\pi}{6}}\left( \cos\ 2x\  - \ \sin\ x \right)dx\  = \ \left\lbrack \left( \frac{1}{2} \right)\sin\ 2x\  + \ \cos\ x \right\rbrack_{- \frac{\pi}{2}}^{\frac{\pi}{6}}$$

$$= \ \left( \frac{\sqrt{3}}{4} + \frac{\sqrt{3}}{2} \right) - \ (0\  + \ 0)$$

$$= \ 3\frac{\sqrt{3}}{4}\ u²$$

27. Use symmetry to help evaluate:

    a.  $\int_{- 4\pi}^{4\pi}\sin 3x\ dx\ \$

$\sin\ 3x$ is odd, symmetric limits.
$\int_{- 4\pi}^{4\pi}\sin 3x\ \ dx\  = \ 0$

b.  $\int_{- 2\pi}^{2\pi}{cos^{2}x}sin^{3}x\ dx\$

cos² x sin³ x is odd (even × odd = odd), symmetric limits. So integral =
0

c.  $\int_{- \frac{5\pi}{2}}^{\frac{5\pi}{2}}\cos x\ dx\$

$$\cos xis\ even.\ \ 2\int_{0}^{\frac{5\pi}{2}}\cos x\ \ dx\  = \ 2\left\lbrack \sin\ x \right\rbrack_{0}^{\frac{5\pi}{2}}$$

$$= \ 2\ \sin\left( \frac{5\pi}{2} \right)$$

$$= \ 2$$

d.  $\int_{- \pi}^{\pi}{sec^{2}\left( \frac{x}{3} \right)dx}\$

$$sec^{2}\left( \frac{x}{3} \right)is\ even.\  = \ 2\int_{0}^{\pi}{sec^{2}\left( \frac{x}{3} \right)}dx\  = \ 2\left\lbrack 3\ \tan\left( \frac{x}{3} \right) \right\rbrack_{0}^{\pi}$$

$$= \ 6\ \tan\left( \frac{\pi}{3} \right)$$

$$= \ 6\sqrt{3}$$

e.  $\int_{- \pi}^{\pi}{\left( 3\  + \ 2x\  + \ \sin\ x \right)dx}\$

3 is even → so $2\int_{0}^{\pi}3\ dx\  = \ 6\pi.$

$2x$ is odd → contributes 0.

sin $x$ is odd → contributes 0.

Total = $6\pi$

f.  $\int_{- \frac{\pi}{2}}^{\frac{\pi}{2}}{\left( \sin\ 2x\  + \ \cos\ 3x\  + \ 3x^{2} \right)dx}$

sin 2$x$ is odd → contributes 0.

$$\cos{3x}is\ even\  \rightarrow \ 2\int_{0}^{\frac{\pi}{2}}\cos 3x\ \ dx\  = \ 2\left\lbrack \left( \frac{1}{3} \right)\sin\ 3x \right\rbrack_{0}^{\frac{\pi}{2}}$$

$$= \ \left( \frac{2}{3} \right)( - 1) = \  - \frac{2}{3}$$

$$3x^{2}\ is\ even\  \rightarrow \ 2\int_{0}^{\frac{\pi}{2}}{3x^{2}}dx\  = \ \left\lbrack 2x^{3} \right\rbrack_{0}^{\frac{\pi}{2}}$$

$$= \frac{\pi^{3}}{4}$$

$$Total\  = \  - \frac{2}{3} + \frac{\pi^{3}}{4}$$

28. a.  Evaluate the integral $\int_{0}^{N}{e^{- x}dx}$.

$$\int_{0}^{N}e^{- x}dx\  = \ \left\lbrack - e^{- x} \right\rbrack_{0}^{N} = \ 1\  - \ e^{- N}$$

b.  What is its limit as $N\  \rightarrow \ \infty?$

$$As\ N\  \rightarrow \ \infty,\ e^{- N} \rightarrow \ 0.$$

$$\ Limit\  = \ 1.$$

29. a.  Show that
        $\sqrt{2}\sin\left( x\  + \frac{\pi}{4} \right) = \ \sin\ x\  + \ \cos\ x.$

$$\sqrt{2}\ \sin\left( x\  + \frac{\pi}{4} \right)$$

$$= \sqrt{2}\left( \sin\ x\ \cos\left( \frac{\pi}{4} \right) + \ \cos\ x\ \sin\left( \frac{\pi}{4} \right) \right)$$

$$= \ \sqrt{2}\left( \frac{\sin\ x\  + \ \cos\ x}{\sqrt{2}} \right)$$

$$= \ \sin\ x\  + \ \cos\ x\ $$

b.  Hence, or otherwise, find the exact area under one arch of the curve
    $y\  = \ \sin\ x\  + \ \cos\ x$.

$$One\ arch\ of\ y\  = \ \sin\ x\  + \ \cos\ x\  = \ \sqrt{2}\ \sin\left( x\  + \frac{\pi}{4} \right),\ from\ x\  = \  - \frac{\pi}{4}to\ x\  = \frac{3\pi}{4}.$$

$$\int_{- \frac{\pi}{4}}^{\frac{3\pi}{4}}\sqrt{2}\sin\left( x\  + \frac{\pi}{4} \right)\ dx\  = \ \left\lbrack - \sqrt{2}\cos\left( x\  + \frac{\pi}{4} \right) \right\rbrack_{- \frac{\pi}{4}}^{\frac{3\pi}{4}}$$

$$= \ \sqrt{2} + \ \sqrt{2}$$

$$= \ 2\sqrt{2}\ u^{2}\ $$

30. Similarly, evaluate $\int_{0}^{N}{2xe^{- x^{2}}dx}$, and find its
    limit as $N\  \rightarrow \ \infty.$

$$\int_{0}^{N}{2xe^{- x^{2}}}dx\  = \ \left\lbrack - e^{- x^{2}} \right\rbrack_{0}^{N} = \ 1\  - \ e^{- N^{2}}$$

As $N\  \rightarrow \ \infty,\ e^{- N^{2}} \rightarrow \ 0$.

Limit = 1.

31. a.  Show that
        $\int_{0}^{n}{\left( 1\  + \ \sin\ 2\pi x \right)dx} = \ n$, for
        all positive integers $n$.

$$\int_{0}^{n}\left( 1\  + \ \sin\ 2\pi x \right)dx\  = \ \left\lbrack x\  - \ \left( \frac{1}{2\pi} \right)\cos\ 2\pi x \right\rbrack_{0}^{n}$$

$$= \ \left( n\  - \frac{1}{2\pi} \right) - \ \left( 0\  - \frac{1}{2\pi} \right)$$

$$= \ n$$

b.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image118.png){width="2.7978062117235347in"
    height="1.968503937007874in"}Sketch $y\  = \ 1\  + \ \sin\ 2\pi x$,
    and interpret the result geometrically.

$y\  = \ 1\  + \ \sin\ 2\pi x$ oscillates about $y\  = \ 1$ with period
1.\
The positive and negative deviations from $y\  = \ 1$ cancel, so the
area equals the area of a rectangle $n$ units long and 1 unit high.

32. a.  Using the fact that $\sin\ x\  < \ x\  < \ \tan\ x$ for
        $0\  < \ x\  < \frac{\pi}{2}$,\
        explain why $x²\ \sin\ x\  < \ x³\  < \ x²\ tan\ x$ for
        $0\  < \ x\  < \frac{\pi}{2}$.

$$For\ 0\  < \ x\  < \frac{\pi}{2}:\ \sin\ x\  < \ x\  < \ \tan\ x\ and\ x^{2} > \ 0.\ Multiplying\ through\ by\ x^{2}:$$

$$x²\ \sin\ x\  < \ x³\  < \ x²\ \tan\ x$$

b.  Hence show that
    $\int_{0}^{\frac{\pi}{4}}{x^{2}\sin}x\ dx\  < \frac{\pi^{4}}{4^{5}} < \ \int_{0}^{\frac{\pi}{4}}{x^{2}\tan}x\ dx$.

$$\int_{0}^{\frac{\pi}{4}}{x^{2}\sin}x\ \ dx\  < \ \left\lbrack \frac{x^{4}}{4} \right\rbrack_{0}^{\frac{\pi}{4}} < \ \int_{0}^{\frac{\pi}{4}}{x^{2}\tan}x\ \ dx$$

$$\int_{0}^{\frac{\pi}{4}}{x^{2}\sin}x\ \ dx\  < \frac{\pi^{4}}{4^{5}} < \ \int_{0}^{\frac{\pi}{4}}{x^{2}\tan}x\ \ dx$$

33. a.  Given that $y\  = \frac{1}{1\  + \ \sin\ x},$ show that
        $y' = \  - \frac{\cos x}{\left( 1\  + \ \sin\ x \right)^{2}}.$

$$y\  = \ \left( 1\  + \ \sin\ x \right)^{- 1}$$

$$y'\  = \  - \frac{\cos x}{\left( 1\  + \ \sin\ x \right)^{2}}\ $$

b.  Hence explain why the function $y\  = \frac{1}{1\  + \ \sin\ x}$ is
    decreasing for $0\  < \ x\  < \frac{\pi}{2}.$

$For\ 0\  < \ x\  < \frac{\pi}{2}:\ cos\ x\  > \ 0\ and\ (1\  + \ sin\ x)^{2} > \ 0,\ so\ y' < \ 0.\ Hence\ y\ is\ decreasing$.

c.  ![](media/Integral Calculus 3_Further Areas under Curves/media/image119.png){width="3.238888888888889in"
    height="2.3618055555555557in"}Sketch the curve for
    $0\  \leq \ x\  \leq \frac{\pi}{2}$, and hence show that
    $\frac{\pi}{4} < \ \int_{0}^{\frac{\pi}{2}}\frac{1}{1\  + \ sin\ x}dx\  < \frac{\pi}{2}.$

$$Since\ y\ is\ decreasing\ on\ \left\lbrack 0,\frac{\pi}{2} \right\rbrack:\ y\left( \frac{\pi}{2} \right) \leq \ y(x) \leq \ y(0),\ $$

$$\frac{1}{2} \leq \frac{1}{1\  + \ sin\ x} \leq \ 1.$$

$$Integrating:\ \left( \frac{1}{2} \right)\left( \frac{\pi}{2} \right) \leq \ \int_{0}^{\frac{\pi}{2}}\frac{1}{1\  + \ sin\ x}\ dx\  \leq \ (1)\left( \frac{\pi}{2} \right)$$

$$\frac{\pi}{4} < \ \int_{0}^{\frac{\pi}{2}}\frac{1}{1\  + \ sin\ x}\ dx\  < \frac{\pi}{2}$$
