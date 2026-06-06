#include "WifiSetupManager.h"

namespace
{
constexpr const char *PreferencesNamespace = "wifi_setup";
constexpr const char *SsidKey = "ssid";
constexpr const char *PasswordKey = "password";
constexpr byte DnsReplyTtl = 60;
constexpr const char *CaptivePortalIp = "192.168.4.1";

String defaultHostname()
{
    char hostname[32] = {};
    const uint64_t efuseMac = ESP.getEfuseMac();
    snprintf(hostname, sizeof(hostname), "skyframe-%06llx",
             static_cast<unsigned long long>(efuseMac & 0xFFFFFFULL));
    return String(hostname);
}

void applyStationHostname()
{
    const String hostname = defaultHostname();
    WiFi.setHostname(hostname.c_str());
}
}

WifiSetupManager::WifiSetupManager()
    : webServer(80)
{
}

void WifiSetupManager::begin(const char *defaultAccessPointName, uint8_t setupButtonPin)
{
    accessPointSsid = (defaultAccessPointName && defaultAccessPointName[0] != '\0')
        ? String(defaultAccessPointName)
        : String("SKYFRAME-SETUP");
    setupPin = setupButtonPin;
    pinMode(setupPin, INPUT_PULLUP);
    forceSetupOnBoot = digitalRead(setupPin) == LOW;

    WiFi.persistent(false);
    WiFi.setAutoReconnect(false);
}

void WifiSetupManager::loop()
{
    if (!setupModeActive) return;
    dnsServer.processNextRequest();
    webServer.handleClient();
}

bool WifiSetupManager::shouldForceSetupOnBoot() const
{
    return forceSetupOnBoot;
}

bool WifiSetupManager::hasStoredCredentials() const
{
    String ssid;
    String password;
    return loadStoredCredentials(ssid, password);
}

bool WifiSetupManager::loadStoredCredentials(String &ssid, String &password) const
{
    ssid = readPreference(SsidKey);
    password = readPreference(PasswordKey);
    return !ssid.isEmpty();
}

void WifiSetupManager::clearCredentials()
{
    removePreference(SsidKey);
    removePreference(PasswordKey);
    notify(Event::CredentialsCleared);
}

bool WifiSetupManager::startSetupMode()
{
    if (setupModeActive) return true;

    WiFi.disconnect(true, true);
    delay(100);
    if (!ensureSetupAccessPoint())
    {
        Serial.println("Failed to start setup access point");
        return false;
    }

    dnsServer.setTTL(DnsReplyTtl);
    dnsServer.start(53, "*", WiFi.softAPIP());
    if (!routesConfigured)
    {
        configureRoutes();
        routesConfigured = true;
    }
    webServer.begin();

    setupModeActive = true;
    rebootRequested = false;
    notify(Event::SetupModeStarted, accessPointSsid, WiFi.softAPIP().toString());
    Serial.print("Setup AP started: ");
    Serial.print(accessPointSsid);
    Serial.print(" at ");
    Serial.println(WiFi.softAPIP());
    return true;
}

void WifiSetupManager::stopSetupMode()
{
    if (!setupModeActive) return;

    dnsServer.stop();
    webServer.stop();
    WiFi.softAPdisconnect(true);
    setupModeActive = false;
}

bool WifiSetupManager::isSetupModeActive() const
{
    return setupModeActive;
}

wl_status_t WifiSetupManager::connectToWiFi(const String &ssid, const String &password, uint32_t timeoutMs, bool keepAccessPointRunning)
{
    const wifi_mode_t mode = keepAccessPointRunning ? WIFI_AP_STA : WIFI_STA;
    WiFi.mode(mode);
    WiFi.setSleep(false);
    applyStationHostname();
    WiFi.disconnect(false, false);
    delay(100);
    WiFi.begin(ssid.c_str(), password.c_str());

    const uint32_t startedAt = millis();
    while (millis() - startedAt < timeoutMs)
    {
        const wl_status_t status = WiFi.status();
        if (status == WL_CONNECTED)
        {
            return status;
        }
        if (status == WL_CONNECT_FAILED || status == WL_NO_SSID_AVAIL || status == WL_CONNECTION_LOST)
        {
            return status;
        }
        delay(250);
    }

    return WiFi.status();
}

