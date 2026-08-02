import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0461', [
  {
    question_text: 'How should you join the points on a frequency polygon?',
    structure: 'construct-frequency-polygon-by-joining-plotted-points',
    meaningfulCase: 'use-straight-line-segments-between-successive-points',
    mastery: false,
    options: [
      { text: 'A straight line from point to point', correct: true },
      { text: 'Line of best fit', correct: false, why: 'A frequency polygon connects adjacent plotted frequencies rather than fitting an average trend.' },
      { text: 'A smooth curve through each point', correct: false, why: 'Smoothing the points would no longer show the polygonal frequency representation.' },
      { text: 'You should not join them up', correct: false, why: 'Joining consecutive points is the defining construction of a frequency polygon.' }
    ],
    solution_text: 'A frequency polygon is formed by joining consecutive frequency points with straight line segments.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which number is $5/8$ more than $0.5$?',
    structure: 'add-fraction-to-decimal',
    meaningfulCase: 'convert-zero-point-five-to-eighths-before-adding',
    mastery: false,
    options: [
      { text: '$\\dfrac6{10}$', correct: false, why: 'Adds only one tenth rather than the required five eighths.' },
      { text: '$\\dfrac98$', correct: true },
      { text: '1.08', correct: false, why: 'Adds the fraction and decimal incorrectly.' },
      { text: '0.1125', correct: false, why: 'Multiplies or shifts the decimal instead of adding five eighths.' }
    ],
    solution_text: '$0.5=1/2=4/8$. Therefore $4/8+5/8=9/8$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Tina, David and Bing share gold coins in the ratio $3:5:8$. David gets 80 more coins than Tina. How many coins did Bing get?',
    structure: 'solve-three-part-ratio-from-difference',
    meaningfulCase: 'use-two-part-difference-as-eighty-and-scale-eight-parts',
    mastery: false,
    options: [
      { text: '128', correct: false, why: 'Uses too few ratio parts for Bing’s share.' },
      { text: '320', correct: true },
      { text: '40', correct: false, why: 'Finds the value of one ratio part rather than Bing’s eight parts.' },
      { text: '48', correct: false, why: 'Uses an unrelated multiplication of the ratio difference.' }
    ],
    solution_text: 'David minus Tina is $5-3=2$ parts, worth 80, so one part is 40. Bing has $8\\times40=320$ coins.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Simplify $\\dfrac{x+1}{x^2+4x+3}$, if possible.',
    structure: 'simplify-algebraic-fraction-by-factorising-denominator',
    meaningfulCase: 'factorise-x-squared-plus-four-x-plus-three-and-cancel',
    mastery: false,
    options: [
      { text: '$\\dfrac1{x+3}$', correct: true },
      { text: '$x+3$', correct: false, why: 'Cancels the common factor in the wrong direction and loses the denominator.' },
      { text: '$\\dfrac1{x+7}$', correct: false, why: 'Factors the quadratic incorrectly as if its roots summed to 7.' },
      { text: 'Does not simplify', correct: false, why: 'The denominator factors as $(x+1)(x+3)$, so a common factor cancels.' }
    ],
    solution_text: '$x^2+4x+3=(x+1)(x+3)$, so $\\dfrac{x+1}{(x+1)(x+3)}=\\dfrac1{x+3}$, with $x\\ne-1,-3$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Evaluate $\\dfrac{(-3)\\times(-2)}{-0.2}$.',
    structure: 'evaluate-signed-decimal-division',
    meaningfulCase: 'positive-numerator-divided-by-negative-zero-point-two',
    mastery: false,
    options: [
      { text: '$-30$', correct: true },
      { text: '$-3$', correct: false, why: 'Does not account for the decimal divisor being one fifth.' },
      { text: '30', correct: false, why: 'Gets the magnitude but loses the negative sign from the denominator.' },
      { text: '3', correct: false, why: 'Miscomputes both the scale of the decimal division and the sign.' }
    ],
    solution_text: 'The numerator is 6. Since $6/(-0.2)=6/(-1/5)=-30$, the value is $-30$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
