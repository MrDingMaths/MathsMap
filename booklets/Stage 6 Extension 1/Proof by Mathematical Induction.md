+-------------------------------------------------------------------+
| Mathematics Extension 1 Year 12                                   |
+===================================================================+
| **Proof by**                                                      |
|                                                                   |
| **Mathematical Induction**                                        |
+-------------------------------------------------------------------+

+-------------------------+-----------------------------------+-------------------------+
| **Book 1**              | Proof by mathematical induction   | Version: 251202         |
|                         |                                   |                         |
|                         |                                   | Feedback:\              |
|                         |                                   | https://MrDingMaths.com |
+=========================+===================================+=========================+
| **Contents**                                                                          |
|                                                                                       |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                          |
|                                                                                       |
| [Proofs of Sums [3](#proofs-of-sums)](#proofs-of-sums)                                |
|                                                                                       |
| [Proofs of Divisibility [30](#proofs-of-divisibility)](#proofs-of-divisibility)       |
|                                                                                       |
| [Exam Questions [40](#exam-questions)](#exam-questions)                               |
+---------------------------------------------------------------------------------------+

# Syllabus Content

**ME1-12-01** uses mathematical induction to prove results involving
sums and divisibility

- Examine the nature of inductive proof, including the statement to be
  proved*,* the base case and the inductive step

- Prove results for sums using mathematical induction

- Prove divisibility results using mathematical induction

- Identify errors in false 'proofs by induction', such as cases where
  only one of the two required steps of a proof by induction is true

# Proofs of Sums

+-------------------------------------------------------------------+
| - **Investigation** The nature of proof.                          |
+===================================================================+
| In mathematical proofs, we start with a claim that can be either  |
| true or false, also known as a **proposition.**                   |
|                                                                   |
| Proposition: $n^{2} - n + 11$ is prime for all natural numbers    |
| $n \in \left\{ 1,\ 2,\ 3,\ 4\ldots \right\}$.                     |
|                                                                   |
| Let's start by checking if it works:                              |
|                                                                   |
| $n = 1,$ ..............................                           |
|                                                                   |
| $n = 2,$ ..............................                           |
|                                                                   |
| $n = 3,$ ..............................                           |
|                                                                   |
| $n = 4,$ ..............................                           |
|                                                                   |
| $n = 5,$ ..............................                           |
|                                                                   |
| $n = 6,$ ..............................                           |
|                                                                   |
| At first glance, the rule seems to work!                          |
|                                                                   |
| To **prove** whether a proposition is true for false:             |
|                                                                   |
| \- True if it works for all values of $n$.                        |
|                                                                   |
| \- False if there is at least 1 single counterexample.            |
|                                                                   |
| In mathematical proof, a single counterexample is enough to       |
| disprove something.                                               |
|                                                                   |
| Find a counterexample.                                            |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Key Ideas**                                                   |
+===================================================================+
| 1.  To prove a proposition is true, we must prove it is true for  |
|     ............ cases.                                           |
|                                                                   |
| 2.  To prove a proposition is false, we can find a                |
|     ......................                                        |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Investigation** Sum of whole numbers.                         |
+===================================================================+
| a.  Consider the sum: $1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10$    |
|                                                                   |
| What is the result?                                               |
|                                                                   |
| b.  Consider the sum: $1 + 2 + 3 + \ldots + 98 + 99 + 100$        |
|                                                                   |
| Pairs add up to: ............                                     |
|                                                                   |
| Number of pairs: ............                                     |
|                                                                   |
| Total: ........................                                   |
|                                                                   |
| c.  Consider the sum $1 + 2 + 3 + \ldots + 998 + 999 + 1000$      |
|                                                                   |
| Pairs add up to: ............                                     |
|                                                                   |
| Number of pairs: ............                                     |
|                                                                   |
| Total: ........................                                   |
|                                                                   |
| d.  Consider the sum $1 + 2 + 3 + \ldots + (n - 2) + (n - 1) + n$ |
|                                                                   |
| Pairs add up to: ............                                     |
|                                                                   |
| Number of pairs: ............                                     |
|                                                                   |
| Total: ........................                                   |
+-------------------------------------------------------------------+
| We have come up with a formula for summing any number of whole    |
| numbers                                                           |
|                                                                   |
| $$1 + 2 + 3 + \ldots + n = \frac{n}{2}(n + 1)$$                   |
|                                                                   |
| But how can we know for sure this works for *any* number?         |
|                                                                   |
| We use a method called proof by **mathematical induction**        |
|                                                                   |
| Here are the steps:                                               |
|                                                                   |
| **1. Prove that the base case is true,** $\mathbf{n = 1}$         |
|                                                                   |
| For $n = 1:$                                                      |
|                                                                   |
| $LHS\  =$ $RHS =$                                                 |
|                                                                   |
| **2. Assume that the** $\mathbf{k}^{\mathbf{th}}$ **case is       |
| true,** $\mathbf{k \geq 1}$ **and** $\mathbf{k}$ **is a natural   |
| number.**                                                         |
|                                                                   |
| $1 + 2 + 3 + \ldots + k =$ ........................               |
|                                                                   |
| **3. Prove that the**                                             |
| $\left( \mathbf{k + 1} \right)^{\mathbf{th}}$ **case is true,     |
| using the assumption.**                                           |
|                                                                   |
| WTP: $1 + 2 + 3 + \ldots + k + (k + 1) =$                         |
| ....................................                              |
|                                                                   |
| $LHS =$                                                           |
|                                                                   |
| **4. State proof by induction.**                                  |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Proof by Mathematical Induction**                             |
+===================================================================+
| Imagine you have in infinite line of dominoes.                    |
|                                                                   |
| ....                                                              |
|                                                                   |
| Each domino represents a proposition.                             |
|                                                                   |
| If a domino falls, then the proposition is true.                  |
|                                                                   |
| We want to prove that all dominoes will fall over.                |
|                                                                   |
| **Step 1: Test that the first domino falls.**                     |
|                                                                   |
| ...                                                               |
|                                                                   |
| **Step 2: Assume that the** $\mathbf{k}^{\mathbf{th}}$ **domino   |
| will fall.**                                                      |
|                                                                   |
| ...                                                               |
|                                                                   |
| **Step 3: Prove that the**                                        |
| $\left( \mathbf{k + 1} \right)^{\mathbf{th}}$ **domino will       |
| always fall.**                                                    |
|                                                                   |
| ...                                                               |
|                                                                   |
| **Step 4: Conclusion**                                            |
|                                                                   |
| If any domino falls, the next will always fall.\                  |
| The first domino falls, so every domino will fall.                |
|                                                                   |
| Therefore, proven by mathematical induction.                      |
|                                                                   |
| ...                                                               |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Proof by Mathematical Induction**                             |
+===================================================================+
| We can use mathematical induction to prove statements where $n$   |
| is a positive whole number.                                       |
|                                                                   |
| 1\. Test the base case, usually $n = 1$                           |
|                                                                   |
| 2\. Assume $n = k$ is true.                                       |
|                                                                   |
| 3\. Prove $n = k + 1$ is true.                                    |
|                                                                   |
| 4\. State proof by induction.                                     |
|                                                                   |
| - You *must* set out your work in the above way to give a         |
|   coherent proof.                                                 |
+-------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------+
| - **Example** Prove sums by mathematical induction.                                                    |
+========================================================================================================+
| Prove by mathematical induction:                                                                       |
|                                                                                                        |
| $$1 + 3 + 5 + \ldots + (2n - 1) = n^{2}\ \ \ \ \ for\ all\ n = 1,2,3\ldots$$                           |
|                                                                                                        |
| 1\. Test $n = 1$                                                                                       |
|                                                                                                        |
| $LHS = 1$ $RHS = 1^{2} = 1$                                                                            |
|                                                                                                        |
| $LHS = RHS$                                                                                            |
|                                                                                                        |
| $\therefore$ True for $n = 1$                                                                          |
|                                                                                                        |
| 2\. Assume true for $n = k$                                                                            |
|                                                                                                        |
| $1 + 3 + 5 + \ldots(2k - 1) = k^{2}$ for some positive integer $k$.                                    |
|                                                                                                        |
| 3\. Prove $n = k + 1$                                                                                  |
|                                                                                                        |
| $$WTP:\ \ 1 + 3 + 5 + \ldots + (2k - 1) + (2(k + 1) - 1)) = (k + 1)^{2}$$                              |
|                                                                                                        |
| $1 + 3 + 5 + \ldots(2k - 1) + (2k + 1) = (k + 1)^{2}$                                                  |
|                                                                                                        |
| $$LHS = 1 + 3 + 5 + \ldots + (2k - 1) + (2k + 1)$$                                                     |
|                                                                                                        |
| $= k^{2} + 2k + 1$                                                                                     |
|                                                                                                        |
| $= (k + 1)^{2}$                                                                                        |
|                                                                                                        |
| $= RHS$                                                                                                |
|                                                                                                        |
| 4\. State proof by MI                                                                                  |
|                                                                                                        |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                   |
+--------------------------------------------------------------------------------------------------------+
| - **Practice**                                                                                         |
+--------------------------------------------------------------------------------------------------------+
| Prove by mathematical induction:                                                                       |
|                                                                                                        |
| $$5 + 9 + 13 + \ldots + (4n + 1) = n(2n + 3)\ \ \ \ \ \ for\ all\ n = 1,2,3\ldots$$                    |
|                                                                                                        |
| 1\. Test $n = 1$                                                                                       |
|                                                                                                        |
| 2\. Assume true for $n = k$                                                                            |
|                                                                                                        |
| 3\. Prove $n = k + 1$                                                                                  |
|                                                                                                        |
| 4\. State proof by MI                                                                                  |
+--------------------------------------------------------------------------------------------------------+
| Prove by mathematical induction:                                                                       |
|                                                                                                        |
| $$1^{2} + 2^{2} + 3^{2} + \ldots + n^{2} = \frac{1}{6}n(n + 1)(2n + 1)\ \ \ \ \ for\ n = 1,2,3\ldots$$ |
+--------------------------------------------------------------------------------------------------------+

Foundation

1.  Prove by mathematical induction.

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                        |
| $$\ 1\  + \ 2\  + \ 2^{2} + \ \cdots\  + \ 2^{n - 1} = \ 2^{n} - \ 1\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| 1\. Test $n\  = \ 1$                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \ 1\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ 2¹\  - \ 1\  = \ 1$$                                                                                                                                                    |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \ RHS$$                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                        |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| 2\. Assume true for $n\  = \ k$                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                        |
| $$1\  + \ 2\  + \ 2^{2} + \ \cdots\  + \ 2^{k - 1} = \ 2ᵏ\  - \ 1$$                                                                                                                                                                    |
|                                                                                                                                                                                                                                        |
| 3\. Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                        |
| WTP: $1\  + \ 2\  + \ 2^{2} + \ \cdots\  + \ 2^{k - 1} + \ 2^{k + 1 - 1} = \ 2^{k + 1} - \ 1$                                                                                                                                          |
|                                                                                                                                                                                                                                        |
| $LHS\$ = $1\  + \ 2\  + \ 2^{2} + \ \cdots\  + \ 2^{k - 1} + \ 2^{k + 1 - 1}$                                                                                                                                                          |
|                                                                                                                                                                                                                                        |
| = $2ᵏ\  - \ 1\  + \ 2^{k + 1 - 1}$, using assumption                                                                                                                                                                                   |
|                                                                                                                                                                                                                                        |
| = $2ᵏ\  + \ 2ᵏ\  - \ 1$                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                        |
| = $2\  \times \ 2ᵏ\  - \ 1$                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                        |
| = $2^{k + 1} - \ 1$                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                        |
| = $RHS$                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                        |
| 4\. State proof by MI                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                        |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                   |
+========================================================================================================================================================================================================================================+
| b.  $\$                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                        |
| $$2\  + \ 4\  + \ 8\  + \ ...\  + \ 2^{n} = \ 2\left( 2^{n} - \ 1 \right)\ \ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                          |
|                                                                                                                                                                                                                                        |
| Test $n\  = \ 1$                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \ 2\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ 2(2¹\  - \ 1)\  = \ 2$$                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \ RHS$$                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                        |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| Assume true for $n\  = \ k$                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                        |
| $$2\  + \ 4\  + \ 8\  + \ \cdots\  + \ 2ᵏ\  = \ 2(2ᵏ\  - \ 1)$$                                                                                                                                                                        |
|                                                                                                                                                                                                                                        |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                        |
| WTP: $2\  + \ 4\  + \ 8\  + \ \cdots\  + \ 2ᵏ\  + \ 2^{k + 1} = \ 2\left( 2^{k + 1} - \ 1 \right)$                                                                                                                                     |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \ \lbrack 2\  + \ 4\  + \ 8\  + \ \cdots\  + \ 2ᵏ\rbrack\  + \ 2^{k + 1}$$                                                                                                                                                   |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \  = \ 2(2ᵏ\  - \ 1)\  + \ 2^{k + 1},\ using\ assumption$$                                                                                                                                                             |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \  = \ 2\hat{}(k + 1)\  - \ 2\  + \ 2^{k + 1}$$                                                                                                                                                                        |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \  = \ 2\  \times \ 2^{k + 1} - \ 2$$                                                                                                                                                                                  |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \  = \ 2\left( 2^{k + 1} - \ 1 \right)$$                                                                                                                                                                               |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                        |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                   |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| c.                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                        |
| $$\frac{1}{1(2)} + \frac{1}{2(3)} + \frac{1}{3(4)} + \ \cdots\  + \frac{1}{n(n + 1)} = \frac{n}{n + 1}\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                               |
|                                                                                                                                                                                                                                        |
| Test $n\  = \ 1$:                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \frac{1}{1 \times 2}\ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \frac{1}{1\  + \ 1}$$                                                                                                                                                  |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{2}\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{1}{2}$$                                                                                                                     |
|                                                                                                                                                                                                                                        |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| Assume true for $n\  = \ k$:                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                        |
| $$\frac{1}{1(2)} + \frac{1}{2(3)} + \frac{1}{3(4)} + \ \cdots\  + \ \left( \frac{1}{k(k + 1)} \right) = \frac{k}{k + 1}$$                                                                                                              |
|                                                                                                                                                                                                                                        |
| Prove $n\  = \ k\  + \ 1$:                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                        |
| $$WTP:\ \frac{1}{1(2)} + \frac{1}{2(3)} + \frac{1}{3(4)} + \ \cdots\  + \ \left( \frac{1}{k(k + 1)} \right) + \ \left( \frac{1}{(k + 1)\left( (k + 1) + 1 \right)} \right) = \frac{k + 1}{(k + 1) + 1}$$                               |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \ \frac{1}{1(2)} + \frac{1}{2(3)} + \frac{1}{3(4)} + \ \cdots\  + \ \left( \frac{1}{k(k\  + \ 1)} \right) + \ \left( \frac{1}{(k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right)} \right)$$                                         |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k}{k + 1} + \ \left( \frac{1}{(k + 1)\left( (k + 1) + 1 \right)} \right),\ using\ assumption$$                                                                                                          |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k}{k\  + \ 1} + \ \left( \frac{1}{(k\  + \ 1)(k\  + \ 2)} \right)$$                                                                                                                                     |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k(k\  + \ 2)}{(k\  + \ 1)(k\  + \ 2)} + \frac{1}{(k\  + \ 1)(k\  + \ 2)}$$                                                                                                                              |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k^{2} + \ 2k}{(k\  + \ 1)(k\  + \ 2)} + \frac{1}{(k\  + \ 1)(k\  + \ 2)}$$                                                                                                                              |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k^{2} + \ 2k\  + \ 1}{(k\  + \ 1)(k\  + \ 2)}$$                                                                                                                                                         |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{(k\  + \ 1)^{2}}{(k\  + \ 1)(k\  + \ 2)}$$                                                                                                                                                              |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k\  + \ 1}{k\  + \ 2}$$                                                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k\  + \ 1}{(k\  + \ 1) + \ 1}$$                                                                                                                                                                         |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                        |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                   |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| d.                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                        |
| $$\frac{1}{1(3)} + \frac{1}{3(5)} + \frac{1}{5(7)} + \ \cdots\  + \frac{1}{(2n - 1)(2n + 1)} = \frac{n}{2n + 1}\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                      |
|                                                                                                                                                                                                                                        |
| Test $n\  = \ 1$:                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \frac{1}{1 \times 3}\ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \frac{1}{2(1) + \ 1}$$                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{1}{3}$$                                                                                                                   |
|                                                                                                                                                                                                                                        |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| Assume true for $n\  = \ k$:                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                        |
| $$\frac{1}{1(3)} + \frac{1}{3(5)} + \frac{1}{5(7)} + \ \cdots\  + \ \left( \frac{1}{(2k - 1)(2k + 1)} \right) = \frac{k}{2k + 1}$$                                                                                                     |
|                                                                                                                                                                                                                                        |
| Prove $n\  = \ k\  + \ 1$:                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                        |
| $$WTP:\ \frac{1}{1(3)} + \frac{1}{3(5)} + \frac{1}{5(7)} + \ \cdots\  + \ \left( \frac{1}{(2k - 1)(2k + 1)} \right) + \ \left( \frac{1}{\left( 2(k + 1) - 1 \right)\left( 2(k + 1) + 1 \right)} \right) = \frac{k + 1}{2(k + 1) + 1}$$ |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \ \frac{1}{1(3)} + \frac{1}{3(5)} + \frac{1}{5(7)} + \ \cdots\  + \ \left( \frac{1}{(2k\  - \ 1)(2k\  + \ 1)} \right)\  + \ \left( \frac{1}{\left( 2(k\  + \ 1) - \ 1 \right)\left( 2(k\  + \ 1) + \ 1 \right)} \right)$$    |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k}{2k + 1} + \ \left( \frac{1}{\left( 2(k + 1) - 1 \right)\left( 2(k + 1) + 1 \right)} \right),\ using\ assumption$$                                                                                    |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \ k/(2k\  + \ 1)\  + \ \left( \frac{1}{(2k\  + \ 1)(2k\  + \ 3)} \right)$$                                                                                                                                    |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k(2k\  + \ 3)}{(2k\  + \ 1)(2k\  + \ 3)} + \frac{1}{(2k\  + \ 1)(2k\  + \ 3)}$$                                                                                                                         |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{2k^{2} + \ 3k}{(2k\  + \ 1)(2k\  + \ 3)} + \frac{1}{(2k\  + \ 1)(2k\  + \ 3)}$$                                                                                                                         |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{2k^{2} + \ 3k\  + \ 1}{(2k\  + \ 1)(2k\  + \ 3)}$$                                                                                                                                                      |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{(2k\  + \ 1)(k\  + \ 1)}{(2k\  + \ 1)(2k\  + \ 3)}$$                                                                                                                                                    |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k\  + \ 1}{2k\  + \ 3}$$                                                                                                                                                                                |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k\  + \ 1}{2(k\  + \ 1) + \ 1}$$                                                                                                                                                                        |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                        |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                   |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| e.  $\$                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                        |
| $$5\  + \ 10\  + \ 15\  + \ ...\  + \ 5n\  = \frac{5}{2}n(n\  + \ 1)\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| Test $n\  = \ 1$:                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \ 5\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \frac{5(1)(1\  + \ 1)}{2} = \ 5$$                                                                                                                                         |
|                                                                                                                                                                                                                                        |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| Assume true for $n\  = \ k$:                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                        |
| $$5\  + \ 10\  + \ 15\  + \ \cdots\  + \ 5k\  = \frac{5k(k\  + \ 1)}{2}$$                                                                                                                                                              |
|                                                                                                                                                                                                                                        |
| Prove $n\  = \ k\  + \ 1$:                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                        |
| $$WTP:\ 5\  + \ 10\  + \ 15\  + \ \cdots\  + \ 5k\  + \ \left\lbrack 5(k\  + \ 1) \right\rbrack = \frac{5(k\  + \ 1)(k\  + \ 2)}{2}$$                                                                                                  |
|                                                                                                                                                                                                                                        |
| $$LHS = \ \lbrack 5\  + \ 10\  + \ 15\  + \ \cdots\  + \ 5k\rbrack + \ \left( 5(k\  + \ 1) \right)$$                                                                                                                                   |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \  = \frac{5k(k\  + \ 1)}{2} + \ 5(k\  + \ 1),\ \ \ using\ assumption$$                                                                                                                                              |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \  = \frac{5k(k\  + \ 1) + \ 10(k\  + \ 1)}{2}$$                                                                                                                                                                     |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \  = \frac{5(k\  + \ 1)(k\  + \ 2)}{2}$$                                                                                                                                                                             |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                        |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                   |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| f.  $\$                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                        |
| $$- 2\  - \ 4\  - \ 6\  - \ ...\  - \ 2n\  = \  - n(n\  + \ 1)\ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                         |
|                                                                                                                                                                                                                                        |
| Test $n\  = \ 1$:                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \  - 2\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \  - 1(1\  + \ 1) = \  - 2$$                                                                                                                                           |
|                                                                                                                                                                                                                                        |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| Assume true for $n\  = \ k$:                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                        |
| $$- 2\  - \ 4\  - \ 6\  - \ \cdots\  - \ 2k\  = \  - k(k\  + \ 1)$$                                                                                                                                                                    |
|                                                                                                                                                                                                                                        |
| Prove $n\  = \ k\  + \ 1$:                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                        |
| $$WTP:\  - 2\  - \ 4\  - \ 6\  - \ \cdots\  - \ 2k\  - \ \left( 2(k\  + \ 1) \right) = \  - (k\  + \ 1)(k\  + \ 2)$$                                                                                                                   |
|                                                                                                                                                                                                                                        |
| $$LHS\  = \ \lbrack - 2\  - \ 4\  - \ 6\  - \ \cdots\  - \ 2k\rbrack\  - \ \left\lbrack 2(k\  + \ 1) \right\rbrack$$                                                                                                                   |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \  - k(k\  + \ 1)\  - \ \left\lbrack 2(k\  + \ 1) \right\rbrack,\ using\ assumption$$                                                                                                                         |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)( - k\  - \ 2)$$                                                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \  - (k\  + \ 1)(k\  + \ 2)$$                                                                                                                                                                                 |
|                                                                                                                                                                                                                                        |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                        |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                   |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| g.                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                |
| $$1\  + \frac{1}{2} + \frac{1}{4} + \ ...\  + \frac{1}{2^{n - 1}} = \ 2\left( 1\  - \frac{1}{2^{n}} \right)\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                  |
|                                                                                                                                                                                                                                |
| Test $n\  = \ 1$                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                |
| $$LHS\  = \ 1\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ 2\left( 1\  - \frac{1}{2^{1}} \right) = \ 1$$                                                                                                                   |
|                                                                                                                                                                                                                                |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                |
| Assume $n\  = \ k$                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                |
| $$1\  + \ \left( \frac{1}{2} \right) + \ \left( \frac{1}{4} \right) + \ \cdots\  + \ \left( \frac{1}{2^{k - 1}} \right) = \ 2\left( 1\  - \frac{1}{2^{k}} \right)$$                                                            |
|                                                                                                                                                                                                                                |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                |
| $$WTP:\ 1\  + \ \left( \frac{1}{2} \right) + \ \left( \frac{1}{4} \right) + \ \cdots\  + \ \left( \frac{1}{2^{k - 1}} \right) + \ \left( \frac{1}{2ᵏ} \right) = \ 2\left( 1\  - \ \left( \frac{1}{2^{k + 1}} \right) \right)$$ |
|                                                                                                                                                                                                                                |
| $$LHS\  = \ \left\lbrack 1\  + \ \left( \frac{1}{2} \right) + \ \left( \frac{1}{4} \right) + \ \cdots\  + \ \left( \frac{1}{2^{k - 1}} \right) \right\rbrack + \ \left( \frac{1}{2ᵏ} \right)$$                                 |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = \ 2\left( 1\  - \frac{1}{2^{k}} \right) + \ \left( \frac{1}{2ᵏ} \right),\ using\ assumption$$                                                                                                         |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = \ 2\  - \frac{2}{2^{k}} + \frac{1}{2^{k}}$$                                                                                                                                                           |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = 2 - \frac{1}{2^{k}}$$                                                                                                                                                                                 |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = \ 2\left( 1\  - \frac{1}{2^{k + 1}} \right)$$                                                                                                                                                         |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                               |
|                                                                                                                                                                                                                                |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                           |
+================================================================================================================================================================================================================================+
| h.                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                |
| $$1\  + \ 5\  + \ 5^{2} + \ \cdots\  + \ 5^{n - 1} = \frac{1}{4}\left( 5^{n} - \ 1 \right)\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                   |
|                                                                                                                                                                                                                                |
| Test $n = 1$:                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                |
| $$LHS\  = \ 1\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \frac{1}{4}\left( 5^{1} - \ 1 \right)$$                                                                                                                           |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \ 1$$                                                                                                                 |
|                                                                                                                                                                                                                                |
| $$LHS\  = \ RHS$$                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                |
| Assume true for $n = k$:                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                |
| $$1\  + \ 5\  + \ 5^{2} + \ \cdots\  + \ 5^{k - 1} = \frac{1}{4}(5ᵏ\  - \ 1)$$                                                                                                                                                 |
|                                                                                                                                                                                                                                |
| Prove true for $n = k + 1$:                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                |
| $$WTP:\ 1\  + \ 5\  + \ 5^{2} + \ \cdots\  + \ 5^{k - 1} + \ 5^{k + 1 - 1} = \frac{1}{4}\left( 5^{k + 1} - \ 1 \right)$$                                                                                                       |
|                                                                                                                                                                                                                                |
| $$LHS\  = \ 1\  + \ 5\  + \ 5^{2} + \ \cdots\  + \ 5^{k - 1} + \ 5^{k + 1 - 1}$$                                                                                                                                               |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{4}(5ᵏ\  - \ 1) + \ 5^{k + 1 - 1},\ using\ assumption$$                                                                                                                                       |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{4}\left( 5ᵏ\  - \ 1\  + \ 4\  \times \ 5^{k + 1 - 1} \right)$$                                                                                                                               |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{4}(5ᵏ\  - \ 1\  + \ 4\  \times \ 5ᵏ)$$                                                                                                                                                       |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{4}(5\  \times \ 5ᵏ\  - \ 1)$$                                                                                                                                                                |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{4}\left( 5^{k + 1} - \ 1 \right)$$                                                                                                                                                           |
|                                                                                                                                                                                                                                |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                               |
|                                                                                                                                                                                                                                |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                           |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| i.                                                                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                              |
| $$1(1!) + \ 2(2!) + \ 3(3!) + \ \cdots\  + \ n(n!) = \ (n + 1)!\  - \ 1\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                                              |
| Test $n\  = \ 1$:                                                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                              |
| $$LHS\  = \ 1\  \times \ 1!\  = \ 1\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ (1\  + \ 1)!\  - \ 1\  = \ 2\  - \ 1\  = \ 1$$                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                              |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                                              |
| Assume true for $n\  = \ k$:                                                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                                                              |
| $$1(1!) + \ 2(2!) + \ 3(3!) + \ \cdots\  + \ k(k!)\  = \ (k\  + \ 1)!\  - \ 1$$                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                              |
| Prove $n\  = \ k\  + \ 1$:                                                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                              |
| $$WTP:\ 1(1!) + \ 2(2!) + \ 3(3!) + \ \cdots\  + \ k(k!) + \ (k\  + \ 1)\ (k\  + \ 1)!\  = \ (k\  + \ 2)!\  - \ 1$$                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                              |
| $$LHS\  = \ 11(1!) + \ 2(2!) + \ 3(3!) + \ \cdots\  + \ k(k!) + \ (k\  + \ 1)\ (k\  + \ 1)!$$                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)!\  - \ 1\  + \ (k\  + \ 1)\ (k\  + \ 1)!,\ using\ assumption$$                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)!\  + \ (k\  + \ 1)\ (k\  + \ 1)!\  - \ 1$$                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)!(1\  + \ k\  + \ 1) - \ 1$$                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)!(k\  + \ 2) - \ 1$$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 2)!\  - \ 1$$                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                              |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                                                         |
+==============================================================================================================================================================================================================================================================================================================================+
| j.  $\$                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                              |
| $$2\  + \ 5\  + \ 8\  + \ ...\  + \ (3n\  - \ 1) = \frac{3n^{2} + \ n}{2}\ \ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                                              |
| Test $n\  = \ 1$:                                                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                              |
| $$LHS\  = \ 2\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \frac{3\left( 1^{2} \right) + \ 1}{2} = \ 2$$                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                              |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                                              |
| Assume true for $n\  = \ k$:                                                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                                                              |
| $$2\  + \ 5\  + \ 8\  + \ \cdots\  + \ (3k\  - \ 1) = \frac{3k^{2} + \ k}{2}$$                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                                              |
| Prove $n\  = \ k\  + \ 1$:                                                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                              |
| $$WTP:\ 2\  + \ 5\  + \ 8\  + \ \cdots\  + \ (3k\  - \ 1) + \ \left( 3(k\  + \ 1) - \ 1 \right) = \frac{3(k\  + \ 1)^{2} + \ (k\  + \ 1)}{2}$$                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{3k^{2} + \ 7k\  + \ 4}{2}$$ |
|                                                                                                                                                                                                                                                                                                                              |
| $$LHS\  = \ \lbrack 2\  + \ 5\  + \ 8\  + \ \cdots\  + \ (3k\  - \ 1)\rbrack\  + \ \left\lbrack 3(k\  + \ 1) - \ 1 \right\rbrack$$                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{3k^{2} + \ k}{2} + \ 3k\  + \ 2,\ using\ assumption$$                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{3k^{2} + \ 7k\  + \ 4}{2}$$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                              |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                              |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                                                         |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Development

