+-------------------------------------------------------------------+
| Mathematics Extension 1 Year 12                                   |
+===================================================================+
| **Introduction to**                                               |
|                                                                   |
| **Vectors**                                                       |
+-------------------------------------------------------------------+

+-------------------------------+-----------------------------------+-------------------------------+
| **Book 2**                    | Further operations with vectors   | Version: 260202               |
|                               |                                   |                               |
|                               |                                   | Feedback:\                    |
|                               |                                   | https://MrDingMaths.com       |
+===============================+===================================+===============================+
| **Contents**                                                                                      |
|                                                                                                   |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                                      |
|                                                                                                   |
| [The Dot Product Algebraic Formula                                                                |
| [3](#the-dot-product-algebraic-formula)](#the-dot-product-algebraic-formula)                      |
|                                                                                                   |
| [The Dot Product Geometric Formula                                                                |
| [5](#the-dot-product-geometric-formula)](#the-dot-product-geometric-formula)                      |
|                                                                                                   |
| [Properties of the Dot Product                                                                    |
| [9](#properties-of-the-dot-product)](#properties-of-the-dot-product)                              |
|                                                                                                   |
| [Proofs using Vectors [15](#proofs-using-vectors)](#proofs-using-vectors)                         |
|                                                                                                   |
| [Vector Projection [26](#vector-projection)](#vector-projection)                                  |
|                                                                                                   |
| [Applications of Vectors to Motion                                                                |
| [35](#applications-of-vectors-to-motion)](#applications-of-vectors-to-motion)                     |
|                                                                                                   |
| [Applications of Vectors to Mechanics                                                             |
| [44](#applications-of-vectors-to-mechanics)](#applications-of-vectors-to-mechanics)               |
+---------------------------------------------------------------------------------------------------+

# Syllabus Content

**ME1-12-02** operates with 2D and 3D vectors and uses 2D vectors to
solve problems involving motion in two dimensions

**Further operations with vectors**

- Define $\mathbf{a} \cdot \mathbf{b} = x_{1}x_{2} + y_{1}y_{2}$ as the
  scalar (dot) product of vectors
  $\mathbf{a} = x_{1}\mathbf{i} + y_{1}\mathbf{j}$ and
  $\mathbf{b} = x_{2}\mathbf{i} + y_{2}\mathbf{j}$ and use the scalar
  product to solve problems

- Define
  $\mathbf{a} \cdot \mathbf{b} = x_{1}x_{2} + y_{1}y_{2} + z_{1}z_{2}$
  as the scalar product of vectors
  $\mathbf{a} = x_{1}\mathbf{i} + y_{1}\mathbf{j} + z_{1}\mathbf{k}$ and
  $\mathbf{b} = x_{2}\mathbf{i} + y_{2}\mathbf{j} + z_{2}\mathbf{k}$ and
  use the scalar product to solve problems

- Use
  $\mathbf{a} \cdot \mathbf{b} = \left| \mathbf{a} \right|\left| \mathbf{b} \right|cos\ \theta$
  as a geometric expression of the scalar product of non-zero vectors
  $\mathbf{a}$ and $\mathbf{b}$ in two dimensions and three dimensions,
  where $\theta$ is the angle between the vectors and
  $0{^\circ} \leq \theta \leq 180{^\circ}$.

- Verify the equivalence of
  $\mathbf{a} \cdot \mathbf{b} = \left| \mathbf{a} \right|\left| \mathbf{b} \right|cos\ \theta$
  with the algebraic definition of the scalar product,
  $\mathbf{a} \cdot \mathbf{b} = x_{1}x_{2} + y_{1}y_{2}$ for two
  dimensions and
  $\mathbf{a} \cdot \mathbf{b} = x_{1}x_{2} + y_{1}y_{2} + z_{1}z_{2}$
  for three dimensions

- Derive and use the property
  $\mathbf{a} \cdot \mathbf{a} = \left| \mathbf{a} \right|^{2}$ to
  establish the scalar product definition of the magnitude of a vector
  ($\left| \mathbf{a} \right| = \sqrt{\mathbf{a} \cdot \mathbf{a}}$) in
  two dimensions and three dimensions

- Calculate the angle between two non-zero vectors $\mathbf{a}$ and
  $\mathbf{b}$, in both two dimensions and three dimensions, using the
  scalar product by deriving and applying the relationship
  $\cos\ \theta = \frac{\mathbf{a} \cdot \mathbf{b}}{\left| \mathbf{a} \right|\left| \mathbf{b} \right|} = \left( \widehat{\mathbf{a}} \cdot \widehat{\mathbf{b}} \right)$

- Establish $\mathbf{a} \cdot \mathbf{b} = 0$ as a condition for two
  non-zero vectors $\mathbf{a}$ and $\mathbf{b}$ to be perpendicular to
  each other and use it to determine if two vectors are perpendicular

- Establish
  $\mathbf{a} \cdot \mathbf{b} = \pm \left| \mathbf{a} \right|\left| \mathbf{b} \right|$
  as another way to determine if two non-zero vectors $\mathbf{a}$ and
  $\mathbf{b}$ are parallel

- Define the projection of a vector $\mathbf{a}$ onto a vector
  $\mathbf{b}$, denoted by ${proj}_{\mathbf{b}}\mathbf{a}$, to be the
  vector component of $\mathbf{a}$ in the direction of vector
  $\mathbf{b\ }$

- Examine the proof of the formula
  ${proj}_{\mathbf{b}}\mathbf{a} = \left( \frac{\mathbf{a} \cdot \mathbf{b}}{\left| \mathbf{b} \right|^{\mathbf{2}}} \right)\mathbf{b} = \left( \mathbf{a} \cdot \widehat{\mathbf{b}} \right)\widehat{\mathbf{b}}$
  and use the formula to solve problems

- Determine that the component of a vector $\mathbf{a}$ perpendicular to
  another vector $\mathbf{b}$ is
  $\mathbf{a -}{proj}_{\mathbf{b}}\mathbf{a}$

# The Dot Product Algebraic Formula

+-------------------------------------------------------------------+
| - **Dot Product Algebraic Formula**                               |
+===================================================================+
| For $\overset{̰}{a} = x_{1}\mathbf{i +}y_{1}\mathbf{j}$ and        |
| $\overset{̰}{b} = x_{2}\mathbf{i} + y_{2}\mathbf{j}$, the **dot    |
| product** of $\overset{̰}{a}$ and $\overset{̰}{b}$ is:              |
|                                                                   |
| $$\overset{̰}{a} \cdot \overset{̰}{b} = x_{1}x_{2} + y_{1}y_{2}$$   |
|                                                                   |
| - Some textbooks refer to the dot product as the scalar product.\ |
|   This booklet will avoid this as it can be easily confused with  |
|   multiplication by a scalar ($\lambda\overset{̰}{a}$)             |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate dot product using algebraic definition.                                                                                  |
+===========================================================+======================================================================================+
| Find $\overset{̰}{u} \cdot \overset{̰}{v},$ given           | Find $\overset{̰}{a} \cdot \overset{̰}{b},$ given                                      |
| $\overset{̰}{u} = 7\mathbf{i} + 3\mathbf{j}$ and           | $\overset{̰}{u} = 2\mathbf{j} - 3\mathbf{i}$ and                                      |
| $\overset{̰}{v} = - \mathbf{i} + 6\mathbf{j.}$             | $\overset{̰}{b} = \frac{4}{3}\mathbf{i} - 12\mathbf{j.}$                              |
|                                                           |                                                                                      |
| $${\overset{̰}{u} \cdot \overset{̰}{v} = (7)( - 1) + (3)(6) | $${\overset{̰}{a} \cdot \overset{̰}{b} = ( - 3)\left( \frac{4}{3} \right) + (2)( - 12) |
| }{= 11}$$                                                 | }{= - 28}$$                                                                          |
+-----------------------------------------------------------+--------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                               |
+===============================================================+==============================================================================+
| a.  Find $\overset{̰}{u} \cdot \overset{̰}{v}$, given:          | b.  Find $\overset{̰}{u} \cdot \overset{̰}{v}$, given:                         |
|                                                               |                                                                              |
| $\overset{̰}{u} = 3\mathbf{i} - 4\mathbf{j}$,                  | $\overset{̰}{u} = \left( \begin{array}{r}                                     |
| $\overset{̰}{v} = \mathbf{i} + 2\mathbf{j}$                    | 2 \\                                                                         |
|                                                               | 5                                                                            |
| $$- 5$$                                                       | \end{array} \right),\ \overset{̰}{v} = \left( \begin{array}{r}                |
|                                                               |  - 3 \\                                                                      |
|                                                               | 4                                                                            |
|                                                               | \end{array} \right)$                                                         |
|                                                               |                                                                              |
|                                                               | 14                                                                           |
+---------------------------------------------------------------+------------------------------------------------------------------------------+
| c.  Find $\overset{̰}{u} \cdot \overset{̰}{v}$, given:          | d.  Find $\overset{̰}{u} \cdot \overset{̰}{v}$, given:                         |
|                                                               |                                                                              |
| $\overset{̰}{u} = \left( \begin{array}{r}                      | $\overset{̰}{u} = 6\cos{30{^\circ}}\mathbf{i} - 6\sin{30{^\circ}}\mathbf{j}$, |
| \frac{1}{\sqrt{2}} \\                                         |                                                                              |
| \frac{1}{\sqrt{2}}                                            | $\overset{̰}{v} = - 2\cos{45{^\circ}}\mathbf{i -}2\sin{45{^\circ}}\mathbf{j}$ |
| \end{array} \right),\ \overset{̰}{v} = \left( \begin{array}{r} |                                                                              |
| 0 \\                                                          | $$- 3\sqrt{6} + 3\sqrt{2}$$                                                  |
| 12                                                            |                                                                              |
| \end{array} \right)$                                          |                                                                              |
|                                                               |                                                                              |
| $$\frac{12}{\sqrt{2}} = 6\sqrt{2}$$                           |                                                                              |
+---------------------------------------------------------------+------------------------------------------------------------------------------+

Foundation

1.  Find $\underset{\sim}{a} \cdot \underset{\sim}{b}$ given:

+------------------------------------------------------------------------+------------------------------------------------------------------------+
| a.  $\underset{\sim}{a} = \ \left( \begin{array}{r}                    | b.  $\underset{\sim}{a} = \ \left( \begin{array}{r}                    |
|     3 \\                                                               |      - 8 \\                                                            |
|     1                                                                  |      - 5                                                               |
|     \end{array} \right),\underset{\sim}{b} = \ \left( \begin{array}{r} |     \end{array} \right),\underset{\sim}{b} = \ \left( \begin{array}{r} |
|     2 \\                                                               |     6 \\                                                               |
|     4                                                                  |      - 14                                                              |
|     \end{array} \right)$                                               |     \end{array} \right)$                                               |
|                                                                        |                                                                        |
| $$10$$                                                                 | $$22$$                                                                 |
+========================================================================+========================================================================+
| c.  $\underset{\sim}{a} = \ \left( \begin{array}{r}                    | d.  $\underset{\sim}{a} = \ \left( \begin{array}{r}                    |
|     6u \\                                                              |     x - 1 \\                                                           |
|      - 2v                                                              |     x - 2                                                              |
|     \end{array} \right),\underset{\sim}{b} = \ \left( \begin{array}{r} |     \end{array} \right),\underset{\sim}{b} = \ \left( \begin{array}{r} |
|     3v \\                                                              |     x - 1 \\                                                           |
|     9u                                                                 |     x + 2                                                              |
|     \end{array} \right)$                                               |     \end{array} \right)$                                               |
|                                                                        |                                                                        |
| $$0$$                                                                  | $$2x^{2} - \ 2x\  - \ 3$$                                              |
+------------------------------------------------------------------------+------------------------------------------------------------------------+

2.  Find the scalar product
    $\underset{\sim}{u} \cdot \underset{\sim}{v}$ to 1 decimal place,
    given:

+------------------------------------------------------------------------+------------------------------------------------------------------------+------------------------------------------------------------------------+
| a.  $\underset{\sim}{u} = \ \left( \begin{array}{r}                    | b.  $\underset{\sim}{u} = \ \left( \begin{array}{r}                    | c.  $\underset{\sim}{u} = \ \left( \begin{array}{r}                    |
|     3 \\                                                               |     4 \\                                                               |     6 \\                                                               |
|     2                                                                  |      - 1                                                               |     3                                                                  |
|     \end{array} \right),\underset{\sim}{v} = \ \left( \begin{array}{r} |     \end{array} \right),\underset{\sim}{v} = \ \left( \begin{array}{r} |     \end{array} \right),\underset{\sim}{v} = \ \left( \begin{array}{r} |
|      - 1 \\                                                            |      - 2 \\                                                            |      - 4 \\                                                            |
|     5                                                                  |     7                                                                  |     8                                                                  |
|     \end{array} \right)$                                               |     \end{array} \right)$                                               |     \end{array} \right)$                                               |
|                                                                        |                                                                        |                                                                        |
| $$\ 3( - 1) + \ 2(5) = \ 7$$                                           | $$4( - 2) + \ ( - 1)(7) = \  - 15$$                                    | $$6( - 4) + \ 3(8) = \ 0$$                                             |
+========================================================================+========================================================================+========================================================================+
| d.  $\underset{\sim}{u} = \ 4\mathbf{i}\  - \ \mathbf{j},$             | e.  $\underset{\sim}{u} = \  - 3\mathbf{i}\  + \ 4\mathbf{j},\$        | f.  $\underset{\sim}{u} = \ i\  - \ 9j,$                               |
|                                                                        |                                                                        |                                                                        |
| $$\underset{\sim}{v} = \ \mathbf{i\ } - \ 5\mathbf{j}$$                | $$\underset{\sim}{v}\  = \ 2\mathbf{i}\  + \ 3\mathbf{j}$$             | $$\underset{\sim}{v} = \  - 3i\  - \ 2j$$                              |
|                                                                        |                                                                        |                                                                        |
| $$4(1) + \ ( - 1)( - 5) = \ 9$$                                        | $$\ ( - 3)(2) + \ 4(3) = \ 6$$                                         | $$1( - 3) + \ ( - 9)( - 2) = \ 15$$                                    |
+------------------------------------------------------------------------+------------------------------------------------------------------------+------------------------------------------------------------------------+

3.  The dot product of $\left( \begin{array}{r}
    x \\
    2
    \end{array} \right)$ and $\left( \begin{array}{r}
     - 4 \\
    5
    \end{array} \right)$ is 14. Find the value of $x$.

$${\left( \begin{array}{r}
x \\
2
\end{array} \right) \cdot \ \left( \begin{array}{r}
 - 4 \\
5
\end{array} \right) = \ 14
}{- 4x\  + \ 10\  = \ 14
}{- 4x\  = \ 4
}{x\  = \  - \ 1}$$

4.  The dot product $\underset{\sim}{u} \cdot \underset{\sim}{v} = \ 24$
    where $\underset{\sim}{u} = \ \left( \begin{array}{r}
    x \\
    3
    \end{array} \right)$ and
    $\underset{\sim}{v} = \ \left( \begin{array}{r}
     - 1 \\
    4
    \end{array} \right).$ Find the value of $x$.

$${\underset{\sim}{u} \cdot \underset{\sim}{v} = \ x( - 1) + \ 3(4) = \ 24
}{- x\  + \ 12\  = \ 24
}{x\  = \  - 12}$$

# The Dot Product Geometric Formula

+--------------------------------------------------------------------------------------------------------------------+
| - **Angle between two vectors**                                                                                    |
+====================================================================================================================+
| The angle between two vectors $\theta$ is the angle formed when the two vectors are placed                         |
|                                                                                                                    |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image3.png){width="3.6966076115485564in" |
| height="1.2638888888888888in"}tail-to-tail. By convention, $\theta$ cannot be the reflex angle, so                 |
| $0 \leq \theta \leq 180$.                                                                                          |
|                                                                                                                    |
| - The head-to-head angle is equivalent, but we do not call this the angle between two vectors.                     |
+--------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** angle between two vectors.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
+:===================================================================================================================:+:==================================================================================================================:+:=======================================================================================================================:+:=======================================================================================================================:+
| ✖                                                                                                                   | ✔                                                                                                                  | ✔                                                                                                                       | ✖                                                                                                                       |
|                                                                                                                     |                                                                                                                    |                                                                                                                         |                                                                                                                         |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image4.png){width="1.595074365704287in"   | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image5.png){width="1.6623031496062992in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image6.png){width="1.5803958880139983in"      | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image7.png){width="1.5616141732283464in"      |
| height="0.910255905511811in"}                                                                                       | height="0.8971150481189851in"}                                                                                     | height="0.608494094488189in"}                                                                                           | height="0.6608442694663167in"}                                                                                          |
+---------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| Identify which of the following diagrams correctly shows the angle between two vectors.                                                                                                                                                                                                                                                                                                                                                                                                      |
+---------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| a.                                                                                                                  | b.                                                                                                                 | c.                                                                                                                      | d.                                                                                                                      |
|                                                                                                                     |                                                                                                                    |                                                                                                                         |                                                                                                                         |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image8.png){width="1.3895833333333334in"  | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image9.png){width="1.4276017060367454in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image10.png){width="1.3277777777777777in"     | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image11.png){width="1.1153849518810148in"     |
| height="0.7375in"}                                                                                                  | height="0.7179483814523184in"}                                                                                     | height="0.7173611111111111in"}                                                                                          | height="0.9615398075240595in"}                                                                                          |
+---------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| e.                                                                                                                  | f.                                                                                                                 | g.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image14.png){width="1.2628204286964129in" | h.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image15.png){width="0.8846150481189852in" |
|                                                                                                                     |                                                                                                                    |     height="1.2291447944007in"}                                                                                         |     height="1.0566404199475066in"}                                                                                      |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image12.png){width="1.2836297025371828in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image13.png){width="1.144352580927384in" |                                                                                                                         |                                                                                                                         |
| height="0.9551290463692038in"}                                                                                      | height="0.9551290463692038in"}                                                                                     |                                                                                                                         |                                                                                                                         |
+---------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------+
| - **Dot Product Geometric Formula**                                                                               |
+===================================================================================================================+
| For the angle $\theta$ between two vectors $\overset{̰}{a}$ and $\overset{̰}{b}$:                                   |
|                                                                                                                   |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image3.png){width="3.696527777777778in" |
| height="0.9861111111111112in"}                                                                                    |
|                                                                                                                   |
| $\overset{̰}{a} \cdot \overset{̰}{b} = \left| \overset{̰}{a} \right|\left| \overset{̰}{b} \right|\cos\theta$          |
|                                                                                                                   |
| - You can also use the reflex angle, since $\cos(360 - \theta) = \cos\theta$                                      |
+-------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate dot product using geometric definition.                                                                                                                                                               |
+=====================================================================================================================+=========================================================================================================+
| Find $\overset{̰}{a} \cdot \overset{̰}{b},$ given $\left| \overset{̰}{a} \right| = 5$ and                              | Find $\overset{̰}{a} \cdot \overset{̰}{b},$ given $\left| \overset{̰}{a} \right| = 11$ and                 |
| $\left| \overset{̰}{b} \right| = 6$.                                                                                 | $\left| \overset{̰}{b} \right| = 2$                                                                      |
|                                                                                                                     |                                                                                                         |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image16.png){width="1.2015059055118111in" | Answer to 2 d.p.                                                                                        |
| height="1.0115923009623797in"}Answer to 2 d.p.                                                                      |                                                                                                         |
|                                                                                                                     | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image16.png){width="1.9375in" |
| $${\overset{̰}{a} \cdot \overset{̰}{b} = (5)(6)\cos{40{^\circ}}                                                       | height="1.011111111111111in"}                                                                           |
| }{= 22.98}$$                                                                                                        |                                                                                                         |
|                                                                                                                     | $${\overset{̰}{a} \cdot \overset{̰}{b} = (11)(2)\cos{140{^\circ}}                                         |
|                                                                                                                     | }{= - 16.85}$$                                                                                          |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                                                                                                                            |
+=====================================================================================================================+=====================================================================================================================+
| Find the dot product to two decimal places.                                                                                                                                                                                               |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| a.  Find $\overset{̰}{a} \cdot \overset{̰}{b}$ if                                                                     | b.  Find $\overset{̰}{a} \cdot \overset{̰}{b}$ if                                                                     |
|     $\left| \overset{̰}{a} \right| = 3,\ \left| \overset{̰}{b} \right| = 11$                                          |     $\left| \overset{̰}{a} \right| = 7,\ \left| \overset{̰}{b} \right| = 2$                                           |
|                                                                                                                     |                                                                                                                     |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image17.png){width="1.8402777777777777in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image18.png){width="1.2520833333333334in" |
| height="0.884925634295713in"}                                                                                       | height="1.3430555555555554in"}                                                                                      |
|                                                                                                                     |                                                                                                                     |
| $$- 28.58$$                                                                                                         | 10.72                                                                                                               |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| c.  $\overset{̰}{u}$ has length $7$ and $\overset{̰}{v}$ has length 5.\                                               | d.  Given $\left| \overset{̰}{a} \right| = 3$ and $\left| \overset{̰}{b} \right| = 5$, find                           |
|     The angle between them is 74°.                                                                                  |     $\overset{̰}{a} \cdot \overset{̰}{b}$.                                                                            |
|                                                                                                                     |                                                                                                                     |
| Find $\overset{̰}{u} \cdot \overset{̰}{v}$.                                                                           | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image19.png){width="1.2569444444444444in" |
|                                                                                                                     | height="1.3433005249343832in"}                                                                                      |
| 9.65                                                                                                                |                                                                                                                     |
|                                                                                                                     | $$- 11.49$$                                                                                                         |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------+
| - **Angle Between Two Vectors**                                                                                     |
+=====================================================================================================================+
| By rearranging the geometric dot product formula:                                                                   |
|                                                                                                                     |
| $$\cos\theta = \frac{\overset{̰}{a} \cdot \overset{̰}{b}}{\left| \overset{̰}{a} \right|\left| \overset{̰}{b} \right|}$$ |
|                                                                                                                     |
| 1.  Calculate $\overset{̰}{a} \cdot \overset{̰}{b}$ using the algebraic dot product formula:                          |
|     $x_{1}x_{2} + y_{1}y_{2}$                                                                                       |
|                                                                                                                     |
| 2.  Calculate $\left| \overset{̰}{a} \right|$ and $\left| \overset{̰}{b} \right|$ using: $\sqrt{x^{2} + y^{2}}$       |
|                                                                                                                     |
| 3.  Calculate $\theta$ using the above formula.                                                                     |
+---------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate angle between two vectors.                                                                     |
+========================================================================================================================+
| $\overset{̰}{u} = \left( \begin{array}{r}                                                                               |
| 4 \\                                                                                                                   |
| 3                                                                                                                      |
| \end{array} \right)$ and $\overset{̰}{v} = \left( \begin{array}{r}                                                      |
| 12 \\                                                                                                                  |
|  - 5                                                                                                                   |
| \end{array} \right)$, find the angle between the two vectors, correct to the nearest degree.                           |
|                                                                                                                        |
| +--------------------------------------------------------------------+-----------------------------------------------+ |
| | 1\.                                                                | 3\.                                           | |
| |                                                                    |                                               | |
| | $$\overset{̰}{u} \cdot \overset{̰}{v} = (4)(12) + (3)( - 5)$$        | $$\cos\theta = \frac{33}{(5)(13)}$$           | |
| |                                                                    |                                               | |
| | $= 33$                                                             | $$\ \ \ \therefore\theta \approx 59{^\circ}$$ | |
| |                                                                    |                                               | |
| | 2\.                                                                |                                               | |
| |                                                                    |                                               | |
| | $$\left| \overset{̰}{u} \right| = \sqrt{4^{2} + 3^{2}} = 5$$        |                                               | |
| |                                                                    |                                               | |
| | $$\left| \overset{̰}{v} \right| = \sqrt{12^{2} + ( - 5)^{2}} = 13$$ |                                               | |
| +====================================================================+===============================================+ |
+------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------+
| - **Practice**                                                                         |
+==========================================+=============================================+
| Find the angle between the two vectors,  | Find the angle between the two vectors, to  |
| to one decimal place.                    | the nearest degree.                         |
|                                          |                                             |
| $\overset{̰}{a} = \left( \begin{array}{r} | $\overset{̰}{r} = - \mathbf{i -}3\mathbf{j}$ |
| 3 \\                                     | and                                         |
| 1                                        | $\overset{̰}{s} = 2\mathbf{i} + 5\mathbf{j}$ |
| \end{array} \right)$ and                 |                                             |
| $\overset{̰}{b} = \left( \begin{array}{r} | $$177{^\circ}$$                             |
| 2 \\                                     |                                             |
| 5                                        |                                             |
| \end{array} \right)$                     |                                             |
|                                          |                                             |
| $$49.8{^\circ}$$                         |                                             |
+------------------------------------------+---------------------------------------------+

