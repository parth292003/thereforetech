# Therefore Tech — Progress Log

Living context file. Update after every phase. Read this and `docs/PLAN.md` at the start of every session and before every phase.

## Current status

- **Phase:** 1 (Foundations) — **complete** on local branch `rebuild` (not committed or pushed yet).
- **Next step:** Parth reviews Phase 1, commits/pushes `rebuild`, adds the `NDA_BLOCKLIST` secret. Then Phase 2 (content model).
- **Live site:** coming-soon page, unchanged.
- **Launch blockers outstanding:** see PLAN §8.1 (founder note, bio/LinkedIn/wordmark, email + Cal.com link, DRAFT approvals, NDA sign-off).

## Environment facts

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
