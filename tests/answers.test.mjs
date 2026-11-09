// Answers every one of the 848 questions in the real app, in both languages,
// and checks the app marks the official answer as correct and shows its text.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, newPage, openApp, LANGS } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await serve(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

for (const lang of LANGS) {
  test(`all 848 questions show the official answer as correct (${lang})`, async () => {
    const page = await newPage(browser);
    await openApp(page, srv.url, lang);
    const problems = await page.evaluate(() => {
      const bad = [];
      openNumber(1);
      for (let n = 1; n <= 848; n++) {
        if (browse.ids[browse.i] !== n) { bad.push([n, 'not opened']); break; }
        const q = BYN.get(n);
        choose(q.c);
        const verdict = document.querySelector('.verdict');
        if (!verdict || !verdict.classList.contains('ok')) bad.push([n, 'not marked correct']);
        const right = document.querySelector('.ans.right span:last-child');
        const expected = ax(q, q.c);
        if (expected && (!right || right.textContent !== expected)) bad.push([n, 'wrong text shown']);
        if (n < 848) go(1);
      }
      return bad;
    });
    assert.deepEqual(problems, []);
    assert.deepEqual(page.errors, []);
    await page.ctx.close();
  });
}

test('a wrong answer is marked wrong and the correct letter is named', async () => {
  const page = await newPage(browser);
  await openApp(page, srv.url, 'bg');
  const r = await page.evaluate(() => { openNumber(100); const q = BYN.get(100); const wrong = [0, 1, 2, 3].find(k => !good(q, k)); choose(wrong); return [document.querySelector('.verdict').className, document.querySelectorAll('.ans.right').length, document.querySelectorAll('.ans.wrong').length]; });
  assert.deepEqual(r, ['verdict no', 1, 1]);
  await page.ctx.close();
});
