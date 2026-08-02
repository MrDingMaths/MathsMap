import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0301', [
  {
    question_text: 'The shape is made from centimetre cubes. What is its volume?',
    structure: 'count-unit-cubes-to-find-volume',
    meaningfulCase: 'count-four-visible-one-cubic-centimetre-cubes',
    mastery: false,
    options: [
      { text: '$24\\text{ cm}^3$', correct: false, why: 'Counts too many cubes compared with the four unit cubes in the displayed shape.' },
      { text: '$18\\text{ cm}^3$', correct: false, why: 'Uses an incorrect cube count and therefore overestimates the volume.' },
      { text: '$4\\text{ cm}^3$', correct: true },
      { text: '$8\\text{ cm}^3$', correct: false, why: 'Doubles the number of one-cubic-centimetre cubes shown.' }
    ],
    solution_text: 'Each centimetre cube has volume $1\\text{ cm}^3$. Counting the four cubes gives volume $4\\times1=4\\text{ cm}^3$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: '56 students were asked whether they watched tennis. There were 20 boys, 13 boys did not watch tennis, and 17 girls watched tennis. What number should replace the star in the frequency tree?',
    structure: 'complete-frequency-tree-from-complementary-counts',
    meaningfulCase: 'subtract-girls-who-watched-from-total-girls',
    mastery: false,
    options: [
      { text: '13', correct: false, why: 'This is the number of boys who did not watch tennis, not the starred girls count.' },
      { text: '19', correct: true },
      { text: '17', correct: false, why: 'This is the number of girls who watched tennis, which is a different branch.' },
      { text: '7', correct: false, why: 'Does not use the total girls count and gives the wrong complement.' }
    ],
    solution_text: 'There are $56-20=36$ girls. Of these, 17 watched tennis, so the number of girls who did not watch is $36-17=19$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'In a regular hexagon $PQRSTW$, vectors $u$ and $v$ are represented by $\\overrightarrow{PW}$ and $\\overrightarrow{PQ}$. What is $\\overrightarrow{SW}$ in terms of $u$ and $v$?',
    structure: 'express-hexagon-vector-in-basis-vectors',
    meaningfulCase: 'trace-from-s-to-w-using-pw-and-pq-directions',
    mastery: false,
    options: [
      { text: '$-u-2v$', correct: true },
      { text: '$-u-v$', correct: false, why: 'Uses one too few copies of the horizontal basis vector $v$.' },
      { text: '$u-v$', correct: false, why: 'Has the wrong direction for the vertical component of the displacement.' },
      { text: '$u+2v$', correct: false, why: 'Reverses the direction of the required vector from S to W.' }
    ],
    solution_text: 'Using coordinates with $v$ horizontal and $u$ directed from P to W, moving from S to W is one step opposite to $u$ and two steps opposite to $v$. Thus $\\overrightarrow{SW}=-u-2v$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which angle is allied (co-interior) to angle $p$?',
    structure: 'identify-co-interior-angle-between-parallel-lines',
    meaningfulCase: 'choose-interior-angle-on-same-side-of-transversal',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'A is at the same intersection as p, so it is not the co-interior angle.' },
      { text: 'B', correct: false, why: 'B is exterior to the pair of parallel lines rather than interior.' },
      { text: 'C', correct: false, why: 'C is interior but lies on the opposite side of the transversal.' },
      { text: 'D', correct: true }
    ],
    solution_text: 'Co-interior angles lie between the parallel lines and on the same side of the transversal. The angle in that position at the right intersection is D.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which inequalities describe the region $R$?',
    structure: 'read-inclusive-and-exclusive-boundaries-from-region',
    meaningfulCase: 'solid-boundaries-inclusive-and-dashed-boundaries-exclusive',
    mastery: false,
    options: [
      { text: '$1\\le x<5$ and $-1\\le y<3$', correct: false, why: 'Uses the wrong inclusion status for both horizontal boundary lines.' },
      { text: '$1\\le x\\le5$ and $-1<y\\le3$', correct: false, why: 'Includes the dashed right boundary $x=5$, which is excluded.' },
      { text: '$1\\le x<5$ and $-1<y\\le3$', correct: true },
      { text: '$1<x<5$ and $-1<y\\le3$', correct: false, why: 'Excludes the solid left boundary $x=1$, which belongs to the region.' }
    ],
    solution_text: 'The solid boundaries $x=1$ and $y=3$ are included. The dashed boundaries $x=5$ and $y=-1$ are excluded. Hence $1\\le x<5$ and $-1<y\\le3$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
