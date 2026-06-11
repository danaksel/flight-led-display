# SkyFrame

SkyFrame is a consumer-facing flight and marine traffic display for a 128 x 64 HUB75 RGB LED panel driven by a Waveshare ESP32-S3-RGB-Matrix board.

The product model is simple: one firmware image can be flashed before delivery, and every customer-specific decision happens later through Cloudflare, Google login, pairing and the control panel.

## Architecture

```text
Customer browser
  /start                 Public pairing entry
  /                      Google-protected control panel
  /admin                 Admin-only fleet overview

Cloudflare Worker
  React control panel
  Pairing and account flow
  Account-level FR24 and BarentsWatch secret storage
  Per-screen product mode and separate mode-specific settings
  Shared public APIs for Avinor, BarentsWatch AIS, logos and display payloads
  KV-backed config, screen state, vitals and pending device commands
  Durable Object realtime fanout
  Static React assets served from Worker assets

ESP32-S3 firmware
  Local Wi-Fi setup portal
  Pairing code display
  Device token storage in ESP32 Preferences/NVS
  Polls public device endpoints
  Renders the final 128 x 64 display payload
  Sends vitals and handles remote maintenance commands
```

## Current User Journey

1. Customer powers the display.
2. If Wi-Fi is missing, the display starts setup mode and shows the setup access point.
3. Customer joins `SKYFRAME-SETUP`, chooses Wi-Fi in the captive portal, and the display reboots.
4. The display connects to Wi-Fi, starts provisioning and shows:

```text
PAIRING MODE
SKY-123456
skyframe.danaksel.no/start
```

The setup URL scrolls on the panel so the full `/start` path is visible.

5. Customer opens `https://skyframe.danaksel.no/start`, signs in with Google, enters the pairing code and gives the screen a device name.
6. FR24 is optional. Without a personal FR24 key, the control panel disables AirSpace, Follow Flight and AirSpace + Airport Board. Airport Board and Clock still work.
7. BarentsWatch AIS credentials are optional and are only used by screens set to Marine mode.
8. Later changes happen from the control panel. The device should not need to be connected to a PC again for normal ownership, Wi-Fi or restart tasks.

## Product Modes

Each paired screen has one shared top-level `productMode`:

- `flight`
- `marine`

The mode is selected in the Account panel under "My screens". The mode decides which control-panel sections are shown and which display payload the firmware receives.

Flight and Marine settings are intentionally separate. The Worker stores an active mode pointer plus a separate config profile for each mode:

```text
config:v1          active productMode only
config:v1:flight   flight profile
config:v1:marine   marine profile
```

Do not share location, radius, colors, display behavior or other settings between the two modes. Only the screen identity, account, pairing/device token, power state, maintenance commands and active `productMode` are common.

### Flight Mode

Flight mode uses FR24, Avinor and airline logo assets. FR24 credentials are account-scoped and encrypted with `CREDENTIAL_ENCRYPTION_KEY`.

### Marine Mode

Marine mode uses BarentsWatch Live AIS. BarentsWatch Client ID and Client Secret are account-scoped and encrypted with `CREDENTIAL_ENCRYPTION_KEY`.

Marine mode renders:

- 1 px outer margin.
- Radar area at `x=1`, `y=1`, `w=126`, `h=46`.
- Text line 1 at `y=48`: `Vessel name - Ship type`.
- Text line 2 at `y=56`: `Course - Speed - Destination - Status`.
- 1 px bottom margin.

Vessels with AIS status anchored, moored or in port are filtered out before radar/text rendering. Destination is included on text line 2 when AIS provides a usable destination value.

Marine radar uses two geographic points:

- Radar center: the center of the rectangular radar area.
- POV/distance origin: where the screen/viewer is physically located.

Distances and bearings shown in text are measured from the POV point. Radar projection is centered on the radar center. The top edge of the radar is "straight ahead" from the POV point toward the radar center, and the right edge is the viewer's right side from that same POV.

Marine radius is configurable from 0.5 km to 3.0 km in 0.1 km steps. Normal AIS polling uses the marine fetch interval, and the control panel also has a "Fetch now" button that sends a realtime display refresh to the physical screen and refreshes the emulator preview immediately.

Marine radar can draw a land/sea outline from a preprocessed landmask extract. The deployed dataset is `public/marine/land-polygons.json`, generated from MapTiler/OpenMapTiles vector `water` polygons for inner Oslofjord. The Worker can also use `MARINE_LANDMASK_URL` if configured. At runtime the Worker converts the current rotated `126 x 46` radar rectangle to a compact `base64-land-bits-v1` mask and caches it in KV. Firmware and emulator draw set bits with the configured marine land color, defaulting to black/off LEDs, and leave unset bits as the configured radar background color.

When no vessels are inside the selected marine radar area, the display still renders the radar background and landmask. The vessel marker and both text lines remain blank.

Mock AIS data must not be used in the customer-facing control panel or display payload. If BarentsWatch credentials are missing, the API fails, or there are no vessels in the selected radar area, the UI should show that state explicitly.