Foundation

1.  If $\theta$ is the angle between $\underset{\sim}{a}$ and
    $\underset{\sim}{b}$, find
    $\underset{\sim}{a} \cdot \underset{\sim}{b}$ given:

+-----------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| a.  $\left| \underset{\sim}{a} \right| = \ 6,\ \left| \underset{\sim}{b} \right| = \ 5\ and\ \theta\  = \ 60{^\circ}$ | b.  $\ \left| \underset{\sim}{a} \right| = \ 4,\ \left| \underset{\sim}{b} \right| = \ 3\ and\ \theta\  = \ 45{^\circ}$ |
|                                                                                                                       |                                                                                                                         |
| $$15$$                                                                                                                | $$6\sqrt{2}$$                                                                                                           |
+=======================================================================================================================+=========================================================================================================================+

2.  Find the angle $\theta$ between the vectors $\underset{\sim}{u}$ and
    $\underset{\sim}{v}$ (nearest degree if necessary) if:

+-----------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $\left| \underset{\sim}{u} \right| = \ 4,\ \left| \underset{\sim}{v} \right| = \ 5\ and\ \underset{\sim}{u} \cdot \underset{\sim}{v} = \  - 10$ | b.  $\left| \underset{\sim}{u} \right| = \ 3,\ \left| \underset{\sim}{v} \right| = \ 5\ and\ \underset{\sim}{u} \cdot \underset{\sim}{v} = \ 12$ |
|                                                                                                                                                     |                                                                                                                                                  |
| $$120{^\circ}$$                                                                                                                                     | $$37{^\circ}$$                                                                                                                                   |
+=====================================================================================================================================================+==================================================================================================================================================+

3.  If $\theta$ is the angle between the vectors $\underset{\sim}{a}$
    and $\underset{\sim}{b},$ find the exact value of cos θ given:

+-------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+
| a.  $\underset{\sim}{a} = 4\mathbf{i} + 3\mathbf{j},\ \ \underset{\sim}{b} = 5\mathbf{j}$ | b.  $\underset{\sim}{a} = \ \left( \begin{array}{r}                                                    | c.  $\underset{\sim}{a} = \ \left( \begin{array}{r}                                                       |
|                                                                                           |     2 \\                                                                                               |      - 6 \\                                                                                               |
| $${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ 4(0) + \ 3(5) = \ 15                   |     2                                                                                                  |     4                                                                                                     |
| }{\left| \underset{\sim}{a} \right| = \ 5,\                                               |     \end{array} \right),\underset{\sim}{b} = \ \left( \begin{array}{r}                                 |     \end{array} \right),\underset{\sim}{b} = \ \left( \begin{array}{r}                                    |
| }{\left| \underset{\sim}{b} \right| = \ 5                                                 |     3 \\                                                                                               |      - 8 \\                                                                                               |
| }{\cos\ \theta\  = \frac{15}{5\  \times \ 5} = \frac{3}{5}}$$                             |      - 1                                                                                               |      - 2                                                                                                  |
|                                                                                           |     \end{array} \right)$                                                                               |     \end{array} \right)$                                                                                  |
|                                                                                           |                                                                                                        |                                                                                                           |
|                                                                                           | $${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ 2(3) + \ 2( - 1) = \ 4                              | $${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ ( - 6)( - 8) + \ (4)( - 2) = \ 40                      |
|                                                                                           | }{\left| \underset{\sim}{a} \right| = \ \sqrt{8},\                                                     | }{\left| \underset{\sim}{a} \right| = \ \sqrt{36\  + \ 16} = \ \sqrt{52},\                                |
|                                                                                           | }{\left| \underset{\sim}{b} \right| = \ \sqrt{10}                                                      | }{\left| \underset{\sim}{b} \right| = \ \sqrt{64\  + \ 4} = \ \sqrt{68}                                   |
|                                                                                           | }{\cos\ \theta\  = \frac{4}{\sqrt{8} \times \ \sqrt{10}} = \frac{4}{\sqrt{80}} = \frac{1}{\sqrt{5}}}$$ | }{\cos\ \theta\  = \frac{40}{\sqrt{52\  \times \ 68}} = \frac{40}{\sqrt{3536}} = \frac{10}{\sqrt{221}}}$$ |
+===========================================================================================+========================================================================================================+===========================================================================================================+

4.  Find the angle between the vectors, correct to the nearest degree.

+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------+
| a.  $\underset{\sim}{u} = \ \left( \begin{array}{r}                                  | b.  $\underset{\sim}{u} = \ \left( \begin{array}{r}                                                                  |
|      - 3 \\                                                                          |     1 \\                                                                                                             |
|     4                                                                                |      - 2                                                                                                             |
|     \end{array} \right)\ and\ \underset{\sim}{v} = \ \left( \begin{array}{r}         |     \end{array} \right)\ and\ \underset{\sim}{v} = \ \left( \begin{array}{r}                                         |
|      - 5 \\                                                                          |      - 3 \\                                                                                                          |
|     12                                                                               |     1                                                                                                                |
|     \end{array} \right)$                                                             |     \end{array} \right)$                                                                                             |
|                                                                                      |                                                                                                                      |
| $${\underset{\sim}{u} \cdot \underset{\sim}{v} = \ 63                                | $${\underset{\sim}{u} \cdot \underset{\sim}{v} = - 5                                                                 |
| }{\left| \underset{\sim}{u} \right| = \ 5,\ \left| \underset{\sim}{v} \right| = \ 13 | }{\left| \underset{\sim}{u} \right| = \ \sqrt{5},\ \left| \underset{\sim}{v} \right| = \ \sqrt{10}                   |
| }{\cos\ \theta\  = \frac{63}{65}                                                     | }{\cos\ \theta\  = \  - \frac{5}{\sqrt{50}} = \  - \frac{1}{\sqrt{2}}                                                |
| }{\theta \approx \ 14{^\circ}}$$                                                     | }{\theta\  \approx \ 135{^\circ}}$$                                                                                  |
+======================================================================================+======================================================================================================================+
| c.  $\underset{\sim}{u} = \ \left( \begin{array}{r}                                  | d.  $\underset{\sim}{u} = \ 2\mathbf{i}\  + \ 5\mathbf{j}\ and\ \underset{\sim}{v} = \ 3\mathbf{i}\  + \mathbf{\ j}$ |
|     6 \\                                                                             |                                                                                                                      |
|      - 3                                                                             | $${\underset{\sim}{u} \cdot \underset{\sim}{v} = \ 11                                                                |
|     \end{array} \right)\ and\ \underset{\sim}{v} = \ \left( \begin{array}{r}         | }{\left| \underset{\sim}{u} \right| = \ \sqrt{29},\ \left| \underset{\sim}{v} \right| = \ \sqrt{10}                  |
|     2 \\                                                                             | }{\cos\ \theta\  = \frac{11}{\sqrt{290}}                                                                             |
|     4                                                                                | }{\theta\  \approx \ 50{^\circ}}$$                                                                                   |
|     \end{array} \right)$                                                             |                                                                                                                      |
|                                                                                      |                                                                                                                      |
| $${\underset{\sim}{u} \cdot \underset{\sim}{v} = 0                                   |                                                                                                                      |
| }{\cos\ \theta\  = 0                                                                 |                                                                                                                      |
| }{\theta = 90{^\circ}}$$                                                             |                                                                                                                      |
+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------+

5.  The angle between vectors $\underset{\sim}{u}$ and
    $\underset{\sim}{v}$ is 60° and their scalar product is 10.\
    If $\underset{\sim}{v}\  = \ 3\mathbf{i\ } - \ 4\mathbf{j},\$find
    the magnitude of $\underset{\sim}{u}$.

$${\left| \underset{\sim}{u} \right|\left| \underset{\sim}{v} \right|cos\ 60{^\circ}\  = \ 10
}{\left| \underset{\sim}{u} \right| \times \ 5\  \times \ ½\  = \ 10
}{\left| \underset{\sim}{u} \right| = \ 4}$$

# Properties of the Dot Product

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** What the dot product represents                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
+=====================================================================================================================+===================================================================================================================================================+=====================================================================================================================+=====================================================================================================================+
| - <https://www.desmos.com/geometry/0ufbyovmn1>                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Consider the two unit vectors $\overset{̰}{\widehat{a}}$ and $\overset{̰}{\widehat{b}}$ below. The dot product is shown.                                                                                                                                                                                                                                                                                                                                                                                              |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image20.png){width="1.3355500874890638in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image21.png){width="1.3769641294838144in" height="1.453996062992126in"} | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image23.png){width="1.3560214348206474in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image24.png){width="1.4312128171478564in" |
| height="1.5130008748906387in"}                                                                                      |                                                                                                                                                   | height="1.44038167104112in"}                                                                                        | height="1.513089457567804in"}                                                                                       |
|                                                                                                                     | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image22.png){width="1.3507852143482064in"                               |                                                                                                                     |                                                                                                                     |
|                                                                                                                     | height="1.5410367454068241in"}                                                                                                                    |                                                                                                                     | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image25.png){width="1.3979057305336833in" |
|                                                                                                                     |                                                                                                                                                   |                                                                                                                     | height="1.521441382327209in"}                                                                                       |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image26.png){width="1.3979057305336833in" |                                                                                                                                                   | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image27.png){width="1.3923611111111112in" |                                                                                                                     |
| height="1.4041754155730535in"}                                                                                      |                                                                                                                                                   | height="1.5131944444444445in"}                                                                                      |                                                                                                                     |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
|                                                                                                                     | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image28.png){width="1.45in"                                             |                                                                                                                     |                                                                                                                     |
|                                                                                                                     | height="1.5340277777777778in"}![](media/Introduction to Vectors 2_Further operations with vectors/media/image29.png){width="1.3193722659667542in" |                                                                                                                     |                                                                                                                     |
|                                                                                                                     | height="1.533494094488189in"}                                                                                                                     |                                                                                                                     |                                                                                                                     |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| What do you think the dot product represents, when you have two unit vectors?                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| *The dot product is a measure of how much two vectors point in the same .....................,*                                                                                                                                                                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| *If two unit vectors point in the exact same direction, the dot product is ..................*                                                                                                                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| *If two unit vectors are ........................, the dot product is 0.*                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| *If two unit vectors are pointing in exact ............... directions, the dot product is ...............*                                                                                                                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| *For two unit vectors, the dot product is given by* $\overset{̰}{\widehat{a}} \cdot \overset{̰}{\widehat{b}} = \left| \overset{̰}{\widehat{a}} \right|\left| \overset{̰}{b} \right|\cos\theta =$ *...............*                                                                                                                                                                                                                                                                                                      |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** What the dot product represents                                                                                                                                                                                                                                                                                                             |
+=====================================================================================================================+=====================================================================================================================+=====================================================================================================================+
| - https://www.geogebra.org/m/wph4vxjh                                                                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                                                                 |
| Consider the two vectors $\overset{̰}{u}$ and $\overset{̰}{v}$ below.                                                                                                                                                                                                                                                                                             |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image30.png){width="1.4814807524059492in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image31.png){width="1.4729166666666667in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image32.png){width="1.4729166666666667in" |
| height="1.4814807524059492in"}                                                                                      | height="1.48125in"}                                                                                                 | height="1.476388888888889in"}                                                                                       |
|                                                                                                                     |                                                                                                                     |                                                                                                                     |
| $\overset{̰}{u} \cdot \overset{̰}{v} =$ ......                                                                        | $\overset{̰}{u} \cdot \overset{̰}{v} =$ ......                                                                        | $\overset{̰}{u} \cdot \overset{̰}{v} =$ ......                                                                        |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image33.png){width="1.469468503937008in"  | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image34.png){width="1.4729166666666667in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image35.png){width="1.4605982064741907in" |
| height="1.4814807524059492in"}                                                                                      | height="1.4808989501312335in"}                                                                                      | height="1.476388888888889in"}                                                                                       |
|                                                                                                                     |                                                                                                                     |                                                                                                                     |
| $\overset{̰}{u} \cdot \overset{̰}{v} =$ ......                                                                        | $\overset{̰}{u} \cdot \overset{̰}{v} =$ ......                                                                        | $\overset{̰}{u} \cdot \overset{̰}{v} =$ ......                                                                        |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image36.png){width="1.819549431321085in"  | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image37.png){width="2.0872397200349955in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image38.png){width="1.533834208223972in"  |
| height="1.53044728783902in"}                                                                                        | height="1.5094860017497813in"}                                                                                      | height="1.533834208223972in"}                                                                                       |
|                                                                                                                     |                                                                                                                     |                                                                                                                     |
| $\overset{̰}{u} \cdot \overset{̰}{v} =$ ......                                                                        | $\overset{̰}{u} \cdot \overset{̰}{v} =$ ......                                                                        | $\overset{̰}{u} \cdot \overset{̰}{v} =$ ......                                                                        |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| What do you think the dot product represents?                                                                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                                                                 |
| *The dot product is how much of* $\overset{̰}{a}$ *points in the same ............... of* $\overset{̰}{b}$*, scaled by their ........................*                                                                                                                                                                                                            |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Dot Product**                                                                                                                                                            |
+=================================================================+============================================================================================================+
| The dot product multiplies two vectors to give a scalar.                                                                                                                     |
|                                                                                                                                                                              |
| This scalar measures how much the vectors point in the same direction, scaled by their magnitudes.                                                                           |
+-----------------------------------------------------------------+------------------------------------------------------------------------------------------------------------+
| **Algebraic Formula**                                           | **Geometric Formula**                                                                                      |
|                                                                 |                                                                                                            |
| For $\overset{̰}{a} = x_{1}\mathbf{i +}y_{1}\mathbf{j}$ and      | For the angle $\theta$ between two vectors $\overset{̰}{a}$ and $\overset{̰}{b}$:                            |
| $\overset{̰}{b} = x_{2}\mathbf{i} + y_{2}\mathbf{j}:$            |                                                                                                            |
|                                                                 | $$\overset{̰}{a} \cdot \overset{̰}{b} = \left| \overset{̰}{a} \right|\left| \overset{̰}{b} \right|\cos\theta$$ |
| $$\overset{̰}{a} \cdot \overset{̰}{b} = x_{1}x_{2} + y_{1}y_{2}$$ |                                                                                                            |
+-----------------------------------------------------------------+------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------+
| - **Dot Product Properties**                                                                       |
+====================================================================================================+
| Self-dot property: $\overset{̰}{a} \cdot \overset{̰}{a} = |a|^{2}$                                   |
|                                                                                                    |
| Perpendicular vectors: $\overset{̰}{a} \cdot \overset{̰}{b} = 0$                                     |
|                                                                                                    |
| Parallel vectors:                                                                                  |
| $\overset{̰}{a} \cdot \overset{̰}{b} = \pm \left| \overset{̰}{a} \right|\left| \overset{̰}{b} \right|$ |
+----------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Proof** of dot product properties                                                                                                                                                                                    |
+==========================================================================================================================================================================================================================+
| Let $\overset{̰}{a} = x_{1}\mathbf{i} + y_{1}\mathbf{j}$ and $\overset{̰}{b} = x_{2}\mathbf{i} + y_{2}\mathbf{j}$. Let $\theta$ be the angle between them.                                                                 |
|                                                                                                                                                                                                                          |
| **Prove** $\overset{̰}{\mathbf{a}}\mathbf{\cdot}\overset{̰}{\mathbf{a}}\mathbf{=}\left| \overset{̰}{\mathbf{a}} \right|^{\mathbf{2}}$ **using:**                                                                            |
|                                                                                                                                                                                                                          |
| +----------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------+ |
| | **Algebraic formula**                                                                              | **Geometric formula**                                                                                           | |
| |                                                                                                    |                                                                                                                 | |
| | $$\overset{̰}{a} \cdot \overset{̰}{a} = x_{1}x_{1} + y_{1}y_{1}$$                                    | $$\overset{̰}{a} \cdot \overset{̰}{a} = \left| \overset{̰}{a} \right|\left| \overset{̰}{a} \right|\cos{0{^\circ}}$$ | |
| |                                                                                                    |                                                                                                                 | |
| | $=$ ..................                                                                             |                                                                                                                 | |
| |                                                                                                    |                                                                                                                 | |
| | Using magnitude formula:                                                                           |                                                                                                                 | |
| |                                                                                                    |                                                                                                                 | |
| | $$\left| \overset{̰}{a} \right| = \sqrt{\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ }$$ |                                                                                                                 | |
| +====================================================================================================+=================================================================================================================+ |
|                                                                                                                                                                                                                          |
| **Prove** $\overset{̰}{\mathbf{a}}\mathbf{\cdot}\overset{̰}{\mathbf{b}}\mathbf{= 0}$ **for perpendicular vectors:**                                                                                                        |
|                                                                                                                                                                                                                          |
| Reminder: Two vectors perpendicular when $\left( \begin{array}{r}                                                                                                                                                        |
| x_{1} \\                                                                                                                                                                                                                 |
| y_{1}                                                                                                                                                                                                                    |
| \end{array} \right)\bot\left( \begin{array}{r}                                                                                                                                                                           |
|  - y_{1} \\                                                                                                                                                                                                              |
| x_{1}                                                                                                                                                                                                                    |
| \end{array} \right)$ and $\theta = 90{^\circ}$                                                                                                                                                                           |
|                                                                                                                                                                                                                          |
| +-----------------------------------------+-----------------------------------------+                                                                                                                                    |
| | **Algebraic formula**                   | **Geometric formula**                   |                                                                                                                                    |
| |                                         |                                         |                                                                                                                                    |
| | $$\overset{̰}{a} \cdot \overset{̰}{b} =$$ | $$\overset{̰}{a} \cdot \overset{̰}{b} =$$ |                                                                                                                                    |
| +=========================================+=========================================+                                                                                                                                    |
|                                                                                                                                                                                                                          |
| **Prove** $\overset{̰}{\mathbf{a}}\mathbf{\cdot}\overset{̰}{\mathbf{b}}\mathbf{= \pm}\left| \overset{̰}{\mathbf{a}} \right|\left| \overset{̰}{\mathbf{b}} \right|$ **for parallel vectors (use the geometric formula):**     |
|                                                                                                                                                                                                                          |
| Reminder: Two vectors parallel when $\theta = 0{^\circ}$ or $180{^\circ}$                                                                                                                                                |
|                                                                                                                                                                                                                          |
| $$\overset{̰}{a} \cdot \overset{̰}{b} =$$                                                                                                                                                                                  |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------+
| - **Proof** of dot product formulae equivalence                                                                           |
+===========================================================================================================================+
| We will now prove that $x_{1}x_{2} + y_{1}y_{2} = \left| \overset{̰}{a} \right|\left| \overset{̰}{b} \right|\cos\theta$:    |
|                                                                                                                           |
| Let $\overrightarrow{OA} = \overset{̰}{a}$ and $\overrightarrow{OB} = \overset{̰}{b}$. Let $\theta$ be the angle between    |
| them.                                                                                                                     |
|                                                                                                                           |
| We will consider $A$ and $B$ to be in the first quadrant, for convenience.\                                               |
| All parts of this proof are valid for all quadrants.                                                                      |
|                                                                                                                           |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image39.png){width="3.1578947944007in"          |
| height="2.6442202537182853in"} Construct the vector $\overrightarrow{AB}$ and write an expression for it                  |
|                                                                                                                           |
| $\overrightarrow{AB} =$ $\overrightarrow{OB}$ $-$ ...... $=$ $\overset{̰}{} - \overset{̰}{}$                                |
|                                                                                                                           |
| Using Cosine rule, relate the three side lengths of the triangle.                                                         |
|                                                                                                                           |
| $\left| \overset{̰}{b} - \overset{̰}{a} \right|^{2} =$ ..........................................                           |
|                                                                                                                           |
| Use distance formula to expand                                                                                            |
| $\left| \overset{̰}{b} - \overset{̰}{a} \right|^{2} = \left( x_{2} - x_{1} \right)^{2} + \left( y_{2} - y_{1} \right)^{2},$ |
| hence prove equivalence.                                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  Find $\underset{\sim}{u} \cdot \underset{\sim}{v}$ and hence
    determine in each part whether the vectors $\underset{\sim}{u}$ and
    $\underset{\sim}{v}$ are perpendicular.

+------------------------------------------------------------------------+------------------------------------------------------------------------+------------------------------------------------------------------------+
| a.  $\underset{\sim}{u} = \ \left( \begin{array}{r}                    | b.  $\underset{\sim}{u} = \ \left( \begin{array}{r}                    | c.  $\underset{\sim}{u} = \ \left( \begin{array}{r}                    |
|      - 4 \\                                                            |      - 4 \\                                                            |      - 1 \\                                                            |
|     5                                                                  |      - 6                                                               |     a^{- 2}                                                            |
|     \end{array} \right),\underset{\sim}{v} = \ \left( \begin{array}{r} |     \end{array} \right),\underset{\sim}{v} = \ \left( \begin{array}{r} |     \end{array} \right),\underset{\sim}{v} = \ \left( \begin{array}{r} |
|     7 \\                                                               |     18 \\                                                              |     a^{- 1} \\                                                         |
|     6                                                                  |      - 12                                                              |     a                                                                  |
|     \end{array} \right)$                                               |     \end{array} \right)$                                               |     \end{array} \right)$                                               |
|                                                                        |                                                                        |                                                                        |
| $$\overset{̰}{u} \cdot \overset{̰}{v} = 2$$                              | $$\overset{̰}{u} \cdot \overset{̰}{v} = 0$$                              | $$\overset{̰}{u} \cdot \overset{̰}{v} = 0$$                              |
|                                                                        |                                                                        |                                                                        |
| Not perpendicular                                                      | perpendicular                                                          | perpendicular                                                          |
+========================================================================+========================================================================+========================================================================+

2.  Show that
    $\underset{\sim}{v} \cdot \underset{\sim}{v} = \ \left| \underset{\sim}{v} \right|^{2}$
    where:

+-----------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------+
| a.  $\underset{\sim}{v} = \ 3\mathbf{i}\  - \ 4\mathbf{j}\$                                         | b.  $\underset{\sim}{v} = \ a\mathbf{i\ } + \ b\mathbf{j}$                            |
|                                                                                                     |                                                                                       |
| $$\left| \underset{\sim}{v} \right|^{2} = \ 9\  + \ 16\  = \ 25$$                                   | $$\left| \underset{\sim}{v} \right|^{2} = \ a^{2} + \ b^{2}$$                         |
|                                                                                                     |                                                                                       |
| $$\underset{\sim}{v} \cdot \underset{\sim}{v} = \ 3(3) + \ ( - 4)( - 4) = \ 9\  + \ 16\  = \ 25\ $$ | $$\underset{\sim}{v} \cdot \underset{\sim}{v} = \ a(a) + \ b(b) = \ a^{2} + \ b^{2}$$ |
+=====================================================================================================+=======================================================================================+

3.  Suppose that A, B and C are the points (2, 5), (5, 14) and (−2, 13)
    respectively.\
    It is known that the angle between the vectors $\overrightarrow{AB}$
    and $\overrightarrow{AC}$ is 45°.

    a.  Find the vectors $\overrightarrow{AB}$ and $\overrightarrow{AC}$
        in component form.

$$\overrightarrow{AB}\  = \ (5 - 2,\ 14 - 5) = \ 3\mathbf{i}\  + \ 9\mathbf{j}$$

$$\overrightarrow{AC}\  = \ ( - 2 - 2,\ 13 - 5) = \  - 4\mathbf{i\ } + \ 8\mathbf{j}$$

