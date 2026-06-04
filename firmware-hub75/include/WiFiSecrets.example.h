#pragma once

constexpr const char *WifiSsid = "your-wifi-ssid";
constexpr const char *WifiPassword = "your-wifi-password";
constexpr const char *WifiFallbackSsid = "";
constexpr const char *WifiFallbackPassword = "";

// Optional. Must match the Cloudflare Worker secret DEVICE_API_TOKEN when set.
#define FLIGHT_DEVICE_TOKEN "your-device-token"
