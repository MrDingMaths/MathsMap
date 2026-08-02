import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0441', [
  {
    question_text: 'Simplify $4a\\times5a$.',
    structure: 'simplify-product-of-numerical-and-algebraic-factors',
    meaningfulCase: 'multiply-coefficients-and-add-powers-of-a',
    mastery: false,
    options: [
      { text: '$9a$', correct: false, why: 'Adds the coefficients instead of multiplying them and does not combine both a factors.' },
      { text: '$4a^2$', correct: false, why: 'Combines the powers of a but omits the factor 5.' },
      { text: '$20a$', correct: false, why: 'Multiplies coefficients but leaves the two factors of a as only one.' },
      { text: '$20a^2$', correct: true }
    ],
    solution_text: '$4a\\times5a=(4\\times5)(a\\times a)=20a^2$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Given $f(x)=3x-2$, find $f^{-1}(x)$.',
    structure: 'find-inverse-of-linear-function',
    meaningfulCase: 'swap-x-and-y-then-rearrange-for-y',
    mastery: false,
    options: [
      { text: '$3x+2$', correct: false, why: 'Adds 2 but fails to divide by the coefficient 3.' },
      { text: '$\\dfrac{x+2}{3}$', correct: true },
      { text: '$\\dfrac1{3x-2}$', correct: false, why: 'Uses a reciprocal rather than the inverse function operation.' },
      { text: '$\\dfrac{x-2}{3}$', correct: false, why: 'Subtracts 2 instead of adding 2 when undoing the original function.' }
    ],
    solution_text: 'Set $y=3x-2$ and swap x and y: $x=3y-2$. Then $3y=x+2$, so $f^{-1}(x)=(x+2)/3$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The bar chart shows quiz-team scores and their frequencies. Calculate the mean score.',
    structure: 'calculate-mean-from-discrete-frequency-chart',
    meaningfulCase: 'divide-total-of-score-times-frequency-by-total-frequency',
    mastery: false,
    options: [
      { text: '7.3', correct: true },
      { text: '7.5', correct: false, why: 'Uses an inaccurate average that does not weight the frequencies correctly.' },
      { text: '24.3 (1 dp)', correct: false, why: 'Adds or multiplies the score values without dividing by the number of observations.' },
      { text: '3.3 (1 dp)', correct: false, why: 'Produces a value below the smallest score and cannot be the mean.' }
    ],
    solution_text: 'The total frequency is 20 and the weighted total is $5(2)+6(4)+7(5)+8(5)+9(3)+10(1)=146$. Mean $=146/20=7.3$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Evaluate $-3+1$.',
    structure: 'add-positive-integer-to-negative-integer',
    meaningfulCase: 'move-one-unit-towards-zero-from-minus-three',
    mastery: false,
    options: [
      { text: '2', correct: false, why: 'Subtracts the negative value incorrectly and changes the sign.' },
      { text: '4', correct: false, why: 'Adds the magnitudes instead of accounting for the negative sign.' },
      { text: '-2', correct: true },
      { text: '-4', correct: false, why: 'Moves one unit farther from zero rather than adding positive one.' }
    ],
    solution_text: '$-3+1=-2$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A cube has side length $100\\text{ cm}$. What is its volume in $\\text{m}^3$?',
    structure: 'convert-cube-side-length-and-calculate-volume',
    meaningfulCase: 'convert-one-hundred-centimetres-to-one-metre-before-cubing',
    mastery: false,
    options: [
      { text: '1', correct: true },
      { text: '100', correct: false, why: 'Uses the side length as the volume and does not cube it after conversion.' },
      { text: '10,000', correct: false, why: 'Uses a square-area calculation rather than the cubic volume.' },
      { text: '100,000', correct: false, why: 'Fails to convert the centimetre length into metres before cubing.' }
    ],
    solution_text: '$100\\text{ cm}=1\\text{ m}$. The cube volume is $1^3=1\\text{ m}^3$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
