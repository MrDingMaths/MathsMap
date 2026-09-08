import fs from 'node:fs';
import assert from 'node:assert/strict';
import katex from 'katex';

const file = 'booklets/projects/linear-relationships-complete-v1.json';
const original = fs.readFileSync(file, 'utf8');
const project = JSON.parse(original);
const changes = [];
const dir = 'output/linear-solution-tone';
fs.mkdirSync(dir, {recursive:true});

function concise(s) {
  return s
    .replace(/To plot (\$[^$]+\$), start at the origin, move /g, '$1: ')
    .replace(/Start at \$\(0,0\)\$, move /g, 'From the origin: ')
    .replace('Start at origin, $0$ units horizontally, move ', 'From the origin: ')
    .replace(/Plot each point on the grid:\n/g, 'From the origin:\n')
    .replace('Plot each point starting from the origin $(0,0)$:', 'From the origin:')
    .replace(/: move /g, ': ')
    .replace('Substitute each $x$ into the rule. For example, ', 'Substitution: ')
    .replace('Plot the pairs in the table and draw the straight line through them; the visible part is shown below.', 'Join the plotted points with a straight line.')
    .replace(/Each time \$x\$ increases by \$1\$, \$y\$ changes by (\$[^$]+\$), so (\$m=[^$]+\$)\./g, 'For each unit increase in $x$, change in $y$: $1; $2.')
    .replace(/At \$x=0\$, the table gives (\$y=[^$]+\$), so (\$c=[^$]+\$)\./g, 'At $x=0$, $1; $2.')
    .replace('Read points from the graph in increasing $x$ order and enter them in a table:', 'Points from the graph:')
    .replace('Substitute into the rule:', 'Substitution:')
    .replace(/Check another column: at (\$x=[^$]+\$), the rule gives (\$y=[^$]+\$), matching the table\./g, 'Check: $1 gives $2.')
    .replace('Check by substituting another plotted point:', 'Check:')
    .replace('The graph shows the relationship within the displayed axes.', '')
    .replace(/The starting value is (\$[^$]+\$) and the rate of change is (\$[^$]+\$), so (\$[^$]+\$)\./g, 'Initial value: $1; rate: $2.\n$3.')
    .replace('Substitute the listed $x$-values to obtain ', '$y$-values: ')
    .replace(/Draw a horizontal line at (\$y=[^$]+\$) to the given line, then read the \$x\$-coordinate of the intersection (\$[^$]+\$)\. Hence (\$x=[^$]+\$)\./g, '$1 intersects the graph at $2, so $3.')
    .replace(/Both lines have gradient (\$[^$]+\$)\. Since they have the same gradient, they are parallel\./g, 'Same gradient $1; the lines are parallel.')
    .replace('Since the gradients are different, the lines will intersect. Therefore, a solution is possible.', 'Different gradients, so the lines intersect: one solution.')
    .replace('so they are parallel. Therefore, there is no solution.', 'so they are parallel: no solution.')
    .replace(/Therefore, the simultaneous solution is /g, 'Solution: ')
    .replace('The point of intersection marked on the graph is ', 'Intersection: ')
    .replace('Point of intersection is ', 'Intersection: ')
    .replace('The values that satisfy both equations simultaneously are ', 'Simultaneous solution: ')
    .replace(/The equation is /g, '')
    .replace(/The rule is /g, '')
    .replace(/, so it is a linear relationship\./g, ': linear.')
    .replace(/, so it is not a linear relationship\./g, ': not linear.')
    .replace(/ \(printed as scaffold\)/g, '')
    .replace(/Correct option: ([A-E])\./g, 'Correct answer: $1.')
    .replace(/We need the line /g, 'Graph ')
    .replace(/We need the horizontal line at /g, 'Horizontal line: ')
    .replace(/[ \t]+\n/g, '\n').trim();
}

