// Per-page <title>, description, canonical URL and robots for the public site.
// pageMeta() is pure (lookups are passed in) so it can be tested in Node;
// applyPageMeta() writes the result into <head>. App.svelte calls both on every
// route change. Booklet Studio and the TikZ check manage their own titles.

export const SITE_URL = 'https://mathsmap.mrdingmaths.com';
const SITE = 'MathsMap';
const HOME_TITLE = 'MathsMap: every NSW maths skill, mapped';
const HOME_DESCRIPTION = 'Every NSW Stage 3–6 maths skill, mapped: theory, worked examples, practice and quizzes, with the prerequisites that lead to each skill.';

const SYMBOLS = {
  '\\times': '×', '\\div': '÷', '\\pm': '±', '\\leq': '≤', '\\le': '≤', '\\geq': '≥', '\\ge': '≥',
  '\\neq': '≠', '\\approx': '≈', '\\pi': 'π', '\\theta': 'θ', '\\infty': '∞', '\\degree': '°', '\\circ': '°',
  '\\cdot': '·', '\\to': '→', '\\rightarrow': '→', '\\%': '%', '\\,': ' ', '\\;': ' ', '\\!': '',
};
const SUPERSCRIPTS = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', n: 'ⁿ', '-': '⁻' };

// Plain text for titles and descriptions: inline $…$ LaTeX becomes readable
// Unicode, **bold** markers go, and whitespace collapses.
export function plainText(text = '') {
  // \$ is a literal dollar (money), not a maths delimiter.
  return String(text)
    .replace(/\\\$/g, '\u0000')
    .replace(/\$\$?([^$]*)\$\$?/g, (_, latex) => latexToText(latex.replace(/\u0000/g, '$')))
    .replace(/\u0000/g, '$')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// (?![a-zA-Z]) rather than \b: \log_a is followed by "_", a word character.
const FUNCTIONS = /\\(log|ln|sin|cos|tan|sec|csc|cosec|cot|lim|exp|max|min|det)(?![a-zA-Z])/g;
// A grouped value needs brackets once it is more than one symbol: a/(n+1), x^(n+1).
const wrap = (value) => (/^[\w.√π]+$/u.test(value) ? value : `(${value})`);
const superscript = (value) => ([...value].every((c) => SUPERSCRIPTS[c]) ? [...value].map((c) => SUPERSCRIPTS[c]).join('') : `^${wrap(value)}`);

function latexToText(latex) {
  let out = latex.replace(/\\left|\\right/g, '').replace(/\^\{?\\circ\}?/g, '°');
  for (let i = 0; i < 5; i++) {
    out = out
      .replace(/\^\{([^{}]*)\}/g, (_, group) => superscript(group))
      .replace(/_\{([^{}]*)\}/g, (_, group) => `_${wrap(group)}`)
      .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => `${wrap(a)}/${wrap(b)}`)
      .replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, (_, n, x) => `${superscript(n)}√${wrap(x)}`)
      .replace(/\\sqrt\{([^{}]*)\}/g, (_, x) => `√${wrap(x)}`)
      .replace(/\\(?:text|mathrm|mathbf|operatorname|mathit)\{([^{}]*)\}/g, '$1');
  }
  out = out
    .replace(/\^([0-9n])/g, (_, c) => SUPERSCRIPTS[c])
    .replace(FUNCTIONS, '$1')
    .replace(/\\int(?![a-zA-Z])/g, '∫').replace(/\\sum(?![a-zA-Z])/g, 'Σ')
    .replace(/\\(?:iff|Leftrightarrow)\b/g, '⇔').replace(/\\(?:implies|Rightarrow)\b/g, '⇒')
    .replace(/\\ne\b/g, '≠');
  for (const [command, symbol] of Object.entries(SYMBOLS)) out = out.split(command).join(symbol);
  return out.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '').replace(/\s*([=<>≤≥≠×÷±])\s*/g, ' $1 ').replace(/\s+/g, ' ').trim();
}

export function clip(text, max = 155) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:.\s]+$/, '')}…`;
}

const page = (title, description, path, robots = 'index,follow') => ({
  title: title === HOME_TITLE ? title : `${title} · ${SITE}`,
  description: clip(plainText(description || HOME_DESCRIPTION)),
  canonical: `${SITE_URL}${path}`,
  robots,
});
const notFound = (path) => page('Not found', HOME_DESCRIPTION, path, 'noindex,follow');
const PRIVATE = 'noindex,follow';

// lookups: { skillById, topicById, courseById, primaryTopicForSkill, skillCountForCourse }
export function pageMeta(route, lookups) {
  const id = route.params?.[0];
  switch (route.name) {
    case 'home':
      return page(HOME_TITLE, HOME_DESCRIPTION, '/');
    case 'course': {
      const course = lookups.courseById.get(id);
      if (!course) return notFound(`/course/${id}`);
      const count = lookups.skillCountForCourse?.(id);
      return page(course.title, `${count ? `All ${count} ` : 'The '}NSW ${course.title} maths skills, topic by topic: theory, worked examples, practice and quizzes, with the prerequisites for each skill.`, `/course/${id}`);
    }
    case 'topic': {
      const topic = lookups.topicById.get(id);
      if (!topic) return notFound(`/topic/${id}`);
      return page(`${plainText(topic.title)} · Stage ${topic.stage}`, topic.blurb, `/topic/${id}`);
    }
    case 'skill': {
      const skill = lookups.skillById.get(id);
      if (!skill) return notFound(`/skill/${id}`);
      const topic = lookups.primaryTopicForSkill?.(id);
      const context = topic ? ` Part of ${plainText(topic.title)}, Stage ${skill.stage}.` : '';
      return page(`${plainText(skill.title)} · Stage ${skill.stage}`, `${plainText(skill.blurb ?? '')}${context} Theory, worked examples and practice with solutions.`, `/skill/${id}`);
    }
    case 'map':
      return page('Skill map', 'Explore how NSW Stage 3–6 maths skills connect: every skill and the prerequisites that lead to it, course by course.', '/map');
    case 'learning':
      return page('My learning', HOME_DESCRIPTION, '/learning', PRIVATE);
    case 'quiz':
      return page('Quiz', 'Check what you know with a short maths quiz and find the right skill to work on next.', '/quiz', PRIVATE);
    case 'quiz-history':
      return page('Quiz results', HOME_DESCRIPTION, '/quiz-history', PRIVATE);
    default:
      return notFound(`/${route.name}`);
  }
}

function setMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    document.head.append(el);
  }
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
}

export function applyPageMeta(meta) {
  document.title = meta.title;
  setMeta('meta[name="description"]', { name: 'description', content: meta.description });
  setMeta('meta[name="robots"]', { name: 'robots', content: meta.robots });
  setMeta('link[rel="canonical"]', { rel: 'canonical', href: meta.canonical });
  setMeta('meta[property="og:title"]', { property: 'og:title', content: meta.title });
  setMeta('meta[property="og:description"]', { property: 'og:description', content: meta.description });
  setMeta('meta[property="og:url"]', { property: 'og:url', content: meta.canonical });
  setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
  setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: meta.description });
}
