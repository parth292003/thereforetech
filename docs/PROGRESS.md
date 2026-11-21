# Therefore Tech — Progress Log

Living context file. Update after every phase. Read this and `docs/PLAN.md` at the start of every session and before every phase.

## Current status

- **Phase:** Homepage hero updated to the selected Connected promise direction in the Documents workspace. Content model is complete; the Desktop source checkout retains its earlier uncommitted work separately.
- **Next step:** Review the updated local homepage at `http://localhost:8766/`. Parth selected the macro still-life direction for Transition 1; its mobile composition, full renders and integration remain future work. DRAFT copy still needs review separately.
- **Live site:** coming-soon page, unchanged.
- **Launch blockers outstanding:** `npm run check:launch` prints the live list (20 blockers, 8 held-back items on 2026-11-19). See also PLAN §8.1.

## Environment facts

- Codex continuation on 2026-11-20: a file copy of the Desktop working tree is in `~/Documents/ChatGPT/Therefore Tech`, the writable workspace. Its Git repository is separate and has no commits; the source `rebuild` checkout and its existing changes remain on the Desktop. Installed dependencies were copied locally, with no downloads. No commit or push was made.
- Local working copy: `~/Desktop/Therefore Tech` = clone of `github.com/parth292003/thereforetech`. **The repo is public**: anything committed, including `docs/`, is public.
- GitHub Pages: legacy build from `gh-pages` branch (same commit as `main`, `390affb`). Custom domain `www.thereforetech.com`. Cert covers apex + www. HTTPS **not** enforced yet.
- Tooling available locally: Node 22.14, npm, ffmpeg/ffprobe (Homebrew). No Hugo.
- Hero video `bg.mp4`: H.264 2050×1080, 23.976 fps, 19.1 s, no audio, 8.8 MB.

## Log

### 2026-11-19 — Phase 0 (complete)
**Done**
- Cloned the repo and audited it: single-file coming-soon page (Roboto Condensed, uppercase, drawn rules, line-mask reveals, film grain, field video background).
- Wrote `docs/PLAN.md`. Parth approved it with changes.
- Applied the changes: NDA engagement removed everywhere (and kept out of the public repo, including the lint blocklist); founder-experience line added; operational resilience is a capability page only; financial anomaly detection and automated research systems kept as DRAFT; engagement models section added (DRAFT); 8 post-launch article topics added; founder note made a launch blocker; Q1–Q9 answers recorded.
- Read the Apple design skill (`dickwu/apple-design-skill`) and recorded what was adopted in PLAN §4A.1: HIG type scale as compact anchors, 17 px body floor, 44 px targets, contrast ratios, width-based layout, reduced-motion rules, pause control for looping video. Spacing scale and motion durations are judgment (the skill has no numbers for them).

**Decisions made**
- Static generator: Eleventy v3. Deploy: GitHub Actions → Pages at launch; `gh-pages` kept as rollback. Canonical host `https://www.thereforetech.com`.
- Palette A "Field". Ochre `#B08A3E` is a fill colour only (2.77:1 on bone); links use `#7A5C22` (5.37:1).
- Fonts: Roboto Condensed (labels/nav/wordmark) + Newsreader (headlines/body), self-hosted.
- Light appearance only at launch (open item O6).
- Hero video and the looping scene get a pause/play control (Apple skill + WCAG 2.2.2).

**Open issues**
- Open items O1–O7 in PLAN §10.
- HTTPS not enforced on the live domain (fix at launch).
- NDA blocklist terms need agreeing with Parth (kept outside the repo).

### 2026-11-19 — Phase 1: Foundations (complete)
**Done**
- Local branch `rebuild` created from `main`. Coming-soon files left untouched at the repo root; the new site lives in `src/` and builds to `_site/`.
- Eleventy 3.1.8 scaffold (`eleventy.config.js`): inlined CSS, passthrough assets, drafts (`draft: true`) and dev pages (`devOnly: true`) removed from production builds, every non-production build marked `noindex`.
- **SEO guard** in the build: fails on missing `title` / `description` / `targetPhrase` / `h1`, duplicate titles or descriptions, title > 60 or description > 155 chars. (It caught a 160-char description on the first build.)
- SEO head partial (title, description, canonical, OG, Twitter, JSON-LD includes) + `Organization` and `WebSite` schema.
- `tokens.css` implements PLAN §4A: Palette A, fluid HIG-anchored type scale (360→1440 px), 4 px spacing scale, 4/8/12 grid, 44 px targets, motion tokens, reduced-motion overrides.
- Fonts: `scripts/subset-fonts.sh` trims the variable fonts to the weights in use and Latin text: Newsreader 37 KB, Roboto Condensed 26 KB (were 58 + 51 KB), italic 39 KB loaded only on use. OFL licences shipped beside the files.
- Base layout, header (wordmark, nav, "Book a founder conversation"), compact-width menu (works without JS; Escape closes and returns focus), footer, skip link, focus ring, buttons.
- `scripts/copy-lint.js`: brand name, "Theirfor", "consultancy", buzzwords (outside `/work/`), NDA blocklist across the whole repo + built site. Never prints NDA terms in output. Fails in CI if the blocklist secret is missing.
- `.html-validate` config (recommended + a11y; inline styles banned). Two rules off on purpose: `doctype-style` (lowercase doctype is valid) and `no-redundant-role` (`role="list"` kept because Safari drops list semantics when list bullets are removed with CSS).
- `.github/workflows/ci.yml`: build → copy lint → HTML validation on `rebuild`, `main` and PRs. No deploy step (Phase 10).
- Home shell with the approved H1, sub and CTAs; dev-only `/dev/tokens/` specimen page.

**Acceptance results**
| Check | Result |
|---|---|
| `npm run build` | Clean |
| Copy lint | Pass. Planted violations (brand name, misspelling, "consultancy", buzzword, NDA term) all caught; CI without blocklist fails as designed |
| HTML validation | 0 errors on both pages |
| Lighthouse home, mobile | 100 / 100 / 100 / 100 on three consecutive runs (Perf / A11y / Best practices / SEO). LCP 0.8 s, CLS 0, TBT 0–10 ms. A first run showed a TBT spike (Perf 78) while Chrome was cold-starting; not reproducible |
| Lighthouse home, desktop | 100 / 100 / 100 / 100 |
| Lighthouse `/dev/tokens/` | Perf, A11y, BP 100 mobile + desktop. SEO 63 by design (page is `noindex`) |
| Accessibility | Lighthouse a11y (axe-based) 100; no horizontal overflow at 375 px and at 200% text size; menu works by tap and keyboard |
| Page weight | Home 80 KB total, all fonts included |
| Live site | Unchanged (nothing pushed) |

**Decisions made**
- Builds always start from an empty `_site/` (`npm run clean`), so dev pages can't leak into production output.
- `npm run build:preview` = production build that also includes dev pages, for Lighthouse runs on `/dev/tokens/`.
- Local NDA blocklist seeded with 3 terms (git-ignored). Parth to confirm or extend, then copy them into the `NDA_BLOCKLIST` Actions secret.
- Footer line "The innovation arm for founders." uses the brief's own positioning words. `site.description` in `src/_data/site.json` is new wording built from the brief: **DRAFT**, for approval in Phase 2.

**Open issues**
- CI has not run on GitHub yet: `rebuild` is not committed or pushed. It will fail until the `NDA_BLOCKLIST` secret exists (intended).
- `og:image` points to `/media/og/default.jpg`, which doesn't exist yet (Phase 7).
- Favicon is a placeholder (soil square, ochre line) until the wordmark arrives (O2).
- Fallback font metric overrides (`size-adjust` etc.) are estimates; tune in Phase 3 when real content shows any shift. CLS is 0 today.
- Lighthouse cache/compression notes come from the local Python test server; GitHub Pages serves gzip and cache headers. Re-check on a Pages preview.

