# Therefore Tech — Master Plan

Status: **APPROVED 2026-11-19, with changes** (NDA removal, engagement models, article roadmap, Apple design skill, answers to Q1–Q9).
Owner: Parth Paliwal. Domain: https://www.thereforetech.com (GitHub Pages, repo `parth292003/thereforetech`).

Read this file and `docs/PROGRESS.md` at the start of every session and before every phase.

---

## 0. Ground rules (apply to every phase)

1. Always write **Therefore Tech** in full. Never "Therefore" alone, never "Theirfor".
2. Never use the word "consultancy". Our stance: consultants hand you a report, we own the outcome with you.
3. No AI buzzwords on main pages ("cutting-edge", "AI-powered", RAG, agents, LLM, etc.). Technical depth only on `/work/*` case-study pages.
4. Use the supplied copy as written. Any new copy (inner pages, articles, meta descriptions, engagement models) is drafted, marked `DRAFT`, and approved by Parth before launch.
5. Never invent clients, metrics, logos, testimonials or claims. Every factual claim on the site is logged in the **Claims register** (§9) with its source.
6. **NDA.** One past engagement is under NDA and is excluded from the site entirely: no page, no description, no team size, no detail that could identify the client. This applies to everything in this **public** repo, including docs, code comments, commit messages, alt text and metadata. This plan deliberately does not describe the engagement. Never name any person or company Parth has worked with.
7. Ask before changing brand, copy or structure.
8. Small, verifiable increments. A phase is done only when its acceptance criteria pass and `PROGRESS.md` is updated.

These rules are enforced by an automated **copy lint** (Phase 1): a build step that fails on `Theirfor`, `consultancy`, `Therefore` not followed by ` Tech`, the buzzword list on non-case-study pages, and an **NDA blocklist** (terms tied to the excluded engagement). The blocklist is never committed: locally it lives in a git-ignored `.nda-blocklist`, and in CI it comes from the GitHub Actions secret `NDA_BLOCKLIST`. Its contents are agreed with Parth outside the repo.

---

## 1. What exists today (audit, 2026-11-19)

| Item | Finding | Implication |
|---|---|---|
| Repo | `thereforetech`: single `index.html` coming-soon page, `bg.mp4`, `poster.jpg`, `CNAME`, `README.md`. 11 commits. | Clean slate for the new build. |
| Hosting | GitHub Pages, **legacy build from `gh-pages` branch** (identical to `main`). Custom domain `www.thereforetech.com`, cert covers apex + www. **HTTPS not enforced.** | Move to an Actions-based deploy at launch; enforce HTTPS. |
| Hero video | `bg.mp4`: H.264, 2050×1080, 23.976 fps, 19.1 s loop, no audio, **8.8 MB** (3.7 Mbps). Soft-focus field of yellow wildflowers under a pink-haze sky. | Keep the footage. Must re-encode into mobile/desktop renditions + WebM to hit Lighthouse 95 on mobile. |
| Poster | `poster.jpg`, 1920×1012, 83 KB. | Convert to AVIF/WebP, size for LCP. |
| Look and feel | Roboto Condensed, uppercase, black ink on warm gold, thin horizontal rules that draw in, line-mask text reveals, film grain, slow Ken Burns. Calm, composed. | This is the feel to keep. The rules and masks become part of the motion vocabulary. |
| Copy | "Building Technology / Faster & Better / Coming Soon / Owned by Parth Paliwal". | Fully replaced by the brief's copy. "Owned by Parth Paliwal" is dropped (Q3). |
| SEO | Title "THEREFORE TECH", one meta description, relative `og:image`, no structured data, no sitemap, empty favicon. | Rebuilt from scratch (§6). |
| Other repo | `parth292003/therefore` is an older copy of the same page. | Ignored. Not touched. |

---

## 2. Architecture

### 2.1 Static generator: **Eleventy (11ty) v3**

| Criterion | Eleventy | Astro (runner-up) | Hugo |
|---|---|---|---|
| Output | Plain HTML, **zero client JS** unless we add it | Zero JS by default | Plain HTML |
| GitHub Pages fit | Build in Actions, upload `_site/` | Same | Same |
| Components | Nunjucks macros + includes (simple, readable) | `.astro` components (nicer typing) | Go templates (awkward) |
| Images | `@11ty/eleventy-img` (AVIF/WebP/srcset) | Built-in | Built-in |
| Dependencies / lock-in | Small, stable, Node-only | Larger framework surface | Single binary, but harder templating |

**Why Eleventy:** the site is content, not an app. Eleventy gives full control over every byte of HTML (the main lever for Lighthouse and SEO), ships no framework runtime, has a small dependency tree that will still build in five years, and its data cascade makes per-page SEO fields (title, description, target phrase, schema) first-class. The only JavaScript on the site is ours: the `ScrollScene` controller, the hero line drawing and the contact form, about 6 KB total, plus the Cloudflare Web Analytics beacon.

### 2.2 Repository layout

