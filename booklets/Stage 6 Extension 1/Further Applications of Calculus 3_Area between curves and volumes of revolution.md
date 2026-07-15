  -------------------------------------------------------------------
  Mathematics Extension 1 Year 12
  -------------------------------------------------------------------
  **Further Calculus Skills**

  -------------------------------------------------------------------

+-------------------------+-----------------------------------+-------------------------+
| **Book 1**              | Further derivatives of functions  | Version: 260411         |
|                         |                                   |                         |
|                         | Techniques of integration         | Feedback:\              |
|                         |                                   | https://MrDingMaths.com |
+=========================+===================================+=========================+
| **Contents**                                                                          |
|                                                                                       |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                          |
|                                                                                       |
| [Learning Intention [3](#_Toc202480289)](#_Toc202480289)                              |
+---------------------------------------------------------------------------------------+

# Syllabus Content

**ME1-12-05** applies calculus to solve problems involving polynomials,
further rates of change, areas and volumes and differential equations

**Areas between curves and volumes of solids of revolution**

- Calculate areas of regions between curves determined by functions in
  both real-life and abstract contexts

- Examine a solid of revolution whose boundary is formed by rotating an
  arc of a function about the $x$-axis or $y$-axis with and without
  graphing applications

- Calculate the volume of a solid of revolution formed by rotating a
  region in the plane about the $x$-axis or $y$-axis in both real-life
  and abstract contexts

- Calculate the volume of a solid of revolution formed by rotating the
  region between two curves about either the $x$-axis or $y$-axis in
  both real-life and abstract contexts

# Volumes of Rotation

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                                                                                                                                                                                                                                                                                                                                                      |
+===================================================================================================================================================================================================================================================================================================================================================================================================================================================+
| - Calculate volume of solids                                                                                                                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| +-----------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+ |
| | a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image1.png){width="1.3868963254593176in" | b.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image2.png){width="0.9421095800524935in" | c.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image3.png){width="1.1363637357830272in" | |
| |     height="1.1811023622047243in"}                                                                                                            |     height="0.8863637357830271in"}                                                                                                            |     height="1.0745538057742783in"}                                                                                                            | |
| +===============================================================================================================================================+===============================================================================================================================================+===============================================================================================================================================+ |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| - Evaluate definite Integrals                                                                                                                                                                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| +-------------------------------+------------------------------------------------+                                                                                                                                                                                                                                                                                                                                                                |
| | a.                            | b.                                             |                                                                                                                                                                                                                                                                                                                                                                |
| |                               |                                                |                                                                                                                                                                                                                                                                                                                                                                |
| | $$\int_{1}^{4}{x^{2} - 3}dx$$ | $$\int_{1}^{4}e^{2x}dx$$                       |                                                                                                                                                                                                                                                                                                                                                                |
| |                               |                                                |                                                                                                                                                                                                                                                                                                                                                                |
| | 12                            | $$\frac{e^{8} - e^{2}}{2}$$                    |                                                                                                                                                                                                                                                                                                                                                                |
| +===============================+================================================+                                                                                                                                                                                                                                                                                                                                                                |
| | c.                            | d.                                             |                                                                                                                                                                                                                                                                                                                                                                |
| |                               |                                                |                                                                                                                                                                                                                                                                                                                                                                |
| | $$\int_{1}^{4}(x - 3)^{2}dx$$ | $$\int_{1}^{4}\left( x^{2} - 3 \right)^{2}dx$$ |                                                                                                                                                                                                                                                                                                                                                                |
| |                               |                                                |                                                                                                                                                                                                                                                                                                                                                                |
| | 3                             | $$\frac{528}{5}$$                              |                                                                                                                                                                                                                                                                                                                                                                |
| +-------------------------------+------------------------------------------------+                                                                                                                                                                                                                                                                                                                                                                |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Volume of solids of revolution                                                                                                                                                                                                                                    |
+===========================================================================================================================================+===========================================================================================================================================+
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image4.png){width="5.989583333333333in" height="1.867361111111111in"}When you rotate the area under a curve around an axis, you create a **solid of revolution**.                    |
|                                                                                                                                                                                                                                                                                       |
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image5.png){width="1.15in" height="1.086842738407699in"}This solid is made up of thin circular slices.                                                                               |
|                                                                                                                                                                                                                                                                                       |
| The radius of each slice is: ..................                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                       |
| The thickness of each slice is: ...............                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                       |
| So, the volume of each slice is: ..................                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                       |
| We add up every slice between $x = a$ and $x = b,$ which is equivalent to integrating:                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                       |
| $${V = \int_{a}^{b}{\pi\left\lbrack f(x) \right\rbrack^{2}}dx                                                                                                                                                                                                                         |
| }{= \pi\int_{a}^{b}\left\lbrack f(x) \right\rbrack^{2}dx}$$                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                       |
| Let's use this formula to derive the volumes of a cone and sphere:                                                                                                                                                                                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image6.png){width="1.6689643482064742in" | ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image7.png){width="2.0603444881889765in" |
| height="1.56746062992126in"}                                                                                                              | height="1.57505249343832in"}                                                                                                              |
+-------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------+
| - **Volume of Solids Rotated about** $\mathbf{x}$ **axis**                                                                               |
+==========================================================================================================================================+
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image8.png){width="4.552083333333333in" |
| height="1.972409230096238in"}Rotating $y = f(x)$ about $x$-axis\                                                                         |
| between $x = a$ and $x = b$:                                                                                                             |
|                                                                                                                                          |
| $$\ \ \ \ \ \ V = \pi\int_{a}^{b}y^{2}dx$$                                                                                               |
+------------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate volumes of rotation about $x$-axis                                                                               |
+==========================================================================================================================================+
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image9.png){width="2.245459317585302in" |
| height="2.8131539807524057in"}Find the volume of the solid formed when the line $y = 3x - 2$\                                            |
| is rotated about the $x$-axis from $x = 1$ to $x = 2$                                                                                    |
|                                                                                                                                          |
| $$V = \pi\int_{1}^{2}(3x - 2)^{2}dx$$                                                                                                    |
|                                                                                                                                          |
| $$\ \ \ \  = \pi\left\lbrack \frac{(3x - 2)^{3}}{9} \right\rbrack_{1}^{2}$$                                                              |
|                                                                                                                                          |
| $$\ \ \ \  = \frac{\pi}{9}\left\lbrack \ \ (3x - 2)^{3}\begin{matrix}                                                                    |
| \  \\                                                                                                                                    |
| \  \\                                                                                                                                    |
| \                                                                                                                                        |
| \end{matrix} \right\rbrack_{1}^{2}$$                                                                                                     |
|                                                                                                                                          |
| $$\ \ \ \  = \frac{\pi}{9}\left( 4^{3} - 1^{3} \right)$$                                                                                 |
|                                                                                                                                          |
| $$\ \ \ \  = 7\pi\ {units}^{3}$$                                                                                                         |
+------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                                                                                                                                                                 |
+===========================================================================================================================================+===========================================================================================================================================+
| Find the volume of the solid formed by rotating:                                                                                                                                                                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $x^{2} + y^{2} = 9$\                                                                                                                  | b.  $y = e^{x}$\                                                                                                                          |
|     between $x = 1$\                                                                                                                      |     between $x = 0$\                                                                                                                      |
|     and $x = 3$.                                                                                                                          |     and $x = 2$.                                                                                                                          |
|                                                                                                                                           |                                                                                                                                           |
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image10.png){width="1.646175634295713in" | ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image11.png){width="1.628338801399825in" |
| height="1.5748031496062993in"}                                                                                                            | height="1.6013331146106737in"}                                                                                                            |
|                                                                                                                                           |                                                                                                                                           |
| $$\frac{28\pi}{3}\ u^{3}$$                                                                                                                | $$\frac{\pi}{2}\left( e^{4} - 1 \right)\ u^{3}$$                                                                                          |
+-------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------+
| - **Volume of Solids Rotated about** $\mathbf{y}$ **axis**                                                                                                                                                                                                                            |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image12.png){width="4.490117016622922in" height="1.972409230096238in"}Rotating $x = f(y)$ about $y$-axis\                                                                            |
| between $x = a$ and $x = b$:                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                       |
| $$\ \ \ \ \ \ V = \pi\int_{a}^{b}x^{2}dy$$                                                                                                                                                                                                                                            |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate volumes of rotation about $y$-axis                                                                                |
+===========================================================================================================================================+
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image13.png){width="2.245459317585302in" |
| height="2.1405304024496936in"}Find the volume of the solid formed when the line $y = x^{2} - 1$\                                          |
| is rotated about the $y$-axis from $y = - 1$ to $y = 3$                                                                                   |
|                                                                                                                                           |
| $$x^{2} = y + 1$$                                                                                                                         |
|                                                                                                                                           |
| $$V = \pi\int_{- 1}^{3}{y + 1}dy$$                                                                                                        |
|                                                                                                                                           |
| $$\ \ \ \  = \pi\left\lbrack \frac{y^{2}}{2} + y \right\rbrack_{- 1}^{3}$$                                                                |
|                                                                                                                                           |
| $$\ \ \ \ \  = \pi\left( \left( \frac{9}{2} + 3 \right) - \left( \frac{1}{2} - 1 \right) \right)$$                                        |
|                                                                                                                                           |
| $$\ \ \ \  = 8\pi\ {units}^{3}$$                                                                                                          |
+-------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                                                                                                                                                                   |
+============================================================================================================================================+============================================================================================================================================+
| Find the volume of the solid formed by rotating these regions about the $y$ axis:                                                                                                                                                                                                       |
+--------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $y = 5 - x^{2}$\                                                                                                                       | b.  $y = 3 - 2x$\                                                                                                                          |
|     between $y = 0$\                                                                                                                       |     between $y = - 1$\                                                                                                                     |
|     and $y = 5$.                                                                                                                           |     and $y = 3$.                                                                                                                           |
|                                                                                                                                            |                                                                                                                                            |
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image14.png){width="1.7668219597550305in" | ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image15.png){width="1.7131944444444445in" |
| height="1.9166666666666667in"}                                                                                                             | height="1.9801563867016623in"}                                                                                                             |
|                                                                                                                                            |                                                                                                                                            |
| $$\frac{25\pi}{2}\ u^{3}$$                                                                                                                 | $$\frac{16\pi}{3}\ u^{3}$$                                                                                                                 |
+--------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  a.  Consider the region bounded by the line $y\  = \ 3x$\
        and the $x$-axis between $x\  = \ 0$ and $x\  = \ 3$.

    b.  When this region is rotated about the $x$-axis, a right circular
        cone is formed.\
        Find the radius and height of the cone and hence find its volume
        using $V = \frac{1}{3}\pi r^{2}h$

    c.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image16.png){width="2.234722222222222in"
        height="2.1907370953630796in"}Evaluate
        $\pi\int_{0}^{3}{9x^{2}}dx$ to check your answer.

