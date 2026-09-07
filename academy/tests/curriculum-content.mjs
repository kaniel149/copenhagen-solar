import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { rel, read } from './_util.mjs';
const ids=['foundation','installers','service','sales','finance','leadership','design-permitting'];
const bundles=['foundation','technical','commercial','planning-management'].map(x=>JSON.parse(read(`academy/curriculum/${x}.json`)));
const tracks=bundles.flatMap(x=>x.tracks),sources=bundles.flatMap(x=>x.sources),map=new Map(sources.map(s=>[s.id,s]));
assert.equal(tracks.length,7);assert.deepEqual([...tracks.map(x=>x.id)].sort(),[...ids].sort());assert.equal(map.size,sources.length,'unique source IDs');
let lessons=0,quizzes=0,translations=0;
function translated(value,where){
 assert.equal(typeof value,'object',where);
 for(const lang of ['en','he','th']){assert.equal(typeof value[lang],'string',`${where}.${lang}`);assert.ok(value[lang].trim().length,`${where}.${lang} empty`);translations++;}
 assert.ok(!/[\u0e00-\u0e7f]/.test(value.he),`${where}: Thai leaked into Hebrew`);
 assert.ok(!/[\u0590-\u05ff]/.test(value.th),`${where}: Hebrew leaked into Thai`);
}
function ts(values,where,min=1){assert.ok(Array.isArray(values)&&values.length>=min,where);values.forEach((x,i)=>translated(x,`${where}.${i}`));}
function references(values,where){assert.ok(values?.length,`${where} has references`);values.forEach(id=>assert.ok(map.has(id),`${where}: missing ${id}`));}
for(const source of sources){assert.ok(/^https:\/\//.test(source.url),source.id);assert.equal(source.accessed,'2026-09-07');assert.ok(source.publisher&&source.published);translated(source.scope,source.id);}
for(const track of tracks){
 for(const key of ['title','audience','summary','outcome'])translated(track[key],`${track.id}.${key}`);
 assert.equal(track.lessons.length,track.id==='foundation'?8:9,track.id);
 for(const key of ['title','brief'])translated(track.capstone[key],`${track.id}.capstone.${key}`);
 ts(track.capstone.deliverables,`${track.id}.capstone.deliverables`,3);ts(track.capstone.rubric,`${track.id}.capstone.rubric`,3);
 assert.equal(typeof track.capstone.supervised,'boolean');
 track.lessons.forEach((l,i)=>{
  const slug=`${track.id}-${String(i+1).padStart(2,'0')}`;lessons++;
  assert.equal(l.num,i+1,slug);assert.ok(l.minutes>=15&&l.minutes<=120,slug);
  translated(l.title,slug+'.title');translated(l.summary,slug+'.summary');ts(l.objectives,slug+'.objectives',3);
  assert.ok(l.sections.length>=4,slug+' sections');
  l.sections.forEach((s,j)=>{translated(s.title,`${slug}.section${j}`);ts(s.paragraphs,`${slug}.paragraphs${j}`,2);references(s.sourceIds,`${slug}.sources${j}`);if(s.bullets)ts(s.bullets,`${slug}.bullets${j}`)});
  for(const key of ['title','scenario','result'])translated(l.workedExample[key],`${slug}.example.${key}`);ts(l.workedExample.steps,slug+'.steps',3);
  for(const key of ['title','brief','solution'])translated(l.exercise[key],`${slug}.exercise.${key}`);ts(l.exercise.deliverables,slug+'.exercise.outputs',2);ts(l.checklist,slug+'.checklist',3);references(l.sourceIds,slug);
  assert.equal(l.quiz.length,5,slug+' quiz length');
  const seen=new Set();l.quiz.forEach((q,k)=>{quizzes++;translated(q.question,`${slug}.q${k}`);translated(q.explanation,`${slug}.explanation${k}`);assert.equal(q.options.length,4);ts(q.options,`${slug}.options${k}`,4);assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);assert.ok(!seen.has(q.question.en),slug+' duplicate question');seen.add(q.question.en);});
  const html=read(`academy/learning/${slug}.html`);
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(!/\bsrc=/.test(match[1]))new vm.Script(match[2],{filename:slug});}
  assert.ok(html.includes(`data-course-id="${track.id}"`)&&html.includes(`data-lesson-num="${l.num}"`),slug+' identity');
  assert.ok(html.includes('data-notebook="'+slug+'"'),slug+' notebook');
  for(const id of l.sourceIds)assert.ok(html.includes(`id="source-${id}"`),slug+' source anchor');
 });
 assert.ok(fs.existsSync(rel(`academy/paths/${track.id}.html`)),track.id+' path');
}
assert.equal(lessons,62);assert.equal(quizzes,310);
const ctx={window:{}};vm.runInNewContext(read('academy/assets/curriculum-index.js'),ctx);
assert.equal(ctx.window.ACADEMY_CURRICULUM.tracks.flatMap(t=>t.lessons).length,lessons);
assert.ok(read('academy/index.html').includes('data-role-home'));
assert.ok(read('academy/library.html').includes('assets/lessons.js'));
console.log(`curriculum-content: ${lessons} lessons, ${quizzes} questions, ${sources.length} sources, ${translations} translated strings; schema/anchors/scripts passed`);
