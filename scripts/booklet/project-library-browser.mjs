// Shared browser-check adapter for the searchable project picker.
export async function selectLibraryProject(page, id) {
  const trigger=page.getByRole('button',{name:'Open booklet',exact:true});
  if(await trigger.getAttribute('aria-expanded')!=='true')await trigger.click();
  await page.getByLabel('Search projects',{exact:true}).fill('');
  const archived=page.getByLabel('Archived projects',{exact:true});await archived.uncheck();
  const target=page.locator('#project-library-menu button[data-project-id='+JSON.stringify(id)+']');
  if(!await target.count())await archived.check();
  await target.click();
}