+--------------------------------------------------------------------------------------+
| k.  Suppose that $1 + 3 + 5 + \ldots + (2n - 1) = n^{2} + 2$ is true for $n = k$\    |
|     Prove that it is true for $n = k + 1$.                                           |
|                                                                                      |
| $$WTP = 1 + 3 + 5 + \ldots(2k - 1) + \left( 2(k + 1) - 1 \right) = (k + 1)^{2} + 2$$ |
|                                                                                      |
| $$LHS = 1 + 3 + 5 + \ldots(2k - 1) + \left( 2(k + 1) - 1 \right)$$                   |
|                                                                                      |
| $= k^{2} + 2 + \left( 2(k + 1) - 1 \right)$, using assumption                        |
| $1 + 3 + 5 + \ldots(2k - 1) = k^{2} + 2$                                             |
|                                                                                      |
| $= k^{2} + 2 + (2k + 2 - 1)$                                                         |
|                                                                                      |
| $= k^{2} + 2k + 3$                                                                   |
|                                                                                      |
| $$\ \ \ \ \ \ \ \ \  = (k + 1)^{2} + 2$$                                             |
|                                                                                      |
| > Explain why we cannot conclude it is also true for all integers $n \geq 1$.        |
|                                                                                      |
| The base case $n = 1$ is not true.                                                   |
+======================================================================================+
| l.  Prove or disprove $3 + 6 + 9 + \ldots + 3n = n(n + 1) + 1$ for all positive      |
|     integers $n \geq 1$.                                                             |
|                                                                                      |
| Disprove by counterexample: case $n = 2$ is not true.                                |
+--------------------------------------------------------------------------------------+
| m.  Explain why you cannot prove $3 + 8 + 13 + \ldots + (5n - 2) =$                  |
|     $\frac{n(5n + 1)}{2}$ for all real numbers using mathematical induction.         |
|                                                                                      |
| Mathematical induction only works for positive whole number values of $n$.           |
+--------------------------------------------------------------------------------------+
| n.  Explain why you cannot prove $\sin n\cot n = \cos n$ using mathematical          |
|     induction.                                                                       |
|                                                                                      |
| Mathematical induction only works for positive whole number values of $n$. $n$ can   |
| be any angle.                                                                        |
+--------------------------------------------------------------------------------------+

