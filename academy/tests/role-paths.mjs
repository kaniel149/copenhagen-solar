import vm from 'node:vm';
import assert from 'node:assert/strict';
import {read} from './_util.mjs';
const ctx={window:{}};vm.runInNewContext(read('academy/assets/curriculum-index.js'),ctx);
const tracks=JSON.parse(JSON.stringify(ctx.window.ACADEMY_CURRICULUM.tracks));
const code={module:{exports:{}}};vm.runInNewContext(read('academy/assets/role-paths.js'),code);
const {pathSequence,nextInPath,matches}=code.module.exports;
for(const role of tracks.filter(t=>t.id!=='foundation')){
 const path=pathSequence(tracks,role.id);
 assert.equal(path.length,17,role.id);assert.equal(new Set(path.map(x=>x.slug)).size,17);
 assert.equal(path[0].track,'foundation');assert.equal(path[7].num,8);assert.equal(path[8].track,role.id);assert.equal(path[16].num,9);
 assert.equal(nextInPath(path,()=>false).slug,'foundation-01');
 assert.equal(nextInPath(path,t=>t==='foundation').slug,role.id+'-01');
 assert.equal(nextInPath(path,(t,n)=>t==='foundation'||n<5).slug,role.id+'-05');
 assert.equal(nextInPath(path,()=>true).slug,'foundation-01');
}
assert.equal(pathSequence(tracks,'invalid').length,8);
const sample=tracks.find(t=>t.id==='finance').lessons[0];
for(const lang of ['en','he','th'])assert.equal(matches(sample,{query:sample.title[lang],track:'finance',status:'open'},()=>false),true);
assert.equal(matches(sample,{query:'',track:'sales',status:''},()=>false),false);
assert.equal(matches(sample,{query:'',track:'finance',status:'done'},()=>false),false);
assert.equal(matches(sample,{query:'unmatched-zzzz',track:'',status:''},()=>false),false);
console.log('role-paths: six paths share one foundation, follow prerequisites, retain independent role progress and support trilingual search');
