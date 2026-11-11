// Why the audit v2 batch skips a booklet, or null to run it (pure, so it can be tested).
//   rows: the ledger rows; mode: 'audit' | 'retrofit' | 'top-up'; batch: the --batch name, if any.
// A count top-up (8 November 2026) and a retrofit (11 November 2026) run once per booklet, whatever the record says.
// A full audit is skipped when its audit record, or an applied ledger row, matches the live revision, and also
// (James, 11 November 2026) when a row of the same named batch already applied it, whatever its revision: a repair
// saved after the audit moved four Stage 6 revisions, and a re-run over the whole list audited them a second time.
export function skipReason({id,rows=[],mode='audit',batch,liveRevision,recordRevision}){
 const applied=rows.filter(r=>r.projectId===id&&r.status==='applied');
 if(mode==='retrofit')return applied.some(r=>r.retrofit)?'retrofit already applied':null;
 if(mode==='top-up')return applied.some(r=>r.topUp)?'count top-up already applied':null;
 if(recordRevision!=null&&recordRevision===liveRevision)return 'audit record already checked revision '+liveRevision;
 if(applied.some(r=>r.revision===liveRevision))return 'applied at revision '+liveRevision;
 if(batch&&applied.some(r=>r.batch===batch&&!r.retrofit&&!r.topUp))return 'applied earlier in batch '+batch;
 return null;
}