**Update, same day:** Phase 0–1 committed (`659a46a`) and pushed to `origin/rebuild` with Parth's approval. `NDA_BLOCKLIST` Actions secret set from the local list; CI run 44518163309 passes (build, copy lint incl. NDA, HTML validation). Live site still served from `gh-pages`.

### 2026-11-19 — Phase 2: Content model (complete)
**Done**
- **Homepage copy as data:** `src/_data/home.json`, one object per section (PLAN §4), each with `status` (`approved`, `draft`, `missing`). Approved lines are the brief's words, unchanged. Home template now reads from it.
- **Approved-copy guard:** `scripts/approved-copy.json` holds the 24 approved lines exactly as Parth wrote them; `scripts/check-copy.js` fails if any is missing or altered in the data (tested: one changed word fails). `--html` mode checks the rendered homepage; switch it on in Phase 3. Added to `npm test`.
- **Keyword map:** `src/_data/seo.json` (13 URLs + the 8-topic roadmap). `targetPhrase` comes only from here (`src/_data/eleventyComputed.js`). The SEO guard now also fails on an indexable URL missing from the map and on duplicate target phrases.
- **Claims register as data:** `src/_data/claims.json`, matching PLAN §9.
- **Engagement models:** `src/_data/engagementModels.json`. Names approved; descriptions DRAFT, with no durations, prices or outcomes.
- **Inner pages with DRAFT copy:** transform, discover, how-we-work, operational-resilience, work index, about, contact, insights index, 404. Work items and the two articles exist as `draft: true` pages (held back from production; articles are outlines only, full drafts in Phase 6). Service pages open with a quotable two-sentence definition and end with three plain-language FAQs.
- **Page layout** (`layouts/page.njk`) with a rose "Draft copy" banner shown in dev and preview builds only.
- **Launch-readiness check:** `npm run check:launch` lists every blocker (DRAFT copy, placeholders, missing founder note, draft claims, missing email / Cal.com / LinkedIn) and every held-back item. Exits 1 until launch; deliberately not in CI.
- `npm run build:preview` now includes draft and dev pages (for review and Lighthouse), still with no `noindex`.

**Acceptance results**
| Check | Result |
|---|---|
| Homepage copy verbatim (automated) | Pass, 24/24 lines |
| Every page has title / description / targetPhrase / h1 | Pass (enforced by the build) |
| Copy lint | Pass on production (10 pages) and dev (15 pages) builds |
| HTML validation | 0 errors on production and dev builds |
| Lighthouse mobile: transform, how-we-work, contact, work | 100 / 100 / 100 / 100 each |
| Production build excludes held-back items | Yes: `/work/` lists 2 confirmed items; `/insights/` shows its empty state; no draft banners |

**Decisions made**
- Contact form gets an **Email** field (DRAFT, open item O8): the brief's three fields leave no way to reply.
- A company LinkedIn page is optional; Parth's own LinkedIn is required.
- How-we-work step bodies are stored with an initial capital ("You tell us the real problems."); wording unchanged.

**Open issues**
- All DRAFT copy needs Parth's review (O9).
- Bugs found and fixed during the phase: the insights index listed itself; the preview build linked to held-back pages it didn't contain.

### 2026-11-19 — Design review: monochrome, condensed voice, motion (homepage + Discover ready for review)
Parth's seven design changes (PLAN "Design review, 2026-11-19"). Homepage and Discover are done and await approval; other inner pages inherit the new global styles but are not tuned yet.

**Done**
- **Palette "Ink":** pure white `#FFFFFF`, ink `#111111`, muted `#5A5A5A`, thin black rules. All gold/ochre removed, favicon placeholder included.
- **Type:** Roboto Condensed uppercase (400–900, 31.7 KB) for nav, labels, buttons and all headings; Newsreader for body and long text only.
- **Hero:** full-bleed field footage (desktop 2.89 MB MP4 / 2.39 MB WebM; mobile 1.14 / 0.95 MB), loaded after `load`, never with reduced motion or Save-Data. Poster is the LCP image. White scrim keeps black text ≥ 4.5:1. Pause control (WCAG 2.2.2), pauses off-screen and in background tabs.
- **Untangling line:** draws in tangled, then straightens into a full-bleed rule directly above the H1 (3.2 s, once).
- **Scroll reveals:** fade/rise, mask and rule-draw variants; staggered; all content visible without JS or with reduced motion.
- **ScrollScene placeholders with real movement:** circuit → branches (scrubbed), branches → flock (scrubbed), frontier rings (looping, with pause). Labelled "Placeholder motion" in preview builds only. Final Fable clips swap in without template changes.
- **Full 12-column grid:** split panels, offset philosophy line, four-column steps, editorial work index, two-column contact. Inner pages: title left, body right per section (`sectionize` filter).
- **Discover:** duplicated "Discover what's next" label removed (eyebrow now hidden whenever it equals the H1, site-wide).

**Acceptance results**
| Check | Result |
|---|---|
| `npm test` (build, copy lint incl. NDA, HTML validation, approved copy in HTML) | Pass, 24/24 lines |
| Lighthouse home, mobile | 100 / 100 / 100 / 100 (LCP 1.8 s, CLS 0, TBT 25 ms) |
| Lighthouse home, desktop | 100 / 100 / 100 / 100 (LCP 0.4 s) |
| Lighthouse Discover, mobile / desktop | 100 ×4 each (first mobile run 77 from Chrome cold start; three reruns 100) |
| No horizontal scroll at 375 px | Pass, home and Discover |

**Bugs found and fixed**
- Hero line crossed the H1 and the pause control overlapped the CTAs: line moved into the content flow above the H1; control moved to the top right.
- SVG `max-width: 100%` stopped the full-bleed line short of the right edge.
- Mask reveals never fired: the clip-path gives the element zero area, so IntersectionObserver never reported it. Mask items are now watched through their parent.

**Open issues**
- Reduced-motion path checked in code (poster only, line straight, final scene frames, no pinning) but not yet in a browser with the setting on.
- Other inner pages need the same composition pass once Parth approves this direction.
- Video weight (≈3 MB desktop) is outside the Lighthouse budget because it loads after `load`; re-check on a real 4G device in Phase 9.

**Update, same day: Parth's feedback on the homepage**
- Hero: white filter (scrim) removed; footage shows at full colour. "Pause background video" control removed at Parth's request. Video still never plays with reduced motion or Save-Data, and pauses off-screen.
- Scene palette added (tokens `--scene-*`, illustration only, never UI or text), taken from the footage: haze blue, dusk rose, flower butter, grass sage, evening lilac. Scene 1 shifts from cool haze (blue circuit traces) to a warm dusk field (green branches) as you scroll. Scene 2 moves from field light to an evening sky as the flock leaves. Frontier sits on a warm wash; rings sweep rose → gold → green as they grow.
- How we work steps touched the screen edge: a base `ol[role=list] { padding: 0 }` reset outranked `.container`. Steps now sit inside their own container (16 px gutter on mobile).
- Lighthouse home after the change: 100 ×4 mobile (LCP 1.65 s) and desktop. `npm test` passes.

