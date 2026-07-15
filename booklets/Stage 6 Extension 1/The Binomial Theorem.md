  -------------------------------------------------------------------
  Mathematics Extension 1 Year 11
  -------------------------------------------------------------------
  **The Binomial Theorem**

  -------------------------------------------------------------------

+-------------------------+-----------------------------------+-------------------------+
| **Book 1**              | The Binomial Theorem              | Version: 251019         |
|                         |                                   |                         |
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

**ME1-11-05** uses the binomial theorem to solve problems and prove
identities

- Recognise that a binomial is an expression with two terms, and that a
  binomial expansion is an expansion of a power of a binomial

- Examine the symmetry formed by the coefficients of decreasing powers
  of $x$ in the expansion of $(x + y)^{n}$ for $n = 0,1,2,3,4,5$ and
  arrange the coefficients into Pascal's triangle

- Recognise the equivalence between the coefficient of $x^{n - r}y^{r}$
  in the expansion of $(x + y)^{n}$ and$\ ^{n}C_{r}$, when $n$ is a
  positive integer

- Use patterns and symmetry in Pascal's triangle to confirm the
  identities$\ ^{n}C_{r} = \ ^{n - 1}C_{r - 1} + \ ^{n - 1}C_{r}$ for
  $1 \leq r \leq n - 1$ and $\ ^{n}C_{r} = \ ^{n}C_{n - r}$ for
  $0 \leq r \leq n$

- Derive the binomial theorem:
  $(x + y)^{n} = \ ^{n}C_{0}x^{n} + \ ^{n}C_{1}x^{n - 1}y + \ ^{n}C_{2}x^{n - 2}y^{2} + \ldots + \ ^{n}C_{n - 1}xy^{n - 1} +^{n}C_{n}y^{n}$,
  when $n$ is a positive integer

- Apply the binomial theorem to expand and simplify expressions of the
  form $(x + y)^{n}$

- Use the binomial theorem to determine the coefficient of a term with a
  specific power or the constant term in a binomial expansion

- Use the
  identities$\ ^{n}C_{0} = 1$,$\ ^{n}C_{n} = 1$,$\ ^{n}C_{r} = \ ^{n - 1}C_{r - 1} + \ ^{n - 1}C_{r}$
  for $1 \leq r \leq n - 1$ and$\ ^{n}C_{r} = \ ^{n}C_{n - r}$ for
  $0 \leq r \leq n$ to simplify expressions involving the binomial
  coefficients

- Prove identities involving binomial coefficients in binomial
  expansions by substituting values, comparing coefficients or applying
  a combinatorial argument to a specified context

- Apply given or proven identities involving binomial coefficients to
  prove further identities, without the use of calculus

# Binomial Expansion, Pascal's Triangle, Combinations

+-------------------------------------------------------------------+
| - **Investigation** Binomial expansion terms.                     |
+===================================================================+
| A **binomial** is an expression with **two terms**. The simplest  |
| of which is $(x + y)$.                                            |
|                                                                   |
| Expand these expressions:                                         |
|                                                                   |
| $$(x + y)^{0} =$$                                                 |
|                                                                   |
| $$(x + y)^{1} =$$                                                 |
|                                                                   |
| $$(x + y)^{2} =$$                                                 |
|                                                                   |
| $$(x + y)^{3} =$$                                                 |
|                                                                   |
| $$(x + y)^{4} =$$                                                 |
|                                                                   |
| $$(x + y)^{5} =$$                                                 |
|                                                                   |
| For a power of 0, there is 1 term.                                |
|                                                                   |
| For a power of 1, there are ......... terms.                      |
|                                                                   |
| For a power of 2, there are ......... terms.                      |
|                                                                   |
| For a power of $n,$ there are ......... terms.                    |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  For $(x + y)^{n}$, the fully expanded and simplified result   |
|     has ............... terms.                                    |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------+
| - **Investigation** Binomial expansion powers.                              |
+=============================================================================+
| Consider the expansion of                                                   |
| $(x + y)^{5} = x⁵\  + \ 5x⁴y\  + \ 10x³y²\  + \ 10x²y³\  + \ 5xy⁴\  + \ y⁵$ |
|                                                                             |
| If we arrange the terms in this way, and ignore the coefficients,           |
|                                                                             |
| The 0^th^ term is: $x^{5}$                                                  |
|                                                                             |
| The 1^st^ term is: $x^{4}y$                                                 |
|                                                                             |
| The 2^nd^ term is: .........                                                |
|                                                                             |
| The 3^rd^ term is: .........                                                |
|                                                                             |
| The 4^th^ term is .........                                                 |
|                                                                             |
| The 5^th^ term is: .........                                                |
|                                                                             |
| The powers of the terms always add up to ............                       |
|                                                                             |
| For $(x + y)^{n}$,                                                          |
|                                                                             |
| 0^th^ term: $x^{n}$                                                         |
|                                                                             |
| 1^st^ term: $x^{n - 1}y$                                                    |
|                                                                             |
| 2^nd^ term: $x^{n - 2}y^{2}$                                                |
|                                                                             |
| $k$^th^ term: .........                                                     |
|                                                                             |
| $n$^th^ term: .........                                                     |
|                                                                             |
| The powers of the terms always add up to ............                       |
+-----------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  For $(x + y)^{n}$, each subsequent term ............... the   |
|     power of $x$ by 1 and ............ the power of $y$ by 1,     |
|     while the sum of the powers remains constant at ......        |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Binomial expansion and Pascal's Triangle                                                                                                                  |
+===============================================================================================================================================================================+
| Pascal\'s triangle is a triangular pattern of numbers where each number equals the sum of the two numbers directly above it. For Pascal's triangle, **the first row is        |
| numbered 0**.                                                                                                                                                                 |
|                                                                                                                                                                               |
| Continue the pattern to row 5.                                                                                                                                                |
|                                                                                                                                                                               |
| +------+----------------------+                                                                                                                                               |
| | Row  | 1                    |                                                                                                                                               |
| | 0    |                      |                                                                                                                                               |
| |      | 1 1                  |                                                                                                                                               |
| | Row  |                      |                                                                                                                                               |
| | 1    | 1 2 1                |                                                                                                                                               |
| |      |                      |                                                                                                                                               |
| | Row  | 1 3 3 1              |                                                                                                                                               |
| | 2    |                      |                                                                                                                                               |
| |      |                      |                                                                                                                                               |
| | Row  |                      |                                                                                                                                               |
| | 3    |                      |                                                                                                                                               |
| |      |                      |                                                                                                                                               |
| | Row  |                      |                                                                                                                                               |
| | 4    |                      |                                                                                                                                               |
| |      |                      |                                                                                                                                               |
| | Row  |                      |                                                                                                                                               |
| | 5    |                      |                                                                                                                                               |
| +======+======================+                                                                                                                                               |
|                                                                                                                                                                               |
| What do you notice about the coefficients of binomial expansions on the previous page and the numbers in each row?                                                            |
|                                                                                                                                                                               |
| ...........................................................................................................................                                                   |
|                                                                                                                                                                               |
| ...........................................................................................................................                                                   |
|                                                                                                                                                                               |
| **The connection between binomial expansion and Pascal\'s triangle:**                                                                                                         |
|                                                                                                                                                                               |
| Here is the expansion of $(x + y)^{4}:$                                                                                                                                       |
|                                                                                                                                                                               |
| $$(x + y)^{4} = (x + y)\left( x^{3} + 3x^{2}y + 3xy^{2} + y^{3} \right)$$                                                                                                     |
|                                                                                                                                                                               |
| $= x^{4} + 3x^{3}y + 3x^{2}y^{2} + xy^{3} + x^{3}y + 3x^{2}y^{2} + 3xy^{3} + y^{4}$                                                                                           |
|                                                                                                                                                                               |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = 1x^{4} + 4x^{3}y + 6x^{2}y^{2} + 4xy^{3} + 1y^{4}$$                                                                                  |
|                                                                                                                                                                               |
| Consider the $6x^{2}y^{2}$ term, here's where it comes from:                                                                                                                  |
|                                                                                                                                                                               |
| $$(x + y)^{4} = (x + y)\left( x^{3} + \mathbf{3}\mathbf{x}^{\mathbf{2}}\mathbf{y + 3}\mathbf{x}\mathbf{y}^{\mathbf{2}} + y^{3} \right)$$                                      |
|                                                                                                                                                                               |
| $= x^{4} + 3x^{3}y + \mathbf{3}\mathbf{x}^{\mathbf{2}}\mathbf{y}^{\mathbf{2}} + xy^{3} + x^{3}y + \mathbf{3}\mathbf{x}^{\mathbf{2}}\mathbf{y}^{\mathbf{2}} + 3xy^{3} + y^{4}$ |
|                                                                                                                                                                               |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = 1x^{4} + 4x^{3}y + \mathbf{6}\mathbf{x}^{\mathbf{2}}\mathbf{y}^{\mathbf{2}} + 4xy^{3} + 1y^{4}$$                                     |
|                                                                                                                                                                               |
| This happens for every term.                                                                                                                                                  |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  For $(x + y)^{n}$, the ........................ are the       |
|     numbers in the corresponding row of Pascal's triangle.        |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Binomial expansion and Combinations                                                                     |
+=============================================================================================================================+
| Consider $(x + y)^{4} = 1x^{4} + 4x^{3}y + 6x^{2}y^{2} + 4xy^{3} + 1y^{4}$                                                  |
|                                                                                                                             |
| Using a calculator, evaluate $\ ^{4}C_{0}$, $\ ^{4}C_{1}$, $\ ^{4}C_{2}$, $\ ^{4}C_{3}$, $\ ^{4}C_{4}$                      |
|                                                                                                                             |
| What do you notice?                                                                                                         |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| **The connection between binomial expansion and Pascal\'s triangle:**                                                       |
|                                                                                                                             |
| Think of $(x + y)^{4}$ as multiplying 4 sets of brackets: $(x + y)(x + y)(x + y)(x + y)$                                    |
|                                                                                                                             |
| Each term in the expansion comes from choosing $x$\'s or $y$\'s to multiply from these brackets.                            |
|                                                                                                                             |
| $x⁴$ term: Choose 4 $x$\'s from the 4 brackets: ......... ways                                                              |
|                                                                                                                             |
| $x³y$ term: Choose 3 $x$\'s from the 4 brackets (this automatically gives you 1 $y$): ......... ways                        |
|                                                                                                                             |
| $x²y²$ term: Choose 2 $x$\'s from the 4 brackets: ......... ways                                                            |
|                                                                                                                             |
| $xy³$ term: Choose 1 $x$ from the 4 brackets: ......... ways                                                                |
|                                                                                                                             |
| $y⁴$ term: Choose 0 $x$ from the 4 brackets: ......... ways                                                                 |
+-----------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  For $(x + y)^{n}$, the ........................ of each term  |
|     are the ...........................\                          |
|     $\ ^{n}C_{0}$, $\ ^{n}C_{1}$, $\ ^{n}C_{2}$, ...$\ ^{n}C_{n}$ |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------+
| - **Proof** Pascal's Triangle and Combinations Identities.                                            |
+=======================================================================================================+
| For each of these combinations identities, describe how it is evident from the triangle.              |
|                                                                                                       |
| $n$ is the row, $r$ is how much to go across a row. Remember that we start counting from 0.           |
|                                                                                                       |
| +-------------------------------------------+-------------------------------------------------------+ |
| | 1.  $\ ^{n}C_{n}\  = \ \ ^{n}C₀\  = \ 1$  | 2\. $\ ^{n}C₁\  = \ \ ^{n}C_{n - 1}\  = \ n$          | |
| |                                           |                                                       | |
| | +------+-----------------+                | +------+-----------------+                            | |
| | | Row  | 1               |                | | Row  | 1               |                            | |
| | | 0    |                 |                | | 0    |                 |                            | |
| | |      | 1 1             |                | |      | 1 1             |                            | |
| | | Row  |                 |                | | Row  |                 |                            | |
| | | 1    | 1 2 1           |                | | 1    | 1 2 1           |                            | |
| | |      |                 |                | |      |                 |                            | |
| | | Row  | 1 3 3 1         |                | | Row  | 1 3 3 1         |                            | |
| | | 2    |                 |                | | 2    |                 |                            | |
| | |      | 1 4 6 4 1       |                | |      | 1 4 6 4 1       |                            | |
| | | Row  |                 |                | | Row  |                 |                            | |
| | | 3    | 1 5 10 10 5 1   |                | | 3    | 1 5 10 10 5 1   |                            | |
| | |      |                 |                | |      |                 |                            | |
| | | Row  |                 |                | | Row  |                 |                            | |
| | | 4    |                 |                | | 4    |                 |                            | |
| | |      |                 |                | |      |                 |                            | |
| | | Row  |                 |                | | Row  |                 |                            | |
| | | 5    |                 |                | | 5    |                 |                            | |
| | +======+=================+                | +======+=================+                            | |
| +===========================================+=======================================================+ |
| | 3\. $\ ^{n}C_{r}\  = \ ^{n}C_{n - r}$     | 4\.                                                   | |
| | (symmetry property)                       | $\ ^{n}C_{r} = \ ^{n - 1}C_{r - 1} + \ ^{n - 1}C_{r}$ | |
| |                                           | (Pascal's identity)                                   | |
| | +------+-----------------+                |                                                       | |
| | | Row  | 1               |                | +------+-----------------+                            | |
| | | 0    |                 |                | | Row  | 1               |                            | |
| | |      | 1 1             |                | | 0    |                 |                            | |
| | | Row  |                 |                | |      | 1 1             |                            | |
| | | 1    | 1 2 1           |                | | Row  |                 |                            | |
| | |      |                 |                | | 1    | 1 2 1           |                            | |
| | | Row  | 1 3 3 1         |                | |      |                 |                            | |
| | | 2    |                 |                | | Row  | 1 3 3 1         |                            | |
| | |      | 1 4 6 4 1       |                | | 2    |                 |                            | |
| | | Row  |                 |                | |      | 1 4 6 4 1       |                            | |
| | | 3    | 1 5 10 10 5 1   |                | | Row  |                 |                            | |
| | |      |                 |                | | 3    | 1 5 10 10 5 1   |                            | |
| | | Row  |                 |                | |      |                 |                            | |
| | | 4    |                 |                | | Row  |                 |                            | |
| | |      |                 |                | | 4    |                 |                            | |
| | | Row  |                 |                | |      |                 |                            | |
| | | 5    |                 |                | | Row  |                 |                            | |
| | +======+=================+                | | 5    |                 |                            | |
| |                                           | +======+=================+                            | |
| +-------------------------------------------+-------------------------------------------------------+ |
| | 5\. $\ ^{n}C_{0} + \ \ ^{n}C_{1} + \ \ ^{n}C_{2} + \ ...\  + \ \ ^{n}C_{n} = \ 2^{n}$             | |
| |                                                                                                   | |
| | +------+-----------------+                                                                        | |
| | | Row  | 1               |                                                                        | |
| | | 0    |                 |                                                                        | |
| | |      | 1 1             |                                                                        | |
| | | Row  |                 |                                                                        | |
| | | 1    | 1 2 1           |                                                                        | |
| | |      |                 |                                                                        | |
| | | Row  | 1 3 3 1         |                                                                        | |
| | | 2    |                 |                                                                        | |
| | |      | 1 4 6 4 1       |                                                                        | |
| | | Row  |                 |                                                                        | |
| | | 3    | 1 5 10 10 5 1   |                                                                        | |
| | |      |                 |                                                                        | |
| | | Row  |                 |                                                                        | |
| | | 4    |                 |                                                                        | |
| | |      |                 |                                                                        | |
| | | Row  |                 |                                                                        | |
| | | 5    |                 |                                                                        | |
| | +======+=================+                                                                        | |
| +---------------------------------------------------------------------------------------------------+ |
+-------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| For $(x + y)^{n}$,                                                |
|                                                                   |
| **Number of terms:**                                              |
|                                                                   |
| The expansion has ......... terms. We label them as term $0$,     |
| term $1$, term $2$, up to term $n$.                               |
|                                                                   |
| **Powers pattern:**                                               |
|                                                                   |
| Each term decreases the power of $x$ by 1 and increases the power |
| of $y$ by 1.\                                                     |
| The powers always add to ......                                   |
|                                                                   |
| **Coefficients:**                                                 |
|                                                                   |
| The coefficient of each term follows the pattern: ......, ......, |
| ......, ......, $\cdot \cdot \cdot$ ......                        |
|                                                                   |
| These match the numbers in row $n$ of Pascal\'s triangle.         |
|                                                                   |
| Using Row 5 of Pascal's triangle, derive the expansion of         |
| $(x + y)^{6}$ without expanding.                                  |
|                                                                   |
| 1 5 10 10 5 1                                                     |
|                                                                   |
| $$(x + y)^{6} =$$                                                 |
|                                                                   |
| Write the expression for $(x + y)^{n}$ using what you have        |
| learned this lesson.                                              |
|                                                                   |
| This is called the **Binomial Theorem.**                          |
|                                                                   |
| $(x + y)^{n} =$                                                   |
+-------------------------------------------------------------------+

# Expanding Expressions using Binomial Theorem

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Binomial Theorem**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
+=======================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================+
| $$(x + y)^{n} = \ ^{n}C_{0}x^{n} + \ ^{n}C_{1}x^{n - 1}y + \ ^{n}C_{2}x^{n - 2}y^{2} + \ldots + \ ^{n}C_{n - 1}xy^{n - 1} +^{n}C_{n}y^{n}$$                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    $$\mathbf{n}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{0}}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{1}}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{2}}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{3}}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{4}}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{5}}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{6}}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{7}}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{8}}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{9}}$$   $$\mathbf{\ }^{\mathbf{n}}\mathbf{C}_{\mathbf{10}}$$  |
|   ---------------- ----------------------------------------------------- ----------------------------------------------------- ----------------------------------------------------- ----------------------------------------------------- ----------------------------------------------------- ----------------------------------------------------- ----------------------------------------------------- ----------------------------------------------------- ----------------------------------------------------- ----------------------------------------------------- ------------------------------------------------------ |
|        **0**                                 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|        **1**                                 1                                                     1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|        **2**                                 1                                                     2                                                     1                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|        **3**                                 1                                                     3                                                     3                                                     1                                                                                                                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|        **4**                                 1                                                     4                                                     6                                                     4                                                     1                                                                                                                                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|        **5**                                 1                                                     5                                                    10                                                    10                                                     5                                                     1                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|        **6**                                 1                                                     6                                                    15                                                    20                                                    15                                                     6                                                     1                                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|        **7**                                 1                                                     7                                                    21                                                    35                                                    35                                                    21                                                     7                                                     1                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|        **8**                                 1                                                     8                                                    28                                                    56                                                    70                                                    56                                                    28                                                     8                                                     1                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|        **9**                                 1                                                     9                                                    36                                                    84                                                    126                                                   126                                                   84                                                    36                                                     9                                                     1                                                                                  |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|        **10**                                1                                                    10                                                    45                                                    120                                                   210                                                   252                                                   210                                                   120                                                   45                                                    10                                                     1                            |
|   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Expand expressions in the form $(x + y)^{n}$ using the binomial theorem.                                                     |
+============================================================================================================================================+
| Expand $(2 + 3x)^{4}$                                                                                                                      |
|                                                                                                                                            |
| $$(2 + 3x)^{4} = \ ^{4}C_{0}(2)^{4} + \ ^{4}C_{1}(2)^{3}(3x) + \ ^{4}C_{2}(2)^{2}(3x)^{2} + \ ^{4}C_{3}(2)(3x)^{3} + \ ^{4}C_{4}(3x)^{4}$$ |
|                                                                                                                                            |
| $= 16 + 96x + 216x^{2} + 216x^{3} + 81x^{4}$                                                                                               |
+--------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                                                                        |
+============================================================================+==========================================================================+
| Expand $(1 + 2a)^{5}$                                                      | Expand $(1 - x)^{6}$                                                     |
|                                                                            |                                                                          |
| $$1\  + \ 10a\  + \ 40a²\  + \ 80a³\  + \ 80a⁴\  + \ 32a⁵$$                | $$1\  - \ 6x\  + \ 15x²\  - \ 20x³\  + \ 15x⁴\  - \ 6x⁵\  + \ x^{6}$$    |
+----------------------------------------------------------------------------+--------------------------------------------------------------------------+
| Expand $\left( 5x + \frac{a}{2} \right)^{3}$                               | Expand $\left( 2x - \frac{3}{x} \right)^{4}$                             |
|                                                                            |                                                                          |
| $$125x^{3} + \frac{75x^{2}a}{2} + \frac{15xa^{2}}{4}\  + \frac{a^{3}}{8}$$ | Hint: write as $3x^{- 1}$                                                |
|                                                                            |                                                                          |
|                                                                            | $$16x^{4} - \ 96x^{2} + \ 216\  - \frac{216}{x^{2}} + \frac{81}{x^{4}}$$ |
+----------------------------------------------------------------------------+--------------------------------------------------------------------------+

