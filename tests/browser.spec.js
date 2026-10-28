import { test, expect } from '@playwright/test';
async function choose(page, kind) {
  await page.locator(`[data-exp="${kind}"]`).click();
  await page.getByRole('button', { name: '実験をはじめる', exact: true }).click();
}
async function virtual(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-10-28T00:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-10-28T00:00:01Z'));
}
test('layout and keyboard: original exhibition, no horizontal overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page).toHaveTitle('1minutes — ONE MINUTE FOREVER');
  await expect(page.locator('[data-exp]')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({width: 320, height: 740});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path: testInfo.outputPath('home-320.png'), fullPage: true});
  }
  await page.locator('[data-exp="count"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '実験をはじめる', exact: true })).toBeVisible();
});
for (const kind of ['wait', 'flow']) test(`${kind}: 60s, estimate validation, result, history, retry`, async ({ page }, testInfo) => {
  await virtual(page); await choose(page, kind);
  if (kind === 'wait') await page.screenshot({path: testInfo.outputPath('wait-running.png')});
  if (kind === 'flow') {
    await page.locator('.tile.active').click(); await expect(page.locator('#score')).toHaveText('1');
    await page.screenshot({ path: testInfo.outputPath('flow.png') });
  }
  await page.clock.runFor(59900);
  await expect(page.getByRole('button', { name: '実験を中断', exact: true })).toBeVisible();
  await page.clock.runFor(100);
  await expect(page.locator('#estimate')).toBeVisible();
  await page.getByRole('button', { name: '結果を見る', exact: true }).click();
  await expect(page.locator('#estimate-error')).not.toBeEmpty();
  await page.locator('#estimate').fill('-1');
  await page.getByRole('button', { name: '結果を見る', exact: true }).click();
  await expect(page.locator('#history-list li')).toHaveCount(0);
  await page.locator('#estimate').fill('75.5');
  await page.getByRole('button', { name: '結果を見る', exact: true }).click();
  await expect(page.locator('.result-delta')).toContainText('+15.5');
  await expect(page.locator('#history-list li')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath(`${kind}-result.png`), fullPage: true });
  await page.getByRole('button', { name: 'もう一度体験する', exact: true }).click();
  await page.getByRole('button', { name: '実験をはじめる', exact: true }).click();
  await page.clock.runFor(500);
  await page.getByRole('button', { name: '実験を中断', exact: true }).click();
  await expect(page.locator('#history-list li')).toHaveCount(1);
  await page.reload(); await expect(page.locator('#history-list li')).toHaveCount(1);
  await page.locator('#clear-history').click(); await page.locator('#clear-history').click();
  await expect(page.locator('#history-list li')).toHaveCount(0);
});
test('COUNT: may exceed 60s, stop only once, saved with actual/target', async ({ page }, testInfo) => {
  await virtual(page); await choose(page, 'count'); await page.clock.runFor(72500);
  await expect(page.locator('#stop-count')).toBeVisible();
  await page.screenshot({path: testInfo.outputPath('count-running.png')});
  await page.locator('#stop-count').click();
  await expect(page.locator('.result-delta')).toContainText('+12.5');
  await expect(page.locator('#history-list li')).toHaveCount(1);
  await expect(page.locator('#history-list')).toContainText('停止 72.5秒');
  await page.screenshot({path: testInfo.outputPath('count-result.png'), fullPage: true});
});
test('interrupted hidden page, long stall and maximum COUNT do not save', async ({ page }) => {
  await virtual(page); await choose(page, 'wait');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByRole('heading', { name: '時間が途切れました。' })).toBeVisible();
  await expect(page.locator('#history-list li')).toHaveCount(0);
  await page.evaluate(() => { delete document.hidden; });
  await choose(page, 'flow'); await page.clock.fastForward(10000);
  await expect(page.getByRole('heading', { name: '時間が途切れました。' })).toBeVisible();
  await choose(page, 'count'); await page.clock.runFor(300000);
  await expect(page.locator('#panel')).toContainText('5分の上限');
  await expect(page.locator('#history-list li')).toHaveCount(0);
});
test('aborts, navigation, reduced motion and corrupt storage remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('1minutes-results-v2', '{broken'));
  await page.reload(); await choose(page, 'wait');
  expect(await page.locator('.dot').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')));
  await expect(page.getByRole('heading', { name: '時間が途切れました。' })).toBeVisible();
  await page.getByRole('button', { name: 'もう一度', exact: true }).click();
  await page.getByRole('button', { name: '実験をはじめる', exact: true }).dblclick();
  await expect(page.getByRole('button', {name:'実験を中断',exact:true})).toBeVisible();
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: '実験を中断', exact: true }).click();
  await expect(page.getByRole('heading', {name:'時間が途切れました。'})).toBeVisible();
  await expect(page.locator('#history-list li')).toHaveCount(0);
});
for (const kind of ['wait', 'flow', 'count']) test(`real-clock ${kind}`, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Real-time run once per experiment; mobile uses controlled clock coverage.');
  await page.goto('/'); await choose(page, kind);
  if (kind === 'count') {
    await page.waitForTimeout(62000);
    await expect(page.locator('#stop-count')).toBeVisible();
    await page.locator('#stop-count').click();
  } else {
    await expect(page.locator('#estimate')).toBeVisible({ timeout: 65000 });
    await page.locator('#estimate').fill('60');
    await page.getByRole('button', { name: '結果を見る', exact: true }).click();
  }
  const actual = await page.evaluate(() => JSON.parse(localStorage.getItem('1minutes-results-v2'))[0].actual);
  expect(actual).toBeGreaterThanOrEqual(kind === 'count' ? 62 : 60);
  expect(actual).toBeLessThan(kind === 'count' ? 64 : 60.6);
  console.log(`REAL_CLOCK ${kind}: ${actual.toFixed(3)} seconds`);
});

test('unavailable browser storage still allows a valid session result', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } }));
  await virtual(page); await choose(page, 'count'); await page.clock.runFor(45000);
  await page.locator('#stop-count').click();
  await expect(page.locator('.result-delta')).toContainText('−15');
  await expect(page.locator('#panel')).toContainText('このページを開いている間だけ');
  await expect(page.locator('#history-list li')).toHaveCount(1);
});

test('canonical and social metadata point to public deployment; assets load', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://djnaoyaman.github.io/1minutes/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://djnaoyaman.github.io/1minutes/assets/og.png');
  expect((await request.get('/assets/og.png')).status()).toBe(200);
  expect((await request.get('/assets/favicon.svg')).status()).toBe(200);
});

test('two actual touch taps do not activate a replacement control', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Actual touch input requires the touch-enabled mobile context.');
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto('/');
  await page.locator('[data-exp="wait"]').tap();
  const start=page.getByRole('button',{name:'実験をはじめる',exact:true});
  await start.scrollIntoViewIfNeeded();
  const box=await start.boundingBox();
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  const abort=page.getByRole('button',{name:'実験を中断',exact:true});
  await expect(abort).toBeVisible();
  await page.waitForTimeout(450); await abort.tap();
  await expect(page.getByRole('heading',{name:'時間が途切れました。'})).toBeVisible();
  await expect(page.locator('#history-list li')).toHaveCount(0);
});
