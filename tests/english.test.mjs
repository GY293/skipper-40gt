// In English, no Bulgarian text may appear anywhere on screen, except the parts
// that are Bulgarian on purpose: the "БГ" language button, the quoted Bulgarian
// chart abbreviations (questions 823–837) and the Nи/Nм/Nк labels (705–714).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, newPage, openApp } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await serve(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const ALLOWED_Q = new Set([...Array(10)].map((_, i) => 705 + i).concat([...Array(15)].map((_, i) => 823 + i)));

function cyrillicOnScreen(page) {
  return page.evaluate(() => {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode, p = n.parentElement;
      if (['SCRIPT', 'STYLE'].includes(p.tagName) || p.closest('[lang=bg]') || p.closest('#zoom')) continue;
      if (/[А-Яа-яЁё]/.test(n.textContent)) out.push(n.textContent.trim());
    }
    document.querySelectorAll('[aria-label],[placeholder],[title],img[alt]').forEach(e => {
      if (e.closest('[lang=bg]')) return;
      for (const a of ['aria-label', 'placeholder', 'title', 'alt']) { const v = e.getAttribute(a); if (v && /[А-Яа-яЁё]/.test(v)) out.push(v); }
    });
    return out;
  });
}
const strip = s => s.replace(/БГ/g, '').replace(/Капитан 40 БТ/g, '');

test('every screen in English is free of Bulgarian text', async () => {
  const page = await newPage(browser);
  await openApp(page, srv.url, 'en');
  const found = {};
  const check = async name => { const c = (await cyrillicOnScreen(page)).filter(s => /[А-Яа-яЁё]/.test(strip(s))); if (c.length) found[name] = c.slice(0, 3); };
  for (const tab of ['home', 'practice', 'stats', 'find', 'more']) {
    await page.evaluate(t => { settingsOpen = true; notesOpen = true; goTab(t); }, tab);
    await page.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
    await check(tab);
  }
  for (const igTabName of ['pc', 'android', 'ios']) { await page.evaluate(v => { igTab = v; goTab('more'); }, igTabName); await check('install ' + igTabName); }
  await page.evaluate(() => { [5, 6].forEach(n => setEx(n, true)); exSel = new Set(); view = 'excluded'; render(); });
  await check('excluded');
  // questions that are Bulgarian on purpose are left out of this exam
  await page.evaluate(allowed => { store.excluded = {}; allowed.forEach(n => { store.excluded[n] = 1; }); startSession('exam', examPick(), { k: 'exam' }); showGrid = true; render(); }, [...ALLOWED_Q]);
  await check('exam');
  await page.evaluate(() => finish());
  await check('result');
  assert.deepEqual(found, {}, 'Bulgarian text in the English version');
  await page.ctx.close();
});

test('all 848 questions in English (text, answers, explanation) are free of Bulgarian, except the intended ones', async () => {
  const page = await newPage(browser);
  await openApp(page, srv.url, 'en');
  const bad = await page.evaluate(allowed => {
    const out = [];
    openNumber(1);
    for (let n = 1; n <= 848; n++) {
      choose(BYN.get(n).c);
      const txt = document.querySelector('main').innerText.replace(/БГ/g, '');
      if (/[А-Яа-яЁё]/.test(txt) && !allowed.includes(n)) out.push(n);
      if (n < 848) go(1);
    }
    return out;
  }, [...ALLOWED_Q]);
  assert.deepEqual(bad, []);
  await page.ctx.close();
});
