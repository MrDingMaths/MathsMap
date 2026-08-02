import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0421', [
  {
    question_text: 'Find $\\int\\dfrac{5}{2x-3}\\,dx$.',
    structure: 'integrate-linear-reciprocal-by-substitution',
    meaningfulCase: 'divide-by-coefficient-of-x-after-logarithmic-antiderivative',
    mastery: false,
    options: [
      { text: '$5\\ln(2x-3)+C$', correct: false, why: 'Misses the factor one half arising from differentiating $2x-3$.' },
      { text: '$\\dfrac52\\ln(2x-3)+C$', correct: true },
      { text: '$\\dfrac12\\ln(2x-3)+C$', correct: false, why: 'Omits the numerator factor 5 from the antiderivative.' },
      { text: '$\\dfrac25\\ln(2x-3)+C$', correct: false, why: 'Inverts the constant factor instead of multiplying by 5/2.' }
    ],
    solution_text: 'Let $u=2x-3$, so $du=2dx$. Then $\\int5/(2x-3)dx=(5/2)\\ln|2x-3|+C$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What is the equation of the absolute-value graph shown?',
    structure: 'identify-translated-absolute-value-graph',
    meaningfulCase: 'read-vertex-at-minus-one-zero',
    mastery: false,
    options: [
      { text: '$y=|x-1|$', correct: false, why: 'Has its vertex at $(1,0)$ rather than the displayed vertex at $(-1,0)$.' },
      { text: '$y=|x+1|$', correct: true },
      { text: '$y=|x|-1$', correct: false, why: 'Shifts the graph down and leaves the vertex at $(0,-1)$.' },
      { text: '$y=|x|+1$', correct: false, why: 'Shifts the graph up and leaves the vertex at $(0,1)$.' }
    ],
    solution_text: 'The V-shaped graph has vertex $(-1,0)$, so its equation is $y=|x+1|$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The parabola $y=x^2-14x+53$ has a tangent at $P(8,5)$. Which equation is the tangent?',
    structure: 'find-tangent-line-to-parabola-at-given-point',
    meaningfulCase: 'differentiate-at-x-eight-and-use-point-slope-form',
    mastery: false,
    options: [
      { text: '$2x+y+11=0$', correct: false, why: 'Has the wrong slope and does not pass through the specified point.' },
      { text: '$2x-y+11=0$', correct: false, why: 'Has the correct slope sign but fails the point-substitution check.' },
      { text: '$-2x-y+11=0$', correct: false, why: 'Has negative gradient, whereas the derivative at x=8 is positive 2.' },
      { text: '$-2x+y+11=0$', correct: true }
    ],
    solution_text: '$dy/dx=2x-14$, so the tangent gradient at $x=8$ is 2. Through $(8,5)$, $y-5=2(x-8)$, giving $y=2x-11$, or $-2x+y+11=0$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Without using a calculator, what is the exact value of $\\cos60^\\circ$?',
    structure: 'recall-exact-special-angle-trigonometric-value',
    meaningfulCase: 'use-equilateral-triangle-special-angle-value',
    mastery: false,
    options: [
      { text: '0.5', correct: true },
      { text: '0.60', correct: false, why: 'This decimal is not the exact special-angle value of cosine 60 degrees.' },
      { text: '$\\dfrac{\\sqrt3}{2}$', correct: false, why: 'This is the exact value of $\\sin60^\\circ$, not $\\cos60^\\circ$.' },
      { text: '$\\dfrac{\\sqrt2}{2}$', correct: false, why: 'This is associated with 45 degrees rather than 60 degrees.' }
    ],
    solution_text: '$\\cos60^\\circ=1/2=0.5$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What number is 2 less than 0.3?',
    structure: 'subtract-integer-from-decimal',
    meaningfulCase: 'calculate-zero-point-three-minus-two',
    mastery: false,
    options: [
      { text: '$-1.3$', correct: false, why: 'Subtracts 1.6 rather than subtracting exactly 2 from 0.3.' },
      { text: '$0.1$', correct: false, why: 'Subtracts 0.2 rather than the stated amount of 2.' },
      { text: '$-1.7$', correct: true },
      { text: '$-0.3$', correct: false, why: 'Negates 0.3 but does not subtract the full amount 2.' }
    ],
    solution_text: '$0.3-2=-1.7$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
