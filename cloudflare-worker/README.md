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

## Account Data

- FR24 keys are stored per account, encrypted with `CREDENTIAL_ENCRYPTION_KEY`.
- Screen display modes that require FR24 are unlocked when the owner account has a key.
- Homey tokens are stored per account and can be rotated from the account panel.
- Homey sends HTTP `POST` to screen-specific URLs and includes `X-SkyFrame-Homey-Token`.

Example:

```text
POST https://skyframe.danaksel.no/public/homey/screens/{screenId}/screen-state/activate
X-SkyFrame-Homey-Token: <account-token>
```

The `/public/homey/...` automation routes are designed to bypass browser login and rely on the Worker token check. `/api/screens/{screenId}/...` aliases also exist, but those need a Cloudflare Access bypass before Homey can reach the Worker.
