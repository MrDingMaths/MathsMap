import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0611', [
  {
    question_text: 'A vehicle travels 2400 metres in 2 minutes. What is its speed in metres per second?',
    structure: 'calculate-speed-with-unit-conversion',
    meaningfulCase: 'convert-two-minutes-to-one-hundred-twenty-seconds-before-dividing',
    mastery: false,
    options: [
      { text: '$20\,m/s$', correct: true },
      { text: '$12\,m/s$', correct: false, why: 'Divides 2400 by 2 without converting minutes to seconds.' },
      { text: '$1200\,m/s$', correct: false, why: 'Uses the two-minute value incorrectly as a divisor after conversion.' },
      { text: '$40\,m/s$', correct: false, why: 'Uses an incorrect conversion or division for the elapsed time.' }
    ],
    solution_text: 'Two minutes is $120$ seconds. The speed is $2400\div120=20\,m/s$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'There are 200 people in a cinema. 25% are men, $\frac15$ are women, and the rest are children. Work out how many children are in the cinema.',
    structure: 'find-remainder-after-percentages-and-fractions',
    meaningfulCase: 'subtract-fifty-men-and-forty-women-from-total',
    mastery: false,
    options: [
      { text: '110', correct: true },
      { text: '50', correct: false, why: 'Calculates the number of men rather than the number of children.' },
      { text: '40', correct: false, why: 'Calculates the number of women rather than the remaining children.' },
      { text: '90', correct: false, why: 'Subtracts only one of the two non-child groups from the total.' }
    ],
    solution_text: 'Men: $25\%$ of 200 is 50. Women: $\frac15$ of 200 is 40. Children: $200-50-40=110$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'The data is in ascending order: $y,7,25,x,37,40$. Write an expression for the range.',
    structure: 'find-range-from-ordered-algebraic-data',
    meaningfulCase: 'subtract-smallest-first-term-from-largest-last-term',
    mastery: false,
    options: [
      { text: '$40-y$', correct: true },
      { text: '$x-25$', correct: false, why: 'Uses two middle values rather than the maximum and minimum.' },
      { text: '$y-40$', correct: false, why: 'Reverses the order of maximum minus minimum for the range.' },
      { text: '$\frac{109+y+x}{6}$', correct: false, why: 'This is related to an average, not the range of the data.' }
    ],
    solution_text: 'In ascending order, the minimum is $y$ and maximum is 40. Therefore the range is $40-y$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: '$607\,g=\ldots\,kg$',
    structure: 'convert-grams-to-kilograms',
    meaningfulCase: 'divide-grams-by-one-thousand',
    mastery: false,
    options: [
      { text: '$6.7\,kg$', correct: false, why: 'Moves the decimal point in the wrong direction and gives too many kilograms.' },
      { text: '$6.07\,kg$', correct: false, why: 'Fails to divide the gram value by 1000 correctly.' },
      { text: '$0.67\,kg$', correct: false, why: 'Uses an incorrect place-value conversion from grams to kilograms.' },
      { text: '$0.607\,kg$', correct: true }
    ],
    solution_text: 'Since $1000\,g=1\,kg$, $607\div1000=0.607\,kg$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Tom and Katie are discussing similarity. Tom’s rectangles have dimensions 4 cm by 6 cm and 6 cm by 9 cm. Katie’s rectangles have dimensions 4 cm by 6 cm and 8 cm by 10 cm. Who is correct?',
    structure: 'test-similarity-by-corresponding-side-ratios',
    meaningfulCase: 'compare-width-to-height-ratios-for-both-rectangle-pairs',
    mastery: false,
    options: [
      { text: 'Only Tom', correct: true },
      { text: 'Only Katie', correct: false, why: 'Katie’s second rectangle has ratio 8:10, unlike the first ratio 4:6.' },
      { text: 'Both Tom and Katie', correct: false, why: 'The corresponding side ratios do not match for Katie’s rectangles.' },
      { text: 'Neither is correct', correct: false, why: 'Tom’s rectangles both have ratio 2:3 and are similar.' }
    ],
    solution_text: 'Tom’s ratio is $4/6=2/3$ and $6/9=2/3$, so his rectangles are similar. Katie’s ratios are $4/6=2/3$ and $8/10=4/5$, so hers are not. Only Tom is correct.' ,
    diagramRequired: true,
    uncertainties: []
  }
]);
