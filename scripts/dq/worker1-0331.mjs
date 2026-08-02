import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0331', [
  {
    question_text: 'Which equation could be the equation of the graph shown?',
    structure: 'identify-quadratic-from-vertex-form-and-graph',
    meaningfulCase: 'read-vertex-at-minus-three-zero-and-upward-opening',
    mastery: false,
    options: [
      { text: '$y=(x-3)^2$', correct: false, why: 'Has its vertex at $(3,0)$ rather than at $(-3,0)$.' },
      { text: '$y=x^2-3$', correct: false, why: 'Has vertex $(0,-3)$, so it shifts vertically instead of horizontally.' },
      { text: '$y=x^2+3$', correct: false, why: 'Its vertex is $(0,3)$ and it does not touch the x-axis at -3.' },
      { text: '$y=(x+3)^2$', correct: true }
    ],
    solution_text: 'The graph opens upwards and has vertex $(-3,0)$. The corresponding vertex form is $y=(x+3)^2$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Calculate the length of the line segment joining $(2,2)$ and $(5,6)$.',
    structure: 'calculate-distance-between-two-grid-points',
    meaningfulCase: 'use-three-horizontal-and-four-vertical-displacements',
    mastery: false,
    options: [
      { text: '5', correct: true },
      { text: '3', correct: false, why: 'Uses only the horizontal displacement and ignores the vertical displacement.' },
      { text: '7', correct: false, why: 'Adds the horizontal and vertical changes instead of applying Pythagoras.' },
      { text: '25', correct: false, why: 'Gives the squared length rather than the length itself.' }
    ],
    solution_text: 'The horizontal change is 3 and the vertical change is 4. Thus the length is $\\sqrt{3^2+4^2}=\\sqrt{25}=5$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Given $f(x)=8x+4$, which expression represents $f\\left(\\dfrac12x\\right)$?',
    structure: 'evaluate-linear-function-at-scaled-input',
    meaningfulCase: 'substitute-half-x-into-linear-function',
    mastery: false,
    options: [
      { text: '$4x+2$', correct: false, why: 'Halves both terms, although the constant 4 is not part of the input.' },
      { text: '$16x+8$', correct: false, why: 'Doubles the whole function instead of replacing the input by $x/2$.' },
      { text: '$4x+4$', correct: true },
      { text: '$8x+2$', correct: false, why: 'Changes the constant but fails to halve the coefficient of x.' }
    ],
    solution_text: '$f(x/2)=8(x/2)+4=4x+4$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A wood has more than twice as many birch trees as oak trees. There are 360 trees. What is the maximum number of oak trees?',
    structure: 'maximise-integer-count-under-strict-linear-inequality',
    meaningfulCase: 'use-birch-greater-than-twice-oak-and-total-360',
    mastery: false,
    options: [
      { text: '179', correct: false, why: 'Leaves too few trees for birch to be more than twice the oak count.' },
      { text: '119', correct: true },
      { text: '120', correct: false, why: 'Would require more than 240 birch trees, exceeding the total of 360.' },
      { text: '241', correct: false, why: 'Leaves fewer than twice as many trees for birch and violates the condition.' }
    ],
    solution_text: 'Let the number of oak trees be $o$. Then birch trees are $360-o$, and $360-o>2o$, so $360>3o$ and $o<120$. The greatest integer value is $119$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Ed has one pair each of red, yellow, pink, and green socks. How many different ways can he get dressed for odd socks day?',
    structure: 'count-ordered-choices-of-two-different-sock-colours',
    meaningfulCase: 'choose-one-colour-for-each-foot-with-colours-different',
    mastery: false,
    options: [
      { text: '12', correct: true },
      { text: '6', correct: false, why: 'Counts unordered colour pairs but does not distinguish left and right feet.' },
      { text: '16', correct: false, why: 'Allows the same colour on both feet, contrary to odd socks day.' },
      { text: 'None of these', correct: false, why: 'There are 4 choices for the first foot and 3 for the second, giving 12.' }
    ],
    solution_text: 'There are 4 choices for the first foot and then 3 different colours for the second foot, so $4\\times3=12$ ordered outfits.',
    diagramRequired: true,
    uncertainties: []
  }
]);
