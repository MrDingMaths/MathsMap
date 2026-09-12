  -------------------------------------------------------------------
  Mathematics Extension 1 Year 12
  -------------------------------------------------------------------
  **Differential Equations**

  -------------------------------------------------------------------

+--------------------------------+-----------------------------------+--------------------------------+
| **Book 1**                     | Differential equations            | Version: 260411                |
|                                |                                   |                                |
|                                |                                   | Feedback:\                     |
|                                |                                   | https://MrDingMaths.com        |
+================================+===================================+================================+
| **Contents**                                                                                        |
|                                                                                                     |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                                        |
|                                                                                                     |
| [Identifying DEs and Verifying Solutions                                                            |
| [3](#identifying-des-and-verifying-solutions)](#identifying-des-and-verifying-solutions)            |
|                                                                                                     |
| [Solving dy/dx = f(x) [6](#_Toc226795452)](#_Toc226795452)                                          |
|                                                                                                     |
| [Slope Fields [8](#_Toc226795453)](#_Toc226795453)                                                  |
|                                                                                                     |
| [Solving dy/dx = g(y) [19](#solving-dydx-gy)](#solving-dydx-gy)                                     |
|                                                                                                     |
| [Solving dy/dx = f(x)g(y) [20](#solving-dydx-fxgy)](#solving-dydx-fxgy)                             |
|                                                                                                     |
| [Review of Exponential Growth and Decay                                                             |
| [23](#review-of-exponential-growth-and-decay)](#review-of-exponential-growth-and-decay)             |
|                                                                                                     |
| [The Logistic Equation [26](#_Toc226795457)](#_Toc226795457)                                        |
+-----------------------------------------------------------------------------------------------------+

# Syllabus Content

**ME1-12-05** applies calculus to solve problems involving polynomials,
further rates of change, areas and volumes and differential equations

**Differential equations**

- Define a differential equation as an equation involving an unknown
  function and one or more of its derivatives

- Define and identify the order of a differential equation as the order
  of the highest derivative contained within the equation

- Recognise that a solution to a first order differential equations is a
  function, and that there may be infinitely many functions that are
  solutions to a given first order differential equation

- Recognise the solutions to differential equations in the context of
  slope fields, and that slope fields are useful in determining the
  behaviour of solutions when the differential equation cannot be easily
  solved

- Recognise that a unique solution of a differential equation can be
  determined when sufficient initial conditions are given, and refer to
  a problem involving a differential equation and initial conditions as
  an initial value problem (IVP)

- Graph solutions to first order differential equations given a slope
  field and identify the unique solution curve that satisfies a set of
  initial conditions

- Explore problems given a slope field representing a practical context
  and justify conclusions

- Form a slope field for a first order differential equation using
  graphing applications

- Recognise the features of a slope field corresponding to a first order
  differential equation and vice versa

- Solve first order differential equations of the form
  $\frac{dy}{dx} = f(x)$

- Solve first order differential equations of the form
  $\frac{dy}{dx} = g(y)$, where possible expressing the solution as a
  function with $y$ as the subject

- Recognise and solve the first order differential equations for
  exponential growth and decay: $\frac{dQ}{dt} = kQ$ and
  $\frac{dQ}{dt} = k(Q - P)$

- Solve first order differential equations of the form
  $\frac{dy}{dx} = f(x)g(y)$ using separation of variables, where
  possible expressing the solution as a function with $y$ as the subject

- Graph solutions of first order differential equations using graphing
  applications and examine the behaviour of solutions for different
  values of the constant of integration and initial conditions

- Solve differential equations of the form
  $\frac{dP}{dt} = kP\left( 1 - \frac{P}{C} \right)$ for some constants
  $k$ and $C$, given the appropriate decomposition into partial
  fractions, to obtain the logistic function

- Model and solve differential equations in practical scenarios
  including in chemistry, biology and economics

# Identifying DEs and Verifying Solutions

+---------------------------------------------------------------------------------+
| - **Review**                                                                    |
+=================================================================================+
| - Recognise notation of derivatives                                             |
|                                                                                 |
| +--------------+---------------------+--------------+-------------------------+ |
| | a.  $y'$     | b.  $\frac{dy}{dx}$ | c.  $y^{''}$ | d.  $\frac{d^{2}y}{dx}$ | |
| +==============+=====================+==============+=========================+ |
|                                                                                 |
| - Verify solutions of equations                                                 |
|                                                                                 |
| +------------------------------+--------------------------------------+         |
| | a.  Verify whether $x = 3$   | b.  Verify whether $x = 5$ is a      |         |
| |     is a solution to         |     solution to                      |         |
| |     $x - 3 = 0$              |     $\frac{7}{3} = \frac{2x}{3} - 1$ |         |
| +==============================+======================================+         |
| | c.  Verify whether $y = 4$   | d.  Verify whether $y = 6$ is a      |         |
| |     is a solution to         |     solution to $y^{2} = 2y + 12$    |         |
| |     $y^{2} = 2y + 12$        |                                      |         |
| +------------------------------+--------------------------------------+         |
+---------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Differential Equations**                                      |
+===================================================================+
| A **differential equation** (DE) is an equation that contains a   |
| derivative.                                                       |
|                                                                   |
| The **order** of a differential equation is the highest           |
| derivative it contains.                                           |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** Differential equations                                                                                                         |
+:==================:+:=============:+:============:+:===============================:+:=============:+:=============:+:=======================:+
| ✖                  | ✔                            | ✔                               | ✔                             | ✖                       |
|                    |                              |                                 |                               |                         |
| $$x^{2} + 3x = 7$$ | $$y' + 3x = 7$$              | $$\frac{d^{2}y}{dx^{2}} = - y$$ | $$x^{2}y^{'''} - xy' = 0$$    | $$x^{2}y^{3} - xy = 0$$ |
|                    |                              |                                 |                               |                         |
|                    | Order 1                      | Order 2                         | Order 3                       |                         |
+--------------------+------------------------------+---------------------------------+-------------------------------+-------------------------+
| Identify whether these are differential equations, and if so, its order.                                                                      |
+------------------------------------+----------------------------------------------------------------+-----------------------------------------+
| a.                                 | b.                                                             | c.                                      |
|                                    |                                                                |                                         |
| $$y' + 2y = x$$                    | $$y^{'''} = x^{2}$$                                            | $$y^{''} + 4y' + 3y = 0$$               |
+------------------------------------+----------------------------------------------------------------+-----------------------------------------+
| d.                                 | e.                                                             | f.                                      |
|                                    |                                                                |                                         |
| $$\frac{dy}{dx} = x^{5}$$          | $$\frac{d^{2}y}{dy^{2}} = y(y - 1)$$                           | $$y^{2} + 1 = 2$$                       |
+------------------------------------+----------------------------------------------------------------+-----------------------------------------+
| g.                                 | h.                                                             | i.                                      |
|                                    |                                                                |                                         |
| $$y' = ke^{2x}$$                   | $$3 = \frac{d^{4}y}{dy^{4}}$$                                  | $$yy^{''} + x = \sin x$$                |
+------------------------------------+----------------------------------------------------------------+-----------------------------------------+

+-------------------------------------------------------------------+
| - **Solution of a Differential Equation**                         |
+===================================================================+
| Solutions of differential equations are **functions**, not        |
| numbers.                                                          |
|                                                                   |
| For example, The solution of $x + 3 = 0$ is $x = - 3$             |
|                                                                   |
| A solution of $y' = 3$ is $y = 3x$                                |
|                                                                   |
| To test whether a function is a solution of a DE:                 |
|                                                                   |
| 1.  Differentiate the function.                                   |
|                                                                   |
| 2.  Substitute into the DE.                                       |
|                                                                   |
| 3.  Check whether $LHS\  = \ RHS$.                                |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** Verify solution of a differential equation          |
+===================================================================+
| Verify whether $y\  = \ 4e^{- 3x}$ is a solution of the           |
| differential equation $y' = - 3y$.                                |
|                                                                   |
| 1\. Differentiate $y' = - 12e^{- 3x}$                             |
|                                                                   |
| 2\. Substitute $LHS = y'$ $RHS = - 3y$                            |
|                                                                   |
| $\ \ \ \ \ \ \ \ \  = - 12e^{- 3x}$                               |
| $= - 3\left( 4e^{- 3x} \right)$                                   |
|                                                                   |
| $= - 12e^{- 3x}$                                                  |
|                                                                   |
| 3\. Check LHS = RHS, so it is a solution.                         |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| a.  Verify whether                | b.  Verify whether $y = 4e^{2x}$  |
|     $y\  = \ 7e^{- 3x}$ is a      |     is a solution of $y' = - 3y$. |
|     solution of $y' = \  - 3y$    |                                   |
|                                   | no                                |
| yes                               |                                   |
+-----------------------------------+-----------------------------------+
| c.  Verify whether                | d.  Show that $y\  = \ Ae^{- 3x}$ |
|     $y\  = \ \tan\ x$ is a        |     is a solution of $y' = - 3y$  |
|     solution of                   |     for all values of $A$.        |
|     $y' = \ 1\  + \ y²$           |                                   |
|                                   |                                   |
| yes                               |                                   |
+-----------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The solutions of a differential equation are ...............  |
|     not numbers                                                   |
|                                                                   |
| 2.  A single DE may have .................. many functions that   |
|     satisfy it.                                                   |
+-------------------------------------------------------------------+

[]{#_Toc226795452 .anchor}Foundation

1.  State the order of each differential equation.

+----------------------------+-----------------------------------------------------+------------------------------+
| a.  $y' - y = x$           | b.  $y'y = 3x$                                      | c.  $y'' + 4y' - y = \sin x$ |
|                            |                                                     |                              |
| first                      | first                                               | second                       |
+============================+=====================================================+==============================+
| d.  $y' + y\cos x = e^{x}$ | e.  $y^{''} - \frac{1}{2}\left( y' \right)^{3} = 0$ | f.  $y' + y² = 1$            |
|                            |                                                     |                              |
| first                      | second                                              | first                        |
+----------------------------+-----------------------------------------------------+------------------------------+
| g.  $y' + xy = 0$          | h.  $xy'' + y' = x²$                                | i.  $y'' - xy' + e^{x}y = 0$ |
|                            |                                                     |                              |
| first                      | second                                              | second                       |
+----------------------------+-----------------------------------------------------+------------------------------+

2.  Show by substitution that the given function is a particular
    solution of the DE.

+------------------------------------------------------+----------------------------------------------------------------------+
| a.  $y = 5x^{3};\ \ xy' - 3y = 0$                    | b.  $y = x^{2} - 1;\ \ xy' - 2y = 2$                                 |
|                                                      |                                                                      |
| $${y' = 15x^{2}                                      | $${y' = 2x                                                           |
| }{LHS = xy' - 3y                                     | }{LHS = xy' - 2y                                                     |
| }{= x\left( 15x^{2} \right) - 3\left( 5x^{3} \right) | }{= x(2x) - 2\left( x^{2} - 1 \right)                                |
| }{= 15x^{3} - 15x^{3} = 0                            | }{= 2x^{2} - 2x^{2} + 2                                              |
| }{= RHS}$$                                           | }{= 2                                                                |
|                                                      | }{= RHS}$$                                                           |
+======================================================+======================================================================+
| c.  $y = 3e^{- x};\ \ y' + y = 0$                    | d.  $y = \sqrt{x^{2} + 4};\ \ y'y = x$                               |
|                                                      |                                                                      |
| $${y' = - 3e^{- x}                                   | $${y' = \frac{x}{\sqrt{x^{2} + 4}}                                   |
| }{LHS = y' + y                                       | }{LHS = y'y                                                          |
| }{= - 3e^{- x} + 3e^{- x}                            | }{= \left( \frac{x}{\sqrt{x^{2} + 4}} \right) \cdot \sqrt{x^{2} + 4} |
| }{= 0                                                | }{= x                                                                |
| }{= RHS}$$                                           | }{= RHS}$$                                                           |
+------------------------------------------------------+----------------------------------------------------------------------+

3.  Verify that the given function with arbitrary constant $C$ is the
    general solution of the DE.

+---------------------------------------------------------------+-------------------------------------------------------------------------+
| a.  $y\  = \ Ce^{x}\  - \ x\  - \ 1;\ \ \ y' = \ x\  + \ y$   | b.  $y\  = \ Cxe^{- x};\ \ \ xy' = \ y(1\  - \ x)$                      |
|                                                               |                                                                         |
| $$y'\  = \ Ceˣ\  - \ 1$$                                      | $$\ y' = \ Ce^{- x} - \ Cxe^{- x} = \ Ce^{( - x)}(1\  - \ x)$$          |
|                                                               |                                                                         |
| $$RHS = \ x\  + \ y\ $$                                       | $$LHS = \ xy' = \ xCe^{- x}(1\  - \ x)$$                                |
|                                                               |                                                                         |
| $$= \ x\  + \ Ceˣ\  - \ x\  - \ 1\ $$                         | $$RHS = \ y(1\  - \ x)\  = \ Cxe^{- x}(1\  - \ x)$$                     |
|                                                               |                                                                         |
| $$= \ Ceˣ\  - \ 1\ $$                                         |                                                                         |
|                                                               |                                                                         |
| $$= \ y'$$                                                    |                                                                         |
+===============================================================+=========================================================================+
| c.  $y\  = \ \sin(x\  + \ C);\ \ \ (y')²\  = \ 1\  - \ y^{2}$ | d.  $y\  = \frac{C}{x} + \ 2;\ \ \ \frac{dy}{dx} = \frac{2\  - \ y}{x}$ |
|                                                               |                                                                         |
| $$\ y'\  = \ \cos(x\  + \ C)$$                                | $$\frac{dy}{dx} = \  - \frac{C}{x^{2}}$$                                |
|                                                               |                                                                         |
| $$LHS = \ (y')²\  = \ \cos ²(x\  + \ C)$$                     | $$RHS = \frac{2\  - \ y}{x}$$                                           |
|                                                               |                                                                         |
| $$RHS = \ 1\  - \ y^{2} = \ 1\  - \ \sin^{2}(x\  + \ C)$$     | $$= \frac{2\  - \frac{C}{x} - \ 2}{x}$$                                 |
|                                                               |                                                                         |
| $$\  = \ \cos ²(x\  + \ C)\ \ $$                              | $$= \  - \frac{C}{x^{2}}$$                                              |
|                                                               |                                                                         |
|                                                               | $$= \frac{dy}{dx}$$                                                     |
+---------------------------------------------------------------+-------------------------------------------------------------------------+

Development

4.  Verify that the given function is a particular solution of the DE.

+------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $x^{2}y^{''} - \ 2xy' + \ 2y\  = \ 6;\ \$$$y\  = \ x^{2} - \ 2x\  + \ 3$$                              | b.  $y^{''} - \ 6y' + \ 5y\  = \ 0;\ \$                                                                                                                                    |
|                                                                                                            |                                                                                                                                                                            |
| $$\ y' = \ 2x\  - \ 2,\ $$                                                                                 | $$y\  = \ 2e^{x}\  + \ e^{5x}$$                                                                                                                                            |
|                                                                                                            |                                                                                                                                                                            |
| $$y''\  = \ 2$$                                                                                            | $$y' = \ 2eˣ\  + \ 5e^{5x}$$                                                                                                                                               |
|                                                                                                            |                                                                                                                                                                            |
| $$LHS = \ x^{2}(2) - \ 2x(2x\  - \ 2) + \ 2\left( x^{2} - \ 2x\  + \ 3 \right)$$                           | $$y^{''} = \ 2eˣ\  + \ 25e^{5x}$$                                                                                                                                          |
|                                                                                                            |                                                                                                                                                                            |
| $$= \ 2x^{2} - \ 4x^{2} + \ 4x\  + \ 2x^{2} - \ 4x\  + \ 6\ $$                                             | $$LHS = \ \left( 2eˣ\  + \ 25e^{5x} \right) - \ 6\left( 2eˣ\  + \ 5e^{5x} \right) + \ 5\left( 2eˣ\  + \ e^{5x} \right)$$                                                   |
|                                                                                                            |                                                                                                                                                                            |
| $$= \ 6 = \ RHS$$                                                                                          | $$= \ (2\  - \ 12\  + \ 10)eˣ\  + \ (25\  - \ 30\  + \ 5)e^{5x}$$                                                                                                          |
|                                                                                                            |                                                                                                                                                                            |
|                                                                                                            | $$= \ 0\  = \ RHS$$                                                                                                                                                        |
+============================================================================================================+============================================================================================================================================================================+
| c.  $y^{''} + \ \pi^{2}y\  = \ 0;\ \$                                                                      | d.  $x^{2}y^{''} + \ xy' + \ y\  = \ 0;\ \$                                                                                                                                |
|                                                                                                            |                                                                                                                                                                            |
| $$y\  = \ \cos\ \pi x\  - \ 3\ \sin\ \pi x$$                                                               | $$y\  = \ \cos(\log\ x)$$                                                                                                                                                  |
|                                                                                                            |                                                                                                                                                                            |
| $$y' = \  - \pi\sin{\pi x} - \ 3\pi\cos{\pi x}$$                                                           | $$y' = \  - \frac{\sin\left( \log\ x \right)}{x}$$                                                                                                                         |
|                                                                                                            |                                                                                                                                                                            |
| $$\ y''\  = \  - \pi ²\ \cos\ \pi x\  + \ 3\pi ²\ \sin\ \pi x$$                                            | $$y^{''} = \frac{- \cos\left( \log\ x \right) \cdot \ \left( \frac{1}{x} \right) \cdot \ x\  + \ \sin\left( \log\ x \right)}{x^{2}}$$                                      |
|                                                                                                            |                                                                                                                                                                            |
| $$LHS = \ y^{''} + \ \pi^{2}y\ $$                                                                          | $$= \frac{\sin\left( \log\ x \right) - \ \cos\left( \log\ x \right)}{x^{2}}$$                                                                                              |
|                                                                                                            |                                                                                                                                                                            |
| $$= \  - \pi^{2}\cos{\pi x} + 3\pi^{2}\sin{\pi x} + \ \pi^{2}\left( \cos{\pi x} - \ 3\sin{\pi x} \right)$$ | $$LHS = x^{2}y^{''} + \ xy' + \ y\ $$                                                                                                                                      |
|                                                                                                            |                                                                                                                                                                            |
| $$= \ 0\  = \ RHS$$                                                                                        | $$= \ \left( \sin\left( \log\ x \right) - \ \cos\left( \log\ x \right) \right) + \ x\left( - \frac{\sin\left( \log\ x \right)}{x} \right) + \ \cos\left( \log\ x \right)$$ |
|                                                                                                            |                                                                                                                                                                            |
|                                                                                                            | $$= \ \sin\left( \log\ x \right) - \ \cos\left( \log\ x \right) - \ \sin\left( \log\ x \right) + \ \cos\left( \log\ x \right)$$                                            |
|                                                                                                            |                                                                                                                                                                            |
|                                                                                                            | $$= \ 0\  = \ RHS$$                                                                                                                                                        |
+------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

5.  a.  Show that $y\  = \ e^{- x}$ and $y\  = \ e^{3x}\$are each
        solutions of $y^{''} - \ 2y' - \ 3y\  = \ 0$.

$$y\  = \ e^{- x}:\ y' = \  - e^{- x},\ y^{''} = \ e^{- x}$$

$$LHS = \ e^{- x} - \ 2\left( - e^{- x} \right) - \ 3e^{- x}$$

$$= \ e^{- x} + \ 2e^{- x} - \ 3e^{- x}$$

$$= \ 0\  = \ RHS$$

$$y\  = \ e^{3x}:\ y' = \ 3e^{3x},\ y^{''} = \ 9e^{3x}$$

$$LHS = 9e^{3x} - \ 2\left( 3e^{3x} \right) - \ 3e^{3x}$$

$$= \ 9e^{3x} - \ 6e^{3x} - \ 3e^{3x}$$

$$= \ 0\  = \ RHS$$

b.  Show that$\ y\  = \ Ae^{- x} + \ Be^{3x}$ is also a solution for any
    constants A and B.

$$y' = \  - Ae^{- x} + \ 3Be^{3x}$$

$$y^{''} = \ Ae^{- x} + \ 9Be^{3x}$$

$$LHS = \ y^{''} - \ 2y' - \ 3y\ $$

$$= \ \left( Ae^{- x} + \ 9Be^{3x} \right) - \ 2\left( - Ae^{- x} + \ 3Be^{3x} \right) - \ 3\left( Ae^{- x} + \ Be^{3x} \right)$$

$$= \ A(1\  + \ 2\  - \ 3)e^{- x} + \ B(9\  - \ 6\  - \ 3)e^{3x}$$

$$= \ 0\  = \ RHS$$

# Solving dy/dx = f(x)

+--------------------------------------------------------------------------+
| - **Solving**                                                            |
|   $\frac{\mathbf{dy}}{\mathbf{dx}}\mathbf{= f}\left( \mathbf{x} \right)$ |
+==========================================================================+
| The simplest type of differential equation is $\frac{dy}{dx} = f(x)$.    |
|                                                                          |
| To solve these equations, **integrate both sides** with respect to $x$.  |
|                                                                          |
| $${\frac{dy}{dx} = f(x)                                                  |
| }{\int_{}^{}{\frac{dy}{dx}\ dx} = \int_{}^{}{f(x)}dx                     |
| }{y = \int_{}^{}{f(x)}dx                                                 |
| }{= F(x) + C}$$                                                          |
|                                                                          |
| The **general solution** of a DE contains constant $C$ and represents a  |
| whole family of curves.                                                  |
|                                                                          |
| Remember that your solution is an equation; you must have $y = \ldots$   |
+--------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** Solve differential equations of the form            |
|   $\frac{dy}{dx} = f(x)$                                          |
+===================================================================+
| Solve $y' = 2x$                                                   |
|                                                                   |
| $${y = \int_{}^{}{2x}dx                                           |
| }{= x^{2} + C}$$                                                  |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------+
| - **Guided Practice**                                                    |
+===================================+======================================+
| a.  Solve $y' = 5x^{2}$           | b.  Solve $\frac{dy}{dx}$ $= \cos x$ |
|                                   |                                      |
| $$y = \frac{5x^{3}}{3} + C$$      | $$y = \sin x + C$$                   |
+-----------------------------------+--------------------------------------+
| c.  Solve $xy' = 3$               | d.  Solve                            |
|                                   |     $\frac{y'}{x} = e^{x^{2} + 1}$   |
| $$y = 3\ln|x| + C$$               |                                      |
|                                   | $$y = \frac{1}{2}e^{x^{2} + 1} + C$$ |
+-----------------------------------+--------------------------------------+

+-------------------------------------------------------------------+
| - **Initial Value Problems**                                      |
+===================================================================+
| A particular solution is obtained by using an **initial           |
| condition** to find the value of C.                               |
|                                                                   |
| A problem consisting of a differential equation together with an  |
| initial condition is called an **initial value problem**, or      |
| **IVP**.                                                          |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** Solve initial value problems for DEs of the form    |
|   $\frac{dy}{dx} = f(x)$                                          |
+===================================================================+
| Solve $y' = \ 6x²\  - \ 2,\$given$\$that$\ y(1) = \ 3$            |
|                                                                   |
| $${y = \int_{}^{}{6x^{2} - 2}dx                                   |
| }{= 2x^{3} - 2x + C                                               |
| }{3 = 2(1)^{3} - 2(1) + C                                         |
| }{3 = 2 - 2 + C}$$                                                |
|                                                                   |
| $C = 3$ $\therefore y = 2x^{3} - 2x + 3$                          |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
| - **Guided Practice**                                                         |
+===================================+===========================================+
| a.  Solve $y’ = \ 4x³\  + \ 1$,   | b.  Solve $y' = \ e^{2x}$, given          |
|     given $y(1)\  = \ 5.$         |     $y(0)\  = \ 1$.                       |
|                                   |                                           |
| $$y\  = \ x^{4} + \ x\  + \ 3$$   | $$y\  = \frac{1}{2}e^{2x} + \frac{1}{2}$$ |
+-----------------------------------+-------------------------------------------+
| c.  Solve $y' = \ \cos\ x$, given | d.  The population growth rate on an      |
|     $y(0)\  = \ 2$.               |     island is given by $P' = 2t - 3.$     |
|                                   |     Find an equation for the population   |
| $$y\  = \ \sin\ x\  + \ 2\ $$     |     given the initial population is 14.   |
|                                   |                                           |
|                                   | $$P\  = \ t^{2} - \ 3t\  + \ 14$$         |
+-----------------------------------+-------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The DE $y' = f(x)$ is solved by finding the                   |
|     ..................... of $f(x)$.                              |
|                                                                   |
| 2.  The .................. solution includes some constant $C.$   |
|                                                                   |
| 3.  The particular solution is found by substituting a known      |
|     initial .................. This is called solving an initial  |
|     value problem.                                                |
+-------------------------------------------------------------------+

[]{#_Toc226795453 .anchor}Foundation

1.  Find the general solution by integration.

+------------------------------------------------------------------------+-----------------------------------------------------------+---------------------------------------+
| a.  $y' = \ 2x\  - \ 3$                                                | b.  $\ y' = \ 12e^{- 2x} + \ 4$                           | c.  $y'\  = \ \sec ²x$                |
|                                                                        |                                                           |                                       |
| $$y\  = \ \int_{}^{}{(2x\  - \ 3)dx}$$                                 | $$y\  = \ \int_{}^{}{\left( 12e^{- 2x} + \ 4 \right)dx}$$ | $$y\  = \ \int_{}^{}{sec^{2}x}dx\ $$  |
|                                                                        |                                                           |                                       |
| $$= \ x^{2} - \ 3x\  + \ C$$                                           | $$= \  - 6e^{- 2x} + \ 4x\  + \ C$$                       | $$= \ \tan\ x\  + \ C$$               |
+========================================================================+===========================================================+=======================================+
| d.  $y'\  = \ 6\ \cos\ 2x\  + \ 9\ \sin\ 3x$                           | e.  $\ y'\  = \ \sqrt{}(1\  - \ 5x)$                      | f.  $y'\  = \ 4x\ \cos\ x^{2}$        |
|                                                                        |                                                           |                                       |
| $$y\  = \ \int_{}^{}{\left( 6\ \cos\ 2x\  + \ 9\ \sin\ 3x \right)dx}$$ | $$y\  = \ \int_{}^{}{(1\  - \ 5x)^{\frac{1}{2}}dx}$$      | $$y\  = \int_{}^{}{4x}\cos{x^{2}dx}$$ |
|                                                                        |                                                           |                                       |
| $$= \ 3\ \sin\ 2x\  - \ 3\ \cos\ 3x\  + \ C$$                          | $$= \  - \frac{2}{15}(1\  - \ 5x)^{\frac{3}{2}} + \ C$$   | $$= \ 2\ \sin\ x^{2} + \ C$$          |
+------------------------------------------------------------------------+-----------------------------------------------------------+---------------------------------------+

2.  Solve by integrating twice.

+---------------------------------------------+-------------------------------------------------------------------+
| a.  $y''\  = \ 2$                           | b.  $y''\  = \ \cos\ 2x$                                          |
|                                             |                                                                   |
| $$y'\  = \ 2x\  + \ A$$                     | $$y' = \ \left( \frac{1}{2} \right)sin\ 2x\  + \ A$$              |
|                                             |                                                                   |
| $$y\  = \ x²\  + \ Ax\  + \ B$$             | $$y\  = \  - \left( \frac{1}{4} \right)cos\ 2x\  + \ Ax\  + \ B$$ |
+=============================================+===================================================================+
| c.  $y''\  = \ e^{\frac{x}{2}}$             | d.  $y''\  = \ \sec ²x$                                           |
|                                             |                                                                   |
| $$y' = \ 2e^{\frac{x}{2}} + \ A$$           | $$y' = \ \tan\ x\  + \ A$$                                        |
|                                             |                                                                   |
| $$y\  = \ 4e^{\frac{x}{2}} + \ Ax\  + \ B$$ | $$y\  = \  - \log\left| \cos\ x \right| + \ Ax\  + \ B$$          |
+---------------------------------------------+-------------------------------------------------------------------+

3.  Solve each IVP: find the general solution, then apply the initial
    condition.

+------------------------------------------------------+---------------------------------------------+
| a.  $y'\  = \ 1;\ \ y(2)\  = \ 1$                    | b.  $y'\  = \ 2x\  - \ 3;\ \ y(0)\  = \ 2$  |
|                                                      |                                             |
| $$y\  = \ x\  - \ 1$$                                | $$y\  = \ x^{2} - \ 3x\  + \ 2$$            |
+======================================================+=============================================+
| c.  $y'\  = \ 3x²\  + \ 6x\  - \ 9;\ \ y(1)\  = \ 2$ | d.  $y'\  = \ \sin\ x;\ \ y(\pi)\  = \ 3\$  |
|                                                      |                                             |
| $$y\  = \ x^{3} + \ 3x^{2} - \ 9x\  + \ 7$$          | $$y\  = \ 2\  - \ \cos\ x$$                 |
+------------------------------------------------------+---------------------------------------------+
| e.  $y' = \ 6e^{2x};\ \ y(0) = \ 0$                  | f.  $y' = \ 3\sqrt{x} - \ 2;\ \ y(4) = \ 7$ |
|                                                      |                                             |
| $$y\  = \ 3\left( e^{2x} - \ 1 \right)$$             | $$y\  = \ 2x\sqrt{x} - \ 2x\  - \ 1$$       |
+------------------------------------------------------+---------------------------------------------+

Development

4.  Consider $y' = \frac{1}{x(1\  - \ x)},\$where
    $y\left( \frac{1}{2} \right) = \ 0$.

    a.  Show that
        $\frac{1}{x(1\  - \ x)} = \frac{1}{x} + \frac{1}{1\  - \ x}.$

    b.  Find the general solution of the DE.

    c.  Hence solve the IVP.

$$RHS = \frac{1}{x} + \frac{1}{1\  - \ x} = \frac{1\  - \ x\  + \ x}{x(1\  - \ x)} = \frac{1}{x(1\  - \ x)}$$

$$y\  = \ \int_{}^{}{\left( \frac{1}{x} + \frac{1}{1\  - \ x} \right)dx} = \ \log|x| - \ \log|1\  - \ x| + \ C\ $$

$$= \ \log\left| \frac{x}{1\  - \ x} \right| + \ C$$

$$Sub\ y\left( \frac{1}{2} \right) = \ 0:\ $$

$$\log|1| + \ C\  = \ 0$$

$$C\  = \ 0$$

$$y\  = \ \log\left| \frac{x}{1\  - \ x} \right|$$

5.  Consider $y' = \frac{4}{(2\  - \ x)(2\  + \ x)},$ where
    $y(0)\  = \ 1$.

    a.  Show that
        $\frac{4}{(2\  - \ x)(2\  + \ x)} = \frac{1}{2\  - \ x} + \frac{1}{2\  + \ x}.$

    b.  Find the general solution of the DE.

    c.  Hence solve the IVP.

$$RHS = \frac{1}{2\  - \ x} + \frac{1}{2\  + \ x} = \frac{2\  + \ x\  + \ 2\  - \ x}{(2\  - \ x)(2\  + \ x)} = \frac{4}{(2\  - \ x)(2\  + \ x)}$$

$$y\  = \ \int_{}^{}{\left( \frac{1}{2\  - \ x} + \frac{1}{2\  + \ x} \right)dx} = \  - \log|2\  - \ x| + \ \log|2\  + \ x| + \ C\ $$

$$= \ \log\left| \frac{2\  + \ x}{2\  - \ x} \right| + \ C$$

$$y(0) = \ 1$$

$$\log|1| + \ C\  = \ 1$$

$$C\  = \ 1$$

$$y\  = \ \log\left| \frac{2\  + \ x}{2\  - \ x} \right| + \ 1$$

6.  a.  Show that $y\  = \ \sin\ x$ is a solution of
        $y''\  + \ y\  = \ 0$.

    b.  Find $y''$ when $y\  = \ 12$.

    c.  If $y\  = \ f(x)$ is a solution of this DE, what does the
        equation say about $f''(x)$?\
        Answer in terms of a transformation of $f(x).$

$$y\  = \ \sin\ x:\ y'\  = \ \cos\ x,\ y''\  = \  - \sin\ x$$

$$LHS:\ y^{''} + \ y\  = \  - \sin x + \sin x$$

$$= \ 0\  = \ RHS$$

$$y''\  = \  - y\  = \  - 12$$

$y''\  = \  - y$ means $f''(x)\  = \  - f(x).$

The second derivative is the original $f(x)$ reflected in the $x$-axis.

7.  Use integration and the initial conditions to find the solution of
    $y^{''} = \ \sec^{2}x$ with $y(0)\  = \ 1$ and $y'(0)\  = \ 1$.

$$y''\  = \ \sec ²x$$

$$y' = \ \int_{}^{}{\sec^{2}x}dx\  = \tan x + \ A;\ $$

$$y'(0) = \ 1:\ 0\  + \ A\  = \ 1$$

$$\ A\  = \ 1$$

$$y'\  = \ \tan\ x\  + \ 1$$

$$y\  = \ \int_{}^{}{\left( \tan x + \ 1 \right)dx} = \  - \log\left| \cos x \right| + \ x\  + \ B;\ $$

$$y(0) = \ 1:\ 0\  + \ 0\  + \ B\  = \ 1$$

$$B\  = \ 1$$

$$y\  = \ 1\  + \ x\  - \ \log(\cos\ x)$$

8.  Show that $y\  = \ \tan\ x$ is a solution of the IVP
    $y''\  = \ 2yy'$, with $y\left( \frac{\pi}{4} \right) = \ 1$ and
    $y'\left( \frac{\pi}{4} \right) = \ 2$.

$$y' = \ \sec^{2}x$$

$$y''\  = \ 2\ \sec ²x\ \tan\ x$$

$$RHS:\ 2yy' = \ 2\tan x \cdot \ \sec^{2}x\ $$

$$= \ 2\ \sec ²x\ \tan\ x\  = \ y''$$

Check initial conditions:

$$y\left( \frac{\pi}{4} \right) = \ \tan\left( \frac{\pi}{4} \right) = \ 1$$

$$y'\left( \frac{\pi}{4} \right) = \ \sec^{2}\left( \frac{\pi}{4} \right) = \ 2$$

Therefore $y\  = \ \tan\ x$ is a solution of the IVP.

# Slope Fields

+----------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                               |
+============================================================================================================================+
| - Evaluate a two-variable expression at a point\                                                                           |
|   $G(x,y)$ is a relation in $x$ and $y$:                                                                                   |
|                                                                                                                            |
| +--------------------------+--------------------------------+----------------------------------+                           |
| | a.  If                   | b.  If                         | c.  If                           |                           |
| |     $G(x,y) = x + y$find |     $G(x,y) = \frac{x}{y}$find |     $G(x,y) = - \frac{x}{y}$find |                           |
| |     $G(1,2)$             |     $G(2,4)$                   |     $G(3, - 1)$                  |                           |
| +==========================+================================+==================================+                           |
|                                                                                                                            |
| - Draw a line segment of a given gradient                                                                                  |
|                                                                                                                            |
| +------------------------------------------------------------------------------------------------------------------------+ |
| | a.  ![](media/Further Applications of Calculus 4_Differential equations/media/image2.png){width="2.4042672790901136in" | |
| |     height="2.3622047244094486in"}At the point $(1,\  - 1),$\                                                          | |
| |     draw a short line segment with\                                                                                    | |
| |     gradient 0 (horizontal)                                                                                            | |
| |                                                                                                                        | |
| | b.  At the point $(2,\ 4)$,\                                                                                           | |
| |     draw a short line segment with\                                                                                    | |
| |     gradient 1 (tilted at 45°).                                                                                        | |
| |                                                                                                                        | |
| | c.  At the point $( - 1,\ 3)$,\                                                                                        | |
| |     draw a short line segment with\                                                                                    | |
| |     gradient −1.                                                                                                       | |
| +========================================================================================================================+ |
+----------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Interpreting slope fields                                                                                                                                                                                                                                                    |
+================================================================================================================================================+=================================================================================================================================================+
| Consider the differential equation $\frac{dy}{dx}$ $=$ $\frac{x}{2}$                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                  |
| Solve the differential equation to find the general solution:                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                  |
| ...........................................................................................................................                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                  |
| ...........................................................................................................................                                                                                                                                                                      |
+------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------+
| This represents a **family** of curves.                                                                                                        | ![](media/Further Applications of Calculus 4_Differential equations/media/image3.png){width="1.9618055555555556in"                              |
|                                                                                                                                                | height="1.9680555555555554in"}![](media/Further Applications of Calculus 4_Differential equations/media/image4.png){width="1.993390201224847in" |
|                                                                                                                                                | height="1.968503937007874in"}We can represent this infinite family of curves using a **slope field:**                                           |
+------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------+
| Each short line element displays the gradient of the solution curve at that point.                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                  |
| The length of the line segments are insignificant; only the slope.                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                  |
| We can get the gradient of each of these line segments from the differential equation:                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                  |
| $$\frac{dy}{dx} = \frac{x}{2}$$                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                  |
| $$‘the\ gradient\ at\ any\ point\ is\ half\ the\ x\ coordinate’$$                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                  |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image5.png){width="3.6086504811898514in" height="3.6447364391951007in"}                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                  |
|   -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------      |
|    ![](media/Further Applications of Calculus 4_Differential equations/media/image6.png){width="3.1184208223972005in"       $$- 2$$        $$- \frac{3}{2}$$       $$- 1$$        $$- \frac{1}{2}$$       $$0$$        $$\frac{1}{2}$$       $$1$$        $$\frac{3}{2}$$       $$2$$            |
|                                        height="3.1496062992125986in"}$\mathbf{4}$                                                                                                                                                                                                                |
|   -------------------------------------------------------------------------------------------------------------------- ------------------ ------------------- ------------------ ------------------- ---------------- ----------------- ---------------- ----------------- ----------------      |
|                                                      $$\mathbf{3}$$                                                         $$- 2$$        $$- \frac{3}{2}$$       $$- 1$$        $$- \frac{1}{2}$$       $$0$$        $$\frac{1}{2}$$       $$1$$        $$\frac{3}{2}$$       $$2$$            |
|                                                                                                                                                                                                                                                                                                  |
|                                                      $$\mathbf{2}$$                                                         $$- 2$$        $$- \frac{3}{2}$$       $$- 1$$        $$- \frac{1}{2}$$       $$0$$        $$\frac{1}{2}$$       $$1$$        $$\frac{3}{2}$$       $$2$$            |
|                                                                                                                                                                                                                                                                                                  |
|                                                      $$\mathbf{1}$$                                                         $$- 2$$        $$- \frac{3}{2}$$       $$- 1$$        $$- \frac{1}{2}$$       $$0$$        $$\frac{1}{2}$$       $$1$$        $$\frac{3}{2}$$       $$2$$            |
|                                                                                                                                                                                                                                                                                                  |
|                                                      $$\mathbf{0}$$                                                         $$- 2$$        $$- \frac{3}{2}$$       $$- 1$$        $$- \frac{1}{2}$$       $$0$$        $$\frac{1}{2}$$       $$1$$        $$\frac{3}{2}$$       $$2$$            |
|                                                                                                                                                                                                                                                                                                  |
|                                                     $$\mathbf{- 1}$$                                                        $$- 2$$        $$- \frac{3}{2}$$       $$- 1$$        $$- \frac{1}{2}$$       $$0$$        $$\frac{1}{2}$$       $$1$$        $$\frac{3}{2}$$       $$2$$            |
|                                                                                                                                                                                                                                                                                                  |
|                                                     $$\mathbf{- 2}$$                                                        $$- 2$$        $$- \frac{3}{2}$$       $$- 1$$        $$- \frac{1}{2}$$       $$0$$        $$\frac{1}{2}$$       $$1$$        $$\frac{3}{2}$$       $$2$$            |
|                                                                                                                                                                                                                                                                                                  |
|                                                     $$\mathbf{- 3}$$                                                        $$- 2$$        $$- \frac{3}{2}$$       $$- 1$$        $$- \frac{1}{2}$$       $$0$$        $$\frac{1}{2}$$       $$1$$        $$\frac{3}{2}$$       $$2$$            |
|                                                                                                                                                                                                                                                                                                  |
|                                                     $$\mathbf{- 4}$$                                                        $$- 2$$        $$- \frac{3}{2}$$       $$- 1$$        $$- \frac{1}{2}$$       $$0$$        $$\frac{1}{2}$$       $$1$$        $$\frac{3}{2}$$       $$2$$            |
|                                                                                                                                                                                                                                                                                                  |
|                                                                                                                         $$\mathbf{- 4}$$   $$\mathbf{- 3}$$    $$\mathbf{- 2}$$   $$\mathbf{- 1}$$    $$\mathbf{0}$$   $$\mathbf{1}$$    $$\mathbf{2}$$   $$\mathbf{3}$$    $$\mathbf{4}$$       |
|   -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------      |
|                                                                                                                                                                                                                                                                                                  |
| This is a straight-forward example as the slope only depends on $x$.                                                                                                                                                                                                                             |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Slope Fields**                                                                                                                                                                   |
+===================================+==================================================================================================================================================+
| A **slope field**, or **gradient field**, for a first-order DE: $\frac{dy}{dx} = G(x,y)$ displays short line segments at points in the plane. Each line segment has the gradient     |
| given by $G(x,y)$ at that point.                                                                                                                                                     |
|                                                                                                                                                                                      |
| The gradient of a curve at a point can depend on $x,\ y,$ or both.                                                                                                                   |
+-----------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Slope field for $\frac{dy}{dx}$   | ![](media/Further Applications of Calculus 4_Differential equations/media/image7.png){width="1.9541666666666666in"                               |
| $=$ $\frac{x}{2}$                 | height="1.9284722222222221in"}![](media/Further Applications of Calculus 4_Differential equations/media/image8.png){width="1.9182425634295712in" |
|                                   | height="1.9291338582677164in"}Slope field for $\frac{dy}{dx}$ $=$ $xy$                                                                           |
+-----------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Calculate** gradient values for a slope field                                                                                                                                                                                         |
+=====================================================================================================================+=====================================================================================================================+
| Substitute the coordinates into the differential equation to find the gradient at that point.                                                                                                                                             |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| a.  $y' = \frac{x}{2}$ at $(2,3)$                                                                                   | b.  $y' = xy$ at $( - 1,2)$                                                                                         |
|                                                                                                                     |                                                                                                                     |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image9.png){width="1.5656605424321959in"  | ![](media/Further Applications of Calculus 4_Differential equations/media/image10.png){width="1.5656605424321959in" |
| height="1.5748031496062993in"}                                                                                      | height="1.5455588363954507in"}                                                                                      |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| c.  $y'\  = \ x\  + \ y\$at$\ (0,\ 1)$                                                                              | d.  $y'\  = \  - \frac{x}{y}$ at$\ (2,\ 1)$                                                                         |
|                                                                                                                     |                                                                                                                     |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image11.png){width="1.5656605424321959in" | ![](media/Further Applications of Calculus 4_Differential equations/media/image12.png){width="1.5656605424321959in" |
| height="1.5455588363954507in"}                                                                                      | height="1.5441819772528433in"}                                                                                      |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| e.  $y'\  = \  - \frac{2}{y}\$at$\ (1, - \ 3)$                                                                      | f.  $y' = \ x^{2}\$at$\ (2,\  - 3)$                                                                                 |
|                                                                                                                     |                                                                                                                     |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image13.png){width="1.5652777777777778in" | ![](media/Further Applications of Calculus 4_Differential equations/media/image14.png){width="1.556317804024497in"  |
| height="1.5125in"}                                                                                                  | height="1.5722222222222222in"}                                                                                      |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Interpreting slope fields                                                                               |
+=============================================================================================================================+
| Consider the differential equation $\frac{dy}{dx}$ $=$ $\frac{x}{2}$                                                        |
|                                                                                                                             |
| Solve the differential equation, given that when $x = 0$, $y = 1$.                                                          |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| ........................................................................................................................... |
+-----------------------------------------------------------------------------------------------------------------------------+
| Finding the specific equation represents finding the specific curve passing through that point.                             |
|                                                                                                                             |
| On the slope field, we plot the point (0,1) and follow the gradients to get the specific graph.                             |
|                                                                                                                             |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image15.png){width="1.9569444444444444in"         |
| height="1.9680555555555554in"}                                                                                              |
|                                                                                                                             |
| - It is not possible for two solution curves to cross each other, since there is a unique gradient at each point; similar   |
|   to how a function has a unique $y$ value for each $x$ value.\                                                             |
|   The only way two different solutions can share a point is if they are tangent to each other at that point (which is       |
|   rare).                                                                                                                    |
+-----------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------+
| - **Example** Sketch a slope field                                                                                  |
+=====================================================================================================================+
| Complete the slope table for $yy' + x = 0$, sketch the slope table, then draw the solution curve going through      |
| (2,2).                                                                                                              |
|                                                                                                                     |
| $$y' = - \frac{x}{y}$$                                                                                              |
|                                                                                                                     |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image16.png){width="2.3964610673665794in" |
| height="2.3618055555555557in"}1. Table 2. Slope field and solution curve                                            |
|                                                                                                                     |
| <table style="width:43%;">                                                                                          |
| <colgroup>                                                                                                          |
| <col style="width: 4%" />                                                                                           |
| <col style="width: 4%" />                                                                                           |
| <col style="width: 4%" />                                                                                           |
| <col style="width: 4%" />                                                                                           |
| <col style="width: 4%" />                                                                                           |
| <col style="width: 4%" />                                                                                           |
| <col style="width: 4%" />                                                                                           |
| <col style="width: 4%" />                                                                                           |
| <col style="width: 4%" />                                                                                           |
| <col style="width: 4%" />                                                                                           |
| </colgroup>                                                                                                         |
| <thead>                                                                                                             |
| <tr>                                                                                                                |
| <th style="text-align: center;"><span                                                                               |
| class="math display"><strong>4</strong></span></th>                                                                 |
| <th><span class="math display">1</span></th>                                                                        |
| <th><span class="math display">$$\frac{3}{4}$$</span></th>                                                          |
| <th><span class="math display">$$\frac{1}{2}$$</span></th>                                                          |
| <th><span class="math display">$$\frac{1}{4}$$</span></th>                                                          |
| <th style="text-align: center;">0</th>                                                                              |
| <th><span class="math display">$$- \frac{1}{4}$$</span></th>                                                        |
| <th><span class="math display">$$- \frac{1}{2}$$</span></th>                                                        |
| <th><span class="math display">$$- \frac{3}{4}$$</span></th>                                                        |
| <th><span class="math display">−1</span></th>                                                                       |
| </tr>                                                                                                               |
| </thead>                                                                                                            |
| <tbody>                                                                                                             |
| <tr>                                                                                                                |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>3</strong></span></td>                                                                 |
| <td><span class="math display">$$\frac{4}{3}$$</span></td>                                                          |
| <td><span class="math display">1</span></td>                                                                        |
| <td><span class="math display">$$\frac{2}{3}$$</span></td>                                                          |
| <td><span class="math display">$$\frac{1}{3}$$</span></td>                                                          |
| <td style="text-align: center;">0</td>                                                                              |
| <td><span class="math display">$$- \frac{1}{3}$$</span></td>                                                        |
| <td><span class="math display">$$- \frac{2}{3}$$</span></td>                                                        |
| <td><span class="math display">−1</span></td>                                                                       |
| <td><span class="math display">$$- \frac{4}{3}$$</span></td>                                                        |
| </tr>                                                                                                               |
| <tr>                                                                                                                |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>2</strong></span></td>                                                                 |
| <td><span class="math display">2</span></td>                                                                        |
| <td><span class="math display">$$\frac{3}{2}$$</span></td>                                                          |
| <td><span class="math display">1</span></td>                                                                        |
| <td><span class="math display">$$\frac{1}{2}$$</span></td>                                                          |
| <td style="text-align: center;">0</td>                                                                              |
| <td><span class="math display">$$- \frac{1}{2}$$</span></td>                                                        |
| <td><span class="math display">−1</span></td>                                                                       |
| <td><span class="math display">$$- \frac{3}{2}$$</span></td>                                                        |
| <td><span class="math display">−2</span></td>                                                                       |
| </tr>                                                                                                               |
| <tr>                                                                                                                |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>1</strong></span></td>                                                                 |
| <td><span class="math display">4</span></td>                                                                        |
| <td><span class="math display">3</span></td>                                                                        |
| <td><span class="math display">2</span></td>                                                                        |
| <td><span class="math display">1</span></td>                                                                        |
| <td style="text-align: center;">0</td>                                                                              |
| <td><span class="math display">−1</span></td>                                                                       |
| <td><span class="math display">−2</span></td>                                                                       |
| <td><span class="math display">−3</span></td>                                                                       |
| <td><span class="math display">−4</span></td>                                                                       |
| </tr>                                                                                                               |
| <tr>                                                                                                                |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>0</strong></span></td>                                                                 |
| <td></td>                                                                                                           |
| <td></td>                                                                                                           |
| <td></td>                                                                                                           |
| <td></td>                                                                                                           |
| <td style="text-align: center;"></td>                                                                               |
| <td></td>                                                                                                           |
| <td></td>                                                                                                           |
| <td></td>                                                                                                           |
| <td></td>                                                                                                           |
| </tr>                                                                                                               |
| <tr>                                                                                                                |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>−</strong><strong>1</strong></span></td>                                               |
| <td><span class="math display">−4</span></td>                                                                       |
| <td><span class="math display">−3</span></td>                                                                       |
| <td><span class="math display">−2</span></td>                                                                       |
| <td><span class="math display">−1</span></td>                                                                       |
| <td style="text-align: center;">0</td>                                                                              |
| <td><span class="math display">1</span></td>                                                                        |
| <td><span class="math display">2</span></td>                                                                        |
| <td><span class="math display">3</span></td>                                                                        |
| <td><span class="math display">4</span></td>                                                                        |
| </tr>                                                                                                               |
| <tr>                                                                                                                |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>−</strong><strong>2</strong></span></td>                                               |
| <td><span class="math display">−2</span></td>                                                                       |
| <td><span class="math display">$$- \frac{3}{2}$$</span></td>                                                        |
| <td><span class="math display">−1</span></td>                                                                       |
| <td><span class="math display">$$- \frac{1}{2}$$</span></td>                                                        |
| <td style="text-align: center;">0</td>                                                                              |
| <td><span class="math display">$$\frac{1}{2}$$</span></td>                                                          |
| <td><span class="math display">1</span></td>                                                                        |
| <td><span class="math display">$$\frac{3}{2}$$</span></td>                                                          |
| <td><span class="math display">2</span></td>                                                                        |
| </tr>                                                                                                               |
| <tr>                                                                                                                |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>−</strong><strong>3</strong></span></td>                                               |
| <td><span class="math display">$$- \frac{4}{3}$$</span></td>                                                        |
| <td><span class="math display">−1</span></td>                                                                       |
| <td><span class="math display">$$- \frac{2}{3}$$</span></td>                                                        |
| <td><span class="math display">$$- \frac{1}{3}$$</span></td>                                                        |
| <td style="text-align: center;">0</td>                                                                              |
| <td><span class="math display">$$\frac{1}{3}$$</span></td>                                                          |
| <td><span class="math display">$$\frac{2}{3}$$</span></td>                                                          |
| <td><span class="math display">1</span></td>                                                                        |
| <td><span class="math display">$$\frac{4}{3}$$</span></td>                                                          |
| </tr>                                                                                                               |
| <tr>                                                                                                                |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>−</strong><strong>4</strong></span></td>                                               |
| <td><span class="math display">−1</span></td>                                                                       |
| <td><span class="math display">$$- \frac{3}{4}$$</span></td>                                                        |
| <td><span class="math display">$$- \frac{1}{2}$$</span></td>                                                        |
| <td><span class="math display">$$- \frac{1}{4}$$</span></td>                                                        |
| <td style="text-align: center;">0</td>                                                                              |
| <td><span class="math display">$$\frac{1}{4}$$</span></td>                                                          |
| <td><span class="math display">$$\frac{1}{2}$$</span></td>                                                          |
| <td><span class="math display">$$\frac{3}{4}$$</span></td>                                                          |
| <td><span class="math display">1</span></td>                                                                        |
| </tr>                                                                                                               |
| <tr>                                                                                                                |
| <td style="text-align: center;"><p><span                                                                            |
| class="math inline"> <strong>y</strong></span></p>                                                                  |
| <p><span class="math display"><strong>x</strong> </span></p></td>                                                   |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>−</strong><strong>4</strong></span></td>                                               |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>−</strong><strong>3</strong></span></td>                                               |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>−</strong><strong>2</strong></span></td>                                               |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>−</strong><strong>1</strong></span></td>                                               |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>0</strong></span></td>                                                                 |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>1</strong></span></td>                                                                 |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>2</strong></span></td>                                                                 |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>3</strong></span></td>                                                                 |
| <td style="text-align: center;"><span                                                                               |
| class="math display"><strong>4</strong></span></td>                                                                 |
| </tr>                                                                                                               |
| </tbody>                                                                                                            |
| </table>                                                                                                            |
+---------------------------------------------------------------------------------------------------------------------+
| - **Isoclines**                                                                                                     |
+---------------------------------------------------------------------------------------------------------------------+
| An **isocline** is a curve connecting all points where the slope field segments have the same gradient.             |
+---------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** isoclines                                                                                                                                                                                                                                                                                                                                                    |
+=========================================================================================================================+=========================================================================================================================+=========================================================================================================================+
| a.  ![](media/Further Applications of Calculus 4_Differential equations/media/image17.png){width="1.9722222222222223in" | b.  ![](media/Further Applications of Calculus 4_Differential equations/media/image18.png){width="1.9722222222222223in" | c.  ![](media/Further Applications of Calculus 4_Differential equations/media/image19.png){width="1.9715277777777778in" |
|     height="1.9465277777777779in"}                                                                                      |     height="1.9662193788276465in"}                                                                                      |     height="1.9465277777777779in"}                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| d.  ![](media/Further Applications of Calculus 4_Differential equations/media/image20.png){width="1.9722222222222223in" | e.  ![](media/Further Applications of Calculus 4_Differential equations/media/image21.png){width="1.9715277777777778in" | f.  ![](media/Further Applications of Calculus 4_Differential equations/media/image22.png){width="1.9680555555555554in" |
|     height="1.9430555555555555in"}                                                                                      |     height="1.9430555555555555in"}                                                                                      |     height="1.9430555555555555in"}                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| g.  ![](media/Further Applications of Calculus 4_Differential equations/media/image23.png){width="1.9682699037620297in" | h.  ![](media/Further Applications of Calculus 4_Differential equations/media/image24.png){width="1.9697736220472442in" | i.  ![](media/Further Applications of Calculus 4_Differential equations/media/image25.png){width="1.9638199912510936in" |
|     height="1.9430555555555555in"}                                                                                      |     height="1.9430555555555555in"}                                                                                      |     height="1.9430555555555555in"}                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                                                                                                                                                                                                                                                                        |
+=====================================================================================================================+===================================================================================================================================================+====================================================================================================================+
| For the DE $y' = x + y$,                                                                                                                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| a.  Complete a slope table for $x,y \in \left\{ - 2,\  - 1,\ 0,1,2 \right\}$                                                                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| b.  Confirm that the slope field matches the table.                                                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| c.  Sketch the solution curve going through the origin.                                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image26.png){width="3.0050251531058616in" height="2.952450787401575in"}                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| +------------------+------------------+------------------+------------------+----------------+----------------+----------------+----------------+                                                                                                                                                                                                                                            |
| | $$\mathbf{3}$$   |                  |                  |                  |                |                |                |                |                                                                                                                                                                                                                                            |
| +:================:+==================+==================+==================+:==============:+================+================+================+                                                                                                                                                                                                                                            |
| | $$\mathbf{2}$$   |                  |                  |                  |                |                |                |                |                                                                                                                                                                                                                                            |
| +------------------+------------------+------------------+------------------+----------------+----------------+----------------+----------------+                                                                                                                                                                                                                                            |
| | $$\mathbf{1}$$   |                  |                  |                  |                |                |                |                |                                                                                                                                                                                                                                            |
| +------------------+------------------+------------------+------------------+----------------+----------------+----------------+----------------+                                                                                                                                                                                                                                            |
| | $$\mathbf{0}$$   |                  |                  |                  |                |                |                |                |                                                                                                                                                                                                                                            |
| +------------------+------------------+------------------+------------------+----------------+----------------+----------------+----------------+                                                                                                                                                                                                                                            |
| | $$\mathbf{- 1}$$ |                  |                  |                  |                |                |                |                |                                                                                                                                                                                                                                            |
| +------------------+------------------+------------------+------------------+----------------+----------------+----------------+----------------+                                                                                                                                                                                                                                            |
| | $$\mathbf{- 2}$$ |                  |                  |                  |                |                |                |                |                                                                                                                                                                                                                                            |
| +------------------+------------------+------------------+------------------+----------------+----------------+----------------+----------------+                                                                                                                                                                                                                                            |
| | $$\mathbf{- 3}$$ |                  |                  |                  |                |                |                |                |                                                                                                                                                                                                                                            |
| +------------------+------------------+------------------+------------------+----------------+----------------+----------------+----------------+                                                                                                                                                                                                                                            |
| | $\ \mathbf{y}$   | $$\mathbf{- 3}$$ | $$\mathbf{- 2}$$ | $$\mathbf{- 1}$$ | $$\mathbf{0}$$ | $$\mathbf{1}$$ | $$\mathbf{2}$$ | $$\mathbf{3}$$ |                                                                                                                                                                                                                                            |
| |                  |                  |                  |                  |                |                |                |                |                                                                                                                                                                                                                                            |
| | $$\mathbf{x\ }$$ |                  |                  |                  |                |                |                |                |                                                                                                                                                                                                                                            |
| +------------------+------------------+------------------+------------------+----------------+----------------+----------------+----------------+                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| d.  Identify the isocline where the slope is 0. Confirm this algebraically by setting $y' = 0$.                                                                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| Using the graph, $y = - x$.                                                                                                                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| Algebraically: Set $y' = \ 0$                                                                                                                                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| $x\  + \ y\  = \ 0$, so $y\  = \  - x$.                                                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| e.  By substituting into the DE, show that all lines in the family $y = - x + c$ are also isoclines.                                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| On any line $y\  = \  - x\  + \ c$, we have $y' = x + y = x + ( - x + c) = c$.                                                                                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| So $y' = c$ (a constant) on that line, making it an isocline.                                                                                                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| f.  Draw the isocline $y = - x - 1$, what is special about this isocline?                                                                                                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| $y = - x - 1$ is an isoline that is itself a solution to the DE.                                                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| So, solution curves approach this line asymptotically.                                                                                                                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| Also, solution curves below this line are concave down and above are concave up.                                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| g.  Show that $y = Ce^{x} - x - 1$ is a solution, for all constants $C$.                                                                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| $$y\  = \ Ce^{x} - \ x\  - \ 1$$                                                                                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| $$y' = \ Ce^{x} - \ 1$$                                                                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| $$LHS = y' = Ce^{x} - \ 1$$                                                                                                                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| $$RHS = x\  + \ y$$                                                                                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| $$= \ x\  + \left( \ Ce^{x} - \ x\  - \ 1 \right)$$                                                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| $$= \ Ce^{x} - \ 1$$                                                                                                                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                                                                              |
| $\therefore\ y\  = \ Ce^{x} - \ x\  - \ 1$ satisfies $y'\  = \ x\  + \ y$ for all constants $C$.                                                                                                                                                                                                                                                                                             |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Properties of isoclines                                                                                                                                                                                                                                                                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| A solution curve has a stationary point where it **crosses** the isocline $\frac{dy}{dx} = \ 0$.                                                                                                                                                                                                                                                                                             |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------+
| Slope field                                                                                                         | Family of solution curves                                                                                                                         | Isocline $\frac{dy}{dx} = 0$                                                                                       |
|                                                                                                                     |                                                                                                                                                   |                                                                                                                    |
| $$\frac{dy}{dx} = 2x - 2$$                                                                                          | $$y = x^{2} - 2x + C$$                                                                                                                            | for stationary points                                                                                              |
|                                                                                                                     |                                                                                                                                                   |                                                                                                                    |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image27.png){width="1.9625in"             | ![](media/Further Applications of Calculus 4_Differential equations/media/image28.png){width="1.9625in" height="1.9400962379702538in"}            | ![](media/Further Applications of Calculus 4_Differential equations/media/image29.png){width="1.962529527559055in" |
| height="1.9340277777777777in"}                                                                                      |                                                                                                                                                   | height="1.9371391076115485in"}                                                                                     |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------+
| Slope field                                                                                                         | ![](media/Further Applications of Calculus 4_Differential equations/media/image30.png){width="1.9972954943132109in"                               | Isocline $\frac{dy}{dx} = 0$                                                                                       |
|                                                                                                                     | height="1.968503937007874in"}![](media/Further Applications of Calculus 4_Differential equations/media/image31.png){width="1.99375in"             |                                                                                                                    |
| $$\frac{dy}{dx} = \sin x$$                                                                                          | height="1.9680555555555554in"}![](media/Further Applications of Calculus 4_Differential equations/media/image32.png){width="1.9972222222222222in" | for stationary points                                                                                              |
|                                                                                                                     | height="1.9680555555555554in"}Family of solution curves                                                                                           |                                                                                                                    |
|                                                                                                                     |                                                                                                                                                   |                                                                                                                    |
|                                                                                                                     | $$y = - \cos x + C$$                                                                                                                              |                                                                                                                    |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------+
| Slope field                                                                                                         | ![](media/Further Applications of Calculus 4_Differential equations/media/image34.png){width="1.9972976815398076in"                               | Isocline $\frac{dy}{dx} = 0$                                                                                       |
|                                                                                                                     | height="1.9669892825896762in"}Family of solution curves                                                                                           |                                                                                                                    |
| $$\frac{dy}{dx} = y - x$$                                                                                           |                                                                                                                                                   | ![](media/Further Applications of Calculus 4_Differential equations/media/image35.png){width="1.99375in"           |
|                                                                                                                     | $$y = x + 1 + Ce^{x}$$                                                                                                                            | height="1.9645833333333333in"}for stationary points                                                                |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image33.png){width="1.9969302274715661in" |                                                                                                                                                   |                                                                                                                    |
| height="1.9680555555555554in"}                                                                                      |                                                                                                                                                   |                                                                                                                    |
+---------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Properties of isoclines                                                                                                                                                                                                                                                                                                                                                       |
+=====================================================================================================================+============================================================+============================================================+===================================================================================================================================================+
| Sone isoclines are lines consisting of line elements with the same gradient as the line.                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| Such an isocline is a solution curve; no other solution curve crosses it.                                                                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| It divides the other solutions into two groups on either side.                                                                                                                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| Some of the solution curves have this line as an asymptote.                                                                                                                                                                                                                                                                                                                                       |
+---------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+
| Slope field                                                                                                         | ![](media/Further Applications of Calculus 4_Differential equations/media/image37.png){width="1.9923140857392825in"     | Isocline $y = 2$                                                                                                                                  |
|                                                                                                                     | height="1.9680555555555554in"}Family of solution curves                                                                 |                                                                                                                                                   |
| $$\frac{dy}{dx} = (x - 1)(y - 2)$$                                                                                  |                                                                                                                         | that is itself a solution curve                                                                                                                   |
|                                                                                                                     | $$y = Ce^{\frac{(x - 1)^{2}}{2}} + 2$$                                                                                  |                                                                                                                                                   |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image36.png){width="1.9969302274715661in" |                                                                                                                         | ![](media/Further Applications of Calculus 4_Differential equations/media/image38.png){width="1.99375in" height="1.9618055555555556in"}           |
| height="1.9680555555555554in"}                                                                                      |                                                                                                                         |                                                                                                                                                   |
+---------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+
| Slope field                                                                                                         | ![](media/Further Applications of Calculus 4_Differential equations/media/image39.png){width="1.992361111111111in"      | Isocline $y = x$                                                                                                                                  |
|                                                                                                                     | height="1.965130139982502in"}Family of solution curves                                                                  |                                                                                                                                                   |
| $$\frac{dy}{dx} = \frac{2y}{x} - 1$$                                                                                |                                                                                                                         | ![](media/Further Applications of Calculus 4_Differential equations/media/image40.png){width="1.9965277777777777in"                               |
|                                                                                                                     | $$y = x + Cx^{2}$$                                                                                                      | height="1.9673611111111111in"}that is itself a solution curve                                                                                     |
|                                                                                                                     |                                                                                                                         |                                                                                                                                                   |
|                                                                                                                     |                                                                                                                         | ![](media/Further Applications of Calculus 4_Differential equations/media/image41.png){width="1.9904997812773404in"                               |
|                                                                                                                     |                                                                                                                         | height="1.9618055555555556in"}                                                                                                                    |
+---------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+
| Slope field                                                                                                         | Family of solution curves                                                                                               | Isoclines $y = 3,\  - 1$                                                                                                                          |
|                                                                                                                     |                                                                                                                         |                                                                                                                                                   |
| $$\frac{dy}{dx} = (y - 3)(y + 1)$$                                                                                  | $$y = \frac{3 + Ce^{4x}}{1 - Ce^{4x}}$$                                                                                 | that are itself solution curves                                                                                                                   |
|                                                                                                                     |                                                                                                                         |                                                                                                                                                   |
|                                                                                                                     |                                                                                                                         | ![](media/Further Applications of Calculus 4_Differential equations/media/image42.png){width="1.9958333333333333in"                               |
|                                                                                                                     |                                                                                                                         | height="1.9673611111111111in"}and an asymptote for others                                                                                         |
|                                                                                                                     |                                                                                                                         |                                                                                                                                                   |
|                                                                                                                     |                                                                                                                         | ![](media/Further Applications of Calculus 4_Differential equations/media/image43.png){width="1.9902777777777778in"                               |
|                                                                                                                     |                                                                                                                         | height="1.9583333333333333in"}![](media/Further Applications of Calculus 4_Differential equations/media/image44.png){width="1.9902777777777778in" |
|                                                                                                                     |                                                                                                                         | height="1.9631944444444445in"}                                                                                                                    |
+---------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** using isoclines to identify the DE                                                                                                                                                                                                                                                                                                                                            |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Horizontal isocline test**                                                                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| A horizontal isocline at $y = c$ is a horizontal line where every slope element is flat, meaning $G(x,\ c) = 0$ for **all** values of $x$.                                                                                                                                                                                                                                                        |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Further Applications of Calculus 4_Differential equations/media/image45.png){width="2.3965277777777776in" height="2.3618055555555557in"}                               | For the slope field to the left, which could be its equation?                                                                                                                                                  |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | A.  $y' = y - x$                                                                                                                                                                                               |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | B.  $y' = y^{2} - y - 2$                                                                                                                                                                                       |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | C.  $y' = (y - 2)(y + 2)$                                                                                                                                                                                      |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | D.  $y' = (y - 2)(y - 1)$                                                                                                                                                                                      |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | B                                                                                                                                                                                                              |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Vertical isocline test**                                                                                                                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| A vertical isocline at $x = a$ is a vertical line where every slope element is flat, meaning $G(a,\ y)\  = \ 0$ for **all** values of $y$.                                                                                                                                                                                                                                                        |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Further Applications of Calculus 4_Differential equations/media/image46.png){width="2.4194444444444443in" height="2.3618055555555557in"}                               | For the slope field to the left, which could be its equation?                                                                                                                                                  |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | A.  $y' = \cos y$                                                                                                                                                                                              |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | B.  $y' = \sin y$                                                                                                                                                                                              |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | C.  $y' = \cos x$                                                                                                                                                                                              |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | D.  $y' = \sin x$                                                                                                                                                                                              |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | C                                                                                                                                                                                                              |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Sign pattern test**                                                                                                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| Identify where slopes are positive, negative, and zero in the field.\                                                                                                                                                                                                                                                                                                                             |
| This is especially useful if all slope elements are a certain sign in an entire quadrant.                                                                                                                                                                                                                                                                                                         |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Further Applications of Calculus 4_Differential equations/media/image47.png){width="2.3965277777777776in" height="2.3618055555555557in"}                               | For the slope field to the left, which could be its equation?                                                                                                                                                  |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | A.  $y' = x + y$                                                                                                                                                                                               |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | B.  $y' = x - y$                                                                                                                                                                                               |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | C.  $y' = xy$                                                                                                                                                                                                  |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | D.  $y' = - xy$                                                                                                                                                                                                |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | D                                                                                                                                                                                                              |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** using isoclines to identify the DE                                                                                                                                                                                                                                                                                                                                            |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Symmetry test**                                                                                                                                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| $\frac{\mathbf{dy}}{\mathbf{dx}}$ $\mathbf{= f}\left( \mathbf{x} \right)\mathbf{:}$ slope depends only on $x$, so all elements in a vertical column are identical.                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| $\frac{\mathbf{dy}}{\mathbf{dx}}$ $\mathbf{= \ g}\left( \mathbf{y} \right)$**:** slope depends only on $y$, so all elements in a horizontal row are identical.                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| $\frac{\mathbf{dy}}{\mathbf{dx}}$ $\mathbf{\  = \ h}\left( \frac{\mathbf{x}}{\mathbf{y}} \right)$ or $\frac{\mathbf{dy}}{\mathbf{dx}}$ $\mathbf{= \ h}\left( \frac{\mathbf{y}}{\mathbf{x}} \right)\mathbf{:}$ (scale invariance); slope is constant along diagonals from the origin.                                                                                                              |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Further Applications of Calculus 4_Differential equations/media/image48.png){width="2.3965277777777776in" height="2.361540901137358in"}                                | For the slope field to the left, which could be its equation?                                                                                                                                                  |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | A.  $y' = \tan y$                                                                                                                                                                                              |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | B.  $y' = \tan x$                                                                                                                                                                                              |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | C.  $y' = \tan(x + y)$                                                                                                                                                                                         |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | D.  $y' = \tan x - y$                                                                                                                                                                                          |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | A                                                                                                                                                                                                              |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Behaviour near the axes**                                                                                                                                                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| Some DEs are undefined or tend to infinity when $x = 0$ or $y = 0$, producing nearly vertical slope elements at the axes.                                                                                                                                                                                                                                                                         |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Further Applications of Calculus 4_Differential equations/media/image49.png){width="2.3965266841644794in" height="2.361540901137358in"}                                | For the slope field to the left, which could be its equation?                                                                                                                                                  |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | A.  $y' = \frac{y}{2x}$                                                                                                                                                                                        |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | B.  $y' = - \frac{y}{2x}$                                                                                                                                                                                      |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | C.  $y' = \frac{x}{2y}$                                                                                                                                                                                        |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | D.  $y' = - \frac{x}{2y}$                                                                                                                                                                                      |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | C                                                                                                                                                                                                              |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Slope at the origin**                                                                                                                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| Substituting (0, 0) gives the slope at the origin, which can be read directly from the field.                                                                                                                                                                                                                                                                                                     |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Further Applications of Calculus 4_Differential equations/media/image50.png){width="2.3965266841644794in" height="2.3615398075240597in"}                               | For the slope field to the left, which could be its equation?                                                                                                                                                  |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | A.  $y' = 1 - x$                                                                                                                                                                                               |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | B.  $y' = x + y$                                                                                                                                                                                               |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | C.  $y' = y - 1$                                                                                                                                                                                               |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | D.  $y' = 1 - y$                                                                                                                                                                                               |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | D                                                                                                                                                                                                              |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** using isoclines to identify the DE                                                                                                                                                                                                                                                                                                                                            |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Slope at specific points**                                                                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                                   |
| Substitute test points where the options would give different values.                                                                                                                                                                                                                                                                                                                             |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Further Applications of Calculus 4_Differential equations/media/image51.png){width="2.3965255905511813in" height="2.3615398075240597in"}                               | For the slope field to the left, which could be its equation? Try $(1,1)$ and $( - 1,1)$.                                                                                                                      |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | A.  $y' = y - x$                                                                                                                                                                                               |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | B.  $y' = x^{2} - y$                                                                                                                                                                                           |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | C.  $y' = x + y^{2}$                                                                                                                                                                                           |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | D.  $y' = x^{2} - 2y$                                                                                                                                                                                          |
|                                                                                                                                                                                  |                                                                                                                                                                                                                |
|                                                                                                                                                                                  | B                                                                                                                                                                                                              |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  A slope field displays short line elements whose gradient is  |
|     given by a ..................... ........................     |
|                                                                   |
| 2.  A solution curve is drawn by following the direction of the   |
|     ............ ...................                              |
|                                                                   |
| 3.  Two solution curves of a first-order DE can never             |
|     .....................                                         |
|                                                                   |
| 4.  An isocline is a curve along which all line elements have the |
|     same ........................                                 |
+-------------------------------------------------------------------+

