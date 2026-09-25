export const PROJECT_CATEGORIES = [
  ['master', 'Master'], ['class', 'Class booklet'], ['import-review', 'Import review'],
];

export function normalizeProjectLibrary(value = {}) {
  return {
    category: PROJECT_CATEGORIES.some(([id]) => id === value?.category) ? value.category : null,
    courseId: typeof value?.courseId === 'string' ? value.courseId : '',
    classLabel: typeof value?.classLabel === 'string' ? value.classLabel.trim() : '',
    archivedAt: typeof value?.archivedAt === 'string' && Number.isFinite(Date.parse(value.archivedAt)) ? value.archivedAt : null,
  };
}

export function groupLibraryProjects(projects, courses, { query = '', archived = false } = {}) {
  const groups = new Map(), needle = query.trim().toLocaleLowerCase();
  for (const project of projects) {
    const library = normalizeProjectLibrary(project.library);
    if (!!library.archivedAt !== archived) continue;
    const course = courses.find(c => c.id === library.courseId);
    const category = library.category;
    const label = category === 'master'
      ? `Masters / ${course ? `Stage ${course.stage}${course.title===`Stage ${course.stage}`?'':` / ${course.title}`}` : 'Unassigned'}`
      : category === 'class' ? `Class booklets / ${library.classLabel || 'Unassigned'}`
      : category === 'import-review' ? 'Import reviews' : 'Unassigned';
    if (needle && !`${project.title} ${label} ${course?.title ?? ''} ${course ? `Stage ${course.stage}` : ''} ${library.classLabel}`.toLocaleLowerCase().includes(needle)) continue;
    const key = category === 'master' ? `master:${course?.id ?? ''}` : category === 'class' ? `class:${library.classLabel}` : category ?? 'unassigned';
    if (!groups.has(key)) groups.set(key, { key, label, rank: category === 'master' ? 0 : category === 'class' ? 1 : category === 'import-review' ? 2 : 3, stage: course?.stage ?? Infinity, order: course?.order ?? Infinity, projects: [] });
    groups.get(key).projects.push(project);
  }
  return [...groups.values()].sort((a,b) => a.rank-b.rank || (a.rank===0 ? a.stage-b.stage || a.order-b.order : 0) || a.label.localeCompare(b.label, undefined, {numeric:true}))
    .map(group => ({...group, projects:group.projects.sort((a,b) => a.title.localeCompare(b.title, undefined, {numeric:true}) || a.id.localeCompare(b.id))}));
}