2.  Prove the following statements using mathematical induction.

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| a.                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$3\  + \ 10\  + \ 17\  + \ ...\  + \ (7n\  - \ 4) = \frac{n}{2}(7n\  - \ 1)\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                             |
| Test $n\  = \ 1$                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 3\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \frac{1}{2}\left( 7(1) - \ 1 \right) = \frac{1}{2}(6) = \ 3$$                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$3\  + \ 10\  + \ 17\  + \ \cdots\  + \ (7k\  - \ 4) = \frac{k}{2}(7k\  - \ 1)$$                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$WTP:\ 3\  + \ 10\  + \ 17\  + \ \cdots\  + \ (7k\  - \ 4) + \ \left( 7(k\  + \ 1) - \ 4 \right) = \ \left( \frac{k\  + \ 1}{2} \right)\left( 7(k\  + \ 1) - \ 1 \right)$$                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \ \left( \frac{k\  + \ 1}{2} \right)(7k - 6)$$ |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ \left\lbrack 3\  + \ 10\  + \ 17\  + \ \cdots\  + \ (7k\  - \ 4) \right\rbrack + \ (7k\  + \ 3)$$                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{k}{2}(7k\  - \ 1) + \ (7k\  + \ 3),\ using\ assumption$$                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{2}\left( 7k^{2} - k \right) + 7k + 3$$                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{2}\left\lbrack 7k^{2} - k + \ 14k\  + \ 6 \right\rbrack$$                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{2}\left( 7k^{2} + \ 13k\  + \ 6 \right)$$                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{2}(k\  + \ 1)(7k\  + \ 6)$$                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \left( \frac{k + 1}{2} \right)(7k\  + \ 6)$$                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                        |
+=============================================================================================================================================================================================================================================================================================+
| b.                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $5\  + \ 10\  + \ 20\  + \ ...\  + \ 5\left( 2^{n} \right) = \ 5\left( 2^{n + 1} - \ 1 \right)\ \ \ \ \ for\ all\ n\  \geq \ 0$ $\leftarrow$ The base case is $n = 0$                                                                                                                       |
|                                                                                                                                                                                                                                                                                             |
| Test $n\  = \ 0$                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 5\  \times \ 2^{0} = \ 5\ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ 5\left( 2^{0 + 1} - \ 1 \right) = \ 5\left( 2^{1} - \ 1 \right) = \ 5$$                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| ∴ True for $n\  = \ 0$                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$5\  + \ 10\  + \ 20\  + \ \cdots\  + \ 5\  \times \ 2ᵏ\  = \ 5\left( 2^{k + 1} - \ 1 \right)$$                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$WTP:\ 5\  + \ 10\  + \ 20\  + \ \cdots\  + \ (5\  \times \ 2ᵏ) + \ \left( 5\  \times \ 2^{k + 1} \right) = \ 5\left( 2^{k + 2} - \ 1 \right)$$                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ \left\lbrack 5\  + \ 10\  + \ 20\  + \ \cdots\  + \ (5\  \times \ 2ᵏ) \right\rbrack + \ \left( 5\  \times \ 2^{k + 1} \right)$$                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 5\left( 2^{k + 1} - \ 1 \right) + \ \left( 5\  \times \ 2^{k + 1} \right),\ using\ assumption$$                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 10\  \times \ 2^{k + 1} - \ 5$$                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 5\left( 2\  \times \ 2^{k + 1} - \ 1 \right)$$                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 5\left( 2^{k + 2} - \ 1 \right)$$                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Since true for $n = 0$, by mathematical induction, true for all integers $n \geq 0$.                                                                                                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| c.                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$2\left( 2^{0} \right) + \ 3\left( 2^{1} \right) + \ 4\left( 2^{2} \right) + \ \cdots\  + \ (n + 1)\left( 2^{n - 1} \right) = \ n\left( 2^{n} \right)\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                    |
|                                                                                                                                                                                                                                                                                             |
| Test $n\  = \ 1$                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 2\  \times \ 2^{0} = 2\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ 1\  \times \ 2^{1} = 2$$                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                             |
| ∴ True for n = 1                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$2\left( 2^{0} \right) + \ 3\left( 2^{1} \right) + \ 4\left( 2^{2} \right) + \ \cdots\  + \ (k\  + \ 1) \times \ 2^{k - 1} = \ k\  \times \ 2ᵏ$$                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$WTP:\ 2\left( 2^{0} \right) + \ 3\left( 2^{1} \right) + \ 4\left( 2^{2} \right) + \cdots\  + \ (k\  + \ 1) \times \ 2^{k - 1} + \ \left( (k\  + \ 1) + \ 1 \right) \times \ 2^{k + 1 - 1}$$                                                                                               |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \  = \ (k\  + \ 1) \times \ 2^{k + 1}$$                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 2\left( 2^{0} \right) + \ 3\left( 2^{1} \right) + \ 4\left( 2^{2} \right) + \ \cdots\  + \ (k\  + \ 1) \times \ 2^{k - 1} + \ \left( (k\  + \ 1) + \ 1 \right) \times \ 2^{k + 1 - 1}$$                                                                                         |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ k\  \times \ 2ᵏ\  + \ \left( (k\  + \ 1) + \ 1 \right) \times \ 2^{k + 1 - 1},\ using\ assumption$$                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ k\  \times \ 2ᵏ\  + \ ((k\  + \ 1)\  + \ 1)\  \times \ 2ᵏ$$                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ k\  \times \ 2ᵏ\  + \ (k\  + \ 2)\  \times \ 2ᵏ$$                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ k\  + \ 2)\  \times \ 2ᵏ$$                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (2k\  + \ 2)\  \times \ 2ᵏ$$                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)\  \times \ 2\  \times \ 2ᵏ$$                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)\  \times \ 2^{k + 1}$$                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| d.                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$1^{2} + \ 2^{2} + \ 3^{2} + \ \cdots\  + \ n^{2} = \frac{1}{6}n(n + 1)(2n + 1)\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| Test $n\  = \ 1$:                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 1\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ \left( \frac{1}{6} \right)(1)(1\  + \ 1)\left( 2(1) + \ 1 \right) = \frac{1}{6} \times \ 1\  \times \ 2\  \times \ 3\  = \ 1$$                                                                                               |
|                                                                                                                                                                                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$:                                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                             |
| $$1^{2} + \ 2^{2} + \ 3^{2} + \ \cdots\  + \ k^{2} = \frac{1}{6}k(k\  + \ 1)(2k\  + \ 1)$$                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                             |
| Prove$\ n\  = \ k\  + \ 1$:                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$WTP:\ 1^{2} + \ 2^{2} + \ 3^{2} + \ \cdots\  + \ k^{2} + \ (k\  + \ 1)^{2} = \frac{1}{6}(k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right)\left( 2(k\  + \ 1) + \ 1 \right)$$                                                                                                                    |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \ \frac{1}{6}(k\  + \ 1)(k\  + \ 2)(2k\  + \ 3)$$                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 1²\  + \ 2²\  + \ 3²\  + \ \cdots\  + \ k²\  + \ (k\  + \ 1)^{2}$$                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{6}k(k\  + \ 1)(2k\  + \ 1) + \ (k\  + \ 1)^{2},\ using\ assumption$$                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1) \times \ \left( \frac{1}{6}k(2k\  + \ 1) + \ (k\  + \ 1) \right)$$                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{6}(k\  + \ 1)\left( k(2k\  + \ 1) + \ 6k\  + \ 6 \right)$$                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{6}(k\  + \ 1)\left( 2k^{2} + \ k\  + \ 6k\  + \ 6 \right)$$                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{6}(k\  + \ 1)\left( 2k^{2} + \ 7k\  + \ 6 \right)$$                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{6}(k\  + \ 1)(k\  + \ 2)(2k\  + \ 3)$$                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| e.                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$1(2) + \ 2(3) + \ 3(4) + \ \cdots\  + \ n(n + 1) = \frac{1}{3}n(n + 1)(n + 2)\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| Test $n\  = \ 1$:                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 1\  \times \ 2\  = \ 2\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ \left( \frac{1}{3} \right)(1)(1\  + \ 1)(1\  + \ 2) = \frac{1}{3} \times \ 2\  \times \ 3\  = \ 2$$                                                                                                     |
|                                                                                                                                                                                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$:                                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                             |
| $$1(2) + \ 2(3) + \ 3(4) + \ \cdots\  + \ k(k\  + \ 1) = \frac{1}{3}k(k\  + \ 1)(k\  + \ 2)$$                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$WTP:\ 1(2) + \ 2(3) + \ 3(4) + \ \cdots\  + \ k(k\  + \ 1) + \ (k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right)$$                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}(k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right)\left( (k\  + \ 1) + \ 2 \right)$$                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}(k\  + \ 1)(k\  + \ 2)(k\  + \ 3)$$                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = 1(2) + \ 2(3) + \ 3(4) + \ \cdots\  + \ k(k\  + \ 1)\  + \ (k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right)$$                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}k(k\  + \ 1)(k\  + \ 2) + \ (k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right),\ using\ assumption$$                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}k(k\  + \ 1)(k\  + \ 2) + \ (k\  + \ 1)(k\  + \ 2)$$                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)(k\  + \ 2)\left( \frac{1}{3}k\  + \ 1 \right)$$                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}(k\  + \ 1)(k\  + \ 2)(k\  + \ 3)$$                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| f.  $\$                                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                             |
| $$9\  + \ 14\  + \ 19\  + \ ...\  + \ (5n\  + \ 4) = \frac{5n^{2} + \ 13n}{2}\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                             |
| Test $n\  = \ 1$                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 9\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \frac{5\left( 1^{2} \right) + \ 13(1)}{2} = \ 9$$                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$9\  + \ 14\  + \ 19\  + \ \cdots\  + \ (5k\  + \ 4) = \frac{5k^{2} + \ 13k}{2}$$                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$WTP:\ 9\  + \ 14\  + \ 19\  + \ \cdots\  + \ (5k\  + \ 4) + \ \left\lbrack 5(k\  + \ 1) + \ 4 \right\rbrack = \frac{5(k\  + \ 1)^{2} + \ 13(k\  + \ 1)}{2}$$                                                                                                                              |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \frac{5k^{2} + \ 23k\  + \ 18}{2}$$              |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ \lbrack 9\  + \ 14\  + \ 19\  + \ \cdots\  + \ (5k\  + \ 4)\rbrack\  + \ (5k\  + \ 9)$$                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{5k^{2} + \ 13k}{2} + \ 5k\  + \ 9,using\ assumption$$                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{5k^{2} + \ 13k\  + \ 2(5k\  + \ 9)}{2}$$                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{5k^{2} + \ 23k\  + \ 18}{2}$$                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| g.                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$2(1!) + \ 5(2!) + \ 10(3!) + \ \cdots\  + \ \left( n^{2} + 1 \right)n!\  = \ n(n + 1)!\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                             |
| Test $n\  = \ 1$                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 2(1!)\  = \ 2\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ 1(1\  + \ 1)!\  = \ 2!\  = \ 2$$                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$2(1!) + \ 5(2!) + \ 10(3!) + \ \cdots\  + \ \left( k^{2} + \ 1 \right)k!\  = \ k(k\  + \ 1)!$$                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$WTP:\ 2(1!) + \ 5(2!) + \ 10(3!) + \ \cdots\  + \ \left( k^{2} + \ 1 \right)k!\  + \ \left( (k\  + \ 1)^{2} + \ 1 \right)(k\  + \ 1)!\ $$                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \  = \ (k\  + \ 1)(k\  + \ 2)!$$                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 2(1!) + \ 5(2!) + \ 10(3!) + \ \cdots\  + \ (k²\  + \ 1)k!\  + \ ((k\  + \ 1)²\  + \ 1)(k\  + \ 1)!$$                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ k(k\  + \ 1)!\  + \ ((k\  + \ 1)²\  + \ 1)(k\  + \ 1)!,\ using\ assumption$$                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)!(k\  + \ ((k\  + \ 1)²\  + \ 1))$$                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)!(k\  + \ (k²\  + \ 2k\  + \ 1\  + \ 1))$$                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)!(k²\  + \ 3k\  + \ 2)$$                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)!(k\  + \ 1)(k\  + \ 2)$$                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)(k\  + \ 2)(k\  + \ 1)!$$                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)(k\  + \ 2)!$$                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| h.                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$\ 5 + 11 + 19\ \cdots\  + (8k - 3) = n(4n + 1)\ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Test $n\  = \ 1$                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 5\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ 1\left( 4(1) + \ 1 \right) = \ 5$$                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$5\  + \ 11\  + \ 19\  + \ \cdots\  + \ (8k\  - \ 3)\  = \ k(4k\  + \ 1)$$                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$WTP:\ 5\  + \ 11\  + \ 19\  + \ \cdots\  + \ (8k\  - \ 3) + \ \left( 8(k\  + \ 1) - \ 3 \right) = \ (k\  + \ 1)\left( 4(k\  + \ 1) + \ 1 \right)$$                                                                                                                                        |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)(4k\  + \ 5)$$                    |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ \lbrack 5\  + \ 11\  + \ 19\  + \ \cdots\  + \ (8k\  - \ 3)\rbrack\  + \ (8k\  + \ 5)$$                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ k(4k\  + \ 1)\  + \ (8k\  + \ 5),\ using\ assumption$$                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 4k²\  + \ 9k\  + \ 5$$                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)(4k\  + \ 5)$$                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| i.                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$\frac{1}{2!} + \frac{2}{3!} + \frac{3}{4!} + \ \cdots\  + \frac{n}{(n + 1)!} = \ 1\  - \frac{1}{(n + 1)!}\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                               |
|                                                                                                                                                                                                                                                                                             |
| Test $n\  = \ 1$                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \frac{1}{2!} = \frac{1}{2}\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ 1\  - \ \left( \frac{1}{(1\  + \ 1)!} \right) = \ 1\  - \frac{1}{2!} = \ 1\  - \frac{1}{2} = \frac{1}{2}$$                                                                                              |
|                                                                                                                                                                                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$\left( \frac{1}{2!} \right) + \ \left( \frac{2}{3!} \right) + \ \left( \frac{3}{4!} \right) + \ \cdots\  + \ \left( \frac{k}{(k + 1)!} \right) = \ 1\  - \ \left( \frac{1}{(k + 1)!} \right)$$                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$WTP:\ \left( \frac{1}{2!} \right) + \ \left( \frac{2}{3!} \right) + \ \left( \frac{3}{4!} \right) + \ \cdots\  + \ \left( \frac{k}{(k + 1)!} \right) + \ \left( \frac{k + 1}{(k + 2)!} \right) = \ 1\  - \ \left( \frac{1}{(k + 2)!} \right)$$                                            |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ \left( \frac{1}{2!} \right) + \ \left( \frac{2}{3!} \right) + \ \left( \frac{3}{4!} \right) + \ \cdots\  + \ \left( \frac{k}{(k\  + \ 1)!} \right) + \ \left( \frac{k\  + \ 1}{(k\  + \ 2)!} \right)$$                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 1\  - \ \left( \frac{1}{(k + 1)!} \right) + \frac{k + 2}{(k + 2)!},\ using\ assumption$$                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 1\  - \frac{k + 2}{(k\  + \ 2)(k\  + \ 1)!} + \ \left( \frac{k\  + \ 1}{(k\  + \ 2)!} \right)$$                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 1\  - \frac{k\  + \ 2}{(k\  + \ 2)!} + \ \left( \frac{k\  + \ 1}{(k\  + \ 2)!} \right)$$                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 1\  - \ \left( \frac{1}{(k\  + \ 2)!} \right)$$                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| j.                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$1(3) + \ 2(4) + \ 3(5) + \ \cdots\  + \ n(n + 2) = \frac{1}{6}n(n + 1)(2n + 7)\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| Test $n\  = \ 1$                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 1\  \times \ 3\  = \ 3\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \frac{1}{6}(1)(1\  + \ 1)(2\  + \ 7) = \frac{1}{6} \times \ 1\  \times \ 2\  \times \ 9\  = \ 3$$                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$1(3) + \ 2(4) + \ 3(5) + \ \cdots\  + \ \ k(k\  + \ 2) = \frac{1}{6}k(k\  + \ 1)(2k\  + \ 7)$$                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$WTP:\ 1(3) + \ 2(4) + \ 3(5) + \ \cdots\  + \ \ k(k\  + \ 2) + \ (k\  + \ 1)\left( (k\  + \ 1) + \ 2 \right)$$                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{6}(k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right)\left( 2(k\  + \ 1) + \ 7 \right)$$                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \  = \ \frac{1}{6}(k\  + \ 1)(k\  + \ 2)(2k\  + \ 9)$$                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                             |
| $$LHS\  = \ 1(3) + \ 2(4) + \ 3(5) + \ \cdots\  + \ \ k(k\  + \ 2)\  + \ (k\  + \ 1)\left( (k\  + \ 1) + \ 2 \right)$$                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{6}k(k\  + \ 1)(2k\  + \ 7) + \ (k\  + \ 1)\left( (k\  + \ 1) + \ 2 \right),\ using\ assumption$$                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{6}k(k\  + \ 1)(2k\  + \ 7) + \ (k\  + \ 1)(k\  + \ 3)$$                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)\left( \frac{1}{6}k(2k\  + \ 7) + \ k\  + \ 3 \right)\ $$                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{6}(k\  + \ 1)\left( k(2k\  + \ 7) + \ 6k\  + \ 18 \right)$$                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{6}(k\  + \ 1)\left( 2k^{2} + \ 7k\  + \ 6k\  + \ 18 \right)$$                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{6}(k\  + \ 1)\left( 2k^{2} + \ 13k\  + \ 18 \right)$$                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{6}(k\  + \ 1)(k\  + \ 2)(2k\  + \ 9)$$                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| k.                                                                                                                                                                                                          |
|                                                                                                                                                                                                             |
| $$1^{2} + \ 3^{2} + \ 5^{2} + \ \cdots\  + \ (2n - 1)^{2} = \frac{1}{3}n(2n - 1)(2n + 1)\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                                                                  |
|                                                                                                                                                                                                             |
| Test $n\  = \ 1$                                                                                                                                                                                            |
|                                                                                                                                                                                                             |
| $$LHS\  = \ 1\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ \left( \frac{1}{3} \right)(1)\left( 2(1) - \ 1 \right)\left( 2(1) + \ 1 \right) = \frac{1}{3} \times \ 1\  \times \ 1\  \times \ 3\  = \ 1$$ |
|                                                                                                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                                                                                                      |
|                                                                                                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                                                                                                 |
|                                                                                                                                                                                                             |
| $$1^{2} + \ 3^{2} + \ 5^{2} + \ \cdots\  + \ (2k\  - \ 1)^{2} = \frac{1}{3}k(2k\  - \ 1)(2k\  + \ 1)$$                                                                                                      |
|                                                                                                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                                                   |
|                                                                                                                                                                                                             |
| $$WTP:\ 1^{2} + \ 3^{2} + \ 5^{2} + \ \cdots\  + \ (2k\  - \ 1)^{2} + \ \left( 2(k\  + \ 1) - \ 1 \right)^{2}$$                                                                                             |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \  = \frac{1}{3}(k\  + \ 1)\left( 2(k\  + \ 1) - \ 1 \right)\left( 2(k\  + \ 1) + \ 1 \right)$$                                                                                             |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \  = \frac{1}{3}(k\  + \ 1)(2k\  + \ 1)(2k\  + \ 3)$$                                                                                                                                       |
|                                                                                                                                                                                                             |
| $$LHS\  = \ 1²\  + \ 3²\  + \ 5²\  + \ \cdots\  + \ (2k\  - \ 1)²\  + \ \left( 2(k\  + \ 1) - \ 1 \right)^{2}$$                                                                                             |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{3}k(2k\  - \ 1)(2k\  + \ 1) + \ \left( 2(k\  + \ 1) - \ 1 \right)^{2},\ using\ assumption$$                                                                             |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{3}k(2k\  - \ 1)(2k\  + \ 1) + \ (2k\  + \ 2\  - \ 1)^{2}$$                                                                                                              |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{3}k(2k\  - \ 1)(2k\  + \ 1) + \ (2k\  + \ 1)^{2}$$                                                                                                                      |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (2k\  + \ 1)\left( \frac{1}{3}k(2k\  - \ 1) + \ (2k\  + \ 1) \right)$$                                                                                                           |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}(2k\  + \ 1)\left( k(2k\  - \ 1) + \ 3(2k\  + \ 1) \right)$$                                                                                                            |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}(2k\  + \ 1)\left( 2k^{2} - \ k\  + \ 6k\  + \ 3 \right)$$                                                                                                              |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}(2k\  + \ 1)\left( 2k^{2} + \ 5k\  + \ 3 \right)$$                                                                                                                      |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}(2k\  + \ 1)(k\  + \ 1)(2k\  + \ 3)$$                                                                                                                                   |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{3}(k\  + \ 1)(2k\  + \ 1)(2k\  + \ 3)$$                                                                                                                                   |
|                                                                                                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                                            |
|                                                                                                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                                        |
+=============================================================================================================================================================================================================+

