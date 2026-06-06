#pragma once

#include <Arduino.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <WebServer.h>
#include <WiFi.h>

class WifiSetupManager
{
public:
    enum class Event
    {
        SetupModeStarted,
        SetupConnectAttempt,
        SetupConnectSuccess,
        SetupConnectFailed,
        CredentialsCleared
    };

    using EventCallback = void (*)(Event event, const String &primary, const String &secondary);

    WifiSetupManager();

    void begin(const char *defaultAccessPointName = "SKYFRAME-SETUP", uint8_t setupButtonPin = 0);
    void loop();

    bool shouldForceSetupOnBoot() const;
    bool hasStoredCredentials() const;
    bool loadStoredCredentials(String &ssid, String &password) const;
    void clearCredentials();

    bool startSetupMode();
    void stopSetupMode();
    bool isSetupModeActive() const;

    wl_status_t connectToWiFi(const String &ssid, const String &password, uint32_t timeoutMs, bool keepAccessPointRunning = false);

    void setEventCallback(EventCallback callback);
    const String &accessPointName() const;
    IPAddress accessPointIp() const;

    bool shouldReboot() const;
    void clearRebootRequest();

private:
    struct NetworkEntry
    {
        String ssid;
        int32_t rssi = -100;
        wifi_auth_mode_t authMode = WIFI_AUTH_OPEN;
    };

    static constexpr uint8_t MaxVisibleNetworks = 12;
    static constexpr uint32_t SetupConnectTimeoutMs = 15000;

    mutable Preferences preferences;
    DNSServer dnsServer;
    WebServer webServer;
    String accessPointSsid;
    uint8_t setupPin = 0;
    bool forceSetupOnBoot = false;
    bool setupModeActive = false;
    bool rebootRequested = false;
    bool routesConfigured = false;
    EventCallback eventCallback = nullptr;

    void openPreferences() const;
    String readPreference(const char *key) const;
    void writePreference(const char *key, const String &value);
    void removePreference(const char *key);

    void configureRoutes();
    void handleRoot();
    void handleScan();
    void handleSave();
    void handleForget();
    void handleNotFound();

    String buildPortalPage(const String &message = "", bool success = false, const String &selectedSsid = "") const;
    String buildScanJson();
    void sendRedirect(const String &target);
    void notify(Event event, const String &primary = "", const String &secondary = "") const;
    void saveCredentials(const String &ssid, const String &password);
    String htmlEscape(const String &value) const;
    size_t collectVisibleNetworks(NetworkEntry *entries, size_t maxEntries) const;
    bool ensureSetupAccessPoint();
};
