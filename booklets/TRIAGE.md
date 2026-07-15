# Booklet triage

Every OLD-origin booklet (238 markdown files converted from `booklets/Booklets
OLD/`) reviewed against the NEW-origin rewrites (91 files converted from
`booklets/Booklets NEW/`) to decide what stays relevant for atomisation.

**Verdicts**

- **SUPERSEDED** — a NEW-origin booklet covers the same content. The exact
  file is named; where a NEW booklet still needs atomising itself, it appears
  in `QUEUE.md`.
- **ALREADY ATOMISED** — superseded *and* the topic is one of the 20 booklets
  already audited (the original root-level Stage 4 passes): Algebraic
  Techniques, Angle Relationships, Area, Computation with Integers, Equations
  1–2, Fractions Decimals Percentages, Indices, Linear Relationships,
  Right-angled Triangles.
- **KEEP** — no NEW counterpart, or only partial overlap (noted).

Judgment calls used a name-mapping pass first, then a heading skim
(`grep '^#'`) of both OLD and NEW files wherever the mapping wasn't a
same-title rename. See the "Ambiguous calls" note under each stage where a
judgment call was non-trivial.

---

## Stage 4 (60 OLD booklets)

All 60 map into the 22 NEW Stage 4 booklets (20 already-audited root topics +
Data Analysis + Data Visualisation).

