  -------------------------------------------------------------------
  Mathematics Advanced Year 12
  -------------------------------------------------------------------
  **Introduction to\
  Integral Calculus**

  -------------------------------------------------------------------

+------------------------------------------+------------------------------------------+------------------------------------------+
| **Book 1**                               | The Fundamental Theorem of Calculus      | Version: 260409                          |
|                                          |                                          |                                          |
|                                          |                                          | Feedback:\                               |
|                                          |                                          | https://MrDingMaths.com                  |
+==========================================+==========================================+==========================================+
| **Contents**                                                                                                                   |
|                                                                                                                                |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                                                                   |
|                                                                                                                                |
| [Primitive Functions [3](#primitive-functions)](#primitive-functions)                                                          |
|                                                                                                                                |
| [Primitives of Power Functions [6](#primitives-of-power-functions)](#primitives-of-power-functions)                            |
|                                                                                                                                |
| [Finding the Specific Primitive using Initial Conditions                                                                       |
| [9](#finding-the-specific-primitive-using-initial-conditions)](#finding-the-specific-primitive-using-initial-conditions)       |
|                                                                                                                                |
| [Area Under a Curve [10](#_Toc222132992)](#_Toc222132992)                                                                      |
|                                                                                                                                |
| [The Fundamental Theorem of Calculus [13](#_Toc222132993)](#_Toc222132993)                                                     |
+--------------------------------------------------------------------------------------------------------------------------------+

# Syllabus Content

**MAV-12-05** solves problems involving indefinite and definite
integrals

**Primitive functions**

- Define a primitive of a function $f(x)$ as a function $F(x)$ whose
  derivative $F'(x) = f(x)$ and recognise the process of finding the
  primitive as the reverse of differentiation

- Recognise that a function whose derivative is everywhere zero is a
  constant function

- Prove by differentiation that a primitive of $f(x) = x^{n}$ is
  $F(x) = \frac{x^{n + 1}}{n + 1}$, for all real $n \neq - 1$

- Prove by differentiation that if $F(x)$ and $G(x)$ are primitives of
  $f(x)$ and $g(x)$, and $k$ is a constant, then $F(x) + G(x)$ is a
  primitive of $f(x) + g(x)$, and $kF(x)$ is a primitive of $kf(x)$

- Recognise that primitives of a function $f(x)$ are not unique, and
  that any two primitives of $f(x)$ differ by a constant, so that if
  $F(x)$ is a primitive of $f(x)$, the general primitive of $f(x)$ is
  $F(x) + C$, for some constant $C$

- Determine the primitive of a given function $f(x)$, where $f(x)$ is a
  sum of functions of the form $kx^{n}$ for all real $n \neq - 1$

- Determine the primitive function for functions of the form
  $f(x) = (ax + b)^{n}$, for all real $n \neq - 1$, where $a$ and $b$
  are constants

- Use algebraic manipulation to express given functions in forms
  suitable for determining primitive functions

- Determine $f(x)$, given $f'(x)$ and an initial condition $f(a) = b$
  where $a$ and $b$ are constants

**The definite integral**

- Examine for a function $f(x)$, which indicates the rate of change of a
  quantity, the meaning of $\sum_{a}^{b}{f(x)\Delta x}$, where the
  interval $a \leq x \leq b$ is divided into subintervals of length
  $\Delta x$, and describe $\sum_{a}^{b}{f(x)\Delta x}$ as an estimate
  of the total change in that quantity over the interval
  $a \leq x \leq b$

- Consider the definite integral as
  $\int_{a}^{b}{f(x)}dx = \lim_{\Delta x \rightarrow 0}{\sum_{a}^{b}{f(x)\Delta x}}$,
  noting that this implies that the result of a definite integral will
  be negative when $f(x) \leq 0$ throughout the interval
  $a \leq x \leq b$

- Define informally that a function is continuous on the interval
  $a \leq x \leq b$ if it can be drawn between the two endpoints of the
  interval without taking the pen off the paper

- Graph the region between the continuous function $y = f(x)$ and the
  $x$-axis, where $f(x) \geq 0$ on the interval $a \leq x \leq b$

- Use a graphing application to compare different methods of
  approximating the area, $A$, of the region between the continuous
  function $y = f(x)$ and the $x$-axis, where $f(x) \geq 0$ on the
  interval $a \leq x \leq b$, by summing the areas of trapezia or
  rectangles each of width $\Delta x = \frac{b\  - \ a}{n}$ and
  approximate height $f(x)$ for any $x$ lying in its base, and observe
  the effect on the precision of the approximation of $A$ as the number
  $n$ of subintervals of $a \leq x \leq b$ increases, that is as
  $\Delta x \rightarrow 0$

- Evaluate the definite integral $\int_{a}^{b}f(x)dx$ by calculating
  areas using geometrical formulas, where the shape of $f(x)$ allows
  such calculations, in cases where $f(x) \geq 0\$throughout
  $a \leq x \leq b$, $f(x) \leq 0\$throughout $a \leq x \leq b$ or where
  $f(x)$ changes sign in the interval $a \leq x \leq b$

**The fundamental theorem of calculus**

- Consider the function defined by $A(x) = \int_{a}^{x}{f(t)d}t$ and use
  a graphing application to recognise that $A(x)$ is a primitive of
  $f(x)$

- Recognise the Fundamental Theorem of Calculus as
  $\int_{a}^{b}f(x)dx = \left\lbrack F(x) \right\rbrack\binom{b}{a} = F(b) - F(a)$
  for a continuous function $f$ on the interval $a \leq x \leq b$ where
  $F(x)$ is any primitive of $f(x)$

# Primitive Functions

+---------------------------------------------------------------------------------+
| - **Primitive Function** $\mathbf{F}\left( \mathbf{x} \right)$                  |
+=========================+=============================+=========================+
| A **primitive function**, or **antiderivative,** of $f(x)$ is a function $F(x)$ |
| such that:                                                                      |
|                                                                                 |
| $$F'(x) = f(x)$$                                                                |
|                                                                                 |
| Finding a primitive is the **reverse of differentiation**.                      |
|                                                                                 |
| Examples:                                                                       |
+-------------------------+-----------------------------+-------------------------+
| $${f(x) = 4x^{3}        | $${f(x) = x^{2}             | $${f(x) = \sin x        |
| }{F(x) = x^{4}}$$       | }{F(x) = \frac{x^{3}}{3}}$$ | }{F(x) = - \cos x}$$    |
+-------------------------+-----------------------------+-------------------------+
| - The booklet examples will use $f(x)$ as the primitive and $f'(x)$ as the      |
|   derivative until you learn about the definite integral.                       |
+---------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Power Rule for Primitives**                                   |
+===================================================================+
| The power rule for primitives:                                    |
|                                                                   |
| If $f'(x) = x^{n}$, then $f(x) =$ $\frac{x^{n + 1}}{n + 1}$       |
|                                                                   |
| Add 1 to the power, then divide by the new power.                 |
|                                                                   |
| - You cannot use this rule when $n = - 1$                         |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------+
| - **Identify** a possible primitive function                                             |
+============================+============================+================================+
| Find a possible primitive function $f(x)$ given $f'(x)$:                                 |
+----------------------------+----------------------------+--------------------------------+
| $$f'(x) = x^{3}$$          | $$f'(x) = x^{4}$$          | $$f'(x) = x^{- 7}$$            |
|                            |                            |                                |
| $$f(x) = \frac{x^{4}}{4}$$ | $$f(x) = \frac{x^{5}}{5}$$ | $$f(x) = - \frac{x^{- 6}}{6}$$ |
+----------------------------+----------------------------+--------------------------------+
| Find a possible primitive function $f(x)$ given $f'(x)$:                                 |
+----------------------------+----------------------------+--------------------------------+
| a.  $f'(x) = x^{6}$        | b.  $f'(x) = x^{57}$       | c.  $f'(x) = x^{- 2}$          |
+----------------------------+----------------------------+--------------------------------+
| d.  $f'(x) = 2$            | e.  $f'(x) = x^{- 1}$      | f.  $f'(x) = 0$                |
+----------------------------+----------------------------+--------------------------------+
| - **Constant of Integration**                                                            |
+------------------------------------------------------------------------------------------+
| When we differentiate, constants disappear.                                              |
|                                                                                          |
| For example: For $f(x) = x^{3} + 10$, $f'(x) = 3x^{2}$                                   |
|                                                                                          |
| For $f(x) = x^{3} - 23$, $f'(x) = 3x^{2}$                                                |
|                                                                                          |
| Therefore, when finding primitives, we must add a **constant of integration**,           |
| $\mathbf{+ C}$, to represent all possible primitives.                                    |
|                                                                                          |
| $f(x) + C$ is called the **general primitive**. Usually when we are asked to find the    |
| primitive of a function, we are finding the general primitive.                           |
|                                                                                          |
| When $f'(x) = 0$, the primitive is $f(x) = C$                                            |
+------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------+
| - **Identify** the general primitive function                               |
+=========================+=========================+=========================+
| a.  $f'(x) = x^{3}$     | b.  $f'(x) = 0$         | c.  $f'(x) = x^{9}$     |
|                         |                         |                         |
| $f(x) =$                |                         |                         |
+-------------------------+-------------------------+-------------------------+
| d.  $f'(x) = x^{- 12}$  | e.  $f'(x) = x^{15}$    | f.  $f'(x) = x$         |
+-------------------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| - **Primitives of Sums and Constant Multiples**                       |
+===================================+===================================+
| The primitive of $f'(x) + g'(x)$  | The primitive of $kf'(x),\$where  |
| is:                               | $k\mathbb{\in R}$, is:            |
|                                   |                                   |
| $f(x) + g(x)$                     | $$kf(x)$$                         |
|                                   |                                   |
| Find the primitives separately.   | Multiply the primitive by the     |
|                                   | factor.                           |
+-----------------------------------+-----------------------------------+

+--------------------------------------------------------------------------------------+
| - **Example** Find the general primitive of a simple power function                  |
+==================================================+===================================+
| Find the general primitives of the following:                                        |
+--------------------------------------------------+-----------------------------------+
| $$f'(x) = x^{3} + x$$                            | $$f'(x) = 9x^{4}$$                |
|                                                  |                                   |
| $$f(x) = \frac{x^{4}}{4} + \frac{x^{2}}{2} + C$$ | $$f(x) = \frac{9x^{5}}{5} + C$$   |
+--------------------------------------------------+-----------------------------------+

+------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                    |
+======================================================+===================================+
| Find the general primitives of the following:                                            |
+------------------------------------------------------+-----------------------------------+
| a.  $f'(x) = x^{2} + x + 1$                          | b.  $f'(x) = 5x^{3} + 7$          |
|                                                      |                                   |
| $$f(x) = \frac{x^{3}}{3} + \frac{x^{2}}{2} + x + C$$ | $$\frac{5x^{4}}{4} + 7x + C$$     |
+------------------------------------------------------+-----------------------------------+
| c.  $f'(x) =$ $\frac{1}{x^{2}}$                      | d.  $f'(x) = \sqrt{x}$            |
|                                                      |                                   |
| $$- \frac{1}{x} + C$$                                | $$\frac{2\sqrt{x^{3}}}{3} + C$$   |
+------------------------------------------------------+-----------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  A ..................... of $f(x)$ is a function $F(x)$ such   |
|     that $F'(x) = f(x)$.                                          |
|                                                                   |
| 2.  When finding the general primitive, we must add ............  |
|     because constants disappear when we differentiate.            |
|                                                                   |
| 3.  The primitive of $x^{n}$ is .....................             |
|                                                                   |
| 4.  The primitive of $kf(x)$ is ..................                |
|                                                                   |
| 5.  The primitive of $f(x) + g(x)$ is ........................    |
+-------------------------------------------------------------------+

Foundation

1.  Find the primitive of each function.

+-----------------------------+-----------------------------+-----------------------------+----------------------------+
| a.  $x⁶$                    | b.  $x³$                    | c.  $x¹⁰\$                  | d.  $3x$                   |
|                             |                             |                             |                            |
| $$\frac{x^{7}}{7} + \ C\ $$ | $$\frac{x^{4}}{4} + \ C\ $$ | $$\frac{x^{11}}{11} + \ C$$ | $$\frac{3x^{2}}{2} + \ C$$ |
+=============================+=============================+=============================+============================+
| e.  $5$                     | f.  $5x^{9}$                | g.  $21x⁶$                  | h.  $0$                    |
|                             |                             |                             |                            |
| $$5x\  + \ C\ $$            | $$\frac{x^{10}}{2} + \ C$$  | $$3x⁷\  + \ C$$             | $$C$$                      |
+-----------------------------+-----------------------------+-----------------------------+----------------------------+

2.  Find the primitive of each function.

+---------------------------------------------------+------------------------------------+-----------------------------------------------+
| a.  $x²\  + \ x⁴\$                                | b.  $4x³\  - \ 5x⁴\$               | c.  $2x²\  + \ 5x⁷$                           |
|                                                   |                                    |                                               |
| $\frac{x^{3}}{3} + \frac{x^{5}}{5} + \ C$         | $x^{4} - \ x^{5} + \ C$            | $$\frac{2x^{3}}{3} + \frac{5x^{8}}{8} + \ C$$ |
+===================================================+====================================+===============================================+
| d.  $x²\  - \ x\  + \ 1$                          | e.  $3\  - \ 4x\  + \ 16x⁷\$       | f.  $3x²\  - \ 4x³\  - \ 5x⁴$                 |
|                                                   |                                    |                                               |
| $\frac{x^{3}}{3} - \frac{x^{2}}{2} + \ x\  + \ C$ | $3x\  - \ 2x^{2} + \ 2x^{8} + \ C$ | $$x^{3} - \ x^{4} - \ x^{5} + \ C$$           |
+---------------------------------------------------+------------------------------------+-----------------------------------------------+

3.  Find the primitive of each function after expanding.

+----------------------------------------------+------------------------------------------------------+----------------------------------------------------------------+
| a.  $x(x\  - \ 3)$                           | b.  $(x\  + \ 1)(x\  - \ 2)$                         | c.  $(3x\  - \ 1)(x\  + \ 4)$                                  |
|                                              |                                                      |                                                                |
| $$\frac{x^{3}}{3} - \frac{3x^{2}}{2} + \ C$$ | $$\frac{x^{3}}{3} - \frac{x^{2}}{2} - \ 2x\  + \ C$$ | $$x^{3} + \frac{11x^{2}}{2} - \ 4x\  + \ C$$                   |
+==============================================+======================================================+================================================================+
| d.  $x²(5x³\  - \ 4x)\$                      | e.  $2x³(4x⁴\  + \ 1)\$                              | f.  $(x\  - \ 3)(1\  + \ x²)$                                  |
|                                              |                                                      |                                                                |
| $$\frac{5x^{6}}{6} - \ x^{4} + \ C$$         | $$x^{8} + \frac{x^{4}}{2} + \ C$$                    | $$\frac{x^{2}}{2} + \frac{x^{4}}{4} - \ 3x\  - \ x^{3} + \ C$$ |
+----------------------------------------------+------------------------------------------------------+----------------------------------------------------------------+

4.  Write each function using a negative power of $x$.\
    Then find the primitive function, writing it as a fraction without a
    negative index.

+-------------------------+----------------------------+---------------------------+--------------------------------------------+
| a.  $\frac{1}{x^{2}}$   | b.  $\frac{1}{x^{3}}$      | c.  $- \frac{3}{x^{4}}$   | d.  $\frac{1}{x^{2}} - \frac{1}{x^{3}}$    |
|                         |                            |                           |                                            |
| $$- \frac{1}{x} + \ C$$ | $- \frac{1}{2x^{2}} + \ C$ | $$\frac{1}{x^{3}} + \ C$$ | $$- \frac{1}{x} + \frac{1}{2x^{2}} + \ C$$ |
+=========================+============================+===========================+============================================+

5.  Write each function using a fractional index, and hence find the
    primitive.

+------------------------------------+--------------------------+--------------------------------------+--------------------------------------+
| a.  $\sqrt{x}$                     | b.  $\frac{1}{\sqrt{x}}$ | c.  $\sqrt[3]{x}$                    | d.  $\sqrt[5]{x^{3}}$                |
|                                    |                          |                                      |                                      |
| $\frac{2x^{\frac{3}{2}}}{3} + \ C$ | $2\sqrt{x} + \ C$        | $$\frac{3x^{\frac{4}{3}}}{4} + \ C$$ | $$\frac{5x^{\frac{8}{5}}}{8} + \ C$$ |
+====================================+==========================+======================================+======================================+

6.  Express $y$ in terms of $x$.

+--------------------------------------+----------------------------------------------+------------------------------------------------+---------------------------------------------------+
| a.                                   | b.                                           | c.                                             | d.                                                |
|                                      |                                              |                                                |                                                   |
| $$\frac{dy}{dx} = \ 5x^{4} - \ 9\ $$ | $$\frac{dy}{dx} = \ x^{- 4} - \ 2x^{- 2}$$   | $$\frac{dy}{dx} = \frac{x^{3}}{5} - \ x^{2}$$  | $$\frac{dy}{dx} = \ x^{3} - \frac{2x}{3} + \ 1$$  |
|                                      |                                              |                                                |                                                   |
| $$y = x^{5} - 9x + C$$               | $$y = - \frac{1}{3x^{3}} + \frac{2}{x} + C$$ | $$y = \frac{x^{4}}{20} - \frac{x^{3}}{3} + C$$ | $$y = \frac{x^{4}}{4} - \frac{x^{2}}{3} + x + C$$ |
+======================================+==============================================+================================================+===================================================+

7.  Find the antiderivative, writing your answer with positive
    non-fractional indices.

+---------------------------------+---------------------------+----------------------------+------------------------------------------------------+
| a.  $\sqrt{x}\$                 | b.  $x^{- 3}$             | c.  $\frac{1}{x^{8}}$      | d.  $\frac{1}{\sqrt{x}} + \frac{2}{\sqrt[3]{x^{2}}}$ |
|                                 |                           |                            |                                                      |
| $$\frac{2\sqrt{x^{3}}}{3} + C$$ | $$- \frac{1}{x^{2}} + C$$ | $$- \frac{1}{7x^{7}} + C$$ | $$2\sqrt{x} + 6\sqrt[3]{x} + C$$                     |
+=================================+===========================+============================+======================================================+

# Primitives of Power Functions 

+---------------------------------------------------------------------------------------------+
| - **Investigation** Primitive of linear transformations of power functions                  |
+==============================+==============================+===============================+
| We are investigating the primitive of **linear transformations** of power functions:        |
| $(ax + b)^{n}$                                                                              |
|                                                                                             |
| Differentiate the following:                                                                |
+------------------------------+------------------------------+-------------------------------+
| a.  $f(x) = (2x + 1)^{5}$    | b.  $f(x) = (4x - 7)^{9}$    | c.  $f(x) = (3 - 2x)^{8}$     |
|                              |                              |                               |
| $f'(x) =$                    | $f'(x) =$                    | $f'(x) =$                     |
+------------------------------+------------------------------+-------------------------------+
| Look at your three derivatives.\                                                            |
| In each case, what two numbers multiplied together to give the coefficient out the front?   |
|                                                                                             |
| *We multiply by the ............... and the ..................... of* $x$*.*                |
+---------------------------------------------------------------------------------------------+
| Using your derivatives, find the primitives of:                                             |
+------------------------------+------------------------------+-------------------------------+
| a.  $f'(x) = 10(2x + 1)^{4}$ | b.  $f'(x) = 36(3x - 7)^{8}$ | c.  $f(x) = - 16(3 - 2x)^{7}$ |
|                              |                              |                               |
| $f(x) =$                     |                              |                               |
+------------------------------+------------------------------+-------------------------------+
| Look at your three primitives.\                                                             |
| In each case, what numbers do we *divide* to get the primitive?                             |
|                                                                                             |
| We divide by the .................. plus 1, and the .................. of $x$.              |
+---------------------------------------------------------------------------------------------+
| But what happens when we are missing the coefficient at the front?                          |
|                                                                                             |
| $$f'(x) = (2x + 1)^{4}$$                                                                    |
|                                                                                             |
| We need to 'give ourselves' the constant term, then divide to keep the expression the same. |
|                                                                                             |
| $${f'(x) = \frac{1}{10} \cdot 10(2x + 1)^{4}                                                |
| }{\therefore f(x) = \frac{1}{10}(2x + 1)^{5}}$$                                             |
|                                                                                             |
| Confirm this works by differentiating $f(x) =$ $\frac{1}{10}$ $(2x + 1)^{5}$.               |
+---------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Investigation** Primitive of linear transformations of power  |
|   functions                                                       |
+===================================================================+
| To find the primitive of $(ax + b)^{n}$, **increase the power by  |
| 1** and **divide by the product of the new power and the          |
| coefficient of** $\mathbf{x}$**.**                                |
|                                                                   |
| Find the primitive of $f'(x)\  = \ (4x\  - \ 7)⁸$                 |
+-------------------------------------------------------------------+
| Let's see why this always works.                                  |
|                                                                   |
| Let $f(x) = (ax + b)^{n + 1}$. Differentiate using the chain      |
| rule.                                                             |
|                                                                   |
| So $(ax + b)^{n + 1}$ is the primitive of $a(n + 1)(ax + b)^{n}.$ |
|                                                                   |
| If we only have $(ax + b)^{n}$ without the coefficient of         |
| $a(n + 1)$ in front, we need to compensate:                       |
|                                                                   |
| $f'(x) = (ax + b)^{n}$                                            |
|                                                                   |
| $$\ \ \ f'(x) = \frac{1}{a(n + 1)} \cdot a(n + 1)(ax + b)^{n}$$   |
|                                                                   |
| $$\therefore f(x) = \frac{1}{a(n + 1)}(ax + b)^{n + 1}$$          |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------+
| - **Primitive of Linear Transformations of Power Functions**                                 |
|   $\mathbf{f}\left( \mathbf{x} \right)\mathbf{=}\left( \mathbf{ax + b} \right)^{\mathbf{n}}$ |
+==============================================================================================+
| $${f'(x) = (ax + b)^{n}                                                                      |
| }{f(x) = \frac{(ax + b)^{n + 1}}{a(n + 1)}}$$                                                |
|                                                                                              |
| Increase the power by 1, divide by the new power and the coefficient of $x$.                 |
+----------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find the primitive of a linear transformation of a power function                                                      |
+========================================================+=============================================================================+
| Find the general primitives of the following:                                                                                        |
+--------------------------------------------------------+-----------------------------------------------------------------------------+
| $$f'(x) = (3x + 1)^{4}$$                               | $$f'(x) = \sqrt{1 - 5x}$$                                                   |
|                                                        |                                                                             |
| $$f(x) = \frac{(3x + 1)^{5}}{3(5)} + C$$               | $$\ \ \ \ \ \ \ \ \ \  = (1 - 5x)^{\frac{1}{2}}$$                           |
|                                                        |                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{(3x + 1)^{5}}{15} + C$$ | $$f(x) = \frac{(1 - 5x)^{\frac{3}{2}}}{- 5\left( \frac{3}{2} \right)} + C$$ |
|                                                        |                                                                             |
|                                                        | $$\ \ \ \ \ \ \ \ \ \  = - \frac{2\sqrt{(1 - 5x)^{3}}}{15} + C$$            |
+--------------------------------------------------------+-----------------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| Find the general primitives of the following:                         |
+-----------------------------------+-----------------------------------+
| a.  $f'(x) = (6x + 5)^{2}$        | b.  $f'(x) = (1 - 3x)^{6}$        |
+-----------------------------------+-----------------------------------+
| c.  $f'(x) =$                     | d.  $f'(x) = \sqrt{2x + 1}$       |
|     $\frac{1}{(x + 1)^{2}}$       |                                   |
+-----------------------------------+-----------------------------------+

Foundation

1.  Find the primitive of each function.

+----------------------------------------+---------------------------------------+------------------------------------------+-----------------------------------------+
| a.  $(x\  + \ 1)³$                     | b.  $(x\  - \ 2)⁵\$                   | c.  $(x\  + \ 5)²$                       | d.  $(2x\  + \ 3)⁴$                     |
|                                        |                                       |                                          |                                         |
| $$\frac{(x\  + \ 1)^{4}}{4}$$          | $$\frac{(x\  - \ 2)^{6}}{6} + \ C$$   | $$\frac{(x\  + \ 5)^{3}}{3} + \ C$$      | $$\frac{(2x\  + \ 3)^{5}}{10} + \ C$$   |
+========================================+=======================================+==========================================+=========================================+
| e.  $(3x\  - \ 4)⁶$                    | f.  $(5x\  - \ 1)³$                   | g.  $(1\  - \ x)³$                       | h.  $(1\  - \ 7x)³$                     |
|                                        |                                       |                                          |                                         |
| $$\frac{(3x\  - \ 4)^{7}}{21} + \ C$$  | $$\frac{(5x\  - \ 1)^{4}}{20} + \ C$$ | $$- \frac{(1\  - \ x)^{4}}{4} + \ C$$    | $$- \frac{(1\  - \ 7x)^{4}}{28} + \ C$$ |
+----------------------------------------+---------------------------------------+------------------------------------------+-----------------------------------------+
| i.  $\frac{1}{(x\  - \ 2)⁴}\ \$        | j.  $\frac{1}{(1\  - \ x)¹⁰}$         | k.  $5(1\  - \ x)³$                      | l.  $\frac{7}{(x\  - \ 2)^{4}}\ \$      |
|                                        |                                       |                                          |                                         |
| $$- \frac{1}{3(x\  - \ 2)^{3}} + \ C$$ | $$\frac{1}{9(1\  - \ x)^{9}} + \ C$$  | $$- \frac{{5(1\  - \ x)}^{4}}{4} + \ C$$ | $$- \frac{7}{3(x\  - \ 2)^{3}} + \ C$$  |
+----------------------------------------+---------------------------------------+------------------------------------------+-----------------------------------------+

2.  Find the primitive of each function.

+------------------------------------------------+------------------------------------------------+------------------------------------------------+------------------------------------------------+
| a.  $\sqrt{x + 1}$                             | b.  $\sqrt{x - 5}\$                            | c.  $\sqrt{1 - x}$                             | d.  $\sqrt{2x - 7}$                            |
|                                                |                                                |                                                |                                                |
| $$\frac{2(x\  + \ 1)^{\frac{3}{2}}}{3} + \ C$$ | $$\frac{2(x\  - \ 5)^{\frac{3}{2}}}{3} + \ C$$ | $- \frac{2(1\  - \ x)^{\frac{3}{2}}}{3} + \ C$ | $$\frac{(2x\  - \ 7)^{\frac{3}{2}}}{3} + \ C$$ |
+================================================+================================================+================================================+================================================+

# Finding the Specific Primitive using Initial Conditions 

+-------------------------------------------------------------------+
| - **The Specific Primitive**                                      |
+===================================================================+
| An initial condition is a known point on the curve $y = f(x).$    |
|                                                                   |
| Given $fʹ(x)$ and an initial condition $f(a)\  = \ b$, we can     |
| find the value of $C$ and determine the unique primitive function |
| $f(x).$                                                           |
|                                                                   |
| 1\. Find the general primitive:                                   |
| $f(x) = \lbrack primitive\ of\ f'(x)\rbrack\  + C$                |
|                                                                   |
| 2\. Substitute the initial condition: $f(a) = b$                  |
|                                                                   |
| 3\. Solve for $C$                                                 |
|                                                                   |
| 4\. Write the specific primitive function $f(x)$ with the value   |
| of $C$                                                            |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** find specific primitive function using initial      |
|   condition                                                       |
+===================================================================+
| Given $f'(x)\  = \ 4x³\  - \ 6x$ and $f(2) = 7$, find $f(x).$     |
+-------------------------------------------------------------------+
| 1\. $f(x) = x^{4} - 3x^{2} + C$                                   |
|                                                                   |
| 2\. $7 = (2)^{4} - 3(2)^{2} + C$                                  |
|                                                                   |
| 3\. $7 = 8 - 12 + C$                                              |
|                                                                   |
| $C = 3$                                                           |
|                                                                   |
| 4\. $f(x) = x^{4} - 3x^{2} + 3$                                   |
+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------+
| - **Guided Practice**                                                           |
+=============================================+===================================+
| a.  Given $f'(x) = 3x² + 4x$ and            | b.  Given $f'(x) = 6x² - 2x + 1$  |
|     $f(1) = 8$, find $f(x).$                |     and $f(0) = 3$, find $f(x)$.  |
|                                             |                                   |
| $$f(x) = x^{3} + 2x^{2} + 5$$               | $$f(x) = 2x³ - x² + x + 3$$       |
+---------------------------------------------+-----------------------------------+
| c.  Given that $\frac{dy}{dx}$              | d.  Given                         |
|     $= (2x + 1)^{4}$ and $y = 4$ when       |     $f'(x) = 12(x - 1)^{2},\$and  |
|     $x = - 0.5$, find $y$ as a function of  |                                   |
|     $x$.                                    | $f(1) = 0$, find $f(4)$           |
|                                             |                                   |
| $$y\  = \frac{(2x\  + \ 1)^{5}}{10} + \ 4$$ | $$f(4)\  = \ 108$$                |
+---------------------------------------------+-----------------------------------+

[]{#_Toc222132992 .anchor}Foundation

1.  Find $y$ as a function of $x$ if:

+----------------------+----------------------+-------------------------+
| a.  $y' = 2x + 3$    | b.  $y' = 9x² + 4$   | c.  $y' = 3x² - 4x + 7$ |
|     and $y = 3$ when |     and $y = 5$ when |     and                 |
|     $x = 0$          |     $x = 1$          |                         |
|                      |                      | $y = 0$ when $x = 0$    |
| $$y = x² + 3x + 3$$  | $$y = 3x³ + 4x - 2$$ |                         |
|                      |                      | $$x³ - 2x² + 7x$$       |
+======================+======================+=========================+

2.  If $\frac{dy}{dx}$ $= x^{3} - 3x^{2} + 5$ and $y = 4$ when $x = 1$,
    find an equation for $y$ in terms of $x$.

$$y\  = \frac{x^{4}}{4} - \ x^{3} + \ 5x\  - \frac{1}{4}$$

3.  If $f'(x) = 4x - 7\$and $f(2) = 5$, find an equation for $y = f(x)$.

$$f(x)\  = \ 2x²\  - \ 7x\  + \ 11$$

4.  Given $f'(x)\  = \ 3x²\  + \ 4x\  - \ 2$ and $f( - 3) = 4$, find the
    value of $f(1)$.

$$f(1)\  = \ 8$$

5.  Given that the gradient of the tangent to a curve is given by
    $\frac{dy}{dx}$ $= 2 - 6x$ and the curve passes through
    $( - 2,\ 3),$ find the equation of the curve.

$$y\  = \ 2x\  - \ 3x²\  + \ 19$$

6.  Find $y$ as a function of $x$ if $\frac{dy}{dx}$ $= \sqrt{x}$ and:

+----------------------------------------------+---------------------------------------------+
| a.  $y = 1$ when$\ x = 0$                    | b.  $y = 2$ when $x = 9$                    |
|                                              |                                             |
| $$y\  = \frac{2x^{\frac{3}{2}}}{3} + \ 1\ $$ | $$y\  = \frac{2x^{\frac{3}{2}}}{3} - \ 16$$ |
+==============================================+=============================================+

7.  a.  Find the equation of the curve through the origin whose gradient
        is $\frac{dy}{dx}$ $= 3x^{4} - x^{3} + 1$.

$$y\  = \frac{3x^{5}}{5} - \frac{x^{4}}{4} + \ x$$

b.  Find the curve passing through $(2,\ 6)$ with gradient function
    $\frac{dy}{dx}$ $= 2 + 3x² - x^{3}$.

$$y\  = \  - \frac{x^{4}}{4} + \ x^{3} + \ 2x\  - \ 2$$

c.  Find the curve through the point $\left( \frac{1}{5},\ 1 \right)$
    with gradient function $y'\  = \ (2\  - \ 5x)^{3}.$

$$y\  = \  - \frac{(2\  - \ 5x)^{4}}{20} + \frac{21}{20}$$

8.  Find $y$ if $\frac{dy}{dt}\$ $= \ 8t^{3} - \ 6t^{2} + \ 5,$ and
    $y\  = \ 4\$when $t\  = \ 0$. Hence find $y$ when $t\  = \ 2$.

30

9.  $y''\  = \ 6x\  + \ 4$. When $x\  = \ 1,\ y'\  = \ 2\$and
    $y\  = \ 4$.

    a.  Find $y'\$and use the condition $y'\  = \ 2$ when $x\  = \ 1$ to
        find the constant of integration.

$$y' = \ 3x^{2} + \ 4x\  + \ C₁$$

$$Sub\ x\  = \ 1,\ y' = \ 2:\ $$

$$2\  = \ 3\  + \ 4\  + \ C_{1},\ $$

$$so\ C_{1} = \  - 5$$

$$y' = \ 3x^{2} + \ 4x\  - \ 5$$

b.  Find $y$ and use the condition $y\  = \ 4$ when $x\  = \ 1$ to find
    the second constant.

$$y\  = \ x³\  + \ 2x²\  - \ 5x\  + \ C_{2}$$

$$Sub\ x\  = \ 1,\ y\  = \ 4:\ 4\  = \ 1\  + \ 2\  - \ 5\  + \ C_{2}\ $$

$$\ C_{2} = \ 6$$

$$y\  = \ x³\  + \ 2x²\  - \ 5x\  + \ 6$$

10. A function $f(x)$ has second derivative $f''(x) = 2x - 10$. Its
    graph passes through the point $(3,\  - 34),$ and at this point the
    tangent has a gradient of 20.

    a.  Show that $f'(x) = \ x^{2} - \ 10x\  + \ 41.$

    b.  Hence find $f(x),$ and show that its graph cuts the $y$-axis at
        $(0,\  - 121).$

$$f^{''}(x) = \ 2x\  - \ 10$$

$$f'(x)\  = \ x^{2} - \ 10x\  + \ C$$

$$f'(3)\  = \ 20:$$

$$20\  = \ 9\  - \ 30\  + \ C$$

$$C\  = \ 41$$

$$f'(x)\  = \ x²\  - \ 10x\  + \ 41$$

$$f(x) = \frac{x^{3}}{3} - \ 5x^{2} + \ 41x\  + \ C$$

$$Sub\ (3,\  - 34):\ $$

$$- 34\  = \ 9\  - \ 45\  + \ 123\  + \ C,\ $$

$$C\  = \  - 121$$

$$f(x) = \frac{x^{3}}{3} - \ 5x^{2} + \ 41x\  - \ 121$$

$$When\ x\  = \ 0:\ f(0) = \  - 121,\ so\ the\ graph\ cuts\ the\ y\ axis\ at\ (0,\  - 121).$$

11. If $y^{''} = \ 8\  - \ 6x$, show that
    $y\  = \ 4x^{2} - \ x^{3} + \ Cx\  + \ D$, for some constants $C$
    and $D$.\
    Hence find the equation of the curve given that it passes through
    the points $(1,\ 6)$ and $( - 1,\ 8).$

$$y^{''} = \ 8\  - \ 6x$$

$$y' = \ 8x\  - \ 3x^{2} + \ C$$

$$y\  = \ 4x^{2} - \ x^{3} + \ Cx\  + \ D$$

$$Sub\ (1,\ 6):\ 6\  = \ 4\  - \ 1\  + \ C\  + \ D\ $$

$$C\  + \ D\  = \ 3\ \ldots\ (1)$$

$$Sub\ ( - 1,\ 8):\ 8\  = \ 4\  + \ 1\  - \ C\  + \ D\ $$

$$- C\  + \ D\  = \ 3\ \ldots\ (2)$$

$$(1) + \ (2):\ 2D\  = \ 6,\ D\  = \ 3.\ $$

$$C\  = \ 0.$$

$$y\  = \  - x³\  + \ 4x²\  + \ 3$$

Development

12. A curve has $\frac{d^{2}y}{dx^{2}}$ $= \ 8x$ and the tangent at
    $( - 2,\ 5)$ has an angle of inclination of 45° with the\
    $x$-axis. Find the equation of the curve.

$$\frac{d^{2}y}{dx^{2}} = \ 8x$$

$$y' = \ 4x^{2} + \ C_{1}$$

Angle of inclination 45° means gradient = tan 45° = 1.

$$At\ x\  = \  - 2,\ y'\  = \ 1:\ 1\  = \ 16\  + \ C₁,\ so\ C₁\  = \  - 15.$$

$$y'\  = \ 4x²\  - \ 15$$

$$y\  = \frac{4x^{3}}{3} - \ 15x\  + \ C₂$$

$$sub\ ( - 2,\ 5):\ $$

$$5\  = \  - \frac{32}{3}\  + \ 30\  + \ C₂,\ $$

$$C₂\  = \  - \frac{43}{3}.$$

$$y\  = \frac{4x^{3}}{3} - \ 15x\  - \frac{43}{3}$$

13. The tangent to a curve with $\frac{d^{2}y}{dx^{2}}$ $= \ 2x\  - \ 4$
    makes an angle of inclination of 135° with the $x$-axis at the point
    $(2,\  - 4)$. Find its equation.

$$\frac{d^{2}y}{dx^{2}} = \ 2x\  - \ 4$$

$$y' = \ x^{2} - \ 4x\  + \ C₁$$

Angle of inclination 135° means gradient = tan 135° = −1.

$$At\ x\  = \ 2,\ y'\  = \  - 1:\  - 1\  = \ 4\  - \ 8\  + \ C₁,\ so\ C₁\  = \ 3.$$

$$y'\  = \ x²\  - \ 4x\  + \ 3$$

$$y\  = \frac{x^{3}}{3} - \ 2x^{2} + \ 3x\  + \ C₂$$

$$Sub\ (2,\  - 4):\ $$

$$- 4\  = \frac{8}{3} - \ 8\  + \ 6\  + \ C₂,\ \ $$

$$C_{2} = \  - \frac{14}{3}$$

$$y\  = \frac{x^{3}}{3} - \ 2x^{2} + \ 3x\  - \frac{14}{3}$$

14. A function has a tangent parallel to the line
    $4x\  - \ y\  - \ 2\  = \ 0$ at the point $(0,\  - 2)$,\
    and $f^{''}(x) = \ 12x^{2} - \ 6x\  + \ 4.$ Find the equation of the
    function.

The line $4x\  - \ y\  - \ 2\  = \ 0$ has gradient $4$.

$$f''(x)\  = \ 12x²\  - \ 6x\  + \ 4$$

$$f'(x) = \ 4x³\  - \ 3x²\  + \ 4x\  + \ C₁$$

At (0, −2), tangent parallel to line so f\'(0) = 4: 4 = C₁.

$$f'(x) = \ 4x^{3} - \ 3x^{2} + \ 4x\  + \ 4$$

$$f(x) = \ x⁴\  - \ x³\  + \ 2x²\  + \ 4x\  + \ C₂$$

Sub (0, −2): −2 = C₂.

$$f(x) = \ x^{4} - \ x^{3} + \ 2x^{2} + \ 4x\  - \ 2$$

15. A curve has $\frac{d^{2}y}{dx^{2}}$ $= \ 6$ and the tangent at
    $( - 1,\ 3)$ is perpendicular to the line
    $2x\  + \ 4y\  - \ 3\  = \ 0$. Find the equation of the curve.

$$\frac{d^{2}y}{dx^{2}} = \ 6$$

$$y' = \ 6x\  + \ C₁$$

The line $2x\  + \ 4y\  - \ 3\  = \ 0$ has gradient $- \frac{1}{2}$.
Perpendicular gradient = 2.

$$At\ x\  = \  - 1,\ y'\  = \ 2:\ 2\  = \  - 6\  + \ C₁,\ so\ C₁\  = \ 8.$$

$$y'\  = \ 6x\  + \ 8$$

$$y\  = \ \ 3x²\  + \ 8x\  + \ C₂$$

Substitute (−1, 3): 3 = 3 − 8 + C₂, so C₂ = 8.

$$y\  = \ 3x^{2} + \ 8x\  + \ 8$$

16. A function has $f'(1)\  = \ 3$ and $f(1)\  = \ 5$. Evaluate
    $f( - 2)$ given $f''(x)\  = \ 6x\  + \ 18$.

$$f^{''}(x) = \ 6x\  + \ 18$$

$$f'(x) = \ 3x²\  + \ 18x\  + \ C₁$$

$$f'(1) = \ 3:\ 3\  = \ 3\  + \ 18\  + \ C^{1}$$

$$C₁\  = \  - 18.$$

$$f'(x) = \ 3x^{2} + \ 18x\  - \ 18$$

$$f(x) = x³\  + \ 9x²\  - \ 18x\  + \ C₂$$

$$f(1) = \ 5:\ $$

$$5\  = \ 1\  + \ 9\  - \ 18\  + \ C^{2},\ $$

$$C₂\  = \ 13.$$

$$f(x)\  = \ x³\  + \ 9x²\  - \ 18x\  + \ 13$$

$$f( - 2)\  = \  - 8\  + \ 36\  + \ 36\  + \ 13\  = \ 77$$

# Area Under a Curve

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Area under a curve                                                                                                                                                                                       |
+==============================================================================================================================================================================================================================+
| Much of calculus was invented to solve the **area problem**.                                                                                                                                                                 |
|                                                                                                                                                                                                                              |
| How can we find the area bounded by a curved graph and the $x$-axis?                                                                                                                                                         |
|                                                                                                                                                                                                                              |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image1.png){width="1.5748031496062993in" height="1.5674671916010499in"}                                                                              |
|                                                                                                                                                                                                                              |
| We can estimate by splitting the area into rectangles, then summing the areas:                                                                                                                                               |
|                                                                                                                                                                                                                              |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image2.png){width="1.5748031496062993in" height="1.5748031496062993in"}2 rectangles: 10 rectangles Lots of rectangles                                |
|                                                                                                                                                                                                                              |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image3.png){width="1.582638888888889in"                                                                                                              |
| height="1.5743055555555556in"}![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image4.png){width="1.597503280839895in" height="1.5748031496062993in"}                                                 |
|                                                                                                                                                                                                                              |
| The more rectangles we have, the more .................. the estimate for area.                                                                                                                                              |
|                                                                                                                                                                                                                              |
| If we have infinitely thin rectangles, then we will get the .................. area.                                                                                                                                         |
|                                                                                                                                                                                                                              |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image5.png){width="1.9159722222222222in" height="1.8207534995625547in"}                                                                              |
|                                                                                                                                                                                                                              |
| Let the width of each rectangle be $\Delta x$.                                                                                                                                                                               |
|                                                                                                                                                                                                                              |
| The height of a rectangle is the function value $f(x)$.                                                                                                                                                                      |
|                                                                                                                                                                                                                              |
| Therefore, the **area of one rectangle** is: ...............                                                                                                                                                                 |
|                                                                                                                                                                                                                              |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image6.png){width="1.964339457567804in" height="1.7716196412948382in"}The area of all three rectangles would be:                                     |
|                                                                                                                                                                                                                              |
| $f\left( x_{1} \right)\Delta x$ $+$ ......... $+$ .........                                                                                                                                                                  |
|                                                                                                                                                                                                                              |
| $$= \sum_{a}^{b}{f(x)\Delta x}$$                                                                                                                                                                                             |
|                                                                                                                                                                                                                              |
| where the interval $a \leq x \leq b$ is divided into\                                                                                                                                                                        |
| subintervals of length $\Delta x$.                                                                                                                                                                                           |
|                                                                                                                                                                                                                              |
| This approximation for the area is called the **Riemann sum.**                                                                                                                                                               |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Area under a curve                                                                                                                                                                                       |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| +------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------+ |
| | $$What\ would\ be\sum_{0}^{1}{x^{2}\ \Delta x}\ for\ 3\ subintervals?$$                                                                        | $$What\ would\ be\sum_{0}^{1}{x^{2}\ \Delta x}\ for\ 4\ subintervals?$$ | |
| |                                                                                                                                                |                                                                         | |
| | ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image7.png){width="2.201388888888889in"                                |                                                                         | |
| | height="2.2916666666666665in"}![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image8.png){width="2.2121205161854767in" |                                                                         | |
| | height="2.3622047244094486in"}                                                                                                                 |                                                                         | |
| +================================================================================================================================================+=========================================================================+ |
|                                                                                                                                                                                                                              |
| Let's use a computer to calculate the Riemann sum for more and more subintervals:                                                                                                                                            |
|                                                                                                                                                                                                                              |
| +-------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------+-----------------------+-----------------------+  |
| | $$A \approx 0.32408$$                                                                                                                           | $$A \approx 0.32813$$ | $$A \approx 0.33250$$ | $$A \approx 0.33333$$ |  |
| |                                                                                                                                                 |                       |                       |                       |  |
| | ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image9.png){width="1.5743055555555556in"                                |                       |                       |                       |  |
| | height="1.6541666666666666in"}![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image10.png){width="1.5743055555555556in" |                       |                       |                       |  |
| | height="1.6631944444444444in"}![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image11.png){width="1.5743055555555556in" |                       |                       |                       |  |
| | height="1.6694444444444445in"}![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image12.png){width="1.5743055555555556in" |                       |                       |                       |  |
| | height="1.6895833333333334in"}                                                                                                                  |                       |                       |                       |  |
| +=================================================================================================================================================+=======================+=======================+=======================+  |
|                                                                                                                                                                                                                              |
| $$What\ would\ be\lim_{\Delta x \rightarrow 0}{\sum_{0}^{1}{x^{2}\ \Delta x}}(for\ \infty\ subintervals)?$$                                                                                                                  |
|                                                                                                                                                                                                                              |
| We call the exact area under a curve, found by summing infinitely thin rectangles,\                                                                                                                                          |
| the **definite integral** (this is the Riemann sum for infinite subintervals):                                                                                                                                               |
|                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \lim_{\Delta x \rightarrow 0}{\sum_{a}^{b}{f(x)\ \Delta x}}$$                                                                                                                                |
|                                                                                                                                                                                                                              |
| $$= \int_{a}^{b}{f(x)}dx$$                                                                                                                                                                                                   |
|                                                                                                                                                                                                                              |
| You read this as 'the integral of $f(x)$ with respect to $x$, from $x = a$ to $x = b$'                                                                                                                                       |
|                                                                                                                                                                                                                              |
| The fancy S $\int_{}^{}\$integral symbol will be used from now on to show the definite integral.                                                                                                                             |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **The Definite Integral**                                                                                                                                                                                                  |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image13.png){width="2.203472222222222in" height="1.8868055555555556in"}The **definite integral** is the area between a continuous curve and the $x$  |
| axis for $x \in \lbrack a,b\rbrack$                                                                                                                                                                                          |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------+
| - **Area Under a Line and Semicircle**                                                   |
+==========================================================================================+
| We will start with straightforward examples involving straight lines and semicircles to  |
| get used to the notation.                                                                |
|                                                                                          |
|   -------------------------------------------------------------------------------------- |
|   Area of a      $$A = bh$$              Area of a          $$A = \frac{h}{2}(a + b)$$   |
|   rectangle                              trapezium                                       |
|   -------------- ----------------------- ------------------ ---------------------------- |
|   Area of a      $$A = \frac{1}{2}bh$$   Area of a circle   $$A = \pi r^{2}$$            |
|   triangle                                                                               |
|                                                                                          |
|   -------------------------------------------------------------------------------------- |
+------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Interpret** Definite integral notation                                                                                                                                                                                                                                                                                                                                                  |
+===================================================================================================================+=================================================================================================================================================+=======================================================================================================================+
| Evaluate the area using the given sketch:                                                                                                                                                                                                                                                                                                                                                   |
+-------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| a.                                                                                                                | b.                                                                                                                                              | c.                                                                                                                    |
|                                                                                                                   |                                                                                                                                                 |                                                                                                                       |
| $$\int_{0}^{2}3dx$$                                                                                               | $$\int_{1}^{4}(x - 1)dx$$                                                                                                                       | $$\int_{2}^{4}(x - 1)dx$$                                                                                             |
|                                                                                                                   |                                                                                                                                                 |                                                                                                                       |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image14.png){width="1.2878783902012247in" | ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image15.png){width="1.5743055555555556in"                               |                                                                                                                       |
| height="1.2451421697287839in"}                                                                                    | height="1.3430555555555554in"}![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image15.png){width="1.5743055555555556in" |                                                                                                                       |
|                                                                                                                   | height="1.3430555555555554in"}                                                                                                                  |                                                                                                                       |
+-------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| d.                                                                                                                | e.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image15.png){width="1.5748031496062993in"                           | f.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image15.png){width="1.5743055555555556in" |
|                                                                                                                   |     height="1.3435936132983377in"}                                                                                                              |     height="1.3430555555555554in"}                                                                                    |
| $$\int_{- 2}^{2}(x + 6)dx$$                                                                                       |                                                                                                                                                 |                                                                                                                       |
|                                                                                                                   | $$\int_{- 2}^{2}|x|dx$$                                                                                                                         | $$\int_{- 5}^{5}\sqrt{25 - x^{2}}dx$$                                                                                 |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image16.png){width="1.4013888888888888in" |                                                                                                                                                 |                                                                                                                       |
| height="1.354861111111111in"}                                                                                     |                                                                                                                                                 |                                                                                                                       |
+-------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+

