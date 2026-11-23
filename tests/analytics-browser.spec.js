import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 // No browser test sends analytics to production. The helper is tested separately.
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await page.addInitScript(()=>{
  window.analyticsEvents=[];
  window.trackOneMinute=(name,params)=>window.analyticsEvents.push({name,params});
 });
 await page.clock.install();
});
const events=page=>page.evaluate(()=>window.analyticsEvents);
const lifecycle=(type,id,names)=>names.map(name=>({name,params:{experience_type:type,content_id:id}}));

test('MUSEUM completion follows a valid result; cancellation and memory recall are not completion',async({page})=>{
 await page.goto('./');expect(await events(page)).toEqual([]);
 await page.locator('[data-exp="wait"]').click();await page.getByRole('button',{name:'実験をはじめる',exact:true}).click();
 await page.clock.runFor(600);await page.getByRole('button',{name:'実験を中断',exact:true}).click();
 expect(await events(page)).toEqual(lifecycle('museum','wait',['experience_start']));
 await page.locator('[data-exp="memory"]').click();await page.getByRole('button',{name:'実験をはじめる',exact:true}).click();
 await page.clock.runFor(1000);await page.locator('#stop-trial').click();
 expect((await events(page)).map(e=>e.name)).toEqual(['experience_start','experience_start']);
 await page.getByRole('button',{name:'記憶と時間の結果を見る'}).click();
 await expect(page.locator('.result-delta')).toBeVisible();
 expect(await events(page)).toEqual([...lifecycle('museum','wait',['experience_start']),...lifecycle('museum','memory',['experience_start','experience_complete'])]);
});

test('BREATH cancellation sends no completion and a repeating session completes once',async({page})=>{
 await page.goto('./breath.html');expect(await events(page)).toEqual([]);
 await page.locator('#start').click();await page.clock.fastForward(2000);await page.locator('#reset').click();
 expect(await events(page)).toEqual(lifecycle('breath','breath',['experience_start']));
 await page.locator('#repeat').check();await page.locator('#start').click();await page.clock.fastForward(60100);await page.clock.fastForward(60100);
 expect(await events(page)).toEqual(lifecycle('breath','breath',['experience_start','experience_start','experience_complete']));
 await page.locator('#reset').click();expect((await events(page)).length).toBe(3);
});

test('SENSORY button and ripple-tap resumes preserve progress without another start',async({page})=>{
 await page.goto('./sensory.html');expect(await events(page)).toEqual([]);
 await page.locator('#ripple').click();await page.locator('#stage').click();await page.clock.fastForward(30000);
 await page.locator('#start').click();await page.clock.fastForward(10000);await page.locator('#stage').click();await page.clock.fastForward(30200);
 await expect(page.locator('#status')).toHaveText('60 SEC COMPLETE');
 expect(await events(page)).toEqual(lifecycle('sensory','sensory_6',['experience_start','experience_complete']));
 await page.locator('#stage').click();await page.clock.fastForward(1000);await page.locator('#start').click();await page.clock.fastForward(10000);await page.locator('#start').click();await page.clock.fastForward(59200);
 expect(await events(page)).toEqual(lifecycle('sensory','sensory_6',['experience_start','experience_complete','experience_start','experience_complete']));
});

test('FREQUENCY events require a running audio clock and count one completion per repeating session',async({page})=>{
 await page.addInitScript(()=>{
  const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
  const node=()=>({gain:param(),frequency:param(),pan:param(),connect(){return this},disconnect(){},start(){},stop(){}});
  window.AudioContext=class{
   constructor(){this.state='suspended';this.currentTime=0;this.destination={};window.testAudio=this;}
   resume(){return Promise.resolve()}
   createGain(){return node()}createOscillator(){return node()}createStereoPanner(){return node()}
  };
 });
 await page.goto('./frequency.html');expect(await events(page)).toEqual([]);
 const track=page.locator('.track').first();await track.locator('.repeat').check();await track.locator('button').click();
 await page.evaluate(()=>{window.testAudio.currentTime=.1});await page.clock.fastForward(32);expect(await events(page)).toEqual([]);
 await page.evaluate(()=>{window.testAudio.state='running'});await page.clock.fastForward(32);
 expect(await events(page)).toEqual(lifecycle('frequency','frequency_0',['experience_start']));
 await page.evaluate(()=>{window.testAudio.state='suspended'});await page.clock.fastForward(61000);
 expect((await events(page)).length).toBe(1);
 await page.evaluate(()=>{window.testAudio.state='running';window.testAudio.currentTime=60.1});await page.clock.fastForward(32);
 await page.evaluate(()=>{window.testAudio.currentTime=120.1});await page.clock.fastForward(32);
 expect(await events(page)).toEqual(lifecycle('frequency','frequency_0',['experience_start','experience_complete']));
 await track.locator('button').click();expect((await events(page)).length).toBe(2);
});
