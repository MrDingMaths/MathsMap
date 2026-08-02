import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0491', [
  {
    question_text: 'Given positive constant $a$ and $\\int_a^{2a}\\dfrac{r+1}{r}\\,dr=\\ln7$, show that $a=\\ln k$. Find $k$.',
    structure: 'evaluate-definite-logarithmic-integral-and-identify-constant',
    meaningfulCase: 'use-antiderivative-r-plus-ln-r-at-a-and-two-a',
    mastery: false,
    options: [
      { text: '$3/2$', correct: false, why: 'Does not account for the logarithmic contribution and the ratio of limits.' },
      { text: '$7/2$', correct: true },
      { text: '$5/4$', correct: false, why: 'Does not follow from evaluating the endpoint difference.' },
      { text: '$2/5$', correct: false, why: 'Inverts the relevant constant ratio.' }
    ],
    solution_text: 'The integral is $[r+\\ln r]_a^{2a}=a+\\ln2=\\ln7$. Hence $a=\\ln(7/2)$, so $k=7/2$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which arrow shows the direction of the normal reaction force on the block?',
    structure: 'identify-normal-reaction-perpendicular-to-inclined-plane',
    meaningfulCase: 'choose-arrow-perpendicular-to-slope-and-away-from-plane',
    mastery: false,
    options: [
      { text: 'A', correct: false, why: 'A is vertical rather than perpendicular to the inclined plane.' },
      { text: 'B', correct: true },
      { text: 'C', correct: false, why: 'C points downwards and is not a reaction away from the plane.' },
      { text: 'D', correct: false, why: 'D points into or along the plane rather than outward perpendicular to it.' }
    ],
    solution_text: 'The normal reaction is perpendicular to the surface and points away from it. For the rising-right slope, this is arrow B.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which statement about normal distributions is true?',
    structure: 'recognise-standardisation-of-normal-distribution',
    meaningfulCase: 'transform-any-normal-variable-to-standard-normal-with-z-score',
    mastery: false,
    options: [
      { text: 'A given x value’s z-score gives the probability of that x value occurring.', correct: false, why: 'A z-score gives a standardised position, not the probability of one exact continuous value.' },
      { text: 'Any normal distribution can be transformed into the standard normal distribution using z-scores.', correct: true },
      { text: 'The value $x=\\sigma$ always has z-score 1.', correct: false, why: 'The z-score depends on the distribution mean as well as its standard deviation.' },
      { text: 'Every x value has a z-score between -3 and 3.', correct: false, why: 'Normal distributions have unbounded tails, so z-scores can lie outside this interval.' }
    ],
    solution_text: 'For a normal variable, $z=(x-\\mu)/\\sigma$ converts values to the standard normal scale. Thus B is true.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The shaded region is outside a circle of radius 3 centred at the origin. What is the locus condition?',
    structure: 'express-exterior-of-circle-as-modulus-inequality',
    meaningfulCase: 'points-at-distance-at-least-three-from-origin',
    mastery: false,
    options: [
      { text: '$|z|\\le3$', correct: false, why: 'Describes the interior of the circle rather than the shaded exterior.' },
      { text: '$|z|\\le9$', correct: false, why: 'Uses the squared radius and still describes an interior region.' },
      { text: '$|z|\\ge3$', correct: true },
      { text: '$|z|\\ge9$', correct: false, why: 'Uses the squared radius instead of the actual distance from the origin.' }
    ],
    solution_text: 'The modulus $|z|$ is the distance from the origin. Outside or on a circle of radius 3 means $|z|\\ge3$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which is not a possible rational zero of $f(x)=x^4+3x^3-7x^2+9x-30$?',
    structure: 'apply-rational-root-theorem-to-polynomial',
    meaningfulCase: 'test-listed-integer-candidates-against-polynomial',
    mastery: false,
    options: [
      { text: '$-5$', correct: false, why: 'Substitution gives zero, so -5 is an actual rational zero.' },
      { text: '$-3$', correct: true },
      { text: '$1$', correct: false, why: 'This is a divisor candidate allowed by the rational-root theorem.' },
      { text: '$3$', correct: false, why: 'This is also a divisor candidate allowed by the rational-root theorem.' }
    ],
    solution_text: 'The source item appears inconsistent: the rational-root theorem allows all listed integer divisors of 30 as candidates, while direct substitution gives $f(-5)=0$ but not the other listed values. The intended non-root choice is marked as $-3$.',
    diagramRequired: true,
    uncertainties: ['The wording “possible rational zero” is ambiguous: all listed integers are theorem candidates, but only -5 is an actual zero among the displayed values.']
  }
]);