## Project Structure

```text
cloudflare-worker/   Worker API, React control panel, admin page, Cloudflare config and deployed assets
firmware-hub75/      Active PlatformIO firmware for Waveshare ESP32-S3-RGB-Matrix + HUB75
hardware/            Hardware notes
```

The old reference firmware and old inline control surfaces have been removed. The active control panel lives in `cloudflare-worker/frontend`.

## Cloudflare Resources

Global/shared resources:

- Worker: `flight-display-server`
- Public domain: `skyframe.danaksel.no`
- Worker preview domain: `flight-display-server.dan-aksel.workers.dev`
- KV namespace: `FLIGHT_DISPLAY_KV`
- Durable Object: `REALTIME_HUB`
- R2 bucket for airline logos
- Shared Avinor/open endpoints

Per-screen/private resources:

- Device token
- Screen config and device name
- Screen state and vitals
- Active product mode

Per-account/private resources:

- Personal FR24 key
- Personal BarentsWatch AIS credentials
- Homey token

FR24 and BarentsWatch credentials are intentionally account-scoped because they belong to the owner and should follow the account across unpairing, Wi-Fi changes, factory reset and re-pairing. Avinor, logo assets, KV namespace and R2 are shared infrastructure.

## Important Routes

- `/start`
  Public entry for new users. Starts Google login when needed and pairs a display code to the signed-in account.

- `/`
  Google-protected control panel. Users can choose a screen if they own more than one.

- `/admin`
  Admin-only overview of users, screens, FR24 status, screen state and device vitals. Admin can delete a screen, which sends it back to pairing mode.

- `/api/config`
  Reads and saves the current screen config for the signed-in user/screen. The active product mode decides whether this reads/writes the flight or marine profile.

- `/api/display-refresh`
  Forces an immediate display fetch. The Worker broadcasts `display_changed` so the physical screen fetches `/public/display` immediately, and the control panel refreshes the preview.

- `/api/device-command`
  Sends a maintenance command to the current screen. Supported commands are `restart`, `unpair`, `forget_wifi` and `factory_reset`.

- `/api/admin/screens`
  Admin JSON overview of paired screens.

- `/api/admin/screens/:screenId`
  Admin `DELETE`. Soft-deletes the screen from account/admin views, removes config/secrets/state and sends `unpair` to the physical screen.

- `/public/provision/start`
  Firmware starts a new pairing session.

- `/public/provision/status`
  Firmware polls until a pairing session is claimed and receives its device token.

- `/public/realtime-state`
  Lightweight firmware poll endpoint for config versions, sound nonce and pending device command.

- `/public/device-config`
  Firmware config payload.

- `/public/display`
  Firmware display payload.

- `/public/device-status`
  Firmware vitals/heartbeat POST.

- `/public/logos-rgb565/{CODE}.rgb565`
  Firmware-friendly 42 x 42 RGB565 airline logos.

## Airline Logos

The Worker can serve browser/preview PNG logos from R2 (`AIRLINE_LOGOS`), bundled assets in `cloudflare-worker/public/logos`, or an optional external `LOGO_BASE_URL`. The LED display does not use PNG directly. It downloads preconverted 42 x 42 RGB565 little-endian files from:

```text
GET https://skyframe.danaksel.no/public/logos-rgb565/{CODE}.rgb565
```

To add or fix a logo:

```bash
cd cloudflare-worker
mkdir -p ../assets/airline-logos/r2-source ../assets/airline-logos/rgb565
cp /path/to/CODE.png ../assets/airline-logos/r2-source/CODE.png
npm run logos:rgb565 -- --input ../assets/airline-logos/r2-source --output ../assets/airline-logos/rgb565
```

Upload both `CODE.png` and `CODE.rgb565` to the `AIRLINE_LOGOS` R2 bucket. The RGB565 object can live at the bucket root or under `rgb565/`, `logos-rgb565/` or `airline-logos-rgb565/`. `UNKNOWN.rgb565` should always exist as the display fallback.

## Access Policy

Recommended Cloudflare Access setup for `skyframe.danaksel.no`:

- Public/bypass:
  - `/start`
  - `/public/*`
  - `/logos/*`
  - `/logos-rgb565/*`
  - `/assets/*`

- Google login:
  - `/`
  - `/screen-setup`
  - `/api/*`

- Admin Google login:
  - `/admin`
  - `/api/admin/*`

Worker admin authorization is still enforced by `ADMIN_EMAILS`. If someone signs in with the wrong Google account, the admin failure page does not reveal which address is allowed and includes a Cloudflare Access logout link so they can switch account.

## Device Maintenance

The control panel can send remote commands:

- `restart`: reboot the display.
- `ota_update`: check the firmware manifest and install a newer SHA-256 verified binary if available.
- `unpair`: remove the account/device token and return to pairing mode while keeping Wi-Fi.
- `forget_wifi`: remove account/device token and Wi-Fi credentials, then start setup mode after reboot.
- `factory_reset`: same practical result as forgetting Wi-Fi and account data.

