import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0631', [
  {
    question_text: 'Which choice best represents the width of a sheet of paper?',
    structure: 'choose-reasonable-measurement-unit',
    meaningfulCase: 'select-inch-scale-width-for-ordinary-sheet-of-paper',
    mastery: false,
    options: [
      { text: '8 yards', correct: false, why: 'Eight yards is far too wide for an ordinary sheet of paper.' },
      { text: '8 inches', correct: true },
      { text: '8 feet', correct: false, why: 'Eight feet is much larger than the width of a sheet of paper.' },
      { text: '8 miles', correct: false, why: 'Miles are an impossibly large unit for the width of paper.' }
    ],
    solution_text: 'A normal sheet of paper is several inches wide, so 8 inches is the sensible choice.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Sarah is calculating $0.92\times1300$. What is she trying to calculate?',
    structure: 'interpret-percentage-multiplier',
    meaningfulCase: 'recognise-ninety-two-percent-as-eight-percent-reduction',
    mastery: false,
    options: [
      { text: '8% reduction', correct: true },
      { text: '92% reduction', correct: false, why: 'A 92% reduction would leave only 8% of the original amount.' },
      { text: '8% increase', correct: false, why: 'Multiplying by 0.92 decreases the original amount rather than increasing it.' },
      { text: '92% increase', correct: false, why: 'A 92% increase would use a multiplier of 1.92, not 0.92.' }
    ],
    solution_text: '$0.92$ means 92% of the original amount remains. This is $100\%-92\%=8\%$ reduction.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What is the correct answer for the subtraction shown, $547-53$?',
    structure: 'subtract-three-digit-and-two-digit-numbers',
    meaningfulCase: 'subtract-place-values-with-zero-tens-in-minuend',
    mastery: false,
    options: [
      { text: '484', correct: false, why: 'Makes an incorrect borrowing or ones-column subtraction error.' },
      { text: '600', correct: false, why: 'Adds or rounds the numbers instead of subtracting 53 from 547.' },
      { text: '493', correct: false, why: 'Subtracts the tens and ones incorrectly after regrouping.' },
      { text: '494', correct: true }
    ],
    solution_text: 'Subtract directly: $547-53=547-50-3=497-3=494$.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The answer of a division problem is called',
    structure: 'identify-division-vocabulary',
    meaningfulCase: 'name-result-of-division-as-quotient',
    mastery: false,
    options: [
      { text: 'product', correct: false, why: 'Product is the result of a multiplication problem, not division.' },
      { text: 'remainder', correct: false, why: 'A remainder is what may be left over after division, not the whole answer.' },
      { text: 'quotient', correct: true },
      { text: 'sum', correct: false, why: 'A sum is the result of addition, not the result of a division problem.' }
    ],
    solution_text: 'The result of a division is called the quotient.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Calculate $(3.5\times10^3)\times(4\times10^{-5})$.',
    structure: 'multiply-numbers-in-standard-form',
    meaningfulCase: 'multiply-coefficients-and-add-powers-of-ten',
    mastery: false,
    options: [
      { text: '$14\times10^{-2}$', correct: false, why: 'This is equivalent to the standard-form answer, so the source duplicates a correct option.' },
      { text: '$1.4\times10^{-2}$', correct: false, why: 'Normalises the coefficient incorrectly after multiplying 3.5 by 4.' },
      { text: '$1.4\times10^{-1}$', correct: true },
      { text: '$1.4\times10^8$', correct: false, why: 'Adds the exponents with the wrong sign instead of calculating 3 plus negative 5.' }
    ],
    solution_text: 'Multiply coefficients and add exponents: $3.5\times4=14$ and $10^{3+(-5)}=10^{-2}$. Thus $14\times10^{-2}=1.4\times10^{-1}$. Options A and C are equivalent; C is the normalised form retained as intended.' ,
    diagramRequired: false,
    uncertainties: ['Options A and C are mathematically equivalent: $14\times10^{-2}=1.4\times10^{-1}$. The source has duplicate correct forms; option C is retained as the intended keyed answer.']
  }
]);
