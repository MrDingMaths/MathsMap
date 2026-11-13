// Whether a worked answer opens with displayed mathematics. Its answer label then sits at
// the top of the answer, not on its first baseline: KaTeX gives a multi-line environment
// (align, aligned, cases, ...) its baseline at the vertical centre, so a first-baseline label
// landed beside the middle of the opening group (Mastering Adv 11 Ch 5, 13 November 2026).
const DISPLAY_START=/^\s*(?:\$\$|\\\[|\$\s*\\begin\{(?:align|aligned|alignat|gather|gathered|multline|split|cases|array|matrix|pmatrix|bmatrix)\*?\})/;

export function workedAnswerStartsWithDisplay(source){
  return DISPLAY_START.test(String(source??''));
}
