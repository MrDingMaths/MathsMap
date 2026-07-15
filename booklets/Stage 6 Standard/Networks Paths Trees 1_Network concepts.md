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
| **Book | Network concepts                  | Version: 241201         |
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

**MST-11-07** applies network techniques to solve network problems

**Network concepts**

- Describe a network as a collection of objects (vertices)
  interconnected by lines (edges) that can represent systems in the real
  world

- Define and use the network terminology: vertex, edge, degree, directed
  networks and weighted edges

- Examine circumstances in which networks are used in a variety of
  real-world applications

- Construct a network diagram to represent information from a given
  table or map, showing weighted and directed edges

- Solve problems involving network diagrams in a variety of practical
  contexts

# Introduction to Networks

- ![](media/Networks Paths Trees 1_Network concepts/media/image1.png){width="2.1694444444444443in"
  height="1.898611111111111in"}A **network** is a system of
  interconnected objects.

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Vertex**             **Edge**               **Degree**
  ---------------------- ---------------------- --------------------------------------------------------------------------------------------------------------------------------
  A **vertex** is point  An **edge** is line    ![](media/Networks Paths Trees 1_Network concepts/media/image2.png){width="2.2395833333333335in"
  on the graph,          drawn between          height="2.0104166666666665in"}![](media/Networks Paths Trees 1_Network concepts/media/image3.png){width="2.2395833333333335in"
  represents an object   vertices, represents a height="1.9729166666666667in"}![](media/Networks Paths Trees 1_Network concepts/media/image4.png){width="2.2020833333333334in"
                         connection             height="1.9027777777777777in"}A vertex's **degree** is the number of edges connected to it.

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

- A **network diagram**, or **graph**, simplifies a real-life network.

### **Example** Real-life Networks

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| For each network, identify what the vertices and edges represent.                                                                                                                                   |
+==================================================================================================+==================================================================================================+
| Social networks                                                                                  | ![](media/Networks Paths Trees 1_Network concepts/media/image6.png){width="3.4319444444444445in" |
|                                                                                                  | height="2.6506944444444445in"}Transport networks                                                 |
| ![](media/Networks Paths Trees 1_Network concepts/media/image5.png){width="3.4125in"             |                                                                                                  |
| height="2.542361111111111in"}                                                                    | Vertex: ...........................                                                              |
|                                                                                                  |                                                                                                  |
| Vertex: ...........................                                                              | Edge: ...........................                                                                |
|                                                                                                  |                                                                                                  |
| Edge: ...........................                                                                |                                                                                                  |
+--------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------+
| Chemical bonds                                                                                   | ![](media/Networks Paths Trees 1_Network concepts/media/image8.png){width="3.411111111111111in"  |
|                                                                                                  | height="3.2223807961504813in"}Family trees (Prince Charles II of Spain)                          |
| ![](media/Networks Paths Trees 1_Network concepts/media/image7.png){width="2.7565212160979877in" |                                                                                                  |
| height="2.3868405511811024in"}                                                                   | ![](media/Networks Paths Trees 1_Network concepts/media/image9.png){width="1.0136832895888015in" |
|                                                                                                  | height="0.9554265091863517in"}                                                                   |
| Vertex: ...........................                                                              |                                                                                                  |
|                                                                                                  | Vertex: ...........................                                                              |
| Edge: ...........................                                                                |                                                                                                  |
|                                                                                                  | Edge: ...........................                                                                |
+--------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------+

## Language of Networks

![A square with 2 diagonal lines drawn within. Details are in the text
following the
diagram.](media/Networks Paths Trees 1_Network concepts/media/image10.png){width="2.686111111111111in"
height="1.6847222222222222in"}

### **Example** Identify elements of a graph.

+---------------------------------------------------------------------------------------------------+
| ![](media/Networks Paths Trees 1_Network concepts/media/image11.png){width="3.2548939195100615in" |
| height="1.257823709536308in"}For the network diagram to the right:                                |
|                                                                                                   |
| Count the number of vertices. 5                                                                   |
|                                                                                                   |
| Count the number of edges. 6                                                                      |
|                                                                                                   |
| Identify the degree of each vertex.                                                               |
|                                                                                                   |
| d(A): 2 d(B): 3 d(C): 3 d(D): 1 d(E): 3                                                           |
+===================================================================================================+

For each graph, state the number of vertices, edges, and the degree of
each vertex.

