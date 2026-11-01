import {test,expect} from '@playwright/test';
const kinds=['wait','flow','anticipation','count','overload','stillness','memory','choice','repetition','novelty','rhythm','synchrony'];
const key='1minutes-results-v4';
async function select(page,kind){await page.locator(`[data-exp="${kind}"]`).click();await page.getByRole('button',{name:'実験をはじめる',exact:true}).click();}
async function finish(page,kind){await page.locator('#stop-trial').click();await expect(page.locator('#estimate')).toHaveCount(0);if(kind==='memory'){await page.locator('.recall-grid button').first().click();await page.getByRole('button',{name:'記憶と時間の結果を見る'}).click();}await expect(page.locator('.result-delta')).toBeVisible();}
for(const kind of kinds)test(`real beyond60 user-stop complete lifecycle: ${kind}`,async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');await expect(page.locator('[data-exp]')).toHaveCount(12);await select(page,kind);await page.waitForTimeout(550);
 const selector={flow:'.flow-node.lit',anticipation:'.door',overload:'.archive-grid button[aria-label="◎"]',choice:'[data-side="0"]',repetition:'.stamp-button',novelty:'.novel-button',rhythm:'.pulse-pad',synchrony:'.self-disc'}[kind];
 if(selector)await page.locator(selector).click();if(kind==='stillness')await page.locator('.light-field').hover();
 await expect(page.locator('#stage')).toBeVisible();await expect(page.locator('#mute')).toBeInViewport();await expect(page.locator('#stop-trial')).toBeInViewport();await page.screenshot({path:info.outputPath(`${kind}-running.png`)});
 await page.waitForTimeout(61000);await expect(page.locator('#stage')).toBeVisible();await expect(page.locator('#estimate')).toHaveCount(0);await finish(page,kind);
 const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(saved).toHaveLength(1);expect(saved[0].experiment).toBe(kind);expect(saved[0].actual).toBeGreaterThan(60);expect(saved[0].actual).toBeLessThan(85);expect(saved[0].version).toBe(4);expect(saved[0].method).toBe('production');expect(saved[0].felt).toBeUndefined();expect(saved[0].mark).toBeUndefined();
 await page.reload();await expect(page.locator('#history-list li')).toHaveCount(1);await expect(page.locator('.compare-row')).toHaveCount(12);expect(errors).toEqual([]);
});
test('all12 support early stop, signed difference and no question',async({page})=>{await page.clock.install();await page.goto('./');for(const kind of kinds){await select(page,kind);await page.clock.runFor(42000);await finish(page,kind);await expect(page.locator('.result-delta')).toContainText('−');}const rows=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(rows).toHaveLength(12);for(const row of rows){expect(row.actual).toBeGreaterThanOrEqual(42);expect(row.actual).toBeLessThan(44);}});
test('COUNT beyond60 has no redundant marker and all12 references render',async({page})=>{await page.clock.install();await page.goto('./');await expect(page.locator('#science-entries details')).toHaveCount(12);await expect(page.locator('#science-count')).toContainText('時間産出');await expect(page.locator('#science-entries a')).toHaveCount(15);await select(page,'count');await expect(page.locator('.mark-button')).toHaveCount(0);await page.clock.runFor(75000);await expect(page.locator('#stage')).toBeVisible();await finish(page,'count');await expect(page.locator('.result-delta')).toContainText('+');});
test('MEMORY early seen set and repeated cycle count unique words only',async({page})=>{await page.clock.install();await page.goto('./');await select(page,'memory');const first=await page.locator('.memory-word').textContent();await page.clock.runFor(1000);await page.locator('#stop-trial').click();await page.getByRole('button',{name:first,exact:true}).click();await page.getByRole('button',{name:'記憶と時間の結果を見る'}).click();await expect(page.locator('#panel')).toContainText('見た言葉1個のうち 1個');await select(page,'memory');await page.clock.runFor(120000);await expect(page.locator('#stage')).toBeVisible();await finish(page,'memory');await expect(page.locator('#panel')).toContainText('見た言葉8個のうち');});
test('cancel reload and repeated runs do not save partial sessions',async({page})=>{await page.clock.install();await page.goto('./');await select(page,'flow');await page.clock.runFor(500);await page.getByRole('button',{name:'実験を中断',exact:true}).click();await expect(page.locator('#panel')).toContainText('保存・比較に含めません');await page.locator('[data-exp="memory"]').click();await page.getByRole('button',{name:'実験をはじめる',exact:true}).click();await page.reload();await expect(page.locator('#panel')).toContainText('途中のリロード');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();await select(page,'flow');await page.clock.runFor(60040);await finish(page,'flow');await page.getByRole('button',{name:'もう一度体験する'}).click();await page.getByRole('button',{name:'実験をはじめる',exact:true}).click();await page.clock.runFor(60040);await finish(page,'flow');await expect(page.locator('#history-list li')).toHaveCount(2);});
test('visibility, navigation and large scheduling gap interrupt',async({page})=>{await page.clock.install();await page.goto('./');await select(page,'rhythm');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('#panel')).toContainText('画面を離れた');await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:false}));await select(page,'synchrony');await page.evaluate(()=>dispatchEvent(new PopStateEvent('popstate')));await expect(page.locator('#panel')).toContainText('画面を離れた');await select(page,'wait');await page.clock.fastForward(5000);await expect(page.locator('#panel')).toContainText('大きな遅延');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();});
test('stop double submission saves once and deletion needs confirmation',async({page})=>{await page.clock.install();await page.goto('./');await select(page,'choice');await page.clock.runFor(72000);await page.locator('#stop-trial').evaluate(b=>{b.click();b.click();});await expect(page.locator('#history-list li')).toHaveCount(1);await page.locator('#clear-history').click();await expect(page.locator('#history-list li')).toHaveCount(1);await page.locator('#clear-history').click();await expect(page.locator('#history-list li')).toHaveCount(0);});
test('blocked storage retains page memory and safe corruption',async({page})=>{await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}}));await page.clock.install();await page.goto('./');await select(page,'wait');await page.clock.runFor(60040);await finish(page,'wait');await expect(page.locator('#panel')).toContainText('ページを開いている間だけ');await expect(page.locator('#history-list li')).toHaveCount(1);});
test('legacy COUNT and fixed60 v3 stay outside production comparison',async({page})=>{await page.addInitScript(()=>localStorage.setItem('1minutes-results-v2',JSON.stringify([{experiment:'count',actual:81,felt:60,score:0,at:'2026-10-28T00:00:00Z'}])));await page.goto('./');await expect(page.locator('#history-list')).toContainText('旧方式');await expect(page.locator('.compare-row').nth(3)).toContainText('未体験');await page.evaluate(()=>localStorage.setItem('1minutes-results-v3',JSON.stringify([{version:3,experiment:'wait',actual:60.01,felt:72,score:0,at:'2026-10-28T00:00:00Z'}])));await page.reload();await expect(page.locator('#history-list li')).toHaveCount(1);await expect(page.locator('.compare-row').first()).toContainText('未体験');await select(page,'wait');await page.waitForTimeout(600);await finish(page,'wait');await page.reload();await expect(page.locator('#history-list li')).toHaveCount(2);await expect(page.locator('.compare-row').first()).toContainText('1回');});
test('sound is opt-in and mute controls reachable; reduced motion layout',async({page},info)=>{await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install();await page.goto('./');await expect(page.locator('#mute')).toHaveAttribute('aria-pressed','false');await select(page,'rhythm');await page.clock.runFor(1000);await expect(page.locator('#mute')).toBeInViewport();await page.locator('#mute').click();await expect(page.locator('#mute')).toHaveAttribute('aria-pressed','true');await page.locator('#mute').click();await expect(page.locator('#mute')).toHaveAttribute('aria-pressed','false');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:info.outputPath('reduced-motion.png')});});
test('all12 cards and reference typography narrow layout',async({page},info)=>{await page.setViewportSize({width:320,height:750});await page.goto('./');await expect(page.locator('#science-entries details')).toHaveCount(12);for(const kind of kinds){await page.locator(`[data-exp="${kind}"]`).click();await page.locator('.science-link').click();await expect(page.locator(`#science-${kind}`)).toHaveAttribute('open','');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}await page.locator('#science-synchrony summary').click();await page.screenshot({path:info.outputPath('exhibition-320.png'),fullPage:true});});

