import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0321', [
  {
    question_text: 'What is the approximate mass of the kitten shown on the scale?',
    structure: 'read-approximate-mass-from-analogue-scale',
    meaningfulCase: 'read-pointer-between-labelled-hundred-gram-divisions',
    mastery: false,
    options: [
      { text: '$800\\text{ g}$', correct: false, why: 'Reads the pointer at the nearest large labelled mark rather than its intermediate position.' },
      { text: '$845\\text{ g}$', correct: true },
      { text: '$945\\text{ g}$', correct: false, why: 'Places the pointer near the 900 gram region instead of around 845 grams.' },
      { text: '$825\\text{ g}$', correct: false, why: 'Underestimates the pointer reading by choosing the wrong minor division.' }
    ],
    solution_text: 'The pointer lies between 800 g and 900 g, close to the 845 g mark. The approximate mass is $845\\text{ g}$.',
    diagramRequired: true,
    uncertainties: ['The small analogue-scale divisions are low resolution, so the reading is approximate.']
  },
  {
    question_text: 'Which of these shapes has 6 square faces?',
    structure: 'identify-cube-by-number-of-square-faces',
    meaningfulCase: 'distinguish-cube-from-cuboid-and-pyramid',
    mastery: false,
    options: [
      { text: 'Cuboid', correct: false, why: 'A general cuboid has rectangular faces, not six square faces unless it is a cube.' },
      { text: 'Cube', correct: true },
      { text: 'Square-based pyramid', correct: false, why: 'A square-based pyramid has one square base and four triangular faces.' },
      { text: 'None of these', correct: false, why: 'The cube shown has exactly six square faces.' }
    ],
    solution_text: 'A cube has six faces and every face is a square, so the correct shape is the cube.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'In the Venn diagram, set A contains left-handed students and set B contains vegetarians. What is the probability that a randomly chosen student is a right-handed vegetarian?',
    structure: 'read-intersection-complement-from-venn-diagram',
    meaningfulCase: 'use-b-only-count-over-total-population',
    mastery: false,
    options: [
      { text: '$\\dfrac{45}{200}$', correct: true },
      { text: '$\\dfrac{45}{115}$', correct: false, why: 'Uses the number outside set A as the denominator instead of the whole year group.' },
      { text: '$\\dfrac{15}{115}$', correct: false, why: 'Uses the intersection count rather than right-handed vegetarians in set B only.' },
      { text: '$\\dfrac{25}{200}$', correct: false, why: 'Uses the left-handed-only region rather than the right-handed vegetarian region.' }
    ],
    solution_text: 'Right-handed vegetarians are in B but not A, giving 45 students. The total is $25+15+45+115=200$, so the probability is $45/200$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'There are 6 pencils in a pack. If $T=6p$, what is the total number of pencils in 3 packs?',
    structure: 'evaluate-linear-formula-for-given-input',
    meaningfulCase: 'substitute-three-packs-into-six-times-p',
    mastery: false,
    options: [
      { text: '9', correct: false, why: 'Adds the number of packs to the pencils per pack instead of multiplying.' },
      { text: '2', correct: false, why: 'Divides the two given numbers rather than evaluating the formula.' },
      { text: '18', correct: true },
      { text: '63', correct: false, why: 'Uses an arithmetic operation that is not represented by $T=6p$.' }
    ],
    solution_text: 'Substitute $p=3$ into $T=6p$: $T=6\\times3=18$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which equation gives the graph shown?',
    structure: 'identify-vertical-translation-of-sine-graph',
    meaningfulCase: 'recognise-midline-minus-one-and-amplitude-one',
    mastery: false,
    options: [
      { text: '$y=\\sin(x)-1$', correct: true },
      { text: '$y=\\sin(x+1)$', correct: false, why: 'A horizontal phase shift does not lower the entire sine graph by one.' },
      { text: '$y=\\sin(x-1)$', correct: false, why: 'This is a horizontal shift and does not match the graph’s vertical midline.' },
      { text: '$y=\\sin(x)+1$', correct: false, why: 'Shifts the sine graph upward, whereas the displayed midline is at y=-1.' }
    ],
    solution_text: 'The graph has amplitude 1 and midline $y=-1$, with maximum 0 and minimum -2. Therefore its equation is $y=\\sin(x)-1$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