**Open issues from this update**
- Contrast without the scrim (measured on the poster): headline 3.2:1 at its darkest patches, passing the 3:1 large-text minimum. Intro paragraph averages 4.9:1 but drops to 3.8:1 over the darker flowers, under the 4.5:1 body-text minimum. Needs a decision.
- Removing the pause control means the looping hero video has no on-page stop (WCAG 2.2.2). Reduced-motion visitors never see it play. Recorded as an accepted deviation pending Parth's confirmation.
- Frontier animation made more detailed: 16 contour rings (some dotted, some heavier), colour blending continuously rose → gold → green as each ring grows, 36 faint radial spokes, 34 nodes riding the rings with links between near neighbours, and a pulsing core. Runs at 60 fps; it renders only while on screen and the tab is visible.
- Frontier "Pause animation" control removed at Parth's request. Like the hero video, the loop now has no on-page stop (WCAG 2.2.2); reduced-motion visitors get a still final frame.
- Lighthouse home after this: mobile 99 / 100 / 100 / 100 (TBT 134 ms), desktop 100 ×4.

### 2026-11-19 — Scene redesign (Fletcher principles): Transition 1 ready for approval
Parth's brief: one idea per scene, hand-made marks on paper, one field gradient site-wide, film feel, restraint, nothing crossing headlines, no placeholder captions, smaller pause control. Only Transition 1 is redone; the flock scene and frontier wait for approval of this one. (A request to simplify the frontier back to 7 rings was applied first; that scene is superseded by the "years → months" timeline in the brief.)

**Done**
- **Transition 1: one circuit line that ends in a leaf.** A single continuous stroke, drawn as you scroll: an even technical-pen trace with two 45° jogs and a solder-pad loop, which lifts off into a stem, gains brush pressure and draws the leaf (outline and midrib) in the same pass. A green wash bleeds in, slightly off-register, as "We own the outcome with you." appears. Colour is used only on the leaf.
- **Hand-made marks:** the stroke is a filled ribbon so weight varies (about 1.7 px pen to 3.7 px brush); seeded tremor and rough edges, fixed per point so they never shimmer. Geometry is rebuilt for the actual size, so mobile and desktop both compose properly.
- **Layout:** text row above, drawing row below, so nothing can cross the type (measured: text ends at 381 px, ink starts at 412 px at 1440 × 900; 257 / 451 px on mobile).
- **One field gradient** (`--gradient-field`: dusk haze → cream → straw, sampled from the footage) with a fine paper tooth. To be used for every illustrated scene.
- **Film feel on the hero:** 24 s Ken Burns drift and the moving grain from the coming-soon page. Both off with reduced motion.
- **"Placeholder motion" captions removed.** **Pause control back as a small round mark** (keeps the 44 px hit area), top right of the hero.

**Checks**
- `npm test` passes. Lighthouse home: desktop 100 ×4; mobile 100 ×4 on three runs (TBT 0–40 ms). The first run after a fresh build scored 63 (TBT 11.7 s), the same cold-start pattern seen before; noted, not reproduced.

**Open**
- Approval of this scene's visual language before redoing How we work (one continuous line through four steps) and the frontier (a "years" timeline that shrinks to "months").
- The frontier currently has no pause control; it gets the small one when it is redone.
- Fable clips will replace the footage-based film feel when ready.

### 2026-11-20 — Gradients removed; Transition 1 rendered as a real video clip (ready for approval)
Parth's brief: (1) undo the gradients, so every section and scene is pure white `#FFFFFF`; (2) replace the coded vector scenes with properly rendered clips on the theme "technology evolving into nature", made to look photographed, not AI-generated or vector-drawn. Render ONE scene (Transition 1) first for approval. Parth chose an offline Three.js render over installing Blender.

**1. Gradients undone**
- All scene, section and frontier gradients, the paper texture and the `--field-*`, `--gradient-field` and `--scene-*` tokens removed. Every background is `#FFFFFF`.
- The flock scene and frontier remain the earlier simple ink line art on white until their clips are approved. The frontier is back to the 7-ring version.

**2. Renderer (`scripts/render/`, see its README)**
- Three.js 0.175 (devDependency) running in the installed Chrome, headless on the Apple M4 GPU. A Node server collects PNG frames into `media-masters/renders/` (git-ignored).
- Each frame averages 64 jittered renders: the aperture for real depth of field (the focus racks from the solder pad to the leaf), the sun disk for soft shadows, and sub-pixel offsets for anti-aliasing.
- Lighting: warm low-noon daylight with an environment bounce and a faint sky fill.
- Natural materials: paper with a fibre normal map, copper that blends into bark and young-twig colour along the stem, and a leaf with a vein map, sheen, a curl and an edge wave.
- Composite:
  - Exposure set from a bare-paper patch so paper is exactly 255.
  - Frame edges fade to white.
  - The first and last frames are pure white.
  - Light grain, kept off white areas so the clip melts into the page.
- No text in the render.
- Render time: about 40 s per variant (120 frames, 64 samples).

**Transition 1: "a copper trace grows into a branch"**
A circuit trace lies on paper. Its end softens, lifts off the page and turns into a living stem, and one leaf unfolds. 5 s at 24 fps, 120 frames. The video is scrubbed by scroll.
- Desktop master 1920×1080; mobile master 1080×1350 (own camera framing).
- Renditions (`scripts/encode-video.sh … scrub <mobile-master> 4.25`): keyframe every 6 frames (checked: 20 keyframes, 0.25 s apart, in both MP4 and WebM).

  | Variant | MP4 | WebM |
  |---|---|---|
  | Desktop | 156 KB | 302 KB |
  | Mobile | 117 KB | 217 KB |

  | Poster | AVIF | WebP | JPEG |
  |---|---|---|---|
  | Desktop | 2.9 KB | 7.1 KB | 20.7 KB |
  | Mobile | 2.5 KB | 4.5 KB | 12.9 KB |

- Page: both lines sit in the left columns above the clip. The video loads one viewport ahead, never with reduced motion or Save-Data (those get the poster), and is primed for iOS.
- `encode-video.sh` now takes a separate mobile master and poster time, and also writes AVIF posters.
- New `scripts/serve.mjs`: a local static server with HTTP Range support. Video seeking needs it, matching GitHub Pages; Python's `http.server` reset every seek to 0.

**Bugs found and fixed while rendering**
- The exposure probe sampled the background behind the paper, so the first render was over-exposed. Fixed with a larger paper and a corner probe.
- The camera tilted during the focus rack. Fixed with a fixed aim and the focal plane on the optical axis.
- The leaf was soft. Fixed by focusing on the computed leaf centre.
- Mobile paper read as an off-white box. Fixed by pushing paper to pure white, softening the paper normals and keeping grain off white.
- The leaf shadow was clipped at the frame edge into a grey smudge. Fixed with a higher sun, so the shadow falls under the plant.
- The desktop render stalled while the Mac slept. Long renders now run under `caffeinate`.

**Checks**
- Every rendered frame: paper outside the subject is 255; the first and last frames are pure 255.
- Headless Chrome at 1440×900, 1920×1080 and 375×812: video time tracks scroll (0 → 4.97 s), both lines switch on at 4% and 70%, and nothing crosses the text at any size. Reduced motion shows the poster.
- `npm test` passes. Lighthouse home (13.6.0): mobile 100 ×5 (LCP 0.9 s, CLS 0, TBT 0), desktop 100 ×5.

**Open**
- Parth's approval of Transition 1 before rendering How we work (a branch opens, a small flock lifts off) and the frontier (growing tree rings or a seed form, seamless loop).
- By spec, the clip ends on white, so the last screen of the scene shows only the two lines on white.

### 2026-11-20 — Transition 1 art-direction studies (awaiting selection)