```
/
├─ docs/                     PLAN.md, PROGRESS.md, CLIPS.md (video specs), LAUNCH.md (GSC + domain checklist)
├─ src/
│  ├─ _data/                 site.json (name, url, socials), nav.json, seo.json (keyword map), claims.json
│  ├─ _includes/
│  │  ├─ layouts/            base.njk, page.njk, service.njk, case-study.njk, article.njk
│  │  ├─ components/         header, footer, hero, scroll-scene, panel-pair, steps, engagement-models, cta, contact-form, breadcrumb, founder-note
│  │  └─ schema/             organization, person, website, service, article, breadcrumb (JSON-LD partials)
│  ├─ assets/
│  │  ├─ css/                tokens.css, base.css, layout.css, components/*.css  (inlined critical CSS)
│  │  ├─ js/                 scroll-scene.js, hero-line.js, form.js  (ES modules, deferred)
│  │  └─ fonts/              self-hosted WOFF2, subset (Roboto Condensed, Newsreader)
│  ├─ media/                 hero/, scenes/<id>/ (webm, mp4, poster.avif, poster.jpg), og/
│  ├─ index.njk, transform.md, discover.md, how-we-work.md, operational-resilience.md,
│  ├─ work/ (index + one .md per case study), insights/ (index + articles), about.md, contact.md, 404.njk
│  ├─ sitemap.xml.njk, robots.txt.njk
├─ scripts/                  encode-video.sh, copy-lint.js, check-schema.js   (NDA blocklist: git-ignored, see §0)
├─ .github/workflows/        deploy.yml (build → lint → test → deploy Pages)
├─ eleventy.config.js, package.json, lighthouserc.json, CNAME
```

### 2.3 Module boundaries (interfaces)

| Module | Owns | Interface to others |
|---|---|---|
| **Content** | Copy, front matter, `_data/*.json` | Front matter fields: `title`, `description`, `targetPhrase`, `h1`, `schema`, `breadcrumb`, `ogImage`, `updated`, `draft` |
| **Design system** | `tokens.css` (§4A) | CSS custom properties only; no raw hex, px font sizes or durations outside `tokens.css` |
| **Layout** | Grid, typography, components (HTML + CSS) | Nunjucks macros with documented params; no inline styles |
| **Motion** | `hero-line.js`, `scroll-scene.js`, CSS reveal classes | Data attributes only (`data-scene`, `data-mode`, `data-reveal`). Pages work fully with JS off. |
| **Video pipeline** | `scripts/encode-video.sh`, `docs/CLIPS.md`, `src/media/` | Produces, per clip: `{id}-desktop.webm/.mp4`, `{id}-mobile.webm/.mp4`, `{id}-poster.avif/.jpg` |
| **SEO** | Head tags, JSON-LD partials, sitemap, robots, keyword map | Reads Content front matter; fails build if a field is missing |
| **Performance** | Budgets, critical CSS, font subsetting, image pipeline | Lighthouse CI budgets in `lighthouserc.json` |
| **Accessibility** | Semantics, focus, contrast, reduced motion, media controls | axe-core checks in CI |
| **Deployment** | Actions workflow, CNAME, HTTPS | Coming-soon page stays live until launch day |

---

## 3. Pages, structure and keyword map

One target phrase per page. These are **hypotheses** built from the audience and positioning; they get validated against Search Console data after launch (no keyword tool is connected today). Ranking is not guaranteed; the plan builds the conditions for it.

| URL | H1 (working) | Target phrase | Secondary intent | Schema |
|---|---|---|---|---|
| `/` | We rethink how your business works, and build what comes next. | innovation partner for founders | brand: "Therefore Tech" | Organization, WebSite |
| `/transform` | Transform what exists | operations transformation for founder-led companies | remove operational bottlenecks | Service, Breadcrumb |
| `/discover` | Discover what's next | new revenue streams for established companies | new products, new markets | Service, Breadcrumb |
| `/how-we-work` | How we work | founder-led business transformation process | audit → proposal → implement; engagement models | Breadcrumb (+ HowTo-style content, not HowTo markup) |
| `/operational-resilience` | Operational resilience | operational resilience for startups and scale-ups | critical operations, continuity. **A capability page, not a case study.** | Service, Breadcrumb |
| `/work/` | Selected work | AI transformation case studies | | CollectionPage, Breadcrumb |
| `/work/financial-anomaly-detection` **(DRAFT)** | Financial anomaly detection | financial anomaly detection system | framed as founder experience, not a client | Article, Breadcrumb |
| `/work/automated-research-systems` **(DRAFT)** | Automated research systems | automated research system | evidence gathering, synthesis, quality checks, structured reports | Article, Breadcrumb |
| `/about` | About Therefore Tech | Parth Paliwal | founder of Therefore Tech | Person, Organization, Breadcrumb |
| `/insights/` | Insights | business transformation insights for founders | | Blog, Breadcrumb |
| `/insights/why-ai-solutions-go-stale` | Why AI solutions go stale, and how to build ones that adapt | why AI solutions go stale | adaptable AI systems | Article, Breadcrumb |
| `/insights/where-the-time-goes` | Before you automate, find where the time actually goes | how to find operational bottlenecks | operations audit | Article, Breadcrumb |
| `/contact` | Have something ambitious in mind? Let's talk. | contact Therefore Tech | book a founder conversation | ContactPage, Breadcrumb |
| `/404` | Page not found | — (noindex) | | — |

Removed under NDA: one case study (not described here). Removed by decision: `/work/operational-resilience` (operational resilience is a capability, served by `/operational-resilience`).

