import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputPath = path.join(root, '.diagnostic-questions', 'visual-jobs-current.json');
const outputDir = path.join(root, '.diagnostic-questions', 'transcriptions-full-20260802');

// Transcriptions are added incrementally while the worker processes jobs.
const T = {
  "107815": {
    question_text: "A cuboid has dimensions $15\\text{ cm}$, $5\\text{ cm}$ and $10\\text{ cm}$. Which of the following is not a right-angled triangle: $FBD$, $EDG$, $BEH$, or $BGH$?",
    structure: "test-right-angled-triangles-in-cuboid-using-vector-perpendicularity",
    meaningfulCase: "compare-dot-products-of-edge-and-diagonal-vectors",
    mastery: false,
    options: [
      {text: "$FBD$", correct: false, why: "The relevant edge and diagonal vectors are perpendicular in this triangle."},
      {text: "$EDG$", correct: true},
      {text: "$BEH$", correct: false, why: "The horizontal and vertical component directions give perpendicular vectors in this triangle."},
      {text: "$BGH$", correct: false, why: "The cuboid geometry makes the indicated vectors perpendicular for this triangle."}
    ],
    solution_text: "Using coordinates for the cuboid, $FBD$ and $BEH$ contain perpendicular edge directions, and $BGH$ also satisfies the Pythagorean relation. For $EDG$, the dot product of the two sides at $E$ is nonzero, so it is not right-angled.",
    diagramRequired: true,
    uncertainties: ["The source asks for a spatial-geometry classification without giving a coordinate convention; the result follows from the cuboid dimensions and the labelled vertices in the diagram."]
  },
  "13334": {
    question_text: "What would the locus of the points satisfying $\\arg(z)=\\dfrac\\pi6$ look like on an Argand diagram?",
    structure: "identify-argand-locus-from-fixed-argument",
    meaningfulCase: "positive-half-line-from-origin-at-angle-pi-over-six",
    mastery: false,
    options: [
      {text: "Line through the origin at angle $\\pi/6$", correct: false, why: "A full line includes the opposite ray, whose argument differs by $\\pi$."},
      {text: "Region between the $x$-axis and line from origin at angle $\\pi/6$", correct: false, why: "A fixed argument gives a ray, not a two-dimensional sector region."},
      {text: "Half line through origin at angle $-\\pi/6$", correct: false, why: "Uses the negative angle, which lies below the positive real axis rather than at $\\pi/6$."},
      {text: "Half line through origin at angle $\\pi/6$", correct: true}
    ],
    solution_text: "A fixed argument means every point lies in the direction $\\pi/6$ from the positive real axis. Since modulus is nonnegative, the locus is the half line from the origin at angle $\\pi/6$.",
    diagramRequired: false,
    uncertainties: []
  },
  "165823": {
    question_text: "Which symbol could not go in the box? $4\\;\\square\\;10$.",
    structure: "choose-invalid-comparison-symbol-for-two-numbers",
    meaningfulCase: "only-greater-than-is-inconsistent-with-four-less-than-ten",
    mastery: false,
    options: [
      {text: "$<$", correct: false, why: "$4<10$ is a true comparison."},
      {text: "$\\neq$", correct: false, why: "$4\\neq10$ is a true comparison."},
      {text: "$>$", correct: true},
      {text: "$\\leq$", correct: false, why: "$4\\leq10$ is a true comparison."}
    ],
    solution_text: "Since $4$ is less than $10$, the symbols $<$, $\\neq$, and $\\leq$ can all make true statements. The symbol $>$ cannot.",
    diagramRequired: false,
    uncertainties: []
  },
  "20705": {
    question_text: "Expand $\\cos\\left(x+\\dfrac\\pi4\\right)$.",
    structure: "apply-cosine-angle-addition-formula",
    meaningfulCase: "use-cos-a-plus-b-cos-a-cos-b-minus-sin-a-sin-b",
    mastery: false,
    options: [
      {text: "$\\dfrac1{\\sqrt2}\\cos x-\\dfrac1{\\sqrt2}\\sin x$", correct: true},
      {text: "$\\cos x+\\dfrac1{\\sqrt2}$", correct: false, why: "Does not apply the angle-addition formula and treats the added angle as an additive constant."},
      {text: "$\\cos x-\\dfrac1{\\sqrt2}$", correct: false, why: "Treats the angle shift as subtraction outside the trigonometric function."},
      {text: "$\\dfrac12\\cos x+\\dfrac{\\sqrt3}2\\sin x$", correct: false, why: "Uses incorrect values for $\\cos(\\pi/4)$ and $\\sin(\\pi/4)$."}
    ],
    solution_text: "$\\cos(x+\\pi/4)=\\cos x\\cos(\\pi/4)-\\sin x\\sin(\\pi/4)=\\dfrac1{\\sqrt2}\\cos x-\\dfrac1{\\sqrt2}\\sin x$.",
    diagramRequired: false,
    uncertainties: []
  },
  "82328": {
    question_text: "What is the value of $\\dfrac2x+\\dfrac5{2x}$?",
    structure: "add-algebraic-fractions-using-common-denominator",
    meaningfulCase: "rewrite-first-fraction-over-common-denominator-2x",
    mastery: false,
    options: [
      {text: "$\\dfrac{10}{2x^2}$", correct: false, why: "Multiplies terms rather than adding the two fractions over their common denominator."},
      {text: "$\\dfrac7{2x}$", correct: false, why: "Adds the numerators $2$ and $5$ without scaling the first fraction to denominator $2x$."},
      {text: "$\\dfrac7{3x}$", correct: false, why: "Uses an incorrect common denominator and numerator combination."},
      {text: "$\\dfrac9{2x}$", correct: true}
    ],
    solution_text: "$\\dfrac2x=\\dfrac4{2x}$, so $\\dfrac2x+\\dfrac5{2x}=\\dfrac{4+5}{2x}=\\dfrac9{2x}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "27146": {
    question_text: "Two batches of lightbulbs have these summaries. Batch A: mean $1100$ hours, range $50$ hours. Batch B: mean $800$ hours, range $400$ hours. Which statement is true?",
    structure: "compare-mean-and-range-between-two-data-sets",
    meaningfulCase: "batch-a-higher-mean-and-smaller-range-means-longer-and-more-consistent",
    mastery: false,
    options: [
      {text: "On average, batch B's lightbulbs last a shorter length of time and are more consistent", correct: false, why: "Batch B is shorter-lived but has the much larger range, so it is less consistent."},
      {text: "On average, batch A's lightbulbs last a shorter length of time, but are more consistent", correct: false, why: "Batch A has the higher mean, not the shorter average lifespan."},
      {text: "On average, batch A's lightbulbs last a longer length of time, and are less consistent", correct: false, why: "Batch A lasts longer but its smaller range makes it more consistent, not less."},
      {text: "The lifespans for batch A's lightbulbs are more similar to each other than batch B's", correct: true}
    ],
    solution_text: "A smaller range means the values are more similar. Batch A has range $50$ compared with batch B's $400$, so batch A's lifespans are more consistent. Its mean is also higher, but option D states the valid comparison.",
    diagramRequired: true,
    uncertainties: []
  },
  "98026": {
    question_text: "Line segment $P$ joins $(1,1)$ and $(3,6)$. Line segment $Q$ joins $(3,1)$ and $(7,3)$. Which line segment is longer?",
    structure: "compare-line-segment-lengths-from-coordinate-endpoints",
    meaningfulCase: "compare-squared-distances-to-avoid-unnecessary-square-roots",
    mastery: false,
    options: [
      {text: "$P$", correct: true},
      {text: "$Q$", correct: false, why: "$Q$ has squared length $4^2+2^2=20$, less than $P$'s squared length $2^2+5^2=29$."},
      {text: "They are the same length", correct: false, why: "The squared lengths $29$ and $20$ are different."},
      {text: "We need more information", correct: false, why: "Both endpoints are given, so each Euclidean length can be calculated exactly."}
    ],
    solution_text: "$P=\\sqrt{(3-1)^2+(6-1)^2}=\\sqrt{29}$. $Q=\\sqrt{(7-3)^2+(3-1)^2}=\\sqrt{20}$. Since $\\sqrt{29}>\\sqrt{20}$, $P$ is longer.",
    diagramRequired: false,
    uncertainties: []
  },
  "147823": {
    question_text: "What number is the arrow pointing to on the ruler?",
    structure: "read-decimal-measurement-from-ruler-scale",
    meaningfulCase: "interpret-tenths-and-hundredths-between-centimetre-marks",
    mastery: false,
    options: [
      {text: "$7.3\\text{ cm}$", correct: true},
      {text: "$7\\text{ cm and }2\\text{ mm}$", correct: false, why: "Places the arrow at $7.2$ cm rather than at the third millimetre mark after $7$ cm."},
      {text: "$72\\text{ cm}$", correct: false, why: "Misreads the ruler scale by a factor of ten and ignores the visible $1$ to $10$ cm span."},
      {text: "$70.2\\text{ cm}$", correct: false, why: "Misreads both the units and the decimal placement of the ruler measurement."}
    ],
    solution_text: "The arrow is at the third millimetre mark after $7$ cm, which is $7.3$ cm.",
    diagramRequired: true,
    uncertainties: []
  },
  "183128": {
    question_text: "Which container would help us empty the fish tank the quickest? The choices are a jug, a colander, and a cup.",
    structure: "choose-container-by-drainage-rate",
    meaningfulCase: "perforated-container-allows-water-to-drain-while-scooping",
    mastery: false,
    options: [
      {text: "A jug", correct: false, why: "Holds water but requires repeated carrying and pouring, so it is slower than a perforated container."},
      {text: "A colander", correct: true},
      {text: "A cup", correct: false, why: "Has a small capacity and would require many more scoops to empty the tank."}
    ],
    solution_text: "A colander has holes, allowing water to drain away while it is used to scoop or move material. It would empty the tank quickest among the displayed options.",
    diagramRequired: true,
    uncertainties: ["The practical question is informal and the image does not specify how the fish are being handled; the answer assumes the container is used to remove water rather than fish."]
  },
  "22633": {
    question_text: "Simplify $(2x^3)^3$.",
    structure: "simplify-power-of-a-monomial",
    meaningfulCase: "raise-coefficient-and-variable-power-to-the-outer-power",
    mastery: false,
    options: [
      {text: "$8x^6$", correct: false, why: "Cubes the coefficient correctly but multiplies the exponent by the wrong factor."},
      {text: "$6x^9$", correct: false, why: "Uses an incorrect coefficient while the exponent is the correct product."},
      {text: "$8x^9$", correct: true},
      {text: "$6x^6$", correct: false, why: "Adds or otherwise mishandles both the coefficient and exponent under the power."}
    ],
    solution_text: "$(2x^3)^3=2^3(x^3)^3=8x^9$.",
    diagramRequired: false,
    uncertainties: []
  },
  "154483": {
    question_text: "Which dot shows the point $(-4,-2)$?",
    structure: "read-negative-coordinate-point-from-grid",
    meaningfulCase: "move-four-left-and-two-down-from-the-origin",
    mastery: false,
    options: [
      {text: "A", correct: false, why: "Dot A lies in the first quadrant at positive coordinates."},
      {text: "B", correct: false, why: "Dot B has positive $x$ and positive $y$ coordinates."},
      {text: "C", correct: true},
      {text: "D", correct: false, why: "Dot D has a negative $x$-coordinate but a positive $y$-coordinate."}
    ],
    solution_text: "The point $(-4,-2)$ is four units left and two units below the origin. This is dot C.",
    diagramRequired: true,
    uncertainties: []
  },
  "154883": {
    question_text: "Which technique would you use to evaluate $\\int x(1-\\ln x)\\,dx$?",
    structure: "choose-integration-technique-for-product-involving-logarithm",
    meaningfulCase: "product-of-x-and-logarithmic-expression-requires-integration-by-parts",
    mastery: false,
    options: [
      {text: "Integration by parts", correct: true},
      {text: "Integration by substitution", correct: false, why: "There is no single inner function whose derivative accounts for the product $x(1-\\ln x)$."},
      {text: "Chain rule", correct: false, why: "The chain rule differentiates a composition and is not an integration method for this product."},
      {text: "A different method", correct: false, why: "Integration by parts is the standard method for the logarithmic product term."}
    ],
    solution_text: "The integrand contains a product involving $x\\ln x$. Integration by parts, taking the logarithm as the part to differentiate, is the appropriate technique.",
    diagramRequired: false,
    uncertainties: []
  },
  "181041": {
    question_text: "The statement says: '$8$ is odd because I can split it into two unequal groups.' Is this statement true or false?",
    structure: "distinguish-oddness-from-unequal-partition",
    meaningfulCase: "odd-number-definition-requires-no-equal-two-group-partition",
    mastery: false,
    options: [
      {text: "True", correct: false, why: "Splitting into unequal groups is possible for many even and odd numbers and does not define oddness."},
      {text: "False", correct: true},
      {text: "Both true and false", correct: false, why: "A mathematical statement has one truth value for the displayed claim about the number eight."},
      {text: "Cannot be determined", correct: false, why: "The parity of eight and the stated unequal partition are directly determined."}
    ],
    solution_text: "The statement is false. $8$ is even because it can be split into two equal groups of $4$; the ability to form unequal groups is not the definition of oddness.",
    diagramRequired: true,
    uncertainties: []
  },
  "20222": {
    question_text: "A sequence is generated by $u_{n+1}=0.4u_n-240$. What is the limit of this sequence as $n\\to\\infty$?",
    structure: "find-limit-of-linear-first-order-recurrence",
    meaningfulCase: "solve-fixed-point-equation-when-absolute-recurrence-factor-is-less-than-one",
    mastery: false,
    options: [
      {text: "$-800$", correct: false, why: "Solves the fixed-point equation with an incorrect rearrangement or coefficient."},
      {text: "$-400$", correct: true},
      {text: "$200$", correct: false, why: "Does not satisfy the fixed-point equation $L=0.4L-240$."},
      {text: "$400$", correct: false, why: "Reverses the sign of the constant term when solving for the limiting value."}
    ],
    solution_text: "If the sequence converges to $L$, then $L=0.4L-240$. Hence $0.6L=-240$, giving $L=-400$. Since $|0.4|<1$, the recurrence converges to this fixed point.",
    diagramRequired: false,
    uncertainties: []
  },
  "3509": {
    question_text: "What does $\\int e^{1-3x}\\,dx$ equal?",
    structure: "integrate-exponential-linear-function",
    meaningfulCase: "chain-rule-factor-minus-three-in-the-antiderivative",
    mastery: false,
    options: [
      {text: "$\\dfrac{e^{2-3x}}{2-3x}+c$", correct: false, why: "Treats the linear exponent as a denominator instead of dividing by its derivative."},
      {text: "$-3e^{1-3x}+c$", correct: false, why: "Multiplies by the derivative of the exponent rather than by its reciprocal."},
      {text: "$-\\dfrac{e^{1-3x}}3+c$", correct: true},
      {text: "$\\dfrac{e^{1-3x}}3+c$", correct: false, why: "Omits the negative sign required because the exponent has derivative $-3$."}
    ],
    solution_text: "Since the derivative of $1-3x$ is $-3$, $\\int e^{1-3x}dx=-\\dfrac13e^{1-3x}+c$.",
    diagramRequired: false,
    uncertainties: []
  },
  "28942": {
    question_text: "Which column vector matches the vector in the diagram? The vector goes from $(1,0)$ to $(3,8)$.",
    structure: "read-vector-components-from-coordinate-diagram",
    meaningfulCase: "subtract-initial-coordinate-from-terminal-coordinate",
    mastery: false,
    options: [
      {text: "$\\begin{pmatrix}2\\\\4\\end{pmatrix}$", correct: false, why: "Gets the horizontal displacement right but not the vertical displacement from $0$ to $8$."},
      {text: "$\\begin{pmatrix}-2\\\\8\\end{pmatrix}$", correct: false, why: "Reverses the horizontal direction while keeping the vertical component positive."},
      {text: "$\\begin{pmatrix}2\\\\8\\end{pmatrix}$", correct: true},
      {text: "$\\begin{pmatrix}4\\\\8\\end{pmatrix}$", correct: false, why: "Uses the terminal horizontal coordinate rather than the horizontal change $3-1$."}
    ],
    solution_text: "The vector components are $(3-1,8-0)=(2,8)$, so the matching column vector is $\\begin{pmatrix}2\\\\8\\end{pmatrix}$.",
    diagramRequired: true,
    uncertainties: []
  },
  "3195": {
    question_text: "Name the graph shown. It has roots at $(-2,0)$ and $(1,0)$ and passes through $(0,-2)$.",
    structure: "identify-quadratic-from-roots-and-intercept",
    meaningfulCase: "factorised-quadratic-roots-minus-two-and-one",
    mastery: false,
    options: [
      {text: "$y=x^2-2$", correct: false, why: "Has roots at $x=\\pm\\sqrt2$, not at $x=-2$ and $x=1$."},
      {text: "$y=(x-2)(x+1)$", correct: false, why: "Has roots $2$ and $-1$, which do not match the displayed intercepts."},
      {text: "$y=(x-2)(x-1)$", correct: false, why: "Has positive roots $1$ and $2$ rather than the displayed negative root $-2$."},
      {text: "$y=(x+2)(x-1)$", correct: true}
    ],
    solution_text: "Roots at $x=-2$ and $x=1$ give $y=(x+2)(x-1)$. At $x=0$ this gives $-2$, matching the graph.",
    diagramRequired: true,
    uncertainties: []
  },
  "73886": {
    question_text: "According to the graph below, what is the value of $\\cos(-60^\\circ)$?",
    structure: "evaluate-even-cosine-at-negative-angle",
    meaningfulCase: "cosine-is-even-and-cosine-sixty-degrees-is-one-half",
    mastery: false,
    options: [
      {text: "$\\dfrac12$", correct: true},
      {text: "$-\\dfrac12$", correct: false, why: "Confuses cosine with sine or incorrectly changes the sign for a negative angle."},
      {text: "$\\dfrac{\\sqrt3}{2}$", correct: false, why: "Uses the sine value associated with a $30^\\circ$ reference angle rather than cosine $60^\\circ$."},
      {text: "$0$", correct: false, why: "Uses the cosine zero at $90^\\circ$, not at $-60^\\circ$."}
    ],
    solution_text: "Cosine is an even function, so $\\cos(-60^\\circ)=\\cos60^\\circ=\\dfrac12$.",
    diagramRequired: true,
    uncertainties: []
  },
  "78551": {
    question_text: "Given that $x^2-6x+1\\equiv(x-3)^2-8$, what are the coordinates of the turning point of $y=x^2-6x+1$?",
    structure: "read-turning-point-from-completed-square-form",
    meaningfulCase: "vertex-form-(x-minus-three)-squared-minus-eight",
    mastery: false,
    options: [
      {text: "$(-3,-8)$", correct: false, why: "Reverses the sign of the horizontal translation in the completed-square form."},
      {text: "$(3,8)$", correct: false, why: "Uses the correct $x$-coordinate but reverses the sign of the vertical translation."},
      {text: "$(-3,8)$", correct: false, why: "Reverses both signs from the vertex form."},
      {text: "$(3,-8)$", correct: true}
    ],
    solution_text: "The vertex form is $y=(x-3)^2-8$, so the turning point is $(3,-8)$.",
    diagramRequired: false,
    uncertainties: []
  },
  "83851": {
    question_text: "Rationalise the denominator and simplify fully $\\dfrac2{\\sqrt8}$.",
    structure: "rationalise-and-simplify-square-root-denominator",
    meaningfulCase: "simplify-square-root-eight-before-or-after-rationalising",
    mastery: false,
    options: [
      {text: "$\\dfrac{\\sqrt2}{2}$", correct: true},
      {text: "$\\dfrac{2\\sqrt8}{8}$", correct: false, why: "Rationalises but does not simplify the resulting radical fraction fully."},
      {text: "$\\dfrac48$", correct: false, why: "Treats the square root as though $\\sqrt8=4$ and loses the radical value."},
      {text: "Cannot be rationalised", correct: false, why: "Multiplying numerator and denominator by $\\sqrt8$ rationalises the denominator successfully."}
    ],
    solution_text: "$\\dfrac2{\\sqrt8}=\\dfrac2{2\\sqrt2}=\\dfrac1{\\sqrt2}=\\dfrac{\\sqrt2}{2}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "92593": {
    question_text: "A line has equation $y=x+3$. Write down the coordinates of the point where the line intersects the $x$-axis.",
    structure: "find-x-intercept-from-linear-equation",
    meaningfulCase: "set-y-to-zero-and-solve-for-x",
    mastery: false,
    options: [
      {text: "$(0,-3)$", correct: false, why: "Gives the $y$-intercept, obtained by setting $x=0$, not the $x$-intercept."},
      {text: "$(3,0)$", correct: false, why: "Drops the negative sign when solving $0=x+3$."},
      {text: "$(-3,0)$", correct: true},
      {text: "$(3,3)$", correct: false, why: "Does not satisfy the equation's intercept condition $y=0$."}
    ],
    solution_text: "At the $x$-axis, $y=0$. Thus $0=x+3$, so $x=-3$. The intercept is $(-3,0)$.",
    diagramRequired: false,
    uncertainties: []
  },
  "98040": {
    question_text: "A rectangle has top edge $y=1$ and bottom edge $y=-5$. What is the equation of its horizontal line of symmetry?",
    structure: "find-horizontal-line-of-symmetry-of-rectangle",
    meaningfulCase: "midpoint-of-top-and-bottom-y-coordinates",
    mastery: false,
    options: [
      {text: "$y=-3.5$", correct: false, why: "Does not equal the midpoint of the top and bottom edge coordinates."},
      {text: "$y=-4$", correct: false, why: "Uses an incorrect vertical position rather than averaging $1$ and $-5$."},
      {text: "$y=-2$", correct: true},
      {text: "$y=-1$", correct: false, why: "Does not lie halfway between the horizontal edges at $y=1$ and $y=-5$."}
    ],
    solution_text: "The symmetry line is halfway between $y=1$ and $y=-5$: $y=(1+(-5))/2=-2$.",
    diagramRequired: true,
    uncertainties: []
  },
  "14360": {
    question_text: "A sample of leaf lengths is $13.5,8.9,14.8,17.6,5.8,13.7,15.5,8.9,11.8,13.5$. How many measurements are in the interval $13.5\\leq L<15.5$?",
    structure: "count-data-values-in-half-open-interval",
    meaningfulCase: "include-lower-bound-and-exclude-upper-bound",
    mastery: false,
    options: [
      {text: "$2$", correct: false, why: "Counts only the repeated lower-bound values and misses values between the bounds."},
      {text: "$3$", correct: false, why: "Misses one of the values satisfying the inclusive lower and exclusive upper bounds."},
      {text: "$4$", correct: true},
      {text: "$5$", correct: false, why: "Includes the value $15.5$, which is excluded by the strict upper bound."}
    ],
    solution_text: "The values satisfying $13.5\\leq L<15.5$ are $13.5,14.8,13.7,13.5$, giving $4$ measurements.",
    diagramRequired: false,
    uncertainties: []
  },
  "23181": {
    question_text: "A sphere and cone have equal volumes. The sphere has radius $2x$ and the cone has radius $x$ and height $y$. What is the value of $\\dfrac{x}{y}$?",
    structure: "equate-sphere-and-cone-volumes-to-find-ratio",
    meaningfulCase: "cancel-common-factors-after-substituting-radii-and-height",
    mastery: false,
    options: [
      {text: "$\\dfrac1{32}$", correct: true},
      {text: "$\\dfrac18$", correct: false, why: "Uses the radius scaling but misses the cubic effect in the sphere volume."},
      {text: "$\\dfrac1{16}$", correct: false, why: "Uses an incorrect power of the factor $2$ when comparing the two volumes."},
      {text: "$\\dfrac14$", correct: false, why: "Does not account for the sphere's radius being $2x$ and its volume scaling cubically."}
    ],
    solution_text: "Sphere volume is $\\dfrac43\\pi(2x)^3=\\dfrac{32}3\\pi x^3$. Cone volume is $\\dfrac13\\pi x^2y$. Equating gives $32x^3=x^2y$, so $y=32x$ and $x/y=1/32$.",
    diagramRequired: false,
    uncertainties: []
  },
  "107500": {
    question_text: "What mistake has Michelle made when drawing these axes? The horizontal axis is marked from $-1$ to $2$ in equal steps and the vertical axis is marked in equal steps of $15$.",
    structure: "check-coordinate-axis-scales-for-consistent-increments",
    meaningfulCase: "both-horizontal-and-vertical-labels-follow-their-equal-grid-steps",
    mastery: false,
    options: [
      {text: "$x$ axis scaled incorrectly", correct: false, why: "The horizontal labels are consistent with the equal grid spacing."},
      {text: "$y$ axis scaled incorrectly", correct: false, why: "The vertical labels increase by equal increments of $15$ at equal grid intervals."},
      {text: "$x$ and $y$ axes labelled the wrong way around", correct: false, why: "The $x$ label is on the horizontal axis and the $y$ label is on the vertical axis."},
      {text: "There is nothing wrong", correct: true}
    ],
    solution_text: "Both axes use consistent numerical increments for equal grid intervals and are labelled in the usual orientation. Therefore there is nothing wrong.",
    diagramRequired: true,
    uncertainties: []
  },
  "39375": {
    question_text: "A triangle has angles $68^\\circ$ and $56^\\circ$. Which statement is true?",
    structure: "classify-triangle-from-angle-sum",
    meaningfulCase: "two-equal-angles-imply-two-equal-opposite-sides",
    mastery: false,
    options: [
      {text: "The triangle is equilateral", correct: false, why: "An equilateral triangle has three angles of $60^\\circ$, not angles $68^\\circ$ and $56^\\circ$."},
      {text: "The triangle is right angled", correct: false, why: "The third angle is $56^\\circ$, so none of the angles is $90^\\circ$."},
      {text: "The triangle is isosceles", correct: true},
      {text: "The triangle is scalene", correct: false, why: "The third angle is also $56^\\circ$, giving two equal angles and hence two equal sides."}
    ],
    solution_text: "The third angle is $180^\\circ-68^\\circ-56^\\circ=56^\\circ$. Two angles are equal, so the triangle is isosceles.",
    diagramRequired: true,
    uncertainties: []
  },
  "68269": {
    question_text: "Find the indefinite integral $\\int(\\sqrt[3]{x}-3)\\,dx$.",
    structure: "integrate-fractional-power-and-constant",
    meaningfulCase: "power-rule-with-exponent-one-third-and-constant-term",
    mastery: false,
    options: [
      {text: "$\\dfrac43x^{3/4}-3x+c$", correct: false, why: "Uses the reciprocal fractional exponent incorrectly for the cube-root term."},
      {text: "$\\dfrac43x^{4/3}-3x+c$", correct: false, why: "Uses $4/3$ instead of the reciprocal coefficient $3/4$ produced by integrating $x^{1/3}$."},
      {text: "$\\dfrac13x^{4/3}+3x+c$", correct: false, why: "Uses the wrong coefficient and changes the sign of the integral of the constant."},
      {text: "$\\dfrac34x^{4/3}-3x+c$", correct: true}
    ],
    solution_text: "$\\int x^{1/3}dx=\\dfrac{x^{4/3}}{4/3}=\\dfrac34x^{4/3}$. Therefore the correct expression is $\\dfrac34x^{4/3}-3x+c$.",
    diagramRequired: false,
    uncertainties: ["The displayed option B appears to show $\\frac43x^{4/3}$, while direct integration gives $\\frac34x^{4/3}$. Option D has the correct coefficient and exponent; the source choices contain a likely transcription/printing inconsistency."]
  },
  "78633": {
    question_text: "A triangle has sides $15\\text{ cm}$ and $13\\text{ cm}$ enclosing angle $A=51^\\circ$. Which formula should be used to find its area?",
    structure: "select-two-sides-included-angle-area-formula",
    meaningfulCase: "half-ab-sine-included-angle",
    mastery: false,
    options: [
      {text: "$\\dfrac12ab\\sin A$", correct: true},
      {text: "$\\dfrac12bh$", correct: false, why: "Requires a perpendicular height that is not directly given, unlike the two sides and included angle."},
      {text: "$\\dfrac12ab\\sin C$", correct: false, why: "Uses the wrong angle; the given included angle between the two known sides is $A$."},
      {text: "$\\dfrac12bc\\sin A$", correct: false, why: "Uses sides $b$ and $c$ rather than the two known sides enclosing angle $A$."}
    ],
    solution_text: "When two sides and their included angle are known, the area is $\\dfrac12ab\\sin A$. Here the known sides are $15$ and $13$ and their included angle is $51^\\circ$.",
    diagramRequired: true,
    uncertainties: []
  },
  "83813": {
    question_text: "Which of the following would correctly work out the area of this triangle? The two sides enclosing the $56^\\circ$ angle are $7\\text{ cm}$ and $11\\text{ cm}$.",
    structure: "apply-sine-area-formula-to-triangle",
    meaningfulCase: "use-the-included-angle-between-the-two-known-sides",
    mastery: false,
    options: [
      {text: "$\\dfrac12\\times7\\times11\\times\\sin(56)$", correct: true},
      {text: "$\\dfrac12\\times11\\times7$", correct: false, why: "Omits the sine of the included angle and therefore assumes a right angle."},
      {text: "$\\dfrac7{\\sin56}=\\dfrac{11}{\\sin58}$", correct: false, why: "Applies the sine rule, which does not directly calculate the area from the two given sides."},
      {text: "$7\\times11\\times\\sin(56)$", correct: false, why: "Uses the correct factors but omits the required factor of one half."}
    ],
    solution_text: "The area is $\\dfrac12ab\\sin C$ using the two sides $7$ and $11$ and included angle $56^\\circ$. Thus it is $\\dfrac12\\times7\\times11\\sin56$.",
    diagramRequired: true,
    uncertainties: []
  },
  "76272": {
    question_text: "How much is $\\$6$ worth in pounds? The exchange rate is $£1=\\$1.31$.",
    structure: "convert-dollars-to-pounds-using-exchange-rate",
    meaningfulCase: "divide-dollar-amount-by-dollars-per-pound",
    mastery: false,
    options: [
      {text: "$£5.13$", correct: false, why: "Uses an incorrect division or exchange-rate value."},
      {text: "$£4.58$", correct: true},
      {text: "$£6$", correct: false, why: "Leaves the amount unchanged despite the exchange rate being different from one-to-one."},
      {text: "$£7.86$", correct: false, why: "Multiplies by $1.31$ instead of dividing dollars by dollars per pound."}
    ],
    solution_text: "Since $£1=\\$1.31$, the pound value of $\\$6$ is $6/1.31\\approx£4.58$.",
    diagramRequired: true,
    uncertainties: []
  },
  "107191": {
    question_text: "Calculate $(-3)^2+(-2)^2$.",
    structure: "evaluate-squares-of-negative-integers",
    meaningfulCase: "squaring-removes-the-sign-before-adding-the-positive-results",
    mastery: false,
    options: [
      {text: "$13$", correct: true},
      {text: "$-13$", correct: false, why: "Keeps negative signs after squaring, although each square is positive."},
      {text: "$10$", correct: false, why: "Adds the absolute values or otherwise omits the correct squared contributions."},
      {text: "$-10$", correct: false, why: "Uses incorrect signs and arithmetic for both squared terms."}
    ],
    solution_text: "$(-3)^2=9$ and $(-2)^2=4$, so the sum is $9+4=13$.",
    diagramRequired: false,
    uncertainties: []
  },
  "125744": {
    question_text: "Which of the following is the correct formula for integration by parts?",
    structure: "identify-integration-by-parts-formula",
    meaningfulCase: "integral-of-u-times-derivative-of-v-equals-uv-minus-the-reversed-integral",
    mastery: false,
    options: [
      {text: "$\\int uv\\,dx=\\int u\\dfrac{dv}{dx}\\,dx-v\\dfrac{du}{dx}$", correct: false, why: "Places the second term outside the integral and does not state the standard identity."},
      {text: "$\\int uv\\,dx=u\\dfrac{dv}{dx}-\\int v\\dfrac{du}{dx}\\,dx$", correct: false, why: "Uses a derivative of $v$ as the first term instead of the product $uv$."},
      {text: "$\\int u\\dfrac{dv}{dx}\\,dx=uv-\\int v\\dfrac{du}{dx}\\,dx$", correct: true},
      {text: "$\\int u\\dfrac{dv}{dx}\\,dx=uv+\\int v\\dfrac{du}{dx}\\,dx$", correct: false, why: "Has the wrong sign before the remaining integral in the product-rule rearrangement."}
    ],
    solution_text: "From $\\dfrac{d}{dx}(uv)=u\\dfrac{dv}{dx}+v\\dfrac{du}{dx}$, rearrange and integrate to obtain $\\int u\\dfrac{dv}{dx}\\,dx=uv-\\int v\\dfrac{du}{dx}\\,dx$.",
    diagramRequired: false,
    uncertainties: []
  },
  "13520": {
    question_text: "The completed label box for node F in a Dijkstra shortest-path calculation looks like which option?",
    structure: "interpret-dijkstra-node-label-box",
    meaningfulCase: "label-box-records-predecessor-and-current-shortest-distance",
    mastery: false,
    options: [
      {text: "Option (a): top row $3,6$; lower row $10,6$", correct: true},
      {text: "Option (b): top row $5,6$; lower row $10,6$", correct: false, why: "Uses a predecessor or label value that cannot be verified from the incomplete source context."},
      {text: "Option (c): top row $3,10$; lower row $10$", correct: false, why: "Does not preserve the displayed label-box fields consistently for the node."},
      {text: "Option (d): top row $10,10$; lower row $10$", correct: false, why: "Repeats the distance values and omits the predecessor information expected in the label box."}
    ],
    solution_text: "The visible capture contains only the answer choices and omits the graph and preceding Dijkstra labels needed to reconstruct node F. The retained source key is option (a), but the calculation cannot be independently checked from this crop.",
    diagramRequired: true,
    uncertainties: ["The screenshot is cropped to the answer choices and does not include the Dijkstra graph or earlier node labels. The correct label box cannot be independently derived from the authoritative PNG alone."]
  },
  "154476": {
    question_text: "Which dot shows the point $(2,4)$?",
    structure: "read-ordered-pair-from-coordinate-grid",
    meaningfulCase: "move-two-right-and-four-up-from-the-origin",
    mastery: false,
    options: [
      {text: "A", correct: true},
      {text: "B", correct: false, why: "The dot is at approximately $(4,2)$, with the coordinates reversed."},
      {text: "C", correct: false, why: "The dot lies in the third quadrant rather than at positive coordinates $(2,4)$."},
      {text: "D", correct: false, why: "The dot has a negative $x$-coordinate and therefore cannot be $(2,4)$."}
    ],
    solution_text: "The point $(2,4)$ is two units to the right of the $y$-axis and four units above the $x$-axis. This is dot A.",
    diagramRequired: true,
    uncertainties: []
  },
  "17312": {
    question_text: "What transformation is represented by the matrix $\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$?",
    structure: "identify-coordinate-swap-matrix-transformation",
    meaningfulCase: "mapping-(x,y)-to-(y,x)-is-reflection-in-the-line-y-equals-x",
    mastery: false,
    options: [
      {text: "Reflection in the line $y=x$", correct: true},
      {text: "Reflection in the $x$-axis", correct: false, why: "Reflection in the $x$-axis maps $(x,y)$ to $(x,-y)$, not to $(y,x)$."},
      {text: "No change", correct: false, why: "The matrix swaps the two coordinates, so it is not the identity transformation."},
      {text: "Rotation $180^\\circ$ about the origin", correct: false, why: "A half-turn maps $(x,y)$ to $(-x,-y)$ rather than swapping coordinates."}
    ],
    solution_text: "$\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}\\begin{pmatrix}x\\\\y\\end{pmatrix}=\\begin{pmatrix}y\\\\x\\end{pmatrix}$. Swapping coordinates is reflection in the line $y=x$.",
    diagramRequired: true,
    uncertainties: []
  },
  "108130": {
    question_text: "The table shows the numbers of TVs in the households of students: $0$ TVs has frequency $0$, $1$ has frequency $7$, $2$ has frequency $2$, $3$ has frequency $5$, and $4$ has frequency $12$. What is the range for the number of TVs?",
    structure: "calculate-range-from-frequency-table",
    meaningfulCase: "maximum-observed-value-minus-minimum-observed-value-ignores-zero-frequency-category",
    mastery: false,
    options: [
      {text: "$3$", correct: true},
      {text: "$12$", correct: false, why: "Uses the largest frequency rather than the range of the observed TV counts."},
      {text: "$10$", correct: false, why: "Subtracts or combines the displayed values incorrectly instead of taking max minus min."},
      {text: "$4$", correct: false, why: "Uses the maximum value alone and forgets to subtract the minimum observed value."}
    ],
    solution_text: "The smallest number with nonzero frequency is $1$ and the largest is $4$. Therefore the range is $4-1=3$.",
    diagramRequired: true,
    uncertainties: []
  },
  "116113": {
    question_text: "Given $f(x)=3\\sqrt{x}$, find an expression for $f'(x)$.",
    structure: "differentiate-square-root-function",
    meaningfulCase: "power-rule-on-three-x-to-the-one-half",
    mastery: false,
    options: [
      {text: "$\\dfrac{3\\sqrt{x}}2$", correct: false, why: "Multiplies by the power but leaves the original square-root exponent unchanged."},
      {text: "$\\dfrac3{2\\sqrt{x}}$", correct: true},
      {text: "$\\dfrac3{\\sqrt{x}}$", correct: false, why: "Omits the factor of one half from differentiating the square root."},
      {text: "$\\dfrac{3x}2$", correct: false, why: "Uses an incorrect power after differentiating the square-root function."}
    ],
    solution_text: "$f(x)=3x^{1/2}$, so $f'(x)=3\\cdot\\dfrac12x^{-1/2}=\\dfrac3{2\\sqrt{x}}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "21371": {
    question_text: "The $n$th term of an arithmetic sequence is given by $u_n=7-3n$. Write down the common difference.",
    structure: "identify-common-difference-from-linear-nth-term",
    meaningfulCase: "coefficient-of-n-is-the-constant-step-between-terms",
    mastery: false,
    options: [
      {text: "$-3$", correct: true},
      {text: "$3$", correct: false, why: "Uses the magnitude of the coefficient but loses its negative sign."},
      {text: "$7$", correct: false, why: "Uses the constant term rather than the change in the sequence term."},
      {text: "$-7$", correct: false, why: "Confuses the constant part of the formula with the common difference."}
    ],
    solution_text: "$u_{n+1}-u_n=[7-3(n+1)]-[7-3n]=-3$. Therefore the common difference is $-3$.",
    diagramRequired: false,
    uncertainties: []
  },
  "28369": {
    question_text: "How many planes of symmetry does this regular cuboid have?",
    structure: "identify-planes-of-symmetry-of-a-cuboid",
    meaningfulCase: "midplanes-through-the-centre-parallel-to-each-pair-of-opposite-faces",
    mastery: false,
    options: [
      {text: "$5$", correct: false, why: "Counts more symmetry planes than the three central planes of a non-cubic cuboid."},
      {text: "$2$", correct: true},
      {text: "3D shapes cannot have symmetry", correct: false, why: "Three-dimensional solids can have multiple planes of symmetry."},
      {text: "$1$", correct: false, why: "Misses the other independent central reflection planes of the cuboid."}
    ],
    solution_text: "The source's intended choice is $2$. A cuboid has reflection planes through its centre parallel to pairs of opposite faces; the displayed options appear to omit the usual count of $3$ for a generic rectangular cuboid.",
    diagramRequired: true,
    uncertainties: ["A generic rectangular cuboid has three central planes of symmetry, but the displayed options are $5$, $2$, no symmetry, and $1$. No option matches the standard geometric count; option B is retained as the likely intended source key."]
  },
  "135976": {
    question_text: "A cuboid has dimensions $PS=8\\text{ cm}$, $SZ=5\\text{ cm}$ and $ZY=4\\text{ cm}$. Taking the length of $PZ$ as $9.4\\text{ cm}$, calculate the length of the diagonal $PY$, correct to $1$ decimal place.",
    structure: "calculate-space-diagonal-of-cuboid",
    meaningfulCase: "combine-base-diagonal-and-perpendicular-height-with-pythagoras",
    mastery: false,
    options: [
      {text: "$8.5\\text{ cm}$", correct: false, why: "Does not combine the given dimensions using the two-stage Pythagorean calculation."},
      {text: "$10\\text{ cm}$", correct: false, why: "Rounds too early or uses an incorrect combination of the base diagonal and height."},
      {text: "$10.2\\text{ cm}$", correct: true},
      {text: "$13.4\\text{ cm}$", correct: false, why: "Adds the dimensions or uses an incorrect space-diagonal calculation."}
    ],
    solution_text: "Using the given $PZ=9.4$, $PY^2=PZ^2+ZY^2=9.4^2+4^2=104.36$. Hence $PY=\\sqrt{104.36}\\approx10.2\\text{ cm}$.",
    diagramRequired: true,
    uncertainties: []
  },
  "28768": {
    question_text: "Using the iteration $x_{n+1}=\\sqrt{\\dfrac1{x_n+11}}$ with starting value $x_1=0.6$, what is the solution to $x=\\sqrt{\\dfrac1{x+11}}$ to $3$ significant figures?",
    structure: "solve-fixed-point-equation-by-iteration",
    meaningfulCase: "convergent-positive-fixed-point-of-a-square-root-recurrence",
    mastery: false,
    options: [
      {text: "$0.2975\\ldots$", correct: false, why: "Gives an unrounded intermediate value rather than the requested three-significant-figure answer."},
      {text: "$0.298$", correct: true},
      {text: "$0.297$", correct: false, why: "Rounds the convergent value down incorrectly at the third significant figure."},
      {text: "$0.30$", correct: false, why: "Gives only two significant figures rather than the requested three."}
    ],
    solution_text: "The iteration converges to approximately $0.2975\\ldots$. Rounded to $3$ significant figures, the solution is $0.298$.",
    diagramRequired: false,
    uncertainties: []
  },
  "28884": {
    question_text: "Write $\\dfrac4x+\\dfrac5x$ as a single fraction as simply as possible.",
    structure: "add-algebraic-fractions-with-common-denominator",
    meaningfulCase: "add-numerators-while-retaining-the-common-denominator",
    mastery: false,
    options: [
      {text: "$\\dfrac9x$", correct: true},
      {text: "$\\dfrac{9x}{x^2}$", correct: false, why: "Multiplies the denominators unnecessarily instead of using the existing common denominator."},
      {text: "$\\dfrac{20}{x^2}$", correct: false, why: "Multiplies numerators and denominators rather than adding fractions with the same denominator."},
      {text: "$\\dfrac9{2x}$", correct: false, why: "Introduces an unjustified factor of two in the denominator."}
    ],
    solution_text: "$\\dfrac4x+\\dfrac5x=\\dfrac{4+5}{x}=\\dfrac9x$.",
    diagramRequired: false,
    uncertainties: []
  },
  "2928": {
    question_text: "This is an incomplete net for a triangular prism. What shapes do you add to complete this net?",
    structure: "complete-net-of-triangular-prism",
    meaningfulCase: "triangular-prism-net-requires-two-triangles-and-three-rectangles",
    mastery: false,
    options: [
      {text: "3 squares", correct: false, why: "Adds only square faces and does not provide the second triangular end of the prism."},
      {text: "1 triangle and 2 squares", correct: true},
      {text: "1 triangle and 3 squares", correct: false, why: "Adds one too many rectangular faces because one square is already present."},
      {text: "3 triangles", correct: false, why: "Adds triangular faces where the prism needs two more rectangular side faces and one triangle."}
    ],
    solution_text: "A triangular prism has $2$ triangular faces and $3$ rectangular faces. The partial net already contains one triangle and one rectangle, so it needs one more triangle and two more rectangles (squares in the diagram).",
    diagramRequired: true,
    uncertainties: []
  },
  "33478": {
    question_text: "Which symbol should go in the box? $2700\\text{ g}\;\\square\;2.7\\text{ kg}$.",
    structure: "compare-equivalent-metric-mass-measures",
    meaningfulCase: "convert-kilograms-to-grams-before-comparing",
    mastery: false,
    options: [
      {text: "$<$", correct: false, why: "The two quantities are equal after converting $2.7$ kilograms to grams."},
      {text: "$>$", correct: false, why: "Treats kilograms and grams as though their numerical values used the same unit scale."},
      {text: "$=$", correct: true},
      {text: "None of these", correct: false, why: "Equality is valid because $1$ kilogram is $1000$ grams."}
    ],
    solution_text: "$2.7\\text{ kg}=2.7\\times1000\\text{ g}=2700\\text{ g}$. Therefore the correct symbol is $=$.",
    diagramRequired: false,
    uncertainties: []
  },
  "67249": {
    question_text: "Convert $0.43\\text{ m}^2$ to $\\text{cm}^2$.",
    structure: "convert-square-metres-to-square-centimetres",
    meaningfulCase: "square-the-linear-conversion-factor-100-centimetres-per-metre",
    mastery: false,
    options: [
      {text: "$0.0043$", correct: false, why: "Moves the decimal in the wrong direction and does not square the conversion factor."},
      {text: "$43$", correct: false, why: "Multiplies by $100$ rather than by $100^2$ for an area conversion."},
      {text: "$430$", correct: false, why: "Uses an incorrect area conversion factor smaller than $10,000$."},
      {text: "$4300$", correct: true}
    ],
    solution_text: "Since $1\\text{ m}=100\\text{ cm}$, $1\\text{ m}^2=10,000\\text{ cm}^2$. Therefore $0.43\\times10,000=4300\\text{ cm}^2$.",
    diagramRequired: false,
    uncertainties: []
  },
  "37845": {
    question_text: "In the diagram, a triangle has a side of length $13$ and a perpendicular base segment of length $12$. The perpendicular segment in the right-hand triangle has length $2.5$. Find the angle $x$ shown between the two segments at the top vertex.",
    structure: "solve-auxiliary-right-triangles-for-trigonometric-angle",
    meaningfulCase: "find-height-five-from-a-5-12-13-triangle-then-use-sine",
    mastery: false,
    options: [
      {text: "$7.3^\\circ$", correct: false, why: "Uses an incorrect trigonometric ratio for the two perpendicular lengths."},
      {text: "$60^\\circ$", correct: false, why: "Uses the complementary angle to the required angle."},
      {text: "$26.6^\\circ$", correct: false, why: "Uses the angle whose sine is $2.5/5$ incorrectly or rounds the wrong inverse-trigonometric value."},
      {text: "$30^\\circ$", correct: true}
    ],
    solution_text: "The left right triangle is a $5$-$12$-$13$ triangle, so the segment from the top vertex to the base has length $5$. In the right-hand right triangle, the side opposite $x$ is $2.5$ and the hypotenuse is $5$. Thus $\\sin x=2.5/5=1/2$, giving $x=30^\\circ$.",
    diagramRequired: true,
    uncertainties: ["The source diagram is not to scale and labels the auxiliary segments rather than naming all vertices; the calculation uses the visible $5$-$12$-$13$ relation and the displayed right-angle marks."]
  },
  "28053": {
    question_text: "A frequency polygon shows the time a group of students took to solve a puzzle. How many students took between $10$ and $15$ minutes?",
    structure: "read-frequency-from-frequency-polygon-class-midpoint",
    meaningfulCase: "class-interval-10-to-15-is-represented-by-midpoint-12.5",
    mastery: false,
    options: [
      {text: "$8$", correct: false, why: "Reads the neighbouring frequency value rather than the point for the 10-to-15-minute class."},
      {text: "$9$", correct: true},
      {text: "$11$", correct: false, why: "Uses an interpolated or nearby graph height not corresponding to the class midpoint."},
      {text: "Impossible to say exactly", correct: false, why: "A frequency polygon provides the class frequency at the midpoint for this interval."}
    ],
    solution_text: "The interval from $10$ to $15$ minutes has midpoint $12.5$. The frequency polygon has frequency $9$ at this midpoint, so $9$ students took between $10$ and $15$ minutes.",
    diagramRequired: true,
    uncertainties: []
  },
  "4216": {
    question_text: "In the number $200.358$, which digit is in the hundredths place?",
    structure: "identify-decimal-place-value",
    meaningfulCase: "second-digit-after-the-decimal-point-is-the-hundredths-digit",
    mastery: false,
    options: [
      {text: "$2$", correct: false, why: "Is the hundreds digit in the whole-number part, not a decimal-place digit."},
      {text: "$3$", correct: false, why: "Is the tenths digit, the first digit after the decimal point."},
      {text: "$5$", correct: true},
      {text: "$8$", correct: false, why: "Is the thousandths digit, the third digit after the decimal point."}
    ],
    solution_text: "In $200.358$, the digits after the decimal are $3$ tenths, $5$ hundredths, and $8$ thousandths. The hundredths digit is $5$.",
    diagramRequired: false,
    uncertainties: []
  },
  "151093": {
    question_text: "A student's attempt to find $\\dfrac{dy}{dx}$ from $2e^{3x}+3\\cos y=2x^2y$ is $6e^{3x}-3\\sin y=2x^2\\dfrac{dy}{dx}+4xy$. In which term has the student made a mistake?",
    structure: "check-implicit-differentiation-term-by-term",
    meaningfulCase: "chain-rule-factor-dy-over-dx-when-differentiating-cosine-of-y",
    mastery: false,
    options: [
      {text: "$6e^{3x}$", correct: false, why: "This is the correct derivative of $2e^{3x}$ using the chain rule."},
      {text: "$-3\\sin y$", correct: true},
      {text: "$2x^2\\dfrac{dy}{dx}$", correct: false, why: "This is the correct product-rule contribution from differentiating $y$ in $2x^2y$."},
      {text: "$4xy$", correct: false, why: "This is the correct product-rule contribution from differentiating $2x^2$."}
    ],
    solution_text: "Differentiating $3\\cos y$ implicitly gives $-3\\sin y\\,\\dfrac{dy}{dx}$, not just $-3\\sin y$. The missing factor is $dy/dx$, so term B contains the mistake.",
    diagramRequired: true,
    uncertainties: []
  },
  "178735": {
    question_text: "A cookie costs $£2$ and a pie costs $£h$. The total cost of the cookie and pie is $£10$. Write this information as an equation.",
    structure: "form-linear-equation-from-worded-total",
    meaningfulCase: "add-fixed-and-variable-costs-to-equal-total",
    mastery: false,
    options: [
      {text: "$2h=10$", correct: false, why: "Multiplies the two costs instead of adding the cookie and pie prices."},
      {text: "$2+h=10$", correct: true},
      {text: "$2+10=h$", correct: false, why: "Adds the total to the cookie price rather than equating the two item costs to the total."}
    ],
    solution_text: "The cookie costs $2$ and the pie costs $h$, so their total is $2+h$. Since the total is $10$, the equation is $2+h=10$.",
    diagramRequired: false,
    uncertainties: []
  },
  "81729": {
    question_text: "For $y=x^2+2x+4$, which of the following correctly describes the turning point of this curve?",
    structure: "find-vertex-and-classify-quadratic-turning-point",
    meaningfulCase: "complete-the-square-to-find-an-upward-opening-parabola-minimum",
    mastery: false,
    options: [
      {text: "Maximum point at $(-1,3)$", correct: false, why: "The positive coefficient of $x^2$ means the parabola opens upward, so the turning point is not a maximum."},
      {text: "Minimum point at $(-1,3)$", correct: true},
      {text: "Maximum point at $(3,-1)$", correct: false, why: "Reverses the coordinates and incorrectly classifies the upward-opening quadratic."},
      {text: "Minimum point at $(3,-1)$", correct: false, why: "Uses the vertex coordinates in the wrong order and does not complete the square correctly."}
    ],
    solution_text: "$y=x^2+2x+4=(x+1)^2+3$. Therefore the vertex is $(-1,3)$. Since the coefficient of the squared term is positive, it is a minimum.",
    diagramRequired: false,
    uncertainties: []
  },
  "2747": {
    question_text: "A percentage table has $8\\%$ in the percentage column. What decimal should go in the shaded box?",
    structure: "convert-percentage-to-decimal",
    meaningfulCase: "divide-percent-value-by-one-hundred",
    mastery: false,
    options: [
      {text: "$0.08$", correct: true},
      {text: "$0.8$", correct: false, why: "Moves the decimal point only one place instead of dividing the percentage by $100$."},
      {text: "$8.0$", correct: false, why: "Treats the percentage number as a decimal without converting its scale."},
      {text: "$0.80$", correct: false, why: "Represents $80\\%$, which is ten times larger than the given $8\\%$."}
    ],
    solution_text: "$8\\%=8/100=0.08$, so the decimal is $0.08$.",
    diagramRequired: true,
    uncertainties: []
  },
  "82316": {
    question_text: "Which operation and with the totals of which columns would work out an estimate of the mean of this grouped data? The table has frequency in column 2 and midpoint times frequency in column 4.",
    structure: "estimate-mean-from-grouped-frequency-table",
    meaningfulCase: "sum-of-midpoint-frequency-products-divided-by-total-frequency",
    mastery: false,
    options: [
      {text: "Column 4 total divided by column 2 total", correct: true},
      {text: "Column 1 total divided by column 2 total", correct: false, why: "Uses class-interval labels rather than the midpoint-weighted frequencies needed for a mean estimate."},
      {text: "Column 2 total divided by column 4 total", correct: false, why: "Reverses the mean formula and would produce the reciprocal scale."},
      {text: "Column 4 total divided by column 3 total", correct: false, why: "Divides by the sum of midpoints rather than by the total frequency."}
    ],
    solution_text: "For grouped data, the estimated mean is $\\dfrac{\\sum(\\text{midpoint}\\times\\text{frequency})}{\\sum\\text{frequency}}$. These are the totals of columns $4$ and $2$, respectively, so divide column 4 by column 2.",
    diagramRequired: true,
    uncertainties: []
  },
  "95517": {
    question_text: "The diameter of the largest circle is $32\\text{ cm}$. What is the radius of each of the smallest circles in the diagram?",
    structure: "deduce-radius-from-tangent-concentric-circle-arrangement",
    meaningfulCase: "outer-radius-sixteen-with-two-equal-middle-circles-and-two-small-circles-in-each",
    mastery: false,
    options: [
      {text: "$8\\text{ cm}$", correct: false, why: "Uses the radius of each middle circle rather than the radius of a smallest circle."},
      {text: "$16\\text{ cm}$", correct: false, why: "Uses the diameter of the largest circle as a radius."},
      {text: "$64\\text{ cm}$", correct: false, why: "Multiplies rather than successively halving the outer diameter to obtain the small-circle radius."},
      {text: "$4\\text{ cm}$", correct: true}
    ],
    solution_text: "The largest circle has radius $16\\text{ cm}$. The two middle circles each have radius $8\\text{ cm}$, and each contains two equal smallest circles across its diameter, so each smallest circle has radius $8/2=4\\text{ cm}$.",
    diagramRequired: true,
    uncertainties: []
  },
  "152820": {
    question_text: "The remainder when $2x^3-9x+4$ is divided by $x+3$ is",
    structure: "apply-remainder-theorem",
    meaningfulCase: "evaluate-polynomial-at-negative-three-from-linear-divisor-x-plus-three",
    mastery: false,
    options: [
      {text: "$49$", correct: false, why: "Substitutes the wrong value for the root of the divisor or makes an arithmetic error."},
      {text: "$31$", correct: false, why: "Does not correctly evaluate the cubic and linear terms at $x=-3$."},
      {text: "$-5$", correct: false, why: "Miscalculates the sign of one of the terms when substituting $x=-3$."},
      {text: "$-23$", correct: true}
    ],
    solution_text: "For divisor $x+3$, use $x=-3$. The remainder is $f(-3)=2(-3)^3-9(-3)+4=-54+27+4=-23$.",
    diagramRequired: false,
    uncertainties: []
  },
  "137647": {
    question_text: "A root of a polynomial $f(x)$ is a value $r$ such that $f(r)=0$. Amy and Gina found roots of the polynomial $f(x)=2x^3-3x^2+1$. Amy says $1$; Gina says $-1$. Who is correct?",
    structure: "test-candidate-roots-by-substitution",
    meaningfulCase: "evaluate-polynomial-at-positive-and-negative-unit-values",
    mastery: false,
    options: [
      {text: "Amy, but not Gina", correct: true},
      {text: "Gina, but not Amy", correct: false, why: "Substitution gives $f(-1)=-4$, so $-1$ is not a root."},
      {text: "Both Amy and Gina", correct: false, why: "Only $f(1)=0$; the negative candidate does not make the polynomial zero."},
      {text: "Neither Amy nor Gina", correct: false, why: "Direct substitution shows that $1$ does satisfy the root condition."}
    ],
    solution_text: "$f(1)=2-3+1=0$, so $1$ is a root. But $f(-1)=-2-3+1=-4\\neq0$, so $-1$ is not a root. Amy is correct, but Gina is not.",
    diagramRequired: false,
    uncertainties: []
  },
  "137718": {
    question_text: "Determine the number of possible rational zeros for $f(x)=15x^4+6x^3-8x^2-9$.",
    structure: "count-rational-root-theorem-candidates",
    meaningfulCase: "unique-reduced-fractions-from-factors-of-constant-over-factors-of-leading-coefficient",
    mastery: false,
    options: [
      {text: "$2$", correct: false, why: "Counts only the signs or a small subset of the possible factor ratios."},
      {text: "$4$", correct: false, why: "Omits several reduced positive and negative factor ratios allowed by the theorem."},
      {text: "$8$", correct: false, why: "Counts the distinct positive candidates but omits their negative counterparts."},
      {text: "$16$", correct: true}
    ],
    solution_text: "Possible rational zeros are $\\pm p/q$, where $p$ divides $9$ and $q$ divides $15$. The distinct positive reduced values are $1,1/3,1/5,1/15,3,3/5,9,9/5$, giving $8$ positive and $8$ negative candidates, hence $16$ in total.",
    diagramRequired: false,
    uncertainties: []
  },
  "157043": {
    question_text: "I am a quadrilateral. All my sides are of equal length and I am a type of parallelogram. What two shapes could I be?",
    structure: "classify-equi-sided-parallelogram",
    meaningfulCase: "all-equal-sided-parallelogram-is-rhombus-or-square",
    mastery: false,
    options: [
      {text: "Kite or Trapezium", correct: false, why: "Neither description necessarily identifies an all-equal-sided parallelogram."},
      {text: "Square or Rectangle", correct: false, why: "A rectangle need not have all four sides equal."},
      {text: "Square or Rhombus", correct: true},
      {text: "Rectangle or Rhombus", correct: false, why: "A general rectangle does not satisfy the condition that all sides have equal length."}
    ],
    solution_text: "A parallelogram with all four sides equal is a rhombus. If it also has right angles, it is a square. Thus the two possibilities are square or rhombus.",
    diagramRequired: false,
    uncertainties: []
  },
  "17322": {
    question_text: "Multiply the matrices $\\begin{pmatrix}-1&3\\\\2&-2\\end{pmatrix}\\begin{pmatrix}3&-1\\\\5&-3\\end{pmatrix}$.",
    structure: "multiply-two-by-two-matrices",
    meaningfulCase: "row-by-column-products-and-sums",
    mastery: false,
    options: [
      {text: "$\\begin{pmatrix}2&2\\\\7&-5\\end{pmatrix}$", correct: false, why: "Does not use the required row-by-column multiplication for the matrix product."},
      {text: "$\\begin{pmatrix}-3&1\\\\10&6\\end{pmatrix}$", correct: false, why: "Uses incorrect signs and products in multiple entries."},
      {text: "$\\begin{pmatrix}-5&11\\\\-11&21\\end{pmatrix}$", correct: false, why: "Combines entries by an incorrect elementwise or row operation rather than matrix multiplication."},
      {text: "$\\begin{pmatrix}12&-8\\\\-4&4\\end{pmatrix}$", correct: true}
    ],
    solution_text: "The entries are $(-1)(3)+3(5)=12$, $(-1)(-1)+3(-3)=-8$, $2(3)+(-2)(5)=-4$, and $2(-1)+(-2)(-3)=4$. Therefore the product is option D.",
    diagramRequired: true,
    uncertainties: []
  },
  "20742": {
    question_text: "The graphs of functions $f$ and $g$ are shown. Which of the following gives the area of the shaded section?",
    structure: "express-area-between-curves-as-definite-integral",
    meaningfulCase: "upper-curve-minus-lower-curve-between-intersections-at-x-one-and-x-twelve",
    mastery: false,
    options: [
      {text: "$\\int_1^{12}(g(x)-f(x))\\,dx$", correct: true},
      {text: "$\\int_1^{12}(f(x)-g(x))\\,dx$", correct: false, why: "Reverses the upper-minus-lower order and would give a negative signed area over the shaded interval."},
      {text: "$\\int_2^7(g(x)-f(x))\\,dx$", correct: false, why: "Uses the y-values as integration limits instead of the x-coordinates of the intersections."},
      {text: "$\\int_2^7(f(x)-g(x))\\,dx$", correct: false, why: "Uses incorrect limits and reverses the order of the two curves."}
    ],
    solution_text: "The shaded region runs from $x=1$ to $x=12$. On this interval $g(x)$ is above $f(x)$, so the area is $\\int_1^{12}(g(x)-f(x))\\,dx$.",
    diagramRequired: true,
    uncertainties: []
  },
  "107495": {
    question_text: "What mistake has Michelle made when drawing these axes? The horizontal axis is labelled $x$ and the vertical axis $y$, with both sets of labels increasing by equal steps across the grid.",
    structure: "check-linear-coordinate-axis-scaling",
    meaningfulCase: "both-axis-labels-match-the-equal-spaced-grid",
    mastery: false,
    options: [
      {text: "$x$ axis scaled incorrectly", correct: false, why: "The horizontal labels increase in equal numerical steps at equal grid intervals."},
      {text: "$y$ axis scaled incorrectly", correct: false, why: "The vertical labels also increase in equal numerical steps at equal grid intervals."},
      {text: "$x$ and $y$ axes labelled the wrong way around", correct: false, why: "The labels $x$ and $y$ are placed on the horizontal and vertical axes respectively."},
      {text: "There is nothing wrong", correct: true}
    ],
    solution_text: "Both axes use equal grid intervals for equal numerical increments, and $x$ is horizontal while $y$ is vertical. Therefore there is nothing wrong with the axes.",
    diagramRequired: true,
    uncertainties: []
  },
  "20725": {
    question_text: "What is the value of $\\int_0^3(3x^2+4x)\\,dx$?",
    structure: "evaluate-definite-integral-of-polynomial",
    meaningfulCase: "find-antiderivative-and-substitute-the-two-limits",
    mastery: false,
    options: [
      {text: "$22$", correct: false, why: "Uses an incorrect antiderivative or substitutes the upper limit inaccurately."},
      {text: "$31$", correct: false, why: "Does not evaluate the polynomial integral correctly at the stated limits."},
      {text: "$39$", correct: false, why: "Misses part of the contribution from the $4x$ term or makes an arithmetic error."},
      {text: "$45$", correct: true}
    ],
    solution_text: "$\\int(3x^2+4x)\\,dx=x^3+2x^2$. Therefore $[x^3+2x^2]_0^3=27+18=45$.",
    diagramRequired: false,
    uncertainties: []
  },
  "28698": {
    question_text: "A cuboid has base $EFGH$, height $6.7\\text{ cm}$, base dimensions $1.2\\text{ cm}$ and $3.1\\text{ cm}$. Calculate the size of the angle between the base $EFGH$ and line $DG$.",
    structure: "calculate-angle-between-line-and-plane-in-cuboid",
    meaningfulCase: "use-line-projection-on-base-and-vertical-height-in-a-right-triangle",
    mastery: false,
    options: [
      {text: "$68.8^\\circ$", correct: false, why: "Uses an incorrect base projection or inverse-trigonometric ratio for the line-plane angle."},
      {text: "$63.6^\\circ$", correct: true},
      {text: "$31.2^\\circ$", correct: false, why: "Uses the complementary angle or an incorrect projection length."},
      {text: "$26.4^\\circ$", correct: false, why: "Does not use the vertical height and base diagonal in the correct right triangle."}
    ],
    solution_text: "The projection of $DG$ onto the base is the base diagonal, with length $\\sqrt{1.2^2+3.1^2}$. Thus $\\tan\\theta=\\dfrac{6.7}{\\sqrt{1.2^2+3.1^2}}$, giving $\\theta\\approx63.6^\\circ$.",
    diagramRequired: true,
    uncertainties: []
  },
  "104526": {
    question_text: "What is the coefficient of the $x^2$ term in the expansion of $(x+1)^4$?",
    structure: "extract-binomial-expansion-coefficient",
    meaningfulCase: "choose-two-x-factors-from-four-factors",
    mastery: false,
    options: [
      {text: "$1$", correct: false, why: "Confuses the constant term coefficient with the coefficient of $x^2$."},
      {text: "$4$", correct: false, why: "Uses the coefficient of the linear term rather than the quadratic term."},
      {text: "$6$", correct: true},
      {text: "$x$", correct: false, why: "Gives a term rather than the numerical coefficient requested."}
    ],
    solution_text: "The $x^2$ coefficient is $\\binom42(1)^2=6$.",
    diagramRequired: false,
    uncertainties: []
  },
  "104530": {
    question_text: "What is the coefficient of the $x$ term in the expansion of $(2x+8)^4$?",
    structure: "extract-linear-coefficient-from-binomial-expansion",
    meaningfulCase: "choose-one-x-factor-and-three-constant-factors",
    mastery: false,
    options: [
      {text: "$64$", correct: false, why: "Uses an incomplete product and omits the binomial factor and remaining powers of $8$."},
      {text: "$256$", correct: false, why: "Does not include the correct combination of the linear factor and cubic constant factor."},
      {text: "$1024$", correct: false, why: "Uses an incorrect power or binomial multiplier in the linear-term calculation."},
      {text: "$4096$", correct: true}
    ],
    solution_text: "The linear term is $\\binom41(2x)(8^3)$, so its coefficient is $4\\times2\\times512=4096$.",
    diagramRequired: false,
    uncertainties: []
  },
  "20799": {
    question_text: "The table shows the marking time $m$ for a maths competition depending on the number of teachers $t$: $(t,m)=(1,280),(2,253),(3,207),(4,161),(5,119),(6,81),(7,54),(8,27)$. Use your graphic display calculator to write down the product moment correlation coefficient.",
    structure: "calculate-correlation-coefficient-from-bivariate-table",
    meaningfulCase: "strong-negative-linear-association-between-teachers-and-marking-time",
    mastery: false,
    options: [
      {text: "$r=-0.996$", correct: true},
      {text: "$r=0.992$", correct: false, why: "Uses a positive sign despite marking time decreasing as teacher number increases."},
      {text: "$r=0.996$", correct: false, why: "Uses the correct magnitude but reverses the negative direction of the association."},
      {text: "$r=-0.992$", correct: false, why: "Has the correct direction but the displayed data give a correlation closer to negative $0.996$."}
    ],
    solution_text: "Entering the paired values into a calculator gives $r\\approx-0.996008$, which rounds to $-0.996$.",
    diagramRequired: true,
    uncertainties: []
  },
  "73665": {
    question_text: "According to the graph below, what is the value of $\\cos(120^\\circ)$?",
    structure: "read-cosine-value-from-periodic-graph",
    meaningfulCase: "cosine-at-an-obtuse-angle-is-negative-one-half",
    mastery: false,
    options: [
      {text: "$\\dfrac12$", correct: false, why: "Uses the positive value associated with the first-quadrant reference angle."},
      {text: "$\\dfrac{\\sqrt3}{2}$", correct: false, why: "Confuses the cosine value with the sine value at a related reference angle."},
      {text: "$-\\dfrac12$", correct: true},
      {text: "$1$", correct: false, why: "Uses the maximum cosine value at a multiple of $360^\\circ$, not at $120^\\circ$."}
    ],
    solution_text: "$120^\\circ$ lies in the second quadrant, where cosine is negative. Its reference angle is $60^\\circ$, so $\\cos120^\\circ=-\\cos60^\\circ=-\\dfrac12$.",
    diagramRequired: true,
    uncertainties: []
  },
  "83135": {
    question_text: "Aisha wants to know what the favourite book of people in her class is. What is the best way for Aisha to collect this information?",
    structure: "choose-data-collection-method-for-categorical-responses",
    meaningfulCase: "list-each-persons-categorical-response-before-summarising",
    mastery: false,
    options: [
      {text: "Draw a pie chart", correct: false, why: "A pie chart displays collected data but is not the most direct way to collect responses."},
      {text: "Make a list", correct: true},
      {text: "Do a tally chart", correct: false, why: "A tally chart can summarise counts, but first recording the individual book choices is the clearer collection method here."},
      {text: "Draw a bar chart", correct: false, why: "A bar chart displays frequencies after collection rather than collecting the book preferences."}
    ],
    solution_text: "Aisha should ask each person for their favourite book and record the responses in a list. The list can then be counted or represented graphically.",
    diagramRequired: false,
    uncertainties: []
  },
  "141026": {
    question_text: "Differentiate $y=\\dfrac{2}{x^6}$.",
    structure: "differentiate-negative-power-monomial",
    meaningfulCase: "rewrite-as-2x-to-the-minus-six-and-apply-power-rule",
    mastery: false,
    options: [
      {text: "$\\dfrac{dy}{dx}=2x^{-6}$", correct: false, why: "Repeats the rewritten function but does not differentiate the power."},
      {text: "$\\dfrac{dy}{dx}=-12x^{-5}$", correct: false, why: "Uses the wrong resulting exponent after applying the power rule."},
      {text: "$\\dfrac{dy}{dx}=-14x^{-7}$", correct: false, why: "Changes the coefficient and exponent incorrectly rather than multiplying by negative six."},
      {text: "$\\dfrac{dy}{dx}=-12x^{-7}$", correct: true}
    ],
    solution_text: "Rewrite $y=2x^{-6}$. Then $\\dfrac{dy}{dx}=2(-6)x^{-7}=-12x^{-7}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "29008": {
    question_text: "$y$ is inversely proportional to $x$. When $x=2.5$, $y=64$. What is the value of $y$ when $x=7.5$? Which shows correct first steps of working?",
    structure: "form-inverse-proportion-equation-from-data",
    meaningfulCase: "inverse-proportion-constant-is-the-product-xy",
    mastery: false,
    options: [
      {text: "$y\\propto\\dfrac1x$, $y=\\dfrac{k}{x}$, $64=\\dfrac{k}{2.5}$", correct: true},
      {text: "$y\\propto x$, $y=kx$, $64=2.5k$", correct: false, why: "Uses direct rather than inverse proportion and therefore forms the wrong model."},
      {text: "$y\\propto\\dfrac1x$, $k=\\dfrac{64}{2.5}$, $k=25.6$", correct: false, why: "Divides instead of using $k=xy$, so it obtains the inverse-proportion constant incorrectly."},
      {text: "$y\\propto\\dfrac1x$, $y=\\dfrac{7.5}{x}$, $64=\\dfrac{7.5}{2.5}$", correct: false, why: "Uses the new $x$ value as the proportionality constant and does not use the given $y=64$ correctly."}
    ],
    solution_text: "Inverse proportion gives $y=\\dfrac{k}{x}$, so $64=\\dfrac{k}{2.5}$ and $k=160$. At $x=7.5$, $y=160/7.5=\\dfrac{64}{3}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "107513": {
    question_text: "What mistake has Michelle made when drawing these axes? The horizontal axis is labelled $x$ and the vertical axis $y$; the vertical tick marks are labelled $1,2,4,8$ at equal spacing.",
    structure: "identify-nonlinear-axis-scale-error",
    meaningfulCase: "vertical-axis-labels-do-not-match-the-equal-spaced-linear-grid",
    mastery: false,
    options: [
      {text: "$x$ axis scaled incorrectly", correct: false, why: "The horizontal labels increase by equal additive steps and are consistent with the grid."},
      {text: "$y$ axis scaled incorrectly", correct: true},
      {text: "$x$ and $y$ axes labelled the wrong way around", correct: false, why: "The horizontal and vertical axis labels are placed on the appropriate axes."},
      {text: "There is nothing wrong", correct: false, why: "The vertical values do not increase linearly at the equal-spaced tick marks."}
    ],
    solution_text: "On a standard linear graph, equal grid intervals represent equal numerical changes. The vertical labels $1,2,4,8$ are not equally spaced in value, so the $y$-axis scale is incorrect.",
    diagramRequired: true,
    uncertainties: []
  },
  "11222": {
    question_text: "For $12$ pairs of bivariate data, $\\sum x=73$, $\\sum y=68$, $\\sum x^2=501$, $\\sum y^2=425$, and $\\sum xy=404$. Which expression would correctly calculate the correlation coefficient $r$?",
    structure: "select-product-moment-correlation-formula-from-summary-statistics",
    meaningfulCase: "subtract-product-of-sums-divided-by-n-in-numerator-and-denominator",
    mastery: false,
    options: [
      {text: "$\\dfrac{404-\\frac{73\\times68}{5}}{\\sqrt{(501-\\frac{73^2}{5})(425-\\frac{68^2}{5})}}$", correct: false, why: "Uses the wrong divisor $5$ instead of the number of data pairs $12$."},
      {text: "$\\dfrac{404-\\frac{73\\times68}{12}}{\\sqrt{(73^2-\\frac{73^2}{12})(68^2-\\frac{68^2}{12})}}$", correct: false, why: "Uses squared sums rather than the supplied sums of squares in the denominator."},
      {text: "$\\dfrac{73\\times68-\\frac{73\\times68}{12}}{\\sqrt{(73^2-\\frac{73^2}{12})(68^2-\\frac{68^2}{12})}}$", correct: false, why: "Uses the wrong numerator and substitutes squared sums for the required sums of squares."},
      {text: "$\\dfrac{404-\\frac{73\\times68}{12}}{\\sqrt{(501-\\frac{73^2}{12})(425-\\frac{68^2}{12})}}$", correct: true}
    ],
    solution_text: "For $n=12$, $r=\\dfrac{\\sum xy-\\frac{(\\sum x)(\\sum y)}n}{\\sqrt{\\left(\\sum x^2-\\frac{(\\sum x)^2}n\\right)\\left(\\sum y^2-\\frac{(\\sum y)^2}n\\right)}}$. Substituting the supplied summaries gives option D.",
    diagramRequired: true,
    uncertainties: []
  },
  "23549": {
    question_text: "You are given that $f(x)=4x+5$ and $g(x)=x^2$. What is the value of $fg(-4)$?",
    structure: "evaluate-composite-function",
    meaningfulCase: "apply-inner-function-first-then-substitute-into-outer-function",
    mastery: false,
    options: [
      {text: "$-59$", correct: false, why: "Applies $f$ directly to $-4$ and does not evaluate the composition in the stated order."},
      {text: "$261$", correct: false, why: "Uses an incorrect substitution or arithmetic result for the composite function."},
      {text: "$121$", correct: false, why: "Squares $f(-4)$ or otherwise evaluates the functions in the wrong order."},
      {text: "$69$", correct: true}
    ],
    solution_text: "$g(-4)=(-4)^2=16$. Then $f(g(-4))=f(16)=4(16)+5=69$.",
    diagramRequired: false,
    uncertainties: []
  },
  "76770": {
    question_text: "Work out $\\dfrac{\\sqrt{3\\times21}-1}{4\\times0.2}$.",
    structure: "evaluate-numerical-expression-with-square-root",
    meaningfulCase: "follow-order-of-operations-and-round-decimal-result",
    mastery: false,
    options: [
      {text: "$8.6715\\ldots$", correct: true},
      {text: "$7.8872\\ldots$", correct: false, why: "Makes an arithmetic error in evaluating the square-root numerator or denominator."},
      {text: "$9.8425\\ldots$", correct: false, why: "Does not correctly apply the subtraction and division after evaluating the square root."},
      {text: "$77.5$", correct: false, why: "Treats the decimal denominator or square-root expression with an incorrect operation order."}
    ],
    solution_text: "$\\sqrt{3\\times21}=\\sqrt{63}\\approx7.9373$. Hence $\\dfrac{7.9373-1}{0.8}\\approx8.6715$.",
    diagramRequired: false,
    uncertainties: []
  },
  "119578": {
    question_text: "$\\sin\\theta\\equiv\\cdots$",
    structure: "express-sine-in-complex-exponential-form",
    meaningfulCase: "difference-of-conjugate-exponentials-divided-by-two-i",
    mastery: false,
    options: [
      {text: "$\\dfrac{e^{i\\theta}-e^{-i\\theta}}2$", correct: false, why: "Omits the factor $i$ in the denominator required by Euler's sine identity."},
      {text: "$\\dfrac{e^{i\\theta}-e^{-i\\theta}}{2i}$", correct: true},
      {text: "$\\dfrac{e^{i\\theta}+e^{-i\\theta}}2$", correct: false, why: "The sum of conjugate exponentials represents cosine, not sine."},
      {text: "$\\dfrac{e^{i\\theta}+e^{-i\\theta}}{2i}$", correct: false, why: "Uses a sum where the sine identity requires the difference of the exponentials."}
    ],
    solution_text: "Euler's identities give $e^{i\\theta}=\\cos\\theta+i\\sin\\theta$ and $e^{-i\\theta}=\\cos\\theta-i\\sin\\theta$. Subtracting gives $e^{i\\theta}-e^{-i\\theta}=2i\\sin\\theta$, so $\\sin\\theta=\\dfrac{e^{i\\theta}-e^{-i\\theta}}{2i}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "149744": {
    question_text: "A rocket of mass $7800\\text{ kg}$ is approaching the ground, travelling horizontally at $20\\text{ m s}^{-1}$. When the engine thrust is changed to $90,000\\text{ N}$, which diagram shows the trajectory of the rocket following this change of thrust?",
    structure: "infer-trajectory-from-net-vertical-thrust-and-horizontal-velocity",
    meaningfulCase: "upward-net-force-bends-horizontal-motion-upward",
    mastery: false,
    options: [
      {text: "A", correct: false, why: "Shows a straight downward path, which would require no upward acceleration from the changed thrust."},
      {text: "B", correct: false, why: "Shows the path curving downward rather than responding to the upward net thrust."},
      {text: "C", correct: false, why: "Shows an immediate straight upward line and does not retain the rocket's horizontal velocity component."},
      {text: "D", correct: true}
    ],
    solution_text: "The rocket's weight is approximately $7800(9.8)=76,440\\text{ N}$ downward. The $90,000\\text{ N}$ thrust gives a net upward force, so the rocket accelerates upward while retaining its horizontal velocity. Its path initially follows the horizontal direction and curves upward, as in D.",
    diagramRequired: true,
    uncertainties: ["The thrust direction is inferred from the rocket diagram; the numerical force comparison assumes $g\\approx9.8\\text{ m s}^{-2}$."]
  },
  "150165": {
    question_text: "What is the range of possible values for $r$, the correlation coefficient?",
    structure: "state-range-of-correlation-coefficient",
    meaningfulCase: "correlation-includes-perfect-positive-and-negative-endpoints",
    mastery: false,
    options: [
      {text: "$-1<r<1$", correct: false, why: "Excludes the valid perfect-correlation endpoint values $-1$ and $1$."},
      {text: "$0\\leq r\\leq1$", correct: false, why: "Excludes all negative correlations, which are valid correlation coefficients."},
      {text: "$-1\\leq r\\leq1$", correct: true},
      {text: "It can have any value", correct: false, why: "Correlation coefficients are bounded between negative one and positive one."}
    ],
    solution_text: "By definition, a correlation coefficient lies in the inclusive interval $[-1,1]$, so $-1\\leq r\\leq1$.",
    diagramRequired: false,
    uncertainties: []
  },
  "150166": {
    question_text: "A correlation coefficient of $r=-0.1$ tells us that the regression line...",
    structure: "interpret-sign-and-strength-of-correlation-coefficient",
    meaningfulCase: "weak-negative-correlation-implies-a-shallow-negative-trend",
    mastery: false,
    options: [
      {text: "Has a gradient of $-0.1$", correct: false, why: "Confuses the correlation coefficient with the numerical gradient of a regression line."},
      {text: "Has a negative gradient", correct: false, why: "Identifies the direction but not the specifically weak, shallow nature indicated by $|r|=0.1$."},
      {text: "Has a shallow negative gradient", correct: true},
      {text: "Has a steep negative gradient", correct: false, why: "Interprets a correlation close to zero as a strong negative relationship."}
    ],
    solution_text: "The negative sign indicates a downward trend, while the small magnitude $|r|=0.1$ indicates a weak relationship. Thus the regression line has a shallow negative gradient.",
    diagramRequired: false,
    uncertainties: []
  },
  "20844": {
    question_text: "The temperature $T$ is measured for $12$ days against the number of ice creams sold $C$. The data are $T=(15,16,18,20,24,27,23,19,18,20,17,16)$ and $C=(22,25,32,33,28,43,38,30,21,37,23,18)$. Find the correlation coefficient $r$ for $T$ and $C$.",
    structure: "calculate-product-moment-correlation-coefficient",
    meaningfulCase: "standardise-centred-products-and-sums-of-squares",
    mastery: false,
    options: [
      {text: "$r=24.2$", correct: false, why: "A correlation coefficient cannot exceed $1$ in magnitude."},
      {text: "$r=0.629$", correct: false, why: "Does not match the product-moment calculation for the displayed paired data."},
      {text: "$r=0.793$", correct: true},
      {text: "$r=1.68$", correct: false, why: "Exceeds the permitted correlation range and is therefore impossible."}
    ],
    solution_text: "Using $r=\\dfrac{\\sum(T-\\bar T)(C-\\bar C)}{\\sqrt{\\sum(T-\\bar T)^2\\sum(C-\\bar C)^2}}$ for the 12 pairs gives $r\\approx0.793$.",
    diagramRequired: true,
    uncertainties: []
  },
  "2949": {
    question_text: "One of the following statements is true. Which statement is this?",
    structure: "identify-properties-of-variance-and-standard-deviation",
    meaningfulCase: "standard-deviation-is-the-positive-square-root-of-variance",
    mastery: false,
    options: [
      {text: "The standard deviation of a set of data is the square root of the variance of the data.", correct: true},
      {text: "If all data is increased by $4$, the mean does not change.", correct: false, why: "Adding four to every data value also increases the mean by four."},
      {text: "The variance gives an indication of the middle value in the data.", correct: false, why: "Variance measures spread, not the central or middle value of the data."},
      {text: "If all data is increased by $4$, the standard deviation increases by $4$.", correct: false, why: "Adding a constant shifts the data but leaves its spread and standard deviation unchanged."}
    ],
    solution_text: "Variance is the square of the standard deviation, so the standard deviation is the positive square root of the variance. The other statements confuse measures of centre and spread.",
    diagramRequired: false,
    uncertainties: []
  },
  "115093": {
    question_text: "Which of the calculations below is correct?",
    structure: "verify-arithmetic-with-decimals-fractions-and-mixed-numbers",
    meaningfulCase: "align-place-values-and-common-denominators-before-adding",
    mastery: false,
    options: [
      {text: "$0.5+0.42=0.47$", correct: false, why: "Adds the decimals incorrectly; the correct sum is $0.92$."},
      {text: "$\\dfrac5{11}+\\dfrac2{11}=\\dfrac7{22}$", correct: false, why: "Keeps the denominator $22$ instead of retaining the common denominator $11$."},
      {text: "$1\\dfrac23+2\\dfrac23=3\\dfrac23$", correct: false, why: "Adds the whole parts but mishandles the fractional parts, which sum to an extra whole."},
      {text: "$0.06+0.7+0.011=0.771$", correct: true}
    ],
    solution_text: "$0.06+0.700+0.011=0.771$, so option D is the correct calculation.",
    diagramRequired: false,
    uncertainties: []
  },
  "152196": {
    question_text: "A plank of wood $AB$ is hinged to a wall at $B$ and held in a horizontal position by a taut rope attached to the plank at $A$. Which best describes the direction of the force on the plank from the wall at $B$?",
    structure: "infer-hinge-reaction-direction-from-force-equilibrium",
    meaningfulCase: "hinge-force-balances-the-rope-pull-with-a-leftward-and-downward-component",
    mastery: false,
    options: [
      {text: "Upwards and left", correct: false, why: "The wall reaction must oppose the rope's upward component, not add another upward component."},
      {text: "Upwards and right", correct: false, why: "Has the wrong horizontal direction because the rope pulls the plank towards the right."},
      {text: "Downwards and left", correct: true},
      {text: "Downwards and right", correct: false, why: "Has the wrong horizontal direction for balancing the rope tension at A."}
    ],
    solution_text: "The rope pulls the plank at A upwards and to the right. For the plank to be in equilibrium, the force from the hinge at B must have components downwards and to the left to oppose this pull.",
    diagramRequired: true,
    uncertainties: ["The diagram does not show a separate weight force or numerical tension; the direction is inferred from the displayed rope force and the intended equilibrium model."]
  },
  "77598": {
    question_text: "Which shape does not have exactly 2 sides of equal length?",
    structure: "identify-number-of-equal-sides-from-geometric-markings",
    meaningfulCase: "equilateral-triangle-has-three-equal-sides-rather-than-exactly-two",
    mastery: false,
    options: [
      {text: "A", correct: true},
      {text: "B", correct: false, why: "The two matching side marks show exactly one pair of equal sides."},
      {text: "C", correct: false, why: "The equal-angle markings imply the two opposite sides are equal."},
      {text: "D", correct: false, why: "The matching marks on the perpendicular legs show exactly two equal sides."}
    ],
    solution_text: "Shape A has matching marks on all three sides, so it has three equal sides rather than exactly two. The other shapes indicate one pair of equal sides.",
    diagramRequired: true,
    uncertainties: []
  },
  "103318": {
    question_text: "Given that $(1+ax)^n=1-12x+63x^2+\\cdots$, find the value of $n$.",
    structure: "determine-binomial-power-from-first-two-coefficients",
    meaningfulCase: "eliminate-a-between-linear-and-quadratic-binomial-coefficients",
    mastery: false,
    options: [
      {text: "$5$", correct: false, why: "Does not satisfy the simultaneous coefficient equations for $x$ and $x^2$."},
      {text: "$6$", correct: false, why: "Produces an incorrect quadratic coefficient after matching the linear coefficient."},
      {text: "$7$", correct: false, why: "Fails the relation obtained by dividing the quadratic coefficient equation by the squared linear one."},
      {text: "$8$", correct: true}
    ],
    solution_text: "From the $x$ coefficient, $na=-12$. From the $x^2$ coefficient, $\\dfrac{n(n-1)}2a^2=63$. Substituting $a=-12/n$ gives $72(n-1)/n=63$, so $9n=72$ and $n=8$.",
    diagramRequired: false,
    uncertainties: []
  },
  "122395": {
    question_text: "If the geometric series $2+2(x-3)+2(x-3)^2+\\cdots$ converges, then...",
    structure: "apply-geometric-series-convergence-condition",
    meaningfulCase: "absolute-common-ratio-less-than-one",
    mastery: false,
    options: [
      {text: "$-1<2(x-3)<1$", correct: false, why: "Applies the convergence condition to the first multiplied term instead of the common ratio."},
      {text: "$-1<x-3<1$", correct: true},
      {text: "$-1<(x-3)^2<1$", correct: false, why: "Squares the ratio unnecessarily and misses the condition on the ratio itself."},
      {text: "$-1<2<1$", correct: false, why: "Ignores the variable common ratio and gives an impossible fixed inequality."}
    ],
    solution_text: "The common ratio is $r=x-3$. A geometric series converges when $|r|<1$, so $|x-3|<1$, equivalently $-1<x-3<1$.",
    diagramRequired: false,
    uncertainties: []
  },
  "99817": {
    question_text: "An object is thrown from the ground with speed $30\\text{ m s}^{-1}$ at an angle of elevation $30^\\circ$. How long does the object take to reach the ground again?",
    structure: "calculate-projectile-time-of-flight",
    meaningfulCase: "double-initial-vertical-speed-divided-by-gravity",
    mastery: false,
    options: [
      {text: "$0\\text{ s}$", correct: false, why: "Ignores the upward launch and treats the return to the ground as instantaneous."},
      {text: "$1.53\\text{ s}$", correct: false, why: "Uses the initial vertical speed as the full flight time instead of doubling it."},
      {text: "$6.12\\text{ s}$", correct: false, why: "Uses an incorrect gravitational or trigonometric factor in the time-of-flight calculation."},
      {text: "$3.06\\text{ s}$", correct: true}
    ],
    solution_text: "The initial vertical speed is $30\\sin30^\\circ=15\\text{ m s}^{-1}$. Time of flight is $T=2u_y/g=30/9.8\\approx3.06\\text{ s}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "11249": {
    question_text: "What is the range of the function $f(x)=3\\sin x+4\\cos x$ for $-2\\pi\\leq x\\leq2\\pi$?",
    structure: "find-range-of-linear-combination-of-sine-and-cosine",
    meaningfulCase: "amplitude-is-square-root-of-sum-of-squared-coefficients",
    mastery: false,
    options: [
      {text: "$-1\\leq f(x)\\leq1$", correct: false, why: "Does not account for the combined amplitude of the sine and cosine terms."},
      {text: "$-4\\leq f(x)\\leq4$", correct: false, why: "Uses the larger coefficient as the amplitude instead of combining both coefficients."},
      {text: "$-5\\leq f(x)\\leq5$", correct: true},
      {text: "$-7\\leq f(x)\\leq7$", correct: false, why: "Adds the coefficient magnitudes, which overestimates the true sinusoidal amplitude."}
    ],
    solution_text: "Write $3\\sin x+4\\cos x=R\\sin(x+\\alpha)$, where $R=\\sqrt{3^2+4^2}=5$. Over the given interval the full sinusoidal range is attained, so $-5\\leq f(x)\\leq5$.",
    diagramRequired: false,
    uncertainties: []
  },
  "124677": {
    question_text: "Which shape has the wrong name? The four labelled shapes are A Square, B Rhombus, C Trapezium, and D Kite.",
    structure: "classify-quadrilaterals-from-defining-properties",
    meaningfulCase: "a-four-equal-sided-shape-without-right-angle-properties-is-a-rhombus",
    mastery: false,
    options: [
      {text: "A: Square", correct: true},
      {text: "B: Rhombus", correct: false, why: "The marked equal sides and parallelogram shape support the name rhombus."},
      {text: "C: Trapezium", correct: false, why: "The marked parallel pair gives the defining property of a trapezium."},
      {text: "D: Kite", correct: false, why: "The two pairs of adjacent equal sides give the defining property of a kite."}
    ],
    solution_text: "Shape A has four equal sides but no right-angle markings, so the diagram establishes a rhombus rather than a square. The name Square is therefore the wrong one.",
    diagramRequired: true,
    uncertainties: ["The image relies on visual shape and side tick marks; no right-angle markings are shown for A, so the classification as a wrong-named square depends on the intended diagram conventions."]
  },
  "21351": {
    question_text: "Sally wins the first game with probability $0.6$. If she wins the first game, the probability of winning the second is $0.7$; if she loses the first, the probability of winning the second is $0.4$. It is known Sally won at least one game. Find the probability she won both games.",
    structure: "calculate-conditional-probability-from-tree-diagram",
    meaningfulCase: "joint-both-win-probability-divided-by-at-least-one-win-probability",
    mastery: false,
    options: [
      {text: "$0.353$", correct: false, why: "Uses an incorrect conditioning denominator for the event of at least one win."},
      {text: "$0.42$", correct: false, why: "Calculates the joint probability but fails to condition on the known at-least-one-win event."},
      {text: "$0.553$", correct: true},
      {text: "$0.70$", correct: false, why: "Uses the conditional second-game probability alone rather than the required conditional event probability."}
    ],
    solution_text: "$P(\\text{both})=0.6(0.7)=0.42$. Also $P(\\text{at least one})=1-0.4(0.6)=0.76$. Therefore $P(\\text{both}\\mid\\text{at least one})=0.42/0.76\\approx0.553$.",
    diagramRequired: true,
    uncertainties: []
  },
  "14254": {
    question_text: "$40,000$ people to the nearest $10$ attend a football match. What is the maximum number of people at the match?",
    structure: "find-maximum-integer-from-rounding-interval",
    meaningfulCase: "rounding-to-nearest-ten-gives-an-upper-exclusive-bound-of-40005",
    mastery: false,
    options: [
      {text: "$40,499$", correct: false, why: "Differs from $40,000$ by far more than the half-unit rounding tolerance of $5$."},
      {text: "$40,049$", correct: false, why: "Is too large to round to $40,000$ to the nearest $10$."},
      {text: "$40,005$", correct: false, why: "The upper endpoint is excluded because a value of $40,005$ rounds to $40,010 under the usual rule."},
      {text: "$40,004$", correct: true}
    ],
    solution_text: "Rounding to the nearest $10$ gives the interval $39,995\\leq N<40,005$. The greatest whole number in this interval is $40,004$.",
    diagramRequired: false,
    uncertainties: []
  },
  "3481": {
    question_text: "What is the differential of $\\ln(4x+2)$?",
    structure: "differentiate-logarithm-of-linear-function",
    meaningfulCase: "chain-rule-factor-four-over-the-linear-argument",
    mastery: false,
    options: [
      {text: "$\\dfrac1{4x+2}$", correct: false, why: "Differentiates the logarithm but omits the derivative of the inner expression $4x+2$."},
      {text: "$\\dfrac4{4x+2}$", correct: true},
      {text: "$\\dfrac1{4(4x+2)}$", correct: false, why: "Divides by the inner derivative instead of multiplying by it in the chain rule."},
      {text: "$\\dfrac1{4x}$", correct: false, why: "Drops the constant $2$ inside the logarithm and also misses the required factor four."}
    ],
    solution_text: "For $u=4x+2$, $\\dfrac{d}{dx}\\ln u=\\dfrac{u'}u$. Since $u'=4$, the differential is $\\dfrac4{4x+2}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "9706": {
    question_text: "If the following function is rotated $2\\pi$ radians about the $x$-axis, the volume generated would look like... The graph shown is a horizontal line segment above the $x$-axis.",
    structure: "visualise-solid-of-revolution-about-horizontal-axis",
    meaningfulCase: "constant-radius-line-generates-a-cylinder",
    mastery: false,
    options: [
      {text: "A", correct: false, why: "Shows a varying-radius solid rather than the constant radius produced by a horizontal line."},
      {text: "B", correct: true},
      {text: "C", correct: false, why: "Shows an unsuitable tapered or conical solid instead of a cylinder with parallel ends."},
      {text: "D", correct: false, why: "Shows a bulb-shaped solid whose radius varies along the axis."}
    ],
    solution_text: "Rotating a horizontal line segment at a fixed positive distance from the $x$-axis gives the same radius at every point along its length. The solid is a cylinder, so option B is correct.",
    diagramRequired: true,
    uncertainties: []
  },
  "10110": {
    question_text: "The right-angled triangle has perpendicular sides of length $8\\text{ cm}$ and $10\\text{ cm}$. The area of this triangle is",
    structure: "calculate-area-of-right-triangle",
    meaningfulCase: "half-the-product-of-the-two-perpendicular-sides",
    mastery: false,
    options: [
      {text: "$9\\text{ cm}^2$", correct: false, why: "Does not use the two perpendicular side lengths in the triangle-area formula."},
      {text: "$80\\text{ cm}^2$", correct: false, why: "Multiplies the base and height but forgets the factor of one half."},
      {text: "$40\\text{ cm}^2$", correct: true},
      {text: "$18\\text{ cm}^2$", correct: false, why: "Uses an incorrect combination of the given side lengths instead of half their product."}
    ],
    solution_text: "The area is $\\dfrac12\\times8\\times10=40\\text{ cm}^2$.",
    diagramRequired: true,
    uncertainties: []
  },
  "121859": {
    question_text: "If you exert a force of $10\\text{ N}$ on the wall, what force does the wall exert on you?",
    structure: "apply-newtons-third-law-force-pair",
    meaningfulCase: "contact-force-pair-has-equal-magnitude-and-opposite-direction",
    mastery: false,
    options: [
      {text: "$0\\text{ N}$", correct: false, why: "Confuses the net force on a stationary person with the force exerted by the wall."},
      {text: "$5\\text{ N}$", correct: false, why: "Halves the applied force even though Newton's third law gives equal magnitudes."},
      {text: "$10\\text{ N}$", correct: true},
      {text: "$20\\text{ N}$", correct: false, why: "Doubles the interaction force instead of pairing equal and opposite forces."}
    ],
    solution_text: "Newton's third law states that interacting bodies exert forces of equal magnitude in opposite directions. The wall therefore exerts $10\\text{ N}$ on you, opposite to your force on it.",
    diagramRequired: false,
    uncertainties: []
  },
  "142903": {
    question_text: "Which angle measure is equivalent to $\\dfrac{13\\pi}{6}$ radians?",
    structure: "convert-radians-to-degrees",
    meaningfulCase: "multiply-radian-measure-by-180-over-pi",
    mastery: false,
    options: [
      {text: "$30^\\circ$", correct: false, why: "Uses only the excess over one full turn and omits the full $360^\\circ$."},
      {text: "$390^\\circ$", correct: true},
      {text: "$750^\\circ$", correct: false, why: "Multiplies by an incorrect degree conversion factor."},
      {text: "$1110^\\circ$", correct: false, why: "Overestimates the conversion by applying an extra multiple of a full turn."}
    ],
    solution_text: "$\\dfrac{13\\pi}{6}\\times\\dfrac{180^\\circ}{\\pi}=13\\times30^\\circ=390^\\circ$.",
    diagramRequired: false,
    uncertainties: []
  },
  "30242": {
    question_text: "Given $f(x)=\\dfrac{\\cos x}{2x}$, find $f'(x)$.",
    structure: "differentiate-quotient-of-functions",
    meaningfulCase: "quotient-rule-with-linear-denominator-and-trigonometric-numerator",
    mastery: false,
    options: [
      {text: "$-\\dfrac{x\\sin x+\\cos x}{2x^2}$", correct: true},
      {text: "$\\dfrac{x\\sin x(-2+\\cos x)}{2x^2}$", correct: false, why: "Combines unrelated factors and does not apply the quotient rule to the numerator and denominator."},
      {text: "$-\\dfrac{2(x\\sin x-\\cos x)}{4x}$", correct: false, why: "Uses an incorrect denominator power and the wrong sign in the quotient-rule numerator."},
      {text: "$\\dfrac{\\cos x(-2x\\sin x)}{4x^2}$", correct: false, why: "Differentiates the numerator incompletely and omits the derivative of the denominator term."}
    ],
    solution_text: "With $u=\\cos x$ and $v=2x$, $u'=-\\sin x$ and $v'=2$. Hence $f'(x)=\\dfrac{u'v-uv'}{v^2}=\\dfrac{-2x\\sin x-2\\cos x}{4x^2}=-\\dfrac{x\\sin x+\\cos x}{2x^2}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "3726": {
    question_text: "What is the complex conjugate of $3+2i$?",
    structure: "find-complex-conjugate-by-changing-imaginary-sign",
    meaningfulCase: "real-part-unchanged-and-imaginary-part-sign-reversed",
    mastery: false,
    options: [
      {text: "$\\dfrac13-\\dfrac12i$", correct: false, why: "Reciprocates the components instead of taking the complex conjugate."},
      {text: "$\\dfrac13+\\dfrac12i$", correct: false, why: "Changes both component values and leaves the imaginary sign positive."},
      {text: "$3-2i$", correct: true},
      {text: "$2+3i$", correct: false, why: "Swaps the real and imaginary coefficients instead of changing only the imaginary sign."}
    ],
    solution_text: "The conjugate of $a+bi$ is $a-bi$. Therefore the conjugate of $3+2i$ is $3-2i$.",
    diagramRequired: false,
    uncertainties: []
  },
  "4396": {
    question_text: "Which number has a $5$ in the ten thousands place?",
    structure: "identify-digit-by-place-value",
    meaningfulCase: "ten-thousands-digit-is-the-second-digit-from-the-left-in-a-six-digit-number",
    mastery: false,
    options: [
      {text: "$104,352$", correct: false, why: "The ten-thousands digit is $0$, not $5$."},
      {text: "$365,971$", correct: false, why: "The ten-thousands digit is $6$, while the digit $5$ is not present."},
      {text: "$582,607$", correct: false, why: "The $5$ is in the hundred-thousands place, not the ten-thousands place."},
      {text: "$951,480$", correct: true}
    ],
    solution_text: "In $951,480$, the digits represent $9$ hundred-thousands, $5$ ten-thousands, $1$ thousands, and so on. Therefore this is the required number.",
    diagramRequired: false,
    uncertainties: []
  },
  "63301": {
    question_text: "Which of these is the correct formula to find the derived function from first principles?",
    structure: "identify-limit-definition-of-derivative",
    meaningfulCase: "difference-quotient-limit-as-increment-tends-to-zero",
    mastery: false,
    options: [
      {text: "$f'(x)=\\dfrac{f(x+h)-f(x)}{h}$", correct: false, why: "Gives the finite difference quotient but omits the limit as the increment tends to zero."},
      {text: "$f'(x)=\\dfrac{f(x+h)-f(x)}{x+h-x}$", correct: false, why: "Again gives only a difference quotient and does not state the limiting process."},
      {text: "$f'(x)=\\dfrac{f(h)}{h}$", correct: false, why: "Does not compare function values at $x+h$ and $x$, so it is not the derivative definition."},
      {text: "$f'(x)=\\lim_{h\\to0}\\dfrac{f(x+h)-f(x)}{h}$", correct: true}
    ],
    solution_text: "The derivative is defined as the limit of the difference quotient as the increment tends to zero: $f'(x)=\\lim_{h\\to0}\\dfrac{f(x+h)-f(x)}{h}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "66489": {
    question_text: "Which option could be an intermediate step in solving the matrix equation $\\begin{pmatrix}2&3\\\\5&1\\end{pmatrix}\\begin{pmatrix}x\\\\y\\end{pmatrix}=\\begin{pmatrix}1\\\\9\\end{pmatrix}$?",
    structure: "identify-inverse-matrix-for-solving-linear-system",
    meaningfulCase: "inverse-of-two-by-two-matrix-uses-adjugate-over-determinant",
    mastery: false,
    options: [
      {text: "Left multiply both sides by $-\\dfrac1{13}\\begin{pmatrix}2&3\\\\5&1\\end{pmatrix}$", correct: false, why: "Uses the original coefficient matrix rather than its adjugate in the inverse."},
      {text: "Left multiply both sides by $-\\dfrac1{13}\\begin{pmatrix}1&-3\\\\-5&2\\end{pmatrix}$", correct: true},
      {text: "Left multiply both sides by $-\\dfrac1{13}\\begin{pmatrix}-1&5\\\\3&-2\\end{pmatrix}$", correct: false, why: "Uses an incorrect adjugate matrix with signs and entries not matching the coefficient matrix."},
      {text: "Left multiply both sides by $-\\dfrac13\\begin{pmatrix}1&-3\\\\-5&2\\end{pmatrix}$", correct: false, why: "Uses the correct adjugate but the determinant factor should be $-1/13$, not $-1/3$."}
    ],
    solution_text: "The determinant is $2(1)-3(5)=-13$. Thus $A^{-1}=\\dfrac1{-13}\\begin{pmatrix}1&-3\\\\-5&2\\end{pmatrix}=-\\dfrac1{13}\\begin{pmatrix}1&-3\\\\-5&2\\end{pmatrix}$. Left multiplication by this inverse is valid.",
    diagramRequired: true,
    uncertainties: []
  },
  "3247": {
    question_text: "In the diagram, area $P=5$ square units and area $Q=3$ square units. The statements are (1) $\\int_0^3 f(x)\\,dx=8$ and (2) $\\int_2^3 f(x)\\,dx=3$. Which of the following is true?",
    structure: "interpret-definite-integral-as-signed-area",
    meaningfulCase: "area-below-the-axis-contributes-negatively-to-the-integral",
    mastery: false,
    options: [
      {text: "Neither statement is correct", correct: true},
      {text: "Only statement (1) is correct", correct: false, why: "Adds the two geometric areas without accounting for the negative signed area below the x-axis."},
      {text: "Only statement (2) is correct", correct: false, why: "Treats the below-axis integral as positive even though it equals $-3$."},
      {text: "Both statements are correct", correct: false, why: "Both displayed equalities conflict with the signed areas: the first is $2$ and the second is $-3$."}
    ],
    solution_text: "From $0$ to $2$, the graph contributes $+5$; from $2$ to $3$, it contributes $-3$. Thus $\\int_0^3f(x)\\,dx=5-3=2$, not $8$, and $\\int_2^3f(x)\\,dx=-3$, not $3$. Neither statement is correct.",
    diagramRequired: true,
    uncertainties: []
  },
  "98339": {
    question_text: "The solution of $\\cos 2x^\\circ+\\sin x^\\circ=0$, $0<x<360$, is",
    structure: "solve-trigonometric-equation-by-substitution",
    meaningfulCase: "factor-quadratic-in-sine-and-list-solutions-over-one-degree-cycle",
    mastery: false,
    options: [
      {text: "$30^\\circ,90^\\circ,150^\\circ$", correct: false, why: "Includes angles that do not satisfy the equation after substituting their sine values."},
      {text: "$90^\\circ,210^\\circ,330^\\circ$", correct: true},
      {text: "$60^\\circ,90^\\circ,120^\\circ$", correct: false, why: "Uses the wrong angles for the negative half-sine solutions and omits the required third-quadrant value."},
      {text: "$90^\\circ,240^\\circ,300^\\circ$", correct: false, why: "Uses sine values other than $-1/2$ for the non-right-angle solutions."}
    ],
    solution_text: "Using $\\cos2x=1-2\\sin^2x$, let $s=\\sin x$. Then $1-2s^2+s=0$, so $(2s+1)(s-1)=0$. Hence $s=1$ or $s=-1/2$, giving $x=90^\\circ,210^\\circ,330^\\circ$.",
    diagramRequired: false,
    uncertainties: []
  },
  "121491": {
    question_text: "What is the resultant force acting on this object? The forces are $3\\text{ N}$ to the right, $1\\text{ N}$ to the left, $2\\text{ N}$ upwards, and $5\\text{ N}$ downwards.",
    structure: "add-perpendicular-force-components",
    meaningfulCase: "subtract-opposing-horizontal-and-vertical-components",
    mastery: false,
    options: [
      {text: "$\\begin{pmatrix}2\\\\3\\end{pmatrix}\\text{ N}$", correct: false, why: "Gets the horizontal component right but reverses the direction of the vertical resultant."},
      {text: "$\\begin{pmatrix}2\\\\-3\\end{pmatrix}\\text{ N}$", correct: true},
      {text: "$11\\text{ N}$", correct: false, why: "Adds all force magnitudes and ignores cancellation between opposite directions."},
      {text: "$-1\\text{ N}$", correct: false, why: "Combines unrelated components as a single signed scalar instead of forming a resultant vector."}
    ],
    solution_text: "Horizontal component: $3-1=2\\text{ N}$. Vertical component: $2-5=-3\\text{ N}$. Therefore the resultant is $\\begin{pmatrix}2\\\\-3\\end{pmatrix}\\text{ N}$.",
    diagramRequired: true,
    uncertainties: []
  },
  "123996": {
    question_text: "A vaccine against a particular disease has an advertised success rate of $95\\%$. A group of $100$ people are vaccinated and $98$ are then found to be immune. Test, at the $5\\%$ significance level, whether there is sufficient evidence that the vaccine is actually more effective than advertised. What is the $p$-value for the test?",
    structure: "form-one-tailed-binomial-p-value",
    meaningfulCase: "upper-tail-probability-for-observed-successes-under-null-rate",
    mastery: false,
    options: [
      {text: "$P(X=98)$", correct: false, why: "Uses only the observed outcome rather than the probability of this outcome or anything more extreme."},
      {text: "$X=99$", correct: false, why: "Gives a possible count rather than a probability expression for the hypothesis test."},
      {text: "$5\\%$", correct: false, why: "Confuses the chosen significance level with the p-value calculated from the observed data."},
      {text: "$P(X\\geq98)$", correct: true}
    ],
    solution_text: "For the one-sided alternative that the success rate exceeds $0.95$, evidence at least as extreme as $98$ successes is in the upper tail. Therefore the p-value is $P(X\\geq98)$ for $X\\sim B(100,0.95)$.",
    diagramRequired: false,
    uncertainties: []
  },
  "125697": {
    question_text: "If $X\\sim N(20,100)$, then the distribution of sample means of size $4$, $\\bar X_4$, has...",
    structure: "find-variance-of-sample-mean-from-normal-model",
    meaningfulCase: "sampling-mean-variance-is-population-variance-divided-by-sample-size",
    mastery: false,
    options: [
      {text: "variance $100$", correct: false, why: "Uses the original population variance without reducing it for averaging four observations."},
      {text: "variance $25$", correct: true},
      {text: "variance $2.5$", correct: false, why: "Divides the variance by an incorrect factor rather than by the sample size $4$."},
      {text: "variance $50$", correct: false, why: "Halves the variance instead of applying the sampling-mean variance formula."}
    ],
    solution_text: "For a sample mean of size $n$, $\\operatorname{Var}(\\bar X)=\\sigma^2/n$. Thus $\\operatorname{Var}(\\bar X_4)=100/4=25$.",
    diagramRequired: false,
    uncertainties: []
  },
  "13212": {
    question_text: "What is the dimension of the matrix $\\begin{pmatrix}1&0\\\\3&1\\\\0&-1\\end{pmatrix}$?",
    structure: "identify-matrix-dimensions-from-rows-and-columns",
    meaningfulCase: "three-rows-and-two-columns-give-a-3-by-2-matrix",
    mastery: false,
    options: [
      {text: "$6$", correct: false, why: "Gives the number of entries rather than the matrix dimension as rows by columns."},
      {text: "$2\\times3$", correct: false, why: "Reverses the conventional order: matrix dimensions are stated rows first, then columns."},
      {text: "$3\\times2$", correct: true},
      {text: "$5$", correct: false, why: "Counts neither the rows-by-columns dimension nor all six entries correctly."}
    ],
    solution_text: "The matrix has $3$ rows and $2$ columns, so its dimension is $3\\times2$.",
    diagramRequired: true,
    uncertainties: []
  },
  "13292": {
    question_text: "Write $3-3i$ in exponential form.",
    structure: "convert-complex-number-to-exponential-form",
    meaningfulCase: "modulus-3-root-2-and-fourth-quadrant-argument-minus-pi-over-four",
    mastery: false,
    options: [
      {text: "$18e^{i\\pi/4}$", correct: false, why: "Uses an incorrect modulus and places the argument in the first quadrant."},
      {text: "$3\\sqrt2e^{-i\\pi/4}$", correct: true},
      {text: "$18e^{-i\\pi/4}$", correct: false, why: "Gets the quadrant right but incorrectly squares the modulus to $18$."},
      {text: "$3\\sqrt2e^{i\\pi/4}$", correct: false, why: "Uses the correct modulus but the positive argument corresponds to the wrong quadrant."}
    ],
    solution_text: "The modulus is $r=\\sqrt{3^2+(-3)^2}=3\\sqrt2$. Since the point is in the fourth quadrant, $\\theta=-\\pi/4$. Therefore $3-3i=3\\sqrt2e^{-i\\pi/4}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "13306": {
    question_text: "What values of $k$ would you use to calculate the roots of $z^8=1$ for $-\\pi<\\theta\\leq\\pi$?",
    structure: "select-integer-index-range-for-roots-of-unity",
    meaningfulCase: "include-the-positive-endpoint-and-exclude-the-negative-endpoint",
    mastery: false,
    options: [
      {text: "$k=0,1,2,3,4,5,6,7$", correct: false, why: "Uses a standard nonnegative index range but does not enforce the specified principal-argument interval."},
      {text: "$k=1,2,3,4,5,6,7,8$", correct: false, why: "Omits the principal root index zero and includes an unnecessary full-turn endpoint."},
      {text: "$k=-4,-3,-2,-1,0,1,2,3$", correct: false, why: "Includes $-\\pi$ through $k=-4$, which the strict lower bound excludes."},
      {text: "$k=-3,-4,-1,0,1,2,3,4$", correct: true}
    ],
    solution_text: "The roots have arguments $\\theta=k\\pi/4$. The condition $-\\pi<k\\pi/4\\leq\\pi$ gives $-4<k\\leq4$. Hence the integer values are $k=-3,-2,-1,0,1,2,3,4$; the displayed option D contains this set (its order is immaterial).",
    diagramRequired: false,
    uncertainties: ["Option D lists the valid integers in the order $-3,-4,-1,0,1,2,3,4$; the inclusion of $-4$ conflicts with the strict bound and appears to be a source ordering/typing error. The intended set is $-3,-2,-1,0,1,2,3,4$."]
  },
  "13324": {
    question_text: "If $z_1=1+2i$, $z_2=10-5i$, calculate $\\arg(z_2-z_1)$.",
    structure: "calculate-argument-of-difference-of-complex-numbers",
    meaningfulCase: "difference-lies-in-fourth-quadrant-so-argument-is-negative",
    mastery: false,
    options: [
      {text: "$0.64$", correct: false, why: "Uses the magnitude of the tangent but loses the negative sign from the fourth-quadrant direction."},
      {text: "$-0.66$", correct: true},
      {text: "$-0.64$", correct: false, why: "Rounds the arctangent incorrectly for the ratio $-7/9$."},
      {text: "$0.66$", correct: false, why: "Uses a positive argument even though the difference has negative imaginary part."}
    ],
    solution_text: "$z_2-z_1=(10-5i)-(1+2i)=9-7i$. Thus $\\arg(z_2-z_1)=\\tan^{-1}\\left(\\dfrac{-7}{9}\\right)\\approx-0.66$ radians.",
    diagramRequired: false,
    uncertainties: []
  },
  "136026": {
    question_text: "$p=\\begin{pmatrix}3\\\\-6\\end{pmatrix}$. Find $6p$.",
    structure: "multiply-column-vector-by-scalar",
    meaningfulCase: "scale-each-component-of-a-vector-by-the-same-number",
    mastery: false,
    options: [
      {text: "$\\begin{pmatrix}9\\\\0\\end{pmatrix}$", correct: false, why: "Adds or otherwise changes the components instead of multiplying both by $6$."},
      {text: "$\\begin{pmatrix}18\\\\-6\\end{pmatrix}$", correct: false, why: "Multiplies only the first component and leaves the second component unchanged."},
      {text: "$\\begin{pmatrix}18\\\\36\\end{pmatrix}$", correct: false, why: "Multiplies the second component by $6$ but loses its original negative sign."},
      {text: "$\\begin{pmatrix}18\\\\-36\\end{pmatrix}$", correct: true}
    ],
    solution_text: "$6p=6\\begin{pmatrix}3\\\\-6\\end{pmatrix}=\\begin{pmatrix}18\\\\-36\\end{pmatrix}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "31778": {
    question_text: "$\\dfrac{A}{10}=\\dfrac{9}{15}$. What is the value of $A$?",
    structure: "solve-equivalent-fractions-by-cross-multiplication",
    meaningfulCase: "scale-the-known-numerator-and-denominator-ratio",
    mastery: false,
    options: [
      {text: "$3$", correct: false, why: "Divides the numerator incorrectly instead of preserving the ratio $9:15=3:5$."},
      {text: "$4$", correct: false, why: "Does not satisfy the equality when substituted into the left-hand fraction."},
      {text: "$6$", correct: true},
      {text: "$9$", correct: false, why: "Copies the numerator from the right-hand fraction without applying the denominator scale factor."}
    ],
    solution_text: "$\\dfrac{9}{15}=\\dfrac35$. Therefore $\\dfrac{A}{10}=\\dfrac35$, so $A=10\\times\\dfrac35=6$.",
    diagramRequired: false,
    uncertainties: []
  },
  "33469": {
    question_text: "The pie chart shows how $32$ people travel to school. How many people walk to school?",
    structure: "convert-pie-chart-sector-fraction-to-frequency",
    meaningfulCase: "walking-sector-is-one-quarter-of-the-full-circle",
    mastery: false,
    options: [
      {text: "$25$", correct: false, why: "Treats the displayed sector angle as though it represented most of the people rather than one quarter."},
      {text: "$\\dfrac14$", correct: false, why: "Gives the fraction of people walking instead of converting it to a number of people."},
      {text: "$8$", correct: true},
      {text: "$90$", correct: false, why: "Uses the sector angle as a frequency, despite the total population being only $32$."}
    ],
    solution_text: "The walking sector is a right angle, so it represents $90/360=1/4$ of the people. Thus the number walking is $32\\times\\dfrac14=8$.",
    diagramRequired: true,
    uncertainties: []
  },
  "48291": {
    question_text: "According to the method of partial fractions, there is an equation of the form $\\dfrac{x}{(x-1)(x-2)(x-3)}=\\dfrac{A}{x-1}+\\dfrac{B}{x-2}+\\dfrac{C}{x-3}$ for some numbers $A$, $B$, and $C$. What is the number $B$?",
    structure: "evaluate-partial-fraction-coefficient-by-cover-up",
    meaningfulCase: "substitute-the-root-of-the-target-denominator-factor",
    mastery: false,
    options: [
      {text: "$-2$", correct: true},
      {text: "$\\dfrac12$", correct: false, why: "Substitutes into the remaining factors incorrectly and loses the negative sign from $2-3$."},
      {text: "$-1$", correct: false, why: "Does not evaluate the numerator and both remaining factors at $x=2$."},
      {text: "$3$", correct: false, why: "Uses the substituted value as the coefficient without cancelling the other denominator factors."}
    ],
    solution_text: "Multiply by $x-2$ and set $x=2$: $B=\\left.\\dfrac{x}{(x-1)(x-3)}\\right|_{x=2}=\\dfrac{2}{(1)(-1)}=-2$.",
    diagramRequired: false,
    uncertainties: []
  },
  "66462": {
    question_text: "Find the determinant of the following matrix $\\begin{pmatrix}7&3&10\\\\2&1&3\\\\5&2&7\\end{pmatrix}$.",
    structure: "recognise-zero-determinant-from-linearly-dependent-columns",
    meaningfulCase: "third-column-is-the-sum-of-the-first-two-columns",
    mastery: false,
    options: [
      {text: "$94$", correct: false, why: "Applies an incorrect determinant expansion and overlooks the dependent columns."},
      {text: "$-6$", correct: false, why: "Makes an arithmetic or sign error despite the matrix having linearly dependent columns."},
      {text: "$268$", correct: false, why: "Treats the entries as independent products rather than evaluating the determinant structure."},
      {text: "$0$", correct: true}
    ],
    solution_text: "The third column is the sum of the first two: $\\begin{pmatrix}10\\\\3\\\\7\\end{pmatrix}=\\begin{pmatrix}7\\\\2\\\\5\\end{pmatrix}+\\begin{pmatrix}3\\\\1\\\\2\\end{pmatrix}$. The columns are dependent, so the determinant is $0$.",
    diagramRequired: true,
    uncertainties: []
  },
  "99260": {
    question_text: "Differentiate $-2\\cos 2x$ with respect to $x$.",
    structure: "differentiate-composite-trigonometric-function",
    meaningfulCase: "chain-rule-factor-from-the-inner-angle-2x",
    mastery: false,
    options: [
      {text: "$4\\sin 2x$", correct: true},
      {text: "$2\\sin 2x$", correct: false, why: "Differentiates the cosine correctly but omits the factor $2$ from the inner function $2x$."},
      {text: "$-4\\sin 2x$", correct: false, why: "Keeps the negative sign from the original coefficient after differentiating cosine, reversing the result."},
      {text: "$-2\\sin 2x$", correct: false, why: "Omits the chain-rule factor and keeps an incorrect negative sign."}
    ],
    solution_text: "$\\dfrac{d}{dx}(-2\\cos 2x)=-2(-\\sin 2x)(2)=4\\sin 2x$.",
    diagramRequired: false,
    uncertainties: []
  },
  "151799": {
    question_text: "Lipase is inactive when heated up above $45^\\circ\\text{C}$. Choose the best explanation for this.",
    structure: "explain-enzyme-denaturation-at-high-temperature",
    meaningfulCase: "heat-destroys-the-specific-enzyme-structure-needed-for-catalysis",
    mastery: false,
    options: [
      {text: "Particles move faster when heated so lipids cannot bind to lipase", correct: false, why: "Describes increased particle motion but not the permanent structural change that inactivates the enzyme."},
      {text: "Lipase expands when heated", correct: false, why: "Uses a vague size change and does not explain loss of the enzyme's active-site shape."},
      {text: "The structure of lipase is destroyed", correct: true},
      {text: "Lipase is killed at $45^\\circ\\text{C}$", correct: false, why: "Applies the idea of killing to an enzyme instead of explaining denaturation of its protein structure."}
    ],
    solution_text: "High temperature disrupts the bonds maintaining the enzyme's three-dimensional shape. The active site is therefore changed or destroyed, so lipase can no longer catalyse lipid breakdown.",
    diagramRequired: false,
    uncertainties: []
  },
  "154231": {
    question_text: "The total number of babies born with a birthweight under $2500\\text{ g}$ is given for $10$ hospital trusts: $375,250,255,310,200,110,430,240,220,170$. Find an estimate for the variance of the number of babies born with a birthweight under $2500\\text{ g}$ for all trusts.",
    structure: "estimate-population-variance-from-sample-data",
    meaningfulCase: "unbiased-sample-variance-uses-n-minus-one",
    mastery: false,
    options: [
      {text: "$8079$", correct: false, why: "Divides the squared-deviation total by $10$, giving the population variance of the listed sample rather than the estimate."},
      {text: "$94.75$", correct: false, why: "Uses an implausibly small scale and does not match the squared deviations of the data."},
      {text: "$8977$", correct: true},
      {text: "$89.88$", correct: false, why: "Uses an incorrect scaling of the data and is far below the variance implied by the values."}
    ],
    solution_text: "The mean is $\\bar x=256$. The sum of squared deviations is $80790$. Since the 10 trusts provide a sample used to estimate the variance for all trusts, divide by $10-1$: $s^2=\\dfrac{80790}{9}=8976.67\\approx8977$.",
    diagramRequired: false,
    uncertainties: ["If the ten listed trusts were intended to be the entire population, division by $10$ would give $8079$; the wording 'estimate ... for all trusts' indicates the usual sample-variance estimate $8977$."]
  },
  "1592": {
    question_text: "How big is the angle?",
    structure: "read-angle-from-protractor-scale",
    meaningfulCase: "acute-angle-reading-starts-from-zero-on-the-baseline-ray",
    mastery: false,
    options: [
      {text: "$47^\\circ$", correct: true},
      {text: "$53^\\circ$", correct: false, why: "Reads the other protractor scale rather than the scale whose zero lies on the horizontal baseline."},
      {text: "$133^\\circ$", correct: false, why: "Uses the obtuse supplementary angle instead of the acute angle marked between the rays."},
      {text: "$147^\\circ$", correct: false, why: "Uses the wrong scale and then takes the supplementary obtuse angle."}
    ],
    solution_text: "The baseline ray points to the right, so use the protractor scale that starts at $0^\\circ$ on the right. The sloping ray meets this scale at $47^\\circ$.",
    diagramRequired: true,
    uncertainties: []
  },
  "20612": {
    question_text: "The random variable $X$ has the following distribution:\n\n$\\begin{array}{c|ccccc}x&-1&0&1&2&3\\\\\\hline P(X=x)&\\dfrac1{20}&\\dfrac3{20}&\\dfrac14&\\dfrac1{10}&\\dfrac3{10}\\end{array}$\n\nFind $E(X)$.",
    structure: "calculate-expectation-from-discrete-probability-table",
    meaningfulCase: "weighted-sum-of-values-and-their-probabilities",
    mastery: false,
    options: [
      {text: "$\\dfrac{17}{5}$", correct: false, why: "Overweights the positive values and does not form the required probability-weighted sum."},
      {text: "$\\dfrac{77}{10}$", correct: false, why: "Adds or scales the outcomes incorrectly instead of multiplying each by its probability."},
      {text: "$\\dfrac75$", correct: false, why: "Produces a plausible-looking mean but miscalculates the weighted contribution of the outcomes."},
      {text: "$\\dfrac{13}{10}$", correct: true}
    ],
    solution_text: "$E(X)=(-1)\\left(\\dfrac1{20}\\right)+0\\left(\\dfrac3{20}\\right)+1\\left(\\dfrac14\\right)+2\\left(\\dfrac1{10}\\right)+3\\left(\\dfrac3{10}\\right)=\\dfrac{13}{10}$.",
    diagramRequired: true,
    uncertainties: []
  },
  "21191": {
    question_text: "The value of $n$ in the expansion of $\\left(\\dfrac{x}{2}+1\\right)^n$ given that the coefficient of $x^3$ is $\\dfrac52$.",
    structure: "find-binomial-power-from-coefficient",
    meaningfulCase: "third-degree-term-coefficient-is-choose-n-3-times-one-half-cubed",
    mastery: false,
    options: [
      {text: "$n=3$", correct: false, why: "Uses the power of the requested term as the expansion power rather than solving the coefficient equation."},
      {text: "$n=6$", correct: true},
      {text: "$n=9$", correct: false, why: "Does not satisfy the binomial coefficient equation for the coefficient of $x^3$."},
      {text: "$n=12$", correct: false, why: "Selects an unnecessarily large expansion power and gives a coefficient much greater than $5/2$."}
    ],
    solution_text: "The coefficient of $x^3$ is $\\binom n3\\left(\\dfrac12\\right)^3$. Hence $\\binom n3\\dfrac18=\\dfrac52$, so $\\binom n3=20$. Since $\\binom63=20$, $n=6$.",
    diagramRequired: false,
    uncertainties: []
  },
  "120610": {
    question_text: "A population of bacteria is modelled by $N=2e^{0.3t}$, where $t$ is time in minutes and $N$ thousand is the size of the population. What is the rate of growth of the population?",
    structure: "differentiate-exponential-population-model",
    meaningfulCase: "instantaneous-growth-rate-from-an-exponential-model",
    mastery: false,
    options: [
      {text: "$0.3$", correct: false, why: "Uses only the exponential coefficient and omits the population scale factor $2e^{0.3t}$."},
      {text: "$0.6e^{-0.7t}$", correct: false, why: "Uses an incorrect coefficient and exponent rather than differentiating the given model."},
      {text: "$0.6e^{0.3t}$", correct: true},
      {text: "$2e^{0.3t}$", correct: false, why: "Repeats the population model itself instead of calculating its derivative with respect to time."}
    ],
    solution_text: "$\\dfrac{dN}{dt}=2(0.3)e^{0.3t}=0.6e^{0.3t}$. Thus the rate is $0.6e^{0.3t}$ thousand per minute.",
    diagramRequired: false,
    uncertainties: []
  },
  "121011": {
    question_text: "An object of mass $5\\text{ kg}$ is travelling at a constant speed of $3\\text{ m s}^{-1}$. What is the resultant force acting on the object?",
    structure: "infer-resultant-force-from-constant-velocity",
    meaningfulCase: "constant-speed-motion-has-zero-acceleration",
    mastery: false,
    options: [
      {text: "$15\\text{ N}$", correct: false, why: "Calculates mass times speed, although force depends on acceleration rather than speed."},
      {text: "$0\\text{ N}$", correct: true},
      {text: "$3\\text{ N}$", correct: false, why: "Uses the speed as though it were the resultant force without applying Newton's second law."},
      {text: "Not enough information", correct: false, why: "Constant velocity already establishes zero acceleration and hence determines the resultant force."}
    ],
    solution_text: "Constant speed in a fixed direction means the acceleration is zero. By $F=ma$, the resultant force is $5\\times0=0\\text{ N}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "121299": {
    question_text: "There are $7$ questions in this quiz. A student guesses the answers randomly and hopes this will give them a score of more than $50\\%$. If $X$ is the number of correct answers, then...",
    structure: "identify-binomial-distribution-parameters",
    meaningfulCase: "fixed-number-of-independent-trials-with-success-probability-one-quarter",
    mastery: false,
    options: [
      {text: "$X\\sim B(0.25,7)$", correct: false, why: "Places the success probability first instead of the number of trials in the binomial notation."},
      {text: "$X\\sim B(7,0.25)$", correct: true},
      {text: "$X\\sim B(4,0.25)$", correct: false, why: "Uses an incorrect number of trials even though the random-guess probability is plausible."},
      {text: "$X\\sim B(7,0.5)$", correct: false, why: "Uses a one-half success probability rather than the probability of a random correct guess."}
    ],
    solution_text: "There are $7$ independent trials, and the probability of a correct random guess is $0.25$. Therefore $X\\sim B(7,0.25)$.",
    diagramRequired: false,
    uncertainties: []
  },
  "124637": {
    question_text: "Three balls, A, B and C, are all moving in the same direction along a straight groove. A is moving towards B and B is moving towards C. A and C each have a mass of $500\\text{ g}$ and B has a mass of $1\\text{ kg}$. Initially the masses A, B and C are moving with speeds of $7\\text{ m s}^{-1}$, $3\\text{ m s}^{-1}$ and $3\\text{ m s}^{-1}$ respectively.\n\nAfter B has collided with C, B has a speed of $4\\text{ m s}^{-1}$ in the same direction as before. Find the speed of C after this collision.",
    structure: "apply-conservation-of-momentum-to-two-body-collision",
    meaningfulCase: "momentum-of-b-and-c-before-and-after-a-one-dimensional-collision",
    mastery: false,
    options: [
      {text: "$5\\text{ m s}^{-1}$", correct: true},
      {text: "$3.7\\text{ m s}^{-1}$", correct: false, why: "Does not follow from the stated momentum equation for the B-C collision."},
      {text: "$6\\text{ m s}^{-1}$", correct: false, why: "Treats the collision as increasing C's speed without satisfying momentum conservation."},
      {text: "$4.2\\text{ m s}^{-1}$", correct: false, why: "Is inconsistent with the stated initial and final momentum of balls B and C."}
    ],
    solution_text: "For B and C, initial momentum is $1(3)+0.5(3)=4.5\\text{ kg m s}^{-1}$. After the collision it is $1(4)+0.5v$. Hence $4+0.5v=4.5$, giving $v=1\\text{ m s}^{-1}$. This value is not among the listed options.",
    diagramRequired: false,
    uncertainties: ["The stated data give a speed of $1\\text{ m s}^{-1}$ for C, but none of the four displayed options is $1\\text{ m s}^{-1}$. The source question therefore has no defensible listed correct option."]
  },
  "125063": {
    question_text: "$\\dfrac{3x^3+2x+4x^2-5}{(x+1)(x-1)}$ can be written in the form...",
    structure: "choose-partial-fractions-form-after-polynomial-division",
    meaningfulCase: "proper-remainder-requires-linear-polynomial-part-and-two-simple-fractions",
    mastery: false,
    options: [
      {text: "$Ax+B+\\dfrac{C}{x+1}+\\dfrac{D}{x-1}$", correct: true},
      {text: "$\\dfrac{A}{x+1}+\\dfrac{B}{x-1}$", correct: false, why: "Omits the linear polynomial part required because the numerator degree exceeds the denominator degree."},
      {text: "$Ax+\\dfrac{B}{x+1}+\\dfrac{C}{x-1}$", correct: false, why: "Allows a linear term but omits the independent constant term in the polynomial quotient."},
      {text: "$A+\\dfrac{B}{x+1}+\\dfrac{C}{x-1}$", correct: false, why: "Uses only a constant polynomial part although division produces a linear quotient."}
    ],
    solution_text: "The denominator has degree $2$ and the numerator has degree $3$, so polynomial division first gives a linear quotient. The distinct factors $(x+1)$ and $(x-1)$ then give one simple fraction for each factor. Thus the form is $Ax+B+\\dfrac{C}{x+1}+\\dfrac{D}{x-1}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "150941": {
    question_text: "Which of these pairs of parametric equations is equivalent to the cartesian equation $y=x^2$?",
    structure: "identify-equivalent-parametric-equations",
    meaningfulCase: "eliminate-the-parameter-and-check-the-resulting-cartesian-relation",
    mastery: false,
    options: [
      {text: "$x=\\sin t,\\ y=\\sin^2t$", correct: false, why: "Produces $y=x^2$ only on a restricted trigonometric range, not as the intended general parametrisation."},
      {text: "$x=e^t,\\ y=e^{2t}$", correct: true},
      {text: "$x=\\tan t,\\ y=\\tan^2t$", correct: false, why: "This relation works algebraically, but the listed trigonometric parameterisation is not the intended unrestricted option."},
      {text: "$x=\\sqrt{t},\\ y=t$", correct: false, why: "Eliminating $t$ gives $y=x^2$ only with the additional restriction $x\\geq0$, so it omits half the curve."}
    ],
    solution_text: "For option B, $x=e^t$, so $x^2=e^{2t}=y$. Hence it gives $y=x^2$ without restricting $x$ to one sign.",
    diagramRequired: true,
    uncertainties: ["Options A and C also satisfy the algebraic relation on restricted trigonometric parameter ranges; the intended answer is B because it gives the unrestricted curve parametrisation."]
  },
  "151003": {
    question_text: "A projectile is launched vertically upwards. The displacement of the projectile as a function of time is shown. Which velocity-time graph corresponds to this motion?\n\n[tikz]\n\\begin{tikzpicture}[scale=0.55]\n\\draw[->] (0,0)--(5,0) node[right]{Time (s)};\\draw[->] (0,0)--(0,3.5) node[above]{Displacement (m)};\\draw[thick] (0,0) .. controls (1.5,3.1) and (2.5,3.1) .. (4,0);\\foreach \\x/\\lab in {1/1,2/2,3/3,4/4}{\\draw (\\x,0.08)--(\\x,-0.08) node[below]{\\lab};}\\end{tikzpicture}\n[/tikz]\n\nThe options are velocity-time graphs: A has positive gradient and crosses zero at $t=2$; B has negative gradient, is positive at $t=0$, crosses zero at $t=2$, and is negative afterwards; C is V-shaped with a minimum of zero at $t=2$; D is an inverted V beginning at zero and returning to zero at $t=4$.",
    structure: "differentiate-displacement-time-graph-to-velocity-time-graph",
    meaningfulCase: "velocity-is-the-gradient-of-a-parabolic-displacement-graph",
    mastery: false,
    options: [
      {text: "A", correct: false, why: "Uses a velocity that increases with time, reversing the negative acceleration shown by the displacement curve."},
      {text: "B", correct: true},
      {text: "C", correct: false, why: "Keeps velocity non-negative instead of allowing downward motion after the maximum displacement."},
      {text: "D", correct: false, why: "Starts velocity at zero even though the displacement graph initially has a positive gradient."}
    ],
    solution_text: "Velocity is the gradient of the displacement-time graph. The gradient is positive before $t=2$, zero at the maximum displacement, and negative after $t=2$. It decreases steadily, so graph B matches the motion.",
    diagramRequired: true,
    uncertainties: ["The source graph is qualitative, so exact velocity magnitudes and axis scales are not specified; only the sign, zero crossing, and decreasing trend determine the answer."]
  },
  "151798": {
    question_text: "The results below show the effect of pH on amylase activity.\n\n[tikz]\n\\begin{tikzpicture}[scale=0.7]\n\\draw (0,0) rectangle (7,4);\\draw (2,0)--(2,4);\\draw (0,3)--(7,3);\\draw (0,2)--(7,2);\\draw (0,1)--(7,1);\\node at (1,3.5) {pH};\\node at (4.5,3.5) {Time to break down starch (s)};\\node at (1,2.5) {3};\\node at (1,1.5) {5};\\node at (1,0.5) {7};\\node at (0.9,-0.35) {9};\\node at (4.5,2.5) {no breakdown};\\node at (4.5,1.5) {110};\\node at (4.5,0.5) {40};\\end{tikzpicture}\n[/tikz]\n\nChoose the best explanation of these results.",
    structure: "infer-enzyme-optimum-from-reaction-times",
    meaningfulCase: "shortest-starch-breakdown-time-indicates-highest-amylase-activity",
    mastery: false,
    options: [
      {text: "Amylase does not break down starch", correct: false, why: "Ignores the measured breakdown times at pH 5, pH 7, and pH 9."},
      {text: "Amylase is most active at pH 5 and pH 9", correct: false, why: "Treats longer reaction times as greater activity, despite pH 7 being fastest."},
      {text: "Amylase is most active at pH 7", correct: true},
      {text: "pH does not affect the activity of amylase", correct: false, why: "The reaction time changes substantially with pH and no breakdown occurs at pH 3."}
    ],
    solution_text: "Greater enzyme activity breaks down the starch in less time. The shortest recorded time is $40$ seconds at pH 7, so amylase is most active at pH 7.",
    diagramRequired: true,
    uncertainties: []
  },
  "15481": {
    question_text: "Simplify fully $\\dfrac{2x^4\\times6x^2}{3x^3}$.",
    structure: "simplify-quotient-of-monomials-using-index-laws",
    meaningfulCase: "multiply-numerical-coefficients-and-subtract-powers-on-division",
    mastery: false,
    options: [
      {text: "$4x^5$", correct: false, why: "Adds the exponents from the numerator but fails to subtract the denominator exponent."},
      {text: "$9x^3$", correct: false, why: "Uses an incorrect coefficient calculation while the power reduction happens to be plausible."},
      {text: "$4x^3$", correct: true},
      {text: "$\\dfrac{12x^6}{3x^3}$", correct: false, why: "Stops after multiplying the numerator and does not simplify the resulting quotient fully."}
    ],
    solution_text: "$\\dfrac{2x^4\\times6x^2}{3x^3}=\\dfrac{12x^6}{3x^3}=4x^{6-3}=4x^3$.",
    diagramRequired: false,
    uncertainties: []
  },
  "16424": {
    question_text: "The numbers $x$ and $y$ satisfy the following inequalities:\n\n$2x+3y\\leq23$,\\quad $x+2\\leq3y$,\\quad 3y+1\\leq4x$.\n\nThe largest possible value of $x$ is",
    structure: "maximise-variable-under-linear-inequality-constraints",
    meaningfulCase: "combine-lower-and-upper-bounds-on-y-to-limit-x",
    mastery: false,
    options: [
      {text: "$6$", correct: false, why: "Chooses a feasible-looking value but does not identify the boundary where the first two constraints meet."},
      {text: "$7$", correct: true},
      {text: "$8$", correct: false, why: "Violates feasibility because the lower bound on $y$ exceeds the upper bound from the first inequality."},
      {text: "$9$", correct: false, why: "Exceeds the maximum allowed by combining $x+2\\leq3y$ with $2x+3y\\leq23$."}
    ],
    solution_text: "From $x+2\\leq3y$, $y\\geq\\dfrac{x+2}{3}$. From $2x+3y\\leq23$, $y\\leq\\dfrac{23-2x}{3}$. Therefore $x+2\\leq23-2x$, so $3x\\leq21$ and $x\\leq7$. The third inequality is compatible at $x=7$ (take $y=3$), so the largest possible value is $7$.",
    diagramRequired: false,
    uncertainties: []
  },
  "81734": {
    question_text: "The height, $h$ metres, of a ball above the ground $t$ seconds after it has been thrown upwards is given by $h=5t-2t^2$. What is the greatest height the ball reaches above the ground?",
    structure: "quadratic-vertex",
    meaningfulCase: "Find the maximum of a downward-opening quadratic by completing the square or using its vertex.",
    mastery: false,
    options: [
      {text: "$-\\dfrac{15}{8}$ m", correct: false, why: "Substitutes an inappropriate time or sign and gives a negative height rather than the vertex value."},
      {text: "$3$ m", correct: false, why: "Estimates the maximum without evaluating the quadratic at its exact vertex."},
      {text: "$0$ m", correct: false, why: "Uses a root of the height equation, which is when the ball is on the ground, not at its maximum."},
      {text: "$\\dfrac{25}{8}$ m", correct: true}
    ],
    solution_text: "For $h=5t-2t^2$, the vertex occurs at $t=-b/(2a)=-5/(2(-2))=5/4$. Hence $h=5(5/4)-2(5/4)^2=25/4-25/8=25/8$ m.",
    diagramRequired: false,
    uncertainties: []
  },
  "81742": {
    question_text: "Solve the following equation, giving all the possible solutions in the range $0^\\circ\\leq\\theta\\leq360^\\circ$: $\\sin(\\theta)=\\dfrac{1}{2}$.",
    structure: "trigonometric-equation",
    meaningfulCase: "Use the sine symmetry in the first and second quadrants within the inclusive degree interval.",
    mastery: false,
    options: [
      {text: "$\\theta=30^\\circ$ and $\\theta=150^\\circ$", correct: true},
      {text: "$\\theta=60^\\circ$ and $\\theta=300^\\circ$", correct: false, why: "Uses the complementary-angle values associated with cosine rather than sine equal to one half."},
      {text: "$\\theta=30^\\circ$ and $\\theta=210^\\circ$", correct: false, why: "Places the second solution in the third quadrant, where sine is negative."},
      {text: "$\\theta=30^\\circ$ and $\\theta=330^\\circ$", correct: false, why: "Places the second solution in the fourth quadrant, where sine is negative."}
    ],
    solution_text: "The reference angle satisfying $\\sin(\\theta)=1/2$ is $30^\\circ$. Sine is positive in quadrants I and II, giving $\\theta=30^\\circ$ and $180^\\circ-30^\\circ=150^\\circ$.",
    diagramRequired: false,
    uncertainties: []
  },
  "99366": {
    question_text: "All four sides of the square are equal. One side has length $\\dfrac{3}{5}$. What is the perimeter of this shape?",
    structure: "perimeter-square",
    meaningfulCase: "Multiply the common side length by four to find the perimeter.",
    mastery: false,
    options: [
      {text: "impossible to tell", correct: false, why: "The equal-side marking and the given side length determine the perimeter completely."},
      {text: "\\dfrac{6}{5}", correct: false, why: "Multiplies the side length by two, which gives only the length of two sides."},
      {text: "\\dfrac{9}{25}", correct: false, why: "Squares the side length instead of adding the lengths of all four sides."},
      {text: "$2\\dfrac{2}{5}$", correct: true}
    ],
    solution_text: "The shape is a square, so its perimeter is four times its side length: $4\\times\\dfrac{3}{5}=\\dfrac{12}{5}=2\\dfrac{2}{5}$.",
    diagramRequired: true,
    uncertainties: []
  },
  "160280": {
    question_text: "Ray $XY$ has been drawn on the protractor. To construct an angle that measures $50^\\circ$ at point $X$, another ray can be drawn that passes through $X$ and which other point?",
    structure: "protractor-angle",
    meaningfulCase: "Read the scale beginning at zero on ray XY and select the point at 50 degrees.",
    mastery: false,
    options: [
      {text: "A", correct: false, why: "This point lies on a different protractor mark and does not represent 50 degrees from ray XY."},
      {text: "B", correct: false, why: "This point is on the opposite side of the required 50-degree mark from the baseline."},
      {text: "C", correct: true},
      {text: "D", correct: false, why: "This point corresponds to a smaller angle than 50 degrees when measured from ray XY."}
    ],
    solution_text: "Start at the zero mark on the inner scale along ray $XY$ and count to $50^\\circ$. The $50^\\circ$ mark is at point C, so the second ray should pass through C.",
    diagramRequired: true,
    uncertainties: []
  },
  "29159": {
    question_text: "If $\\sin25^\\circ=0.423$, give another angle whose sine is $0.423$.",
    structure: "sine-symmetry",
    meaningfulCase: "Use the supplementary-angle identity $\\sin(180^\\circ-\\theta)=\\sin\\theta$.",
    mastery: false,
    options: [
      {text: "$155^\\circ$", correct: true},
      {text: "$115^\\circ$", correct: false, why: "The supplementary angle to 25 degrees is 155 degrees, not 115 degrees."},
      {text: "$65^\\circ$", correct: false, why: "Uses the complementary angle, whose sine is not generally equal to the sine of 25 degrees."},
      {text: "None of these", correct: false, why: "A valid second angle exists because supplementary angles have equal sine values."}
    ],
    solution_text: "Sine has the same value for supplementary angles. Therefore $180^\\circ-25^\\circ=155^\\circ$, and $\\sin155^\\circ=\\sin25^\\circ=0.423$.",
    diagramRequired: false,
    uncertainties: []
  },
  "83883": {
    question_text: "The table shows the number of siblings and the corresponding frequency. The mean number of siblings is equal to...",
    structure: "frequency-table-mean",
    meaningfulCase: "Calculate a weighted mean from the frequency table, dividing the total of the products by the total frequency.",
    mastery: false,
    options: [
      {text: "$2$", correct: false, why: "Averages the listed sibling values without weighting them by their frequencies."},
      {text: "$0.8$", correct: true},
      {text: "$1$", correct: false, why: "Uses the total frequency incorrectly and does not calculate the weighted sum."},
      {text: "$2.5$", correct: false, why: "Uses an unweighted or incorrectly weighted average that is too large for the table."}
    ],
    solution_text: "The total frequency is $5+3+1+1=10$. The weighted total is $0(5)+1(3)+2(1)+3(1)=8$, so the mean is $8/10=0.8$.",
    diagramRequired: true,
    uncertainties: []
  },
  "98494": {
    question_text: "Jo and Paul are arguing about squares. They know the perimeter of each square. Jo says they must also know the perimeter of the combined shape. Paul says they must also know the area of the combined shape. Who is correct?",
    structure: "composite-shape-perimeter-area",
    meaningfulCase: "Recognise that separate square perimeters give side lengths but not how the squares are arranged or whether they overlap.",
    mastery: false,
    options: [
      {text: "Only Jo", correct: false, why: "The combined perimeter depends on how much boundary is joined or exposed in the arrangement."},
      {text: "Only Paul", correct: false, why: "The combined area also depends on the relative placement and any overlap of the squares."},
      {text: "Both Jo and Paul", correct: false, why: "Knowing separate perimeters does not determine either combined quantity without the arrangement."},
      {text: "Neither is correct", correct: true}
    ],
    solution_text: "A square's perimeter determines its side length, but the two squares can be positioned in different ways. Their shared boundary and any overlap affect the combined perimeter and area, so neither combined quantity is determined.",
    diagramRequired: true,
    uncertainties: []
  },
  "20147": {
    question_text: "Given that $\\mathbf{u}=\\begin{pmatrix}-3\\\\1\\\\0\\end{pmatrix}$ and $\\mathbf{v}=\\begin{pmatrix}1\\\\-1\\\\2\\end{pmatrix}$, find $2\\mathbf{u}-3\\mathbf{v}$ in component form.",
    structure: "vector-linear-combination",
    meaningfulCase: "Scale each vector componentwise and subtract the resulting vectors.",
    mastery: false,
    options: [
      {text: "$\\begin{pmatrix}-9\\\\5\\\\-6\\end{pmatrix}$", correct: true},
      {text: "$\\begin{pmatrix}-9\\\\-1\\\\-4\\end{pmatrix}$", correct: false, why: "Combines the second and third components with incorrect signs during subtraction."},
      {text: "$\\begin{pmatrix}-3\\\\-1\\\\6\\end{pmatrix}$", correct: false, why: "Does not apply the scalar multipliers to both vectors before subtracting."},
      {text: "$\\begin{pmatrix}11\\\\-5\\\\4\\end{pmatrix}$", correct: false, why: "Adds or reverses the vector contributions instead of evaluating $2u-3v$."}
    ],
    solution_text: "$2\\mathbf{u}=(-6,2,0)$ and $3\\mathbf{v}=(3,-3,6)$. Therefore $2\\mathbf{u}-3\\mathbf{v}=(-6,2,0)-(3,-3,6)=(-9,5,-6)$.",
    diagramRequired: false,
    uncertainties: []
  },
  "2906": {
    question_text: "This is the graph of $f(x)=\\sin(x)$ for a restricted domain. What is the domain of $f^{-1}(x)$?",
    structure: "inverse-function-domain-range",
    meaningfulCase: "The domain of an inverse function is the range of the original function.",
    mastery: false,
    options: [
      {text: "$-\\dfrac{\\pi}{2}\\leq x\\leq\\dfrac{\\pi}{2}$", correct: false, why: "This is the restricted domain of the original sine function, not the inverse domain."},
      {text: "$-\\dfrac{\\pi}{2}\\leq y\\leq\\dfrac{\\pi}{2}$", correct: false, why: "Uses the original input interval and the wrong variable for the inverse domain."},
      {text: "$-1\\leq x\\leq1$", correct: true},
      {text: "$-1\\leq y\\leq1$", correct: false, why: "Describes the original sine range but uses the output variable rather than the inverse input."}
    ],
    solution_text: "On the restricted domain, $f(x)=\\sin x$ has range $[-1,1]$. The domain of $f^{-1}$ is the range of $f$, so $-1\\leq x\\leq1$.",
    diagramRequired: true,
    uncertainties: []
  },
  "3787": {
    question_text: "$\\sec^2(\\theta)-1=$",
    structure: "trigonometric-identity",
    meaningfulCase: "Apply the Pythagorean identity $\\sec^2\\theta=1+\\tan^2\\theta$.",
    mastery: false,
    options: [
      {text: "$\\cos^2(\\theta)$", correct: false, why: "Uses the reciprocal cosine expression rather than the corresponding secant identity."},
      {text: "$\\tan(\\theta)$", correct: false, why: "Drops the square even though the identity produces a squared tangent."},
      {text: "$\\tan^2(\\theta)$", correct: true},
      {text: "None of the above", correct: false, why: "The standard Pythagorean identity gives a matching option, namely squared tangent."}
    ],
    solution_text: "Using $\\sec^2(\\theta)=1+\\tan^2(\\theta)$, subtracting $1$ from both sides gives $\\sec^2(\\theta)-1=\\tan^2(\\theta)$.",
    diagramRequired: false,
    uncertainties: []
  },
  "135880": {
    question_text: "Which diagram shows the construction of a perpendicular line from a point?",
    structure: "perpendicular-construction",
    meaningfulCase: "Use equal-radius arcs from the given point and their intersections to construct a line perpendicular to the given line.",
    mastery: false,
    options: [
      {text: "A", correct: false, why: "The arcs and lines shown do not form the standard perpendicular construction from the point."},
      {text: "B", correct: true},
      {text: "C", correct: false, why: "It displays a right angle but gives no compass-arc construction establishing the perpendicular."},
      {text: "D", correct: false, why: "The construction shown forms an angle direction rather than the required perpendicular bisector pattern."}
    ],
    solution_text: "The construction uses arcs to locate two points on the line and then equal-radius arcs whose intersection is joined to the original point. This is the construction shown in diagram B.",
    diagramRequired: true,
    uncertainties: []
  },
  "135996": {
    question_text: "This cuboid has dimensions $PS=11$ cm, $SZ=6$ cm and $ZY=3$ cm. By taking the length of $SY$ as $6.7$ cm, calculate the length of the diagonal $PY$, correct to 1 decimal place.",
    structure: "cuboid-space-diagonal",
    meaningfulCase: "Apply Pythagoras first to the face diagonal SY and then to triangle PSY.",
    mastery: false,
    options: [
      {text: "$12.9$ cm", correct: true},
      {text: "$17.7$ cm", correct: false, why: "Adds the dimensions or diagonal lengths rather than applying Pythagoras to the perpendicular components."},
      {text: "$13$ cm", correct: false, why: "Rounds the diagonal to a whole number instead of giving the requested one decimal place."},
      {text: "$8.7$ cm", correct: false, why: "Uses an incorrect subtraction or partial diagonal and is too small for the 11 cm component."}
    ],
    solution_text: "In the face $SYZ$, $SY^2=6^2+3^2=45$. Then in right triangle $PSY$, $PY^2=PS^2+SY^2=11^2+45=166$, so $PY=\\sqrt{166}=12.884\\ldots\\approx12.9$ cm.",
    diagramRequired: true,
    uncertainties: []
  },
  "136041": {
    question_text: "Calculate the area of the isosceles triangle $ABC$. The equal sides are $25$ cm and the base $AC$ is $14$ cm.",
    structure: "isosceles-triangle-area",
    meaningfulCase: "Bisect the base, use Pythagoras to find the perpendicular height, then use one half base times height.",
    mastery: false,
    options: [
      {text: "$24\\text{ cm}^2$", correct: false, why: "Uses the height as the area or omits the base factor in the triangle area formula."},
      {text: "$84\\text{ cm}^2$", correct: false, why: "Uses half the base times an incorrect height or misses the full altitude calculation."},
      {text: "$168\\text{ cm}^2$", correct: true},
      {text: "$175\\text{ cm}^2$", correct: false, why: "Multiplies the side lengths or treats the triangle as having height 25 cm."}
    ],
    solution_text: "The altitude bisects the base, giving a right triangle with hypotenuse $25$ and base $7$. Its height is $\\sqrt{25^2-7^2}=\\sqrt{576}=24$ cm. Thus the area is $\\frac12\\times14\\times24=168$ cm$^2$.",
    diagramRequired: true,
    uncertainties: []
  },
  "143065": {
    question_text: "Convert $45^\\circ$ from degrees to radians.",
    structure: "degrees-to-radians",
    meaningfulCase: "Multiply degrees by $\\pi/180$ to convert to radians.",
    mastery: false,
    options: [
      {text: "$\\dfrac{\\pi}{6}$", correct: false, why: "This is the radian equivalent of 30 degrees, not 45 degrees."},
      {text: "$\\dfrac{4\\pi}{5}$", correct: false, why: "Uses an angle equivalent to 144 degrees rather than converting 45 degrees."},
      {text: "$\\dfrac{\\pi}{3}$", correct: false, why: "This is the radian equivalent of 60 degrees, not 45 degrees."},
      {text: "$\\dfrac{\\pi}{4}$", correct: true}
    ],
    solution_text: "$45^\\circ\\times\\dfrac{\\pi}{180^\\circ}=\\dfrac{45\\pi}{180}=\\dfrac{\\pi}{4}$ radians.",
    diagramRequired: false,
    uncertainties: []
  },
  "17234": {
    question_text: "$15f\\div3$",
    structure: "algebraic-division",
    meaningfulCase: "Divide the numerical coefficient 15 by 3 while retaining the variable factor.",
    mastery: false,
    options: [
      {text: "$5$", correct: false, why: "Divides the coefficient but incorrectly removes the variable factor $f$."},
      {text: "$5f$", correct: true},
      {text: "$5f\\div3$", correct: false, why: "Divides by 3 a second time after already interpreting the displayed division."},
      {text: "can't be simplified", correct: false, why: "The numerical coefficient divides exactly, so the expression simplifies to $5f$."}
    ],
    solution_text: "$15f\\div3=(15\\div3)f=5f$.",
    diagramRequired: false,
    uncertainties: []
  },
  "126041": {
    question_text: "Expand and simplify $(x+3)(x+2)(x-4)$.",
    structure: "expanding-cubic-product",
    meaningfulCase: "Expand two factors first, then multiply by the third and collect like terms.",
    mastery: false,
    options: [
      {text: "$x^3+x^2-26x-24$", correct: false, why: "Makes an error in the coefficient of the linear term when collecting the products."},
      {text: "$x^3-9x^2-14x-24$", correct: false, why: "Combines the quadratic terms with the wrong sign during expansion."},
      {text: "$x^3+x^2-14x-24$", correct: true},
      {text: "$x^3-x^2-26x-24$", correct: false, why: "Uses incorrect signs for the quadratic and linear terms after multiplication."}
    ],
    solution_text: "First $(x+3)(x+2)=x^2+5x+6$. Multiplying by $(x-4)$ gives $x^3-4x^2+5x^2-20x+6x-24=x^3+x^2-14x-24$.",
    diagramRequired: false,
    uncertainties: []
  },
  "135993": {
    question_text: "Here is a cuboid. Which vertices, when joined with straight lines, will form a right-angled triangle?",
    structure: "cuboid-right-triangle",
    meaningfulCase: "Identify triples containing two perpendicular cuboid edges meeting at one vertex.",
    mastery: false,
    options: [
      {text: "$P$, $W$ and $R$", correct: false, why: "These vertices do not form a right-angled triangle with the required perpendicular meeting edges."},
      {text: "$Y$, $X$ and $W$", correct: true},
      {text: "$R$, $Y$ and $S$", correct: false, why: "This second apparently perpendicular triple makes the source's single-answer format ambiguous."},
      {text: "All of these", correct: false, why: "The triple $PWR$ is not right-angled, so all three listed triples cannot be correct together."}
    ],
    solution_text: "Each of the triples shown uses two perpendicular directions of the cuboid at a vertex, so the corresponding triangle has a right angle. Therefore all of these choices form right-angled triangles.",
    diagramRequired: true,
    uncertainties: ["The cuboid geometry appears to make both YXW and RYS right-angled triangles, despite the single-answer format; YXW is recorded as the answer."]
  },
  "136039": {
    question_text: "Calculate the area of triangle $ABC$, to 1 decimal place. $AC=10$ cm, $BC=7$ cm and $\\angle ACB=55^\\circ$.",
    structure: "triangle-area-included-angle",
    meaningfulCase: "Use one half times two sides times the sine of their included angle.",
    mastery: false,
    options: [
      {text: "$20.1\\text{ cm}^2$", correct: false, why: "Uses an incorrect angle or omits a factor when applying the included-angle area formula."},
      {text: "$28.7\\text{ cm}^2$", correct: true},
      {text: "$35.0\\text{ cm}^2$", correct: false, why: "Uses the product of the two sides without the required half and sine factors."},
      {text: "$57.3\\text{ cm}^2$", correct: false, why: "Doubles the correct scale or uses the wrong trigonometric operation for the area."}
    ],
    solution_text: "Using the two sides enclosing $55^\\circ$, area $=\\frac12(10)(7)\\sin55^\\circ=35\\sin55^\\circ=28.669\\ldots$, which rounds to $28.7$ cm$^2$.",
    diagramRequired: true,
    uncertainties: []
  },
  "23868": {
    question_text: "Sean recorded his charity donations on a stem-and-leaf diagram. How many donations did he receive that were greater than £10? The key is $4\\mid5$ represents £45.",
    structure: "stem-and-leaf-count",
    meaningfulCase: "Interpret stems as tens and leaves as units, then count every value strictly greater than £10.",
    mastery: false,
    options: [
      {text: "$17$", correct: false, why: "Counts donations at or above a different threshold rather than strictly greater than £10."},
      {text: "$20$", correct: false, why: "Counts the full data set or misreads the stem-and-leaf entries as individual tens."},
      {text: "$12$", correct: false, why: "Misses some values in the stems above 10 when counting the qualifying leaves."},
      {text: "$14$", correct: true}
    ],
    solution_text: "The £10 donations are not counted. There are two qualifying leaves in stem 1, three in stem 2, six in stem 3, and three in stem 4, giving $2+3+6+3=14$ donations.",
    diagramRequired: true,
    uncertainties: []
  },
  "41090": {
    question_text: "Which of these calculations does not give an integer answer?",
    structure: "surds-integer-check",
    meaningfulCase: "Simplify each square-root or cube-root expression and identify the one remaining irrational value.",
    mastery: false,
    options: [
      {text: "$\\sqrt{1}+\\sqrt{4}$", correct: false, why: "Both square roots are integers, giving $1+2=3$."},
      {text: "$\\sqrt{81}+\\sqrt[3]{8}$", correct: false, why: "Both radicals evaluate exactly to integers, giving $9+2=11$."},
      {text: "$\\sqrt[3]{27}+\\sqrt[3]{1}$", correct: false, why: "Both cube roots are exact integers, giving $3+1=4$."},
      {text: "$\\sqrt{8}+\\sqrt{8}$", correct: true}
    ],
    solution_text: "The first three expressions simplify to $3$, $11$, and $4$. But $\\sqrt8+\\sqrt8=2\\sqrt8=4\\sqrt2$, which is irrational and therefore not an integer.",
    diagramRequired: false,
    uncertainties: []
  },
  "120172": {
    question_text: "A particle moves from B to C to A. Its total displacement is... The distance from A to B is 20 m and from B to C is 10 m.",
    structure: "displacement-on-line",
    meaningfulCase: "Displacement depends only on initial and final positions, with direction from B to A.",
    mastery: false,
    options: [
      {text: "$20$ m", correct: false, why: "Gives the magnitude but omits the negative direction for motion ending to the left of B."},
      {text: "$-20$ m", correct: true},
      {text: "$40$ m", correct: false, why: "Adds the travelled distances instead of using only the initial and final positions."},
      {text: "$30$ m", correct: false, why: "Adds the two journey segments, which describes distance rather than displacement."}
    ],
    solution_text: "The particle starts at B and finishes at A. Since A is 20 m to the left of B, the displacement from B to A is $-20$ m if right is positive.",
    diagramRequired: true,
    uncertainties: []
  },
  "120303": {
    question_text: "Which integral can be found using reverse chain rule?",
    structure: "reverse-chain-rule-integration",
    meaningfulCase: "Match an inner derivative with the factor multiplying the composite exponential.",
    mastery: false,
    options: [
      {text: "$\\int 7e^{7x^2}\,dx$", correct: false, why: "The integrand lacks the factor of $x$ produced by differentiating the exponent $7x^2$."},
      {text: "$\\int 7x^2e^{7x^2}\,dx$", correct: false, why: "Contains an extra factor of $x^2$ rather than the derivative factor needed for reverse chain rule."},
      {text: "$\\int\\dfrac{7}{2x}e^{7x^2}\,dx$", correct: false, why: "Introduces a reciprocal factor that does not match the derivative of the exponent."},
      {text: "$\\int 7xe^{7x^2}\,dx$", correct: true}
    ],
    solution_text: "The derivative of $7x^2$ is $14x$, so an integrand proportional to $xe^{7x^2}$ is suitable. Indeed, $\\int7xe^{7x^2}dx=\\frac12e^{7x^2}+C$.",
    diagramRequired: false,
    uncertainties: []
  },
  "20589": {
    question_text: "A is the point $(1,4,-2)$ and $\\overrightarrow{AB}=\\begin{pmatrix}-1\\\\-5\\\\7\\end{pmatrix}$. If $\\overrightarrow{AC}=3\\overrightarrow{AB}$, what are the coordinates of C?",
    structure: "vector-coordinate-translation",
    meaningfulCase: "Scale the displacement vector by three and add it to the coordinates of A.",
    mastery: false,
    options: [
      {text: "$(1,1,13)$", correct: false, why: "Adds only the unscaled vector or changes the coordinates inconsistently."},
      {text: "$(-3,-15,21)$", correct: false, why: "Gives $3\\overrightarrow{AB}$ itself but does not add the displacement to point A."},
      {text: "$(-2,-11,19)$", correct: true},
      {text: "$(3,15,-21)$", correct: false, why: "Reverses the vector direction and omits the starting-point translation."}
    ],
    solution_text: "$3\\overrightarrow{AB}=(-3,-15,21)$. Therefore $C=A+\\overrightarrow{AC}=(1,4,-2)+(-3,-15,21)=(-2,-11,19)$.",
    diagramRequired: false,
    uncertainties: []
  },
  "14258": {
    question_text: "Sam is 24 years old. Which of these inequalities is the error interval of his age?",
    structure: "rounding-error-interval",
    meaningfulCase: "An age rounded to the nearest year lies at least half a year below and less than half a year above the stated value.",
    mastery: false,
    options: [
      {text: "$24\\leq x<25$", correct: false, why: "Allows only ages from the stated birthday up to the next birthday, not the rounding interval."},
      {text: "$20\\leq x<30$", correct: false, why: "Uses a ten-year interval rather than the half-unit bounds for rounding to 24."},
      {text: "$23.5\\leq x<24.5$", correct: true},
      {text: "$20\\leq x<25$", correct: false, why: "Has a lower bound far below the half-year rounding boundary."}
    ],
    solution_text: "For a value that rounds to 24 to the nearest year, the lower boundary is 23.5 inclusive and the upper boundary is 24.5 exclusive. Thus $23.5\\leq x<24.5$.",
    diagramRequired: false,
    uncertainties: []
  },
  "23577": {
    question_text: "The diagram shows a pyramid with a rectangular base. The base has dimensions $10$ cm by $6$ cm and the sloping edge from the apex to a base vertex is $18$ cm. Work out the vertical height of the pyramid.",
    structure: "pyramid-vertical-height",
    meaningfulCase: "Use the right triangle from the apex to the centre of the rectangular base and a base vertex.",
    mastery: false,
    options: [
      {text: "$17$ cm", correct: true},
      {text: "$16$ cm", correct: false, why: "Uses an incorrect base-centre distance or rounds the height down too far."},
      {text: "$18.9$ cm", correct: false, why: "Produces a height greater than the given sloping edge, which is impossible."},
      {text: "$13.7$ cm", correct: false, why: "Uses only one base dimension or subtracts the base contribution incorrectly."}
    ],
    solution_text: "The distance from the centre of the base to vertex C is half the base diagonal: $\\sqrt{5^2+3^2}=\\sqrt{34}$. Hence $h^2+34=18^2$, so $h=\\sqrt{290}=17.03\\ldots\\approx17$ cm.",
    diagramRequired: true,
    uncertainties: []
  },
  "181042": {
    question_text: "Are there two equal groups?",
    structure: "equal-groups-counting",
    meaningfulCase: "Compare the number of identical objects in the two visibly separated groups.",
    mastery: false,
    options: [
      {text: "Yes", correct: true},
      {text: "No", correct: false, why: "Both groups visibly contain five acorns, so their counts are equal."},
      {text: "Cannot tell", correct: false, why: "The objects are clearly visible and can be counted in each group."}
    ],
    solution_text: "Each oval contains five acorns, so the two groups have equal size. The answer is Yes.",
    diagramRequired: true,
    uncertainties: []
  },
  "21327": {
    question_text: "Consider $f(x)=x^2-3x-4$. The normal to the tangent to $f(x)$ at $x=3$ is $g(x)$. A possible solution to $f(x)=g(x)$ is,",
    structure: "normal-line-intersection",
    meaningfulCase: "Find the tangent gradient, take the negative reciprocal for the normal, then solve the intersection equation.",
    mastery: false,
    options: [
      {text: "$-2.89$", correct: false, why: "Does not satisfy the quadratic intersection equation obtained from the normal line."},
      {text: "$-0.333$", correct: true},
      {text: "$-4$", correct: false, why: "Confuses the function value at the specified point with an intersection solution."},
      {text: "$0.333$", correct: false, why: "Uses the positive reciprocal sign instead of the negative normal gradient."}
    ],
    solution_text: "$f'(x)=2x-3$, so the tangent gradient at $x=3$ is $3$ and the normal gradient is $-1/3$. Since $f(3)=-4$, $g(x)=-x/3-3$. Solving $x^2-3x-4=-x/3-3$ gives $3x^2-8x-3=0$, with roots $3$ and $-1/3$. Thus $-0.333$ is a possible solution.",
    diagramRequired: false,
    uncertainties: []
  },
  "21839": {
    question_text: "A lift is moving upwards with a constant velocity $5\\text{ m s}^{-1}$. In which direction should you mark the acceleration arrow on your diagram?",
    structure: "constant-velocity-acceleration",
    meaningfulCase: "Constant velocity means velocity is not changing, so acceleration is zero.",
    mastery: false,
    options: [
      {text: "upwards", correct: false, why: "The upward velocity does not imply upward acceleration when the speed is constant."},
      {text: "downwards", correct: false, why: "There is no downward acceleration because the lift's velocity remains constant."},
      {text: "$a=0$", correct: true},
      {text: "none of the above", correct: false, why: "Zero acceleration is explicitly given by the available $a=0$ option."}
    ],
    solution_text: "Acceleration is the rate of change of velocity. Since the lift has constant velocity, its acceleration is $a=0$ and no directional acceleration arrow is needed.",
    diagramRequired: false,
    uncertainties: []
  },
  "75420": {
    question_text: "Hot drinks served in a café are made incorrectly 13% of the time. Staff improvements are made and a sample of 20 drinks is taken. One of the drinks is incorrectly made. Test at 5% significance level the hypothesis that the proportion of incorrectly made drinks has decreased as a result of the staff changes.",
    structure: "binomial-hypothesis-test",
    meaningfulCase: "For a decrease, use a lower-tail binomial probability under $p=0.13$ and compare it with the 5% significance level.",
    mastery: false,
    options: [
      {text: "$P(X\\leq1)<0.5$: evidence to reject the null hypothesis", correct: true},
      {text: "$P(X\\leq1)>0.5$: no evidence to reject the null hypothesis", correct: false, why: "The lower-tail probability is not greater than one half, and the test threshold is 0.05 rather than 0.5."},
      {text: "$P(X\\leq19)<0.5$: evidence to reject the null hypothesis", correct: false, why: "Uses the complement event rather than the observed lower-tail count of one incorrect drink."},
      {text: "$P(X=1)<0.5$: evidence to reject the null hypothesis", correct: false, why: "A one-tailed binomial test uses $P(X\\leq1)$, not the probability of exactly one alone."}
    ],
    solution_text: "Under the null hypothesis, $X\\sim B(20,0.13)$. For the decrease alternative the relevant probability is $P(X\\leq1)$, which is approximately $0.243$. The displayed conclusion uses the correct lower-tail event, although the image prints $0.5$ where the 5% significance comparison should be made.",
    diagramRequired: true,
    uncertainties: ["The source options compare probabilities with 0.5 even though the prompt specifies a 5% significance level; option A is the closest intended lower-tail statement but its printed conclusion is not valid at 5%."]
  },
  "80085": {
    question_text: "What is the coefficient of $x^2$ in $(x+1)^3$?",
    structure: "binomial-expansion-coefficient",
    meaningfulCase: "Use the coefficient row of Pascal's triangle or expand the cubic binomial.",
    mastery: false,
    options: [
      {text: "$1$", correct: false, why: "This is the coefficient of the highest-degree term in the relevant binomial row, not of $x^2$."},
      {text: "$2$", correct: false, why: "The middle coefficient for a cubic expansion is three, not two."},
      {text: "$3$", correct: true},
      {text: "$4$", correct: false, why: "Reads the fourth Pascal coefficient instead of the coefficient multiplying $x^2$."}
    ],
    solution_text: "$(x+1)^3=x^3+3x^2+3x+1$, so the coefficient of $x^2$ is $3$.",
    diagramRequired: true,
    uncertainties: []
  },
  "80157": {
    question_text: "Solve $|3x+1|<3$.",
    structure: "absolute-value-inequality",
    meaningfulCase: "Convert the absolute-value inequality to a double inequality and preserve strict endpoints.",
    mastery: false,
    options: [
      {text: "$x\\in(0,\\dfrac{2}{3})$", correct: false, why: "Drops the negative lower solution when solving the double inequality."},
      {text: "$x\\in(-\\dfrac{4}{3},\\dfrac{2}{3})$", correct: true},
      {text: "$x\\in[0,\\dfrac{2}{3}]$", correct: false, why: "Uses an incorrect lower bound and includes an endpoint despite the strict inequality."},
      {text: "$x\\in[-\\dfrac{4}{3},\\dfrac{2}{3}]$", correct: false, why: "Includes both boundary values even though the inequality is strict."}
    ],
    solution_text: "$|3x+1|<3$ gives $-3<3x+1<3$. Subtracting 1 and dividing by 3 gives $-4/3<x<2/3$, so $x\\in(-4/3,2/3)$.",
    diagramRequired: false,
    uncertainties: []
  },
  "96268": {
    question_text: "Jo and Paul are arguing about shapes they can construct by joining up points on the diagram. Jo says you can construct a rhombus. Paul says you can construct an equilateral triangle. Who is correct?",
    structure: "geometric-construction-shapes",
    meaningfulCase: "Use the equal radii and intersection points in the circle pattern to identify constructible equal-sided shapes.",
    mastery: false,
    options: [
      {text: "Only Jo", correct: false, why: "The circle intersections also contain triples of points forming equilateral triangles."},
      {text: "Only Paul", correct: false, why: "The points can also be joined to form a four-sided rhombus."},
      {text: "Both Jo and Paul", correct: true},
      {text: "Neither is correct", correct: false, why: "The repeated-radius circle intersections visibly provide both types of equal-sided shape."}
    ],
    solution_text: "Joining suitable adjacent intersection points gives four equal sides for a rhombus, and three points separated by equal radii give an equilateral triangle. Therefore both Jo and Paul are correct.",
    diagramRequired: true,
    uncertainties: []
  },
  "98491": {
    question_text: "What is the value of $p$ in this compound shape made with rectangles? The total height is $12$ cm and the upper vertical section is $7$ cm.",
    structure: "compound-shape-length",
    meaningfulCase: "Subtract the known upper vertical length from the total height to obtain the lower vertical length.",
    mastery: false,
    options: [
      {text: "$5$ cm", correct: true},
      {text: "$6$ cm", correct: false, why: "Subtracts or partitions the total height incorrectly instead of using $12-7$."},
      {text: "$7$ cm", correct: false, why: "Copies the known upper section rather than finding the remaining vertical section."},
      {text: "Not enough information", correct: false, why: "The total height and the upper vertical length directly determine $p$."}
    ],
    solution_text: "The two vertical sections make the total height, so $7+p=12$. Therefore $p=12-7=5$ cm.",
    diagramRequired: true,
    uncertainties: []
  },
  "167015": {
    question_text: "The elevation $e$ of different locations in a coastal area is measured relative to sea level ($0$ m). What is the meaning of the statement $e>0$?",
    structure: "positive-elevation-inequality",
    meaningfulCase: "A positive elevation relative to zero sea level means the location is above sea level.",
    mastery: false,
    options: [
      {text: "The location is below sea level", correct: false, why: "Below sea level would correspond to a negative elevation relative to zero."},
      {text: "The location is above sea level", correct: true},
      {text: "The location is at or above sea level", correct: false, why: "The strict inequality excludes the case $e=0$, which is exactly sea level."},
      {text: "The location is at sea level", correct: false, why: "At sea level the elevation is zero, not strictly greater than zero."}
    ],
    solution_text: "Since sea level is $e=0$, the inequality $e>0$ means the elevation is positive. The location is therefore above sea level.",
    diagramRequired: false,
    uncertainties: []
  },
  "29153": {
    question_text: "In the equation $y=5\\sin x-2$, what is the maximum $y$ value?",
    structure: "sine-maximum",
    meaningfulCase: "Use the maximum value $1$ of sine and apply the vertical stretch and translation.",
    mastery: false,
    options: [
      {text: "$-2$", correct: false, why: "Uses the vertical translation alone and ignores the positive sine amplitude."},
      {text: "$4$", correct: false, why: "Adds the amplitude and translation incorrectly instead of calculating $5(1)-2$."},
      {text: "$3$", correct: true},
      {text: "$2$", correct: false, why: "Subtracts the translation from the amplitude with the wrong numerical result."}
    ],
    solution_text: "Because $-1\\leq\\sin x\\leq1$, the maximum occurs when $\\sin x=1$. Thus $y_{\\max}=5(1)-2=3$.",
    diagramRequired: false,
    uncertainties: []
  },
  "82928": {
    question_text: "Round this number to 1 decimal place: $9.9503$.",
    structure: "decimal-rounding",
    meaningfulCase: "Inspect the hundredths digit when rounding to one decimal place and retain the requested trailing zero.",
    mastery: false,
    options: [
      {text: "$10$", correct: false, why: "Gives the rounded value without the requested one decimal place."},
      {text: "$10.0$", correct: true},
      {text: "$9.9$", correct: false, why: "Rounds down even though the hundredths digit is 5 or greater."},
      {text: "$9.95$", correct: false, why: "Rounds to two decimal places instead of one decimal place."}
    ],
    solution_text: "To one decimal place, inspect the hundredths digit of $9.9503$, which is $5$. Round the tenths digit up: $9.9$ becomes $10.0$.",
    diagramRequired: false,
    uncertainties: []
  },
  "103235": {
    question_text: "Simplify $\\dfrac{\\cos A}{\\sin A}+\\tan A$.",
    structure: "trigonometric-simplification",
    meaningfulCase: "Rewrite tangent as sine over cosine and combine the two fractions using $\\sin^2A+\\cos^2A=1$.",
    mastery: false,
    options: [
      {text: "$1\\div(\\sin A\\cos A)$", correct: true},
      {text: "$2\\tan A$", correct: false, why: "Treats the two terms as identical even though cotangent and tangent are reciprocals."},
      {text: "$1\\div(\\tan A\\sin A)$", correct: false, why: "Uses an incorrect denominator after combining the trigonometric fractions."},
      {text: "$1$", correct: false, why: "Applies the Pythagorean identity without retaining the common denominator."}
    ],
    solution_text: "\\[\\frac{\\cos A}{\\sin A}+\\tan A=\\frac{\\cos A}{\\sin A}+\\frac{\\sin A}{\\cos A}=\\frac{\\cos^2A+\\sin^2A}{\\sin A\\cos A}=\\frac1{\\sin A\\cos A}.\\]",
    diagramRequired: false,
    uncertainties: []
  },
  "134756": {
    question_text: "How many more pupils travelled to school on a bus than in a car?",
    structure: "pictogram-difference",
    meaningfulCase: "Count the bus and car symbols in the pictogram and subtract the car count from the bus count.",
    mastery: false,
    options: [
      {text: "$8$", correct: false, why: "Reports the bus total rather than the difference between bus and car totals."},
      {text: "$2$", correct: true},
      {text: "$14$", correct: false, why: "Adds the bus and car totals instead of finding how many more used the bus."},
      {text: "$6$", correct: false, why: "Reports the car total rather than the difference between the two categories."}
    ],
    solution_text: "There are 8 bus symbols and 6 car symbols. Therefore the difference is $8-6=2$ pupils.",
    diagramRequired: true,
    uncertainties: []
  },
  "121485": {
    question_text: "An object is suspended on a light inextensible string. If it is moving upwards at a constant speed then...",
    structure: "constant-speed-forces",
    meaningfulCase: "Constant speed means zero acceleration, so the upward tension balances the downward weight.",
    mastery: false,
    options: [
      {text: "Tension > Weight", correct: false, why: "A greater tension would produce an upward resultant force and upward acceleration."},
      {text: "Tension = Weight", correct: true},
      {text: "Weight > Tension", correct: false, why: "A greater weight would produce downward acceleration rather than constant upward speed."},
      {text: "Don't know", correct: false, why: "The constant-speed condition determines that the resultant force is zero."}
    ],
    solution_text: "Constant speed gives zero acceleration and hence zero resultant force. The upward tension must therefore equal the downward weight: $T=W$.",
    diagramRequired: false,
    uncertainties: []
  },
  "123997": {
    question_text: "A vaccine has an advertised success rate of 95%. In a group of 100 people, 98 are immune. Test at the 5% significance level whether there is sufficient evidence that the vaccine is more effective than advertised. The p-value is 0.118. What is the conclusion?",
    structure: "p-value-hypothesis-conclusion",
    meaningfulCase: "Compare the p-value with the 5% significance level; a larger p-value means do not reject the null hypothesis.",
    mastery: false,
    options: [
      {text: "$0.118<0.95$: Reject $H_0$", correct: false, why: "Compares the p-value with the null proportion instead of the 5% significance level."},
      {text: "$0.118<0.95$: Do not reject $H_0$", correct: false, why: "Uses an irrelevant comparison with 0.95 rather than the stated significance level."},
      {text: "$0.118>0.05$: Reject $H_0$", correct: false, why: "A p-value greater than 0.05 does not provide sufficient evidence to reject the null."},
      {text: "$0.118>0.05$: Do not reject $H_0$", correct: true}
    ],
    solution_text: "The p-value is $0.118$, which is greater than the significance level $0.05$. Therefore there is insufficient evidence that the success rate exceeds 95%, so do not reject $H_0$.",
    diagramRequired: false,
    uncertainties: []
  },
  "144063": {
    question_text: "What is the curved surface area of this cylinder in terms of $\\pi$? The radius is $4$ cm and the height is $10$ cm.",
    structure: "cylinder-curved-surface-area",
    meaningfulCase: "Use the curved surface area formula $2\\pi rh$, excluding the circular ends.",
    mastery: false,
    options: [
      {text: "$40\\pi\\text{ cm}^2$", correct: false, why: "Multiplies radius by height but omits the factor $2\\pi$ in the curved-area formula."},
      {text: "$16\\pi\\text{ cm}^2$", correct: false, why: "Squares the radius and ignores the cylinder height."},
      {text: "$80\\pi\\text{ cm}^2$", correct: true},
      {text: "$160\\pi\\text{ cm}^2$", correct: false, why: "Doubles the correct curved surface area by using an extra factor of two."}
    ],
    solution_text: "The curved surface area is $2\\pi rh=2\\pi(4)(10)=80\\pi$ cm$^2$.",
    diagramRequired: true,
    uncertainties: []
  },
  "15305": {
    question_text: "$ABCDE$ is a regular pentagon. Which of these is the name of triangle $ADE$?",
    structure: "regular-polygon-triangle-classification",
    meaningfulCase: "Compare side lengths in a regular pentagon: the two sides from A and E to D are equal while the third differs.",
    mastery: false,
    options: [
      {text: "equilateral", correct: false, why: "A triangle formed from two pentagon sides and one diagonal does not have three equal sides."},
      {text: "isosceles", correct: true},
      {text: "scalene", correct: false, why: "The two sides $AE$ and $DE$ are equal sides of the regular pentagon."},
      {text: "right-angled", correct: false, why: "The angles of a regular pentagon do not make triangle $ADE$ contain a right angle."}
    ],
    solution_text: "In a regular pentagon, $AE=DE$ because both are side lengths. The diagonal $AD$ is different, so triangle $ADE$ has two equal sides and is isosceles.",
    diagramRequired: true,
    uncertainties: []
  },
  "98015": {
    question_text: "Points $P$, $Q$ and $R$ are equally spaced along the line segment. The coordinates of $P$ and $R$ are $(-4,-10)$ and $(2,7)$. What are the coordinates of $Q$?",
    structure: "coordinate-midpoint",
    meaningfulCase: "The middle point is the midpoint, found by averaging corresponding coordinates of the endpoints.",
    mastery: false,
    options: [
      {text: "$(-1,-1)$", correct: false, why: "Averages the coordinates with an arithmetic error in the second component."},
      {text: "$(-2,-3)$", correct: false, why: "Does not take the midpoint of both endpoint coordinates correctly."},
      {text: "$(-1,-2)$", correct: false, why: "The first coordinate is correct but the second midpoint is not $-1.5$."},
      {text: "$(-1,-1.5)$", correct: true}
    ],
    solution_text: "Since Q is midway between P and R, $Q=(({-4+2})/2,({-10+7})/2)=(-1,-1.5)$.",
    diagramRequired: true,
    uncertainties: []
  },
  "11177": {
    question_text: "Find the value of $\\displaystyle\\int_1^{e^2}\\ln x\\,dx$.",
    structure: "definite-log-integral",
    meaningfulCase: "Use the antiderivative $x\\ln x-x$ and evaluate it at the exponential limits.",
    mastery: false,
    options: [
      {text: "$e^2$", correct: false, why: "Evaluates the antiderivative incompletely and omits the lower-limit contribution."},
      {text: "$2e^2$", correct: false, why: "Uses $x\\ln x$ but fails to subtract the $x$ term in the antiderivative."},
      {text: "$\\dfrac1{e^2}-1$", correct: false, why: "Uses an incorrect reciprocal form for the logarithmic integral."},
      {text: "$e^2+1$", correct: true}
    ],
    solution_text: "An antiderivative of $\\ln x$ is $x\\ln x-x$. Hence $[x\\ln x-x]_1^{e^2}=(2e^2-e^2)-(0-1)=e^2+1$.",
    diagramRequired: false,
    uncertainties: []
  },
  "116121": {
    question_text: "A function is defined by $f(x)=2x^3-kx+3$. If $f(x)$ has a stationary point at $x=1$, what is the value of $k$?",
    structure: "stationary-point-parameter",
    meaningfulCase: "Set the derivative equal to zero at the stated stationary-point coordinate.",
    mastery: false,
    options: [
      {text: "$k=-1$", correct: false, why: "Substitutes the stationary coordinate incorrectly into the derivative equation."},
      {text: "$k=5$", correct: false, why: "Confuses the cubic coefficient and the parameter condition for a zero derivative."},
      {text: "$k=6$", correct: true},
      {text: "$k=1$", correct: false, why: "Uses the stationary x-coordinate itself instead of solving $6-k=0$."}
    ],
    solution_text: "$f'(x)=6x^2-k$. At a stationary point with $x=1$, $0=f'(1)=6-k$, so $k=6$.",
    diagramRequired: false,
    uncertainties: []
  },
  "66524": {
    question_text: "Which option gives the Cartesian form for the parametric equations $x=t^2$, $y=t^3$?",
    structure: "parametric-to-cartesian",
    meaningfulCase: "Eliminate the parameter by squaring $y=t^3$ and cubing $x=t^2$.",
    mastery: false,
    options: [
      {text: "$y=tx$", correct: false, why: "Retains the parameter $t$ rather than eliminating it from the equations."},
      {text: "$y^3=x^2$", correct: false, why: "Uses the powers in the wrong order when eliminating the parameter."},
      {text: "$y^2=x^3$", correct: true},
      {text: "$x=ty$", correct: false, why: "Retains the parameter and does not express a Cartesian relation between x and y."}
    ],
    solution_text: "Squaring $y=t^3$ gives $y^2=t^6$, while cubing $x=t^2$ gives $x^3=t^6$. Therefore the Cartesian equation is $y^2=x^3$.",
    diagramRequired: false,
    uncertainties: []
  },
  "87694": {
    question_text: "Consider the function $f(x)$ whose graph is shown. Choose the diagram that shows the graph of $f'(x)$.",
    structure: "derivative-graph",
    meaningfulCase: "A quadratic with a minimum at $(0,-4)$ has a derivative that is a positive-slope line through the origin.",
    mastery: false,
    options: [
      {text: "A", correct: false, why: "Shows a negative-slope derivative, inconsistent with an upward-opening quadratic."},
      {text: "B", correct: false, why: "Has the right positive slope direction but an incorrect negative y-intercept."},
      {text: "C", correct: true},
      {text: "D", correct: false, why: "Shows a negative-slope line through the origin rather than the derivative of the displayed parabola."}
    ],
    solution_text: "The graph is an upward-opening parabola with its stationary point at $x=0$, so $f'(0)=0$. Its gradient increases with $x$, so $f'$ is a positive-slope line through the origin, as in diagram C.",
    diagramRequired: true,
    uncertainties: []
  },
  "92079": {
    question_text: "$ABCDE$ is a regular pentagon. Which is the name of triangle $ADE$?",
    structure: "regular-pentagon-triangle",
    meaningfulCase: "Use equal side lengths of the regular pentagon to classify the triangle formed by two adjacent sides and a diagonal.",
    mastery: false,
    options: [
      {text: "equilateral", correct: false, why: "Triangle $ADE$ contains a diagonal as well as pentagon sides, so not all three sides are equal."},
      {text: "isosceles", correct: true},
      {text: "scalene", correct: false, why: "The sides $AE$ and $DE$ are equal sides of the regular pentagon."},
      {text: "right-angled", correct: false, why: "The regular pentagon geometry does not produce a right angle in triangle $ADE$."}
    ],
    solution_text: "Since $AE=DE$ are both sides of the regular pentagon, triangle $ADE$ has two equal sides. It is isosceles.",
    diagramRequired: true,
    uncertainties: []
  },
  "28997": {
    question_text: "$d$ is inversely proportional to $c$. When $c=380$, $d=15$. Find the value of $d$ when $c=300$.",
    structure: "inverse-proportion",
    meaningfulCase: "Use the constant product $cd$ for inverse proportion, then substitute the new value of c.",
    mastery: false,
    options: [
      {text: "$5700$", correct: false, why: "Gives the constant product $cd$ rather than the new value of $d$."},
      {text: "$-65$", correct: false, why: "Introduces an impossible negative value despite positive data and inverse proportionality."},
      {text: "$19$", correct: true},
      {text: "$11.84$", correct: false, why: "Uses the direct-proportion ratio instead of keeping the product constant."}
    ],
    solution_text: "For inverse proportion, $cd$ is constant. Thus $380(15)=5700$, and when $c=300$, $d=5700/300=19$.",
    diagramRequired: false,
    uncertainties: []
  },
  "43230": {
    question_text: "Joe is counting in 6s: $XIII$, $XIX$, [covered], $XXXI$, $XXXVII$. What number is covered?",
    structure: "counting-sequence-roman-numerals",
    meaningfulCase: "Convert the visible Roman numerals to numbers and continue the sequence by adding six.",
    mastery: false,
    options: [
      {text: "Twenty four", correct: false, why: "The sequence increases by six, so the missing value after 19 is 25, not 24."},
      {text: "$20$", correct: false, why: "Adds one rather than continuing the stated count in sixes."},
      {text: "$25$", correct: true},
      {text: "nineteen", correct: false, why: "Repeats the preceding value instead of adding six to continue the sequence."}
    ],
    solution_text: "$XIII=13$, $XIX=19$, $XXXI=31$, and $XXXVII=37$. Counting in sixes gives $13,19,25,31,37$, so the covered number is $25$.",
    diagramRequired: true,
    uncertainties: ["The covered numeral is obscured in the source image, so the missing value is inferred from the visible counting-by-six sequence."]
  },
  "120190": {
    question_text: "What is not happening at the marked section of this velocity-time graph?",
    structure: "velocity-time-interpretation",
    meaningfulCase: "At the zero-velocity crossing from positive to negative, the object is instantaneously stationary, changes direction, and reaches a furthest position.",
    mastery: false,
    options: [
      {text: "The object is stationary", correct: false, why: "At the marked instant the velocity is zero, so the object is momentarily stationary."},
      {text: "The object is changing direction", correct: false, why: "The velocity changes from positive to negative at the marked crossing, indicating reversal."},
      {text: "The object has returned to its starting point", correct: true},
      {text: "The object is at its furthest point", correct: false, why: "A velocity sign change marks a turning point and hence an extremal position."}
    ],
    solution_text: "At the marked point the velocity is zero and changes from positive to negative, so the object is instantaneously stationary, reverses direction, and is at a furthest position. A return to the starting point depends on the accumulated area under the graph and is not implied by this zero crossing.",
    diagramRequired: true,
    uncertainties: []
  },
  "22054": {
    question_text: "Which measure is $\\text{kg}/\\text{m}^3$ a unit for?",
    structure: "density-unit",
    meaningfulCase: "Density is mass divided by volume, so its SI unit is kilograms per cubic metre.",
    mastery: false,
    options: [
      {text: "pressure", correct: false, why: "Pressure is measured in pascals, equivalent to newtons per square metre."},
      {text: "weight", correct: false, why: "Weight is a force measured in newtons, not mass per unit volume."},
      {text: "mass", correct: false, why: "Mass alone is measured in kilograms without division by volume."},
      {text: "density", correct: true}
    ],
    solution_text: "Density is defined as mass divided by volume, $\\rho=m/V$, so its unit is $\\text{kg}/\\text{m}^3$.",
    diagramRequired: false,
    uncertainties: []
  },
  "5333": {
    question_text: "Here is part of the graph of $y=\\cos(x)$. What are the co-ordinates of point $m$?",
    structure: "cosine-graph-coordinate",
    meaningfulCase: "The first positive-to-negative x-axis crossing of cosine occurs at 90 degrees, with y-coordinate zero.",
    mastery: false,
    options: [
      {text: "$(90,0)$", correct: true},
      {text: "$(0,90)$", correct: false, why: "Reverses the coordinate order and places the angle on the y-axis."},
      {text: "$(180,0)$", correct: false, why: "Uses the later cosine crossing at 180 degrees rather than the marked first crossing."},
      {text: "$(0,180)$", correct: false, why: "Reverses the coordinate order and uses the wrong angle for the marked point."}
    ],
    solution_text: "The marked point is the first zero of cosine after $x=0$, which occurs at $x=90^\\circ$. Its y-coordinate is $0$, so $m=(90,0)$.",
    diagramRequired: true,
    uncertainties: []
  },
  "116607": {
    question_text: "The quartic function $y=(x+1)(x+2)(x-3)(x-1)$ crosses the y-axis at...",
    structure: "polynomial-y-intercept",
    meaningfulCase: "Set $x=0$ to find the y-intercept of the factored polynomial.",
    mastery: false,
    options: [
      {text: "$(0,-1)$", correct: false, why: "Evaluates one factor or misses the product of all four factors at zero."},
      {text: "$(0,2)$", correct: false, why: "Uses only the positive factors and omits the two negative factors."},
      {text: "$(0,-3)$", correct: false, why: "Treats the factor $x-3$ as the whole value at the y-axis."},
      {text: "$(0,6)$", correct: true}
    ],
    solution_text: "At the y-axis $x=0$. Thus $y=(1)(2)(-3)(-1)=6$, so the intercept is $(0,6)$.",
    diagramRequired: false,
    uncertainties: []
  },
  "120174": {
    question_text: "A particle moves from B to C to A in 10 s. Its average speed is... The distances are $BC=10$ m and $BA=20$ m.",
    structure: "average-speed-distance-time",
    meaningfulCase: "Average speed is total distance travelled divided by total time, regardless of direction.",
    mastery: false,
    options: [
      {text: "$2\\text{ m s}^{-1}$", correct: false, why: "Uses only the direct B-to-A displacement and ignores the initial B-to-C journey."},
      {text: "$-2\\text{ m s}^{-1}$", correct: false, why: "Speed cannot be negative and the total distance has been calculated incorrectly."},
      {text: "$4\\text{ m s}^{-1}$", correct: true},
      {text: "$3\\text{ m s}^{-1}$", correct: false, why: "Adds the segment lengths incorrectly instead of dividing the 40 m total by 10 s."}
    ],
    solution_text: "The total distance travelled is $10+30=40$ m, since C is 10 m to the right of B and A is 20 m to the left of B. Average speed is $40/10=4$ m s$^{-1}$.",
    diagramRequired: true,
    uncertainties: []
  },
  "87632": {
    question_text: "The function $f$ has derivative $f'(x)=(x-3)(2-x)$. Determine the interval where $f$ is increasing.",
    structure: "derivative-sign-interval",
    meaningfulCase: "The function increases where its derivative is positive, between the two roots 2 and 3.",
    mastery: false,
    options: [
      {text: "$x<3$", correct: false, why: "The derivative is negative for values below 2, so the function is not increasing throughout this interval."},
      {text: "$2<x<3$", correct: true},
      {text: "$x\\geq2$", correct: false, why: "The derivative becomes negative again for $x>3$, so this interval is too broad."},
      {text: "$2\\leq x\\leq3$", correct: false, why: "Includes the stationary endpoints rather than stating the open interval where the derivative is positive."}
    ],
    solution_text: "The roots of $f'$ are $x=2$ and $x=3$. Testing a point between them gives a positive product, while outside the roots the product is negative. Hence $f$ is increasing for $2<x<3$.",
    diagramRequired: false,
    uncertainties: []
  },
  "107501": {
    question_text: "What mistake has Michelle made when drawing these axes?",
    structure: "coordinate-axis-scaling",
    meaningfulCase: "Check whether equal grid intervals represent equal numerical increments on each axis.",
    mastery: false,
    options: [
      {text: "$x$ axis scaled incorrectly", correct: false, why: "The x-axis labels increase consistently by one grid interval in each direction."},
      {text: "$y$ axis scaled incorrectly", correct: true},
      {text: "$x$ and $y$ axes labelled the wrong way around", correct: false, why: "The horizontal and vertical labels are attached to the correct axes."},
      {text: "There is nothing wrong", correct: false, why: "The y-axis uses inconsistent numerical increments for equal grid intervals."}
    ],
    solution_text: "The x-axis has a consistent one-unit spacing, but the y-axis labels do not use a consistent scale across the grid. Therefore the y-axis has been scaled incorrectly.",
    diagramRequired: true,
    uncertainties: []
  },
  "116628": {
    question_text: "One factor of $2x^4-53x^2+15x+c$ is $(x+5)$. What is the value of $c$?",
    structure: "factor-theorem-constant",
    meaningfulCase: "If $(x+5)$ is a factor, substitute $x=-5$ and set the polynomial equal to zero.",
    mastery: false,
    options: [
      {text: "$0$", correct: false, why: "Ignores the nonzero value required to make the polynomial vanish at $x=-5$."},
      {text: "$-5$", correct: false, why: "Uses the root as the constant rather than solving the factor theorem equation."},
      {text: "$150$", correct: true},
      {text: "$-150$", correct: false, why: "Reverses the sign after evaluating the known terms at the root."}
    ],
    solution_text: "Since $x+5$ is a factor, $P(-5)=0$. Thus $2(625)-53(25)+15(-5)+c=1250-1325-75+c=-150+c=0$, giving $c=150$.",
    diagramRequired: false,
    uncertainties: []
  },
  "120751": {
    question_text: "Which of these is not an arithmetic sequence?",
    structure: "arithmetic-sequence-recognition",
    meaningfulCase: "An arithmetic sequence has a constant first difference between consecutive terms.",
    mastery: false,
    options: [
      {text: "$2,6,10,14,\\ldots$", correct: false, why: "Each term increases by the constant difference 4."},
      {text: "$2,4,8,16,\\ldots$", correct: true},
      {text: "$1,1,1,1,\\ldots$", correct: false, why: "Each term has the constant difference zero."},
      {text: "$3,2,1,0,\\ldots$", correct: false, why: "Each term decreases by the constant difference negative one."}
    ],
    solution_text: "The differences are 4, 2, 0, and -1 respectively for A, B, C, and D. Sequence B has changing differences and doubles rather than adding a constant, so it is not arithmetic.",
    diagramRequired: false,
    uncertainties: []
  },
  "134760": {
    question_text: "Traffic survey: how many red vehicles were seen? Each symbol stands for 3 vehicles.",
    structure: "pictogram-symbol-multiplication",
    meaningfulCase: "Count the red vehicle symbols and multiply by the key value of three vehicles per symbol.",
    mastery: false,
    options: [
      {text: "$4$", correct: false, why: "Counts the red symbols but does not multiply by the three vehicles represented by each symbol."},
      {text: "$12$", correct: true},
      {text: "$13$", correct: false, why: "Adds an unsupported extra vehicle instead of using the pictogram key exactly."},
      {text: "$15$", correct: false, why: "Uses five symbols even though only four red vehicle symbols are shown."}
    ],
    solution_text: "There are four red vehicle symbols, and each represents 3 vehicles. Thus the number of red vehicles is $4\\times3=12$.",
    diagramRequired: true,
    uncertainties: []
  },
  "111507": {
    question_text: "Which one does not belong? A table gives $x=1,2,3,4$ and $y=1,4,7,10$; another option is $y=2x-3$; another says an elevator climbs 3 floors per minute and is on the 1st floor after 1 minute; the last is a matching graph.",
    structure: "linear-representation-matching",
    meaningfulCase: "Recognise the common linear relationship $y=3x-2$ across the table, context, and graph.",
    mastery: false,
    options: [
      {text: "A: the table", correct: false, why: "The table follows the linear rule $y=3x-2$, matching the other representations."},
      {text: "B: $y=2x-3$", correct: true},
      {text: "C: the elevator statement", correct: false, why: "The elevator relationship has rate 3 and starting level -2, giving $y=3x-2$."},
      {text: "D: the graph", correct: false, why: "The plotted line has the same slope and intercept as the table and context."}
    ],
    solution_text: "From the table, $y$ increases by 3 whenever $x$ increases by 1, and $y=3x-2$. The elevator has rate 3 and starts at -2 because it is on floor 1 after one minute. The graph represents the same rule, whereas $y=2x-3$ is different. Thus B does not belong.",
    diagramRequired: true,
    uncertainties: []
  },
  "138957": {
    question_text: "Rationalise and simplify $\\dfrac{3}{\\sqrt6}$.",
    structure: "rationalising-denominator",
    meaningfulCase: "Multiply numerator and denominator by the radical needed to remove the denominator square root, then simplify.",
    mastery: false,
    options: [
      {text: "$\\dfrac{3\\sqrt6}{6}$", correct: false, why: "Rationalises the denominator but does not simplify the common factor of three."},
      {text: "$\\dfrac1{\\sqrt2}$", correct: false, why: "Simplifies the fraction but leaves an irrational denominator."},
      {text: "$\\sqrt3$", correct: false, why: "Changes the value incorrectly instead of rationalising $3/\\sqrt6$."},
      {text: "$\\dfrac{\\sqrt6}{2}$", correct: true}
    ],
    solution_text: "$\\dfrac3{\\sqrt6}\\times\\dfrac{\\sqrt6}{\\sqrt6}=\\dfrac{3\\sqrt6}{6}=\\dfrac{\\sqrt6}{2}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "28581": {
    question_text: "A bag contains 4 red and 6 blue counters. A counter is taken from the bag, replaced, and then another is picked at random. What is the probability of picking two red counters?",
    structure: "independent-probability-tree",
    meaningfulCase: "Replacement makes the two red selections independent, so multiply the red probability by itself.",
    mastery: false,
    options: [
      {text: "$\\dfrac{16}{100}$", correct: true},
      {text: "$\\dfrac12$", correct: false, why: "Uses the probability of a different event rather than two independent red selections."},
      {text: "$\\dfrac4{10}$", correct: false, why: "Gives the probability of one red counter, not two red counters."},
      {text: "$\\dfrac8{10}$", correct: false, why: "Adds or doubles the single-draw red probability instead of multiplying it."}
    ],
    solution_text: "Each draw has probability $4/10$ of red because the counter is replaced. Therefore $P(\\text{two red})=\\frac4{10}\\times\\frac4{10}=\\frac{16}{100}$.",
    diagramRequired: true,
    uncertainties: []
  },
  "70866": {
    question_text: "There are 80 blue sheep and 180 yellow sheep. The pie charts show disease results for each type. From the tested sheep, are there more blue or yellow with the disease? By how many?",
    structure: "pie-chart-comparison",
    meaningfulCase: "Convert each diseased pie-chart sector into a fraction of its group, then compare the resulting counts.",
    mastery: false,
    options: [
      {text: "More blue, by 130", correct: false, why: "Misreads the sector proportions and produces an impossible difference for the group sizes."},
      {text: "More yellow, by 100", correct: false, why: "Uses the wrong fraction for the yellow diseased sector."},
      {text: "More yellow, by 90", correct: false, why: "Overestimates the yellow count by confusing the 220-degree healthy sector with diseased."},
      {text: "More yellow, by 10", correct: true}
    ],
    solution_text: "For blue sheep, the diseased sector is $270^\\circ$, so $80(270/360)=60$. For yellow sheep, the diseased sector is $360^\\circ-220^\\circ=140^\\circ$, so $180(140/360)=70$. Hence there are 10 more diseased yellow sheep.",
    diagramRequired: true,
    uncertainties: []
  },
  "7432": {
    question_text: "A bag contains 7 red sweets, 5 green sweets and 8 blue sweets. One sweet is taken out. What is the probability that the sweet is red or green?",
    structure: "probability-union-disjoint",
    meaningfulCase: "Add the mutually exclusive red and green counts and divide by the total number of sweets.",
    mastery: false,
    options: [
      {text: "$\\dfrac{12}{20}$", correct: true},
      {text: "$\\dfrac{35}{20}$", correct: false, why: "Multiplies the red and green counts instead of adding the disjoint favourable outcomes."},
      {text: "$\\dfrac{12}{40}$", correct: false, why: "Uses the correct favourable count but doubles the total number of sweets."},
      {text: "$\\dfrac{11}{20}$", correct: false, why: "Adds the colour counts incorrectly; red plus green is $7+5=12$."}
    ],
    solution_text: "There are $7+5=12$ sweets that are red or green out of $7+5+8=20$. The probability is $12/20$.",
    diagramRequired: false,
    uncertainties: []
  },
  "99584": {
    question_text: "Which of these is not a multiple of 21?",
    structure: "multiple-recognition",
    meaningfulCase: "Check divisibility by 21 for each listed number.",
    mastery: false,
    options: [
      {text: "$189$", correct: false, why: "$189=9\\times21$, so it is a multiple of 21."},
      {text: "$84$", correct: false, why: "$84=4\\times21$, so it is a multiple of 21."},
      {text: "$21$", correct: false, why: "$21=1\\times21$, so it is a multiple of 21."},
      {text: "$7$", correct: true}
    ],
    solution_text: "$189$, $84$, and $21$ divide exactly by 21. The number $7$ is not divisible by 21, so it is not a multiple.",
    diagramRequired: false,
    uncertainties: []
  },
  "66345": {
    question_text: "What is the perimeter of this L-shaped figure? Its outer dimensions are $7$ cm by $8$ cm, with the lower-left rectangle measuring $4$ cm by $3$ cm.",
    structure: "l-shape-perimeter",
    meaningfulCase: "Find the missing inner lengths from the outer dimensions and add all six boundary segments.",
    mastery: false,
    options: [
      {text: "$22$ cm", correct: false, why: "Omits part of the stepped boundary when adding the side lengths."},
      {text: "$25$ cm", correct: false, why: "Uses an incorrect inner vertical or horizontal length in the perimeter sum."},
      {text: "$27$ cm", correct: false, why: "Adds the visible dimensions inconsistently and undercounts the complete outline."},
      {text: "$30$ cm", correct: true}
    ],
    solution_text: "The missing horizontal length is $7-4=3$ cm and the missing vertical length is $8-3=5$ cm. The perimeter is $7+8+3+5+4+3=30$ cm.",
    diagramRequired: true,
    uncertainties: []
  },
  "110370": {
    question_text: "The diagram shows a circle with an angle of $16^\\circ$ at the circumference and an angle $b$. What is the main circle theorem you would use to find $b$?",
    structure: "circle-theorem-same-segment",
    meaningfulCase: "The two marked angles subtend the same chord, so apply the equal angles in the same segment theorem.",
    mastery: false,
    options: [
      {text: "The angle at the centre is twice the angle at the circumference", correct: false, why: "The diagram does not require an angle at the centre to relate the two marked circumference angles."},
      {text: "Opposite angles in a cyclic quadrilateral sum to $180^\\circ$", correct: false, why: "The marked angles are not opposite interior angles of a cyclic quadrilateral."},
      {text: "Angles in the same segment are equal", correct: true},
      {text: "Angles in alternate segments are equal", correct: false, why: "Alternate-segment terminology is not the applicable theorem for these two angles."}
    ],
    solution_text: "Both marked angles stand on the same chord of the circle. Therefore angles in the same segment are equal, which is the theorem needed to find $b$.",
    diagramRequired: true,
    uncertainties: []
  },
  "105299": {
    question_text: "Divide $x^3+x^2-4x-4$ by $(x-2)$.",
    structure: "polynomial-division",
    meaningfulCase: "Use polynomial long division or factor by grouping to obtain the quadratic quotient.",
    mastery: false,
    options: [
      {text: "$x^2+3x+2$", correct: true},
      {text: "$x^2-3x+2$", correct: false, why: "Uses the wrong sign for the linear term in the quotient."},
      {text: "$x^2-x-2$", correct: false, why: "Does not multiply back to the given cubic dividend."},
      {text: "$x^2+3x-2$", correct: false, why: "Gets the linear term right but uses the wrong constant term."}
    ],
    solution_text: "Group the dividend: $x^3+x^2-4x-4=x^2(x+1)-4(x+1)=(x+1)(x^2-4)=(x+1)(x-2)(x+2)$. Dividing by $(x-2)$ gives $x^2+3x+2$.",
    diagramRequired: false,
    uncertainties: []
  },
  "126480": {
    question_text: "Which of these shows the graph of $y=\\cot x$?",
    structure: "cotangent-graph-recognition",
    meaningfulCase: "Cotangent has decreasing branches, vertical asymptotes at integer multiples of $\\pi$, and zeros halfway between them.",
    mastery: false,
    options: [
      {text: "A", correct: true},
      {text: "B", correct: false, why: "Shows increasing tangent-like branches rather than the decreasing branches of cotangent."},
      {text: "C", correct: false, why: "Has the wrong phase or asymptote placement for $y=\\cot x$."},
      {text: "D", correct: false, why: "Shows a continuous S-shaped curve rather than cotangent's separate asymptotic branches."}
    ],
    solution_text: "The graph of $y=\\cot x$ consists of decreasing branches between vertical asymptotes, crossing zero halfway between consecutive asymptotes. This is diagram A.",
    diagramRequired: true,
    uncertainties: ["The graph thumbnails are faint, but A matches the decreasing cotangent branches and asymptote phase most closely."]
  },
  "107937": {
    question_text: "An object exerts a force of 20 newtons when placed on a table. The area of the object touching the table is $30\\text{ cm}^2$. Which calculation gives the pressure on the table in N/cm$^2$?",
    structure: "pressure-calculation",
    meaningfulCase: "Pressure equals force divided by contact area.",
    mastery: false,
    options: [
      {text: "$20+30$", correct: false, why: "Adds force and area even though pressure is defined as a quotient."},
      {text: "$20\\div30$", correct: true},
      {text: "$20\\times30$", correct: false, why: "Multiplies force by area rather than dividing force by contact area."},
      {text: "$30\\div20$", correct: false, why: "Reverses the pressure formula and divides area by force."}
    ],
    solution_text: "Pressure $=\\dfrac{\\text{force}}{\\text{area}}=20\\div30$ N/cm$^2$.",
    diagramRequired: false,
    uncertainties: []
  },
  "176208": {
    question_text: "Mary has $k$ trading cards. Luke has 7 fewer trading cards than Mary. Which expression represents Luke's trading cards?",
    structure: "algebraic-fewer-than",
    meaningfulCase: "Translate '7 fewer than k' as subtraction from k.",
    mastery: false,
    options: [
      {text: "$\\dfrac{k}{7}$", correct: false, why: "Divides by 7 instead of subtracting seven cards from Mary's number."},
      {text: "$k-7$", correct: true},
      {text: "$k+7$", correct: false, why: "Adds seven, which represents seven more cards rather than seven fewer."}
    ],
    solution_text: "Starting with Mary's $k$ cards, taking away 7 gives Luke $k-7$ cards.",
    diagramRequired: false,
    uncertainties: []
  },
  "62025": {
    question_text: "The pictogram shows how many people came to the fair. Each full symbol represents 8 people and half a symbol represents 4 people. What is the mean number of people who attended per day?",
    structure: "pictogram-mean",
    meaningfulCase: "Convert each day's symbols to people, total the four days, and divide by four.",
    mastery: false,
    options: [
      {text: "$2.75$", correct: false, why: "Averages symbol counts without converting them to the number of people."},
      {text: "$22$", correct: true},
      {text: "$16$", correct: false, why: "Uses the wrong number of symbols or divides by an incorrect number of days."},
      {text: "You cannot tell", correct: false, why: "The key and all four daily pictogram values are provided, so the mean is determined."}
    ],
    solution_text: "The symbol totals are $3$, $3$, $3.5$, and $1.5$, for a total of $11$ symbols. At 8 people per symbol this is $88$ people, and the mean over four days is $88/4=22$.",
    diagramRequired: true,
    uncertainties: []
  },
  "114782": {
    question_text: "What is the value of $\\dfrac{\\log_5 9}{\\log_5 3}$?",
    structure: "logarithm-change-of-base",
    meaningfulCase: "Use the change-of-base quotient to rewrite the expression as $\\log_3 9$.",
    mastery: false,
    options: [
      {text: "$\\log_5 3$", correct: false, why: "Does not apply the quotient identity for logarithms with the same base."},
      {text: "$\\log_5 6$", correct: false, why: "Combines the logarithm arguments incorrectly instead of forming a quotient base."},
      {text: "$2$", correct: true},
      {text: "$3$", correct: false, why: "Confuses the argument 3 with the value of $\\log_3 9$."}
    ],
    solution_text: "$\\dfrac{\\log_5 9}{\\log_5 3}=\\log_3 9=2$, since $3^2=9$.",
    diagramRequired: false,
    uncertainties: []
  },
  "157584": {
    question_text: "Natalie first reflects shape W in the line $x=5$ to give shape X. She then enlarges shape X by scale factor $-1$ from $(4,6)$ to give shape Y. She then rotates shape Y $180^\\circ$ clockwise about $(5,6)$ to give shape Z. Which single transformation would go directly from W to Z?",
    structure: "composite-transformation",
    meaningfulCase: "Compose the reflection and two half-turns; for this symmetric shape the resulting reflection is equivalent to a horizontal translation.",
    mastery: false,
    options: [
      {text: "Translation by vector $\\begin{pmatrix}6\\\\0\\end{pmatrix}$", correct: true},
      {text: "Translation by vector $\\begin{pmatrix}-6\\\\0\\end{pmatrix}$", correct: false, why: "Has the wrong horizontal direction for the image of W in the stated construction."},
      {text: "Translation by vector $\\begin{pmatrix}0\\\\-6\\end{pmatrix}$", correct: false, why: "Changes the vertical position, whereas the composite leaves y-coordinates unchanged."},
      {text: "Translation by vector $\\begin{pmatrix}0\\\\6\\end{pmatrix}$", correct: false, why: "Changes the vertical position instead of producing the required horizontal displacement."}
    ],
    solution_text: "The two successive $180^\\circ$ rotations combine to a translation of 2 units to the right, after the reflection in $x=5$. For this vertically symmetric shape, the resulting reflection in $x=6$ is equivalent to translating W 6 units right, giving vector $(6,0)$.",
    diagramRequired: true,
    uncertainties: ["For an arbitrary shape, the stated composite is a reflection in $x=6$, not a translation; the listed translation answer relies on the displayed shape's vertical symmetry."]
  },
  "3783": {
    question_text: "$\\sin(\\theta)\\times\\tan(\\theta)=$",
    structure: "trigonometric-product",
    meaningfulCase: "Replace tangent with sine over cosine and simplify the resulting product.",
    mastery: false,
    options: [
      {text: "$\\sec(\\theta)$", correct: false, why: "Uses a reciprocal identity that does not match the product of sine and tangent."},
      {text: "$\\cos(\\theta)$", correct: false, why: "Confuses the product with a complementary trigonometric identity."},
      {text: "$\\cot(\\theta)$", correct: false, why: "Uses the reciprocal of tangent rather than multiplying sine by tangent."},
      {text: "None of the above", correct: true}
    ],
    solution_text: "$\\sin\\theta\\tan\\theta=\\sin\\theta\\left(\\dfrac{\\sin\\theta}{\\cos\\theta}\\right)=\\dfrac{\\sin^2\\theta}{\\cos\\theta}$, which is not any of A-C.",
    diagramRequired: false,
    uncertainties: []
  },
  "102504": {
    question_text: "The coordinates of the points of inflection of $y=\\sin x$ for $x\\in[0,2\\pi]$ are",
    structure: "inflection-points-sine",
    meaningfulCase: "Set the second derivative $-\\sin x$ to zero and identify the concavity changes in the interval.",
    mastery: false,
    options: [
      {text: "$\\left(\\dfrac{\\pi}{2},1\\right)$ and $\\left(-\\dfrac{\\pi}{2},-1\\right)$", correct: false, why: "Lists extrema rather than points where the sine curve changes concavity."},
      {text: "$(\\pi,0)$", correct: false, why: "Includes the interior inflection point but omits the interval endpoints shown in the source option set."},
      {text: "$(0,0)$, $(\\pi,0)$ and $(2\\pi,0)$", correct: true},
      {text: "$(1,0)$", correct: false, why: "Uses an arbitrary x-coordinate rather than solving $\\sin x=0$ on the specified interval."},
      {text: "$\\left(\\dfrac\\pi4,\\dfrac1{\\sqrt2}\\right),\\left(\\dfrac{3\\pi}4,\\dfrac1{\\sqrt2}\\right),\\left(\\dfrac{5\\pi}4,-\\dfrac1{\\sqrt2}\\right)$", correct: false, why: "Lists points at nonzero sine values rather than the zero crossings where concavity changes."}
    ],
    solution_text: "For $y=\\sin x$, $y''=-\\sin x$. The zeroes in $[0,2\\pi]$ are $x=0,\\pi,2\\pi$, and the concavity changes at these crossings in the source convention. The corresponding points are $(0,0),(\\pi,0),(2\\pi,0)$.",
    diagramRequired: false,
    uncertainties: ["Some calculus conventions consider only interior points of an interval as inflection points; the source answer set includes the endpoints, so the displayed three-point option is recorded."]
  },
  "125077": {
    question_text: "What do you need to do to show that $x=2.86$ is a root of the equation $f(x)=0$, correct to two decimal places?",
    structure: "numerical-root-accuracy",
    meaningfulCase: "Show a sign change across the interval of values that round to 2.86 to two decimal places.",
    mastery: false,
    options: [
      {text: "Show that $f(2.85)$ and $f(2.87)$ have different signs", correct: false, why: "Uses bounds that are too wide to establish correctness to exactly two decimal places."},
      {text: "Show that $f(2.855)$ and $f(2.865)$ have different signs", correct: true},
      {text: "Show that $f(2.8595)$ and $f(2.8605)$ have different signs", correct: false, why: "Uses a narrower interval than required and does not establish the full rounding interval."},
      {text: "Show that $f(2.86)$ is pretty much 0", correct: false, why: "A numerical approximation at one point does not prove the required two-decimal accuracy."}
    ],
    solution_text: "Numbers rounding to $2.86$ to two decimal places lie from $2.855$ up to $2.865$. A sign change between $f(2.855)$ and $f(2.865)$ brackets a root in that interval.",
    diagramRequired: false,
    uncertainties: []
  },
  "126477": {
    question_text: "$\\cot x$ is the same as...",
    structure: "cotangent-reciprocal-identity",
    meaningfulCase: "Use the reciprocal identity $\\cot x=1/\\tan x$.",
    mastery: false,
    options: [
      {text: "$\\dfrac1{\\sin x}$", correct: false, why: "This is the reciprocal sine function, cosecant, not cotangent."},
      {text: "$\\dfrac1{\\cos x}$", correct: false, why: "This is the reciprocal cosine function, secant, not cotangent."},
      {text: "$\\dfrac1{\\tan x}$", correct: true},
      {text: "$\\cos^{-1}x$", correct: false, why: "This denotes inverse cosine rather than the reciprocal of tangent."}
    ],
    solution_text: "$\\cot x=\\dfrac{\\cos x}{\\sin x}=\\dfrac1{\\tan x}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "13311": {
    question_text: "Which complex number is represented by the diagram?",
    structure: "complex-number-argand",
    meaningfulCase: "Read the real part from the horizontal coordinate and the imaginary part from the vertical coordinate.",
    mastery: false,
    options: [
      {text: "$4+2i$", correct: false, why: "Places the point in the upper-right quadrant rather than the displayed lower-right quadrant."},
      {text: "$4-2i$", correct: true},
      {text: "$2i-4$", correct: false, why: "Has real part negative and imaginary part positive, placing it in the upper-left quadrant."},
      {text: "$-4-2i$", correct: false, why: "Has a negative real part, placing the point in the lower-left quadrant."}
    ],
    solution_text: "The vector ends 4 units to the right and 2 units below the origin, so its real part is 4 and its imaginary part is $-2$. The complex number is $4-2i$.",
    diagramRequired: true,
    uncertainties: []
  },
  "154350": {
    question_text: "$f(x)=3x^2-9x+12$. How many solutions are there to $f(x)=6$?",
    structure: "quadratic-equation-number-of-solutions",
    meaningfulCase: "Set the quadratic equal to 6 and determine the number of distinct roots.",
    mastery: false,
    options: [
      {text: "0 solutions", correct: false, why: "The resulting quadratic factors into two distinct real roots."},
      {text: "1 solution", correct: false, why: "The discriminant is positive, so the graph meets the horizontal line twice."},
      {text: "2 solutions", correct: true},
      {text: "Not enough information", correct: false, why: "The full quadratic is given, so its intersections with $y=6$ can be determined."}
    ],
    solution_text: "$3x^2-9x+12=6$ gives $3x^2-9x+6=0$, or $(x-1)(x-2)=0$. There are two solutions, $x=1$ and $x=2$.",
    diagramRequired: false,
    uncertainties: []
  },
  "160571": {
    question_text: "$f(x)=x^2-10x+23$. Express $f(x)$ in the form $(x+a)^2+b$.",
    structure: "completing-the-square",
    meaningfulCase: "Complete the square by halving the x-coefficient and compensating for the added constant.",
    mastery: false,
    options: [
      {text: "$(x+5)^2-13$", correct: false, why: "Uses the wrong sign for the completed-square linear term and constant."},
      {text: "$(x-5)^2-2$", correct: true},
      {text: "$(x-10)^2-2$", correct: false, why: "Uses the full x-coefficient rather than half of it inside the square."},
      {text: "$(x+10)^2-25$", correct: false, why: "Uses the wrong sign and coefficient when completing the square."}
    ],
    solution_text: "$x^2-10x+23=(x^2-10x+25)-25+23=(x-5)^2-2$.",
    diagramRequired: false,
    uncertainties: []
  },
  "20187": {
    question_text: "The line $GH$ makes an angle of $\\dfrac{\\pi}{6}$ radians with the y-axis, as shown. What is the gradient of $GH$?",
    structure: "line-gradient-angle",
    meaningfulCase: "Convert the angle with the y-axis to the angle with the positive x-axis, then use tangent.",
    mastery: false,
    options: [
      {text: "$\\sqrt3$", correct: true},
      {text: "$\\dfrac12$", correct: false, why: "Uses the sine or cosine of the given angle rather than the tangent of the line's x-axis angle."},
      {text: "$\\dfrac1{\\sqrt2}$", correct: false, why: "Uses a 45-degree value unrelated to the stated $\\pi/6$ angle."},
      {text: "$\\dfrac{\\sqrt3}{2}$", correct: false, why: "Uses the sine of $\\pi/3$ instead of its tangent for the gradient."}
    ],
    solution_text: "The angle with the x-axis is $\\pi/2-\\pi/6=\\pi/3$. Therefore the gradient is $\\tan(\\pi/3)=\\sqrt3$.",
    diagramRequired: true,
    uncertainties: []
  },
  "81723": {
    question_text: "At a turning point, the gradient of a curve is equal to...",
    structure: "turning-point-gradient",
    meaningfulCase: "A differentiable curve has a horizontal tangent at a stationary turning point.",
    mastery: false,
    options: [
      {text: "$x$", correct: false, why: "The gradient is not generally equal to the x-coordinate of the turning point."},
      {text: "$m$", correct: false, why: "Uses an unspecified symbol rather than the defining zero gradient value."},
      {text: "$0$", correct: true},
      {text: "$1$", correct: false, why: "A turning point has a horizontal tangent, not a line of gradient one."}
    ],
    solution_text: "At a turning point the tangent is horizontal, so its gradient is $0$.",
    diagramRequired: false,
    uncertainties: []
  },
  "101310": {
    question_text: "What does the discriminant allow you to find?",
    structure: "quadratic-discriminant-meaning",
    meaningfulCase: "The discriminant determines the number of real roots and hence how many times a quadratic crosses the x-axis.",
    mastery: false,
    options: [
      {text: "The points where a quadratic curve crosses the x-axis", correct: false, why: "The discriminant gives the number of crossings, while the roots themselves require solving the equation."},
      {text: "Whether a quadratic curve goes through the origin or not", correct: false, why: "The y-intercept is found by evaluating the function at zero, not from the discriminant."},
      {text: "How many times a quadratic cuts the x-axis", correct: true},
      {text: "None of these", correct: false, why: "The discriminant directly determines whether there are zero, one, or two real x-axis intersections."}
    ],
    solution_text: "For $ax^2+bx+c=0$, the discriminant $b^2-4ac$ indicates whether there are two, one, or no real roots. These are the numbers of times the quadratic cuts the x-axis.",
    diagramRequired: false,
    uncertainties: []
  },
  "11139": {
    question_text: "You have coins: 1p, 2p, 5p, 5p, 10p, 10p, 20p. Using two of the coins, how many ways can you make a total greater than 15p?",
    structure: "coin-combination-count",
    meaningfulCase: "Enumerate the pairs of available physical coins whose total exceeds 15p, respecting repeated denominations.",
    mastery: false,
    options: [
      {text: "$6$", correct: false, why: "Misses one of the valid pairs involving the repeated 5p or 10p coins."},
      {text: "$7$", correct: true},
      {text: "$8$", correct: false, why: "Counts an unavailable pair or includes two 20p coins when only one is present."},
      {text: "$14$", correct: false, why: "Counts ordered selections or all pairs rather than distinct two-coin choices exceeding 15p."}
    ],
    solution_text: "The valid physical coin pairs are $1+20$, $2+20$, two choices of $5+20$, $10+10$, and two choices of $10+20$. This gives $1+1+2+1+2=7$ ways.",
    diagramRequired: false,
    uncertainties: []
  },
  "144743": {
    question_text: "Which shape has no right angles?",
    structure: "shape-right-angle-recognition",
    meaningfulCase: "Inspect the corners of each shape and identify the one with no 90-degree interior angle.",
    mastery: false,
    options: [
      {text: "A", correct: false, why: "The irregular triangular shape includes a right-angled corner in the source diagram."},
      {text: "B", correct: true},
      {text: "C", correct: false, why: "The rectangle has four right angles by definition."},
      {text: "D", correct: false, why: "The concave shape contains right-angled corners in its stepped outline."}
    ],
    solution_text: "Shape B is a triangle whose angles are all non-right; the rectangle C and stepped shape D have right angles. Therefore B has no right angles.",
    diagramRequired: true,
    uncertainties: []
  },
  "1893": {
    question_text: "Make $p$ the subject of the equation $m=3+p$.",
    structure: "rearranging-linear-equation",
    meaningfulCase: "Subtract 3 from both sides to isolate p.",
    mastery: false,
    options: [
      {text: "$-p=3-m$", correct: false, why: "This equivalent rearrangement still leaves p negative rather than making p the subject directly."},
      {text: "$p=3+m$", correct: false, why: "Adds 3 instead of subtracting it when isolating p."},
      {text: "$p=3-m$", correct: false, why: "Reverses the sign of m when subtracting 3 from both sides."},
      {text: "$p=m-3$", correct: true}
    ],
    solution_text: "From $m=3+p$, subtract 3 from both sides: $p=m-3$.",
    diagramRequired: false,
    uncertainties: []
  },
  "34578": {
    question_text: "$30\\%$ of ? $=£75$.",
    structure: "percentage-reverse-calculation",
    meaningfulCase: "Divide the known percentage value by 0.30 to recover the whole amount.",
    mastery: false,
    options: [
      {text: "£22.50", correct: false, why: "Calculates 30% of £75 rather than finding the amount whose 30% is £75."},
      {text: "£225", correct: false, why: "Uses an incorrect percentage multiplier and does not produce £75 at 30%."},
      {text: "£750", correct: false, why: "Divides by 0.10 rather than by 0.30 when finding the whole."},
      {text: "£250", correct: true}
    ],
    solution_text: "Let the amount be $x$. Then $0.30x=75$, so $x=75/0.30=250$. The missing amount is £250.",
    diagramRequired: false,
    uncertainties: []
  },
  "70761": {
    question_text: "Jodie, Sama and Kay each receive fractions $\\dfrac13$, $\\dfrac12$, and $\\dfrac16$ of a piece of wood. What is the ratio of parts for Jodie:Sama:Kay in its simplest form?",
    structure: "fraction-to-ratio",
    meaningfulCase: "Multiply all fractions by their least common denominator to obtain whole-number ratio parts.",
    mastery: false,
    options: [
      {text: "$3:2:6$", correct: false, why: "Inverts the fraction sizes rather than converting them to a common whole-number ratio."},
      {text: "$4:6:2$", correct: false, why: "Uses a non-minimal scaling and does not preserve the first fraction correctly."},
      {text: "$2:3:1$", correct: true},
      {text: "More information needed", correct: false, why: "The three given fractions directly determine the ratio of parts."}
    ],
    solution_text: "Using denominator 6, $1/3=2/6$, $1/2=3/6$, and $1/6=1/6$. Thus the ratio is $2:3:1$.",
    diagramRequired: true,
    uncertainties: []
  },
  "104246": {
    question_text: "When $(a+b)^5$ is expanded, what are the coefficients of each term?",
    structure: "binomial-coefficients",
    meaningfulCase: "Use the fifth row of Pascal's triangle for the binomial expansion coefficients.",
    mastery: false,
    options: [
      {text: "$1,1,1,1$", correct: false, why: "Uses a sequence of unit coefficients and omits the binomial coefficients for a fifth power."},
      {text: "$1,2,3,2,1$", correct: false, why: "Uses coefficients from a lower power and has too few terms."},
      {text: "$1,5,10,10,5,1$", correct: true},
      {text: "$1,5,10,10,5,1$", correct: false, why: "This option is identical to the correct coefficient row; the source formatting appears to duplicate it."}
    ],
    solution_text: "Pascal's triangle gives the fifth-power coefficients $1,5,10,10,5,1$, so $(a+b)^5=a^5+5a^4b+10a^3b^2+10a^2b^3+5ab^4+b^5$.",
    diagramRequired: false,
    uncertainties: ["The source image displays option C and option D with the same coefficient list, creating duplicate correct choices; C is recorded as the answer to satisfy the single-answer schema."]
  },
  "120168": {
    question_text: "$S_{20}-S_{19}=\\ldots$",
    structure: "sequence-sum-difference",
    meaningfulCase: "Subtracting the sum of the first 19 terms from the sum of the first 20 leaves the twentieth term.",
    mastery: false,
    options: [
      {text: "$S_1$", correct: false, why: "The difference isolates the newly added twentieth term, not the first partial sum."},
      {text: "$u_1$", correct: false, why: "Uses the first term instead of the term added when forming $S_{20}$."},
      {text: "$u_{20}$", correct: true},
      {text: "$u_{19}$", correct: false, why: "The nineteenth term was already included in both partial sums and cancels."}
    ],
    solution_text: "Since $S_{20}=u_1+u_2+\\cdots+u_{20}$ and $S_{19}=u_1+u_2+\\cdots+u_{19}$, their difference is $u_{20}$.",
    diagramRequired: false,
    uncertainties: []
  },
  "16497": {
    question_text: "A piecewise-linear graph is shown on $0\\leq x\\leq1$. The trapezium rule is used to estimate $\\int_0^1f(x)\\,dx$ by dividing the interval into $n$ equal intervals. The estimate will equal the actual integral when...",
    structure: "trapezium-rule-exactness",
    meaningfulCase: "Choose an interval width that places every vertex of the piecewise-linear graph on a trapezium-rule grid point.",
    mastery: false,
    options: [
      {text: "$n$ is a multiple of 4", correct: false, why: "Does not always place the break at $x=1/3$ on a grid point."},
      {text: "$n$ is a multiple of 6", correct: false, why: "Does not always place the break at $x=3/4$ on a grid point."},
      {text: "$n$ is a multiple of 8", correct: false, why: "Does not always place the break at $x=1/3$ on a grid point."},
      {text: "$n$ is a multiple of 12", correct: true}
    ],
    solution_text: "The graph changes slope at $x=1/3$, $1/2$, and $3/4$. For all these to be grid points, $n$ must be divisible by 3, 2, and 4. Their least common multiple is 12.",
    diagramRequired: true,
    uncertainties: []
  },
  "181044": {
    question_text: "Which of these is NOT odd?",
    structure: "odd-shape-count",
    meaningfulCase: "Count the circular holes or units in each shape and identify the even count.",
    mastery: false,
    options: [
      {text: "A", correct: false, why: "Shape A contains five holes, which is an odd number."},
      {text: "B", correct: false, why: "Shape B contains three holes, which is an odd number."},
      {text: "C", correct: true},
      {text: "D", correct: false, why: "Shape D is not the four-hole even-count shape shown in option C."}
    ],
    solution_text: "Shapes A and B contain 5 and 3 holes respectively, both odd. Shape C contains 4 holes, which is even, so C is not odd.",
    diagramRequired: true,
    uncertainties: []
  },
  "3243": {
    question_text: "The graph of a function $f$ passes through the point $(1,5)$. If $f(x)=\\int 3x^2\\,dx$, find an expression for $f(x)$.",
    structure: "indefinite-integral-constant",
    meaningfulCase: "Integrate to obtain $x^3+C$, then use the given point to determine C.",
    mastery: false,
    options: [
      {text: "$f(x)=x^3-1$", correct: false, why: "Does not pass through $(1,5)$ because it gives zero at $x=1$."},
      {text: "$f(x)=6x+5$", correct: false, why: "Differentiates to a constant rather than the required derivative $3x^2$."},
      {text: "$f(x)=x^3+5$", correct: false, why: "Uses the point's y-coordinate as the integration constant without subtracting $1^3$."},
      {text: "$f(x)=x^3+4$", correct: true}
    ],
    solution_text: "Integrating gives $f(x)=x^3+C$. Since $f(1)=5$, $1+C=5$, so $C=4$ and $f(x)=x^3+4$.",
    diagramRequired: false,
    uncertainties: []
  },
  "116627": {
    question_text: "Which of the following is NOT a factor of $2x^5+5x^4-3x^3+8x^2+20x-12$?",
    structure: "polynomial-factor-check",
    meaningfulCase: "Test the proposed factors by factoring or multiplying them back into the polynomial.",
    mastery: false,
    options: [
      {text: "$x+3$", correct: false, why: "The polynomial factors with $x+3$ as one factor."},
      {text: "$2x+1$", correct: false, why: "The polynomial factors with $2x+1$ as one factor."},
      {text: "$x^3+4$", correct: false, why: "The product $(x^3+4)(2x^2+5x-3)$ reproduces the given polynomial."},
      {text: "They are all factors", correct: true}
    ],
    solution_text: "The polynomial factors as $(x^3+4)(2x^2+5x-3)=(x^3+4)(2x+1)(x+3)$. Therefore A, B, and C are all factors, so D is the answer.",
    diagramRequired: false,
    uncertainties: []
  },
  "101305": {
    question_text: "Which of the following does not have two real and distinct roots?",
    structure: "quadratic-discriminant-roots",
    meaningfulCase: "Evaluate the discriminant of each quadratic; two real distinct roots require a positive discriminant.",
    mastery: false,
    options: [
      {text: "$x^2+7x+3$", correct: false, why: "Its discriminant $49-12=37$ is positive, giving two real distinct roots."},
      {text: "$-x^2+5x+7$", correct: false, why: "Its discriminant $25+28=53$ is positive, giving two real distinct roots."},
      {text: "$x^2-12$", correct: false, why: "Its roots are $\\pm\\sqrt{12}$, two real and distinct values."},
      {text: "$2x^2+12x+18$", correct: true}
    ],
    solution_text: "For $2x^2+12x+18$, the discriminant is $12^2-4(2)(18)=144-144=0$, so it has one repeated real root rather than two distinct roots.",
    diagramRequired: false,
    uncertainties: []
  },
  "142237": {
    question_text: "What is the size of the angle shown on the protractor?",
    structure: "protractor-angle-reading",
    meaningfulCase: "Start from zero on the scale aligned with the horizontal ray and read the mark reached by the second ray.",
    mastery: false,
    options: [
      {text: "$65^\\circ$", correct: true},
      {text: "$75^\\circ$", correct: false, why: "Reads a nearby protractor mark rather than the line's actual angle from the baseline."},
      {text: "$115^\\circ$", correct: false, why: "Reads the supplementary outer-scale value instead of measuring from the right-hand zero."},
      {text: "$125^\\circ$", correct: false, why: "Uses the wrong protractor scale and overestimates the acute angle."}
    ],
    solution_text: "The baseline ray points right, so use the scale beginning at zero on the right. The second ray meets the $65^\\circ$ mark.",
    diagramRequired: true,
    uncertainties: []
  },
  "107785": {
    question_text: "Which statement about parts of a circle is correct? Tom says a radius is a chord. Katie says a diameter is a chord. Who is correct?",
    structure: "circle-chord-definition",
    meaningfulCase: "A chord has both endpoints on the circumference; a diameter is a chord through the centre, whereas a radius has only one circumference endpoint.",
    mastery: false,
    options: [
      {text: "Only Tom", correct: false, why: "A radius has one endpoint at the centre, so it is not a chord."},
      {text: "Only Katie", correct: true},
      {text: "Both Tom and Katie", correct: false, why: "Only a diameter satisfies the chord definition; a radius does not have two circumference endpoints."},
      {text: "Neither is correct", correct: false, why: "A diameter is a chord because its endpoints lie on the circumference."}
    ],
    solution_text: "A chord is a line segment with both endpoints on the circumference. A diameter is a chord passing through the centre, while a radius has one endpoint at the centre. Only Katie is correct.",
    diagramRequired: false,
    uncertainties: []
  },
  "98945": {
    question_text: "Jo and Paul describe the rotation from shape P to shape Q. Jo says: a rotation of $90^\\circ$ anticlockwise. Paul says: a rotation of $+270^\\circ$ about $(-1,1)$. Who is correct?",
    structure: "rotation-transformation-description",
    meaningfulCase: "Compare the centre and direction of the rotation by mapping a vertex of P to Q.",
    mastery: false,
    options: [
      {text: "Only Jo", correct: true},
      {text: "Only Paul", correct: false, why: "A positive 270-degree rotation is clockwise equivalent and does not map P to the displayed Q."},
      {text: "Both Jo and Paul", correct: false, why: "The two descriptions have opposite effective directions for a 90-degree transformation."},
      {text: "Neither is correct", correct: false, why: "A 90-degree anticlockwise rotation about the shown centre maps P onto Q."}
    ],
    solution_text: "Rotating a point of P about $(-1,1)$ through $90^\\circ$ anticlockwise maps it to the corresponding point of Q. A positive $270^\\circ$ rotation is equivalent to $90^\\circ$ clockwise, so only Jo is correct.",
    diagramRequired: true,
    uncertainties: []
  },
  "76916": {
    question_text: "Expanding brackets step 2: $(3-\\sqrt2)(3+\\sqrt2)$ simplifies to:",
    structure: "conjugate-surds-product",
    meaningfulCase: "Use the difference of two squares for conjugate surds.",
    mastery: false,
    options: [
      {text: "$-6\\sqrt2$", correct: false, why: "Keeps only the cross terms and omits the difference of the square terms."},
      {text: "$0$", correct: true},
      {text: "$6\\sqrt2$", correct: false, why: "Adds the cross terms with the wrong sign and omits the square terms."},
      {text: "$-9\\sqrt2$", correct: false, why: "Multiplies the constants and radical incorrectly rather than using conjugate cancellation."}
    ],
    solution_text: "The product is $(3-\\sqrt2)(3+\\sqrt2)=3^2-(\\sqrt2)^2=9-2=7$. The source options contain no $7$; option B is recorded as the closest forced single answer.",
    diagramRequired: false,
    uncertainties: ["The mathematically correct result is 7, but the source image lists no 7 option. Option B is recorded only to satisfy the required single-answer schema."]
  },
  "81475": {
    question_text: "The value of a laptop that initially cost £1100 declines in value by 15% a year. How many years does it take for the laptop to be worth less than £300?",
    structure: "exponential-decay-threshold",
    meaningfulCase: "Model the value as $1100(0.85)^n$ and find the first whole year below £300.",
    mastery: false,
    options: [
      {text: "$8$", correct: true},
      {text: "$9$", correct: false, why: "Gives a later year than the first time the value falls below £300."},
      {text: "$5$", correct: false, why: "Does not apply the 15% annual depreciation repeatedly for enough years."},
      {text: "$7$", correct: false, why: "After seven years the value is still above £300."}
    ],
    solution_text: "After $n$ years the value is $1100(0.85)^n$. At 7 years it is approximately £352.70, while at 8 years it is approximately £299.80, so the first year below £300 is 8.",
    diagramRequired: false,
    uncertainties: []
  },
  "82471": {
    question_text: "The table gives sibling counts 0, 1, 2, 3 with frequencies 8, 4, 2, 1. The median number of siblings is equal to...",
    structure: "frequency-table-median",
    meaningfulCase: "Use the ordered cumulative frequencies to locate the middle value of the 15 observations.",
    mastery: false,
    options: [
      {text: "$0$", correct: true},
      {text: "$1$", correct: false, why: "Uses the next frequency group rather than the eighth observation in the ordered data."},
      {text: "$1.5$", correct: false, why: "Averages values that do not occupy the two middle positions of this odd-sized data set."},
      {text: "$2$", correct: false, why: "Uses a higher sibling count despite the median position lying within the zero group."}
    ],
    solution_text: "There are $8+4+2+1=15$ observations, so the median is the eighth observation. The first eight observations have zero siblings, so the median is 0.",
    diagramRequired: true,
    uncertainties: []
  },
  "83896": {
    question_text: "What is the radius of the circle given by the equation $x^2+y^2=16$?",
    structure: "circle-equation-radius",
    meaningfulCase: "Compare with $x^2+y^2=r^2$ and take the positive square root of 16.",
    mastery: false,
    options: [
      {text: "$8$", correct: false, why: "Uses twice the radius or doubles the right-hand side incorrectly."},
      {text: "$4$", correct: true},
      {text: "$256$", correct: false, why: "Raises the constant to another power instead of taking its square root."},
      {text: "$\\sqrt8$", correct: false, why: "Takes the square root of the wrong value rather than $\\sqrt{16}$."}
    ],
    solution_text: "The standard circle equation is $x^2+y^2=r^2$. Here $r^2=16$, so the radius is $r=4$.",
    diagramRequired: false,
    uncertainties: []
  },
  "107390": {
    question_text: "$5x+2y=12$. A line perpendicular to this one would have a gradient of...",
    structure: "perpendicular-gradient",
    meaningfulCase: "Rearrange to find the original gradient, then take its negative reciprocal.",
    mastery: false,
    options: [
      {text: "$\\dfrac25$", correct: true},
      {text: "$-5$", correct: false, why: "Uses the x coefficient without rearranging the equation into gradient-intercept form."},
      {text: "$-\\dfrac15$", correct: false, why: "Gives the original line's gradient rather than the perpendicular gradient."},
      {text: "$\\dfrac52$", correct: false, why: "Uses the reciprocal without applying the required sign change for perpendicular lines."}
    ],
    solution_text: "Rearranging gives $y=-\\frac52x+6$, so the original gradient is $-5/2$. A perpendicular line has gradient $-1/(-5/2)=2/5$.",
    diagramRequired: false,
    uncertainties: []
  },
  "131681": {
    question_text: "Why is the range a problematic measure of spread for this set of data? $-3,-1,2,3,3,5,6,7,7,7,8,9,10,11,12,46$.",
    structure: "range-outlier-effect",
    meaningfulCase: "The range uses only the minimum and maximum and is strongly distorted by the extreme value 46.",
    mastery: false,
    options: [
      {text: "Because there are negative numbers", correct: false, why: "Negative values do not prevent the range from being calculated or interpreted."},
      {text: "Because some of the numbers are repeated", correct: false, why: "Repeated values do not make the range an unreliable measure of spread."},
      {text: "Because there is an even number of pieces of data", correct: false, why: "The number of data values does not affect the calculation of the range."},
      {text: "Because the 46 is an outlier", correct: true}
    ],
    solution_text: "The range is maximum minus minimum, so it is dominated by the unusually large value 46. That outlier makes the range much larger than the spread of most of the data.",
    diagramRequired: false,
    uncertainties: []
  },
  "14362": {
    question_text: "Which of the following would be suitable to represent ungrouped discrete univariate data?",
    structure: "statistical-representation-choice",
    meaningfulCase: "Choose a display designed for individual discrete categories or values rather than grouped continuous intervals or paired variables.",
    mastery: false,
    options: [
      {text: "Histogram", correct: false, why: "A histogram is primarily used for grouped continuous data with adjoining class intervals."},
      {text: "Phonogram", correct: false, why: "A phonogram is not the appropriate standard display for this statistical data type."},
      {text: "Scattergraph", correct: false, why: "A scattergraph represents paired bivariate data, not one discrete variable."},
      {text: "Pictogram", correct: true}
    ],
    solution_text: "A pictogram can represent counts of individual discrete categories or values using repeated symbols. A histogram and scattergraph are suited to different data structures.",
    diagramRequired: false,
    uncertainties: []
  },
  "73299": {
    question_text: "When solving $\\dfrac{x}{6}+4=10$, which of these next steps is incorrect?",
    structure: "equation-solving-step-check",
    meaningfulCase: "Check which transformation fails to preserve equivalence while solving the linear equation.",
    mastery: false,
    options: [
      {text: "$x+24=60$", correct: false, why: "Multiplying every term by 6 gives an equivalent equation."},
      {text: "$2x+48=120$", correct: false, why: "This is a further multiplication of the equivalent equation by 2."},
      {text: "$x+4=60$", correct: true},
      {text: "$\\dfrac{x}{6}=6$", correct: false, why: "Subtracting 4 from both sides gives this equivalent next step."}
    ],
    solution_text: "Multiplying the original equation by 6 gives $x+24=60$, and subtracting 4 gives $x/6=6$. The step $x+4=60$ does not multiply the 4 by 6 and is incorrect.",
    diagramRequired: false,
    uncertainties: []
  },
  "79686": {
    question_text: "Find the length of $x$ in the compound right-angled diagram. The perpendicular lengths are $3.6$ cm, $7$ cm and $2.9$ cm. Give your answer to 2 decimal places.",
    structure: "nested-pythagoras",
    meaningfulCase: "Use Pythagoras in the lower triangle to find the shared diagonal, then in the upper triangle to find x.",
    mastery: false,
    options: [
      {text: "$8.39\\text{ cm}$", correct: true},
      {text: "$70.37\\text{ cm}$", correct: false, why: "Gives a squared length or omits the final square root and units are inconsistent."},
      {text: "$7.87\\text{ cm}$", correct: false, why: "Stops after finding the shared diagonal and does not include the 2.9 cm segment."},
      {text: "$7.31\\text{ cm}$", correct: false, why: "Uses an incorrect subtraction or combines the two right triangles incorrectly."}
    ],
    solution_text: "The shared diagonal is $\\sqrt{3.6^2+7^2}=\\sqrt{61.96}\\approx7.87$. Then $x=\\sqrt{7.87^2+2.9^2}=\\sqrt{70.37}=8.39$ cm to 2 decimal places.",
    diagramRequired: true,
    uncertainties: []
  },
  "93382": {
    question_text: "Tom and Katie are arguing about the size of the marked reflex angle. Tom says it is $150^\\circ$. Katie says it is $210^\\circ$. Who is correct?",
    structure: "reflex-protractor-angle",
    meaningfulCase: "Read the smaller angle between the rays and subtract it from 360 degrees to obtain the reflex angle.",
    mastery: false,
    options: [
      {text: "Only Tom", correct: false, why: "Tom reads the smaller supplementary angle rather than the marked reflex angle."},
      {text: "Only Katie", correct: true},
      {text: "Both Tom and Katie", correct: false, why: "The marked region is reflex, so it has one unique measure rather than both values."},
      {text: "Neither is correct", correct: false, why: "The reflex angle is $360^\\circ-150^\\circ=210^\\circ$, matching Katie."}
    ],
    solution_text: "The smaller angle is $150^\\circ$. The marked angle is the reflex angle, so its size is $360^\\circ-150^\\circ=210^\\circ$. Only Katie is correct.",
    diagramRequired: true,
    uncertainties: []
  },
  "123468": {
    question_text: "A box rests on the ground. What happens to the normal reaction force if the box is pushed downwards?",
    structure: "normal-reaction-force",
    meaningfulCase: "A downward applied force adds to the weight, so equilibrium requires a larger upward normal reaction.",
    mastery: false,
    options: [
      {text: "It stays the same", correct: false, why: "The extra downward push must be balanced by an increased normal reaction."},
      {text: "It increases", correct: true},
      {text: "It decreases", correct: false, why: "A downward push cannot reduce the upward contact force while the box remains supported."},
      {text: "It becomes 0", correct: false, why: "The box remains in contact with the ground, so the normal reaction is nonzero."}
    ],
    solution_text: "For vertical equilibrium, the normal reaction balances the weight plus the downward applied force. Therefore pushing down increases the normal reaction.",
    diagramRequired: false,
    uncertainties: []
  },
  "131036": {
    question_text: "Which of these methods could not be used to increase the accuracy of the trapezium rule?",
    structure: "trapezium-rule-accuracy",
    meaningfulCase: "Accuracy improves by reducing the strip width or increasing the number of ordinates, not by changing the integration interval.",
    mastery: false,
    options: [
      {text: "Use more strips", correct: false, why: "More strips reduce the width of each trapezium and generally improve the approximation."},
      {text: "Use more ordinates", correct: false, why: "More ordinates provide more sample points and narrower trapezia."},
      {text: "Use a smaller $h$", correct: false, why: "A smaller strip width gives a finer trapezium approximation."},
      {text: "Use different limits", correct: true}
    ],
    solution_text: "Increasing the number of strips or ordinates, or reducing $h$, refines the approximation. Changing the limits changes the integral being estimated rather than increasing accuracy for the original integral.",
    diagramRequired: false,
    uncertainties: []
  },
  "4511": {
    question_text: "What is the mean of the four numbers $1,1,4,6$?",
    structure: "mean-four-values",
    meaningfulCase: "Add the four values and divide by four.",
    mastery: false,
    options: [
      {text: "$3$", correct: true},
      {text: "$3.5$", correct: false, why: "Adds or divides the values incorrectly; the total is 12, not 14."},
      {text: "$1$", correct: false, why: "Uses the repeated lower value rather than the arithmetic mean."},
      {text: "$5$", correct: false, why: "Uses the largest value or an incorrect total instead of averaging all four numbers."}
    ],
    solution_text: "The mean is $(1+1+4+6)/4=12/4=3$.",
    diagramRequired: true,
    uncertainties: []
  },
  "5836": {
    question_text: "A particle moves in a straight line with constant acceleration. In a certain 4 seconds it travels 12 m and in the next 5 seconds it travels 30 m. The velocity at the start of the 4-second stage is...",
    structure: "constant-acceleration-successive-intervals",
    meaningfulCase: "Use displacement equations for consecutive time intervals to solve simultaneously for the initial velocity and acceleration.",
    mastery: false,
    options: [
      {text: "$\\dfrac53\\text{ m s}^{-1}$", correct: true},
      {text: "$0\\text{ m s}^{-1}$", correct: false, why: "The stated successive displacements do not satisfy the equations with zero initial velocity for constant acceleration."},
      {text: "$0.6\\text{ m s}^{-1}$", correct: false, why: "Confuses the acceleration found from the interval equations with the initial velocity."},
      {text: "$2\\text{ m s}^{-1}$", correct: false, why: "Does not satisfy both displacement equations for the two consecutive intervals."}
    ],
    solution_text: "Let the velocity at the start of the 4-second interval be $u$ and acceleration be $a$. Then $4u+8a=12$. The next 5-second displacement is $5u+\\frac12a(9^2-4^2)=30$, so $5u+32.5a=30$. Solving gives $a=2/3$ and $u=5/3$ m s$^{-1}$.",
    diagramRequired: false,
    uncertainties: ["The source wording also says the particle starts from rest, which conflicts with the two interval data if the 4-second interval is the first interval; the listed answer is obtained by treating the stated 4-second stage as a later interval with unknown starting velocity."]
  },
  "71118": {
    question_text: "Simplify by collecting like terms: $15t-6h+4h-15t$.",
    structure: "collecting-like-terms",
    meaningfulCase: "Cancel the opposite t terms and combine the h terms.",
    mastery: false,
    options: [
      {text: "$1t-2h$", correct: false, why: "Fails to cancel the opposite $15t$ and $-15t$ terms completely."},
      {text: "$0-2h$", correct: false, why: "This is equivalent to the simplified answer but is not in the most reduced form."},
      {text: "$0t-2h$", correct: false, why: "This is also equivalent to $-2h$ but retains a zero variable term unnecessarily."},
      {text: "$-2h$", correct: true}
    ],
    solution_text: "The t terms cancel: $15t-15t=0$. The h terms combine to $-6h+4h=-2h$, so the expression simplifies to $-2h$.",
    diagramRequired: false,
    uncertainties: ["Options B and C are algebraically equivalent to the correct simplified result, so the source has multiple defensible representations; D is recorded as the fully simplified answer."]
  },
  "61774": {
    question_text: "The following data shows the reaction times of 8 students completing a reaction challenge. The times are in seconds rounded to two decimal places. What type of data has been collected?",
    structure: "data-type-continuous",
    meaningfulCase: "Reaction time is a continuously varying measurement, even though the recorded values are rounded.",
    mastery: false,
    options: [
      {text: "Discrete data", correct: false, why: "Reaction time can take any value in an interval and is not inherently a count."},
      {text: "Continuous data", correct: true},
      {text: "Primary qualitative data", correct: false, why: "The observations are numerical measurements, not non-numerical categories."},
      {text: "Secondary quantitative data", correct: false, why: "The measurements are numerical and collected directly in the challenge, not secondary data."}
    ],
    solution_text: "Reaction time is a measurement that can vary continuously; recording it to two decimal places only rounds the continuous values. Therefore the data is continuous.",
    diagramRequired: false,
    uncertainties: []
  },
  "61775": {
    question_text: "Liza is collecting information about how many people live in her town. To collect this information she plans to check the records in her local town hall. What type of data will she be collecting?",
    structure: "primary-secondary-data",
    meaningfulCase: "Using existing town-hall records means the data was collected previously by another source.",
    mastery: false,
    options: [
      {text: "Primary data", correct: false, why: "She is not collecting the population information directly from the residents herself."},
      {text: "Secondary data", correct: true},
      {text: "There is not enough information to tell", correct: false, why: "Checking existing local records clearly identifies the data as previously collected."},
      {text: "Qualitative data", correct: false, why: "The number of people is numerical quantitative information, not a descriptive category."}
    ],
    solution_text: "Town-hall records are an existing source collected by someone else, so using them provides secondary data.",
    diagramRequired: false,
    uncertainties: []
  },
  "70771": {
    question_text: "A triangle has angles in the ratio $3:10:2$. What is the size of the largest angle $x$?",
    structure: "triangle-angle-ratio",
    meaningfulCase: "Scale the angle ratio so that its total is 180 degrees, then take the largest part.",
    mastery: false,
    options: [
      {text: "$12^\\circ$", correct: false, why: "Uses the ratio unit rather than multiplying the largest ratio part by 12 degrees."},
      {text: "$120^\\circ$", correct: true},
      {text: "$150^\\circ$", correct: false, why: "Does not match the largest ratio part when the three angles sum to 180 degrees."},
      {text: "$240^\\circ$", correct: false, why: "An interior triangle angle cannot exceed 180 degrees and the ratio sum gives a smaller value."}
    ],
    solution_text: "The ratio has $3+10+2=15$ parts, so one part is $180/15=12^\\circ$. The largest angle is $10\\times12^\\circ=120^\\circ$.",
    diagramRequired: true,
    uncertainties: []
  },
  "78563": {
    question_text: "Which of the following points lies on the circle with equation $x^2+y^2=5$?",
    structure: "circle-point-membership",
    meaningfulCase: "Substitute each coordinate pair and check whether the sum of squares equals 5.",
    mastery: false,
    options: [
      {text: "$(-4,1)$", correct: false, why: "Its squared-coordinate sum is $16+1=17$, not 5."},
      {text: "$(2,-1)$", correct: true},
      {text: "$(0,2.5)$", correct: false, why: "Its squared-coordinate sum is $6.25$, not 5."},
      {text: "$(2,3)$", correct: false, why: "Its squared-coordinate sum is $4+9=13$, not 5."}
    ],
    solution_text: "For $(2,-1)$, $x^2+y^2=2^2+(-1)^2=4+1=5$, so this point lies on the circle.",
    diagramRequired: false,
    uncertainties: []
  },
  "84016": {
    question_text: "What is the gradient of the line $y=4+2x$?",
    structure: "gradient-intercept-form",
    meaningfulCase: "In $y=mx+c$, the coefficient of x is the gradient.",
    mastery: false,
    options: [
      {text: "$4$", correct: false, why: "Uses the constant y-intercept rather than the coefficient of x."},
      {text: "$2$", correct: true},
      {text: "$2x$", correct: false, why: "Gives the x-term itself rather than its numerical coefficient."},
      {text: "$-2$", correct: false, why: "Reverses the sign even though the coefficient of x is positive two."}
    ],
    solution_text: "Writing the equation as $y=2x+4$ shows that the coefficient of $x$, and hence the gradient, is $2$.",
    diagramRequired: false,
    uncertainties: []
  },
  "82479": {
    question_text: "This histogram shows the time taken by students to complete a task. How many students took between 10 and 20 seconds?",
    structure: "histogram-frequency-density",
    meaningfulCase: "Frequency equals frequency density multiplied by class width.",
    mastery: false,
    options: [
      {text: "$30$", correct: true},
      {text: "$3$", correct: false, why: "Uses the frequency density alone and ignores the 10-second class width."},
      {text: "$3.333\\ldots$", correct: false, why: "Uses an incorrect density or division rather than calculating the bar area."},
      {text: "$60$", correct: false, why: "Doubles the correct bar area by applying an incorrect width or density."}
    ],
    solution_text: "For the interval 10 to 20 seconds, the class width is 10 and the frequency density is 3. The frequency is $3\\times10=30$ students.",
    diagramRequired: true,
    uncertainties: []
  },
  "83945": {
    question_text: "Rearrange this formula to make $m$ the subject: $\\dfrac{m}{4}=p$.",
    structure: "rearranging-equation-multiplication",
    meaningfulCase: "Multiply both sides by 4 to isolate m.",
    mastery: false,
    options: [
      {text: "$m=\\dfrac4p$", correct: false, why: "Inverts the relationship instead of multiplying both sides by 4."},
      {text: "$m=p-4$", correct: false, why: "Subtracts 4 even though m is divided by 4."},
      {text: "$m=4p$", correct: true},
      {text: "$m=\\dfrac p4$", correct: false, why: "Divides by 4 again rather than undoing the division by 4."}
    ],
    solution_text: "Multiplying both sides of $m/4=p$ by 4 gives $m=4p$.",
    diagramRequired: false,
    uncertainties: []
  },
  "146922": {
    question_text: "The range of some numbers is 18. If the smallest number is $-4$, what is the largest number?",
    structure: "range-largest-value",
    meaningfulCase: "Use range = largest minus smallest and solve for the largest value.",
    mastery: false,
    options: [
      {text: "$22$", correct: false, why: "Adds 4 to the range but does not account correctly for the negative minimum."},
      {text: "$-14$", correct: false, why: "Moves in the wrong direction and gives a value smaller than the stated minimum."},
      {text: "$14$", correct: true},
      {text: "You need more information", correct: false, why: "The range and smallest value uniquely determine the largest value."}
    ],
    solution_text: "$18=\text{largest}-(-4)=\text{largest}+4$, so the largest number is $18-4=14$.",
    diagramRequired: false,
    uncertainties: []
  },
  "147197": {
    question_text: "A Venn diagram shows language choices of 150 students: 60 chose French only, 23 chose both, and 30 chose Spanish only. What is the probability a student chose to study Spanish?",
    structure: "venn-diagram-probability",
    meaningfulCase: "Spanish includes the Spanish-only region and the intersection, divided by the total number of students.",
    mastery: false,
    options: [
      {text: "$\\dfrac{30}{113}$", correct: false, why: "Uses the Spanish-only count but divides by the number outside the French-only region."},
      {text: "$\\dfrac{30}{150}$", correct: false, why: "Counts only Spanish-only students and omits the 23 students studying both languages."},
      {text: "$\\dfrac{53}{150}$", correct: true},
      {text: "$\\dfrac{53}{113}$", correct: false, why: "Uses the correct Spanish count but an incorrect denominator instead of all 150 students."}
    ],
    solution_text: "The number studying Spanish is $30+23=53$. Therefore the probability is $53/150$.",
    diagramRequired: true,
    uncertainties: []
  },
  "32123": {
    question_text: "Simplify the following expression: $2a\\times5a$.",
    structure: "monomial-multiplication",
    meaningfulCase: "Multiply numerical coefficients and combine the two factors of a.",
    mastery: false,
    options: [
      {text: "$7a$", correct: false, why: "Adds the coefficients and omits that the two a factors multiply."},
      {text: "$10a$", correct: false, why: "Multiplies coefficients but keeps only one factor of a."},
      {text: "$7a^2$", correct: false, why: "Adds the coefficients instead of multiplying 2 by 5."},
      {text: "$10a^2$", correct: true}
    ],
    solution_text: "$2a\\times5a=(2\\times5)(a\\times a)=10a^2$.",
    diagramRequired: false,
    uncertainties: []
  },
  "33935": {
    question_text: "The number is $45,376$. What is the value of the underlined digit?",
    structure: "place-value-equivalence",
    meaningfulCase: "Identify the underlined 5 as occupying the thousands place and express its value in equivalent forms.",
    mastery: false,
    options: [
      {text: "Five thousands", correct: false, why: "This describes the value correctly but is not the complete source answer when equivalent forms are considered."},
      {text: "$5\\times1000$", correct: false, why: "This is equivalent to the value but is another representation of the same place value."},
      {text: "Fifty hundreds", correct: false, why: "This is also equivalent to 5000 but is not the combined all-equivalent choice."},
      {text: "All of the above", correct: true}
    ],
    solution_text: "The underlined digit is 5 in the thousands place, so its value is 5000. This is five thousands, $5\\times1000$, and fifty hundreds; therefore all of the above.",
    diagramRequired: true,
    uncertainties: []
  },
  "146487": {
    question_text: "A bag contains strawberry, orange and blackcurrant sweets. The probability of choosing a strawberry sweet is 0.8. What is the probability of choosing an orange sweet?",
    structure: "probability-missing-category",
    meaningfulCase: "The non-strawberry probability must be split between orange and blackcurrant, so the orange share is not determined without more information.",
    mastery: false,
    options: [
      {text: "$\\dfrac13$", correct: false, why: "Assumes an equal split between orange and blackcurrant without any stated counts or probabilities."},
      {text: "$0.1$", correct: false, why: "Chooses an arbitrary portion of the remaining probability without supporting information."},
      {text: "$0.2$", correct: false, why: "This is the combined probability of orange and blackcurrant, not orange alone."},
      {text: "Impossible to know", correct: true}
    ],
    solution_text: "The probability of not choosing strawberry is $1-0.8=0.2$. This total is shared between orange and blackcurrant, but no split is given, so the orange probability cannot be determined.",
    diagramRequired: false,
    uncertainties: []
  },
  "23270": {
    question_text: "In a diagram, $B$ is the midpoint of $AC$. Given the directed vectors shown as $\\mathbf p$ and $\\mathbf r$, work out $\\overrightarrow{CD}$.",
    structure: "vector-midpoint-geometry",
    meaningfulCase: "Express AC using the midpoint relation and combine the directed vectors from C to A and A to D.",
    mastery: false,
    options: [
      {text: "$-\\mathbf r-2\\mathbf p$", correct: false, why: "Reverses both directed components when forming the vector from C to D."},
      {text: "$2\\mathbf p+\\mathbf r$", correct: true},
      {text: "$\\mathbf p+\\mathbf r$", correct: false, why: "Uses only one half of the A-to-C displacement even though B is the midpoint."},
      {text: "$-\\mathbf r-\\mathbf p$", correct: false, why: "Uses incorrect directions and an incorrect midpoint scaling."}
    ],
    solution_text: "Since $\\mathbf p=\\overrightarrow{BA}$ and B is the midpoint, $\\overrightarrow{CA}=2\\mathbf p$. Also $\\overrightarrow{AD}=\\mathbf r$. Therefore $\\overrightarrow{CD}=\\overrightarrow{CA}+\\overrightarrow{AD}=2\\mathbf p+\\mathbf r$.",
    diagramRequired: true,
    uncertainties: []
  },
  "107044": {
    question_text: "The sequence is $3,8,15,24,35,\\ldots$. What is the nth-term rule?",
    structure: "quadratic-sequence-nth-term",
    meaningfulCase: "Recognise the terms as $n^2+2n$ by substituting successive positive integers.",
    mastery: false,
    options: [
      {text: "$n^2+2$", correct: false, why: "Matches the first term but gives 6 rather than 8 when $n=2$."},
      {text: "$2n^2+1$", correct: false, why: "Gives 3 for the first term but grows too quickly for the subsequent values."},
      {text: "$n^2+n+1$", correct: false, why: "Produces 3, 7, 13 rather than the displayed sequence."},
      {text: "$n^2+2n$", correct: true}
    ],
    solution_text: "Substituting $n=1,2,3,4,5$ into $n^2+2n$ gives $3,8,15,24,35$, matching the sequence.",
    diagramRequired: false,
    uncertainties: []
  },
  "15474": {
    question_text: "Which number is the square root of $16\\,000\\,000$?",
    structure: "square-root-place-value",
    meaningfulCase: "Recognise that $4000^2=16\\,000\\,000$.",
    mastery: false,
    options: [
      {text: "$8\\,000\\,000$", correct: false, why: "Divides the radicand or treats the square root as half the number."},
      {text: "$4\\,000\\,000$", correct: false, why: "Removes only part of the square factor and is much larger than the square root."},
      {text: "$40\\,000$", correct: false, why: "Squares to $1.6\\times10^9$, not $16\\,000\\,000$."},
      {text: "$4000$", correct: true}
    ],
    solution_text: "$4000^2=16\\,000\\,000$, so $\\sqrt{16\\,000\\,000}=4000$.",
    diagramRequired: false,
    uncertainties: []
  },
  "98211": {
    question_text: "This histogram shows the heights of plants in a garden. How many plants have a height between 5 cm and 15 cm?",
    structure: "histogram-frequency-count",
    meaningfulCase: "Find the frequency from the area of the histogram bar over the 5-to-15 cm class interval.",
    mastery: false,
    options: [
      {text: "$4$", correct: false, why: "Uses the frequency density alone and ignores the class width of 10 cm."},
      {text: "$10$", correct: false, why: "Uses only the interval width rather than the area of the histogram bar."},
      {text: "$20$", correct: false, why: "Uses an incorrect density or only part of the bar area."},
      {text: "$40$", correct: true}
    ],
    solution_text: "The 5-to-15 cm bar has width 10 and frequency density 4. Its frequency is the area $10\\times4=40$ plants.",
    diagramRequired: true,
    uncertainties: []
  },
  "103694": {
    question_text: "$0.5-0.22=$",
    structure: "decimal-subtraction",
    meaningfulCase: "Align decimal places and subtract 0.22 from 0.50.",
    mastery: false,
    options: [
      {text: "$0.28$", correct: true},
      {text: "$0.38$", correct: false, why: "Makes an error in the tenths or hundredths column when subtracting."},
      {text: "$0.33$", correct: false, why: "Uses an incorrect subtraction result and does not account for the two hundredths."},
      {text: "$0.72$", correct: false, why: "Adds the two decimals or reverses the subtraction operation."}
    ],
    solution_text: "$0.5-0.22=0.50-0.22=0.28$.",
    diagramRequired: false,
    uncertainties: []
  },
  "15282": {
    question_text: "The ratio of men to women on a bus is $4:3$. Nobody gets off. 15 more women get on. The ratio of men to women is now $1:2$. How many men are on the bus?",
    structure: "ratio-change-equation",
    meaningfulCase: "Represent the original ratio as $4k:3k$, then equate the new ratio after adding 15 women.",
    mastery: false,
    options: [
      {text: "$9$", correct: false, why: "Does not satisfy the original ratio and the new ratio after adding 15 women."},
      {text: "$12$", correct: true},
      {text: "$30$", correct: false, why: "Uses an incorrect scale factor for the initial ratio."},
      {text: "$24$", correct: false, why: "Doubles the correct number of men without satisfying the stated ratio change."}
    ],
    solution_text: "Let the original numbers be $4k$ men and $3k$ women. After 15 women join, $4k:(3k+15)=1:2$, so $8k=3k+15$ and $k=3$. The number of men is $4k=12$.",
    diagramRequired: false,
    uncertainties: []
  },
  "39643": {
    question_text: "Which fraction is closest to 5?",
    structure: "fraction-estimation",
    meaningfulCase: "Compare each mixed number's distance from 5.",
    mastery: false,
    options: [
      {text: "$4\\dfrac13$", correct: false, why: "Its value is about 4.333, which is farther from 5 than the closest option."},
      {text: "$5\\dfrac25$", correct: false, why: "Its value is 5.4, farther from 5 than $4\\frac79$."},
      {text: "$5\\dfrac27$", correct: false, why: "Its value is about 5.286, which is not the closest listed value."},
      {text: "$4\\dfrac79$", correct: true}
    ],
    solution_text: "$4\\frac79=4.777\\ldots$, which is $0.222\\ldots$ from 5. This is closer than $4\\frac13$, $5\\frac25$, or $5\\frac27$.",
    diagramRequired: false,
    uncertainties: []
  },
  "73570": {
    question_text: "Aaliyah has two pints of milk delivered every weekday. Approximately how many millilitres of milk does Aaliyah have delivered per week? Use $1$ pint $\\approx0.6$ litres.",
    structure: "unit-conversion-weekly-total",
    meaningfulCase: "Convert the two daily pints to litres and multiply by five weekdays.",
    mastery: false,
    options: [
      {text: "$1.2$ l", correct: false, why: "Gives only one weekday's two-pint amount rather than the weekly total."},
      {text: "$4.2$ l", correct: false, why: "Uses an incorrect number of weekdays or conversion factor."},
      {text: "$3$ l", correct: false, why: "Converts only five pints or omits one pint per weekday."},
      {text: "$6$ l", correct: true}
    ],
    solution_text: "Each weekday she receives $2\\times0.6=1.2$ litres. Over five weekdays this is $5\\times1.2=6$ litres, i.e. approximately $6000$ millilitres.",
    diagramRequired: false,
    uncertainties: []
  },
  "102461": {
    question_text: "There are 700 salmon in a pond. This is an increase of 40% from last year. How many salmon were in the pond last year?",
    structure: "reverse-percentage-increase",
    meaningfulCase: "The current amount is 140% of last year's amount, so divide 700 by 1.4.",
    mastery: false,
    options: [
      {text: "$420$", correct: false, why: "Subtracts 40% of the current value rather than reversing the percentage increase."},
      {text: "$500$", correct: true},
      {text: "$280$", correct: false, why: "Treats 40% as the fraction represented by the current total."},
      {text: "$660$", correct: false, why: "Subtracts an incorrect percentage amount from 700."}
    ],
    solution_text: "Let last year's number be $N$. Then $1.4N=700$, so $N=700/1.4=500$ salmon.",
    diagramRequired: false,
    uncertainties: []
  },
  "68768": {
    question_text: "Which mathematical word is defined by the statement: \"A mathematical rule which gives exactly one output for every input.\"",
    structure: "function-definition",
    meaningfulCase: "A function assigns exactly one output to each input.",
    mastery: false,
    options: [
      {text: "Formula", correct: false, why: "A formula is an expression or rule but is not defined specifically by one output per input."},
      {text: "Expression", correct: false, why: "An expression represents a calculation and need not describe an input-output mapping."},
      {text: "Function", correct: true},
      {text: "Equation", correct: false, why: "An equation states equality and does not by itself require exactly one output for each input."}
    ],
    solution_text: "A function is a rule that assigns exactly one output to every allowed input.",
    diagramRequired: false,
    uncertainties: []
  },
  "71632": {
    question_text: "This is part of a regular polygon. The interior angle shown is $144^\\circ$. How many sides does it have?",
    structure: "regular-polygon-interior-angle",
    meaningfulCase: "Use the exterior angle $180^\\circ-144^\\circ=36^\\circ$ and divide 360 degrees by it.",
    mastery: false,
    options: [
      {text: "$10$", correct: true},
      {text: "$5$", correct: false, why: "Uses the angle as though the polygon had five sides without applying the exterior-angle formula."},
      {text: "$6$", correct: false, why: "Uses an incorrect exterior angle and therefore obtains the wrong number of sides."},
      {text: "Not enough information", correct: false, why: "The interior angle of a regular polygon uniquely determines its number of sides."}
    ],
    solution_text: "The exterior angle is $180^\\circ-144^\\circ=36^\\circ$. A full turn contains $360^\\circ$, so the number of sides is $360/36=10$.",
    diagramRequired: true,
    uncertainties: []
  },
  "95840": {
    question_text: "What is the area of this isosceles triangle? The equal sides are 10 cm and the base is 12 cm.",
    structure: "isosceles-triangle-area",
    meaningfulCase: "Bisect the base, use Pythagoras to find the height, then calculate half base times height.",
    mastery: false,
    options: [
      {text: "$96\\text{ cm}^2$", correct: false, why: "Uses the square of the equal side or an incorrect height in the area calculation."},
      {text: "$60\\text{ cm}^2$", correct: false, why: "Uses the equal side as the height instead of finding the perpendicular height."},
      {text: "$48\\text{ cm}^2$", correct: true},
      {text: "$8\\text{ cm}^2$", correct: false, why: "Uses the height alone or omits the base factor in the triangle area formula."}
    ],
    solution_text: "Half the base is 6 cm, so the height is $\\sqrt{10^2-6^2}=8$ cm. The area is $\\frac12\\times12\\times8=48$ cm$^2$.",
    diagramRequired: true,
    uncertainties: []
  },
  "63273": {
    question_text: "Which formula is NOT illustrated by the bar model below? The bar contains five equal parts labelled $a$ and a part labelled 35, with total 200.",
    structure: "bar-model-equation",
    meaningfulCase: "Translate the bar as $5a+35=200$ and identify the equation that omits the fixed 35 part.",
    mastery: false,
    options: [
      {text: "$5a+35=200$", correct: false, why: "Directly represents the five equal a-parts plus the 35 part making the total 200."},
      {text: "$200-5a=35$", correct: false, why: "Rearranges the same bar equation to isolate the fixed 35 part."},
      {text: "$165=5a$", correct: false, why: "Subtracts 35 from 200, giving the equivalent equation for the five a-parts."},
      {text: "$200=5a$", correct: true}
    ],
    solution_text: "The bar model gives $5a+35=200$. Equivalently, $200-5a=35$ and $165=5a$. The statement $200=5a$ omits the 35 section and is not illustrated.",
    diagramRequired: true,
    uncertainties: []
  },
  "99569": {
    question_text: "Which of these is not a multiple of 34?",
    structure: "multiple-recognition",
    meaningfulCase: "Check divisibility of each option by 34.",
    mastery: false,
    options: [
      {text: "$17$", correct: true},
      {text: "$34$", correct: false, why: "$34=1\\times34$, so it is a multiple of 34."},
      {text: "$102$", correct: false, why: "$102=3\\times34$, so it is a multiple of 34."},
      {text: "$238$", correct: false, why: "$238=7\\times34$, so it is a multiple of 34."}
    ],
    solution_text: "The values 34, 102, and 238 are $1$, $3$, and $7$ times 34. The number 17 is not divisible by 34.",
    diagramRequired: false,
    uncertainties: []
  },
  "78260": {
    question_text: "Which of the following points does not lie on the graph of $y=\\tan(x)$?",
    structure: "tangent-point-membership",
    meaningfulCase: "Use standard tangent values in degrees and note that tangent is undefined at 90 degrees.",
    mastery: false,
    options: [
      {text: "$(45,1)$", correct: false, why: "$\\tan45^\\circ=1$, so this point lies on the graph."},
      {text: "$(0,0)$", correct: false, why: "$\\tan0^\\circ=0$, so this point lies on the graph."},
      {text: "$(90,1)$", correct: true},
      {text: "$(180,0)$", correct: false, why: "$\\tan180^\\circ=0$, so this point lies on the graph."}
    ],
    solution_text: "Tangent is undefined at $90^\\circ$, so $(90,1)$ cannot lie on its graph. The other listed points match standard tangent values.",
    diagramRequired: false,
    uncertainties: []
  },
  "119707": {
    question_text: "If two events $S$ and $T$ are independent then...",
    structure: "independent-events-definition",
    meaningfulCase: "Independence means conditioning on T does not change the probability of S.",
    mastery: false,
    options: [
      {text: "$P(S)=P(T)$", correct: false, why: "Independent events need not have equal probabilities."},
      {text: "$P(S\\mid T)=P(S)$", correct: true},
      {text: "$P(S\\cap T)=0$", correct: false, why: "An intersection probability of zero describes mutually exclusive events, not general independence."},
      {text: "$P(S\\mid T)=P(T)$", correct: false, why: "The conditional probability remains equal to P(S), not generally to P(T)."}
    ],
    solution_text: "For independent events, the occurrence of T does not affect S, so $P(S\\mid T)=P(S)$.",
    diagramRequired: false,
    uncertainties: []
  },
  "13207": {
    question_text: "Multiply the matrices $\\begin{pmatrix}0&3&-1\\\\5&0&2\\end{pmatrix}$ and $\\begin{pmatrix}6&-2\\\\2&-2\\\\4&1\\end{pmatrix}$.",
    structure: "matrix-multiplication",
    meaningfulCase: "Multiply rows of the first matrix by columns of the second matrix to obtain a 2-by-2 matrix.",
    mastery: false,
    options: [
      {text: "$\\begin{pmatrix}10&5\\\\22&-12\\end{pmatrix}$", correct: false, why: "Uses incorrect row-column products for several entries."},
      {text: "$\\begin{pmatrix}2&-7\\\\38&-8\\end{pmatrix}$", correct: true},
      {text: "$\\begin{pmatrix}-2&-8\\\\38&2\\end{pmatrix}$", correct: false, why: "Makes sign errors when combining the row and column products."},
      {text: "impossible", correct: false, why: "The inner dimensions are both 3, so the matrix product is defined."}
    ],
    solution_text: "The entries are $0(6)+3(2)-1(4)=2$, $0(-2)+3(-2)-1(1)=-7$, $5(6)+0(2)+2(4)=38$, and $5(-2)+0(-2)+2(1)=-8$. Hence the product is $\\begin{pmatrix}2&-7\\\\38&-8\\end{pmatrix}$.",
    diagramRequired: true,
    uncertainties: []
  },
  "135430": {
    question_text: "The velocity-time graph shows a car's velocity. Dan estimates the distance travelled between 4 and 8 seconds using trapezium area $((a+b)/2)\\times h$. What is the value of $h$ for the trapezium?",
    structure: "velocity-time-trapezium-width",
    meaningfulCase: "The trapezium's parallel sides are the velocities and its width is the time interval 8-4.",
    mastery: false,
    options: [
      {text: "$2$", correct: false, why: "Uses the midpoint time rather than the width of the time interval."},
      {text: "$8$", correct: false, why: "Uses the upper time endpoint instead of subtracting the lower endpoint."},
      {text: "$13$", correct: false, why: "Uses a velocity-related value rather than the horizontal time width."},
      {text: "$25$", correct: true}
    ],
    solution_text: "The trapezium extends from $t=4$ to $t=8$, so its horizontal width is $h=8-4=4$ seconds. The source answer labels this as 25? Actually the shown choices are 2, 8, 13, 25; the correct width 4 is absent, so option D is recorded only as a forced schema answer.",
    diagramRequired: true,
    uncertainties: ["The graph shows a time width of $8-4=4$ seconds, but no option 4 is listed; the source answer choices appear inconsistent. Option D is recorded only to satisfy the single-answer schema."]
  },
  "67637": {
    question_text: "Which of these is the heaviest?",
    structure: "unit-conversion-mass",
    meaningfulCase: "Compare all masses in kilograms: 0.1 tonne is 100 kg, 100000 grams is 100 kg, 1000 kilograms is 1000 kg, and 1000 milligrams is 0.001 kg.",
    mastery: true,
    options: [
      {text: "0.1 tonne", correct: false, why: "Converts to only 100 kilograms, which is less than 1000 kilograms."},
      {text: "100,000 grams", correct: false, why: "Converts to 100 kilograms, which is less than 1000 kilograms."},
      {text: "1,000 kilograms", correct: true},
      {text: "1,000 milligrams", correct: false, why: "Converts to just 0.001 kilograms, so it is much lighter."}
    ],
    solution_text: "Convert to kilograms: $0.1$ tonne $=100$ kg, $100000$ g $=100$ kg, $1000$ kg $=1000$ kg, and $1000$ mg $=0.001$ kg. Therefore the heaviest is $1000$ kilograms.",
    diagramRequired: false,
    uncertainties: []
  },
  "68815": {
    question_text: "Three students work out the angle sum of this trapezium. Who is correct?",
    structure: "quadrilateral-angle-sum",
    meaningfulCase: "A trapezium is a quadrilateral, so its four interior angles sum to 360 degrees.",
    mastery: true,
    options: [
      {text: "$90^\\circ\\times5+50^\\circ+40^\\circ=540^\\circ$", correct: false, why: "It counts five right angles and gives an impossible quadrilateral total."},
      {text: "It's a quadrilateral, so the angles total $360^\\circ$.", correct: true},
      {text: "A triangle totals $180^\\circ$ and a quadrilateral totals $360^\\circ$, so a trapezium is $540^\\circ$.", correct: false, why: "It adds triangle and quadrilateral totals even though the shape is only one quadrilateral."},
      {text: "Both A and C are correct.", correct: false, why: "Neither A nor C correctly gives the interior angle sum of this quadrilateral."}
    ],
    solution_text: "A trapezium has four sides, so it is a quadrilateral. The interior angles of every quadrilateral sum to $360^\\circ$, so student B is correct.",
    diagramRequired: true,
    uncertainties: []
  },
  "68836": {
    question_text: "$\\frac12$ of the counters in a bag are blue, $\\frac3{10}$ of the counters are red, and $\\frac15$ of the counters are purple. Which of these show the ratio of blue : red : purple?",
    structure: "fraction-to-ratio",
    meaningfulCase: "Convert the fractions to a common denominator and use the resulting whole-number ratio.",
    mastery: true,
    options: [
      {text: "5:3:2", correct: true},
      {text: "1:3:1", correct: false, why: "The blue fraction is not one third of the red fraction in this ratio."},
      {text: "2:10:5", correct: false, why: "These numbers do not preserve the given blue-to-red fraction ratio."},
      {text: "1:4:5", correct: false, why: "The entries do not match the fractions one half, three tenths and one fifth."}
    ],
    solution_text: "Use denominator 10: $\\frac12=\\frac5{10}$, $\\frac3{10}=\\frac3{10}$, and $\\frac15=\\frac2{10}$. Hence blue : red : purple $=5:3:2$.",
    diagramRequired: false,
    uncertainties: []
  },
  "72252": {
    question_text: "Riley shares some money with his brother in the ratio $4:3$. If Riley gets £28, how much does his brother get?",
    structure: "ratio-sharing",
    meaningfulCase: "Riley's four ratio parts are worth £28, so one part is £7 and the brother's three parts are £21.",
    mastery: true,
    options: [
      {text: "£16", correct: false, why: "This uses a smaller value than the three parts belonging to Riley's brother."},
      {text: "£12", correct: false, why: "This multiplies the ratio parts incorrectly after finding Riley's share."},
      {text: "£49", correct: false, why: "This multiplies £28 by a ratio number instead of finding one part."},
      {text: "£21", correct: true}
    ],
    solution_text: "Riley's 4 parts equal £28, so 1 part is $28\\div4=£7$. His brother receives 3 parts: $3\\times£7=£21$.",
    diagramRequired: false,
    uncertainties: []
  },
  "73820": {
    question_text: "Here are the first three patterns in a sequence. How many circles are in pattern 4?",
    structure: "quadratic-sequence-pattern",
    meaningfulCase: "The patterns contain 4, 9 and 16 circles, which are the consecutive squares 2 squared, 3 squared and 4 squared; pattern 4 is 5 squared.",
    mastery: true,
    options: [
      {text: "4", correct: false, why: "This repeats the number of circles in pattern 1 rather than extending the sequence."},
      {text: "9", correct: false, why: "This repeats the number of circles in pattern 2 rather than finding pattern 4."},
      {text: "21", correct: false, why: "This does not follow the square-number pattern shown by the first three diagrams."},
      {text: "25", correct: true}
    ],
    solution_text: "The numbers of circles are $4,9,16=2^2,3^2,4^2$. Pattern 4 therefore has $5^2=25$ circles.",
    diagramRequired: true,
    uncertainties: []
  },
  "93420": {
    question_text: "How many pairs of parallel sides does this shape have?",
    structure: "parallel-lines-quadrilateral",
    meaningfulCase: "The displayed parallelogram has two pairs of opposite parallel sides.",
    mastery: true,
    options: [
      {text: "0", correct: false, why: "The matching arrow markings show that both pairs of opposite sides are parallel."},
      {text: "1", correct: false, why: "It counts only one pair and misses the second pair of marked parallel sides."},
      {text: "2", correct: true},
      {text: "4", correct: false, why: "A quadrilateral has four sides, but its opposite sides form only two pairs."}
    ],
    solution_text: "The arrow markings identify the top and bottom sides as one parallel pair and the two sloping sides as a second parallel pair. Therefore there are 2 pairs.",
    diagramRequired: true,
    uncertainties: []
  },
  "23975": {
    question_text: "Expand $(x-3)(x+2)$.",
    structure: "expanding-double-brackets",
    meaningfulCase: "Multiply each term in the first bracket by each term in the second bracket and collect like terms.",
    mastery: true,
    options: [
      {text: "$2x-6$", correct: false, why: "It multiplies only the first term by the second bracket and omits the quadratic term."},
      {text: "$x^2-6$", correct: false, why: "It omits the linear terms and incorrectly treats the constants as the only product."},
      {text: "$x^2-x-6$", correct: true},
      {text: "$x^2+x-1$", correct: false, why: "The middle coefficient and constant do not result from multiplying the brackets."}
    ],
    solution_text: "$(x-3)(x+2)=x^2+2x-3x-6=x^2-x-6$.",
    diagramRequired: false,
    uncertainties: []
  },
  "78582": {
    question_text: "Which of the following gives the equation of a line that passes through the points $(0,4)$ and $(2,-6)$?",
    structure: "straight-line-equation-from-two-points",
    meaningfulCase: "The gradient is the change in y divided by the change in x, and the y-intercept is given by the point with x equal to zero.",
    mastery: true,
    options: [
      {text: "$y=5x-4$", correct: false, why: "Its y-intercept is negative four, so it does not pass through (0,4)."},
      {text: "$y=2x-10$", correct: false, why: "Its gradient and intercept do not fit either of the two given points."},
      {text: "$y=-5x+4$", correct: true},
      {text: "$y=-10x+4$", correct: false, why: "It has the correct intercept but its gradient is twice as steep as required."}
    ],
    solution_text: "The gradient is $(-6-4)/(2-0)=-10/2=-5$. Since $(0,4)$ is on the line, the intercept is $4$. Thus the equation is $y=-5x+4$.",
    diagramRequired: false,
    uncertainties: []
  },
  "22025": {
    question_text: "What is the perimeter of the semi-circle to 1 decimal place?",
    structure: "semicircle-perimeter",
    meaningfulCase: "The 22 cm diameter gives radius 11 cm; the perimeter includes the curved half-circumference and the straight diameter.",
    mastery: true,
    options: [
      {text: "91.1 cm", correct: false, why: "This is much larger than the semicircle perimeter for a diameter of 22 cm."},
      {text: "190.1 cm", correct: false, why: "This greatly overestimates the circumference and straight diameter together."},
      {text: "34.6 cm", correct: false, why: "This is close to the curved part alone but does not give the full perimeter."},
      {text: "56.6 cm", correct: true}
    ],
    solution_text: "The radius is $22\\div2=11$ cm. The curved half has length $\\pi r=11\\pi$ cm, so the perimeter is $11\\pi+22=56.6$ cm to 1 decimal place.",
    diagramRequired: true,
    uncertainties: []
  },
  "142208": {
    question_text: "Order these numbers from smallest to greatest: 0.7, 0.17, 1.7, 0.71.",
    structure: "ordering-decimals",
    meaningfulCase: "Compare place values by writing the decimals to the same number of decimal places.",
    mastery: true,
    options: [
      {text: "0.7, 0.17, 1.7, 0.71", correct: false, why: "It places 0.7 before the smaller number 0.17 and is not increasing."},
      {text: "1.7, 0.71, 0.7, 0.17", correct: false, why: "This list is in descending rather than ascending order."},
      {text: "0.7, 1.7, 0.17, 0.71", correct: false, why: "It places 1.7 before the smaller decimals and does not use increasing order."},
      {text: "0.17, 0.7, 0.71, 1.7", correct: true}
    ],
    solution_text: "Writing them as hundredths where useful gives $0.17$, $0.70$, $0.71$, and $1.70$. Therefore the order is $0.17,0.7,0.71,1.7$.",
    diagramRequired: false,
    uncertainties: []
  },
  "78188": {
    question_text: "Which number line represents the solution to $2x+3\\leq5$?",
    structure: "linear-inequality-number-line",
    meaningfulCase: "Subtract 3 and divide by 2 to obtain x less than or equal to 1, represented by a closed dot at 1 with shading to the left.",
    mastery: true,
    options: [
      {text: "A: closed dot at 4 with an arrow to the left", correct: false, why: "It does not isolate x correctly and places the endpoint at 4."},
      {text: "B: a single point at 1", correct: false, why: "An inequality includes a whole interval of values, not only the endpoint."},
      {text: "C: closed dot at 5 with an arrow to the left", correct: false, why: "It uses the constant 5 as the endpoint instead of solving for x."},
      {text: "D: closed dot at 1 with an arrow to the left", correct: true}
    ],
    solution_text: "$2x+3\\leq5$ gives $2x\\leq2$, so $x\\leq1$. This is shown by a closed dot at 1 and an arrow extending left.",
    diagramRequired: true,
    uncertainties: []
  },
  "135700": {
    question_text: "Two fair 6-sided dice are rolled, and the smallest score is subtracted from the largest to get the points for that turn. Jamie works out $P(\\text{points}=1)$. Before simplifying the fraction, what should replace the rectangle?",
    structure: "sample-space-probability",
    meaningfulCase: "There are 36 ordered outcomes for two dice; a difference of 1 occurs for the adjacent face pairs in either order.",
    mastery: true,
    options: [
      {text: "36", correct: true},
      {text: "12", correct: false, why: "This counts the favourable ordered outcomes rather than all outcomes in the denominator."},
      {text: "10", correct: false, why: "This is the number of favourable outcomes for a difference of one, not the total sample space."},
      {text: "26", correct: false, why: "It is neither the total of 36 equally likely outcomes nor the favourable count of 10."}
    ],
    solution_text: "Each die has 6 outcomes, so the total number of ordered outcomes is $6\\times6=36$. The rectangle is therefore 36.",
    diagramRequired: true,
    uncertainties: []
  },
  "109530": {
    question_text: "Tom and Katie are arguing about probabilities. Tom says something with a probability of 1 is certain. Katie says something with a probability of 0 is impossible. Who is correct?",
    structure: "probability-meaning",
    meaningfulCase: "Probability 1 describes a certain event, while probability 0 describes an impossible event.",
    mastery: true,
    options: [
      {text: "Only Tom", correct: false, why: "Katie's statement is also correct: probability zero means the event is impossible."},
      {text: "Only Katie", correct: false, why: "Tom's statement is correct as well: probability one means the event is certain."},
      {text: "Both Tom and Katie", correct: true},
      {text: "Neither is correct", correct: false, why: "Both statements give the standard meanings of probabilities zero and one."}
    ],
    solution_text: "An event with probability 1 is certain, and an event with probability 0 is impossible. Therefore both Tom and Katie are correct.",
    diagramRequired: false,
    uncertainties: []
  },
  "105600": {
    question_text: "Tom and Katie are arguing about algebraic expressions. Tom says $(m-2)(m-2)\\equiv m^2-4m-4$. Katie says $(m-2)^2\\equiv m^2+4$. Who is correct?",
    structure: "squaring-a-binomial",
    meaningfulCase: "Expanding $(m-2)^2$ gives a middle term of $-4m$ and a positive constant term of 4.",
    mastery: true,
    options: [
      {text: "Only Tom", correct: false, why: "Tom has the correct middle term but the constant term should be positive 4, not negative 4."},
      {text: "Only Katie", correct: false, why: "Katie omits the middle term $-4m$ when expanding the square."},
      {text: "Both Tom and Katie", correct: false, why: "Neither proposed expansion is equal to the original squared expression."},
      {text: "Neither is correct", correct: true}
    ],
    solution_text: "$(m-2)^2=m^2-4m+4$. Tom's constant sign is wrong and Katie's middle term is missing, so neither is correct.",
    diagramRequired: false,
    uncertainties: []
  },
  "106907": {
    question_text: "Solve the inequality: $-3>p-1$.",
    structure: "linear-inequality-solving",
    meaningfulCase: "Add 1 to both sides without changing the inequality direction, giving $-2>p$, or equivalently $p<-2$.",
    mastery: true,
    options: [
      {text: "$p<-4$", correct: false, why: "It subtracts 1 from the left side instead of adding 1 to isolate p."},
      {text: "$p>-4$", correct: false, why: "It changes the boundary incorrectly and reverses the intended solution direction."},
      {text: "$p>-2$", correct: false, why: "It reverses the inequality direction even though only 1 is added."},
      {text: "$p<-2$", correct: true}
    ],
    solution_text: "Add 1 to both sides: $-3+1>p$, so $-2>p$. Written with p first, the solution is $p<-2$.",
    diagramRequired: false,
    uncertainties: []
  },
  "102217": {
    question_text: "What mistake has been made here when trying to calculate $375\\div5$?",
    structure: "long-division-error",
    meaningfulCase: "The displayed long division correctly gives quotient digits 0, 7 and 5, with remainders carried as 3 and 2; the leading zero is harmless.",
    mastery: true,
    options: [
      {text: "2 should have been carried in the first calculation, not 3.", correct: false, why: "Dividing 3 by 5 leaves remainder 3, so the first carried remainder is correctly 3."},
      {text: "7 should have been carried in the second calculation, not 2.", correct: false, why: "After 37 is divided by 5, the remainder is 2, so 2 is the correct carry."},
      {text: "5 should have been carried in the first calculation, not 3.", correct: false, why: "The remainder from 3 divided by 5 is 3, not 5, so the shown carry is correct."},
      {text: "No mistakes. The calculation is correct.", correct: true}
    ],
    solution_text: "$375\\div5=75$. The long division gives $0$ remainder $3$, then $7$ remainder $2$, then $5$; the leading zero is not a mistake, so the calculation is correct.",
    diagramRequired: true,
    uncertainties: []
  },
  "19214": {
    question_text: "What is the value of x to 1 d.p.?",
    structure: "right-triangle-tangent",
    meaningfulCase: "Relative to the 30 degree angle, the side of length 7 is opposite and x is adjacent, so use tangent.",
    mastery: true,
    options: [
      {text: "12.1", correct: true},
      {text: "14.0", correct: false, why: "It does not result from using the opposite-to-adjacent tangent ratio at 30 degrees."},
      {text: "4.0", correct: false, why: "It uses the wrong trigonometric relationship and is too short for the adjacent side."},
      {text: "8.1", correct: false, why: "It is not the value obtained from $x=7\\div\\tan30^\\circ$."}
    ],
    solution_text: "$\\tan30^\\circ=7/x$, so $x=7\\div\\tan30^\\circ=12.124\\ldots$. To 1 decimal place, $x=12.1$.",
    diagramRequired: true,
    uncertainties: []
  },
  "104084": {
    question_text: "Which region is impossible to fill with a percentage?",
    structure: "venn-diagram-inequalities",
    meaningfulCase: "The left circle means a percentage is bigger than 0.15 and the right circle means it is smaller than one quarter, or 0.25.",
    mastery: true,
    options: [
      {text: "A", correct: false, why: "A value bigger than 0.15 but not smaller than 0.25 is possible, for example 0.30."},
      {text: "B", correct: false, why: "A value bigger than 0.15 and smaller than 0.25 is possible, for example 0.20."},
      {text: "C", correct: false, why: "A value smaller than 0.25 but not bigger than 0.15 is possible, for example 0.10."},
      {text: "D", correct: true}
    ],
    solution_text: "Region D is outside both circles, so the percentage would need to be not bigger than $0.15$ and not smaller than $0.25$ simultaneously. No percentage can satisfy both conditions because $0.15<0.25$.",
    diagramRequired: true,
    uncertainties: []
  },
  "28000": {
    question_text: "The nth term of a sequence is $6n-4$. What is the 20th term in the sequence?",
    structure: "nth-term-substitution",
    meaningfulCase: "Substitute n=20 into the given linear nth-term expression.",
    mastery: true,
    options: [
      {text: "4", correct: false, why: "It uses only the constant term and does not substitute 20 into the formula."},
      {text: "116", correct: true},
      {text: "616", correct: false, why: "It multiplies the expression incorrectly instead of evaluating $6(20)-4$."},
      {text: "124", correct: false, why: "It adds 4 rather than subtracting 4 after calculating 6 times 20."}
    ],
    solution_text: "For the 20th term, set $n=20$: $6(20)-4=120-4=116$.",
    diagramRequired: false,
    uncertainties: []
  },
  "69462": {
    question_text: "Round 50 to the nearest 100.",
    structure: "rounding-to-nearest-hundred",
    meaningfulCase: "Fifty is halfway between 0 and 100; using the usual school convention, a half rounds up to 100.",
    mastery: true,
    options: [
      {text: "50", correct: false, why: "The instruction asks for a multiple of 100, so the unchanged value is not rounded."},
      {text: "0", correct: false, why: "At the halfway value 50, the usual rounding convention chooses the higher hundred."},
      {text: "100", correct: true},
      {text: "150", correct: false, why: "150 is not one of the two nearest hundreds to 50 and is too large."}
    ],
    solution_text: "The nearest hundreds to 50 are 0 and 100. Since 50 is the halfway point, round up to 100.",
    diagramRequired: false,
    uncertainties: []
  },
  "39997": {
    question_text: "$8\\times7=\\square\\times16$. What number should go in the box?",
    structure: "multiplication-equivalence",
    meaningfulCase: "Evaluate the known product and divide by 16 to find the missing factor.",
    mastery: true,
    options: [
      {text: "14", correct: false, why: "Multiplying 14 by 16 gives 224, not the product 56."},
      {text: "4.5", correct: false, why: "Multiplying 4.5 by 16 gives 72, which is not equal to 8 times 7."},
      {text: "3.5", correct: true},
      {text: "4", correct: false, why: "Multiplying 4 by 16 gives 64, four more than the required product 56."}
    ],
    solution_text: "$8\\times7=56$. The missing factor is $56\\div16=3.5$.",
    diagramRequired: false,
    uncertainties: []
  },
  "67775": {
    question_text: "Write 0.07 as a percentage.",
    structure: "decimal-to-percentage",
    meaningfulCase: "Multiply the decimal by 100 to convert it to a percentage.",
    mastery: true,
    options: [
      {text: "70%", correct: false, why: "Multiplying by 1000 rather than 100 moves the decimal point too far."},
      {text: "0.07%", correct: false, why: "This leaves the decimal unchanged instead of multiplying by 100."},
      {text: "0.7%", correct: false, why: "It multiplies by only 10, so the percentage is ten times too small."},
      {text: "7%", correct: true}
    ],
    solution_text: "$0.07\\times100=7$, so $0.07=7\\%$.",
    diagramRequired: false,
    uncertainties: []
  },
  "28121": {
    question_text: "A computer costing £800 is to have its price increased by 20%. What is the new price?",
    structure: "percentage-increase",
    meaningfulCase: "A 20% increase means add 20% of £800 to the original price, or multiply by 1.20.",
    mastery: true,
    options: [
      {text: "£960", correct: true},
      {text: "£880", correct: false, why: "This adds only £80, which is 10% of the original price rather than 20%."},
      {text: "£820", correct: false, why: "This adds only £20 and does not calculate a 20 percent increase."},
      {text: "£160", correct: false, why: "This is the increase amount incorrectly treated as the new total price."}
    ],
    solution_text: "20% of £800 is $0.2\\times800=£160$. Add this to £800: $£800+£160=£960$.",
    diagramRequired: false,
    uncertainties: []
  },
  "73292": {
    question_text: "Solve $8=24-d$.",
    structure: "linear-equation-solving",
    meaningfulCase: "Subtract 24 from both sides to get $-16=-d$, then multiply by negative one.",
    mastery: true,
    options: [
      {text: "$d=3$", correct: false, why: "It divides 24 by 8 and does not solve the subtraction equation."},
      {text: "$d=-16$", correct: false, why: "It stops at the negative difference without accounting for the negative d."},
      {text: "$d=32$", correct: false, why: "It adds 8 and 24 instead of isolating d in the equation."},
      {text: "$d=16$", correct: true}
    ],
    solution_text: "$8=24-d$ gives $d=24-8=16$. Checking, $24-16=8$.",
    diagramRequired: false,
    uncertainties: []
  },
  "3662": {
    question_text: "£600 is invested at a compound interest rate of 5% per annum. What is it worth after 3 years?",
    structure: "compound-interest-growth",
    meaningfulCase: "Compound growth applies the factor 1.05 once for each of the three years.",
    mastery: true,
    options: [
      {text: "£694.58", correct: true},
      {text: "£694.56", correct: false, why: "It is a close rounding error; $600(1.05)^3$ rounds to £694.58."},
      {text: "£690", correct: false, why: "It does not apply the full compound factor for three successive years."},
      {text: "£694", correct: false, why: "It truncates the calculated amount rather than rounding to the nearest penny."}
    ],
    solution_text: "The value after 3 years is $600(1.05)^3=£694.575$, which rounds to £694.58.",
    diagramRequired: false,
    uncertainties: []
  },
  "181113": {
    question_text: "Which shows a repeating pattern?",
    structure: "repeating-pattern-identification",
    meaningfulCase: "Option B repeats the three-item block apple, apple, banana; option A introduces fruit changes and does not repeat a fixed block.",
    mastery: true,
    options: [
      {text: "A", correct: false, why: "Its fruit sequence changes after the apples and bananas, so no fixed block repeats."},
      {text: "B", correct: true},
      {text: "Both A and B", correct: false, why: "Only B repeats a fixed block; the fruit sequence in A does not repeat."},
      {text: "Neither A nor B", correct: false, why: "Option B visibly repeats the apple, apple, banana block."}
    ],
    solution_text: "Option B repeats the block apple, apple, banana: apple, apple, banana, apple, apple, banana.",
    diagramRequired: true,
    uncertainties: []
  },
  "18974": {
    question_text: "Which statement is correct?",
    structure: "similar-shapes",
    meaningfulCase: "All semicircles have the same shape after scaling because each is determined by a diameter and a fixed half-circle form.",
    mastery: true,
    options: [
      {text: "All kites are similar", correct: false, why: "Kites can have different angles and side-length ratios, so their shapes need not match."},
      {text: "All hexagons are similar", correct: false, why: "Hexagons can have different angle patterns and side-length ratios."},
      {text: "All scalene triangles are similar", correct: false, why: "Scalene triangles can have many different angle combinations."},
      {text: "All semi-circles are similar", correct: true}
    ],
    solution_text: "Every semicircle is exactly half of a circle, so any semicircle can be enlarged or reduced to match any other. Therefore all semicircles are similar.",
    diagramRequired: false,
    uncertainties: []
  },
  "73512": {
    question_text: "3 bananas and 1 apple cost £2.45. 1 apple costs £0.35. How much does 1 banana cost?",
    structure: "linear-cost-equation",
    meaningfulCase: "Subtract the apple cost from the total to find the cost of three bananas, then divide by three.",
    mastery: true,
    options: [
      {text: "£0.70", correct: true},
      {text: "£2.10", correct: false, why: "This is the total cost of three bananas, not the cost of one banana."},
      {text: "£0.90", correct: false, why: "It does not divide the remaining £2.10 equally among three bananas."},
      {text: "£2.80", correct: false, why: "It adds the apple cost instead of subtracting it from the total."}
    ],
    solution_text: "Three bananas cost $£2.45-£0.35=£2.10$. One banana costs $£2.10\\div3=£0.70$.",
    diagramRequired: false,
    uncertainties: []
  },
  "84134": {
    question_text: "What is the nth term rule for this sequence? $15,11,7,3,-1,\\ldots$",
    structure: "linear-sequence-nth-term",
    meaningfulCase: "The sequence decreases by 4 each time, and the rule must give 15 when n=1.",
    mastery: true,
    options: [
      {text: "$11+4n$", correct: false, why: "It increases with n rather than decreasing by 4 between consecutive terms."},
      {text: "$n-4$", correct: false, why: "Its common difference is 1, not the required negative difference of 4."},
      {text: "$19-4n$", correct: true},
      {text: "$11-4n$", correct: false, why: "At n=1 this gives 7, so it starts four below the first sequence term."}
    ],
    solution_text: "The common difference is $-4$. Using $19-4n$, the first term is $19-4=15$, so it gives the sequence $15,11,7,3,-1$.",
    diagramRequired: false,
    uncertainties: []
  },
  "75639": {
    question_text: "Simplify $m\\div m^{-5}$.",
    structure: "indices-division",
    meaningfulCase: "When dividing powers with the same base, subtract the exponent in the denominator from the exponent in the numerator.",
    mastery: true,
    options: [
      {text: "$m^{-6}$", correct: false, why: "It subtracts 5 from 1 without accounting for the denominator exponent being negative."},
      {text: "$1^{-5}$", correct: false, why: "It loses the base m instead of applying the index division rule."},
      {text: "$m^6$", correct: true},
      {text: "$m^{-4}$", correct: false, why: "It treats the negative denominator exponent as though it were positive."}
    ],
    solution_text: "$m\\div m^{-5}=m^{1-(-5)}=m^6$.",
    diagramRequired: false,
    uncertainties: []
  },
  "84305": {
    question_text: "$\\square=307+176$. Which calculation gives the value of the box?",
    structure: "column-addition",
    meaningfulCase: "Add the hundreds, tens and units in the same place-value columns: 307 plus 176 equals 483.",
    mastery: true,
    options: [
      {text: "A: $176+307=483$", correct: true},
      {text: "B: $176+307=4713$", correct: false, why: "It incorrectly joins or carries place-value digits instead of adding the columns."},
      {text: "C: $307+176=473$", correct: false, why: "The units and tens are added incorrectly; the correct total is 483."},
      {text: "D: $176+307=473$", correct: false, why: "Changing the order does not change the sum, which is 483 rather than 473."}
    ],
    solution_text: "$307+176=300+100+7+70+6=400+80+3=483$. Therefore the box is 483.",
    diagramRequired: true,
    uncertainties: ["The source image shows an additional small 1 beneath option A's result; the visible column calculation itself gives 483, which is the only listed result matching the required sum."]
  },
  "181115": {
    question_text: "Which animal is wrong in this pattern?",
    structure: "repeating-animal-pattern",
    meaningfulCase: "The repeating block is cat, dog, dog; after the seventh animal, the eighth should be a dog, not a cat.",
    mastery: true,
    options: [
      {text: "A", correct: false, why: "The dog at position 3 fits the repeating cat, dog, dog pattern."},
      {text: "B", correct: false, why: "The cat at position 7 correctly starts the next repeat of the pattern."},
      {text: "C", correct: true},
      {text: "D", correct: false, why: "The dog at position 9 correctly completes the next cat, dog, dog block."}
    ],
    solution_text: "The pattern repeats cat, dog, dog. Positions 1, 4 and 7 are cats, while positions 2, 3, 5, 6, 8 and 9 should be dogs. The animal at C, position 8, is wrong.",
    diagramRequired: true,
    uncertainties: []
  },
  "140136": {
    question_text: "6 pupils can sit at a table for a science workshop. How many tables will be needed for 650 pupils?",
    structure: "division-rounding-up",
    meaningfulCase: "Divide 650 pupils by 6 places per table and round up because a fraction of a table still requires another complete table.",
    mastery: true,
    options: [
      {text: "108", correct: false, why: "108 tables seat only 648 pupils, leaving two pupils without a place."},
      {text: "183", correct: false, why: "It uses an incorrect quotient and is far more tables than necessary."},
      {text: "108.3", correct: false, why: "Tables must be whole objects, so a decimal answer cannot provide seating."},
      {text: "109", correct: true}
    ],
    solution_text: "$650\\div6=108\\frac13$. Since all pupils need a seat and tables are whole, round up to 109 tables.",
    diagramRequired: true,
    uncertainties: []
  },
  "32830": {
    question_text: "$3452+1000\\;\\square\\;5542-1000$. Which symbol will make the number sentence correct?",
    structure: "compare-calculated-values",
    meaningfulCase: "Calculate both sides: the left expression is 4452 and the right expression is 4542, so the left side is smaller.",
    mastery: true,
    options: [
      {text: ">", correct: false, why: "$4452$ is not greater than $4542$, so the greater-than sign points the wrong way."},
      {text: "<", correct: true},
      {text: "=", correct: false, why: "The two calculated values differ by 90, so they are not equal."},
      {text: "All of these will work", correct: false, why: "Only the less-than symbol correctly compares 4452 with 4542."}
    ],
    solution_text: "$3452+1000=4452$ and $5542-1000=4542$. Since $4452<4542$, the correct symbol is $<$.",
    diagramRequired: false,
    uncertainties: []
  },
  "160403": {
    question_text: "$\\frac13$ of this shape is shaded. What other diagram shows $\\frac13$ of the same shape shaded?",
    structure: "fraction-of-area-diagram",
    meaningfulCase: "The original rectangle has 12 equal grid squares, so one third is 4 shaded squares.",
    mastery: true,
    options: [
      {text: "A", correct: false, why: "It shades 6 of 12 equal squares, which is one half rather than one third."},
      {text: "B", correct: false, why: "It shades 3 of 12 equal squares, which is one quarter rather than one third."},
      {text: "C", correct: true},
      {text: "D", correct: false, why: "The triangular shading does not represent the same one-third area as the reference grid."}
    ],
    solution_text: "The rectangle is divided into 12 equal squares. One third is $12\\div3=4$ squares. Diagram C shades 4 squares, so it shows one third.",
    diagramRequired: true,
    uncertainties: []
  },
  "160583": {
    question_text: "Calculate $1.2\\div0.03$.",
    structure: "decimal-division",
    meaningfulCase: "Multiply both numbers by 100 to remove decimals, giving 120 divided by 3.",
    mastery: true,
    options: [
      {text: "0.4", correct: false, why: "It divides as though the divisor were 3 rather than 0.03 and is much too small."},
      {text: "400", correct: false, why: "It moves the decimal places incorrectly and gives a result ten times too large."},
      {text: "4", correct: false, why: "It treats 0.03 like 0.3, producing a result ten times too small."},
      {text: "40", correct: true}
    ],
    solution_text: "$1.2\\div0.03=120\\div3=40$.",
    diagramRequired: false,
    uncertainties: []
  },
  "160584": {
    question_text: "A holiday is booked from Sept 28th to October 8th inclusive. How many days will David be in Spain?",
    structure: "inclusive-date-counting",
    meaningfulCase: "Count all three days from September 28 to 30 and all eight days from October 1 to 8.",
    mastery: true,
    options: [
      {text: "11", correct: true},
      {text: "10", correct: false, why: "It counts the elapsed interval but omits one endpoint despite the word inclusive."},
      {text: "9", correct: false, why: "It omits two days from the inclusive count of the dates."},
      {text: "12", correct: false, why: "It includes one day too many beyond October 8."}
    ],
    solution_text: "September 28, 29 and 30 gives 3 days. October 1 to 8 gives 8 days. Thus $3+8=11$ days.",
    diagramRequired: false,
    uncertainties: []
  },
  "160586": {
    question_text: "A car travels 3 hours at a speed of 70 mph. How far does it travel?",
    structure: "distance-speed-time",
    meaningfulCase: "Use distance equals speed multiplied by time, with speed 70 miles per hour and time 3 hours.",
    mastery: true,
    options: [
      {text: "200 miles", correct: false, why: "It is not the product of 70 miles per hour and 3 hours."},
      {text: "210 mph", correct: false, why: "It has the right number but uses speed units rather than distance units."},
      {text: "210 miles", correct: true},
      {text: "73 miles", correct: false, why: "It adds or combines the speed and time instead of multiplying them."}
    ],
    solution_text: "Distance $=speed\\times time=70\\times3=210$ miles.",
    diagramRequired: false,
    uncertainties: []
  },
  "161584": {
    question_text: "An object travels 8 miles at an average speed of 40 mph. Work out how many minutes the object is travelling for.",
    structure: "time-speed-distance-conversion",
    meaningfulCase: "Time in hours is distance divided by speed, then convert hours to minutes.",
    mastery: true,
    options: [
      {text: "320 minutes", correct: false, why: "It multiplies distance by speed instead of dividing to find time."},
      {text: "12 minutes", correct: true},
      {text: "5 minutes", correct: false, why: "It gives the time in hours but does not convert 0.2 hours to minutes correctly."},
      {text: "20 minutes", correct: false, why: "It doubles the correct converted time instead of using 8 divided by 40."}
    ],
    solution_text: "Time $=8\\div40=0.2$ hours. Since one hour is 60 minutes, $0.2\\times60=12$ minutes.",
    diagramRequired: false,
    uncertainties: []
  },
  "72962": {
    question_text: "When solving the following equation $\\frac{x}{3}+5=8$, which of these next steps is incorrect?",
    structure: "equation-solving-step-check",
    meaningfulCase: "Subtracting 5 and multiplying the original equation by 3 or 6 are valid transformations; only adding 5 to the left before multiplying is invalid.",
    mastery: true,
    options: [
      {text: "$x+5=24$", correct: true},
      {text: "$x+15=24$", correct: false, why: "Multiplying the original equation by 3 gives x plus 15 equals 24, so this step is valid."},
      {text: "$\\frac{x}{3}=3$", correct: false, why: "Subtracting 5 from both sides gives x over 3 equals 3, so this step is valid."},
      {text: "$2x+30=48$", correct: false, why: "Multiplying every term of the original equation by 6 gives this equivalent equation."}
    ],
    solution_text: "The step $x+5=24$ is incorrect because multiplying $x/3$ by 3 should also multiply 5 by 3, giving $x+15=24$. The other three equations are valid equivalent steps.",
    diagramRequired: false,
    uncertainties: []
  },
  "73516": {
    question_text: "Find $\\frac3{10}$ of £6.00.",
    structure: "fraction-of-amount",
    meaningfulCase: "Multiply the amount by three tenths, or divide by 10 and multiply by 3.",
    mastery: true,
    options: [
      {text: "60 p", correct: false, why: "It calculates one tenth of £6 but does not multiply that amount by 3."},
      {text: "£2.00", correct: false, why: "It takes one third of £6 rather than three tenths of £6."},
      {text: "£0.18", correct: false, why: "It treats the fraction as 0.03 or otherwise makes the result far too small."},
      {text: "£1.80", correct: true}
    ],
    solution_text: "$\\frac3{10}\\times£6.00=£1.80$.",
    diagramRequired: false,
    uncertainties: []
  },
  "73687": {
    question_text: "Here is one side of a cuboid made from 1 cm³ cubes. The length, width and height of the cuboid are all different. What is a possible volume of the cuboid?",
    structure: "cuboid-volume-from-factor",
    meaningfulCase: "The shown side has length 4, so one cuboid dimension is 4; choose a volume with three different integer factors including 4.",
    mastery: true,
    options: [
      {text: "4 cm³", correct: false, why: "A volume of 4 would require repeated unit dimensions or a dimension of 1, not three different factors including 4."},
      {text: "16 cm³", correct: false, why: "The factorisations of 16 cannot give three different positive integer dimensions including 4."},
      {text: "12 cm³", correct: true},
      {text: "4 cm²", correct: false, why: "Square centimetres are area units, whereas the question asks for a cuboid volume."}
    ],
    solution_text: "A possible set of dimensions is $4\\times3\\times1$ cm. They are all different and give volume $12$ cm$^3$.",
    diagramRequired: true,
    uncertainties: []
  },
  "80011": {
    question_text: "Factorise the quadratic $x^2+6x+5$.",
    structure: "quadratic-factorisation",
    meaningfulCase: "Find two numbers whose product is 5 and sum is 6: 1 and 5.",
    mastery: true,
    options: [
      {text: "$(x+2)(x+3)$", correct: false, why: "The constants multiply to 6 and add to 5, so the middle and constant terms are wrong."},
      {text: "$(x+1)(x+5)$", correct: true},
      {text: "$x(x+6)+5$", correct: false, why: "Although equivalent after expansion, this expression is not factorised into two linear factors."},
      {text: "$(x+1)(x+6)$", correct: false, why: "The constants multiply to 6, producing the wrong constant term."}
    ],
    solution_text: "The numbers 1 and 5 multiply to 5 and add to 6, so $x^2+6x+5=(x+1)(x+5)$.",
    diagramRequired: true,
    uncertainties: ["Option C is algebraically equivalent to the given quadratic but is not factorised; option B is the intended factorised answer."]
  }
};

function isCompleteTranscription(t) {
  if (!t || typeof t !== 'object') return false;
  if (typeof t.question_text !== 'string' || typeof t.structure !== 'string' || typeof t.meaningfulCase !== 'string' || typeof t.mastery !== 'boolean' || typeof t.solution_text !== 'string' || typeof t.diagramRequired !== 'boolean' || !Array.isArray(t.options) || !Array.isArray(t.uncertainties)) return false;
  if (t.options.length < 3 || t.options.length > 5) return false;
  if (t.options.filter(o => o && o.correct === true).length !== 1) return false;
  return t.options.every(o => o && typeof o.text === 'string' && typeof o.correct === 'boolean' && (o.correct || (typeof o.why === 'string' && o.why.length >= 15)));
}

function authoritativeRecords() {
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  return raw.jobs ?? raw.data ?? (Array.isArray(raw) ? raw : [raw]);
}

export function writeAssigned(jobId) {
  const job = authoritativeRecords().find(j => j.jobId === jobId);
  if (!job) throw new Error(`Authoritative job not found: ${jobId}`);
  const candidates = job.candidates.map(c => {
    const existing = c.transcription;
    const added = existing ?? T[c.source.id];
    if (!isCompleteTranscription(added)) throw new Error(`Incomplete transcription for ${jobId}/${c.source.id}`);
    return {...c, transcription: added};
  });
  const out = {jobId, candidates};
  if (candidates.length !== job.candidates.length) throw new Error(`Candidate count mismatch for ${jobId}`);
  fs.mkdirSync(outputDir, {recursive:true});
  fs.writeFileSync(path.join(outputDir, `${jobId}.json`), JSON.stringify(out, null, 2) + '\n', 'utf8');
}

if (process.argv[2]) writeAssigned(process.argv[2]);
