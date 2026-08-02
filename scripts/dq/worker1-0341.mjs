import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0341', [
  {
    question_text: 'Rewrite $(x-1)^{-2}$ in the form $p(1+qx)^n$.',
    structure: 'rewrite-negative-power-expression-with-sign-change',
    meaningfulCase: 'use-even-negative-exponent-to-remove-minus-sign',
    mastery: false,
    options: [
      { text: '$(1-x)^{-2}$', correct: true },
      { text: '$-(1-x)^{-2}$', correct: false, why: 'An even exponent removes the sign change, so no leading negative remains.' },
      { text: '$(1+x)^{-2}$', correct: false, why: 'Changes the sign inside the bracket from the original expression.' },
      { text: '$-(1+x)^{-2}$', correct: false, why: 'Has both the wrong sign inside the bracket and an unjustified leading minus.' }
    ],
    solution_text: 'Since $x-1=-(1-x)$ and the exponent is even, $(x-1)^{-2}=(-(1-x))^{-2}=(1-x)^{-2}$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which of the following is a measure of pressure?',
    structure: 'identify-si-unit-equivalent-for-pressure',
    meaningfulCase: 'pressure-is-force-per-unit-area-newtons-per-metre-squared',
    mastery: false,
    options: [
      { text: 'Kilograms per metre squared', correct: false, why: 'This is not the force-per-area unit required for pressure.' },
      { text: 'Newtons per metre cubed', correct: false, why: 'Uses volume units rather than area units in the denominator.' },
      { text: 'Kilograms per metre cubed', correct: false, why: 'This describes mass density, not force per unit area.' },
      { text: 'Newtons per metre squared', correct: true }
    ],
    solution_text: 'Pressure is force divided by area, so its SI unit is $\\text{N}/\\text{m}^2$, written as newtons per metre squared.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Tom says area = pressure $\\div$ force. Katie says pressure = force $\\times$ area. Who is correct?',
    structure: 'check-pressure-force-area-formula',
    meaningfulCase: 'use-pressure-equals-force-divided-by-area',
    mastery: false,
    options: [
      { text: 'Only Tom', correct: false, why: 'Rearranging $P=F/A$ gives area = force divided by pressure, not pressure divided by force.' },
      { text: 'Only Katie', correct: false, why: 'Pressure is force divided by area, not force multiplied by area.' },
      { text: 'Both Tom and Katie', correct: false, why: 'Both stated formulae disagree with the correct pressure relationship.' },
      { text: 'Neither is correct', correct: true }
    ],
    solution_text: 'The correct relationship is $P=F/A$. Rearranging gives $A=F/P$. Neither Tom’s nor Katie’s formula is correct.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Given positive integer $n$ and real $k$, consider $(x-1)(x-2)\\cdots(x-n)=k$. Which statement is true?',
    structure: 'reason-about-range-and-roots-of-product-polynomial',
    meaningfulCase: 'nonnegative-k-attained-on-rightmost-monotone-tail',
    mastery: false,
    options: [
      { text: 'If $n=3$, the equation has no real solution for some values of $k$.', correct: false, why: 'For odd n the polynomial has odd degree and takes every real value.' },
      { text: 'If n is even, the equation has a real solution for every k.', correct: false, why: 'An even-degree product has a finite minimum and misses sufficiently small k values.' },
      { text: 'If $k\\ge0$, the equation has at least one real solution.', correct: true },
      { text: 'The equation never has a repeated solution for any k and n.', correct: false, why: 'At a stationary extremum the corresponding level can produce a repeated root.' }
    ],
    solution_text: 'For $x\\ge n$, every factor is nonnegative, so the product is continuous, starts at zero when $x=n$, and grows without bound. Thus every $k\\ge0$ is attained by at least one real x.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The first term of a geometric sequence is $-8$ and the sixth term is $-60.75$. Find the common ratio.',
    structure: 'find-common-ratio-from-two-geometric-terms',
    meaningfulCase: 'solve-minus-eight-times-r-to-the-fifth-equals-minus-sixty-point-seven-five',
    mastery: false,
    options: [
      { text: '2.5', correct: false, why: 'Its fifth power would make the sixth term far too large in magnitude.' },
      { text: '1.5', correct: true },
      { text: '-1.5', correct: false, why: 'A negative ratio with odd fifth power would make the sixth term positive.' },
      { text: '-2.5', correct: false, why: 'Has the wrong magnitude and would also reverse the sign of the sixth term.' }
    ],
    solution_text: 'Using $a_6=a_1r^5$, $-60.75=-8r^5$, so $r^5=7.59375=1.5^5$. Hence $r=1.5$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
