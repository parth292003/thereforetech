# Handoff for Codex: Therefore Tech site

Written 2026-11-20 so another coding agent can pick up the work. Read this first, then `docs/PLAN.md` (the spec) and `docs/PROGRESS.md` (the log). Re-read both before each phase.

**Continuation update (2026-11-20):** In the Documents workspace, the two style studies and comparison sheet
are complete, and Parth selected macro still life. He also selected the Connected promise hero study and
asked to apply it: connected headline, larger founder paragraph, moving line beneath the header wordmark,
looping video with the visible play/pause control removed. That hero update is implemented and verified
locally at `http://localhost:8766/`. See the latest PROGRESS entry. The Desktop source checkout remains
separate; no commit, push, deployment or full macro-scene integration has occurred. Sections below record
the earlier handoff state.

## 1. What this is

The production site for **Therefore Tech** (thereforetech.com): a static Eleventy 3 site on GitHub Pages. Repo `parth292003/thereforetech`, working branch `rebuild`. It is run as a safety-critical programme: every phase is verified (Lighthouse 95+, valid HTML, mobile checks) and logged in PROGRESS.md.

## 2. Ground rules (non-negotiable)

- **Ask Parth before changing brand, copy or site structure.** Never invent clients, metrics, quotes or claims. Copy comes from `src/_data/*.json` and is approved line by line (`scripts/approved-copy.json`, checked by `npm run check:copy`).
- **Brand:** always "Therefore Tech" in full. Never the word "consultancy". No AI buzzwords on main pages.
- **NDA:** some past work is under NDA and has been removed. The only permitted reference is: "Parth has worked alongside senior technology leaders at global companies." Never name any person or company. The blocklist lives only in the git-ignored `.nda-blocklist` file (and the `NDA_BLOCKLIST` GitHub secret). `npm run lint:copy` scans the build against it. **Never print, log, commit or paraphrase its contents.**
- **Git:** commit or push only with Parth's explicit approval. Everything since Phase 1 is uncommitted on `rebuild` (see `git status`). Don't commit it without asking.
- **Downloads** (packages, assets, tools) need Parth's permission first.
- **Visual direction:** pure white `#FFFFFF` backgrounds, black ink, no gold, no gradients. Roboto Condensed uppercase is the dominant type; Newsreader is for body text only. Nothing may cross headline text.

## 3. Stack and commands

| Command | What it does |
|---|---|
| `npm run build` | Production build to `_site/` |
| `npm run build:preview` | Production build plus the dev pages (`/dev/tokens/` etc.) |
| `npm test` | Build, copy-lint (incl. NDA scan), html-validate, approved-copy check. Must pass. |
| `node scripts/serve.mjs 8765` | Serves `_site` **with HTTP Range support**. Use this, not `python -m http.server`: scroll-scrubbed video can't seek without Range. |
| `npx -y lighthouse@13.6.0 http://localhost:8765/ --chrome-flags="--headless=new"` | Lighthouse (add `--preset=desktop`). The first run after a fresh build can spike (cold start), so re-run before believing a bad score. |

Node 22, ffmpeg 8.1 (libx264, libvpx-vp9, libsvtav1), `cwebp`, and Google Chrome are installed. The shell is zsh: unquoted `$var` is **not** word-split, and an unmatched glob aborts a `&&` chain.

## 4. Map of the repo

- `src/index.njk`: homepage. Sections are the hero (full-bleed field video), intro, **Transition 1** (scroll-scrubbed rendered clip), How we work (vector placeholder `branches-to-flock`), and Frontier (vector placeholder, 7 ink rings).
- `src/assets/css/`: `tokens.css` (design tokens), `base.css`, `layout.css`, `home.css` (all scene styles).
- `src/assets/js/`:
  - `scroll-scene.js`: the scene engine. `clipScene()` handles video scenes marked `[data-clip]`; the remaining code is SVG renderers for the placeholder scenes.
  - `hero.js`: the hero video and pause toggle.
  - `site.js`: navigation and mask reveals.
- `src/_data/`: all copy and SEO data.
- `src/media/`: web renditions (videos and posters).
- `media-masters/`: masters. Its `renders/` subfolder holds the PNG frame sequences and is git-ignored.
- `scripts/encode-video.sh`: encodes a master into web renditions. Run it as `<master> <id> [loop|scrub] [mobile-master] [poster-seconds]`. Scrub mode puts a keyframe every 6 frames.
- `scripts/render/`: offline scene renderer, Three.js in headless Chrome. **Read its README.**
  - `render.mjs`: the runner.
  - `harness.js`: accumulation renderer. Each frame averages N jittered renders, giving depth of field, soft shadows and anti-aliasing. It also does the composite: exposure set so paper is 255, white edge fade, fade-in/out to white, and grain kept off white areas.
  - `scenes/transition-1.js`: the current scene.
  - `check-scene.mjs`: headless check. It scrolls through the clip scene at a given viewport, saves screenshots, and reports video time plus text-line positions.

## 5. The active task: Transition 1 needs better art direction

