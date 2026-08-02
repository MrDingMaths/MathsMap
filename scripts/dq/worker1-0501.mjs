import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0501', [
  {
    question_text: 'Which fraction does not simplify to an integer: $24/(-6)$, $0/1$, $-54/(-9)$, or $111/11$?',
    structure: 'identify-fraction-with-noninteger-value',
    meaningfulCase: 'divide-numerator-by-denominator-and-check-integrality',
    mastery: false,
    options: [
      { text: '$\\dfrac{24}{-6}$', correct: false, why: 'It simplifies exactly to the integer -4.' },
      { text: '$\\dfrac01$', correct: false, why: 'It simplifies exactly to the integer 0.' },
      { text: '$\\dfrac{-54}{-9}$', correct: false, why: 'It simplifies exactly to the integer 6.' },
      { text: '$\\dfrac{111}{11}$', correct: true }
    ],
    solution_text: '$111/11=10+1/11$, which is not an integer; the other three fractions simplify to -4, 0, and 6.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What is the equation of the line shown in the diagram?',
    structure: 'read-gradient-and-intercept-from-line-graph',
    meaningfulCase: 'identify-gradient-two-and-y-intercept-minus-one',
    mastery: false,
    options: [
      { text: '$y=2x-1$', correct: true },
      { text: '$y=0.5x-1$', correct: false, why: 'Has the correct intercept but the graph rises four units for every two horizontally.' },
      { text: '$y=0.5x-2$', correct: false, why: 'Has both the wrong gradient and the wrong y-intercept.' },
      { text: '$y=2x+0.5$', correct: false, why: 'Has the right gradient but crosses the y-axis at the wrong height.' }
    ],
    solution_text: 'The line crosses the y-axis at -1 and rises 2 for each unit increase in x, so $y=2x-1$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What region is represented by the shaded section of the Venn diagram?',
    structure: 'interpret-complement-region-in-venn-diagram',
    meaningfulCase: 'shade-outside-set-a-regardless-of-membership-in-b',
    mastery: false,
    options: [
      { text: "$A'$", correct: true },
      { text: "$B'$", correct: false, why: 'The shaded area includes points inside B, so it is not the complement of B.' },
      { text: "$A\\cup B'$", correct: false, why: 'This union would include all of A, including the unshaded part of the left circle.' },
      { text: '$A$', correct: false, why: 'The set A is shown as the white left circle rather than the shaded exterior.' }
    ],
    solution_text: 'The unshaded region is the whole of set A, including its overlap with B. The shaded region is therefore the complement $A\'$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which image shows the correct written method for calculating $163+456$?',
    structure: 'check-column-addition-with-regrouping',
    meaningfulCase: 'add-ones-tens-and-hundreds-with-carry',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'Places the carry incorrectly and produces an incorrect column total.' },
      { text: 'B', correct: false, why: 'Leaves 11 in the tens column instead of regrouping one ten.' },
      { text: 'C', correct: true },
      { text: 'D', correct: false, why: 'Subtracts the numbers instead of carrying out the requested addition.' }
    ],
    solution_text: 'Add from the ones column: $3+6=9$, $6+5=11$ write 1 carry 1, then $1+4+1=6$. The result is 619, shown by C.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What is the three-figure bearing of Q from P?',
    structure: 'read-three-figure-bearing-from-north-reference',
    meaningfulCase: 'measure-clockwise-from-north-through-sixty-degrees',
    mastery: false,
    options: [
      { text: '$120^\\circ$', correct: false, why: 'Measures from a different reference direction rather than clockwise from north.' },
      { text: '$060^\\circ$', correct: true },
      { text: '$300^\\circ$', correct: false, why: 'Measures clockwise in the opposite direction from the required bearing.' },
      { text: '$60^\\circ$', correct: false, why: 'Has the right angle but is not written in the required three-figure bearing format.' }
    ],
    solution_text: 'The line from P to Q is $60^\\circ$ clockwise from north. A three-figure bearing is therefore $060^\\circ$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