test('audio starts only after explicit opt-in and cleans every voice',async({page})=>{await page.addInitScript(()=>{window.audioAudit={created:0,started:0,active:0};class A{constructor(){window.audioAudit.created++;this.state='suspended';this.currentTime=0;this.destination={};}resume(){this.state='running';return Promise.resolve();}createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}createOscillator(){let active=false;return{frequency:{value:0},connect(){},disconnect(){},start(){active=true;window.audioAudit.started++;window.audioAudit.active++;},stop(at){if(at!==undefined)return;if(active){active=false;window.audioAudit.active--;}this.onended?.();}};}}window.AudioContext=A;});await page.clock.install();await page.goto('./');await select(page,'rhythm');await page.clock.runFor(2000);expect(await page.evaluate(()=>window.audioAudit.started)).toBe(0);await page.locator('#mute').click();await page.clock.runFor(1000);expect(await page.evaluate(()=>window.audioAudit.started)).toBeGreaterThan(0);expect(await page.evaluate(()=>window.audioAudit.active)).toBeGreaterThan(0);await page.locator('#mute').click();const starts=await page.evaluate(()=>window.audioAudit.started);await page.clock.runFor(2000);expect(await page.evaluate(()=>window.audioAudit.started)).toBe(starts);expect(await page.evaluate(()=>window.audioAudit.active)).toBe(0);await page.locator('#mute').click();await page.clock.runFor(1000);expect(await page.evaluate(()=>window.audioAudit.active)).toBeGreaterThan(0);await page.getByRole('button',{name:'実験を中断',exact:true}).click();expect(await page.evaluate(()=>window.audioAudit.active)).toBe(0);await select(page,'synchrony');await page.clock.runFor(2000);expect(await page.evaluate(()=>window.audioAudit.active)).toBeGreaterThan(0);await finish(page,'synchrony');expect(await page.evaluate(()=>window.audioAudit.active)).toBe(0);});
test('320px running stages fit and start-doubletap cannot stop prematurely',async({page},info)=>{await page.setViewportSize({width:320,height:750});await page.clock.install();await page.goto('./');for(const kind of kinds){await page.locator(`[data-exp="${kind}"]`).click();await page.getByRole('button',{name:'実験をはじめる',exact:true}).click();await page.locator('#stop-trial').dispatchEvent('click',{detail:1});await expect(page.locator('#stage')).toBeVisible();await page.clock.runFor(600);await expect(page.locator('#stop-trial')).toBeInViewport();const box=await page.locator('#stage').boundingBox();const stageOverflow=await page.locator('#stage').evaluate(e=>e.scrollWidth>e.clientWidth);expect(stageOverflow,kind).toBeFalsy();expect(box.width).toBeGreaterThan(200);await page.screenshot({path:info.outputPath(`${kind}-320-running.png`)});await page.getByRole('button',{name:'実験を中断',exact:true}).click();}});