Mastery

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| l.  $\$                                                                                                                                                                             |
|                                                                                                                                                                                     |
| $$9\  + \ 27\  + \ 81\  + \ ...\  + \ 3^{n} = \frac{9\left( 3^{n - 1} - \ 1 \right)}{2}\ \ \ \ \ for\ all\ n\  \geq \ 2\ \ \ \ \  \leftarrow \ The\ base\ case\ is\ n = 2$$         |
|                                                                                                                                                                                     |
| Test $n\  = \ 2$                                                                                                                                                                    |
|                                                                                                                                                                                     |
| $$LHS\  = \ 3^{2} = \ 9\ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \frac{9\left( 3^{2 - 1} - \ 1 \right)}{2} = \ 9$$                                                                        |
|                                                                                                                                                                                     |
| ∴ True for $n\  = \ 2$                                                                                                                                                              |
|                                                                                                                                                                                     |
| Assume true for $n\  = \ k$                                                                                                                                                         |
|                                                                                                                                                                                     |
| $$9\  + \ 27\  + \ 81\  + \ \cdots\  + \ 3ᵏ\  = \frac{9\left( 3^{k - 1} - \ 1 \right)}{2}$$                                                                                         |
|                                                                                                                                                                                     |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                           |
|                                                                                                                                                                                     |
| $$WTP:\ 9\  + \ 27\  + \ 81\  + \ \cdots\  + \ 3ᵏ\  + \ 3^{k + 1} = \frac{9(3ᵏ\  - \ 1)}{2}$$                                                                                       |
|                                                                                                                                                                                     |
| $$LHS\  = \ \lbrack 9\  + \ 27\  + \ 81\  + \ \cdots\  + \ 3ᵏ\rbrack\  + \ 3^{k + 1}$$                                                                                              |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{9\left( 3^{k - 1} - \ 1 \right)}{2} + \ 3^{k + 1},\ using\ assumption$$                                                                              |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{9\left( 3^{k - 1} - \ 1 \right) + \ 2\  \times \ 3^{k + 1}}{2}$$                                                                                     |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{3\  \times \ 3ᵏ\  - \ 9\  + \ 6\  \times \ 3ᵏ}{2}$$                                                                                                  |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{9\  \times \ 3ᵏ\  - \ 9}{2}$$                                                                                                                        |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{9(3ᵏ\  - \ 1)}{2}$$                                                                                                                                  |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                    |
|                                                                                                                                                                                     |
| Since true for $n = 2$, by mathematical induction, true for all integers $n \geq 2$.                                                                                                |
+=====================================================================================================================================================================================+
| m.                                                                                                                                                                                  |
|                                                                                                                                                                                     |
| $$\ 1\left( 2^{2} \right) + \ 2\left( 3^{2} \right) + \ 3\left( 4^{2} \right) + \ \cdots\  + \ n(n + 1)^{2} = \frac{1}{12}n(n + 1)(n + 2)(3n + 5)\ \ \ \ \ for\ all\ n\  \geq \ 1$$ |
|                                                                                                                                                                                     |
| Test $n\  = \ 1$                                                                                                                                                                    |
|                                                                                                                                                                                     |
| $$LHS\  = \ 1\  \times \ 2^{2} = \ 4\ \ \ \ \ \ RHS\  = \ \left( \frac{1}{12} \right)(1)(1\  + \ 1)(1\  + \ 2)(3\  + \ 5) = \ 4$$                                                   |
|                                                                                                                                                                                     |
| ∴ True for $n\  = \ 1$                                                                                                                                                              |
|                                                                                                                                                                                     |
| Assume true for $n\  = \ k$                                                                                                                                                         |
|                                                                                                                                                                                     |
| $$1\  \times \ 2²\  + \ 2\  \times \ 3²\  + \ 3\  \times \ 4²\  + \ \cdots\  + \ k(k\  + \ 1)²\  = \frac{1}{12}k(k\  + \ 1)(k\  + \ 2)(3k\  + \ 5)$$                                |
|                                                                                                                                                                                     |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                           |
|                                                                                                                                                                                     |
| $$WTP:\ 1\  \times \ 2^{2} + \ 2\  \times \ 3^{2} + \ 3\  \times \ 4^{2} + \ \cdots\  + \ k(k\  + \ 1)^{2} + \ (k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right)^{2}$$                    |
|                                                                                                                                                                                     |
| $$\ \ \ \ \  = \frac{1}{12}(k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right)\left( (k\  + \ 1) + \ 2 \right)\left( 3(k\  + \ 1) + \ 5 \right)$$                                           |
|                                                                                                                                                                                     |
| $$\ \ \ \ \  = \frac{1}{12}(k\  + \ 1)(k\  + \ 2)(k\  + \ 3)(3k\  + \ 8)\ $$                                                                                                        |
|                                                                                                                                                                                     |
| $$LHS\  = \ 1\  \times \ 2^{2} + \ 2\  \times \ 3^{2} + \ 3\  \times \ 4^{2} + \ \cdots\  + \ k(k\  + \ 1)^{2} + \ (k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right)^{2}$$                |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{12}k(k\  + \ 1)(k\  + \ 2)(3k\  + \ 5) + \ (k\  + \ 1)\left( (k\  + \ 1) + \ 1 \right)^{2},\ using\ assumption\ $$                              |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{12}k(k\  + \ 1)(k\  + \ 2)(3k\  + \ 5) + \ (k\  + \ 1)(k\  + \ 2)^{2}$$                                                                         |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k\  + \ 1)(k\  + \ 2)\left( \frac{1}{12}k(3k\  + \ 5) + \ (k\  + \ 2) \right)\ $$                                                                       |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{12}(k\  + \ 1)(k\  + \ 2)\left( k(3k\  + \ 5) + \ 12(k\  + \ 2) \right)\ $$                                                                     |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{12}(k\  + \ 1)(k\  + \ 2)\left( 3k^{2} + \ 5k\  + \ 12k\  + \ 24 \right)\ $$                                                                    |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{1}{12}(k\  + \ 1)(k\  + \ 2)\left( 3k^{2} + \ 17k\  + \ 24 \right)\ $$                                                                               |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \ \frac{1}{12}(k\  + \ 1)(k\  + \ 2)(k\  + \ 3)(3k\  + \ 8)\ $$                                                                                            |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                    |
|                                                                                                                                                                                     |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| n.  $\$                                                                                                                                                                             |
|                                                                                                                                                                                     |
| $$- 4\  + \ 8\  - \ 16\  + \ ...\  - \ 4( - 2)^{n - 1} = \frac{4\left\lbrack ( - 2)^{n} - \ 1 \right\rbrack}{3}\ \ \ \ \ for\ all\ n\  \geq \ 1$$                                   |
|                                                                                                                                                                                     |
| Test $n\  = \ 1$                                                                                                                                                                    |
|                                                                                                                                                                                     |
| $$LHS\  = \  - 4\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \frac{4\left( ( - 2)^{1} - \ 1 \right)}{3} = \  - 4$$                                                               |
|                                                                                                                                                                                     |
| ∴ True for $n\  = \ 1$                                                                                                                                                              |
|                                                                                                                                                                                     |
| Assume true for $n\  = \ k$                                                                                                                                                         |
|                                                                                                                                                                                     |
| $$- 4\  + \ 8\  - \ 16\  + \ \cdots\  - \ 4( - 2)^{k - 1} = \frac{4\left( ( - 2)ᵏ\  - \ 1 \right)}{3}$$                                                                             |
|                                                                                                                                                                                     |
| Prove $n\  = \ k\  + \ 1$                                                                                                                                                           |
|                                                                                                                                                                                     |
| $$WTP:\  - 4\  + \ 8\  - \ 16\  + \ \cdots\  - \ 4( - 2)^{k - 1} - \ 4( - 2)ᵏ\  = \frac{4\left( ( - 2)^{k + 1} - \ 1 \right)}{3}$$                                                  |
|                                                                                                                                                                                     |
| $$LHS\  = \ \left\lbrack - 4\  + \ 8\  - \ 16\  + \ \cdots\  - \ 4( - 2)^{k - 1} \right\rbrack - \ 4( - 2)ᵏ$$                                                                       |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{4\left( ( - 2)ᵏ\  - \ 1 \right)}{3} - \ 4( - 2)ᵏ,\ using\ assumption$$                                                                               |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{4\left\lbrack ( - 2)ᵏ\  - \ 1 \right\rbrack - \ 3\  \times \  - 4( - 2)ᵏ}{3}$$                                                                       |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{4^{2}( - 2)ᵏ\  - \ 4}{3}$$                                                                                                                           |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{4( - 2)^{k + 1} - \ 4}{3}$$                                                                                                                          |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \frac{4\left\lbrack ( - 2)^{k + 1} - \ 1 \right\rbrack}{3}$$                                                                                               |
|                                                                                                                                                                                     |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                                                                                    |
|                                                                                                                                                                                     |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                                                                                |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------+
| o.  $\$                                                                                                                    |
|                                                                                                                            |
| $$1\  + \ 27\  + \ 125\  + \ ...\  + \ (2n\  - \ 1)^{3} = \ n^{2}\left( 2n^{2} - \ 1 \right)\ \ \ for\ all\ n\  \geq \ 1$$ |
|                                                                                                                            |
| Test $n\  = \ 1$                                                                                                           |
|                                                                                                                            |
| $$LHS\  = \ 1\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ RHS\  = \ 1^{2}\left( 2\  \times \ 1^{2} - \ 1 \right) = \ 1$$        |
|                                                                                                                            |
| ∴ True for $n\  = \ 1$                                                                                                     |
|                                                                                                                            |
| Assume true for $n\  = \ k$                                                                                                |
|                                                                                                                            |
| $$1\  + \ 27\  + \ 125\  + \ \cdots\  + \ (2k\  - \ 1)³\  = \ k^{2}\left( 2k^{2} - \ 1 \right)$$                           |
|                                                                                                                            |
| Prove $n\  = \ k\  + \ 1$                                                                                                  |
|                                                                                                                            |
| $$WTP:\ 1\  + \ 27\  + \ 125\  + \ \cdots\  + \ (2k\  - \ 1)^{3} + \ \left( 2(k\  + \ 1) - \ 1 \right)^{3}$$               |
|                                                                                                                            |
| $$\ \ \ \ \ \ \  = \ (k\  + \ 1)^{2}\left( 2(k\  + \ 1)^{2} - \ 1 \right)$$                                                |
|                                                                                                                            |
| $$\ \ \ \ \ \ \  = \ 2k^{4} + 8k^{3} + 11k^{2} + 6k + 1$$                                                                  |
|                                                                                                                            |
| $$LHS\  = \ \lbrack 1\  + \ 27\  + \ 125\  + \ \cdots\  + \ (2k\  - \ 1)³\rbrack\  + \ (2k\  + \ 1)^{3}$$                  |
|                                                                                                                            |
| $$\ \ \ \ \ \ \ \ \ \  = \ k^{2}\left( 2k^{2} - \ 1 \right) + \ (2k\  + \ 1)^{3},\ using\ assumption$$                     |
|                                                                                                                            |
| $$\ \ \ \ \ \ \ \ \ \  = \ 2k^{4} - \ k^{2} + \ 8k^{3} + \ 12k^{2} + \ 6k\  + \ 1$$                                        |
|                                                                                                                            |
| $$\ \ \ \ \ \ \ \ \ \  = \ 2k^{4} + \ 8k^{3} + \ 11k^{2} + \ 6k\  + \ 1$$                                                  |
|                                                                                                                            |
| $$\ \ \ \ \ \ \ \ \ \  = \ RHS$$                                                                                           |
|                                                                                                                            |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                       |
+============================================================================================================================+

