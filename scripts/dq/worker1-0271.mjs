import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0271', [
  {
    question_text: 'If $y=kx^a$, which rearrangement forms a straight-line graph?',
    structure: 'linearise-power-law-by-taking-logarithms',
    meaningfulCase: 'take-logs-to-obtain-log-y-equals-log-k-plus-a-log-x',
    mastery: false,
    options: [
      { text: '$\\log y=x\\log a+\\log k$', correct: false, why: 'Places the exponent with x instead of multiplying the logarithm of x.' },
      { text: '$\\log y=a\\log k+\\log x$', correct: false, why: 'Associates the exponent with the constant rather than with $\\log x$.' },
      { text: '$\\log y=\\log k+a\\log x$', correct: true },
      { text: '$\\log y=x\\log(ka)$', correct: false, why: 'Does not follow from taking logarithms of the power-law model.' }
    ],
    solution_text: 'Taking logarithms gives $\\log y=\\log(kx^a)=\\log k+\\log(x^a)=\\log k+a\\log x$, which is linear in $\\log x$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A 6 kg ball is pulled by 40 N along a rough horizontal table. What is the name of the downward force $y$?',
    structure: 'identify-weight-in-horizontal-force-diagram',
    meaningfulCase: 'downward-gravitational-force-is-weight',
    mastery: false,
    options: [
      { text: 'tension', correct: false, why: 'Tension is a pulling force transmitted through a string or cable.' },
      { text: 'thrust', correct: false, why: 'Thrust is a driving force, not the downward force caused by gravity.' },
      { text: 'weight', correct: true },
      { text: 'normal reaction', correct: false, why: 'The normal reaction acts upward from the table, opposite to the shown force.' }
    ],
    solution_text: 'The downward force due to gravity acting on the ball is its weight. The upward force $x$ would be the normal reaction.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which condition must be true for the series $\\sum_{k=0}^{\\infty} ar^k$ to converge to a limit?',
    structure: 'identify-convergence-condition-for-geometric-series',
    meaningfulCase: 'absolute-common-ratio-less-than-one',
    mastery: false,
    options: [
      { text: '$a$ is an integer', correct: false, why: 'The first term may be non-integer without preventing geometric convergence.' },
      { text: '$r$ is positive', correct: false, why: 'Negative ratios can converge whenever their absolute value is less than one.' },
      { text: '$|r|<1$', correct: true },
      { text: '$|a|<1$', correct: false, why: 'The convergence condition depends on the common ratio, not the first term.' }
    ],
    solution_text: 'A geometric series $\\sum ar^k$ converges exactly when the common ratio has magnitude less than one, so $|r|<1$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'If $N=Ae^{kt}$, which plot would give a straight-line graph?',
    structure: 'linearise-exponential-model-with-natural-logarithm',
    meaningfulCase: 'plot-ln-n-against-time',
    mastery: false,
    options: [
      { text: '$N$ against $t$', correct: false, why: 'An exponential relationship is curved when plotted directly against time.' },
      { text: '$\\ln N$ against $t$', correct: true },
      { text: '$N$ against $\\ln t$', correct: false, why: 'Taking the logarithm of time does not linearise this exponential model.' },
      { text: '$\\ln N$ against $\\ln t$', correct: false, why: 'A log-log plot is appropriate for a power law, not this exponential law.' }
    ],
    solution_text: 'Taking natural logarithms gives $\\ln N=\\ln A+kt$. Thus plotting $\\ln N$ vertically against $t$ horizontally gives a straight line.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The reciprocal trigonometric function $\\sec x$ is the same as which expression?',
    structure: 'use-reciprocal-trigonometric-identity-for-secant',
    meaningfulCase: 'secant-is-reciprocal-of-cosine',
    mastery: false,
    options: [
      { text: '$\\dfrac1{\\sin x}$', correct: false, why: 'The reciprocal of sine is cosecant, not secant.' },
      { text: '$\\dfrac1{\\cos x}$', correct: true },
      { text: '$\\dfrac1{\\tan x}$', correct: false, why: 'The reciprocal of tangent is cotangent, not secant.' },
      { text: '$\\cos^{-1}x$', correct: false, why: 'This denotes inverse cosine rather than the reciprocal of cosine.' }
    ],
    solution_text: 'By definition, $\\sec x=1/\\cos x$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
