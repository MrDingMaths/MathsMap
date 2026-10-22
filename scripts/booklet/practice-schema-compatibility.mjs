import {isDeepStrictEqual} from 'node:util';
// Exactly the approved optional assessment metadata extension. Source tasks,
// required fields, enum values and every other schema constraint stay pinned.
export function compatiblePracticeSchema(before,after){
 const definition={type:'object',required:['model','assessedAt','rubricVersion','taskHash','evidence'],properties:{model:{type:'string',minLength:1},assessedAt:{type:'string',format:'date-time'},rubricVersion:{const:'mathsmap-cognitive-demand-v1'},taskHash:{type:'string',pattern:'^[a-f0-9]{64}$'},originalTaskHash:{type:'string',pattern:'^[a-f0-9]{64}$'},evidence:{type:'string',minLength:1}},additionalProperties:false};
 if(before.$defs?.reasoningAssessment||before.$defs?.question?.properties?.classification?.properties?.assessment)return false;
 if(!isDeepStrictEqual(after.$defs?.reasoningAssessment,definition)||!isDeepStrictEqual(after.$defs?.question?.properties?.classification?.properties?.assessment,{$ref:'#/$defs/reasoningAssessment'}))return false;
 const stripped=structuredClone(after);delete stripped.$defs.reasoningAssessment;delete stripped.$defs.question.properties.classification.properties.assessment;
 return isDeepStrictEqual(before,stripped);
}