Foundation

1.  Find the value of $y'$ at the given point.

+--------------------------------+------------------------------+---------------------------------+
| a.  $y' = \ 2x\  - \ 3$ at (1, | b.  $y' = \ 2\ \cos\ x - 1$  | c.  $y'\  = \ 4\  - \ y^{2}\$at |
|     1)                         |     at (0, 0)                |     (0, 1)                      |
|                                |                              |                                 |
| $$- 1$$                        | $$1$$                        | $$3$$                           |
+================================+==============================+=================================+
| d.  $y' = \frac{1}{1\  + \ y}$ | e.  $y' = \frac{y}{x} + \ 1$ | f.  $y'\  = \ xy\  - \ x$ at    |
|     at (3, 1)                  |     at (−2, 1)               |     (1, −2)                     |
|                                |                              |                                 |
| $$\frac{1}{2}$$                | $$\frac{1}{2}$$              | $$- 3$$                         |
+--------------------------------+------------------------------+---------------------------------+

2.  For the differential equation $y' = \frac{1}{2}x\  - \ 1$:

    a.  ![](media/Further Applications of Calculus 4_Differential equations/media/image52.png){width="2.46875in"
        height="2.3466469816272966in"}![](media/Further Applications of Calculus 4_Differential equations/media/image53.png){width="2.46875in"
        height="2.4277471566054243in"}Complete the table of values for
        the slope field.