[]{#_Toc222132993 .anchor}Foundation

1.  Use area formulae to calculate the sketched definite integrals.

+-----------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image17.png){width="1.5in"                | b.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image17.png){width="1.5in"                | c.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image17.png){width="1.5in"                | d.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image17.png){width="1.5in"                |
|     height="1.4625in"}                                                                                                |     height="1.4625in"}                                                                                                |     height="1.4625in"}                                                                                                |     height="1.4625in"}                                                                                                |
|                                                                                                                       |                                                                                                                       |                                                                                                                       |                                                                                                                       |
| $$\int_{- 1}^{3}2dx$$                                                                                                 | $$\int_{- 3}^{2}5dx\ $$                                                                                               | $$\int_{- 2}^{1}(2x\  + \ 4)dx$$                                                                                      | $$\int_{- 1}^{3}(3x\  + \ 3)dx$$                                                                                      |
|                                                                                                                       |                                                                                                                       |                                                                                                                       |                                                                                                                       |
| $$8$$                                                                                                                 | $$25$$                                                                                                                | $$9$$                                                                                                                 | $$24$$                                                                                                                |
+=======================================================================================================================+=======================================================================================================================+=======================================================================================================================+=======================================================================================================================+
| e.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image18.png){width="1.5923611111111111in" | f.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image18.png){width="1.5923611111111111in" | g.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image18.png){width="1.5923611111111111in" | h.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image18.png){width="1.5923611111111111in" |
|     height="1.4604166666666667in"}                                                                                    |     height="1.4604166666666667in"}                                                                                    |     height="1.4604166666666667in"}                                                                                    |     height="1.4604166666666667in"}                                                                                    |
|                                                                                                                       |                                                                                                                       |                                                                                                                       |                                                                                                                       |
| $$\int_{- 1}^{5}(x\  + \ 4)dx$$                                                                                       | $$\int_{- 2}^{2}(x\  + \ 6)dx$$                                                                                       | $$\int_{- 3}^{3}|x|dx$$                                                                                               | $$\int_{- 2}^{2}|2x|dx$$                                                                                              |
|                                                                                                                       |                                                                                                                       |                                                                                                                       |                                                                                                                       |
| $$36$$                                                                                                                | $$24$$                                                                                                                | $$9$$                                                                                                                 | $$8$$                                                                                                                 |
+-----------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+

