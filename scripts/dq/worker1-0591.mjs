import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0591', [
  {
    question_text: 'Complete: $750\,ml=$ ____ litres.',
    structure: 'convert-millilitres-to-litres',
    meaningfulCase: 'divide-millilitres-by-one-thousand',
    mastery: false,
    options: [
      { text: '7.5', correct: false, why: 'Moves the decimal point in the wrong direction when converting millilitres to litres.' },
      { text: '0.75', correct: true },
      { text: '0.075', correct: false, why: 'Divides by an incorrect power of ten in the unit conversion.' },
      { text: '750,000', correct: false, why: 'Multiplies instead of dividing by 1000 to convert millilitres to litres.' }
    ],
    solution_text: 'Since 1000 ml is 1 litre, $750\div1000=0.75$ litres.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'The range of 6 numbers is 18. Four numbers are $16,20,7,11$. Which answer could not be the two missing numbers?',
    structure: 'test-possible-values-for-range',
    meaningfulCase: 'check-whether-combined-minimum-and-maximum-differ-by-eighteen',
    mastery: false,
    options: [
      { text: '2 and 14', correct: false, why: 'The minimum 2 and maximum 20 give a range of 18, so this could occur.' },
      { text: '25 and 8', correct: false, why: 'The minimum 7 and maximum 25 give a range of 18, so this could occur.' },
      { text: '4 and 22', correct: false, why: 'The minimum 4 and maximum 22 give a range of 18, so this could occur.' },
      { text: '6 and 23', correct: true }
    ],
    solution_text: 'With 6 and 23 included, the minimum is 6 and maximum is 23, giving range $23-6=17$, not 18. Therefore this pair could not be the missing numbers.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Which expression correctly represents: “Subtract $d$ from seven and then multiply by five”?',
    structure: 'translate-verbal-algebraic-operation-order',
    meaningfulCase: 'form-seven-minus-d-before-multiplying-by-five',
    mastery: false,
    options: [
      { text: '$5(d-7)$', correct: false, why: 'Subtracts seven from d rather than subtracting d from seven.' },
      { text: '$5(7-d)$', correct: true },
      { text: '$(7-d)\times5$', correct: false, why: 'This is algebraically equivalent to option B, so the source contains two equivalent correct forms.' },
      { text: '$(d-7)\times5$', correct: false, why: 'Reverses the subtraction and gives five times d minus seven.' }
    ],
    solution_text: '“Subtract $d$ from seven” gives $7-d$, then multiplying by five gives $5(7-d)$. Option C is algebraically equivalent, so the source is ambiguous; option B is retained as the intended keyed answer.' ,
    diagramRequired: false,
    uncertainties: ['Options B and C are algebraically identical: $5(7-d)=(7-d)\times5$. The source therefore has two correct expressions; option B is retained as the intended keyed answer.']
  },
  {
    question_text: 'Factorise $4x-16$.',
    structure: 'factorise-linear-expression',
    meaningfulCase: 'take-four-as-common-factor-and-factorise-completely',
    mastery: false,
    options: [
      { text: '$4(x-16)$', correct: false, why: 'Multiplying out gives $4x-64$, not the original expression.' },
      { text: '$4(x+4)$', correct: false, why: 'The sign inside the bracket should be negative because the constant is -16.' },
      { text: '$2(2x-8)$', correct: false, why: 'This is equivalent but is not fully factorised because a further factor of 2 remains.' },
      { text: '$4(x-4)$', correct: true }
    ],
    solution_text: 'Take out the common factor 4: $4x-16=4(x-4)$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'If 100% of a bottle was 600 ml, what would 0.5 of the bottle be?',
    structure: 'find-decimal-fraction-of-quantity',
    meaningfulCase: 'multiply-total-volume-by-one-half',
    mastery: false,
    options: [
      { text: '300 ml', correct: true },
      { text: '60 ml', correct: false, why: 'Uses one tenth of the bottle instead of one half.' },
      { text: '30 ml', correct: false, why: 'Uses an incorrect decimal fraction of the 600 ml total.' },
      { text: '120 ml', correct: false, why: 'Calculates one fifth rather than half of the bottle.' }
    ],
    solution_text: 'The decimal $0.5$ is one half, so $0.5\times600=300$ ml.' ,
    diagramRequired: false,
    uncertainties: []
  }
]);
