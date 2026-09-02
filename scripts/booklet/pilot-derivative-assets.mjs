import fs from 'node:fs/promises';

import { allNodes } from '../../src/lib/practice-question-model.js';

export const DERIVATIVE_SOURCE_NAMES = [
  'img-020.png',
  'img-021.jpg',
  'img-022.jpg',
  'img-023.jpg',
  'img-024.jpg',
  'img-025.jpg',
  'derivative-source-g.svg',
  'derivative-source-h.svg',
  'derivative-source-i.svg',
];
export const DERIVATIVE_SOLUTION_IMAGES = ['img-026.png', 'img-027.png', 'img-028.png'];
const dimensions = [[317, 315], [317, 315], [317, 315], [313, 311], [313, 311], [313, 311], [258, 256], [258, 256], [258, 256]];
const solutionPaths = [
  'M 25.8 128 H 232.2',
  'M 25.8 128 H 232.2 M 25.8 184.3 H 232.2',
  'M 25.8 71.7 H 232.2 M 25.8 184.3 H 232.2',
  'M 25.0 261.2 L 288.0 49.8',
  'M 25.0 49.8 L 288.0 261.2',
  'M 25.0 267.5 L 288.0 62.2',
  'M 15.5 179.2 H 242.5',
  'M 20.6 56.2 C 87.6 68.3, 119.1 227.6, 156.5 242.6 C 193.9 227.6, 225.4 68.3, 292.4 56.2',
  'M 20.6 46.1 L 237.4 261.2',
];
const sourceCurves = [
  'M 25.8 38.4 L 232.2 217.6',
  'M 25.8 217.6 C 69.7 217.6, 100.6 140.8, 129 133.1 C 157.4 125.4, 188.3 56.3, 232.2 38.4',
  'M 25.8 215.0 C 61.9 107.5, 108.4 41.0, 160.0 41.0 C 206.4 43.5, 232.2 138.2, 247.7 220.2',
];
const reasons = [
  'The original graph is horizontal, so its derivative is the constant function $f\\prime(x)=0$.',
  'The original graph is a straight line with positive gradient, so its derivative is a positive constant.',
  'The original graph is a straight line with negative gradient, so its derivative is a negative constant.',
  'The original curve is an upward-opening parabola, so its derivative is a straight line with positive gradient through the origin.',
  'The original curve is a downward-opening parabola, so its derivative is a straight line with negative gradient through the origin.',
  'The original curve has a minimum at $x=3$, so its derivative is a positive-gradient line crossing the $x$-axis at $x=3$.',
  'The original graph is a straight line with negative gradient, so its derivative is a negative constant.',
  'The original graph has a stationary point of inflection at the origin, so its derivative is an upward-opening parabola with vertex at the origin.',
  'The original curve has a maximum, so its derivative is a decreasing straight line crossing the $x$-axis at the x-coordinate of the maximum.',
];

function graphSvg(width, height, pathData, { curve = '#1c76bf', axes = '#5b9bd5' } = {}) {
  const x0 = (width * .04).toFixed(1);
  const x1 = (width * .96).toFixed(1);
  const y0 = (height * .5).toFixed(1);
  const yTop = (height * .04).toFixed(1);
  const yBottom = (height * .96).toFixed(1);
  const xCentre = (width * .5).toFixed(1);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '"><defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="' + axes + '"/></marker></defs><line x1="' + x0 + '" y1="' + y0 + '" x2="' + x1 + '" y2="' + y0 + '" stroke="' + axes + '" stroke-width="2" marker-end="url(#arrow)"/><line x1="' + xCentre + '" y1="' + yBottom + '" x2="' + xCentre + '" y2="' + yTop + '" stroke="' + axes + '" stroke-width="2" marker-end="url(#arrow)"/><path d="' + pathData + '" fill="none" stroke="' + curve + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>\n';
}

function questionDiagram(id, src, alt) {
  return {
    id,
    role: 'question',
    format: 'image',
    code: null,
    src,
    widthMm: 95,
    alt,
    overlayOf: null,
    transparent: false,
    axes: { xMin: -3, xMax: 3, yMin: -2, yMax: 3 },
    derived: false,
    reviewStatus: 'approved',
  };
}

function solutionDiagram(id, src, format, alt, derived = false) {
  return {
    id,
    role: 'solution',
    format,
    code: null,
    src,
    widthMm: 95,
    alt,
    overlayOf: null,
    transparent: false,
    derived,
    reviewStatus: 'approved',
  };
}

export async function writeDerivativeAssets({ publicRoot = 'public' } = {}) {
  const pilotRoot = publicRoot + '/booklet-assets/pilot';
  const solutionRoot = pilotRoot + '/derivative-solutions';
  await fs.mkdir(solutionRoot, { recursive: true });
  await fs.writeFile(pilotRoot + '/derivative-source-g.svg', graphSvg(258, 256, sourceCurves[0]), 'utf8');
  await fs.writeFile(pilotRoot + '/derivative-source-h.svg', graphSvg(258, 256, sourceCurves[1]), 'utf8');
  await fs.writeFile(pilotRoot + '/derivative-source-i.svg', graphSvg(258, 256, sourceCurves[2]), 'utf8');
  for (let index = 3; index < 9; index += 1) {
    const letter = String.fromCharCode(97 + index);
    const [width, height] = dimensions[index];
    await fs.writeFile(solutionRoot + '/derivative-' + letter + '.svg', graphSvg(width, height, solutionPaths[index]), 'utf8');
  }
}

export async function repairDerivativeQuestion(question, { publicRoot = 'public', writeAssets = true } = {}) {
  if (!question) return question;
  if (writeAssets) await writeDerivativeAssets({ publicRoot });
  const leaves = allNodes(question.content).filter((node) => !node.children?.length);
  if (leaves.length !== 9) throw new Error('Derivative question must have nine leaf curves; found ' + leaves.length);
  for (const [index, node] of leaves.entries()) {
    const letter = String.fromCharCode(97 + index);
    const sourceName = DERIVATIVE_SOURCE_NAMES[index];
    node.questionDiagrams = [questionDiagram('pilot-derivative-source-' + letter, '/booklet-assets/pilot/' + sourceName, 'Original source curve ' + letter)];
    const solution = index < 3
      ? solutionDiagram('pilot-derivative-solution-' + letter, '/booklet-assets/pilot/' + DERIVATIVE_SOLUTION_IMAGES[index], 'image', 'Original derivative solution sketch ' + letter)
      : solutionDiagram('pilot-derivative-solution-' + letter, '/booklet-assets/pilot/derivative-solutions/derivative-' + letter + '.svg', 'svg', 'Calibrated derivative solution sketch ' + letter, true);
    node.answer = { ...(node.answer ?? {}), short: null, worked: reasons[index], solutionDiagrams: [solution] };
    node.prompt = '';
  }
  question.content.prompt = 'Sketch the derivative function for each curve.';
  question.review = { ...(question.review ?? {}), flags: [] };
  question.status = question.status ?? 'draft';
  return question;
}