b.  Find $\overrightarrow{AB}\  \cdot \ \overrightarrow{AC}$ using the
    result
    $\underset{\sim}{u} \cdot \underset{\sim}{v}\  = \ x₁x₂\  + \ y₁y₂.$

$$3( - 4) + \ 9(8) = \ 60$$

c.  Confirm your answer to part **b** using the result
    $\underset{\sim}{u} \cdot \underset{\sim}{v} = \ \left| \underset{\sim}{u} \right|\left| \underset{\sim}{v} \right|cos\ \theta.$

$$|\overrightarrow{AB}| = \ \sqrt{9\  + \ 81} = \sqrt{90}$$

$$|\overrightarrow{AC}| = \ \sqrt{16\  + \ 64} = \ \sqrt{80}$$

$$\left| \overrightarrow{AB} \right|\left| \overrightarrow{AC} \right|\ \cos\ 45{^\circ}\  = \ \sqrt{90} \times \ \sqrt{80} \times \ \left( \frac{1}{\sqrt{2}} \right)\  = 60$$

4.  Suppose that P, Q and R are the points
    $\left( \sqrt{3},\ 8 \right),\ \left( 3\sqrt{3},\ 14 \right)\$and
    $\left( 5\sqrt{3},\ 12 \right)$ respectively.\
    It is known that the angle between the vectors $\overrightarrow{PQ}$
    and $\overrightarrow{PR}$ is 30°.

    a.  Find the vectors $\overrightarrow{PQ}$ and $\overrightarrow{PR}$
        in component form.

$$\overrightarrow{PQ}\  = \ \left( 3\sqrt{3} - \ \sqrt{3},\ 14\  - \ 8 \right) = \ 2\sqrt{3}\mathbf{i} + \ 6\mathbf{j}$$

$$\overrightarrow{PR}\  = \ \left( 5\sqrt{3} - \ \sqrt{3},\ 12\  - \ 8 \right) = \ 4\sqrt{3}\mathbf{i} + \ 4\mathbf{j}$$

b.  Find $\overrightarrow{PQ}\  \cdot \ \overrightarrow{PR}$ using the
    result
    $\underset{\sim}{u} \cdot \underset{\sim}{v}\  = \ x₁x₂\  + \ y₁y₂.$

$$\left( 2\sqrt{3} \right)\left( 4\sqrt{3} \right) + \ (6)(4) = \ 48$$

c.  Confirm your answer to part **b** using the result
    $\underset{\sim}{u} \cdot \underset{\sim}{v} = \ \left| \underset{\sim}{u} \right|\left| \underset{\sim}{v} \right|cos\ \theta.$

$$\left| \overrightarrow{PQ} \right| = \ \sqrt{12\  + \ 36} = \ \sqrt{48}$$

$$\left| \overrightarrow{PR} \right|\  = \ \sqrt{48\  + \ 16} = \ 8$$

$$\left| \overrightarrow{PQ} \right|\left| \overrightarrow{PR} \right|\ \cos\ 30{^\circ}\  = \ \sqrt{48} \times \ 8\  \times \ \left( \frac{\sqrt{3}}{2} \right) = \ 48$$

Development

5.  a.  Find the scalar product of
        $\underset{\sim}{u} = \ 3\mathbf{i\ } - \ 6\mathbf{j}$ and
        $\underset{\sim}{v}\  = \  - 2\mathbf{i}\  - \ \mathbf{j}.$

$$\underset{\sim}{u} \cdot \underset{\sim}{v} = \ 3( - 2) + \ ( - 6)( - 1) = \ 0$$

b.  Find the angle between the vectors.

θ = 90°

6.  Find the values of $\lambda$ for which the vectors
    $\underset{\sim}{u} = \ \lambda^{2}\mathbf{i}\  + \ 2\mathbf{j}$ and
    $\underset{\sim}{v} = \ 3\mathbf{i} - \ (2\  + \ 2\lambda)\mathbf{j}$
    are perpendicular.

$${\underset{\sim}{u} \cdot \underset{\sim}{v} = \ 0\ for\ perpendicular
}{\lambda^{2}(3) + \ 2( - 2\  - \ 2\lambda) = \ 0
}{3\lambda ²\  - \ 4\  - \ 4\lambda\  = \ 0
}{3\lambda ²\  - \ 4\lambda\  - \ 4\  = \ 0
}{(3\lambda\  + \ 2)(\lambda\  - \ 2)\  = \ 0
}{\lambda\  = \  - \frac{2}{3}or\ 2}$$

7.  The angle between vectors
    $\underset{\sim}{u} = \ \mathbf{i} - 3\mathbf{j}$ and
    $\underset{\sim}{v} = \ a\mathbf{i}\  + \ 5\mathbf{j}$ is 120°.

Evaluate $a$ correct to 1 decimal place.

$${\underset{\sim}{u} \cdot \underset{\sim}{v} = \ a\  - \ 15
}{\left| \underset{\sim}{u} \right| = \ \sqrt{10},\ \left| \underset{\sim}{v} \right| = \ \sqrt{a^{2} + \ 25}
}{\cos\ 120{^\circ}\  = \frac{a\  - \ 15}{\sqrt{10} \times \ \sqrt{a^{2} + \ 25}}
}{- \frac{1}{2} = \frac{a\  - \ 15}{\sqrt{10\left( a^{2} + \ 25 \right)}}
}{- \sqrt{10\left( a^{2} + \ 25 \right)} = \ 2(a\  - \ 15)
}{10(a²\  + \ 25)\  = \ 4(a\  - \ 15)^{2}
}{10a^{2} + \ 250\  = \ 4a^{2} - \ 120a\  + \ 900
}{6a^{2} + \ 120a\  - \ 650\  = \ 0
}{3a^{2} + \ 60a\  - \ 325\  = \ 0
}{a\  = \frac{- 60\  \pm \ \sqrt{3600\  + \ 3900}}{6} = \frac{- 60\  \pm \ \sqrt{7500}}{6}
}{a \approx \ 4.4\ or\  - 24.4}$$

8.  A question in the textbook says:\
    *'Find vector* $\underset{\sim}{b}$ *given*
    $\underset{\sim}{a} = \ 3\mathbf{i}\  - \ \mathbf{j},\ \ \underset{\sim}{a} \cdot \underset{\sim}{b} = \  - 6$
    *and the angle between* $\underset{\sim}{a}$ *and*
    $\underset{\sim}{b}$ *is 30°'\*
    Explain why there must be a typo in this question.

$$\overset{̰}{a} \cdot \overset{̰}{b} = \left| \overset{̰}{a} \right|\left| \overset{̰}{b} \right|\cos\theta$$

For this expression to be negative, $\cos\theta\$must be negative, so
$\theta$ cannot be acute.

If the dot product is negative, the angle between the vectors must be
obtuse.

# Proofs using Vectors

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Proofs using Vectors**                                                                                                                                                   |
+=================================================================+============================================================================================================+
| We can use vectors and the dot product to prove many geometrical properties.                                                                                                 |
|                                                                                                                                                                              |
| Triangle Addition Law: $\overrightarrow{AB} + \overrightarrow{BC} = \overrightarrow{AC}$                                                                                     |
|                                                                                                                                                                              |
| Parallelogram Subtraction Law: $\overrightarrow{AB} - \overrightarrow{AD} = \overrightarrow{DB}$                                                                             |
|                                                                                                                                                                              |
| Two vectors $\overset{̰}{a}$ and $\overset{̰}{b}$ parallel when: $\overset{̰}{b} = \lambda\overset{̰}{a},\ \ \lambda\mathbb{\in R}$                                              |
|                                                                                                                                                                              |
| A, B, C are collinear if $\overrightarrow{AB}$ and $\overrightarrow{BC}$ are parallel.                                                                                       |
+-----------------------------------------------------------------+------------------------------------------------------------------------------------------------------------+
| **Dot Product Algebraic Formula**                               | **Dot Product Geometric Formula**                                                                          |
|                                                                 |                                                                                                            |
| For $\overset{̰}{a} = x_{1}\mathbf{i +}y_{1}\mathbf{j}$ and      | For the angle $\theta$ between two vectors $\overset{̰}{a}$ and $\overset{̰}{b}$:                            |
| $\overset{̰}{b} = x_{2}\mathbf{i} + y_{2}\mathbf{j}:$            |                                                                                                            |
|                                                                 | $$\overset{̰}{a} \cdot \overset{̰}{b} = \left| \overset{̰}{a} \right|\left| \overset{̰}{b} \right|\cos\theta$$ |
| $$\overset{̰}{a} \cdot \overset{̰}{b} = x_{1}x_{2} + y_{1}y_{2}$$ |                                                                                                            |
+-----------------------------------------------------------------+------------------------------------------------------------------------------------------------------------+
| Self-dot property: $\overset{̰}{a} \cdot \overset{̰}{a} = |a|^{2}$                                                                                                             |
|                                                                                                                                                                              |
| Perpendicular vectors: $\overset{̰}{a} \cdot \overset{̰}{b} = 0$                                                                                                               |
|                                                                                                                                                                              |
| Parallel vectors: $\overset{̰}{a} \cdot \overset{̰}{b} = \pm \left| \overset{̰}{a} \right|\left| \overset{̰}{b} \right|$                                                         |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  The quadrilateral ABCD has vertices
    A$( - 3,\  - 6),\ B(1,\  - 4),\ C( - 2,\ 2)$ and $D( - 6,\ 0).$

    a.  Show that $\overrightarrow{AB}\  = \ \overrightarrow{DC}\$and
        $\overrightarrow{AD} = \overrightarrow{BC}$.

$${\overrightarrow{AB}\  = \ \overrightarrow{OB} - \overrightarrow{OA} = (1 - ( - 3),\  - 4 - ( - 6))\  = \ (4,\ 2)
}{\overrightarrow{DC}\  = \ ( - 2 - ( - 6),\ 2 - 0)\  = \ (4,\ 2)
}{\therefore\ \overrightarrow{AB}\  = \ \overrightarrow{DC}}$$

Similarly, $\overrightarrow{AD} = \overrightarrow{BC} = ( - 3,6)$

b.  Show
    that$\ \overrightarrow{AB}\  \cdot \ \overrightarrow{AD}\  = \ 0$.

$$\overrightarrow{AB}\  \cdot \ \overrightarrow{AD}\  = \ 4( - 3) + \ 2(6) = \  - 12\  + \ 12\  = \ 0$$

c.  What type of special quadrilateral is $ABCD$? Give reasons for your
    answer.

Rectangle: parallelogram (opposite sides equal) with adjacent sides
perpendicular (not a square as magnitudes of sides not equal).

2.  The quadrilateral PQRS has vertices
    $P( - 8,\ 3),\ Q(3,\ 7),\ R(7,\ 18)$ and $S( - 4,\ 14).$

    a.  Show that the diagonals PR and QS bisect each other by showing
        $½\overrightarrow{PR}\  = \ \overrightarrow{PQ}\  + \ ½\overrightarrow{QS}$

$${\overrightarrow{PR}\  = \ (7 - ( - 8),\ 18 - 3)\  = \ (15,\ 15)
}{½\overrightarrow{PR}\  = \ (7.5,\ 7.5)
}{\overrightarrow{PQ}\  = \ (3 - ( - 8),\ 7 - 3)\  = \ (11,\ 4)
}{\overrightarrow{QS}\  = \ ( - 4 - 3,\ 14 - 7)\  = \ ( - 7,\ 7)
}{½\overrightarrow{QS}\  = \ ( - 3.5,\ 3.5)
}{\overrightarrow{PQ}\  + \ ½\overrightarrow{QS}\  = \ (11 - 3.5,\ 4 + 3.5)\  = \ (7.5,\ 7.5)\  = \ ½\overrightarrow{PR}}$$

b.  Show that that the diagonals are perpendicular by showing that
    $\overrightarrow{PR}\  \cdot \ \overrightarrow{QS}\  = \ 0$.

$$\overrightarrow{PR}\  \cdot \ \overrightarrow{QS}\  = \ 15( - 7) + \ 15(7) = \ 0$$

c.  What type of special quadrilateral is PQRS? Give reasons for your
    answer.

Rhombus: diagonals bisect each other at 90°

3.  Suppose that A, P and Q are the points (−3, 3), (2, 9) and (10, 0)
    respectively.

    a.  Write $\overrightarrow{AP}$ and $\overrightarrow{AQ}$ as column
        vectors.

$$\overrightarrow{AP}\  = \ \left( 2 - ( - 3),\ 9 - 3 \right) = \ \left( \begin{array}{r}
5 \\
6
\end{array} \right)$$

$$\overrightarrow{AQ}\  = \ \left( 10 - ( - 3),\ 0 - 3 \right) = \ \left( \begin{array}{r}
13 \\
 - 3
\end{array} \right)$$

b.  Hence find ∠PAQ correct to the nearest degree.

$${\overrightarrow{AP}\  \cdot \ \overrightarrow{AQ}\  = \ 5(13)\  + \ 6( - 3)\  = \ 47
}{\left| \overrightarrow{AP} \right| = \ \sqrt{25\  + \ 36} = \ \sqrt{61}
}{\left| \overrightarrow{AQ} \right| = \ \sqrt{169\  + \ 9} = \ \sqrt{178}
}{\cos\ \theta\  = \frac{47}{\sqrt{61\  \times \ 178}} = \frac{47}{\sqrt{10858}}
}{\theta\  = \ cos^{- 1}\left( \frac{47}{\sqrt{10858}} \right) \approx \ 63{^\circ}\ }$$

4.  The quadrilateral PQRS has vertices P(1, 2), Q(8, 3), R(6, 13) and
    S(4, 9). Use the dot product to find, correct to the nearest minute,
    the acute angle between the diagonals.

