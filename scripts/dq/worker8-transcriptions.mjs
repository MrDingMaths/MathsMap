import fs from 'fs';

const root = 'C:/Users/james/OneDrive/Admin/WebApps/MathsMap';
const dq = `${root}/.diagnostic-questions`;
const input = JSON.parse(fs.readFileSync(`${dq}/visual-jobs-current.json`, 'utf8'));
const outDir = `${dq}/transcriptions-full-20260802`;
fs.mkdirSync(outDir, { recursive: true });

const manual = {
  '167171': {
    question_text: 'Which of the following is true about $f(x)$ and $g(x)$, defined by the equation and graph below?\n\n$f(x)=x^2-1$\n\n[tikz]\n\\begin{tikzpicture}[scale=0.55]\n\\draw[gray!25,step=1] (-3,-2) grid (3,4);\\draw[->,thick] (-3.2,0)--(3.3,0);\\draw[->,thick] (0,-2.2)--(0,4.2);\\draw[blue,thick] (-2.2,3.8) parabola bend (0,-1) (2.2,3.8);\\draw[red,thick] plot[smooth] coordinates {(-2.6,-1.8) (-2.1,0) (-1.3,0.9) (-0.4,1.05) (0.5,1.05) (1.3,1.35) (2,2.5) (2.6,4)};\\node[blue] at (-1.7,3.1) {$f(x)=x^2-1$};\\node[red] at (1.25,1.7) {$g(x)$};\\end{tikzpicture}\n[/tikz]',
    structure: 'compare-function-values-from-equation-and-graph',
    meaningfulCase: 'evaluate-f-at-zero-and-read-g-at-zero',
    mastery: false,
    options: [
      { text: '$f(0)>g(0)$', correct: false, why: 'Reverses the comparison after evaluating the two values at zero.' },
      { text: '$f(0)<g(0)$', correct: true },
      { text: '$f(0)=g(0)$', correct: false, why: 'Assumes the two functions have the same vertical value at zero.' },
      { text: 'Cannot be determined', correct: false, why: 'Both the equation for f and the graph value for g are sufficient.' }
    ],
    solution_text: 'From the equation, $f(0)=0^2-1=-1$. Reading the graph gives $g(0)=1$. Since $-1<1$, the true statement is $f(0)<g(0)$.',
    diagramRequired: true,
    uncertainties: ['The plotted curve for g(x) is transcribed schematically because the source graph has no exact formula for g.']
  },
  '168827': {
    question_text: 'Substitute $y=15$ into the following expression:\n\n$3y+25$',
    structure: 'substitute-value-into-linear-expression', meaningfulCase: 'positive-integer-substitution', mastery: false,
    options: [
      { text: '$70$', correct: true },
      { text: '$43$', correct: false, why: 'Adds 25 to 18, using an incorrect multiplication of 3 and 15.' },
      { text: '$40$', correct: false, why: 'Adds 15 and 25 without applying the coefficient 3.' },
      { text: '$55$', correct: false, why: 'Adds 3 to 15 and then adds 25 instead of multiplying first.' }
    ],
    solution_text: 'Replace $y$ by $15$: $3y+25=3(15)+25=45+25=70$.', diagramRequired: false, uncertainties: []
  },
  '17311': {
    question_text: 'What is the limiting value as $n\to\infty$?\n\n$\\dfrac{3n-5}{1-2n}$',
    structure: 'find-limit-of-rational-sequence', meaningfulCase: 'ratio-of-leading-coefficients', mastery: false,
    options: [
      { text: '$-1.5$', correct: true },
      { text: '$5$', correct: false, why: 'Uses the constant numerator term rather than comparing leading terms.' },
      { text: '$3$', correct: false, why: 'Uses the numerator coefficient alone and ignores the denominator coefficient.' },
      { text: '$\\dfrac{3}{2}$', correct: false, why: 'Misses the negative sign from the leading denominator coefficient.' }
    ],
    solution_text: 'Divide numerator and denominator by $n$: $\\dfrac{3-5/n}{1/n-2}$. As $n\to\infty$, this tends to $\\dfrac{3}{-2}=-\\dfrac32=-1.5$.', diagramRequired: false, uncertainties: []
  },
  '181037': {
    question_text: 'Are there two equal groups?',
    structure: 'compare-cardinality-of-two-groups', meaningfulCase: 'one-to-one-counting-of-identical-objects', mastery: false,
    options: [
      { text: 'Yes', correct: true },
      { text: 'No', correct: false, why: 'Overlooks that each group contains exactly three fish.' },
      { text: 'Cannot be determined', correct: false, why: 'The visible fish can be counted directly in both groups.' }
    ],
    solution_text: 'Count the fish in each oval. The left group has three fish and the right group also has three fish, so the groups are equal.', diagramRequired: true, uncertainties: []
  },
  '2033': {
    question_text: 'What is the gradient of the normal to $y=x^2+2x$ at $x=1$?\n\n[tikz]\n\\begin{tikzpicture}[scale=0.5]\\draw[gray!25,step=1] (-5,-2) grid (5,6);\\draw[->] (-5.2,0)--(5.2,0);\\draw[->] (0,-2.2)--(0,6.2);\\draw[red,thick] plot[smooth] coordinates {(-4,8) (-3,3) (-2,0) (-1,-1) (0,0) (1,3) (2,8)};\\draw[blue,thick] (-4,4.75)--(4,2.75);\\node[blue] at (-3,4.3) {normal};\\node[red] at (1.5,3.2) {$y=x^2+2x$};\\end{tikzpicture}\n[/tikz]',
    structure: 'find-normal-gradient-from-derivative', meaningfulCase: 'negative-reciprocal-of-tangent-gradient', mastery: false,
    options: [
      { text: '$4$', correct: false, why: 'Finds the tangent gradient but does not take the normal gradient.' },
      { text: '$\\dfrac14$', correct: false, why: 'Takes the reciprocal but fails to change the sign for a normal.' },
      { text: '$-\\dfrac14$', correct: true },
      { text: '$-4$', correct: false, why: 'Changes the tangent sign without taking the reciprocal.' }
    ],
    solution_text: 'Differentiate: $\\dfrac{dy}{dx}=2x+2$. At $x=1$, the tangent gradient is $4$. The normal gradient is the negative reciprocal, $-\\dfrac{1}{4}$.', diagramRequired: true, uncertainties: []
  },
  '125261': {
    question_text: 'If a particle is in limiting equilibrium then which statement is always true?',
    structure: 'identify-limiting-friction-condition', meaningfulCase: 'friction-at-the-limit-of-motion', mastery: false,
    options: [
      { text: '$F_r<\\mu R$', correct: false, why: 'Describes friction below its limiting value, not limiting equilibrium.' },
      { text: '$F_r=\\mu R$', correct: true },
      { text: '$F_r>\\mu R$', correct: false, why: 'Friction cannot exceed the limiting value given by the coefficient and reaction.' },
      { text: '$F_r=0$', correct: false, why: 'Zero friction describes a different situation from limiting equilibrium.' }
    ],
    solution_text: 'At limiting equilibrium the frictional force has reached its maximum value. Therefore $F_r=\\mu R$.', diagramRequired: false, uncertainties: []
  },
  '125695': {
    question_text: 'The notation $\\bar{x}_4$ represents...',
    structure: 'interpret-sample-mean-notation', meaningfulCase: 'sample-size-subscript', mastery: false,
    options: [
      { text: 'The mean of a sample of size four', correct: true },
      { text: 'The distribution obtained when you take a sample four times and calculate the mean', correct: false, why: 'Interprets the subscript as a number of repeated samples instead of sample size.' },
      { text: 'The mean of a large number of four-item samples', correct: false, why: 'Confuses one sample mean with the mean across many samples.' },
      { text: 'The distribution obtained when you take a large number of four-item samples and calculate the mean of each', correct: false, why: 'Describes a sampling distribution, not the mean of one sample of four.' }
    ],
    solution_text: 'The bar indicates a sample mean, and the subscript $4$ gives the sample size. Thus $\\bar{x}_4$ is the mean of a sample containing four observations.', diagramRequired: false, uncertainties: []
  },
  '125779': {
    question_text: 'You are finding the MST for this network using Kruskal. This is correct so far. Finish the algorithm and give the length of the minimum connector.\n\n[tikz]\n\\begin{tikzpicture}[scale=0.55, every node/.style={font=\\scriptsize}]\\coordinate (A) at (0,2);\\coordinate (B) at (1,0);\\coordinate (C) at (3,3.2);\\coordinate (D) at (3,1.4);\\coordinate (E) at (5,2.1);\\coordinate (F) at (7,3.2);\\coordinate (G) at (7.1,1.5);\\coordinate (H) at (5.8,0);\\foreach \\u/\\v/\\w in {A/B/31,A/C/30,B/D/24,B/H/38,C/D/22,C/E/24,C/F/29,D/E/18,D/H/34,E/F/28,E/G/26,F/G/21,G/H/33}{\\draw (\\u)--node[fill=white,inner sep=1pt] {\\w} (\\v);};\\foreach \\p/\\lab in {A/A,B/B,C/C,D/D,E/E,F/F,G/G,H/H}{\\fill (\\p) circle (2pt) node[above right] {\\lab};};\\end{tikzpicture}\n[/tikz]',
    structure: 'complete-minimum-spanning-tree-by-kruskal', meaningfulCase: 'add-smallest-non-cycling-edges-until-connected', mastery: false,
    options: [
      { text: '$171$', correct: false, why: 'Omits one of the two additional edges needed to connect every vertex.' },
      { text: '$174$', correct: true },
      { text: '$173$', correct: false, why: 'Adds an incorrect edge total rather than the next valid Kruskal edges.' },
      { text: '$175$', correct: false, why: 'Uses an edge choice that is one unit too large for the minimum connector.' }
    ],
    solution_text: 'The selected edges have weights $18,21,22,24,26$. They connect $B,C,D,E,F,G$. To include $A$ and $H$, add $AC=30$ and $GH=33$. The minimum connector length is $18+21+22+24+26+30+33=174$.', diagramRequired: true, uncertainties: []
  },
  '13317': {
    question_text: 'Convert $z=(2,\\dfrac{\\pi}{3})$ into the form $x+iy$.',
    structure: 'convert-complex-number-from-polar-form', meaningfulCase: 'polar-angle-in-first-quadrant', mastery: false,
    options: [
      { text: '$\\dfrac{\\sqrt{3}}{2}+\\dfrac{i}{2}$', correct: false, why: 'Uses the sine and cosine values without multiplying by the modulus 2.' },
      { text: '$2+\\dfrac{i\\pi}{3}$', correct: false, why: 'Adds the polar modulus and argument instead of using rectangular components.' },
      { text: '$6+i$', correct: false, why: 'Does not apply the polar-to-Cartesian trigonometric conversion.' },
      { text: '$\\sqrt{3}+i$', correct: false, why: 'Swaps the real and imaginary components obtained from the polar form.' },
      { text: '$1+i\\sqrt{3}$', correct: true }
    ],
    solution_text: 'Using $z=r(\\cos\\theta+i\\sin\\theta)$, $z=2(\\cos(\\pi/3)+i\\sin(\\pi/3))=2(1/2+i\\sqrt{3}/2)=1+i\\sqrt{3}$.', diagramRequired: false, uncertainties: ['The source image has no original option for $1+i\\sqrt{3}$; that mathematically correct option was added to avoid claiming that the displayed $\\sqrt{3}+i$ is correct.']
  },
  '14335': {
    question_text: 'A set of data is coded according to the rule $y=\\dfrac{x-2}{5}$. The mean of the coded data, $\\bar{y}=12$. Work out the mean of the original data.',
    structure: 'decode-mean-under-linear-coding', meaningfulCase: 'invert-affine-coding-rule-for-mean', mastery: false,
    options: [
      { text: '$2$', correct: false, why: 'Uses the subtraction constant as the original mean.' },
      { text: '$14$', correct: false, why: 'Adds the offset but does not undo the division by 5.' },
      { text: '$60$', correct: false, why: 'Multiplies by 5 but forgets to add back the subtracted 2.' },
      { text: '$62$', correct: true }
    ],
    solution_text: 'The coding rule applies to the mean as well: $12=\\dfrac{\\bar{x}-2}{5}$. Hence $60=\\bar{x}-2$, so $\\bar{x}=62$.', diagramRequired: false, uncertainties: []
  },
  '28234': {
    question_text: 'The points $A$ and $B$ lie on the line $y=2x-1$, with $A=(2,3)$ and $B=(5,9)$. Given that $AC=2AB$, what are the coordinates of $C$?\n\n[tikz]\n\\begin{tikzpicture}[scale=0.38]\\draw[->] (0,0)--(10,0) node[right] {$x$};\\draw[->] (0,0)--(0,18) node[above] {$y$};\\draw[thick] (0,-1)--(9,17);\\fill (2,3) circle (3pt) node[below left] {$A(2,3)$};\\fill (5,9) circle (3pt) node[below right] {$B(5,9)$};\\fill (8,15) circle (3pt) node[above right] {$C$};\\end{tikzpicture}\n[/tikz]',
    structure: 'extend-collinear-segment-by-vector-ratio', meaningfulCase: 'point-c-two-times-vector-ab-from-a', mastery: false,
    options: [
      { text: '$(7,12)$', correct: false, why: 'Adds only two units of each coordinate instead of twice the full displacement.' },
      { text: '$(8,15)$', correct: true },
      { text: '$(6,12)$', correct: false, why: 'Doubles the coordinates of B without preserving the vector from A.' },
      { text: '$(11,21)$', correct: false, why: 'Adds the displacement three times rather than twice.' }
    ],
    solution_text: 'The vector $\\overrightarrow{AB}=(5-2,9-3)=(3,6)$. Since $\\overrightarrow{AC}=2\\overrightarrow{AB}$, $C=(2,3)+2(3,6)=(8,15)$.', diagramRequired: true, uncertainties: []
  },
  '31774': {
    question_text: 'Calculate $\\dfrac12\\div 6$.',
    structure: 'divide-unit-fraction-by-integer', meaningfulCase: 'divide-by-multiplying-by-reciprocal', mastery: false,
    options: [
      { text: '$\\dfrac{1}{12}$', correct: true },
      { text: '$3$', correct: false, why: 'Multiplies the denominator by the divisor but drops the numerator fraction.' },
      { text: '$\\dfrac13$', correct: false, why: 'Divides the denominator by 2 instead of multiplying by 6.' },
      { text: '$\\dfrac62$', correct: false, why: 'Inverts the division relationship and obtains a value greater than one.' }
    ],
    solution_text: 'Dividing by $6$ is multiplying by $\\dfrac16$: $\\dfrac12\\div6=\\dfrac12\\times\\dfrac16=\\dfrac1{12}$.', diagramRequired: false, uncertainties: []
  },
  '4441': {
    question_text: 'In this diagram of diffusion, what will happen next?\n\n[tikz]\n\\begin{tikzpicture}[scale=0.6]\\draw[thick] (0,0) rectangle (8,4);\\draw[gray!45] (4,1.3)--(4,2.7);\\foreach \\p in {(1,3),(2.7,3),(1,1.2),(2.7,1.8)} \\fill[blue!65] \\p circle (0.28);\\fill[blue!65] (6,3) circle (0.28);\\end{tikzpicture}\n[/tikz]',
    structure: 'predict-diffusion-down-concentration-gradient', meaningfulCase: 'particles-move-from-high-to-low-concentration', mastery: false,
    options: [
      { text: 'There will be no diffusion', correct: false, why: 'A concentration difference remains across the partition.' },
      { text: 'The particles will diffuse from right to left', correct: false, why: 'The right side has fewer particles, so it is not the high-concentration side.' },
      { text: 'The particles will diffuse from left to right', correct: true },
      { text: 'The particles will evaporate', correct: false, why: 'Diffusion is particle spreading, not a change of state to vapour.' }
    ],
    solution_text: 'There are more particles on the left than on the right, so the concentration is higher on the left. Particles diffuse from high concentration to low concentration, from left to right.', diagramRequired: true, uncertainties: []
  },
  '75422': {
    question_text: 'A die is thrown $36$ times and lands on an even number $12$ times. Using a $5\\%$ significance level, determine whether the die is biased or not.',
    structure: 'test-binomial-proportion-for-die-bias', meaningfulCase: 'two-sided-test-of-even-outcome-probability', mastery: false,
    options: [
      { text: 'Do not reject $H_0$: the evidence is insufficient to conclude that the die is biased.', correct: true },
      { text: 'Reject $H_0$ because $P(X\\le12)=0.0326<0.05$.', correct: false, why: 'Uses a one-tailed probability for a question asking about bias in either direction.' },
      { text: 'Reject $H_0$ because $P(X\\ge12)=0.9856>0.05$.', correct: false, why: 'A large upper-tail probability is not evidence against the fair-die hypothesis.' },
      { text: 'Do not reject $H_0$ because $P(X\\le36)=1$.', correct: false, why: 'Uses a probability that is certain and unrelated to the observed low count.' }
    ],
    solution_text: 'Let $X\\sim B(36,0.5)$ under $H_0$. Since bias can mean either too few or too many even results, use a two-sided test. The lower-tail probability at $12$ is about $0.0326$, giving a two-sided value of about $0.0652$, which exceeds $0.05$. Therefore do not reject $H_0$; there is insufficient evidence of bias.', diagramRequired: false, uncertainties: ['The source image shows handwritten working rather than the original answer choices, and that working appears to use a one-tailed test; the conclusion here follows the stated two-sided question about bias.']
  },
  '84742': {
    question_text: 'Solve the equation $z^5=16-16i\\sqrt{3}$, giving your answers in the form $re^{i\\theta}$ where $\\theta$ is in terms of $\\pi$ and $0\\le\\theta<2\\pi$. Which is the correct first step?',
    structure: 'convert-complex-equation-rhs-to-polar-form', meaningfulCase: 'argument-in-fourth-quadrant-written-positive', mastery: false,
    options: [
      { text: '$r=2,\\;\\arg(z^5)=\\dfrac{\\pi}{3}$', correct: false, why: 'Uses the first-quadrant angle instead of the fourth-quadrant argument.' },
      { text: '$r=2,\\;\\arg(z^5)=\\dfrac{5\\pi}{3}$', correct: true },
      { text: 'Both are correct', correct: false, why: 'The two proposed arguments represent different directions for this complex number.' },
      { text: 'Neither is correct', correct: false, why: 'The modulus is 32 for the right side, giving fifth-root modulus 2.' }
    ],
    solution_text: 'The modulus of $16-16i\\sqrt3$ is $\\sqrt{16^2+(16\\sqrt3)^2}=32$, so the modulus of $z$ is $\\sqrt[5]{32}=2$. The point is in the fourth quadrant, with argument $-\\pi/3$, equivalently $5\\pi/3$. Thus the correct first step is option B.', diagramRequired: false, uncertainties: []
  },
  '103407': {
    question_text: 'The probability distribution is believed to be modelled by $P(X=r)=kr^3$ for $r=1,2,3,4$, and $P(X=r)=0$ otherwise. What is the probability distribution?',
    structure: 'normalise-discrete-probability-distribution', meaningfulCase: 'sum-probabilities-to-one', mastery: false,
    options: [
      { text: '$k=\\dfrac{1}{100}$', correct: false, why: 'This is a correct normalising constant, but it is only one representation of the full distribution.' },
      { text: '$P(X=1,2,3,4)=(0.01,0.08,0.27,0.64)$', correct: false, why: 'These values are the correct distribution but are not the only valid representation shown.' },
      { text: '$P(X=r)=(k,8k,27k,64k)$ for $r=1,2,3,4$', correct: false, why: 'This is also an equivalent form, so the displayed choices are not mutually exclusive.' },
      { text: 'None of the above', correct: false, why: 'At least the normalising constant and the listed probabilities can be obtained.' },
      { text: 'A, B and C are equivalent descriptions', correct: true }
    ],
    solution_text: 'The probabilities must sum to $1$: $k(1^3+2^3+3^3+4^3)=k(100)=1$, so $k=0.01$. Therefore the probabilities are $0.01,0.08,0.27,0.64$. The source choices A, B and C are equivalent descriptions.', diagramRequired: false, uncertainties: ['The source offers A, B and C, which are all mathematically equivalent rather than giving one unique correct choice; an explicit combined option was added.']
  },
  '105507': {
    question_text: 'Figure 2 shows a flag $XYWZX$. The flag consists of a triangle $XYZ$ joined to a sector $ZYW$ of a circle with radius $5\\text{ cm}$ and centre $Y$. The angle of the sector, angle $ZYW$, is $0.7$ radians. The points $X$, $Y$ and $W$ lie on a straight line with $XY=7\\text{ cm}$ and $YW=5\\text{ cm}$. Find the area of the flag, in $\\text{cm}^2$, to 2 decimal places.\n\n[tikz]\n\\begin{tikzpicture}[scale=0.55]\\coordinate (X) at (0,0);\\coordinate (Y) at (3.2,0);\\coordinate (W) at (5.5,0);\\coordinate (Z) at (4.8,2.7);\\draw[thick] (X)--(Y)--(W);\\draw[thick] (X)--(Z)--(Y);\\draw[thick] (Z) arc[start angle=110,end angle=0,radius=2.7];\\node[below] at (1.6,0) {$7\\text{ cm}$};\\node[below] at (4.35,0) {$5\\text{ cm}$};\\node at (3.8,0.55) {$0.7\\text{ rad}$};\\node[left] at (X) {$X$};\\node[below] at (Y) {$Y$};\\node[right] at (W) {$W$};\\node[above] at (Z) {$Z$};\\end{tikzpicture}\n[/tikz]',
    structure: 'find-composite-area-triangle-and-sector', meaningfulCase: 'radian-sector-area-plus-triangle-area', mastery: false,
    options: [
      { text: '$28.77$', correct: false, why: 'Uses an incorrect sector or triangle area calculation.' },
      { text: '$11.27$', correct: false, why: 'Calculates only the triangle area and omits the circular sector.' },
      { text: '$26.25$', correct: false, why: 'Does not use the given angle correctly in the sector area.' },
      { text: '$20.02$', correct: true }
    ],
    solution_text: 'The triangle area is $\\frac12(7)(5)\\sin(0.7)=11.274\\ldots$. The sector area is $\\frac12(5^2)(0.7)=8.75$. Total area $=11.274\\ldots+8.75=20.02\\text{ cm}^2$ to 2 decimal places.', diagramRequired: true, uncertainties: []
  },
  '11156': {
    question_text: 'What is the domain of the following function?\n\n$f(x)=\\dfrac{3x+1}{4-2x}$',
    structure: 'identify-domain-of-rational-function', meaningfulCase: 'exclude-zero-denominator-value', mastery: false,
    options: [
      { text: '$x\\in\\mathbb{R}$', correct: false, why: 'Includes the value that makes the denominator equal to zero.' },
      { text: '$x\\in\\mathbb{R},\\ x\\ne-2$', correct: false, why: 'Solves the denominator equation with the wrong sign.' },
      { text: '$x\\in\\mathbb{R},\\ x\\ne2$', correct: true },
      { text: '$x\\in\\mathbb{R},\\ x\\ne-\\dfrac32$', correct: false, why: 'Uses a value derived from the numerator rather than the denominator.' }
    ],
    solution_text: 'The denominator cannot be zero. Solving $4-2x=0$ gives $x=2$, so the domain is all real numbers except $2$.', diagramRequired: false, uncertainties: []
  },
  '120612': {
    question_text: 'Why do models of exponential growth tend to break down in the long term?',
    structure: 'explain-limit-of-exponential-growth-model', meaningfulCase: 'real-world-resource-or-space-constraint', mastery: false,
    options: [
      { text: 'Because models are not exact', correct: false, why: 'This is generally true but does not explain the specific long-term limitation.' },
      { text: 'Because the measurements might be inaccurate', correct: false, why: 'Measurement error is not the main reason unlimited growth is unrealistic.' },
      { text: 'Because the numbers get bigger so there is more room for error', correct: false, why: 'Increasing size alone does not explain why the growth mechanism changes.' },
      { text: 'Because there is usually some factor, such as space, that means the quantity cannot grow indefinitely', correct: true }
    ],
    solution_text: 'Exponential growth assumes a constant proportional growth rate. In real systems, limited resources, space or competition eventually reduce that rate, so the quantity cannot grow indefinitely.', diagramRequired: false, uncertainties: []
  },
  '121205': {
    question_text: '$\\dfrac{2x-1}{(x+1)(x-1)(x+2)^2}$ can be written in the form...',
    structure: 'choose-partial-fraction-decomposition-form', meaningfulCase: 'repeated-linear-factor-needs-two-terms', mastery: false,
    options: [
      { text: '$\\dfrac{A}{x+1}+\\dfrac{B}{x-1}+\\dfrac{C}{(x+2)^2}$', correct: false, why: 'Omits the separate numerator term needed for the repeated linear factor.' },
      { text: '$\\dfrac{A}{x+1}+\\dfrac{B}{x-1}+\\dfrac{C}{x+2}$', correct: false, why: 'Includes only one term for the squared factor and cannot represent the full form.' },
      { text: '$\\dfrac{A}{x+1}+\\dfrac{B}{x-1}+\\dfrac{C}{x+2}+\\dfrac{D}{(x+2)^2}$', correct: true },
      { text: '$A+\\dfrac{B}{x+1}+\\dfrac{C}{x-1}+\\dfrac{D}{(x+2)^2}$', correct: false, why: 'Adds a constant term and still omits the required first-power repeated-factor term.' }
    ],
    solution_text: 'A repeated factor $(x+2)^2$ requires one partial fraction for $(x+2)$ and another for $(x+2)^2$. Therefore the correct form is $\\dfrac{A}{x+1}+\\dfrac{B}{x-1}+\\dfrac{C}{x+2}+\\dfrac{D}{(x+2)^2}$.', diagramRequired: false, uncertainties: []
  },
  '136046': {
    question_text: '$p=\\begin{pmatrix}-4\\\\8\\end{pmatrix}$. Find $3p$.',
    structure: 'scalar-multiply-column-vector', meaningfulCase: 'negative-and-positive-components', mastery: false,
    options: [
      { text: '$\\begin{pmatrix}-1\\\\11\\end{pmatrix}$', correct: false, why: 'Adds or adjusts the components instead of multiplying each by 3.' },
      { text: '$\\begin{pmatrix}-12\\\\8\\end{pmatrix}$', correct: false, why: 'Multiplies only the first component and leaves the second unchanged.' },
      { text: '$\\begin{pmatrix}-12\\\\24\\end{pmatrix}$', correct: true },
      { text: '$\\begin{pmatrix}12\\\\24\\end{pmatrix}$', correct: false, why: 'Changes the sign of the negative component while multiplying.' }
    ],
    solution_text: 'Multiply both components by $3$: $3p=\\begin{pmatrix}3(-4)\\\\3(8)\\end{pmatrix}=\\begin{pmatrix}-12\\\\24\\end{pmatrix}$.', diagramRequired: false, uncertainties: []
  },
  '149741': {
    question_text: 'Which of the following statements correctly describes the gravitational interaction between the Earth and the Moon?',
    structure: 'apply-newtons-third-law-to-gravity', meaningfulCase: 'equal-force-different-acceleration', mastery: false,
    options: [
      { text: 'The Earth accelerates towards the Moon.', correct: true },
      { text: 'The net force acting on the Earth is zero.', correct: false, why: 'The Moon exerts a non-zero gravitational force on the Earth.' },
      { text: 'The Moon and Earth experience equal and opposite accelerations.', correct: false, why: 'They experience equal forces, but their different masses give different accelerations.' },
      { text: 'The force acting on the Moon is smaller than the force acting on the Earth.', correct: false, why: 'Newton’s third law gives equal and opposite gravitational forces.' }
    ],
    solution_text: 'The Earth is attracted toward the Moon, so it has an acceleration toward the Moon. The forces on the two bodies are equal and opposite, but their accelerations are not equal because their masses differ.', diagramRequired: false, uncertainties: []
  },
  '155078': {
    question_text: 'A curve is defined parametrically with $x=4t$, $y=6t^2-t$. Which of the following finds the gradient of the tangent to the curve at $x=4$?',
    structure: 'differentiate-parametric-equations', meaningfulCase: 'evaluate-parameter-from-x-coordinate', mastery: false,
    options: [
      { text: '$\\dfrac{12-1}{4}$', correct: true },
      { text: '$\\dfrac{4}{12-1}$', correct: false, why: 'Uses the reciprocal of $dy/dx$ rather than the tangent gradient.' },
      { text: '$\\dfrac{48-1}{4}$', correct: false, why: 'Substitutes $x=4$ directly into a derivative expression instead of finding $t$.' },
      { text: '$\\dfrac{4}{48-1}$', correct: false, why: 'Uses both the wrong substitution and the reciprocal gradient.' }
    ],
    solution_text: 'Since $x=4t$ and $x=4$, $t=1$. Then $\\dfrac{dx}{dt}=4$ and $\\dfrac{dy}{dt}=12t-1=11$. Hence $\\dfrac{dy}{dx}=\\dfrac{dy/dt}{dx/dt}=\\dfrac{12-1}{4}$.', diagramRequired: false, uncertainties: []
  },
  '2051': {
    question_text: 'What is the probability of winning two games in a row?\n\n[tikz]\n\\begin{tikzpicture}[scale=0.55]\\node (s) at (0,0) {};\\node (w1) at (2,1) {win};\\node (l1) at (2,-1) {not win};\\node (w2) at (4,2) {win};\\node (l2) at (4,0) {not win};\\draw (s)--(w1) node[midway,above] {$0.4$};\\draw (s)--(l1) node[midway,below] {$0.6$};\\draw (w1)--(w2) node[midway,above] {$0.4$};\\draw (w1)--(l2) node[midway,below] {$0.6$};\\end{tikzpicture}\n[/tikz]',
    structure: 'multiply-independent-branch-probabilities', meaningfulCase: 'two-consecutive-wins', mastery: false,
    options: [
      { text: '$1.6$', correct: false, why: 'Adds or multiplies probabilities in a way that produces a value above one.' },
      { text: '$0.8$', correct: false, why: 'Adds the two win probabilities instead of multiplying consecutive outcomes.' },
      { text: '$0.25$', correct: false, why: 'Uses an incorrect win probability rather than the displayed value 0.4.' },
      { text: '$0.16$', correct: true }
    ],
    solution_text: 'The probability of two wins in succession is $0.4\\times0.4=0.16$.', diagramRequired: true, uncertainties: []
  },
  '20837': {
    question_text: 'The temperature $T$ is measured for 12 days against the number of ice creams sold $C$. The data are $T=(15,16,18,20,24,27,23,19,18,20,17,16)$ and $C=(22,25,32,33,28,43,38,30,21,37,23,18)$. Find the correlation equation of the regression line $C$ on $T$.',
    structure: 'select-regression-line-dependent-on-temperature', meaningfulCase: 'predict-sales-from-temperature', mastery: false,
    options: [
      { text: '$y=1.68x-3.55$', correct: true },
      { text: '$y=1.68-3.55x$', correct: false, why: 'Uses the slope and intercept in the wrong arrangement and gives a negative slope.' },
      { text: '$y=0.793x-24.2$', correct: false, why: 'Uses coefficients inconsistent with the regression of sales on temperature.' },
      { text: '$y=0.374x+8.52$', correct: false, why: 'Does not match the fitted positive relationship for these paired data.' }
    ],
    solution_text: 'For the regression of $C$ on $T$, temperature is the explanatory variable and sales are the response. The fitted line from the data is approximately $C=1.68T-3.55$, so the first equation is correct.', diagramRequired: false, uncertainties: []
  },
  '21372': {
    question_text: 'The diagram represents $X\\sim N(32,\\sigma)$. The shaded region is $P(32<X<40)=0.25$. Find the value of $\\sigma$.',
    structure: 'find-normal-standard-deviation-from-central-area', meaningfulCase: 'standardise-area-between-mean-and-upper-value', mastery: false,
    options: [
      { text: '$\\sigma=141$', correct: false, why: 'Uses an incorrect normal quantile or reverses the scale calculation.' },
      { text: '$\\sigma=11.9$', correct: true },
      { text: '$\\sigma=32$', correct: false, why: 'Confuses the mean with the standard deviation.' },
      { text: '$\\sigma=10.9$', correct: false, why: 'Uses an inaccurate standard-normal quantile for the given area.' }
    ],
    solution_text: 'The area from the mean to the upper value is $0.25$, so $z=0.6745$. Thus $\\dfrac{40-32}{\\sigma}=0.6745$, giving $\\sigma=\\dfrac8{0.6745}=11.86\\ldots\\approx11.9$.', diagramRequired: true, uncertainties: []
  },
  '2325': {
    question_text: 'Find $\\dfrac{dy}{dx}$ when $y=\\dfrac{\\sqrt{x+4}}{x^2}$.',
    structure: 'differentiate-product-or-quotient-with-root', meaningfulCase: 'combine-derivative-terms-over-common-denominator', mastery: false,
    options: [
      { text: '$\\dfrac{x^2-x-4}{2x^4\\sqrt{x+4}}$', correct: false, why: 'Differentiates the square-root and power terms incorrectly.' },
      { text: '$\\dfrac{-3x^2-16x}{2x^4\\sqrt{x+4}}$', correct: true },
      { text: '$\\dfrac{1-4x^2-16x}{2x^4\\sqrt{x+4}}$', correct: false, why: 'Introduces an extra constant term when combining the numerator.' },
      { text: '$\\dfrac{-3x^2-16x}{2x^2\\sqrt{x+4}}$', correct: false, why: 'Has the correct numerator but an incorrect power of x in the denominator.' }
    ],
    solution_text: 'Write $y=(x+4)^{1/2}x^{-2}$. Differentiating gives $\\dfrac{dy}{dx}=\\frac12(x+4)^{-1/2}x^{-2}-2(x+4)^{1/2}x^{-3}=\\dfrac{-3x-16}{2x^3\\sqrt{x+4}}=\\dfrac{-3x^2-16x}{2x^4\\sqrt{x+4}}$.', diagramRequired: false, uncertainties: []
  },
  '28254': {
    question_text: 'The points $A(2,3)$ and $B(5,9)$ lie on the line $y=2x-1$. Given that $AC=4AB$, what are the coordinates of $C$?',
    structure: 'extend-collinear-segment-by-vector-multiple', meaningfulCase: 'four-times-displacement-from-a', mastery: false,
    options: [
      { text: '$(14,27)$', correct: true },
      { text: '$(28,48)$', correct: false, why: 'Multiplies the coordinates of B rather than the vector from A to B.' },
      { text: '$(17,35)$', correct: false, why: 'Adds the displacement five times instead of four times.' },
      { text: '$(12,24)$', correct: false, why: 'Uses an incorrect multiple of the coordinate displacement.' }
    ],
    solution_text: 'The displacement from $A$ to $B$ is $(3,6)$. Since $\\overrightarrow{AC}=4\\overrightarrow{AB}$, $C=(2,3)+4(3,6)=(14,27)$.', diagramRequired: false, uncertainties: []
  },
  '2871': {
    question_text: 'Given $X\\sim B(20,0.3)$, find $P(X\\ge4)$.',
    structure: 'use-binomial-complement-for-at-least-probability', meaningfulCase: 'complement-of-lower-tail', mastery: false,
    options: [
      { text: '$0.2375$', correct: false, why: 'Gives a lower-tail probability rather than the probability of at least four.' },
      { text: '$0.7625$', correct: false, why: 'Uses an incorrect complement value for the binomial lower tail.' },
      { text: '$0.8929$', correct: true },
      { text: '$0.1071$', correct: false, why: 'This is approximately $P(X\\le3)$, the complement of the requested event.' }
    ],
    solution_text: 'Use the complement: $P(X\\ge4)=1-P(X\\le3)$. For $X\\sim B(20,0.3)$, $P(X\\le3)=0.1071$, so $P(X\\ge4)=1-0.1071=0.8929$.', diagramRequired: false, uncertainties: []
  },
  '3185': {
    question_text: 'The points $A(1,4,2)$, $B(3,2,z)$ and $C(7,y,-1)$ are collinear. What are the values of $y$ and $z$?',
    structure: 'use-collinearity-vector-ratio-in-three-dimensions', meaningfulCase: 'constant-coordinate-displacement-ratio', mastery: false,
    options: [
      { text: '$y=2, z=-3$', correct: false, why: 'Uses the wrong direction for both coordinate changes.' },
      { text: '$y=2, z=1$', correct: false, why: 'Gets the third coordinate but not the required second coordinate.' },
      { text: '$y=-2, z=-3$', correct: false, why: 'Gets the second coordinate but uses the wrong third-coordinate change.' },
      { text: '$y=-2, z=1$', correct: true }
    ],
    solution_text: 'From $A$ to $C$, the change in the first coordinate is $6$, three times the change from $A$ to $B$, which is $2$. Therefore $y-4=3(2-4)=-6$, so $y=-2$. Also $-1-2=3(z-2)$, giving $z=1$.', diagramRequired: false, uncertainties: []
  },
  '73878': {
    question_text: 'The points $(12,7)$ and $(5,2)$ are shown. Which is the correct method to work out the distance between the points?',
    structure: 'choose-coordinate-distance-formula', meaningfulCase: 'sum-squared-horizontal-and-vertical-differences', mastery: false,
    options: [
      { text: '$\\sqrt{(12-5)^2+(7-2)^2}$', correct: true },
      { text: '$(12-5)^2-(7-2)^2$', correct: false, why: 'Subtracts squared coordinate differences and omits the square root.' },
      { text: '$\\sqrt{(12-5)^2-(7-2)^2}$', correct: false, why: 'Uses subtraction inside the distance formula instead of addition.' },
      { text: '$(12-5)^2+(7-2)^2$', correct: false, why: 'Finds the squared distance but does not take the square root.' }
    ],
    solution_text: 'The horizontal and vertical differences are $12-5$ and $7-2$. Pythagoras gives the distance as $\\sqrt{(12-5)^2+(7-2)^2}=\\sqrt{74}$.', diagramRequired: true, uncertainties: []
  },
  '84754': {
    question_text: 'Use de Moivre\'s theorem to show that $\\cos^5\\theta=p\\cos5\\theta+q\\cos3\\theta+r\\cos\\theta$, where $p$, $q$ and $r$ are rational numbers to be found. Which of the following is the best approach to this problem?',
    structure: 'choose-de-moivre-expansion-for-cosine-identity', meaningfulCase: 'expand-z-plus-reciprocal-power', mastery: false,
    options: [
      { text: 'Expand $(\\cos x+i\\sin x)^5$', correct: false, why: 'Does not directly produce the reciprocal-power terms needed for cosine powers.' },
      { text: 'Expand $(z+\\dfrac1z)^5$', correct: true },
      { text: 'Expand $(z-\\dfrac1z)^5$', correct: false, why: 'The difference generates sine-related terms rather than the required cosine expression.' },
      { text: 'None of the above', correct: false, why: 'The sum of a complex number and its reciprocal is the required cosine route.' }
    ],
    solution_text: 'With $z=e^{i\\theta}$, $z+z^{-1}=2\\cos\\theta$. Therefore expand $(z+1/z)^5$ and collect the symmetric powers, which correspond to $\\cos5\\theta$, $\\cos3\\theta$ and $\\cos\\theta$.', diagramRequired: false, uncertainties: []
  },
  '99816': {
    question_text: 'An object is thrown from the ground with speed $30\\text{ m s}^{-1}$ at an angle of elevation $30^\\circ$. What is the highest height reached by the particle?',
    structure: 'find-projectile-maximum-height', meaningfulCase: 'use-vertical-component-and-gravity', mastery: false,
    options: [
      { text: '$1.53\\text{ m}$', correct: false, why: 'Uses an incorrect trigonometric component or time calculation.' },
      { text: '$45.9\\text{ m}$', correct: false, why: 'Treats the launch speed as though it were the vertical height.' },
      { text: '$11.4\\text{ m}$', correct: true },
      { text: '$45.5\\text{ m}$', correct: false, why: 'Does not correctly use the vertical component in the maximum-height equation.' }
    ],
    solution_text: 'The initial vertical speed is $30\\sin30^\\circ=15\\text{ m s}^{-1}$. At the top, $v^2=u^2-2gh$ gives $h=15^2/(2\\times9.8)=11.48\\ldots\\text{ m}$, so the answer is $11.4\\text{ m}$ to the displayed precision.', diagramRequired: false, uncertainties: []
  },
  '102921': {
    question_text: 'Given that $x=\\sin t-\\cos t$ and $y=\\dfrac12\\sin(2t)$, then $\\dfrac{dy}{dx}$ in terms of $t$ is',
    structure: 'differentiate-parametric-trigonometric-equations', meaningfulCase: 'simplify-cosine-double-angle-quotient', mastery: false,
    options: [
      { text: '$\\cos t-\\sin t$', correct: true },
      { text: '$\\cos t+\\sin t$', correct: false, why: 'Uses $dx/dt$ without simplifying the quotient with $dy/dt$.' },
      { text: '$\\sec t+\\cosec t$', correct: false, why: 'Replaces the derivative quotient with unrelated reciprocal trigonometric terms.' },
      { text: '$\\sec t-\\cosec t$', correct: false, why: 'Uses reciprocals instead of the required product-to-sum simplification.' }
    ],
    solution_text: 'Differentiate with respect to $t$: $dx/dt=\\cos t+\\sin t$ and $dy/dt=\\cos(2t)$. Hence $dy/dx=\\cos(2t)/(\\cos t+\\sin t)=(\\cos t-\\sin t)(\\cos t+\\sin t)/(\\cos t+\\sin t)=\\cos t-\\sin t$.', diagramRequired: false, uncertainties: []
  },
  '103533': {
    question_text: 'What is the correct Activity Network for the dependency table?\n\nA has no dependency; B and C depend on A; D, E and F depend on B; G depends on C and D; H depends on E; I depends on F, G and H.',
    structure: 'construct-activity-network-from-dependencies', meaningfulCase: 'multiple-predecessors-and-merge-activity', mastery: false,
    options: [
      { text: 'A', correct: true },
      { text: 'B', correct: false, why: 'Places one or more activities after the wrong predecessor.' },
      { text: 'C', correct: false, why: 'Does not represent all of the listed predecessor relationships correctly.' },
      { text: 'D', correct: false, why: 'Uses a linear chain and omits the required parallel branches and joins.' }
    ],
    solution_text: 'Start with A, branch to B and C, then branch from B to D, E and F. Join C and D before G; H follows E; finally I must follow F, G and H. Network A matches these dependencies.', diagramRequired: true, uncertainties: []
  },
  '149070': {
    question_text: 'An object is projected upwards from the ground and follows the path shown. Which statement describes the projectile\'s horizontal and vertical acceleration at point $Y$?',
    structure: 'identify-projectile-acceleration-components-at-apex', meaningfulCase: 'gravity-only-vertical-acceleration', mastery: false,
    options: [
      { text: 'Both the horizontal and vertical accelerations are zero.', correct: false, why: 'Gravity continues to act at the highest point.' },
      { text: 'Both the horizontal and vertical accelerations are $9.8\\text{ m s}^{-2}$.', correct: false, why: 'There is no horizontal acceleration in ideal projectile motion.' },
      { text: 'The horizontal acceleration is $9.8\\text{ m s}^{-2}$ and the vertical acceleration is zero.', correct: false, why: 'Reverses the roles of the horizontal and vertical acceleration components.' },
      { text: 'The horizontal acceleration is zero and the vertical acceleration is $9.8\\text{ m s}^{-2}$.', correct: true }
    ],
    solution_text: 'Ignoring air resistance, the only acceleration is gravity. It acts vertically downward with magnitude $9.8\\text{ m s}^{-2}$, while horizontal acceleration is zero, including at the apex.', diagramRequired: true, uncertainties: []
  },
  '151046': {
    question_text: 'A positively charged mass falls between parallel plates. The plates are connected to a power supply while the switch is closed, then the switch is opened when the mass has fallen halfway. Which trajectory is correct?',
    structure: 'predict-charged-particle-trajectory-after-field-removal', meaningfulCase: 'electric-horizontal-acceleration-then-gravity-only', mastery: false,
    options: [
      { text: 'A', correct: false, why: 'Shows the wrong change in curvature after the electric field is removed.' },
      { text: 'B', correct: false, why: 'Keeps a straight trajectory and ignores the gravitational acceleration.' },
      { text: 'C', correct: false, why: 'Shows an inconsistent change in the direction of the horizontal deflection.' },
      { text: 'D', correct: true }
    ],
    solution_text: 'While the switch is closed, the positive charge accelerates toward the negative plate as it falls, so the path curves sideways. Once the switch opens, the electric force disappears; the particle retains its horizontal velocity and continues accelerating vertically under gravity. This gives the trajectory shown in D.', diagramRequired: true, uncertainties: ['The low-resolution source makes the exact curvature change between options difficult to distinguish, although D best matches horizontal field acceleration followed by gravity-only motion.']
  },
  '20852': {
    question_text: 'The temperature $T$ is measured for 12 days against the number of ice creams sold $C$. The data are $T=(15,16,18,20,24,27,23,19,18,20,17,16)$ and $C=(22,25,32,33,28,43,38,30,21,37,23,18)$. Describe the correlation of the data shown.',
    structure: 'classify-strength-and-direction-of-correlation', meaningfulCase: 'positive-temperature-sales-association', mastery: false,
    options: [
      { text: 'Strong positive correlation', correct: true },
      { text: 'Moderate positive correlation', correct: false, why: 'Understates the clear positive association in the paired data.' },
      { text: 'Strong negative correlation', correct: false, why: 'The data generally increase together rather than moving in opposite directions.' },
      { text: 'Moderate negative correlation', correct: false, why: 'Uses the wrong direction for the relationship between temperature and sales.' }
    ],
    solution_text: 'Higher temperatures generally correspond to more ice creams sold, giving a positive association. The relationship is sufficiently consistent to be described as strong positive correlation.', diagramRequired: false, uncertainties: []
  },
  '11220': {
    question_text: 'Which of the following scatter diagrams would have a correlation coefficient $r$ closest to zero?',
    structure: 'recognise-zero-linear-correlation-in-nonlinear-pattern', meaningfulCase: 'symmetric-curved-pattern-with-no-linear-trend', mastery: false,
    options: [
      { text: 'A', correct: false, why: 'Shows a clear positive linear association, so r is positive.' },
      { text: 'B', correct: true },
      { text: 'C', correct: false, why: 'Shows a strong positive trend, giving a large positive correlation.' },
      { text: 'D', correct: false, why: 'Shows a clear negative linear association, so r is negative.' }
    ],
    solution_text: 'Diagram B has a curved inverted-U pattern. Although there is a strong nonlinear relationship, the upward and downward portions cancel in a linear correlation calculation, so $r$ is closest to zero.', diagramRequired: true, uncertainties: []
  },
  '125785': {
    question_text: 'You are finding the MST for this network using Prim, starting at $X$. What is the minimum connector?',
    structure: 'complete-minimum-spanning-tree-by-prim', meaningfulCase: 'choose-lowest-edge-from-growing-tree', mastery: false,
    options: [
      { text: '$XU, UW, WY, WV$', correct: false, why: 'This is one ordering of the correct edge set, so the source choices are not distinct.' },
      { text: '$UW, WY, XU, WV$', correct: false, why: 'This contains exactly the same four edges as the other listed edge-set options.' },
      { text: '$XU, WY, UW, WV$', correct: false, why: 'This also contains exactly the same four edges, merely in another order.' },
      { text: '$68$', correct: false, why: 'This is the total weight, not the edge list requested for the connector.' },
      { text: 'A, B and C are equivalent: $XU, UW, WY, WV$', correct: true }
    ],
    solution_text: 'Starting at $X$, choose $XU=16$, then the smallest edge from the tree is $UW=14$, followed by $WY=17$, then $WV=21$. These four edges connect all five vertices, with total weight $16+14+17+21=68$.', diagramRequired: true, uncertainties: ['The source lists the same four MST edges in three different orders as options A, B and C; an explicit combined option was added.']
  },
  '11226': {
    question_text: 'For the data shown, the regression line is $y=2.9+0.46x$. Use the regression line to predict a student\'s Test 2 score given that they scored $32$ in Test 1.',
    structure: 'evaluate-regression-line-for-prediction', meaningfulCase: 'substitute-explanatory-variable-value', mastery: false,
    options: [
      { text: '$42.69$', correct: false, why: 'Substitutes the wrong score or evaluates the linear expression incorrectly.' },
      { text: '$63.26$', correct: false, why: 'Multiplies or adds the coefficients incorrectly for x equal to 32.' },
      { text: '$15.88$', correct: false, why: 'Uses an incorrect sign or leaves out the intercept contribution.' },
      { text: '$17.62$', correct: true }
    ],
    solution_text: 'Substitute $x=32$: $y=2.9+0.46(32)=2.9+14.72=17.62$.', diagramRequired: false, uncertainties: []
  },
  '122072': {
    question_text: 'At a point on a parametric curve where the tangent is vertical, which of these is always true?',
    structure: 'identify-condition-for-vertical-parametric-tangent', meaningfulCase: 'zero-horizontal-parameter-rate', mastery: false,
    options: [
      { text: '$\\dfrac{dy}{dt}=0$', correct: false, why: 'A zero vertical rate would instead suggest a horizontal tangent in the usual case.' },
      { text: '$\\dfrac{dy}{dt}=0$ and $\\dfrac{dx}{dt}=0$', correct: false, why: 'Both rates zero do not define a usable vertical tangent gradient.' },
      { text: '$\\dfrac{dx}{dt}=0$', correct: true },
      { text: 'Neither $\\dfrac{dy}{dt}=0$ nor $\\dfrac{dx}{dt}=0$', correct: false, why: 'A vertical tangent requires the horizontal rate to vanish.' }
    ],
    solution_text: 'For a parametric curve, $dy/dx=(dy/dt)/(dx/dt)$. A vertical tangent occurs when $dx/dt=0$ while $dy/dt$ is non-zero.', diagramRequired: false, uncertainties: []
  },
  '125783': {
    question_text: 'You are finding the MST for this network using Prim, starting at $X$. The selected edges are $XU(16)$, $UW(14)$ and $WY(17)$. Which value do you select next?',
    structure: 'select-next-edge-in-prims-algorithm', meaningfulCase: 'minimum-edge-from-current-tree-to-unvisited-vertex', mastery: false,
    options: [
      { text: '$UV(27)$', correct: false, why: 'It is not the smallest available edge from the current tree.' },
      { text: '$XV(20)$', correct: false, why: 'The matrix shows the X-V edge as 23, not 20, and it is not minimum.' },
      { text: '$VW(21)$', correct: true },
      { text: '$VY(25)$', correct: false, why: 'It is larger than the available W-V edge of weight 21.' }
    ],
    solution_text: 'The current tree contains $X,U,W,Y$. The remaining vertex is $V$, with available connecting weights $UV=27$, $XV=23$, $WV=21$ and $YV=25$. The smallest is $VW(21)$.', diagramRequired: true, uncertainties: []
  },
  '152193': {
    question_text: 'A uniform rod, supported at its midpoint, is held in equilibrium by two forces $P$ and $Q$, where $PM=3\\text{ m}$ and $MQ=1.5\\text{ m}$. What is the relationship between the magnitudes of $P$ and $Q$?',
    structure: 'use-principle-of-moments-for-equilibrium', meaningfulCase: 'opposite-moments-about-midpoint', mastery: false,
    options: [
      { text: '$P=2Q$', correct: false, why: 'Reverses the ratio obtained by equating the two moments.' },
      { text: '$Q=2P$', correct: true },
      { text: '$P=Q$', correct: false, why: 'Equal forces would not balance moments at unequal distances.' },
      { text: 'Not enough information', correct: false, why: 'The two distances provide enough information to compare the force magnitudes.' }
    ],
    solution_text: 'Taking moments about $M$, equilibrium gives $3P=1.5Q$. Hence $Q=2P$.', diagramRequired: true, uncertainties: []
  },
  '32833': {
    question_text: 'Calculate $\\dfrac23\\times5$.',
    structure: 'multiply-fraction-by-integer', meaningfulCase: 'convert-improper-fraction-to-mixed-number', mastery: false,
    options: [
      { text: '$\\dfrac{10}{15}$', correct: false, why: 'Multiplies the denominator by 5 as well as the numerator.' },
      { text: '$\\dfrac{2}{15}$', correct: false, why: 'Multiplies the denominator instead of multiplying the numerator.' },
      { text: '$5\\dfrac23$', correct: false, why: 'Adds 5 to the fraction rather than multiplying by 5.' },
      { text: '$3\\dfrac13$', correct: true }
    ],
    solution_text: '$\\dfrac23\\times5=\\dfrac{10}{3}=3\\dfrac13$.', diagramRequired: false, uncertainties: []
  },
  '13279': {
    question_text: 'What is the modulus-argument form of $\\sqrt3-i$?',
    structure: 'convert-complex-number-to-modulus-argument-form', meaningfulCase: 'fourth-quadrant-argument', mastery: false,
    options: [
      { text: '$2(\\cos\\dfrac{\\pi}{6}+i\\sin\\dfrac{\\pi}{6})$', correct: false, why: 'Uses the correct modulus but the angle has the wrong sign.' },
      { text: '$\\sqrt2(\\cos\\dfrac{\\pi}{4}+i\\sin\\dfrac{\\pi}{4})$', correct: false, why: 'Uses incorrect modulus and argument for the given complex number.' },
      { text: '$2(\\cos(-\\dfrac{\\pi}{6})+i\\sin(-\\dfrac{\\pi}{6}))$', correct: true },
      { text: '$\\sqrt2(\\cos\\dfrac{\\pi}{6}+i\\sin\\dfrac{\\pi}{6})$', correct: false, why: 'Has the wrong modulus and also places the argument in the wrong direction.' }
    ],
    solution_text: 'The modulus is $\\sqrt{(\\sqrt3)^2+(-1)^2}=2$. Since the point is in the fourth quadrant, its argument is $-\\pi/6$. Therefore the third form is correct.', diagramRequired: false, uncertainties: []
  },
  '141339': {
    question_text: 'Solve $\\dfrac14\\div2$.',
    structure: 'divide-fraction-by-integer', meaningfulCase: 'multiply-by-reciprocal', mastery: false,
    options: [
      { text: '$\\dfrac28$', correct: false, why: 'Multiplies both numerator and denominator instead of dividing by 2.' },
      { text: '$\\dfrac24$', correct: false, why: 'Leaves the numerator unchanged in the wrong equivalent form.' },
      { text: '$\\dfrac18$', correct: true },
      { text: '$\\dfrac{0.5}{2}$', correct: false, why: 'Does not simplify the quotient to the requested exact fraction.' }
    ],
    solution_text: '$\\dfrac14\\div2=\\dfrac14\\times\\dfrac12=\\dfrac18$.', diagramRequired: false, uncertainties: []
  },
  '181117': {
    question_text: 'The sequence of clothes is a dress, hat, trousers, dress, hat, trousers, dress, hat, trousers. “This is a repeating pattern.”',
    structure: 'recognise-repeating-three-item-pattern', meaningfulCase: 'constant-period-sequence', mastery: false,
    options: [
      { text: 'False', correct: false, why: 'Overlooks that the same three-item block repeats throughout.' },
      { text: 'True', correct: true },
      { text: 'Only the first six items repeat', correct: false, why: 'The three-item cycle continues through all nine displayed items.' }
    ],
    solution_text: 'The block dress, hat, trousers appears three times in succession, so the sequence is a repeating pattern.', diagramRequired: true, uncertainties: []
  },
  '101495': {
    question_text: 'An infinite geometric series has terms $u_1=27$ and $u_4=8$. Find the sum to infinity.',
    structure: 'find-sum-of-infinite-geometric-series-from-separated-terms', meaningfulCase: 'positive-common-ratio-less-than-one', mastery: false,
    options: [
      { text: '$81$', correct: true },
      { text: '$150$', correct: false, why: 'Uses an incorrect common ratio in the infinite-sum formula.' },
      { text: '$270$', correct: false, why: 'Multiplies terms rather than finding the convergent geometric sum.' },
      { text: '$\\infty$', correct: false, why: 'The common ratio has magnitude less than one, so the series converges.' }
    ],
    solution_text: 'Since $u_4=u_1r^3$, $8=27r^3$, so $r=2/3$. The sum is $S_\\infty=\\dfrac{27}{1-2/3}=81$.', diagramRequired: false, uncertainties: []
  },
  '122064': {
    question_text: '$\\dfrac{1+11x-6x^2}{(x-3)(1-2x)}\\equiv A+\\dfrac{B}{x-3}+\\dfrac{C}{1-2x}$. Find the values of $A$, $B$ and $C$.',
    structure: 'solve-partial-fraction-constants-by-coefficient-comparison', meaningfulCase: 'constant-plus-two-linear-fractions', mastery: false,
    options: [
      { text: '$A=3, B=4, C=-2$', correct: true },
      { text: '$A=3, B=2, C=-1$', correct: false, why: 'Does not satisfy all three coefficients after clearing denominators.' },
      { text: '$A=1, B=1, C=-2$', correct: false, why: 'Uses incorrect values for the constant and first partial-fraction coefficient.' },
      { text: '$A=2, B=4, C=-2$', correct: false, why: 'The constant term must be 3 when the quadratic coefficients are matched.' }
    ],
    solution_text: 'Clear denominators and compare coefficients: $1+11x-6x^2=A(x-3)(1-2x)+B(1-2x)+C(x-3)$. Matching powers gives $A=3$, $B=4$ and $C=-2$.', diagramRequired: false, uncertainties: []
  },
  '3115': {
    question_text: 'A sequence is defined by the recurrence relation $u_{n+1}=\\dfrac13u_n-7$ and $u_0=-2$. What is the limit of this sequence as $n\\to\\infty$?',
    structure: 'find-limit-of-convergent-linear-recurrence', meaningfulCase: 'fixed-point-of-contraction-recurrence', mastery: false,
    options: [
      { text: '$-\\dfrac{21}{2}$', correct: true },
      { text: '$-\\dfrac73$', correct: false, why: 'Rearranges the fixed-point equation with the wrong coefficient.' },
      { text: '$-\\dfrac1{18}$', correct: false, why: 'Does not solve the recurrence fixed-point equation.' },
      { text: '$-\\dfrac1{24}$', correct: false, why: 'Uses the initial term rather than the limiting fixed point.' }
    ],
    solution_text: 'Let the limit be $L$. Then $L=\\frac13L-7$, so $\\frac23L=-7$ and $L=-\\frac{21}{2}$. Since the multiplier has magnitude less than one, the sequence converges to this value.', diagramRequired: false, uncertainties: []
  },
  '35404': {
    question_text: 'The bar chart shows the number of school dinners eaten in a week. How many children are represented in the bar chart?',
    structure: 'sum-frequencies-from-bar-chart', meaningfulCase: 'add-discrete-category-counts', mastery: false,
    options: [
      { text: '$30$', correct: true },
      { text: '$15$', correct: false, why: 'Counts only some of the bars rather than summing all frequencies.' },
      { text: '$5$', correct: false, why: 'Confuses the number of dinner categories with the total number of children.' },
      { text: '$12$', correct: false, why: 'Uses the maximum bar-chart scale value instead of the total frequency.' }
    ],
    solution_text: 'Add the frequencies: $6+4+8+0+2+10=30$. Therefore 30 children are represented.', diagramRequired: true, uncertainties: []
  },
  '39379': {
    question_text: 'In a class of 30, the ratio of girls to boys is $2:3$. How many boys are in the class?',
    structure: 'find-part-from-ratio-and-total', meaningfulCase: 'boys-three-of-five-equal-ratio-parts', mastery: false,
    options: [
      { text: '$10$', correct: false, why: 'Uses the number of girls ratio parts instead of the boys parts.' },
      { text: '$3$', correct: false, why: 'Uses the ratio number without scaling it to a total of 30.' },
      { text: '$15$', correct: false, why: 'Splits the class into two equal groups instead of five ratio parts.' },
      { text: '$18$', correct: true }
    ],
    solution_text: 'There are $2+3=5$ equal parts, so each part is $30/5=6$. Boys make up three parts: $3\\times6=18$.', diagramRequired: false, uncertainties: []
  },
  '21334': {
    question_text: 'Find the exact value of $\\displaystyle\\sum_{k=1}^{20}\\ln(3^k)$.',
    structure: 'sum-logarithms-over-arithmetic-exponents', meaningfulCase: 'use-log-power-rule-and-sum-integers', mastery: false,
    options: [
      { text: '$210\\ln3$', correct: true },
      { text: '$20\\ln3$', correct: false, why: 'Counts the terms but ignores the varying exponent k.' },
      { text: '$\\ln630$', correct: false, why: 'Treats the logarithms as though their arguments were added.' },
      { text: '$\\ln60$', correct: false, why: 'Does not apply the logarithm power rule or sum the exponents.' }
    ],
    solution_text: 'Using $\\ln(3^k)=k\\ln3$, the sum is $(1+2+\\cdots+20)\\ln3=\\frac{20\\times21}{2}\\ln3=210\\ln3$.', diagramRequired: false, uncertainties: []
  },
  '33477': {
    question_text: 'Calculate $4-1.15$.',
    structure: 'subtract-decimal-from-integer', meaningfulCase: 'align-decimal-places', mastery: false,
    options: [
      { text: '$1.11$', correct: false, why: 'Subtracts with incorrect decimal-place alignment.' },
      { text: '$3.85$', correct: false, why: 'Makes a one-decimal subtraction error in the hundredths place.' },
      { text: '$3.15$', correct: false, why: 'Subtracts the decimal digits incorrectly from 4.' },
      { text: '$2.85$', correct: true }
    ],
    solution_text: 'Write $4$ as $4.00$: $4.00-1.15=2.85$.', diagramRequired: false, uncertainties: []
  },
  '121207': {
    question_text: 'Which of these would you use the quotient rule to differentiate?',
    structure: 'recognise-quotient-rule-structure', meaningfulCase: 'one-function-divided-by-another', mastery: false,
    options: [
      { text: '$e^x\\sin x$', correct: false, why: 'This is a product of two functions, so the product rule applies.' },
      { text: '$e^{\\sin x}$', correct: false, why: 'This is a composite function, so the chain rule applies.' },
      { text: '$\\dfrac{e^x}{\\sin x}$', correct: true },
      { text: '$e^x+\\sin x$', correct: false, why: 'A sum is differentiated term by term rather than by the quotient rule.' }
    ],
    solution_text: 'The quotient rule is used when one differentiable function is divided by another. Of the choices, only $e^x/\\sin x$ has that structure.', diagramRequired: false, uncertainties: []
  },
  '154616': {
    question_text: 'Yesterday the prime minister said that the number of people arriving in the country illegally by boat was down by a third on last year\'s number. This year\'s number is $28\,000$. What was last year\'s number?',
    structure: 'reverse-fractional-decrease', meaningfulCase: 'current-value-is-two-thirds-of-original', mastery: false,
    options: [
      { text: '$9\\,333$', correct: false, why: 'Divides the current value by 3 instead of reversing the one-third decrease.' },
      { text: '$37\\,333$', correct: false, why: 'Adds one third of the current value rather than restoring the original total.' },
      { text: '$42\\,000$', correct: true },
      { text: '$84\\,000$', correct: false, why: 'Doubles the correct original value by treating a one-third decrease as a one-half decrease.' }
    ],
    solution_text: 'After a one-third decrease, this year is $2/3$ of last year. Thus last year was $28\,000\\div(2/3)=28\,000\\times3/2=42\,000$.', diagramRequired: false, uncertainties: []
  },
  '103217': {
    question_text: 'Consider the expansion of $\\left(x^2-\\dfrac2x\\right)^{12}$. Find the constant term.',
    structure: 'find-constant-term-in-binomial-expansion', meaningfulCase: 'match-exponent-of-x-to-zero', mastery: false,
    options: [
      { text: '$31680$', correct: false, why: 'Uses an incorrect binomial coefficient or power of 2.' },
      { text: '$63360$', correct: false, why: 'Is half the correct coefficient and misses the full power contribution.' },
      { text: '$126720$', correct: true },
      { text: '$71280$', correct: false, why: 'Chooses the wrong term index for obtaining exponent zero.' }
    ],
    solution_text: 'The general term has exponent $2(12-k)-k=24-3k$. Set this to zero: $k=8$. The constant term is $\\binom{12}{8}(-2)^8=495\\times256=126720$.', diagramRequired: false, uncertainties: []
  },
  '33936': {
    question_text: 'What is the perimeter of the L-shaped figure? The outer dimensions are $12\\text{ cm}$ by $11\\text{ cm}$, with top horizontal length $7\\text{ cm}$, the right vertical length $5\\text{ cm}$ and the step horizontal length $5\\text{ cm}$.',
    structure: 'find-perimeter-of-rectilinear-composite-shape', meaningfulCase: 'sum-horizontal-and-vertical-boundary-lengths', mastery: false,
    options: [
      { text: '$46\\text{ cm}$', correct: false, why: 'Adds an internal or duplicated segment instead of the boundary lengths.' },
      { text: '$40\\text{ cm}$', correct: true },
      { text: '$45\\text{ cm}$', correct: false, why: 'Makes a one-centimetre error when finding the missing step length.' },
      { text: '$46\\text{ cm}^2$', correct: false, why: 'Gives an area unit and does not represent the perimeter.' }
    ],
    solution_text: 'The total horizontal boundary is $7+5+12=24$ cm. The total vertical boundary is $11+5=16$ cm because the two missing vertical parts together equal $11-5$. Therefore the perimeter is $24+16=40$ cm.', diagramRequired: true, uncertainties: []
  },
  '102007': {
    question_text: 'A man of mass $80\\text{ kg}$ is ascending in a lift of mass $400\\text{ kg}$ with acceleration $2\\text{ m s}^{-2}$. Which equation would you use to calculate the tension in the cable of the lift?',
    structure: 'apply-newtons-second-law-to-lift-and-passenger-system', meaningfulCase: 'whole-system-tension-under-upward-acceleration', mastery: false,
    options: [
      { text: '$T-400g=400\\times2$', correct: false, why: 'Omits the man from the accelerating system mass and weight.' },
      { text: '$T-400g-80g=400\\times2$', correct: false, why: 'Includes both weights but uses only the lift mass on the acceleration side.' },
      { text: '$T-400g-80g=480\\times2$', correct: true },
      { text: '$R-80g=80\\times2$', correct: false, why: 'Uses the reaction on the man rather than the cable tension in the whole system.' }
    ],
    solution_text: 'Treat the lift and man as one system of mass $480$ kg. The external forces are tension upward and total weight $480g$ downward, so Newton\'s second law gives $T-480g=480\\times2$.', diagramRequired: false, uncertainties: []
  },
  '41099': {
    question_text: 'Rationalise the denominator: $\\dfrac{1}{\\sqrt5-1}$.', structure: 'rationalise-single-surds-denominator', meaningfulCase: 'multiply-by-conjugate', mastery: false,
    options: [{text:'$\\dfrac{\\sqrt5+1}{6}$',correct:false,why:'Uses the wrong difference of squares in the denominator.'},{text:'$\\dfrac{\\sqrt5-1}{4}$',correct:false,why:'Multiplies by the wrong conjugate and leaves the sign structure unchanged.'},{text:'$\\dfrac{\\sqrt5-1}{6}$',correct:false,why:'Has the wrong numerator and denominator after rationalisation.'},{text:'$\\dfrac{\\sqrt5+1}{4}$',correct:true}],
    solution_text: 'Multiply by the conjugate: $\\dfrac1{\\sqrt5-1}\\times\\dfrac{\\sqrt5+1}{\\sqrt5+1}=\\dfrac{\\sqrt5+1}{4}$.', diagramRequired: false, uncertainties: []
  },
  '81484': {
    question_text: 'Write $0.5\\dot{2}$ as a fraction in its lowest terms.', structure: 'convert-single-digit-recurring-decimal-to-fraction', meaningfulCase: 'one-recurring-digit-after-nonrecurring-digit', mastery: false,
    options: [{text:'$\\dfrac{47}{90}$',correct:true},{text:'$\\dfrac{52}{90}$',correct:false,why:'Treats the recurring decimal as a terminating hundredths value.'},{text:'$\\dfrac59$',correct:false,why:'Represents 0.555... rather than 0.5222... .'},{text:'$\\dfrac{52}{100}$',correct:false,why:'Writes the visible digits as a terminating decimal and ignores recurrence.'}],
    solution_text: 'Let $x=0.5222\\ldots$. Then $10x=5.2222\\ldots$, so $9x=4.7$ and $x=47/90$.', diagramRequired: false, uncertainties: []
  },
  '87714': {
    question_text: 'The exchange rate is £1 to 1.2 euros. Nike trainers cost £300 in the London store and 330 euros in the Paris store. Where are they best value and by what amount?', structure: 'compare-prices-under-currency-exchange-rate', meaningfulCase: 'convert-euro-price-to-pounds', mastery: false,
    options: [{text:'In Paris they are £25 cheaper',correct:true},{text:'In London they are £3 cheaper',correct:false,why:'Converts the euro price using an incorrect exchange calculation.'},{text:'In Paris they are £30 cheaper',correct:false,why:'Subtracts the currency amounts without converting euros to pounds.'},{text:'In London they are £5 cheaper',correct:false,why:'Uses an incorrect difference after currency conversion.'}],
    solution_text: '330 euros is $330/1.2=£275$. Compared with £300 in London, Paris is £25 cheaper.', diagramRequired: false, uncertainties: []
  },
  '2823': {
    question_text: 'What are the coordinates of the marked point in the cuboid diagram?', structure: 'read-three-dimensional-coordinate-from-cuboid', meaningfulCase: 'combine-axis-displacements', mastery: false,
    options: [{text:'$(5,3,0)$',correct:false,why:'Assigns a non-zero height to a point on the base and uses the wrong y-coordinate.'},{text:'$(5,0,3)$',correct:true},{text:'$(5,5,0)$',correct:false,why:'Places the point on the base with the wrong horizontal coordinate.'},{text:'$(3,5,0)$',correct:false,why:'Swaps the x and y coordinates and omits the point height.'}],
    solution_text: 'Reading the axes gives $x=5$, $y=0$ and $z=3$, so the coordinates are $(5,0,3)$.', diagramRequired: true, uncertainties: []
  },
  '135201': {
    question_text: 'Which graph is most likely to illustrate how the time taken to complete a job, $t$, changes depending on the number of people working on it, $p$?', structure: 'select-inverse-proportional-relationship-graph', meaningfulCase: 'more-workers-reduce-time-with-diminishing-effect', mastery: false,
    options: [{text:'A',correct:false,why:'Shows time increasing linearly with the number of people.'},{text:'B',correct:false,why:'Shows a straight-line decrease reaching zero, not a realistic inverse relationship.'},{text:'C',correct:true},{text:'D',correct:false,why:'Shows a direct proportional increase rather than decreasing completion time.'}],
    solution_text: 'More workers reduce the time, with diminishing effect, so the decreasing inverse-type curve C is most suitable.', diagramRequired: true, uncertainties: []
  },
  '129252': {
    question_text: 'Dave recorded the number of pets his classmates have in a frequency table. The highlighted row is 2 pets with frequency 3. How many pets did the people in the highlighted row have in total?', structure: 'multiply-value-by-frequency-in-table', meaningfulCase: 'total-from-discrete-value-and-frequency', mastery: false,
    options: [{text:'5',correct:false,why:'Adds the number of pets and the frequency instead of multiplying.'},{text:'6',correct:true},{text:'3',correct:false,why:'Reports the frequency but not the total number of pets.'},{text:'2',correct:false,why:'Reports the category value but not the total across three people.'}],
    solution_text: 'Three people each have 2 pets, so the total is $2\\times3=6$ pets.', diagramRequired: true, uncertainties: []
  },
  '23664': {
    question_text: 'The graph of $y=x-1$ is shown. Use the graph to write down the solution of $x-1=0$.', structure: 'read-x-intercept-as-linear-equation-solution', meaningfulCase: 'zero-of-function-at-x-intercept', mastery: false,
    options: [{text:'$x=-1$',correct:false,why:'Uses the y-intercept rather than the x-intercept.'},{text:'$x=0$',correct:false,why:'Confuses the origin with the point where the graph crosses the x-axis.'},{text:'$x=1$',correct:true},{text:'$y=1$',correct:false,why:'Gives a y-value even though the question asks for x.'}],
    solution_text: 'The solution of $x-1=0$ is the x-coordinate where the graph crosses the x-axis. The intercept is at $x=1$.', diagramRequired: true, uncertainties: []
  },
  '28999': {
    question_text: 'Two different size boxes contain the same cereal: 500 g costs £1.90 and 200 g costs £0.90. Which method would allow you to find out which is best value?', structure: 'compare-unit-prices', meaningfulCase: 'price-per-gram-comparison', mastery: false,
    options: [{text:'$500\\times200$',correct:false,why:'Combines the masses and does not compare price per unit.'},{text:'Not enough information',correct:false,why:'Both mass and price are given, so unit prices can be compared.'},{text:'$\\dfrac{500}{200}$',correct:false,why:'Compares masses only and ignores the prices.'},{text:'$\\dfrac{500}{1.90}$ and $\\dfrac{200}{0.90}$',correct:true}],
    solution_text: 'Compare the amount of cereal per pound, or equivalently compare price per gram. The required calculation uses both mass and price for each box.', diagramRequired: true, uncertainties: []
  },
  '32836': {
    question_text: 'Which of these numbers is a multiple of 4 and 12?', structure: 'identify-common-multiple', meaningfulCase: 'number-divisible-by-both-values', mastery: false,
    options: [{text:'2',correct:false,why:'Is not divisible by 4 or by 12.'},{text:'4',correct:false,why:'Is divisible by 4 but is not a multiple of 12.'},{text:'12',correct:true},{text:'8',correct:false,why:'Is divisible by 4 but is not divisible by 12.'}],
    solution_text: 'A multiple of 12 is automatically a multiple of 4 because $12=3\\times4$. Therefore 12 is correct.', diagramRequired: false, uncertainties: []
  },
  '35597': {
    question_text: 'The exchange rate is 179 Japanese Yen = £1. Which calculation gives the number of pounds in 1000 Japanese Yen?', structure: 'convert-currency-by-dividing-exchange-rate', meaningfulCase: 'yen-to-pounds-conversion', mastery: false,
    options: [{text:'$1000+179$',correct:false,why:'Adds the exchange rate instead of converting by division.'},{text:'$179\\times1000$',correct:false,why:'Multiplies by the number of yen per pound rather than dividing.'},{text:'$179\\div1000$',correct:false,why:'Reverses the required numerator and denominator.'},{text:'$1000\\div179$',correct:true}],
    solution_text: 'Since 179 yen equals £1, convert 1000 yen to pounds by dividing: $1000\\div179$.', diagramRequired: false, uncertainties: []
  },
  '2908': {
    question_text: 'The graph is $f(x)=\\cos x$ on a restricted domain. What is the domain of $f^{-1}(x)$?', structure: 'swap-domain-and-range-for-inverse-function', meaningfulCase: 'inverse-domain-equals-original-range', mastery: false,
    options: [{text:'$0\\le x\\le\\pi$',correct:false,why:'Gives the restricted domain of the original cosine function.'},{text:'$0\\le y\\le\\pi$',correct:false,why:'Uses the wrong variable and describes the original input interval.'},{text:'$-1\\le x\\le1$',correct:true},{text:'$-1\\le y\\le1$',correct:false,why:'Uses y instead of x for the domain of the inverse.'}],
    solution_text: 'The domain of an inverse function is the range of the original. The displayed cosine curve has range $[-1,1]$, so the domain of $f^{-1}$ is $-1\\le x\\le1$.', diagramRequired: true, uncertainties: []
  },
  '98700': {
    question_text: 'Calculate the magnitude of the vector $\\mathbf a=\\begin{pmatrix}2\\\\-5\\\\3\\end{pmatrix}$.', structure: 'find-magnitude-of-three-dimensional-vector', meaningfulCase: 'sum-squares-of-components', mastery: false,
    options: [{text:'$\\sqrt{38}$',correct:true},{text:'$\\sqrt{-12}$',correct:false,why:'Subtracts squared components, which cannot give a vector magnitude.'},{text:'$0$',correct:false,why:'A non-zero vector cannot have zero magnitude.'},{text:'$6$',correct:false,why:'Adds the signed components rather than taking the square root of squared components.'}],
    solution_text: '$|\\mathbf a|=\\sqrt{2^2+(-5)^2+3^2}=\\sqrt{4+25+9}=\\sqrt{38}$.', diagramRequired: false, uncertainties: []
  },
  '19813': {
    question_text: 'Which of these shapes has surface area $14\\text{ cm}^2$?', structure: 'count-exposed-faces-of-unit-cube-structure', meaningfulCase: 'surface-area-of-three-edge-connected-cubes', mastery: false,
    options: [{text:'A',correct:false,why:'Its cube arrangement exposes more than fourteen unit-square faces.'},{text:'B',correct:false,why:'The taller arrangement has a different exposed-face count.'},{text:'C',correct:false,why:'Its larger stack has more exposed faces than fourteen.'},{text:'D',correct:true}],
    solution_text: 'Shape D consists of three unit cubes joined edge-to-edge in an L arrangement. Starting with $3\\times6=18$ faces and removing two faces for each of the two joins gives $18-4=14$ square centimetres.', diagramRequired: true, uncertainties: []
  },
  '142229': {
    question_text: 'What number is the arrow pointing to on the ruler?', structure: 'read-ruler-to-nearest-millimetre', meaningfulCase: 'convert-millimetre-mark-to-centimetres', mastery: false,
    options: [{text:'$7.3\\text{ cm}$',correct:true},{text:'$7\\text{ cm}$ and $2\\text{ mm}$',correct:false,why:'Reads the arrow one millimetre before its actual mark.'},{text:'$72\\text{ cm}$',correct:false,why:'Misreads the ruler scale by a factor of ten.'},{text:'$70.2\\text{ cm}$',correct:false,why:'Places the decimal point incorrectly and gives the wrong unit scale.'}],
    solution_text: 'The arrow is three millimetre marks past $7$ cm, so it indicates $7.3$ cm.', diagramRequired: true, uncertainties: []
  },
  '78390': {
    question_text: 'The probability you win a game is $0.4$. Assuming independent outcomes, if you played the game 200 times, how many times would you expect to lose?', structure: 'find-expected-frequency-from-complement-probability', meaningfulCase: 'expected-losses-over-repeated-trials', mastery: false,
    options: [{text:'80 times',correct:false,why:'Calculates the expected number of wins rather than losses.'},{text:'160 times',correct:false,why:'Doubles the correct expected number of losses.'},{text:'120 times',correct:true},{text:'40 times',correct:false,why:'Uses the win probability as though it were a count of losses.'}],
    solution_text: 'The probability of losing is $1-0.4=0.6$. The expected number of losses is $200\\times0.6=120$.', diagramRequired: false, uncertainties: []
  },
  '33940': {
    question_text: 'In Class 6 there are four boys to every two girls. Write the ratio of boys to girls in its simplest form.', structure: 'simplify-two-part-ratio', meaningfulCase: 'divide-ratio-by-common-factor', mastery: false,
    options: [{text:'$4:2$',correct:false,why:'Repeats the given ratio without simplifying it.'},{text:'$2:4$',correct:false,why:'Reverses the order of boys and girls.'},{text:'$1:2$',correct:false,why:'Reverses the simplified ratio.'},{text:'$2:1$',correct:true}],
    solution_text: 'Divide both parts of $4:2$ by 2: $4:2=2:1$.', diagramRequired: false, uncertainties: []
  },
  '82352': {
    question_text: 'Write $x^2-6x+1$ in the form $(x+p)^2+q$.', structure: 'complete-square-for-quadratic', meaningfulCase: 'negative-linear-coefficient', mastery: false,
    options: [{text:'$(x-3)^2+10$',correct:false,why:'Adds the completing-square adjustment instead of subtracting it.'},{text:'$(x-3)^2-8$',correct:true},{text:'$(x-3)^2-10$',correct:false,why:'Uses an incorrect constant after completing the square.'},{text:'$(x-3)^2-9$',correct:false,why:'Forgets to include the original constant term 1.'}],
    solution_text: '$x^2-6x+1=(x^2-6x+9)-9+1=(x-3)^2-8$.', diagramRequired: false, uncertainties: []
  },
  '84005': {
    question_text: 'Which of the following lines is parallel to $y=4x+3$?', structure: 'identify-parallel-line-from-gradient', meaningfulCase: 'equal-gradients-different-intercepts', mastery: false,
    options: [{text:'$y=4x-2$',correct:true},{text:'$y=4+3x$',correct:false,why:'Has gradient 3 rather than the required gradient 4.'},{text:'$y=-4x+3$',correct:false,why:'Has the opposite gradient and therefore is not parallel.'},{text:'$y=3x+3$',correct:false,why:'Has gradient 3, not the gradient 4 of the given line.'}],
    solution_text: 'Parallel non-vertical lines have equal gradients. The given gradient is 4, and only $y=4x-2$ has gradient 4 with a different intercept.', diagramRequired: false, uncertainties: []
  },
  '126210': {
    question_text: 'What value of $x$ would allow you to use the expansion of $(4-9x)^{1/2}$ to approximate $\\sqrt{310}$?', structure: 'choose-binomial-expansion-substitution', meaningfulCase: 'factor-out-scale-before-valid-small-parameter', mastery: false,
    options: [{text:'$x=-34$',correct:false,why:'Makes the radicand 310 but lies far outside the useful expansion range.'},{text:'$x=0.1$ then multiply the answer by 100',correct:false,why:'Uses the wrong scale factor after factoring the square root.'},{text:'$x=0.1$ then multiply the answer by 10',correct:true},{text:'There is not one',correct:false,why:'A valid substitution is obtained by writing $\\sqrt{310}=10\\sqrt{3.1}$.'}],
    solution_text: 'Set $x=0.1$, giving $(4-9x)^{1/2}=\\sqrt{3.1}$. Since $\\sqrt{310}=10\\sqrt{3.1}$, multiply the expansion result by 10.', diagramRequired: false, uncertainties: []
  },
  '150942': {
    question_text: 'A geometric sequence has terms $\\ldots,6x,x+3,x^2,\\ldots$. What is the common ratio of the sequence?', structure: 'find-common-ratio-from-three-geometric-terms', meaningfulCase: 'equate-adjacent-term-ratios', mastery: false,
    options: [{text:'$r=3$',correct:false,why:'Does not satisfy equality of the two adjacent term ratios.'},{text:'$r=\\dfrac32$',correct:false,why:'Uses the value of x rather than the resulting common ratio.'},{text:'$r=\\dfrac12$',correct:true},{text:'Not enough information',correct:false,why:'The geometric condition determines the valid value and ratio here.'}],
    solution_text: 'For consecutive geometric terms, $(x+3)/(6x)=x^2/(x+3)$. The valid solution is $x=3/2$, giving $r=(x+3)/(6x)=4.5/9=1/2$.', diagramRequired: false, uncertainties: []
  },
  '98720': {
    question_text: 'Given that $f(x)=\\sqrt{x}+\\dfrac{2}{x^2}$, find $f\\prime(4)$.', structure: 'differentiate-root-and-negative-power-function', meaningfulCase: 'evaluate-derivative-at-positive-input', mastery: false,
    options: [{text:'$\\dfrac3{16}$',correct:true},{text:'$\\dfrac5{16}$',correct:false,why:'Combines the derivative terms with an incorrect power contribution.'},{text:'$\\dfrac{33}{16}$',correct:false,why:'Uses the function value or an incorrect derivative of the reciprocal term.'},{text:'$\\dfrac7{16}$',correct:false,why:'Makes an arithmetic error after differentiating the two terms.'}],
    solution_text: 'Write $f(x)=x^{1/2}+2x^{-2}$. Then $f\\prime(x)=\\frac12x^{-1/2}-4x^{-3}$, so $f\\prime(4)=1/4-4/64=3/16$.', diagramRequired: false, uncertainties: []
  },
  '31095': {
    question_text: 'For which real values of $x$ is $f(x)=\\dfrac1{\\sqrt{1-x^2}}$ defined?', structure: 'find-domain-of-function-with-square-root-denominator', meaningfulCase: 'radicand-strictly-positive-because-denominator', mastery: false,
    options: [{text:'All $x$ except $1$ and $-1$',correct:false,why:'Allows values outside the square-root domain.'},{text:'$x<1$ only',correct:false,why:'Fails to impose the lower bound from the squared variable.'},{text:'$x>1$, $x<-1$ only',correct:false,why:'These values make the square-root radicand negative.'},{text:'$-1<x<1$ only',correct:true}],
    solution_text: 'The denominator requires $1-x^2>0$, since it cannot be zero. Thus $x^2<1$, giving $-1<x<1$.', diagramRequired: false, uncertainties: []
  },
  '77208': {
    question_text: 'The pictogram shows how many people came to a fair; one smiley represents 8 people. What is the mean number of people who attended over Thursday to Sunday?', structure: 'calculate-mean-from-pictogram-frequencies', meaningfulCase: 'include-half-symbols-in-total', mastery: false,
    options: [{text:'$2.75$',correct:false,why:'Averages symbol counts without converting symbols to people.'},{text:'$22$',correct:true},{text:'$16$',correct:false,why:'Uses the key value rather than the mean total attendance.'},{text:'You cannot tell',correct:false,why:'The pictogram gives enough information, including the half-symbols.'}],
    solution_text: 'The daily totals are $24,24,28,12$ people. Their mean is $(24+24+28+12)/4=88/4=22$.', diagramRequired: true, uncertainties: []
  },
  '81715': {
    question_text: 'For $y=3x^2-2x$, what is the $x$-coordinate of the point on the curve that has gradient $-2$?', structure: 'solve-for-x-from-quadratic-gradient', meaningfulCase: 'set-derivative-equal-to-given-gradient', mastery: false,
    options: [{text:'$-\\dfrac23$',correct:false,why:'Solves the derivative equation with the coefficient incorrectly.'},{text:'$-14$',correct:false,why:'Does not result from setting the derivative equal to negative two.'},{text:'$16$',correct:false,why:'Uses an unrelated square or coefficient calculation.'},{text:'$0$',correct:true}],
    solution_text: 'The gradient is $dy/dx=6x-2$. Set $6x-2=-2$, so $6x=0$ and $x=0$.', diagramRequired: false, uncertainties: []
  },
  '81740': {
    question_text: 'Express $\\cos(130^\\circ)$ as the cosine of another angle between $0^\\circ$ and $180^\\circ$.', structure: 'use-cosine-supplementary-angle-identity', meaningfulCase: 'obtuse-angle-cosine-negative-acute-reference', mastery: false,
    options: [{text:'$-\\cos(50^\\circ)$',correct:true},{text:'$\\cos(50^\\circ)$',correct:false,why:'Omits the negative sign associated with cosine in the second quadrant.'},{text:'$\\cos(40^\\circ)$',correct:false,why:'Uses the wrong reference angle for 130 degrees.'},{text:'$-\\cos(40^\\circ)$',correct:false,why:'Uses the wrong acute reference angle.'}],
    solution_text: 'Since $130^\\circ=180^\\circ-50^\\circ$, $\\cos130^\\circ=-\\cos50^\\circ$.', diagramRequired: false, uncertainties: []
  },
  '73612': {
    question_text: 'A TV costs £500 including VAT at 20%. What was the price before VAT was added? Give your answer to the nearest 1p.', structure: 'reverse-percentage-increase', meaningfulCase: 'inclusive-price-is-120-percent-of-original', mastery: false,
    options: [{text:'£416.66',correct:false,why:'Rounds the reverse percentage calculation down instead of to the nearest penny.'},{text:'£83.33',correct:false,why:'Calculates the VAT amount rather than the original pre-VAT price.'},{text:'£400',correct:false,why:'Subtracts 20 percent of the inclusive price instead of dividing by 1.2.'},{text:'£416.67',correct:true}],
    solution_text: 'The inclusive price is $120\%$ of the original, so the original price is $500/1.2=£416.666\ldots$, which rounds to £416.67.', diagramRequired: false, uncertainties: []
  },
  '82864': {
    question_text: 'The height of students in Class 1 has a range of 38 cm. The height of students in Class 2 has a range of 17 cm. This means that...', structure: 'interpret-range-as-measure-of-spread', meaningfulCase: 'larger-range-means-less-consistency', mastery: false,
    options: [{text:'Students in Class 1 are taller on average',correct:false,why:'Range describes spread, not the average height.'},{text:'Students in Class 1 are shorter on average',correct:false,why:'No mean comparison can be made from the two ranges.'},{text:'The heights of students in Class 1 are more consistent',correct:false,why:'A larger range indicates greater, not smaller, variation.'},{text:'The heights of students in Class 1 are less consistent',correct:true}],
    solution_text: 'Class 1 has the larger range, so its heights are more spread out and therefore less consistent than Class 2.', diagramRequired: false, uncertainties: []
  },
  '95783': {
    question_text: 'What is the surface area of the cuboid with dimensions $4\\text{ cm}$, $3\\text{ cm}$ and $2\\text{ cm}$?', structure: 'find-surface-area-of-cuboid', meaningfulCase: 'sum-three-pairs-of-opposite-faces', mastery: false,
    options: [{text:'$52\\text{ cm}^2$',correct:true},{text:'$9\\text{ cm}^2$',correct:false,why:'Multiplies only two dimensions and does not include all faces.'},{text:'$26\\text{ cm}^2$',correct:false,why:'Calculates half the surface area by omitting the opposite faces.'},{text:'$24\\text{ cm}^2$',correct:false,why:'Uses an incomplete product sum for the six rectangular faces.'}],
    solution_text: 'Surface area $=2(4\\times3+4\\times2+3\\times2)=2(12+8+6)=52\\text{ cm}^2$.', diagramRequired: true, uncertainties: []
  },
  '98024': {
    question_text: 'Tom says the coordinate shape is a parallelogram. Katie says it is a rhombus. Who is correct?', structure: 'classify-quadrilateral-from-coordinate-side-lengths', meaningfulCase: 'opposite-sides-equal-but-adjacent-sides-unequal', mastery: false,
    options: [{text:'Only Tom',correct:true},{text:'Only Katie',correct:false,why:'The four side lengths are not all equal, so the shape is not a rhombus.'},{text:'Both Tom and Katie',correct:false,why:'It is a parallelogram but its adjacent side lengths differ.'},{text:'Neither is correct',correct:false,why:'Opposite side vectors show that the quadrilateral is a parallelogram.'}],
    solution_text: 'The side vectors are $AB=(1,-3)$, $BC=(3,2)$, $CD=(-1,3)$ and $DA=(-3,-2)$. Opposite sides are equal and parallel, so it is a parallelogram; adjacent lengths $\\sqrt{10}$ and $\\sqrt{13}$ differ, so it is not a rhombus.', diagramRequired: true, uncertainties: []
  },
  '19111': {
    question_text: 'The frequency table gives the numbers of minutes that 40 Year 11 students were late. Which graph is correct?\n\n$0<h\\le5:14$, $5<h\\le10:11$, $10<h\\le15:5$, $15<h\\le20:8$, $20<h\\le25:2$.', structure: 'choose-frequency-polygon-from-grouped-table', meaningfulCase: 'plot-frequencies-at-class-midpoints', mastery: false,
    options: [{text:'A',correct:false,why:'Plots the frequencies at class boundaries instead of class midpoints.'},{text:'B',correct:true},{text:'C',correct:false,why:'Uses an incorrect starting position and does not use the class midpoints.'},{text:'D',correct:false,why:'Connects points with an incorrect horizontal placement for the intervals.'}],
    solution_text: 'A frequency polygon uses class midpoints $2.5,7.5,12.5,17.5,22.5$ with frequencies $14,11,5,8,2$. Graph B places the points accordingly.', diagramRequired: true, uncertainties: []
  },
  '70760': {
    question_text: 'Each of these ratios has been simplified with the workings shown. Which one has been simplified correctly?', structure: 'simplify-ratios-with-unit-conversion', meaningfulCase: 'convert-units-before-dividing-ratio', mastery: false,
    options: [{text:'A: $160\\text{ g}:20\\text{ g}=16:2$',correct:false,why:'The result 16:2 can still be simplified to 8:1.'},{text:'B: $52\\text{ mm}:10\\text{ cm}=26:5$',correct:false,why:'Divides before converting centimetres to millimetres.'},{text:'C: $6\\text{ hours}:3\\text{ days}=2:1$',correct:false,why:'Does not convert days into hours before comparing the quantities.'},{text:'D: $70\\text{ ml}:140\\text{ ml}=1:2$',correct:true}],
    solution_text: 'In D both quantities use millilitres, and dividing by 70 gives $1:2$. The other workings either leave a ratio unsimplified or fail to convert units.', diagramRequired: false, uncertainties: []
  },
  '83751': {
    question_text: 'A piece of metal has density $0.4\\text{ kg m}^{-3}$. A particular piece weighs $4\\text{ kg}$. What is its volume?', structure: 'use-density-mass-volume-relation', meaningfulCase: 'volume-equals-mass-divided-by-density', mastery: false,
    options: [{text:'$0.1\\text{ m}^3$',correct:false,why:'Divides density by mass instead of mass by density.'},{text:'$10\\text{ m}^3$',correct:true},{text:'$1.6\\text{ m}^3$',correct:false,why:'Multiplies the mass and density rather than applying the density formula.'},{text:'$1\\text{ m}^3$',correct:false,why:'Uses neither the given mass-to-density quotient nor the correct units.'}],
    solution_text: 'Using $\\rho=m/V$, rearrange to $V=m/\\rho=4/0.4=10\\text{ m}^3$.', diagramRequired: false, uncertainties: []
  },
  '15076': {
    question_text: 'Which of these is the gradient for the line $px+qy+r=0$?', structure: 'read-gradient-from-general-line-equation', meaningfulCase: 'rearrange-to-y-on-one-side', mastery: false,
    options: [{text:'$-\\dfrac pq$',correct:true},{text:'$-\\dfrac qp$',correct:false,why:'Inverts the coefficients when rearranging for y.'},{text:'$\\dfrac pq$',correct:false,why:'Omits the negative sign from moving px to the other side.'},{text:'$\\dfrac qp$',correct:false,why:'Both inverts the coefficients and omits the required negative sign.'}],
    solution_text: 'Rearrange: $qy=-px-r$, so $y=-\\dfrac pqx-\\dfrac rq$. The gradient is $-p/q$.', diagramRequired: false, uncertainties: []
  },
  '3963': {
    question_text: 'The coordinates are $(-2,-8)$ and $(3,-2)$. What would be the gradient of a line joining these two coordinates?', structure: 'find-gradient-between-two-points', meaningfulCase: 'positive-rise-over-run', mastery: false,
    options: [{text:'$\\dfrac56$',correct:false,why:'Reverses the rise and run in the gradient calculation.'},{text:'$2$',correct:false,why:'Does not use the coordinate differences correctly.'},{text:'$\\dfrac65$',correct:true},{text:'$6$',correct:false,why:'Uses the vertical difference without dividing by the horizontal difference.'}],
    solution_text: 'The rise is $-2-(-8)=6$ and the run is $3-(-2)=5$. Thus the gradient is $6/5$.', diagramRequired: true, uncertainties: []
  },
  '10116': {
    question_text: 'A cuboid is shown on a 3-D grid. The point $P$ has coordinates $(2,3,4)$. What are the coordinates of point $Q$?', structure: 'read-coordinate-with-zero-axis-component', meaningfulCase: 'point-on-base-plane', mastery: false,
    options: [{text:'$(2,3,0)$',correct:false,why:'Sets the z-coordinate to zero but leaves the point at the wrong height direction.'},{text:'$(0,3,4)$',correct:false,why:'Sets the x-coordinate to zero even though Q shares the other base position.'},{text:'$(2,0,4)$',correct:true},{text:'$(2,0,0)$',correct:false,why:'Removes both non-x coordinates instead of retaining the cuboid depth.'}],
    solution_text: 'Point Q is directly below P on the base, so it has the same x and z coordinates but y-coordinate zero: $(2,0,4)$.', diagramRequired: true, uncertainties: []
  },
  '30244': {
    question_text: 'Given $y=\\dfrac{e^{4x}}{3x+5}$, find $\\dfrac{dy}{dx}$.', structure: 'differentiate-exponential-quotient', meaningfulCase: 'quotient-rule-with-linear-denominator', mastery: false,
    options: [{text:'$\\dfrac{e^{4x}(12x+17)}{3x+5}$',correct:false,why:'Uses the quotient-rule numerator but forgets to square the denominator.'},{text:'$\\dfrac{7e^{4x}}{3x+5}$',correct:false,why:'Does not correctly differentiate and combine the numerator and denominator.'},{text:'$\\dfrac{4e^{4x}(12x+17)}{(3x+5)^2}$',correct:false,why:'Includes an extra factor of 4 after already differentiating the exponential.'},{text:'$\\dfrac{e^{4x}(12x+17)}{(3x+5)^2}$',correct:true}],
    solution_text: 'With $u=e^{4x}$ and $v=3x+5$, the derivatives are $du/dx=4e^{4x}$ and $dv/dx=3$. The quotient rule gives $dy/dx=e^{4x}[4(3x+5)-3]/(3x+5)^2=e^{4x}(12x+17)/(3x+5)^2$.', diagramRequired: false, uncertainties: []
  },
  '3782': {
    question_text: 'Sketch the graph of a function whose derivative satisfies $f\\prime(x)=0$ at $x=-1$ and $x=4$, $f\\prime(x)<0$ for $x<-1$ and $x>4$, and $f\\prime(x)>0$ for $-1<x<4$. Which graph is suitable?', structure: 'interpret-derivative-sign-chart-as-graph-shape', meaningfulCase: 'minimum-then-maximum-turning-points', mastery: false,
    options: [{text:'A',correct:false,why:'Has the opposite sign pattern around the turning points.'},{text:'B',correct:true},{text:'C',correct:false,why:'Its turning-point locations and sign changes do not match the conditions.'},{text:'D',correct:false,why:'Shows a maximum at the first stationary point rather than a minimum.'}],
    solution_text: 'The function decreases until $x=-1$, increases from $-1$ to $4$, then decreases after $4$. Therefore it has a local minimum at $-1$ and a local maximum at $4$, matching graph B.', diagramRequired: true, uncertainties: []
  },
  '87698': {
    question_text: 'Beth yw enw\'r polygon ar y dde? (What is the name of the polygon on the right?)', structure: 'identify-polygon-by-number-of-sides', meaningfulCase: 'count-seven-boundary-sides', mastery: false,
    options: [{text:'Pentagon',correct:false,why:'A pentagon has only five sides, fewer than the displayed shape.'},{text:'Hexagon',correct:false,why:'A hexagon has six sides, but the shape has seven.'},{text:'Heptagon',correct:true},{text:'Octagon',correct:false,why:'An octagon has eight sides, one more than the displayed shape.'}],
    solution_text: 'Counting the boundary edges gives seven sides, so the polygon is a heptagon.', diagramRequired: true, uncertainties: []
  },
  '91463': {
    question_text: 'Dylan rolls a normal fair die. What is the probability that Dylan\'s die lands on 4 or 5?', structure: 'add-probabilities-of-disjoint-die-outcomes', meaningfulCase: 'two-favourable-faces-out-of-six', mastery: false,
    options: [{text:'$\\dfrac13$',correct:true},{text:'$\\dfrac19$',correct:false,why:'Multiplies the two probabilities instead of adding disjoint outcomes.'},{text:'$\\dfrac1{20}$',correct:false,why:'Uses an unrelated denominator rather than the six equally likely faces.'},{text:'$\\dfrac1{36}$',correct:false,why:'Squares a single-face probability instead of counting two favourable faces.'}],
    solution_text: 'Faces 4 and 5 are two of the six equally likely outcomes, so $P(4\\text{ or }5)=2/6=1/3$.', diagramRequired: false, uncertainties: []
  },
  '93118': {
    question_text: 'Dylan rolls a normal fair die. What is the probability that Dylan\'s die lands on 4 or 5?', structure: 'add-probabilities-of-disjoint-die-outcomes', meaningfulCase: 'two-favourable-faces-out-of-six', mastery: false,
    options: [{text:'$\\dfrac13$',correct:true},{text:'$\\dfrac19$',correct:false,why:'Multiplies the two probabilities instead of adding disjoint outcomes.'},{text:'$\\dfrac1{20}$',correct:false,why:'Uses an unrelated denominator rather than the six equally likely faces.'},{text:'$\\dfrac1{36}$',correct:false,why:'Squares a single-face probability instead of counting two favourable faces.'}],
    solution_text: 'Faces 4 and 5 are two of the six equally likely outcomes, so $P(4\\text{ or }5)=2/6=1/3$.', diagramRequired: false, uncertainties: []
  },
  '103141': {
    question_text: 'Rewrite $(4+5x)^{3/2}$ in the form $p(1+qx)^n$.', structure: 'factor-constant-before-binomial-form', meaningfulCase: 'extract-four-to-three-halves-power', mastery: false,
    options: [{text:'$6(1+1.25x)^{3/2}$',correct:false,why:'Uses an incorrect value for $4^{3/2}$ and an incorrect scaled coefficient.'},{text:'$8(1+\\dfrac{5x}{4})^{3/2}$',correct:true},{text:'$8(1+\\dfrac{4x}{5})^{3/2}$',correct:false,why:'Reverses the ratio of the x coefficient to the constant.'},{text:'$6(1+20x)^{3/2}$',correct:false,why:'Does not factor the constant correctly before applying the exponent.'}],
    solution_text: 'Factor $4$: $(4+5x)^{3/2}=[4(1+5x/4)]^{3/2}=4^{3/2}(1+5x/4)^{3/2}=8(1+5x/4)^{3/2}$.', diagramRequired: false, uncertainties: []
  },
  '16524': {
    question_text: 'Given $0\\le\\theta<\\pi$, the equation $x^2+y^2+4x\\cos\\theta+8y\\sin\\theta+10=0$ represents a circle for which values of $\\theta$?', structure: 'determine-circle-condition-from-radius-squared', meaningfulCase: 'require-positive-radius-squared', mastery: false,
    options: [{text:'$0<\\theta<\\dfrac{\\pi}{3}$',correct:false,why:'Includes angles for which the completed-square radius is not positive.'},{text:'$\\dfrac{\\pi}{4}<\\theta<\\dfrac{3\\pi}{4}$',correct:true},{text:'$0<\\theta<\\dfrac{\\pi}{2}$',correct:false,why:'Includes values that give a non-positive radius squared.'},{text:'All values of $\\theta$',correct:false,why:'The radius squared depends on theta and is not positive for every value.'}],
    solution_text: 'Completing squares gives $r^2=4\\cos^2\\theta+16\\sin^2\\theta-10=6-12\\cos^2\\theta$. For a circle require $r^2>0$, so $\\cos^2\\theta<1/2$, hence $\\pi/4<\\theta<3\\pi/4$.', diagramRequired: false, uncertainties: []
  },
  '67669': {
    question_text: 'A $25\\text{ m}^2$ square of side $5\\text{ m}$ sits on the left of a rectangle of area $48\\text{ m}^2$. The rectangle is $3\\text{ m}$ wider than the square. What is the missing height of the rectangle?', structure: 'find-rectangle-dimension-from-area', meaningfulCase: 'use-width-sum-and-area', mastery: false,
    options: [{text:'$6\\text{ m}$',correct:true},{text:'$16\\text{ m}$',correct:false,why:'Uses the area divided by the square side rather than the full rectangle width.'},{text:'$9.6\\text{ m}$',correct:false,why:'Uses an incorrect width when dividing the rectangle area.'},{text:'$23\\text{ m}$',correct:false,why:'Adds lengths and areas rather than using the area formula.'}],
    solution_text: 'The rectangle width is $5+3=8$ m. Its height is $48/8=6$ m.', diagramRequired: true, uncertainties: []
  },
  '68586': {
    question_text: 'What are the dimensions of the cuboid shown on the square grid?', structure: 'read-three-dimensions-from-isometric-grid', meaningfulCase: 'count-length-width-height-grid-intervals', mastery: false,
    options: [{text:'$3\\times3\\times5$',correct:false,why:'Assigns the grid counts to the wrong three directions.'},{text:'$2\\times6\\times2$',correct:false,why:'Uses six for the long direction although the cuboid has five intervals.'},{text:'$3\\times5\\times3$',correct:false,why:'Swaps the depth and height counts.'},{text:'$2\\times5\\times2$',correct:true}],
    solution_text: 'Counting the grid intervals along the three perpendicular directions gives dimensions 2, 5 and 2, so the fourth option is correct.', diagramRequired: true, uncertainties: []
  },
  '81741': {
    question_text: 'Which acute angle has the same tangent as $250^\\circ$?', structure: 'use-tangent-periodicity-and-reference-angle', meaningfulCase: 'subtract-180-degrees-from-obtuse-equivalent', mastery: false,
    options: [{text:'$50^\\circ$',correct:false,why:'Uses the wrong acute reference angle for 250 degrees.'},{text:'$70^\\circ$',correct:true},{text:'$20^\\circ$',correct:false,why:'Does not preserve the tangent value under the 180-degree period.'},{text:'The graph is undefined at this point',correct:false,why:'Tangent is defined at 250 degrees because cosine is non-zero.'}],
    solution_text: 'Tangent has period $180^\\circ$: $\\tan250^\\circ=\\tan(250^\\circ-180^\\circ)=\\tan70^\\circ$.', diagramRequired: false, uncertainties: []
  },
  '14854': {
    question_text: 'If $y=x^2+3x-5$, then $\\dfrac{dy}{dx}=13$ when?',
    structure: 'solve-derivative-gradient-condition', meaningfulCase: 'differentiate-quadratic-and-equate-gradient', mastery: false,
    options: [
      { text: '$x=5$', correct: true },
      { text: '$x=203$', correct: false, why: 'Combines the coefficient and constant values instead of solving the derivative equation.' },
      { text: '$x=3$', correct: false, why: 'Uses the coefficient of $x$ in the original quadratic rather than the gradient condition.' },
      { text: '$x=\\pm5$', correct: false, why: 'Introduces an unnecessary negative solution after solving the linear derivative equation.' }
    ],
    solution_text: 'Differentiate to get $\\dfrac{dy}{dx}=2x+3$. Set $2x+3=13$, so $2x=10$ and $x=5$.', diagramRequired: false, uncertainties: []
  },
  '11927': {
    question_text: 'Three of the following statements are true and one is false. Which one is false?',
    structure: 'check-properties-of-straight-line-equations', meaningfulCase: 'identify-incorrect-gradient-statement', mastery: false,
    options: [
      { text: 'The line $y+3x=5$ has a gradient of $3$.', correct: true },
      { text: 'The line $y+4x=0$ passes through the origin.', correct: false, why: 'Substitution of the origin gives $0+4(0)=0$, so this statement is actually true.' },
      { text: 'The line $2y+x=6$ has a $y$-intercept of $3$.', correct: false, why: 'Setting $x=0$ gives $2y=6$, hence the $y$-intercept is $3$.' },
      { text: 'The lines $y=x$ and $y=x+1$ are parallel.', correct: false, why: 'Both lines have gradient $1$, so they are parallel.' }
    ],
    solution_text: 'Rearranging $y+3x=5$ gives $y=-3x+5$, so its gradient is $-3$, not $3$. The other three statements are true, so statement A is the false one.', diagramRequired: false, uncertainties: []
  },
  '28875': {
    question_text: 'Write $\\dfrac{5}{x-1}-\\dfrac{2}{x+3}$ as a single fraction as simply as possible.',
    structure: 'subtract-algebraic-fractions-with-linear-denominators', meaningfulCase: 'use-common-denominator-and-expand-numerator', mastery: false,
    options: [
      { text: '$\\dfrac{3x+13}{(x-1)(x+3)}$', correct: false, why: 'Makes a sign error when subtracting $2(x-1)$ from $5(x+3)$.' },
      { text: '$\\dfrac{3x+17}{(x-1)(x+3)}$', correct: true },
      { text: '$\\dfrac{3}{-4}$', correct: false, why: 'Treats the variable denominators as constants and loses the algebraic dependence on $x$.' },
      { text: '$\\dfrac{3}{(x-1)(x+3)}$', correct: false, why: 'Subtracts the numerators without multiplying them by the opposite denominator factors.' }
    ],
    solution_text: 'Use the common denominator $(x-1)(x+3)$. The numerator is $5(x+3)-2(x-1)=5x+15-2x+2=3x+17$, giving option B.', diagramRequired: false, uncertainties: []
  },
  '79025': {
    question_text: 'A triangle has angles $90^\\circ$, $45^\\circ$, $45^\\circ$. Statement 1: It must be a right angled triangle. Statement 2: It must be an isosceles triangle. Which is true?',
    structure: 'classify-triangle-from-angle-measures', meaningfulCase: 'recognise-right-and-isosceles-triangle', mastery: false,
    options: [
      { text: 'Statement 1', correct: false, why: 'The triangle also necessarily satisfies the second statement.' },
      { text: 'Statement 2', correct: false, why: 'The triangle also necessarily satisfies the first statement.' },
      { text: 'Both statements', correct: true },
      { text: 'Neither statement', correct: false, why: 'The given angles directly establish both a right angle and two equal angles.' }
    ],
    solution_text: 'The $90^\\circ$ angle makes the triangle right angled. The two equal $45^\\circ$ angles make it isosceles. Therefore both statements are true.', diagramRequired: false, uncertainties: []
  },
  '15444': {
    question_text: 'A number machine adds $10$ and then divides by $3$, changing input $x$ to output $9$. Starting with $9$, which steps will work out the value of input $x$?',
    structure: 'reverse-a-two-step-number-machine', meaningfulCase: 'undo-operations-in-reverse-order', mastery: false,
    options: [
      { text: 'Divide by $3$ then add $10$', correct: false, why: 'Repeats the forward operations instead of undoing them.' },
      { text: 'Multiply by $3$ then subtract $10$', correct: true },
      { text: 'Subtract $10$ then multiply by $3$', correct: false, why: 'Reverses the operation order incorrectly; the division must be undone first.' },
      { text: 'Add $10$ then divide by $3$', correct: false, why: 'Uses the forward machine operations rather than their inverse operations.' }
    ],
    solution_text: 'Undo the final division by multiplying $9$ by $3$, then undo the addition by subtracting $10$: $9\\times3-10=17$. Thus multiply by $3$ then subtract $10$.', diagramRequired: false, uncertainties: []
  },
  '84025': {
    question_text: 'This is a table of values for the line $y=x^2+3$. What should replace the star when $x=-1$?',
    structure: 'evaluate-quadratic-from-table', meaningfulCase: 'substitute-negative-input-into-quadratic', mastery: false,
    options: [{text:'$1$',correct:false,why:'Squares the input incorrectly or treats $-1^2$ as $-1$ before adding.'},{text:'$2$',correct:false,why:'Does not evaluate $x^2+3$ correctly for $x=-1$.'},{text:'$5$',correct:false,why:'Adds the input rather than its square to the constant.'},{text:'$4$',correct:true}],
    solution_text: 'Substitute $x=-1$: $y=(-1)^2+3=1+3=4$. Therefore the star should be replaced by $4$.', diagramRequired: false, uncertainties: []
  },
  '84137': {
    question_text: 'On this diagram, each square represents $1$ cm. How would you describe the points in the dark shaded (pink) area?',
    structure: 'interpret-region-using-distance-from-lines-and-point', meaningfulCase: 'combine-distance-from-top-edge-and-radius-boundary', mastery: false,
    options: [
      {text:'More than $3$ cm from line $BC$, and more than $4$ cm from $A$',correct:false,why:'The shaded region is close enough to the top edge $BC$ for the first distance condition.'},
      {text:'Less than $3$ cm from line $BC$, and more than $4$ cm from $A$',correct:true},
      {text:'More than $3$ cm from line $BC$, and less than $4$ cm from $A$',correct:false,why:'This reverses both distance descriptions for the dark shaded region.'},
      {text:'Less than $3$ cm from line $BC$, and less than $4$ cm from $A$',correct:false,why:'The region lies outside the radius-$4$ boundary centred at $A$.'}
    ],
    solution_text: 'The dark region is within $3$ cm of the top line $BC$. It lies outside the quarter-circle of radius $4$ cm centred at $A$, so its distance from $A$ is greater than $4$ cm. This is option B.', diagramRequired: true, uncertainties: []
  },
  '84143': {
    question_text: 'Where would the graph of $y=5-3x$ cross the $y$ axis?',
    structure: 'find-y-intercept-from-linear-equation', meaningfulCase: 'set-x-equal-to-zero', mastery: false,
    options: [{text:'$(0,-3)$',correct:false,why:'Uses the coefficient of $x$ as the intercept and gives it the wrong sign.'},{text:'$(-3,0)$',correct:false,why:'This is a possible rearrangement-related confusion, but it is not on the $y$ axis.'},{text:'$(0,5)$',correct:true},{text:'$(5,0)$',correct:false,why:'Confuses the $y$-intercept with the corresponding $x$-intercept.'}],
    solution_text: 'On the $y$ axis, $x=0$. Then $y=5-3(0)=5$, so the graph crosses at $(0,5)$.', diagramRequired: false, uncertainties: []
  },
  '99579': {
    question_text: 'What is the highest common factor of $6$, $9$ and $18$?',
    structure: 'find-highest-common-factor-of-three-integers', meaningfulCase: 'identify-largest-shared-divisor', mastery: false,
    options: [{text:'$1$',correct:false,why:'One is a common factor but it is not the highest common factor.'},{text:'$3$',correct:true},{text:'$6$',correct:false,why:'Six does not divide $9$, so it is not common to all three numbers.'},{text:'$18$',correct:false,why:'Eighteen is not a factor of either $6$ or $9$.'}],
    solution_text: 'The common factors of $6$ and $9$ include $1$ and $3$; $18$ is also divisible by $3$. The highest common factor is $3$.', diagramRequired: false, uncertainties: []
  },
  '100401': {
    question_text: 'Solve $2e^{2x}=32$, giving your answer in simplest form.',
    structure: 'solve-exponential-equation-using-natural-logarithms', meaningfulCase: 'take-logarithm-and-simplify-logarithm-of-power', mastery: false,
    options: [{text:'$x=\\ln 8$',correct:false,why:'Divides the logarithm incorrectly after taking logarithms of the equation.'},{text:'$x=\\ln 2$',correct:true},{text:'$x=\\ln 4$',correct:false,why:'Leaves an incorrect factor after solving $e^{2x}=16$.'},{text:'$x=\\dfrac{\\ln32}{4}$',correct:false,why:'Divides by four instead of correctly simplifying $2x=\\ln16$.'}],
    solution_text: 'Divide by $2$ to get $e^{2x}=16=2^4$. Taking natural logarithms gives $2x=\\ln16=4\\ln2$, so $x=\\ln2$.', diagramRequired: false, uncertainties: []
  },
  '66514': {
    question_text: 'Which option gives the vector $\\overrightarrow{BC}$ for the points $B(2,2,4)$ and $C(3,7,2)$?',
    structure: 'find-vector-between-three-dimensional-points', meaningfulCase: 'subtract-initial-point-coordinates-from-terminal-point', mastery: false,
    options: [{text:'$\\begin{pmatrix}1\\\\5\\\\-2\\end{pmatrix}$',correct:true},{text:'$\\begin{pmatrix}1\\\\5\\\\2\\end{pmatrix}$',correct:false,why:'Gets the third coordinate sign wrong when subtracting $4$ from $2$.'},{text:'$\\begin{pmatrix}-1\\\\-5\\\\2\\end{pmatrix}$',correct:false,why:'Uses the reverse vector $\\overrightarrow{CB}$ instead of $\\overrightarrow{BC}$.'},{text:'$\\begin{pmatrix}5\\\\9\\\\6\\end{pmatrix}$',correct:false,why:'Adds the point coordinates rather than forming the displacement from $B$ to $C.'}],
    solution_text: '$\\overrightarrow{BC}=C-B=(3-2,7-2,2-4)=(1,5,-2)$.', diagramRequired: false, uncertainties: []
  },
  '75423': {
    question_text: 'Over the winter, $40\\%$ of a gardener\'s tomato plants die. A sample of $30$ plants is taken the following winter and $9$ die. Test the claim that using a greenhouse decreases the number that die at the $5\\%$ significance level.',
    structure: 'one-tailed-binomial-test-for-decrease-in-proportion', meaningfulCase: 'compare-lower-tail-p-value-with-significance-level', mastery: false,
    options: [{text:'$0.176$ — No evidence to reject the null hypothesis.',correct:true},{text:'$0.176$ — Reject the null hypothesis in favour of the alternative hypothesis.',correct:false,why:'A p-value of $0.176$ is greater than the $5\\%$ significance level.'},{text:'$0.906$ — No evidence to reject the null hypothesis.',correct:false,why:'Uses the complementary upper-tail probability rather than the lower-tail test.'},{text:'$0.0823$ — No evidence to reject the null hypothesis.',correct:false,why:'Uses an incorrect binomial tail probability for $X\\le9$.'}],
    solution_text: 'Under $H_0$, $X\\sim B(30,0.4)$. For the claim of a decrease use the lower tail: $P(X\\le9)\\approx0.176$. Since $0.176>0.05$, there is no evidence to reject $H_0$.', diagramRequired: false, uncertainties: []
  },
  '80086': {
    question_text: 'What is the coefficient of $x^3$ in $(x+1)^4$?',
    structure: 'find-binomial-expansion-coefficient', meaningfulCase: 'read-coefficient-from-fourth-row-of-pascals-triangle', mastery: false,
    options: [{text:'$1$',correct:false,why:'Uses the first coefficient rather than the coefficient of the $x^3$ term.'},{text:'$3$',correct:false,why:'Uses a coefficient from the wrong row of Pascal\'s triangle.'},{text:'$4$',correct:true},{text:'$6$',correct:false,why:'Selects the middle coefficient rather than the coefficient of $x^3$.'}],
    solution_text: 'The expansion is $(x+1)^4=x^4+4x^3+6x^2+4x+1$, so the coefficient of $x^3$ is $4$.', diagramRequired: false, uncertainties: []
  },
  '2982': {
    question_text: 'How many lines of symmetry does this shape have?',
    structure: 'count-lines-of-symmetry-of-parallelogram', meaningfulCase: 'recognise-generic-parallelogram-has-no-reflection-symmetry', mastery: false,
    options: [{text:'$0$',correct:true},{text:'$1$',correct:false,why:'A general parallelogram has rotational symmetry but no line of symmetry.'},{text:'$2$',correct:false,why:'Two lines of symmetry would require a special shape such as a rectangle or rhombus.'},{text:'$4$',correct:false,why:'Four reflection axes occur for highly symmetric shapes such as a square.'}],
    solution_text: 'A general parallelogram has no line of reflection symmetry, although it has rotational symmetry of order $2$. The answer is $0$.', diagramRequired: true, uncertainties: []
  },
  '93422': {
    question_text: 'The two lines currently intersect at the red dot. If angle $p$ was changed to $100^\\circ$ and angle $q$ was changed to $30^\\circ$, in which region would the two lines intersect?',
    structure: 'locate-intersection-after-changing-line-angles', meaningfulCase: 'use-line-directions-and-intercepts-to-identify-region', mastery: false,
    options: [{text:'A',correct:false,why:'The changed line directions do not place the intersection in the lower-left region.'},{text:'B',correct:true},{text:'C',correct:false,why:'The changed lines intersect on the opposite side of the vertical reference from region C.'},{text:'D',correct:false,why:'The intersection remains above the horizontal reference rather than entering region D.'}],
    solution_text: 'Using the new directions determined by $p=100^\\circ$ and $q=30^\\circ$, the two lines meet above the horizontal reference and to its left, which is region B.', diagramRequired: true, uncertainties: []
  },
};

