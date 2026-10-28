# 1minutes — ONE MINUTE FOREVER

A static, mobile-friendly interactive exhibition about subjective time.

## Exhibits
- WAIT — a silent 60-second interval followed by retrospective estimation.
- FLOW — a simple attention task over 60 seconds followed by estimation.
- COUNT — stop the clock when you believe 60 seconds have passed.

## Deployment
Create a **public** GitHub repository named `1minutes`, upload `index.html`, `app.js`, `core.js`, and `.nojekyll` to its main branch, then enable GitHub Pages in Settings → Pages → Deploy from a branch → main / root.

## Privacy
Results are stored locally in the browser via localStorage. No analytics or external services are loaded.

## Limitations
This is an artistic demonstration, not a validated psychometric instrument. Switching tabs interrupts the test. Browser scheduling and device conditions can affect timing.

## Measurement and interaction
- WAIT and FLOW run for a target interval of 60,000 ms, measured using `performance.now()` rather than counting timer callbacks. Results retain the actual measured duration.
- COUNT measures the moment the participant chooses to stop; it does **not** stop automatically at 60 seconds. A disclosed five-minute limit interrupts the session without saving a result.
- Hiding the page, a callback gap greater than 1,500 ms, or a wall/monotonic-clock discrepancy greater than 1,500 ms invalidates the session. Browsers are not laboratory timing instruments.
- Estimates accept 0.1–3,600 seconds. Completed records stay in this browser, with a visible history and a two-step delete control. Blocked storage falls back to page-session memory.
- WAIT uses a static point, without a rhythmic timing cue. FLOW preserves the initial eight-number attention task. Keyboard, touch, and reduced-motion preferences are supported.

## Development and checks
No build is needed. Serve this directory over HTTP (for ES modules):

```sh
python3 -m http.server 4173
npm ci --ignore-scripts
npm test
npx playwright install chromium
npm run test:browser
```

GitHub Actions uses read-only repository permissions for unit tests and desktop/mobile Chromium checks. It includes actual 60-second WAIT/FLOW sessions and a real-time COUNT session beyond 60 seconds, plus controlled-clock boundary, interruption, storage, validation, and narrow-layout cases. Browser review images are retained as CI artifacts, not part of the public site.

## Initial source
Based on the original `1minutes.zip` supplied in the planning conversation, with its dark monochrome exhibition design retained. Source ZIP SHA-256: `46c33843e7e08eea71665c6b246d616b93dc0487e970afcae505afbde8c4a183`. The implementation fixes timing and interruption behavior and adds visible local history and accessibility refinements.
