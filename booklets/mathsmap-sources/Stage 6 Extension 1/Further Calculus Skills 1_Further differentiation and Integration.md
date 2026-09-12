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

**ME1-12-04** selects and applies differentiation and integration
techniques to solve problems

**Further derivatives of functions**

- Find the derivative of a function defined parametrically using the
  chain rule

- Solve problems involving derivatives of functions defined
  parametrically

- Verify using the chain rule that the derivative of the inverse
  function is the reciprocal of the derivative of the function,
  evaluated at the value of the inverse function, that is
  $\left( f^{- 1} \right)'(x) = \frac{1}{f'\left( f^{- 1}(x) \right)}$

- Solve problems involving derivatives of inverse functions

- Examine the proofs of the derivatives of $\sin^{- 1}x$, $\cos^{- 1}x$
  and $\tan^{- 1}x$

- Use the chain rule to show that
  $\frac{d}{dx}\left\lbrack \sin^{- 1}{f(x)} \right\rbrack = \frac{f'(x)}{\sqrt{1 - \left\lbrack f(x) \right\rbrack^{2}}}$,
  $\frac{d}{dx}\left\lbrack \cos^{- 1}{f(x)} \right\rbrack = - \frac{f'(x)}{\sqrt{1 - \left\lbrack f(x) \right\rbrack^{2}}} = - \frac{d}{dx}\left\lbrack \sin^{- 1}{f(x)} \right\rbrack$
  and
  $\frac{d}{dx}\left\lbrack \tan^{- 1}{f(x)} \right\rbrack = \frac{f'(x)}{1 + \left\lbrack f(x) \right\rbrack^{2}}$
  and apply the results to solve problems involving derivatives of
  $\sin^{- 1}{f(x)}$, $\cos^{- 1}{f(x)}$ and $\tan^{- 1}{f(x)}$

- Apply the product, quotient and chain rules to find derivatives of
  functions of the form $f(x)g(x),\frac{f(x)}{g(x)}$ and
  $f\left( g(x) \right)$ where $f(x)$ and $g(x)$ are any of the
  functions covered in the scope of the *Mathematics Advanced 11--12
  Syllabus* (2024) or inverse trigonometric functions and solve related
  problems

**Techniques of integration**

- Find indefinite and definite integrals of involving expressions of the
  form $\frac{1}{\sqrt{a^{2} - x^{2}}}$ or $\frac{a}{a^{2} + x^{2}}$

- Use integration by substitution to evaluate definite and indefinite
  integrals given the substitution, where the substitution is expressed
  as a function of the variable of integration or where the variable of
  integration is the subject of the substitution

- Prove and use the identities
  $\sin^{2}nx = \frac{1}{2}\left( 1 - \cos{2nx} \right)$ and
  $\cos^{2}nx = \frac{1}{2}(1 + \cos{2nx})$ to find integrals involving
  $\int\sin^{2}nx\ dx$ and $\int\cos^{2}nx\ dx$

[]{#_Toc202480289 .anchor}

# Derivative of Inverse Functions

+-------------------------------------------------------------------------------+
| - **Review**                                                                  |
+===============================================================================+
| - Differentiate a polynomial                                                  |
|                                                                               |
| +-----------------------+-----------------------+---------------------------+ |
| | a.  Find $f'(x)$      | b.  Find $f'(x)$      | c.  Find $f'(x)$ where\   | |
| |     where\            |     where\            |     $$f(x) = x^{3} + 2x$$ | |
| |     $$f(x) = 2x + 5$$ |     $$f(x) = 7 - 3x$$ |                           | |
| +=======================+=======================+===========================+ |
|                                                                               |
| - Find the inverse function                                                   |
|                                                                               |
| +------------------------------+-------------------------------------+        |
| | a.  Find $f^{- 1}(x)$ where\ | b.  Find $f^{- 1}(x)$ where\        |        |
| |     $$f(x) = 2x + 5$$        |     $$f(x) = 3x - 1$$               |        |
| +==============================+=====================================+        |
| | c.  Find $f^{- 1}(x)$ where\ | d.  Find $f^{- 1}(x)$ where\        |        |
| |     $$f(x) = x^{3} + 1$$     |     $$f(x) = \frac{1 - 3x}{1 + x}$$ |        |
| +------------------------------+-------------------------------------+        |
|                                                                               |
| - Recognise $f^{- 1}(b) = a$ is equivalent to $f(a) = b$                      |
|                                                                               |
| +------------------------------+------------------------------+               |
| | a.  Given $f(2) = 7,$ find   | b.  Given $f(3) = 5,$ find   |               |
| |     $f^{- 1}(7)$             |     $f^{- 1}(5)$             |               |
| +==============================+==============================+               |
| | c.  Given $f^{- 1}(4) = 1,$  | d.  Given $f^{- 1}(3) = 2,$  |               |
| |     find $f(1)$              |     find $f(2)$              |               |
| +------------------------------+------------------------------+               |
|                                                                               |
| - Recognise that $f$ and $f^{- 1}$ are reflections across $y = x$             |
|                                                                               |
| +------------------------------+------------------------------+               |
| | a.  The point (2, 7) lies on | b.  The point (3, 1) lies on |               |
| |     $f$. Write down the      |     $f⁻¹.$ Write down the    |               |
| |     coordinates of the       |     coordinates of the       |               |
| |     corresponding point on   |     corresponding point on   |               |
| |     $f⁻¹$.                   |     $f$.                     |               |
| +==============================+==============================+               |
+-------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Derivative of the inverse function.                                                                                      |
+====================================================================+=========================================================================+
| - Always use $f(x)$ and $f^{- 1}(x)$ to refer to your functions.\                                                                            |
|   Using $y =$... can make you lose track.                                                                                                    |
|                                                                                                                                              |
| We will investigate the **derivative of inverse functions.**                                                                                 |
|                                                                                                                                              |
| ![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image1.png){width="2.7555555555555555in"                   |
| height="2.729861111111111in"}                                                                                                                |
|                                                                                                                                              |
| Consider a linear function $f(x) = 2x + 5$.                                                                                                  |
|                                                                                                                                              |
| Find the inverse function and write it in terms of $x$.                                                                                      |
|                                                                                                                                              |
| $$f^{- 1}(x) =$$                                                                                                                             |
|                                                                                                                                              |
| Differentiate the inverse function.                                                                                                          |
|                                                                                                                                              |
| $$\left( f^{- 1} \right)'(x) =$$                                                                                                             |
|                                                                                                                                              |
| What do you notice about the gradient of $f^{- 1}(x)$ compared to the gradient of $f(x)$?\                                                   |
| \                                                                                                                                            |
| \                                                                                                                                            |
| Explain this in terms of the graph and the general equation $y = mx + c.$                                                                    |
|                                                                                                                                              |
| A function and its inverse are ........................ across $y = x$.                                                                      |
|                                                                                                                                              |
| We can do this by swapping ...... and ...... in the equation.                                                                                |
|                                                                                                                                              |
| Start with $y = mx + c$                                                                                                                      |
|                                                                                                                                              |
| Swapping: ..................                                                                                                                 |
|                                                                                                                                              |
| Rearrange for $y$: ..................                                                                                                        |
|                                                                                                                                              |
| The new line's gradient is: ...............                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Derivative of the inverse function.                                                                                      |
+----------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image2.png){width="3.124889545056868in"                    |
| height="3.0340507436570427in"}This rule extends beyond linear functions.                                                                     |
|                                                                                                                                              |
| Consider $f(x) = x^{5} + 2$.                                                                                                                 |
|                                                                                                                                              |
| Show that $f^{- 1}(x) = (x - 2)^{\frac{1}{5}}$                                                                                               |
|                                                                                                                                              |
| Hence find $\left( f^{- 1} \right)'(x)$                                                                                                      |
|                                                                                                                                              |
| Evaluate $f'(x)$ at $(1,3)$                                                                                                                  |
|                                                                                                                                              |
| Evaluate $\left( f' \right)^{- 1}(x)$ at $(3,1)$                                                                                             |
+----------------------------------------------------------------------------------------------------------------------------------------------+
| When a function is reflected across the line $y = x$ to produce its inverse, two things happen:                                              |
|                                                                                                                                              |
| 1.  Each point $(a,b)$ on the original curve maps to $(b,a)$ on the inverse.                                                                 |
|                                                                                                                                              |
| 2.  The tangent line at that point is also reflected; a line with gradient $m$ reflects to a line with gradient $\frac{1}{m}$. So, the       |
|     gradient of the tangent is its reciprocal.                                                                                               |
|                                                                                                                                              |
| This gives the inverse function derivative rule:                                                                                             |
|                                                                                                                                              |
| **For a point** $\left( \mathbf{x,y} \right)$ **on the inverse function:**                                                                   |
|                                                                                                                                              |
| $$\left( f^{- 1} \right)'(x) = \frac{1}{f'\left( f^{- 1}(x) \right)} = \frac{1}{f'(y)}$$                                                     |
|                                                                                                                                              |
| This is useful because you do not need to find an equation for derivative of the inverse function at all!                                    |
|                                                                                                                                              |
| **Example:**                                                                                                                                 |
|                                                                                                                                              |
| For $f(x) = x^{5} + 2$, the gradient of the tangent at the point $(3,1)$ on the inverse function is:                                         |
|                                                                                                                                              |
| $${\left( f^{- 1} \right)'(3) = \frac{1}{f'\left( f^{- 1}(3) \right)}                                                                        |
| }{= \frac{1}{f'(1)}                                                                                                                          |
| }{= \frac{1}{5}}$$                                                                                                                           |
+----------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Derivative of the inverse function.                                                                                      |
+----------------------------------------------------------------------------------------------------------------------------------------------+
| Alternative to                                                                                                                               |
|                                                                                                                                              |
| $$\left( f^{- 1} \right)'(x) = \frac{1}{f'\left( f^{- 1}(x) \right)} = \frac{1}{f'(y)}$$                                                     |
|                                                                                                                                              |
| is:                                                                                                                                          |
|                                                                                                                                              |
| $$\frac{dy}{dx} = \frac{1}{\frac{dx}{dy}}$$                                                                                                  |
|                                                                                                                                              |
| Where $\frac{dy}{dx}$ and $\frac{dx}{dy}$ refer to the derivatives of the inverse function $\left( f^{- 1} \right)'(x)$ and                  |
| $\left( f^{- 1} \right)'(y)$.                                                                                                                |
|                                                                                                                                              |
| See how this works with $f(x) = x^{5} + 2$.                                                                                                  |
+--------------------------------------------------------------------+-------------------------------------------------------------------------+
| **Using function notation**                                        | **Using** $\frac{\mathbf{dy}}{\mathbf{dx}}$ **notation**                |
|                                                                    |                                                                         |
| $${f(x) = x^{5} + 2                                                | $$y = x^{5} + 2                                                         |
| }{y = x^{5} + 2                                                    | $$                                                                      |
| }                                                                  |                                                                         |
| {x = y^{5} + 2                                                     | $$x = y^{5} + 2$$                                                       |
| }{y^{5} = x - 2                                                    |                                                                         |
| }{y = (x - 2)^{\frac{1}{5}}                                        | $${\frac{dy}{dx} = \frac{1}{\left( \frac{dx}{dy} \right)}               |
| }{f^{- 1}(x) = (x - 2)^{\frac{1}{5}}}$$                            | }{= \frac{1}{5y^{4}}}$$                                                 |
|                                                                    |                                                                         |
| $${\left( f^{- 1} \right)'(x) = \frac{1}{5}(x - 2)^{- \frac{4}{5}} | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{1}{5(x - 2)^{\frac{4}{5}}}$$ |
| }{= \frac{1}{5(x - 2)^{\frac{4}{5}}}                               |                                                                         |
| }{= \frac{1}{{5y}^{4}}}$$                                          | The $y$ refers to your inverse function, not your original.             |
|                                                                    |                                                                         |
|                                                                    | The $\frac{dy}{dx}$ and $\frac{dx}{dy}$ in the formula refers to the    |
|                                                                    | inverse, after you have swapped $x$ and $y!$                            |
+--------------------------------------------------------------------+-------------------------------------------------------------------------+
| - Mr Ding recommends using function notation.\                                                                                               |
|   All HSC questions so far have always used function notation.                                                                               |
+----------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| - **Derivative of Inverse Functions**                                 |
+=======================================================================+
| For a point $(x,y)$ on the inverse function:                          |
|                                                                       |
| $${\left( f^{- 1} \right)'(x) = \frac{1}{f'\left( f^{- 1}(x) \right)} |
| }{= \frac{1}{f'(y)}}$$                                                |
+-----------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Differentiate inverse function                                                                                                             |
+======================================================================+===================================================================================+
| a.  $f(x) = x^{3} - 1.$ Find the derivative of the inverse function.                                                                                     |
|                                                                                                                                                          |
| b.  Find the gradient of the tangent to the inverse function at $(7,2)$.                                                                                 |
+----------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| a\)                                                                  | b\) We can use result of (a) or the formula.                                      |
|                                                                      |                                                                                   |
| $${f(x) = y = x^{3} - 1                                              | $${\left( f^{- 1} \right)'(7) = \frac{1}{3}(7 + 1)^{- \frac{2}{3}} = \frac{1}{12} |
| }{x = y^{3} - 1                                                      | }{OR\ \ \ \ \ \left( f^{- 1} \right)'(7) = \frac{1}{f'\left( f^{- 1}(7) \right)}  |
| }{y^{3} = x + 1                                                      | }{\left( f^{- 1} \right)'(7) = \frac{1}{f'(2)}                                    |
| }{f^{- 1}(x) = (x + 1)^{\frac{1}{3}}                                 | }{= \frac{1}{3(2)^{2}}\ using\ f'(x) = 3x^{2}                                     |
| }{\left( f^{- 1} \right)'(x) = \frac{1}{3}(x + 1)^{- \frac{2}{3}}}$$ | }{= \frac{1}{12}}$$                                                               |
|                                                                      |                                                                                   |
|                                                                      | Note: it was possible to do part (b) without (a)                                  |
+----------------------------------------------------------------------+-----------------------------------------------------------------------------------+

+----------------------------------------------------------------------+
| - **Guided Practice**                                                |
+======================================================================+
| a.  $f(x) = \sqrt{x - 3}$. Find the derivative of the inverse        |
|     function.\                                                       |
|     Find the gradient of the tangent to the inverse function at      |
|     $(3,12)$ using two methods.                                      |
|                                                                      |
| $$\left( f^{- 1} \right)'(x) = 2x,\ \left( f^{- 1} \right)'(3) = 6$$ |
+----------------------------------------------------------------------+
| b.  Let $f(x) = x^{3} + 2x$. Find the gradient of the tangent to the |
|     inverse function at $(12,2).$                                    |
|                                                                      |
| $$\frac{1}{14}$$                                                     |
+----------------------------------------------------------------------+

Foundation

1.  Differentiate f⁻¹(x) given:

+--------------------------------------------------------------------+-------------------------------------------------------------+---------------------------------------+
| a.  $f(x) = \ e^{x}$                                               | b.  $f(x) = \ \ln\ x$                                       | c.  $f(x)\  = \ \sqrt{x}$             |
|                                                                    |                                                             |                                       |
| $$f^{- 1}(x) = \ln x$$                                             | $$f^{- 1}(x) = \ e^{x}$$                                    | $$f⁻¹(x)\  = \ x²$$                   |
|                                                                    |                                                             |                                       |
| $$\left( f^{- 1} \right)'(x) = \frac{1}{x}$$                       | $$(f⁻¹)'(x)\  = \ e^{x}$$                                   | $$\left( f^{- 1} \right)'(x) = \ 2x$$ |
+====================================================================+=============================================================+=======================================+
| d.  $f(x) = \ x^{7} - \ 1$                                         | e.  $\ f(x)\  = \ (x\  + \ 2)^{3}$                          |                                       |
|                                                                    |                                                             |                                       |
| $$f^{- 1}(x) = \sqrt[7]{x + 1}$$                                   | $$f^{- 1}(x) = \sqrt[3]{x} - 2$$                            |                                       |
|                                                                    |                                                             |                                       |
| $$\left( f^{- 1} \right)'(x) = \frac{1}{7^{7}\sqrt{(x + 1)^{6}}}$$ | $$\left( f^{- 1} \right)'(x) = \frac{1}{3\sqrt[3]{x^{2}}}$$ |                                       |
+--------------------------------------------------------------------+-------------------------------------------------------------+---------------------------------------+

2.  Find the gradient of the tangent to the inverse function at:

+------------------------------------------------------------------------------------------+-------------------------------------------------------------------+
| a.  (5, 1) given $f(x) = \ x^{3} + \ 4$                                                  | b.  (−1, 1) given $f(x) = \ 2x\  - \ 3$                           |
|                                                                                          |                                                                   |
| $$\left( f^{- 1} \right)'(x) = \frac{1}{f'(y)} = \frac{1}{f'(1)} = \frac{1}{3}$$         | $$\left( f^{- 1} \right)'( - 1) = \frac{1}{f'(1)} = \frac{1}{2}$$ |
+==========================================================================================+===================================================================+
| c.  (1, 0) given $f(x)\  = \ e^{3x}$                                                     | d.  (2, 5) given $f(x)\  = \ \sqrt{x\  - \ 1}$                    |
|                                                                                          |                                                                   |
| $$\left( f^{- 1} \right)'(1) = \frac{1}{f'(0)} = \frac{1}{3}$$                           | $$\left( f^{- 1} \right)'(2) = \frac{1}{f'(5)} = 4$$              |
+------------------------------------------------------------------------------------------+-------------------------------------------------------------------+
| e.  $\left( \frac{1}{9},\ 2 \right)$ given $f(x) = \frac{1}{x^{3} + \ 1}$                |                                                                   |
|                                                                                          |                                                                   |
| $$\left( f^{- 1} \right)'\left( \frac{1}{9} \right) = \frac{1}{f'(2)} = - \frac{27}{4}$$ |                                                                   |
+------------------------------------------------------------------------------------------+-------------------------------------------------------------------+

3.  a.  Find the derivative of the inverse function $f⁻¹$ given
        $f(x)\  = \ 4x³.$

$$y\  = \ f⁻¹(x)\  = \ \left( \frac{x}{4} \right)^{\frac{1}{3}}$$

$$\left( f^{- 1} \right)'(x) = \frac{1}{12}\sqrt[3]{\frac{16}{x^{2}}}$$

b.  The point (4, 1) lies on $f⁻¹$. Find the gradient of:

    i.  the tangent

$$\frac{1}{12}$$

ii. the normal at that point

$$- 12$$

Development

4.  a.  By restricting $f(x)$ to a monotonic increasing domain, find the
        inverse of $f(x) = \ x^{2} + \ 1.$

Restrict to $x\  \geq \ 0$ (monotonic increasing).

Swap $x$ and $y$:

$x\  = \ y²\  + \ 1$

$$y\  = \ \sqrt{x - 1}$$

$$f⁻¹(x)\  = \ \sqrt{x - 1}$$

b.  Find the derivative of the inverse function
    $\left( f^{- 1} \right)'(x).$

$$\left( f^{- 1} \right)'(x) = \frac{1}{2\sqrt{x - 1}}$$

c.  Given that (5, 2) lies on $f⁻¹,$ find the gradient of the tangent at
    this point.

$$\left( f^{- 1} \right)'(5) = \frac{1}{f'(2)} = \frac{1}{4}$$

5.  Find $\frac{dx}{dy}$ of the inverse function $f⁻¹(x)$ of each
    function in terms of $y$.

+------------------------------------------------------------------------+------------------------------------------------------------------+
| a.  $f(x)\  = \ x^{2}e^{x}$                                            | b.  $f(x)\  = \ 3x\ \sin\ 2x$                                    |
|                                                                        |                                                                  |
| $$x\  = \ y^{2}eʸ$$                                                    | $$x\  = \ 3y\ \sin\ 2y\ $$                                       |
|                                                                        |                                                                  |
| $$\frac{dx}{dy} = \ 2ye^{y}\  + \ y^{2}e^{y}\  = \ ye^{y}(2\  + \ y)$$ | $$\frac{dx}{dy} = \ 3\sin{2y} + \ 6y\cos{2y}$$                   |
+========================================================================+==================================================================+
| c.  $y\  = \ x(2x\  - \ 3)^{4}$                                        | d.  $f(x) =$ $\frac{3x\  - \ 1}{2x\  + \ 5}$                     |
|                                                                        |                                                                  |
| $$x\  = \ y(2y\  - \ 3)^{4}$$                                          | $$x\  = \frac{3y - 1}{2y + 5}$$                                  |
|                                                                        |                                                                  |
| $$\frac{dx}{dy} = (2y - 3)^{4} + y \cdot 4(2y - 3)^{3} \cdot 2\ $$     | $$\frac{dx}{dy} = \frac{3(2y + 5) - \ 2(3y - 1)}{(2y + 5)^{2}}$$ |
|                                                                        |                                                                  |
| $$= \ (2y - 3)^{3}(10y - 3)$$                                          | $$= \frac{17}{(2y + 5)^{2}}$$                                    |
+------------------------------------------------------------------------+------------------------------------------------------------------+
| e.  $y\  =$ $\frac{\ln\ x}{x\  + \ 2}$                                                                                                    |
|                                                                                                                                           |
| $$x\  = \frac{\ln\ y}{y + 2}$$                                                                                                            |
|                                                                                                                                           |
| $$\frac{dx}{dy} = \frac{\left( \frac{1}{y} \right)(y + 2) - \ \ln\ y}{(y + 2)^{2}} = \frac{y + 2 - y\ \ln\ y}{y(y + 2)^{2}}$$             |
+-------------------------------------------------------------------------------------------------------------------------------------------+

6.  Let $f(x) = x^{3} + 5x$.\
    Given $f(1) = 6,$ find $\left( f^{- 1} \right)'(6)$.

$$f'(x)\  = \ 3x²\  + \ 5$$

$$using\ \left( f^{- 1} \right)'(x) = \frac{1}{f'\left( f^{- 1}(x) \right)}$$

$$since\ f(1) = \ 6,\ f^{- 1}(6) = \ 1$$

$$\left( f^{- 1} \right)'(6) = \frac{1}{f'(1)} = \frac{1}{3(1)^{2} + \ 5} = \frac{1}{8}$$

7.  Find the gradient of the tangent at each point given on the inverse
    function of:

