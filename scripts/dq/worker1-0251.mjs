import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0251', [
  {
    question_text: 'Alex has $a$ sweets. Zara has 5 fewer sweets than Alex. Which expression represents Zara\'s sweets?',
    structure: 'form-expression-for-five-less-than-a-variable',
    meaningfulCase: 'subtract-five-from-alexs-number-of-sweets',
    mastery: false,
    options: [
      { text: '$a+5$', correct: false, why: 'Adding five gives more sweets, whereas Zara has five fewer than Alex.' },
      { text: '$\\dfrac{a}{5}$', correct: false, why: 'Dividing by five is not the same operation as subtracting five sweets.' },
      { text: '$a-5$', correct: true },
      { text: '$5-a$', correct: false, why: 'Reverses the subtraction and would usually produce a negative count.' }
    ],
    solution_text: 'Five fewer than $a$ is found by subtracting 5: Zara has $a-5$ sweets.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'How many planes of symmetry does this rectangular cuboid have?',
    structure: 'count-planes-of-symmetry-of-rectangular-cuboid',
    meaningfulCase: 'reflect-through-three-midplanes-of-a-general-cuboid',
    mastery: false,
    options: [
      { text: '1', correct: false, why: 'Recognises only one mid-plane and misses the corresponding planes in the other directions.' },
      { text: '3', correct: true },
      { text: '5', correct: false, why: 'Counts extra diagonal or oblique planes that do not preserve a general cuboid.' },
      { text: '9', correct: false, why: 'Includes many planes that do not map the cuboid onto itself.' }
    ],
    solution_text: 'A rectangular cuboid with three unequal dimensions has one symmetry plane through the midpoint perpendicular to each of its three axes. Therefore it has $3$ planes of symmetry.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Given that $(3x-2)$ is a factor of a function $f(x)$, which statement is true?',
    structure: 'apply-factor-theorem-to-linear-factor',
    meaningfulCase: 'set-function-equal-to-zero-at-root-two-thirds',
    mastery: false,
    options: [
      { text: '$f(2)=0$', correct: false, why: 'Uses 2 rather than the root obtained by setting $3x-2$ equal to zero.' },
      { text: '$f\\left(\\dfrac23\\right)=0$', correct: true },
      { text: '$f\\left(\\dfrac32\\right)=0$', correct: false, why: 'Inverts the fraction when solving $3x-2=0$.' },
      { text: 'None are true.', correct: false, why: 'The factor theorem does give a definite root for the stated linear factor.' }
    ],
    solution_text: 'A factor $(3x-2)$ gives a root where $3x-2=0$. Thus $3x=2$, so $x=\\dfrac23$ and $f\\left(\\dfrac23\\right)=0$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which of the following is equivalent to $\\sin(\\theta)+\\cos(\\theta)$?',
    structure: 'recognise-nonidentity-between-basic-trigonometric-expressions',
    meaningfulCase: 'do-not-equate-sine-plus-cosine-with-unrelated-products',
    mastery: false,
    options: [
      { text: '$\\tan(\\theta)$', correct: false, why: 'Tangent is the quotient $\\sin(\\theta)/\\cos(\\theta)$, not their sum.' },
      { text: '$1$', correct: false, why: 'Sine and cosine do not generally add to one for arbitrary angles.' },
      { text: '$\\sin(\\theta)\\cos(\\theta)$', correct: false, why: 'Multiplying sine and cosine is different from adding the two values.' },
      { text: 'None of the above', correct: true }
    ],
    solution_text: 'There is no general identity making $\\sin(\\theta)+\\cos(\\theta)$ equal to any of the first three expressions. Hence the correct choice is none of the above.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which calculation has the greatest value? $A=5+4\\times8-3$, $B=(5+4)\\times8-3$, $C=5+(4\\times8-3)$, or $D=5+4\\times(8-3)$.',
    structure: 'compare-values-of-expressions-using-order-of-operations',
    meaningfulCase: 'evaluate-parenthesised-products-before-comparison',
    mastery: false,
    options: [
      { text: '$5+4\\times8-3$', correct: false, why: 'Its value is 34, which is less than the parenthesised second expression.' },
      { text: '$(5+4)\\times8-3$', correct: true },
      { text: '$5+(4\\times8-3)$', correct: false, why: 'It has the same value as the first expression, namely 34.' },
      { text: '$5+4\\times(8-3)$', correct: false, why: 'Its value is 25 because the final bracket reduces the multiplication.' }
    ],
    solution_text: 'Evaluate each: $A=5+32-3=34$, $B=9\\times8-3=69$, $C=5+32-3=34$, and $D=5+4\\times5=25$. The greatest value is $B$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