$$At\ x\  = \ 3:\ y\  = \ 9,\ so\ r\  = \ 9,\ h\  = \ 3.$$

$$V\  = \frac{1}{3}\pi\left( 9^{2} \right)(3) = \ 81\pi\ u^{3}$$

$$\pi\int_{0}^{3}{9x^{2}}dx\  = \ \pi\left\lbrack 3x^{3} \right\rbrack_{0}^{3} = \ 81\pi\ u^{3}\ $$

2.  a.  Consider the region bounded by the curve
        $y = \sqrt{9\  - \ x^{2}}$\
        and the $x$-axis between $x = - 3$ and $x = 3$.

    b.  When this region is rotated about the $x$-axis, a sphere is
        formed.\
        Find the radius of the sphere and hence find its volume using
        $V = \frac{4}{3}\pi r^{3}$

    c.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image17.png){width="2.5909087926509184in"
        height="1.695653980752406in"}Evaluate
        $\pi\int_{- 3}^{3}\left( 9\  - \ x^{2} \right)dx$ to check your
        answer.

$$r\  = \ 3.$$

$$V\  = \ \left( \frac{4}{3} \right)\pi\left( 3^{3} \right) = \ 36\pi\ u^{3}$$

$$\pi\int_{- 3}^{3}\left( 9\  - \ x^{2} \right)dx\  = \ \pi\left\lbrack 9x\  - \frac{x^{3}}{3} \right\rbrack_{- 3}^{3}$$

$$= \ \pi(18\  + \ 18) = \ 36\pi\ u^{3}$$

3.  Calculate the volume generated when each shaded region is rotated
    about the $x$-axis.

+------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image18.png){width="1.6379899387576553in" | b.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image18.png){width="1.6379899387576553in"                               | c.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image18.png){width="1.6379899387576553in" |
|     height="1.5748031496062993in"}                                                                                                             |     height="1.5748031496062993in"}                                                                                                                                           |     height="1.5748031496062993in"}                                                                                                             |
|                                                                                                                                                |                                                                                                                                                                              |                                                                                                                                                |
| $$16\pi\ u^{3}$$                                                                                                                               | $$9\pi\ u^{3}$$                                                                                                                                                              | $$\frac{32\pi}{5}\ u^{3}$$                                                                                                                     |
+================================================================================================================================================+==============================================================================================================================================================================+================================================================================================================================================+
| d.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image18.png){width="1.6379899387576553in" | e.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image18.png){width="1.6379899387576553in"                               | f.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image18.png){width="1.6379899387576553in" |
|     height="1.5748031496062993in"}                                                                                                             |     height="1.5748031496062993in"}                                                                                                                                           |     height="1.5748031496062993in"}                                                                                                             |
|                                                                                                                                                |                                                                                                                                                                              |                                                                                                                                                |
| $$6\pi\ u^{3}$$                                                                                                                                | $$\frac{16\pi}{3}\ u^{3}$$                                                                                                                                                   | $$\frac{\pi}{7}\ u^{3}$$                                                                                                                       |
+------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+
| g.                                                                                                                                             | h.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image18.png){width="1.6375in"                                           |                                                                                                                                                |
|                                                                                                                                                |     height="1.5743055555555556in"}![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image18.png){width="1.6379899387576553in" |                                                                                                                                                |
| $$9\pi\ u^{3}$$                                                                                                                                |     height="1.5748031496062993in"}                                                                                                                                           |                                                                                                                                                |
|                                                                                                                                                |                                                                                                                                                                              |                                                                                                                                                |
|                                                                                                                                                | $$16\pi\ u^{3}$$                                                                                                                                                             |                                                                                                                                                |
+------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+