# Proofs of Divisibility

+-------------------------------------------------------------------+
| - **Proof by Mathematical Induction**                             |
+===================================================================+
| We can use mathematical induction to prove statements where $n$   |
| is a positive whole number.                                       |
|                                                                   |
| 1\. Test the base case, usually $n = 1$                           |
|                                                                   |
| 2\. Assume $n = k$ is true.                                       |
|                                                                   |
| 3\. Prove $n = k + 1$ is true.                                    |
|                                                                   |
| 4\. State proof by induction.                                     |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Example** Prove divisibility by mathematical induction.       |
+===================================================================+
| Prove by mathematical induction:                                  |
|                                                                   |
| $$4^{n} - 1\ is\ divisible\ by\ 3\ for\ n = 1,2,3\ldots$$         |
|                                                                   |
| 1\. Test $n = 1$                                                  |
|                                                                   |
| $LHS = 4 - 1 = 3$                                                 |
|                                                                   |
| $\therefore$ True for $n = 1$                                     |
|                                                                   |
| 2\. Assume true for $n = k$                                       |
|                                                                   |
| $4^{k} - 1 = 3p$, where $p$ is an integer.                        |
|                                                                   |
| 3\. Prove $n = k + 1$                                             |
|                                                                   |
| $WTP:\ \ 4^{k + 1} - 1 = 3q,\$where $q$ is an integer.            |
|                                                                   |
| $$LHS = 4^{k + 1} - 1$$                                           |
|                                                                   |
| $= 12q + 4 - 1$                                                   |
|                                                                   |
| $= 12q + 3$                                                       |
|                                                                   |
| $= 3(4p + 1)$, since $p$ is an integer, $4p + 1$ is also an       |
| integer.                                                          |
|                                                                   |
| $= 3q$, where $q$ is an integer                                   |
|                                                                   |
| 4\. State proof by mathematical induction                         |
|                                                                   |
| Since true for $n = 1$, by mathematical induction, true for all   |
| integers $n \geq 1$.                                              |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Practice**                                                    |
+===================================================================+
| Prove by mathematical induction:                                  |
|                                                                   |
| $$n(n + 1)\ is\ divisible\ by\ 2\ for\ n = 1,2,3\ldots$$          |
|                                                                   |
| 1\. Test $n = 1$                                                  |
|                                                                   |
| 2\. Assume $n = k$                                                |
|                                                                   |
| 3\. Prove $n = k + 1$                                             |
|                                                                   |
| 4\. State proof by mathematical induction                         |
+-------------------------------------------------------------------+
| Prove by mathematical induction:                                  |
|                                                                   |
| $$4^{n} + 14\ is\ a\ multiple\ of\ 6\ for\ n = 1,2,3\ldots$$      |
+-------------------------------------------------------------------+

Foundation

1.  Prove by mathematical induction.

+-----------------------------------------------------------------------------------------------------------------------------+
| a.  $7ⁿ\  - \ 1\$is divisible by$\ 6\$for all positive integers$\ n$                                                        |
|                                                                                                                             |
| Test $n\  = \ 1$                                                                                                            |
|                                                                                                                             |
| $$LHS\  = \ 7¹\  - \ 1\  = \ 6$$                                                                                            |
|                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                      |
|                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                 |
|                                                                                                                             |
| $7^{k} - \ 1\  = \ 6p$, where $p$ is an integer.                                                                            |
|                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                   |
|                                                                                                                             |
| $WTP:\ 7^{k + 1} - \ 1 = 6q$, where $q$ is an integer.                                                                      |
|                                                                                                                             |
| $$LHS\  = \ 7^{k + 1} - \ 1$$                                                                                               |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = 7 \times 7^{k} - 1$$                                                                               |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = 7(6p + 1) - 1$, using assumption.                                                                   |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = 42p + 7 - 1$$                                                                                      |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = 42p + 6$$                                                                                          |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = 6(7p + 1)$, since $p$ is an integer, $7p + 1$ is also an integer.                                   |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = 6q$, where $q$ is an integer.                                                                       |
|                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                        |
+=============================================================================================================================+
| b.  $5ⁿ\  - \ 1\$is divisible by$\ 4\$for all integers$\ n\  \geq \ 1$                                                      |
|                                                                                                                             |
| Test $n\  = \ 1$                                                                                                            |
|                                                                                                                             |
| $$LHS\  = \ 5¹\  - \ 1\  = \ 4$$                                                                                            |
|                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                      |
|                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                 |
|                                                                                                                             |
| $5^{k} - \ 1\  = \ 4p$, where $p$ is an integer.                                                                            |
|                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                   |
|                                                                                                                             |
| $WTP:\ 5^{k + 1} - \ 1\  = \ 4q$, where $q$ is an integer.                                                                  |
|                                                                                                                             |
| $$LHS\  = \ 5^{k + 1} - \ 1$$                                                                                               |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 5\  \times \ 5^{k} - \ 1$$                                                                       |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 5(4p\  + \ 1) - \ 1,$ using assumption                                                            |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 20p\  + \ 5\  - \ 1$$                                                                            |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 20p\  + \ 4$$                                                                                    |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 4(5p\  + \ 1),\$since$\ p$ is an integer,$\ 5p\  + \ 1\$is also an integer.                       |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 4q,\$where$\ q\$is an integer                                                                     |
|                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                        |
+-----------------------------------------------------------------------------------------------------------------------------+
| c.  $3^{2n} - \ 1\$is divisible by$\ 8\$for all integers$\ n\  \geq \ 1$                                                    |
|                                                                                                                             |
| Test $n\  = \ 1$                                                                                                            |
|                                                                                                                             |
| $$LHS\  = \ 3²\  - \ 1\  = \ 9\  - \ 1\  = \ 8$$                                                                            |
|                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                      |
|                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                 |
|                                                                                                                             |
| $3^{2k} - \ 1\  = \ 8p$, where $p$ is an integer.                                                                           |
|                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                   |
|                                                                                                                             |
| $WTP:\ 3^{2(k + 1)} - \ 1\  = \ 8q$, where $q$ is an integer.                                                               |
|                                                                                                                             |
| $$LHS\  = \ 3^{2k + 2} - \ 1$$                                                                                              |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 3^{2} \times \ 3^{2k} - \ 1$$                                                                    |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 9\  \times \ 3^{2k} - \ 1$$                                                                      |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 9(8p\  + \ 1) - \ 1,$ using assumption                                                            |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 72p\  + \ 9\  - \ 1$$                                                                            |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 72p\  + \ 8$$                                                                                    |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 8(9p\  + \ 1)$, since $p$ is an integer, $9p\  + \ 1$ is also an integer.                         |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 8q,$ where $q$ is an integer                                                                      |
|                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                        |
+-----------------------------------------------------------------------------------------------------------------------------+
| d.  Fill in the gaps.                                                                                                       |
|                                                                                                                             |
| Prove $3^{2n} - \ 1\$is divisible by$\ 8\$for all integers$\ n\  \geq \ 1$                                                  |
|                                                                                                                             |
| ......... $n\  = \ 1$:                                                                                                      |
|                                                                                                                             |
| Test                                                                                                                        |
|                                                                                                                             |
| $$LHS\  = \ 3²\  - \ 1\  = \ 9\  - \ 1\  = \ 8$$                                                                            |
|                                                                                                                             |
| ∴ ......... ...... $n\  = \ 1$                                                                                              |
|                                                                                                                             |
| True for                                                                                                                    |
|                                                                                                                             |
| ............ ......... ......... $n\  = \ k$:                                                                               |
|                                                                                                                             |
| Assume true for                                                                                                             |
|                                                                                                                             |
| $3^{2k} - \ 1\  = \ 8p$, where ...... ...... ..................                                                             |
|                                                                                                                             |
| $k$ is an integer                                                                                                           |
|                                                                                                                             |
| ......... ......... ......... $n\  = \ k\  + \ 1$:                                                                          |
|                                                                                                                             |
| Prove true for                                                                                                              |
|                                                                                                                             |
| .........$:\ 3^{2(k + 1)} - \ 1\  = \ 8q$, ............ ...... ...... ..................                                    |
|                                                                                                                             |
| WTP: where $q$ is an integer                                                                                                |
|                                                                                                                             |
| ...... $= \ 3^{2k + 2} - \ 1$                                                                                               |
|                                                                                                                             |
| LHS                                                                                                                         |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 3^{2} \times \ 3^{2k} - \ 1$$                                                                    |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 9\  \times \ 3^{2k} - \ 1$$                                                                      |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 9(8p\  + \ 1) - \ 1,$ ............ .....................                                          |
|                                                                                                                             |
| Using asummption                                                                                                            |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 72p\  + \ 9\  - \ 1$$                                                                            |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 72p\  + \ 8$$                                                                                    |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 8(9p\  + \ 1)$, since $p$ ........................, .................. is also                    |
| ........................                                                                                                    |
|                                                                                                                             |
| is an integer, $9p + 1$ is also an integer                                                                                  |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 8q,$ ............ ...... ...... ..................                                                |
|                                                                                                                             |
| Where $q$ is an integer                                                                                                     |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                        |
+-----------------------------------------------------------------------------------------------------------------------------+
| e.  $3^{2n} + \ 7\$is divisible by$\ 8\$for all integers$\ n\  \geq \ 1$                                                    |
|                                                                                                                             |
| Test $n\  = \ 1$                                                                                                            |
|                                                                                                                             |
| $$LHS\  = \ 3²\  + \ 7\  = \ 9\  + \ 7\  = \ 16$$                                                                           |
|                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                      |
|                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                 |
|                                                                                                                             |
| $3^{2k} + \ 7\  = \ 8p$, where $p$ is an integer.                                                                           |
|                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                   |
|                                                                                                                             |
| $WTP:\ 3^{2(k + 1)} + \ 7\  = \ 8q$, where $q$ is an integer.                                                               |
|                                                                                                                             |
| $$LHS\  = \ 3^{2k + 2} + \ 7$$                                                                                              |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 9\  \times \ 3^{2k} + \ 7$$                                                                      |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 9(8p\  - \ 7) + \ 7,$ using assumption                                                            |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 72p\  - \ 63\  + \ 7$$                                                                           |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 72p\  - \ 56$$                                                                                   |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 8(9p\  - \ 7),$ since $p$ is an integer, $9p\  - \ 7$ is also an integer.                         |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 8q$, where $q$ is an integer                                                                      |
|                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                        |
+-----------------------------------------------------------------------------------------------------------------------------+
| f.  $5^{2n} - \ 1\$is divisible by$\ 24\$for all integers$\ n\  \geq \ 1$                                                   |
|                                                                                                                             |
| Test $n\  = \ 1$                                                                                                            |
|                                                                                                                             |
| $$LHS\  = \ 5^{2} - \ 1\  = \ 25\  - \ 1\  = \ 24$$                                                                         |
|                                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                                      |
|                                                                                                                             |
| Assume true for $n\  = \ k$                                                                                                 |
|                                                                                                                             |
| $5^{2k} - \ 1\  = \ 24p$, where $p$ is an integer.                                                                          |
|                                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                                   |
|                                                                                                                             |
| $WTP:\ 5^{2(k + 1)} - \ 1\  = \ 24q$, where $q$ is an integer.                                                              |
|                                                                                                                             |
| $$LHS\  = \ 5^{2k + 2} - \ 1$$                                                                                              |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 5^{2} \times \ 5^{2k} - \ 1$$                                                                    |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 25\  \times \ 5^{2k} - \ 1$$                                                                     |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 25(24p\  + \ 1) - \ 1,$ using assumption                                                          |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 600p\  + \ 25\  - \ 1$$                                                                          |
|                                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 600p\  + \ 24$$                                                                                  |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 24(25p\  + \ 1),$ since $p$ is an integer, $25p\  + \ 1$ is also an integer.                      |
|                                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 24q$, where $q$ is an integer                                                                     |
|                                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                                        |
+-----------------------------------------------------------------------------------------------------------------------------+

