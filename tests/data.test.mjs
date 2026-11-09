// Checks the files themselves, without a browser:
// the official answer key, the English translation, pictures, and that the
// website (index.html) and the single file (captain_40_GT.html) are in sync.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const site = read('index.html');
const single = read('captain_40_GT.html');
const KEY = JSON.parse(read('tests/answer-key.json'));

function blob(html, name, end) {
  const i = html.indexOf(`const ${name}=`);
  assert.ok(i >= 0, `${name} missing`);
  const s = i + name.length + 7;
  const j = html.indexOf(end, s);
  return JSON.parse(html.slice(s, j));
}
const parts = html => ({
  DATA: blob(html, 'DATA', ';const IMG='),
  IMG: blob(html, 'IMG', ';const IMGD='),
  IMGD: blob(html, 'IMGD', ';const EXPL='),
  EXPL: blob(html, 'EXPL', ';\n'),
  EN: blob(html, 'EN', ';\n</script>'),
  app: html.slice(html.indexOf("<script>\n'use strict';")),
  head: html.slice(0, html.indexOf('<script>const DATA=')),
});
const S = parts(site), F = parts(single);
const Q = S.DATA.q;

test('848 questions numbered 1–848, each with 4 answers and a valid correct index', () => {
  assert.equal(Q.length, 848);
  Q.forEach((q, i) => {
    assert.equal(q[0], i + 1);
    assert.equal(q[3].length, 4, `question ${q[0]}`);
    assert.ok(Number.isInteger(q[4]) && q[4] >= 0 && q[4] < 4, `question ${q[0]}`);
    assert.ok(q[1] >= 0 && q[1] < S.DATA.topics.length, `question ${q[0]} topic`);
  });
});

test('correct answers match the official answer key', () => {
  const wrong = Q.filter(q => KEY[q[0]][0] !== q[4] || KEY[q[0]][1] !== q[3][q[4]]).map(q => q[0]);
  assert.deepEqual(wrong, [], 'questions whose marked answer differs from the official key');
});

test('every question has an English translation with the same shape', () => {
  for (const q of Q) {
    const e = S.EN.q[q[0]];
    assert.ok(e && e[0].trim(), `question ${q[0]} English text`);
    assert.equal(e[1].length, 4, `question ${q[0]} English answers`);
    q[3].forEach((a, k) => assert.equal(a === '', e[1][k] === '', `question ${q[0]} answer ${k}: empty in one language only`));
    assert.ok(S.EXPL[q[0]], `question ${q[0]} Bulgarian explanation`);
    assert.ok(S.EN.expl[q[0]], `question ${q[0]} English explanation`);
  }
  assert.equal(S.EN.topics.length, S.DATA.topics.length);
  assert.equal(S.EN.groups.length, S.DATA.groups.length);
});

test('answers that are identical in Bulgarian are identical in English', () => {
  for (const q of Q) for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++)
    if (q[3][a] && q[3][a] === q[3][b]) assert.equal(S.EN.q[q[0]][1][a], S.EN.q[q[0]][1][b], `question ${q[0]}`);
});

test('every picture used by a question exists', () => {
  const used = new Set();
  for (const q of Q) { if (q[5]) used.add(q[5]); (q[6] || []).forEach(k => k && used.add(k)); }
  for (const k of used) {
    assert.ok(S.IMG[k], `website picture ${k}`);
    assert.ok(F.IMG[k], `single-file picture ${k}`);
    assert.ok(S.IMGD[k], `size of picture ${k}`);
    assert.ok(fs.existsSync(path.join(ROOT, S.IMG[k])), `file ${S.IMG[k]}`);
    assert.ok(F.IMG[k].startsWith('data:image/'), `single file embeds ${k}`);
  }
  assert.equal(Object.keys(S.IMG).length, 258);
});

test('website and single file are the same app', () => {
  assert.deepEqual(F.DATA, S.DATA, 'questions differ');
  assert.deepEqual(F.EN, S.EN, 'English differs');
  assert.deepEqual(F.EXPL, S.EXPL, 'explanations differ');
  assert.deepEqual(F.IMGD, S.IMGD, 'picture sizes differ');
  assert.equal(F.app, S.app, 'app code differs');
  assert.equal(F.head, S.head, 'page head and styles differ');
  assert.deepEqual(Object.keys(F.IMG).sort(), Object.keys(S.IMG).sort());
  for (const k of Object.keys(S.IMG)) {
    const b64 = F.IMG[k].split(',')[1];
    assert.ok(Buffer.from(b64, 'base64').equals(fs.readFileSync(path.join(ROOT, S.IMG[k]))), `picture ${k} differs`);
  }
});

test('offline cache lists every picture and the app files', () => {
  const sw = read('sw.js');
  const pics = JSON.parse(sw.match(/const PICS = (\[.*?\]);/s)[1]);
  const core = JSON.parse(sw.match(/const CORE = (\[.*?\]);/s)[1]);
  assert.deepEqual(pics.slice().sort(), Object.values(S.IMG).sort());
  for (const f of core) assert.ok(fs.existsSync(path.join(ROOT, f)), `cached file ${f} exists`);
  assert.ok(!core.includes('./'), 'app is cached only once');
});

test('manifest is valid and its icons exist', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.equal(m.display, 'standalone');
  assert.ok(m.icons.some(i => i.sizes === '512x512'));
  assert.ok(m.icons.some(i => i.purpose === 'maskable'));
  for (const i of m.icons) assert.ok(fs.existsSync(path.join(ROOT, i.src)), i.src);
});

test('page title is "Капитан 40 БТ"', () => {
  assert.match(site, /<title>Капитан 40 БТ<\/title>/);
});