+-------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------+
| a.  ![](media/Networks Paths Trees 1_Network concepts/media/image12.png){width="1.9378532370953632in" | b.  ![](media/Networks Paths Trees 1_Network concepts/media/image13.png){width="1.968503937007874in" | c.  ![](media/Networks Paths Trees 1_Network concepts/media/image14.png){width="2.172507655293088in" |
|     height="1.8840244969378828in"}                                                                    |     height="1.942843394575678in"}                                                                    |     height="0.8192082239720035in"}                                                                   |
|                                                                                                       |                                                                                                      |                                                                                                      |
| Vertices:                                                                                             | Vertices:                                                                                            | Vertices:                                                                                            |
|                                                                                                       |                                                                                                      |                                                                                                      |
| 4                                                                                                     | 4                                                                                                    | 2                                                                                                    |
|                                                                                                       |                                                                                                      |                                                                                                      |
| Edges:                                                                                                | Edges:                                                                                               | Edges:                                                                                               |
|                                                                                                       |                                                                                                      |                                                                                                      |
| 3                                                                                                     | 6                                                                                                    | 4                                                                                                    |
|                                                                                                       |                                                                                                      |                                                                                                      |
| Degree of vertices:                                                                                   | Degree of vertices:                                                                                  | Degree of vertices:                                                                                  |
|                                                                                                       |                                                                                                      |                                                                                                      |
| d(A): 1, d(B): 2, d(C), 2, d(D): 1                                                                    | d(A): 3, d(B): 3, d(C), 3, d(D): 3                                                                   | d(A): 3, d(B): 5                                                                                     |
+=======================================================================================================+======================================================================================================+======================================================================================================+

**Key ideas**

+-------------------------------------------------------------------+
| 1.  A network describes a system of                               |
|     .............................. objects.                       |
|                                                                   |
| 2.  A simplified drawing of a network is called a                 |
|     ..................                                            |
|                                                                   |
| 3.  A .................. is a point in a graph.                   |
|                                                                   |
| 4.  Vertices are connected to each other by ................      |
|                                                                   |
| 5.  The .................. of a vertex is the number of edges     |
|     that are connected to it.                                     |
+===================================================================+

Foundation

1.  For each graph, count the number of vertices, edges, and list the
    degree of each vertex.

+------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+
| a.  ![](media/Networks Paths Trees 1_Network concepts/media/image15.png){width="2.157347987751531in" | b.  ![](media/Networks Paths Trees 1_Network concepts/media/image16.png){width="1.5763888888888888in" | c.  ![](media/Networks Paths Trees 1_Network concepts/media/image17.png){width="1.2013888888888888in" |
|     height="1.2369717847769028in"}                                                                   |     height="1.3555905511811024in"}                                                                    |     height="1.3619706911636045in"}                                                                    |
|                                                                                                      |                                                                                                       |                                                                                                       |
| Vertices: ...............                                                                            | Vertices: ...............                                                                             | Vertices: ...............                                                                             |
|                                                                                                      |                                                                                                       |                                                                                                       |
| Edges: ...............                                                                               | Edges: ...............                                                                                | Edges: ...............                                                                                |
|                                                                                                      |                                                                                                       |                                                                                                       |
| Degree of vertices:                                                                                  | Degree of vertices:                                                                                   | Degree of vertices:                                                                                   |
|                                                                                                      |                                                                                                       |                                                                                                       |
| d(A): ............                                                                                   | ....................................                                                                  | ....................................                                                                  |
|                                                                                                      |                                                                                                       |                                                                                                       |
| d(B): ............                                                                                   | ....................................                                                                  | ....................................                                                                  |
|                                                                                                      |                                                                                                       |                                                                                                       |
| d(C): ............                                                                                   | ....................................                                                                  | ....................................                                                                  |
|                                                                                                      |                                                                                                       |                                                                                                       |
| d(D): ............                                                                                   | ....................................                                                                  | ....................................                                                                  |
|                                                                                                      |                                                                                                       |                                                                                                       |
| d(E): ............                                                                                   | ....................................                                                                  | ....................................                                                                  |
+======================================================================================================+=======================================================================================================+=======================================================================================================+

2.  This diagram shows the flight paths between capital cities in
    Australia.

    a.  ![](media/Networks Paths Trees 1_Network concepts/media/image18.png){width="3.245282152230971in"
        height="2.352754811898513in"}What do vertices represent?

> ...................................................

b.  What do edges represent?

...................................................

c.  What is the total number of flight paths?

> ...................................................

d.  How many flights are available from Sydney?

...................................................

e.  What does the degree of a vertex represent?

...................................................

f.  ![](media/Networks Paths Trees 1_Network concepts/media/image19.png){width="2.9007370953630796in"
    height="1.6611111111111112in"}Determine the sum of the degrees of
    the vertices.