Development

+-------------------------------------------------------------------------------------------------------------+
| g.  $n^{3} + \ 2n\$is divisible by$\ 3\$for all integers$\ n\  \geq \ 0$                                    |
|                                                                                                             |
| Test $n\  = \ 0$                                                                                            |
|                                                                                                             |
| $$LHS\  = \ 0^{3} + \ 2(0) = \ 0$$                                                                          |
|                                                                                                             |
| ∴ True for $n\  = \ 0$                                                                                      |
|                                                                                                             |
| Assume true for $n\  = \ k$                                                                                 |
|                                                                                                             |
| $k³\  + \ 2k\  = \ 3p$, where $p$ is a an integer.                                                          |
|                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                   |
|                                                                                                             |
| $WTP:\ (k\  + \ 1)³\  + \ 2(k\  + \ 1)\  = \ 3q$, where $q$ is an integer.                                  |
|                                                                                                             |
| $$LHS\  = \ (k\  + \ 1)³\  + \ 2(k\  + \ 1)$$                                                               |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ k^{3} + \ 3k^{2} + \ 3k\  + \ 1\  + \ 2k\  + \ 2$$                               |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ k^{3} + \ 2k\  + \ 3k^{2} + \ 3k\  + \ 3$$                                       |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ (k³\  + \ 2k)\  + \ 3k^{2} + \ 3k\  + \ 3$$                                      |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 3p\  + 3k^{2} + \ 3k\  + \ 3,$ using assumption                                   |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 3\left( p\  + \ k^{2} + \ k\  + \ 1 \right)$, since $p$ and $k$ are integers,\    |
| $p\  + \ k^{2} + \ k\  + \ 1$ is also an integer.                                                           |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 3q$, where $q$ is an integer                                                      |
|                                                                                                             |
| Since true for $n = 0$, by mathematical induction, true for all integers $n \geq 0$.                        |
+=============================================================================================================+
| h.  $9ⁿ\  + \ 3\$is divisible by$\ 6\$for all integers$\ n\  \geq \ 1$                                      |
|                                                                                                             |
| Test $n\  = \ 1$                                                                                            |
|                                                                                                             |
| $$LHS\  = \ 9^{1} + \ 3\  = \ 9\  + \ 3\  = \ 12 = 6(2)$$                                                   |
|                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                      |
|                                                                                                             |
| Assume true for $n\  = \ k$                                                                                 |
|                                                                                                             |
| $9^{k} + \ 3\  = \ 6p$, where $p$ is an integer.                                                            |
|                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                   |
|                                                                                                             |
| $WTP:\ 9^{k + 1} + \ 3\  = \ 6q$, where $q$ is an integer.                                                  |
|                                                                                                             |
| $$LHS\  = \ 9^{k + 1} + \ 3$$                                                                               |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 9\  \times \ 9^{k} + \ 3$                                                         |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 9(6p\  - \ 3)\  + \ 3,$ using assumption                                          |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 54p\  - \ 27\  + \ 3\$                                                            |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 54p\  - \ 24$$                                                                   |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 6(9p\  - \ 4),$ since $p$ is an integer, $9p\  - \ 4$ is also an integer.         |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 6q,$ where $q$ is an integer                                                      |
|                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                        |
+-------------------------------------------------------------------------------------------------------------+
| i.  Consider the two proofs for "$5ⁿ\  + \ 3ⁿ\$is even for all positive integers $n$", shown below.         |
|                                                                                                             |
| Test $n\  = \ 1$                                                                                            |
|                                                                                                             |
| $$LHS\  = \ 5^{1} + \ 3^{1} = \ 5\  + \ 3\  = \ 8 = 2(4)$$                                                  |
|                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                      |
|                                                                                                             |
| Assume true for $n\  = \ k$                                                                                 |
|                                                                                                             |
| $5^{k} + \ 3^{k} = \ 2p,$ where $p$ is an integer.                                                          |
|                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                   |
|                                                                                                             |
| $WTP:\ 5^{k + 1} + \ 3^{k + 1} = \ 2q$, where $q$ is an integer.                                            |
|                                                                                                             |
| **Method 1:**                                                                                               |
|                                                                                                             |
| $$LHS\  = \ 5^{k + 1} + \ 3^{k + 1}$$                                                                       |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 5 \cdot 5^{k} + \ 3 \cdot 3^{k}$$                                                |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 2 \cdot 5^{k} + 3 \cdot 5^{k} + 3 \cdot 3^{k}$$                                  |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 2 \cdot 5^{k} + 3\left( 5^{k} + \ 3^{k} \right)$$                                |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 2 \cdot 5^{k} + 3(2p),$ using assumption                                          |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 2 \cdot 5^{k} + 6p$$                                                             |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 2\left( 5^{k} + 3p \right),$ since $5^{k}$ and $p$ are integers, $5^{k} + 3p$ is  |
| also an integer.                                                                                            |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 2q$, where $q$ is an integer.                                                     |
|                                                                                                             |
| **Method 2:**                                                                                               |
|                                                                                                             |
| $$LHS\  = \ 5^{k + 1} + \ 3^{k + 1}$$                                                                       |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 5 \cdot 5^{k} + \ 3 \cdot 3^{k}$$                                                |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 5\left( 2p - 3^{k} \right) + 3 \cdot 3^{k},$ using assumption                     |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 10p - 5 \cdot 3^{k} + 3 \cdot 3^{k}$$                                            |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 10p - 2 \cdot 3^{k}$$                                                            |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 2(5p - 3^{k})$ since $p$ and $3^{k}$ are positive integers, $5p - \ 3^{k}$ is     |
| also an integer.                                                                                            |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 2q$, where $q$ is an integer                                                      |
|                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.                        |
|                                                                                                             |
| What is the difference between the two methods, and which do you prefer?                                    |
|                                                                                                             |
| Method 1 splits the $5^{k + 1}$ and factors out the common term $\left( 5^{k} + \ 3^{k} \right)$            |
| explicitly, then substitutes the inductive hypothesis directly: $5^{k} + \ 3^{k} = \ 2p$.                   |
|                                                                                                             |
| Method 2 requires rearranging the inductive hypothesis; $5^{k}$ is replaced with                            |
| $\left( 2p\  - \ 3^{k} \right)$.                                                                            |
|                                                                                                             |
| Method 2 is easier to apply, but method 1 may be required for harder proofs in Extension 2.                 |
+-------------------------------------------------------------------------------------------------------------+
| j.  $7ⁿ\  + \ 3ⁿ\$is divisible by $10\$for all odd positive integers $n \geq 1$                             |
|                                                                                                             |
| > Hint: assume true for $n = 2k - 1$                                                                        |
|                                                                                                             |
| Test $n\  = \ 1$                                                                                            |
|                                                                                                             |
| $$LHS\  = \ 7^{1} + \ 3^{1} = \ 10$$                                                                        |
|                                                                                                             |
| ∴ True for $n\  = \ 1$                                                                                      |
|                                                                                                             |
| Assume true for $n\  = \ 2k\  - \ 1$                                                                        |
|                                                                                                             |
| $7^{2k - 1} + \ 3^{2k - 1} = \ 10p$, where $p$ is an integer.                                               |
|                                                                                                             |
| Prove $n\  = \ 2k\  + \ 1$                                                                                  |
|                                                                                                             |
| $WTP:\ 7^{2k + 1} + \ 3^{2k + 1} = \ 10q$, where $q$ is an integer.                                         |
|                                                                                                             |
| $$LHS\  = \ 7^{2k + 1} + \ 3^{2k + 1}$$                                                                     |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 7^{2} \times \ 7^{2k - 1} + \ 3^{2} \times \ 3^{2k - 1}$$                        |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 49\  \times \ 7^{2k - 1} + \ 9\  \times \ 3^{2k - 1}$$                           |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 49\left( 10p\  - \ 3^{2k - 1} \right) + \ 9\  \times \ 3^{2k - 1}$$              |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 490p\  - \ 49\  \times \ 3^{2k - 1} + \ 9\  \times \ 3^{2k - 1}$$                |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 490p\  - \ 40\  \times \ 3^{2k - 1}$$                                            |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 10\left( 49p\  - \ 4\  \times \ 3^{2k - 1} \right),\$since$\ p\$and$\ 3^{2k - 1}$ |
| are integers,                                                                                               |
|                                                                                                             |
| $49p\  - \ 4\  \times \ 3^{2k - 1}\$is also an integer.                                                     |
|                                                                                                             |
| $= \ 10q,\$where $q$ is an integer                                                                          |
|                                                                                                             |
| Since true for $n = 1$, by mathematical induction, true for all odd integers $n \geq 1$.                    |
+-------------------------------------------------------------------------------------------------------------+
| k.  $5ⁿ\  + \ 2\  \times \ 11ⁿ\$is divisible by$\ 3\$for all integers$\ n\  \geq \ 0\$                      |
|                                                                                                             |
| Test $n\  = \ 0$                                                                                            |
|                                                                                                             |
| $$LHS\  = \ 5^{0} + \ 2\  \times \ 11^{0} = \ 1\  + \ 2\  = \ 3$$                                           |
|                                                                                                             |
| ∴ True for $n\  = \ 0$                                                                                      |
|                                                                                                             |
| Assume true for $n\  = \ k$                                                                                 |
|                                                                                                             |
| $5^{k} + \ 2\  \times \ 11^{k} = \ 3p$, where $p$ is an integer.                                            |
|                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                   |
|                                                                                                             |
| $WTP:\ 5^{k + 1} + \ 2\  \times \ 11^{k + 1} = \ 3q$, where $q$ is an integer.                              |
|                                                                                                             |
| $$LHS\  = \ 5^{k + 1} + \ 2\  \times \ 11^{k + 1}$$                                                         |
|                                                                                                             |
| $= \ 5\  \times \ 5^{k} + \ 2\  \times \ 11\  \times \ 11^{k}$                                              |
|                                                                                                             |
| $= \ 5\  \times \ 5^{k} + \ 22\  \times \ 11^{k}$                                                           |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 5\left( 3p\  - \ 2\  \times \ 11^{k} \right) + \ 22\  \times \ 11^{k}$$          |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 15p\  - \ 10\  \times \ 11^{k} + \ 22\  \times \ 11^{k}$$                        |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 15p\  + \ 12\  \times \ 11^{k}$$                                                 |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 3\left( 5p\  + \ 4\  \times \ 11^{k} \right),\$since $p$ and $11^{k}$ are         |
| integers, $5p\  + \ 4\  \times \ 11^{k}$ is also an integer.                                                |
|                                                                                                             |
| $= \ 3q$, where $q$ is an integer                                                                           |
|                                                                                                             |
| Since true for $n = 0$, by mathematical induction, true for all integers $n \geq 0$.                        |
+-------------------------------------------------------------------------------------------------------------+
| l.  $8ⁿ\  - \ 7n\  + \ 6\$is divisible by$\ 7\$for all integers$\ n\  \geq \ 0\$                            |
|                                                                                                             |
| Test $n\  = \ 0$                                                                                            |
|                                                                                                             |
| $$LHS\  = \ 8^{0} - \ 7(0) + \ 6\  = \ 1\  + \ 6\  = \ 7$$                                                  |
|                                                                                                             |
| ∴ True for $n\  = \ 0$                                                                                      |
|                                                                                                             |
| Assume true for $n\  = \ k$                                                                                 |
|                                                                                                             |
| $8^{k} - \ 7k\  + \ 6\  = \ 7p$, where $p$ is an integer.                                                   |
|                                                                                                             |
| Prove $n\  = \ k\  + \ 1$                                                                                   |
|                                                                                                             |
| $WTP:\ 8^{k + 1} - \ 7(k\  + \ 1) + \ 6\  = \ 7q$, where $q$ is an integer.                                 |
|                                                                                                             |
| $$LHS\  = \ 8^{k + 1} - \ 7(k\  + \ 1) + \ 6$$                                                              |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \  = \ 8\  \times \ 8^{k} - \ 7k\  - \ 7\  + \ 6$$                                          |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \  = \ 8\  \times \ 8^{k} - \ 7k\  - \ 1$$                                                  |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \  = \ 8(7p\  + \ 7k\  - \ 6) - \ 7k\  - \ 1$$                                              |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \  = \ 56p\  + \ 56k\  - \ 48\  - \ 7k\  - \ 1$$                                            |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \  = \ 56p\  + \ 49k\  - \ 49\ $$                                                           |
|                                                                                                             |
| $= \ 7(8p\  + \ 7k\  - \ 7)$, since $p$ and $k$ are integers,                                               |
|                                                                                                             |
| $8p\  + \ 7k\  - \ 7$ is also an integer.                                                                   |
|                                                                                                             |
| $= \ 7q$, where $q$ is an integer                                                                           |
|                                                                                                             |
| Since true for $n = 0$, by mathematical induction, true for all integers $n \geq 0$.                        |
+-------------------------------------------------------------------------------------------------------------+
| m.  Prove that the sum of consecutive odd positive integers is divisible by 4.\                             |
|     In other words, $1\  + \ 3\  + \ 5\  + \ ...\  + \ (2n\  - \ 1)$ is divisible by 4 for $n \geq 2$ and   |
|     even.                                                                                                   |
|                                                                                                             |
| Hint: assume true for $n = 2k$                                                                              |
|                                                                                                             |
| Test $n\  = \ 2$                                                                                            |
|                                                                                                             |
| $$LHS\  = \ 1\  + \ 3\  = \ 4$$                                                                             |
|                                                                                                             |
| ∴ True for $n\  = \ 2$                                                                                      |
|                                                                                                             |
| Assume true for $n\  = \ 2k$                                                                                |
|                                                                                                             |
| $1\  + \ 3\  + \ 5\  + \ ...\  + \ (4k\  - \ 1)\  = \ 4p,$ where $p$ is an integer.                         |
|                                                                                                             |
| Prove $n\  = \ 2k\  + \ 2$                                                                                  |
|                                                                                                             |
| $WTP:\ 1\  + \ 3\  + \ 5\  + \ ...\  + \ (4k\  - \ 1) + \ (4k\  + \ 1) + \ (4k\  + \ 3) = \ 4q,$ where $q$  |
| is an integer.                                                                                              |
|                                                                                                             |
| $$LHS\  = \ 1\  + \ 3\  + \ 5\  + \ ...\  + \ (4k\  - \ 1)\  + \ (4k\  + \ 1)\  + \ (4k\  + \ 3)$$          |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 4p\  + \ (4k\  + \ 1)\  + \ (4k\  + \ 3),$ using assumption                       |
|                                                                                                             |
| $$\ \ \ \ \ \ \ \ \ \  = \ 4p\  + \ 8k\  + \ 4$$                                                            |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 4(p\  + \ 2k\  + \ 1),$ since $p$ and $k$ are integers,                           |
|                                                                                                             |
| $p\  + \ 2k\  + \ 1$ is also an integer.                                                                    |
|                                                                                                             |
| $\ \ \ \ \ \ \ \ \ \  = \ 4q$, where $q$ is an integer                                                      |
|                                                                                                             |
| Since true for $n = 2$, by mathematical induction, true for all even integers $n \geq 2$.                   |
+-------------------------------------------------------------------------------------------------------------+

