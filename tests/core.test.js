import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionClock, validEstimate, readRecords, saveRecords, nextTarget } from '../core.js';
function fake(kind) { let n=0,w=0; const clock=new SessionClock(kind,()=>n,()=>w); return {clock, advance(ms,wall=ms){n+=ms;w+=wall;return clock.sample();}}; }
for (const kind of ['wait','flow']) test(`${kind} ends at 60000 ms, never before`,()=>{ const f=fake(kind); for(let i=0;i<599;i++) assert.equal(f.advance(100).status,'running'); const last=f.advance(100);assert.equal(last.status,'complete');assert.equal(last.elapsedMs,60000); });
test('COUNT remains running past 60 seconds until user stop',()=>{ const f=fake('count');for(let i=0;i<725;i++) f.advance(100);const last=f.clock.stop();assert.equal(last.elapsedMs,72500);assert.equal(last.status,'complete');assert.deepEqual(f.clock.stop(),{status:'complete'}); });
test('COUNT can stop early',()=>{const f=fake('count');for(let i=0;i<451;i++)f.advance(100);assert.equal(f.clock.stop().elapsedMs,45100);});
test('COUNT five-minute limit does not create a result',()=>{const f=fake('count');for(let i=0;i<2999;i++)f.advance(100);assert.equal(f.advance(100).reason,'limit');});
test('hidden tab invalidates',()=>{const f=fake('wait');assert.equal(f.clock.sample(true).reason,'hidden');});
test('event-loop stall invalidates',()=>{const f=fake('flow');assert.equal(f.advance(1600).reason,'timing');});
test('sleep with stopped monotonic clock invalidates',()=>{const f=fake('wait');assert.equal(f.advance(100,5000).reason,'timing');});
test('late callback reports real elapsed rather than fabricating 60',()=>{const f=fake('wait');for(let i=0;i<599;i++)f.advance(100);assert.equal(f.advance(175).elapsedMs,60075);});
test('cancellation is terminal',()=>{const f=fake('count');f.clock.cancel();assert.equal(f.advance(200).status,'cancelled');});
test('estimate validation',()=>{for(const v of ['', ' ', '-1', '0', 'Infinity', 'NaN', '3601','text'])assert.equal(validEstimate(v),null);assert.equal(validEstimate('75.5'),75.5);assert.equal(validEstimate('0.1'),0.1);});
test('safe corrupted/unavailable storage',()=>{assert.deepEqual(readRecords({getItem:()=>'{bad'}),[]);assert.deepEqual(readRecords({getItem:()=>'{"x":1}'}),[]);assert.equal(saveRecords({setItem(){throw Error();}},[]),false);});
test('history rejects invalid records and keeps newest 100',()=>{const r={experiment:'wait',actual:60,felt:70,score:0,at:'2026-10-28T00:00:00Z'};const records=Array(103).fill(r).concat({...r,actual:-1});assert.equal(readRecords({getItem:()=>JSON.stringify(records)}).length,100);});
test('flow target always changes and remains 0–7',()=>{for(let i=0;i<8;i++)for(const r of [0,.5,.999999]){const n=nextTarget(i,()=>r);assert.notEqual(n,i);assert.ok(n>=0&&n<8);}});