+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------+
| a.  $f(x)\  = \ (3x\  + \ 1)(x\  - \ 4)⁵$ at (−10, 3)                                                                         | b.  $y\  = \ (x\  - \ 3)\ \cos\ x$ at (−2, 0)           |
|                                                                                                                               |                                                         |
| $$f'(x)\  = \ (x - 4)^{4}(18x - 7)$$                                                                                          | $$f'(x) = \ cos\ x\  - \ (x - 3)sin\ x$$                |
|                                                                                                                               |                                                         |
| $$\left( f^{- 1} \right)'( - 10) = \frac{1}{f'(3)} = \frac{1}{47}$$                                                           | $$\left( f^{- 1} \right)'( - 2) = \frac{1}{f'(0)} = 1$$ |
+===============================================================================================================================+=========================================================+
| c.  $f(x) = \$ $\frac{x^{3}}{3x\  - \ 4}$ at (4, 2)                                                                           | d.  $y\  = \ x\ \ln\ x$ at (0, 1)                       |
|                                                                                                                               |                                                         |
| $$f'(x) = \frac{6x^{2}(x - 2)}{(3x - 4)^{2}}$$                                                                                | $$f'(x) = \ ln\ x\  + \ 1$$                             |
|                                                                                                                               |                                                         |
| $$\left( f^{- 1} \right)'(4) = \frac{1}{f'(2)} = undefined$$                                                                  | $$\left( f^{- 1} \right)'(0) = \frac{1}{f'(1)} = 1$$    |
+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------+
| e.  $y\  =$ $\frac{\sin\ 3x}{x^{2}}$ at $\left( - \frac{4}{\pi^{2}},\frac{\pi}{2} \right)$                                    |                                                         |
|                                                                                                                               |                                                         |
| $$f'(x) = \frac{3x\ cos\ 3x\  - \ 2\ sin\ 3x}{x^{3}}$$                                                                        |                                                         |
|                                                                                                                               |                                                         |
| $$\left( f^{- 1} \right)'\left( - \frac{4}{\pi^{2}} \right) = \frac{1}{f'\left( \frac{\pi}{2} \right)} = \frac{\pi^{3}}{16}$$ |                                                         |
+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------------------------------+

8.  $f(x) = \sqrt{x - 3} - 2$. Find the gradient of the inverse function
    at $x = - 5$.

$f(x)$ range: $\lbrack - 2,\ \infty)$

$f⁻¹(x)$ domain is range of $f(x):\lbrack - 2,\infty)$

$x\  = \  - 5$ is outside domain of $f⁻¹$

Gradient does not exist.

9.  Let $f(x)\  = \ \sqrt{x\  - \ 1}$ for $x\  \geq \ 1$.

    a.  Show that $f^{- 1}(x) = x^{2} + 1$ for $x \geq 0$.

$$y = \sqrt{x - 1}$$

Swap $x$ and $y$

$$x = \sqrt{y - 1}$$

$$x^{2} = y - 1$$

$$y = x^{2} + 1$$

New domain is range of original function

$$\therefore f^{- 1}(x) = x^{2} + 1\ for\ x \geq 0$$