Mastery

+----------------------------------------------------------------------------------------------------+
| n.  $9(9ⁿ\  - \ 1) - \ 8n$ is divisible by$\ 64\$for all integers$\ n\  \geq \ 0\$                 |
|                                                                                                    |
| Test $n\  = \ 0$                                                                                   |
|                                                                                                    |
| $$LHS\  = \ 9\left( 9^{0} - \ 1 \right) - \ 8(0) = 0 = 64(0)$$                                     |
|                                                                                                    |
| ∴ True for $n\  = \ 0$                                                                             |
|                                                                                                    |
| Assume true for $n\  = \ k$                                                                        |
|                                                                                                    |
| $9\left( 9^{k} - \ 1 \right) - \ 8k\  = \ 64p$, where $p$ is a non-negative integer.               |
|                                                                                                    |
| Prove $n\  = \ k\  + \ 1$                                                                          |
|                                                                                                    |
| $WTP:\ 9\left( 9^{k + 1} - \ 1 \right) - \ 8(k\  + \ 1) = \ 64q$, where $q$ is a non-negative      |
| integer.                                                                                           |
|                                                                                                    |
| $$LHS\  = \ 81\  \times \ 9^{k} - \ 9\  - \ 8k\  - \ 8$$                                           |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ 81\  \times \ 9^{k} - \ 8k\  - \ 17$ From assumption:                    |
| $9\left( 9^{k} - \ 1 \right) - \ 8k\  = \ 64p$                                                     |
|                                                                                                    |
| So: $9\  \times \ 9^{k} - \ 9\  = \ 64p\  + \ 8k$                                                  |
|                                                                                                    |
| $\therefore 9\  \times \ 9^{k} = \ 64p\  + \ 8k\  + \ 9$                                           |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 9\  \times \ 9\  \times \ 9^{k} - 8k\  - \ 17$$                         |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 9(64p\  + \ 8k\  + \ 9) - \ 8k\  - \ 17$$                               |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 576p\  + \ 72k\  + \ 81\  - 8k\  - \ 17\ $$                             |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 576p\  + \ 64k\  + \ 64\ $$                                             |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ 64(9p\  + \ k\  + \ 1),$ since $p$ and $k$ are non-negative integers,\   |
| $9p\  + \ k\  + \ 1$ is also a non-negative integer.                                               |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ 64q$, where $q$ is a non-negative integer                                |
|                                                                                                    |
| Since true for $n = 0$, by mathematical induction, true for all integers $n \geq 0$.               |
+====================================================================================================+
| o.  $3^{3n} + \ 2^{n + 2}\$is divisible by$\ 5\$for all integers$\ n\  \geq \ 0\$                  |
|                                                                                                    |
| Test $n\  = \ 0$                                                                                   |
|                                                                                                    |
| $$LHS\  = \ 3⁰\  + \ 2²\  = \ 1\  + \ 4\  = \ 5$$                                                  |
|                                                                                                    |
| ∴ True for $n\  = \ 0$                                                                             |
|                                                                                                    |
| Assume true for $n\  = \ k$                                                                        |
|                                                                                                    |
| $3^{3k} + \ 2^{k + 2} = \ 5p$, where $p$ is a non-negative integer.                                |
|                                                                                                    |
| Prove $n\  = \ k\  + \ 1$                                                                          |
|                                                                                                    |
| $WTP:\ 3^{3(k + 1)} + \ 2^{(k + 1) + 2} = \ 5q$, where $q$ is a non-negative integer.              |
|                                                                                                    |
| $$LHS\  = \ 3^{3k + 3} + \ 2^{k + 3}$$                                                             |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 3^{3} \times \ 3^{3k} + \ 2\  \times \ 2^{k + 2}$$                      |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 27\  \times \ 3^{3k} + \ 2\  \times \ 2^{k + 2}$$                       |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ 27\left( 5p\  - \ 2^{k + 2} \right) + \ 2\  \times \ 2^{k + 2},$ using   |
| assumption.                                                                                        |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 135p\  - \ 27\  \times \ 2^{k + 2} + \ 2\  \times \ 2^{k + 2}$$         |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 135p\  - \ 25\  \times \ 2^{k + 2}$$                                    |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ 5\left( 27p\  - \ 5\  \times \ 2^{k + 2} \right),$ since $p$ and         |
| $2^{k + 2}$ are integers, $27p\  - \ 5\  \times \ 2^{k + 2}$ is also an integer.                   |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ 5q$, where $q$ is an integer                                             |
|                                                                                                    |
| Since true for $n = 0$, by mathematical induction, true for all integers $n \geq 0$.               |
+----------------------------------------------------------------------------------------------------+
| p.  $11^{n + 2} + \ 12^{2n + 1}$ is divisible by$\ 133\$for all integers$\ n\  \geq \ 0\$          |
|                                                                                                    |
| Test $n\  = \ 0$                                                                                   |
|                                                                                                    |
| $$LHS\  = \ 11^{2} + \ 12^{1} = \ 121\  + \ 12\  = \ 133$$                                         |
|                                                                                                    |
| ∴ True for $n\  = \ 0$                                                                             |
|                                                                                                    |
| Assume true for $n\  = \ k$                                                                        |
|                                                                                                    |
| $11^{k + 2} + \ 12^{2k + 1} = \ 133p$, where $p$ is a non-negative integer.                        |
|                                                                                                    |
| Prove $n\  = \ k\  + \ 1$                                                                          |
|                                                                                                    |
| $WTP:\ 11^{(k + 1) + 2} + \ 12^{2(k + 1) + 1} = \ 133q$, where $q$ is an integer.                  |
|                                                                                                    |
| $$LHS\  = \ 11^{k + 3} + \ 12^{2k + 3}$$                                                           |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 11\  \times \ 11^{k + 2} + \ 12^{2} \times \ 12^{2k + 1}$$              |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 11\  \times \ 11^{k + 2} + \ 144\  \times \ 12^{2k + 1}$$               |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ 11\left( 133p\  - \ 12^{2k + 1} \right) + \ 144\  \times \ 12^{2k + 1},$ |
| using assumption                                                                                   |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 1463p\  - \ 11\  \times \ 12^{2k + 1} + \ 144\  \times \ 12^{2k + 1}$$  |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ 1463p\  + \ 133\  \times \ 12^{2k + 1}$$                                |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ 133\left( 11p\  + \ 12^{2k + 1} \right),$ since $p$ and $12^{2k + 1}$    |
| are integers,                                                                                      |
|                                                                                                    |
| $11p\  + \ 12^{2k + 1}$ is also an integer.                                                        |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ 133q$, where $q$ is an integer.                                          |
|                                                                                                    |
| Since true for $n = 0$, by mathematical induction, true for all integers $n \geq 0$.               |
+----------------------------------------------------------------------------------------------------+
| q.  Prove by mathematical induction that$\ x\  - \ 1\$is a factor of$\ xⁿ\  - \ 1\$for all         |
|     integers$\ n\  \geq \ 1$                                                                       |
|                                                                                                    |
| Test $n\  = \ 1$                                                                                   |
|                                                                                                    |
| $$LHS\  = \ x^{1} - \ 1\  = \ x\  - \ 1$$                                                          |
|                                                                                                    |
| ∴ True for $n\  = \ 1$                                                                             |
|                                                                                                    |
| Assume true for $n\  = \ k$                                                                        |
|                                                                                                    |
| $x^{k} - \ 1\  = \ (x\  - \ 1)p(x),$ where $p(x)$ is a polynomial.                                 |
|                                                                                                    |
| Prove $n\  = \ k\  + \ 1$                                                                          |
|                                                                                                    |
| $WTP:\ x^{k + 1} - \ 1\  = \ (x\  - \ 1)q(x),$ where $q(x)$ is a polynomial.                       |
|                                                                                                    |
| $$LHS\  = \ x^{k + 1} - \ 1$$                                                                      |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ x\  \times \ x^{k} - \ 1$$                                              |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ x\left\lbrack (x - 1)p(x) + 1 \right\rbrack\  - \ 1,$ using assumption   |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ x(x - 1)p(x) + x - 1$$                                                  |
|                                                                                                    |
| $$\ \ \ \ \ \ \ \ \ \  = \ (x\  - \ 1)\left( xp(x) + \ 1 \right)$$                                 |
|                                                                                                    |
| $\ \ \ \ \ \ \ \ \ \  = \ (x\  - \ 1)q(x),$ where $q(x)\  = \ xp(x)\  + \ 1\$is a polynomial       |
|                                                                                                    |
| Since true for $n = 1$, by mathematical induction, true for all integers $n \geq 1$.               |
+----------------------------------------------------------------------------------------------------+

# Exam Questions

1.  **2014 HSC Advanced Band 3**

Use mathematical induction to prove that $2ⁿ\  + \ ( - 1)^{n + 1}\$is
divisible by 3 for all integers $n\  \geq \ 1$.

Test n = 1

$$LHS\  = \ 2^{1} + \ ( - 1)^{2} = \ 2\  + \ 1\  = \ 3$$

∴ True for n = 1

Assume true for $n\  = \ k$

$2^{k} + \ ( - 1)^{k + 1} = \ 3P,$ where $P$ is an integer.

Rearranging: $2^{k} = \ 3P\  - \ ( - 1)^{k + 1}$

Prove $n\  = \ k\  + \ 1$

$WTP:\ 2^{k + 1} + \ ( - 1)^{k + 2}$ is divisible by 3.

$$LHS\  = \ 2^{k + 1} + \ ( - 1)^{k + 1 + 1}$$

$$= \ 2\  \times \ 2^{k} + \ ( - 1)^{k + 2}$$

$= \ 2\left( 3P\  - \ ( - 1)^{k + 1} \right) + \ ( - 1)^{k + 2},$ from
assumption

$$= \ 6P\  - \ 2( - 1)^{k + 1} - \ 1( - 1)^{k + 1}$$

$$= \ 6P\  - \ 3( - 1)^{k + 1}$$

$$= \ 3\left( 2P\  - \ ( - 1)^{k + 1} \right)$$

$= \ 3Q,$ where $Q$ is an integer

Since true for $n = 1$, by mathematical induction, true for all integers
$n \geq 1$.

2.  **2023 HSC Advanced Band 3**

> Use mathematical induction to prove that\
> $(1\  \times \ 2)\  + \ (2\  \times \ 2²)\  + \ (3\  \times \ 2³)\  + \ ...\  + \ (n\  \times \ 2ⁿ)\  = \ 2\  + \ (n\  - \ 1)2^{n + 1}$
> for all integers $n\  \geq \ 1.$

Test $n\  = \ 1$

$$LHS\  = \ 1\  \times \ 2\  = \ 2\ $$

$$RHS\  = \ 2\  + \ (1\  - \ 1)2^{2} = \ 2$$

∴ True for $n\  = \ 1$

Assume true for $n\  = \ k$

$$(1\  \times \ 2) + \ \left( 2\  \times \ 2^{2} \right) + \ ...\  + \ \left( k\  \times \ 2^{k} \right) = \ 2\  + \ (k\  - \ 1)2^{k + 1}$$

Prove $n\  = \ k\  + \ 1$

$$WTP:\ (1\  \times \ 2) + \ \left( 2\  \times \ 2^{2} \right) + \ ...\  + \ \left( k\  \times \ 2^{k} \right) + \ (k\  + \ 1)2^{k + 1} = \ 2\  + \ k\  \times \ 2^{k + 2}$$

$$LHS\  = \ 2\  + \ (k\  - \ 1)2^{k + 1} + \ (k\  + \ 1)2^{k + 1}$$

$$= \ 2\  + \ 2^{(k + 1)}(k\  - \ 1\  + \ k\  + \ 1)$$

$$= \ 2\  + \ 2^{(k + 1)}(2k)$$

$$= \ 2\  + \ k\  \times \ 2^{k + 2}$$

$$= \ RHS$$

Since true for $n = 1$, by mathematical induction, true for all integers
$n \geq 1$.

3.  **2024 HSC Advanced Band 3**

> Use mathematical induction to prove that $2^{3n} + \ 13$ is divisible
> by 7 for all integers $n\  \geq \ 1$.

Test $n\  = \ 1$

$$LHS\  = \ 2^{3 \times 1} + \ 13\  = \ 21\  = \ 3\  \times \ 7$$

∴ True for $n\  = \ 1$

Assume true for $n\  = \ k$

$2^{3k} + \ 13\  = \ 7P$, where $P$ is an integer.

Rearranging: $2^{3k} = \ 7P\  - \ 13$

Prove $n\  = \ k\  + \ 1$

$WTP:\ 2^{3(k + 1)} + \ 13$ is divisible by 7.

$$LHS\  = \ 2^{3k + 3} + \ 13$$

$$= \ 2^{3} \times \ 2^{3k} + \ 13$$

$$= \ 8\left( 2^{3k} \right) + \ 13$$

$$= \ 8(7P\  - \ 13) + \ 13,\ using\ assumption$$

$$= \ 56P\  - \ 8\  \times \ 13\  + \ 13$$

$$= \ 7(8P\  - \ 13)$$

$= \ 7Q$, where $Q$ is an integer

Since true for $n = 1$, by mathematical induction, true for all integers
$n \geq 1$.

4.  **2016 HSC Advanced Band 4**

    a.  Show that $4n³\  + \ 18n²\  + \ 23n\  + \ 9$ can be written as
        $(n\  + \ 1)(4n²\  + \ 14n\  + \ 9)$.

$$RHS\  = \ (n\  + \ 1)\left( 4n^{2} + \ 14n\  + \ 9 \right)$$

$$= \ 4n^{3} + \ 14n^{2} + \ 9n\  + \ 4n^{2} + \ 14n\  + \ 9$$

$$= \ 4n^{3} + \ 18n^{2} + \ 23n\  + \ 9$$

$$= \ LHS\ $$

b.  Using the result in part (a), or otherwise, prove by mathematical
    induction that, for $n\  \geq \ 1$,

> $$1\  \times \ 3\  + \ 3\  \times \ 5\  + \ 5\  \times \ 7\  + \ ...\  + \ (2n\  - \ 1)(2n\  + \ 1) = \frac{1}{3}n\left( 4n^{2} + \ 6n\  - \ 1 \right).$$

Test $n\  = \ 1$

$$LHS\  = \ (1)(3) = \ 3$$

$$RHS\  = \ \left( \frac{1}{3} \right)(1)(4\  + \ 6\  - \ 1) = \ 3$$

∴ True for $n\  = \ 1$

Assume true for $n\  = \ k$

$$1\  \times \ 3\  + \ 3\  \times \ 5\  + \ ...\  + \ (2k\  - \ 1)(2k\  + \ 1) = \frac{1}{3}k\left( 4k^{2} + \ 6k\  - \ 1 \right)$$

Prove $n\  = \ k\  + \ 1$

$$WTP:\ 1\  \times \ 3\  + \ ...\  + \ (2k\  + \ 1)(2k\  + \ 3)\  = \frac{1}{3}(k\  + \ 1)\left\lbrack 4(k\  + \ 1)^{2} + \ 6(k\  + \ 1) - \ 1 \right\rbrack$$

$$= \frac{1}{3}(k\  + \ 1)\left( 4k^{2} + \ 14k\  + \ 9 \right)$$

