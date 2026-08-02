import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0361', [
  {
    question_text: 'The pictogram shows the number of people who watched a netball match. One full symbol represents 8 people. How many people went to game 4?',
    structure: 'interpret-fractional-pictogram-symbol',
    meaningfulCase: 'multiply-two-and-three-quarter-symbols-by-eight',
    mastery: false,
    options: [
      { text: '24', correct: false, why: 'Treats the game 4 row as three full symbols instead of the displayed fractional symbol.' },
      { text: '16', correct: false, why: 'Counts only the two full symbols and ignores the partial symbol.' },
      { text: '2.75', correct: false, why: 'Reports the number of symbols rather than converting symbols into people.' },
      { text: '22', correct: true }
    ],
    solution_text: 'Game 4 shows $2\\dfrac34$ symbols. Each symbol represents 8 people, so $2\\dfrac34\\times8=2.75\\times8=22$ people.',
    diagramRequired: true,
    uncertainties: ['The fractional pictogram symbol is low resolution, but it is intended to represent $2\\dfrac34$ symbols.']
  },
  {
    question_text: 'A taxi fare is calculated using $3.9M+1.20$, where $M$ is the number of miles travelled. Calculate the fare when $M=24.3$.',
    structure: 'evaluate-linear-cost-formula',
    meaningfulCase: 'substitute-distance-and-add-fixed-charge',
    mastery: false,
    options: [
      { text: '£29.40', correct: false, why: 'Uses only part of the mileage charge and omits the full multiplication.' },
      { text: '£95.97', correct: true },
      { text: '£97.20', correct: false, why: 'Rounds or combines the charge incorrectly before adding the fixed amount.' },
      { text: '£99.44', correct: false, why: 'Uses an incorrect multiplication for the mileage component.' }
    ],
    solution_text: '$3.9(24.3)+1.20=94.77+1.20=95.97$, so the fare is £95.97.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Using a calculator, find the highest common factor of 363 and 572.',
    structure: 'find-highest-common-factor-of-two-integers',
    meaningfulCase: 'apply-euclidean-algorithm-to-remainders',
    mastery: false,
    options: [
      { text: '3', correct: false, why: 'Divides 363 but is not a common factor of 572.' },
      { text: '11', correct: true },
      { text: '$11^2$', correct: false, why: '121 does not divide both 363 and 572.' },
      { text: '13', correct: false, why: '13 is not a factor of both given numbers.' }
    ],
    solution_text: 'Using the Euclidean algorithm: $572-363=209$, $363-209=154$, $209-154=55$, $154=2(55)+44$, and $55=44+11$. Therefore the HCF is 11.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which expression is equivalent to $\\cos(-\\theta)$?',
    structure: 'apply-even-cosine-function-identity',
    meaningfulCase: 'cosine-is-unchanged-by-negating-angle',
    mastery: false,
    options: [
      { text: '$-\\cos(\\theta)$', correct: false, why: 'Cosine is an even function, so negating the angle does not add a minus sign.' },
      { text: '$\\cos(\\theta)$', correct: true },
      { text: '$-\\cos(-\\theta)$', correct: false, why: 'Adds a minus sign that is not present in the even-function identity.' },
      { text: 'None of the above', correct: false, why: 'The standard identity gives the second listed expression exactly.' }
    ],
    solution_text: 'Cosine is even, so $\\cos(-\\theta)=\\cos(\\theta)$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The vectors $u=\\begin{pmatrix}k\\\\-1\\\\1\\end{pmatrix}$ and $v=\\begin{pmatrix}0\\\\4\\\\k\\end{pmatrix}$ are perpendicular. What is $k$?',
    structure: 'find-parameter-from-perpendicular-vector-dot-product',
    meaningfulCase: 'set-dot-product-equal-to-zero',
    mastery: false,
    options: [
      { text: '0', correct: false, why: 'Substitution gives a dot product of -4 rather than zero.' },
      { text: '3', correct: false, why: 'Substitution gives a dot product of -1 rather than zero.' },
      { text: '4', correct: true },
      { text: '5', correct: false, why: 'Substitution gives a dot product of 1 rather than zero.' }
    ],
    solution_text: 'Perpendicular vectors have zero dot product: $u\\cdot v=0(k)+(-1)(4)+(1)k=k-4=0$. Therefore $k=4$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
