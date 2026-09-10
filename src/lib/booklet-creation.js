// Creation policy only. Never apply this while loading or duplicating a project.
export const COMPACT_ANSWERS = Object.freeze({shortFontPt:9,workedFontPt:9.5,gutterMm:8,shortDiagramMm:45,workedDiagramMm:55,diagramWidths:{}});

export function creationSettings(mode='compact') {
  if (!['compact','exact'].includes(mode)) throw new Error('Creation mode must be compact or exact');
  return mode==='exact'
    ? {preserveSourcePages:true,practiceAnswers:'none',showResponseSpaces:true}
    : {paginationMode:'flexible',preserveSourcePages:false,exerciseOrganisation:'topic',compactAnswers:structuredClone(COMPACT_ANSWERS),includeTeachingAnswers:false,teachingPresentationVersion:1,mathsStyle:'display-glyphs',generatedCover:true,flowEdition:'with-short',practiceAnswers:'short',showResponseSpaces:true,houseStyleVersion:'1.1.0'};
}

export function applyCreationPreset(raw, mode='compact') {
  const project=structuredClone(raw);
  project.settings={...project.settings,...creationSettings(mode)};
  if(mode==='compact'&&raw.settings?.sourcePaginationPolicy==='source-boundaries')project.settings.preserveSourcePages=true;
  if(mode==='exact'){
    for(const key of ['paginationMode','exerciseOrganisation','compactAnswers','includeTeachingAnswers','teachingPresentationVersion','mathsStyle','generatedCover','flowEdition'])delete project.settings[key];
    return project;
  }
  project.topics??=[];
  for(const section of project.sections??[]){
    section.phase??=section.role==='front-matter'?'front-matter':/practice|challenge/.test(section.role??'')?'practice':'teaching';
    section.topicId??=`topic-${section.id}`;
    if(!project.topics.some(t=>t.id===section.topicId))project.topics.push({id:section.topicId,title:section.title});
  }
  return project;
}