void WifiSetupManager::setEventCallback(EventCallback callback)
{
    eventCallback = callback;
}

const String &WifiSetupManager::accessPointName() const
{
    return accessPointSsid;
}

IPAddress WifiSetupManager::accessPointIp() const
{
    return WiFi.softAPIP();
}

bool WifiSetupManager::shouldReboot() const
{
    return rebootRequested;
}

void WifiSetupManager::clearRebootRequest()
{
    rebootRequested = false;
}

void WifiSetupManager::openPreferences() const
{
    const_cast<Preferences &>(preferences).begin(PreferencesNamespace, false);
}

String WifiSetupManager::readPreference(const char *key) const
{
    openPreferences();
    const String value = preferences.getString(key, "");
    preferences.end();
    return value;
}

void WifiSetupManager::writePreference(const char *key, const String &value)
{
    openPreferences();
    preferences.putString(key, value);
    preferences.end();
}

void WifiSetupManager::removePreference(const char *key)
{
    openPreferences();
    preferences.remove(key);
    preferences.end();
}

void WifiSetupManager::configureRoutes()
{
    webServer.on("/", HTTP_GET, [this]() { handleRoot(); });
    webServer.on("/scan", HTTP_GET, [this]() { handleScan(); });
    webServer.on("/save", HTTP_POST, [this]() { handleSave(); });
    webServer.on("/forget", HTTP_POST, [this]() { handleForget(); });
    webServer.on("/generate_204", HTTP_ANY, [this]() { sendRedirect("/"); });
    webServer.on("/hotspot-detect.html", HTTP_ANY, [this]() { sendRedirect("/"); });
    webServer.on("/canonical.html", HTTP_ANY, [this]() { sendRedirect("/"); });
    webServer.on("/ncsi.txt", HTTP_ANY, [this]() { sendRedirect("/"); });
    webServer.on("/success.txt", HTTP_ANY, [this]() { sendRedirect("/"); });
    webServer.onNotFound([this]() { handleNotFound(); });
}

void WifiSetupManager::handleRoot()
{
    webServer.send(200, "text/html", buildPortalPage());
}

void WifiSetupManager::handleScan()
{
    webServer.send(200, "application/json", buildScanJson());
}

void WifiSetupManager::handleSave()
{
    const String ssid = webServer.arg("ssid");
    const String password = webServer.arg("password");

    if (ssid.isEmpty())
    {
        webServer.send(400, "text/html", buildPortalPage("Choose a Wi-Fi network first.", false));
        return;
    }

    notify(Event::SetupConnectAttempt, ssid, "");
    Serial.print("Setup portal trying Wi-Fi SSID: ");
    Serial.println(ssid);

    const wl_status_t status = connectToWiFi(ssid, password, SetupConnectTimeoutMs, true);
    if (status == WL_CONNECTED)
    {
        saveCredentials(ssid, password);
        const String ip = WiFi.localIP().toString();
        notify(Event::SetupConnectSuccess, ssid, ip);
        webServer.send(200, "text/html", buildPortalPage("Connected successfully. The display is restarting now.", true, ssid));
        delay(1200);
        stopSetupMode();
        rebootRequested = true;
        return;
    }

    WiFi.disconnect(false, false);
    delay(100);
    ensureSetupAccessPoint();
    notify(Event::SetupConnectFailed, ssid, String(static_cast<int>(status)));
    webServer.send(200, "text/html", buildPortalPage("Connection failed. Check the password and try again.", false, ssid));
}

void WifiSetupManager::handleForget()
{
    clearCredentials();
    webServer.send(200, "text/html", buildPortalPage("Saved Wi-Fi settings were removed.", false));
}

