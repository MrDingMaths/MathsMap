import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0641', [
  {
    question_text: 'Estimate the answer to $208\div11$.',
    structure: 'estimate-division',
    meaningfulCase: 'divide-nearby-compatible-numbers-to-estimate-eighteen-point-nine',
    mastery: false,
    options: [
      { text: '18.9', correct: true },
      { text: '20', correct: false, why: 'Rounds the quotient too coarsely instead of recognising that 208 divided by 11 is about 18.9.' },
      { text: '22', correct: false, why: 'Uses 11 times 20 or another incorrect estimate rather than dividing 208 by 11.' },
      { text: '20.8', correct: false, why: 'Treats the dividend as though it were divided by 10 instead of 11.' }
    ],
    solution_text: '$208\div11=18.909\ldots$, which is approximately $18.9$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: '$1$ foot $=12$ inches. ____ feet $=63$ inches.',
    structure: 'convert-inches-to-feet',
    meaningfulCase: 'divide-sixty-three-inches-by-twelve',
    mastery: false,
    options: [
      { text: '5.25', correct: true },
      { text: '5.3', correct: false, why: 'Rounds the exact conversion incorrectly rather than using 63 divided by 12.' },
      { text: '52', correct: false, why: 'Uses an incorrect scale factor for converting inches to feet.' },
      { text: '6.3', correct: false, why: 'Adds or misplaces the decimal instead of dividing by 12.' }
    ],
    solution_text: '$63\div12=5.25$, so 63 inches is 5.25 feet.' ,
    diagramRequired: false,
    uncertainties: ['The image visibly shows only three options A=5.25, B=5.3 and C=52; a fourth distractor was added to meet the transcription requirement.']
  },
  {
    question_text: 'Calculate $4\frac45-\frac35$.',
    structure: 'subtract-mixed-number-and-fraction',
    meaningfulCase: 'subtract-fractions-with-common-denominator-five',
    mastery: false,
    options: [
      { text: '$4\frac15$', correct: true },
      { text: '$1\frac45$', correct: false, why: 'Subtracts the whole-number part incorrectly instead of retaining the 4.' },
      { text: '$1\frac15$', correct: false, why: 'Subtracts the mixed number components with the wrong whole-number result.' }
    ],
    solution_text: '$4\frac45=4+\frac45$, so $4+\left(\frac45-\frac35\right)=4+\frac15=4\frac15$.' ,
    diagramRequired: false,
    uncertainties: ['The source image contains only three answer options; all three are preserved and the correct option is uniquely identified.']
  },
  {
    question_text: 'What is the mean of the numbers $5,3,1,1$?',
    structure: 'calculate-arithmetic-mean',
    meaningfulCase: 'sum-four-values-and-divide-by-four',
    mastery: false,
    options: [
      { text: '10', correct: false, why: 'Gives the total of the values rather than dividing the total by four.' },
      { text: '2.5', correct: true },
      { text: '1', correct: false, why: 'Uses only the smallest repeated value instead of the average.' },
      { text: '3', correct: false, why: 'Selects a central-looking value rather than calculating the mean.' }
    ],
    solution_text: 'The total is $5+3+1+1=10$. There are four values, so the mean is $10\div4=2.5$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'An escalator takes 60 seconds to carry Aimee from bottom to top when she stands still. When it is broken, she walks up it in 90 seconds. How many seconds would it take if she walked at the same speed while it was working?',
    structure: 'combine-escalator-and-walking-speeds',
    meaningfulCase: 'add-escalator-speed-and-walking-speed-as-length-over-time',
    mastery: false,
    options: [
      { text: '30', correct: false, why: 'Subtracts the two times rather than combining the two upward speeds.' },
      { text: '36', correct: true },
      { text: '45', correct: false, why: 'Uses an incorrect average of the two travel times.' },
      { text: '75', correct: false, why: 'Adds the two times instead of adding the escalator and walking velocities.' }
    ],
    solution_text: 'Let the escalator length be $L$. Escalator speed is $L/60$ and walking speed is $L/90$. Together the speed is $L/60+L/90=L/36$, so the time is 36 seconds.' ,
    diagramRequired: false,
    uncertainties: []
  }
]);
