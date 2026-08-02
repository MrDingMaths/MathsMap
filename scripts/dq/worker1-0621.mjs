import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0621', [
  {
    question_text: 'Put the following fractions in ascending order: $\frac12,\frac19,\frac15,\frac13$.',
    structure: 'order-unit-fractions',
    meaningfulCase: 'smaller-denominator-gives-larger-unit-fraction',
    mastery: false,
    options: [
      { text: '$\frac13,\frac12,\frac15,\frac19$', correct: false, why: 'Places one-half before one-third, so the fractions are not in ascending order.' },
      { text: '$\frac19,\frac15,\frac13,\frac12$', correct: true },
      { text: '$\frac19,\frac15,\frac13,\frac12$', correct: false, why: 'This option duplicates the correct ordering in the source image; the source has an ambiguity.' },
      { text: '$\frac12,\frac13,\frac15,\frac19$', correct: false, why: 'Lists the unit fractions in descending rather than ascending order.' }
    ],
    solution_text: 'For unit fractions, a larger denominator gives a smaller value. Therefore $\frac19<\frac15<\frac13<\frac12$. The source image appears to duplicate this ordering in options B and C; option B is retained as intended.' ,
    diagramRequired: false,
    uncertainties: ['Options B and C appear identical in the supplied image, both showing $\frac19,\frac15,\frac13,\frac12$. The source therefore has duplicate correct options; option B is retained as intended.']
  },
  {
    question_text: 'A train travels at 90 mph for 2 h 45 m. How far did it travel?',
    structure: 'calculate-distance-from-speed-and-time',
    meaningfulCase: 'convert-two-hours-forty-five-minutes-to-2.75-hours',
    mastery: false,
    options: [
      { text: '202.5 miles', correct: false, why: 'Uses 2.25 hours instead of converting 45 minutes to three quarters of an hour.' },
      { text: '247.5 miles', correct: true },
      { text: '270 miles', correct: false, why: 'Treats the 45 minutes as a full hour when multiplying by the speed.' },
      { text: '245 miles', correct: false, why: 'Uses an inaccurate conversion or multiplication for 2 hours 45 minutes.' }
    ],
    solution_text: 'The time is $2+45/60=2.75$ hours. Distance is $90\times2.75=247.5$ miles.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'An object travels 20 miles in 5 minutes. Calculate the average speed of the object in miles per hour (mph).',
    structure: 'convert-speed-from-miles-per-minute-to-mph',
    meaningfulCase: 'multiply-four-miles-per-minute-by-sixty-minutes-per-hour',
    mastery: false,
    options: [
      { text: '240 mph', correct: true },
      { text: '100 mph', correct: false, why: 'Multiplies distance and time rather than finding miles per minute and converting.' },
      { text: '0.25 mph', correct: false, why: 'Calculates minutes per mile instead of miles per hour.' },
      { text: '4 mph', correct: false, why: 'Finds 4 miles per minute but does not convert minutes to hours.' }
    ],
    solution_text: 'The speed is $20/5=4$ miles per minute. There are 60 minutes per hour, so $4\times60=240$ mph.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'A regular octadecagon has 18 sides. Work out the size of each exterior angle.',
    structure: 'find-exterior-angle-of-regular-polygon',
    meaningfulCase: 'divide-full-turn-by-eighteen-equal-exterior-angles',
    mastery: false,
    options: [
      { text: '$200^\circ$', correct: false, why: 'Uses an angle larger than a straight angle for one exterior angle.' },
      { text: '$160^\circ$', correct: false, why: 'Confuses the interior-angle calculation with the exterior angle.' },
      { text: '$20^\circ$', correct: true },
      { text: '$10^\circ$', correct: false, why: 'Divides the full turn by the wrong number of equal exterior angles.' }
    ],
    solution_text: 'The exterior angles of a regular polygon sum to $360^\circ$. Each is $360^\circ\div18=20^\circ$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Calculate $8.8+9.3$.',
    structure: 'add-decimal-numbers',
    meaningfulCase: 'align-decimal-places-before-adding',
    mastery: false,
    options: [
      { text: '17.9', correct: false, why: 'Subtracts or misaligns the decimal values instead of adding them.' },
      { text: '18.1', correct: true },
      { text: '18.3', correct: false, why: 'Adds the tenths digits incorrectly.' },
      { text: '19.1', correct: false, why: 'Makes an addition error in the units or tenths column.' }
    ],
    solution_text: 'Add the whole and decimal parts: $8.8+9.3=18.1$.' ,
    diagramRequired: false,
    uncertainties: []
  }
]);