Foundation

1.  Use Pascal\'s triangle to expand:

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| a.  $(1\  + \ x)⁶$                                                                                                                                                        | b.  $(1\  - \ x)⁶$                                                                                                      |
|                                                                                                                                                                           |                                                                                                                         |
| $$1\  + \ 6x\  + \ 15x²\  + \ 20x³\  + \ 15x⁴\  + \ 6x⁵\  + \ x⁶\ $$                                                                                                      | $$1\  - \ 6x\  + \ 15x²\  - \ 20x³\  + \ 15x⁴\  - \ 6x⁵\  + \ x⁶\ $$                                                    |
+===========================================================================================================================================================================+=========================================================================================================================+
| c.  $(1\  + \ x)⁹$                                                                                                                                                        | d.  $(1\  + \ 2y)⁴$                                                                                                     |
|                                                                                                                                                                           |                                                                                                                         |
| $$1 + 9x + 36x² + 84x³ + 126x⁴ + 126x⁵ + 84x⁶ + 36x⁷ + 9x⁸ + x^{9}$$                                                                                                      | $$1\  + \ 4(2y)\  + \ 6(4y²)\  + \ 4(8y³)\  + \ 16y⁴$$                                                                  |
|                                                                                                                                                                           |                                                                                                                         |
|                                                                                                                                                                           | $$= \ 1\  + \ 8y\  + \ 24y²\  + \ 32y³\  + \ 16y⁴$$                                                                     |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| e.  $\left( 1\  - \frac{1}{x} \right)^{8}$                                                                                                                                | f.  $(1\  - \ 3z)³$                                                                                                     |
|                                                                                                                                                                           |                                                                                                                         |
| $$= 1 - \frac{8}{x} + \frac{28}{x^{2}} - \frac{56}{x^{3}} + \frac{70}{x^{4}} - \frac{56}{x^{5}} + \frac{28}{x^{6}} - \frac{8}{x^{7}} + \frac{1}{x^{8}}$$                  | $$1\  + \ 3( - 3z)\  + \ 3(9z²)\  + \ ( - 27z³)$$                                                                       |
|                                                                                                                                                                           |                                                                                                                         |
|                                                                                                                                                                           | $$= \ 1\  - \ 9z\  + \ 27z²\  - \ 27z^{3}$$                                                                             |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+
| g.  $\left( 1\  + \frac{2}{x} \right)^{5}$                                                                                                                                | h.  $\left( 1\  + \frac{y}{x} \right)^{5}$                                                                              |
|                                                                                                                                                                           |                                                                                                                         |
| $$1\  + \ 5\left( \frac{2}{x} \right) + \ 10\left( \frac{4}{x^{2}} \right) + \ 10\left( \frac{8}{x^{3}} \right) + \ 5\left( \frac{16}{x^{4}} \right) + \frac{32}{x^{5}}$$ | $$= \ 1\  + \frac{5y}{x} + \frac{10y^{2}}{x^{2}} + \frac{10y^{3}}{x^{3}} + \frac{5y^{4}}{x^{4}} + \frac{y^{5}}{x^{5}}$$ |
|                                                                                                                                                                           |                                                                                                                         |
| $$= \ 1\  + \frac{10}{x} + \frac{40}{x^{2}} + \frac{80}{x^{3}} + \frac{80}{x^{4}} + \frac{32}{x^{5}}$$                                                                    |                                                                                                                         |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------+

2.  Use Pascal\'s triangle to expand:

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.  $(x\  + \ y)^{4}$                                                                                                                                              | b.  $(2x\  + \ y)⁵$                                                                                                                                                                                                                 |
|                                                                                                                                                                    |                                                                                                                                                                                                                                     |
| $$x⁴\  + \ 4x³y\  + \ 6x²y²\  + \ 4xy³\  + \ y⁴\ $$                                                                                                                | $$32x⁵\  + \ 5(16x⁴)y\  + \ 10(8x³)y²\  + \ 10(4x²)y³\  + \ 5(2x)y⁴\  + \ y⁵$$                                                                                                                                                      |
|                                                                                                                                                                    |                                                                                                                                                                                                                                     |
|                                                                                                                                                                    | $$= \ 32x⁵\  + \ 80x⁴y\  + \ 80x³y²\  + \ 40x²y³\  + \ 10xy⁴\  + \ y⁵$$                                                                                                                                                             |
+====================================================================================================================================================================+=====================================================================================================================================================================================================================================+
| c.  $(3x\  + \ 2y)⁴$                                                                                                                                               | d.  $(r\  - \ s)⁶$                                                                                                                                                                                                                  |
|                                                                                                                                                                    |                                                                                                                                                                                                                                     |
| $$81x⁴\  + \ 4(27x³)(2y)\  + \ 6(9x²)(4y²)\  + \ 4(3x)(8y³)\  + \ 16y⁴$$                                                                                           | $$r⁶\  - \ 6r⁵s\  + \ 15r⁴s²\  - \ 20r³s³\  + \ 15r²s⁴\  - \ 6rs⁵\  + \ s⁶$$                                                                                                                                                        |
|                                                                                                                                                                    |                                                                                                                                                                                                                                     |
| $$= \ 81x⁴\  + \ 216x³y\  + \ 216x²y²\  + \ 96xy³\  + \ 16y^{4}$$                                                                                                  |                                                                                                                                                                                                                                     |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| e.  $\left( a\  - \frac{b}{2} \right)^{3}$                                                                                                                         | f.  $\left( x\  + \frac{1}{x} \right)^{6}$                                                                                                                                                                                          |
|                                                                                                                                                                    |                                                                                                                                                                                                                                     |
| $$a^{3} + \ 3a^{2}\left( - \frac{b}{2} \right) + \ 3a\left( \frac{b^{2}}{4} \right) + \ \left( - \frac{b^{3}}{8} \right)$$                                         | $$x^{6} + \ 6x^{5}\left( \frac{1}{x} \right) + \ 15x^{4}\left( \frac{1}{x^{2}} \right) + \ 20x^{3}\left( \frac{1}{x^{3}} \right) + \ 15x^{2}\left( \frac{1}{x^{4}} \right) + \ 6x\left( \frac{1}{x^{5}} \right) + \frac{1}{x^{6}}$$ |
|                                                                                                                                                                    |                                                                                                                                                                                                                                     |
| $$= \ a^{3} - \ \left( \frac{3}{2} \right)a^{2}b\  + \ \left( \frac{3}{4} \right)ab^{2} - \ \left( \frac{1}{8} \right)b^{3}$$                                      | $$= \ x^{6} + \ 6x^{4} + \ 15x^{2} + \ 20\  + \frac{15}{x^{2}} + \frac{6}{x^{4}} + \frac{1}{x^{6}}$$                                                                                                                                |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| g.  $(a\  - \ b)⁹$                                                                                                                                                                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                                                                                                                          |
| $$a⁹\  - \ 9a⁸b\  + \ 36a⁷b²\  - \ 84a⁶b³\  + \ 126a⁵b⁴\  - \ 126a⁴b⁵\  + \ 84a³b⁶\  - \ 36a²b⁷\  + \ 9ab⁸\  - \ b^{9}$$                                                                                                                                                                                                                                                                                 |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| h.  $\left( \frac{r}{2}\  + \frac{s}{3} \right)^{5}$                                                                                                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                                                                                                                          |
| $$\left( \frac{r^{5}}{32} \right) + 5\left( \frac{r^{4}}{16} \right)\left( \frac{s}{3} \right) + 10\left( \frac{r^{3}}{8} \right)\left( \frac{s^{2}}{9} \right) + 10\left( \frac{r^{2}}{4} \right)\left( \frac{s^{3}}{27} \right) + 5\left( \frac{r}{2} \right)\left( \frac{s^{4}}{81} \right) + \left( \frac{s^{5}}{243} \right)$$                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                                          |
| $$= \frac{r^{5}}{32} + \frac{5r^{4}s}{48} + \frac{5r^{3}s^{2}}{36} + \frac{5r^{2}s^{3}}{54} + \frac{5rs^{4}}{162} + \frac{s^{5}}{243}$$                                                                                                                                                                                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Development

3.  Use Pascal\'s triangle to expand:

    a.  $(1\  + \ x²)⁴$

$$1\  + \ 4x²\  + \ 6x⁴\  + \ 4x⁶\  + \ x⁸$$

b.  $(1\  - \ 3x²)³$

$$1\  - \ 9x²\  + \ 27x⁴\  - \ 27x⁶$$

c.  $(x²\  + \ 2y³)⁶$

$$x¹²\  + \ 6x¹⁰(2y³)\  + \ 15x⁸(4y⁶)\  + \ 20x⁶(8y⁹)\  + \ 15x⁴(16y¹²)\  + \ 6x²(32y¹⁵)\  + \ 64y¹⁸$$

$$= \ x¹²\  + \ 12x¹⁰y³\  + \ 60x⁸y⁶\  + \ 160x⁶y⁹\  + \ 240x⁴y¹²\  + \ 192x²y¹⁵\  + \ 64y¹⁸$$

d.  $\left( x\  - \frac{1}{x} \right)^{9}$

$$x^{9} + \ 9x^{8}\left( - \frac{1}{x} \right) + \ 36x^{7}\left( \frac{1}{x^{2}} \right) + \ 84x^{6}\left( - \frac{1}{x^{3}} \right) + \ 126x^{5}\left( \frac{1}{x^{4}} \right) + \ 126x^{4}\left( - \frac{1}{x^{5}} \right) + \ 84x^{3}\left( \frac{1}{x^{6}} \right) + \ 36x^{2}\left( - \frac{1}{x^{7}} \right) + \ 9x\left( \frac{1}{x^{8}} \right) + \ \left( - \frac{1}{x^{9}} \right)$$

$$= \ x^{9} - \ 9x^{7} + \ 36x^{5} - \ 84x^{3} + \ 126x\  - \frac{126}{x} + \frac{84}{x^{3}} - \frac{36}{x^{5}} + \frac{9}{x^{7}} - \frac{1}{x^{9}}$$

e.  $\left( \sqrt{x} + \ \sqrt{y} \right)^{7}$

$$x^{\frac{7}{2}} + \ 7x^{3}y^{\frac{1}{2}} + \ 21x^{\left( \frac{5}{2} \right)y} + \ 35x^{2}y^{\frac{3}{2}} + \ 35x^{\left( \frac{3}{2} \right)y^{2}} + \ 21xy^{\frac{5}{2}} + \ 7x^{\left( \frac{1}{2} \right)y^{3}} + \ y^{\frac{7}{2}}$$

$$= \ x^{3}\sqrt{x} + \ 7x^{3}\sqrt{y} + \ 21x^{2}y\sqrt{x} + \ 35x^{2}y\sqrt{y} + \ 35xy^{2}\sqrt{x} + \ 21xy^{2}\sqrt{y} + \ 7y^{3}\sqrt{x} + \ y^{3}\sqrt{y}$$

f.  $\left( \frac{2}{x} + \ 3x^{2} \right)^{5}$

$$\frac{32}{x^{5}} + \ 5\left( \frac{16}{x^{4}} \right)\left( 3x^{2} \right) + \ 10\left( \frac{8}{x^{3}} \right)\left( 9x^{4} \right) + \ 10\left( \frac{4}{x^{2}} \right)\left( 27x^{6} \right) + \ 5\left( \frac{2}{x} \right)\left( 81x^{8} \right) + \ 243x^{10}$$

$$= \frac{32}{x^{5}} + \frac{240}{x^{2}} + \ 720x\  + \ 1080x^{4} + \ 810x^{7} + \ 243x^{10}$$

4.  Without expanding, simplify:

    a.  $1\  + \ 3(x\  - \ 1)\  + \ 3(x\  - \ 1)²\  + \ (x\  - \ 1)³$

$$= \ (1\  + \ (x\  - \ 1))³\  = \ x³$$

b.  $1\  - \ 6(x\  + \ 1)\  + \ 15(x\  + \ 1)²\  - \ 20(x\  + \ 1)³\  + \ 15(x\  + \ 1)⁴\  - \ 6(x\  + \ 1)⁵\  + \ (x\  + \ 1)^{6}$

$$= \ (1\  - \ (x\  + \ 1))⁶\  = \ ( - x)⁶\  = \ x^{6}$$

Mastery

5.  Without expanding, simplify:

    a.  $y⁵\  + \ 5y⁴(x\  - \ y)\  + \ 10y³(x\  - \ y)²\  + \ 10y²(x\  - \ y)³\  + \ 5y(x\  - \ y)⁴\  + \ (x\  - \ y)^{5}$

$$= \ (y\  + \ (x\  - \ y))⁵\  = \ x^{5}$$

b.  $x³\  + \ 3x²(2y\  - \ x)\  + \ 3x(2y\  - \ x)²\  + \ (2y\  - \ x)³$

$$= \ (x\  + \ (2y\  - \ x))³\  = \ (2y)³\  = \ 8y^{3}$$

6.  Find integers $a$ and $b$ such that:

    a.  $\left( 1\  + \ \sqrt{3} \right)^{5} = \ a\  + \ b\sqrt{3}$

$$1\  + \ 5\sqrt{3} + \ 10(3) + \ 10\left( 3\sqrt{3} \right) + \ 5(9) + \ 9\sqrt{3}$$

