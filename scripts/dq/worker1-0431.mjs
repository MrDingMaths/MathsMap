import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0431', [
  {
    question_text: 'Calculate the surface area of the cuboid with dimensions $3\\text{ cm}$, $5\\text{ cm}$, and $8\\text{ cm}$.',
    structure: 'calculate-cuboid-surface-area-from-three-dimensions',
    meaningfulCase: 'sum-three-pairwise-face-areas-and-double',
    mastery: false,
    options: [
      { text: '$79\\text{ cm}^2$', correct: false, why: 'Does not include all three pairs of rectangular faces.' },
      { text: '$120\\text{ cm}^2$', correct: false, why: 'Uses an incomplete combination of the three dimensions.' },
      { text: '$158\\text{ cm}^2$', correct: true },
      { text: '$240\\text{ cm}^2$', correct: false, why: 'Overcounts the face areas when forming the total surface area.' }
    ],
    solution_text: 'Surface area $=2(3\\times5+3\\times8+5\\times8)=2(15+24+40)=158\\text{ cm}^2$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The table gives values for $y=3+2x$. What should replace the star when $x=0$?',
    structure: 'complete-linear-function-value-table',
    meaningfulCase: 'substitute-zero-input-to-get-y-intercept',
    mastery: false,
    options: [
      { text: '5', correct: false, why: 'Adds 2 to the constant instead of substituting x=0.' },
      { text: '23', correct: false, why: 'Uses an unrelated value and does not evaluate the stated formula.' },
      { text: '3', correct: true },
      { text: '2', correct: false, why: 'Reports the coefficient of x rather than the function value at zero.' }
    ],
    solution_text: 'At $x=0$, $y=3+2(0)=3$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'In the stem-and-leaf diagram, two pupils achieved maximum marks. What was their score?',
    structure: 'read-maximum-value-from-stem-and-leaf-plot',
    meaningfulCase: 'interpret-stem-fifty-and-leaf-zero-as-fifty',
    mastery: false,
    options: [
      { text: '5', correct: false, why: 'Reads the stem alone and omits the tens-place interpretation.' },
      { text: '30', correct: false, why: 'Confuses the sample size or another stem with the maximum score.' },
      { text: '50', correct: true },
      { text: '90', correct: false, why: 'Uses the key incorrectly and places the maximum beyond the displayed stems.' }
    ],
    solution_text: 'The largest stem is 5 with leaves 0 and 0. Using the key $1|6=16$, each value is 50, so the maximum score was 50.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A square is folded exactly in half and then in half again. Which shape could not be the resulting shape?',
    structure: 'reason-about-shapes-produced-by-two-square-folds',
    meaningfulCase: 'check-area-and-fold-line-geometry-for-candidate-shapes',
    mastery: false,
    options: [
      { text: 'A: square', correct: false, why: 'Folding along two perpendicular symmetry lines can produce a square quarter.' },
      { text: 'B: rectangle', correct: false, why: 'Two parallel half-folds can produce a rectangular strip.' },
      { text: 'C: right triangle', correct: false, why: 'Diagonal folding can produce a triangular folded region.' },
      { text: 'D: inverted triangle', correct: true }
    ],
    solution_text: 'The square, rectangle, and right-triangular regions can arise from suitable half-folds. The inverted triangle shown is not obtainable from two exact half-folds of the square.',
    diagramRequired: true,
    uncertainties: ['The folding diagram is not shown, so the interpretation depends on the intended class of straight half-folds.']
  },
  {
    question_text: 'Solve the simultaneous equations $y=3x-5$ and $y=-x-1$.',
    structure: 'solve-linear-simultaneous-equations-by-equating-expressions',
    meaningfulCase: 'equate-two-y-expressions-and-substitute-back',
    mastery: false,
    options: [
      { text: '$(-1,-2)$', correct: false, why: 'Does not satisfy both displayed equations at the same x-coordinate.' },
      { text: '$(2,-2)$', correct: false, why: 'Substitution into the first equation gives y=1, not -2.' },
      { text: '$(-3,1)$', correct: false, why: 'The x-coordinate does not make the two line values equal.' },
      { text: '$(1,-2)$', correct: true }
    ],
    solution_text: 'Set $3x-5=-x-1$, so $4x=4$ and $x=1$. Then $y=3(1)-5=-2$, giving $(1,-2)$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