**Brief (Parth's words, condensed).**
- Theme: technology evolving into nature. The clips must look properly rendered, never AI-generated or vector-drawn.
- Light and lens: real lighting (soft daylight, gentle shadows, bounce), shallow depth of field, slight lens softness.
- Materials: natural only (paper, ink, wood, leaves, stone). No neon, no plastic.
- Motion and finish: organic eased motion, light film grain. First and last frames are pure white. No text in the render. Keep an empty zone for the headline.
- Specs (PLAN §5.4): 4–6 s at 24 fps, 1920×1080 desktop plus a 1080×1350 mobile master, no audio, posters as AVIF + JPEG.

The three scenes:

| Scene | Idea |
|---|---|
| Transition 1 | A thin metal wire or circuit trace bends, softens and grows into a branch; one leaf unfolds. |
| How we work | A branch opens and a small flock of birds lifts off in one direction. |
| Frontier | Tree rings or a seed form that keeps growing, as a seamless loop. |

Process: one scene first, approved by Parth, before the others.

**Where it stands.** Transition 1 is rendered, encoded, wired into the page and verified (tests pass, Lighthouse 100, nothing crosses the text). Parth **rejected the look**: "needs better art direction". The other two scenes have not been started.

**Critique of the current version** (see `media-masters/transition-1-frames.png`):
1. **Scale and composition.** The subject is a hairline in a big empty field at the bottom of the frame. It reads as a diagram, not a photograph.
2. **Camera.** A high three-quarter view with a wide aperture blurs almost everything evenly. No plane is crisp, so there is no hero focus, and the blur reads as a filter rather than a lens.
3. **Light.** A flat, high sun gives no shape and doesn't rake the paper texture. The shadows are grey blobs, and there is no warm/cool contrast.
4. **Materials.** The copper reads pinkish-grey. The stem reads as a black worm. The leaf is a flat green cut-out with painted veins and no translucency.
5. **Story.** One trace and one pad don't say "circuit" at a glance, and the change from metal to living is a single morph.

**Two proposed directions** (neither started; make style frames before any full render):

- **A. Macro still life** (editorial product photography).
  - Camera and focus: low camera (about 15° above the paper) with a long lens; a crisp focal plane at the point where copper becomes bark, falling off naturally front and back.
  - The board: a routing band of about five parallel copper traces with 45° jogs and a couple of vias. The middle trace lifts and grows; its neighbours stay on the paper and run off frame.
  - Light: a low, warm raking key from back-left, giving long soft shadows, paper texture and glints along the copper, with a cool fill from front-right.
  - Leaf and atmosphere: the leaf is larger and backlit, glowing translucent green. White fog dissolves the paper horizon into the page.
- **B. Specimen plate** (overhead flat-lay, botanical-archive feel).
  - Camera and light: near top-down and nearly everything sharp. Soft overcast north light with small, soft contact shadows.
  - Story: copper traces branch across the paper like PCB routing and turn into a pressed-plant branch. As it lifts slightly, the growing shadow is what tells you it has left the page. The leaf unfolds flat towards the camera.
  - Why it suits the site: graphic and calm, and the easiest way to keep the top-left headline zone empty.

**Suggested first job for Codex** (a good test of how it can help):
1. Make `scripts/render/scenes/transition-1-macro.js` and `transition-1-specimen.js`. Copy `transition-1.js` as the starting point and leave the original untouched.
2. Render style frames, desktop only, 16 samples: `node scripts/render/render.mjs transition-1-macro desktop --samples 16 --frames 30,70,100 --out media-masters/renders/style-macro`. Each frame takes about 1–2 s.
3. Iterate on camera, light and materials until each direction looks photographed. Then put the frames side by side in one contact sheet with the current version.
4. Hand the sheet to Parth to pick a direction. **Don't** re-encode, change the page or render the other scenes until he picks.

**Technical hooks in the scene file.**
- `setup()` returns `prepare(frame)` (builds the geometry for that frame) and `sample({ax, ay, lx, ly, jx, jy})`: aperture, light and pixel jitter per accumulated sample.
- It also returns the composite settings: `exposurePatch` (a uv patch that must be bare paper), `paperWhite`, `grain` and `edge`.
- Within the scene:
  - The tube geometry uses a per-vertex `aBark` value to blend copper into bark.
  - The leaf is a parametric grid in `shapeLeaf(open, time)`.
  - The camera moves with a slow push-in and racks focus via `focusOnAxis`.
- Shadow-map bounds are ±2.6 units. Long shadows get clipped into grey smudges at the frame edge, so widen the bounds if the light goes low.

**When a direction is approved:**
- Full render at 64 samples for desktop and mobile (about 40 s each; wrap it in `caffeinate -dims`).
- Build the masters with ffmpeg CRF 12 (commands in `scripts/render/README.md`), then run `scripts/encode-video.sh media-masters/transition-1-desktop.mp4 scenes/transition-1 scrub media-masters/transition-1-mobile.mp4 4.25`.
- Rebuild and serve, then run `node scripts/render/check-scene.mjs 1440 900 0 <outdir>`, plus 1920×1080 and `375 812 1`, plus reduced motion (`… 1`). Check the screenshots for text crossings.
- Run `npm test` and Lighthouse, and log everything in PROGRESS.md.

## 6. Other open items (need Parth, don't guess)

- Readability of the intro paragraph over the hero video now that the scrim is gone (it measures 3.8:1 in places; body text needs 4.5:1).
- The hero video and frontier loop have no on-page pause control (WCAG 2.2.2). This is recorded as an accepted deviation pending confirmation.
- The inner pages need a design pass once the homepage direction is approved.
- Still outstanding from Parth: contact email, Cal.com link, bio, LinkedIn, founder note, wordmark, and approval of the DRAFT copy lines.

## 7. Gotchas already paid for

- The in-app browser pane throttles rAF and IntersectionObserver when hidden, so scroll tests there are unreliable. Use `check-scene.mjs` (headless, real viewport).
- Browsers cache JS hard on the local server; fetch with `cache: 'reload'` or bust the URL.
- Mask reveals observe the parent element, because a clip-path gives the element itself zero area.
- An `ol[role=list]` reset outranks `.container` padding, so wrap lists in their own container div.