$${\overrightarrow{PR}\  = \ (5,\ 11),\ \overrightarrow{QS}\  = \ ( - 4,\ 6)
}{\overrightarrow{PR}\  \cdot \ \overrightarrow{QS}\  = \  - 20\  + \ 66\  = \ 46
}{\left| \overrightarrow{PR} \right| = \ \sqrt{146},\ \left| \overrightarrow{QS} \right| = \ \sqrt{52}
}{\cos\ \theta\  = \frac{46}{\sqrt{146\  \times \ 52}} = \frac{46}{\sqrt{7592}}
}{\theta \approx \ 58{^\circ}8'}$$

5.  Given $\overrightarrow{OA}\  = \ \left( \begin{array}{r}
    6 \\
    2
    \end{array} \right)$ and
    $\overrightarrow{OB}\  = \ \left( \begin{array}{r}
    1 \\
    5
    \end{array} \right)$:

    a.  Find the angle in degrees and minutes, to the nearest minute,
        between:

+---------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+
| i.  $\overrightarrow{OA}\ and\ \overrightarrow{OB}$                                                     | ii. $\overrightarrow{OA}\ and\ \overrightarrow{OA}\  - \ \overrightarrow{OB}$                                            | iii. $\overrightarrow{OB}\ and\ \overrightarrow{OA}\  - \ \overrightarrow{OB}$                                               |
|                                                                                                         |                                                                                                                          |                                                                                                                              |
| $${\overrightarrow{OA}\  \cdot \ \overrightarrow{OB}\  = \ 6(1) + \ 2(5) = \ 16                         | $${\overrightarrow{OA}\  - \ \overrightarrow{OB}\  = \ (5,\  - 3)                                                        | $${\overrightarrow{OB}\  \cdot \ \left( \overrightarrow{OA}\  - \ \overrightarrow{OB} \right) = \ 1(5) + \ 5( - 3) = \  - 10 |
| }{\left| \overrightarrow{OA} \right| = \ \sqrt{40},\ \left| \overrightarrow{OB} \right| = \ \sqrt{26}\  | }{\overrightarrow{OA}\  \cdot \ \left( \overrightarrow{OA}\  - \ \overrightarrow{OB} \right) = \ 6(5) + \ 2( - 3) = \ 24 | }{\cos\ \theta\  = \  - \frac{10}{\sqrt{26} \times \ \sqrt{34}}                                                              |
| }{\cos\ \theta\  = \frac{16}{\sqrt{1040}}                                                               | }{\left| \overrightarrow{OA}\  - \ \overrightarrow{OB} \right| = \ \sqrt{34}                                             | }{\theta \approx \ 109{^\circ}39'}$$                                                                                         |
| }{\theta \approx \ 60{^\circ}15'}$$                                                                     | }{\cos\ \theta\  = \frac{24}{\sqrt{40} \times \ \sqrt{34}}                                                               |                                                                                                                              |
|                                                                                                         | }{\theta\  \approx \ 49{^\circ}24'}$$                                                                                    |                                                                                                                              |
+=========================================================================================================+==========================================================================================================================+==============================================================================================================================+

a.  What geometrical relationship does this illustrate?

A sketch is useful here.

Exterior angle of triangle = sum of interior opposite angles

109°39′ = 60°15′ + 49°24′

6.  The point $P\left( r\ \cos\ \theta,\ r\ \sin\ \theta \right)$ varies
    on the circle $x²\  + \ y²\  = \ r².$

Let A and B be the points $( - r,\ 0)\$and $(r,\ 0)$ respectively.

Use the dot product to show that ∠APB = 90°, provided that P ≠ A or B.

$${\overrightarrow{AP}\  = \ (r\ \cos\ \theta\  - \ ( - r),\ r\ \sin\ \theta)\  = \ (r\ \cos\ \theta\  + \ r,\ r\ \sin\ \theta)
}{\overrightarrow{BP}\  = \ (r\ \cos\ \theta\  - \ r,\ r\ \sin\ \theta)
}{\overrightarrow{AP}\  \cdot \ \overrightarrow{BP}\  = \ (r\ \cos\ \theta\  + \ r)(r\ \cos\ \theta\  - \ r)\  + \ r²\ sin²\ \theta
}{= \ r²\ \cos ²\ \theta\  - \ r²\  + \ r²\ \sin ²\ \theta
}{= \ r²(\cos ²\ \theta\  + \ \sin ²\ \theta)\  - \ r²
}{= \ r²\  - \ r²\  = \ 0
}{\therefore\ \angle APB\  = \ 90{^\circ}}$$

Development

7.  Triangle ABC has vertices A(2, 1), B(10, 4) and C(5, 13).

    a.  Show that $\cos\ \angle ABC\  =$ $\frac{13}{\sqrt{7738}}$

$${\overrightarrow{BA}\  = \ (2 - 10,\ 1 - 4)\  = \ ( - 8,\  - 3)
}{\overrightarrow{BC}\  = \ (5 - 10,\ 13 - 4)\  = \ ( - 5,\ 9)
}{\overrightarrow{BA}\  \cdot \ \overrightarrow{BC}\  = \ 40\  - \ 27\  = \ 13
}{\left| \overrightarrow{BA} \right| = \ \sqrt{64\  + \ 9} = \ \sqrt{73}
}{\left| \overrightarrow{BC} \right| = \ \sqrt{25\  + \ 81} = \ \sqrt{106}
}{\cos\ \angle ABC\  = \frac{13}{\sqrt{73\  \times \ 106}} = \frac{13}{\sqrt{7738}}}$$

b.  Find the exact value of $sin\ \angle ABC$.

$${using\sin^{2}x + \cos^{2}x = 1
}{\sin^{2}\angle ABC\  = \ 1\  - \frac{169}{7738}
}{= \frac{7569}{7738}
}{sin\ \angle ABC\  = \frac{87}{\sqrt{7738}}}$$

c.  Hence find the area of triangle ABC.

$${Area\  = \ ½\  \times \ \left| \overrightarrow{BA} \right| \times \ \left| \overrightarrow{BC} \right| \times \sin{\angle ABC}
}{= \ ½\  \times \ \sqrt{73} \times \ \sqrt{106} \times \frac{87}{\sqrt{7738}}
}{= \ ½\  \times \ 87\ 
}{= \ 43.5\ u²}$$

8.  In $\bigtriangleup ABC$ to the right, $P$ is the midpoint of $AC$
    and $Q$ is the midpoint of $BC$.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image40.png){width="1.7590277777777779in"
height="1.9680555555555554in"}Let
$\overrightarrow{AC}\  = \underset{\sim}{a}$ and
$\overrightarrow{CB}\  = \underset{\sim}{b}$.

a.  Write $\overrightarrow{AB}$ in terms of $\underset{\sim}{a}$ and
    $\underset{\sim}{b}.$

b.  Write $\overrightarrow{PQ}$ in terms of $\underset{\sim}{a}$ and
    $\underset{\sim}{b}.$

c.  Hence explain why $\overrightarrow{PQ}$ is parallel to
    $\overrightarrow{AB}$ and half its length.

$$1a$$

$${\overrightarrow{AC}\  = \underset{\sim}{a}\ and\ \overrightarrow{CB}\  = \underset{\sim}{b}\ 
}{P\ is\ the\ midpoint\ of\ AC\ and\ Q\ is\ the\ midpoint\ of\ BC
}{Hence,\ AP\  = \ PC\ and\ QC\  = \ QB
}{\overrightarrow{AB}\  = \ \overrightarrow{AC}\  + \ \overrightarrow{CB}
}{= \underset{\sim}{a} + \underset{\sim}{b}\ }$$

$$1b$$

$${\overrightarrow{PC}\  = \frac{1}{2}\overrightarrow{AC}\  = \frac{1}{2}\underset{\sim}{a}
}{\overrightarrow{CQ}\  = \frac{1}{2}\overrightarrow{CB}\  = \frac{1}{2}\underset{\sim}{b}\ \ 
}{\overrightarrow{PQ}\  = \ \overrightarrow{PC}\  + \ \overrightarrow{CQ}
}{= \left( \frac{1}{2} \right)\underset{\sim}{a} + \left( \frac{1}{2} \right)\underset{\sim}{b}
}{= \frac{1}{2}\left( \underset{\sim}{a} + \underset{\sim}{b} \right)}$$

$$1c$$

$${\overrightarrow{PQ}\  = \frac{1}{2}\left( \underset{\sim}{a} + \underset{\sim}{b} \right) = \frac{1}{2}\overrightarrow{AB}
}{Hence,\ PQ\  \parallel \ AB\ and\ PQ\  = \frac{1}{2}AB.}$$

9.  In the diagram to the right, $ABCD$ is a quadrilateral.\
    The points $P,\ Q,\ R$ and $S$ are the midpoints of $AB,\ BC,\ CD$
    and $DA$ respectively.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image41.png){width="2.00867782152231in"
height="1.968503937007874in"}Let$\ \overrightarrow{AB}\  = \underset{\sim}{a},\ \overrightarrow{BC}\  = \underset{\sim}{b},\ \overrightarrow{AD}\  = \underset{\sim}{d}\$and
$\overrightarrow{DC}\  = \underset{\sim}{c}.$

a.  Explain why
    $\underset{\sim}{a} + \underset{\sim}{b} = \underset{\sim}{d} + \underset{\sim}{c}$.

b.  Express $\overrightarrow{PQ}$ in terms of $\underset{\sim}{a}$ and
    $\underset{\sim}{b}.$

c.  Express $\overrightarrow{SR}$ in terms of $\underset{\sim}{d}$ and
    $\underset{\sim}{c}$.

d.  Hence show that $\overrightarrow{PQ}\  = \ \overrightarrow{SR}\$.

e.  Deduce that the quadrilateral $PQRS$ is a parallelogram.

$$a$$

$${\overrightarrow{AB}\  = \underset{\sim}{a},\ \overrightarrow{BC}\  = \underset{\sim}{b},\ \overrightarrow{AD}\  = \underset{\sim}{d}\ and\ \overrightarrow{DC}\  = \underset{\sim}{c}
}{\overrightarrow{AB}\  + \ \overrightarrow{BC}\  = \ \overrightarrow{AC}\  = \underset{\sim}{a} + \underset{\sim}{b}
}{\overrightarrow{AD}\  + \ \overrightarrow{DC}\  = \ \overrightarrow{AC}\  = \underset{\sim}{d} + \underset{\sim}{c}
}{As\ \overrightarrow{AB}\  + \ \overrightarrow{BC}\  = \ \overrightarrow{AC}\  = \ \overrightarrow{AD}\  + \ \overrightarrow{DC}
}{Hence,\ \ \ \overrightarrow{AC}\  = \underset{\sim}{a} + \underset{\sim}{b} = \underset{\sim}{d} + \underset{\sim}{c}.}$$

$$b$$

$$P\ is\ the\ midpoint\ of\ AB\ and\ Q\ is\ the\ midpoint\ of\ BC.$$

$$Hence,\ AP\  = \ PB\ and\ BQ\  = \ QC.$$

$${\overrightarrow{PB}\ \  = \frac{1}{2}\overrightarrow{AB}\  = \frac{1}{2}\underset{\sim}{a}
}{\overrightarrow{BQ}\  = \frac{1}{2}\overrightarrow{BC}\  = \frac{1}{2}\underset{\sim}{b}
}{\overrightarrow{PQ}\  = \ \overrightarrow{PB}\  + \ \overrightarrow{BQ}
}{= \frac{1}{2}\underset{\sim}{a} + \frac{1}{2}\underset{\sim}{b}
}{= \frac{1}{2}\left( \underset{\sim}{a} + \underset{\sim}{b} \right)}$$

$$c$$

$$R\ is\ the\ midpoint\ of\ CD\ and\ S\ is\ the\ midpoint\ of\ DA.$$

$$Hence,\ AS\  = \ SD\ and\ DR\  = \ RC$$

$${\overrightarrow{DR}\  = \frac{1}{2}\overrightarrow{DC}\  = \frac{1}{2}\underset{\sim}{c}
}{\overrightarrow{SD}\  = \frac{1}{2}\overrightarrow{AD}\  = \frac{1}{2}\underset{\sim}{d}\ 
}{\overrightarrow{SR}\  = \ \overrightarrow{SD}\  + \ \overrightarrow{DR}
}{= \frac{1}{2}\underset{\sim}{d} + \frac{1}{2}\underset{\sim}{c}
}{= \frac{1}{2}\left( \underset{\sim}{d} + \underset{\sim}{c} \right)}$$

$$d$$

$$From\ part\ a,\ \overrightarrow{AC}\  = \underset{\sim}{a} + \underset{\sim}{b} = \underset{\sim}{d} + \underset{\sim}{c}$$

$${\overrightarrow{PQ}\  = \frac{1}{2}\left( \underset{\sim}{a} + \underset{\sim}{b} \right) = \frac{1}{2}\overrightarrow{AC}
}{\overrightarrow{SR}\  = \frac{1}{2}\left( \underset{\sim}{d} + \underset{\sim}{c} \right) = \frac{1}{2}\overrightarrow{AC}
}{Hence,\ \overrightarrow{PQ}\  = \ \overrightarrow{SR}.}$$

$$e$$

$$Since\ \overrightarrow{PQ}\  = \ \overrightarrow{SR},\ $$

$$the\ line\ joining\ midpoints\ of\ the\ adjacent\ sides\ of\ the\ quadrilateral\ are\ parallel\ and\ equal\ to\ each\ other,\ $$

$$hence,\ ABCD\ is\ a\ parallelogram.$$

10. The rectangle $ABCD$ to the right has side lengths $|AB|\  = \ x$
    and $|BC|\  = \ y$.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image42.png){width="1.8288615485564303in"
height="1.3779527559055118in"}Let
$\overrightarrow{AB}\  = \underset{\sim}{a},\ \ \overrightarrow{BC}\  = \underset{\sim}{b}$
and $\overrightarrow{CD}\  = \underset{\sim}{c}\ .$

a.  Express $\overrightarrow{AC}$ in terms of $\underset{\sim}{a}$ and
    $\underset{\sim}{b},$ and $\overrightarrow{BD}$ in terms of
    $\underset{\sim}{b}$ and $\underset{\sim}{c}.$

b.  What is the value of $\underset{\sim}{a} \cdot \underset{\sim}{b}?$

c.  Write $\underset{\sim}{a} \cdot \underset{\sim}{a}$ in terms of $x$.

d.  Show that
    $\left( \underset{\sim}{a} + \underset{\sim}{b} \right) \cdot \ \left( \underset{\sim}{a} + \underset{\sim}{b} \right)$
    and
    $\left( \underset{\sim}{b} + \underset{\sim}{c} \right) \cdot \ \left( \underset{\sim}{b} + \underset{\sim}{c} \right)$\
    are both equal to $x²\  + \ y².$

e.  What have we proven in part **d** about the diagonals of a
    rectangle?

$$a$$

$${\overrightarrow{AB}\  = \underset{\sim}{a},\ \overrightarrow{BC}\  = \underset{\sim}{b}\ and\ \overrightarrow{CD}\  = \underset{\sim}{c}
}{\overrightarrow{AC}\  = \ \overrightarrow{AB}\  + \ \overrightarrow{BC}
}{= \underset{\sim}{a} + \underset{\sim}{b}
}{\overrightarrow{BD}\  = \ \overrightarrow{BC}\  + \ \overrightarrow{CD}
}{= \underset{\sim}{b} + \underset{\sim}{c}}$$

$$b\ $$

$${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ \left| \underset{\sim}{a} \right|\left| \underset{\sim}{b} \right|cos\ \theta
}{\theta\ is\ the\ angle\ between\ \underset{\sim}{a}\ and\underset{\sim}{b}.\ 
}{ABCD\ is\ a\ rectangle\ hence,\ \theta\  = \ 90{^\circ}.
}{\left| \underset{\sim}{a} \right| = \ x\ and\ \left| \underset{\sim}{b} \right| = \ y
}{\underset{\sim}{a} \cdot \underset{\sim}{b} = \ x\  \times \ y\  \times \ cos\ 90{^\circ}
}{= \ 0}$$

$$c$$

$$\underset{\sim}{a} \cdot \underset{\sim}{a} = \ \left| \underset{\sim}{a} \right|^{2} = \ x^{2}$$

$$d$$

$${\left| \underset{\sim}{a} + \underset{\sim}{b} \right|^{2} = \ \left| \overrightarrow{AC} \right|^{2} = \ x^{2} + \ y^{2}\ 
}{|\overrightarrow{AC}|\  = \ \sqrt{x^{2} + \ y^{2}}
}{(a┬ \sim \  + \ b┬ \sim )\  \cdot \ (a┬ \sim \  + \ b┬ \sim )
}{= \ |a┬ \sim \  + \ b┬ \sim ||a┬ \sim \  + \ b┬ \sim |\ cos\ \theta
}{= \ \sqrt{x^{2} + \ y^{2}} \times \ \sqrt{x^{2} + \ y^{2}} \times \ cos\ 0{^\circ}
}{= \ (x²\  + \ y²)\  \times \ 1
}{= \ x^{2} + \ y^{2}}$$

$${\left| \underset{\sim}{b} + \underset{\sim}{c} \right|^{2}\  = \ |\overrightarrow{BD}|²\  = \ x²\  + \ y²
}{As\ ABCD\ is\ a\ rectangle,\ |\overrightarrow{AB}|\  = \ |\overrightarrow{CD}|.
}{|\overrightarrow{BD}|\  = \ \sqrt{x^{2} + \ y^{2}}\ 
}{\left( \underset{\sim}{b} + \underset{\sim}{c} \right) \cdot \ \left( \underset{\sim}{b} + \underset{\sim}{c} \right)
}{= \ \left| \underset{\sim}{b} + \underset{\sim}{c} \right|\left| \underset{\sim}{b} + \underset{\sim}{c} \right|cos\ \theta
}{= \ \sqrt{x^{2} + \ y^{2}} \times \ \sqrt{x^{2} + \ y^{2}} \times \ cos\ 0{^\circ}
}{= \ (x²\  + \ y²)\  \times \ 1
}{= \ x^{2} + \ y^{2}}$$

$$e$$

$$The\ diagonals\ of\ a\ rectangle\ have\ equal\ length.$$

11. ![](media/Introduction to Vectors 2_Further operations with vectors/media/image43.png){width="1.7802416885389327in"
    height="1.968503937007874in"}The square ABCD to the right has side
    length $\mathcal{l}$.

Let $\overrightarrow{AB}\  = \underset{\sim}{a}\$ and
$\overrightarrow{BC}\  = \underset{\sim}{b}$.

a.  Express $\overrightarrow{AC}$ and $\overrightarrow{BD}$ in terms of
    $\underset{\sim}{a}$ and $\underset{\sim}{b}$.

b.  What is the value of $\underset{\sim}{a} \cdot \underset{\sim}{b}$?

c.  Write $\underset{\sim}{a} \cdot \underset{\sim}{a}$ in terms of
    $\mathcal{l}$.

d.  Find
    $\left( \underset{\sim}{a} + \underset{\sim}{b} \right) \cdot \ \left( \underset{\sim}{b} - \underset{\sim}{a} \right).$

e.  What have we proven in part **d** about the diagonals of a square?

$$a$$

$${\overrightarrow{AB}\  = \underset{\sim}{a}\ and\ \overrightarrow{BC}\  = \underset{\sim}{b}
}{\overrightarrow{AC}\  = \ \overrightarrow{AB}\  + \ \overrightarrow{BC}
}{= \underset{\sim}{a} + \underset{\sim}{b}
}{\overrightarrow{BD}\  = \ \overrightarrow{AD}\  - \ \overrightarrow{AB}
}{= \underset{\sim}{b} - \underset{\sim}{a}}$$

$$b$$

$${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ \left| \underset{\sim}{a} \right|\left| \underset{\sim}{b} \right|\cos\ \theta
}{\theta\ is\ the\ angle\ between\ \underset{\sim}{a}\ and\ \underset{\sim}{b}.
}{ABCD\ is\ a\ square\ hence,\ \theta\  = \ 90{^\circ}.
}{\left| \underset{\sim}{a} \right| = \ l\ and\ \left| \underset{\sim}{b} \right| = \ l
}{\underset{\sim}{a} \cdot \underset{\sim}{b} = \ l\  \times \ l\  \times \ \cos\ 90{^\circ}
}{= \ 0}$$

$$c$$

$$\underset{\sim}{a} \cdot \underset{\sim}{a} = \ \left| \underset{\sim}{a} \right|^{2} = \ l^{2}$$

$$d$$

$${\left| \underset{\sim}{a} + \underset{\sim}{b} \right|^{2} = \ \left| \overrightarrow{AC} \right|^{2} = \ l^{2} + \ l^{2} = \ 2l^{2}
}{\left| \overrightarrow{AC} \right| = \ \sqrt{2l^{2}} = \ \sqrt{2}l\ 
}{\left| \underset{\sim}{b} - \underset{\sim}{a} \right|^{2} = \ \left| \overrightarrow{BD} \right|^{2} = \ l^{2} + \ l^{2}
}{\left| \overrightarrow{BD} \right| = \ \sqrt{2l^{2}} = \ \sqrt{2}l}$$

$${\left( \underset{\sim}{a} + \underset{\sim}{b} \right) \cdot \ \left( \underset{\sim}{b} - \underset{\sim}{a} \right)
}{= \ |a┬ \sim \  + \ b┬ \sim ||b┬ \sim \  - \ a┬ \sim |\ \cos\ \theta
}{= \ \sqrt{}2\ l\  \times \ \sqrt{}2\ l\  \times \ \cos\ 90{^\circ}
}{= \ 2l²\  \times \ 0
}{= \ 0}$$

e

The diagonals of the square meet at right angles.

12. ![](media/Introduction to Vectors 2_Further operations with vectors/media/image44.png){width="1.8631528871391076in"
    height="1.4960629921259843in"}In the diagram to the right, $OACB$ is
    a rhombus.

Let $\overrightarrow{OA}\  = \underset{\sim}{a}\$ and
$\overrightarrow{OB}\  = \underset{\sim}{b}$.

a.  Why is
    $\left| \underset{\sim}{a} \right| = \ \left| \underset{\sim}{b} \right|?$

b.  By squaring the result in part **a**, show that
    $\underset{\sim}{a} \cdot \underset{\sim}{a} = \underset{\sim}{b} \cdot \underset{\sim}{b}\ .$

c.  Express $\overrightarrow{OC}$ and $\overrightarrow{BA}\$in terms of
    $\underset{\sim}{a}$ and $\underset{\sim}{b}$.

d.  Hence show that
    $\overrightarrow{OC}\  \cdot \ \overrightarrow{BA}\  = \ 0$.

e.  What have we just proven about the diagonals of a rhombus?

$$a$$

$$\overrightarrow{OA}\  = \underset{\sim}{a}\ and\ \overrightarrow{OB}\  = \underset{\sim}{b}$$

$$\left| \underset{\sim}{a} \right| = \ \left| \underset{\sim}{b} \right|because\ the\ sides\ of\ rhombus\ are\ equal.$$

$$b$$

$${\underset{\sim}{a} \cdot \underset{\sim}{a} = \ \left| \underset{\sim}{a} \right|^{2}
}{\underset{\sim}{b} \cdot \underset{\sim}{b} = \ \left| \underset{\sim}{b} \right|^{2} = \ \left| \underset{\sim}{a} \right|^{2}as\ \left| \underset{\sim}{a} \right| = \ \left| \underset{\sim}{b} \right|
}{Hence,\underset{\sim}{a} \cdot \underset{\sim}{a} = \underset{\sim}{b} \cdot \underset{\sim}{b}.}$$

$$c$$

$${\overrightarrow{OC}\  = \ \overrightarrow{OB}\  + \ \overrightarrow{BC}
}{= \ \overrightarrow{OB}\  + \ \overrightarrow{OA}
}{= \underset{\sim}{b} + \underset{\sim}{a}
}{= \underset{\sim}{a} + \underset{\sim}{b}
}{\overrightarrow{BA}\  = \ \overrightarrow{BO}\  + \ \overrightarrow{OA}
}{= \ \overrightarrow{OA}\  - \ \overrightarrow{OB}
}{= \underset{\sim}{a} - \underset{\sim}{b}}$$

$$d$$

$${\overrightarrow{OC}\  \cdot \ \overrightarrow{BA} = \ \left( \underset{\sim}{a} + \underset{\sim}{b} \right) \cdot \ \left( \underset{\sim}{a} - \underset{\sim}{b} \right)
}{= \ \left| \underset{\sim}{a} \right|^{2} - \ \left| \underset{\sim}{b} \right|^{2}
}{= \ \left| \underset{\sim}{a} \right|^{2} - \ \left| \underset{\sim}{a} \right|^{2},\ as\ \left| \underset{\sim}{a} \right| = \ \left| \underset{\sim}{b} \right|
}{= \ 0}$$

e

Diagonals of a rhombus are perpendicular.

Mastery

13. In the diagram to the right, $OABC$ is a parallelogram whose
    diagonals $OB$ and $AC$ are equal.\
    The points A and C have respective position vectors
    $\underset{\sim}{a}$ and $\underset{\sim}{c}$ relative to O.

    a.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image45.png){width="2.0076388888888888in"
        height="1.7715277777777778in"}Explain why
        $\overrightarrow{CB}\  = \underset{\sim}{a}.$

    b.  Write $\overrightarrow{OB}$ in terms of $\underset{\sim}{c}$ and
        $\underset{\sim}{a}.$

    c.  Write $\overrightarrow{AC}$ in terms of $\underset{\sim}{c}$ and
        $\underset{\sim}{a}.$

    d.  Explain why
        $\left| \underset{\sim}{c} + \underset{\sim}{a} \right| = \ \left| \underset{\sim}{c} - \underset{\sim}{a} \right|.$

    e.  Use the result in part **d**, and the fact that
        $\left| \underset{\sim}{v} \right|^{2} = \underset{\sim}{v} \cdot \underset{\sim}{v},$\
        to show that
        $\underset{\sim}{a} \cdot \underset{\sim}{c} = \ 0$.

    f.  What can we now say about a parallelogram whose diagonals are
        equal?

$$a$$

$$The\ opposite\ sides\ of\ a\ parallelogram\ are\ equal,\ hence\ \overrightarrow{CB}\  = \underset{\sim}{a}.$$

$$b$$

$${\overrightarrow{OB}\  = \ \overrightarrow{OC}\  + \ \overrightarrow{CB}
}{= \underset{\sim}{c} + \underset{\sim}{a}}$$

$$c$$

$${\overrightarrow{AC}\  = \ \overrightarrow{AB}\  + \ \overrightarrow{BC}
}{= \ \overrightarrow{OC}\  - \ \overrightarrow{CB}
}{= \underset{\sim}{c} - \underset{\sim}{a}}$$

$$d$$

$$\left| \underset{\sim}{c} + \underset{\sim}{a} \right| = \ \left| \underset{\sim}{c} - \underset{\sim}{a} \right|because\ \left| \overrightarrow{OB} \right| = \ \left| \overrightarrow{AC} \right|\ (diagonals\ of\ this\ parallelogram\ are\ equal).$$

$$e$$

$${Since\ \left| \underset{\sim}{c} + \underset{\sim}{a} \right| = \ \left| \underset{\sim}{c} - \underset{\sim}{a} \right|,\ 
}{\left| \underset{\sim}{c} + \underset{\sim}{a} \right|^{2} = \ \left| \underset{\sim}{c} - \underset{\sim}{a} \right|^{2}
}{\left| \underset{\sim}{c} + \underset{\sim}{a} \right|^{2} - \ \left| \underset{\sim}{c} - \underset{\sim}{a} \right|^{2} = \ 0
}{\left( \underset{\sim}{c} + \underset{\sim}{a} \right) \cdot \ \left( \underset{\sim}{c} + \underset{\sim}{a} \right) - \ \left( \underset{\sim}{c} - \underset{\sim}{a} \right) \cdot \ \left( \underset{\sim}{c} - \underset{\sim}{a} \right) = \ 0
}{\underset{\sim}{c} \cdot \underset{\sim}{c} + \ 2\left( \underset{\sim}{a} \cdot \underset{\sim}{c} \right) + \underset{\sim}{a} \cdot \underset{\sim}{a} - \ \left( \underset{\sim}{c} \cdot \underset{\sim}{c} - \ 2\left( \underset{\sim}{a} \cdot \underset{\sim}{c} \right) + \underset{\sim}{a} \cdot \underset{\sim}{a} \right) = \ 0
}{\left| \underset{\sim}{c} \right|^{2} + \ 2\left( \underset{\sim}{a} \cdot \underset{\sim}{c} \right) + \ \left| \underset{\sim}{a} \right|^{2} - \ \left| \underset{\sim}{c} \right|^{2} + \ 2\left( \underset{\sim}{a} \cdot \underset{\sim}{c} \right) - \ \left| \underset{\sim}{a} \right|^{2} = \ 0
}{4\left( \underset{\sim}{a} \cdot \underset{\sim}{c} \right) = \ 0
}{\underset{\sim}{a} \cdot \underset{\sim}{c} = \ 0}$$

$$f$$

$$It\ is\ a\ rectangle\ as\ \underset{\sim}{a} \cdot \underset{\sim}{c} = \ 0$$

14. In the diagram, $O$ is the centre of a semi-circle $APB$ whose
    diameter is $AB$.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image46.png){width="2.0515748031496064in"
height="1.7716535433070866in"}Let
$\overrightarrow{OA}\  = \underset{\sim}{a}$ and
$\overrightarrow{OP}\  = \underset{\sim}{p}.$

a.  Write $\overrightarrow{OB}$ in terms of $\underset{\sim}{a}$.

b.  Express $\overrightarrow{AP}$ and $\overrightarrow{BP}$ in terms of
    $\underset{\sim}{a}$ and $\underset{\sim}{p}.$

c.  Hence prove that $\angle APB\  = \ 90{^\circ}$.

d.  What circle geometry theorem have we just proven?

$$a$$

$$\overrightarrow{OA}\  = \underset{\sim}{a}\ and\ \overrightarrow{OP}\  = \underset{\sim}{p}$$

$$Since\ \overrightarrow{AB}\ is\ the\ diameter\ and\ \overrightarrow{OB}\ is\ the\ radius\ in\ the\ opposite\ direction\ to\ \overrightarrow{OA},$$

$$\overrightarrow{OB}\  = \  - \underset{\sim}{a}\ $$

$$b$$

$${\overrightarrow{AP}\  = \ \overrightarrow{AO}\  + \ \overrightarrow{OP}
}{= \ \overrightarrow{OP}\  - \ \overrightarrow{OA}
}{= \underset{\sim}{p} - \underset{\sim}{a}
}{\overrightarrow{BP}\  = \ \overrightarrow{BO}\  + \ \overrightarrow{OP}
}{= \ \overrightarrow{OP}\  - \ \overrightarrow{OB}
}{= \underset{\sim}{p} - \ \left( - \underset{\sim}{a} \right)
}{= \underset{\sim}{p} + \underset{\sim}{a}}$$

$$c$$

$${\overrightarrow{AP}\  \cdot \ \overrightarrow{BP}\  = \ \left( \underset{\sim}{p} - \underset{\sim}{a} \right) \cdot \ \left( \underset{\sim}{p} + \underset{\sim}{a} \right)
}{= \underset{\sim}{p} \cdot \underset{\sim}{p} + \underset{\sim}{p} \cdot \underset{\sim}{a} - \underset{\sim}{a} \cdot \underset{\sim}{p} - \underset{\sim}{a} \cdot \underset{\sim}{a}
}{= \underset{\sim}{p} \cdot \underset{\sim}{p} - \underset{\sim}{a} \cdot \underset{\sim}{a}
}{= \ \left| \underset{\sim}{p} \right|^{2} - \ \left| \underset{\sim}{a} \right|^{2}
}{= \ \left| \underset{\sim}{p} \right|^{2} - \ \left| \underset{\sim}{p} \right|^{2}\ \ \ \ \ \left( since\ \overrightarrow{OA}\ and\ \overrightarrow{OP}\ are\ radii\ and\ hence\ \left| \underset{\sim}{a} \right| = \ \left| \underset{\sim}{p} \right| \right)
}{= \ 0}$$

$$Therefore,\ \overrightarrow{AP}\ and\ \overrightarrow{BP}\ are\ perpendicular.\ Hence,\ \angle APB\  = \ 90{^\circ}.$$

$$d$$

$$An\ angle\ in\ a\ semicircle\ is\ a\ right\ angle.$$

15. ![](media/Introduction to Vectors 2_Further operations with vectors/media/image47.png){width="1.8254636920384952in"
    height="1.968503937007874in"}Prove that the base angles of an
    isosceles triangle are equal.

$${Let\  \bigtriangleup OAB\ be\ isosceles\ with\ OA\  = \ OB.
}{Let\ \underset{\sim}{a}\ \  = \ \overrightarrow{AO}\ and\ \underset{\sim}{b}\  = \ \overrightarrow{OB}\ and\ \overrightarrow{AB}\  = \underset{\sim}{u}\ .
}{Then\ \underset{\sim}{u} = \underset{\sim}{a} + \underset{\sim}{b},\ so\ using\ the\ geometric\ dot\ product\ formula,
}{\left| \underset{\sim}{a} \right|\left| \underset{\sim}{u} \right|cos\ A\  = \underset{\sim}{a} \cdot \underset{\sim}{u} = \underset{\sim}{a} \cdot \ \left( \underset{\sim}{a} + \underset{\sim}{b} \right) = \underset{\sim}{a} \cdot \underset{\sim}{a} + \underset{\sim}{a} \cdot \underset{\sim}{b}
}{\left| \underset{\sim}{b} \right|\left| \underset{\sim}{u} \right|cos\ B\  = \underset{\sim}{b} \cdot \underset{\sim}{u} = \underset{\sim}{b} \cdot \ \left( \underset{\sim}{a} + \underset{\sim}{b} \right) = \underset{\sim}{b} \cdot \underset{\sim}{a} + \underset{\sim}{b} \cdot \underset{\sim}{b}
}{Subtracting,\ and\ using\ the\ fact\ that\ \left| \underset{\sim}{b} \right| = \ \left| \underset{\sim}{a} \right|,\ and\ so\ also\ that\ \underset{\sim}{a} \cdot \underset{\sim}{a} = \underset{\sim}{b} \cdot \underset{\sim}{b},
}{\left| \underset{\sim}{u} \right|\left| \underset{\sim}{a} \right|(cos\ A\  - \ cos\ B) = \ 0.
}{Hence\ cos\ A\  = \ cos\ B,\ so\ A\  = \ B\ because\ cosine\ is\ one\ to\ one\ in\ the\ interval\ \lbrack 0,\ \pi\rbrack.}$$

