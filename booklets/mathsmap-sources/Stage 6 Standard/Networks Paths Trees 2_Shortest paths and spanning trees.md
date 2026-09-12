  ----------------------

  ----------------------

Student Name

  -------------------------------------------------------------------
  Mathematics Standard Year 11
  -------------------------------------------------------------------
  **Networks,\
  Paths, and Trees**

  -------------------------------------------------------------------

+--------+-----------------------------------+-------------------------+
| **Book | Shortest paths and spanning trees | Version: 241201         |
| 2**    |                                   |                         |
|        |                                   | Report mistakes &       |
|        |                                   | suggest improvements:\  |
|        |                                   | https://MrDingMaths.com |
+========+===================================+=========================+

+-------------------------------------------------------------------+
| # Contents {#contents .TOC-Heading}                               |
|                                                                   |
| [Overview [2](#overview)](#overview)                              |
|                                                                   |
| [Spanning Trees [3](#spanning-trees)](#spanning-trees)            |
|                                                                   |
| [Minimum Spanning Trees                                           |
| [9](#minimum-spanning-trees)](#minimum-spanning-trees)            |
|                                                                   |
| [Minimal Connector Problems                                       |
| [14](#minimal-connector-problems)](#minimal-connector-problems)   |
|                                                                   |
| [Shortest Paths [19](#shortest-paths)](#shortest-paths)           |
+===================================================================+

# Overview

## Syllabus Content

**MST-11-07** applies network techniques to solve network problems

**Shortest paths and spanning trees**

- Define and use the network terminology: path, tree, spanning tree and
  minimum spanning tree

- Determine the minimum spanning tree of a network with weighted edges,
  using any method

- Use minimum spanning trees to solve minimal connector problems

- Identify a shortest path on a network diagram with no more than 10
  vertices

- Describe a circumstance in which a shortest path is not necessarily
  the best path nor contained in any minimum spanning tree

# Spanning Trees

## Connected Graphs

- In a **connected graph**, you can move from any vertex to any other by
  following edges.

### **Example** Identify connected graphs.

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Identify whether these graphs are connected or disconnected.                                                                                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                                                                                                |
| +------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+ |
| | a.  ![2 diagrams representing networks, with one showing edges crossing and one showing no edges                             | b.  ![2 graphs that have 5 vertices and 5 edges drawn in different ways. Details in text below                               | c.  ![2 graphs that have 5 vertices and 5 edges drawn in different ways. Details in text below                               | |
| |     crossing.](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image3.png){width="1.4277777777777778in" |     diagram.](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image4.png){width="1.4055555555555554in"  |     diagram.](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image4.png){width="1.4055555555555554in"  | |
| |     height="1.350259186351706in"}                                                                                            |     height="1.1333333333333333in"}                                                                                           |     height="0.9881944444444445in"}                                                                                           | |
| |                                                                                                                              |                                                                                                                              |                                                                                                                              | |
| | c                                                                                                                            | d                                                                                                                            | c                                                                                                                            | |
| +==============================================================================================================================+==============================================================================================================================+==============================================================================================================================+ |
| | d.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image5.png){width="1.6209678477690288in"        | e.  ![Chart, line chart Description automatically                                                                            | f.  ![A picture containing skiing, equipment, line Description automatically                                                 | |
| |     height="1.1166666666666667in"}                                                                                           |     generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image6.png){width="1.5888888888888888in" |     generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image7.png){width="0.9826388888888888in" | |
| |                                                                                                                              |     height="1.5199945319335084in"}                                                                                           |     height="1.5722222222222222in"}                                                                                           | |
| | c                                                                                                                            |                                                                                                                              |                                                                                                                              | |
| |                                                                                                                              | d                                                                                                                            | d                                                                                                                            | |
| +------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+ |
| | g.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image8.png){width="1.8689873140857394in"        | h.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image9.png){width="1.2003149606299213in"        | i.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image10.png){width="1.9819192913385826in"       | |
| |     height="0.9999956255468067in"}                                                                                           |     height="1.4914818460192476in"}                                                                                           |     height="0.9486111111111111in"}                                                                                           | |
| |                                                                                                                              |                                                                                                                              |                                                                                                                              | |
| | c                                                                                                                            | d                                                                                                                            | d                                                                                                                            | |
| +------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------+ |
+================================================================================================================================================================================================================================================================================================================================================================================================+

## Trees

- A **tree** is a connected graph with only one **path** between any two
  vertices

- Reminder: a **path** is a walk without repeated vertices or edges.

- **A tree with** $\mathbf{n}$ **vertices always has**
  $\left( \mathbf{n - 1} \right)$ **edges.**

- A tree has no loops, multiple edges, or cycles.

![Chart Description automatically generated with medium
confidence](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image11.png){width="6.837661854768154in"
height="1.846286089238845in"}

### **Example** Identify trees.

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Identify whether these graphs are trees.                                                                                                                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                                                                                                           |
| +------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------+ |
| | a.                                                                                                                     | b.                                                                                                                    | c.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image12.png){width="1.0715277777777779in"                               | |
| |                                                                                                                        |                                                                                                                       |     height="0.6583333333333333in"}![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image13.png){width="0.7534722222222222in" | |
| | yes                                                                                                                    | no                                                                                                                    |     height="0.6548611111111111in"}![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image14.png){width="0.7590277777777777in" | |
| |                                                                                                                        |                                                                                                                       |     height="0.6520833333333333in"}                                                                                                                   | |
| |                                                                                                                        |                                                                                                                       |                                                                                                                                                      | |
| |                                                                                                                        |                                                                                                                       | yes                                                                                                                                                  | |
| +========================================================================================================================+=======================================================================================================================+======================================================================================================================================================+ |
| | d.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image15.png){width="1.3618055555555555in" | e.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image16.png){width="1.285333552055993in" | f.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image17.png){width="1.267856517935258in" height="1.267856517935258in"}  | |
| |     height="0.7111111111111111in"}                                                                                     |     height="1.285333552055993in"}                                                                                     |                                                                                                                                                      | |
| |                                                                                                                        |                                                                                                                       | yes                                                                                                                                                  | |
| | yes                                                                                                                    | no                                                                                                                    |                                                                                                                                                      | |
| +------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------+ |
| | g.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image18.png){width="1.285333552055993in"  | h.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image19.png){width="1.285333552055993in" | i.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image20.png){width="1.3333333333333333in"                               | |
| |     height="1.285333552055993in"}                                                                                      |     height="1.285333552055993in"}                                                                                     |     height="1.3333333333333333in"}                                                                                                                   | |
| |                                                                                                                        |                                                                                                                       |                                                                                                                                                      | |
| | no                                                                                                                     | no                                                                                                                    | no                                                                                                                                                   | |
| +------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------+ |
+===========================================================================================================================================================================================================================================================================================================================================================================================================+

