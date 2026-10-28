import test from 'node:test';import assert from 'node:assert/strict';import{SessionClock,EXPERIMENTS,validEstimate,validRecord,readRecords,saveRecords,compareRecords,nextTarget}from'../core.js';
function fake(kind){let n=0,w=0;const clock=new SessionClock(kind,()=>n,()=>w);return{clock,advance(ms,wall=ms){n+=ms;w+=wall;return clock.sample();}};}
for(const kind of EXPERIMENTS)test(`${kind} ends at60000,never before`,()=>{const f=fake(kind);for(let i=0;i<599;i++)assert.equal(f.advance(100).status,'running');assert.deepEqual(f.advance(100),{status:'complete',elapsedMs:60000});});
test('hidden invalidates',()=>assert.equal(fake('wait').clock.sample(true).reason,'hidden'));
test('stall invalidates',()=>assert.equal(fake('flow').advance(1501).reason,'timing'));
test('sleep clock discrepancy invalidates',()=>assert.equal(fake('rhythm').advance(100,5000).reason,'timing'));
test('delayed ending retains actual measurement',()=>{const f=fake('count');for(let i=0;i<599;i++)f.advance(100);assert.equal(f.advance(145).elapsedMs,60045);});
test('cancel terminal',()=>{const f=fake('wait');f.clock.cancel();assert.equal(f.advance(100).status,'cancelled');});
test('invalid estimates',()=>{for(const x of['',' ','0','-1','NaN','Infinity','3601','x'])assert.equal(validEstimate(x),null);assert.equal(validEstimate('72.6'),72.6);});
const record={version:3,experiment:'wait',felt:72,actual:60.02,score:0,at:'2026-10-28T00:00:00Z'};
test('fixed60 records must represent completed duration',()=>{assert.ok(validRecord(record));for(const actual of[1,59.99,61.5,300,NaN])assert.ok(!validRecord({...record,actual}));});
test('storage corrupt/unavailable',()=>{assert.deepEqual(readRecords({getItem:()=>'{bad'}),[]);assert.equal(saveRecords({setItem(){throw Error();}},[]),false);});
test('legacy preserved but omitted from compare',()=>{const records=readRecords({getItem:key=>key.endsWith('v2')?JSON.stringify([{...record,version:undefined,experiment:'count',actual:72}]):null});assert.equal(records.length,1);assert.equal(records[0].version,2);assert.equal(compareRecords(records).find(r=>r.experiment==='count').n,0);});
test('12means missing distinct fromzero',()=>{const rows=compareRecords([record,{...record,felt:48}]);assert.equal(rows.length,12);assert.equal(rows[0].mean,0);assert.equal(rows[1].mean,null);});
test('target changes',()=>{for(let i=0;i<8;i++)assert.notEqual(nextTarget(i),i);});
