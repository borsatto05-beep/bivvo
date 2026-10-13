const assert=require('node:assert/strict');const {learningMetrics}=require('../netlify/lib/learning-metrics.js');
const event=(user,name,content='personal:foundation')=>({user_id:user,event:name,content});
const rows=[];for(let i=0;i<5;i++){rows.push(event('u'+i,'learning_lesson_started'));rows.push(event('u'+i,'learning_lesson_started'));rows.push(event('u'+i,'learning_concept_understood'));if(i<2)rows.push(event('u'+i,'learning_action_applied'));}
rows.push(event('old','learning_action_applied'));rows.push(event('bad','learning_action_applied','personal:R$1200'));rows.push(event('old','page_view'));
const m=learningMetrics(rows);assert.equal(m.learners,5);assert.equal(m.missions_started,5);assert.equal(m.concepts_understood,5);assert.equal(m.actions_applied,2);assert.equal(m.application_rate,40);assert.equal(m.bottleneck.id,'personal:foundation');
assert.equal(learningMetrics([]).application_rate,null);
assert.equal(learningMetrics([event('u','learning_action_applied')]).actions_applied,0,'only started cohort reaches funnel denominator');
console.log('Learning metrics deduplicate users and missions, exclude financial content and compare the same mission cohort.');