...................................................

g.  In a million years, the capital cities would have\
    moved due to plate tectonics.\
    Draw the same flight paths onto these vertices.

<!-- -->

3.  A new fitness app allows users to connect with each other to share
    their fitness goals. When two people connect, they are called
    squadmates. The connections are shown on the graph.

    a.  ![A picture containing text, clock Description automatically
        generated](media/Networks Paths Trees 1_Network concepts/media/image20.png){width="2.30625in"
        height="1.875in"}Who has the most squadmates?

> ............................................................

b.  Who has the least squadmates?

> ............................................................

c.  Are Rochelle and Patty squadmates?

............................................................

4.  How many vertices of odd degree does this network have?

![Chart, line chart Description automatically
generated](media/Networks Paths Trees 1_Network concepts/media/image21.png){width="1.9895833333333333in"
height="0.9128149606299213in"}

5.  How many vertices of even degree does this network have?

![Chart Description automatically
generated](media/Networks Paths Trees 1_Network concepts/media/image22.png){width="1.7721522309711286in"
height="1.09375in"}

6.  Which network diagram represents this map showing the roads linking
    four towns?

![Chart, radar chart Description automatically
generated](media/Networks Paths Trees 1_Network concepts/media/image23.png){width="4.385416666666667in"
height="3.162234251968504in"}![](media/Networks Paths Trees 1_Network concepts/media/image24.png){width="1.7013888888888888in"
height="1.6770833333333333in"}

Development

7.  The network diagram on the left shows how rooms A, B, and C are
    connected.

Use the network diagram on the right to identify the rooms A, B, C and D

![](media/Networks Paths Trees 1_Network concepts/media/image25.png){width="2.8564162292213475in"
height="1.4624846894138233in"}![](media/Networks Paths Trees 1_Network concepts/media/image26.png){width="2.88325021872266in"
height="1.0812182852143482in"}

> ![](media/Networks Paths Trees 1_Network concepts/media/image27.png){width="1.6791054243219599in"
> height="1.4763363954505686in"}![](media/Networks Paths Trees 1_Network concepts/media/image27.png){width="1.551388888888889in"
> height="1.6784722222222221in"}The network diagram below represents
> connections between four rooms and the outside (O).\
> Use the information to identify which rooms are A, B, C and D.

8.  The diagram shows a floor plan of a house.

    a.  ![Diagram Description automatically
        generated](media/Networks Paths Trees 1_Network concepts/media/image28.png){width="3.0400896762904637in"
        height="2.4283912948381454in"}Draw a network to represent the
        possible ways of travelling between each room.

------------------------------------------------------------------------

b.  Which room has the highest degree?
    ...............................................................

c.  Why would it be poor design to build a house with a bedroom of
    highest degree?

> ........................................................................................................................

9.  What is the sum of the degrees of all the vertices in each of these
    networks?

+-------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+
| a.  ![](media/Networks Paths Trees 1_Network concepts/media/image29.png){width="2.1366262029746284in" | b.  ![](media/Networks Paths Trees 1_Network concepts/media/image30.png){width="1.5660378390201224in" | c.  ![](media/Networks Paths Trees 1_Network concepts/media/image31.png){width="1.4811318897637795in" |
|     height="1.2927055993000875in"}                                                                    |     height="1.292706692913386in"}                                                                     |     height="1.353824365704287in"}                                                                     |
+=======================================================================================================+=======================================================================================================+=======================================================================================================+

10. **2021 HSC Standard 2 Band 4**

What is the sum of the degrees of all the vertices in this network?

![Diagram, shape Description automatically
generated](media/Networks Paths Trees 1_Network concepts/media/image32.png){width="2.8159722222222223in"
height="1.5048611111111112in"}

11. **2011 VCE Band 4**

In the network shown, the number of vertices of even degree is

![](media/Networks Paths Trees 1_Network concepts/media/image33.png){width="1.9791666666666667in"
height="1.298827646544182in"}

12. **2020 HSC Standard 2 Band 5**

> Two chess teams enter a competition. The two teams have three members
> each. Each member of one team must play each member of another team
> once only. Which network diagram could represent the chess games to be
> played?

![](media/Networks Paths Trees 1_Network concepts/media/image34.png){width="3.607638888888889in"
height="1.35in"}![](media/Networks Paths Trees 1_Network concepts/media/image34.png){width="3.4833333333333334in"
height="1.2243055555555555in"}

Mastery

13. **HSC Sample Question Band 5**

