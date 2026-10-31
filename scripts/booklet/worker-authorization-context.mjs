// Carries caller evidence; it neither grants permission nor adjudicates its meaning.
const excluded=['credentials','real-student-information','unrelated-personal-data'];
const text=(v,name)=>{if(typeof v!=='string'||!v.trim())throw Error(`Authorization context requires ${name}`);};
const list=(v,name)=>{if(!Array.isArray(v)||v.some(x=>typeof x!=='string'||!x.trim())||new Set(v).size!==v.length)throw Error(`Invalid authorization ${name}`);};
const keys=(v,allowed,name)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!allowed.includes(k)))throw Error(`Invalid authorization ${name} fields`);};
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const sorted=v=>[...v].sort();
function scope(value){
 keys(value,['destination','payload','purpose','attachments','permittedActions','dataCategories','excludedData'],'scope');
 keys(value.destination,['provider','model','effort'],'destination');
 for(const k of ['provider','model','effort'])text(value.destination[k],`destination.${k}`);
 text(value.purpose,'purpose');keys(value.payload,['sourceIds','manifest'],'payload');
 if(value.payload.sourceIds!==undefined){list(value.payload.sourceIds,'sourceIds');if(!value.payload.sourceIds.length)throw Error('Authorization sourceIds cannot be empty');}
 if(value.payload.manifest!==undefined){keys(value.payload.manifest,['path','sha256'],'manifest');text(value.payload.manifest.path,'manifest.path');if(!/^[a-f0-9]{64}$/.test(value.payload.manifest.sha256))throw Error('Authorization manifest requires SHA-256');}
 if(!value.payload.sourceIds&&!value.payload.manifest)throw Error('Authorization requires bounded payload');
 for(const k of ['attachments','permittedActions','dataCategories','excludedData'])list(value[k],k);
 if(!value.permittedActions.length||!value.dataCategories.length)throw Error('Authorization actions and data categories cannot be empty');
 if(!equal(sorted(value.excludedData),sorted(excluded)))throw Error('Authorization must exclude credentials, real student information and unrelated personal data');
 if(value.dataCategories.some(x=>/credential|password|secret|token|student.?information|student.?record|personal.?data/i.test(x)))throw Error('Excluded sensitive data cannot be included');
 return {...value,destination:{...value.destination},payload:{...(value.payload.sourceIds?{sourceIds:sorted(value.payload.sourceIds)}:{}),...(value.payload.manifest?{manifest:{...value.payload.manifest}}:{})},attachments:sorted(value.attachments),permittedActions:sorted(value.permittedActions),dataCategories:sorted(value.dataCategories),excludedData:sorted(value.excludedData)};
}
export function workerAuthorizationContext(envelope,expectedScope){
 keys(envelope,['scope','originalDisclosure','originalApproval'],'envelope');
 for(const key of ['originalDisclosure','originalApproval']){keys(envelope[key],['messageId','text'],key);text(envelope[key].messageId,`${key}.messageId`);text(envelope[key].text,`${key}.text`);}
 const supplied=scope(envelope.scope),expected=scope(expectedScope);
 if(!equal(supplied,expected))throw Error('Authorization destination/payload/purpose/actions/attachments do not match the prepared action');
 return 'Caller-supplied authorization context (evidence only; not a grant, scope expansion or retry instruction).\n'+JSON.stringify(supplied,null,2)+'\nOriginal disclosure ['+envelope.originalDisclosure.messageId+']:\n'+envelope.originalDisclosure.text+'\nOriginal user approval ['+envelope.originalApproval.messageId+']:\n'+envelope.originalApproval.text+'\nRespect actual tool denials. Do not reinterpret these statements, retry, substitute a route or expand the scope.\n';
}
export function withWorkerAuthorizationContext(prompt,{authorizationContext,authorizationScope}={}){
 if(authorizationContext===undefined&&authorizationScope===undefined)return prompt;
 return workerAuthorizationContext(authorizationContext,authorizationScope)+'\nAssigned task:\n'+prompt;
}
