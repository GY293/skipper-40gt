// Clicks through what a person actually does, in both languages:
// exam, results, history, smart review, flashcards, sections, stars, notes,
// search, excluded questions, settings, language/theme and the bottom menu.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, newPage, openApp, LANGS } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await serve(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const view = page => page.evaluate(() => view);
const tab = (page, i) => page.click(`.tabbar .tab >> nth=${i}`);

for (const lang of LANGS) {
  test(`exam: 60 questions split 15/20/15/5/5, result, history (${lang})`, async () => {
    const page = await newPage(browser);
    await openApp(page, srv.url, lang);
    await page.click('.card .btn.accent');
    assert.equal(await view(page), 'quiz');
    assert.equal(await page.locator('.tabbar').count(), 0, 'menu hidden during exam');
    const split = await page.evaluate(() => { const c = [0, 0, 0, 0, 0]; store.session.ids.forEach(n => c[EXAM_OF(BYN.get(n))]++); return c; });
    assert.deepEqual(split, [15, 20, 15, 5, 5]);
    await page.keyboard.press('1'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('2');
    assert.equal(await page.evaluate(() => Object.keys(store.session.ans).length), 2);
    await page.click('.tools .link >> nth=1'); // show all questions
    assert.equal(await page.locator('.grid .cell').count(), 60);
    await page.evaluate(() => finish());
    assert.equal(await view(page), 'result');
    assert.equal(await page.locator('.stamp').count(), 1);
    await page.click('.block .btn.quiet');
    assert.equal(await view(page), 'home');
    assert.equal(await page.evaluate(() => store.hist.length), 1);
    await page.reload(); await page.waitForSelector('.card');
    assert.equal(await page.evaluate(() => store.hist.length), 1, 'history kept after reload');
    assert.deepEqual(page.errors, []);
    await page.ctx.close();
  });

  test(`exam settings keep the topic percentages (${lang})`, async () => {
    const page = await newPage(browser);
    await openApp(page, srv.url, lang);
    assert.deepEqual(await page.evaluate(() => [30, 60, 120].map(n => examQuota(n))), [[8, 10, 8, 2, 2], [15, 20, 15, 5, 5], [30, 40, 30, 10, 10]]);
    // too many excluded in one topic: the others make up the difference
    const r = await page.evaluate(() => { Q.filter(q => EXAM_OF(q) === 3).slice(0, 48).forEach(q => setEx(q.n, true)); return examQuota(60); });
    assert.equal(r.reduce((a, b) => a + b, 0), 60);
    assert.equal(r[3], 3);
    await page.ctx.close();
  });

  test(`smart review and flashcards; a missed question comes back (${lang})`, async () => {
    const page = await newPage(browser);
    await openApp(page, srv.url, lang);
    await page.click('.cardhead .seg button >> nth=1'); // flashcards
    await page.click('.card .btn.accent2');
    assert.deepEqual(await page.evaluate(() => [store.session.cards, store.session.smart, store.session.ids.length]), [true, true, 25]);
    await page.click('#reveal');
    await page.click('.rate .btn.no');
    assert.equal(await page.evaluate(() => store.session.ids.length), 26, 'missed card queued again');
    await page.click('#reveal'); await page.click('.rate .btn.yes');
    assert.equal(await page.evaluate(() => store.session.i), 2);
    await page.click('.bar .link');
    assert.equal(await view(page), 'home');
    assert.equal(await page.locator('.resume').count(), 1, 'can continue later');
    await page.evaluate(() => finish());
    assert.equal(await page.evaluate(() => lastResult.ids.length), 2);
    assert.deepEqual(page.errors, []);
    await page.ctx.close();
  });

  test(`practice by section: whole-section toggle, stars, notes, auto-next (${lang})`, async () => {
    const page = await newPage(browser);
    await openApp(page, srv.url, lang);
    await tab(page, 1);
    assert.equal(await view(page), 'practice');
    await page.click('.gtoggle >> nth=1'); // whole Seamanship incl. stability questions
    assert.deepEqual(await page.evaluate(() => store.sel.slice().sort((a, b) => a - b)), [6, 7, 8, 9, 10]);
    await page.click('.gtoggle >> nth=1');
    assert.deepEqual(await page.evaluate(() => store.sel), []);
    await page.click('.chip >> nth=2');
    await page.click('.startbar .btn.primary');
    assert.equal(await page.evaluate(() => store.session.ids.length), await page.evaluate(() => Q.filter(q => q.t === 2).length));
    await page.evaluate(() => choose(QQ(store.session.ids[0]).c));
    await page.click('.starbtn');
    await page.click('.qnote .link');
    await page.fill('.qnote textarea', 'note 1');
    await page.locator('.qnote textarea').blur();
    const n0 = await page.evaluate(() => store.session.ids[0] % 10000);
    assert.equal(await page.evaluate(n => store.qnote[n], n0), 'note 1');
    assert.equal(await page.evaluate(n => store.star[n], n0), 1);
    await page.click('.bar .link');
    assert.equal(await view(page), 'practice', 'back returns to the practice tab');
    await page.evaluate(() => { store.session = null; store.sel = []; store.cfg.autoNext = true; render(); });
    await page.click('.opt .seg >> nth=2 >> button >> nth=3'); // starred only
    await page.click('.startbar .btn.primary');
    assert.equal(await page.evaluate(() => store.session.ids.length), 1);
    await page.evaluate(() => { store.session = null; store.filter = 'all'; render(); });
    await page.click('.startbar .btn.primary');
    await page.evaluate(() => choose(QQ(store.session.ids[0]).c));
    await page.waitForFunction(() => store.session.i === 1, null, { timeout: 4000 });
    assert.deepEqual(page.errors, []);
    await page.ctx.close();
  });

  test(`search, similar questions, excluded list (${lang})`, async () => {
    const page = await newPage(browser);
    await openApp(page, srv.url, lang);
    await tab(page, 3);
    await page.fill('.findinp', 'Racon');
    assert.ok(await page.locator('.findhit').count() >= 1);
    await page.fill('.findinp', '458');
    await page.press('.findinp', 'Enter');
    assert.equal(await page.evaluate(() => browse.ids[browse.i]), 458);
    await page.evaluate(() => choose(QQ(458).c));
    await page.click('.related .btn');
    assert.deepEqual(await page.evaluate(() => [458, 459, 460].map(isEx)), [true, true, true]);
    await page.click('.bar .link');
    assert.equal(await view(page), 'find', 'back returns to search');
    await page.click('.rowlink'); // excluded questions are on the search tab
    assert.equal(await view(page), 'excluded');
    assert.equal(await page.locator('.tabbar .tab[aria-current=page]').count(), 1);
    assert.equal(await page.locator('.exlist li').count(), 3);
    await page.click('.exlist li .btn >> nth=0');
    assert.equal(await page.evaluate(() => exCount()), 2);
    await page.click('.exfoot .btn');
    assert.equal(await page.evaluate(() => exCount()), 0);
    await page.click('.bar .link');
    assert.equal(await view(page), 'find');
    assert.deepEqual(page.errors, []);
    await page.ctx.close();
  });

  test(`settings, language and theme switch and are remembered (${lang})`, async () => {
    const page = await newPage(browser);
    await openApp(page, srv.url, lang);
    const other = lang === 'bg' ? 'en' : 'bg';
    await page.click('.topbar .langbtn');
    assert.equal(await page.evaluate(() => store.lang), other);
    assert.equal(await page.evaluate(() => document.documentElement.lang), other);
    await page.click('.topbar .langbtn');
    const dark = await page.evaluate(() => isDark());
    await page.click('.topbar .themebtn');
    assert.equal(await page.evaluate(() => isDark()), !dark);
    await tab(page, 4);
    await page.click('summary >> nth=0');
    await page.fill('.field input[type=number] >> nth=0', '30');
    await page.press('.field input[type=number] >> nth=0', 'Tab');
    await page.reload(); await page.waitForSelector('.card');
    assert.deepEqual(await page.evaluate(() => [store.lang, store.cfg.examN, isDark()]), [lang, 30, !dark]);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), dark ? 'light' : 'dark');
    assert.deepEqual(page.errors, []);
    await page.ctx.close();
  });
}