2.  Evaluate $\int_{0}^{4}{f(x)}dx$

+----------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image19.png){width="2.576119860017498in" | b.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image19.png){width="2.513888888888889in" |
|     height="1.2520374015748033in"}                                                                                   |     height="1.2486111111111111in"}                                                                                   |
|                                                                                                                      |                                                                                                                      |
| $$1 + \frac{\pi}{2}$$                                                                                                | $$2.5$$                                                                                                              |
+======================================================================================================================+======================================================================================================================+

3.  Sketch a graph of each definite integral, then use an area formula
    to calculate it.

+-------------------------------------------+-------------------------------------------+
| a.                                        | b.                                        |
|                                           |                                           |
| $$\int_{- 4}^{4}\sqrt{16\  - \ x^{2}}dx$$ | $$\int_{- 5}^{0}\sqrt{25\  - \ x^{2}}dx$$ |
|                                           |                                           |
| $$8\pi$$                                  | $$\frac{25\pi}{4}$$                       |
+===========================================+===========================================+

# The Fundamental Theorem of Calculus

+------------------------------------------------------------------------+
| - **Review**                                                           |
+========================================================================+
| - Find average velocity using change in displacement                   |
|                                                                        |
| +------------------------------+------------------------------+        |
| | a.  Given $x(0) = 2$ m and   | b.  Given $x(3) = 14$ m and  |        |
| |     $x(5) = 32$ m, what is   |     $x(9) = 26$ m, what is   |        |
| |     the average velocity?    |     the average velocity?    |        |
| +==============================+==============================+        |
|                                                                        |
| - Calculate displacement from velocity and time                        |
|                                                                        |
| +------------------------------+------------------------------+        |
| | a.  A car travels at a       | b.  A car travels at a       |        |
| |     constant 10 m/s.\        |     constant 12 m/s.\        |        |
| |     How far does it travel   |     How far does it travel   |        |
| |     in 2 seconds?            |     in 5 seconds?            |        |
| +==============================+==============================+        |
|                                                                        |
| - Recall the relationship between displacement and velocity            |
|                                                                        |
| +--------------------+--------------------------+--------------------+ |
| | a.  $x(t) = 5t$    | b.  $x(t) = 5t^{2} + 3t$ | c.  $x(t) =$       | |
| |                    |                          |                    | |
| | $$v(t) =$$         | $$v(t) =$$               | $$v(t) = t^{2}$$   | |
| +====================+==========================+====================+ |
+------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** The fundamental theorem of calculus                                                                                         |
+:================================================================================================================================================+
| The fundamental theorem of calculus says that:                                                                                                  |
|                                                                                                                                                 |
| $$\int_{a}^{b}{f(x)}dx = F(b) - F(a)$$                                                                                                          |
|                                                                                                                                                 |
| "The area under a curve equals the difference between the .................. at the endpoints"                                                  |
|                                                                                                                                                 |
| This means you can compute the area algebraically, without calculating sums of rectangles.                                                      |
|                                                                                                                                                 |
| We will now demonstrate how the primitive and areas under curves are related.                                                                   |
|                                                                                                                                                 |
| Consider the following velocity-time graph for a car.\                                                                                          |
| It starts off at a constant velocity, then starts accelerating.                                                                                 |
|                                                                                                                                                 |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image20.png){width="2.165277777777778in" height="2.183333333333333in"}  |
|                                                                                                                                                 |
| > **How far does the car travel over the first three seconds?**                                                                                 |
| >                                                                                                                                               |
| > Since the car is travelling at a constant velocity,                                                                                           |
| >                                                                                                                                               |
| > we can use $displacement = velocity \times time$                                                                                              |
| >                                                                                                                                               |
| > $=$ ( )( )                                                                                                                                    |
| >                                                                                                                                               |
| > $=$ ............ m                                                                                                                            |
| >                                                                                                                                               |
| > This happens to be the ............... under the curve!                                                                                       |
|                                                                                                                                                 |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image21.png){width="2.165277777777778in" height="2.1277777777777778in"} |
|                                                                                                                                                 |
| > **We will estimate how far the car travelled over the next six seconds (**$\mathbf{t = 3}$ **to** $\mathbf{t = 9}$**).**                      |
| >                                                                                                                                               |
| > Since velocity is not constant in this interval, the graph is curved. We will use the Riemann sum:                                            |
| >                                                                                                                                               |
| > $displacement =$ ............ $+$ ............ $+$ ............                                                                               |
|                                                                                                                                                 |
| $=$ ............ m                                                                                                                              |
|                                                                                                                                                 |
| By taking more and more subintervals, what would be a more accurate calculation for change in displacement?                                     |
|                                                                                                                                                 |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image22.png){width="1.5748031496062993in"                               |
| height="1.5535312773403325in"}![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image23.png){width="1.5748031496062993in" |
| height="1.5818646106736658in"}![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image24.png){width="1.5748031496062993in" |
| height="1.555589457567804in"}![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image25.png){width="1.5748031496062993in"  |
| height="1.5394903762029746in"}                                                                                                                  |
+-------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** The fundamental theorem of calculus                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image26.png){width="1.9472222222222222in"                               |
| height="1.9680555555555554in"}Let the functions for displacement be $x(t)$ and velocity be $v(t)$.                                              |
|                                                                                                                                                 |
| From $t = 0$ to $t = 9$, the car's displacement changes by 207 m.                                                                               |
|                                                                                                                                                 |
| We found this by calculating the area under its velocity graph.                                                                                 |
|                                                                                                                                                 |
| $$Change\ in\ displacement = \ \int_{0}^{9}{v(t)}dt$$                                                                                           |
|                                                                                                                                                 |
| We could also find this change by subtracting the car\'s\                                                                                       |
| displacement at the two endpoints:                                                                                                              |
|                                                                                                                                                 |
| $$Change\ in\ displacement = x(9) - x(0)$$                                                                                                      |
|                                                                                                                                                 |
| Combining these two relationships:                                                                                                              |
|                                                                                                                                                 |
| $$\int_{0}^{9}{v(t)}dt = x(9) - x(0)$$                                                                                                          |
|                                                                                                                                                 |
| Since velocity is the derivative of displacement, displacement is the .................. of velocity.                                           |
|                                                                                                                                                 |
| This can apply to any scenario (not just velocity and displacement) and gives us the **fundamental theorem of calculus:**                       |
|                                                                                                                                                 |
| $$\int_{a}^{b}{f(x)}dx = F(b) - F(a)$$                                                                                                          |
+-------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  Change in displacement $x(t)$ between $t = a$ and $t = b$ is  |
|     $x(b) -$ ............                                         |
|                                                                   |
| 2.  The area under a .................. graph also gives the      |
|     change in displacement.                                       |
|                                                                   |
| 3.  So, change in displacement equals $\int_{a}^{b}{v(t)}dt =$    |
|     ............ $-$ ............                                 |
|                                                                   |
| 4.  Since velocity is the derivative of displacement,             |
|     displacement is the ............... of velocity.              |
|                                                                   |
| 5.  Therefore, the fundamental theorem of calculus states that    |
|     $\int_{a}^{b}{f(x)}dx = F(b) - F(a)$, in other words, the     |
|     area under a curve is the difference between the              |
|     .................. at the endpoints.                          |
+-------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------+
| - **The Definite Integral**                                                                                      |
+==================================================================================================================+
| The **definite integral** is the area between a continuous curve and the $x$ axis for                            |
| $x \in \lbrack a,b\rbrack$.                                                                                      |
|                                                                                                                  |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image13.png){width="2.203472222222222in" |
| height="1.8868055555555556in"}It is the difference between the primitives at the endpoints.                      |
|                                                                                                                  |
| $$\int_{a}^{b}{f(x)}dx = F(b) - F(a)$$                                                                           |
|                                                                                                                  |
| - Mathematicians set out $F(b) - F(a)$ as $\left\lbrack F(x) \right\rbrack_{a}^{b}$                              |
|                                                                                                                  |
| - Always show the substitution. Put brackets whenever you subtract two or more terms.                            |
|                                                                                                                  |
| - You can factor a constant out of the integral sign and square brackets; a vertical dilation scales all $y$     |
|   values, which scales the area by the same amount.                                                              |
|                                                                                                                  |
| $${\int_{}^{}{kf(x)}dx = k\int_{}^{}{f(x)}dx                                                                     |
| }{\begin{bmatrix}                                                                                                |
| 　 \\                                                                                                            |
| kF(x) \\                                                                                                         |
| \                                                                                                                |
| \end{bmatrix}_{a}^{b} = k\begin{bmatrix}                                                                         |
| 　 \\                                                                                                            |
| F(x) \\                                                                                                          |
| \                                                                                                                |
| \end{bmatrix}_{a}^{b}}$$                                                                                         |
|                                                                                                                  |
| - You do not need to add $+ C$, since it will get cancelled out due to the subtraction.                          |
+------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------+
| - **Finding the Definite Integral**                                |
+====================================================================+
| $$\int_{a}^{b}{f(x)}dx = \left\lbrack F(x) \right\rbrack_{a}^{b}$$ |
|                                                                    |
| - Areas under the $x$-axis are calculated as negative.             |
+--------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------+
| - ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image27.png){width="1.5923611111111111in"                                       |
|   height="1.5465277777777777in"}![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image28.png){width="1.5923611111111111in"         |
|   height="1.5708333333333333in"}**Example** Find the definite integral of a function                                                                      |
+===============================================================================+===========================================================================+
| $$\ \ \ \ \ \int_{2}^{4}(x - 1)dx$$                                           | $$\ \ \ \ \ \int_{0}^{1}{5x^{2}}dx$$                                      |
|                                                                               |                                                                           |
| $$= \left\lbrack \frac{x^{2}}{2} - x \right\rbrack_{2}^{4}$$                  | $$= \left\lbrack \frac{5x^{3}}{3} \right\rbrack_{0}^{1}$$                 |
|                                                                               |                                                                           |
| $$= \left( \frac{4^{2}}{2} - 4 \right) - \left( \frac{2^{2}}{2} - 2 \right)$$ | $$= \frac{5}{3} - 0$$                                                     |
|                                                                               |                                                                           |
| $$= 4$$                                                                       | $$\  = \frac{5}{3}$$                                                      |
+-------------------------------------------------------------------------------+---------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                                                                                                                         |
+=======================================================================================================================+=======================================================================================================================+
| a.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image29.png){width="1.5916666666666666in" | b.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image30.png){width="1.5903062117235345in" |
|     height="1.5708333333333333in"}                                                                                    |     height="1.5708333333333333in"}                                                                                    |
|                                                                                                                       |                                                                                                                       |
| $$\ \ \ \ \ \int_{2}^{4}(2x - 3)dx$$                                                                                  | $$\ \ \ \ \ \int_{0}^{4}\left( 25 - x^{2} \right)dx$$                                                                 |
|                                                                                                                       |                                                                                                                       |
| 6                                                                                                                     | $$\frac{236}{3}$$                                                                                                     |
+-----------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| c.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image31.png){width="1.583814523184602in"  | d.  ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image32.png){width="1.5903062117235345in" |
|     height="1.5708333333333333in"}                                                                                    |     height="1.5590551181102361in"}                                                                                    |
|                                                                                                                       |                                                                                                                       |
| $$\ \ \ \ \ \int_{0}^{4}{\frac{1}{3}\left( 25 - x^{2} \right)}dx$$                                                    | $$\ \ \ \ \int_{1}^{3}\left( x^{3} - 7x^{2} + 12x \right)dx$$                                                         |
|                                                                                                                       |                                                                                                                       |
| $$\frac{236}{9}$$                                                                                                     | $$\frac{22}{3}$$                                                                                                      |
+-----------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| - **Expand Brackets and Split Fractions Before Integrating**                                                                                                                                                                                  |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| There is no reverse product rule or reverse quotient rule for integration (in the Advanced course).                                                                                                                                           |
|                                                                                                                                                                                                                                               |
| You must expand products to separate terms.                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                               |
| You must split fractions to separate terms.                                                                                                                                                                                                   |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find the definite integral of a product and quotient of functions                                                                                                                                                                           |
+=================================================================================================================================================+=========================================================================================================+
| $$\ \ \ \ \ \int_{1}^{6}{x(x + 1)}dx = \int_{1}^{6}\left( x^{2} + x \right)dx$$                                                                 | $$\ \ \ \ \ \int_{1}^{2}{\ \frac{3x^{4} - 2x^{2}}{x^{2}}}dx = \int_{0}^{3}\left( 3x^{2} - 2 \right)dx$$ |
|                                                                                                                                                 |                                                                                                         |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \left\lbrack \frac{x^{3}}{3} - \frac{x^{2}}{2} \right\rbrack_{1}^{6}$$ | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \begin{bmatrix}      |
|                                                                                                                                                 | 　 \\                                                                                                   |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = (72 + 18) - \left( \frac{1}{3} + \frac{1}{2} \right)$$                 | x^{3} - 2x \\                                                                                           |
|                                                                                                                                                 | 　                                                                                                      |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = 89\frac{1}{6}$$                                                        | \end{bmatrix}_{1}^{2}$$                                                                                 |
|                                                                                                                                                 |                                                                                                         |
|                                                                                                                                                 | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = (8 - 4) - (1 - 2)$$  |
|                                                                                                                                                 |                                                                                                         |
|                                                                                                                                                 | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = 5$$                  |
+-------------------------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                           |
+================================================================+================================================================+
| Evaluate these integrals.                                                                                                       |
+----------------------------------------------------------------+----------------------------------------------------------------+
| a.                                                             | b.                                                             |
|                                                                |                                                                |
| $$\ \ \ \ \ \int_{2}^{5}{x(x - 2)}dx$$                         | $$\ \ \ \ \ \int_{0}^{3}{(x + 1)(x - 4)}dx$$                   |
|                                                                |                                                                |
| 18                                                             | $$- \frac{33}{2}$$                                             |
+----------------------------------------------------------------+----------------------------------------------------------------+
| c.                                                             | d.                                                             |
|                                                                |                                                                |
| $$\ \ \ \ \ \int_{1}^{2}{\ \frac{x^{4} + 6x^{3}}{x^{2}}\ }dx$$ | $$\ \ \ \ \ \int_{- 3}^{- 1}{\ \frac{4x^{3} - x^{2}}{x}\ }dx$$ |
|                                                                |                                                                |
| $$\frac{34}{3}$$                                               | $$\frac{116}{3}$$                                              |
+----------------------------------------------------------------+----------------------------------------------------------------+
| e.                                                             | f.                                                             |
|                                                                |                                                                |
| $$\ \ \ \ \ \int_{1}^{3}{\ x^{- 3}\ }dx$$                      | $$\ \ \ \ \ \int_{1}^{3}{\ \frac{4}{x^{2}}\ }dx$$              |
|                                                                |                                                                |
| $$\frac{4}{9}$$                                                | $$\frac{8}{3}$$                                                |
+----------------------------------------------------------------+----------------------------------------------------------------+
| - **Discontinuities and Integration**                                                                                           |
+---------------------------------------------------------------------------------------------------------------------------------+
| The definite integral is the area between a **continuous** curve and the $x$ axis for $x \in \lbrack a,b\rbrack$.               |
|                                                                                                                                 |
| ![](media/Integral Calculus 1_The Fundamental Theorem of Calculus/media/image33.png){width="1.5748031496062993in"               |
| height="1.624015748031496in"}This means you **cannot integrate across a discontinuity**.                                        |
|                                                                                                                                 |
| For example:                                                                                                                    |
|                                                                                                                                 |
| $$\int_{- 1}^{1}x^{- 4}dx = \left\lbrack \frac{x^{- 3}}{- 3} \right\rbrack_{- 1}^{1}$$                                          |
|                                                                                                                                 |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = - \frac{2}{3}$$                                                                  |
|                                                                                                                                 |
| This number is clearly nonsense. The function is not defined at $x = 0$, and how could you get a negative answer if the         |
| function is always positive.                                                                                                    |
|                                                                                                                                 |
| Discontinuities occur when you **divide by zero** or **take the even root of a negative.**                                      |
+---------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------+
| - **Identify** whether you are integrating across a discontinuity                                           |
+===================================+=====================================+===================================+
| Decide whether you could use the definite integral to evaluate these definite integrals.                    |
+-----------------------------------+-------------------------------------+-----------------------------------+
| a.                                | b.                                  | c.                                |
|                                   |                                     |                                   |
| $$\int_{- 1}^{1}\frac{1}{x}dx$$   | $$\int_{1}^{3}\frac{1}{x}dx$$       | $$\int_{- 5}^{- 2}\frac{1}{x}dx$$ |
+-----------------------------------+-------------------------------------+-----------------------------------+
| d.                                | e.                                  | f.                                |
|                                   |                                     |                                   |
| $$\int_{- 1}^{1}x^{- 2}dx$$       | $$\int_{2}^{5}x^{- 2}dx$$           | $$\int_{0}^{3}\frac{1}{x - 2}dx$$ |
+-----------------------------------+-------------------------------------+-----------------------------------+
| g.                                | h.                                  | i.                                |
|                                   |                                     |                                   |
| $$\int_{3}^{5}\frac{1}{x - 2}dx$$ | $$\int_{0}^{3}\frac{1}{x + 1}dx$$   | $$\int_{- 1}^{4}\sqrt{x}dx$$      |
+-----------------------------------+-------------------------------------+-----------------------------------+
| j.                                | k.                                  | l.                                |
|                                   |                                     |                                   |
| $$\int_{0}^{4}\sqrt{x}dx$$        | $$\int_{- 3}^{1}\frac{5}{x^{2}}dx$$ | $$\int_{- 4}^{2}\sqrt{x + 5}dx$$  |
+-----------------------------------+-------------------------------------+-----------------------------------+
| m.                                | n.                                  | o.                                |
|                                   |                                     |                                   |
| $$\int_{- 2}^{4}\sqrt[3]{x}dx$$   | $$\int_{0}^{3}\sqrt{9 - x^{2}}dx$$  | $$\int_{0}^{\pi}{\sec^{2}x}dx$$   |
+-----------------------------------+-------------------------------------+-----------------------------------+

