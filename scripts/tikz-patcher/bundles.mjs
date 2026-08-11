import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generate, patchRunTex, patchTikzJax } from './patcher.mjs';

export const ENGINE_BUNDLES = [
  { name: 'run-tex', vendor: 'run-tex.vendor.js', deployed: 'run-tex.js' },
  { name: 'tikzjax', vendor: 'tikzjax.vendor.js', deployed: 'tikzjax.js' },
];

// Keep the bundle names and patch provenance here; the actual pure transforms
// live in patcher.mjs so generation and integrity checking share one source.
export const ENGINE_PATCHES = Object.freeze({
  'run-tex': 'deployed-2026-08',
  tikzjax: 'deployed-2026-08',
});

/** Apply literal source patches, refusing ambiguous or missing sites. */
export function applyLiteralPatches(source, patches) {
  let output = source;
  for (const patch of patches) {
    const count = output.split(patch.find).length - 1;
    if (count !== 1) {
      throw new Error(`${patch.name ?? 'patch'} matched ${count} times; expected exactly once`);
    }
    output = output.replace(patch.find, patch.replace);
  }
  return output;
}

export function generateDeployedBundle(name, source) {
  if (!(name in ENGINE_PATCHES)) throw new Error(`Unknown TikZ bundle: ${name}`);
  return name === 'run-tex' ? patchRunTex(source) : patchTikzJax(source);
}

export function verifyBundlePairs(root) {
  const dir = join(root, 'public', 'libs', 'tikzjax');
  const pending = [];
  const errors = [];
  for (const bundle of ENGINE_BUNDLES) {
    const vendorPath = join(dir, bundle.vendor);
    const deployedPath = join(dir, bundle.deployed);
    const hasVendor = existsSync(vendorPath);
    const hasDeployed = existsSync(deployedPath);
    if (!hasVendor && hasDeployed) {
      pending.push(`${bundle.name}: no committed ${bundle.vendor}; cannot reproduce-check ${bundle.deployed}`);
      continue;
    }
    if (hasVendor !== hasDeployed) {
      errors.push(`${bundle.name}: vendor/deployed pair is incomplete`);
      continue;
    }
    const generatedResult = generate({ write: false });
    const generatedText = generatedResult[bundle.name === 'run-tex' ? 'runOut' : 'tikzOut'];
    const deployed = readFileSync(deployedPath);
    const generated = Buffer.from(generatedText, 'utf8');
    if (!generated.equals(deployed)) {
      errors.push(`${bundle.name}: generated output differs from committed ${bundle.deployed}`);
    }
  }
  return { errors, pending };
}