$y' = \frac{1}{2}x\  - \ 1$ depends only on $x$, so each row is
identical.

  ---------------------------------------------------------------------------
   $$\mathbf{y/x}$$  **−1**   **0**   **1**   **2**   **3**   **4**   **5**
  ------------------ -------- ------- ------- ------- ------- ------- -------
        **5**        −3/2     −1      −1/2    0       1/2     1       3/2

        **4**        −3/2     −1      −1/2    0       1/2     1       3/2

        **3**        −3/2     −1      −1/2    0       1/2     1       3/2

        **2**        −3/2     −1      −1/2    0       1/2     1       3/2

        **1**        −3/2     −1      −1/2    0       1/2     1       3/2

        **0**        −3/2     −1      −1/2    0       1/2     1       3/2

        **−1**       −3/2     −1      −1/2    0       1/2     1       3/2
  ---------------------------------------------------------------------------

b.  Through each grid point above, draw a line element $\frac{1}{2}$ cm
    long centred on the point with gradient from the table.

c.  Notice that $x\  = \ 1$ is an isocline. Why is this expected from
    the table?

At $x\  = \ 1:\ y'\  = \ (1/2)(1)\  - \ 1\  = \  - \frac{1}{2}$ for
every $y$.

Every entry in that column is the same, confirming $x\  = \ 1$ is an
isocline.

d.  Check for any other isoclines.

Every vertical line $x\  = \ k$ is an isocline (since $y'\$depends only
on $x$).

e.  The slope field indicates positive gradient to the right of
    $x\  = \ 2$ and negative gradient to the left of $x\  = \ 2$. What
    will be the concavity of a solution curve?

$y'\$increases as $x$ increases past$\ x = 2$, This means $y^{''} > 0$
so the solution curve is concave up.

f.  Starting at the origin, draw an integral curve to the right and to
    the left.\
    What type of curve might this be?

The curve through the origin is a parabola.

g.  Draw two more integral curves starting at (0, 2) and (0, 3), making
    sure none cross.

<!-- -->

3.  For the differential equation $y'\  + \ y\  = \ x:$

    a.  Make $y'\$the subject.

$$y' = \ x\  - \ y$$

b.  Complete the table of values for the slope field.

![](media/Further Applications of Calculus 4_Differential equations/media/image54.png){width="2.4680555555555554in"
height="2.407115048118985in"}![](media/Further Applications of Calculus 4_Differential equations/media/image55.png){width="2.4680555555555554in"
height="2.4270647419072615in"}

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
           $$\mathbf{y\backslash x}$$           $$\mathbf{- 1}$$   $$\mathbf{-}\frac{\mathbf{1}}{\mathbf{2}}$$   $$\mathbf{0}$$   $$\frac{\mathbf{1}}{\mathbf{2}}$$   $$\mathbf{1}$$   $$\frac{\mathbf{3}}{\mathbf{2}}$$   $$\mathbf{2}$$
  --------------------------------------------- ------------------ --------------------------------------------- ---------------- ----------------------------------- ---------------- ----------------------------------- ----------------
                 $$\mathbf{1}$$                 −2                 −3/2                                          −1               −1/2                                0                1/2                                 1

        $$\frac{\mathbf{1}}{\mathbf{2}}$$       −3/2               −1                                            −1/2             0                                   1/2              1                                   3/2

                 $$\mathbf{0}$$                 −1                 −1/2                                          0                1/2                                 1                3/2                                 2

   $$\mathbf{-}\frac{\mathbf{1}}{\mathbf{2}}$$  −1/2               0                                             1/2              1                                   3/2              2                                   5/2

                $$\mathbf{- 1}$$                0                  1/2                                           1                3/2                                 2                5/2                                 3

   $$\mathbf{-}\frac{\mathbf{3}}{\mathbf{2}}$$  1/2                1                                             3/2              2                                   5/2              3                                   7/2

                $$\mathbf{- 2}$$                1                  3/2                                           2                5/2                                 3                7/2                                 4
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

