// Standard speech-bubble characters. House assets, not retained source images.
export const AVATAR_COUNT = 14;
export const AVATAR_WIDTH_MM = 17;
const AVATAR_PATH = /^\/booklet-assets\/shared\/avatars\/avatar-(0[1-9]|1[0-4])\.png$/;
export const avatarSrc = index => `/booklet-assets/shared/avatars/avatar-${String(index%AVATAR_COUNT+1).padStart(2,'0')}.png`;
export const isStandardAvatar = src => typeof src==='string'&&AVATAR_PATH.test(src);
const characterKey = name => String(name??'').trim().toLowerCase();

// An avatar image block names its source character. Blocks are visited in
// booklet order, so a character keeps one avatar throughout the booklet.
export function avatarBlocks(root) {
 const result=[];
 const walk=node=>{
  if(!node||typeof node!=='object')return;
  if(node.type==='image'&&typeof node.avatar==='string'&&characterKey(node.avatar))result.push(node);
  for(const [key,value] of Object.entries(node))if(!['sourceLayoutEvidence','sourceReview','sourceAtom','spec','provenance'].includes(key)&&value&&typeof value==='object')walk(value);
 };
 walk(root);return result;
}
export function assignBookletAvatars(project) {
 const next=structuredClone(project),assigned=new Map();
 for(const section of next.sections??[])for(const block of avatarBlocks(section)){
  const key=characterKey(block.avatar);
  if(!assigned.has(key))assigned.set(key,assigned.size);
  Object.assign(block,{src:avatarSrc(assigned.get(key)),alt:block.avatar.trim(),width:AVATAR_WIDTH_MM,aspectRatio:1});
  delete block.crop;
 }
 return {project:next,characters:[...assigned].map(([character,index])=>({character,src:avatarSrc(index)}))};
}
