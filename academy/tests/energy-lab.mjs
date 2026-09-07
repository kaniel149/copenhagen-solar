import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const {balance}=createRequire(import.meta.url)('../assets/energy-lab.js');
assert.deepEqual(balance(2,5,2),{solar:4,demand:10,direct:4,imported:6,curtailed:0});
assert.deepEqual(balance(5,2,2),{solar:10,demand:4,direct:4,imported:0,curtailed:6});
for(const pv of [0,.4,2,5,12.2])for(const load of [0,.2,3,5,9.4])for(const hours of [.5,1,4]){
 const b=balance(pv,load,hours);
 assert.ok(Math.abs(b.demand-b.direct-b.imported)<1e-9);
 assert.ok(Math.abs(b.solar-b.direct-b.curtailed)<1e-9);
 assert.ok(b.imported===0 || b.curtailed===0);
}
for(const args of [[NaN,1,1],[1,1,0],[-1,1,1],[1,1,25],[1001,1,1]])assert.equal(balance(...args),null);
console.log('energy lab: AC energy conservation, deficit/surplus cases and invalid inputs passed');
