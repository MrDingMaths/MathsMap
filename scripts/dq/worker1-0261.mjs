import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0261', [
  {
    question_text: 'The curve $C$ has equation $y=2x^2-5x+3$. What is the gradient of the normal at $x=2$?',
    structure: 'find-normal-gradient-from-differentiated-curve',
    meaningfulCase: 'take-negative-reciprocal-of-tangent-gradient',
    mastery: false,
    options: [
      { text: '$\\dfrac16$', correct: false, why: 'Does not correctly evaluate the derivative or take the reciprocal for the normal.' },
      { text: '$-\\dfrac13$', correct: true },
      { text: '$3$', correct: false, why: 'Gives the gradient of the tangent, not the perpendicular normal.' },
      { text: '$6$', correct: false, why: 'Uses an incorrect derivative value and does not form the normal gradient.' }
    ],
    solution_text: '$\\dfrac{dy}{dx}=4x-5$, so at $x=2$ the tangent gradient is $3$. The normal gradient is the negative reciprocal, $-1/3$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which of the following shapes is not being split into two congruent halves?',
    structure: 'identify-noncongruent-bisection-of-shape',
    meaningfulCase: 'check-whether-each-drawn-line-produces-congruent-parts',
    mastery: false,
    options: [
      { text: 'A: rectangle split by a diagonal', correct: false, why: 'A rectangle diagonal forms two congruent triangles.' },
      { text: 'B: parallelogram split by a diagonal', correct: false, why: 'A parallelogram diagonal forms two congruent triangles.' },
      { text: 'C: isosceles trapezium split vertically', correct: false, why: 'The line of symmetry divides this isosceles trapezium into congruent halves.' },
      { text: 'D: triangle split by an off-centre line', correct: true }
    ],
    solution_text: 'The rectangle, parallelogram, and isosceles trapezium are split along lines that produce congruent halves. The line in D is not a symmetry line and does not generally produce congruent parts.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Let $a=\\begin{pmatrix}-2\\\\3\\end{pmatrix}$ and $b=\\begin{pmatrix}4\\\\-1\\end{pmatrix}$. What is $a-b$?',
    structure: 'subtract-two-dimensional-vectors-componentwise',
    meaningfulCase: 'subtract-corresponding-components-with-signs',
    mastery: false,
    options: [
      { text: '$\\begin{pmatrix}2\\\\2\\end{pmatrix}$', correct: false, why: 'Changes the sign of the first component and does not subtract both vectors correctly.' },
      { text: '$\\begin{pmatrix}4\\\\-6\\end{pmatrix}$', correct: false, why: 'Does not perform componentwise subtraction of the displayed vectors.' },
      { text: '$\\begin{pmatrix}-6\\\\4\\end{pmatrix}$', correct: true },
      { text: '$\\begin{pmatrix}-6\\\\2\\end{pmatrix}$', correct: false, why: 'Gets the second component wrong after subtracting negative one.' }
    ],
    solution_text: '$a-b=\\begin{pmatrix}-2-4\\\\3-(-1)\\end{pmatrix}=\\begin{pmatrix}-6\\\\4\\end{pmatrix}$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Solve $x^3+2x^2-24x=0$.',
    structure: 'solve-cubic-by-factorising-common-factor-and-quadratic',
    meaningfulCase: 'factor-out-x-then-factorise-quadratic',
    mastery: false,
    options: [
      { text: '$x=0, x=4, x=-6$', correct: true },
      { text: '$x=0, x=-4, x=6$', correct: false, why: 'Reverses the signs of both nonzero roots from the quadratic factor.' },
      { text: '$x=4, x=-6$', correct: false, why: 'Omits the root $x=0$ supplied by the common factor $x$.' },
      { text: '$x=-4, x=6$', correct: false, why: 'Uses the wrong factorisation and also omits the zero root.' }
    ],
    solution_text: '$x^3+2x^2-24x=x(x^2+2x-24)=x(x+6)(x-4)$. Therefore $x=0$, $x=-6$, or $x=4$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A vector $u$ has components $\\begin{pmatrix}2\\\\-3\\\\6\\end{pmatrix}$. What are the components of a unit vector parallel to $u$?',
    structure: 'normalise-three-dimensional-vector',
    meaningfulCase: 'divide-vector-by-its-magnitude',
    mastery: false,
    options: [
      { text: '$\\begin{pmatrix}5/2\\\\-5/3\\\\5/6\\end{pmatrix}$', correct: false, why: 'These components are not obtained by dividing by the vector magnitude and do not form a unit vector.' },
      { text: '$\\begin{pmatrix}2/7\\\\-3/7\\\\6/7\\end{pmatrix}$', correct: true },
      { text: '$\\begin{pmatrix}-2/11\\\\-3/11\\\\6/11\\end{pmatrix}$', correct: false, why: 'Uses an incorrect magnitude and also changes the sign of the first component.' },
      { text: '$\\begin{pmatrix}4\\\\-6\\\\12\\end{pmatrix}$', correct: false, why: 'Scales the vector up rather than normalising it to length one.' }
    ],
    solution_text: 'The magnitude is $\\sqrt{2^2+(-3)^2+6^2}=\\sqrt{49}=7$. Dividing by 7 gives the unit vector $\\begin{pmatrix}2/7\\\\-3/7\\\\6/7\\end{pmatrix}$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
