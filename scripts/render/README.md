# Scene renders

Offline renders for the homepage scenes (docs/PLAN.md §5.4). Three.js runs in the Chrome already installed on
this Mac (headless, Metal GPU). Each frame is the average of many jittered renders, which gives real
depth of field (aperture sampling), soft shadows (area-light sampling) and clean anti-aliasing.

The composite step sets exposure so bare paper is pure white, fades the frame edges and the first and last
frames to white, and adds fine grain that stays off white areas, so every clip melts into the page.

## Render

```bash
node scripts/render/render.mjs transition-1 desktop --samples 64     # 1920×1080
node scripts/render/render.mjs transition-1 mobile --samples 64      # 1080×1350
```

- Quick framing check: `--samples 16 --frames 20,45,70,102 --out media-masters/renders/preview`.
- Long renders: wrap in `caffeinate -dims` so the Mac doesn't sleep mid-render.
- Frames land in `media-masters/renders/<scene>-<variant>/` (git-ignored).

## Master and web renditions

```bash
ffmpeg -framerate 24 -i media-masters/renders/transition-1-desktop/frame_%04d.png -c:v libx264 -preset slow -crf 12 -pix_fmt yuv420p -tune grain media-masters/transition-1-desktop.mp4
ffmpeg -framerate 24 -i media-masters/renders/transition-1-mobile/frame_%04d.png -c:v libx264 -preset slow -crf 12 -pix_fmt yuv420p -tune grain media-masters/transition-1-mobile.mp4
scripts/encode-video.sh media-masters/transition-1-desktop.mp4 scenes/transition-1 scrub media-masters/transition-1-mobile.mp4 4.25
```

## Scenes

| Scene | File | Idea |
|---|---|---|
| Transition 1 | `scenes/transition-1.js` | A copper trace on paper softens, lifts and becomes a living branch; one leaf unfolds. |
| Transition 1 study A | `scenes/transition-1-macro.js` | Low camera, a routing band, warm raking light, one larger leaf. |
| Transition 1 study B | `scenes/transition-1-specimen.js` | Overhead specimen on paper with soft daylight and a lifting shadow. |

## Art-direction review (20 November 2026)

The study entry points share `scenes/transition-1-study.js`, derived from the original scene. The original
scene and production media remain unchanged. Desktop studies only; the mobile camera has not been tuned.

```bash
node scripts/render/render.mjs transition-1 desktop --samples 16 --frames 30,70,100 --out media-masters/renders/style-current
node scripts/render/render.mjs transition-1-macro desktop --samples 16 --frames 0,30,70,100,119 --out media-masters/renders/style-macro
node scripts/render/render.mjs transition-1-specimen desktop --samples 16 --frames 0,30,70,100,119 --out media-masters/renders/style-specimen
python3 scripts/render/contact-sheet.py
```

The contact-sheet script uses the installed Pillow and macOS fonts. Its output is
`media-masters/transition-1-style-comparison.png`; the PNG sequences remain git-ignored.
Frames 0 and 119 verify the pure-white endpoints. The upper-left 900 x 400 pixels of the sampled frames
are reserved for the headline. This is a composition study, not a page-level mobile or scroll validation.

Select a direction before tuning mobile, rendering the full sequence, encoding video or changing the page.
Use the installed Node 22 for the project checks; a Node 20 shell cannot run this HTML validator.