> ![](media/Networks Paths Trees 1_Network concepts/media/image35.png){width="3.1166666666666667in"
> height="2.954840332458443in"}The map of Australia shows the six states
> and two territories, represented by the network diagram. The edges
> represent shared borders between two states/territories.

![A picture containing wire Description automatically
generated](media/Networks Paths Trees 1_Network concepts/media/image36.png){width="2.308333333333333in"
height="2.0548173665791776in"}

What is the order (degree) of the vertex that represents ACT?
..............................

Identify the letter representing Queensland. Explain why.

..............................................................................................................................

..............................................................................................................................

14. **2009 VCE Band 6**

> A graph has five vertices.
>
> Three of these vertices are of even degree and two of these vertices
> are of odd degree.
>
> One extra edge is added. It joins two of the existing vertices.
>
> In the resulting graph, it is not possible to have five vertices that
> are

![](media/Networks Paths Trees 1_Network concepts/media/image37.png){width="2.9661406386701663in"
height="1.2013888888888888in"}

(hint: draw a possible network)

# Weighted and Directed Graphs

## Weighted Graphs

- A **weighted** **graph** uses numbered edges.

- These numbers can represent many things, depending on the network's
  context.

![Radar chart Description automatically
generated](media/Networks Paths Trees 1_Network concepts/media/image38.png){width="4.63161198600175in"
height="1.8922965879265092in"}

## Directed Graphs

- A **directed** **graph** uses arrows to show one-way relationships
  between vertices.

- Directed networks can include two-way connections.

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Undirected Network**                                                                              **Directed Network**
  --------------------------------------------------------------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------
  ![](media/Networks Paths Trees 1_Network concepts/media/image39.png){width="1.8475699912510937in"   ![Diagram Description automatically
  height="1.4270297462817148in"}                                                                      generated](media/Networks Paths Trees 1_Network concepts/media/image40.png){width="1.8869050743657043in"
                                                                                                      height="1.4944947506561679in"}![](media/Networks Paths Trees 1_Network concepts/media/image41.png){width="1.8232731846019248in"
                                                                                                      height="1.4106681977252844in"}

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

- Examples of directed networks include:

  - Road networks with one-way roads.

  - Food chains

  - Twitter followers.

  - Electronic circuits.

  - Scenarios involving flow of fluid.

  - Links on the internet.

## Adjacency Matrix

- A **network diagram** can be shown as a table, called an **adjacency
  matrix**.

- The **vertices** are the row and column headings.

- **Blank cells** mean no direct connection between vertices.

- Cell values show the **weight** of edges.

### **Example** Convert between graphs and tables.

+-----------------------------------------------------------------------------------------------------------------------------+
| ![](media/Networks Paths Trees 1_Network concepts/media/image42.png){width="2.298167104111986in"                            |
| height="2.41755249343832in"}Convert this graph to a table.                                                                  |
|                                                                                                                             |
| ![](media/Networks Paths Trees 1_Network concepts/media/image43.png){width="2.5359995625546805in"                           |
| height="1.878817804024497in"}                                                                                               |
|                                                                                                                             |
| How do you know what the headings of the table will be?                                                                     |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| Why is the table symmetrical along the diagonal?                                                                            |
|                                                                                                                             |
| ........................................................................................................................... |
|                                                                                                                             |
| Will the tables always be symmetrical?                                                                                      |
|                                                                                                                             |
| ........................................................................................................................... |
+=============================================================================================================================+

Convert these graphs to tables

