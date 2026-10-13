# @app-starter/static-demo

A static, backend-free build of the Compass demo for GitHub Pages
(`https://bouncypitch.github.io/compass-company-brain/`). No login, no API, no keys.

| Path       | What it renders                                               |
| ---------- | ------------------------------------------------------------- |
| `/`        | Landing page linking to the deck, the journey, repo and video |
| `/deck/`   | `components/demo/DemoDeck` (the keynote deck)                 |
| `/journey/`| `components/journey/JourneyExperience` (Jordan's journey)     |

## Build

```sh
pnpm install
pnpm --filter @app-starter/static-demo build
```

The site is written to `apps/static-demo/out`. Publish the **contents** of that
folder to the root of the `gh-pages` branch (it already contains `.nojekyll`).

## How it works

- **Same components as the web app.** `@/*` resolves to `../web/src/*`
  (`tsconfig.json` paths), so the deck and journey are compiled straight from
  `apps/web` — nothing is copied.
- **Data layer swapped.** `@/lib/brain-api` is aliased to
  `src/lib/brain-api.ts` (tsconfig path, `turbopack.resolveAlias`, and a
  webpack alias in `next.config.js`). It keeps the web module's exported names
  and types but reads JSON from `public/snapshot/`:
  - `accept` resolves after ~1.5s with the recorded draft PR; `priorityStatus` is always `completed`.
  - `ask` returns the recorded answer for an exact (case/space-insensitive)
    match in `ask.json`, otherwise the closest suggested question's answer,
    prefixed with a one-line static-demo note.
- **Base path.** `basePath: '/compass-company-brain'`, `trailingSlash`, and
  `NEXT_PUBLIC_BASE_PATH` (used by the snapshot loader and `ClipPlayer` for
  `talk.mp3`). The web app leaves the variable unset, so it is unaffected.
- **Styles.** `tailwind.config.js` reuses `apps/web/tailwind.config.ts` and
  scans `../web/src/components/**`.

## Refreshing the snapshot

```sh
cp ../../data/snapshot/*.json public/snapshot/
```

`public/talk.mp3` is the public-safe recording (only the cited moments audible).

## Previewing locally

The export only works under its base path, so serve it from a parent folder:

```sh
mkdir -p /tmp/pages && rm -rf /tmp/pages/compass-company-brain
cp -R out /tmp/pages/compass-company-brain
cd /tmp/pages && python3 -m http.server 8090
# open http://localhost:8090/compass-company-brain/
```