b.  Find an expression for $(f⁻¹)'(x)$ using the formula
    $\left( f^{- 1} \right)'(x) =$
    $\frac{1}{f'\left( f^{- 1}(x) \right)}$.

$$f'(x) = \frac{1}{2\sqrt{x - 1}}$$

$$\left( f^{- 1} \right)'(x) = \frac{1}{f'\left( f^{- 1}(x) \right)} = \frac{1}{f'\left( x^{2} + \ 1 \right)} = \frac{1}{\frac{1}{2\sqrt{\left( x^{2} + 1 \right) - 1}}} = \ 2x$$

c.  Verify your result in part (a) by finding $(f⁻¹)'(x)$ directly from
    the equation.

$$f^{- 1}(x) = \ x^{2} + \ 1$$

$$\frac{d}{dx}\left( x^{2} + \ 1 \right) = \ 2x$$

# Derivative of Inverse Trigonometric Functions

+-------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Derivative of $\sin^{- 1}{}\$and $\cos^{- 1}{}$                                               |
+=====================================================================+=============================================+
| We will investigate the **derivative of inverse trigonometric functions.**                                        |
|                                                                                                                   |
| Read the proof of $y = \sin^{- 1}x$ on the left and do the same for $y = \cos^{- 1}x$ and $y = \tan^{- 1}x$.      |
+---------------------------------------------------------------------+---------------------------------------------+
| $${y = \sin^{- 1}x\ for\  - \frac{\pi}{2} \leq x \leq \frac{\pi}{2} | $$y = \cos^{- 1}x\ for\ 0 \leq x \leq \pi$$ |
| }{\sin y = x\ for - \frac{\pi}{2} \leq y \leq \frac{\pi}{2}         |                                             |
| }{\frac{dx}{dy} = \cos y                                            |                                             |
| }{\frac{dy}{dx} = \frac{1}{\cos y}}$$                               |                                             |
|                                                                     |                                             |
| We want to change $\cos y$ to an expression in terms of $x$. Since  |                                             |
| $x = \sin y$, we first write $\cos y$ in terms of $\sin y$.         |                                             |
|                                                                     |                                             |
| $${\sin^{2}y + \cos^{2}y = 1                                        |                                             |
| }{\cos y = \pm \sqrt{1 - \sin^{2}y}                                 |                                             |
| }{= \pm \sqrt{1 - x^{2}}}$$                                         |                                             |
|                                                                     |                                             |
| $$since\  - \frac{\pi}{2} \leq y \leq \frac{\pi}{2},\cos y \geq 0$$ |                                             |
|                                                                     |                                             |
| $${\therefore\cos y = \sqrt{1 - x^{2}}                              |                                             |
| }{\therefore\frac{dy}{dx} = \frac{1}{\sqrt{1 - x^{2}}}}$$           |                                             |
+---------------------------------------------------------------------+---------------------------------------------+
| $y = \tan^{- 1}x$                                                                                                 |
+-------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------+
| - **Derivative of Inverse Trig Functions**                                                                             |
+=========================================+===========================================+==================================+
| $${f(x) = \sin^{- 1}x                   | $${f(x) = \cos^{- 1}x                     | $${f(x) = \tan^{- 1}x            |
| }{f'(x) = \frac{1}{\sqrt{1 - x^{2}}}}$$ | }{f'(x) = - \frac{1}{\sqrt{1 - x^{2}}}}$$ | }{f'(x) = \frac{1}{1 + x^{2}}}$$ |
+-----------------------------------------+-------------------------------------------+----------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------+
| - **Differentiate** Inverse trigonometric functions                                                                                         |
+=========================================+==============================================+====================================================+
| $${f(x) = 2\sin^{- 1}x                  | $${f(x) = \frac{3\cos^{- 1}x}{4}             | $${f(x) = - \frac{\tan^{- 1}x}{5}                  |
| }{f'(x) = \frac{2}{\sqrt{1 - x^{2}}}}$$ | }{f'(x) = - \frac{3}{4\sqrt{1 - x^{2}}}\ }$$ | }{f'(x) = - \frac{1}{5\left( 1 + x^{2} \right)}}$$ |
+-----------------------------------------+----------------------------------------------+----------------------------------------------------+
| Find the derivative of these functions:                                                                                                     |
+-----------------------------------------+----------------------------------------------+----------------------------------------------------+
| a.  $f(x) = 3\cos^{- 1}x$               | b.  $f(x) =$ $\frac{\sin^{- 1}x}{2}$         | c.  $f(x) = - \tan^{- 1}x$                         |
+-----------------------------------------+----------------------------------------------+----------------------------------------------------+
| d.  $f(x) = \cos^{- 1}(x) + 3$          | e.  $f(x) = - 2\cos^{- 1}x$                  | f.  $f(x) =$ $\frac{5\sin^{- 1}x}{3}$              |
+-----------------------------------------+----------------------------------------------+----------------------------------------------------+

+----------------------------------------------------------------------------------------------------------+
| - **Example** Differentiate inverse trigonometric functions                                              |
+==========================================================+===============================================+
| $$\ y = x\tan^{- 1}x$$                                   | $$\ y = 4\sin^{- 1}x + 3x^{5}$$               |
|                                                          |                                               |
| $${y' = u'v + uv'                                        | $$y' = \frac{4}{\sqrt{1 - x^{2}}} + 15x^{4}$$ |
| }{= (1)\tan^{- 1}x + x\left( \frac{1}{1 + x^{2}} \right) |                                               |
| }{= \tan^{- 1}x + \frac{x}{1 + x^{2}}}$$                 |                                               |
+----------------------------------------------------------+-----------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                                                                                                                                    |
+===================================================================================+============================================+============================================+============================================================================+
| Differentiate                                                                                                                                                                                                                                            |
+--------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| a.  $y = \$ $\frac{\tan^{- 1}x}{x}$                                                                                            | b.  $y = x\cos^{- 1}x$                                                                                                  |
+--------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| - **Chain Rule for Inverse Trig Functions**                                                                                                                                                                                                              |
+-----------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------+----------------------------------------------------------------------------+
| $${y = \sin^{- 1}{f(x)}                                                           | $${y = \cos^{- 1}{f(x)}                                                                 | $${y = \tan^{- 1}{f(x)}                                                    |
| }{\frac{dy}{dx} = \frac{f'(x)}{\sqrt{1 - \left\lbrack f(x) \right\rbrack^{2}}}}$$ | }{\frac{dy}{dx} = - \frac{f'(x)}{\sqrt{1 - \left\lbrack f(x) \right\rbrack^{2}}}}$$     | }{\frac{dy}{dx} = \frac{f'(x)}{1 + \left\lbrack f(x) \right\rbrack^{2}}}$$ |
+-----------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------+----------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------+
| - **Example** Differentiate inverse trigonometric functions using chain rule                                           |
+=============================================================+==========================================================+
| $$\ \ y = \cos^{- 1}(5x - 1)$$                              | $$\ \ y = \sin^{- 1}\left( 3x^{2} \right)$$              |
|                                                             |                                                          |
| $${y' = - \frac{5}{\sqrt{1 - (5x - 1)^{2}}}                 | $$y' = \frac{6x}{\sqrt{1 - \left( 3x^{2} \right)^{2}}}$$ |
| }{= - \frac{5}{\sqrt{1 - \left( 25x^{2} - 10x + 1 \right)}} |                                                          |
| }{= - \frac{5}{\sqrt{- 25x^{2} + 10x}}}$$                   | $$\ \ \ \ \  = \frac{6x}{\sqrt{1 - 9x^{4}}}$$            |
+-------------------------------------------------------------+----------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                      |
+========================================================+===================================================+
| Differentiate:                                                                                             |
+--------------------------------------------------------+---------------------------------------------------+
| a.  $y = \sin^{- 1}(3x + 1)$                           | b.  $y = \cos^{- 1}\left( \frac{x}{7} \right)$    |
|                                                        |                                                   |
| $$\frac{dy}{dx} = \frac{3}{\sqrt{1 - (3x + 1)^{2}}}$$  | $$\frac{dy}{dx} = - \frac{1}{\sqrt{49 - x^{2}}}$$ |
+--------------------------------------------------------+---------------------------------------------------+
| c.  $y = \sin^{- 1}\left( 5x^{3} \right)$              | d.  $y = \tan^{- 1}\left( e^{2x} \right)$         |
|                                                        |                                                   |
| $$\frac{dy}{dx} = \frac{15x^{2}}{\sqrt{1 - 25x^{6}}}$$ | $$\frac{dy}{dx} = \frac{2e^{2x}}{1 + e^{4x}}$$    |
+--------------------------------------------------------+---------------------------------------------------+

Foundation

1.  Differentiate with respect to $x$:

+---------------------------------------------+----------------------------------------------------+---------------------------------------+
| a.  $\cos^{- 1}x$                           | b.  $\ \tan ⁻¹\ x$                                 | c.  $\sin^{- 1}2x$                    |
|                                             |                                                    |                                       |
| $$- \frac{1}{\sqrt{1\  - \ x^{2}}}$$        | $$\frac{1}{1\  + \ x^{2}}$$                        | $$\frac{2}{\sqrt{1\  - \ 4x^{2}}}$$   |
+=============================================+====================================================+=======================================+
| d.  $\tan ⁻¹\ 3x$                           | e.  $\ \cos ⁻¹\ 5x$                                | f.  $\sin ⁻¹\ ( - x)$                 |
|                                             |                                                    |                                       |
| $$\frac{3}{1\  + \ 9x^{2}}$$                | $$- \frac{5}{\sqrt{1\  - \ 25x^{2}}}$$             | $$- \frac{1}{\sqrt{1\  - \ x^{2}}}$$  |
+---------------------------------------------+----------------------------------------------------+---------------------------------------+
| g.  $\sin ⁻¹\ x²$                           | h.  $\ \tan ⁻¹\ x³$                                | i.  $\tan ⁻¹\ (x\  + \ 2)$            |
|                                             |                                                    |                                       |
| $$\frac{2x}{\sqrt{1\  - \ x^{4}}}$$         | $$\frac{3x^{2}}{1\  + \ x^{6}}$$                   | $$\frac{1}{x^{2} + \ 4x\  + \ 5}$$    |
+---------------------------------------------+----------------------------------------------------+---------------------------------------+
| j.  $\cos ⁻¹\ (1\  - \ x)$                  | k.  $\ x\ sin⁻¹\ x$                                | l.  $(1\  + \ x²)\ tan⁻¹\ x$          |
|                                             |                                                    |                                       |
| $$\frac{1}{\sqrt{2x\  - \ x^{2}}}$$         | $$\sin^{- 1}x\  + \frac{x}{\sqrt{1\  - \ x^{2}}}$$ | $$2x\ \tan^{- 1}x\  + \ 1$$           |
+---------------------------------------------+----------------------------------------------------+---------------------------------------+
| m.  $\sin^{- 1}\left( \frac{1}{5}x \right)$ | n.  $\ \tan^{- 1}\left( \frac{x}{4} \right)$       | o.  $\cos^{- 1}\sqrt{x}$              |
|                                             |                                                    |                                       |
| $$\frac{1}{\sqrt{25\  - \ x^{2}}}$$         | $$\frac{4}{16\  + \ x^{2}}$$                       | $$- \frac{1}{2\sqrt{x}\sqrt{1 - x}}$$ |
+---------------------------------------------+----------------------------------------------------+---------------------------------------+
| p.  $\tan^{- 1}\sqrt{x}$                    | q.  $\ \tan^{- 1}\left( \frac{1}{x} \right)$       |                                       |
|                                             |                                                    |                                       |
| $$\frac{1}{2(1\  + \ x)\sqrt{x}}$$          | $$- \frac{1}{1\  + \ x^{2}}$$                      |                                       |
+---------------------------------------------+----------------------------------------------------+---------------------------------------+

2.  Find the gradient of the tangent to each curve at the point
    indicated:

+--------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------+
| a.  $y = 2\ tan⁻¹\ x,\ \ at\ x = \ 0$                                    | b.  $y = \sqrt{3}\sin^{- 1}x,\ \ at\ x = \frac{1}{2}$                                                           |
|                                                                          |                                                                                                                 |
| $$\frac{dy}{dx} = \frac{2}{1\  + \ x^{2}}$$                              | $$\frac{dy}{dx} = \frac{\sqrt{3}}{\sqrt{1\  - \ x^{2}}}$$                                                       |
|                                                                          |                                                                                                                 |
| $$at\ x\  = \ 0:\frac{dy}{dx} = \ 2$$                                    | $$at\ x\  = \frac{1}{2}:\frac{dy}{dx} = \frac{\sqrt{3}}{\sqrt{\frac{3}{4}}} = \ 2$$                             |
+==========================================================================+=================================================================================================================+
| c.  $y = tan⁻¹\ 2x,\ \ at\ x = - \frac{1}{2}$                            | d.  $y = \cos^{- 1}\left( \frac{x}{2} \right),\ \ at\ x = \sqrt{3}$                                             |
|                                                                          |                                                                                                                 |
| $$\frac{dy}{dx} = \frac{2}{1\  + \ 4x^{2}}$$                             | $$\frac{dy}{dx} = \  - \frac{\frac{1}{2}}{\sqrt{1\  - \frac{x^{2}}{4}}} = \  - \frac{1}{\sqrt{4\  - \ x^{2}}}$$ |
|                                                                          |                                                                                                                 |
| $$at\ x\  = \  - \frac{1}{2}:\frac{dy}{dx} = \frac{2}{1\  + \ 1} = \ 1$$ | $$at\ x\  = \ \sqrt{3}:\frac{dy}{dx} = \  - \frac{1}{\sqrt{4\  - \ 3}} = \  - 1$$                               |
+--------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------+

3.  Find, in the form $y = mx + b$, the equation of the tangent and the
    normal to each curve at the point indicated:

+------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------+
| a.  $y\  = \ 2\ \cos ⁻¹\ 3x,\ at\ x\  = \ 0$                                       | b.  $y\  = \ sin^{- 1}\left( \frac{x}{2} \right),\ at\ x\  = \ \sqrt{2}$                                                         |
|                                                                                    |                                                                                                                                  |
| $$\frac{dy}{dx} = \  - \frac{6}{\sqrt{1\  - \ 9x^{2}}}$$                           | $$\frac{dy}{dx} = \frac{\frac{1}{2}}{\sqrt{1\  - \frac{x^{2}}{4}}} = \frac{1}{\sqrt{4\  - \ x^{2}}}$$                            |
|                                                                                    |                                                                                                                                  |
| $$at\ x\  = \ 0:\ \ \ \frac{dy}{dx} = \  - 6,\ \ y\  = \ 2\ cos^{- 1}0\  = \ \pi$$ | $$at\ x\  = \ \sqrt{2}:\frac{dy}{dx} = \frac{1}{\sqrt{2}},\ y\  = \ sin^{- 1}\left( \frac{\sqrt{2}}{2} \right) = \frac{\pi}{4}$$ |
|                                                                                    |                                                                                                                                  |
| $$Tangent:\ y\  = \  - 6x\  + \ \pi$$                                              | $$Tangent:\ y\  = \ \frac{1}{\sqrt{2}}x\  + \frac{\pi}{4} - \ 1$$                                                                |
|                                                                                    |                                                                                                                                  |
| $$Normal:\ y\  = \frac{x}{6}\  + \ \pi$$                                           | $$Normal:\ y\  = \  - \sqrt{2}x\  + \frac{\pi}{4} + \ 2$$                                                                        |
+====================================================================================+==================================================================================================================================+

4.  a.  Show that
        $\frac{d}{dx}\left( sin^{- 1}x\  + \ cos^{- 1}x \right) = \ 0$.

$$\frac{d}{dx}\left( sin^{- 1}x\  + \ cos^{- 1}x \right) = \frac{1}{\sqrt{1\  - \ x^{2}}} + \ \left( - \frac{1}{\sqrt{1\  - \ x^{2}}} \right) = \ 0\ $$

b.  Hence explain why $\sin ⁻¹\ x\$+ $\cos ⁻¹\ x$ is a constant
    function, and use any convenient value of x in its domain to find
    the value of the constant.

Since the derivative is 0 everywhere on the domain, the function is
constant.

$$At\ x\  = \ 0:\ \sin^{- 1}0\  + \ \cos^{- 1}0\  = \ 0\  + \frac{\pi}{2} = \frac{\pi}{2}.$$

c.  Explain, using a right-angled triangle, why this is true.

Consider a right-angled triangle with acute angle $\theta$, where
$\sin\theta = x$. Then $\theta = \sin^{- 1}x$

Then the other acute angle would be $\cos^{- 1}x$

$\sin^{- 1}x$ and $\cos^{- 1}x$ represent the two acute angles in a
right-angled triangle, they must sum to 90°, or $\frac{\pi}{2}$

5.  Use the method of the previous question to find the value of
    $\cos ⁻¹\ x\  + \ \cos ⁻¹\ ( - x)$

$$\frac{d}{dx}\left( cos^{- 1}x\  + \ cos^{- 1}( - x) \right) = \  - \frac{1}{\sqrt{1\  - \ x^{2}}} + \frac{1}{\sqrt{1\  - \ x^{2}}} = \ 0,\ so\ constant.$$

$$At\ x\  = \ 0:\ cos^{- 1}0\  + \ cos^{- 1}0\  = \frac{\pi}{2} + \frac{\pi}{2} = \ \pi.$$

6.  a.  If
        $f(x) = \ x\ \tan^{- 1}x\  - \frac{1}{2}\ln\left( 1\  + \ x^{2} \right),$
        show that $f^{''}(x) =$ $\frac{1}{1\  + \ x^{2}}$.

$$f(x) = \ x\ \tan^{- 1}x\  - \frac{1}{2}\ln\left( 1\  + \ x^{2} \right)$$

$$f'(x) = \ tan^{- 1}x\  + \frac{x}{1\  + \ x^{2}} - \frac{x}{1\  + \ x^{2}} = \ tan^{- 1}x$$

$$f^{''}(x) = \frac{1}{1\  + \ x^{2}}$$

b.  Is the graph of $y = f(x)$ concave up or concave down at $x = - 1$?

$$f^{''}( - 1) = \frac{1}{1\  + \ 1} = \frac{1}{2} > \ 0,\ so\ concave\ up\ at\ x\  = \  - 1.$$

7.  Show that the gradient of the curve $y\  =$ $\frac{sin^{- 1}x}{x}$
    at the point where
    $x\  = \frac{1}{2}\ is\frac{2}{3}\left( 2\sqrt{3} - \ \pi \right).$

$$y\  = \frac{sin^{- 1}x}{x};\ quotient\ rule:$$

$$\frac{dy}{dx} = \frac{\frac{x}{\sqrt{1\  - \ x^{2}}} - \ sin^{- 1}x}{x^{2}}$$

$$At\ x\  = \frac{1}{2}:\ sin^{- 1}\left( \frac{1}{2} \right) = \frac{\pi}{6},\ \sqrt{1\  - \frac{1}{4}} = \frac{\sqrt{3}}{2}$$

$$\frac{dy}{dx} = \frac{\frac{\frac{1}{2}}{\frac{\sqrt{3}}{2}} - \frac{\pi}{6}}{\frac{1}{4}} = \ \left( \frac{1}{\sqrt{3}} - \frac{\pi}{6} \right)(4) = \frac{4}{\sqrt{3}} - \frac{2\pi}{3}$$

$$= \ 4\frac{\sqrt{3}}{3} - \frac{2\pi}{3} = \ \left( \frac{2}{3} \right)\left( 2\sqrt{3} - \ \pi \right)$$

8.  Find the derivative of each function in simplest form:

+--------------------------------------------------------------------+------------------------------------------------------------------------+-------------------------------------------------------------+
| a.  $x\ cos⁻¹\ x\  - \ \sqrt{1\  - \ x^{2}}$                       | b.  $\ \sin^{- 1}e^{3x}$                                               | c.  $\sin^{- 1}\left( \frac{2x\  - \ 3}{4} \right)$         |
|                                                                    |                                                                        |                                                             |
| $$\cos^{- 1}x$$                                                    | $$\frac{3e^{3x}}{\sqrt{1\  - \ e^{6x}}}$$                              | $$\frac{2}{\sqrt{7\  + \ 12x\  - \ 4x^{2}}}$$               |
+====================================================================+========================================================================+=============================================================+
| d.  $\tan^{- 1}\left( \frac{1}{1\  - \ x} \right)$                 | e.  $\ \sin ⁻¹\ eˣ$                                                    | f.  $\log_{e}\sqrt{\sin^{- 1}x}$                            |
|                                                                    |                                                                        |                                                             |
| $$\frac{1}{x^{2} - \ 2x\  + \ 2}$$                                 | $$\frac{eˣ}{\sqrt{1\  - \ e^{2x}}}$$                                   | $$\frac{1}{2\sqrt{1\  - \ x^{2}}}\sin^{- 1}x\ $$            |
+--------------------------------------------------------------------+------------------------------------------------------------------------+-------------------------------------------------------------+
| g.  $\sin^{- 1}\sqrt{\log_{e}x}$                                   | h.  $\ \sqrt{x}\ \sin^{- 1}\sqrt{1\  - \ x}$                           | i.  $\tan^{- 1}\left( \frac{x\  + \ 2}{1\  - \ 2x} \right)$ |
|                                                                    |                                                                        |                                                             |
| $$\frac{1}{2x\sqrt{\log_{e}x\ \left( 1\  - \ \log_{e}x \right)}}$$ | $$\frac{\sin^{- 1}\sqrt{1 - x}}{2\sqrt{x}} - \frac{1}{2\sqrt{1 - x}}$$ | $$\frac{5}{(1 - 2x)^{2}}$$                                  |
+--------------------------------------------------------------------+------------------------------------------------------------------------+-------------------------------------------------------------+

9.  Consider the function $f(x)\  = \ \cos ⁻¹\ x²$.

    a.  What is the domain of $f(x)$?

Domain: $- 1\  \leq \ x\  \leq \ 1$ ($f$ is even)

b.  About which line is the graph of $y\  = \ f(x)$ symmetric?

Symmetric about the $y$-axis, since $f$ is even.

c.  Find $f'(x)$.

$$f'(x)\  = \  - \frac{2x}{\sqrt{1\  - \ x^{4}}}$$

d.  Show that $y\  = \ f(x)$ has a maximum turning point at $x\  = \ 0$.

$f'(0)\  = \ 0$. For $x\  < \ 0,\ f'(x)\  > \ 0$; for
$x\  > \ 0,\ f'(x)\  < \ 0$.

∴ maximum turning point at $x\  = \ 0$.
$\left( f(0) = \ cos^{- 1}0\  = \frac{\pi}{2} \right)$

e.  Show that $f'(x)$ is undefined at the endpoints of the domain.\
    What is the geometrical significance of this?

At $x\  = \  \pm 1:$ denominator $\sqrt{1\  - \ x^{4}} = \ 0$, so
$f'(x)$ undefined. Geometrically, the tangent is vertical at the
endpoints.

f.  ![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image3.png){width="1.4937160979877515in"
    height="1.5748031496062993in"}Sketch the graph of$\ y\  = \ f(x)$.

<!-- -->

10. Use chain-rule to differentiate:

+-----------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------+
| a.  $tan^{- 1}e^{3x}$                                                                   | b.  $\sin ⁻¹\ x³$                                                                            | c.  $\cos^{- 1}\left( log_{e}x \right)$                                                                                    |
|                                                                                         |                                                                                              |                                                                                                                            |
| $$u\  = \ e^{3x},\frac{du}{dx} = \ 3e^{3x}$$                                            | $$u\  = \ x^{3},\frac{du}{dx} = \ 3x^{2}$$                                                   | $$u\  = \ log_{e}x,\frac{du}{dx} = \frac{1}{x}$$                                                                           |
|                                                                                         |                                                                                              |                                                                                                                            |
| $$y = \tan^{- 1}u,\frac{dy}{du} = \frac{1}{1 + u^{2}}$$                                 | $$y = \sin^{- 1}u,\frac{dy}{du} = \frac{1}{\sqrt{1 - u^{2}}}$$                               | $$y = \cos^{- 1}u,\frac{dy}{du} = - \frac{1}{\sqrt{1 - u^{2}}}$$                                                           |
|                                                                                         |                                                                                              |                                                                                                                            |
| $$\frac{dy}{dx} = \frac{dy}{du} \times \frac{du}{dx} = \frac{3e^{3x}}{1\  + \ e^{6x}}$$ | $$\frac{dy}{dx} = \frac{dy}{du} \times \frac{du}{dx} = \frac{3x^{2}}{\sqrt{1\  - \ x^{6}}}$$ | $$\frac{dy}{dx} = \frac{dy}{du} \times \frac{du}{dx} = \frac{- \frac{1}{x}}{\sqrt{1\  - \ \left( \log_{e}x \right)^{2}}}$$ |
|                                                                                         |                                                                                              |                                                                                                                            |
|                                                                                         |                                                                                              | $$= \  - \frac{1}{x\sqrt{1\  - \ \left( \log_{e}x \right)^{2}}}$$                                                          |
+=========================================================================================+==============================================================================================+============================================================================================================================+

11. ![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image4.png){width="1.5042760279965004in"
    height="1.6948173665791777in"}A picture $TB$ that is 1 metre tall is
    hung on a wall\
    so that its bottom edge $B$ is 3 metres above the eye $E$ of a
    viewer.\
    Let the distance $EP$ be $x$ metres, and\
    let $\theta$ be the angle that the picture subtends at $E$.

    a.  Show that
        $\theta\  = \ tan^{- 1}\left( \frac{4}{x} \right) - \ tan^{- 1}\left( \frac{3}{x} \right)$.

From the diagram, angle to top of picture =
$tan^{- 1}\left( \frac{4}{x} \right)$ (opposite = 3 + 1 = 4), angle to
bottom = $tan^{- 1}\left( \frac{3}{x} \right).$

$$\theta\  = \ tan^{- 1}\left( \frac{4}{x} \right) - \ tan^{- 1}\left( \frac{3}{x} \right)$$

b.  Show that $\theta$ is maximised when the viewer is $2\sqrt{3}$
    metres from the wall.

$$\frac{d\theta}{dx} = \  - \frac{4}{x^{2} + \ 16} + \frac{3}{x^{2} + \ 9}$$

$$Set\frac{d\theta}{dx} = \ 0\ and\ cross\ multiply$$

$$3\left( x^{2} + \ 16 \right) = \ 4\left( x^{2} + \ 9 \right)\ $$

$$3x^{2} + \ 48\  = \ 4x^{2} + \ 36$$

$$x^{2} = \ 12$$

$$x\  = \ 2\sqrt{3}\ $$

c.  Show that the maximum angle subtended by the picture at $E$ is
    $tan^{- 1}\left( \frac{\sqrt{3}}{12} \right)$.

$$At\ x\  = \ 2\sqrt{3}:\ \theta\  = \ tan^{- 1}\left( \frac{4}{2\sqrt{3}} \right) - \ tan^{- 1}\left( \frac{3}{2\sqrt{3}} \right)\ $$

$$= \ tan^{- 1}\left( \frac{2}{\sqrt{3}} \right) - \ tan^{- 1}\left( \frac{\sqrt{3}}{2} \right)$$

$$Take\ tan\ of\ both\ sides\ and\ use\ compound\ angle\ rule:\ $$

$$\tan\ \theta\  = \frac{\frac{2}{\sqrt{3}} - \frac{\sqrt{3}}{2}}{1\  + \ \left( \frac{2}{\sqrt{3}} \right)\left( \frac{\sqrt{3}}{2} \right)} = \frac{\sqrt{3}}{12}$$

$$\therefore\ \theta\  = \ \tan^{- 1}\left( \frac{\sqrt{3}}{12} \right)$$

12. ![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image5.png){width="1.9787489063867016in"
    height="1.0411745406824147in"}A plane $P$ at a constant altitude of
    6 km and at a constant speed of 600 km/h is flying directly away
    from an observer at $O$ on the ground.\
    The point $A$ on the path of the plane lies directly above $O$.\
    Let the distance $AP$ be $x$ km, and\
    let $\theta$ be the angle of elevation of the plane from the
    observer.

    a.  Show that $\theta\  = \ tan^{- 1}\left( \frac{6}{x} \right).$

From the diagram,
$\tan\ \theta\  = \frac{6}{x},\ so\ \theta\  = \ tan^{- 1}\left( \frac{6}{x} \right)$

b.  Show that $\frac{d\theta}{dt}$ $= \$ $- \frac{3600}{x^{2} + \ 36}$
    radians per hour.

$$\frac{d\theta}{dx} = \frac{- \frac{6}{x^{2}}}{1\  + \frac{36}{x^{2}}} = \  - \frac{6}{x^{2} + \ 36}$$

$x\  = \ 600t\$(km, $t$ in hours), so $\frac{dx}{dt} = \ 600$

$$\frac{d\theta}{dt} = \frac{d\theta}{dx} \cdot \frac{dx}{dt} = \  - \frac{6}{x^{2} + \ 36} \cdot \ 600\  = \  - \frac{3600}{x^{2} + \ 36}$$

c.  Hence find, in radians per second, the rate at which $\theta$ is
    decreasing at the instant when the distance $AP$ is 3 km.

$$At\ x\  = \ 3:\frac{d\theta}{dt} = \  - \frac{3600}{9\  + \ 36} = \  - \frac{3600}{45} = \  - 80\ rad/hr$$

$$Convert:\  - \frac{80}{3600} = \  - \frac{1}{45}\ rad/s$$

$$Rate\ of\ decrease\  = \frac{1}{45}\ rad/s.\ $$

13. a.  State the domain of
        $f(x)\  = \ \tan ⁻¹\ x\  + \ \tan^{- 1}\left( \frac{1}{x} \right),$
        and its symmetry.

Domain: $x\  \neq \ 0$ ($f$ is odd)

b.  Show that $f'(x)\  = \ 0$ for all values of $x$ in the domain.

$f'(x) = \frac{1}{1\  + \ x^{2}} + \frac{- \frac{1}{x^{2}}}{1\  + \frac{1}{x^{2}}} = \frac{1}{1\  + \ x^{2}} - \frac{1}{x^{2} + \ 1} = \ 0$

c.  ![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image6.png){width="1.8607556867891513in"
    height="1.7750623359580053in"}Show that
    $f(x)\  = \ \left\{ \frac{\pi}{2}for\ x\  < \ 0,\  - \frac{\pi}{2}for\ x\  > \ 0 \right\},$
    and hence sketch the graph of $f(x).$

$f'(x)\  = \ 0$ means $f$ is constant on $x\  > \ 0$ and constant on
$x\  < \ 0$ separately.

$$At\ x\  = \ 1:\ f(1) = \ tan^{- 1}1\  + \ tan^{- 1}1\  = \frac{\pi}{4} + \frac{\pi}{4} = \frac{\pi}{2}$$

$$f(x) = \frac{\pi}{2}for\ x\  > \ 0.$$

$$At\ x\  = \  - 1:\ f( - 1) = \ \tan^{- 1}( - 1) + \ \tan^{- 1}( - 1) = \  - \frac{\pi}{4} - \frac{\pi}{4} = \  - \frac{\pi}{2},\ $$

$$f(x) = \  - \frac{\pi}{2}for\ x\  < \ 0.$$

$$\therefore\ f(x)\  = \ \left\{ \frac{\pi}{2}for\ x\  > \ 0,\  - \frac{\pi}{2}for\ x\  < \ 0 \right\}$$

# Integrating to Inverse Trigonometric Functions

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Integrating to Inverse Trig Functions**                                                                                                                                                |
+============================================================================================================================================================================================+
| $${\int_{}^{}\frac{1}{\sqrt{1 - x^{2}}}dx = \sin^{- 1}x + C                                                                                                                                |
| }{\int_{}^{}{- \frac{1}{\sqrt{1 - x^{2}}}}dx = \cos^{- 1}x + C                                                                                                                             |
| }{\int_{}^{}\frac{1}{1 + x^{2}}dx = \tan^{- 1}x + C}$$                                                                                                                                     |
|                                                                                                                                                                                            |
| - When evaluating definite integrals, remember range restrictions: (just use calculator)\                                                                                                  |
|   $$- \frac{\pi}{2} \leq \sin^{- 1}x \leq \frac{\pi}{2}\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ 0 \leq \cos^{- 1}x \leq \pi\ \ \ \ \ \ \ \ \ \  - \frac{\pi}{2} \leq \tan^{- 1}x \leq \frac{\pi}{2}$$ |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Integrating to inverse trig functions                                                                                                                   |
+=====================================================================================+=================================================================================+
| $${\int_{}^{}\frac{2}{\sqrt{1 - x^{2}}}dx = 2\int_{}^{}\frac{1}{\sqrt{1 - x^{2}}}dx | $${\int_{0}^{4}\frac{1}{1 + x^{2}}dx = \left\lbrack \ \tan^{- 1}x\begin{matrix} |
| }{= 2\sin^{- 1}x}$$                                                                 | \  \\                                                                           |
|                                                                                     | \  \\                                                                           |
|                                                                                     | \                                                                               |
|                                                                                     | \end{matrix} \right\rbrack_{1}^{4}                                              |
|                                                                                     | }{= \tan^{- 1}4 - \tan^{- 1}(1)                                                 |
|                                                                                     | }{\approx 0.54}$$                                                               |
+-------------------------------------------------------------------------------------+---------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                  |
+====================================================================+===================================================+
| a.                                                                 | b.                                                |
|                                                                    |                                                   |
| $$\ \ \ \ \ \int_{}^{}\frac{3}{\sqrt{1 - x^{2}}}dx$$               | $$\ \ \ \ \ \int_{}^{}\frac{1}{3 + 3x^{2}}dx$$    |
|                                                                    |                                                   |
| $$3\sin^{- 1}(x) + C$$                                             | $$\frac{1}{3}\tan^{- 1}(x) + C$$                  |
+--------------------------------------------------------------------+---------------------------------------------------+
| c.  Integrate this as $\sin^{- 1}{}$ and $\cos^{- 1}{}$ and show   | d.                                                |
|     you get the same result.                                       |                                                   |
|                                                                    | $$\ \ \ \ \ \int_{0}^{1}\frac{5}{1 + x^{2}}dx$$   |
| $$\ \ \ \ \int_{0}^{\frac{1}{2}}{- \frac{1}{\sqrt{1 - x^{2}}}}dx$$ |                                                   |
|                                                                    | $$\frac{5\pi}{4}$$                                |
| $$- \frac{\pi}{6}$$                                                |                                                   |
+--------------------------------------------------------------------+---------------------------------------------------+
| - **Reverse Chain Rule for Integrating to Inverse Trig Functions**                                                     |
+------------------------------------------------------------------------------------------------------------------------+
| $${\int_{}^{}\frac{f'(x)}{\sqrt{1 - \left\lbrack f(x) \right\rbrack^{2}}}dx = \sin^{- 1}{f(x)} + C                     |
| }{\int_{}^{}\frac{f'(x)}{1 + \left\lbrack f(x) \right\rbrack^{2}}dx = \tan^{- 1}{f(x)} + C}$$                          |
|                                                                                                                        |
| - This is different to the standard integrals given on your reference sheet.                                           |
|                                                                                                                        |
| 1.  Factor out the denominator to get 1. Rewrite denominator as $\left\lbrack f(x) \right\rbrack^{2}$.                 |
|                                                                                                                        |
| 2.  Identify $f(x)$ and $f'(x)$.                                                                                       |
|                                                                                                                        |
| 3.  Adjust so the numerator is $f'(x)$.                                                                                |
|                                                                                                                        |
| 4.  Integrate.                                                                                                         |
+------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Reverse chain rule for inverse trig functions                                                                                                                     |
+========================================================================================================+========================================================================+
| $$\ \ \ \ \ \ \ \ \ \ \ \int_{}^{}\frac{2}{\sqrt{9 - x^{2}}}dx$$                                       | $$\ \ \ \ \ \ \ \ \ \ \ \int_{}^{}\frac{30x^{2}}{1 + 4x^{6}}dx$$       |
|                                                                                                        |                                                                        |
| $$1.\ \  = \int_{}^{}\frac{2}{3\sqrt{1 - \frac{x^{2}}{9}}}dx$$                                         | $$1.\ \  = \int_{}^{}\frac{30x^{2}}{1 + \left( 2x^{3} \right)^{2}}dx$$ |
|                                                                                                        |                                                                        |
| $$\ \ \ \ \ \  = \int_{}^{}\frac{2}{3\sqrt{1 - \left( \frac{x}{3} \right)^{2}}}dx$$                    | $2.\$ $f(x)$ is $2x^{3}$. Need $6x^{2}$ in the numerator.              |
|                                                                                                        |                                                                        |
| $2.\ \ f(x)$ is $\frac{x}{3}$. Need $\frac{1}{3}$ in the numerator.                                    | $$4.\ \  = 5\int_{}^{}\frac{6x^{2}}{1 + \left( 2x^{3} \right)^{2}}dx$$ |
|                                                                                                        |                                                                        |
| $$3.\ \  = 2\int_{}^{}\frac{\left( \frac{1}{3} \right)}{\sqrt{1 - \left( \frac{x}{3} \right)^{2}}}dx$$ | $$5.\ \  = 5\tan^{- 1}\left( 2x^{3} \right) + C$$                      |
|                                                                                                        |                                                                        |
| $$4.\ \  = 2\sin^{- 1}\left( \frac{x}{3} \right) + C$$                                                 |                                                                        |
+--------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                          |
+===============================================================+================================================================================+
| a.                                                            | b.                                                                             |
|                                                               |                                                                                |
| $$\ \ \ \ \ \ \ \int_{}^{}\frac{7}{\sqrt{16 - x^{2}}}dx$$     | $$\ \ \ \ \ \ \ \int_{}^{}\frac{1}{8 + x^{2}}dx$$                              |
|                                                               |                                                                                |
| $$7\sin^{- 1}\left( \frac{x}{4} \right) + C$$                 | $$\frac{1}{2\sqrt{2}}\tan^{- 1}\left( \frac{x}{2\sqrt{2}} \right) + C$$        |
+---------------------------------------------------------------+--------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                                          |
+---------------------------------------------------------------+--------------------------------------------------------------------------------+
| c.                                                            | d.                                                                             |
|                                                               |                                                                                |
| $$\ \ \ \ \ \ \ \int_{}^{}\frac{e^{x}}{1 + e^{x}}dx$$         | $$\ \ \ \ \ \ \ \int_{}^{}\frac{x}{\sqrt{1 - x^{4}}}dx$$                       |
|                                                               |                                                                                |
| $$\tan^{1}e^{x} + C$$                                         | $$\frac{1}{2}\sin^{- 1}\left( x^{2} \right) + C$$                              |
+---------------------------------------------------------------+--------------------------------------------------------------------------------+
| e.                                                            | f.                                                                             |
|                                                               |                                                                                |
| $$\ \ \ \ \ \ \ \int_{}^{}\frac{x^{2}}{\sqrt{1 - 4x^{6}}}dx$$ | $$\ \ \ \ \ \ \ \int_{}^{}\frac{x^{2}}{1 + 4x^{6}}dx$$                         |
|                                                               |                                                                                |
| $$\frac{1}{6}\sin^{- 1}{(2x^{3})} + C$$                       | $$\frac{1}{12}\tan^{- 1}\left( 2x^{3} \right) + C$$                            |
+---------------------------------------------------------------+--------------------------------------------------------------------------------+
| g.                                                            | h.                                                                             |
|                                                               |                                                                                |
| $$\ \ \ \ \ \ \ \int_{}^{}\frac{5}{\sqrt{9 - 4x^{2}}}dx$$     | $$\ \ \ \ \ \ \ \int_{}^{}\frac{1}{5 + 2x^{2}}dx$$                             |
|                                                               |                                                                                |
| $$\frac{5}{2}\sin^{- 1}\left( \frac{2x}{3} \right) + C$$      | $$\frac{1}{\sqrt{10}}\tan^{- 1}\left( \frac{\sqrt{2}x}{\sqrt{5}} \right) + C$$ |
+---------------------------------------------------------------+--------------------------------------------------------------------------------+

Foundation

1.  Find:

+--------------------------------------------------------+-------------------------------------------------------------------------+-----------------------------------------------------------+
| a.  $\int_{}^{}\frac{- 1}{\sqrt{1 - x^{2}}}dx$         | b.  $\ \int_{}^{}\frac{1}{\sqrt{4 - x^{2}}}dx$                          | c.  $\int_{}^{}\frac{1}{9 + x^{2}}dx$                     |
|                                                        |                                                                         |                                                           |
| $$\cos^{- 1}x\  + \ C$$                                | $$\sin^{- 1}\left( \frac{x}{2} \right) + \ C$$                          | $$\frac{1}{3}\tan^{- 1}\left( \frac{x}{3} \right) + \ C$$ |
+========================================================+=========================================================================+===========================================================+
| d.  $\int_{}^{}\frac{1}{\sqrt{\frac{4}{9} - x^{2}}}dx$ | e.  $\ \int_{}^{}\frac{1}{2 + x^{2}}dx$                                 | f.  $\int_{}^{}\frac{- 1}{\sqrt{5 - x^{2}}}dx$            |
|                                                        |                                                                         |                                                           |
| $$\sin^{- 1}\left( \frac{3x}{2} \right) + \ C$$        | $$\frac{1}{\sqrt{2}}\tan^{- 1}\left( \frac{x}{\sqrt{2}} \right) + \ C$$ | $$\cos^{- 1}\left( \frac{x}{\sqrt{5}} \right) + \ C$$     |
+--------------------------------------------------------+-------------------------------------------------------------------------+-----------------------------------------------------------+

2.  Find the exact value of:

+----------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------+
| a.  $\int_{0}^{3}\frac{1}{\sqrt{9 - x^{2}}}dx$                                         | b.  $\ \int_{0}^{2}\frac{1}{4 + x^{2}}dx$                                             | c.  $\int_{0}^{1}\frac{1}{\sqrt{2 - x^{2}}}dx$                                         |
|                                                                                        |                                                                                       |                                                                                        |
| $$\frac{\pi}{2}$$                                                                      | $$\frac{\pi}{8}$$                                                                     | $$\frac{\pi}{4}$$                                                                      |
+========================================================================================+=======================================================================================+========================================================================================+
| d.  $\int_{\frac{1}{2}}^{\frac{\sqrt{3}}{2}}\frac{\frac{1}{2}}{\frac{1}{4} + x^{2}}dx$ | e.  $\int_{\frac{\sqrt{3}}{6}}^{\frac{1}{6}}\frac{- 1}{\sqrt{\frac{1}{9} - x^{2}}}dx$ | f.  $\int_{- \frac{3\sqrt{2}}{4}}^{\frac{3}{4}}\frac{1}{\sqrt{\frac{9}{4} - x^{2}}}dx$ |
|                                                                                        |                                                                                       |                                                                                        |
| $$\frac{\pi}{12}$$                                                                     | $$\frac{\pi}{6}$$                                                                     | $$\frac{5\pi}{12}$$                                                                    |
+----------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------+

3.  Find the equation of the curve, given that:

    a.  $y' = \ \left( 1 - x^{2} \right)^{- \frac{1}{2}}$ and the curve
        passes through $(0,\ \pi)$

$$y\  = \ \int_{}^{}{\left( 1 - x^{2} \right)^{- \frac{1}{2}}dx} = \ sin^{- 1}x\  + \ C$$

$$Sub\ (0,\ \pi):\ \pi\  = \ sin^{- 1}(0) + \ C\  = \ C$$

$$\therefore\ y\  = \ sin^{- 1}x\  + \ \pi$$

b.  $y'\  = \ 4\left( 16 + x^{2} \right)^{- 1}$ and the curve passes
    through $( - 4,\ 0)$

$$y\  = \ \int_{}^{}\frac{4}{16 + x^{2}}dx\  = \ 4 \cdot \left( \frac{1}{4} \right)tan^{- 1}\left( \frac{x}{4} \right) + \ C\  = \ tan^{- 1}\left( \frac{x}{4} \right) + \ C$$

$$Sub\ ( - 4,\ 0):\ 0\  = \ tan^{- 1}( - 1) + \ C\  = \  - \frac{\pi}{4} + \ C,\ so\ C\  = \frac{\pi}{4}$$

$$\therefore\ y\  = \ tan^{- 1}\left( \frac{x}{4} \right) + \frac{\pi}{4}$$

4.  a.  If $y' = \frac{1}{\sqrt{36 - x^{2}}}$ and $y\  = \frac{\pi}{6}$
        when $x\  = \ 3$, find $y$ when $x\  = \ 3\sqrt{3}$.

$$y\  = \ \int_{}^{}\frac{1}{\sqrt{36 - x^{2}}}dx\  = \ sin^{- 1}\left( \frac{x}{6} \right) + \ C$$

$$Sub\ x\  = \ 3,\ y\  = \frac{\pi}{6}:\frac{\pi}{6} = \ sin^{- 1}\left( \frac{1}{2} \right) + \ C\  = \frac{\pi}{6} + \ C,\ so\ C\  = \ 0$$

$$\therefore\ y\  = \ sin^{- 1}\left( \frac{x}{6} \right)$$

$$At\ x\  = \ 3\sqrt{3}:\ y\  = \ sin^{- 1}\left( \frac{3\sqrt{3}}{6} \right) = \ sin^{- 1}\left( \frac{\sqrt{3}}{2} \right) = \frac{\pi}{3}$$

b.  Given that $y' = \frac{2}{4 + x^{2}}$ and $y\  = \frac{\pi}{3}$ when
    $x\  = \ 2$, find $y$ when $x\  = \frac{2}{\sqrt{3}}$.

$$y\  = \ \int_{}^{}\frac{2}{4 + x^{2}}dx\  = \ 2 \cdot \left( \frac{1}{2} \right)tan^{- 1}\left( \frac{x}{2} \right) + \ C\  = \ tan^{- 1}\left( \frac{x}{2} \right) + \ C$$

$$Sub\ x\  = \ 2,\ y\  = \frac{\pi}{3}:\frac{\pi}{3} = \ tan^{- 1}(1) + \ C\  = \frac{\pi}{4} + \ C,\ so\ C\  = \frac{\pi}{12}$$

$$\therefore\ y\  = \ tan^{- 1}\left( \frac{x}{2} \right) + \frac{\pi}{12}$$

$$At\ x\  = \frac{2}{\sqrt{3}}:\ y\  = \ tan^{- 1}\left( \frac{1}{\sqrt{3}} \right) + \frac{\pi}{12} = \frac{\pi}{6} + \frac{\pi}{12} = \frac{\pi}{4}$$

5.  Find:

+------------------------------------------------------------+-------------------------------------------------------------+-------------------------------------------------------------------+
| a.  $\int_{}^{}\frac{1}{\sqrt{1 - 4x^{2}}}dx$              | b.  $\int_{}^{}\frac{1}{1 + 16x^{2}}dx$                     | c.  $\int_{}^{}\frac{- 1}{\sqrt{1 - 2x^{2}}}dx$                   |
|                                                            |                                                             |                                                                   |
| $$\frac{1}{2}\sin^{- 1}(2x) + \ C$$                        | $$\frac{1}{4}\tan^{- 1}(4x) + \ C$$                         | $$\frac{1}{\sqrt{2}}\cos^{- 1}\left( \sqrt{2}x \right) + \ C$$    |
+============================================================+=============================================================+===================================================================+
| d.  $\int_{}^{}\frac{1}{\sqrt{4 - 9x^{2}}}dx$              | e.  $\int_{}^{}\frac{1}{25 + 9x^{2}}dx$                     | f.  $\int_{}^{}\frac{- 1}{\sqrt{3 - 4x^{2}}}dx$                   |
|                                                            |                                                             |                                                                   |
| $$\frac{1}{3}\sin^{- 1}\left( \frac{3x}{2} \right) + \ C$$ | $$\frac{1}{15}\tan^{- 1}\left( \frac{3x}{5} \right) + \ C$$ | $$\frac{1}{2}\cos^{- 1}\left( \frac{2x}{\sqrt{3}} \right) + \ C$$ |
+------------------------------------------------------------+-------------------------------------------------------------+-------------------------------------------------------------------+

6.  Find the exact value of:

+-----------------------------------------------------------+-----------------------------------------------------------------------+-----------------------------------------------------------------------+
| a.  $\int_{0}^{\frac{1}{6}}\frac{1}{\sqrt{1 - 9x^{2}}}dx$ | b.  $\ \int_{\frac{1}{2}}^{\frac{\sqrt{3}}{2}}\frac{2}{1 + 4x^{2}}dx$ | c.  $\int_{- \frac{1}{2}}^{\frac{1}{2}}\frac{1}{\sqrt{1 - 3x^{2}}}dx$ |
|                                                           |                                                                       |                                                                       |
| $$\frac{\pi}{18}$$                                        | $$\frac{\pi}{12}$$                                                    | $$\frac{2\pi\sqrt{3}}{9}$$                                            |
+===========================================================+=======================================================================+=======================================================================+

Development

7.  a.  Shade the region bounded by $y\  = \ sin⁻¹x$, the $x$-axis and
        the vertical line $x\  = \frac{1}{2}$.

    b.  Show that
        $\frac{d}{dx}\left( x\ sin^{- 1}x\  + \ \sqrt{1 - x^{2}} \right)\  = \ \sin ⁻¹x\$.

    c.  Hence find the exact area of the region.

$$\frac{d}{dx}\left( x\ \sin^{- 1}x\  + \ \sqrt{1 - x^{2}} \right) = \ \sin^{- 1}x\  + \frac{x}{\sqrt{1 - x^{2}}} + \frac{- 2x}{2\sqrt{1 - x^{2}}}$$

$$= \ \sin^{- 1}x\  + \frac{x}{\sqrt{1 - x^{2}}} - \frac{x}{\sqrt{1 - x^{2}}}$$

$$= \ \sin^{- 1}x$$

$$Area\  = \ \int_{0}^{\frac{1}{2}}{sin^{- 1}x}dx\  = \ \left\lbrack x\ sin^{- 1}x\  + \ \sqrt{1 - x^{2}} \right\rbrack_{0}^{\frac{1}{2}}$$

$$= \ \left( \left( \frac{1}{2} \right)sin^{- 1}\left( \frac{1}{2} \right) + \ \sqrt{\frac{3}{4}} \right) - \ (0\  + \ 1)$$

$$= \frac{\pi}{12} + \frac{\sqrt{3}}{2} - \ 1\ unit^{2}$$

8.  a.  Shade the region bounded by $y\  = \ \sin ⁻¹x$, the $y$-axis and
        the line $y\  = \frac{\pi}{6}$.

    b.  Find the exact area of this region.

    c.  Hence confirm the area in the previous question.

Region bounded b*y* $y\  = \ sin⁻¹x$, $y$-axis, $y\  = \frac{\pi}{6}$.
Integrating with respect to $y$: $x\  = \ \sin\ y$.

$$Area\  = \ \int_{0}^{\frac{\pi}{6}}\sin y\ dy\  = \ \lbrack - cos\ y\rbrack_{0}^{\frac{\pi}{6}}$$

$$= \  - cos\left( \frac{\pi}{6} \right) + \ cos(0)$$

$$= \ 1\  - \frac{\sqrt{3}}{2}\ {unit}^{2}$$

$$The\ two\ regions\ together\ form\ the\ rectangle\ with\ vertices\ (0,0),\ \left( \frac{1}{2,0} \right),\ \left( \frac{1}{2},\frac{\pi}{6} \right),\ \left( 0,\frac{\pi}{6} \right)$$

$$area\  = \ \left( \frac{1}{2} \right)\left( \frac{\pi}{6} \right) = \frac{\pi}{12}.$$

$$so\ \left( \frac{\pi}{12} + \frac{\sqrt{3}}{2} - \ 1 \right)\  + \left( 1\  - \frac{\sqrt{3}}{2} \right)$$

$$= \frac{\pi}{12}\ as\ expected.$$

9.  a.  Show that
        $\frac{d}{dx}\left( cos^{- 1}(2 - x) \right) = \frac{1}{\sqrt{4x - x^{2} - 3}}$.

    b.  Hence find $\int_{1}^{2}\frac{1}{\sqrt{4x - x^{2} - 3}}dx$.

$$\frac{d}{dx}\left( cos^{- 1}(2 - x) \right) = \  - \frac{1}{\sqrt{1 - (2 - x)^{2}}} \cdot \ ( - 1)$$

$$= \frac{1}{\sqrt{1 - \left( 4 - 4x + x^{2} \right)}} = \frac{1}{\sqrt{4x - x^{2} - 3}}$$

$$\ \int_{1}^{2}\frac{1}{\sqrt{4x - x^{2} - 3}}dx\  = \ \left\lbrack cos^{- 1}(2 - x) \right\rbrack_{1}^{2}$$

$$= \ cos^{- 1}(0) - \ cos^{- 1}(1)$$

$$= \frac{\pi}{2} - \ 0\  = \frac{\pi}{2}$$

10. a.  Differentiate $\tan^{- 1}\left( \frac{x^{3}}{2} \right).$

    b.  Hence find $\int_{}^{}\frac{x^{2}}{4 + x^{6}}dx$.

$$\frac{d}{dx}\left( \tan^{- 1}\left( \frac{x^{3}}{2} \right) \right) = \ \left( \frac{1}{1 + \left( \frac{x^{3}}{2} \right)^{2}} \right) \cdot \frac{3}{2}x^{2} = \frac{\frac{3x^{2}}{2}}{1\  + \frac{x^{6}}{4}} = \frac{6x^{2}}{4 + x^{6}}$$

$$\ since\ \int_{}^{}\frac{6x^{2}}{4 + x^{6}}dx\  = \ \tan^{- 1}\left( \frac{x^{3}}{2} \right) + \ C$$

$$\therefore\ \int_{}^{}\frac{x^{2}}{4 + x^{6}}dx\  = \frac{1}{6}\tan^{- 1}\left( \frac{x^{3}}{2} \right) + \ C$$

11. a.  Differentiate $x\ \tan ⁻¹x$.

    b.  Hence find $\int_{0}^{1}{tan^{- 1}x}dx$.

$$\frac{d}{dx}\left( x\ \tan^{- 1}x \right) = \ \tan^{- 1}x\  + \frac{x}{1 + x^{2}}$$

$$since\ \int_{}^{}{\left( \tan^{- 1}x\  + \frac{x}{1 + x^{2}} \right)dx} = \ x\ \tan^{- 1}x\  + \ C$$

$$\therefore\ \int_{}^{}{\tan^{- 1}x}dx\  = \ x\ \tan^{- 1}x\  - \ \int_{}^{}\frac{x}{1 + x^{2}}dx\ $$

$$\int_{0}^{1}{\tan^{- 1}x}dx\  = \ \left\lbrack x\ \tan^{- 1}x\  - \frac{1}{2}\ln\left( 1 + x^{2} \right) \right\rbrack_{0}^{1}$$

$$= \ \left( 1 \cdot \frac{\pi}{4} - \frac{1}{2}ln\ 2 \right) - \ 0\ $$

$$= \frac{\pi}{4} - \frac{1}{2}ln\ 2$$

12. Without finding any primitives, use arguments from symmetry or
    geometry to evaluate:

+----------------------------------------------------------------------+-------------------------------------------+------------------------------------------------------------------------------------------------------------------------+
| a.  $\int_{- \frac{1}{3}}^{\frac{1}{3}}{\sin^{- 1}x}dx$              | b.  $\int_{- 5}^{5}{\tan^{- 1}x}dx$       | c.  $\int_{- \frac{3}{4}}^{\frac{3}{4}}{\cos^{- 1}x}dx$                                                                |
|                                                                      |                                           |                                                                                                                        |
| sin⁻¹x is an odd function, limits are symmetric about 0. ∴ = 0       | tan⁻¹x is an odd function, limits         | cos⁻¹x is neither odd nor even.\                                                                                       |
|                                                                      | symmetric about 0. ∴ = 0                  | The graph has odd symmetry about $y = \frac{\pi}{2}$                                                                   |
|                                                                      |                                           |                                                                                                                        |
|                                                                      |                                           | the area \"above\" the line $y\  = \frac{\pi}{2}$ (on the left side) is exactly equal to the area below that line (on  |
|                                                                      |                                           | the right side).\                                                                                                      |
|                                                                      |                                           | So we can model the area as a rectangle.                                                                               |
|                                                                      |                                           |                                                                                                                        |
|                                                                      |                                           | $$\therefore\ \int_{- \frac{3}{4}}^{\frac{3}{4}}{cos^{- 1}x}dx\  = \frac{\pi}{2} \cdot \frac{3}{2} = \frac{3\pi}{4}.$$ |
+======================================================================+===========================================+========================================================================================================================+
| d.  $\int_{- \frac{2}{3}}^{\frac{2}{3}}\frac{x}{\sqrt{1 - x^{2}}}dx$ | e.  $\int_{- 3}^{3}\frac{x}{1 + x^{2}}dx$ | f.  $\int_{- 6}^{6}\sqrt{36 - x^{2}}dx$                                                                                |
|                                                                      |                                           |                                                                                                                        |
| $\frac{x}{\sqrt{1 - x^{2}}}$ is an odd function, limits symmetric    | $\frac{x}{1 + x^{2}}$ is an odd function, | $\sqrt{36 - x^{2}} \geq \ 0$ on \[−6, 6\]\                                                                             |
| about 0. ∴ = 0                                                       | limits symmetric about 0. ∴ = 0           | describes the upper semicircle of radius 6.                                                                            |
|                                                                      |                                           |                                                                                                                        |
|                                                                      |                                           | $$Area\  = \frac{1}{2}\pi\left( 6^{2} \right) = \ 18\pi$$                                                              |
+----------------------------------------------------------------------+-------------------------------------------+------------------------------------------------------------------------------------------------------------------------+

Mastery

13. Given that $f(x) = \frac{x}{1 + x^{2}} - \ tan^{- 1}x$:

    a.  find $f(0)$

    b.  show that
        $f'(x) = \frac{- 2x^{2}}{\left( 1 + x^{2} \right)^{2}}$

    c.  Hence explain why $f(x)\  < \ 0$ for all $x\  > \ 0$

    d.  Hence find
        $\int_{0}^{1}\frac{x^{2}}{\left( 1 + x^{2} \right)^{2}dx}$

$$f(0) = \frac{0}{1 + 0} - \ \tan^{- 1}(0) = \ 0$$

$$f'(x) = \frac{d}{dx}\left( \frac{x}{1 + x^{2}} \right) - \frac{1}{1 + x^{2}}$$

$$\frac{d}{dx}\left( \frac{x}{1 + x^{2}} \right) = \frac{\left( 1 + x^{2} \right) - \ x \cdot 2x}{\left( 1 + x^{2} \right)^{2}} = \frac{1 - x^{2}}{\left( 1 + x^{2} \right)^{2}}$$

$$f'(x) = \frac{1 - x^{2}}{\left( 1 + x^{2} \right)^{2}} - \frac{1}{1 + x^{2}} = \frac{1 - x^{2}}{\left( 1 + x^{2} \right)^{2}} - \frac{1 + x^{2}}{\left( 1 + x^{2} \right)^{2}} = \  - \frac{2x^{2}}{\left( 1 + x^{2} \right)^{2}}$$

$$f(0) = \ 0\ and\ f'(x) = \  - \frac{2x^{2}}{\left( 1 + x^{2} \right)^{2}} \leq \ 0\ for\ all\ x,\ with\ equality\ only\ at\ x\  = \ 0.$$

$$So\ f\ is\ non - increasing\ and\ starts\ at\ 0,\ \therefore\ f(x) < \ 0\ for\ x\  > \ 0.$$

$$f(x) = \frac{x}{1 + x^{2}} - \ \tan^{- 1}x,\ so:$$

$$\int_{0}^{1}\frac{- 2x^{2}}{\left( 1 + x^{2} \right)^{2}dx} = \ \left\lbrack \frac{x}{1 + x^{2}} - \ \tan^{- 1}x \right\rbrack_{0}^{1} = \ \left( \frac{1}{2} - \frac{\pi}{4} \right) - \ 0$$

$$\therefore\ \int_{0}^{1}\frac{x^{2}}{\left( 1 + x^{2} \right)^{2}dx} = \ \left( \frac{1}{2} \right)\left( \frac{\pi}{4} - \frac{1}{2} \right) = \frac{\pi}{8} - \frac{1}{4}$$

14. Consider the function $f(x) = \frac{1}{\sqrt{4 - x^{2}}}.$

    a.  Sketch the graph of $y\  = \ \sqrt{4 - x^{2}}.$

    b.  Hence sketch the graph of $y\  = \ f(x)$.

    c.  Write down the domain and range of $f(x),$ and describe its
        symmetry.

    d.  Find the area between the curve and the $x$-axis from
        $x\  = \  - 1\$to $x\  = \ 1.$

    e.  Find the total area between the curve and the x-axis.

![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image7.png){width="1.6146161417322835in"
height="1.5748031496062993in"}

$$Domain:\  - 2\  < \ x\  < \ 2\ (i.e.\ x\  \neq \  \pm 2),\ range:\ y\  \geq \frac{1}{2},\ even\ function.$$

$$\int_{- 1}^{1}{\frac{1}{\sqrt{4 - x^{2}}}dx}\  = \ \left\lbrack \sin^{- 1}\left( \frac{x}{2} \right) \right\rbrack( - 1)^{1} = \ \sin^{- 1}\left( \frac{1}{2} \right) - \ \sin^{- 1}\left( - \frac{1}{2} \right)$$

$$= \frac{\pi}{6} - \ \left( - \frac{\pi}{6} \right) = \frac{\pi}{3}{unit}^{2}$$

$$The\ total\ area\  = \ \int_{- 2}^{2}{\frac{1}{\sqrt{4 - x^{2}}}dx}\  = \ \left\lbrack \sin^{- 1}\left( \frac{x}{2} \right) \right\rbrack_{- 2}^{2}\ $$

$$= \frac{\pi}{2} - \ \left( - \frac{\pi}{2} \right) = \ \pi\ {unit}^{2}$$

15. Consider the function $f(x) = \frac{4}{x^{2} + 4}$.

    a.  What is the axis of symmetry of $y\  = \ f(x)?$

    b.  What are the domain and range?

    c.  Show that the graph of $f(x)$ has a maximum turning point at
        $(0,\ 1)$.

    d.  Find $lim_{x \rightarrow \infty}\ f(x)$, and hence sketch
        $y\  = \ f(x)$.\
        On the same axes, sketch $y\  = \frac{x^{2} + 4}{4}$.

    e.  Calculate the area bounded by the curve and the $x$-axis from
        $x\  = \  - 2\sqrt{3}$ to $x\  = \ \frac{2\sqrt{3}}{3}$.

    f.  Find the exact area between the curve and the $x$-axis from
        $x\  = \  - a$ to $x\  = \ a$, where $a$ is a positive constant.

    g.  By letting a tend to infinity, find the total area between the
        curve and the $x$-axis.

![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image8.png){width="1.743695319335083in"
height="1.5748031496062993in"}

$$y\ axis,\ since\ f(x)\ is\ an\ even\ function.$$

$$Domain:\ all\ real\ x;\ range:\ 0\  < \ y\  \leq \ 1.$$

$$f'(x) = \  - \frac{8x}{\left( x^{2} + 4 \right)^{2}}.\ f'(0) = \ 0.$$

$$f^{''}(x)\ at\ x\  = \ 0:\ f^{''}(0) = \  - \frac{8}{4^{2}} \cdot \ (check\ sign) < \ 0.\ \therefore\ maximum\ at\ \left( 0,\ f(0) \right) = \ (0,\ 1).$$

$$\lim_{x \rightarrow \infty}f(x) = \ 0,\ so\ y\  = \ 0\ is\ a\ horizontal\ asymptote.$$

$$\ \int_{- 2\sqrt{3}}^{\frac{2\sqrt{3}}{3}}\frac{4}{x^{2} + 4}dx\  = \ \left\lbrack 4 \cdot \left( \frac{1}{2} \right)\tan^{- 1}\left( \frac{x}{2} \right) \right\rbrack_{- 2\sqrt{3}}^{\frac{2\sqrt{3}}{3}} = \ \left\lbrack 2\tan^{- 1}\left( \frac{x}{2} \right) \right\rbrack_{- 2\sqrt{3}}^{\frac{2\sqrt{3}}{3}}$$

$$= \ 2\tan^{- 1}\left( \frac{\sqrt{3}}{3} \right) - \ 2\tan^{- 1}\left( - \sqrt{3} \right) = \ 2\left( \frac{\pi}{6} \right) - \ 2\left( - \frac{\pi}{3} \right) = \frac{\pi}{3} + \frac{2\pi}{3} = \ \pi\ {unit}^{2}$$

$$\int_{- a}^{a}\frac{4}{x^{2} + 4}dx\  = \ \left\lbrack 2\tan^{- 1}\left( \frac{x}{2} \right) \right\rbrack( - a)^{a} = \ 2\tan^{- 1}\left( \frac{a}{2} \right) - \ 2\tan^{- 1}\left( - \frac{a}{2} \right) = \ 4\tan^{- 1}\left( \frac{a}{2} \right){unit}^{2}$$

$$As\ a\  \rightarrow \ \infty:\ \tan^{- 1}\left( \frac{a}{2} \right) \rightarrow \frac{\pi}{2},\ so\ total\ area\  = \ 4 \cdot \left( \frac{\pi}{2} \right) = \ 2\pi\ {unit}^{2}$$

16. a.  Use the trapezoidal rule with five points to approximate
        $I\  = \ \int_{0}^{1}\frac{1}{1 + x^{2}}dx$, expressing your
        answer in simplest fraction form.

    b.  Find the exact value of $I$, and hence show that
        $\pi\  \approx \frac{5323}{1700}$.

$$Five\ points\ at\ x\  = \ 0,\frac{1}{4},\frac{1}{2},\frac{3}{4},\ 1.\ h\  = \frac{1}{4}.$$

$$f(0) = \ 1,\ f\left( \frac{1}{4} \right) = \frac{16}{17},\ f\left( \frac{1}{2} \right) = \frac{4}{5},\ f\left( \frac{3}{4} \right) = \frac{16}{25},\ f(1) = \frac{1}{2}.$$

$$Trapezoidal\ rule:\ \left( \frac{1}{4} \right) \cdot \left( \frac{1}{2} \right)\left( f(0) + \ 2f\left( \frac{1}{4} \right) + \ 2f\left( \frac{1}{2} \right) + \ 2f\left( \frac{3}{4} \right) + \ f(1) \right)$$

$$= \ \left( \frac{1}{8} \right)\left( 1\  + \frac{32}{17} + \frac{8}{5} + \frac{32}{25} + \frac{1}{2} \right)$$

$$= \frac{5323}{6800}$$

$$\int_{0}^{1}\frac{1}{1 + x^{2}}dx\  = \ \left\lbrack \tan^{- 1}x \right\rbrack_{0}^{1} = \frac{\pi}{4} - \ 0\  = \frac{\pi}{4}$$

$$\therefore\frac{\pi}{4} \approx \frac{5323}{6800} \Longrightarrow \ \pi\  \approx \ 4 \cdot \left( \frac{5323}{6800} \right) = \frac{5323}{1700}$$

17. Show that
    $\int_{- \frac{1}{4}}^{\frac{3}{5}}\frac{1}{1 + x^{2}}dx\  = \frac{\pi}{4}$.

$$\int_{- \frac{1}{4}}^{\frac{3}{5}}\frac{1}{1 + x^{2}}dx\  = \ \left\lbrack \tan^{- 1}x \right\rbrack_{- \frac{1}{4}}^{\frac{3}{5}}$$

$$Need\ \tan^{- 1}\left( \frac{3}{5} \right) - \ \tan^{- 1}\left( - \frac{1}{4} \right) = \ \tan^{- 1}\left( \frac{3}{5} \right) + \ \tan^{- 1}\left( \frac{1}{4} \right).$$

$$Using\ tan(A + B) = \frac{tan\ A\  + \ tan\ B}{1\  - \ tan\ A\ tan\ B}:$$

$$\tan\left( \tan^{- 1}\left( \frac{3}{5} \right) + \ \tan^{- 1}\left( \frac{1}{4} \right) \right) = \frac{\frac{3}{5} + \frac{1}{4}}{1\  - \frac{3}{20}} = \frac{\frac{17}{20}}{\frac{17}{20}} = \ 1$$

$$\therefore\ \tan^{- 1}\left( \frac{3}{5} \right) + \ \tan^{- 1}\left( \frac{1}{4} \right) = \frac{\pi}{4}$$

18. Find, using the substitution:

    a.  $\int_{}^{}\frac{1}{\sqrt{x(1 + x)}}dx\ \ \ \ \ \ using\ u = \sqrt{x}$

    b.  $\int_{0}^{1}\frac{1}{e^{- x} + eˣ}dx\ \ \ \ \ \ using\ u = e^{x}$

$$Let\ u\  = \ \sqrt{x},\ so\ x\  = \ u^{2},\ dx\  = \ 2u\ du.$$

$$\int_{}^{}\frac{1}{\sqrt{x(1 + x)}}dx\  = \ \int_{}^{}\frac{1}{u\left( 1 + u^{2} \right)} \cdot \ 2u\ du\  = \ \int_{}^{}\frac{2}{1 + u^{2}}du\  = \ 2\tan^{- 1}u\  + \ C\  = \ 2\tan^{- 1}\sqrt{x} + \ C$$

$$\int_{0}^{1}\frac{1}{e^{- x} + eˣ}dx\  = \ \int_{0}^{1}\frac{eˣ}{1 + e^{2x}}dx$$

$$Let\ u\  = \ eˣ,\ du\  = \ eˣ\ dx.\ $$

$$= \ \int_{1}^{e}\frac{1}{1 + u^{2}}du\  = \ \left\lbrack \tan^{- 1}u \right\rbrack_{1}^{e} = \ \tan^{- 1}e\  - \frac{\pi}{4}$$

# Integration by Substitution

+-----------------------------------------------------------------------------------------------------+
| - **Investigation** Integration by Substitution                                                     |
+==================================================+==================================================+
| Integrate using reverse chain rule:                                                                 |
|                                                                                                     |
| $$\int_{}^{}{\cos{(3x + 1})}dx$$                                                                    |
|                                                                                                     |
| Now try                                                                                             |
|                                                                                                     |
| $$\int_{}^{}\frac{\cos\sqrt{x}}{\sqrt{x}}dx$$                                                       |
|                                                                                                     |
| When you cannot easily recognise reverse chain rule, we can use a **substitution:**                 |
|                                                                                                     |
| $$\int_{}^{}\frac{\cos\sqrt{x}}{\sqrt{x}}dx\ \ \ \ \ \ \ using\ the\ subsitution\ u = \sqrt{x}$$    |
|                                                                                                     |
| 1\. Replace all instances of $\sqrt{x}$ with $u$.                                                   |
|                                                                                                     |
| 2\. Rewrite $dx$ using $du$ by finding $\frac{du}{dx}$ and rearranging:                             |
|                                                                                                     |
| 3\. Integrate:                                                                                      |
|                                                                                                     |
| 4\. Back substitute:                                                                                |
+-----------------------------------------------------------------------------------------------------+
| - **Integration by Substitution**                                                                   |
+-----------------------------------------------------------------------------------------------------+
| The reverse chain rule can be difficult to apply when expressions become complex. **Integration by  |
| substitution** is a method that simplifies the integral by replacing part of the expression with a  |
| new variable, $u$.                                                                                  |
|                                                                                                     |
| Set out your working out like this: Substitution steps on the right, main working on the left.      |
+--------------------------------------------------+--------------------------------------------------+
| 4.  Replace every $x$ expression with $u$, and   | 1.  Let $u = u(x)$                               |
|     replace $dx\$with the expression from step   |                                                  |
|     3.                                           | 2.  Find $\frac{du}{dx}$                         |
|                                                  |                                                  |
| 5.  Integrate with respect to $u$.               | 3.  Rearrange to get $dx$ in terms of $du$.      |
|                                                  |                                                  |
| 6.  Back-substitute: replace all instances of    |                                                  |
|     $u$ with the expression in $x$.              |                                                  |
+--------------------------------------------------+--------------------------------------------------+
| - If a question asks you to integrate using a substitution, you must do so, showing all steps.      |
+-----------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Integration by substitution                                                                                                                            |
+====================================================================================================================+=================================================+
| $$\ \ \ \int_{}^{}{x\left( 1 - x^{2} \right)^{4}}dx\ \ \ \ \ \ \ \ \ \ using\ u = 1 - x^{2}$$                                                                        |
+--------------------------------------------------------------------------------------------------------------------+-------------------------------------------------+
| $$4.\ \int_{}^{}{x\left( 1 - x^{2} \right)^{4}}dx = \int_{}^{}{x\left( u^{4} \right)\frac{du}{- 2x}}$$             | $1.\$ Let $u = 1 - x^{2}$                       |
|                                                                                                                    |                                                 |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \int_{}^{}\frac{u^{4}}{- 2}\ du$$       | $$2.\ \ \frac{du}{dx} = - 2x$$                  |
|                                                                                                                    |                                                 |
| $$5.\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = - \frac{u^{5}}{10} + C$$                        | $$3.\ \ \ du = \  - 2x\ dx$$                    |
|                                                                                                                    |                                                 |
| $$6.\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = - \frac{\left( 1 - x^{2} \right)^{5}}{10} + C$$ | $$\ \ \ \ \ \ dx = \frac{du}{- 2x}$$            |
+--------------------------------------------------------------------------------------------------------------------+-------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                        |
+======================================+=======================================================================+
| $$\int_{}^{}{\sin x\sqrt{1 - \cos x}dx}\ \ \ \ \ using\ u = 1 - \cos x$$                                     |
+--------------------------------------+-----------------------------------------------------------------------+
|                                      | $$\frac{2}{3}\sqrt{\left( 1 - \cos x \right)^{3}} + C$$               |
+--------------------------------------+-----------------------------------------------------------------------+
| $$\int_{}^{}{x\sqrt{x + 1}}dx\ \ \ \ \ using\ u = x + 1$$                                                    |
+--------------------------------------+-----------------------------------------------------------------------+
|                                      | $$\frac{2}{5}\sqrt{(x + 1)^{5}} - \frac{2}{3}\sqrt{(x + 1)^{3}} + C$$ |
+--------------------------------------+-----------------------------------------------------------------------+
| - **Integrating Definite Integrals by Substitution**                                                         |
+--------------------------------------------------------------------------------------------------------------+
| When integrating definite integrals by substitution, you must **change the limits**.\                        |
| You do not need to back-substitute.                                                                          |
+--------------------------------------+-----------------------------------------------------------------------+
| 5.  Replace every $x$ expression     | 1.  Let $u = u(x)$                                                    |
|     with $u$, and $dx\$with the      |                                                                       |
|     expression from step 3. Replace  | 2.  Find $\frac{du}{dx}$                                              |
|     the limits.                      |                                                                       |
|                                      | 3.  Rearrange to get $dx$ in terms of $du$.                           |
| 6.  Integrate with respect to $u$.   |                                                                       |
|                                      | 4.  Change the limits to $u$.                                         |
+--------------------------------------+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Integrate definite integrals by substitution                                                                                                                                                |
+===============================================================================================================================================================+===========================================+
| $$\int_{0}^{1}{x\sqrt{1 - x}}dx\ \ \ \ \ \ \ using\ u = 1 - x$$                                                                                                                                           |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------+
| $$5.\ \int_{0}^{1}{x\sqrt{1 - x}}dx = \int_{1}^{0}{(1 - u)\sqrt{u}}( - du)$$                                                                                  | $1.$ Let $u = 1 - x$ , so $x = 1 - u$     |
|                                                                                                                                                               |                                           |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = - \int_{1}^{0}{\sqrt{u} - u\sqrt{u}}du$$                                               | $$2.\ \ \frac{du}{dx} = - 1$$             |
|                                                                                                                                                               |                                           |
| $$6.\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = - \left\lbrack \frac{2}{3}u^{\frac{3}{2}} - \frac{2}{5}u^{\frac{5}{2}} \right\rbrack_{1}^{0}$$ | $$3.\ \ \ dx = - du$$                     |
|                                                                                                                                                               |                                           |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = - \left( (0 - 0) - \left( \frac{2}{3} - \frac{2}{5} \right) \right)$$                    | $$4.\ \ when\ x = 0,\ u = 1 - 0 = 1$$     |
|                                                                                                                                                               |                                           |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{4}{15}$$                                                                           | $$\ \ \ \ \ when\ x = 1,\ u = 1 - 1 = 0$$ |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                         |
+===============================================================+===============================================================+
| $$\int_{0}^{2}{x^{2}\sqrt{x^{3} + 1}}dx\ \ \ \ \ \ using\ u = x^{3} + 1$$                                                     |
+---------------------------------------------------------------+---------------------------------------------------------------+
|                                                               | $$\frac{52}{9}$$                                              |
+---------------------------------------------------------------+---------------------------------------------------------------+
| $$\int_{0}^{\pi}{\cos^{6}x\sin x}dx\ \ \ \ \ \ using\ u = \cos x$$                                                            |
+---------------------------------------------------------------+---------------------------------------------------------------+
|                                                               | $$\frac{2}{7}$$                                               |
+---------------------------------------------------------------+---------------------------------------------------------------+
| - **Investigation** Integration by Substitution: Geometric representation.                                                    |
+-------------------------------------------------------------------------------------------------------------------------------+
| Let's see what integration by substitution does geometrically. Consider: $u = 3x + 1$                                         |
|                                                                                                                               |
| $$\int_{0}^{\frac{2\pi}{3}}{\cos{(3x + 1)}}dx \mapsto \frac{1}{3}\int_{1}^{2\pi + 1}{\cos udu}$$                              |
|                                                                                                                               |
| ![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image9.png){width="4.724409448818897in"     |
| height="1.716544181977253in"}                                                                                                 |
|                                                                                                                               |
| The substitution maps the graph of $\cos{(3x + 1)}$ to $\frac{1}{3}\cos u$.                                                   |
|                                                                                                                               |
| The new graph is a simpler cosine, but it is one-third the height and three times the width.                                  |
|                                                                                                                               |
| To preserve the area under the curve, each strip of width $\Delta x$ in the original must become three times as wide in the   |
| $u$-space which is what $du = 3\ dx$ accounts for.                                                                            |
|                                                                                                                               |
| This works neatly here because $u = 3x + 1\$is a *linear* transformation. Consider $u = \sqrt{x}$:                            |
|                                                                                                                               |
| $$\int_{0}^{4\pi^{2}}\frac{\cos\sqrt{x}}{\sqrt{x}}dx \mapsto \int_{0}^{2\pi}{\cos udu}$$                                      |
|                                                                                                                               |
| ![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image10.png){width="4.724409448818897in"    |
| height="1.6694695975503062in"}                                                                                                |
|                                                                                                                               |
| Here, the substitution distorts the $x$-axis non-uniformly to produce the simpler cosine graph on the right. Because this a   |
| **non-linear** transformation, the width $\Delta x$ changes depending on where you are on the $x$-axis:                       |
|                                                                                                                               |
| ![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image11.png){width="4.724409448818897in"    |
| height="1.6920275590551181in"}                                                                                                |
|                                                                                                                               |
| Two strips of equal width $\Delta x$ are shown on the left graph. To map to an equal area in the $u$-space, the strip near    |
| $x = 0$ is tall and thin; the one further right is shorter and wider.\                                                        |
| The substitution compresses and stretches different parts of the $x$-axis by different amounts.\                              |
| This is what $du = \frac{1}{2\sqrt{x}}\ dx$ accounts for.                                                                     |
+-------------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  Consider $\int_{}^{}{\ 2x\left( 1\  + \ x^{2} \right)^{3}\ dx}$,
    with $u\  = \ 1\  + \ x².$

    a.  Show that $du\  = \ 2x\ dx$.

    b.  Show the integral can be written as $\int_{}^{}{\ u^{3}du}$.

    c.  Hence find the primitive of
        $2x\left( 1\  + \ x^{2} \right)^{3}.$

    d.  Check by differentiating.

$$a)\ u\  = \ 1\  + \ x^{2}\ $$

$$\frac{du}{dx} = \ 2x\ $$

$$\ du\  = \ 2x\ dx$$

$$b)\ \int_{}^{}{\ 2x\left( 1\  + \ x^{2} \right)^{3}dx} = \ \int_{}^{}{\ u^{3}du}$$

$$c)\ \int_{}^{}{\ u^{3}du} = \frac{u^{4}}{4} + \ C\  = \ \left( \frac{1}{4} \right)\left( 1\  + \ x^{2} \right)^{4} + \ C$$

$d)\frac{d}{dx}\left( \left( \frac{1}{4} \right)\left( 1\  + \ x^{2} \right)^{4} \right) = \ \left( \frac{1}{4} \right)(4)\left( 1\  + \ x^{2} \right)^{3}(2x) = \ 2x\left( 1\  + \ x^{2} \right)^{3}$

2.  Find each indefinite integral using the given substitution.

+-------------------------------------------------------------------------------+----------------------------------------------------------------------------+
| a.  $\int_{}^{}{2(2x + 3)^{3}\ dx},\ \ u = 2x + 3$                            | b.  $\int_{}^{}{3x^{2}\left( 1 + x^{3} \right)^{4}\ dx},\ \ u = 1 + x^{3}$ |
|                                                                               |                                                                            |
| $$= \frac{1}{4}(2x + 3)^{4} + C$$                                             | $$= \frac{1}{5}\left( 1 + x^{3} \right)^{5} + C$$                          |
+===============================================================================+============================================================================+
| c.  $\int_{}^{}{\frac{2x}{\left( 1 + x^{2} \right)^{2}}dx},\ \ u = 1 + x^{2}$ | d.  $\int_{}^{}{\frac{3}{\sqrt{3x - 5}}dx},\ \ u = 3x - 5$                 |
|                                                                               |                                                                            |
| $$= \frac{- 1}{1 + x^{2}} + C$$                                               | $$= 2\sqrt{3x - 5} + C$$                                                   |
+-------------------------------------------------------------------------------+----------------------------------------------------------------------------+
| e.  $\int_{}^{}{\sin^{3}x\cos x\ dx},\ \ u = sinx$                            | f.  $\int_{}^{}{\frac{4x^{3}}{1 + x^{4}}dx},\ \ u = 1 + x^{4}$             |
|                                                                               |                                                                            |
| $$= \frac{1}{4}sin^{4}x + C$$                                                 | $$= \ln\left( 1 + x^{4} \right) + C$$                                      |
+-------------------------------------------------------------------------------+----------------------------------------------------------------------------+

3.  Consider $\int_{}^{}{\frac{x}{\sqrt{1\  - \ x^{2}}}dx}$, with
    $u\  = \ 1\  - \ x².$

    a.  Show that $x\ dx\  = \  - \frac{1}{2}du.$

    b.  Show the integral can be written as
        $- \frac{1}{2}\int_{}^{}{\ u^{- \frac{1}{2}}du}$.

    c.  Hence find the primitive of $\frac{x}{\sqrt{1\  - \ x^{2}}}.$

$$a)\ u\  = \ 1\  - \ x^{2}$$

$$du\  = \  - 2x\ dx$$

$$\ x\ dx\  = \  - \frac{1}{2}du\ $$

$$b)\ \int_{}^{}{\frac{x}{\sqrt{1\  - \ x^{2}}}dx} = \ \int_{}^{}{\ \left( \frac{1}{\sqrt{u}} \right)\left( - \frac{1}{2} \right)du}$$

$$= \  - \frac{1}{2}\int_{}^{}{\ u^{- \frac{1}{2}}du}$$

$$c)\  - \frac{1}{2}\left( 2\sqrt{u} \right) + \ C\  = \  - \sqrt{u} + \ C\ $$

$$= \  - \sqrt{1\  - \ x^{2}} + \ C$$

4.  Find each indefinite integral using the given substitution.

+---------------------------------------------------------------------------+--------------------------------------------------------------------------------------------+
| a.  $\int_{}^{}{x^{3}\left( x^{4} + 1 \right)^{5}\ dx},\ \ u = x^{4} + 1$ | b.  $\int_{}^{}{x^{2}\sqrt{x^{3} - 1}\ dx},\ \ u = x^{3} - 1$                              |
|                                                                           |                                                                                            |
| $$\frac{1}{24}\left( x^{4} + 1 \right)^{6} + C$$                          | $$\frac{2}{9}\left( x^{3} - 1 \right)^{\frac{3}{2}} + C$$                                  |
+===========================================================================+============================================================================================+
| c.  $\int_{}^{}{x^{2}e^{x^{3}}dx},\ \ u = x^{3}$                          | d.  $\int_{}^{}{\frac{1}{\sqrt{x\left( 1 + \sqrt{x} \right)^{3}}}dx},\ \ u = 1 + \sqrt{x}$ |
|                                                                           |                                                                                            |
| $$\frac{1}{3}e^{x^{3}} + C$$                                              | $$\frac{- 1}{\left( 1 + \sqrt{x} \right)^{2}} + C$$                                        |
+---------------------------------------------------------------------------+--------------------------------------------------------------------------------------------+
| e.  $\int_{}^{}{tan^{2}2xsec^{2}2x\ dx},\ \ u = \tan 2x$                  | f.  $\int_{}^{}{\frac{e^{\frac{1}{x}}}{x^{2}}dx},\ \ u = \frac{1}{x}$                      |
|                                                                           |                                                                                            |
| $$\frac{1}{6}\tan^{3}2x + C$$                                             | $$- e^{\frac{1}{x}} + C$$                                                                  |
+---------------------------------------------------------------------------+--------------------------------------------------------------------------------------------+

Development

5.  Find the exact value of each definite integral using the given
    substitution.

+-----------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------+
| a.  $\int_{0}^{1}{x^{2}\left( 2 + x^{3} \right)^{3}\ dx},\ \ u = 2 + x^{3}$ | b.  $\int_{0}^{1}{\frac{2x^{3}}{\sqrt{1 + x^{4}}}\ dx},\ \ u = 1 + x^{4}$                       |
|                                                                             |                                                                                                 |
| $$\frac{65}{12}$$                                                           | $$\sqrt{2} - 1$$                                                                                |
+=============================================================================+=================================================================================================+
| c.  $\int_{0}^{\frac{\pi}{2}}{cos^{2}x\sin x\ dx},\ \ u = cosx$             | d.  $\int_{\frac{\sqrt{3}}{2}}^{1}{x\sqrt{1 - x^{2}\ }dx},\ \ u = 1 - x^{2}$                    |
|                                                                             |                                                                                                 |
| $$\frac{1}{3}$$                                                             | $$\frac{1}{24}$$                                                                                |
+-----------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------+
| e.  $\int_{1}^{e^{2}}{\frac{\ln x}{x}dx},\ \ u = lnx$                       | f.  $\int_{0}^{4}{\frac{e^{\sqrt{x}}}{4\sqrt{x}}dx},\ \ u = \sqrt{x}$                           |
|                                                                             |                                                                                                 |
| $$2$$                                                                       | $$\frac{1}{2}\left( e^{2} - 1 \right)$$                                                         |
+-----------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------+
| g.  $\int_{0}^{\frac{\pi}{4}}{sin^{4}2x\ \cos 2x\ dx},\ \ u = \sin 2x$      | h.  $\int_{0}^{1}{\frac{\left( sin^{- 1}x \right)^{3}}{\sqrt{1 - x^{2}}}dx},\ \ u = sin^{- 1}x$ |
|                                                                             |                                                                                                 |
| $$\frac{1}{10}$$                                                            | $$\frac{\pi^{4}}{64}$$                                                                          |
+-----------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------+
| i.  $\int_{0}^{2}{\frac{x + 1}{\sqrt[3]{x^{2} + 2x}}dx},\ \ u = x^{2} + 2x$ | j.  $\int_{\frac{\pi}{4}}^{\frac{\pi}{3}}{\frac{sec^{2}x}{\tan x}dx},\ \ u = \tan x$            |
|                                                                             |                                                                                                 |
| $$3$$                                                                       | $$\frac{1}{2}ln3$$                                                                              |
+-----------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------+

6.  Use $u\  = \ x³$ to find the exact area bounded by
    $y\  = \frac{x^{2}}{1\  + \ x^{6}},$ the $x$-axis, and $x\  = \ 1$.

$$u\  = \ x^{3}\ $$

$$du\  = \ 3x^{2}dx\ $$

$$dx = \frac{du}{3x^{2}}$$

$$x = 0,\ u = 0\ $$

$$x = 1,\ u = 1$$

$$\int_{0}^{1}{\frac{x^{2}}{1\  + \ x^{6}}dx} = \frac{1}{3}\int_{0}^{1}{\frac{1}{1\  + \ u^{2}}du} = \ \left( \frac{1}{3} \right)\left\lbrack tan^{- 1}u \right\rbrack_{0}^{1} = \ \left( \frac{1}{3} \right)\left( \frac{\pi}{4} \right) = \frac{\pi}{12}$$

$$Area\  = \frac{\pi}{12}{units}^{2}$$

7.  Evaluate each definite integral using $u\  = \ \sin\ x$.

+--------------------------------------------------------------------+---------------------------------------------------------------------------+
| a.  $\int_{0}^{\frac{\pi}{6}}{\ \frac{\cos x}{1\  + \ sin\ x}dx}\$ | b.  $\int_{0}^{\frac{\pi}{2}}{\ \frac{\cos x}{1\  + \ \sin^{2}x}dx}$      |
|                                                                    |                                                                           |
| $$\ln\left( \frac{3}{2} \right)$$                                  | $$\frac{\pi}{4}$$                                                         |
+====================================================================+===========================================================================+
| c.  $\int_{0}^{\frac{\pi}{2}}{\cos^{3}x}\ dx$                      | d.  $\int_{\frac{\pi}{6}}^{\frac{\pi}{2}}{\frac{\cos^{3}x}{\sin^{4}x}dx}$ |
|                                                                    |                                                                           |
| $$\frac{2}{3}$$                                                    | $$\frac{4}{3}$$                                                           |
+--------------------------------------------------------------------+---------------------------------------------------------------------------+

8.  Find each indefinite integral using the given substitution.

+---------------------------------------------------------------------------------------------+------------------------------------------------------------------+
| a.  $\int_{}^{}{\frac{e^{2x}}{\sqrt{1\  + \ e^{2x}}}dx},\ \ \ u\  = \ e^{2x}$               | b.  $\int_{}^{}{\frac{1}{x\ \ln\ x}dx},\ \ \ u\  = \ \ln\ x$     |
|                                                                                             |                                                                  |
| $$\sqrt{1\  + \ e^{2x}} + \ C$$                                                             | $$\ln(ln\ x) + \ C$$                                             |
+=============================================================================================+==================================================================+
| c.  $\int_{}^{}{\ \frac{\tan x}{\ln\ \left( \cos\ x \right)}dx},\ \ \ u\  = \ln{(\cos x)}\$ | d.  $\int_{}^{}{\ tan^{3}x\ sec^{4}x\ dx},\ \ \ u\  = \ \tan\ x$ |
|                                                                                             |                                                                  |
| $$- ln|ln\ cos\ x| + \ C$$                                                                  | $$\frac{1}{4}\tan^{4}x\  + \frac{1}{6}\tan^{6}x\  + \ C$$        |
+---------------------------------------------------------------------------------------------+------------------------------------------------------------------+

Mastery

9.  a.  A curve has gradient function $\frac{e^{2x}}{1\  + \ e^{4x}}$
        and passes through $\left( 0,\frac{\pi}{8} \right).$\
        Use $u\  = \ e^{2x}$ to find its equation.

$$\ u\  = \ e^{2x};u^{2} = e^{4x}$$

$$\ du\  = \ 2e^{2x}dx$$

$$dx = \frac{du}{2e^{2x}}$$

$$y\  = \ \int_{}^{}{\frac{e^{2x}}{1\  + \ e^{4x}}dx} = \frac{1}{2}\int_{}^{}{\frac{1}{1\  + \ u^{2}}du}$$

$$= \ \left( \frac{1}{2} \right)tan^{- 1}u\  + \ C\ $$

$$= \ \left( \frac{1}{2} \right)tan^{- 1}\left( e^{2x} \right) + \ C$$

$$Sub\ \left( 0,\frac{\pi}{8} \right):$$

$$\frac{\pi}{8} = \ \left( \frac{1}{2} \right)tan^{- 1}(1) + \ C\ $$

$$= \ \left( \frac{1}{2} \right)\left( \frac{\pi}{4} \right) + \ C$$

$$C\  = \ 0$$

$$\therefore\ y\  = \ \left( \frac{1}{2} \right)tan^{- 1}\left( e^{2x} \right)$$

b.  If $y^{''} = \frac{x}{\left( 4\  - \ x^{2} \right)^{\frac{3}{2}}},$
    and when $x\  = \ 0,\ y'\  = \ 1$ and $y\  = \frac{1}{2}$,\
    use $u\  = \ 4\  - \ x²$ to find $y'\$and then $y$ as a function of
    $x$.

$$\ u\  = \ 4\  - \ x²\ $$

$$\ du\  = \  - 2x\ dx$$

$$dx = \frac{du}{- 2x}$$

$$y' = \ \int_{}^{}{\frac{x}{\left( 4\  - \ x^{2} \right)^{\frac{3}{2}}}dx} = \ \left( - \frac{1}{2} \right)\int_{}^{}{\ u^{- \frac{3}{2}}du} = \ \left( - \frac{1}{2} \right)( - 2)u^{- \frac{1}{2}} + \ C_{1} = \frac{1}{\sqrt{4\  - \ x^{2}}} + \ C_{1}\ $$

$$Sub\ x = 0,\ y' = 1:\ 1\  = \frac{1}{2} + \ C_{1}\ $$

$$\ C_{1} = \frac{1}{2}$$

$$y\  = \ \int_{}^{}{\ \left( \frac{1}{\sqrt{4\  - \ x^{2}}} + \frac{1}{2} \right)dx} = \ sin^{- 1}\left( \frac{x}{2} \right) + \frac{x}{2} + \ C_{2}$$

$$Sub\ x = 0,\ y = \frac{1}{2}:\frac{1}{2} = \ 0\  + \ 0\  + \ C_{2}$$

$$\ C_{2} = \frac{1}{2}$$

$$\therefore\ y\  = \ sin^{- 1}\left( \frac{x}{2} \right) + \frac{x}{2} + \frac{1}{2}$$

10. a.  Show that
        $\frac{d}{dx}\left( \sec\ x \right) = \ \sec\ x\ \tan\ x.$

$$\frac{d}{dx}\left( \sec\ x \right) = \frac{d}{dx}\left( \frac{1}{\cos x}\  \right)\ $$

$$= \ \frac{\sin x}{cos^{2}x}\  = \ \left( \frac{1}{\cos x} \right)\left( \frac{\sin x}{\cos x} \right)\ $$

$$= \ \sec\ x\ \tan\ x\ $$

b.  Use $u\  = \ \sec\ x$ and
    $\int_{}^{}{\ a^{x}\ dx} = \frac{a^{x}}{\ln a}$ to find:

+------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------+
| i.  $\int_{0}^{\frac{\pi}{3}}{\ 2^{\sec\ x}\sec\ x\ \tan\ x\ dx}$                        | ii. $\int_{0}^{\frac{\pi}{4}}{\ sec^{5}x\ \tan\ x\ dx}$                                       |
|                                                                                          |                                                                                               |
| $$x = 0,\ u = 1,\ $$                                                                     | $$dx = \frac{du}{\sec x\tan x}$$                                                              |
|                                                                                          |                                                                                               |
| $$x = \frac{\pi}{3},\ u = 2$$                                                            | $$x = 0,\ u = 1$$                                                                             |
|                                                                                          |                                                                                               |
| $$\frac{du}{dx} = \sec x\tan x$$                                                         | $$x = \frac{\pi}{4},\ u = \sqrt{2}$$                                                          |
|                                                                                          |                                                                                               |
| $$dx = \frac{du}{\sec x\tan x}$$                                                         | $$\int_{0}^{\frac{\pi}{4}}{\ sec^{5}x\ \tan\ x\ dx} = \int_{1}^{\sqrt{2}}{\ u^{4}du}$$        |
|                                                                                          |                                                                                               |
| $$\int_{0}^{\frac{\pi}{3}}{\ 2^{\sec\ x}\sec\ x\ \tan\ x\ dx} = \int_{1}^{2}{\ 2ᵘ\ du}$$ | $$= \ \left\lbrack \frac{u^{5}}{5} \right\rbrack_{1}^{\sqrt{2}} = \frac{4\sqrt{2} - \ 1}{5}$$ |
|                                                                                          |                                                                                               |
| $$= \ \left\lbrack \frac{2ᵘ}{\ln 2} \right\rbrack_{1}^{2} = \frac{4\  - \ 2}{\ln 2}\ $$  |                                                                                               |
|                                                                                          |                                                                                               |
| $$= \frac{2}{\ln 2}$$                                                                    |                                                                                               |
+==========================================================================================+===============================================================================================+

11. Evaluate each integral using the given substitution.

+--------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------+
| a.  $\int_{0}^{\frac{\pi}{2}}{\ \frac{\sin{2x}}{1\  + \ sin^{2}x}dx},\ \ \ \ \ \ \ \ u\  = \ sin^{2}x$ | b.  $\int_{1}^{e}{\frac{\ln\ x\  + \ 1}{\left( x\ \ln\ x\  + \ 1 \right)^{2}}dx},\ \ \ \ u\  = \ x\ \ln\ x$ |
|                                                                                                        |                                                                                                             |
| $$u\  = \ sin^{2}x\ $$                                                                                 | $$u\  = \ x\ ln\ x\ $$                                                                                      |
|                                                                                                        |                                                                                                             |
| $$\frac{du}{dx}\  = \ 2\sin x\cos x\ $$                                                                | $$\frac{du}{dx}\  = \ln x + 1$$                                                                             |
|                                                                                                        |                                                                                                             |
| $$dx = \frac{du}{2\sin x\cos x}\ $$                                                                    | $$dx = \frac{du}{ln\ x\  + \ 1}\ $$                                                                         |
|                                                                                                        |                                                                                                             |
| $$x = 0,\ u = 0,\ $$                                                                                   | $$x = 1,\ \ \ u = 0$$                                                                                       |
|                                                                                                        |                                                                                                             |
| $$x = \frac{\pi}{2},\ u = 1$$                                                                          | $$x = e,\ \ \ u = e$$                                                                                       |
|                                                                                                        |                                                                                                             |
| $$\int_{0}^{1}{\frac{1}{1\  + \ u}du} = \ \left\lbrack \ln(1\  + \ u) \right\rbrack_{0}^{1}\ $$        | $$\int_{0}^{e}{\ (u\  + \ 1)^{- 2}du} = \ \left\lbrack - \frac{1}{u\  + \ 1} \right\rbrack_{0}^{e}$$        |
|                                                                                                        |                                                                                                             |
| $$= \ ln\ 2$$                                                                                          | $$= \  - \frac{1}{e\  + \ 1} + \ 1 = \frac{e}{e\  + \ 1}$$                                                  |
+========================================================================================================+=============================================================================================================+

12. Integration by substitution is the formal setting out of reverse
    chain rule.\
    Consider a composite function $f\left( g(x) \right)$. Show that:

$$\ \ \ \ \ \ \ \ \ \ \ \int_{}^{}{f\left( g(x) \right)}g'(x)\ dx = f(u)\ du\ \ \ using\ u = g(x)$$

$$\frac{du}{dx} = g'(x)$$

$$dx = \frac{du}{g'(x)}$$

$$\int_{}^{}{f\left( g(x) \right)g'(x)}dx = \int_{}^{}{f(u)}g'(x) \cdot \frac{du}{g'(x)}$$

$$= \int_{}^{}{f(u)}du$$

13. Use $u\  = \ \sqrt{x\  - \ 1}$ to find
    $\int_{}^{}{\frac{1}{2x\sqrt{x\  - \ 1}}dx}$.

$$u\  = \ \sqrt{x\  - \ 1}\ $$

$\ u^{2} = \ x\  - \ 1$

$$\ x\  = \ u^{2} + \ 1;\ 2x\  = \ 2\left( u^{2} + \ 1 \right)$$

$$\frac{dx}{du} = 2u;dx = 2u\ du$$

$$\int_{}^{}{\frac{1}{2x\sqrt{x\  - \ 1}}dx} = \int_{}^{}{\frac{1}{2\left( u^{2} + \ 1 \right)u} \cdot \ 2u\ du}$$

$$= \ \int_{}^{}{\frac{1}{u^{2} + \ 1}du} = \ tan^{- 1}u\  + \ C\ $$

$$= \ tan^{- 1}\sqrt{x\  - \ 1} + \ C$$

14. a.  Use $u\  = \ \sqrt{x}$ to find
        $\int_{}^{}{\frac{1}{\sqrt{x(1\  - \ x)}}dx}$.

    b.  Evaluate the integral in part **a** again using
        $u\  = \ x\  - \frac{1}{2}$.

    c.  Hence show that
        $sin^{- 1}(2x\  - \ 1) = \ 2\ sin^{- 1}\sqrt{x} - \frac{\pi}{2}$,
        for $0\  < \ x\  < \ 1$.

$$a)\ u\  = \ \sqrt{x}$$

$$\ u^{2} = \ x$$

$$\ dx\  = \ 2u\ du;\ \sqrt{x} = \ u,\ 1\  - \ x\  = \ 1\  - \ u^{2}$$

$$\int_{}^{}{\frac{1}{\sqrt{u^{2}\left( 1\  - \ u^{2} \right)}} \cdot \ 2u\ du} = \ \int_{}^{}{\frac{2}{\sqrt{1\  - \ u^{2}}}du} = \ 2\ sin^{- 1}u\  + \ C\  = \ 2\ sin^{- 1}\sqrt{x} + \ C_{1}$$

$$b)\ u\  = \ x\  - \frac{1}{2}$$

$$\ x\  = \ u\  + \frac{1}{2},\ dx\  = \ du;\ x(1 - x) = \ \left( u\  + \frac{1}{2} \right)\left( \frac{1}{2} - \ u \right) = \frac{1}{4} - \ u^{2}$$

$$\int_{}^{}{\frac{1}{\sqrt{\frac{1}{4} - \ u^{2}}}du} = \ \int_{}^{}{\frac{1}{\frac{1}{2}\sqrt{1 - \left( \frac{u}{2} \right)^{2}}}du} = \ sin^{- 1}(2u) + \ C\  = \ sin^{- 1}(2x\  - \ 1) + \ C_{2}$$

c\) From (a) and (b), both are primitives of the same function, so:

$$\sin ⁻¹(2x\  - \ 1)\  + \ C₂\  = \ 2\ sin^{- 1}\sqrt{x}\  + \ C₁\ $$

$$At\ x\  = \frac{1}{2}:\ sin⁻¹(0)\  = \ 2\ \sin^{- 1}\left( \frac{1}{\sqrt{2}} \right)\  + \ (C₁\  - \ C₂)\ $$

$$\ 0\  = \ 2\left( \frac{\pi}{4} \right)\  + \ (C₁\  - \ C₂)\ $$

$$\ C₁\  - \ C₂\  = \  - \frac{\pi}{2}$$

$$\therefore\ sin^{- 1}(2x\  - \ 1) = \ 2\ sin^{- 1}\sqrt{x} - \frac{\pi}{2}$$

# Further Integration by Substitution

+-----------------------------------------------------------------------+
| - **Integrating by Substitution where you are given** $\mathbf{x}$    |
+===================================+===================================+
| Sometimes the question can tell you to 'let $x = '$ rather than       |
| $'u = '$.                                                             |
+-----------------------------------+-----------------------------------+
| 3.  Replace every $x$ expression  | 1.  Let $x = f(u)$                |
|     with $u$, and $dx\$with the   |                                   |
|     expression from step 2.       | 2.  Find $\frac{dx}{du}$ and $dx$ |
|     Replace any limits.           |                                   |
|                                   |                                   |
| 4.  Integrate with respect to     |                                   |
|     $u$.                          |                                   |
+-----------------------------------+-----------------------------------+
| - Note: when given a choice, we always take a positive root           |
|   $u \geq 0.$\                                                        |
|   (you can take the negative root and get the same answer, but the    |
|   algebra is harder)                                                  |
+-----------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Integrate where the variable of integration is the subject of the substitution                                                                                                                             |
+===========================================================================================================================================================================+==============================================+
| $$\int_{}^{}{x\sqrt{1 - x}}dx,\ \ using\ x = 1 - u^{2}$$                                                                                                                                                                 |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------+
| $$3.\ \int_{}^{}{x\sqrt{1 - x}}dx = \int_{}^{}{\left( 1 - u^{2} \right)\sqrt{1 - \left( 1 - u^{2} \right)}}dx$$                                                           | $1.$ Let $x = 1 - u^{2}$                     |
|                                                                                                                                                                           |                                              |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = - 2\int_{}^{}\left( 1 - u^{2} \right)u\ ( - 2u\ du)$$                                              | $$2.\ \ \frac{dx}{du} = - 2u;dx = - 2u\ du$$ |
|                                                                                                                                                                           |                                              |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = - 2\int_{}^{}{u^{2} - u^{4}}du$$                                                                   | Note: when $u = \pm \sqrt{1 - x}$, take the  |
|                                                                                                                                                                           | positive root.                               |
| $$4.\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = - 2\left( \frac{u^{3}}{3} - \frac{u^{5}}{5} \right) + C$$                                                  |                                              |
|                                                                                                                                                                           |                                              |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \  - 2\left( \frac{\sqrt{(1 - x)^{3}}}{3} - \frac{\sqrt{(1 - x)^{5}}}{5} \right) + C$$ |                                              |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------+

+------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                            |
+==================================================================================================================+
| a.                                                                                                               |
|                                                                                                                  |
| $$\int_{}^{}{x^{2}\sqrt{1 - x}}\ dx,\ using\ x = 1 - u^{2}$$                                                     |
|                                                                                                                  |
| $$- \frac{2(1 - x)^{\frac{7}{2}}}{7} + \frac{4(1 - x)^{\frac{5}{2}}}{5} - \frac{2(1 - x)^{\frac{3}{2}}}{3} + C$$ |
+------------------------------------------------------------------------------------------------------------------+
| b.                                                                                                               |
|                                                                                                                  |
| $$\int_{0}^{1}{x\sqrt{1 - x^{2}}}dx,\ using\ x = \sin\theta$$                                                    |
|                                                                                                                  |
| $$\frac{1}{3}$$                                                                                                  |
+------------------------------------------------------------------------------------------------------------------+

Foundation

1.  Consider $I\  = \ \int_{}^{}{\ x(x\  - \ 1)^{5}dx}$, with
    $x\  = \ u\  + \ 1$.

    a.  Show that $dx\  = \ du$.

    b.  Show that $I\  = \ \int_{}^{}{\ u^{5}(u\  + \ 1)du}$.

    c.  Hence find $I$.

    d.  Check by differentiating.

$$a)\ x\  = \ u\  + \ 1$$

$$\ dx\  = \ du\ $$

$$b)\ x\  = \ u\  + \ 1,\ \ \ u = x - 1:$$

$$I\  = \ \int_{}^{}{\ (u\  + \ 1)u^{5}\ du} = \ \int_{}^{}{\ u^{5}(u\  + \ 1)du}\ $$

$$c)\ \int_{}^{}{\ \left( u^{6} + \ u^{5} \right)du} = \frac{u^{7}}{7} + \frac{u^{6}}{6} + \ C\  = \ \left( \frac{1}{7} \right)(x - 1)^{7} + \ \left( \frac{1}{6} \right)(x - 1)^{6} + \ C$$