+------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------+
| a.                                                                                                   | +---------------------+---------------------------------------+ |
|                                                                                                      | |                     | **To:**                               | |
| ![](media/Networks Paths Trees 1_Network concepts/media/image44.png){width="2.8097331583552054in"    | |                     +-------+-------+-------+-------+-------+ |
| height="1.1280008748906387in"}                                                                       | |                     | **L** | **M** | **P** | **Q** | **R** | |
|                                                                                                      | +:===========:+:=====:+=======+=======+=======+=======+=======+ |
|                                                                                                      | | > **From:** | **L** | \-    | 2     | \-    | \-    | \-    | |
|                                                                                                      | |             +-------+-------+-------+-------+-------+-------+ |
|                                                                                                      | |             | **M** | 2     | \-    | 4     | \-    | \-    | |
|                                                                                                      | |             +-------+-------+-------+-------+-------+-------+ |
|                                                                                                      | |             | **P** | \-    | 4     | \-    | 3     | 1     | |
|                                                                                                      | |             +-------+-------+-------+-------+-------+-------+ |
|                                                                                                      | |             | **Q** | \-    | \-    | 3     | \-    | 2     | |
|                                                                                                      | |             +-------+-------+-------+-------+-------+-------+ |
|                                                                                                      | |             | **R** | \-    | \-    | 1     | 2     | \-    | |
|                                                                                                      | +-------------+-------+-------+-------+-------+-------+-------+ |
+======================================================================================================+=================================================================+
| b.  ![](media/Networks Paths Trees 1_Network concepts/media/image45.png){width="2.6in"               | +---------------------+-------------------------------+         |
|     height="2.1894739720034995in"}                                                                   | |                     | **To:**                       |         |
|                                                                                                      | |                     +-------+-------+-------+-------+         |
|                                                                                                      | |                     | **A** | **B** | **C** | **D** |         |
|                                                                                                      | +:===========:+:=====:+=======+=======+=======+=======+         |
|                                                                                                      | | > **From:** | **A** | \-    | 5     | 9     | 6     |         |
|                                                                                                      | |             +-------+-------+-------+-------+-------+         |
|                                                                                                      | |             | **B** | 5     | \-    | 8     | \-    |         |
|                                                                                                      | |             +-------+-------+-------+-------+-------+         |
|                                                                                                      | |             | **C** | 9     | 8     | \-    | 4     |         |
|                                                                                                      | |             +-------+-------+-------+-------+-------+         |
|                                                                                                      | |             | **D** | 6     | \-    | 4     | \-    |         |
|                                                                                                      | +-------------+-------+-------+-------+-------+-------+         |
+------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------+
| c.  ![](media/Networks Paths Trees 1_Network concepts/media/image46.png){width="2.863999343832021in" | +---------------------+-------------------------------+         |
|     height="2.384679571303587in"}                                                                    | |                     | **To:**                       |         |
|                                                                                                      | |                     +-------+-------+-------+-------+         |
|                                                                                                      | |                     | **A** | **B** | **C** | **D** |         |
|                                                                                                      | +:===========:+:=====:+=======+=======+=======+=======+         |
|                                                                                                      | | > **From:** | **A** | \-    | 4     | 8     | 3     |         |
|                                                                                                      | |             +-------+-------+-------+-------+-------+         |
|                                                                                                      | |             | **B** | \-    | \-    | 6     | 4     |         |
|                                                                                                      | |             +-------+-------+-------+-------+-------+         |
|                                                                                                      | |             | **C** | 5     | \-    | \-    | 7     |         |
|                                                                                                      | |             +-------+-------+-------+-------+-------+         |
|                                                                                                      | |             | **D** | \-    | \-    | 7     | \-    |         |
|                                                                                                      | +-------------+-------+-------+-------+-------+-------+         |
+------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------+

Foundation

1.  Represent this graph using a table.

+---------------------+-------------------------------+
|                     | **To:**                       |
|                     +-------+-------+-------+-------+
|                     | **W** | **X** | **Y** | **Z** |
+:===========:+:=====:+:=====:+:=====:+:=====:+:=====:+
| > **From:** | **W** |       |       |       |       |
|             +-------+-------+-------+-------+-------+
|             | **X** |       |       |       |       |
|             +-------+-------+-------+-------+-------+
|             | **Y** |       |       |       |       |
|             +-------+-------+-------+-------+-------+
|             | **Z** |       |       |       |       |
+-------------+-------+-------+-------+-------+-------+

![](media/Networks Paths Trees 1_Network concepts/media/image47.png){width="2.2407403762029747in"
height="2.5177548118985125in"}

a.  Explain why the table is symmetrical along the diagonal.

> ..................................................................................................................

2.  Construct a directed graph from these tables.

    a.  

+---------------------+-------------------------------+
|                     | **To:**                       |
|                     +-------+-------+-------+-------+
|                     | **A** | **B** | **C** | **D** |
+:===========:+:=====:+:=====:+:=====:+:=====:+:=====:+
| > **From:** | **A** | \-    | 2     | 3     | 1     |
|             +-------+-------+-------+-------+-------+
|             | **B** | \-    | \-    | \-    | 3     |
|             +-------+-------+-------+-------+-------+
|             | **C** | \-    | 2     | \-    | \-    |
|             +-------+-------+-------+-------+-------+
|             | **D** | \-    | \-    | \-    | \-    |
+-------------+-------+-------+-------+-------+-------+

b.  

+---------------------+-------------------------------+
|                     | **To:**                       |
|                     +-------+-------+-------+-------+
|                     | **A** | **B** | **C** | **D** |
+:===========:+:=====:+:=====:+:=====:+:=====:+:=====:+
| > **From:** | **A** | \-    | \-    | 2     | 5     |
|             +-------+-------+-------+-------+-------+
|             | **B** | 1     | \-    | 7     | \-    |
|             +-------+-------+-------+-------+-------+
|             | **C** | \-    | \-    | \-    | 4     |
|             +-------+-------+-------+-------+-------+
|             | **D** | \-    | 3     | \-    | \-    |
+-------------+-------+-------+-------+-------+-------+

