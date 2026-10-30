import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
test('canonical and structured data describe user stopped twelve experiments',()=>{
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema.url,'https://djnaoyaman.github.io/1minutes/');
 assert.match(schema.description,/自分で止め/);
 assert.match(html,/rel="canonical" href="https:\/\/djnaoyaman.github.io\/1minutes\/"/);
 assert.doesNotMatch(html,/googletagmanager|google-analytics/);
});
test('manifest paths remain inside project and PNG dimensions match',()=>{
 const m=JSON.parse(read('site.webmanifest'));
 assert.equal(m.scope,'/1minutes/'); assert.equal(m.start_url,m.scope);
 for(const i of m.icons){
   assert.ok(existsSync(new URL('../'+i.src,import.meta.url)));
   const b=readFileSync(new URL('../'+i.src,import.meta.url));
   assert.equal(b.subarray(1,4).toString(),'PNG');
   assert.equal(`${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`,i.sizes);
 }
});
test('404 uses root anchored recovery and is excluded from sitemap',()=>{
 const f=read('404.html'); assert.match(f,/name="robots" content="noindex"/);
 assert.match(f,/href="\/1minutes\/"/);
 assert.doesNotMatch(f,/href="\.\//);
 assert.doesNotMatch(read('sitemap.xml'),/404/);
 assert.equal([...read('sitemap.xml').matchAll(/<loc>/g)].length,1);
});
test('LLM notes disclose measurement and storage limitations',()=>{
 const txt=read('llms-full.txt');
 for(const name of ['WAIT','FLOW','ANTICIPATION','COUNT','OVERLOAD','STILLNESS','MEMORY','CHOICE','REPETITION','NOVELTY','RHYTHM','SYNCHRONY']) assert.ok(txt.includes(name));
 assert.match(txt,/自動終了せず/);assert.match(txt,/240/);assert.match(txt,/診断|判定しません/);
});