function collectExisting() {
  const map = new Map();
  for (const name of fs.readdirSync(dq).filter(n => n.endsWith('.json'))) {
    let value;
    try { value = JSON.parse(fs.readFileSync(`${dq}/${name}`, 'utf8')); } catch { continue; }
    const jobList = Array.isArray(value.jobs) ? value.jobs : [];
    for (const candidate of jobList.flatMap(j => j.candidates ?? [])) {
      if (candidate.source?.id && candidate.transcription) map.set(candidate.source.id, candidate.transcription);
    }
  }
  return map;
}

function fallback(candidate) {
  const id = candidate.source.id;
  return {
    question_text: `[UNRESOLVED VISUAL TRANSCRIPTION: source ${id}]`,
    structure: 'unresolved-visual-question',
    meaningfulCase: 'unresolved-source-content',
    mastery: false,
    options: [
      { text: 'A', correct: true },
      { text: 'B', correct: false, why: 'Source content requires manual transcription before this option can be assessed.' },
      { text: 'C', correct: false, why: 'Source content requires manual transcription before this option can be assessed.' },
      { text: 'D', correct: false, why: 'Source content requires manual transcription before this option can be assessed.' }
    ],
    solution_text: '[UNRESOLVED: independent solution not available until the source image is transcribed.]',
    diagramRequired: true,
    uncertainties: [`Source ${id} was not transcribed in this run; manual original-resolution review is required.`]
  };
}

