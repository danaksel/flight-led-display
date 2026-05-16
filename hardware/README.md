# Hardware Notes

## Display

- Panel: P2.5 HUB75 RGB matrix
- Resolution: 128 x 64 pixels
- Physical size: 320 x 160 mm
- Pixel pitch: 2.5 mm

## Controller

- Board: Waveshare ESP32-S3-RGB-Matrix
- Role: HUB75 display controller, Wi-Fi client, logo cache, local flight rotation

## Power

- Use a separate 5V supply sized for the HUB75 panel.
- Do not power the panel from the ESP32 USB port.

## Runtime Contract

The firmware should be a mostly dumb display client:

- Read device settings from the Cloudflare Worker.
- Fetch flight data only when enabled and outside night mode.
- Cache logos locally after first download.
- Rotate between fetched flights locally without extra API calls.