Foundation

1.  Evaluate these definite integrals using the fundamental theorem of
    calculus.

+------------------------+----------------------------+----------------------------+
| a.                     | b.                         | c.                         |
|                        |                            |                            |
| $$\int_{0}^{1}{2x}dx$$ | $$\int_{1}^{4}{2x}dx$$     | $$\int_{1}^{3}{4x}dx$$     |
|                        |                            |                            |
| $$1$$                  | $$15$$                     | $$16$$                     |
+========================+============================+============================+
| d.                     | e.                         | f.                         |
|                        |                            |                            |
| $$\int_{2}^{5}{8x}dx$$ | $$\int_{2}^{3}{3x^{2}}dx$$ | $$\int_{0}^{3}{5x^{4}}dx$$ |
|                        |                            |                            |
| $$84$$                 | $$19$$                     | $$243$$                    |
+------------------------+----------------------------+----------------------------+

2.  Evaluate these definite integrals.

+----------------------------------------------------------+-------------------------------------------------------------+--------------------------------------------------------+
| a.                                                       | b.                                                          | c.                                                     |
|                                                          |                                                             |                                                        |
| $$\int_{3}^{6}(2x\  + \ 1)dx$$                           | $$\int_{2}^{4}(2x\  - \ 3)dx$$                              | $$\int_{0}^{3}(4x\  + \ 5)dx$$                         |
|                                                          |                                                             |                                                        |
| $$30$$                                                   | $$6$$                                                       | $$33$$                                                 |
+==========================================================+=============================================================+========================================================+
| d.                                                       | e.                                                          | f.                                                     |
|                                                          |                                                             |                                                        |
| $$\int_{2}^{3}\left( 3x^{2} - \ 1 \right)dx$$            | $$\int_{1}^{4}\left( 6x^{2} + \ 2 \right)dx$$               | $$\int_{0}^{1}\left( 3x^{2} + \ 2x \right)dx$$         |
|                                                          |                                                             |                                                        |
| $$18$$                                                   | $$132$$                                                     | $$2$$                                                  |
+----------------------------------------------------------+-------------------------------------------------------------+--------------------------------------------------------+
| g.                                                       | h.                                                          | i.                                                     |
|                                                          |                                                             |                                                        |
| $$\int_{1}^{2}\left( 4x^{3} + \ 3x^{2} + \ 1 \right)dx$$ | $$\int_{0}^{2}\left( 2x\  + \ 3x^{2} + \ 8x^{3} \right)dx$$ | $$\int_{3}^{5}\left( 3x^{2} - \ 6x\  + \ 5 \right)dx$$ |
|                                                          |                                                             |                                                        |
| $$23$$                                                   | $$44$$                                                      | $$60$$                                                 |
+----------------------------------------------------------+-------------------------------------------------------------+--------------------------------------------------------+

