import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0551', [
  {
    question_text: 'A coat costs £40 in a 20% off sale. How much did it cost before the sale?',
    structure: 'reverse-percentage-discount',
    meaningfulCase: 'sale-price-is-eighty-percent-of-original-price',
    mastery: false,
    options: [
      { text: '£32', correct: false, why: 'Applies the discount to the sale price instead of reversing it.' },
      { text: '£50', correct: true },
      { text: '£60', correct: false, why: 'Uses an incorrect percentage multiplier for the original price.' },
      { text: '£48', correct: false, why: 'Adds 20 percent of the sale price rather than dividing by 0.8.' }
    ],
    solution_text: 'A 20% discount means £40 is 80% of the original price. The original price is $40\div0.8=£50$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Complete the statement: A cuboid has ____ edges.',
    structure: 'count-edges-of-cuboid',
    meaningfulCase: 'recognise-twelve-edges-in-three-groups-of-four',
    mastery: false,
    options: [
      { text: '6', correct: false, why: 'Confuses the number of faces of a cuboid with its number of edges.' },
      { text: '8', correct: false, why: 'Confuses the number of vertices of a cuboid with its number of edges.' },
      { text: '12', correct: true },
      { text: '4', correct: false, why: 'Counts only one set of parallel edges and misses the other two sets.' }
    ],
    solution_text: 'A cuboid has four edges on each of three rectangular levels, giving $3\times4=12$ edges.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What is the gradient of this line?',
    structure: 'find-gradient-from-line-graph',
    meaningfulCase: 'use-rise-over-run-between-intercepts',
    mastery: false,
    options: [
      { text: '$-\frac{1}{5}$', correct: false, why: 'Uses the wrong vertical change for the horizontal run shown.' },
      { text: '$-\frac{2}{5}$', correct: true },
      { text: '$-5$', correct: false, why: 'Inverts the magnitude of the gradient from run over rise.' },
      { text: '$-2.5$', correct: false, why: 'Uses an incorrect ratio for the line’s fall from y=2 to y=0.' }
    ],
    solution_text: 'The line passes through $(0,2)$ and $(5,0)$. Its gradient is $\frac{0-2}{5-0}=-\frac25$.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'There are 24 people in the last group. What is the frequency density of the last group?',
    structure: 'find-frequency-density-from-histogram',
    meaningfulCase: 'divide-frequency-by-last-class-width-seventy-to-one-hundred',
    mastery: false,
    options: [
      { text: '0.8', correct: true },
      { text: '0.4', correct: false, why: 'Uses an incorrect class width when dividing the frequency.' },
      { text: '0.08', correct: false, why: 'Places the decimal point incorrectly in the frequency-density calculation.' },
      { text: '720', correct: false, why: 'Multiplies frequency and class width instead of dividing.' }
    ],
    solution_text: 'The last class runs from 70 to 100 seconds, so its width is 30. Frequency density is $24\div30=0.8$.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which of these shapes is a pyramid?',
    structure: 'identify-pyramid-from-3d-shapes',
    meaningfulCase: 'recognise-solid-with-polygonal-base-and-triangular-faces-meeting-at-apex',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'This is a cuboid with rectangular faces rather than a pyramid.' },
      { text: 'B', correct: true },
      { text: 'C', correct: false, why: 'This solid is a cone with a circular base, not a polygonal pyramid.' },
      { text: 'D', correct: false, why: 'This solid is a cylinder with two circular bases, not a pyramid.' }
    ],
    solution_text: 'Shape B is a pyramid: it has a polygonal base and triangular faces meeting at a single apex.' ,
    diagramRequired: true,
    uncertainties: []
  }
]);
