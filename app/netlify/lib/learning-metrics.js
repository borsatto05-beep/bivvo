/* Métricas educativas: somente identidade técnica, eventos e IDs de conteúdo. */
const EVENTS=new Set(['learning_goal_selected','learning_lesson_started','learning_concept_understood','learning_simulation_completed','learning_action_applied','learning_journey_completed','learning_review_completed']);
const identity=row=>row.user_id||row.visitor_id||null;
const ratio=(n,d)=>d?Math.round(n/d*1000)/10:null;
function learningMetrics(events=[]) {
 const rows=events.filter(row=>EVENTS.has(row.event)&&identity(row)&&/^(personal|couple|company):[a-z]+$/.test(row.content||''));
 const people=event=>new Set(rows.filter(row=>row.event===event).map(identity));
 const pairs=event=>new Set(rows.filter(row=>row.event===event).map(row=>identity(row)+'|'+row.content));
 const started=pairs('learning_lesson_started'),understood=pairs('learning_concept_understood'),applied=pairs('learning_action_applied');
 const match=(set,base)=>new Set([...set].filter(key=>base.has(key)));
 const learned=match(understood,started),acted=match(applied,learned);
 const byLesson=new Map();for(const key of started){const id=key.split('|').at(-1);if(!byLesson.has(id))byLesson.set(id,{id,started:0,understood:0,applied:0});const item=byLesson.get(id);item.started++;if(learned.has(key))item.understood++;if(acted.has(key))item.applied++;}
 const lessons=[...byLesson.values()].map(item=>({...item,application_rate:ratio(item.applied,item.started)}));
 const bottleneck=lessons.filter(item=>item.started>=5).sort((a,b)=>a.application_rate-b.application_rate)[0]||null;
 return {goals_selected:people('learning_goal_selected').size,learners:people('learning_lesson_started').size,people_applied:people('learning_action_applied').size,people_completed:people('learning_journey_completed').size,people_reviewed:people('learning_review_completed').size,missions_started:started.size,concepts_understood:learned.size,actions_applied:acted.size,understanding_rate:ratio(learned.size,started.size),application_rate:ratio(acted.size,started.size),lessons,bottleneck};
}
module.exports={learningMetrics};