`/work/` launches with two DRAFT entries. If either is not confirmed before launch, it is held back and `/work/` shows only what is confirmed. A thin `/work/` is better than an unsupported claim.

Internal linking rules: every service page links to `/how-we-work`, one relevant work item (where one exists) and `/contact`. Every work item links back to its service page. Every article links to at least one service page. Footer links every top-level page. Breadcrumbs on all inner pages.

### 3.1 Post-launch article roadmap (topics DRAFT, for approval)

Each topic gets one target phrase and links to one service page. None draws on the NDA engagement.

| # | Working title | Target phrase | Service page |
|---|---|---|---|
| 1 | What an operations audit actually looks at | operations audit for founders | `/transform` |
| 2 | A report or an outcome: what to ask before you bring in outside help | alternative to management consultants | `/how-we-work` |
| 3 | Finding new revenue in a business that already works | how to find new revenue streams | `/discover` |
| 4 | Which operations can your business not afford to lose? | identify critical business operations | `/operational-resilience` |
| 5 | Months, not years: scoping change that actually ships | business transformation timeline | `/how-we-work` |
| 6 | Using AI in your operations without betting on one model | avoid AI vendor lock-in | `/transform` |
| 7 | Test the new product before you build the new product | validate a new product idea | `/discover` |
| 8 | Single points of failure in a growing company | single point of failure in business | `/operational-resilience` |

---

## 4. Homepage composition

Rhythm: **calm → one cinematic moment → calm**. Only the hero and the two transitions use moving footage; everything else is typography, whitespace and small reveals.

| # | Section | Visual treatment | Copy |
|---|---|---|---|
| 1 | Hero | Existing field video, full-bleed. A single thin SVG line that starts tangled and draws itself straight (≈2.4 s, once). Header with wordmark + nav. A small pause/play control for the video (§4A.5). | H1, sub and two CTAs exactly as in the brief. |
| 2 | Transition 1 | `ScrollScene` (scrub): circuit lines growing into branches. Text layered in HTML. | "Consultants hand you a report. We own the outcome with you." |
| 3 | What we do | Two panels on the grid, **Transform** first, then **Discover**. Each links to its page. | Panel titles from brief; one-line descriptions drafted from the brief's definitions (DRAFT). |
| 4 | Philosophy | Large editorial pull-quote, generous whitespace. | "A company's future should not be limited by the way it operates today." |
| 5 | Transition 2 + How we work | `ScrollScene` (scrub): branches opening into a flock/stream, resolving into four numbered steps. | The four steps, as written. |
| 6 | Built for a moving frontier | `ScrollScene` (play on view, loop, with pause control): a form that keeps growing and changing shape. | "AI changes every few months…" as written. |
| 7 | Selected work | Editorial cards, no imagery required: **(a) Founder experience:** "Parth has worked alongside senior technology leaders at global companies." **(b) Operational resilience:** brief's copy, links to `/operational-resilience` (capability). **(c) Financial anomaly detection (DRAFT):** labelled founder experience. **(d) Automated research systems (DRAFT).** | As listed. (c) and (d) hidden at launch unless confirmed. |
| 8 | **Engagement models (DRAFT)** | Three quiet columns (stacked on compact widths). | **Founder Opportunity Sprint**, **Build projects**, **Founder's Innovation Office**. Descriptions drafted for approval; no durations, prices or outcomes published until Parth confirms them. |
| 9 | Founder note | Quiet typographic block, signature line. | **Launch blocker:** Parth's paragraph. The site does not launch with a placeholder. |
| 10 | Contact | Form: name, company, "the problem in one line". Web3Forms. Plus "Book a founder conversation" link to Cal.com. | "Have something ambitious in mind? Let's talk." |

The calm after each cinematic moment is deliberate: sections 3, 4, 7, 8, 9 and 10 have no video at all.

---

## 4A. Design system (tokens)

Phase 1 turns this section into `src/assets/css/tokens.css`. Nothing outside that file uses raw colours, font sizes, spacing or durations.

### 4A.1 Apple design skill: what was adopted

Source: `dickwu/apple-design-skill` (read 2026-11-19: `SKILL.md`, `cross-platform.md`, and HIG pages `accessibility`, `layout`, `typography`, `color`, `motion`, `branding`, `dark-mode`, `writing`). For a website the skill applies Apple's principles and foundations, not iOS/macOS platform conventions (tab bars, menu bars, sheets), so those are out of scope. Where it conflicts with the brand rules, **this plan wins**.