## Spanning Tree

- A **spanning tree** connects all the vertices of the original graph
  with the fewest edges.

- A spanning tree connects all vertices with the least edges.

- To find a spanning tree:

  1.  Count the total vertices $n$.

  2.  Remove edges until $(n - 1)$ edges remain.

      a.  First, remove edges from loops and duplicate edges.

      b.  Remove edges from cycles, keep all vertices connected.

### **Example** Construct a spanning tree.

+--------------------------------------------------------------------------------------------------------------------+
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image21.png){width="1.9340660542432195in" |
| height="1.4222659667541557in"}Construct a spanning tree of this graph.                                             |
|                                                                                                                    |
| 1\. There are 5 vertices, so the spanning tree has max 4 edges.                                                    |
|                                                                                                                    |
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image22.png){width="2.014517716535433in"  |
| height="1.428865923009624in"}2a. Remove edges from loops and cycles. 2b. Remove edges from cycles.                 |
|                                                                                                                    |
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image23.png){width="1.6194444444444445in" |
| height="1.1756944444444444in"}                                                                                     |
|                                                                                                                    |
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image24.png){width="1.642856517935258in"  |
| height="1.1927580927384076in"}Final spanning tree:                                                                 |
+====================================================================================================================+

Create a spanning tree from these graphs.