4.  Calculate the volume generated when each shaded region is rotated
    about the $y$-axis.

+-----------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image19.png){width="1.546874453193351in" | b.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image19.png){width="1.546874453193351in" | c.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image19.png){width="1.546874453193351in" |
|     height="1.5742180664916885in"}                                                                                                            |     height="1.5742180664916885in"}                                                                                                            |     height="1.5742180664916885in"}                                                                                                            |
|                                                                                                                                               |                                                                                                                                               |                                                                                                                                               |
| $$3\pi\ u^{3}$$                                                                                                                               | $$\frac{256\pi}{3}\ u^{3}$$                                                                                                                   | $$8\pi\ u^{3}$$                                                                                                                               |
+===============================================================================================================================================+===============================================================================================================================================+===============================================================================================================================================+
| d.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image19.png){width="1.546874453193351in" | e.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image19.png){width="1.546874453193351in" | f.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image19.png){width="1.546874453193351in" |
|     height="1.5742180664916885in"}                                                                                                            |     height="1.5742180664916885in"}                                                                                                            |     height="1.5742180664916885in"}                                                                                                            |
|                                                                                                                                               |                                                                                                                                               |                                                                                                                                               |
| $$\frac{\pi}{2}\ u^{3}$$                                                                                                                      | $$\frac{256\pi}{3}\ u^{3}$$                                                                                                                   | $$\frac{243\pi}{5}\ u^{3}$$                                                                                                                   |
+-----------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+
| g.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image19.png){width="1.546874453193351in" | h.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image19.png){width="1.546874453193351in" |                                                                                                                                               |
|     height="1.5742180664916885in"}                                                                                                            |     height="1.5742180664916885in"}                                                                                                            |                                                                                                                                               |
|                                                                                                                                               |                                                                                                                                               |                                                                                                                                               |
| $$\frac{16\pi}{5}\ u^{3}$$                                                                                                                    | $$\frac{16\pi}{3}\ u^{3}$$                                                                                                                    |                                                                                                                                               |
+-----------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+

5.  The region between the curve $y = e^{x}$ and the $x$-axis from
    $x = 0$ to $x = 1$ is rotated about the\
    $x$-axis. Find the volume of the solid generated.

![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image20.png){width="1.7905107174103236in"
height="1.738821084864392in"}

$$V\  = \ \pi\int_{0}^{1}e^{2x}dx\  = \ \pi\left\lbrack \frac{e^{2x}}{2} \right\rbrack_{0}^{1}$$

$$= \ \left( \frac{\pi}{2} \right)\left( e^{2} - \ 1 \right)u^{3}$$

6.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image21.png){width="1.7822298775153105in"
    height="1.7408311461067367in"}Find the volume generated when the
    region between the curve $y\  = \frac{1}{\sqrt{x}}$ and the
    $x$-axis, from\
    $x = 2$ to $x = 4$, is rotated about the $x$-axis.

$$y^{2} = \frac{1}{x}$$

$$V\  = \ \pi\int_{2}^{4}\left( \frac{1}{x} \right)dx\  = \ \pi\lbrack ln\ x\rbrack_{2}^{4}$$

$$= \ \pi\ ln\ 2\ u^{3}$$

7.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image22.png){width="1.7819444444444446in"
    height="1.7305555555555556in"}The region between the curve
    $y\  = \frac{1}{x^{2}}$ (a truncus) and the $y$-axis from $y = 1$ to
    $y = 6$ is rotated about the $y$-axis. Calculate the exact volume of
    the solid formed.

$$x^{2} = \frac{1}{y}$$

$$V\  = \ \pi\int_{1}^{6}\left( \frac{1}{y} \right)dy\  = \ \pi\lbrack ln\ y\rbrack_{1}^{6}$$

$$= \ \pi\ ln\ 6\ u^{3}$$

Development

8.  a.  Write $\tan ²x$ in terms of $\sec ²x.$

    b.  The region bounded by the curve $y = \tan\ x$, the $x$-axis and
        the vertical line $x\  = \frac{\pi}{3}$ is rotated about the
        $x$-axis. Find the volume of the solid generated.

$$a\ \tan ²x\  = \ \sec ²x\  - \ 1$$

$$V\  = \ \pi\int_{0}^{\frac{\pi}{3}}\left( sec^{2}x\  - \ 1 \right)dx\  = \ \pi\lbrack tan\ x\  - \ x\rbrack_{0}^{\frac{\pi}{3}}$$

$$= \ \pi\left( \sqrt{3} - \frac{\pi}{3} \right)u^{3}$$

9.  a.  Write $\sin ²x$ in terms of $\cos\ 2x$.

    b.  The region bounded by the curve $y\  = \ \sin\ x$, the $x$-axis
        and the vertical line $x\  = \frac{\pi}{2}$ is rotated about the
        $x$-axis. Find the volume of the solid generated.

$$\sin^{2}x\  = \frac{1}{2} - \frac{1}{2}\cos\ 2x$$

$$V\  = \ \pi\int_{0}^{\frac{\pi}{2}}\left( \frac{1}{2} - \ \left( \frac{1}{2} \right)\cos\ 2x \right)dx\  = \ \pi\left\lbrack \frac{x}{2} - \frac{\sin\ 2x}{4} \right\rbrack_{0}^{\frac{\pi}{2}}$$

$$= \frac{\pi^{2}}{4}u^{3}$$

10. Find the volume of the solid formed by rotating the region with the
    given boundaries about the $x$-axis. (A sketch of each region will
    be needed.)