$d)\frac{d}{dx}\left( \left( \frac{1}{7} \right)(x - 1)^{7} + \ \left( \frac{1}{6} \right)(x - 1)^{6} \right) = \ (x - 1)^{6} + \ (x - 1)^{5} = \ (x - 1)^{5}(x - 1 + 1) = \ x(x - 1)^{5}$

2.  Using the same substitution $x\  = \ u\  + \ 1$, find:

+-----------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------+
| a.  $\int_{}^{}{\frac{x}{\sqrt{x\  - \ 1}}dx}$                                                                        | b.  $\int_{}^{}{\frac{x}{(x\  - \ 1)^{2}}dx}$                                                    |
|                                                                                                                       |                                                                                                  |
| $$x\  = \ u\  + \ 1,\ \ dx\  = \ du,\ \ u = x - 1$$                                                                   | $$\int_{}^{}{\frac{u\  + \ 1}{u^{2}}du} = \ \int_{}^{}{\ \left( u^{- 1} + \ u^{- 2} \right)du}$$ |
|                                                                                                                       |                                                                                                  |
| $$\int_{}^{}{\frac{u\  + \ 1}{\sqrt{u}}du} = \ \int_{}^{}{\ \left( u^{\frac{1}{2}} + \ u^{- \frac{1}{2}} \right)du}$$ | $$= \ \ln|u| - \frac{1}{u} + \ C\ $$                                                             |
|                                                                                                                       |                                                                                                  |
| $$= \ \left( \frac{2}{3} \right)u^{\frac{3}{2}} + \ 2u^{\frac{1}{2}} + \ C\ $$                                        | $$= \ \ln|x - 1| - \frac{1}{x - 1} + \ C$$                                                       |
|                                                                                                                       |                                                                                                  |
| $$= \ \left( \frac{2}{3} \right)(x - 1)^{\frac{3}{2}} + \ 2\sqrt{x - 1} + \ C$$                                       |                                                                                                  |
+=======================================================================================================================+==================================================================================================+
| a.  $\int_{}^{}{\frac{x\  - \ 2}{x\  + \ 2}dx},\ x\  = \ u\  - \ 2$                                                   | b.  $\int_{}^{}{\frac{2x\  + \ 1}{\sqrt{2x\  - \ 1}}dx},\ x\  = \frac{1}{2}(u\  + \ 1)$          |
|                                                                                                                       |                                                                                                  |
| $$(x\  + \ 2) - \ 4\ ln|x\  + \ 2| + \ C$$                                                                            | $$= \frac{1}{3}(2x - 1)^{\frac{3}{2}} + \ 2\sqrt{2x - 1} + \ C$$                                 |
+-----------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------+

