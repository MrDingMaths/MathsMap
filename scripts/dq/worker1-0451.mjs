import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0451', [
  {
    question_text: 'What number is shown by the place-value blocks?',
    structure: 'read-number-from-base-ten-place-value-blocks',
    meaningfulCase: 'count-hundreds-tens-and-ones-blocks',
    mastery: false,
    options: [
      { text: 'CDLXXXVIII', correct: false, why: 'Represents 488 and undercounts the hundreds shown by the blocks.' },
      { text: 'DLXXXVIII', correct: true },
      { text: 'DCLXXXVIII', correct: false, why: 'Represents 688 and adds an extra hundred block.' },
      { text: 'DLXXVIII', correct: false, why: 'Represents 578 and miscounts the tens blocks.' }
    ],
    solution_text: 'The blocks represent 5 hundreds, 8 tens, and 8 ones, giving $500+80+8=588$, which is $DLXXXVIII$ in Roman numerals.',
    diagramRequired: true,
    uncertainties: ['The small unit blocks are crowded in the image, but the intended total is 588.']
  },
  {
    question_text: 'Germany won 7 bronze medals. In the pie chart the bronze sector is $84^\\circ$ and the silver sector is $156^\\circ$. How many silver medals did Germany win?',
    structure: 'use-pie-chart-angle-to-scale-category-count',
    meaningfulCase: 'compare-silver-angle-to-bronze-angle-and-multiply-by-seven',
    mastery: false,
    options: [
      { text: '13', correct: true },
      { text: '156', correct: false, why: 'Uses the sector angle as a medal count instead of scaling the known count.' },
      { text: '12', correct: false, why: 'Rounds the proportional result incorrectly.' },
      { text: 'Impossible to say', correct: false, why: 'The known sector angle and bronze count determine the silver count.' }
    ],
    solution_text: 'The scale is $7/84=1/12$ medal per degree. Silver medals $=156/12=13$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which answer best describes the shaded region? It is inside the circular boundary centred at R with radius 6 cm and below the line 5 cm from PQ.',
    structure: 'interpret-region-using-distance-conditions',
    meaningfulCase: 'within-six-centimetres-of-r-and-more-than-five-from-pq',
    mastery: false,
    options: [
      { text: 'Less than 5 cm from PQ and within 6 cm of R', correct: false, why: 'The shaded region lies below the 5 cm boundary, so its distance from PQ is greater.' },
      { text: 'More than 5 cm from PQ and more than 6 cm from R', correct: false, why: 'The region is inside the radius-6 circle, not outside it.' },
      { text: 'Less than 5 cm from PQ and more than 6 cm from R', correct: false, why: 'Reverses both distance conditions indicated by the shading.' },
      { text: 'More than 5 cm from PQ and within 6 cm of R', correct: true }
    ],
    solution_text: 'The shaded points are below the horizontal line, so they are more than 5 cm from PQ, and they lie inside the arc, so they are within 6 cm of R.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which sketch graph represents $y=x^3-1$?',
    structure: 'identify-translated-cubic-graph',
    meaningfulCase: 'recognise-cubic-shifted-down-one-with-y-intercept-minus-one',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'Has the wrong decreasing orientation for a positive-leading-coefficient cubic.' },
      { text: 'B', correct: false, why: 'Shows a y-intercept above zero rather than the required value -1.' },
      { text: 'C', correct: false, why: 'Passes through the origin instead of having y-intercept -1.' },
      { text: 'D', correct: true }
    ],
    solution_text: 'The graph of $x^3$ is shifted down by 1, so it passes through $(0,-1)$ and has its x-intercept at $x=1$. This is sketch D.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Peter and Jane have money in the ratio $1:3$. Jane has £12 more than Peter. How much money does Peter have?',
    structure: 'solve-ratio-problem-from-difference-between-parts',
    meaningfulCase: 'two-ratio-parts-correspond-to-twelve-pound-difference',
    mastery: false,
    options: [
      { text: '£4', correct: false, why: 'Treats the difference as three parts rather than the two-part gap.' },
      { text: '£3', correct: false, why: 'Divides the difference by four instead of by the difference in ratio parts.' },
      { text: '£18', correct: false, why: 'Uses the total or an incorrect multiple rather than Peter’s one part.' },
      { text: '£6', correct: true }
    ],
    solution_text: 'The difference between 3 parts and 1 part is 2 parts, worth £12. Thus 1 part is £6, so Peter has £6.',
    diagramRequired: true,
    uncertainties: []
  }
]);
