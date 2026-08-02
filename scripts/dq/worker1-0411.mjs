import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0411', [
  {
    question_text: 'For every 3 eggs Charlotte uses 350 g of flour. If she uses 12 eggs, how much flour does she need?',
    structure: 'scale-direct-proportion-between-ingredients',
    meaningfulCase: 'multiply-three-hundred-fifty-grams-by-four',
    mastery: false,
    options: [
      { text: '$1.4\\text{ kg}$', correct: true },
      { text: '$140\\text{ g}$', correct: false, why: 'Divides the flour amount instead of scaling it up from 3 eggs to 12 eggs.' },
      { text: '$1.04\\text{ kg}$', correct: false, why: 'Uses an incorrect conversion or multiplication for the proportional amount.' },
      { text: '$1400\\text{ kg}$', correct: false, why: 'Converts grams to kilograms incorrectly by a factor of one thousand.' }
    ],
    solution_text: 'Twelve eggs is four times three eggs, so flour required is $4\\times350=1400\\text{ g}=1.4\\text{ kg}$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which answer shows the correct factorisation of $x^2+2x-8$?',
    structure: 'factorise-monic-quadratic-with-integer-roots',
    meaningfulCase: 'find-factors-minus-two-and-four-with-product-minus-eight',
    mastery: false,
    options: [
      { text: '$(x-2)(x+4)$', correct: true },
      { text: '$(x+2)(x-4)$', correct: false, why: 'Expands to $x^2-2x-8$, giving the wrong coefficient of x.' },
      { text: '$(x-2)(x-4)$', correct: false, why: 'Expands to $x^2-6x+8$, with both middle and constant signs wrong.' },
      { text: '$(x+2)(x+4)$', correct: false, why: 'Expands to $x^2+6x+8$, not the given quadratic.' }
    ],
    solution_text: 'The numbers 4 and -2 have product -8 and sum 2, so $x^2+2x-8=(x+4)(x-2)$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which is the most likely equation of the exponential-looking graph?',
    structure: 'identify-exponential-function-from-graph-shape',
    meaningfulCase: 'recognise-positive-exponential-growth-with-horizontal-asymptote',
    mastery: false,
    options: [
      { text: '$y=3x-4$', correct: false, why: 'A linear function has constant gradient and cannot produce the curved growth shown.' },
      { text: '$y=x^3+2x-1$', correct: false, why: 'A cubic does not have the displayed exponential asymptotic shape.' },
      { text: '$y=5x+x^2$', correct: false, why: 'A polynomial curve does not approach a horizontal asymptote as shown.' },
      { text: '$y=3^x$', correct: true }
    ],
    solution_text: 'The curve is positive, increases increasingly rapidly, and approaches a horizontal level for negative x, matching the exponential model $y=3^x$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A function machine multiplies an input by 3 and then adds 6. If the output is 21, what input went in?',
    structure: 'reverse-two-step-function-machine',
    meaningfulCase: 'subtract-six-then-divide-by-three',
    mastery: false,
    options: [
      { text: '45', correct: false, why: 'Applies the operations in the forward direction to the output.' },
      { text: '81', correct: false, why: 'Multiplies and adds again instead of undoing the machine steps.' },
      { text: '5', correct: true },
      { text: '9', correct: false, why: 'Subtracts 12 or otherwise reverses the operations incorrectly.' }
    ],
    solution_text: 'Reverse the operations: $21-6=15$, then $15\\div3=5$. The input was 5.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Write $0.\\overline{32}$ as a fraction in its lowest terms.',
    structure: 'convert-repeating-decimal-to-fraction',
    meaningfulCase: 'two-digit-repetend-over-ninety-nine',
    mastery: false,
    options: [
      { text: '$\\dfrac13$', correct: false, why: 'Represents $0.333\ldots$, not the repeating block 32.' },
      { text: '$\\dfrac{32}{100}$', correct: false, why: 'Treats the repeating decimal as terminating after two decimal places.' },
      { text: '$\\dfrac{32}{99}$', correct: true },
      { text: '$\\dfrac{32}{90}$', correct: false, why: 'Uses the denominator for a mixed repeating pattern rather than a two-digit repetend.' }
    ],
    solution_text: 'For the two-digit recurring decimal $0.\\overline{32}$, the fraction is $32/(10^2-1)=32/99$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
