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
  await start.click();await page.clock.fastForward(60100);
  await expect(page.locator('#phase')).toHaveText('COMPLETE');
  await page.locator('#repeat').check();await start.click();await page.clock.fastForward(60100);
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

test('previous/next buttons preserve selector, keyboard and boundary behavior',async({page})=>{
  const previous=page.locator('#methodPrevious'),next=page.locator('#methodNext');
  await expect(previous).toBeDisabled();await expect(page.locator('#methodPosition')).toHaveText('1 / 19');
  await next.focus();await page.keyboard.press('Enter');
  await expect(page.locator('#method')).toHaveValue('box');
  await expect(next).toBeFocused();await expect(page.locator('#methodTitle')).toHaveText('BOX BREATHING');
  await page.locator('#method').selectOption('tummo');await expect(next).toBeDisabled();
  await expect(page.locator('#methodPosition')).toHaveText('19 / 19');
  await previous.focus();await page.keyboard.press('Space');
  await expect(page.locator('#method')).toHaveValue('bhastrika');await expect(previous).toBeFocused();
});

test('gesture classification ignores taps, vertical/diagonal movement, cancel, multitouch and mouse',async({page})=>{
  // Synthetic events test cancellation rules; real touch routing is checked below via CDP.
  await page.locator('.method-explanation').evaluate(el=>{el.setPointerCapture=()=>{};});
  async function gesture(points,{type='touch',cancel=false,multi=false,slow=false}={}){
    await page.locator('.method-explanation').evaluate((el,{points,type,cancel,multi,slow})=>{
      const send=(name,point,extra={})=>{const event=new PointerEvent(name,{bubbles:true,pointerId:1,pointerType:type,isPrimary:true,clientX:point[0],clientY:point[1],...extra});Object.defineProperty(event,'timeStamp',{value:name==='pointerdown'?100:slow?1000:200});el.dispatchEvent(event);};
      send('pointerdown',points[0]);
      if(multi)send('pointerdown',points[0],{pointerId:2,isPrimary:false});
      for(const point of points.slice(1))send('pointermove',point);
      send(cancel?'pointercancel':'pointerup',points.at(-1));
    },{points,type,cancel,multi,slow});
  }
  for(const [points,options] of [
    [[[200,100],[190,101]],{}],
    [[[200,100],[195,150],[100,160]],{}],
    [[[200,100],[100,180]],{}],
    [[[200,100],[100,100]],{cancel:true}],
    [[[200,100],[100,100]],{multi:true}],
    [[[200,100],[100,100]],{type:'mouse'}],
    [[[200,100],[100,100]],{slow:true}]
  ]){await gesture(points,options);await expect(page.locator('#method')).toHaveValue('coherent');}
  await gesture([[200,100],[100,100]]);await expect(page.locator('#method')).toHaveValue('box');
  await expect(page.locator('#methodTitle')).toHaveText('BOX BREATHING');
});

for(const width of [320,390])test(`real touch swipes, scrolling and boundaries at ${width}px`,async({browser,browserName})=>{
  test.skip(browserName!=='chromium','Real touch injection uses Chromium CDP; WebKit classification is tested separately.');
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto(new URL('breath.html',test.info().project.use.baseURL||'http://127.0.0.1:4173').href);
  const cdp=await context.newCDPSession(page);
  async function drag(selector,dx,dy=0){
    await page.locator(selector).evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-180,behavior:'instant'}));
    const box=await page.locator(selector).boundingBox(),x=box.x+box.width/2-dx/2,y=box.y+Math.min(20,box.height/2);
    const scrollBefore=await page.evaluate(()=>scrollY);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let step=1;step<=6;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*step/6,y:y+dy*step/6}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    return scrollBefore;
  }
  const keys=await page.locator('#method option').evaluateAll(options=>options.map(x=>x.value));
  await drag('#description',100);await expect(page.locator('#method')).toHaveValue(keys[0]);
  for(const key of keys.slice(1)){
    await drag('#description',-100);await expect(page.locator('#method')).toHaveValue(key);
    expect(await page.locator('#selected-method-atlas p').allTextContents()).toEqual(await page.locator(`#breath-atlas [data-method="${key}"] p`).allTextContents());
  }
  await drag('#description',-100);await expect(page.locator('#method')).toHaveValue(keys.at(-1));
  await drag('#description',100);await expect(page.locator('#method')).toHaveValue(keys.at(-2));
  await page.locator('#method').selectOption('coherent');await page.locator('#start').click();
  await drag('#description',100);await expect(page.locator('#method')).toHaveValue('coherent');
  await expect(page.locator('#start')).toHaveText('STOP');
  const scrollBefore=await drag('#description',0,-120);await expect(page.locator('#method')).toHaveValue('coherent');
  await expect(page.locator('#start')).toHaveText('STOP');
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(scrollBefore+40);
  // Let native touch-scroll momentum settle before the next independent gesture.
  await page.waitForTimeout(500);
  await drag('#description',-100);await expect(page.locator('#method')).toHaveValue('box');
  await expect(page.locator('#start')).toHaveText('START');await expect(page.locator('#phase')).toHaveText('READY');
  await drag('#methodNext',-60);await expect(page.locator('#method')).toHaveValue('box');
  // Chromium suppresses taps briefly after a rapid synthetic gesture stream.
  await page.waitForTimeout(1000);
  async function tap(selector){
    await page.locator(selector).evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
    const box=await page.locator(selector).boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
    await page.waitForTimeout(50);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await tap('#start');await expect(page.locator('#start')).toHaveText('STOP');
  await tap('#reset');await expect(page.locator('#start')).toHaveText('START');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await context.close();
});