3.  Evaluate these definite integrals.

+-------------------------------------------------+------------------------------------------------------+---------------------------------------------------------------+
| a.                                              | b.                                                   | c.                                                            |
|                                                 |                                                      |                                                               |
| $$\int_{- 1}^{0}(1\  - \ 2x)dx$$                | $$\int_{- 1}^{0}(2x\  + \ 3)dx$$                     | $$\int_{- 2}^{1}{3x^{2}}dx$$                                  |
|                                                 |                                                      |                                                               |
| $$2$$                                           | $$2$$                                                | $$9$$                                                         |
+=================================================+======================================================+===============================================================+
| d.                                              | e.                                                   | f.                                                            |
|                                                 |                                                      |                                                               |
| $$\int_{- 1}^{2}\left( 4x^{3} + \ 5 \right)dx$$ | $$\int_{- 2}^{2}\left( 5x^{4} + \ 6x^{2} \right)dx$$ | $$\int_{- 2}^{- 1}\left( 4x^{3} + \ 12x^{2} - \ 3 \right)dx$$ |
|                                                 |                                                      |                                                               |
| $$30$$                                          | $$96$$                                               | $$10$$                                                        |
+-------------------------------------------------+------------------------------------------------------+---------------------------------------------------------------+

4.  Evaluate these definite integrals.

