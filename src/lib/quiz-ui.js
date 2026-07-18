export const shouldCelebrateQuiz = (log = []) =>
  log.some((entry) => entry?.correct === true);

export const uncheckedResultItems = (results) => [
  ...(results?.blocked ?? []).map((item) => ({ ...item, kind: 'blocked' })),
  ...(results?.notAssessed ?? []).map((id) => ({ id, kind: 'not-assessed' }))
];

export const visibleResultItems = (items, expanded, limit = 5) =>
  expanded ? items : items.slice(0, limit);
