import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0281', [
  {
    question_text: 'Find the value of $\\sin 2\\theta$ in the right-angled triangle shown. The hypotenuse is $\\sqrt{13}$ and the side adjacent to $\\theta$ is $3$.',
    structure: 'apply-double-angle-sine-identity-from-right-triangle',
    meaningfulCase: 'find-opposite-side-then-use-two-sine-cosine',
    mastery: false,
    options: [
      { text: '$\\dfrac{12}{\\sqrt{13}}$', correct: false, why: 'Multiplies the side lengths without dividing by the two required hypotenuses.' },
      { text: '$\\dfrac{6}{\\sqrt{13}}$', correct: false, why: 'Uses only one factor of the hypotenuse in the double-angle calculation.' },
      { text: '$\\dfrac{6}{13}$', correct: false, why: 'Uses the wrong numerator for the product of the sine and cosine ratios.' },
      { text: '$\\dfrac{12}{13}$', correct: true }
    ],
    solution_text: 'The opposite side is $\\sqrt{13-9}=2$. Hence $\\sin\\theta=2/\\sqrt{13}$ and $\\cos\\theta=3/\\sqrt{13}$. Therefore $\\sin2\\theta=2\\sin\\theta\\cos\\theta=2\\cdot2/\\sqrt{13}\\cdot3/\\sqrt{13}=12/13$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'Which symbol makes the statement $-8^\\circ\\text{C}\\;\\square\\;-3^\\circ\\text{C}$ correct?',
    structure: 'compare-two-negative-temperatures',
    meaningfulCase: 'more-negative-temperature-is-smaller',
    mastery: false,
    options: [
      { text: '$=$', correct: false, why: 'The two temperatures are different values.' },
      { text: '$>$', correct: false, why: 'A temperature further below zero is less than a temperature closer to zero.' },
      { text: '$<$', correct: true },
      { text: 'None of these', correct: false, why: 'The less-than symbol correctly compares the two negative temperatures.' }
    ],
    solution_text: 'On the number line, $-8$ lies to the left of $-3$, so $-8^\\circ\\text{C}<-3^\\circ\\text{C}$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'A right-angled triangle has perpendicular sides of lengths $7$ and $2$. Which expression gives the missing hypotenuse length?',
    structure: 'use-pythagoras-to-find-missing-hypotenuse',
    meaningfulCase: 'square-and-add-perpendicular-sides-then-root',
    mastery: false,
    options: [
      { text: '$7^2+2^2$', correct: false, why: 'This is the square of the hypotenuse, not the hypotenuse length itself.' },
      { text: '$7^2-2^2$', correct: false, why: 'Subtracts the squares even though both given sides are perpendicular legs.' },
      { text: '$\\sqrt{7^2+2^2}$', correct: true },
      { text: '$\\sqrt{7^2-2^2}$', correct: false, why: 'Uses subtraction under the square root for a hypotenuse calculation.' }
    ],
    solution_text: 'By Pythagoras, the square of the hypotenuse is $7^2+2^2$. Therefore the missing length is $\\sqrt{7^2+2^2}=\\sqrt{53}$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: 'How many planes of symmetry does the oblique parallelepiped shown have?',
    structure: 'count-planes-of-symmetry-of-oblique-parallelepiped',
    meaningfulCase: 'identify-the-single-symmetry-plane-indicated-by-the-solid',
    mastery: false,
    options: [
      { text: '1', correct: true },
      { text: '2', correct: false, why: 'Introduces a second reflection plane that does not preserve the oblique solid.' },
      { text: '3', correct: false, why: 'Confuses the three visible directions with three actual mirror planes.' },
      { text: '5', correct: false, why: 'Counts several diagonal planes that do not map the displayed solid onto itself.' }
    ],
    solution_text: 'The intended solid has one plane that divides it into mirror-image halves, so the number of planes of symmetry is $1$.',
    diagramRequired: true,
    uncertainties: ['The low-detail perspective drawing does not clearly specify the edge lengths or exact solid; a generic oblique parallelepiped would normally have no mirror plane.']
  },
  {
    question_text: 'The diagram shows $f$ and its derivative $f\'$. Find an equation of the tangent to the graph of $f$ at the point where $x=-1$.',
    structure: 'read-function-value-and-derivative-to-form-tangent',
    meaningfulCase: 'use-f-prime-as-gradient-and-f-at-minus-one-as-point',
    mastery: false,
    options: [
      { text: '$y=-4x-1$', correct: true },
      { text: '$y=-4x$', correct: false, why: 'Uses the correct gradient but gives the wrong intercept for the tangent point.' },
      { text: '$y=-4x+3$', correct: false, why: 'Confuses the function value at the point with the line intercept.' },
      { text: '$y=-4x-2$', correct: false, why: 'Has the right gradient but does not pass through the graph point at $x=-1$.' }
    ],
    solution_text: 'From the graph, $f(-1)=3$ and $f\'(-1)=-4$. The tangent through $(-1,3)$ with gradient $-4$ is $y-3=-4(x+1)$, hence $y=-4x-1$.',
    diagramRequired: true,
    uncertainties: []
  }
]);
