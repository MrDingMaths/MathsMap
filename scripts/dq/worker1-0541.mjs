import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0541', [
  {
    question_text: 'What is the size of the obtuse angle $AOC$? The angle $ADC$ is $116^\circ$.',
    structure: 'find-central-angle-from-inscribed-angle',
    meaningfulCase: 'use-reflex-central-angle-twice-inscribed-angle-then-take-obtuse-angle',
    mastery: false,
    options: [
      { text: '$116^\circ$', correct: false, why: 'Uses the inscribed angle directly instead of doubling it for the central angle.' },
      { text: '$64^\circ$', correct: false, why: 'Subtracts the given angle from 180 degrees but does not find the required central angle.' },
      { text: '$128^\circ$', correct: true },
      { text: '$232^\circ$', correct: false, why: 'Finds the reflex central angle, whereas the question asks for the obtuse angle.' }
    ],
    solution_text: 'The angle at the circumference is half the angle at the centre standing on the same chord. Thus the reflex angle $AOC$ is $2\times116^\circ=232^\circ$. The obtuse angle is $360^\circ-232^\circ=128^\circ$.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which of the following calculations would give the area of this sector? The sector has angle $40^\circ$ and radius $16$ mm.',
    structure: 'select-sector-area-calculation',
    meaningfulCase: 'use-angle-over-360-times-pi-times-radius-squared',
    mastery: false,
    options: [
      { text: '$\dfrac{360}{40}\times\pi\times16^2$', correct: false, why: 'Uses the reciprocal angle fraction and therefore gives a multiple too large.' },
      { text: '$\dfrac{360}{40}\times\pi\times32^2$', correct: false, why: 'Uses both the reciprocal fraction and the diameter instead of the radius.' },
      { text: '$\dfrac{40}{360}\times\pi\times32^2$', correct: false, why: 'Uses the diameter squared even though the sector formula requires the radius squared.' },
      { text: '$\dfrac{40}{360}\times\pi\times16^2$', correct: true }
    ],
    solution_text: 'The area of a sector is $\frac{\theta}{360}\pi r^2$. Substituting $\theta=40$ and $r=16$ gives $\frac{40}{360}\times\pi\times16^2$.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Describe the movements to get from point $V$ to point $W$.',
    structure: 'read-translation-from-coordinate-grid',
    meaningfulCase: 'compare-coordinates-for-left-five-and-down-three-translation',
    mastery: false,
    options: [
      { text: 'Left 4 squares, down 3 squares', correct: false, why: 'The horizontal change from x=2 to x=-3 is five squares, not four.' },
      { text: 'Left 5 squares, down 3 squares', correct: true },
      { text: 'Right 5 squares, up 3 squares', correct: false, why: 'Reverses both directions when moving from V to W.' },
      { text: 'Left 5 squares, up 3 squares', correct: false, why: 'The y-coordinate decreases from 2 to -1, so the movement is down.' }
    ],
    solution_text: 'Point $V$ is $(2,2)$ and point $W$ is $(-3,-1)$. The x-coordinate changes by $-5$ and the y-coordinate by $-3$, so move left 5 squares and down 3 squares.' ,
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Here are the first four terms of a sequence: $5,11,21,35$. What are the next two terms?',
    structure: 'continue-quadratic-sequence',
    meaningfulCase: 'extend-first-differences-increasing-by-four',
    mastery: false,
    options: [
      { text: '41, 47', correct: false, why: 'Continues with a constant difference instead of the quadratic pattern.' },
      { text: '53, 75', correct: true },
      { text: '49, 63', correct: false, why: 'Does not continue the first differences 6, 10, 14 with second difference 4.' },
      { text: '45, 51', correct: false, why: 'Adds the wrong increments after the fourth term.' }
    ],
    solution_text: 'The first differences are $6,10,14$, increasing by 4. The next differences are 18 and 22, so the next terms are $35+18=53$ and $53+22=75$.' ,
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'A jacket is £245 in the sale after a 30% reduction. How much did the jacket cost before the sale?',
    structure: 'reverse-percentage-reduction',
    meaningfulCase: 'sale-price-is-seventy-percent-of-original-price',
    mastery: false,
    options: [
      { text: '£275', correct: false, why: 'Adds an approximate amount rather than reversing the 30 percent reduction.' },
      { text: '£171.50', correct: false, why: 'Applies the 30 percent reduction to the sale price again.' },
      { text: '£318.50', correct: false, why: 'Divides by an incorrect percentage multiplier.' },
      { text: '£350', correct: true }
    ],
    solution_text: 'After a 30% reduction, the sale price is 70% of the original. Therefore the original price is $245\div0.7=£350$.' ,
    diagramRequired: false,
    uncertainties: []
  }
]);