3.  Consider $J\  = \ \int_{}^{}{\ x\sqrt{x\  + \ 1}\ dx}$, with
    $x\  = \ u²\  - \ 1$.

    a.  Show that $dx\  = \ 2u\ du$.

    b.  Show that
        $J\  = \ 2\int_{}^{}{\ \left( u^{4} - \ u^{2} \right)du}$.

    c.  Hence find $J$.

    d.  Check by differentiating.

$$a)\ x\  = \ u^{2} - \ 1\ $$

$$\ dx\  = \ 2u\ du\ $$

$$b)\ x\  + \ 1\  = \ u^{2},\ \sqrt{x + 1} = \ u:$$

$$J\  = \ \int_{}^{}{\ \left( u^{2} - \ 1 \right)(u)(2u)du}$$

$$= \ 2\int_{}^{}{\ \left( u^{4} - \ u^{2} \right)du}$$

$$c)\ 2\left( \frac{u^{5}}{5} - \frac{u^{3}}{3} \right) + \ C\  = \ \left( \frac{2}{5} \right)u^{5} - \ \left( \frac{2}{3} \right)u^{3} + \ C\ $$

$$= \ \left( \frac{2}{5} \right)(x + 1)^{\frac{5}{2}} - \ \left( \frac{2}{3} \right)(x + 1)^{\frac{3}{2}} + \ C$$