+--------------------------------------------------------+----------------------------------------------------------+-----------------------------------------------------------+
| a.                                                     | b.                                                       | c.                                                        |
|                                                        |                                                          |                                                           |
| $$\int_{1}^{4}(x\  + \ 2)dx$$                          | $$\int_{0}^{2}\left( x^{2} + \ x \right)dx$$             | $$\int_{0}^{3}\left( x^{3} + \ x^{2} \right)dx$$          |
|                                                        |                                                          |                                                           |
| $$13.5$$                                               | $$\frac{14}{3}$$                                         | $$\frac{117}{4}$$                                         |
+========================================================+==========================================================+===========================================================+
| d.                                                     | e.                                                       | f.                                                        |
|                                                        |                                                          |                                                           |
| $$\int_{- 1}^{1}\left( x^{3} - \ x\  + \ 1 \right)dx$$ | $$\int_{- 2}^{3}\left( 2x^{2} - \ 3x\  + \ 1 \right)dx$$ | $$\int_{- 4}^{- 2}\left( 16\  - \ x^{3} - \ x \right)dx$$ |
|                                                        |                                                          |                                                           |
| $$2$$                                                  | $$\frac{125}{6}$$                                        | $$98$$                                                    |
+--------------------------------------------------------+----------------------------------------------------------+-----------------------------------------------------------+

