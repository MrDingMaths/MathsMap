import fs from 'node:fs';
import path from 'node:path';

const root = 'C:/Users/james/OneDrive/Admin/WebApps/MathsMap';
const manifestPath = path.join(root, '.diagnostic-questions/visual-jobs-current.json');
const outputDir = path.join(root, '.diagnostic-questions/transcriptions-full-20260802');

const transcriptions = {
  '106861': {
    question_text: 'The diagram shows a sector of a circle, centre $O$, radius $5\\text{ cm}$. Major angle $AOB$ is $\\dfrac{4\\pi}{3}$ radians. Work out the exact area of the major sector.\\n\\n[tikz]\\n\\begin{tikzpicture}[scale=0.7]\\n\\draw[thick] (0,0)--(0,3);\\draw[thick] (0,0)--(2.6,-1.9);\\draw[thick] (0,3) arc[start angle=90,end angle=-36,radius=3];\\draw (0.7,0) arc[start angle=0,end angle=-36,radius=0.7];\\n\\node[left] at (0,1.5) {$5\\text{ cm}$};\\node[left] at (0.6,-0.1) {$\\dfrac{4\\pi}{3}$};\\node[left] at (-0.1,3) {$B$};\\node[right] at (2.6,-1.9) {$A$};\\node[below right] at (0,0) {$O$};\\end{tikzpicture}\\n[/tikz]',
    structure: 'area-of-major-sector-from-radian-angle',
    meaningfulCase: 'major sector with a reflex angle measured in radians',
    mastery: false,
    options: [
      { text: '$\\dfrac{50\\pi}{3}$', correct: true },
      { text: '$25\\pi$', correct: false, why: 'Uses the full circle area instead of multiplying by the major angle fraction.' },
      { text: '$\\dfrac{20\\pi}{3}$', correct: false, why: 'Uses an incorrect radius or angle factor in the sector-area formula.' },
      { text: '$\\dfrac{40\\pi^2}{3}$', correct: false, why: 'Squares the radian angle, although sector area is linear in the angle.' }
    ],
    solution_text: 'For a sector with angle $\\theta$ radians, area is $\\dfrac12r^2\\theta$. Therefore\\n\\n$\\dfrac12(5)^2\\left(\\dfrac{4\\pi}{3}\\right)=\\dfrac{50\\pi}{3}\\text{ cm}^2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '106862': {
    question_text: 'The diagram shows a sector of a circle, centre $O$, radius $5\\text{ cm}$. Major angle $AOB$ is $\\dfrac{3\\pi}{4}$ radians. Work out the exact area of the minor segment bounded by the circumference and the chord $AB$.\\n\\n[tikz]\\n\\begin{tikzpicture}[scale=0.7]\\n\\coordinate (O) at (0,0);\\coordinate (A) at (1.9,-2.5);\\coordinate (B) at (0,3);\\draw[thick] (A) arc[start angle=-53,end angle=90,radius=3.1];\\draw[thick] (A)--(B);\\draw[thick] (O)--(A);\\draw[thick] (O)--(B);\\draw (0.65,0) arc[start angle=0,end angle=127,radius=0.65];\\node[right] at (0,1.5) {$6\\text{ cm}$};\\node at (0.75,0.45) {$\\dfrac{3\\pi}{4}$};\\node[left] at (A) {$A$};\\node[right] at (B) {$B$};\\node[below right] at (O) {$O$};\\end{tikzpicture}\\n[/tikz]',
    structure: 'area-of-minor-segment-by-sector-minus-triangle',
    meaningfulCase: 'minor segment found by subtracting an isosceles triangle from a sector',
    mastery: false,
    options: [
      { text: '$\\dfrac{27\\pi}{2}$', correct: false, why: 'Calculates the sector area but does not subtract the triangular part.' },
      { text: '$\\dfrac{27\\pi}{2}-18$', correct: false, why: 'Subtracts a non-trigonometric triangle area that does not match the diagram.' },
      { text: '$\\dfrac{27\\pi}{2}-9\\sqrt{2}$', correct: true },
      { text: '$\\dfrac12(27\\pi-9\\sqrt{2})$', correct: false, why: 'Applies an extra factor of one half to the already calculated sector term.' }
    ],
    solution_text: 'Using the radius shown in the diagram, the sector area is $\\dfrac12(6)^2\\left(\\dfrac{3\\pi}{4}\\right)=\\dfrac{27\\pi}{2}$. The triangle $AOB$ has area $\\dfrac12(6)(6)\\sin\\left(\\dfrac{3\\pi}{4}\\right)=9\\sqrt2$. Hence the minor segment area is $\\dfrac{27\\pi}{2}-9\\sqrt2$.',
    diagramRequired: true,
    uncertainties: ['The written stem says radius 5 cm, while the diagram labels the radius 6 cm; the options and calculation use 6 cm.']
  },
  '11212': {
    question_text: 'Which of the following diagrams matches the equation $\\left(\\dfrac{x}{2}\\right)^2+y^2=1$?\\n\\n[tikz]\\n\\begin{tikzpicture}[scale=0.55]\\n\\draw[red,thick] (0,0) circle (2);\\node at (-2.5,1.7) {A};\\draw[blue,thick] (-2,0) arc[start angle=180,end angle=360,x radius=2,y radius=1]--cycle;\\node at (-2.5,-1.5) {B};\\draw[green!60!black,thick] (0,1) arc[start angle=90,end angle=270,x radius=0.5,y radius=1]--cycle;\\node at (-2.5,0) {C};\\draw[purple,thick] (0,2) arc[start angle=90,end angle=270,x radius=0.7,y radius=2]--cycle;\\node at (2.5,1.5) {D};\\end{tikzpicture}\\n[/tikz]',
    structure: 'identify-ellipse-from-standard-equation',
    meaningfulCase: 'horizontal ellipse with semi-axis 2 in the x-direction and 1 in the y-direction',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'Represents a circle with equal horizontal and vertical semi-axes.' },
      { text: 'B', correct: true },
      { text: 'C', correct: false, why: 'Shows a vertically oriented ellipse rather than the required horizontal one.' },
      { text: 'D', correct: false, why: 'Shows a vertical ellipse with the larger semi-axis in the y-direction.' }
    ],
    solution_text: 'Rewrite the equation as $\\dfrac{x^2}{4}+y^2=1$. Thus the horizontal semi-axis is $2$ and the vertical semi-axis is $1$. The matching diagram is B.',
    diagramRequired: true,
    uncertainties: []
  },
  '11216': {
    question_text: 'The rectangular hyperbola $xy=200$ is stretched by scale factor $2$ in the $x$ direction and scale factor $5$ in the $y$ direction. What is the new equation?',
    structure: 'transform-equation-under-independent-coordinate-stretches',
    meaningfulCase: 'coordinate stretch changes the product constant by the product of the scale factors',
    mastery: false,
    options: [
      { text: '$xy=2000$', correct: true },
      { text: '$xy=500$', correct: false, why: 'Multiplies the constant by only one of the two stretch factors.' },
      { text: '$xy=80$', correct: false, why: 'Divides the constant by the product instead of applying the coordinate change.' },
      { text: '$xy=20$', correct: false, why: 'Divides by both stretch factors, reversing the required transformation.' }
    ],
    solution_text: 'Let the new coordinates be $X=2x$ and $Y=5y$. Then $x=\\dfrac{X}{2}$ and $y=\\dfrac{Y}{5}$. Substitution gives $\\dfrac{X}{2}\\cdot\\dfrac{Y}{5}=200$, so $XY=2000$. Therefore the new equation is $xy=2000$.',
    diagramRequired: false,
    uncertainties: []
  },
  '11223': {
    question_text: 'The correlation coefficient ($r$) for 10 pairs of bivariate data $(x,y)$ was calculated to be $0.2$. If the $x$ and $y$ values are all doubled, what is the new value for the correlation coefficient?',
    structure: 'invariance-of-correlation-under-positive-rescaling',
    meaningfulCase: 'positive scaling of both variables preserves the direction and strength of linear association',
    mastery: false,
    options: [
      { text: '$0.1$', correct: false, why: 'Halves the correlation coefficient even though both variables are scaled positively.' },
      { text: '$0.2$', correct: true },
      { text: '$0.4$', correct: false, why: 'Doubles the coefficient, confusing data scaling with a change in correlation.' },
      { text: '$0.8$', correct: false, why: 'Multiplies the coefficient by four without justification from correlation properties.' }
    ],
    solution_text: 'Correlation is unchanged when each variable is multiplied by a positive constant. Doubling both $x$ and $y$ therefore leaves the correlation coefficient equal to $0.2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '95274': {
    question_text: 'Below is the shoe size data for a group of students.\\n\\n$\\begin{array}{c|c}\\text{Shoe size, }x&\\text{Frequency, }f\\\\\\hline 4&7\\\\5&9\\\\6&11\\\\7&3\\end{array}$\\n\\nCalculate the variance.',
    structure: 'variance-from-discrete-frequency-table',
    meaningfulCase: 'population variance calculated from a small frequency table',
    mastery: false,
    options: [
      { text: '$0.942$', correct: false, why: 'Uses an incorrect mean or frequency total when evaluating the variance.' },
      { text: '$0.889$', correct: true },
      { text: '$-0.889$', correct: false, why: 'Variance cannot be negative because it is an average of squared deviations.' },
      { text: '$0.920$', correct: false, why: 'Rounds or combines the frequency-table moments incorrectly.' }
    ],
    solution_text: 'The total frequency is $30$ and $\\sum fx=160$, so $\\bar{x}=160/30=16/3$. Also $\\sum fx^2=880$. Hence\\n\\n$\\operatorname{Var}(X)=\\dfrac{880}{30}-\\left(\\dfrac{160}{30}\\right)^2=\\dfrac89\\approx0.889$.',
    diagramRequired: true,
    uncertainties: []
  },
  '97175': {
    question_text: 'Evaluate $1\\dfrac{3}{5}+2\\dfrac{4}{7}$.',
    structure: 'add-mixed-numbers-with-unlike-denominators',
    meaningfulCase: 'mixed-number addition requiring a common denominator and regrouping',
    mastery: false,
    options: [
      { text: '$4\\dfrac{8}{35}$', correct: false, why: 'Adds the fractional numerators without correctly combining the fifths and sevenths.' },
      { text: '$3\\dfrac{6}{12}$', correct: false, why: 'Combines unlike denominators as if they can be added directly.' },
      { text: '$3\\dfrac{7}{35}$', correct: false, why: 'Fails to regroup the improper fractional part after finding a common denominator.' },
      { text: '$4\\dfrac{6}{35}$', correct: true }
    ],
    solution_text: '$1\\dfrac35+2\\dfrac47=3+\\dfrac{21}{35}+\\dfrac{20}{35}=3\\dfrac{41}{35}=4\\dfrac6{35}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '100676': {
    question_text: 'A mass of $5\\text{ kg}$ is acted upon by a resultant force of $10\\mathbf{i}-5\\mathbf{j}\\text{ N}$. Which one of these facts is incorrect?',
    structure: 'apply-newtons-second-law-to-vector-force',
    meaningfulCase: 'vector force gives component acceleration and resultant magnitude',
    mastery: false,
    options: [
      { text: 'The magnitude of the acceleration of the particle is $5\\text{ m s}^{-2}$.', correct: false, why: 'The acceleration magnitude is actually $\\sqrt5$, not the stated value.' },
      { text: 'The acceleration of the particle is $2\\mathbf{i}-\\mathbf{j}\\text{ m s}^{-2}$.', correct: false, why: 'This is the correct acceleration vector obtained by dividing force by mass.' },
      { text: 'The magnitude of resultant force is $8.66\\text{ N}$.', correct: true },
      { text: 'The weight of the object is $49\\text{ N}$.', correct: false, why: 'Using $g=9.8$, the weight is $5(9.8)=49\\text{ N}$. ' }
    ],
    solution_text: 'The acceleration is $\\mathbf{a}=\\mathbf{F}/m=2\\mathbf{i}-\\mathbf{j}$. Its magnitude is $\\sqrt{2^2+(-1)^2}=\\sqrt5$, not $5$. The force magnitude is $\\sqrt{10^2+(-5)^2}=5\\sqrt5\\approx11.18\\text{ N}$, so the incorrect statement is the one claiming $8.66\\text{ N}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '102920': {
    question_text: 'The solutions of the equation $z^3+8i=0$ are',
    structure: 'solve-cubic-complex-equation-by-polar-roots',
    meaningfulCase: 'three cube roots of a purely imaginary complex number',
    mastery: false,
    options: [
      { text: '$\\sqrt3-i,\\ -2i,\\ 2i$', correct: false, why: 'Includes an incorrect negative imaginary root and omits one non-real root.' },
      { text: '$\\sqrt3-i,\\ -\\sqrt3-i,\\ 2i$', correct: true },
      { text: '$-\\sqrt3-i,\\ -2,\\ -2i$', correct: false, why: 'Uses a real root and the wrong signs for the cube roots.' },
      { text: '$-\\sqrt3-i,\\ \\sqrt3-i,\\ -2i$', correct: false, why: 'Has the wrong sign for the purely imaginary cube root.' }
    ],
    solution_text: '$z^3=-8i=8\\operatorname{cis}(-\\pi/2)$. The cube-root arguments are $-\\pi/6$, $\\pi/2$ and $7\\pi/6$. Thus the roots are $\\sqrt3-i$, $2i$ and $-\\sqrt3-i$, which is option B.',
    diagramRequired: false,
    uncertainties: []
  },
  '103535': {
    question_text: 'What statement is false?\\n\\n[tikz]\\n\\begin{tikzpicture}[scale=0.75]\\n\\coordinate (n1) at (0,0);\\coordinate (n2) at (2,0);\\coordinate (n3) at (3,1.3);\\coordinate (n4) at (3,-1.3);\\coordinate (n5) at (5,1.3);\\coordinate (n6) at (5,0);\\coordinate (n7) at (7,1.3);\\draw (n1)--node[above]{A}(n2);\\draw (n2)--node[above left]{B}(n3);\\draw (n2)--node[above]{C}(n6);\\draw (n2)--node[below left]{D}(n4);\\draw (n3)--node[above]{E}(n5);\\draw (n4)--node[right]{F}(n6);\\draw (n6)--node[above right]{G}(n7);\\foreach \\p in {n1,n2,n3,n4,n5,n6,n7} \\fill[white] (\\p) circle (3pt);\\foreach \\p in {n1,n2,n3,n4,n5,n6,n7} \\draw (\\p) circle (3pt);\\end{tikzpicture}\\n[/tikz]',
    structure: 'interpret-activity-network-precedence',
    meaningfulCase: 'identify a false dependency statement from network joins',
    mastery: false,
    options: [
      { text: 'Activity A does not depend on any of the other activities.', correct: false, why: 'Activity A starts the network, so this dependency statement is true.' },
      { text: 'Activity C depends on Activity A happening.', correct: false, why: 'The start node for C is reached after Activity A is completed.' },
      { text: 'Activity G depends on C and F happening.', correct: false, why: 'Both routes into the node before G must be complete.' },
      { text: 'Activity C depends on Activities B and D happening.', correct: true }
    ],
    solution_text: 'Activity C starts from the node reached after A, whereas B and D are separate branches from that node. Therefore C does not require both B and D to have happened. The false statement is D.',
    diagramRequired: true,
    uncertainties: []
  },
  '80160': {
    question_text: 'Solve $4x-3=\\lvert2-x\\rvert$.',
    structure: 'solve-linear-modulus-equation-by-cases',
    meaningfulCase: 'checking sign regions and rejecting an extraneous case solution',
    mastery: false,
    options: [
      { text: '$x=1$', correct: true },
      { text: '$x=\\dfrac13$', correct: false, why: 'Keeps the root from an invalid modulus case without checking its region.' },
      { text: '$x=\\dfrac13,\\ x=1$', correct: false, why: 'Accepts both algebraic case results even though one violates its case condition.' },
      { text: '$x=\\dfrac15,\\ x=\\dfrac53$', correct: false, why: 'Uses incorrect coefficients when solving the two linear equations.' }
    ],
    solution_text: 'For $x\\le2$, $\\lvert2-x\\rvert=2-x$, so $4x-3=2-x$ gives $x=1$. For $x\\ge2$, $\\lvert2-x\\rvert=x-2$, giving $x=1/3$, which is not in this region. Therefore the only solution is $x=1$.',
    diagramRequired: false,
    uncertainties: []
  },
  '104129': {
    question_text: 'Evaluate $\\displaystyle\\int_{-3}^{-1}\\frac{x^2+1}{x^3+3x}\\,dx$.',
    structure: 'definite-integration-by-partial-fractions',
    meaningfulCase: 'partial fractions with an absolute logarithm over a negative interval',
    mastery: false,
    options: [
      { text: '$-\\dfrac23\\ln(2)$', correct: false, why: 'Uses the wrong endpoint ratio after evaluating the logarithmic antiderivative.' },
      { text: '$-\\dfrac23\\ln(3)$', correct: true },
      { text: '$\\dfrac23\\ln(2)$', correct: false, why: 'Has the wrong sign and logarithm argument for the definite integral.' },
      { text: '$\\dfrac23\\ln(3)$', correct: false, why: 'Reverses the sign produced by the upper and lower endpoint substitution.' }
    ],
    solution_text: 'Decompose $\\dfrac{x^2+1}{x(x^2+3)}=\\dfrac{1}{3x}+\\dfrac{2x}{3(x^2+3)}$. An antiderivative is $\\dfrac13\\ln|x|+\\dfrac13\\ln(x^2+3)$. At $-1$ the log argument product is $4$, and at $-3$ it is $36$, so the value is $\\dfrac13\\ln(4/36)=-\\dfrac23\\ln3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '105422': {
    question_text: 'The plan of the garden $ABCDEA$ consists of a triangle $ABE$ joined to a sector $BCDE$ of a circle with radius $12\\text{ m}$ and centre $B$. The points $A$, $B$ and $C$ lie on a straight line with $AB=23\\text{ m}$ and $BC=12\\text{ m}$. Given that the size of angle $ABE$ is exactly $0.64$ radians, find the perimeter of the garden, giving your answer in metres, to 1 decimal place.\\n\\n[tikz]\\n\\begin{tikzpicture}[scale=0.55]\\n\\coordinate (A) at (-3,0);\\coordinate (B) at (0,0);\\coordinate (C) at (2,0);\\coordinate (E) at (-1.1,1.5);\\draw (A)--(E) arc[start angle=126,end angle=0,radius=2]--(C)--cycle;\\draw[dashed] (E)--(B);\\node[below] at (A) {$A$};\\node[below] at (B) {$B$};\\node[below] at (C) {$C$};\\node[above] at (E) {$E$};\\node at (-1.5,-0.25) {$23\\text{ m}$};\\node at (1,-0.25) {$12\\text{ m}$};\\node at (-0.5,0.7) {$12\\text{ m}$};\\node at (-0.9,0.25) {$0.64\\text{ rad}$};\\end{tikzpicture}\\n[/tikz]',
    structure: 'perimeter-of-triangle-and-sector-composite-region',
    meaningfulCase: 'combine a triangle side, a circular arc, and the straight diameter-side boundary',
    mastery: false,
    options: [
      { text: '$92.2\\text{ m}$', correct: false, why: 'Adds an incorrect straight segment or uses the wrong sector angle.' },
      { text: '$57.9\\text{ m}$', correct: false, why: 'Omits part of the outside boundary when combining the triangle and sector.' },
      { text: '$80.2\\text{ m}$', correct: true },
      { text: '$45.2\\text{ m}$', correct: false, why: 'Uses only a subset of the garden boundary and misses the long curved arc.' }
    ],
    solution_text: 'Since $A$, $B$, $C$ are collinear, $AC=35$. By the cosine rule, $AE^2=23^2+12^2-2(23)(12)\\cos(0.64)$, giving $AE\\approx15.2$. The sector angle is $\\pi-0.64$, so its arc length is $12(\\pi-0.64)\\approx30.0$. Thus the perimeter is $35+15.2+30.0\\approx80.2\\text{ m}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '11175': {
    question_text: 'Find $\\displaystyle\\int\\frac{2x+5}{x+1}\\,dx$.\\n\\nStep 1: Write $\\dfrac{2x+3}{x+1}$ in the form $a+\\dfrac{b}{x+1}$',
    structure: 'rewrite-linear-over-linear-fraction-before-integration',
    meaningfulCase: 'quotient decomposition into a constant plus a reciprocal term',
    mastery: false,
    options: [
      { text: '$2+\\dfrac4{x+1}$', correct: false, why: 'Expanding gives numerator $2x+6$, not the displayed $2x+3$.' },
      { text: '$2+\\dfrac3{x+1}$', correct: true },
      { text: '$3+\\dfrac2{x+1}$', correct: false, why: 'Uses the wrong constant quotient and therefore reconstructs a different numerator.' },
      { text: '$2+\\dfrac5{x+1}$', correct: false, why: 'Matches the integral numerator but not the separate Step 1 numerator shown.' }
    ],
    solution_text: '$2x+3=2(x+1)+1$, so $\\dfrac{2x+3}{x+1}=2+\\dfrac1{x+1}$. However, the option list shown contains $2+\\dfrac3{x+1}$ as the intended keyed response for the displayed Step 1 prompt. The image is internally inconsistent because the red integral has numerator $2x+5$.',
    diagramRequired: false,
    uncertainties: ['The red integral shows numerator 2x+5, while Step 1 asks for decomposition of 2x+3; the options key the latter as option B, but the exact algebra for 2x+3 would be 2+1/(x+1).']
  },
  '11209': {
    question_text: 'Which of the following diagrams matches the equation $x^2-y^2=1$?\\n\\n[tikz]\\n\\begin{tikzpicture}[scale=0.55]\\n\\draw[red,thick] (0,0) circle (1.2);\\node at (-2,1.5) {A};\\draw[blue,thick] (0.4,0) .. controls (0.8,1.2) and (1.5,1.2) .. (2.4,0);\\draw[blue,thick] (-0.4,0) .. controls (-0.8,-1.2) and (-1.5,-1.2) .. (-2.4,0);\\node at (-2.5,1.5) {B};\\draw[green!60!black,thick] (-2,1.3)--(0,0.7)--(2,1.3);\\draw[green!60!black,thick] (-2,-1.3)--(0,-0.7)--(2,-1.3);\\node at (-2,0) {C};\\draw[purple,thick] (1,0) .. controls (1,1.2) and (2,1.5) .. (2.4,2);\\draw[purple,thick] (-1,0) .. controls (-1,-1.2) and (-2,-1.5) .. (-2.4,-2);\\node at (2,1.5) {D};\\end{tikzpicture}\\n[/tikz]',
    structure: 'identify-horizontal-hyperbola-from-equation',
    meaningfulCase: 'hyperbola centred at the origin with transverse axis on the x-axis',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'Shows a circle rather than a hyperbola with two separate branches.' },
      { text: 'B', correct: false, why: 'Shows reciprocal-shaped branches with asymptotes on the coordinate axes.' },
      { text: 'C', correct: false, why: 'Shows a pair of vertically opening branches, not a horizontal hyperbola.' },
      { text: 'D', correct: true }
    ],
    solution_text: 'The equation is already in standard form $\\dfrac{x^2}{1^2}-\\dfrac{y^2}{1^2}=1$. Its vertices are $(\\pm1,0)$ and its branches open left and right. Therefore the matching diagram is D.',
    diagramRequired: true,
    uncertainties: []
  },
  '31769': {
    question_text: '$6$ pencils cost $£1.50$. How much do $3$ pencils cost?',
    structure: 'direct-proportion-scaling-by-unit-fraction',
    meaningfulCase: 'halving a cost when the quantity is halved',
    mastery: false,
    options: [
      { text: '$65p$', correct: false, why: 'Does not halve £1.50 correctly and gives an unrelated pence value.' },
      { text: '$0.75p$', correct: false, why: 'Uses the right numerical halving but writes an invalid currency unit.' },
      { text: '$75p$', correct: true },
      { text: '$25p$', correct: false, why: 'Divides the total cost by six rather than finding the cost of three pencils.' }
    ],
    solution_text: 'Three pencils are half as many as six, so the cost is half of $£1.50$: $£1.50\\div2=£0.75=75p$.',
    diagramRequired: false,
    uncertainties: []
  },
  '99257': {
    question_text: 'Find $\\dfrac{d}{dx}(\\sin^2 3x)$.',
    structure: 'differentiate-squared-trigonometric-composite-function',
    meaningfulCase: 'chain rule applied to an outer square and inner multiple-angle sine',
    mastery: false,
    options: [
      { text: '$6\\sin x\\cos x$', correct: false, why: 'Loses the inner argument $3x$ when applying the chain rule.' },
      { text: '$6\\sin 3x\\cos 3x$', correct: true },
      { text: '$-6\\sin x\\cos x$', correct: false, why: 'Uses the wrong sign and also loses the inner factor and argument.' },
      { text: '$-6\\sin 3x\\cos 3x$', correct: false, why: 'Introduces a negative sign even though differentiating sine gives positive cosine.' }
    ],
    solution_text: 'Write $\\sin^2(3x)=(\\sin(3x))^2$. The chain rule gives $2\\sin(3x)\\cos(3x)\\cdot3=6\\sin(3x)\\cos(3x)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '103406': {
    question_text: 'The probability distribution is modelled by $P(X=r)=k(r+1)$ for $r=1,2,3$, and $P(X=r)=0$ otherwise. What is the value of $k$?',
    structure: 'normalise-discrete-probability-mass-function',
    meaningfulCase: 'normalising a finite probability mass function whose terms depend linearly on the outcome',
    mastery: false,
    options: [
      { text: '$k=\\dfrac19$', correct: true },
      { text: '$k=\\dfrac16$', correct: false, why: 'Uses an incorrect total for the three probability weights.' },
      { text: '$9k$', correct: false, why: 'Gives the normalisation sum rather than solving for the constant.' },
      { text: 'Don’t know', correct: false, why: 'The probabilities can be summed directly to determine the constant.' }
    ],
    solution_text: 'The probabilities must sum to one: $k(2+3+4)=9k=1$. Therefore $k=\\dfrac19$.',
    diagramRequired: false,
    uncertainties: []
  },
  '103410': {
    question_text: '$\\begin{array}{c|cccc}r&1&2&3&4\\\\\\hline P(X=r)&0.3&0.4&0.2&0.1\\end{array}$\\n\\nWhat is the best word/phrase to describe the distribution?',
    structure: 'classify-skewness-from-discrete-distribution',
    meaningfulCase: 'right-tailed discrete distribution with mean greater than median',
    mastery: false,
    options: [
      { text: 'Symmetrical', correct: false, why: 'The probabilities are not balanced around a central value.' },
      { text: 'Positive skew', correct: true },
      { text: 'Bimodal', correct: false, why: 'There is one largest probability, not two distinct modes.' },
      { text: 'Negative skew', correct: false, why: 'The longer tail is toward larger values, indicating positive skew.' }
    ],
    solution_text: 'Most probability is at the lower values, with a tail extending toward $r=4$. The mean is $2.1$, above the median $2$, so the distribution is positively skewed.',
    diagramRequired: true,
    uncertainties: []
  },
  '105101': {
    question_text: 'I wish to make a list that includes each of the numbers $1,2,3,4,5$ and $6$ exactly once so that at least one pair of numbers next to each other in the list has a product that is a multiple of $6$. How many different such lists can I make?',
    structure: 'count-permutations-with-adjacency-condition',
    meaningfulCase: 'permutations constrained by at least one adjacent product divisible by six',
    mastery: false,
    options: [
      { text: '$6$', correct: false, why: 'Counts only arrangements of a single selected adjacency and ignores the remaining positions.' },
      { text: '$30$', correct: false, why: 'Undercounts the many permutations satisfying the adjacency condition.' },
      { text: '$60$', correct: false, why: 'Still undercounts after accounting for all possible qualifying adjacent pairs.' },
      { text: '$720$', correct: true }
    ],
    solution_text: 'The source options do not contain the independently calculated count. There are $6!=720$ total lists; the complementary count with no qualifying adjacent pair is $24$, giving $720-24=696$. Thus none of the displayed options equals the exact count, although $720$ is the keyed option.',
    diagramRequired: false,
    uncertainties: ['Independent counting gives 696 lists, but the displayed options are 6, 30, 60 and 720; no option is mathematically exact.']
  },
  '175231': {
    question_text: 'A baker uses $800\\text{ g}$ of flour to make 4 loaves. How much flour will be needed to make 9 loaves?',
    structure: 'direct-proportion-unit-rate',
    meaningfulCase: 'scale a recipe from four loaves to nine loaves',
    mastery: false,
    options: [
      { text: '$7200\\text{ g}$', correct: false, why: 'Multiplies 800 by 9 without first dividing by the four loaves.' },
      { text: '$1440\\text{ g}$', correct: false, why: 'Uses an incorrect scale factor for converting four loaves to nine.' },
      { text: '$1800\\text{ g}$', correct: true }
    ],
    solution_text: 'Each loaf uses $800\\div4=200\\text{ g}$. For 9 loaves the amount is $9(200)=1800\\text{ g}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '3563': {
    question_text: 'A function has been differentiated to give $\\dfrac{dy}{dx}=x-3$. What would be the gradient of the normal when $x=5$?',
    structure: 'gradient-of-normal-from-tangent-gradient',
    meaningfulCase: 'negative reciprocal of a non-unit tangent gradient',
    mastery: false,
    options: [
      { text: '$1$', correct: false, why: 'Does not evaluate the tangent gradient correctly at x=5.' },
      { text: '$-2$', correct: false, why: 'Uses the tangent gradient itself rather than its negative reciprocal.' },
      { text: '$2$', correct: false, why: 'Uses the positive tangent gradient instead of the normal gradient.' },
      { text: '$-\\dfrac12$', correct: true }
    ],
    solution_text: 'At $x=5$, the tangent gradient is $5-3=2$. The normal gradient is the negative reciprocal, $-1/2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '70335': {
    question_text: 'The four possible outcomes of an experiment are $A$, $B$, $C$ and $D$. $P(A)=0.28$, $P(B)=2P(A)$ and $P(C)=P(D)$. Work out $P(D)$.',
    structure: 'find-unknown-probability-from-total-and-equality',
    meaningfulCase: 'split the remaining probability equally between two outcomes',
    mastery: false,
    options: [
      { text: '$0.08$', correct: true },
      { text: '$0.16$', correct: false, why: 'Uses the combined remaining probability without splitting it between C and D.' },
      { text: '$0.84$', correct: false, why: 'Treats the complement of A as the probability of D alone.' },
      { text: '$0.56$', correct: false, why: 'Uses P(B) as P(D), ignoring the equality and total probability condition.' }
    ],
    solution_text: '$P(B)=2(0.28)=0.56$. Therefore $P(C)+P(D)=1-0.28-0.56=0.16$. Since they are equal, $P(D)=0.16/2=0.08$.',
    diagramRequired: false,
    uncertainties: []
  },
  '80088': {
    question_text: 'What is the coefficient of $x^2$ in $(2x+3)^3$?',
    structure: 'extract-coefficient-from-binomial-expansion',
    meaningfulCase: 'choose the term containing two factors of 2x in a cubic expansion',
    mastery: false,
    options: [
      { text: '$3$', correct: false, why: 'Uses only the binomial coefficient and omits the powers of both terms.' },
      { text: '$36$', correct: true },
      { text: '$12$', correct: false, why: 'Misses the factor of 3 from the constant term in the selected product.' },
      { text: '$24$', correct: false, why: 'Uses an incorrect combination of the coefficient and binomial factor.' }
    ],
    solution_text: 'The $x^2$ term is $\\binom32(2x)^2(3)=3\\cdot4\\cdot3x^2=36x^2$. Therefore the coefficient is $36$.',
    diagramRequired: true,
    uncertainties: []
  },
  '11263': {
    question_text: 'What does $\\displaystyle\\lim_{x\\to\\infty}\\frac{\\sin x}{x}$ equal?',
    structure: 'evaluate-oscillatory-function-over-growing-denominator-limit',
    meaningfulCase: 'bounded numerator divided by an unbounded positive denominator',
    mastery: false,
    options: [
      { text: '$0$', correct: true },
      { text: '$1$', correct: false, why: 'Confuses this limit with the small-angle limit near zero.' },
      { text: '$\\infty$', correct: false, why: 'The numerator remains bounded while the denominator grows without bound.' },
      { text: 'Undefined', correct: false, why: 'The squeeze theorem establishes a well-defined limit of zero.' }
    ],
    solution_text: 'Because $-1\\le\\sin x\\le1$, dividing by $x>0$ gives $-1/x\\le\\sin x/x\\le1/x$. Both bounds tend to zero, so the squeeze theorem gives the limit $0$.',
    diagramRequired: false,
    uncertainties: []
  },
  '11158': {
    question_text: 'What are the equations of the asymptotes of the function $y=\\dfrac{x^2-4}{x^2+x-12}$?',
    structure: 'find-asymptotes-of-factorised-rational-function',
    meaningfulCase: 'vertical asymptotes from denominator zeros and horizontal asymptote from leading coefficients',
    mastery: false,
    options: [
      { text: '$x=-3$, $x=4$, $y=1$', correct: false, why: 'Uses the roots of an incorrectly factored denominator.' },
      { text: '$x=3$, $x=-4$, $y=1$', correct: true },
      { text: '$x=\\pm2$, $x=3$, $y=-4$', correct: false, why: 'Treats numerator zeros as vertical asymptotes and misreads the horizontal limit.' },
      { text: '$x=-3$, $x=4$, $y=0$', correct: false, why: 'Uses incorrect denominator roots and assumes the horizontal asymptote is zero.' }
    ],
    solution_text: 'Factor the denominator: $x^2+x-12=(x+4)(x-3)$. Thus the vertical asymptotes are $x=-4$ and $x=3$. Since the degrees and leading coefficients match, the horizontal asymptote is $y=1$.',
    diagramRequired: false,
    uncertainties: []
  },
  '11225': {
    question_text: 'Using a calculator, work out the value of $a$ in the regression line in the form $y=a+bx$ for the data $\\begin{array}{c|ccccc}x&12&19&3&10&4\\\\\\hline y&8&5&9&12&18\\end{array}$.',
    structure: 'calculate-regression-intercept-from-bivariate-data',
    meaningfulCase: 'least-squares regression intercept with a negative slope',
    mastery: false,
    options: [
      { text: '$15.46$', correct: true },
      { text: '$-0.53$', correct: false, why: 'Gives the approximate regression gradient b rather than the intercept a.' },
      { text: '$9.6$', correct: false, why: 'Uses the mean x-value instead of calculating the regression intercept.' },
      { text: '$-0.70$', correct: false, why: 'Uses an incorrect slope or sign when fitting the regression line.' }
    ],
    solution_text: 'For the data, $\\bar{x}=9.6$ and $\\bar{y}=10.4$. The regression gradient is $b\\approx-0.528$. Hence $a=\\bar{y}-b\\bar{x}=10.4-(-0.528)(9.6)\\approx15.46$.',
    diagramRequired: true,
    uncertainties: []
  },
  '121209': {
    question_text: 'A probability distribution is given by $P(X=x)=0.1x$ for $x=1,2,3,4$. What is $P(X>2)$?',
    structure: 'sum-tail-probabilities-from-discrete-pmf',
    meaningfulCase: 'add the probabilities for outcomes strictly above a threshold',
    mastery: false,
    options: [
      { text: '$0.9$', correct: false, why: 'Adds the probabilities for all outcomes rather than only those above 2.' },
      { text: '$0.1$', correct: false, why: 'Uses only the probability at x=1 instead of the upper tail.' },
      { text: '$0.7$', correct: true },
      { text: '$0.2$', correct: false, why: 'Uses only one of the two outcomes satisfying x greater than 2.' }
    ],
    solution_text: '$P(X>2)=P(X=3)+P(X=4)=0.1(3)+0.1(4)=0.3+0.4=0.7$.',
    diagramRequired: false,
    uncertainties: []
  },
  '122071': {
    question_text: 'At a point on a parametric curve where the tangent is horizontal, which of these is always true?',
    structure: 'interpret-horizontal-tangent-in-parametric-form',
    meaningfulCase: 'horizontal tangent requires zero y-rate when the x-rate is nonzero',
    mastery: false,
    options: [
      { text: '$\\dfrac{dy}{dt}=0$', correct: true },
      { text: '$\\dfrac{dy}{dt}=0$ and $\\dfrac{dx}{dt}=0$', correct: false, why: 'A horizontal tangent normally requires a nonzero x-rate, not both rates zero.' },
      { text: '$\\dfrac{dx}{dt}=0$', correct: false, why: 'A zero x-rate corresponds to a vertical-tangent condition, not horizontal.' },
      { text: 'Neither $\\dfrac{dy}{dt}=0$ nor $\\dfrac{dx}{dt}=0$', correct: false, why: 'A horizontal tangent has zero change in y with respect to the parameter.' }
    ],
    solution_text: 'For a parametric curve, $\\dfrac{dy}{dx}=\\dfrac{dy/dt}{dx/dt}$. A horizontal tangent has gradient zero, so $dy/dt=0$ provided $dx/dt\\ne0$.',
    diagramRequired: false,
    uncertainties: []
  },
  '102919': {
    question_text: 'The zeroes of the polynomial $2x^2+6x+7$ are $\\alpha$ and $\\beta$. The value of $|\\alpha-\\beta|$ is',
    structure: 'find-root-separation-from-quadratic-discriminant',
    meaningfulCase: 'complex conjugate roots with separation magnitude from a negative discriminant',
    mastery: false,
    options: [
      { text: '$\\sqrt5$', correct: true },
      { text: '$2\\sqrt5$', correct: false, why: 'Omits the division by the quadratic leading coefficient.' },
      { text: '$4\\sqrt5$', correct: false, why: 'Uses an incorrect multiple of the discriminant square root.' },
      { text: '$\\dfrac{\\sqrt{10}}2$', correct: false, why: 'Simplifies the negative discriminant and root separation incorrectly.' }
    ],
    solution_text: 'For $ax^2+bx+c$, the root difference is $\\dfrac{\\sqrt{b^2-4ac}}{a}$. Here $b^2-4ac=36-56=-20$, so $|\\alpha-\\beta|=\\dfrac{\\sqrt{20}}2=\\sqrt5$.',
    diagramRequired: false,
    uncertainties: []
  },
  '21870': {
    question_text: 'An object of mass $6\\text{ kg}$ is pushed with a force of $12\\text{ N}$. Calculate the distance it travels in $5$ seconds if it started at rest.',
    structure: 'constant-acceleration-distance-from-force-and-mass',
    meaningfulCase: 'start from rest with acceleration found using Newton’s second law',
    mastery: false,
    options: [
      { text: '$360\\text{ m}$', correct: false, why: 'Uses an incorrect acceleration or omits the factor one half in displacement.' },
      { text: '$10\\text{ m}$', correct: false, why: 'Uses the wrong time dependence for distance under constant acceleration.' },
      { text: '$900\\text{ m}$', correct: false, why: 'Squares the time but fails to divide by two and uses an incorrect acceleration.' },
      { text: '$25\\text{ m}$', correct: true }
    ],
    solution_text: 'The acceleration is $a=F/m=12/6=2\\text{ m s}^{-2}$. Starting from rest, $s=ut+\\dfrac12at^2=0+\\dfrac12(2)(5^2)=25\\text{ m}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '31780': {
    question_text: 'The area of the square is $100\\text{ cm}^2$. What is the length of one side?',
    structure: 'find-square-side-from-area',
    meaningfulCase: 'take the positive square root of an area to obtain a length',
    mastery: false,
    options: [
      { text: '$25\\text{ cm}$', correct: false, why: 'Divides the area by four instead of taking its square root.' },
      { text: '$50\\text{ cm}$', correct: false, why: 'Halves the area rather than finding the side length of a square.' },
      { text: '$10\\text{ cm}^2$', correct: false, why: 'Has the correct numerical value but retains square units for a length.' },
      { text: '$10\\text{ cm}$', correct: true }
    ],
    solution_text: 'For side length $s$, the area is $s^2=100$. Taking the positive root gives $s=\\sqrt{100}=10\\text{ cm}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '66515': {
    question_text: 'Which option gives the vector product $\\overrightarrow{AB}\\times\\overrightarrow{BC}$ where $\\overrightarrow{AB}=(-1,1,1)$ and $\\overrightarrow{BC}=(1,5,-2)$?',
    structure: 'calculate-three-dimensional-vector-product',
    meaningfulCase: 'cross product using the determinant components and orientation',
    mastery: false,
    options: [
      { text: '$2$', correct: false, why: 'A cross product is a vector, not the scalar dot-product-style answer.' },
      { text: '$-6\\mathbf{i}+7\\mathbf{j}+\\mathbf{k}$', correct: false, why: 'Uses incorrect component signs in the cross-product calculation.' },
      { text: '$-\\mathbf{i}+5\\mathbf{j}-2\\mathbf{k}$', correct: false, why: 'Repeats the second vector instead of calculating the cross product.' },
      { text: '$-7\\mathbf{i}-\\mathbf{j}-6\\mathbf{k}$', correct: true }
    ],
    solution_text: 'Using the determinant, $(-1,1,1)\\times(1,5,-2)=(-7,-1,-6)$. Hence the vector product is $-7\\mathbf{i}-\\mathbf{j}-6\\mathbf{k}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '7647': {
    question_text: 'This is the table of values for $y=x^2-1$: $\\begin{array}{c|ccccc}x&-4&-1&0&1&3\\\\\\hline y&\\star&&-1&0&\\end{array}$. What should replace the star?',
    structure: 'evaluate-quadratic-from-table-input',
    meaningfulCase: 'substitute a negative input into a quadratic expression',
    mastery: false,
    options: [
      { text: '$-15$', correct: false, why: 'Subtracts 1 from 4 rather than squaring the input -4.' },
      { text: '$-17$', correct: false, why: 'Keeps the negative sign after squaring the input.' },
      { text: '$7$', correct: false, why: 'Uses an incorrect square for negative four.' },
      { text: '$15$', correct: true }
    ],
    solution_text: 'At $x=-4$, $y=(-4)^2-1=16-1=15$.',
    diagramRequired: true,
    uncertainties: []
  },
  '95457': {
    question_text: 'What is the order of rotational symmetry of this shape?',
    structure: 'identify-rotational-symmetry-order',
    meaningfulCase: 'twofold rotational symmetry of a symmetric lens-shaped figure',
    mastery: false,
    options: [
      { text: '$0$', correct: false, why: 'A nonzero order is required for a shape with rotational symmetry.' },
      { text: '$1$', correct: false, why: 'Order one would describe only the full-turn identity rotation.' },
      { text: '$2$', correct: true },
      { text: '$4$', correct: false, why: 'A quarter-turn does not map the lens-shaped figure onto itself.' }
    ],
    solution_text: 'A half-turn of $180^{\\circ}$ maps the two equal overlapping circles and their lens outline onto themselves. Therefore the order of rotational symmetry is $2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '125074': {
    question_text: 'If $X\\sim N(20,100)$ and $P(X>k)=0.95$, what is the value of $k$?',
    structure: 'invert-normal-tail-probability',
    meaningfulCase: 'upper-tail probability above 0.5 gives a value below the mean',
    mastery: false,
    options: [
      { text: '$36.4$', correct: false, why: 'Uses the upper positive standard-normal quantile instead of the lower one.' },
      { text: '$3.55$', correct: true },
      { text: '$0.972$', correct: false, why: 'Confuses a probability value with the required value of k.' },
      { text: '$-144$', correct: false, why: 'Uses an incorrect standardisation and produces an impossible scale here.' }
    ],
    solution_text: '$P(X>k)=0.95$ means $P(X\\le k)=0.05$. The 5th percentile has $z\\approx-1.645$. With mean $20$ and standard deviation $10$, $k=20+10(-1.645)\\approx3.55$.',
    diagramRequired: false,
    uncertainties: []
  },
  '125745': {
    question_text: 'Find $\\displaystyle\\int4xe^x\\,dx$.',
    structure: 'integrate-product-by-parts',
    meaningfulCase: 'product of a linear polynomial and an exponential function',
    mastery: false,
    options: [
      { text: '$4xe^x-4e^x+c$', correct: true },
      { text: '$8e^x+c$', correct: false, why: 'Differentiates the product incorrectly and loses the x-dependent term.' },
      { text: '$4xe^x+4e^x+c$', correct: false, why: 'Uses the wrong sign for the integration-by-parts correction term.' },
      { text: '$c$', correct: false, why: 'Treats a nonzero integrand as though its antiderivative were constant.' }
    ],
    solution_text: 'Since $\\dfrac{d}{dx}(e^x(x-1))=xe^x$, an antiderivative is $4e^x(x-1)+c=4xe^x-4e^x+c$.',
    diagramRequired: false,
    uncertainties: []
  },
  '126481': {
    question_text: 'Which range is incorrect?',
    structure: 'state-principal-ranges-of-inverse-trigonometric-functions',
    meaningfulCase: 'distinguish inclusive inverse-sine/cosine ranges from strict inverse-tangent range',
    mastery: false,
    options: [
      { text: '$-\\dfrac\\pi2\\le\\arcsin x\\le\\dfrac\\pi2$', correct: false, why: 'This is the correct principal range for inverse sine.' },
      { text: '$-\\dfrac\\pi2\\le\\arctan x\\le\\dfrac\\pi2$', correct: true },
      { text: '$0\\le\\arccos x\\le\\pi$', correct: false, why: 'This is the correct principal range for inverse cosine.' },
      { text: '$0\\le\\arccos(2x)\\le\\pi$', correct: false, why: 'The output range of arccos remains from zero to pi when defined.' }
    ],
    solution_text: 'The principal range of $\\arctan x$ is strict: $-\\pi/2<\\arctan x<\\pi/2$. It never reaches the endpoints, so the inclusive inequality in B is incorrect.',
    diagramRequired: false,
    uncertainties: []
  },
  '154484': {
    question_text: 'Which dot shows the point $(-1,-4)$?',
    structure: 'locate-point-from-cartesian-coordinates',
    meaningfulCase: 'read a point in the third quadrant from its signed coordinates',
    mastery: false,
    options: [
      { text: 'A', correct: true },
      { text: 'B', correct: false, why: 'This dot has a negative x-coordinate near -4, not -1.' },
      { text: 'C', correct: false, why: 'This dot lies on the y-axis near y=-1, not at (-1,-4).' },
      { text: 'D', correct: false, why: 'This dot lies in the fourth quadrant near (4,-1).' }
    ],
    solution_text: 'The point $(-1,-4)$ is one unit left of the y-axis and four units below the x-axis. This is dot A.',
    diagramRequired: true,
    uncertainties: []
  },
  '17306': {
    question_text: 'An arithmetic sequence has a 3rd term of $10$ and a 5th term of $6$. Which of the following would correctly work out the sum of the first 15 terms?',
    structure: 'choose-arithmetic-series-sum-expression',
    meaningfulCase: 'derive first term and common difference from nonconsecutive terms',
    mastery: false,
    options: [
      { text: '$\\dfrac{15}{2}(2(14)+(14)(-2))$', correct: true },
      { text: '$15(2(15)+(14)(2))$', correct: false, why: 'Omits the one-half factor and uses an incorrect sign and indexing.' },
      { text: '$\\dfrac{15}{2}(2(14)+(15)(2))$', correct: false, why: 'Uses a positive difference and therefore does not match the given terms.' },
      { text: '$\\dfrac{15}{2}(2(12)+(16)(-4))$', correct: false, why: 'Uses incorrect first-term and common-difference values.' }
    ],
    solution_text: 'The difference satisfies $2d=6-10=-4$, so $d=-2$. Since $a_3=a+2d=10$, $a=14$. Thus $S_{15}=\\dfrac{15}{2}(2(14)+14(-2))$, which is option A.',
    diagramRequired: false,
    uncertainties: []
  },
  '18426': {
    question_text: 'Shape $P$ is transformed to shape $Q$ by a rotation $90^\\circ$ anticlockwise, centre $O$, followed by a reflection in the line $y=x$. Which statement describes fully how to transform shape $Q$ to shape $P$?',
    structure: 'invert-composite-transformation-in-reverse-order',
    meaningfulCase: 'inverse of a rotation-reflection composition reverses order and reverses the rotation',
    mastery: false,
    options: [
      { text: 'Rotate $90^\\circ$ anticlockwise, centre $O$, followed by reflection in $y=x$.', correct: false, why: 'Repeats the original transformation instead of applying its inverse.' },
      { text: 'Reflection in $y=x$, followed by rotate $90^\\circ$ clockwise, centre $O$.', correct: true },
      { text: 'Rotate $90^\\circ$ clockwise, centre $O$, followed by reflection in $y=x$.', correct: false, why: 'Reverses the rotation but not the order of the composite transformations.' },
      { text: 'Reflection in $y=x$, centre $O$, followed by rotate $90^\\circ$ anticlockwise, centre $O$.', correct: false, why: 'Reverses the order but keeps the rotation direction rather than inverting it.' }
    ],
    solution_text: 'If $Q=SR(P)$, where $R$ is the anticlockwise rotation and $S$ the reflection, then $P=R^{-1}S(Q)$. Thus reflect first in $y=x$, then rotate $90^\\circ$ clockwise about $O$.',
    diagramRequired: false,
    uncertainties: []
  },
  '3350': {
    question_text: 'The diagram shows the curves $y=\\sin x$ and $y=\\cos x$ for $0\\le x\\le\\dfrac\\pi2$. Find an expression for the shaded area.',
    structure: 'express-area-between-intersecting-trigonometric-curves',
    meaningfulCase: 'split at x=pi/4 because the upper and lower curves exchange order',
    mastery: false,
    options: [
      { text: '$\\displaystyle\\int_0^{\\pi/4}\\sin x\\,dx+\\int_{\\pi/4}^{\\pi/2}\\cos x\\,dx$', correct: true },
      { text: '$\\displaystyle\\int_0^{\\pi/2}(\\cos x-\\sin x)\\,dx$', correct: false, why: 'Becomes negative on the second half where sine is above cosine.' },
      { text: '$\\displaystyle\\int_0^{\\pi/2}(\\sin x-\\cos x)\\,dx$', correct: false, why: 'Becomes negative on the first half where cosine is above sine.' },
      { text: '$\\displaystyle\\int_0^{\\pi/2}(\\sin x+\\cos x)\\,dx$', correct: false, why: 'Adds the areas under both curves instead of the shaded region between them.' }
    ],
    solution_text: 'The curves meet at $x=\\pi/4$. From $0$ to $\\pi/4$, the shaded region lies under $\\sin x$; from $\\pi/4$ to $\\pi/2$, it lies under $\\cos x$. Therefore option A gives the area.',
    diagramRequired: true,
    uncertainties: []
  },
  '11670': {
    question_text: 'According to the graph, what is the solution to the equation $x^2+5x-6=0$?',
    structure: 'read-quadratic-roots-from-graph',
    meaningfulCase: 'x-intercepts of an upward-opening quadratic',
    mastery: false,
    options: [
      { text: '$x=-2.5,\\ x=-12$', correct: false, why: 'Reads the vertex and an off-scale value rather than the x-intercepts.' },
      { text: '$y=-6$', correct: false, why: 'Confuses the y-coordinate of the vertex with the roots.' },
      { text: '$x=1,\\ x=-6$', correct: true },
      { text: '$x=-1,\\ x=6$', correct: false, why: 'Reverses the signs of both x-intercepts.' }
    ],
    solution_text: 'The solutions are the x-values where the graph crosses the x-axis. These are $x=-6$ and $x=1$.',
    diagramRequired: true,
    uncertainties: []
  },
  '20790': {
    question_text: 'The table shows the marking time $m$ for a maths competition depending on the number of teachers $t$: $\\begin{array}{c|cccccccc}t&1&2&3&4&5&6&7&8\\\\\\hline m&280&253&207&161&119&81&54&27\\end{array}$. Use your graphic display calculator to write down the equation of the regression line $m$ on $t$.',
    structure: 'select-linear-regression-equation-from-frequency-like-data',
    meaningfulCase: 'negative linear association between teacher count and marking time',
    mastery: false,
    options: [
      { text: '$m=318-38t$', correct: true },
      { text: '$m=80-0.99t$', correct: false, why: 'Has a slope far too small for the observed fall in marking time.' },
      { text: '$m=38t-318$', correct: false, why: 'Uses the wrong slope direction and produces negative times for larger t.' },
      { text: '$m=8.36-0.03t$', correct: false, why: 'Uses incorrect scales for both the intercept and the gradient.' }
    ],
    solution_text: 'The marking time decreases by roughly $36$ to $38$ minutes per additional teacher, and the fitted intercept is about $318$. Thus the regression equation is $m=318-38t$.',
    diagramRequired: true,
    uncertainties: []
  },
  '28519': {
    question_text: 'Which pairs of signs should go in the boxes to make two true statements?\\n\\n$5.65\\ \u25a1\\ 5.7$\\n\\n$-4.5\\ \u25a1\\ -4.4$',
    structure: 'compare-positive-and-negative-decimal-numbers',
    meaningfulCase: 'negative decimal comparison reverses intuition about magnitude',
    mastery: false,
    options: [
      { text: '$<,<$', correct: true },
      { text: '$<,>$', correct: false, why: 'Reverses the comparison between the two negative numbers.' },
      { text: '$>,<$', correct: false, why: 'Reverses the comparison between the two positive numbers.' },
      { text: '$>,>$', correct: false, why: 'Reverses both decimal comparisons.' }
    ],
    solution_text: 'Since $5.65$ is less than $5.70$, the first sign is $<$. Among negative numbers, $-4.5$ is less than $-4.4$, so the second sign is also $<$.',
    diagramRequired: true,
    uncertainties: []
  },
  '21817': {
    question_text: 'A force of $200\\text{ N}$ acts on a car of mass $800\\text{ kg}$. The acceleration of the car is...',
    structure: 'calculate-acceleration-from-force-and-mass',
    meaningfulCase: 'apply Newton’s second law with a large mass and force',
    mastery: false,
    options: [
      { text: '$0.025\\text{ m s}^{-2}$', correct: false, why: 'Divides the mass by the force rather than force by mass.' },
      { text: '$4\\text{ m s}^{-2}$', correct: false, why: 'Uses an incorrect quotient for the given force and mass.' },
      { text: '$1600\\text{ m s}^{-2}$', correct: false, why: 'Multiplies the force and mass instead of dividing them.' },
      { text: '$0.25\\text{ m s}^{-2}$', correct: true }
    ],
    solution_text: 'Newton’s second law gives $a=F/m=200/800=0.25\\text{ m s}^{-2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '66516': {
    question_text: 'Which option gives the equation of the plane containing the points $A(3,1,3)$, $B(2,2,4)$ and $C(3,7,2)$?',
    structure: 'find-plane-equation-through-three-points',
    meaningfulCase: 'obtain a normal from two spanning vectors and use a point in the plane',
    mastery: false,
    options: [
      { text: '$7x+y+6z=-40$', correct: false, why: 'Has the correct normal coefficients but the wrong constant sign.' },
      { text: '$-x+5y-2z=-4$', correct: false, why: 'Does not contain the three given points when substituted.' },
      { text: '$7x+y+6z=40$', correct: true },
      { text: '$-6x+7y+z=-8$', correct: false, why: 'Uses a vector unrelated to the normal of the required plane.' }
    ],
    solution_text: 'Take $\\overrightarrow{AB}=(-1,1,1)$ and $\\overrightarrow{AC}=(0,6,-1)$. Their cross product is proportional to $(7,1,6)$. Through $A(3,1,3)$, the plane is $7(x-3)+(y-1)+6(z-3)=0$, hence $7x+y+6z=40$.',
    diagramRequired: true,
    uncertainties: []
  },
  '119566': {
    question_text: 'If we have a bag and want to fill it with $3/4$ of balls, which response is most appropriate to represent this situation?',
    structure: 'identify-representation-of-three-quarters',
    meaningfulCase: 'part-whole representation with three of four equal regions filled',
    mastery: false,
    options: [
      { text: 'A', correct: true },
      { text: 'B', correct: false, why: 'Shows a number line rather than the most direct filled-bag part-whole model.' },
      { text: 'C', correct: false, why: 'Shows a different collection arrangement that does not clearly encode three quarters.' },
      { text: 'D: $3:4$', correct: false, why: 'Gives a ratio notation rather than the requested filled fraction representation.' }
    ],
    solution_text: 'The image in A divides the whole into four equal parts and fills three of them, directly representing $3/4$.',
    diagramRequired: true,
    uncertainties: ['The source prompt is in Catalan; the transcription translates it as asking for the most appropriate representation of filling a bag three-quarters full.']
  },
  '121303': {
    question_text: 'Given that $X\\sim B(7,0.25)$, what is $P(X=5)$?',
    structure: 'evaluate-binomial-exact-probability',
    meaningfulCase: 'exactly five successes in seven Bernoulli trials',
    mastery: false,
    options: [
      { text: '$(0.25)^5(0.75)^2$', correct: false, why: 'Omits the binomial coefficient counting the possible success positions.' },
      { text: '$\\binom52(0.25)^5(0.75)^2$', correct: false, why: 'Uses the wrong upper number in the binomial coefficient.' },
      { text: '$\\binom75(0.25)^5(0.75)^2$', correct: true },
      { text: '$(0.25)^5$', correct: false, why: 'Omits both the failure probability and the combinations factor.' }
    ],
    solution_text: 'For a binomial variable, $P(X=r)=\\binom nrp^rq^{n-r}$. With $n=7$, $r=5$, $p=0.25$ and $q=0.75$, the expression is $\\binom75(0.25)^5(0.75)^2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '126588': {
    question_text: 'In triangle $OAB$, $\\overrightarrow{OA}=2\\mathbf a$, $\\overrightarrow{OB}=2\\mathbf b$, and $P$ is the point on $AB$ such that $AP:PB=5:3$. If $\\overrightarrow{OP}=k(3\\mathbf a+5\\mathbf b)$, find $k$.',
    structure: 'section-vector-position-ratio',
    meaningfulCase: 'internal division of a segment in a vector triangle',
    mastery: false,
    options: [
      { text: '$\\dfrac14$', correct: true },
      { text: '$\\dfrac27$', correct: false, why: 'Uses the ratio denominator incorrectly when weighting the endpoint vectors.' },
      { text: '$\\dfrac12$', correct: false, why: 'Does not account for the given 5:3 internal division ratio.' },
      { text: '$\\dfrac17$', correct: false, why: 'Uses the total ratio as though both position vectors had unit coefficients.' }
    ],
    solution_text: 'Since $AP:PB=5:3$, $\\overrightarrow{OP}=\\dfrac{3\\overrightarrow{OA}+5\\overrightarrow{OB}}8=\\dfrac{3(2\\mathbf a)+5(2\\mathbf b)}8=\\dfrac14(3\\mathbf a+5\\mathbf b)$. Hence $k=\\dfrac14$.',
    diagramRequired: true,
    uncertainties: []
  },
  '26562': {
    question_text: 'Shape A has been rotated $180^\\circ$ to form image B. Which combination of transformations would also transfer shape A into shape B?',
    structure: 'identify-equivalent-composite-transformation',
    meaningfulCase: 'a half-turn represented by translation followed by reflection',
    mastery: false,
    options: [
      { text: 'Reflection in $x=0$ followed by translation by $(0,-4)$.', correct: false, why: 'Produces the wrong vertical placement after reflecting in the y-axis.' },
      { text: 'Reflection in $y=0$ followed by translation by $(-4,0)$.', correct: false, why: 'Uses the wrong translation direction and does not match the image.' },
      { text: 'Translation by $(-6,0)$ followed by reflection in the x-axis.', correct: true },
      { text: 'Translation by $(0,-6)$ followed by reflection in the x-axis.', correct: false, why: 'Translates vertically instead of horizontally between the two shapes.' }
    ],
    solution_text: 'A rotation of $180^\\circ$ maps $(x,y)$ to $(-x,-y)$. Translating by $(-6,0)$ and then reflecting in the x-axis maps $(x,y)$ to $(x-6,-y)$, which matches the displayed image B.',
    diagramRequired: true,
    uncertainties: []
  },
  '81743': {
    question_text: 'Solve $\\cos\\theta=-\\dfrac{\\sqrt2}{2}$, giving all possible solutions in the range $0^\\circ\\le\\theta\\le360^\\circ$.',
    structure: 'solve-cosine-equation-in-degree-range',
    meaningfulCase: 'negative cosine gives solutions in quadrants II and III',
    mastery: false,
    options: [
      { text: '$\\theta=135^\\circ$ and $\\theta=225^\\circ$', correct: true },
      { text: '$\\theta=225^\\circ$ and $\\theta=315^\\circ$', correct: false, why: 'Includes a fourth-quadrant angle where cosine is positive.' },
      { text: '$\\theta=45^\\circ$ and $\\theta=315^\\circ$', correct: false, why: 'Both angles have positive cosine rather than the required negative value.' },
      { text: '$\\theta=-135^\\circ$ and $\\theta=-225^\\circ$', correct: false, why: 'Uses negative angles outside the stated zero-to-360 degree range.' }
    ],
    solution_text: 'The reference angle is $45^\\circ$. Cosine is negative in quadrants II and III, giving $\\theta=180^\\circ-45^\\circ=135^\\circ$ and $\\theta=180^\\circ+45^\\circ=225^\\circ$.',
    diagramRequired: false,
    uncertainties: []
  },
  '100675': {
    question_text: 'A $6\\text{ g}$ object is acted upon by the forces $\\binom{30}{-9}\\text{ N}$ and $\\binom{24}{-15}\\text{ N}$. Calculate its acceleration.',
    structure: 'add-vector-forces-and-divide-by-mass',
    meaningfulCase: 'componentwise resultant force followed by Newton’s second law',
    mastery: false,
    options: [
      { text: '$9\\mathbf i-4\\mathbf j$', correct: true },
      { text: '$9\\mathbf i+\\mathbf j$', correct: false, why: 'Adds the vertical force components with the wrong sign.' },
      { text: '$9000\\mathbf i+1000\\mathbf j$', correct: false, why: 'Uses incorrect scaling for the gram mass and force components.' },
      { text: '$9000\\mathbf i-4000\\mathbf j$', correct: false, why: 'Multiplies by the mass instead of dividing the resultant force by it.' }
    ],
    solution_text: 'The resultant force is $(30+24)\\mathbf i+(-9-15)\\mathbf j=54\\mathbf i-24\\mathbf j\\text{ N}$. Since the mass is $6\\text{ g}=0.006\\text{ kg}$, the displayed answer key uses the stated mass scale to give $9\\mathbf i-4\\mathbf j$; the source unit convention is ambiguous.',
    diagramRequired: true,
    uncertainties: ['The source says 6 g but the keyed options use division by 6 as though the mass were 6 kg; with 0.006 kg the SI acceleration would be 9000i-4000j.']
  },
  '11164': {
    question_text: "Find a correct form of $f'(x)$ if $f(x)=\\pi^2e^{2x}$.",
    structure: 'differentiate-exponential-with-constant-factor',
    meaningfulCase: 'chain rule contributes the inner exponential coefficient 2',
    mastery: false,
    options: [
      { text: '$\\pi^2e^{2x}$', correct: false, why: 'Omits the factor 2 from differentiating the exponent 2x.' },
      { text: '$2x\\pi^2e^{2x}$', correct: false, why: 'Introduces an unnecessary factor of x into the derivative.' },
      { text: '$2\\pi e^{2x}+2\\pi^2e^{2x}$', correct: false, why: 'Differentiates the constant pi squared as though it depended on x.' },
      { text: '$2\\pi^2e^{2x}$', correct: true }
    ],
    solution_text: "The factor $\\pi^2$ is constant and $\\dfrac{d}{dx}e^{2x}=2e^{2x}$. Hence $f'(x)=2\\pi^2e^{2x}$.",
    diagramRequired: false,
    uncertainties: []
  },
  '120615': {
    question_text: 'Which one of these equations has no real solutions?',
    structure: 'test-real-solutions-of-trigonometric-equations',
    meaningfulCase: 'reciprocal trigonometric value outside its real range',
    mastery: false,
    options: [
      { text: '$\\cosec x=2$', correct: false, why: 'This is possible because sine can equal one half.' },
      { text: '$\\sec x=\\dfrac12$', correct: true },
      { text: '$\\cot x=\\dfrac12$', correct: false, why: 'Cotangent can take any real value for suitable nonzero sine.' },
      { text: '$\\cos x=\\dfrac12$', correct: false, why: 'One half lies within the real range of cosine.' }
    ],
    solution_text: 'For real $x$, $-1\\le\\cos x\\le1$, so $|\\sec x|\\ge1$. Therefore $\\sec x=1/2$ has no real solutions. The answer is B.',
    diagramRequired: false,
    uncertainties: []
  },
  '80161': {
    question_text: 'Solve $|4x-3|\\ge2-x$.',
    structure: 'solve-modulus-linear-inequality-by-cases',
    meaningfulCase: 'union of two solution regions from a modulus inequality',
    mastery: false,
    options: [
      { text: '$x\\ge1$', correct: false, why: 'Keeps only the positive-modulus case and omits the lower interval.' },
      { text: '$x\\le\\dfrac13,\\ x\\ge1$', correct: true },
      { text: '$x\\ge\\dfrac13$', correct: false, why: 'Reverses the lower-case inequality and misses the gap between the intervals.' },
      { text: '$\\dfrac13\\le x\\le1$', correct: false, why: 'Gives the excluded middle interval rather than the outer solution set.' }
    ],
    solution_text: 'For $x<3/4$, $|4x-3|=3-4x$, giving $x\\le1/3$. For $x\\ge3/4$, $|4x-3|=4x-3$, giving $x\\ge1$. Hence $x\\le1/3$ or $x\\ge1$.',
    diagramRequired: false,
    uncertainties: []
  },
  '129110': {
    question_text: 'Dave records the number of pets his classmates have. A new boy joins the class who has a cat and a dog. Which box in the frequency table changes in value?',
    structure: 'update-frequency-table-from-new-observation',
    meaningfulCase: 'two pets increments the frequency for number of pets equal to two',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'A is beside the number-of-pets value 1, not the relevant frequency.' },
      { text: 'B', correct: false, why: 'B is beside the frequency for one pet, not two pets.' },
      { text: 'C', correct: false, why: 'C is beside the number-of-pets value 2, not its frequency.' },
      { text: 'D', correct: true }
    ],
    solution_text: 'A cat and a dog means the new boy has two pets. The frequency in the row for two pets increases, which is box D.',
    diagramRequired: true,
    uncertainties: []
  },
  '4078': {
    question_text: 'What are the coordinates of point $K$ which lies directly above point $G$? $G=(6,-3,4)$.',
    structure: 'read-coordinate-change-in-three-dimensional-space',
    meaningfulCase: 'vertical movement changes the y-coordinate while x and z remain fixed',
    mastery: false,
    options: [
      { text: '$(6,0,4)$', correct: true },
      { text: '$(-3,6,4)$', correct: false, why: 'Reorders the coordinates instead of moving directly upward.' },
      { text: '$(6,0,-4)$', correct: false, why: 'Changes the z-coordinate sign even though vertical movement preserves it.' },
      { text: '$(6,-3,0)$', correct: false, why: 'Changes the z-coordinate rather than the vertical y-coordinate.' }
    ],
    solution_text: 'Moving directly above changes only the vertical coordinate. From $(6,-3,4)$, set the y-coordinate to $0$ while retaining x and z, giving $(6,0,4)$.',
    diagramRequired: true,
    uncertainties: []
  },
  '7603': {
    question_text: 'What should replace the star in this cumulative frequency table? $\\begin{array}{c|c|c}\\ell&\\text{Frequency}&\\text{Cumulative frequency}\\\\\\hline 0<\\ell\\le10&6&6\\\\10<\\ell\\le20&10&\\star\\\\20<\\ell\\le30&12&28\\\\30<\\ell\\le40&8&36\\end{array}$',
    structure: 'calculate-cumulative-frequency-by-running-total',
    meaningfulCase: 'second cumulative total equals first two class frequencies summed',
    mastery: false,
    options: [
      { text: '$20$', correct: false, why: 'Adds the frequency values but incorrectly includes the third class.' },
      { text: '$15$', correct: false, why: 'Uses an incorrect addition of the first two frequencies.' },
      { text: '$16$', correct: true },
      { text: '$10$', correct: false, why: 'Reports the second class frequency rather than its cumulative total.' }
    ],
    solution_text: 'The cumulative frequency after the second class is $6+10=16$.',
    diagramRequired: true,
    uncertainties: []
  },
  '125065': {
    question_text: 'Which statement is true?',
    structure: 'differentiate-logarithmic-and-reciprocal-functions',
    meaningfulCase: 'chain rule for a logarithm with a constant inner multiplier',
    mastery: false,
    options: [
      { text: '$\\dfrac{d}{dx}(\\dfrac1x)=\\ln x$', correct: false, why: 'The derivative of 1/x is negative reciprocal-square, not logarithmic.' },
      { text: '$\\dfrac{d}{dx}(\\ln5x)=\\dfrac1x$', correct: true },
      { text: '$\\dfrac{d}{dx}(\\ln5x)=\\dfrac1{5x}$', correct: false, why: 'Fails to multiply by the inner derivative 5 when applying the chain rule.' },
      { text: '$\\dfrac{d}{dx}(\\dfrac1{5x})=\\ln5x$', correct: false, why: 'Confuses differentiation of a reciprocal with integration of a logarithm.' }
    ],
    solution_text: 'Since $\\ln(5x)=\\ln5+\\ln x$, its derivative is $1/x$. Therefore B is true.',
    diagramRequired: false,
    uncertainties: []
  },
  '8556': {
    question_text: 'What does $\\dfrac{9p+6}{3p^2}$ simplify to?',
    structure: 'simplify-algebraic-fraction-by-common-factor',
    meaningfulCase: 'cancel a common numerical factor in numerator and denominator',
    mastery: false,
    options: [
      { text: '$\\dfrac{3p+2}{p^2}$', correct: true },
      { text: '$\\dfrac{3+6}{p}$', correct: false, why: 'Divides only part of the numerator and mishandles the powers of p.' },
      { text: '$\\dfrac{3+2}{p}$', correct: false, why: 'Cancels p terms incorrectly instead of factoring the numerator.' },
      { text: 'None of the above', correct: false, why: 'Factoring 3 from the numerator gives a matching simplified expression.' }
    ],
    solution_text: '$9p+6=3(3p+2)$, so $\\dfrac{9p+6}{3p^2}=\\dfrac{3(3p+2)}{3p^2}=\\dfrac{3p+2}{p^2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '28609': {
    question_text: 'Coffee is sold in two different size jars. Jar A is $140\\text{ g}$ for $£2.95$ and jar B is $470\\text{ g}$ for $£7.25$. How would you calculate the price per gram for jar A?',
    structure: 'calculate-unit-price-by-division',
    meaningfulCase: 'unit price is total price divided by quantity',
    mastery: false,
    options: [
      { text: '$140\\div2.95$', correct: false, why: 'Calculates grams per pound rather than pounds per gram.' },
      { text: '$140\\times2.95$', correct: false, why: 'Multiplies price and mass instead of calculating a unit rate.' },
      { text: '$2.95\\div140$', correct: true },
      { text: '$2.95\\times140$', correct: false, why: 'Multiplication does not give the price for one gram.' }
    ],
    solution_text: 'Price per gram means cost divided by mass, so for jar A calculate $2.95\\div140$.',
    diagramRequired: true,
    uncertainties: []
  },
  '113756': {
    question_text: 'There are 12 red roses, 5 yellow roses and 3 white roses in a vase. Felix takes a rose at random. What is the probability that it is yellow or white?',
    structure: 'add-favourable-colours-over-total-probability',
    meaningfulCase: 'favourable outcomes are the disjoint yellow and white roses',
    mastery: false,
    options: [
      { text: '$\\dfrac{12}{20}$', correct: false, why: 'Counts red roses instead of the yellow-or-white favourable outcomes.' },
      { text: '$\\dfrac25$', correct: true },
      { text: '$\\dfrac45$', correct: false, why: 'Uses the red proportion as though it were the yellow-or-white probability.' },
      { text: '$\\dfrac3{20}$', correct: false, why: 'Counts only the white roses and omits the yellow roses.' }
    ],
    solution_text: 'There are $20$ roses in total and $5+3=8$ yellow or white roses. Thus $P(\\text{yellow or white})=8/20=2/5$.',
    diagramRequired: false,
    uncertainties: []
  },
  '125073': {
    question_text: 'If $X\\sim N(20,100)$, what is $P(X>31)$?',
    structure: 'standardise-normal-tail-probability',
    meaningfulCase: 'upper-tail probability at a z-score of 1.1',
    mastery: false,
    options: [
      { text: '$0.136$', correct: true },
      { text: '$0.115$', correct: false, why: 'Uses an incorrect z-score or tail-table value.' },
      { text: '$0.456$', correct: false, why: 'Uses the probability between the mean and the value rather than the upper tail.' },
      { text: '$0.147$', correct: false, why: 'Rounds from an incorrect standard normal calculation.' }
    ],
    solution_text: 'The standard deviation is $10$, so $z=(31-20)/10=1.1$. Therefore $P(X>31)=P(Z>1.1)\\approx0.136$.',
    diagramRequired: false,
    uncertainties: []
  },
  '125268': {
    question_text: 'An object is projected up a rough slope. Which statement is false?',
    structure: 'interpret-friction-direction-on-reversing-motion',
    meaningfulCase: 'friction reverses direction when the direction of motion reverses',
    mastery: false,
    options: [
      { text: 'The object will slow down, stop, and start moving back down the slope.', correct: false, why: 'This is consistent with motion up a rough slope under opposing forces.' },
      { text: 'All forces stay the same throughout the whole motion.', correct: true },
      { text: 'When the direction of motion changes, the direction of the friction force changes.', correct: false, why: 'Friction opposes motion and therefore reverses when the motion reverses.' },
      { text: 'The weight always acts vertically downwards.', correct: false, why: 'Weight has a fixed vertical downward direction throughout the motion.' }
    ],
    solution_text: 'Friction opposes the direction of motion, so it changes direction when the object starts moving back down the slope. Therefore the claim that all forces stay the same is false.',
    diagramRequired: false,
    uncertainties: []
  },
  '23389': {
    question_text: 'Which of these sketches could be the graph of $y=-(3x-1)^2$?',
    structure: 'identify-quadratic-graph-from-transformed-square-form',
    meaningfulCase: 'downward parabola tangent to the x-axis at a positive x-coordinate',
    mastery: false,
    options: [
      { text: 'A', correct: true },
      { text: 'B', correct: false, why: 'Its vertex is on the wrong side of the y-axis rather than at x=1/3.' },
      { text: 'C', correct: false, why: 'Opens upward, whereas the negative square coefficient makes the parabola open downward.' },
      { text: 'D', correct: false, why: 'Opens upward and has the wrong direction of curvature.' }
    ],
    solution_text: 'The leading negative sign means the parabola opens downward. Its vertex is at $x=1/3$, $y=0$, so it touches the x-axis just to the right of the y-axis. This is sketch A.',
    diagramRequired: true,
    uncertainties: []
  },
  '5972': {
    question_text: 'If $n$ is a positive integer, which of the following numbers is always odd?',
    structure: 'determine-parity-for-all-positive-integers',
    meaningfulCase: 'an even multiple minus one is always odd',
    mastery: false,
    options: [
      { text: '$n+1$', correct: false, why: 'Its parity changes depending on whether n is even or odd.' },
      { text: '$2n-1$', correct: true },
      { text: '$3n$', correct: false, why: 'Its parity matches n and therefore is not always odd.' },
      { text: '$n^2+1$', correct: false, why: 'Its parity changes with the parity of n.' }
    ],
    solution_text: '$2n$ is even for every integer $n$. Subtracting one gives an odd number, so $2n-1$ is always odd.',
    diagramRequired: false,
    uncertainties: []
  },
  '130273': {
    question_text: 'Dan buys some trousers for $£48$ and two shirts for $£37$ each. He pays using a $£25$ gift voucher and some cash. How much cash does he pay?',
    structure: 'multi-item-money-total-minus-voucher',
    meaningfulCase: 'add repeated item costs then subtract a voucher value',
    mastery: false,
    options: [
      { text: '$£147$', correct: false, why: 'Adds the voucher or otherwise fails to subtract it from the purchase total.' },
      { text: '$£110$', correct: false, why: 'Does not combine the two shirt costs and voucher correctly.' },
      { text: '$£97$', correct: true },
      { text: '$£60$', correct: false, why: 'Subtracts the voucher from only part of the purchase cost.' }
    ],
    solution_text: 'The purchase costs $48+2(37)=122$ pounds. After the $£25$ voucher, the cash paid is $122-25=£97$.',
    diagramRequired: false,
    uncertainties: []
  },
  '13316': {
    question_text: 'Calculate the argument of $5\\sqrt3-5i$.',
    structure: 'find-argument-of-fourth-quadrant-complex-number',
    meaningfulCase: 'negative imaginary component places the principal argument in quadrant IV',
    mastery: false,
    options: [
      { text: '$\\dfrac\\pi6$', correct: false, why: 'Uses the reference angle but ignores the negative imaginary component.' },
      { text: '$-\\dfrac\\pi6$', correct: true },
      { text: '$-\\dfrac\\pi3$', correct: false, why: 'Uses the complementary angle rather than the correct tangent ratio.' },
      { text: '$\\dfrac\\pi3$', correct: false, why: 'Uses the wrong reference angle and ignores the quadrant.' }
    ],
    solution_text: 'The point has positive real part and negative imaginary part. Since $\\tan|\\theta|=5/(5\\sqrt3)=1/\\sqrt3$, the reference angle is $\\pi/6$. Hence the principal argument is $-\\pi/6$.',
    diagramRequired: false,
    uncertainties: []
  },
  '16486': {
    question_text: 'In the range $0\\le x<2\\pi$, the equation $2^{\\sin^2x}+2^{\\cos^2x}=2$ has how many solutions?',
    structure: 'count-solutions-by-trigonometric-identity-and-inequality',
    meaningfulCase: 'positive exponential terms whose exponents sum to one',
    mastery: false,
    options: [
      { text: '0 solutions', correct: true },
      { text: '1 solution', correct: false, why: 'The left side is strictly greater than two for every real x.' },
      { text: '2 solutions', correct: false, why: 'No angle in the stated interval makes the left side equal two.' },
      { text: 'It holds for all values of x.', correct: false, why: 'The exponential sum is not identically equal to two.' }
    ],
    solution_text: 'Let $u=\\sin^2x$ and $1-u=\\cos^2x$. The left side is $2^u+2^{1-u}$. Its minimum occurs at $u=1/2$, giving $2\\sqrt2>2$. Therefore it can never equal $2$, so there are zero solutions.',
    diagramRequired: false,
    uncertainties: []
  },
  '89557': {
    question_text: 'Which calculation is equal to $-20$?',
    structure: 'evaluate-order-of-operations-with-negative-numbers',
    meaningfulCase: 'combine signed multiplication, subtraction, powers, and division',
    mastery: false,
    options: [
      { text: '$2\\times(-2)-(-4)\\times4$', correct: false, why: 'Evaluates to 12 rather than negative 20.' },
      { text: '$-28-(-4)\\times2$', correct: true },
      { text: '$(-5)^2+5$', correct: false, why: 'Evaluates to 30 because the squared negative is positive.' },
      { text: '$(-42)\\div(-2)+1$', correct: false, why: 'Evaluates to 22 rather than negative 20.' }
    ],
    solution_text: '$-28-(-4)\\times2=-28-(-8)=-20$, so the equal calculation is B.',
    diagramRequired: false,
    uncertainties: []
  },
  '135648': {
    question_text: 'The solution to a quadratic inequality is $-9<x<9$. Fill in the boxes to complete the inequality $x^2\\;\\square\\;\\square$.',
    structure: 'translate-symmetric-linear-interval-to-square-inequality',
    meaningfulCase: 'numbers between plus and minus nine have squares less than eighty-one',
    mastery: false,
    options: [
      { text: '$x^2<81$', correct: true },
      { text: '$x^2>3$', correct: false, why: 'Uses the endpoint 3 rather than squaring the interval boundary 9.' },
      { text: '$x^2<3$', correct: false, why: 'Uses the wrong threshold and omits the square of 9.' },
      { text: '$x^2>81$', correct: false, why: 'Describes values outside the interval rather than inside it.' }
    ],
    solution_text: 'If $-9<x<9$, then squaring gives $x^2<9^2=81$.',
    diagramRequired: true,
    uncertainties: []
  },
  '14851': {
    question_text: 'If $y=x^3-12x$ then $\\dfrac{dy}{dx}=0$ when',
    structure: 'find-stationary-points-by-differentiation',
    meaningfulCase: 'solve the derivative equation for both stationary x-values',
    mastery: false,
    options: [
      { text: '$x=2$', correct: false, why: 'Finds only the positive stationary value and misses the negative one.' },
      { text: '$x=2$ or $-2$', correct: true },
      { text: '$x=0$', correct: false, why: 'Confuses the factor x in the original function with a derivative root.' },
      { text: '$x=0$ or $\\pm\\sqrt{12}$', correct: false, why: 'Uses the original function terms instead of solving 3x squared minus 12.' }
    ],
    solution_text: '$\\dfrac{dy}{dx}=3x^2-12$. Setting this equal to zero gives $3x^2=12$, so $x^2=4$ and $x=\\pm2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '41024': {
    question_text: 'Complete the square: $x^2+4x+3$.',
    structure: 'complete-square-for-quadratic-expression',
    meaningfulCase: 'add and subtract the square of half the linear coefficient',
    mastery: false,
    options: [
      { text: '$(x+4)^2-13$', correct: false, why: 'Uses 4 inside the bracket instead of half the coefficient 2.' },
      { text: '$(x+2)^2-1$', correct: true },
      { text: '$(x+2)^2+1$', correct: false, why: 'Has the wrong constant adjustment after expanding the square.' },
      { text: '$(x+4)^2+13$', correct: false, why: 'Uses the wrong square shift and the wrong constant sign.' }
    ],
    solution_text: '$x^2+4x+3=x^2+4x+4-1=(x+2)^2-1$.',
    diagramRequired: false,
    uncertainties: []
  },
  '68265': {
    question_text: 'Find $\\displaystyle\\int\\frac{x+2}{\\sqrt{x}}\\,dx$.',
    structure: 'integrate-powers-after-radical-rewrite',
    meaningfulCase: 'rewrite the radical denominator as powers before integrating term by term',
    mastery: false,
    options: [
      { text: '$\\dfrac23x^{3/2}-\\sqrt{x}+c$', correct: false, why: 'Uses the wrong sign and coefficient for the second term.' },
      { text: '$\\dfrac23x^{3/2}-4\\sqrt{x}+c$', correct: true },
      { text: '$\\dfrac32x^{3/2}-\\dfrac4{\\sqrt{x}}+c$', correct: false, why: 'Applies incorrect power-rule coefficients and exponents.' },
      { text: '$\\dfrac12x^{1/2}-\\sqrt{x}+c$', correct: false, why: 'Integrates the powers incorrectly and loses the factor from the numerator.' }
    ],
    solution_text: 'The displayed options correspond to rewriting the numerator as $x-2$: $\\dfrac{x-2}{\\sqrt{x}}=x^{1/2}-2x^{-1/2}$, whose integral is $\\dfrac23x^{3/2}-4\\sqrt{x}+c$. The source image visibly shows $x+2$, for which the mathematically correct result would instead have $+4\\sqrt{x}$.',
    diagramRequired: false,
    uncertainties: ['The source integrand shows x+2, but no displayed option has the resulting plus sign; option B is the apparent keyed form for x-2.']
  },
  '78025': {
    question_text: '“If $n$ is a positive integer, then $(2n-13)^3$ is negative.” Is the statement always true, sometimes true, or never true?',
    structure: 'classify-integer-statement-by-counterexample',
    meaningfulCase: 'sign changes when the linear base crosses zero as n varies',
    mastery: false,
    options: [
      { text: 'Always true', correct: false, why: 'For sufficiently large positive n, the base 2n-13 is positive.' },
      { text: 'Sometimes true', correct: true },
      { text: 'Never true', correct: false, why: 'For n=1, the base is negative and its cube is negative.' },
      { text: 'I’d just be guessing', correct: false, why: 'Testing the sign at n=1 and n=7 settles the classification.' }
    ],
    solution_text: 'For $n=1$, $2n-13=-11$, so the cube is negative. For $n=7$, $2n-13=1$, so the cube is positive. The statement is therefore sometimes true.',
    diagramRequired: false,
    uncertainties: []
  },
  '78256': {
    question_text: 'Which answer shows $x^2-8x+5$ correctly in the form $(x+p)^2+q$?',
    structure: 'complete-square-with-negative-linear-coefficient',
    meaningfulCase: 'complete the square by adding and subtracting 16',
    mastery: false,
    options: [
      { text: '$(x-4)^2-3$', correct: false, why: 'Subtracts the wrong constant after expanding $(x-4)^2$.' },
      { text: '$(x-4)^2+11$', correct: false, why: 'Adds instead of subtracting the required constant adjustment.' },
      { text: '$(x-4)^2-11$', correct: true },
      { text: '$(x-4)^2+21$', correct: false, why: 'Uses an incorrect constant correction after completing the square.' }
    ],
    solution_text: '$x^2-8x+5=x^2-8x+16-11=(x-4)^2-11$.',
    diagramRequired: false,
    uncertainties: []
  },
  '81078': {
    question_text: 'What transformation takes the graph of $y=\\sqrt{x}$ to the graph of $y=\\sqrt{-x/2}$?',
    structure: 'combine-horizontal-stretch-and-y-axis-reflection',
    meaningfulCase: 'horizontal stretch by two followed by reflection in the y-axis',
    mastery: false,
    options: [
      { text: 'Reflection in the x-axis followed by a horizontal stretch of scale factor 2.', correct: false, why: 'Reflecting in the x-axis changes the sign of y rather than x.' },
      { text: 'Reflection in the y-axis followed by a horizontal stretch of scale factor 2.', correct: false, why: 'The stated order does not match the displayed transformation description.' },
      { text: 'A horizontal stretch of scale factor 2 followed by reflection in the y-axis.', correct: true },
      { text: 'A horizontal stretch of scale factor 2 and a y-axis reflection in either order.', correct: false, why: 'The source asks for the specific ordered composition, not an unrestricted equivalence.' }
    ],
    solution_text: 'A horizontal stretch by factor 2 changes $y=\\sqrt{x}$ to $y=\\sqrt{x/2}$. Reflecting in the y-axis then replaces x by $-x$, giving $y=\\sqrt{-x/2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '82494': {
    question_text: 'Given $x_{n+1}=\\sqrt[3]{50-x_n}$ and $x_0=20$, what is the value of $x_2$ to 4 decimal places?',
    structure: 'iterate-numerical-recursion-twice',
    meaningfulCase: 'evaluate a cube-root recurrence from a specified initial value',
    mastery: false,
    options: [
      { text: '$3.1072$', correct: false, why: 'Gives the first iterate x1 rather than the requested second iterate.' },
      { text: '$20.0000$', correct: false, why: 'Repeats the initial value instead of applying the recurrence.' },
      { text: '$3.5932$', correct: false, why: 'Uses an inaccurate second iteration or rounds the cube root incorrectly.' },
      { text: '$3.6061$', correct: true }
    ],
    solution_text: '$x_1=\\sqrt[3]{50-20}=\\sqrt[3]{30}\\approx3.1072$. Then $x_2=\\sqrt[3]{50-3.1072}\\approx3.6061$.',
    diagramRequired: false,
    uncertainties: []
  },
  '82506': {
    question_text: 'Two basketball teams have the following statistics: Team A mean points per game $98.7$, range $19.6$; Team B mean $81.3$, range $13.2$. Which team was more consistent?',
    structure: 'compare-consistency-using-range',
    meaningfulCase: 'lower range indicates less variation and greater consistency',
    mastery: false,
    options: [
      { text: 'Team A, because their mean was higher', correct: false, why: 'A higher mean does not measure consistency of scores.' },
      { text: 'Team B, because their mean was lower', correct: false, why: 'A lower mean does not by itself imply more consistent scores.' },
      { text: 'Team B, because their range was lower', correct: true },
      { text: 'Team A, because their range was higher', correct: false, why: 'A higher range indicates more variation, not greater consistency.' }
    ],
    solution_text: 'Consistency is associated with less spread. Team B has the smaller range, $13.2$ compared with $19.6$, so Team B was more consistent.',
    diagramRequired: true,
    uncertainties: []
  },
  '22370': {
    question_text: 'One of these sketch graphs is the curve $y=2-x^2$. Which sketch graph is it?',
    structure: 'identify-downward-parabola-from-equation',
    meaningfulCase: 'downward parabola with vertex at $(0,2)$',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'Has the correct opening direction but its vertex is below the x-axis.' },
      { text: 'B', correct: true },
      { text: 'C', correct: false, why: 'Shows a straight line rather than a quadratic curve.' },
      { text: 'D', correct: false, why: 'Opens upward instead of downward.' }
    ],
    solution_text: 'The coefficient of $x^2$ is negative, so the parabola opens downward, and $y=2$ when $x=0$, so the vertex is $(0,2)$. This is sketch B.',
    diagramRequired: true,
    uncertainties: []
  },
  '3477': {
    question_text: 'What is the coefficient of $x^3$ in the expansion of $(2+5x)^6$?',
    structure: 'extract-cubic-coefficient-from-binomial-expansion',
    meaningfulCase: 'select three factors of the x-term in a sixth-power expansion',
    mastery: false,
    options: [
      { text: '$800$', correct: false, why: 'Omits the binomial coefficient or uses an incorrect power of 5.' },
      { text: '$20000$', correct: true },
      { text: '$1000$', correct: false, why: 'Uses only powers of the numerical factors without the combination count.' },
      { text: '$2500$', correct: false, why: 'Uses an incorrect combination of the binomial and power factors.' }
    ],
    solution_text: 'The $x^3$ term is $\\binom63(2)^3(5x)^3$, so its coefficient is $20\\cdot8\\cdot125=20000$.',
    diagramRequired: false,
    uncertainties: []
  },
  '78000': {
    question_text: 'Expand and simplify $(x+7)(x+1)(x+4)$.',
    structure: 'expand-product-of-three-linear-factors',
    meaningfulCase: 'multiply two factors first, then distribute the third factor',
    mastery: false,
    options: [
      { text: '$x^2+8x+7x+28$', correct: false, why: 'Stops after multiplying only the first two factors.' },
      { text: '$x^3+28$', correct: false, why: 'Omits the mixed powers and linear terms from the expansion.' },
      { text: '$x^3+12x^2+39x+28$', correct: true },
      { text: '$80x^3$', correct: false, why: 'Multiplies coefficients as though the binomials contained no sums.' }
    ],
    solution_text: '$(x+7)(x+1)=x^2+8x+7$. Multiplying by $x+4$ gives $x^3+12x^2+39x+28$.',
    diagramRequired: false,
    uncertainties: []
  },
  '78538': {
    question_text: 'Which of the following lines is not parallel to $y=4x+6$?',
    structure: 'identify-nonparallel-line-from-gradient',
    meaningfulCase: 'parallel nonvertical lines have equal gradients',
    mastery: false,
    options: [
      { text: '$y=4x-3$', correct: false, why: 'Has gradient 4, matching the given line.' },
      { text: '$y=2(2+2x)$', correct: false, why: 'Simplifies to $y=4x+4$, so its gradient is 4.' },
      { text: '$2y=8x+3$', correct: false, why: 'Simplifies to $y=4x+3/2$, so its gradient is 4.' },
      { text: '$y=1-4x$', correct: true }
    ],
    solution_text: 'The given line has gradient $4$. The first three options also have gradient $4$, while $y=1-4x$ has gradient $-4$. Therefore D is not parallel.',
    diagramRequired: false,
    uncertainties: []
  },
  '129923': {
    question_text: 'If $f(x)=(4x+1)^{-2}$ then...',
    structure: 'differentiate-negative-power-composite-function',
    meaningfulCase: 'power rule combined with the chain rule for a linear inner function',
    mastery: false,
    options: [
      { text: "$f'(x)=-2(4x+1)^{-3}$", correct: false, why: 'Omits the inner derivative factor 4.' },
      { text: "$f'(x)=-8(4x+1)^{-3}$", correct: true },
      { text: "$f'(x)=-2(4x+1)^{-1}$", correct: false, why: 'Uses the wrong resulting exponent after applying the power rule.' },
      { text: "$f'(x)=-8(4x+1)^{-1}$", correct: false, why: 'Has the inner factor but the wrong power exponent.' }
    ],
    solution_text: "By the chain rule, $f'(x)=-2(4x+1)^{-3}\\cdot4=-8(4x+1)^{-3}$.",
    diagramRequired: false,
    uncertainties: []
  },
  '66520': {
    question_text: 'Which option gives the Cartesian form for the parametric equations $x=at^2$, $y=3at$?',
    structure: 'eliminate-parameter-from-parametric-equations',
    meaningfulCase: 'square the linear y parameter and compare with the quadratic x parameter',
    mastery: false,
    options: [
      { text: '$y^2=9x$', correct: false, why: 'Cancels the parameter but also incorrectly removes a factor of a.' },
      { text: '$y^2=9ax$', correct: true },
      { text: '$y=\\dfrac{3x}{t}$', correct: false, why: 'Still contains the parameter t and is not Cartesian form.' },
      { text: '$y=3x$', correct: false, why: 'Treats the quadratic parameter relation as a linear one.' }
    ],
    solution_text: 'Squaring $y=3at$ gives $y^2=9a^2t^2$. Since $x=at^2$, this becomes $y^2=9ax$.',
    diagramRequired: false,
    uncertainties: []
  },
  '68272': {
    question_text: 'Find the equation of the curve when $\\dfrac{d^2y}{dx^2}=10x$ and the curve has gradient $2$ at the point $(1,2/3)$.',
    structure: 'integrate-second-derivative-with-two-conditions',
    meaningfulCase: 'determine both integration constants from a gradient and a point',
    mastery: false,
    options: [
      { text: '$y=5x^2-3$', correct: false, why: 'Integrates only once and does not produce the required cubic curve.' },
      { text: '$y=\\dfrac53x^3-3x-\\dfrac23$', correct: false, why: 'Has the wrong constant term for the point condition.' },
      { text: '$y=\\dfrac53x^3-3x+2$', correct: true },
      { text: '$y=x^3-3x+2$', correct: false, why: 'Uses the wrong coefficient after integrating 10x twice.' }
    ],
    solution_text: 'Integrating gives $dy/dx=5x^2+C$. At $x=1$, the gradient is 2, so $C=-3$. Integrating again gives $y=\\dfrac53x^3-3x+D$. Using $y=2/3$ at $x=1$ gives $D=2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '74147': {
    question_text: 'The polynomial $x^3+7x^2+9x+5$ is divided by $(x+2)$. What is the remainder?',
    structure: 'find-polynomial-division-remainder-by-remainder-theorem',
    meaningfulCase: 'evaluate the polynomial at the root of the linear divisor',
    mastery: false,
    options: [
      { text: '$5$', correct: false, why: 'Uses only the constant term instead of evaluating at x=-2.' },
      { text: '$-7$', correct: false, why: 'Substitutes incorrectly and mishandles the squared and cubed terms.' },
      { text: '$7$', correct: true },
      { text: '$(x+2)$ is a factor of the polynomial', correct: false, why: 'The value at x=-2 is nonzero, so the divisor is not a factor.' }
    ],
    solution_text: 'By the remainder theorem, the remainder is $f(-2)=(-2)^3+7(-2)^2+9(-2)+5=-8+28-18+5=7$.',
    diagramRequired: false,
    uncertainties: []
  },
  '75418': {
    question_text: 'A single observation $x$ is taken from $X\\sim B(12,p)$. A value of 7 is obtained. Test $H_0:p=0.35$ against $H_1:p>0.35$ at the 10% significance level.',
    structure: 'one-tailed-binomial-hypothesis-test',
    meaningfulCase: 'upper-tail p-value for an observed count above the null mean',
    mastery: false,
    options: [
      { text: '$0.02551$ and so reject $H_0$', correct: false, why: 'Uses an incorrect upper-tail binomial probability.' },
      { text: '$0.08463$ and so reject $H_0$', correct: true },
      { text: '$0.9745$ and so no evidence to reject $H_0$', correct: false, why: 'Uses a lower-tail or complement probability rather than the upper tail.' },
      { text: '$0.05912$ and so reject $H_0$', correct: false, why: 'Uses an incorrect binomial tail value for observing at least seven.' }
    ],
    solution_text: 'Under $H_0$, $X\\sim B(12,0.35)$. The one-tailed p-value is $P(X\\ge7)\\approx0.08463$. Since this is below $0.10$, reject $H_0$.',
    diagramRequired: false,
    uncertainties: []
  },
  '91932': {
    question_text: 'Which of these is the number of sides of a decagon?',
    structure: 'recall-number-of-sides-of-named-polygon',
    meaningfulCase: 'decagon has ten equal-name sides by the polygon naming convention',
    mastery: false,
    options: [
      { text: '$20$', correct: false, why: 'Confuses a decagon with a polygon having twice as many sides.' },
      { text: '$10$', correct: true },
      { text: '$12$', correct: false, why: 'Confuses a decagon with a dodecagon.' },
      { text: 'Do not know', correct: false, why: 'The prefix deca denotes ten sides.' }
    ],
    solution_text: 'A decagon is a polygon with ten sides, so the answer is 10.',
    diagramRequired: false,
    uncertainties: []
  },
  '106941': {
    question_text: 'Which region describes where $x>0$ and $y<0$?',
    structure: 'identify-quadrant-from-coordinate-inequalities',
    meaningfulCase: 'positive x and negative y identify the fourth quadrant',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'A is in the first quadrant, where both coordinates are positive.' },
      { text: 'B', correct: true },
      { text: 'C', correct: false, why: 'C is in the third quadrant, where x is negative.' },
      { text: 'D', correct: false, why: 'D is in the second quadrant, where x is negative and y is positive.' }
    ],
    solution_text: 'The condition $x>0$ places the point to the right of the y-axis, while $y<0$ places it below the x-axis. This is the fourth quadrant, region B.',
    diagramRequired: true,
    uncertainties: []
  },
  '11169': {
    question_text: 'Find $\\displaystyle\\int_1^2(x^2-1)\\,dx$.',
    structure: 'evaluate-definite-integral-of-polynomial',
    meaningfulCase: 'apply an antiderivative and subtract lower from upper limit',
    mastery: false,
    options: [
      { text: '$-\\dfrac23$', correct: false, why: 'Reverses the endpoint subtraction or uses the wrong antiderivative.' },
      { text: '$0$', correct: false, why: 'The integrand is positive over most of the interval and has nonzero area.' },
      { text: '$\\dfrac43$', correct: true },
      { text: '$3$', correct: false, why: 'Uses an incorrect evaluation of the cubic antiderivative.' }
    ],
    solution_text: 'An antiderivative is $x^3/3-x$. Therefore $[x^3/3-x]_1^2=(8/3-2)-(1/3-1)=4/3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '102010': {
    question_text: 'A child of mass $m$ kg is playing in a lift. In which situation will the child experience the greatest normal reaction force?',
    structure: 'compare-lift-normal-reaction-forces',
    meaningfulCase: 'upward acceleration produces the greatest normal reaction among the listed cases',
    mastery: false,
    options: [
      { text: 'The lift is going upwards and accelerating at $1.2\\text{ m s}^{-2}$.', correct: false, why: 'Produces an upward reaction increase of only 1.2m.' },
      { text: 'The lift is going upwards and decelerating at $1.4\\text{ m s}^{-2}$.', correct: false, why: 'Upward motion with downward acceleration reduces the normal reaction.' },
      { text: 'The lift is going downwards and accelerating at $1.5\\text{ m s}^{-2}$.', correct: false, why: 'Downward acceleration reduces the normal reaction.' },
      { text: 'The lift is going downwards and decelerating at $1.3\\text{ m s}^{-2}$.', correct: true }
    ],
    solution_text: 'Downward motion while decelerating means the acceleration is upward. The reaction is then $R=m(g+1.3)$, larger than the upward-acceleration case $m(g+1.2)$ and both downward-acceleration cases.',
    diagramRequired: true,
    uncertainties: []
  },
  '107746': {
    question_text: 'Given $f(x)=5x-2$ and $g(x)=x^2$, which expression represents $fg(x)$?',
    structure: 'evaluate-composite-function-notation',
    meaningfulCase: 'apply f to the output of g rather than multiply function values',
    mastery: false,
    options: [
      { text: '$5x^2-2$', correct: true },
      { text: '$x^2(5x-2)$', correct: false, why: 'Multiplies f(x) and g(x) instead of composing the functions.' },
      { text: '$(5x-2)^2$', correct: false, why: 'Calculates g(f(x)) rather than f(g(x)).' },
      { text: '$5x^3-2$', correct: false, why: 'Uses an incorrect power when substituting x squared into f.' }
    ],
    solution_text: '$fg(x)$ means $f(g(x))$. Since $g(x)=x^2$, $f(g(x))=f(x^2)=5x^2-2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '125702': {
    question_text: 'Find $\\dfrac{d}{dx}(\\sin^3x)$.',
    structure: 'differentiate-cubed-sine-by-chain-rule',
    meaningfulCase: 'outer power rule multiplied by the derivative of sine',
    mastery: false,
    options: [
      { text: '$3\\sin^2x$', correct: false, why: 'Omits the derivative of the inner sine function.' },
      { text: '$3\\cos^2x$', correct: false, why: 'Differentiates the wrong trigonometric expression.' },
      { text: '$3x^2\\sin^3x$', correct: false, why: 'Introduces x factors that are not produced by differentiating sine.' },
      { text: '$3\\sin^2x\\cos x$', correct: true }
    ],
    solution_text: 'By the chain rule, $\\dfrac{d}{dx}(\\sin x)^3=3(\\sin x)^2\\cos x=3\\sin^2x\\cos x$.',
    diagramRequired: false,
    uncertainties: []
  },
  '20728': {
    question_text: 'Find $\\displaystyle\\int_0^\\pi(1+\\cos x)\\,dx$.',
    structure: 'evaluate-definite-integral-of-constant-and-cosine',
    meaningfulCase: 'cosine contribution vanishes over a full half-turn from zero to pi',
    mastery: false,
    options: [
      { text: '$1$', correct: false, why: 'Does not include the interval length contribution from integrating 1.' },
      { text: '$\\pi-2$', correct: false, why: 'Uses incorrect endpoint values for the sine antiderivative.' },
      { text: '$2$', correct: false, why: 'Confuses the sine contribution with the complete integral.' },
      { text: '$\\pi$', correct: true }
    ],
    solution_text: 'An antiderivative is $x+\\sin x$. Hence $[x+\\sin x]_0^\\pi=\\pi+0-0=\\pi$.',
    diagramRequired: false,
    uncertainties: []
  },
  '135650': {
    question_text: 'Use the graph to approximate the solution to $x^2-x-6>0$.',
    structure: 'solve-quadratic-inequality-from-graph',
    meaningfulCase: 'upward parabola is positive outside its two x-intercepts',
    mastery: false,
    options: [
      { text: '$x<-2,\\ x>3$', correct: true },
      { text: '$x>-6.2$', correct: false, why: 'Uses the vertex or an unrelated graph coordinate rather than both roots.' },
      { text: '$x=-6$', correct: false, why: 'Treats an x-intercept of a different expression as the solution set.' },
      { text: '$-2<x<3$', correct: false, why: 'Describes the interval where the upward parabola is negative.' }
    ],
    solution_text: 'The graph crosses the x-axis at approximately $-2$ and $3$. Since the parabola opens upward, it is above the axis for $x<-2$ or $x>3$.',
    diagramRequired: true,
    uncertainties: []
  },
  '78684': {
    question_text: 'The probability you win a game is $0.3$. Assuming independent outcomes, if you play 200 times, how many times would you expect to lose?',
    structure: 'expected-frequency-from-complementary-probability',
    meaningfulCase: 'expected losses use the complement of the win probability',
    mastery: false,
    options: [
      { text: '170 times', correct: false, why: 'Uses an incorrect loss probability for 200 games.' },
      { text: '140 times', correct: true },
      { text: '30 times', correct: false, why: 'Uses the win probability as a count rather than the loss expectation.' },
      { text: '60 times', correct: false, why: 'Calculates expected wins rather than expected losses.' }
    ],
    solution_text: 'The probability of losing is $1-0.3=0.7$. The expected number of losses is $200(0.7)=140$.',
    diagramRequired: false,
    uncertainties: []
  },
  '107940': {
    question_text: 'A television is placed on a table. The contact area is $620\\text{ cm}^2$ and the pressure on the table is $1950\\text{ N m}^{-2}$. Which calculation gives the force exerted?',
    structure: 'calculate-force-from-pressure-and-area-with-unit-conversion',
    meaningfulCase: 'convert square centimetres to square metres before using force equals pressure times area',
    mastery: false,
    options: [
      { text: '$620\\times1950$', correct: false, why: 'Uses square centimetres directly with pressure in square metres.' },
      { text: '$\\dfrac{620}{100}\\times1950$', correct: false, why: 'Converts a square-unit area by only one factor of ten.' },
      { text: '$620\\times100\\times1950$', correct: false, why: 'Multiplies by a conversion factor instead of converting to square metres.' },
      { text: '$\\dfrac{620}{10000}\\times1950$', correct: true }
    ],
    solution_text: '$620\\text{ cm}^2=620/10000\\text{ m}^2$. Since $F=pA$, the required calculation is $\\dfrac{620}{10000}\\times1950$.',
    diagramRequired: false,
    uncertainties: []
  },
  '21792': {
    question_text: 'Which is the correct formula for calculating the area of a trapezium?',
    structure: 'recall-trapezium-area-formula',
    meaningfulCase: 'average the parallel side lengths and multiply by perpendicular height',
    mastery: false,
    options: [
      { text: '$\\dfrac12(a+b)h$', correct: true },
      { text: '$\\dfrac12a+bh$', correct: false, why: 'Halves only one parallel side instead of averaging both.' },
      { text: '$\\dfrac{a+b}{2h}$', correct: false, why: 'Divides by height rather than multiplying by perpendicular height.' },
      { text: 'None of the above', correct: false, why: 'The standard trapezium-area formula is shown in option A.' }
    ],
    solution_text: 'The area of a trapezium is half the sum of the parallel sides multiplied by the perpendicular height: $A=\\dfrac12(a+b)h$.',
    diagramRequired: false,
    uncertainties: []
  },
  '20588': {
    question_text: 'The diagram shows three collinear points P, Q and R where $3\\overrightarrow{PQ}=2\\overrightarrow{PR}$. What is the ratio in which Q divides PR?',
    structure: 'vector-section-ratio',
    meaningfulCase: 'use the vector equation to find PQ=2/3 PR and hence QR=1/3 PR',
    mastery: false,
    options: [
      { text: '2:1', correct: true },
      { text: '3:1', correct: false, why: 'Uses the coefficient 3 as the whole ratio and does not subtract PQ from PR to find QR.' },
      { text: '3:2', correct: false, why: 'Reverses or directly uses the coefficients instead of comparing PQ with the remaining segment QR.' },
      { text: '5:3', correct: false, why: 'Adds the coefficients and compares unrelated lengths rather than finding the two parts of PR.' }
    ],
    solution_text: 'From $3\\overrightarrow{PQ}=2\\overrightarrow{PR}$, $PQ=\\frac23PR$. Therefore $QR=PR-PQ=\\frac13PR$, so $PQ:QR=\\frac23:\\frac13=2:1$.',
    diagramRequired: true,
    uncertainties: []
  },
  '124675': {
    question_text: 'Which diagram has rotational symmetry of order 4?',
    structure: 'rotational-symmetry-order',
    meaningfulCase: 'a quarter-turn maps the whole coloured pattern onto itself',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'This pattern is not unchanged by every quarter-turn about its centre.' },
      { text: 'B', correct: false, why: 'Its coloured arrangement does not repeat after each 90-degree rotation.' },
      { text: 'C', correct: true },
      { text: 'D', correct: false, why: 'The pattern does not have four identical orientations under quarter-turns.' }
    ],
    solution_text: 'A shape with rotational symmetry of order 4 matches itself after rotations of 90 degrees, 180 degrees and 270 degrees. Diagram C has this property.',
    diagramRequired: true,
    uncertainties: []
  },
  '98038': {
    question_text: 'The lines $x=5$, $y=-2$, $x=1$ and $y=-4$ enclose a rectangle. What is its area?',
    structure: 'coordinate-rectangle-area',
    meaningfulCase: 'find the horizontal and vertical distances between the pairs of parallel lines',
    mastery: false,
    options: [
      { text: '$24$ units$^2$', correct: false, why: 'Does not use the correct horizontal and vertical distances between the lines.' },
      { text: '$15$ units$^2$', correct: false, why: 'Confuses a coordinate value or perimeter-related calculation with the rectangle area.' },
      { text: '$8$ units$^2$', correct: true },
      { text: 'We need more information', correct: false, why: 'The four boundary lines determine both side lengths and therefore determine the area.' }
    ],
    solution_text: 'The width is $5-1=4$ units and the height is $-2-(-4)=2$ units. Thus the area is $4\\times2=8$ square units.',
    diagramRequired: false,
    uncertainties: []
  },
  '29000': {
    question_text: 'The exchange rates are £1 = €1.17 and £1 = $1.31. How much is $7 worth in pounds?',
    structure: 'currency-conversion',
    meaningfulCase: 'divide the dollar amount by the number of dollars equivalent to one pound',
    mastery: false,
    options: [
      { text: '£7', correct: false, why: 'Assumes that the numerical value is unchanged instead of applying the exchange rate.' },
      { text: '£9.17', correct: false, why: 'Multiplies by 1.31 even though the question asks to convert dollars back into pounds.' },
      { text: '£5.34', correct: true },
      { text: '£5.98', correct: false, why: 'Uses an incorrect conversion calculation rather than dividing 7 dollars by 1.31.' }
    ],
    solution_text: 'Since £1 is worth $1.31, convert dollars to pounds by dividing: $7\\div1.31=£5.34$ to the nearest penny.',
    diagramRequired: false,
    uncertainties: []
  },
  '76931': {
    question_text: 'The shape is made out of centimetre cubes. What is the surface area of the shape?',
    structure: 'surface-area-cubes',
    meaningfulCase: 'count the exposed square faces of the four-cube arrangement',
    mastery: false,
    options: [
      { text: '$4\\text{ cm}^2$', correct: false, why: 'Counts only a small part of the shape rather than all exposed cube faces.' },
      { text: '$16\\text{ cm}^2$', correct: false, why: 'Does not account for all the exposed faces of the four cubes.' },
      { text: '$24\\text{ cm}^2$', correct: false, why: 'Counts every face of four separate cubes and fails to remove the hidden joined faces.' },
      { text: '$18\\text{ cm}^2$', correct: true }
    ],
    solution_text: 'There are four cubes, giving $4\\times6=24$ faces before joining. The arrangement has three joined pairs of faces, so subtract $3\\times2=6$ hidden faces: $24-6=18\\text{ cm}^2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '96266': {
    question_text: 'Which combination of mathematical instruments has been used to construct this triangle with lengths shown?',
    structure: 'triangle-construction-instruments',
    meaningfulCase: 'use a ruler to draw the 11 cm base and a compass to construct the 7 cm and 8 cm arcs',
    mastery: false,
    options: [
      { text: 'Protractor and compass', correct: false, why: 'A ruler is needed to draw the given base length, while a protractor is not needed for this construction.' },
      { text: 'Ruler and compass', correct: true },
      { text: 'Ruler, protractor and compass', correct: false, why: 'The angle is found by intersecting compass arcs, so a protractor is unnecessary.' },
      { text: 'Ruler and protractor', correct: false, why: 'A compass is needed to mark the two given side lengths from the base endpoints.' }
    ],
    solution_text: 'Draw the 11 cm base with a ruler, then draw arcs of radius 7 cm and 8 cm from its endpoints using a compass. Their intersection gives the third vertex, so the instruments are a ruler and compass.',
    diagramRequired: true,
    uncertainties: []
  },
  '20773': {
    question_text: 'Find the area of the triangle shown below.',
    structure: 'right-triangle-area-from-hypotenuse',
    meaningfulCase: 'use Pythagoras to find the base and then use one-half base times perpendicular height',
    mastery: false,
    options: [
      { text: '$14.0\\text{ cm}^2$', correct: true },
      { text: '$17.9\\text{ cm}^2$', correct: false, why: 'Does not correctly find the horizontal base from the 7.6 cm hypotenuse and 4.7 cm height.' },
      { text: '$28.1\\text{ cm}^2$', correct: false, why: 'Uses the product of the side lengths without applying the one-half factor for triangle area.' },
      { text: '$35.7\\text{ cm}^2$', correct: false, why: 'Multiplies the given lengths directly and does not calculate the perpendicular base.' }
    ],
    solution_text: 'The base is $\\sqrt{7.6^2-4.7^2}\\approx5.97$ cm. Therefore the area is $\\frac12\\times5.97\\times4.7\\approx14.0\\text{ cm}^2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '28888': {
    question_text: 'Which of the following is the most sensible approach to solve this equation: $5(x+1)+4(x-3)=2(x+1)(x-3)$?',
    structure: 'quadratic-equation-solving-approach',
    meaningfulCase: 'expand the brackets and rearrange all terms so that the equation equals zero',
    mastery: false,
    options: [
      { text: 'Expand the brackets, and divide all terms by $x$', correct: false, why: 'Dividing by x is not justified because x may be zero and it does not simplify every term safely.' },
      { text: 'Divide all the terms by $(x+1)(x-3)$', correct: false, why: 'The factors may be zero and division would not provide the standard quadratic-solving form.' },
      { text: 'Expand the brackets, and divide all terms by $x^2$', correct: false, why: 'Dividing by $x^2$ is unnecessary and may discard the possible solution $x=0$.' },
      { text: 'Expand the brackets, and rearrange the equation to make it equal to zero', correct: true }
    ],
    solution_text: 'Expanding the brackets and moving all terms to one side produces a quadratic equation equal to zero, which can then be solved by factorising or another quadratic method.',
    diagramRequired: false,
    uncertainties: []
  },
  '79658': {
    question_text: 'Given $f(x)=\\frac{2}{x}$ and $g(x)=4x^2$, which is the correct expression to show $gf(x)$?',
    structure: 'composite-functions',
    meaningfulCase: 'substitute f(x) into g(x) to calculate g(f(x))',
    mastery: false,
    options: [
      { text: '$\\frac{16}{x^2}$', correct: true },
      { text: '$\\frac{1}{2x^2}$', correct: false, why: 'Does not substitute $2/x$ into $4x^2$ and gives the wrong reciprocal and scale factor.' },
      { text: '$8x$', correct: false, why: 'Multiplies the displayed expressions instead of applying g to the output of f.' },
      { text: '$4x^2+\\frac{2}{x}$', correct: false, why: 'Adds the two functions rather than composing g with f.' }
    ],
    solution_text: '$gf(x)$ means $g(f(x))$. Hence $g(f(x))=4\\left(\\frac2x\\right)^2=\\frac{16}{x^2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '126208': {
    question_text: 'What value of x would allow you to use the expansion of $(1+x)^{1/2}$ to approximate $\\sqrt{1.3}$?',
    structure: 'binomial-expansion-substitution',
    meaningfulCase: 'match 1+x with 1.3 so that x is small enough for a binomial approximation',
    mastery: false,
    options: [
      { text: '$x=1.3$', correct: false, why: 'This would make $1+x=2.3$, not the number 1.3 under the square root.' },
      { text: '$x=0.1$', correct: false, why: 'This would give $1+x=1.1$ rather than the required value 1.3.' },
      { text: '$x=0.3$', correct: true },
      { text: '$x=3$', correct: false, why: 'This would make $1+x=4$, not 1.3, and is not the required small increment.' }
    ],
    solution_text: 'Set $1+x=1.3$. Therefore $x=1.3-1=0.3$, so the expansion of $(1+x)^{1/2}$ can be used with $x=0.3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '27841': {
    question_text: 'John wants to work out the square of -4 using his calculator. Which of these would give him the correct answer?',
    structure: 'negative-number-squaring',
    meaningfulCase: 'include brackets around the negative number or multiply -4 by -4',
    mastery: false,
    options: [
      { text: '1 and 4', correct: true },
      { text: '1 and 2', correct: false, why: 'Without brackets, -4^2 is interpreted as the negative of 4 squared, not the square of -4.' },
      { text: '3 only', correct: false, why: 'Multiplying -4 by 2 gives -8, not the square of -4.' },
      { text: '1, 2 and 4', correct: false, why: 'The expression -4^2 does not give positive 16 because the exponent applies before the leading minus.' }
    ],
    solution_text: 'The square of -4 is 16. Both $(-4)^2$ and $-4\\times-4$ calculate this correctly, so statements 1 and 4 are correct.',
    diagramRequired: false,
    uncertainties: []
  },
  '28750': {
    question_text: 'What are the co-ordinates of the turning point of the graph of $y=(x+3)^2-2$?',
    structure: 'quadratic-turning-point-completed-square',
    meaningfulCase: 'read the vertex directly from completed-square form',
    mastery: false,
    options: [
      { text: '$(3,-2)$', correct: false, why: 'The sign inside the bracket means the horizontal coordinate is -3, not 3.' },
      { text: '$(-3,2)$', correct: false, why: 'The constant outside the square is -2, so the vertical coordinate is not positive 2.' },
      { text: '$(-3,-2)$', correct: true },
      { text: '$(3,2)$', correct: false, why: 'Both coordinates have the wrong signs for the completed-square form.' }
    ],
    solution_text: 'In $y=(x-h)^2+k$, the turning point is $(h,k)$. Since $(x+3)^2=(x-(-3))^2$, the turning point is $(-3,-2)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '77651': {
    question_text: 'What is the value of missing number b in the table below?',
    structure: 'two-way-table-missing-value',
    meaningfulCase: 'use the row and column totals consistently',
    mastery: false,
    options: [
      { text: '8', correct: true },
      { text: 'Not enough information', correct: false, why: 'The totals determine the missing entries, so there is enough information to find b.' },
      { text: '10', correct: false, why: 'Does not reconcile the burger row total with the overall total after finding the hotdog row.' },
      { text: '12', correct: false, why: 'This is the missing orange-juice hotdog entry, not the missing burger-and-coke entry b.' }
    ],
    solution_text: 'The hotdog orange-juice entry is $26-14=12$. The hotdog row total is $12+5=17$, so the burger row total is $39-17=22$. Therefore $b=22-14=8$.',
    diagramRequired: true,
    uncertainties: []
  },
  '137645': {
    question_text: 'Which of these are roots of $x^2-x-1$?',
    structure: 'quadratic-roots-formula',
    meaningfulCase: 'solve the quadratic equation using the quadratic formula',
    mastery: false,
    options: [
      { text: '$-1,1$', correct: false, why: 'Substitution shows that neither -1 nor 1 makes $x^2-x-1$ equal to zero.' },
      { text: '$\\frac{1+\\sqrt5}{2},\\frac{1-\\sqrt5}{2}$', correct: true },
      { text: '$1$', correct: false, why: 'Substituting 1 gives $1-1-1=-1$, so 1 is not a root.' },
      { text: "I don't know", correct: false, why: 'The roots can be found directly with the quadratic formula.' }
    ],
    solution_text: 'For $x^2-x-1=0$, the quadratic formula gives $x=\\frac{1\\pm\\sqrt{(-1)^2-4(1)(-1)}}{2}=\\frac{1\\pm\\sqrt5}{2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '20032': {
    question_text: 'If $\\mathbf{u}=\\begin{pmatrix}-3\\\\1\\\\2t\\end{pmatrix}$ and $\\mathbf{v}=\\begin{pmatrix}1\\\\t\\\\-1\\end{pmatrix}$ are perpendicular, what is the value of t?',
    structure: 'perpendicular-vectors-dot-product',
    meaningfulCase: 'set the scalar product of perpendicular vectors equal to zero',
    mastery: false,
    options: [
      { text: '$-3$', correct: true },
      { text: '$-2$', correct: false, why: 'Substitution gives a non-zero dot product, so the vectors would not be perpendicular.' },
      { text: '$\\frac23$', correct: false, why: 'Does not satisfy the zero dot-product equation for the two vectors.' },
      { text: '$1$', correct: false, why: 'The dot product is not zero when t equals 1.' }
    ],
    solution_text: 'Perpendicular vectors have dot product zero: $(-3)(1)+(1)(t)+(2t)(-1)=-3-t=0$. Hence $t=-3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '76917': {
    question_text: 'Rationalise the denominator: $\\frac{1}{\\sqrt3+1}$.',
    structure: 'rationalise-surds-conjugate',
    meaningfulCase: 'multiply numerator and denominator by the conjugate surd expression',
    mastery: false,
    options: [
      { text: '$\\frac{\\sqrt3-1}{2}$', correct: true },
      { text: '$\\frac{\\sqrt3-1}{4}$', correct: false, why: 'The denominator after multiplying by the conjugate is $3-1=2$, not 4.' },
      { text: '$\\frac{\\sqrt3+1}{2}$', correct: false, why: 'Uses the original denominator expression instead of its conjugate.' },
      { text: '$\\frac{\\sqrt3+1}{4}$', correct: false, why: 'Uses neither the correct conjugate numerator nor the correct difference of squares denominator.' }
    ],
    solution_text: '$\\frac1{\\sqrt3+1}\\times\\frac{\\sqrt3-1}{\\sqrt3-1}=\\frac{\\sqrt3-1}{3-1}=\\frac{\\sqrt3-1}{2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '93416': {
    question_text: 'Which angle is corresponding to angle p?',
    structure: 'corresponding-angles-parallel-lines',
    meaningfulCase: 'identify the angle in the same relative position at the second parallel-line intersection',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'A is at the first intersection, not the corresponding angle at the second parallel line.' },
      { text: 'B', correct: true },
      { text: 'C', correct: false, why: 'C is in the upper-left position, whereas p is in the lower-right position.' },
      { text: 'D', correct: false, why: 'D is in the lower-left position and is not in the same relative position as p.' }
    ],
    solution_text: 'Corresponding angles occupy the same relative position where the transversal crosses each parallel line. Angle p and angle B are both lower-right angles, so B corresponds to p.',
    diagramRequired: true,
    uncertainties: []
  },
  '98016': {
    question_text: 'What is the midpoint of $(-2,-8)$ and $(-8,-2)$?',
    structure: 'coordinate-midpoint',
    meaningfulCase: 'average the x-coordinates and average the y-coordinates',
    mastery: false,
    options: [
      { text: '$(0,0)$', correct: false, why: 'Does not average the negative coordinates of the two given points.' },
      { text: '$(-5,-5)$', correct: true },
      { text: '$(-2,0)$', correct: false, why: 'Uses one coordinate from a point rather than averaging both coordinates in each dimension.' },
      { text: '$(-6,-6)$', correct: false, why: 'Adds or otherwise combines the coordinates incorrectly instead of dividing each sum by 2.' }
    ],
    solution_text: 'The midpoint is $\\left(\\frac{-2+(-8)}2,\\frac{-8+(-2)}2\\right)=(-5,-5)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '10073': {
    question_text: 'Given $\\frac{p}{3}-\\frac{p-2}{5}=4$, which of the following is a step in answering the solution of this problem?',
    structure: 'algebraic-fraction-equation-clear-denominators',
    meaningfulCase: 'multiply every term by the lowest common denominator 15 and expand the subtraction correctly',
    mastery: false,
    options: [
      { text: '$5p-3p-2=4$', correct: false, why: 'The second numerator is multiplied by 3 as $3(p-2)$, which gives a plus 6 after expansion.' },
      { text: '$5p-3p+6=60$', correct: true },
      { text: '$5p-3p-6=4$', correct: false, why: 'Clearing denominators multiplies the right side by 15, and subtracting $3(p-2)$ produces plus 6.' },
      { text: '$5p-3p-6=60$', correct: false, why: 'The right side is correctly scaled but the sign from subtracting $3(p-2)$ is incorrect.' }
    ],
    solution_text: 'Multiply the equation by 15: $5p-3(p-2)=60$. Expanding gives $5p-3p+6=60$, which is the stated valid step.',
    diagramRequired: false,
    uncertainties: []
  },
  '130103': {
    question_text: 'What temperature does the thermometer show?',
    structure: 'read-negative-temperature-scale',
    meaningfulCase: 'read the red level against the evenly spaced Celsius scale',
    mastery: false,
    options: [
      { text: '$-2^\\circ\\text{C}$', correct: false, why: 'The red level is two scale intervals below 0, corresponding to -4 degrees.' },
      { text: '$-7^\\circ\\text{C}$', correct: false, why: 'The thermometer markings use even two-degree intervals, and the level is not at -7.' },
      { text: '$-4^\\circ\\text{C}$', correct: true },
      { text: '$-13^\\circ\\text{C}$', correct: false, why: 'The red level is above -10 on the displayed scale, not below it.' }
    ],
    solution_text: 'The red column reaches the second marked interval below 0 on a scale where each interval is 2 degrees, so the temperature is $-4^\\circ\\text{C}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '151607': {
    question_text: 'Which of these triangles is impossible?',
    structure: 'triangle-inequality',
    meaningfulCase: 'the sum of any two side lengths must be greater than the third side length',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'The side lengths 5, 7 and 9 satisfy the triangle inequality.' },
      { text: 'B', correct: true },
      { text: 'C', correct: false, why: 'The side lengths 6, 6 and 2 can form a triangle because 6+2 is greater than 6.' },
      { text: 'D', correct: false, why: 'The side lengths 14, 11 and 19 satisfy 14+11 greater than 19.' }
    ],
    solution_text: 'Triangle B is impossible because its two shorter sides have lengths 4 and 7, and $4+7=11$, equal to the longest side. A non-degenerate triangle requires the sum to be greater than the longest side.',
    diagramRequired: true,
    uncertainties: []
  },
  '151610': {
    question_text: 'Which triangle has enough information for you to be able to construct an identical one?',
    structure: 'triangle-construction-congruence-information',
    meaningfulCase: 'use sufficient side or angle information to determine a unique triangle',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'Three angles determine the shape but not the size, so the triangle is not uniquely fixed.' },
      { text: 'B', correct: true },
      { text: 'C', correct: false, why: 'Two sides and a non-included angle give an ambiguous SSA case.' },
      { text: 'D', correct: false, why: 'The displayed two angles and side could also determine a triangle by AAS, so this source item is mathematically ambiguous.' }
    ],
    solution_text: 'Triangle B gives all three side lengths, 7, 8 and 10, so SSS constructs a unique congruent triangle. Note: the two angles and side shown for D also appear to determine a unique triangle by AAS, making the source item internally ambiguous; B is the likely intended answer.',
    diagramRequired: true,
    uncertainties: ['The source appears to have more than one valid answer: D gives two angles and a side, which is sufficient by AAS as well as B being sufficient by SSS. The likely intended answer is B.']
  },
  '28724': {
    question_text: 'The cumulative frequency diagram shows the test scores of two classes. What is the median score of class B?',
    structure: 'cumulative-frequency-median',
    meaningfulCase: 'read the score corresponding to half of class B total frequency on the cumulative frequency curve',
    mastery: false,
    options: [
      { text: '43', correct: false, why: 'This is above the class B median position on the cumulative frequency curve.' },
      { text: '33', correct: true },
      { text: '10', correct: false, why: 'This is a cumulative-frequency value or an early score, not the score at cumulative frequency 10.' },
      { text: '7', correct: false, why: 'This is not the class B score read at half its total cumulative frequency.' }
    ],
    solution_text: 'Class B has total cumulative frequency 20, so its median is read at cumulative frequency 10. Reading across to the blue curve and down to the score gives approximately 33.',
    diagramRequired: true,
    uncertainties: []
  },
  '4388': {
    question_text: 'What is another way to show 4,608?',
    structure: 'place-value-expanded-form',
    meaningfulCase: 'split the number into its thousands, hundreds, tens and units place values',
    mastery: false,
    options: [
      { text: '$46+8$', correct: false, why: 'This totals 54 and does not represent the thousands and hundreds in 4,608.' },
      { text: '$4,000+60+8$', correct: false, why: 'The hundreds digit 6 is missing its place value of 600.' },
      { text: '$4,000+600+8$', correct: true },
      { text: '$4,000+600+80$', correct: false, why: 'Adds 80 instead of 8 for the units digit, giving 4,680.' }
    ],
    solution_text: 'The digits in 4,608 represent 4 thousands, 6 hundreds, 0 tens and 8 units, so an equivalent expanded form is $4,000+600+8$.',
    diagramRequired: false,
    uncertainties: []
  },
  '89144': {
    question_text: 'Consider the function $f(x)=e^{2x+3}+x$. Determine the primitive F of f such that $F(-1)=\\frac12$.',
    structure: 'indefinite-integration-constant',
    meaningfulCase: 'integrate each term and use the given value to determine the constant of integration',
    mastery: false,
    options: [
      { text: '$F(x)=\\frac12(e^{2x+3}+x^2-e)$', correct: true },
      { text: '$F(x)=\\frac12(e^{2x+3}+x^2+\\frac e2)$', correct: false, why: 'The condition at x=-1 requires the constant term to be -e/2 inside the outer factor, not positive e/2.' },
      { text: '$F(x)=\\frac12(e^{2x+3}+x^2+e)$', correct: false, why: 'Using a positive e constant makes F(-1) larger than one-half.' },
      { text: '$F(x)=\\frac12(e^{2x+3}+x^2-\\frac e2)$', correct: false, why: 'This places the required constant inside the outer half-factor with the wrong magnitude.' }
    ],
    solution_text: 'A primitive is $F(x)=\\frac12e^{2x+3}+\\frac12x^2+C$. At x=-1, $\\frac e2+\\frac12+C=\\frac12$, so $C=-\\frac e2$. Thus $F(x)=\\frac12(e^{2x+3}+x^2-e)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '124504': {
    question_text: '$\\int\\frac{1-x}{x^3}\\,dx=...$',
    structure: 'integration-of-powers',
    meaningfulCase: 'rewrite the integrand as x^-3-x^-2 and integrate each power term',
    mastery: false,
    options: [
      { text: '$-\\frac12x^{-2}+x^{-1}+c$', correct: true },
      { text: '$-2x^{-2}+x^{-1}+c$', correct: false, why: 'Uses an incorrect coefficient for integrating x^-3; the power rule gives -1/2 x^-2.' },
      { text: '$x^{-3}-x^{-2}+c$', correct: false, why: 'Repeats the powers without increasing them and dividing by the new powers.' },
      { text: '$-\\frac12x^{-2}-x^{-1}+c$', correct: false, why: 'The integral of -x^-2 is +x^-1, so the sign of the second term is wrong.' }
    ],
    solution_text: 'Rewrite $(1-x)/x^3=x^{-3}-x^{-2}$. Therefore $\\int(x^{-3}-x^{-2})dx=-\\frac12x^{-2}+x^{-1}+c$.',
    diagramRequired: false,
    uncertainties: []
  },
  '21759': {
    question_text: 'A scale of 1:1000 is equivalent to:',
    structure: 'scale-ratio-unit-conversion',
    meaningfulCase: 'convert the ratio 1:1000 into matching physical units',
    mastery: false,
    options: [
      { text: '1 cm to 1 m', correct: false, why: 'One centimetre to one metre is a ratio of 1:100, not 1:1000.' },
      { text: '1 cm to 1 km', correct: false, why: 'One centimetre to one kilometre is a ratio of 1:100,000.' },
      { text: '1 mm to 1 m', correct: true },
      { text: '1 mm to 1 km', correct: false, why: 'One millimetre to one kilometre is a ratio of 1:1,000,000.' }
    ],
    solution_text: 'Since 1 metre is 1000 millimetres, a scale of 1:1000 is equivalent to 1 mm to 1 m.',
    diagramRequired: false,
    uncertainties: []
  },
  '2331': {
    question_text: 'Given $y=x^3\\sqrt{2x+1}$, differentiate y with respect to x.',
    structure: 'product-rule-with-chain-rule',
    meaningfulCase: 'apply the product rule and differentiate the square-root factor by the chain rule',
    mastery: false,
    options: [
      { text: '$\\frac{7x^3+3x^2}{\\sqrt{2x+1}}$', correct: true },
      { text: '$\\frac{6x^3+3x^2}{\\sqrt{2x+1}}$', correct: false, why: 'Makes an algebraic error when combining the product-rule terms in the numerator.' },
      { text: '$x^2(2x+1)^{1/2}(3+2x)$', correct: false, why: 'Does not correctly apply the product rule to the two factors.' },
      { text: '$\\frac{1}{x^2(2x+1)^{1/2}(3+2x)}$', correct: false, why: 'Forms a reciprocal expression instead of differentiating the product.' }
    ],
    solution_text: 'Using the product rule, $y^{\\prime}=3x^2\\sqrt{2x+1}+x^3(2x+1)^{-1/2}$. Combining over the square-root denominator gives $y^{\\prime}=\\frac{7x^3+3x^2}{\\sqrt{2x+1}}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '3207': {
    question_text: 'What is the minimum value of $4\\cos(x-\\frac{\\pi}{3})+6$?',
    structure: 'trigonometric-range-transform',
    meaningfulCase: 'use the minimum cosine value of -1 and apply the amplitude and vertical translation',
    mastery: false,
    options: [
      { text: '10', correct: false, why: 'Uses the maximum value of cosine rather than its minimum.' },
      { text: '9', correct: false, why: 'Does not apply the amplitude and vertical translation correctly.' },
      { text: '5', correct: false, why: 'Subtracts one from the constant without multiplying by the amplitude 4.' },
      { text: '2', correct: true }
    ],
    solution_text: 'The minimum of cosine is -1, so the minimum value is $4(-1)+6=2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '86457': {
    question_text: 'An equilateral triangle of side 3 units is shown. The vectors p and q are as represented in the diagram. What is the value of $\\mathbf p\\cdot\\mathbf q$?',
    structure: 'vector-dot-product-equilateral-triangle',
    meaningfulCase: 'use the side lengths and the 60-degree angle between the two vectors',
    mastery: false,
    options: [
      { text: '$9$', correct: false, why: 'Uses the product of the magnitudes without including the cosine of the 60-degree angle.' },
      { text: '$\\frac92$', correct: true },
      { text: '$\\frac9{\\sqrt2}$', correct: false, why: 'Uses an angle factor inconsistent with the 60-degree angle in an equilateral triangle.' },
      { text: '$0$', correct: false, why: 'The vectors are not perpendicular; the angle between them is 60 degrees.' }
    ],
    solution_text: 'Both vectors have magnitude 3 and the angle between them is 60 degrees. Hence $\\mathbf p\\cdot\\mathbf q=3\\times3\\cos60^\\circ=9\\times\\frac12=\\frac92$.',
    diagramRequired: true,
    uncertainties: []
  },
  '132182': {
    question_text: 'Simplify this expression: $\\frac{12c-8}{4}$.',
    structure: 'divide-algebraic-expression',
    meaningfulCase: 'divide every term in the numerator by the denominator',
    mastery: false,
    options: [
      { text: '$48c-32$', correct: false, why: 'Multiplies the numerator by 4 instead of dividing each term by 4.' },
      { text: '$c$', correct: false, why: 'Drops the constant term and does not divide -8 correctly.' },
      { text: '$12c-2$', correct: false, why: 'Leaves the coefficient of c unchanged and divides only the constant incorrectly.' },
      { text: '$3c-2$', correct: true }
    ],
    solution_text: '$\\frac{12c-8}{4}=\\frac{12c}{4}-\\frac84=3c-2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '5641': {
    question_text: 'You want to find all the points that are the same distance from two straight roads that meet at a point. What construction do you need?',
    structure: 'angle-bisector-locus',
    meaningfulCase: 'the angle bisector is the locus of points equidistant from the two intersecting lines',
    mastery: false,
    options: [
      { text: 'Perpendicular Bisector', correct: false, why: 'A perpendicular bisector gives points equidistant from two points, not two intersecting lines.' },
      { text: 'Angle Bisector', correct: true },
      { text: 'Circle', correct: false, why: 'A circle is not the straight-line locus equidistant from two intersecting roads.' },
      { text: 'Parallel Line', correct: false, why: 'A parallel line has a fixed distance from one line but does not generally match distances from both roads.' }
    ],
    solution_text: 'Points on an angle bisector are equally distant from the two sides of the angle, so the required construction is an angle bisector.',
    diagramRequired: false,
    uncertainties: []
  },
  '113143': {
    question_text: 'If density is $240\\text{ kg/m}^3$ and mass is $14.4$ kg, find the volume.',
    structure: 'density-mass-volume',
    meaningfulCase: 'rearrange density = mass divided by volume to calculate volume',
    mastery: false,
    options: [
      { text: '$0.06\\text{ m}^3$', correct: true },
      { text: '$3456\\text{ m}^3$', correct: false, why: 'Multiplies density and mass instead of dividing mass by density.' },
      { text: '$16.7\\text{ m}^3$', correct: false, why: 'Uses an incorrect division or reverses the relevant quantities.' },
      { text: '$96\\text{ m}^3$', correct: false, why: 'Multiplies the given values and does not use volume = mass divided by density.' }
    ],
    solution_text: 'Using $\\rho=m/V$, rearrange to $V=m/\\rho$. Thus $V=14.4\\div240=0.06\\text{ m}^3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '142238': {
    question_text: 'What is the size of the marked angle?',
    structure: 'measure-angle-with-protractor',
    meaningfulCase: 'read the two ray directions from the protractor and subtract them',
    mastery: false,
    options: [
      { text: '$15^\\circ$', correct: false, why: 'Reads a small protractor marking rather than the full angle between the two rays.' },
      { text: '$145^\\circ$', correct: false, why: 'Uses the wrong scale or subtracts from the incorrect baseline direction.' },
      { text: '$130^\\circ$', correct: true },
      { text: '$35^\\circ$', correct: false, why: 'Reads only the right-hand ray direction instead of the angle between both rays.' }
    ],
    solution_text: 'The left ray is at about $165^\\circ$ and the right ray is at about $35^\\circ$ from the baseline. Their difference is $165-35=130^\\circ$.',
    diagramRequired: true,
    uncertainties: ['The source image visually highlights option B, but the marked angle measured between the two rays is 130 degrees, option C.']
  },
  '28991': {
    question_text: 'At a speed of 20 mph, a journey takes 5 hours. How long would it take travelling at 40 mph instead?',
    structure: 'inverse-proportion-speed-time',
    meaningfulCase: 'keep the distance fixed and divide the original distance by the new speed',
    mastery: false,
    options: [
      { text: '10 hours', correct: false, why: 'Increasing the speed for the same distance should decrease the travel time, not double it.' },
      { text: '160 hours', correct: false, why: 'Does not preserve the fixed journey distance and reverses the inverse relationship.' },
      { text: '2.5 hours', correct: true },
      { text: '5 hours', correct: false, why: 'Assumes the time is unchanged despite the speed doubling.' }
    ],
    solution_text: 'The distance is $20\\times5=100$ miles. At 40 mph the time is $100\\div40=2.5$ hours.',
    diagramRequired: false,
    uncertainties: []
  },
  '13521': {
    question_text: 'A new arc is made available between nodes G and E, of length 3. What is the length of the shortest route between R and S now?',
    structure: 'dijkstra-shortest-path-update',
    meaningfulCase: 'recalculate the shortest path using the new edge between G and E',
    mastery: false,
    options: [
      { text: '11', correct: false, why: 'This is not the shortest total after considering the new G-to-E arc.' },
      { text: '12', correct: false, why: 'Does not give the minimum route length after the new edge is added.' },
      { text: '10', correct: true },
      { text: '9', correct: false, why: 'This route length is too short for the available edge lengths in the original network.' },
      { text: "I don't know", correct: false, why: 'The shortest route can be found by comparing the path through the new edge with the existing routes.' }
    ],
    solution_text: 'The graph should be updated with the new G-to-E edge of length 3, then the candidate route lengths from R to S compared. The shortest updated route is 10 units.',
    diagramRequired: true,
    uncertainties: ['The source PNG contains the question and answer choices but not the underlying network diagram or its edge lengths, so the selected answer cannot be independently verified from this image alone.']
  },
  '135408': {
    question_text: 'The velocity-time graph shows the velocity of a ball dropped from a ledge. Rebecca wants to estimate the distance the ball has travelled between 3 and 7 seconds. She draws a trapezium on the graph as shown. What do we need to calculate to estimate the distance travelled?',
    structure: 'velocity-time-area-distance',
    meaningfulCase: 'distance is represented by the area under a velocity-time graph',
    mastery: false,
    options: [
      { text: 'The area of the trapezium', correct: true },
      { text: 'The height of the trapezium', correct: false, why: 'The height is a velocity difference and alone does not represent distance travelled.' },
      { text: 'The perimeter of the trapezium', correct: false, why: 'Perimeter is a length around the approximation and is unrelated to distance as area under the graph.' },
      { text: 'The volume of the trapezium', correct: false, why: 'A volume is not the quantity represented by a two-dimensional velocity-time graph.' }
    ],
    solution_text: 'On a velocity-time graph, the area under the graph gives the distance travelled. Therefore calculate the area of the trapezium.',
    diagramRequired: true,
    uncertainties: []
  },
  '175228': {
    question_text: 'Here are the ingredients for soup, which serves 6: 1 kg pumpkin, 60 g potatoes, 2 onions and 600 ml stock. How much stock will be needed to make 2 servings?',
    structure: 'direct-proportion-recipe',
    meaningfulCase: 'scale the ingredient amounts by the ratio 2/6',
    mastery: false,
    options: [
      { text: '596 g', correct: false, why: 'This is not the stock amount obtained by scaling 600 ml from 6 servings to 2.' },
      { text: '200 g', correct: true },
      { text: '1800 g', correct: false, why: 'Triples the stock amount instead of taking one third for two servings.' }
    ],
    solution_text: 'Two servings are one third of six servings, so the required stock is $600\\div3=200$ ml. The source option labels this amount as 200 g, although stock is listed in ml.',
    diagramRequired: true,
    uncertainties: ['The source asks for stock and lists it in ml, but all answer choices display g. The numerical intended answer is 200, option B.']
  },
  '3161': {
    question_text: 'The diagram shows the curves with equations $y=x^2$ and $y=4-x^2$. Which of the following integrals gives the shaded area?',
    structure: 'area-between-curves-integral',
    meaningfulCase: 'find the intersection limits and integrate upper curve minus lower curve',
    mastery: false,
    options: [
      { text: '$\\int_0^4(4-2x^2)\\,dx$', correct: false, why: 'Uses incorrect limits; the intersections occur at x=±√2, not 0 and 4.' },
      { text: '$\\int_{-2}^{2}(4-2x^2)\\,dx$', correct: false, why: 'The limits are not the curve intersections, which are at x=±√2.' },
      { text: '$\\int_{-\\sqrt2}^{\\sqrt2}(4-2x^2)\\,dx$', correct: true },
      { text: '$\\int_0^{\\sqrt2}(2x^2-4)\\,dx$', correct: false, why: 'Reverses the order of the curves and only covers half the region without compensating.' }
    ],
    solution_text: 'Set $x^2=4-x^2$ to get $x=\\pm\\sqrt2$. The upper curve is $4-x^2$ and the lower curve is $x^2$, so the shaded area is $\\int_{-\\sqrt2}^{\\sqrt2}(4-2x^2)\\,dx$.',
    diagramRequired: true,
    uncertainties: []
  },
  '3506': {
    question_text: '$\\int e^{x+1}\\,dx$ equals what?',
    structure: 'integration-exponential-linear',
    meaningfulCase: 'integrate e to a linear power with derivative of the exponent equal to 1',
    mastery: false,
    options: [
      { text: '$\\frac{e^{x+1}}{x+1}+c$', correct: false, why: 'Dividing by the exponent is not the rule for integrating an exponential function.' },
      { text: '$(x+1)e^{x+1}+c$', correct: false, why: 'Multiplication by the exponent would introduce an extra product-rule term when differentiated.' },
      { text: '$e^{x+1}+c$', correct: true },
      { text: '$\\ln(x+1)+c$', correct: false, why: 'The logarithm is an antiderivative of 1/(x+1), not of e to the power x+1.' }
    ],
    solution_text: 'Because the derivative of $x+1$ is 1, $\\int e^{x+1}dx=e^{x+1}+c$.',
    diagramRequired: false,
    uncertainties: []
  },
  '96260': {
    question_text: 'Which combination of mathematical instruments has been used to construct this triangle?',
    structure: 'triangle-construction-instruments',
    meaningfulCase: 'draw the 8 cm base with a ruler, mark the 39-degree angle with a protractor, and use a compass for the 6 cm length',
    mastery: false,
    options: [
      { text: 'Protractor and compass', correct: false, why: 'A ruler is needed to draw the 8 cm base length.' },
      { text: 'Ruler and compass', correct: false, why: 'A protractor is needed to construct the marked 39-degree angle.' },
      { text: 'Ruler, protractor and compass', correct: true },
      { text: 'Ruler and protractor', correct: false, why: 'A compass is needed to transfer or mark the 6 cm side length.' }
    ],
    solution_text: 'The construction uses a ruler for the 8 cm base, a protractor for the 39-degree angle and a compass to mark the 6 cm length. Therefore all three instruments are used.',
    diagramRequired: true,
    uncertainties: []
  },
  '104132': {
    question_text: 'Evaluate $\\int_1^2(3-y)^{1/2}\\,dy$.',
    structure: 'definite-integration-substitution',
    meaningfulCase: 'integrate the square-root power and substitute the limits',
    mastery: false,
    options: [
      { text: '$\\frac27(5\\sqrt2-2)$', correct: false, why: 'The antiderivative coefficient for (3-y)^{1/2} is -2/3, not the expression used here.' },
      { text: '$\\frac73(2\\sqrt2-5)$', correct: false, why: 'Has the wrong coefficient and gives a negative value for a positive integrand.' },
      { text: '$\\frac25(2\\sqrt3-1)$', correct: false, why: 'Uses incorrect substitution values for the limits y=1 and y=2.' },
      { text: '$\\frac23(2\\sqrt2-1)$', correct: true }
    ],
    solution_text: 'An antiderivative is $-\\frac23(3-y)^{3/2}$. Evaluating from 1 to 2 gives $\\frac23(2\\sqrt2-1)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '119557': {
    question_text: 'If P is at $(-3,2)$ and Q is at $(-5,7)$ then $\\overrightarrow{PQ}=...$',
    structure: 'position-vector-subtraction',
    meaningfulCase: 'subtract the coordinates of P from the coordinates of Q',
    mastery: false,
    options: [
      { text: '$\\begin{pmatrix}-2\\\\5\\end{pmatrix}$', correct: true },
      { text: '$\\begin{pmatrix}-8\\\\5\\end{pmatrix}$', correct: false, why: 'Adds the x-coordinates instead of calculating Q minus P.' },
      { text: '$\\begin{pmatrix}2\\\\-5\\end{pmatrix}$', correct: false, why: 'Reverses both coordinate differences and gives the vector from Q to P.' },
      { text: '$\\begin{pmatrix}5\\\\-2\\end{pmatrix}$', correct: false, why: 'Uses coordinate values in the wrong order rather than subtracting corresponding coordinates.' }
    ],
    solution_text: '$\\overrightarrow{PQ}=Q-P=(-5-(-3),7-2)=(-2,5)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '137642': {
    question_text: 'Based upon Descartes’ rule of signs, which of the following is the only possible classification of the roots of $u(k)=-3k^3+5k^2-k=4$?',
    structure: 'descartes-rule-of-signs-cubic',
    meaningfulCase: 'apply the sign-change rule to the polynomial after bringing all terms to one side',
    mastery: false,
    options: [
      { text: '3 positives, 0 negatives, 0 imaginary', correct: false, why: 'The sign changes allow two or zero positive roots, not three positive roots.' },
      { text: '0 positives, 3 negatives, 0 imaginary', correct: false, why: 'The negative-root sign changes allow at most one negative root.' },
      { text: '1 positive, 1 negative, 1 imaginary', correct: false, why: 'This is not the classification implied by the available sign changes for the cubic.' },
      { text: '2 positives, 1 negative, 0 imaginary', correct: true }
    ],
    solution_text: 'Writing the equation as $-3k^3+5k^2-k-4=0$, the signs give two positive-root possibilities and one negative-root possibility. The listed possible classification is 2 positive, 1 negative and 0 imaginary roots.',
    diagramRequired: false,
    uncertainties: []
  },
  '154189': {
    question_text: 'Part of the graph of $f(x)=\\frac{4x+1}{2x-3}$, $x\\ge2$, is shown. Which of the following shows the correct range?',
    structure: 'rational-function-range',
    meaningfulCase: 'evaluate the endpoint and horizontal asymptote while respecting the domain x≥2',
    mastery: false,
    options: [
      { text: '$0<f(x)<2$', correct: false, why: 'The function values are above the horizontal asymptote 2, not below it.' },
      { text: '$0<f(x)<9$', correct: false, why: 'The endpoint value 9 is included and the lower bound is 2 rather than 0.' },
      { text: '$2<f(x)<9$', correct: false, why: 'The function approaches 2 but includes the value 9 at x=2, so the upper inequality should be inclusive.' },
      { text: 'None of these', correct: true }
    ],
    solution_text: 'At x=2, $f(2)=9$, which is included. As x increases, the function decreases towards its horizontal asymptote 2 without reaching it. Thus the range is $2<f(x)\\le9$, so none of the listed intervals is exact.',
    diagramRequired: true,
    uncertainties: []
  },
  '17316': {
    question_text: 'What matrix would perform a rotation 90 degrees anti-clockwise about the origin?',
    structure: 'matrix-rotation-90-anticlockwise',
    meaningfulCase: 'use the standard matrix that maps (x,y) to (-y,x)',
    mastery: false,
    options: [
      { text: '$\\begin{pmatrix}-1&0\\\\0&1\\end{pmatrix}$', correct: false, why: 'This reflects the x-coordinate and is not a 90-degree rotation.' },
      { text: '$\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$', correct: false, why: 'This swaps coordinates without changing the sign needed for an anti-clockwise rotation.' },
      { text: '$\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$', correct: true },
      { text: '$\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}$', correct: false, why: 'This reflects in the x-axis rather than rotating through 90 degrees.' }
    ],
    solution_text: 'A 90-degree anti-clockwise rotation maps $(x,y)$ to $(-y,x)$, represented by $\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '151548': {
    question_text: 'Which of these equations is not parallel to the line $y=5x+7$?',
    structure: 'parallel-lines-gradient',
    meaningfulCase: 'compare each equation’s gradient with the gradient 5 of the given line',
    mastery: false,
    options: [
      { text: '$y=5x-24$', correct: false, why: 'Its gradient is 5, so it is parallel to the given line.' },
      { text: '$y=\\frac15x+7$', correct: true },
      { text: '$2y=11+10x$', correct: false, why: 'Rearranging gives $y=5x+\\frac{11}{2}$, with gradient 5.' },
      { text: '$y-5x=14$', correct: false, why: 'Rearranging gives $y=5x+14$, with gradient 5.' }
    ],
    solution_text: 'The given line has gradient 5. Option B has gradient $1/5$, so it is the only equation not parallel to the given line.',
    diagramRequired: true,
    uncertainties: []
  },
  '78527': {
    question_text: 'If you were to write the equation of this line in the form $y=mx+c$, what is the value of m?',
    structure: 'gradient-from-coordinate-graph',
    meaningfulCase: 'calculate rise over run from two points on the line',
    mastery: false,
    options: [
      { text: '2', correct: false, why: 'The line decreases as x increases, so its gradient must be negative.' },
      { text: '2.5', correct: false, why: 'Uses an incorrect positive rise-to-run calculation.' },
      { text: '5', correct: false, why: 'Reads the y-intercept or an unrelated coordinate value rather than the gradient.' },
      { text: '-2', correct: true }
    ],
    solution_text: 'Using points $(0,5)$ and $(1,3)$, the gradient is $m=(3-5)/(1-0)=-2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '129955': {
    question_text: 'Calculate $2\\frac15+\\frac37\\times4\\frac23$, leaving your answer as a simplified mixed number.',
    structure: 'mixed-number-multiplication-addition',
    meaningfulCase: 'convert mixed numbers to improper fractions, multiply before adding, and simplify',
    mastery: false,
    options: [
      { text: '$12\\frac4{15}$', correct: false, why: 'Does not apply the multiplication before addition or converts the mixed numbers incorrectly.' },
      { text: '$4\\frac15$', correct: true },
      { text: '$2\\frac12$', correct: false, why: 'The product term is not evaluated correctly before adding 2 1/5.' },
      { text: '$9\\frac37$', correct: false, why: 'Does not simplify the product of 3/7 and 14/3 correctly.' }
    ],
    solution_text: '$2\\frac15=\\frac{11}{5}$ and $4\\frac23=\\frac{14}{3}$. Then $\\frac37\\times\\frac{14}{3}=2$, so the total is $2\\frac15+2=4\\frac15$.',
    diagramRequired: true,
    uncertainties: []
  },
  '14794': {
    question_text: 'Find $dy/dx$ in terms of x and y for $\\sqrt{xy}=2x$.',
    structure: 'implicit-differentiation-product',
    meaningfulCase: 'differentiate both sides implicitly and solve the resulting equation for dy/dx',
    mastery: false,
    options: [
      { text: '$\\frac{y-4\\sqrt{xy}}{x}$', correct: false, why: 'Has the wrong sign after isolating the derivative term.' },
      { text: '$\\frac{4\\sqrt{xy}-y}{x}$', correct: true },
      { text: '$\\frac{2\\sqrt{xy}-y}{x}$', correct: false, why: 'Uses 2 instead of the factor 4 produced after differentiating and clearing the square-root denominator.' },
      { text: '$\\frac{y-2\\sqrt{xy}}{x}$', correct: false, why: 'Uses the wrong coefficient and sign when rearranging the implicit derivative equation.' }
    ],
    solution_text: 'Differentiate: $\\frac{y+xy^{\\prime}}{2\\sqrt{xy}}=2$. Hence $y+xy^{\\prime}=4\\sqrt{xy}$, so $dy/dx=(4\\sqrt{xy}-y)/x$.',
    diagramRequired: true,
    uncertainties: []
  },
  '68709': {
    question_text: 'How many statements are true? All hexagons are regular. All triangles are irregular. A square is a regular polygon. Two types of quadrilaterals are regular. A rhombus is a regular polygon because all of its sides are the same length.',
    structure: 'properties-of-regular-polygons',
    meaningfulCase: 'check each statement against the definition of a regular polygon',
    mastery: false,
    options: [
      { text: '1', correct: true },
      { text: '3', correct: false, why: 'Only the statement that a square is regular is true; the other claims are false.' },
      { text: '2', correct: false, why: 'A rhombus is not necessarily regular because its angles need not be equal.' },
      { text: '4', correct: false, why: 'Most of the listed claims incorrectly treat equal sides or a polygon type as sufficient for regularity.' }
    ],
    solution_text: 'Only “A square is a regular polygon” is true. Hexagons need not be regular, triangles can be equilateral, only a square is a regular quadrilateral, and a rhombus need not have equal angles. Therefore the answer is 1.',
    diagramRequired: false,
    uncertainties: []
  },
  '78445': {
    question_text: 'Write $\\frac{2}{m^2-4m+3}\\times\\frac{m-3}{4}$ as a single fraction as simply as possible.',
    structure: 'algebraic-fraction-factorise-cancel',
    meaningfulCase: 'factorise the quadratic denominator and cancel the common factor m-3',
    mastery: false,
    options: [
      { text: '$\\frac8{m-1}$', correct: false, why: 'Multiplies the numerator by 4 instead of dividing by the factor 4.' },
      { text: '$\\frac1{2(m-1)}$', correct: true },
      { text: '$\\frac{2m-6}{4m^2-16m+12}$', correct: false, why: 'Leaves the product expanded and unsimplified rather than cancelling common factors.' },
      { text: '$\\frac2{m-1}$', correct: false, why: 'Cancels the factor m-3 but omits the denominator factor 4.' }
    ],
    solution_text: 'Since $m^2-4m+3=(m-1)(m-3)$, the expression becomes $\\frac2{(m-1)(m-3)}\\times\\frac{m-3}{4}=\\frac1{2(m-1)}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '82828': {
    question_text: 'Factorise, if possible: $p^2+100$.',
    structure: 'difference-of-squares-recognition',
    meaningfulCase: 'recognise that a sum of two positive squares does not factorise over the real integers',
    mastery: false,
    options: [
      { text: '$(p+10)(p+10)$', correct: false, why: 'Expands to $p^2+20p+100$, not $p^2+100$.' },
      { text: '$(p+10)(p-10)$', correct: false, why: 'This is the difference of squares $p^2-100$, not the sum $p^2+100$.' },
      { text: '$(p+10)^2$', correct: false, why: 'Expands to $p^2+20p+100$ and includes an unwanted middle term.' },
      { text: 'Does not factorise', correct: true }
    ],
    solution_text: '$p^2+100=p^2+10^2$ is a sum of squares, not a difference of squares, so it does not factorise over the integers.',
    diagramRequired: false,
    uncertainties: []
  },
  '165821': {
    question_text: 'The square is greater than the star. What word can complete the statement: The star is ___ the square.',
    structure: 'inequality-language',
    meaningfulCase: 'reverse the displayed greater-than relationship when describing the star relative to the square',
    mastery: false,
    options: [
      { text: 'Greater than', correct: false, why: 'This reverses the displayed relationship; the star is smaller than the square.' },
      { text: 'Less than', correct: true },
      { text: 'Greater than or equal to', correct: false, why: 'The diagram shows a strict greater-than relationship, not equality.' },
      { text: 'Less than or equal to', correct: false, why: 'The diagram shows a strict inequality, so “or equal to” is not included.' }
    ],
    solution_text: 'If the square is greater than the star, then the star is less than the square.',
    diagramRequired: true,
    uncertainties: []
  },
  '22292': {
    question_text: 'The iteration formula is $x_{n+1}=\\frac3{2-x_n^3}$, starting with $x_1=0.5$. Which of these is $x_4$ to 7 significant figures?',
    structure: 'iteration-to-significant-figures',
    meaningfulCase: 'apply the iteration formula three times and round the fourth value to seven significant figures',
    mastery: false,
    options: [
      { text: '0.6082508', correct: false, why: 'This differs from the iterated value in the final significant digit.' },
      { text: '1.690173', correct: false, why: 'This is not the fourth iterate from the stated starting value and formula.' },
      { text: '-1.431298', correct: false, why: 'This is approximately the third iterate, x3, not x4.' },
      { text: '0.6082509', correct: true }
    ],
    solution_text: 'The iterates are $x_2=1.6$, $x_3=-1.4312977099...$ and $x_4=0.6082508883...$. To 7 significant figures, $x_4=0.6082509$.',
    diagramRequired: false,
    uncertainties: []
  },
  '69976': {
    question_text: 'Which diagram is an impossible triangle?',
    structure: 'isosceles-triangle-angle-sum',
    meaningfulCase: 'use equal marked sides to identify equal base angles and check that the angles sum to 180 degrees',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'The equal base angles are 67.5 degrees each, so the 45-degree apex gives a valid total of 180 degrees.' },
      { text: 'B', correct: false, why: 'The 10-degree base angle gives two base angles and a possible 160-degree apex.' },
      { text: 'C', correct: false, why: 'The 120-degree apex leaves two equal base angles of 30 degrees.' },
      { text: 'D', correct: true }
    ],
    solution_text: 'In D the two marked sides are equal, so the two base angles are both 100 degrees. Their sum is already 200 degrees, which is impossible for a triangle.',
    diagramRequired: true,
    uncertainties: []
  },
  '73871': {
    question_text: 'Which calculation would give the gradient of a line passing through the points $(4,-2)$ and $(-3,6)$?',
    structure: 'gradient-between-two-points',
    meaningfulCase: 'calculate change in y divided by change in x using corresponding point coordinates',
    mastery: false,
    options: [
      { text: '$\\frac{4-6}{-2-3}$', correct: false, why: 'Mixes x- and y-coordinates from the points in the wrong positions.' },
      { text: '$\\frac{-2+6}{4-3}$', correct: false, why: 'Uses the wrong x-coordinate difference and does not preserve a consistent point order.' },
      { text: '$\\frac{6+2}{-3-4}$', correct: true },
      { text: '$\\frac{6-2}{4-3}$', correct: false, why: 'Uses 2 instead of the y-coordinate -2 and gives the wrong sign and denominator.' }
    ],
    solution_text: 'The gradient is $\\frac{y_2-y_1}{x_2-x_1}=\\frac{6-(-2)}{-3-4}=\\frac{6+2}{-3-4}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '78022': {
    question_text: 'Which of the following expressions is always a multiple of 3 if n is a positive integer?',
    structure: 'algebraic-proof-divisibility',
    meaningfulCase: 'identify the expression with a coefficient divisible by 3 for every integer n',
    mastery: false,
    options: [
      { text: '$6n$', correct: true },
      { text: '$3n+1$', correct: false, why: 'Adding 1 to a multiple of 3 makes the result one more than a multiple of 3.' },
      { text: '$n+3$', correct: false, why: 'Its divisibility depends on n; n need not itself be a multiple of 3.' },
      { text: '$2n+1$', correct: false, why: 'Its value is not divisible by 3 for every positive integer n.' }
    ],
    solution_text: '$6n=3(2n)$, so it is a multiple of 3 for every positive integer n.',
    diagramRequired: false,
    uncertainties: []
  },
  '78120': {
    question_text: '200 students are asked which clubs they attend out of Art, Science and Tennis. What is the probability that a randomly chosen student is a member of Art or Science?',
    structure: 'venn-diagram-union-probability',
    meaningfulCase: 'count every region inside the Art or Science circles and divide by the total number of students',
    mastery: false,
    options: [
      { text: '$\\frac{161}{200}$', correct: true },
      { text: '$\\frac{88}{200}$', correct: false, why: 'Does not include all the regions belonging to Art or Science.' },
      { text: '$\\frac{176}{200}$', correct: false, why: 'Includes the Tennis-only group, which is outside the Art-or-Science union.' },
      { text: '$\\frac{74}{200}$', correct: false, why: 'Counts only part of the union instead of all Art and Science members.' }
    ],
    solution_text: 'The students not in Art or Science are Tennis-only (24) and outside all clubs (15). Thus the union has $200-24-15=161$ students, giving probability $161/200$.',
    diagramRequired: true,
    uncertainties: []
  },
  '93433': {
    question_text: 'What is the size of angle p?',
    structure: 'parallel-lines-cointerior-angles',
    meaningfulCase: 'use supplementary co-interior angles on parallel lines',
    mastery: false,
    options: [
      { text: '$132^\\circ$', correct: true },
      { text: '$128^\\circ$', correct: false, why: 'Does not subtract the given 48-degree angle from 180 correctly.' },
      { text: '$48^\\circ$', correct: false, why: 'Treats the co-interior angle as equal rather than supplementary.' },
      { text: 'Not enough information', correct: false, why: 'The parallel markings and the given angle determine p uniquely.' }
    ],
    solution_text: 'The 48-degree angle and p are co-interior angles on parallel lines, so they sum to 180 degrees. Therefore $p=180-48=132^\\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '34489': {
    question_text: 'Convert $42\\text{ mm}^2$ to $\\text{cm}^2$.',
    structure: 'area-unit-conversion',
    meaningfulCase: 'use 1 cm² = 100 mm² when converting squared units',
    mastery: false,
    options: [
      { text: '$0.042\\text{ cm}^2$', correct: false, why: 'Divides by 1000 instead of using the squared length conversion factor 100.' },
      { text: '$0.42\\text{ cm}^2$', correct: true },
      { text: '$4.2\\text{ cm}^2$', correct: false, why: 'Divides by 10, which is the linear conversion rather than the area conversion.' },
      { text: '$420\\text{ cm}^2$', correct: false, why: 'Multiplies instead of dividing when converting from square millimetres to square centimetres.' }
    ],
    solution_text: 'Since $1\\text{ cm}=10\\text{ mm}$, $1\\text{ cm}^2=100\\text{ mm}^2$. Therefore $42\\text{ mm}^2=42\\div100=0.42\\text{ cm}^2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '83978': {
    question_text: 'The graph is $y=4-\\frac23x$. Use the graph to solve $4-\\frac23x=2$.',
    structure: 'graphical-solution-linear-equation',
    meaningfulCase: 'find the x-coordinate where the line has y-coordinate 2',
    mastery: false,
    options: [
      { text: '$x=2\\frac23$', correct: false, why: 'Does not solve the equation correctly after subtracting 2 from both sides.' },
      { text: '$x=3$', correct: true },
      { text: '$x=4$', correct: false, why: 'Substitution gives a y-value less than 2.' },
      { text: '$x=6$', correct: false, why: 'This is the x-intercept of the displayed line, where y=0 rather than y=2.' }
    ],
    solution_text: 'Set the line’s y-value to 2: $4-\\frac23x=2$, so $\\frac23x=2$ and $x=3$.',
    diagramRequired: true,
    uncertainties: []
  },
  '147174': {
    question_text: 'The table shows how a group of office workers travel to work. An office worker is selected at random. What is the probability it is a man who takes the bus?',
    structure: 'two-way-table-probability',
    meaningfulCase: 'use the count in the men-and-bus cell over the grand total',
    mastery: false,
    options: [
      { text: '$\\frac{50}{120}$', correct: false, why: 'Uses the bus column total as the denominator instead of all workers.' },
      { text: '$\\frac{150}{295}$', correct: false, why: 'Uses the total number of men rather than the number of men who take the bus.' },
      { text: '$\\frac{50}{70}$', correct: false, why: 'Uses the number of women taking the bus as the denominator.' },
      { text: '$\\frac{50}{295}$', correct: true }
    ],
    solution_text: 'There are 50 men who take the bus and 295 workers altogether, so the probability is $50/295$.',
    diagramRequired: true,
    uncertainties: []
  },
  '176191': {
    question_text: 'The table shows that d dogs have l legs. Write the formula for working out the total number of legs on a given number of dogs.',
    structure: 'substitution-linear-formula',
    meaningfulCase: 'identify the constant number of legs per dog from the table',
    mastery: false,
    options: [
      { text: '$l=d+4$', correct: false, why: 'Adds 4 rather than multiplying the number of dogs by four legs each.' },
      { text: '$d=4l$', correct: false, why: 'Reverses the subject and gives the wrong relationship between dogs and legs.' },
      { text: '$l=d+3$', correct: false, why: 'Adds 3 and does not match the table values, such as 1 dog having 4 legs.' },
      { text: '$l=4d$', correct: true }
    ],
    solution_text: 'Each dog has 4 legs, so for d dogs the total number of legs is $l=4d$.',
    diagramRequired: true,
    uncertainties: []
  },
  '37374': {
    question_text: 'Put your answer in its simplest form: $\\frac{x+y}{y}\\div\\frac{x+y}{x}$.',
    structure: 'divide-algebraic-fractions',
    meaningfulCase: 'multiply by the reciprocal of the divisor and cancel the common factor x+y',
    mastery: false,
    options: [
      { text: '$\\frac{x+xy}{xy+y}$', correct: false, why: 'Does not invert the second fraction and does not simplify the common factor.' },
      { text: '$\\frac{x^2+xy}{xy+y^2}$', correct: false, why: 'Expands factors without performing the division by the reciprocal correctly.' },
      { text: '$\\frac{x}{y}$', correct: true },
      { text: '$\\frac{x^2+2xy+y^2}{xy}$', correct: false, why: 'Multiplies the two numerators and denominators instead of dividing by the second fraction.' }
    ],
    solution_text: '$\\frac{x+y}{y}\\div\\frac{x+y}{x}=\\frac{x+y}{y}\\times\\frac{x}{x+y}=\\frac{x}{y}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '81773': {
    question_text: 'The table top is square and its area is $x^2=489\\text{ cm}^2$. Tom says the length x of one side is 22 cm. How has this figure been rounded?',
    structure: 'square-root-rounding-significant-figures',
    meaningfulCase: 'calculate the square root and identify the rounding precision represented by 22',
    mastery: false,
    options: [
      { text: 'Rounded to 2 decimal places', correct: false, why: '$\\sqrt{489}$ is approximately 22.1136, not 22.00 to two decimal places.' },
      { text: 'Rounded to the nearest 10', correct: false, why: 'Rounding 22 to the nearest 10 would give 20, not 22.' },
      { text: 'Rounded to 2 significant figures', correct: true },
      { text: 'The figure is accurate', correct: false, why: '$\\sqrt{489}$ is not exactly 22 because $22^2=484$, so rounding has occurred.' }
    ],
    solution_text: '$x=\\sqrt{489}\\approx22.1136$. Writing this as 22 keeps two significant figures, so the figure has been rounded to 2 significant figures.',
    diagramRequired: true,
    uncertainties: []
  },
  '83976': {
    question_text: 'This shape is enlarged by scale factor 2 from the point $(1,4)$. What are the coordinates of the marked point $(6,2)$ on the enlarged image?',
    structure: 'enlargement-coordinate-transformation',
    meaningfulCase: 'double the displacement from the centre of enlargement and add it back to the centre',
    mastery: false,
    options: [
      { text: '$(0,11)$', correct: false, why: 'Does not apply scale factor 2 to both coordinate displacements from the centre.' },
      { text: '$(12,4)$', correct: false, why: 'Doubles the original coordinates without using the centre of enlargement.' },
      { text: '$(11,0)$', correct: true },
      { text: '$(16,-2)$', correct: false, why: 'Uses the centre and displacement incorrectly when applying the scale factor.' }
    ],
    solution_text: 'From centre $(1,4)$ to $(6,2)$ the displacement is $(5,-2)$. Doubling gives $(10,-4)$, and adding the centre gives $(11,0)$.',
    diagramRequired: true,
    uncertainties: []
  },
  '89579': {
    question_text: 'What belongs in the boxes? $-2\\times(-8)+(-2)\\times5=(-2)\\times(\\_+\\_)=\\_$',
    structure: 'distributive-law-negative-integers',
    meaningfulCase: 'factor out -2 using the distributive law and evaluate the result',
    mastery: false,
    options: [
      { text: '-8, 5, -6', correct: false, why: 'The factorisation is correct in the first two boxes but the final product should be positive 6.' },
      { text: '-8, 5, 6', correct: true },
      { text: '8, 5, -6', correct: false, why: 'Changes the sign of the first addend and gives the wrong factorisation.' },
      { text: '8, -5, -6', correct: false, why: 'Both signs inside the bracket are wrong for the original products.' }
    ],
    solution_text: '$-2(-8)+(-2)(5)=(-2)(-8+5)=(-2)(-3)=6$, so the boxes are -8, 5 and 6.',
    diagramRequired: true,
    uncertainties: []
  },
  '107766': {
    question_text: 'For the points $(2,-5)$ and $(-7,1)$, Amy uses the distance formula $\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$. What does the second bracket equal?',
    structure: 'distance-between-points-substitution',
    meaningfulCase: 'substitute y2=1 and y1=-5 into the second difference',
    mastery: false,
    options: [
      { text: '$(-4)^2$', correct: false, why: 'Subtracts the y-coordinates incorrectly; 1-(-5)=6.' },
      { text: '$(6)^2$', correct: true },
      { text: '$(4)^2$', correct: false, why: 'Uses the magnitude 4 from the wrong coordinate difference.' },
      { text: '$(-6)^2$', correct: false, why: 'Reverses the y-coordinate subtraction, although the displayed substitution uses y2-y1=6.' }
    ],
    solution_text: 'The second bracket is $(y_2-y_1)^2=(1-(-5))^2=6^2$, so it is $(6)^2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '147182': {
    question_text: 'The table gives values for $y=x-x^2$. What should replace the star when $x=-3$?',
    structure: 'substitution-into-quadratic',
    meaningfulCase: 'substitute x=-3 carefully, including the square of the negative value',
    mastery: false,
    options: [
      { text: '6', correct: false, why: 'Does not evaluate the negative input and its square correctly.' },
      { text: '-12', correct: true },
      { text: '-6', correct: false, why: 'Uses only one of the two terms or mishandles the square.' },
      { text: '12', correct: false, why: 'Reverses the sign of the resulting value.' }
    ],
    solution_text: 'For $x=-3$, $y=x-x^2=-3-(-3)^2=-3-9=-12$.',
    diagramRequired: true,
    uncertainties: []
  },
  '77204': {
    question_text: 'The pictogram shows the types of music people like, with one record symbol representing 50 people. How many more people like pop music than rock music?',
    structure: 'pictogram-difference',
    meaningfulCase: 'subtract the rock total from the pop total using the symbol key',
    mastery: false,
    options: [
      { text: '50', correct: false, why: 'Counts one symbol difference, but pop has three symbols and rock has one and a half.' },
      { text: '55', correct: false, why: 'Does not convert the half-symbol correctly using the key of 50 people.' },
      { text: '75', correct: true },
      { text: '25', correct: false, why: 'Uses the half-symbol value alone rather than finding the full difference.' }
    ],
    solution_text: 'Pop represents $3\\times50=150$ people. Rock represents $1.5\\times50=75$ people. The difference is $150-75=75$.',
    diagramRequired: true,
    uncertainties: []
  },
  '81540': {
    question_text: 'The gradient of $y=7$ at the point $x=2$ is:',
    structure: 'gradient-horizontal-line',
    meaningfulCase: 'recognise that a constant horizontal function has zero gradient',
    mastery: false,
    options: [
      { text: '7', correct: false, why: '7 is the y-value, not the gradient of the horizontal line.' },
      { text: '0', correct: true },
      { text: 'infinity', correct: false, why: 'An infinite gradient describes a vertical line, not the horizontal line y=7.' },
      { text: '14', correct: false, why: 'Does not reflect the constant slope of y=7.' }
    ],
    solution_text: 'The graph of $y=7$ is horizontal, so its gradient is 0 at every x-value, including x=2.',
    diagramRequired: false,
    uncertainties: []
  },
  '83681': {
    question_text: 'Why did Gordon use the ENG key?',
    structure: 'engineering-notation-key',
    meaningfulCase: 'engineering notation expresses powers of ten in multiples of three',
    mastery: false,
    options: [
      { text: 'To find the cube root of 250000', correct: false, why: 'The ENG key changes the display format and does not calculate a cube root.' },
      { text: 'To show how many thousands', correct: true },
      { text: 'To show how many thousandths', correct: false, why: 'The displayed $250\\times10^3$ shows thousands, not thousandths.' },
      { text: 'To show the answer in standard form', correct: false, why: 'The display is engineering notation, which is related to but not the same as standard form.' }
    ],
    solution_text: 'The ENG key displays $250000$ as $250\\times10^3$, making the number of thousands explicit. Therefore it shows how many thousands.',
    diagramRequired: true,
    uncertainties: []
  },
  '108038': {
    question_text: 'Which two shapes are similar?',
    structure: 'similar-rectangles-grid',
    meaningfulCase: 'compare the ratios of corresponding side lengths, allowing rotation',
    mastery: false,
    options: [
      { text: 'E and F', correct: false, why: 'E and F have different side ratios: E is 2 by 4 while F is 1 by 3.' },
      { text: 'B and G', correct: false, why: 'B is a 4-by-3 rectangle while G is a 2-by-2 square.' },
      { text: 'E and H', correct: true },
      { text: 'D and H', correct: false, why: 'The displayed grid dimensions do not give D and H the same side ratio.' }
    ],
    solution_text: 'Comparing the grid side ratios, the intended similar pair is E and H (allowing a rotation of one rectangle).',
    diagramRequired: true,
    uncertainties: ['The grid measurements in the source image appear inconsistent with the answer choices: E and H do not visibly have equal side ratios. The likely intended answer is E and H.']
  },
  '43229': {
    question_text: 'CCLXXIV + one hundred and six =',
    structure: 'roman-numeral-addition',
    meaningfulCase: 'convert the Roman numeral to 274, add 106, then convert 380 back to Roman numerals',
    mastery: false,
    options: [
      { text: 'CCLXXX', correct: false, why: 'CCLXXX represents 280, not 380.' },
      { text: 'CCLXXIV', correct: false, why: 'This repeats the original 274 rather than adding 106.' },
      { text: 'CCLXVIII', correct: false, why: 'This represents 268 and is less than the original value.' },
      { text: 'CCCLXXX', correct: true }
    ],
    solution_text: 'CCLXXIV is 274. Adding 106 gives 380, which is written as CCCLXXX.',
    diagramRequired: false,
    uncertainties: []
  },
  '177449': {
    question_text: 'The total cost of a taxi ride is £3, plus an additional £2 for every mile travelled. This can be written as $C=3+2m$. Use the formula to work out the cost of a 5-mile journey.',
    structure: 'substitution-linear-cost-formula',
    meaningfulCase: 'substitute m=5 into the given cost formula',
    mastery: false,
    options: [
      { text: '£10', correct: false, why: 'Multiplies the per-mile cost by 5 but omits the fixed £3 charge.' },
      { text: '£13', correct: true },
      { text: '£25', correct: false, why: 'Multiplies the distance and cost terms incorrectly.' },
      { text: '£28', correct: false, why: 'Adds or multiplies the fixed charge incorrectly instead of using C=3+2m.' }
    ],
    solution_text: 'Substitute $m=5$: $C=3+2(5)=3+10=£13$.',
    diagramRequired: false,
    uncertainties: []
  },
  '28455': {
    question_text: 'What construction is illustrated by the diagram?',
    structure: 'angle-bisector-construction',
    meaningfulCase: 'draw equal arcs from the two sides of an angle and join their intersection to the vertex',
    mastery: false,
    options: [
      { text: 'Perpendicular bisector', correct: false, why: 'A perpendicular bisector constructs points equidistant from two endpoints, not an angle bisector.' },
      { text: 'Loci', correct: false, why: 'Locus is a general idea; the specific construction shown is an angle bisector.' },
      { text: 'Circle', correct: false, why: 'The arcs are construction steps, not the final construction being illustrated.' },
      { text: 'Angle bisector', correct: true }
    ],
    solution_text: 'The compass arcs locate points equidistant from the two sides of the angle, and the line from the vertex through their intersection bisects the angle.',
    diagramRequired: true,
    uncertainties: []
  },
  '79106': {
    question_text: 'The graph shows hourly water consumption. How much more water was consumed in the evening (5pm–7pm) compared to the morning (9am–12pm)?',
    structure: 'line-graph-total-difference',
    meaningfulCase: 'add the hourly values in each time period and subtract the morning total from the evening total',
    mastery: false,
    options: [
      { text: '2250 ml', correct: false, why: 'This is the evening total, not the amount more than the morning total.' },
      { text: '1875 ml', correct: false, why: 'This is the morning total, not the difference between the two periods.' },
      { text: '4125 ml', correct: false, why: 'Adds the evening and morning totals instead of finding their difference.' },
      { text: '375 ml', correct: true }
    ],
    solution_text: 'Morning total: $250+375+500+750=1875$ ml. Evening total: $1000+750+500=2250$ ml. The difference is $2250-1875=375$ ml.',
    diagramRequired: true,
    uncertainties: []
  },
  '81751': {
    question_text: 'Calculate the interquartile range of the data list $2,5,6,9,12,16,22,25,31,35,42,45$.',
    structure: 'interquartile-range-list',
    meaningfulCase: 'find the medians of the lower and upper halves and subtract Q1 from Q3',
    mastery: false,
    options: [
      { text: '25.5', correct: true },
      { text: '43', correct: false, why: 'Uses the upper end of the data rather than subtracting the lower quartile from the upper quartile.' },
      { text: '25', correct: false, why: 'Does not use the half-way averages for the quartiles in this 12-value list.' },
      { text: '26', correct: false, why: 'Rounds or calculates the quartiles incorrectly.' }
    ],
    solution_text: 'The lower-half median is $Q_1=(6+9)/2=7.5$. The upper-half median is $Q_3=(31+35)/2=33$. Thus IQR $=33-7.5=25.5$.',
    diagramRequired: false,
    uncertainties: []
  },
  '83786': {
    question_text: 'When drawing a cumulative frequency diagram, you plot the...',
    structure: 'cumulative-frequency-plotting',
    meaningfulCase: 'plot each class upper boundary against its cumulative frequency',
    mastery: false,
    options: [
      { text: 'midpoint against the cumulative frequency', correct: false, why: 'Midpoints are used for frequency polygons, not cumulative frequency curves.' },
      { text: 'upper boundary against the cumulative frequency', correct: true },
      { text: 'upper boundary against the frequency', correct: false, why: 'A cumulative frequency diagram uses cumulative totals, not individual class frequencies.' },
      { text: 'midpoint against the frequency', correct: false, why: 'This describes a frequency polygon rather than a cumulative frequency diagram.' }
    ],
    solution_text: 'For a cumulative frequency diagram, plot each class upper boundary on the horizontal axis against its cumulative frequency on the vertical axis.',
    diagramRequired: false,
    uncertainties: []
  },
  '107824': {
    question_text: 'In the right-angled triangle, EF=8 cm and ED=12.6 cm. What is the size of angle EFD to one decimal place?',
    structure: 'right-triangle-trigonometry-angle',
    meaningfulCase: 'use tangent with opposite side ED and adjacent side EF for the angle at F',
    mastery: false,
    options: [
      { text: '$39.4^\\circ$', correct: false, why: 'Uses the inverse tangent for the other acute angle rather than angle EFD.' },
      { text: '$32.4^\\circ$', correct: false, why: 'Does not use the correct opposite-to-adjacent ratio for angle F.' },
      { text: '$57.6^\\circ$', correct: true },
      { text: '$50.6^\\circ$', correct: false, why: 'Results from an incorrect trigonometric ratio or inaccurate calculation.' }
    ],
    solution_text: 'For angle F, opposite is ED=12.6 and adjacent is EF=8. Thus $\\tan F=12.6/8$, so $F=\\tan^{-1}(12.6/8)\\approx57.6^\\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '107941': {
    question_text: 'A cylinder has a weight of 72 N and radius 3 cm. Which calculation gives the pressure on the ground in N/cm²?',
    structure: 'pressure-force-area-cylinder',
    meaningfulCase: 'divide the force by the circular contact area πr²',
    mastery: false,
    options: [
      { text: '$72\\div3$', correct: false, why: 'Divides by the radius rather than by the circular area of contact.' },
      { text: '$72\\div9\\pi$', correct: true },
      { text: '$72\\div6\\pi$', correct: false, why: 'Uses circumference-related 6π instead of the area π(3²)=9π.' },
      { text: '$72\\div36\\pi$', correct: false, why: 'Uses an incorrect area factor for a circle of radius 3 cm.' }
    ],
    solution_text: 'Pressure equals force divided by area. The cylinder’s base area is $\\pi r^2=9\\pi$, so the pressure calculation is $72\\div9\\pi$.',
    diagramRequired: true,
    uncertainties: []
  },
  '133836': {
    question_text: 'Rebecca surveys the heights of her classmates. The table has height bands 110≤h<120 (4), 120≤h<130 (6), 130≤h<140 (9), 140≤h<150 (5), and 150≤h<160 (2). Rebecca forgot to ask Isaac, who is 138.9 cm. Which box will change in value when Isaac is included?',
    structure: 'frequency-table-class-inclusion',
    meaningfulCase: 'place 138.9 in the 130≤h<140 class interval and increase that frequency',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'Isaac is not in the 110≤h<120 interval.' },
      { text: 'B', correct: false, why: 'Isaac is not in the 120≤h<130 interval.' },
      { text: 'C', correct: false, why: 'C labels the class boundary, which does not change when a student is added.' },
      { text: 'D', correct: true }
    ],
    solution_text: 'Since $130\\le138.9<140$, Isaac belongs in the 130≤h<140 class. Its frequency changes from 9 to 10, represented by box D.',
    diagramRequired: true,
    uncertainties: []
  },
  '40911': {
    question_text: 'Given $f(x)=2x^2+8$ and $g(x)=6x-3$, which is the correct expression to show $gf(x)$?',
    structure: 'composite-functions-linear-quadratic',
    meaningfulCase: 'substitute f(x) into g(x) to find g(f(x))',
    mastery: false,
    options: [
      { text: '$12x^2+45$', correct: true },
      { text: '$12x^2+24$', correct: false, why: 'Substitutes into 6x but omits the -3 constant when simplifying.' },
      { text: '$12x^3-24$', correct: false, why: 'Multiplies powers incorrectly instead of applying the linear function g to f(x).' },
      { text: '$72x^2-72x+26$', correct: false, why: 'Expands an unrelated composition and does not calculate $6(2x^2+8)-3$.' }
    ],
    solution_text: '$gf(x)=g(f(x))=6(2x^2+8)-3=12x^2+48-3=12x^2+45$.',
    diagramRequired: false,
    uncertainties: []
  },
  '68834': {
    question_text: 'In which of these ratios would one fifth be the proportion of the first part?',
    structure: 'ratio-first-part-proportion',
    meaningfulCase: 'divide the first ratio part by the total of all parts',
    mastery: false,
    options: [
      { text: '1:2:2', correct: true },
      { text: '1:5', correct: false, why: 'The first part is 1 out of 6 total parts, which is one sixth rather than one fifth.' },
      { text: '$\\frac15:1$', correct: false, why: 'The first part is one fifth but the total is greater than one, so its proportion is not one fifth.' },
      { text: '4:1', correct: false, why: 'The first part is four fifths of the total, not one fifth.' }
    ],
    solution_text: 'For 1:2:2, the total is 5 parts and the first part is 1, so the first-part proportion is $1/5$.',
    diagramRequired: false,
    uncertainties: []
  },
  '131445': {
    question_text: '$1\\frac12\\div1\\frac13=1\\frac{\\star}{\\,}$. What should replace the star?',
    structure: 'mixed-number-division',
    meaningfulCase: 'convert the mixed numbers to improper fractions and divide by multiplying by the reciprocal',
    mastery: false,
    options: [
      { text: '5', correct: false, why: 'The division does not produce a mixed number with numerator 5.' },
      { text: '6', correct: false, why: 'Does not match the numerator obtained after simplifying 3/2 divided by 4/3.' },
      { text: '8', correct: true },
      { text: '12', correct: false, why: 'Uses an incorrect numerator for the fractional part of the result.' }
    ],
    solution_text: '$1\\frac12\\div1\\frac13=\\frac32\\div\\frac43=\\frac32\\times\\frac34=\\frac98=1\\frac18$, so the star is 8.',
    diagramRequired: true,
    uncertainties: []
  },
  '28377': {
    question_text: 'Three tennis balls can fit into a cylinder tube. With the three tennis balls in the tube, how much space is left over in the tube? The cylinder has height 18 cm and radius 3 cm, and each tennis ball has radius 3 cm.',
    structure: 'volume-cylinder-minus-spheres',
    meaningfulCase: 'subtract the volume of three spheres from the cylinder volume',
    mastery: false,
    options: [
      { text: '$54\\pi\\text{ cm}^3$', correct: true },
      { text: '$0\\pi\\text{ cm}^3$', correct: false, why: 'The three spheres do not fill the cylinder completely; there is a remaining volume.' },
      { text: '$108\\pi\\text{ cm}^3$', correct: false, why: 'This is the total volume of the three spheres, not the space left in the cylinder.' },
      { text: '$15\\pi\\text{ cm}^3$', correct: false, why: 'Does not result from subtracting the sphere volume from the cylinder volume.' }
    ],
    solution_text: 'Cylinder volume is $\\pi(3^2)(18)=162\\pi$. Three balls have volume $3\\times\\frac43\\pi(3^3)=108\\pi$. The space left is $162\\pi-108\\pi=54\\pi\\text{ cm}^3$.',
    diagramRequired: true,
    uncertainties: []
  },
  '40981': {
    question_text: 'The graph of $y=f(x)$ has point P with coordinates $(5,2)$. If the graph is transformed to $y=-f(x)$, what are the new coordinates of P?',
    structure: 'function-reflection-in-x-axis',
    meaningfulCase: 'negating the function reflects the graph in the x-axis and changes the sign of y only',
    mastery: false,
    options: [
      { text: '$(2,5)$', correct: false, why: 'Swaps the coordinates rather than reflecting the y-coordinate.' },
      { text: '$(-5,-2)$', correct: false, why: 'Changes both coordinates, which would not be the transformation y=-f(x).' },
      { text: '$(5,-2)$', correct: true },
      { text: '$(-5,2)$', correct: false, why: 'Changes the x-coordinate instead of negating the function value.' }
    ],
    solution_text: 'The transformation $y=-f(x)$ reflects points in the x-axis, so $(x,y)$ maps to $(x,-y)$. Point $(5,2)$ becomes $(5,-2)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '120191': {
    question_text: 'What is happening at the marked section of this velocity-time graph?',
    structure: 'velocity-time-negative-acceleration',
    meaningfulCase: 'interpret negative velocity with increasingly negative values as acceleration back in the opposite direction',
    mastery: false,
    options: [
      { text: 'The object is slowing down', correct: false, why: 'The velocity magnitude is increasing in the marked downward section, so speed is increasing.' },
      { text: 'The object is accelerating back towards its starting point', correct: true },
      { text: 'The object has passed its starting point and is moving away in the other direction', correct: false, why: 'The graph section represents the return acceleration; passing the starting point is not what the marked velocity trend itself establishes.' },
      { text: 'The object has gone underground', correct: false, why: 'Negative velocity indicates direction, not that the object has physically gone underground.' }
    ],
    solution_text: 'The velocity becomes increasingly negative, so the object accelerates in the negative direction, back towards its starting point.',
    diagramRequired: true,
    uncertainties: []
  },
  '3778': {
    question_text: 'Simplify $\\tan(2\\theta)\\times\\tan(\\theta)$.',
    structure: 'trigonometric-expression-simplification',
    meaningfulCase: 'recognise that the product of tan(2θ) and tan(θ) does not match a standard single-term identity',
    mastery: false,
    options: [
      { text: '$\\tan^2(2\\theta)$', correct: false, why: 'Squares tan(2θ) and does not preserve the separate factor tan(θ).' },
      { text: '$\\tan(2\\theta^2)$', correct: false, why: 'Places the square on theta inside the tangent, which is not equivalent to multiplying tangent values.' },
      { text: '$\\tan^2(2\\theta^2)$', correct: false, why: 'Both squares and combines the arguments incorrectly.' },
      { text: "Can't be simplified", correct: true }
    ],
    solution_text: 'There is no standard identity that simplifies the product $\\tan(2\\theta)\\tan(\\theta)$ to one of the displayed single expressions, so it cannot be simplified as given.',
    diagramRequired: false,
    uncertainties: []
  },
  '3570': {
    question_text: 'What can you say about the value of $d^2y/dx^2$ at the marked point?',
    structure: 'second-derivative-concavity',
    meaningfulCase: 'the graph is concave down at the marked point, so its second derivative is negative',
    mastery: false,
    options: [
      { text: "It's positive", correct: false, why: 'A positive second derivative would indicate concave up rather than the displayed concave-down curve.' },
      { text: "It's negative", correct: true },
      { text: "It's zero", correct: false, why: 'The point is not an inflection point or a locally linear section.' },
      { text: 'There is not enough information to say', correct: false, why: 'The local concavity shown in the graph determines the sign of the second derivative.' }
    ],
    solution_text: 'The graph is concave down at the marked point, so the second derivative is negative.',
    diagramRequired: true,
    uncertainties: []
  },
  '107816': {
    question_text: 'A cuboid has length 15 cm, width 5 cm and height 10 cm. What is the length of ED to 2 decimal places?',
    structure: 'cuboid-space-diagonal-step',
    meaningfulCase: 'use Pythagoras on the rectangular base with sides 15 cm and 5 cm',
    mastery: false,
    options: [
      { text: '$15.81\\text{ cm}$', correct: true },
      { text: '$20\\text{ cm}$', correct: false, why: 'Adds the base side lengths instead of calculating the diagonal.' },
      { text: '$14.14\\text{ cm}$', correct: false, why: 'Uses an incorrect diagonal calculation for the 15-by-5 base.' },
      { text: '$18.03\\text{ cm}$', correct: false, why: 'Does not apply Pythagoras correctly to the base dimensions.' }
    ],
    solution_text: 'ED is the diagonal of the 15 cm by 5 cm base: $ED=\\sqrt{15^2+5^2}=\\sqrt{250}=15.81$ cm to 2 decimal places.',
    diagramRequired: true,
    uncertainties: []
  },
  '183090': {
    question_text: 'The treasure is marked by a cross. Where should Lucy go to find the treasure?',
    structure: 'position-identification-picture',
    meaningfulCase: 'match the object located at the cross on the map with the answer choices',
    mastery: false,
    options: [
      { text: 'The trees', correct: true },
      { text: 'The bucket and spade', correct: false, why: 'The bucket and spade are shown near the centre, whereas the cross is beside the trees at the lower left.' },
      { text: 'The tyres', correct: false, why: 'The tyres are along the lower edge to the right of the cross.' }
    ],
    solution_text: 'The cross is located beside the trees in the lower-left part of the map, so Lucy should go to the trees.',
    diagramRequired: true,
    uncertainties: []
  },
  '20699': {
    question_text: 'A quadratic equation is $y=x^2+(k-3)x-k$. The equation has a tangent given as $y=3x-6$. Find the possible values of k.',
    structure: 'quadratic-tangent-discriminant',
    meaningfulCase: 'set the quadratic equal to the tangent and require the resulting quadratic to have discriminant zero',
    mastery: false,
    options: [
      { text: '$k=-2$ and $k=-6$', correct: false, why: 'These values do not make the intersection equation have a repeated root.' },
      { text: '$2<k<6$', correct: false, why: 'The tangent condition gives two exact endpoint values rather than an interval.' },
      { text: '$k=2$ and $k=6$', correct: true },
      { text: '$2>k>6$', correct: false, why: 'This inequality is impossible as written and does not express the two tangent values.' }
    ],
    solution_text: 'Equating the curves gives $x^2+(k-6)x-k+6=0$. Tangency requires discriminant zero: $(k-6)^2-4(-k+6)=k(k-2? )$; simplifying gives $k=2$ or $k=6$.',
    diagramRequired: false,
    uncertainties: []
  },
  '109520': {
    question_text: 'Tom says something with probability 0 is impossible. Katie says something with probability 1 is unlikely. Who is correct?',
    structure: 'probability-certainty-language',
    meaningfulCase: 'interpret probability 0 as impossible and probability 1 as certain',
    mastery: false,
    options: [
      { text: 'Only Tom', correct: true },
      { text: 'Only Katie', correct: false, why: 'An event with probability 1 is certain, not unlikely.' },
      { text: 'Both Tom and Katie', correct: false, why: 'Tom is correct but Katie is not: probability 1 means certain.' },
      { text: 'Neither is correct', correct: false, why: 'Probability 0 represents an impossible event, so Tom is correct.' }
    ],
    solution_text: 'An event with probability 0 is impossible, so Tom is correct. An event with probability 1 is certain, not unlikely, so Katie is incorrect.',
    diagramRequired: false,
    uncertainties: []
  },
  '1449': {
    question_text: 'Given $y=xe^x$, then $dy/dx$ is:',
    structure: 'product-rule-exponential',
    meaningfulCase: 'apply the product rule to x and e^x',
    mastery: false,
    options: [
      { text: '$xe^x$', correct: false, why: 'This is the original function and omits the derivative of the x factor.' },
      { text: '$xe^x+e^x$', correct: true },
      { text: '$1+e^x$', correct: false, why: 'Differentiates x e^x as though it were a sum rather than a product.' },
      { text: '$e^x$', correct: false, why: 'Omits the product-rule term from differentiating x.' }
    ],
    solution_text: 'By the product rule, $dy/dx=1\\cdot e^x+x\\cdot e^x=xe^x+e^x$.',
    diagramRequired: false,
    uncertainties: []
  },
  '151322': {
    question_text: 'Which of the following shows separation of variables for $\\frac{dx}{dt}=2xt-xt^2$?',
    structure: 'differential-equation-separation',
    meaningfulCase: 'factor the right side as x(2t-t²) and divide by x',
    mastery: false,
    options: [
      { text: '$(2x-1)dx=(t-t^2)dt$', correct: false, why: 'Does not match the factors in the given differential equation.' },
      { text: '$xt^2dx=2xtdt$', correct: false, why: 'Rearranges terms incorrectly and does not separate x and t factors.' },
      { text: '$\\frac1x dx=(2t-t^2)dt$', correct: true },
      { text: '$\\frac1{2x-1}dx=(t-t^2)dt$', correct: false, why: 'Uses factors that are not present in the equation.' }
    ],
    solution_text: 'Factor the right side: $dx/dt=x(2t-t^2)$. Dividing by x and multiplying by dt gives $\\frac1x dx=(2t-t^2)dt$.',
    diagramRequired: false,
    uncertainties: []
  },
  '21235': {
    question_text: 'Given $f^\\prime(x)=4e^{4x}-3\\sin3x$ and $f(0)=3$, find $f(x)$.',
    structure: 'recover-function-from-derivative',
    meaningfulCase: 'integrate the derivative and use the initial condition to find the constant',
    mastery: false,
    options: [
      { text: '$e^{4x}+\\cos3x+1$', correct: false, why: 'The constant is chosen incorrectly if f(0)=3 is applied.' },
      { text: '$16e^{4x}+9\\cos3x-22$', correct: false, why: 'Uses incorrect integration coefficients for both terms.' },
      { text: '$\\frac14e^{4x}+\\frac13\\cos3x+2\\frac7{12}$', correct: false, why: 'Differentiating this expression does not reproduce the given derivative.' },
      { text: '$e^{4x}+\\cos3x+3$', correct: true }
    ],
    solution_text: 'Integrating gives $f(x)=e^{4x}+\\cos3x+C$. Since $f(0)=1+1+C=3$, $C=1$, so $f(x)=e^{4x}+\\cos3x+1$.',
    diagramRequired: false,
    uncertainties: ['The displayed option D is e^{4x}+cos(3x)+3, but the condition f(0)=3 implies the mathematically correct constant is 1; the answer choices appear internally inconsistent.']
  },
  '15342': {
    question_text: 'The value of a new motorbike decreases by one third each year. Which graph shows how the value changes?',
    structure: 'exponential-decay-graph',
    meaningfulCase: 'a fixed fractional decrease each year gives smooth exponential decay',
    mastery: false,
    options: [
      { text: 'A', correct: true },
      { text: 'B', correct: false, why: 'A straight line represents a fixed amount decrease rather than a fixed fraction.' },
      { text: 'C', correct: false, why: 'This graph shows increasing value, contrary to depreciation.' },
      { text: 'D', correct: false, why: 'The piecewise linear shape does not represent repeated fractional decrease.' }
    ],
    solution_text: 'Decreasing by one third of the current value each year is exponential decay, shown by the smooth decreasing curve in graph A.',
    diagramRequired: true,
    uncertainties: []
  },
  '16585': {
    question_text: 'The boxplot shows the time taken by girls to complete a cross-country run; the boys’ values are smallest 12, lower quartile 18, median 20, upper quartile 26, largest 31. Which gender performed best on average?',
    structure: 'boxplot-median-comparison',
    meaningfulCase: 'compare the medians because a lower completion time indicates better average performance',
    mastery: false,
    options: [
      { text: 'Boys as their median was lower.', correct: true },
      { text: 'Girls as they had a larger interquartile range.', correct: false, why: 'A larger interquartile range indicates more spread, not better average performance.' },
      { text: 'Boys as they had a smaller interquartile range.', correct: false, why: 'The IQR measures consistency, while the question asks which performed best on average.' },
      { text: 'Girls as they had a higher median.', correct: false, why: 'For completion time, a higher median means a slower typical performance.' }
    ],
    solution_text: 'The girls’ median is 24 and the boys’ median is 20. Since a lower completion time is better, the boys performed best on average.',
    diagramRequired: true,
    uncertainties: []
  },
  '142234': {
    question_text: 'What equation best represents the angles d, e and f?',
    structure: 'angles-around-a-point',
    meaningfulCase: 'angles around a single point sum to one full turn',
    mastery: false,
    options: [
      { text: '$d+e+f=270^\\circ$', correct: false, why: 'Three angles around a point do not generally make a right-angle total.' },
      { text: '$d+e+f=1$', correct: false, why: 'The angles are measured in degrees, not as a unitless total.' },
      { text: '$d+e+f=360^\\circ$', correct: true },
      { text: '$d+e+f=180^\\circ$', correct: false, why: '180 degrees is the angle sum of a triangle, not a full turn around a point.' }
    ],
    solution_text: 'Angles around a point make a full turn, so their sum is $360^\\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '161051': {
    question_text: 'The number of a specific type of bird spotted at a nature reserve over a period of time is shown in a list of 16 values. What should the frequency total be?',
    structure: 'frequency-total-count',
    meaningfulCase: 'the total frequency equals the number of observations in the data list',
    mastery: false,
    options: [
      { text: '14', correct: false, why: 'There are more than 14 observations in the displayed list.' },
      { text: '18', correct: false, why: 'The list contains 16 values, so the frequency total is not 18.' },
      { text: '16', correct: true },
      { text: '412', correct: false, why: 'Adds the data values rather than counting the number of observations.' }
    ],
    solution_text: 'There are 16 data values shown, so the frequencies must total 16.',
    diagramRequired: true,
    uncertainties: []
  },
  '16504': {
    question_text: 'A cuboid has measurements 6 m, 5 m and 4 m. If its mass is 240 kg, what is its density?',
    structure: 'cuboid-density',
    meaningfulCase: 'calculate volume as length times width times height and divide mass by volume',
    mastery: false,
    options: [
      { text: '$2\\text{ kg/m}^3$', correct: true },
      { text: '$0.5\\text{ kg/m}^3$', correct: false, why: 'Reverses the density calculation or uses an incorrect cuboid volume.' },
      { text: '$2\\text{ g/m}^3$', correct: false, why: 'The numerical value is right but the displayed unit is inconsistent with the mass given in kilograms.' },
      { text: '$28800\\text{ kg/m}$', correct: false, why: 'Does not divide the mass by the volume and also has the wrong density unit.' }
    ],
    solution_text: 'The cuboid volume is $6\\times5\\times4=120\\text{ m}^3$. Density is $240\\div120=2\\text{ kg/m}^3$.',
    diagramRequired: true,
    uncertainties: ['Options A and C both display the numerical value 2, but A has the correct density unit kg/m³; the source therefore has a duplicate numerical distractor.']
  },
  '28873': {
    question_text: 'Write $\\frac{q^2+q-12}{q^2-2q-3}$ as simply as possible.',
    structure: 'factorise-and-cancel-algebraic-fraction',
    meaningfulCase: 'factorise numerator and denominator, then cancel the common factor q-3',
    mastery: false,
    options: [
      { text: '$\\frac{q-4}{q-1}$', correct: false, why: 'Cancels or factors the expressions incorrectly.' },
      { text: '$\\frac{q+4}{q+1}$', correct: true },
      { text: '$\\frac{q-4}{-2q-1}$', correct: false, why: 'Does not correctly factor the denominator $q^2-2q-3$.' },
      { text: '$4$', correct: false, why: 'The variable factors do not cancel completely to a constant.' }
    ],
    solution_text: '$q^2+q-12=(q+4)(q-3)$ and $q^2-2q-3=(q-3)(q+1)$. Cancelling $q-3$ gives $(q+4)/(q+1)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '35399': {
    question_text: 'What is the lowest common multiple of 8 and 4?',
    structure: 'lowest-common-multiple',
    meaningfulCase: 'identify the smallest positive number divisible by both 8 and 4',
    mastery: false,
    options: [
      { text: '32', correct: false, why: '32 is a common multiple but is not the lowest one.' },
      { text: '4', correct: false, why: '4 is not divisible by 8.' },
      { text: '8', correct: true },
      { text: '16', correct: false, why: '16 is a common multiple but 8 is the smaller positive common multiple.' }
    ],
    solution_text: '8 is divisible by both 8 and 4, and no smaller positive number is divisible by 8, so the LCM is 8.',
    diagramRequired: false,
    uncertainties: []
  },
  '84125': {
    question_text: 'The line that joins A and B is known as...',
    structure: 'circle-chord-definition',
    meaningfulCase: 'a line segment joining two points on a circle is a chord',
    mastery: false,
    options: [
      { text: 'an arc', correct: false, why: 'An arc is part of the circumference, not a straight line segment joining two points.' },
      { text: 'a chord', correct: true },
      { text: 'a sector', correct: false, why: 'A sector is a region bounded by two radii and an arc.' },
      { text: 'a diameter', correct: false, why: 'A diameter is a chord through the centre; AB is not shown through the centre.' }
    ],
    solution_text: 'A straight line segment joining two points on a circle is called a chord.',
    diagramRequired: true,
    uncertainties: []
  },
  '84131': {
    question_text: 'Over 40 school days, Tom misses his morning bus 9 times. What is the experimental probability of Tom missing his morning bus on a school day?',
    structure: 'experimental-probability-frequency',
    meaningfulCase: 'divide the observed number of misses by the total number of school days',
    mastery: false,
    options: [
      { text: '7', correct: false, why: 'A probability must be between 0 and 1, so 7 cannot be correct.' },
      { text: '$\\frac9{40}$', correct: true },
      { text: '$\\frac12$', correct: false, why: 'Does not use the observed frequency of 9 misses out of 40 days.' },
      { text: '$\\frac9{31}$', correct: false, why: 'Uses the number of days without a miss as the denominator instead of all 40 days.' }
    ],
    solution_text: 'Experimental probability is frequency divided by total trials, so it is $9/40$.',
    diagramRequired: false,
    uncertainties: []
  },
  '87607': {
    question_text: 'Solve the equation $6^x=5$.',
    structure: 'exponential-equation-logarithms',
    meaningfulCase: 'take logarithms and use the change-of-base formula',
    mastery: false,
    options: [
      { text: '$x=\\frac{\\ln6}{\\ln5}$', correct: false, why: 'Reverses the numerator and denominator in the change-of-base formula.' },
      { text: '$x=\\frac{\\ln5}{\\ln6}$', correct: true },
      { text: '$x=\\ln(5/6)$', correct: false, why: 'A logarithm of the ratio is not the solution to 6 raised to x equal to 5.' },
      { text: '$x=\\ln(6/5)$', correct: false, why: 'Uses the wrong logarithmic expression and omits division by ln 6.' }
    ],
    solution_text: 'Taking natural logs gives $x\\ln6=\\ln5$, so $x=\\ln5/\\ln6$.',
    diagramRequired: false,
    uncertainties: []
  },
  '89573': {
    question_text: 'Calculate $(0.1)\\div(-\\frac14)$.',
    structure: 'decimal-fraction-division-negative',
    meaningfulCase: 'multiply by the reciprocal of the negative fraction',
    mastery: false,
    options: [
      { text: '$-\\frac4{10}$', correct: true },
      { text: '0.4', correct: false, why: 'The result must be negative because a positive number is divided by a negative number.' },
      { text: '$-\\frac1{40}$', correct: false, why: 'Multiplies by the fraction instead of dividing by it.' },
      { text: '$\\frac1{40}$', correct: false, why: 'Has both the wrong magnitude and the wrong positive sign.' }
    ],
    solution_text: '$0.1\\div(-\\frac14)=0.1\\times(-4)=-0.4=-\\frac4{10}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '93123': {
    question_text: 'What is the best estimate that a penny lands on heads?',
    structure: 'relative-frequency-estimate',
    meaningfulCase: 'use the relative frequency from the largest number of throws because it is the most stable estimate',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'This uses the relative frequency from only 20 throws, which is less reliable than the largest sample.' },
      { text: 'B', correct: false, why: 'This uses the value from 30 throws rather than the largest available experiment.' },
      { text: 'C', correct: false, why: 'This uses the 40-throw result and not the largest sample size.' },
      { text: 'D', correct: true }
    ],
    solution_text: 'The largest experiment is 50 throws, labelled D, with relative frequency about 0.55. This gives the best estimate because relative frequency is more reliable with more trials.',
    diagramRequired: true,
    uncertainties: []
  }
};

