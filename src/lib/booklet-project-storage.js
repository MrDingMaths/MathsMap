function responseJson(response) {
  return response.json().then((value) => {
    if (!response.ok) throw Object.assign(new Error(value.error ?? `Booklet project request failed (${response.status})`), { status: response.status });
    return value;
  });
}

async function request(url, options = {}, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(url, {
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  return responseJson(response);
}

export function listBookletProjects(fetchImpl = globalThis.fetch) {
  return request('/__booklet/projects?summary=1', {}, fetchImpl);
}

export function getProjectBankSync(id,fetchImpl=globalThis.fetch){
  return request('/__booklet/projects/'+encodeURIComponent(id)+'/bank-sync',{},fetchImpl);
}
export function resolveProjectBankSync(id,body,fetchImpl=globalThis.fetch){
  return request('/__booklet/projects/'+encodeURIComponent(id)+'/bank-sync',{method:'POST',body:JSON.stringify(body)},fetchImpl);
}

export async function openBookletProject(id,fetchImpl=globalThis.fetch){
  try{const value=await request('/__booklet/projects/'+encodeURIComponent(id)+'/open',{},fetchImpl);if(value?.project)return value;}
  catch(error){if(error.status!==404)throw error;}
  // Compatibility with earlier authoring servers and isolated renderer fixtures.
  const project=await loadBookletProject(id,fetchImpl);
  try{return {project,bankSync:await getProjectBankSync(id,fetchImpl),bankSyncError:''};}
  catch(error){return {project,bankSync:{items:[]},bankSyncError:'Could not check bank updates. '+error.message};}
}

export function loadBookletProject(id, fetchImpl = globalThis.fetch) {
  return request('/__booklet/projects/' + encodeURIComponent(id), {}, fetchImpl);
}

export function createBookletProject(value = {}, fetchImpl = globalThis.fetch) {
  return request('/__booklet/projects', { method: 'POST', body: JSON.stringify(value) }, fetchImpl);
}

export function saveBookletProject(project, fetchImpl = globalThis.fetch) {
  return request('/__booklet/projects/' + encodeURIComponent(project.id), {
    method: 'PUT',
    body: JSON.stringify({ project, expectedRevision: project.revision }),
  }, fetchImpl);
}

export function duplicateBookletProject(id, title = null, fetchImpl = globalThis.fetch) {
  return request('/__booklet/projects/' + encodeURIComponent(id) + '/duplicate', { method: 'POST', body: JSON.stringify(typeof title==='object'&&title?title:{ title }) }, fetchImpl);
}

export function deleteBookletProject(id, confirmId, fetchImpl = globalThis.fetch) {
  return request('/__booklet/projects/' + encodeURIComponent(id), { method: 'DELETE', body: JSON.stringify({ confirmId }) }, fetchImpl);
}

export function promoteProjectQuestion(projectId, body, fetchImpl = globalThis.fetch) {
  return request('/__booklet/projects/' + encodeURIComponent(projectId) + '/promote-question', { method: 'POST', body: JSON.stringify(body) }, fetchImpl);
}

export function promoteProjectModule(projectId, body, fetchImpl = globalThis.fetch) {
  return request('/__booklet/projects/' + encodeURIComponent(projectId) + '/promote-module', { method: 'POST', body: JSON.stringify(body) }, fetchImpl);
}
