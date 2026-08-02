import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0351', [
  {
    question_text: 'How many more points did Voyagers score than Pioneers in Spring?',
    structure: 'subtract-two-table-values',
    meaningfulCase: 'read-spring-column-and-subtract-pioneers-from-voyagers',
    mastery: false,
    options: [
      { text: '81', correct: true },
      { text: '327', correct: false, why: 'Reports the Voyagers Spring total rather than the difference between the teams.' },
      { text: '33', correct: false, why: 'Subtracts the wrong pair of table entries.' },
      { text: '106', correct: false, why: 'Uses an unrelated difference from the table rather than Spring scores.' }
    ],
    solution_text: 'In Spring, Voyagers scored 327 and Pioneers scored 246. The difference is $327-246=81$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Simplify $\\cosec^2(\\theta)+1$.',
    structure: 'apply-pythagorean-trigonometric-identity',
    meaningfulCase: 'use-cosecant-square-equals-one-plus-cotangent-square',
    mastery: false,
    options: [
      { text: '$\\cot^2(\\theta)$', correct: false, why: 'This equals $\\cosec^2(\\theta)-1$, not the expression with an added 1.' },
      { text: '$\\cot(\\theta)$', correct: false, why: 'Drops the square and cannot equal the given squared expression generally.' },
      { text: '$\\sin^2(\\theta)$', correct: false, why: 'Uses sine rather than the reciprocal identity for cosecant.' },
      { text: 'None of the above', correct: true }
    ],
    solution_text: 'Since $\\cosec^2\\theta=1+\\cot^2\\theta$, the expression is $\\cot^2\\theta+2$, which is none of the listed first three forms.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Dylan rolls a fair die. What is the probability that it lands on an even number or a factor of 5?',
    structure: 'calculate-union-probability-for-fair-die-events',
    meaningfulCase: 'union-of-even-outcomes-and-factors-of-five',
    mastery: false,
    options: [
      { text: '$\\dfrac26$', correct: false, why: 'Counts only two even outcomes and omits 4 and 6, as well as factor 5.' },
      { text: '$\\dfrac36$', correct: false, why: 'Counts the even outcomes but omits the additional outcome 5.' },
      { text: '$\\dfrac46$', correct: false, why: 'Counts only four favourable outcomes and misses that 2, 4, 6, and 5 give four; this option is numerically correct only if the displayed denominator is six, so the source key is ambiguous.' },
      { text: '$\\dfrac56$', correct: true }
    ],
    solution_text: 'Even outcomes are $\\{2,4,6\\}$ and factors of 5 on a die are $\\{1,5\\}$. The union has five outcomes, so the probability is $5/6$.',
    diagramRequired: true,
    uncertainties: ['The displayed option $4/6$ is also mathematically plausible only if factor of 5 is interpreted as 5 alone and even outcomes are miscounted; the correct union has five outcomes.']
  },
  {
    question_text: 'Which number has been written incorrectly in Roman numerals? 1) CDXLVIII, 2) CDXCIII, 3) CDXXI, 4) CDXCVI.',
    structure: 'validate-roman-numeral-notation',
    meaningfulCase: 'check-subtractive-pairs-and-place-value-order',
    mastery: false,
    options: [
      { text: '1', correct: false, why: '$CDXLVIII$ correctly represents 448.' },
      { text: '2', correct: false, why: '$CDXCIII$ correctly represents 493.' },
      { text: '2 and 3', correct: false, why: 'Both $CDXCIII$ and $CDXXI$ follow standard Roman-numeral notation.' },
      { text: '4', correct: true }
    ],
    solution_text: 'The displayed forms 1, 2, and 3 are standard representations of 448, 493, and 421. The source image labels 4 as the intended answer, but $CDXCVI$ is also a standard representation of 496; the item is therefore internally inconsistent.',
    diagramRequired: true,
    uncertainties: ['All four displayed Roman numerals appear valid under standard notation, so no unique incorrect choice can be established from the image.']
  },
  {
    question_text: 'What is the range of the function shown?',
    structure: 'read-range-from-graph-endpoints-and-turning-point',
    meaningfulCase: 'identify-minimum-minus-six-and-maximum-two',
    mastery: false,
    options: [
      { text: '$-6\\le y\\le2$', correct: true },
      { text: '$-6\\le y\\le0$', correct: false, why: 'Misses the graph’s maximum value of 2 at its turning point.' },
      { text: '$0\\le y\\le-6$', correct: false, why: 'Reverses the order of the lower and upper bounds and excludes the graph.' },
      { text: '$-2\\le y\\le4$', correct: false, why: 'Shifts both observed endpoint values upward by two units.' }
    ],
    solution_text: 'From the graph, the lowest y-value is $-6$ and the highest is $2$, so the range is $-6\\le y\\le2$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
