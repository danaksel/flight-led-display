# Project Structure

```text
cloudflare-worker/   Cloudflare Worker API, web control panel, emulator, logo assets
firmware-hub75/      New ESP32-S3 + HUB75 firmware target
firmware-original/   Original TheFlightWall OSS firmware reference
assets/              Source and exported airline logos
hardware/            Hardware notes and build assumptions
```

## Deployment

The Worker is deployed from `cloudflare-worker/`.

Secrets belong in Cloudflare Worker secrets or local `.dev.vars`; they must not be committed.