$$= \ 1\  + \ 5\sqrt{3} + \ 30\  + \ 30\sqrt{3} + \ 45\  + \ 9\sqrt{3}$$

$$= \ 76\  + \ 44\sqrt{3}\ $$

a = 76, b = 44

b.  $\left( 1\  - \ \sqrt{5} \right)^{3} = \ a\  + \ b\sqrt{5}$

$$1\  + \ 3\left( - \sqrt{5} \right) + \ 3(5) + \ \left( - 5\sqrt{5} \right)$$

$$= \ 1\  - \ 3\sqrt{5} + \ 15\  - \ 5\sqrt{5}$$

$$= \ 16\  - \ 8\sqrt{5}$$

$$a\  = \ 16,\ b\  = \  - 8$$

7.  Verify by direct expansion, and by taking out the common factor,
    that:

$$(1\  + \ x)⁴\  - \ (1\  + \ x)³\  = \ x(1\  + \ x)³$$

Method 1: Taking out common factor

$$(1\  + \ x)³((1\  + \ x)\  - \ 1)\  = \ (1\  + \ x)³(x)\  = \ x(1\  + \ x)³$$

Method 2: Direct expansion

$$(1\  + \ x)⁴\  = \ 1\  + \ 4x\  + \ 6x²\  + \ 4x³\  + \ x⁴$$

$$(1\  + \ x)³\  = \ 1\  + \ 3x\  + \ 3x²\  + \ x³$$

$$(1\  + \ x)⁴\  - \ (1\  + \ x)³\  = \ x\  + \ 3x²\  + \ 3x³\  + \ x⁴\  = \ x(1\  + \ 3x\  + \ 3x²\  + \ x³)\  = \ x(1\  + \ x)³\ $$

# Finding a Particular Term

+-------------------------------------------------------------------+
| - **General Term of a Binomial Expansion**                        |
+===================================================================+
| The $r$^th^ term in $(x + y)^{n}$ is $\ ^{n}C_{r}x^{n - r}y^{r}$. |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------+
| - **Identify** $r$^th^ term in a binomial expansion.                                                  |
+==============================================+========================================================+
| Find the $r$^th^ term:                                                                                |
+----------------------------------------------+--------------------------------------------------------+
| a.  $(x + 1)^{7}$                            | b.  $(3 + 2x)^{5}$                                     |
+----------------------------------------------+--------------------------------------------------------+
| c.  $(2x - 3)^{4}$                           | d.  $(x - 4y)^{6}$                                     |
+----------------------------------------------+--------------------------------------------------------+
| e.  $\left( x^{2} + x \right)^{11}$          | f.  $\left( x^{2} + \frac{1}{x} \right)^{4}$           |
+----------------------------------------------+--------------------------------------------------------+
| g.  $\left( x^{3} + \frac{2}{x} \right)^{5}$ | h.  $\left( \frac{2}{x^{3}} - \frac{x}{3} \right)^{8}$ |
+----------------------------------------------+--------------------------------------------------------+

+-------------------------------------------------------------------+
| - **General Term of a Binomial Expansion**                        |
+===================================================================+
| The $r$^th^ term in $(x + y)^{n}$ is $\ ^{n}C_{r}x^{n - r}y^{r}$. |
|                                                                   |
| If you are asked to find a term with a particular power of $x$:   |
|                                                                   |
| 1\. Find $r$^th^ term by substituting $n$ and simplifying so      |
| there is only 1 $x$ term.                                         |
|                                                                   |
| 2\. Find the value of $r$ by equating powers of $x.$              |
|                                                                   |
| 3\. Evaluate $r$^th^ term.                                        |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Find a particular term of $(x + y)^{n}$ using the binomial theorem.                                                                                    |
+===============================================================================================+======================================================================+
| Find the term containing $x^{4}$ in $(2x - 3)^{6}$                                            | Find the term independent of $x$ in                                  |
|                                                                                               |                                                                      |
| 1\. $r$^th^ term: $\ ^{6}C_{r}(2x)^{6 - r}( - 3)^{r}$                                         | $$\left( x^{2} + \frac{2}{x^{2}} \right)^{8}$$                       |
|                                                                                               |                                                                      |
| $= \ ^{6}C_{r}\left( 2^{6 - r} \right)\left( x^{6 - r} \right)( - 3)^{r}$                     | 1\. $r$^th^ term:                                                    |
|                                                                                               | $\ ^{8}C_{r}\left( x^{2} \right)^{6 - r}\left( 2x^{- 2} \right)^{r}$ |
| 2\. For $x^{4}$, let $6 - r = 4$; $r = 2$                                                     |                                                                      |
|                                                                                               | $= \ ^{8}C_{r}x^{16 - 2r}2^{r}x^{- 2r}$                              |
| 3\.                                                                                           |                                                                      |
| $\therefore\ ^{6}C_{2}\left( 2^{6 - 2} \right)\left( x^{6 - 2} \right)( - 3)^{2} = 2160x^{4}$ | $= \ ^{8}C_{r}x^{16 - 4r}2^{r}$                                      |
|                                                                                               |                                                                      |
|                                                                                               | 2\. Let $16 - 4r = 0$; $r = 4$                                       |
|                                                                                               |                                                                      |
|                                                                                               | 3\. $\therefore\ ^{8}C_{4}x^{16 - 4(4)}2^{4} = 1120$                 |
+-----------------------------------------------------------------------------------------------+----------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
| - **Practice**                                                                |
+===========================================+===================================+
| Find the term containing $x^{3}$ in       | Find the term containing $x^{2}$  |
| $(3x - 2)^{5}$                            | in                                |
|                                           | $\left( 1 + 3x^{2} \right)^{5}$   |
+-------------------------------------------+-----------------------------------+
| Find the term independent of $x$ in       | Find the term containing          |
| $\left( 2x + \frac{1}{x^{2}} \right)^{6}$ | $x^{3}y^{4}$ in $(x + y)^{7}$     |
+-------------------------------------------+-----------------------------------+

Foundation

1.  Write down the general term for each binomial expansion.

+---------------------------------------------+--------------------------------------------------------------------+
| a.  $(1\  + \ x)¹³$                         | b.  $(1\  + \ 2x)⁷$                                                |
|                                             |                                                                    |
| $$¹³Cₖ\ xᵏ$$                                | $$⁷Cₖ\ 2ᵏ\ xᵏ$$                                                    |
+=============================================+====================================================================+
| c.  $(5\  + \ 7x)¹²$                        | d.  $(2x\  - \ y)⁹$                                                |
|                                             |                                                                    |
| $$¹²Cₖ\ 5¹²⁻ᵏ\ 7ᵏ\ xᵏ$$                     | $$⁹Cₖ\ 2⁹⁻ᵏ\ ( - 1)ᵏ\ x⁹⁻ᵏ\ yᵏ$$                                   |
+---------------------------------------------+--------------------------------------------------------------------+
| e.  $(x\  + \ 2x⁻¹)⁵$                       | f.  $\left( 6x\  - \frac{2}{x} \right)^{8}$                        |
|                                             |                                                                    |
| $$⁵Cₖ\ x⁵⁻ᵏ\ 2ᵏ\ x⁻ᵏ\  = \ ⁵Cₖ\ 2ᵏ\ x⁵⁻²ᵏ$$ | $$⁸Cₖ\ (6x)⁸⁻ᵏ\ ( - 2)ᵏ\ x⁻ᵏ\  = \ ⁸Cₖ\ 3⁸⁻ᵏ\ ( - 1)ᵏ\ 2⁸\ x⁸⁻²ᵏ$$ |
+---------------------------------------------+--------------------------------------------------------------------+

2.  For $(1\  + \ x)¹¹$, the $r$^th^ term is $¹¹Cᵣ\ x^{r}$.

+-------------------------------------+--------------------------------------+
| a.  find the term in $x²$           | b.  find the term in $x⁸$            |
|                                     |                                      |
| $$For\ x²,\ let\ r\  = \ 2$$        | $$For\ x⁸,\ let\ r\  = \ 8$$         |
|                                     |                                      |
| $$\therefore\ ¹¹C₂\ x²\  = \ 55x²$$ | $$\therefore\ ¹¹C₈\ x⁸\  = \ 165x⁸$$ |
+=====================================+======================================+

3.  For $(1\  - \ x)⁷$

+----------------------------------+----------------------------------+
| a.  find the term in $x^{3}$     | b.  find the term in $x^{5}$     |
|                                  |                                  |
| $$⁷Cᵣ\ ( - 1)^{r}x^{r}$$         | For $x⁵,$ let $r\  = \ 5$        |
|                                  |                                  |
| For $x³,$ let $r\  = \ 3$        | ∴                                |
|                                  | $⁷C₅\ ( - 1)⁵\ x⁵\  = \  - 21x⁵$ |
| ∴                                |                                  |
| $⁷C₃\ ( - 1)³\ x³\  = \  - 35x³$ |                                  |
+==================================+==================================+

4.  For $(1\  + \ 2x)⁶$

+-----------------------------------------+-----------------------------------------+
| a.  find the term in $x⁴$               | b.  find the term in $x^{5}$            |
|                                         |                                         |
| $rᵗʰ$ term: $⁶Cᵣ\ 2^{r}x^{r}$           | For $x⁵,$ let $r\  = \ 5$               |
|                                         |                                         |
| For $x⁴$, let $r\  = \ 4$               | $$\therefore\ ⁶C₅\ 2⁵\ x⁵\  = \ 192x⁵$$ |
|                                         |                                         |
| $$\therefore\ ⁶C₄\ 2⁴\ x⁴\  = \ 240x⁴$$ |                                         |
+=========================================+=========================================+

5.  For $\left( 1\  - \frac{3}{x} \right)^{4}$

+-------------------------------------------+----------------------------------------------------------+
| a.  find the term in $x^{- 1}$            | b.  find the term in $x^{- 2}$                           |
|                                           |                                                          |
| $rᵗʰ$ term: $⁴Cᵣ\ ( - 3)^{r}x^{- r}$      | For $x⁻²,$ let $r\  = \ 2$                               |
|                                           |                                                          |
| For $x⁻¹$, let $r\  = \ 1$                | $$\therefore\ ⁴C₂\ ( - 3)²\ x⁻²\  = \ \frac{54}{x^{2}}$$ |
|                                           |                                                          |
| ∴                                         |                                                          |
| $⁴C₁\ ( - 3)¹\ x⁻¹\  = \  - \frac{12}{x}$ |                                                          |
+===========================================+==========================================================+

6.  In the expansion of $(1\  + \ x)⁶$:

    a.  find the term in $x²,$

$$⁶C₂\ x²\  = \ 15x²$$

b.  find the term in $x³$,

$$⁶C₃\ x³\  = \ 20x³$$

c.  find the ratio of the term in $x²$ to the term in $x³$,

$$\frac{15x^{2}}{20x^{3}} = \frac{3}{4x}$$

7.  In the expansion of $\left( 1\  + \frac{2}{3x} \right)^{7}:$

    a.  find the term in $x⁻⁵$,

$r$ᵗʰ term: $⁷Cᵣ\ \left( \frac{2}{3x} \right)^{r} = \ ⁷Cᵣ\ 2ʳ\ 3⁻ʳ\ x⁻ʳ$

For $x⁻⁵,$ let $r\  = \ 5$

$$⁷C₅\ 2^{5}3^{- 5}x^{- 5} = \frac{224}{81x^{5}}$$

b.  find the term in $x⁻⁶$,

$x⁻⁶$, let $r\  = \ 6$

$$⁷C₆\ 2^{6}3^{- 6}x^{- 6} = \frac{448}{729x^{6}}$$

c.  find the ratio of the term in $x⁻⁵$ to the term in $x⁻⁶$,

$$\frac{9x}{2}$$

8.  Find the coefficient of $x⁴\$in the expansion of
    $(1\  - \ x)⁴\  + \ (1\  - \ x)⁵\  + \ (1\  - \ x)⁶$.

Coefficient of x⁴ in (1 − x)⁴: ⁴C₄ (−1)⁴ = 1

Coefficient of x⁴ in (1 − x)⁵: ⁵C₄ (−1)⁴ = 5

Coefficient of x⁴ in (1 − x)⁶: ⁶C₄ (−1)⁴ = 15

Total: 1 + 5 + 15 = 21

Development

9.  a.  Expand $(1\  + \ x)⁴$ as far as the term in $x².$

$$(1\  + \ x)⁴\  = \ 1\  + \ 4x\  + \ 6x²\  + \ ...$$

b.  Hence find the coefficient of $x²$ in the expansion of
    $(1\  - \ 5x)(1\  + \ x)⁴.$

$$(1\  - \ 5x)(1\  + \ x)⁴\  = \ (1\  - \ 5x)(1\  + \ 4x\  + \ 6x²\  + \ ...)$$

Coefficient of x²: 6 + (−5)(4) = −14

10. a.  Expand $(1\  + \ 2x)⁵$ as far as the term in $x³.$

$$(1\  + \ 2x)^{5} = \ 1\  + \ 10x\  + \ 40x^{2} + \ 80x^{3} + ...$$

b.  Hence find the coefficient of $x³$ in the expansion of
    $(2\  - \ 3x)(1\  + \ 2x)⁵.$

$$(2\  - \ 3x)(1\  + \ 2x)⁵\  = \ (2\  - \ 3x)(1\  + \ 10x\  + \ 40x²\  + \ 80x³\  + \ ...)$$

Coefficient of x³: 2(80) + (−3)(40) = 40

11. a.  Expand $(1\  - \ 3x)⁴$ as far as the term in $x³.$

$$(1\  - \ 3x)^{4} = \ 1\  - \ 12x\  + \ 54x^{2} - \ 108x^{3} + \ \ldots$$

b.  Hence find the coefficient of $x³$ in the expansion of
    $(2\  + \ x)²(1\  - \ 3x)⁴.$

$$\left( 4\  + \ 4x\  + \ x^{2} \right)\left( 1\  - \ 12x\  + \ 54x^{2} - \ 108x^{3} + \ ... \right)$$

Coefficient of x³: 4(−108) + 4(54) + 1(−12) = −228

12. Consider the expansion $\left( x^{2} + \frac{1}{x} \right)^{9}.$

    a.  Show that each term in the expansion of
        $\left( x^{2} + \frac{1}{x} \right)^{9}$ can be written as
        $⁹Cⱼ\ x¹⁸⁻³ʲ.$

$⁹Cⱼ\ (x²)⁹⁻ʲ\ (x⁻¹)ʲ$

$= \ ⁹Cⱼ\ x¹⁸⁻²ʲ\ x⁻ʲ$

$$= \ ⁹Cⱼ\ x¹⁸⁻³ʲ$$

b.  Hence find the coefficient of $x^{3}$

For $x³$, let $18\  - \ 3j\  = \ 3$, so $j\  = \ 5$

Coefficient: ⁹C₅ = 126

c.  Find the coefficient of $x^{- 3}$

For $x⁻³$, let $18\  - \ 3j\  = \  - 3$, so $j\  = \ 7$

Coefficient: ⁹C₇ = 36

d.  Find the term independent of $x$

For $x⁰$, let $18\  - \ 3j\  = \ 0$, so $j\  = \ 6$

Coefficient: $⁹C₆\  = \ 84$

13. a.  Expand $(4\  + \ x)⁵$ as far as the term in $x³$

$$(4\  + \ x)⁵\  = \ 1024\  + \ 1280x\  + \ 640x²\  + \ 160x³\  + \ ...$$

b.  Hence find the coefficient of $x³$ in the expansion of
    $(3\  - \ x)(4\  + \ x)⁵$.

$$(3\  - \ x)(4\  + \ x)⁵\  = \ (3\  - \ x)(1024\  + \ 1280x\  + \ 640x²\  + \ 160x³\  + \ ...)$$

Coefficient of x³: 3(160) + (−1)(640) = −160

14. a.  Expand $(1\  - \ 2x)⁶$ as far as the term in $x⁴$.

(1 − 2x)⁶ = 1 − 12x + 60x² − 160x³ + 240x⁴ − \...

b.  Hence find the coefficient of $x⁴\$in the expansion of
    $(1\  - \ 3x)(1\  - \ 2x)⁶.$

$$(1\  - \ 3x)(1\  - \ 2x)⁶\  = \ (1\  - \ 3x)(1\  - \ 12x\  + \ 60x²\  - \ 160x³\  + \ 240x⁴\  - \ ...)$$

Coefficient of x⁴: 1(240) + (−3)(−160) = 720

15. Find the specified terms in each expansion.

    a.  For $(2\  + \ x)⁷$, find the term in $x²$.

$$⁷Cᵣ\ 2⁷⁻ʳ\ xʳ$$

For $x²$, let $r\  = \ 2$

$$C₂\ 2⁵\ x²\  = \ 672x²$$

b.  For $\left( x\  + \frac{y}{2} \right)^{14}$, find the term in
    $x⁹y⁵.$

$¹⁴Cᵣ\ x^{14 -}ʳ\ \left( \frac{y}{2} \right)^{r}$

$$= \ ¹⁴Cᵣ\ \left( \frac{1}{2} \right)^{r}\ x¹⁴⁻ʳ\ yʳ$$