+-----------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| a.  $y = x + 3,x = 3,x = 5,y = 0$                                                                                     | b.  $y = 1 + \sqrt{x},x = 1,x = 4,y = 0$                                                                          |
|                                                                                                                       |                                                                                                                   |
| $$V\  = \ \pi\int_{3}^{5}(x\  + \ 3)^{2}dx\ $$                                                                        | $$V\  = \ \pi\int_{1}^{4}\left( 1\  + \ 2x^{\frac{1}{2}} + \ x \right)dx\ $$                                      |
|                                                                                                                       |                                                                                                                   |
| $$= \ \pi\left\lbrack \frac{(x\  + \ 3)^{3}}{3} \right\rbrack_{3}^{5}$$                                               | $$= \ \pi\left\lbrack x\  + \ \left( \frac{4}{3} \right)x^{\frac{3}{2}} + \frac{x^{2}}{2} \right\rbrack_{1}^{4}$$ |
|                                                                                                                       |                                                                                                                   |
| $$= \frac{296\pi}{3}u^{3}$$                                                                                           | $$= \frac{119\pi}{6}u^{3}$$                                                                                       |
+=======================================================================================================================+===================================================================================================================+
| c.  $y = 5x - x^{2},y = 0$                                                                                            | d.  $y = x^{3} - x,y = 0$                                                                                         |
|                                                                                                                       |                                                                                                                   |
| Zeros at $x\  = \ 0,\ 5.$                                                                                             | Zeros at $x\  = \  - 1,\ 0,\ 1;\ (x³\  - \ x)²$ is even,                                                          |
|                                                                                                                       |                                                                                                                   |
| $$V\  = \ \pi\int_{0}^{5}\left( 25x^{2} - \ 10x^{3} + \ x^{4} \right)dx\ $$                                           | so integrate on \[0, 1\] and double.                                                                              |
|                                                                                                                       |                                                                                                                   |
| $$= \ \pi\left\lbrack \frac{25x^{3}}{3} - \ \left( \frac{5}{2} \right)x^{4} + \frac{x^{5}}{5} \right\rbrack_{0}^{5}$$ | $$V\  = \ 2\pi\int_{0}^{1}\left( x^{6} - \ 2x^{4} + \ x^{2} \right)dx\ $$                                         |
|                                                                                                                       |                                                                                                                   |
| $$= \frac{625\pi}{6}u^{3}$$                                                                                           | $$= \ 2\pi\left\lbrack \frac{x^{7}}{7} - \frac{2x^{5}}{5} + \frac{x^{3}}{3} \right\rbrack_{0}^{1}$$               |
|                                                                                                                       |                                                                                                                   |
|                                                                                                                       | $$= \frac{16\pi}{105}u³$$                                                                                         |
+-----------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------+

mastery

11. Find the volume of the solid formed by rotating the region with the
    given boundaries about the $y$-axis. (A sketch of each region will
    be needed.)

+------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------+
| a.  $x = y - 2,y = 1,x = 0$                                                                                | b.  $x = y² + 1,y = 0,y = 1,x = 0$                                                     |
|                                                                                                            |                                                                                        |
| $x\  = \ 0\$when $y\  = \ 2$; radius $= \ 2\  - \ y$ for $y\  \in \ \lbrack 1,\ 2\rbrack.$                 | $$V\  = \ \pi\int_{0}^{1}\left( y^{2} + \ 1 \right)^{2}dy\ $$                          |
|                                                                                                            |                                                                                        |
| $$V\  = \ \pi\int_{1}^{2}(2\  - \ y)^{2}dy\ $$                                                             | $$= \ \pi\int_{0}^{1}\left( y^{4} + \ 2y^{2} + \ 1 \right)dy\ $$                       |
|                                                                                                            |                                                                                        |
| $$= \ \pi\left\lbrack - \frac{(2\  - \ y)^{3}}{3} \right\rbrack_{1}^{2}$$                                  | $$= \ \pi\left\lbrack \frac{y^{5}}{5} + \frac{2y^{3}}{3} + \ y \right\rbrack_{0}^{1}$$ |
|                                                                                                            |                                                                                        |
| $$= \frac{\pi}{3}u^{3}$$                                                                                   | $$= \frac{28\pi}{15}u^{3}$$                                                            |
+============================================================================================================+========================================================================================+
| c.  $x = y(y - 3),x = 0$                                                                                   | d.  $y = 1 - x²,y = 0$                                                                 |
|                                                                                                            |                                                                                        |
| $x\  = \ y(y\  - \ 3)\  \leq \ 0$ on $(0,\ 3);$ radius $= \ y(3\  - \ y)$.                                 | $x²\  = \ 1\  - \ y,\ y$ from 0 to 1.                                                  |
|                                                                                                            |                                                                                        |
| $$V\  = \ \pi\int_{0}^{3}{y^{2}(3\  - \ y)^{2}}dy\ $$                                                      | $$V\  = \ \pi\int_{0}^{1}(1\  - \ y)dy\ $$                                             |
|                                                                                                            |                                                                                        |
| $$= \ \pi\int_{0}^{3}\left( 9y^{2} - \ 6y^{3} + \ y^{4} \right)dy$$                                        | $$= \ \pi\left\lbrack y\  - \frac{y^{2}}{2} \right\rbrack_{0}^{1}$$                    |
|                                                                                                            |                                                                                        |
| $$= \ \pi\left\lbrack 3y^{3} - \ \left( \frac{3}{2} \right)y^{4} + \frac{y^{5}}{5} \right\rbrack_{0}^{3}$$ | $$= \frac{\pi}{2}u^{3}$$                                                               |
|                                                                                                            |                                                                                        |
| $$= \frac{81\pi}{10}u^{3}$$                                                                                |                                                                                        |
+------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------+

12. A vat is designed by rotating about the $x$-axis the region between
    the curve $y = 1 + \frac{1}{x}$ and the $x$-axis from
    $x = \frac{1}{2}$ to $x = 3$. Show that its volume is
    $\left( \frac{\pi}{6} \right)\left( 25\  + \ 12\ \ln\ 6 \right)\ u³$.

$$V\  = \ \pi\int_{\frac{1}{2}}^{3}\left( 1\  + \frac{2}{x} + \frac{1}{x^{2}} \right)dx\  = \ \pi\left\lbrack x\  + \ 2\ ln\ x\  - \frac{1}{x} \right\rbrack_{\frac{1}{2}}^{3}\ $$

$$= \ \pi\left( \left( \frac{8}{3} + \ 2\ \ln\ 3 \right) - \ \left( - \frac{3}{2} - \ 2\ \ln\ 2 \right) \right)$$

$$= \frac{\pi}{6}\left( 25\  + \ 12\ \ln\ 6 \right)$$

13. A metal stud is created by rotating about the $x$-axis the region
    between the curve $y\  = \ e^{x}\  - \ e^{- x}$ and the $x$-axis
    from $x = 0$ to $x = \frac{1}{2}$. Show that the volume of the stud
    is
    $\left( \frac{\pi}{2} \right)\left( e - 2 - e^{- 1} \right)\ u^{3}.$

$$y^{2} = \ e^{2x} - \ 2\  + \ e^{- 2x}$$

$$V\  = \ \pi\int_{0}^{\frac{1}{2}}\left( e^{2x} - \ 2\  + \ e^{- 2x} \right)dx\ $$

$$= \ \pi\left\lbrack \frac{e^{2x}}{2} - \ 2x\  - \frac{e^{- 2x}}{2} \right\rbrack_{0}^{\frac{1}{2}}$$

$$= \ \pi\left( \frac{e}{2} - \ 1\  - \frac{e^{- 1}}{2} \right) = \ \frac{\pi}{2}\left( e\  - \ 2\  - \ e^{- 1} \right)$$

14. A champagne flute is designed by rotating about the $x$-axis the
    region between the curve
    $y\  = \ 4\  + \ 4\ \sin\left( \frac{x}{4} \right)$ and the $x$-axis
    from$\ x = 4\pi$ to $x = 6\pi$. Find, correct to 4 significant
    figures, the capacity of the flute if 1 unit = 1 cm.

