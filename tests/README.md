# Tests

Every push to `main` runs these tests on GitHub (Actions tab), in Chromium and
in WebKit (the engine behind Safari on iPhone). The website is published only
when all of them pass.

| File | What it checks |
|---|---|
| `data.test.mjs` | Answer key matches the official file (`answer-key.json`), English translation complete, pictures present, website and single file identical, offline cache list, manifest, title |
| `answers.test.mjs` | All 848 questions mark the official answer as correct, in Bulgarian and English |
| `english.test.mjs` | No Bulgarian text in the English version, except the intended chart abbreviations |
| `flows.test.mjs` | Exam, results, history, smart review, flashcards, sections, stars, notes, search, excluded, settings, language, theme, saved data, single file |
| `layout.test.mjs` | Phone sizes from iPhone SE to Pro Max, landscape and desktop: nothing wider than the screen, buttons big enough to tap; every question fits a 320 px screen |
| `offline.test.mjs` | Installable, works offline with pictures, loading screen (Chromium) |

Run locally:

```
npm install
npx playwright install chromium webkit
npm test                # Chromium
npm run test:webkit     # WebKit
```
