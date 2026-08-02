import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0581', [
  {
    question_text: 'How many pupils chose to write a story about an elephant?',
    structure: 'read-value-from-bar-chart',
    meaningfulCase: 'read-elephant-bar-height-as-fourteen-pupils',
    mastery: false,
    options: [
      { text: '14', correct: true },
      { text: '7', correct: false, why: 'Reads the bar height at the wrong gridline instead of 14 pupils.' },
      { text: '16', correct: false, why: 'Uses the top of the chart scale rather than the elephant bar height.' },
      { text: '30', correct: false, why: 'Adds or combines category values instead of reading the elephant bar.' }
    ],
    solution_text: 'The elephant bar reaches the 14 mark on the vertical axis, so 14 pupils chose elephant stories.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Simplify $5^{10}\div5^5$.',
    structure: 'apply-index-law-to-division',
    meaningfulCase: 'subtract-exponents-for-division-of-like-bases',
    mastery: false,
    options: [
      { text: '2', correct: false, why: 'Subtracts the exponents as ordinary numbers and loses the common base.' },
      { text: '$5^2$', correct: false, why: 'Subtracts the exponents incorrectly: 10 minus 5 is 5, not 2.' },
      { text: '$5^5$', correct: true },
      { text: '$1^5$', correct: false, why: 'Changes the base to 1 even though the index law keeps the base 5.' }
    ],
    solution_text: 'For division with the same base, subtract the exponents: $5^{10}\div5^5=5^{10-5}=5^5$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Solve $5-2x<3$.',
    structure: 'solve-linear-inequality',
    meaningfulCase: 'reverse-inequality-when-dividing-by-negative-coefficient',
    mastery: false,
    options: [
      { text: '$x<-1$', correct: false, why: 'Forgets to reverse the inequality when dividing by negative 2.' },
      { text: '$x>1$', correct: true },
      { text: '$x<1$', correct: false, why: 'Divides by the negative coefficient without reversing the inequality.' },
      { text: '$x>-1$', correct: false, why: 'Makes a sign error when rearranging the inequality.' }
    ],
    solution_text: '$5-2x<3$ gives $-2x<-2$. Dividing by $-2$ reverses the sign, so $x>1$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'A point is reflected in the line $y=3-2x$. The point is invariant. Which is the point?',
    structure: 'identify-point-on-reflection-line',
    meaningfulCase: 'test-each-coordinate-pair-in-line-equation',
    mastery: false,
    options: [
      { text: '$(-1,5)$', correct: true },
      { text: '$(-2,-1)$', correct: false, why: 'Substitution gives 7 rather than the stated y-coordinate -1.' },
      { text: '$(5,-1)$', correct: false, why: 'The point does not satisfy $y=3-2x$ when its x-coordinate is 5.' },
      { text: '$(3,-4)$', correct: false, why: 'Substitution gives -3 rather than the stated y-coordinate -4.' }
    ],
    solution_text: 'An invariant point lies on the mirror line. For $(-1,5)$, $3-2(-1)=5$, so it lies on $y=3-2x$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'A bag contains 24 yellow and green balls. $\frac38$ of the balls are yellow. How many of the balls are green?',
    structure: 'find-complement-of-fraction-of-total',
    meaningfulCase: 'subtract-three-eighths-yellow-count-from-total',
    mastery: false,
    options: [
      { text: '8', correct: false, why: 'Uses the numerator as a count rather than finding three eighths of 24.' },
      { text: '9', correct: false, why: 'Finds the number of yellow balls but does not subtract it from the total.' },
      { text: '15', correct: true },
      { text: '3', correct: false, why: 'Uses the numerator of the fraction instead of the complementary number of balls.' }
    ],
    solution_text: 'Yellow balls: $\frac38\times24=9$. Therefore green balls: $24-9=15$.' ,
    diagramRequired: false,
    uncertainties: []
  }
]);