test('install guide opens and shows steps for computer, Android and iPhone', async () => {
  for (const lang of LANGS) {
    const page = await newPage(browser);
    await openApp(page, srv.url, lang);
    await page.evaluate(() => goTab('more'));
    assert.equal(await page.locator('.igdet[open]').count(), 0, 'closed by default');
    await page.click('.igdet > summary');
    const counts = [];
    for (let i = 0; i < 3; i++) { await page.click(`.igtabs button >> nth=${i}`); counts.push([await page.locator('.igsec').count(), await page.locator('.igtips li').count()]); }
    assert.deepEqual(counts, [[4, 6], [2, 3], [2, 3]]);
    assert.equal(await page.locator('.igdet[open]').count(), 1, 'stays open while switching tabs');
    await page.ctx.close();
  }
});

test('broken saved data never breaks the page', async () => {
  const page = await newPage(browser);
  for (const bad of ['not json', '{"stats":5,"cfg":null}', '{"session":{"mode":"exam","ids":[99999]}}', '[]', 'null', '{"hist":"x","mem":5,"star":[1]}']) {
    await page.goto(srv.url);
    await page.evaluate(v => localStorage.setItem('kapitan40.v1', v), bad);
    await page.reload();
    await page.waitForSelector('.card', { timeout: 10000 });
  }
  assert.deepEqual(page.errors, []);
  await page.ctx.close();
});

test('an exam whose time ran out is finished, not offered to continue', async () => {
  const page = await newPage(browser);
  await openApp(page, srv.url, 'bg');
  await page.click('.card .btn.accent');
  await page.evaluate(() => { store.session.deadline = Date.now() - 1000; save(); });
  await page.reload(); await page.waitForSelector('#app > *');
  assert.equal(await page.evaluate(() => [store.session, view]).then(r => r[0] === null), true);
  await page.ctx.close();
});

test('the single file works on its own, with pictures inside', async () => {
  const page = await newPage(browser);
  await page.goto(srv.url + 'captain_40_GT.html');
  await page.waitForSelector('.card');
  await page.evaluate(() => openNumber(538));
  assert.ok(await page.evaluate(() => document.querySelector('.plate img').src.startsWith('data:image/')));
  await page.waitForFunction(() => document.querySelector('.plate img').naturalWidth > 0);
  assert.deepEqual(page.errors, []);
  await page.ctx.close();
});

test('the website loads pictures as separate files only when needed', async () => {
  const page = await newPage(browser);
  const pics = [];
  page.on('request', r => { if (r.url().includes('/img/')) pics.push(r.url()); });
  await openApp(page, srv.url, 'bg');
  assert.equal(pics.length, 0, 'no pictures before a question needs one');
  await page.evaluate(() => openNumber(538));
  await page.waitForFunction(() => document.querySelector('.plate img').naturalWidth > 0);
  assert.equal(pics.length, 1);
  await page.ctx.close();
});
