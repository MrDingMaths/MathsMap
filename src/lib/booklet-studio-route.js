// Old import links open Projects without creating or loading a source run.
export function bookletStudioRoute(hash, initialStage = 'builder', projectId = null) {
  const query = new URLSearchParams(hash.split('?')[1] ?? '');
  const requested = query.get('stage') ?? initialStage;
  const retired = ['full-import', 'import', 'review'].includes(requested);
  const stage = retired || requested === 'projects' ? 'projects' : 'builder';
  if (retired) {
    query.set('stage', 'projects');
    query.delete('run');
    query.delete('page');
    if (!query.has('project') && projectId) query.set('project', projectId);
  }
  return { stage, projectId: query.get('project') ?? projectId,
    redirect: retired ? `${hash.split('?')[0]}?${query}` : null };
}