$$d)\frac{d}{dx}\left( \left( \frac{2}{5} \right)(x + 1)^{\frac{5}{2}} - \ \left( \frac{2}{3} \right)(x + 1)^{\frac{3}{2}} \right) = \ (x + 1)^{\frac{3}{2}} - \ (x + 1)^{\frac{1}{2}}$$

$$= \ \sqrt{(x + 1)\left( (x + 1) - \ 1 \right)} = \ x\sqrt{x + 1}$$

4.  a.  Find $\int x\sqrt{1 + x}\ dx$ using the substitution
        $x\  = \ u²\  - \ 1$, where $u\  \geq \ 0$.

    b.  Find $\int x\sqrt{1 + x}\ dx$ using the substitution
        $x\  = \ u^{2} - \ 1$, where $u\  \leq \ 0.$Show that your
        answer simplifies to the same result as part **a**.

a\) Let $x\  = \ u²\  - \ 1$, $dx\  = \ 2u\ du$ and
$u = \sqrt{1\  + \ x}$ (since $u\  \geq \ 0$).

$$\int_{}^{}{\left( u^{2} - \ 1 \right)(u)(2u)}du\  = \ 2\int_{}^{}\left( u^{4} - \ u^{2} \right)du\  = \ 2\left( \frac{u^{5}}{5} - \frac{u^{3}}{3} \right) + \ C$$