Development

3.  The table lists the number of likes 3 friends give to each other's
    social media posts over a week.

+-------------------------+-------------------------------+
|                         | **To:**                       |
|                         +---------+-----------+---------+
|                         | Keira   | Charlotte | Willa   |
+:===========:+:=========:+:=======:+:=========:+:=======:+
| > **From:** | Keira     | \-      | 32        | 12      |
|             +-----------+---------+-----------+---------+
|             | Charlotte | 6       | \-        | 9       |
|             +-----------+---------+-----------+---------+
|             | Willa     | 41      | 53        | \-      |
+-------------+-----------+---------+-----------+---------+

a.  Explain why the table is not symmetrical along the diagonal.

> ........................................................................................................................

b.  Explain why the diagonal is blank within the context of the
    scenario.

> ........................................................................................................................

4.  **HSC Sample Question Band 4**

> The table below represents a directed network. Complete the network
> diagram below to represent the information in the table.

![](media/Networks Paths Trees 1_Network concepts/media/image48.png){width="2.8333333333333335in"
height="1.9784722222222222in"}![Diagram, shape, arrow Description
automatically
generated](media/Networks Paths Trees 1_Network concepts/media/image49.png){width="2.3055555555555554in"
height="1.724938757655293in"}

5.  **HSC Sample Question Band 4**

> A directed network is shown below. Use it to complete the table.\
> "0" means that no connection exists.

![A picture containing text, crossword puzzle Description automatically
generated](media/Networks Paths Trees 1_Network concepts/media/image50.png){width="2.815328083989501in"
height="1.9506944444444445in"}![](media/Networks Paths Trees 1_Network concepts/media/image51.png){width="2.3270833333333334in"
height="2.173611111111111in"}

# Walks and Paths

- A **walk** is a journey through a graph. A walk:

1.  Starts at a vertex.

2.  Travels along edges.

3.  Ends at a vertex.

- A **walk** lists vertices in visit order.

### **Example** Describe walks using vertices.

+-------------------------------------------------------------------------------------+
| ![](media/Networks Paths Trees 1_Network concepts/media/image52.png){width="2.45in" |
| height="1.5395833333333333in"}Describe the walk, starting from C.                   |
|                                                                                     |
| C -- D -- B -- D -- E -- A -- E -- D                                                |
+=====================================================================================+

Describe the walk.

+-------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+
| a.  ![](media/Networks Paths Trees 1_Network concepts/media/image53.png){width="3.0000863954505688in" | b.  ![](media/Networks Paths Trees 1_Network concepts/media/image54.png){width="2.9930555555555554in" |
|     height="1.6077679352580927in"}                                                                    |     height="1.5527143482064742in"}                                                                    |
|                                                                                                       |                                                                                                       |
| D -- G E -- H -- C -- E -- A                                                                          | D -- G -- E -- C -- F -- H -- E -- B -- D                                                             |
+=======================================================================================================+=======================================================================================================+

Show the walk on the diagram.

+---------------------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------+
| a.  G -- D -- E -- G                                                                              | b.  C -- D -- E -- B -- D -- G -- E -- D                                                          |
|                                                                                                   |                                                                                                   |
| ![](media/Networks Paths Trees 1_Network concepts/media/image55.png){width="2.0694444444444446in" | ![](media/Networks Paths Trees 1_Network concepts/media/image55.png){width="2.0694444444444446in" |
| height="1.8383114610673665in"}                                                                    | height="1.8383114610673665in"}                                                                    |
+===================================================================================================+===================================================================================================+

## Types of Walks

- **Walks** are classified based on repeated edges/vertices and whether
  they are closed.

- A **closed** walk starts and ends at the same vertex.

+----------------+----------------+----------------+---------------------------------------------------------------------------------------------------------------------------------+
| **Trail**      | **Circuit**    | **Path**       | **Cycle**                                                                                                                       |
+================+================+================+=================================================================================================================================+
| No repeated    | A closed       | No repeated    | A closed path.                                                                                                                  |
| edges.         | trail.         | edges.         |                                                                                                                                 |
|                |                |                | ![](media/Networks Paths Trees 1_Network concepts/media/image56.png){width="1.5972222222222223in"                               |
|                |                | No repeated    | height="1.38125in"}![](media/Networks Paths Trees 1_Network concepts/media/image57.png){width="1.6347222222222222in"            |
|                |                | vertices.      | height="1.3708333333333333in"}![](media/Networks Paths Trees 1_Network concepts/media/image58.png){width="1.5784722222222223in" |
|                |                |                | height="1.325in"}![](media/Networks Paths Trees 1_Network concepts/media/image59.png){width="1.5497495625546807in"              |
|                |                |                | height="1.3005938320209973in"}                                                                                                  |
+----------------+----------------+----------------+---------------------------------------------------------------------------------------------------------------------------------+

