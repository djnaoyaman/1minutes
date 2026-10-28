# 1minutes — ONE MINUTE FOREVER

A public interactive exhibition: twelve distinct experiences of one real minute.

## The twelve rooms
WAIT (static point), FLOW (attention targets), ANTICIPATION (almost-opening light), COUNT (inner-clock marker), OVERLOAD (dense symbol search), STILLNESS (subtle light field), MEMORY (word sequence and post-interval recognition), CHOICE (successive semantic decisions), REPETITION (accumulating stamps), NOVELTY (changing visual grammars), RHYTHM (steady audiovisual beat), SYNCHRONY (adaptive simulated partner).

All have the same 60,000ms target. A monotonic clock is sampled rather than counting callbacks. The first callback at/after the deadline completes the interval; actual elapsed duration is retained, never fabricated as exactly60. Normal completion may be slightly later because browser scheduling is not a laboratory clock.

COUNT does not stop the experiment: it records one estimate marker within the60-second observation window. If no marker occurs, it is explicitly censored (not a zero error or an invented over60 estimate). All twelve ask felt duration after the interval. MEMORY recognition occurs only after that estimate, outside the interval. SYNCHRONY uses an explicitly labeled virtual partner, not real other users.

## Interruption, privacy and accessibility
Tab hiding, pagehide/navigation, nonmonotonic time, a callback gap over1500ms, or wall/monotonic disagreement over1500ms invalidates the trial without saving. Reloads abandon incomplete trials. Sounds are opt-in, unlocked by user gesture, mutable, stopped on abort/end/hide; rhythm remains visible muted. Reduced-motion CSS and stage behavior, large touch targets, keyboard buttons, status announcements and 320px layouts are supported.

Results stay in localStorage, no server transmission, no analytics. Storage failure falls back to page memory. V3 retains240 records, shows24 and all12 per-experiment mean felt-duration differences. Existing v2 records remain readable but are excluded from comparisons because original COUNT was variable-duration. Deleting uses two confirmations and removes both versions.

## Scientific framing
Every experiment has intent, related evidence, a distinct artistic hypothesis/limitation, and source links in `research.json`. Most references are primary studies; the secondary meta-analysis is labeled in metadata. These are exploratory artworks, not diagnoses or validated psychometric instruments. Known60-second exposure is prospective, not a true retrospective design. Passage-of-time feelings and numerical estimates are different. Subsecond effects are not generalized as established60-second effects.

## Development
Static ES modules, no build.

```sh
npm ci --ignore-scripts
npm test
npx playwright install chromium
npm run test:browser
```

Browser tests cover all12 real60-second full lifecycles on desktop/mobile, plus controlled-clock boundary/interruption/reload/repeat/storage/mute/migration/narrow-layout cases. `TEST_BASE_URL` runs the same suite against a deployed host (use trailing base path). No local user data or external submissions are involved. Screenshots and traces are retained as CI artifacts.

## Deployment
GitHub Pages serves main/root at https://djnaoyaman.github.io/1minutes/ . Publication must follow passing tests and remote main/deployment verification. The GitHub Actions test workflow has read-only repository permissions.

Initial source was the owner's1minutes.zip; this expansion preserves its monochrome exhibition identity.