$$y^{2} = \ 16\left( 1\  + \ \sin\left( \frac{x}{4} \right) \right)^{2}$$

$$= 16\left( 1 + 2\sin\left( \frac{x}{4} \right) + \sin^{2}\left( \frac{x}{4} \right) \right)$$

Using double angle rule:
$\sin^{2}\left( \frac{x}{4} \right) = \frac{1}{2} - \frac{1}{2}\cos\left( \frac{x}{2} \right)$

$$= \ 16\left( \frac{3}{2} + \ 2\ \sin\left( \frac{x}{4} \right) - \frac{1}{2}\cos\left( \frac{x}{2} \right) \right)$$

$$V\  = \ 16\pi\int_{4\pi}^{6\pi}\left( \frac{3}{2} + \ 2\ \sin\left( \frac{x}{4} \right) - \frac{1}{2}\cos\left( \frac{x}{2} \right) \right)\ dx$$

$$= \ 16\pi\left\lbrack \frac{3x}{2} - \ 8\ \cos\left( \frac{x}{4} \right) - \ \sin\left( \frac{x}{2} \right) \right\rbrack_{4\pi}^{6\pi}$$

$$= \ 16\pi(3\pi\  - \ 8) \approx \ 71.62\ mL$$

# Rotating Area between Two Curves

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                                                                                                                                                                                                        |
+=====================================================================================================================================================================================================================================================================================================+
| - Calculate area between two curves                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                                     |
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image23.png){width="1.76875in" height="1.6194444444444445in"} Find the area enclosed between the curve $y\  = \ x^{2}$ and the line $y = x + 2$                                                    |
|                                                                                                                                                                                                                                                                                                     |
| 4.5 u²                                                                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                     |
| - Calculate volume of solid of revolution                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                     |
| > Rotate the given region about the $x$ axis.                                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                     |
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image24.png){width="1.8888888888888888in" height="1.50625in"}                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                     |
| $$\frac{81\pi}{40}\ u^{3}$$                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                     |
| - Calculate area of an annulus                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                     |
| +------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+ |
| | a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image25.png){width="0.9992979002624672in" | b.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image26.png){width="1.2376574803149607in" | |
| |     height="0.9763265529308837in"}                                                                                                             |     height="1.2179494750656168in"}                                                                                                             | |
| +================================================================================================================================================+================================================================================================================================================+ |
|                                                                                                                                                                                                                                                                                                     |
| - Calculate volume of composite solid                                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                     |
| +------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------+  |
| | a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image27.png){width="1.4038451443569553in" | b.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image28.png){width="1.602564523184602in" |  |
| |     height="1.3849398512685913in"}                                                                                                             |     height="0.818986220472441in"}                                                                                                             |  |
| +================================================================================================================================================+===============================================================================================================================================+  |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Volume of solids of revolution: area between curves                                                                    |
+============================================================================================================================================+
| When you rotate the area between two curves around an axis, you create a hollow solid:                                                     |
|                                                                                                                                            |
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image29.png){width="6.154797681539807in"  |
| height="1.8158136482939633in"}                                                                                                             |
|                                                                                                                                            |
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image30.png){width="2.2506944444444446in" |
| height="1.8152777777777778in"}The cross-section of this solid is an **annulus**. Consider $g(x) \geq f(x)$:                                |
|                                                                                                                                            |
| The outer radius is: ...............                                                                                                       |
|                                                                                                                                            |
| The inner radius is: ...............                                                                                                       |
|                                                                                                                                            |
| The area of the annulus is: ..................                                                                                             |
|                                                                                                                                            |
| The volume of a slice is: ..................                                                                                               |
|                                                                                                                                            |
| We add up every slice between $x = a$ and $x = b,$ which is equivalent to integrating:                                                     |
|                                                                                                                                            |
| $${V = \int_{a}^{b}{\pi\left( \left\lbrack g(x) \right\rbrack^{2} - \left\lbrack f(x) \right\rbrack^{2} \right)}dx                         |
| }{V = \pi\int_{a}^{b}{\left\lbrack g(x) \right\rbrack^{2} - \left\lbrack f(x) \right\rbrack^{2}}dx}$$                                      |
+--------------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Volumes of Revolution: Area between two curves**                                                                                                                                                                                     |
+:========================================================================================================================================================================:+:=============================================================:+
| **Rotation about** $\mathbf{x}$ **axis**                                                                                                                                 | **Rotation about** $\mathbf{y}$ **axis**                      |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------+
| $$y_{2} \geq y_{1}$$                                                                                                                                                     | $$x_{2} \geq x_{1}$$                                          |
|                                                                                                                                                                          |                                                               |
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image31.png){width="1.7958333333333334in"                               | $$V = \pi\int_{a}^{b}\left( x_{2}^{2} - x_{1}^{2} \right)dy$$ |
| height="1.9770833333333333in"}![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image31.png){width="2.8032819335083117in" |                                                               |
| height="1.6636854768153981in"}                                                                                                                                           |                                                               |
|                                                                                                                                                                          |                                                               |
| $$V = \pi\int_{a}^{b}\left( y_{2}^{2} - y_{1}^{2} \right)dx$$                                                                                                            |                                                               |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate volume of solids of revolution: area between curves                                                                |
+============================================================================================================================================+
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image32.png){width="1.7715277777777778in" |
| height="1.7291666666666667in"}The area between the curve $y = 4 - x^{2}$ and the line $y = 4 - 2x$ between $x = 0$ and $x = 2$ are rotated |
| about the $x$-axis. Find the volume generated.                                                                                             |
|                                                                                                                                            |
| $$V = \pi\int_{0}^{2}\left( y_{2}^{2} - y_{1}^{2} \right)dx\ \ \ \ \ \ where\ y_{2} = 4 - x^{2}\ and\ y_{1} = 4 - 2x$$                     |
|                                                                                                                                            |
| $$\ \ \ \  = \pi\int_{0}^{2}\left( \left( 4 - x^{2} \right)^{2} - (4 - 2x)^{2} \right)dx$$                                                 |
|                                                                                                                                            |
| $$\ \ \ \  = \pi\int_{0}^{2}\left( x^{4} - 12x^{2} + 16x \right)dx$$                                                                       |
|                                                                                                                                            |
| $$\ \ \ \  = \pi\left\lbrack \frac{x^{5}}{5} - 4x^{3} + 9x^{2} \right\rbrack_{0}^{2}$$                                                     |
|                                                                                                                                            |
| $$\ \ \ \  = \pi\left( \frac{32}{5} - 32 + 32 - (0 - 0 + 0) \right)$$                                                                      |
|                                                                                                                                            |
| $$\ \ \ \  = \frac{32\pi}{5}\ u^{3}$$                                                                                                      |
+--------------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                          |
+================================================================================================================================================+
| a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image33.png){width="2.160553368328959in"  |
|     height="1.968503937007874in"}The shaded region bounded by $y = (x - 2)^{2}$ and $y = 4$ between $x = 0$ and $x = 4$ is rotated about the   |
|     $x$ axis. Find the volume of this solid.                                                                                                   |
|                                                                                                                                                |
| $$\frac{256\pi}{5}\ u^{3}$$                                                                                                                    |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| b.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image32.png){width="1.7716535433070866in" |
|     height="1.7296916010498689in"}The area between $y = 4 - x^{2}$ and $y = 4 - 2x$ between $y = 0$ and $y = 4$ are rotated about the          |
|     $y$-axis. Find the volume generated.                                                                                                       |
|                                                                                                                                                |
| $$\frac{8\pi}{3}\ u^{3}$$                                                                                                                      |
+------------------------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Volume of solids of revolution: further area between curves                                                                                                                          |
+==========================================================================================================+===============================================================================================+
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image34.png){width="2.6084470691163606in" height="1.5183038057742781in"}If the domain of the two        |
| functions are different, you must use two separate integrals.                                                                                                                                            |
+----------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------+
| **Method 1: Split the region**                                                                           | **Method 2: Outer volume -- Inner volume**                                                    |
|                                                                                                          |                                                                                               |
| Where both curves exist:                                                                                 | $$V_{outer}\mathbf{=}\pi\int_{\mathbf{a}}^{\mathbf{c}}\left\lbrack g(x) \right\rbrack^{2}dx$$ |
|                                                                                                          |                                                                                               |
| $$V_{1} = \pi\int_{b}^{c}{\left\lbrack g(x) \right\rbrack^{2} - \left\lbrack f(x) \right\rbrack^{2}}dx$$ | $$V_{inner}\mathbf{=}\pi\int_{\mathbf{b}}^{\mathbf{c}}\left\lbrack f(x) \right\rbrack^{2}dx$$ |
|                                                                                                          |                                                                                               |
| Where only one curve exists:                                                                             | $$V_{total} = V_{outer} - V_{inner}$$                                                         |
|                                                                                                          |                                                                                               |
| $$V_{2} = \pi\int_{a}^{b}\left\lbrack g(x) \right\rbrack^{2}dx$$                                         |                                                                                               |
|                                                                                                          |                                                                                               |
| $$V_{total} = V_{1} + V_{2}$$                                                                            |                                                                                               |
+----------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------+
| The area bounded by $y = \sqrt{x - 1}$ and $y = \sqrt{x - 3}$ between $x = 1$ and $x = 5$ are rotated about the $x$ axis. Find the volume of the solid.                                                  |
|                                                                                                                                                                                                          |
| ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image35.png){width="2.3118602362204723in" height="1.56294728783902in"}                                  |
+----------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------+
| **Method 1**                                                                                             | **Method 2**                                                                                  |
|                                                                                                          |                                                                                               |
| $$6\pi\ u^{3}$$                                                                                          | $$6\pi\ u^{3}$$                                                                               |
+----------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------+

