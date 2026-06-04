# HUB75 Firmware

Target firmware for the Waveshare ESP32-S3-RGB-Matrix controller and a 128 x 64 P2.5 HUB75 panel.

Planned responsibilities:

- Show the local 128 x 64 boot splash while Wi-Fi/config/display data is loading.
- Read device settings from the Cloudflare Worker.
- Fetch display data only when the screen is active.
- Download and cache missing logos from the Worker.
- Rotate locally between fetched flights.
- Render the 128 x 64 layout used by the web emulator.
