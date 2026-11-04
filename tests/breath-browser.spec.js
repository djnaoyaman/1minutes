import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto('./breath.html');
});

for(const width of [320,390,768,1280])test(`selected explanation stays next to the selector at ${width}px`,async({page},info)=>{
  await page.setViewportSize({width,height:900});
  const selector=page.locator('#method'), explanation=page.locator('.method-explanation');
  await selector.scrollIntoViewIfNeeded();
  await selector.focus();
  const keys=await selector.locator('option').evaluateAll(options=>options.map(option=>option.value));
  for(const key of [...keys,...keys.slice().reverse()]){
    const before=await page.evaluate(()=>scrollY);
    await selector.selectOption(key);
    await expect(selector).toBeFocused();
    expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThanOrEqual(1);
    const selected=await page.locator('#selected-method-atlas p').allTextContents();
    expect(selected).toEqual(await page.locator(`#breath-atlas [data-method="${key}"] p`).allTextContents());
    await expect(explanation.locator('h2')).toHaveText(await page.locator(`#breath-atlas [data-method="${key}"] h3`).textContent());
    const control=await selector.boundingBox(), text=await explanation.boundingBox();
    expect(text.y-control.y-control.height).toBeGreaterThanOrEqual(0);
    expect(text.y-control.y-control.height).toBeLessThan(24);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
  await page.screenshot({path:info.outputPath(`breath-${width}.png`)});
});

test('keyboard selection, timer controls, completion and learning-only methods',async({page})=>{
  await page.clock.install();
  const selector=page.locator('#method'), start=page.locator('#start');
  await selector.focus();
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  await expect(selector).toHaveValue('box');
  await expect(page.locator('#methodTitle')).toHaveText('BOX BREATHING');
  await expect(selector).toBeFocused();
  await start.focus();await page.keyboard.press('Enter');
  await expect(start).toHaveText('STOP');
  await page.clock.runFor(5000);await expect(page.locator('#phase')).toHaveText('止める');
  await page.locator('.notes').scrollIntoViewIfNeeded();
  await expect(start).toHaveText('STOP');
  await selector.selectOption('relax');await expect(start).toHaveText('START');
  await expect(page.locator('#phase')).toHaveText('READY');
  await start.click();await page.clock.runFor(1500);await start.click();
  await expect(page.locator('#phase')).toHaveText('READY');
  await start.click();await page.clock.runFor(1500);await page.locator('#reset').click();
  await expect(page.locator('#progress')).toHaveAttribute('style','width: 0%;');
  await start.click();await page.clock.runFor(60100);
  await expect(page.locator('#phase')).toHaveText('COMPLETE');
  await page.locator('#repeat').check();await start.click();await page.clock.runFor(60100);
  await expect(start).toHaveText('STOP');await page.locator('#reset').click();
  for(const key of ['wimhof','kapalabhati','bhastrika','tummo']){
    await selector.selectOption(key);await expect(start).toBeDisabled();
    await expect(page.locator('#description')).toContainText('学習モード');
  }
  await selector.selectOption('coherent');await expect(start).toBeEnabled();
  await page.locator('#music').check();await expect(page.locator('#genre')).toBeVisible();
  await page.locator('#music').uncheck();await expect(page.locator('#genre')).toBeHidden();
});

test('navigation back and repeated selection retain matching content',async({page})=>{
  await page.locator('#method').selectOption('zen');
  await page.locator('a[href="./"]').last().click();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  const key=await page.locator('#method').inputValue();
  expect(await page.locator('#selected-method-atlas p').allTextContents()).toEqual(await page.locator(`#breath-atlas [data-method="${key}"] p`).allTextContents());
  await page.locator('#method').selectOption('nadi');
  await expect(page.locator('#methodTitle')).toContainText('NADI SHODHANA');
});
