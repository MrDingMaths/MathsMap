import fs from 'node:fs/promises';
import path from 'node:path';
import {inside, noLinks} from './storage-archive.mjs';

// Autosaves persist the current document promptly. Recovery checkpoints sample
// that stream independently, so fine adjustments do not duplicate whole books.
export const CHECKPOINT_INTERVAL_MS = 5 * 60 * 1000;
export async function projectCheckpointEntries(projectRoot, previous, {force = false, now = Date.now()} = {}) {
  if (!previous) return [];
  const id = String(previous.id ?? '').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0,120);
  const directory = inside(projectRoot, '.revisions/' + id);
  const stateFile = inside(projectRoot, '.revisions/.checkpoints/' + id + '.json');
  const milestoneFile = inside(projectRoot, '.revisions/milestones.json');
  for (const file of [directory,stateFile,milestoneFile]) await noLinks(file);
  let state;
  try { state = JSON.parse(await fs.readFile(stateFile,'utf8')); }
  catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
  const valid = state?.version === 1 && Number.isFinite(state.at) && Number.isSafeInteger(state.revision) && state.revision <= previous.revision;
  let milestones, malformedPins = false;
  try { milestones = JSON.parse(await fs.readFile(milestoneFile,'utf8')); }
  catch (error) { if(error instanceof SyntaxError) malformedPins = true; else if(error.code !== 'ENOENT') throw error; }
  // Invalid milestone metadata fails safe by taking a checkpoint, never silently
  // dropping a potentially deliberate checkpoint. Retention separately fails closed.
  const pins = milestones?.[previous.id];
  const invalidPins = malformedPins || (milestones !== undefined && (!milestones || typeof milestones !== 'object' || Array.isArray(milestones) || (pins !== undefined && (!Array.isArray(pins) || pins.some(n=>!Number.isSafeInteger(n)||n<0)))));
  const due = !valid || now < state.at || now - state.at >= CHECKPOINT_INTERVAL_MS;
  if (!force && !due && !invalidPins && !pins?.includes(previous.revision)) return [];
  return [
    [path.join(directory, previous.revision + '.json'), previous],
    [stateFile, {version:1,at:now,revision:previous.revision}],
  ];
}
