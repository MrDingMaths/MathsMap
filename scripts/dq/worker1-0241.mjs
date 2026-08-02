import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0241', [
  {
    question_text: 'Convert $\\dfrac{3\\pi}{2}$ from radians to degrees.',
    structure: 'convert-radians-to-degrees',
    meaningfulCase: 'multiply-radian-measure-by-180-over-pi',
    mastery: false,
    options: [
      { text: '$330^\\circ$', correct: false, why: 'Uses the nearby fourth-quadrant angle rather than the given three-half-pi angle.' },
      { text: '$210^\\circ$', correct: false, why: 'Subtracts from a full turn incorrectly and changes the quadrant.' },
      { text: '$270^\\circ$', correct: true },
      { text: '$240^\\circ$', correct: false, why: 'Does not apply the exact radians-to-degrees conversion factor.' }
    ],
    solution_text: 'Use $1\\text{ rad}=180^\\circ/\\pi$: $\\dfrac{3\\pi}{2}\\times\\dfrac{180^\\circ}{\\pi}=270^\\circ$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What is the area of this L-shaped room in $\\text{m}^2$? Its outside dimensions are $300\\text{ cm}$ high and $110\\text{ cm}$ wide at the upper section; the lower section extends $2.5\\text{ m}$ beyond it and is $1\\text{ m}$ high.',
    structure: 'calculate-area-of-l-shaped-region-with-unit-conversion',
    meaningfulCase: 'convert-centimetres-to-metres-and-split-l-shape',
    mastery: false,
    options: [
      { text: '$58\\text{ m}^2$', correct: false, why: 'Keeps the centimetre measurements at the wrong scale when calculating area.' },
      { text: '$7.6\\text{ m}^2$', correct: false, why: 'Uses an incorrect decomposition or combines the converted lengths incorrectly.' },
      { text: '$5.8\\text{ m}^2$', correct: true },
      { text: '$82.5\\text{ m}^2$', correct: false, why: 'Treats the labelled lengths as if they formed a much larger rectangle.' }
    ],
    solution_text: 'Convert $300\\text{ cm}=3\\text{ m}$ and $110\\text{ cm}=1.1\\text{ m}$. Split the shape into a $1.1\\text{ m}\\times3\\text{ m}$ rectangle and a $2.5\\text{ m}\\times1\\text{ m}$ rectangle: $3.3+2.5=5.8\\text{ m}^2$. However, the image answer options show $5.8\\text{ m}^2$ as option C; therefore the correct option is C.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Tommy went to sleep at 19:50 and woke at 06:35. How long was Tommy asleep?',
    structure: 'calculate-elapsed-time-across-midnight',
    meaningfulCase: 'add-time-from-evening-to-midnight-and-morning',
    mastery: false,
    options: [
      { text: '11 hours, 45 minutes', correct: false, why: 'Adds an extra hour to the correctly calculated overnight interval.' },
      { text: '10 hours, 45 minutes', correct: true },
      { text: '13 hours, 15 minutes', correct: false, why: 'Adds an extra hour and thirty minutes to the actual elapsed time.' },
      { text: '8 hours, 45 minutes', correct: false, why: 'Uses only part of the interval and misses the time before midnight.' }
    ],
    solution_text: 'From 19:50 to midnight is 4 hours 10 minutes. From midnight to 06:35 is 6 hours 35 minutes. The total is $4\\text{ h }10\\text{ min}+6\\text{ h }35\\text{ min}=10\\text{ h }45\\text{ min}$. The displayed answer choices and source image appear inconsistent with this calculation; the mathematically correct duration is 10 hours, 45 minutes.',
    diagramRequired: true,
    uncertainties: ['The displayed options mark 11 hours 45 minutes as A, but the times 19:50 to 06:35 give 10 hours 45 minutes.']
  },
  {
    question_text: 'Solve the equation $\\dfrac{3}{x}+\\dfrac{11}{x}=7$.',
    structure: 'solve-equation-with-common-algebraic-denominator',
    meaningfulCase: 'combine-numerators-over-nonzero-denominator',
    mastery: false,
    options: [
      { text: '$x=\\dfrac12$', correct: false, why: 'Does not combine the two fractions correctly before solving for x.' },
      { text: '$x=2$', correct: true },
      { text: '$x=1$', correct: false, why: 'Treats the numerator total as if it directly equalled the denominator.' },
      { text: '$x=7$', correct: false, why: 'Uses the right-hand side as the solution without isolating the denominator.' }
    ],
    solution_text: '$\\dfrac{3}{x}+\\dfrac{11}{x}=\\dfrac{14}{x}=7$. Since $x\\ne0$, multiply by $x$: $14=7x$, so $x=2$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Convert $330^\\circ$ from degrees to radians.',
    structure: 'convert-degrees-to-radians',
    meaningfulCase: 'multiply-degree-measure-by-pi-over-180',
    mastery: false,
    options: [
      { text: '$\\dfrac{10\\pi}{6}$', correct: false, why: 'Simplifies to $5\\pi/3$, which represents 300 degrees rather than 330 degrees.' },
      { text: '$\\dfrac{7\\pi}{6}$', correct: false, why: 'Represents 210 degrees, so it is too small for the given angle.' },
      { text: '$\\dfrac{\\pi}{6}$', correct: false, why: 'Represents only 30 degrees and omits nearly a full turn.' },
      { text: '$\\dfrac{11\\pi}{6}$', correct: true }
    ],
    solution_text: 'Convert using $330^\\circ\\times\\dfrac{\\pi}{180^\\circ}=\\dfrac{330\\pi}{180}=\\dfrac{11\\pi}{6}$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
