# Diagnostic Questions skill-mapping worker

Use the question's mathematical action, requested result, givens, representation, and distractor
misconceptions. GCSE/A-level category paths are weak retrieval hints, never stage mappings.
Compare the proposed skill with its prerequisites, same-topic siblings, and dependants. Do not
force a composite question into one atomic skill.

Return one mapper report:

```json
{
  "skillId": "existing-skill-id",
  "score": 0,
  "runnerUpSkillId": "other-skill-id",
  "runnerUpScore": 0,
  "atomic": true,
  "flags": [],
  "rationale": "tested action and boundary comparison"
}
```

Score the winner out of 100: core routine 40, requested output 25, givens/representation 15,
dot-point evidence 10, and prerequisite/sibling/dependant boundary fit 10. Use flags for any
stage notation, diagram, multi-skill, prerequisite, sibling, dependant, or confidence concern.
Two independent mapping workers must produce separate reports.