void WifiSetupManager::handleNotFound()
{
    sendRedirect("/");
}

String WifiSetupManager::buildPortalPage(const String &message, bool success, const String &selectedSsid) const
{
    String html;
    html.reserve(7000);
    html += F(
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<title>SkyFrame Setup</title>"
        "<style>"
        ":root{color-scheme:light only;--bg:#f4f7fb;--card:#ffffff;--ink:#13233a;--muted:#5f6f86;--accent:#0b84ff;--accent-2:#0fd18a;--danger:#e35151;--line:#d9e2ef;}"
        "*{box-sizing:border-box}body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(180deg,#edf4ff 0%,#f7fbff 100%);color:var(--ink)}"
        ".wrap{max-width:560px;margin:0 auto;padding:24px 16px 40px}"
        ".card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 18px 60px rgba(19,35,58,.08)}"
        "h1{margin:0 0 8px;font-size:28px;letter-spacing:.02em}p{margin:0 0 14px;color:var(--muted);line-height:1.5}"
        ".pill{display:inline-block;padding:6px 10px;border-radius:999px;background:#e9f3ff;color:#0b5fcc;font-size:13px;font-weight:700;margin-bottom:14px}"
        ".msg{padding:12px 14px;border-radius:12px;margin:14px 0;font-weight:600;background:#fff7df;color:#7a5a00}"
        ".msg.ok{background:#e9fff5;color:#0d7a52}"
        "label{display:block;font-size:14px;font-weight:700;margin:16px 0 8px}"
        "select,input{width:100%;padding:14px 12px;border:1px solid var(--line);border-radius:12px;font-size:16px;background:#fff;color:var(--ink)}"
        "button{width:100%;border:0;border-radius:12px;padding:14px 16px;font-size:16px;font-weight:700;cursor:pointer;margin-top:16px}"
        ".primary{background:var(--accent);color:#fff}.secondary{background:#edf3fb;color:var(--ink)}.danger{background:#fff1f1;color:var(--danger)}"
        ".row{display:grid;gap:12px}.footer{font-size:13px;color:var(--muted);margin-top:16px}"
        "</style></head><body><div class='wrap'><div class='card'>"
        "<div class='pill'>SKYFRAME SETUP</div><h1>Connect your display</h1>"
        "<p>Join this temporary SkyFrame Wi-Fi, choose your home network, enter the password, and the display will reconnect automatically.</p>");

    html += "<p><strong>Setup network:</strong> ";
    html += htmlEscape(accessPointSsid);
    html += "<br><strong>Setup page:</strong> http://";
    html += WiFi.softAPIP().toString();
    html += "</p>";

    if (!message.isEmpty())
    {
        html += "<div class='msg";
        if (success) html += " ok";
        html += "'>";
        html += htmlEscape(message);
        html += "</div>";
    }

    html += "<form method='post' action='/save'><label for='ssid'>Wi-Fi network</label><select id='ssid' name='ssid'>";
    html += "<option value=''>Choose a network</option>";

    NetworkEntry entries[MaxVisibleNetworks];
    const size_t count = collectVisibleNetworks(entries, MaxVisibleNetworks);
    for (size_t index = 0; index < count; ++index)
    {
        const String currentSsid = entries[index].ssid;
        if (currentSsid.isEmpty()) continue;

        html += "<option value='";
        html += htmlEscape(currentSsid);
        html += "'";
        if (!selectedSsid.isEmpty() && currentSsid == selectedSsid)
        {
            html += " selected";
        }
        html += ">";
        html += htmlEscape(currentSsid);
        html += " (";
        html += String(entries[index].rssi);
        html += " dBm";
        if (entries[index].authMode == WIFI_AUTH_OPEN) html += ", open";
        html += ")";
        html += "</option>";
    }

    html += F(
        "</select><label for='password'>Password</label>"
        "<input id='password' name='password' type='password' autocomplete='current-password' placeholder='Enter Wi-Fi password'>"
        "<button class='primary' type='submit'>Save and connect</button></form>"
        "<form method='get' action='/'><button class='secondary' type='submit'>Refresh network list</button></form>"
        "<form method='post' action='/forget'><button class='danger' type='submit'>Forget saved Wi-Fi</button></form>"
        "<div class='footer'>If the page does not open automatically, browse to the setup IP shown above.</div>"
        "</div></div></body></html>");
    return html;
}