for (const width of [320, 390, 768, 1280]) {
 test(`exhibition identity stays geometric and hero stays readable at ${width}px`, async ({page}, info) => {
  await page.setViewportSize({width, height: 900});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('./');
  await expect(page.locator('.brand img')).toBeVisible();
  await expect(page.locator('.brand')).toHaveAttribute('aria-label','1minutes ホーム');
  await expect.poll(() => page.locator('.brand img').evaluate(i => i.complete && i.naturalWidth > 0)).toBeTruthy();
  const brandBox = await page.locator('.brand').boundingBox();
  expect(brandBox.x).toBeGreaterThanOrEqual(0);
  expect(brandBox.x + brandBox.width).toBeLessThanOrEqual(width);
  await expect(page.locator('.card-icon svg')).toHaveCount(12);
  await expect(page.locator('.card .arrow svg')).toHaveCount(12);
  await expect(page.getByRole('heading', {name: '60秒は、長いか。', exact: true})).toBeVisible();
  await expect(page.locator('.hero-line')).toHaveText(['60秒は、', '長いか。']);
  const layout = await page.evaluate(() => {
   const lines = [...document.querySelectorAll('.hero-line')];
   return {
    fits: document.documentElement.scrollWidth <= innerWidth,
    rows: lines.map(el => {
     const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
     const range = document.createRange(); range.selectNodeContents(el);
     const text = range.getBoundingClientRect();
     return {top:r.top, bottom:r.bottom, left:text.left, right:text.right, width:r.width,
      scroll:el.scrollWidth, spacing:s.letterSpacing, nowrap:s.whiteSpace,
      lineRatio:parseFloat(s.lineHeight)/parseFloat(s.fontSize)};
    }),
    icons: [...document.querySelectorAll('.card-icon')].every(el => el.textContent.trim() === ''),
    svgHidden: [...document.querySelectorAll('.card-icon svg')].every(el => el.getAttribute('aria-hidden') === 'true' && el.getAttribute('focusable') === 'false')
   };
  });
  expect(layout.fits).toBeTruthy(); expect(layout.icons).toBeTruthy(); expect(layout.svgHidden).toBeTruthy();
  expect(layout.rows[1].top).toBeGreaterThanOrEqual(layout.rows[0].bottom - 1);
  for (const row of layout.rows) {
   expect(['normal', '0px']).toContain(row.spacing);
   expect(row.nowrap).toBe('nowrap'); expect(row.lineRatio).toBeGreaterThanOrEqual(1.2);
   expect(row.scroll).toBeLessThanOrEqual(Math.ceil(row.width) + 1);
   expect(row.left).toBeGreaterThanOrEqual(0); expect(row.right).toBeLessThanOrEqual(width);
  }
  await page.screenshot({path: info.outputPath(`hero-${width}.png`)});
  await page.locator('#experiments').scrollIntoViewIfNeeded();
  await page.screenshot({path: info.outputPath(`geometric-icons-${width}.png`)});
  await page.locator('[data-exp="novelty"]').click();
  await expect(page.locator('.science-link svg')).toHaveCount(1);
  await page.getByRole('button', {name:'実験をはじめる', exact:true}).click();
  await expect(page.locator('#stop-trial')).toBeVisible();
  // Respect the intentional 450ms start/double-tap guard before a real cancel.
  await page.waitForTimeout(550);
  await page.getByRole('button', {name:'実験を中断', exact:true}).click();
  await expect(page.getByRole('heading', {name:'時間が途切れました。'})).toBeVisible();
 });
}