$$= \ \frac{1}{3}\left( 4k^{3} + \ 18k^{2} + \ 23k\  + \ 9 \right)$$

$$LHS\  = \ 1\  \times \ 3\  + \ ...\  + \ (2k\  - \ 1)(2k\  + \ 1) + \ (2k\  + \ 1)(2k\  + \ 3)$$

$$= \ \frac{1}{3}k\left( 4k^{2} + \ 6k\  - \ 1 \right) + \ (2k\  + \ 1)(2k\  + \ 3)$$

$$= \ \frac{1}{3}\left( 4k^{3} + \ 6k^{2} - \ k \right) + \ \left( 4k^{2} + \ 8k\  + \ 3 \right)$$

$$= \ \frac{1}{3}\left( 4k^{3} + \ 6k^{2} - \ k\  + \ 12k^{2} + \ 24k\  + \ 9 \right)\ $$

$$= \ \frac{1}{3}\left( 4k^{3} + \ 18k^{2} + \ 23k\  + \ 9 \right)\ $$

$$= \ RHS$$

Since true for $n = 1$, by mathematical induction, true for all integers
$n \geq 1$.

5.  **2007 HSC Advanced Band 4**

> Use mathematical induction to prove that $7^{2n - 1} + \ 5$ is
> divisible by 12, for all integers $n\  \geq \ 1$.

Test $n\  = \ 1$

$$LHS\  = \ 7^{2 - 1} + \ 5\  = \ 7\  + \ 5\  = \ 12$$

∴ True for $n\  = \ 1$

Assume true for $n\  = \ k$

$7^{2k - 1} + \ 5\  = \ 12N$, where N is an integer.

Rearranging: $7^{2k - 1} = \ 12N\  - \ 5$

Prove $n\  = \ k\  + \ 1$

$WTP:\ 7^{2(k + 1) - 1} + \ 5$ is divisible by 12.

$$LHS\  = \ 7^{2k + 1} + \ 5$$

$$= \ 7²\  \times \ 7^{2k - 1}\  + \ 5$$

$= \ 49(12N\  - \ 5)\  + \ 5$, using assumption

$$= \ 49\  \times \ 12N\  - \ 245\  + \ 5$$

$$= \ 49\  \times \ 12N\  - \ 240$$

$$= \ 12(49N\  - \ 20)$$

$= \ 12Q$, where Q is an integer

Since true for $n = 1$, by mathematical induction, true for all integers
$n \geq 1$.

6.  **2017 HSC Advanced Band 4**

> Prove by mathematical induction that $8^{2n + 1} + \ 6^{2n - 1}$ is
> divisible by 7, for any integer $n\  \geq \ 1$.

Test $n\  = \ 1$

$$LHS\  = \ 8^{3} + \ 6^{1} = \ 518\  = \ 74\  \times \ 7$$

∴ True for $n\  = \ 1$

Assume true for $n\  = \ k$

$8^{2k + 1} + \ 6^{2k - 1} = \ 7P$, where $P$ is an integer.

Rearranging: $8^{2k + 1} = \ 7P\  - \ 6^{2k - 1}$

Prove $n\  = \ k\  + \ 1$

$WTP:\ 8^{2(k + 1) + 1} + \ 6^{2(k + 1) - 1}$ is divisible by 7.

$$LHS\  = \ 8^{2k + 3} + \ 6^{2k - 1}$$

$$= \ 64\  \times \ 8^{2k + 1} + \ 36\  \times \ 6^{2k - 1}$$

$= \ 64\left( 7P\  - \ 6^{2k - 1} \right) + \ 36\  \times \ 6^{2k - 1},$
using assumption

$$= \ 64\  \times \ 7P\  - \ 64\  \times \ 6^{2k - 1} + \ 36\  \times \ 6^{2k - 1}$$

$$= \ 64\  \times \ 7P\  - \ 28\  \times \ 6^{2k - 1}$$

$$= \ 7\left( 64P\  - \ 4\  \times \ 6^{2k - 1} \right)$$

$= \ 7Q$, where Q is an integer

Since true for $n = 1$, by mathematical induction, true for all integers
$n \geq 1$.

7.  **2021 HSC Advanced Band 4**

> Use mathematical induction to prove that
>
> $$\frac{1}{1\  \times \ 2\  \times \ 3} + \frac{1}{2\  \times \ 3\  \times \ 4} + \ ...\  + \frac{1}{n(n\  + \ 1)(n\  + \ 2)} = \frac{1}{4} - \frac{1}{2(n\  + \ 1)(n\  + \ 2)}$$
>
> for all integers $n\  \geq \ 1$.

Test $n\  = \ 1$

$$LHS\  = \frac{1}{1\  \times \ 2\  \times \ 3} = \frac{1}{6}$$

$$RHS\  = \frac{1}{4} - \frac{1}{2\  \times \ 2\  \times \ 3} = \frac{1}{4} - \frac{1}{12} = \frac{1}{6}$$

∴ True for $n\  = \ 1$

Assume true for $n\  = \ k$

$$\frac{1}{1\  \times \ 2\  \times \ 3} + \ ...\  + \frac{1}{k(k\  + \ 1)(k\  + \ 2)} = \frac{1}{4} - \frac{1}{2(k\  + \ 1)(k\  + \ 2)}$$

Prove $n\  = \ k\  + \ 1$

$$WTP:\frac{1}{1\  \times \ 2\  \times \ 3} + \ ...\  + \frac{1}{(k\  + \ 1)(k\  + \ 2)(k\  + \ 3)} = \frac{1}{4} - \frac{1}{2(k\  + \ 2)(k\  + \ 3)}$$

$$LHS\  = \frac{1}{1\  \times \ 2\  \times \ 3} + \ ...\  + \frac{1}{k(k\  + \ 1)(k\  + \ 2)} + \frac{1}{(k\  + \ 1)(k\  + \ 2)(k\  + \ 3)}$$

$$= \frac{1}{4} - \frac{1}{2(k\  + \ 1)(k\  + \ 2)} + \frac{1}{(k\  + \ 1)(k\  + \ 2)(k\  + \ 3)}$$

$$= \frac{1}{4} - \frac{k\  + \ 3\  - \ 2}{2(k\  + \ 1)(k\  + \ 2)(k\  + \ 3)}$$

$$= \frac{1}{4} - \frac{k\  + \ 1}{2(k\  + \ 1)(k\  + \ 2)(k\  + \ 3)}$$

$$= \frac{1}{4} - \frac{1}{2(k\  + \ 2)(k\  + \ 3)}$$

$$= \ RHS$$

Since true for $n = 1$, by mathematical induction, true for all integers
$n \geq 1$.

8.  **2022 HSC Advanced Band 4**

> Use mathematical induction to prove that $15ⁿ\  + \ 6^{2n + 1}$ is
> divisible by 7 for all integers $n\  \geq \ 0$.

Test $n\  = \ 0$

$$LHS\  = \ 15⁰\  + \ 6¹\  = \ 7$$

∴ True for $n\  = \ 0$

Assume true for $n\  = \ k$

$15^{k} + \ 6^{2k + 1} = \ 7P$, where P is an integer.

Rearranging: $6^{2k + 1} = \ 7P\  - \ 15^{k}$

Prove $n\  = \ k\  + \ 1$

$WTP:\ 15^{k + 1} + \ 6^{2k + 3}$ is divisible by 7.

$$LHS\  = \ 15^{k + 1} + \ 6^{2k + 3}$$

$$= \ 15\  \times \ 15^{k} + \ 6^{2} \times \ 6^{2k + 1}$$

$= \ 15\  \times \ 15\hat{}k\  + \ 36(7P\  - \ 15\hat{}k),$ using
assumption

$$= \ 15\  \times \ 15^{k} + \ 36\  \times \ 7P\  - \ 36\  \times \ 15^{k}$$

$$= \ 36\  \times \ 7P\  - \ 21\  \times \ 15^{k}$$

$$= \ 7\left( 36P\  - \ 3\  \times \ 15^{k} \right)$$

$= \ 7Q,$ where Q is an integer

Since true for $n = 0$, by mathematical induction, true for all integers
$n \geq 0.$

9.  **HSC Advanced Sample Question Band 5**

> Prove by mathematical induction that $(3n\  + \ 1)7ⁿ\  - \ 1\$is
> divisible by 9 for integers $n\  \geq \ 1$.
>
> Hint: prove that $f(x + 1) - f(x)$ is a multiple of 9.

Test $n\  = \ 1$

$$LHS\  = \ (3\  \times \ 1\  + \ 1)7¹\  - \ 1\  = \ 27$$

∴ True for $n\  = \ 1$

Assume true for $n\  = \ k$

$(3k\  + \ 1)7^{k} - \ 1\  = \ 9P$, where $P$ is an integer.

Prove $n\  = \ k\  + \ 1$

Let $f(k) = \ (3k\  + \ 1)7^{k} - \ 1$

Then
$f(k\  + \ 1) = \ \left( 3(k\  + \ 1) + \ 1 \right)7^{k + 1} - \ 1\  = \ (3k\  + \ 4)7^{k + 1} - \ 1$

$$f(k\  + \ 1) - \ f(k) = \ (3k\  + \ 4)7^{k + 1} - \ 1\  - \ \left\lbrack (3k\  + \ 1)7^{k} - \ 1 \right\rbrack$$

$$= \ 3k\  \times \ 7^{k + 1} + \ 4\  \times \ 7^{k + 1} - \ 1\  - \ \left\lbrack 3k\  \times \ 7^{k} + \ 7^{k} - \ 1 \right\rbrack$$

$$= \ 21k\  \times \ 7^{k} + \ 28\  \times \ 7^{k} - \ 1\  - \ 3k\  \times \ 7^{k} - \ 7^{k} + \ 1$$

$$= \ 18k\  \times \ 7^{k} + \ 27\  \times \ 7^{k}$$

$$= \ 9\left( 2k\  \times \ 7^{k} + \ 3\  \times \ 7^{k} \right)$$

$= \ 9Q,$ where Q is an integer

Since $f(k\  + \ 1)\  - \ f(k)$ is divisible by 9 and$\ f(k)\$is
divisible by 9,

⇒ $f(k\  + \ 1)$ is divisible by 9

Since true for $n = 1$, by mathematical induction, true for all integers
$n \geq 1$.

10. **2010 HSC Advanced Band 5**

> Prove by induction that $47ⁿ\  + \ 53\  \times \ 147^{n - 1}$ is
> divisible by 100 for all integers $n\  \geq \ 1$.

Test $n\  = \ 1$

$$LHS\  = \ 47^{1} + \ 53\  \times \ 147^{1 - 1} = \ 47\  + \ 53\  = \ 100$$

∴ True for $n\  = \ 1$

Assume true for $n\  = \ k$

$47^{k} + \ 53\  \times \ 147^{k - 1} = \ 100P$, where $P$ is an
integer.

Rearranging: $47^{k} = \ 100P\  - \ 53\  \times \ 147^{k - 1}$

Prove $n\  = \ k\  + \ 1$

$WTP:\ 47^{k + 1} + \ 53\  \times \ 147^{k}$ is divisible by 100.

$$LHS\  = \ 47^{k + 1} + \ 53\  \times \ 147^{k}$$

$$= \ 47\  \times \ 47^{k} + \ 53\  \times \ 147^{k}$$

$= \ 47\left\lbrack 100P\  - \ 53\  \times \ 147^{k - 1} \right\rbrack + \ 53\  \times \ 147\  \times \ 147^{k - 1},$
using assumption

$$= \ 4700P\  - \ 2491\  \times \ 147^{k - 1} + \ 7791\  \times \ 147^{k - 1}$$

$$= \ 4700P\  + \ 5300\  \times \ 147^{k - 1}$$

$$= \ 100\left( 47P\  + \ 53\  \times \ 147^{k - 1} \right)$$

$= \ 100Q$, where $Q$ is an integer

Since true for $n = 1$, by mathematical induction, true for all integers
$n \geq 1$.

11. **HSC Advanced Sample Question Band 6**

    a.  Show that
        $\cos(A\  - \ B)\  - \ \cos(A\  + \ B)\  = \ 2sin\ A\ \sin\ B$.

$$cos(A\  - \ B)\  - \ cos(A\  + \ B)\  = \ cos\ A\ cos\ B\  + \ sin\ A\ sin\ B\  - \ (cos\ A\ cos\ B\  - \ sin\ A\ sin\ B)$$

$$= \ 2sin\ A\ cos\ B$$

b.  Using the result in part (a), or otherwise, prove by mathematical
    induction that, for $n\  \geq \ 1$

> $$\sin\ \theta\  + \ \sin(3\theta) + \ ...\  + \ \sin\left( (2n\  - \ 1)\theta \right) = \frac{sin^{2}(n\theta)}{\sin\ \theta}$$

Test $n\  = \ 1$

$$LHS\  = \ \sin\ \theta$$

$$RHS\  = \frac{\sin^{2}\theta}{\sin\ \theta} = \ \sin\ \theta$$

∴ True for $n\  = \ 1$

Assume true for $n\  = \ k$

$$\sin\ \theta\  + \ \sin(3\theta) + \ ...\  + \ \sin\left( (2k\  - \ 1)\theta \right) = \frac{sin^{2}(k\theta)}{\sin\ \theta}$$

Prove$\ n\  = \ k\  + \ 1$

$$WTP:\ sin\ \theta\  + \ sin(3\theta) + \ ...\  + \ sin\left( (2k\  - \ 1)\theta \right) + \ sin\left( (2k\  + \ 1)\theta \right) = \frac{sin^{2}\left( (k\  + \ 1)\theta \right)}{sin\ \theta}$$

$$LHS\  = \frac{sin^{2}(k\theta)}{sin\ \theta} + \ sin\left( (2k\  + \ 1)\theta \right),\ using\ assumption$$

$$= \frac{sin^{2}(k\theta) + \ sin\ \theta\  \times \ sin\left( (2k\  + \ 1)\theta \right)}{sin\ \theta}$$

Using part a:

$$sin\ \theta\  \times \ sin\left( (2k\  + \ 1)\theta \right) = \frac{1}{2}\left\lbrack \cos(2k\theta) - \ \cos\left( (2k\  + \ 2)\theta \right) \right\rbrack$$

$$= \frac{1}{2}\left\lbrack \cos(2k\theta) - \ \cos\left( 2(k\  + \ 1)\theta \right) \right\rbrack$$

$$= \frac{1}{2}\left\lbrack 1\  - \ 2sin^{2}(k\theta) - \ \left( 1\  - \ 2sin^{2}\left( (k\  + \ 1)\theta \right) \right) \right\rbrack$$

$$= \frac{1}{2}\left( 2sin^{2}\left( (k\  + \ 1)\theta \right) - \ 2sin^{2}(k\theta) \right)$$

$$= \ sin²((k\  + \ 1)\theta)\  - \ sin^{2}(k\theta)$$

Substitute into LHS:

$$LHS\  = \frac{sin^{2}(k\theta) + \ sin^{2}\left( (k\  + \ 1)\theta \right) - \ sin^{2}(k\theta)}{sin\ \theta}$$

$$= \frac{sin^{2}\left( (k\  + \ 1)\theta \right)}{sin\ \theta}$$

$$= \ RHS$$

Since true for $n = 1$, by mathematical induction, true for all integers
$n \geq 1$.
