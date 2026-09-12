# Quokkal

A gamified calorie tracker you install from the browser. Snap, describe, say or scan your food, Claude works out the numbers (using **your own** API key), and a small quokka gets happier every time you log.

No accounts, no subscription, no server. Everything lives on your device.

## What it does

- **Log five ways**: photo (Claude vision), describe in text, voice, barcode (Open Food Facts), or search the Australian Food Composition Database.
- **Honest estimates**: every item shows grams, kcal + kJ, macros and a confidence rating. Slide portions, edit lines, ask Claude a follow-up. Low-confidence guesses are flagged, not hidden.
- **Gamified**: XP, levels and titles; daily and weekly quests; 25 badges; streaks with a freeze item; a quokka that evolves from joey to legend and buys 11 outfits and 9 habitats with coins. It never shames you about food.
- **Body**: water, weight with a trend line, exercise (default _not_ eaten back), fasting timer.
- **Gets more accurate**: after two weeks of weigh-ins it compares expected versus actual change and suggests a bounded target correction.
- **Personas**: sassy, warm or drill sergeant. Change any time.
- **Offline**: the app shell and your data work offline. Drafts wait for the network.
- **Backups**: export/import a JSON file to move phones.

## Setup for you (or a mate)

1. Open the deployed URL in Safari (iPhone) or Chrome (Android).
2. Run through onboarding. Height, weight and activity feed the Mifflin-St Jeor equation.
3. Get a Claude API key:
   - Go to <https://console.anthropic.com>, create an account, add a small amount of credit.
   - **Settings → Limits**: set a monthly spend limit (a few dollars is plenty).
   - **API Keys → Create key**, name it "Quokkal", copy it into the app.
4. Add to Home Screen when prompted. Installed apps keep their data safer on iOS.

Costs: a photo is roughly 1 to 2 cents, a text description well under a cent. Defaults are Sonnet 5 for photos and Haiku 4.5 for text; change them in Settings.

**Key safety**: the key is stored in this browser only and sent only to `api.anthropic.com`. It is excluded from backups unless you opt in. If you lose the phone, revoke the key in the console.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # vitest
npm run build        # production build in dist/
npm run icons        # regenerate PNG icons from public/icons/favicon.svg
npm run afcd         # rebuild src/data/afcd.json from the FSANZ workbook in data-src/
```

Stack: React 19, TypeScript, Vite 7, Tailwind 4, Dexie (IndexedDB), Zustand, react-router 7, `@anthropic-ai/sdk` in the browser, `barcode-detector` (zxing-wasm), MiniSearch.

### Deploying to GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds with `VITE_BASE=/<repo>/`, and deploys to Pages. One-time setup: **Settings → Pages → Source: GitHub Actions**.

Updates: the service worker checks for a new build on launch and hourly. A banner offers "Update" and reloads without touching your data. Settings → About shows the running version.

### Data sources

- Food Standards Australia New Zealand, _Australian Food Composition Database, Release 3_ (CC BY 4.0). Converted at build time by `scripts/build-afcd.mjs`.
- Open Food Facts (ODbL) for barcodes and packaged foods.
- The local FODMAP screen follows food families and examples in Monash University's public guidance. It links to the official Monash FODMAP app for its proprietary laboratory-tested database and exact serving sizes; that database is not bundled or scraped.

### Project layout

```
src/lib/ai        Claude client, schemas, prompts, personas, image prep
src/lib/db        Dexie schema, types, repos
src/lib/game      engine.ts is the single write path for XP, coins, quests, streaks, mood
src/lib/nutrition TDEE, macros, totals, weight trend, recalibration
src/lib/food      AFCD search, Open Food Facts, barcode, portion presets
src/features      onboarding, log, diary, pet, game, body, stats, settings
tests             vitest unit tests for lib/*
```
