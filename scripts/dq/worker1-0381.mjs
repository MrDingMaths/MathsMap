import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0381', [
  {
    question_text: 'The diagram shows two right-angled triangles with the given sides and angles. What is the value of $\\sin(p+q)$?',
    structure: 'calculate-sine-of-sum-using-right-triangle-ratios',
    meaningfulCase: 'apply-sine-addition-formula-to-p-and-q',
    mastery: false,
    options: [
      { text: '$\\dfrac2{\\sqrt5}+\\dfrac23$', correct: false, why: 'Adds the sine ratios without the cosine factors required by the addition formula.' },
      { text: '$\\dfrac2{\\sqrt5}+\\dfrac{\\sqrt5}3$', correct: false, why: 'Combines incompatible side ratios and omits the correct product structure.' },
      { text: '$\\dfrac23+\\dfrac2{3\\sqrt5}$', correct: true },
      { text: '$\\dfrac4{3\\sqrt5}+\\dfrac13$', correct: false, why: 'Uses incorrect opposite and adjacent ratios for the two labelled angles.' }
    ],
    solution_text: 'From the triangles, $\\sin p=2/\\sqrt5$, $\\cos p=1/\\sqrt5$, $\\sin q=2/3$, and $\\cos q=\\sqrt5/3$. Thus $\\sin(p+q)=\\sin p\\cos q+\\cos p\\sin q=2/3+2/(3\\sqrt5)$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A box contains 120 counters and $3/5$ of them are red. How many red counters are there?',
    structure: 'find-fraction-of-whole-number',
    meaningfulCase: 'multiply-one-hundred-twenty-by-three-fifths',
    mastery: false,
    options: [
      { text: '72', correct: true },
      { text: '24', correct: false, why: 'Uses only the denominator division and omits multiplication by the numerator.' },
      { text: '60', correct: false, why: 'Finds one half of 120 rather than three fifths.' },
      { text: '48', correct: false, why: 'Calculates two fifths of 120 instead of three fifths.' }
    ],
    solution_text: '$\\dfrac35\\times120=3\\times24=72$, so there are 72 red counters.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which equation could describe the downward-opening graph shown?',
    structure: 'identify-quadratic-equation-from-graph-shape',
    meaningfulCase: 'recognise-negative-x-squared-leading-coefficient',
    mastery: false,
    options: [
      { text: '$y=2-x^2$', correct: true },
      { text: '$y=x-1$', correct: false, why: 'This is a straight line rather than the displayed downward-opening parabola.' },
      { text: '$y=x^2-2$', correct: false, why: 'Opens upwards because the coefficient of $x^2$ is positive.' },
      { text: '$y=x^3-3x^2+2$', correct: false, why: 'A cubic has a different overall shape from the symmetric parabola shown.' }
    ],
    solution_text: 'The graph is a parabola opening downwards with a maximum on the y-axis at 2, matching $y=2-x^2$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Find the area of the region enclosed by $y=x^2-2x+3$ and $y=x+1$.',
    structure: 'find-area-between-intersecting-curve-and-line',
    meaningfulCase: 'integrate-line-minus-parabola-between-intersections-one-and-two',
    mastery: false,
    options: [
      { text: '$\\dfrac53$', correct: false, why: 'Uses an incorrect difference function or integration interval.' },
      { text: '$\\dfrac16$', correct: true },
      { text: '$\\dfrac56$', correct: false, why: 'Does not correctly evaluate the definite integral between the intersection points.' },
      { text: '$\\dfrac{25}{6}$', correct: false, why: 'Produces a value far too large for the narrow region shown.' }
    ],
    solution_text: 'Intersections satisfy $x^2-2x+3=x+1$, giving $(x-1)(x-2)=0$, so $x=1,2$. Between them the line is above the curve: area $=\\int_1^2[(x+1)-(x^2-2x+3)]dx=\\int_1^2(-x^2+3x-2)dx=1/6$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Car speeds are normally distributed with mean 108 km/h and standard deviation 15 km/h. If 30% exceed $x$ km/h, find $x$ to 3 significant figures.',
    structure: 'find-normal-distribution-percentile-from-upper-tail',
    meaningfulCase: 'use-seventieth-percentile-z-score-about-zero-point-five-two',
    mastery: false,
    options: [
      { text: '115 km/h', correct: false, why: 'Rounds the percentile too low for an upper-tail probability of 30%.' },
      { text: '116 km/h', correct: true },
      { text: '71 km/h', correct: false, why: 'Uses an inappropriate lower-tail value and is far below the mean.' },
      { text: '100 km/h', correct: false, why: 'Lies below the mean, so more than half the cars would exceed it.' }
    ],
    solution_text: 'If 30% exceed $x$, then $x$ is the 70th percentile. The standard normal value is approximately $z=0.524$, so $x=108+15(0.524)=115.86$, which rounds to $116$ km/h.',
    diagramRequired: true,
    uncertainties: []
  }
]);
