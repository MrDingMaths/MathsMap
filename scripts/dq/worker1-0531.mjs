import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0531', [
  {
    question_text: 'What is the formula for the area of a parallelogram?',
    structure: 'identify-area-formula-for-parallelogram',
    meaningfulCase: 'use-base-times-perpendicular-height-not-sloping-height',
    mastery: false,
    options: [
      { text: 'base $\times$ height', correct: false, why: 'Does not state that the height must be perpendicular to the base.' },
      { text: 'Area = base $\times$ perpendicular height', correct: true },
      { text: 'Area = $\frac{1}{2}\times$ base $\times$ perpendicular height', correct: false, why: 'Includes the one-half factor used for a triangle, not a parallelogram.' },
      { text: 'Area = base $\times$ parallel height', correct: false, why: 'A parallel side or height does not give the perpendicular distance needed for area.' }
    ],
    solution_text: 'The area of a parallelogram is its base multiplied by the perpendicular height: $A=b\times h$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Three numbers are written as the product of prime factors: $2^3\times3^2\times5^2\times7$, $2^4\times3^3\times5^2\times7^2$, and $2^3\times3^3\times5\times7$. Which is the highest common factor (HCF) of the three numbers?',
    structure: 'find-hcf-from-prime-factorisations',
    meaningfulCase: 'take-the-smallest-exponent-of-each-common-prime',
    mastery: false,
    options: [
      { text: '210', correct: false, why: 'Omits one factor of 3 from the common prime-factor product.' },
      { text: '504', correct: false, why: 'Does not use the correct minimum exponents for all common primes.' },
      { text: '1680', correct: false, why: 'Uses an incorrect combination of prime factors and exponents.' },
      { text: '2520', correct: true }
    ],
    solution_text: 'For the HCF, use the smallest exponent of each prime: $2^3\times3^2\times5\times7=8\times9\times5\times7=2520$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'There are 180 students in Year 12. 75 study maths, 93 study psychology, and 40 study neither. How many students study both maths and psychology?',
    structure: 'find-intersection-from-set-counts',
    meaningfulCase: 'use-union-total-excluding-neither-and-subtract-single-set-counts',
    mastery: false,
    options: [
      { text: '168', correct: false, why: 'Adds the two subject totals without removing the students counted twice.' },
      { text: '56', correct: false, why: 'Does not correctly account for the 140 students studying at least one subject.' },
      { text: '28', correct: true },
      { text: '140', correct: false, why: 'This is the number studying at least one subject, not the overlap.' }
    ],
    solution_text: 'The number studying at least one subject is $180-40=140$. By inclusion-exclusion, the overlap is $75+93-140=28$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Put the angles in order of size from biggest to smallest and say which rule could be used to calculate side $AB$. In triangle $ABC$, $\angle C=95^\circ$, $AC=8$ cm and $BC=11$ cm.',
    structure: 'order-triangle-angles-and-select-cosine-rule',
    meaningfulCase: 'largest-angle-opposite-longest-side-and-two-sides-included-angle',
    mastery: false,
    options: [
      { text: '$C,A,B$ and cosine rule', correct: true },
      { text: '$C,A,B$ and sine rule', correct: false, why: 'The cosine rule is appropriate because two sides and their included angle are given.' },
      { text: '$B,C,A$ and cosine rule', correct: false, why: 'The 95-degree angle is largest, so it must be first in the order.' },
      { text: '$C,B,A$ and sine rule', correct: false, why: 'Reverses the order of the angles opposite the 11 cm and 8 cm sides and chooses the wrong rule.' }
    ],
    solution_text: 'The longest side is $AB$, so $C$ is the largest angle. Since $BC=11$ is longer than $AC=8$, $A>B$. Thus the order is $C,A,B$. The two known sides enclose the known angle $C$, so use the cosine rule to find $AB$.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'The shoe sizes of 12 girls are $4,3,6,7,6,5,3,8,5,6,9,5$. What type of data has been collected?',
    structure: 'classify-shoe-size-data',
    meaningfulCase: 'numerical-discrete-values-collected-directly-from-participants',
    mastery: false,
    options: [
      { text: 'Secondary quantitative data', correct: true },
      { text: 'Ordinal data', correct: false, why: 'Shoe sizes are numerical measurements rather than merely ranked categories.' },
      { text: 'Continuous data', correct: false, why: 'The recorded shoe-size values are discrete standard sizes, not arbitrary real measurements.' },
      { text: 'Primary qualitative data', correct: false, why: 'The values are numerical and directly collected, not descriptive categories.' }
    ],
    solution_text: 'Shoe size is numerical and the listed standard sizes are discrete, quantitative values. The source option labels this as secondary quantitative data; however, because the girls’ sizes are collected directly, the “secondary” label is questionable.' ,
    diagramRequired: false,
    uncertainties: ['The image labels option A as secondary quantitative data, although data collected directly from the 12 girls would ordinarily be primary quantitative data. Option A is retained as the intended keyed answer.']
  }
]);