+------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image25.png){width="2.03208552055993in"   | b.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image26.png){width="2.116694006999125in"  |
|     height="0.9088429571303587in"}                                                                                     |     height="1.5752438757655294in"}                                                                                     |
+========================================================================================================================+========================================================================================================================+
| c.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image27.png){width="2.7182874015748033in" | d.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image28.png){width="1.8284722222222223in" |
|     height="1.7957403762029747in"}                                                                                     |     height="2.13125in"}                                                                                                |
+------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------+

**Key ideas**

+-------------------------------------------------------------------+
| 1.  A tree has only one ............... connecting any two        |
|     vertices.                                                     |
|                                                                   |
| 2.  A tree has no ..............., ...........................    |
|     ..............., nor ..................... and always has 1   |
|     less ............... compared to the number of vertices.      |
|                                                                   |
| 3.  For a given graph, a spanning tree is a graph that connects   |
|     all ........................ with the least edges.            |
+===================================================================+

Foundation

1.  A tree has seven vertices. How many edges does it have?
    ...............

2.  A tree has seven edges. How many vertices does it have?
    ...............

3.  Identify which of the following are trees.

+------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image29.png){width="1.1153674540682414in" | b.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image29.png){width="1.1131944444444444in" | c.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image29.png){width="1.1944444444444444in" |
|     height="1.439734251968504in"}                                                                                      |     height="1.4368055555555554in"}                                                                                     |     height="1.4368055555555554in"}                                                                                     |
+========================================================================================================================+========================================================================================================================+========================================================================================================================+
| d.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image29.png){width="1.3104166666666666in" | e.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image29.png){width="1.5970592738407698in" | f.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image29.png){width="1.1041666666666667in" |
|     height="1.1875in"}                                                                                                 |     height="1.4633836395450568in"}                                                                                     |     height="1.4861111111111112in"}                                                                                     |
+------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------+

4.  Draw two different spanning trees for each of these graphs.

+------------------------------------------------------------------------------------------------------------+----------------------+----------------------+
| a.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image30.png){width="2.0625in" |                      |                      |
|     height="1.6555555555555554in"}                                                                         |                      |                      |
+============================================================================================================+======================+======================+
| b.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image31.png){width="2.0in"    |                      |                      |
|     height="1.4755555555555555in"}                                                                         |                      |                      |
+------------------------------------------------------------------------------------------------------------+----------------------+----------------------+

Development

5.  Construct a spanning tree for these networks.

+------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| a.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image32.png){width="2.9166666666666665in" |                                 |
|     height="1.4267629046369203in"}                                                                                     |                                 |
+========================================================================================================================+=================================+
| b.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image33.png){width="2.727273622047244in"  |                                 |
|     height="1.3488768591426072in"}                                                                                     |                                 |
+------------------------------------------------------------------------------------------------------------------------+---------------------------------+

6.  ![A picture containing sky Description automatically
    generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image34.png){width="2.520138888888889in"
    height="1.4034722222222222in"}Zoe the software engineer is setting
    up a computer network and is trying to connect all the computers
    using the least number of wires possible. The graph shows possible
    connections between computers.

    a.  What is the least number of wires Zoe can use?

> ............................................................

b.  Draw two possible layouts of the network.

<!-- -->

7.  Edges were removed from the graph below so that it has the minimum
    number of edges to remain connected. How many edges were removed?

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image35.png){width="0.6222922134733159in"
height="1.4305555555555556in"}![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image36.png){width="2.5931594488188976in"
height="1.8325in"}

