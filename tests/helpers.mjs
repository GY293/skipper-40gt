// Shared test helpers: a tiny static web server for the site and browser setup.
// Tests run with Node's built-in test runner and the `playwright` library:
//   BROWSER=chromium node --test tests/   (or BROWSER=webkit)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENGINE = process.env.BROWSER || 'chromium';
export const IS_WEBKIT = ENGINE === 'webkit';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

/** Serve the repository like GitHub Pages does. Returns { url, close }. */
export async function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}/`, close: () => new Promise(r => server.close(r)) };
}

export async function launch() {
  return (IS_WEBKIT ? webkit : chromium).launch();
}

/** Phone and desktop sizes the app has to work on. */
export const DEVICES = [
  { name: 'iPhone SE (320)', viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true },
  { name: 'iPhone mini (375)', viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true },
  { name: 'iPhone 16 (393)', viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true },
  { name: 'Pro Max (430)', viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true },
  { name: 'Phone landscape', viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true },
  { name: 'Desktop', viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false },
];

/** New page with error collection. Service workers are blocked unless asked for. */
export async function newPage(browser, opts = {}) {
  const { device = DEVICES[2], colorScheme = 'light', serviceWorkers = 'block', lang } = opts;
  const ctxOpts = { viewport: device.viewport, hasTouch: device.hasTouch, colorScheme, serviceWorkers };
  if (!IS_WEBKIT || device.isMobile === false) ctxOpts.isMobile = device.isMobile;
  else ctxOpts.isMobile = true;
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', d => d.accept());
  page.errors = errors;
  page.ctx = context;
  if (lang) page.lang = lang;
  return page;
}

/** Open the app and wait until it has rendered. */
export async function openApp(page, url, lang) {
  await page.goto(url);
  await page.waitForSelector('.tabbar, .card', { timeout: 30000 });
  if (lang) await page.evaluate(l => setLang(l), lang);
}

/** Wider than the screen? */
export function overflows(page) {
  const vw = page.viewportSize().width;
  return page.evaluate(vw => {
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 || window.innerWidth > vw + 1) return 'page is wider than the screen';
    // fixed bars do not make the page scroll, so check every visible element's edges too
    for (const e of document.body.querySelectorAll('*')) {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height || e.closest('[hidden]') || e.closest('details:not([open]) > :not(summary)') || getComputedStyle(e).visibility === 'hidden') continue;
      if (r.right > vw + 1 || r.left < -1) return `${e.tagName.toLowerCase()}.${e.className || ''} sticks out (${Math.round(r.left)}–${Math.round(r.right)} of ${vw})`;
    }
    return false;
  }, vw);
}

/** Visible controls smaller than a comfortable finger tap (40 px). */
export function smallTargets(page) {
  return page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, input, select, summary, textarea, a.btn, label.extick, label.selall').forEach(e => {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height || e.closest('[hidden]') || e.closest('details:not([open]) > :not(summary)')) return;
      if (e.type === 'checkbox' && e.closest('label')) return;
      if (e.tagName === 'IMG' || e.closest('.plate')) return;
      if (r.height < 40 || r.width < 40) out.push(`${e.className || e.tagName}: "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    return [...new Set(out)];
  });
}

export const LANGS = ['bg', 'en'];
