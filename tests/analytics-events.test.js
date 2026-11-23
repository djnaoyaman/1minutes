import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../analytics-events.js',import.meta.url),'utf8');
function fixture(url='https://djnaoyaman.github.io/1minutes/?private=secret#answer') {
 const sent=[],window={gtag:(...args)=>sent.push(args)};
 const context=vm.createContext({window,location:new URL(url)});
 vm.runInContext(source,context);
 return {sent,window,context};
}
test('events start only on explicit calls and use a clean fixed destination',()=>{
 const f=fixture();assert.equal(f.sent.length,0);
 f.window.trackOneMinute('experience_complete',{experience_type:'museum',content_id:'memory',actual:42,score:9,answer:'private answer',query:'secret'});
 assert.deepEqual(JSON.parse(JSON.stringify(f.sent)),[['event','experience_complete',{send_to:'G-L3X8XHP35G',page_location:'https://djnaoyaman.github.io/1minutes/',page_referrer:'',experience_type:'museum',content_id:'memory'}]]);
 const first=f.window.trackOneMinute;vm.runInContext(source,f.context);assert.equal(f.window.trackOneMinute,first);assert.equal(f.sent.length,1);
});
test('previews, unrelated paths, opt-out and missing analytics send nothing',()=>{
 for(const url of ['http://127.0.0.1:4173/1minutes/','https://preview.example/1minutes/','https://djnaoyaman.github.io/other/']){
  const f=fixture(url);f.window.trackOneMinute('experience_start',{experience_type:'breath',content_id:'breath'});assert.deepEqual(f.sent,[]);
 }
 const f=fixture();f.window['ga-disable-G-L3X8XHP35G']=true;f.window.trackOneMinute('share',{method:'copy_link'});delete f.window['ga-disable-G-L3X8XHP35G'];delete f.window.gtag;assert.doesNotThrow(()=>f.window.trackOneMinute('share',{}));assert.deepEqual(f.sent,[]);
});
test('unknown events and unsafe values never reach gtag; telemetry errors stay isolated',()=>{
 const f=fixture();f.window.trackOneMinute('page_view',{});assert.deepEqual(f.sent,[]);
 f.window.trackOneMinute('share',{method:'copy_link',content_type:'exhibition',item_id:'index',content_id:'free text / private',experience_type:42});
 assert.deepEqual(Object.keys(f.sent[0][2]).sort(),['content_type','item_id','method','page_location','page_referrer','send_to'].sort());
 f.window.gtag=()=>{throw new Error('offline')};assert.doesNotThrow(()=>f.window.trackOneMinute('experience_start',{}));
});