| Booklet | Verdict | Reason / superseding file |
|---|---|---|
| Algebraic Techniques 1_Examine the concept of pronumerals as a way of representing numbers.md | ALREADY ATOMISED | → `Stage 4/Algebraic Techniques 1_Introduction to Algebra.md` |
| Algebraic Techniques 2_Create algebraic expressions and evaluate them by substitution.md | ALREADY ATOMISED | → `Stage 4/Algebraic Techniques 1_Introduction to Algebra.md` (substitution section) |
| Algebraic Techniques 3_Extend and apply the laws and properties of arithmetic to algebraic terms and expressions.md | ALREADY ATOMISED | → `Stage 4/Algebraic Techniques 2_Simplifying Expressions.md` |
| Algebraic Techniques 4_Extend and apply the distributive law to the expansion of algebraic expressions.md | ALREADY ATOMISED | → `Stage 4/Algebraic Techniques 3_Expanding Brackets.md` |
| Algebraic Techniques 5_Factorise algebraic expressions by identifying numerical and algebraic factors.md | ALREADY ATOMISED | → `Stage 4/Algebraic Techniques 4_Factorise Expressions.md` |
| Angle Relationships 1_Apply the language, notation and conventions of geometry.md | ALREADY ATOMISED | → `Stage 4/Angle Relationships.md` (combined single booklet) |
| Angle Relationships 2_Identify geometrical properties of angles at a point.md | ALREADY ATOMISED | → `Stage 4/Angle Relationships.md` |
| Angle Relationships 3_Identify and describe corresponding, alternate and co-interior angles when 2 straight lines are crossed by a transversal, including parallel lines.md | ALREADY ATOMISED | → `Stage 4/Angle Relationships.md` |
| Angle Relationships 4_Solve numerical problems involving angles using reasoning.md | ALREADY ATOMISED | → `Stage 4/Angle Relationships.md` |
| Area 1_Develop and use formulas to find the area of rectangles, triangles and parallelograms to solve problems.md | ALREADY ATOMISED | → `Stage 4/Area 1_Units Rectangles Parallelograms Triangles.md` |
| Area 2_Develop and use the formula to find the area of circles and sectors to solve problems.md | ALREADY ATOMISED | → `Stage 4/Area 2_Circles and Sectors.md` |
| Area 3_Develop and use the formulas to find the area of trapeziums, rhombuses and kites to solve problems.md | ALREADY ATOMISED | → `Stage 4/Area 3_Quadrilaterals.md` |
| Area 4_Choose appropriate units of measurement for area and convert between units.md | ALREADY ATOMISED | → `Stage 4/Area 1_Units Rectangles Parallelograms Triangles.md` ("Converting Units of Area" section) |
| Computation with Integers 1_Compare and order integers.md | ALREADY ATOMISED | → `Stage 4/Computation with Integers.md` (combined single booklet) |
| Computation with Integers 2_Add and subtract positive and negative integers.md | ALREADY ATOMISED | → `Stage 4/Computation with Integers.md` |
| Computation with Integers 3_Multiply and divide positive and negative integers.md | ALREADY ATOMISED | → `Stage 4/Computation with Integers.md` |
| Computation with Integers 4_Apply the 4 operations to integers.md | ALREADY ATOMISED | → `Stage 4/Computation with Integers.md` |
| Data Analysis 1_Calculate and compare the mean, median, mode and range for simple datasets.md | SUPERSEDED | → `Stage 4/Data Analysis.md` (Summary Statistics/Range/Mode/Mean/Median sections) — topic not yet atomised, see QUEUE |
| Data Analysis 2_Interpret the effect individual data points have on measures of centre and range.md | SUPERSEDED | → `Stage 4/Data Analysis.md` ("Impact of Adding and Removing Data Values", "Clusters, Gaps, Outliers") |
| Data Analysis 3_Analyse datasets presented in various ways and draw conclusions.md | SUPERSEDED | → `Stage 4/Data Analysis.md` ("Comparing Datasets", "Analysing Stem-and-Leaf/Dot Plots", "Median from Cumulative Histograms") |
| Data Classification and Visualisation 1_Classify data as either numerical (discrete or continuous) or categorical (nominal or ordinal) variables.md | SUPERSEDED | → `Stage 4/Data Visualisation.md` (entire booklet is "Book 1: Classifying Data") |
| Data Classification and Visualisation 2_Display data using graphical representations relevant to the purpose of the data.md | KEEP | Partial overlap with `Stage 4/Data Visualisation.md` — NEW file only covers classification, not construction/choice of displays |
| Data Classification and Visualisation 3_Interpret data in graphical representations.md | KEEP | Partial overlap with `Stage 4/Data Analysis.md` — NEW file analyses stats from given stem-leaf/dot plots, not general interpretation of graphical representations |
| Equations 1_Solve linear equations up to 2 steps.md | ALREADY ATOMISED | → `Stage 4/Equations 1_Solve 2 step equations.md` |
| Equations 2_Solve and verify linear equations by substitution.md | ALREADY ATOMISED | → `Stage 4/Equations 2_Formulas.md` |
| Equations 3_Solve quadratic equations.md | SUPERSEDED | → `Stage 5/Equations C_3 Quadratic Equations.md` (not one of the 20 audited topics — quadratics moved to Stage 5 Path) |
| Fractions Decimals Percentages 10_Solve problems that involve the use of percentages.md | ALREADY ATOMISED | → `Stage 4/Fractions Decimals Percentages 6_Percentages Problems.md` |
| Fractions Decimals Percentages 1_Compare fractions using equivalence.md | ALREADY ATOMISED | → `Stage 4/Fractions Decimals Percentages 1_Comparing Fractions.md` |
| Fractions Decimals Percentages 2_Round decimals to a specified degree of accuracy using approximations.md | ALREADY ATOMISED | → `Stage 4/Fractions Decimals Percentages 2_Decimals.md` |
| Fractions Decimals Percentages 3_Identify terminating and recurring decimals.md | ALREADY ATOMISED | → `Stage 4/Fractions Decimals Percentages 2_Decimals.md` ("Terminating and Recurring Decimals" section) |
| Fractions Decimals Percentages 4_Identify and make use of the relationship between fractions, decimals and percentages to carry out simple conversions.md | ALREADY ATOMISED | → `Stage 4/Fractions Decimals Percentages 3_Converting FDP.md` |
| Fractions Decimals Percentages 5_Examine the concept of irrational numbers.md | ALREADY ATOMISED | → `Stage 4/Fractions Decimals Percentages 3_Converting FDP.md` ("Irrational Numbers" section) |
| Fractions Decimals Percentages 6_Order and compare the value of fractions, decimals and percentages.md | ALREADY ATOMISED | → `Stage 4/Fractions Decimals Percentages 3_Converting FDP.md` ("Comparing Fractions Decimals Percentages" section) |
| Fractions Decimals Percentages 7_Solve problems that involve the addition and subtraction of fractions.md | ALREADY ATOMISED | → `Stage 4/Fractions Decimals Percentages 4_Operations with FDP.md` |
| Fractions Decimals Percentages 8_Solve problems that involve the multiplication and division of fractions and decimals.md | ALREADY ATOMISED | → `Stage 4/Fractions Decimals Percentages 4_Operations with FDP.md` |
| Fractions Decimals Percentages 9_Represent one quantity as a fraction, decimal or percentage of another, with and without the use of digital tools.md | ALREADY ATOMISED | → `Stage 4/Fractions Decimals Percentages 5_Percentage Increase Decrease Change.md` ("Expressing a Quantity as a Percentage of Another") |
| Indices 1_Apply index notation to represent whole numbers as products of powers of prime numbers.md | ALREADY ATOMISED | → `Stage 4/Indices.md` (combined single booklet) |
| Indices 2_Examine cube roots and square roots.md | ALREADY ATOMISED | → `Stage 4/Indices.md` |
| Indices 3_Use index notation to establish the index laws with positive-integer indices and the zero index.md | ALREADY ATOMISED | → `Stage 4/Indices.md` |
| Length 1_Solve problems involving the perimeter of various quadrilaterals and simple composite figures.md | KEEP | No NEW Stage 4 "Length" file |
| Length 2_Describe the relationships between the features of circles.md | KEEP | No NEW Stage 4 "Length" file |
| Linear Relationships 1_Plot and identify points on the Cartesian plane.md | ALREADY ATOMISED | → `Stage 4/Linear Relationships.md` (combined single booklet) |
| Linear Relationships 2_Plot linear relationships on the Cartesian plane.md | ALREADY ATOMISED | → `Stage 4/Linear Relationships.md` |
| Linear Relationships 3_Solve linear equations using graphical techniques.md | ALREADY ATOMISED | → `Stage 4/Linear Relationships.md` |
| Probability 1_Determine probabilities for chance experiments.md | KEEP | No NEW Stage 4 "Probability" file |
| Probability 2_Determine probabilities for complementary events.md | KEEP | No NEW Stage 4 "Probability" file |
| Properties of Geometrical Figures 1_Classify triangles according to their side and angle properties.md | KEEP | No NEW Stage 4 "Properties of Geometrical Figures" file |
| Properties of Geometrical Figures 2_Classify quadrilaterals and describe their properties.md | KEEP | No NEW Stage 4 "Properties of Geometrical Figures" file |
| Properties of Geometrical Figures 3_Apply the properties of triangles and quadrilaterals.md | KEEP | No NEW Stage 4 "Properties of Geometrical Figures" file |
| Ratios and Rates 1_Recognise and simplify ratios.md | KEEP | No NEW Stage 4 "Ratios and Rates" file |
| Ratios and Rates 2_Solve problems involving ratios.md | KEEP | No NEW Stage 4 "Ratios and Rates" file |
| Ratios and Rates 3_Recognise and simplify rates.md | KEEP | No NEW Stage 4 "Ratios and Rates" file |
| Ratios and Rates 4_Solve problems involving rates.md | KEEP | No NEW Stage 4 "Ratios and Rates" file |
| Ratios and Rates 5_Interpret and construct distance–time graphs from authentic data.md | KEEP | No NEW Stage 4 "Ratios and Rates" file |
| Right_angled Triangles 1_Identify and define Pythagoras’ theorem.md | ALREADY ATOMISED | → `Stage 4/Right-angled Triangles.md` (combined single booklet) |
| Right_angled Triangles 2_Examine problems involving Pythagoras’ theorem.md | ALREADY ATOMISED | → `Stage 4/Right-angled Triangles.md` |
| Volume 1_Describe the different views of prisms and solids that have been formed from prism combinations.md | KEEP | No NEW Stage 4 "Volume" file |
| Volume 2_Develop and apply the formula to find the volume of a prism to solve problems.md | KEEP | No NEW Stage 4 "Volume" file |
| Volume 3_Develop the formula for finding the volume of a cylinder and apply the formula to solve problems.md | KEEP | No NEW Stage 4 "Volume" file |
| Volume 4_Choose appropriate units of measurement for volume and capacity and convert between units.md | KEEP | No NEW Stage 4 "Volume" file |

