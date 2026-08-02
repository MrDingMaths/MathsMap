import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0371', [
  {
    question_text: 'Identify the number marked by the arrow on the scale.',
    structure: 'read-value-from-number-scale',
    meaningfulCase: 'count-midpoint-tick-between-twenty-and-thirty',
    mastery: false,
    options: [
      { text: '26', correct: false, why: 'Places the arrow one unit above the marked intermediate tick.' },
      { text: '25', correct: true },
      { text: '22', correct: false, why: 'Reads the arrow too close to the 20 mark on the scale.' },
      { text: '30', correct: false, why: 'Uses the next labelled major mark rather than the arrow position.' }
    ],
    solution_text: 'The arrow points to the midpoint tick between 20 and 30, which represents 25.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which list shows all the integer values of $x$ when $-3<x\\le2$?',
    structure: 'list-integer-values-satisfying-compound-inequality',
    meaningfulCase: 'exclude-minus-three-and-include-two',
    mastery: false,
    options: [
      { text: '$-3,-2,-1,0,1,2$', correct: false, why: 'Includes -3 even though the inequality is strict at that endpoint.' },
      { text: '$-2,-1,1,2$', correct: false, why: 'Omits the valid integer value 0 from the interval.' },
      { text: '$-2,-1,0,1$', correct: false, why: 'Omits the included upper endpoint x=2.' },
      { text: '$-2,-1,0,1,2$', correct: true }
    ],
    solution_text: 'The integers greater than -3 and at most 2 are $-2,-1,0,1,2$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Find $\\int 3x\\sin(x^2)\\,dx$.',
    structure: 'integrate-by-substitution-with-inner-derivative',
    meaningfulCase: 'let-u-equal-x-squared-and-account-for-factor-three-halves',
    mastery: false,
    options: [
      { text: '$6x\\cos(x^2)+C$', correct: false, why: 'Differentiating introduces extra factors and the wrong sign.' },
      { text: '$\\dfrac32\\sin(x^2)+C$', correct: false, why: 'Differentiation gives a cosine term rather than the required sine term.' },
      { text: '$-\\dfrac32\\cos(x^2)+C$', correct: true },
      { text: '$-\\dfrac32\\sin(x^2)+C$', correct: false, why: 'Differentiation gives a cosine term and therefore does not recover the integrand.' }
    ],
    solution_text: 'Let $u=x^2$, so $du=2x\\,dx$. Then $\\int3x\\sin(x^2)dx=\\frac32\\int\\sin u\\,du=-\\frac32\\cos u+C=-\\frac32\\cos(x^2)+C$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Given $\\square\\ne\\star$, what word completes the statement? The square is ___ the star.',
    structure: 'translate-not-equal-symbol-into-comparison-language',
    meaningfulCase: 'read-not-equal-as-not-equal-to',
    mastery: false,
    options: [
      { text: 'greater than', correct: false, why: 'The symbol does not specify which of the two values is larger.' },
      { text: 'less than', correct: false, why: 'The symbol does not specify an ordering between the two values.' },
      { text: 'equal to', correct: false, why: 'This contradicts the displayed not-equal symbol.' },
      { text: 'not equal to', correct: true }
    ],
    solution_text: 'The symbol $\\ne$ is read as “not equal to”, so the square is not equal to the star.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which number is both a square number and a cube number: $2^0$, $\\sqrt{27}$, $9^{25}$, or $7^{-6}$?',
    structure: 'identify-number-that-is-both-square-and-cube',
    meaningfulCase: 'recognise-one-as-both-perfect-square-and-perfect-cube-integer',
    mastery: false,
    options: [
      { text: '$2^0$', correct: true },
      { text: '$\\sqrt{27}$', correct: false, why: 'This is irrational and therefore is not an integer square-cube number.' },
      { text: '$9^{25}$', correct: false, why: 'It is a square power of 3, but its exponent is not divisible by 3.' },
      { text: '$7^{-6}$', correct: false, why: 'It is not an integer, whereas the question’s square and cube numbers are integer powers.' }
    ],
    solution_text: '$2^0=1$, and 1 is both $1^2$ and $1^3$. The other displayed choices are not positive integer numbers that are simultaneously perfect squares and cubes.',
    diagramRequired: true,
    uncertainties: ['If rational numbers are allowed, $7^{-6}$ is also both a square and a cube; the intended school definition appears to restrict “square number” and “cube number” to integers.']
  }
]);