16. Prove, using vectors, that the diagonals of a parallelogram bisect
    each other.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image48.png){width="2.879583333333333in"
height="1.6000732720909887in"}

$$Let\ ABCD\ be\ a\ parallelogram.$$

$$Let\ \underset{\sim}{a},\underset{\sim}{b},\underset{\sim}{c}\ and\ \underset{\sim}{d}\ be\ the\ respective\ position\ vectors\ of\ A,\ B,\ C\ and\ D\ relative\ to\ an\ origin\ O.$$

$$As\ ABCD\ is\ a\ parallelogram,\ then\ opposite\ sides\ of\ the\ parallelogram\ are\ equal.$$

$$\overrightarrow{AB}\  = \ \overrightarrow{DC}$$

$$\overrightarrow{OB}\  - \ \overrightarrow{OA}\  = \ \overrightarrow{OC}\  - \ \overrightarrow{OD}$$

$$\underset{\sim}{b} - \underset{\sim}{a} = \underset{\sim}{c} - \underset{\sim}{d}$$

$$\underset{\sim}{b} + \underset{\sim}{d} = \underset{\sim}{a} + \underset{\sim}{c}$$

$$We\ can\ also\ write,$$

$$\frac{1}{2}\left( \underset{\sim}{b} + \underset{\sim}{d} \right) = \frac{1}{2}\left( \underset{\sim}{a} + \underset{\sim}{c} \right)$$

$$\frac{1}{2}\left( \overrightarrow{OB}\  + \ \overrightarrow{OD} \right) = \frac{1}{2}\left( \overrightarrow{OA}\  + \ \overrightarrow{OC} \right)$$

$$\frac{1}{2}\overrightarrow{BD}\  = \frac{1}{2}\overrightarrow{AC}$$

$$\overrightarrow{BD}\ and\ \overrightarrow{AC}\ are\ the\ diagonals\ of\ the\ parallelogram.$$

$$Hence,\ this\ shows\ that\ the\ diagonals\ of\ the\ parallelogram\ bisect\ each\ other.$$

# Vector Projection

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** horizontal and vertical projection                                                                                                                                                                                                                                                                                                                  |
+=====================================================================================================================+=====================================================================================================================+=========================================================================================================================+
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image49.png){width="0.4215277777777778in" height="0.475in"}Consider the vector $\overset{̰}{a}$.                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                                                                     |
| +---------------------------------------------------------------------------------------------------------------------+--------------------------------------+                                                                                                                                                                                                      |
| | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image50.png){width="2.3229024496937885in" | If a light shines directly down onto |                                                                                                                                                                                                      |
| | height="1.7101377952755905in"}                                                                                      | vector $\overset{̰}{a}$, the          |                                                                                                                                                                                                      |
| |                                                                                                                     | .................. it casts on the   |                                                                                                                                                                                                      |
| |                                                                                                                     | $x$-axis is called the horizontal    |                                                                                                                                                                                                      |
| |                                                                                                                     | .................. of                |                                                                                                                                                                                                      |
| |                                                                                                                     | $\overset{̰}{a}$.                     |                                                                                                                                                                                                      |
| |                                                                                                                     |                                      |                                                                                                                                                                                                      |
| |                                                                                                                     | This is also called the projection   |                                                                                                                                                                                                      |
| |                                                                                                                     | of ...... onto .......               |                                                                                                                                                                                                      |
| |                                                                                                                     |                                      |                                                                                                                                                                                                      |
| |                                                                                                                     | This is also the horizontal          |                                                                                                                                                                                                      |
| |                                                                                                                     | component of $\overset{̰}{a}$.        |                                                                                                                                                                                                      |
| +=====================================================================================================================+======================================+                                                                                                                                                                                                      |
| | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image51.png){width="2.3125in"             | If a light shines sideways onto      |                                                                                                                                                                                                      |
| | height="1.6736111111111112in"}                                                                                      | vector $\overset{̰}{a}$, the shadow   |                                                                                                                                                                                                      |
| |                                                                                                                     | it casts on the ...... axis is       |                                                                                                                                                                                                      |
| |                                                                                                                     | called the ...............           |                                                                                                                                                                                                      |
| |                                                                                                                     | projection of $\overset{̰}{a}$.       |                                                                                                                                                                                                      |
| |                                                                                                                     |                                      |                                                                                                                                                                                                      |
| |                                                                                                                     | This is also called the projection   |                                                                                                                                                                                                      |
| |                                                                                                                     | of ...... onto .......               |                                                                                                                                                                                                      |
| |                                                                                                                     |                                      |                                                                                                                                                                                                      |
| |                                                                                                                     | This is also the ...............     |                                                                                                                                                                                                      |
| |                                                                                                                     | vertical of $\overset{̰}{a}$.         |                                                                                                                                                                                                      |
| +---------------------------------------------------------------------------------------------------------------------+--------------------------------------+                                                                                                                                                                                                      |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Sketch these projections. The first has been done for you.                                                                                                                                                                                                                                                                                                          |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| a.  Vertical projection                                                                                             | b.  Horizontal projection                                                                                           | c.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image54.png){width="0.8611111111111112in" |
|                                                                                                                     |                                                                                                                     |     height="0.9708333333333333in"}Horizontal projection                                                                 |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image52.png){width="0.8181889763779527in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image53.png){width="0.7909722222222222in" |                                                                                                                         |
| height="0.8385422134733158in"}                                                                                      | height="0.8381944444444445in"}                                                                                      |                                                                                                                         |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| d.  Vertical projection                                                                                             | e.  Vertical projection                                                                                             | f.  Horizontal projection                                                                                               |
|                                                                                                                     |                                                                                                                     |                                                                                                                         |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image54.png){width="0.8611111111111112in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image55.png){width="0.8611111111111112in" | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image55.png){width="0.8611111111111112in"     |
| height="0.9708333333333333in"}                                                                                      | height="0.94375in"}                                                                                                 | height="0.94375in"}                                                                                                     |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** vector projection                                                                                                                                                                                                                                                                                                                                                                |
+=========================================================================================================================+==================================================================================================================================================+=====================================================================================================================+
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image49.png){width="0.4215277777777778in" height="0.475in"}Consider the vector $\overset{̰}{a}$.                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                                                                                  |
| +---------------------------------------------------------------------------------------------------------------------+--------------------------------------+                                                                                                                                                                                                                                   |
| | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image56.png){width="1.7730785214348206in" | If a light shines perpendicular to   |                                                                                                                                                                                                                                   |
| | height="1.4404768153980751in"}                                                                                      | another vector $\overset{̰}{b}$, the  |                                                                                                                                                                                                                                   |
| |                                                                                                                     | shadow $\overset{̰}{a}$ casts onto    |                                                                                                                                                                                                                                   |
| |                                                                                                                     | vector $\overset{̰}{b}$ is called the |                                                                                                                                                                                                                                   |
| |                                                                                                                     | projection of ...... onto .........  |                                                                                                                                                                                                                                   |
| |                                                                                                                     |                                      |                                                                                                                                                                                                                                   |
| |                                                                                                                     | This is the component of ...... in   |                                                                                                                                                                                                                                   |
| |                                                                                                                     | the direction of ......              |                                                                                                                                                                                                                                   |
| +=====================================================================================================================+======================================+                                                                                                                                                                                                                                   |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Sketch these projections. The first has been done for you.                                                                                                                                                                                                                                                                                                                                       |
+-------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| a.  Projection of $\overset{̰}{a}$ onto $\overset{̰}{b}$                                                                  | b.  Projection of $\overset{̰}{a}$ onto $\overset{̰}{b}$                                                                                           | c.  Projection of $\overset{̰}{b}$ onto $\overset{̰}{a}$                                                              |
|                                                                                                                         |                                                                                                                                                  |                                                                                                                     |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image57.png){width="1.0666666666666667in"     |                                                                                                                                                  | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image58.png){width="1.7109383202099737in" |
| height="1.211111111111111in"}                                                                                           |                                                                                                                                                  | height="0.8381944444444445in"}                                                                                      |
|                                                                                                                         |                                                                                                                                                  |                                                                                                                     |
|                                                                                                                         |                                                                                                                                                  | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image58.png){width="1.7109383202099737in" |
|                                                                                                                         |                                                                                                                                                  | height="0.8381944444444445in"}                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| d.  Projection of $\overset{̰}{a}$ onto $\overset{̰}{b}$                                                                  | e.  Projection of $\overset{̰}{b}$ onto $\overset{̰}{a}$                                                                                           | f.  Projection of $\overset{̰}{a}$ onto $\overset{̰}{b}$                                                              |
|                                                                                                                         |                                                                                                                                                  |                                                                                                                     |
|                                                                                                                         | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image59.png){width="1.1090277777777777in"                              |                                                                                                                     |
|                                                                                                                         | height="1.2909722222222222in"}![](media/Introduction to Vectors 2_Further operations with vectors/media/image59.png){width="1.109374453193351in" |                                                                                                                     |
|                                                                                                                         | height="1.2912390638670166in"}                                                                                                                   |                                                                                                                     |
+-------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| g.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image60.png){width="1.4666666666666666in" | h.  Projection of $\overset{̰}{a}$ onto $\overset{̰}{b}$                                                                                           | i.  Projection of $\overset{̰}{b}$ onto $\overset{̰}{a}$                                                              |
|     height="0.9863484251968504in"}Projection of $\overset{̰}{b}$ onto $\overset{̰}{a}$                                    |                                                                                                                                                  |                                                                                                                     |
|                                                                                                                         | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image61.png){width="0.5888888888888889in"                              | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image61.png){width="0.5888888888888889in" |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image60.png){width="1.4666666666666666in"     | height="1.604313210848644in"}                                                                                                                    | height="1.604313210848644in"}                                                                                       |
| height="0.9863484251968504in"}                                                                                          |                                                                                                                                                  |                                                                                                                     |
+-------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------+
| - **Vector Projection**                                                                                            |
+====================================================================================================================+
| ${proj}_{\overset{̰}{b}}\overset{̰}{a}$ is a **vector**.                                                             |
|                                                                                                                    |
| ${proj}_{\overset{̰}{b}}\overset{̰}{a}$ means the "projection of $\overset{̰}{a}$ onto $\overset{̰}{b}$"               |
|                                                                                                                    |
| ${proj}_{\overset{̰}{b}}\overset{̰}{a}$ is the "shadow" of $\overset{̰}{a}$ cast onto the line containing             |
| $\overset{̰}{b}$.                                                                                                   |
|                                                                                                                    |
| ${proj}_{\overset{̰}{b}}\overset{̰}{a}$ is the component of $\overset{̰}{a}$ parallel to $\overset{̰}{b}$.             |
|                                                                                                                    |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image62.png){width="4.166666666666667in" |
| height="1.407584208223972in"}                                                                                      |
+--------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Vector Projection Formula**                                                                                                                                                         |
+=========================================================================================================================================================================================+
| $\ {proj}_{\overset{̰}{b}}\overset{̰}{a}$ means the "projection of $\overset{̰}{a}$ onto $\overset{̰}{b}$"                                                                                  |
|                                                                                                                                                                                         |
| $${{proj}_{\overset{̰}{b}}\overset{̰}{a} = \left( \frac{\overset{̰}{a} \cdot \overset{̰}{b}}{\left| \overset{̰}{b} \right|^{2}} \right)\overset{̰}{b}                                         |
| }{= \left( \overset{̰}{a} \cdot \widehat{\overset{̰}{b}} \right)\widehat{\overset{̰}{b}}\ \ \ \ \ \ using\ \widehat{\overset{̰}{b}} = \frac{\overset{̰}{b}}{\left| \overset{̰}{b} \right|}}$$ |
|                                                                                                                                                                                         |
| - Column notation is generally neater when working with vector projections.                                                                                                             |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate vector projection.                                                                                                       |
+==================================================================================================================================================+
| $\overset{̰}{a} = \left( \begin{array}{r}                                                                                                         |
| 2 \\                                                                                                                                             |
| 3                                                                                                                                                |
| \end{array} \right),\ \overset{̰}{b} = \left( \begin{array}{r}                                                                                    |
|  - 3 \\                                                                                                                                          |
| 5                                                                                                                                                |
| \end{array} \right)$. Find ${proj}_{\overset{̰}{b}}\overset{̰}{a}\$and check your answer using the diagram.                                        |
|                                                                                                                                                  |
| $${proj}_{\overset{̰}{b}}\overset{̰}{a} = \left( \frac{\overset{̰}{a} \cdot \overset{̰}{b}}{\left| \overset{̰}{b} \right|^{2}} \right)\overset{̰}{b}$$ |
|                                                                                                                                                  |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \  = \left( \frac{(2)( - 3) + (3)(5)}{( - 3)^{2} + 5^{2}} \right)\left( \begin{array}{r}                             |
|  - 3 \\                                                                                                                                          |
| 5                                                                                                                                                |
| \end{array} \right)$$                                                                                                                            |
|                                                                                                                                                  |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{9}{34}\left( \begin{array}{r}                                                                             |
|  - 3 \\                                                                                                                                          |
| 5                                                                                                                                                |
| \end{array} \right)$$                                                                                                                            |
|                                                                                                                                                  |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image63.png){width="1.6111111111111112in"                              |
| height="1.6194160104986877in"}                                                                                                                   |
+--------------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                      |
+=====================================================================================================================+
| $\overset{̰}{u} = 5\mathbf{i} - 12\mathbf{j},\ \overset{̰}{v} = 4\mathbf{i} + 3\mathbf{j}$. Find                      |
| ${proj}_{\overset{̰}{u}}\overset{̰}{v}$.                                                                              |
|                                                                                                                     |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image64.png){width="0.766259842519685in"  |
| height="2.1749759405074367in"}                                                                                      |
|                                                                                                                     |
| $$- \frac{16}{169}\left( \begin{array}{r}                                                                           |
| 5 \\                                                                                                                |
|  - 12                                                                                                               |
| \end{array} \right)$$                                                                                               |
+---------------------------------------------------------------------------------------------------------------------+
| - **Proof** of vector projection formula                                                                            |
+---------------------------------------------------------------------------------------------------------------------+
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image65.png){width="1.1111111111111112in" |
| height="1.393442694663167in"}Consider the diagram. Our goal is to find a formula for                                |
| ${proj}_{\overset{̰}{b}}\overset{̰}{a}$.                                                                              |
|                                                                                                                     |
| Let the angle between the vectors be $\theta$.                                                                      |
|                                                                                                                     |
| Using right-angled trigonometry, relate the three sides of the triangle:                                            |
|                                                                                                                     |
| $$\cos\theta = \frac{|\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ |}{|\ \ \ \ \ |}$$                                              |
|                                                                                                                     |
| Using the dot product formula, we can write another formula for $\cos\theta:$                                       |
|                                                                                                                     |
| $$\cos\theta =$$                                                                                                    |
|                                                                                                                     |
| By equating the two formulas for $\cos\theta,$ we can derive the formula for ${proj}_{\overset{̰}{b}}\overset{̰}{a}$. |
+---------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------+
| - **Perpendicular Component Formula**                                                                               |
+=====================================================================================================================+
| To find the component of $\overset{̰}{a}$ **perpendicular** to $\overset{̰}{b}$, subtract the projection from         |
| $\overset{̰}{a}$:                                                                                                    |
|                                                                                                                     |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image66.png){width="3.9143963254593177in" |
| height="1.4055555555555554in"}Perpendicular component = $\overset{̰}{a} - {proj}_{\overset{̰}{b}}\overset{̰}{a}$       |
|                                                                                                                     |
| - Check your answer by factorising and using $\left( \begin{array}{r}                                               |
|   x \\                                                                                                              |
|   y                                                                                                                 |
|   \end{array} \right)\bot\lambda\left( \begin{array}{r}                                                             |
|    - y \\                                                                                                           |
|   x                                                                                                                 |
|   \end{array} \right)\ or\ \lambda\left( \begin{array}{r}                                                           |
|   y \\                                                                                                              |
|    - x                                                                                                              |
|   \end{array} \right)$                                                                                              |
|                                                                                                                     |
| - This is also called the **vector rejection** of $\overset{̰}{a}$ from $\overset{̰}{b}$.                             |
+---------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------+
| - **Example** Find perpendicular component.                                                                |
+============================================================================================================+
| Find the component of $\overset{̰}{a} = 5\mathbf{i} + 2\mathbf{j}$ perpendicular to                         |
| $\overset{̰}{b} = 4\mathbf{i +}3\mathbf{j}$                                                                 |
|                                                                                                            |
| $${proj}_{\overset{̰}{b}}\overset{̰}{a} = \frac{(5)(4) + (2)(3)}{4^{2} + 3^{2}}\left( \begin{array}{r}       |
| 4 \\                                                                                                       |
| 3                                                                                                          |
| \end{array} \right)$$                                                                                      |
|                                                                                                            |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{26}{25}\left( \begin{array}{r}                                      |
| 4 \\                                                                                                       |
| 3                                                                                                          |
| \end{array} \right)$$                                                                                      |
|                                                                                                            |
| $$Perp\ component = \left( \begin{array}{r}                                                                |
| 5 \\                                                                                                       |
| 2                                                                                                          |
| \end{array} \right) - \frac{26}{25}\left( \begin{array}{r}                                                 |
| 4 \\                                                                                                       |
| 3                                                                                                          |
| \end{array} \right)$$                                                                                      |
|                                                                                                            |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \left( \begin{array}{r}             |
| \frac{21}{25} \\                                                                                           |
|  - \frac{28}{25}                                                                                           |
| \end{array} \right)$$                                                                                      |
|                                                                                                            |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{7}{25}\left( \begin{array}{r} |
| 3 \\                                                                                                       |
|  - 4                                                                                                       |
| \end{array} \right)\ $$                                                                                    |
|                                                                                                            |
| Notice that $\left( \begin{array}{r}                                                                       |
| 4 \\                                                                                                       |
| 3                                                                                                          |
| \end{array} \right)$ and $\left( \begin{array}{r}                                                          |
| 3 \\                                                                                                       |
|  - 4                                                                                                       |
| \end{array} \right)$ are perpendicular vectors.                                                            |
+------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Practice**                                                    |
+===================================================================+
| Find the component of $\overset{̰}{a} = 7\mathbf{i} + \mathbf{j}$  |
| perpendicular to $\overset{̰}{b} = 4\mathbf{i} + 3\mathbf{j}$      |
|                                                                   |
| $$\frac{17}{25}\left( \begin{array}{r}                            |
| 3 \\                                                              |
|  - 4                                                              |
| \end{array} \right)$$                                             |
+-------------------------------------------------------------------+

Foundation

1.  Given $\underset{\sim}{a} = \ \left( \begin{array}{r}
    7 \\
     - 4
    \end{array} \right)$ and
    $\underset{\sim}{b} = \ \left( \begin{array}{r}
    12 \\
    6
    \end{array} \right),$ find:

+--------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $proj_{\mathbf{b}}\mathbf{a}\$                                                                                                                     | b.  $proj_{\mathbf{a}}\mathbf{b}\$                                                                                                                          |
|                                                                                                                                                        |                                                                                                                                                             |
| $${proj_{\mathbf{b}}\mathbf{a} = \left( \frac{\underset{\sim}{a} \cdot \underset{\sim}{b}}{\left| \underset{\sim}{b} \right|^{2}} \right)\overset{̰}{b} | $${proj_{\mathbf{a}}\mathbf{b} = \left( \frac{\underset{\sim}{b} \cdot \underset{\sim}{a}}{\left| \underset{\sim}{a} \right|^{2}} \right)\underset{\sim}{a} |
| }{\underset{\sim}{a} \cdot \underset{\sim}{b} = \ 7(12) + \ ( - 4)(6) = \ 60                                                                           | }{\left| \underset{\sim}{a} \right|^{2} = \ 49\  + \ 16\  = \ 65                                                                                            |
| }{\left| \underset{\sim}{b} \right|^{2} = \ 144\  + \ 36\  = \ 180                                                                                     | }{proj_{\mathbf{a}}\mathbf{b}\  = \ \left( \frac{60}{65} \right)\left( \begin{array}{r}                                                                     |
| }{proj_{\mathbf{b}}\mathbf{a}\  = \ \left( \frac{60}{180} \right)\left( \begin{array}{r}                                                               | 7 \\                                                                                                                                                        |
| 12 \\                                                                                                                                                  |  - 4                                                                                                                                                        |
| 6                                                                                                                                                      | \end{array} \right)}$$                                                                                                                                      |
| \end{array} \right) = \ \left( \begin{array}{r}                                                                                                        |                                                                                                                                                             |
| 4 \\                                                                                                                                                   |                                                                                                                                                             |
| 2                                                                                                                                                      |                                                                                                                                                             |
| \end{array} \right)}$$                                                                                                                                 |                                                                                                                                                             |
+========================================================================================================================================================+=============================================================================================================================================================+

2.  Find $proj_{\mathbf{u}}\mathbf{v}\$given:

+---------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $\underset{\sim}{u} = \ \left( \begin{array}{r}                                   | b.  $\underset{\sim}{u} = \  - 3i\  - \ 2j\$                                                                                                             |
|     3 \\                                                                              |                                                                                                                                                          |
|     6                                                                                 | $$\underset{\sim}{v} = \ 4i\  - \ 19j$$                                                                                                                  |
|     \end{array} \right)$                                                              |                                                                                                                                                          |
|                                                                                       | $${\underset{\sim}{u} \cdot \underset{\sim}{v} = \ ( - 3)(4) + \ ( - 2)( - 19) = \ 26                                                                    |
| $$\underset{\sim}{v} = \ \left( \begin{array}{r}                                      | }{\left| \underset{\sim}{u} \right|^{2} = \ 9\  + \ 4\  = \ 13                                                                                           |
|  - 2 \\                                                                               | }{proj_{\mathbf{u}}\mathbf{v} = \ \left( \frac{26}{13} \right)\left( - 3\mathbf{i} \sim \  - \ 2\mathbf{j} \right) = \  - 6\mathbf{i} - \ 4\mathbf{j}}$$ |
| 6                                                                                     |                                                                                                                                                          |
| \end{array} \right)$$                                                                 |                                                                                                                                                          |
|                                                                                       |                                                                                                                                                          |
| $${\underset{\sim}{u} \cdot \underset{\sim}{v} = \ 3( - 2) + \ 6(6) = \ 30            |                                                                                                                                                          |
| }{\left| \underset{\sim}{u} \right|^{2} = \ 9\  + \ 36\  = \ 45                       |                                                                                                                                                          |
| }{proj_{\mathbf{u}}\mathbf{v} = \ \left( \frac{30}{45} \right)\left( \begin{array}{r} |                                                                                                                                                          |
| 3 \\                                                                                  |                                                                                                                                                          |
| 6                                                                                     |                                                                                                                                                          |
| \end{array} \right) = \ \left( \begin{array}{r}                                       |                                                                                                                                                          |
| 2 \\                                                                                  |                                                                                                                                                          |
| 4                                                                                     |                                                                                                                                                          |
| \end{array} \right)}$$                                                                |                                                                                                                                                          |
+=======================================================================================+==========================================================================================================================================================+

3.  Given $\underset{\sim}{u} = \ \left( \begin{array}{r}
    2 \\
    1
    \end{array} \right)$ and
    $\underset{\sim}{v} = \ \left( \begin{array}{r}
    3 \\
     - 4
    \end{array} \right),$ find:

