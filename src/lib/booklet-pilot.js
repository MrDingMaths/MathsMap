import { stableQuestionId } from './booklet-model.js';

// A small, curated slice used to prove the end-to-end print workflow. The
// source questions remain in MathsMap's skill JSON; this recipe only describes
// order, teaching blocks, and the question IDs to include.
export const PILOT_SOURCE_SKILLS = Object.freeze([
  'average-rate-of-change',
  'average-speed-distance-time',
  'instantaneous-rate-tangent',
  'estimate-instantaneous-rate-graph',
  'gradient-secant-limit',
  'define-derivative-tangent',
  'derivative-first-principles',
  'derivative-constant-linear',
]);

const q = (skillId, tier, index) => stableQuestionId(skillId, tier, index - 1);

export const PILOT_RECIPE = Object.freeze({
  id: 'estimating-change-pilot',
  title: 'Estimating Change and the Derivative',
  subtitle: 'Mathematics Advanced - Year 11',
  version: 'pilot-1',
  pinnedQuestionIds: Object.freeze([
    q('derivative-first-principles', 'mastery', 3),
  ]),
  solutionModeOverrides: Object.freeze({
    [q('average-rate-of-change', 'foundation', 2)]: 'answer',
    [q('average-rate-of-change', 'development', 5)]: 'worked',
    [q('derivative-first-principles', 'mastery', 3)]: 'worked',
  }),
  spaceOverrides: Object.freeze({
    [q('average-rate-of-change', 'foundation', 2)]: 'standard',
    [q('average-rate-of-change', 'development', 5)]: 'extended',
    [q('derivative-first-principles', 'mastery', 3)]: 'extended',
  }),
  sections: Object.freeze([
    {
      id: 'rates',
      title: 'Estimating change',
      kicker: 'Investigation and interpretation',
      blocks: Object.freeze([
        {
          type: 'narrative',
          title: 'Why rates of change matter',
          content: 'Calculus begins with a simple question: how quickly is one quantity changing as another quantity changes? Average rate of change compares two points; the derivative will eventually let us zoom in to one point.',
        },
        {
          type: 'callout',
          variant: 'key-ideas',
          title: 'Key ideas',
          content: 'The average rate of change over [a,b] is (f(b)-f(a))/(b-a). It is the gradient of the secant joining the two points.',
        },
        {
          type: 'worked-example',
          title: 'Guided example',
          questionId: q('average-rate-of-change', 'foundation', 1),
        },
        {
          type: 'questions',
          title: 'Interpret rates of change',
          questionIds: Object.freeze([
            q('average-rate-of-change', 'foundation', 2),
            q('average-rate-of-change', 'foundation', 3),
            q('average-rate-of-change', 'development', 5),
            q('average-speed-distance-time', 'foundation', 2),
          ]),
        },
      ]),
    },
    {
      id: 'secants-tangents',
      title: 'Secants and tangents',
      kicker: 'From an interval to an instant',
      blocks: Object.freeze([
        {
          type: 'narrative',
          title: 'Shrinking the interval',
          content: 'A secant uses two distinct points. When the second point moves closer to the first, the secant approaches the tangent. This limiting gradient is the instantaneous rate of change.',
        },
        {
          type: 'callout',
          variant: 'investigation',
          title: 'Investigation prompt',
          content: 'Compare the gradients for increasingly short intervals. What value do they appear to approach?',
        },
        {
          type: 'questions',
          title: 'Read and estimate gradients',
          questionIds: Object.freeze([
            q('instantaneous-rate-tangent', 'foundation', 1),
            q('instantaneous-rate-tangent', 'development', 3),
            q('estimate-instantaneous-rate-graph', 'foundation', 1),
            q('estimate-instantaneous-rate-graph', 'development', 1),
            q('gradient-secant-limit', 'foundation', 3),
          ]),
        },
      ]),
    },
    {
      id: 'first-principles',
      title: 'Differentiation by first principles',
      kicker: 'A reliable algebraic method',
      blocks: Object.freeze([
        {
          type: 'narrative',
          title: 'The derivative definition',
          content: 'The derivative at x=c is the limit of the average rate of change as the interval width h tends to zero: f prime of c equals the limit of (f(c+h)-f(c))/h.',
        },
        {
          type: 'callout',
          variant: 'key-ideas',
          title: 'Algebra checklist',
          content: 'Substitute c+h, expand carefully, subtract f(c), factor and cancel h, then take the limit.',
        },
        {
          type: 'worked-example',
          title: 'Guided first-principles example',
          questionId: q('derivative-first-principles', 'foundation', 1),
        },
        {
          type: 'questions',
          title: 'Differentiate from the definition',
          questionIds: Object.freeze([
            q('define-derivative-tangent', 'foundation', 5),
            q('derivative-constant-linear', 'foundation', 3),
            q('derivative-first-principles', 'foundation', 3),
            q('derivative-first-principles', 'development', 1),
            q('derivative-first-principles', 'mastery', 3),
          ]),
        },
      ]),
    },
  ]),
});

export { q as pilotQuestionId };