$$= \ 2\left( \frac{(1 + x)^{\frac{5}{2}}}{5} - \frac{(1 + x)^{\frac{3}{2}}}{3} \right) + \ C$$

Let $x\  = \ u²\  - \ 1$, $dx\  = \ 2u\ du$ and $u = - \sqrt{1\  + \ x}$
(since $u\  \leq \ 0$).

$$\int_{}^{}{(u²\  - \ 1)( - u)(2u)}\ du\  = \  - 2\int_{}^{}\left( u^{4} - \ u^{2} \right)du\  = \  - 2\left( \frac{u^{5}}{5} - \frac{u^{3}}{3} \right) + \ C$$

$$= \  - 2\left( \left( \frac{\left( - \sqrt{1 + x} \right)^{5}}{5} - \frac{\left( - \sqrt{1 + x} \right)^{3}}{3} \right) \right) + \ C$$

$$= \  - 2\left( - \frac{(1 + x)^{\frac{5}{2}}}{5} + \frac{(1 + x)^{\frac{3}{2}}}{3} \right) + \ C$$

$$= \ 2\left( \frac{(1 + x)^{\frac{5}{2}}}{5} - \frac{(1 + x)^{\frac{3}{2}}}{3} \right) + \ C$$

∴ both give the same antiderivative.

Development

5.  Find each indefinite integral using the given substitution. Assume
    $u \geq 0$.

+-----------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------+
| a.  $\int_{}^{}{\ 3x\sqrt{4x\  - \ 5}dx},\ x\  = \frac{1}{4}\left( u^{2} + \ 5 \right)$ | b.  $\int_{}^{}{\frac{1}{1\  + \ \sqrt{x}}dx},\ x\  = \ (u\  - \ 1)^{2}$                |
|                                                                                         |                                                                                         |
| $$= \frac{3}{40}(4x - 5)^{\frac{5}{2}} + \frac{1}{8}(4x - 5)^{\frac{3}{2}} + \ C$$      | $$= \ 2\left( 1\  + \ \sqrt{x} \right) - \ 2\ ln\left( 1\  + \ \sqrt{x} \right) + \ C$$ |
+=========================================================================================+=========================================================================================+

6.  Evaluate using the given substitution.

+-----------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
| a.  $\int_{0}^{1}{x(x + 1)^{3}\ dx},\ \ x = u - 1$                          | b.  $\int_{0}^{\frac{1}{2}}{\frac{1 + x}{1 - x}\ dx},\ \ x = 1 - u$                                |
|                                                                             |                                                                                                    |
| $$\frac{49}{20}$$                                                           | $$2\ln 2 - \frac{1}{2}$$                                                                           |
+=============================================================================+====================================================================================================+
| c.  $\int_{0}^{1}{\frac{3x}{\sqrt{3x + 1}}\ dx},\ \ x = \frac{1}{3}(u - 1)$ | d.  $\int_{0}^{1}{\frac{2 - x}{(2 + x)^{3}}\ dx},\ \ x = u - 2$                                    |
|                                                                             |                                                                                                    |
| $$\frac{8}{9}$$                                                             | $$\frac{1}{9}$$                                                                                    |
+-----------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
| e.  $\int_{0}^{4}{x\sqrt{4 - x}\ dx},\ \ x = 4 - u^{2}$                     | f.  $\int_{1}^{5}{\frac{x}{(2x - 1)^{\frac{3}{2}}}dx},\ \ x = \frac{1}{2}\left( u^{2} + 1 \right)$ |
|                                                                             |                                                                                                    |
| $$\frac{128}{15}$$                                                          | $$\frac{4}{3}$$                                                                                    |
+-----------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------+

7.  Consider
    $I\  = \ \int_{}^{}{\frac{1}{\sqrt{5\  - \ 4x\  - \ x^{2}}}dx}$,
    with $x\  = \ u\  - \ 2$.

    a.  Show that
        I$\  = \ \int_{}^{}{\frac{1}{\sqrt{9\  - \ u^{2}}}du}$, and
        hence find $I$.

    b.  Also solve by completing the square for the denominator.

$$x = u - 2;\ dx = du$$

$$5 - 4x - x^{2} = 5 - 4(u - 2) - (u - 2)^{2}$$

$$= 5 - 4u + 8 - u^{2} + 4u - 4$$

$$= 9 - u^{2}$$

$$\therefore I = \int_{}^{}{\frac{1}{\sqrt{9 - u^{2}}}du} = sin^{- 1}\left( \frac{u}{3} \right) + C$$

$$= sin^{- 1}\left( \frac{x + 2}{3} \right) + C
$$

Alternative method: completing the square:

$$5\  - \ 4x\  - \ x^{2} = \  - \left( x^{2} + \ 4x\  - \ 5 \right) = \  - \left( (x\  + \ 2)^{2} - \ 9 \right)$$

$$= \ 9\  - \ (x\  + \ 2)^{2}$$

$\int_{}^{}{\frac{1}{\sqrt{9\  - \ (x + 2)^{2}}}dx} = \ sin^{- 1}\left( \frac{x + 2}{3} \right) + \ C$

Use a similar approach to find:

c.  $\int_{}^{}{\frac{1}{x^{2} + 2x + 4}dx},\ \ x = u - 1$

$$\int_{}^{}{\frac{1}{u^{2} + \ 3}du} = \ \left( \frac{1}{\sqrt{3}} \right)tan^{- 1}\left( \frac{u}{\sqrt{3}} \right) + \ C\ $$

$$= \ \left( \frac{1}{\sqrt{3}} \right)tan^{- 1}\left( \frac{x + 1}{\sqrt{3}} \right) + \ C$$

d.  $\int_{}^{}{\frac{1}{\sqrt{4 - 2x - x^{2}}}dx},\ \ x = u - 1$

$$\int_{}^{}{\frac{1}{\sqrt{5\  - \ u^{2}}}du} = \ sin^{- 1}\left( \frac{u}{\sqrt{5}} \right) + \ C\ $$

$$= \ sin^{- 1}\left( \frac{x + 1}{\sqrt{5}} \right) + \ C$$

e.  $\int_{1}^{2}{\frac{1}{\sqrt{3 + 2x - x^{2}}}dx},\ \ x = u + 1$

$$\int_{0}^{1}{\frac{1}{\sqrt{4\  - \ u^{2}}}du} = \ \left\lbrack sin^{- 1}\left( \frac{u}{2} \right) \right\rbrack_{0}^{1} = \ sin^{- 1}\left( \frac{1}{2} \right)$$

$$= \frac{\pi}{6}$$

f.  $\int_{3}^{7}{\frac{1}{x^{2} - 6x + 25}dx},\ \ x = u + 3$

$$\int_{0}^{4}{\frac{1}{u^{2} + \ 16}du} = \ \left( \frac{1}{4} \right)\left\lbrack tan^{- 1}\left( \frac{u}{4} \right) \right\rbrack_{0}^{4} = \ \left( \frac{1}{4} \right)\left( \frac{\pi}{4} \right)$$

$$= \frac{\pi}{16}$$

8.  Consider $J\  = \ \int_{}^{}{\frac{1}{\sqrt{4\  - \ x^{2}}}dx}$,
    with x = 2 sin θ.

    a.  Show that $J\  = \ \int_{}^{}{\ 1\ d\theta}$, and hence show
        $J\  = \ sin^{- 1}\left( \frac{x}{2} \right) + \ C$.

$$x\  = \ 2\ sin\ \theta\ $$

$$\ dx\  = \ 2\ \cos\ \theta\ d\theta;\ \sqrt{4\  - \ x^{2}} = \ \sqrt{4\  - \ 4sin^{2}\theta} = \ 2\ cos\ \theta$$

$$J\  = \ \int_{}^{}{\ \left( \frac{1}{2\ \cos\ \theta} \right)(2\ cos\ \theta)d\theta} = \ \int_{}^{}{\ 1\ d\theta}\ $$

$= \ \theta\  + \ C\  = \ sin^{- 1}\left( \frac{x}{2} \right) + \ C$

Using a similar approach, find:

b.  $\int_{}^{}{\frac{1}{9\  + \ x^{2}}dx},\ x\  = \ 3\ \tan\ \theta$

$$\int_{}^{}{\ \left( \frac{1}{9\ sec^{2}\theta} \right)\left( 3\ sec^{2}\theta \right)d\theta} = \ \left( \frac{1}{3} \right)\int_{}^{}{\ 1\ d\theta} = \frac{\theta}{3} + \ C\ $$

$$= \ \left( \frac{1}{3} \right)tan^{- 1}\left( \frac{x}{3} \right) + \ C$$

c.  $\int_{}^{}{\frac{- 1}{\sqrt{3\  - \ x^{2}}}dx},\ x\  = \ \sqrt{3}\cos\ \theta$

$$\int_{}^{}{\ \left( - \frac{1}{\sqrt{3}sin\ \theta} \right)\left( - \sqrt{3}sin\ \theta \right)d\theta} = \ \int_{}^{}{\ 1\ d\theta} = \ \theta\  + \ C\ $$

$$= \ cos^{- 1}\left( \frac{x}{\sqrt{3}} \right) + \ C$$

d.  $\int_{}^{}{\frac{1}{\sqrt{1\  - \ 4x^{2}}}dx},\ x\  = \frac{1}{2}\sin\ \theta$

$$\int_{}^{}{\ \left( \frac{1}{\cos\theta} \right)\left( \left( \frac{1}{2} \right)\cos\ \theta \right)d\theta} = \ \left( \frac{1}{2} \right)\theta\  + \ C\ $$

$$= \ \left( \frac{1}{2} \right)sin^{- 1}(2x) + \ C$$

e.  $\int_{}^{}{\frac{1}{1\  + \ 16x^{2}}dx},\ x\  = \frac{1}{4}\tan\ \theta$

$$\int_{}^{}{\ \left( \frac{1}{sec^{2}\theta} \right)\left( \left( \frac{1}{4} \right)sec^{2}\theta \right)d\theta} = \ \left( \frac{1}{4} \right)\theta\  + \ C\ $$

$$= \ \left( \frac{1}{4} \right)tan^{- 1}(4x) + \ C$$

f.  $\int_{0}^{3}{\frac{1}{\sqrt{36\  - \ x^{2}}}dx},\ x\  = \ 6\ \sin\ \theta$

$$\int_{0}^{\frac{\pi}{6}}{\ \left( \frac{1}{6\ \cos\ \theta} \right)\left( 6\ \cos\ \theta \right)d\theta} = \ \int_{0}^{\frac{\pi}{6}}{\ 1\ d\theta} = \frac{\pi}{6}$$

Mastery

9.  Evaluate $\int_{0}^{1}\frac{x}{\sqrt{1\  + \ x^{2}}}\ dx$ using
    three different methods and confirm you get the same answer.

    a.  substitution $u\  = \ 1\  + \ x²$

    b.  substitution $x²\  = \ t$

    c.  trigonometric substitution $x\  = \tan\theta$

$$a)\ Let\ u\  = \ 1\  + \ x^{2},\ so\ du\  = \ 2x\ dx,\ dx\  = \frac{du}{2x}.$$

$$Limits:\ x\  = \ 0,\ u\  = \ 1$$

$$x\  = \ 1,\ u\  = \ 2.$$

$$\int_{1}^{2}{\left( \frac{1}{2} \right)u^{- \frac{1}{2}}}du\  = \ \left( \frac{1}{2} \right)\left\lbrack 2\sqrt{u} \right\rbrack_{1}^{2} = \ \left\lbrack \sqrt{u} \right\rbrack_{1}^{2}$$

$$= \ \sqrt{2} - \ 1$$

$$b)\ Let\ x^{2} = \ t,\ so\ x\  = \ \sqrt{t},\ dx\  = \frac{dt}{2\sqrt{t}}.$$

$$Limits:\ x\  = \ 0,\ t\  = \ 0$$

$$x\  = \ 1,\ t\  = \ 1.$$

$$\int_{0}^{1}{\left( \frac{\sqrt{t}}{\sqrt{1\  + \ t}} \cdot \frac{1}{2\sqrt{t}} \right)dt} = \ \left( \frac{1}{2} \right)(1\  + \ t)^{- \frac{1}{2}}dt$$

$$= \ \left( \frac{1}{2} \right)\left\lbrack 2\sqrt{1\  + \ t} \right\rbrack_{0}^{1} = \ \left\lbrack \sqrt{1\  + \ t} \right\rbrack_{0}^{1} = \ \sqrt{2} - \ 1$$

$$c)\ Let\ x\  = \ tan\theta,\ so\ dx\  = \ sec^{2}\theta\ d\theta\ \sqrt{1\  + \ x^{2}} = \ sec\theta.$$

$$Limits:\ x\  = \ 0,\ \theta\  = \ 0$$

$$x\  = \ 1,\ \theta\  = \frac{\pi}{4}$$

$$\int_{0}^{\frac{\pi}{4}}\frac{\tan\theta}{\sec\theta} \cdot \ sec^{2}\theta\ d\theta\  = \int_{0}^{\frac{\pi}{4}}\frac{\sin\theta}{\cos^{2}\theta}\ d\theta = \int_{0}^{\frac{\pi}{4}}{\sin\theta\left( \cos\theta \right)^{- 2}}\ d\theta$$

$$= \ \left\lbrack \left( \cos\theta \right)^{- 1} \right\rbrack_{0}^{\frac{\pi}{4}} = \frac{1}{\cos\frac{\pi}{4}} - \frac{1}{\cos 0}$$

$$= \ \sqrt{2} - \ 1$$

10. Find the equation of $y\  = \ f(x)$ if
    $f'(x) = \frac{\sqrt{x^{2} - \ 9}}{x}$ and $f(3)\  = \ 0$. Use
    $x\  = \ 3\ \sec\ \theta$.