For $x⁹y⁵$, let $14\  - \ r\  = \ 9,$ so $r\  = \ 5$

$$¹⁴C₅\ \left( \frac{1}{2} \right)^{5}\ x⁹y⁵\  = \ \frac{1001x^{9}y^{5}}{16}$$

c.  For $\left( \frac{x}{2}\  - \ 3y^{2} \right)^{11}$, find the term in
    $x¹⁰y².$

$¹¹Cᵣ\left( \frac{x}{2} \right)^{11 - r}\ \left( - 3y^{2} \right)ʳ$

$$= \ ¹¹Cᵣ\left( \frac{1}{2} \right)^{11 - r}\ ( - 3)ʳ\ x^{11 -}ʳ\ y^{2}ʳ$$

For $x¹⁰y²$, let $11\  - \ r\  = \ 10$ and $2r\  = \ 2$, so $r\  = \ 1$

$¹¹C₁\ \left( \frac{1}{2} \right)^{10}( - 3)^{1}x^{10}y^{2}$

$$= \  - \frac{33x^{10}y^{2}}{1024}$$

d.  For $\left( a\  - \sqrt{b} \right)^{20}$, find the term in $a²b⁹.$

$²⁰Cᵣ\ a^{20 -}ʳ\ \left( - b^{\frac{1}{2}} \right)ʳ$ = $²⁰Cᵣ$
$( - 1)ʳ\ a²⁰⁻ʳ\ b^{\frac{r}{2}}$

For $a²b⁹,$ let $20\  - \ r\  = \ 2$ and $\frac{r}{2} = \ 9$, so
$r\  = \ 18$

$$²⁰C₁₈\ a²b⁹\  = \ 190a²b⁹$$

16. Find the coefficient of:

    a.  $x³$ in $(3\  - \ 4x)(1\  + \ x)⁴$

$$(1\  + \ x)⁴\  = \ 1\  + \ 4x\  + \ 6x²\  + \ 4x³\  + \ ...$$

$$(3\  - \ 4x)(1\  + \ x)⁴\  = \ (3\  - \ 4x)(1\  + \ 4x\  + \ 6x²\  + \ 4x³\  + \ ...)$$

Coefficient of $x³:\ 3(4)\  + \ ( - 4)(6)\  = \  - 12$

b.  $x$ in $(1\  + \ 3x\  + \ x²)(1\  - \ x)³$

$$(1\  - \ x)³\  = \ 1\  - \ 3x\  + \ 3x²\  - \ x³$$

$$(1\  + \ 3x\  + \ x²)(1\  - \ x)³\  = \ (1\  + \ 3x\  + \ x²)(1\  - \ 3x\  + \ 3x²\  - \ x³)$$

Coefficient of $x:\ 1( - 3)\  + \ 3(1)\  = \ 0$

c.  $x⁴$ in $(5\  - \ 2x³)(1\  + \ 2x)⁵$

$$(1\  + \ 2y)⁵\  = \ 1\  + \ 10y\  + \ 40y²\  + \ 80y³\  + \ 80y⁴\  + \ ...$$

$$(5\  - \ 2x³)(1\  + \ 2y)⁵\  = \ (5\  - \ 2x³)(1\  + \ 10y\  + \ 40y²\  + \ 80y³\  + \ 80y⁴\  + \ ...)$$

Coefficient of $x⁴:\ 5(80)\  = \ 380$

d.  $x⁰$ in
    $\left( 1\  - \frac{x}{3} \right)^{3}\left( 1\  + \frac{2}{x} \right)^{2}$

$$\left( 1\  - \frac{x}{3} \right)^{3} = \ 1\  - \ x\  + \ \left( \frac{x^{2}}{3} \right) - \ \left( \frac{x^{3}}{27} \right)$$

$$\left( 1\  + \frac{2}{x} \right)^{2} = \ 1\  + \ \left( \frac{4}{x} \right) + \ \left( \frac{4}{x^{2}} \right)$$

$$\left( 1\  - \frac{x}{3} \right)^{3}\left( 1\  + \frac{2}{x} \right)^{2} = \ \left( 1\  - \ x\  + \ \left( \frac{x^{2}}{3} \right) - \ \left( \frac{x^{3}}{27} \right) \right)\left( 1\  + \ \left( \frac{4}{x} \right) + \ \left( \frac{4}{x^{2}} \right) \right)$$

$$Coefficient\ ofx^{0}:\ 1(1) + \ ( - 1)\left( \frac{4}{x} \right)(x) + \ \left( \frac{1}{3} \right)\left( \frac{4}{x^{2}} \right)\left( x^{2} \right) = \ 1\  - \ 4\  + \frac{4}{3} = \  - \frac{5}{3}$$

Mastery

17. In the expansion of $(2x³\  + \ 3x⁻²)¹⁰,$ the general term is
    $¹⁰Cₖ\ (2x³)¹⁰⁻ᵏ\ (3x⁻²)ᵏ.$

    a.  Show that this general term can be written as
        $¹⁰Cₖ\ 2¹⁰⁻ᵏ\ 3ᵏ\ x³⁰⁻⁵ᵏ.$

$$¹⁰Cₖ\ (2x³)¹⁰⁻ᵏ\ (3x⁻²)ᵏ\ $$

$$= \ ¹⁰Cₖ\ 2¹⁰⁻ᵏ\ x³⁽¹⁰⁻ᵏ⁾\ 3ᵏ\ x⁻²ᵏ$$

$$= \ ¹⁰Cₖ\ 2¹⁰⁻ᵏ\ 3ᵏ\ x³⁰⁻³ᵏ⁻²ᵏ\ $$

$$= \ ¹⁰Cₖ\ 2¹⁰⁻ᵏ\ 3ᵏ\ x³⁰⁻⁵ᵏ$$

b.  Hence find the coefficients of these terms, giving your answers in
    combination notation and as prime factors.

    i.  $x^{10}$

For x¹⁰, let 30 − 5k = 10, so k = 4

¹⁰C₄ × 2⁶ × 3⁴

ii. $x^{- 5}$

For x⁻⁵, let 30 − 5k = −5, so k = 7

¹⁰C₇ × 2³ × 3⁷

iii. $x^{0}$

For x⁰, let 30 − 5k = 0, so k = 6

¹⁰C₆ × 2⁴ × 3⁶

18. a.  Show that the general term in the expansion of
        $\left( \frac{x}{2} - \frac{5}{x} \right)^{15}$ is
        $¹⁵Cⱼ\ ( - 1)ʲ\ 5ʲ\ 2ʲ⁻¹⁵\ x¹⁵⁻²ʲ.$

$$¹⁵Cⱼ\ \left( \frac{x}{2} \right)^{15 - j}\left( - \frac{5}{x} \right)^{j}\ \ $$

$$= \ ¹⁵Cⱼ\ x¹⁵⁻ʲ\ 2⁻⁽¹⁵⁻ʲ⁾\ ( - 5)ʲ\ x⁻ʲ$$

$$= \ ¹⁵Cⱼ\ ( - 1)ʲ\ 5ʲ\ 2ʲ⁻¹⁵\ x¹⁵⁻²ʲ$$

b.  Hence find, without simplifying, the coefficients of:

    i.  $x¹¹$

For $x¹¹,$ let $15\  - \ 2j\  = \ 11$, so $j\  = \ 2$

$$¹⁵C₂\  \times \ 5²\  \times \ 2⁻¹³$$

ii. $x\ \$

For $x$, let $15\  - \ 2j\  = \ 1$, so $j\  = \ 7$

$$- ¹⁵C₇\  \times \ 5⁷\  \times \ 2⁻⁸$$

iii. $x⁻⁵$

For $x⁻⁵,$ let $15\  - \ 2j\  = \  - 5$, so$\ j\  = \ 10$

$$¹⁵C₁₀\  \times \ 5¹⁰\  \times \ 2⁻⁵$$

19. a.  Find $x$ if the terms in $x¹⁰$ and $x¹¹$ in the expansion of
        $(5\  + \ 2x)¹⁵$ are equal.

Term in $x¹⁰:\ ¹⁵C₁₀\ 5⁵\ 2¹⁰\ x¹⁰$

Term in $x¹¹:\ ¹⁵C₁₁\ 5⁴\ 2¹¹\ x¹¹$

Equating coefficients: $¹⁵C₁₀\ 5⁵\ 2¹⁰\  = \ ¹⁵C₁₁\ 5⁴\ 2¹¹$

$$¹⁵C₁₀\ 5\  = \ ¹⁵C₁₁\ 4$$

Using $¹⁵C₁₀\  = \ 3003$ and $¹⁵C₁₁\  = \ 1365$

$$3003(5)\  = \ 1365(4)x$$

$$x\  = \frac{11}{2}$$

b.  Find $x$ if the terms in $x¹³$ and $x¹⁴$ in the expansion of
    $(2\  - \ 3x)¹⁷$ are equal.

Term in $x¹³:\ ¹⁷C₁₃\ 2⁴\ ( - 3)¹³\ x¹³$

Term in $x¹⁴:\ ¹⁷C₁₄\ 2³\ ( - 3)¹⁴\ x¹⁴$

Equating coefficients: $¹⁷C₁₃\ 2⁴\ ( - 3)¹³\  = \ ¹⁷C₁₄\ 2³\ ( - 3)¹⁴$

$$¹⁷C₁₃\ 2( - 1)\  = \ ¹⁷C₁₄\ 3$$

Using $¹⁷C₁₃\  = \ 2380$ and $¹⁷C₁₄\  = \ 680$

$$- 2380(2)\  = \ 680(3)x$$

$$x\  = \  - \frac{7}{3}$$

20. Determine the value of the term independent of $x$ in the expansion
    of:

$$(1\  + \ 2x)^{4}\left( 1\  - \frac{1}{x^{2}} \right)^{6}$$

General term of $(1\  + \ 2x)⁴:\ ⁴Cᵣ\ 2ʳ\ xʳ$

General term of
$\left( 1\  - \frac{1}{x^{2}} \right)^{6}:\ ⁶Cₛ\ ( - 1)ˢ\ x⁻²ˢ$

For $x⁰$, need $r\  - \ 2s\  = \ 0,\ so\ r\  = \ 2s$

Possible: r = 0, s = 0: $⁴C₀\ ⁶C₀\  = \ 1$

r = 2, s = 1: $⁴C₂\ 2²\ ⁶C₁\ ( - 1)¹\  = \  - 144$

r = 4, s = 2: $⁴C₄\ 2⁴\ ⁶C₂\ 1\  = \ 240$

Total: $1\  - \ 144\  + \ 240\  = \ 97$

21. Find the coefficient of the power of $x$ specified in each
    expansion.

    a.  $x¹⁵$ in $\left( x^{3} - \frac{2}{x} \right)^{9}$

$$\ ^{9}Cᵣ\ \left( x^{3} \right)^{9 -}ʳ\ \left( - \frac{2}{x} \right)ʳ\  = \ ⁹Cᵣ\ ( - 2)ʳ\ x²⁷⁻³ʳ⁻ʳ\  = \ ⁹Cᵣ\ ( - 2)ʳ\ x²⁷⁻⁴ʳ$$

For $x¹⁵$, let $27\  - \ 4r\  = \ 15,\ so\ r\  = \ 3$

$$⁹C₃\ ( - 2)³\  = \  - 672$$

b.  $x⁻¹⁴$ in $(x\  - \ 3x⁻⁴)¹¹$

$$¹¹Cᵣ\ xʳ\ ( - 3x⁻⁴)¹¹⁻ʳ\  = \ ¹¹Cᵣ\ ( - 3)¹¹⁻ʳ\ xʳ⁻⁴⁴⁺⁴ʳ\  = \ ¹¹Cᵣ\ ( - 3)¹¹⁻ʳ\ x⁵ʳ⁻⁴⁴$$

For $x⁻¹⁴,$ let $5r\  - \ 44\  = \  - 14,\ so\ r\  = \ 6$

$$¹¹C₆\ ( - 3)⁵\  = \  - 112\ 266$$

c.  the constant term in $\left( \frac{1}{2x^{3}} + \ x \right)^{20}$

$$\ ^{20}Cᵣ\ \left( \frac{1}{2x^{3}} \right)^{20 -}ʳ\ xʳ\ $$

$$=_{\ }^{20}Cᵣ\ 2^{- (20 -}ʳ^{)}x^{- 60 + 3}ʳ^{+}ʳ\ $$

$$= \ ²⁰Cᵣ\ 2ʳ⁻²⁰\ x⁴ʳ⁻⁶⁰$$

For $x⁰,$ let $4r\  - \ 60\  = \ 0$, so $r\  = \ 15$

$$\ ^{20}C_{15}\ 2^{- 5} = \frac{969}{2}$$

d.  $x⁷$ in $\left( 5x^{2} + \frac{1}{2x} \right)^{8}$

$$\ ^{8}Cᵣ\ \left( 5x^{2} \right)^{8 -}ʳ\ \left( \frac{1}{2x} \right)ʳ\  = \ ⁸Cᵣ\ 5⁸⁻ʳ\ 2⁻ʳ\ x¹⁶⁻²ʳ⁻ʳ\  = \ ⁸Cᵣ\ 5⁸⁻ʳ\ 2⁻ʳ\ x¹⁶⁻³ʳ$$

For $x⁷$, let $16\  - \ 3r\  = \ 7,\ so\ r\  = \ 3$

$$⁸C₃\ 5⁵\ 2⁻³\  = \ 21\ 875$$

e.  $x⁻¹$ in $\left( x^{- 1} + \frac{2x}{7} \right)^{5}$

$$\ ^{5}Cᵣ\ \left( x^{- 1} \right)^{5 -}ʳ\ \left( \frac{2x}{7} \right)ʳ\  =_{\ }^{5}Cᵣ\ \left( \frac{2}{7} \right)ʳ\ x^{- 5 +}ʳ^{+}ʳ\  =_{\ }^{5}Cᵣ\ \left( \frac{2}{7} \right)ʳ\ x^{2}ʳ^{- 5}\ $$

For $x⁻¹$, let $2r\  - \ 5\  = \  - 1$, so $r\  = \ 2$

$$\ ^{5}C^{2}\left( \frac{2}{7} \right)^{2} = \frac{40}{49}$$

22. Find the coefficient of $x$ in the expansion of
    $\left( x\  + \frac{1}{x} \right)^{5}\left( x\  - \frac{1}{x} \right)^{4}$.

$$This\ is\ {\left( x + \frac{1}{x} \right)\left( x^{2} - \frac{1}{x^{2}} \right)}^{4}$$

$$= \left( x + x^{- 1} \right)\left( x^{2} - x^{- 2} \right)^{4}$$

$$For\ \left( x^{2} - x^{- 2} \right)^{4},\ \ ^{4}C_{r}\left( x^{2} \right)^{r}\left( - x^{- 2} \right)^{4 - r}$$

$$= \ ^{4}C_{r}( - 1)^{4 - r}x^{4r - 8}$$

When multiplied by $\left( x + x^{- 1} \right)$, terms in $x^{0}$ and
$x^{2}$ will become $x^{1}$

$4r - 8 = 0$, $r = 2$

$4r - 8 = 2,\ r = 2.5$ not possible

$$\therefore\ ^{4}C_{2} = 6$$

23. In the expansion of $(2\  + \ ax\  + \ bx²)(1\  + \ x)¹³$, the
    coefficients of $x⁰$, $x¹$ and $x²\$are all equal to 2. Find the
    values of $a$ and $b$.

$$(1\  + \ x)¹³\  = \ 1\  + \ 13x\  + \ 78x²\  + \ ...$$

$$(2\  + \ ax\  + \ bx²)(1\  + \ x)¹³:$$

Coefficient of $x⁰:\ 2(1)\  = \ 2$

Coefficient of $x^{1}:\ 2(13) + \ a(1) = \ 2,\$

$$a\  = \  - 24$$

Coefficient of $x^{2}:\ 2(78) + \ a(13) + \ b(1) = \ 2,\$

$$b\  = \ 158$$

24. The expression $(1\  + \ ax)ⁿ\$is expanded in increasing powers of
    $x$.\
    Find the values of $a$ and $n$ if the first three terms are:

    a.  $1\  + \ 28x\  + \ 364x²\  + \ ...$

$$(1\  + \ ax)ⁿ\  = \ 1\  + \ nax\  + \ \left( \frac{n(n - 1)}{2} \right)a²x²\  + \ ...$$

Coefficient of $x$: $na\  = \ 28$

Coefficient of $x²:\ \left( \frac{n(n - 1)}{2} \right)a²\  = \ 364$

Dividing both sides by $na$: $\frac{(n - 1)a}{2} = \ 13$,

$$(n - 1)a\  = \ 26$$

From $na\  = \ 28$: $na\  - \ a\  = \ 26$, so $a\  = \ 2,\ n\  = \ 14$

b.  $1\  - \frac{10x}{3}\  + \ 5x²\  - \ ...$

$$(1\  + \ ax)ⁿ\  = \ 1\  + \ nax\  + \ \left( \frac{n(n - 1)}{2} \right)a²x²\  + \ ...$$

Coefficient of $x:\ na\  = \  - 10/3$

