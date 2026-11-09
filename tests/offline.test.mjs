// The installable app: it can be installed, and after the first visit it
// opens and works without internet, pictures included. (Chromium only:
// these browser features cannot be checked the same way in WebKit tests.)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, newPage, IS_WEBKIT } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await serve(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

test('installable and works offline after the first visit', { skip: IS_WEBKIT && 'Chromium only' }, async () => {
  const page = await newPage(browser, { serviceWorkers: 'allow' });
  await page.goto(srv.url);
  await page.waitForSelector('.card');
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 20000 }).catch(async () => { await page.reload(); });
  await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
  // wait until all pictures are saved
  const savedPictures = () => page.evaluate(async () => { const k = await caches.keys(); if (!k.length) return 0; const c = await caches.open(k[0]); return (await c.keys()).filter(r => r.url.includes('/img/')).length; });
  for (let t = 0; t < 120 && (await savedPictures()) < 258; t++) await page.waitForTimeout(500);
  assert.equal(await savedPictures(), 258, 'all pictures saved for offline use');

  const cdp = await page.ctx.newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  assert.deepEqual(installabilityErrors, []);

  await page.ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('.card');
  await page.click('.card .btn.accent');
  assert.equal(await page.evaluate(() => store.session.ids.length), 60);
  for (const n of [538, 567, 820]) {
    await page.evaluate(n => openNumber(n), n);
    await page.waitForFunction(() => [...document.querySelectorAll('main img')].every(i => i.complete), null, { timeout: 5000 });
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('main img')].every(i => i.naturalWidth > 0)), `pictures of question ${n} offline`);
  }
  assert.deepEqual(page.errors.filter(e => !/Failed to load resource/.test(e)), []);
  await page.ctx.close();
});

test('loading screen shows before the app is ready', async () => {
  const page = await newPage(browser);
  await page.route('**/', async route => { const r = await route.fetch(); const body = await r.text(); await route.fulfill({ response: r, body: body.slice(0, body.indexOf('<script>const DATA=')) }); });
  await page.goto(srv.url);
  assert.equal(await page.locator('.boot').count(), 1);
  await page.ctx.close();
});