for (const width of [320, 390, 768, 1280]) {
 test(`all exhibition logos preserve identical size and aspect ratio at ${width}px`, async ({page}) => {
  await page.setViewportSize({width, height:900});
  let reference;
  for (const path of ['./', './frequency.html', './breath.html', './sensory.html']) {
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(path);
   const logo=page.locator('header .brand img');
   await expect.poll(()=>logo.evaluate(i=>i.complete && i.naturalWidth>0)).toBeTruthy();
   const box=await logo.boundingBox();
   expect(box.width / box.height).toBeCloseTo(384 / 230, 2);
   if(reference){expect(box.width).toBe(reference.width);expect(box.height).toBe(reference.height);expect(box.x).toBe(reference.x);expect(box.y).toBe(reference.y);}else reference=box;
   expect(await logo.getAttribute('src')).toContain('./assets/brand-reverse.svg');
   const overflow=await page.locator('main').evaluate(root=>[root,...root.querySelectorAll('*')].filter(e=>{
    const r=e.getBoundingClientRect();return r.width>0 && (r.left < -1 || r.right>innerWidth+1);
   }).map(e=>e.tagName+'.'+e.className));
   expect(overflow,path).toEqual([]);
   if(path.includes('frequency'))await expect(page.locator('.track')).toHaveCount(6);
   if(path.includes('breath')){await page.locator('#start').click();await expect(page.locator('#phase')).not.toHaveText('READY');await page.locator('#reset').click();}
   if(path.includes('sensory')){await page.locator('.chooser button').nth(3).click();await expect(page.locator('#name')).toHaveText('MANDALA');await page.locator('#start').click();await expect(page.locator('#status')).not.toHaveText('READY');}
   expect(errors).toEqual([]);
  }
 });
}

test('heartbeat synthesis renders audible two-part pulses at selectable frequencies',async({page})=>{
 await page.goto('./sensory.html');
 const result=await page.evaluate(async()=>{
  const {scheduleHeartbeat}=await import('./heartbeat-audio.js?v=2');
  const renders=[];
  for(const hz of [40,80,160,240]){
   const context=new OfflineAudioContext(1,44100,44100);
   scheduleHeartbeat(context,context.destination,.02,hz);
   const audio=(await context.startRendering()).getChannelData(0);
   const rms=(from,to)=>Math.sqrt(audio.slice(from*44100,to*44100).reduce((s,v)=>s+v*v,0)/((to-from)*44100));
   let crossings=0;for(let i=2205;i<6174;i++)if(audio[i-1]<0 && audio[i]>=0)crossings++;
   renders.push({hz,first:rms(.02,.19),second:rms(.24,.38),silence:rms(.5,.9),peak:Math.max(...audio.map(Math.abs)),crossings});
  }
  return renders;
 });
 for(const r of result){expect(r.first).toBeGreaterThan(.15);expect(r.second).toBeGreaterThan(.1);expect(r.silence).toBe(0);expect(r.peak).toBeLessThanOrEqual(1);}
 expect(result[3].crossings).toBeGreaterThan(result[0].crossings*4);
});