Coefficient of $x²:\ \left( \frac{n(n - 1)}{2} \right)a²\  = \ 5$

Dividing:
$\frac{(n - 1)a}{2} = \frac{5}{- \frac{10}{3}} = \  - \frac{3}{2}$, so
$(n - 1)a\  = \  - 3$

From $na\  = \  - \frac{10}{3}:\ na\  - \ a\  = \  - 3$, so
$a\  = \  - \frac{1}{3},\ n\  = \ 10$

# Proofs using Binomial Theorem

+----------------------------------------------------------------------+
| - **Binomial Coefficient Notation**                                  |
+======================================================================+
| To make expressions look simpler, we can use **binomial coefficient  |
| notation**:                                                          |
|                                                                      |
| $$\ ^{n}C_{r} = \left( \begin{array}{r}                              |
| n \\                                                                 |
| r                                                                    |
| \end{array} \right)$$                                                |
|                                                                      |
| Therefore, the binomial theorem can be written as:                   |
|                                                                      |
| $$(x + y)^{n} = \left( \begin{array}{r}                              |
| n \\                                                                 |
| 0                                                                    |
| \end{array} \right)x^{n} + \left( \begin{array}{r}                   |
| n \\                                                                 |
| 1                                                                    |
| \end{array} \right)x^{n - 1}y + \left( \begin{array}{r}              |
| n \\                                                                 |
| 2                                                                    |
| \end{array} \right)x^{n - 2}y^{2} + \ldots + \left( \begin{array}{r} |
| n \\                                                                 |
| n - 1                                                                |
| \end{array} \right)xy^{n - 1} + \left( \begin{array}{r}              |
| n \\                                                                 |
| n                                                                    |
| \end{array} \right)y^{n}$$                                           |
+----------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Combinations Proofs**                                         |
+===================================================================+
| You\'ve already seen how to prove many combinations identities    |
| algebraically using the combinations formula or a combinatorial   |
| argument.                                                         |
|                                                                   |
| You\'ll now learn two more methods of proof:                      |
|                                                                   |
| - Substituting into the Binomial Theorem                          |
|                                                                   |
| - Equating coefficients                                           |
+-------------------------------------------------------------------+

+----------------------------------------------------------------------+
| - **Prove** identities by substituting into the Binomial Theorem.    |
+======================================================================+
| You have proved the identity below by counting the total number of   |
| subsets possible from a set of size $n:$                             |
|                                                                      |
| $$\left( \begin{array}{r}                                            |
| n \\                                                                 |
| 0                                                                    |
| \end{array} \right) + \left( \begin{array}{r}                        |
| n \\                                                                 |
| 1                                                                    |
| \end{array} \right) + \left( \begin{array}{r}                        |
| n \\                                                                 |
| 2                                                                    |
| \end{array} \right) + \ldots\left( \begin{array}{r}                  |
| n \\                                                                 |
| n - 1                                                                |
| \end{array} \right) + \left( \begin{array}{r}                        |
| n \\                                                                 |
| n                                                                    |
| \end{array} \right) = 2^{n}$$                                        |
|                                                                      |
| We can prove this using the binomial theorem as well:                |
|                                                                      |
| Starting with\                                                       |
| $$(x + y)^{n} = \left( \begin{array}{r}                              |
| n \\                                                                 |
| 0                                                                    |
| \end{array} \right)x^{n} + \left( \begin{array}{r}                   |
| n \\                                                                 |
| 1                                                                    |
| \end{array} \right)x^{n - 1}y + \left( \begin{array}{r}              |
| n \\                                                                 |
| 2                                                                    |
| \end{array} \right)x^{n - 2}y^{2} + \ldots + \left( \begin{array}{r} |
| n \\                                                                 |
| n - 1                                                                |
| \end{array} \right)xy^{n - 1} + \left( \begin{array}{r}              |
| n \\                                                                 |
| n                                                                    |
| \end{array} \right)y^{n}$$                                           |
|                                                                      |
| Let $x = 1,\ y = 1$:                                                 |
+----------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------+
| - **Prove** identities by equating coefficients.                                                               |
+================================================================================================================+
| Using                                                                                                          |
|                                                                                                                |
| $$\left( x + \frac{1}{x} \right)^{n}\left( x + \frac{1}{x} \right)^{n} = \left( x + \frac{1}{x} \right)^{2n}$$ |
|                                                                                                                |
| Prove that $\left( \begin{array}{r}                                                                            |
| n \\                                                                                                           |
| 0                                                                                                              |
| \end{array} \right)^{2} + \left( \begin{array}{r}                                                              |
| n \\                                                                                                           |
| 1                                                                                                              |
| \end{array} \right)^{2} + \left( \begin{array}{r}                                                              |
| n \\                                                                                                           |
| 2                                                                                                              |
| \end{array} \right)^{2}\ldots + \left( \begin{array}{r}                                                        |
| n \\                                                                                                           |
| n                                                                                                              |
| \end{array} \right)^{2} = \left( \begin{array}{r}                                                              |
| 2n \\                                                                                                          |
| n                                                                                                              |
| \end{array} \right)$ by equating the constant terms.                                                           |
|                                                                                                                |
| **Find constant term of RHS:**                                                                                 |
|                                                                                                                |
| The $r$^th^ term of $\left( x + \frac{1}{x} \right)^{2n}$ is:                                                  |
|                                                                                                                |
| Let the power of $x$ be 0 and solve for $r$.                                                                   |
|                                                                                                                |
| Therefore, the constant term is:                                                                               |
|                                                                                                                |
| **Find constant term of LHS:**                                                                                 |
|                                                                                                                |
| Find the $r$^th^ term of $\left( x + \frac{1}{x} \right)^{n}$ and simplify to show that the expansion is:      |
|                                                                                                                |
| $$\left( \begin{array}{r}                                                                                      |
| n \\                                                                                                           |
| 0                                                                                                              |
| \end{array} \right)x^{n} + \left( \begin{array}{r}                                                             |
| n \\                                                                                                           |
| 1                                                                                                              |
| \end{array} \right)x^{n - 2} + \left( \begin{array}{r}                                                         |
| n \\                                                                                                           |
| 2                                                                                                              |
| \end{array} \right)x^{n - 4} + \ldots\left( \begin{array}{r}                                                   |
| n \\                                                                                                           |
| n - 1                                                                                                          |
| \end{array} \right)x^{2 - n} + \left( \begin{array}{r}                                                         |
| n \\                                                                                                           |
| n                                                                                                              |
| \end{array} \right)x^{- n}$$                                                                                   |
|                                                                                                                |
| (proof continues on next page)                                                                                 |
|                                                                                                                |
| For $\left( x + \frac{1}{x} \right)^{n}\left( x + \frac{1}{x} \right)^{n}$, the second factor expands          |
| identically:                                                                                                   |
|                                                                                                                |
| $$\left( x + \frac{1}{x} \right)^{n}\left( x + \frac{1}{x} \right)^{n} = \left\lbrack \left( \begin{array}{r}  |
| n \\                                                                                                           |
| 0                                                                                                              |
| \end{array} \right)x^{n} + \left( \begin{array}{r}                                                             |
| n \\                                                                                                           |
| 1                                                                                                              |
| \end{array} \right)x^{n - 2} + \ldots\left( \begin{array}{r}                                                   |
| n \\                                                                                                           |
| n - 1                                                                                                          |
| \end{array} \right)x^{2 - n} + \left( \begin{array}{r}                                                         |
| n \\                                                                                                           |
| n                                                                                                              |
| \end{array} \right)x^{- n} \right\rbrack\ \left\lbrack \left( \begin{array}{r}                                 |
| n \\                                                                                                           |
| 0                                                                                                              |
| \end{array} \right)x^{n} + \left( \begin{array}{r}                                                             |
| n \\                                                                                                           |
| 1                                                                                                              |
| \end{array} \right)x^{n - 2} + \ldots\left( \begin{array}{r}                                                   |
| n \\                                                                                                           |
| n - 1                                                                                                          |
| \end{array} \right)x^{2 - n} + \left( \begin{array}{r}                                                         |
| n \\                                                                                                           |
| n                                                                                                              |
| \end{array} \right)x^{- n} \right\rbrack$$                                                                     |
|                                                                                                                |
| When multiplying these, constant terms arise only when powers ..............., for example:                    |
|                                                                                                                |
| $$\left( \begin{array}{r}                                                                                      |
| n \\                                                                                                           |
| 0                                                                                                              |
| \end{array} \right)x^{n} \times \left( \begin{array}{r}                                                        |
| n \\                                                                                                           |
| n                                                                                                              |
| \end{array} \right)x^{- n} = \left( \begin{array}{r}                                                           |
| n \\                                                                                                           |
| 0                                                                                                              |
| \end{array} \right)\left( \begin{array}{r}                                                                     |
| n \\                                                                                                           |
| n                                                                                                              |
| \end{array} \right)$$                                                                                          |
|                                                                                                                |
| $$\left( \begin{array}{r}                                                                                      |
| n \\                                                                                                           |
| 1                                                                                                              |
| \end{array} \right)x^{n - 2} \times \left( \begin{array}{r}                                                    |
| n \\                                                                                                           |
| n - 1                                                                                                          |
| \end{array} \right)x^{2 - n} = \left( \begin{array}{r}                                                         |
| n \\                                                                                                           |
| 1                                                                                                              |
| \end{array} \right)\left( \begin{array}{r}                                                                     |
| n \\                                                                                                           |
| n - 1                                                                                                          |
| \end{array} \right)$$                                                                                          |
|                                                                                                                |
| $$\left( \begin{array}{r}                                                                                      |
| n \\                                                                                                           |
| 2                                                                                                              |
| \end{array} \right)x^{(n - 4)} \times \left( \begin{array}{r}                                                  |
| n \\                                                                                                           |
| n - 2                                                                                                          |
| \end{array} \right)x^{(4 - n)} = \left( \begin{array}{r}                                                       |
| n \\                                                                                                           |
| 2                                                                                                              |
| \end{array} \right)\left( \begin{array}{r}                                                                     |
| n \\                                                                                                           |
| n - 2                                                                                                          |
| \end{array} \right)$$                                                                                          |
|                                                                                                                |
| The constant term comes from adding up all these pairs, so the constant term is:                               |
|                                                                                                                |
| Now consider the symmetric property: $\left( \begin{array}{r}                                                  |
| n \\                                                                                                           |
| r                                                                                                              |
| \end{array} \right) = \left( \begin{array}{r}                                                                  |
| n \\                                                                                                           |
| n - r                                                                                                          |
| \end{array} \right)$                                                                                           |
|                                                                                                                |
| We can rewrite the constant term as:                                                                           |
|                                                                                                                |
| We have therefore proven the identity.                                                                         |
|                                                                                                                |
| $$\left( \begin{array}{r}                                                                                      |
| n \\                                                                                                           |
| 0                                                                                                              |
| \end{array} \right)^{2} + \left( \begin{array}{r}                                                              |
| n \\                                                                                                           |
| 1                                                                                                              |
| \end{array} \right)^{2} + \left( \begin{array}{r}                                                              |
| n \\                                                                                                           |
| 2                                                                                                              |
| \end{array} \right)^{2}\ldots + \left( \begin{array}{r}                                                        |
| n \\                                                                                                           |
| n                                                                                                              |
| \end{array} \right)^{2} = \left( \begin{array}{r}                                                              |
| 2n \\                                                                                                          |
| n                                                                                                              |
| \end{array} \right)$$                                                                                          |
|                                                                                                                |
| This identity means that if the entries of any row are squared and added, the sum is the middle entry in the   |
| row twice as far down.                                                                                         |
|                                                                                                                |
| +------+---------------------+                                                                                 |
| | Row  | 1                   |                                                                                 |
| | 0    |                     |                                                                                 |
| |      | 1 1                 |                                                                                 |
| | Row  |                     |                                                                                 |
| | 1    | 1 2 1               |                                                                                 |
| |      |                     |                                                                                 |
| | Row  | **1^2^ + 3^2^ +     |                                                                                 |
| | 2    | 3^2^ + 1^2^**       |                                                                                 |
| |      |                     |                                                                                 |
| | Row  | 1 4 6 4 1           |                                                                                 |
| | 3    |                     |                                                                                 |
| |      | 1 5 10 10 5 1       |                                                                                 |
| | Row  |                     |                                                                                 |
| | 4    | 1 6 15 **20** 15 6  |                                                                                 |
| |      | 1                   |                                                                                 |
| | Row  |                     |                                                                                 |
| | 5    |                     |                                                                                 |
| |      |                     |                                                                                 |
| | Row  |                     |                                                                                 |
| | 6    |                     |                                                                                 |
| +======+=====================+                                                                                 |
+----------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Prove** identities by combinatorial argument.                 |
+===================================================================+
| We will prove the same identity using a combinatorial argument.   |
|                                                                   |
| $$\left( \begin{array}{r}                                         |
| n \\                                                              |
| 0                                                                 |
| \end{array} \right)^{2} + \left( \begin{array}{r}                 |
| n \\                                                              |
| 1                                                                 |
| \end{array} \right)^{2} + \left( \begin{array}{r}                 |
| n \\                                                              |
| 2                                                                 |
| \end{array} \right)^{2}\ldots + \left( \begin{array}{r}           |
| n \\                                                              |
| n                                                                 |
| \end{array} \right)^{2} = \left( \begin{array}{r}                 |
| 2n \\                                                             |
| n                                                                 |
| \end{array} \right)$$                                             |
|                                                                   |
| The RHS represents choosing ......... objects from .........,     |
| which we write as ...............                                 |
|                                                                   |
| We can make the same choice by dividing $2n$ objects into two     |
| distinct groups, A and B,\                                        |
| then choosing $r$ objects from one group, and $n - r$ objects     |
| from the other.                                                   |
|                                                                   |
| - Take 0 from A, $n$ from B: $\left( \begin{array}{r}             |
|   n \\                                                            |
|   0                                                               |
|   \end{array} \right)\left( \begin{array}{r}                      |
|   n \\                                                            |
|   n                                                               |
|   \end{array} \right) = \left( \begin{array}{r}                   |
|   n \\                                                            |
|   0                                                               |
|   \end{array} \right)^{2}$                                        |
|                                                                   |
| - Take 1 from A, $n - 1$ from B: $\left( \begin{array}{r}         |
|   n \\                                                            |
|   1                                                               |
|   \end{array} \right)\left( \begin{array}{r}                      |
|   n \\                                                            |
|   n - 1                                                           |
|   \end{array} \right) = \left( \begin{array}{r}                   |
|   n \\                                                            |
|   1                                                               |
|   \end{array} \right)^{2}$                                        |
|                                                                   |
| - Take 2 from A, ......... from B:                                |
|                                                                   |
| ...                                                               |
|                                                                   |
| All the possibilities add up to:                                  |
|                                                                   |
| Since both sides count the same thing, we have proven that:       |
|                                                                   |
| $$\left( \begin{array}{r}                                         |
| n \\                                                              |
| 0                                                                 |
| \end{array} \right)^{2} + \left( \begin{array}{r}                 |
| n \\                                                              |
| 1                                                                 |
| \end{array} \right)^{2} + \left( \begin{array}{r}                 |
| n \\                                                              |
| 2                                                                 |
| \end{array} \right)^{2}\ldots + \left( \begin{array}{r}           |
| n \\                                                              |
| n                                                                 |
| \end{array} \right)^{2} = \left( \begin{array}{r}                 |
| 2n \\                                                             |
| n                                                                 |
| \end{array} \right)$$                                             |
+-------------------------------------------------------------------+

Foundation

1.  Consider the expansion for

$$(1\  + \ x)⁴\  = \ ⁴C₀\  + \ ⁴C₁x\  + \ ⁴C₂x²\  + \ ⁴C₃x³\  + \ ⁴C₄x⁴\ \ \ \ \ \ (*)$$

> Use it to prove the following results and interpret the result in
> terms of the row 1 4 6 4 1 on Pascal's triangle.

a.  By substituting $x\  = \ 1$, show that
    $⁴C₀\  + \ ⁴C₁\  + \ ⁴C₂\  + \ ⁴C₃\  + \ ⁴C₄\  = \ 2⁴.$

(1 + 1)⁴ = ⁴C₀ + ⁴C₁ + ⁴C₂ + ⁴C₃ + ⁴C₄

2⁴ = ⁴C₀ + ⁴C₁ + ⁴C₂ + ⁴C₃ + ⁴C₄

This is the sum of all entries in row 1 4 6 4 1.

b.  By substituting $x\  = \  - 1$, show that
    $⁴C₀\  + \ ⁴C₂\  + \ ⁴C₄\  = \ ⁴C₁\  + \ ⁴C₃.$

(1 - 1)⁴ = ⁴C₀ - ⁴C₁ + ⁴C₂ - ⁴C₃ + ⁴C₄

0 = ⁴C₀ - ⁴C₁ + ⁴C₂ - ⁴C₃ + ⁴C₄

Therefore, ⁴C₀ + ⁴C₂ + ⁴C₄ = ⁴C₁ + ⁴C₃

Alternating sum equals zero, so sum of even-positioned entries equals
sum of odd-positioned entries.

