import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const mark='M12 45 52 13V125Q52 147 76 147H92';
test('approved continuous symbol and outlined lettering are used without remote fonts',()=>{
 for(const file of ['assets/brand-normal.svg','assets/brand-reverse.svg']){
  const svg=read(file);assert.ok(svg.includes(mark));assert.doesNotMatch(svg,/<text\b|font-family|https?:\/\/(?!www\.w3\.org)/);
  assert.ok((svg.match(/<path\b/g)||[]).length>=7);
 }
 const html=read('index.html');assert.match(html,/class="brand"[^>]*aria-label="1minutes ホーム"/);
 assert.match(html,/src="\.\/assets\/brand-reverse.svg"/);
 assert.doesNotMatch(html,/fonts\.googleapis|1minutes\.<\/a>/);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema.name,'1minutes — ONE MINUTE FOREVER');
 assert.equal(schema.image,'https://djnaoyaman.github.io/1minutes/assets/og.png');
});
test('share and install artwork use the approved mark and expected dimensions',()=>{
 for(const file of ['assets/favicon.svg','assets/safari-pinned-tab.svg','assets/og.svg']) assert.ok(read(file).includes(mark));
 for(const [file,w,h] of [['assets/og.png',1200,630],['assets/apple-touch-icon.png',180,180],['assets/icon-16.png',16,16],['assets/icon-32.png',32,32],['assets/icon-48.png',48,48]]){
  const b=readFileSync(new URL('../'+file,import.meta.url));assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);
 }
 assert.match(read('assets/brand-font-license.txt'),/SIL-OFL-1\.1/);
});