Foundation

1.  The region $R$ is bounded by the parabola$\ y\  = \ x²$ and the
    $x$-axis from $x\  = \ 0$ to $x\  = \ 4$.

We will calculate the volume of this region rotated around the $y$-axis
by:

a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image36.png){width="1.6020833333333333in"
    height="1.5743055555555556in"}Find the **outer volume:** cylinder
    formed when the region between the line $x\  = \ 4$ and the $y$-axis
    from $y = 0$ to $y = 16$ is rotated about\
    the $y$-axis.

$$V\  = \ \pi\left( 4^{2} \right)(16) = \ 256\pi\ u^{3}$$

b.  Find the **inner volume**: the region between the parabola $y = x²$
    and the $y$-axis from $y = 0$ to $y = 16$ is rotated about the
    $y$-axis.

x² = y; rotating about y-axis:

$$V\  = \ \pi\int_{0}^{16}ydy\  = \ \pi\left\lbrack \frac{y^{2}}{2} \right\rbrack_{0}^{16} = \ 128\pi\ u^{3}$$

c.  Hence use parts **a** and **b** to find the volume of the solid
    formed when $R$ is rotated about the $y$-axis.

$$V\  = \ 256\pi\  - \ 128\pi\  = \ 128\pi\ u³$$

d.  Calculate the same volume using
    $V = \pi\int_{a}^{b}\left( x_{2}^{2} - x_{1}^{2} \right)dy$

$$V = \pi\int_{0}^{16}4^{2} - y\ dy$$

$$= \pi\left\lbrack 16y - \frac{y^{2}}{2} \right\rbrack_{0}^{16}$$

$$= 128\pi\ u^{3}$$

2.  Find the volume of the solid generated by rotating each region
    about:

    i.  the $x$-axis

    ii. the $y$-axis

In some cases, a subtraction of volumes will be necessary.

a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image37.png){width="1.5416666666666667in"
    height="1.6236111111111111in"}

+---------------------------------------------------------------+----------------------------------------------------------------------+
| i.                                                            | ii.                                                                  |
|                                                               |                                                                      |
| $$V\  = \ \pi\int_{0}^{2}x^{4}dx$$                            | Outer radius 2, inner radius $\sqrt{y},\ y$ from 0 to 4:             |
|                                                               |                                                                      |
| $$= \ \pi\left\lbrack \frac{x^{5}}{5} \right\rbrack_{0}^{2}$$ | $$V\  = \ \pi\int_{0}^{4}(4\  - \ y)dy\ $$                           |
|                                                               |                                                                      |
| $$= \frac{32\pi}{5}u^{3}$$                                    | $$= \ \pi\left\lbrack 4y\  - \frac{y^{2}}{2} \right\rbrack_{0}^{4}$$ |
|                                                               |                                                                      |
|                                                               | $$= \ 8\pi\ u^{3}$$                                                  |
+===============================================================+======================================================================+

a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image37.png){width="1.5416666666666667in"
    height="1.6236111111111111in"}

+-------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------+
| i.                                                                      | ii.                                                                                                           |
|                                                                         |                                                                                                               |
| Outer radius 5, inner radius $5x,\ x$ from 0 to 1:                      | $x\  = \frac{y}{5},\ y$ from 0 to 5:                                                                          |
|                                                                         |                                                                                                               |
| $$V\  = \ \pi\int_{0}^{1}\left( 25\  - \ 25x^{2} \right)dx\ $$          | $$V\  = \ \pi\int_{0}^{5}\left( \frac{y}{5} \right)^{2}dy$$                                                   |
|                                                                         |                                                                                                               |
| $$= \ 25\pi\left\lbrack x\  - \frac{x^{3}}{3} \right\rbrack_{0}^{1}\ $$ | $$= \ \left( \frac{\pi}{25} \right)\left\lbrack \frac{y^{3}}{3} \right\rbrack_{0}^{5} = \frac{5\pi}{3}u^{3}$$ |
|                                                                         |                                                                                                               |
| $$= \frac{50\pi}{3}u^{3}$$                                              |                                                                                                               |
+=========================================================================+===============================================================================================================+

a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image37.png){width="1.5416666666666667in"
    height="1.6236111111111111in"}