+---------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $proj_{\mathbf{v}}\mathbf{u}\$                                                                                                                            | b.  $proj_{\mathbf{u}}\mathbf{v}\$                                                                                                                         |
|                                                                                                                                                               |                                                                                                                                                            |
| $${proj_{\mathbf{v}}\mathbf{u}\  = \left( \frac{\underset{\sim}{u} \cdot \underset{\sim}{v}}{\left| \underset{\sim}{v} \right|^{2}} \right)\underset{\sim}{v} | $${proj_{\mathbf{u}}\mathbf{v =}\underset{\sim}{\left( \frac{\underset{\sim}{v} \cdot \underset{\sim}{u}}{\left| \underset{\sim}{u} \right|^{2}} \right)u} |
| }{\underset{\sim}{u} \cdot \underset{\sim}{v} = \ 2(3) + \ 1( - 4) = \ 2                                                                                      | }{\left| \underset{\sim}{u} \right|^{2} = \ 4\  + \ 1\  = \ 5                                                                                              |
| }{\left| \underset{\sim}{v} \right|^{2} = \ 9\  + \ 16\  = \ 25                                                                                               | }{proj_{\mathbf{u}}\mathbf{v}\  = \ \left( \frac{2}{5} \right)\left( \begin{array}{r}                                                                      |
| }{proj_{\mathbf{v}}\mathbf{u}\  = \ \left( \frac{2}{25} \right)\left( \begin{array}{r}                                                                        | 2 \\                                                                                                                                                       |
| 3 \\                                                                                                                                                          | 1                                                                                                                                                          |
|  - 4                                                                                                                                                          | \end{array} \right) = \ \left( \begin{array}{r}                                                                                                            |
| \end{array} \right) = \ \left( \begin{array}{r}                                                                                                               | 0.8 \\                                                                                                                                                     |
| 0.24 \\                                                                                                                                                       | 0.4                                                                                                                                                        |
|  - 0.32                                                                                                                                                       | \end{array} \right)}$$                                                                                                                                     |
| \end{array} \right)}$$                                                                                                                                        |                                                                                                                                                            |
+===============================================================================================================================================================+============================================================================================================================================================+
| c.  $|\ proj_{\mathbf{v}}\mathbf{u}\ |$                                                                                                                       | d.  The direction of $proj_{\mathbf{v}}\mathbf{u}\$                                                                                                        |
|                                                                                                                                                               |                                                                                                                                                            |
| $$\sqrt{{0.24}^{2} + \ {0.32}^{2}} = \ 0.4$$                                                                                                                  | $${\tan^{- 1}\left( - \frac{0.32}{0.24} \right) = \ \tan^{- 1}\left( - \frac{4}{3} \right)\ in\ Q4                                                         |
|                                                                                                                                                               | }{\theta\  = \ 360{^\circ}\  - \ 53{^\circ}\  = \ 307{^\circ}}$$                                                                                           |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+

4.  Find the projection of $\underset{\sim}{a}$ onto
    $\underset{\sim}{b}$ if:

+-----------------------------------------------------------+------------------------------------------------------------+----------------------------------------------------------------+
| a.  $\underset{\sim}{a} = \ \mathbf{i}\  + \ \mathbf{j},$ | b.  $\underset{\sim}{a} = \ \mathbf{i}\  + \ 2\mathbf{j},$ | c.  $\underset{\sim}{a} = \  - 3\mathbf{i\ } + \ 2\mathbf{j},$ |
|                                                           |                                                            |                                                                |
| $$\underset{\sim}{b} = \mathbf{\ i}$$                     | $$\underset{\sim}{b} = \ \mathbf{j}$$                      | $$\underset{\sim}{b} = \ \mathbf{i}$$                          |
|                                                           |                                                            |                                                                |
| $$\underset{\sim}{i}$$                                    | $$2\underset{\sim}{j}$$                                    | $$- 3\underset{\sim}{i}$$                                      |
+===========================================================+============================================================+================================================================+

5.  Find the projection of $\underset{\sim}{a}$ onto
    $\underset{\sim}{b}$ if:

+----------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------+
| a.  $\underset{\sim}{a} = \ \left( \begin{array}{r}                              | b.  $\underset{\sim}{a} = \ 3\mathbf{i} + \ 3\mathbf{j}$                                                                    | c.  $\underset{\sim}{a} = \ \left( \begin{array}{r}                                         |
|     2 \\                                                                         |                                                                                                                             |     5 \\                                                                                    |
|     1                                                                            | $$\underset{\sim}{b} = \ 2\mathbf{j}\ $$                                                                                    |      - 3                                                                                    |
|     \end{array} \right),\underset{\sim}{b} = \ \left( \begin{array}{r}           |                                                                                                                             |     \end{array} \right),\underset{\sim}{b} = \ \left( \begin{array}{r}                      |
|     4 \\                                                                         | $${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ 3(0) + \ 3(2) = \ 6                                                      |      - 6 \\                                                                                 |
|     0                                                                            | }{\left| \underset{\sim}{b} \right|^{2} = \ 4                                                                               |     0                                                                                       |
|     \end{array} \right)$                                                         | }{proj_{\mathbf{b}}\mathbf{a}\  = \ \left( \frac{6}{4} \right)\left( \underset{\sim}{2j} \right) = \underset{\sim}{3j}\ }$$ |     \end{array} \right)$                                                                    |
|                                                                                  |                                                                                                                             |                                                                                             |
| $${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ 2(4) + \ 1(0) = \ 8           |                                                                                                                             | $${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ 5( - 6) + \ ( - 3)(0) = \  - 30          |
| }{\left| \underset{\sim}{b} \right|^{2} = \ 16                                   |                                                                                                                             | }{\left| \underset{\sim}{b} \right|^{2} = \ 36                                              |
| }{proj_{\mathbf{b}}\mathbf{a}\  = \ (8/16)(█(4@0))\  = \ \left( \begin{array}{r} |                                                                                                                             | }{proj_{\mathbf{b}}\mathbf{a}\ \  = \ \left( - \frac{30}{36} \right)\left( \begin{array}{r} |
| 2 \\                                                                             |                                                                                                                             |  - 6 \\                                                                                     |
| 0                                                                                |                                                                                                                             | 0                                                                                           |
| \end{array} \right)}$$                                                           |                                                                                                                             | \end{array} \right) = \left( \begin{array}{r}                                               |
|                                                                                  |                                                                                                                             | 5 \\                                                                                        |
|                                                                                  |                                                                                                                             | 0                                                                                           |
|                                                                                  |                                                                                                                             | \end{array} \right)}$$                                                                      |
+==================================================================================+=============================================================================================================================+=============================================================================================+

6.  Use trigonometry to find the length of the projection of
    $\overrightarrow{OA}$ onto $\overrightarrow{OB}$ if:\
    Hint: draw a diagram.

+---------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------+
| a.  $|\overrightarrow{OA}|\  = \ 6$ and ∠AOB = 30°                                                                        | b.  $|\overrightarrow{OA}|\  = \ 6\sqrt{6}$ and ∠AOB = 45°                                                                        |
|                                                                                                                           |                                                                                                                                   |
| $$\left| \overrightarrow{OA} \right|\cos\ 30{^\circ}\  = \ 6\  \times \ \left( \frac{\sqrt{3}}{2} \right) = \ 3\sqrt{3}$$ | $$\ 6\sqrt{6} \times \ \cos\ 45{^\circ}\  = \ 6\sqrt{6} \times \ \left( \frac{\sqrt{2}}{2} \right) = \ 3\sqrt{12} = \ 6\sqrt{3}$$ |
+===========================================================================================================================+===================================================================================================================================+

7.  Show that the projection of
    $\underset{\sim}{a} = \ \left( \begin{array}{r}
    10 \\
     - 2
    \end{array} \right)$ onto
    $\underset{\sim}{b} = \ \left( \begin{array}{r}
    1 \\
     - 7
    \end{array} \right)$ has length $\frac{12\sqrt{2}}{5}\$.

$${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ 10(1) + \ ( - 2)( - 7) = \ 24
}{\left| \underset{\sim}{b} \right| = \ \sqrt{50} = \ 5\sqrt{2}
}{\left| {proj}_{\mathbf{b}}\mathbf{a} \right| = \frac{\left| \underset{\sim}{a} \cdot \underset{\sim}{b} \right|}{\left| \underset{\sim}{b} \right|} = \frac{24}{5\sqrt{2}} = \frac{24\sqrt{2}}{10} = \frac{12\sqrt{2}}{5}}$$

8.  Find the component of $\underset{\sim}{a}$ in the direction of
    $\underset{\sim}{b}$ if:

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $\underset{\sim}{a} = \mathbf{\ i}\  + \ \mathbf{j},\underset{\sim}{b} = \ 3\mathbf{i}\  + \ \mathbf{j}$                                                                                                            | b.  $\underset{\sim}{a} = \ 4\mathbf{i}\  - \ 3\mathbf{j},\underset{\sim}{b} = \ 6\mathbf{i}\  + \ 2\mathbf{j}$                                                                                                                                                                                                      |
|                                                                                                                                                                                                                         |                                                                                                                                                                                                                                                                                                                      |
| $${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ 1(3) + \ 1(1) = \ 4                                                                                                                                                  | $${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ 4(6) + \ ( - 3)(2) = \ 18                                                                                                                                                                                                                                         |
| }{\left| \underset{\sim}{b} \right|^{2} = \ 10                                                                                                                                                                          | }{\left| \underset{\sim}{b} \right|^{2} = \ 40                                                                                                                                                                                                                                                                       |
| }{{proj}_{\mathbf{b}}\mathbf{a} = \ \left( \frac{4}{10} \right)\left( \underset{\sim}{3i} + \underset{\sim}{j} \right) = \underset{\sim}{\left( \frac{6}{5} \right)i} + \underset{\sim}{\left( \frac{2}{5} \right)j}}$$ | }{{proj}_{\mathbf{b}}\mathbf{a} = \ \left( \frac{18}{40} \right)\left( \underset{\sim}{6i} + \underset{\sim}{2j} \right) = \ \left( \frac{9}{20} \right)\left( \underset{\sim}{6i} + \underset{\sim}{2j} \right) = \underset{\sim}{\left( \frac{27}{10} \right)i} + \underset{\sim}{\left( \frac{9}{10} \right)j}}$$ |
+=========================================================================================================================================================================================================================+======================================================================================================================================================================================================================================================================================================================+

Development

9.  Find the magnitude of $\underset{\sim}{a}$ in the direction of
    $\underset{\sim}{b}$ if:

+-----------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------+
| a.  $\underset{\sim}{a} = \  - 2\mathbf{i},\underset{\sim}{b} = \  - 3\mathbf{i}\  - \ 2\mathbf{j}$ | b.  $\underset{\sim}{a} = \ 6\mathbf{i\ } - \ 4\mathbf{j},\underset{\sim}{b} = \  - 3\mathbf{i}\  + \ 6\mathbf{j}$ |
|                                                                                                     |                                                                                                                    |
| $${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ ( - 2)( - 3) + \ 0( - 2) = \ 6                   | $${\underset{\sim}{a} \cdot \underset{\sim}{b} = \ 6( - 3) + \ ( - 4)(6) = \  - 18\  - \ 24\  = \  - 42            |
| }{\left| \underset{\sim}{b} \right| = \ \sqrt{13}                                                   | }{\left| \underset{\sim}{b} \right| = \ \sqrt{45} = \ 3\sqrt{5}                                                    |
| }{\left| {proj}_{\mathbf{b}}\mathbf{a} \right| = \frac{6}{\sqrt{13}}}$$                             | }{\left| {proj}_{\mathbf{b}}\mathbf{a} \right| = \frac{| - 42|}{3\sqrt{5}} = \frac{14}{\sqrt{5}}}$$                |
+=====================================================================================================+====================================================================================================================+

10. Find the projection of $\overrightarrow{AB}$ onto
    $- 6\mathbf{i} + 4\mathbf{j}\$given $A( - 3,\  - 7)$ and $B(1,\ 5)$.

$${\overrightarrow{AB}\  = \ (1 - ( - 3),\ 5 - ( - 7))\  = \ (4,\ 12)
}{\underset{\sim}{b} = \  - - 6\mathbf{i} + 4\mathbf{j}
}{\overrightarrow{AB}\  \cdot \underset{\sim}{b} = \ 4( - 6) + \ 12(4) = \  - 24\  + \ 48\  = \ 24
}{\left| \underset{\sim}{b} \right|^{2} = \ 36\  + \ 16\  = \ 52
}{{proj}_{\mathbf{b}}\overrightarrow{AB}\ \ \  = \ \left( \frac{24}{52} \right)\left( - 6\mathbf{i} + 4\mathbf{j} \right) = \ \left( \frac{6}{13} \right)\left( - 6\mathbf{i} + 4\mathbf{j} \right) = \  - \left( \frac{36}{13} \right)\mathbf{i} + \left( \frac{24}{13} \right)\mathbf{j}}$$

11. Find the length of the projection of $\overrightarrow{AB}$ onto
    $\overrightarrow{CD}$ given $A(1,\ 3),\ B(6,\ 18),\ C(9,\ 4)$ and
    $D(19,\ 24)$.

$${\overrightarrow{AB}\  = \ (5,\ 15),\ \overrightarrow{CD}\  = \ (10,\ 20)
}{\overrightarrow{AB}\  \cdot \ \overrightarrow{CD}\  = \ 50\  + \ 300\  = \ 350
}{\left| \overrightarrow{CD} \right| = \ \sqrt{500} = \ 10\sqrt{5}
}{\left| {proj}_{\overrightarrow{CD}}\overrightarrow{AB}\  \right|\  = \frac{350}{10\sqrt{5}} = \frac{35}{\sqrt{5}} = \ 7\sqrt{5}}$$

12. Find the possible values of $\lambda$ if the projection of
    $\lambda\mathbf{i} + \ 4\mathbf{j}$ onto
    $12\mathbf{i} - \ 5\mathbf{j}$ has length $\frac{140}{13}$.

$${proj\ of\ \lambda\mathbf{i} + 4\mathbf{j}\ onto\ 12\mathbf{i} - 5\mathbf{j}
}{Dot\ product\  = \ 12\lambda\  - \ 20
}{\left| 12\mathbf{i} - 5\mathbf{j} \right|\  = \ 13\ 
}{|proj| = \frac{|12\lambda\  - \ 20|}{13} = \frac{140}{13}
}{|12\lambda\  - \ 20| = \ 140
}{12\lambda\  - \ 20\  = \ 140\ or\ 12\lambda\  - \ 20\  = \  - 140
}{12\lambda\  = \ 160\ or\ 12\lambda\  = \  - 120
}{\lambda\  = \frac{40}{3}or\  - 10}$$

Mastery

13. a.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image67.png){width="1.4885061242344706in"
        height="1.5062270341207349in"}Given vectors $\overset{̰}{a}$ and
        $\overset{̰}{b}$ with angle $\theta$ between them and
        $\left| \overset{̰}{a} \right| = r$,\
        prove, using the vector projection and dot product formulas,
        that the magnitude of the component of vector $\overset{̰}{a}$
        parallel $\overset{̰}{b}$, $|proj_{\mathbf{b}}\mathbf{a|}$, is
        $r\cos\theta$.

$${proj_{\mathbf{b}}\mathbf{a}\  = \left( \frac{\underset{\sim}{a} \cdot \underset{\sim}{b}}{\left| \underset{\sim}{b} \right|^{2}} \right)\underset{\sim}{b}
}{\left| proj_{\mathbf{b}}\mathbf{a}\  \right| = \ \left| \frac{\underset{\sim}{a} \cdot \underset{\sim}{b}}{\left| \underset{\sim}{b} \right|^{2}} \right| \times \ \left| \underset{\sim}{b} \right|
}{= \frac{\left| \underset{\sim}{a} \cdot \underset{\sim}{b} \right|}{\left| \underset{\sim}{b} \right|}
}{Using\ \underset{\sim}{a} \cdot \underset{\sim}{b} = \ \left| \underset{\sim}{a} \right|\left| \underset{\sim}{b} \right|cos\ \theta:
}{= \frac{\left| \underset{\sim}{a} \right|\left| \underset{\sim}{b} \right|cos\ \theta}{\left| \underset{\sim}{b} \right|}
}{= \ \left| \underset{\sim}{a} \right|cos\ \theta
}{= \ r\ cos\ \theta}$$

b.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image68.png){width="1.8516797900262467in"
    height="1.5466666666666666in"}Prove, using the result in part **a**
    and Pythagoras' Theorem, that the rejection magnitude
    $|\mathbf{a} - proj_{\mathbf{b}}\mathbf{a|}\$is $r\sin\theta$.

$${\left| a - proj_{\mathbf{b}}\mathbf{a}\  \right|^{2} = \left| \overset{̰}{a} \right|^{2} - |proj_{\mathbf{b}}\mathbf{a}\ \left. \  \right|^{2}
}{= r^{2} - r^{2}\cos^{2}\theta
}{= r^{2}\left( 1 - \cos^{2}\theta \right)
}{= r^{2}\sin^{2}\theta
}{\therefore\left| a - proj_{\mathbf{b}}\mathbf{a}\  \right| = r\sin\theta}$$

# Applications of Vectors to Motion

+-----------------------------------------------------------------------+
| - **Example** Solve one-dimensional motion problems using vectors.    |
+===================================+===================================+
| Charlotte is swimming 40 km/h     | Charlotte is swimming 40 km/h     |
| downstream of a river. The        | upstream of a river. The current  |
| current is 60 km/h. At what       | is 60 km/h. At what velocity is   |
| velocity is Charlotte travelling? | Charlotte travelling?             |
|                                   |                                   |
| 40 km/h 60 km/h                   | 40 km/h                           |
|                                   |                                   |
| 100 km/h downstream.              | 60 km/h                           |
|                                   |                                   |
|                                   | 20 km/h downstream.               |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| - **Practice**                                                        |
+===================================+===================================+
| A ship is sailing at 80 km/h      | A ship is sailing at 80 km/h      |
| east.\                            | east.\                            |
| It experiences a westerly (from   | It experiences an easterly (from  |
| the west) wind of 20 km/h.\       | the east) wind of 20 km/h.\       |
| At what velocity is the ship      | At what velocity is the ship      |
| sailing now?                      | sailing now?                      |
|                                   |                                   |
| 100 km/h east                     | 60 km/h east                      |
+-----------------------------------+-----------------------------------+
| A tourist is at an airport        | Shirley jumps from a plane and    |
| walking north at a speed of 1.5   | opens her parachute.              |
| m/s.\                             |                                   |
| She steps on a travellator moving | Gravity pulls Shirley downwards   |
| north at a speed of 1 m/s and     | with an acceleration of 10 m/s².  |
| continues walking at the same     |                                   |
| speed.\                           | The parachute pulls her upwards,  |
| What is her velocity now?         | creating an upwards acceleration  |
|                                   | of 10 m/s².                       |
| 2.5 m/s north                     |                                   |
|                                   | What is Shirley\'s resultant      |
|                                   | acceleration?                     |
|                                   |                                   |
|                                   | 0 m/s^2^                          |
+-----------------------------------+-----------------------------------+

+---------------------------------------------------------------------------------------------------------------------+
| - **Resolving Vectors**                                                                                             |
+=====================================================================================================================+
| In real-life, we often know a vector\'s magnitude and direction rather than its components.                         |
|                                                                                                                     |
| Working with vectors is easier when we have their horizontal and vertical components.                               |
|                                                                                                                     |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image69.png){width="2.0972222222222223in" |
| height="2.109027777777778in"}**Splitting** a vector into these components is called **resolving** the vector.       |
|                                                                                                                     |
| For vector $\overset{̰}{u}$ with magnitude $r$ and **angle of inclination** $\theta$:                                |
|                                                                                                                     |
| $\overset{̰}{u} = \left( \begin{array}{r}                                                                            |
| r\cos\theta \\                                                                                                      |
| r\sin\theta                                                                                                         |
| \end{array} \right)$                                                                                                |
|                                                                                                                     |
| - A lot of the time we only care about magnitude,\                                                                  |
|   so we can use the acute reference angle and\                                                                      |
|   determine the sign from the diagram.                                                                              |
|                                                                                                                     |
| - We can use $\sin\theta = \cos(90 - \theta)$ to write in\                                                          |
|   terms of a given acute angle.                                                                                     |
+---------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Resolve** vectors into horizontal and vertical components.                                                                                                                                                                                    |
+=========================================================================================================================+=========================================================================================================================+
| Resolve these vectors into horizontal and vertical components.\                                                                                                                                                                                   |
| Do this in as many ways as possible.                                                                                                                                                                                                              |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image70.png){width="1.2590277777777779in" | b.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image71.png){width="1.1682841207349082in" |
|     height="1.007638888888889in"}                                                                                       |     height="0.928571741032371in"}                                                                                       |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| c.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image72.png){width="0.7569444444444444in" | d.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image73.png){width="1.4036701662292213in" |
|     height="0.9520833333333333in"}                                                                                      |     height="1.145262467191601in"}                                                                                       |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| e.  A bushwalker travels 500 m northeast.                                                                               | f.  A ship is travelling at 40 km/h southeast.                                                                          |
|                                                                                                                         |                                                                                                                         |
| How far did they travel north and east?                                                                                 | What are its northerly and easterly components of motion?                                                               |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| - **Applications of Vectors to Motion and Mechanics**                                                                                                                                                                                             |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| We can use vectors to find the resultant displacement, velocity, or acceleration.                                                                                                                                                                 |
|                                                                                                                                                                                                                                                   |
| Questions generally involve these steps:                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                   |
| 1\. Sketch a vector diagram, showing the resultant vector.                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                   |
| 2\. Resolve each vector into horizontal and vertical components.                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                   |
| 3\. Add each component to find the resultant vector.                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                   |
| 4\. Calculate magnitude and direction of the resultant vector.                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                   |
| In this section, we are working with constant motion, in other words, no differentiation or integration is required.                                                                                                                              |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Solve two-dimensional motion problems using vectors.                                                                                                                                                                                                                |
+==================================================================================================================================================+================================================================================================================================+
| A plane's autopilot is set to a speed of 250 km/h on a bearing of 040°. There is a westerly (from the west) wind of 55 km/h. Find the resultant speed and bearing of the plane to 1 d.p.                                                                                          |
+--------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image74.png){width="2.0618055555555554in"                              | 2\. Resolve                                                                                                                    |
| height="2.035416666666667in"}![](media/Introduction to Vectors 2_Further operations with vectors/media/image75.png){width="2.4382720909886264in" |                                                                                                                                |
| height="2.099502405949256in"}1. Sketch                                                                                                           |                                                                                                                                |
+--------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------+
| 3\. Add components                                                                                                                               | 4\. Resultant vector                                                                                                           |
|                                                                                                                                                  |                                                                                                                                |
| $x$-components: $250\cos{50{^\circ}} + 55$                                                                                                       | $$\left| \overset{̰}{u} \right| = \sqrt{\left( 250\cos{50{^\circ}} + 55 \right)^{2} + \left( 250\sin{50{^\circ}} \right)^{2}}$$ |
|                                                                                                                                                  |                                                                                                                                |
| $y$-components: $250\sin{50{^\circ}}$                                                                                                            | $= 288.4$                                                                                                                      |
|                                                                                                                                                  |                                                                                                                                |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image76.png){width="2.061903980752406in" height="1.329385389326334in"} | $$A = \tan^{- 1}\left( \frac{250\sin{50{^\circ}}}{250\cos{50{^\circ}} + 55} \right) = 41.6{^\circ}$$                           |
|                                                                                                                                                  |                                                                                                                                |
|                                                                                                                                                  | $$\therefore\theta = 90 - 41.6 = 48.4{^\circ}$$                                                                                |
|                                                                                                                                                  |                                                                                                                                |
|                                                                                                                                                  | 288.4 km/h at $048.4{^\circ}$                                                                                                  |
+--------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------+
| Note that you can also solve this problem using cosine rule.                                                                                                                                                                                                                      |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Practice**                                                    |
+===================================================================+
| A ship sails with its engine and rudder set at a speed of 60 km/h |
| at a bearing of 030°.\                                            |
| There an ocean current going from south to north at a speed of 40 |
| km/h.\                                                            |
| Find the resultant speed and bearing of the ship to 1 d.p.        |
|                                                                   |
| 96.7 km/h at 018.1°                                               |
+-------------------------------------------------------------------+
| A plane has its engine set at 100 km/h at a bearing of 200°.\     |
| It experiences wind blowing at 40 km/h at a bearing of 140°.\     |
| What is its resultant velocity, to 1 d.p.?                        |
|                                                                   |
| 124.9 km/h at 183.9°                                              |
+-------------------------------------------------------------------+
| A river flows downstream at 4 m/s.                                |
|                                                                   |
| Anna tries to swim directly across the river, perpendicular to    |
| the riverbank, but is getting pulled by the current. Her swimming |
| speed in still water is 3 m/s.                                    |
|                                                                   |
| What is her resultant velocity? Give the direction as the acute   |
| angle from the riverbank.                                         |
|                                                                   |
| 5 m/s at 36.9° from riverbank                                     |
+-------------------------------------------------------------------+

