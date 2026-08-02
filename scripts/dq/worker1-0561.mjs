import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0561', [
  {
    question_text: '$2019\,g=$',
    structure: 'convert-grams-to-kilograms',
    meaningfulCase: 'divide-gram-measurement-by-one-thousand',
    mastery: false,
    options: [
      { text: '$2.019\,kg$', correct: true },
      { text: '$21.9\,kg$', correct: false, why: 'Moves the decimal point in the wrong direction when converting grams to kilograms.' },
      { text: '$20.19\,kg$', correct: false, why: 'Uses an incorrect place-value conversion from grams to kilograms.' },
      { text: '$2.19\,kg$', correct: false, why: 'Drops a digit instead of dividing 2019 grams by 1000.' }
    ],
    solution_text: 'Since $1000\,g=1\,kg$, divide by 1000: $2019\div1000=2.019\,kg$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Simplify $3n+1-n-6$.',
    structure: 'collect-like-terms',
    meaningfulCase: 'combine-n-terms-and-constant-terms-separately',
    mastery: false,
    options: [
      { text: '$2n+5$', correct: false, why: 'Combines the constant terms with the wrong sign.' },
      { text: '$2n-5$', correct: true },
      { text: '$4n+7$', correct: false, why: 'Adds terms that should be subtracted when collecting like terms.' },
      { text: '$-2$', correct: false, why: 'Cancels the variable terms incorrectly instead of combining their coefficients.' }
    ],
    solution_text: 'Collect like terms: $3n-n=2n$ and $1-6=-5$. Therefore the expression simplifies to $2n-5$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Each Junior Mathematical Challenge answer sheet weighs 6 grams. If 140 000 pupils enter the Challenge, what will be the total weight of all their answer sheets?',
    structure: 'multiply-and-convert-mass-units',
    meaningfulCase: 'multiply-six-grams-by-one-hundred-forty-thousand-and-convert',
    mastery: false,
    options: [
      { text: '840 kg', correct: true },
      { text: '8 400 kg', correct: false, why: 'Places the decimal conversion one factor of ten too high.' },
      { text: '84 000 kg', correct: false, why: 'Does not correctly convert the total grams into kilograms.' },
      { text: '840 000 kg', correct: false, why: 'Treats the gram total as though it were already a kilogram total.' }
    ],
    solution_text: 'The total is $6\times140000=840000$ grams. Since $1000$ grams is $1$ kilogram, this is $840$ kg.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'When expanding $(2-\sqrt6)(3+2\sqrt6)$, before simplifying there are four terms. Which option below contains two of these terms?',
    structure: 'identify-terms-in-surds-expansion',
    meaningfulCase: 'expand-by-four-products-before-combining-surds',
    mastery: false,
    options: [
      { text: '$-\sqrt{18}$ and $6$', correct: false, why: 'Neither pair matches the two products in the expansion with their correct coefficients.' },
      { text: '$-3\sqrt6$ and $-12$', correct: true },
      { text: '$-3\sqrt6$ and $-\sqrt{12}$', correct: false, why: 'The second expression is not one of the direct products in the expansion.' },
      { text: '$6$ and $3\sqrt6$', correct: false, why: 'The product involving $2\times2\sqrt6$ is $4\sqrt6$, not $3\sqrt6$.' }
    ],
    solution_text: 'Expanding gives $2\times3=6$, $2\times2\sqrt6=4\sqrt6$, $-\sqrt6\times3=-3\sqrt6$, and $-\sqrt6\times2\sqrt6=-12$. Thus option B contains two terms.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'The $n$th term of a sequence is $3n^2-4n+5$. What is the third term of the sequence?',
    structure: 'substitute-term-number-into-sequence-formula',
    meaningfulCase: 'evaluate-explicit-formula-at-n-equals-three',
    mastery: false,
    options: [
      { text: '20', correct: true },
      { text: '44', correct: false, why: 'Substitutes incorrectly into the quadratic expression for the third term.' },
      { text: '294', correct: false, why: 'Uses an incorrect power or multiplication when evaluating the formula.' },
      { text: '74', correct: false, why: 'Does not correctly calculate $3(3^2)-4(3)+5$.' }
    ],
    solution_text: 'Substitute $n=3$: $3(3^2)-4(3)+5=27-12+5=20$.' ,
    diagramRequired: false,
    uncertainties: []
  }
]);