+-----------------------------------------------------------------+-------------------------------------------------------------------------+
| i.                                                              | ii.                                                                     |
|                                                                 |                                                                         |
| $y\  = \ \sqrt{x}$, so $y²\  = \ x$:                            | Outer radius 4, inner radius $y²,\ y$ from 0 to 2:                      |
|                                                                 |                                                                         |
| $$V\  = \ \pi\int_{0}^{4}xdx\ $$                                | $$V\  = \ \pi\int_{0}^{2}\left( 16\  - \ y^{4} \right)dy\ $$            |
|                                                                 |                                                                         |
| $$= \ \pi\left\lbrack \frac{x^{2}}{2} \right\rbrack_{0}^{4}\ $$ | $$= \ \pi\left\lbrack 16y\  - \frac{y^{5}}{5} \right\rbrack_{0}^{2}\ $$ |
|                                                                 |                                                                         |
| $$= \ 8\pi\ u^{3}$$                                             | $$= \frac{128\pi}{5}u^{3}$$                                             |
+=================================================================+=========================================================================+

a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image37.png){width="1.5416666666666667in"
    height="1.6236111111111111in"}

+--------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| i.                                                                                                     | ii.                                                                                          |
|                                                                                                        |                                                                                              |
| Outer radius 4, inner radius $x²\  + \ 3,\ x$ from 0 to 1:                                             | $x²\  = \ y\  - \ 3,\ y$ from 3 to 4:                                                        |
|                                                                                                        |                                                                                              |
| $$V\  = \ \pi\int_{0}^{1}\left( 16\  - \ \left( x^{2} + \ 3 \right)^{2} \right)dx\ $$                  | $$V\  = \ \pi\int_{3}^{4}(y\  - \ 3)dy\ $$                                                   |
|                                                                                                        |                                                                                              |
| $$= \ \pi\int_{0}^{1}\left( 7\  - \ 6x^{2} - \ x^{4} \right)dx$$                                       | $$= \ \pi\left\lbrack \frac{(y\  - \ 3)^{2}}{2} \right\rbrack_{3}^{4} = \frac{\pi}{2}u^{3}$$ |
|                                                                                                        |                                                                                              |
| $$= \ \pi\left\lbrack 7x\  - \ 2x^{3} - \frac{x^{5}}{5} \right\rbrack_{0}^{1} = \frac{24\pi}{5}u^{3}$$ |                                                                                              |
+========================================================================================================+==============================================================================================+

Development

3.  a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image38.png){width="1.6253619860017499in"
        height="1.5748031496062993in"}Consider the region bounded by the
        curves $y\  = \ x²$ and $y\  = \ x³.$\
        Find the points of intersection.

$$x^{2} = x^{3}$$

$$x^{2}(x - 1) = 0$$

Intersections at $x = \ 0,\ x = 1$;

$\therefore(0,0)$ and $(1,1)$

b.  Find the volume of the solid generated when this region is rotated
    about:

+-------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+
| iii. the $x$-axis                                                                                                                         | iv. the $y$-axis                                                                                                                                           |
|                                                                                                                                           |                                                                                                                                                            |
| $$x²\  > \ x³\ on\ x \in (0,\ 1).$$                                                                                                       | $$y\  = \ x^{2} \rightarrow x\  = \ y^{\frac{1}{2}};\ $$                                                                                                   |
|                                                                                                                                           |                                                                                                                                                            |
| Outer radius $x²$, inner radius $x³:$                                                                                                     | $$y\  = \ x^{3} \rightarrow x\  = \ y^{\frac{1}{3}}.\ $$                                                                                                   |
|                                                                                                                                           |                                                                                                                                                            |
| $$V\  = \ \pi\int_{0}^{1}\left( x^{4} - \ x^{6} \right)dx\  = \ \pi\left\lbrack \frac{x^{5}}{5} - \frac{x^{7}}{7} \right\rbrack_{0}^{1}$$ | $For\ y \in \ (0,\ 1),\ y^{\frac{1}{3}} > \ y^{\frac{1}{2}},$                                                                                              |
|                                                                                                                                           |                                                                                                                                                            |
| $$= \frac{2\pi}{35}u^{3}$$                                                                                                                | outer radius $y^{\frac{1}{3}},$ inner radius $y^{\frac{1}{2}}:$                                                                                            |
|                                                                                                                                           |                                                                                                                                                            |
|                                                                                                                                           | $$V\  = \ \pi\int_{0}^{1}\left( y^{\frac{2}{3}} - \ y \right)dy\  = \ \pi\left\lbrack \frac{3y^{\frac{5}{3}}}{5} - \frac{y^{2}}{2} \right\rbrack_{0}^{1}$$ |
|                                                                                                                                           |                                                                                                                                                            |
|                                                                                                                                           | $$= \frac{\pi}{10}u^{3}$$                                                                                                                                  |
+===========================================================================================================================================+============================================================================================================================================================+

4.  a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image39.png){width="1.6101706036745407in"
        height="1.5748031496062993in"}Find the area of the region
        bounded by the parabola $y = x^{2}$ and the line $y = x + 2$.

Intersections:
$x²\  = \ x\  + \ 2\  \Longrightarrow \ x\  = \  - 1,\ x\  = \ 2$.

$$Area\  = \ \int_{- 1}^{2}\left( x\  + \ 2\  - \ x^{2} \right)dx\  = \ \left\lbrack \frac{x^{2}}{2} + \ 2x\  - \frac{x^{3}}{3} \right\rbrack_{- 1}^{2}$$

$$= \frac{10}{3} - \ \left( - \frac{7}{6} \right)$$

$$= \frac{9}{2}u^{2}\ $$

b.  The area bounded by the curve $y = x²$ and the line $y = x + 2$ is
    rotated about the $x$-axis. Find the exact volume of the solid
    formed.

Outer radius $= \ x\  + \ 2$, inner radius $= \ x²:$

$$V\  = \ \pi\int_{- 1}^{2}\left( (x\  + \ 2)^{2} - \ x^{4} \right)dx\  = \ \pi\int_{- 1}^{2}\left( x^{2} + \ 4x\  + \ 4\  - \ x^{4} \right)dx$$

$$= \ \pi\left\lbrack \frac{x^{3}}{3} + \ 2x^{2} + \ 4x\  - \frac{x^{5}}{5} \right\rbrack_{- 1}^{2}$$

$$= \ \pi\left( \frac{184}{15} - \ \left( - \frac{32}{15} \right) \right)$$

$$= \frac{72\pi}{5}u^{3}$$

5.  a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image40.png){width="1.6118055555555555in"
        height="1.5743055555555556in"}The graphs of $xy\  = \ 5$
        and$\ x + y = 6$ are shown. Find their points of intersection.

Intersections: $xy\  = \ 5$ and $x\  + \ y\  = \ 6\$give
$x\  = \ 1,\ x\  = \ 5.$

b.  Find the volume of the solid generated when the region bounded by
    the two curves is rotated about the $x$-axis.

Outer radius $= \ 6\  - \ x$, inner radius $= \frac{5}{x}$:

