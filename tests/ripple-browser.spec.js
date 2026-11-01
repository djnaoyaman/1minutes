import {test, expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{
  window.audioStarts=0;
  const start=OscillatorNode.prototype.start;
  OscillatorNode.prototype.start=function(...args){window.audioStarts++;return start.apply(this,args)};
 });
});

async function idle(page){
 await expect(page.locator('#name')).toHaveText('HEARTBEAT');
 await expect(page.locator('#ripple')).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('#status')).toHaveText('READY');
 await expect(page.locator('#start')).toHaveText('START 60 SEC');
 await expect(page.locator('#bar')).toHaveCSS('width','0px');
 expect(await page.evaluate(()=>window.audioStarts)).toBe(0);
}

for(const reducedMotion of ['reduce','no-preference']){
 test(`RIPPLE fragment focuses without starting, including history (${reducedMotion})`,async({page},info)=>{
  await page.emulateMedia({reducedMotion});
  await page.goto('./sensory.html#ripple');
  await expect(page.locator('#ripple')).toBeFocused();
  await expect(page.locator('#ripple')).toBeInViewport();
  await idle(page);
  await page.reload();
  await expect(page.locator('#ripple')).toBeFocused();
  await idle(page);
  await page.evaluate(()=>{location.hash='other'});
  await page.locator('#save').focus();
  await page.evaluate(()=>{location.hash='ripple'});
  await expect(page.locator('#ripple')).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/#other$/);
  await page.goBack();
  await expect(page.locator('#ripple')).toBeFocused();
  await page.goForward();
  await page.goForward();
  await expect(page.locator('#ripple')).toBeFocused();
  await expect(page.locator('#ripple')).toBeInViewport();
  await idle(page);
  const link=page.getByRole('link',{name:'酸冷交代浴',exact:true});
  await expect(link).toHaveAttribute('href','https://djnaoyaman.github.io/sanreikotaiyoku/#about');
  await expect(link.locator('..')).toContainText('個人の感触を泡と波紋で表しています。');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:info.outputPath(`ripple-${reducedMotion}.png`),fullPage:true});
 });
}

test('fragment keeps selected experiment, parameter and elapsed progress',async({page})=>{
 await page.clock.install();
 await page.goto('./sensory.html');
 await page.locator('.chooser button').nth(3).click();
 await page.locator('#parameter').fill('18');
 await page.locator('#start').click();
 await page.clock.runFor(5000);
 const before=await page.locator('#bar').evaluate(e=>parseFloat(e.style.width));
 await page.evaluate(()=>{location.hash='ripple'});
 await expect(page.locator('#ripple')).toBeFocused();
 await expect(page.locator('#name')).toHaveText('MANDALA');
 await expect(page.locator('#parameter')).toHaveValue('18');
 await expect(page.locator('.chooser button').nth(3)).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#start')).toHaveText('STOP');
 await page.clock.runFor(2000);
 expect(await page.locator('#bar').evaluate(e=>parseFloat(e.style.width))).toBeGreaterThan(before);
 expect(await page.evaluate(()=>window.audioStarts)).toBe(0);
 await page.locator('#ripple').click();
 await expect(page.locator('#name')).toHaveText('RIPPLE');
 await expect(page.locator('#status')).toHaveText('READY');
 await page.locator('#start').click();
 await page.clock.runFor(1000);
 await expect(page.locator('#start')).toHaveText('STOP');
 await page.locator('#ripple').click();
 await page.locator('#stage').click();
 await page.clock.runFor(1000);
 await expect(page.locator('#start')).toHaveText('STOP');
 expect(await page.locator('#bar').evaluate(e=>parseFloat(e.style.width))).toBeGreaterThan(0);
 expect(await page.evaluate(()=>window.audioStarts)).toBe(0);
});
