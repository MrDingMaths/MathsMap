  ----------------------

  ----------------------

Student Name

  -------------------------------------------------------------------
  Mathematics Standard Year 12
  -------------------------------------------------------------------
  **Critical Path\
  Analysis**

  -------------------------------------------------------------------

+--------+-----------------------------------+-------------------------+
| **Book | Critical path analysis            | Version: 250328         |
| 1**    |                                   |                         |
|        |                                   | Report mistakes &       |
|        |                                   | suggest improvements:\  |
|        |                                   | https://MrDingMaths.com |
+========+===================================+=========================+

+-------------------------------------------------------------------+
| # Contents {#contents .TOC-Heading}                               |
|                                                                   |
| [Overview [2](#overview)](#overview)                              |
|                                                                   |
| [Activity Charts [3](#activity-charts)](#activity-charts)         |
|                                                                   |
| [Dummy Activities [11](#dummy-activities)](#dummy-activities)     |
|                                                                   |
| [Forward and Backward Scans                                       |
| [19](#forward-and-backward-scans)](#forward-and-backward-scans)   |
|                                                                   |
| [Critical Path Analysis                                           |
| [30](#critical-path-analysis)](#critical-path-analysis)           |
|                                                                   |
| [Crashing [33](#crashing)](#crashing)                             |
+===================================================================+

# Overview

## Syllabus Content

**MST-12-S2-07** applies critical path analysis to solve problems and
model decision-making in practical contexts

- Construct a network diagram from a precedence table or equivalent,
  including those involving dummy activities, limited to 10 activities

- Explain the term critical path

- Apply forward and backward scanning to determine the earliest starting
  time (EST) and latest starting time (LST) for each activity in a
  project

- Calculate float times to identify critical and non-critical activities

- Analyse ESTs and LSTs to locate the critical path(s) for the project

- Apply critical path analysis to determine the minimum completion time
  for a project

- Construct a Gantt chart to represent a project from a network diagram
  indicating the critical path

- Examine the impact of increasing or reducing the duration of an
  activity on the completion time of the project or task being modelled

- Use a spreadsheet to model a project involving precedence tables and
  solve related problems

## Reference

- Each textbook teaches critical path analysis differently.

- ![](media/Critical Path Analysis/media/image1.png){width="2.0984251968503935in"
  height="2.02755905511811in"}This booklet tries to take the best
  strategies from each textbook and NESA guides to best prepare you for
  the HSC questions and the NESA provided worked solutions.

- Boxes are placed on the vertices. Each vertex shows when all incoming
  activities must be completed and when all outgoing activities can
  begin.

- The left box is Earliest Start Time, the right box is Latest Start
  Time.

- The EST is of all the activities starting at the vertex.

- For the LST:

  - If there is only 1 activity starting at the vertex, it is the LST of
    that activity.

  - If there is more than 1 activity starting at the vertex, it is the
    LST of the activity that must be started earlier.

- To calculate float time:\
  $$Float\ Time = {LST}_{next\ activity} - \ Activity\ time - {EST}_{current\ activity}$$

- **Note:** This method of solving questions may differ slightly from
  provided worked solutions, but your answers should be the same.

# Activity Charts

- Activity charts represent projects as **directed**, **weighted**
  networks.

- Edges show \"doing\" the activity. Edge weights usually represent
  time.

- Vertices mark where activities start or end.

> ![Graphical user interface, application Description automatically
> generated](media/Critical Path Analysis/media/image2.png){width="3.921527777777778in"
> height="1.0381353893263343in"}\
> **Project: Make tea.**

+--------------+--------------+---------------+------------------+
| **Activity** | **Task**     | **Duration**  | **Immediate      |
|              |              |               | Predecessor(s)** |
|              |              | **(seconds)** |                  |
+:============:+==============+:=============:+:================:+
| A            | Water in     | 20            | \-               |
|              | kettle       |               |                  |
+--------------+--------------+---------------+------------------+
| B            | Boil kettle  | 30            | A                |
+--------------+--------------+---------------+------------------+
| C            | Tea in pot   | 15            | \-               |
+--------------+--------------+---------------+------------------+
| D            | Water in pot | 10            | B,C              |
+--------------+--------------+---------------+------------------+
| E            | Infuse       | 120           | D                |
+--------------+--------------+---------------+------------------+

### **Example** Interpret an activity table.

+-----------------------------------------------------------------------+
| The table lists the activities required for getting ready in the      |
| morning.                                                              |
|                                                                       |
| +--------------+---------------------+---------+--------------------+ |
| | **Activity** | **Task**            | **Time  | **Immediate**      | |
| |              |                     | (min)** |                    | |
| |              |                     |         | **Predecessor(s)** | |
| +:============:+=====================+:=======:+:==================:+ |
| | A            | Get dressed         | 4       | \-                 | |
| +--------------+---------------------+---------+--------------------+ |
| | B            | Make breakfast      | 5       | A                  | |
| +--------------+---------------------+---------+--------------------+ |
| | C            | Eat breakfast       | 6       | B                  | |
| +--------------+---------------------+---------+--------------------+ |
| | D            | Brush teeth         | 2       | C                  | |
| +--------------+---------------------+---------+--------------------+ |
| | E            | Wash face           | 3       | C                  | |
| +--------------+---------------------+---------+--------------------+ |
| | F            | Leave the house     | 1       | D, E               | |
| +--------------+---------------------+---------+--------------------+ |
|                                                                       |
| What activity is a prerequisite for activity B? Activity A            |
|                                                                       |
| What activity is an *immediate* *predecessor* for activity C?         |
| Activity B                                                            |
|                                                                       |
| What activities are prerequisites for activity C? Activity A and B    |
|                                                                       |
| Activity C is necessary for which activities? Activity D and E        |
|                                                                       |
| What activities need be done for activity F? Activity D and E         |
|                                                                       |
| What is the difference between a prerequisite and an immediate        |
| predecessor?                                                          |
|                                                                       |
| *A prerequisite is any task that must be completed before another     |
| task, while an immediate predecessor is specifically the task that    |
| must be completed ............... before.*                            |
+=======================================================================+

a.  Consider the following table, which lists things that can be crafted
    in a game.

![Table Description automatically
generated](media/Critical Path Analysis/media/image3.png){width="5.300847550306211in"
height="0.7952252843394576in"}

> Which of the following statements are correct according to the table?

i.  Making a craft bench has a prerequisite of making a shield.

false

ii. Making a craft bench is necessary for making a shield.

true

iii. Making a shield has a prerequisite of making a craft bench.

true

iv. Making a shield is necessary for making a craft bench.

false

b.  ![](media/Critical Path Analysis/media/image4.png){width="5.302872922134733in"
    height="1.2881353893263343in"}Here is a list of the usual activities
    involved in buying a house:

Answer the following according to the table above.

i.  List all the activities that are directly dependent upon A.

B and C

ii. If you have obtained loan approval, have you necessarily found a
    house? Explain.

Yes, as finding a house is an immediate predecessor of obtaining loan
approval.

iii. Must you find a house before obtaining a building inspection?

yes

iv. Is A necessary for B?

yes

v.  Can you obtain loan approval without a building inspection?

yes

vi. Can you obtain a building inspection without loan approval?

yes

vii. Can you buy a house without obtaining a building inspection?

no

## Activity Tables to Charts

1.  Place a *start* vertex on the left.

2.  Draw edges for activities with no immediate predecessors connecting
    from the start.

3.  Working through each activity, draw edges connecting from the
    immediate predecessor.\
    **Tip:** Don\'t draw the vertex until you\'re sure of all immediate
    successors.

4.  Activities with no immediate successors will connect to the *finish*
    vertex.

### **Example** Construct an activity chart from a table.

+---------------------------------------------------------------------------------------------------------------+
| +--------------+--------------------+                                                                         |
| | **Activity** | **Immediate**      |                                                                         |
| |              |                    |                                                                         |
| |              | **Predecessor(s)** |                                                                         |
| +:============:+:==================:+                                                                         |
| | A            | \-                 |                                                                         |
| +--------------+--------------------+                                                                         |
| | B            | \-                 |                                                                         |
| +--------------+--------------------+                                                                         |
| | C            | A                  |                                                                         |
| +--------------+--------------------+                                                                         |
| | D            | B                  |                                                                         |
| +--------------+--------------------+                                                                         |
| | E            | B                  |                                                                         |
| +--------------+--------------------+                                                                         |
| | F            | C, D               |                                                                         |
| +--------------+--------------------+                                                                         |
| | G            | E, F               |                                                                         |
| +--------------+--------------------+                                                                         |
|                                                                                                               |
| ![](media/Critical Path Analysis/media/image5.png){width="2.3256944444444443in"                               |
| height="1.1416666666666666in"}![](media/Critical Path Analysis/media/image6.png){width="0.9in"                |
| height="0.8805555555555555in"}**Step 1 Step 4**                                                               |
|                                                                                                               |
| **Step 2 Step 5**                                                                                             |
|                                                                                                               |
| ![](media/Critical Path Analysis/media/image7.png){width="3.2916666666666665in"                               |
| height="1.1833333333333333in"}![](media/Critical Path Analysis/media/image8.png){width="1.4479166666666667in" |
| height="1.0277777777777777in"}                                                                                |
|                                                                                                               |
| **\                                                                                                           |
| \**                                                                                                           |
|                                                                                                               |
| ![](media/Critical Path Analysis/media/image9.png){width="1.4597222222222221in"                               |
| height="1.15in"}![](media/Critical Path Analysis/media/image10.png){width="3.7305555555555556in"              |
| height="1.1715277777777777in"}**Step 3 Step 6**                                                               |
|                                                                                                               |
| Why are 2 edges coming out from the start vertex?                                                             |
|                                                                                                               |
| *Activity A and B both have no ........................... ............, so can be started immediately.*      |
|                                                                                                               |
| Why we do not draw the vertex until we are certain of all the immediate successors?                           |
|                                                                                                               |
| *To avoid having to r...d......... edges (the diagram can get very messy).*                                   |
|                                                                                                               |
| How do we know G connects to the finish vertex?                                                               |
|                                                                                                               |
| *No activities have G as an .................. ....................., meaning it is the final activity.*      |
+===============================================================================================================+

![](media/Critical Path Analysis/media/image11.png){width="2.952755905511811in"
height="1.5436023622047244in"}Construct a network diagram from this
activity chart.

a.  

![](media/Critical Path Analysis/media/image12.png){width="1.6434776902887138in"
height="0.46375328083989503in"}

b.  ![](media/Critical Path Analysis/media/image13.png){width="2.952755905511811in"
    height="1.5367399387576552in"}

![](media/Critical Path Analysis/media/image14.png){width="1.3505807086614172in"
height="0.7363112423447069in"}

![](media/Critical Path Analysis/media/image15.png){width="2.952755905511811in"
height="2.40751312335958in"}

c.  

![](media/Critical Path Analysis/media/image16.png){width="2.168251312335958in"
height="0.9356430446194226in"}

Foundation

1.  An activity chart for washing your hands is shown below.

  ---------------------------------------------------------------------------
   **Activity**  **Task**                   **Duration       **Immediate
                                             (min)**        Predecessors**
  -------------- ------------------------ -------------- --------------------
        A        Turn on water                  1                 \-

        B        Wet hands                      1                 A

        C        Clean hands                    3                 B

        D        Rinse soap                     2                 C

        E        Dry hands                      3                 D
  ---------------------------------------------------------------------------

a.  How many activities in the project?

5

b.  Which activity(s) has the longest time interval?

C and E

c.  What is the total time for this project?

10 minutes

d.  What is the immediate predecessor for activity C?

B

e.  What activities precede activity B?

A

2.  An activity chart for preparing a meal is shown below.

  ---------------------------------------------------------------------------
   **Activity**  **Task**                   **Duration       **Immediate
                                             (min)**        Predecessors**
  -------------- ------------------------ -------------- --------------------
        A        Find recipe                    2                 \-

        B        Prepare ingredients            10                A

        C        Cook meal                      25                B

        D        Serve meal                     3                 C

        E        Clean up                       10                D
  ---------------------------------------------------------------------------

a.  How many activities in the project?

5

b.  Which activity has the shortest time interval?

A

c.  What is the total time for this project?

50 minutes

3.  Construct a network diagram or activity table.

+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------+
| a.  ![](media/Critical Path Analysis/media/image17.png){width="2.7847353455818022in" | ![](media/Critical Path Analysis/media/image18.png){width="1.8461187664041996in" |
|     height="1.4566929133858268in"}                                                   | height="0.2531988188976378in"}                                                   |
+======================================================================================+==================================================================================+
| b.  ![](media/Critical Path Analysis/media/image19.png){width="2.7694444444444444in" | ![](media/Critical Path Analysis/media/image20.png){width="1.489935476815398in"  |
|     height="1.45625in"}                                                              | height="0.5826082677165354in"}                                                   |
+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------+
| c.  ![](media/Critical Path Analysis/media/image21.png){width="2.785884733158355in"  | ![](media/Critical Path Analysis/media/image22.png){width="1.4906080489938758in" |
|     height="1.7638888888888888in"}                                                   | height="0.7391305774278215in"}                                                   |
+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------+
| d.  ![](media/Critical Path Analysis/media/image23.png){width="1.70711176727909in"   | ![](media/Critical Path Analysis/media/image24.png){width="2.3125in"             |
|     height="1.3647944006999124in"}                                                   | height="1.2652154418197725in"}                                                   |
+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------+
| e.  ![](media/Critical Path Analysis/media/image25.png){width="1.6781627296587927in" | ![](media/Critical Path Analysis/media/image24.png){width="2.5416666666666665in" |
|     height="1.6308912948381453in"}                                                   | height="1.2034722222222223in"}                                                   |
+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------+
| f.  ![](media/Critical Path Analysis/media/image26.png){width="1.6807666229221347in" | ![](media/Critical Path Analysis/media/image24.png){width="2.3125in"             |
|     height="1.7652744969378829in"}                                                   | height="1.3493055555555555in"}                                                   |
+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------+

Development

4.  Construct a network diagram or activity table.

+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------+
| a.  ![](media/Critical Path Analysis/media/image27.png){width="2.734722222222222in"  | ![](media/Critical Path Analysis/media/image28.png){width="1.8943219597550307in" |
|     height="2.227777777777778in"}                                                    | height="0.8161100174978128in"}                                                   |
+======================================================================================+==================================================================================+
| b.  ![](media/Critical Path Analysis/media/image29.png){width="2.720833333333333in"  | ![](media/Critical Path Analysis/media/image30.png){width="1.89375in"            |
|     height="2.754861111111111in"}                                                    | height="0.7236111111111111in"}                                                   |
+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------+
| c.  ![](media/Critical Path Analysis/media/image31.png){width="1.5056102362204724in" |                                                                                  |
|     height="2.231232502187227in"}                                                    |                                                                                  |
+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------+
| d.  ![](media/Critical Path Analysis/media/image32.png){width="1.5056102362204724in" | ![](media/Critical Path Analysis/media/image33.png){width="3.0541666666666667in" |
|     height="2.0416207349081366in"}                                                   | height="1.190126859142607in"}                                                    |
|                                                                                      |                                                                                  |
|                                                                                      | ![](media/Critical Path Analysis/media/image34.png){width="3.0541666666666667in" |
|                                                                                      | height="1.2659722222222223in"}                                                   |
+--------------------------------------------------------------------------------------+----------------------------------------------------------------------------------+

Mastery

5.  **2019 HSC Standard 2 Band 5**

![](media/Critical Path Analysis/media/image35.png){width="3.477777777777778in"
height="2.3965277777777776in"} Sketch the activity network shown by this
table.

![](media/Critical Path Analysis/media/image36.png){width="3.566182195975503in"
height="0.9478258967629046in"}

6.  **HSC Sample Question Band 5**

![](media/Critical Path Analysis/media/image37.png){width="4.70454615048119in"
height="3.285462598425197in"} Sketch the activity network shown by this
table.

![](media/Critical Path Analysis/media/image38.png){width="3.7609995625546806in"
height="1.345259186351706in"}

# Dummy Activities

### **Investigation** Dummy Activity

+-------------------------------------------------------------------+
| Draw the network diagram.                                         |
|                                                                   |
| +--------------+--------------------+                             |
| | **Activity** | **Immediate**      |                             |
| |              |                    |                             |
| |              | **Predecessor(s)** |                             |
| +:============:+:==================:+                             |
| | A            | \-                 |                             |
| +--------------+--------------------+                             |
| | B            | \-                 |                             |
| +--------------+--------------------+                             |
| | C            | \-                 |                             |
| +--------------+--------------------+                             |
| | D            | A, B               |                             |
| +--------------+--------------------+                             |
| | E            | B, C               |                             |
| +--------------+--------------------+                             |
|                                                                   |
| What do you notice?                                               |
|                                                                   |
| *We need to connect an edge to ...... and ......*                 |
+===================================================================+

## Dummy Activity

- A **dummy activity** is needed when activities **share some but not
  all immediate predecessors**.

- Dummy activities typically appear as **dotted lines**.

- A dummy activity connects from the end of a shared immediate
  predecessor to the start of an activity with multiple immediate
  predecessors.

- A dummy activity is imaginary; it simply helps us create the network
  diagram.

### **Example** Draw activity charts with dummy activities.

+----------------------------------------------------------------------------------------------------------------+
| +--------------+--------------------+                                                                          |
| | **Activity** | **Immediate**      |                                                                          |
| |              |                    |                                                                          |
| |              | **Predecessor(s)** |                                                                          |
| +:============:+:==================:+                                                                          |
| | A            | \-                 |                                                                          |
| +--------------+--------------------+                                                                          |
| | B            | \-                 |                                                                          |
| +--------------+--------------------+                                                                          |
| | C            | \-                 |                                                                          |
| +--------------+--------------------+                                                                          |
| | D            | A, B               |                                                                          |
| +--------------+--------------------+                                                                          |
| | E            | B, C               |                                                                          |
| +--------------+--------------------+                                                                          |
|                                                                                                                |
| ![](media/Critical Path Analysis/media/image39.png){width="1.136111111111111in"                                |
| height="0.8784722222222222in"}![](media/Critical Path Analysis/media/image40.png){width="2.1881944444444446in" |
| height="1.0368055555555555in"}**Step 1 Step 3**                                                                |
|                                                                                                                |
| **Step 2 Step 4**                                                                                              |
|                                                                                                                |
| ![](media/Critical Path Analysis/media/image41.png){width="2.9583333333333335in"                               |
| height="0.9736111111111111in"}![](media/Critical Path Analysis/media/image42.png){width="2.1069444444444443in" |
| height="0.9840277777777777in"}                                                                                 |
+================================================================================================================+

Construct a network diagram from this activity chart.

a.  ![](media/Critical Path Analysis/media/image43.png){width="2.9520833333333334in"
    height="1.5463287401574803in"}

![](media/Critical Path Analysis/media/image44.png){width="2.0727548118985126in"
height="1.0789687226596676in"}

![](media/Critical Path Analysis/media/image45.png){width="2.9520833333333334in"
height="2.045138888888889in"}

b.  

![](media/Critical Path Analysis/media/image46.png){width="2.688859361329834in"
height="1.0789687226596676in"}

c.  ![](media/Critical Path Analysis/media/image47.png){width="2.924359142607174in"
    height="2.20625in"}Complete the activity chart for the network
    shown.

![](media/Critical Path Analysis/media/image48.png){width="3.5708333333333333in"
height="2.20625in"}

\-

B

A

A

C, E

D, B

H

## Edge Weights

- Time or costs are shown using edge weights in an activity chart.

- A dummy activity has an edge weight of 0, since it is imaginary.

### **Example** Draw activity charts with edge weights.

+----------------------------------------------------------------------------------------------------------------+
| +--------------+--------------+--------------------+                                                           |
| | **Activity** | **Duration** | **Immediate**      |                                                           |
| |              |              |                    |                                                           |
| |              |              | **Predecessor(s)** |                                                           |
| +:============:+:============:+:==================:+                                                           |
| | A            | 8            | \-                 |                                                           |
| +--------------+--------------+--------------------+                                                           |
| | B            | 6            | \-                 |                                                           |
| +--------------+--------------+--------------------+                                                           |
| | C            | 1            | A                  |                                                           |
| +--------------+--------------+--------------------+                                                           |
| | D            | 2            | B                  |                                                           |
| +--------------+--------------+--------------------+                                                           |
| | E            | 3            | C                  |                                                           |
| +--------------+--------------+--------------------+                                                           |
| | F            | 1            | C, D               |                                                           |
| +--------------+--------------+--------------------+                                                           |
| | G            | 2            | E, F               |                                                           |
| +--------------+--------------+--------------------+                                                           |
|                                                                                                                |
| **Step 1 Step 4**                                                                                              |
|                                                                                                                |
| ![](media/Critical Path Analysis/media/image49.png){width="2.7159722222222222in"                               |
| height="1.1381944444444445in"}![](media/Critical Path Analysis/media/image50.png){width="0.9090277777777778in" |
| height="0.9229166666666667in"}                                                                                 |
|                                                                                                                |
| **Step 2 Step 5**                                                                                              |
|                                                                                                                |
| ![](media/Critical Path Analysis/media/image51.png){width="3.736111111111111in"                                |
| height="1.0590277777777777in"}![](media/Critical Path Analysis/media/image52.png){width="1.9159722222222222in" |
| height="1.0979166666666667in"}                                                                                 |
|                                                                                                                |
| **Step 3 Step 6**                                                                                              |
|                                                                                                                |
| ![](media/Critical Path Analysis/media/image53.png){width="2.6277777777777778in"                               |
| height="1.0909722222222222in"}![](media/Critical Path Analysis/media/image54.png){width="4.251388888888889in"  |
| height="1.1479166666666667in"}                                                                                 |
+================================================================================================================+

Construct a network diagram from this activity chart.

a.  ![](media/Critical Path Analysis/media/image55.png){width="2.9520833333333334in"
    height="1.7642814960629922in"}

![](media/Critical Path Analysis/media/image56.png){width="1.9497900262467192in"
height="0.9934809711286089in"}

![](media/Critical Path Analysis/media/image57.png){width="2.911111111111111in"
height="1.7418449256342956in"}

b.  

![](media/Critical Path Analysis/media/image58.png){width="2.0298556430446193in"
height="1.2771620734908136in"}

c.  Complete the activity chart for the network shown.

![](media/Critical Path Analysis/media/image59.png){width="2.9520833333333334in"
height="2.20625in"}![](media/Critical Path Analysis/media/image60.png){width="2.8333333333333335in"
height="2.0493055555555557in"}

\-

9, -

5, A

8, A

8

2, B

3, D

B,C

Foundation

1.  Complete each network diagram by inserting a dummy activity for each
    activity chart.

    a.  ![](media/Critical Path Analysis/media/image61.png){width="2.356521216097988in"
        height="1.1478258967629047in"}![](media/Critical Path Analysis/media/image62.png){width="2.935627734033246in"
        height="1.5638888888888889in"}

\-\-\-\-\-\--**⤍**\-\-\-\-\--

b.  ![](media/Critical Path Analysis/media/image62.png){width="2.935627734033246in"
    height="1.7916666666666667in"}

![](media/Critical Path Analysis/media/image61.png){width="3.2256944444444446in"
height="1.6347222222222222in"}

\-\-\-\-\-\-\-\-\-\-\--**⤍\-\-\--**\-\-\-\-\--

c.  ![](media/Critical Path Analysis/media/image61.png){width="2.6260870516185477in"
    height="1.6347222222222222in"}![](media/Critical Path Analysis/media/image62.png){width="2.9530194663167104in"
    height="1.7916666666666667in"}

\-\-\-\-\-\--**⤍**\-\-\-\--

\-\-\-\-\-\--**⤍**\-\-\-\--

![](media/Critical Path Analysis/media/image63.png){width="2.9704101049868767in"
height="2.076388888888889in"}

d.  ![](media/Critical Path Analysis/media/image64.png){width="2.729861111111111in"
    height="1.7041666666666666in"}

\-\-\-\-\-\-\-\-\-\--**⤍**\-\-\-\-\-\-\-\--

2.  Complete each activity chart for the network diagrams shown below.

    a.  ![](media/Critical Path Analysis/media/image65.png){width="3.077777777777778in"
        height="1.5472222222222223in"}![](media/Critical Path Analysis/media/image66.png){width="2.8690813648293965in"
        height="2.819002624671916in"}

Q

P

P

T

R

V \| S

S, T

X

W

V, X, Y

b.  ![](media/Critical Path Analysis/media/image65.png){width="2.4520833333333334in"
    height="1.8in"}![](media/Critical Path Analysis/media/image66.png){width="2.86875in"
    height="2.1659722222222224in"}

\-

9 \| -

5 \| A

8

2 \| B

3 \| D

B, C

![](media/Critical Path Analysis/media/image66.png){width="2.817361111111111in"
height="2.332638888888889in"}

c.  ![](media/Critical Path Analysis/media/image65.png){width="2.7645833333333334in"
    height="2.0104166666666665in"}

2 \| -

A

11 \| A

5 \| B

8 \| C

6 \| C

1 \| D, E, F

7 \| G

Development

3.  ![](media/Critical Path Analysis/media/image67.png){width="4.9930293088363955in"
    height="1.6626432633420822in"}![](media/Critical Path Analysis/media/image68.png){width="1.5389610673665792in"
    height="1.3166185476815397in"}Which is the correct network diagram
    for this activity table?

D

4.  ![](media/Critical Path Analysis/media/image69.png){width="4.756816491688539in"
    height="3.9297681539807523in"}Which activity table matches this
    activity chart?

![](media/Critical Path Analysis/media/image70.png){width="2.8181813210848645in"
height="1.100576334208224in"}

B

5.  ![](media/Critical Path Analysis/media/image71.png){width="4.770833333333333in"
    height="1.448611111111111in"}Draw an activity chart for the
    following activity table involving five tasks. Your activity chart
    should contain one dummy activity.

![](media/Critical Path Analysis/media/image72.png){width="1.7916666666666667in"
height="0.7854166666666667in"}

6.  ![](media/Critical Path Analysis/media/image73.png){width="4.770833333333333in"
    height="1.4458333333333333in"}Draw an activity chart for the
    following activity table involving five tasks. It will necessarily
    contain two dummy activities.

![](media/Critical Path Analysis/media/image74.png){width="1.725in"
height="1.3180555555555555in"}

7.  **HSC Sample Question Band 5**

A directed network for this project will require a dummy activity.

Sketch the network diagram, clearly identifying the dummy activity. 

![](media/Critical Path Analysis/media/image75.png){width="2.1465277777777776in"
height="2.89375in"}

![](media/Critical Path Analysis/media/image76.png){width="2.4453444881889763in"
height="0.8361504811898512in"}

# Forward and Backward Scans

## Earliest Start Time

- The **earliest starting time (EST)** of an activity is the minimum
  time needed to complete all prerequisite activities.

- The EST is the length of the ***longest*** path from the start vertex.

- An EST of 8 means an activity cannot start until 8 hours/mins after
  the project begins.

- An EST of 0 means there are no prerequisite activities; it can start
  immediately.

Foundation

1.  Consider the activity chart. The numbers represent minutes.

    a.  ![](media/Critical Path Analysis/media/image77.png){width="3.4611111111111112in"
        height="2.1243055555555554in"}Which activities can start
        immediately?

> A, B, C

b.  What is the earliest time that activity A can be finished and
    activity D can begin?

> 2 minutes

c.  What is the earliest time that activity B can be finished and
    activity E can begin?

> 5 minutes

d.  What is the earliest time that activity C can be finished and
    activity F can begin?

> 3 minutes

e.  What is the earliest time that activity D can be finished and
    activity G can begin?

12 minutes

f.  Activity H can start once **both** activity sequences B - E and C -
    F are finished.\
    What is the earliest time that activity H can start?

> 13 minutes

2.  ![](media/Critical Path Analysis/media/image78.png){width="4.340277777777778in"
    height="1.1524146981627297in"}Consider the activity chart. The
    numbers represent minutes.

    a.  Which activities have an EST of zero?

A, C

b.  What is the earliest time that activity A can be finished and
    activity B can begin?

10 minutes

c.  What is the earliest time that activity B can be finished and
    activity E can begin?

25 minutes

d.  Activity D can start once both activities C and B are complete.\
    What is the earliest time activity D can start?

25 minutes

## Forward Scan

- A **forward scan** is an algorithm that finds the earliest starting
  time of each activity.

1.  Draw a rectangle split into two squares at each vertex.

2.  Place a zero in the left box at the start vertex.

3.  Moving from left to right, add each activity\'s duration to the EST
    and write it in the vertex before the activity edge.

4.  When multiple paths exist, choose the one giving the larger EST.

5.  The number in the finish vertex shows the minimum completion time of
    the project.

### ![](media/Critical Path Analysis/media/image79.png){width="3.1326388888888888in" height="1.1805555555555556in"}**Example** Perform a forward scan.

+----------------------------------------------------------------------------------------------------------------+
| ![](media/Critical Path Analysis/media/image80.png){width="3.1493055555555554in"                               |
| height="1.163888888888889in"}**Step 1 Step 5**                                                                 |
|                                                                                                                |
| ![](media/Critical Path Analysis/media/image81.png){width="3.1326388888888888in"                               |
| height="1.1479166666666667in"}                                                                                 |
|                                                                                                                |
| ![](media/Critical Path Analysis/media/image82.png){width="3.1493055555555554in"                               |
| height="1.1840277777777777in"}**Step 2 Step 6**                                                                |
|                                                                                                                |
| ![](media/Critical Path Analysis/media/image83.png){width="3.1326388888888888in"                               |
| height="1.1478718285214349in"}                                                                                 |
|                                                                                                                |
| **Step 3 Step 7**                                                                                              |
|                                                                                                                |
| ![](media/Critical Path Analysis/media/image84.png){width="3.0791666666666666in"                               |
| height="1.1287259405074366in"}![](media/Critical Path Analysis/media/image85.png){width="3.1493055555555554in" |
| height="1.1625in"}                                                                                             |
|                                                                                                                |
| ![](media/Critical Path Analysis/media/image86.png){width="3.084722222222222in"                                |
| height="1.1416666666666666in"}**Step 4 Step 8**                                                                |
|                                                                                                                |
| Why is the EST important?                                                                                      |
|                                                                                                                |
| *The EST is the ............... you can start an activity.*                                                    |
|                                                                                                                |
| What is the minimum completion time?                                                                           |
|                                                                                                                |
| *The EST at the ............ vertex.*                                                                          |
|                                                                                                                |
| In Step 5, why did we write 9?                                                                                 |
|                                                                                                                |
| *In forward scans, we always take the path that will give the ............... EST.*                            |
|                                                                                                                |
| In Step 6, why did we write 12?                                                                                |
|                                                                                                                |
| *In forward scans, we always take the path that will give the ............... EST.*                            |
+================================================================================================================+

Complete a forward scan of these networks and determine the earliest
completion time.

a.  ![](media/Critical Path Analysis/media/image87.png){width="3.6875in"
    height="1.3891458880139982in"}

15

b.  

![](media/Critical Path Analysis/media/image88.png){width="3.988439413823272in"
height="1.153639545056868in"}

6

c.  ![](media/Critical Path Analysis/media/image89.png){width="3.934095581802275in"
    height="2.1215704286964128in"}

20

d.  ![](media/Critical Path Analysis/media/image90.png){width="3.79913823272091in"
    height="1.1561406386701663in"}

16

Look at the example on the next page and perform a backward scan for the
networks above.

## Backward Scans

- The latest starting time (LST) is the latest an activity can start
  without delaying the project.

- Backward scans find the LST of each activity.

1.  At the finish vertex, copy the earliest completion time to the right
    box.

2.  Subtract the activity time from the earliest completion time and
    place the result in the vertex left of the activity edge.

3.  Moving right to left, subtract each activity\'s duration from the
    LST and write it in the vertex before the activity edge.
    $LST = LST\ of\ successor - duration\ of\ activity$

4.  With multiple paths, choose the one giving the lower LST.

5.  The number in the start vertex should be zero.

### **Example** Perform a backward scan.

+---------------------------------------------------------------------------------------------------------------+
| ![](media/Critical Path Analysis/media/image91.png){width="3.1473447069116363in"                              |
| height="1.1583333333333334in"}![](media/Critical Path Analysis/media/image92.png){width="3.1125in"            |
| height="1.1583333333333334in"}**Step 1 Step 5**                                                               |
|                                                                                                               |
| **Step 2 Step 6**                                                                                             |
|                                                                                                               |
| ![](media/Critical Path Analysis/media/image93.png){width="3.13125in"                                         |
| height="1.1409722222222223in"}![](media/Critical Path Analysis/media/image94.png){width="3.11875in"           |
| height="1.1402777777777777in"}![](media/Critical Path Analysis/media/image95.png){width="3.136111111111111in" |
| height="1.1444444444444444in"}                                                                                |
|                                                                                                               |
| **Step 3 Step 7**                                                                                             |
|                                                                                                               |
| ![](media/Critical Path Analysis/media/image96.png){width="3.1368055555555556in"                              |
| height="1.1444444444444444in"}                                                                                |
|                                                                                                               |
| **Step 4 Step 8**                                                                                             |
|                                                                                                               |
| ![](media/Critical Path Analysis/media/image97.png){width="3.11875in"                                         |
| height="1.1328390201224847in"}![](media/Critical Path Analysis/media/image98.png){width="3.112505468066492in" |
| height="1.1388888888888888in"}                                                                                |
|                                                                                                               |
| Why is LST important? *It is the ............... you can start an activity without delaying a project.*       |
|                                                                                                               |
| In Step 5, why is the LST not the same as the EST? What do you think this means?                              |
|                                                                                                               |
| *It's different, meaning we have "f..............." time.*                                                    |
|                                                                                                               |
| How would you know for sure that you've made a mistake? *If the start vertex is not .........*                |
+===============================================================================================================+

Foundation

1.  Complete a forward and backward scan for these graphs.\
    The minimum completion time is given.

    a.  Minimum completion time: 17

![](media/Critical Path Analysis/media/image99.png){width="4.279079177602799in"
height="1.5078937007874016in"}

b.  Minimum completion time: 15

![](media/Critical Path Analysis/media/image100.png){width="4.30496719160105in"
height="1.5710323709536307in"}

c.  Minimum completion time: 25

![](media/Critical Path Analysis/media/image100.png){width="5.83951334208224in"
height="1.5750284339457568in"}

d.  Minimum completion time: 18

![](media/Critical Path Analysis/media/image101.png){width="3.495651793525809in"
height="2.16580927384077in"}

2.  Complete a forward and backward scan and state the minimum
    completion time.

+---------------------------------+--------------------------------------------------------------------------------------------------------------------+
| a.                              | b.  ![](media/Critical Path Analysis/media/image102.png){width="2.991132983377078in"                               |
|                                 |     height="1.237409230096238in"}![](media/Critical Path Analysis/media/image102.png){width="2.9916305774278213in" |
| 8                               |     height="1.2378947944007in"}                                                                                    |
|                                 |                                                                                                                    |
|                                 | 11                                                                                                                 |
+=================================+====================================================================================================================+

c.  ![](media/Critical Path Analysis/media/image102.png){width="3.0054166666666666in"
    height="1.2435990813648294in"}

20

4.  The activity chart shows six short activities that each take one
    hour to complete, and one long activity (B) which takes 100 hours.

![](media/Critical Path Analysis/media/image103.png){width="3.7565212160979877in"
height="2.3366535433070865in"}

a.  Which activities depend upon activity B?

F and G

b.  All the activities are done by different people. Assume that each
    person finishes their activity in the shortest possible time. How
    soon can activity F start?

After 100 hours

c.  The person assigned to activity B offers to complete the activity in
    half the allocated time, for an additional fee. How soon could the
    whole project be finished if you take up this offer?

50 hours earlier

d.  Task A is more complicated than initially expected and will actually
    take 20 hours.\
    Will this affect the minimum completion time of the project?

No, since everyone must wait for activity B to finish anyway, which
takes 50 hours.

Development

5.  Write down the value of each pronumeral in the sections of network
    diagrams below.

+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------+
| a.  ![](media/Critical Path Analysis/media/image104.png){width="2.1722484689413823in" | b.  ![](media/Critical Path Analysis/media/image104.png){width="2.1722484689413823in" |
|     height="0.5430621172353456in"}                                                    |     height="0.5430621172353456in"}                                                    |
|                                                                                       |                                                                                       |
| 12                                                                                    | 10                                                                                    |
+=======================================================================================+=======================================================================================+
| c.  ![](media/Critical Path Analysis/media/image104.png){width="2.1722484689413823in" | d.  ![](media/Critical Path Analysis/media/image104.png){width="1.8913101487314086in" |
|     height="0.5430621172353456in"}                                                    |     height="1.1549978127734033in"}                                                    |
|                                                                                       |                                                                                       |
| $$m = 8,n = 8$$                                                                       | $$q = 8,\ r = 3,\ p = 5,\ n = 9$$                                                     |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------+
| e.  ![](media/Critical Path Analysis/media/image104.png){width="2.1638888888888888in" | f.  ![](media/Critical Path Analysis/media/image104.png){width="2.165022965879265in"  |
|     height="1.4281660104986877in"}                                                    |     height="1.6815015310586177in"}                                                    |
|                                                                                       |                                                                                       |
| $$f = 9,g = 12$$                                                                      | $$a = 10,\ b = 18,\ c = 11$$                                                          |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------+

6.  Perform a forward scan and backward scan and check the minimum
    completion time is correct.

    a.  Minimum completion time: 35

![](media/Critical Path Analysis/media/image105.png){width="3.9739129483814524in"
height="2.0020363079615047in"}

b.  Minimum completion time: 30

![](media/Critical Path Analysis/media/image106.png){width="4.043475503062117in"
height="2.007582020997375in"}

c.  Minimum completion time: 10

![](media/Critical Path Analysis/media/image107.png){width="4.070500874890639in"
height="2.0030774278215224in"}

d.  Minimum completion time: 35

![](media/Critical Path Analysis/media/image108.png){width="3.931514654418198in"
height="1.7675732720909887in"}

e.  Minimum completion time: 28

![](media/Critical Path Analysis/media/image108.png){width="4.973912948381452in"
height="1.5874048556430447in"}

Mastery

3.  **HSC Sample Question Band 4**

Murray is building a new garage. The project involves activities A to L.

The network diagram shows these activities and their completion times in
days.

![](media/Critical Path Analysis/media/image109.png){width="5.382608267716535in"
height="2.5903346456692913in"}

Which TWO activities immediately precede activity G?

C and D

> By completing the diagram shown, calculate the minimum time required
> to build the new garage.

30 days

4.  **HSC Sample Question Band 5**

Bianca is designing a project for producing an advertising brochure. It
involves activities *A-M*.

The network below shows these activities and their completion time in
hours.

![](media/Critical Path Analysis/media/image110.png){width="5.382609361329834in"
height="1.8704833770778653in"}

What is the earliest starting time of activity J?

11 hours

What is the latest starting time of activity H?

12 hours

What is the minimum time required to produce the brochure?

34 hours

5.  **2019 HSC Standard 2 Band 5**

> ![](media/Critical Path Analysis/media/image111.png){width="3.348611111111111in"
> height="2.251388888888889in"}A project requires activities A to F to
> be completed. The activity chart shows the immediate prerequisite(s)
> and duration for each activity.
>
> By drawing a network diagram, determine the minimum time for the
> project to be completed.

15 hours

6.  **2021 VCE Band 5**

The directed graph below shows the sequence of activities required to
complete a project.

The time taken to complete each activity, in hours, is also shown.

![](media/Critical Path Analysis/media/image112.png){width="6.105555555555555in"
height="1.9805555555555556in"}

> The minimum completion time for this project is 18 hours. The time
> taken to complete activity E is labelled $x$. What is the maximum
> value of $x$?

$x$ cannot be larger than 3.

# Critical Path Analysis

## Float TIme

- The boxes at vertices show the EST and LST of the activity beginning
  at that vertex.

- **Float time** is how long a task can be delayed without delaying
  subsequent tasks.

$$Float\ Time = {LST}_{next\ activity} - Activity\ duration - \ {EST}_{current\ activity}$$

![](media/Critical Path Analysis/media/image113.png){width="3.0751443569553807in"
height="0.7913976377952756in"}

Float time of A $\  = \ x - n - y$

- **Note**: The simpler formula is $LST - EST$, but cannot always be
  used due to how the HSC sets out forward and backward scanning (boxes
  at the vertices).

### **Example** Calculate Float Time.

+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------+
| a.  ![](media/Critical Path Analysis/media/image114.png){width="2.3489009186351706in" | b.  ![](media/Critical Path Analysis/media/image115.png){width="2.348611111111111in"  |
|     height="0.625in"}                                                                 |     height="0.6083333333333333in"}                                                    |
|                                                                                       |                                                                                       |
| 1                                                                                     | 5                                                                                     |
+=======================================================================================+=======================================================================================+
| c.  ![](media/Critical Path Analysis/media/image116.png){width="2.4703729221347333in" | d.  ![](media/Critical Path Analysis/media/image117.png){width="1.4236111111111112in" |
|     height="0.9444444444444444in"}                                                    |     height="1.3873873578302711in"}                                                    |
|                                                                                       |                                                                                       |
| 2                                                                                     | 3                                                                                     |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------+

## Finding the Critical Path

- An activity with zero **float time** is a **critical activity**.

- **Delaying a critical activity will delay the entire project.**

- Finishing a critical activity earlier ***may*** reduce the project\'s
  minimum completion time.

- The critical path is the sequence of critical activities from start to
  finish.

### **Example** Determine the float time of an activity.

+----------------------------------------------------------------------------------+
| ![](media/Critical Path Analysis/media/image118.png){width="5.157946194225722in" |
| height="1.9025010936132984in"}                                                   |
|                                                                                  |
| Write the float time of each activity.                                           |
|                                                                                  |
| +--------------------------------+--------------------------------+              |
| | A: $8 - 8 - 0 = 0$             | E: $12 - 3 - 9 = 0$            |              |
| |                                |                                |              |
| | B: $9 - 6 - 0 = 3$             | F: $12 - 1 - 9 = 2$            |              |
| |                                |                                |              |
| | C: $9 - 1 - 8 = 0$             | G: $14 - 2 - 12 = 0$           |              |
| |                                |                                |              |
| | D: $11 - 2 - 6 = 3$            | H: $15 - 1 - 14 = 0$           |              |
| +================================+================================+              |
|                                                                                  |
| The critical path is A C E G H                                                   |
+==================================================================================+

Determine the float time of these activities and determine the critical
path.

![A picture containing diagram, line, text, plot Description
automatically
generated](media/Critical Path Analysis/media/image119.png){width="4.3625in"
height="1.5597222222222222in"}

+--------------------------------------------------+--------------------------------------------------+
| A:                                               | D:                                               |
| ................................................ | ................................................ |
|                                                  |                                                  |
| B:                                               | E:                                               |
| ................................................ | ................................................ |
|                                                  |                                                  |
| C:                                               | F:                                               |
| ................................................ | ................................................ |
+==================================================+==================================================+

The critical path is:

B-D-E-F

Foundation

1.  Determine the float time of each activity in the network shown and
    determine the critical path.

+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
| a.  ![](media/Critical Path Analysis/media/image120.png){width="3.2949518810148732in" | b.  ![](media/Critical Path Analysis/media/image120.png){width="2.9895024059492563in"                   |
|     height="1.2022998687664042in"}                                                    |     height="1.2022998687664042in"}                                                                      |
|                                                                                       |                                                                                                         |
| A: ..................... D: .....................                                     | A: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| 0 0                                                                                   | B: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| B: ..................... E: .....................                                     | C: 1                                                                                                    |
|                                                                                       |                                                                                                         |
| 0 0                                                                                   | D: 1                                                                                                    |
|                                                                                       |                                                                                                         |
| C: .....................                                                              | E: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| 10                                                                                    | F: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| Critical path: .......................................                                | G: 1                                                                                                    |
|                                                                                       |                                                                                                         |
| A-B-D-E                                                                               | H: 0                                                                                                    |
|                                                                                       |                                                                                                         |
|                                                                                       | A-B-E-F-H                                                                                               |
+=======================================================================================+=========================================================================================================+
| c.                                                                                    | d.  ![](media/Critical Path Analysis/media/image120.png){width="3.486111111111111in"                    |
|                                                                                       |     height="1.63125in"}![](media/Critical Path Analysis/media/image120.png){width="3.140277777777778in" |
| A: 0                                                                                  |     height="1.8194444444444444in"}                                                                      |
|                                                                                       |                                                                                                         |
| B: 13                                                                                 | A: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| C: 5                                                                                  | B: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| D: 14                                                                                 | C: 32                                                                                                   |
|                                                                                       |                                                                                                         |
| E: 5                                                                                  | D: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| F: 0                                                                                  | F: 32                                                                                                   |
|                                                                                       |                                                                                                         |
| G: 5                                                                                  | G: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| A-F                                                                                   | A-B-D-G                                                                                                 |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
| e.  ![](media/Critical Path Analysis/media/image121.png){width="3.442361111111111in"  | f.  ![](media/Critical Path Analysis/media/image122.png){width="3.355676946631671in"                    |
|     height="1.2027777777777777in"}                                                    |     height="2.035416666666667in"}                                                                       |
|                                                                                       |                                                                                                         |
| A: 1                                                                                  | A: 1                                                                                                    |
|                                                                                       |                                                                                                         |
| B: 1                                                                                  | B: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| C: 15                                                                                 | C: 14                                                                                                   |
|                                                                                       |                                                                                                         |
| D: 0                                                                                  | D: 1                                                                                                    |
|                                                                                       |                                                                                                         |
| E: 0                                                                                  | E: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| F: 0                                                                                  | F: 0                                                                                                    |
|                                                                                       |                                                                                                         |
| D-E-F                                                                                 | G: 1                                                                                                    |
|                                                                                       |                                                                                                         |
|                                                                                       | H: 0                                                                                                    |
|                                                                                       |                                                                                                         |
|                                                                                       | I: 1                                                                                                    |
|                                                                                       |                                                                                                         |
|                                                                                       | J: 0                                                                                                    |
|                                                                                       |                                                                                                         |
|                                                                                       | B-E-F-H-J                                                                                               |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+

Development

2.  **2020 HSC Standard 2 Band 5**

> The preparation of a meal requires the completion of all
> activities A to J.\
> The network diagram shows the activities and their completion times in
> minutes.

![](media/Critical Path Analysis/media/image123.png){width="5.358490813648294in"
height="1.6949376640419946in"}

What is the minimum time needed to prepare the meal?

46 minutes

List the activities which make up the critical path for this network.

C -- D -- E -- F -- H -- I

Complete the table below, showing the earliest start time and float time
for activities A and G 

  ----------------------------------------------
   **Activity**  **Earliest      **Float Time**
                 Start Time**    
  -------------- --------------- ---------------
        A        0               12

        G        20              15
  ----------------------------------------------

3.  **HSC Sample Question Band 5**

> The directed network below shows the sequence of
> activities, $A$ to $S$, that is required to complete a manufacturing
> process.

The time taken to complete each activity, in hours, is also shown.

![](media/Critical Path Analysis/media/image124.png){width="6.857638888888889in"
height="1.9791666666666667in"}

Determine the critical path of this network.

A -- B -- E -- J -- K -- O -- Q -- S

Identify the activities that have a float time of 10 hours. 

G, I, N

# Crashing

- **Crashing** an activity network involves shortening the overall
  project duration by reducing the time spent on critical activities,
  typically by adding resources and increasing costs.

+--------------------------------------------------+
| **Key Principles of Crashing**                   |
+==================================================+
| - The critical path is the longest path from     |
|   start to finish.                               |
|                                                  |
| - Shortening an activity only reduces project    |
|   duration if it\'s on the critical path.        |
|                                                  |
| - Crashing may create a new critical path; the   |
|   original activity may no longer be a critical  |
|   activity.                                      |
|                                                  |
| - To avoid excessive shortening, aim for         |
|   multiple equal-length critical paths.          |
+--------------------------------------------------+

### **Investigation** Crashing.

+-----------------------------------------------------------------------------------------------------------------------------+
| ![](media/Critical Path Analysis/media/image125.png){width="2.9590693350831145in" height="1.1417913385826772in"}Consider    |
| the simple network below.                                                                                                   |
|                                                                                                                             |
| What is the minimum completion time? ............                                                                           |
|                                                                                                                             |
| What is the critical path? ..................                                                                               |
|                                                                                                                             |
| Explain why reducing the time taken for activity B will not affect the minimum completion time.                             |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| If we reduce activity A by 1 hour, the new minimum completion time is .........                                             |
|                                                                                                                             |
| If we reduce activity A by 2 hours, the new minimum completion time is .........                                            |
|                                                                                                                             |
| If we reduce activity A by 3 hours, the new minimum completion time is .........                                            |
|                                                                                                                             |
| Explain why reducing activity A by 3 hours does not shorten the completion time by 3 hours.                                 |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| The maximum you can shorten activity A is ........., since we still need to wait for activity B.                            |
+=============================================================================================================================+

### **Investigation** Crashing.

+--------------------------------------------------------------------------------------------------------+
| An activity network is shown below. The forward and backwards scans have been completed.\              |
| The critical path D -- E is shown in red. All units are in days.                                       |
|                                                                                                        |
| ![](media/Critical Path Analysis/media/image126.png){width="3.6319444444444446in"                      |
| height="1.8666666666666667in"}                                                                         |
|                                                                                                        |
| The minimum completion time is currently: ............                                                 |
|                                                                                                        |
| Reducing the time taken in A, B, or C would *not* reduce the minimum completion time because           |
| .........................................................                                              |
|                                                                                                        |
| Therefore, we must shorten activities ...... and ......, as they are on the ...............            |
| ............                                                                                           |
|                                                                                                        |
| If we reduce activity D by 2 hours, the minimum completion time would become: ............             |
|                                                                                                        |
| If we reduce activity D and E by 1.5 hours each, the minimum completion time would become              |
| ...............                                                                                        |
|                                                                                                        |
| If we reduce activity D and E to 0 hours, we will NOT reduce total completion time by 13 hours because |
| ...................................................................................................... |
|                                                                                                        |
| The maximum we can shorten activities D and E is a total of ............... hours, since beyond that,  |
| activities ..................... would become the new critical path.                                   |
+========================================================================================================+

Foundation

1.  Describe what the critical path represents.

Activities that must be completed on time to not delay the project; the
longest path.

2.  ![](media/Critical Path Analysis/media/image127.png){width="4.884244313210849in"
    height="1.3521073928258969in"}The network diagram below shows the
    time (in days) for all activities.

    a.  What is the minimum completion time?

14 days

b.  Show that the critical path is A B D E. Reducing the time taken in
    which activity **would not** result in a reduction in the minimum
    completion time?

C, as it is not on the critical path.

c.  Activity A was reduced in time to 3 days.\
    Do a new forward scan to find the updated minimum completion time.

![](media/Critical Path Analysis/media/image128.png){width="4.927777777777778in"
height="1.4201388888888888in"}

12 days

d.  In part **c**, we reduced activity time by 2 days.\
    Did it also lead to a 2-day reduction in minimum completion time?

yes

e.  ![](media/Critical Path Analysis/media/image129.png){width="4.92799978127734in"
    height="1.5132841207349081in"}Activity B and E are both reduced in
    time to 1 day.\
    Do a new forward scan to find the updated minimum completion time.

9 days

f.  Explain why in part **e**, reducing activity time by a total of 6
    days did not lead to the minimum completion time reducing by 6 days.

You still need to wait for activity C to finish; activities B and E are
no longer on the critical path.

3.  Consider activity network below. The time units represent minutes.

![](media/Critical Path Analysis/media/image130.png){width="4.270833333333333in"
height="1.6843788276465441in"}

a.  Perform a forward scan, backward scan, calculate the float times and
    identify the critical path.

Critical path is B -- C

b.  The project manager can reduce the time taken for activity B by 100
    minutes to zero.\
    By how much would the minimum completion time reduce?

90 minutes

c.  Explain why the minimum completion time does not reduce by 100
    hours.

The new critical path becomes A -- C after a certain point,\
as B is no longer on the critical path, reducing time taken for B does
not further reduce minimum completion time.

4.  The network diagram below shows the time (in weeks) for all
    activities, EST and LST.

![](media/Critical Path Analysis/media/image131.png){width="3.4743055555555555in"
height="1.5097222222222222in"}

a.  What is the minimum completion time?

17 weeks

b.  The critical path is D E F. Reducing the time taken in which
    activities **would not** result in a reduction in the minimum
    completion time?

A, B, C as they aren't on the critical path.

c.  Activity E was reduced in time to 1 week. Do a new forward scan to
    find the updated minimum completion time.

13 weeks

5.  The network diagram below shows the time (in hours) for all
    activities, EST and LST.

![](media/Critical Path Analysis/media/image132.png){width="3.795138888888889in"
height="1.45625in"}

a.  What is the minimum completion time?

14 hours

b.  The critical path is A C E G. Reducing the time taken in which
    activities **would** result in a reduction in the minimum completion
    time?

A C E or G, as they are on the critical path.

c.  Activities A and E were reduced in time by 2 minutes.\
    Do a new forward scan to show that the new minimum completion time
    is 11 minutes.

<!-- -->

6.  **HSC Sample Question Band 5**

The directed graph below shows the sequence of activities required to
complete a project.

All times are in hours.

![](media/Critical Path Analysis/media/image133.png){width="6.029850174978128in"
height="2.275847550306212in"}

Find the number of activities that have exactly two immediate
predecessors.

I and J

Identify the critical path for this project.

B -- E -- I -- L

If Activity E is reduced by one hour, identify the two new critical
paths.

The critical path reduces to 19 hours.\
Other paths of 19 hours include A -- D -- I -- L and C- H -- K -- L

7.  **2021 HSC Standard 2 Band 5**

A project requires completion of 11 tasks  

> A network diagram for the project giving the completion time for each
> task, in minutes, is shown.

![](media/Critical Path Analysis/media/image134.png){width="5.545138888888889in"
height="2.1944444444444446in"}

Find the minimum time to complete the project.

40 minutes

State the critical path for this project.

A C D E G J K

> A new task, X, is to be added to the project. The earliest starting
> time for X is 17 minutes, the latest starting time for X is 18 minutes
> and X has a completion time of 12 minutes.

Add task X to the given network diagram above AND state the float time
for this task.

Task X has an EST of 17, so it should connect from the vertex where G
and H starts

The LST of X is 18 and has a completion time of 12, so 18 + 12 = 30, it
should connect to the vertex where K starts.

The float time is 1 minute.

8.  **2019 HSC Standard 2 Band 6**

Fencedale High School is planning to renovate its gymnasium.

This project involves 12 activities, A to L.

The directed network below shows these activities and their completion
times, in weeks.

![](media/Critical Path Analysis/media/image135.png){width="6.817361111111111in"
height="1.0854166666666667in"}

The minimum completion time for the project is 35 weeks.

Identify the critical path and state how many activities are on it.

A -- B -- D -- F -- G -- I -- K -- L, 8 activities

Determine the latest start time of activity E.

12 weeks

Which activity has the longest float time?

J, with 5 weeks float time

> It is possible to reduce the completion time for activities C, D, G,
> H and K by employing more workers. The completion time for each of
> these five activities can be reduced by a maximum of two weeks.
>
> Show that the new minimum completion time will be 29 weeks.

By redoing a forward scan, the minimum time is 29 weeks with critical
path A -- B -- D -- F -- G -- I -- K -- L

Mastery

9.  The network diagram for a project is shown in the diagram below.\
    The duration for each activity is in hours.

![A diagram of a triangle with arrows and letters AI-generated content
may be
incorrect.](media/Critical Path Analysis/media/image136.png){width="4.943242563429571in"
height="1.8241174540682414in"}

a.  Complete a forward and backward scan to find the earliest start
    times and latest start times for all activities.

b.  Identify the critical path for this project.

A - C - E - H -- J

c.  How much time overall is saved if activity F is reduced in duration
    by 2 hours?\
    Justify your answer.

Activity F is not on the critical path, so reducing its duration will
not affect the minimum completion time of the project.\
0 hours saved.

d.  If only one activity can have its duration reduced, what is the
    maximum possible reduction in completion time of the project?

The greatest float time is at activity B at 4 hours because it needs to
wait for activity A.\
4 hours, by reducing activity A to 0.

10. The network diagram shows the time (in hours) for all activities,
    EST and LST.

![A diagram of a hexagon with numbers and lines AI-generated content may
be
incorrect.](media/Critical Path Analysis/media/image137.png){width="4.595138888888889in"
height="2.3604166666666666in"}

a.  What is the minimum completion time for the project?

22 hours

b.  Determine the float times for every activity in this project.

A:4 B:0 C:2 D:4 E:0 F:2 G:2 H:0 I:6 J:0

c.  Identify the critical path for this project.

B E H J

d.  What is the maximum number of hours that the completion time for
    activity E can be reduced without changing the critical path of the
    project?

E is an immediate predecessor for H. Consider the paths leading to
activity H.

A -- H can be finished in 7 hours. C -- F -- G can be finished in 9
hours. B -- E can be finished in 11 hours.

So, we can reduce activity E by max 2 hours, if we reduce by more than 2
hours, the critical path would switch to C -- F -- G.

e.  What is the maximum number of hours that the completion time for
    activity H can be reduced without affecting the critical path of the
    project?

H is an immediate predecessor for J. Consider the paths leading to
activity J.\
Activity H can be finished at earliest 11 + 8 = 19 hours. Activity I can
be finished at earliest 6 + 7 = 13 hours.\
So, we can reduce activity H by max 6 hours, if we reduce by more than 6
hours, the critical path would change so that activity I is on the path.

f.  If activity B is reduced from 6 hours to 4 hours, what is the
    minimum completion time for the project?

By performing another forward scan, 20 hours.

11. The network diagram for a project is shown in the diagram below. The
    duration is in hours.

![](media/Critical Path Analysis/media/image138.png){width="4.588700787401574in"
height="1.381502624671916in"}

a.  Identify the shortest time in which this project can be completed.

15 hours

b.  Identify the critical path.

B C E F

c.  The time it takes to complete activity A can be reduced by one
    hour.\
    Explain why this will not affect the completion time of this
    project.

A is not on the critical path.

d.  Activity B can be reduced in time at a cost of \$100 per hour.
    Activity E can be reduced in time at a cost of \$50 per hour. What
    is the cost of reducing the completion time of this project as much
    as possible?

Activity A has float time 1 hour. Therefore, we should reduce activity B
by 1 hour.\
Any more reduction is wasted as we would still need to wait for activity
A before starting the next activities.

Activity D has float time 2 hours. Therefore, we should reduce activity
E by 2 hours.\
Any more reduction is wasted as we would still need to wait for activity
D before starting the next activities.

\$200
