# 1minutes — ONE MINUTE FOREVER

A public interactive exhibition: twelve distinct experiences of a self-produced minute.

## The twelve rooms
WAIT (static point), FLOW (attention targets), ANTICIPATION (almost-opening light), COUNT (inner-clock attention), OVERLOAD (dense symbol search), STILLNESS (subtle light field), MEMORY (word sequence and post-interval recognition), CHOICE (successive semantic decisions), REPETITION (accumulating stamps), NOVELTY (changing visual grammars), RHYTHM (steady audiovisual beat), SYNCHRONY (adaptive simulated partner).

All twelve now use **time production**: press the common stop button when you feel 60 seconds have passed. There is no automatic end at real60 seconds and no post-trial felt-seconds question. A monotonic clock measures start to received stop input. Result and comparison use actual elapsed seconds minus60: negative means an early stop; positive means a late stop. No normal timeout is imposed.

COUNT focuses on the inner clock without a redundant marker. MEMORY cycles eight chosen words, tracks only unique words actually displayed before stopping, and asks recognition outside the measured interval. SYNCHRONY is an explicitly labeled virtual partner, not real users.

## Interruption, privacy and accessibility
Tab hiding, pagehide/navigation, nonmonotonic time, a callback gap over1500ms, or wall/monotonic disagreement over1500ms invalidates the trial without saving. Reloads abandon incomplete trials. Sounds are opt-in, unlocked by user gesture, mutable, stopped on abort/end/hide; rhythm remains visible muted. Reduced-motion CSS and stage behavior, large touch targets, keyboard buttons, status announcements and 320px layouts are supported.

Results stay in localStorage, no server transmission, no analytics. Storage failure falls back to page memory. V4 stores method=production, measured actual seconds, and no felt-duration estimate. It retains240 records, shows24 and all12 mean stopping-time differences. Existing v2/v3 records remain labeled legacy and excluded from production comparisons. Deleting uses two confirmations and removes all versions.

## Scientific framing
Every experiment has intent, related evidence, a distinct artistic hypothesis/limitation, and source links in `research.json`. Most references are primary studies; the secondary meta-analysis is labeled in metadata. These are exploratory artworks, not diagnoses or validated psychometric instruments. Producing a target60-second interval is prospective, not retrospective duration estimation. Passage-of-time feelings and numerical estimates are different. Subsecond effects are not generalized as established60-second effects.

## Development
Static ES modules, no build.

```sh
npm ci --ignore-scripts
npm test
npx playwright install chromium
npm run test:browser
```

Browser tests cover all12 real beyond60-second user-stop full lifecycles and all12 controlled early stops on desktop/mobile, plus controlled-clock boundary/interruption/reload/repeat/storage/mute/migration/narrow-layout cases. The full Playwright suite runs against the checked-out site on localhost in CI, including screenshots at 320, 390, 768 and 1280px. Production verification separately compares exact asset bytes with sequential public requests at least 65 seconds apart; it does not rerun the browser suite against production. No local user data or external submissions are involved. Screenshots and traces are retained as CI artifacts.

## Deployment
GitHub Pages serves main/root at https://djnaoyaman.github.io/1minutes/ . Publication must follow passing tests and remote main/deployment verification. The GitHub Actions test workflow has read-only repository permissions.

Initial source was the owner's1minutes.zip; this expansion preserves its monochrome exhibition identity.

## Launch Package foundation
Canonical, sharing metadata and JSON-LD describe the existing twelve user-stopped experiences. Sitemap indexes only the public exhibition, not private local results or the404 page. `robots.txt` inside this project is informational: crawler rules belong to the host-root robots.txt, which this change does not modify. Icons use the approved CONTINUOUS 1 mark, with opaque Apple/Android artwork and separate maskable safe-area variants. No GA, advertising, service worker or experiment logic is added. `llms.txt` is a supplementary guide, not an indexing guarantee.

## Approved identity and mobile typography
The owner selected the CONTINUOUS 1 symbol and font option 03 (Liberation Sans Regular) for the logo word `minute`. Header/footer and share artwork use outlined SVG paths; no font download is required. The website name, canonical URL and storage keys remain `1minutes` (logo wording is not a site rename). Font license: `assets/brand-font-license.txt`.

Exhibition-card symbols and arrows are SVG geometry rather than Unicode pictographs, so mobile emoji fonts cannot replace them. Hero lines retain the wording but use separate Japanese spacing and explicit two-line layout. Measurement, twelve experiments and stored results are unchanged.

Public verification logs every request timestamp, stops without retry on 401/403, and fails if the deployment does not match within a bounded 20-minute / 18-request window. Deployment publication is coordinated with the shared public-request window; localhost tests do not consume it. The public check covers the seven experiment runtime/data files plus icons.js, approved header artwork, favicon SVG, OG PNG, and Apple touch icon.
