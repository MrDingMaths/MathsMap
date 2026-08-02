import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0311', [
  {
    question_text: 'Solve the equation $4^x=8$.',
    structure: 'solve-exponential-equation-by-common-base',
    meaningfulCase: 'rewrite-four-and-eight-as-powers-of-two',
    mastery: false,
    options: [
      { text: '$x=2$', correct: false, why: 'Substitution gives $4^2=16$, not 8.' },
      { text: '$x=\\dfrac32$', correct: true },
      { text: '$x=\\dfrac23$', correct: false, why: 'Reverses the exponent ratio when matching powers of two.' },
      { text: '$x=-\\dfrac23$', correct: false, why: 'A negative exponent would produce a value less than one, not 8.' }
    ],
    solution_text: 'Write $4^x=(2^2)^x=2^{2x}$ and $8=2^3$. Therefore $2x=3$, so $x=3/2$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A line parallel to $y=4x-1$ passes through $(3,2)$. What is its equation?',
    structure: 'find-parallel-line-through-given-point',
    meaningfulCase: 'retain-gradient-four-and-solve-intercept',
    mastery: false,
    options: [
      { text: '$y=4x-5$', correct: false, why: 'Substituting x=3 gives y=7, so this line misses the given point.' },
      { text: '$y=4x+2$', correct: false, why: 'Keeps the gradient but gives y=14 at x=3.' },
      { text: '$y=4x+14$', correct: false, why: 'Has the correct gradient but an intercept inconsistent with the point.' },
      { text: '$y=4x-10$', correct: true }
    ],
    solution_text: 'Parallel lines have the same gradient, so write $y=4x+c$. Using $(3,2)$ gives $2=12+c$, hence $c=-10$ and $y=4x-10$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which inequality is represented by the shaded region to the right of the dashed vertical line $x=1$?',
    structure: 'read-strict-linear-inequality-from-shaded-half-plane',
    meaningfulCase: 'dashed-boundary-excluded-and-shading-to-right',
    mastery: false,
    options: [
      { text: '$x>1$', correct: true },
      { text: '$y<1$', correct: false, why: 'The boundary is vertical, so the inequality concerns x rather than y.' },
      { text: '$x<1$', correct: false, why: 'Describes the opposite side of the vertical boundary from the shaded region.' },
      { text: '$y>1$', correct: false, why: 'Uses a horizontal inequality unrelated to the vertical shaded half-plane.' }
    ],
    solution_text: 'The dashed line $x=1$ is excluded, and the shading is to its right. Therefore $x>1$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Simplify $\\dfrac{x}{3}\\div\\dfrac{x}{5}$.',
    structure: 'divide-algebraic-fractions-by-multiplying-reciprocal',
    meaningfulCase: 'cancel-nonzero-x-after-inverting-divisor',
    mastery: false,
    options: [
      { text: '$\\dfrac{15}{x^2}$', correct: false, why: 'Multiplies the denominators incorrectly and leaves an inappropriate $x^2$.' },
      { text: '$\\dfrac{x^2}{15}$', correct: false, why: 'Multiplies rather than divides the two algebraic fractions.' },
      { text: '$\\dfrac35$', correct: false, why: 'Uses the original fraction ratio instead of multiplying by the reciprocal.' },
      { text: '$\\dfrac53$', correct: true }
    ],
    solution_text: '$\\dfrac{x}{3}\\div\\dfrac{x}{5}=\\dfrac{x}{3}\\times\\dfrac{5}{x}=\\dfrac53$, assuming $x\\ne0$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Convert $\\dfrac{13}{4}$ to a mixed number.',
    structure: 'convert-improper-fraction-to-mixed-number',
    meaningfulCase: 'divide-numerator-by-denominator-and-use-remainder',
    mastery: false,
    options: [
      { text: '$3\\dfrac14$', correct: true },
      { text: '$\\dfrac{26}{8}$', correct: false, why: 'This is an equivalent improper fraction, not the requested mixed-number form.' },
      { text: '3 remainder 1', correct: false, why: 'Gives the quotient and remainder but not a written mixed number.' },
      { text: '$3\\dfrac1{13}$', correct: false, why: 'Uses the original numerator as the fractional denominator incorrectly.' }
    ],
    solution_text: 'Since $13=3\\times4+1$, $13/4=3+1/4=3\\dfrac14$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