C

# Minimum Spanning Trees

- A **minimum spanning tree** connects all vertices with lowest total
  edge weight.

**Prim's Algorithm** finds a minimum spanning tree.

1.  Pick any vertex to start.

2.  Choose the lowest edge weight from this vertex and draw the
    connection.

3.  From *all* existing tree vertices, choose the edge with the lowest
    weight.

4.  Repeat step 3 until all vertices connect.

### **Example** Construct a minimum spanning tree.

+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Find the minimum spanning tree.                                                                                                                  |
|                                                                                                                                                  |
| Step 1: Choose A Step 2: Connect AB Step 3: Connect AD                                                                                           |
|                                                                                                                                                  |
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image37.png){width="1.7916666666666667in"                               |
| height="1.4756944444444444in"}![Shape, polygon Description automatically                                                                         |
| generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image38.png){width="1.96875in"                                   |
| height="1.5361111111111112in"}![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image39.png){width="1.9046576990376203in" |
| height="1.4780413385826772in"}                                                                                                                   |
|                                                                                                                                                  |
| Step 4: Connect DC Step 4: Connect CE Step 5: Connect EF                                                                                         |
|                                                                                                                                                  |
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image40.png){width="2.0236111111111112in"                               |
| height="1.5611111111111111in"}![Shape, polygon Description automatically                                                                         |
| generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image41.png){width="1.9340277777777777in"                        |
| height="1.5055555555555555in"}![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image42.png){width="1.9793646106736658in" |
| height="1.5491688538932633in"}                                                                                                                   |
|                                                                                                                                                  |
| ![Chart, shape, polygon Description automatically                                                                                                |
| generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image43.png){width="1.7552088801399826in"                        |
| height="1.6467268153980752in"}Minimum spanning tree, with length 17:                                                                             |
|                                                                                                                                                  |
| In step 3, why was AD connected and not BD?                                                                                                      |
|                                                                                                                                                  |
| ........................................................................................................................                         |
|                                                                                                                                                  |
| ........................................................................................................................                         |
+==================================================================================================================================================+

Construct the minimum spanning tree and state the sum of the edge
weights of the tree.

+---------------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image44.png){width="2.0833333333333335in"    |
|     height="1.8239621609798775in"}                                                                                        |
|                                                                                                                           |
| 15                                                                                                                        |
+===========================================================================================================================+
| b.                                                                                                                        |
|                                                                                                                           |
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image45.png){width="2.1333202099737534in"        |
| height="1.9015146544181978in"}                                                                                            |
|                                                                                                                           |
| 11                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------+
| c.                                                                                                                        |
|                                                                                                                           |
| ![Chart, line chart Description automatically                                                                             |
| generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image46.png){width="2.5791666666666666in" |
| height="1.5069444444444444in"}                                                                                            |
|                                                                                                                           |
| 22                                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------+

Foundation

1.  ![Chart Description automatically
    generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image47.png){width="2.9993055555555554in"
    height="1.6479166666666667in"}The weight of the minimum spanning
    tree for the graph is 31.\
    Draw the minimum spanning tree.

2.  Construct the minimum spanning tree and calculate their weights.

