import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0401', [
  {
    question_text: 'If $a=6$, what is the value of $4a+3$?',
    structure: 'evaluate-linear-expression-by-substitution',
    meaningfulCase: 'substitute-six-and-multiply-before-adding',
    mastery: false,
    options: [
      { text: '49', correct: false, why: 'Adds 3 to the wrong product after miscalculating $4\\times6$.' },
      { text: '42', correct: false, why: 'Calculates only $4a$ and omits the final addition of 3.' },
      { text: '7', correct: false, why: 'Adds 4 and 3 without multiplying by the value of a.' },
      { text: '27', correct: true }
    ],
    solution_text: 'Substitute $a=6$: $4a+3=4(6)+3=24+3=27$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A table has $a$ in each of the two burger cells, hotdog counts 14 and 3, and grand total 47. What is the value of the $a$ numbers?',
    structure: 'solve-unknown-repeated-table-entry-from-total',
    meaningfulCase: 'subtract-hotdog-total-and-divide-remainder-by-two',
    mastery: false,
    options: [
      { text: '30', correct: false, why: 'This is the total burger row, not the value in each burger cell.' },
      { text: 'Not enough information', correct: false, why: 'The total and all other table entries determine the repeated value.' },
      { text: '15', correct: true },
      { text: '44', correct: false, why: 'Does not account for the hotdog entries before solving for each a.' }
    ],
    solution_text: 'The hotdog total is $14+3=17$, leaving $47-17=30$ for the two burger cells. Since both are $a$, $2a=30$ and $a=15$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which fraction is not in its simplest form: $13/18$, $4/5$, $101/157$, or $57/111$?',
    structure: 'identify-reducible-fraction-by-common-factor',
    meaningfulCase: 'detect-common-factor-three-in-fifty-seven-and-one-hundred-eleven',
    mastery: false,
    options: [
      { text: '$\\dfrac{13}{18}$', correct: false, why: '13 and 18 have no common factor greater than one.' },
      { text: '$\\dfrac45$', correct: false, why: '4 and 5 are coprime, so the fraction is already simplified.' },
      { text: '$\\dfrac{101}{157}$', correct: false, why: '101 and 157 have no common factor greater than one.' },
      { text: '$\\dfrac{57}{111}$', correct: true }
    ],
    solution_text: '$57$ and $111$ are both divisible by 3, giving $57/111=19/37$. Therefore $57/111$ is not in simplest form.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What is the name of the 3D shape that can be made from the triangular net shown?',
    structure: 'identify-solid-from-triangular-net',
    meaningfulCase: 'recognise-four-triangle-faces-form-triangular-pyramid',
    mastery: false,
    options: [
      { text: 'Triangular prism', correct: false, why: 'A triangular prism requires two triangular bases and three rectangular faces.' },
      { text: 'Cone', correct: false, why: 'A cone net includes a circular sector and a circular base, not four triangles.' },
      { text: 'Square-based pyramid', correct: false, why: 'A square-based pyramid has a square base rather than four triangular faces.' },
      { text: 'Triangular based pyramid', correct: true }
    ],
    solution_text: 'The net consists of four triangular faces, which fold to form a triangular-based pyramid (tetrahedron).',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The cumulative frequency graph shows students’ heights. Approximately how many students are taller than 178 cm?',
    structure: 'estimate-upper-tail-from-cumulative-frequency-graph',
    meaningfulCase: 'read-cumulative-count-at-178-and-subtract-from-total',
    mastery: false,
    options: [
      { text: '74', correct: true },
      { text: '36', correct: false, why: 'Uses a lower-tail or graph-reading count rather than the upper-tail total.' },
      { text: '36', correct: false, why: 'Repeats the distractor value and does not match the estimated upper-tail count.' },
      { text: '30', correct: false, why: 'Underestimates the number of students above 178 cm from the curve.' }
    ],
    solution_text: 'Reading the curve at 178 cm gives a cumulative frequency of about 30. With total frequency about 104, the number taller than 178 cm is approximately $104-30=74$.',
    diagramRequired: true,
    uncertainties: ['The graph is read approximately; the source repeats 36 for two answer choices.']
  }
]);
