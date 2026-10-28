# Exam-section pilot (28 October 2026)

Phase 4 of the booklet end-goal programme is a pilot. James must confirm the
source-label mapping before live questions are added or regrouped. No question
bank questions are imported into booklets by this workflow.

Sections may use `role: "exam"`, `phase: "practice"` and
`workingSpace: "none"`. The last setting suppresses dedicated handwriting
allowances only; native response tables, cells and clozes remain intact. Its
absence preserves existing rendering. The end-section order is Mixed review,
Exam questions, Challenge; the source section order remains authoritative, so
merely loading an existing project does not move anything.

Question blocks and canonical bank records may optionally carry a `source`
object with `provider`, `paper`, `year`, `label`, `origin`. The `label` prints
at the start of the question. Missing source labels leave rendering unchanged.
Files, crops and extraction provenance continue to belong in import evidence,
not in canonical bank records. These optional fields do not publish questions.

## Read-only MathsBase export

```text
node scripts/booklet/export-mathsbase-exams.mjs --mapping mapping.json --out .booklet-work/RUN/exams
```

The mapping file has `projectId`, `skillIds`, explicit MathsBase `subtopicIds`,
`schools` and `questions`. MathsBase classifies questions by course/subtopic,
not by MathsMap skill ID. Each selected question therefore needs a reviewed
entry keyed by external question ID:

```json
{
  "projectId": "PILOT",
  "skillIds": ["SKILL"],
  "subtopicIds": [219],
  "schools": {},
  "questions": {
    "EXTERNAL-ID": {
      "skillId": "SKILL",
      "archetype": "reviewed-archetype",
      "routine": true,
      "inScope": true
    }
  },
  "labelMappingApproved": false
}
```

Development, Mastery and Challenge are eligible for assessment; difficulty
alone does not establish that a question is routine. Only one question per
reviewed skill/archetype pair is selected. Unassessed questions are held.
`--input ROWS.json` uses a local read-only export instead of the network.
The script writes candidate files only, never a project, question bank or
external database. Every output remains `pilot-approval-required`.

Proposed labels (pending pilot confirmation):

| Code | Label |
| --- | --- |
| `HSC.ADV.2011` | HSC Advanced 2011 |
| `HSC.EXT1.2023` | HSC Extension 1 2023 |
| `PLC.Y9.S2.2020` | PLC Y9 S2 2020 |
| `HSC.<school>.2020` | Approved school name Y12 2020 |

School display names are held until approved. Explicit Y11/Y12 in the source
must be preserved; a trial without a year-level token needs an explicit approved
`yearLevel` in its school mapping. A `schools` entry may be a name string when
the code contains its year level, or `{ "name": "School", "yearLevel": "Y12" }`.
CAIE, MB, GEN, LBNZ, AU/AMC and SmarterMaths are excluded. Unknown providers are
excluded rather than inferred to be school papers.

## Verified pilot state

The active-master inventory on 28 October found **11** explicit Exam questions
topics containing **149** questions, and **405** other title/source-labelled
exam candidates. The latter is a discovery list, not a reviewed classification.
The local inventory is `.booklet-work/end-goal-20261028/phase4/existing-exams.json`.

`binomial-theorem-v1` revision 98 is a practical regrouping pilot: its existing
11-question Exam questions topic already precedes its 11-question Challenge
topic. Retain all IDs and content; propose only the exam role, no-working-space
setting and approved source labels. Three questions have “HSC Extension 1
Sample Question” without a year, and one title identifies Extension 2: retain
these facts for the pilot scope decision rather than guessing a year or scope.
No live regrouping has occurred.

MathsBase taxonomy read succeeded: 218 is “Divide polynomials”; 219 is “Factor
and remainder theorem”. The initial direct-table read returned HTTP 401. The
sister repository's instructions then established its supported `Questions.fetch`
data layer and read-only `fetch_questions` RPC; the table is deliberately sealed.
That documented route succeeded using the existing public configuration, with
no credential, permission or external-record changes. The exporter loads that
data layer and allows only this read RPC; it cannot call mutation RPCs.

The scoped read returned 277 Development-or-higher rows. The HSC/PLC whitelist
keeps 62 source-eligible candidates: 9 official HSC, 46 school/trial, 7 PLC.
The other 215 are AU/AMC (3), CAIE (14), DQ (27), LBNZ (56), MB (106), SM (9).
Four locally assessed, distinct routine archetypes form the proposed polynomial
pilot shortlist; the remaining 58 source-eligible candidates are held. This is
an external candidate export, not a live booklet edit or bank import.

| Actual source | Proposed printed label | Pilot decision |
| --- | --- | --- |
| `HSC.X1.2007 Q2c` | HSC Extension 1 2007 | Official X1 alias |
| `HSC.BHHS.Y11.X1.2022 Q13b` | BHHS Y11 2022 | Confirm school display name; preserve Y11 |
| `HSC.BHHS.Y12.X1.2022 Q10` | BHHS Y12 2022 | Confirm school display name |
| `PLC.Y11.X1.2023.T2 S1Qb` | PLC Y11 X1 T2 2023 | Confirm course/term abbreviation style |
| Existing “HSC Extension 1 Sample Question” | HSC Extension 1 Sample Question | Preserve no-year attribution |

The blanket trial-Y12 label proposed initially would mislabel real Y11 papers;
it must not be applied. `X1`/`X2` are recognized as official Extension 1/2 aliases.

| Pilot source | Unique routine archetype | Independently derived answer |
| --- | --- | --- |
| HSC.X1.2004 Q3b | Derive linear remainder from two values | b = −11; remainder 3x − 8 |
| HSC.X1.2007 Q2c | Two coefficients from root and remainder | a = −7, b = 10 |
| HSC.X1.2012 Q8 | Evaluate linear remainder at divisor root | 13 (D) |
| HSC.X1.2022 Q3 | Divisor degree from remainder degree | Degree could be 2 (D) |

Local full candidate data and assessed mapping remain under
`.booklet-work/end-goal-20261028/phase4/`. Label confirmation is approval for this
pilot only; every live insertion still needs source-format conversion and its
normal independent content/render checks. No live insertion has occurred.
