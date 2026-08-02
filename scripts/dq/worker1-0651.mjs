import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0651', [
  {
    question_text: 'In a storm 200 fruit trees were left standing out of 240 fruit trees in an orchard. What is the correct method to work out the percentage decrease in the number of trees?',
    structure: 'choose-percentage-decrease-calculation',
    meaningfulCase: 'divide-decrease-by-original-number-and-multiply-by-one-hundred',
    mastery: false,
    options: [
      { text: '$\dfrac{200-240}{240}\times100$', correct: false, why: 'Reverses the subtraction and gives a negative decrease.' },
      { text: '$\dfrac{240-200}{200}\times100$', correct: false, why: 'Uses the remaining number as the denominator rather than the original number.' },
      { text: '$\dfrac{240-100}{200}\times100$', correct: false, why: 'Uses 100 instead of the actual remaining number 200 in the decrease calculation.' },
      { text: '$\dfrac{240-200}{240}\times100$', correct: true }
    ],
    solution_text: 'The decrease is $240-200=40$. Percentage decrease is calculated relative to the original 240: $\frac{40}{240}\times100$.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which choice best represents the height of a door?',
    structure: 'choose-reasonable-measurement-unit',
    meaningfulCase: 'select-feet-scale-height-for-ordinary-door',
    mastery: false,
    options: [
      { text: '7 yards', correct: false, why: 'Seven yards is much taller than an ordinary door.' },
      { text: '7 feet', correct: true },
      { text: '7 miles', correct: false, why: 'Miles are an impossibly large unit for the height of a door.' },
      { text: '7 inches', correct: false, why: 'Seven inches is far too short to be the height of a door.' }
    ],
    solution_text: 'An ordinary door is several feet tall, so 7 feet is the sensible estimate.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Work out $45\times0.2$.',
    structure: 'multiply-whole-number-by-decimal',
    meaningfulCase: 'take-one-fifth-of-forty-five',
    mastery: false,
    options: [
      { text: '90', correct: false, why: 'Doubles 45 instead of multiplying by one fifth.' },
      { text: '900', correct: false, why: 'Moves the decimal point in the wrong direction and makes the result too large.' },
      { text: '9', correct: true },
      { text: '0.9', correct: false, why: 'Moves the decimal point one place too far when multiplying by 0.2.' }
    ],
    solution_text: '$0.2=\frac15$, so $45\times0.2=45\div5=9$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'What is $2\times4+15\div3$?',
    structure: 'apply-order-of-operations',
    meaningfulCase: 'perform-multiplication-and-division-before-addition',
    mastery: false,
    options: [
      { text: '13', correct: true },
      { text: '7.666', correct: false, why: 'Does not apply the standard order of operations to the expression.' },
      { text: '18', correct: false, why: 'Adds or multiplies terms incorrectly after evaluating the operations.' },
      { text: '12.666', correct: false, why: 'Uses an incorrect division or combines the operations in the wrong order.' }
    ],
    solution_text: 'Do multiplication and division first: $2\times4=8$ and $15\div3=5$. Then $8+5=13$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Write the number 100 000 as a power of 10.',
    structure: 'write-power-of-ten-from-place-value',
    meaningfulCase: 'count-five-zeroes-in-one-hundred-thousand',
    mastery: false,
    options: [
      { text: '$10^2$', correct: false, why: 'Equals 100, which has only two zeroes.' },
      { text: '$10^3$', correct: false, why: 'Equals 1000, which is smaller than 100 000.' },
      { text: '$10^4$', correct: false, why: 'Equals 10 000, which has one fewer zero than the given number.' },
      { text: '$10^5$', correct: true }
    ],
    solution_text: '$10^5=100000$, so 100 000 written as a power of 10 is $10^5$.' ,
    diagramRequired: false,
    uncertainties: []
  }
]);