c.  Hence, by using the result of part **a** and **b**, show that ⁴C₀ +
    ⁴C₂ + ⁴C₄ = 2³.

From **a:** ⁴C₀ + ⁴C₁ + ⁴C₂ + ⁴C₃ + ⁴C₄ = 2⁴

From **b:** ⁴C₀ + ⁴C₂ + ⁴C₄ = ⁴C₁ + ⁴C₃

Substituting **b** into **a**:

Therefore 2(⁴C₀ + ⁴C₂ + ⁴C₄) = 2⁴

So ⁴C₀ + ⁴C₂ + ⁴C₄ = 2³

The sum of the even positioned terms of the row is half the sum of the
whole row.

2.  $(1\  + \ x)ⁿ\  = \ ⁿC₀\  + \ ⁿC₁x\  + \ ...\  + \ ⁿCₙxⁿ\ (*)$ for
    $n \geq 1$

Use it to prove the following results and interpret the result in terms
of a general row $n$ in Pascal's triangle.

a.  By substituting $x\  = \ 1$, show that
    $ⁿC₀\  + \ ⁿC₁\  + \ ...\  + \ ⁿCₙ\  = \ 2ⁿ.$

$$(1\  + \ 1)ⁿ\  = \ ⁿC₀\  + \ ⁿC₁\  + \ ...\  + \ ⁿCₙ$$

$$2ⁿ\  = \ ⁿC₀\  + \ ⁿC₁\  + \ ...\  + \ ⁿCₙ$$

Sum of row $n$ in Pascal\'s triangle is $2^{n}$

b.  By substituting $x\  = \  - 1$, show that
    $ⁿC₀\  + \ ⁿC₂\  + \ ⁿC₄\  + \ ...\  = \ ⁿC₁\  + \ ⁿC₃\  + \ ⁿC₅\  + \ ...$

$$(1\  - \ 1)ⁿ\  = \ ⁿC₀\  - \ ⁿC₁\  + \ ⁿC₂\  - \ ⁿC₃\  + \ ...$$

$$0\  = \ ⁿC₀\  - \ ⁿC₁\  + \ ⁿC₂\  - \ ⁿC₃\  + \ ...$$

Therefore, ⁿC₀ + ⁿC₂ + ⁿC₄ + \... = ⁿC₁ + ⁿC₃ + ⁿC₅ + \...

The sum of the even position terms is equal to the sum of the odd
position terms

c.  Hence, by using the result of parts **a** and **b**, show that
    $ⁿC₀\  + \ ⁿC₂\  + \ ⁿC₄\  + \ ...\  = \ 2ⁿ⁻¹.$

$$ⁿC₀\  + \ ⁿC₁\  + \ ...\  + \ ⁿCₙ\  = \ 2ⁿ$$

$$ⁿC₀\  + \ ⁿC₂\  + \ ⁿC₄\  + \ ...\  = \ ⁿC₁\  + \ ⁿC₃\  + \ ⁿC₅\  + \ ...$$

Therefore $2(ⁿC₀\  + \ ⁿC₂\  + \ ⁿC₄\  + \ ...)\  = \ 2ⁿ$

So $ⁿC₀\  + \ ⁿC₂\  + \ ⁿC₄\  + \ ...\  = \ 2ⁿ⁻¹$

The sum of the even positioned terms of the row is half the sum of t

3.  Consider the expansion:
    $(1\  + \ x)²ⁿ\  = \ ²ⁿC₀\  + \ ²ⁿC₁x\  + \ ...\  + \ ²ⁿC₂ₙx²ⁿ\ (*)$

    a.  Show that $²ⁿC₀\  + \ ²ⁿC₁\  + \ ...\  + \ ²ⁿC₂ₙ\  = \ 2²ⁿ.$

Substitute x = 1 into (\*):

$$(1\  + \ 1)²ⁿ\  = \ ²ⁿC₀\  + \ ²ⁿC₁\  + \ ...\  + \ ²ⁿC₂ₙ$$

$$2²ⁿ\  = \ ²ⁿC₀\  + \ ²ⁿC₁\  + \ ...\  + \ ²ⁿC₂ₙ$$

b.  Show that
    $²ⁿC₁\  + \ ²ⁿC₃\  + \ ²ⁿC₅\  + \ ...\  + \ ²ⁿC₂ₙ₋₁\  = \ 2²ⁿ⁻¹.$

Substitute $x\  = \  - 1\ into\ (*):$

$$0\  = \ ²ⁿC₀\  - \ ²ⁿC₁\  + \ ²ⁿC₂\  - \ ...\  + \ ²ⁿC₂ₙ$$

Therefore,
$²ⁿC₁\  + \ ²ⁿC₃\  + \ ²ⁿC₅\  + \ ...\  + \ ²ⁿC₂ₙ₋₁\  = \ ²ⁿC₀\  + \ ²ⁿC₂\  + \ ...\  + \ ²ⁿC₂ₙ$

From **a**, their sum is $2²ⁿ$, so each equals side is half, $2²ⁿ⁻¹.$

Development

4.  $S\  = \ \{ A,\ B,\ C,\ D,\ E\}$

    a.  List all the subsets of $\{ A,\ B,\ C,\ D,\ E\}$ containing 2
        letters.

{A, B}, {A, C}, {A, D}, {A, E}, {B, C}, {B, D}, {B, E}, {C, D}, {C, E},
{D, E}

10 subsets in total.

b.  List all the subsets of $\{ A,\ B,\ C,\ D,\ E\}$ containing 3
    letters.

{A, B, C}, {A, B, D}, {A, B, E}, {A, C, D}, {A, C, E}, {A, D, E}, {B, C,
D}, {B, C, E}, {B, D, E}, {C, D, E}

10 subsets in total.

c.  Consider the subset $\{ A,\ B\}$. What letters have been omitted
    from the subset?

C, D, E have been omitted.

d.  Use the definition of $ⁿCᵣ$ to explain why $⁵C₂\  = \ ⁵C₃$.

⁵C₂ = number of ways to choose 2 letters from 5

⁵C₃ = number of ways to choose 3 letters from 5

Choosing 2 letters to include is equivalent to choosing 3 letters to
exclude.

Each 2-letter subset corresponds to exactly one 3-letter subset (its
complement), e.g. {A B C} $\equiv$ $\{ D,\ E\}$

Therefore, ⁵C₂ = ⁵C₃.

e.  Explain why $ⁿCᵣ\  = \ ⁿCₙ₋ᵣ$ for any whole numbers $n$ and $r$ with
    $r\  \leq \ n$.

from a total of $n$ elements, choosing $r$ items to include is
equivalent to choosing $(n\  - \ r)$ items to exclude.

Each $r$-member subset corresponds to exactly one $(n\  - \ r)$-member
subset (its complement).

Therefore $ⁿCᵣ\  = \ ⁿCₙ₋ᵣ.$

5.  $S\  = \ \{ A,\ B,\ C,\ D\}$

    a.  Write down all the subsets of $S$, then explain why there are
        exactly $2⁴$ of them.

0-letter subsets: {}

1-letter subsets: {A}, {B}, {C}, {D}

2-letter subsets: {A, B}, {A, C}, {A, D}, {B, C}, {B, D}, {C, D}

3-letter subsets: {A, B, C}, {A, B, D}, {A, C, D}, {B, C, D}

4-letter subsets: {A, B, C, D}

Total: 1 + 4 + 6 + 4 + 1 = 16 = 2⁴

For each element, there are 2 choices: include it or exclude it.

Since there are 4 elements and choices are independent:
$2\  \times \ 2\  \times \ 2\  \times \ 2\  = \ 2⁴\$subsets.

b.  Hence explain why $\left( \begin{array}{r}
    4 \\
    0
    \end{array} \right) + \left( \begin{array}{r}
    4 \\
    1
    \end{array} \right) + \left( \begin{array}{r}
    4 \\
    2
    \end{array} \right) + \left( \begin{array}{r}
    4 \\
    3
    \end{array} \right) + \left( \begin{array}{r}
    4 \\
    4
    \end{array} \right) = \ 2⁴.$

(⁴₀) counts 0-letter subsets (1 subset)

(⁴₁) counts 1-letter subsets (4 subsets)

(⁴₂) counts 2-letter subsets (6 subsets)

(⁴₃) counts 3-letter subsets (4 subsets)

(⁴₄) counts 4-letter subsets (1 subset)

These cases make up all possible subsets, so their sum equals the total
number of subsets = 2⁴.

c.  Explain why $\left( \begin{array}{r}
    n \\
    0
    \end{array} \right) + \left( \begin{array}{r}
    n \\
    1
    \end{array} \right) + \left( \begin{array}{r}
    n \\
    2
    \end{array} \right) + \left( \begin{array}{r}
    n \\
    3
    \end{array} \right) + \left( \begin{array}{r}
    n \\
    4
    \end{array} \right))\  = \ 2ⁿ$, for any whole number $n$.

For an $n$-element set, each element has 2 choices (include or exclude),
giving $2ⁿ\$total subsets.

(ⁿ₀) counts subsets with 0 elements

(ⁿ₁) counts subsets with 1 element

\...

(ⁿₙ) counts subsets with n elements

These cases make up all possible subsets, so (ⁿ₀) + (ⁿ₁) + \... + (ⁿₙ) =
2ⁿ.

6.  $S\  = \ \{ A,\ B,\ C,\ D,\ E\}$ and $U\  = \ \{ A,\ B,\ C,\ D\}$

    a.  Write down all the 3-letter subsets of S that do not contain
        $E$.

{A, B, C}, {A, B, D}, {A, C, D}, {B, C, D}

b.  Explain why this is a list of all the 3-letter subsets of $U$.

$U$ is a subset of $S$ that doesn't contain $E$.

Since $E$ is not in $U$, all 3-letter subsets of $U$ automatically do
not contain $E$.

c.  Write down all the 3-letter subsets of S that contain $E$.

{A, B, E}, {A, C, E}, {A, D, E}, {B, C, E}, {B, D, E}, {C, D, E}

d.  Explain how to pair them up with all the 2-letter subsets of $U$.

Each 3-letter subset containing E has the form {X, Y, E} where {X, Y} is
a 2-letter subset of U.

Remove E from each 3-letter subset to get the corresponding 2-letter
subset of U:

{A, B, E} ↔ {A, B}

{A, C, E} ↔ {A, C}

{A, D, E} ↔ {A, D}

{B, C, E} ↔ {B, C}

{B, D, E} ↔ {B, D}

{C, D, E} ↔ {C, D}

e.  Hence explain why $⁴C₂\  + \ ⁴C₃\  = \ ⁵C₃.$

⁵C₃ = number of 3-letter subsets of S

These split into two categories:

Those not containing E: these are exactly the 3-letter subsets of U,
counted by ⁴C₃

Those containing E: these correspond to 2-letter subsets of U, counted
by ⁴C₂

Therefore, ⁴C₂ + ⁴C₃ = ⁵C₃.

f.  Explain why $ⁿCᵣ₋₁\  + \ ⁿCᵣ\  = \ ⁿ⁺¹Cᵣ$ for any whole numbers $n$
    and $r$ with $1\  \leq \ r\  \leq \ n$.

$ⁿ⁺¹Cᵣ\  =$ number of r-member subsets of an $(n\  + \ 1)$-element set

Label one element as \"X\"

This splits the cases into two disjoint categories:

$r$-member subsets not containing $X$: these are $r$-member subsets of
the remaining $n$ elements, counted by $ⁿCᵣ$

$r$-member subsets containing $X$: remove $X$ to get
$(r\  - \ 1)$-member subsets of the remaining $n$ elements, counted by
$ⁿCᵣ₋₁$

Therefore $ⁿCᵣ₋₁\  + \ ⁿCᵣ\  = \ ⁿ⁺¹Cᵣ.$

# Exam Questions

1.  **2021 HSC Extension 1 Band 3**

> Expand and simplify $(2a - b)^{4}$

$$= \ 16a⁴\  + \ 4(8a³)( - b)\  + \ 6(4a²)(b²)\  + \ 4(2a)( - b³)\  + \ b^{4}$$

$$= \ 16a⁴\  - \ 32a³b\  + \ 24a²b²\  - \ 8ab³\  + \ b^{4}$$

2.  **2017 HSC Extension 1 Band 4**

![](media/The Binomial Theorem/media/image1.png){width="1.3622047244094488in"
height="2.0723589238845146in"} When expanded, which expression has a
non-zero constant term?

Option A:

$$\ ^{7}C_{k} \cdot \ x^{7 - k} \cdot \ x^{- 2k} = {_{\ }^{7}C}_{k} \cdot \ x^{7 - 3k}$$

Constant when 7-3k = 0

k = 7/3 (not integer, no constant term)

Option B:

$$\ ^{7}C_{k} \cdot \ x^{2(7 - k)} \cdot \ x^{- 3k} = {_{\ }^{7}C}_{k} \cdot \ x^{14 - 5k}$$

Constant when 14-5k = 0

k = 14/5 (not integer, no constant term)

Option C:

$$\ ^{7}C_{k} \cdot \ x^{3(7 - k)} \cdot \ x^{- 4k} = {_{\ }^{7}C}_{k} \cdot \ x^{21 - 7k}$$

Constant when $21 - 7k\  = \ 0,\ k\  = \ 3$

Constant term $= \ ⁷C₃\  = \ 35$

Answer: C

3.  **2016 HSC Extension 2 Band 4**

Let $p(x)\  = \ 1\  + \ x\  + \ x²\  + \ x³\  + \ ...\  + \ x¹²$.

What is the coefficient of $x⁸$ in the expansion of $p(x\  + \ 1)$?

$$p(x\  + \ 1)\  = \ 1\  + \ (x\  + \ 1)\  + \ (x\  + \ 1)²\  + \ ...\  + \ (x\  + \ 1)¹²$$

Coefficient of $x⁸$ comes from terms where $(x\  + \ 1)^{n}$ contributes
$x⁸$

From $(x\  + \ 1)^{n}$, coefficient of $x⁸$ is $\ \ ^{n}C₈$

Need $n \geq \ 8,\ so\ n\  = \ 8,\ 9,\ 10,\ 11,\ 12$

Coefficient of $x⁸\  = \ ⁸C₈\  + \ ⁹C₈\  + \ ¹⁰C₈\  + \ ¹¹C₈\  + \ ¹²C₈$

$$= \ 1\  + \ 9\  + \ 45\  + \ 165\  + \ 495$$

$$= \ 715$$

4.  **2019 HSC Extension 1 Band 4**

> In the expansion of $(5x\  + \ 2)²⁰,$ the coefficients of $xʳ$
> and$\ xʳ⁺¹$ are equal.\
> What is the value of $r$?

$r$^th^
term:$\ ^{20}C_{r} \cdot \ 2^{20 - r} \cdot \ (5x)^{r} = \ ^{20}C_{r} \cdot \ 2^{20 - r} \cdot \ 5^{r} \cdot \ x^{r}$

$r + 1$^th^ term
$\ ^{20}C_{r + 1} \cdot \ 2^{19 - r} \cdot \ 5^{r + 1} \cdot \ x^{r + 1}$

Equating coefficients:

$$\ ^{20}C_{r} \cdot \ 2^{20 - r} \cdot \ 5^{r} = {_{\ }^{20}C}_{r + 1} \cdot \ 2^{19 - r} \cdot \ 5^{r + 1}$$

$$\frac{20!}{r!(20 - r)!} \cdot \ 2^{20 - r} \cdot \ 5^{r} = \frac{20!}{(r + 1)!(19 - r)!} \cdot \ 2^{19 - r} \cdot \ 5^{r + 1}$$

$$\frac{2}{20 - r} = \frac{5}{r + 1}$$

$$2(r + 1)\  = \ 5(20 - r)$$

$$2r\  + \ 2\  = \ 100\  - \ 5r$$

$$7r\  = \ 98$$

$$r\  = \ 14$$

5.  **2022 HSC Extension 1 Band 4**

> Find the coefficients of $x²$ and $x³$ in the expansion of
> $\left( 1\  - \frac{x}{2} \right)^{8}$

$$\ ^{8}C_{k} \cdot \ (1)^{8 - k} \cdot \ \left( - \frac{x}{2} \right)^{k} = {_{\ }^{8}C}_{k} \cdot \ \left( - \frac{1}{2} \right)^{k} \cdot \ x^{k}$$

Coefficient of $x²\ (k\  = \ 2)$:

$$\ ^{8}C_{2} \cdot \ \left( - \frac{1}{2} \right)^{2} = \ 7$$

Coefficient of x³ (k = 3):

$$\ ^{8}C_{3} \cdot \ \left( - \frac{1}{2} \right)^{3} = \  - 7$$

6.  **2023 HSC Extension 1 Band 4**

> It is known that $ⁿCᵣ\  = \ ⁿ⁻¹Cᵣ₋₁\  + \ ⁿ⁻¹Cᵣ$ for all integers such
> that $1\  \leq \ r\  \leq \ n\  - \ 1.$
>
> (Do NOT prove this.)\
> Find ONE possible set of values for $p$ and $q$ such that
> $²⁰²²C₈₀\  + \ ²⁰²²C₈₁\  + \ ²⁰²³C₁₉₄₃\  = \ \ ^{p}C_{q}$