5.  Evaluate these definite integrals.

+-------------------------------------+-----------------------------------------------+--------------------------------------------------------+
| a.                                  | b.                                            | c.                                                     |
|                                     |                                               |                                                        |
| $$\int_{2}^{3}{x(2\  + \ 3x)}dx$$   | $$\int_{0}^{2}{(x\  + \ 1)(3x\  + \ 1)}dx$$   | $$\int_{- 1}^{1}{x^{2}\left( 5x^{2} + \ 1 \right)}dx$$ |
|                                     |                                               |                                                        |
| $$24$$                              | $$18$$                                        | $$\frac{8}{3}$$                                        |
+=====================================+===============================================+========================================================+
| d.                                  | e.                                            | f.                                                     |
|                                     |                                               |                                                        |
| $$\int_{- 1}^{2}(x\  - \ 3)^{2}dx$$ | $$\int_{- 1}^{0}{x(x\  - \ 1)(x\  + \ 1)}dx$$ | $$\int_{- 1}^{0}\left( 1\  - \ x^{2} \right)^{2}dx7$$  |
|                                     |                                               |                                                        |
| $$21$$                              | $$\frac{1}{4}$$                               | $$\frac{8}{15}$$                                       |
+-------------------------------------+-----------------------------------------------+--------------------------------------------------------+