+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| a.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image48.png){width="2.1284722222222223in"        | 17                              |
|     height="1.9632108486439195in"}                                                                                            |                                 |
+===============================================================================================================================+=================================+
| b.                                                                                                                            | 6                               |
|                                                                                                                               |                                 |
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image49.png){width="2.858393482064742in"             |                                 |
| height="1.4553772965879266in"}                                                                                                |                                 |
+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| c.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image50.png){width="2.1284722222222223in"        | 45                              |
|     height="1.7902777777777779in"}                                                                                            |                                 |
+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| d.  ![Chart, radar chart Description automatically                                                                            | 10                              |
|     generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image51.png){width="2.4078915135608048in" |                                 |
|     height="1.4694389763779527in"}                                                                                            |                                 |
+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| e.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image51.png){width="2.1283038057742782in"        | 9                               |
|     height="1.7954549431321085in"}                                                                                            |                                 |
+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| f.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image50.png){width="2.7196970691163607in"        | 65                              |
|     height="1.577007874015748in"}                                                                                             |                                 |
+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| g.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image51.png){width="2.5145833333333334in"        | 60                              |
|     height="1.709446631671041in"}                                                                                             |                                 |
+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------+
| h.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image51.png){width="2.1287882764654418in"        | 20                              |
|     height="1.9469706911636044in"}                                                                                            |                                 |
+-------------------------------------------------------------------------------------------------------------------------------+---------------------------------+

Development

3.  The minimum spanning tree for the network includes 2 edges with
    weighting $a$ and $b$.

The length of the minimum spanning tree is 25. What are the values of
$a$ and $b$?

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image52.png){width="1.3569192913385826in"
height="1.0972222222222223in"}![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image53.png){width="1.9582174103237096in"
height="1.2796270778652667in"}

A

4.  **HSC Sample Question Band 3**

> The diagram below is a connected network.
>
> Complete the diagram to show the how all vertices can be connected
> with least edge weights. 

![A picture containing scale, device Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image54.png){width="3.385632108486439in"
height="2.2882928696412947in"}![Diagram, shape Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image55.png){width="3.3910378390201226in"
height="2.2313560804899386in"}

What is the mathematical term that describes the diagram you have
produced?

..............................................................................................................................

5.  **2016 VCE Band 5**

The minimum spanning tree for the network below includes the edge with
weight labelled $k$.

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image56.png){width="4.66400043744532in"
height="2.618798118985127in"} The total weight for all edges of the
minimum spanning tree is 33.

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image57.png){width="0.5909230096237971in"
height="1.336000656167979in"}What is the value of $k$?

D

# Minimal Connector Problems

- A **minimum spanning tree** links all vertices using the lowest edge
  weights.

- **Minimal connector problems** use minimum spanning trees to find the
  cheapest way to link real-world sites.

### **Example** Solve connector problems.

+--------------------------------------------------------------------------------------------------------------------------------------------------+
| The network diagram shows possible water pipes connecting six towns.\                                                                            |
| The numbers on each edge represent the distance between towns in kilometres.\                                                                    |
| Determine the shortest distance connecting water pipes to the six towns.                                                                         |
|                                                                                                                                                  |
| ![Chart, radar chart Description automatically                                                                                                   |
| generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image58.png){width="2.781537620297463in"                         |
| height="1.6315737095363079in"}![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image59.png){width="2.5576924759405073in" |
| height="1.5418011811023622in"} 1. Create a minimum spanning tree:                                                                                |
|                                                                                                                                                  |
| 2\. Find the length of the spanning tree by summing the edge weights                                                                             |
|                                                                                                                                                  |
| $7 + 6 + 8 + 9 + 7 = 37$                                                                                                                         |
|                                                                                                                                                  |
| 3\. Interpret the answer.                                                                                                                        |
|                                                                                                                                                  |
| The shortest distance of water pipe is 37 km.                                                                                                    |
+==================================================================================================================================================+

The weighted graph shows the cost (in millions of dollars) of connecting
rural towns using internet cables. Determine the lowest cost of
connecting all the towns.

![A picture containing watch Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image60.png){width="2.282343613298338in"
height="2.3541666666666665in"}

\$42 million

Foundation

1.  Water is to be piped from a water tank to seven outlets.\
    The possible pipe connections are shown. The distances, in km, are
    shown as edge weights.

    a.  Starting at the tank, construct the minimum spanning tree.

![Diagram Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image61.png){width="3.548611111111111in"
height="1.744996719160105in"}

b.  What is the minimum length of pipe required?

44 km

