import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0571', [
  {
    question_text: 'Three numbers are written as products of prime factors: $5^2\times7$, $2\times3\times5$, and $3\times5\times7$. Which is the lowest common multiple (LCM) of the three numbers?',
    structure: 'find-lcm-from-prime-factorisations',
    meaningfulCase: 'use-largest-exponent-of-each-prime-across-the-three-numbers',
    mastery: false,
    options: [
      { text: '5', correct: false, why: 'Includes only a common factor rather than all prime factors needed for the LCM.' },
      { text: '210', correct: false, why: 'Uses only one factor of 5 instead of the largest exponent 5 squared.' },
      { text: '525', correct: false, why: 'Omits the required factor of 2 and therefore is not a multiple of the second number.' },
      { text: '1050', correct: true }
    ],
    solution_text: 'Take the largest power of every prime present: $2\times3\times5^2\times7=1050$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Simplify $\sqrt{32}$ as much as possible.',
    structure: 'simplify-surds',
    meaningfulCase: 'extract-largest-square-factor-from-radicand',
    mastery: false,
    options: [
      { text: '$4\sqrt2$', correct: true },
      { text: '$2\sqrt8$', correct: false, why: 'Is equivalent to the surd but has not been simplified fully.' },
      { text: '$4\sqrt8$', correct: false, why: 'Introduces an incorrect factor when extracting the square factor.' },
      { text: '$16\sqrt2$', correct: false, why: 'Uses 16 as though it were the square root of 32.' }
    ],
    solution_text: '$\sqrt{32}=\sqrt{16\times2}=4\sqrt2$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'The ordered data are $2,5,6,9,12,16,22,25,31,35,42,45$. Calculate the upper quartile.',
    structure: 'find-upper-quartile-from-ordered-data',
    meaningfulCase: 'take-median-of-upper-six-values',
    mastery: false,
    options: [
      { text: '33', correct: true },
      { text: '31', correct: false, why: 'Selects the lower of the two central values in the upper half.' },
      { text: '35', correct: false, why: 'Selects the higher of the two central values in the upper half.' },
      { text: '32.5', correct: false, why: 'Averages the wrong pair of values when finding the upper-half median.' }
    ],
    solution_text: 'The upper half is $22,25,31,35,42,45$. Its median is the mean of 31 and 35: $Q_3=(31+35)/2=33$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'To work out the volume of the cone shown, you do. The diameter is 10 and the height is 12.',
    structure: 'select-cone-volume-formula',
    meaningfulCase: 'use-one-third-pi-radius-squared-height-with-radius-five',
    mastery: false,
    options: [
      { text: '$\frac13\times\pi\times5^2\times13$', correct: false, why: 'Uses the sloping length 13 instead of the perpendicular height 12.' },
      { text: '$\frac13\times\pi\times5^2\times12$', correct: true },
      { text: '$\frac13\times\pi\times10^2\times12$', correct: false, why: 'Uses the diameter as the radius in the volume formula.' },
      { text: 'None of these', correct: false, why: 'The correct cone-volume calculation is included in option B.' }
    ],
    solution_text: 'The radius is half the diameter, so $r=5$. Cone volume is $V=\frac13\pi r^2h=\frac13\pi\times5^2\times12$.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'What is the number 13 749 when rounded to the nearest 10, nearest 100 and nearest 1000?',
    structure: 'round-number-to-multiple-place-values',
    meaningfulCase: 'round-using-the-next-digit-at-tens-hundreds-and-thousands-places',
    mastery: false,
    options: [
      { text: 'a) 13 740; b) 13 700; c) 14 000', correct: false, why: 'Rounds the units digit down incorrectly when finding the nearest ten.' },
      { text: 'a) 13 750; b) 13 700; c) 14 000', correct: false, why: 'The nearest-ten value is correct, but this option is not the intended complete set in the source layout.' },
      { text: 'a) 13 750; b) 13 800; c) 14 000', correct: true },
      { text: 'a) 13 750; b) 13 700; c) 10 000', correct: false, why: 'Rounds to the wrong hundred and thousand values.' }
    ],
    solution_text: 'The nearest 10 is 13 750, the nearest 100 is 13 700, and the nearest 1000 is 14 000. The source’s option C displays 13 800 for the nearest 100, which conflicts with standard rounding; this item is uncertain.' ,
    diagramRequired: false,
    uncertainties: ['The image’s option C appears to give 13 800 for rounding 13 749 to the nearest 100, but standard rounding gives 13 700. The source options are internally inconsistent; option C is retained as the intended keyed answer.']
  }
]);
