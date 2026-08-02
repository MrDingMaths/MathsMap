import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0601', [
  {
    question_text: 'A reflection in which line would result in exactly two vertices being invariant?',
    structure: 'count-invariant-vertices-under-reflection',
    meaningfulCase: 'count-shape-vertices-lying-on-each-candidate-mirror-line',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'The vertical line x=2 does not pass through any vertex of the shape.' },
      { text: 'B', correct: false, why: 'The diagonal mirror line does not pass through exactly two of the shape’s vertices.' },
      { text: 'C', correct: true },
      { text: 'D', correct: false, why: 'The vertical line x=8 also appears to pass through two vertices, making the source diagram ambiguous.' }
    ],
    solution_text: 'Vertices on the mirror line remain invariant. The horizontal line $y=4$ passes through the two lower vertices, so it gives exactly two invariant vertices. The drawn vertical line $x=8$ also appears to pass through two vertices, so the source is ambiguous; option C is retained as the intended keyed answer.' ,
    diagramRequired: true,
    uncertainties: ['Both the horizontal line C ($y=4$) and vertical line D ($x=8$) appear to pass through two vertices in the supplied diagram. The item therefore seems to have two valid answers; option C is retained as intended.']
  },
  {
    question_text: 'Find the missing number using these clues: it is not less than 5000; it has 6 tens; the digit in the ones column is smaller than 8; it is an even number. Options are 5467, 6392, 7564 and 4362.',
    structure: 'filter-number-options-by-place-value-clues',
    meaningfulCase: 'apply-thousands-tens-ones-and-parity-conditions',
    mastery: false,
    options: [
      { text: '5467', correct: false, why: 'Its tens digit is 6 but its ones digit is odd, so it is not even.' },
      { text: '6392', correct: false, why: 'It is at least 5000 and even, but its tens digit is 9 rather than 6.' },
      { text: '7564', correct: true },
      { text: '4362', correct: false, why: 'Its tens digit and parity fit, but the number is less than 5000.' }
    ],
    solution_text: '$7564$ is at least 5000, has tens digit 6, has ones digit 4 which is less than 8, and is even. The answer is $7564$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'On Monday, Molly walked from her home to school. What was Molly’s speed, in kilometres per minute, during minutes 15 to 30 of her journey?',
    structure: 'find-speed-from-distance-time-graph',
    meaningfulCase: 'calculate-gradient-of-final-distance-time-segment',
    mastery: false,
    options: [
      { text: '$0.133\ldots\,km/min$', correct: true },
      { text: '$7.5\,km/min$', correct: false, why: 'Uses time divided by distance rather than distance divided by time.' },
      { text: '$2\,km/min$', correct: false, why: 'Uses the total distance change without dividing by the 15-minute interval.' },
      { text: '$30\,km/min$', correct: false, why: 'Uses the endpoint time value instead of the gradient of the graph segment.' }
    ],
    solution_text: 'From 15 to 30 minutes, distance increases from 1 km to 3 km. Speed is $\frac{3-1}{30-15}=\frac{2}{15}=0.133\ldots$ km/min.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'How many vertices would be invariant if the shape was reflected in the line shown?',
    structure: 'count-invariant-vertices-on-reflection-line',
    meaningfulCase: 'check-whether-any-vertices-lie-on-horizontal-mirror-line',
    mastery: false,
    options: [
      { text: '0', correct: true },
      { text: '1', correct: false, why: 'The shown horizontal line does not pass through just one vertex.' },
      { text: '2', correct: false, why: 'The shape’s vertices are above the shown line rather than lying on it.' },
      { text: '4', correct: false, why: 'All four vertices would be invariant only if all lay on the mirror line.' }
    ],
    solution_text: 'A vertex is invariant only if it lies on the reflection line. The shown line is below all four vertices, so none are invariant.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A scale drawing has scale 1:40. Which statement about the original shape is correct? $LM=12$ cm, $MN=4$ cm, $OP=8$ cm and $LP=7$ cm.',
    structure: 'convert-scale-drawing-lengths',
    meaningfulCase: 'multiply-drawing-centimetres-by-forty-and-convert-to-metres',
    mastery: false,
    options: [
      { text: '$LM=4.8\,m$', correct: true },
      { text: '$MN=0.16\,m$', correct: false, why: 'The 4 cm drawing length scales to 160 cm, which is 1.6 m rather than 0.16 m.' },
      { text: '$OP=32\,m$', correct: false, why: 'The 8 cm drawing length scales to 320 cm, which is 3.2 m rather than 32 m.' },
      { text: '$LP=280\,m$', correct: false, why: 'The 7 cm drawing length scales to 280 cm, which is 2.8 m rather than 280 m.' }
    ],
    solution_text: 'For scale 1:40, multiply 12 cm by 40 to get 480 cm. Since 100 cm is 1 m, $LM=4.8$ m.' ,
    diagramRequired: true,
    uncertainties: []
  }
]);