const overrides = {
  '10.2': String.raw`$AB$ is vertical: $B=(7,5-3)=(7,2)$.
$BC$ is horizontal: $C=(7-4,2)=(3,2)$.`,
};
function walk(o, path = []) {
  if (!o || typeof o !== 'object') return;
  for (const [key, value] of Object.entries(o)) {
    const next = [...path,key];
    if ((key === 'worked' || key === 'theorySolution') && typeof value === 'string') {
      const text = concise(value);
      if (text !== value) {
        changes.push({path:next,before:value,after:text});
        o[key] = text;
      }
    } else walk(value,next);
  }
}
walk(project.sections, ['sections']);
function replaceAt(path, after) {
  let obj=project; for(const key of path.slice(0,-1)) obj=obj[key];
  const key=path.at(-1), before=obj[key];
  const existing=changes.find(c=>JSON.stringify(c.path)===JSON.stringify(path));
  if(existing) existing.after=after; else changes.push({path,before,after});
  obj[key]=after;
}
const set=(s,b,child,text)=>replaceAt(['sections',String(s),'blocks',String(b),'content',...(child===null?[]:['children',String(child)]),'answer','worked'],text);
set(10,2,null,overrides['10.2']);
set(11,0,0,'Same $x$-coordinate as the top-left vertex and $y$-coordinate as the bottom-right: $(2,3)$.');
set(11,0,2,'Same $x$-coordinate as the bottom-right vertex and $y$-coordinate as the top-left: $(18,1)$.');
set(11,0,3,'$x=19$, $y=-4+7=3$. Vertex: $(19,3)$.');
set(11,0,5,'Symmetry axis: $x=7$.\nHorizontal distance: $7-4=3$.\nRight vertex: $(7+3,8)=(10,8)$.');
set(9,1,1,'$A(2,3)$ and $F(2,5)$ share $x=2$: the same vertical line.');
set(9,1,2,'$B(-4,1)$ and $C(3,1)$ share $y=1$: the same horizontal line.');
set(77,1,0,'Steepest: $y=3x$. Least steep: $y=x$.\nLarger gradient magnitude means a steeper line.');
set(77,1,1,'Positive gradient: increasing. Negative gradient: decreasing.');

// Every changed string must remain valid maths, and all other project data is identical.
for(const change of changes) {
  for(const match of change.after.matchAll(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$|(?<!\\)\$([^$\n]*?)(?<!\\)\$/g)) {
    katex.renderToString(match[1]??match[2],{throwOnError:true,strict:false});
  }
}
const restored=structuredClone(project);
for(const change of changes) {
  let obj=restored; for(const key of change.path.slice(0,-1))obj=obj[key];
  obj[change.path.at(-1)]=change.before;
}
assert.deepEqual(restored,JSON.parse(original));
assert.equal(project.sections.length,93);
fs.writeFileSync(`${dir}/changes.json`,JSON.stringify(changes,null,2)+'\n');
fs.writeFileSync(`${dir}/candidate.json`,JSON.stringify(project,null,2)+'\n');
if(process.argv.includes('--apply')) {
  assert.equal(fs.readFileSync(file,'utf8'),original,'Project changed during editing');
  fs.writeFileSync(`${dir}/before.json`,original,{flag:'wx'});
  // Preserve exact content and layout without normalising unrelated user edits.
  const revisionDir=`booklets/projects/.revisions/${project.id}`;
  fs.mkdirSync(revisionDir,{recursive:true});
  const revisionFile=`${revisionDir}/${project.revision}.json`;
  if(!fs.existsSync(revisionFile)) fs.writeFileSync(revisionFile,original);
  project.revision++;
  project.updatedAt=new Date().toISOString();
  fs.writeFileSync(file,JSON.stringify(project,null,2)+'\n');
}
console.log(JSON.stringify({changed:changes.length,pages:93,revision:project.revision,questionsAndLayoutUnchanged:true,mathsSyntax:'passed'}));
