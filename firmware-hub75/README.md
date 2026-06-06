# SkyFrame HUB75 Firmware

Target firmware for the Waveshare ESP32-S3-RGB-Matrix controller and a 128 x 64 P2.5 HUB75 panel.

## Responsibilities

- Show the local 128 x 64 SkyFrame splash while Wi-Fi/config/display data is loading.
- Read device settings from the Cloudflare Worker.
- Fetch display data only when the screen is active.
- Listen for realtime config/display/sound events over WebSocket.
- Poll realtime/config endpoints as fallback.
- Send device heartbeat/status with Wi-Fi hostname, SSID, RSSI, IP, uptime, screen state, config OK and display OK.
- Download and cache missing logos from the Worker.
- Rotate locally between fetched flights.
- Render the 128 x 64 layout used by the web emulator.
- Render clock mode locally with seconds line, minute stack and thin 7-segment HH/MM/SS.
- Play PA/test sound and optional clock tick through ES8311/NS4150.
- Provision Wi-Fi through a local setup access point and captive portal when no credentials are stored, when saved credentials fail, or when BOOT is held during startup.
- Keep setup logic isolated in `src/WifiSetupManager.*` so display logic stays focused on rendering and data fetch.

## Device API

Firmware uses the public/device surface on the Worker:

```text
/public/realtime
/public/realtime-state
/public/device-config
/public/sound-state
/public/device-status
/public/display
/public/logos-rgb565/{CODE}.rgb565
```

If `DEVICE_API_TOKEN` is set in the Worker, define the same token in `include/WiFiSecrets.h`:

```cpp
#define FLIGHT_DEVICE_TOKEN "same-value-as-worker-secret"
```

The SSID/password constants in `WiFiSecrets.h` are no longer used for normal provisioning. Wi-Fi credentials are stored in ESP32 Preferences/NVS after setup, so they survive ordinary firmware updates.

## Wi-Fi Setup Mode

Setup mode starts automatically when:

- No Wi-Fi credentials are stored in Preferences/NVS.
- The saved Wi-Fi network cannot be reached or authenticated.
- BOOT is held while the board powers up or restarts.

When setup mode starts, the display shows:

```text
SETUP MODE
Connect to
SKYFRAME-SETUP
```

The boot splash and setup screens use the SkyFrame logo on black background. Status text is rendered underneath the logo.

After joining the setup network, a phone or laptop should be redirected to the captive portal automatically. If not, browse to:

```text
http://192.168.4.1
```

The portal lets you:

- Scan and select nearby Wi-Fi networks.
- Enter and save the Wi-Fi password.
- Retry cleanly if the password is wrong without rebooting the display.
- Forget saved Wi-Fi settings.

The setup access point is only active during setup mode. It is not exposed during normal display operation.

Current manual-trigger limitation:

- Supported: hold BOOT during startup to force setup mode.
- Not implemented: long-press BOOT while the firmware is already running.

## Hostname

When SkyFrame joins a normal Wi-Fi network, it sets a deterministic hostname based on the device MAC address:

```text
skyframe-<last-6-hex-of-mac>
```

Example:

```text
skyframe-d795f0
```

This hostname is what routers, DHCP leases, and network scanners may show on the LAN.

## Audio

PA/test audio uses `audioVolumePercent` from config. Clock tick uses `clockTickEnabled` and `clockTickVolumePercent`, and the tic sample is scaled independently from PA volume.

## Build And Upload

```bash
pio run -d firmware-hub75
pio run -d firmware-hub75 -t upload
```

Current verified upload/monitor port:

```text
/dev/cu.usbmodem2101
```
