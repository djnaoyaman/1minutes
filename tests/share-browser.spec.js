import {test,expect} from '@playwright/test';
const pages=[['index','1minutes','https://djnaoyaman.github.io/1minutes/'],['frequency','FREQUENCY','https://djnaoyaman.github.io/1minutes/frequency.html'],['breath','BREATH','https://djnaoyaman.github.io/1minutes/breath.html'],['sensory','SENSORY LAB','https://djnaoyaman.github.io/1minutes/sensory.html']];
async function setup(page,{share='success',copy='success'}={}){
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort());
 await page.addInitScript(({share,copy})=>{
  window.shareAudit={shares:[],copies:[],audio:0};window.shareMode=share;window.copyMode=copy;
  Object.defineProperty(navigator,'share',{configurable:true,value:share==='missing'?undefined:async data=>{shareAudit.shares.push(data);if(shareMode==='pending')await new Promise(r=>window.resolveShare=r);else if(shareMode==='abort')throw new DOMException('cancel','AbortError');else if(shareMode==='reject')throw new Error('unavailable');}});
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:copy==='missing'?undefined:{writeText:async value=>{shareAudit.copies.push(value);if(copyMode==='pending')await new Promise(r=>window.resolveCopy=r);else if(copyMode==='reject')throw new Error('unavailable');}}});
  window.AudioContext=class {constructor(){shareAudit.audio++;throw new Error('No audio expected from sharing');}};
  localStorage.setItem('share-test-private','private-history-do-not-send');
 },{share,copy});
}
for(const [key,label,url] of pages)test(`${key} shares only its public canonical URL, never query/hash/history`,async({page})=>{
 await setup(page);await page.goto(`./${key}.html?score=private&token=secret#private-history`);const panel=page.locator('.page-share');
 await expect(panel.getByRole('heading')).toHaveText(`${label}のページを共有`);
 const share=panel.getByRole('button',{name:'共有する',exact:true});await share.focus();await page.keyboard.press('Enter');await expect(panel.getByRole('status')).toHaveText('共有操作が完了しました。');await expect(share).toBeFocused();
 const copy=panel.getByRole('button',{name:'URLをコピー',exact:true});await copy.focus();await page.keyboard.press('Space');await expect(panel.getByRole('status')).toHaveText('URLをコピーしました。');await expect(copy).toBeFocused();
 const audit=await page.evaluate(()=>shareAudit);expect(audit.shares).toEqual([{title:await page.title(),url}]);expect(audit.copies).toEqual([url]);expect(audit.audio).toBe(0);expect(await page.evaluate(()=>localStorage.getItem('share-test-private'))).toBe('private-history-do-not-send');
});
test('native busy double click and copy overlap are ignored, then retry works',async({page})=>{
 await setup(page,{share:'pending'});await page.goto('./');const share=page.locator('[data-share-native]'),copy=page.locator('[data-share-copy]');
 await share.evaluate(el=>{el.click();el.click();});await copy.click();await expect(share).toHaveAttribute('aria-disabled','true');expect(await page.evaluate(()=>[shareAudit.shares.length,shareAudit.copies.length])).toEqual([1,0]);
 await page.evaluate(()=>resolveShare());await expect(share).toHaveAttribute('aria-disabled','false');await copy.click();await expect(page.locator('[data-share-status]')).toHaveText('URLをコピーしました。');expect(await page.evaluate(()=>shareAudit.copies.length)).toBe(1);
});
test('clipboard busy repeat and later completion reset correctly',async({page})=>{
 await setup(page,{copy:'pending'});await page.goto('./breath.html');const copy=page.locator('[data-share-copy]');await copy.evaluate(el=>{el.click();el.click();});await page.locator('[data-share-native]').click();expect(await page.evaluate(()=>[shareAudit.copies.length,shareAudit.shares.length])).toEqual([1,0]);await page.evaluate(()=>resolveCopy());await expect(copy).toHaveAttribute('aria-disabled','false');await expect(page.locator('[data-share-status]')).toHaveText('URLをコピーしました。');
});
test('native cancel resets without reporting success or invoking clipboard',async({page})=>{
 await setup(page,{share:'abort'});await page.goto('./');await page.locator('[data-share-native]').click();await expect(page.locator('[data-share-status]')).toHaveText('共有をキャンセルしました。');expect(await page.evaluate(()=>shareAudit.copies)).toEqual([]);await expect(page.locator('[data-share-manual]')).not.toHaveAttribute('open','');await page.evaluate(()=>window.shareMode='success');await page.locator('[data-share-native]').click();await expect(page.locator('[data-share-status]')).toHaveText('共有操作が完了しました。');
});
for(const kind of ['share','copy'])for(const mode of ['missing','reject'])test(`${kind} ${mode} focuses selectable manual URL and clears on retry`,async({page})=>{
 await setup(page,{[kind]:mode});await page.goto('./sensory.html?private=abc#ripple');await page.locator(kind==='share'?'[data-share-native]':'[data-share-copy]').click();await expect(page.locator('[data-share-manual]')).toHaveAttribute('open','');const input=page.locator('[data-share-url]');await expect(input).toBeFocused();await expect(input).toHaveValue(pages[3][2]);expect(await input.evaluate(el=>[el.selectionStart,el.selectionEnd])).toEqual([0,pages[3][2].length]);await expect(page.locator('[data-share-status]')).not.toContainText('コピーしました');await expect(page.locator('[data-share-actions]')).toHaveAttribute('aria-busy','false');
});
test('pagehide clears pending UI and ignores late completion',async({page})=>{
 await setup(page,{share:'pending'});await page.goto('./');await page.locator('[data-share-native]').click();await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide')));await expect(page.locator('[data-share-actions]')).toHaveAttribute('aria-busy','false');await page.locator('[data-share-copy]').click();await page.evaluate(()=>resolveShare());await expect(page.locator('[data-share-status]')).toHaveText('URLをコピーしました。');
});
test('copying during a running experiment preserves timing and history flow',async({page})=>{
 await setup(page);await page.clock.install();await page.goto('./');await page.locator('[data-exp="wait"]').click();await page.getByRole('button',{name:'実験をはじめる',exact:true}).click();await page.clock.runFor(1200);await page.locator('[data-share-copy]').click();await expect(page.locator('#stage')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('1minutes-results-v4'))).toBeNull();await page.clock.runFor(42000);await page.locator('#stop-trial').click();await expect(page.locator('.result-delta')).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('1minutes-results-v4')).length)).toBe(1);expect(await page.evaluate(()=>shareAudit.audio)).toBe(0);
});
for(const width of [320,390,768,1280])test(`sharing is readable, keyboard usable and below artwork at ${width}px`,async({page},info)=>{
 await setup(page,{copy:'reject'});await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 for(const [key] of pages){await page.goto(`./${key}.html`);await expect(page.locator('.brand img')).toBeVisible();await page.screenshot({path:info.outputPath(`${key}-${width}-top.png`)});await page.locator('[data-share-copy]').click();await expect(page.locator('[data-share-url]')).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();for(const selector of ['[data-share-copy]','[data-share-native]','[data-share-url]']){const box=await page.locator(selector).boundingBox();expect(box.width).toBeGreaterThan(44);expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);}await page.locator('.page-share').screenshot({path:info.outputPath(`${key}-${width}-manual.png`)});}
});
test('no-JavaScript manual URL remains usable on all four pages',async({browser},info)=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});const page=await context.newPage();await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort());
 for(const [key,,url] of pages){await page.goto(`http://127.0.0.1:4173/${key}.html?private=abc`);await expect(page.locator('[data-share-copy]')).toBeDisabled();await page.locator('[data-share-manual] summary').click();await expect(page.locator('[data-share-url]')).toHaveValue(url);await page.locator('.page-share').screenshot({path:info.outputPath(`${key}-nojs.png`)});}await context.close();
});
