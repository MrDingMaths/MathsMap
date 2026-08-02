import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0521', [
  {
    question_text: 'The stem-and-leaf diagram shows ages. What is the median?',
    structure: 'find-median-from-stem-and-leaf-diagram',
    meaningfulCase: 'order-twenty-values-and-average-tenth-and-eleventh',
    mastery: false,
    options: [
      { text: '27', correct: false, why: 'Selects a value above the two central observations.' },
      { text: '25.5', correct: false, why: 'Averages the wrong pair of central values.' },
      { text: '25', correct: true },
      { text: '2.5', correct: false, why: 'Reads the stem-and-leaf digits without applying the key.' }
    ],
    solution_text: 'There are 20 values. The 10th and 11th values are both 25, so the median is 25.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which shaded region shows students who studied French and German or studied Latin?',
    structure: 'translate-union-and-intersection-of-three-sets',
    meaningfulCase: 'shade-french-intersection-german-together-with-all-latin',
    mastery: false,
    options: [
      { text: 'A', correct: true },
      { text: 'B', correct: false, why: 'Shades only separate pairwise regions and does not include all of Latin.' },
      { text: 'C', correct: false, why: 'Includes French-only or German-only regions not required by the expression.' },
      { text: 'D', correct: false, why: 'Omits parts of the Latin set that should be included.' }
    ],
    solution_text: 'The required region is $(F\\cap G)\\cup L$: the French-German overlap plus the entire Latin circle. This is diagram A.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Emma has equations $3x-y=21$ and $3x-5y=-7$. Which statement is correct after subtracting?',
    structure: 'eliminate-variable-in-simultaneous-equations',
    meaningfulCase: 'subtract-equations-to-cancel-three-x',
    mastery: false,
    options: [
      { text: '$-6y=14$', correct: false, why: 'Subtracts the y terms with the wrong sign.' },
      { text: '$6y=28$', correct: false, why: 'Combines the constants incorrectly after subtracting the equations.' },
      { text: '$4y=28$', correct: true },
      { text: '$4y=14$', correct: false, why: 'Uses the wrong difference of the right-hand sides.' }
    ],
    solution_text: 'Subtract the first equation from the second: $(3x-5y)-(3x-y)=-7-21$, giving $-4y=-28$ and therefore $4y=28$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'In $\\dfrac{2x^3-7x^2+1}{x^2-5x+1}=2x+3+\\dfrac{13x-2}{x^2-5x+1}$, what is the remainder?',
    structure: 'identify-remainder-after-polynomial-division',
    meaningfulCase: 'read-numerator-of-proper-fraction-after-division',
    mastery: false,
    options: [
      { text: '$2x+3$', correct: false, why: 'This is the quotient, not the remainder.' },
      { text: '$13x-2$', correct: true },
      { text: '$x^2-5x+1$', correct: false, why: 'This is the divisor, not the remainder polynomial.' },
      { text: '$\\dfrac{13x-2}{x^2-5x+1}$', correct: false, why: 'The remainder is the numerator before division by the divisor.' }
    ],
    solution_text: 'The displayed division identity has quotient $2x+3$ and proper remainder numerator $13x-2$, so the remainder is $13x-2$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Two similar triangles have corresponding base lengths 4 m and $4+8=12$ m. The corresponding smaller side is 3 m. What is the larger side $y$?',
    structure: 'use-similarity-scale-factor-to-find-length',
    meaningfulCase: 'scale-by-three-from-four-metre-base-to-twelve-metre-base',
    mastery: false,
    options: [
      { text: '6 m', correct: false, why: 'Uses an incorrect scale factor for the corresponding sides.' },
      { text: '7 m', correct: false, why: 'Adds lengths rather than applying the similarity ratio.' },
      { text: '9 m', correct: true },
      { text: '11 m', correct: false, why: 'Does not preserve the proportional relationship between the triangles.' }
    ],
    solution_text: 'The scale factor is $12/4=3$. Therefore $y=3\\times3=9$ m.',
    diagramRequired: true,
    uncertainties: []
  }
]);
