import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyPublic,MIN_REQUEST_GAP_MS} from '../scripts/wait-public.mjs';
const bytes=Buffer.from('exact asset');
const response=(status=200,value=bytes)=>({status,ok:status===200,arrayBuffer:async()=>value});
test('public deployment checks are sequential with a minimum 65-second start gap',async()=>{
 let clock=0,active=0,maxActive=0;const starts=[];
 await verifyPublic({files:['a','b','c'],read:async()=>bytes,now:()=>clock,sleep:async ms=>{clock+=ms;},log:()=>{},fetchFn:async()=>{starts.push(clock);active++;maxActive=Math.max(active,maxActive);clock+=120;active--;return response();}});
 assert.equal(maxActive,1);assert.equal(MIN_REQUEST_GAP_MS,65000);assert.deepEqual(starts,[0,65000,130000]);
});
test('explicit public access denial stops immediately without retry',async()=>{
 let requests=0;await assert.rejects(verifyPublic({files:['a','b'],read:async()=>bytes,now:()=>0,sleep:async()=>{},log:()=>{},fetchFn:async()=>{requests++;return response(403);}}),/denied/);assert.equal(requests,1);
});
test('deployment propagation mismatch retries only after the full request gap',async()=>{
 let clock=0;const starts=[];await verifyPublic({files:['a'],read:async()=>bytes,now:()=>clock,sleep:async ms=>{clock+=ms;},log:()=>{},fetchFn:async()=>{starts.push(clock);return starts.length===1?response(200,Buffer.from('old')):response();}});assert.deepEqual(starts,[0,65000]);
});