$$V\  = \ \pi\int_{1}^{5}\left( (6\  - \ x)^{2} - \ 25x^{- 2} \right)dx\ $$

$$= \ \pi\left\lbrack 36x\  - \ 6x^{2} + \frac{x^{3}}{3} + \frac{25}{x} \right\rbrack_{1}^{5}$$

$$= \frac{64\pi}{3}u^{3}$$

6.  a.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image41.png){width="1.6234886264216972in"
        height="1.5748031496062993in"}Find the area of the region
        bounded by the functions $y = x²,\ y\  = \ (x\  - \ 2)^{2}$, and
        the $x$-axis. Curves intersect at $x = 1;y = x²$ meets $x$-axis
        at $x = 0,\ y = (x - 2)²$ meets $x$-axis at $x = 2$.

$$Area\  = \ \int_{0}^{1}x^{2}dx\  + \ \int_{1}^{2}(x\  - \ 2)^{2}dx\  = \frac{1}{3} + \frac{1}{3}$$

$$= \frac{2}{3}u^{2}$$

b.  Find the volume of the solid of revolution formed when the area
    enclosed between\
    $y = x²,\ y = (x - 2)^{2}$, and the $x$-axis is rotated about the
    $x$-axis.

$$V\  = \ \pi\int_{0}^{1}x^{4}dx\  + \ \pi\int_{1}^{2}(x\  - \ 2)^{4}dx\ $$

$$= \frac{\pi}{5} + \frac{\pi}{5}$$

$$= \frac{2\pi}{5}u^{3}$$

7.  The region bounded by the hyperbola $y = 2 - \frac{2}{x}$, the
    vertical line $x = 1$, and the horizontal line $y\  = \ 1$ is
    rotated about the $x$-axis. Find the volume of the solid formed.

![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image42.png){width="1.60834864391951in"
height="1.5748031496062993in"}

$y\  = \ 1$ when $x\  = \ 2$; outer radius = 1, inner radius
$= \ 2\  - \frac{2}{x}$, $x$ from 1 to 2:

$$V\  = \ \pi\int_{1}^{2}\left( 1\  - \ \left( 2\  - \frac{2}{x} \right)^{2} \right)dx\  = \ \pi\int_{1}^{2}\left( - 3\  + \frac{8}{x} - \ 4x^{- 2} \right)dx$$

$$= \ \pi\left\lbrack - 3x\  + \ 8\ ln\ x\  + \frac{4}{x} \right\rbrack_{1}^{2}$$

$$= \ \pi(8\ ln\ 2\  - \ 5)\ u^{3}$$

Mastery

8.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image43.png){width="1.604621609798775in"
    height="1.5748031496062993in"}A rubber washer is generated by
    rotating the region between the curve $y = log_{e}\ x$, the
    $x$-axis, and the line $x = 2$ about the $y$-axis. Find the exact
    volume of the washer.

$x\  = \ e^{y}$; outer radius = 2, inner radius = $eʸ$, $y$ from 0 to
$\ln\ 2$:

$$V\  = \ \pi\int_{0}^{\ln\ 2}\left( 4\  - \ e^{2y} \right)dy\  = \ \pi\left\lbrack 4y\  - \frac{e^{2y}}{2} \right\rbrack_{0}^{ln\ 2}$$

$$= \ \pi\left( \left( 4\ \ln\ 2\  - \ 2 \right) - \ \left( - \frac{1}{2} \right) \right) = \frac{\pi}{2}\left( 8\ \ln\ 2\  - \ 3 \right)u^{3}$$

9.  a.  Find the equation of the tangent to the curve $y\  = \ x³ + 2$
        at the point where $x\  = \ 1$.

    b.  ![](media/Further Applications of Calculus 3_Area between curves and volumes of revolution/media/image44.png){width="1.6120767716535434in"
        height="1.5748031496062993in"}Draw a diagram showing the region
        bounded by the curve, the tangent, and the $y$-axis.

$y'\  = \ 3x²$; at $x\  = \ 1:\ y\  = \ 3,$ gradient = 3.

Tangent:$\ y - 3\  = \ 3(x - 1).$

$$y = 3x$$

c.  Calculate the volume of the solid formed when this region is rotated
    about:

+-------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| i.  the $x$-axis                                                                          | ii. the $y$-axis                                                                                                                                                     |
|                                                                                           |                                                                                                                                                                      |
| Outer radius $x³\  + \ 2$, inner radius $3x,\ x$ from 0 to 1:                             | For $y$ from 0 to 2:\                                                                                                                                                |
|                                                                                           | outer radius $=$ $\frac{y}{3}$ (tangent), inner radius = 0 ($y$-axis):                                                                                               |
| $$V\  = \ \pi\int_{0}^{1}\left( \left( x^{3} + \ 2 \right)^{2} - \ 9x^{2} \right)dx\ $$   |                                                                                                                                                                      |
|                                                                                           | $$V_{1} = \ \pi\int_{0}^{2}\left( \frac{y}{3} \right)^{2}dy\  = \ \left( \frac{\pi}{9} \right)\left\lbrack \frac{y^{3}}{3} \right\rbrack_{0}^{2} = \frac{8\pi}{27}$$ |
| $$= \ \pi\int_{0}^{1}\left( x^{6} + \ 4x^{3} - \ 9x^{2} + \ 4 \right)dx$$                 |                                                                                                                                                                      |
|                                                                                           | For $y$ from 2 to 3:\                                                                                                                                                |
| $$= \ \pi\left\lbrack \frac{x^{7}}{7} + \ x^{4} - \ 3x^{3} + \ 4x \right\rbrack_{0}^{1}$$ | outer radius $= \frac{y}{3}$, inner radius = $(y\  - \ 2)^{\frac{1}{3}}$                                                                                             |
|                                                                                           |                                                                                                                                                                      |
| $$= \frac{15\pi}{7}u^{3}$$                                                                | $$V_{2} = \ \pi\int_{2}^{3}\left( \left( \frac{y}{3} \right)^{2} - \ (y\  - \ 2)^{\frac{2}{3}} \right)dy\ $$                                                         |
|                                                                                           |                                                                                                                                                                      |
|                                                                                           | $$= \ \pi\left\lbrack \frac{y^{3}}{27} - \ \left( \frac{3}{5} \right)(y\  - \ 2)^{\frac{5}{3}} \right\rbrack_{2}^{3}$$                                               |
|                                                                                           |                                                                                                                                                                      |
|                                                                                           | $$= \ \pi\left( \left( 1\  - \frac{3}{5} \right) - \ \left( \frac{8}{27} - \ 0 \right) \right)$$                                                                     |
|                                                                                           |                                                                                                                                                                      |
|                                                                                           | $$= \ \pi\left( \frac{2}{5} - \frac{8}{27} \right) = \frac{14\pi}{135}$$                                                                                             |
|                                                                                           |                                                                                                                                                                      |
|                                                                                           | $$V\  = \frac{8\pi}{27} + \frac{14\pi}{135} = \frac{2\pi}{5}u^{3}$$                                                                                                  |
+===========================================================================================+======================================================================================================================================================================+