Using $ⁿCᵣ\  = \ ⁿ⁻¹Cᵣ₋₁\  + \ ⁿ⁻¹Cᵣ:$

$$²⁰²²C₈₀\  + \ ²⁰²²C₈₁\  = \ ²⁰²³C₈₁\ ...\ (1)$$

Using $ⁿCᵣ\  = \ ⁿCₙ₋ᵣ:$

$$²⁰²³C₁₉₄₃\  = \ \ ²⁰²³C₈₀\ ...\ (2)$$

From (1) and (2):

$$²⁰²²C₈₀\  + \ ²⁰²²C₈₁\  + \ ²⁰²³C₁₉₄₃ = \ ²⁰²³C₈₁\  + \ ²⁰²³C₈₀$$

Using $ⁿ⁻¹Cᵣ₋₁\  + \ ⁿ⁻¹Cᵣ\  = \ ⁿCᵣ:$

$$²⁰²³C₈₀\  + \ ²⁰²³C₈₁\  = \ ²⁰²⁴C₈₁$$

$$p\  = \ 2024,\ q\  = \ 81$$

7.  **HSC Extension 1 Sample Question Band 4**

Find the coefficient of $x⁴$ in the expansion of
$\left( x^{2} - \frac{3}{x} \right)^{5}$

$$\ ^{5}C_{k}\  \cdot \ \left( x^{2} \right)^{5 - k}\  \cdot \ \left( - \frac{3}{x} \right)^{k}$$

$$= {_{\ }^{5}C}_{k}\  \cdot \ x^{10 - 2k}\  \cdot \ ( - 3)^{k}\  \cdot \ x^{- k}$$

$$= {_{\ }^{5}C}_{k} \cdot \ x^{10 - 3k} \cdot \ ( - 3)^{k}$$

x⁴ occurs when:

$$10\  - \ 3k\  = \ 4$$

$$k\  = \ 2$$

$$⁵C₂\  \cdot \ ( - 3)²\  = \ 90$$

8.  **HSC Extension 1 Sample Question Band 4**

> By using the fact that $(1\  + \ x)¹¹\  = \ (1\  + \ x)³(1\  + \ x)⁸,$
> show that:
>
> $$\left( \begin{array}{r}
> 11 \\
> 5
> \end{array} \right) = \left( \begin{array}{r}
> 8 \\
> 5
> \end{array} \right) + \left( \begin{array}{r}
> 3 \\
> 1
> \end{array} \right)\left( \begin{array}{r}
> 8 \\
> 4
> \end{array} \right) + \left( \begin{array}{r}
> 3 \\
> 2
> \end{array} \right)\left( \begin{array}{r}
> 8 \\
> 3
> \end{array} \right) + \left( \begin{array}{r}
> 8 \\
> 2
> \end{array} \right)$$

General term of $(1\  + \ x)¹¹$:

$$\ ^{11}C_{k} \cdot \ x^{k}$$

$\therefore\ ¹¹C₅$ is the coefficient of $x⁵$

$$(1\  + \ x)³\  = \ ³C₀\  + \ ³C₁x\  + \ ³C₂x²\  + \ ³C₃x³$$

$$(1\  + \ x)⁸\  = \ ⁸C₀\  + \ ⁸C₁x\  + \ ⁸C₂x²\  + \ ⁸C₃x³\  + \ ⁸C₄x⁴\  + \ ⁸C₅x⁵\  + \ ...$$

Coefficient of $x⁵$ in $(1\  + \ x)³(1\  + \ x)⁸$ occurs when sum of
indices = 5

$$= \ ³C₀ \cdot ⁸C₅\  + \ ³C₁ \cdot ⁸C₄\  + \ ³C₂ \cdot ⁸C₃\  + \ ³C₃ \cdot ⁸C₂$$

$$= \ ⁸C₅\  + \ ³C₁ \cdot ⁸C₄\  + \ ³C₂ \cdot ⁸C₃\  + \ ⁸C₂$$

Equating coefficients:

¹¹C₅ = ⁸C₅ + ³C₁·⁸C₄ + ³C₂·⁸C₃ + ⁸C

9.  **HSC Extension 1 Sample Question Band 5**

> Using $(1\  + \ x)⁴(1\  + \ x)⁹\  = \ (1\  + \ x)¹³$, show that
>
> $$⁹C₄\  + \ ⁴C₁ \cdot ⁹C₃\  + \ ⁴C₂ \cdot ⁹C₂\  + \ ⁴C₃ \cdot ⁹C₁\  + \ 1\  = \ ¹³C₄$$

General term of$\ (\mathbf{1}\  + \ \mathbf{x})¹³:$

$$\ ^{13}C_{k} \cdot \ x^{k}$$

$\therefore\ ¹³C₄\ i$s coefficient of$\ x⁴$

$$(1\  + \ x)⁴\  = \ ⁴C₀\  + \ ⁴C₁x\  + \ ⁴C₂x²\  + \ ⁴C₃x³\  + \ ⁴C₄x⁴$$

$$(1\  + \ x)⁹\  = \ ⁹C₀\  + \ ⁹C₁x\  + \ ⁹C₂x²\  + \ ⁹C₃x³\  + \ ⁹C₄x⁴\  + \ ...$$

Coefficient of$\ x⁴\$in$\ (1\  + \ x)^{4}(1\  + \ x)^{9}$ when sum of
indices = 4

$$= \ ⁴C₀ \cdot ⁹C₄\  + \ ⁴C₁ \cdot ⁹C₃\  + \ ⁴C₂ \cdot ⁹C₂\  + \ ⁴C₃ \cdot ⁹C₁\  + \ ⁴C₄ \cdot ⁹C₀$$

$$= \ ⁹C₄\  + \ ⁴C₁ \cdot ⁹C₃\  + \ ⁴C₂ \cdot ⁹C₂\  + \ ⁴C₃ \cdot ⁹C₁\  + \ 1$$

Equating coefficients:

$$⁹C₄\  + \ ⁴C₁ \cdot ⁹C₃\  + \ ⁴C₂ \cdot ⁹C₂\  + \ ⁴C₃ \cdot ⁹C₁\  + \ 1\  = \ ¹³C₄$$

10. **2012 HSC Extension 1 Band 6**

    a.  Use the binomial theorem to find an expression for the constant
        term in the expansion of

> $$\left( 2x^{3} - \frac{1}{x} \right)^{12}$$

General term:

$$\ ^{2}C_{k} \cdot \ \left( 2x^{3} \right)^{12 - k} \cdot \ \left( - \frac{1}{x} \right)^{k}$$

$$= {_{\ }^{12}C}_{k} \cdot \ ( - 1)^{k} \cdot \ 2^{12 - k} \cdot \ x^{36 - 3k} \cdot \ x^{- k}$$

$$= {_{\ }^{12}C}_{k} \cdot \ ( - 1)^{k} \cdot \ 2^{12 - k} \cdot \ x^{36 - 4k}$$

Constant term when $36\  - \ 4k\  = \ 0$

$$k\  = \ 9$$

Constant term: $¹²C₉\  \cdot \ ( - 1)⁹\  \cdot \ 2³$

$$= \  - 1760$$

b.  For what values of $n$ does
    $\left( 2x^{3} - \frac{1}{x} \right)^{n}$ have a non-zero constant
    term?

General term:
$ⁿC_{k} \cdot \ ( - 1)^{k} \cdot \ 2^{n - k} \cdot \ x^{3n - 4k}$

Constant term when $3n\  - \ 4k\  = \ 0$

$$k\  = \frac{3n}{4}$$

Since $n$ and $k$ must be integers, $n$ must be a multiple of 4

11. **2020 HSC Extension 1 Band 6**

    a.  Use the identity $(1\  + \ x)²ⁿ\  = \ (1\  + \ x)ⁿ(1\  + \ x)ⁿ$
        to show that

$$²ⁿCₙ\  = \ (ⁿC₀)²\  + \ (ⁿC₁)²\  + \ ...\  + \ (ⁿCₙ)²$$

where $n$ is a positive integer.

Coefficient of $xⁿ$ in $(1\  + \ x)²ⁿ\  = \ ²ⁿCₙ$

Coefficient of $xⁿ$ in $(1\  + \ x)ⁿ(1\  + \ x)ⁿ:$

$$= \ ⁿC₀ \cdot ⁿCₙ\  + \ ⁿC₁ \cdot ⁿCₙ₋₁\  + \ ...\  + \ ⁿCₙ \cdot ⁿC₀$$

$$= \ (ⁿC₀)²\  + \ (ⁿC₁)²\  + \ ...\  + \ (ⁿCₙ)²\ (using\ ⁿCᵣ\  = \ ⁿCₙ₋ᵣ)$$

Equating coefficients:

$$²ⁿCₙ\  = \ (ⁿC₀)²\  + \ (ⁿC₁)²\  + \ ...\  + \ (ⁿCₙ)²$$

b.  A club has $2n$ members, with $n$ women and $n$ men. A group
    consisting of an even number $(0,\ 2,\ 4,\ ...,\ 2n)$ of members is
    chosen, with the number of men equal to the number of women.

> Show, giving reasons, that the number of ways to do this is $²ⁿCₙ.$

Number of men equal to number of women, so the club can have group sizes
of each gender 0 up to $n$

Ways to choose group of 0
men/women$\ :\ ⁿC₀\  \times \ ⁿC₀\  = \ (ⁿC₀)²$

Ways to choose group of 1 man/woman$:\ ⁿC₁\  \times \ ⁿC₁\  = \ (ⁿC₁)²$

...

Ways to choose group of $n$
men/women$:\ ⁿCₙ\  \times \ ⁿCₙ\  = \ (ⁿCₙ)²$

Total = $(ⁿC₀)²\  + \ (ⁿC₁)²\  + \ ...\  + \ (ⁿCₙ)²\  = \ ²ⁿCₙ\$

c.  From the group chosen in part **b**, one of the men and one of the
    women are selected as leaders.

> Show, giving reasons, that the number of ways to choose the even
> number of people and then the leaders is

$$1²(ⁿC₁)²\  + \ 2²(ⁿC₂)²\  + \ ...\  + \ n²(ⁿCₙ)²$$

For each group of $k$ men/women, choose a leader in $\ ^{k}C_{1} = k$
ways

0: can't choose a leader.

$$\ 1:\ ⁿC₁\  \times \ 1\  \times \ ⁿC₁\  \times \ 1\  = \ 1²(ⁿC₁)²$$

$$\ 2:\ ⁿC₂\  \times \ 2\  \times \ ⁿC₂\  \times \ 2\  = \ 2²(ⁿC₂)²$$

...

$$\ n:\ ⁿCₙ\  \times \ n\  \times \ ⁿCₙ\  \times \ n\  = \ n²(ⁿCₙ)²$$

Therefore, sum of all ways in all possible group sizes is

$$1²(ⁿC₁)²\  + \ 2²(ⁿC₂)²\  + \ ...\  + \ n²(ⁿCₙ)²$$

d.  The process is now reversed so that the leaders, one man and one
    woman, are chosen first. The rest of the group is then selected,
    still made up of an equal number of women and men.

> By considering this reversed process and using part **b** find a
> simple expression for the sum in part **c**.

For each group of $k$ men/women, choose a leader of each gender first
$\ ^{n}C_{1} = n$, then choose other members of each
gender$\ ^{n - 1}C_{k - 1}$ ways.

$$1:\ \ n\  \times \ n \times \ ⁿ⁻¹C₀\ \  \times \ ⁿ⁻¹C₀\  = \ n²(ⁿ⁻¹C₀)²$$

$$\ 2:\ \ n\  \times \ n\  \times \ ⁿ⁻¹C₁\  \times \ ⁿ⁻¹C₁\  = \ n²(ⁿ⁻¹C₁)²$$

...

$$\ n:\ \ n\  \times \ n \times \ ⁿ⁻¹Cₙ₋₁\ \  \times \ ⁿ⁻¹Cₙ₋₁\  = \ n²(ⁿ⁻¹Cₙ₋₁)²$$

Therefore, sum of all ways in all possible group sizes is

$$n^{2}\left( ⁿ^{- 1}C_{0} \right)^{2} + n^{2}\left( ⁿ^{- 1}C_{1} \right)^{2} + \ldots + n²(ⁿ⁻¹Cₙ₋₁)²$$

$$= n^{2}\left\lbrack \left( ⁿ^{- 1}C_{0} \right)^{2} + \left( ⁿ^{- 1}C_{1} \right)^{2} + \ldots + \left( ⁿ^{- 1}C_{n - 1} \right)^{2} \right\rbrack$$

Using $(ⁿC₀)²\  + \ (ⁿC₁)²\  + \ \ldots\  + \ (ⁿCₙ)²\  = \ ²ⁿCₙ\$

$$n^{2}\left\lbrack \left( ⁿ^{- 1}C_{0} \right)^{2} + \left( ⁿ^{- 1}C_{1} \right)^{2} + \ldots + \left( ⁿ^{- 1}C_{n - 1} \right)^{2} \right\rbrack = n^{2} \times \ ^{2(n - 1)}C_{n - 1}\ $$

$$= n^{2} \times \ ^{2n - 2}C_{n - 1}\ $$

Since this counts the same thing as part **c,**

$$1²(ⁿC₁)²\  + \ 2²(ⁿC₂)²\  + \ ...\  + \ n²(ⁿCₙ)² = n^{2} \times \ ^{2n - 2}C_{n - 1}\ $$

# Challenge Exercise

1.  a.  In the expansion of $(2\  + \ 3x)^{n}$, the coefficients of $x⁵$
        and $x⁶$ are in the ratio 4 : 9.\
        Find the value of $n$.

Coefficient of x⁵: ⁿC₅ 2ⁿ⁻⁵ 3⁵

Coefficient of x⁶: ⁿC₆ 2ⁿ⁻⁶ 3⁶

Ratio: (ⁿC₅ 2ⁿ⁻⁵ 3⁵)/(ⁿC₆ 2ⁿ⁻⁶ 3⁶) = 4/9

(ⁿC₅/ⁿC₆)(2/3) = 4/9

((n−5)/(6))(2/3) = 4/9

(n−5)/9 = 2/3, so n = 14

b.  In the expansion of
    $\left( x\  + \frac{1}{x} \right)^{40}\left( x\  - \frac{1}{x} \right)^{40}$,
    find the term independent of $x$.\
    Give your answer in the form $ⁿCᵣ,$ and also correct to four
    significant figures.

The expansion is equivalent to
$\left( x^{2} - \frac{1}{x^{2}} \right)^{40}$

General term:
$\ ^{40}C_{r}\left( x^{2} \right)^{r}\left( x^{- 2} \right)^{40 - r}$

$$= \ ^{40}C_{r}x^{4r - 80}$$

For $x^{0},\ 4r - 80 = 0$ so $r = 20$

⁴⁰C₂₀ = 1.378 × 10¹¹

2.  a.  Use the binomial theorem to show that $7ⁿ\  + \ 2$ is divisible
        by 3,\
        where $n$ is a positive integer. (Hint: Write 7 = 6 + 1.)

$$\ 7ⁿ\  = \ (6\  + \ 1)ⁿ\  = \ 6ⁿ\  + \ ⁿC₁\ 6ⁿ⁻¹\  + \ ...\  + \ ⁿCₙ₋₁\ 6\  + \ 1$$

$$7ⁿ\  + \ 2\  = \ 6ⁿ\  + \ ⁿC₁\ 6ⁿ⁻¹\  + \ ...\  + \ ⁿCₙ₋₁\ 6\  + \ 3$$

$$= \ 3(2 \cdot 6ⁿ⁻¹\  + \ n \cdot 6ⁿ⁻²\  + \ ...\  + \ 2n\  + \ 1)$$

divisible by 3

b.  Use the binomial theorem to show that $5ⁿ\  + \ 3$ is divisible by
    4,\
    where $n$ is a positive integer.

$$5ⁿ\  = \ (4\  + \ 1)ⁿ\  = \ 4ⁿ\  + \ ⁿC₁\ 4ⁿ⁻¹\  + \ ...\  + \ ⁿCₙ₋₁\ 4\  + \ 1$$

$$5ⁿ\  + \ 3\  = \ 4ⁿ\  + \ ⁿC₁\ 4ⁿ⁻¹\  + \ ...\  + \ 4n\  + \ 4$$

$= \ 4(4ⁿ⁻¹\  + \ n \cdot 4ⁿ⁻²\  + \ ...\  + \ n\  + \ 1),$

divisible by 4

3.  a.  Expand and simplify $(x\  + \ y)⁶\  + \ (x\  - \ y)⁶.$

$$(x\  + \ y)⁶\  = \ x⁶\  + \ 6x⁵y\  + \ 15x⁴y²\  + \ 20x³y³\  + \ 15x²y⁴\  + \ 6xy⁵\  + \ y⁶$$

$$(x\  - \ y)⁶\  = \ x⁶\  - \ 6x⁵y\  + \ 15x⁴y²\  - \ 20x³y³\  + \ 15x²y⁴\  - \ 6xy⁵\  + \ y⁶$$