**Done**
- Read the handoff, master plan, progress log and render README. Continued the handoff's proposed style-frame task in the writable Documents workspace.
- Added `transition-1-macro.js` and `transition-1-specimen.js`, sharing `transition-1-study.js`, derived from the original scene. The original `transition-1.js` is unchanged.
- Both studies use five copper routing traces with 45-degree jogs and two vias. The centre trace lifts, gradually becomes a round stem and unfolds one larger leaf. Improved the stem-to-paper join, copper colour, bark shading, leaf shape and thin-tissue lighting.
- **A, macro still life:** lower camera, warm raking key and cooler fill, a narrow focal plane, larger leaf and white horizon.
- **B, specimen plate:** overhead view, greater depth of field, soft daylight and a visible shadow as the stem lifts off the paper.
- Iterated on exposure: the low camera's upper corner was background rather than paper, so the macro probe now samples bare foreground paper. The distant background stays white through the composite.
- Rendered desktop frames 30, 70 and 100 at 16 samples for both studies and the unchanged original. Also rendered study frames 0 and 119 for endpoint checks.
- Assembled `media-masters/transition-1-style-comparison.png`, a three-column contact sheet, using the reproducible `scripts/render/contact-sheet.py` script. Inspected the sheet and individual frames visually.

**Verification**
- Both studies: all sampled PNGs are 1920 x 1080. Frames 0 and 119 are entirely RGB 255. The upper-left 900 x 400 pixel headline reserve is entirely RGB 255 in every sampled frame.
- Production `src/` files match the Desktop source byte for byte; no page, copy, video rendition or poster was changed. No other scene was started.
- `npm test` passes with installed Node 22.14.0: production build, copy lint including NDA scan, HTML validation, 24/24 approved lines in data and HTML.
- The shell initially selected Node 20, which failed the existing HTML validator because `fs.globSync` is unavailable. Used `PATH="$HOME/.local/bin:$PATH" npm test` to select installed Node 22; no packages or tools were downloaded.
- Lighthouse and page-level mobile/scroll checks were not rerun for these offline-only studies. They remain required when the selected scene is integrated.

**Next**
- Parth selects A or B, or supplies further art direction. These are style studies, not approved final photography.
- Then tune the mobile camera, render the full sequences at 64 samples, encode and integrate only the selected direction, and repeat the page-level checks in the handoff.
- No commits, pushes, production integrations or full-sequence renders have been made during this continuation.

### 2026-11-20 — Connected promise hero applied (complete locally)

**Approval**
- During the homepage review, Parth selected the first typography study, Connected promise, and explicitly asked to apply/fix it.
- He requested that the existing moving line sit beneath the Therefore Tech wordmark, replacing the header's static rule. The background video stays and its visible play/pause button is removed.

**Done**
- The approved headline now reads as one sentence: "We rethink how your business works, and build what comes next." Updated the canonical homepage data, heading metadata, plan and approved-copy guard together.
- Four deliberate headline lines on desktop; the spans wrap naturally on compact screens. The founder paragraph is larger (about 22 px compact / 28 px desktop), immediately below the headline, with "ambitious founders" emphasized. Its wording is unchanged.
- Hero CTAs follow the paragraph. Removed the earlier delayed paragraph/button entrances so the supporting message appears promptly.
- Moved the original untangling SVG animation into the homepage header, beneath the wordmark/navigation, in place of the static horizontal rule. It retains its existing once-on-load motion. Inner pages retain their static rule.
- Removed the hero's visible play/pause control and its unused CSS/JS. The video loops while the hero is visible; off-screen/background-tab pausing and reduced-motion/Save-Data poster fallbacks remain.
- Enlarged-text verification found header-line overlap and existing grid/input overflow. Increased hero header clearance, let navigation shrink/wrap, and fixed intrinsic minimum widths in homepage grids and form fields.
- Started the Documents workspace preview at `http://localhost:8766/` and opened it in the browser pane. The older Desktop preview on port 8765 remains a separate working copy.

**Verification**
- `npm test`: pass (production build, NDA/copy lint, HTML validation, all 24 approved lines verbatim).
- Headless Chrome at widths 360, 375, 390, 768, 1024, 1440 and 1920: no horizontal overflow, one H1, one animated rule in the header, no video-control element, no line/headline intersection; looping video advances.
- 200% text size at 375 and 1440: no horizontal overflow or line/headline intersection. Content grows vertically without truncation.
- Reduced motion at 375 x 812: poster only, zero video sources, video paused, straight rule.
- Lighthouse 13.6.0, final build: mobile and desktop 100 / 100 / 100 / 100 (Performance / Accessibility / Best Practices / SEO).
- Inspected final desktop/mobile screenshots: `media-masters/renders/hero-review/desktop-mobile.png`. Check data and Lighthouse JSON reports are in that ignored review folder.

**Remaining**
- Removing the on-page stop control is the explicitly requested WCAG 2.2.2 deviation recorded in the plan; Lighthouse's score is not a full conformance assessment. Contrast over moving footage still needs the previously recorded manual review, especially on compact screens.
- The macro still-life scene is selected, but its full render/encoding/integration is separate future work. Existing production clip files have not changed.
- No downloads, commits, pushes or deployment. Implementation is in the Documents workspace; the Desktop source was not overwritten.

### 2026-11-20 — Sky-filled lettering and full website review PDF

**User direction**
- Parth clarified that the airy blue/white motion should be inside the letters. Sky is the first palette; pink/white is a later option. The Jobs ownership theme is the reason for this statement section.
- He then prioritized a PDF of every site page and section, with motion represented through pictures, for a separate design conversation.

**Current local implementation**
- Added `cloud-text.js`: a procedural sky/cloud field is clipped through the outcome statement's letter mask. HTML copy remains intact; reduced motion, Save-Data and unavailable WebGL retain solid text.
- Corrected the first implementation's mask bug: applying separate destination-in passes erased the fill. A combined mask now preserves all three lines. Browser captures confirm that the filled texture changes between frames.
- Added `data-clip-end="0.88"` to the leaf scene. Its scroll controller holds the visible leaf before the encoded white ending, then the scene scrolls away normally. At 90% and 100% scroll progress the clip holds at about 4.38 seconds.
- `npm test` passes, including the NDA scan, HTML validation and all 24 approved copy lines. No final visual approval or new Lighthouse result is implied by this entry.

**Review deliverable**
- `output/pdf/therefore-tech-website-visual-review.pdf`: 78 pages, approximately 7.3 MB.
- Captured all 10 HTML routes in the current build, 45 overlapping desktop page views, 11 complete homepage section/process/footer compositions, 24 motion states and 6 compact-width states.
- Includes an index, bookmarks, design context, a clearly labelled earlier defect screenshot, and searchable rendered page copy. Animation is represented by ordered still sequences, not continuous playback.
- Capture manifest, full-page archives, screenshots, authoring scripts and PDF layout renders are under `tmp/pdfs/site-review/` (local review working files).
- Rendered every PDF page, inspected the page contact sheets and key full-size pages, checked text boundaries, and scanned extracted PDF text against the private blocklist without exposing terms.
- No upload to an external assistant, commit, push or deployment was performed.

### 2026-11-20: Stance section rebuilt as one scroll sequence (ready for approval)
Parth's brief: rebuild homepage section 2 as one pinned, scroll-scrubbed sequence of about 150vh. Keep the leaf render and the sky-and-cloud fill, and fix both. Show the section before touching anything else.

**Workspace**
Codex's work (cloud fill, leaf hold, hero comma, style studies) was only in `~/Documents/ChatGPT/Therefore Tech`. With Parth's OK, it was copied into this git checkout first. That copy was a strict superset of this one, so nothing was lost.

**Copy**
- New H2, written by Parth in the brief: "We're not consultants. We're builders." Added to `home.json` (`transition1.heading`) and `approved-copy.json`, with a note.
- The approved stance line is unchanged. It still appears verbatim in the HTML: "Consultants hand you a report." is a paragraph, and "We own the outcome with you." is a `<strong>` in a paragraph.