| Area | Adopted from the skill (cited) | How it lands here |
|---|---|---|
| Body size | `accessibility.md`: iOS default 17 pt, minimum 11 pt | Body 17 px on compact widths, 19 px on regular. Nothing below 12 px (uppercase condensed labels need more than the 11 pt floor). |
| Type scale | `typography.md › Specifications`, Large (default): Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25, Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 12/16 | These are the **compact-width anchors** of our scale. Display sizes grow fluidly above them on regular widths (§4A.3). |
| Leading | `typography.md`: loose leading for long passages, avoid tight leading for 3+ lines | Long-form body 1.55; headings 1.05–1.2 only when ≤ 2 lines. |
| Weights | `typography.md`: avoid Ultralight, Thin, Light | Newsreader 400/500/600, Roboto Condensed 400/600/700. No light weights. |
| Typefaces | `typography.md`: minimise typefaces; `branding.md`: custom font for headlines works well | Exactly two families (Q2). |
| Text scaling | `accessibility.md`: allow enlargement to at least 200% | All type in `rem`; layouts tested at 200% browser text size; columns stack instead of truncating. |
| Contrast | `accessibility.md`: 4.5:1 up to 17 pt, 3:1 at 18 pt+ or bold | Every token pair has a computed ratio (§4A.2). |
| Colour meaning | `color.md`: one colour, one meaning; never colour alone | Monochrome: black means ink and action; there is no accent colour. Links are underlined, buttons are filled or outlined, so nothing relies on colour. |
| Accent restraint | `branding.md`: apply accent judiciously; branding defers to content; don't repeat the logo | No accent colour at all (revised 2026-11-19); colour lives in the footage, the content layer. Wordmark once, in the header. |
| Targets | `accessibility.md`: 44×44 pt default, 28×28 minimum; ~12 pt padding around bezelled elements, ~24 pt around unbezelled | All interactive targets ≥ 44×44 px. Buttons ≥ 12 px clear space; text links ≥ 24 px from neighbouring targets on touch. |
| Layout | `layout.md › Size classes`: lay out by available space, not device or orientation; same functionality at every size; respect safe areas | Width-based breakpoints and container queries (§4A.4); `env(safe-area-inset-*)` on fixed elements; no feature hidden on mobile. |
| Motion | `motion.md`: purposeful, brief, cancellable, rare on frequent interactions | One signature moment (hero line). Content never waits for an animation. Hover/focus feedback ≤ 160 ms. |
| Reduced motion | `accessibility.md`: reduce automatic and repetitive animation including zoom and scaling; replace x/y/z transitions with fades; don't animate blur | Reduced motion: posters instead of video, no pinning, no Ken Burns, translate reveals become short fades, no blur animation. |
| Media control | `accessibility.md`: don't autoplay video without controls to stop it | **New:** hero video and the "moving frontier" loop get a labelled pause/play control (also meets WCAG 2.2.2). |
| Writing | `writing.md`: labels say what happens; consistent capitalisation | Sentence case everywhere except Roboto Condensed labels (uppercase by style, real text stays sentence case in HTML). CTA labels name the action. |

**Not adopted, with reasons:**
- **Dark appearance** (`dark-mode.md` asks for both appearances). The white "Ink" palette is a light palette chosen by Parth. Launch is light-only; a dark variant is a later decision (open item O6).
- **System fonts for body** (`branding.md` suggests them). Q2 chose Newsreader for long-form text; brand wins.
- **Liquid Glass / blur materials.** Native-platform material; off-brand and costly on the web.
- **No spacing scale or timing values exist in the skill.** The HIG pages read give principles, not numbers, for spacing and motion duration. The spacing scale (§4A.3) and duration tokens (§4A.5) are **my judgment**, built on the skill's principles and the current page's timings.

**Craft-lens check (from the skill), revised:** the move to white, black condensed type and thin rules sits near another look the skill calls templated ("a broadsheet of hairline rules, zero radius, and dense columns"). What keeps it ours: it is the existing Therefore Tech identity (the coming-soon page), not a default; the layout is generous, not dense; the colour comes from real footage of a living field; and the signature element is the untangling line, which turns the brand's drawn rules into the "technology evolving into nature" theme.

### 4A.2 Colour: "Ink" (monochrome, from 2026-11-19 design review)

Parth replaced Palette A with pure white and black ink, matching the original coming-soon page: no beige, no gold anywhere. Colour on the site now comes only from the footage.

| Token | Hex | Role | Contrast on white |
|---|---|---|---|
| `--color-bg` | `#FFFFFF` | Page surface | — |
| `--color-ink` | `#111111` | Text, rules, buttons, focus | 18.88:1 |
| `--color-ink-muted` | `#5A5A5A` | Secondary text | 6.90:1 |
| `--color-line-soft` | `#D9D9D9` | Hairlines between minor items only (decorative) | 1.41:1 (non-text) |
| `--color-wash` | `#F2F2F2` | Quiet surfaces (draft banner, placeholders) | ink on wash 16.9:1 |

Rules are 1 px black (`--color-ink` at 80%), as on the coming-soon page. Buttons: black fill with white text (primary), or a black outline (secondary). Focus ring: 2 px black outline with a 2 px white gap, visible on white and over footage.

Text over the hero footage: black ink over a white scrim. Measured on the poster frame, the darkest 5% of the H1 area is luminance value 98–110 of 255, which gives black text only ~3.3–3.7:1. Fine for the display H1 (≥ 3:1 large text) but not for the subheading, so a white gradient scrim sits behind the text block (§4A.6).

### 4A.3 Typography and spacing

Families (revised 2026-11-19): **Roboto Condensed, uppercase, is the dominant brand voice**: wordmark, nav, labels, buttons, H1s and section titles, at weights 600–900 like the coming-soon page. **Newsreader is supporting only**: body copy, leads, long-form text and pull-quotes. Self-hosted WOFF2, Latin subset, `font-display: swap`, two preloads max.

