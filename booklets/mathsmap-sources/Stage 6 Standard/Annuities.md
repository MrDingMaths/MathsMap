  ----------------------

  ----------------------

Student Name

  -------------------------------------------------------------------
  Mathematics Standard Year 12
  -------------------------------------------------------------------
  **Annuities**

  -------------------------------------------------------------------

+--------+-----------------------------------+-------------------------+
| **Book | Annuities                         | Version: 250911         |
| 1**    |                                   |                         |
|        |                                   | Report mistakes &       |
|        |                                   | suggest improvements:\  |
|        |                                   | https://MrDingMaths.com |
+========+===================================+=========================+

+------------------------------------------------------------------------------+
| # Contents {#contents .TOC-Heading}                                          |
|                                                                              |
| [Overview [2](#overview)](#overview)                                         |
|                                                                              |
| [Introduction to Annuities                                                   |
| [3](#introduction-to-annuities)](#introduction-to-annuities)                 |
|                                                                              |
| [Annuities as Recurrence Relations                                           |
| [4](#annuities-as-recurrence-relations)](#annuities-as-recurrence-relations) |
|                                                                              |
| [Annuities using Spreadsheets                                                |
| [9](#annuities-using-spreadsheets)](#annuities-using-spreadsheets)           |
|                                                                              |
| [Annuity Future Value Tables                                                 |
| [11](#annuity-future-value-tables)](#annuity-future-value-tables)            |
|                                                                              |
| [Annuity Present Value Tables                                                |
| [18](#annuity-present-value-tables)](#annuity-present-value-tables)          |
|                                                                              |
| [Applications of Present Value                                               |
| [22](#applications-of-present-value)](#applications-of-present-value)        |
+==============================================================================+

# Overview

## Syllabus Content

**MST-12-S2-03** solves financial problems involving annuities

- Identify an annuity as an investment account with regular, equal
  contributions and interest compounding at the end of each period, or
  as a single sum investment from which regular equal withdrawals are
  made

- Model an annuity in tabular form for up to four time periods

- Use a spreadsheet to model an annuity

- Using a table of interest factors, calculate the future value or
  present value of an annuity

- Using a table of interest factors, determine the contribution amount
  required to achieve a given future value or the single sum
  contribution required to produce an equivalent future value for any
  given annuity

- Examine the effect of varying the amount initially invested, the value
  of the periodic payment, the interest rate and the duration of the
  annuity on the total value of the investment, using digital tools

- Solve annuity problems involving financial decisions regarding
  superannuation, savings accounts and loans

# Introduction to Annuities

- An **annuity** involves **regular payments** into or out of an
  investment or loan.

  - Superannuation: You contribute part of your pay regularly into an
    investment account, or withdraw regular amounts after retirement.

  - Reducing balance loans: You make regular repayments on a loan, such
    as mortgages.

Foundation

1.  The table shows the progress of a **savings account** with an annual
    contribution of \$5000 made at the end of each year. The interest
    rate is 8% p.a. compounded annually.

Complete the table to find the value of the savings account at the end
of four years.

  --------------------------------------------------------------------------
   **Year**   **Balance at   **Interest**   **Payment**   **Balance at End**
                start**                                   
  ---------- -------------- -------------- -------------- ------------------
      1            0              0             5000             5000

      2           5000           400            5000            10400

      3          10400                                    

      4                                                   
  --------------------------------------------------------------------------

2.  The table shows the progress of a **savings account** over 4 months
    with a contribution of \$600 per month made at the end of each
    month. The interest rate is 36% p.a. compounded monthly.

Complete the table to find the value of the savings account at the end
of four months.

  -------------------------------------------------------------------------
   **Month**  **Balance at   **Interest**   **Payment**  **Balance at End**
                 start**                                 
  ----------- ------------- -------------- ------------- ------------------
       1            0             0             600             600

       2           600            18            600             1218

       3                                                 

       4                                                 
  -------------------------------------------------------------------------

3.  \$10 000 is borrowed in a **reducing balance loan**. Monthly
    repayments of \$300 is made.\
    The interest rate is 24% p.a. compounded monthly.

Complete the table to find the value of the loan at the end of four
months.

  -------------------------------------------------------------------------
   **Month**  **Balance at   **Interest**   **Payment**  **Balance at End**
                 start**                                 
  ----------- ------------- -------------- ------------- ------------------
       1         10 000          200            300             9900

       2                                                 

       3                                                 

       4                                                 
  -------------------------------------------------------------------------

# Annuities as Recurrence Relations

- We can model an annuity using a **recurrence relation**, where we
  calculate each new value from the previous value.

### **Investigation** Recurrence relations.

+---------------------------------------------------------------------------+
| A person saving for retirement decides to invest \$1000 at the end of     |
| each year into a superannuation account that pays interest of 10% p.a     |
| compounded annually. How much do they have in the account after 5 years?  |
|                                                                           |
| Let $V_{n}$ be the value of the account after $n$ payments.               |
|                                                                           |
| +-----------------------------------+-----------------------------------+ |
| | $V_{0} = \$ 0$                    | $V_{3} = V_{2} \times 1.1 + 1000$ | |
| |                                   |                                   | |
| | $V_{1} = V_{0} \times 1.1 + 1000$ | $=$ ............... $+ \ 1000$    | |
| |                                   |                                   | |
| | $= 0 + 1000$                      | $=$ ...............               | |
| |                                   |                                   | |
| | $= 1000$                          | $V_{4} =$ $V_{3}$                 | |
| |                                   | $\times 1.1 + 1000$               | |
| | $V_{2} = V_{1} \times 1.1 + 1000$ |                                   | |
| |                                   | $=$ ............... $+ \ 1000$    | |
| | $= 1100 + 1000$                   |                                   | |
| |                                   | $=$ ...............               | |
| | $= 2100$                          |                                   | |
| |                                   | $V_{5} =$ $V_{4}$                 | |
| |                                   | $\times 1.1 + 1000$               | |
| |                                   |                                   | |
| |                                   | $=$ ............... $+ \ 1000$    | |
| |                                   |                                   | |
| |                                   | $=$ ...............               | |
| +===================================+===================================+ |
+===========================================================================+

## Annuity as a Recurrence Relation

  -----------------------------------------------------------------------------------------------------------------------------
  ![](media/Annuities/media/image3.png){width="3.3375in"   ![](media/Annuities/media/image4.png){width="3.3993055555555554in"
  height="1.6069444444444445in"}**For Compound Interest    height="1.6089687226596676in"}**For Reducing Balance Loans**
  Investments**                                            
  -------------------------------------------------------- --------------------------------------------------------------------

  -----------------------------------------------------------------------------------------------------------------------------

- ![](media/Annuities/media/image5.png){width="0.35819225721784775in"
  height="0.26724081364829394in"}Always define the starting value
  $V_{0}$. This would the initial value of the loan or investment before
  making regular payments.

- The button on the calculator is used to quickly insert the previous
  value.

### **Example** Solve annuity problems using recurrence relations.

+-------------------------------------------------------------------------------------------------------------------------------------------------+
| Alyssa borrows \$1000 at an interest rate of 15% per annum, compounding monthly. She will repay the loan by making 4 monthly payments of        |
| \$257.85.                                                                                                                                       |
|                                                                                                                                                 |
| Write the recurrence relation.                                                                                                                  |
|                                                                                                                                                 |
| $$V_{n} = V_{n - 1}(1 + r) - D$$                                                                                                                |
|                                                                                                                                                 |
| $$V_{n} = V_{n - 1}\left( 1 + \frac{0.15}{12} \right) - 257.85$$                                                                                |
|                                                                                                                                                 |
| Determine the balance of the loan after 4 repayments.                                                                                           |
|                                                                                                                                                 |
| +------------------------------------------------------------------------+--------------------------------------------------------------------+ |
| | $V_{0} = 1000$                                                         | Fast method using a calculator:                                    | |
| |                                                                        |                                                                    | |
| | $$V_{1} = 1000\left( 1 + \frac{0.15}{12} \right) - 257.85 = 754.65$$   | ![](media/Annuities/media/image6.png){width="0.2722222222222222in" | |
| |                                                                        | height="0.22777777777777777in"}1. Type 1000 then press\            | |
| | $$V_{2} = 754.65\left( 1 + \frac{0.15}{12} \right) - 257.85 = 506.23$$ | 2. Type $\boxed{ANS}\left( 1 + \frac{0.15}{12} \right) - 257.85$\  | |
| |                                                                        | 3. Press the equals button 4 times.                                | |
| | $$V_{3} = 506.23\left( 1 + \frac{0.15}{12} \right) - 257.85 = 254.71$$ |                                                                    | |
| |                                                                        | \*If you make a mistake, you need to restart from step 1 as the    | |
| | $$V_{4} = 254.71\left( 1 + \frac{0.15}{12} \right) - 257.85 = 0.04$$   | value of $\boxed{ANS}$ changes.                                    | |
| +========================================================================+====================================================================+ |
+=================================================================================================================================================+

> Ling invests \$1500 per year for 5 years in an annuity. He makes each
> payment at the end of the year and the interest rate is 8% p.a.
>
> Write the recurrence relation:
> ....................................................................................
>
> Determine the balance of the investment after 5 years.

+---------------------+---------------------+---------------------+
| $V_{0} =$           | $V_{2} =$           | $V_{4} =$           |
| ..................  | ..................  | ..................  |
|                     |                     |                     |
| $V_{1} =$           | $V_{3} =$           | $V_{5} =$           |
| ..................  | ..................  | ..................  |
+=====================+=====================+=====================+

Foundation

1.  An investment is modelled by the recurrence relation

$$V_{n} = V_{n - 1} \times 1.06 + 800$$

Where $V_{0} = 0$

Use your calculator to determine the balance of the investment to the
nearest cent after:

+----------------+----------------+----------------+----------------+
| a.  1 payment  | b.  2 payments | c.  3 payments | d.  4 payments |
+================+================+================+================+

2.  A loan is modelled by the recurrence relation

$$V_{n} = V_{n - 1} \times 1.09 - 600$$

Where $V_{0} = 2500$

Use your calculator to determine the balance of the loan to the nearest
cent after:

+----------------+----------------+----------------+----------------+
| a.  1 payment  | b.  2 payments | c.  3 payments | d.  4 payments |
+================+================+================+================+

4.  A loan is modelled by the recurrence relation

$$V_{n} = V_{n - 1} \times 1.1 - 4200$$

Where $V_{0} = 500\ 000$

a.  Use your calculator to determine the balance of the loan to the
    nearest cent after 6 payments.

b.  Explain why the value of the loan is increasing despite repayments.

Development

5.  Gabriel borrows \$250 000 at a rate of 4.8% p.a. compounding monthly
    and makes a repayment of \$2000 per month.

    a.  Complete the table for the first four months.

  -------------------------------------------------------------------------
   **Month**  **Balance at   **Interest**   **Payment**  **Balance at End**
                 start**                                 
  ----------- ------------- -------------- ------------- ------------------
       1                                                 

       2                                                 

       3                                                 

       4                                                 
  -------------------------------------------------------------------------

b.  Write the recurrence relation for this loan.

c.  Check the your answer to part **a** by finding the value of the
    account at the end of 4 months using the recurrence relation.

<!-- -->

6.  **2013 HSC Standard 2 Band 5**

> Zina opened an account to save for a new car. Six months after opening
> the account, she made first deposit of \$1200 and continued depositing
> \$1200 at the end of each six month period. Interest was paid at 3%
> per annum, compounded half-yearly.

How much was in Zina\'s account two years after first opening it?

Mastery

7.  **2021 HSC Standard 2 Band 5**

> Julie invests \$12 500 in a savings account. Interest is paid at a
> fixed monthly rate. At the end of each month, after the monthly
> interest is added, Julie makes a deposit of \$500.
>
> Julie has created a spreadsheet to show the activity in her savings
> account. The details for the first 6 months are shown.

![](media/Annuities/media/image7.png){width="5.991666666666666in"
height="2.8930555555555557in"}

By finding the monthly rate of interest, complete the final row above
for the 7th month.

8.  **2020 HSC Standard 2 Band 5**

> Tina inherits \$60 000 and invests it in an account earning interest
> at a rate of 0.5% per month. Each month, immediately after the
> interest has been paid, Tina withdraws \$800.

The amount in the account immediately after the $n$^th^ withdrawal can
be determined using the recurrence relation

$$A_{n} = A_{n - 1}(1.005) - 800$$

a.  Use the recurrence relation to find the amount of money in the
    account immediately after the third withdrawal.

b.  Calculate the amount of interest earned in the first three months.

# Annuities using Spreadsheets

\$5000 is invested at the end of each year for 10 years into an account
that pays interest of 8.5% p.a.

We will use spreadsheets to model recurrence relations in the context of
annuities.

## Setting up the Recurrence Relation

1.  Construct the table below on the spreadsheet.

2.  In cell B3, type $= B2*1.085 + 5000$ and press ENTER. This is the
    recurrence relation.

![](media/Annuities/media/image8.png){width="1.6395833333333334in"
height="2.9722222222222223in"}![](media/Annuities/media/image9.png){width="1.6895833333333334in"
height="2.9722222222222223in"}![](media/Annuities/media/image10.png){width="2.0976213910761157in"
height="2.9769630358705164in"}

## Automatic Calculation

3.  Select the cell with 5000 (do [NOT]{.underline} go into edit mode).

4.  ![](media/Annuities/media/image11.png){width="0.9861111111111112in"
    height="0.3770833333333333in"}Hover the mouse over the little square
    on the bottom right of the cell. Your mouse cursor should become a
    $+$

5.  Click on the little square and drag downwards to the end of the
    table.

6.  Let go and the spreadsheet should calculate $V_{n}$

![](media/Annuities/media/image12.png){width="1.679861111111111in"
height="2.9916666666666667in"}![](media/Annuities/media/image13.png){width="1.6895833333333334in"
height="2.9916666666666667in"}

At the end of 10 years,\
the account has \$74175.50

Foundation

**Answer each of these questions using a spreadsheet.**

1.  \$7000 is invested at the end of each year for 20 years into an
    account that pays interest of 6.7% p.a. What will be the balance in
    the account at the end of 20 years?

2.  Each year, since his daughter's first birthday, Lucas has put \$1500
    into a savings account that can be accessed when his daughter
    turns 21. The savings account pays interest of 5% p.a.

    a.  How much will be in the savings account on his daughter's 21st
        birthday? Assume that Lucas contributes a final \$1500 to the
        account on this day.

    b.  Use the spreadsheet to create a line graph of\
        how the balance is changing over time.\
        Describe the shape of your graph and sketch it.

3.  Andreas puts \$1400 into an annuity at the end of each quarter for 5
    years. The annuity pays 6.8% p.a. compounding quarterly.

    a.  Andreas does not have enough in his annuity after 5 years to
        purchase his dream car, which retails for \$42 000. By how much
        is he short?

    b.  If Andreas continues to put \$1400 into his annuity at the end
        of each quarter, after how many additional quarters will he be
        able to purchase his dream car?

4.  Sari buys a house with a \$750 000 mortgage. The mortgage has a
    fixed rate of 5.4% p.a. compounded monthly, and she makes a mortgage
    payment of \$4200 each month.

    a.  What is the balance of the mortgage after 10 years?

    b.  What is the balance of the mortgage after 20 years?

    c.  What is the balance of the mortgage after 30 years?

    d.  Use the spreadsheet to create a line graph to see\
        how the balance is changing over time.\
        Comment on how the gradient is changing.\
        Sketch the shape of your graph.

# Annuity Future Value Tables

- Future value tables show the future value of an annuity when \$1 is
  invested at the end of the period at the given interest rate for the
  given number of periods.

- The time units you use depends on the **compounding period**.

+------------------------------------+
| **Using a Future Value Table**     |
+====================================+
| $$\begin{matrix}                   |
| FV \\                              |
| of\ Annuity                        |
| \end{matrix} = \begin{matrix}      |
| FV \\                              |
| \ of\ \$ 1                         |
| \end{matrix} \times \begin{matrix} |
| Regular\ payment\  \\              |
| amount                             |
| \end{matrix}$$                     |
|                                    |
| $$I = FV - \begin{matrix}          |
| Total \\                           |
| payments                           |
| \end{matrix}$$                     |
+------------------------------------+

### **Example** Calculate future value of an annuity using a table.

+------------------------------------------------------------------------------------------------+
| **FV of \$1 Table**                                                                            |
|                                                                                                |
|   ------------------------------------------------------------------                           |
|    **Period**   **1%**   **2%**   **3%**   **4%**   **5%**   **6%**                            |
|   ------------ -------- -------- -------- -------- -------- --------                           |
|      **1**      1.0000   1.0000   1.0000   1.0000   1.0000   1.0000                            |
|                                                                                                |
|      **2**      2.0100   2.0200   2.0300   2.0400   2.0500   2.0600                            |
|                                                                                                |
|      **3**      3.0301   3.0604   3.0909   3.1216   3.1525   3.1836                            |
|                                                                                                |
|      **4**      4.0604   4.1216   4.1836   4.2465   4.3101   4.3746                            |
|                                                                                                |
|      **5**      5.1010   5.2040   5.3091   5.4163   5.5256   5.6371                            |
|                                                                                                |
|      **6**      6.1520   6.3081   6.4684   6.6330   6.8019   6.9753                            |
|   ------------------------------------------------------------------                           |
+:=========================================================:+:==================================:+
| **Worked Example**                                        | **Your Turn**                      |
+-----------------------------------------------------------+------------------------------------+
| Determine the future value of \$800 per year for 5 years  | Find the future value of \$34 000  |
| at 6% p.a. compounded annually.                           | per year for 3 years at 5% p.a.    |
|                                                           | compounded annually                |
| $$\begin{matrix}                                          |                                    |
| FV \\                                                     | \$107 185                          |
| of\ Annuity                                               |                                    |
| \end{matrix} = \begin{matrix}                             | Calculate the interest earned.     |
| FV \\                                                     |                                    |
| \ of\ \$ 1                                                | \$5185                             |
| \end{matrix} \times \begin{matrix}                        |                                    |
| Regular\ payment\  \\                                     |                                    |
| amount                                                    |                                    |
| \end{matrix}$$                                            |                                    |
|                                                           |                                    |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ FV = 5.6371 \times 800$$  |                                    |
|                                                           |                                    |
| $\ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \$ 4509.68$             |                                    |
|                                                           |                                    |
| Calculate the interest earned.                            |                                    |
|                                                           |                                    |
| $I = FV - Total\ payments$                                |                                    |
|                                                           |                                    |
| $= 4509.68 - (800 \times 5)$                              |                                    |
|                                                           |                                    |
| $= \$ 509.68$                                             |                                    |
+-----------------------------------------------------------+------------------------------------+
| $n = 4$ $r = 3\%$                                         | Find the future value of \$300 per |
|                                                           | quarter for 1.5 years at 8% p.a.   |
| \$5000 per half-year for 2 years at 6% p.a. compounded    | compounded quarterly.              |
| six-monthly.                                              |                                    |
|                                                           | \$1892.43                          |
| $$\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ FV = 4.1836 \times 5000$$ |                                    |
|                                                           |                                    |
| $\ \ \ \ \ \ \ \ \ \ \ \ \ \ \  = \$ 20918$               |                                    |
+-----------------------------------------------------------+------------------------------------+

Foundation

1.  ![](media/Annuities/media/image14.png){width="4.278220691163605in"
    height="1.6708573928258967in"}The table below shows the future value
    of an annuity with a contribution of \$1.

Use the table to calculate the future value of the following annuities:

a.  \$2000 per year for 2 years at 12% p.a. compounded annually.

\$3380

b.  \$32 000 per year for 4 years at 8% p.a. compounded annually.

\$105 920

c.  \$10 000 per year for 3 years at 10% p.a. compounded annually.

\$24 900

2.  ![](media/Annuities/media/image15.png){width="4.973912948381452in"
    height="1.9715234033245845in"}Use the table below to calculate the
    future value and interest earned for the following annuities.

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

![](media/Annuities/media/image16.png){width="4.294479440069991in"
height="1.9938648293963255in"}A table of future value interest factors
for an annuity of \$1 is shown.

> An annuity involves contributions of \$12 000 per annum for 5 years.
> The interest rate is 4% per annum, compounded annually.

a.  Calculate the future value of this annuity.

\$64 995.60

b.  Calculate the interest earned on this annuity.

\$4995.60

14. **2022 HSC Standard 2 Band 5**

![](media/Annuities/media/image17.png){width="3.701388888888889in"
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

> ![](media/Annuities/media/image17.png){width="3.9007895888013997in"
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

![](media/Annuities/media/image18.png){width="5.9751202974628175in"
height="0.6396380139982503in"}Eli is choosing between two investment
options.

![](media/Annuities/media/image18.png){width="5.972222222222222in"
height="0.6715277777777777in"}

A table of future value interest factors for an annuity of \$1 is shown.

![](media/Annuities/media/image19.png){width="5.741666666666666in"
height="1.9236111111111112in"}

What is the difference between the future values after 10 years using
Option 1 and Option 2?

Option 1: $40000\left( 1 + \frac{0.012}{12} \right)^{120} = \$ 45097.17$

Option 2: $1000 \times 45.05630 = \$ 45056.30$

Difference: $\$ 40.87$

# Annuity Present Value Tables

- The **present value** of an annuity is the ***single*** amount of
  money that, if invested now, would produce the same future value as
  making regular contributions.

  ------------------------------------
  **Using a Present Value Table**
  ------------------------------------
  $$\begin{matrix}
  PV \\
  of\ Annuity
  \end{matrix} = \begin{matrix}
  PV \\
  \ of\ \$ 1
  \end{matrix} \times \begin{matrix}
  Regular\ payment\  \\
  amount
  \end{matrix}$$

  ------------------------------------

### **Example** Calculate present value of an annuity using a table.

+----------------------------------------------------------------------------------------------+
| **PV of \$1 Table**                                                                          |
|                                                                                              |
|   ---------------------------------------------------------------------------------          |
|            **1%**   **2%**   **3%**   **4%**   **6%**   **8%**   **10%**   **12%**           |
|   ------- -------- -------- -------- -------- -------- -------- --------- ---------          |
|    **1**    0.99     0.98     0.97     0.96     0.94     0.93     0.91      0.89             |
|                                                                                              |
|    **2**    1.97     1.94     1.91     1.89     1.83     1.78     1.74      1.69             |
|                                                                                              |
|    **3**    2.94     2.88     2.83     2.78     2.67     2.58     2.49      2.40             |
|                                                                                              |
|    **4**    3.90     3.81     3.71     3.63     3.47     3.31     3.17      3.04             |
|                                                                                              |
|    **5**    4.85     4.71     4.58     4.45     4.21     3.99     3.79      3.60             |
|                                                                                              |
|    **6**    5.80     5.60     5.42     5.24     4.92     4.62     4.36      4.11             |
|   ---------------------------------------------------------------------------------          |
+:===============================================:+:==========================================:+
| **Worked Example**                              | **Your Turn**                              |
+-------------------------------------------------+--------------------------------------------+
| Calculate the present value if \$9600 is        | Calculate the present value if \$2230 is   |
| invested at 4% p.a. for 3 years compounded      | invested at 8% p.a. for 5 years compounded |
| annually.                                       | annually.                                  |
|                                                 |                                            |
| $${\begin{matrix}                               | \$8897.70                                  |
| PV \\                                           |                                            |
| of\ Annuity                                     |                                            |
| \end{matrix} = \begin{matrix}                   |                                            |
| PV \\                                           |                                            |
| \ of\ \$ 1                                      |                                            |
| \end{matrix} \times \begin{matrix}              |                                            |
| Regular\ payment\  \\                           |                                            |
| amount                                          |                                            |
| \end{matrix}                                    |                                            |
| }{PV = 2.78 \times 9600                         |                                            |
| }{= \$ 26\ 688}$$                               |                                            |
+-------------------------------------------------+--------------------------------------------+
| What is the present value of an investment of   | What is the present value of an investment |
| \$7000 per quarter for 1 year at 12% p.a.       | of \$500 per month for half a year at 24%  |
|                                                 | p.a. compounded monthly                    |
| compounded quarterly?                           |                                            |
|                                                 | $$\$ 2800$$                                |
| $$n = 1 \times 4,\ \ r = \frac{12\%}{4} = 3\%$$ |                                            |
|                                                 |                                            |
| $${PV = 3.71 \times 7000                        |                                            |
| }{= \$ 25\ 970}$$                               |                                            |
+-------------------------------------------------+--------------------------------------------+
| Find the payment per period of an annuity with  | Find the contribution per period of an     |
| a present value of \$33 240 at 6% p.a.          | annuity with a present value of \$10 000   |
| compounded annually for 3 years.                | at 8% p.a. compounded biannually for 1     |
|                                                 | year.                                      |
| $${\begin{matrix}                               |                                            |
| PV \\                                           | \$5291                                     |
| of\ Annuity                                     |                                            |
| \end{matrix} = \begin{matrix}                   |                                            |
| PV \\                                           |                                            |
| \ of\ \$ 1                                      |                                            |
| \end{matrix} \times \begin{matrix}              |                                            |
| Regular\ payment\  \\                           |                                            |
| amount                                          |                                            |
| \end{matrix}                                    |                                            |
| }{33240 = 2.67 \times x                         |                                            |
| }{x = \frac{33240}{2.67} = \$ 12449.44}$$       |                                            |
+-------------------------------------------------+--------------------------------------------+

Foundation

1.  ![](media/Annuities/media/image20.png){width="4.330831146106736in"
    height="1.669291338582677in"}The table below shows the present value
    of an annuity with a contribution of \$1.

Use the table to calculate the present value of the following annuities.

a.  \$8000 per year for 2 years at 10% p.a. compounded annually.

\$13 920

b.  \$22 000 per year for 2 years at 6% p.a. compounded annually.

\$40 260

c.  \$6000 per year for 4 years at 8% p.a. compounded annually.

\$19 860

2.  ![](media/Annuities/media/image21.png){width="6.780819116360455in"
    height="2.751167979002625in"}The table below shows the present value
    of an annuity with a contribution of \$1.

> Use the table to calculate the present value of the following
> annuities.\
> Answer to the nearest dollar.

a.  \$800 per month for half-a-year at 30% p.a. compounded monthly.

\$4406

b.  \$8 000 per quarter for 2 years at 16% p.a. compounded quarterly.

\$53 862

c.  \$30 000 per half-year for 18 months at 7% p.a. compounded
    six-monthly.

\$84 048

+------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Period** | **Present Value of \$1 Interest rate per period**                                                                               |
+===========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+
|            | **2%**     | **2.5%**   | **3%**     | **3.5%**   | **4%**     | **4.5%**   | **5%**     | **5.5%**   | **6%**     | **8%**     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **2**      | 1.9416     | 1.9274     | 1.9135     | 1.8997     | 1.8861     | 1.8727     | 1.8594     | 1.8463     | 1.8334     | 1.7833     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **3**      | 2.8839     | 2.8560     | 2.8286     | 2.8016     | 2.7751     | 2.7490     | 2.7232     | 2.6979     | 2.6730     | 2.5771     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **4**      | 3.8077     | 3.7620     | 3.7171     | 3.6731     | 3.6299     | 3.5875     | 3.5460     | 3.5052     | 3.4651     | 3.3121     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **5**      | 4.7135     | 4.6458     | 4.5797     | 4.5151     | 4.4518     | 4.3900     | 4.3295     | 4.2703     | 4.2124     | 3.9927     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **6**      | 5.6014     | 5.5081     | 5.4172     | 5.3286     | 5.2421     | 5.1579     | 5.0757     | 4.9955     | 4.9173     | 4.6229     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **7**      | 6.4720     | 6.3494     | 6.2303     | 6.1145     | 6.0021     | 5.8927     | 5.7864     | 5.6830     | 5.5824     | 5.2064     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **8**      | 7.3255     | 7.1701     | 7.0197     | 6.8740     | 6.7327     | 6.5959     | 6.4632     | 6.3346     | 6.2098     | 5.7466     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **9**      | 8.1622     | 7.9709     | 7.7861     | 7.6077     | 7.4353     | 7.2688     | 7.1078     | 6.9522     | 6.8017     | 6.2469     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **10**     | 8.9826     | 8.7521     | 8.5302     | 8.3166     | 8.1109     | 7.9127     | 7.7217     | 7.5376     | 7.3601     | 6.7101     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **20**     | 16.3514    | 15.5892    | 14.8775    | 14.2124    | 13.5903    | 13.0079    | 12.4622    | 11.9504    | 11.4699    | 9.8181     |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **24**     | 18.9139    | 17.8850    | 16.9355    | 16.0584    | 15.2470    | 14.4955    | 13.7986    | 13.1517    | 12.5504    | 10.5288    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **36**     | 25.4888    | 23.5563    | 21.8323    | 20.2905    | 18.9083    | 17.6660    | 16.5469    | 15.5361    | 14.6210    | 11.7172    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **48**     | 30.6731    | 27.7732    | 25.2667    | 23.0912    | 21.1951    | 19.5356    | 18.0772    | 16.7902    | 15.6500    | 12.1891    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **60**     | 34.7609    | 30.9087    | 27.6756    | 24.9447    | 22.6235    | 20.6380    | 18.9293    | 17.4499    | 16.1614    | 12.3766    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **120**    | 45.3554    | 37.9337    | 32.3730    | 28.1111    | 24.7741    | 22.1093    | 19.9427    | 18.1524    | 16.6514    | 12.4988    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **180**    | 48.5844    | 39.5304    | 33.1703    | 28.5130    | 24.9785    | 22.2142    | 19.9969    | 18.1806    | 16.6662    | 12.5000    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **240**    | 49.5686    | 39.8933    | 33.3057    | 28.5640    | 24.9980    | 22.2216    | 19.9998    | 18.1818    | 16.6667    | 12.5000    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+
| **248**    | 49.6318    | 39.9124    | 33.3115    | 28.5658    | 24.9985    | 22.2218    | 19.9999    | 18.1818    | 16.6667    | 12.5000    |
+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+------------+

+------------+------------------------------------------------------------------------------------------+
| **Period** | **Present Value of \$1 Interest Rate per Period**                                        |
+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+:==========:+
|            | **0.4%**   | **0.5%**   | **0.6%**   | **0.7%**   | **0.8%**   | **1%**     | **1.5%**   |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **1**      | 0.9960     | 0.9950     | 0.9940     | 0.9930     | 0.9921     | 0.9901     | 0.9852     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **2**      | 1.9881     | 1.9851     | 1.9821     | 1.9792     | 1.9763     | 1.9704     | 1.9559     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **3**      | 2.9762     | 2.9702     | 2.9644     | 2.9585     | 2.9526     | 2.9410     | 2.9122     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **4**      | 3.9603     | 3.9505     | 3.9407     | 3.9310     | 3.9213     | 3.9020     | 3.8544     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **5**      | 4.9406     | 4.9259     | 4.9112     | 4.8967     | 4.8822     | 4.8534     | 4.7826     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **6**      | 5.9169     | 5.8964     | 5.8760     | 5.8557     | 5.8355     | 5.7955     | 5.6972     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **7**      | 6.8893     | 6.8621     | 6.8350     | 6.8080     | 6.7813     | 6.7282     | 6.5982     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **8**      | 7.8579     | 7.8230     | 7.7882     | 7.7538     | 7.7195     | 7.6517     | 7.4859     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **9**      | 8.8226     | 8.7791     | 8.7358     | 8.6929     | 8.6503     | 8.5660     | 8.3605     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **10**     | 9.7835     | 9.7304     | 9.6778     | 9.6255     | 9.5737     | 9.4713     | 9.2222     |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **20**     | 19.1841    | 18.9874    | 18.7936    | 18.6025    | 18.4142    | 18.0456    | 17.1686    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **24**     | 22.8405    | 22.5629    | 22.2899    | 22.0216    | 21.7578    | 21.2434    | 20.0304    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **36**     | 33.4659    | 32.8710    | 32.2907    | 31.7247    | 31.1723    | 30.1075    | 27.6607    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **48**     | 43.5942    | 42.5803    | 41.5988    | 40.6486    | 39.7284    | 37.9740    | 34.0426    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **60**     | 53.2489    | 51.7256    | 50.2621    | 48.8559    | 47.5042    | 44.9550    | 39.3803    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **120**    | 95.1560    | 90.0735    | 85.3666    | 81.0035    | 76.9552    | 69.7005    | 55.4985    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **180**    | 128.1370   | 118.5035   | 109.8845   | 102.1569   | 95.2139    | 83.3217    | 62.0956    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **240**    | 154.0933   | 139.5808   | 127.0084   | 116.0760   | 106.5336   | 90.8194    | 64.7957    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **248**    | 157.1078   | 141.9441   | 128.8616   | 117.5296   | 107.6740   | 91.5219    | 65.0058    |
+------------+------------+------------+------------+------------+------------+------------+------------+
| **300**    | 174.5210   | 155.2069   | 138.9683   | 125.2349   | 113.5515   | 94.9466    | 65.9009    |
+------------+------------+------------+------------+------------+------------+------------+------------+

Development

3.  Let\'s explore how present value, future value, and compound
    interest are related.

Consider the scenario:

An annuity involves depositing \$3000 at the end of each year for 6
years.\
The interest rate is 8% p.a.

a.  Calculate the **future value** of this annuity using the tables.

$$3000 \times 7.3359 = \$ 22\ 007.70$$

b.  Find the single amount that, invested now, equals the future value
    of the annuity.\
    This is the **present value** of the annuity.

$$3000\  \times \ 4.6229 = \$ 13\ 868.70$$

c.  Verify that \$13 868 invested for 6 years at 8% p.a. compound
    interest grows to the future value calculated in part a.
    $FV = PV(1 + r)^{n}$.\
    (your answer might be a few cents off as the values in the table are
    rounded to 4 d.p.)

$$FV = 13868.70(1.08)^{6} = 22007.88$$

4.  An annuity involves depositing \$2000 at the end of each year for 7
    years.\
    The interest rate is 8% p.a.

    a.  Calculate the future value of this annuity.

\$17 845.71

b.  Find the present value of this annuity.

\$10 412.80

c.  Use the compound interest formula to check your answers to parts
    **a** and **b**.

$$10412.80(1.08)^{7} = \$ 17845.71$$

5.  A superannuation account involves depositing \$500 at the end of
    each month for 4 years.\
    The interest rate is 6% p.a.

    a.  Calculate the value of the superannuation account at the end of
        the 4 years.

\$27 048.90

b.  Calculate the single amount to deposit now to equal the amount in
    part **a** after 4 years.

\$21 290.15

c.  Use the compound interest formula to check your answers to part
    **a** and **b**.

$$21290.15\left( 1 + \frac{0.06}{12} \right)^{48} = 27048.90$$

# Applications of Present Value

- **Present value** calculations help you find the **single amount** of
  money that, if invested now, would grow to equal the same future value
  as making regular contributions.

- Applications of present value include:

  - PV is how much you need to invest today to receive a level of
    regular payments in the future, such as superannuation.

  - PV is how much money you can borrow in a loan, given a level of
    monthly repayments you can afford.

  - Calculating how much your monthly repayments should be for a loan.

Foundation

For these questions, use the present value table.

1.  Malcolm needs \$400 per month for 3 years while he studies at
    university.\
    What amount of money do his parents need to invest now at 6% p.a.
    compounding monthly, to provide the money Malcolm needs?

$$PV = 400 \times 32.8710 = \$ 13148.40$$

2.  Stuart estimates that he will need \$500 per month for the 4 years
    of his university course.\
    If the current interest rate is 7.2% p.a. compounding monthly, how
    much will Stuart's parents need to deposit now to meet his needs?

\$20 799.40

3.  Angelica is planning an overseas trip for 3 years and estimates that
    she will need \$600 per month for expenses. How much should she
    deposit in an account paying 4.8% p.a. compounding monthly to have
    enough money for her trip?

\$20 079.54

4.  Joanne has won the lottery. She wants to invest some of the money in
    an annuity that will provide \$5000 per month for the next 15 years.
    If the best interest rate available is 7.2% p.a. compounding
    monthly, how much of her winnings must she invest now to provide
    this monthly income?

\$549 422.50

Development

5.  Glenn retires and receives a lump-sum payment. He wants to convert
    part of the lump sum into an annuity that will provide a monthly
    income of \$7000 for the first 10 years of his retirement.\
    If the best interest rate available is 4.8% p.a. compounding
    monthly, how much of his lump sum must he invest now to provide this
    monthly income?

\$666 092

6.  In order to provide a regular income when he retires, Paul invests
    \$300 000 for 15 years in an annuity that pays 6% p.a. compounding
    monthly. He plans to make regular equal monthly withdrawals for 15
    years until there is nothing left in his account. What will be his
    monthly income from the annuity?

$Regular\ payment =$ $\frac{300000}{118.5035}$ $=$ \$2531.57

7.  In order to have a regular income when he retires, Sam invests \$550
    000 for 15 years in an annuity that pays 7.2% p.a. compounding
    monthly. He plans to make regular equal monthly withdrawals for 15
    years until there is nothing left in his account. What will be his
    monthly income from the annuity?

\$5005.26

8.  Jenny and Peter are looking for a loan to buy a house. They have
    prepared a budget and have calculated that they can afford to pay
    \$1800 per month. If the current interest rate is 6% p.a.
    compounding monthly, use the table of present values to determine
    how much they can afford to borrow over 20 years. Give your answer
    to the nearest dollar.

\$251 245

9.  Lisa and Jack are looking for a loan to buy a house. They have
    worked out that they can afford to pay \$1000 per month. If the
    current interest rate is 4.8% p.a. compounding monthly, use the
    table of present values to determine how much, to the nearest
    dollar, they can afford to borrow over 20 years.

\$154 093.30

10. Geoff wants to provide a regular quarterly income of \$20 000 for
    the next 9 years. If the current interest rate is 6% p.a., how much
    does he need to invest now to provide the income he wants?

\$553 214

11. Julie invests \$600 000 for 20 years in an annuity that pays 4.8%
    p.a. compounding monthly. She plans to make regular equal monthly
    withdrawals for 20 years until there is nothing left in her account.
    What will be her monthly income from the annuity?

\$3893.74

12. Zara and Will have calculated that they can afford to pay \$1200 per
    month on a home loan.

    a.  If the current interest rate is 7.2% p.a., compounding monthly,
        use the table of present values to determine how much, to the
        nearest dollar, they can afford to borrow over 15 years.

\$131 861

b.  How much more could they borrow if they took the loan over 20 years?
    Give your answer to the nearest dollar.

\$20 549

13. To buy a car, John obtains a reducing-balance loan for \$15 000 over
    5 years at 7.2% p.a. compounding monthly.

    a.  Use the table of present value interest factors to calculate the
        monthly repayment.

$Monthly\ repayment =$ $\frac{15000}{50.2621}$ $=$ \$298.44

b.  Calculate the total amount to be repaid over the term of the loan.

$298.44 \times 5 \times 12 =$ \$17 906.40

c.  What is the amount of interest to be paid?

$17906.40 - 15000 =$ \$2906.40

14. Gillian borrows \$12 000 over 4 years at 4.8% p.a. compounding
    monthly to go on a holiday.

    a.  Use the table of present value interest factors to calculate the
        monthly repayment.

\$275.27

b.  Calculate the total amount to be repaid over the term of the loan.

\$13 212.96

c.  What is the amount of interest to be paid?

\$1212.96

15. Peter borrows \$20 000 over 5 years at 6% p.a. compounding quarterly
    to renovate his bathroom.

    a.  Use the table of present value interest factors to calculate the
        quarterly repayment.

\$1164.92

b.  Calculate the total amount to be repaid over the term of the loan.

\$23 298.40

c.  What is the amount of interest to be paid?

\$3298.40

16. A loan for \$360 000 is taken over 25 years.

    a.  Use the table of present value interest factors to calculate the
        monthly payment if the interest rate is 8.4% p.a.

\$2874.60

b.  Find the total to be repaid at this rate.

\$862 380

c.  Use the table of present value interest factors to calculate the
    monthly payment if the interest rate is 7.2%.

\$2590.52

d.  Find the total repaid at this rate.

\$777 156

e.  Calculate the amount saved on a \$360 000 loan over 25 years if the
    interest rate charged is 7.2% p.a. instead of 8.4% p.a.

\$85 224

Mastery

17. ![A table with numbers and a few black text AI-generated content may
    be
    incorrect.](media/Annuities/media/image22.png){width="4.460416666666666in"
    height="1.4847222222222223in"}**HSC 2021 Standard 2 Band 5**

> A bank lends Martina \$500 000 to purchase a home, with interest
> charged at 1.5% per annum compounding monthly. She agrees to repay the
> loan by making equal monthly repayments over a 30-year period.
>
> How much should the monthly payment be to pay off the loan in 30
> years?\
> Give your answer correct to the nearest cent.

Monthly interest rate = $\frac{0.015}{12}$ $= 0.00125$

Number of periods $= 30 \times 12 = 360$

Monthly payment $=$ $\frac{500000}{289.75411}$ $= 1725.60$

18. **HSC Standard 2 Sample Question Band 5**

Camilla buys a car for \$21 000 and repays it over 4 years through equal
monthly instalments.

She pays a 10% deposit and interest is charged at 9% p.a. on the
reducing balance loan.

Using the Table of present value interest factors below, where $r$
represents the monthly interest and $N$ represents the number of
repayments

![2UG FM5
S-2](media/Annuities/media/image23.png){width="5.726388888888889in"
height="2.261111111111111in"}

a.  Calculate the monthly repayment, $P$, that Camilla must pay to
    complete the loan after 4 years (to the nearest \$).

Principal = $21000 - 2100 = \$ 18900$

Monthly interest rate $=$ $\frac{0.09}{12}$ $= 0.0075$

Number of repayments = $4 \times 12 = 48$

Monthly repayment = $\frac{18900}{40.18478}$ $=$ $\$ 470$

b.  Calculate the total interest paid over the life of the loan.

Total repaid = $470 \times 4 \times 12 = \$ 22560$

Interest = $22560 - 18900 = \$ 3660$

19. **2015 HSC Standard 2 Band 5**

![](media/Annuities/media/image24.png){width="4.44155949256343in"
height="1.904002624671916in"}

> Oscar plans to invest \$200 each month for 74 months. His investment
> will earn interest at the rate of 0.0080 (as a decimal) per month.

a.  Calculate the present value of this annuity.

$$r = 0.0080,\ n = 74$$

$$PV = 200 \times 55.68446$$

= $\$ 11136.89$

b.  Lucy is using the same table to calculate the loan repayment for her
    car loan.\
    Her loan is \$$21500$ and will be repaid in equal monthly repayments
    over 6 years.\
    The interest rate on her loan is 10.8% per annum.

> Calculate the amount of each monthly repayment.

$$r = \frac{0.108}{12} = 0.009,\ n = 6 \times 12 = 72$$

$$Monthly\ repayment = \frac{21500}{52.82118} = \$ 407$$

20. **HSC 2020 Standard 2 Band 6**

> Wil deposited a lump sum into a new bank account which earns 2% per
> annum compound interest. Present value interest factors for an annuity
> of \$1 for various interest rates ($r$) and numbers of periods ($N$)
> are given in the table.

![A table with numbers and a number of objects AI-generated content may
be
incorrect.](media/Annuities/media/image25.png){width="3.3831167979002625in"
height="1.2788713910761156in"}

Wil was able to make the following withdrawals from this account.

\$1000 at the end of each year for 20 years (starting one year after the
account is opened)

\$3000 each year for 10 years starting 21 years after the account is
opened.

> Calculate the minimum lump sum Wil must have deposited when she opened
> the new account.

Hint: To find PV of \$3000 each year for 10 years after 20 years,
calculate PV for \$3000 for 30 years, then subtract PV for \$3000 for 20
years.

$$PV\ of\ \$ 1000\ each\ year\ for\ 20\ years:1000 \times 16.351 = \$ 16351$$

$$PV\ of\ \$ 3000\ each\ year\ for\ 30\ years:\ 3000 \times 22.396 = \$ 67188$$

$$PV\ of\ \$ 3000\ each\ year\ for\ 20\ years:\ 3000 \times 16.351 = \$ 49053$$

16351 + (67188 -- 49053) = \$34486