**The sequence**
- Layout: section height 150vh with a sticky stage. Progress starts 0.35 of a viewport before the pin.
- Lines 1–2 of the brief: the H2 starts large (`--text-display`), solid ink, top third. "Consultants hand you a report." sits below it, smaller and solid.
- Line 3: one organic line draws in from the left edge, under the text. It is copper wire thickening into a bark stem, then a green stalk. It has a soft shadow and shallow focus, and no corners or straight runs.
- Line 4: the leaf grows out of the tip from a bud (no pop-in). Stem and leaf are one form.
- Line 5: as the leaf opens, the report line blurs to 8 px and fades to 15%. The H2 settles small (`--text-title-3`). "We own the outcome with you." rises in at the largest size in the section (up to 9.5rem; capped by viewport height on short windows).
- Line 6: the end state holds. The clip's last frame keeps the leaf; there is no fade-out.
- Placement: on desktop, text is in columns 1–7, the leaf in columns 8–12, and the stem runs below the text. On mobile, text is on top and the leaf below.
- Fallbacks: reduced motion, Save-Data and no JS give no pin; they show the end state over the poster (the final frame) with solid text.

**The render (`scripts/render/scenes/stance.js`, built on the approved macro study)**
- Look: warm raking key from back-left, cool fill, fog to white, paper tooth.
- Optics: 64 accumulated samples per frame, with depth of field that follows the growing tip and settles on the leaf.
- Leaf: about 9,000 vertices (it was about 1,600), so the outline no longer shows facets.
- Encoding: 5 s at 24 fps, keyframe every 6 frames (20 keyframes).

  | Variant | MP4 | WebM |
  |---|---|---|
  | Desktop | 193 KB | 155 KB |
  | Mobile | 109 KB | 96 KB |

  | Poster | AVIF | WebP | JPEG |
  |---|---|---|---|
  | Desktop | 6.1 KB | 10.2 KB | 27.1 KB |
  | Mobile | 3.4 KB | 5.3 KB | 14.3 KB |

- `encode-video.sh`: rendered scenes now use constant-quality VP9 (`-b:v 0 -crf 36`). The bitrate-targeted two-pass encode had produced a 765 KB WebM.

**Cloud fill bug fixed (`cloud-text.js`)**
- Cause: after masking, the code ran `strokeText` with a 0.45 px outline. That traced every glyph contour, including the overlaps inside W, E, H and T.
- Fix: the outline is removed. The mask is fill-only text (nonzero winding, so overlaps merge into one solid shape), rasterised once per resize.
- Contrast: cloud tones are remapped between the deep sky `#1b44b0` (8.4:1 on white) and the lightest cloud `#6489e6` (3.35:1, AA for large text). 99.9% of letter-interior pixels measure ≥ 3.48:1. The drift is slower.

**Checks** (`scripts/render/check-stance.mjs`, headless Chrome, 8 scroll steps; it hides the text and counts clip pixels inside the text boxes)
- Crossing: 0 pixels at every step at 1280×720, 1366×768, 1440×900, 1920×1080, 768×1024 and 375×812. An earlier version crossed during the cross-fade; this was fixed by timing the heading shrink earlier, shortening the rise, and capping type on short windows.
- Blank share (64 px tiles with no ink): the end state is 0.55 at 1440, 0.59 at 1280, 0.63 at 1920 and 0.62 on phone. Mid-sequence peaks reach 0.74–0.86 at the hand-off between the two lines. **This misses the brief's "no viewport more than ~50% blank"**, flagged for Parth.
- `npm test` passes. Lighthouse home: mobile 100 ×5 (LCP 0.9 s, TBT 20 ms), desktop 100 ×5.
- Review files: `docs/review/stance-desktop.mp4`, `stance-mobile.mp4`, and the two `-frames.png` sheets.

**Open**
- Blank share above ~50%: needs a design call (bigger leaf, tighter section, or more content in the frame).
- The old `src/media/scenes/transition-1/` clip is no longer referenced. Remove it once this is approved.
- Nothing else on the site was changed, per the brief. Nothing is committed.

**Approved (2026-11-20).** Parth approved the stance section as built: "the leaf size can be the same, but yeah, I like it." The leaf stays at its current size, and the blank-share overshoot (55–66% in the end state) is accepted. Next per the plan: How we work (a branch opens, a small flock lifts off) and Frontier (growing rings or a seed form, seamless loop), in the same macro look.

**Follow-up (2026-11-20).** Parth asked for "Consultants hand you a report." to disappear while blurring, instead of staying as a ghost.
- Change: it now blurs to 10 px as it fades to 0 opacity, then becomes hidden. Its space then closes, so the outcome line rises into its place and leaves no gap.
- Static fallbacks (reduced motion, Save-Data, no JS) are unchanged: all three lines stay visible.
- Re-checked at six viewports: 0 clip pixels cross visible text. End-state blank share is 0.58 at 1440 and 0.64 on phone.
- Recordings and frame sheets in `docs/review/` updated.

## 2026-11-21: Section 3 "What we do" redesign (test, awaiting Parth's review)

**Brief.** Make section 3 the second big warm moment after the hero. Two parts:
- **Scene:** a rendered, scroll-driven scene. On the left, a tangled garden path clears and warms. On the right, the same path opens into a wildflower field at sunrise.
- **Text:** fix the uneven two-column layout.

Process: render a test, show frames plus the static layout, then integrate.

**Scene (`scripts/render/scenes/what-we-do.js`, offline Three.js, same pipeline as the leaf)**
- **Content:**
  - About 85k instanced grass blades and about 17k flower-head clusters, coloured from the hero palette: field gold, straw, soft sage, a few dusty-rose and cream heads.
  - A worn dirt path on a painted ground texture.
- **Clearing:** 12 knotted roots and 11 arching briars cross the near path. As the clip plays they draw back: their tube geometry retracts and sinks. Over the same span, the grass on the path settles flat and outwards.
- **Light:** low sun at 4.5° rising to 10.5°; colour shifts from cool rose to warm gold, intensity 0.7 → 3.2.
- **Atmosphere:** sky dome in dusty rose with a soft sun glow and no hard disc; warm exponential haze; backlit translucency on the grass.
- **Lens:** accumulation DoF focused on the near path, film grain, a slow breeze sway.
- Composition: the tangle sits in the lower left, under column 01. The path runs right into the open field, under column 02.
- The edge matte is off in the render. The soft edges come from a CSS mask on the page instead.
- Fixed during testing:
  - Camera inside a wall of grass.
  - Path invisible.
  - Heavy fog.
  - A seam at the horizon: the sky shader wrote display colours while the fog is linear. Now matched.
- Frames: 120 at 24 fps, 1920×1080 and 1080×1350. **Test quality: 16 samples.** The final pass will use 48–64.

**Layout (`src/index.njk`, `home.css`)**
- **Columns:**
  - Two articles on a 12-col grid, columns 1–6 and 7–12 (1–4 / 5–8 on the 8-col tablet grid).
  - The articles share `grid-template-rows: subgrid`, so label, heading, body and link each align across both columns.
- **Type:**
  - Labels 01 / 02 in the label style.
  - Headings always break as TRANSFORM / WHAT EXISTS and DISCOVER / WHAT'S NEXT. Each word group is a block span that cannot wrap. Roboto Condensed 800 uppercase at `--text-title-1`.
  - Body measure is 30ch of Newsreader, about 38 characters a line. Both bodies run to 3 lines at 1920, 1440, 1024, 768 and 375 (measured).
  - Links share a baseline at every desktop and tablet width.