| Token | Compact (< 768 px) | Regular / wide (fluid up to) | Family / leading |
|---|---|---|---|
| `--text-display` (hero H1) | 2.5rem (40) | 6.5rem (104) | Roboto Condensed 800, uppercase / 0.95 |
| `--text-title-1` | 2.125rem (34) | 4rem (64) | Roboto Condensed 800, uppercase / 0.98 |
| `--text-title-2` | 1.75rem (28) | 2.75rem (44) | Roboto Condensed 700, uppercase / 1.02 |
| `--text-title-3` | 1.375rem (22) | 1.75rem (28) | Roboto Condensed 700, uppercase / 1.1 |
| `--text-lead` | 1.25rem (20) | 1.5rem (24) | Newsreader 400 / 1.45 |
| `--text-body` | 1.0625rem (17) | 1.1875rem (19) | Newsreader 400 / 1.55 |
| `--text-small` | 0.9375rem (15) | 1rem (16) | Newsreader 400 / 1.5 |
| `--text-label` | 0.8125rem (13) | 0.875rem (14) | Roboto Condensed 600, uppercase / 1.3 |
| `--text-caption` | 0.75rem (12) | 0.8125rem (13) | Roboto Condensed 400 / 1.35 |

Fluid sizes use `clamp()` between the two columns, so there are no jumps between breakpoints. Measure: body text 60–70 characters (`max-inline-size: 66ch`).

Spacing scale (4 px base, judgment): `--space-1` 4, `--space-2` 8, `--space-3` 12, `--space-4` 16, `--space-5` 24, `--space-6` 32, `--space-7` 48, `--space-8` 64, `--space-9` 96, `--space-10` 128, `--space-11` 192 (px, defined in rem). Section rhythm: `clamp(96px, 14vw, 192px)` vertical. Page gutter: `clamp(16px, 2.4vw, 44px)` (carried over from the current page).

### 4A.4 Grid and breakpoints (size classes by available width)

| Class | Width | Columns | Gutter between columns |
|---|---|---|---|
| Compact | < 768 px | 4 | 16 px |
| Regular | 768–1279 px | 8 | 24 px |
| Wide | ≥ 1280 px | 12 | 32 px |

Max content width 1440 px; full-bleed media ignores it. Components respond to their container (`@container`) where possible, so the same panel works in a 4-column or 12-column context.

### 4A.6 Hero over footage (added 2026-11-19)

Full-bleed field video (`src/media/hero/`), poster first, video attached after page load. White scrim: a gradient from the text side (≈ 70% white behind the subheading, fading to clear). Contrast is verified on the poster frame with the scrim applied, not estimated. Pause/play control bottom-right.

### 4A.5 Motion tokens (judgment, guided by `motion.md`)

| Token | Value | Use |
|---|---|---|
| `--dur-feedback` | 160 ms | Hover, focus, pressed states |
| `--dur-ui` | 280 ms | Menu open/close, form state changes |
| `--dur-fade` | 600 ms | Section fades |
| `--dur-reveal` | 900 ms | Line-mask text reveals (current page uses 0.9–1 s) |
| `--dur-signature` | 2400 ms | Hero untangling line, once per visit |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Reveals, entrances (from current page) |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | Line drawing, rules (from current page) |
| `--stagger` | 80 ms | Between sibling reveals; max 4 staggered items |

Rules: reveals start when ≥ 20% visible, run once, and never hide content from assistive tech or no-JS users. Video pause/play control: 44×44 px, labelled "Pause background video" / "Play background video", keyboard reachable, state remembered for the visit.

---

## 5. Animation system

### 5.1 Principles
- Footage is pre-rendered (made in Fable). No live WebGL, no canvas text.
- All text is real HTML over visuals. Nothing is baked into video.
- Motion vocabulary: line draw, line-mask text rise, slow fades, video scrub. Durations and easings come from §4A.5.
- Nothing loops in the viewport except the hero and the "moving frontier" scene, and both can be paused.

### 5.2 `ScrollScene` component

```njk
{{ scrollScene({
  id: "transition-1",
  mode: "scrub",            // "scrub" = currentTime follows scroll; "play" = plays when in view
  length: "200vh",          // scroll distance the scene is pinned for (scrub only)
  poster: "transition-1",   // resolves to media/scenes/transition-1/poster.{avif,jpg}
  description: "Thin circuit lines lengthen and soften into branching stems.",  // a11y + SEO
  loop: false
}) }}
  <p class="scene-text">Consultants hand you a report. We own the outcome with you.</p>
{{ endScrollScene() }}
```

Behaviour:
1. Server renders a sticky container, a `<picture>` poster, and the HTML text. No `<video>` sources in the initial HTML.
2. `IntersectionObserver` (rootMargin ≈ 1 viewport) attaches the right rendition (`mobile` under 768 px or on `Save-Data`, else `desktop`; WebM first, MP4 fallback).
3. **Scrub mode:** scroll progress (0–1) through the pinned range maps to `video.currentTime`, smoothed with `requestAnimationFrame` lerp. Scrub is user-driven, so it needs no pause control. **Play mode:** plays when ≥ 40% visible, pauses when not, and shows a pause/play control.
4. Text layers reveal at configured progress points (`data-at="0.35"`).
5. **Fallbacks:** `prefers-reduced-motion: reduce`, `Save-Data`, JS off, or a video error → poster only, text fully visible, no pinning.
6. **Placeholders:** until clips arrive, each scene renders a still poster made in the palette (a simple SVG line study), so the full scroll rhythm can be reviewed now.

