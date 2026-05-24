# Flight Display Server

Cloudflare Worker for TheFlightWall-style displays.

It provides:

- A small map frontend at `/` for choosing latitude, longitude and radius.
- `GET /api/config` and `POST /api/config` backed by Cloudflare KV.
- `GET /api/flights` for normalized FR24 live flight data.
- `GET /api/display` for a compact ESP32-friendly payload.

## Setup

Create a KV namespace and paste the namespace id into `wrangler.toml`:

```bash
npx wrangler kv namespace create FLIGHT_DISPLAY_KV
```

Set your FR24 API key as a secret:

```bash
npx wrangler secret put FR24_API_KEY
```

For followed flights that are scheduled but not yet available from FR24, set an Aviationstack key too. The Worker uses it to fill departure time and departure gate when available:

```bash
npx wrangler secret put AVIATIONSTACK_API_KEY
```

For FR24 sandbox testing, change this in `wrangler.toml`:

```toml
FR24_LIVE_ENDPOINT = "/sandbox/live/flight-positions/light"
```

Then deploy:

```bash
npm run deploy
```
