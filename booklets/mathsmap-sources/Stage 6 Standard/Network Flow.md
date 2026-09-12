  ----------------------

  ----------------------

Student Name

  -------------------------------------------------------------------
  Mathematics Standard Year 12
  -------------------------------------------------------------------
  **Network\
  Flow**

  -------------------------------------------------------------------

+--------+-----------------------------------+-------------------------+
| **Book | Network flow                      | Version: 250308         |
| 1**    |                                   |                         |
|        |                                   | Report mistakes &       |
|        |                                   | suggest improvements:\  |
|        |                                   | https://MrDingMaths.com |
+========+===================================+=========================+

+-------------------------------------------------------------------+
| # Contents {#contents .TOC-Heading}                               |
|                                                                   |
| [1 Subtopic [2](#_Toc127130822)](#_Toc127130822)                  |
+===================================================================+

# Overview

## Syllabus Content

**MST-12-S2-06** applies network flow concepts to solve problems and
model decision-making in practical contexts

- Define and use network flow terminology including *source*, *sink*,
  *outflow*, *inflow* and *cut*

- Convert information presented in a table to a weighted and directed
  network diagram

- Calculate and analyse the flow capacity of a network including the use
  of the saturated edges method

- Solve small-scale network flow problems including the use of applying
  the maximum-flow minimum-cut theorem

- Examine the impact of increasing or reducing the flow capacity of an
  edge in a network diagram

- Explain why the flow capacity of a network is or is not sufficient to
  meet demand in a variety of contexts

# Flow Networks

## Flow Network

- A flow network is a weighted directed graph with **source** **S**
  (start) and **sink T** (finish).

- A **flow diagram** shows objects moving through the network from
  source to sink.

- Edge weights show **capacity**, or maximum movement rate.

- The **flow capacity** is the total flow through the network.

## Maximum Flow

- ![](media/Network Flow/media/image5.png){width="2.0194444444444444in"
  height="0.7638888888888888in"}![](media/Network Flow/media/image6.png){width="2.2944444444444443in"
  height="0.7527777777777778in"}Consider the scenarios below, with two
  pipes transporting water. In both cases, the maximum flow is 25 L/min.

- An edge has ***two*** numbers associated with it:

  - The capacity, given by the question. (the size of the pipe)

  - The maximum flow, which you calculate. ($Inflow = Outflow$,
    whichever is lower.)

### **Example** Determining the maximum flow by saturating edges.

+------------------------------------------------------------------------------------------------------------------------------------------+
| Towns A and town Z are connected by roads. The capacity of each road is shown.\                                                          |
| Determine the maximum flow through the network.                                                                                          |
|                                                                                                                                          |
| +--------------------------------------------------------------------------+-----------------------------------------------------------+ |
| | a.  ![](media/Network Flow/media/image7.png){width="2.926525590551181in" | ......................................................... | |
| |     height="0.47546041119860016in"}                                      |                                                           | |
| |                                                                          |                                                           | |
| | ![](media/Network Flow/media/image7.png){width="3.0006944444444446in"    |                                                           | |
| | height="1.1395833333333334in"}                                           |                                                           | |
| +==========================================================================+===========================================================+ |
| | b.  ![](media/Network Flow/media/image7.png){width="2.885784120734908in" | ......................................................... | |
| |     height="0.4754615048118985in"}                                       |                                                           | |
| +--------------------------------------------------------------------------+-----------------------------------------------------------+ |
| | c.  ![](media/Network Flow/media/image7.png){width="2.885784120734908in" | ......................................................... | |
| |     height="0.4754615048118985in"}                                       |                                                           | |
| |                                                                          | ......................................................... | |
| +--------------------------------------------------------------------------+-----------------------------------------------------------+ |
| | d.  ![](media/Network Flow/media/image7.png){width="2.885784120734908in" | ......................................................... | |
| |     height="0.4754615048118985in"}                                       |                                                           | |
| |                                                                          | ......................................................... | |
| +--------------------------------------------------------------------------+-----------------------------------------------------------+ |
| | e.  ![](media/Network Flow/media/image7.png){width="2.885784120734908in" | ......................................................... | |
| |     height="0.4754615048118985in"}                                       |                                                           | |
| |                                                                          | ......................................................... | |
| +--------------------------------------------------------------------------+-----------------------------------------------------------+ |
| | f.  ![](media/Network Flow/media/image7.png){width="2.927386264216973in" | ......................................................... | |
| |     height="0.47546041119860016in"}                                      |                                                           | |
| |                                                                          | ......................................................... | |
| +--------------------------------------------------------------------------+-----------------------------------------------------------+ |
| | g.  ![](media/Network Flow/media/image7.png){width="3.060779746281715in" | ......................................................... | |
| |     height="1.0895975503062116in"}                                       |                                                           | |
| |                                                                          | ......................................................... | |
| +--------------------------------------------------------------------------+-----------------------------------------------------------+ |
+==========================================================================================================================================+

## Algorithm for Calculating Maximum Flow

1.  List all possible paths from source to sink, starting with an
    outermost path (top or bottom).

2.  For each path:

    a.  Find the maximum flow capacity by identifying the lowest edge
        weight.

    b.  Subtract this maximum flow from all edges along the path.\
        This gives each edge\'s new capacity.

3.  Add up the flow capacities of each path to find the overall maximum
    flow.

4.  The number remaining at each edge is the unused capacity.

### **Example** Determine maximum flow.

+------------------------------------------------------------------------------------------------------+
| ![](media/Network Flow/media/image8.png){width="2.9899136045494314in"                                |
| height="1.359730971128609in"}Determine the maximum flow of this network.                             |
|                                                                                                      |
| Step 1: S A C T, S A B T, S B T                                                                      |
|                                                                                                      |
| Step 2:                                                                                              |
|                                                                                                      |
|   -------------------------------------------------------------------------------------------------- |
|   **Path**     **Capacity**  **Adjusted Edges**                                                      |
|   ----------- -------------- ----------------------------------------------------------------------- |
|   S A C T           8        ![](media/Network Flow/media/image9.png){width="2.5156047681539806in"   |
|                              height="1.2365037182852143in"}                                          |
|                                                                                                      |
|   S A B T           2        ![](media/Network Flow/media/image10.png){width="2.546103455818023in"   |
|                              height="1.2363462379702537in"}                                          |
|                                                                                                      |
|   S B T             8        ![](media/Network Flow/media/image11.png){width="2.566666666666667in"   |
|                              height="1.2363462379702537in"}                                          |
|   -------------------------------------------------------------------------------------------------- |
|                                                                                                      |
| Step 3: Overall maximum flow $= 8 + 2 + 8 = 18$                                                      |
|                                                                                                      |
| Why is S A B T's capacity 2, not 4?                                                                  |
|                                                                                                      |
| *Capacity of edge SA has been reduced to ........., so the capacity of S A B T is 2, as the          |
| .................. edge weight is 2.*                                                                |
+======================================================================================================+

> **Tip**: the order you consider the paths does not matter, as long as
> you work your way through the network in a systematic way (top to
> bottom or left to right). Do not "jump around" randomly. The aim is to
> use up the capacities of each edge. Depending on the order you
> consider the paths, your adjusted edges will look different, but your
> answer should be the same.

Foundation

1.  By considering every path from the source (S) to sink (T), determine
    the maximum flow of these networks.

+----------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| a.  ![](media/Network Flow/media/image12.png){width="2.4972222222222222in" | b.  ![](media/Network Flow/media/image12.png){width="1.8833333333333333in" height="1.132638888888889in"} |
|     height="0.46805555555555556in"}                                        |                                                                                                          |
|                                                                            | 200                                                                                                      |
| 100                                                                        |                                                                                                          |
+============================================================================+==========================================================================================================+
| c.                                                                         | d.  ![](media/Network Flow/media/image13.png){width="2.688888888888889in" height="1.2472222222222222in"} |
|                                                                            |                                                                                                          |
| 10                                                                         | ![](media/Network Flow/media/image13.png){width="2.688888888888889in" height="1.2472222222222222in"}     |
|                                                                            |                                                                                                          |
|                                                                            | 13                                                                                                       |
+----------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| e.  ![](media/Network Flow/media/image13.png){width="2.688888888888889in"  | f.  ![](media/Network Flow/media/image13.png){width="2.688888888888889in" height="1.2472222222222222in"} |
|     height="1.2472222222222222in"}                                         |                                                                                                          |
|                                                                            | 19                                                                                                       |
| 14                                                                         |                                                                                                          |
+----------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| g.  ![](media/Network Flow/media/image13.png){width="2.688888888888889in"  | h.  ![](media/Network Flow/media/image13.png){width="2.688888888888889in" height="1.2472222222222222in"} |
|     height="1.2472222222222222in"}                                         |                                                                                                          |
|                                                                            | 18                                                                                                       |
| 15                                                                         |                                                                                                          |
+----------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| i.  ![](media/Network Flow/media/image14.png){width="2.8125in"             | j.  ![](media/Network Flow/media/image14.png){width="2.8131944444444446in" height="1.270138888888889in"} |
|     height="1.270138888888889in"}                                          |                                                                                                          |
|                                                                            | 18                                                                                                       |
| 10                                                                         |                                                                                                          |
+----------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| k.                                                                         | l.                                                                                                       |
|                                                                            |                                                                                                          |
| 57                                                                         | 17                                                                                                       |
+----------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+
| m.                                                                         | n.  ![](media/Network Flow/media/image14.png){width="2.8131944444444446in"                               |
|                                                                            |     height="1.6479166666666667in"}![](media/Network Flow/media/image14.png){width="2.8125in"             |
| 10                                                                         |     height="1.270138888888889in"}![](media/Network Flow/media/image14.png){width="2.8131944444444446in"  |
|                                                                            |     height="1.4652777777777777in"}![](media/Network Flow/media/image14.png){width="2.8131944444444446in" |
|                                                                            |     height="1.4652777777777777in"}                                                                       |
|                                                                            |                                                                                                          |
|                                                                            | 18                                                                                                       |
+----------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------+

2.  **HSC Sample Question Band 4**

> The network diagram below flows from the source (*S*) to sink (*T*).\
> Which of the edges is not at maximum capacity?

![](media/Network Flow/media/image15.png){width="3.4791666666666665in"
height="1.7524737532808399in"}![](media/Network Flow/media/image16.png){width="0.775in"
height="1.4145833333333333in"}

C

3.  **HSC Sample Question Band 4**

> A network diagram is drawn below. Calculate the maximum flow through
> this network.

![](media/Network Flow/media/image17.png){width="3.738888888888889in"
height="1.8972222222222221in"}

28

4.  The directed network shows the traffic capacity, in vehicles per
    hour, of roads in the centre of a city suburb, where the vertices
    represent intersections.\
    What is the maximum flow of this road network?

![](media/Network Flow/media/image18.png){width="3.195709755030621in"
height="2.263888888888889in"}

530 vehicles per hour.

5.  The directed network shows the flow of water from a dam at S to a
    town at T.\
    The edge capacities represent thousands of litres per minute.\
    What is the maximum flow of this pipe network?

![](media/Network Flow/media/image19.png){width="2.9930555555555554in"
height="2.5263024934383203in"}

110 000 L/min

# Maximum-Flow Minimum-Cut

## Cuts

- Another way to calculate maximum flow is using **cuts**.

- A **cut** is an imaginary line that completely separates the
  **source** from the **sink**.

+-----------------------------------------------------------------------+-----------------------------------------------------------------------+
| **Cut**                                                               | **Not a cut**                                                         |
+:=====================================================================:+:=====================================================================:+
| No paths from source to sink.                                         | Paths still exist between source to sink.                             |
|                                                                       |                                                                       |
| ![](media/Network Flow/media/image20.png){width="2.631688538932633in" | ![](media/Network Flow/media/image20.png){width="2.631688538932633in" |
| height="1.3385411198600174in"}                                        | height="1.3385411198600174in"}                                        |
+-----------------------------------------------------------------------+-----------------------------------------------------------------------+

- The cut capacity is the sum of all capacities of edges that the cut
  passes through.

- An edge\'s capacity is only counted if it flows from the source side
  to the sink side of the cut.

- ![](media/Network Flow/media/image21.png){width="2.4758552055993in"
  height="1.1578904199475066in"}In the diagram, edge BA is not part of
  the cut.

### **Example** Calculate cut capacity.

+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Calculate the capacity of these cuts.                                                                                                            |
|                                                                                                                                                  |
| +-----------------------------------------------------------------+----------------------------------------------------------------------------+ |
| | a.  ![](media/Network Flow/media/image22.png){width="1.84375in" | b.  ![](media/Network Flow/media/image22.png){width="2.3069444444444445in" | |
| |     height="1.3721620734908135in"}                              |     height="1.3715277777777777in"}                                         | |
| |                                                                 |                                                                            | |
| | $7 + 1 + 6 = 14$                                                | $100 + 190 = 290$                                                          | |
| +=================================================================+============================================================================+ |
|                                                                                                                                                  |
| How do we know that these are cuts?                                                                                                              |
|                                                                                                                                                  |
| *They separate ............... from ...............*                                                                                             |
|                                                                                                                                                  |
| In the second example, why don't we count 90 as part of the cut?                                                                                 |
|                                                                                                                                                  |
| *The 90 flows from ............... to .................., so we do not count it.*                                                                |
+==================================================================================================================================================+

Determine the capacity of these cuts.

![](media/Network Flow/media/image23.png){width="2.7291666666666665in"
height="1.4782994313210849in"}

> $C_{1} =$ ...........................

14

> $C_{2} =$ ...........................

21

> $C_{3} =$ ...........................

12

## Maximum-Flow Minimum-Cut Theorem

- The minimum cut will give the maximum flow, since the minimum cut only
  contains the network\'s bottlenecks.

- Use trial and error to find the minimum cut.

- The disadvantage of this method is that you cannot know for certain
  you\'ve found the minimum cut until you try every possible cut.

### **Example** Determine the maximum flow of a network using the minimum cut.

+-----------------------------------------------------------------------+
| ![](media/Network Flow/media/image24.png){width="3.553124453193351in" |
| height="1.747516404199475in"}Determine the maximum flow of this       |
| network.                                                              |
|                                                                       |
| The minimum cut has capacity 800.                                     |
|                                                                       |
| So, the maximum flow is 800.                                          |
|                                                                       |
| Use trial and error to find this cut on the diagram.                  |
|                                                                       |
| (**Hint**: the minimum cut in this network does not include the edges |
| with the smallest edge capacities.)                                   |
+=======================================================================+

The maximum flow in these networks is given. Find the minimum cut.

+-----------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------+
| a.  7                                                                 | b.  8                                                                                               |
|                                                                       |                                                                                                     |
| ![](media/Network Flow/media/image25.png){width="2.764314304461942in" | ![](media/Network Flow/media/image26.png){width="2.9295406824146983in"                              |
| height="1.2692311898512685in"}                                        | height="1.6169499125109361in"}                                                                      |
+=======================================================================+=====================================================================================================+
| c.  18                                                                | d.  11                                                                                              |
|                                                                       |                                                                                                     |
|                                                                       | ![](media/Network Flow/media/image27.png){width="2.763888888888889in"                               |
|                                                                       | height="1.1583333333333334in"}![](media/Network Flow/media/image28.png){width="2.763888888888889in" |
|                                                                       | height="1.1756944444444444in"}                                                                      |
+-----------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------+

**Tips for finding the minimum cut:**

- First calculate the outflow capacity of the source and the inflow
  capacity of the sink. The maximum flow cannot exceed these values.

- Work on edges with smaller values first. But remember that the minimum
  cut does not necessarily include the smallest edge.

Foundation

1.  Find the capacity of each cut. The source is S and the sink is T.

+----------------------------------------------------------------------------+---------------------------------------------------------------------------+
| a.  ![](media/Network Flow/media/image29.png){width="2.223543307086614in"  | b.  ![](media/Network Flow/media/image29.png){width="2.223543307086614in" |
|     height="1.1983442694663167in"}                                         |     height="1.1983442694663167in"}                                        |
|                                                                            |                                                                           |
| ............................................................               | ............................................................              |
|                                                                            |                                                                           |
| ............................................................               | ............................................................              |
|                                                                            |                                                                           |
| ............................................................               | ............................................................              |
|                                                                            |                                                                           |
| C1: 13, C2: 15, C3: 20, C4: 11                                             | C1: 6, C2: 12, C3: 8,C4: 11, C5: 10                                       |
+============================================================================+===========================================================================+
| c.  ![](media/Network Flow/media/image29.png){width="2.6444444444444444in" | d.  Explain why cut 2 in part **c** has a capacity of 16.                 |
|     height="1.0930555555555554in"}                                         |                                                                           |
|                                                                            | We count only the 8, 3, and 5 that are going from source to sink          |
| ............................................................               |                                                                           |
|                                                                            | > Explain why cut 3 in part **c** has a capacity of 16.                   |
| ............................................................               |                                                                           |
|                                                                            | We count only the 4, 7, and 5 that are going from source to sink          |
| ............................................................               |                                                                           |
|                                                                            |                                                                           |
| C1: 12, C2: 16, C3: 16                                                     |                                                                           |
+----------------------------------------------------------------------------+---------------------------------------------------------------------------+

2.  Find the capacities of each cut.

+----------------------------------------------------------------------------+----------------------------------------------------------------------------+
| a.  ![](media/Network Flow/media/image30.png){width="2.875in"              | b.  ![](media/Network Flow/media/image30.png){width="2.598611111111111in"  |
|     height="1.6625in"}                                                     |     height="1.6625in"}                                                     |
|                                                                            |                                                                            |
| (left to right) 37, 33, 37                                                 | (left to right, top to bottom) 25, 38, 35, 14                              |
+============================================================================+============================================================================+
| c.  ![](media/Network Flow/media/image30.png){width="2.5156255468066493in" | d.  ![](media/Network Flow/media/image30.png){width="2.7604166666666665in" |
|     height="1.6625in"}                                                     |     height="1.4006944444444445in"}                                         |
|                                                                            |                                                                            |
| 54, 34, 35, 17                                                             | 350, 300, 360, 460                                                         |
+----------------------------------------------------------------------------+----------------------------------------------------------------------------+

3.  a.  ![](media/Network Flow/media/image31.png){width="2.8259175415573052in"
        height="1.80373687664042in"}By considering each possible path,\
        find the maximum flow for this network.

11

b.  ![](media/Network Flow/media/image32.png){width="2.9319444444444445in"
    height="1.8602416885389326in"}Find the capacities of the cuts shown
    and determine the cut of minimum value. How does this relate to the
    maximum flow you found in part **a**?

The minimum cut shows the paths with 0 remaining capacity after
analysing for flow.

4.  a.  ![](media/Network Flow/media/image33.png){width="2.8843274278215225in"
        height="1.968173665791776in"}By considering each possible path,
        find the maximum flow for this network.

12

b.  ![](media/Network Flow/media/image34.png){width="2.8094094488188976in"
    height="2.0297583114610673in"}Find the capacities of the cuts shown
    and determine the cut of minimum value. How does this relate to the
    maximum flow you found in part **a**?

The minimum cut shows the paths with 0 remaining capacity after
analysing for flow.

5.  True or false? The edges on the minimum cut always have zero excess
    capacity.

true

6.  Draw the minimum cut for each of these flow diagrams. The maximum
    flow is given.

+---------------------------------------------------------------------------+---------------------------------------------------------------------------+
| a.  ![](media/Network Flow/media/image35.png){width="2.526388888888889in" | b.  ![](media/Network Flow/media/image35.png){width="2.526667760279965in" |
|     height="1.2763888888888888in"} 9                                      |     height="1.2764807524059492in"}11                                      |
+===========================================================================+===========================================================================+
| c.  10                                                                    | d.  ![](media/Network Flow/media/image35.png){width="2.526667760279965in" |
|                                                                           |     height="1.2764807524059492in"}18                                      |
| ![](media/Network Flow/media/image35.png){width="2.526388888888889in"     |                                                                           |
| height="1.2763888888888888in"}                                            |                                                                           |
+---------------------------------------------------------------------------+---------------------------------------------------------------------------+
| e.  ![](media/Network Flow/media/image35.png){width="2.526388888888889in" | f.  ![](media/Network Flow/media/image35.png){width="2.526667760279965in" |
|     height="1.2763888888888888in"} 57                                     |     height="1.386036745406824in"}17                                       |
|                                                                           |                                                                           |
| ![](media/Network Flow/media/image35.png){width="2.526388888888889in"     |                                                                           |
| height="1.2763888888888888in"}                                            |                                                                           |
+---------------------------------------------------------------------------+---------------------------------------------------------------------------+
| g.  10                                                                    | h.  ![](media/Network Flow/media/image35.png){width="2.526042213473316in" |
|                                                                           |     height="1.4749332895888014in"}18                                      |
+---------------------------------------------------------------------------+---------------------------------------------------------------------------+

Development

7.  Consider the network diagram shown.

    a.  Calculate the capacities of each of the five cuts.

    b.  Explain why cut 5 is not a valid cut.

    c.  ![](media/Network Flow/media/image36.png){width="3.966666666666667in"
        height="1.6006944444444444in"}Find the maximum flow from A to B

a\) C1: 14, C2: 15, C3: 20, C4: 16, Cut 5 is not valid

b\) Cut 5 does not prevent flow from source to sink

