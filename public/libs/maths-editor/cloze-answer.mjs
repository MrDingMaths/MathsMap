// Cloze answers remain strings. Only an explicit, complete inline-maths string
// opts into typesetting; prose, HTML and undelimited expressions stay escaped.
export function renderClozeAnswer(answer,math,escapeHtml){
 const match=typeof answer==='string'&&answer.match(/^\$([^$\r\n]+)\$$/);
 return match?math(match[1],false):escapeHtml(answer);
}