**Ambiguous call:** Data Classification and Visualisation 2 & 3 — the task
brief flagged these as *possibly* superseded by the NEW Data
Analysis/Visualisation booklets. Heading skim shows NEW "Data Visualisation"
is single-book and covers only classification (dp-s4-dat-1); NEW "Data
Analysis" covers summary statistics and *analysing* given stem-leaf/dot plots
(a Data Analysis topic activity), not the general skill of choosing/
constructing/interpreting graphical displays (dp-s4-dat-2/3). Verdict: KEEP
both, noted as partial overlap rather than full supersession.

---

## Stage 5 Core (44 OLD booklets)

| Booklet | Verdict | Reason / superseding file |
|---|---|---|
| Algebraic Techniques A 1_Apply the 4 operations to simplify algebraic fractions with numerical denominators.md | KEEP | No NEW "Algebraic Techniques A" file; NEW only rewrites C 2/C 3 (Path) |
| Algebraic Techniques A 2_Apply the distributive law to the expansion of algebraic expressions, and collect like terms where appropriate.md | KEEP | Same — no NEW Algebraic Techniques A |
| Area and Surface Area A 1_Solve problems involving areas and surface areas.md | KEEP | No NEW "Area and Surface Area" file exists |
| Area and Surface Area A 2_Develop and apply the formula for surface areas of cylinders.md | KEEP | Same |
| Area and Surface Area A 3_Solve problems involving surface areas of cylinders and related composite solids.md | KEEP | Same |
| Data Analysis A 1_Examine standard deviation as a measure of spread.md | SUPERSEDED | → `Stage 5/Data Analysis A 1_Standard Deviation.md` |
| Data Analysis A 2_Determine quartiles and interquartile range.md | SUPERSEDED | → `Stage 5/Data Analysis A 2_Quartiles and Box Plots.md` |
| Data Analysis A 3_Represent datasets using box plots and use them to compare datasets.md | SUPERSEDED | → `Stage 5/Data Analysis A 2_Quartiles and Box Plots.md` (combined with OLD A2) |
| Data Analysis B 1_Identify and describe numerical datasets involving 2 variables.md | SUPERSEDED | → `Stage 5/Data Analysis B_Bivariate Data.md` |
| Data Analysis B 2_Represent datasets involving 2 numerical variables, using a scatter plot and a line of best fit, by eye.md | SUPERSEDED | → `Stage 5/Data Analysis B_Bivariate Data.md` |
| Data Analysis B 3_Interpret data involving 2 numerical variables, using graphical representations.md | SUPERSEDED | → `Stage 5/Data Analysis B_Bivariate Data.md` (one NEW file covers all 3 OLD B booklets) |
| Equations A 1_Solve linear equations involving up to 3 steps.md | KEEP | No NEW "Equations A" file; NEW only rewrites C 3/C 4 (Path) |
| Equations A 2_Solve linear equations involving one algebraic fraction.md | KEEP | Same |
| Equations A 3_Solve linear equations arising from word problems and substitution into formulas.md | KEEP | Same |
| Financial Mathematics A 1_Solve problems involving earning money.md | KEEP | No NEW "Financial Maths A" file; NEW only rewrites B |
| Financial Mathematics A 2_Solve problems involving simple interest.md | KEEP | Same |
| Financial Mathematics A 3_Solve problems involving spending money.md | KEEP | Same |
| Financial Mathematics B 1_Solve problems involving compound interest and depreciation.md | SUPERSEDED | → `Stage 5/Financial Maths B Compound Interest Depreciation.md` |
| Indices A 1_Extend and apply the index laws to variables, using positive-integer indices and the zero index.md | SUPERSEDED | → `Stage 5/Indices A 1_Index Laws.md` |
| Indices A 2_Simplify algebraic products and quotients using index laws.md | SUPERSEDED | → `Stage 5/Indices A 1_Index Laws.md` (combined with OLD A1) |
| Indices A 3_Apply index laws to numerical expressions with negative-integer indices.md | SUPERSEDED | → `Stage 5/Indices A 2_Negative Index.md` |
| Linear Relationships A 1_Find the midpoint and gradient of a line segment (interval) on the Cartesian plane.md | SUPERSEDED | → `Stage 5/Linear Relationships A 1_Coordinate Geometry.md` |
| Linear Relationships A 2_Find the distance between 2 points located on the Cartesian plane.md | SUPERSEDED | → `Stage 5/Linear Relationships A 1_Coordinate Geometry.md` (combined with OLD A1) |
| Linear Relationships A 3_Recognise and graph equations.md | SUPERSEDED | → `Stage 5/Linear Relationships A 2_Graphing Lines.md` |
| Linear Relationships A 4_Examine parallel, horizontal and vertical lines.md | SUPERSEDED | → `Stage 5/Linear Relationships A 2_Graphing Lines.md` (combined with OLD A3) |
| Linear Relationships B 1_Examine the gradient-intercept form.md | SUPERSEDED | → `Stage 5/Linear Relationships B Gradient-Intercept Form.md` |
| Linear Relationships B 2_Find the equations of parallel and perpendicular lines.md | SUPERSEDED | → `Stage 5/Linear Relationships B Gradient-Intercept Form.md` (body includes "Parallel and Perpendicular Gradients" despite the title not naming it) |
| Non-Linear Relationships A 1_Examine the connection between algebraic and graphical representations of quadratics and exponentials.md | KEEP | No NEW "Non-Linear Relationships" file |
| Non-Linear Relationships B 1_Graph and examine quadratic relationships.md | KEEP | Same |
| Non-Linear Relationships B 2_Graph and examine exponential relationships.md | KEEP | Same |
| Non-Linear Relationships B 3_Distinguish between linear, quadratic and exponential relationships by examining their graphical representations.md | KEEP | Same |
| Numbers of Any Magnitude 1_Identify and describe very small and very large measurements.md | KEEP | No NEW "Numbers of Any Magnitude" file |
| Numbers of Any Magnitude 2_Find absolute and percentage error.md | KEEP | Same |
| Numbers of Any Magnitude 3_Estimate and round numbers to a specified degree of accuracy.md | KEEP | Same |
| Numbers of Any Magnitude 4_Express numbers in scientific notation.md | KEEP | Same |
| Probability A 1_Describe multistage chance experiments involving independent and dependent events.md | KEEP | No NEW "Probability" file |
| Probability A 2_Solve problems for multistage chance experiments.md | KEEP | Same |
| Properties of Geometrical Figures A 1_Identify and describe the properties of similar figures.md | KEEP | No NEW "Properties of Geometrical Figures" file |
| Properties of Geometrical Figures A 2_Solve problems using ratio and scale factors in similar figures.md | KEEP | Same |
| Trigonometry A 1_Demonstrate and explain the constancy of trigonometric ratios for a given angle in right-angled triangles.md | KEEP | NEW Stage 5 has only Trig C/D (Path); no Trig A/B file |
| Trigonometry A 2_Apply trigonometry to solve right-angled triangle problems.md | KEEP | Same |
| Trigonometry B 1_Solve right-angled triangle problems involving angles of elevation and depression.md | KEEP | Same |
| Trigonometry B 2_Solve right-angled triangle problems involving bearings.md | KEEP | Same |
| Volume A 1_Solve problems involving composite solids consisting of right prisms and cylinders.md | KEEP | No NEW "Volume" file |