### 5.3 Hero line drawing
A single SVG path, stroke-dashoffset animation, tangled → calm, `--dur-signature` with `--ease-in-out`, plays once, `aria-hidden`. Reduced motion: the line is drawn in its final, straight state.

### 5.4 Clip specification (full detail goes into `docs/CLIPS.md` in Phase 4)

| Clip | Mode | Length | Master | Aspect | Delivered renditions | Size budget (each) |
|---|---|---|---|---|---|---|
| Hero (existing) | loop | 19 s (as is) | existing 2050×1080 | ~1.9:1 | desktop 1920w, mobile 960w; WebM (VP9) + MP4 (H.264) | desktop ≤ 3.0 MB, mobile ≤ 1.2 MB |
| Transition 1 | scrub | 4–6 s, 24 fps | 1920×1080 + 1080×1350 | 16:9 desktop, 4:5 mobile | WebM + MP4, **all-intra or keyframe every 6 frames** for smooth scrubbing | desktop ≤ 3.0 MB, mobile ≤ 1.5 MB |
| Transition 2 | scrub | 4–6 s, 24 fps | same | same | same | same |
| Moving frontier | play/loop | 6–10 s, seamless loop | same | same | WebM + MP4 | desktop ≤ 2.0 MB, mobile ≤ 1.0 MB |

Every clip: no audio track, no flashing (≤ 3 flashes per second), first and last frames that resolve to **pure white `#FFFFFF`** and frame edges that fade to white (so scenes melt into the page), no text in the render, a clear empty zone where the headline sits, key action inside a safe area, and a poster frame (AVIF ≤ 80 KB + JPEG + WebP). Masters as high-bitrate H.264 (CRF 12); `scripts/encode-video.sh` produces every rendition, with a separate 4:5 mobile master.

**Production (revised 2026-11-20):** scenes are rendered offline with Three.js in headless Chrome (`scripts/render/`, Parth chose this over installing Blender): accumulated samples per frame for depth of field, soft shadows and anti-aliasing; natural materials (paper, copper, bark, leaf); light grain added in the composite. Fable clips can replace any scene later through the same `encode-video.sh` pipeline.

---

## 6. SEO system (from day one)

- **Head, every page:** unique `<title>` (≤ 60 chars, target phrase first, "| Therefore Tech" suffix), unique meta description (≤ 155 chars), self-referencing canonical on `https://www.thereforetech.com`, Open Graph + Twitter `summary_large_image`, absolute OG image URLs (1200×630, one per page).
- **Build fails** if a page lacks `title`, `description`, `targetPhrase` or `h1`, or if two pages share a title or description. Pages with `draft: true` are excluded from production builds and the sitemap.
- **Structure:** exactly one H1 per page, no skipped heading levels, descriptive link text.
- **JSON-LD:** `Organization` (name, url, logo, founder, sameAs LinkedIn), `WebSite`, `Person` (Parth Paliwal, jobTitle, sameAs LinkedIn), `Service` (Transform, Discover, Operational resilience), `Article` (work items + insights, author Person, dates), `BreadcrumbList` (all inner pages). No `Review`, `AggregateRating` or client names in any schema. Validated in CI against schema.org vocabulary, then manually in Google's Rich Results Test.
- **Files:** `sitemap.xml` (generated, with `lastmod`), `robots.txt` (points to sitemap), custom `404.html`.
- **Clean URLs:** directory-style (`/transform/`), consistent trailing slash, canonical host `www`.
- **Media:** alt text on every image; each `ScrollScene` has a text description; videos are decorative (`aria-hidden`) with their meaning carried by the HTML text.
- **Quotable content:** each service page opens with a plain two-sentence definition ("Therefore Tech helps founders… by…") and a short FAQ written in full sentences, so AI search tools and featured snippets can quote it accurately.
- **Analytics:** Cloudflare Web Analytics (Q5). Cookie-free, so no consent banner. Beacon loaded with `defer` after first paint; checked against the performance budget.
- **Launch checklist** (`docs/LAUNCH.md`): DNS records (apex A/AAAA to GitHub Pages, `www` CNAME), Pages custom domain, Enforce HTTPS, apex → www redirect check, Google Search Console domain property (DNS TXT), sitemap submission, URL inspection of key pages, Bing Webmaster import, Cloudflare Web Analytics site token.

---

## 7. Performance and accessibility budgets

| Metric | Target |
|---|---|
| Lighthouse (mobile and desktop), every page | Performance, Accessibility, Best Practices, SEO **≥ 95** |
| LCP (mobile, 4G) | ≤ 2.0 s. LCP element is the hero H1 or a ≤ 60 KB AVIF poster, never the video |
| CLS | ≤ 0.02 |
| INP | ≤ 150 ms |
| Initial page weight (excluding lazy video) | ≤ 250 KB |
| JS | ≤ 10 KB gzip of our own code, all deferred, none render-blocking (+ Cloudflare beacon) |
| Fonts | 2 families, self-hosted WOFF2, subset, `font-display: swap`, ≤ 2 preloads |
| Contrast | WCAG 2.2 AA everywhere, including text over video (scrim tuned per scene) |
| Text size | Usable at 200% browser text size without loss of content |
| Targets | ≥ 44×44 px for every interactive element |
| Keyboard | Visible focus (2 px black ring with white gap, visible on white and over footage), skip link, full keyboard operation |
| Motion | `prefers-reduced-motion` → posters, no pinning, no autoplay; pause control on every looping video |

