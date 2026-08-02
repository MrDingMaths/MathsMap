import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0511', [
  {
    question_text: 'The circle $x^2+y^2=37$ and line $y=-1$ intersect at P. Which point is P?',
    structure: 'find-intersection-of-circle-and-horizontal-line',
    meaningfulCase: 'substitute-y-minus-one-and-select-left-intersection',
    mastery: false,
    options: [
      { text: '$(36,-1)$', correct: false, why: 'Uses the squared x-coordinate as the x-coordinate itself.' },
      { text: '$(-1,-6)$', correct: false, why: 'Does not satisfy the given horizontal line y=-1.' },
      { text: '$(6,-1)$', correct: false, why: 'Is the right-hand intersection rather than the labelled left point P.' },
      { text: '$(-6,-1)$', correct: true }
    ],
    solution_text: 'With $y=-1$, $x^2+1=37$, so $x^2=36$ and $x=\\pm6$. The left point P is $(-6,-1)$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What time is not shown on the clock?',
    structure: 'interpret-equivalent-analogue-and-digital-time-forms',
    meaningfulCase: 'recognise-eleven-fifty-five-and-its-equivalents',
    mastery: false,
    options: [
      { text: '55 minutes past 11', correct: false, why: 'This is the analogue time shown by the hands.' },
      { text: '12.55', correct: true },
      { text: '5 minutes to 12', correct: false, why: 'This is another verbal form of 11:55.' },
      { text: '23:55', correct: false, why: 'This is the 24-hour notation for 11:55 pm.' }
    ],
    solution_text: 'The clock shows 11:55, equivalently 55 minutes past 11, 5 minutes to 12, or 23:55. The time 12:55 is not equivalent.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Two different numbers round to 3.46 to two decimal places. Which pair could they be?',
    structure: 'identify-pair-with-same-two-decimal-rounding',
    meaningfulCase: 'check-both-values-lie-between-three-point455-and-three-point465',
    mastery: false,
    options: [
      { text: '3.4651 and 3.4559', correct: false, why: 'The first rounds to 3.47, so the pair does not both round to 3.46.' },
      { text: '3.4628 and 3.4528', correct: false, why: 'The second rounds to 3.45 rather than 3.46.' },
      { text: '3.463 and 2.461', correct: false, why: 'The second number is around 2.46, not 3.46.' },
      { text: '3.4608 and 3.4551', correct: true }
    ],
    solution_text: 'Both 3.4608 and 3.4551 lie in the rounding interval $3.455\\le x<3.465$, so both round to 3.46.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The grouped table gives heights and frequencies. Which two extra columns are useful for estimating the mean?',
    structure: 'identify-columns-needed-for-grouped-mean',
    meaningfulCase: 'use-class-midpoint-and-midpoint-times-frequency',
    mastery: false,
    options: [
      { text: 'Midpoint and cumulative frequency', correct: false, why: 'Cumulative frequency is not needed for a grouped mean estimate.' },
      { text: 'Cumulative frequency and height times frequency', correct: false, why: 'Uses the wrong representative value for each class.' },
      { text: 'Midpoint and midpoint times frequency', correct: true },
      { text: 'Height times frequency and midpoint', correct: false, why: 'This repeats the needed quantities in the wrong conceptual order and omits the grouped midpoint column.' }
    ],
    solution_text: 'Estimate each class using its midpoint, then calculate midpoint times frequency and divide the total by the total frequency.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A map has scale $1:400$. How far in real life is 5 cm on the map?',
    structure: 'convert-map-scale-distance-to-real-distance',
    meaningfulCase: 'multiply-five-centimetres-by-four-hundred-and-convert-to-metres',
    mastery: false,
    options: [
      { text: '$2\\text{ m}$', correct: false, why: 'Uses a scale factor of 40 rather than 400.' },
      { text: '$20\\text{ m}$', correct: true },
      { text: '$200\\text{ m}$', correct: false, why: 'Converts centimetres to metres incorrectly by an extra factor of ten.' },
      { text: '$2000\\text{ m}$', correct: false, why: 'Fails to convert the scaled 2000 centimetres into 20 metres.' }
    ],
    solution_text: 'Real distance is $5\\times400=2000$ cm. Since $100$ cm is one metre, this is $20$ m.',
    diagramRequired: true,
    uncertainties: []
  }
]);