- **Scene band:** full-bleed below the columns on desktop (height `clamp(22rem, 40vw, 48rem)`). On mobile, the DOM order is 01, scene (4:5), 02. A mask fades all four edges into white. Text sits on white, so no scrim is needed and contrast is unchanged.
- **Copy:** panel 02's body is now Parth's wording, "Find the next product, market or revenue stream. Then we build it and bring it to life."
- **Scroll:** a new `data-flow` mode in `clipScene` sets progress from the element's passage through the viewport, with no pinning. The clip plays over 0.2–0.6 of that passage.
- **Fallbacks:** reduced motion, Save-Data and no JS show the poster (1.25 s: tangle and field both visible). Verified with reduced motion: video time stays at 0.

**Checks**
- `npm test` passes. No horizontal overflow at any checked width.
- New check script: `scripts/render/check-wwd.mjs`.
- Fixed a renderer gotcha: the `--out` path resolves from the repo root, not from the current directory. A misplaced render was moved back into `media-masters/renders/`.

**Open**
- Clip weight: desktop 1.1 MB (MP4) / 1.6 MB (WebM), mobile 0.8 / 1.2 MB, even at CRF 31 / 46. Full-frame grass and grain resist compression. For the final pass: less grain in the render, a longer GOP, or a 1600 px desktop width. Lighthouse is not yet run with this section.
- Review files in `docs/review/`:
  - `what-we-do-desktop-frames.png`, `what-we-do-mobile-frames.png`
  - `what-we-do-layout-desktop.png`, `what-we-do-layout-mobile.png`
  - `what-we-do-reduced-motion.png`
- Nothing committed.

**Approved and finished (2026-11-21).** Parth approved the test look: "Approve, finish it".
- **Final render:** 48 samples per frame, desktop and mobile. Grain reduced from 0.028 to 0.016; it stays fine, and the clips compress far better.
- **Encode:**
  - `encode-video.sh` gained `GOP_OVERRIDE` and `DESKTOP_W`.
  - This scene uses `GOP_OVERRIDE=12 DESKTOP_W=1600 CRF_264=31 CRF_VP9=46`, with the poster at 1.25 s.
  - Keyframe every 0.5 s. Scrubbing stays smooth in the headless check.
  - Sizes:

    | File | Size |
    |---|---|
    | desktop.mp4 / .webm | 474 KB / 356 KB |
    | mobile.mp4 / .webm | 492 KB / 408 KB |
    | poster.avif / .webp / .jpg | 24 / 45 / 108 KB |
    | poster-mobile.avif / .webp / .jpg | 18 / 29 / 65 KB |

    That is down from 1.1–1.6 MB in the test.
- **Checks** (`check-wwd.mjs`):
  - At 1920, 1440, 1280, 1024, 768 and 375, both bodies run to 3 lines and the links share a baseline. No horizontal overflow.
  - Video time advances with scroll.
  - Reduced motion holds the poster (video time 0).
- **Tests:** `npm test` passes.
- **Lighthouse home**, 3 runs each, every category scoring 100:

  | | Scores | LCP | TBT | CLS |
  |---|---|---|---|---|
  | Mobile | 100 ×3 | 0.9–1.1 s | 0–50 ms | 0 |
  | Desktop | 100 ×3 | 0.2–0.3 s | 0 ms | 0 |
- Review files in `docs/review/` are updated, and `what-we-do-desktop.mp4` (the master) is added.
- Nothing committed. Section 3 copy status stays "draft" (the label still shows the Draft tag) until Parth approves the copy lines.

## 2026-11-21: Stance section back to the first leaf (Parth's request)

**Feedback**
- Parth: "the leaf, I liked the leaf before… bring back the old leaf and the shadow."
- From a side-by-side sheet (`docs/review/leaf-options.png`) he picked **A**, the original Transition 1 clip. It has the trace, the dark stem, the leaf and the soft cast shadow.

**Changes**
- `src/index.njk`: the stance section now plays `/media/scenes/transition-1/` (the files are unchanged from 2026-11-20). It keeps all of the approved text sequence: the heading shrinks, the report line blurs out, and the outcome line rises.
- `scroll-scene.js`: new `data-clip-end` attribute, the fraction of the clip's duration where the scrub stops. Clip A fades to white over its last 10%, so stance uses `data-clip-end="0.88"`. The leaf and its shadow hold on screen at the end.
- `home.css`: on screens ≥768 px, clip A sits in the lower 69% of the stage, aligned right. Its trace enters mid-left, and without this it ran under "WITH YOU." at 1920×1080.

**Checks**
- 0 pixels of the clip cross the text at every step, at 1920×1080, 1440×900, 1366×768, 1280×720, 768×1024 and 375×812.
- Reduced motion shows the poster, with the leaf.
- `npm test` passes.

**Notes**
- The stance clip files (`src/media/scenes/stance/`) are now unreferenced but kept, in case Parth wants to compare.
- Parth also said the section 3 "What we do" render is "very useless". It stays in place until he says what he wants instead.
- Nothing committed.

**Follow-up (2026-11-21, later).** Three changes from Parth's feedback.

**1. Leaf placement.** "Why this leaf is at the very corner… I loved the previous positioning."
- The right-aligned, lowered placement is removed. The clip is back in its original centred, bottom-aligned position.

**2. Leaf size.** "Make the plant a bit bigger."
- The clip is scaled 1.2× about a point near the shadow (65% 92%), so the shadow stays in frame. On screens 1600 px and wider, it also sits 3% lower.
- On desktop, a mask fades the faint far end of the trace (the left 22–44% of the frame) under the text column. With that, the bigger plant doesn't cross the outcome line.

**3. Cloud fill.** "Is that white cloud moving… I can't see it."
- It was barely moving: soft, large shapes at about 16 px/s.
- The clouds are now smaller (field scale 2.6, was 1.55) and drift about 3× faster.
- Measured: about 19% of the letter pixels change within 2 s.
- Contrast is unchanged: tones are still remapped between `--cloud-sky` (8.4:1) and `--cloud-light` (3.35:1).
- While editing, I briefly broke the fill: a stray `//` comment disabled two uniforms. Caught and fixed.

**Checks**
- End state: 0 crossing pixels at 2560, 1920, 1680, 1440, 1366, 1280, 1000, 768 and 375 wide.
- Mid-transition (p = 0.7): a few hundred to about 1,400 pixels of the blurred trace sit under the outcome line while it is still fading in (partial opacity) at 1920, 1680, 1440, 1366, 1280 and 1000 wide. The line is still settling into place at that moment; at rest, nothing crosses. Flagged for review.
- `npm test` passes.

**Other**
- `scripts/serve.mjs` now answers 503 during a rebuild instead of crashing.
- Nothing committed.

**Leaf focus (2026-11-21).** Parth: the leaf looked blurred; at "we own the outcome with you" the focus should be on the leaf, not the stem.
- **Cause:** the clip already racked focus to the leaf, but its wide aperture (0.07) left the leaf's edges soft. The page's 1.2× scale then softened it further.
- **`transition-1.js`:** the aperture now stops down to 45% as focus lands on the leaf (over the 60–84% span of the clip). The leaf is crisp, with veins visible; the trace and lower stem stay soft.
- **`render.mjs`:** new `--scale k` option. Desktop and mobile are re-rendered at 1.2× (2304×1296 and 1296×1620) with 64 samples, so the on-page scale no longer upscales.
- **`encode-video.sh`:** new `MOBILE_W` override. Encoded with `DESKTOP_W=2304 MOBILE_W=1296`, poster at 4.35 s.
- **Sizes:**

  | Clip | MP4 | WebM |
  |---|---|---|
  | Desktop | 204 KB | 269 KB |
  | Mobile | 151 KB | 193 KB |

