import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0291', [
  {
    question_text: 'Which of the following is not a point where the function $y=x(x-1)(x+3)$ intersects an axis?',
    structure: 'find-axis-intercepts-of-factorised-cubic',
    meaningfulCase: 'set-y-zero-for-x-intercepts-and-check-point-on-y-axis',
    mastery: false,
    options: [
      { text: 'The origin', correct: false, why: 'The factor $x$ gives the x-intercept $(0,0)$, which is the origin.' },
      { text: '$(3,36)$', correct: true },
      { text: '$(-3,0)$', correct: false, why: 'The factor $x+3$ gives the x-intercept $(-3,0)$.' },
      { text: '$(-1,0)$', correct: false, why: 'The factor $x-1$ gives $(1,0)$, but the displayed point is not an intercept; this option is inconsistent with the source wording.' }
    ],
    solution_text: 'The x-intercepts come from $x(x-1)(x+3)=0$, giving $x=0,1,-3$, while the y-intercept is the origin. At $x=3$, $y=3(2)(6)=36$, so $(3,36)$ is not on an axis.',
    diagramRequired: true,
    uncertainties: ['The source option D displays $(-1,0)$, although the actual x-intercept from the factorisation is $(1,0)$.']
  },
  {
    question_text: 'An object is suspended on a light inextensible string. If it is moving downwards and decelerating, which comparison is true?',
    structure: 'compare-tension-and-weight-during-downward-deceleration',
    meaningfulCase: 'upward-acceleration-requires-tension-greater-than-weight',
    mastery: false,
    options: [
      { text: 'Tension $>$ weight', correct: true },
      { text: 'Tension $=$ weight', correct: false, why: 'Equal forces would give zero acceleration, so the downward motion would not decelerate.' },
      { text: 'Weight $>$ tension', correct: false, why: 'That would produce downward acceleration and increase the downward speed.' },
      { text: 'Cannot determine', correct: false, why: 'The stated downward deceleration fixes the acceleration direction and therefore the force comparison.' }
    ],
    solution_text: 'Moving downwards while decelerating means the acceleration is upwards. Therefore the upward tension exceeds the downward weight: $T>W$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'An object has displacement $s(t)$. How would you find its maximum or minimum velocity?',
    structure: 'find-extrema-of-velocity-from-displacement',
    meaningfulCase: 'set-acceleration-zero-then-evaluate-velocity',
    mastery: false,
    options: [
      { text: 'Solve $\\dfrac{ds}{dt}=0$', correct: false, why: 'This finds stationary displacement, where velocity is zero, not extrema of velocity.' },
      { text: 'Solve $\\dfrac{d^2s}{dt^2}=0$, then substitute into $\\dfrac{ds}{dt}$', correct: true },
      { text: 'Solve $\\dfrac{d^2s}{dt^2}=0$, then substitute into $s(t)$', correct: false, why: 'Substituting into displacement gives position rather than the required velocity.' },
      { text: 'Solve $\\dfrac{d^2s}{dt^2}=0$', correct: false, why: 'This finds candidate times but does not calculate the corresponding velocity value.' }
    ],
    solution_text: 'Velocity is $v=ds/dt$. Its stationary values occur where $dv/dt=d^2s/dt^2=0$. Solve this equation and substitute the resulting time into $ds/dt$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What are the maximum and minimum values of $5-2\\sin(2x-40)^\\circ$?',
    structure: 'find-range-of-linear-sine-expression',
    meaningfulCase: 'use-minus-two-sine-range-and-vertical-translation',
    mastery: false,
    options: [
      { text: 'Maximum $7$, minimum $3$', correct: true },
      { text: 'Maximum $5$, minimum $-5$', correct: false, why: 'Uses an incorrect amplitude and ignores the vertical translation by 5.' },
      { text: 'Maximum $2$, minimum $-2$', correct: false, why: 'Reports the amplitude range without including the constant term.' },
      { text: 'Maximum $5$, minimum $3$', correct: false, why: 'Recognises the minimum but incorrectly limits the maximum to the midline.' }
    ],
    solution_text: 'Since $-1\\le\\sin(2x-40)^\\circ\\le1$, the term $-2\\sin(2x-40)^\\circ$ ranges from $-2$ to $2$. Adding 5 gives minimum 3 and maximum 7.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which plotted dot shows the point $(2,0)$?',
    structure: 'read-coordinate-from-cartesian-grid',
    meaningfulCase: 'move-two-right-and-zero-vertically-from-origin',
    mastery: false,
    options: [
      { text: 'A', correct: true },
      { text: 'B', correct: false, why: 'Dot B lies on the y-axis above the origin rather than at x=2.' },
      { text: 'C', correct: false, why: 'Dot C lies on the y-axis below the origin rather than on the x-axis.' },
      { text: 'D', correct: false, why: 'Dot D has positive x and positive y coordinates, not y=0.' }
    ],
    solution_text: 'The point $(2,0)$ is two units to the right of the origin and lies on the x-axis. This is dot A.',
    diagramRequired: true,
    uncertainties: []
  }
]);