The firmware stores Wi-Fi credentials and device token in ESP32 Preferences/NVS. That is still the right approach: persistence survives firmware updates, while remote commands give the user a way to reset ownership or Wi-Fi without flashing.

Admin screen deletion uses `unpair`, not full Wi-Fi reset. That lets a deleted screen become ready for a new pairing on the same network.

## OTA Firmware Updates

The ESP32-S3 firmware uses dual OTA app partitions. The current firmware version is compiled as `SKYFRAME_FW_VERSION`, and the display polls for update availability:

```text
GET https://skyframe.danaksel.no/public/firmware/latest.json
```

Firmware release versions use `V<major>.<minor>` for customer-visible firmware images. Increment the minor version for compatible feature/config changes and the major version only for breaking hardware, partition or provisioning changes. The binary filename must match the manifest version in lowercase:

```json
{
  "version": "V1.4",
  "url": "https://skyframe.danaksel.no/public/firmware/skyframe-v1.4.bin",
  "sha256": "<64 lowercase hex chars>",
  "size": 1234567,
  "releaseNotes": [
    "Short user-facing fix or improvement."
  ]
}
```

Every new firmware release must include a short pointwise `releaseNotes` summary in `latest.json`. Keep each point concise and user-facing; it is shown in the control panel update card.

Firmware installation must be manual. The display may poll `latest.json` to report that an update is available, but it must only download and install firmware after an explicit `ota_update` command from the control panel or admin page.

This repository currently uses `V1.4` for the firmware that makes OTA installation manual and keeps follow-mode flight display duration split 50/50 between the two info variants. For example, `displayCycleSeconds: 10` shows each follow variant for 5 seconds.

Publishing flow:

```bash
VERSION=v1.3
pio run -d firmware-hub75
cp firmware-hub75/.pio/build/waveshare_esp32_s3_rgb_matrix/firmware.bin cloudflare-worker/public/firmware/skyframe-$VERSION.bin
shasum -a 256 cloudflare-worker/public/firmware/skyframe-$VERSION.bin
wc -c cloudflare-worker/public/firmware/skyframe-$VERSION.bin
```

Then update `cloudflare-worker/public/firmware/latest.json` and deploy the Worker. The firmware writes the downloaded binary to the inactive OTA partition, verifies SHA-256 before finalizing the update, and keeps running the current firmware if anything fails.

## Local Development

Worker:

```bash
cd cloudflare-worker
npm install
npm run dev
```

Build and verify:

```bash
cd cloudflare-worker
npm test -- --run
npm run typecheck
npm run build:web
```

Firmware:

```bash
cd firmware-hub75
platformio run
platformio run --target upload
```

Current commonly used upload port:

```text
/dev/cu.usbmodem101
```

Use `platformio device list` if the port changes.

## Deploy

```bash
cd cloudflare-worker
npm run build:web
npx wrangler deploy
```

The Worker serves the built React app from `cloudflare-worker/public`.

## Secrets

Set these in Cloudflare:

```bash
cd cloudflare-worker
npx wrangler secret put CREDENTIAL_ENCRYPTION_KEY
npx wrangler secret put AVIATIONSTACK_API_KEY
```

FR24 keys and BarentsWatch AIS credentials are account-scoped. Each owner adds their own keys from the account panel in the control panel, and those credentials follow the account across screen unpairing, Wi-Fi changes, factory reset and re-pairing.

Optional automation/device hardening:

```bash
npx wrangler secret put ADMIN_API_TOKEN
npx wrangler secret put DEVICE_API_TOKEN
```

## Homey API

Homey commands use a per-account token from the account panel. The same token can control every screen owned by that account, while each URL still targets a specific screen.

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

For Marine screens, display-mode automation only accepts `hybrid` (marine radar/live) and `clock`. Flight-only modes such as `airspace` and `airport-board` return `400`.

The Worker validates `X-SkyFrame-Homey-Token`. `/api/screens/{screenId}/...` aliases also exist, but those require a Cloudflare Access bypass before Homey can reach the Worker.

## Verification Checklist

- New display without Wi-Fi shows setup mode and `CONNECT TO WIFI`.
- After Wi-Fi, display shows only pairing information until a screen is paired.
- `/start` pairs the screen and does not require FR24.
- Control panel shows the device name in the header.
- Multiple screens owned by the same account can be selected from the header.
- AirSpace and Follow modes are disabled until the screen has a personal FR24 key.
- Header account icon opens the account panel with signed-in user, screens, FR24, BarentsWatch AIS and Homey token.
- Account panel can switch each screen between Flight and Marine without overwriting the other mode's settings.
- Marine mode shows no mock AIS data to customers.
- Marine mode can force an immediate AIS/display fetch from the Vessels panel.
- Marine emulator and firmware preserve the exact `128 x 64` marine layout and margins.
- Power switch turns the screen on/off.
- General screen can restart, update firmware, unpair or reset Wi-Fi remotely.
- Admin shows all active screens, owners and clean vitals.
- Admin delete removes the screen from admin/user views and sends it back to pairing mode.
