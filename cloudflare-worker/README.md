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

## Product Modes

SkyFrame is one product with two per-screen modes:

- `flight`
- `marine`

The selected mode is stored as the only shared top-level screen setting. Mode-specific settings are stored separately:

```text
config:v1          active productMode only
config:v1:flight   flight settings
config:v1:marine   marine settings
```

Do not reuse flight settings for marine, or marine settings for flight. The control panel should show only the sections for the active mode. A mode switch in the Account panel must not mutate the other mode's config.

Marine display data is served through the same `/api/display` and `/public/display` endpoints as flight data, but `productMode: "marine"` changes the payload and firmware layout.

`POST /api/display-refresh` forces a one-off display refresh. It broadcasts `display_changed` over realtime so the physical screen fetches `/public/display` immediately. The control panel uses the same action for the marine "Fetch now" button.

## Account Data

- FR24 keys are stored per account, encrypted with `CREDENTIAL_ENCRYPTION_KEY`.
- Screen display modes that require FR24 are unlocked when the owner account has a key.
- BarentsWatch AIS Client ID and Client Secret are stored per account, encrypted with `CREDENTIAL_ENCRYPTION_KEY`.
- Marine mode requires BarentsWatch AIS credentials for live vessel data. Missing credentials, API errors and empty radar areas must be surfaced as real states, not replaced with mock data.
- Homey tokens are stored per account and can be rotated from the account panel.
- Homey sends HTTP `POST` to screen-specific URLs and includes `X-SkyFrame-Homey-Token`.

## BarentsWatch AIS

Marine mode uses the BarentsWatch Live AIS "latest position" endpoint:

```text
GET https://live.ais.barentswatch.no/v1/latest/combined
```

The Worker obtains an OAuth token using account credentials:

```text
POST https://id.barentswatch.no/connect/token
scope=ais
grant_type=client_credentials
```

Relevant Worker variables:

```toml
BARENTSWATCH_SCOPE = "ais"
BARENTSWATCH_TOKEN_URL = "https://id.barentswatch.no/connect/token"
BARENTSWATCH_LATEST_URL = "https://live.ais.barentswatch.no/v1/latest/combined"
```

AIS data is normalized into the compact display format used by the firmware and emulator. Ship type codes are mapped to human-readable names such as `High speed craft`, `Cargo`, `Passenger` and `Tanker`.

Marine radar projection uses a viewer-relative coordinate system:

- Positive forward is from the POV point toward the radar center and maps to the top of the LED radar.
- Positive right is the viewer's right side from the same POV and maps to the right side of the LED radar.
- `radarHeadingDeg` is a heading relative to that radar coordinate system, used by firmware and emulator to draw the vessel direction marker.

Optional land/sea outline support uses a preprocessed landmask extract. The deployed dataset at `public/marine/land-polygons.json` is generated from Kartverket Topografisk norgeskart WMS for inner Oslofjord. For another area, replace it with an OSMCoastline/Kartverket-derived regional extract, or set `MARINE_LANDMASK_URL` to a hosted JSON file. The Worker accepts raster landmasks, GeoJSON `FeatureCollection` with `Polygon`/`MultiPolygon` geometry, or the compact polygon form:

```json
{
  "type": "raster-landmask-v1",
  "version": "kartverket-topo-inner-oslofjord-2026-06-11-v1",
  "bbox": [10.35, 59.65, 10.9, 60.02],
  "width": 2200,
  "height": 1480,
  "encoding": "base64-land-bits-v1",
  "data": "..."
}
```

Polygon form:

```json
{
  "version": "norway-coast-2026-06-11",
  "features": [
    { "bbox": [10.1, 59.0, 10.9, 59.8], "rings": [[[10.1, 59.0], [10.9, 59.0], [10.9, 59.8], [10.1, 59.8], [10.1, 59.0]]] }
  ]
}
```

Do not ship the full global OSMCoastline file in Worker assets. Trim it to the product's operating region first.

Do not introduce mock AIS data in customer-facing responses. Local tests should use explicit fixtures or local-only test helpers instead of falling back inside production display code.

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
  "version": "V1.8",
  "url": "https://skyframe.danaksel.no/public/firmware/skyframe-v1.8.bin",
  "sha256": "<64 hex chars>",
  "size": 1234567,
  "releaseNotes": [
    "Short user-facing fix or improvement."
  ]
}
```

Use `V<major>.<minor>` in `SKYFRAME_FW_VERSION`, `latest.json` and the lowercase binary filename, for example `skyframe-v1.8.bin`. Every firmware release must include short pointwise `releaseNotes` for the control panel update card. Firmware installation is manual: the display may report update availability from `latest.json`, but it must only download and install after an explicit `ota_update` command.
