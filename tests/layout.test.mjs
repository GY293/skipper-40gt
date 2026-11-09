// On every phone size (and desktop), in light and dark, in both languages:
// nothing sticks out sideways and every button is big enough to tap.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, newPage, openApp, overflows, smallTargets, DEVICES, LANGS } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await serve(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const SCREENS = [
  ['home', p => p.evaluate(() => goTab('home'))],
  ['home with topic split open', p => p.evaluate(() => { goTab('home'); document.querySelectorAll('details').forEach(d => { d.open = true; }); })],
  ['practice', p => p.evaluate(() => goTab('practice'))],
  ['progress', p => p.evaluate(() => { store.hist = [[Date.now() - 2e8, 60, 45, 85, 3e6], [Date.now(), 60, 53, 85, 3e6]]; goTab('stats'); })],
  ['search', async p => { await p.evaluate(() => goTab('find')); await p.fill('.findinp', 'ко'); }],
  ['more (all open)', p => p.evaluate(() => { settingsOpen = true; notesOpen = true; installOpen = true; goTab('more'); })],
  ['install guide: computer', p => p.evaluate(() => { igTab = 'pc'; installOpen = true; goTab('more'); })],
  ['install guide: Android', p => p.evaluate(() => { igTab = 'android'; installOpen = true; goTab('more'); })],
  ['install guide: iPhone', p => p.evaluate(() => { igTab = 'ios'; installOpen = true; goTab('more'); })],
  ['excluded list', p => p.evaluate(() => { Q.slice(0, 60).forEach(q => { store.excluded[q.n] = 1; }); exSel = new Set(); view = 'excluded'; render(); })],
  ['question with picture', p => p.evaluate(() => { store.excluded = {}; openNumber(820); choose(QQ(820).c); })],
  ['question with picture answers', p => p.evaluate(() => { openNumber(567); choose(QQ(567).c); })],
  ['exam with question list', p => p.evaluate(() => { startSession('exam', examPick(), { k: 'exam' }); showGrid = true; render(); })],
  ['flashcard', p => p.evaluate(() => { store.session = null; store.pmode = 'cards'; startSession('practice', [538, 539], { k: 'all' }); cardRev = store.session.i + ':' + store.session.ids[0]; render(); })],
  ['result', p => p.evaluate(() => { store.pmode = 'quiz'; startSession('exam', examPick(), { k: 'exam' }); finish(); })],
];

for (const device of DEVICES) {
  for (const lang of LANGS) {
    const scheme = device.viewport.width === 320 || device.name === 'Phone landscape' ? 'dark' : 'light';
    test(`${device.name}, ${lang}, ${scheme}: fits the screen, buttons tappable`, async () => {
      const page = await newPage(browser, { device, colorScheme: scheme });
      await openApp(page, srv.url, lang);
      const problems = [];
      for (const [name, go] of SCREENS) {
        await go(page);
        await page.waitForTimeout(50);
        { const o = await overflows(page); if (o) problems.push(`${name}: ${o}`); }
        if (device.hasTouch) { const s = await smallTargets(page); if (s.length) problems.push(`${name}: small buttons ${s.join(', ')}`); }
      }
      assert.deepEqual(problems, []);
      assert.deepEqual(page.errors, []);
      await page.ctx.close();
    });
  }
}

test('pictures keep their shape and never jump while loading', async () => {
  const page = await newPage(browser, { device: DEVICES[0] });
  await openApp(page, srv.url, 'bg');
  const bad = await page.evaluate(async () => {
    const out = [];
    for (const q of Q) {
      if (!q.img) continue;
      openNumber(q.n);
      const img = document.querySelector('.plate img');
      const before = document.querySelector('.plate').getBoundingClientRect();
      if (!img.complete) await new Promise(r => { img.onload = img.onerror = r; });
      const after = document.querySelector('.plate').getBoundingClientRect();
      if (Math.abs(before.width - after.width) > 1 || Math.abs(before.height - after.height) > 1) out.push(q.n + ' jumps');
      if (!img.naturalWidth) out.push(q.n + ' missing');
    }
    return out;
  });
  assert.deepEqual(bad, []);
  await page.ctx.close();
});

for (const lang of LANGS) {
  test(`every one of the 848 questions fits a 320 px screen (${lang})`, async () => {
    const page = await newPage(browser, { device: DEVICES[0] });
    await openApp(page, srv.url, lang);
    const bad = await page.evaluate(() => {
      const out = [];
      for (const q of Q) {
        openNumber(q.n);
        choose(q.c); // answered view: answers, explanation, similar questions, note
        if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) out.push(q.n);
      }
      return out;
    });
    assert.deepEqual(bad, [], 'questions wider than the screen');
    await page.ctx.close();
  });
}