c.  Through each grid point above, draw a line element $\frac{1}{2}$ cm
    long with gradient from the table.

d.  Look for matching entries (isoclines) in the table and check they
    agree with your graph.

Matching entries (same $y'\$value) occur along $y\  = \ x\  + \ k$ for
constant $k$. The isoclines are lines $y\  = \ x\  + \ k.$

e.  What concavity would you expect for the solution curve through the
    origin?

$$y''\  = \ 1\  - \ y'\ $$

Along $y\  = \ x$ (where $y'\  = \ 0$)

$y''\  = \ 1\  - 0\  > \ 0$, so concave up

f.  Draw this solution curve.

g.  Add solution curves through (−1, −1) and (1, −1).

h.  Which line do all solution curves appear to have as an asymptote?

All solution curves appear to have $y = x - 1$ as an asymptote.

i.  Is this line a solution of the DE?

Test $y = x - 1:\ y'\  = \ 1.$

Sub into DE: $y' = x - y = x = (x\  - \ 1) = 1.$

Yes, the isocline is itself a solution.

4.  Use Desmos to plot the following slope fields.

- <https://www.desmos.com/calculator/cwkp7gveor>

In each case:

i.  identify isoclines where y\' = 0

ii. identify any other obvious isoclines

+--------------------------------+-------------------------------------+--------------------------------------------------+
| a.  $y'\  = \  - y^{2}$        | b.  $\ y'\  = \  - \frac{1}{x^{2}}$ | c.  $y'\  = \ \cos\left( \frac{\pi}{4}x \right)$ |
|                                |                                     |                                                  |
| **i** $y'\  = \ 0$ when        | **i** no isocline where             | **i** $y'\  = \ 0$ where                         |
| $y\  = \ 0$                    | $y'\  = \ 0$                        | $\cos\left( \frac{\pi}{4}x \right) = \ 0$,\      |
|                                |                                     | i.e$.\ x\  = \ 2,\  - 2$ (and x = 6, −6 etc.)    |
| **ii** horizontal lines        | **ii** vertical lines $x\  = \ k$   |                                                  |
| $y\  = \ k$ are isoclines      | are isoclines                       | **ii** vertical lines $x\  = \ k$ are isoclines  |
+================================+=====================================+==================================================+
| d.  $y' = \ 1\  - \ x\  + \ y$ | e.  $y' = \frac{2y}{x} - \ y$       | f.  $y' = \frac{2x}{y\  + \ 1} - \ x$            |
|                                |                                     |                                                  |
| **i** $y'\  = \ 0\$when        | **i** $y'\  = \ 0$ when $x\  = \ 2$ | **i** $x\  = \ 0$ and $y\  = \ 1$                |
| $y\  = \ x\  - \ 1$            |                                     |                                                  |
|                                | **ii** $y\  = \ 0$ is an isocline   | **ii** no other isoclines                        |
| **ii** lines                   |                                     |                                                  |
| $y\  = \ x\  + \ k$ are        |                                     |                                                  |
| isoclines                      |                                     |                                                  |
+--------------------------------+-------------------------------------+--------------------------------------------------+

5.  For each slope field, draw solution curves through the two given
    points.

+--------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  **i** (0, 0) **ii** (2, 0)                                                                                                                   | b.  **i** (0, 0) **ii** (1, 3)                                                                                                                   | c.  **i** (0, 1) **ii** (1, 0)                                                                                                                   |
|                                                                                                                                                  |                                                                                                                                                  |                                                                                                                                                  |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image56.png){width="2.0174442257217846in"                              | ![](media/Further Applications of Calculus 4_Differential equations/media/image58.png){width="2.016984908136483in"                               | ![](media/Further Applications of Calculus 4_Differential equations/media/image59.png){width="2.0174442257217846in"                              |
| height="1.968503937007874in"}![](media/Further Applications of Calculus 4_Differential equations/media/image57.png){width="2.0174442257217846in" | height="2.004514435695538in"}![](media/Further Applications of Calculus 4_Differential equations/media/image57.png){width="2.0174442257217846in" | height="1.968503937007874in"}![](media/Further Applications of Calculus 4_Differential equations/media/image57.png){width="2.0174442257217846in" |
| height="1.968503937007874in"}                                                                                                                    | height="1.968503937007874in"}                                                                                                                    | height="1.968503937007874in"}                                                                                                                    |
+==================================================================================================================================================+==================================================================================================================================================+==================================================================================================================================================+
| d.  **i** (−2, 0) **ii** (2, 0)                                                                                                                  | e.  ![](media/Further Applications of Calculus 4_Differential equations/media/image57.png){width="2.0174442257217846in"                          | f.  **i** (1, 1) **ii** (−2, 1)                                                                                                                  |
|                                                                                                                                                  |     height="1.968503937007874in"}**i** (0, 2) **ii** (−2, 0)                                                                                     |                                                                                                                                                  |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image60.png){width="2.0174442257217846in"                              |                                                                                                                                                  | ![](media/Further Applications of Calculus 4_Differential equations/media/image62.png){width="2.016639326334208in"                               |
| height="1.968503937007874in"}                                                                                                                    | ![](media/Further Applications of Calculus 4_Differential equations/media/image61.png){width="2.0174442257217846in"                              | height="2.067707786526684in"}![](media/Further Applications of Calculus 4_Differential equations/media/image57.png){width="2.0174442257217846in" |
|                                                                                                                                                  | height="1.968503937007874in"}![](media/Further Applications of Calculus 4_Differential equations/media/image57.png){width="2.0174442257217846in" | height="1.968503937007874in"}                                                                                                                    |
|                                                                                                                                                  | height="1.968503937007874in"}                                                                                                                    |                                                                                                                                                  |
+--------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+

6.  For each slope field in the previous question, determine whether\
    $y' = f(x)$, $y' = g(y),$ or some combination.

+----------------------+----------------------+----------------------+
| a.                   | b.                   | c.                   |
|                      |                      |                      |
| Vertical isoclines → | Vertical isoclines → | Horizontal isoclines |
| $y'\  = \ f(x)$      | $y'\  = \ f(x)$      | → $y'\  = \ g(y)$    |
+======================+======================+======================+
| d.                   | e.                   | f.                   |
|                      |                      |                      |
| Horizontal isoclines | Diagonal isoclines   | Diagonal isoclines   |
| → $y'\  = \ g(y)$    |                      |                      |
|                      | → $y'$ is a          | → $y'$ is a          |
|                      | combination of $x$   | combination of $x$   |
|                      | and $y$              | and $y$              |
+----------------------+----------------------+----------------------+

Development

7.  ![](media/Further Applications of Calculus 4_Differential equations/media/image63.png){width="2.0881944444444445in"
    height="1.9097222222222223in"}![](media/Further Applications of Calculus 4_Differential equations/media/image64.png){width="1.9944444444444445in"
    height="1.9680555555555554in"}The slope field for
    $y' = \  - \frac{1}{2}x\  - \ y$ is shown.

    a.  Draw solution curves through (−2, 0) and (2, 0).

    b.  Look at line elements on $x = 1$, from bottom to top. Do
        gradients increase or decrease?

As $y$ increases (bottom to top), $y'\$decreases. Gradients decrease.

c.  Explain why $y\  = \frac{1}{2} - \frac{1}{2}x$ is an isocline.

Sub $y = \frac{1}{2} - \frac{1}{2}x$ into the DE

$$y' = \  - \frac{1}{2}(x) - \ y\  = \  - \frac{x}{2} - \ \left( \frac{1}{2} - \frac{x}{2} \right) = \  - \frac{1}{2}$$

The gradient $y'$ is constant along $y = \frac{1}{2} - \frac{1}{2}x$, so
it is an isocline.

d.  Show that this isocline is also a solution of the DE, then add it to
    your copy.

Sub $y\  = \frac{1}{2} - \frac{1}{2}x$ into
$y' = \  - \frac{1}{2}x\  - \ y$:

RHS =
$- \frac{x}{2} - \ \left( \frac{1}{2} - \frac{x}{2} \right) = \  - \frac{1}{2}$

LHS = $y'\  = \  - \frac{1}{2}$ (slope of the line)

Therefore $y\  = \frac{1}{2} - \frac{1}{2}x$ is a solution of the DE.

e.  What do you notice about the isocline and the two solution curves?

The isocline is an asymptote for both solution curves.

8.  ![](media/Further Applications of Calculus 4_Differential equations/media/image65.png){width="2.061111111111111in"
    height="1.9680555555555554in"}![](media/Further Applications of Calculus 4_Differential equations/media/image66.png){width="2.0618055555555554in"
    height="1.9680555555555554in"}Consider the differential equation
    $y' = \frac{9\  - \ y^{2}}{9}$ and its slope field.

    a.  What are the constant solutions?

Constant solutions occur where $y' = \ 0$

$$\frac{9\  - \ y^{2}}{9} = \ 0\ \ $$

$$y^{2} = \ 9$$

$y = 3$ and $y = - 3$

b.  Are these constant solutions isoclines?

yes

c.  Draw the solution curve through (0,0).

d.  By considering other solution curves, what can you say about the
    isoclines?

The isoclines are asymptotes for the solution curves

9.  Which slope field (A, B, C, or D) corresponds to
    $y'\  = \  - 2\  - \ y$?

+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------+
| A.  ![](media/Further Applications of Calculus 4_Differential equations/media/image67.png){width="1.5748031496062993in" | B.  ![](media/Further Applications of Calculus 4_Differential equations/media/image67.png){width="1.5748031496062993in"                               |
|     height="1.5748031496062993in"}                                                                                      |     height="1.5748031496062993in"}                                                                                                                    |
+=========================================================================================================================+=======================================================================================================================================================+
| C.                                                                                                                      | D.  ![](media/Further Applications of Calculus 4_Differential equations/media/image67.png){width="1.5743055555555556in"                               |
|                                                                                                                         |     height="1.5743055555555556in"}![](media/Further Applications of Calculus 4_Differential equations/media/image67.png){width="1.5748031496062993in" |
|                                                                                                                         |     height="1.5748031496062993in"}                                                                                                                    |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------+

$y'$ depends only on $y$, so horizontal isoclines. This eliminates A and
B

$$y'\  = \  - 2\  - \ y.$$

Constant solution: $y'\  = \ 0$ when $y\  = \  - 2$ (horizontal isocline
at $y\  = \  - 2$). (this doesn't eliminate any options)

For $y\  > \  - 2:\ y'\  < \ 0$ (negative gradients). For
$y\  < \  - 2:\ y'\  > \ 0\$(positive gradients).

D matches these conditions.

10. ![](media/Further Applications of Calculus 4_Differential equations/media/image68.png){width="1.9652668416447945in"
    height="1.968503937007874in"}Which DE (A, B, C, or D) corresponds to
    the given slope field?

**A** $y' = \frac{1}{3}\left( x^{2} - \ 3 \right)$

**B** $y' = \frac{1}{3}\left( y^{2} - \ 3 \right)$

**C** $y' = \frac{1}{3}\left( 3\  - \ x^{2} \right)$

**D** $y' = \frac{1}{3}\left( 3\  - \ y^{2} \right)$

The slope field has vertical isoclines

($y'$ depends only on $x$),

so options B and D are eliminated.

At $x = 0$, the slopes are positive. This eliminates A.

So, C must be the answer.

11. ![](media/Further Applications of Calculus 4_Differential equations/media/image69.png){width="2.0152613735783027in"
    height="1.968503937007874in"}Determine the DE corresponding to the
    slope field.

**A** $y' = \ x\  + \frac{1}{2}y\ \ \ \ \$\
**B** $y' = \ x\  - \frac{1}{2}y\ \ \$\
**C** $y' = \frac{1}{2}x\  + \ y$\
**D** $y' = \frac{1}{2}x\  - \ y$

At (1,2), $y' = 0$. Only B fulfills this condition.

12. Which slope field (A or B) corresponds to
    $y' = \ 1\  - \frac{x}{y}$?

+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| A.  ![](media/Further Applications of Calculus 4_Differential equations/media/image70.png){width="1.5748031496062993in" | B.  ![](media/Further Applications of Calculus 4_Differential equations/media/image71.png){width="1.5748031496062993in" |
|     height="1.5748031496062993in"}                                                                                      |     height="1.5748031496062993in"}                                                                                      |
+=========================================================================================================================+=========================================================================================================================+
| C.  ![](media/Further Applications of Calculus 4_Differential equations/media/image72.png){width="1.5743055555555556in" | D.  ![](media/Further Applications of Calculus 4_Differential equations/media/image73.png){width="1.5748031496062993in" |
|     height="1.5743055555555556in"}                                                                                      |     height="1.5748031496062993in"}                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+

At (1, 1): $y'\  = \ 0$. This eliminates A and C

On $x = 0$, $y' = 1$

Answer: B.

13. Determine the DE corresponding to the slope field.

![](media/Further Applications of Calculus 4_Differential equations/media/image74.png){width="2.00625in"
height="1.9680555555555554in"}

**A** $y' = \frac{2xy}{1\  + \ y^{2}}$\
**B** $y' = \frac{2xy}{1\  + \ x^{2}}$\
**C** $y' = \  - \frac{2xy}{1\  + \ y^{2}}$\
**D** $y' = \  - \frac{2xy}{1\  + \ x^{2}}$

At (1,1), negative gradient. This eliminates A and B

At $( - 4,1)$, option C would give 4. Option D would give $\frac{8}{17}$

By inspection, the gradient at $( - 4,1)$ is less than 45° so option D
is the correct answer.

Mastery

14. 

+---------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  Consider the slope field for $y' = \  - \frac{y}{x}.$                                                                                         | b.  Consider the slope field for $y' = \frac{x}{y}.$\                                                                                             |
|                                                                                                                                                   |     Add solution curves through (2, 0) and (−2, 0).                                                                                               |
| Add solution curves through (2, 2) and (−2, −2).                                                                                                  |                                                                                                                                                   |
|                                                                                                                                                   | ![](media/Further Applications of Calculus 4_Differential equations/media/image77.png){width="2.0630686789151356in"                               |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image75.png){width="1.9715277777777778in"                               | height="1.9166666666666667in"}![](media/Further Applications of Calculus 4_Differential equations/media/image78.png){width="2.0256944444444445in" |
| height="1.9680555555555554in"}![](media/Further Applications of Calculus 4_Differential equations/media/image76.png){width="2.0256944444444445in" | height="1.9659722222222222in"}                                                                                                                    |
| height="1.9680555555555554in"}                                                                                                                    |                                                                                                                                                   |
+===================================================================================================================================================+===================================================================================================================================================+

c.  i.  Show that the hyperbola $xy\  = \ 4$ is the solution of the IVP
        in part **a**.

$$\frac{dy}{y} = \  - \frac{dx}{x}\ $$

$$\ln|y| = \  - \ln|x| + \ C$$

$$\ln|xy| = \ C$$

$$xy = k$$

at $(2,2),$ $(2)(2) = k;\ k = 4$

$$\therefore xy = 4$$

ii. Show that $x²\  - \ y²\  = \ 4$ is the solution of the IVP in part
    **b**.

$$y\ dy = x\ dx$$

$$y^{2} = x^{2} + C$$

$$x^{2} - y^{2} = C$$

Sub in (2,0): $4 = C$

$$\therefore x^{2} - y^{2} = 4$$

d.  ![](media/Further Applications of Calculus 4_Differential equations/media/image79.png){width="2.026453412073491in"
    height="1.968503937007874in"}Both parabolas are graphed below. The
    tangents to each hyperbola at the points of intersection are
    perpendicular. Why?

The gradient of $xy\  = \ 4$ at a point is $y'\  = \  - \frac{y}{x}$.

The gradient of $x²\  - \ y²\  = \ 4$ at the same point is
$y' = \frac{x}{y}$.

Product =
$\left( - \frac{y}{x} \right)\left( \frac{x}{y} \right) = \  - 1$.

Therefore, the curves are perpendicular at every intersection.

15. 

+--------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| a.  Consider the slope field for $y' = \frac{2y}{x}.$\                                                                                           | b.  Consider the slope field for $y'\  = \  - \frac{x}{2y}$.                                                        |
|     Add the solution curve through (2, 2).                                                                                                       |                                                                                                                     |
|                                                                                                                                                  | ![](media/Further Applications of Calculus 4_Differential equations/media/image82.png){width="2.0256944444444445in" |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image80.png){width="2.067707786526684in"                               | height="2.0625in"}Add the solution curve through (2, 0)                                                             |
| height="1.9978029308836396in"}![](media/Further Applications of Calculus 4_Differential equations/media/image81.png){width="2.025738188976378in" |                                                                                                                     |
| height="1.968503937007874in"}                                                                                                                    | ![](media/Further Applications of Calculus 4_Differential equations/media/image83.png){width="2.0256944444444445in" |
|                                                                                                                                                  | height="1.9402777777777778in"}                                                                                      |
+==================================================================================================================================================+=====================================================================================================================+

c.  i.  Show that the parabola $y\  = \frac{1}{2}x^{2}$ is the solution
        of the IVP in part **a**.

$$\frac{dy}{2y} = \frac{dx}{x}$$

$$\frac{1}{2}\ln|y| = \ln|x| + C$$

$$\frac{1}{2}\left( \ln|y| - 2\ln|x| \right) = C$$

$$\ln|y| - \ln\left| x^{2} \right| = C_{2}$$

$$\ln\left| \frac{y}{x^{2}} \right| = C_{2}$$

$$\frac{y}{x^{2}} = A$$

$$y = Ax^{2}$$

$$Sub\ (2,2):\ 2 = A(4),\ \therefore A = \frac{1}{2}$$

$$\therefore y = \frac{1}{2}x^{2}$$

ii. Show that the ellipse $x²\  + \ 2y²\  = \ 4$ is the solution of the
    IVP in part **b**.

$$2y\ dy = - x\ dx$$

$$y^{2} = - \frac{x^{2}}{2} + C$$

$$2y^{2} + x^{2} = C_{2}$$

Sub (2,0)

$$0 + 4 = C_{2}$$

$$\therefore C_{2} = 4$$

$$\therefore x^{2} + 2y^{2} = 4$$

d.  ![](media/Further Applications of Calculus 4_Differential equations/media/image84.png){width="1.9836986001749781in"
    height="1.925in"}Both curves are drawn below. The tangents to the
    parabola and ellipse are perpendicular where they intersect. Why?

$$\frac{2y}{x} \times - \frac{x}{2y} = - 1$$

# Solving dy/dx = g(y)

+-------------------------------------------------------------------+
| - **Definition \| Formula \| Procedure**                          |
+===================================================================+
| Given $\frac{dy}{dx}$ $= g(y)$, take the reciprocal and integrate |
| with respect to $y$                                               |
|                                                                   |
| $${\frac{dy}{dx} = g(y)                                           |
| }{\frac{dx}{dy} = \frac{1}{g(y)}                                  |
| }{\int_{}^{}\frac{dx}{dy}dy = \int_{}^{}\frac{dy}{g(y)}}$$        |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------+
| - **Example** Solve differential equations of the form $\frac{dy}{dx} = g(y)$                 |
+============================================+==================================================+
| Solve $y' = 3y$:                                                                              |
+--------------------------------------------+--------------------------------------------------+
| Solving for $x$:                           | Rearranging in terms of $y$:                     |
|                                            |                                                  |
| $$\frac{dy}{dx} = 3y$$                     | $${x = \frac{1}{3}\ln|y| + C                     |
|                                            | }{x - C = \frac{1}{3}\ln|y|                      |
| $$\frac{dx}{dy} = \frac{1}{3y}$$           | }{3x - 3C = \ln|y|                               |
|                                            | }{|y| = e^{3x - 3C}                              |
| $$\ \ \ x = \int_{}^{}\frac{1}{3y}dy$$     | }{y = \pm e^{- 3C}e^{3x}                         |
|                                            | }{= Ae^{3x}\ \ where\ A\ is\ some\ constant\ }$$ |
| $$\ \ \ \ \ \ \  = \frac{1}{3}\ln|y| + C$$ |                                                  |
+--------------------------------------------+--------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| a.  Solve $y' = 5y^{2}$           | b.  Solve $y' = - 3y$ given       |
|                                   |     $y(2) = 50$                   |
| $$y = - \frac{1}{5x + C}$$        |                                   |
|                                   | $$y = 50e^{- 3(x - 2)}$$          |
+-----------------------------------+-----------------------------------+

Foundation

1.  Solve each first-order differential equation $(y\  \neq \ 0).$

+-------------------------------------------------------------------+-----------------------------------------------------------------+-------------------------------------------------+
| a.  $\frac{dy}{dx} = \frac{2}{y^{2}}$                             | b.  $\frac{dy}{dx} = \ \sqrt{y}$                                | c.  $\frac{dy}{dx} = \frac{1}{e^{y}}$           |
|                                                                   |                                                                 |                                                 |
| $$\frac{dx}{dy} = \frac{y^{2}}{2}$$                               | $$\frac{dx}{dy} = \frac{1}{\sqrt{y}} = \ y^{- \frac{1}{2}}$$    | $$\frac{dx}{dy} = \ e^{y}$$                     |
|                                                                   |                                                                 |                                                 |
| $$x\  = \ \int_{}^{}\frac{y^{2}}{2}dy\  = \frac{y^{3}}{6} + \ C$$ | $$x\  = \ \int_{}^{}{y^{- \frac{1}{2}}dy} = \ 2\sqrt{y} + \ C$$ | $$x\  = \ \int_{}^{}{e^{y}dy} = \ e^{y} + \ C$$ |
|                                                                   |                                                                 |                                                 |
| $$y³\  = \ 6x\  + \ C$$                                           | $$\sqrt{y} = \frac{x\  - \ C}{2}$$                              | $$y\  = \ \ln(x\  - \ C)$$                      |
|                                                                   |                                                                 |                                                 |
|                                                                   | $$y\  = \ \left( \frac{x\  - \ C}{2} \right)^{2}$$              |                                                 |
+===================================================================+=================================================================+=================================================+
| d.  $\frac{dy}{dx} = \ y^{- 4}$                                   | e.  $f'(x) = \ y^{2}$                                           |                                                 |
|                                                                   |                                                                 |                                                 |
| $$\frac{dx}{dy} = \ y^{4}$$                                       | $$\frac{dx}{dy} = \frac{1}{y^{2}}$$                             |                                                 |
|                                                                   |                                                                 |                                                 |
| $$x\  = \ \int_{}^{}{y^{4}dy} = \frac{y^{5}}{5} + \ C$$           | $$x\  = \ \int_{}^{}{y^{- 2}dy} = \  - \frac{1}{y} + \ C$$      |                                                 |
|                                                                   |                                                                 |                                                 |
| $$y^{5} = \ 5x\  + \ C$$                                          | $$y\  = \  - \frac{1}{x\  - \ C} = \frac{1}{C\  - \ x}$$        |                                                 |
+-------------------------------------------------------------------+-----------------------------------------------------------------+-------------------------------------------------+

2.  Solve each differential equation.

+--------------------------------------------------------------------------------+---------------------------------------------------------------------------------------+
| a.  $\frac{dy}{dx} = \ \sqrt{1\  - \ y^{2}}$                                   | b.  $f'(x)\  = \ x²\  + \ 9$                                                          |
|                                                                                |                                                                                       |
| $$\frac{dx}{dy} = \frac{1}{\sqrt{1\  - \ y^{2}}}$$                             | $$y\  = \ \int_{}^{}{\left( x^{2} + \ 9 \right)dx} = \frac{x^{3}}{3} + \ 9x\  + \ C$$ |
|                                                                                |                                                                                       |
| $$x\  = \ \int_{}^{}\frac{1}{\sqrt{1\  - \ y^{2}}}dy\  = \sin^{- 1}y + \ C\ $$ |                                                                                       |
|                                                                                |                                                                                       |
| $$y\  = \ \sin(x\  - \ C)$$                                                    |                                                                                       |
+================================================================================+=======================================================================================+

3.  Find the solutions of these IVPs.

+--------------------------------------------+------------------------------------------+
| a.  $y'\  - \ y\  = \ 0,\ y(0)\  = \  - 3$ | b.  $y'\  + \ 2y\  = \ 0,\ y(0)\  = \ 1$ |
|                                            |                                          |
| $$y\  = \  - 3e^{x}$$                      | $$y\  = \ e^{- 2x}$$                     |
+============================================+==========================================+
| c.  $y'\  = \  - 3y,\ y(0)\  = \ 2$        | a.  $y'\  = \ 2y,\ y(0)\  = \  - 1$      |
|                                            |                                          |
| $$y\  = \ 2e^{- 3x}$$                      | $$y\  = \  - e^{2x}$$                    |
+--------------------------------------------+------------------------------------------+

Development

4.  Solve these IVPs.

+----------------------------------------------------+------------------------------------------------+
| a.  $y' = \ 1\  - \ y,\ \ y(0)\  = \ 3$            | b.  $y'\  = \ y\  - \ 1,\ \ \ y(0)\  = \ 0$    |
|                                                    |                                                |
| $$y\  = \ 1\  + \ 2e^{- x}$$                       | $$y\  = \ 1\  - \ e^{x}$$                      |
+====================================================+================================================+
| c.  $y' = \frac{1}{2}(y\  + \ 1),\ \ \ y(0) = \ 1$ | d.  $y'\  = \ 2(3\  - \ y),\ \ \ y(0)\  = \ 4$ |
|                                                    |                                                |
| $$y\  = \  - 1\  + \ 2e^{\frac{x}{2}}$$            | $$y\  = \ 3\  + \ e^{- 2x}$$                   |
+----------------------------------------------------+------------------------------------------------+

5.  Solve these initial value problems.

