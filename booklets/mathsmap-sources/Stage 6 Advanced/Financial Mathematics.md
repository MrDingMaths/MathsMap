  -------------------------------------------------------------------
  Mathematics Advanced Year 12
  -------------------------------------------------------------------
  **Financial Mathematics**

  -------------------------------------------------------------------

+---------------------------+-----------------------------------+---------------------------+
| **Book 1**                | Annuities                         | Version: 260827           |
|                           |                                   |                           |
|                           | Reducing Balance Loans            | Feedback:\                |
|                           |                                   | https://MrDingMaths.com   |
+===========================+===================================+===========================+
| **Contents**                                                                              |
|                                                                                           |
| [Syllabus Content [2](#syllabus-content)](#syllabus-content)                              |
|                                                                                           |
| [Annuities [3](#annuities)](#annuities)                                                   |
|                                                                                           |
| [Annuities using Spreadsheets                                                             |
| [10](#annuities-using-spreadsheets)](#annuities-using-spreadsheets)                       |
|                                                                                           |
| [Annuity Future Value Tables                                                              |
| [12](#annuity-future-value-tables)](#annuity-future-value-tables)                         |
|                                                                                           |
| [Annuities as a Geometric Series                                                          |
| [20](#annuities-as-a-geometric-series)](#annuities-as-a-geometric-series)                 |
|                                                                                           |
| [Other Annuity Problems [28](#other-annuity-problems)](#other-annuity-problems)           |
|                                                                                           |
| [Reducing Balance Loans [38](#reducing-balance-loans)](#reducing-balance-loans)           |
+-------------------------------------------------------------------------------------------+

# Syllabus Content

**MAV-12-08** models and solves problems to make informed decisions
about financial situations

**Reducing balance loans**

- Recognise a reducing balance loan algebraically as a compound interest
  loan with periodic repayments

- Examine the effect of varying the interest rate and repayment amount
  on the time taken to repay a loan, with or without digital tools or by
  using a given graph

- Solve problems that involve reducing balance loans by calculating the
  total amount paid, equal periodic repayments, the amount still owing
  and the time taken to repay the loan

**Annuities**

- Identify an annuity as either an investment account with regular,
  equal contributions and interest compounding at the end of each
  period, or as a single sum investment from which regular equal
  withdrawals are made

- Define and model the future value of an annuity as the sum of all the
  payments, together with the interest they have earned

- Examine the effect of varying the amount initially invested, the value
  of the periodic payment, the interest rate and the duration of the
  annuity on the total value of the investment, using digital tools

- Solve problems involving annuities in which payments are made at the
  end of each time period and the future value of an annuity is
  calculated at the end of one of these periods using the formula for
  the sum of the first $n$ terms of a geometric sequence

# Annuities

+-------------------------------------------------------------------+
| - **Review**                                                      |
+===================================================================+
| - Increase by a percentage                                        |
|                                                                   |
| +------------------------------+------------------------------+   |
| | a.  Increase 5 by 21%        | b.  Increase 241 by 3%       |   |
| +==============================+==============================+   |
| | c.  Increase 912 by 0.5%     | d.  Increase 218 by 0.08%    |   |
| +------------------------------+------------------------------+   |
|                                                                   |
| - Recall compound interest formula $FV = PV(1 + r)^{n}$           |
|                                                                   |
| +------------------------------+------------------------------+   |
| | a.  \$3000 is invested at 5% | b.  \$3000 is invested at 5% |   |
| |     p.a. compounded          |     p.a. compounded          |   |
| |     annually.\               |     monthly.\                |   |
| |     Find the value of the    |     Find the value of the    |   |
| |     investment after 4       |     investment after 4       |   |
| |     years.\                  |     years\                   |   |
| |     \                        |     \                        |   |
| |     \                        |     \                        |   |
| |     how much interest was    |     how much interest was    |   |
| |     earned?                  |     earned?                  |   |
| +==============================+==============================+   |
| | c.  \$3000 is invested at 5% | d.  \$3000 is invested at 5% |   |
| |     p.a. compounded          |     p.a. compounded          |   |
| |     six-monthly. Find the    |     quarterly. Find the      |   |
| |     value of the investment  |     value of the investment  |   |
| |     after 4 years.           |     after 4 years.           |   |
| +------------------------------+------------------------------+   |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------+
| - **Identify** Annuities                                                                |
+===================================+=====================================================+
| An **annuity** is a **regular** **equal** **contribution** to or **withdrawal** of      |
| money from an account earning **compound interest**.                                    |
|                                                                                         |
| Examples include:                                                                       |
|                                                                                         |
| **Superannuation**: where employers contribute part of your pay regularly into an       |
| investment account, which you withdraw regular amounts from after retirement.           |
|                                                                                         |
| **Reducing balance loans**: You make regular repayments on a loan, such as a mortgage   |
| or car loan.                                                                            |
+-----------------------------------+-----------------------------------------------------+
| ✖                                 | A person invests \$5000 once and leaves it for 8    |
|                                   | years in an account earning compound interest.      |
+-----------------------------------+-----------------------------------------------------+
| ✔                                 | A person deposits \$250 at the end of every month   |
|                                   | and earns monthly compound interest.                |
+-----------------------------------+-----------------------------------------------------+
| ✔                                 | A person deposits \$1800 at the end of every year   |
|                                   | and earns annual compound interest.                 |
+-----------------------------------+-----------------------------------------------------+
| ✔                                 | A retiree withdraws \$2200 from an account at the   |
|                                   | end of every month while the remaining balance      |
|                                   | earns monthly interest.                             |
+-----------------------------------+-----------------------------------------------------+
| ✖                                 | A person deposits \$200, then \$300, then \$150 at  |
|                                   | the end of every month on an account earning        |
|                                   | compound interest.                                  |
+-----------------------------------+-----------------------------------------------------+
| Decide which of the following represents an annuity:                                    |
|                                                                                         |
| a.  \$90 is deposited at the end of every fortnight into an account earning fortnightly |
|     interest.                                                                           |
|                                                                                         |
| b.  \$12,000 is invested once for 6 years.                                              |
|                                                                                         |
| c.  \$40,000 is invested, then \$750 is withdrawn at the end of each month.             |
|                                                                                         |
| d.  Deposits of \$100, \$150, \$200, \$250 are made at the end of successive months.    |
|                                                                                         |
| e.  \$600 is deposited at the **beginning** of each year.                               |
+-----------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| - **Interpret** Annuities as a recurrence relation                           |
+==============================================================================+
| The table shows the progress of a **savings account** with an annual         |
| contribution of \$5000 made at the end of each year. The interest rate is 8% |
| p.a. compounded annually.                                                    |
|                                                                              |
| Complete the table to find the value of the savings account at the end of    |
| four years.                                                                  |
|                                                                              |
|   -------------------------------------------------------------------------- |
|    **Year**   **Balance at   **Interest**   **Payment**   **Balance at End** |
|                 start**                                                      |
|   ---------- -------------- -------------- -------------- ------------------ |
|       1            0              0             5000             5000        |
|                                                                              |
|       2           5000           400            5000            10400        |
|                                                                              |
|       3          10400                                                       |
|                                                                              |
|       4                                                                      |
|   -------------------------------------------------------------------------- |
|                                                                              |
| \$10 000 is borrowed in a **reducing balance loan**. Monthly repayments of   |
| \$300 are made.\                                                             |
| The interest rate is 24% p.a. compounded monthly.                            |
|                                                                              |
| Complete the table to find the value of the loan at the end of four months.  |
|                                                                              |
|   -------------------------------------------------------------------------  |
|    **Month**  **Balance at   **Interest**   **Payment**  **Balance at End**  |
|                  start**                                                     |
|   ----------- ------------- -------------- ------------- ------------------  |
|        1         10 000          200            300             9900         |
|                                                                              |
|        2                                                                     |
|                                                                              |
|        3                                                                     |
|                                                                              |
|        4                                                                     |
|   -------------------------------------------------------------------------  |
|                                                                              |
| Instead of doing a table by hand, we can model an annuity using a            |
| **recurrence relation**, where we calculate each new value from the previous |
| value.                                                                       |
|                                                                              |
| A person saving for retirement decides to invest \$1000 at the end of each   |
| year into a superannuation account that pays interest of 10% p.a. compounded |
| annually.\                                                                   |
| How much do they have in the account after 5 years?                          |
|                                                                              |
| Let $V_{n}$ be the value of the account after $n$ payments.                  |
|                                                                              |
| +-----------------------------------+-----------------------------------+    |
| | $V_{0} = \$ 0$                    | $V_{3} = V_{2} \times 1.1 + 1000$ |    |
| |                                   |                                   |    |
| | $V_{1} = V_{0} \times 1.1 + 1000$ | $=$ ............... $+ \ 1000$    |    |
| |                                   |                                   |    |
| | $= 0 + 1000$                      | $=$ ...............               |    |
| |                                   |                                   |    |
| | $= 1000$                          | $V_{4} =$ $V_{3}$                 |    |
| |                                   | $\times 1.1 + 1000$               |    |
| | $V_{2} = V_{1} \times 1.1 + 1000$ |                                   |    |
| |                                   | $=$ ............... $+ \ 1000$    |    |
| | $= 1100 + 1000$                   |                                   |    |
| |                                   | $=$ ...............               |    |
| | $= 2100$                          |                                   |    |
| |                                   | $V_{5} =$ $V_{4}$                 |    |
| |                                   | $\times 1.1 + 1000$               |    |
| |                                   |                                   |    |
| |                                   | $=$ ............... $+ \ 1000$    |    |
| |                                   |                                   |    |
| |                                   | $=$ ...............               |    |
| +===================================+===================================+    |
+------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------+
| - **Annuity as a Recurrence Relation**                                                                                |
+:======================================:+:============================================================================:+
| **For Regular Contributions**          | ![](media/Financial Mathematics/media/image1.png){width="3.2066130796150483in" |
|                                        | height="1.543924978127734in"}**For Reducing Balance Loans**                  |
|                                        |                                                                              |
|                                        | ![](media/Financial Mathematics/media/image2.png){width="3.264705818022747in"  |
|                                        | height="1.545259186351706in"}                                                |
+----------------------------------------+------------------------------------------------------------------------------+
| ![](media/Financial Mathematics/media/image3.png){width="0.3576388888888889in" height="0.26666666666666666in"}Always    |
| define the starting value $V_{0}$. This would be the initial value of the loan or investment before making regular    |
| payments.                                                                                                             |
|                                                                                                                       |
| ![](media/Financial Mathematics/media/image3.png){width="0.3576388888888889in" height="0.26666666666666666in"}Use the   |
| button on the calculator to quickly insert the previous value.                                                        |
|                                                                                                                       |
| - If you make a mistake while using the button, restart from the beginning.                                           |
+-----------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------+
| - **Example** Solve annuity problems using recurrence relations                                                                                       |
+========================================================================+==============================================================================+
| Alyssa borrows \$1000 at an interest rate of 15% per annum, compounding monthly.                                                                      |
|                                                                                                                                                       |
| She will repay the loan by making 4 monthly payments of \$257.85.                                                                                     |
|                                                                                                                                                       |
| a.  Write the recurrence relation.                                                                                                                    |
|                                                                                                                                                       |
| $$V_{n} = V_{n - 1}(1 + r) - D$$                                                                                                                      |
|                                                                                                                                                       |
| $$V_{n} = V_{n - 1}\left( 1 + \frac{0.15}{12} \right) - 257.85$$                                                                                      |
|                                                                                                                                                       |
| b.  Determine the balance of the loan after 4 repayments.                                                                                             |
+------------------------------------------------------------------------+------------------------------------------------------------------------------+
| $V_{0} = 1000$                                                         | Fast method using a calculator:                                              |
|                                                                        |                                                                              |
| $$V_{1} = 1000\left( 1 + \frac{0.15}{12} \right) - 257.85 = 754.65$$   | ![](media/Financial Mathematics/media/image4.png){width="0.2722222222222222in" |
|                                                                        | height="0.22777777777777777in"}1. Type 1000 then press\                      |
| $$V_{2} = 754.65\left( 1 + \frac{0.15}{12} \right) - 257.85 = 506.23$$ | 2. Type $\boxed{ANS}\left( 1 + \frac{0.15}{12} \right) - 257.85$\            |
|                                                                        | 3. Press the equals button 4 times.                                          |
| $$V_{3} = 506.23\left( 1 + \frac{0.15}{12} \right) - 257.85 = 254.71$$ |                                                                              |
|                                                                        | If you make a mistake, you need to restart from step 1 as the value of       |
| $$V_{4} = 254.71\left( 1 + \frac{0.15}{12} \right) - 257.85 = 0.04$$   | $\boxed{ANS}$ changes.                                                       |
+------------------------------------------------------------------------+------------------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| Ling invests \$1500 per year for 5 years in an annuity. He makes  |
| each payment at the end of the year and the interest rate is 8%   |
| p.a. Write the recurrence relation and determine the balance of   |
| the investment after 5 years.                                     |
|                                                                   |
| \$8799.90                                                         |
+-------------------------------------------------------------------+

Foundation

1.  An investment is modelled by the recurrence relation

$$V_{n} = V_{n - 1} \times 1.06 + 800$$

Where $V_{0} = 0$

Use your calculator to determine the balance of the investment to the
nearest cent after:

+----------------+----------------+----------------+----------------+
| a.  1 payment  | b.  2 payments | c.  3 payments | d.  4 payments |
|                |                |                |                |
| \$800.00       | \$1648.00      | \$2546.88      | \$3499.69      |
+================+================+================+================+

2.  A loan is modelled by the recurrence relation

$$V_{n} = V_{n - 1} \times 1.09 - 600$$

Where $V_{0} = 2500$

Use your calculator to determine the balance of the loan to the nearest
cent after:

+----------------+----------------+----------------+----------------+
| a.  1 payment  | b.  2 payments | c.  3 payments | d.  4 payments |
|                |                |                |                |
| \$2125.00      | \$1716.25      | \$1270.71      | \$785.08       |
+================+================+================+================+

3.  A loan is modelled by the recurrence relation

$$V_{n} = V_{n - 1} \times 1.1 - 4200$$

Where $V_{0} = 500\ 000$

a.  Use your calculator to determine the balance of the loan to the
    nearest cent after 6 payments.

\$853 374.94

b.  Explain why the value of the loan is increasing despite repayments.

Each period the interest added (10% of the balance, over \$50 000) is
much larger than the \$4200 repayment, so the balance keeps growing.

Development

4.  Gabriel borrows \$250 000 at a rate of 4.8% p.a. compounding monthly
    and makes a repayment of \$2000 per month.

    a.  Complete the table for the first four months.

  -------------------------------------------------------------------------
   **Month**  **Balance at  **Interest**   **Payment**   **Balance at End**
              start**                                    
  ----------- ------------- -------------- ------------- ------------------
       1      \$250 000     \$1000         \$2000        \$249 000

       2      \$249 000     \$996          \$2000        \$247 996

       3      \$247 996     \$991.98       \$2000        \$246 987.98

       4      \$246 987.98  \$987.95       \$2000        \$245 975.94
  -------------------------------------------------------------------------

b.  Write the recurrence relation for this loan.

Vₙ = Vₙ₋₁ × 1.004 − 2000, where V₀ = 250 000

c.  Check your answer to part **a** by finding the value of the account
    at the end of 4 months using the recurrence relation.

V₄ = \$245 975.94, which matches the balance at the end of month 4 in
the table.

5.  **2013 HSC Standard 2 Band 5**

> Zina opened an account to save for a new car. Six months after opening
> the account, she made her first deposit of \$1200 and continued
> depositing \$1200 at the end of each six-month period. Interest was
> paid at 3% per annum, compounded half-yearly.

How much was in Zina\'s account two years after first opening it?

\$4909.08

Mastery

6.  **2021 HSC Standard 2 Band 5**

> Julie invests \$12 500 in a savings account. Interest is paid at a
> fixed monthly rate. At the end of each month, after the monthly
> interest is added, Julie makes a deposit of \$500.
>
> Julie has created a spreadsheet to show the activity in her savings
> account. The details for the first 6 months are shown.

![](media/Financial Mathematics/media/image5.png){width="5.991666666666666in"
height="2.8930555555555557in"}

By finding the monthly rate of interest, complete the final row above
for the 7th month.

7.  **2020 HSC Standard 2 Band 5**

> Tina inherits \$60 000 and invests it in an account earning interest
> at a rate of 0.5% per month. Each month, immediately after the
> interest has been paid, Tina withdraws \$800.

The amount in the account immediately after the $n$^th^ withdrawal can
be determined using the recurrence relation

$$A_{n} = A_{n - 1}(1.005) - 800$$

a.  Use the recurrence relation to find the amount of money in the
    account immediately after the third withdrawal.

\$58 492.49

b.  Calculate the amount of interest earned in the first three months.

\$892.49

# Annuities using Spreadsheets

+-------------------------------------------------------------------------------------------------------------+
| - **Investigation** Modelling annuities using a spreadsheet                                                 |
+=============================================================================================================+
| \$5000 is invested at the end of each year for 10 years into an account that pays interest of 8.5% p.a.     |
|                                                                                                             |
| We will use spreadsheets to model recurrence relations in the context of annuities.                         |
|                                                                                                             |
| **Setting up the recurrence relation**                                                                      |
|                                                                                                             |
| 1.  Construct the table below on the spreadsheet.                                                           |
|                                                                                                             |
| 2.  In cell B3, type $= B2*1.085 + 5000$ and press ENTER. This is the recurrence relation.                  |
|                                                                                                             |
| ![](media/Financial Mathematics/media/image6.png){width="1.6395833333333334in"                                |
| height="2.9722222222222223in"}![](media/Financial Mathematics/media/image7.png){width="2.0972222222222223in"  |
| height="2.9763888888888888in"}![](media/Financial Mathematics/media/image8.png){width="1.6895833333333334in"  |
| height="2.9722222222222223in"}                                                                              |
|                                                                                                             |
| **Automatic calculation**                                                                                   |
|                                                                                                             |
| 3.  Select the cell with 5000 (do [NOT]{.underline} go into edit mode).                                     |
|                                                                                                             |
| 4.  ![](media/Financial Mathematics/media/image9.png){width="0.9861111111111112in"                            |
|     height="0.3770833333333333in"}Hover the mouse over the little square on the bottom right of the cell.   |
|     Your mouse cursor should become a $+$                                                                   |
|                                                                                                             |
| 5.  Click on the little square and drag downwards to the end of the table.                                  |
|                                                                                                             |
| 6.  Let go and the spreadsheet should calculate $V_{n}$                                                     |
|                                                                                                             |
| ![](media/Financial Mathematics/media/image10.png){width="1.679861111111111in"                                |
| height="2.9916666666666667in"}![](media/Financial Mathematics/media/image11.png){width="1.6895833333333334in" |
| height="2.9916666666666667in"}                                                                              |
|                                                                                                             |
| At the end of 10 years,\                                                                                    |
| the account has \$74175.50                                                                                  |
+-------------------------------------------------------------------------------------------------------------+

Foundation

**Answer each of these questions using a spreadsheet.**

1.  \$7000 is invested at the end of each year for 20 years into an
    account that pays interest of 6.7% p.a. What will be the balance in
    the account at the end of 20 years?

\$277 740.82

2.  Each year, since his daughter's first birthday, Lucas has put \$1500
    into a savings account that can be accessed when his daughter
    turns 21. The savings account pays interest of 5% p.a.

    a.  How much will be in the savings account on his daughter's 21st
        birthday?\
        Assume that Lucas contributes a final \$1500 to the account on
        this day.

\$53 578.88

b.  Use the spreadsheet to create a line graph of\
    how the balance is changing over time.\
    Describe the shape of your graph and sketch it.

<!-- -->

3.  Andreas puts \$1400 into an annuity at the end of each quarter for 5
    years. The annuity pays 6.8% p.a. compounding quarterly.

    a.  Andreas does not have enough in his annuity after 5 years to
        purchase his dream car, which retails for \$42 000. By how much
        is he short?

He has \$33 018.46 after 5 years, so he is \$8981.54 short.

b.  If Andreas continues to put \$1400 into his annuity at the end of
    each quarter, after how many additional quarters will he be able to
    purchase his dream car?

5 more quarters (balance \$43 164.17).

4.  Sari buys a house with a \$750 000 mortgage. The mortgage has a
    fixed rate of 5.4% p.a. compounded monthly, and she makes a mortgage
    payment of \$4200 each month.

    a.  What is the balance of the mortgage after 10 years?

\$619 112.94

b.  What is the balance of the mortgage after 20 years?

\$394 781.76

c.  What is the balance of the mortgage after 30 years?

\$10 293.96

d.  Use the spreadsheet to create a line graph to see\
    how the balance is changing over time.\
    Comment on how the gradient is changing.\
    Sketch the shape of your graph.

# Annuity Future Value Tables

+-------------------------------------------------------------------+
| - **Future Value Tables**                                         |
+===================================================================+
| Future value tables show the future value of an annuity when \$1  |
| is invested at the end of the period at the given interest rate   |
| for the given number of periods.                                  |
|                                                                   |
| The time units must match the **compounding period**.             |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------------+
| - **Identify** relevant value from FV table to use                      |
+:==================================:+:==================================:+
| **FV of \$1 Table**                                                     |
|                                                                         |
|   ------------------------------------------------------------------    |
|    **Period**   **1%**   **2%**   **3%**   **4%**   **5%**   **6%**     |
|   ------------ -------- -------- -------- -------- -------- --------    |
|      **1**      1.0000   1.0000   1.0000   1.0000   1.0000   1.0000     |
|                                                                         |
|      **2**      2.0100   2.0200   2.0300   2.0400   2.0500   2.0600     |
|                                                                         |
|      **3**      3.0301   3.0604   3.0909   3.1216   3.1525   3.1836     |
|                                                                         |
|      **4**      4.0604   4.1216   4.1836   4.2465   4.3101   4.3746     |
|                                                                         |
|      **5**      5.1010   5.2040   5.3091   5.4163   5.5256   5.6371     |
|                                                                         |
|      **6**      6.1520   6.3081   6.4684   6.6330   6.8019   6.9753     |
|   ------------------------------------------------------------------    |
+-------------------------------------------------------------------------+
| Identify the value from the table you would use for a question          |
| involving:                                                              |
+------------------------------------+------------------------------------+
| a.  3 years at 2% p.a. compounded  | b.  5 years at 6% p.a. compounded  |
|     annually.                      |     annually                       |
+------------------------------------+------------------------------------+
| c.  3 years at 5% p.a. compounded  | d.  2 years at 6% p.a. compounded  |
|     annually                       |     six-monthly.                   |
+------------------------------------+------------------------------------+
| e.  1.5 years at 8% p.a.           | f.  Half a year at 12% p.a.        |
|     compounded quarterly           |     compounded monthly             |
+------------------------------------+------------------------------------+

+-------------------------------------------------------------------+
| - **Using Future Value Tables**                                   |
+===================================================================+
| The time units must match the **compounding period**.             |
|                                                                   |
| To use a future value table:                                      |
|                                                                   |
| $$\begin{matrix}                                                  |
| FV \\                                                             |
| of\ Annuity                                                       |
| \end{matrix} = \begin{matrix}                                     |
| FV \\                                                             |
| \ of\ \$ 1                                                        |
| \end{matrix} \times \begin{matrix}                                |
| Regular\ payment\  \\                                             |
| amount                                                            |
| \end{matrix}$$                                                    |
|                                                                   |
| $$Interest = FV - \begin{matrix}                                  |
| Total \\                                                          |
| payments                                                          |
| \end{matrix}$$                                                    |
+-------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------+
| - **Example** Calculate future value of an annuity using a table                              |
+:========================================================:+:==================================:+
| **FV of \$1 Table**                                                                           |
|                                                                                               |
|   ------------------------------------------------------------------                          |
|    **Period**   **1%**   **2%**   **3%**   **4%**   **5%**   **6%**                           |
|   ------------ -------- -------- -------- -------- -------- --------                          |
|      **1**      1.0000   1.0000   1.0000   1.0000   1.0000   1.0000                           |
|                                                                                               |
|      **2**      2.0100   2.0200   2.0300   2.0400   2.0500   2.0600                           |
|                                                                                               |
|      **3**      3.0301   3.0604   3.0909   3.1216   3.1525   3.1836                           |
|                                                                                               |
|      **4**      4.0604   4.1216   4.1836   4.2465   4.3101   4.3746                           |
|                                                                                               |
|      **5**      5.1010   5.2040   5.3091   5.4163   5.5256   5.6371                           |
|                                                                                               |
|      **6**      6.1520   6.3081   6.4684   6.6330   6.8019   6.9753                           |
|   ------------------------------------------------------------------                          |
+----------------------------------------------------------+------------------------------------+
| a.  Determine the future value of \$800 per year for 5   | b.  Calculate the interest earned. |
|     years at 6% p.a. compounded annually.                |                                    |
|                                                          | $I = FV - Total\ payments$         |
| $$\begin{matrix}                                         |                                    |
| FV \\                                                    | $= 4509.68 - (800 \times 5)$       |
| of\ Annuity                                              |                                    |
| \end{matrix} = \begin{matrix}                            | $= \$ 509.68$                      |
| FV \\                                                    |                                    |
| \ of\ \$ 1                                               |                                    |
| \end{matrix} \times \begin{matrix}                       |                                    |
| Regular\ payment\  \\                                    |                                    |
| amount                                                   |                                    |
| \end{matrix}$$                                           |                                    |
|                                                          |                                    |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ FV = 5.6371 \times 800$$ |                                    |
|                                                          |                                    |
| $\ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \$ 4509.68$            |                                    |
+----------------------------------------------------------+------------------------------------+

+-----------------------------------------------------------------------+
| - **Guided Practice**                                                 |
+===================================+===================================+
| Use the table above to answer these questions:                        |
+-----------------------------------------------------------------------+
| Find the future value of \$34 000 per year for 3 years at 5% p.a.     |
| compounded annually, then                                             |
|                                                                       |
| calculate the interest earned.                                        |
|                                                                       |
| \$107 185, \$5185                                                     |
+-----------------------------------+-----------------------------------+
| $n = 4$ $r = 3\%$                 | Find the future value of \$300    |
|                                   | per quarter for 1.5 years at 8%   |
| \$5000 per half-year for 2 years  | p.a. compounded quarterly.        |
| at 6% p.a. compounded             |                                   |
| six-monthly.                      | \$1892.43                         |
|                                   |                                   |
| \$20 918                          |                                   |
+-----------------------------------+-----------------------------------+

Foundation

1.  ![](media/Financial Mathematics/media/image12.png){width="4.278220691163605in"
    height="1.6708573928258967in"}The table below shows the future value
    of an annuity with a contribution of \$1.

Use the table to calculate the future value of the following annuities:

a.  \$2000 per year for 2 years at 12% p.a. compounded annually.

\$3380

b.  \$32 000 per year for 4 years at 8% p.a. compounded annually.

\$105 920

c.  \$10 000 per year for 3 years at 10% p.a. compounded annually.

\$24 900

2.  ![](media/Financial Mathematics/media/image13.png){width="4.973912948381452in"
    height="1.9715234033245845in"}The table below shows the future value
    and interest earned for the following annuities.

Use the table to calculate the **future value and interest** earned for
the following annuities.

a.  \$34 000 per year for 5 years at 4% p.a. compounded annually.

\$184 280, \$14 280 interest

b.  \$45 000 per year for 4 years at 1% p.a. compounded annually.

\$182 700, \$2700 interest

c.  \$14 200 per year for 5 years at 5% p.a. compounded annually.

\$78 526, \$7526 interest

+------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Period** | **Future Value of \$1 Interest rate per period**                                                                                |
+===========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+
|            | **2%**     | **2.5%**   | **3%**     | **3.5%**   | **4%**     | **4.5%**   | **5%**     | **5.5%**   | **6%**     | **8%**     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **1**      | 1.0000     | 1.0000     | 1.0000     | 1.0000     | 1.0000     | 1.0000     | 1.0000     | 1.0000     | 1.0000     | 1.0000     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **2**      | 2.0200     | 2.0250     | 2.0300     | 2.0350     | 2.0400     | 2.0450     | 2.0500     | 2.0550     | 2.0600     | 2.0800     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **3**      | 3.0604     | 3.0756     | 3.0909     | 3.1062     | 3.1216     | 3.1370     | 3.1525     | 3.1680     | 3.1836     | 3.2464     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **4**      | 4.1216     | 4.1525     | 4.1836     | 4.2149     | 4.2465     | 4.2782     | 4.3101     | 4.3423     | 4.3746     | 4.5061     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **5**      | 5.2040     | 5.2563     | 5.3091     | 5.3625     | 5.4163     | 5.4707     | 5.5256     | 5.5811     | 5.6371     | 5.8666     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **6**      | 6.3081     | 6.3877     | 6.4684     | 6.5502     | 6.6330     | 6.7169     | 6.8019     | 6.8881     | 6.9753     | 7.3359     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **7**      | 7.4343     | 7.5474     | 7.6625     | 7.7794     | 7.8983     | 8.0192     | 8.1420     | 8.2669     | 8.3938     | 8.9228     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **8**      | 8.5830     | 8.7361     | 8.8923     | 9.0517     | 9.2142     | 9.3800     | 9.5491     | 9.7216     | 9.8975     | 10.6366    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **9**      | 9.7546     | 9.9545     | 10.1591    | 10.3685    | 10.5828    | 10.8021    | 11.0266    | 11.2563    | 11.4913    | 12.4876    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **10**     | 10.9497    | 11.2034    | 11.4639    | 11.7314    | 12.0061    | 12.2882    | 12.5779    | 12.8754    | 13.1808    | 14.4866    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **11**     | 12.1687    | 12.4835    | 12.8078    | 13.1420    | 13.4864    | 13.8412    | 14.2068    | 14.5835    | 14.9716    | 16.6455    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **12**     | 13.4121    | 13.7956    | 14.1920    | 14.6020    | 15.0258    | 15.4640    | 15.9171    | 16.3856    | 16.8699    | 18.9771    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **15**     | 17.2934    | 17.9319    | 18.5989    | 19.2957    | 20.0236    | 20.7841    | 21.5786    | 22.4087    | 23.2760    | 27.1521    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **18**     | 21.4123    | 22.3863    | 23.4144    | 24.4997    | 25.6454    | 26.8551    | 28.1324    | 29.4812    | 30.9057    | 37.4502    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **20**     | 24.2974    | 25.5447    | 26.8704    | 28.2797    | 29.7781    | 31.3714    | 33.0660    | 34.8683    | 36.7856    | 45.7620    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **21**     | 25.7833    | 27.1833    | 28.6765    | 30.2695    | 31.9692    | 33.7831    | 35.7193    | 37.7861    | 39.9927    | 50.4229    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **24**     | 30.4219    | 32.3490    | 34.4265    | 36.6665    | 39.0826    | 41.6892    | 44.5020    | 47.5380    | 50.8156    | 66.7648    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **25**     | 32.0303    | 34.1578    | 36.4593    | 38.9499    | 41.6459    | 44.5652    | 47.7271    | 51.1526    | 54.8645    | 73.1059    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **30**     | 40.5681    | 43.9027    | 47.5754    | 51.6227    | 56.0849    | 61.0071    | 66.4388    | 72.4355    | 79.0582    | 113.2832   |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **36**     | 51.9944    | 57.3014    | 63.2759    | 70.0076    | 77.5983    | 86.1640    | 95.8363    | 106.7652   | 119.1209   | 187.1021   |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **42**     | 64.8622    | 72.8398    | 82.0232    | 92.6074    | 104.8196   | 118.9248   | 135.2318   | 154.1005   | 175.9505   | 304.2435   |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **48**     | 79.3535    | 90.8596    | 104.4084   | 120.3883   | 139.2632   | 161.5879   | 188.0254   | 219.3684   | 256.5645   | 490.1322   |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **54**     | 95.6731    | 111.7570   | 131.1375   | 154.5381   | 182.8454   | 217.1464   | 258.7739   | 309.3625   | 370.9170   | 785.1141   |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **60**     | 114.0515   | 135.9916   | 163.0534   | 196.5169   | 237.9907   | 289.4980   | 353.5837   | 434.4504   | 533.1282   | 1253.2133  |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+

+------------+------------------------------------------------------------------------------------------+
| **Period** | **Future Value of \$1 Interest Rate per Period**                                         |
+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+
|            | **0.2%**   | **0.25%**  | **0.3%**   | **0.4%**   | **0.5%**   | **0.8%**   | **1%**     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **12**     | 12.1329    | 12.1664    | 12.2000    | 12.2676    | 12.3356    | 12.5423    | 12.6825    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **24**     | 24.5602    | 24.7028    | 24.8465    | 25.1371    | 25.4320    | 26.3432    | 26.9735    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **36**     | 37.2890    | 37.6206    | 37.9559    | 38.6381    | 39.3361    | 41.5287    | 43.0769    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **48**     | 50.3268    | 50.9312    | 51.5451    | 52.8016    | 54.0978    | 58.2380    | 61.2226    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **60**     | 63.6809    | 64.6467    | 65.6316    | 67.6602    | 69.7700    | 76.6239    | 81.6697    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **72**     | 77.3590    | 78.7794    | 80.2337    | 83.2478    | 86.4089    | 96.8545    | 104.7099   |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **84**     | 91.3691    | 93.3419    | 95.3703    | 99.6004    | 104.0739   | 119.1151   | 130.6723   |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **96**     | 105.7191   | 108.3474   | 111.0608   | 116.7553   | 122.8285   | 143.6093   | 159.9273   |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **108**    | 120.4173   | 123.8093   | 127.3256   | 134.7521   | 142.7399   | 170.5612   | 192.8926   |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **120**    | 135.4722   | 139.7414   | 144.1857   | 153.6320   | 163.8793   | 200.2175   | 230.0387   |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **180**    | 216.4071   | 226.9727   | 238.2067   | 262.8712   | 290.8187   | 399.5728   | 499.5802   |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **240**    | 307.6500   | 328.3020   | 350.7400   | 401.6750   | 462.0409   | 721.1312   | 989.2554   |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **300**    | 410.5137   | 446.0078   | 485.4305   | 578.0448   | 692.9940   | 1239.8020  | 1878.8466  |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **360**    | 526.4783   | 582.7369   | 646.6408   | 802.1475   | 1004.5150  | 2076.4132  | 3494.9641  |
+------------+------------+------------+------------+------------+------------+------------+------------+

Development

3.  Find the future value for these annuities using the tables on the
    previous page.

    a.  \$300 invested monthly over 3 years at 4.8% p.a. compounded
        monthly.

\$11 591.43

b.  \$100 invested monthly over 4 years at 6% p.a. compounded monthly.

\$5409.78

c.  \$1000 invested quarterly over 5 years at 8% p.a. compounded
    quarterly.

\$24 297.40

d.  \$3000 invested every 3 months over 6 years at 4% p.a. compounded
    every 3 months.

\$80 920.50

e.  \$15000 invested biannually over 5 years at 5% p.a. compounded
    biannually.

\$168 051

f.  \$4600 invested every 6 months over 18 years at 2% p.a. compounded
    6-monthly.

\$198 153.74

4.  Grant can save \$12000 a year and has a choice of investing it in
    these two ways:

\$12000 annually over 5 years at 6% p.a. compounded annually.

\$1000 monthly over 5 years at 6% p.a. compounded monthly.

Which option gives him more money at the end of the 5 years, and what is
the difference in interest earned?

Option 1: \$67645.20

Option 2: \$69770

Second option gives more money.

Difference in interest is \$2124.80

5.  Ginny's employer deposits \$176 per month into her superannuation
    fund, which pays interest of 12% p.a. compounding monthly. She also
    makes personal contributions of \$150 per month into the same fund.
    How much will she have in her superannuation fund after 20 years?

\$322 497.26

6.  George wants to make regular annual payments into an annuity that
    pays interest at 8% p.a. How much will each **annual contribution**
    need to be if George wants to have \$10 000 after 7 years?

$\begin{matrix}
FV \\
of\ Annuity
\end{matrix} = \begin{matrix}
FV \\
\ of\ \$ 1
\end{matrix} \times \begin{matrix}
Regular\ payment\  \\
amount
\end{matrix}$

\$1120.72.

7.  Eliza wants to have \$5000 in 6 years' time. How much would she need
    to deposit annually into an annuity that pays 5% p.a. interest?

\$735.09

8.  Grant wants to travel overseas in 3 years' time and estimates that
    he will need \$10 000. He begins paying \$650 per quarter into an
    annuity at 10% p.a. compounding quarterly. Will he have enough to go
    on his trip? By how much is he under or over his target?

\$8967.14. No, he will be \$1032.86 below his target.

9.  Jenny invests \$3800 every half-year at an interest rate of 4% p.a.
    compounded six-monthly for 4 years. What will be the amount of
    interest earned?

\$2215.40

10. Ingrid wants to have \$5000 in 3 years' time. She invests in an
    annuity that pays 10% p.a. compounding quarterly. How much does she
    need to deposit at the end of each quarter to achieve this result?

\$362.43

11. Adrian wants to have \$8000 in 5 years' time. How much would he need
    to deposit annually into an annuity that pays 6% p.a. interest?

\$1419.17

12. Robert and Jo want to present their new baby with \$25 000 on her
    21st birthday. They decide to put a fixed amount every 6 months
    after her birth into an annuity that pays 9% p.a. compounding
    6-monthly. How much do they need to deposit each 6 months?

\$210.22

Mastery

13. **2017 HSC Standard 2 Band 5**

![](media/Financial Mathematics/media/image14.png){width="4.294479440069991in"
height="1.9938648293963255in"}A table of future value interest factors
for an annuity of \$1 is shown.

> An annuity involves contributions of \$12 000 per annum for 5 years.
> The interest rate is 4% per annum, compounded annually.

a.  Calculate the future value of this annuity.

\$64 995.60

b.  Calculate the interest earned on this annuity.

\$4995.60

14. **2022 HSC Standard 2 Band 5**

![](media/Financial Mathematics/media/image15.png){width="3.701388888888889in"
height="1.375in"}The table shows the future value of an annuity of \$1.

Zal is saving for a trip and estimates he will need \$15 000. He opens
an account earning 3% per annum, compounded annually.

a.  How much does Zal need to deposit every year if he wishes to have
    enough money for the trip in 4 years' time?

$$FV = FV\ of\ \$ 1 \times Regular\ contribution\ amount$$

$$15000 = 4.184 \times x$$

$$x = \frac{15000}{4.184} = \$ 3585.09$$

b.  How much interest will Zal earn on his investment over the 4 years?
    Give your answer to the nearest dollar.  

$$I = FV - total\ payments\ \ $$

$$I = 15000 - 14340.36\ \ \ \ \ $$

$= \$ 660$ (nearest dollar)

15. **2019 HSC Standard 2 Band 5**

> ![](media/Financial Mathematics/media/image15.png){width="3.9007895888013997in"
> height="1.449073709536308in"}The table shows the future values of an
> annuity of \$1 for different interest rates for 4, 5 and 6 years. The
> contributions are made at the end of each year.
>
> Contributions of \$2000 are made at the end of each year for 7 years.

For the first 6 years, the interest rate is 4% per annum, compounding
annually.

For the 7th year, the interest rate increases to 5% per annum,
compounding annually.

Show that the total amount at the end of the 7^th^ year is \$15 929.30

Value after 6 years $2000 \times 6.633 = \$ 13266$

At the end of 7^th^ year: $13266 \times 1.05 + 2000 = \$ 15929.30$

16. **2022 HSC Standard 2 Band 5**

![](media/Financial Mathematics/media/image16.png){width="5.9751202974628175in"
height="0.6396380139982503in"}Eli is choosing between two investment
options.

![](media/Financial Mathematics/media/image16.png){width="5.972222222222222in"
height="0.6715277777777777in"}

A table of future value interest factors for an annuity of \$1 is shown.

![](media/Financial Mathematics/media/image17.png){width="5.741666666666666in"
height="1.9236111111111112in"}

What is the difference between the future values after 10 years using
Option 1 and Option 2?

Option 1: $40000\left( 1 + \frac{0.012}{12} \right)^{120} = \$ 45097.17$

Option 2: $1000 \times 45.05630 = \$ 45056.30$

Difference: $\$ 40.87$

# Annuities as a Geometric Series

+----------------------------------------------------------------------------+
| - **Review**                                                               |
+============================================================================+
| - Identify $n$^th^ term of a geometric sequence $T_{n} = ar^{n - 1}$       |
|                                                                            |
| +------------------------------+-----------------------------------------+ |
| | a.  What is the 20^th^ term  | b.  What is the $n$^th^ term of         | |
| |     of:                      |                                         | |
| |                              | $$30,\ 30(1.5),\ 30(1.5)^{2},\ \ldots$$ | |
| | $$3,\ 6,\ 12,\ \ldots$$      |                                         | |
| +==============================+=========================================+ |
|                                                                            |
| - Recall geometric series sum formula $S_{n} =$                            |
|   $\frac{a\left( r^{n} - 1 \right)}{r - 1}$                                |
|                                                                            |
| +-----------------------------------------------------------------------+  |
| | a.  Find the sum of:                                                  |  |
| |                                                                       |  |
| | $$100 + 100(1.2) + 100(1.2)^{2} + \ldots + 100(1.2)^{9}$$             |  |
| +=======================================================================+  |
| | b.  Find the sum of:                                                  |  |
| |                                                                       |  |
| | $$1500(1.06)^{24} + 1500(1.06)^{23} + 1500(1.06)^{22} + \ldots 1500$$ |  |
| +-----------------------------------------------------------------------+  |
+----------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------+
| - **Investigation** Annuities are a geometric series                                                   |
+========================================================================================================+
| On Amy's first birthday, her parents contribute \$1000 to a savings account.                           |
|                                                                                                        |
| Interest is 5% p.a compounded annually.                                                                |
|                                                                                                        |
| They continue to deposit \$1000 on each birthday until she is 18, including on her 18^th^ birthday.    |
|                                                                                                        |
| How much is the account worth on her 18^th^ birthday?                                                  |
|                                                                                                        |
| **Method 1: A table**                                                                                  |
|                                                                                                        |
|   --------------------------------------------------------------------------                           |
|    **Year**   **Balance at   **Interest**   **Payment**   **Balance at End**                           |
|                 start**                                                                                |
|   ---------- -------------- -------------- -------------- ------------------                           |
|       1            0              0             1000             1000                                  |
|                                                                                                        |
|       2           1000            50            1000             2050                                  |
|                                                                                                        |
|      ...                                                                                               |
|                                                                                                        |
|       18                                                                                               |
|   --------------------------------------------------------------------------                           |
|                                                                                                        |
| It is tiresome to complete this table for 18 rows, but we could analyse this recurrence relation with  |
| a spreadsheet very quickly. Let's do that now.                                                         |
|                                                                                                        |
| The answer is: ..................                                                                      |
|                                                                                                        |
| But it would be *even faster* if we could get a formula so that we can input 18 and quickly get the    |
| answer. We would also be able to use the formula to solve problems algebraically, e.g. 'what does the  |
| contribution need to be so that Amy has exactly \$100 000 on her 18^th^ birthday'.                     |
|                                                                                                        |
| **Method 2: Modelling as a geometric series.**                                                         |
|                                                                                                        |
| 1^st^ birthday: $1000$                                                                                 |
|                                                                                                        |
| 2^nd^ birthday: $1000(1.05) + 1000$                                                                    |
|                                                                                                        |
| 3^rd^ birthday: $\left\lbrack 1000(1.05) + 1000 \right\rbrack(1.05) + 1000$                            |
|                                                                                                        |
| $=$                                                                                                    |
| ...................................................................................................... |
|                                                                                                        |
| 4^th^ birthday:                                                                                        |
| ...................................................................................................... |
|                                                                                                        |
| $=$                                                                                                    |
| ...................................................................................................... |
|                                                                                                        |
| ...                                                                                                    |
|                                                                                                        |
| $n$^th^ birthday:                                                                                      |
|                                                                                                        |
| 18^th^ birthday:                                                                                       |
|                                                                                                        |
| This is a geometric series, the sum of which we can find with:                                         |
|                                                                                                        |
| $$S_{n} = a\left\lbrack \frac{R^{n} - 1}{R - 1} \right\rbrack$$                                        |
|                                                                                                        |
| \$28132.38                                                                                             |
+--------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------+
| - **Annuity as a Geometric Series**                                                                                                     |
+=========================================================================================================================================+
| For $n$ end-of-period contributions of $a$ at interest-rate-per-period $r$:                                                             |
|                                                                                                                                         |
| The future value at the end of $n$ periods is:                                                                                          |
|                                                                                                                                         |
| $$FV = \underset{\begin{array}{r}                                                                                                       |
| First \\                                                                                                                                |
| contribution                                                                                                                            |
| \end{array}}{\overset{a(1 + r)^{n - 1}}{︸}} + a(1 + r)^{n - 2} + \ldots + a(1 + r)^{1} + \underset{final}{\overset{\ a\ \ \ \ }{︸}}$$ |
|                                                                                                                                         |
| Which is a geometric series, $FV =$ $a\left\lbrack \frac{\left( R^{n} - 1 \right)}{R - 1} \right\rbrack$ with common ratio              |
| $\mathbf{R = 1 + r}$                                                                                                                    |
|                                                                                                                                         |
| - This finds future value at the *end* of a period, with *end-of-period* contributions, starting with \$0 in an account.\               |
|   Questions can vary the scenario with start of period contributions, starting with a lump sum, etc.\                                   |
|   You must derive the formula from a geometric series for each question.                                                                |
|                                                                                                                                         |
| - $\frac{R^{n} - 1}{R - 1}$ gives the future value of \$1.                                                                              |
+-----------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------+
| - **Example** Model an annuity as a geometric series                |
+=====================================================================+
| A sum of \$1500 is invested at the end of each year in a            |
| superannuation fund.                                                |
|                                                                     |
| If interest is paid at 6% p.a., how much money will be available at |
| the end of 25 years?                                                |
|                                                                     |
| End of 1^st^ yr: $1500$                                             |
|                                                                     |
| End of 2^nd^ yr: $1500(1.06) + 1500$                                |
|                                                                     |
| End of 3^rd^ yr:                                                    |
| $\left\lbrack 1500(1.06) + 1500 \right\rbrack(1.06) + 1500$         |
|                                                                     |
| $= 1500(1.06)^{2} + 1500(1.06) + 1500$                              |
|                                                                     |
| ...                                                                 |
|                                                                     |
| End of 25^th^ yr:                                                   |
| $1500(1.06)^{24} + 1500(1.06)^{23} + 1500(1.06)^{22} + \ldots 1500$ |
|                                                                     |
| This is a geometric series with $a = 1500$, $r = 1.06,\ n = 25$     |
|                                                                     |
| $${FV = \frac{a\left( R^{n} - 1 \right)}{R - 1}                     |
| }{FV_{25} = \frac{1500\left( {1.06}^{25} - 1 \right)}{1.06 - 1}     |
| }{= \$ 82\ 296.77}$$                                                |
+---------------------------------------------------------------------+

+-------------------------------------------------------------------+
| - **Guided Practice**                                             |
+===================================================================+
| a.  A sum of \$1500 is invested at the end of each year for 15    |
|     years at 8% p.a.                                              |
|                                                                   |
| Find the amount of superannuation available at the end of the 15  |
| years.                                                            |
|                                                                   |
| \$40 728.17                                                       |
+-------------------------------------------------------------------+
| b.  \$50 is put into an investment account at the end of each     |
|     month.\                                                       |
|     If interest is paid at 12% p.a. compounded monthly, how much  |
|     is in the account at the end of 10 years?                     |
|                                                                   |
| \$11 501.93                                                       |
+-------------------------------------------------------------------+
| c.  Zoe invests \$10 000 in a superannuation scheme at the end of |
|     each year.\                                                   |
|     The money earns compound interest at 7% p.a.                  |
|                                                                   |
| **i** Find when the fund first exceeds \$500 000.                 |
|                                                                   |
| **ii** What annual instalment would produce \$1000 000 after 30   |
| years?                                                            |
|                                                                   |
| End of 23rd year                                                  |
|                                                                   |
| \$10 586.40 per year                                              |
+-------------------------------------------------------------------+

Foundation

1.  Find the future value of an investment of \$1 at the end of each
    year for 19 years at 7% p.a.

End of 1st yr: $1$

End of 2nd yr: $1.07 + 1$

End of 19th yr: ${1.07}^{18} + {1.07}^{17} + \cdots + 1$

This is a geometric series with $a = 1$, $r = 1.07$, $n = 19$.

$$FV = \frac{{1.07}^{19} - 1}{1.07 - 1} = \$ 37.38$$

2.  Jacqueline puts aside \$500 at the end of each year for 5 years.\
    If the money is invested at 6.5% p.a., how much will she have at the
    end of the 5 years?

End of 1st yr: $500$

End of 2nd yr: $500(1.065) + 500$

End of 5th yr: $500(1.065)^{4} + 500(1.065)^{3} + \cdots + 500$

This is a geometric series with $a = 500$, $r = 1.065$, $n = 5$.

$$FV = \frac{500({1.065}^{5} - 1)}{1.065 - 1} = \$ 2846.82$$

3.  Xuan is saving up for a holiday. She invests \$800 at the end of
    each year at 7.5% p.a.\
    How much will she have for her holiday after 5 years' time?

End of 1st yr: $800$

End of 2nd yr: $800(1.075) + 800$

End of 5th yr: $800(1.075)^{4} + 800(1.075)^{3} + \cdots + 800$

This is a geometric series with $a = 800$, $r = 1.075$, $n = 5$.

$$FV = \frac{800({1.075}^{5} - 1)}{1.075 - 1} = \$ 4646.71$$

4.  A school invests \$5000 at the end of each year at 6% p.a. to go
    towards a new library.\
    How much will the school have after 10 years?

End of 1st yr: $5000$

End of 2nd yr: $5000(1.06) + 5000$

End of 10th yr: $5000(1.06)^{9} + 5000(1.06)^{8} + \cdots + 5000$

This is a geometric series with $a = 5000$, $r = 1.06$, $n = 10$.

$$FV = \frac{5000({1.06}^{10} - 1)}{1.06 - 1} = \$ 65\, 903.97$$

5.  A sum of \$1500 is invested at the end of each year for 15 years at
    8% p.a.\
    Find the amount of superannuation available at the end of the 15
    years.

End of 1st yr: $1500$

End of 2nd yr: $1500(1.08) + 1500$

End of 15th yr: $1500(1.08)^{14} + 1500(1.08)^{13} + \cdots + 1500$

This is a geometric series with $a = 1500$, $r = 1.08$, $n = 15$.

$$FV = \frac{a(r^{n} - 1)}{r - 1}$$

$$FV = \frac{1500({1.08}^{15} - 1)}{1.08 - 1} = \$ 40\, 728.17$$

Development

6.  Miguel's mother invests \$200 for him each birthday up to and
    including his 18th birthday.\
    The money earns 6% p.a. How much money will Miguel have on his 18th
    birthday?

On the 1st birthday: $200$

On the 2nd birthday: $200(1.06) + 200$

On the 18th birthday: $200(1.06)^{17} + 200(1.06)^{16} + \cdots + 200$

This is a geometric series with $a = 200$, $r = 1.06$, $n = 18$.

$$FV = \frac{200({1.06}^{18} - 1)}{1.06 - 1} = \$ 6181.13$$

7.  Liam wants to save up \$15 000 for a car in 5 years' time.\
    He invests \$2000 at the end of each year in an account that pays
    7.5% p.a. interest.\
    How much more will Liam have to pay at the end of 5 years to make up
    the \$15 000?

End of 1st yr: $2000$

End of 2nd yr: $2000(1.075) + 2000$

End of 5th yr: $2000(1.075)^{4} + 2000(1.075)^{3} + \cdots + 2000$

This is a geometric series with $a = 2000$, $r = 1.075$, $n = 5$.

$$FV = \frac{2000({1.075}^{5} - 1)}{1.075 - 1} = \$ 11\, 616.78$$

Amount still needed:

$$15000 - 11616.78 = \$ 3383.22$$

8.  Prim is saving up to go overseas in 8 years' time. She invests
    \$1000 at the end of each year at 7% p.a. and estimates that the
    trip will cost her around \$10 000. Will she have enough?\
    If so, how much over will it be? If she doesn't have enough, how
    much will she need to add to this money to make it up to the \$10
    000?

End of 1st yr: $1000$

End of 2nd yr: $1000(1.07) + 1000$

End of 8th yr: $1000(1.07)^{7} + 1000(1.07)^{6} + \cdots + 1000$

This is a geometric series with $a = 1000$, $r = 1.07$, $n = 8$.

$$FV = \frac{1000({1.07}^{8} - 1)}{1.07 - 1} = \$ 10\, 259.80$$

Amount over $\$ 10\, 000$:

$$10259.80 - 10000 = \$ 259.80$$

Therefore she has enough and is $\$ 259.80$ over.

9.  Jodie starts work in 2019 and puts \$1000 in a superannuation fund
    at the end of the year.\
    She keeps putting in this same amount at the end of every year until
    she retires at the end of 2036. If interest is paid at 10% p.a.,
    calculate how much Jodie will have when she retires.

There are $18$ end-of-year deposits from $2019$ to $2036$ inclusive.

End of 2019: $1000$

End of 2020: $1000(1.10) + 1000$

End of 2036: $1000(1.10)^{17} + 1000(1.10)^{16} + \cdots + 1000$

This is a geometric series with $a = 1000$, $r = 1.10$, $n = 18$.

$$FV = \frac{1000({1.10}^{18} - 1)}{1.10 - 1} = \$ 45\, 599.17$$

10. Lucia saves up \$2000 each year and at the end of the year she
    invests it at 6% p.a.\
    She does this for 10 years.

    a.  What is her investment worth?

    b.  Lucia continues investing \$2000 a year for 5 more years.\
        What is the future value of her investment?

End of 1st yr: $2000$

End of 2nd yr: $2000(1.06) + 2000$

End of 10th yr: $2000(1.06)^{9} + 2000(1.06)^{8} + \cdots + 2000$

This is a geometric series with $a = 2000$, $r = 1.06$, $n = 10$.

$$FV = \frac{2000({1.06}^{10} - 1)}{1.06 - 1} = \$ 26\, 361.59$$

Lucia invests for $15$ years in total.

End of 15th yr: $2000(1.06)^{14} + 2000(1.06)^{13} + \cdots + 2000$

This is a geometric series with $a = 2000$, $r = 1.06$, $n = 15$.

$$FV = \frac{2000({1.06}^{15} - 1)}{1.06 - 1} = \$ 46\, 551.94$$

11. Asam cannot decide whether to invest \$1000 at the end of each year
    for 15 years or \$500 for 30 years in a superannuation fund.\
    If the interest rate is 5% p.a., which would be the better
    investment for Asam?

Option 1: $\$ 1000$ at the end of each year for $15$ years.

End of 15th yr: $1000(1.05)^{14} + 1000(1.05)^{13} + \cdots + 1000$

This is a geometric series with $a = 1000$, $r = 1.05$, $n = 15$.

$$FV_{1} = \frac{1000({1.05}^{15} - 1)}{1.05 - 1} = \$ 21\, 578.56$$

Option 2: $\$ 500$ at the end of each year for $30$ years.

End of 30th yr: $500(1.05)^{29} + 500(1.05)^{28} + \cdots + 500$

This is a geometric series with $a = 500$, $r = 1.05$, $n = 30$.

$$FV_{2} = \frac{500({1.05}^{30} - 1)}{1.05 - 1} = \$ 33\, 219.42$$

Therefore $\$ 500$ for $30$ years is better by $\$ 11\, 640.86$.

# Other Annuity Problems

+--------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                            |
+==================================================================================================+
| a.  Alyssa invests \$5000 in a superannuation scheme at the **beginning** of each year.\         |
|     The money earns compound interest at 8% p.a. compounded annually.\                           |
|     Calculate the value of her investment at the **end** of 10 years.                            |
|                                                                                                  |
| \$78 227.44                                                                                      |
+--------------------------------------------------------------------------------------------------+
| b.  Jimmy invests \$2500 in a superannuation scheme at the **beginning** of each year.\          |
|     The money earns compound interest at 11% p.a. compounded annually.\                          |
|     Calculate the value of his investment at the **end** of 13 years.                            |
|                                                                                                  |
| \$72 727.30                                                                                      |
+--------------------------------------------------------------------------------------------------+
| c.  An account starts with \$4000.\                                                              |
|     A further \$500 is deposited at the end of each year for 5 years. Interest is 3% p.a.\       |
|     Find the value of the account at the end of the 5^th^ year.                                  |
|                                                                                                  |
| \$7291.66                                                                                        |
+--------------------------------------------------------------------------------------------------+
| d.  An account starts with \$12 000.\                                                            |
|     A further \$1000 is deposited at the end of each year for 7 years. Interest is 5% p.a.\      |
|     Find the value of the account at the end of the 7^th^ year.                                  |
|                                                                                                  |
| \$25 027.21                                                                                      |
+--------------------------------------------------------------------------------------------------+
| - **Investigation** Annuity withdrawals                                                          |
+--------------------------------------------------------------------------------------------------+
| A fund begins with \$30 000. It earns 6% p.a. compounding monthly.\                              |
| At the end of each month, \$1500 is withdrawn. Find how much remains after 1 year.               |
|                                                                                                  |
| Start: $\$ 30\ 000$                                                                              |
|                                                                                                  |
| After 1 month: $\$ 30\ 000(1.06)\  - \ 1500$                                                     |
|                                                                                                  |
| After 2 months: $\left( \$ 30\ 000(1.06) - 1500 \right)(1.06) - 1500$                            |
|                                                                                                  |
| $=$ .........................................................                                    |
|                                                                                                  |
| After 3 months:                                                                                  |
| ................................................................................................ |
|                                                                                                  |
| $=$ .........................................................                                    |
|                                                                                                  |
| ...                                                                                              |
|                                                                                                  |
| After $n$ months:                                                                                |
|                                                                                                  |
| After 1 year:                                                                                    |
|                                                                                                  |
| \$7291.66                                                                                        |
+--------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------+
| - **Types of Annuity Problems**                                                          |
+==========================================================================================+
| **Ordinary annuity**                                                                     |
|                                                                                          |
| End-of-period contributions with end-of-period compounding.                              |
|                                                                                          |
| $$FV = a\left\lbrack \frac{(1 + r)^{n} - 1}{(1 + r) - 1} \right\rbrack$$                 |
|                                                                                          |
| **Annuity due**                                                                          |
|                                                                                          |
| Start-of-period contributions with end-of-period compounding.                            |
|                                                                                          |
| Set up geometric series and multiply by one more of $(1 + r)$:                           |
|                                                                                          |
| $$FV = a\left\lbrack \frac{(1 + r)^{n} - 1}{(1 + r) - 1} \right\rbrack(1 + r)$$          |
|                                                                                          |
| **Annuity with starting lump sum**                                                       |
|                                                                                          |
| Split account into two parts, the original lump sum, $PV$, which earns compound interest |
| separately, and the ordinary annuity of the regular contributions.                       |
|                                                                                          |
| $$FV = PV(1 + r)^{n} + a\left\lbrack \frac{(1 + r)^{n} - 1}{(1 + r) - 1} \right\rbrack$$ |
|                                                                                          |
| **Annuity withdrawal problem:**                                                          |
|                                                                                          |
| Treat your starting amount as if you never touch it and continue to compound.            |
|                                                                                          |
| Treat your withdrawals as a parallel timeline and subtract; every time you take money    |
| out, you lose out on the future interest that specific cash would have earned.           |
|                                                                                          |
| $$FV = PV(1 + r)^{n} - a\left\lbrack \frac{(1 + r)^{n} - 1}{(1 + r) - 1} \right\rbrack$$ |
+------------------------------------------------------------------------------------------+

Development

1.  A couple saves \$3000 at the beginning of each year towards a
    deposit on a house.\
    If the interest rate is 5% p.a., how much will the couple have saved
    after 6 years?

Payments are made at the beginning of each year.

End of 1st yr: $3000(1.05)$

End of 2nd yr: $3000(1.05)^{2} + 3000(1.05)$

End of 6th yr: $3000(1.05)^{6} + 3000(1.05)^{5} + \cdots + 3000(1.05)$

Factor out $1.05$:

$$FV = 3000(1.05)\left( 1 + 1.05 + \cdots + {1.05}^{5} \right)$$

This is a geometric series with $a = 3000(1.05)$, $r = 1.05$, $n = 6$.

$$FV = \frac{3000(1.05)({1.05}^{6} - 1)}{1.05 - 1} = \$ 21\, 426.03$$

2.  Bol invests \$1000 at the beginning of each year. The interest rate
    is 8% p.a.

    a.  How much will her investment be worth after 6 years?

    b.  How much more would Bol's investment be worth after 6 years if
        she had invested \$1200 each year?

Payments are made at the beginning of each year.

End of 1st yr: $1000(1.08)$

End of 2nd yr: $1000(1.08)^{2} + 1000(1.08)$

End of 6th yr: $1000(1.08)^{6} + 1000(1.08)^{5} + \cdots + 1000(1.08)$

This is a geometric series with $a = 1000(1.08)$, $r = 1.08$, $n = 6$.

$$FV = \frac{1000(1.08)({1.08}^{6} - 1)}{1.08 - 1} = \$ 7922.80$$

The extra investment is $\$ 200$ at the beginning of each year.

End of 6th yr: $200(1.08)^{6} + 200(1.08)^{5} + \cdots + 200(1.08)$

This is a geometric series with $a = 200(1.08)$, $r = 1.08$, $n = 6$.

Extra value:

$$\frac{200(1.08)({1.08}^{6} - 1)}{1.08 - 1} = \$ 1584.56$$

3.  An account begins with \$10 000. At the end of each year, a further
    \$1500 is deposited.\
    The account earns 6% p.a. Find the value of the account after 8
    years.

Start: $10000$

End of 1st yr: $10000(1.06) + 1500$

End of 2nd yr: $10000(1.06)^{2} + 1500(1.06) + 1500$

End of 8th yr:
$10000(1.06)^{8} + 1500(1.06)^{7} + 1500(1.06)^{6} + \cdots + 1500.$

The regular deposits form a geometric series with
$a = 1500,\quad\quad r = 1.06,\quad\quad n = 8.$

$$FV = 10000(1.06)^{8} + \frac{1500({1.06}^{8} - 1)}{1.06 - 1}.$$

$$FV = 15938.48 + 14846.20 = 30784.68.$$

4.  Asam cannot decide whether to invest \$1000 at the end of each year
    for 15 years or \$500 for 30 years in a superannuation fund.\
    If the interest rate is 5% p.a., which would be the better
    investment for Asam?

Option 1: $\$ 1000$ at the end of each year for $15$ years.

End of 15th yr: $1000(1.05)^{14} + 1000(1.05)^{13} + \cdots + 1000$

This is a geometric series with $a = 1000$, $r = 1.05$, $n = 15$.

$$FV_{1} = \frac{1000({1.05}^{15} - 1)}{1.05 - 1} = \$ 21\, 578.56$$

Option 2: $\$ 500$ at the end of each year for $30$ years.

End of 30th yr: $500(1.05)^{29} + 500(1.05)^{28} + \cdots + 500$

This is a geometric series with $a = 500$, $r = 1.05$, $n = 30$.

$$FV_{2} = \frac{500({1.05}^{30} - 1)}{1.05 - 1} = \$ 33\, 219.42$$

Therefore $\$ 500$ for $30$ years is better by $\$ 11\, 640.86$.

5.  Each year on her birthday, Jane's parents put \$20 into an
    investment account earning $9\frac{1}{2}\%$ per annum compound
    interest. The first deposit took place on the day of her birth. On
    her 18th birthday, Jane's parents gave her the account and \$20 cash
    in hand.

    a.  How much money had Jane's parents deposited in the account?

    b.  How much money did she receive from her parents on her 18th
        birthday?

\(a\)

The account receives deposits from birth to the $17$th birthday.

There are $18$ deposits.

$$18(20) = \$ 360$$

\(b\)

On the $18$th birthday, the account contains:

$$20(1.095)^{18} + 20(1.095)^{17} + \cdots + 20(1.095)$$

This is a geometric series with $a = 20(1.095)$, $r = 1.095$, $n = 18$.

$$FV = \frac{20(1.095)({1.095}^{18} - 1)}{1.095 - 1} = \$ 950.27$$

Add the $\$ 20$ cash:

$$950.27 + 20 = \$ 970.27$$

6.  A fund begins with \$20 000 and earns 6% p.a. At the end of each
    year, \$3000 is withdrawn. Find how much remains in the fund after 4
    years.

Start: $20000$

After 1 year: $20000(1.06) - 3000$

After 2 years:
$\left( 20000(1.06) - 3000 \right)(1.06) - 3000 = 20000(1.06)^{2} - 3000(1.06) - 3000.$

After 4 years:
$A_{4} = 20000(1.06)^{4} - 3000(1.06)^{3} - 3000(1.06)^{2} - 3000(1.06) - 3000.$

The withdrawal terms form a geometric series with
$a = 3000,\quad\quad r = 1.06,\quad\quad n = 4.$

$$A_{4} = 20000(1.06)^{4} - \frac{3000({1.06}^{4} - 1)}{1.06 - 1}.$$

$$A_{4} = 25249.54 - 13123.85 = 12125.69.$$

7.  Mia deposits \$250 at the beginning of each month for 4 years into
    an account earning 7.2% p.a., compounded monthly. Find the value of
    her investment at the end of the 4 years.

Monthly growth factor:

$$r = 1 + \frac{0.072}{12} = 1.006.$$

Number of deposits: $n = 4 \times 12 = 48.$

Payments are made at the beginning of each month.

After 1 month: $250r$

After 2 months: $250r^{2} + 250r$

After 48 months: $250r^{48} + 250r^{47} + \cdots + 250r.$

This is a geometric series with
$a = 250r,\quad\quad r = 1.006,\quad\quad n = 48.$

$$FV = \frac{250r(r^{48} - 1)}{r - 1}.$$

Substituting (r=1.006),

$$FV = \frac{250(1.006)({1.006}^{48} - 1)}{0.006}.$$

$$FV = 13941.90.$$

8.  A fund begins with \$30 000. It earns 6% p.a., compounded monthly.\
    At the end of each month, \$1500 is withdrawn. Find how much remains
    after 1 year.

Monthly growth factor:

$$r = 1 + \frac{0.06}{12} = 1.005.$$

Number of withdrawals: $n = 12.$

After 1 month: $30000r - 1500$

After 2 months: $30000r^{2} - 1500r - 1500$

After 12 months:
$A_{12} = 30000r^{12} - 1500r^{11} - 1500r^{10} - \cdots - 1500.$

The withdrawal terms form a geometric series with
$a = 1500,\quad\quad r = 1.005,\quad\quad n = 12.$

$$A_{12} = 30000r^{12} - \frac{1500(r^{12} - 1)}{r - 1}.$$

Substituting (r=1.005),

$$A_{12} = 30000(1.005)^{12} - \frac{1500({1.005}^{12} - 1)}{0.005}.$$

$$A_{12} = 31850.33 - 18503.34 = 13346.99.$$

Mastery

9.  Finster and Finster Superannuation offer a superannuation scheme
    with annual contributions of \$12 000 invested at an interest rate
    of 9% p.a., compounded annually. Contributions are paid on 1st of
    January each year.

    a.  Zoya decides to invest in the fund for the next 20 years. Show
        that the final value of her investment is given by

$$A_{20} = \frac{12000 \times 1.09 \times ({1.09}^{20} - 1)}{0.09}$$

b.  Evaluate $A_{20}$.

c.  By how much does this exceed the total contributions Zoya made?

d.  The company agrees to let Zoya make a higher contribution to the
    scheme.\
    Let this instalment be $M$. Show that in this case

$$A_{20} = \frac{M \times 1.09 \times ({1.09}^{20} - 1)}{0.09}$$

e.  What would Zoya's annual contribution have to be in order for her
    superannuation to have a total value of \$1 000 000 at the end of
    the 20 years?

\(a\)

Contributions are paid on $1$ January each year.

End of 1st yr: $12000(1.09)$

End of 2nd yr: $12000(1.09)^{2} + 12000(1.09)$

End of 20th yr:

$$A_{20} = 12000(1.09)^{20} + 12000(1.09)^{19} + \cdots + 12000(1.09)$$

Factor out $12000(1.09)$:

$$A_{20} = 12000(1.09)\left( 1 + 1.09 + \cdots + {1.09}^{19} \right)$$

This is a geometric series with $a = 12000(1.09)$, $r = 1.09$, $n = 20$.

$$A_{20} = \frac{12000(1.09)({1.09}^{20} - 1)}{1.09 - 1}$$

\(b\)

Using the geometric-series result from part (a):

$$A_{20} = \frac{12000(1.09)({1.09}^{20} - 1)}{0.09} = \$ 669\, 174.36$$

\(c\)

Total contributions: $20(12000) = \$ 240\, 000$

Excess: $669174.36 - 240000 = \$ 429\, 174.36$

\(d\)

If the annual contribution is $M$:

End of 20th yr:

$$A_{20} = M(1.09)^{20} + M(1.09)^{19} + \cdots + M(1.09)$$

This is a geometric series with $a = M(1.09)$, $r = 1.09$, $n = 20$.

$$A_{20} = \frac{M(1.09)({1.09}^{20} - 1)}{0.09}$$

\(e\)

Using the geometric-series result from part (d):

$$1000000 = \frac{M(1.09)({1.09}^{20} - 1)}{0.09}$$

$$M = \$ 17\, 932.55$$

12. The company that Itsushi works for makes contributions to his
    superannuation scheme on 1st January each year. Any amount invested
    in this scheme earns interest at the rate of 7.5% p.a.

    a.  Let $M$ be the annual contribution. Show that the value of the
        investment at the end of the $n$th year is

$$A_{n} = \frac{M \times 1.075 \times ({1.075}^{n} - 1)}{0.075}$$

b.  Itsushi plans to have \$1 500 000 in superannuation when he retires
    in 25 years' time. Show that the company must contribute \$20 526.52
    each year, correct to the nearest cent.

c.  The first year that Itsushi's superannuation is worth more than
    \$750 000, he decides to change jobs. Let this year be $n$.

d.  Show that $n$ is the smallest integer solution of

> $$(1.075)^{n} > \frac{750000 \times 0.075}{20526.52 \times 1.075} + 1$$

i.  Evaluate the right-hand side and hence show that
    $(1.075)^{n} > 3.5492$.

ii. Use logarithms or trial-and-error to find the value of $n$.

\(a\)

Contributions are made on $1$ January.

End of 1st yr: $M(1.075)$

End of 2nd yr: $M(1.075)^{2} + M(1.075)$

End of $n$th yr:

$$A_{n} = M(1.075)^{n} + M(1.075)^{n - 1} + \cdots + M(1.075)$$

This is a geometric series with $a = M(1.075)$, $r = 1.075$, $n$ terms.

$$A_{n} = \frac{M(1.075)({1.075}^{n} - 1)}{1.075 - 1}$$

$$A_{n} = \frac{M(1.075)({1.075}^{n} - 1)}{0.075}$$

\(b\)

For $25$ years:

$$A_{25} = M(1.075)^{25} + M(1.075)^{24} + \cdots + M(1.075)$$

Using the geometric-series result:

$$1500000 = \frac{M(1.075)({1.075}^{25} - 1)}{0.075}$$

$$M = \$ 20\, 526.52$$

(c)(i)

Using the geometric-series formula from part (a):

$$\frac{20526.52(1.075)({1.075}^{n} - 1)}{0.075} > 750000$$

$${1.075}^{n} > \frac{750000(0.075)}{20526.52(1.075)} + 1$$

(c)(ii)

$$\frac{750000(0.075)}{20526.52(1.075)} + 1 = 3.5492$$

$${1.075}^{n} > 3.5492$$

(c)(iii)

$$n > \frac{\log 3.5492}{\log 1.075}$$

$$n > 17.515\ldots$$

Therefore $n = 18$.

13. An investment account begins with an amount $P$.\
    A further \$5000 is deposited at the end of each year for 15 years.\
    The account earns 8% p.a., and its value at the end of 15 years is
    \$180 000.\
    Write an expression for the final value in terms of $P$ and find the
    initial amount $P$.

The starting amount grows for 15 years: $P(1.08)^{15}.$

At the end of 15 years, the regular deposits are worth
$5000(1.08)^{14} + 5000(1.08)^{13} + \cdots + 5000.$

The deposit terms form a geometric series with
$a = 5000,\quad\quad r = 1.08,\quad\quad n = 15.$

$${180000 = P(1.08)^{15} + \frac{5000({1.08}^{15} - 1)}{1.08 - 1}.
}{180000 = P(1.08)^{15} + 135760.57.
}{P(1.08)^{15} = 44239.43.
}{P = \frac{44239.43}{{1.08}^{15}} = 13946.11.}$$

The account must begin with **\$13 946.11**.

14. A retiree wants to withdraw \$2000 at the end of each month for 10
    years.\
    The fund earns 4.8% p.a., compounded monthly, and the retiree wants
    the balance to be exactly \$0 after the final withdrawal.\
    Let the required initial investment be $P$. Form a geometric-series
    equation for $P$ and find $P$.

Monthly growth factor:

$$r = 1 + \frac{0.048}{12} = 1.004.$$

Number of withdrawals: $n = 10 \times 12 = 120.$

After 120 months:
$A_{120} = Pr^{120} - 2000r^{119} - 2000r^{118} - \cdots - 2000.$

The withdrawal terms form a geometric series with
$a = 2000,\quad\quad r = 1.004,\quad\quad n = 120.$

The fund is to be exactly exhausted after the final withdrawal, so

$${A_{120} = 0.
}{0 = Pr^{120} - \frac{2000(r^{120} - 1)}{r - 1}.
}{Pr^{120} = \frac{2000(r^{120} - 1)}{r - 1}.
}{P = \frac{2000(r^{120} - 1)}{r^{120}(r - 1)}.
}{P = \frac{2000({1.004}^{120} - 1)}{{1.004}^{120}(0.004)}.
}{P = 190311.94.}$$

Therefore, the retiree needs an initial fund of **\$190 311.94**.

15. A retirement fund begins with **\$250 000**. It earns 6% p.a.,
    compounded monthly.\
    At the end of each month, **\$1800 is withdrawn**.

    a.  Let $A_{n}$ be the amount remaining after $n$ months. Show that

$$A_{n} = 250000(1.005)^{n} - \frac{1800({1.005}^{n} - 1)}{0.005}.$$

b.  Show that fund will not last for 20 years.

c.  Determine after how many complete monthly withdrawals the fund is
    exhausted, and the amount can be withdrawn on the final month.

Monthly growth factor:

$$r = 1 + \frac{0.06}{12} = 1.005.$$

After 1 month: $A_{1} = 250000r - 1800.$

After 2 months: $A_{2} = 250000r^{2} - 1800r - 1800.$

After $n$ months:
$A_{n} = 250000r^{n} - 1800r^{n - 1} - 1800r^{n - 2} - \cdots - 1800.$

The withdrawal terms form a geometric series with
$a = 1800,\quad\quad r = 1.005,\quad\quad n\text{ terms}.$

$${A_{n} = 250000r^{n} - \frac{1800(r^{n} - 1)}{r - 1}
}{A_{n} = 250000(1.005)^{n} - \frac{1800({1.005}^{n} - 1)}{0.005}}$$

Twenty years is $n = 20 \times 12 = 240\text{ months}.$

$${A_{240} = 250000(1.005)^{240} - \frac{1800({1.005}^{240} - 1)}{0.005}.
}{A_{240} = - 4122.49.}$$

Since the model gives a negative balance, the fund is exhausted **before
20 years**.

To find when the fund reaches zero, set

$${A_{n} = 0.
}{0 = 250000(1.005)^{n} - \frac{1800({1.005}^{n} - 1)}{0.005}.
}{0 = 1250(1.005)^{n} - 1800({1.005}^{n} - 1).
}{0 = 1250(1.005)^{n} - 1800(1.005)^{n} + 1800.
}{550(1.005)^{n} = 1800.
}{{1.005}^{n} = \frac{1800}{550} = 3.272727\ldots
}{n = \frac{log(3.272727\ldots)}{log(1.005)}.
}{n = 237.717\ldots}$$

Check the balance after 237 complete withdrawals: $A_{237} = 1285.18.$

Before the 238th withdrawal, this grows to $1285.18(1.005) = 1291.60.$

Therefore, **237 complete monthly withdrawals can be made**, and the
fund is exhausted during month 238, where a partial withdrawal of
\$1291.60 can be made.

# Reducing Balance Loans

+-----------------------------------------------------------------------------------------------------------------------------+
| - **Investigation** Reducing balance loans                                                                                  |
+=============================================================================================================================+
| A **flat-rate loan** is an application of simple interest.\                                                                 |
| The interest is calculated based on the initial amount borrowed.                                                            |
|                                                                                                                             |
| A **reducing balance loan** calculates interest based on the current amount owing and not the principal. Interest is        |
| calculated at the start of each repayment period.                                                                           |
|                                                                                                                             |
| As you make payments, the balance owing is reduced and so interest is reduced.                                              |
|                                                                                                                             |
| \$1000 is borrowed in a reducing balance loan at an interest rate of 24% per year.                                          |
|                                                                                                                             |
| Monthly repayments of \$30 are made.                                                                                        |
|                                                                                                                             |
|   -----------------------------------------------------------------------------------------------------------------------   |
|    **Months**      **Starting     **Interest\**                               **Repayment\**      **Ending Balance\**       |
|                    Balance\**     $$\mathbf{(I)}$$                           $$\mathbf{(R)}$$   $$\mathbf{(P + I - R)}$$    |
|                 $$\mathbf{(P)}$$                                                                                            |
|   ------------ ------------------ ----------------------------------------- ------------------ --------------------------   |
|        1          $$\$ 1000$$     $$1000 \times \frac{24\%}{12} = \$ 20$$       $$\$ 30$$              $$\$ 990$$           |
|                                                                                                                             |
|        2           $$\$ 990$$     $$990 \times$$                                $$\$ 30$$                                   |
|                                                                                                                             |
|        3                                                                        $$\$ 30$$                                   |
|                                                                                                                             |
|        4                                                                        $$\$ 30$$                                   |
|   -----------------------------------------------------------------------------------------------------------------------   |
|                                                                                                                             |
| How much interest was charged over the 4 months?                                                                            |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| What is happening to the amount of interest charged each month?                                                             |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| Is this more or less than on a flat-rate loan of 12% per year?                                                              |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| How much of the principal has been paid off after 4 months?                                                                 |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| You can save money on a reducing balance loan by:                                                                           |
|                                                                                                                             |
| - Paying more often (e.g. fortnightly rather than monthly).                                                                 |
|                                                                                                                             |
| - Making extra payments as often as possible.                                                                               |
|                                                                                                                             |
| - Increasing the size of each payment (even by a few dollars)                                                               |
+-----------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  Complete the table for a home loan of \$420 000 at a rate of 7.2%
    p.a. with a monthly repayment of \$3306.83.

  --------------------------------------------------------------------------------------------------------------------
   **Months**      **Starting     **Interest\**                            **Repayment\**   **Ending Balance\**
                   Balance\**     $$\mathbf{(I)}$$                        $$\mathbf{(R)}$$  $$\mathbf{(P + I - R)}$$
                $$\mathbf{(P)}$$                                                            
  ------------ ------------------ -------------------------------------- ------------------ --------------------------
       1           \$420 000      $$420000 \times \frac{7.2\%}{12} =$$       \$3306.83      \$419 213.17

       2          \$419 213.17    \$2515.28                                  \$3306.83      \$418 421.62

       3          \$418 421.62    \$2510.53                                  \$3306.83      \$417 625.32

       4          \$417 625.32    \$2505.75                                  \$3306.83      \$416 824.24
  --------------------------------------------------------------------------------------------------------------------

2.  Complete the table for a home loan of \$350 000 at a rate of 7.6%
    p.a. with a monthly repayment of \$2471.26.

  ----------------------------------------------------------------------------------------------------
   **Months**  **Starting         **Interest\**          **Repayment\**     **Ending Balance\**
               Balance\**         $$\mathbf{(I)}$$       $$\mathbf{(R)}$$   $$\mathbf{(P + I - R)}$$
               $$\mathbf{(P)}$$                                             
  ------------ ------------------ ---------------------- ------------------ --------------------------
       1       \$350 000          \$2216.67              \$2471.26          \$349 745.41

       2       \$349 745.41       \$2215.05              \$2471.26          \$349 489.20

       3       \$349 489.20       \$2213.43              \$2471.26          \$349 231.37

       4       \$349 231.37       \$2211.80              \$2471.26          \$348 971.91
  ----------------------------------------------------------------------------------------------------

a.  What is happening to the interest over time?

The interest is decreasing.

b.  What is the total repayment over the four months?\
    Compare this with how much of the principal you have paid off.

\$9885.04 paid, but only \$1028.09 of the principal paid off!

+-----------------------------------------------------------------------------------------------------+
| - **Investigation** Reducing balance loans                                                          |
+=====================================================================================================+
| A car loan of \$30 000 is taken out. It costs 6% p.a. compounding monthly.\                         |
| At the end of each month, \$1500 is repaid. Find the balance owing after 1 year.                    |
|                                                                                                     |
| Start: $30\ 000$                                                                                    |
|                                                                                                     |
| After 1 month: $30\ 000(1.06)\  - \ 1500$                                                           |
|                                                                                                     |
| After 2 months: $\left\lbrack 30\ 000(1.06) - 1500 \right\rbrack(1.06) - 1500$                      |
|                                                                                                     |
| $=$                                                                                                 |
| ................................................................................................... |
|                                                                                                     |
| After 3 months:                                                                                     |
| ................................................................................................... |
|                                                                                                     |
| $=$                                                                                                 |
| ................................................................................................... |
|                                                                                                     |
| ...                                                                                                 |
|                                                                                                     |
| After $n$ months:                                                                                   |
|                                                                                                     |
| After 1 year:                                                                                       |
|                                                                                                     |
| \$7291.66                                                                                           |
|                                                                                                     |
| What do you notice about reducing balance loans compared to the annuity withdrawals from the        |
| previous section?                                                                                   |
+-----------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------+
| - **Reducing Balance Loans**                                                             |
+==========================================================================================+
| Reducing balance loans are mathematically equivalent to an annuity withdrawal problem.   |
|                                                                                          |
| $$FV = PV(1 + r)^{n} - a\left\lbrack \frac{(1 + r)^{n} - 1}{(1 + r) - 1} \right\rbrack$$ |
|                                                                                          |
| - Derive the equation each time, do not rely on the formula.                             |
+------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------+
| - **Example** Calculate balance owing for a reducing balance loan                                 |
+===================================================================================================+
| A \$15 000 loan has an interest rate of 9.6% p.a. and monthly repayments of \$450.                |
|                                                                                                   |
| Find the balance owing after 18 repayments.                                                       |
|                                                                                                   |
| $$9.6\%\ p.a.\  \rightarrow 0.8\%\ monthly$$                                                      |
|                                                                                                   |
| Start: $15000$                                                                                    |
|                                                                                                   |
| 1^st^ repayment: $15000(1.008) - 450$                                                             |
|                                                                                                   |
| 2^nd^ repayment:                                                                                  |
| $\left\lbrack 15000(1.008) - 450 \right\rbrack(1.008) - 450 = 15000(1.08)^{2} - 450(1.008) - 450$ |
|                                                                                                   |
| 18^th^ repayment: $15000(1.008)^{18} - 450(1.008)^{17} - \ldots - 450$                            |
|                                                                                                   |
| The repayments form a geometric series with $a = 450,\ r = 1.008,\ n = 18$                        |
|                                                                                                   |
| $${FV_{18} = 15000(1.008)^{18} - 450\frac{(1.008)^{18} - 1}{1.008 - 1}                            |
| }{= \$ 8636.32}$$                                                                                 |
+---------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                         |
+===============================================================================================================+
| a.  \$60 000 at 6% p.a. compounded monthly, repayments \$900, after 5 years.                                  |
|                                                                                                               |
| \$18 137.98                                                                                                   |
+---------------------------------------------------------------------------------------------------------------+
| b.  \$12 000 at 8% p.a. compounded quarterly, repayments \$1000, after 2 years.                               |
|                                                                                                               |
| \$5476.94                                                                                                     |
+---------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate monthly repayments & interest on a reducing-balance loan                              |
+---------------------------------------------------------------------------------------------------------------+
| An \$18 000 loan is to be repaid in equal monthly instalments over 3 years at 12% p.a. compounded monthly.    |
|                                                                                                               |
| Find the monthly repayment to the nearest cent.                                                               |
|                                                                                                               |
| $$9\%\ p.a.\  \rightarrow 1\%\ monthly$$                                                                      |
|                                                                                                               |
| Let $M$ be monthly repayment.                                                                                 |
|                                                                                                               |
| Start: $18000$                                                                                                |
|                                                                                                               |
| 1^st^ repayment: $18000(1.01) - M$                                                                            |
|                                                                                                               |
| 2^nd^ repayment: $\left\lbrack 18000(1.01) - M \right\rbrack(1.01) - M = 18000(1.01)^{2} - M(1.01) - M$       |
|                                                                                                               |
| 36^th^ repayment: $18000(1.01)^{36} - M(1.01)^{35} - \ldots - M$                                              |
|                                                                                                               |
| The repayments form a geometric series with $a = M,\ r = 1.01,\ n = 36$                                       |
|                                                                                                               |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ FV = 18000(1.01)^{36} - M\frac{(1.01)^{36} - 1}{1.01 - 1}$$ |
|                                                                                                               |
| When loan is repaid, $FV = 0$                                                                                 |
|                                                                                                               |
| $${0 = 18000(1.01)^{36} - M\frac{(1.01)^{36} - 1}{0.1}                                                        |
| }{M\frac{(1.01)^{36} - 1}{1.01 - 1} = 18000(1.01)^{36}                                                        |
| }{M = \frac{18000(1.01)^{36}(0.1)}{(1.01)^{36} - 1} \approx \$ 597.86}$$                                      |
|                                                                                                               |
| The monthly repayment is \$$597.86$                                                                           |
|                                                                                                               |
| Using your rounded value above, find the total paid and therefore the interest paid.                          |
|                                                                                                               |
| Total paid: $\$ 597.86 \times 36 = \$ 21522.96$                                                               |
|                                                                                                               |
| Interest paid: $\$ 21522.96\  - \ 18000\  = \ \$ 3522.96$                                                     |
+---------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                    |
+==========================================================================================================================+
| Find the equal monthly repayments, and total interest paid, for:                                                         |
+--------------------------------------------------------------------------------------------------------------------------+
| a.  \$25 000 over 5 years at 6% p.a. compounded monthly.                                                                 |
|                                                                                                                          |
| \$483.32 per month \| \$28999.20 total repaid \| \$3999.20 interest                                                      |
+--------------------------------------------------------------------------------------------------------------------------+
| b.  \$12 000 over 4 years at 8% p.a. compounded quarterly.                                                               |
|                                                                                                                          |
| \$883.80 per quarter \| \$14140.80 total repaid \| \$2140.80 interest                                                    |
+--------------------------------------------------------------------------------------------------------------------------+
| - **Example** Calculate length of a loan                                                                                 |
+--------------------------------------------------------------------------------------------------------------------------+
| A \$25 000 loan charges 6% p.a., compounded monthly. Repayments are \$600 per month.                                     |
|                                                                                                                          |
| Determine how many repayments are needed to pay off the loan.                                                            |
|                                                                                                                          |
| $$6\%\ p.a.\  \rightarrow 0.5\%\ monthly$$                                                                               |
|                                                                                                                          |
| Start: $18000$                                                                                                           |
|                                                                                                                          |
| 1^st^ repayment: 25$000(1.005) - 600$                                                                                    |
|                                                                                                                          |
| 2^nd^ repayment: $\left\lbrack 25000(1.005) - 600 \right\rbrack(1.005) - 600 = 25000(1.005)^{2} - 600(1.005) - 600$      |
|                                                                                                                          |
| n^th^ repayment: $25000(1.005)^{n} - 600(1.005)^{n - 1} - \ldots - 600$                                                  |
|                                                                                                                          |
| The repayments form a geometric series with $a = 600,\ r = 1.005$                                                        |
|                                                                                                                          |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ FV = 25000(1.005)^{n} - 600\frac{(1.005)^{n} - 1}{1.005 - 1}$$         |
|                                                                                                                          |
| Set $FV = 0$                                                                                                             |
|                                                                                                                          |
| $${0 = 25000(1.005)^{n} - 600\frac{(1.005)^{n} - 1}{0.005}                                                               |
| }{0 = 25000(1.005)^{n} - \frac{600}{0.005}(1.005)^{n} + \frac{600}{0.005}                                                |
| }{- \frac{600}{0.005} = 25000(1.005)^{n} - \frac{600}{0.005}(1.005)^{n}                                                  |
| }{- \frac{600}{0.005} = (1.005)^{n}\left( 25000 - \frac{600}{0.005} \right)                                              |
| }{(1.005)^{n} = \frac{\left( - \frac{600}{0.005} \right)}{\left( 25000 - \frac{600}{0.005} \right)}                      |
| }{n = \log_{1.005}\frac{\left( - \frac{600}{0.005} \right)}{\left( 25000 - \frac{600}{0.005} \right)} = 46.8396\ldots}$$ |
|                                                                                                                          |
| The loan will be repaid after 47 repayments, with the 47^th^ repayment being smaller than \$600.                         |
|                                                                                                                          |
| Bonus question: show that the final payment is \$504.01.                                                                 |
|                                                                                                                          |
| (notice how we don't just do $0.8396\ldots \times \$ 600$)                                                               |
+--------------------------------------------------------------------------------------------------------------------------+
| - **Guided Practice**                                                                                                    |
+--------------------------------------------------------------------------------------------------------------------------+
| Find how many repayments are needed to pay off these loans.                                                              |
+--------------------------------------------------------------------------------------------------------------------------+
| a.  $\$ 20\ 000$ borrowed, 7.2% p.a. compounded monthly, monthly repayments of \$750.                                    |
|                                                                                                                          |
| 30 repayments                                                                                                            |
+--------------------------------------------------------------------------------------------------------------------------+
| b.  $\$ 8000$ borrowed, 12% p.a. compounded monthly, monthly repayments of \$70.                                         |
|                                                                                                                          |
| The loan will never be repaid                                                                                            |
+--------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  A loan of \$6000 is paid back in equal annual instalments over 3
    years. If the interest is 12.5% p.a., find the amount of each annual
    instalment.

Let each annual instalment be $M$.

Start: $6000$

1st repayment: $6000(1.125) - M$

2nd repayment: $6000(1.125)^{2} - M(1.125) - M$

3rd repayment: $6000(1.125)^{3} - M(1.125)^{2} - M(1.125) - M$

The repayments form a geometric series with $a = M$, $r = 1.125$,
$n = 3$.

$$0 = 6000(1.125)^{3} - M\frac{{1.125}^{3} - 1}{1.125 - 1}$$

$$M = \$ 2519.59$$

2.  An amount of \$3000 is borrowed at 22% p.a. and paid off over 5
    years with yearly repayments. How much is each repayment?

Let the yearly repayment be $M$.

Start: $3000$

1st repayment: $3000(1.22) - M$

2nd repayment: $3000(1.22)^{2} - M(1.22) - M$

5th repayment: $3000(1.22)^{5} - M(1.22)^{4} - M(1.22)^{3} - \cdots - M$

The repayments form a geometric series:

$$M + M(1.22) + \cdots + M(1.22)^{4}$$

with $a = M$, $r = 1.22$, $n = 5$.

When the loan is repaid, $A_{5} = 0$.

$$0 = 3000(1.22)^{5} - M\frac{{1.22}^{5} - 1}{1.22 - 1}$$

$$M = \$ 1047.62$$

3.  David borrows \$5000 from the bank and pays back the loan in monthly
    instalments over 4 years. If the loan incurs interest of 15% p.a.
    calculated monthly, find the amount of each instalment.

Monthly growth factor:

$$r = 1 + \frac{0.15}{12} = 1.0125$$

Number of repayments:

$$n = 4 \times 12 = 48$$

Let the monthly repayment be $M$.

Start: $5000$

1st repayment: $5000r - M$

2nd repayment: $5000r^{2} - Mr - M$

48th repayment: $5000r^{48} - Mr^{47} - Mr^{46} - \cdots - M$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 48$.

$$0 = 5000r^{48} - M\frac{r^{48} - 1}{r - 1}$$

$$M = \$ 139.15$$

4.  A person invests \$10 000 each year in a superannuation fund.\
    Compound interest is paid at 10% per annum on the investment. The
    first payment is made on 1st January 2021 and the last payment is
    made on 1st January 2040.

    a.  How much did the person invest over the life of the fund?

    b.  Calculate, correct to the nearest dollar, the amount to which
        the 2021 payment has grown by the beginning of 2041.

    c.  Find the total value of the fund when it is paid out on 1st
        January 2041.

    d.  The person wants to reach a total value of \$1 000 000 in
        superannuation.

        i.  Find a formula for $A_{n}$, the value of the investment
            after $n$ years.

        ii. Show that the target is reached when
            ${1.1}^{n} > \frac{10}{1.1} + 1$.

        iii. At the end of which year will the superannuation be worth
             \$1 000 000?

    e.  Suppose instead that the person wanted to achieve the same total
        investment of\
        \$1 000 000 after only 20 years. What annual contribution would
        produce this amount? (Hint: Let $M$ be the amount of each
        contribution.)

\(a\)

There are $20$ contributions. $20(10000) = \$ 200\, 000$

\(b\)

The first payment grows for $20$ years. $10000(1.1)^{20} = \$ 67\, 275$

\(c\)

On $1$ January $2041$:

$$10000(1.1)^{20} + 10000(1.1)^{19} + \cdots + 10000(1.1)$$

This is a geometric series with $a = 10000(1.1)$, $r = 1.1$, $n = 20$.

$$FV = \frac{10000(1.1)({1.1}^{20} - 1)}{1.1 - 1} = \$ 630\, 025$$

(d)(i)

After $n$ years:

$$A_{n} = 10000(1.1)^{n} + 10000(1.1)^{n - 1} + \cdots + 10000(1.1)$$

This is a geometric series with $a = 10000(1.1)$, $r = 1.1$, $n$ terms.

$$A_{n} = \frac{10000(1.1)({1.1}^{n} - 1)}{0.1}$$

(d)(ii)

Using the geometric-series formula:

$$\frac{10000(1.1)({1.1}^{n} - 1)}{0.1} > 1000000$$

$${1.1}^{n} > \frac{10}{1.1} + 1$$

(d)(iii)

$$n > \frac{\log\left( \frac{10}{1.1} + 1 \right)}{\log 1.1}$$

$$n > 24.25\ldots$$

Therefore the target is reached in the $25$th year.

\(e\)

Let the annual contribution be $M$.

After $20$ years:

$$M(1.1)^{20} + M(1.1)^{19} + \cdots + M(1.1)$$

This is a geometric series with $a = M(1.1)$, $r = 1.1$, $n = 20$.

$$1000000 = \frac{M(1.1)({1.1}^{20} - 1)}{0.1}$$

$$M = \$ 15\, 872.39$$

Development

16. Santi buys a car for \$38 000, paying a 10% deposit and taking out a
    loan for the balance. If the loan is over 5 years with interest of
    1.5% monthly, find:

    a.  the amount of each monthly loan repayment

    b.  the total amount that Santi paid for the car.

Loan amount:

$$38000 - 0.10(38000) = \$ 34\, 200$$

Monthly growth factor: $r = 1.015$

Number of repayments: $n = 60$

Start: $34200$

1st repayment: $34200r - M$

2nd repayment: $34200r^{2} - Mr - M$

60th repayment: $34200r^{60} - Mr^{59} - Mr^{58} - \cdots - M$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 60$.

$$0 = 34200r^{60} - M\frac{r^{60} - 1}{r - 1}$$

$$M = \$ 868.46$$

Using the repayment found from the geometric series in part (a):

$$3800 + 60(868.46) = \$ 55\, 907.60$$

17. Tri and Mai mortgage their house for \$150 000.

    a.  Find the amount of the monthly repayments they will have to make
        if the mortgage is over 25 years with interest at 6% p.a.
        compounded monthly.

    b.  If they want to pay their mortgage out after 15 years, what
        monthly repayments would they need to make?

Monthly growth factor:

$$r = 1 + \frac{0.06}{12} = 1.005$$

Number of repayments:

$$n = 25 \times 12 = 300$$

Let the monthly repayment be $M$.

Start: $150000$

1st repayment: $150000r - M$

2nd repayment: $150000r^{2} - Mr - M$

300th repayment: $150000r^{300} - Mr^{299} - Mr^{298} - \cdots - M$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 300$.

$$0 = 150000r^{300} - M\frac{r^{300} - 1}{r - 1}$$

$$M = \$ 966.45$$

For a $15$-year term:

$$n = 15 \times 12 = 180$$

180th repayment:

$$150000r^{180} - Mr^{179} - Mr^{178} - \cdots - M$$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 180$.

$$0 = 150000r^{180} - M\frac{r^{180} - 1}{r - 1}$$

$$M = \$ 1265.79$$

18. Molly buys a \$35 000 car. She puts down a 5% deposit and pays the
    balance back in monthly instalments over 4 years at 12% p.a.

    a.  Find the amount of the monthly payments.

    b.  Find the total amount that Molly pays for the car.

Loan amount:

$$35000 - 0.05(35000) = \$ 33\, 250$$

Monthly growth factor:

$$r = 1.01$$

Number of repayments:

$$n = 48$$

Start: $33250$

1st repayment: $33250r - M$

2nd repayment: $33250r^{2} - Mr - M$

48th repayment: $33250r^{48} - Mr^{47} - \cdots - M$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 48$.

$$0 = 33250r^{48} - M\frac{r^{48} - 1}{r - 1}$$

$$M = \$ 875.60$$

Using the geometric-series repayment from part (a):

$$1750 + 48(875.60) = \$ 43\, 778.80$$

19. The sum of \$20 000 is borrowed at 18% p.a. interest calculated
    monthly over 8 years. How much are the monthly repayments?

Monthly growth factor:

$$r = 1 + \frac{0.18}{12} = 1.015$$

Number of repayments:

$$n = 8 \times 12 = 96$$

Let the monthly repayment be $M$.

Start: $20000$

1st repayment: $20000r - M$

2nd repayment: $20000r^{2} - Mr - M$

96th repayment: $20000r^{96} - Mr^{95} - Mr^{94} - \cdots - M$

The repayments form a geometric series:

$$M + Mr + \cdots + Mr^{95}$$

with $a = M$, common ratio $r$, and $n = 96$.

$$0 = 20000r^{96} - M\frac{r^{96} - 1}{r - 1}$$

$$M = \$ 394.46$$

20. Danny buys a home cinema system for \$10 000. He pays a \$1500
    deposit and borrows the balance at 18% p.a. over 4 years.

    a.  Find the amount of each monthly repayment.

    b.  How much did Danny pay altogether?

Loan amount: $10000 - 1500 = \$ 8500$

Monthly growth factor:

$$r = 1.015$$

Number of repayments:

$$n = 48$$

Start: $8500$

1st repayment: $8500r - M$

2nd repayment: $8500r^{2} - Mr - M$

48th repayment: $8500r^{48} - Mr^{47} - \cdots - M$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 48$.

$$0 = 8500r^{48} - M\frac{r^{48} - 1}{r - 1}$$

$$M = \$ 249.69$$

Using the geometric-series repayment from part (a):

$$1500 + 48(249.69) = \$ 13\, 485.12$$

21. The current credit card rate of interest on Bankerscard is 23% per
    annum, compounded monthly.

    a.  If a cardholder can afford to repay \$1500 per month on the
        card, what is the maximum value of purchases that can be made in
        one day if the debt is to be paid off in two months?

    b.  How much would be saved in interest payments if the cardholder
        instead saved up the money for two months before making the
        purchase?

\(a\)

Monthly growth factor:

$$r = 1 + \frac{0.23}{12}$$

Let the maximum purchase be $P$.

Start: $P$

1st repayment: $\Pr - 1500$

2nd repayment: $Pr^{2} - 1500r - 1500$

The two repayments form a geometric series:

$$1500 + 1500r$$

with $a = 1500$, common ratio $r$, and $n = 2$.

When the debt is repaid:

$$0 = Pr^{2} - 1500\frac{r^{2} - 1}{r - 1}$$

$$P = \$ 2915.90$$

\(b\)

Using the geometric-series result from part (a):

Total repaid:

$$2(1500) = \$ 3000$$

Interest:

$$3000 - 2915.90 = \$ 84.10$$

Therefore saving first would save $\$ 84.10$ in interest.

Mastery

22. Breanna thinks she can afford a mortgage payment of \$800 each
    month. How much can she borrow, to the nearest \$100, over 25 years
    at 11.5% p.a.?

Monthly growth factor:

$$r = 1 + \frac{0.115}{12}$$

Number of repayments:

$$n = 25 \times 12 = 300$$

Let the amount borrowed be $P$.

Start: $P$

1st repayment: $\Pr - 800$

2nd repayment: $Pr^{2} - 800r - 800$

300th repayment: $Pr^{300} - 800r^{299} - 800r^{298} - \cdots - 800$

The repayments form a geometric series with $a = 800$, common ratio $r$,
and $n = 300$.

$$0 = Pr^{300} - 800\frac{r^{300} - 1}{r - 1}$$

$$P = 800\frac{r^{300} - 1}{r^{300}(r - 1)}$$

$$P \approx \$ 78\, 703.83$$

To the nearest $\$ 100$, $P = \$ 78\, 700$.

23. Amy borrowed money over 7 years at 15.5% p.a. and she pays \$1200 a
    month.\
    How much did she borrow?

Monthly growth factor:

$$r = 1 + \frac{0.155}{12}$$

Number of repayments:

$$n = 84$$

Let the amount borrowed be $P$.

Start: $P$

1st repayment: $\Pr - 1200$

2nd repayment: $Pr^{2} - 1200r - 1200$

84th repayment: $Pr^{84} - 1200r^{83} - \cdots - 1200$

The repayments form a geometric series with $a = 1200$, common ratio
$r$, and $n = 84$.

$$0 = Pr^{84} - 1200\frac{r^{84} - 1}{r - 1}$$

$$P = 1200\frac{r^{84} - 1}{r^{84}(r - 1)} = \$ 61\, 292.20$$

24. Get Rich Bank offers a mortgage at $7\frac{1}{2}\%$ p.a. over 10
    years and Capital Bank offers a mortgage at $5\frac{1}{2}\%$ p.a.
    over 25 years, both with interest calculated monthly.

    a.  Find the amount of the monthly repayments for each bank on a
        loan of \$80 000.

    b.  Find the difference in the total amount paid on each mortgage.

Get Rich Bank:

$$r = 1 + \frac{0.075}{12} = 1.00625$$

$$n = 10 \times 12 = 120$$

Start: $80000$

1st repayment: $80000r - M$

2nd repayment: $80000r^{2} - Mr - M$

120th repayment: $80000r^{120} - Mr^{119} - \cdots - M$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 120$.

$$0 = 80000r^{120} - M\frac{r^{120} - 1}{r - 1}$$

$$M = \$ 949.61$$

Capital Bank:

$$r = 1 + \frac{0.055}{12}$$

$$n = 25 \times 12 = 300$$

300th repayment:

$$80000r^{300} - Mr^{299} - \cdots - M$$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 300$.

$$0 = 80000r^{300} - M\frac{r^{300} - 1}{r - 1}$$

$$M = \$ 491.27$$

Using the geometric-series repayments from part (a):

Get Rich total:

$$120(949.61) = \$ 113\, 953.20$$

Capital Bank total:

$$300(491.27) = \$ 147\, 381.00$$

Difference:

$$147381.00 - 113953.20 = \$ 33\, 427.80$$

Therefore Capital Bank costs $\$ 33\, 427.80$ more.

25. A \$2000 loan is offered at 18% p.a. with interest charged monthly,
    over 3 years.

    a.  If no repayment need be paid for the first 2 months, find the
        amount of each repayment.

    b.  How much will be paid back altogether?

Monthly growth factor:

$$r = 1.015$$

No repayments are made for the first $2$ months.

After $2$ months:

$$2000r^{2}$$

There are then $34$ repayments.

1st repayment after the delay: $2000r^{3} - M$

2nd repayment after the delay: $2000r^{4} - Mr - M$

At the end of $36$ months:

$$A_{36} = 2000r^{36} - Mr^{33} - Mr^{32} - \cdots - M$$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 34$.

$$0 = 2000r^{36} - M\frac{r^{34} - 1}{r - 1}$$

$$M = \$ 77.81$$

Using the repayment found from the geometric series in part (a):

$$34(77.81) = \$ 2645.54$$

\$2645.42 if using unrounded repayment

26. NSW Bank offers loans at 9% p.a. with no repayments for the first 3
    months, while Sydney Bank offers loans at 7% p.a. Compare these
    loans for a \$5000 loan over 3 years and state which bank offers the
    better loan and why.

NSW Bank:

$$r = 1 + \frac{0.09}{12} = 1.0075$$

No repayments are made for the first $3$ months.

At the end of $36$ months:

$$A_{36} = 5000r^{36} - Mr^{32} - Mr^{31} - \cdots - M$$

There are $33$ repayments, so the repayment terms form a geometric
series with $a = M$, common ratio $r$, and $n = 33$.

$$0 = 5000r^{36} - M\frac{r^{33} - 1}{r - 1}$$

$$M \approx \$ 175.49$$

Using the unrounded repayment:

Total $= \$ 5791.25$

Sydney Bank:

$$r = 1 + \frac{0.07}{12}$$

There are $36$ repayments.

$$A_{36} = 5000r^{36} - Mr^{35} - Mr^{34} - \cdots - M$$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 36$.

$$0 = 5000r^{36} - M\frac{r^{36} - 1}{r - 1}$$

$$M \approx \$ 154.39$$

Using the unrounded repayment:

Total $= \$ 5557.88$

Therefore Sydney Bank is better because the total repaid is lower.

27. A store offers furniture on hire purchase at 20% p.a. over 5 years,
    with no repayments for 6 months. Ali buys furniture worth \$12 000.

    a.  How much does Ali owe after 6 months?

    b.  What are the monthly repayments?

    c.  How much does Ali pay for the furniture altogether?

Monthly growth factor:

$$r = 1 + \frac{0.20}{12}$$

No repayments are made for $6$ months.

Start: $12000$

After 1 month: $12000r$

After 2 months: $12000r^{2}$

After 6 months: $12000r^{6}$

$$12000r^{6} = \$ 13\, 251.13$$

After the $6$-month delay there are $54$ repayments.

1st repayment: $12000r^{7} - M$

2nd repayment: $12000r^{8} - Mr - M$

At the end of $60$ months:

$$A_{60} = 12000r^{60} - Mr^{53} - Mr^{52} - \cdots - M$$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 54$.

$$0 = 12000r^{60} - M\frac{r^{54} - 1}{r - 1}$$

$$M = \$ 374.07$$

Using the geometric-series repayment from part (b):

$$54(374.07) = \$ 20\, 199.78$$

28. A loan of \$6000 over 5 years at 15% p.a. interest, charged monthly,
    is paid back in 5 annual instalments.

    a.  What is the amount of each instalment?

    b.  How much is paid back altogether?

Interest is compounded monthly but repayments are annual.

One-year growth factor:

$$r = \left( 1 + \frac{0.15}{12} \right)^{12}$$

Let each annual instalment be $M$.

Start: $6000$

1st annual repayment: $6000r - M$

2nd annual repayment: $6000r^{2} - Mr - M$

5th annual repayment: $6000r^{5} - Mr^{4} - Mr^{3} - \cdots - M$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 5$.

$$0 = 6000r^{5} - M\frac{r^{5} - 1}{r - 1}$$

$$M = \$ 1835.68$$

Using the geometric-series repayment from part (a):

$$5(1835.68) = \$ 9178.40$$

\$9178.41 if using unrounded repayment.

29. A couple have worked out that they can afford to pay \$19 200 each
    year in mortgage payments. The current home loan rate is 7.5% per
    annum, with equal payments made monthly over a period of 25 years.

    a.  Let $P$ be the principal borrowed and $A_{300}$ the amount owing
        after 25 years. Show that

$$A_{300} = P \times {1.00625}^{300} - \frac{1600({1.00625}^{300} - 1)}{0.00625}$$

b.  Hence determine the maximum amount that the couple can borrow and
    still pay off the loan. Round your answer down to the nearest
    dollar.

\(a\)

Monthly repayment:

$$\frac{19200}{12} = \$ 1600$$

Monthly growth factor:

$$r = 1 + \frac{0.075}{12} = 1.00625$$

Number of repayments:

$$n = 300$$

Start: $P$

1st repayment: $\Pr - 1600$

2nd repayment: $Pr^{2} - 1600r - 1600$

After $300$ repayments:

$$A_{300} = Pr^{300} - 1600r^{299} - 1600r^{298} - \cdots - 1600$$

The repayments form a geometric series with $a = 1600$, common ratio
$r$, and $n = 300$.

$$A_{300} = P(1.00625)^{300} - \frac{1600({1.00625}^{300} - 1)}{0.00625}$$

\(b\)

When the loan is repaid, $A_{300} = 0$.

$$0 = P(1.00625)^{300} - \frac{1600({1.00625}^{300} - 1)}{0.00625}$$

$$P = \$ 216\, 511$$

30. A couple take out a \$165 000 mortgage on a house, and they agree to
    pay the bank \$1700 per month. The interest rate on the loan is 9%
    per annum, compounded monthly, and the contract requires that the
    loan be paid off within 15 years.

    a.  Let $A_{180}$ be the balance on the loan after 15 years. Find a
        series expression for $A_{180}$.

    b.  Show that

$$A_{180} = 165000 \times {1.0075}^{180} - \frac{1700({1.0075}^{180} - 1)}{0.0075}$$

c.  Evaluate $A_{180}$, and hence show that the loan is actually paid
    out in less than 15 years.

\(a\)

Monthly growth factor:

$$r = 1 + \frac{0.09}{12} = 1.0075$$

Start: $165000$

1st repayment: $165000r - 1700$

2nd repayment: $165000r^{2} - 1700r - 1700$

After $180$ repayments:

$$A_{180} = 165000r^{180} - 1700r^{179} - 1700r^{178} - \cdots - 1700$$

The repayments form a geometric series:

$$1700 + 1700r + \cdots + 1700r^{179}$$

with $a = 1700$, common ratio $r$, and $n = 180$.

\(b\)

Using the geometric-series sum:

$$A_{180} = 165000r^{180} - 1700\frac{r^{180} - 1}{r - 1}$$

$$A_{180} = 165000(1.0075)^{180} - \frac{1700({1.0075}^{180} - 1)}{0.0075}$$

\(c\)

$$A_{180} = - \$ 10\, 012.67$$

Therefore the loan is paid out in less than $15$ years.

31. \[Problems with rounding\]

> Most questions so far have asked you to round monetary amounts correct
> to the nearest dollar. This is not always wise, as this question
> demonstrates. A personal loan for \$30 000 is approved with the
> following conditions. The reducible interest rate is 13.3% per annum,
> with payments to be made at six-monthly intervals over five years.

a.  Find the size of each instalment, correct to the nearest dollar.

b.  Using this amount, show that $A_{10} \neq 0$, that is, the loan is
    not paid off in five years.

c.  Explain why this has happened.

\(a\)

Payments are made every $6$ months.

Six-month growth factor:

$$r = 1 + \frac{0.133}{2} = 1.0665$$

There are $10$ repayments.

Start: $30000$

1st repayment: $30000r - M$

2nd repayment: $30000r^{2} - Mr - M$

10th repayment: $30000r^{10} - Mr^{9} - Mr^{8} - \cdots - M$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 10$.

$$0 = 30000r^{10} - M\frac{r^{10} - 1}{r - 1}$$

$$M = \$ 4202$$

\(b\)

Using the rounded repayment $\$ 4202$ in the geometric-series
expression:

$$A_{10} = 30000(1.0665)^{10} - 4202\frac{{1.0665}^{10} - 1}{0.0665}$$

$$A_{10} = \$ 6.56$$

Therefore the loan is not exactly paid off.

\(c\)

The exact geometric-series calculation gives a repayment of about
$\$ 4202.48$.

Each rounded payment is about $48$ cents short.

Therefore a small balance remains.

32. A company buys machinery for \$500 000 and pays it off by 20 equal
    six-monthly instalments, the first payment being made six months
    after the loan is taken out. If the interest rate is 12% p.a.,
    compounded monthly, how much will each instalment be?

Interest is compounded monthly, but payments are every $6$ months.

Six-month growth factor:

$$r = {1.01}^{6}$$

There are $20$ six-monthly repayments.

Start: $500000$

1st repayment: $500000r - M$

2nd repayment: $500000r^{2} - Mr - M$

20th repayment: $500000r^{20} - Mr^{19} - Mr^{18} - \cdots - M$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 20$.

When the loan is repaid:

$$0 = 500000r^{20} - M\frac{r^{20} - 1}{r - 1}$$

$$M = \frac{500000r^{20}(r - 1)}{r^{20} - 1}$$

$$M = \$ 44\, 131.77$$

33. As can be seen from these questions, the calculations involved with
    reducible loans are reasonably complex. For that reason, it is
    sometimes convenient to convert the reducible interest rate into a
    simple interest rate. Suppose that a mortgage is taken out on a
    \$180 000 house at 6.6% reducible interest per annum for a period of
    25 years, with payments of amount $M$ made monthly.

    a.  Using the usual pronumerals, explain why $A_{300} = 0$.

    b.  Show that

$$A_{300} = 180000 \times {1.0055}^{300} - \frac{M({1.0055}^{300} - 1)}{0.0055}$$

c.  Find the size of each repayment to the bank.

d.  Hence find the total paid to the bank, correct to the nearest
    dollar, over the life of the loan.

e.  What amount is therefore paid in interest? Use this amount and the
    simple interest formula to calculate the simple interest rate per
    annum over the life of the loan, correct to two significant figures.

\(a\)

The loan is fully repaid after $25$ years.

$$A_{300} = 0$$

\(b\)

Monthly growth factor:

$$r = 1 + \frac{0.066}{12} = 1.0055$$

Start: $180000$

1st repayment: $180000r - M$

2nd repayment: $180000r^{2} - Mr - M$

After $300$ repayments:

$$A_{300} = 180000r^{300} - Mr^{299} - Mr^{298} - \cdots - M$$

The repayments form a geometric series with $a = M$, common ratio $r$,
and $n = 300$.

$$A_{300} = 180000r^{300} - M\frac{r^{300} - 1}{r - 1}$$

$$A_{300} = 180000(1.0055)^{300} - M\frac{{1.0055}^{300} - 1}{0.0055}$$

\(c\)

Set $A_{300} = 0$:

$$0 = 180000(1.0055)^{300} - M\frac{{1.0055}^{300} - 1}{0.0055}$$

$$M = \$ 1226.64$$

\(d\)

Using the unrounded repayment from the geometric-series calculation:

Total paid $= \$ 367\, 993$

\(e\)

Interest paid:

$$367993 - 180000 = \$ 187\, 993$$

Using $I = Prt$:

$$187993 = 180000(r)(25)$$

$$r = 0.0418\ldots$$

$r \approx 4.2\%$ p.a.

34. A company borrows \$500 000 from the bank at an interest rate of
    5.25% per annum, compounded monthly, to be repaid in monthly
    instalments. The company repays the loan at the rate of \$10 000 per
    month.

    a.  Let $A_{n}$ be the amount owing at the end of the $n$th month.
        Show that

$$A_{n} = 500000 \times {1.004375}^{n} - \frac{10000({1.004375}^{n} - 1)}{0.004375}$$

b.  Given that the loan is paid off, use the result in part a to show
    that ${1.004375}^{n} = 1.28$.

c.  Use logarithms or trial-and-error to find how long it will take to
    pay off the loan. Give your answer in whole months.

\(a\)

Monthly growth factor:

$$r = 1 + \frac{0.0525}{12} = 1.004375$$

Start: $500000$

1st repayment: $500000r - 10000$

2nd repayment: $500000r^{2} - 10000r - 10000$

After $n$ repayments:

$$A_{n} = 500000r^{n} - 10000r^{n - 1} - 10000r^{n - 2} - \cdots - 10000$$

The repayments form a geometric series with $a = 10000$, common ratio
$r$, and $n$ terms.

$$A_{n} = 500000r^{n} - 10000\frac{r^{n} - 1}{r - 1}$$

$$A_{n} = 500000(1.004375)^{n} - \frac{10000({1.004375}^{n} - 1)}{0.004375}$$

\(b\)

When the loan is repaid, $A_{n} = 0$.

$$0 = 500000(1.004375)^{n} - \frac{10000({1.004375}^{n} - 1)}{0.004375}$$

$${1.004375}^{n} = 1.28$$

\(c\)

$$n = \frac{\log 1.28}{\log 1.004375}$$

$$n = 56.5485\ldots$$

Therefore it takes $57$ months.

The final payment is $\$ 5490.41$.

35. A couple take out a \$250 000 mortgage on a house, and they agree to
    pay the bank \$2000 per month. The interest rate on the loan is 7.2%
    per annum, compounded monthly, and the contract requires that the
    loan be paid off within 20 years.

    a.  Let $A_{n}$ be the balance on the loan after $n$ months. Find a
        series expression for $A_{n}$.

    b.  Hence show that

$$A_{n} = 250000 \times {1.006}^{n} - \frac{2000({1.006}^{n} - 1)}{0.006}$$

c.  Find the amount owing on the loan at the end of the tenth year, and
    state whether this is more or less than half the amount borrowed.

d.  Find $A_{240}$, and hence show that the loan is actually paid out in
    less than twenty years.

e.  If it is paid out after $n$ months, show that ${1.006}^{n} = 4$, and
    hence that $n = \frac{\log 4}{\log 1.006}$.

f.  Find how many months early the loan is paid off.

\(a\)

Monthly growth factor:

$$r = 1 + \frac{0.072}{12} = 1.006$$

Start: $250000$

1st repayment: $250000r - 2000$

2nd repayment: $250000r^{2} - 2000r - 2000$

After $n$ repayments:

$$A_{n} = 250000r^{n} - 2000r^{n - 1} - 2000r^{n - 2} - \cdots - 2000$$

The repayments form a geometric series with $a = 2000$, common ratio
$r$, and $n$ terms.

\(b\)

Using the geometric-series sum:

$$A_{n} = 250000r^{n} - 2000\frac{r^{n} - 1}{r - 1}$$

$$A_{n} = 250000(1.006)^{n} - \frac{2000({1.006}^{n} - 1)}{0.006}$$

\(c\)

At the end of $10$ years, $n = 120$.

$$A_{120} = 250000(1.006)^{120} - \frac{2000({1.006}^{120} - 1)}{0.006}$$

$$A_{120} = \$ 162\, 498$$

This is more than half of $\$ 250\, 000$.

\(d\)

At the end of $20$ years, $n = 240$.

$$A_{240} = 250000(1.006)^{240} - \frac{2000({1.006}^{240} - 1)}{0.006}$$

$$A_{240} = - \$ 16\, 881$$

Therefore the loan is paid out in less than $20$ years.

\(e\)

When the loan is repaid, $A_{n} = 0$. Using the geometric-series
expression:

$$0 = 250000(1.006)^{n} - \frac{2000({1.006}^{n} - 1)}{0.006}$$

$${1.006}^{n} = 4$$

$$n = \frac{\log 4}{\log 1.006}$$

\(f\)

$$n = 231.74\ldots$$

So the loan is paid off after about $232$ months.

$$240 - 232 = 8$$

Therefore it is paid off $8$ months early.
