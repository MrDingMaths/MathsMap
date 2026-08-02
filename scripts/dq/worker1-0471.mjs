import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0471', [
  {
    question_text: 'Find $dy/dx$ in terms of x and y for $xy=-1$.',
    structure: 'implicitly-differentiate-product-equation',
    meaningfulCase: 'differentiate-xy-and-solve-for-y-prime',
    mastery: false,
    options: [
      { text: '$-x/y$', correct: false, why: 'Rearranges the differentiated equation incorrectly and inverts the required quotient.' },
      { text: '$-y/x$', correct: true },
      { text: '$y/x$', correct: false, why: 'Misses the negative sign arising from differentiating the constant product relation.' },
      { text: '$x/y$', correct: false, why: 'Has both the wrong sign and the reciprocal variables.' }
    ],
    solution_text: 'Differentiate $xy=-1$: $x(dy/dx)+y=0$. Hence $dy/dx=-y/x$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which recurrence formula would be appropriate to use with $x_0=-1/3$?',
    structure: 'select-valid-fixed-point-iteration-formula',
    meaningfulCase: 'choose-rearrangement-consistent-with-the-given-equation',
    mastery: false,
    options: [
      { text: '$x_{n+1}=\\dfrac{x_n^5-2}{3}$', correct: true },
      { text: '$x_{n+1}=\\sqrt[5]{3x_n-2}$', correct: false, why: 'Rearranges a different equation and does not match the intended iteration.' },
      { text: 'Both A and B', correct: false, why: 'The two recurrences are not algebraically equivalent forms of the same relation.' },
      { text: 'Neither A nor B', correct: false, why: 'The first displayed recurrence is a valid rearrangement for the stated iteration.' }
    ],
    solution_text: 'The appropriate fixed-point rearrangement is $x_{n+1}=(x_n^5-2)/3$; the alternative fifth-root formula has a different sign and defines a different iteration.',
    diagramRequired: true,
    uncertainties: ['The source image does not display the underlying equation or convergence criterion, so the intended choice between the two recurrence forms is not fully specified.']
  },
  {
    question_text: 'For $\\int xe^{2(1-x)}\\,dx$, which integration-by-parts choices are correct?',
    structure: 'choose-u-and-v-for-integration-by-parts',
    meaningfulCase: 'differentiate-x-and-integrate-exponential-factor',
    mastery: false,
    options: [
      { text: '$u=x$, $u\'=1$, $v=-\\dfrac12e^{2(1-x)}$, $v\'=e^{2(1-x)}$', correct: true },
      { text: '$u=x$, $u\'=1$, $v=2e^{2(1-x)}$, $v\'=e^{2(1-x)}$', correct: false, why: 'The proposed v differentiates with the wrong constant factor.' },
      { text: '$u=x$, $u\'=1$, $v=e^{2(1-x)}$, $v\'=2e^{2(1-x)}$', correct: false, why: 'Differentiating the exponential introduces a negative factor of 2, not this positive derivative.' },
      { text: '$u=x$, $u\'=1$, $v=e^{2(1-x)}$, $v\'=-\\dfrac12e^{2(1-x)}$', correct: false, why: 'Interchanges an antiderivative with its derivative and omits the required sign relationship.' }
    ],
    solution_text: 'Take $u=x$, so $u\'=1$. An antiderivative of $e^{2(1-x)}$ is $v=-\\frac12e^{2(1-x)}$, whose derivative is $e^{2(1-x)}$. Thus A is correct.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'When the trapezium rule estimates $\\int_0^1 2^x\\,dx$ using $N$ equal subintervals, which expression is obtained?',
    structure: 'derive-trapezium-rule-geometric-sum-expression',
    meaningfulCase: 'sum-geometric-trapezoid-ordinates-with-r-equals-two-to-one-over-n',
    mastery: false,
    options: [
      { text: '$\\dfrac1{2N}\\left(1+\\dfrac1{2^{1/N}+1}\\right)$', correct: false, why: 'Uses the wrong denominator for the geometric progression of ordinates.' },
      { text: '$\\dfrac1{2N}\\left(1+\\dfrac2{2^{1/N}-1}\\right)$', correct: true },
      { text: '$\\dfrac1N\\left(1-\\dfrac1{2^{1/N}-1}\\right)$', correct: false, why: 'Has an incorrect sign and scaling for the trapezium sum.' },
      { text: '$\\dfrac1{2N}\\left(\\dfrac5{2^{1/N}+1}-1\\right)$', correct: false, why: 'Does not simplify to the weighted geometric sum of endpoint ordinates.' }
    ],
    solution_text: 'With $r=2^{1/N}$ and step $1/N$, the trapezium estimate is $N^{-1}[1/2+ r+\cdots+r^{N-1}+1]$. Since $r^N=2$, this simplifies to $\\frac1{2N}(1+2/(r-1))$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A 2 kg parcel is on a rough plane inclined at $30^\\circ$, with coefficient of friction 0.2. A force parallel to the plane gives acceleration $2\\text{ m s}^{-2}$ up the plane. What is the force?',
    structure: 'resolve-forces-on-rough-inclined-plane',
    meaningfulCase: 'add-weight-component-friction-and-ma-for-up-slope-force',
    mastery: false,
    options: [
      { text: '$15.4\\text{ N}$', correct: false, why: 'Uses an incomplete or rounded force balance and underestimates the required force.' },
      { text: '$17.2\\text{ N}$', correct: true },
      { text: '$16.3\\text{ N}$', correct: false, why: 'Rounds the normal-friction contribution incorrectly.' },
      { text: '$14.5\\text{ N}$', correct: false, why: 'Does not include both the downslope weight component and acceleration term.' }
    ],
    solution_text: 'Down-slope resistance is $mg\\sin30^\\circ+\\mu mg\\cos30^\\circ=9.8+0.2(17.0)=13.2$ N approximately. Adding $ma=4$ N gives $F\\approx17.2$ N.',
    diagramRequired: true,
    uncertainties: []
  }
]);