Hero video loads only after first paint (`preload="none"` then attached on `load`), so it never competes with LCP.

---

## 8. Build phases

Each phase ends with: acceptance checks run, results recorded in `PROGRESS.md`, and a short check-in with Parth where a decision is needed.

| Phase | Scope | Acceptance criteria |
|---|---|---|
| **0. Discovery & plan** | Audit, this plan, open decisions. | ✅ Approved 2026-11-19 with changes. |
| **1. Foundations** | Eleventy scaffold on a `rebuild` branch; `tokens.css` from §4A; self-hosted fonts; base layout, header/footer/nav, skip link; SEO head partial; copy lint incl. NDA blocklist; CI workflow (build + lint + HTML validation). Coming-soon page untouched. | `npm run build` clean; copy lint and `html-validate` pass; a seeded NDA term makes the lint fail; a token test page scores ≥ 95 on Lighthouse (mobile + desktop) and axe 0 violations; no change to the live site. |
| **2. Content model** | All approved copy into front matter/markdown; keyword map in `_data/seo.json`; claims register populated; DRAFT copy for inner pages and engagement models written for review. | Homepage copy matches brief verbatim (automated diff); every page has title/description/targetPhrase/h1; zero lint violations. |
| **3. Homepage (static)** | All 10 sections, responsive, no motion yet; placeholder posters for scenes; founder note slot visibly marked as a launch blocker in dev builds only. | Correct at 360, 390, 768, 1024, 1440, 1920 widths and at 200% text size; one H1; axe 0 violations; Lighthouse ≥ 95 mobile. |
| **4. Video pipeline** | `encode-video.sh`, hero renditions, AVIF posters, `docs/CLIPS.md`. | Hero renditions within budget; side-by-side review shows no visible quality loss; mobile Lighthouse still ≥ 95 with hero video. |
| **5. Motion system** | Hero line, `ScrollScene` (scrub + play), text reveals, pause controls, reduced-motion path, Save-Data path. | No long tasks > 50 ms during scroll at 4× CPU throttle; reduced motion shows posters only; JS off shows complete content; pause control works by mouse, touch and keyboard. |
| **6. Inner pages** | transform, discover, how-we-work, operational-resilience, work index + DRAFT work items, about, insights index + 2 articles, contact, 404. Needs bio, LinkedIn and wordmark from Parth before it starts. | Every page passes Phase 3 checks; internal linking rules in §3 met; all DRAFT copy approved or held back. |
| **7. SEO completion** | JSON-LD on all pages, sitemap, robots, OG images, breadcrumbs, `LAUNCH.md`. | Schema validates (CI + Rich Results Test); sitemap lists all indexable pages; no duplicate titles/descriptions; 404 is `noindex`. |
| **8. Contact, booking, analytics** | Web3Forms form (honeypot + time check, no CAPTCHA puzzles), Cal.com link for "Book a founder conversation", Cloudflare Web Analytics. | Test submission arrives at Parth's address; form accessible and works without JS (plain POST); booking link opens Cal.com; analytics records a visit; Lighthouse unchanged. |
| **9. Full QA** | Lighthouse CI on every URL (mobile + desktop), axe, HTML validation, link check, real-device check (iOS Safari, Android Chrome), reduced motion, copy lint, NDA scan of the built site, claims register review. | All budgets in §7 met on every page; zero broken links; claims register 100% sourced; NDA scan clean. |
| **10. Launch** | Merge to `main`, switch Pages to Actions deploy, enforce HTTPS, run `LAUNCH.md`. **Done only with Parth's go-ahead and all launch blockers cleared.** | Live on https://www.thereforetech.com; apex redirects; Lighthouse ≥ 95 on the live URL; sitemap submitted in GSC. |
| **11. Clips** | Swap Fable clips into `ScrollScene` as they arrive. | Each clip within budget; Lighthouse unchanged; reduced motion verified. |
| **12. Articles** | Post-launch article roadmap (§3.1), one at a time, each approved by Parth. | Each article passes copy lint, links per §3 rules, Article schema valid. |

Rollback at launch: the current `gh-pages` branch is kept untouched, so switching the Pages source back restores the coming-soon page in minutes.

### 8.1 Launch blockers

The site does not go live until every item is cleared:

1. Founder note paragraph from Parth (homepage §9).
2. Bio, LinkedIn URL and wordmark from Parth.
3. Enquiry email address (Web3Forms) and Cal.com link.
4. Every DRAFT item either approved or removed from the build (inner-page copy, engagement models, work items, articles).
5. NDA scan of the built site clean, and Parth's sign-off.

---

## 9. Claims register

