# Therefore Tech

Website for [thereforetech.com](https://www.thereforetech.com). Static site built with Eleventy, hosted on GitHub Pages.

- Plan and phases: [`docs/PLAN.md`](docs/PLAN.md)
- Progress log: [`docs/PROGRESS.md`](docs/PROGRESS.md)

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local server at http://localhost:8080 (includes dev pages such as `/dev/tokens/`) |
| `npm run build` | Production build into `_site/` (drafts and dev pages excluded) |
| `npm test` | Build, copy lint (brand, buzzwords, NDA) and HTML validation |
| `npm run fonts` | Rebuild the subset fonts in `src/assets/fonts` (needs Python fontTools) |

The copy lint needs an NDA blocklist: a git-ignored `.nda-blocklist` file locally, or the `NDA_BLOCKLIST` secret in CI. Never commit it.

Until launch (Phase 10), the live site is still the coming-soon page served from the `gh-pages` branch.