$$(x\  + \ y)⁶\  + \ (x\  - \ y)⁶\  = \ 2x⁶\  + \ 30x⁴y²\  + \ 30x²y⁴\  + \ 2y⁶$$

b.  Hence (and without a calculator) prove that

$$5⁶\  + \ 5⁵\  \times \ 3³\  + \ 5³\  \times \ 3⁵\  + \ 3⁶\  = \ 2⁵(2¹²\  + \ 1)$$

Let $x\  = \ 5$, $y\  = \ 3$

$$(5\  + \ 3)⁶\  + \ (5\  - \ 3)⁶\  = \ 2(5⁶)\  + \ 30(5⁴)(3²)\  + \ 30(5²)(3⁴)\  + \ 2(3⁶)$$

$$8⁶\  + \ 2⁶\  = \ 2(5⁶)\  + \ 30(5⁴)(9)\  + \ 30(25)(81)\  + \ 2(3⁶)$$

$$2⁶(2¹²\  + \ 1)\  = \ 2(5⁶\  + \ 5⁵(3³)\  + \ 5³(3⁵)\  + \ 3⁶)$$

$$\therefore\ 5⁶\  + \ 5⁵(3³)\  + \ 5³(3⁵)\  + \ 3⁶\  = \ 2⁵(2¹²\  + \ 1)$$

4.  Find the coefficients of $x$ and $x⁻³$ in the expansion of
    $\left( 3x\  - \frac{a}{x} \right)^{5}$.\
    Hence find the values of $a$ if these coefficients are in the ratio
    2 : 1.

$$rᵗʰ\ term:_{\ }^{5}Cᵣ\ (3x)^{5 -}ʳ\ \left( - \frac{a}{x} \right)ʳ\  = \ ⁵Cᵣ\ 3⁵⁻ʳ\ ( - a)ʳ\ x⁵⁻²ʳ$$

For $x$, let
$5\  - \ 2r\  = \ 1,\ \ \ r\  = \ 2:\ \ \ ⁵C₂\ 3³\ ( - a)²\  = \ 270a²$

For $x⁻³$, let
$5\  - \ 2r\  = \  - 3,\ \ \ r\  = \ 4:\ \ \ ⁵C₄\ 3\ ( - a)⁴\  = \ 15a⁴$

$$\frac{270a^{2}}{15a^{4}} = \frac{2}{1}$$

$$a^{2} = \ 9,\ a\  = \  \pm 3$$

5.  The coefficients of the terms in $a³$ and $a⁻³$ in the expansion of
    $\left( ma\  + \frac{n}{a^{2}} \right)^{6}$ are equal,\
    where $m$ and $n$ are non-zero real numbers.\
    Prove that $m²\ :\ n²\  = \ 10:3$.

$rᵗʰ$
term:$_{\ }^{6}Cᵣ\ (ma)^{6 -}ʳ\ \left( \frac{n}{a^{2}} \right)ʳ\  = \ ⁶Cᵣ\ m⁶⁻ʳ\ nʳ\ a⁶⁻³ʳ$

For $a³$, let $6\  - \ 3r\  = \ 3,$ so $r\  = \ 1:\ ⁶C₁\ m⁵n$

For $a⁻³$, let $6\  - \ 3r\  = \  - 3$, so $r\  = \ 3:\ ⁶C₃\ m³n³$

Equal: $⁶C₁\ m⁵n\  = \ ⁶C₃\ m³n³$

$$6m⁵n\  = \ 20m³n³$$

$$3m²\  = \ 10n²$$

$$\frac{m^{2}}{n^{2}} = \frac{10}{3}$$

6.  **The Hockey Stick Identity**

> Start at the top 1 of any column of Pascal's triangle, and go
> vertically down any number of rows.
>
> Then the sum of these numbers is the number in the next row down and
> to the right.
>
> Consider row 2 of the triangle:

  --------------------------------------------------
  Row 0   1                                      
  ------ --- --- -------- -------- ---- ---- --- ---
  Row 1   1   1                                  

  Row 2   1   2   **1**                          

  Row 3   1   3   **3**      1                   

  Row 4   1   4   **6**      4      1            

  Row 5   1   5   **10**     10     5    1       

  Row 6   1   6   **15**     20     15   6    1  

  Row 7   1   7     21     **35**   35   21   7   1
  --------------------------------------------------

> $$²C₂\  + \ ³C₂\  + \ ⁴C₂\  + \ ⁵C₂\  + \ ⁶C₂\  = \ 1\  + \ 3\  + \ 6\  + \ 10\  + \ 15\  = \ 35\  = \ ⁷C₃\ (*)$$
>
> The general form is:
>
> $$ʳCᵣ\  + \ ʳ⁺¹Cᵣ\  + \ ʳ⁺²Cᵣ\  + \ ...\  + \ ⁿCᵣ\  = \ ⁿ⁺¹Cᵣ₊₁\ (**)$$

a.  To prove the particular result (\*), start with the right-hand side
    and use Pascal's Identity:

$$⁷C₃\  = \ ⁶C₃\  + \ ⁶C₂$$

> then keep expanding the term with $r\  = \ 3$.\
> To complete the proof, you will need to use the fact that
> $³C₃\  = \ ²C₂\$

$${\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ ⁷C₃\  = \ ⁶C₃\  + \ ⁶C₂\ 
}{= \ ⁵C₃\  + \ ⁵C₂\  + \ ⁶C₂
}{= \ ⁴C₃\  + \ ⁴C₂\  + \ ⁵C₂\  + \ ⁶C₂
}{= \ ³C₃\  + \ ³C₂\  + \ ⁴C₂\  + \ ⁵C₂\  + \ ⁶C₂
}{= \ ²C₂\  + \ ³C₂\  + \ ⁴C₂\  + \ ⁵C₂\  + \ ⁶C₂}$$

b.  Hence generalise this to the proof of the identity $(**)$

$${\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ ⁿ⁺¹Cᵣ₊₁\  = \ ⁿCᵣ₊₁\  + \ ⁿCᵣ
}{= \ ⁿ⁻¹Cᵣ₊₁\  + \ ⁿ⁻¹Cᵣ\  + \ ⁿCᵣ
}{= \ ⁿ⁻²Cᵣ₊₁\  + \ ⁿ⁻²Cᵣ\  + \ ⁿ⁻¹Cᵣ\  + \ ⁿCᵣ
}{= \ ...
}{= \ ʳ⁺¹Cᵣ₊₁\  + \ ʳ⁺¹Cᵣ\  + \ ʳ⁺²Cᵣ\  + \ ...\  + \ ⁿCᵣ
}{= \ ʳCᵣ\  + \ ʳ⁺¹Cᵣ\  + \ ʳ⁺²Cᵣ\  + \ ...\  + \ ⁿCᵣ\ \ \ (since\ ʳ⁺¹Cᵣ₊₁\  = \ ʳCᵣ)}$$

7.  If the entries of any row are squared and added, the sum is the
    middle entry in the row twice as far down. We proved this in an
    investigation earlier, we will prove it again using a different
    expansion.

By comparing coefficients of $xⁿ$ on both sides of the identity
$(1\  + \ x)ⁿ(1\  + \ x)ⁿ\  = \ (1\  + \ x)²ⁿ$,\
show that

$$(ⁿC₀)²\  + \ (ⁿC₁)²\  + \ (ⁿC₂)²\  + \ (ⁿC₃)²\  + \ ...\  + \ (ⁿCₙ)²\  = \ ²ⁿCₙ$$

$$LHS = \ (1\  + \ x)ⁿ(1\  + \ x)ⁿ\ $$

$$= \ (ⁿC₀\  + \ ⁿC₁x\  + \ ⁿC₂x²\  + \ ...\  + \ ⁿCₙxⁿ)(ⁿC₀\  + \ ⁿC₁x\  + \ ⁿC₂x²\  + \ ...\  + \ ⁿCₙxⁿ)$$

Coefficient of $xⁿ$ on LHS:

$$ⁿC₀ \cdot ⁿCₙ\  + \ ⁿC₁ \cdot ⁿCₙ₋₁\  + \ ⁿC₂ \cdot ⁿCₙ₋₂\  + \ ...\  + \ ⁿCₙ \cdot ⁿC₀$$

Using $ⁿCᵣ\  = \ ⁿCₙ₋ᵣ:$

$$= \ (ⁿC₀)²\  + \ (ⁿC₁)²\  + \ (ⁿC₂)²\  + \ ...\  + \ (ⁿCₙ)²$$

$RHS\  =$ $(1\  + \ x)^{2}ⁿ$

$$\  = \ ²ⁿC₀\  + \ ²ⁿC₁x\  + \ ...\  + \ ²ⁿCₙxⁿ\  + \ ...\  + \ ²ⁿC₂ₙx²ⁿ$$

Coefficient of $xⁿ$ on RHS: $²ⁿCₙ$

Therefore
$(ⁿC₀)²\  + \ (ⁿC₁)²\  + \ (ⁿC₂)²\  + \ ...\  + \ (ⁿCₙ)²\  = \ ²ⁿCₙ$

8.  In this question we consider binary words consisting only of the
    letters A and B.

    a.  Consider a binary word consisting of $a\  + \ b$ letters, with A
        occuring $a$ times and B occuring $b$ times. Show that there are
        $ᵃ⁺ᵇCₐ\  = \ ᵃ^{+}ᵇC_{b}$ permutations of such a word.

Total positions: $a\  + \ b$

Choose $a$ positions for letter A:$\ ᵃ⁺ᵇCₐ$ ways

Remaining $b$ positions automatically filled with B.

Therefore $ᵃ⁺ᵇCₐ$ permutations.

Equivalently, choose $b$ positions for letter B: $ᵃ^{+}ᵇC_{b}$ ways.

Since both give the same count, $ᵃ⁺ᵇCₐ\  = \ ᵃ^{+}ᵇC_{b}$

b.  How many possible permutations are there of a binary word with $2n$
    letters, if A and B both occur $n$ times?

By substituting $a = n,\ \ b = n:$

$$²ⁿCₙ$$

c.  A word with $2n$ letters may be split down the middle into two words
    of $n$ letters.\
    Consider the example where two A's fall in the first $n$-letter
    word.

    i.  How many arrangements are there of the first $n$-letter binary
        word with two As?

Out of $n$ positions, choose where to place 2 As.

Number of arrangements = $ⁿC₂$

ii. How many arrangements are there of the second $n$-letter binary word
    with $n - 2$ A's and 2 B's?

Out of $n$ positions, choose where to place 2 Bs.

Number of arrangements = $ⁿC₂$

iii. Therefore, how many arrangements are there of a $2n$ letter binary
     word with two As in the first half and two Bs in the second half?

First half: $ⁿC₂$

Second half: $ⁿC₂$

Total arrangements =$\ ⁿC₂ \times \ ⁿC₂\  = \ (ⁿC₂)²$

d.  Hence give a combinatorial argument to prove

$$(ⁿC₀)²\  + \ (ⁿC₁)²\  + \ (ⁿC₂)²\  + \ (ⁿC₃)²\  + \ ...\  + \ (ⁿCₙ)²\  = \ ²ⁿCₙ$$

Consider a $2n$-letter binary word with n As and n Bs.

Total arrangements $= \ ²ⁿCₙ$ (from part b).

Split the word into two $n$-letter halves.

Suppose $k$ A's fall in the first half (then $n\  - \ k$ A's in second
half).

First half: $k$ A's and $(n\  - \ k$) Bs: ⁿCₖ arrangements

Second half: $(n\  - \ k)$ As and $k$ Bs: ⁿCₖ arrangements

Total for this split: $(ⁿCₖ)²$ arrangements

Sum over all possible values $k\  = \ 0,\ 1,\ 2,\ ...,\ n$:

$$²ⁿCₙ\  = \ (ⁿC₀)²\  + \ (ⁿC₁)²\  + \ (ⁿC₂)²\  + \ ...\  + \ (ⁿCₙ)²$$

9.  **Proofs involving Calculus**

$$(1\  + \ x)⁴\  = \ ⁴C₀\  + \ ⁴C₁x\  + \ ⁴C₂x²\  + \ ⁴C₃x³\  + \ ⁴C₄x⁴$$

a.  Differentiate both sides of the binomial expansion above.

$$4(1\  + \ x)³\  = \ ⁴C₁\  + \ 2⁴C₂x\  + \ 3⁴C₃x²\  + \ 4⁴C₄x³$$

b.  By substituting $x\  = \ 1$, show that
    $⁴C₁\  + \ 2(⁴C₂)\  + \ 3(⁴C₃)\  + \ 4(⁴C₄)\  = \ 4\  \times \ 2³.$

4(2)³ = ⁴C₁ + 2⁴C₂ + 3⁴C₃ + 4⁴C₄

4 × 2³ = ⁴C₁ + 2⁴C₂ + 3⁴C₃ + 4⁴C₄

The sum of the products of a term and its position is\
the index of the row times half the sum of the whole row.

c.  By substituting $x\  = \  - 1$, show that
    $⁴C₁\  - \ 2(⁴C₂)\  + \ 3(⁴C₃)\  - \ 4(⁴C₄)\  = \ 0.$

4(0)³ = ⁴C₁ - 2⁴C₂ + 3⁴C₃ - 4⁴C₄

0 = ⁴C₁ - 2⁴C₂ + 3⁴C₃ - 4⁴C₄

The alternating sum of the products of a term and its position is zero

7.  $(1\  + \ x)ⁿ\  = \ ⁿC₀\  + \ ⁿC₁x\  + \ ...\  + \ ⁿCₙxⁿ\$ for
    $n \geq 1$

    a.  Differentiate both sides of the binomial expansion$\$above.

$$n(1\  + \ x)ⁿ⁻¹\  = \ ⁿC₁\  + \ 2ⁿC₂x\  + \ 3ⁿC₃x²\  + \ ...\  + \ nⁿCₙxⁿ⁻¹$$

b.  By substituting $x\  = \ 1$, show that
    $1\  \times \ ⁿC₁\  + \ 2\  \times \ ⁿC₂\  + \ ...\  + \ n\  \times \ ⁿCₙ\  = \ n2ⁿ⁻¹.$

$$n(2)ⁿ⁻¹\  = \ ⁿC₁\  + \ 2ⁿC₂\  + \ 3ⁿC₃\  + \ ...\  + \ nⁿCₙ$$

The sum of the products of a term and its position is\
the index of the row times half the sum of the whole row.

c.  By substituting $x\  = \  - 1$, show that
    $1\  \times \ ⁿC₁\  - \ 2\  \times \ ⁿC₂\  + \ ...\  + \ ( - 1)ⁿ⁻¹n\  \times \ ⁿCₙ\  = \ 0.$

$$n(0)ⁿ⁻¹\  = \ ⁿC₁\  - \ 2ⁿC₂\  + \ 3ⁿC₃\  - \ ...\  + \ ( - 1)ⁿ⁻¹nⁿCₙ$$

$$0\  = \ 1\  \times \ ⁿC₁\  - \ 2\  \times \ ⁿC₂\  + \ ...\  + \ ( - 1)ⁿ⁻¹n\  \times \ ⁿCₙ$$

The alternating sum of the products of a term and its position is zero

8.  Consider the expansion:
    $(1\  + \ x)²ⁿ\  = \ ²ⁿC₀\  + \ ²ⁿC₁x\  + \ ...\  + \ ²ⁿC₂ₙx²ⁿ$

    a.  By differentiating both sides of the identity, show that:

> $$1\  \times \ ²ⁿC₁\  + \ 2\  \times \ ²ⁿC₂\  + \ \ldots\  + \ 2n\  \times \ ²ⁿC₂ₙ\  = \ n2²ⁿ.$$

$$2n(1\  + \ x)²ⁿ⁻¹\  = \ ²ⁿC₁\  + \ 2²ⁿC₂x\  + \ 3²ⁿC₃x²\  + \ ...\  + \ 2n²ⁿC₂ₙx²ⁿ⁻¹$$

Substitute $x\  = \ 1:$

$$2n(2)²ⁿ⁻¹\  = \ ²ⁿC₁\  + \ 2²ⁿC₂\  + \ ...\  + \ 2n²ⁿC₂ₙ$$

$$n2²ⁿ\  = \ 1\  \times \ ²ⁿC₁\  + \ 2\  \times \ ²ⁿC₂\  + \ ...\  + \ 2n\  \times \ ²ⁿC₂ₙ$$

b.  And show that
    $1\  \times \ ²ⁿC₁\  - \ 2\  \times \ ²ⁿC₂\  + \ \ldots\  + \ ( - 1)²ⁿ⁻¹2n\  \times \ ²ⁿC₂ₙ\  = \ 0.$

Substitute $x\  = \  - 1$ into differentiated form:

$$2n(0)²ⁿ⁻¹\  = \ ²ⁿC₁\  - \ 2²ⁿC₂\  + \ 3²ⁿC₃\  - \ ...\  + \ ( - 1)²ⁿ⁻¹2n²ⁿC₂ₙ$$

$$0\  = \ 1\  \times \ ²ⁿC₁\  - \ 2\  \times \ ²ⁿC₂\  + \ ...\  + \ ( - 1)²ⁿ⁻¹2n\  \times \ ²ⁿC₂ₙ$$