| Claim | Where | Source | Status |
|---|---|---|---|
| "We partner directly with ambitious founders…" | Home hero | Brief | Approved copy |
| "Consultants hand you a report. We own the outcome with you." | Home §2 | Brief | Approved copy |
| "Delivered in months, not years." | Home §6 | Brief | Approved copy |
| "Parth has worked alongside senior technology leaders at global companies." | Home §7, About | Parth, 2026-11-19 | Approved copy. **No person or company is ever named.** |
| Operational resilience description | Home §7, `/operational-resilience` | Brief | Approved copy (capability, not a case study) |
| Financial anomaly detection | Home §7, `/work/financial-anomaly-detection` | Brief: founder experience, not a client | **DRAFT** until Parth confirms details |
| Automated research systems | Home §7, `/work/automated-research-systems` | Brief | **DRAFT** until Parth confirms details |
| Engagement models: Founder Opportunity Sprint, Build projects, Founder's Innovation Office | Home §8, `/how-we-work` | Parth, 2026-11-19 (names only) | **DRAFT**; descriptions, durations, prices need confirmation |
| Excluded engagement | — | — | **EXCLUDED (NDA).** Not described in this repo. Guarded by the NDA blocklist. |

No number, client name, logo or outcome appears on the site unless it is in this table with status Approved.

---

## 10. Decisions

### Answered (2026-11-19)

| # | Decision |
|---|---|
| Q1 | Palette A, "Field" (§4A.2). **Superseded 2026-11-19:** pure white, black ink and thin black rules; no gold anywhere. |
| Q2 | Roboto Condensed for wordmark, nav and labels; Newsreader for headlines and long-form text. **Revised 2026-11-19:** Roboto Condensed uppercase is dominant (nav, labels, buttons, H1s, section titles); Newsreader only for body and long text. |
| Q3 | "Owned by Parth Paliwal" dropped. |
| Q4 | Web3Forms for the form, Cal.com for booking. Parth will supply the email address and link. |
| Q5 | Cloudflare Web Analytics. |
| Q6 | NDA engagement removed, replaced by the founder-experience line. Operational resilience is a capability. Financial anomaly detection and automated research systems kept as DRAFT. |
| Q7, Q8, Q10 | Parth supplies bio, LinkedIn, founder note and wordmark before Phase 6. |
| Q9 | Second seed article approved. |

### Design review, 2026-11-19

Parth's changes after seeing Phase 1–2: white background; no gold; black ink and thin black rules; Roboto Condensed uppercase dominant; hero field video back, full-bleed; motion added now (hero line, scroll reveals, moving ScrollScene placeholders); full-grid editorial layout instead of left-aligned text; no duplicated label above the H1. **Sequencing change:** homepage layout (Phase 3), hero renditions (part of Phase 4) and the motion system (Phase 5) are pulled forward and reviewed on the homepage and Discover before the other inner pages are reworked.

### Open

**Homepage review, 2026-11-20:** Parth selected the Connected promise typography study and explicitly asked
to apply it. The hero headline is now one sentence (comma and lowercase "and"), with deliberate line
breaks. The unchanged founder paragraph is larger, with "ambitious founders" emphasized. The existing
untangling animation moves from above the headline to beneath the header wordmark and navigation,
replacing that static rule. The hero video keeps looping; its visible pause/play control is removed at
Parth's explicit request. Reduced-motion and Save-Data visitors still receive the poster. The absence of
an on-page pause control remains an accessibility deviation. Scene palette and other copy are unchanged.
Parth also preferred the macro still-life scene study; this selection does not mean that its full video
has been rendered or integrated.

| # | Item | Needed by |
|---|---|---|
| O1 | Enquiry email address and Cal.com link | Phase 8 |
| O2 | Bio, LinkedIn URL, wordmark file | Phase 6 |
| O3 | Founder note paragraph | Launch (blocker) |
| O4 | Details for financial anomaly detection and automated research systems | Launch, or they are held back |
| O5 | Engagement model descriptions (scope, who it's for, how it runs) | Launch, or the section is held back |
| O6 | Dark appearance: light-only for launch; revisit after launch? | Post-launch |
| O7 | Approval of the 8 post-launch article topics (§3.1) | Phase 12 |
| O8 | Contact form: add an **Email** field? The brief lists name, company and the problem only, which leaves no way to reply. Added as DRAFT. | Phase 8 |
| O9 | Approval of all DRAFT copy: inner pages, "What we do" panel lines, engagement model descriptions, work card title "Senior technology leadership", form button "Start the conversation", site description. `npm run check:launch` lists every item. | Launch |

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| NDA material leaks into the site or repo | Rule 0.6; NDA blocklist in copy lint (fails the build), kept out of the repo; NDA scan of built HTML in Phase 9; repo history checked against the blocklist before launch. |
| Hero video drags mobile Lighthouse below 95 | Mobile rendition ≤ 1.2 MB, loaded after first paint; LCP is text/poster; measured in Phase 4 before motion work starts. |
| Scroll-scrub stutters on mobile | All-intra / short-GOP encodes; lerp smoothing; mobile can fall back to "play" mode per scene if needed. |
| Clips arrive late | Placeholders let the full site launch without them; Phase 11 is independent. |
| Look reads as a template (cream + serif) | Craft-lens mitigations in §4A.1; design review at end of Phase 3. |
| Copy drift or invented claims | Copy lint + claims register + verbatim diff on homepage copy. |
| Thin `/work/` at launch | Accept it; add work only when confirmed. Articles build depth meanwhile. |
| Launch breaks the live domain | Coming-soon stays live until Phase 10; `gh-pages` kept as instant rollback. |
| SEO targets are wrong | Treated as hypotheses; review with Search Console data 4–6 weeks after launch. |