2.  The diagram shows the cost, in dollars, to lay NBN cables to connect
    suburbs to the node.

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image62.png){width="0.9740255905511811in"
height="1.2987007874015748in"}What is the minimum cost required to
ensure each suburb is connected to the node?

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image64.png)

B

3.  What is the minimum amount of cable needed to connect these houses?
    (all units are in metres)

![Chart, diagram, radar chart Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image65.png){width="2.9090277777777778in"
height="2.334722222222222in"}

53.5 m

Development

4.  A Japanese garden is being built, with paths connecting ponds.\
    The cost to pave the paths is \$120 per metre. What is the least
    cost of the paths?

![Chart, radar chart Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image66.png){width="3.7676771653543306in"
height="2.4696970691163607in"}

\$28 800

5.  The table shows the distances between towns A, B, C, and D in
    kilometres.

    a.  The network is undirected. Fill in the rest of the table.

    b.  Represent the table as a graph.

+---------------------+-------------------------------+
|                     | **To:**                       |
|                     +-------+-------+-------+-------+
|                     | **A** | **B** | **C** | **D** |
+:===========:+:=====:+:=====:+:=====:+:=====:+:=====:+
| > **From:** | **A** | \-    | 3.3   | 5.8   | 2.5   |
|             +-------+-------+-------+-------+-------+
|             | **B** |       | \-    | 4.4   | 1.5   |
|             +-------+-------+-------+-------+-------+
|             | **C** |       |       | \-    | 3.6   |
|             +-------+-------+-------+-------+-------+
|             | **D** |       |       |       | \-    |
+-------------+-------+-------+-------+-------+-------+

c.  What would be the most cost-effective method of connecting the towns
    to each other? Answer using a diagram.

d.  If the cost per km of rail is \$50 000, what is the minimum cost of
    setting up the network?

\$380 000

6.  Stacey and Julia are building a house. There will be 9 power points
    throughout the house.\
    The positions of the power points and the main power source are
    indicated by the vertices.

The numbers on the edges represent the distances, in centimetres,
between the power points.

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image68.png)
Draw how to connect all power points to the main with the shortest
length of cable.

What is the mathematical name of the graph you have drawn?
..........................................

What is the shortest length of cable needed? ..................

199 m

7.  **2022 HSC Standard 2 Band 3**

![Table Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image69.png){width="4.611909448818897in"
height="1.293766404199475in"}The table below shows the distances, in
kilometres, between a number of towns.

![Chart, scatter chart Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image70.png){width="3.7480555555555557in"
height="1.6061548556430447in"} Draw a weighted network diagram to
represent the information shown in the table.

> ![Chart, scatter chart Description automatically
> generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image71.png){width="3.7129932195975504in"
> height="2.003370516185477in"}A tourist wishes to visit each town.\
> Draw the minimum spanning tree that will allow for this and determine
> its length.

1015 km

Mastery

8.  **2021 VCE Band 5**

A network of roads connecting towns in an alpine region is shown below.

The distances between neighbouring towns, represented by vertices, are
given in kilometres.

![Chart, diagram Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image72.png){width="4.844155730533683in"
height="2.3119214785651794in"}

The region receives a large snowfall, leaving all roads between the
towns closed to traffic.

To ensure each town is accessible by car from every other town, some
roads will be cleared.

![Text, letter Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image73.png){width="2.1363626421697286in"
height="1.3233114610673666in"}The minimal total length of road, in
kilometres, that needs to be cleared is

(hint: draw a partial minimum spanning tree that doesn't include the
edges $x$ and $y$)

B

# Shortest Paths

- To find the shortest path between two vertices, it is often easiest to
  do it by inspection\
  (guess and check).

- Use reasoning to eliminate paths that take the long way around rather
  than the direct route.

### **Example** Determine the shortest path by inspection.