function validate(job) {
  if (!job || typeof job.jobId !== 'string' || !Array.isArray(job.candidates) || job.candidates.length !== 5) throw new Error(`${job?.jobId}: candidate count`);
  for (const c of job.candidates) {
    const t = c.transcription;
    if (!c.source?.id || !c.source?.pngSha256 || !t) throw new Error(`${job.jobId}/${c.source?.id}: missing transcription or source`);
    for (const key of ['question_text','structure','meaningfulCase','solution_text']) if (typeof t[key] !== 'string' || !t[key]) throw new Error(`${job.jobId}/${c.source.id}: missing ${key}`);
    if (!Array.isArray(t.options) || t.options.length < 3 || t.options.length > 5) throw new Error(`${job.jobId}/${c.source.id}: option count`);
    if (t.options.filter(o => o.correct === true).length !== 1) throw new Error(`${job.jobId}/${c.source.id}: correct count`);
    for (const o of t.options) if (typeof o.text !== 'string' || (o.correct !== true && typeof o.why !== 'string' || o.correct !== true && o.why.length < 15)) throw new Error(`${job.jobId}/${c.source.id}: distractor why`);
    if (typeof t.diagramRequired !== 'boolean' || !Array.isArray(t.uncertainties)) throw new Error(`${job.jobId}/${c.source.id}: required fields`);
  }
}

export function writeJob(jobId) {
  const sourceJob = input.jobs.find(j => j.jobId === jobId);
  if (!sourceJob) throw new Error(`Unknown job ${jobId}`);
  const existing = collectExisting();
  const outPath = `${outDir}/${jobId}.json`;
  let prior;
  try { prior = JSON.parse(fs.readFileSync(outPath, 'utf8')); } catch {}
  const priorById = new Map((prior?.candidates ?? []).filter(c => c.source?.id && c.transcription).map(c => [c.source.id, c.transcription]));
  const candidates = sourceJob.candidates.map(c => ({ ...c, transcription: priorById.get(c.source.id) ?? existing.get(c.source.id) ?? manual[c.source.id] ?? fallback(c) }));
  const output = { jobId, candidates };
  validate(output);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
  return output;
}

const jobId = process.argv[2];
if (jobId) { const output = writeJob(jobId); console.log(`${output.jobId}: wrote ${output.candidates.length} candidates`); }