+----------------------------------------------------------------------+----------------------------------------------------+
| a.  $y'\  = \ 2y²,\ \ \ y(0)\  = \ 3$                                | b.  $y' = \  - y^{2},\ \ y(0)\  = \ 1$             |
|                                                                      |                                                    |
| $$y\  = \frac{3}{1\  - \ 6x}$$                                       | $$y\  = \frac{1}{1\  + \ x}$$                      |
+======================================================================+====================================================+
| c.  $y' = \ 1\  + \ y^{2},\ \ \ y\left( \frac{\pi}{4} \right) = \ 1$ | d.  $y'\  = \  - e^{y},\ \ \ y(0)\  = \ 0$         |
|                                                                      |                                                    |
| $$y\  = \ \tan\ x$$                                                  | $$y\  = \  - log(1\  + \ x)$$                      |
+----------------------------------------------------------------------+----------------------------------------------------+
| e.  $y' = \ e^{- y},\ \ \ y(3) = \ 0$                                | f.  $y' = \ y^{\frac{2}{3}},\ \ \ y(0) = \ 1$      |
|                                                                      |                                                    |
| $$y\  = \ log(x\  - \ 2)$$                                           | $$y\  = \ \left( \frac{x\  + \ 3}{3} \right)^{3}$$ |
+----------------------------------------------------------------------+----------------------------------------------------+

mastery

6.  Find $y\  = \ f(x)$ given $\frac{dy}{dx} = \frac{1}{2y\  + \ 6}$,
    the function passes through $(1,\ 0)$ and the function is:

    a.  increasing

    b.  decreasing

$$\frac{dx}{dy} = \ 2y\  + \ 6$$

$$x\  = \ \int_{}^{}{(2y\  + \ 6)dy} = \ y^{2} + \ 6y\  + \ C$$

$$Sub\ (1,\ 0):\ 1\  = \ 0\  + \ 0\  + \ C,\ so\ C\  = \ 1$$

$$x\  = \ y^{2} + \ 6y\  + \ 1$$

$$Solve\ for\ y:\ y^{2} + \ 6y\  + \ (1\  - \ x) = \ 0$$

$$y\  = \frac{- 6\  \pm \ \sqrt{36\  - \ 4(1\  - \ x)}}{2} = \  - 3\  \pm \ \sqrt{8\  + \ x}$$

Increasing: $\frac{dy}{dx} > \ 0$ requires $2y\  + \ 6\  > \ 0$, i.e.
$y\  > \  - 3,$ so take the + branch.

$$y\  = \  - 3\  + \ \sqrt{8\  + \ x}$$

Decreasing: $\frac{dy}{dx} < \ 0$ requires $y\  < \  - 3$, so take the
$- \$branch.

$$y\  = \  - 3\  - \ \sqrt{8\  + \ x}$$

7.  Solve
    $\frac{dy}{dx} = \frac{1}{y^{2}\left( y^{3} - \ 1 \right)^{4}}$
    using the substitution $u\  = \ y³\  - \ 1$.

$$u\  = \ y^{3} - \ 1,\ \frac{du}{dy} = \ 3y^{2}$$

$$\ y^{2}dy\  = \frac{du}{3}$$

$$Take\ reciprocal:\frac{dx}{dy} = \ y^{2}\left( y^{3} - \ 1 \right)^{4}$$

$$x\  = \ \int_{}^{}{y^{2}\left( y^{3} - \ 1 \right)^{4}dy}$$

$$Sub\ u\  = \ y^{3} - \ 1:$$

$$x\  = \ \int_{}^{}u^{4} \cdot \frac{du}{3} = \frac{u^{5}}{15} + \ C\  = \frac{\left( y^{3} - \ 1 \right)^{5}}{15} + \ C$$

# Solving dy/dx = f(x)g(y)

+-------------------------------------------------------------------+
| - **Separation of Variables**                                     |
+===================================================================+
| To solve $\frac{dy}{dx}$ $= f(x)g(y)$, we need all the $x$ on one |
| side and all the $y$ on the other side.                           |
|                                                                   |
| $$\frac{1}{g(y)}dy = f(x)dx$$                                     |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------+
| - **Identify** separable DEs                                                                                                              |
+===========================+========================+==========================================+=====================+=====================+
| A differential equation is separable if $\frac{dy}{dx}$ can be written as a product $f(x) \cdot g(y)$ with one factor depending only on   |
| $x$, and one only on $y$.                                                                                                                 |
+---------------------------+------------------------+------------------------------------------+---------------------+---------------------+
| ✖                         | ✔                      | ✔                                        | ✔                   | ✖                   |
|                           |                        |                                          |                     |                     |
| $$\frac{dy}{dx} = x + y$$ | $$\frac{dy}{dx} = xy$$ | $$\frac{dy}{dx} = \frac{\sin x}{y^{3}}$$ | $$y' = x^{2}e^{y}$$ | $$y' = x^{2} - 2y$$ |
+---------------------------+------------------------+------------------------------------------+---------------------+---------------------+
| - You will only need to solve separable DEs in this course.                                                                               |
+-------------------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------+
| - **Separate** variables                                                         |
+==============================================+===================================+
| Rearrange these DEs so that all the $y$ terms are on one side and all the $x$    |
| terms on the other.                                                              |
+----------------------------------------------+-----------------------------------+
| a.  $\frac{dy}{dx}$ $= xy$                   | b.  $\frac{dy}{dx}$ $= 2xe^{y}$   |
|                                              |                                   |
| $$\ \ \ \ \  \times dx\ \ \ \ \  \times dx$$ |                                   |
|                                              |                                   |
| $$\ \ \ \ \ \ \ \ \ \ dy = xy\ dx$$          |                                   |
|                                              |                                   |
| $\div y\ \ \ \  \div y$                      |                                   |
|                                              |                                   |
| $$\ \ \ \ \ \ \ \ \ \ \frac{dy}{y} = x\ dx$$ |                                   |
+----------------------------------------------+-----------------------------------+
| c.  $y' = \cos x(1 + y)$                     | d.  $xy' - 2y = 0$                |
+----------------------------------------------+-----------------------------------+
| e.  $\sin v\frac{dw}{dv} - \cos v = 0$       | f.  $\theta z' = z + 1$           |
+----------------------------------------------+-----------------------------------+
| - **Solving DEs by Separating Variables**                                        |
+----------------------------------------------------------------------------------+
| To solve $\frac{dy}{dx}$ $= f(x)g(y)$, we need all the $x$ on one side and all   |
| the $y$ on the other side.                                                       |
|                                                                                  |
| $$\frac{1}{g(y)}dy = f(x)dx$$                                                    |
|                                                                                  |
| Then integrate both sides.                                                       |
+----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------+
| - **Example** Solve differential equations of the form $\frac{dy}{dx} = f(x)g(x)$                                           |
+=============================================================================================================================+
| Solve $y' = \frac{2x}{y^{2}}$                                                                                               |
|                                                                                                                             |
| $${\frac{dy}{dx} = \frac{2x}{y^{2}}                                                                                         |
| }{y^{2}\ dy = 2x\ dx                                                                                                        |
| }{\int_{}^{}{y^{2}\ dy} = \int_{}^{}{2x\ dx}                                                                                |
| }{\frac{y^{3}}{3} = x^{2} + C\ \  \leftarrow only\ one\ constant\ because\ we\ can\ combine\ them\ anyway                   |
| }{y = \sqrt[3]{3x^{2} + C_{2}}\ \  \leftarrow when\ you\ operate\ on\ the\ arbitrary\ constant,\ you\ should\ rename\ it}$$ |
+-----------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------+
| - **Guided Practice**                                                     |
+=======================================+===================================+
| a.  Solve $y' = - 2xe^{y}$            | b.  Solve $y' = \frac{x}{y}$ and  |
|                                       |     find the solution passing     |
| $$y = - \ln\left| x^{2} + C \right|$$ |     through $(4,5)$.\             |
|                                       |     (do not solve for $y$)        |
|                                       |                                   |
|                                       | $$y^{2} - x^{2} = 9$$             |
+---------------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Loss of Constant Solutions**                                  |
+===================================================================+
| When we divide by $g(y)$ to separate variables, we assume         |
| $g(y)\  \neq \ 0$.\                                               |
| Any value of $y$ where $g(y) = 0$ gives$\ y' = 0,$ so             |
| $y = constant$.\                                                  |
| This constant solution is lost during separation and must be      |
| checked separately.\                                              |
| Usually these can be identified by inspection, but we can also    |
| find them by setting $g(y) = 0$                                   |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------+
| - **Identify** constant solutions                                                                                           |
+=========================================+=========================================+=========================================+
| $$y' = xy$$                             | $$y' = x(y - 5)$$                       | $$y' = x(1 + y)$$                       |
|                                         |                                         |                                         |
| $$y = 0$$                               | $$y = 5$$                               | $$y = - 1$$                             |
+-----------------------------------------+-----------------------------------------+-----------------------------------------+
| Identify the constant solution(s) for these differential equations:                                                         |
+-----------------------------------------+-----------------------------------------+-----------------------------------------+
| b.  $y' = x^{2}(y + 5)$                 | c.  $y' =$ $\frac{y}{x}$                | d.  $y' = x^{3}(y - 1)(y + 2)$          |
+-----------------------------------------+-----------------------------------------+-----------------------------------------+
| e.  $y' = - xy^{2}$                     | f.  $y' = y(1 - y)$                     | g.  $y' = x\sin y$                      |
|                                         |                                         |                                         |
|                                         |                                         | Hint: set $\sin y = 0$                  |
+-----------------------------------------+-----------------------------------------+-----------------------------------------+
| Find the general solution of $y' = - xy^{2}$ and the particular solution passing through $(2,0)$.                           |
|                                                                                                                             |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image85.png){width="1.9941426071741033in"         |
| height="1.968503937007874in"}                                                                                               |
|                                                                                                                             |
| $$y = \frac{2}{x^{2} + C}$$                                                                                                 |
|                                                                                                                             |
| $$y = 0$$                                                                                                                   |
|                                                                                                                             |
| - The HSC has thus far never asked students to find the constant solution; the one time a suitable DE was given the         |
|   question said $y \neq 0$.                                                                                                 |
+-----------------------------------------------------------------------------------------------------------------------------+

Foundation

8.  Consider the differential equation $\frac{dy}{dx} = \  - y$.

    a.  What is the constant solution?

    b.  Use separation of variables to solve the DE.

    c.  Make $y$ the subject, simplifying the constant.

    d.  Check that the constant solution is included in part **c**.

    e.  Find the solution for $y(0)\  = \ 2$.

$$a)\ Constant\ solution:\ y\  = \ 0$$

$$b)\ Separating\ variables:$$

$$\left( \frac{1}{y} \right)dy\  = \  - dx$$

$$\int_{}^{}\left( \frac{1}{y} \right)dy\  = \ \int_{}^{}{- 1}dx$$

$$\ln|y| = \  - x\  + \ C$$

$$c)\ |y| = \ e^{- x + C} = \ e^{C} \cdot \ e^{- x}$$

$$y\  = \ Ae^{- x},\ where\ A\ is\ any\ real\ number$$

$$d)\ A\  = \ 0\ gives\ y\  = \ 0$$

$$e)\ Sub\ y(0)\  = \ 2:\ 2\  = \ Ae⁰,\ so\ A\  = \ 2$$

$$y\  = \ 2e^{- x}$$

9.  Consider the differential equation $\frac{dy}{dx} = \ 3y.$

    a.  What is the constant solution?

    b.  Write down the DE obtained by taking the reciprocal of both
        sides.

    c.  Use direct integration to obtain $x$ as a function of $y$.

    d.  Make $y$ the subject, simplifying the constant.

    e.  Check that the constant solution is included in part $d$.

    f.  Find the solution for $y(0)\  = \  - 1$.

$$a)\ Constant\ solution:\ y\  = \ 0$$

$$b)\frac{dx}{dy} = \frac{1}{3y}$$

$$c)\ x\  = \ \int_{}^{}\frac{1}{3y}dy\  = \ \left( \frac{1}{3} \right)\ln|y| + \ C$$

$$d)\ x\  - \ C\  = \frac{1}{3}\ln|y|$$

$$ln|y|\  = \ 3x\  - \ 3C$$

$$y\  = \ Ae^{3x},\ where\ A\ is\ any\ real\ number$$

$$e)\ A\  = \ 0\ gives\ y\  = \ 0$$

$$f)\ Sub\ y(0)\  = \  - 1:\  - 1\  = \ Ae⁰,\ so\ A\  = \  - 1$$

$$y\  = \  - e^{3x}$$

10. Consider the differential equation $\frac{dy}{dx} = \ 2\  - \ y.$

    a.  What is the constant solution?

    b.  Use separation of variables or reciprocals to solve the DE.

    c.  Make $y$ the subject, simplifying the constant.

    d.  Check that the constant solution is included in part **c**.

    e.  Find the solution for $y(0)\  = \ 3.$

$$a)\ Set\ 2\  - \ y\  = \ 0:\ constant\ solution\ y\  = \ 2$$

$$b)\ Separate\ variables:$$

$$\left( \frac{1}{2\  - \ y} \right)dy\  = \ dx$$

$$\int_{}^{}\frac{1}{2\  - \ y}dy\  = \ \int_{}^{}1dx$$

$$- \ln|2\  - \ y| = \ x\  + \ C$$

$$\ln|2\  - \ y| = \  - x\  + \ C$$

$$c)\ |2\  - \ y|\  = \ e^{- x + C}$$

$$2\  - \ y\  = \ Ae^{- x}$$

$$y\  = \ 2\  + \ Ae^{- x},\ where\ A\ is\ any\ real\ number$$

$$d)\ A\  = \ 0\ gives\ y\  = \ 2\ $$

$$e)\ Sub\ y(0)\  = \ 3:\ 3\  = \ 2\  + \ A,\ so\ A\  = \ 1$$

$$y\  = \ 2\  + \ e^{- x}$$

11. Consider the DE $\frac{dy}{dx} = \frac{x\  - \ 1}{y\  + \ 1}.$

    a.  Multiply through by $y\  + \ 1$ and then by $dx$, so that the
        variables are separated.

$$(y\  + \ 1)\ dy\  = \ (x\  - \ 1)\ dx$$

b.  Use the result
    $\int(x\  + \ a)ⁿ\ dx\  = \frac{1}{n + 1}(x\  + \ a)^{n + 1} + \ C$
    to find the general solution.\
    Write your answer without using fractions.

$$\int_{}^{}{(y\  + \ 1)dy} = \ \int_{}^{}{(x\  - \ 1)dx}$$

$$\frac{(y\  + \ 1)^{2}}{2} = \frac{(x\  - \ 1)^{2}}{2} + \frac{C}{2}$$

$$(y\  + \ 1)^{2} = \ (x\  - \ 1)^{2} + \ D$$

Development

12. Find the general solutions of these separable equations. Make $y$
    the subject in each case.

+------------------------------------------------------+------------------------------------------------------------+
| a.  $\frac{dy}{dx} = \ xe^{- y}$                     | b.  $\frac{dy}{dx} = \ 4x^{3}\left( 1\  + \ y^{2} \right)$ |
|                                                      |                                                            |
| $$y\  = \ \log\left( \frac{x^{2}}{2} + \ C \right)$$ | $$y\  = \ \tan\left( x^{4} + \ C \right)$$                 |
+======================================================+============================================================+

13. For each DE, find the solution curve passing through the given
    point.

+-------------------------------------+----------------------------------------------------------------------+
| a.  $\frac{dy}{dx} = \frac{x}{y}$,  | b.  $\frac{dy}{dx} = \ (1\  + \ x)\left( 1\  + \ y^{2} \right),$     |
|     through (0, 1)                  |     with $y( - 1)\  = \ 0$                                           |
|                                     |                                                                      |
| $$y²\  = \ x²\  + \ 1$$             | $$y\  = \ \tan\left( \frac{x^{2}}{2} + \ x\  + \frac{1}{2} \right)$$ |
+=====================================+======================================================================+
| c.  $\frac{dy}{dx} = \  - 2y^{2}x,$ | d.  $\frac{dy}{dx} = \ e^{- y}\sec^{2}x$, through                    |
|     with $y(1) = \frac{1}{2}$       |     $\left( \frac{\pi}{4},\ \log\ 2 \right)$                         |
|                                     |                                                                      |
| $$y\  = \frac{1}{x^{2} + \ 1}$$     | $$y\  = \ log(tan\ x\  + \ 1)$$                                      |
+-------------------------------------+----------------------------------------------------------------------+

14. Suppose that the solution curve for
    $\frac{dy}{dx} = \  - \frac{x}{y}$ passes through
    $\left( 1,\ \sqrt{3} \right).$

    a.  Separate the variables and hence write down the corresponding
        equation of integrals.

$$\int_{}^{}ydy\  = \ \int_{}^{}{- x}dx$$

b.  The general solution of this DE is a relation, not a function. Find
    the general solution, writing your answer without fractions.

$$\frac{y^{2}}{2} = \  - \frac{x^{2}}{2} + \frac{C}{2}$$

$$x²\  + \ y²\  = \ D$$

c.  Hence determine the equation of the solution curve through the given
    point.

$$Sub\ \left( 1,\ \sqrt{3} \right):\ 1\  + \ 3\  = \ D,\ so\ D\  = \ 4.\ $$

$$x²\  + \ y²\  = \ 4$$

15. Solve these IVPs.

+------------------------------------------------------+-------------------------------------------------------------+
| a.  $\frac{dy}{dx} = \frac{y}{x}$ with $y(2) = \ 1$  | b.  $\frac{dy}{dx} = \frac{y}{2x}$ with $y(1) = \ 2$        |
|                                                      |                                                             |
| $$y\  = \frac{x}{2}$$                                | $$y\  = \ 2\sqrt{x}$$                                       |
+======================================================+=============================================================+
| c.  $\frac{dy}{dx} = \  - \frac{2xy}{1\  + \ x^{2}}$ | d.  $\frac{dy}{dx} = \  - \frac{y}{x}$ with $y(2) = \ 1$    |
|     with $y(1) = \ 2$                                |                                                             |
|                                                      | $$y\  = \frac{2}{x}$$                                       |
| $$y\  = \frac{4}{1\  + \ x^{2}}$$                    |                                                             |
+------------------------------------------------------+-------------------------------------------------------------+
| e.  $\frac{dy}{dx} = \ y\ \cos\ x$ with              | f.  $\frac{dy}{dx} = \frac{y(2\  - \ x)}{x^{2}}$ with       |
|     $y\left( \frac{\pi}{2} \right) = \ 1$            |     $y(2) = \frac{1}{2}$                                    |
|                                                      |                                                             |
| $$y\  = \ e^{sin\ x\  - \ 1}$$                       | $$y\  = \ \left( \frac{1}{x} \right)e^{1\  - \frac{2}{x}}$$ |
+------------------------------------------------------+-------------------------------------------------------------+

16. Use separation of variables to solve these DEs.

+-------------------------------------------+------------------------------------------------+----------------------------------------------+
| a.  $\frac{dy}{dx} = \frac{2\  - \ y}{x}$ | b.  $\frac{dy}{dx} = \frac{xy}{1\  + \ x^{2}}$ | c.  $\frac{dy}{dx} = \  - \frac{2y}{x}$      |
|                                           |                                                |                                              |
| $$y\  = \frac{C}{x} + \ 2$$               | $$y²\  = \ C(1\  + \ x²)$$                     | $$y\  = \frac{C}{x^{2}}$$                    |
+===========================================+================================================+==============================================+
| d.  $\frac{dy}{dx} = \ y\ \sin\ x$        | e.  $\frac{dy}{dx} = \frac{3y}{x^{2}}$         | f.  $\frac{dy}{dx} = \frac{y(1\  - \ x)}{x}$ |
|                                           |                                                |                                              |
| $$y\  = \ {Ce}^{- \cos\ x}$$              | $$y\  = \ {Ce}^{- \frac{3}{x}}$$               | $$y\  = \ {Cxe}^{- x}$$                      |
+-------------------------------------------+------------------------------------------------+----------------------------------------------+

17. a.  Explain why $y\  = \ 0$, where $x\  \neq \ 0$, is a solution of
        $\frac{dy}{dx} = \  - \frac{y^{2}}{x}$.\
        (Always look first for constant solutions.)

If $y\  = \ 0:\frac{dy}{dx} = \ 0$.

Substituting into RHS: $- \frac{0^{2}}{x} = \ 0\  = \ LHS$. ∴
$y\  = \ 0$ is a solution.

b.  Use the method of separable DEs to find the other solutions.

$$\frac{1}{y^{2}}dy\  = \  - \frac{1}{x}dx$$

$$\int_{}^{}{\frac{1}{y^{2}}dy} = \  - \int_{}^{}{\frac{1}{x}dx}$$

$$- \frac{1}{y} = \  - \log|x| + \ C$$

$$\frac{1}{y} = \ \log|x| - \ C$$

$$y\  = \frac{1}{\log|x| + \ C}\ \ \ $$

(absorbing the negative into C)

18. Consider the DE $\frac{dy}{dx} = \frac{2y\  + \ 4}{x}.$

    a.  Find the constant solution, substituting to show that it is a
        solution of the DE.

$$Let\ \frac{dy}{dx} = \ 0,\ so\ 2y\  + \ 4\  = \ 0,\ giving\ y\  = \  - 2.$$

$$Sub\ y\  = \  - 2\ into\ RHS:\frac{2( - 2) + \ 4}{x} = \ 0\  = \frac{dy}{dx}$$

b.  Use separation of variables to find the other solutions of the DE.

$$\frac{1}{2y\  + \ 4}dy\  = \ \left( \frac{1}{x} \right)dx$$

$$\int_{}^{}\frac{1}{2y\  + \ 4}dy\  = \ \int_{}^{}{\left( \frac{1}{x} \right)dx}$$

$$\frac{1}{2}\log|2y\  + \ 4| = \ log|x| + \ C$$

$$\log|2y\  + \ 4| = \ 2log|x| + \ D$$

$$\log|2y + 4| = \log\left| x^{2} \right| + D$$

$$|2y + 4| = e^{\log\left| x^{2} \right| + D}$$

$$|2y + 4| = e^{D}e^{\log\left| x^{2} \right|}$$

$$2y + 4 = \pm e^{D}x^{2}$$

$$y\  = \ Ax²\  - \ 2\ \ \ \left( A\  \neq \ 0\ as\ A = \pm e^{D} \right)$$

c.  How can the solutions in parts **a** and **b** be combined?

Allow $A\  = \ 0$: This is the constant solution $y = - 2$, so the full
solution is $y = Ax² - 2$ for all $A$.

19. Consider the DE$\ y'\  = \  - xy.$

    a.  Find the constant solution, substituting to show it is a
        solution of the DE.

$$Let\ y' = \ 0,\ so\  - xy\  = \ 0,\ giving\ y\  = \ 0.$$

$$Sub\ y\  = \ 0\ into\ RHS:\  - x(0) = \ 0\  = \frac{dy}{dx}$$

b.  Use separation of variables to find the other solutions of the DE.

$$\frac{1}{y}dy\  = \  - x\ dx$$

$$\int_{}^{}\frac{1}{y}dy\  = \ \int_{}^{}{- x}dx$$

$$\log|y| = \  - \frac{x^{2}}{2} + \ C$$

$$|y|\  = \ e^{- \frac{x^{2}}{2} + \ C}$$

$$y\  = \  \pm e^{C} \cdot \ e^{- \frac{x^{2}}{2}}$$

$$y\  = \ Ae^{- \frac{x^{2}}{2}}\ \ \left( A\  \neq \ 0\ as\ A\  = \  \pm e^{C} \right)$$

c.  How can the solutions in parts **a** and **b** be combined?

Allow $A\  = \ 0$: this gives the constant solution $y\  = \ 0$,\
so the full solution is $y\  = \ Ae^{- \frac{x^{2}}{2}}\$for all $A$.

20. a.  Find all the constant solutions of
        $\frac{dy}{dx} = \ 3x^{2}\cos^{2}y$ in the interval
        $- 2\pi\  \leq \ y\  \leq \ 2\pi$.

$cos²y\  = \ 0$ when $cos\ y\  = \ 0:$

$$y\  = \  - \frac{3\pi}{2},\  - \frac{\pi}{2},\frac{\pi}{2},\frac{3\pi}{2}$$

b.  Find all the non-constant solutions.

$$\frac{1}{\cos^{2}y}dy\  = \ 3x^{2}dx$$

$$\sec^{2}y\ dy\  = \ 3x^{2}dx$$

$$\int_{}^{}{\sec^{2}y}dy\  = \ \int_{}^{}{3x^{2}dx}$$

$$tan\ y\  = \ x^{3} + \ C$$

$$y\  = \ \tan^{- 1}\left( x^{3} + \ C \right)$$

21. Consider the IVP $\frac{dy}{dx} = \frac{2y}{x\  - \ 1}$ with
    $y(2)\  = \ 1$.

    a.  Show that the constant solution of the DE is not a solution of
        the IVP.

set $\frac{dy}{dx} = \ 0$, so $y\  = \ 0$.

$y(2)\  = \ 1\  \neq \ 0$. Not a solution of the IVP.

b.  Use separation of variables to find the general solution of the DE.

$$\frac{1}{y}dy\  = \frac{2}{x\  - \ 1}dx$$

$$\log|y| = \ 2log|x\  - \ 1| + \ C$$

$$y\  = \ C(x\  - \ 1)^{2}$$

c.  Hence solve the IVP.

Sub $x\  = \ 2,\ y\  = \ 1:\ 1\  = \ C(1)²,\ so\ C\  = \ 1.$

$$y\  = \ (x\  - \ 1)²$$

22. Consider the IVP $\frac{dy}{dx} = \ (y\  - \ 1)\tan\ x$ with
    $y\left( \frac{\pi}{4} \right) = \ 3$.

    a.  Show that the constant solution of the DE is not a solution of
        the IVP.

$$set\frac{dy}{dx}\  = \ 0,\ so\ y\  - \ 1\  = \ 0,\ giving\ y\  = \ 1.\ $$

$$Check\ y\left( \frac{\pi}{4} \right) = \ 3\  \neq \ 1.\ $$

Not a solution of the IVP.