- **Paths** are the *only* type of walk you need to know for the HSC
  Standard course.

### **Example** Identify paths.

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Decide whether these are paths (a cycle is a path).                                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                                                         |
| +--------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+ |
| | a.                                                                                                           | b.                                                                                                    | c.  ![Chart, radar chart Description automatically                                                           | |
| |                                                                                                              |                                                                                                       |     generated](media/Networks Paths Trees 1_Network concepts/media/image60.png){width="1.826926946631671in"  | |
| | no                                                                                                           | yes                                                                                                   |     height="1.3782195975503062in"}![Chart, radar chart Description automatically                             | |
| |                                                                                                              |                                                                                                       |     generated](media/Networks Paths Trees 1_Network concepts/media/image60.png){width="1.792153324584427in"  | |
| |                                                                                                              |                                                                                                       |     height="1.3782195975503062in"}![Chart, radar chart Description automatically                             | |
| |                                                                                                              |                                                                                                       |     generated](media/Networks Paths Trees 1_Network concepts/media/image60.png){width="1.8269258530183727in" | |
| |                                                                                                              |                                                                                                       |     height="1.378066491688539in"}                                                                            | |
| |                                                                                                              |                                                                                                       |                                                                                                              | |
| |                                                                                                              |                                                                                                       | no                                                                                                           | |
| +==============================================================================================================+=======================================================================================================+==============================================================================================================+ |
| | d.  ![Chart, radar chart Description automatically                                                           | e.  ![](media/Networks Paths Trees 1_Network concepts/media/image61.png){width="2.0233672353455816in" | f.  ![](media/Networks Paths Trees 1_Network concepts/media/image61.png){width="2.260729440069991in"         | |
| |     generated](media/Networks Paths Trees 1_Network concepts/media/image60.png){width="1.8264566929133859in" |     height="1.1853073053368328in"}                                                                    |     height="1.179569116360455in"}                                                                            | |
| |     height="1.4190113735783028in"}                                                                           |                                                                                                       |                                                                                                              | |
| |                                                                                                              | yes                                                                                                   | no                                                                                                           | |
| | no                                                                                                           |                                                                                                       |                                                                                                              | |
| +--------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+ |
| | g.  ![](media/Networks Paths Trees 1_Network concepts/media/image61.png){width="2.0511920384951883in"        | h.  ![](media/Networks Paths Trees 1_Network concepts/media/image61.png){width="2.0382731846019246in" | i.  ![](media/Networks Paths Trees 1_Network concepts/media/image61.png){width="1.9393941382327209in"        | |
| |     height="1.0702405949256344in"}                                                                           |     height="1.1976443569553805in"}                                                                    |     height="1.1976399825021873in"}                                                                           | |
| |                                                                                                              |                                                                                                       |                                                                                                              | |
| | yes                                                                                                          | no                                                                                                    | no                                                                                                           | |
| +--------------------------------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------+ |
+=========================================================================================================================================================================================================================================================================================================================================+

# Basic Network Problems

- Basic network problems involve:

  1.  Interpreting the context of a network.

  2.  Converting the network to a graph.

  3.  Answering questions based on walks.

### **Example** Solve basic network problems.

+---------------------------------------------------------------------------------------------------+
| The train stations in Sydney CBD are called the City Circle.\                                     |
| On a particular day the trains are only running in one direction.                                 |
|                                                                                                   |
| ![](media/Networks Paths Trees 1_Network concepts/media/image62.png){width="6.8381944444444445in" |
| height="0.8245559930008749in"}                                                                    |
|                                                                                                   |
| The vertices are: ...........................                                                     |
|                                                                                                   |
| The edges are: ...........................                                                        |
|                                                                                                   |
| The weights are: ...........................                                                      |
|                                                                                                   |
| How long does it take to travel from Central to\                                                  |
| St James?                                                                                         |
|                                                                                                   |
| .........................................................                                         |
+===================================================================================================+

Foundation