c\) 13

8.  The following network shows the paths that connect landmarks on a
    hiking trail, and the number of people per hour that can travel
    along each path.

![](media/Network Flow/media/image37.png){width="4.215972222222222in"
height="1.7513888888888889in"}

a.  What is the maximum number of people that can travel from the
    carpark to the summit each hour?

26 people

b.  This week, park rangers are doing some work on the path from the
    waterfall to the summit, so now only 5 people can travel along this
    path each hour. How many less people can now travel from the carpark
    to the summit each hour?

2 fewer

9.  The following network shows the layout of a pipe system that
    transports water into a river.\
    The edges represent pipes while the vertices are intersections of
    pipes.\
    All values are in L/sec. There are five cuts on the network, one of
    them being the minimum cut.

    a.  ![](media/Network Flow/media/image38.png){width="4.247916666666667in"
        height="2.0395833333333333in"}What is the maximum amount of
        water that can be transported from the pipe entrance to the
        river each second?

370 L

b.  To maximise transportation rate of the pipe system, the council
    increased the size of one pipe. They increased the capacity of the
    highlighted pipe from 205 L/sec to 305 L/sec. What is new maximum
    amount of water that can be transported from the pipe entrance to
    the river each second?

![](media/Network Flow/media/image39.png){width="4.335916447944007in"
height="1.3220002187226596in"}

