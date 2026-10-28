// A section can omit dedicated handwriting allowances without changing native
// table cells, clozes or other mathematical response structures.
export const sectionShowsWorkingSpace = (section, options = {}) => section?.workingSpace !== 'none' && options.showResponseSpaces !== false;
