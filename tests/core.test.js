import test from 'node:test';import assert from 'node:assert/strict';import{SessionClock,EXPERIMENTS,validRecord,readRecords,saveRecords,compareRecords,nextTarget}from'../core.js';
function fake(kind){let n=0,w=0;const clock=new SessionClock(kind,()=>n,()=>w);return{clock,advance(ms,wall=ms){n+=ms;w+=wall;return clock.sample();}};}
for(const kind of EXPERIMENTS)test(`${kind} continues beyond60 and stops only on request`,()=>{const f=fake(kind);for(let i=0;i<750;i++)assert.equal(f.advance(100).status,'running');assert.deepEqual(f.clock.stop(),{status:'complete',elapsedMs:75000});assert.equal(f.advance(100).status,'complete');});
for(const kind of EXPERIMENTS)test(`${kind} permits early stop`,()=>{const f=fake(kind);f.advance(750);assert.deepEqual(f.clock.stop(),{status:'complete',elapsedMs:750});});
test('hidden invalidates',()=>assert.equal(fake('wait').clock.sample(true).reason,'hidden'));
test('stall invalidates',()=>assert.equal(fake('flow').advance(1501).reason,'timing'));
test('sleep clock discrepancy invalidates',()=>assert.equal(fake('rhythm').advance(100,5000).reason,'timing'));
test('delayed ending retains actual measurement',()=>{const f=fake('count');for(let i=0;i<599;i++)f.advance(100);assert.equal(f.advance(145).elapsedMs,60045);});
test('cancel terminal',()=>{const f=fake('wait');f.clock.cancel();assert.equal(f.advance(100).status,'cancelled');});
const record={version:4,method:'production',experiment:'wait',actual:72,score:0,at:'2026-10-28T00:00:00Z'};
test('production records validate measured duration and method',()=>{for(const actual of [.6,42,60,72,3601])assert.ok(validRecord({...record,actual}));for(const actual of[0,-1,NaN,Infinity])assert.ok(!validRecord({...record,actual}));assert.ok(!validRecord({...record,method:'estimate'}));});
test('storage corrupt/unavailable',()=>{assert.deepEqual(readRecords({getItem:()=>'{bad'}),[]);assert.equal(saveRecords({setItem(){throw Error();}},[]),false);});
test('legacy preserved but omitted from compare',()=>{const records=readRecords({getItem:key=>key.endsWith('v2')?JSON.stringify([{...record,version:undefined,experiment:'count',actual:72,felt:60}]):null});assert.equal(records.length,1);assert.equal(records[0].version,2);assert.equal(compareRecords(records).find(r=>r.experiment==='count').n,0);});
test('12means missing distinct fromzero',()=>{const rows=compareRecords([record,{...record,actual:48}]);assert.equal(rows.length,12);assert.equal(rows[0].mean,0);assert.equal(rows[1].mean,null);});
test('target changes',()=>{for(let i=0;i<8;i++)assert.notEqual(nextTarget(i),i);});

test('v3 subjective records migrate without joining production comparison',()=>{const r=readRecords({getItem:k=>k.endsWith('v3')?JSON.stringify([{version:3,experiment:'wait',actual:60.02,felt:72,score:0,at:record.at}]):null});assert.equal(r.length,1);assert.equal(compareRecords(r)[0].n,0);});
test('stop itself detects timing discontinuity',()=>{let t=0;const c=new SessionClock('wait',()=>t,()=>t);t=2000;assert.equal(c.stop().status,'interrupted');});