Foundation

1.  A ball is thrown at an angle of 30° to the horizontal with an
    initial speed of 20 m/s.\
    Find the initial horizontal and vertical components of the velocity
    of the ball.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image77.png){width="1.9691360454943132in"
height="1.5083573928258969in"}

Initial speed is 20 m/s.

Horizontal component: $20\cos{30{^\circ}} = 10\sqrt{3}$

Vertical component: $20\sin{30{^\circ}} = 10$

Initial horizontal component of velocity is $10\sqrt{3}$ m/s and initial
vertical component of velocity is 10 m/s.

2.  Juan aims to swim straight across a river at 5 km h⁻¹ but a current
    of 8 km h⁻¹ down the river is affecting his progress. What is
    Juan\'s speed under the influence of the current?

Swimming: (0, 5), Current: (8, 0)

Resultant = (8, 5)

$$Speed\  = \ \sqrt{64\  + \ 25} = \ \sqrt{89} \approx \ 9.4\ km\ h⁻¹$$

3.  An airship\'s controls are set to fly west at 45 km h⁻¹. Find its
    velocity given:

+--------------------------------------------------------------------+------------------------------------------+------------------------------------------------------------------------------+
| a.  a tail wind of 30 km h⁻¹                                       | b.  a head wind of 23 km h⁻¹             | c.  a northerly wind (wind from the north) of 15 km h⁻¹                      |
|                                                                    |                                          |                                                                              |
| $$Airship:\ 45\ km\ h⁻¹\ west\  = \ ( - 45,\ 0)$$                  | $$Head\ wind\ (opposing):\ ( + 23,\ 0)$$ | $$Northerly\ wind\ (from\ north,\ so\ going\ south):\ (0,\  - 15)$$          |
|                                                                    |                                          |                                                                              |
| $$Tail\ wind\ (from\ behind,\ so\ same\ direction):\ ( - 30,\ 0)$$ | $$Resultant\  = \ ( - 45\  + \ 23,\ 0)$$ | $$Resultant\  = \ ( - 45,\  - 15)$$                                          |
|                                                                    |                                          |                                                                              |
| $$Resultant\  = \ ( - 75,\ 0)$$                                    | $$= \ ( - 22,\ 0)$$                      | $$Magnitude\  = \ \sqrt{2025\  + \ 225}\ $$                                  |
|                                                                    |                                          |                                                                              |
| $$= \ 75\ km\ h⁻¹\ west$$                                          | $$= \ 22\ km\ h^{- 1}\ west$$            | $$= 47.4\ km\ h^{- 1}$$                                                      |
|                                                                    |                                          |                                                                              |
|                                                                    |                                          | $$Direction\  = \ \tan^{- 1}\left( \frac{15}{45} \right) + \ 180{^\circ}\ $$ |
|                                                                    |                                          |                                                                              |
|                                                                    |                                          | $$= \ 252{^\circ}$$                                                          |
+====================================================================+==========================================+==============================================================================+

4.  The magnitude of vector $\left( \begin{array}{r}
    x \\
    y
    \end{array} \right)$ is 6 and its direction is 150°. Find the exact
    values of $x$ and $y$.

$${x\  = \ 6cos(150{^\circ}) = \ 6\left( - \frac{\sqrt{3}}{2} \right) = \  - 3\sqrt{3}
}{y\  = \ 6sin(150{^\circ}) = \ 6\left( \frac{1}{2} \right) = \ 3}$$

5.  Vector $\left( \begin{array}{r}
    a \\
    b
    \end{array} \right)$ has magnitude 4 and its direction is 300°. Find
    the exact values of $a$ and $b$.

$${a\  = \ 4cos(300{^\circ}) = \ 2
}{b\  = \ 4sin(300{^\circ}) = \ 4\left( - \frac{\sqrt{3}}{2} \right) = \  - 2\sqrt{3}}$$

6.  Vector $\underset{\sim}{v} = \ a\mathbf{i}\  + \ b\mathbf{j}$ has
    magnitude 4 and direction 120°. Find the exact values of $a$ and
    $b$.

$${a\  = \ 4cos(120{^\circ}) = \ 4\left( - \frac{1}{2} \right) = \  - 2
}{b\  = \ 4sin(120{^\circ}) = \ 4\left( \frac{\sqrt{3}}{2} \right) = \ 2\sqrt{3}}$$

7.  Write, in component form, a vector whose magnitude and direction
    are:

+-----------------------------------------------+-------------------------------------------------------------------------------------+
| a.  4 and $- \frac{\pi}{4}$,                  | b.  $2\sqrt{6}\$and $\frac{2\pi}{3},$                                               |
|                                               |                                                                                     |
| $$2\sqrt{2}\mathbf{i} - 2\sqrt{2}\mathbf{j}$$ | $$- \sqrt{6}\mathbf{i} + 3\sqrt{2}\mathbf{j}$$                                      |
+===============================================+=====================================================================================+
| c.  $2\$and$\  - \frac{5\pi}{6},$             | d.  $2\sqrt{2}\$and $\frac{5\pi}{12}.$                                              |
|                                               |                                                                                     |
| $$- \sqrt{3}\mathbf{i} - \mathbf{j}$$         | $$- \left( \sqrt{3} - 1 \right)\mathbf{i} + \left( \sqrt{3} + 1 \right)\mathbf{j}$$ |
+-----------------------------------------------+-------------------------------------------------------------------------------------+

8.  A displacement vector has magnitude 3.4 km and direction 125°.\
    A second displacement vector has magnitude 2.8 km and direction
    28°.\
    Find the magnitude and direction of the resultant vector by adding
    these vectors.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image78.png){width="3.030715223097113in"
height="2.769841426071741in"}

$${{\underset{\sim}{v}}_{1} = \ 3.4(cos\ 125{^\circ},\ sin\ 125{^\circ}) = \ ( - 1.950,\ 2.786)
}{\underset{\sim}{v_{2}}\  = \ 2.8(cos\ 28{^\circ},\ sin\ 28{^\circ})\  = \ (2.472,\ 1.315)\ 
}{Resultant\  = \ (0.522,\ 4.101)
}{Magnitude\  = \ \sqrt{0.272\  + \ 16.82} = \ \sqrt{17.09} \approx \ 4.1\ km
}{Direction\  = \ \tan^{- 1}\left( \frac{4.101}{0.522} \right) \approx \ 83{^\circ}\ (Q1)}$$

9.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image79.png){width="3.4298425196850393in"
    height="2.6043121172353456in"}A velocity vector has magnitude 890 m
    s⁻¹ and direction 232°.\
    Another velocity vector has magnitude 549 m s⁻¹ and direction 138°.\
    If these 2 velocities are added, find the magnitude and direction of
    the resultant vector.

$${\underset{\sim}{v_{1}}\  = \ 890(cos\ 232{^\circ},\ sin\ 232{^\circ})\  = \ ( - 548,\  - 701)
}{\underset{\sim}{v_{2}}\  = \ 549(cos\ 138{^\circ},\ sin\ 138{^\circ})\  = \ ( - 408,\ 367)
}{Resultant\  = \ ( - 956,\  - 334)
}{Magnitude\  = \ \sqrt{914000\  + \ 112000} \doteq \ 1012.6\ m\ s^{- 1}
}{Direction\  = \ tan^{- 1}\left( - \frac{334}{- 956} \right) + \ 180{^\circ} \approx 199{^\circ}\ \ (Q3)}$$

10. A particle has initial position vector
    $(4\mathbf{i}\  + \ 5\mathbf{j})$ metres.\
    It moves with a constant velocity of
    $(3\mathbf{i}\  - \ 2\mathbf{j})$ m/s.\
    Find its position vector after 7 seconds.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image80.png){width="2.1589424759405076in"
height="1.1666666666666667in"}

$$Let\ \overrightarrow{OA}\  = \ 4\mathbf{i}\  + \ 5\mathbf{j}\ be\ the\ position\ vector\ and\ \overrightarrow{AP}\  = \ 3\mathbf{i}\  - \ 2\mathbf{j}\ be\ the\ velocity\ vector.$$

$$In\ t\ seconds,\ it\ moves\ from\ \overrightarrow{AP}\ hence,$$

$$\overrightarrow{OP}\  = \ \overrightarrow{OA}\  + \ t\  \times \ \overrightarrow{AP}$$

$$When\ t\  = \ 7\ s,$$

$$\overrightarrow{OP}\  = \ 4i\  + \ 5j\  + \ 7\  \times \ (3i\  - \ 2j)$$

$$\overrightarrow{OP}\  = \ 4i\  + \ 5j\  + \ 21i\  - \ 14j$$

$$\overrightarrow{OP}\  = \ 25i\  - \ 9j$$

$$Hence,\ position\ vector\ after\ 7\ seconds\ is\ 25\mathbf{i} - \ 9\mathbf{j}.$$

11. A river is flowing at a speed of 1.5 m/s.\
    Sam wants to row from point A on one bank to point B on the other
    bank directly opposite A.\
    He intends to maintain a constant speed of 2.5 m/s.\
    In what direction, correct to the nearest degree, should Sam row?\
    Give your answer as an angle of inclination to the line AB.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image81.png){width="1.4381944444444446in"
height="1.5555971128608923in"}

Let θ be the angle between the line AB and the direction Sam should row
from A.

$${\sin\ \theta\  = \frac{1.5}{2.5}
}{\theta\  = \ 36.869...{^\circ}
}{\approx 37{^\circ}}$$

Sam should row in the direction of 37° from the line AB.

12. The controls of an light plane are set to fly west at 75 km h⁻¹.\
    Due to a cross wind, its resultant velocity is 95 km h⁻¹ in a 135°
    direction.\
    What is the speed and direction of the cross wind?

$${Plane\ setting:\ ( - 75,\ 0)
}{Resultant:\ 95(cos\ 135{^\circ},\ sin\ 135{^\circ})\  = \ ( - 67.2,\ 67.2)
}{Wind + Setting\  = \ Resultant
}{Wind = Resultant\  - \ Setting\  = \ \left( - 67.2\  - \ ( - 75),\ 67.2\  - \ 0 \right) = \ (7.8,\ 67.2)
}{|Wind| = \ \sqrt{{7.8}^{2}\  + {67.2}^{2}} \approx \ 67.6\ km\ h^{- 1}
}{\theta\  = \ \tan^{- 1}\left( \frac{67.2}{7.8} \right) \approx \ 83{^\circ}\ \ (Q1)}$$

Development

13. The position of a plane flying horizontally in a straight line at a
    constant speed is plotted on a radar screen. One unit on the screen
    represents 1 km in the air. At 12 noon the position vector of the
    plane is $40\mathbf{i}\  + \ 16\mathbf{j}$. Five minutes later its
    position vector is $33\mathbf{i}\  + \ 40\mathbf{j}$. Find:

    a.  the position vector of the plane at 12:15 pm,

    b.  the velocity of the plane as a vector in km/h.

a

$$At\ 12\ noon,\ the\ position\ vector\ is\ \overrightarrow{OA}\  = \ 40\mathbf{i}\  + \ 16\mathbf{j}$$

$$After\ 5\ minutes,\ the\ position\ vector\ is\ \overrightarrow{OB}\  = \ 33\mathbf{i}\  + \ 40\mathbf{j}$$

$$Let\ the\ displacement\ vector\ (after\ 5\ minutes)\ be\ \overrightarrow{AB}\ which\ is:$$

$${\overrightarrow{AB}\  = \ \overrightarrow{OB}\  - \ \overrightarrow{OA}
}{= \ (33\mathbf{i}\  + \ 40\mathbf{j})\  - \ (40\mathbf{i}\  + \ 16\mathbf{j})
}{= \ 33\mathbf{i}\  + \ 40\mathbf{j}\  - \ 40\mathbf{i}\  - \ 16\mathbf{j}
}{= \  - 7\mathbf{i}\  + \ 24\mathbf{j}}$$

$$At\ 12.15\ pm\ (after\ 3\  \times \ 5\  = \ 15\ minutes),\ the\ position\ vector\ will\ be:$$

$${\overrightarrow{OA}\  + \ 3\overrightarrow{AB}
}{= \ 40\mathbf{i}\  + \ 16\mathbf{j}\  + \ 3( - 7\mathbf{i}\  + \ 24\mathbf{j})
}{= \ 40\mathbf{i}\  + \ 16\mathbf{j}\  - \ 21\mathbf{i}\  + \ 72\mathbf{j}
}{= \ 19\mathbf{i}\  + \ 88\mathbf{j}}$$

b

$$After\ 1\ hour\ (that\ is,\ after\ 12\  \times \ 5\  = \ 60\ minutes),\ the\ displacement\ vector\ of\ the\ plane\ will\ be:$$

$${12\overrightarrow{AB}\  = \ 12( - 7\mathbf{i}\  + \ 24\mathbf{j})
}{= \  - 84\mathbf{i}\  + \ 288\mathbf{j}}$$

$$Hence,\ the\ velocity\ vector\ of\ the\ plane\ will\ be\ ( - 84\mathbf{i}\  + \ 288\mathbf{j})\ km/h.$$

14. David can row at 5 m/s in still water. He starts rowing from a point
    on the south bank of a river that is flowing due east at 3 m/s and
    steers the boat at 90° to the bank. He is also being blown by a wind
    from the north-east at 4 m/s.

    a.  Express the velocity of the boat as a component vector.

    b.  Hence find the speed of the boat, correct to 2 significant
        figures, and the bearing on which the boat is travelling correct
        to the nearest tenth of a degree.

a

Rowing velocity: 90° to bank (south bank) means due north
$\underset{\sim}{v_{1}}\  = \ 5\mathbf{j}$

River current: due east $\underset{\sim}{v_{2}}\  = \ 3\mathbf{i}$

Wind: from north-east means towards south-west (at 225° or −45° from
east)

$$\underset{\sim}{v_{3}}\  = \ 4\cos(225{^\circ})\mathbf{i}\  + \ 4\sin(225{^\circ})\mathbf{j}\  = \  - 2\sqrt{2}\mathbf{i}\  - \ 2\sqrt{2}\mathbf{j}$$

$$\underset{\sim}{v} = \ \left( 3\  - \ 2\sqrt{2} \right)\mathbf{i}\  + \ \left( 5\  - \ 2\sqrt{2} \right)\mathbf{j}$$

b

The speed of the boat is given by $\left| \underset{\sim}{v} \right|.$

$$\left| \underset{\sim}{v} \right| = \ \sqrt{\left( 3\  - \ 2\sqrt{2} \right)^{2} + \ \left( 5\  - \ 2\sqrt{2} \right)^{2}}$$

= 2.17\...

So the speed of the boat is 2.2 m/s (correct to two significant
figures).

The bearing on which the boat is travelling is given by (90° − θ) where

$$\theta\  = \ tan^{- 1}\left( \frac{5\  - \ 2\sqrt{2}}{3\  - \ 2\sqrt{2}} \right).$$

$$\theta\  = \ 85.48...{^\circ}$$

So the bearing on which the boat is travelling is 4.5°T (correct to the
nearest tenth of a degree).

# Applications of Vectors to Mechanics

+-------------------------------------------------------------------+
| - **Forces**                                                      |
+===================================================================+
| Forces are a push or pull on an object.                           |
|                                                                   |
| Forces are measured in Newtons (N), or kg/ms^2^, which is a       |
| vector quantity.                                                  |
|                                                                   |
| 1 Newton of force will change a 1 kg object's velocity at a rate  |
| of 1 metre per second in the direction of the force.              |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Solving Vector Problems using Free-body Diagrams**            |
+===================================================================+
| In mechanics scenarios, physicists model an object as a point.    |
|                                                                   |
| We draw forces on the object as vectors with tail at the object.  |
|                                                                   |
| 1\. Sketch a free-body diagram showing the forces on the object.  |
|                                                                   |
| 2\. Resolve each vector into horizontal and vertical components.  |
|                                                                   |
| 3\. Add each component to find the resultant vector.              |
|                                                                   |
| 4\. Calculate magnitude and direction of the resultant vector.    |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Solve two-dimensional motion problems using vectors.                                                                                                                                                                                                      |
+=====================================================================================================================+===================================================================================================================================================+
| Three boys are pulling a large box using ropes.                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                         |
| Peter pulls east with a force of 60 N. Paul pulls north with a force of 80 N.                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                         |
| Phillip pulls southwest with a force of 50 N.\                                                                                                                                                                                                                          |
| Find the resultant force on the box, give the direction as a true bearing,                                                                                                                                                                                              |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+
| 1\. Sketch                                                                                                          | ![](media/Introduction to Vectors 2_Further operations with vectors/media/image82.png){width="1.7583333333333333in"                               |
|                                                                                                                     | height="1.8798611111111112in"}![](media/Introduction to Vectors 2_Further operations with vectors/media/image83.png){width="1.5151312335958005in" |
|                                                                                                                     | height="1.6702941819772528in"}2. Resolve                                                                                                          |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image84.png){width="1.8218383639545057in" | 4\. Resultant vector                                                                                                                              |
| height="1.0288363954505686in"}3. Add components                                                                     |                                                                                                                                                   |
|                                                                                                                     | $$\left| \overset{̰}{v} \right| = \sqrt{{24.6446}^{2} + {44.6446}^{2}}$$                                                                           |
| $x$-components:                                                                                                     |                                                                                                                                                   |
|                                                                                                                     | $= 51$                                                                                                                                            |
| $$50\cos{225{^\circ}} + 60$$                                                                                        |                                                                                                                                                   |
|                                                                                                                     | $$A = \tan^{- 1}\left( \frac{44.6446}{24.6446} \right) = 61.1{^\circ}$$                                                                           |
| $$\approx 24.6446\ldots$$                                                                                           |                                                                                                                                                   |
|                                                                                                                     | $$\theta = 90 - 61.1{^\circ} = 28.9{^\circ}$$                                                                                                     |
| $y$-components:                                                                                                     |                                                                                                                                                   |
|                                                                                                                     | $\therefore$ 51 N at 028.9°                                                                                                                       |
| $$50\sin{225{^\circ}} + 80$$                                                                                        |                                                                                                                                                   |
|                                                                                                                     |                                                                                                                                                   |
| $$\approx 44.6446\ldots$$                                                                                           |                                                                                                                                                   |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                      |
+=====================================================================================================================+
| A box is being pulled north by a force of 240 N and west by a force of 165 N.                                       |
|                                                                                                                     |
| What is the resultant force on the box? Give the direction as a compass bearing.\                                   |
| Answer to 2 d.p.                                                                                                    |
|                                                                                                                     |
| 291.25 N at N 34.51° W                                                                                              |
+---------------------------------------------------------------------------------------------------------------------+
| Two forces are acting on an object, as shown in the diagram.                                                        |
|                                                                                                                     |
| Find the resultant force.\                                                                                          |
| Answer to the nearest whole number and give the direction as a true bearing.                                        |
|                                                                                                                     |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image85.png){width="2.2051279527559053in" |
| height="2.5141262029746283in"}                                                                                      |
|                                                                                                                     |
| 138 N at 166°                                                                                                       |
+---------------------------------------------------------------------------------------------------------------------+
| An object is being lifted by two ropes, as shown in the diagram.                                                    |
|                                                                                                                     |
| Find the resultant force on the object, giving answers to the nearest whole with direction as an angle from the     |
| positive horizontal.                                                                                                |
|                                                                                                                     |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image86.png){width="2.5256408573928257in" |
| height="1.6083333333333334in"}                                                                                      |
|                                                                                                                     |
| 157 N at 94° from positive horizontal                                                                               |
+---------------------------------------------------------------------------------------------------------------------+
| - **Newton's Second Law**                                                                                           |
+---------------------------------------------------------------------------------------------------------------------+
| Newton's second law states that the force experienced by an object is                                               |
|                                                                                                                     |
| $$F = ma$$                                                                                                          |
|                                                                                                                     |
| where $a$ is the acceleration of the object.                                                                        |
|                                                                                                                     |
| We can use $a =$ $\frac{F}{m}$ to calculate the acceleration of an object once we have the resultant force.         |
+---------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Apply** Newton's second law                                       |
+===================================+===================================+
| a.  A resultant force of 24 N     | b.  A 7 kg object experiences a   |
|     west acts on a 6 kg object.   |     force of 12 N east. What is   |
|     What is its acceleration?     |     its acceleration?             |
+-----------------------------------+-----------------------------------+
| c.  A 12 N south force acts on an | d.  What force is required to     |
|     object, causing it to         |     accelerate a 50 kg object     |
|     accelerate in the same        |     upwards at 10 m/s^2^?         |
|     direction at 3 m/s^2^. What   |                                   |
|     is its mass?                  |                                   |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Weight**                                                      |
+===================================================================+
| Weight is the force due to gravity, $W = mg$, where $g$ is        |
| acceleration due to gravity, usually given as either $9.8$ m/s^2^ |
| or 10 m/s^2^ towards the centre of the Earth.                     |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Calculate** weight                                                |
+===================================+===================================+
| a.  Calculate the weight of a 7   | b.  An object has weight 60 N.    |
|     kg object. Use $g\  = \ 10$   |     Calculate its mass. Use       |
|     m/s².                         |     $g\  = \ 10$ m/s².            |
+-----------------------------------+-----------------------------------+
| c.  A 5 kg object is on Earth,    | d.  A 5 kg object is on Mars,     |
|     $g\  = \ 9.8$ m/s². Calculate |     $g = 3.7$ m/s^2^.\            |
|     its weight.                   |     Calculate its weight.         |
+-----------------------------------+-----------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Inclined Planes**                                                                                                                             |
+===================================================================================================================================================+
| An inclined plane is a sloping surface.                                                                                                           |
|                                                                                                                                                   |
| An object on an inclined plane experiences a force vertically downwards due to gravity.                                                           |
|                                                                                                                                                   |
| Instead of a horizontal and vertical basis, analysing inclined planes is easier by having the basis be parallel and perpendicular to the plane.   |
|                                                                                                                                                   |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image87.png){width="1.7472222222222222in"                               |
| height="0.9701388888888889in"}![](media/Introduction to Vectors 2_Further operations with vectors/media/image88.png){width="1.8458333333333334in" |
| height="0.9166666666666666in"}                                                                                                                    |
+---------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate resultant force on an inclined plane.                                                      |
+====================================================================================================================+
| An object of mass 8 kg is placed onto a smooth inclined plane angled at 30° to the horizontal.                     |
|                                                                                                                    |
| Treat gravity as 10 m/s^2^ vertically downwards.                                                                   |
|                                                                                                                    |
| a.  What is the force due to gravity?                                                                              |
|                                                                                                                    |
| b.  What is the component of force down the slope?                                                                 |
|                                                                                                                    |
| c.  Assuming no friction, what is the acceleration of the object down the slope?                                   |
|                                                                                                                    |
| a\) $W = mg = 80\ N$ downwards.                                                                                    |
|                                                                                                                    |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image89.png){width="6.358333333333333in" |
| height="1.321839457567804in"}b)                                                                                    |
|                                                                                                                    |
| c\)                                                                                                                |
|                                                                                                                    |
| $$a = \frac{F}{m} = \frac{80\cos{60{^\circ}}}{8} = 5\ m/s^{2}$$                                                    |
+--------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Practice**                                                    |
+===================================================================+
| A 12 kg object is placed onto a smooth inclined plane angled at   |
| 40° to the horizontal.\                                           |
| Treat gravity as 10 m/s^2^ vertically downwards.                  |
|                                                                   |
| a.  What is the force due to gravity?                             |
|                                                                   |
| b.  What is the component of force down the slope?                |
|                                                                   |
| c.  What is the acceleration of the object down the slope?        |
|                                                                   |
| 120 N, 77.1 N, 6.4 m/s²                                           |
+-------------------------------------------------------------------+
| - **Equilibrium**                                                 |
+-------------------------------------------------------------------+
| According to Newton's first law, an object that has constant      |
| velocity (including being completely still) experiences no        |
| resultant force.                                                  |
|                                                                   |
| This means all horizontal and vertical components of force must   |
| cancel out.                                                       |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------+
| - **Example** Solve problems involving systems in equilibrium.                                                      |
+=====================================================================================================================+
| An object of mass 5 kg is placed on a rough inclined plane at 20° to the horizontal and does not move. Calculate    |
| the friction force acting on the object up the slope.\                                                              |
| Treat gravity as 10 m/s^2^ vertically downwards.                                                                    |
|                                                                                                                     |
| ![](media/Introduction to Vectors 2_Further operations with vectors/media/image90.png){width="4.2412740594925635in" |
| height="1.339080271216098in"}                                                                                       |
|                                                                                                                     |
| For the object to not move, there must be a resultant force of 0 along the inclined plane.                          |
|                                                                                                                     |
| Therefore, force of friction is $50\cos{70{^\circ}}$ N of force up the slope.                                       |
+---------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Practice**                                                    |
+===================================================================+
| An object of mass 6 kg is placed on a rough inclined plane at 45° |
| to the horizontal and does not move. Calculate the friction force |
| acting on the object up the slope.                                |
|                                                                   |
| Treat gravity as 10 m/s^2^ vertically downwards.                  |
|                                                                   |
| 42.4 N                                                            |
+-------------------------------------------------------------------+
| An object of mass 6 kg is suspended from a horizontal ceiling by  |
| two equal length wires, both angled at 60° from the ceiling.      |
| Calculate the magnitudes of the equal tensions in the two         |
| strings. Treat gravity as 10 m/s^2^ vertically downwards.         |
|                                                                   |
| 34.6 N                                                            |
+-------------------------------------------------------------------+

