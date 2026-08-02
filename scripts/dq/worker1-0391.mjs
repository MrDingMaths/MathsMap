import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0391', [
  {
    question_text: 'What is the equation of the parabola shown?',
    structure: 'identify-quadratic-from-x-intercepts',
    meaningfulCase: 'factorise-using-roots-minus-one-and-two',
    mastery: false,
    options: [
      { text: '$y=x^2-2$', correct: false, why: 'Has roots at $\\pm\\sqrt2$, not at the two displayed intercepts.' },
      { text: '$y=x^2-2x$', correct: false, why: 'Has roots 0 and 2, whereas the graph crosses at -1 and 2.' },
      { text: '$y=(x-1)(x+2)$', correct: false, why: 'Has roots 1 and -2, reversing the graph’s intercept locations.' },
      { text: '$y=(x+1)(x-2)$', correct: true }
    ],
    solution_text: 'The graph has x-intercepts $-1$ and $2$. A monic quadratic with these roots is $y=(x+1)(x-2)$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which is a correct factorisation of $x^2-9$?',
    structure: 'factorise-difference-of-two-squares',
    meaningfulCase: 'use-a-squared-minus-b-squared-identity',
    mastery: false,
    options: [
      { text: '$(x-3)(x+3)$', correct: true },
      { text: '$x(x-9)$', correct: false, why: 'Expands to $x^2-9x$, not $x^2-9$.' },
      { text: '$(x-3)^2$', correct: false, why: 'Expands to $x^2-6x+9$ and contains an unwanted middle term.' },
      { text: 'Cannot be factorised', correct: false, why: 'The expression is a standard difference of two squares.' }
    ],
    solution_text: '$x^2-9=x^2-3^2=(x-3)(x+3)$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which is the correct solution to the inequality $x^2<64$?',
    structure: 'solve-quadratic-inequality-by-square-root-bounds',
    meaningfulCase: 'take-positive-and-negative-square-root-of-sixty-four',
    mastery: false,
    options: [
      { text: '$-32<x<32$', correct: false, why: 'Uses 32 rather than the square root of 64, making the interval too wide.' },
      { text: '$x<8$', correct: false, why: 'Omits the lower bound and includes values whose magnitude exceeds 8.' },
      { text: '$-8<x<8$', correct: true },
      { text: '$x<-8$ or $x>8$', correct: false, why: 'Describes the region where $x^2>64$, the opposite inequality.' }
    ],
    solution_text: '$x^2<64=8^2$ means the magnitude of x is less than 8, so $-8<x<8$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'An object has displacement $s(t)$. How would you find its maximum displacement?',
    structure: 'find-maximum-of-displacement-function',
    meaningfulCase: 'set-velocity-zero-and-evaluate-displacement',
    mastery: false,
    options: [
      { text: 'Solve $ds/dt=0$', correct: false, why: 'This finds candidate times but does not give the maximum displacement value.' },
      { text: 'Solve $s(t)=0$, then substitute into $ds/dt$', correct: false, why: 'Finds zero displacement rather than stationary points of displacement.' },
      { text: 'Solve $ds/dt=0$, then substitute the answer into $s(t)$', correct: true },
      { text: 'Solve $s(t)=0$', correct: false, why: 'The roots of displacement do not generally identify its maximum.' }
    ],
    solution_text: 'At a maximum displacement, velocity $ds/dt$ is zero. Solve $ds/dt=0$ for the candidate time and substitute it into $s(t)$ to obtain the displacement.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'An object of mass $m$ rests on a rough slope at angle $\\theta$ to the horizontal. Which is a correct equation perpendicular to the plane?',
    structure: 'resolve-weight-perpendicular-to-inclined-plane',
    meaningfulCase: 'normal-reaction-balances-mg-cos-theta',
    mastery: false,
    options: [
      { text: '$R=mg$', correct: false, why: 'Uses the full weight instead of its component perpendicular to the slope.' },
      { text: '$R=mg\\sin\\theta$', correct: false, why: 'The sine component acts parallel to the slope, not perpendicular to it.' },
      { text: '$R=mg\\cos\\theta$', correct: true },
      { text: '$R\\cos\\theta=mg$', correct: false, why: 'Rearranges the perpendicular component relationship incorrectly.' }
    ],
    solution_text: 'The component of weight perpendicular to a slope at angle $\\theta$ is $mg\\cos\\theta$. With no acceleration perpendicular to the plane, $R=mg\\cos\\theta$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
