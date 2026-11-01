# Initial review — two Continuous routine drafts

**Accepted:** yes, subject to the specified placement after the first two histogram investigations and after established power differentiation. No instructional change. Review model: gpt-6.1-terra, configured high by authoritative orchestration; self-attestation is unavailable and is not a manual hold.

Draft hash: `56beed78fe3a9e519c8d6f8eca029a558224537869be1e976195cf110f63cb47`  
Source: revision 8, SHA-256 `2d5eab0abf9d9c1d2a77983af876bcc3899c61ce28c8a93099fff7180a155d01`.

## Histogram and polygon

Task hash: `76c6d5779733abe81d63efa7ae6532b11eee66c5eb8870733c40b60ecaa2a189`  
**42 — Development.** The student constructs two linked representations from a table and calculates and compares their areas. The construction direction and prior investigations scaffold a routine sequence; the area comparison requires interpretation but no decisive unsignposted insight. All four dependent parts constitute one attempt.

Unit-wide bars centred at 2, 3, 4, 5 have heights 3, 6, 4, 2. Polygon vertices are (1,0), (2,3), (3,6), (4,4), (5,2), (6,0). Histogram area is 3+6+4+2=15. Polygon area by successive unit-width trapezia is (0+3)/2+(3+6)/2+(6+4)/2+(4+2)/2+(2+0)/2=15. Both equal total frequency 15. The worked triangle-transfer explanation is valid for equal-width adjacent bars including end triangles.

p6 Q2(a) gives the same student-visible construction direction and the first two independent investigations precede this proposed attempt. The supplied direction plus ordinary prior histogram and area knowledge support this placement. p7 Q3(g) and exercise solutions are style/context donors, not teaching demonstrations. No claim that an identical worked example was supplied.

Editable native 2×5 bordered table matches values. TikZ rectangles span [1.5,2.5], [2.5,3.5], [3.5,4.5], [4.5,5.5], with heights 3,6,4,2; plotted vertices and axes agree with the answers. Short and worked answers agree for all parts. One dependent chain, including part d, is one independent group. Native style and frequency-cumulative-graphs classification fit the supplied source context.

## CDF to PDF

Task hash: `d393562e101ae38d68015e69506f04df5da845f1fdd0a056f418c3cd47307c3c`  
**27 — Development.** A given piecewise CDF directs a familiar differentiation and asks for the density over all x. The student must carry the outside-support pieces through as well as differentiate a simple polynomial; this is a short routine linked procedure, with no parameter or inversion.

F(0)=0 and F(4)=(16+8)/24=1; its derivative on (0,4) is (2x+2)/24=(x+1)/12, nonnegative. Outside, the CDF is constant and density is 0. Integral from 0 to 4 of (x+1)/12 is [x²/24+x/12]₀⁴=1. Endpoint density values are arbitrary for the distribution; assigning the interior expression at both endpoints is a valid version despite derivative jumps there. Both answers correctly state that version.

p29 explicitly states the PDF is the CDF derivative wherever the PDF is continuous. Ordinary power differentiation and piecewise notation are prerequisite knowledge, as specified in the scoped task; the supplied evidence is not a worked example. p38 Q11(b) and p40 Q13(e) are exercise style donors, not teaching demonstrations. Place after the p29 property and established power differentiation.

Native question and piecewise mathematical notation are consistent; no diagram is required. Whole question is one independent group. probability-density-function primary classification directly reflects the requested result and p29 context.

## Author warnings and provenance

- No histogram/polygon worked example, guided practice or theory was supplied; confirm teaching elsewhere. No identical worked example is claimed. The p6 student-visible construction direction is retained and two existing investigations precede this attempt; with ordinary prior histogram and area knowledge, this placement is supported without new teaching.
- Part c uses donor triangle argument; no trapezium method introduced. Confirmed valid, including end triangles. Trapezia used independently to verify the answer, not introduced into the student content.
- One dataset, one dependent investigation; no relative-frequency or probability extension. Confirmed: parts a–d are one linked dataset investigation.
- Only p29 property supplied as teaching; confirm established power differentiation. p29 explicitly gives the method. Ordinary power differentiation is a stated prior prerequisite of this scoped review; no unsupported claim of a supplied worked example is made. Placement must follow established power differentiation.
- No parameter, inverse, CDF construction, improper integral, new differentiation rule or validation request. Confirmed against the student prompt.
- Introductory author prose preceded fenced JSON and tripped the original parser. Recovery record states the sole fenced JSON was parsed strictly, with exact envelope inverse and no content edits; author-outcome binds the canonical draft hash and task hashes. This was transport recovery, not an additional author call.

Both answers, principles, archetypes and scope pass; no findings. Scores assess only the two new attempts under the canonical 0–100 rubric. No original scores or guided bridge were reviewed. Source and generation provenance are recorded in `author-outcome.json` and the recovery files. Code-level diagram semantics reviewed without rendering, as requested. Source and author provenance are those of the bounded supplied records. Author recovery inverse is reported in the recovery record; this review does not claim an independent execution of that inverse.
