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
- `/public/firmware/latest.json`: OTA manifest served from Worker assets.
- `/public/firmware/*.bin`: OTA binaries served from Worker assets.

Legacy inline control panels and the pixel editor have been removed. The active app is `frontend/src/App.tsx`.

## Account Data

- FR24 keys are stored per account, encrypted with `CREDENTIAL_ENCRYPTION_KEY`.
- Screen display modes that require FR24 are unlocked when the owner account has a key.
- Homey tokens are stored per account and can be rotated from the account panel.
- Homey sends HTTP `POST` to screen-specific URLs and includes `X-SkyFrame-Homey-Token`.

Example:

```text
POST https://skyframe.danaksel.no/public/homey/screens/{screenId}/screen-state/activate
POST https://skyframe.danaksel.no/public/homey/screens/{screenId}/screen-state/deactivate
POST https://skyframe.danaksel.no/public/homey/screens/{screenId}/brightness-mode/night
POST https://skyframe.danaksel.no/public/homey/screens/{screenId}/brightness-mode/day
POST https://skyframe.danaksel.no/public/homey/screens/{screenId}/display-mode/airspace
POST https://skyframe.danaksel.no/public/homey/screens/{screenId}/display-mode/hybrid
POST https://skyframe.danaksel.no/public/homey/screens/{screenId}/display-mode/airport-board
POST https://skyframe.danaksel.no/public/homey/screens/{screenId}/display-mode/clock
X-SkyFrame-Homey-Token: <account-token>
```

The `/public/homey/...` automation routes are designed to bypass browser login and rely on the Worker token check. `/api/screens/{screenId}/...` aliases also exist, but those need a Cloudflare Access bypass before Homey can reach the Worker.

## OTA Assets

Firmware binaries can be published as Worker assets under `public/firmware/`.

`latest.json` must include:

```json
{
  "version": "V1.4",
  "url": "https://skyframe.danaksel.no/public/firmware/skyframe-v1.4.bin",
  "sha256": "<64 hex chars>",
  "size": 1234567,
  "releaseNotes": [
    "Short user-facing fix or improvement."
  ]
}
```

Use `V<major>.<minor>` in `SKYFRAME_FW_VERSION`, `latest.json` and the lowercase binary filename, for example `skyframe-v1.4.bin`. Every firmware release must include short pointwise `releaseNotes` for the control panel update card. Firmware installation is manual: the display may report update availability from `latest.json`, but it must only download and install after an explicit `ota_update` command.
