import { writeJob } from './worker1-write.mjs';

writeJob('dq-visual-0011', [
  {
    question_text: "Which point would correctly represent the highlighted row to draw a cumulative frequency curve?\n\n$\\begin{array}{c|c}\\varepsilon&\\text{Frequency}\\\\\\hline 0<\\varepsilon\\le20&8\\\\20<\\varepsilon\\le40&12\\\\40<\\varepsilon\\le60&10\\\\60<\\varepsilon\\le80&4\\end{array}$\n\n[tikz]\n\\begin{tikzpicture}[scale=0.45]\\draw[->] (0,0)--(5.2,0) node[right] {$\\varepsilon$};\\draw[->] (0,0)--(0,4.2);\\draw[gray!30,step=1] (0,0) grid (5,4);\\node[fill=red!70,text=white] at (4,4) {$A$};\\node[fill=blue!70,text=white] at (4,2.2) {$B$};\\node[fill=green!70!black,text=white] at (3,2.2) {$C$};\\node[fill=violet!70,text=white] at (3,4) {$D$};\\end{tikzpicture}\n[/tikz]",
    structure: 'plot-cumulative-frequency-at-upper-class-boundary',
    meaningfulCase: 'add-frequency-to-running-total-at-40',
    mastery: false,
    options: [
      {text: '$A$', correct: true},
      {text: '$B$', correct: false, why: 'Uses the frequency 12 as the cumulative frequency instead of adding the previous frequency.'},
      {text: '$C$', correct: false, why: 'Uses the lower class boundary 30 rather than the upper boundary 40.'},
      {text: '$D$', correct: false, why: 'Combines the wrong boundary and cumulative total for the highlighted class.'}
    ],
    solution_text: 'For a cumulative frequency curve, use the upper class boundary and the cumulative total. At $\\varepsilon=40$, the cumulative frequency is $8+12=20$. Therefore the correct point is $(40,20)$, which is $A$.',
    diagramRequired: true,
    uncertainties: []
  },
  {
    question_text: '$2d^2+3d$\n\nWhat does this simplify to?',
    structure: 'identify-non-like-terms-in-expression',
    meaningfulCase: 'quadratic-and-linear-terms-cannot-be-collected',
    mastery: false,
    options: [
      {text: '$6d^3$', correct: false, why: 'Multiplies the terms and adds their powers even though the expression uses addition.'},
      {text: '$5+d^3$', correct: false, why: 'Adds coefficients and incorrectly combines unlike powers of the variable.'},
      {text: '$5d^3$', correct: false, why: 'Adds coefficients and powers, but $d^2$ and $d$ are not like terms.'},
      {text: 'None of the above', correct: true}
    ],
    solution_text: 'The terms $2d^2$ and $3d$ have different powers of $d$, so they are not like terms and cannot be collected. The expression is already simplified: $2d^2+3d$. Hence the answer is None of the above.',
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: 'Determine whether the improper integral\n\n$\\displaystyle\\int_0^\\infty \\frac{10}{\\sqrt{x(x+81)}}\\,dx$\n\nconverges or diverges. Evaluate the integral if it converges.',
    structure: 'test-improper-integral-convergence-at-infinity',
    meaningfulCase: 'integrand-has-logarithmic-tail-like-10-over-x',
    mastery: false,
    options: [
      {text: '$\\dfrac{10\\pi}{81}$', correct: false, why: 'Produces a finite value without addressing the divergent behaviour as x tends to infinity.'},
      {text: '$\\dfrac{10\\pi}{9}$', correct: false, why: 'Treats the integral as convergent despite its asymptotic reciprocal-x behaviour.'},
      {text: 'diverges', correct: true},
      {text: '$\\dfrac{10}{81}$', correct: false, why: 'Confuses a constant algebraic factor with the value of an improper integral.'}
    ],
    solution_text: 'As $x\\to\\infty$, $\\sqrt{x(x+81)}\\sim x$, so the integrand behaves like $10/x$. Since $\\int^\\infty 10/x\\,dx$ diverges logarithmically, the given improper integral diverges.',
    diagramRequired: false,
    uncertainties: []
  },
  {
    question_text: "Consider the function $f(x)$, whose graph is shown below. Choose the diagram that shows the graph of $f'(x)$.\n\n[tikz]\n\\begin{tikzpicture}[scale=0.42]\\draw[gray!25,step=1] (-4,-5) grid (5,6);\\draw[->] (-4.2,0)--(5.2,0) node[right] {$x$};\\draw[->] (0,-5.2)--(0,6.2) node[above] {$y$};\\draw[thick,orange!80!black] plot[smooth] coordinates {(-4,-5) (-3,4.8) (-2,5.4) (0,0) (2,-5.3) (4,0) (5,6)};\\end{tikzpicture}\n[/tikz]\n\nA: upward parabola with vertex $(0,-4)$ and roots $-2,2$\nB: upward parabola with vertex $(0,-4)$ and roots $-2,2$\nC: quartic with zeros at $-2,0,2$\nD: downward parabola with vertex $(0,4)$",
    structure: 'infer-derivative-graph-from-turning-points',
    meaningfulCase: 'cubic-increasing-decreasing-increasing',
    mastery: false,
    options: [
      {text: 'A', correct: false, why: 'The displayed option has the wrong vertical placement and does not match the derivative values.'},
      {text: 'B', correct: true},
      {text: 'C', correct: false, why: 'A derivative of this cubic is quadratic, not a quartic with three separate zeros.'},
      {text: 'D', correct: false, why: 'A downward parabola would give the wrong sign pattern for the slopes of the cubic.'}
    ],
    solution_text: "The original cubic has stationary points at approximately $x=-2$ and $x=2$, so $f'(x)$ is zero at those values. The cubic is increasing, then decreasing, then increasing, so its derivative is positive, negative, positive: an upward-opening parabola. The graph with roots $-2$ and $2$ and vertex near $(0,-4)$ is option B.",
    diagramRequired: true,
    uncertainties: ['The small option labels and exact plotted scales are low-resolution, but the turning-point and sign pattern identify B.']
  },
  {
    question_text: 'Calculate the standard deviation of:\n\n$12,\\ 13,\\ 24,\\ 24,\\ 37$\n\ncorrect to one decimal place.',
    structure: 'calculate-population-standard-deviation-from-raw-data',
    meaningfulCase: 'round-standard-deviation-of-five-values',
    mastery: false,
    options: [
      {text: '$103.5$', correct: false, why: 'Uses a large unnormalised total rather than taking the square root of the variance.'},
      {text: '$10.2$', correct: false, why: 'Uses an incorrect divisor or arithmetic result for the deviations from the mean.'},
      {text: '$414$', correct: false, why: 'This is the sum of squared deviations, not the standard deviation.'},
      {text: '$9.1$', correct: true}
    ],
    solution_text: 'The mean is $22$. The squared deviations are $100,81,4,4,225$, whose sum is $414$. The population variance is $414/5=82.8$, so the standard deviation is $\\sqrt{82.8}=9.099\\ldots$, which rounds to $9.1$.',
    diagramRequired: false,
    uncertainties: []
  }
]);
