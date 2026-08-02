import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0481', [
  {
    question_text: 'The graph shows $y=x$ and $y=f(x)$. To which solution could the iteration $x_{n+1}=f(x_n)$ converge?',
    structure: 'assess-fixed-point-iteration-convergence-from-graph',
    meaningfulCase: 'converge-to-intersection-with-local-gradient-magnitude-less-than-one',
    mastery: false,
    options: [
      { text: 'The left-most solution', correct: true },
      { text: 'The right-most solution', correct: false, why: 'The graph’s slope at the right intersection is too steep for stable fixed-point iteration.' },
      { text: 'Both solutions, depending on $x_1$', correct: false, why: 'Only the intersection with the stable local slope can attract nearby iterates.' },
      { text: 'It always diverges', correct: false, why: 'The left intersection has a locally attracting slope and can be reached by iteration.' }
    ],
    solution_text: 'Fixed-point iteration converges near an intersection where the magnitude of the derivative is less than 1. The left-most intersection has the gentler slope, while the right-most one is steeper, so the left-most solution can attract the iteration.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which of the shown nets will make a cube?',
    structure: 'identify-valid-cube-net-from-square-arrangements',
    meaningfulCase: 'check-six-squares-fold-to-six-distinct-cube-faces',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'Its attached squares overlap when the four-square strip is folded around the cube.' },
      { text: 'B', correct: false, why: 'The arrangement does not fold to six distinct faces without overlap.' },
      { text: 'C', correct: true },
      { text: 'D', correct: false, why: 'Its staircase arrangement causes faces to coincide when folded.' }
    ],
    solution_text: 'Folding net C produces six distinct square faces meeting along cube edges; the other arrangements cause overlap or leave incompatible face positions.',
    diagramRequired: true,
    uncertainties: ['The small net diagram is low resolution, so the foldability of the labelled alternatives is somewhat difficult to verify visually.']
  },
  {
    question_text: 'Round $0.009753$ to 2 decimal places.',
    structure: 'round-small-decimal-to-specified-decimal-places',
    meaningfulCase: 'use-hundredths-place-and-next-digit',
    mastery: false,
    options: [
      { text: '0.0098', correct: false, why: 'Rounds to four decimal places rather than two decimal places.' },
      { text: '0.0097', correct: false, why: 'Keeps four decimal places and also rounds in the wrong direction.' },
      { text: '0.01', correct: true },
      { text: '0.00', correct: false, why: 'Treats the small value as zero instead of rounding to the nearest hundredth.' }
    ],
    solution_text: 'To 2 decimal places, $0.009753$ is compared with the hundredths place. Since the thousandths digit is 9, it rounds to $0.01$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Helen sees the displayed block arrangement as the shown stepped profile. From which side is she viewing the shape?',
    structure: 'identify-viewpoint-from-orthographic-projection',
    meaningfulCase: 'match-three-cube-base-with-taller-right-hand-column',
    mastery: false,
    options: [
      { text: 'A', correct: true },
      { text: 'B', correct: false, why: 'This direction produces a different ordering of the visible column heights.' },
      { text: 'C', correct: false, why: 'The projection from this side does not match the stepped profile shown.' },
      { text: 'D', correct: false, why: 'Reverses the arrangement and places the taller column on the wrong side.' }
    ],
    solution_text: 'Viewing from direction A collapses the depth and leaves three positions in a row with the taller stack at the right, matching the displayed profile.',
    diagramRequired: true,
    uncertainties: ['The perspective drawing makes the exact viewing direction difficult to distinguish; A is the intended match.']
  },
  {
    question_text: 'Evaluate $\\dfrac{(-5)^2-(-(-7))}{-1-3}$.',
    structure: 'evaluate-nested-negative-signs-and-fraction',
    meaningfulCase: 'calculate-numerator-thirty-two-and-denominator-minus-four',
    mastery: false,
    options: [
      { text: '8', correct: false, why: 'Loses the negative sign from the denominator.' },
      { text: '$-\\dfrac92$', correct: false, why: 'Miscomputes the numerator or denominator instead of simplifying the signed fraction.' },
      { text: '$\\dfrac92$', correct: false, why: 'Does not match the numerator 32 and denominator -4.' },
      { text: '-8', correct: true }
    ],
    solution_text: 'The numerator is $25+7=32$ and the denominator is $-4$. Therefore $32/(-4)=-8$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