test('heartbeat is opt-in on start and stops on pause, mode change, hide and completion',async({page})=>{
 await page.addInitScript(()=>{
  window.heartbeatAudit={started:0,stopped:0};
  const original=AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator=function(){const oscillator=original.call(this);const start=oscillator.start.bind(oscillator),stop=oscillator.stop.bind(oscillator);
   oscillator.start=(...args)=>{window.heartbeatAudit.started++;return start(...args)};
   oscillator.stop=(...args)=>{if(!args.length)window.heartbeatAudit.stopped++;return stop(...args)};
   return oscillator;
  };
 });
 await page.goto('./sensory.html');
 expect(await page.evaluate(()=>window.heartbeatAudit.started)).toBe(0);
 await page.locator('#start').click();
 await expect.poll(()=>page.evaluate(()=>window.heartbeatAudit.started)).toBeGreaterThan(0);
 await page.locator('#heartbeat-study').selectOption('0');
 await expect(page.locator('#heartbeat-frequency')).toContainText('432Hz');
 await page.locator('#heartbeat-volume').fill('50');await expect(page.locator('#heartbeat-volume-value')).toHaveText('50%');
 await page.locator('#start').click();
 expect(await page.evaluate(()=>window.heartbeatAudit.stopped)).toBeGreaterThan(0);
 const paused=await page.evaluate(()=>window.heartbeatAudit.started);await page.waitForTimeout(400);expect(await page.evaluate(()=>window.heartbeatAudit.started)).toBe(paused);
 await page.locator('#start').click();await page.locator('.chooser button').nth(3).click();
 const changed=await page.evaluate(()=>window.heartbeatAudit.started);await page.waitForTimeout(400);expect(await page.evaluate(()=>window.heartbeatAudit.started)).toBe(changed);
 await page.locator('.chooser button').first().click();await page.locator('#heartbeat-sound').uncheck();await page.locator('#start').click();
 await page.waitForTimeout(300);expect(await page.evaluate(()=>window.heartbeatAudit.started)).toBe(changed);
 await page.locator('#heartbeat-sound').check();await expect.poll(()=>page.evaluate(()=>window.heartbeatAudit.started)).toBeGreaterThan(changed);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.locator('#status')).toHaveText('PAUSED');
 const hidden=await page.evaluate(()=>window.heartbeatAudit.started);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.heartbeatAudit.started)).toBe(hidden);
 await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:false}));
 await page.clock.install();await page.locator('#start').click();await page.clock.fastForward(61000);await expect(page.locator('#status')).toHaveText('60 SEC COMPLETE');
 await page.locator('#start').click();await page.clock.runFor(100);await expect(page.locator('#start')).toHaveText('STOP');await page.locator('#start').click();
});

test('HEARTBEAT uses the same MUSIC and frequency definitions as FREQUENCY',async({page})=>{
 await page.goto('./sensory.html');
 await expect(page.locator('#heartbeat-study')).toHaveValue('5');
 await expect(page.locator('#heartbeat-frequency')).toContainText('528Hz');
 const profiles=await page.evaluate(async()=>{
  const {studies,studyTones}=await import('./sound-studies.js?v=1');
  const {scheduleHeartbeat}=await import('./heartbeat-audio.js?v=2');
  return studies.map(study=>{
   const ctx=new OfflineAudioContext(2,44100,44100),oscillators=[],panners=[];
   const create=ctx.createOscillator.bind(ctx),pan=ctx.createStereoPanner.bind(ctx);
   ctx.createOscillator=()=>{const o=create(),set=o.frequency.setValueAtTime.bind(o.frequency);o.frequency.setValueAtTime=(value,time)=>{oscillators.push(value);return set(value,time)};return o};
   ctx.createStereoPanner=()=>{const p=pan();panners.push(p);return p};
   scheduleHeartbeat(ctx,ctx.destination,0,studyTones(study));
   return {title:study.title,frequencies:oscillators.slice(0,oscillators.length/2),pan:panners.slice(0,panners.length/2).map(p=>p.pan.value)};
  });
 });
 expect(profiles.map(p=>p.frequencies)).toEqual([[432],[200,206],[180,182],[220,236],[55,110,82.41,164.82],[528,1056,1584,264]]);
 expect(profiles[1].pan).toEqual([-1,1]);
 for(let i=0;i<profiles.length;i++){
  await page.locator('#heartbeat-study').selectOption(String(i));
  await expect(page.locator('#heartbeat-music-link')).toHaveAttribute('href','./frequency.html#study-'+profiles[i].title.toLowerCase());
 }
 await page.locator('#heartbeat-music-link').click();
 await expect(page.locator('#study-music')).toBeInViewport();
 await expect(page.locator('#study-music')).toContainText('528 Hz');
});