375 L

10. **2019 VCE Band 4**

The numbers on the edges show the maximum flow through each pipe in
litres per minute.

The capacity of cut Q, in litres per minute, is:

![](media/Network Flow/media/image40.png){width="3.7199354768153983in"
height="1.8616765091863516in"}![](media/Network Flow/media/image41.png){width="0.6729166666666667in"
height="1.3173611111111112in"}

14

Mastery

11. **2017 VCE Band 5**

![](media/Network Flow/media/image42.png){width="4.920249343832021in"
height="2.4720002187226595in"}The flow of oil through a pipe network, in
L/min is shown in the network.

![](media/Network Flow/media/image43.png){width="1.4875in"
height="0.5729166666666666in"} The maximum flow of oil from the source
to the sink, in litres per minute, is given by:

![](media/Network Flow/media/image43.png){width="1.4875in"
height="0.8430555555555556in"}

B

12. **2020 HSC Standard 2 Band 5**

> The network diagram shows a series of water channels and ponds in a
> garden. The vertices represent six ponds. The edges represent the
> water channels which connect the ponds. The numbers on the edges
> indicate the maximum capacity of the channels.
>
> Determine the maximum flow of the network.

![](media/Network Flow/media/image44.png){width="3.6in"
height="1.5870505249343831in"}