- **Checks:** 0 crossing pixels in the end state at 1920, 1440, 1366, 1280, 1000, 768 and 375 wide. The known mid-transition graze while the outcome line fades in remains: about 1,500 pixels at 1920. `npm test` passes. Nothing committed.

**"How we work" stick-figure story (2026-11-21).** Section B of Parth's two-section brief, built first for review before section A. Parth: "the stick figure should move in a very human manner"; later: make the magnifying glass bigger and keep the heads in place.
- **New file `src/assets/js/steps-story.js`:** 24.5 KB raw, 8.4 KB gzipped (budget 30 KB). It builds one `aria-hidden` SVG laid over `.steps` and reads the four rules' real positions. The four scenes follow the brief: conversation, audit with magnifier, proposal read and nodded, and building the blocks together, with the founder placing the final roof. Then a pause and the loop repeats, about 34 s on desktop and 37 s on mobile.
- **Motion:**
  - The figures use a jointed skeleton (thighs, shins, upper arms, forearms).
  - A crouch before every jump, a squash on landing, arms thrown up on take-off, knees tucked at the peak, legs reaching forward to land.
  - A relaxed stance with feet apart and a slow weight shift.
  - A soft supporting knee when walking, and a little flight between running strides.
  - A light "line boil" gives the hand-drawn feel.
- **Layout:**
  - Desktop: the figure runs and jumps sideways between rules.
  - Tablet (2×2) and mobile: it hops off the end of a rule into the gutter and drops to the next rule, so it never crosses the step text.
  - The founder ducks behind the rule using a clip.
- **Behaviour:**
  - Runs only while the section is on screen and pauses when the tab is hidden.
  - Reduced motion shows one still per rule.
- **Fixes during review:**
  - Figures floated about 20 px off the rules because they were measured while the reveal transform was active. Fixed by switching to `offset*`.
  - The opening placed our figure on rule 4. Fixed.
  - Heads sat beside the neck, reading as "head down", because the browser resolved the head's single arc around the wrong centre. Heads are now drawn as two exact half-arcs.
  - The magnifier is about 1.7× larger.
  - The speech dashes moved further from the mouth.
- **Magnifier, round 2:** Parth loved the story and asked for a magnifier that looks like an app's search icon. It is now a clean round lens with a short handle drawn at twice the line weight, angled down at the ground and held in the hand. Changed in both the animation and the reduced-motion still. The script is now 25.2 KB.
- **Scene 3 handshake (Parth, 2026-11-21):** "we gave the documents, he reads it, and then we shake the hand, and then we move on".
  - After reading and nodding, the founder lowers the proposal to his side.
  - Both walk in and shake hands: three firm pumps, each with a small nod. Then they let go, and the founder hops down with the paper.
  - The handshake distance is computed from the skeleton, so the hands meet exactly at every screen size.
  - The reduced-motion still for rule 3 is now the handshake.
  - The loop is now about 36 s on desktop and 39 s on mobile. The script is 27.1 KB raw (budget 30 KB).
- **Review recordings:** `docs/review/steps-story-desktop.mp4` (1440×900) and `docs/review/steps-story-mobile.mp4` (375×812). Made with `scripts/render/record-story.mjs`, which captures frame-exact at 24 fps.
- `npm test` passes. Nothing committed. Section A ("What we do" ink drawings) is waiting for Parth's review of this.

**Section 3 "What we do": ink drawings replace the field render (2026-11-21).** This is section A of Parth's brief, started after he approved the stick figures.
- **Removed:** the field video, its poster and the feathered full-bleed box (markup and CSS).
  - The clip's media is moved, not deleted, to `media-masters/retired/what-we-do-scene/`.
- **New file `src/assets/js/wwd-art.js`:** 12.9 KB, no video. It draws a small SVG under each column's link, aligned to the column, in the same pen as the stick figures:
  - the same bowed strokes and closed loops
  - the same 1.7 px line (1.5 on mobile)
  - the same "boil" filter
- **Size:** 440 × 253 px on desktop and about 343 × 197 on mobile.
  - It sits in a fifth subgrid row, so the two drawings align with each other.
  - Nothing crosses the text: each drawing starts below its link.
- **01 Transform:**
  - A stream seen from above, with a jam of seven sticks and four stones and a thin dotted trickle past it.
  - On scroll, the sticks drift downstream one by one and come to rest on the banks. The stones settle at the edges.
  - The pooled water speeds up, and four flowing lines fill the channel as the trickle fades.
- **02 Discover:**
  - A footpath draws itself from the near bottom, winding into the distance.
  - The far stretch turns to dots and fades toward the horizon.
  - A low sun appears where the path is heading. This is the one field-gold accent, new token `--color-field-gold: #B98A2C`.
  - Optional touch: our stick figure stands tiny where the drawn path ends, hand shading his eyes.
- **Behaviour:**
  - Each drawing follows its own scroll progress, smoothed, and runs only while on screen.
  - Reduced motion shows the finished drawings, still, without the boil.
  - `aria-hidden`. Hidden without JavaScript.
- **Review:** `docs/review/wwd-ink-desktop.png` and `wwd-ink-mobile.png` show start, middle and end. Made with the new `scripts/render/record-wwd.mjs`.
- `npm test` passes. Nothing committed. The "Draft" tag on "What we do" stays until Parth approves.

**"What we do": ink and watercolour, with colour (2026-11-21).** Parth wanted colour, a style of its own rather than the stick-figure pen, and the stick man used only once.
- **Choosing a style:** I mocked up three colour styles (`docs/review/wwd-style-options.png`): risograph, ink and watercolour, and paper cut-out. I recommended risograph. Parth chose B, ink and watercolour, from its pathway. He asked that the path connect all the way and the sun rise.
- **`wwd-art.js` rewritten:** 14.9 KB. Soft watercolour washes with ragged, bleeding edges sit under a fine, steady ink line. There is no "boil", so the drawings stay distinct from the stick figures.
  - **Palette:** wheat gold and dusk pink taken from the hero field, plus a dusk blue and a sage. The whole painting fades softly into the white page.
- **01 Transform:**
  - Sage banks, a blue stream, and a deeper channel that is pooled above the jam and only a thin trickle below it.
  - On scroll, the sticks (bark-brown ink) and stones (grey wash) slide away one by one.
  - The trickle widens smoothly into the full channel, and white flow strokes move faster once the water is free.
- **02 Discover:**
  - A wheat field with low sage hills and meadows.
  - The path paints itself unbroken from the near ground to the horizon.
  - The sun rises from behind the horizon exactly where the path leads, with a dusk-pink glow that grows as it rises.
- **Removed:** the stick man.
- **Behaviour:** reduced motion shows the finished paintings, still.
- **Review:** `docs/review/wwd-watercolour-desktop.png` and `wwd-watercolour-mobile.png`, which also includes a reduced-motion still.
- **Discover follow-up (Parth):** he didn't like the small three-stroke grass tufts along the path, and wanted the colours of mock-up B.
  - Removed the tufts and the gold wheat dashes.
  - Repainted to match mock-up B: a pale wheat field, soft sage hills across the lower half, a white path with a fine ink edge, and a small gold sun in a dusk-pink halo. The horizon line, hills on the horizon and sky glow are dropped.
  - The ground is now opaque, so the sun stays hidden until it rises over the horizon.
  - The script is 13.3 KB.