**Notes:**
- NEW `Data Anaylsis A 3_Grouped Data.md` (typo in the filename, kept as-is)
  is pure new content — grouped-frequency tables/histograms/mean from
  grouped data — with no OLD Data Analysis A booklet to supersede; it still
  needs atomising (see QUEUE) as part of the Data Analysis A group.
- **Ambiguous call:** Linear Relationships B 2 (parallel/perpendicular lines)
  folding into a NEW file titled only "Gradient-Intercept Form" was confirmed
  by body content, not filename — the title doesn't signal that coverage.

---

## Stage 5 Path (61 OLD booklets)

| Booklet | Verdict | Reason / superseding file |
|---|---|---|
| Algebraic Techniques B_1 Apply the 4 operations involving algebraic fractions with pronumerals in the denominator.md | KEEP | No NEW file covers this topic |
| Algebraic Techniques B_2 Factorise algebraic expressions by taking out a common algebraic factor.md | KEEP | No NEW file covers this topic |
| Algebraic Techniques B_3 Expand binomial products and factorise monic quadratic expressions.md | KEEP | No NEW file covers this topic |
| Algebraic Techniques C_1 Operate with algebraic fractions involving binomial numerators and numerical denominators.md | KEEP | Different syllabus point from NEW C 3 (factorise-and-cancel fractions vs binomial-numerator addition); not covered anywhere |
| Algebraic Techniques C_2 Expand, factorise and simplify algebraic expressions including special products.md | SUPERSEDED | → `Stage 5/Algebraic Techniques C 2_Further Expansion and Factorisation.md` + `Stage 5/Algebraic Techniques C 3_Further Algebraic Fractions.md` — content split across the two NEW files |
| Area and Surface Area B_1 Solve problems involving surface areas.md | KEEP | No NEW file covers this topic |
| Circle Geometry_1 Prove and apply angle and chord properties of circles.md | KEEP | No NEW file covers this topic |
| Circle Geometry_2 Prove and apply tangent and secant properties of circles.md | KEEP | No NEW file covers this topic |
| Equations B_1 Solve monic quadratic equations.md | KEEP | No NEW file covers this topic |
| Equations B_2 Solve cubic equations.md | KEEP | No NEW file covers this topic |
| Equations B_3 Solve linear inequalities and graph their solutions on a number line.md | KEEP | No NEW file covers this topic |
| Equations C_1 Solve linear equations involving algebraic fractions and equations of more than 3 steps.md | KEEP | No NEW "Equations C_1"-equivalent file exists |
| Equations C_2 Rearrange literal equations.md | KEEP | No NEW file covers this topic |
| Equations C_3 Solve quadratic equations using a variety of methods.md | SUPERSEDED | → `Stage 5/Equations C_3 Quadratic Equations.md` — headings and Real/Rational Roots subsection fully match |
| Equations C_4 Solve linear simultaneous equations, both algebraically and graphically.md | KEEP | Partial overlap with `Stage 5/Equations C 4_Simultaneous Equations.md` — its "Partial Fractions" (two-term decomposition) section has no NEW counterpart; NEW's "Splitting the Numerator" is a different technique |
| Functions and Other Graphs_1 Define relations and functions, and use function notation.md | KEEP | No NEW file covers this topic |
| Functions and Other Graphs_2 Find the domain and range of a function and graph functions.md | KEEP | No NEW file covers this topic |
| Functions and Other Graphs_3 Graph regions corresponding to linear inequalities in one and 2 variables.md | SUPERSEDED | → `Stage 5/Functions 2_Graph Regions.md` — identical syllabus bullet, fuller rewrite |
| Indices B_1 Apply index laws to algebraic expressions involving negative-integer indices.md | KEEP | NEW "Indices A 2_Negative Index" is MA5-IND-C-01 (numerical, Core) — this OLD file is MA5-IND-P-01 (algebraic, Path), a different outcome despite the similar title |
| Indices C_1 Describe surds.md | KEEP | No NEW file covers this topic |
| Indices C_2 Apply knowledge of surds to solve problems.md | KEEP | No NEW file covers this topic |
| Indices C_3 Describe and use fractional indices.md | KEEP | No NEW file covers this topic |
| Linear Relationships C_1 Apply formulas to find the midpoint and gradient slope of an interval on the Cartesian plane.md | SUPERSEDED | → `Stage 5/Linear Relationships C 1_Coordinate Geometry Formulas.md` — merged with C_2 |
| Linear Relationships C_2 Apply the distance formula to find the distance between 2 points located on the Cartesian plane.md | SUPERSEDED | → `Stage 5/Linear Relationships C 1_Coordinate Geometry Formulas.md` — merged with C_1 |
| Linear Relationships C_3 Use various forms of the equation of a straight line.md | KEEP | Partial overlap with `Stage 5/Linear Relationships C 2_General and Point Gradient Form.md` — its "Special Lines" (horizontal/vertical/y=mx) subsection is missing there; that content surfaced instead in the unrelated Core file `Stage 5/Linear Relationships B Gradient-Intercept Form.md` |
| Linear Relationships C_4 Solve problems by applying coordinate geometry formulas.md | SUPERSEDED | → `Stage 5/Linear Relationships C 3_Coordinate Geometry Problems.md` — Triangles/Quadrilaterals headings match exactly |
| Linear Relationships C_5 Identify line and rotational symmetries.md | KEEP | No NEW file covers this topic (checked whole NEW folder for "symmetry") |
| Linear Relationships C_6 Describe translations, reflections in an axis, and rotations through multiples of 90 degrees on the Cartesian plane, using coordinates.md | KEEP | No NEW file covers this topic (checked whole NEW folder for "translation vector"/"image notation") |
| Logarithms_1 Examine logarithms both numerically and graphically.md | KEEP | No NEW file covers this topic |
| Logarithms_2 Establish and apply the laws of logarithms to solve problems.md | KEEP | No NEW file covers this topic |
| Non-Linear Relationships C_1 Graph parabolas and describe their features and transformations.md | KEEP | No NEW file covers this topic |
| Non-Linear Relationships C_2 Graph exponentials and describe their features and transformations.md | KEEP | No NEW file covers this topic |
| Non-Linear Relationships C_3 Graph hyperbolas and describe their features and transformations.md | KEEP | No NEW file covers this topic |
| Non-Linear Relationships C_4 Graph circles and describe their features and transformations.md | KEEP | No NEW file covers this topic |
| Non-Linear Relationships C_5 Distinguish between different types of graphs by examining their algebraic and graphical representations and solve problems.md | KEEP | No NEW file covers this topic |
| Non-Linear Relationships C_6 Graph and compare polynomial curves and describe their features and transformations.md | KEEP | No NEW file covers this topic |
| Polynomials_1 Define and operate with polynomials.md | KEEP | No NEW file covers this topic |
| Polynomials_2 Divide polynomials.md | KEEP | No NEW file covers this topic |
| Polynomials_3 Apply the factor and remainder theorems to solve problems.md | KEEP | No NEW file covers this topic |
| Polynomials_4 Graph polynomials.md | KEEP | No NEW file covers this topic |
| Probability B_1 Solve problems involving Venn diagrams and 2-way tables.md | KEEP | No NEW file covers this topic |
| Probability B_2 Use the language, 'if … then', 'given', 'of' and 'knowing that', to examine conditional statements and identify common mistakes in interpreting the language.md | KEEP | No NEW file covers this topic |
| Probability B_3 Describe mutually and non-mutually exclusive events using specific language and calculate related probabilities.md | KEEP | No NEW file covers this topic |
| Properties of Geometrical Figures B_1 Identify and explain congruence.md | KEEP | No NEW file covers this topic |
| Properties of Geometrical Figures B_2 Develop and use the conditions for congruent triangles.md | KEEP | No NEW file covers this topic |
| Properties of Geometrical Figures B_3 Develop and apply the minimum conditions for triangles to be similar.md | KEEP | No NEW file covers this topic |
| Properties of Geometrical Figures B_4 Establish and apply properties of similar shapes and solids.md | KEEP | No NEW file covers this topic |
| Properties of Geometrical Figures B_5 Apply logical reasoning to numerical problems involving plane shapes.md | KEEP | No NEW file covers this topic |
| Properties of Geometrical Figures C_1 Construct formal proofs involving congruent and similar triangles.md | KEEP | No NEW file covers this topic |
| Properties of Geometrical Figures C_2 Apply logical reasoning to proofs involving plane shapes.md | KEEP | No NEW file covers this topic |
| Trigonometry C_1 Solve 3-dimensional problems involving right-angled triangles.md | SUPERSEDED | → `Stage 5/Trigonometry C 1_3D Trigonometry.md` |
| Trigonometry C_2 Apply the sine, cosine and area rules to any triangle and solve related problems.md | SUPERSEDED | → `Stage 5/Trigonometry C 2_Non-Right-Angled Trigonometry.md` |
| Trigonometry D_1 Use the unit circle to define trigonometric functions and represent them graphically.md | SUPERSEDED | → `Stage 5/Trigonometry D Circle Trigonometry.md` — merged with D_2 |
| Trigonometry D_2 Solve trigonometric equations using exact values and the relationships between supplementary and complementary angles.md | SUPERSEDED | → `Stage 5/Trigonometry D Circle Trigonometry.md` — merged with D_1 |
| Variation and Rates of Change A_1 Identify and describe problems involving direct and inverse variation.md | SUPERSEDED | → `Stage 5/Variation and Rates of Change 1_Direct and Inverse Proportion.md` — merged A_1–A_3 |
| Variation and Rates of Change A_2 Identify and describe graphs involving direct and inverse variation.md | SUPERSEDED | → `Stage 5/Variation and Rates of Change 1_Direct and Inverse Proportion.md` |
| Variation and Rates of Change A_3 Solve problems involving direct and inverse variation and examine the relationship between graphs and equations corresponding to proportionality.md | SUPERSEDED | → `Stage 5/Variation and Rates of Change 1_Direct and Inverse Proportion.md` |
| Variation and Rates of Change B_1 Analyse graphs that are decreasing or increasing at a constant rate.md | SUPERSEDED | → `Stage 5/Variation and Rates of Change 2_Graphs of Rates of Change.md` |
| Variation and Rates of Change B_2 Analyse the relationship between graphs and variable rates of change.md | KEEP | Partial overlap with `Stage 5/Variation and Rates of Change 2_Graphs of Rates of Change.md` — its "Rates from Non-Linear Graphs" matches, but the piecewise-linear "variable rate" practice subsection has no dedicated match (NEW's related "Speed-Time Graphs" section is a step up in difficulty, not a direct replacement) |
| Variation and Rates of Change B_3 Construct graphical representations of rates of change.md | SUPERSEDED | → `Stage 5/Variation and Rates of Change 2_Graphs of Rates of Change.md` — "Graphs of Change" heading matches exactly |
| Volume B_1 Solve problems involving volumes.md | KEEP | No NEW file covers this topic |

**Ambiguous calls:**
- **Equations C_4** — its "Partial Fractions" (two-term decomposition) section
  and NEW's "Splitting the Numerator" are genuinely different techniques for
  different purposes (integral-calculus prep vs hyperbola-sketching prep).
  Judged as a real gap → KEEP with partial-overlap note, not full supersession.
- **Linear Relationships C_3** — the missing "Special Lines" content
  resurfaced in an unrelated Core file (`Linear Relationships B`), not the
  Path C2 file it came from. Kept as partial overlap since cross-tier
  coverage in a differently-scoped booklet doesn't cleanly supersede a
  Path-specific dot point.
- **Variation and Rates of Change B_2** — the piecewise-linear "variable
  rate" practice content is arguably absorbed by NEW's more advanced
  "Speed-Time Graphs" section; treated as not a clean match (KEEP) since it's
  conceptually a step up rather than a direct replacement.

---

## Stage 6 Advanced (24 OLD booklets)

| Booklet | Verdict | Reason / superseding file |
|---|---|---|
| Introduction to Differentiation 1_Estimating change (OLD).md | SUPERSEDED | → `Stage 6 Advanced/Introduction to Differentiation 1_Estimating Change.md` — near-identical rewrite, also absorbs OLD booklet 2's content |
| Introduction to Differentiation 2_The derivative.md | SUPERSEDED | → `Stage 6 Advanced/Introduction to Differentiation 1_Estimating Change.md` — its "linear derivative" and "first principles" sections were copied near-verbatim into NEW booklet 1 (no NEW booklet numbered "2" exists — this OLD file has no filename collision so kept its plain name) |
| Introduction to Differentiation 3_Calculations with the derivative (OLD).md | SUPERSEDED | → `Stage 6 Advanced/Introduction to Differentiation 3_Calculations with the derivative.md` — reorganised/expanded rewrite, same rule set (power/chain/product/quotient, tangents/normals) |
| Introduction to Differentiation 4_Graphical applications of the derivative (OLD).md | SUPERSEDED | → `Stage 6 Advanced/Introduction to Differentiation 4_Graphical applications of the derivative.md` + `Applications of Calculus 1_Turning points inflections and curve-sketching.md` — content split across two NEW booklets (cubic-sketching section moved into Applications of Calculus 1); see ambiguous-call note |
| Introduction to Differentiation 5_The derivative as a rate of change (OLD).md | SUPERSEDED | → `Stage 6 Advanced/Introduction to Differentiation 5_The derivative as a rate of change.md` — same 3 sections, expanded rewrite |
| Trigonometric Identities and Equations.md | KEEP | No NEW booklet covers the Adv11 trig-ratios/identities topic |
| Trigonometry and Measure of Angles 1_Trigonometry with acute angles.md | KEEP | No NEW counterpart |
| Trigonometry and Measure of Angles 2_Trigonometry with angles of any magnitude.md | KEEP | No NEW counterpart |
| Trigonometry and Measure of Angles 3_Radians.md | KEEP | No NEW counterpart |
| Working with Functions 10_Piecewise-defined functions.md | KEEP | No NEW "Working with Functions" series exists |
| Working with Functions 11_Absolute value functions.md | KEEP | Same |
| Working with Functions 1_Algebraic techniques.md | KEEP | Same — `Graph Transformations.md` (NEW) covers a different topic (reflections/translations/dilations only) |
| Working with Functions 1_Solving equations.md | KEEP | Same |
| Working with Functions 2_Introduction to functions and relations.md | KEEP | Same |
| Working with Functions 3_Linear functions.md | KEEP | Same |
| Working with Functions 4_Quadratic and cubic functions.md | KEEP | Same |
| Working with Functions 5_Reciprocal functions.md | KEEP | Same |
| Working with Functions 6_Constructing and using functions.md | KEEP | Same |
| Working with Functions 7_Direct and inverse variation.md | KEEP | Same |
| Working with Functions 8_Circles and semicircles.md | KEEP | Same |
| Working with Functions 9_Properties of functions, relations and graphs.md | KEEP | Same |
| 11 Algebraic Techniques Test.md | KEEP | Headerless diagnostic quiz (7 "END OF QUIZ" blocks: indices, expanding, factorising, algebraic fractions, surds, linear/quadratic equations) — maps to the still-KEEP "Working with Functions 1" booklets (Algebraic techniques + Solving equations), not to any NEW booklet; see ambiguous-call note |
| Financial Mathematics 1_Reducing balance loans.md | KEEP | NEW Stage 6 Advanced has no financial mathematics booklets |
| Financial Mathematics 2_Annuities.md | KEEP | Same |

**Ambiguous calls:**
- **Introduction to Differentiation 4** — its content survives, but split
  across two NEW files rather than one clean 1:1 replacement. Tagged
  SUPERSEDED (nothing is lost) rather than PARTIAL; flagged here in case a
  stricter single-file-replacement reading is preferred.
- **11 Algebraic Techniques Test** — a diagnostic quiz, not a teaching
  booklet with worked examples. Its scope shadows content in the two
  "Working with Functions 1" booklets (both still KEEP, no NEW rewrite), so
  it doesn't point at Stage 5 content despite the "Algebraic Techniques"
  name. Kept, to be handled alongside "Working with Functions" if/when that
  topic is ever queued (it isn't in QUEUE.md yet — see QUEUE.md scope note).

---

## Stage 6 Extension 1 (8 OLD booklets)

| Booklet | Verdict | Reason / superseding file |
|---|---|---|
| Further Trigonometry 1_Trigonometry in three dimensions.md | KEEP | NEW "Further Trigonometry 3" is entirely trig equations/identities/t-formulae — no shared content with 3D right-angled-triangle trig |
| Further Work with Functions 1_Graphical relationships.md | KEEP | No NEW file addresses graphing $1/f(x)$, $\lvert f(x)\rvert$, sums/products of general functions |
| Further Work with Functions 2_Inverse functions.md | KEEP | Distinct from NEW "Inverse Trigonometric Functions 1-2" (those cover only $\sin^{-1},\cos^{-1},\tan^{-1}$) — confirmed via content, not just title |
| Further Work with Functions 3_Parametric form of a function or relation.md | KEEP | No NEW equivalent |
| Further Work with Functions 4_Inequalities.md | KEEP | No NEW equivalent |
| Polynomials 1_Language and graphs of polynomials.md | KEEP | Foundational (non-calculus) content; no NEW rewrite |
| Polynomials 2_Remainder and factor theorems.md | KEEP | No NEW rewrite |
| Polynomials 3_Sums and products of zeroes of polynomials.md | KEEP | No NEW rewrite |

**Note:** NEW "Further Applications of Calculus 1_Multiplicity of zeroes of
polynomial functions.md" opens with a review of exactly this Polynomials
1–3 content (sketching multi-root polynomials, sum/product of zeroes, factor
theorem) as a prerequisite recap, then builds calculus content on top for a
different, more advanced dot point (MX1-12-12). Confirmed distinct — not
superseding — via heading/content comparison.

---

## Stage 6 Standard (41 OLD booklets)

All KEEP — `booklets/Booklets NEW/` has no "Stage 6 Standard" folder at all,
so none of these have a NEW counterpart.

| Booklet | Verdict | Reason |
|---|---|---|
| Algebraic Relationships 1_Simultaneous linear equations.md | KEEP | No NEW Stage 6 Standard folder exists |
| Algebraic Relationships 2_Exponential relationships.md | KEEP | Same |
| Algebraic Relationships 3_Quadratic relationships.md | KEEP | Same |
| Algebraic Relationships 4_Reciprocal relationships.md | KEEP | Same |
| Annuities.md | KEEP | Same |
| Applications of Measurement 1_Practicalities of measurement.md | KEEP | Same |
| Applications of Measurement 2_Perimeter, area, volume.md | KEEP | Same |
| Bivariate Data Analysis 1_Bivariate datasets.md | KEEP | Same |
| Bivariate Data Analysis 2_Scatterplots and lines of best fit.md | KEEP | Same |
| Critical Path Analysis.md | KEEP | Same |
| Data Analysis 1_Statistical investigation process.md | KEEP | Same |
| Data Analysis 2_Population and sample.md | KEEP | Same |
| Data Analysis 3_Data classification.md | KEEP | Same |
| Data Analysis 4_Display and interpret grouped and ungrouped data.md | KEEP | Same |
| Data Analysis 5_Measures of centre and spread.md | KEEP | Same |
| Data Analysis 6_Quartiles and interquartile range.md | KEEP | Same |
| Data Analysis 7_Five-number summary and box plots.md | KEEP | Same |
| Data Analysis 8_Clusters and outliers.md | KEEP | Same |
| Earning Money 1_Ways of earning.md | KEEP | Same |
| Earning Money 2_Taxation.md | KEEP | Same |
| Formulas and Equations.md | KEEP | Same |
| Investments and Loans 1_Investment.md | KEEP | Same |
| Investments and Loans 2_Depreciation.md | KEEP | Same |
| Investments and Loans 3_Loans.md | KEEP | Same |
| Investments and Loans 4_Credit cards.md | KEEP | Same |
| Linear Relationships 1_Linear modelling.md | KEEP | Same |
| Linear Relationships 2_Direct variation.md | KEEP | Same |
| Managing Money 1_Purchasing goods.md | KEEP | Same |
| Managing Money 2_Budgeting.md | KEEP | Same |
| Network Flow.md | KEEP | Same |
| Networks Paths Trees 1_Network concepts.md | KEEP | Same |
| Networks Paths Trees 2_Shortest paths and spanning trees.md | KEEP | Same |
| Ratios and Rates 1_Ratios.md | KEEP | Same |
| Ratios and Rates 2_Rates.md | KEEP | Same |
| Relative Frequency and Probability.md | KEEP | Same |
| The Normal Distribution 1_Normally distributed datasets.md | KEEP | Same |
| The Normal Distribution 2_Calculating z-scores.md | KEEP | Same |
| The Normal Distribution 3_Probability using z-scores.md | KEEP | Same |
| Time and Location 1_Positions on the Earth’s surface.md | KEEP | Same |
| Time and Location 2_Time and time differences.md | KEEP | Same |
| Trigonometry.md | KEEP | Same |

---

## Cleanup — EXECUTED (approved 2026-07-15)

All three deletions below were approved and executed on 2026-07-15. This
document remains as the audit record of what was removed and why.

**(a) 20 old root-level booklet `.md` files** in `booklets/` (not in any
stage folder) — replaced by fresh Stage 4 conversions with extracted images
in `booklets/Stage 4/`. Same content, same filenames, just relocated:
Algebraic Techniques 1-4, Angle Relationships, Area 1-3, Computation with
Integers, Equations 1-2, Fractions Decimals Percentages 1-6, Indices, Linear
Relationships, Right-angled Triangles (20 files at the `booklets/` root).

**(b) `Booklets OLD/` and `Booklets NEW/` docx folders** — 329 source docx
files (238 + 91) across both trees, redundant now that every file is
converted to markdown with media extracted to per-booklet `media/` folders.

**(c) Superseded/already-atomised OLD booklets themselves** (once this table
is approved) — every row above marked SUPERSEDED or ALREADY ATOMISED: their
`.md` file and matching `media/<booklet-stem>/` folder.

**Verdicts approved by the user 2026-07-15; deletions executed (78 triaged
md + media, 20 root md, both docx folders). Surviving md per folder:
Stage 4: 40, Stage 5: 23, Stage 5 Core: 28, Stage 5 Path: 46,
Stage 6 Advanced: 48, Stage 6 Extension 1: 25, Stage 6 Standard: 41.**