$$We\ are\ trying\ to\ find\ f(x) = \int_{}^{}{f'(x)}dx = \int_{}^{}{\frac{\sqrt{x^{2} - 9}}{x}dx}$$

$$Let\ x\  = \ 3\ sec\ \theta\ $$

$$\ dx\  = \ 3\sec\theta\tan\theta d\theta;\ $$

$$\sqrt{x^{2} - 9} = \sqrt{9\sec^{2}\theta - 9} = \sqrt{9\left( \tan^{2}\theta \right)}\  = \ 3\ tan\ \theta$$

$$also\ simplify\ f'(x) = \frac{\sqrt{x^{2} - 9}}{x} = \ \frac{3\tan\theta}{3\ sec\ \theta} = \ sin\ \theta$$

$$\therefore f(x) = \int_{}^{}{\frac{\sqrt{x^{2} - 9}}{x}dx} = \ \int_{}^{}{\sin\theta \cdot \ 3\ sec\ \theta\ tan\ \theta\ d\theta}$$

$$= \ 3\int_{}^{}{\ tan^{2}\theta\ d\theta} = \ 3\int_{}^{}{\ \left( sec^{2}\theta\  - \ 1 \right)d\theta}$$

$$= \ 3(tan\ \theta\  - \ \theta) + \ C$$

$$tan\ \theta\  = \frac{\sqrt{x^{2} - 9}}{3},\ \theta\  = \ sec^{- 1}\left( \frac{x}{3} \right):$$

$$f(x) = \ \sqrt{x^{2} - 9} - \ 3\ sec^{- 1}\left( \frac{x}{3} \right) + \ C$$

$$Sub\ f(3) = \ 0:\ 0\  = \ 0\  - \ 3(0) + \ C;\ \ \therefore C\  = \ 0$$

$$\therefore\ f(x) = \ \sqrt{x^{2} - 9} - \ 3\ sec^{- 1}\left( \frac{x}{3} \right)$$

# Integrating sin²$\mathbf{x}$ and cos²$\mathbf{x}$

+-------------------------------------------------------------------------------------------------------------------------+
| - **Review**                                                                                                            |
+=========================================================================================================================+
| - Recall double angle formulae                                                                                          |
|                                                                                                                         |
| > Show that:                                                                                                            |
|                                                                                                                         |
| +-----------------------------------------------------+---------------------------------------------------------------+ |
| | a.  $sin^{2}x\  = \frac{1}{2} - \frac{1}{2}cos\ 2x$ | b.  $cos^{2}2x\  = \frac{1}{2} + \frac{1}{2}cos\ 4x$          | |
| +=====================================================+===============================================================+ |
| | c.  $sin\ 3x\ cos\ 3x\  = \frac{1}{2}sin\ 6x$       | d.  $2\ sin^{2}\left( \frac{x}{2} \right) = \ 1\  - \ cos\ x$ | |
| +-----------------------------------------------------+---------------------------------------------------------------+ |
|                                                                                                                         |
| - Integrate sin and cosine functions                                                                                    |
|                                                                                                                         |
| +-------------------------------------+-------------------------------------+                                           |
| | a.  $\int_{}^{}{\cos{6x}}\ dx$      | b.  $\int_{}^{}{1 - \cos{6x}}\ dx$  |                                           |
| +=====================================+=====================================+                                           |
| | c.  $\int_{}^{}{\cos{18x} + 1}\ dx$ | d.  $\int_{}^{}{1 - \cos{10x}}\ dx$ |                                           |
| +-------------------------------------+-------------------------------------+                                           |
+-------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------+
| - **Integral of** $\mathbf{\sin}^{\mathbf{2}}\mathbf{x}$ **and** $\mathbf{\cos}^{\mathbf{2}}\mathbf{x}$                                |
+===================================================================+====================================================================+
| To integrate $\sin^{2}x$ and $\cos^{2}x,\$we use the double angle formula:                                                             |
+-------------------------------------------------------------------+--------------------------------------------------------------------+
| $${\cos{2x} = 2\cos^{2}x - 1                                      | $$\cos{2x} = 1 - 2\sin^{2}x$$                                      |
| }{\cos^{2}x = \frac{1}{2}\left( \cos{2x} + 1 \right)              |                                                                    |
| }{\int_{}^{}{\cos^{2}x}dx = \frac{1}{2}\int_{}^{}{\cos{2x} + 1}dx | $$\sin^{2}x = \frac{1}{2}\left( 1 - \cos{2x} \right)$$             |
| }{= \frac{1}{2}\left( \frac{1}{2}\sin{2x} + x \right) + C         |                                                                    |
| }{= \frac{1}{4}\sin{2x} + \frac{x}{2} + C}$$                      | $${\int_{}^{}{\sin^{2}x}dx = \frac{1}{2}\int_{}^{}{1 - \cos{2x}}dx |
|                                                                   | }{= \frac{1}{2}\left( x - \frac{1}{2}\sin{2x} \right) + C          |
|                                                                   | }{= \frac{x}{2} - \frac{1}{4}\sin{2x} + C}$$                       |
+-------------------------------------------------------------------+--------------------------------------------------------------------+
| - These integrals are not given on your reference sheet.\                                                                              |
|   Mr Ding recommends you know the full process rather than try to memorise the formula.                                                |
+----------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Integrate $\sin^{2}x$ and $\cos^{2}x$                                                                                                                                                     |
+==================================================================================================================================+======================================================================+
| $$\ \ \ \ \int_{0}^{\frac{\pi}{4}}{\sin^{2}x}dx$$                                                                                | $$\ \ \ \ \ \int_{}^{}{\cos^{2}{9x}dx}$$                             |
|                                                                                                                                  |                                                                      |
| $${= \frac{1}{2}\int_{0}^{\frac{\pi}{4}}{1 - \cos{2x}}dx                                                                         | using $\cos{18x} = 2\cos^{2}{9x} - 1$:                               |
| }{= \frac{1}{2}\left\lbrack x - \frac{1}{2}\sin{2x} \right\rbrack_{0}^{\frac{\pi}{4}}                                            |                                                                      |
| }{= \frac{1}{2}\left( \frac{\pi}{4} - \frac{1}{2}\sin\left( \frac{\pi}{2} \right) - \left( 0 - \frac{1}{2}\sin 0 \right) \right) | $$\ \ \ \ \ \ \ \ \ \ \ \ \ \cos^{2}{9x} = \frac{\cos{18x} + 1}{2}$$ |
| }{= \frac{1}{2}\left( \frac{\pi}{4} - \frac{1}{2} \right)                                                                        |                                                                      |
| }{= \frac{\pi}{8} - \frac{1}{4}}$$                                                                                               | $$= \frac{1}{2}\int_{}^{}{\cos{18x} + 1}dx$$                         |
|                                                                                                                                  |                                                                      |
|                                                                                                                                  | $$= \frac{1}{2}\left( \frac{1}{18}\sin{18x} + x \right) + C$$        |
+----------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------+

+------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                    |
+==============================================+===========================================+
| a.                                           | b.                                        |
|                                              |                                           |
| $$\int_{}^{}{\sin^{2}{5x}}dx$$               | $$\int_{0}^{\frac{\pi}{3}}{\cos^{2}xdx}$$ |
|                                              |                                           |
| $$- \frac{\sin{10x}}{20} + \frac{x}{2} + C$$ | $$\frac{\sqrt{3}}{8} + \frac{\pi}{6}$$    |
+----------------------------------------------+-------------------------------------------+

Foundation

1.  Express sin²θ in terms of cos 2θ

$$\sin^{2}\theta\  = \frac{1}{2} - \frac{1}{2}cos\ 2\theta$$

Hence find:

+-------------------------------------------------------------------------------------------+-------------------------------------------------------------------+
| a.  $\int_{}^{}{sin^{2}x}\ dx$                                                            | b.  $\int_{}^{}{sin^{2}2x}\ dx$                                   |
|                                                                                           |                                                                   |
| $$\int_{}^{}\left( \frac{1}{2} - \frac{1}{2}cos\ 2x \right)dx\ $$                         | $$\int_{}^{}\left( \frac{1}{2} - \frac{1}{2}cos\ 4x \right)dx\ $$ |
|                                                                                           |                                                                   |
| $$= \frac{1}{2}x\  - \frac{1}{4}sin\ 2x\  + \ C$$                                         | $$= \frac{1}{2}x\  - \frac{1}{8}sin\ 4x\  + \ C$$                 |
+===========================================================================================+===================================================================+
| c.  $\int_{}^{}{sin^{2}\left( \frac{1}{4} \right)x}\ dx$                                  | d.  $\int_{}^{}{sin^{2}3x}\ dx$                                   |
|                                                                                           |                                                                   |
| $$\int_{}^{}\left( \frac{1}{2} - \frac{1}{2}\cos\left( \frac{1}{2} \right)x \right)dx\ $$ | $$\int_{}^{}\left( \frac{1}{2} - \frac{1}{2}cos\ 6x \right)dx\ $$ |
|                                                                                           |                                                                   |
| $$= \frac{1}{2}x\  - \ sin\left( \frac{1}{2} \right)x\  + \ C$$                           | $$= \frac{1}{2}x\  - \frac{1}{12}sin\ 6x\  + \ C$$                |
+-------------------------------------------------------------------------------------------+-------------------------------------------------------------------+

2.  Express cos²θ in terms of cos 2θ

$$cos^{2}\theta\  = \frac{1}{2} + \frac{1}{2}cos\ 2\theta$$

Hence find:

+-------------------------------------------------------------------+----------------------------------------------------------------------+
| a.  $\int_{}^{}{cos^{2}x}\ dx$                                    | b.  $\int_{}^{}{cos^{2}6x}\ dx$                                      |
|                                                                   |                                                                      |
| $$\int_{}^{}\left( \frac{1}{2} + \frac{1}{2}cos\ 2x \right)dx\ $$ | $$\int_{}^{}\left( \frac{1}{2} + \frac{1}{2}cos\ 12x \right)dx\ $$   |
|                                                                   |                                                                      |
| $$= \frac{1}{2}x\  + \frac{1}{4}sin\ 2x\  + \ C$$                 | $$= \frac{1}{2}x\  + \frac{1}{24}sin\ 12x\  + \ C$$                  |
+===================================================================+======================================================================+
| c.  $\int_{}^{}{cos^{2}\left( \frac{1}{2} \right)x}\ dx$          | d.  $\int_{}^{}{cos^{2}10x}\ dx$                                     |
|                                                                   |                                                                      |
| $$\int_{}^{}\left( \frac{1}{2} + \frac{1}{2}cos\ x \right)dx\ $$  | $$\ \int_{}^{}\left( \frac{1}{2} + \frac{1}{2}cos\ 20x \right)dx\ $$ |
|                                                                   |                                                                      |
| $$= \frac{1}{2}x\  + \frac{1}{2}sin\ x\  + \ C$$                  | $$= \frac{1}{2}x\  + \frac{1}{40}sin\ 20x\  + \ C$$                  |
+-------------------------------------------------------------------+----------------------------------------------------------------------+

3.  Use the results
    $sin^{2}\theta\  = \frac{1}{2} - \frac{1}{2}\ \cos\ 2\theta$ and
    $cos^{2}\theta\  = \frac{1}{2} + \frac{1}{2}\cos\ 2\theta\$to
    evaluate:

+----------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $\int_{0}^{\pi}{sin^{2}x}\ dx$                                                           | b.  $\int_{0}^{\frac{\pi}{4}}{cos^{2}x}\ dx$                                                                                                   |
|                                                                                              |                                                                                                                                                |
| $$\left\lbrack \frac{1}{2}x\  - \frac{1}{4}sin\ 2x \right\rbrack_{0}^{\pi} = \frac{\pi}{2}$$ | $$\ \left\lbrack \frac{1}{2}x\  + \frac{1}{4}sin\ 2x \right\rbrack_{0}^{\frac{\pi}{4}} = \frac{\pi}{8} + \frac{1}{4} = \frac{\pi\  + \ 2}{8}$$ |
+==============================================================================================+================================================================================================================================================+

Development

4.  Use the products-to-sums formulae to find:

+-------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $\int_{}^{}\sin 3x\ \cos\ 2x\ \ dx$                                                                                                   | b.  $\int_{}^{}\cos 3x\ \sin\ x\ \ dx$                                                                                                                           |
|                                                                                                                                           |                                                                                                                                                                  |
| $$sin\ 3x\ cos\ 2x\  = \frac{1}{2}(sin\ 5x\  + \ sin\ x)$$                                                                                | $$cos\ 3x\ sin\ x\  = \frac{1}{2}(sin\ 4x\  - \ sin\ 2x)\ $$                                                                                                     |
|                                                                                                                                           |                                                                                                                                                                  |
| $$\int_{}^{}\sin 3x\cos{2x}\ dx\  = \ \int_{}^{}{\frac{1}{2}(sin\ 5x\  + \ sin\ x)}\ dx\ $$                                               | $$\int_{}^{}\cos 3x\sin x\ dx\  = \ \int_{}^{}{\frac{1}{2}(sin\ 4x\  - \ sin\ 2x)}dx\ $$                                                                         |
|                                                                                                                                           |                                                                                                                                                                  |
| $= \  - \frac{1}{10}cos\ 5x\  - \frac{1}{2}cos\ x\  + \ C$                                                                                | $$= \  - \frac{1}{8}cos\ 4x\  + \frac{1}{4}cos\ 2x\  + \ C$$                                                                                                     |
+===========================================================================================================================================+==================================================================================================================================================================+
| c.  $\int_{0}^{\frac{\pi}{4}}2\cos\ 2x\ \cos\ x\ \ dx$                                                                                    | d.  $\int_{0}^{\frac{\pi}{3}}\sin 5x\ \sin\ 2x\ \ dx$                                                                                                            |
|                                                                                                                                           |                                                                                                                                                                  |
| $$2\ cos\ 2x\ cos\ x\  = \ cos\ 3x\  + \ cos\ x$$                                                                                         | $$sin\ 5x\ sin\ 2x\  = \frac{1}{2}(cos\ 3x\  - \ cos\ 7x)$$                                                                                                      |
|                                                                                                                                           |                                                                                                                                                                  |
| $$\int_{0}^{\frac{\pi}{4}}(cos\ 3x\  + \ cos\ x)dx\  = \ \left\lbrack \frac{1}{3}sin\ 3x\  + \ sin\ x \right\rbrack_{0}^{\frac{\pi}{4}}$$ | $$\int_{0}^{\frac{\pi}{3}}\frac{1}{2(cos\ 3x\  - \ cos\ 7x)}dx\  = \ \left\lbrack \frac{1}{6}sin\ 3x\  - \frac{1}{14}sin\ 7x \right\rbrack_{0}^{\frac{\pi}{3}}$$ |
|                                                                                                                                           |                                                                                                                                                                  |
| $$= \frac{1}{3\left( - \frac{\sqrt{2}}{2} \right)} + \frac{\sqrt{2}}{2}$$                                                                 | $$= \frac{1}{6(0)} - \frac{1}{14}\sin\left( \frac{7\pi}{3} \right)$$                                                                                             |
|                                                                                                                                           |                                                                                                                                                                  |
| $$= \ \left( - \frac{\sqrt{2}}{6} + \frac{\sqrt{2}}{2} \right) = \frac{2\sqrt{2}}{3}$$                                                    | $$= \  - \frac{\sqrt{3}}{28}$$                                                                                                                                   |
+-------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+

5.  a.  Sketch the graph of $y\  = \ \cos\ 2x$, for
        $0\  \leq \ x\  \leq \ 2\pi$.

![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image12.png){width="4.015631014873141in"
height="1.574802055993001in"}![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image13.png){width="4.015631014873141in"
height="1.5748031496062993in"}

b.  ![](media/Further Calculus Skills 1_Further differentiation and Integration/media/image14.png){width="3.9895833333333335in"
    height="1.5743055555555556in"}Using transformations, sketch on the
    same axis below,

$y = \frac{1}{2}\left( 1 + \cos\ 2x \right)\$and
$y = \frac{1}{2}\left( 1\  - \ \cos\ 2x \right)$.

c.  Deduce graphically that $\cos ²x\  + \ sin²x\  = \ 1.$

$y\  = \frac{1}{2}(1\  + \ cos\ 2x)\  = \ cos²x\$ and
$y\  = \frac{1}{2}(1\  - \ cos\ 2x)\  = \ sin²x$.

The graphs are reflections of each other in $y\  = \frac{1}{2}$ and
their sum equals 1 at every $x$.

∴ $\cos ²x\  + \ sin²x\  = \ 1.$

6.  Use the reverse chain rule to find:

+-----------------------------------------+--------------------------------------------------------+
| a.  $\int_{}^{}{sin^{3}x}\cos\ x\ \ dx$ | b.  $\int_{}^{}{sin^{6}x}\cos\ x\ \ dx$                |
|                                         |                                                        |
| $$\frac{1}{4}\sin^{4}x\  + \ C$$        | $$\frac{1}{7}\sin^{7}x\  + \ C$$                       |
+=========================================+========================================================+
| c.  $\int_{}^{}{cos^{5}x}\sin\ x\ \ dx$ | d.  $\int_{}^{}{cos^{8}x}\sin\ x\ \ dx$                |
|                                         |                                                        |
| $$- \frac{1}{6}\cos^{6}x\  + \ C$$      | $$- \frac{1}{9}\cos^{9}x\  + \ C$$                     |
+-----------------------------------------+--------------------------------------------------------+
| e.  $\int_{}^{}e^{x}\sin\ e^{x}\ \ dx$  | f.  $\int_{}^{}e^{x}\cos\ \left( 5e^{x} \right)\ \ dx$ |
|                                         |                                                        |
| $$- cos\ eˣ\  + \ C$$                   | $$\frac{1}{5}sin\ 5eˣ\  + \ C$$                        |
+-----------------------------------------+--------------------------------------------------------+
| g.  $\int_{}^{}\tan x\ \ dx$            | h.  $\int_{}^{}\cot 7x\ \ dx$                          |
|                                         |                                                        |
| $$- \log_{e}|cos\ x| + \ C$$            | $$\frac{1}{7}\log_{e}|sin\ 7x| + \ C$$                 |
+-----------------------------------------+--------------------------------------------------------+

7.  a.  Find the range of the function $y\  = \ \cos\ x\ \sin\ x$.

$$y\  = \ \cos\ x\ \sin\ x\  = \frac{1}{2}\sin\ 2x,\ so\  - \frac{1}{2} \leq \ y\  \leq \frac{1}{2}$$

> Integrate $y\  = \ \cos\ x\ \sin\ x$ in three ways:

b.  using the $\sin\ 2x$ formula

c.  using the reverse chain rule in two different ways

d.  Reconcile the three results.

$$b)\ \int_{}^{}\frac{1}{2}\sin\ 2x\ \ dx\  = \  - \frac{1}{4}\cos\ 2x\  + \ C$$

$$c)\ Using\ u\  = \ \sin\ x:\ \int_{}^{}\cos x\ \sin\ x\ \ dx\  = \ \int_{}^{}u\ du\  = \frac{1}{2}u^{2} + \ D\  = \frac{1}{2}sin^{2}x\  + \ D$$

$$Using\ u\  = \ \cos\ x:\ \int_{}^{}\cos x\ \sin\ x\ \ dx\  = \  - \int_{}^{}u\ du\  = \  - \frac{1}{2}u^{2} + \ E\  = \  - \frac{1}{2}cos^{2}x\  + \ E$$

d\) The three constants C, D, E differ.\
Using $\cos{2x} = \ 1\  - \ 2\ \sin^{2}x,$ we will show the first two
results are equivalent:

$$- \frac{1}{4}\ \cos\ 2x\  = \frac{1}{2}\ \sin^{2}x\  - \frac{1}{4}$$

Using $\cos{2x} = \ 2\ \cos^{2}x\  - \ 1$, we sill show the first and
third results are equivalent:

$$\  - \frac{1}{4}\ \cos\ 2x\  = \  - \frac{1}{2}\ cos^{2}x\  + \frac{1}{4}$$

So, all three are equivalent.

Mastery

8.  a.  By writing $\sin ⁴x$ as $(\sin ²x)²$, show that
        $sin^{4}x\  = \frac{3}{8} - \frac{1}{2}\ \cos\ 2x\  + \frac{1}{8}\cos\ 4x$.

    b.  Find a similar result for $\cos ⁴x$.

$$a)\ sin⁴x\  = \ (sin²x)²\  = \ \left( \frac{1}{2} - \frac{1}{2}\cos\ 2x \right)^{2}$$

$$= \frac{1}{4} - \frac{1}{2}\cos\ 2x\  + \frac{1}{4}cos^{2}2x$$

$$= \frac{1}{4} - \frac{1}{2}\cos\ 2x\  + \frac{1}{4}\left( \frac{1}{2} + \frac{1}{2}\cos\ 4x \right)\ $$

$$= \frac{3}{8} - \frac{1}{2}\cos\ 2x\  + \frac{1}{8}\cos\ 4x$$

$$b)\ cos⁴x\  = \ (\cos ²x)²\  = \ \left( \frac{1}{2} + \frac{1}{2}\cos\ 2x \right)^{2}$$

$$= \frac{1}{4} + \frac{1}{2}\cos\ 2x\  + \frac{1}{4}cos^{2}2x$$

$$= \frac{3}{8} + \frac{1}{2}\cos\ 2x\  + \frac{1}{8}\cos\ 4x$$

9.  Find, using the Pythagorean identity:

$$\ \ \ \ \ \ \ \ \ \ \int_{0}^{\frac{\pi}{3}}{sin^{3}x}\ dx$$

$$\sin ³x\  = \ \sin\ x\left( 1\  - \ cos^{2}x \right)$$

$$\int_{0}^{\frac{\pi}{3}}{sin^{3}x}\ dx\  = \ \int_{0}^{\frac{\pi}{3}}\sin x\left( 1\  - \ cos^{2}x \right)\ dx$$

$$u\  = \cos x,\ du\  = \  - \sin xdx;\ $$

$$limits:\ x\  = \ 0,\ u\  = \ 1,$$

$$\ x\  = \frac{\pi}{3},\ u\  = \frac{1}{2}$$

$$= \  - \int_{1}^{\frac{1}{2}}\left( 1\  - \ u^{2} \right)du\  = \ \int_{\frac{1}{2}}^{1}\left( 1\  - \ u^{2} \right)du\  = \ \left\lbrack u\  - \frac{u^{3}}{3} \right\rbrack_{\frac{1}{2}}^{1}$$

$$= \ \left( 1\  - \frac{1}{3} \right) - \ \left( \frac{1}{2} - \frac{1}{24} \right) = \frac{5}{24}$$

10. Evaluate using the standard forms
    $\int_{}^{}{sec^{2}x}\ dx\  = \ \tan\ x$ and
    $\int_{}^{}{cosec^{2}x}\ dx\  = \  - \cot\ x$:

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $\int_{}^{}{tan^{2}2x}\ dx$                                                                                                                                                                                     | b.  $\int_{}^{}{cot^{2}\left( \frac{x}{2} \right)\ }\ dx$                                                                                                                                                                                  |
|                                                                                                                                                                                                                     |                                                                                                                                                                                                                                            |
| $$\int_{}^{}{\tan^{2}2x}\ dx\  = \ \int_{}^{}\left( \sec^{2}2x\  - \ 1 \right)dx\ $$                                                                                                                                | $$\int_{}^{}{\cot^{2}\left( \frac{x}{2} \right)}\ dx\  = \ \int_{}^{}\left( {cosec}^{2}\left( \frac{x}{2} \right)\  - \ 1 \right)dx\ $$                                                                                                    |
|                                                                                                                                                                                                                     |                                                                                                                                                                                                                                            |
| $$= \frac{1}{2}tan\ 2x\  - \ x\  + \ C$$                                                                                                                                                                            | $$= \  - 2\ cot\left( \frac{x}{2} \right)\  - \ x\  + \ C$$                                                                                                                                                                                |
+=====================================================================================================================================================================================================================+============================================================================================================================================================================================================================================+
| c.  $\int_{\frac{\pi}{12}}^{\frac{\pi}{9}}3tan^{2}3x\ \ dx$                                                                                                                                                         | d.  $\int_{\frac{\pi}{24}}^{\frac{\pi}{8}}{cot^{2}4x}\ dx$                                                                                                                                                                                 |
|                                                                                                                                                                                                                     |                                                                                                                                                                                                                                            |
| $$\int_{\frac{\pi}{12}}^{\frac{\pi}{9}}3\tan^{2}3x\ \ dx\  = \ \int_{\frac{\pi}{12}}^{\frac{\pi}{9}}{3\left( \sec^{2}3x\  - \ 1 \right)}dx\  = \ \lbrack tan\ 3x\  - \ 3x\rbrack_{\frac{\pi}{12}}^{\frac{\pi}{9}}$$ | $$\int_{\frac{\pi}{24}}^{\frac{\pi}{8}}{\cot^{2}4x}\ dx\  = \ \int_{\frac{\pi}{24}}^{\frac{\pi}{8}}\left( {cosec}^{2}4x\  - \ 1 \right)dx\  = \ \left\lbrack - \frac{1}{4}cot\ 4x\  - \ x \right\rbrack_{\frac{\pi}{24}}^{\frac{\pi}{8}}$$ |
|                                                                                                                                                                                                                     |                                                                                                                                                                                                                                            |
| $$= \ \left( \tan\left( \frac{\pi}{3} \right) - \frac{\pi}{3} \right) - \ \left( \tan\left( \frac{\pi}{4} \right) - \frac{\pi}{4} \right)$$                                                                         | $$= \ \left( - \frac{1}{4}\cot\left( \frac{\pi}{2} \right) - \frac{\pi}{8} \right) - \ \left( - \frac{1}{4}\cot\left( \frac{\pi}{6} \right) - \frac{\pi}{24} \right)$$                                                                     |
|                                                                                                                                                                                                                     |                                                                                                                                                                                                                                            |
| $$= \ \left( \sqrt{3} - \frac{\pi}{3} \right) - \ \left( 1\  - \frac{\pi}{4} \right)$$                                                                                                                              | $$= \ \left( 0\  - \frac{\pi}{8} \right) - \ \left( - \frac{\sqrt{3}}{4} - \frac{\pi}{24} \right)$$                                                                                                                                        |
|                                                                                                                                                                                                                     |                                                                                                                                                                                                                                            |
| $$= \ \sqrt{3} - \ 1\  - \frac{\pi}{12}$$                                                                                                                                                                           | $$= \frac{\sqrt{3}}{4} - \frac{\pi}{12}$$                                                                                                                                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

11. Integrate using the reverse chain rule, or otherwise:

    a.  $\tan\ x\ \sec ²x$

    b.  $\frac{sin^{2}x}{1\  + \ \cos\ x}$

    c.  $\frac{1\  + \ \cos^{3}x}{\cos^{2}x}$

a\) $u\  = \ \tan\ x,\ du\  = \ \sec ²x\ dx$

$$\int_{}^{}\tan x\ sec^{2}x\ \ dx\  = \ \int_{}^{}u\ du\  = \frac{1}{2}u^{2} + \ C\  = \frac{1}{2}tan^{2}x\  + \ C$$

$$b)\frac{sin^{2}x}{1\  + \ \cos\ x} = \frac{1\  - \ cos^{2}x}{1\  + \ \cos\ x} = \frac{\left( 1\  - \ \cos\ x \right)\left( 1\  + \ \cos\ x \right)}{1\  + \ \cos\ x} = \ 1\  - \ \cos\ x$$

$$\int_{}^{}\left( 1\  - \ \cos\ x \right)dx\  = \ x\  - \ \sin\ x\  + \ C$$

$$c)\frac{1\  + \ cos^{3}x}{cos^{2}x}\  = \ \sec ²x\  + \ \cos\ x$$

$$\int_{}^{}\left( sec^{2}x\  + \ \cos\ x \right)dx\  = \ \tan\ x\  + \ \sin\ x\  + \ C$$