b.  Use separation of variables to find the general solution of the DE.

$$\frac{1}{y\  - \ 1}dy\  = \ \tan\ x\ dx$$

$$\log|y\  - \ 1| = \  - \log\left| \cos\ x \right| + \ C\  = \ \log\left| \sec\ x \right| + \ C$$

$$y\  - \ 1\  = \ A\ \sec\ x$$

$$y\  = \ 1\  + \ C\ \sec\ x$$

c.  Hence solve the IVP.

$$\ Sub\ x\  = \frac{\pi}{4},\ y\  = \ 3:\ $$

$$3\  - \ 1\  = \ C\ \sec\left( \frac{\pi}{4} \right) = \ C\sqrt{2},\ $$

$$C\  = \ \sqrt{2}.$$

$$y\  = \ 1\  + \ \sqrt{2}\sec\ x$$

23. A certain curve has the property that the tangent at any point
    passes through the origin.

    a.  Write down the gradient of the line from (0, 0) to $(x,\ y).$

    b.  Now suppose $(x,\ y)\$is on a curve where the tangent at any
        point passes through the origin. Write down a DE for this curve.

    c.  Hence determine the general equation of this curve.

    d.  Which special case is a solution of the problem, but not of the
        DE?

$$a)\ Gradient\ of\ line\ from\ (0,0)to\ (x,\ y)\ is\ \frac{y}{x}.$$

b\) Since the tangent at $(x,\ y)$ passes through the origin, its
gradient equals $\frac{y}{x}$. The tangent gradient is $\frac{dy}{dx}$,
so:

$$\frac{dy}{dx} = \frac{y}{x}$$

$$c)\ Separate\ variables:\frac{dy}{y} = \frac{dx}{x}$$

$$\ln|y|\  = \ ln|x|\  + \ C$$

$$\ln\left| \frac{y}{x} \right| = C$$

$$\frac{y}{x} = A$$

$$y = Ax$$

d\) $x\  = \ 0$ satisfies the problem condition since the tangent would
be itself the line $x = 0$ that passes through the origin

but $x = 0$ does not satisfy the DE as it would be a division by zero.

24. A certain curve has the property that the normal at any point passes
    through the origin.

    a.  Write down the gradient of the line from (0, 0) to $(x,\ y).$

    b.  Now suppose $(x,\ y)$ is on this curve. Write down a DE for this
        curve.

    c.  Hence determine the general equation of this curve, which is a
        relation and not a function.

$$a)\ Gradient\ of\ line\ from\ (0,0)to\ (x,\ y)\ is\ \frac{y}{x}.$$

b\) The normal at $(x,\ y)$ passes through the origin, so the normal has
gradient $\frac{y}{x}.$

The tangent is perpendicular to the normal:

$$\frac{dy}{dx} = \  - \frac{x}{y}$$

$$c)\ y\ dy\  = \  - x\ dx$$

$$\frac{y^{2}}{2} = \  - \frac{x^{2}}{2} + \ C$$

$x²\  + \ y²\  = \ r²$

(a family of circles centred at the origin)

Mastery

25. A tangent is drawn to a curve, and its $x$-intercept is 1 less than
    the $x$-coordinate of the point of contact.

    a.  Write down the gradient of the line from $(x\  - \ 1,\ 0)$ to
        $(x,\ y).$

    b.  Now suppose $(x,\ y)$ is on this curve. Write down a DE for this
        curve.

    c.  Hence determine the general equation of this curve.

    d.  Find such a curve passing through (0, 1).

$$a)\ Gradient\  = \frac{y\  - \ 0}{x\  - \ (x\  - \ 1)} = \frac{y}{1} = \ y$$

$$b)\frac{dy}{dx} = \ y$$

$$c)\frac{dy}{y} = \ dx$$

$$\ln|y| = \ x\  + \ C$$

$$y\  = \ Ae^{x}$$

$$d)\ y(0)\  = \ 1:\ A\  = \ 1$$

$$y\  = \ e^{x}$$

26. a.  Differentiate $\log\left( \log\ x \right)$ using the chain rule.

$$\frac{d}{dx}\left( \log\left( \log\ x \right) \right) = \frac{1}{\log\ x} \cdot \frac{1}{x} = \frac{1}{x\ \log\ x}$$

b.  Hence find the general solution of $(x\ \log\ x)y'\  = \ y.$

$$\frac{y'}{y} = \frac{1}{x\ log\ x}$$

$$\int_{}^{}{\left( \frac{1}{y} \right)dy} = \ \int_{}^{}\frac{1}{x\ log\ x}dx\  = \ log(log\ x) + \ C$$

$$\log|y| = \ log(log\ x) + \ C$$

$$y\  = \ C\ log\ x$$

27. a.  Show that $\frac{x}{x\  + \ 2} = \ 1\  - \frac{2}{x\  + \ 2}.$

    b.  Hence solve the IVP $(x\  + \ 2)y' - \ xy\  = \ 0$ with
        $y(0)\  = \ 1$.

$$1\  - \frac{2}{x\  + \ 2} = \frac{x\  + \ 2\  - \ 2}{x\  + \ 2} = \frac{x}{x\  + \ 2}$$

$$\frac{y'}{y} = \frac{x}{x\  + \ 2} = \ 1\  - \frac{2}{x\  + \ 2}$$

$$\int_{}^{}{\left( \frac{1}{y} \right)dy} = \ \int_{}^{}{\left( 1\  - \frac{2}{x\  + \ 2} \right)dx}$$

$$\log|y| = \ x\  - \ 2log|x\  + \ 2| + \ C$$

$$y\  = \frac{Ae^{x}}{(x\  + \ 2)^{2}}$$

$$Sub\ x\  = \ 0,\ y\  = \ 1:\ 1\  = \frac{A}{4},\ so\ A\  = \ 4.$$

$$y\  = \frac{4e^{x}}{(x\  + \ 2)^{2}}$$

28. a.  Use the double-angle formulae to rewrite $2cos²x$ in terms of
        $\cos\ 2x.$

    b.  The solution of the DE $\frac{dy}{dx} = \frac{2\cos^{2}x}{y}$ is
        a relation and not a function. Use part **a** to find its
        equation, given that it passes through
        $\left( 0,\ \sqrt{2} \right).$

$$\cos\ 2x\  = \ 2\cos ²x\  - \ 1,\ so\ 2\cos ²x\  = \ 1\  + \ \cos\ 2x.$$

$$y\ dy\  = \ 2cos^{2}x\ dx\  = \ \left( 1\  + \ \cos\ 2x \right)dx$$

$$\int_{}^{}ydy\  = \ \int_{}^{}{\left( 1\  + \ \cos\ 2x \right)dx}$$

$$\frac{y^{2}}{2} = \ x\  + \ \left( \frac{1}{2} \right)\sin\ 2x\  + \ C$$

$$Sub\ \left( 0,\ \sqrt{2} \right):\ 1\  = \ 0\  + \ 0\  + \ C,\ so\ C\  = \ 1.$$

$$y^{2} = \ 2x\  + \ \sin\ 2x\  + \ 2$$

29. A tangent to a curve intersects the coordinate axes at $A$ and $B$.\
    The point of contact of the tangent is the midpoint of $AB$.

    a.  Let the point of contact be $(x,\ y)$. Find the coordinates of
        $A$ and $B$ in terms of $x$ and $y$.

    b.  Use the gradient of $AB$ to determine a $DE$ for this curve.

    c.  Hence determine the general equation of this curve.

$a)$ Tangent line passes through $A\  = \ (2x,\ 0)$ and
$B\  = \ (0,\ 2y)$ (since $(x,y)$ is the midpoint of $AB$).

$$b)\ Gradient\ of\ AB:\frac{2y\  - \ 0}{0\  - \ 2x} = \  - \frac{y}{x}$$

$$So\frac{dy}{dx}\  = \  - \frac{y}{x}$$

$$c)\frac{dy}{y} = \  - \frac{dx}{x}$$

$$\ln|y|\  = \  - \ln|x|\  + \ C$$

$$xy\  = \ C$$

30. a.  Let $y\  = \ x\  \times \ u$, where $u$ is an unknown function
        of $x$. Use the product rule to find an expression for $y'.$

$$y'\  = \ u\  + \ xu'$$

b.  Consider the DE $xy'\  = \ 2x\  + \ 2y.$

    i.  Use the result of part **a** to write a corresponding DE for $u$
        that is separable.

Sub $y\  = \ xu$ and $y'\  = \ u\  + \ xu'$ into
$xy'\  = \ 2x\  + \ 2y$:

$$x\left( u\  + \ xu' \right) = \ 2x\  + \ 2xu$$

$$xu\  + \ x^{2}u' = \ 2x\  + \ 2xu$$

$$x^{2}u' = \ 2x\  + \ xu$$

$$x²u'\  = \ x(2\  + \ u)$$

$$xu' = 2 + u$$

$$\frac{u'}{2\  + \ u} = \frac{1}{x}$$

ii. Solve this DE for $u$.

$$\frac{1}{u\  + \ 2}du\  = \ \left( \frac{1}{x} \right)dx$$

$$\log|u\  + \ 2| = \ log|x| + \ C$$

$$u\  + \ 2\  = \ Ax$$

$$u\  = \ Cx\  - \ 2$$

iii. Hence write down the general solution of $xy'\  = \ 2x\  + \ 2y$.

$$y\  = \ xu\  = \ x(Cx\  - \ 2)$$

$$= \ Cx^{2} - \ 2x$$

# Review of Exponential Growth and Decay

+-------------------------------------------------------------------+
| - **Review**                                                      |
+===================================================================+
| - Solve $y' = ky$                                                 |
|                                                                   |
| +------------------------------+------------------------------+   |
| | a.  Find the general         | b.  Solve                    |   |
| |     solution of $y' = 5y$    |     $\frac{dy}{dt} = 2y$     |   |
| |                              |     with $y(0) = 30$         |   |
| | $$y = Ae^{5x}$$              |                              |   |
| |                              | $$y = 30e^{2t}$$             |   |
| +==============================+==============================+   |
|                                                                   |
| - Solve exponential equations using logarithms\                   |
|   Solve $200\  = \ 50e^{3k}$ for $k$.                             |
|                                                                   |
| $$k = \frac{\ln 4}{3}$$                                           |
|                                                                   |
| - Model exponential growth and decay problems                     |
|                                                                   |
| A vessel of water is being emptied.\                              |
| The rate of change of the water is proportional to the amount of  |
| water.                                                            |
|                                                                   |
| +--------------------------------------------------------------+  |
| | a.  Explain why we can write $\frac{dV}{dt}$ $= kV$ from     |  |
| |     this information.                                        |  |
| +==============================================================+  |
| | b.  Show that $V = Ae^{kt}$ is a general solution to this    |  |
| |     differential equation.                                   |  |
| +--------------------------------------------------------------+  |
| | c.  Initially, it has 100 m³ of water.\                      |  |
| |     After 5 minutes, it has 90 m³.\                          |  |
| |     Find the particular solution to this differential        |  |
| |     equation.                                                |  |
| |                                                              |  |
| | $$V = 100e^{\left( \frac{\ln{0.9}}{5} \right)t}$$            |  |
| +--------------------------------------------------------------+  |
| | d.  Find how much water remains after 20 minutes.            |  |
| |                                                              |  |
| | 65.61 $m^{3}$                                                |  |
| +--------------------------------------------------------------+  |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Exponential Growth and Decay**                                |
+===================================================================+
| An application of differential equations you have seen before is  |
| exponential growth and decay. For exponential change, the rate of |
| change is **directly proportional to the current amount**.        |
|                                                                   |
| **More quantity means faster change. Less quantity means less     |
| change.**                                                         |
|                                                                   |
| $${\ \ \ \ \ If\ Q = Ae^{kt},\ \ \frac{dQ}{dt} = kAe^{kt}         |
| }{= kQ}$$                                                         |
|                                                                   |
| $k$ gives the growth rate, $A$ is the initial condition.          |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Modified Growth and Decay**                                                                                                                                                       |
+===================================================================================================================================================+===================================+
| In realistic models of growth and decay, the change is **proportional to the difference** of the current value to some constant value, $P$.                                           |
|                                                                                                                                                                                       |
| **Larger difference means faster change. Smaller difference means slower change.**                                                                                                    |
|                                                                                                                                                                                       |
| $${If\ Q = P + Ae^{kt},\ \ \frac{dQ}{dt} = kAe^{kt}                                                                                                                                   |
| }{= k\left( P + Ae^{kt} - P \right)                                                                                                                                                   |
| }{= k(Q - P)}$$                                                                                                                                                                       |
+---------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------+
| $$k < 0$$                                                                                                                                         | $$k < 0$$                         |
|                                                                                                                                                   |                                   |
| $$A > 0$$                                                                                                                                         | $$A < 0$$                         |
|                                                                                                                                                   |                                   |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image88.png){width="2.0055555555555555in"                               |                                   |
| height="1.7715277777777778in"}![](media/Further Applications of Calculus 4_Differential equations/media/image89.png){width="1.9942038495188101in" |                                   |
| height="1.7716535433070866in"}                                                                                                                    |                                   |
+---------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------+
| When $k < 0$ (decreasing growth), the quantity $Q$ approaches a **limiting value** $\mathbf{P}$ as $t \rightarrow \infty$.                                                            |
|                                                                                                                                                                                       |
| This limiting value $P$ can represent:                                                                                                                                                |
|                                                                                                                                                                                       |
| - ambient temperature; hot objects cool towards room temperature.                                                                                                                     |
|                                                                                                                                                                                       |
| - carrying capacity; populations stabilise at the maximum an environment can support.                                                                                                 |
|                                                                                                                                                                                       |
| $P\$is a horizontal isocline of the slope field, representing the constant asymptotic solution.                                                                                       |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                        |
+==============================================================================================+
| A colony of bacteria initially has 200 organisms. After 3 hours there are 1600 organisms.\   |
| The rate of increase is proportional to the number present.                                  |
|                                                                                              |
| a.  Write a differential equation modelling this scenario.\                                  |
|     Let $N$ be number of bacteria and $t$ be time in hours.                                  |
|                                                                                              |
| $$\frac{dN}{dt} = kN$$                                                                       |
|                                                                                              |
| b.  Find the equation for the population $N$ at time $t$ hours by solving the DE.            |
|                                                                                              |
| +-----------------------------------------------+------------------------------------------+ |
| | $$\frac{dN}{N} = kdt$$                        | $$N = Ae^{kt}$$                          | |
| |                                               |                                          | |
| | $$\ln|N| = kt + C$$                           | $$t = 0,\ N = 200,\ \therefore A = 200$$ | |
| |                                               |                                          | |
| | $$N = \pm e^{kt + C}$$                        | $$t = 3,\ N = 1600$$                     | |
| |                                               |                                          | |
| | $$N = Ae^{kt}\ where\ A\ is\ some\ constant$$ | $$1600 = 200e^{3k}$$                     | |
| |                                               |                                          | |
| |                                               | $$8 = e^{3k}$$                           | |
| |                                               |                                          | |
| |                                               | $$k = \frac{\ln 8}{3}$$                  | |
| |                                               |                                          | |
| |                                               | $$N = 200e^{\frac{\ln 8}{3}t}$$          | |
| +===============================================+==========================================+ |
|                                                                                              |
| c.  How many bacteria are there after 6 hours?                                               |
|                                                                                              |
| $$N(6) = 12\ 800$$                                                                           |
+----------------------------------------------------------------------------------------------+
| A radioactive substance has initial mass 100 g. After 10 years, 80 g remains.\               |
| The rate of decay is proportional to the mass. Find the mass after 25 years.                 |
|                                                                                              |
| 57.2 g                                                                                       |
+----------------------------------------------------------------------------------------------+
| The temperature of an object changes at a rate proportional to the difference between its    |
| temperature $T$ and the ambient temperature $A$.                                             |
|                                                                                              |
| A cup of coffee cools from 90°C to 70°C in 5 minutes in a room at 20°C.\                     |
| Form and solve the differential equation for $T$ as a function of time $t$.                  |
|                                                                                              |
| $T\  = \ 20\  + \ 70e^{kt}$ where $k = \frac{1}{5}\ln\frac{5}{7}$                            |
+----------------------------------------------------------------------------------------------+

[]{#_Toc226795457 .anchor}

Foundation

1.  Consider $y'\  = \ ky$, where $k$ is an unknown constant.

    a.  Find the general solution.

    b.  Evaluate the arbitrary constant given $y(0)\  = \ 20.$

    c.  Evaluate $k$ given $y(2)\  = \ 5.$

    d.  Simplify the solution and evaluate $y(3).$

$$a)\ y\  = \ Ae^{kx}$$

$$b)\ Sub\ y(0) = \ 20:\ A\  = \ 20$$

$$y\  = \ 20e^{kx}$$

$$c)\ Sub\ y(2) = \ 5:\ 5\  = \ 20e^{2k} \rightarrow \ e^{2k} = \frac{1}{4} \rightarrow \ k\  = \  - \log\ 2$$

$$d)\ y\  = \ 20e^{- x\ log\ 2} = \ 20\  \cdot \ 2^{- x}$$

$$y(3) = \ 20\  \cdot \ 2^{- 3} = 2.5$$

2.  Consider $y'\  = \ ky$, where $k$ is an unknown constant.

    a.  Find the general solution.

    b.  Evaluate the arbitrary constant given $y(0)\  = \ 8$.

    c.  Evaluate $k$ given $y(2)\  = \ 18.$

    d.  Simplify the solution and evaluate $y(4).$

$$a)\ y\  = \ Ae\hat{}(kx)$$

$$b)\ Sub\ y(0)\  = \ 8:\ A\  = \ 8$$

$$y\  = \ 8e^{kx}$$

$$c)\ Sub\ y(2) = \ 18:\ 18\  = \ 8e^{2k}$$

$$e^{2k} = \frac{9}{4}\ $$

$$k\  = \ \log\left( \frac{3}{2} \right)$$

$$d)\ y\  = \ 8e^{x\ log\left( \frac{3}{2} \right)} = \ 8\  \cdot \ \left( \frac{3}{2} \right)^{x}$$

$$y(4) = \ 8\left( \frac{3}{2} \right)^{4} = \ 40.5$$

3.  a.  Find the general solution of $y'\  = \ e^{- y}.$

    b.  Describe the family of curves.

    c.  Evaluate the arbitrary constant given the curve passes through
        (0, 1).

$$e^{y}dy\  = \ dx\ $$

$$e^{y} = \ x\  + \ C$$

$$y\  = \ \log(x\  + \ C)$$

Log curves with different $x$-intercepts (horizontal shifts of
$y\  = \ \log\ x$).

$$Sub\ (0,\ 1):\ e^{1} = \ 0\  + \ C$$

$$C\  = \ e$$

$$y\  = \ \log(x\  + \ e)$$

4.  The solution of $y'y\  = \ 2$ is a relation, not a function.

    a.  Find the general solution.

    b.  Describe the family of curves.

    c.  Evaluate the arbitrary constant given the curve passes through
        (0, 1).

$$y\ dy\  = \ 2\ dx\ $$

$$\frac{y^{2}}{2} = \ 2x\  + \ C\ $$

$$y^{2} = \ 4x\  + \ C$$

Concave-right parabolas with vertex on the $x$-axis.

$$Sub\ (0,\ 1):\ 1\  = \ 0\  + \ C,\ so\ C\  = \ 1$$

$$y²\  = \ 4x\  + \ 1$$

5.  A radioactive material decays at a rate proportional to the amount
    present:\
    $\frac{dR}{dt}$ $= \ kR$, where $R$ is the amount at time $t$ days
    and $k$ is an unknown constant.

    a.  Find the general solution of this DE.

$$\frac{dR}{R} = \ k\ dt$$

$$\int_{}^{}\frac{dR}{R}\  = \ \int_{}^{}kdt$$

$$\ln|R| = \ kt\  + \ C$$

$$R\  = \ Ae^{kt}$$

b.  Initially there is 100 grams. Determine the arbitrary constant.

$$R(0)\  = \ 100:\ A\  = \ 100$$

c.  After 4 days only 20 grams remains. Determine the value of k.

$$R(4) = \ 20:\ 100e^{4k} = \ 20$$

$$e^{4k} = \frac{1}{5}$$

$$k\  = \frac{1}{4}\ln\left( \frac{1}{5} \right) = \  - \left( \frac{1}{4} \right)\ln\ 5$$

d.  Hence determine the amount present after 12 days.

$$R(12) = \ 100e^{12k} = 0.8\ g$$

e.  Show that
    $R\  = \ 100\  \times \ \left( \frac{1}{5} \right)^{\frac{t}{4}},$
    then use this formula to check part **d** mentally.

$$R\  = \ 100e^{kt} = \ 100e^{\left( \frac{t}{4} \right)\ln\left( \frac{1}{5} \right)} = \ 100\left( \frac{1}{5} \right)^{\frac{t}{4}}$$

$$Check\ t\  = \ 12:\ R\  = \ 100\left( \frac{1}{5} \right)^{3} = \frac{100}{125} = \frac{4}{5}$$

Development

6.  A metal ingot is cooled to 5°C then placed in a room at 25°C.\
    Let $H$ be the temperature after $t$ minutes.

$\frac{dH}{dt}$ $= \ k(H\  - \ 25)$, for some constant $k$.

a.  Find the general solution of this DE.

$$\frac{dH}{H\  - \ 25} = \ k\ dt$$

$$\ln|H\  - \ 25| = \ kt\  + \ C$$

$$H\  - \ 25\  = \ Ae^{kt}$$

$$H\  = \ 25\  + \ Ae^{kt}$$

b.  Use the initial condition to determine the arbitrary constant.

$$H(0) = \ 5:\ 5\  = \ 25\  + \ A$$

$$\ A\  = \  - 20$$

$$H\  = \ 25\  - \ 20e^{kt}$$

c.  After 10 minutes the ingot is at 15°C. Determine the value of $k$.

$$H(10) = \ 15:\ 25\  - \ 20e^{10k} = \ 15$$

$$e^{10k} = \frac{1}{2}$$

$$k\  = \  - \left( \frac{1}{10} \right)\ln\ 2$$

d.  Find how long it takes, to the nearest minute, for the temperature
    to reach 24°C.

$$25\  - \ 20e^{kt} = \ 24$$

$$e^{kt} = \frac{1}{20}$$

$$kt\  = \  - ln\ 20$$

$$t\  = \frac{- \ln\ 20}{- \left( \frac{1}{10} \right)\ln\ 2} = \frac{10\ \ln\ 20}{\ln\ 2} \approx \ 43\ minutes$$

7.  A conical tank (height 12 m, radius 4 m) is filled with water that
    evaporates at a rate proportional to the circular surface area. Let
    $r$ metres be the radius of the surface at time $t$ hours.\
    (Volume of cone: $V\  = \frac{1}{3}\pi r²h$.)

    a.  Write down a DE for the evaporation in terms of the radius.

    b.  Use part a and the chain rule to find a DE for the rate of
        change of the radius.

    c.  Use the given information to solve this DE.

    d.  After 6 hours the depth of water is $10.5$ m. Determine the
        value of $k$.

    e.  Hence give a formula for the volume of water at time $t$. Note
        any restrictions on $t$.

$$a)\frac{dV}{dt} = \ k\pi r^{2},\ for\ some\ constant\ k\ (k\  < \ 0)$$

$$b)\ V\  = \ \left( \frac{1}{3} \right)\pi r^{2}h.\ $$

$$Since\ the\ tank\ has\ fixed\ proportions\frac{h}{r} = \frac{12}{4} = \ 3,\ $$

$$h\  = \ 3r\ and\ V\  = \ \pi r^{3}$$

$$\frac{dV}{dt} = \ 3\pi r^{2}\left( \frac{dr}{dt} \right)$$

$$Using\ part\ a:\ 3\pi r^{2}\left( \frac{dr}{dt} \right) = \ k\pi r^{2}$$

$$\frac{dr}{dt} = \frac{k}{3}$$

$$c)\ Separate\ variables:\ dr\  = \frac{k}{3}dt$$

$$r\  = \frac{k}{3}t\  + \ C$$

$$At\ t\  = \ 0,\ r\  = \ 4:\ C\  = \ 4\ $$

$$r\  = \frac{k}{3}t\  + \ 4$$

$$d)\ At\ t\  = \ 6,\ depth\  = \ 10.5\ m,\ so\ r\  = \frac{10.5}{3} = \ 3.5\ m:$$

$$3.5\  = \ \left( \frac{k}{3} \right)(6) + \ 4$$

$$2k\  = \  - 0.5$$

$$k\  = \  - \frac{1}{4}$$

$$So\frac{dr}{dt} = \  - \frac{1}{12},\ and\ r\  = \ 4\  - \frac{t}{12}$$

$$e)\ V\  = \ \pi r^{3} = \ \pi\left( 4\  - \frac{t}{12} \right)^{3},\ for\ 0\  \leq \ t\  \leq \ 48$$

Mastery

8.  A cylindrical tank is filled with water to a height of 400 cm. A tap
    at the bottom is opened and

$$\frac{dh}{dt} = \ k\sqrt{h}$$

a.  State the initial condition, and explain why $k$ must be negative.

b.  Solve the IVP. You may assume the arbitrary constant of integration
    is positive.

c.  After 20 minutes the height is 100 cm. Find two possible values of
    $k$.

d.  How long does the tank take to drain? Hence explain why only one
    value of $k$ is valid.

e.  Is the function found in part **b** valid for larger values of $t$?

$$a)\ h(0)\  = \ 400.\ Since\ the\ water\ level\ decreases,\ \frac{dh}{dt} < \ 0\ so\ k\  < \ 0.$$

$$b)\ Separate\ variables:\ h^{- \frac{1}{2}}dh\  = \ k\ dt$$

$$2\sqrt{h} = \ kt\  + \ C$$

$$At\ t\  = \ 0,\ h\  = \ 400:\ C\  = \ 40$$

$$2\sqrt{h} = \ kt\  + \ 40$$

$$h\  = \ \left( \frac{kt\  + \ 40}{2} \right)^{2} = \frac{1}{4}(kt\  + \ 40)^{2}$$

