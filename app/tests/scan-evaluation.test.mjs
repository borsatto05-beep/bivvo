import assert from 'node:assert/strict';
import {evaluateScan} from '../scripts/evaluate-scan.mjs';
const report=evaluateScan([{id:'a',value:20},{id:'b',value:30},{id:'c',value:40}], [{id:'a',value:20,durationMs:100,usage:{inputTokens:100,outputTokens:10}},{id:'b',value:99,reviewFields:['value'],durationMs:300,usage:{inputTokens:100,outputTokens:10}}]);
assert.equal(report.missing,1);assert.equal(report.amountAccuracy,1/3);assert.equal(report.wrongAmountsFlagged,1);assert.equal(report.estimatedCostUsd,null);
assert.equal(evaluateScan([{id:'a',value:1}],[{id:'a',value:1,usage:{inputTokens:1000000,outputTokens:1000000}}],{inputPrice:2,outputPrice:4}).estimatedCostUsd,6);
console.log('Evaluation: missing cases, accuracy, error review and known/unknown cost passed.');
