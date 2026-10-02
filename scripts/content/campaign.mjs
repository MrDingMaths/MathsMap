#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initCampaign, nextAssignment, activateWorkerLineagePolicy, activateExecutionOverride, prepareAssignment, recordPrerequisiteContextRead, stageAssignment, recordReview, recordReviewProfile, recordVisualReview, recordRefreshedVisualReview, publishAssignment, recoverCampaignPublication, requestRepair, releaseAssignment, statusCampaign, receiptCampaign, DEFAULT_CAMPAIGN } from './campaign-support.mjs';
import { measureCampaignUsage } from './campaign-measurement.mjs';
import { runCampaign } from './campaign-runner.mjs';
import { createSourcePreparer } from './campaign-source-dispatch.mjs';

const argv = process.argv.slice(2), command = argv.shift();
const value = (flag, fallback = null) => { const index = argv.indexOf(flag); return index < 0 ? fallback : argv[index + 1]; };
const root = path.resolve(value('--root', path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')));
const campaignId = value('--campaign', DEFAULT_CAMPAIGN);
const options = { campaignId, skillId: value('--skill'), workerId: value('--worker'), ids: value('--ids')?.split(',').filter(Boolean) || null, authorIds: value('--author-ids')?.split(',').filter(Boolean) ?? null, excludeIds: value('--exclude-ids')?.split(',').filter(Boolean) || [], role: value('--role') };
const input = () => JSON.parse(fs.readFileSync(path.resolve(value('--input')), 'utf8'));
try {
  let result;
  switch (command) {
    case 'init': {
      const initialized = initCampaign(root, { campaignId, ...(value('--input') ? input() : {}) });
      result = argv.includes('--full') ? initialized : { campaignId, createdAt: initialized.createdAt, membership: initialized.skillIds.length, excluded: initialized.excludedIds.length, initialCounts: initialized.initialCounts, membershipHash: initialized.membershipHash, manifestReconciliation: initialized.manifestReconciliation }; break;
    }
    case 'activate-execution-override': result = activateExecutionOverride(root, { ...input(), campaignId }); break;
    case 'activate-lineage': result = activateWorkerLineagePolicy(root, { campaignId }); break;
    case 'measure-usage': result = measureCampaignUsage(root, campaignId, {historicalExternalEvidencePath:value('--historical-external-evidence'),historicalExternalEvidenceHash:value('--historical-external-evidence-hash'),nativeProfileClarificationPath:value('--native-profile-clarification'),nativeProfileClarificationHash:value('--native-profile-clarification-hash')}); break;
    case 'next': result = nextAssignment(root, { ...options, ...(value('--native-actor') ? { workerLineage: { kind: 'native', actorId: value('--native-actor') } } : argv.includes('--external-ephemeral') ? { workerLineage: { kind: 'external-ephemeral' } } : {}) }); break;
    case 'prepare': result = prepareAssignment(root, { ...options, ...(value('--input') ? input() : {}) }); break;
    case 'record-prerequisite-read': result = recordPrerequisiteContextRead(root, { ...input(), ...options }); break;
    case 'stage': result = stageAssignment(root, { ...input(), ...options }); break;
    case 'record-review': result = recordReview(root, { ...input(), ...options }); break;
    case 'record-review-profile': result = recordReviewProfile(root, { ...input(), ...options }); break;
    case 'record-visual': result = recordVisualReview(root, { ...input(), ...options }); break;
    case 'refresh-visual': result = recordRefreshedVisualReview(root, { ...input(), ...options }); break;
    case 'publish': result = await publishAssignment(root, options); break;
    case 'recover': result = await recoverCampaignPublication(root, { ...options, force: argv.includes('--force') }); break;
    case 'release': result = releaseAssignment(root, { ...options, reason: value('--reason') }); break;
    case 'request-repair': result = requestRepair(root, { ...input(), ...options }); break;
    case 'status': result = statusCampaign(root, campaignId); break;
    case 'receipt': result = receiptCampaign(root, campaignId); break;
    case 'run': result = await runCampaign(root, { campaignId, ids: options.ids, authorIds: options.authorIds, excludeIds: options.excludeIds, oversizeExceptions: value('--oversize-exceptions') ? JSON.parse(fs.readFileSync(path.resolve(value('--oversize-exceptions')), 'utf8')) : {}, concurrency: Number(value('--concurrency', 3)), maxCalls: Number(value('--max-calls', 0)) || null, publish: argv.includes('--publish'), prepareSources: argv.includes('--select-sources') ? createSourcePreparer({ root, campaignId, budgetChars: Number(value('--source-budget', 10000)) }) : null }); break;
    default: throw new Error('Use init, next, prepare, record-prerequisite-read, stage, record-review, record-review-profile, record-visual, refresh-visual, publish, release, status, receipt, measure-usage, activate-lineage, activate-execution-override or run. Common flags: --campaign ID --root PATH --skill ID --worker ID --input FILE. next: --native-actor /root/actual_agent or --external-ephemeral. run: --ids id1,id2 [--author-ids ready1,ready2] [--exclude-ids blocked1] --concurrency 3 [--max-calls N] [--oversize-exceptions FILE] [--publish] [--select-sources] [--source-budget N].');
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