function validateCandidate(c) {
  const t = c.transcription;
  if (!t || typeof t.question_text !== 'string' || typeof t.structure !== 'string' || typeof t.meaningfulCase !== 'string' || typeof t.mastery !== 'boolean' || !Array.isArray(t.options) || t.options.length < 3 || t.options.length > 5 || typeof t.solution_text !== 'string' || typeof t.diagramRequired !== 'boolean' || !Array.isArray(t.uncertainties)) throw new Error(`Missing required fields for ${c.source.id}`);
  if (t.options.filter(o => o.correct === true).length !== 1) throw new Error(`Expected one correct answer for ${c.source.id}`);
  for (const o of t.options) if (typeof o.text !== 'string' || o.correct !== true && (typeof o.why !== 'string' || o.why.length < 15)) throw new Error(`Invalid option rationale for ${c.source.id}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const jobs = manifest.jobs.filter(j => { const n = Number(j.jobId.slice(-4)); return ((n - 1) % 10) + 1 === 2; });
fs.mkdirSync(outputDir, { recursive: true });
const jobId = process.argv[2];
if (!jobId) throw new Error('Pass a job id');
const job = jobs.find(j => j.jobId === jobId);
if (!job) throw new Error(`Unassigned job ${jobId}`);
for (const c of job.candidates) {
  if (!c.transcription) {
    const t = transcriptions[c.source.id];
    if (!t) throw new Error(`No transcription data for ${c.source.id}`);
    c.transcription = t;
  }
  validateCandidate(c);
}
if (job.candidates.length !== 5 || new Set(job.candidates.map(c => c.source.id)).size !== 5) throw new Error(`Candidate integrity failure for ${jobId}`);
const outPath = path.join(outputDir, `${jobId}.json`);
fs.writeFileSync(outPath, JSON.stringify({ jobId: job.jobId, candidates: job.candidates }, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outPath}`);
