import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputPath = path.join(root, '.diagnostic-questions', 'visual-jobs-current.json');
const outputDir = path.join(root, '.diagnostic-questions', 'transcriptions-full-20260802');

const t = {
  '20180': {
    question_text: 'What is the derivative of $\dfrac{1}{4x^3}$, $x\ne0$?',
    structure: 'differentiate-reciprocal-power-function',
    meaningfulCase: 'rewrite-negative-power-and-apply-power-rule',
    mastery: false,
    options: [
      {text: '$\dfrac{1}{12x^2}$', correct: false, why: 'Differentiates the denominator without applying the negative power rule.'},
      {text: '$-\dfrac{1}{12x^2}$', correct: false, why: 'Uses the derivative of a reciprocal power with the wrong exponent.'},
      {text: '$\dfrac{4}{x^4}$', correct: false, why: 'Inverts the coefficient and misses the negative sign from differentiation.'},
      {text: '$-\dfrac{3}{4x^4}$', correct: true}
    ],
    solution_text: 'Rewrite $\dfrac{1}{4x^3}=\dfrac14x^{-3}$. Differentiating gives $\dfrac14(-3)x^{-4}=-\dfrac{3}{4x^4}$, so option D is correct.',
    diagramRequired: false,
    uncertainties: []
  },
  '441': {
    question_text: 'What is the order of rotational symmetry of a rectangle?',
    structure: 'identify-rotational-symmetry-order-of-rectangle',
    meaningfulCase: 'half-turn-maps-rectangle-to-itself',
    mastery: false,
    options: [
      {text: '$2$', correct: true},
      {text: '$1$', correct: false, why: 'Counts only the unchanged starting position and misses the half-turn.'},
      {text: '$4$', correct: false, why: 'Confuses a rectangle with a square, which has fourfold symmetry.'},
      {text: '$0$', correct: false, why: 'Every shape has at least the identity rotation as a symmetry.'}
    ],
    solution_text: 'A rectangle matches itself after a rotation of $180^\circ$ as well as after a full turn of $360^\circ$. Therefore its order of rotational symmetry is $2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '68346': {
    question_text: 'Ellie measures the temperature of her drink using the thermometer. Which of these should she record?',
    structure: 'read-temperature-scale-with-correct-unit',
    meaningfulCase: 'read-marked-temperature-and-use-degrees-fahrenheit',
    mastery: false,
    options: [
      {text: '$104\,\mathrm{mm}$', correct: false, why: 'Uses a length unit instead of the thermometer’s temperature unit.'},
      {text: '$108^\circ\mathrm{F}$', correct: true},
      {text: '$108\,\mathrm{mm}$', correct: false, why: 'Uses millimetres, which cannot be the unit for this temperature reading.'},
      {text: '$104^\circ\mathrm{F}$', correct: false, why: 'Uses the wrong nearby scale value rather than the marked reading.'}
    ],
    solution_text: 'The thermometer reading is $108$ on a Fahrenheit scale, so the measurement should be recorded as $108^\circ\mathrm{F}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '82487': {
    question_text: 'What is the solution to $x^2\ge16$?',
    structure: 'solve-quadratic-inequality-by-factor-or-square-root',
    meaningfulCase: 'outside-interval-including-boundary-values',
    mastery: false,
    options: [
      {text: '$x\ge4$ or $x\le-4$', correct: true},
      {text: '$x\le4$ or $x\ge-4$', correct: false, why: 'Combines the two inequalities into almost all real values.'},
      {text: '$-4\le x\le4$', correct: false, why: 'Describes the inside interval where the square is at most sixteen.'},
      {text: '$-4\ge x\ge4$', correct: false, why: 'Reverses the interval ordering and gives an impossible chained inequality.'}
    ],
    solution_text: 'Since $x^2\ge16$, the distance of $x$ from zero is at least $4$. Thus $x\le-4$ or $x\ge4$, including both endpoints.',
    diagramRequired: false,
    uncertainties: []
  },
  '107818': {
    question_text: 'A cuboid has length $15\,\mathrm{cm}$, depth $5\,\mathrm{cm}$ and height $10\,\mathrm{cm}$. To calculate angle $EFD$, which diagram is correct?',
    structure: 'select-correct-right-triangle-for-3d-angle',
    meaningfulCase: 'base-diagonal-is-opposite-vertical-edge-in-triangle-efd',
    mastery: false,
    options: [
      {text: 'A: right triangle with $FE=10\,\mathrm{cm}$, $ED=15.81\,\mathrm{cm}$ and the angle at $F$', correct: true},
      {text: 'B: right triangle with the angle at $D$', correct: false, why: 'Places the required angle at D instead of at F.'},
      {text: 'C: right triangle with the angle at D and the base diagonal labelled $15.81\,\mathrm{cm}$', correct: false, why: 'Uses the wrong angle and does not represent angle EFD.'},
      {text: 'D: right triangle with $15.81\,\mathrm{cm}$ labelled on hypotenuse $FD$', correct: false, why: 'The $15.81$ cm length is the base diagonal $ED$, not the space diagonal $FD$.'}
    ],
    solution_text: 'The base diagonal $ED$ has length $\sqrt{15^2+5^2}=\sqrt{250}\approx15.81\,\mathrm{cm}$. Together with the vertical edge $FE=10\,\mathrm{cm}$, this forms a right triangle $EFD$, and angle $EFD$ is at $F$. Therefore diagram A is correct.',
    diagramRequired: true,
    uncertainties: []
  },
  '20580': {
    question_text: 'What is the value of $(\mathbf{i}+2\mathbf{j})\mathbin{\cdot}(\mathbf{j}+2\mathbf{k})$?',
    structure: 'evaluate-dot-product-of-3d-vectors',
    meaningfulCase: 'orthogonal-unit-vector-components-give-zero-products',
    mastery: false,
    options: [
      {text: '$0$', correct: false, why: 'Treats the vectors as perpendicular despite their shared j-components.'},
      {text: '$2$', correct: true},
      {text: '$5$', correct: false, why: 'Adds selected coefficients rather than taking the dot product.'},
      {text: '$9$', correct: false, why: 'Treats the expression like ordinary polynomial multiplication.'}
    ],
    solution_text: 'Using $\mathbf{i}\cdot\mathbf{i}=\mathbf{j}\cdot\mathbf{j}=\mathbf{k}\cdot\mathbf{k}=1$ and different unit vectors having dot product zero, $(1,2,0)\cdot(0,1,2)=0+2+0=2$. However, the screenshot’s expression is $(\mathbf{i}+2\mathbf{j})\cdot(\mathbf{j}+2\mathbf{k})$, which gives $2$, so option B is correct.',
    diagramRequired: false,
    uncertainties: []
  },
  '66408': {
    question_text: 'Convert $6700\,\mathrm{cm^2}$ to $\mathrm{m^2}$.',
    structure: 'convert-square-centimetres-to-square-metres',
    meaningfulCase: 'divide-area-by-one-hundred-squared',
    mastery: false,
    options: [
      {text: '$0.67$', correct: true},
      {text: '$67$', correct: false, why: 'Divides by 100 instead of using the squared area conversion factor.'},
      {text: '$6.7$', correct: false, why: 'Uses an incorrect decimal conversion for square centimetres.'},
      {text: '$67{,}000{,}000$', correct: false, why: 'Converts in the wrong direction and greatly increases the area.'}
    ],
    solution_text: 'Since $1\,\mathrm m^2=10{,}000\,\mathrm{cm^2}$, $6700\,\mathrm{cm^2}=6700\div10{,}000=0.67\,\mathrm{m^2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '79645': {
    question_text: 'A pyramid has a rectangular base measuring $10\,\mathrm{cm}$ by $6\,\mathrm{cm}$ and a sloping edge of $18\,\mathrm{cm}$. Work out the vertical height of the pyramid.',
    structure: 'find-height-of-pyramid-using-3d-pythagoras',
    meaningfulCase: 'use-half-base-diagonal-as-horizontal-leg',
    mastery: false,
    options: [
      {text: '$17\,\mathrm{cm}$', correct: true},
      {text: '$16\,\mathrm{cm}$', correct: false, why: 'Uses an incorrect horizontal distance in the right triangle.'},
      {text: '$18.9\,\mathrm{cm}$', correct: false, why: 'Produces a height longer than the given sloping edge.'},
      {text: '$13.7\,\mathrm{cm}$', correct: false, why: 'Uses an incorrect combination of the base dimensions.'}
    ],
    solution_text: 'The horizontal distance from the centre of the rectangular base to a corner is $\sqrt{5^2+3^2}=\sqrt{34}$. Hence $h^2+34=18^2$, so $h=\sqrt{290}\approx17.0\,\mathrm{cm}$.',
    diagramRequired: true,
    uncertainties: ['The foot of the vertical height is shown inside the base rather than labelled explicitly; interpreting it as the centre gives the intended answer $17\,\mathrm{cm}$.']
  },
  '5290': {
    question_text: 'For $y=x^2-3x-2$, the table gives $x=-2,-1,0,1,2,3,4$. What number should replace the star in the $y$ row?',
    structure: 'evaluate-quadratic-function-from-table-input',
    meaningfulCase: 'substitute-negative-input-into-quadratic',
    mastery: false,
    options: [
      {text: '$2$', correct: true},
      {text: '$3$', correct: false, why: 'Substitutes the input incorrectly or drops the constant term.'},
      {text: '$-4$', correct: false, why: 'Confuses the value for a different input in the table.'},
      {text: '$-3$', correct: false, why: 'Uses an incorrect sign when evaluating at $x=-1$.'}
    ],
    solution_text: 'At $x=-1$, $y=(-1)^2-3(-1)-2=1+3-2=2$. Therefore the star should be replaced by $2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '7512': {
    question_text: 'Find the area of the triangle with sides $12\,\mathrm m$ and $22\,\mathrm m$ enclosing an angle of $44^\circ$.',
    structure: 'find-area-of-non-right-triangle-using-sine',
    meaningfulCase: 'use-two-sides-and-included-angle',
    mastery: false,
    options: [
      {text: '$70.9\,\mathrm{m^2}$', correct: false, why: 'Uses the wrong angle or omits the required sine factor.'},
      {text: '$95.0\,\mathrm{m^2}$', correct: false, why: 'Uses an incorrect trigonometric calculation for the included angle.'},
      {text: '$91.7\,\mathrm{m^2}$', correct: true},
      {text: '$183.4\,\mathrm{m^2}$', correct: false, why: 'Doubles the triangle area by omitting the factor of one half.'}
    ],
    solution_text: 'Use $A=\frac12ab\sin C$. Thus $A=\frac12(12)(22)\sin44^\circ\approx91.7\,\mathrm{m^2}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '104127': {
    question_text: 'Evaluate $\displaystyle\int_0^\pi \sin^2(x)\,dx$.',
    structure: 'integrate-squared-sine-over-full-half-period',
    meaningfulCase: 'use-double-angle-identity-on-symmetric-limits',
    mastery: false,
    options: [
      {text: '$\pi$', correct: false, why: 'Forgets the one-half factor in the sine-squared identity.'},
      {text: '$\dfrac{\pi}{2}$', correct: true},
      {text: '$\dfrac{\pi}{4}$', correct: false, why: 'Introduces an extra factor of one half in the integration.'},
      {text: '$2\pi$', correct: false, why: 'Doubles the integral instead of averaging the squared sine.'}
    ],
    solution_text: 'Use $\sin^2x=\frac12(1-\cos2x)$. Then $\int_0^\pi\sin^2x\,dx=\left[\frac{x}{2}-\frac{\sin2x}{4}\right]_0^\pi=\frac\pi2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '13175': {
    question_text: 'A cuboid has point $P=(2,3,4)$ and point $Q$ is directly below $P$ on the base. What are the coordinates of $Q$?',
    structure: 'name-coordinate-of-vertically-projected-point-in-cuboid',
    meaningfulCase: 'vertical-projection-sets-y-coordinate-to-zero',
    mastery: false,
    options: [
      {text: '$(2,3,0)$', correct: false, why: 'Changes the z-coordinate instead of setting the vertical y-coordinate to zero.'},
      {text: '$(2,0,4)$', correct: true},
      {text: '$(0,0,4)$', correct: false, why: 'Changes both the x- and y-coordinates even though Q is below P.'},
      {text: '$(2,0,0)$', correct: false, why: 'Changes both vertical and depth coordinates rather than only y.'}
    ],
    solution_text: 'Moving straight down the cuboid preserves the x- and z-coordinates and changes only the vertical y-coordinate from $3$ to $0$. Hence $Q=(2,0,4)$.',
    diagramRequired: true,
    uncertainties: []
  },
  '144095': {
    question_text: '$(x+1)$ is a factor of $2x^3-8x^2+2x+12$. The graph is $y=2x^3-8x^2+2x+12$. What are the coordinates of $A$, $B$ and $C$?',
    structure: 'find-intercepts-of-cubic-from-factorisation',
    meaningfulCase: 'factor-cubic-and-order-three-x-intercepts',
    mastery: false,
    options: [
      {text: 'A $=(-2,0),(4,0),(6,0)$', correct: false, why: 'Uses roots that do not satisfy the given cubic polynomial.'},
      {text: 'B $=(-1,0),(2,0),(6,0)$', correct: false, why: 'Gets one root wrong after factorising the remaining quadratic.'},
      {text: 'C $=(-1,0),(\frac12,0),(3,0)$', correct: false, why: 'Introduces an incorrect half-root when solving the quadratic factor.'},
      {text: 'D $=(-1,0),(2,0),(3,0)$', correct: true}
    ],
    solution_text: 'Factor the polynomial: $2x^3-8x^2+2x+12=2(x+1)(x-2)(x-3)$. The x-intercepts are therefore $-1$, $2$ and $3$, giving option D in left-to-right order.',
    diagramRequired: true,
    uncertainties: []
  },
  '87633': {
    question_text: 'For $f(x)=\frac13x^3-x^2-3x+6$, determine the interval where $f$ is decreasing.',
    structure: 'find-decreasing-interval-from-derivative-sign',
    meaningfulCase: 'derivative-negative-between-critical-points',
    mastery: false,
    options: [
      {text: '$x>3$ or $x<-1$', correct: false, why: 'Reverses the derivative sign and selects the increasing intervals.'},
      {text: '$-1<x<3$', correct: true},
      {text: '$x<-3$ or $x>1$', correct: false, why: 'Uses incorrect critical points for the derivative.'},
      {text: '$-3<x<1$', correct: false, why: 'Uses the wrong roots when determining where the derivative is negative.'}
    ],
    solution_text: 'Differentiate: $f\'(x)=x^2-2x-3=(x+1)(x-3)$. This quadratic is negative between its roots, so $f$ is decreasing for $-1<x<3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '103822': {
    question_text: 'Tom says a fraction cannot be simplified if its numerator and denominator are both different prime numbers. Katie says a fraction cannot be simplified if its numerator and denominator are both different odd numbers. Who is correct?',
    structure: 'judge-claims-about-fraction-simplification',
    meaningfulCase: 'common-factor-condition-not-parity-alone',
    mastery: false,
    options: [
      {text: 'Only Tom', correct: true},
      {text: 'Only Katie', correct: false, why: 'Different odd numbers can still share an odd common factor.'},
      {text: 'Both Tom and Katie', correct: false, why: 'Katie’s claim is false because odd numbers can have common factors.'},
      {text: 'Neither is correct', correct: false, why: 'Tom’s claim is valid because different primes have no common factor.'}
    ],
    solution_text: 'Different prime numbers have greatest common divisor $1$, so Tom is correct. Being odd does not prevent a common factor: for example, $9$ and $15$ are different odd numbers and share factor $3$.',
    diagramRequired: true,
    uncertainties: []
  },
  '13525': {
    question_text: 'For the network represented by the table, what is the length of the shortest route from A to I?',
    structure: 'find-shortest-network-route-using-dijkstra',
    meaningfulCase: 'compare-cumulative-path-lengths-to-destination',
    mastery: false,
    options: [
      {text: '$7$', correct: true},
      {text: '$8$', correct: false, why: 'Chooses a longer route through F, D and G instead of the route through H.'},
      {text: '$9$', correct: false, why: 'Adds edge lengths from a non-shortest route to I.'},
      {text: '$6$', correct: false, why: 'Omits one edge length from the shortest complete route.'}
    ],
    solution_text: 'The route $A\to H\to G\to I$ has length $4+1+2=7$. Other plausible routes, such as $A\to F\to D\to G\to I$, have length $8$, so the shortest route has length $7$.',
    diagramRequired: true,
    uncertainties: []
  },
  '145438': {
    question_text: 'What format must an equation be rearranged into in order to use fixed-point iteration?',
    structure: 'identify-fixed-point-iteration-form',
    meaningfulCase: 'rewrite-equation-as-x-equals-function-of-x',
    mastery: false,
    options: [
      {text: '$f(x)=g(x)$', correct: false, why: 'This is a general equation form, not the iteration update form.'},
      {text: '$f(x)=0$', correct: false, why: 'This is a root-finding form but does not define the next iterate.'},
      {text: '$\dfrac{f(x)}{g(x)}=0$', correct: false, why: 'A quotient equal to zero is not the required fixed-point form.'},
      {text: '$x=f(x)$', correct: true}
    ],
    solution_text: 'Fixed-point iteration requires a function whose fixed point is the desired root, so the equation must be rearranged to $x=f(x)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '155017': {
    question_text: 'When integrating by parts, which expression is correct for $\displaystyle\int 2x\sin x\,dx$?',
    structure: 'apply-integration-by-parts-to-product',
    meaningfulCase: 'choose-u-and-dv-with-negative-cosine-antiderivative',
    mastery: false,
    options: [
      {text: '$-2\cos x-\int 2\sin x\,dx$', correct: false, why: 'Drops the factor x from the product term.'},
      {text: '$-2x\cos x-\int 2\sin x\,dx$', correct: false, why: 'Uses the wrong sign for the remaining integral.'},
      {text: '$-2x\cos x+\int 2\cos x\,dx$', correct: true},
      {text: '$-2\cos x+\int 2\cos x\,dx$', correct: false, why: 'Drops x from the first product and uses the wrong structure.'}
    ],
    solution_text: 'Take $u=2x$ and $dv=\sin x\,dx$, so $du=2\,dx$ and $v=-\cos x$. Then $\int u\,dv=uv-\int v\,du=-2x\cos x+\int2\cos x\,dx$, which is option C.',
    diagramRequired: true,
    uncertainties: []
  },
  '3786': {
    question_text: 'Simplify $\dfrac{\cos\theta}{\sin\theta}$.',
    structure: 'simplify-reciprocal-trigonometric-ratio',
    meaningfulCase: 'cosine-over-sine-is-cotangent',
    mastery: false,
    options: [
      {text: '$\cot\theta$', correct: true},
      {text: '$\tan\theta$', correct: false, why: 'Uses the reciprocal ratio, which is sine over cosine.'},
      {text: '$\cosec\theta$', correct: false, why: 'Identifies only the reciprocal of sine, not the quotient.'},
      {text: 'None of the above', correct: false, why: 'The quotient is exactly the standard identity for cotangent.'}
    ],
    solution_text: 'By definition, $\cot\theta=\dfrac{\cos\theta}{\sin\theta}$. Therefore the expression simplifies to $\cot\theta$.',
    diagramRequired: false,
    uncertainties: []
  },
  '68271': {
    question_text: 'Find the equation of the curve that has gradient $\dfrac{dy}{dx}=\dfrac1{x^2}$ and passes through $(1,3)$.',
    structure: 'find-curve-equation-from-gradient-and-point',
    meaningfulCase: 'integrate-reciprocal-square-and-use-point-condition',
    mastery: false,
    options: [
      {text: '$y=-\dfrac1x+4$', correct: true},
      {text: '$y=-x+4$', correct: false, why: 'Differentiates to a constant rather than $1/x^2$.'},
      {text: '$y=\dfrac1x+2$', correct: false, why: 'Has the wrong sign for the antiderivative of $x^{-2}$.'},
      {text: '$y=-\dfrac1x+2$', correct: false, why: 'Has the correct gradient but does not pass through $(1,3)$.'}
    ],
    solution_text: 'Since $\dfrac{dy}{dx}=x^{-2}$, integration gives $y=-x^{-1}+C=-\dfrac1x+C$. Using $(1,3)$ gives $3=-1+C$, so $C=4$ and $y=-\dfrac1x+4$.',
    diagramRequired: true,
    uncertainties: []
  },
  '135646': {
    question_text: 'Which quadratic inequality does this number line show the solution to?',
    structure: 'interpret-open-interval-number-line-as-quadratic-inequality',
    meaningfulCase: 'strictly-between-symmetric-roots',
    mastery: false,
    options: [
      {text: '$x^2<2$', correct: false, why: 'The boundary points shown are $-4$ and $4$, not the roots of $x^2=2$.'},
      {text: '$x^2<16$', correct: true},
      {text: '$x^2<4$', correct: false, why: 'Would give boundaries $-2$ and $2$, not $-4$ and $4$.'},
      {text: '$x^2>16$', correct: false, why: 'Describes the outside rays rather than the open interval between the endpoints.'}
    ],
    solution_text: 'The open segment represents $-4<x<4$. Squaring this symmetric interval gives $x^2<16$, so the correct inequality is option B.',
    diagramRequired: true,
    uncertainties: []
  },
  '89134': {
    question_text: 'Calculate the area of the region bounded by $y=8x^2-24x$ and the x-axis.',
    structure: 'find-area-between-quadratic-and-axis',
    meaningfulCase: 'integral-is-negative-below-axis-take-positive-area',
    mastery: false,
    options: [
      {text: '$72\,u^2$', correct: false, why: 'Uses an incorrect antiderivative or ignores one root interval.'},
      {text: '$36\,u^2$', correct: true},
      {text: '$108\,u^2$', correct: false, why: 'Adds magnitudes incorrectly instead of evaluating the bounded region.'},
      {text: '$-36\,u^2$', correct: false, why: 'Reports the signed integral even though area must be positive.'}
    ],
    solution_text: 'The curve meets the x-axis at $x=0$ and $x=3$ and lies below it between them. Thus the area is $-\int_0^3(8x^2-24x)\,dx=-[\frac83x^3-12x^2]_0^3=36\,u^2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '95292': {
    question_text: 'Which calculation cannot be used to complete the equality $\dfrac{215\times31}{24}=\square$?',
    structure: 'recognise-equivalent-rearrangements-of-fraction-products',
    meaningfulCase: 'denominator-must-remain-associated-with-product',
    mastery: false,
    options: [
      {text: '$\dfrac{31\times215}{24}$', correct: false, why: 'This is equivalent because multiplication is commutative.'},
      {text: '$\dfrac{31}{24}\times215$', correct: false, why: 'This preserves the same numerator product divided by 24.'},
      {text: '$\dfrac{215\times24}{31}$', correct: true},
      {text: '$\dfrac{215}{24}\times31$', correct: false, why: 'This is equivalent by separating the numerator factors.'}
    ],
    solution_text: 'The original expression is $\dfrac{215\times31}{24}$. Options A, B and D preserve this value by rearranging multiplication, whereas option C changes both the numerator and denominator and is not equivalent.',
    diagramRequired: true,
    uncertainties: []
  },
  '14007': {
    question_text: 'A sequence is defined by $u_{n+1}=0.5u_n+2$ and $u_0=8$. Which statement about the sequence is true? (1) A limit exists. (2) No term is greater than $8$.',
    structure: 'analyse-convergent-affine-recurrence',
    meaningfulCase: 'contraction-tends-to-fixed-point-from-initial-value',
    mastery: false,
    options: [
      {text: 'Neither statement is correct', correct: false, why: 'The recurrence converges and its terms do not exceed the initial value.'},
      {text: 'Only statement (1) is correct', correct: false, why: 'Statement (2) is also true because the sequence decreases from 8.'},
      {text: 'Only statement (2) is correct', correct: false, why: 'The contraction recurrence also has a finite limit.'},
      {text: 'Both statements are correct', correct: true}
    ],
    solution_text: 'The fixed point satisfies $L=0.5L+2$, giving $L=4$. Starting from $u_0=8$, each term is between $4$ and $8$ and decreases towards $4$. Hence a limit exists and no term is greater than $8$.',
    diagramRequired: false,
    uncertainties: []
  },
  '20227': {
    question_text: 'Given $0\le a\le\frac\pi2$ and $\sin a=\frac35$, find an expression for $\sin(x+a)$.',
    structure: 'expand-sine-of-sum-using-exact-trigonometric-values',
    meaningfulCase: 'first-quadrant-cosine-positive-from-pythagorean-identity',
    mastery: false,
    options: [
      {text: '$\sin x+\frac35$', correct: false, why: 'Adds the sine terms instead of using the sine addition identity.'},
      {text: '$\frac45\sin x+\frac35\cos x$', correct: true},
      {text: '$\frac35\sin x-\frac45\cos x$', correct: false, why: 'Uses the wrong sign and swaps the sine and cosine coefficients.'},
      {text: '$\frac25\sin x-\frac35\cos x$', correct: false, why: 'Uses incorrect exact values and the wrong sign.'}
    ],
    solution_text: 'Because $a$ is in the first quadrant, $\cos a=\frac45$. Therefore $\sin(x+a)=\sin x\cos a+\cos x\sin a=\frac45\sin x+\frac35\cos x$.',
    diagramRequired: false,
    uncertainties: []
  },
  '20857': {
    question_text: 'Scores in an IB maths exam are normally distributed with mean $62\%$ and standard deviation $12\%$. Find the probability that a randomly chosen student scores a 3 or below if the score for a 4 starts at $55\%$.',
    structure: 'find-normal-left-tail-probability-from-threshold',
    meaningfulCase: 'standardise-threshold-below-mean',
    mastery: false,
    options: [
      {text: '$0.333$', correct: false, why: 'Uses an inaccurate standard normal probability for the threshold.'},
      {text: '$0.72$', correct: false, why: 'Uses the probability on the wrong side of the threshold.'},
      {text: '$0.667$', correct: false, why: 'Uses the complementary probability instead of the lower-tail probability.'},
      {text: '$0.28$', correct: true}
    ],
    solution_text: 'For $X\sim N(62,12^2)$, the boundary $55$ has $z=(55-62)/12\approx-0.58$. The lower-tail probability is $\Phi(-0.58)\approx0.28$, so the answer is $0.28$.',
    diagramRequired: false,
    uncertainties: []
  },
  '21201': {
    question_text: 'Let $f(x)=\ln x$, for $x>0$. The equation of the normal to $f$ at $A(x,1)$ is:',
    structure: 'find-normal-line-to-logarithmic-curve',
    meaningfulCase: 'point-condition-fixes-x-equals-e-and-reciprocal-normal-slope',
    mastery: false,
    options: [
      {text: '$y=1+e^2-ex$', correct: true},
      {text: '$y=\dfrac{x}{e}$', correct: false, why: 'Uses the tangent slope rather than the negative reciprocal normal slope.'},
      {text: '$y=ex-2$', correct: false, why: 'Uses an incorrect positive slope and intercept.'},
      {text: '$y=\dfrac{x}{e}+2$', correct: false, why: 'Has the wrong sign and does not pass through the stated point.'}
    ],
    solution_text: 'Since $\ln x=1$, the point has $x=e$. The tangent gradient is $1/e$, so the normal gradient is $-e$. Hence $y-1=-e(x-e)$, giving $y=1+e^2-ex$.',
    diagramRequired: false,
    uncertainties: []
  },
  '3488': {
    question_text: 'What is $\displaystyle\int\frac1x\,dx$?',
    structure: 'integrate-reciprocal-function',
    meaningfulCase: 'reciprocal-is-logarithmic-antiderivative',
    mastery: false,
    options: [
      {text: '$\dfrac{x^0}{0}+c$', correct: false, why: 'The power rule is not valid when the exponent is negative one.'},
      {text: '$0+c$', correct: false, why: 'Treats the integrand as zero instead of recognising $1/x$.'},
      {text: '$-\dfrac1{x^2}+c$', correct: false, why: 'Gives an incorrect antiderivative with the wrong derivative.'},
      {text: '$\ln(x)+c$', correct: true}
    ],
    solution_text: 'The derivative of $\ln x$ is $1/x$, so $\int\frac1x\,dx=\ln|x|+c$. In the displayed positive-domain context this is written $\ln(x)+c$.',
    diagramRequired: false,
    uncertainties: []
  },
  '3492': {
    question_text: 'What is $\displaystyle\int\frac1{3x-1}\,dx$?',
    structure: 'integrate-linear-denominator-reciprocal',
    meaningfulCase: 'include-reciprocal-of-inner-derivative',
    mastery: false,
    options: [
      {text: '$3\ln(3x-1)+c$', correct: false, why: 'Multiplies by 3 instead of dividing by the derivative of the denominator.'},
      {text: '$3\ln(x)+c$', correct: false, why: 'Uses the wrong logarithm argument and coefficient.'},
      {text: '$\frac13\ln(x)+c$', correct: false, why: 'Includes the factor one third but loses the inner expression.'},
      {text: '$\frac13\ln(3x-1)+c$', correct: true}
    ],
    solution_text: 'Let $u=3x-1$, so $du=3\,dx$. Therefore $\int\frac1{3x-1}\,dx=\frac13\ln|3x-1|+c$, matching option D.',
    diagramRequired: false,
    uncertainties: []
  },
  '3508': {
    question_text: 'What is $\displaystyle\int e^{-x}\,dx$?',
    structure: 'integrate-exponential-with-negative-linear-exponent',
    meaningfulCase: 'divide-by-negative-inner-derivative',
    mastery: false,
    options: [
      {text: '$-xe^{-x}+c$', correct: false, why: 'Applies a product-rule expression instead of integrating the exponential.'},
      {text: '$-e^{-x}+c$', correct: true},
      {text: '$\dfrac{e^{-x+1}}{-x+1}+c$', correct: false, why: 'Uses an invalid quotient form for the exponential antiderivative.'},
      {text: '$e^{-x}+c$', correct: false, why: 'Differentiates to $-e^{-x}$, giving the wrong sign.'}
    ],
    solution_text: 'Because $\dfrac{d}{dx}e^{-x}=-e^{-x}$, an antiderivative of $e^{-x}$ is $-e^{-x}$. Thus the answer is $-e^{-x}+c$.',
    diagramRequired: false,
    uncertainties: []
  },
  '101968': {
    question_text: 'Shape $ABCD$ is an isosceles trapezium. Which sides are the same length?',
    structure: 'identify-equal-legs-of-isosceles-trapezium',
    meaningfulCase: 'non-parallel-sloping-sides-are-congruent',
    mastery: false,
    options: [
      {text: '$AC$ and $BD$', correct: true},
      {text: '$AB$ and $CD$', correct: false, why: 'These are the parallel bases and are not generally equal in an isosceles trapezium.'},
      {text: 'All of them', correct: false, why: 'An isosceles trapezium does not require all four sides to be equal.'},
      {text: 'None of them', correct: false, why: 'The matching tick marks show that the two sloping sides are equal.'}
    ],
    solution_text: 'In an isosceles trapezium the non-parallel sides, called the legs, are equal. Here those sides are $AC$ and $BD$.',
    diagramRequired: true,
    uncertainties: []
  },
  '20192': {
    question_text: 'If $A=2\pi r^2+6\pi r$, what is the rate of change of $A$ with respect to $r$ when $r=2$?',
    structure: 'differentiate-area-expression-with-respect-to-radius',
    meaningfulCase: 'substitute-radius-after-differentiation',
    mastery: false,
    options: [
      {text: '$10\pi$', correct: false, why: 'Uses an incorrect derivative for the quadratic term.'},
      {text: '$12\pi$', correct: false, why: 'Substitutes the radius incorrectly after differentiating.'},
      {text: '$14\pi$', correct: true},
      {text: '$20\pi$', correct: false, why: 'Treats the original expression as the rate of change.'}
    ],
    solution_text: 'Differentiate: $\dfrac{dA}{dr}=4\pi r+6\pi$. At $r=2$, this is $8\pi+6\pi=14\pi$.',
    diagramRequired: false,
    uncertainties: []
  },
  '178694': {
    question_text: 'Given that the blue square is $3$ and the yellow star is $5$, what is the value of the yellow star minus the blue square?',
    structure: 'substitute-symbol-values-into-arithmetic-expression',
    meaningfulCase: 'preserve-order-in-subtraction',
    mastery: false,
    options: [
      {text: '$-2$', correct: false, why: 'Subtracts the star value from the square value in reverse order.'},
      {text: '$2$', correct: true},
      {text: '$8$', correct: false, why: 'Adds the two symbol values instead of subtracting them.'},
      {text: '$15$', correct: false, why: 'Multiplies the values rather than evaluating the subtraction.'}
    ],
    solution_text: 'The star represents $5$ and the square represents $3$. Therefore the requested difference is $5-3=2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '28752': {
    question_text: 'Using the graph of $y=x^2-3x-2$, which answers give the best approximation to the solutions of $x^2-3x-2=3$?',
    structure: 'solve-quadratic-equation-by-graphical-intersection',
    meaningfulCase: 'intersect-parabola-with-horizontal-line-y-equals-three',
    mastery: false,
    options: [
      {text: '$x=-1.2,\ x=4.2$', correct: true},
      {text: '$x=-0.5,\ x=3.5$', correct: false, why: 'Reads the intersections too far toward the vertex.'},
      {text: '$x=-2$', correct: false, why: 'Gives only one value and does not represent both intersections.'},
      {text: '$x=1.2,\ x=-4.2$', correct: false, why: 'Uses incorrect signs and reverses the approximate roots.'}
    ],
    solution_text: 'The equation asks where the parabola has height $3$. Solving confirms $x^2-3x-5=0$, so $x=\frac{3\pm\sqrt{29}}2\approx-1.2$ and $4.2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '77998': {
    question_text: 'Which answer shows a correct expansion of $(x+2)^3$?',
    structure: 'expand-cube-of-a-binomial',
    meaningfulCase: 'apply-binomial-coefficients-and-cube-constant',
    mastery: false,
    options: [
      {text: '$x^3+6x^2+12x+8$', correct: true},
      {text: '$x^3+12x^2+6x+8$', correct: false, why: 'Swaps the coefficients of the squared and linear terms.'},
      {text: '$x^3+8$', correct: false, why: 'Omits the two cross terms from the binomial expansion.'},
      {text: '$x^3+6x^2+12x+6$', correct: false, why: 'Cubes the constant incorrectly; $2^3$ is $8$.'}
    ],
    solution_text: 'Using $(x+2)^3=x^3+3x^2(2)+3x(2^2)+2^3$, the expansion is $x^3+6x^2+12x+8$.',
    diagramRequired: false,
    uncertainties: []
  },
  '78023': {
    question_text: 'If $n$ is a positive integer, then $4n+1$ is an odd number. Is the statement always true, sometimes true, or never true?',
    structure: 'prove-parity-of-linear-expression',
    meaningfulCase: 'even-multiple-plus-one-is-always-odd',
    mastery: false,
    options: [
      {text: 'Always true', correct: true},
      {text: 'Sometimes true', correct: false, why: 'The parity argument applies to every integer value of $n$, not just some values.'},
      {text: 'Never true', correct: false, why: 'For example, $n=1$ gives $4(1)+1=5$, which is odd.'},
      {text: 'I’d just be guessing', correct: false, why: 'The expression can be proved odd by writing it as an even number plus one.'}
    ],
    solution_text: 'For any integer $n$, $4n$ is even because it is a multiple of $2$. Adding $1$ to an even number always gives an odd number, so the statement is always true.',
    diagramRequired: false,
    uncertainties: []
  },
  '84142': {
    question_text: 'The two shapes are rectangles. The smaller rectangle has area $20\,\mathrm{cm^2}$ and width $5\,\mathrm{cm}$. The larger rectangle has area $48\,\mathrm{cm^2}$ and is $4\,\mathrm{cm}$ taller. What is the missing length of the larger rectangle?',
    structure: 'find-missing-length-from-rectangle-areas',
    meaningfulCase: 'use-smaller-height-to-get-larger-height',
    mastery: false,
    options: [
      {text: '$4\,\mathrm{cm}$', correct: false, why: 'Confuses the stated height difference with the required width.'},
      {text: '$6\,\mathrm{cm}$', correct: true},
      {text: '$5\,\mathrm{cm}$', correct: false, why: 'Uses the smaller rectangle’s width without calculating the new height.'},
      {text: '$8\,\mathrm{cm}$', correct: false, why: 'Adds lengths rather than dividing the larger area by its height.'}
    ],
    solution_text: 'The smaller rectangle’s height is $20\div5=4\,\mathrm{cm}$. The larger height is $4+4=8\,\mathrm{cm}$, so its missing length is $48\div8=6\,\mathrm{cm}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '15340': {
    question_text: 'A farmer wants a rectangular enclosure of area $60\,\mathrm{m^2}$. Which graph shows the relationship between the length and the width?',
    structure: 'identify-inverse-proportion-graph-from-fixed-area',
    meaningfulCase: 'positive-width-length-hyperbola-with-axes-asymptotes',
    mastery: false,
    options: [
      {text: 'A', correct: false, why: 'This sketch suggests the curve reaches an axis instead of approaching it as an asymptote.'},
      {text: 'B', correct: true},
      {text: 'C', correct: false, why: 'Shows an increasing relationship, whereas fixed area gives decreasing width.'},
      {text: 'D', correct: false, why: 'Shows a straight-line relationship, not the inverse curve $w=60/l$.'}
    ],
    solution_text: 'For a fixed area, $lw=60$, so $w=60/l$. For positive length this is a decreasing reciprocal curve approaching both axes without meeting them, which is graph B.',
    diagramRequired: true,
    uncertainties: ['The two decreasing sketches are stylised; graph B is selected because it shows the positive reciprocal curve approaching, rather than meeting, the axes.']
  },
  '115153': {
    question_text: 'Which of the following calculations is correct?',
    structure: 'verify-decimal-and-fraction-arithmetic',
    meaningfulCase: 'align-decimal-places-and-preserve-fraction-denominators',
    mastery: false,
    options: [
      {text: '$0.5+0.42=0.47$', correct: false, why: 'Adding the decimals gives $0.92$, not $0.47$.'},
      {text: '$\frac5{11}+\frac2{11}=\frac7{22}$', correct: false, why: 'With equal denominators the sum is $7/11$, not $7/22$.'},
      {text: '$1\frac23+2\frac23=3\frac23$', correct: false, why: 'The fractional parts make the total $4\frac13$, not $3\frac23$.'},
      {text: '$0.06+0.7+0.011=0.771$', correct: true}
    ],
    solution_text: 'Aligning decimal places gives $0.060+0.700+0.011=0.771$. Therefore the fourth calculation is correct.',
    diagramRequired: false,
    uncertainties: []
  },
  '20583': {
    question_text: 'Vector $\mathbf p$ has components $\left(\frac25,\frac{\sqrt5}{5},a\right)$, where $a>0$. If $\mathbf p$ is a unit vector, what is a possible value of $a$?',
    structure: 'find-missing-component-of-unit-vector',
    meaningfulCase: 'positive-square-root-after-normalisation-condition',
    mastery: false,
    options: [
      {text: '$\dfrac{3-\sqrt5}{5}$', correct: false, why: 'Does not produce the squared component required by unit length.'},
      {text: '$\dfrac9{25}$', correct: false, why: 'Is the remaining squared component, not the positive value of $a$.'},
      {text: '$\dfrac35$', correct: false, why: 'Uses an incorrect square root of the remaining component.'},
      {text: '$\dfrac45$', correct: true}
    ],
    solution_text: 'For a unit vector, $\left(\frac25\right)^2+\left(\frac{\sqrt5}{5}\right)^2+a^2=1$. Thus $\frac4{25}+\frac5{25}+a^2=1$, so $a^2=\frac{16}{25}$. Since $a>0$, $a=\frac45$.',
    diagramRequired: false,
    uncertainties: []
  },
  '18561': {
    question_text: 'A shape is made up of four congruent kites meeting at a point. Calculate the size of angle $k$ when the outer angle of one kite is $40^\circ$.',
    structure: 'find-angle-in-four-congruent-kites-around-point',
    meaningfulCase: 'angles-around-centre-and-equal-kite-angles',
    mastery: false,
    options: [
      {text: '$140^\circ$', correct: false, why: 'Does not use the four equal angles around the central point.'},
      {text: '$40^\circ$', correct: false, why: 'Confuses the given outer angle with the requested adjacent kite angle.'},
      {text: '$115^\circ$', correct: true},
      {text: '$230^\circ$', correct: false, why: 'Exceeds a possible interior angle and doubles the required result.'}
    ],
    solution_text: 'The four congruent central angles sum to $360^\circ$, so each central angle is $90^\circ$. In one kite, the remaining angles consist of the given $40^\circ$ and two equal angles $k$. Thus $90+40+2k=360$, giving $k=115^\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '40581': {
    question_text: 'Shape $R$ is enlarged by a scale factor of $3$ from centre $(6,2)$. Which point marks the new location of the red vertex at $(5,4)$?',
    structure: 'perform-enlargement-about-centre-on-coordinate-grid',
    meaningfulCase: 'scale-displacement-vector-from-centre',
    mastery: false,
    options: [
      {text: 'A: $(1,7)$', correct: false, why: 'Does not multiply the displacement from the centre by the scale factor.'},
      {text: 'B: $(4,6)$', correct: false, why: 'Uses an incomplete or incorrectly scaled displacement.'},
      {text: 'C: $(2,10)$', correct: false, why: 'Moves in the wrong direction from the enlargement centre.'},
      {text: 'D: $(3,8)$', correct: true}
    ],
    solution_text: 'From $(6,2)$ to $(5,4)$ the displacement is $(-1,2)$. Multiplying by $3$ gives $(-3,6)$, so the image point is $(6,2)+(-3,6)=(3,8)$, point D.',
    diagramRequired: true,
    uncertainties: []
  },
  '20239': {
    question_text: 'The point $(q,2)$ lies on the graph of $y=\log_3(x-4)$. What is the value of $q$?',
    structure: 'solve-logarithmic-equation-for-coordinate',
    meaningfulCase: 'convert-logarithm-to-exponential-form',
    mastery: false,
    options: [
      {text: '$6$', correct: false, why: 'Uses $3^1$ instead of $3^2$ when converting the logarithm.'},
      {text: '$7$', correct: false, why: 'Adds the wrong power of 3 to the horizontal shift.'},
      {text: '$8$', correct: false, why: 'Adds 4 to an incorrect logarithmic value.'},
      {text: '$13$', correct: true}
    ],
    solution_text: 'Substitute $y=2$: $2=\log_3(q-4)$. Therefore $q-4=3^2=9$, so $q=13$.',
    diagramRequired: true,
    uncertainties: []
  },
  '29395': {
    question_text: 'Given $y=6x-1$, $y=4x-1$, $y=\frac14x+1$, $2y=3-2x$, $y=2+6x$ and $2y=x+3$, identify the two lines which are parallel.',
    structure: 'identify-parallel-lines-by-equal-gradients',
    meaningfulCase: 'rearrange-standard-form-lines-before-comparing-slopes',
    mastery: false,
    options: [
      {text: 'B and C', correct: false, why: 'Their gradients are $4$ and $1/4$, which are not equal.'},
      {text: 'A and E', correct: true},
      {text: 'D and F', correct: false, why: 'Their gradients are $-1$ and $1/2$, not equal.'},
      {text: 'B and A', correct: false, why: 'Their gradients are $4$ and $6$, so the lines are not parallel.'}
    ],
    solution_text: 'Line A has gradient $6$ and line E already has gradient $6$. The other lines have gradients $4$, $1/4$, $-1$ and $1/2$, so A and E are parallel.',
    diagramRequired: false,
    uncertainties: []
  },
  '5917': {
    question_text: 'Write $\dfrac{5n}{2}\div\dfrac{6n}{10}$ as a single fraction as simply as possible.',
    structure: 'divide-algebraic-fractions-and-cancel-variable',
    meaningfulCase: 'multiply-by-reciprocal-and-cancel-nonzero-n',
    mastery: false,
    options: [
      {text: '$\dfrac{30n^2}{20}$', correct: false, why: 'Multiplies the fractions without reversing the divisor.'},
      {text: '$\dfrac{3n^2}{2}$', correct: false, why: 'Uses incorrect multiplication and does not cancel the variable.'},
      {text: '$\dfrac{25}{6}$', correct: true},
      {text: '$\dfrac{50n}{12n}$', correct: false, why: 'Is an unsimplified intermediate fraction rather than simplest form.'}
    ],
    solution_text: '$\dfrac{5n}{2}\div\dfrac{6n}{10}=\dfrac{5n}{2}\times\dfrac{10}{6n}=\dfrac{50n}{12n}=\dfrac{25}{6}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '176193': {
    question_text: 'There are $8$ oranges in a bag. The total number of oranges in $b$ bags is $T=8b$. Use the formula to work out the total number of oranges in $4$ bags.',
    structure: 'substitute-number-of-bags-into-linear-formula',
    meaningfulCase: 'multiply-constant-per-bag-by-number-of-bags',
    mastery: false,
    options: [
      {text: '$84$', correct: false, why: 'Concatenates or combines the numbers instead of multiplying them.'},
      {text: '$12$', correct: false, why: 'Uses an incorrect operation for the number of bags.'},
      {text: '$2$', correct: false, why: 'Divides the number of oranges instead of using the formula.'},
      {text: '$32$', correct: true}
    ],
    solution_text: 'Substitute $b=4$ into $T=8b$: $T=8\times4=32$. Therefore there are $32$ oranges.',
    diagramRequired: false,
    uncertainties: []
  },
  '27459': {
    question_text: 'There are $4$ red balls and $2$ green balls in a bag. Katie picks one ball and then another without replacing the first. What fraction should replace the star on the branch after a red ball is picked first and a green ball second?',
    structure: 'find-dependent-conditional-probability-from-tree',
    meaningfulCase: 'after-red-draw-two-green-balls-remain-of-five',
    mastery: false,
    options: [
      {text: '$\dfrac26$', correct: false, why: 'Uses the original total of six balls after one ball has been removed.'},
      {text: '$\dfrac16$', correct: false, why: 'Uses the wrong number of green balls in the remaining bag.'},
      {text: '$\dfrac25$', correct: true},
      {text: '$\dfrac15$', correct: false, why: 'Uses one green ball over five rather than the two remaining green balls.'}
    ],
    solution_text: 'After a red ball is removed, $5$ balls remain, including both green balls. Therefore the conditional probability of then selecting green is $\frac25$.',
    diagramRequired: true,
    uncertainties: []
  },
  '33943': {
    question_text: 'Given $\dfrac12=\dfrac{1+5}{2+\star}$, find the value of the star.',
    structure: 'solve-equivalent-fraction-equation',
    meaningfulCase: 'cross-multiply-before-isolating-denominator-symbol',
    mastery: false,
    options: [
      {text: '$5$', correct: false, why: 'Substitutes the numerator addend into the denominator without solving.'},
      {text: '$10$', correct: true},
      {text: '$6$', correct: false, why: 'Uses the numerator total as the star value.'},
      {text: 'It is impossible', correct: false, why: 'The equation has a valid solution obtained by cross-multiplication.'}
    ],
    solution_text: 'The right-hand numerator is $1+5=6$. Thus $\frac12=\frac6{2+s}$, so $2+s=12$ and $s=10$.',
    diagramRequired: false,
    uncertainties: []
  },
  '3906': {
    question_text: 'Factorise $6a^2+9a$.',
    structure: 'factorise-quadratic-by-common-factor',
    meaningfulCase: 'extract-greatest-common-factor-3a',
    mastery: false,
    options: [
      {text: '$3a(2a+3)$', correct: true},
      {text: '$a(6a+9)$', correct: false, why: 'Extracts only a variable and does not take the greatest common factor.'},
      {text: '$3(2a^2+3)$', correct: false, why: 'The second term would become $9$, not $9a$.'},
      {text: '$15a^2$', correct: false, why: 'Adds terms instead of factorising the common factor.'}
    ],
    solution_text: 'Both terms share the factor $3a$: $6a^2+9a=3a(2a+3)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '81481': {
    question_text: 'Which is not a recurring decimal: $\frac13$, $\frac15$, $\frac17$ or $\frac19$?',
    structure: 'identify-terminating-decimal-from-fraction-denominator',
    meaningfulCase: 'denominator-factor-test-for-terminating-decimal',
    mastery: false,
    options: [
      {text: '$\dfrac13$', correct: false, why: 'Its decimal expansion is $0.333\ldots$, which recurs.'},
      {text: '$\dfrac15$', correct: true},
      {text: '$\dfrac17$', correct: false, why: 'Its denominator has a prime factor other than 2 or 5, so it recurs.'},
      {text: '$\dfrac19$', correct: false, why: 'Its decimal expansion is recurring because the denominator is not based on 2s and 5s.'}
    ],
    solution_text: '$\frac15=0.2$, which terminates. Fractions with denominators $3$, $7$ and $9$ have recurring decimal expansions, so $\frac15$ is the one that is not recurring.',
    diagramRequired: false,
    uncertainties: []
  },
  '28630': {
    question_text: 'Which of the following shapes is not being split into two congruent halves by the shown line?',
    structure: 'identify-diagonal-or-line-that-does-not-create-congruent-halves',
    meaningfulCase: 'symmetry-and-diagonal-congruence-in-common-quadrilaterals',
    mastery: false,
    options: [
      {text: 'A: rectangle', correct: false, why: 'A central line splits the rectangle into two matching rectangles.'},
      {text: 'B: isosceles triangle', correct: false, why: 'The symmetry line splits the isosceles triangle into congruent triangles.'},
      {text: 'C: trapezium', correct: true},
      {text: 'D: parallelogram', correct: false, why: 'A diagonal of a parallelogram splits it into two congruent triangles.'}
    ],
    solution_text: 'A rectangle, an isosceles triangle and a parallelogram have the indicated symmetry or diagonal properties. The shown diagonal of the trapezium does not generally create two congruent halves, so C is the exception.',
    diagramRequired: true,
    uncertainties: ['The trapezium is drawn without explicit side-length markings; the intended classification is the generic trapezium shown, for which the diagonal halves are not congruent.']
  },
  '83796': {
    question_text: 'In the Venn diagram, 5 pupils like only apples, 2 like both, 4 like only bananas and 8 like neither. What is the probability a pupil likes bananas, given that they do not like apples?',
    structure: 'calculate-conditional-probability-from-venn-diagram',
    meaningfulCase: 'restrict-sample-space-to-not-apples',
    mastery: false,
    options: [
      {text: '$\dfrac48$', correct: false, why: 'Uses only the banana-only count and ignores the neither group in the condition.'},
      {text: '$\dfrac27$', correct: false, why: 'Uses the wrong denominator and includes pupils who like apples.'},
      {text: '$\dfrac4{12}$', correct: true},
      {text: '$\dfrac8{12}$', correct: false, why: 'Counts pupils who like neither as favourable banana outcomes.'}
    ],
    solution_text: 'Among pupils who do not like apples, there are $4+8=12$ pupils. Of these, $4$ like bananas, so $P(B\mid A^c)=\frac4{12}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '95246': {
    question_text: 'In the written multiplication $3847\times78$, what does the product of the two circled digits, $3$ and $7$, represent?',
    structure: 'interpret-place-values-in-written-multiplication',
    meaningfulCase: 'multiply-thousands-digit-by-tens-digit',
    mastery: false,
    options: [
      {text: '$210$', correct: false, why: 'Multiplies the face values without accounting for their place values.'},
      {text: '$2\,100$', correct: false, why: 'Accounts for only one of the two place-value multipliers.'},
      {text: '$21\,000$', correct: false, why: 'Uses an incorrect combined place-value scale.'},
      {text: '$210\,000$', correct: true}
    ],
    solution_text: 'The circled $3$ represents $3000$ and the circled $7$ represents $70$. Their product is $3000\times70=210{,}000$.',
    diagramRequired: true,
    uncertainties: []
  },
  '107752': {
    question_text: 'Given $f(x)=-(4x+3)$ and $g(x)=x^2+1$, which expression represents $fg(x)$?',
    structure: 'evaluate-composite-function-from-two-formulas',
    meaningfulCase: 'substitute-g-of-x-into-f-and-expand',
    mastery: false,
    options: [
      {text: '$(4x+3)^2-2$', correct: false, why: 'Does not apply the definition of the composite function.'},
      {text: '$-(x^2+1)(4x-3)$', correct: false, why: 'Uses an incorrect second factor and does not match $f(g(x))$.'},
      {text: '$-(4x^2+7)$', correct: true},
      {text: '$-(4x^3+4x+3)$', correct: false, why: 'Multiplies by x unnecessarily instead of substituting into the linear function.'}
    ],
    solution_text: 'The composite is $f(g(x))=-(4g(x)+3)=-(4(x^2+1)+3)=-(4x^2+7)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '107934': {
    question_text: 'A brick has mass $5\,\mathrm{kg}$ and volume $275\,\mathrm{mm^3}$. What is its density in $\mathrm{kg/cm^3}$?',
    structure: 'convert-volume-units-before-calculating-density',
    meaningfulCase: 'cubic-millimetres-to-cubic-centimetres-divide-by-1000',
    mastery: false,
    options: [
      {text: '$\dfrac5{275}\times10$', correct: false, why: 'Uses an incorrect conversion factor for cubic millimetres.'},
      {text: '$\dfrac5{275}\div1000$', correct: false, why: 'Divides by 1000 in the wrong place after forming the density ratio.'},
      {text: '$\dfrac5{275}\times1000$', correct: true},
      {text: '$\dfrac5{275}$', correct: false, why: 'Does not convert the volume from cubic millimetres to cubic centimetres.'}
    ],
    solution_text: '$275\,\mathrm{mm^3}=0.275\,\mathrm{cm^3}$, so the density is $5\div0.275=\frac5{275}\times1000\,\mathrm{kg/cm^3}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '105035': {
    question_text: 'Rearrange the formula $v=u+at$ to make $a$ the subject.',
    structure: 'rearrange-linear-kinematics-formula-for-acceleration',
    meaningfulCase: 'subtract-u-then-divide-by-time',
    mastery: false,
    options: [
      {text: '$a=\dfrac{v-u}{t}$', correct: true},
      {text: '$a=v-\dfrac{u}{t}$', correct: false, why: 'Divides only u by t instead of dividing the whole difference by t.'},
      {text: '$a=v-u-t$', correct: false, why: 'Subtracts t rather than isolating at and dividing by t.'},
      {text: '$a=\dfrac vt-u$', correct: false, why: 'Divides v alone and leaves u outside the required numerator.'}
    ],
    solution_text: 'From $v=u+at$, subtract $u$ to obtain $v-u=at$. Dividing by $t$ gives $a=\frac{v-u}{t}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '113127': {
    question_text: 'The functions are $f(x)=2x-3$ and $g(x)=x^2$. Find an expression for $g(f(x))$.',
    structure: 'evaluate-composite-function-and-expand-square',
    meaningfulCase: 'substitute-linear-function-into-square-function',
    mastery: false,
    options: [
      {text: '$4x^2-12x+9$', correct: true},
      {text: '$x^2+2x-3$', correct: false, why: 'Adds the function expressions instead of composing them.'},
      {text: '$4x-9$', correct: false, why: 'Does not square the full expression $2x-3$.'},
      {text: '$2x^3-3x^2$', correct: false, why: 'Multiplies by powers of x rather than substituting into $g$.'}
    ],
    solution_text: '$g(f(x))=g(2x-3)=(2x-3)^2=4x^2-12x+9$.',
    diagramRequired: false,
    uncertainties: []
  },
  '115195': {
    question_text: 'Which value is equivalent to $\sin(30^\circ)\times\cos(45^\circ)$?',
    structure: 'evaluate-product-of-exact-trigonometric-values',
    meaningfulCase: 'multiply-sine-thirty-by-cosine-forty-five',
    mastery: false,
    options: [
      {text: '$\dfrac{\sqrt2}{4}$', correct: true},
      {text: '$\dfrac12$', correct: false, why: 'Uses only the sine value and omits the cosine factor.'},
      {text: '$0$', correct: false, why: 'Neither factor is zero at the given angles.'},
      {text: '$\dfrac{\sqrt3}{2}$', correct: false, why: 'Uses an unrelated exact trigonometric value.'}
    ],
    solution_text: '$\sin30^\circ=\frac12$ and $\cos45^\circ=\frac{\sqrt2}{2}$. Their product is $\frac12\cdot\frac{\sqrt2}{2}=\frac{\sqrt2}{4}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '134762': {
    question_text: 'How many more points did the yellow team score than the green team?',
    structure: 'read-and-subtract-values-from-scaled-block-graph',
    meaningfulCase: 'difference-between-yellow-and-green-bar-heights',
    mastery: false,
    options: [
      {text: '$6$', correct: false, why: 'Reads the difference using an incorrect graph scale.'},
      {text: '$24$', correct: false, why: 'Uses the yellow score itself rather than subtracting the green score.'},
      {text: '$8$', correct: true},
      {text: '$40$', correct: false, why: 'Adds or combines the two bar heights instead of finding their difference.'}
    ],
    solution_text: 'The yellow team scored $24$ points and the green team scored $16$ points. The difference is $24-16=8$ points.',
    diagramRequired: true,
    uncertainties: []
  },
  '23679': {
    question_text: 'The cost of two fish and one portion of chips is £6.30. The cost of three fish and two portions of chips is £10.10. What is the cost of a fish?',
    structure: 'solve-simultaneous-cost-equations',
    meaningfulCase: 'eliminate-chips-cost-to-find-single-fish-price',
    mastery: false,
    options: [
      {text: '£3.80', correct: false, why: 'Does not satisfy both cost equations when substituted.'},
      {text: '£2.60', correct: false, why: 'Confuses the combined two-fish cost with the individual price.'},
      {text: '£2.50', correct: true},
      {text: '£1.30', correct: false, why: 'Matches neither simultaneous equation for the fish price.'}
    ],
    solution_text: 'Let fish cost $f$ and chips cost $c$. Then $2f+c=6.30$ and $3f+2c=10.10$. Doubling the first gives $4f+2c=12.60$; subtracting the second gives $f=2.50$.',
    diagramRequired: false,
    uncertainties: []
  },
  '124482': {
    question_text: 'Which statement is not always true about a stationary point?',
    structure: 'distinguish-stationary-point-second-derivative-tests',
    meaningfulCase: 'zero-second-derivative-does-not-guarantee-inflection',
    mastery: false,
    options: [
      {text: '$f\'(x)=0$', correct: false, why: 'This is the defining condition for a stationary point.'},
      {text: 'If $f\'\'(x)>0$ then it is a minimum point', correct: false, why: 'A positive second derivative gives the usual local-minimum test.'},
      {text: 'If $f\'\'(x)<0$ then it is a maximum point', correct: false, why: 'A negative second derivative gives the usual local-maximum test.'},
      {text: 'If $f\'\'(x)=0$ then it is a point of inflection', correct: true}
    ],
    solution_text: 'A zero second derivative is only an inconclusive test: it may indicate a point of inflection, but it can also occur at a stationary maximum or minimum. Therefore the final statement is not always true.',
    diagramRequired: false,
    uncertainties: []
  },
  '124512': {
    question_text: 'When given an expression for displacement, how would you find an expression for acceleration?',
    structure: 'relate-displacement-velocity-and-acceleration-by-differentiation',
    meaningfulCase: 'differentiate-displacement-twice',
    mastery: false,
    options: [
      {text: 'Differentiate once', correct: false, why: 'One differentiation gives velocity, not acceleration.'},
      {text: 'Differentiate twice', correct: true},
      {text: 'Integrate once', correct: false, why: 'Integration moves from acceleration toward velocity, not displacement to acceleration.'},
      {text: 'Integrate twice', correct: false, why: 'Two integrations move in the opposite direction from displacement to acceleration.'}
    ],
    solution_text: 'Differentiating displacement once gives velocity, and differentiating velocity once more gives acceleration. Therefore differentiate the displacement expression twice.',
    diagramRequired: false,
    uncertainties: []
  },
  '126350': {
    question_text: 'Given $\dfrac{dy}{dx}=y(x+1)$, which equation shows separation of variables?',
    structure: 'separate-variables-in-first-order-differential-equation',
    meaningfulCase: 'divide-by-y-and-place-differentials-on-opposite-sides',
    mastery: false,
    options: [
      {text: '$y=\int y(x+1)\,dx$', correct: false, why: 'Does not separate the y-dependent and x-dependent factors.'},
      {text: '$\int\dfrac1{x+1}\,dy=\int y\,dx$', correct: false, why: 'Places the factors with the wrong differentials.'},
      {text: '$\int y\,dy=\int(x+1)\,dx$', correct: false, why: 'Fails to divide by y before separating.'},
      {text: '$\int\dfrac1y\,dy=\int(x+1)\,dx$', correct: true}
    ],
    solution_text: 'Divide the differential equation by $y$ and multiply by $dx$: $\frac1y\,dy=(x+1)\,dx$. Integrating both sides gives $\int\frac1y\,dy=\int(x+1)\,dx$.',
    diagramRequired: false,
    uncertainties: []
  },
  '126817': {
    question_text: 'Use a reciprocal trigonometric identity to complete $\cosec^2\theta\equiv\,\ldots$.',
    structure: 'apply-pythagorean-reciprocal-trigonometric-identity',
    meaningfulCase: 'cosecant-square-equals-one-plus-cotangent-square',
    mastery: false,
    options: [
      {text: '$1-\cot^2\theta$', correct: false, why: 'Has the wrong sign for the reciprocal identity.'},
      {text: '$\cot^2\theta-1$', correct: false, why: 'Reverses the terms and gives the wrong relationship.'},
      {text: '$1+\sec^2\theta$', correct: false, why: 'Combines cosecant with the wrong reciprocal function.'},
      {text: '$\cot^2\theta+1$', correct: true}
    ],
    solution_text: 'The Pythagorean identity $1+\cot^2\theta=\cosec^2\theta$ gives $\cosec^2\theta=\cot^2\theta+1$.',
    diagramRequired: false,
    uncertainties: []
  },
  '155215': {
    question_text: 'Given $\ln(y-1)=x^2+c$, find an expression for $y$ in terms of $x$.',
    structure: 'rearrange-logarithmic-equation-for-y',
    meaningfulCase: 'exponentiate-both-sides-and-add-one',
    mastery: false,
    options: [
      {text: '$y=\dfrac{x^2+c}{\ln}+1$', correct: false, why: 'Does not undo the logarithm by exponentiating.'},
      {text: '$y=e^{x^2}+c+1$', correct: false, why: 'Places the constant outside the exponent incorrectly.'},
      {text: '$y=e^{2x+c}+1$', correct: false, why: 'Changes $x^2$ into $2x$ without justification.'},
      {text: '$y=e^{x^2+c}+1$', correct: true}
    ],
    solution_text: 'Exponentiating $\ln(y-1)=x^2+c$ gives $y-1=e^{x^2+c}$. Therefore $y=e^{x^2+c}+1$.',
    diagramRequired: false,
    uncertainties: []
  },
  '20788': {
    question_text: 'Consider the graph $y=x^3+kx$. The graph has a minimum at $x=4$. Find the value of $k$.',
    structure: 'use-stationary-point-condition-to-find-parameter',
    meaningfulCase: 'set-derivative-zero-at-given-minimum-coordinate',
    mastery: false,
    options: [
      {text: '$k=48$', correct: false, why: 'Uses the derivative equation with the wrong sign.'},
      {text: '$k=12$', correct: false, why: 'Divides by the wrong coefficient when substituting $x=4$.'},
      {text: '$k=-12$', correct: false, why: 'Uses $x^2$ incorrectly as $4$ instead of $16$.'},
      {text: '$k=-48$', correct: true}
    ],
    solution_text: 'At a stationary point, $y\'=3x^2+k=0$. Substituting $x=4$ gives $3(16)+k=0$, so $k=-48$. Also $y\'\'=6x>0$ at $x=4$, confirming a minimum.',
    diagramRequired: false,
    uncertainties: []
  },
  '5668': {
    question_text: 'How many times in this journey is the velocity zero?',
    structure: 'count-axis-crossings-on-velocity-time-graph',
    meaningfulCase: 'include-starting-point-and-zero-crossings',
    mastery: false,
    options: [
      {text: '$3$', correct: true},
      {text: '$2$', correct: false, why: 'Counts only the interior crossings and misses the initial zero at A.'},
      {text: '$1$', correct: false, why: 'Counts only one of the labelled points on the time axis.'},
      {text: '$0$', correct: false, why: 'The graph meets the time axis at A, D and F.'}
    ],
    solution_text: 'Velocity is zero where the velocity-time graph lies on the time axis. This occurs at labelled points A, D and F, so there are $3$ such times.',
    diagramRequired: true,
    uncertainties: []
  },
  '619': {
    question_text: 'Which graph shows the derivative of $y=\sin(x)$ when $x$ is measured in degrees?',
    structure: 'differentiate-sine-with-degree-measurement',
    meaningfulCase: 'degree-derivative-includes-pi-over-180-scale-factor',
    mastery: false,
    options: [
      {text: '$y=\frac\pi{180}\cos(x)$', correct: true},
      {text: '$y=\cos(x)$', correct: false, why: 'Omits the scale factor caused by measuring the angle in degrees.'},
      {text: '$y=\sin(x)$', correct: false, why: 'Repeats the original function rather than differentiating it.'},
      {text: '$y=\tan(x)$', correct: false, why: 'Uses a different trigonometric function and has the wrong derivative.'}
    ],
    solution_text: 'One degree equals $\pi/180$ radians. Applying the chain rule gives $\frac{d}{dx}\sin x=\frac\pi{180}\cos x$ when $x$ is measured in degrees.',
    diagramRequired: true,
    uncertainties: []
  },
  '68069': {
    question_text: 'What are the dimensions of the cuboid shown on the isometric dot grid?',
    structure: 'read-three-dimensions-from-isometric-grid',
    meaningfulCase: 'count-grid-steps-along-length-depth-and-height',
    mastery: false,
    options: [
      {text: '$4\times3\times2$', correct: false, why: 'Under-counts the grid intervals in the cuboid.'},
      {text: '$3\times5\times2$', correct: false, why: 'Uses incorrect counts for the depth and height.'},
      {text: '$3\times6\times4$', correct: true},
      {text: '$3\times6\times2$', correct: false, why: 'Under-counts the vertical dimension of the cuboid.'}
    ],
    solution_text: 'Counting the grid intervals along the three perpendicular directions gives dimensions $3$, $6$ and $4$. Therefore the cuboid is $3\times6\times4$.',
    diagramRequired: true,
    uncertainties: ['The isometric grid is stylised; the intended dimension counts are the three labelled option values, with the vertical count reading four intervals.']
  },
  '160572': {
    question_text: 'For $f(x)=2x^2+8x+3$, find the value of the discriminant.',
    structure: 'calculate-quadratic-discriminant',
    meaningfulCase: 'apply-b-squared-minus-four-a-c',
    mastery: false,
    options: [
      {text: '$40$', correct: true},
      {text: '$88$', correct: false, why: 'Uses an incorrect combination of the quadratic coefficients.'},
      {text: '$2$', correct: false, why: 'Uses only the leading coefficient rather than the discriminant formula.'},
      {text: '$58$', correct: false, why: 'Adds terms instead of subtracting $4ac$ from $b^2$.'}
    ],
    solution_text: 'For $ax^2+bx+c$, the discriminant is $b^2-4ac$. Here $a=2$, $b=8$, $c=3$, so $\Delta=8^2-4(2)(3)=64-24=40$.',
    diagramRequired: false,
    uncertainties: []
  },
  '125266': {
    question_text: 'A block is at rest on a rough slope. The only forces acting on it are weight, normal reaction and friction. Which of these will not encourage the block to move?',
    structure: 'reason-about-forces-on-block-on-rough-incline',
    meaningfulCase: 'mass-scales-driving-and-limiting-friction-forces-together',
    mastery: false,
    options: [
      {text: 'Increasing the angle of the slope', correct: false, why: 'A larger angle increases the component of weight down the slope.'},
      {text: 'Decreasing $\mu$', correct: false, why: 'Decreasing the friction coefficient reduces the available limiting friction.'},
      {text: 'Applying an extra force up the slope', correct: false, why: 'An additional force can overcome the existing frictional equilibrium.'},
      {text: 'Increasing the mass', correct: true}
    ],
    solution_text: 'Increasing the mass multiplies both the down-slope component of weight and the normal reaction, so the limiting friction scales by the same factor. It does not by itself change the tendency to move, whereas the other changes can encourage motion.',
    diagramRequired: false,
    uncertainties: []
  },
  '132412': {
    question_text: 'The average repair cost of a children’s bike wheel is $55$, with standard deviation $8$. Costs are normally distributed. If $12$ wheels are repaired, find the probability that the sample mean is greater than $60$.',
    structure: 'find-upper-tail-probability-for-sample-mean',
    meaningfulCase: 'standard-error-is-standard-deviation-over-square-root-n',
    mastery: false,
    options: [
      {text: '$0.2643$', correct: false, why: 'Uses the population standard deviation without the sample-size adjustment.'},
      {text: '$0.0154$', correct: true},
      {text: '$0.7357$', correct: false, why: 'Reports the lower-tail probability instead of the upper tail.'},
      {text: '$0.9846$', correct: false, why: 'Uses the complementary tail in the wrong direction.'}
    ],
    solution_text: 'The sample mean has standard error $8/\sqrt{12}\approx2.309$. Thus $z=(60-55)/2.309\approx2.17$, giving $P(\bar X>60)=1-\Phi(2.17)\approx0.0154$.',
    diagramRequired: false,
    uncertainties: []
  },
  '100397': {
    question_text: 'Express $\log\left(\dfrac{A^2}{BC}\right)$ in terms of $\log A$, $\log B$ and $\log C$.',
    structure: 'expand-logarithm-of-power-and-quotient',
    meaningfulCase: 'power-rule-minus-two-denominator-logarithms',
    mastery: false,
    options: [
      {text: '$2\log A-\log B-\log C$', correct: true},
      {text: '$2\log A-\log B+\log C$', correct: false, why: 'Uses addition rather than subtraction for the factor C in the denominator.'},
      {text: '$\log A^2-\log B+\log C$', correct: false, why: 'Leaves the power unexpanded and uses the wrong sign for C.'},
      {text: '$\log A^2-\log B-\log C$', correct: false, why: 'Leaves the numerator power unexpanded instead of applying the power law.'}
    ],
    solution_text: 'Apply the quotient and power laws: $\log(A^2/BC)=\log A^2-\log B-\log C=2\log A-\log B-\log C$.',
    diagramRequired: false,
    uncertainties: []
  },
  '183094': {
    question_text: 'Ria is going from her house to the post office. What does she pass first?',
    structure: 'interpret-route-order-from-pictorial-map',
    meaningfulCase: 'read-landmarks-in-travel-direction-from-house-to-post-office',
    mastery: false,
    options: [
      {text: 'The trees', correct: false, why: 'The trees are farther along the route toward the post office.'},
      {text: 'The flower', correct: true},
      {text: 'The post office', correct: false, why: 'The post office is the destination, after the intermediate landmarks.'},
      {text: 'The house', correct: false, why: 'She starts at the house rather than passing it first on the journey.'}
    ],
    solution_text: 'Starting at the house on the right and travelling left toward the post office, the route passes the flowers before reaching the trees and then the post office. Therefore she passes the flower first.',
    diagramRequired: true,
    uncertainties: []
  },
  '1865': {
    question_text: 'What is the equation of the graph shown?',
    structure: 'identify-inverted-v-modulus-function-from-graph',
    meaningfulCase: 'negative-modulus-with-vertical-shift-one',
    mastery: false,
    options: [
      {text: '$y=|-x+1|$', correct: false, why: 'Has an absolute-value form with the wrong vertex and shape.'},
      {text: '$y=|-x|+1$', correct: false, why: 'Opens upward rather than forming the shown inverted V.'},
      {text: '$y=-|x|+1$', correct: true},
      {text: '$y=-(|x|+1)$', correct: false, why: 'Has vertex $(0,-1)$ instead of the shown vertex $(0,1)$.'}
    ],
    solution_text: 'The graph is an inverted V symmetric about the y-axis, so it has the form $y=-|x|+c$. Its vertex is $(0,1)$, giving $y=-|x|+1$.',
    diagramRequired: true,
    uncertainties: []
  },
  '2764': {
    question_text: 'The blue function is the original. What is the domain of the inverse function?',
    structure: 'find-domain-of-inverse-from-original-range',
    meaningfulCase: 'inverse-domain-equals-original-function-range',
    mastery: false,
    options: [
      {text: '$0\le x\le3$', correct: true},
      {text: '$2\le x\le4$', correct: false, why: 'Uses the original domain as the inverse domain rather than the original range.'},
      {text: '$2\le y\le4$', correct: false, why: 'Uses the original x-range and the wrong variable for a domain.'},
      {text: '$0\le y\le3$', correct: false, why: 'Describes a range interval rather than the inverse domain in x.'}
    ],
    solution_text: 'The original graph has x-values from $2$ to $4$ and y-values from $0$ to $3$. The domain of the inverse is the range of the original, so it is $0\le x\le3$.',
    diagramRequired: true,
    uncertainties: []
  },
  '73656': {
    question_text: 'A right-angled triangle has hypotenuse $37\,\mathrm{cm}$ and one shorter side $9\,\mathrm{cm}$. Which is the correct method to find the unknown side?',
    structure: 'select-pythagorean-rearrangement-for-unknown-leg',
    meaningfulCase: 'subtract-known-leg-square-from-hypotenuse-square',
    mastery: false,
    options: [
      {text: '$\sqrt{37^2-9^2}$', correct: true},
      {text: '$37^2+9^2$', correct: false, why: 'Adds squares and does not take the square root for a missing leg.'},
      {text: '$\sqrt{37^2+9^2}$', correct: false, why: 'Adds the known leg square instead of subtracting it from the hypotenuse square.'},
      {text: '$37^2-9^2$', correct: false, why: 'Finds the unknown side squared but omits the final square root.'}
    ],
    solution_text: 'By Pythagoras, $37^2=9^2+x^2$. Therefore $x^2=37^2-9^2$ and $x=\sqrt{37^2-9^2}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '83885': {
    question_text: 'Factorise, if possible, $m^2+4$.',
    structure: 'recognise-sum-of-squares-not-factorisable-over-reals',
    meaningfulCase: 'positive-sum-of-squares-has-no-real-linear-factors',
    mastery: false,
    options: [
      {text: '$(m-2)(m-2)$', correct: false, why: 'Expands to $m^2-4m+4$, not $m^2+4$.'},
      {text: '$(m+2)(m-2)$', correct: false, why: 'Expands to the difference of squares $m^2-4$.'},
      {text: '$(m+4)(m-4)$', correct: false, why: 'Expands to $m^2-16$, not the given expression.'},
      {text: 'Does not factorise', correct: true}
    ],
    solution_text: '$m^2+4=m^2+2^2$ is a sum of squares, so it has no factorisation into real linear factors. Therefore it does not factorise over the reals.',
    diagramRequired: false,
    uncertainties: []
  },
  '119554': {
    question_text: 'Which diagram shows two vectors being added together?',
    structure: 'identify-head-to-tail-vector-addition-diagram',
    meaningfulCase: 'second-vector-tail-at-first-vector-head',
    mastery: false,
    options: [
      {text: 'A', correct: false, why: 'Shows vectors sharing a starting point rather than arranged head-to-tail.'},
      {text: 'B', correct: false, why: 'The arrow directions do not form a head-to-tail addition chain.'},
      {text: 'C', correct: true},
      {text: 'D', correct: false, why: 'Shows crossing vectors rather than two vectors placed head-to-tail.'}
    ],
    solution_text: 'To add vectors graphically, place the tail of the second vector at the head of the first. Diagram C shows this head-to-tail arrangement.',
    diagramRequired: true,
    uncertainties: ['The small arrowheads are low-resolution; diagram C is the intended head-to-tail arrangement.']
  },
  '124505': {
    question_text: 'Given $\dfrac{dy}{dx}=4x^2$, to find $y$, what other piece of information do you need?',
    structure: 'identify-initial-condition-needed-after-integrating-gradient',
    meaningfulCase: 'point-condition-determines-constant-of-integration',
    mastery: false,
    options: [
      {text: 'A point the curve passes through', correct: true},
      {text: 'The gradient at a particular x-value', correct: false, why: 'The gradient expression is already supplied for every x-value.'},
      {text: 'The value of $\dfrac{d^2y}{dx^2}$ at a particular point', correct: false, why: 'A second derivative value does not determine the integration constant directly.'},
      {text: 'No other information needed', correct: false, why: 'A point condition is needed to determine the constant after integration.'}
    ],
    solution_text: 'Integrating gives $y=\frac43x^3+C$. A point on the curve is needed to determine the constant $C$, so the required information is a point the curve passes through.',
    diagramRequired: false,
    uncertainties: []
  },
  '81482': {
    question_text: 'Write $0.\dot8$ as a fraction in its lowest terms.',
    structure: 'convert-single-digit-recurring-decimal-to-fraction',
    meaningfulCase: 'recurring-eights-give-numerator-eight-over-nine',
    mastery: false,
    options: [
      {text: '$\dfrac89$', correct: true},
      {text: '$\dfrac{88}{99}$', correct: false, why: 'This is equivalent to $8/9$ but is not in lowest terms.'},
      {text: '$\dfrac{80}{99}$', correct: false, why: 'Uses an incorrect numerator for the recurring digit.'},
      {text: '$\dfrac45$', correct: false, why: 'Represents the terminating decimal $0.8$, not $0.888\ldots$.'}
    ],
    solution_text: 'Let $x=0.888\ldots$. Then $10x=8.888\ldots$, so $9x=8$ and $x=\frac89$.',
    diagramRequired: false,
    uncertainties: []
  },
  '92927': {
    question_text: 'A cone has radius $5\,\mathrm{cm}$ and height $12\,\mathrm{cm}$. What is its total surface area, correct to two decimal places?',
    structure: 'calculate-total-surface-area-of-cone',
    meaningfulCase: 'find-slant-height-then-add-base-and-curved-areas',
    mastery: false,
    options: [
      {text: '$282.74\,\mathrm{cm^2}$', correct: true},
      {text: '$267.04\,\mathrm{cm^2}$', correct: false, why: 'Uses an incorrect combination of the curved and circular areas.'},
      {text: '$502.65\,\mathrm{cm^2}$', correct: false, why: 'Overestimates the area by using an incorrect slant-height calculation.'},
      {text: '$518.36\,\mathrm{cm^2}$', correct: false, why: 'Uses an invalid surface-area expression for the cone.'}
    ],
    solution_text: 'The slant height is $l=\sqrt{12^2+5^2}=13$. Total surface area is $\pi r^2+\pi rl=25\pi+65\pi=90\pi\approx282.74\,\mathrm{cm^2}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '93116': {
    question_text: 'Ann chooses one card at random from a standard deck. What is the probability that she chooses a 4 or a Jack?',
    structure: 'calculate-union-probability-of-disjoint-card-events',
    meaningfulCase: 'four-fours-and-four-jacks-no-overlap',
    mastery: false,
    options: [
      {text: '$\dfrac2{52}$', correct: false, why: 'Counts neither the four suits of 4s nor the four Jacks correctly.'},
      {text: '$\dfrac4{52}$', correct: false, why: 'Counts only one of the two disjoint card groups.'},
      {text: '$\dfrac8{52}$', correct: true},
      {text: '$\dfrac{16}{52}$', correct: false, why: 'Doubles the correct count of favourable cards.'}
    ],
    solution_text: 'There are $4$ cards with rank 4 and $4$ Jacks, with no overlap. Thus $P(4\text{ or Jack})=\frac{4+4}{52}=\frac8{52}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '41093': {
    question_text: 'Simplify $5+\sqrt6$.',
    structure: 'recognise-non-like-terms-in-surd-expression',
    meaningfulCase: 'rational-and-irrational-terms-cannot-be-combined',
    mastery: false,
    options: [
      {text: '$5+2\sqrt3$', correct: false, why: 'Changes the surd value from $\sqrt6$ to an unequal surd.'},
      {text: 'Cannot be simplified', correct: true},
      {text: '$\sqrt{11}$', correct: false, why: 'Adds unlike terms under one square root incorrectly.'},
      {text: '$5\sqrt6$', correct: false, why: 'Multiplies the terms instead of adding unlike terms.'}
    ],
    solution_text: 'The rational term $5$ and irrational term $\sqrt6$ are unlike terms, so they cannot be combined. The expression is already simplified.',
    diagramRequired: false,
    uncertainties: []
  },
  '73519': {
    question_text: 'Beth has £60.00. She spends one quarter of her money. How much does she have left?',
    structure: 'calculate-complementary-fraction-of-money-amount',
    meaningfulCase: 'spend-one-quarter-leaves-three-quarters',
    mastery: false,
    options: [
      {text: '£15.00', correct: false, why: 'Calculates the quarter spent rather than the amount left.'},
      {text: '£45.00', correct: true},
      {text: '£70.00', correct: false, why: 'Increases the original amount instead of subtracting the spending.'},
      {text: '£40.00', correct: false, why: 'Uses an incorrect fraction of the original £60.'}
    ],
    solution_text: 'One quarter of £60 is £15, so the amount left is £60-£15=£45.00.',
    diagramRequired: false,
    uncertainties: []
  },
  '109769': {
    question_text: 'What is the perimeter of this semicircle? The radius is $10\,\mathrm m$. Give your answer to one decimal place.',
    structure: 'calculate-perimeter-of-semicircle-including-diameter',
    meaningfulCase: 'add-straight-diameter-to-half-circumference',
    mastery: false,
    options: [
      {text: '$35.7\,\mathrm m$', correct: false, why: 'Uses an incorrect radius or omits part of the curved boundary.'},
      {text: '$82.8\,\mathrm m$', correct: false, why: 'Uses the full circumference together with an incorrect straight length.'},
      {text: '$31.4\,\mathrm m$', correct: false, why: 'Calculates only the semicircular arc and omits the diameter.'},
      {text: '$51.4\,\mathrm m$', correct: true}
    ],
    solution_text: 'The semicircle perimeter is the diameter plus half the circumference: $2r+\pi r=20+10\pi\approx51.4\,\mathrm m$.',
    diagramRequired: true,
    uncertainties: []
  },
  '28968': {
    question_text: 'A bacteria population grows by $40\%$ per day. The population at the start of the 10th day is $k$ times the population at the start of the 6th day. Find $k$.',
    structure: 'find-exponential-growth-factor-over-four-days',
    meaningfulCase: 'four-daily-growth-steps-between-starts-of-days',
    mastery: false,
    options: [
      {text: '$k=5.37824$', correct: false, why: 'Applies five growth factors instead of the four intervals.'},
      {text: '$k=3.8416$', correct: true},
      {text: '$k=1.6$', correct: false, why: 'Adds or multiplies the daily percentage without compounding.'},
      {text: '$k=5.6$', correct: false, why: 'Uses a linear increase rather than repeated exponential growth.'}
    ],
    solution_text: 'From the start of day 6 to the start of day 10 there are four daily growth periods. Hence $k=1.4^4=3.8416$.',
    diagramRequired: false,
    uncertainties: []
  },
  '5640': {
    question_text: 'You want to find all the points that are the same distance from a single point. What construction do you need?',
    structure: 'identify-locus-of-points-equidistant-from-a-point',
    meaningfulCase: 'constant-radius-locus-is-a-circle',
    mastery: false,
    options: [
      {text: 'Perpendicular bisector', correct: false, why: 'This is the locus equidistant from two points, not one point.'},
      {text: 'Angle bisector', correct: false, why: 'This construction concerns equal angles rather than equal distances from one point.'},
      {text: 'Circle', correct: true},
      {text: 'Parallel line', correct: false, why: 'A line does not keep a constant distance from a single point in all directions.'}
    ],
    solution_text: 'All points at a fixed distance from one centre form a circle. Therefore the required construction is a circle.',
    diagramRequired: false,
    uncertainties: []
  },
  '73883': {
    question_text: 'In the right-angled triangle shown, the side adjacent to the $17^\circ$ angle is $31\,\mathrm{cm}$. Which is the correct method to find the opposite side $u$?',
    structure: 'select-tangent-rearrangement-for-opposite-side',
    meaningfulCase: 'opposite-over-adjacent-equals-tangent',
    mastery: false,
    options: [
      {text: '$\tan(17^\circ)\times31$', correct: true},
      {text: '$\dfrac{31}{\tan(17^\circ)}$', correct: false, why: 'Divides by tangent instead of multiplying after rearranging.'},
      {text: '$\dfrac{31}{\sin(17^\circ)}$', correct: false, why: 'Uses sine with the adjacent side rather than tangent.'},
      {text: '$\dfrac{\tan(17^\circ)}{31}$', correct: false, why: 'Divides the tangent by the length instead of finding the opposite side.'}
    ],
    solution_text: 'For the marked angle, $\tan17^\circ=\frac{u}{31}$. Therefore $u=31\tan17^\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '73944': {
    question_text: 'A population table gives Aberdare $540$, Caerleon $460$ and Llandudno $1900$. A sample of $10$ is selected using stratified sampling. How many should be selected from Caerleon?',
    structure: 'allocate-stratified-sample-proportionally',
    meaningfulCase: 'sample-size-times-stratum-population-over-total',
    mastery: false,
    options: [
      {text: '$1$', correct: false, why: 'Rounds the proportional allocation down too early.'},
      {text: '$1.59$', correct: true},
      {text: '$2$', correct: false, why: 'Rounds the proportional allocation before reporting the calculated value.'},
      {text: '$10$', correct: false, why: 'Uses the full sample size rather than the Caerleon proportion.'}
    ],
    solution_text: 'The total population is $540+460+1900=2900$. The proportional Caerleon allocation is $10\times\frac{460}{2900}=1.586\ldots\approx1.59$.',
    diagramRequired: true,
    uncertainties: ['The source text is Welsh; the table and answer choices clearly indicate proportional stratified sampling for the Caerleon stratum.']
  },
  '98030': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.55]\\draw[fill=orange!15] (-4,-5) rectangle (2,-2);\\draw[green!60!black,thick] (-5,-3.5)--(3,-3.5);\\node[below] at (-4,-5) {$(-4,-5)$};\\node[above] at (-4,-2) {$(-4,-2)$};\\node[above] at (2,-2) {$(2,-2)$};\\node[below] at (2,-5) {$(2,-5)$};\\end{tikzpicture}\n[/tikz]\nWhat is the equation of this line of symmetry?',
    structure: 'find-horizontal-line-of-symmetry-from-rectangle',
    meaningfulCase: 'midpoint-of-parallel-y-coordinates',
    mastery: false,
    options: [
      {text: '$y=-3.5$', correct: true},
      {text: '$y=-7$', correct: false, why: 'Adds the two y-coordinates instead of taking their midpoint.'},
      {text: '$y=-2$', correct: false, why: 'Uses the upper edge rather than the central line of symmetry.'},
      {text: 'Not possible to work out', correct: false, why: 'The labelled parallel edges determine the horizontal midpoint exactly.'}
    ],
    solution_text: 'The line of symmetry lies halfway between $y=-2$ and $y=-5$. Its y-coordinate is $(-2-5)/2=-3.5$, so the equation is $y=-3.5$.',
    diagramRequired: true,
    uncertainties: []
  },
  '28642': {
    question_text: 'Which two of the congruency rules for triangles are shown below?',
    structure: 'identify-triangle-congruence-rules-from-marked-information',
    meaningfulCase: 'right-angle-hypotenuse-side-and-two-sides-included-angle',
    mastery: false,
    options: [
      {text: 'RHS and SAS', correct: true},
      {text: 'RHS and SSS', correct: false, why: 'The second pair shows an included angle, not three corresponding sides.'},
      {text: 'SSA and SAS', correct: false, why: 'The first pair is right-angle-hypotenuse-side, not the ambiguous SSA case.'},
      {text: 'SSS and SAS', correct: false, why: 'The first pair includes a right angle and hypotenuse rather than three sides.'}
    ],
    solution_text: 'The left pair has a right angle, equal hypotenuses of $12$ cm and a corresponding side of $5$ cm, so it is RHS. The right pair has sides $3$ cm and $8$ cm with included angle $103^\circ$, so it is SAS.',
    diagramRequired: true,
    uncertainties: []
  },
  '28678': {
    question_text: 'Let $g(x)=\cos x$. Point $Q$ is $(180,-1)$ on $y=\cos x$. If the graph is transformed to $y=-g(x)-1$, what are the new coordinates of $Q$?',
    structure: 'apply-reflection-and-vertical-translation-to-function-point',
    meaningfulCase: 'transform-y-coordinate-by-negative-and-minus-one',
    mastery: false,
    options: [
      {text: '$(180,2)$', correct: false, why: 'Uses an incorrect transformed y-coordinate.'},
      {text: '$(-180,-2)$', correct: false, why: 'Changes the x-coordinate even though the transformation is vertical.'},
      {text: '$(-180,0)$', correct: false, why: 'Changes x and uses an incorrect vertical transformation.'},
      {text: '$(180,0)$', correct: true}
    ],
    solution_text: 'The transformation leaves $x$ unchanged and sends $y$ to $-y-1$. For $Q=(180,-1)$, the new y-coordinate is $-(-1)-1=0$, giving $(180,0)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '28977': {
    question_text: 'A bacteria population starts at $1000$ and grows by $60\%$ per day. How many bacteria are in the flask at the end of the 4th day?',
    structure: 'calculate-repeated-exponential-growth-over-four-days',
    meaningfulCase: 'multiply-initial-population-by-one-point-six-four-times',
    mastery: false,
    options: [
      {text: '$1600$', correct: false, why: 'Applies the daily growth only once.'},
      {text: '$3400$', correct: false, why: 'Uses an incorrect linear or partial growth calculation.'},
      {text: '$6553.6$', correct: true},
      {text: '$4096$', correct: false, why: 'Applies only three daily growth factors instead of four.'}
    ],
    solution_text: 'A $60\%$ daily increase multiplies the population by $1.6$. After four days the population is $1000(1.6)^4=6553.6$.',
    diagramRequired: false,
    uncertainties: []
  },
  '32826': {
    question_text: 'Six pizzas cost £42.00. How much do two pizzas cost?',
    structure: 'solve-direct-proportion-unit-cost',
    meaningfulCase: 'divide-total-cost-by-six-and-multiply-by-two',
    mastery: false,
    options: [
      {text: '£7.00', correct: false, why: 'This is the cost of one pizza, not two.'},
      {text: '£14.00', correct: true},
      {text: '£84.00', correct: false, why: 'Doubles the full six-pizza cost instead of finding two pizzas.'},
      {text: '£1.40', correct: false, why: 'Uses an incorrect unit cost calculation.'}
    ],
    solution_text: 'One pizza costs £42\div6=£7. Two pizzas cost $2\times£7=£14.00$.',
    diagramRequired: false,
    uncertainties: []
  },
  '82441': {
    question_text: 'Write the recurring decimal $0.4555555\ldots$ as a fraction.',
    structure: 'convert-decimal-with-nonrepeating-prefix-to-fraction',
    meaningfulCase: 'separate-terminating-four-tenths-from-recurring-fives',
    mastery: false,
    options: [
      {text: '$\dfrac{455}{999}$', correct: false, why: 'Treats the first digit as recurring as well as the fives.'},
      {text: '$\dfrac{45}{99}$', correct: false, why: 'Represents a different recurring decimal and is not the given value.'},
      {text: '$4\frac59$', correct: false, why: 'Is greater than one, while the given decimal is less than one.'},
      {text: '$\dfrac{41}{90}$', correct: true}
    ],
    solution_text: 'Write $0.45555\ldots=0.4+0.05555\ldots$. Since $0.4=\frac25$ and $0.05555\ldots=\frac1{18}$, the total is $\frac25+\frac1{18}=\frac{41}{90}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '73865': {
    question_text: 'In the circle, $\angle CAE=25^\circ$ and $DE$ is a tangent. What is the size of $\angle BOA$?',
    structure: 'use-circle-theorems-to-find-central-angle',
    meaningfulCase: 'diameter-subtended-right-angle-and-central-angle-double-inscribed-angle',
    mastery: false,
    options: [
      {text: '$130^\circ$', correct: true},
      {text: '$25^\circ$', correct: false, why: 'Uses the tangent-chord angle directly instead of completing the diameter triangle.'},
      {text: '$50^\circ$', correct: false, why: 'Doubles the given angle but uses the wrong inscribed angle for arc BA.'},
      {text: 'Not enough information', correct: false, why: 'The diameter and tangent information determine the required central angle.'}
    ],
    solution_text: 'Since $BC$ is a diameter, $\angle BAC=90^\circ$. The tangent-chord theorem gives $\angle ABC=\angle CAE=25^\circ$, so $\angle BCA=65^\circ$. The central angle $BOA$ subtends twice $\angle BCA$, hence $\angle BOA=130^\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '97945': {
    question_text: 'The two-way table shows which hand students write with. What is the probability that a randomly chosen student is a right-handed girl?',
    structure: 'read-joint-frequency-from-two-way-table',
    meaningfulCase: 'right-handed-girls-count-over-total-students',
    mastery: false,
    options: [
      {text: '$\dfrac{16}{29}$', correct: false, why: 'Uses the total number of girls rather than the right-handed girls count.'},
      {text: '$\dfrac{13}{29}$', correct: true},
      {text: '$\dfrac{13}{22}$', correct: false, why: 'Conditions on right-handed students instead of choosing from the whole class.'},
      {text: '$\dfrac{22}{29}$', correct: false, why: 'Uses the total number of right-handed students as the favourable count.'}
    ],
    solution_text: 'There are $13$ right-handed girls out of $29$ students in total. Therefore the probability is $\frac{13}{29}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '100609': {
    question_text: 'What sign makes the statement $\frac59\ [\ ]\ \frac7{12}$ true?',
    structure: 'compare-two-fractions-by-cross-multiplication',
    meaningfulCase: 'cross-products-60-less-than-63',
    mastery: false,
    options: [
      {text: '$>$', correct: false, why: 'The left cross-product is smaller, not larger, than the right one.'},
      {text: '$<$', correct: true},
      {text: '$=$', correct: false, why: 'The cross-products $5\times12$ and $7\times9$ are not equal.'},
      {text: '$\approx$', correct: false, why: 'The fractions have an exact strict ordering, not merely an approximation.'}
    ],
    solution_text: 'Cross-multiply: $5\times12=60$ and $7\times9=63$. Since $60<63$, $\frac59<\frac7{12}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '108049': {
    question_text: 'By what reason are these triangles congruent?',
    structure: 'recognise-when-triangle-data-does-not-prove-congruence',
    meaningfulCase: 'two-sides-and-non-included-angle-is-ambiguous-ssa',
    mastery: false,
    options: [
      {text: 'SSS', correct: false, why: 'Only two corresponding side lengths are marked, not three.'},
      {text: 'SAS', correct: false, why: 'The marked angle is not included between the two marked sides.'},
      {text: 'ASA', correct: false, why: 'Only one angle is marked, not two angles and an included side.'},
      {text: 'They may not be congruent', correct: true}
    ],
    solution_text: 'The diagrams give two equal sides and an equal non-included angle, which is the ambiguous SSA configuration. SSA is not a valid general congruence rule, so the triangles may not be congruent.',
    diagramRequired: true,
    uncertainties: []
  },
  '147075': {
    question_text: 'Write $\dfrac{x}{3}+\dfrac{x}{2}$ as a single fraction as simply as possible.',
    structure: 'add-algebraic-fractions-with-common-denominator',
    meaningfulCase: 'least-common-denominator-six-and-add-numerators',
    mastery: false,
    options: [
      {text: '$\dfrac{5x}{6}$', correct: true},
      {text: '$\dfrac{x}{5}$', correct: false, why: 'Adds the denominators instead of using a common denominator.'},
      {text: '$\dfrac{2x}{5}$', correct: false, why: 'Combines the fractions with incorrect numerator and denominator operations.'},
      {text: '$\dfrac{2x}{6}=\dfrac{x}{3}$', correct: false, why: 'Keeps only the first fraction’s equivalent numerator.'}
    ],
    solution_text: 'Using denominator $6$, $\frac{x}{3}=\frac{2x}{6}$ and $\frac{x}{2}=\frac{3x}{6}$. Therefore the sum is $\frac{5x}{6}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '132155': {
    question_text: 'Find the shaded area, to one decimal place. The rectangle is $6\,\mathrm{cm}$ long and $48\,\mathrm{mm}$ high; a semicircle of diameter $48\,\mathrm{mm}$ is removed from its right side.',
    structure: 'calculate-compound-area-with-semicircle-subtracted',
    meaningfulCase: 'convert-millimetres-to-centimetres-and-subtract-semicircle',
    mastery: false,
    options: [
      {text: '$288\,\mathrm{cm^2}$', correct: false, why: 'Calculates the rectangle area without subtracting the semicircular cut-out.'},
      {text: '$28.8\,\mathrm{cm^2}$', correct: false, why: 'Uses the rectangle area alone and ignores the curved section.'},
      {text: '$19.8\,\mathrm{cm^2}$', correct: true},
      {text: '$10.7\,\mathrm{cm^2}$', correct: false, why: 'Subtracts an incorrect semicircle area after mishandling the radius.'}
    ],
    solution_text: 'Convert $48\,\mathrm{mm}=4.8\,\mathrm{cm}$. The rectangle area is $6\times4.8=28.8$. The removed semicircle has radius $2.4$, so its area is $\frac12\pi(2.4)^2\approx9.0$. Hence the shaded area is $28.8-9.0\approx19.8\,\mathrm{cm^2}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '15472': {
    question_text: 'What is the value of $\sqrt[3]{64}$?',
    structure: 'evaluate-cube-root-of-perfect-cube',
    meaningfulCase: 'identify-positive-number-whose-cube-is-sixty-four',
    mastery: false,
    options: [
      {text: '$24$', correct: false, why: 'Multiplies rather than finding the number whose cube is 64.'},
      {text: '$21\frac13$', correct: false, why: 'Uses an incorrect division-based calculation.'},
      {text: '$8$', correct: false, why: '$8^3=512$, not $64$.'},
      {text: '$4$', correct: true}
    ],
    solution_text: 'Since $4^3=4\times4\times4=64$, the cube root of $64$ is $4$.',
    diagramRequired: false,
    uncertainties: []
  },
  '183093': {
    question_text: 'When walking along the path there is a pond, and behind that is a tree. Which map shows this?',
    structure: 'interpret-front-and-behind-order-in-pictorial-map',
    meaningfulCase: 'pond-closer-on-route-with-tree-behind-it',
    mastery: false,
    options: [
      {text: 'A', correct: true},
      {text: 'B', correct: false, why: 'Places the tree in front of the pond rather than behind it along the path.'},
      {text: 'C', correct: false, why: 'Does not show the pond followed by a tree in the stated order.'},
      {text: 'D', correct: false, why: 'Shows neither the required pond-then-tree arrangement nor the route relation.'}
    ],
    solution_text: 'Map A shows the pond nearer on the path with the tree behind it. Therefore A matches the description.',
    diagramRequired: true,
    uncertainties: []
  },
  '107925': {
    question_text: 'A rock has mass $2.1\,\mathrm{kg}$ and density $9\,\mathrm{kg/m^3}$. What is its volume in $\mathrm{cm^3}$?',
    structure: 'calculate-volume-from-mass-and-density-with-unit-conversion',
    meaningfulCase: 'divide-mass-by-density-then-convert-cubic-metres-to-cubic-centimetres',
    mastery: false,
    options: [
      {text: '$2.1\div9\times1{,}000{,}000$', correct: true},
      {text: '$2.1\div9\div100$', correct: false, why: 'Uses an incorrect direction and factor for cubic-unit conversion.'},
      {text: '$2.1\div9\times100$', correct: false, why: 'Uses a square or linear conversion factor instead of a cubic one.'},
      {text: '$2.1\div9$', correct: false, why: 'Leaves the volume in cubic metres rather than converting to cubic centimetres.'}
    ],
    solution_text: 'Volume in cubic metres is $V=m/\rho=2.1/9$. Since $1\,\mathrm{m^3}=1{,}000{,}000\,\mathrm{cm^3}$, the required value is $\frac{2.1}{9}\times1{,}000{,}000$.',
    diagramRequired: false,
    uncertainties: []
  },
  '107414': {
    question_text: 'Which of the following lines is perpendicular to $y=0.3x-7$?',
    structure: 'identify-perpendicular-line-by-negative-reciprocal-gradient',
    meaningfulCase: 'original-slope-three-tenths-gives-perpendicular-slope-minus-ten-thirds',
    mastery: false,
    options: [
      {text: '$x=0.3y-7$', correct: false, why: 'Does not have a gradient of the required negative reciprocal.'},
      {text: '$y=0.3x+4$', correct: false, why: 'Has the same gradient as the original line, so it is parallel.'},
      {text: '$y=3x+2$', correct: false, why: 'Its gradient is positive 3 rather than negative ten thirds.'},
      {text: '$y=3-\dfrac{10}{3}x$', correct: true}
    ],
    solution_text: 'The original gradient is $0.3=\frac3{10}$. A perpendicular line has gradient $-\frac{10}{3}$, which is the gradient in option D.',
    diagramRequired: false,
    uncertainties: []
  },
  '98944': {
    question_text: 'Name the centre of rotation that maps shape $P$ onto shape $Q$ when rotated $90^\circ$ clockwise.',
    structure: 'find-centre-of-clockwise-rotation-between-congruent-shapes',
    meaningfulCase: 'equal-distance-corresponding-points-under-quarter-turn',
    mastery: false,
    options: [
      {text: '$(3,1)$', correct: true},
      {text: '$(3.5,3)$', correct: false, why: 'Does not produce the required quarter-turn correspondence for the vertices.'},
      {text: '$(3,0)$', correct: false, why: 'Places the centre too low to map P onto Q by a 90-degree turn.'},
      {text: 'Origin', correct: false, why: 'A rotation about the origin does not map the shown coordinates onto Q.'}
    ],
    solution_text: 'Using corresponding vertices, the point $(3,3)$ on P rotates clockwise about $(3,1)$ to $(5,1)$ on Q. The other vertices match under the same quarter-turn, so the centre is $(3,1)$.',
    diagramRequired: true,
    uncertainties: []
  },
  '100407': {
    question_text: 'Which of these is the correct sketch for $y=3^x$?',
    structure: 'identify-graph-of-increasing-exponential-function',
    meaningfulCase: 'positive-y-intercept-one-and-horizontal-asymptote-zero',
    mastery: false,
    options: [
      {text: 'A', correct: true},
      {text: 'B', correct: false, why: 'Shows a decreasing exponential rather than the increasing function $3^x$.'},
      {text: 'C', correct: false, why: 'Shows the wrong y-intercept; $3^0=1$, not 3.'},
      {text: 'D', correct: false, why: 'Does not have the correct exponential shape or y-intercept.'}
    ],
    solution_text: 'For $y=3^x$, the graph is increasing, approaches $0$ as $x$ decreases, and crosses the y-axis at $3^0=1$. Sketch A has these features.',
    diagramRequired: true,
    uncertainties: []
  },
  '3365': {
    question_text: 'Given $f(x)=\dfrac4{x^2}$, find $f(2x)$.',
    structure: 'evaluate-function-at-scaled-input',
    meaningfulCase: 'square-the-entire-scaled-input',
    mastery: false,
    options: [
      {text: '$\dfrac4{x^4}$', correct: false, why: 'Raises the denominator to the fourth power instead of substituting carefully.'},
      {text: '$\dfrac4{2x^2}$', correct: false, why: 'Scales the denominator by 2 without squaring the full input.'},
      {text: '$\dfrac2{x^2}$', correct: false, why: 'Halves the numerator instead of evaluating at $2x$.'},
      {text: '$\dfrac1{x^2}$', correct: true}
    ],
    solution_text: '$f(2x)=\frac4{(2x)^2}=\frac4{4x^2}=\frac1{x^2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '7096': {
    question_text: 'Write the recurring decimal $0.3\dot7=0.3777\ldots$ as a fraction.',
    structure: 'convert-recurring-decimal-with-one-nonrepeating-digit',
    meaningfulCase: 'separate-three-tenths-from-recurring-seven-tail',
    mastery: false,
    options: [
      {text: '$\dfrac{37}{90}$', correct: false, why: 'Represents a different recurring pattern with two digits in the repeating block.'},
      {text: '$\dfrac{37}{100}$', correct: false, why: 'Treats the decimal as terminating rather than recurring.'},
      {text: '$\dfrac{34}{90}$', correct: true},
      {text: '$\dfrac{37}{99}$', correct: false, why: 'Uses the formula for a two-digit repeating decimal without the prefix adjustment.'}
    ],
    solution_text: 'Write $0.3777\ldots=0.3+0.0777\ldots=\frac3{10}+\frac7{90}=\frac{27+7}{90}=\frac{34}{90}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '105005': {
    question_text: 'Simplify $p+p\times q$.',
    structure: 'rewrite-implicit-multiplication-in-algebraic-expression',
    meaningfulCase: 'products-with-variables-are-not-like-additive-terms',
    mastery: false,
    options: [
      {text: '$2pq$', correct: false, why: 'Adds $p$ and $pq$ as though they were like terms.'},
      {text: '$p^2q$', correct: false, why: 'Multiplies the two additive terms instead of preserving the plus sign.'},
      {text: '$p+pq$', correct: true},
      {text: 'Does not simplify', correct: false, why: 'The multiplication sign can be written implicitly as $pq$.'}
    ],
    solution_text: 'The product $p\times q$ is conventionally written $pq$. The terms $p$ and $pq$ are unlike, so they cannot be combined; the simplified form shown is $p+pq$.',
    diagramRequired: false,
    uncertainties: []
  },
  '84139': {
    question_text: 'What are the coordinates of the plotted point?',
    structure: 'read-ordered-pair-from-coordinate-grid',
    meaningfulCase: 'positive-x-and-negative-y-quadrant-four',
    mastery: false,
    options: [
      {text: '$(-2,1)$', correct: false, why: 'Uses the wrong signs and reads a different grid location.'},
      {text: '$(1,-2)$', correct: true},
      {text: '$(2,1)$', correct: false, why: 'Reads the y-coordinate as positive and changes the x-coordinate.'},
      {text: '$(1,2)$', correct: false, why: 'Reads the y-coordinate above the x-axis instead of below it.'}
    ],
    solution_text: 'The point is one unit to the right of the y-axis and two units below the x-axis, so its coordinates are $(1,-2)$.',
    diagramRequired: true,
    uncertainties: []
  },
  '97947': {
    question_text: 'The probability that a student attends breakfast club is $\frac12$. In the Venn diagram, the breakfast-only region is unknown, the intersection is $3$, the after-school-only region is $8$ and neither is $2$. What is the missing value?',
    structure: 'solve-venn-diagram-region-from-probability',
    meaningfulCase: 'breakfast-set-total-is-half-of-universal-total',
    mastery: false,
    options: [
      {text: '$5$', correct: false, why: 'Does not satisfy the stated half-probability when totals are calculated.'},
      {text: '$7$', correct: true},
      {text: '$8$', correct: false, why: 'Copies the after-school-only value instead of solving for the missing region.'},
      {text: '$13$', correct: false, why: 'Uses the total of the known non-breakfast regions incorrectly.'}
    ],
    solution_text: 'Let the breakfast-only region be $x$. The breakfast total is $x+3$ and the universal total is $x+3+8+2=x+13$. Since $(x+3)/(x+13)=1/2$, $2x+6=x+13$, so $x=7$.',
    diagramRequired: true,
    uncertainties: []
  },
  '102142': {
    question_text: 'Find an antiderivative of $\dfrac{\cos\theta}{(3+2\sin\theta)^2}$.',
    structure: 'integrate-rational-trigonometric-substitution',
    meaningfulCase: 'substitute-linear-sine-denominator-and-include-half-factor',
    mastery: false,
    options: [
      {text: '$\dfrac2{\sin x+3}$', correct: false, why: 'Has the wrong denominator and sign for the antiderivative.'},
      {text: '$-\dfrac2{2\sin x+3}$', correct: false, why: 'Uses an incorrect factor after the substitution.'},
      {text: '$\dfrac1{2\sin x+3}$', correct: false, why: 'Misses the negative sign and the factor of one half.'},
      {text: '$-\dfrac1{2(2\sin x+3)}$', correct: true}
    ],
    solution_text: 'Let $u=3+2\sin\theta$, so $du=2\cos\theta\,d\theta$. Then the integral is $\frac12\int u^{-2}\,du=-\frac1{2u}+C=-\frac1{2(3+2\sin\theta)}+C$.',
    diagramRequired: false,
    uncertainties: ['The answer choices use x in the displayed denominator while the question uses θ; the intended expression is the same trigonometric variable.']
  },
  '104527': {
    question_text: 'What is the coefficient of the $x^3$ term in the expansion of $(x+8)^4$?',
    structure: 'find-binomial-expansion-coefficient',
    meaningfulCase: 'choose-one-constant-factor-and-three-x-factors',
    mastery: false,
    options: [
      {text: '$4$', correct: false, why: 'Omits the factor of $8$ from the selected constant term.'},
      {text: '$64$', correct: false, why: 'Uses $8^2$ instead of the single constant factor in the $x^3$ term.'},
      {text: '$8$', correct: false, why: 'Omits the binomial coefficient $\binom41=4$.'},
      {text: '$32$', correct: true}
    ],
    solution_text: 'The $x^3$ term is $\binom41x^3(8)=4\times8x^3=32x^3$, so its coefficient is $32$.',
    diagramRequired: false,
    uncertainties: []
  },
  '15127': {
    question_text: 'The number of bats in a colony doubled from 2014 to 2015. By what percentage did the number increase?',
    structure: 'convert-doubling-to-percentage-increase',
    meaningfulCase: 'new-value-is-twice-original-so-increase-equals-original',
    mastery: false,
    options: [
      {text: '$2\%$', correct: false, why: 'Confuses the multiplier 2 with a percentage increase of 2 percent.'},
      {text: '$50\%$', correct: false, why: 'Describes a different change in relation to the original amount.'},
      {text: '$100\%$', correct: true},
      {text: '$200\%$', correct: false, why: 'Reports the new amount as a percentage of the original, not the increase.'}
    ],
    solution_text: 'If the original number is $N$, doubling gives $2N$. The increase is $2N-N=N$, which is $100\%$ of the original.',
    diagramRequired: false,
    uncertainties: []
  },
  '16603': {
    question_text: 'Nathalie has $30$ sweets: $15$ fruit, $6$ aniseed and $9$ mint. Two sweets are chosen at random without replacement. What is the probability that the two sweets are not the same type?',
    structure: 'calculate-complement-of-same-type-probability',
    meaningfulCase: 'subtract-fruit-fruit-aniseed-aniseed-mint-mint-from-one',
    mastery: false,
    options: [
      {text: '$\dfrac{558}{870}$', correct: true},
      {text: '$\dfrac{228}{870}$', correct: false, why: 'Does not count all of the different-type outcomes.'},
      {text: '$\dfrac{562}{870}$', correct: false, why: 'Uses an incorrect complement after adding the same-type cases.'},
      {text: '$\dfrac{312}{870}$', correct: false, why: 'This is the probability numerator for two sweets of the same type.'}
    ],
    solution_text: 'The same-type counts are $15\times14+6\times5+9\times8=210+30+72=312$ out of $30\times29=870$. Therefore the different-type count is $870-312=558$, giving $\frac{558}{870}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '93408': {
    question_text: 'Tom says the two lines in the diagram are parallel. Katie says they will eventually intersect. Who is correct when the marked angles are $120.001^\circ$ and $120^\circ$?',
    structure: 'decide-parallelism-from-nearly-equal-corresponding-angles',
    meaningfulCase: 'unequal-corresponding-angles-imply-nonparallel-lines',
    mastery: false,
    options: [
      {text: 'Only Tom', correct: false, why: 'The marked angles are not exactly equal, so the lines are not parallel.'},
      {text: 'Only Katie', correct: true},
      {text: 'Both Tom and Katie', correct: false, why: 'Nonparallel lines intersect, so the two claims cannot both be correct here.'},
      {text: 'Neither is correct', correct: false, why: 'The unequal angles show the lines are nonparallel and therefore will meet.'}
    ],
    solution_text: 'Parallel lines would produce exactly equal corresponding angles, but $120.001^\circ\ne120^\circ$. The lines are therefore not parallel and will eventually intersect, so only Katie is correct.',
    diagramRequired: true,
    uncertainties: []
  },
  '138171': {
    question_text: 'From the distance-time graph, approximately how far did Leo travel between 13:10 and 13:25?',
    structure: 'read-distance-difference-from-time-series-graph',
    meaningfulCase: 'subtract-distance-at-earlier-time-from-later-time',
    mastery: false,
    options: [
      {text: '$6\,\mathrm{km}$', correct: false, why: 'Uses the distance at 13:10 rather than the change over the interval.'},
      {text: '$5\,\mathrm m$', correct: false, why: 'Uses the wrong unit for a graph measured in kilometres.'},
      {text: '$5\,\mathrm{km}$', correct: true},
      {text: '$11\,\mathrm{km}$', correct: false, why: 'Uses the later cumulative distance rather than subtracting the earlier value.'}
    ],
    solution_text: 'The graph shows about $6$ km at 13:10 and $11$ km at 13:25. The distance travelled between them is $11-6=5$ km.',
    diagramRequired: true,
    uncertainties: []
  },
  '14363': {
    question_text: 'Which of the following graphs could not be used to represent grouped continuous data?',
    structure: 'identify-inappropriate-graph-for-grouped-continuous-data',
    meaningfulCase: 'bar-chart-is-for-discrete-or-categorical-data-not-continuous-groups',
    mastery: false,
    options: [
      {text: 'Frequency polygon', correct: false, why: 'A frequency polygon can represent grouped continuous data.'},
      {text: 'Box plot', correct: false, why: 'A box plot can summarise a continuous data distribution.'},
      {text: 'Back-to-back stem and leaf diagram', correct: false, why: 'Stem-and-leaf displays can represent grouped numerical data.'},
      {text: 'Bar chart', correct: true}
    ],
    solution_text: 'Grouped continuous data is commonly represented by frequency polygons, box plots or stem-and-leaf displays. A bar chart is intended for discrete or categorical data, so it is the unsuitable choice.',
    diagramRequired: false,
    uncertainties: []
  },
  '1980': {
    question_text: 'Which expression shows a translation of the graph $y=f(x)$ by the vector $\begin{pmatrix}2\\0\end{pmatrix}$?',
    structure: 'identify-horizontal-translation-of-function-graph',
    meaningfulCase: 'translation-two-units-right-replaces-x-by-x-minus-two',
    mastery: false,
    options: [
      {text: '$y=f(x)+2$', correct: false, why: 'Moves the graph vertically up by two units.'},
      {text: '$y=f(x)-2$', correct: false, why: 'Moves the graph vertically down by two units.'},
      {text: '$y=f(x+2)$', correct: false, why: 'Moves the graph two units left rather than right.'},
      {text: '$y=f(x-2)$', correct: true}
    ],
    solution_text: 'A translation by $(2,0)$ moves every point two units to the right. A rightward shift of $f$ is represented by $y=f(x-2)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '76912': {
    question_text: 'Simplify $\sqrt2+\sqrt8$ as much as possible.',
    structure: 'simplify-surd-sum-by-extracting-square-factor',
    meaningfulCase: 'rewrite-square-root-eight-as-two-root-two',
    mastery: false,
    options: [
      {text: '$\sqrt2+2\sqrt2$', correct: false, why: 'Rewrites the second surd but does not collect like terms.'},
      {text: '$3\sqrt2$', correct: true},
      {text: 'Cannot be simplified', correct: false, why: '$\sqrt8$ simplifies to $2\sqrt2$, making like surd terms.'},
      {text: '$\sqrt{10}$', correct: false, why: 'Adds radicands inside one square root incorrectly.'}
    ],
    solution_text: 'Since $\sqrt8=\sqrt{4\times2}=2\sqrt2$, the sum is $\sqrt2+2\sqrt2=3\sqrt2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '35973': {
    question_text: 'I am thinking of a number. I divide it by $0.5$ and my answer is $10$. What number am I thinking of?',
    structure: 'solve-one-step-decimal-division-equation',
    meaningfulCase: 'unknown-divided-by-half-equals-ten',
    mastery: false,
    options: [
      {text: '$5$', correct: true},
      {text: '$20$', correct: false, why: 'Multiplies by 2 instead of reversing the division by 0.5.'},
      {text: '$10.5$', correct: false, why: 'Adds the decimal instead of solving the division equation.'},
      {text: '$50$', correct: false, why: 'Uses an incorrect scaling factor for division by one half.'}
    ],
    solution_text: 'Let the number be $n$. Then $n\div0.5=10$, so $n=10\times0.5=5$.',
    diagramRequired: false,
    uncertainties: []
  },
  '28573': {
    question_text: 'Two dice are rolled and their scores are added. What is the probability that the total is a square number?',
    structure: 'count-square-sums-in-two-dice-outcomes',
    meaningfulCase: 'square-sums-four-and-nine-have-one-plus-four-outcomes',
    mastery: false,
    options: [
      {text: '$\dfrac5{36}$', correct: true},
      {text: '$\dfrac7{36}$', correct: false, why: 'Counts too many dice outcomes as square totals.'},
      {text: '$\dfrac3{36}$', correct: false, why: 'Counts only some of the outcomes giving totals 4 or 9.'},
      {text: '$\dfrac4{12}$', correct: false, why: 'Uses an incorrect denominator for two six-sided dice.'}
    ],
    solution_text: 'Possible square totals are $4$ and $9$. Total $4$ occurs once, $(2,2)$, and total $9$ occurs four times, $(3,6),(4,5),(5,4),(6,3)$. Thus the probability is $5/36$.',
    diagramRequired: true,
    uncertainties: []
  },
  '97994': {
    question_text: 'Describe the movement to get from point $Y=(-2,-2)$ to point $Z=(1,-1)$.',
    structure: 'describe-translation-between-coordinate-points',
    meaningfulCase: 'positive-three-horizontal-and-positive-one-vertical-displacement',
    mastery: false,
    options: [
      {text: 'Right 4 squares, up 1 square', correct: false, why: 'Overstates the horizontal displacement by one square.'},
      {text: 'Left 3 squares, up 1 square', correct: false, why: 'Uses the wrong horizontal direction.'},
      {text: 'Right 3 squares, up 1 square', correct: true},
      {text: 'Left 3 squares, down 1 square', correct: false, why: 'Reverses both directions of the displacement.'}
    ],
    solution_text: 'From $x=-2$ to $x=1$ is $3$ units right, and from $y=-2$ to $y=-1$ is $1$ unit up. Therefore the movement is right $3$ squares and up $1$ square.',
    diagramRequired: true,
    uncertainties: []
  },
  '3230': {
    question_text: 'What is the remainder when $5x^3-4x+8$ is divided by $x-2$?',
    structure: 'apply-remainder-theorem-to-cubic-polynomial',
    meaningfulCase: 'evaluate-polynomial-at-divisor-root-two',
    mastery: false,
    options: [
      {text: '$-24$', correct: false, why: 'Uses an incorrect sign or substitution in the polynomial.'},
      {text: '$0$', correct: false, why: 'Assumes $x-2$ is a factor without evaluating the polynomial.'},
      {text: '$8$', correct: false, why: 'Uses only the constant term instead of the full value at $x=2$.'},
      {text: '$40$', correct: true}
    ],
    solution_text: 'By the remainder theorem, the remainder is $p(2)=5(2^3)-4(2)+8=40-8+8=40$.',
    diagramRequired: false,
    uncertainties: []
  },
  '104863': {
    question_text: 'A two-way table records homework hours in intervals $0<h\\le5$, $5<h\\le10$, and $10<h\\le15$. In which column would $10$ hours go?',
    structure: 'locate-value-in-half-open-grouped-interval',
    meaningfulCase: 'upper-bound-included-in-second-interval',
    mastery: false,
    options: [
      {text: '$0<h\\le5$', correct: false, why: 'Ten is above the upper bound of the first interval.'},
      {text: '$5<h\\le10$', correct: true},
      {text: '$10<h\\le15$', correct: false, why: 'The lower bound is strict, so exactly 10 is excluded from this interval.'},
      {text: 'New column needed', correct: false, why: 'The existing half-open intervals already include every positive value in range.'}
    ],
    solution_text: 'The interval $5<h\\le10$ includes its upper endpoint, so a value of exactly $10$ belongs in the second column.',
    diagramRequired: true,
    uncertainties: []
  },
  '14954': {
    question_text: 'Find $f\'(x)$ if $f(x)=(x^{-1}-4)^5$.',
    structure: 'differentiate-power-of-reciprocal-composite',
    meaningfulCase: 'chain-rule-inner-derivative-negative-x-to-minus-two',
    mastery: false,
    options: [
      {text: '$5(x^{-1}-4)^4$', correct: false, why: 'Omits the derivative of the inner expression $x^{-1}-4$.'},
      {text: '$5x^{-2}(x^{-1}-4)^4$', correct: false, why: 'Has the inner derivative magnitude but misses its negative sign.'},
      {text: '$-5x^{-2}(x^{-1}-4)^4$', correct: true},
      {text: '$-5(x^{-1}-4)^4$', correct: false, why: 'Includes a negative sign but omits the factor $x^{-2}$.'}
    ],
    solution_text: 'By the chain rule, $f\\prime(x)=5(x^{-1}-4)^4(-x^{-2})=-5x^{-2}(x^{-1}-4)^4$.',
    diagramRequired: false,
    uncertainties: []
  },
  '40997': {
    question_text: 'The blue curve has equation $y=f(x)$. What is the equation of the green curve?',
    structure: 'identify-horizontal-translation-of-function-graph',
    meaningfulCase: 'shift-three-units-left-replaces-x-by-x-plus-three',
    mastery: false,
    options: [
      {text: '$y=f(x+3)$', correct: true},
      {text: '$y=f(x-3)$', correct: false, why: 'Would shift the blue graph three units to the right.'},
      {text: '$y=f(x)+3$', correct: false, why: 'Would shift the graph vertically rather than horizontally.'},
      {text: '$y=f(x)-3$', correct: false, why: 'Would shift the graph down rather than three units left.'}
    ],
    solution_text: 'The green curve is the blue curve shifted three units to the left. A left shift by 3 is represented by replacing $x$ with $x+3$, so $y=f(x+3)$.',
    diagramRequired: true,
    uncertainties: []
  },
  '73371': {
    question_text: 'Which of the following plans and elevations is correct for the cube arrangement shown?',
    structure: 'interpret-plan-and-elevation-drawings-of-cube-solid',
    meaningfulCase: 'front-view-column-heights-from-three-dimensional-arrangement',
    mastery: false,
    options: [
      {text: 'A: left-side elevation shown', correct: false, why: 'This proposed side elevation does not match the visible stack arrangement.'},
      {text: 'B: plan view shown', correct: false, why: 'The proposed plan places the projecting cubes in the wrong positions.'},
      {text: 'C: front elevation shown', correct: true},
      {text: 'D: right-side elevation shown', correct: false, why: 'This proposed right elevation omits the height variation in the solid.'}
    ],
    solution_text: 'Viewing the arrangement from the indicated front direction gives a central row with a two-cube column at the left and the corresponding lower projections. This matches the front elevation in option C.',
    diagramRequired: true,
    uncertainties: ['The isometric cube arrangement makes the intended viewing direction and hidden cubes partly dependent on the diagram; option C is the intended matching elevation.']
  },
  '41096': {
    question_text: 'When expanding $(2-\\sqrt6)(3+2\\sqrt6)$, before simplifying there are four terms. Which option contains two of these terms?',
    structure: 'expand-surds-by-distributive-law',
    meaningfulCase: 'identify-cross-products-before-surds-simplify',
    mastery: false,
    options: [
      {text: '$-\\sqrt{18}$ and $6$', correct: false, why: 'Neither pair matches the two cross terms from the expansion.'},
      {text: '$-3\\sqrt6$ and $-12$', correct: true},
      {text: '$-3\\sqrt6$ and $-\\sqrt{12}$', correct: false, why: 'The final term is $-12$, not another unsimplified radical.'},
      {text: '$6$ and $3\\sqrt6$', correct: false, why: 'Uses a cross term with the wrong sign and omits the negative product.'}
    ],
    solution_text: 'Distribute each term: $2(3)=6$, $2(2\\sqrt6)=4\\sqrt6$, $(-\\sqrt6)(3)=-3\\sqrt6$, and $(-\\sqrt6)(2\\sqrt6)=-12$. Thus option B contains two terms.',
    diagramRequired: false,
    uncertainties: []
  },
  '67248': {
    question_text: '$\\square\\,\\mathrm{cm^2}=10\\,\\mathrm{m^2}$. What number belongs in the square?',
    structure: 'convert-square-metres-to-square-centimetres',
    meaningfulCase: 'area-unit-conversion-squares-the-length-factor',
    mastery: false,
    options: [
      {text: '$100{,}000$', correct: true},
      {text: '$100$', correct: false, why: 'Uses the linear conversion factor rather than squaring it for area.'},
      {text: '$0.1$', correct: false, why: 'Converts in the wrong direction and does not square the factor.'},
      {text: '$0.001$', correct: false, why: 'Uses an incorrect unit conversion and wrong direction.'}
    ],
    solution_text: 'Since $1\\,\\mathrm m=100\\,\\mathrm{cm}$, $1\\,\\mathrm{m^2}=100^2=10{,}000\\,\\mathrm{cm^2}$. Therefore $10\\,\\mathrm{m^2}=100{,}000\\,\\mathrm{cm^2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '76270': {
    question_text: 'Dave goes on holiday to America and needs to change £280 to dollars. How many dollars would he get if $10=£7$?',
    structure: 'convert-currency-using-equivalent-rate',
    meaningfulCase: 'scale-pound-amount-by-dollars-per-seven-pounds',
    mastery: false,
    options: [
      {text: '$28$', correct: false, why: 'Divides by 10 without applying the pound-to-dollar exchange rate.'},
      {text: '$196$', correct: false, why: 'Multiplies £280 by 0.7 instead of converting to dollars.'},
      {text: '$40$', correct: false, why: 'Uses £7 per $10 in the wrong direction.'},
      {text: '$400$', correct: true}
    ],
    solution_text: 'Every £7 buys $10. Since £280 is $280/7=40$ groups of £7, the amount is $40\\times10=400$.',
    diagramRequired: false,
    uncertainties: []
  },
  '83908': {
    question_text: 'What is the solution to $x^2\\le9$?',
    structure: 'solve-non-strict-square-inequality',
    meaningfulCase: 'include-both-endpoints-and-values-between-plus-or-minus-three',
    mastery: false,
    options: [
      {text: '$x\\ge3$ or $x\\le-3$', correct: false, why: 'Describes the outside region for $x^2\\ge9$, not the inside region.'},
      {text: '$x\\le3$ or $x\\ge-3$', correct: false, why: 'Combines overlapping one-sided conditions and does not state the bounded interval.'},
      {text: '$-3\\le x\\le3$', correct: true},
      {text: '$-3\\ge x\\ge3$', correct: false, why: 'Reverses the inequality ordering and describes no valid interval.'}
    ],
    solution_text: '$x^2\\le9$ is equivalent to $|x|\\le3$, so $-3\\le x\\le3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '89546': {
    question_text: 'The product of two numbers is $-30$. What could the two numbers be?',
    structure: 'identify-integer-factor-pair-with-negative-product',
    meaningfulCase: 'opposite-sign-factors-of-thirty',
    mastery: false,
    options: [
      {text: '$-15$ and $-2$', correct: false, why: 'Two negative factors have a positive product, not negative 30.'},
      {text: '$-20$ and $-10$', correct: false, why: 'Their product is positive 200 rather than negative 30.'},
      {text: '$-6$ and $5$', correct: true},
      {text: '$-30$ and $0$', correct: false, why: 'Any product involving zero is zero, not negative 30.'}
    ],
    solution_text: '$(-6)\\times5=-30$, so $-6$ and $5$ are a valid pair.',
    diagramRequired: false,
    uncertainties: []
  },
  '13204': {
    question_text: 'To find the image of a point, you multiply…',
    structure: 'apply-transformation-matrix-to-position-vector',
    meaningfulCase: 'matrix-left-multiplies-column-position-vector',
    mastery: false,
    options: [
      {text: 'the matrix by the position vector of a point', correct: true},
      {text: 'the position vector of the point by the matrix', correct: false, why: 'Reverses the standard column-vector multiplication order.'},
      {text: 'the coordinates of the point by the matrix', correct: false, why: 'Coordinates are represented by the position vector, which the matrix transforms.'},
      {text: 'the matrix by the coordinates of the point', correct: false, why: 'Describes the same objects in an imprecise order and omits vector multiplication.'}
    ],
    solution_text: 'For a column position vector, the image is found by left-multiplying the vector by the transformation matrix: $\\mathbf x\\mapsto A\\mathbf x$.',
    diagramRequired: false,
    uncertainties: []
  },
  '137710': {
    question_text: 'What is the real part of the standard form of the expression $(5+i)(10-i)$?',
    structure: 'multiply-complex-numbers-and-identify-real-part',
    meaningfulCase: 'i-squared-negative-one-produces-real-correction',
    mastery: false,
    options: [
      {text: '$5$', correct: false, why: 'Keeps only the first real factor and omits the product expansion.'},
      {text: '$51$', correct: true},
      {text: '$50$', correct: false, why: 'Omits the contribution from $i(-i)=-i^2=1$.'},
      {text: '$49$', correct: false, why: 'Uses the wrong sign for the product of the imaginary terms.'}
    ],
    solution_text: '$(5+i)(10-i)=50-5i+10i-i^2=50+5i+1=51+5i$. The real part is $51$.',
    diagramRequired: false,
    uncertainties: []
  },
  '20856': {
    question_text: 'Scores in a maths test are normally distributed with mean $64\\%$ and standard deviation $10\\%$. Find the probability that a randomly chosen student scores more than the mean.',
    structure: 'use-normal-symmetry-to-find-above-mean-probability',
    meaningfulCase: 'half-distribution-lies-above-the-mean',
    mastery: false,
    options: [
      {text: '$0.36$', correct: false, why: 'Uses an unrelated tail probability rather than symmetry about the mean.'},
      {text: '$0.5$', correct: true},
      {text: '$0.64$', correct: false, why: 'Confuses the mean score percentage with the probability above the mean.'},
      {text: '$-0.5$', correct: false, why: 'Probabilities cannot be negative.'}
    ],
    solution_text: 'A normal distribution is symmetric about its mean, so exactly half the scores lie above it. The probability is $0.5$.',
    diagramRequired: false,
    uncertainties: []
  },
  '3507': {
    question_text: 'What does $\\displaystyle\\int e^{2x-1}\,dx$ equal?',
    structure: 'integrate-exponential-linear-function',
    meaningfulCase: 'divide-by-inner-linear-coefficient',
    mastery: false,
    options: [
      {text: '$\\dfrac{e^{2x-1}}2+c$', correct: true},
      {text: '$(2x-1)e^{2x-2}+c$', correct: false, why: 'Applies a product-style expression rather than the exponential antiderivative rule.'},
      {text: '$2e^{2x+1}+c$', correct: false, why: 'Changes the exponent and multiplies by 2 instead of dividing by it.'},
      {text: '$\\dfrac{e^{2x}}{2x-1}+c$', correct: false, why: 'Treats the linear exponent as a denominator rather than using its derivative.'}
    ],
    solution_text: 'Since the derivative of $2x-1$ is $2$, $\\int e^{2x-1}dx=\\frac12e^{2x-1}+c$.',
    diagramRequired: false,
    uncertainties: []
  },
  '124511': {
    question_text: 'When given an expression for velocity, how would you find an expression for displacement?',
    structure: 'recover-displacement-by-integrating-velocity',
    meaningfulCase: 'displacement-is-antiderivative-of-velocity',
    mastery: false,
    options: [
      {text: 'Differentiate once', correct: false, why: 'Differentiation moves from displacement to velocity, not the reverse.'},
      {text: 'Differentiate twice', correct: false, why: 'Moves further toward acceleration rather than recovering displacement.'},
      {text: 'Integrate once', correct: true},
      {text: 'Integrate twice', correct: false, why: 'One integration already changes velocity into displacement.'}
    ],
    solution_text: 'Velocity is the derivative of displacement, $v=ds/dt$. Therefore an expression for displacement is found by integrating velocity once, with a constant of integration as needed.',
    diagramRequired: false,
    uncertainties: []
  },
  '81771': {
    question_text: 'Romesh uses Verify mode to check that he has factorised the expression correctly: $x^2-2x=x(x-2)$. Has he factorised it correctly?',
    structure: 'verify-quadratic-factorisation-by-expansion',
    meaningfulCase: 'common-factor-x-produces-x-squared-minus-two-x',
    mastery: false,
    options: [
      {text: 'Yes, it’s correct', correct: true},
      {text: 'No, he has made a mistake', correct: false, why: 'The right-hand product expands exactly to the displayed quadratic.'},
      {text: 'He has made a syntax error', correct: false, why: 'The expression is syntactically valid and algebraically equivalent.'},
      {text: 'Calculators can’t check algebra', correct: false, why: 'A symbolic calculator can verify equality by expanding or simplifying.'}
    ],
    solution_text: 'Expanding the factorised form gives $x(x-2)=x^2-2x$, which matches the original expression. The factorisation is correct.',
    diagramRequired: false,
    uncertainties: []
  },
  '96270': {
    question_text: '$(x-1)$ is a factor of $f(x)$ where $f(x)=x^3-6x^2+11x-6$. Factorise $f(x)$ fully.',
    structure: 'factorise-cubic-from-known-linear-factor',
    meaningfulCase: 'three-integer-roots-one-two-three',
    mastery: false,
    options: [
      {text: '$(x+1)(x-2)(x-3)$', correct: false, why: 'Introduces the wrong sign for the root at negative one.'},
      {text: '$(x-1)(x-2)(x-3)$', correct: true},
      {text: '$(x+1)(x+2)(x+3)$', correct: false, why: 'Uses the negatives of the actual roots.'},
      {text: '$(x-1)(x+2)(x+3)$', correct: false, why: 'Only the known factor is correct; the remaining roots have wrong signs.'}
    ],
    solution_text: 'The polynomial has roots $1,2,3$, since $(x-1)(x-2)(x-3)=x^3-6x^2+11x-6$. Hence the complete factorisation is $(x-1)(x-2)(x-3)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '99520': {
    question_text: 'Solve $7\\sin x^\\circ+2=3$ for $0\\le x<360$.',
    structure: 'solve-sine-equation-in-degrees',
    meaningfulCase: 'positive-sine-solutions-in-first-and-second-quadrants',
    mastery: false,
    options: [
      {text: '$45.6,134.4$', correct: false, why: 'Uses the wrong sine value, corresponding to a different equation.'},
      {text: '$188.2,351.8$', correct: false, why: 'Places the solutions in the third and fourth quadrants where sine is negative.'},
      {text: '$5.7,174.3$', correct: false, why: 'Uses an inaccurate inverse-sine value for $1/7$.'},
      {text: '$8.2,171.8$', correct: true}
    ],
    solution_text: '$7\\sin x+2=3$ gives $\\sin x=1/7$. Thus $x=\\sin^{-1}(1/7)\\approx8.2^\\circ$ or $180^\\circ-8.2^\\circ=171.8^\\circ$.',
    diagramRequired: false,
    uncertainties: []
  },
  '12842': {
    question_text: 'Which number below is $\\frac34$ more than $0.5$?',
    structure: 'add-fractional-increment-to-decimal',
    meaningfulCase: 'convert-half-to-two-quarters-and-add-three-quarters',
    mastery: false,
    options: [
      {text: '$\\frac46$', correct: false, why: 'Equals two thirds, not the result of adding three quarters to one half.'},
      {text: '$0.84$', correct: false, why: 'Adds an incorrect decimal increment to 0.5.'},
      {text: '$1.205$', correct: false, why: 'Uses an incorrect decimal conversion for the fraction.'},
      {text: '$\\frac54$', correct: true}
    ],
    solution_text: '$0.5+\\frac34=\\frac12+\\frac34=\\frac24+\\frac34=\\frac54$.',
    diagramRequired: false,
    uncertainties: []
  },
  '11173': {
    question_text: 'Find the value of $\\displaystyle\\int_{-1}^{2}12xe^{2x}\\,dx$.',
    structure: 'evaluate-definite-integral-by-integration-by-parts',
    meaningfulCase: 'boundary-evaluation-of-x-times-exponential',
    mastery: false,
    options: [
      {text: '$9e^4+\\frac3{e^2}$', correct: false, why: 'Uses an incorrect coefficient at the lower boundary.'},
      {text: '$15e^4+\\frac3{e^2}$', correct: false, why: 'Makes errors in the antiderivative coefficients at both limits.'},
      {text: '$6e^4+\\frac{12}{e^2}$', correct: false, why: 'Does not apply integration by parts correctly to the x factor.'},
      {text: '$9\\left[e^4+\\frac1{e^2}\\right]$', correct: true}
    ],
    solution_text: 'An antiderivative is $e^{2x}(6x-3)$. Evaluating gives $e^4(12-3)-e^{-2}(-6-3)=9e^4+9e^{-2}=9\\left(e^4+\\frac1{e^2}\\right)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '17314': {
    question_text: 'What transformation is represented by the matrix $\\begin{pmatrix}0&1\\\\-1&0\\end{pmatrix}$?',
    structure: 'identify-rotation-from-two-dimensional-transformation-matrix',
    meaningfulCase: 'clockwise-quarter-turn-about-origin',
    mastery: false,
    options: [
      {text: 'Rotation $90^\\circ$ anticlockwise about the origin', correct: false, why: 'An anticlockwise turn has matrix $\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$.'},
      {text: 'Reflection in the x-axis', correct: false, why: 'Reflection in the x-axis has diagonal matrix $\\operatorname{diag}(1,-1)$.'},
      {text: 'Reflection in the y-axis', correct: false, why: 'Reflection in the y-axis has diagonal matrix $\\operatorname{diag}(-1,1)$.'},
      {text: 'Rotation $90^\\circ$ clockwise about the origin', correct: true}
    ],
    solution_text: 'The matrix maps $(1,0)$ to $(0,-1)$ and $(0,1)$ to $(1,0)$, which is a $90^\\circ$ clockwise rotation about the origin.',
    diagramRequired: true,
    uncertainties: []
  },
  '66523': {
    question_text: 'Which option gives the Cartesian form for the parametric equations $x=3t$, $y=\\dfrac3t$?',
    structure: 'eliminate-parameter-from-parametric-equations',
    meaningfulCase: 'multiply-coordinate-equations-to-remove-t',
    mastery: false,
    options: [
      {text: '$xy=9$', correct: true},
      {text: '$y=x$', correct: false, why: 'Would require the two coordinates to be equal, which is not given.'},
      {text: '$x/y=9$', correct: false, why: 'Dividing gives a t-dependent expression rather than eliminating t.'},
      {text: '$y=9x$', correct: false, why: 'Uses the product constant as a coefficient in a linear relation.'}
    ],
    solution_text: 'Multiply the equations: $xy=(3t)(3/t)=9$, for $t\\ne0$. Thus the Cartesian equation is $xy=9$.',
    diagramRequired: false,
    uncertainties: []
  },
  '14810': {
    question_text: 'Find $\\dfrac{dy}{dx}$ in terms of $x$ and $y$ for $\\sqrt{x}+\\sqrt{y}=1$.',
    structure: 'differentiate-implicit-square-root-equation',
    meaningfulCase: 'isolate-derivative-after-differentiating-radicals',
    mastery: false,
    options: [
      {text: '$\\sqrt{y/x}$', correct: false, why: 'Omits the negative sign required when moving the x derivative term.'},
      {text: '$-\\sqrt{x/y}$', correct: false, why: 'Inverts the ratio of the square-root factors.'},
      {text: '$\\sqrt{x/y}$', correct: false, why: 'Has the wrong sign and the wrong ratio.'},
      {text: '$-\\sqrt{y/x}$', correct: true}
    ],
    solution_text: 'Differentiate: $\\frac1{2\\sqrt{x}}+\\frac{y\\prime}{2\\sqrt{y}}=0$. Hence $y\\prime=-\\frac{\\sqrt{y}}{\\sqrt{x}}=-\\sqrt{y/x}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '102012': {
    question_text: 'A girl of mass $55\\,\\mathrm{kg}$ is going up in a lift. The normal reaction force of the lift on the girl is $539\\,\\mathrm N$. The lift is…',
    structure: 'infer-lift-motion-from-reaction-equals-weight',
    meaningfulCase: 'equal-normal-and-weight-implies-zero-acceleration',
    mastery: false,
    options: [
      {text: 'Accelerating', correct: false, why: 'A nonzero acceleration would require the reaction to differ from the weight.'},
      {text: 'Decelerating', correct: false, why: 'The equal forces give no upward or downward resultant.'},
      {text: 'Moving at a constant speed', correct: true},
      {text: 'Stationary', correct: false, why: 'The lift is described as going up, so zero acceleration means constant speed.'}
    ],
    solution_text: 'The girl’s weight is $55g=539\\,\\mathrm N$. Since this equals the upward normal reaction, the resultant force is zero. The lift therefore has zero acceleration and, while moving up, travels at constant speed.',
    diagramRequired: false,
    uncertainties: []
  },
  '105722': {
    question_text: 'Express the following as a single fraction, writing your answer as simply as possible: $\\dfrac ts\\times\\dfrac{2s}{t}$.',
    structure: 'simplify-product-of-algebraic-fractions',
    meaningfulCase: 'cancel-nonzero-factors-across-numerator-and-denominator',
    mastery: false,
    options: [
      {text: '$\\dfrac{2s+t}{s+t}$', correct: false, why: 'Adds terms instead of multiplying and cancelling factors.'},
      {text: '$\\dfrac{t+2s}{st}$', correct: false, why: 'Combines the numerators additively and does not cancel.'},
      {text: '$2$', correct: true},
      {text: '$\\dfrac{t^2+2s^2}{st}$', correct: false, why: 'Squares and adds factors rather than simplifying the product.'}
    ],
    solution_text: '$\\dfrac ts\\times\\dfrac{2s}{t}=\\dfrac{2st}{st}=2$, assuming $s$ and $t$ are nonzero.',
    diagramRequired: false,
    uncertainties: []
  },
  '12622': {
    question_text: 'Two groups of students do a test. Group A marks are $6,7,7,7,8,8,9,9$ and Group B marks are $2,3,5,7,8,8,9,10$. Three statements are true and one is false. Which one is false?',
    structure: 'compare-summary-statistics-of-two-data-sets',
    meaningfulCase: 'distinguish-range-median-mean-and-spread',
    mastery: false,
    options: [
      {text: 'The mean mark for Group B is $6.5$.', correct: false, why: 'The Group B total is 52, and 52 divided by 8 is 6.5.'},
      {text: 'The range of marks for Group A is $3$.', correct: false, why: 'Group A ranges from 6 to 9, giving range 3.'},
      {text: 'The median mark is the same for each Group.', correct: false, why: 'Both middle pairs average to 7.5, so this statement is true.'},
      {text: 'The marks in Group A have a greater spread than the marks in Group B.', correct: true, why: 'Group B has the larger range, 8 compared with Group A’s range of 3.'}
    ],
    solution_text: 'Group B has mean $52/8=6.5$. Group A has range $9-6=3$. Both medians are $(7+8)/2=7.5$. However, Group B has range $10-2=8$, larger than Group A’s, so the false statement is D.',
    diagramRequired: false,
    uncertainties: []
  },
  '104406': {
    question_text: 'Is $(x-2)$ a factor of $x^3+5x^2+6x$?',
    structure: 'apply-factor-theorem-to-test-factor',
    meaningfulCase: 'evaluate-polynomial-at-candidate-root-two',
    mastery: false,
    options: [
      {text: 'Yes, because $(-2)^3+5(-2)^2+6(-2)=0$', correct: false, why: 'Uses the root $-2$, which belongs to factor $(x+2)$ rather than $(x-2)$.'},
      {text: 'No, because $(-2)^3+5(-2)^2+6(-2)\\ne0$', correct: false, why: 'Tests the wrong value even though the displayed evaluation is nonzero.'},
      {text: 'Yes, because $(2)^3+5(2)^2+6(2)=0$', correct: false, why: 'Substituting 2 gives 40, not zero.'},
      {text: 'No, because $(2)^3+5(2)^2+6(2)\\ne0$', correct: true}
    ],
    solution_text: 'By the factor theorem, $(x-2)$ is a factor only if the polynomial is zero at $x=2$. The value is $2^3+5(2)^2+6(2)=8+20+12=40\\ne0$, so it is not a factor.',
    diagramRequired: false,
    uncertainties: []
  },
  '151088': {
    question_text: 'Given $y\\cos x=4$, find $\\dfrac{dy}{dx}$.',
    structure: 'differentiate-implicit-product-equation',
    meaningfulCase: 'isolate-derivative-after-product-rule',
    mastery: false,
    options: [
      {text: '$\\frac1x$', correct: false, why: 'Confuses the logarithmic derivative with this implicit product.'},
      {text: '$y\\tan x$', correct: true},
      {text: '$\\tan x$', correct: false, why: 'Omits the factor of y that remains after rearrangement.'},
      {text: '$-y\\tan x$', correct: false, why: 'Introduces an incorrect sign when moving the product-rule term.'}
    ],
    solution_text: 'Differentiate $y\\cos x=4$: $y\\prime\\cos x-y\\sin x=0$. Hence $y\\prime=y\\tan x$.',
    diagramRequired: false,
    uncertainties: []
  },
  '20236': {
    question_text: 'A function is given by $f(x)=\\sqrt{9-x^2}$. What is a suitable domain of $f$?',
    structure: 'find-domain-from-square-root-radicand',
    meaningfulCase: 'radicand-nonnegative-gives-closed-symmetric-interval',
    mastery: false,
    options: [
      {text: '$x\\ge3$', correct: false, why: 'For values above 3 the radicand becomes negative.'},
      {text: '$x\\le3$', correct: false, why: 'Includes values less than -3 where the square root is not real.'},
      {text: '$-3\\le x\\le3$', correct: true},
      {text: '$-9\\le x\\le9$', correct: false, why: 'Uses the coefficient 9 as an endpoint instead of solving $x^2\\le9$.'}
    ],
    solution_text: 'The square-root radicand must satisfy $9-x^2\\ge0$, so $x^2\\le9$. Therefore the domain is $-3\\le x\\le3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '28287': {
    question_text: 'Which of the following lines is not parallel to $y=5x+1$?',
    structure: 'compare-gradients-to-test-parallel-lines',
    meaningfulCase: 'standardise-each-line-and-compare-slope-five',
    mastery: false,
    options: [
      {text: '$y=1-5x$', correct: true},
      {text: '$y=5(4+x)$', correct: false, why: 'Expands to $y=5x+20$, which has gradient 5.'},
      {text: '$2y=10x-1$', correct: false, why: 'Rearranges to $y=5x-\\frac12$, which has gradient 5.'},
      {text: '$y=5x-7$', correct: false, why: 'Already has gradient 5, so it is parallel to the given line.'}
    ],
    solution_text: 'Parallel lines have equal gradients. The given gradient is 5. Options B, C, and D all simplify to gradient 5, whereas option A has gradient $-5$, so A is not parallel.',
    diagramRequired: false,
    uncertainties: []
  },
  '17302': {
    question_text: 'Which of the following will find the $n$th term of an arithmetic sequence?',
    structure: 'recognise-nth-term-formula-for-arithmetic-sequence',
    meaningfulCase: 'first-term-plus-n-minus-one-common-difference',
    mastery: false,
    options: [
      {text: '$\\frac n2(2a+(n+1)d)$', correct: false, why: 'This has the wrong index offset and resembles a sum expression.'},
      {text: '$\\frac n2(2a+(n-1)d)$', correct: false, why: 'This is a sum-to-n-terms formula, not the nth term.'},
      {text: '$\\frac n2(a+L)$', correct: false, why: 'This is the arithmetic-series sum formula using the last term.'},
      {text: '$a+(n-1)d$', correct: true}
    ],
    solution_text: 'Starting at $a$, the sequence adds the common difference $d$ a total of $n-1$ times to reach its nth term. Therefore $u_n=a+(n-1)d$.',
    diagramRequired: false,
    uncertainties: []
  },
  '180062': {
    question_text: 'Illyes wants to draw a $55^\\circ$ angle at the end of the red line. Where should he place the dash on the protractor?',
    structure: 'read-angle-on-protractor-from-correct-zero-scale',
    meaningfulCase: 'baseline-points-left-use-scale-starting-at-left-zero',
    mastery: false,
    options: [
      {text: 'A', correct: false, why: 'Places the mark near the 45-degree reading rather than 55 degrees.'},
      {text: 'B', correct: true},
      {text: 'C', correct: false, why: 'Reads the scale from the wrong end of the protractor.'},
      {text: 'D', correct: false, why: 'Places the mark near the supplementary angle on the opposite scale.'}
    ],
    solution_text: 'The red baseline points left, so use the scale whose zero is at the left end. Counting to $55^\\circ$ places the dash at B.',
    diagramRequired: true,
    uncertainties: []
  },
  '30238': {
    question_text: 'The diagram represents a two-stage journey of a particle moving in a straight line. The average speed of the particle is…',
    structure: 'calculate-average-speed-from-position-time-graph',
    meaningfulCase: 'total-distance-over-total-time-with-reversal',
    mastery: false,
    options: [
      {text: '$\\frac67\\,\\mathrm{m\\,s^{-1}}$', correct: false, why: 'Uses net displacement magnitude rather than total distance travelled.'},
      {text: '$\\frac{18}{7}\\,\\mathrm{m\\,s^{-1}}$', correct: true},
      {text: '$\\frac{12}{7}\\,\\mathrm{m\\,s^{-1}}$', correct: false, why: 'Misses one of the two stages when adding the travelled distances.'},
      {text: '$\\frac{36}{7}\\,\\mathrm{m\\,s^{-1}}$', correct: false, why: 'Doubles the total distance before dividing by the journey time.'}
    ],
    solution_text: 'The particle travels $6\\,\\mathrm m$ down and then $12\\,\\mathrm m$ back up, for total distance $18\\,\\mathrm m$. The total time is $7\\,\\mathrm s$, so average speed is $18/7\\,\\mathrm{m\\,s^{-1}}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '31064': {
    question_text: 'Use your calculator to find the value of $\\dfrac{\\sqrt{13\\times6}+3}{0.5\\times4}$.',
    structure: 'evaluate-numerical-expression-with-square-root',
    meaningfulCase: 'apply-order-of-operations-to-radical-fraction',
    mastery: false,
    options: [
      {text: '$4.5$', correct: false, why: 'Uses an incorrect square-root or denominator calculation.'},
      {text: '$9.2$', correct: false, why: 'Fails to divide the complete numerator by the denominator.'},
      {text: '$10.3$', correct: false, why: 'Rounds or evaluates the radical expression inaccurately.'},
      {text: '$5.9$', correct: true}
    ],
    solution_text: '$\\sqrt{13\\times6}=\\sqrt{78}\\approx8.832$, while $0.5\\times4=2$. Therefore the value is $(8.832+3)/2\\approx5.9$.',
    diagramRequired: false,
    uncertainties: []
  },
  '5664': {
    question_text: 'Which graph shows an object which might not be moving backwards?',
    structure: 'interpret-motion-graphs-and-sign-of-velocity',
    meaningfulCase: 'negative-acceleration-does-not-determine-velocity-sign',
    mastery: false,
    options: [
      {text: 'A', correct: false, why: 'The velocity graph is below zero, so the object is moving backwards.'},
      {text: 'B', correct: false, why: 'A decreasing displacement-time graph has negative velocity and shows backward motion.'},
      {text: 'C', correct: true},
      {text: 'D', correct: false, why: 'The velocity graph is negative throughout, so backward motion is explicit.'}
    ],
    solution_text: 'A negative acceleration does not by itself determine whether velocity is positive or negative; the object could still be moving forwards while slowing or speeding. Therefore graph C might not represent backward motion.',
    diagramRequired: true,
    uncertainties: []
  },
  '2955': {
    question_text: 'What is the order of rotational symmetry of this kite-shaped quadrilateral?',
    structure: 'identify-order-of-rotational-symmetry',
    meaningfulCase: 'non-square-kite-matches-only-after-full-turn',
    mastery: false,
    options: [
      {text: '$0$', correct: false, why: 'Every finite shape matches itself after a full turn, so order zero is not used.'},
      {text: '$1$', correct: true},
      {text: '$2$', correct: false, why: 'A half-turn does not map this non-rhombus kite onto itself.'},
      {text: '$4$', correct: false, why: 'Fourfold symmetry belongs to shapes such as a square, not this kite.'}
    ],
    solution_text: 'The kite matches itself only after a complete $360^\\circ$ rotation. Therefore its order of rotational symmetry is $1$.',
    diagramRequired: true,
    uncertainties: []
  },
  '32839': {
    question_text: '$\\dfrac3A=\\dfrac{18}{30}$. What is the value of $A$?',
    structure: 'solve-proportion-with-unknown-denominator',
    meaningfulCase: 'cross-multiply-equivalent-fractions',
    mastery: false,
    options: [
      {text: '$15$', correct: false, why: 'Inverts the ratio or cross-multiplies the known values incorrectly.'},
      {text: '$6$', correct: false, why: 'Does not preserve the equality when substituting into the proportion.'},
      {text: '$5$', correct: true},
      {text: '$180$', correct: false, why: 'Multiplies the numerator and denominator rather than solving for A.'}
    ],
    solution_text: 'Cross-multiply: $3\\times30=18A$. Thus $90=18A$ and $A=5$.',
    diagramRequired: false,
    uncertainties: []
  },
  '35390': {
    question_text: 'The thermometer shows $10^\\circ$. What temperature is $7$ degrees colder?',
    structure: 'subtract-temperature-change-from-positive-value',
    meaningfulCase: 'decrease-by-seven-from-ten',
    mastery: false,
    options: [
      {text: '$17^\\circ$', correct: false, why: 'Adds seven instead of moving seven degrees colder.'},
      {text: '$3^\\circ$', correct: true},
      {text: '$7^\\circ$', correct: false, why: 'Uses the size of the change rather than subtracting it from the starting temperature.'},
      {text: 'Not possible', correct: false, why: 'Temperatures below the starting value are possible on the Celsius scale.'}
    ],
    solution_text: '$10-7=3$, so the temperature is $3^\\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '61776': {
    question_text: 'A tally chart shows the types of shoes chosen by 20 people for an egg-and-spoon race. What type of data is this showing?',
    structure: 'classify-categorical-data-as-discrete',
    meaningfulCase: 'shoe-type-categories-counted-by-frequency',
    mastery: false,
    options: [
      {text: 'Tally chart', correct: false, why: 'Describes the display format, not the statistical type of the data.'},
      {text: 'Discrete data', correct: true},
      {text: 'Frequency table', correct: false, why: 'Describes the table structure rather than whether the data are discrete or continuous.'},
      {text: 'Continuous data', correct: false, why: 'Shoe types are separate categories and cannot take every value on a continuum.'}
    ],
    solution_text: 'The data record counts in separate shoe-type categories. These are discrete observations, so the data are discrete.',
    diagramRequired: true,
    uncertainties: []
  },
  '67668': {
    question_text: 'Two pizza boxes are stacked together as shown. Each box is $10\\,\\mathrm{in}$ by $10\\,\\mathrm{in}$ by $3\\,\\mathrm{in}$. What would be the total surface area of these boxes?',
    structure: 'calculate-surface-area-of-stacked-rectangular-prism',
    meaningfulCase: 'treat-stacked-boxes-as-single-10-by-10-by-6-prism',
    mastery: false,
    options: [
      {text: '$320\\,\\mathrm{in^2}$', correct: false, why: 'Omits the exposed top or bottom face when adding surface areas.'},
      {text: '$300\\,\\mathrm{in^2}$', correct: false, why: 'Uses the area of one box or an incorrect combined height.'},
      {text: '$440\\,\\mathrm{in^2}$', correct: true},
      {text: '$600\\,\\mathrm{in^2}$', correct: false, why: 'Adds internal contact faces that are not part of the external surface.'}
    ],
    solution_text: 'When stacked, the boxes form a cuboid $10\\times10\\times6$. Its surface area is $2(10\\cdot10+10\\cdot6+10\\cdot6)=2(100+60+60)=440\\,\\mathrm{in^2}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '99811': {
    question_text: 'Which of these equations cannot be used in vector form? $s=\\frac12(u+v)\\times t$, $s=ut+\\frac12at^2$, $v^2=u^2+2as$, or $v=u+at$?',
    structure: 'identify-scalar-kinematics-equation-not-valid-as-vector-equation',
    meaningfulCase: 'squared-vector-magnitude-equation-is-not-vector-valued',
    mastery: false,
    options: [
      {text: '$s=\\frac12(u+v)\\times t$', correct: false, why: 'This displacement equation can be interpreted with vector quantities.'},
      {text: '$s=ut+\\frac12at^2$', correct: false, why: 'This constant-acceleration displacement equation has a vector analogue.'},
      {text: '$v^2=u^2+2as$', correct: true},
      {text: '$v=u+at$', correct: false, why: 'The velocity update equation is naturally expressed with vectors.'}
    ],
    solution_text: 'The equation $v^2=u^2+2as$ uses squared scalar speeds and scalar displacement. Squaring vectors does not give the required vector equation, so this is the one that cannot be used directly in vector form.',
    diagramRequired: false,
    uncertainties: []
  },
  '5639': {
    question_text: 'You want to find all the points that are the same distance from two towns. What construction do you need?',
    structure: 'identify-locus-equidistant-from-two-points',
    meaningfulCase: 'perpendicular-bisector-is-equidistance-locus',
    mastery: false,
    options: [
      {text: 'Perpendicular bisector', correct: true},
      {text: 'Angle bisector', correct: false, why: 'An angle bisector gives points equidistant from two lines, not two towns.'},
      {text: 'Circle', correct: false, why: 'A circle gives points equidistant from one centre rather than two towns.'},
      {text: 'Parallel line', correct: false, why: 'A parallel line does not generally maintain equal distances from two points.'}
    ],
    solution_text: 'Every point on the perpendicular bisector of the segment joining two towns is equidistant from the towns. Therefore construct the perpendicular bisector.',
    diagramRequired: false,
    uncertainties: []
  },
  '135536': {
    question_text: 'The length of the horizontal line is equal to the radius of the two arcs. If you join up the three dots with straight lines, you will get…',
    structure: 'recognise-equilateral-triangle-from-compass-arcs',
    meaningfulCase: 'three-equal-side-lengths-from-equal-radius-arcs',
    mastery: false,
    options: [
      {text: 'a scalene triangle', correct: false, why: 'The construction gives all three sides the same length.'},
      {text: 'an equilateral triangle', correct: true},
      {text: 'a right-angled triangle', correct: false, why: 'No right angle is produced by the equal-radius arc construction.'},
      {text: 'an isosceles triangle', correct: false, why: 'The construction is stronger than isosceles: all three sides are equal.'}
    ],
    solution_text: 'Each arc has the same radius as the horizontal base, so the two upper dots are each the same distance from both base endpoints. Joining the three dots gives three equal sides, an equilateral triangle.',
    diagramRequired: true,
    uncertainties: []
  },
  '2820': {
    question_text: 'What are the coordinates of the marked point in the three-dimensional diagram?',
    structure: 'read-point-coordinates-from-three-dimensional-axes',
    meaningfulCase: 'combine-x-y-z-coordinates-at-cuboid-vertex',
    mastery: false,
    options: [
      {text: '$(5,6,0)$', correct: false, why: 'Places the height coordinate in the y-position and omits the z-height.'},
      {text: '$(0,5,6)$', correct: false, why: 'Sets x to zero even though the point is displaced along the x-axis.'},
      {text: '$(6,0,5)$', correct: false, why: 'Interchanges the x and z coordinates of the marked vertex.'},
      {text: '$(5,0,6)$', correct: true}
    ],
    solution_text: 'Reading the marked vertex along the axes gives $x=5$, $y=0$, and $z=6$. Therefore its coordinates are $(5,0,6)$.',
    diagramRequired: true,
    uncertainties: []
  },
  '23265': {
    question_text: '$\\mathbf e=\\begin{pmatrix}-4\\\\9\\end{pmatrix}$ and $\\mathbf f=\\begin{pmatrix}-3\\\\4\\end{pmatrix}$. Work out the vector $\\mathbf e-2\\mathbf f$.',
    structure: 'subtract-twice-a-vector-from-another-vector',
    meaningfulCase: 'componentwise-scalar-multiplication-and-subtraction',
    mastery: false,
    options: [
      {text: '$\\begin{pmatrix}10\\\\-1\\end{pmatrix}$', correct: false, why: 'Uses incorrect signs when subtracting twice the second vector.'},
      {text: '$\\begin{pmatrix}-10\\\\1\\end{pmatrix}$', correct: false, why: 'Adds the doubled vector in the wrong direction.'},
      {text: '$\\begin{pmatrix}2\\\\1\\end{pmatrix}$', correct: true},
      {text: '$\\begin{pmatrix}2\\\\-1\\end{pmatrix}$', correct: false, why: 'Calculates the second component with the wrong subtraction sign.'}
    ],
    solution_text: '$2\\mathbf f=\\begin{pmatrix}-6\\\\8\\end{pmatrix}$. Hence $\\mathbf e-2\\mathbf f=\\begin{pmatrix}-4\\\\9\\end{pmatrix}-\\begin{pmatrix}-6\\\\8\\end{pmatrix}=\\begin{pmatrix}2\\\\1\\end{pmatrix}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '119558': {
    question_text: 'If $Q$ is at $(-3,2)$ and $\\overrightarrow{PQ}=\\begin{pmatrix}1\\\\3\\end{pmatrix}$, then $P$ is at…',
    structure: 'recover-initial-point-from-position-vector',
    meaningfulCase: 'subtract-displacement-vector-from-terminal-point',
    mastery: false,
    options: [
      {text: '$(-4,-1)$', correct: true},
      {text: '$(-2,5)$', correct: false, why: 'Adds the displacement to Q instead of subtracting it to recover P.'},
      {text: '$(4,1)$', correct: false, why: 'Reverses both coordinate signs rather than applying the vector relation.'},
      {text: '$(0,0)$', correct: false, why: 'Assumes the starting point is the origin without using the given displacement.'}
    ],
    solution_text: '$\\overrightarrow{PQ}=Q-P$, so $P=Q-\\overrightarrow{PQ}=(-3,2)-(1,3)=(-4,-1)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '135651': {
    question_text: 'Use the graph to approximate the solution to $x^2-x-6<-4$.',
    structure: 'solve-quadratic-inequality-from-graph',
    meaningfulCase: 'parabola-below-horizontal-level-between-intersections',
    mastery: false,
    options: [
      {text: '$x<-1, x>2$', correct: false, why: 'Selects the outside regions where the parabola is above the comparison level.'},
      {text: '$-1<x<2$', correct: true},
      {text: '$-2<x<3$', correct: false, why: 'Uses the roots of the original quadratic rather than intersections with y=-4.'},
      {text: '$x=2$', correct: false, why: 'Gives only one boundary value instead of the interval satisfying the strict inequality.'}
    ],
    solution_text: 'The graph meets $y=-4$ at approximately $x=-1$ and $x=2$. The parabola lies below $-4$ between these intersections, so the solution is $-1<x<2$.',
    diagramRequired: true,
    uncertainties: []
  },
  '17299': {
    question_text: 'The definition gives $x_1=4$ and $x_{n+1}=2x_n-5$. Which sequence does it define?',
    structure: 'generate-sequence-from-first-order-recurrence',
    meaningfulCase: 'iterate-linear-recurrence-from-initial-term',
    mastery: false,
    options: [
      {text: '$4,3,1,-3,\\ldots$', correct: true},
      {text: '$4,6,8,10,\\ldots$', correct: false, why: 'Uses a constant positive difference rather than the stated recurrence.'},
      {text: '$-3,-1,1,3,\\ldots$', correct: false, why: 'Starts from the wrong initial term and uses a different pattern.'},
      {text: '$4,5,7,9,\\ldots$', correct: false, why: 'Adds increasing values instead of applying $x_{n+1}=2x_n-5$.'}
    ],
    solution_text: 'Starting with $x_1=4$, $x_2=2(4)-5=3$, $x_3=2(3)-5=1$, and $x_4=2(1)-5=-3$. Thus the sequence is $4,3,1,-3,\\ldots$.',
    diagramRequired: false,
    uncertainties: ['The recurrence subscripts are small in the source image; the transcription follows the sequence-consistent reading $x_{n+1}=2x_n-5$.']
  },
  '41089': {
    question_text: 'Rationalise the denominator: $\\dfrac1{\\sqrt3+1}$.',
    structure: 'rationalise-surds-denominator-using-conjugate',
    meaningfulCase: 'conjugate-product-gives-integer-denominator',
    mastery: false,
    options: [
      {text: '$\\dfrac{\\sqrt3-1}{2}$', correct: true},
      {text: '$\\dfrac{\\sqrt3-1}{4}$', correct: false, why: 'Uses the wrong denominator after multiplying by the conjugate.'},
      {text: '$\\dfrac{\\sqrt3+1}{2}$', correct: false, why: 'Does not use the conjugate, so the radical remains in the denominator.'},
      {text: '$\\dfrac{\\sqrt3+1}{4}$', correct: false, why: 'Uses the original numerator and an incorrect denominator.'}
    ],
    solution_text: '$\\dfrac1{\\sqrt3+1}\\times\\dfrac{\\sqrt3-1}{\\sqrt3-1}=\\dfrac{\\sqrt3-1}{3-1}=\\dfrac{\\sqrt3-1}{2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '83762': {
    question_text: 'This is the graph of $y=6-2x$. What are the coordinates of $P$?',
    structure: 'read-y-intercept-from-linear-equation',
    meaningfulCase: 'point-on-y-axis-has-zero-x-coordinate',
    mastery: false,
    options: [
      {text: '$(3,0)$', correct: false, why: 'Gives the x-intercept rather than the point marked on the y-axis.'},
      {text: '$(-2,0)$', correct: false, why: 'Uses an incorrect x-intercept and does not lie on the marked axis point.'},
      {text: '$(0,6)$', correct: true},
      {text: '$(\\frac26,0)$', correct: false, why: 'Confuses the y-intercept with a rearranged x-coordinate expression.'}
    ],
    solution_text: 'Point $P$ lies on the y-axis, so $x=0$. Substituting into $y=6-2x$ gives $y=6$, hence $P=(0,6)$.',
    diagramRequired: true,
    uncertainties: []
  },
  '161586': {
    question_text: '[tikz]\n\\begin{tikzpicture}[xscale=0.55,yscale=0.35]\\draw[->] (0,0)--(9,0) node[right] {time};\\draw[->] (0,0)--(0,7) node[above] {distance from home (km)};\\draw[thick,blue] (0,0)--(3,6)--(5,6)--(9,1);\\end{tikzpicture}\n[/tikz]\nThis distance-time graph shows the first $45$ minutes of Jane’s morning run. How far was Jane from home at $10{:}30$?',
    structure: 'read-distance-at-time-from-distance-time-graph',
    meaningfulCase: 'interpolate-graph-value-at-specified-time',
    mastery: false,
    options: [
      {text: '$7\\,\\mathrm{km}$', correct: false, why: 'Reads the maximum distance rather than the value at 10:30.'},
      {text: '$1\\,\\mathrm{km}$', correct: false, why: 'Reads the later endpoint near 10:45 instead of 10:30.'},
      {text: '$4.5\\,\\mathrm{km}$', correct: false, why: 'Misreads the descending line at the half-hour mark.'},
      {text: '$5\\,\\mathrm{km}$', correct: true}
    ],
    solution_text: 'Locate $10{:}30$ on the horizontal axis and read vertically to the graph. The distance coordinate is $5\\,\\mathrm{km}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '81537': {
    question_text: 'The gradient of the tangent to $y=6x^2-2x$ at $x=2$ is…',
    structure: 'differentiate-quadratic-and-evaluate-gradient',
    meaningfulCase: 'gradient-at-positive-x-value',
    mastery: false,
    options: [
      {text: '$22$', correct: true},
      {text: '$-\\frac1{22}$', correct: false, why: 'Uses the negative reciprocal, which would be the normal gradient.'},
      {text: '$20$', correct: false, why: 'Differentiates the quadratic term but omits the derivative of the linear term.'},
      {text: '$-\\frac1{20}$', correct: false, why: 'Combines an incorrect tangent gradient with a normal-gradient operation.'}
    ],
    solution_text: 'Differentiating gives $\\dfrac{dy}{dx}=12x-2$. At $x=2$, the gradient is $12(2)-2=22$.',
    diagramRequired: false,
    uncertainties: []
  },
  '81730': {
    question_text: '$y=2x^2(3+x)$. What are the coordinates of the minimum point of the above curve?',
    structure: 'find-minimum-of-cubic-by-stationary-points',
    meaningfulCase: 'stationary-point-at-origin-is-local-minimum',
    mastery: false,
    options: [
      {text: '$(0,0)$', correct: true},
      {text: '$(0,-3)$', correct: false, why: 'Uses the constant inside the bracket as the y-coordinate.'},
      {text: '$(-3,0)$', correct: false, why: 'Confuses the root $x=-3$ with the minimum point.'},
      {text: 'There is no minimum point', correct: false, why: 'The derivative changes from negative to positive at the origin.'}
    ],
    solution_text: 'Expand to $y=2x^3+6x^2$. Then $y\'=6x^2+12x=6x(x+2)$, giving stationary points $x=0$ and $x=-2$. The derivative changes from negative to positive at $x=0$, and $y(0)=0$, so the minimum is $(0,0)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '98705': {
    question_text: 'Given that $(x-2)$ and $(x+3)$ are factors of $f(x)$, where $f(x)=3x^3+2x^2+cx+d$, find the values of $c$ and $d$.',
    structure: 'use-factor-theorem-to-find-two-coefficients',
    meaningfulCase: 'two-known-roots-give-two-linear-equations',
    mastery: false,
    options: [
      {text: '$c=19,d=35$', correct: false, why: 'Uses incorrect signs when substituting the two roots.'},
      {text: '$c=-19,d=-3$', correct: false, why: 'Solves the coefficient equations with an incorrect constant term.'},
      {text: '$c=23,d=31$', correct: false, why: 'Does not satisfy the polynomial equation at both stated roots.'},
      {text: '$c=-19,d=6$', correct: true}
    ],
    solution_text: 'Since $2$ is a root, $24+8+2c+d=0$, so $2c+d=-32$. Since $-3$ is a root, $-81+18-3c+d=0$, so $-3c+d=63$. Subtracting gives $c=-19$, then $d=6$.',
    diagramRequired: false,
    uncertainties: []
  },
  '103139': {
    question_text: 'Rewrite $\\sqrt{4-\\frac x2}$ in the form $p(1+qx)^n$.',
    structure: 'factor-constant-from-radical-for-binomial-form',
    meaningfulCase: 'extract-square-root-of-four-and-normalise-inside',
    mastery: false,
    options: [
      {text: '$4(1-2x)^{1/2}$', correct: false, why: 'Uses 4 rather than its square root and scales the x-term incorrectly.'},
      {text: '$2(1-2x)^{1/2}$', correct: false, why: 'Gets the outside factor right but does not divide the inside by 4.'},
      {text: '$4(1-\\frac{x}{8})^{1/2}$', correct: false, why: 'Uses the wrong outside factor even though the inside ratio is correct.'},
      {text: '$2(1-\\frac18x)^{1/2}$', correct: true}
    ],
    solution_text: '$\\sqrt{4-\\frac x2}=\\sqrt{4(1-\\frac{x}{8})}=2(1-\\frac{x}{8})^{1/2}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '178734': {
    question_text: 'Given that a green block represents $r$ and a red block represents $1$, write an equation for a collection containing one green block and three red blocks with total $15$.',
    structure: 'translate-block-model-into-linear-equation',
    meaningfulCase: 'one-unknown-block-value-plus-three-unit-blocks',
    mastery: false,
    options: [
      {text: '$r-3=15$', correct: false, why: 'Subtracts the unit blocks instead of adding their contribution.'},
      {text: '$1+3r=15$', correct: false, why: 'Assigns the value r to the three unit blocks rather than to the green block.'},
      {text: '$3r=15$', correct: false, why: 'Omits the contribution of the three red unit blocks.'},
      {text: '$3+r=15$', correct: true}
    ],
    solution_text: 'The green block contributes $r$ and the three red blocks contribute $1+1+1=3$. Their total is $r+3$, so the equation is $3+r=15$.',
    diagramRequired: true,
    uncertainties: []
  },
  '22817': {
    question_text: 'Each of shapes $P,Q,R,S$ is made from four centimetre cubes. Shape $Z$ contains eight centimetre cubes. Which two shapes can be joined together to make shape $Z$?',
    structure: 'compose-three-dimensional-cube-shapes',
    meaningfulCase: 'match-four-cube-pieces-to-eight-cube-target',
    mastery: false,
    options: [
      {text: '$P$ and $Q$', correct: false, why: 'Their exposed arrangements do not join to form the vertical target shape.'},
      {text: '$P$ and $R$', correct: false, why: 'The combined cube orientations cannot reproduce all eight target positions.'},
      {text: '$R$ and $S$', correct: false, why: 'This pairing leaves the target staircase arrangement unmatched.'},
      {text: '$Q$ and $R$', correct: true}
    ],
    solution_text: 'Each candidate contributes four cubes. Comparing the exposed faces and orientations with the eight-cube target, $Q$ and $R$ fit together to reproduce the vertical stack and the two lower arms.',
    diagramRequired: true,
    uncertainties: ['The small isometric cube drawings make the joining orientation partly implicit; the intended matching pair is Q and R.']
  },
  '2946': {
    question_text: 'How many planes of symmetry does this triangular prism have?',
    structure: 'count-planes-of-symmetry-of-triangular-prism',
    meaningfulCase: 'isosceles-triangular-prism-has-two-reflection-planes',
    mastery: false,
    options: [
      {text: '$1$', correct: false, why: 'Counts only the longitudinal symmetry plane and misses the mid-plane.'},
      {text: '$2$', correct: true},
      {text: '$3$', correct: false, why: 'Adds a reflection plane not present for this non-equilateral triangular prism.'},
      {text: '$4$', correct: false, why: 'Overcounts symmetry planes of the solid.'}
    ],
    solution_text: 'The isosceles triangular prism has one plane running along its length through the symmetry line of the triangular cross-section and one plane halfway along its length. Hence it has two planes of symmetry.',
    diagramRequired: true,
    uncertainties: []
  },
  '66467': {
    question_text: 'Solve $(x+1)(x+2)(x+3)=x^2(x+5)-12$.',
    structure: 'solve-cubic-equation-by-expansion-and-factorisation',
    meaningfulCase: 'cubic-terms-cancel-to-leave-quadratic',
    mastery: false,
    options: [
      {text: '$x=-1, x=-2, x=-3$', correct: false, why: 'Treats each factor on the left as independently equal to zero without balancing the right side.'},
      {text: '$x=-2, x=-9$', correct: true},
      {text: '$x=-6, x=12$', correct: false, why: 'Comes from an incorrect expansion of the product of three linear factors.'},
      {text: '$x=-5, x=12$', correct: false, why: 'Uses the right-hand factor as though it directly supplied the roots.'}
    ],
    solution_text: 'Expanding gives $x^3+6x^2+11x+6=x^3+5x^2-12$. Cancelling $x^3$ and rearranging gives $x^2+11x+18=0=(x+2)(x+9)$, so $x=-2$ or $x=-9$.',
    diagramRequired: false,
    uncertainties: []
  },
  '86454': {
    question_text: 'The vector $\\mathbf u$ has components $\\begin{pmatrix}-3\\\\0\\\\4\\end{pmatrix}$. Which of the following is a unit vector parallel to $\\mathbf u$?',
    structure: 'normalise-three-dimensional-vector',
    meaningfulCase: 'divide-vector-by-magnitude-five',
    mastery: false,
    options: [
      {text: '$-\\frac35\\mathbf i+\\frac45\\mathbf k$', correct: true},
      {text: '$-3\\mathbf i+4\\mathbf k$', correct: false, why: 'Gives the original vector, whose magnitude is 5 rather than 1.'},
      {text: '$-\\frac3{\\sqrt7}\\mathbf i+\\frac4{\\sqrt7}\\mathbf k$', correct: false, why: 'Uses the wrong magnitude to normalise the vector.'},
      {text: '$-\\frac13\\mathbf i+\\frac14\\mathbf k$', correct: false, why: 'Divides components separately instead of dividing by the vector magnitude.'}
    ],
    solution_text: 'The magnitude is $|\\mathbf u|=\\sqrt{(-3)^2+4^2}=5$. Dividing by 5 gives the unit vector $-\\frac35\\mathbf i+\\frac45\\mathbf k$.',
    diagramRequired: false,
    uncertainties: []
  },
  '5661': {
    question_text: '[tikz]\n\\begin{tikzpicture}[xscale=0.6,yscale=0.25]\\draw[->] (0,0)--(8.5,0) node[right] {time / s};\\draw[->] (0,0)--(0,18) node[above] {position / m};\\draw[thick,red] (0,4)--(8,16);\\end{tikzpicture}\n[/tikz]\nThe distance travelled by the particle in $6$ seconds is…',
    structure: 'read-distance-from-position-time-graph',
    meaningfulCase: 'increasing-position-line-distance-is-final-minus-initial',
    mastery: false,
    options: [
      {text: '$8\\,\\mathrm m$', correct: true},
      {text: '$13\\,\\mathrm m$', correct: false, why: 'Reads a position value rather than subtracting the initial position from the final position.'},
      {text: '$9\\,\\mathrm m$', correct: false, why: 'Misreads the graph scale or calculates the change with incorrect endpoints.'},
      {text: '$4\\,\\mathrm m$', correct: false, why: 'Uses the initial position as the distance travelled.'}
    ],
    solution_text: 'At $t=0$ the position is $4\\,\\mathrm m$. At $t=6$ the position is $12\\,\\mathrm m$. The distance travelled is $12-4=8\\,\\mathrm m$.',
    diagramRequired: true,
    uncertainties: []
  },
  '67664': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.6]\\draw[fill=cyan!50] (0,0)--(7,0)--(7,7)--(3,7)--(3,2)--(0,2)--cycle;\\node[below] at (3.5,0) {$7\\,\\mathrm{cm}$};\\node[right] at (7,3.5) {$7\\,\\mathrm{cm}$};\\node[above] at (1.5,2) {$3\\,\\mathrm{cm}$};\\node[left] at (0,1) {$2\\,\\mathrm{cm}$};\\end{tikzpicture}\n[/tikz]\nWhat is the perimeter of this shape?',
    structure: 'calculate-perimeter-of-rectilinear-composite-shape',
    meaningfulCase: 'infer-unlabelled-step-lengths-by-subtraction',
    mastery: false,
    options: [
      {text: '$28\\,\\mathrm{cm}$', correct: true},
      {text: '$19\\,\\mathrm{cm}$', correct: false, why: 'Adds only some labelled sides and omits the internal step edges.'},
      {text: '$24\\,\\mathrm{cm}$', correct: false, why: 'Uses an incorrect estimate for the missing horizontal or vertical lengths.'},
      {text: '$23\\,\\mathrm{cm}$', correct: false, why: 'Fails to include every boundary segment of the L-shaped polygon.'}
    ],
    solution_text: 'The missing horizontal edge is $7-3=4\\,\\mathrm{cm}$ and the missing vertical edge is $7-2=5\\,\\mathrm{cm}$. The perimeter is $7+7+4+5+3+2=28\\,\\mathrm{cm}$.',
    diagramRequired: true,
    uncertainties: []
  },
  '127044': {
    question_text: 'Which statement is true?',
    structure: 'recall-basic-logarithmic-derivative',
    meaningfulCase: 'derivative-of-natural-logarithm',
    mastery: false,
    options: [
      {text: '$\\dfrac{d}{dx}(\\frac1x)=\\ln x$', correct: false, why: 'The derivative of one over x is negative one over x squared.'},
      {text: '$\\dfrac{d}{dx}(\\ln x)=\\frac1x$', correct: true},
      {text: '$\\dfrac{d}{dx}(\\ln x)=\\frac1{\\ln x}$', correct: false, why: 'Confuses the derivative of logarithm with its reciprocal value.'},
      {text: '$\\dfrac{d}{dx}(\\frac1x)=\\frac1{\\ln x}$', correct: false, why: 'Assigns an unrelated logarithmic expression to the reciprocal derivative.'}
    ],
    solution_text: 'The standard derivative rule is $\\dfrac{d}{dx}(\\ln x)=\\dfrac1x$, so statement B is true.',
    diagramRequired: false,
    uncertainties: []
  },
  '11162': {
    question_text: 'Find a correct form of $f\'(x)$ if $f(x)=\\sin^2(x^3)$.',
    structure: 'differentiate-trigonometric-composite-square',
    meaningfulCase: 'chain-rule-with-double-angle-identity',
    mastery: false,
    options: [
      {text: '$6x^2\\sin^2(2x^3)$', correct: false, why: 'Misapplies both the power and trigonometric chain rules.'},
      {text: '$-3x^2\\sin(2x^3)$', correct: false, why: 'Uses an incorrect negative sign and misses the correct chain-rule factor.'},
      {text: '$3x^2\\sin(2x^3)$', correct: true},
      {text: '$-6x^2\\sin(2x^3)$', correct: false, why: 'Uses the wrong sign and doubles the required coefficient.'}
    ],
    solution_text: 'Differentiating gives $2\\sin(x^3)\\cos(x^3)\\times3x^2=6x^2\\sin(x^3)\\cos(x^3)$. Using $2\\sin u\\cos u=\\sin(2u)$ gives $f\'(x)=3x^2\\sin(2x^3)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '29157': {
    question_text: 'Identify the graph (in degrees).',
    structure: 'match-sine-graph-amplitude-and-period',
    meaningfulCase: 'amplitude-three-period-ninety-degrees',
    mastery: false,
    options: [
      {text: '$y=4\\sin(3x)$', correct: false, why: 'Has the wrong amplitude and a longer period than the plotted graph.'},
      {text: '$y=3\\sin(2x)$', correct: false, why: 'Matches the amplitude but its period would be 180 degrees.'},
      {text: '$y=3\\sin(4x)$', correct: true},
      {text: '$y=6\\sin(4x)$', correct: false, why: 'Matches the frequency but has twice the plotted amplitude.'}
    ],
    solution_text: 'The graph has amplitude $3$. Consecutive peaks are about $90^\\circ$ apart, so the period is $90^\\circ$. For $y=a\\sin(bx)$, the period is $360^\\circ/b$, giving $b=4$. Hence $y=3\\sin(4x)$.',
    diagramRequired: true,
    uncertainties: []
  },
  '154133': {
    question_text: '$f(x)=5x^3+3x^2-25x+7$. Below is a student’s attempt to divide $f(x)$ by $(x-2)$. The student made one mistake. In which section is the mistake?',
    structure: 'identify-error-in-polynomial-long-division',
    meaningfulCase: 'subtraction-of-product-by-divisor-in-successive-quotient-step',
    mastery: false,
    options: [
      {text: 'A', correct: false, why: 'The first quotient term and subtraction of $5x^3-10x^2$ are correct.'},
      {text: 'B', correct: false, why: 'The second quotient term correctly produces $13x^2-26x$.'},
      {text: 'C', correct: true},
      {text: 'D', correct: false, why: 'The final remainder follows from the preceding corrected subtraction.'}
    ],
    solution_text: 'After the first two steps the remainder is $x+7$. Multiplying the next quotient term $1$ by $(x-2)$ gives $x-2$, not $x+2$. Thus the error is in section C.',
    diagramRequired: true,
    uncertainties: []
  },
  '154478': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.55]\\draw[->] (-6.5,0)--(6.5,0) node[right] {$x$};\\draw[->] (0,-6.5)--(0,6.5) node[above] {$y$};\\node[fill=orange!80,circle] at (0,2) {$B$};\\node[fill=violet!70,circle] at (2,2) {$D$};\\node[fill=red!75,circle] at (2,0) {$A$};\\node[fill=green!65!black,circle] at (0,-2) {$C$};\\end{tikzpicture}\n[/tikz]\nWhich dot shows the point $(0,2)$?',
    structure: 'read-ordered-pair-from-coordinate-grid',
    meaningfulCase: 'zero-horizontal-coordinate-on-y-axis',
    mastery: false,
    options: [
      {text: '$A$', correct: false, why: 'Point A has a positive x-coordinate and lies on the x-axis.'},
      {text: '$B$', correct: true},
      {text: '$C$', correct: false, why: 'Point C has the correct x-coordinate but a negative y-coordinate.'},
      {text: '$D$', correct: false, why: 'Point D has y-coordinate 2 but its x-coordinate is 2.'}
    ],
    solution_text: 'The first coordinate is $0$, so the point lies on the $y$-axis. Moving up to $y=2$ identifies point $B$.',
    diagramRequired: true,
    uncertainties: []
  },
  '181039': {
    question_text: 'Which of these is NOT odd?',
    structure: 'classify-quantities-as-odd-or-even-by-counting',
    meaningfulCase: 'even-number-of-pips-versus-odd-pip-arrangements',
    mastery: false,
    options: [
      {text: 'A', correct: false, why: 'The arrangement contains five counters, which is odd.'},
      {text: 'B', correct: true},
      {text: 'C', correct: false, why: 'The arrangement contains nine counters, which is odd.'}
    ],
    solution_text: 'Counting the counters, A has 5 and C has 9, both odd. B has 6 counters, which is even, so B is not odd.',
    diagramRequired: true,
    uncertainties: []
  },
  '20189': {
    question_text: 'The vector $\\mathbf u$ has components $\\begin{pmatrix}-3\\\\0\\\\4\\end{pmatrix}$. Which of the following is a unit vector parallel to $\\mathbf u$?',
    structure: 'normalise-three-dimensional-vector',
    meaningfulCase: 'divide-vector-by-magnitude-five',
    mastery: false,
    options: [
      {text: '$-\\frac35\\mathbf i+\\frac45\\mathbf k$', correct: true},
      {text: '$-3\\mathbf i+4\\mathbf k$', correct: false, why: 'Gives the original vector, whose magnitude is 5 rather than 1.'},
      {text: '$-\\frac3{\\sqrt7}\\mathbf i+\\frac4{\\sqrt7}\\mathbf k$', correct: false, why: 'Uses the wrong magnitude to normalise the vector.'},
      {text: '$-\\frac13\\mathbf i+\\frac14\\mathbf k$', correct: false, why: 'Divides components separately instead of dividing by the vector magnitude.'}
    ],
    solution_text: 'The magnitude is $|\\mathbf u|=\\sqrt{(-3)^2+4^2}=5$. Dividing by 5 gives the unit vector $\\mathbf u/|\\mathbf u|=-\\frac35\\mathbf i+\\frac45\\mathbf k$.',
    diagramRequired: false,
    uncertainties: []
  },
  '3564': {
    question_text: 'A function has been differentiated to give $\\dfrac{dy}{dx}=x^2-3$. What would be the gradient of the normal when $x=4$?',
    structure: 'find-normal-gradient-from-tangent-gradient',
    meaningfulCase: 'negative-reciprocal-of-gradient-at-specified-x',
    mastery: false,
    options: [
      {text: '$-13$', correct: false, why: 'Uses the negative tangent gradient rather than its negative reciprocal.'},
      {text: '$-\\frac1{13}$', correct: true},
      {text: '$2x$', correct: false, why: 'Differentiates the derivative again instead of evaluating the normal gradient.'},
      {text: '$13$', correct: false, why: 'Uses the tangent gradient itself rather than the perpendicular gradient.'}
    ],
    solution_text: 'At $x=4$, the tangent gradient is $4^2-3=13$. The normal gradient is the negative reciprocal, $-1/13$.',
    diagramRequired: false,
    uncertainties: []
  },
  '63144': {
    question_text: 'Which of these is the correct list of integer answers to $x^2<16$?',
    structure: 'solve-strict-quadratic-inequality-over-integers',
    meaningfulCase: 'strict-bounds-exclude-endpoints-plus-or-minus-four',
    mastery: false,
    options: [
      {text: '$0,1,2,3$', correct: false, why: 'Omits the negative integer solutions to the squared inequality.'},
      {text: '$-4,-3,-2,-1,0,1,2,3,4$', correct: false, why: 'Includes the endpoints $-4$ and $4$, which make $x^2=16$.'},
      {text: '$0,1,2,3,4$', correct: false, why: 'Includes 4 and omits all negative integer solutions.'},
      {text: '$-3,-2,-1,0,1,2,3$', correct: true}
    ],
    solution_text: '$x^2<16$ means $|x|<4$, so $-4<x<4$. The integer solutions are $-3,-2,-1,0,1,2,3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '87187': {
    question_text: 'What is the correct derivative of $f(x)=(3x+7)^4$?',
    structure: 'differentiate-composite-power-by-chain-rule',
    meaningfulCase: 'outer-power-rule-times-inner-derivative',
    mastery: false,
    options: [
      {text: '$f\'(x)=4(3x+7)^4$', correct: false, why: 'Differentiates the outer power but leaves the exponent unchanged.'},
      {text: '$f\'(x)=4(3x+7)^3$', correct: false, why: 'Uses the power rule but omits the inner derivative factor of 3.'},
      {text: '$f\'(x)=12(3x+7)^3$', correct: true},
      {text: '$f\'(x)=12(3x+7)^4$', correct: false, why: 'Includes the inner derivative but fails to reduce the outer exponent.'}
    ],
    solution_text: 'By the chain rule, $f\'(x)=4(3x+7)^3\\times3=12(3x+7)^3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '96254': {
    question_text: 'The minimum point of $f(x)$ is $(-6,3)$. What is the minimum point of $3f(x)$?',
    structure: 'transform-minimum-point-under-vertical-scaling',
    meaningfulCase: 'positive-vertical-scale-preserves-x-and-scales-y',
    mastery: false,
    options: [
      {text: '$(-18,3)$', correct: false, why: 'Scales the x-coordinate instead of the function value.'},
      {text: '$(-6,1)$', correct: false, why: 'Divides the minimum y-value rather than multiplying it by 3.'},
      {text: '$(-2,3)$', correct: false, why: 'Changes the x-coordinate without applying the vertical transformation.'},
      {text: '$(-6,9)$', correct: true}
    ],
    solution_text: 'Multiplying a function by positive 3 leaves the x-coordinate of its minimum unchanged and triples its y-coordinate. Thus $(-6,3)$ becomes $(-6,9)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '96265': {
    question_text: 'Which combination of mathematical instruments has been used to draw this $10\\,\\mathrm{cm}$ line and its perpendicular bisector?',
    structure: 'identify-construction-tools-for-perpendicular-bisector',
    meaningfulCase: 'ruler-draws-segment-and-compass-constructs-bisector',
    mastery: false,
    options: [
      {text: 'Protractor and compass', correct: false, why: 'A protractor is unnecessary when the perpendicular is constructed geometrically.'},
      {text: 'Ruler and compass', correct: true},
      {text: 'Ruler, protractor and compass', correct: false, why: 'Uses an additional measuring instrument not required for the construction.'},
      {text: 'Ruler and protractor', correct: false, why: 'A protractor cannot replace the compass arcs used to locate the bisector.'}
    ],
    solution_text: 'A ruler is used to draw the segment, and equal-radius compass arcs from its endpoints locate the perpendicular bisector. Therefore the instruments are a ruler and compass.',
    diagramRequired: true,
    uncertainties: []
  },
  '108138': {
    question_text: 'The table shows the numbers of TVs in the households of students in a class. What is the range for the number of TVs? $\\begin{array}{c|ccccc}\\text{TVs}&0&1&2&3&4\\\\\\hline\\text{Frequency}&2&3&0&5&14\\end{array}$',
    structure: 'calculate-range-from-frequency-table',
    meaningfulCase: 'use-smallest-and-largest-observed-values-not-zero-frequency',
    mastery: false,
    options: [
      {text: '$12$', correct: false, why: 'Uses a frequency total or other table count instead of the observed-value range.'},
      {text: '$3$', correct: false, why: 'Uses the largest value below the maximum rather than the full range.'},
      {text: '$4$', correct: true},
      {text: '$14$', correct: false, why: 'Uses the largest frequency instead of the largest observed number of TVs.'}
    ],
    solution_text: 'The smallest observed TV count is $0$ and the largest is $4$. The range is therefore $4-0=4$. The zero frequency at 2 does not affect the endpoints.',
    diagramRequired: false,
    uncertainties: []
  },
  '85127': {
    question_text: 'Circle the regular polygon below.',
    structure: 'identify-regular-polygon-by-equal-sides-and-angles',
    meaningfulCase: 'square-is-regular-while-other-shapes-are-not',
    mastery: false,
    options: [
      {text: 'A: rectangle', correct: false, why: 'A non-square rectangle has equal angles but not all four sides equal.'},
      {text: 'B: irregular pentagon', correct: false, why: 'Its side lengths and angles are not all equal.'},
      {text: 'C: pentagon', correct: false, why: 'The drawn pentagon is not regular because its sides are unequal.'},
      {text: 'D: square', correct: true}
    ],
    solution_text: 'A regular polygon has all sides and all interior angles equal. The square in option D has four equal sides and four equal right angles.',
    diagramRequired: true,
    uncertainties: ['The pentagon in option C is stylised and its side equality is not perfectly clear at the source resolution; D is the intended regular polygon.']
  },
  '129113': {
    question_text: 'Dave has recorded the number of pets his classmates have in the frequency table. If Dave wanted to work out the total number of pets owned by his classmates, what would be a useful column to include? $\\begin{array}{c|ccccc}\\text{Number of pets}&0&1&2&3&4\\\\\\hline\\text{Frequency}&4&6&3&2&5\\end{array}$',
    structure: 'construct-frequency-table-total-column',
    meaningfulCase: 'multiply-value-by-frequency-to-get-total-contribution',
    mastery: false,
    options: [
      {text: 'Number of pets $\\times$ Frequency', correct: true},
      {text: 'Number of pets $\\div$ Frequency', correct: false, why: 'Division does not give the total contribution of each frequency group.'},
      {text: 'Number of pets $+$ Frequency', correct: false, why: 'Adding the value and frequency does not count all pets in the group.'},
      {text: 'Number of pets $-$ Frequency', correct: false, why: 'Subtracting the frequency does not calculate the group total.'}
    ],
    solution_text: 'For each row, the number of pets contributed is the number per classmate multiplied by the frequency. A column containing $(\\text{number of pets})\\times(\\text{frequency})$ would therefore allow the total to be found by summing the column.',
    diagramRequired: false,
    uncertainties: []
  },
  '132410': {
    question_text: 'For the standard normal distribution, $P(z>$ population mean$)$ is:',
    structure: 'use-normal-distribution-symmetry-at-mean',
    meaningfulCase: 'strictly-above-mean-probability-equals-one-half',
    mastery: false,
    options: [
      {text: 'More than $0.5$', correct: false, why: 'Symmetry places exactly half of the probability on either side.'},
      {text: 'Less than $0.5$', correct: false, why: 'The distribution is symmetric, so the upper half is not smaller.'},
      {text: 'Equal to $0.5$', correct: true},
      {text: '$1$', correct: false, why: 'Only the upper half, not the entire distribution, lies above the mean.'}
    ],
    solution_text: 'The standard normal curve is symmetric about its mean. Therefore the probability of being above the mean is exactly $0.5$.',
    diagramRequired: false,
    uncertainties: []
  },
  '141340': {
    question_text: 'Solve $\\dfrac38\\div4=$',
    structure: 'divide-fraction-by-integer',
    meaningfulCase: 'multiply-by-reciprocal-and-preserve-numerator',
    mastery: false,
    options: [
      {text: '$\\dfrac{12}{8}$', correct: false, why: 'Multiplies by 4 instead of dividing by 4.'},
      {text: '$\\dfrac3{32}$', correct: true},
      {text: '$\\dfrac{1.5}{2}$', correct: false, why: 'Gives an equivalent-looking expression but not the correct simplified result.'},
      {text: '$\\dfrac{12}{32}$', correct: false, why: 'Changes both numerator and denominator instead of multiplying by one quarter.'}
    ],
    solution_text: 'Dividing by $4$ is multiplying by $\\frac14$: $\\frac38\\div4=\\frac38\\times\\frac14=\\frac3{32}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '66532': {
    question_text: 'Find $\\mathbf a\\cdot(\\mathbf b\\times\\mathbf c)$ when $\\mathbf a=\\begin{pmatrix}-2\\\\16\\\\8\\end{pmatrix}$, $\\mathbf b=\\begin{pmatrix}3\\\\6\\\\1\\end{pmatrix}$, and $\\mathbf c=\\begin{pmatrix}-4\\\\2\\\\3\\end{pmatrix}$.',
    structure: 'evaluate-scalar-triple-product',
    meaningfulCase: 'dot-vector-with-cross-product-of-two-vectors',
    mastery: false,
    options: [
      {text: '$\\begin{pmatrix}272\\\\-14\\\\372\\end{pmatrix}$', correct: false, why: 'Returns a vector instead of the scalar triple product.'},
      {text: '$0$', correct: true},
      {text: '$\\begin{pmatrix}-32\\\\-208\\\\240\\end{pmatrix}$', correct: false, why: 'Lists component products without summing them to a scalar.'},
      {text: '$288$', correct: false, why: 'Makes an arithmetic error when combining the three scalar products.'}
    ],
    solution_text: 'First, $\\mathbf b\\times\\mathbf c=(16,-13,30)$. Then $\\mathbf a\\cdot(\\mathbf b\\times\\mathbf c)=(-2)(16)+16(-13)+8(30)=-32-208+240=0$.',
    diagramRequired: false,
    uncertainties: []
  },
  '29007': {
    question_text: '$d$ is inversely proportional to $c$. When $c=124$, $d=50$. Find the value of $d$ when $c=155$.',
    structure: 'solve-inverse-proportion-constant',
    meaningfulCase: 'inverse-relationship-with-product-constant',
    mastery: false,
    options: [
      {text: '$40$', correct: true},
      {text: '$81$', correct: false, why: 'Does not preserve the inverse-proportion product when c changes.'},
      {text: '$6200$', correct: false, why: 'Uses the constant product as the new value instead of dividing by 155.'},
      {text: '$62.5$', correct: false, why: 'Uses an incorrect ratio direction for inverse proportion.'}
    ],
    solution_text: 'For inverse proportion, $cd$ is constant. Thus $124\\times50=6200$, and when $c=155$, $d=6200/155=40$.',
    diagramRequired: false,
    uncertainties: []
  },
  '66510': {
    question_text: 'Let $\\mathbf a=\\mathbf i+5\\mathbf j+2\\mathbf k$ and $\\mathbf b=-3\\mathbf i+3\\mathbf j-6\\mathbf k$. Which option gives the vector product $\\mathbf a\\times\\mathbf b$?',
    structure: 'calculate-three-dimensional-vector-cross-product',
    meaningfulCase: 'cross-product-components-from-determinant',
    mastery: false,
    options: [
      {text: '$0$', correct: false, why: 'The vectors are not parallel, so their cross product is not zero.'},
      {text: '$0\\mathbf i+0\\mathbf j+0\\mathbf k$', correct: false, why: 'Incorrectly treats the nonparallel vectors as producing a zero vector.'},
      {text: '$-36\\mathbf i+0\\mathbf j+18\\mathbf k$', correct: true},
      {text: '$18\\mathbf i+36\\mathbf j+0\\mathbf k$', correct: false, why: 'Has sign and component errors in evaluating the cross-product determinant.'}
    ],
    solution_text: '$\\mathbf a\\times\\mathbf b=\\begin{vmatrix}\\mathbf i&\\mathbf j&\\mathbf k\\\\1&5&2\\\\-3&3&-6\\end{vmatrix}=(-36)\\mathbf i+0\\mathbf j+18\\mathbf k$.',
    diagramRequired: false,
    uncertainties: []
  },
  '84040': {
    question_text: 'The test scores of students in Class 1 have a range of $26$. The test scores of students in Class 2 have a range of $34$. This means that…',
    structure: 'interpret-range-as-measure-of-consistency',
    meaningfulCase: 'smaller-range-means-less-score-spread',
    mastery: false,
    options: [
      {text: 'The test scores of students in Class 1 are less consistent', correct: false, why: 'A larger range, not a smaller one, indicates greater spread and less consistency.'},
      {text: 'Students in Class 1 had better test scores on average', correct: false, why: 'Range gives no information about which class has the higher mean.'},
      {text: 'The test scores of students in Class 1 are more consistent', correct: true},
      {text: 'Students in Class 2 had better test scores on average', correct: false, why: 'Range compares spread and cannot determine average performance.'}
    ],
    solution_text: 'Range measures the distance between the largest and smallest score. Class 1 has the smaller range, $26$ compared with $34$, so its scores are more consistent. The ranges do not determine either class mean.',
    diagramRequired: false,
    uncertainties: []
  },
  '84755': {
    question_text: 'Use de Moivre’s theorem to show that $\\cos^5\\theta=p\\cos5\\theta+q\\cos3\\theta+r\\cos\\theta$, where $p,q,r$ are rational numbers. Which is the correct solution?',
    structure: 'expand-power-of-cosine-using-de-moivre',
    meaningfulCase: 'cosine-fifth-power-multiple-angle-expansion',
    mastery: false,
    options: [
      {text: '$p=1,q=5,r=10$', correct: false, why: 'Omits the common factor of one sixteenth from every coefficient.'},
      {text: '$p=\\frac1{32},q=\\frac5{32},r=\\frac5{16}$', correct: false, why: 'Uses coefficients half as large as the correct multiple-angle expansion.'},
      {text: '$p=\\frac1{16},q=\\frac5{16},r=\\frac58$', correct: true},
      {text: 'None of the above', correct: false, why: 'The standard expansion gives the coefficient set shown in option C.'}
    ],
    solution_text: 'The multiple-angle identity is $\\cos^5\\theta=\\frac1{16}\\cos5\\theta+\\frac5{16}\\cos3\\theta+\\frac{10}{16}\\cos\\theta$. Since $10/16=5/8$, $p=1/16$, $q=5/16$, and $r=5/8$.',
    diagramRequired: false,
    uncertainties: []
  },
  '152195': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.7]\\draw[dashed] (0,0)--(4,0) node[right] {$P$};\\draw[->,thick] (0,0)--(2.5,1.8) node[above] {$9\\,\\mathrm N$};\\draw[->,thick] (0,0)--(2.5,-1.2) node[below] {$3\\,\\mathrm N$};\\node at (1.2,0.35) {$25^\\circ$};\\node at (1.2,-0.25) {$35^\\circ$};\\node[above] at (3,0) {$8\\,\\mathrm m$};\\end{tikzpicture}\n[/tikz]\nTwo forces of size $9\\,\\mathrm N$ and $3\\,\\mathrm N$ respectively act about point $P$ as shown. What is the resultant moment about $P$?',
    structure: 'combine-moments-from-two-forces-about-point',
    meaningfulCase: 'opposite-sense-moments-with-oblique-forces',
    mastery: false,
    options: [
      {text: '$16.7\\,\\mathrm{N m}$ clockwise', correct: true},
      {text: '$45.6\\,\\mathrm{N m}$ clockwise', correct: false, why: 'Adds force magnitudes without resolving their perpendicular moment components.'},
      {text: '$16.7\\,\\mathrm{N m}$ anticlockwise', correct: false, why: 'Reverses the net sense of the larger upper-force moment.'},
      {text: '$45.6\\,\\mathrm{N m}$ anticlockwise', correct: false, why: 'Uses the wrong magnitude and the wrong rotational direction.'}
    ],
    solution_text: 'The upper force gives a clockwise moment $9(8)\\sin25^\\circ\\approx30.4\\,\\mathrm{N m}$. The lower force gives an opposing anticlockwise moment $3(8)\\sin35^\\circ\\approx13.8\\,\\mathrm{N m}$. The resultant is $30.4-13.8=16.6\\approx16.7\\,\\mathrm{N m}$ clockwise.',
    diagramRequired: true,
    uncertainties: []
  },
  '124973': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.7]\\draw[->] (-0.5,0)--(2,0);\\draw[->] (0,-0.5)--(0,2.2);\\draw[->,thick,blue] (0,0)--(0.9,1.5) node[above] {$30\\,\\mathrm N$};\\node[left] at (0.2,0.9) {$20^\\circ$};\\end{tikzpicture}\n[/tikz]\nWhat is the vertical component of this force?',
    structure: 'resolve-force-into-vertical-component',
    meaningfulCase: 'angle-measured-from-vertical',
    mastery: false,
    options: [
      {text: '$\\dfrac{\\sin20}{30}$', correct: false, why: 'Divides by the force magnitude rather than finding a component.'},
      {text: '$20\\sin30$', correct: false, why: 'Uses the angle as a magnitude and the wrong trigonometric relationship.'},
      {text: '$30\\cos20$', correct: true},
      {text: '$30\\sin20$', correct: false, why: 'Uses the opposite component even though the angle is measured from vertical.'}
    ],
    solution_text: 'The angle is measured from the vertical, so the vertical component is adjacent to the angle. Therefore $F_y=30\\cos20^\\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '124981': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.75]\\draw (-2,1.5)--(2,1.5);\\draw (-2,1.5)--(0,-0.1)--(2,1.5);\\fill (0,-0.1) circle (3pt);\\node at (-1.1,1.25) {$15^\\circ$};\\node at (1.1,1.25) {$40^\\circ$};\\node[left] at (-0.25,0) {$\\alpha$};\\node[right] at (0.25,0) {$\\beta$};\\end{tikzpicture}\n[/tikz]\nAn object is suspended from two strings as shown in the diagram. What are the values of $\\alpha$ and $\\beta$?',
    structure: 'read-string-angles-from-horizontal-reference',
    meaningfulCase: 'angles-at-object-match-the-given-string-inclinations',
    mastery: false,
    options: [
      {text: '$\\alpha=40,\\beta=15$', correct: false, why: 'Interchanges the inclinations of the left and right strings.'},
      {text: 'Both $40$', correct: false, why: 'Assigns the right-hand angle to both strings.'},
      {text: 'Both $15$', correct: false, why: 'Assigns the left-hand angle to both strings.'},
      {text: '$\\alpha=15,\\beta=40$', correct: true}
    ],
    solution_text: 'The left string makes an angle of $15^\\circ$ with the horizontal, so $\\alpha=15^\\circ$. The right string makes an angle of $40^\\circ$ with the horizontal, so $\\beta=40^\\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '125068': {
    question_text: 'In a normal distribution, what proportion of the data lies above the mean?',
    structure: 'use-symmetry-of-normal-distribution-about-mean',
    meaningfulCase: 'equal-half-probabilities-on-either-side-of-mean',
    mastery: false,
    options: [
      {text: '$\\frac12$', correct: true},
      {text: 'All of it', correct: false, why: 'A normal distribution has values on both sides of its mean.'},
      {text: '$\\frac23$', correct: false, why: 'Confuses the proportion within roughly one standard deviation with the half above the mean.'},
      {text: '$95\\%$', correct: false, why: 'Confuses the central two-standard-deviation proportion with one side of the mean.'}
    ],
    solution_text: 'The normal distribution is symmetric about its mean. Therefore half of the probability lies above the mean, so the proportion is $\\frac12$.',
    diagramRequired: false,
    uncertainties: []
  },
  '15075': {
    question_text: '$P=(-2,4)$ and $Q=(-2,-10)$, with $PR:RQ=4:3$. Which of these is point $R$?',
    structure: 'divide-line-segment-in-given-ratio',
    meaningfulCase: 'internal-section-four-sevenths-from-p-to-q',
    mastery: false,
    options: [
      {text: '$(-2,-2)$', correct: false, why: 'Moves only six units from P instead of the required eight units.'},
      {text: '$(-2,-3)$', correct: false, why: 'Does not divide the vertical separation in the required four-to-three ratio.'},
      {text: '$(-2,-4)$', correct: true},
      {text: '$(-4,-2)$', correct: false, why: 'Changes the x-coordinate even though P and Q have the same x-coordinate.'}
    ],
    solution_text: 'The vector from $P$ to $Q$ is $(0,-14)$. Since $PR$ is $4/7$ of $PQ$, $\\overrightarrow{PR}=(0,-8)$. Hence $R=(-2,4)+(0,-8)=(-2,-4)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '15079': {
    question_text: 'Which of these is the gradient of a line that is perpendicular to the line $y=\\frac52x-1$?',
    structure: 'find-negative-reciprocal-perpendicular-gradient',
    meaningfulCase: 'nonzero-gradient-perpendicular-line',
    mastery: false,
    options: [
      {text: '$\\frac52$', correct: false, why: 'Repeats the original gradient rather than taking its negative reciprocal.'},
      {text: '$-\\frac25$', correct: true},
      {text: '$-\\frac52$', correct: false, why: 'Changes only the sign and does not take the reciprocal.'},
      {text: '$\\frac25$', correct: false, why: 'Takes the reciprocal but fails to change its sign.'}
    ],
    solution_text: 'Perpendicular nonvertical lines have gradients whose product is $-1$. The given gradient is $5/2$, so the perpendicular gradient is $-1/(5/2)=-2/5$.',
    diagramRequired: false,
    uncertainties: []
  },
  '119696': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.65]\\draw[thick] (0,0)--(5,0);\\draw[fill=blue!45] (1,-0.15)--(0.7,-0.8)--(1.3,-0.8)--cycle;\\draw[fill=blue!45] (3,-0.15)--(2.7,-0.8)--(3.3,-0.8)--cycle;\\draw[->,thick] (1,0)--(1,1.3) node[above] {$60\\,\\mathrm N$};\\node[below] at (0.5,0) {$1\\,\\mathrm m$};\\node[below] at (2,0) {$2\\,\\mathrm m$};\\node[below] at (4,0) {$2\\,\\mathrm m$};\\end{tikzpicture}\n[/tikz]\nIf the uniform beam weighs $100\\,\\mathrm N$, what is the reaction at the other support?',
    structure: 'use-vertical-force-equilibrium-for-beam-reaction',
    meaningfulCase: 'known-support-reaction-and-beam-weight-determine-other-reaction',
    mastery: false,
    options: [
      {text: '$60\\,\\mathrm N$', correct: false, why: 'Copies the known support reaction instead of balancing the total vertical forces.'},
      {text: 'Not enough information', correct: false, why: 'The known reaction and beam weight are sufficient for vertical equilibrium.'},
      {text: '$20\\,\\mathrm N$', correct: false, why: 'Subtracts the known reaction incorrectly from the beam weight.'},
      {text: '$40\\,\\mathrm N$', correct: true}
    ],
    solution_text: 'For vertical equilibrium, the two upward reactions must total the beam weight. If one reaction is $60\\,\\mathrm N$, the other is $100-60=40\\,\\mathrm N$.',
    diagramRequired: true,
    uncertainties: []
  },
  '120164': {
    question_text: '$\\displaystyle\\sum_{a=2}^{4}(2a+1)=\\ldots$',
    structure: 'expand-finite-summation-notation',
    meaningfulCase: 'substitute-consecutive-integer-index-values',
    mastery: false,
    options: [
      {text: '$2+3+4$', correct: false, why: 'Adds the index values without evaluating the summand expression.'},
      {text: '$3+5+7$', correct: false, why: 'Uses $a$ rather than $2a+1$ for the first or later terms.'},
      {text: '$5+7+9$', correct: true},
      {text: '$3$', correct: false, why: 'Treats the summation as a single term instead of three evaluated terms.'}
    ],
    solution_text: 'The index takes the values $2,3,4$. Substituting gives $(2(2)+1)+(2(3)+1)+(2(4)+1)=5+7+9$.',
    diagramRequired: false,
    uncertainties: []
  },
  '121208': {
    question_text: 'A probability distribution is given by $P(X=x)=kx$ for $x=1,2,3,4$. Which equation is false?',
    structure: 'interpret-discrete-probability-mass-function',
    meaningfulCase: 'replace-x-by-specific-supported-value-and-normalise',
    mastery: false,
    options: [
      {text: '$P(X=2)=2k$', correct: false, why: 'Substituting $x=2$ gives exactly $2k$, so this equation is true.'},
      {text: '$P(X=2)=2x$', correct: true},
      {text: '$P(X=0)=0$', correct: false, why: 'The stated rule gives zero at $x=0$, consistent with the expression.'},
      {text: '$k+2k+3k+4k=1$', correct: false, why: 'The probabilities over the four supported values must sum to one.'}
    ],
    solution_text: 'Substituting $x=2$ into $P(X=x)=kx$ gives $P(X=2)=2k$, not $2x$. The other statements correctly describe the mass function or its normalisation, so the false equation is $P(X=2)=2x$.',
    diagramRequired: false,
    uncertainties: []
  },
  '121302': {
    question_text: 'Given that $X\\sim B(7,0.25)$, what is $P(X=5)$?',
    structure: 'evaluate-binomial-point-probability',
    meaningfulCase: 'five-successes-in-seven-trials-with-quarter-success-probability',
    mastery: false,
    options: [
      {text: '$0.999$', correct: false, why: 'Treats the requested point probability as though it were almost certain.'},
      {text: '$0.0129$', correct: false, why: 'Uses an inaccurate combination or power in the binomial calculation.'},
      {text: '$0.000977$', correct: false, why: 'Omits the combinatorial factor and the probability of the two failures.'},
      {text: '$0.0115$', correct: true}
    ],
    solution_text: '$P(X=5)=\\binom75(0.25)^5(0.75)^2=21(0.25)^5(0.75)^2\\approx0.0115$.',
    diagramRequired: false,
    uncertainties: []
  },
  '121860': {
    question_text: 'A $10\\,\\mathrm{kg}$ object and a $5\\,\\mathrm{kg}$ object push off against each other with no other forces acting. If the $10\\,\\mathrm{kg}$ object has acceleration $4\\,\\mathrm{m\\,s^{-2}}$, what is the magnitude of the acceleration of the $5\\,\\mathrm{kg}$ object?',
    structure: 'use-newtons-third-law-to-compare-recoil-accelerations',
    meaningfulCase: 'equal-interaction-force-gives-inverse-mass-accelerations',
    mastery: false,
    options: [
      {text: '$4\\,\\mathrm{m\\,s^{-2}}$', correct: false, why: 'Assumes both objects have the same acceleration despite different masses.'},
      {text: '$8\\,\\mathrm{m\\,s^{-2}}$', correct: true},
      {text: '$2\\,\\mathrm{m\\,s^{-2}}$', correct: false, why: 'Uses the mass ratio in the wrong direction for the lighter object.'},
      {text: '$0\\,\\mathrm{m\\,s^{-2}}$', correct: false, why: 'Ignores the nonzero interaction force between the two objects.'}
    ],
    solution_text: 'The interaction forces have equal magnitude. For the $10\\,\\mathrm{kg}$ object, $F=ma=10\\times4=40\\,\\mathrm N$. The $5\\,\\mathrm{kg}$ object therefore has acceleration $a=F/m=40/5=8\\,\\mathrm{m\\,s^{-2}}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '11217': {
    question_text: '[tikz]\n\\begin{tikzpicture}[xscale=0.65,yscale=0.45]\\draw[->] (-4,0)--(7,0) node[right] {$x$};\\draw[->] (0,-4)--(0,5) node[above] {$y$};\\draw[thick,green!50!black] (-3,-2)--(0,4);\\draw[thick,violet] (0,0) parabola bend (2,4) (6,8);\\end{tikzpicture}\n[/tikz]\nUsing the diagram, how many solutions are there to the equations $y=2x+4$ and $y^2=8x$?',
    structure: 'count-intersections-of-line-and-parabola',
    meaningfulCase: 'no-real-intersections-means-zero-solutions',
    mastery: false,
    options: [
      {text: '$0$', correct: true},
      {text: '$1$', correct: false, why: 'Assumes the two curves touch even though the graph shows no intersection.'},
      {text: '$2$', correct: false, why: 'Counts possible branches without checking where the line actually meets them.'},
      {text: 'Infinite', correct: false, why: 'A distinct line and parabola cannot share infinitely many points here.'}
    ],
    solution_text: 'The number of solutions equals the number of intersection points. The line and parabola do not meet in the diagram, so there are $0$ real solutions. Algebraically, substitution gives $y^2-4y+16=0$, whose discriminant is negative.',
    diagramRequired: true,
    uncertainties: []
  },
  '11257': {
    question_text: 'Which of the following would correctly calculate the sum to infinity of the sequence $12,4,\\frac43,\\frac13,\\frac1{12},\\ldots$?',
    structure: 'calculate-sum-to-infinity-of-geometric-sequence',
    meaningfulCase: 'first-term-twelve-common-ratio-one-third',
    mastery: false,
    options: [
      {text: '$\\dfrac{12}{\\frac23}$', correct: true},
      {text: '$12\\times(\\frac13)^{n-1}$', correct: false, why: 'Gives the general term rather than the sum to infinity.'},
      {text: '$\\dfrac{12}{\\frac13}$', correct: false, why: 'Divides by the common ratio instead of by one minus the ratio.'},
      {text: '$\\dfrac{\\frac13}{12}$', correct: false, why: 'Reverses the first term and ratio and does not use the sum formula.'}
    ],
    solution_text: 'The sequence is geometric with first term $a=12$ and common ratio $r=\\frac13$. Since $|r|<1$, $S_\\infty=\\dfrac a{1-r}=\\dfrac{12}{1-\\frac13}=\\dfrac{12}{\\frac23}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '11262': {
    question_text: 'Which of the following would be the most useful first step to find $\\displaystyle\\lim_{x\\to4}\\frac{2-\\sqrt{x}}{4-x}$?',
    structure: 'rationalise-conjugate-before-evaluating-limit',
    meaningfulCase: 'zero-over-zero-form-with-radical-numerator',
    mastery: false,
    options: [
      {text: '$\\dfrac{2-\\sqrt{x}}{4-x}\\times\\dfrac{2+\\sqrt{x}}{4+x}$', correct: false, why: 'Uses the wrong denominator partner, so the radical expression is not conjugated.'},
      {text: '$\\dfrac{2-\\sqrt{x}}{4-x}\\times\\dfrac{\\sqrt{x}}{\\sqrt{x}}$', correct: false, why: 'Multiplying by the radical does not remove the subtraction in the numerator.'},
      {text: '$\\dfrac{2-\\sqrt{x}}{4-x}\\times\\dfrac{2+\\sqrt{x}}{2+\\sqrt{x}}$', correct: true},
      {text: '$\\dfrac{2-\\sqrt{x}}{4-x}\\times\\dfrac{4+x}{4+x}$', correct: false, why: 'Multiplying by the denominator expression does not rationalise the numerator.'}
    ],
    solution_text: 'At $x=4$ the expression has the indeterminate form $0/0$. Multiply by the conjugate of the numerator, $\\frac{2+\\sqrt{x}}{2+\\sqrt{x}}$, so that the numerator becomes $4-x$ and can cancel with the denominator.',
    diagramRequired: false,
    uncertainties: []
  },
  '119564': {
    question_text: 'Quina de les següents respostes no és $1/4$?',
    structure: 'recognise-equivalent-representations-of-one-quarter',
    meaningfulCase: 'compare-area-number-line-length-and-multiplication-representations',
    mastery: false,
    options: [
      {text: 'A: one of four equal squares shaded', correct: false, why: 'One shaded part out of four equal parts represents one quarter.'},
      {text: 'B: the marked point one quarter of the way from 0 to 1', correct: false, why: 'The marked point lies halfway between 0 and one-half, so it represents one quarter.'},
      {text: 'C: $3\\,\\mathrm{cm}$ of a $12\\,\\mathrm{cm}$ length', correct: false, why: 'The ratio $3/12$ simplifies to one quarter.'},
      {text: 'D: $8\\times4=32$', correct: true}
    ],
    solution_text: 'The shaded quarter, the point at one quarter on the number line, and $3/12$ all represent $1/4$. The multiplication statement $8\\times4=32$ does not itself state a one-quarter fraction, so D is the intended answer.',
    diagramRequired: true,
    uncertainties: ['Option D can be interpreted as saying that 8 is one quarter of 32, so the intended distinction between the representations is not completely explicit in the source.']
  },
  '119582': {
    question_text: 'The formula for the area enclosed by a polar curve is…',
    structure: 'recall-polar-area-integral-formula',
    meaningfulCase: 'integrate-half-radius-squared-over-angle-interval',
    mastery: false,
    options: [
      {text: '$\\displaystyle\\int_\\alpha^\\beta r^2\\,d\\theta$', correct: false, why: 'Omits the required factor of one half in the polar area formula.'},
      {text: '$\\displaystyle\\int_\\alpha^\\beta\\frac12r^2\\,d\\theta$', correct: true},
      {text: '$\\displaystyle\\int_\\alpha^\\beta r\\,d\\theta$', correct: false, why: 'Uses radius rather than radius squared and omits the one-half factor.'},
      {text: '$\\displaystyle\\int_\\alpha^\\beta\\theta^2\\,dr$', correct: false, why: 'Integrates the wrong variable and uses the angle rather than the polar radius.'}
    ],
    solution_text: 'For a polar curve $r=f(\\theta)$, the area swept from $\\theta=\\alpha$ to $\\theta=\\beta$ is $A=\\frac12\\int_\\alpha^\\beta r^2\\,d\\theta$.',
    diagramRequired: false,
    uncertainties: []
  },
  '121489': {
    question_text: 'Three forces $\\begin{pmatrix}2\\\\1\\end{pmatrix}\\,\\mathrm N$, $\\begin{pmatrix}3\\\\-2\\end{pmatrix}\\,\\mathrm N$, and $\\begin{pmatrix}a\\\\b\\end{pmatrix}\\,\\mathrm N$ act on an object. If the object is in equilibrium then…',
    structure: 'use-vector-equilibrium-to-find-unknown-force',
    meaningfulCase: 'vector-sum-equals-zero-in-two-components',
    mastery: false,
    options: [
      {text: '$a=5, b=-1$', correct: false, why: 'Uses the sum of the known components instead of its negative.'},
      {text: '$a=4, b=4$', correct: false, why: 'Does not cancel either component of the two known forces.'},
      {text: '$a=-5, b=1$', correct: true},
      {text: '$a=0, b=0$', correct: false, why: 'Treats the unknown force as zero despite the nonzero known resultant.'}
    ],
    solution_text: 'The known forces sum to $\\begin{pmatrix}2+3\\\\1-2\\end{pmatrix}=\\begin{pmatrix}5\\\\-1\\end{pmatrix}$. Equilibrium requires the third force to be the negative of this, so $a=-5$ and $b=1$.',
    diagramRequired: false,
    uncertainties: []
  },
  '13206': {
    question_text: 'Evaluate the determinant $\\begin{vmatrix}3&2\\\\4&2\\end{vmatrix}$.',
    structure: 'evaluate-two-by-two-determinant',
    meaningfulCase: 'main-diagonal-product-minus-off-diagonal-product',
    mastery: false,
    options: [
      {text: '$-2$', correct: true},
      {text: '$2$', correct: false, why: 'Reverses the subtraction order in the determinant formula.'},
      {text: '$-14$', correct: false, why: 'Multiplies all four entries rather than using two products.'},
      {text: '$10$', correct: false, why: 'Adds the diagonal products instead of subtracting the cross product.'}
    ],
    solution_text: 'For a $2\\times2$ matrix, the determinant is the product of the main diagonal minus the product of the other diagonal: $3(2)-2(4)=6-8=-2$.',
    diagramRequired: false,
    uncertainties: []
  },
  '132409': {
    question_text: 'One student received a score of $101$ on the mathematics entrance test. The test scores are normally distributed with population mean $80$ and population standard deviation $15$. The $z$ score would be…',
    structure: 'calculate-standard-score-from-mean-and-standard-deviation',
    meaningfulCase: 'score-above-mean-gives-positive-z-value',
    mastery: false,
    options: [
      {text: '$z=1.4$', correct: true},
      {text: '$z=-1.4$', correct: false, why: 'Reverses the sign even though the score is above the population mean.'},
      {text: '$z=1.08$', correct: false, why: 'Uses an incorrect difference or standard deviation in the standardisation.'},
      {text: 'none of these values', correct: false, why: 'The standard score is available directly from the given mean and deviation.'}
    ],
    solution_text: 'Use $z=\\dfrac{x-\\mu}{\\sigma}$. Thus $z=\\dfrac{101-80}{15}=\\dfrac{21}{15}=1.4$.',
    diagramRequired: false,
    uncertainties: []
  },
  '132415': {
    question_text: 'A team researches $350$ people, of whom $287$ could not distinguish between a false company email and a true company email. The sample proportion of people who could not distinguish between them is…',
    structure: 'calculate-sample-proportion-from-frequency',
    meaningfulCase: 'success-count-divided-by-total-sample-size',
    mastery: false,
    options: [
      {text: '$35$', correct: false, why: 'Uses the duration or sample size rather than forming a proportion.'},
      {text: '$287$', correct: false, why: 'Reports the count of people instead of dividing by the total sample.'},
      {text: '$0.82$', correct: true},
      {text: '$0.50$', correct: false, why: 'Uses an arbitrary half rather than the observed count divided by 350.'}
    ],
    solution_text: 'The sample proportion is the number with the characteristic divided by the sample size: $\\hat p=\\dfrac{287}{350}=0.82$ to two decimal places.',
    diagramRequired: false,
    uncertainties: []
  },
  '15996': {
    question_text: 'Which sum cannot be made from the following matrices? $A=\\begin{pmatrix}1&2&3\\\\4&5&6\\end{pmatrix}$, $B=\\begin{pmatrix}1&2\\\\5&6\\end{pmatrix}$ and $D=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$.',
    structure: 'check-matrix-dimensions-before-addition',
    meaningfulCase: 'addition-requires-identical-matrix-orders',
    mastery: false,
    options: [
      {text: '$A+A$', correct: false, why: 'Both matrices have order $2\\times3$, so this sum is defined.'},
      {text: '$B+D$', correct: false, why: 'Both matrices have order $2\\times2$, so their sum is defined.'},
      {text: '$D+A$', correct: true},
      {text: '$B+B$', correct: false, why: 'A matrix can always be added to another matrix of the same order.'}
    ],
    solution_text: 'Matrix addition requires the same dimensions. $A$ is $2\\times3$, while $D$ is $2\\times2$, so $D+A$ is not defined. The other listed sums pair matrices of matching order.',
    diagramRequired: false,
    uncertainties: []
  },
  '14012': {
    question_text: 'The equation $x^2+2x+p=0$ has no real roots. What is the range of values of $p$?',
    structure: 'use-discriminant-to-find-no-real-root-condition',
    meaningfulCase: 'strictly-negative-quadratic-discriminant',
    mastery: false,
    options: [
      {text: '$p<-1$', correct: false, why: 'Uses the wrong direction and threshold for the discriminant inequality.'},
      {text: '$p<0$', correct: false, why: 'Forgets the factor of 4 in the discriminant calculation.'},
      {text: '$p>0$', correct: false, why: 'Requires only a positive constant rather than the actual no-root condition.'},
      {text: '$p>1$', correct: true}
    ],
    solution_text: 'For no real roots, the discriminant must be negative: $2^2-4(1)(p)<0$. Thus $4-4p<0$, so $p>1$.',
    diagramRequired: false,
    uncertainties: []
  },
  '14015': {
    question_text: 'If $x-1$ is a factor of $x^3-6x^2+px-6$, what is the value of $p$?',
    structure: 'apply-factor-theorem-to-find-unknown-coefficient',
    meaningfulCase: 'evaluate-polynomial-at-root-one',
    mastery: false,
    options: [
      {text: '$-6$', correct: false, why: 'Confuses the constant term with the unknown coefficient.'},
      {text: '$-1$', correct: false, why: 'Substitutes incorrectly into the factor theorem equation.'},
      {text: '$1$', correct: false, why: 'Ignores the remaining constant and quadratic terms when solving.'},
      {text: '$11$', correct: true}
    ],
    solution_text: 'If $x-1$ is a factor, the polynomial is zero at $x=1$. Hence $1-6+p-6=0$, giving $p=11$.',
    diagramRequired: false,
    uncertainties: []
  },
  '5659': {
    question_text: '[tikz]\n\\begin{tikzpicture}[xscale=0.55,yscale=0.16]\\draw[->] (0,0)--(10.5,0) node[right] {Time (s)};\\draw[->] (0,0)--(0,27) node[above] {Position (m)};\\draw[thick] (0,0)--(5,25)--(10,25);\\foreach \\x in {0,1,...,10}{\\draw (\\x,0.8)--(\\x,-0.8) node[below,font=\\scriptsize] {\\x};}\\foreach \\y in {0,5,10,15,20,25}{\\draw (0.15,\\y)--(-0.15,\\y) node[left,font=\\scriptsize] {\\y};}\\end{tikzpicture}\n[/tikz]\nLook at the position-time graph. How could you describe the motion between $0$ and $5$ seconds?',
    structure: 'interpret-gradient-of-position-time-graph',
    meaningfulCase: 'constant-positive-gradient-means-constant-speed',
    mastery: false,
    options: [
      {text: 'Accelerating', correct: false, why: 'Acceleration would require the position-time gradient to change.'},
      {text: 'Moving at a constant speed', correct: true},
      {text: 'Travelling uphill', correct: false, why: 'Position-time graphs do not show vertical travel direction as uphill.'},
      {text: 'Running', correct: false, why: 'Describes an activity rather than the measurable motion shown by the graph.'}
    ],
    solution_text: 'Between $0$ and $5$ seconds the graph is a straight line with constant positive gradient. Its gradient is the velocity, so the object moves with constant speed.',
    diagramRequired: true,
    uncertainties: []
  },
  '95440': {
    question_text: 'The points are $A(1,2,1)$, $B(2,1,2)$ and $C(0,1,2)$. Calculate the size of angle $ACB$.',
    structure: 'calculate-3d-angle-using-vector-dot-product',
    meaningfulCase: 'angle-between-ca-and-cb-in-three-dimensions',
    mastery: false,
    options: [
      {text: '$55^\\circ$', correct: true},
      {text: '$42^\\circ$', correct: false, why: 'Uses an incorrect dot product or magnitude when evaluating the angle.'},
      {text: '$71^\\circ$', correct: false, why: 'Confuses the angle at another vertex or miscalculates the vector magnitudes.'},
      {text: '$35^\\circ$', correct: false, why: 'Uses a component angle rather than the angle between the two vectors.'}
    ],
    solution_text: 'The vectors from $C$ are $\\overrightarrow{CA}=(1,1,-1)$ and $\\overrightarrow{CB}=(2,0,0)$. Their dot product is $2$ and their magnitudes are $\\sqrt3$ and $2$. Thus $\\cos\\theta=2/(2\\sqrt3)=1/\\sqrt3$, giving $\\theta\\approx54.7^\\circ$, so $55^\\circ$.',
    diagramRequired: false,
    uncertainties: []
  },
  '102014': {
    question_text: 'A crate of mass $120\\,\\mathrm{kg}$ is going up in a lift of mass $600\\,\\mathrm{kg}$. The tension in the lift cable is $7000\\,\\mathrm N$. The lift is…',
    structure: 'infer-lift-acceleration-from-tension-and-weight',
    meaningfulCase: 'moving-upward-but-net-force-downward-means-decelerating',
    mastery: false,
    options: [
      {text: 'Accelerating', correct: false, why: 'Assumes upward motion automatically means upward acceleration.'},
      {text: 'Decelerating', correct: true},
      {text: 'Moving at a constant speed', correct: false, why: 'The cable tension is not equal to the total weight, so the resultant is nonzero.'},
      {text: 'Stationary', correct: false, why: 'The question states that the lift is going up, so it is not stationary.'}
    ],
    solution_text: 'The total mass is $120+600=720\\,\\mathrm{kg}$, so the total weight is approximately $720g=7056\\,\\mathrm N$. Since the upward tension $7000\\,\\mathrm N$ is less than the weight, the acceleration is downward. Because the lift is moving upward, it is decelerating.',
    diagramRequired: false,
    uncertainties: []
  },
  '11230': {
    question_text: 'The probability of getting Heads on a biased coin is $0.7$. The coin is tossed five times. Which of the following correctly calculates the probability of getting exactly two Heads?',
    structure: 'form-binomial-probability-expression',
    meaningfulCase: 'exactly-two-successes-in-five-biased-trials',
    mastery: false,
    options: [
      {text: '$\\binom52(0.7)^2(0.3)^3$', correct: true},
      {text: '$\\binom53(0.7)^3(0.3)^2$', correct: false, why: 'Uses three Heads and two Tails rather than the requested two Heads.'},
      {text: '$\\binom25(0.7)^2(0.3)^3$', correct: false, why: 'Reverses the binomial coefficient and uses an invalid choice count.'},
      {text: '$\\binom52(0.7)^5(0.3)^5$', correct: false, why: 'Raises both probabilities to five and therefore counts ten trials.'}
    ],
    solution_text: 'For exactly two Heads in five tosses, choose the two Head positions in $\\binom52$ ways. Each arrangement has probability $(0.7)^2(0.3)^3$, so the required expression is $\\binom52(0.7)^2(0.3)^3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '11233': {
    question_text: 'A biased coin has a probability of landing on Tails of $0.25$. This coin is tossed $6$ times. Which diagram represents the probability distribution of Tails?',
    structure: 'recognise-binomial-probability-distribution-shape',
    meaningfulCase: 'right-skewed-count-distribution-with-p-zero-point-two-five',
    mastery: false,
    options: [
      {text: 'Diagram A', correct: true},
      {text: 'Diagram B', correct: false, why: 'Shows a distribution centred near three tails, suggesting probability one half.'},
      {text: 'Diagram C', correct: false, why: 'Places the highest probabilities at many tails, opposite to a quarter-tail coin.'},
      {text: 'Diagram D', correct: false, why: 'Shows an almost uniform distribution rather than a binomial distribution.'}
    ],
    solution_text: 'Let $X$ be the number of Tails. Then $X\\sim\\operatorname{Bin}(6,0.25)$, whose mean is $6(0.25)=1.5$. The distribution is right-skewed with its largest probabilities at one and two tails and rapidly decreasing thereafter. This is diagram A.',
    diagramRequired: true,
    uncertainties: []
  },
  '121475': {
    question_text: 'What is the weight of an object which has a mass of $10\\,\\mathrm{kg}$?',
    structure: 'calculate-weight-from-mass',
    meaningfulCase: 'convert-mass-to-force-using-g',
    mastery: false,
    options: [
      {text: '$98\\,\\mathrm N$', correct: true},
      {text: '$1.0\\,\\mathrm N$', correct: false, why: 'Divides by gravitational acceleration instead of multiplying mass by it.'},
      {text: '$98\\,\\mathrm{kg}$', correct: false, why: 'Uses the correct numerical calculation but gives the mass unit rather than force.'},
      {text: '$1.0\\,\\mathrm{kg}$', correct: false, why: 'Confuses mass and weight and also gives an incorrect numerical value.'}
    ],
    solution_text: 'Weight is force due to gravity, so $W=mg$. Using $g=9.8\\,\\mathrm{m\\,s^{-2}}$, $W=10\\times9.8=98\\,\\mathrm N$.',
    diagramRequired: false,
    uncertainties: []
  },
  '122061': {
    question_text: 'The equation $2x^3+x^2-1=0$ has exactly one real root. Using the Newton–Raphson formula $x_{n+1}=\\dfrac{4x_n^3+x_n^2+1}{6x_n^2+2x_n}$ with $x_1=1$, find the values of $x_2$ and $x_3$.',
    structure: 'iterate-newton-raphson-formula',
    meaningfulCase: 'two-iterations-from-initial-value-one',
    mastery: false,
    options: [
      {text: '$\\frac89,\\frac54$', correct: false, why: 'Makes arithmetic errors in both successive Newton–Raphson substitutions.'},
      {text: '$\\frac23,\\frac54$', correct: false, why: 'Uses an incorrect first iterate and therefore cannot give the stated sequence.'},
      {text: '$\\frac34,\\frac23$', correct: true},
      {text: '$\\frac67,\\frac78$', correct: false, why: 'Does not result from substituting the previous iterate into the formula.'}
    ],
    solution_text: 'With $x_1=1$, $x_2=\\dfrac{4+1+1}{6+2}=\\frac34$. Then $x_3=\\dfrac{4(\\frac34)^3+(\\frac34)^2+1}{6(\\frac34)^2+2(\\frac34)}=\\frac23$.',
    diagramRequired: false,
    uncertainties: []
  },
  '124972': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.7]\\draw[->] (-1,0)--(2.5,0) node[right] {$x$};\\draw[->] (0,-1)--(0,2) node[above] {$y$};\\draw[->,thick,blue] (0,0)--(1.4,1.0) node[above] {$30\\,\\mathrm N$};\\node at (0.75,0.18) {$20^\\circ$};\\end{tikzpicture}\n[/tikz]\nWhat is the vertical component of this force?',
    structure: 'resolve-force-into-vertical-component',
    meaningfulCase: 'angle-measured-from-horizontal',
    mastery: false,
    options: [
      {text: '$\\dfrac{\\sin20}{30}$', correct: false, why: 'Divides by the force magnitude instead of resolving the force.'},
      {text: '$20\\sin30$', correct: false, why: 'Uses the angle as the force magnitude and also uses the wrong angle.'},
      {text: '$30\\cos20$', correct: false, why: 'Gives the horizontal component when the angle is measured from the horizontal.'},
      {text: '$30\\sin20$', correct: true}
    ],
    solution_text: 'The angle is measured from the horizontal, so the vertical component is the opposite side of the resolution triangle: $F_y=30\\sin20^\\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '121213': {
    question_text: 'How many pieces of information are needed in order to fix the parameters in an exponential model?',
    structure: 'identify-number-of-parameters-in-exponential-model',
    meaningfulCase: 'two-unknown-parameters-require-two-independent-pieces',
    mastery: false,
    options: [
      {text: 'One', correct: false, why: 'One condition generally fixes only one relation, not both model parameters.'},
      {text: 'Two', correct: true},
      {text: 'Three', correct: false, why: 'Adds an unnecessary condition when the two model parameters are independent.'},
      {text: 'Four', correct: false, why: 'Uses more information than is needed to determine two parameters.'}
    ],
    solution_text: 'A basic exponential model has two independent parameters, for example $y=ab^x$. Two independent pieces of information are therefore needed to determine $a$ and $b$.',
    diagramRequired: false,
    uncertainties: []
  },
  '121982': {
    question_text: '$x=3t^2$, $y=2^t$.\n\nWhat are the co-ordinates of the point corresponding to a parameter value of $3$?',
    structure: 'evaluate-parametric-equations-at-given-parameter',
    meaningfulCase: 'substitute-positive-parameter-into-both-coordinates',
    mastery: false,
    options: [
      {text: '$(1,\\log_2 3)$', correct: false, why: 'Attempts to reverse the parametric equations instead of substituting $t=3$.'},
      {text: '$(27,8)$', correct: true},
      {text: '$(0,0)$', correct: false, why: 'Uses the origin rather than evaluating either equation at the given parameter.'},
      {text: '$(-1,\\log_2 3)$', correct: false, why: 'Uses a negative parameter and still does not evaluate the given expressions.'}
    ],
    solution_text: 'Substitute $t=3$: $x=3(3)^2=27$ and $y=2^3=8$. Hence the point is $(27,8)$.',
    diagramRequired: false,
    uncertainties: []
  },
  '121984': {
    question_text: '$x=3t^2$, $y=2^t$.\n\nFind the parameter value(s) at the point $(3,2)$.',
    structure: 'solve-parametric-equations-for-parameter',
    meaningfulCase: 'coordinate-consistency-selects-positive-root',
    mastery: false,
    options: [
      {text: '$0$', correct: false, why: 'Does not satisfy either $x=3$ or $y=2$ in the parametric equations.'},
      {text: '$1$', correct: true},
      {text: '$2$', correct: false, why: 'Gives $y=4$ rather than the required second coordinate $y=2$.'},
      {text: '$3$', correct: false, why: 'Gives $x=27$ and $y=8$, not the specified point.'}
    ],
    solution_text: 'From $y=2^t=2$, we get $t=1$. This also gives $x=3(1)^2=3$, so the consistent parameter value is $t=1$.',
    diagramRequired: false,
    uncertainties: []
  },
  '124974': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.7]\\draw[->] (0,0)--(2.4,0) node[right] {$i$};\\draw[->] (0,-1.5)--(0,1.6) node[above] {$j$};\\draw[->,thick,blue] (0,0)--(-1.4,0.9);\\end{tikzpicture}\n[/tikz]\nIf the force below can be written as $p\\mathbf i+q\\mathbf j$ then…',
    structure: 'read-signs-of-vector-components-from-direction',
    meaningfulCase: 'quadrant-two-vector-has-negative-horizontal-positive-vertical-components',
    mastery: false,
    options: [
      {text: '$p$ and $q$ are both positive', correct: false, why: 'Ignores that the vector points left, making its horizontal component negative.'},
      {text: '$p$ is positive, $q$ is negative', correct: false, why: 'Assigns the signs for a vector pointing into the fourth quadrant.'},
      {text: '$p$ is negative, $q$ is positive', correct: true},
      {text: '$p$ and $q$ are both negative', correct: false, why: 'Treats the upward component as negative even though the vector points upward.'}
    ],
    solution_text: 'The vector points left and up. Therefore its coefficient of $\\mathbf i$ is negative, while its coefficient of $\\mathbf j$ is positive: $p<0$ and $q>0$.',
    diagramRequired: true,
    uncertainties: []
  },
  '124978': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.7]\\draw[thick] (-1,0)--(4,0);\\draw[fill=blue!55] (0.3,0)--(0.3,1.2)--(2.2,1.2)--(2.2,0)--cycle;\\draw[->,thick] (2.2,1.2)--(3.6,2.3) node[above] {$20\\,\\mathrm N$};\\node at (2.75,1.35) {$35^\\circ$};\\end{tikzpicture}\n[/tikz]\nThe box has mass $5\\,\\mathrm{kg}$. What is the magnitude of the normal reaction force between the box and the ground?',
    structure: 'resolve-inclined-force-to-find-normal-reaction',
    meaningfulCase: 'upward-force-component-reduces-ground-reaction',
    mastery: false,
    options: [
      {text: '$5g$', correct: false, why: 'Ignores the upward vertical component of the applied force.'},
      {text: '$5g-20\\sin35^\\circ$', correct: true},
      {text: '$5g+20\\sin35^\\circ$', correct: false, why: 'Adds the upward force component to the weight instead of subtracting it.'},
      {text: '$20\\sin35^\\circ$', correct: false, why: 'Uses only the applied force component and omits the box weight.'}
    ],
    solution_text: 'Resolve the applied force vertically: its upward component is $20\\sin35^\\circ$. Vertical equilibrium gives $R+20\\sin35^\\circ=5g$, so $R=5g-20\\sin35^\\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  '125260': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.7]\\draw[thick] (-1,0)--(5,0);\\draw[fill=gray!15] (1,0)--(1,1.2)--(2.8,1.2)--(2.8,0)--cycle;\\node at (1.9,0.6) {$5\\,\\mathrm{kg}$};\\draw[->,thick] (2.8,0.6)--(4.5,0.6) node[above] {$24.5\\,\\mathrm{N}$};\\draw[->,thick] (1,0.35)--(-0.5,0.35) node[above] {$F_r$};\\node[below] at (-0.2,-0.05) {$\\mu=0.5$};\\end{tikzpicture}\n[/tikz]\nWhat happens to the box?',
    structure: 'compare-applied-force-with-limiting-friction',
    meaningfulCase: 'applied-force-equals-maximum-static-friction',
    mastery: false,
    options: [
      {text: 'It moves right', correct: false, why: 'Assumes motion starts when the applied force only reaches the friction limit.'},
      {text: 'It moves left', correct: false, why: 'Reverses the direction of the applied force and ignores the friction balance.'},
      {text: 'It stays still', correct: true},
      {text: 'It moves up', correct: false, why: 'Introduces vertical motion even though the vertical forces are balanced.'}
    ],
    solution_text: 'The normal reaction is $R=5g=49\\,\\mathrm{N}$, so the limiting friction is $\\mu R=0.5\\times49=24.5\\,\\mathrm{N}$. Static friction can match the applied force, so the resultant horizontal force is zero and the box stays still.',
    diagramRequired: true,
    uncertainties: []
  },
  '125776': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.55]\\coordinate (A) at (0,1.5);\\coordinate (B) at (0.2,0);\\coordinate (C) at (3.1,2.8);\\coordinate (D) at (2.8,1.0);\\coordinate (E) at (5.1,1.9);\\coordinate (F) at (7.4,2.8);\\coordinate (G) at (8.1,1.4);\\coordinate (H) at (5.9,0);\\foreach \\u/\\v/\\w in {A/B/31,A/C/30,B/D/24,B/H/38,C/D/22,C/E/24,C/F/29,D/E/18,D/H/34,E/F/28,E/G/26,F/G/21,G/H/33}{\\draw (\\u)--(\\v) node[midway,sloped,above,font=\\scriptsize] {\\w};}\\foreach \\p/\\n in {A/A,B/B,C/C,D/D,E/E,F/F,G/G,H/H}{\\fill (\\p) circle (2pt) node[above right] {\\n};}\\end{tikzpicture}\n[/tikz]\nYou are finding the MST for this network using Prim. Which arc do you select next, after $EG$?',
    structure: 'apply-prims-algorithm-to-select-next-mst-edge',
    meaningfulCase: 'choose-smallest-edge-leaving-current-tree',
    mastery: false,
    options: [
      {text: '$GH$', correct: false, why: 'Chooses a heavier boundary edge instead of the smallest available edge.'},
      {text: '$CE$', correct: false, why: 'This edge joins vertices already in the current tree and would form a cycle.'},
      {text: '$EF$', correct: false, why: 'Overlooks the lighter edge $GF$ when comparing boundary edges.'},
      {text: '$GF$', correct: true}
    ],
    solution_text: 'After $EG$, the vertices already connected by the partial Prim tree include $A,B,C,D,E,G$. The boundary edges include $GF=21$, $EF=28$, $CF=29$, and $GH=33$. The smallest is $GF$, so select $GF$.',
    diagramRequired: true,
    uncertainties: []
  },
  '125778': {
    question_text: '[tikz]\n\\begin{tikzpicture}[scale=0.55]\\coordinate (A) at (0,1.5);\\coordinate (B) at (0.2,0);\\coordinate (C) at (3.1,2.8);\\coordinate (D) at (2.8,1.0);\\coordinate (E) at (5.1,1.9);\\coordinate (F) at (7.4,2.8);\\coordinate (G) at (8.1,1.4);\\coordinate (H) at (5.9,0);\\foreach \\u/\\v/\\w in {A/B/31,A/C/30,B/D/24,B/H/38,C/D/22,C/E/24,C/F/29,D/E/18,D/H/34,E/F/28,E/G/26,F/G/21,G/H/33}{\\draw (\\u)--(\\v) node[midway,sloped,above,font=\\scriptsize] {\\w};}\\foreach \\p/\\n in {A/A,B/B,C/C,D/D,E/E,F/F,G/G,H/H}{\\fill (\\p) circle (2pt) node[above right] {\\n};}\\end{tikzpicture}\n[/tikz]\nYou are finding the MST for this network using Kruskal. Which arc do you select next, after $EG$?',
    structure: 'apply-kruskals-algorithm-to-select-next-mst-edge',
    meaningfulCase: 'choose-next-lightest-edge-that-does-not-cycle',
    mastery: false,
    options: [
      {text: '$EC$', correct: false, why: 'This edge is heavier than already considered edges and would join the same component.'},
      {text: '$GH$', correct: false, why: 'Skips the lighter available edge $AC$ in the increasing-weight order.'},
      {text: '$AC$', correct: true},
      {text: '$BC$', correct: false, why: 'Chooses a much heavier edge instead of the next valid Kruskal edge.'}
    ],
    solution_text: 'Kruskal considers edges in increasing order. After $DE=18$, $GF=21$, $CD=22$, $BD=24$, and $EG=26$, the next edge is $AC=30$. It connects the separate vertex $A$ to the existing component without forming a cycle, so select $AC$.',
    diagramRequired: true,
    uncertainties: []
  },
  '136047': {
    question_text: '$\\mathbf p=\\begin{pmatrix}-4\\\\8\\end{pmatrix}$.\n\n$-\\frac34\\mathbf p=?$',
    structure: 'multiply-two-dimensional-vector-by-scalar',
    meaningfulCase: 'negative-scalar-reverses-signs-of-vector-components',
    mastery: false,
    options: [
      {text: '$\\begin{pmatrix}1\\\\-2\\end{pmatrix}$', correct: false, why: 'Uses a factor of negative one quarter rather than negative three quarters.'},
      {text: '$\\begin{pmatrix}-7\\\\12\\end{pmatrix}$', correct: false, why: 'Adds or subtracts components instead of multiplying each by the scalar.'},
      {text: '$\\begin{pmatrix}-3\\\\6\\end{pmatrix}$', correct: false, why: 'Keeps the signs unchanged and therefore does not apply the negative scalar.'},
      {text: '$\\begin{pmatrix}3\\\\-6\\end{pmatrix}$', correct: true}
    ],
    solution_text: 'Multiply each component by $-\\frac34$: $-\\frac34(-4)=3$ and $-\\frac34(8)=-6$. Therefore $-\\frac34\\mathbf p=\\begin{pmatrix}3\\\\-6\\end{pmatrix}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '14332': {
    question_text: 'A set of data is coded according to the rule $y=4x$ where $x$ is the original data. The mean of the coded data is $12$. What is the mean of the original data?',
    structure: 'invert-linear-coding-rule-for-the-mean',
    meaningfulCase: 'mean-scales-by-constant-coding-factor',
    mastery: false,
    options: [
      {text: '$48$', correct: false, why: 'Multiplies the coded mean by 4 instead of reversing the coding rule.'},
      {text: '$\\frac13$', correct: false, why: 'Divides by 36 rather than dividing the coded mean by the coding factor.'},
      {text: '$3$', correct: true},
      {text: '$16$', correct: false, why: 'Uses an unrelated division and does not undo the factor of 4.'}
    ],
    solution_text: 'A constant multiple scales the mean by the same factor. Thus $12=4\\bar x$, so $\\bar x=12/4=3$.',
    diagramRequired: false,
    uncertainties: []
  },
  '119585': {
    question_text: 'Which formula gives the $y$-coordinate of the centre of mass of a uniform lamina defined by $f(x)$ and the lines $x=a$, $y=0$ and $x=0$?',
    structure: 'find-y-coordinate-centre-of-mass-by-integration',
    meaningfulCase: 'area-under-curve-between-vertical-bounds',
    mastery: false,
    options: [
      {text: '$\\dfrac{\\int_0^a xf(x)\\,dx}{\\int_0^a f(x)\\,dx}$', correct: false, why: 'Uses the first moment for the x-coordinate rather than the y-coordinate.'},
      {text: '$\\dfrac{\\frac12\\int_0^a f(x)\\,dx}{\\int_0^a f(x)\\,dx}$', correct: false, why: 'Cancels the area expression and does not use the required squared height.'},
      {text: '$\\dfrac{\\frac12\\int_0^a (f(x))^2\\,dx}{\\int_0^a f(x)\\,dx}$', correct: true},
      {text: '$\\dfrac{\\frac13\\int_0^a (f(x))^2\\,dx}{\\int_0^a f(x)\\,dx}$', correct: false, why: 'Uses an incorrect one-third factor for the vertical first moment.'}
    ],
    solution_text: 'The area of the lamina is $A=\\int_0^a f(x)\\,dx$. A vertical strip has its centroid at height $f(x)/2$, so its moment about the $x$-axis is $\\frac12 f(x)^2\\,dx$. Therefore $\\bar y=\\dfrac{\\frac12\\int_0^a(f(x))^2\\,dx}{\\int_0^a f(x)\\,dx}$.',
    diagramRequired: false,
    uncertainties: []
  },
  '119701': {
    question_text: 'Which of these data sets has the largest standard deviation?',
    structure: 'compare-standard-deviation-from-data-spread',
    meaningfulCase: 'same-centre-different-dispersion',
    mastery: false,
    options: [
      {text: '$6,6,6,6,6$', correct: false, why: 'All values are identical, so this data set has no spread at all.'},
      {text: '$2,4,6,8,10$', correct: true},
      {text: '$2,6,6,6,10$', correct: false, why: 'Only the two extreme values vary, giving less overall squared spread.'},
      {text: '$10,10,10,10,10$', correct: false, why: 'All values are identical, so its standard deviation is zero.'}
    ],
    solution_text: 'The first and fourth sets have zero spread. The middle values of the other two sets are both $6$, but $2,4,6,8,10$ has deviations $-4,-2,0,2,4$, whereas $2,6,6,6,10$ has deviations $-4,0,0,0,4$. The first set therefore has the larger sum of squared deviations and the largest standard deviation.',
    diagramRequired: false,
    uncertainties: []
  },
  '124106': {
    question_text: 'Dan wants to find out at the $5\\%$ significance level whether a coin is biased against tails. He throws it $200$ times as he has nothing better to do. If $X$ is the number of tails thrown, what is the critical region for the test?',
    structure: 'identify-one-tailed-binomial-critical-region',
    meaningfulCase: 'lower-tail-test-for-fewer-than-expected-tails',
    mastery: false,
    options: [
      {text: '$X\\le 87$', correct: false, why: 'Sets the lower critical boundary too far into the tail for the five-percent test.'},
      {text: '$X\\le 88$', correct: true},
      {text: '$X\\le 89$', correct: false, why: 'Includes an outcome whose lower-tail probability exceeds the five-percent level.'},
      {text: '$X\\le 112$', correct: false, why: 'Uses a boundary on the opposite side of the mean for this lower-tail alternative.'}
    ],
    solution_text: 'Under the null hypothesis, $X\\sim\\operatorname{Bin}(200,0.5)$ and the alternative is that the coin produces fewer tails. The critical region is therefore a lower tail. Computing the cumulative binomial probabilities gives $P(X\\le88)\\le0.05$ while $P(X\\le89)>0.05$, so the critical region is $X\\le88$.',
    diagramRequired: false,
    uncertainties: []
  },
  '124109': {
    question_text: 'The probability of incorrectly rejecting the null hypothesis in a binomial hypothesis test is exactly the same as…',
    structure: 'interpret-significance-level-as-type-one-error',
    meaningfulCase: 'incorrect-rejection-of-true-null',
    mastery: false,
    options: [
      {text: '$p$', correct: false, why: 'The parameter value is not itself the probability of a Type I error.'},
      {text: 'The significance level', correct: true},
      {text: 'The probability of the critical value or more extreme', correct: false, why: 'A single observed tail probability is not the general definition requested here.'},
      {text: 'The test statistic', correct: false, why: 'A test statistic is a calculated value, not a probability of incorrect rejection.'}
    ],
    solution_text: 'Incorrectly rejecting a true null hypothesis is a Type I error. The chosen probability of making that error is the significance level of the test.',
    diagramRequired: false,
    uncertainties: []
  },
  '125072': {
    question_text: 'A normal distribution with a mean of $20$ and a standard deviation of $10$. Translate the above statement into mathematical notation.',
    structure: 'write-normal-distribution-using-mean-and-variance',
    meaningfulCase: 'second-parameter-is-variance-not-standard-deviation',
    mastery: false,
    options: [
      {text: '$N(20,10)$', correct: false, why: 'Uses the standard deviation as the second parameter instead of its square.'},
      {text: '$N(20,\\sqrt{10})$', correct: false, why: 'Takes a square root even though the given standard deviation is already 10.'},
      {text: '$N(20,100)$', correct: true},
      {text: '$N(100,20)$', correct: false, why: 'Swaps the mean with the variance and also uses the wrong second value.'}
    ],
    solution_text: 'The notation $N(\\mu,\\sigma^2)$ uses the mean first and the variance second. Here $\\mu=20$ and $\\sigma^2=10^2=100$, so the distribution is $N(20,100)$.',
    diagramRequired: false,
    uncertainties: []
  }
};

const authoritative = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const assigned = authoritative.jobs.filter(job => {
  const n = Number(job.jobId.replace(/^dq-visual-/, ''));
  return ((n - 1) % 10) + 1 === 4;
}).sort((a, b) => a.jobId.localeCompare(b.jobId));
fs.mkdirSync(outputDir, {recursive: true});

for (const job of assigned) {
  const outPath = path.join(outputDir, `${job.jobId}.json`);
  if (fs.existsSync(outPath)) continue;
  const candidates = job.candidates.map(candidate => {
    const existing = candidate.transcription;
    const transcription = existing ?? t[candidate.source.id];
    if (!transcription) throw new Error(`Missing transcription for ${job.jobId}/${candidate.source.id}`);
    return {...candidate, transcription};
  });
  fs.writeFileSync(outPath, JSON.stringify({jobId: job.jobId, candidates}, null, 2) + '\n', 'utf8');
  console.log(`wrote ${job.jobId}`);
}