+--------------------------------------------------------------------------------------------------------------------------+
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image74.png){width="1.7009623797025373in"       |
| height="1.802260498687664in"}Determine the shortest path between A and E.                                                |
|                                                                                                                          |
| Two feasible paths:                                                                                                      |
|                                                                                                                          |
| A B E: 2 + 3 = 5                                                                                                         |
|                                                                                                                          |
| A D E: 3 + 4 = 7                                                                                                         |
|                                                                                                                          |
| The shortest path is A-D-E with total weight of 5.                                                                       |
|                                                                                                                          |
| Why do we not consider paths A-D-C-B-E or A-B-C-D-E?                                                                     |
|                                                                                                                          |
| ........................................................................................................................ |
|                                                                                                                          |
| ........................................................................................................................ |
+==========================================================================================================================+

a.  Determine the shortest path between A and E by inspection and state
    the length of the shortest path.

> ![Chart, line chart Description automatically
> generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image75.png){width="2.9405161854768154in"
> height="1.6666666666666667in"}

A-C-D-E 11

b.  The network diagram represents time required to travel along streets
    between home and the shops. Determine the shortest path and time
    between home and shops.

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image76.png){width="3.3886154855643045in"
height="1.7820505249343832in"}

A-B-C-F-I 10 minutes

## Dijkstra's Algorithm

**Dijkstra's Algorithm for Shortest Path:**

1.  Redraw the graph with empty circles at each vertex.

2.  Begin a tree from the starting vertex $S$ given by the question.\
    For all vertices one edge away from $S$, write the lowest total
    weight inside the circle.

3.  For all vertices two edges away from $S$, write the lowest total
    weight inside the circle.

4.  Keep going until you reach the finish vertex $F$.

5.  Identify the shortest path by tracing back from $F$ along the lowest
    total weights.

### **Example** Determine the shortest path using Dijkstra's algorithm.

+-------------------------------------------------------------------------------------------------------------------------------------------------+
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image77.png){width="3.1868055555555554in"                              |
| height="1.7680555555555555in"}Find the shortest path between $X$ and $Y$.                                                                       |
|                                                                                                                                                 |
| Step 1: Step 2:                                                                                                                                 |
|                                                                                                                                                 |
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image78.png){width="3.2051662292213474in"                              |
| height="1.690475721784777in"}![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image79.png){width="3.1569444444444446in" |
| height="1.6916666666666667in"}                                                                                                                  |
|                                                                                                                                                 |
| Step 3: Step 4:                                                                                                                                 |
|                                                                                                                                                 |
| ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image80.png){width="3.1824398512685916in"                              |
| height="1.7414326334208223in"}![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image81.png){width="3.225404636920385in" |
| height="1.7011504811898512in"}                                                                                                                  |
|                                                                                                                                                 |
| The shortest path is X A E F Y with total weight of 14.                                                                                         |
|                                                                                                                                                 |
| Why is the number inside vertex $E$ a 4 when the direct route from $X$ is 5?                                                                    |
|                                                                                                                                                 |
| ...........................................................................................................................                     |
|                                                                                                                                                 |
| ...........................................................................................................................                     |
+=================================================================================================================================================+

Determine the shortest path weight from A to B.

+-------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------+
| a.  ![A picture containing text, clock, watch Description automatically                                                       | b.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image83.png){width="2.1764709098862642in" |
|     generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image82.png){width="2.6715682414698163in" |     height="2.2542016622922136in"}                                                                                     |
|     height="1.728701881014873in"}                                                                                             |                                                                                                                        |
|                                                                                                                               | 38                                                                                                                     |
| 20                                                                                                                            |                                                                                                                        |
+===============================================================================================================================+========================================================================================================================+

Determine the path weight using Dijkstra's Algorithm.

+-----------------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| a.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image84.png){width="3.005952537182852in" | b.  B to D                                                                                                        |
|     height="2.1691305774278216in"} A to D                                                                             |                                                                                                                   |
|                                                                                                                       | ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image85.png){width="2.446428258967629in" |
| 35                                                                                                                    | height="2.189767060367454in"}                                                                                     |
|                                                                                                                       |                                                                                                                   |
|                                                                                                                       | 6                                                                                                                 |
+=======================================================================================================================+===================================================================================================================+