$$c)\ h(20) = \ 100:$$

$$\frac{1}{4}(20k\  + \ 40)^{2} = \ 100$$

$$(20k\  + \ 40)^{2} = \ 400$$

$$20k\  + \ 40\  = \  \pm 20$$

$$\therefore k = - 1\ \ or - 3$$

d\) For $k = - 1$, $h\  = \ 0:$

$$\frac{1}{4}( - t\  + \ 40)^{2} = \ 0\ \ $$

$$t\  = \ 40\ \min$$

For $k = - 3,\ h = 0:$

$$\frac{1}{4}( - 3t + 40)^{2} = 0$$

$$t = \frac{40}{3} \approx 13.33\ \min$$

But part **c** says there is still water after 20 minutes.\
The tank can't increase in water again after it empties, so only
$k = - 1$ is valid

e\) No. For $t\  > \ 40,\ ( - t\  + \ 40)^{2}$ increases again,\
implying $h$ increases, which is impossible once the tank is empty.

The solution is only valid for $0\  \leq \ t\  \leq \ 40.$

9.  The atmospheric pressure $P$ on a planet changes with altitude $h$
    at a rate proportional to $P$:

$\frac{dP}{dh}$ $= \ kP$, for some constant $k$. Let $P\  = \ P_{0}$ at
ground level.

a.  Find the general solution of this DE.

b.  The pressure at 10 000 m is 40 kPa (kilopascals) and at 6000 m is 80
    kPa.\
    Find the value of $k$.

c.  Determine the pressure at ground level, correct to the nearest kPa.

$$a)\frac{dP}{dh} = \ kP$$

$$\ P\  = \ P_{0}e^{kh}$$

$$b)\ P(6000) = \ 80:\ P_{0}e^{6000k} = \ 80\ ...\ (1)$$

$$P(10000) = \ 40:\ P_{0}e^{10000k} = \ 40\ ...\ (2)$$

$$\frac{(2)}{(1)}:\ e^{4000k} = \frac{1}{2}$$

$$k\  = \  - \frac{\ln\ 2}{4000}$$

$$c)\ From\ (1):\ P_{0} = \ 80e^{- 6000k} = \ 80e^{6000\ ln\frac{2}{4000}} \approx \ 226\ kPa$$

10. According to Fick\'s law, diffusion across a cell membrane
    satisfies:

$\frac{dC}{dt}$ $= \ k(S\  - \ C),$ for some constant $k$,

where $C(t)$ is the concentration in the cell and $S$ is the
concentration in the surrounding medium.

a.  Find the general solution of this DE.

b.  Suppose $C(0)\  = \ C_{0}$, where $C_{0} < \ S$. Solve the IVP.

$$a)\frac{dC}{S\  - \ C} = \ k\ dt$$

$$- \ln|S\  - \ C| = \ kt\  + \ C_{1}$$

$$S\  - \ C\  = \ Ae^{- kt}$$

$$C\  = \ S\  + \ Ae^{- kt}$$

$$b)\ C(0) = \ C_{0}:\ C_{0} = \ S\  + \ A\ $$

$$A\  = \ C_{0} - \ S$$

$$C\  = \ S\  + \ \left( C_{0} - \ S \right)e^{- kt}$$

# The Logistic Equation

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                                                                                                                    |
+=================================================================================================================================================================================================================+
| - Manipulate fractions                                                                                                                                                                                          |
|                                                                                                                                                                                                                 |
| +-------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------+ |
| | a.  $Write\ \frac{5}{P\left( 1\  - \frac{P}{3000} \right)}\ in\ the\ form\ \frac{k}{P(3000\  - \ P)}$ | b.  $Write\ \frac{7}{P\left( 1\  - \frac{P}{500} \right)}\ in\ the\ form\ \frac{k}{P(500\  - \ P)}$ | |
| +=======================================================================================================+=====================================================================================================+ |
|                                                                                                                                                                                                                 |
| - Integrate logs                                                                                                                                                                                                |
|                                                                                                                                                                                                                 |
| +-----------------------------+-----------------------------------+---------------------------------------------------+                                                                                         |
| | a.                          | b.                                | c.                                                |                                                                                         |
| |                             |                                   |                                                   |                                                                                         |
| | $$\int_{}^{}\frac{1}{y}dy$$ | $$\int_{}^{}\frac{1}{200 - y}dy$$ | $$\int_{}^{}{\frac{1}{y} + \frac{6}{500 - y}}dy$$ |                                                                                         |
| +=============================+===================================+===================================================+                                                                                         |
|                                                                                                                                                                                                                 |
| - Log laws and exponentiation                                                                                                                                                                                   |
|                                                                                                                                                                                                                 |
| +------------------------------+------------------------------+                                                                                                                                                 |
| | a.  Write $\ln 7 - \ln 3$ as | b.  Write                    |                                                                                                                                                 |
| |     a single logarithm       |     $\ln y - \ln(200 - y)$   |                                                                                                                                                 |
| |                              |     as a single logarithm    |                                                                                                                                                 |
| +==============================+==============================+                                                                                                                                                 |
| | c.  Write $P$ as the         | d.  Write $P$ as the         |                                                                                                                                                 |
| |     subject.                 |     subject.                 |                                                                                                                                                 |
| |                              |                              |                                                                                                                                                 |
| | $$\ln|P| = 50$$              | $$\ln|P + 5| = 50 + k$$      |                                                                                                                                                 |
| +------------------------------+------------------------------+                                                                                                                                                 |
|                                                                                                                                                                                                                 |
| - Rearrange equations involving factorisation                                                                                                                                                                   |
|                                                                                                                                                                                                                 |
| > Make $P$ the subject                                                                                                                                                                                          |
|                                                                                                                                                                                                                 |
| +-------------------------------------------------------+-------------------------------------------------------+                                                                                               |
| | a.  $\frac{1}{5}e^{\frac{t}{5}} = \frac{P}{3000 - P}$ | b.  $\frac{1}{4}e^{\frac{t}{4}} = \frac{P}{8000 - P}$ |                                                                                               |
| +=======================================================+=======================================================+                                                                                               |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Logistic Equation**                                                                                                                           |
+===================================================================================================================================================+
| $$\frac{dP}{dt} = kP\left( 1\  - \frac{P}{C} \right)$$                                                                                            |
|                                                                                                                                                   |
| The **logistic equation** models growth that is limited by a **carrying capacity** $C$.                                                           |
|                                                                                                                                                   |
| $kP$ represents exponential growth, and $\left( 1 - \frac{P}{C} \right)$ represents the constraints of the environment. When                      |
| $P = C,\ \left( 1 - \frac{P}{C} \right) = 0\$and growth stops.                                                                                    |
|                                                                                                                                                   |
| Logistic growth in a population begins slowly as few individuals reproduce, accelerates as the population grows, then slows as it approaches the  |
| environment\'s carrying capacity.                                                                                                                 |
|                                                                                                                                                   |
| ![](media/Further Applications of Calculus 4_Differential equations/media/image90.png){width="2.3965277777777776in"                               |
| height="1.8402777777777777in"}![](media/Further Applications of Calculus 4_Differential equations/media/image91.png){width="2.3965277777777776in" |
| height="1.8208333333333333in"}                                                                                                                    |
|                                                                                                                                                   |
| The logistic equation has horizontal isoclines representing constant asymptotic solutions at $P = 0$ and $P = C$. All solution curves will tend   |
| to converge towards $P = C$.                                                                                                                      |
|                                                                                                                                                   |
| Usually, the scenario limits the domain and range to $t \geq 0$ and $P > 0$.                                                                      |
|                                                                                                                                                   |
| **Alternate notation:**                                                                                                                           |
|                                                                                                                                                   |
| $P' = kP(C - P):$ $C$ is expanded into the brackets; $k$ is different to the original.                                                            |
+---------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  The logistic equation is $\frac{dP}{dt} = kP(1 -$ ......$)$   |
|                                                                   |
| 2.  In the logistic equation, $C$ represents the                  |
|     ..................... ..................                      |
|                                                                   |
| 3.  The logistic equation has constant solutions at $P =$         |
|     ......... and $P =$ .........                                 |
|                                                                   |
| 4.  Setting the right hand side equal to ............ gives the   |
|     constant solutions.                                           |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
| - **Solving Logistic Differential Equations**                                 |
+===============================================================================+
| The general form of a logistic differential equation                          |
| $\frac{dP}{dt} = kP\left( 1\  - \frac{P}{C} \right)$ is                       |
|                                                                               |
| $$P = \frac{C}{1 + Ae^{- kt}}\ \ \ \ \ \ where\ A = \frac{C - P_{0}}{P_{0}}$$ |
|                                                                               |
| Note that you cannot memorise this. The questions will require you to solve   |
| the DE.                                                                       |
|                                                                               |
| To solve the DE, you will be given a **partial fraction decomposition** and   |
| follow these steps:                                                           |
|                                                                               |
| 1.  Invert both sides of the DE to get $\frac{dt}{dP}$.                       |
|                                                                               |
| 2.  Match the integrand to the given partial fractions.                       |
|                                                                               |
| 3.  Integrate both sides; use $D$ as the constant of integration.             |
|                                                                               |
| 4.  Combine $\ln\ a - \ln\ b = \ln\left( \frac{a}{b} \right)$ and isolate.    |
|                                                                               |
| 5.  Exponentiate and write $\pm e^{\frac{c}{k}}$ as a single arbitrary        |
|     constant $A$.                                                             |
|                                                                               |
| 6.  Substitute the initial condition to find $A$.                             |
|                                                                               |
| 7.  Rearrange to make $P$ the subject.                                        |
|                                                                               |
| 8.  Divide through by $e^{kt}$ to reach the general form                      |
|     $P\  = \frac{C}{1\  + \ Be^{- kt}}$.                                      |
|                                                                               |
| We will first practice the purely algebraic case where there is no context.   |
|                                                                               |
| - If you find the constant of integration before absorbing it into $A$,       |
|   removing the absolute value leaves you with a $\pm$ sign. Substitute the    |
|   initial condition back in to determine which case, positive or negative,    |
|   applies.                                                                    |
+-------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Solve logistic differential equations                                                                                 |
+======================================================================+==============================================================+
| Solve the differential equation:                                                                                                    |
|                                                                                                                                     |
| $$\frac{dP}{dt} = \frac{1}{5}P\left( 1\  - \frac{P}{3000} \right),\ \ given\ P\  = \ 500\ when\ t\  = \ 0$$                         |
|                                                                                                                                     |
| $$Use\ \frac{3000}{P(3000 - P)} = \frac{1}{P} + \frac{1}{3000 - P}$$                                                                |
|                                                                                                                                     |
| Write your solution in the standard form $P =$ $\frac{C}{1 + Be^{- kt}}$                                                            |
+----------------------------------------------------------------------+--------------------------------------------------------------+
| 1\. Invert both sides                                                | 6\. Substitute initial condition                             |
|                                                                      |                                                              |
| $$\frac{dt}{dP} = \frac{5}{P\left( 1 - \frac{P}{3000} \right)}$$     | Sub (0,500)                                                  |
|                                                                      |                                                              |
| 2\. Match integrand to partial fraction                              | $${\frac{500}{3000 - 500} = Ae^{0}                           |
|                                                                      | }{A = \frac{1}{5}}$$                                         |
| $$\frac{dt}{dP} = \frac{5}{\frac{1}{3000}P(3000 - P)}$$              |                                                              |
|                                                                      | 7\. Rearrange $P$ as subject                                 |
| $$\frac{dt}{dP} = \frac{5 \cdot 3000}{P(3000 - P)}$$                 |                                                              |
|                                                                      | $${\frac{P}{3000 - P} = \frac{e^{\frac{t}{5}}}{5}            |
| $$\frac{dt}{dP} = 5\left( \frac{1}{P} + \frac{1}{3000 - P} \right)$$ | }{5P = 3000e^{\frac{t}{5}} - e^{\frac{t}{5}}P                |
|                                                                      | }{5P + e^{\frac{t}{5}}P = 3000e^{\frac{t}{5}}                |
| 3\. Integrate both sides                                             | }{P\left( 5 + e^{\frac{t}{5}} \right) = 3000e^{\frac{t}{5}}  |
|                                                                      | }{P = \frac{3000e^{\frac{t}{5}}}{5 + e^{\frac{t}{5}}}}$$     |
| $$t = 5\int_{}^{}\frac{1}{P} + \frac{1}{3000 - P}dP$$                |                                                              |
|                                                                      | 8\. Write in general form                                    |
| $$\ \ \  = 5\left( \ln|P| - \ln|3000 - P| \right) + D$$              |                                                              |
|                                                                      | $$P = \frac{3000}{1 + 5e^{- \frac{t}{5}}}$$                  |
| 4\. Combine log and isolate                                          |                                                              |
|                                                                      |                                                              |
| $$t + D_{2} = 5\ln\left| \frac{P}{3000 - P} \right|$$                |                                                              |
|                                                                      |                                                              |
| $$\ln\left| \frac{P}{3000 - P} \right| = \frac{t + D_{2}}{5}$$       |                                                              |
|                                                                      |                                                              |
| 5\. Exponentiate and rewrite constant as $A$                         |                                                              |
|                                                                      |                                                              |
| $${\left| \frac{P}{3000 - P} \right| = e^{\frac{t + D_{2}}{5}}       |                                                              |
| }{\frac{P}{3000 - P} = \pm e^{\frac{D_{2}}{5}}e^{\frac{t}{5}}        |                                                              |
| }{\frac{P}{3000 - P} = Ae^{\frac{t}{5}}}$$                           |                                                              |
+----------------------------------------------------------------------+--------------------------------------------------------------+
| - **Guided Practice**                                                                                                               |
+-------------------------------------------------------------------------------------------------------------------------------------+
| $$Solve\ \frac{dP}{dt}\  = \ \left( \frac{1}{4} \right)P\left( 1\  - \frac{P}{8000} \right),\ \ where\ P(0)\  = \ 2000$$            |
|                                                                                                                                     |
| $$Given\ \frac{8000}{P(8000 - P)} = \frac{1}{P} + \frac{1}{8000 - P}$$                                                              |
+----------------------------------------------------------------------+--------------------------------------------------------------+
| 1\. Invert both sides                                                | 6\. Substitute initial condition                             |
|                                                                      |                                                              |
| 2\. Match integrand to partial fraction                              | 7\. Rearrange $P$ as subject                                 |
|                                                                      |                                                              |
| 3\. Integrate both sides                                             | 8\. Write in general form                                    |
|                                                                      |                                                              |
| 4\. Combine log and isolate                                          | $$P\  = \frac{8000}{1 + 3e^{- \frac{t}{4}}}$$                |
|                                                                      |                                                              |
| 5\. Exponentiate and rewrite constant as $A$                         |                                                              |
+----------------------------------------------------------------------+--------------------------------------------------------------+
| - **Guided Practice**                                                                                                               |
+-------------------------------------------------------------------------------------------------------------------------------------+
| A wildlife conservancy models the lion population $P$, where $t$ is years after 2020.                                               |
|                                                                                                                                     |
| The carrying capacity is 600 lions. The population satisfies the logistic equation                                                  |
|                                                                                                                                     |
| $$\frac{dP}{dt} = \frac{1}{6}P\left( 1\  - \frac{P}{600} \right)$$                                                                  |
|                                                                                                                                     |
| In 2020 there were 150 lions.                                                                                                       |
|                                                                                                                                     |
| Given that $\frac{600}{P(600 - P)}$ $=$ $\frac{1}{P}$ $+$ $\frac{1}{600 - P}$,                                                      |
|                                                                                                                                     |
| find the population equation and the population in 2026.                                                                            |
|                                                                                                                                     |
| $$P\  = \frac{600}{1\  + \ 3e^{- \frac{t}{6}}}$$                                                                                    |
|                                                                                                                                     |
| $$P(6) \approx 285$$                                                                                                                |
+-------------------------------------------------------------------------------------------------------------------------------------+

Development

1.  A lake is stocked with fish. The population $P$ satisfies the
    differential equation:

$$\frac{dP}{dt} = \frac{1}{3}P\left( 1 - \frac{P}{900} \right),\ \ \ \ \ P(0) = 100$$

With $t$ in years. Use $\frac{900}{P(900 - P)} = \frac{1}{900 - P}$.
Find $P(t)$ and the population after 6 years.

$$\frac{dt}{dP} = 3\left( \frac{1}{P} + \frac{1}{900 - P} \right)\  \Rightarrow \ \frac{P}{900 - P} = Ae^{\frac{t}{3}}$$

$$P(0) = 100:\ \frac{100}{800} = A\  \Rightarrow \ A = \frac{1}{8}$$

$$P = \frac{900}{1 + 8e^{- \frac{t}{3}}}$$

$$t = 6:\ P(6) = \frac{900}{1 + 8e^{- 2}} \approx 432\ fish$$

2.  Solve
    $\frac{dP}{dt} = \frac{1}{2}P\left( 1 - \frac{P}{500} \right)$,
    $P(0) = 50$.\
    Find $P(t)$ and $P(4)$. Use
    $\frac{500}{P(500 - P)} = \frac{1}{P} + \frac{1}{500 - P}$.

$$\frac{dt}{dP} = 2\left( \frac{1}{P} + \frac{1}{500 - P} \right)\  \Rightarrow \ \frac{P}{500 - P} = Ae^{\frac{t}{2}}\ $$

$$P(0) = 50:\ \frac{50}{450} = A\  \Rightarrow \ A = \frac{1}{9}\ $$

$$P = \frac{500}{1 + 9e^{- t/2}}\ $$

$$P(4) = \frac{500}{1 + 9e^{- 2}} \approx 225$$

3.  A seal colony satisfies
    $\frac{dP}{dt} = \frac{1}{4}P\left( 1 - \frac{P}{800} \right)$,
    $P(0) = 100$, $t$ in years.\
    Use $\frac{800}{P(800 - P)} = \frac{1}{P} + \frac{1}{800 - P}$.\
    Find $P(t)$, $P(8)$, and show long-term population is the carrying
    capacity.

$$\frac{P}{800 - P} = Ae^{t/4}$$

$$\ P(0) = 100:\ \frac{100}{700} = A = \frac{1}{7}$$

$$P = \frac{800}{1 + 7e^{- t/4}}$$

$$P(8) = \frac{800}{1 + 7e^{- 2}} = \frac{800}{1.9473} \approx 411$$

As $t \rightarrow \infty$, $e^{- t/4} \rightarrow 0$, so
$P \rightarrow 800$ (the carrying capacity).

4.  A bacterial population $P$ satisfies

$$\frac{dP}{dt} = \frac{P}{8}\left( 1 - \frac{P}{5000} \right),\quad\quad P(0) = 1000,$$

with $t$ in hours. You may use
$\frac{Q}{P(Q - P)} = \frac{1}{P} + \frac{1}{Q - P}$.

a.  Show that $P =$ $\frac{5000}{1 + 4e^{- t/8}}$

$$\frac{dt}{dP} = \frac{8}{P\left( 1 - \frac{P}{5000} \right)} = \frac{8 \cdot 5000}{P(5000 - P)} = 8\left( \frac{1}{P} + \frac{1}{5000 - P} \right)$$

$$t = 8ln\left| \frac{P}{5000 - P} \right| + D\  \Rightarrow \ \frac{P}{5000 - P} = Ae^{t/8}$$

$$P(0) = 1000:\ \frac{1000}{4000} = A\  \Rightarrow \ A = \frac{1}{4}$$

$$4P = (5000 - P)e^{t/8}\  \Rightarrow \ P\left( 4 + e^{t/8} \right) = 5000e^{t/8}$$

$$P = \frac{5000e^{t/8}}{4 + e^{t/8}} = \frac{5000}{1 + 4e^{- t/8}}$$

b.  If instead $P(0) = 6000$, describe what happens to the population as
    $t$ increases.

If $P(0) = 6000 > 5000$, then $1 - \frac{P}{5000} < 0$, so
$\frac{dP}{dt} < 0$.

The population decreases and approaches the carrying capacity of $5000$
from above

5.  A colony of rabbits has carrying capacity 1200 and satisfies

> $$\frac{dP}{dt} = kP\left( 1 - \frac{P}{1200} \right),\quad\quad P(0) = 200,\quad P(2) = 400,$$

where $k$ is an unknown constant and $t$ is in years.\
Use $\frac{1200}{P(1200 - P)} = \frac{1}{P} + \frac{1}{1200 - P}$.\
Find $P(t)$ and hence $P(5)$.

$$\frac{dt}{dP} = \frac{1}{k}\left( \frac{1}{P} + \frac{1}{1200 - P} \right)\  \Rightarrow \ \frac{P}{1200 - P} = Ae^{kt}$$

$$P(0) = 200:\ \frac{200}{1000} = A\  \Rightarrow \ A = \frac{1}{5},\ so\ \ P = \frac{1200}{1 + 5e^{- kt}}$$

Find $k$ using $P(2) = 400$:

$$400 = \frac{1200}{1 + 5e^{- 2k}}\  \Rightarrow \ 1 + 5e^{- 2k} = 3\  \Rightarrow \ e^{- 2k} = 0.4$$

$$k = - \frac{1}{2}ln0.4 = \frac{1}{2}ln2.5 \approx 0.4581$$

$P(5) = \frac{1200}{1 + 5e^{- 5k}}$, where
$e^{- 5k} = (0.4)^{2.5} \approx 0.1012$

$$P(5) = \frac{1200}{1.5060} \approx 797$$

6.  A herd satisfies
    $\frac{dP}{dt} = kP\left( 1 - \frac{P}{2000} \right)$ with
    $P(0) = 250$ and $P(3) = 500$.\
    Use $\frac{2000}{P(2000 - P)} = \frac{1}{P} + \frac{1}{2000 - P}$.\
    Find $k$ and $P(6)$.

$$\frac{P}{2000 - P} = Ae^{kt}$$

$$P(0) = 250:\ \frac{250}{1750} = A = \frac{1}{7}$$

$$P = \frac{2000}{1 + 7e^{- kt}}$$

$$P(3) = 500:\ 1 + 7e^{- 3k} = 4\  \Rightarrow \ e^{- 3k} = \frac{3}{7}$$

$$k = \frac{1}{3}\ln\frac{7}{3} \approx 0.2824$$

$$P(6) = \frac{2000}{1 + 7e^{- 6k}},\ where\ e^{- 6k} = \left( \frac{3}{7} \right)^{2} = \frac{9}{49}$$

$$P(6) = \frac{2000}{1 + 7 \cdot \frac{9}{49}} = 875$$

7.  Gossip spreads rapidly through a school. The proportion $P$ of
    people who have heard it satisfies

$$\frac{dP}{dt} = 3P(1 - P),$$

with $t$ in weeks. Initially 20% of people have heard it.

a.  Show that $\frac{1}{P} + \frac{1}{1 - P} = \frac{1}{P(1 - P)}.$

b.  Solve for $P$.

c.  What proportion of the school has heard the gossip after 1 week?\
    Answer to the nearest percent.

d.  Find the exact time at which half the school has heard the gossip.

$$\frac{1}{P} + \frac{1}{1 - P} = \frac{(1 - P) + P}{P(1 - P)} = \frac{1}{P(1 - P)}$$

$$\frac{1}{P(1 - P)}\, dP = 3\, dt$$

$$\int\left( \frac{1}{P} + \frac{1}{1 - P} \right)dP = \int_{}^{}3dt$$

$$\ln\left| \frac{P}{1 - P} \right| = 3t + D\  \Rightarrow \frac{P}{1 - P} = Ae^{3t}$$

$$P(0) = \frac{1}{5}:\frac{\frac{1}{5}}{\frac{4}{5}} = A$$

$$\ A = \frac{1}{4}$$

$$4P = (1 - P)e^{3t}$$

$$\ P\left( 4 + e^{3t} \right) = e^{3t}$$

$$\ P = \frac{e^{3t}}{4 + e^{3t}}$$

At $t = 1$

$$P = \frac{e^{3}}{4 + e^{3}} \approx 83\%$$

$$Set\ P = \frac{1}{2}:$$

$$\frac{1}{2} = \frac{e^{3t}}{4 + e^{3t}}$$

$$\ 4 + e^{3t} = 2e^{3t}$$

$$\ e^{3t} = 4\ $$

$$\ t = \frac{1}{3}\ln 4$$

Mastery

8.  a.  Show that
        $\frac{700}{P(700 - P)} = \frac{1}{P} + \frac{1}{700 - P}$

$$RHS = \frac{700 - P + P}{P(700 - P)}$$

$$= \frac{700}{P(700 - P)}\ as\ required.$$

b.  Solve
    $\frac{dP}{dt} = \frac{1}{5}P\left( 1 - \frac{P}{700} \right)$,
    $P(0) = 140$. Find $P(t)$ and $P(10)$.

$$\frac{P}{700 - P} = Ae^{\frac{t}{5}}$$

$$\ P(0) = 140$$

$$\frac{140}{560} = A = \frac{1}{4}$$

$$P = \frac{700}{1 + 4e^{- \frac{t}{5}}}$$

$$P(10) = \frac{700}{1 + 4e^{- 2}} \approx 454$$

9.  An island is stocked with 40 animals; the carrying capacity is 1000.
    The population $N$ satisfies

> $$\frac{dN}{dt} = kN(1000 - N).$$
>
> Use $\frac{1000}{N(1000 - N)} = \frac{1}{N} + \frac{1}{1000 - N}$.\
> Given $N(0) = 40$ and $N(1) = 80$,\
> find the general solution, then $k$ (to 4 significant figures) and
> $N(5)$.

$$\frac{dt}{dN} = \frac{1}{kN(1000 - N)} = \frac{1}{1000k}\left( \frac{1}{N} + \frac{1}{1000 - N} \right)$$

so, the exponent becomes $1000kt$

$$\frac{N}{1000 - N} = Ae^{1000kt}$$

$$N(0) = 40:\ \frac{40}{960} = A = \frac{1}{24}$$

$$N = \frac{1000}{1 + 24e^{- 1000kt}}$$

