// Local, dev-only persistence for Booklet Studio. Keeping storage behind a
// tiny adapter makes the authoring model testable in Node and keeps a future
// backend from leaking into the builder components.

import { deepCopy, normalizeBookletProject } from './booklet-model.js';

export const BOOKLET_PROJECTS_KEY = 'mathsmap.booklet.projects.v2';
export const BOOKLET_LIBRARY_KEY = 'mathsmap.booklet.library.v2';

function usableStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage; } catch { return null; }
}

function readJson(storage, key, fallback) {
  const target = usableStorage(storage);
  if (!target) return fallback;
  try {
    const value = JSON.parse(target.getItem(key) ?? 'null');
    return value ?? fallback;
  } catch { return fallback; }
}

function writeJson(storage, key, value) {
  const target = usableStorage(storage);
  if (!target) return false;
  try { target.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function loadBookletProjects(storage) {
  const values = readJson(storage, BOOKLET_PROJECTS_KEY, []);
  return Array.isArray(values) ? values.map((value) => normalizeBookletProject(value)) : [];
}

export function loadBookletProject(id, storage) {
  return loadBookletProjects(storage).find((project) => project.id === id) ?? null;
}

export function saveBookletProject(project, storage) {
  const value = normalizeBookletProject({ ...deepCopy(project), updatedAt: new Date().toISOString() });
  const projects = loadBookletProjects(storage).filter((item) => item.id !== value.id);
  projects.unshift(value);
  return writeJson(storage, BOOKLET_PROJECTS_KEY, projects) ? value : null;
}

export function deleteBookletProject(id, storage) {
  const projects = loadBookletProjects(storage).filter((item) => item.id !== id);
  return writeJson(storage, BOOKLET_PROJECTS_KEY, projects);
}

export function loadBookletLibrary(storage) {
  const values = readJson(storage, BOOKLET_LIBRARY_KEY, []);
  return Array.isArray(values) ? deepCopy(values) : [];
}

export function saveBookletMaster(master, storage) {
  const value = deepCopy(master);
  const library = loadBookletLibrary(storage).filter((item) => item.id !== value.id);
  library.unshift(value);
  return writeJson(storage, BOOKLET_LIBRARY_KEY, library) ? value : null;
}

export function removeBookletMaster(id, storage) {
  const library = loadBookletLibrary(storage).filter((item) => item.id !== id);
  return writeJson(storage, BOOKLET_LIBRARY_KEY, library);
}

export function createAutosave(save, { delay = 500 } = {}) {
  let timer = null;
  return (project) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; save(project); }, delay);
  };
}