6.  Evaluate these definite integrals.

+-----------------------------------------------+---------------------------------------------------+------------------------------------------------------+
| a.                                            | b.                                                | c.                                                   |
|                                               |                                                   |                                                      |
| $$\int_{1}^{3}\frac{3x^{3} + \ 4x^{2}}{x}dx$$ | $$\int_{1}^{2}\frac{4x^{4} - \ x}{x}dx$$          | $$\int_{2}^{3}\frac{5x^{2} + \ 9x^{4}}{x^{2}}dx$$    |
|                                               |                                                   |                                                      |
| $$42$$                                        | $$14$$                                            | $$62$$                                               |
+===============================================+===================================================+======================================================+
| d.                                            | e.                                                | f.                                                   |
|                                               |                                                   |                                                      |
| $$\int_{1}^{2}\frac{x^{3} + \ 4x^{2}}{x}dx$$  | $$\int_{1}^{3}\frac{x^{3} - \ x^{2} + \ x}{x}dx$$ | $$\int_{- 2}^{- 1}\frac{x^{3} - \ 2x^{5}}{x^{2}}dx$$ |
|                                               |                                                   |                                                      |
| $$\frac{25}{3}$$                              | $$\frac{20}{3}$$                                  | $$6$$                                                |
+-----------------------------------------------+---------------------------------------------------+------------------------------------------------------+

Development

7.  Evaluate these definite integrals.

+-----------------------------------+------------------------------------------------------------+----------------------------------------------------+
| a.                                | b.                                                         | c.                                                 |
|                                   |                                                            |                                                    |
| $$\int_{0}^{\frac{1}{2}}x^{2}dx$$ | $$\int_{0}^{\frac{2}{3}}\left( 2x\  + \ 3x^{2} \right)dx$$ | $$\int_{\frac{1}{2}}^{\frac{3}{4}}(6\  - \ 4x)dx$$ |
|                                   |                                                            |                                                    |
| $$\frac{1}{24}$$                  | $$\frac{20}{27}$$                                          | $$\frac{7}{8}$$                                    |
+===================================+============================================================+====================================================+

8.  Evaluate these definite integrals.

+-----------------------------------+-----------------------------------+-------------------------------------------+
| a.                                | b.                                | c.                                        |
|                                   |                                   |                                           |
| $$\int_{5}^{10}x^{- 2}dx$$        | $$\int_{2}^{3}{2x^{- 3}}dx$$      | $$\int_{\frac{1}{2}}^{1}{4x^{- 5}}dx\ $$  |
|                                   |                                   |                                           |
| $$\frac{1}{10}$$                  | $$\frac{5}{36}$$                  | $$15$$                                    |
+===================================+===================================+===========================================+
| d.                                | e.                                | f.                                        |
|                                   |                                   |                                           |
| $$\int_{1}^{2}\frac{1}{x^{2}}dx$$ | $$\int_{1}^{4}\frac{1}{x^{3}}dx$$ | $$\int_{\frac{1}{2}}^{1}\frac{3}{x^{4}}$$ |
|                                   |                                   |                                           |
| $$\frac{1}{2}$$                   | $$\frac{15}{32}$$                 | $$7$$                                     |
+-----------------------------------+-----------------------------------+-------------------------------------------+

9.  a.  Show that $\int_{2}^{k}3dx = 3k\  - \ 6.$

$$\int_{2}^{k}3dx\  = \ \lbrack 3x\rbrack_{2}^{k} = \ 3k\  - \ 6$$

b.  Hence find the value of $k$, given that $\int_{2}^{k}3dx\  = \ 18.$

$$3k\  - \ 6\  = \ 18,\ $$

$$k\  = \ 8.\ $$

10. a.  Show that $\int_{0}^{k}xdx\  = \frac{k^{2}}{2}.$

$$\int_{0}^{k}xdx\  = \ \left\lbrack \frac{x^{2}}{2} \right\rbrack_{0}^{k} = \frac{k^{2}}{2}$$

b.  Hence find the positive value of $k$ given
    $\int_{0}^{k}xdx\  = \ 18.$

$$\frac{k^{2}}{2} = \ 18,\ $$

$$so\ k^{2} = \ 36,$$

$$\ k\  = \ 6\ (k\  > \ 0).$$

11. Find the value of $k$ if $k\  > \ 0$.

+-------------------------------+-------------------------------+-------------------------------------------+
| a.                            | b.                            | c.                                        |
|                               |                               |                                           |
| $$\int_{k}^{3}2dx = 4$$       | $$\int_{k}^{8}3dx = 12$$      | $$\int_{2}^{3}(k - 3)dx = 5$$             |
|                               |                               |                                           |
| $$k = 1$$                     | $$k = 4$$                     | $$k = 8$$                                 |
+===============================+===============================+===========================================+
| d.                            | e.                            | f.                                        |
|                               |                               |                                           |
| $$\int_{3}^{k}(x - 3)dx = 0$$ | $$\int_{1}^{k}(x + 1)dx = 6$$ | $$\int_{1}^{k}(k + 3x)dx = \frac{13}{2}$$ |
|                               |                               |                                           |
| $$k = 3$$                     | $$k = 3$$                     | $$k = 2$$                                 |
+-------------------------------+-------------------------------+-------------------------------------------+

12. Evaluate these integrals.

+-----------------------------------------------+------------------------------------------------+
| a.                                            | b.                                             |
|                                               |                                                |
| $$\int_{1}^{2}\frac{1\  + \ x^{2}}{x^{2}}dx$$ | $$\int_{- 2}^{- 1}\frac{1\  + \ 2x}{x^{3}}dx$$ |
|                                               |                                                |
| $$\frac{3}{2}$$                               | $$\frac{5}{8}$$                                |
+===============================================+================================================+

13. Evaluate these integrals.

+--------------------------------------------------------+--------------------------------------------------------------+
| a.                                                     | b.                                                           |
|                                                        |                                                              |
| $$\int_{1}^{3}\left( x\  + \frac{1}{x} \right)^{2}dx$$ | $$\int_{1}^{2}\left( x^{2} + \frac{1}{x^{2}} \right)^{2}dx$$ |
|                                                        |                                                              |
| $$\frac{40}{3}$$                                       | $$\frac{1019}{120}$$                                         |
+========================================================+==============================================================+

14. a.  Explain why $y\  =$ $\frac{1}{x^{2}}$ is never negative.

$$x^{2}\ is\ never\ negative,\ so\frac{1}{x^{2}}\ is\ never\ negative.\ $$

b.  The integral is negative, even though the graph is always above the
    $x$ axis.\
    Explain why the integral below is actually undefined.

$$\int_{- 1}^{1}\frac{1}{x^{2}}dx\  = \ \left\lbrack - \frac{1}{x} \right\rbrack_{- 1}^{1} = \  - 1\  - \ 1\  = \  - 2$$

The function is undefined at $x\  = \ 0$, which lies in the given
interval.\
Hence the integral is meaningless and the use of the fundamental theorem
is invalid.

c.  Without evaluating, identify which integrals are undefined.

+---------------------------------------------+---------------------------------------------+---------------------------------------------+
| i.                                          | ii.                                         | iii.                                        |
|                                             |                                             |                                             |
| $$\int_{0}^{2}\frac{1}{(3\  - \ x)^{2}}dx$$ | $$\int_{2}^{4}\frac{1}{(3\  - \ x)^{2}}dx$$ | $$\int_{4}^{6}\frac{1}{(3\  - \ x)^{2}}dx$$ |
+=============================================+=============================================+=============================================+

Part ii) due to integrating across the asymptote at $x = 3$