$$N(1) = 80:\ 1 + 24e^{- 1000k} = 12.5\  \Rightarrow \ e^{- 1000k} = \frac{11.5}{24}$$

$$k = - \frac{1}{1000}\ln\left( \frac{11.5}{24} \right) \approx 7.358 \times 10^{- 4}$$

$N(5) = \frac{1000}{1 + 24e^{- 5000k}}$, where
$e^{- 5000k} = \left( \frac{11.5}{24} \right)^{5} \approx 0.02526$

$$N(5) = \frac{1000}{1.6062} \approx 623$$

10. A cockroach population $P$ in a warehouse satisfies

$$\frac{dP}{dt} = 3P\left( 20 - \frac{P}{8000} \right),$$

with $t$ in days.

a.  Rewrite in the form $k_{1}P(C - P)$ or
    $k_{2}\left( 1 - \frac{P}{C} \right)$.

b.  Hence identify the carrying capacity.

c.  By using the equation of $\frac{dP}{dt}$ and **no calculus**,
    explain why the rate of increase is greatest at half the carrying
    capacity.

$$\frac{dP}{dt} = 3P\left( \frac{160\, 000 - P}{8000} \right) = \frac{3}{8000}P(160\, 000 - P)$$

The carrying capacity is $160\, 000$

the initial population is $0.10 \times 160\, 000 = 16\ 000$.

The rate of increase is greatest at half the carrying capacity:

We can explain this using the fact that
$\frac{dP}{dt} = 3P\left( 20 - \frac{P}{8000} \right)$

This is a parabola with roots at $P = 0$ and $P = 160000$

This means the rate of population change is 0 at $P = 0$ (extinct
populations can't change) and $P = carrying\ capacity$

Since $\frac{dP}{dt}$ is a negative parabola, its maximum is at the
halfway point of the roots, i.e. $P = \frac{160\, 000 + 0}{2} = 80\ 000$

11. The area $S\ \text{cm}^{2}$ occupied by a mould satisfies

$$\frac{dS}{dt} = \frac{1}{20}S(40 - S),\quad\quad S(0) = 1,$$

with $t$ in days.

a.  Show that
    $\frac{1}{S(40 - S)} = \frac{1}{40}\left( \frac{1}{S} + \frac{1}{40 - S} \right).$

$$\frac{1}{40}\left( \frac{1}{S} + \frac{1}{40 - S} \right) = \frac{1}{40} \cdot \frac{(40 - S) + S}{S(40 - S)}$$

$$= \frac{1}{40} \cdot \frac{40}{S(40 - S)}$$

$$= \frac{1}{S(40 - S)}$$

b.  Show that $S =$ $\frac{40}{1 + 39e^{- 2t}}$.

$$\frac{dt}{dS} = \frac{20}{S(40 - S)} = \frac{1}{2}\left( \frac{1}{S} + \frac{1}{40 - S} \right)$$

$$t = \frac{1}{2}\ln\left| \frac{S}{40 - S} \right| + D\  \Rightarrow \ \frac{S}{40 - S} = Ae^{2t}$$

$$S(0) = 1:\ \frac{1}{39} = A$$

$$S = \frac{40}{1 + 39e^{- 2t}}$$

c.  State the limiting area.

As $t \rightarrow \infty$, $e^{- 2t} \rightarrow 0$, so the limiting
area is $40\ \text{cm}^{2}$.

d.  Find the time at which the area is increasing most rapidly.

$\frac{dS}{dt} = \frac{1}{20}S(40 - S)$ is a quadratic in $S$, greatest
at $S = 20$ (half the carrying capacity). Then:

$$20 = \frac{40}{1 + 39e^{- 2t}}\ $$

$$1 + 39e^{- 2t} = 2\ $$

$$e^{2t} = 39$$

$$\ t = \frac{1}{2}\ln 39 \approx 1.83\ days$$

12. The height of a tree after $t$ years is given by $\frac{dQ}{dt}$
    $= \ 0.03Q(45\  - \ Q)$.\
    The tree is 0.3 m high when it is planted.

    a.  Evaluate $a$ and $b$ if $\frac{1}{Q(45\  - \ Q)}$ =
        $\frac{a}{Q}$ + $\frac{b}{45\  - \ Q}.$

    b.  Solve the differential equation to find the formula for the
        height of the tree.

    c.  Find its height after:

        i.  2 years **ii** 8 years

    d.  What is its ultimate height?

a\) Multiply both sides by $Q(45\  - \ Q):$

$$1\  = \ a(45\  - \ Q) + \ bQ$$

$$Sub\ Q\  = \ 0:\ \ \ \ 1\  = \ 45a\ \ \ \  \rightarrow \ \ \ \ a\  = \frac{1}{45}$$

$$Sub\ Q\  = \ 45:\ \ \ 1\  = \ 45b\ \ \ \  \rightarrow \ \ \ \ b\  = \frac{1}{45}$$

$$\therefore\frac{1}{Q(45 - Q)} = \frac{1}{45}\left( \frac{1}{Q} + \frac{1}{45 - Q} \right)$$

b\) Separate variables:

$$\frac{1}{Q(45\  - \ Q)}dQ\  = \ 0.03\ dt$$

Using partial fractions from (a):

$$\frac{1}{45}\left( \frac{1}{Q} + \frac{1}{45\  - \ Q} \right)dQ\  = \ 0.03\ dt$$

Integrate both sides:

$$\frac{1}{45}\left( \ln|Q| - \ \ln|45\  - \ Q| \right) = \ 0.03t\  + \ C$$

$$\ln\left| \frac{Q}{45\  - \ Q} \right| = \ 1.35t\  + \ C$$

$$\frac{Q}{45\  - \ Q} = \ Ae^{1.35t}$$

Sub initial condition Q = 0.3 when t = 0:

$$\frac{0.3}{44.7} = \ A\ \ \ \  \rightarrow \ \ \ \ A\  = \frac{1}{149}$$

$$So:\frac{Q}{45\  - \ Q} = \ \left( \frac{1}{149} \right)e^{1.35t}$$

$$149Q\  = \ (45\  - \ Q)e^{1.35t}$$

$$149Q\  + \ Qe^{1.35t} = \ 45e^{1.35t}$$

$$Q\left( 149\  + \ e^{1.35t} \right) = \ 45e^{1.35t}$$

$$Q\  = \frac{45e^{1.35t}}{149\  + \ e^{1.35t}}$$

$$Divide\ numerator\ and\ denominator\ by\ e^{1.35t}:$$

$$Q\  = \frac{45}{1\  + \ 149e^{- 1.35t}}$$

c\) i. Sub $t\  = \ 2$:

$$Q\  = \frac{45}{1\  + \ 149e^{- 2.7}} \approx \ 4.09\ m$$

ii\. Sub t = 8:

$$Q\  = \frac{45}{1\  + \ 149e^{- 10.8}} \approx \ 44.86\ m$$

d\) As $t\  \rightarrow \infty,\ e^{- 1.35t} \rightarrow \ 0$, so
$Q\  \rightarrow \ 45.$

Ultimate height = 45 m.

13. Biologists model a fish population $y$ (in hundreds) using:

$$\frac{dy}{dt} = \  - 2\  + \frac{1}{24}y(16\  - \ y)$$

where $t$ is years after the next harvest. The December count indicates
500 fish.

a.  What is the significance of the $- 2$ in the equation?

b.  Show the DE can be rewritten as $\frac{dy}{dt}$ $=$ $\  -$
    $\frac{1}{24}$ $(y\  - \ 4)(y\  - \ 12),$ and write down the initial
    condition assuming the harvest goes ahead.

c.  Show that $\frac{24}{(y\  - \ 4)(y\  - \ 12)}$ $=$
    $\frac{3}{y\  - \ 12}$ $-$ $\frac{3}{y\  - \ 4}.$

d.  Hence solve the IVP in part **b**.

e.  According to this model, when will the fish die out?

a\) The −2 represents the harvest rate (200 fish per year expressed in
hundreds).

$$b)\frac{dy}{dt} = \  - 2\  + \ \frac{1}{24}y(16\  - \ y)$$

$$= \ \frac{1}{24}\left( - 48\  + \ y(16\  - \ y) \right)$$

$$= \  - \frac{1}{24}\left( y^{2} - \ 16y\  + \ 48 \right)$$

$$= \  - \frac{1}{24}(y\  - \ 4)(y\  - \ 12)$$

Initial condition: the harvest reduces the December count of 500 to 300,
so $y(0)\  = \ 3.$

$$c)\frac{24}{(y\  - \ 4)(y\  - \ 12)} = \frac{A}{y\  - \ 4} + \frac{B}{y\  - \ 12}$$

$$24\  = \ A(y\  - \ 12) + \ B(y\  - \ 4)$$

$$y\  = \ 12:\ \ \ B\  = \frac{24}{8} = \ 3$$

$$y\  = \ 4:\ \ \ A\  = \frac{24}{- 8} = \  - 3$$

$$\frac{24}{(y\  - \ 4)(y\  - \ 12)} = \frac{3}{y\  - \ 12} - \frac{3}{y\  - \ 4}$$

$$d)\ \frac{dt}{dy} = - \frac{24}{(y - 4)(y - 12)}$$

$$\frac{dt}{dy} = - \left( \frac{3}{y - 12} - \frac{3}{y - 4} \right)$$

$$- t + C = 3\ \ln|y\  - \ 12|\  - \ 3\ \ln|y\  - \ 4|\ $$

$$3\ \ln\left| \frac{y\  - \ 12}{y\  - \ 4} \right| = \  - t\  + \ C$$

$$\ln\left| \frac{y\  - \ 12}{y\  - \ 4} \right| = \  - \frac{t}{3} + \ C$$

$$\frac{y\  - \ 12}{y\  - \ 4} = \ Ae^{- \frac{t}{3}}$$

$$Apply\ y(0) = \ 3:\ \ \frac{3\  - \ 12}{3\  - \ 4} = \ A;\ \ A\  = \ 9$$

$$\frac{y\  - \ 12}{y\  - \ 4} = \ 9e^{- \frac{t}{3}}$$

$$y\  - \ 12\  = \ 9e^{\left( - \frac{t}{3} \right)(y\  - \ 4)}$$

$$y\left( 1\  - \ 9e^{- \frac{t}{3}} \right) = \ 12\  - \ 36e^{- \frac{t}{3}}$$

$$y\  = \frac{12\  - \ 36e^{- \frac{t}{3}}}{1\  - \ 9e^{- \frac{t}{3}}} = \frac{12\left( 1\  - \ 3e^{- \frac{t}{3}} \right)}{1\  - \ 9e^{- \frac{t}{3}}}$$

$$e)\ y\  = \ 0\ when\ 1\  - \ 3e^{- \frac{t}{3}} = \ 0$$

$$e^{- \frac{t}{3}} = \frac{1}{3},\ \ \ \ so\ t\  = \ 3\ \ln\ 3\  \approx \ 3.3\ years$$

14. 40 animals are released on an island with carrying capacity 1000.
    The population N satisfies:

$\frac{dN}{dt}$ $= kN(1000\  - \ N)$, for some constant $k$.

a.  Show that $\frac{1000}{N(1000\  - \ N)}$ $=$ $\frac{1}{N}$ $+$
    $\frac{1}{1000\  - \ N}.$

b.  Use part **a** to find the general solution.

c.  Determine the arbitrary constant using $N(0)\  = \ 40$, then
    simplify.

d.  Given the population after 1 year was 80, find $k$ correct to four
    significant figures.

e.  What will the population be after 5 years, to the nearest whole
    number?

$$a)\frac{1}{N} + \frac{1}{1000\  - \ N} = \frac{1000\  - \ N\  + \ N}{N(1000\  - \ N)}$$

$$= \frac{1000}{N(1000\  - \ N)}$$

$$b)\frac{dN}{N(1000\  - \ N)} = \ k\ dt$$

$$\frac{1}{1000}\left( \frac{1}{N} + \frac{1}{1000\  - \ N} \right)dN\  = \ k\ dt$$

$$Integrate:\frac{1}{1000}\left( \ln|N| - \ \ln|1000\  - \ N| \right) = \ kt\  + \ C$$

$$\ln\left| \frac{N}{1000\  - \ N} \right| = \ 1000kt\  + \ C$$

$$\frac{N}{1000\  - \ N} = \ Ae^{1000kt}$$

Rearranging:

$$N\  = \frac{1000}{1\  + \ Be^{- 1000kt}}\ $$

$$c)\ N(0) = \ 40:\ 40\  = \frac{1000}{1\  + \ B}$$

$$1\  + \ B\  = \ 25$$

$$B\  = \ 24$$

$$N\  = \frac{1000}{1\  + \ 24e^{- 1000kt}}$$

$$d)\ N(1) = \ 80:\frac{1000}{1\  + \ 24e^{- 1000k}} = \ 80$$

$$1\  + \ 24e^{- 1000k} = \ 12.5$$

$$e^{- 1000k} = \frac{11.5}{24}$$

$$- 1000k\  = \ ln\left( \frac{11.5}{24} \right)$$

$$k\  = \  - \frac{1}{1000}\ln\left( \frac{11.5}{24} \right) \approx \ 7.357\  \times \ 10^{- 4}$$

$$e)\ N(5) = \frac{1000}{1\  + \ 24e^{- 5000k}} \approx \ 623$$

15. Pierre-François Verhulst (1838) modelled US population growth using:

$Ṅ\  = \ kN(P\  - \ N),$ for some positive constant $k$,

where $N$ is population in millions and $t$ is years after 1850.

a.  Show that $\frac{P}{N(P\  - \ N)}$ $=$ $\frac{1}{N}$ $+$
    $\frac{1}{P\  - \ N}.$

b.  Use part **a** to find the general solution.

c.  $P\  = \ 187.5$ and $N(0)\  = \ 23.2$ (millions). Determine the
    arbitrary constant and simplify.

d.  The estimate $k\  = \ 1.6\  \times \ 10^{- 4}$ predicted 59.8
    million in 1890.\
    The actual population was 63.0 million. Calculate a new value for
    $k$.

e.  Using the revised $k$, compare the predicted population for 1930
    with the actual figure of 123.2 million.

f.  The US population in 2018 was approximately 327 million. Comment on
    this value.

$$a)\frac{1}{N} + \frac{1}{P\  - \ N} = \frac{P\  - \ N\  + \ N}{N(P\  - \ N)} = \frac{P}{N(P\  - \ N)}$$

$$b)\frac{dN}{N(P\  - \ N)} = \ k\ dt$$

$$\frac{1}{P}\left( \ln|N| - \ \ln|P\  - \ N| \right) = \ kt\  + \ C$$

$$\frac{N}{P\  - \ N} = \ Ae^{kPt}$$

$$N\  = \frac{P}{1\  + \ Be^{- kPt}}$$

$$c)\ P\  = \ 187.5,\ N(0) = \ 23.2:$$

$$23.2\  = \frac{187.5}{1\  + \ B}$$

$$1\  + \ B\  = \frac{187.5}{23.2}$$

$$B\  = \frac{164.3}{23.2}$$

$$N\  = \frac{23.2\  \times \ 187.5}{23.2\  + \ 164.3e^{- 187.5kt}}$$

$$d)\ t\  = \ 40\ (1890\ is\ 40\ years\ after\ 1850),\ N\  = \ 63.0:$$

$$63.0\left( 23.2\  + \ 164.3e^{- 7500k} \right) = \ 23.2\  \times \ 187.5$$

$$23.2\  + \ 164.3e^{- 7500k} = \ 69.05$$

$$e^{- 7500k} = \frac{45.85}{164.3}$$

$$k\  = \  - \frac{1}{7500}\ln\left( \frac{45.85}{164.3} \right) \approx \ 1.702\  \times \ 10^{- 4}$$

$$e)\ t\  = \ 80\ (1930):\ N(80) \approx \ 120.9\ million$$

The model predicts reasonably close but slightly underestimates.

$f)$ 327 million far exceeds $P\  = \ 187.5$ million (the assumed
carrying capacity).

The assumed carrying capacity was too low.

16. A lake is stocked with 600 fish; the carrying capacity is 12 000.
    The population N satisfies

$$\frac{dN}{dt} = kN(12\, 000 - N),$$

with $t$ in years. You may use
$\frac{12\, 000}{N(12\, 000 - N)} = \frac{1}{N} + \frac{1}{12\, 000 - N}$.

a.  Show that $N =$ $\frac{12\, 000}{1 + 19e^{- 12\, 000kt}}$.

b.  The population doubled during the first year. Find $k$.

c.  Find, to the nearest month, how long it takes the population to
    reach 9000.

$$The\ alternate\ notation\ gives\ the\ scaling\frac{dt}{dN} = \frac{1}{12\, 000k}\left( \frac{1}{N} + \frac{1}{12\, 000 - N} \right),$$

$$\ so\ the\ exponent\ is\ 12\, 000kt.$$

$$\frac{N}{12\, 000 - N} = Ae^{12\, 000kt};\ \ N(0) = 600:\frac{600}{11\, 400} = A = \frac{1}{19}$$

$$19N = (12\, 000 - N)e^{12\, 000kt}$$

$$\ N = \frac{12\, 000}{1 + 19e^{- 12\, 000kt}}$$

$$Doubling\ gives\ N(1) = 1200:$$

$$1 + 19e^{- 12\, 000k} = \frac{12\, 000}{1200} = 10$$

$$\ e^{- 12\, 000k} = \frac{9}{19}\ $$

$$k = \frac{1}{12\, 000}\ln\frac{19}{9}$$

$$Set\ N = 9000:$$

$$1 + 19e^{- 12\, 000kt} = \frac{12\, 000}{9000} = \frac{4}{3}\ $$

$$e^{- 12\, 000kt} = \frac{1}{57}$$

$$12\, 000kt = \ln 57$$

$$Since\ 12\, 000k = \ln\frac{19}{9}:$$

$$t = \frac{ln57}{\ln\frac{19}{9}} \approx 5.411\ \text{years} \approx 65\ months$$

# Further Logistic Modelling

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| The population of kangaroos, $P$ **(in thousands)**, in bushland  |
| satisfies                                                         |
|                                                                   |
| $$\frac{dP}{dt} = \ 0.1P\left( 1\  - \frac{P}{C} \right)$$        |
|                                                                   |
| where $t$ is the number of years after 2000 and $C$ is the        |
| carrying capacity.                                                |
|                                                                   |
| In 2000 there were 15 000 kangaroos. By 2020 there were 60 000    |
| kangaroos.                                                        |
|                                                                   |
| Use the fact that $\frac{C}{P(C - P)}$ $=$ $\frac{1}{P}$ $+$      |
| $\frac{1}{C - P}$ to show the carrying capacity is approx. 113    |
| 000.                                                              |
|                                                                   |
| Follow these steps:                                               |
|                                                                   |
| 1\. Show that the general solution is                             |
| $\frac{P}{C - P} = Ae^{\frac{t}{10}}$                             |
|                                                                   |
| 2\. Use the two data points to solve simultaneously for $C$.      |
+-------------------------------------------------------------------+

Foundation

1.  A town's population P satisfies

$$\frac{dP}{dt} = 0.04\, P\left( \frac{C - P}{C} \right),$$

> where $t$ is years after 2005 and $C$ is the carrying capacity.\
> In 2005 the population was 40 000; in 2025 it was 70 000.
>
> Use $\frac{C}{P(C - P)} = \frac{1}{P} + \frac{1}{C - P}$ to find the
> carrying capacity, to the nearest thousand.

General solution:

$$\frac{C}{P(C - P)}\, dP = 0.04\, dt\ $$

$$\frac{P}{C - P} = Ae^{0.04t}$$

Two data points:

$$t = 0,\ P = 40\, 000:\quad\frac{40\, 000}{C - 40\, 000} = A$$

$$t = 20,\ P = 70\, 000:\quad\frac{70\, 000}{C - 70\, 000} = Ae^{0.8}$$

Divide to eliminate A:

$$\frac{70\, 000(C - 40\, 000)}{40\, 000(C - 70\, 000)} = e^{0.8}$$

$$\frac{7(C - 40\, 000)}{4(C - 70\, 000)} = e^{0.8}$$

Solve for C (using $e^{0.8} \approx 2.2255$):

$$7(C - 40\, 000) = 4e^{0.8}(C - 70\, 000)$$

$$1.9022\, C \approx 343\, 151$$

$$C \approx 180\ 000$$

2.  The deer population $P$ in a reserve satisfies

$$\frac{dP}{dt} = 0.1\, P\left( 1 - \frac{P}{C} \right),$$

where t is years after 1990. In 1990 there were 200 000 deer; in 2010
there were 500 000.\
Use $\frac{C}{P(C - P)} = \frac{1}{P} + \frac{1}{C - P}$ to find the
carrying capacity, to the nearest thousand.

$$\frac{P}{C - P} = Ae^{0.1t}$$

$$t = 0,\ P = 200\, 000:\frac{200\, 000}{C - 200\, 000} = A;\ \ $$

$$t = 20,\ P = 500\, 000:\frac{500\, 000}{C - 500\, 000} = Ae^{2}$$

Divide:

$$\frac{5(C - 200\, 000)}{2(C - 500\, 000)} = e^{2}$$

Solve (using $e^{2} \approx 7.389$):

$$5(C - 200\, 000) = 2e^{2}(C - 500\, 000)$$

$$\ 9.778\, C \approx 6\, 389\, 056$$

$$C \approx 653\ 000$$

3.  A kangaroo population is modelled by

$$K = \frac{12\, 000}{4 + e^{- \frac{t}{4}}}$$

where $t$ is years from today.

a.  Show that $K$ satisfies
    $\frac{dK}{dt} = \frac{1}{4}K\left( 1 - \frac{K}{3000} \right)$.

b.  What is the population today?

c.  What eventual population does the model predict?

d.  What is the annual percentage growth rate today?

$$K = 1200\left( 4 + e^{- \frac{t}{4}} \right)^{- 1}$$

$$\frac{dK}{dt} = 1200\left( 4 + e^{- \frac{t}{4}} \right)^{- 2} \cdot - \frac{1}{4}e^{\frac{t}{4}}\ $$

Show it satisfies DE by substitution:

$$LHS = - \frac{300e^{\frac{t}{4}}}{\left( 4 + e^{- \frac{t}{4}} \right)^{2}}$$

$$RHS = \frac{1}{4}\left( \frac{12\, 000}{4 + e^{- \frac{t}{4}}} \right)\left( 1 - \frac{\frac{12\, 000}{4 + e^{- \frac{t}{4}}}}{3000} \right)$$

$$= \frac{1}{4}\left( \frac{12\, 000}{4 + e^{- \frac{t}{4}}} \right)\left( 1 - \frac{4}{4 + e^{- \frac{t}{4}}} \right)$$

$$= \frac{1}{4}\left( \frac{12\, 000}{4 + e^{- \frac{t}{4}}} \right)\left( \frac{4 + e^{- \frac{t}{4}} - 4}{4 + e^{- \frac{t}{4}}} \right)$$

$$= \frac{1}{4}\left( \frac{12\, 000}{4 + e^{- \frac{t}{4}}} \right)\left( \frac{e^{- \frac{t}{4}}}{4 + e^{- \frac{t}{4}}} \right)$$

$$= - \frac{300e^{\frac{t}{4}}}{\left( 4 + e^{- \frac{t}{4}} \right)^{2}}$$

$$= LHS$$

$$t = 0:\ K = \frac{12\, 000}{4 + 1} = 2400$$

$$As\ t \rightarrow \infty,\ e^{- \frac{t}{4}} \rightarrow 0,\ K \rightarrow \frac{12\, 000}{4} = 3000$$

$$At\ t = 0:\frac{dK}{dt} = \frac{1}{4(2400)\left( 1 - \frac{2400}{3000} \right)} = 120.\ $$

$$Rate\  = \frac{120}{2400} = 5\%\ per\ year.$$

4.  A yabby population is modelled by

$$y = \frac{300}{1 + 14e^{- 0.4t}},$$

where $t$ is months after release.

a.  Find the initial population and the limiting population.

b.  Find the population when it is growing fastest.

c.  Find the exact time at which it is growing fastest.

$$y(0) = \frac{300}{1 + 14} = 20.\ As\ t \rightarrow \infty,\ y \rightarrow 300.\ $$

$$So\ the\ population\ runs\ from\ 20\ up\ to\ a\ limit\ of\ 300.$$

$$For\ a\ logistic\ model\ the\ growth\ rate\ is\ greatest\ at\ half\ the\ limiting\ population:\ y = \frac{300}{2} = 150.$$

$$Set\ y = 150:$$

$$150 = \frac{300}{1 + 14e^{- 0.4t}}$$

$$\ 1 + 14e^{- 0.4t} = 2$$

$$\ e^{- 0.4t} = \frac{1}{14}$$

$$- 0.4t = \ln\frac{1}{14}$$

$$\ t = \frac{5}{2}\ln 14\ \text{months }( \approx 6.6)\ $$

5.  Kosciusko National Park has feral horses called brumbies.\
    Brumbies are considered pests as they damage the soil and
    waterways.\
    Their natural population $P$ satisfies
    $\frac{dP}{dt} = 0.5\, P\left( 1 - \frac{P}{20\, 000} \right)$, with
    $t$ in years.\
    To control it, a culling programme aims to remove 10% of the
    population each year, giving

$$\frac{dP}{dt} = 0.5\, P\left( 1 - \frac{P}{20\, 000} \right) - 0.1P$$

Populations above 15 000 damage the habitat.\
Determine whether the culling programme would be effective in preventing
this damage.

Find the non-zero equilibrium (where $\frac{dP}{dt} = 0$):

$$P\left\lbrack 0.5\left( 1 - \frac{P}{20\, 000} \right) - 0.1 \right\rbrack = 0$$

For $P \neq 0:$

$$0.5\left( 1 - \frac{P}{20\, 000} \right) = 0.1\ $$

$$1 - \frac{P}{20\, 000} = 0.2$$

$$\ P = 16\, 000$$

The population settles at 16 000.

Since 16 000\>15 000, the culling programme is not ambitious enough to
prevent damage to the habitat.