String WifiSetupManager::buildScanJson()
{
    NetworkEntry entries[MaxVisibleNetworks];
    const size_t count = collectVisibleNetworks(entries, MaxVisibleNetworks);

    String json = "[";
    for (size_t index = 0; index < count; ++index)
    {
        if (index > 0) json += ",";
        json += "{\"ssid\":\"";
        json += htmlEscape(entries[index].ssid);
        json += "\",\"rssi\":";
        json += String(entries[index].rssi);
        json += ",\"open\":";
        json += entries[index].authMode == WIFI_AUTH_OPEN ? "true" : "false";
        json += "}";
    }
    json += "]";
    return json;
}

void WifiSetupManager::sendRedirect(const String &target)
{
    webServer.sendHeader("Location", target, true);
    webServer.send(302, "text/plain", "");
}

void WifiSetupManager::notify(Event event, const String &primary, const String &secondary) const
{
    if (eventCallback != nullptr)
    {
        eventCallback(event, primary, secondary);
    }
}

void WifiSetupManager::saveCredentials(const String &ssid, const String &password)
{
    writePreference(SsidKey, ssid);
    writePreference(PasswordKey, password);
}

String WifiSetupManager::htmlEscape(const String &value) const
{
    String escaped = value;
    escaped.replace("&", "&amp;");
    escaped.replace("\"", "&quot;");
    escaped.replace("'", "&#39;");
    escaped.replace("<", "&lt;");
    escaped.replace(">", "&gt;");
    return escaped;
}

size_t WifiSetupManager::collectVisibleNetworks(NetworkEntry *entries, size_t maxEntries) const
{
    if (entries == nullptr || maxEntries == 0) return 0;

    const int found = WiFi.scanNetworks(false, true, false, 200, 0);
    size_t count = 0;
    for (int index = 0; index < found && count < maxEntries; ++index)
    {
        const String ssid = WiFi.SSID(index);
        if (ssid.isEmpty()) continue;

        bool duplicate = false;
        for (size_t existing = 0; existing < count; ++existing)
        {
            if (entries[existing].ssid == ssid)
            {
                duplicate = true;
                if (WiFi.RSSI(index) > entries[existing].rssi)
                {
                    entries[existing].rssi = WiFi.RSSI(index);
                    entries[existing].authMode = WiFi.encryptionType(index);
                }
                break;
            }
        }
        if (duplicate) continue;

        entries[count].ssid = ssid;
        entries[count].rssi = WiFi.RSSI(index);
        entries[count].authMode = WiFi.encryptionType(index);
        ++count;
    }
    WiFi.scanDelete();

    for (size_t i = 0; i < count; ++i)
    {
        for (size_t j = i + 1; j < count; ++j)
        {
            if (entries[j].rssi > entries[i].rssi)
            {
                const NetworkEntry temp = entries[i];
                entries[i] = entries[j];
                entries[j] = temp;
            }
        }
    }

    return count;
}

bool WifiSetupManager::ensureSetupAccessPoint()
{
    WiFi.mode(WIFI_AP_STA);
    WiFi.setSleep(false);

    const IPAddress apIp(192, 168, 4, 1);
    const IPAddress netmask(255, 255, 255, 0);
    if (!WiFi.softAPConfig(apIp, apIp, netmask))
    {
        return false;
    }

    if (WiFi.softAPSSID() != accessPointSsid)
    {
        if (!WiFi.softAP(accessPointSsid.c_str()))
        {
            return false;
        }
    }

    return true;
}