- **Tooling:** the shell is now on Node 20, so the capture scripts need `node --experimental-websocket`, and `html-validate` needs Node 22 or later. I ran `npm test` with `/usr/local/bin` (Node 25) first on the PATH. Worth pinning in `.nvmrc`.
- `npm test` passes. Nothing committed. The "Draft" tag stays until approval.
- **Discover, final colours (Parth, 2026-11-21):** he asked for the pink and green from the mock-up sheet he shared (the top, risograph-coloured path), and said Transform is good as it is.
  - Repainted in watercolour: green hills sitting on the horizon, a golden field, and one green ridge rolling across the lower half.
  - A pink path with a gold edge paints itself unbroken to the horizon.
  - The sun is a gold disc in a pink ring and rises from behind the field.
  - A fine paper grain covers the land, like the hero's film grain. The opaque ground sits outside the grain, so the sun never shows through it before rising.
  - Reduced motion shows the finished painting. Review sheets updated.
  - `npm test` passes (Node 25 from `/usr/local/bin`). Nothing committed.
- **Discover, exactly mock-up B (Parth, 2026-11-21):** "it changed the pathway to pink. I want it to exactly look like this", then "Make it white, I would say, pathway."
  - Rebuilt from mock-up B's own shapes, colours and wash filter: a pale wheat field (#E3C77A at 55%), sage hills (#C9D3B3), a white path with an ink edge, and a gold sun in a dusk-pink halo.
  - Only the two changes he asked for earlier: the path runs unbroken to the horizon, and the sun rises from behind the field.
  - The grain and the pink path are removed. Review sheets updated.
  - `npm test` passes. Nothing committed.
- **Discover mountains (Parth, 2026-11-21):** "add that pink mountain and the green mountain behind it", as in mock-up C.
  - Added a pink mountain (#E6BAB4) on the horizon with a green one (#B9C9A0) rising behind it. Both are opaque watercolour, so the sun rises from behind them into the dip between.
  - Horizon lowered from y 70 to y 86 and the fade at the top eased, so the mountain tops show.
  - Everything else stays as mock-up B. `npm test` passes. Nothing committed.
- **Discover, exactly mock-up C (Parth, 2026-11-21):** "I want it exactly like this", with a screenshot of the paper cut-out mock-up.
  - Rebuilt from mock-up C's own shapes, colours and soft drop shadows: a gold sun behind a light green mountain and a pink ridge, a darker green hill, a golden field and a white path.
  - The last frame matches his picture. On scroll, the path paints itself in and the sun rises into place.
  - Transform stays in watercolour.
  - Reduced motion shows the finished picture. `npm test` passes. Nothing committed.

### 2026-11-21 — Section A "What we do" approved
- Parth approved section A (Transform watercolour stream, Discover paper cut-out path with rising sun) and asked to remove the Draft tag.
- `home.json` whatWeDo status → `approved`; the heading's Draft tag now renders only while that status is `draft`.
- Locked the section's copy in `scripts/approved-copy.json`: label, both panel bodies and both link labels (25 → 30 lines).
- `npm test` passes: copy-lint OK, html-validate clean, check-copy OK (30 lines). Nothing committed.

### 2026-11-21 — "What we do": pinned scroll sequence
- Parth: the drawings sat left with the right side blank, and both played at once. Wanted the river to unblock on scroll first, then the path to draw.
- Drawings now fill their column (no fixed 27.5rem cap).
- Wide screens (≥768px): wwd-art.js pins the section (`.wwd-pin.is-pinned`, 280vh track, sticky stage). First ~46% of the scroll clears the river; the rest draws the path and raises the sun. If the section is taller than the window, the paintings shrink to fit (`--wwd-art-max`); below 150px high it stays unpinned.
- Phones: columns stack and each painting runs as it scrolls up the screen. No-JS and reduced motion: no pin, finished pictures.
- Review frames: docs/review/wwd-pinned-desktop.png, docs/review/wwd-pinned-mobile.png. Tests pass. Nothing committed.
- Discover: thin gold sun rays (paper wedges) open, turn slightly and brighten as the sun rises; reduced motion shows them finished. Close-up: docs/review/wwd-sun-rays.png. Tests pass.
- Discover, per Parth: the path now runs all the way up the pink ridge to the sun (a smooth curve past the old end, thinning to a point under the sun). The rays are redrawn by hand: 16 needle-sharp spikes, uneven in length and spacing, slightly bowed, with a light wobble filter. Close-up: docs/review/wwd-sun-rays.png. Tests pass.

### 2026-11-21 — Flowing colour in "How we work" and "Built for a moving frontier"
- Parth asked for the frontier line (and then "How we work") to get a moving fill like the cloud text in the stance line, in pink, white and purple.
- cloud-text.js now handles any number of `[data-cloud-text]` headings. New `fluid` mode: a slow double domain-warped liquid (violet, pink, thin pale streaks). Words are wrapped in `.cloud-text__word` so the heading wraps naturally; the real text stays in the HTML and turns transparent only when the canvas is ready.
- Colours in tokens.css (`--fluid-*`), lightened at Parth's request: darkest #8a5fd0 (4.5:1 on white), violet #b07bd6, pink #e08bbe, pale #fbe6f2 (streaks only).
- Reduced motion, Save-Data or no WebGL: solid ink text, as before. Review: docs/review/fluid-text-desktop.png, docs/review/fluid-text-mobile.png. Tests pass. Nothing committed.
- Parth: the two headings should look completely different. Each heading now sets its own palette in CSS (cloud-text.js reads `--fluid-*` from the heading). The frontier line keeps violet and pink; "How we work" flows in a warm sunset: #c4553a (4.5:1), coral #e07a5f, amber #eba046, pale #fce3c4 streaks.
- Hero: Parth saw a thin white line at the edges. Headless checks at 1440×900, 1000×740, 1920×1080 and 390×844 showed the video already covering the hero; the strip in his screenshot matched the browser pane's letterbox around a test viewport size. Gave `.hero__media` 4px of bleed anyway so rounding can never expose an edge.
- Parth disliked the orange "How we work" and asked for options other than the flowing fill. Seven treatments mocked on a dev page (_site/dev-how-options.html, build output only): aurora, watercolour, dawn sky with birds, riso print, iridescent foil, paper cut-out, ink outline with rising water. Sheet: docs/review/how-we-work-options.png. Awaiting his pick; the site still shows the sunset fill until then.
- Tree in the "How we work" transition: stray dots before the tree grew were zero-length strokes with round caps. Strokes now stay hidden until they start drawing, and each branch starts only when its parent reaches the fork (no floating stubs). Checked headless at 2%, 8% and 15% of the scene: no dots. Tests pass.
- Parth passed on all the tree storyboards (blossom/birds/steps, night to dawn, roots); the tree stays as it is. "How we work" now uses option 3: new `sky` mode in cloud-text.js, a dawn gradient (#4a63b8 → #8d7fd6 → #dd9cc0) with soft pale cloud drifting and 16 small ink birds flying through the letters. Images: docs/review/how-we-work-sky.png, docs/review/how-we-work-scene.png. Tests pass. Nothing committed.
- "How we work": birds inside the letters removed at Parth's request (sky and cloud kept; the flock from the tree is unchanged).
- "How we work" fold (Parth): after the tree and flock finish, the drawing folds up and fades, the heading glides to the top of the screen, and the four steps rise in underneath it while the stage is still pinned; scrolling back up unfolds the tree again. scroll-scene.js `data-fold` (scrub scenes): measures the heading, pulls the next section up into the pinned stage by the right amount and lengthens the scene to match; the drawing's own timeline runs before the fold. Reduced motion / no JS: unchanged (no pinning). Frames: docs/review/how-we-work-fold-desktop.png, docs/review/how-we-work-fold-mobile.png. Tests pass. Nothing committed.