1.  ![Chart Description automatically
    generated](media/Networks Paths Trees 1_Network concepts/media/image63.png){width="2.3715277777777777in"
    height="2.0125in"}This network diagram represents several streets
    for travel between home and school.\
    The numbers indicate travel time in minutes.

    a.  How long does it take to travel to school using these paths?

        i.  A F E D .................................

        ii. A F E C D .................................

        iii. A C D .................................

        iv. A B C D .................................

        v.  A C E D .................................

    b.  Which of the above walks is the longest journey?
        .............................................

    c.  Which of the above walks is the shortest journey?
        .............................................

2.  ![](media/Networks Paths Trees 1_Network concepts/media/image64.png){width="6.448359580052493in"
    height="1.9333989501312336in"}The graphs below show details about
    air travel between Australian cities.

    a.  How many flights are available per day between Sydney and
        Adelaide? .....................

    b.  How many total flights are available between all these cities?
        .....................

    c.  What is the maximum passengers per day that can fly out of
        Sydney? .....................

3.  A route through the following weighted graph has a total weight of
    20.\
    What could the route be?

![](media/Networks Paths Trees 1_Network concepts/media/image65.png){width="3.509027777777778in"
height="2.0718153980752407in"}

+----------------+----------------+----------------+----------------+
| A.  A B D C G  | B.  A C D E F  | C.  B D F E D  | D.  G F D E F  |
|     F          |     G          |                |                |
+================+================+================+================+

Development

4.  The following graph shows the distance between five country towns in
    kilometres.

![](media/Networks Paths Trees 1_Network concepts/media/image66.png){width="3.1333333333333333in"
height="1.8965277777777778in"}What are the distances of the paths
between:

a.  C to D ...............

b.  E to A to C ...............

c.  B to C to A to E ...............

<!-- -->

5.  This weighted graph shows the time taken to walk between five
    locations, in minutes.\
    If it takes 59 minutes to walk the path D A B E, what is the value
    of $x$?

![](media/Networks Paths Trees 1_Network concepts/media/image67.png){width="3.1333333333333333in"
height="1.7972222222222223in"}

6.  Bailey is on holiday in Timboon and wants to visit a few nearby
    towns.

If the numbers represent the distance between towns in kilometres, what
is the distance of the path that starts at Timboon, travels through each
town once and ends at Kennedy's Creek?

![](media/Networks Paths Trees 1_Network concepts/media/image68.png){width="3.2920286526684164in"
height="1.964154636920385in"}

Mastery

7.  The network diagram below models forest walkways connecting a bridge
    (B), waterfall (W), a big tree (T) and a fern gully (F). Walkers
    enter the forest through gate 1 (G1) or gate 2 (G2).\
    The edge weights represent time taken to walk directly between these
    places.

+------------------+-----------------------------------------+
|                  | **To:**                                 |
|                  +------+------+------+------+------+------+
|                  |      |      |      |      |      |      |
+:===========:+:==:+:====:+:====:+:====:+:====:+:====:+:====:+
| > **From:** |    |      |      |      |      |      |      |
|             +----+------+------+------+------+------+------+
|             |    |      |      |      |      |      |      |
|             +----+------+------+------+------+------+------+
|             |    |      |      |      |      |      |      |
|             +----+------+------+------+------+------+------+
|             |    |      |      |      |      |      |      |
|             +----+------+------+------+------+------+------+
|             |    |      |      |      |      |      |      |
|             +----+------+------+------+------+------+------+
|             |    |      |      |      |      |      |      |
+-------------+----+------+------+------+------+------+------+

a.  Represent graph as a table.

![Chart Description automatically
generated](media/Networks Paths Trees 1_Network concepts/media/image69.png){width="3.773584864391951in"
height="2.9638845144356956in"}

b.  A tourist walks from the tree to fern gully via the waterfall and
    bridge.

    i.  How long did it take?
        .....................................................................

    ii. A faster walk that goes from the tree to fern gully is possible.
        Identify it.

> ...............................................................................................................

c.  A tourist undertakes the walk G1 W B F G2 B G1. How long did it
    take? .....................

<!-- -->

8.  **HSC Sample Question Band 4**

> In central Queensland, there are four petrol stations A, B, C and D.\
> The table shows the length, in kilometres, of roads connecting these
> petrol stations.

Construct a network diagram to represent this information.

> ![Table Description automatically
> generated](media/Networks Paths Trees 1_Network concepts/media/image70.png){width="2.7805555555555554in"
> height="1.489339457567804in"}
>
> A petrol tanker needs to refill each station. It starts at station A
> and visits each station. Determine the shortest path and distance that
> can be travelled by the petrol tanker.

...........................................................................................................................

...........................................................................................................................
