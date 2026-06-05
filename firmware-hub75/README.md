# HUB75 Firmware

Target firmware for the Waveshare ESP32-S3-RGB-Matrix controller and a 128 x 64 P2.5 HUB75 panel.

## Responsibilities

- Show the local 128 x 64 boot splash while Wi-Fi/config/display data is loading.
- Read device settings from the Cloudflare Worker.
- Fetch display data only when the screen is active.
- Listen for realtime config/display/sound events over WebSocket.
- Poll realtime/config endpoints as fallback.
- Send device heartbeat/status with Wi-Fi SSID, RSSI, IP, uptime, screen state, config OK and display OK.
- Download and cache missing logos from the Worker.
- Rotate locally between fetched flights.
- Render the 128 x 64 layout used by the web emulator.
- Render clock mode locally with seconds line, minute stack and thin 7-segment HH/MM/SS.
- Play PA/test sound and optional clock tick through ES8311/NS4150.

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

## Audio

PA/test audio uses `audioVolumePercent` from config. Clock tick uses `clockTickEnabled` and `clockTickVolumePercent`, and the tic sample is scaled independently from PA volume.

## Build And Upload

```bash
pio run -d firmware-hub75
pio run -d firmware-hub75 -t upload
```

Current verified upload/monitor port:

```text
/dev/cu.usbmodem101
```
