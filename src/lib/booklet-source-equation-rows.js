// Opt in only after comparing the source: continuation equals signs project
// to the left of the expression/result column, including colour-wrapped rows.
export function alignSourceLeadingEquals(latex) {
  if(!latex.startsWith('\\begin{aligned}&')||latex.includes('\\phantom')||
    !/\\\\(?:\[[^\]]*\])?&(?:\\textcolor\{[^}]+\}\{)?=/.test(latex))return latex;
  return latex.replace('\\begin{aligned}&','\\begin{aligned}&\\phantom{{}={}}')
    .replace(/(\\\\(?:\[[^\]]*\])?&(?:\\textcolor\{[^}]+\}\{)?)=/g,'$1{}=');
}
