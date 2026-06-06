#pragma once

// Wi-Fi credentials are now stored on the device through setup mode.
// These placeholders remain only so existing local headers keep compiling.
constexpr const char *WifiSsid = "";
constexpr const char *WifiPassword = "";
constexpr const char *WifiFallbackSsid = "";
constexpr const char *WifiFallbackPassword = "";
constexpr const char *WifiThirdSsid = "";
constexpr const char *WifiThirdPassword = "";

// Optional. Must match the Cloudflare Worker secret DEVICE_API_TOKEN when set.
#define FLIGHT_DEVICE_TOKEN "your-device-token"