Foundation

In this exercise take g = 9.8 m/s², unless otherwise stated.

1.  Find the magnitude of the resultant of the forces
    $(2\mathbf{i}\  - \ 3\mathbf{j})\ N,\ (4\mathbf{i\ } + \ \mathbf{j})$
    N and $( - 3\mathbf{i\ } + \ 3\mathbf{j})\ N$.

$$Let\ \underset{\sim}{u}\  = \ \left( 2\mathbf{i}\  - \ 3\mathbf{j} \right),\ \ \ \underset{\sim}{v}\  = \ \left( 4\mathbf{i}\  + \ \mathbf{j} \right)\ \ and\ \underset{\sim}{w}\  = \ ( - 3\mathbf{i}\  + \ 3\mathbf{j})$$

$$Resultant\ vector\ \underset{\sim}{a} = \underset{\sim}{u} + \underset{\sim}{v} + \underset{\sim}{w}$$

$${\underset{\sim}{a}\  = \ (2\mathbf{i}\  - \ 3\mathbf{j})\  + \ (4\mathbf{i}\  + \ \mathbf{j})\  + \ ( - 3\mathbf{i}\  + \ 3\mathbf{j})
}{= \ 3i\  + \ j}$$

$$The\ magnitude\ of\ resultant\ vector\ is$$

$${\left| \underset{\sim}{a} \right|\  = \ \sqrt{3^{2} + \ 1^{2}}
}{= \ \sqrt{9\  + \ 1}
}{= \ \sqrt{10}\ N}$$

2.  In the diagram, a 4-wheel drive vehicle is bogged on a muddy road.\
    A winch is pulling the vehicle with a force of 1200 N.\
    The chain connecting to the vehicle makes an angle of 15° with the
    direction of motion. Calculate, correct to the nearest newton, the
    magnitude of the component of the force:

    a.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image91.png){width="2.012345800524934in"
        height="1.0683880139982502in"}in the direction of motion,

    b.  perpendicular to the direction of motion.

a

$$\ \ \ \ \ 1200\ cos\ 15{^\circ}$$

$$= \ 1159.110...$$

$$\Doteq \ 1159\ N$$

b

$$\ \ \ 1200\ sin\ 15{^\circ}$$

$$= \ 310.582...$$

$$\Doteq \ 311\ N$$

3.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image92.png){width="1.4753083989501312in"
    height="0.9183475503062117in"}The diagram shows an object of weight
    24 N at rest at P on an inclined plane.\
    Find the component of the weight:

    a.  down the plane,

    b.  perpendicular to the plane.

a

24 cos 60°

= 24 × (1/2)

= 12 N

b

= 24 sin 60°

= 24 × (√3)/2

= 12√3 N

4.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image93.png){width="1.6790124671916011in"
    height="1.4711865704286964in"}An object of mass 5 kg is suspended
    from a horizontal ceiling by two strings of equal length. Each
    string makes an angle of 60° with the ceiling.\
    Calculate, correct to 3 significant figures, the equal tensions in
    the two strings.

The weight force, W, has magnitude \|W\| = 5 × 9.8 = 49 N (using F =
mg).

Since the mass is not moving vertically, the magnitude of the vertical
components of the tension forces should\
equal the magnitude of the vertical weight force.

$$2|T|\ sin\ 60{^\circ}\  = \ 49$$

$$|T|\ sin\ 60{^\circ}\  = \ 24.5$$

$$|T| = \frac{24.5}{sin\ 60{^\circ}}$$

$$\Doteq \ 28.3\ N$$

5.  In the diagram, an object of mass 10 kg is kept at rest on a plane
    inclined at 30° to the horizontal by a friction force of F newtons
    acting parallel to the plane. Find the value of F.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image94.png){width="1.7716054243219597in"
height="1.1362193788276465in"}

The weight force, W, has magnitude \|W\| = 10 × 9.8 = 98 N (using F =
mg).

Magnitude of the component of the force F acting parallel to the plane

$$= \ |W|\ \cos\ 60{^\circ}\ $$

$$= \ 98\ \cos\ 60{^\circ}$$

$$= \ 98\  \times \ (1/2)$$

$$= \ 49\ N$$

6.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image95.png){width="2.216461067366579in"
    height="2.206362642169729in"}Two tugboats are pulling a cruise ship
    as shown, with the force measured in kilonewtons (kN). Find the
    magnitude and direction of the resultant force.

$${Let\ F_{\underset{\sim}{1}}\ and\ \underset{\sim}{F_{2}}\ be\ the\ 2\ forces.
}{\underset{\sim}{F_{1}} = \ 3\ cos\ 40{^\circ}\mathbf{i}\  + \ 3\ sin\ 40{^\circ}\mathbf{j}
}{\underset{\sim}{F_{2}} = \ 2\ cos\ 35{^\circ}\mathbf{i\ } - \ 2\ sin\ 35{^\circ}\mathbf{j}
}{Resultant\ force:\ \underset{\sim}{F} = \underset{\sim}{F_{1}} + \underset{\sim}{F_{2}} = \ (3\ cos\ 40{^\circ}\  + \ 2\ cos\ 45{^\circ})\mathbf{i}\  + \ (3\ sin\ 40{^\circ}\  - \ 2\ sin\ 35{^\circ})\mathbf{j}
}{= \ 3.7\mathbf{i}\  + \ 0.78\mathbf{j}
}{\left| \underset{\sim}{F} \right| = \ \sqrt{{3.7}^{2} + \ {0.78}^{2}} = \ 3.8\ kN
}{Angle\ with\ horizontal:\ \tan^{- 1}\left( \frac{0.78}{3.7} \right) = \ 11{^\circ}
}{\underset{\sim}{F}\ is\ in\ the\ 1st\ quadrant,\ so\ direction\ is\ 11{^\circ}.}$$

Development

7.  A particle has 2 forces on it. Find the magnitude and direction of
    the resultant force.

+----------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image96.png){width="2.0902318460192477in"                            | b.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image96.png){width="2.0902318460192477in"                          |
|     height="1.968503937007874in"}                                                                                                                  |     height="1.968503937007874in"}                                                                                                                |
|                                                                                                                                                    |                                                                                                                                                  |
| $$Let\ \underset{\sim}{F_{1}}\ and\ \underset{\sim}{F_{2}}\ be\ the\ horizontal\ and\ vertical\ force\ respectively.\ $$                           | $$Let\underset{\sim}{\ F_{1}}\ and\ \underset{\sim}{F_{2}}\ be\ the\ 2\ forces.$$                                                                |
|                                                                                                                                                    |                                                                                                                                                  |
| $$\underset{\sim}{F_{1}} = \ 18\mathbf{i}\ and\underset{\sim}{F_{2}} = \  - 10\mathbf{j}$$                                                         | $$\underset{\sim}{F_{1}} = \ 12\mathbf{j}$$                                                                                                      |
|                                                                                                                                                    |                                                                                                                                                  |
| $$Resultant\ force:\underset{\sim}{F}\  = \underset{\sim}{F_{1}} + \underset{\sim}{F_{2}} = \ 18\mathbf{i\ } - \ 10\mathbf{j}$$                    | $$\underset{\sim}{F_{2}} = \ 35\ cos\ 46{^\circ}\mathbf{i\ } + \ 35\ sin\ 46{^\circ}\mathbf{j}\  = \ 24.3\mathbf{i}\  - \ 25.2\mathbf{j}$$       |
|                                                                                                                                                    |                                                                                                                                                  |
| $$\left| \underset{\sim}{F} \right| = \ \sqrt{18^{2} + \ 10^{2}} = \ 20.6\ N$$                                                                     | $$Resultant\ force:\underset{\sim}{F} = \underset{\sim}{F_{1}} + \underset{\sim}{F_{2}} = \ 24.3\mathbf{i}\  - \ 13.2\mathbf{j}$$                |
|                                                                                                                                                    |                                                                                                                                                  |
| $$Angle\ with\ horizontal:\ \tan^{- 1}\left( - \frac{10}{18} \right) = \  - 29{^\circ}$$                                                           | $$\left| \underset{\sim}{F} \right| = \ \sqrt{{24.3}^{2} + \ ( - 13.2)^{2}} = \ 27.7\ N$$                                                        |
|                                                                                                                                                    |                                                                                                                                                  |
| $$\underset{\sim}{F}\ is\ in\ the\ 4th\ quadrant,\ so\ direction\ is\ 360{^\circ}\  - \ 29{^\circ}\  = \ 331{^\circ}.$$                            | $$Angle\ with\ horizontal:\ \tan^{- 1}\left( - \frac{13.2}{24.3} \right) = \  - 29{^\circ}$$                                                     |
|                                                                                                                                                    |                                                                                                                                                  |
|                                                                                                                                                    | $$\underset{\sim}{F}\ is\ in\ the\ 4th\ quadrant,\ so\ direction\ is\ 360{^\circ}\  - \ 29{^\circ}\  = \ 331{^\circ}.$$                          |
+====================================================================================================================================================+==================================================================================================================================================+
| c.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image96.png){width="2.089583333333333in"                             | d.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image96.png){width="2.0891754155730533in"                          |
|     height="1.5864206036745407in"}                                                                                                                 |     height="1.6596478565179353in"}                                                                                                               |
|                                                                                                                                                    |                                                                                                                                                  |
| $$Let\ \underset{\sim}{F_{1}}\ and\ \underset{\sim}{F_{2}}\ be\ the\ 2\ forces.$$                                                                  | $$Let\ \underset{\sim}{F_{1}}\ and\ \underset{\sim}{F_{2}}\ be\ the\ 2\ forces.$$                                                                |
|                                                                                                                                                    |                                                                                                                                                  |
| $$\underset{\sim}{F_{1}} = \  - 95\ cos\ 73{^\circ}\mathbf{i\ } + \ 95\ sin\ 73{^\circ}\mathbf{j}\  = \  - 27.78\mathbf{i\ } + \ 90.85\mathbf{j}$$ | $$\underset{\sim}{F_{1}} = \  - 17\ cos\ 84{^\circ}\mathbf{i}\  + \ 17\ sin\ 84{^\circ}\mathbf{j\ } = \  - 1.78\mathbf{i\ } + \ 16.9\mathbf{j}$$ |
|                                                                                                                                                    |                                                                                                                                                  |
| $$\underset{\sim}{F_{2}} = \ 110\ cos\ 61{^\circ}\mathbf{i\ } + \ 110\ sin\ 61{^\circ}\mathbf{j}\  = \ 53.33\mathbf{i}\  + \ 96.21\mathbf{j}$$     | $$\underset{\sim}{F_{2}} = \  - 26\ cos\ 33{^\circ}\mathbf{i\ } - \ 26\ sin\ 33{^\circ}\mathbf{j}\  = \  - 21.8\mathbf{i}\  - \ 14.2\mathbf{j}$$ |
|                                                                                                                                                    |                                                                                                                                                  |
| $$Resultant\ force:\underset{\sim}{F} = \underset{\sim}{F_{1}} + \underset{\sim}{F_{2}} = \ 25.55\mathbf{i}\  + \ 187.06\mathbf{j}$$               | $$Resultant\ force:\underset{\sim}{F} = \underset{\sim}{F_{1}} + \underset{\sim}{F_{2}} = \  - 23.58\mathbf{i}\  + \ 2.7\mathbf{j}$$             |
|                                                                                                                                                    |                                                                                                                                                  |
| $$\left| \underset{\sim}{F} \right| = \ \sqrt{{25.55}^{2} + \ {187.06}^{2}} \approx \ 188.8\ N$$                                                   | $$\left| \underset{\sim}{F} \right| = \ \sqrt{( - 23.58)^{2} + \ {2.7}^{2}} = \ 23.7\ N$$                                                        |
|                                                                                                                                                    |                                                                                                                                                  |
| $$Angle\ with\ horizontal:\ \tan^{- 1}\left( \frac{186.3}{25.5} \right) = \ 82{^\circ}$$                                                           | $$Angle\ with\ horizontal:\ \tan^{- 1}\left( - \frac{2.7}{23.58} \right) = \  - 7{^\circ}$$                                                      |
|                                                                                                                                                    |                                                                                                                                                  |
| $$\underset{\sim}{F}\ is\ in\ the\ 1st\ quadrant,\ so\ direction\ is\ 82{^\circ}.$$                                                                | $$\underset{\sim}{F}\ is\ in\ the\ 2nd\ quadrant,\ so\ direction\ is\ 180{^\circ}\  - \ 7{^\circ}\  = \ 173{^\circ}.$$                           |
+----------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| e.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image96.png){width="2.0891754155730533in" height="1.8024693788276465in"}                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                       |
| $${Let\ \underset{\sim}{F_{1}}and\ \underset{\sim}{F_{2}}\ be\ the\ 2\ forces.                                                                                                                                                                                                                        |
| }{\underset{\sim}{F_{1}} = \ 280\ cos\ 38{^\circ}\mathbf{i}\  + \ 280\ sin\ 38{^\circ}\mathbf{j\ } = \ 220.6\mathbf{i}\  + \ 172.4\mathbf{j}                                                                                                                                                          |
| }{\underset{\sim}{F_{2}} = \  - 350\ cos\ 76{^\circ}\mathbf{i\ } - \ 350\ sin\ 76{^\circ}\mathbf{j\ } = \  - 84.7\mathbf{i}\  - \ 339.6\mathbf{j}                                                                                                                                                     |
| }{Resultant\ force:\underset{\sim}{F} = \underset{\sim}{F_{1}} + \underset{\sim}{F_{2}} = \ 135.9\mathbf{i\ } - \ 167.2\mathbf{j}                                                                                                                                                                     |
| }{\left| \underset{\sim}{F} \right| = \ \sqrt{{135.9}^{2} + \ ( - 167.2)^{2}} = \ 215.5\ N                                                                                                                                                                                                            |
| }{Angle\ with\ horizontal:\ \tan^{- 1}\left( - \frac{167.2}{135.9} \right) = \  - 51{^\circ}                                                                                                                                                                                                          |
| }{\underset{\sim}{F}\ is\ in\ the\ 4th\ quadrant,\ so\ direction\ is\ 360{^\circ}\  - \ 51{^\circ}\  = \ 309{^\circ}.}$$                                                                                                                                                                              |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Mastery

8.  Three forces act on an object of mass 5 kg.\
    These forces are represented by the vectors
    $9\mathbf{i\ } - \ 2\mathbf{j},\ \  - 3\mathbf{i}\  + \ 10\mathbf{j}$
    and $18\mathbf{i}\  - \ \mathbf{j}.$\
    Calculate the magnitude and direction of the acceleration of the
    object.

$$Let\ the\ vectors\ be\ \underset{\sim}{a} = \ 9\mathbf{i}\  - \ 2\mathbf{j},\underset{\sim}{b} = \  - 3\mathbf{i}\  + \ 10\mathbf{j}\ and\ \underset{\sim}{c} = \ 18\mathbf{i}\  - \ \mathbf{j}.$$

$$and\ the\ resultant\ force\ be\ \underset{\sim}{F} = \underset{\sim}{a} + \underset{\sim}{b} + \underset{\sim}{c}$$

$${\underset{\sim}{F} = \ \left( 9\mathbf{i}\  - \ 2\mathbf{j} \right) + \ \left( - 3\mathbf{i}\  + \ 10\mathbf{j} \right) + \ \left( 18\mathbf{i}\  - \ \mathbf{j} \right)
}{= \ 9\mathbf{i}\  - \ 3\mathbf{i}\  + \ 18\mathbf{i}\  - \ 2\mathbf{j}\  + \ 10\mathbf{j}\  - \ \mathbf{j\ }
}{= \ 24\mathbf{i}\  + \ 7\mathbf{j}}$$

$$The\ magnitude\ of\ the\ resultant\ force\ is:$$

$${\left| \underset{\sim}{F} \right| = \ \sqrt{24^{2} + \ 7^{2}}
}{= \ \sqrt{576\  + \ 49}
}{= \ 25\ N}$$

$$The\ magnitude\ of\ acceleration\ of\ the\ object\ is:$$

$${|a| = \frac{\left| \underset{\sim}{F} \right|}{m}
}{= \frac{25}{5}
}{= \ 5\ m/s²}$$

$$The\ direction\ of\ the\ acceleration\ of\ the\ object\ is\ in\ the\ direction\ of\ the\ resultant\ force.$$

$${tan\ \theta\  = \frac{7}{24}
}{\theta\  = \ \tan^{- 1}\left( \frac{7}{24} \right)\ above\ the\ horizontal}$$

9.  The diagram shows an object of mass 5 kg being raised by forces of
    magnitude 75 N and 50 N.

    a.  Find the weight of the object.

    b.  Find, correct to the nearest newton, the magnitude of the
        resultant of the three forces acting on the object.

    c.  ![](media/Introduction to Vectors 2_Further operations with vectors/media/image97.png){width="1.4382720909886264in"
        height="1.5606080489938758in"}Find, correct to the nearest
        degree, the angle this resultant makes with the upward vertical
        direction.

a

The weight of the object is $5g\  = \ 5\  \times \ 9.8\  = \ 49\ N$

b

$$Let\ \underset{\sim}{F}\ represent\ the\ resultant\ force.$$

$${\underset{\sim}{F} = \ (50\ sin\ 40{^\circ}\  - \ 75\ sin\ 20{^\circ})\mathbf{i}\  + \ (50\ cos\ 40{^\circ}\  + \ 75\ cos\ 20{^\circ}\  - \ 5g)\mathbf{j}
}{\left| \underset{\sim}{F} \right| = \ \sqrt{(50\ sin\ 40{^\circ}\  - \ 75\ sin\ 20{^\circ})^{2} + \ (50\ cos\ 40{^\circ}\  + \ 75\ cos\ 20{^\circ}\  - \ 5g)^{2}}
}{= \ 60.13...}$$

$$The\ magnitude\ of\ the\ three\ forces\ acting\ on\ the\ object\ is\ 60\ N\ (correct\ to\ the\ nearest\ N).$$

c

$$The\ angle\ that\ \underset{\sim}{F}\ makes\ with\ the\ upward\ vertical\ direction\ is\ (90{^\circ}\  - \ \theta)\ where$$

$$\theta\  = \ \tan^{- 1}\left( \frac{50\ cos\ 40{^\circ}\  + \ 75\ cos\ 20{^\circ}\  - \ 5g}{50\ sin\ 40{^\circ}\  - \ 75\ sin\ 20{^\circ}} \right).$$

$$\theta\  = \ 83.80...{^\circ}$$

$$So\ the\ angle\ that\ \underset{\sim}{F}\ makes\ with\ the\ upward\ vertical\ direction\ is\ 6{^\circ}\ (correct\ to\ the\ nearest\ degree).$$

10. In the diagram, a flowerpot of mass $m$ kg is hung from a ceiling by
    two chains.\
    Let the tensions in the chains $AP$ and $BP$ be $T₁$ and $T₂$
    newtons respectively.\
    The third force acting at $P$ is the weight of the flowerpot.

    a.  By finding the horizontal component of the resultant of the
        three forces acting at $P$, show that $T₁\  = \ \sqrt{3}T₂$.

    b.  By finding the vertical component of the resultant of the three
        forces acting at $P$, show that
        $\sqrt{3}T₁\  + \ T₂\  = \ 19.6m$ newtons.

    c.  Find the mass of the flowerpot, given that $T₂\  = \ 98\ N$.

![](media/Introduction to Vectors 2_Further operations with vectors/media/image98.png){width="1.9444444444444444in"
height="1.40461176727909in"}a

$$In\ the\ horizontal\ direction,\ we\ have\ T₁\ cos\ 60{^\circ}\  = \ T₂\ cos\ 30{^\circ}.$$

$${\frac{T_{1}}{2}\  = \frac{\sqrt{3}T_{2}}{2}\ 
}{\ T_{1} = \ \sqrt{3}T_{2}\ }$$

b

$$In\ the\ vertical\ direction,\ we\ have\ T_{1}\ sin\ 60{^\circ}\  + \ T_{2}\ sin\ 30{^\circ}\  = \ 9.8m.$$

$${\frac{\sqrt{3}T_{2}}{2} + \frac{T_{2}}{2}\  = \ 9.8m\ 
}{\ \sqrt{3}T_{1}\  + \ T_{2}\  = \ 19.6m}$$

c

$$From\ part\ \mathbf{a}\ T_{1}\  = \ \sqrt{3}T_{2}\ and\ \sqrt{3}T_{1}\  + \ T_{2}\  = \ 19.6m$$

$${4T_{2}\  = \ 19.6m
}{T_{2}\  = \ 4.9m
}{given\ T_{2}\  = \ 98.
}{4.9m\  = \ 98.
}{m = 20}$$

$$So\ the\ mass\ of\ the\ flowerpot\ is\ 20\ kg.$$

11. Two forces, of magnitude $p$ newtons and $q$ newtons, have a
    resultant of $2\sqrt{7}$ N when they act at 90° to each other. When
    they act at 30° to each other, however, the magnitude of the
    resultant is $2\sqrt{13}$ N. Find the values of $p$ and $q$.

$$When\ the\ two\ forces\ act\ at\ 90{^\circ}\ to\ each\ other,\ the\ resultant\ force\ is\ 2\sqrt{7}\ N.$$

$${So\ p^{2} + \ q^{2} = \ \left( 2\sqrt{7} \right)^{2}.
}{p²\  + \ q²\  = \ 28\ (1)}$$

$$When\ the\ two\ forces\ act\ at\ 30{^\circ}\ to\ each\ other,\ the\ resultant\ force\ is\ 2\sqrt{13}\ N.$$

$$Using\ cosine\ rule:\ p^{2} + \ q^{2} - \ 2pq\ cos\ 150{^\circ}\  = \ \left( 2\sqrt{13} \right)^{2}.$$

$$p^{2} + \ q^{2} + \ \sqrt{3}pq\  = \ 52\ (2)$$

$$Sub\ (1)\ into\ (2):$$

$${28\  + \ \sqrt{3}pq\  = \ 52
}{\sqrt{3}pq\  = \ 24
}{q\  = \frac{24}{\sqrt{3}p}}$$

$$Sub\ q\  = \frac{24}{\sqrt{3}p}into\ p^{2} + \ q^{2} = \ 28:$$

$${p^{2} + \frac{576}{3p^{2}} = \ 28
}{p⁴\  + \ 192\  = \ 28p^{2}
}{p^{4} - \ 28p^{2} + \ 192\  = \ 0
}{\left( p^{2} - \ 16 \right)\left( p^{2} - \ 12 \right) = \ 0
}{p\  = \ 2\sqrt{3},\ 4\ (p\  > \ 0)
}{\therefore\ q\  = \ 4,\ 2\sqrt{3}
}{So\ p\  = \ 2\sqrt{3}\ and\ q\  = \ 4.}$$