Foundation

1.  ![Chart Description automatically
    generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image86.png){width="2.838888888888889in"
    height="1.9in"}Determine the shortest path between A and D.

What is the length of the shortest path?

A-F-B-C-D 12

2.  Determine the shortest paths and their lengths by inspection for
    this graph.

    a.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image87.png){width="3.439583333333333in"
        height="1.7895833333333333in"}X and C
        ..............................

    b.  X and D ..............................

    c.  A and Y ..............................

    d.  B and Y ..............................

    e.  A and B ..............................

    f.  X and Y ..............................

17, 19, 19, 16, 18, 26

3.  Using Dijkstra's Algorithm, find the shortest path from S to F and
    its length.

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image88.png){width="4.079520997375328in"
height="2.5576924759405073in"}

Path: ........................... Length: ..............................

S-A-C-E-F 22

Development

4.  ![Diagram Description automatically
    generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image89.png){width="3.685627734033246in"
    height="2.4381124234470692in"}Consider the graph.

    a.  Use Dijkstra's Algorithm to find\
        the shortest path from A to E.

A-B-I-E 7

b.  Construct the minimum spanning tree.\
    Is the shortest path between A and E on the minimum spanning tree?

No

5.  ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image90.png){width="3.0520833333333335in"
    height="1.6006944444444444in"}![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image91.png){width="2.9027777777777777in"
    height="2.326388888888889in"}The table shows the travelling times
    between 6 locations.\
    Construct a graph based on the information on the table.

    a.  Draw the minimum spanning tree for the network. What is the sum
        of the edge weights?

167

b.  Describe the shortest path between Cronulla and Hornsby.\
    Is it contained on the minimum spanning tree?

Cron-Syd-Horn, no

6.  **HSC Sample Question Band 4**

![A picture containing diagram Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image92.png){width="3.839744094488189in"
height="2.843391294838145in"} Describe the shortest path between A and J
and its weight.

Path: ........................... Weight: ..............................

A-B-E-F-J 15

7.  **2014 VCE Band 4**

> The diagram shows the roads that Stephanie can use to travel between
> home and school.
>
> What is the shortest time that it will take her to ride her bike from
> school?

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image93.png){width="4.102083333333334in"
height="2.036111111111111in"}

14 minutes

Mastery

8.  **HSC Sample Question Band 5**

> The following table shows the travelling time, in minutes, between
> towns which are directly connected by roads. A dash indicates that
> towns are not directly connected.
>
> Draw a network diagram showing the information in this table.

![A picture containing text, crossword puzzle Description automatically
generated](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image94.png){width="1.7873873578302713in"
height="1.7777777777777777in"}

What is the shortest travelling time between *A* and *E*?

62 minutes

9.  **HSC Sample Question Band 4**

A network of roads is pictured below, with the distances of each road
represented in km.

A driver wants to travel from A to H in the shortest distance possible.

![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image95.png){width="3.7916666666666665in"
height="2.384027777777778in"}What is the distance she must travel?

11 km

10. **2023 HSC Standard 2 Band 5**

> ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image96.png){width="4.416000656167979in"
> height="2.3591426071741033in"}A network of running tracks connects the
> points A to H, as shown. The number on each edge represents the time,
> in minutes, that a typical runner should take to run along each track.
>
> Which path could a typical runner take to run from point A to point D
> in the shortest time?

A-B-F-G-D 14 minutes

> ![](media/Networks Paths Trees 2_Shortest paths and spanning trees/media/image97.png){width="3.9618799212598423in"
> height="2.469845800524934in"}A spanning tree of the network above is
> shown.
>
> Is it a minimum spanning tree? Justify your answer.

No
