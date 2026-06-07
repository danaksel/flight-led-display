# SkyFrame Worker

Cloudflare Worker, React control panel and admin surface for SkyFrame.

Primary public domain:

```text
https://skyframe.danaksel.no
```

## Scripts

```bash
npm test -- --run
npm run typecheck
npm run build:web
npm run deploy
```

`build:web` writes the React app to `public/`, and the Worker serves those assets through the `ASSETS` binding.

## Active Surfaces

- `/start`: public pairing journey.
- `/`: Google-protected control panel.
- `/admin`: admin-only fleet overview.
- `/api/*`: control-panel and admin APIs.
- `/public/*`: firmware/device APIs.

Legacy inline control panels and the pixel editor have been removed. The active app is `frontend/src/App.tsx`.