275

![](media/Network Flow/media/image45.png){width="3.6in"
height="1.563254593175853in"} A cut is added to the network, as shown.

Is the cut shown a minimum cut? Give a reason for your answer.

No, since the cut has capacity 325 and the max flow calculated in part a
is 275

13. **2023 HSC Standard 2 Band 5**

> A network with source A and sink B is shown. The capacities of two
> paths are labelled.\
> The cut shown on the diagram has a capacity of 30 .

![](media/Network Flow/media/image46.png){width="3.5069444444444446in"
height="1.9200929571303587in"}![](media/Network Flow/media/image47.png){width="3.4930555555555554in"
height="1.6868055555555554in"}

C

14. **2022 HSC Standard 2 Band 5**

> ![](media/Network Flow/media/image48.png){width="5.073611111111111in"
> height="1.8152777777777778in"}A wildlife park has 5 main
> attractions connected by directional paths. A simple network is drawn
> to represent the flow through the park\'s paths. The number of
> visitors who can access each path at any one time is also shown.

What is the flow capacity of the cut shown?

40

> By showing a suitable cut on the diagram, explain why the network\'s
> current maximum flow capacity is less than 40 visitors.

The minimum cut is 35, so the maximum flow is 35.

> One path is to be increased in capacity so that the overall maximum
> flow will be 40 visitors at any one time. Which path could be
> increased and by how much?

Consider the edges of the minimum cut. AE, DE, or CB could be increased
by 5 to increase max flow to 40.
