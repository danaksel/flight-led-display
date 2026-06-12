#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP32-HUB75-MatrixPanel-I2S-DMA.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <Update.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h>
#include <Wire.h>
#include <driver/i2s.h>
#include <mbedtls/sha256.h>
#include <sys/time.h>
#include "WiFiSecrets.h"
#include "WifiSetupManager.h"
#include "pa_audio.h"
#include "splash_image.h"

namespace
{
constexpr uint16_t PanelWidth = 128;
constexpr uint16_t PanelHeight = 64;
constexpr uint8_t Brightness = 8;
constexpr const char *SKYFRAME_FW_VERSION = "V1.15";
constexpr char DegreeGlyph = '\x01';
constexpr const char *DeviceConfigUrl = "https://skyframe.danaksel.no/public/device-config";
constexpr const char *SoundStateUrl = "https://skyframe.danaksel.no/public/sound-state";
constexpr const char *RealtimeStateUrl = "https://skyframe.danaksel.no/public/realtime-state";
constexpr const char *DeviceStatusUrl = "https://skyframe.danaksel.no/public/device-status";
constexpr const char *FirmwareLatestUrl = "https://skyframe.danaksel.no/public/firmware/latest.json";
constexpr const char *DisplayUrl = "https://skyframe.danaksel.no/public/display";
constexpr const char *ProvisionStartUrl = "https://skyframe.danaksel.no/public/provision/start";
constexpr const char *ProvisionStatusUrl = "https://skyframe.danaksel.no/public/provision/status";
constexpr const char *ServerBaseUrl = "https://skyframe.danaksel.no";
constexpr const char *RealtimeHost = "skyframe.danaksel.no";
constexpr const char *RealtimePath = "/public/realtime";
constexpr const char *WorkerTlsRootCa = R"EOF(
-----BEGIN CERTIFICATE-----
MIICCTCCAY6gAwIBAgINAgPlwGjvYxqccpBQUjAKBggqhkjOPQQDAzBHMQswCQYD
VQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEUMBIG
A1UEAxMLR1RTIFJvb3QgUjQwHhcNMTYwNjIyMDAwMDAwWhcNMzYwNjIyMDAwMDAw
WjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2Vz
IExMQzEUMBIGA1UEAxMLR1RTIFJvb3QgUjQwdjAQBgcqhkjOPQIBBgUrgQQAIgNi
AATzdHOnaItgrkO4NcWBMHtLSZ37wWHO5t5GvWvVYRg1rkDdc/eJkTBa6zzuhXyi
QHY7qca4R9gq55KRanPpsXI5nymfopjTX15YhmUPoYRlBtHci8nHc8iMai/lxKvR
HYqjQjBAMA4GA1UdDwEB/wQEAwIBhjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQW
BBSATNbrdP9JNqPV2Py1PsVq8JQdjDAKBggqhkjOPQQDAwNpADBmAjEA6ED/g94D
9J+uHXqnLrmvT/aDHQ4thQEd0dlq7A/Cr8deVl5c1RxYIigL9zC2L7F8AjEA8GE8
p/SgguMh1YQdc4acLa/KNJvxn7kjNuK8YAOdgLOaVsjh4rsUecrNIdSUtUlD
-----END CERTIFICATE-----
)EOF";
constexpr const char *OsloTimeZone = "CET-1CEST,M3.5.0/2,M10.5.0/3";
constexpr uint8_t MaxIdleScreens = 20;
constexpr uint8_t MaxIdleRows = 4;
constexpr uint8_t LogoWidth = 42;
constexpr uint8_t LogoHeight = 42;
constexpr size_t LogoBytes = LogoWidth * LogoHeight * 2;
constexpr uint8_t LogoColorDepthBits = 8;
constexpr uint8_t ClockSecondsStartX = 4;
constexpr uint8_t ClockSecondsEndX = 63;
constexpr uint8_t ClockSecondsWidth = ClockSecondsEndX - ClockSecondsStartX + 1;
constexpr uint8_t ClockActiveRowY = 3;
constexpr uint8_t ClockStackTopY = 4;
constexpr uint8_t ClockStackBottomY = 62;
constexpr uint8_t ClockTextStartX = 69;
constexpr uint8_t ClockTextTopY = 3;
constexpr uint8_t ClockTextMiddleY = 24;
constexpr uint8_t ClockTextBottomY = 45;
constexpr uint8_t ClockDigitWidth = 25;
constexpr uint8_t ClockDigitHeight = 17;
constexpr uint8_t ClockDigitAdvance = 30;
constexpr uint16_t ClockMinuteFallMs = 400;
constexpr uint16_t TickerHoldMs = 900;
constexpr uint32_t AudioSampleRate = 16000;
constexpr uint8_t AudioVolumePercentDefault = 5;
constexpr uint8_t ClockTickVolumePercentDefault = 20;
constexpr uint8_t ClockRenderIntervalMs = 15;
constexpr uint8_t RealtimeStatePollSeconds = 5;
constexpr uint32_t DeviceStatusIntervalMs = 120000;
constexpr uint16_t TimetableKindTransitionDefaultMs = 400;
constexpr int16_t TimetableRowsTopY = 15;
constexpr int16_t TimetableRowsBottomY = 64;
constexpr uint8_t MainLoopDelayMs = 20;
constexpr uint8_t WifiReconnectSeconds = 30;
constexpr uint32_t OtaPollIntervalMs = 6UL * 60UL * 60UL * 1000UL;
constexpr uint32_t OtaRetryIntervalMs = 30UL * 60UL * 1000UL;
constexpr uint32_t OtaDownloadTimeoutMs = 120000UL;
constexpr uint32_t OtaNetworkLockWaitMs = 15000UL;
constexpr uint32_t NetworkPollTaskStackBytes = 10000;
constexpr uint32_t SoundPollTaskStackBytes = 20000;
constexpr uint8_t SetupButtonPin = 0;
constexpr uint32_t WifiConnectTimeoutMs = 6500;
constexpr uint16_t ConfigFallbackPollSeconds = 300;
constexpr const char *BrandName = "SKYFRAME";
constexpr const char *SetupAccessPointName = "SKYFRAME-SETUP";
constexpr uint8_t SpeakerI2cSdaPin = 47;
constexpr uint8_t SpeakerI2cSclPin = 48;
constexpr uint8_t SpeakerMclkPin = 12;
constexpr uint8_t SpeakerBclkPin = 43;
constexpr uint8_t SpeakerWsPin = 38;
constexpr uint8_t SpeakerDataOutPin = 21;
constexpr uint8_t SpeakerDataInPin = 39;
constexpr uint8_t SpeakerAmpPin = 11;
constexpr uint8_t Es8311Address = 0x18;
constexpr size_t AudioChunkFrames = 128;
constexpr i2s_port_t AudioI2sPort = I2S_NUM_0;

struct IdleRow
{
    String flightId;
    String airport;
    String time;
    String status;
    String gate;
    String gateMessage;
    String message;
};

struct IdleScreen
{
    String title;
    String kind;
    IdleRow rows[MaxIdleRows];
    uint8_t rowCount = 0;
};

struct FirmwareManifest
{
    String version;
    String url;
    String sha256;
    size_t size = 0;
};

MatrixPanel_I2S_DMA *display = nullptr;
WebSocketsClient realtimeSocket;
WifiSetupManager wifiSetupManager;
Preferences devicePreferences;
uint32_t nextConfigFetchAt = 0;
uint32_t nextDisplayFetchAt = 0;
uint32_t nextWifiReconnectAt = 0;
uint32_t nextIdleCycleAt = 0;
uint32_t nextLiveCycleAt = 0;
uint32_t idleCycleStartedAt = 0;
uint32_t idleOutroStartedAt = 0;
uint32_t liveCycleStartedAt = 0;
uint32_t lastHeartbeatAt = 0;
uint32_t lastIdleRenderAt = 0;
uint32_t lastLiveRenderAt = 0;
uint16_t configRefreshSeconds = 300;
uint16_t displayPollSeconds = 60;
uint16_t displayCycleSeconds = 5;
uint16_t timetableCycleSeconds = 10;
uint16_t liveScrollPixelsPerSecond = 9;
uint16_t timetableScrollPixelsPerSecond = 18;
uint16_t timetableTransitionMs = TimetableKindTransitionDefaultMs;
IdleScreen idleScreens[MaxIdleScreens];
uint8_t idleScreenCount = 0;
uint8_t currentIdleScreen = 0;
uint8_t currentLiveFlight = 0;
bool idleKindIntroActive = false;
bool idleOutroActive = false;
bool lastConfigOk = false;
bool lastDisplayOk = false;
String lastDisplayMode;
int lastHttpCode = 0;
bool idleLayoutActive = false;
bool liveLayoutActive = false;
bool clockLayoutActive = false;
bool configFetchActive = false;
bool displayFetchActive = false;
bool startupSplashActive = true;
bool wifiOfflineNotified = false;
uint8_t logoBuffer[LogoBytes] = {};
String cachedLogoUrl;
uint32_t cachedLogoCheckedAt = 0;
bool cachedLogoOk = false;
JsonDocument currentDisplayDoc;
bool audioInitAttempted = false;
bool audioReady = false;
bool audioI2sReady = false;
bool audioPlaying = false;
bool liveFlightsPreviouslyVisible = false;
bool audioTestNonceSeen = false;
uint8_t audioVolumePercent = AudioVolumePercentDefault;
uint8_t activeAudioVolumePercent = AudioVolumePercentDefault;
int8_t audioI2cSdaPin = -1;
int8_t audioI2cSclPin = -1;
uint32_t lastSoundTestNonce = 0;
uint32_t lastDeviceStatusSentAt = 0;
uint32_t lastDeviceStatusPostedAt = 0;
uint32_t lastClockRenderAt = 0;
uint32_t clockFallingStartedAt = 0;
int8_t lastClockMinute = -1;
int8_t lastClockSecond = -1;
int8_t fallingClockMinuteIndex = -1;
size_t audioPlaybackOffset = 0;
int16_t audioChunkBuffer[AudioChunkFrames * 2] = {};
TaskHandle_t soundPollTaskHandle = nullptr;
TaskHandle_t networkPollTaskHandle = nullptr;
TaskHandle_t realtimeTaskHandle = nullptr;
SemaphoreHandle_t networkMutex = nullptr;
SemaphoreHandle_t pendingPayloadMutex = nullptr;
bool configFetchRequested = false;
bool displayFetchRequested = false;
bool pendingConfigReady = false;
bool pendingDisplayReady = false;
bool pendingConfigOk = false;
bool pendingDisplayOk = false;
int pendingConfigHttpCode = 0;
int pendingDisplayHttpCode = 0;
String pendingConfigBody;
String pendingDisplayBody;
String realtimeExtraHeaders;
String deviceAuthToken;
String provisionPairingCode;
String provisionScreenId;
String provisionDeviceId;
uint32_t nextProvisionPollAt = 0;
uint32_t provisioningDisplayStartedAt = 0;
uint32_t provisioningDisplayLastDrawAt = 0;
bool provisioningDisplayActive = false;
bool realtimeConfigured = false;
volatile bool realtimePausedForHttp = false;
String lastRealtimeConfigVersion;
String lastRealtimeScreenVersion;
uint32_t lastRealtimeSoundNonce = 0;
uint32_t lastDeviceCommandNonce = 0;
bool realtimeStateSeen = false;
String otaStatus = "idle";
String lastOtaError;
String lastOtaVersion;
uint32_t lastOtaCheckedAt = 0;
uint32_t otaStartedAt = 0;
bool otaUpdateRequested = false;

void drawIdleScreen(uint8_t index);
void drawCurrentLiveFlight();
void drawMarinePayload(JsonObject flight, size_t itemCount);
void fetchSoundState();
void soundPollTask(void *);
void networkPollTask(void *);
void realtimeTask(void *);
String buildDeviceStatusPayload();
void postDeviceStatusIfDue();
void sendDeviceStatus();
bool requestConfigFetch();
bool requestDisplayFetch();
void queuePaSound(const char *reason);
void handleRemoteSoundState(uint32_t remoteSoundTestNonce, uint8_t nextAudioVolumePercent);
uint8_t percentToEs8311Volume(uint8_t percent);
bool ensureAudioReady();
bool readLocalTime(struct tm &timeinfo);
void drawFetchIndicator();
void enterSetupMode(const char *reason);
void handleSetupManagerEvent(WifiSetupManager::Event event, const String &primary, const String &secondary);
void drawBrandedStatusLines(const char *title, const char *line1, const char *line2, const char *line3, uint16_t color);
String defaultHostname();
void applyStationHostname();
void loadDeviceProvisioning();
bool hasDeviceToken();
String hardwareId();
bool ensureProvisioned();
bool startProvisioning();
bool pollProvisioningStatus(bool drawStatus);
void saveDeviceToken(const String &token, const String &screenId, const String &deviceId);
void clearDeviceProvisioning();
void rememberDeviceCommandNonce(uint32_t nonce);
void executeDeviceCommand(const String &command, uint32_t nonce);
void handleDeviceCommandPayload(JsonVariantConst value);
void drawProvisioningStatus();
void updateProvisioningStatusDisplay();
String absoluteUrl(const String &url);
void requestOtaUpdate();
void checkFirmwareUpdate(bool forced);
bool performOtaUpdate(const FirmwareManifest &manifest);
bool parseFirmwareManifest(const String &body, FirmwareManifest &manifest);
bool isVersionNewer(const String &latest, const String &current);
String sha256ToHex(const uint8_t *digest);
bool isValidSha256Hex(const String &value);

void startRealtimeTaskIfNeeded()
{
    // Persistent WSS is available in the Worker, but the ESP32 keeps this
    // disabled because a second live TLS socket destabilizes logo/display fetches.
}

void pauseRealtimeForHttp()
{
    realtimePausedForHttp = true;
    realtimeSocket.disconnect();
    delay(250);
    const uint32_t startedAt = millis();
    while (realtimeSocket.isConnected() && millis() - startedAt < 1500)
    {
        realtimeSocket.disconnect();
        delay(50);
    }
}

void resumeRealtimeAfterHttp()
{
    realtimePausedForHttp = false;
}

uint16_t panelColor(uint8_t r, uint8_t g, uint8_t b)
{
    return display->color565(r, g, b);
}

uint16_t timetableHeaderColor = 0;
uint16_t timetableDataColor = 0;
uint16_t timetableTimeColor = 0;
uint16_t timetableNewTimeColor = 0;
uint16_t timetableCanceledColor = 0;
uint16_t timetableGateGoToGateColor = 0;
uint16_t timetableGateBoardingColor = 0;
uint16_t timetableGateClosingColor = 0;
uint16_t timetableGateClosedColor = 0;
uint16_t timetableLandedColor = 0;
uint16_t lineAirlineColor = 0;
uint16_t lineRouteColor = 0;
uint16_t lineAircraftColor = 0;
uint16_t lineContextColor = 0;
uint16_t lineProgressColor = 0;
uint16_t lineRouteProgressColor = 0;
uint16_t lineLandColor = 0;
uint16_t lineIconColor = 0;
uint8_t clockGradientBottomR = 0x08;
uint8_t clockGradientBottomG = 0x1B;
uint8_t clockGradientBottomB = 0x6B;
uint8_t clockGradientTopR = 0xFF;
uint8_t clockGradientTopG = 0xFF;
uint8_t clockGradientTopB = 0xFF;
String deviceTimeZone = "Europe/Oslo";
String deviceTimeZonePosix = OsloTimeZone;
bool screenActive = true;
String brightnessMode = "day";
uint8_t effectiveBrightness = Brightness;
uint32_t screenInactiveSince = 0;
bool lastOffIndicatorVisible = false;

uint16_t colorHeader()
{
    return timetableHeaderColor ? timetableHeaderColor : panelColor(0xF7, 0xB5, 0x00);
}

uint16_t colorFetchIndicator()
{
    return panelColor(0x03, 0x03, 0x03);
}

uint16_t colorData()
{
    return timetableDataColor ? timetableDataColor : panelColor(0xF4, 0xF7, 0xFF);
}

uint16_t colorCanceled()
{
    return timetableCanceledColor ? timetableCanceledColor : panelColor(0xFF, 0x3B, 0x30);
}

uint16_t colorGateGoToGate()
{
    return timetableGateGoToGateColor ? timetableGateGoToGateColor : panelColor(0x00, 0xF9, 0x00);
}

uint16_t colorGateBoarding()
{
    return timetableGateBoardingColor ? timetableGateBoardingColor : panelColor(0x00, 0xF9, 0x00);
}

uint16_t colorGateClosing()
{
    return timetableGateClosingColor ? timetableGateClosingColor : panelColor(0xFF, 0x93, 0x00);
}

uint16_t colorGateClosed()
{
    return timetableGateClosedColor ? timetableGateClosedColor : panelColor(0xFF, 0x26, 0x00);
}

uint16_t colorLanded()
{
    return timetableLandedColor ? timetableLandedColor : panelColor(0x00, 0xF9, 0x00);
}

uint16_t colorSuccess()
{
    return panelColor(0x00, 0xFF, 0x00);
}

uint16_t colorProgressDim()
{
    return panelColor(0x3C, 0x3C, 0x3C);
}

uint16_t colorRouteProgressDim()
{
    return panelColor(0x3C, 0x3C, 0x3C);
}

uint16_t colorRouteProgressFill()
{
    return lineRouteProgressColor ? lineRouteProgressColor : panelColor(0x00, 0xD4, 0x6A);
}

uint16_t colorProgressFill()
{
    return lineProgressColor ? lineProgressColor : panelColor(0xF7, 0xB5, 0x00);
}

void presentFrame()
{
    if (display)
    {
        display->flipDMABuffer();
    }
}

bool audioWriteRegister(uint8_t reg, uint8_t value)
{
    Wire1.beginTransmission(Es8311Address);
    Wire1.write(reg);
    Wire1.write(value);
    return Wire1.endTransmission() == 0;
}

bool probeEs8311Bus(uint8_t sda, uint8_t scl)
{
    Wire1.end();
    Wire1.begin(sda, scl);
    Wire1.setClock(100000);
    Wire1.beginTransmission(Es8311Address);
    const bool ok = Wire1.endTransmission() == 0;
    if (ok)
    {
        audioI2cSdaPin = static_cast<int8_t>(sda);
        audioI2cSclPin = static_cast<int8_t>(scl);
    }
    return ok;
}

int audioReadRegister(uint8_t reg)
{
    Wire1.beginTransmission(Es8311Address);
    Wire1.write(reg);
    if (Wire1.endTransmission(false) != 0) return -1;
    if (Wire1.requestFrom(static_cast<int>(Es8311Address), 1) != 1) return -1;
    return Wire1.read();
}

bool audioWriteRegisterChecked(uint8_t reg, uint8_t value)
{
    const bool ok = audioWriteRegister(reg, value);
    if (!ok)
    {
        Serial.print("Audio I2C write failed reg=0x");
        Serial.println(reg, HEX);
    }
    return ok;
}

void setCodecVolume(uint8_t percent)
{
    activeAudioVolumePercent = constrain(percent, static_cast<uint8_t>(0), static_cast<uint8_t>(100));
    if (!audioReady) return;
    audioWriteRegisterChecked(0x32, percentToEs8311Volume(activeAudioVolumePercent));
}

uint8_t percentToEs8311Volume(uint8_t percent)
{
    if (percent == 0) return 0;
    const float normalized = static_cast<float>(percent) / 100.0f;
    const float scaled = log10f(1.0f + 9.0f * normalized) / log10f(10.0f);
    return static_cast<uint8_t>(roundf(constrain(scaled * 255.0f, 0.0f, 255.0f)));
}

void applyAudioVolume(uint8_t percent)
{
    audioVolumePercent = constrain(percent, static_cast<uint8_t>(0), static_cast<uint8_t>(100));
    setCodecVolume(audioVolumePercent);
}

bool initEs8311CodecFromMclk()
{
    bool ok = true;

    ok &= audioWriteRegisterChecked(0x01, 0x30);
    ok &= audioWriteRegisterChecked(0x02, 0x00);
    ok &= audioWriteRegisterChecked(0x03, 0x10);
    ok &= audioWriteRegisterChecked(0x16, 0x24);
    ok &= audioWriteRegisterChecked(0x04, 0x10);
    ok &= audioWriteRegisterChecked(0x05, 0x00);
    ok &= audioWriteRegisterChecked(0x0B, 0x00);
    ok &= audioWriteRegisterChecked(0x0C, 0x00);
    ok &= audioWriteRegisterChecked(0x10, 0x1F);
    ok &= audioWriteRegisterChecked(0x11, 0x7F);
    ok &= audioWriteRegisterChecked(0x00, 0x80);

    int resetReg = audioReadRegister(0x00);
    if (resetReg < 0) return false;
    resetReg &= 0xBF; // slave mode
    ok &= audioWriteRegisterChecked(0x00, static_cast<uint8_t>(resetReg));

    int clkReg = 0x3F;
    ok &= audioWriteRegisterChecked(0x01, static_cast<uint8_t>(clkReg));
    clkReg = audioReadRegister(0x01);
    if (clkReg < 0) return false;
    clkReg &= ~0x80; // use MCLK as internal clock source
    clkReg &= ~0x40; // non-inverted MCLK
    ok &= audioWriteRegisterChecked(0x01, static_cast<uint8_t>(clkReg));

    ok &= audioWriteRegisterChecked(0x02, 0x18); // pre_div=1, derived from MCLK
    ok &= audioWriteRegisterChecked(0x05, 0x00); // adc_div=1, dac_div=1
    ok &= audioWriteRegisterChecked(0x03, 0x10); // 16k adc osr
    ok &= audioWriteRegisterChecked(0x04, 0x10); // 16k dac osr
    ok &= audioWriteRegisterChecked(0x07, 0x00); // lrck high
    ok &= audioWriteRegisterChecked(0x08, 0xFF); // lrck low
    ok &= audioWriteRegisterChecked(0x06, 0x03); // bclk divider=4, no inversion
    ok &= audioWriteRegisterChecked(0x13, 0x10);
    ok &= audioWriteRegisterChecked(0x1B, 0x0A);
    ok &= audioWriteRegisterChecked(0x1C, 0x6A);

    ok &= audioWriteRegisterChecked(0x09, 0x0C); // I2S, 16-bit
    ok &= audioWriteRegisterChecked(0x0A, 0x0C); // I2S, 16-bit
    ok &= audioWriteRegisterChecked(0x17, 0xBF);
    ok &= audioWriteRegisterChecked(0x0E, 0x02);
    ok &= audioWriteRegisterChecked(0x12, 0x00);
    ok &= audioWriteRegisterChecked(0x14, 0x1A);
    ok &= audioWriteRegisterChecked(0x0D, 0x01);
    ok &= audioWriteRegisterChecked(0x15, 0x40);
    ok &= audioWriteRegisterChecked(0x37, 0x48);
    ok &= audioWriteRegisterChecked(0x45, 0x00);
    ok &= audioWriteRegisterChecked(0x31, 0x00); // unmute DAC

    return ok;
}

bool initAudioI2s()
{
    if (audioI2sReady) return true;

    i2s_config_t i2sConfig = {};
    i2sConfig.mode = static_cast<i2s_mode_t>(I2S_MODE_MASTER | I2S_MODE_TX);
    i2sConfig.sample_rate = AudioSampleRate;
    i2sConfig.bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT;
    i2sConfig.channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT;
    i2sConfig.communication_format = I2S_COMM_FORMAT_STAND_I2S;
    i2sConfig.intr_alloc_flags = ESP_INTR_FLAG_LEVEL1;
    i2sConfig.dma_buf_count = 4;
    i2sConfig.dma_buf_len = 256;
    i2sConfig.use_apll = false;
    i2sConfig.tx_desc_auto_clear = true;
    i2sConfig.fixed_mclk = AudioSampleRate * 256;
    i2sConfig.mclk_multiple = I2S_MCLK_MULTIPLE_256;
    i2sConfig.bits_per_chan = I2S_BITS_PER_CHAN_16BIT;

    esp_err_t err = i2s_driver_install(AudioI2sPort, &i2sConfig, 0, nullptr);
    if (err != ESP_OK)
    {
        Serial.print("Audio I2S driver install failed: ");
        Serial.println(static_cast<int>(err));
        return false;
    }

    i2s_pin_config_t pinConfig = {};
    pinConfig.mck_io_num = SpeakerMclkPin;
    pinConfig.bck_io_num = SpeakerBclkPin;
    pinConfig.ws_io_num = SpeakerWsPin;
    pinConfig.data_out_num = SpeakerDataOutPin;
    pinConfig.data_in_num = SpeakerDataInPin;

    err = i2s_set_pin(AudioI2sPort, &pinConfig);
    if (err != ESP_OK)
    {
        Serial.print("Audio I2S set pin failed: ");
        Serial.println(static_cast<int>(err));
        i2s_driver_uninstall(AudioI2sPort);
        return false;
    }

    i2s_zero_dma_buffer(AudioI2sPort);
    audioI2sReady = true;
    Serial.print("Audio I2S ready. MCLK=");
    Serial.print(SpeakerMclkPin);
    Serial.print(" BCLK=");
    Serial.print(SpeakerBclkPin);
    Serial.print(" LRCK=");
    Serial.print(SpeakerWsPin);
    Serial.print(" DOUT=");
    Serial.println(SpeakerDataOutPin);
    return true;
}

bool ensureAudioReady()
{
    if (audioReady) return true;
    if (audioInitAttempted) return false;

    audioInitAttempted = true;
    pinMode(SpeakerAmpPin, OUTPUT);
    digitalWrite(SpeakerAmpPin, HIGH);

    struct I2cCandidate
    {
        uint8_t sda;
        uint8_t scl;
    };

    constexpr I2cCandidate candidates[] = {
        {SpeakerI2cSdaPin, SpeakerI2cSclPin},
        {17, 18},
        {41, 40},
        {8, 9},
        {39, 38}
    };

    bool codecFound = false;
    for (const I2cCandidate &candidate : candidates)
    {
        if (probeEs8311Bus(candidate.sda, candidate.scl))
        {
            codecFound = true;
            break;
        }
    }

    if (!codecFound)
    {
        Serial.println("ES8311 probe failed on all known I2C pin pairs");
        return false;
    }

    Serial.print("ES8311 detected on I2C SDA=");
    Serial.print(audioI2cSdaPin);
    Serial.print(" SCL=");
    Serial.println(audioI2cSclPin);

    if (!initAudioI2s())
    {
        Serial.println("Audio I2S init failed");
        return false;
    }

    if (!initEs8311CodecFromMclk())
    {
        Serial.println("ES8311 init failed");
        i2s_driver_uninstall(AudioI2sPort);
        audioI2sReady = false;
        return false;
    }

    audioReady = true;
    applyAudioVolume(audioVolumePercent);
    Serial.print("Audio ready. volumePercent=");
    Serial.println(audioVolumePercent);
    return true;
}

void playRawSoundBlocking(const unsigned char *rawData, size_t rawLength, uint8_t codecVolumePercent, uint8_t sampleVolumePercent = 100)
{
    const uint8_t restoreVolume = activeAudioVolumePercent;
    const uint8_t requestedVolume = constrain(codecVolumePercent, static_cast<uint8_t>(0), static_cast<uint8_t>(100));
    const uint8_t sampleVolume = constrain(sampleVolumePercent, static_cast<uint8_t>(0), static_cast<uint8_t>(100));
    if (requestedVolume != restoreVolume)
    {
        setCodecVolume(requestedVolume);
    }

    audioPlaybackOffset = 0;
    uint16_t zeroWriteCount = 0;

    while (audioReady && audioPlaybackOffset < rawLength)
    {
        const size_t remainingFrames = (rawLength - audioPlaybackOffset) / 2;
        const size_t framesToWrite = min(remainingFrames, AudioChunkFrames);

        for (size_t i = 0; i < framesToWrite; ++i)
        {
            const size_t byteIndex = audioPlaybackOffset + i * 2;
            const int16_t monoSample = static_cast<int16_t>(
                static_cast<uint16_t>(rawData[byteIndex]) |
                (static_cast<uint16_t>(rawData[byteIndex + 1]) << 8));
            const int16_t scaledSample = static_cast<int16_t>(
                constrain((static_cast<int32_t>(monoSample) * sampleVolume) / 100L, -32768L, 32767L));
            audioChunkBuffer[i * 2] = scaledSample;
            audioChunkBuffer[i * 2 + 1] = scaledSample;
        }

        const size_t targetBytes = framesToWrite * sizeof(int16_t) * 2;
        size_t bytesWritten = 0;
        const esp_err_t err = i2s_write(AudioI2sPort, audioChunkBuffer, targetBytes, &bytesWritten, pdMS_TO_TICKS(1000));
        if (err != ESP_OK || bytesWritten == 0)
        {
            delay(1);
            ++zeroWriteCount;
            if (zeroWriteCount > 2000)
            {
                Serial.println("PA sound write timeout");
                break;
            }
            continue;
        }
        zeroWriteCount = 0;

        audioPlaybackOffset += (bytesWritten / (sizeof(int16_t) * 2)) * 2;
    }

    audioPlaybackOffset = 0;
    if (activeAudioVolumePercent != restoreVolume)
    {
        setCodecVolume(restoreVolume);
    }
}

void playPaSoundBlocking()
{
    playRawSoundBlocking(pa_audio_mono_16k_raw, pa_audio_mono_16k_raw_len, audioVolumePercent);
}

void queuePaSound(const char *reason)
{
    if (!ensureAudioReady()) return;
    if (audioPlaying) return;

    audioPlaying = true;
    Serial.print("Queueing PA sound: ");
    Serial.println(reason);
    playPaSoundBlocking();
    audioPlaying = false;
    Serial.println("PA sound finished");
}

String normalizeLedText(const String &value)
{
    String result = value;
    result.replace("æ", "a");
    result.replace("Æ", "A");
    result.replace("å", "a");
    result.replace("Å", "A");
    result.replace("ø", "o");
    result.replace("Ø", "O");
    result.replace("ö", "o");
    result.replace("Ö", "O");
    result.replace("ó", "o");
    result.replace("Ó", "O");
    result.replace("ò", "o");
    result.replace("Ò", "O");
    result.replace("ô", "o");
    result.replace("Ô", "O");
    result.replace("ü", "u");
    result.replace("Ü", "U");
    result.replace("ú", "u");
    result.replace("Ú", "U");
    result.replace("ù", "u");
    result.replace("Ù", "U");
    result.replace("û", "u");
    result.replace("Û", "U");
    result.replace("ä", "a");
    result.replace("Ä", "A");
    result.replace("á", "a");
    result.replace("Á", "A");
    result.replace("à", "a");
    result.replace("À", "A");
    result.replace("â", "a");
    result.replace("Â", "A");
    result.replace("é", "e");
    result.replace("É", "E");
    result.replace("è", "e");
    result.replace("È", "E");
    result.replace("ê", "e");
    result.replace("Ê", "E");
    result.replace("ë", "e");
    result.replace("Ë", "E");
    result.replace("í", "i");
    result.replace("Í", "I");
    result.replace("ì", "i");
    result.replace("Ì", "I");
    result.replace("î", "i");
    result.replace("Î", "I");
    result.replace("ï", "i");
    result.replace("Ï", "I");
    result.replace("ç", "c");
    result.replace("Ç", "C");
    result.replace("ñ", "n");
    result.replace("Ñ", "N");
    result.replace("°", String(DegreeGlyph));
    result.toUpperCase();
    return result;
}

uint16_t parseHexColorOr(const String &value, uint16_t fallback)
{
    if (value.length() != 7 || value[0] != '#') return fallback;

    char *end = nullptr;
    const long raw = strtol(value.substring(1).c_str(), &end, 16);
    if (end == nullptr || *end != '\0' || raw < 0 || raw > 0xFFFFFF) return fallback;

    const uint8_t r = static_cast<uint8_t>((raw >> 16) & 0xFF);
    const uint8_t g = static_cast<uint8_t>((raw >> 8) & 0xFF);
    const uint8_t b = static_cast<uint8_t>(raw & 0xFF);
    return panelColor(r, g, b);
}

bool parseHexRgb(const String &value, uint8_t &r, uint8_t &g, uint8_t &b)
{
    if (value.length() != 7 || value[0] != '#') return false;

    char *end = nullptr;
    const long raw = strtol(value.substring(1).c_str(), &end, 16);
    if (end == nullptr || *end != '\0' || raw < 0 || raw > 0xFFFFFF) return false;

    r = static_cast<uint8_t>((raw >> 16) & 0xFF);
    g = static_cast<uint8_t>((raw >> 8) & 0xFF);
    b = static_cast<uint8_t>(raw & 0xFF);
    return true;
}

uint8_t charAdvance(char c)
{
    if (c == ' ') return 4;
    if (c == ':' || c == DegreeGlyph) return 5;
    return 6;
}

uint16_t textPixelWidth(const String &text)
{
    uint16_t width = 0;
    for (size_t i = 0; i < text.length(); ++i)
    {
        width += charAdvance(text[i]);
    }
    return width;
}

String fitText(const String &text, uint8_t maxWidth)
{
    const String normalized = normalizeLedText(text);
    String output;
    uint16_t width = 0;
    for (size_t i = 0; i < normalized.length(); ++i)
    {
        const uint8_t advance = charAdvance(normalized[i]);
        if (output.length() && width + advance > maxWidth) break;
        output += normalized[i];
        width += advance;
    }
    return output;
}

void drawDegreeGlyph(int16_t x, int16_t y, uint16_t color)
{
    display->drawPixel(x + 1, y, color);
    display->drawPixel(x + 2, y, color);
    display->drawPixel(x, y + 1, color);
    display->drawPixel(x + 3, y + 1, color);
    display->drawPixel(x + 1, y + 2, color);
    display->drawPixel(x + 2, y + 2, color);
}

void drawDegreeGlyphClipped(int16_t x, int16_t y, uint16_t color, int16_t clipTop, int16_t clipBottom, uint8_t maxWidth)
{
    const int8_t pixels[][2] = {{1, 0}, {2, 0}, {0, 1}, {3, 1}, {1, 2}, {2, 2}};
    for (const auto &pixel : pixels)
    {
        if (pixel[0] >= maxWidth) continue;
        const int16_t targetY = y + pixel[1];
        if (targetY < clipTop || targetY >= clipBottom) continue;
        display->drawPixel(x + pixel[0], targetY, color);
    }
}

void drawDegreeGlyphCanvas(GFXcanvas1 &canvas, int16_t x, int16_t y)
{
    const int8_t pixels[][2] = {{1, 0}, {2, 0}, {0, 1}, {3, 1}, {1, 2}, {2, 2}};
    for (const auto &pixel : pixels)
    {
        canvas.drawPixel(x + pixel[0], y + pixel[1], 1);
    }
}

void drawTextFit(const String &text, int16_t x, int16_t y, uint16_t color, uint8_t maxWidth)
{
    const String fitted = fitText(text, maxWidth);
    int16_t cursorX = x;
    for (size_t i = 0; i < fitted.length(); ++i)
    {
        const char c = fitted[i];
        if (c != ' ')
        {
            if (c == DegreeGlyph) drawDegreeGlyph(cursorX, y, color);
            else display->drawChar(cursorX, y, c, color, panelColor(0, 0, 0), 1);
        }
        cursorX += charAdvance(c);
    }
}

void drawCharClipped(char c, int16_t x, int16_t y, uint16_t color, int16_t clipTop, int16_t clipBottom, uint8_t maxWidth)
{
    if (c == ' ') return;
    if (c == DegreeGlyph)
    {
        drawDegreeGlyphClipped(x, y, color, clipTop, clipBottom, maxWidth);
        return;
    }
    GFXcanvas1 canvas(6, 8);
    canvas.fillScreen(0);
    canvas.drawChar(0, 0, c, 1, 0, 1);
    for (uint8_t sourceY = 0; sourceY < 8; ++sourceY)
    {
        const int16_t targetY = y + sourceY;
        if (targetY < clipTop || targetY >= clipBottom) continue;
        for (uint8_t sourceX = 0; sourceX < 6; ++sourceX)
        {
            if (sourceX >= maxWidth) break;
            if (canvas.getPixel(sourceX, sourceY))
            {
                display->drawPixel(x + sourceX, targetY, color);
            }
        }
    }
}

void drawTextFitClipped(const String &text, int16_t x, int16_t y, uint16_t color, uint8_t maxWidth,
                        int16_t clipTop = TimetableRowsTopY, int16_t clipBottom = TimetableRowsBottomY)
{
    const String fitted = fitText(text, maxWidth);
    int16_t cursorX = x;
    uint8_t usedWidth = 0;
    for (size_t i = 0; i < fitted.length(); ++i)
    {
        const char c = fitted[i];
        const uint8_t advance = charAdvance(c);
        if (usedWidth + advance > maxWidth) break;
        drawCharClipped(c, cursorX, y, color, clipTop, clipBottom, maxWidth - usedWidth);
        cursorX += advance;
        usedWidth += advance;
    }
}

void drawIdleColonClipped(int16_t x, int16_t y, uint16_t color,
                          int16_t clipTop = TimetableRowsTopY, int16_t clipBottom = TimetableRowsBottomY)
{
    const int16_t firstY = y + 1;
    const int16_t secondY = y + 4;
    if (firstY >= clipTop && firstY < clipBottom) display->drawPixel(x, firstY, color);
    if (secondY >= clipTop && secondY < clipBottom) display->drawPixel(x, secondY, color);
}

void drawIdleTimeClipped(const String &text, int16_t x, int16_t y, uint16_t color)
{
    String value = normalizeLedText(text);
    while (value.length() < 5) value += " ";
    drawTextFitClipped(value.substring(0, 2), x, y, color, 12);
    if (value.substring(2, 3) == ":") drawIdleColonClipped(x + 12, y, color);
    drawTextFitClipped(value.substring(3, 5), x + 14, y, color, 12);
}

void drawTextRight(const String &text, int16_t rightX, int16_t y, uint16_t color, uint8_t maxWidth)
{
    const String fitted = fitText(text, maxWidth);
    const int16_t x = max<int16_t>(0, rightX - static_cast<int16_t>(textPixelWidth(fitted)));
    drawTextFit(fitted, x, y, color, maxWidth);
}

bool readLocalTime(struct tm &timeinfo)
{
    const time_t rawTime = time(nullptr);
    if (rawTime < 1600000000) return false;
    localtime_r(&rawTime, &timeinfo);
    return true;
}

uint16_t lerpClockColor(uint8_t fromR, uint8_t fromG, uint8_t fromB,
                        uint8_t toR, uint8_t toG, uint8_t toB,
                        uint8_t step, uint8_t steps)
{
    if (steps == 0) return panelColor(toR, toG, toB);
    const int16_t deltaR = static_cast<int16_t>(toR) - static_cast<int16_t>(fromR);
    const int16_t deltaG = static_cast<int16_t>(toG) - static_cast<int16_t>(fromG);
    const int16_t deltaB = static_cast<int16_t>(toB) - static_cast<int16_t>(fromB);
    const uint8_t r = static_cast<uint8_t>(fromR + (deltaR * step) / steps);
    const uint8_t g = static_cast<uint8_t>(fromG + (deltaG * step) / steps);
    const uint8_t b = static_cast<uint8_t>(fromB + (deltaB * step) / steps);
    return panelColor(r, g, b);
}

uint16_t minuteStackColorForDepth(uint8_t depth)
{
    const uint8_t step = static_cast<uint8_t>(min<uint8_t>(60, max<uint8_t>(1, depth)));
    return lerpClockColor(clockGradientTopR, clockGradientTopG, clockGradientTopB,
                          clockGradientBottomR, clockGradientBottomG, clockGradientBottomB, step, 60);
}

uint16_t clockTextFieldColor(uint8_t centerY)
{
    const uint8_t step = static_cast<uint8_t>(min<uint8_t>(58, max<uint8_t>(0, centerY - ClockTextTopY)));
    return lerpClockColor(clockGradientTopR, clockGradientTopG, clockGradientTopB,
                          clockGradientBottomR, clockGradientBottomG, clockGradientBottomB, step, 58);
}

void drawThinClockSegment(int16_t x, int16_t y, char segment, uint16_t color)
{
    if (segment == 'a') display->drawFastHLine(x + 1, y, 23, color);
    if (segment == 'b') display->drawFastVLine(x + 24, y + 1, 7, color);
    if (segment == 'c') display->drawFastVLine(x + 24, y + 9, 7, color);
    if (segment == 'd') display->drawFastHLine(x + 1, y + 16, 23, color);
    if (segment == 'e') display->drawFastVLine(x, y + 9, 7, color);
    if (segment == 'f') display->drawFastVLine(x, y + 1, 7, color);
    if (segment == 'g') display->drawFastHLine(x + 1, y + 8, 23, color);
}

void drawThinClockChar(int16_t x, int16_t y, char c, uint16_t color)
{
    const char *segments = "";
    switch (c)
    {
        case '0': segments = "abcedf"; break;
        case '1': segments = "bc"; break;
        case '2': segments = "abged"; break;
        case '3': segments = "abgcd"; break;
        case '4': segments = "fgbc"; break;
        case '5': segments = "afgcd"; break;
        case '6': segments = "afgecd"; break;
        case '7': segments = "abc"; break;
        case '8': segments = "abgcdef"; break;
        case '9': segments = "abgcdf"; break;
        case '-': segments = "g"; break;
        default: return;
    }

    for (size_t i = 0; segments[i] != '\0'; ++i)
    {
        drawThinClockSegment(x, y, segments[i], color);
    }
}

void drawThinClockPair(int16_t x, int16_t y, const char *text, uint16_t color)
{
    const char first = text && text[0] ? text[0] : '-';
    const char second = text && text[1] ? text[1] : '-';
    drawThinClockChar(x, y, first, color);
    drawThinClockChar(x + ClockDigitAdvance, y, second, color);
}

void drawClockRight(int16_t rightX, int16_t y, uint16_t color)
{
    struct tm timeinfo;
    if (!readLocalTime(timeinfo))
    {
        drawTextRight("--:--", rightX, y, color, 32);
        return;
    }

    char clockText[6] = {};
    snprintf(clockText, sizeof(clockText), "%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min);
    const int16_t x = max<int16_t>(0, rightX - static_cast<int16_t>(textPixelWidth(clockText)));
    const uint16_t black = panelColor(0, 0, 0);
    int16_t cursorX = x;
    for (size_t i = 0; clockText[i] != '\0'; ++i)
    {
        const char c = clockText[i];
        const uint16_t charColor = c == ':' ? ((timeinfo.tm_sec % 2 == 0) ? color : black) : color;
        if (charColor != black)
        {
            display->drawChar(cursorX, y, c, charColor, black, 1);
        }
        cursorX += charAdvance(c);
    }
}

void drawClockMode()
{
    struct tm timeinfo;
    const bool hasTime = readLocalTime(timeinfo);
    const uint16_t topColor = panelColor(clockGradientTopR, clockGradientTopG, clockGradientTopB);
    const bool wasClockLayoutActive = clockLayoutActive;

    idleLayoutActive = false;
    liveLayoutActive = false;
    clockLayoutActive = true;
    display->fillScreen(panelColor(0, 0, 0));

    if (hasTime)
    {
        const uint32_t now = millis();
        if (!wasClockLayoutActive)
        {
            lastClockMinute = timeinfo.tm_min;
            lastClockSecond = timeinfo.tm_sec;
            fallingClockMinuteIndex = -1;
            clockFallingStartedAt = 0;
        }

        if (lastClockMinute < 0)
        {
            lastClockMinute = timeinfo.tm_min;
        }
        else if (timeinfo.tm_min != lastClockMinute)
        {
            if (timeinfo.tm_min > 0)
            {
                fallingClockMinuteIndex = timeinfo.tm_min - 1;
                clockFallingStartedAt = now;
            }
            else
            {
                fallingClockMinuteIndex = -1;
                clockFallingStartedAt = 0;
            }
            lastClockMinute = timeinfo.tm_min;
        }

        const bool falling = fallingClockMinuteIndex >= 0 && now - clockFallingStartedAt < ClockMinuteFallMs;
        const uint8_t completedMinutes = constrain(timeinfo.tm_min, 0, 59);
        for (uint8_t index = 0; index < completedMinutes; ++index)
        {
            if (falling && index == static_cast<uint8_t>(fallingClockMinuteIndex)) continue;
            const uint8_t y = ClockStackBottomY - index;
            display->drawFastHLine(ClockSecondsStartX, y, ClockSecondsWidth, minuteStackColorForDepth(completedMinutes - index));
        }

        if (falling)
        {
            const uint8_t targetY = ClockStackBottomY - static_cast<uint8_t>(fallingClockMinuteIndex);
            const uint32_t elapsed = min<uint32_t>(ClockMinuteFallMs, now - clockFallingStartedAt);
            const uint8_t fallY = ClockActiveRowY + ((targetY - ClockActiveRowY) * elapsed) / ClockMinuteFallMs;
            display->drawFastHLine(ClockSecondsStartX, fallY, ClockSecondsWidth, minuteStackColorForDepth(1));
        }
        else if (fallingClockMinuteIndex >= 0)
        {
            fallingClockMinuteIndex = -1;
            clockFallingStartedAt = 0;
        }

        const uint8_t litSeconds = min<uint8_t>(60, static_cast<uint8_t>(timeinfo.tm_sec + 1));
        if (litSeconds > 0)
        {
            display->drawFastHLine(ClockSecondsStartX, ClockActiveRowY, litSeconds, topColor);
        }

        char hourText[3] = {};
        char minuteText[3] = {};
        char secondText[3] = {};
        snprintf(hourText, sizeof(hourText), "%02d", timeinfo.tm_hour);
        snprintf(minuteText, sizeof(minuteText), "%02d", timeinfo.tm_min);
        snprintf(secondText, sizeof(secondText), "%02d", timeinfo.tm_sec);
        display->setFont(nullptr);
        drawThinClockPair(ClockTextStartX, ClockTextTopY, hourText, clockTextFieldColor(ClockTextTopY + ClockDigitHeight / 2));
        drawThinClockPair(ClockTextStartX, ClockTextMiddleY, minuteText, clockTextFieldColor(ClockTextMiddleY + ClockDigitHeight / 2));
        drawThinClockPair(ClockTextStartX, ClockTextBottomY, secondText, clockTextFieldColor(ClockTextBottomY + ClockDigitHeight / 2));
        lastClockSecond = timeinfo.tm_sec;
    }
    else
    {
        lastClockMinute = -1;
        lastClockSecond = -1;
        fallingClockMinuteIndex = -1;
        display->setFont(nullptr);
        drawThinClockPair(ClockTextStartX, ClockTextTopY, "--", clockTextFieldColor(ClockTextTopY + ClockDigitHeight / 2));
        drawThinClockPair(ClockTextStartX, ClockTextMiddleY, "--", clockTextFieldColor(ClockTextMiddleY + ClockDigitHeight / 2));
        drawThinClockPair(ClockTextStartX, ClockTextBottomY, "--", clockTextFieldColor(ClockTextBottomY + ClockDigitHeight / 2));
    }

    drawFetchIndicator();
    presentFrame();
}

uint16_t tickerOffset(uint16_t overflow)
{
    const uint16_t speed = max<uint16_t>(2, liveScrollPixelsPerSecond);
    const uint32_t travelMs = max<uint32_t>(1200, (static_cast<uint32_t>(overflow) * 1000UL) / speed);
    const uint32_t cycleMs = TickerHoldMs + travelMs + TickerHoldMs + travelMs;
    const uint32_t t = millis() % cycleMs;
    if (t < TickerHoldMs) return 0;
    if (t < TickerHoldMs + travelMs) return static_cast<uint16_t>(((t - TickerHoldMs) * overflow) / travelMs);
    if (t < TickerHoldMs + travelMs + TickerHoldMs) return overflow;
    return static_cast<uint16_t>(((cycleMs - t) * overflow) / travelMs);
}

uint16_t tickerForwardOffset(uint16_t overflow, uint32_t startedAt, uint16_t speedOverride = 0)
{
    const uint16_t speed = max<uint16_t>(2, speedOverride ? speedOverride : liveScrollPixelsPerSecond);
    const uint32_t travelMs = max<uint32_t>(1200, (static_cast<uint32_t>(overflow) * 1000UL) / speed);
    const uint32_t cycleMs = TickerHoldMs + travelMs + TickerHoldMs;
    const uint32_t elapsed = millis() >= startedAt ? millis() - startedAt : 0;
    const uint32_t t = elapsed % cycleMs;
    if (t < TickerHoldMs) return 0;
    if (t < TickerHoldMs + travelMs) return static_cast<uint16_t>(((t - TickerHoldMs) * overflow) / travelMs);
    return overflow;
}

void drawTickerText(const String &text, int16_t x, int16_t y, uint16_t color, uint8_t width)
{
    const String normalized = normalizeLedText(text);
    if (!normalized.length()) return;

    const uint16_t textWidth = textPixelWidth(normalized);
    if (textWidth <= width)
    {
        drawTextFit(normalized, x, y, color, width);
        return;
    }
    if (textWidth + max<int16_t>(0, x) <= PanelWidth)
    {
        drawTextFit(normalized, x, y, color, PanelWidth - max<int16_t>(0, x));
        return;
    }

    const uint16_t fullWidthOverflow = textWidth + max<int16_t>(0, x) > PanelWidth
        ? textWidth + max<int16_t>(0, x) - PanelWidth
        : 0;
    const uint16_t overflow = max<uint16_t>(1, fullWidthOverflow);
    const uint16_t offset = tickerOffset(overflow);
    int16_t cursorX = x - static_cast<int16_t>(offset);
    for (size_t i = 0; i < normalized.length(); ++i)
    {
        const char c = normalized[i];
        if (c != ' ')
        {
            if (c == DegreeGlyph) drawDegreeGlyph(cursorX, y, color);
            else display->drawChar(cursorX, y, c, color, panelColor(0, 0, 0), 1);
        }
        cursorX += charAdvance(c);
    }
}

void drawTickerTextBoxed(const String &text, int16_t x, int16_t y, uint16_t color, uint8_t width,
                         uint32_t startedAt, uint16_t speedOverride = 0)
{
    const String normalized = normalizeLedText(text);
    if (!normalized.length()) return;

    const uint16_t textWidth = textPixelWidth(normalized);
    if (textWidth <= width)
    {
        drawTextFit(normalized, x, y, color, width);
        return;
    }

    const uint16_t overflow = max<uint16_t>(1, textWidth - width);
    const uint16_t offset = tickerForwardOffset(overflow, startedAt, speedOverride);
    GFXcanvas1 canvas(textWidth, 8);
    canvas.fillScreen(0);
    int16_t cursorX = 0;
    for (size_t i = 0; i < normalized.length(); ++i)
    {
        const char c = normalized[i];
        if (c != ' ')
        {
            if (c == DegreeGlyph) drawDegreeGlyphCanvas(canvas, cursorX, 0);
            else canvas.drawChar(cursorX, 0, c, 1, 0, 1);
        }
        cursorX += charAdvance(c);
    }

    for (uint8_t targetX = 0; targetX < width; ++targetX)
    {
        const uint16_t sourceX = offset + targetX;
        if (sourceX >= textWidth) break;
        for (uint8_t targetY = 0; targetY < 8; ++targetY)
        {
            if (canvas.getPixel(sourceX, targetY))
            {
                display->drawPixel(x + targetX, y + targetY, color);
            }
        }
    }
}

void drawTickerTextBoxedClipped(const String &text, int16_t x, int16_t y, uint16_t color, uint8_t width,
                                uint32_t startedAt, uint16_t speedOverride = 0)
{
    const String normalized = normalizeLedText(text);
    if (!normalized.length()) return;

    const uint16_t textWidth = textPixelWidth(normalized);
    if (textWidth <= width)
    {
        drawTextFitClipped(normalized, x, y, color, width);
        return;
    }

    const uint16_t overflow = max<uint16_t>(1, textWidth - width);
    const uint16_t offset = tickerForwardOffset(overflow, startedAt, speedOverride);
    GFXcanvas1 canvas(textWidth, 8);
    canvas.fillScreen(0);
    int16_t cursorX = 0;
    for (size_t i = 0; i < normalized.length(); ++i)
    {
        const char c = normalized[i];
        if (c != ' ')
        {
            if (c == DegreeGlyph) drawDegreeGlyphCanvas(canvas, cursorX, 0);
            else canvas.drawChar(cursorX, 0, c, 1, 0, 1);
        }
        cursorX += charAdvance(c);
    }

    for (uint8_t targetX = 0; targetX < width; ++targetX)
    {
        const uint16_t sourceX = offset + targetX;
        if (sourceX >= textWidth) break;
        for (uint8_t targetY = 0; targetY < 8; ++targetY)
        {
            const int16_t clippedY = y + targetY;
            if (clippedY < TimetableRowsTopY || clippedY >= TimetableRowsBottomY) continue;
            if (canvas.getPixel(sourceX, targetY))
            {
                display->drawPixel(x + targetX, clippedY, color);
            }
        }
    }
}

void drawProgressValue(float progress, int16_t y, uint16_t backgroundColor, uint16_t fillColor)
{
    const float clamped = min(1.0f, max(0.0f, progress));
    const uint16_t width = min<uint16_t>(PanelWidth, static_cast<uint16_t>(floorf(static_cast<float>(PanelWidth) * clamped)));
    display->drawFastHLine(0, y, PanelWidth, backgroundColor);
    for (uint16_t i = 0; i < width; ++i)
    {
        display->drawPixel(i, y, fillColor);
    }
}

void drawCycleProgressBar(int16_t y)
{
    const uint32_t cycleMs = max<uint32_t>(2000, static_cast<uint32_t>(displayCycleSeconds) * 1000UL);
    const uint32_t effectiveElapsed = millis() >= liveCycleStartedAt ? millis() - liveCycleStartedAt : 0;
    const float progress = min(1.0f, static_cast<float>(effectiveElapsed) / static_cast<float>(cycleMs));
    drawProgressValue(progress, y, colorProgressDim(), colorProgressFill());
}

void drawRouteProgressBar(JsonObject flight, int16_t y)
{
    JsonVariant routeProgress = flight["routeProgress"];
    if (routeProgress.isNull()) return;
    const float progress = routeProgress.as<float>();
    drawProgressValue(progress, y, colorRouteProgressDim(), colorRouteProgressFill());
}

String normalizeGateStatusForDisplay(const String &value)
{
    String raw;
    for (size_t i = 0; i < value.length(); ++i)
    {
        const char c = static_cast<char>(tolower(value[i]));
        if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'))
        {
            raw += c;
        }
    }

    if (raw.length() == 0) return "";
    if (raw.indexOf("gotogate") >= 0 || raw.indexOf("togate") >= 0) return "Go to gate";
    if (raw.indexOf("boarding") >= 0) return "Boarding";
    if (raw.indexOf("closing") >= 0) return "Closing";
    if (raw.indexOf("closed") >= 0) return "Closed";
    return "";
}

const char *DepartureCircleSymbol[] = {
    ".##.",
    "####",
    "####",
    ".##."
};

const char *LandedCheckSymbol[] = {
    "....#",
    "...#.",
    "#.#..",
    ".#..."
};

const char *GateArrowSymbol[] = {
    "#.",
    "##",
    "##",
    "#."
};

const char *GateDoorSymbol[] = {
    ".##",
    "#..",
    "#.#",
    ".##"
};

String airlinePrefix(const String &flightId)
{
    String value = flightId;
    value.trim();
    value.toUpperCase();
    return value.substring(0, min<size_t>(2, value.length()));
}

String idleFlightFieldText(const String &kind, const IdleRow &row)
{
    const String airline = airlinePrefix(row.flightId);
    String gate = row.gate;
    gate.trim();
    gate.toUpperCase();
    gate = gate.substring(0, min<size_t>(3, gate.length()));
    if (kind == "departures" && gate.length() && ((millis() / 1200UL) % 2 == 1))
    {
        return gate;
    }
    return airline;
}

void drawBitmapSymbol(int16_t x, int16_t y, const char *bitmap[], uint8_t rows, uint16_t color)
{
    for (uint8_t row = 0; row < rows; ++row)
    {
        const char *line = bitmap[row];
        for (uint8_t col = 0; line[col] != '\0'; ++col)
        {
            if (line[col] == '#')
            {
                display->drawPixel(x + col, y + row, color);
            }
        }
    }
}

void drawBitmapSymbolClipped(int16_t x, int16_t y, const char *bitmap[], uint8_t rows, uint16_t color)
{
    for (uint8_t row = 0; row < rows; ++row)
    {
        const int16_t targetY = y + row;
        if (targetY < TimetableRowsTopY || targetY >= TimetableRowsBottomY) continue;
        const char *line = bitmap[row];
        for (uint8_t col = 0; line[col] != '\0'; ++col)
        {
            if (line[col] == '#')
            {
                display->drawPixel(x + col, targetY, color);
            }
        }
    }
}

void drawBitmapSymbolBoxClipped(int16_t x, int16_t y, const char *bitmap[], uint8_t rows, uint16_t color, int16_t clipX, int16_t clipY, uint8_t clipWidth, uint8_t clipHeight)
{
    const int16_t clipRight = clipX + clipWidth;
    const int16_t clipBottom = clipY + clipHeight;
    for (uint8_t row = 0; row < rows; ++row)
    {
        const int16_t targetY = y + row;
        if (targetY < TimetableRowsTopY || targetY >= TimetableRowsBottomY) continue;
        if (targetY < clipY || targetY >= clipBottom) continue;
        const char *line = bitmap[row];
        for (uint8_t col = 0; line[col] != '\0'; ++col)
        {
            const int16_t targetX = x + col;
            if (targetX < clipX || targetX >= clipRight) continue;
            if (line[col] == '#')
            {
                display->drawPixel(targetX, targetY, color);
            }
        }
    }
}

const char *MarineDivingIcon[] = {
    ".........",
    ".#####..#",
    "#.....#.#",
    "#.....#.#",
    "#..#..#.#",
    ".##.##..#",
    ".......##"
};

const char *MarinePassengerIcon[] = {
    ".....#....#...",
    "...###########",
    "..##.#.#.#.#.#",
    ".#############",
    ".#.#.#.#.#.#.#",
    "##############",
    ".#############"
};

const char *MarineSarIcon[] = {
    "..............",
    "..............",
    "####..##..###.",
    "#....#..#.#..#",
    "####.####.###.",
    "...#.#..#.#..#",
    "####.#..#.#..#"
};

const char *MarineTankerIcon[] = {
    "..............",
    "...........##.",
    "...........##.",
    "...#....#..##.",
    "##############",
    ".#############",
    "..###########."
};

const char *MarineCargoIcon[] = {
    "..............",
    "...........##.",
    ".#.#.#.#.#.##.",
    ".#.#.#.#.#.##.",
    "##############",
    ".#############",
    "..###########."
};

const char *MarineFishingIcon[] = {
    "....##......",
    "..######...#",
    ".#.######.##",
    "############",
    ".########.##",
    "..######...#",
    "....##......"
};

const char *MarineHighSpeedIcon[] = {
    ".....##.......",
    ".....####.....",
    "...###########",
    ".#############",
    "##.#.#.#.#.#.#",
    "##############",
    ".#############"
};

const char *MarineSailingIcon[] = {
    "....#.....#...",
    "...##....##...",
    "..###...###...",
    ".####..####...",
    "....#.....#.##",
    "##############",
    "..###########."
};

uint8_t marineTypeIconWidth(const String &icon)
{
    if (icon == "diving") return 9;
    if (icon == "fishing") return 12;
    if (icon == "passenger" || icon == "sar" || icon == "tanker" || icon == "cargo" || icon == "high_speed" || icon == "sailing") return 14;
    return 0;
}

void drawMarineTypeIcon(const String &icon, int16_t x, int16_t y, uint16_t color)
{
    if (icon == "diving")
    {
        drawBitmapSymbol(x, y, MarineDivingIcon, 7, color);
    }
    else if (icon == "passenger")
    {
        drawBitmapSymbol(x, y, MarinePassengerIcon, 7, color);
    }
    else if (icon == "sar")
    {
        drawBitmapSymbol(x, y, MarineSarIcon, 7, color);
    }
    else if (icon == "tanker")
    {
        drawBitmapSymbol(x, y, MarineTankerIcon, 7, color);
    }
    else if (icon == "cargo")
    {
        drawBitmapSymbol(x, y, MarineCargoIcon, 7, color);
    }
    else if (icon == "fishing")
    {
        drawBitmapSymbol(x, y, MarineFishingIcon, 7, color);
    }
    else if (icon == "high_speed")
    {
        drawBitmapSymbol(x, y, MarineHighSpeedIcon, 7, color);
    }
    else if (icon == "sailing")
    {
        drawBitmapSymbol(x, y, MarineSailingIcon, 7, color);
    }
}

int16_t animatedGateArrowX(int16_t startX, int16_t stopX)
{
    constexpr uint16_t speed = 6;
    const uint16_t distance = abs(stopX - startX);
    const uint16_t travelMs = max<uint16_t>(1, (distance * 1000UL) / speed);
    const uint16_t phase = millis() % travelMs;
    return startX + ((stopX - startX) * static_cast<int32_t>(phase)) / travelMs;
}

void drawGateMotionSymbol(const String &state, int16_t x, int16_t y, uint16_t color)
{
    constexpr uint8_t fieldWidth = 9;
    constexpr uint8_t fieldHeight = 8;
    constexpr uint8_t arrowWidth = 2;
    constexpr uint8_t doorWidth = 3;
    const int16_t drawY = y + 1;
    const int16_t doorX = x + ((fieldWidth - doorWidth) / 2);

    if (state == "gateClosed")
    {
        drawBitmapSymbolClipped(doorX, drawY, GateDoorSymbol, 4, color);
        return;
    }

    if (state == "goToGate")
    {
        const int16_t arrowX = doorX - arrowWidth - 1;
        drawBitmapSymbolClipped(doorX, drawY, GateDoorSymbol, 4, color);
        if ((millis() / 850UL) % 2 == 0)
        {
            drawBitmapSymbolBoxClipped(arrowX, drawY, GateArrowSymbol, 4, color, x, y, fieldWidth, fieldHeight);
        }
        return;
    }

    const int16_t arrowX = animatedGateArrowX(doorX + doorWidth + 1, 130);
    drawBitmapSymbolClipped(doorX, drawY, GateDoorSymbol, 4, color);
    drawBitmapSymbolBoxClipped(arrowX, drawY, GateArrowSymbol, 4, color, x, y, 128 - x, fieldHeight);
}

String idleRowSymbolState(const String &kind, const IdleRow &row)
{
    if (row.status == "canceled") return "";
    if (kind == "arrivals") return row.status == "done" ? "landed" : "";

    const String gateStatus = normalizeGateStatusForDisplay(row.gateMessage);
    if (gateStatus == "Go to gate") return "goToGate";
    if (gateStatus == "Boarding") return "boarding";
    if (gateStatus == "Closing") return "gateClosing";
    if (gateStatus == "Closed") return "gateClosed";
    return "";
}

uint16_t idleRowSymbolColor(const String &state)
{
    if (state == "goToGate") return colorGateGoToGate();
    if (state == "boarding") return colorGateBoarding();
    if (state == "gateClosing") return colorGateClosing();
    if (state == "gateClosed") return colorGateClosed();
    if (state == "landed") return colorLanded();
    return colorData();
}

void drawIdleDestinationTicker(const String &text, int16_t x, int16_t y, uint16_t color, uint8_t width)
{
    const String normalized = normalizeLedText(text);
    if (textPixelWidth(normalized) <= width)
    {
        drawTextFitClipped(normalized, x, y, color, width);
        return;
    }
    drawTickerTextBoxedClipped(normalized, x, y, color, width, idleCycleStartedAt, timetableScrollPixelsPerSecond);
}

void drawIdleRowSymbol(const String &kind, const IdleRow &row, int16_t x, int16_t y)
{
    const String state = idleRowSymbolState(kind, row);
    if (!state.length()) return;

    constexpr uint8_t symbolFieldWidth = 9;

    if (state == "goToGate" || state == "boarding" || state == "gateClosing" || state == "gateClosed")
    {
        drawGateMotionSymbol(state, x, y, idleRowSymbolColor(state));
        return;
    }

    if (state == "landed")
    {
        constexpr uint8_t symbolWidth = 5;
        drawBitmapSymbolClipped(x + max<int16_t>(0, symbolFieldWidth - symbolWidth), y + 2, LandedCheckSymbol, 4, idleRowSymbolColor(state));
        return;
    }

    constexpr uint8_t symbolWidth = 4;
    drawBitmapSymbolClipped(x + max<int16_t>(0, symbolFieldWidth - symbolWidth), y + 2, DepartureCircleSymbol, 4, idleRowSymbolColor(state));
}

String localClockText()
{
    struct tm timeinfo;
    if (!readLocalTime(timeinfo)) return "--:--";

    char buffer[6] = {};
    snprintf(buffer, sizeof(buffer), "%02d%c%02d", timeinfo.tm_hour, timeinfo.tm_sec % 2 == 0 ? ':' : ' ', timeinfo.tm_min);
    return String(buffer);
}

bool initLocalTime()
{
    const String tz = deviceTimeZonePosix.length() ? deviceTimeZonePosix : String(OsloTimeZone);
    configTzTime(tz.c_str(), "pool.ntp.org", "time.cloudflare.com");

    struct tm timeinfo;
    if (getLocalTime(&timeinfo, 8000))
    {
        Serial.print("Time synchronized: ");
        Serial.println(localClockText());
        return true;
    }

    Serial.println("Time sync failed; TLS certificate validation may fail");
    return false;
}

void drawBlackScreen()
{
    idleLayoutActive = false;
    liveLayoutActive = false;
    clockLayoutActive = false;
    startupSplashActive = false;
    display->fillScreen(panelColor(0, 0, 0));
    presentFrame();
}

void drawSplashImage()
{
    display->fillScreen(panelColor(0, 0, 0));
    const uint16_t white = panelColor(0xFF, 0xFF, 0xFF);
    uint32_t pixel = 0;
    constexpr uint32_t totalPixels = static_cast<uint32_t>(SplashWidth) * static_cast<uint32_t>(SplashHeight);
    for (uint16_t byteIndex = 0; byteIndex < SplashBitmapBytes && pixel < totalPixels; ++byteIndex)
    {
        const uint8_t packed = pgm_read_byte(&SplashBitmap[byteIndex]);
        for (uint8_t bitIndex = 0; bitIndex < 8 && pixel < totalPixels; ++bitIndex, ++pixel)
        {
            if ((packed & (0x80 >> bitIndex)) != 0)
            {
                display->drawPixel(pixel % PanelWidth, pixel / PanelWidth, white);
            }
        }
    }
}

void drawSplashTextLine(const String &text, int16_t y, uint16_t color = 0)
{
    const uint16_t textColor = color ? color : colorData();
    drawTextFit(text, 3, y, textColor, 122);
}

void drawStartupSplashStatus(const char *title, const char *line1, const char *line2)
{
    idleLayoutActive = false;
    liveLayoutActive = false;
    clockLayoutActive = false;
    provisioningDisplayActive = false;
    drawSplashImage();
    drawSplashTextLine(title, 34, colorHeader());
    drawSplashTextLine(line1, 44, colorData());
    drawSplashTextLine(line2, 54, colorData());
    presentFrame();
}

void updateOffFetchIndicator()
{
    if (screenActive) return;
    if (!lastOffIndicatorVisible) return;

    display->drawPixel(PanelWidth - 1, 0, panelColor(0, 0, 0));
    presentFrame();
    lastOffIndicatorVisible = false;
}

uint32_t inactiveConfigPollSeconds()
{
    if (screenActive || screenInactiveSince == 0) return configRefreshSeconds;
    const uint32_t inactiveMs = millis() - screenInactiveSince;
    if (inactiveMs < 2UL * 60UL * 1000UL) return 5;
    if (inactiveMs < 30UL * 60UL * 1000UL) return 15;
    return 30;
}

bool hasActiveContentLayout()
{
    return idleLayoutActive || liveLayoutActive || clockLayoutActive;
}

void drawFetchIndicator()
{
    if (!(configFetchActive || displayFetchActive)) return;
    if (!screenActive) return;
    if ((millis() / 300UL) % 2 != 0) return;

    display->drawPixel(PanelWidth - 1, 0, colorFetchIndicator());
    lastOffIndicatorVisible = true;
}

void redrawActiveContent()
{
    if (clockLayoutActive)
    {
        drawClockMode();
    }
    else if (idleLayoutActive)
    {
        drawIdleScreen(currentIdleScreen);
    }
    else if (liveLayoutActive)
    {
        drawCurrentLiveFlight();
    }
}

void drawStatusFrame(const char *title, uint16_t titleColor)
{
    const uint16_t black = panelColor(0, 0, 0);
    const uint16_t yellow = timetableNewTimeColor ? timetableNewTimeColor : colorHeader();

    display->fillScreen(black);
    display->drawRect(0, 0, PanelWidth, PanelHeight, yellow);
    display->drawRect(1, 1, PanelWidth - 2, PanelHeight - 2, yellow);

    display->setTextSize(1);
    display->setTextWrap(false);
    display->setTextColor(titleColor);
    display->setCursor(4, 4);
    display->print(title);
}

void drawStatusLines(const char *title, const char *line1, const char *line2, const char *line3, uint16_t color)
{
    idleLayoutActive = false;
    liveLayoutActive = false;
    clockLayoutActive = false;
    if (startupSplashActive)
    {
        drawStartupSplashStatus(title, line1, line2);
        return;
    }
    drawStatusFrame(title, color);
    display->setTextColor(colorData());
    display->setCursor(4, 22);
    display->print(line1);
    display->setCursor(4, 36);
    display->print(line2);
    display->setCursor(4, 50);
    display->print(line3);
    presentFrame();
}

void drawBrandedStatusLines(const char *title, const char *line1, const char *line2, const char *line3, uint16_t color)
{
    idleLayoutActive = false;
    liveLayoutActive = false;
    clockLayoutActive = false;
    provisioningDisplayActive = false;
    drawSplashImage();
    drawSplashTextLine(title, 34, color);
    drawSplashTextLine(line1, 44, colorData());
    drawSplashTextLine(line2, 54, colorData());
    if (line3 && line3[0] != '\0')
    {
        drawTextRight(line3, 124, 54, colorData(), 42);
    }
    presentFrame();
}

void drawProvisioningStatus()
{
    if (provisionPairingCode.isEmpty()) return;
    idleLayoutActive = false;
    liveLayoutActive = false;
    clockLayoutActive = false;
    provisioningDisplayActive = true;
    if (provisioningDisplayStartedAt == 0) provisioningDisplayStartedAt = millis();

    drawSplashImage();
    drawSplashTextLine("PAIR SCREEN", 34, colorHeader());
    drawSplashTextLine(provisionPairingCode, 44, colorData());
    drawTickerTextBoxed("skyframe.danaksel.no/start", 3, 54, colorData(), 122, provisioningDisplayStartedAt, 14);
    provisioningDisplayLastDrawAt = millis();
    presentFrame();
}

void updateProvisioningStatusDisplay()
{
    if (!provisioningDisplayActive) return;
    if (millis() - provisioningDisplayLastDrawAt < 120UL) return;
    drawProvisioningStatus();
}

float easeInOut(float t)
{
    return t < 0.5f ? 2.0f * t * t : 1.0f - powf(-2.0f * t + 2.0f, 2.0f) / 2.0f;
}

uint8_t nextIdleScreenIndex()
{
    return idleScreenCount ? (currentIdleScreen + 1) % idleScreenCount : 0;
}

uint32_t idleTransitionMs(uint16_t rowTravel)
{
    const uint16_t speed = max<uint16_t>(4, timetableScrollPixelsPerSecond);
    return max<uint32_t>(400, (static_cast<uint32_t>(rowTravel) * 1000UL) / speed);
}

float idleTransitionProgress(uint32_t transitionMs, bool intro)
{
    if (intro)
    {
        const uint32_t elapsed = millis() - idleCycleStartedAt;
        if (elapsed >= transitionMs) return 1.0f;
        return min(1.0f, static_cast<float>(elapsed) / static_cast<float>(transitionMs));
    }

    if (!idleOutroActive) return 0;
    const uint32_t transitionElapsed = millis() - idleOutroStartedAt;
    return min(1.0f, static_cast<float>(transitionElapsed) / static_cast<float>(transitionMs));
}

bool idleKindChangingToNext()
{
    if (idleScreenCount <= 1) return false;
    return idleScreens[currentIdleScreen].kind != idleScreens[nextIdleScreenIndex()].kind;
}

int16_t idleScrollOffset()
{
    if (idleScreenCount <= 1) return 0;

    const uint16_t rowTravel = idleKindChangingToNext() ? 64 : 44;
    const uint32_t transitionMs = idleKindChangingToNext() ? timetableTransitionMs : idleTransitionMs(rowTravel);
    const float progress = idleTransitionProgress(transitionMs, false);
    return static_cast<int16_t>(floorf(static_cast<float>(rowTravel) * progress));
}

int16_t idleRowsBaseY()
{
    if (!idleKindIntroActive) return 20 - idleScrollOffset();
    const float progress = easeInOut(idleTransitionProgress(timetableTransitionMs, true));
    if (progress >= 1.0f) return 20;
    return static_cast<int16_t>(roundf(64.0f - 44.0f * progress));
}

String idleAnimatedHeader(const String &title)
{
    const size_t length = title.length();
    if (length == 0) return title;

    if (idleKindIntroActive)
    {
        const float progress = idleTransitionProgress(timetableTransitionMs, true);
        const size_t visible = min(length, static_cast<size_t>(ceilf(static_cast<float>(length) * progress)));
        return title.substring(0, visible);
    }

    if (!idleKindChangingToNext()) return title;

    const float progress = idleTransitionProgress(timetableTransitionMs, false);
    if (progress <= 0.0f) return title;
    const size_t visible = min(length, static_cast<size_t>(floorf(static_cast<float>(length) * (1.0f - progress))));
    return title.substring(0, visible);
}

void drawTimetableTopFadeMask()
{
    const uint16_t black = panelColor(0, 0, 0);
    display->fillRect(0, 0, PanelWidth, 14, black);
    for (uint8_t y = 15; y <= 23; ++y)
    {
        const uint8_t stride = y == 15 ? 2 : y <= 17 ? 3 : y <= 20 ? 4 : 6;
        for (uint8_t x = 0; x < PanelWidth; ++x)
        {
            if ((x + y) % stride == 0)
            {
                display->drawPixel(x, y, black);
            }
        }
    }
}

void drawWifiStatus(const char *title, const char *line1, const char *line2, uint16_t color)
{
    drawStatusLines(title, line1, line2, "", color);
}

void drawError(const char *title, const String &detail)
{
    drawStatusLines(title, detail.substring(0, 19).c_str(), detail.substring(19, 38).c_str(), "", colorCanceled());
}

String valueOr(JsonVariantConst value, const String &fallback = "")
{
    if (value.is<const char *>()) return String(value.as<const char *>());
    return fallback;
}

String joinNonEmpty(const String &a, const String &separator, const String &b)
{
    if (a.length() && b.length()) return a + separator + b;
    return a.length() ? a : b;
}

String flightMetricLine(JsonObject flight, bool secondLine)
{
    JsonObject metrics = flight["metrics"];
    if (secondLine)
    {
        const String track = valueOr(metrics["track"]);
        const String verticalRate = valueOr(metrics["verticalRate"]);
        return joinNonEmpty(track.length() ? "TRK:" + track : "", " ", verticalRate.length() ? "VR:" + verticalRate : "");
    }

    const String altitude = valueOr(metrics["altitude"]);
    const String speed = valueOr(metrics["speed"]);
    const String line = joinNonEmpty(altitude.length() ? "ALT:" + altitude : "", " ", speed.length() ? "SPD:" + speed : "");
    return line.length() ? line : "NO LIVE METRICS";
}

void drawPlaceholderLogo(int16_t x, int16_t y, uint8_t size)
{
    const uint16_t blue = panelColor(0x10, 0x5A, 0xB7);
    const uint16_t darkBlue = panelColor(0x0D, 0x4A, 0x96);
    const uint16_t white = colorData();
    const uint16_t lightBlue = panelColor(0x8F, 0xC2, 0xFF);

    display->fillCircle(x + size / 2, y + size / 2, size / 2, blue);
    display->fillCircle(x + size / 2 + 4, y + size / 2 + 2, size / 2 - 7, darkBlue);
    display->fillRect(x + 15, y + 13, 13, 2, white);
    display->fillRect(x + 12, y + 16, 18, 2, white);
    display->fillRect(x + 10, y + 19, 22, 2, white);
    display->fillRect(x + 13, y + 22, 16, 2, white);
    display->fillRect(x + 16, y + 25, 10, 2, white);
    display->fillRect(x + 8, y + 31, 26, 2, lightBlue);
}

void drawDisplayText(const String &airline, const String &route, const String &aircraft, const String &context)
{
    drawTextFit(airline, 50, 5, lineAirlineColor ? lineAirlineColor : colorData(), 75);
    drawTextFit(route, 50, 19, lineRouteColor ? lineRouteColor : colorData(), 75);
    drawTextFit(aircraft, 50, 33, lineAircraftColor ? lineAircraftColor : colorData(), 75);
    drawTickerText(context, 3, 52, lineContextColor ? lineContextColor : colorData(), 122);
}

bool fetchText(const char *url, String &body, int &httpCode, TickType_t lockWait = portMAX_DELAY)
{
    bool locked = false;
    if (networkMutex)
    {
        if (xSemaphoreTake(networkMutex, lockWait) != pdTRUE)
        {
            httpCode = -2;
            return false;
        }
        locked = true;
    }

    pauseRealtimeForHttp();

    WiFiClientSecure client;
    client.setCACert(WorkerTlsRootCa);

    HTTPClient http;
    http.setTimeout(12000);
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

    if (!http.begin(client, url))
    {
        httpCode = -1;
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }

    if (deviceAuthToken.length() > 0)
    {
        http.addHeader("X-Flight-Device-Token", deviceAuthToken);
    }

    httpCode = http.GET();
    if (httpCode > 0)
    {
        body = http.getString();
    }
    http.end();
    resumeRealtimeAfterHttp();
    if (locked) xSemaphoreGive(networkMutex);

    return httpCode >= 200 && httpCode < 300;
}

bool postJson(const char *url, const String &payload, String &body, int &httpCode, TickType_t lockWait = portMAX_DELAY)
{
    bool locked = false;
    if (networkMutex)
    {
        if (xSemaphoreTake(networkMutex, lockWait) != pdTRUE)
        {
            httpCode = -2;
            return false;
        }
        locked = true;
    }

    pauseRealtimeForHttp();

    WiFiClientSecure client;
    client.setCACert(WorkerTlsRootCa);

    HTTPClient http;
    http.setTimeout(12000);
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

    if (!http.begin(client, url))
    {
        httpCode = -1;
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }

    http.addHeader("Content-Type", "application/json");
    if (deviceAuthToken.length() > 0)
    {
        http.addHeader("X-Flight-Device-Token", deviceAuthToken);
    }

    httpCode = http.POST(payload);
    if (httpCode > 0)
    {
        body = http.getString();
    }
    http.end();
    resumeRealtimeAfterHttp();
    if (locked) xSemaphoreGive(networkMutex);

    return httpCode >= 200 && httpCode < 300;
}

void handleRemoteSoundState(uint32_t remoteSoundTestNonce, uint8_t nextAudioVolumePercent)
{
    applyAudioVolume(nextAudioVolumePercent);

    if (!audioTestNonceSeen)
    {
        lastSoundTestNonce = remoteSoundTestNonce;
        audioTestNonceSeen = true;
    }
    else if (remoteSoundTestNonce > lastSoundTestNonce)
    {
        lastSoundTestNonce = remoteSoundTestNonce;
        queuePaSound("remote-test");
    }
}

void clearDeviceProvisioning()
{
    devicePreferences.begin("sky_device", false);
    devicePreferences.remove("token");
    devicePreferences.remove("screen");
    devicePreferences.remove("device");
    devicePreferences.end();
    deviceAuthToken = "";
    provisionPairingCode = "";
    provisionScreenId = "";
    provisionDeviceId = "";
    realtimeConfigured = false;
    realtimeStateSeen = false;
    lastRealtimeConfigVersion = "";
    lastRealtimeScreenVersion = "";
    lastRealtimeSoundNonce = 0;
}

void executeDeviceCommand(const String &command, uint32_t nonce)
{
    if (nonce != 0 && nonce <= lastDeviceCommandNonce) return;
    if (nonce != 0) rememberDeviceCommandNonce(nonce);

    Serial.print("Device command: ");
    Serial.print(command);
    Serial.print(" nonce=");
    Serial.println(nonce);

    if (command == "restart")
    {
        drawBrandedStatusLines("RESTART", "Restarting", "", "", colorHeader());
        delay(700);
        ESP.restart();
    }
    else if (command == "unpair")
    {
        clearDeviceProvisioning();
        drawBrandedStatusLines("PAIRING", "Account removed", "Starting", "", colorHeader());
        delay(900);
        ESP.restart();
    }
    else if (command == "forget_wifi")
    {
        wifiSetupManager.clearCredentials();
        drawBrandedStatusLines("WIFI SETUP", "Network cleared", "Restarting", "", colorHeader());
        delay(900);
        ESP.restart();
    }
    else if (command == "factory_reset")
    {
        clearDeviceProvisioning();
        wifiSetupManager.clearCredentials();
        drawBrandedStatusLines("RESET", "All settings cleared", "Restarting", "", colorHeader());
        delay(900);
        ESP.restart();
    }
    else if (command == "ota_update")
    {
        drawBrandedStatusLines("UPDATE", "Checking", "Firmware", "", colorHeader());
        requestOtaUpdate();
    }
}

void handleDeviceCommandPayload(JsonVariantConst value)
{
    if (value.isNull()) return;

    String command;
    uint32_t nonce = 0;
    if (value.is<const char *>())
    {
        command = value.as<String>();
    }
    else if (value.is<JsonObjectConst>())
    {
        JsonObjectConst obj = value.as<JsonObjectConst>();
        command = valueOr(obj["command"]);
        nonce = obj["commandNonce"] | 0;
    }
    command.trim();
    if (command.isEmpty()) return;
    executeDeviceCommand(command, nonce);
}

void fetchSoundState()
{
    String body;
    int httpCode = 0;
    if (!fetchText(SoundStateUrl, body, httpCode, 0))
    {
        if (httpCode == -2) return;
        Serial.print("Sound state failed, HTTP ");
        Serial.println(httpCode);
        return;
    }

    JsonDocument doc;
    const DeserializationError error = deserializeJson(doc, body);
    if (error)
    {
        Serial.print("Sound state JSON failed: ");
        Serial.println(error.c_str());
        return;
    }

    const uint8_t nextAudioVolumePercent = constrain(doc["volumePercent"] | AudioVolumePercentDefault, 0, 100);
    const uint32_t remoteSoundTestNonce = doc["testNonce"] | 0;
    handleRemoteSoundState(remoteSoundTestNonce, nextAudioVolumePercent);
}

void fetchRealtimeState()
{
    String body;
    int httpCode = 0;
    if (!fetchText(RealtimeStateUrl, body, httpCode, 0))
    {
        if (httpCode == -2) return;
        Serial.print("Realtime state failed, HTTP ");
        Serial.println(httpCode);
        return;
    }

    JsonDocument doc;
    const DeserializationError error = deserializeJson(doc, body);
    if (error)
    {
        Serial.print("Realtime state JSON failed: ");
        Serial.println(error.c_str());
        return;
    }

    const String configVersion = valueOr(doc["configVersion"]);
    const String screenVersion = valueOr(doc["screenVersion"]);
    const uint32_t soundNonce = doc["soundTestNonce"] | 0;
    const uint8_t nextAudioVolumePercent = constrain(doc["volumePercent"] | AudioVolumePercentDefault, 0, 100);
    handleDeviceCommandPayload(doc["deviceCommand"]);

    if (!realtimeStateSeen)
    {
        lastRealtimeConfigVersion = configVersion;
        lastRealtimeScreenVersion = screenVersion;
        lastRealtimeSoundNonce = soundNonce;
        realtimeStateSeen = true;
        handleRemoteSoundState(soundNonce, nextAudioVolumePercent);
        return;
    }

    if (configVersion != lastRealtimeConfigVersion || screenVersion != lastRealtimeScreenVersion)
    {
        lastRealtimeConfigVersion = configVersion;
        lastRealtimeScreenVersion = screenVersion;
        Serial.println("Realtime state changed: config");
        requestConfigFetch();
        nextConfigFetchAt = UINT32_MAX;
        if (screenActive)
        {
            requestDisplayFetch();
            nextDisplayFetchAt = UINT32_MAX;
        }
    }

    if (soundNonce > lastRealtimeSoundNonce)
    {
        lastRealtimeSoundNonce = soundNonce;
        handleRemoteSoundState(soundNonce, nextAudioVolumePercent);
    }
}

void soundPollTask(void *)
{
    for (;;)
    {
        if (WiFi.status() == WL_CONNECTED && hasDeviceToken())
        {
            fetchRealtimeState();
            if (otaUpdateRequested)
            {
                otaUpdateRequested = false;
                checkFirmwareUpdate(true);
            }
            else
            {
                checkFirmwareUpdate(false);
            }
            postDeviceStatusIfDue();
        }
        vTaskDelay(pdMS_TO_TICKS(static_cast<uint32_t>(RealtimeStatePollSeconds) * 1000UL));
    }
}

bool requestConfigFetch()
{
    if (!hasDeviceToken()) return false;
    if (!pendingPayloadMutex) return false;
    bool queued = false;
    xSemaphoreTake(pendingPayloadMutex, portMAX_DELAY);
    if (!configFetchRequested && !configFetchActive && !pendingConfigReady)
    {
        configFetchRequested = true;
        queued = true;
    }
    xSemaphoreGive(pendingPayloadMutex);
    return queued;
}

bool requestDisplayFetch()
{
    if (!hasDeviceToken()) return false;
    if (!pendingPayloadMutex) return false;
    bool queued = false;
    xSemaphoreTake(pendingPayloadMutex, portMAX_DELAY);
    if (!displayFetchRequested && !displayFetchActive && !pendingDisplayReady)
    {
        displayFetchRequested = true;
        queued = true;
    }
    xSemaphoreGive(pendingPayloadMutex);
    return queued;
}

void handleRealtimeText(const uint8_t *payload, size_t length)
{
    JsonDocument doc;
    const DeserializationError error = deserializeJson(doc, payload, length);
    if (error)
    {
        Serial.print("Realtime JSON failed: ");
        Serial.println(error.c_str());
        return;
    }

    const String type = valueOr(doc["type"]);
    Serial.print("Realtime event: ");
    Serial.println(type);

    if (type == "config_changed")
    {
        requestConfigFetch();
        nextConfigFetchAt = UINT32_MAX;
    }
    else if (type == "display_changed")
    {
        if (screenActive)
        {
            requestDisplayFetch();
            nextDisplayFetchAt = UINT32_MAX;
        }
    }
    else if (type == "sound_test")
    {
        const uint8_t nextAudioVolumePercent = constrain(doc["volumePercent"] | AudioVolumePercentDefault, 0, 100);
        const uint32_t remoteSoundTestNonce = doc["testNonce"] | 0;
        handleRemoteSoundState(remoteSoundTestNonce, nextAudioVolumePercent);
    }
    else if (type == "device_command")
    {
        executeDeviceCommand(valueOr(doc["command"]), doc["commandNonce"] | 0);
    }
}

String buildDeviceStatusPayload()
{
    JsonDocument doc;
    doc["type"] = "device_status";
    doc["source"] = "firmware-hub75";
    doc["connected"] = true;
    doc["deviceId"] = WiFi.macAddress();
    doc["firmwareVersion"] = SKYFRAME_FW_VERSION;
    doc["uptimeMs"] = millis();
    doc["screenActive"] = screenActive;
    doc["configOk"] = lastConfigOk;
    doc["displayOk"] = lastDisplayOk;
    doc["displayMode"] = lastDisplayMode;

    JsonObject ota = doc["ota"].to<JsonObject>();
    ota["status"] = otaStatus;
    ota["lastError"] = lastOtaError;
    ota["latestVersion"] = lastOtaVersion;
    ota["lastCheckedMs"] = lastOtaCheckedAt;

    JsonObject wifi = doc["wifi"].to<JsonObject>();
    wifi["connected"] = true;
    wifi["hostname"] = defaultHostname();
    wifi["ssid"] = WiFi.SSID();
    wifi["rssi"] = WiFi.RSSI();
    wifi["ip"] = WiFi.localIP().toString();

    String payload;
    serializeJson(doc, payload);
    return payload;
}

void postDeviceStatusIfDue()
{
    const uint32_t now = millis();
    if (lastDeviceStatusPostedAt != 0 && now - lastDeviceStatusPostedAt < DeviceStatusIntervalMs) return;

    String body;
    int httpCode = 0;
    String payload = buildDeviceStatusPayload();
    if (!postJson(DeviceStatusUrl, payload, body, httpCode, pdMS_TO_TICKS(100)))
    {
        if (httpCode != -2)
        {
            Serial.print("Device status POST failed, HTTP ");
            Serial.println(httpCode);
        }
        return;
    }
    lastDeviceStatusPostedAt = now;
}

void sendDeviceStatus()
{
    if (!hasDeviceToken() || !realtimeSocket.isConnected() || WiFi.status() != WL_CONNECTED) return;

    String payload = buildDeviceStatusPayload();
    realtimeSocket.sendTXT(payload);
    lastDeviceStatusSentAt = millis();
}

void realtimeSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
    switch (type)
    {
        case WStype_CONNECTED:
            Serial.println("Realtime connected");
            sendDeviceStatus();
            break;
        case WStype_DISCONNECTED:
            Serial.println("Realtime disconnected");
            break;
        case WStype_TEXT:
            handleRealtimeText(payload, length);
            break;
        case WStype_ERROR:
            Serial.println("Realtime error");
            break;
        default:
            break;
    }
}

void configureRealtimeSocket()
{
    if (!hasDeviceToken()) return;
    if (realtimeConfigured) return;
    realtimeConfigured = true;

    if (deviceAuthToken.length() > 0)
    {
        realtimeExtraHeaders = String("X-Flight-Device-Token: ") + deviceAuthToken + "\r\n";
        realtimeSocket.setExtraHeaders(realtimeExtraHeaders.c_str());
    }
    realtimeSocket.beginSslWithCA(RealtimeHost, 443, RealtimePath, WorkerTlsRootCa, "");
    realtimeSocket.onEvent(realtimeSocketEvent);
    realtimeSocket.setReconnectInterval(5000);
    realtimeSocket.enableHeartbeat(15000, 3000, 2);
}

void realtimeTask(void *)
{
    configureRealtimeSocket();
    for (;;)
    {
        if (realtimePausedForHttp)
        {
            if (realtimeSocket.isConnected())
            {
                realtimeSocket.disconnect();
            }
            vTaskDelay(pdMS_TO_TICKS(50));
            continue;
        }

        if (WiFi.status() == WL_CONNECTED && hasDeviceToken())
        {
            realtimeSocket.loop();
            const uint32_t now = millis();
            if (realtimeSocket.isConnected()
                && (lastDeviceStatusSentAt == 0 || now - lastDeviceStatusSentAt >= DeviceStatusIntervalMs))
            {
                sendDeviceStatus();
            }
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

bool takePendingConfig(String &body, int &httpCode, bool &ok)
{
    if (!pendingPayloadMutex) return false;
    bool ready = false;
    xSemaphoreTake(pendingPayloadMutex, portMAX_DELAY);
    if (pendingConfigReady)
    {
        body = pendingConfigBody;
        httpCode = pendingConfigHttpCode;
        ok = pendingConfigOk;
        pendingConfigBody = "";
        pendingConfigReady = false;
        ready = true;
    }
    xSemaphoreGive(pendingPayloadMutex);
    return ready;
}

bool takePendingDisplay(String &body, int &httpCode, bool &ok)
{
    if (!pendingPayloadMutex) return false;
    bool ready = false;
    xSemaphoreTake(pendingPayloadMutex, portMAX_DELAY);
    if (pendingDisplayReady)
    {
        body = pendingDisplayBody;
        httpCode = pendingDisplayHttpCode;
        ok = pendingDisplayOk;
        pendingDisplayBody = "";
        pendingDisplayReady = false;
        ready = true;
    }
    xSemaphoreGive(pendingPayloadMutex);
    return ready;
}

void networkPollTask(void *)
{
    for (;;)
    {
        bool doConfig = false;
        bool doDisplay = false;

        if (pendingPayloadMutex)
        {
            xSemaphoreTake(pendingPayloadMutex, portMAX_DELAY);
            doConfig = configFetchRequested;
            if (doConfig) configFetchRequested = false;
            doDisplay = displayFetchRequested;
            if (doDisplay) displayFetchRequested = false;
            xSemaphoreGive(pendingPayloadMutex);
        }

        if (WiFi.status() == WL_CONNECTED && doConfig)
        {
            Serial.println("Fetching device config");
            configFetchActive = true;
            String body;
            int httpCode = 0;
            const bool ok = fetchText(DeviceConfigUrl, body, httpCode);

            xSemaphoreTake(pendingPayloadMutex, portMAX_DELAY);
            pendingConfigBody = body;
            pendingConfigHttpCode = httpCode;
            pendingConfigOk = ok;
            pendingConfigReady = true;
            xSemaphoreGive(pendingPayloadMutex);
        }

        if (WiFi.status() == WL_CONNECTED && doDisplay)
        {
            Serial.println("Fetching display payload");
            displayFetchActive = true;
            String body;
            int httpCode = 0;
            bool ok = fetchText(DisplayUrl, body, httpCode);
            if (!ok && httpCode < 0)
            {
                Serial.print("Display fetch transient HTTP ");
                Serial.print(httpCode);
                Serial.println(", retrying");
                vTaskDelay(pdMS_TO_TICKS(350));
                body = "";
                httpCode = 0;
                ok = fetchText(DisplayUrl, body, httpCode);
            }

            xSemaphoreTake(pendingPayloadMutex, portMAX_DELAY);
            pendingDisplayBody = body;
            pendingDisplayHttpCode = httpCode;
            pendingDisplayOk = ok;
            pendingDisplayReady = true;
            xSemaphoreGive(pendingPayloadMutex);
        }

        vTaskDelay(pdMS_TO_TICKS(20));
    }
}

String absoluteUrl(const String &url)
{
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return String(ServerBaseUrl) + url;
    return String(ServerBaseUrl) + "/" + url;
}

bool fetchLogoRgb565(const String &url)
{
    if (!url.length()) return false;
    const String resolvedUrl = absoluteUrl(url);
    if (cachedLogoUrl == resolvedUrl && (cachedLogoOk || millis() - cachedLogoCheckedAt < 60000UL)) return cachedLogoOk;

    cachedLogoUrl = resolvedUrl;
    cachedLogoCheckedAt = millis();
    cachedLogoOk = false;

    bool locked = false;
    if (networkMutex)
    {
        xSemaphoreTake(networkMutex, portMAX_DELAY);
        locked = true;
    }

    pauseRealtimeForHttp();

    WiFiClientSecure client;
    client.setCACert(WorkerTlsRootCa);

    HTTPClient http;
    http.setTimeout(12000);
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

    if (!http.begin(client, resolvedUrl))
    {
        Serial.println("Logo begin failed");
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }

    if (deviceAuthToken.length() > 0)
    {
        http.addHeader("X-Flight-Device-Token", deviceAuthToken);
    }

    const int httpCode = http.GET();
    const int contentLength = http.getSize();
    if (httpCode < 200 || httpCode >= 300 || (contentLength >= 0 && contentLength != static_cast<int>(LogoBytes)))
    {
        Serial.print("Logo failed, HTTP ");
        Serial.print(httpCode);
        Serial.print(" bytes=");
        Serial.println(contentLength);
        http.end();
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }

    WiFiClient *stream = http.getStreamPtr();
    size_t received = 0;
    uint32_t lastDataAt = millis();
    while (received < LogoBytes && millis() - lastDataAt < 4000)
    {
        const int available = stream->available();
        if (available > 0)
        {
            const size_t chunk = min(static_cast<size_t>(available), LogoBytes - received);
            received += stream->readBytes(logoBuffer + received, chunk);
            lastDataAt = millis();
        }
        else
        {
            delay(2);
        }
    }

    http.end();
    resumeRealtimeAfterHttp();
    if (locked) xSemaphoreGive(networkMutex);
    cachedLogoOk = received == LogoBytes;
    Serial.print("Logo ");
    Serial.print(cachedLogoOk ? "OK " : "short ");
    Serial.print(received);
    Serial.print("/");
    Serial.println(LogoBytes);
    return cachedLogoOk;
}

void drawLogoRgb565(int16_t x, int16_t y)
{
    for (uint8_t row = 0; row < LogoHeight; ++row)
    {
        for (uint8_t col = 0; col < LogoWidth; ++col)
        {
            const size_t offset = (static_cast<size_t>(row) * LogoWidth + col) * 2;
            const uint16_t color = static_cast<uint16_t>(logoBuffer[offset]) | (static_cast<uint16_t>(logoBuffer[offset + 1]) << 8);
            uint8_t r = static_cast<uint8_t>(((color >> 11) & 0x1F) * 255 / 31);
            uint8_t g = static_cast<uint8_t>(((color >> 5) & 0x3F) * 255 / 63);
            uint8_t b = static_cast<uint8_t>((color & 0x1F) * 255 / 31);

            const uint8_t maxChannel = max(r, max(g, b));
            const uint8_t minChannel = min(r, min(g, b));
            const uint8_t chroma = maxChannel - minChannel;

            if (maxChannel > 0)
            {
                r = min<uint16_t>(255, static_cast<uint16_t>(r) * 110 / 100);
                g = min<uint16_t>(255, static_cast<uint16_t>(g) * 110 / 100);
                b = min<uint16_t>(255, static_cast<uint16_t>(b) * 110 / 100);
            }

            if (chroma > 10)
            {
                const int16_t avg = (static_cast<int16_t>(r) + static_cast<int16_t>(g) + static_cast<int16_t>(b)) / 3;
                r = constrain(avg + ((static_cast<int16_t>(r) - avg) * 135) / 100, 0, 255);
                g = constrain(avg + ((static_cast<int16_t>(g) - avg) * 135) / 100, 0, 255);
                b = constrain(avg + ((static_cast<int16_t>(b) - avg) * 135) / 100, 0, 255);
            }

            display->drawPixelRGB888(x + col, y + row, r, g, b);
        }
    }
}

void applySafeBrightness(uint8_t requested)
{
    const uint8_t applied = constrain(requested, static_cast<uint8_t>(0), static_cast<uint8_t>(255));
    display->setBrightness8(applied);
}

bool applyDeviceConfigPayload(const String &body, int httpCode, bool httpOk)
{
    const bool hadActiveLayout = hasActiveContentLayout();
    const bool screenWasInactive = !screenActive;
    configFetchActive = true;
    if (screenWasInactive)
    {
        drawBlackScreen();
    }
    else if (hadActiveLayout)
    {
        redrawActiveContent();
    }

    if (!httpOk)
    {
        configFetchActive = false;
        lastConfigOk = false;
        Serial.print("Device config failed, HTTP ");
        Serial.println(httpCode);
        if (screenWasInactive)
        {
            drawBlackScreen();
        }
        else if (hadActiveLayout)
        {
            redrawActiveContent();
        }
        else
        {
            drawBlackScreen();
        }
        return false;
    }

    JsonDocument doc;
    const DeserializationError error = deserializeJson(doc, body);
    if (error)
    {
        configFetchActive = false;
        lastConfigOk = false;
        Serial.print("Device config JSON failed: ");
        Serial.println(error.c_str());
        if (screenWasInactive)
        {
            drawBlackScreen();
        }
        else if (hadActiveLayout)
        {
            redrawActiveContent();
        }
        else
        {
            drawBlackScreen();
        }
        return false;
    }

    const char *airport = doc["homeAirportIata"] | "";
    JsonObject device = doc["device"];
    const bool monitor = device["airspaceMonitoringEnabled"] | false;
    JsonObject remoteScreenState = doc["screenState"];
    const bool previousScreenActive = screenActive;
    screenActive = remoteScreenState["active"] | true;
    brightnessMode = valueOr(remoteScreenState["brightnessMode"], "day");
    const uint8_t requestedBrightness = device["effectiveBrightness8"] | (device["effectiveBrightness"] | (device["brightness"] | Brightness));
    displayPollSeconds = constrain(device["pollSeconds"] | 60, 15, 600);
    configRefreshSeconds = constrain(device["configRefreshSeconds"] | ConfigFallbackPollSeconds, 60, 3600);
    displayCycleSeconds = constrain(device["displayCycleSeconds"] | 5, 2, 30);
    timetableCycleSeconds = constrain(device["timetableCycleSeconds"] | 10, 3, 120);
    liveScrollPixelsPerSecond = constrain(device["scrollPixelsPerSecond"] | 9, 2, 30);
    timetableScrollPixelsPerSecond = constrain(device["timetableScrollPixelsPerSecond"] | 40, 4, 100);
    timetableTransitionMs = constrain(device["timetableTransitionMs"] | TimetableKindTransitionDefaultMs, 200, 1000);
    const String nextTimeZone = valueOr(device["timezone"], deviceTimeZone);
    const String nextTimeZonePosix = valueOr(device["timezonePosix"], String(OsloTimeZone));

    const uint16_t defaultHeaderColor = panelColor(0xF7, 0xB5, 0x00);
    const uint16_t defaultDataColor = panelColor(0xF4, 0xF7, 0xFF);
    const uint16_t defaultCanceledColor = panelColor(0xFF, 0x3B, 0x30);
    JsonObject timetableColors = device["timetableColors"];
    timetableHeaderColor = parseHexColorOr(valueOr(timetableColors["header"]), defaultHeaderColor);
    timetableDataColor = parseHexColorOr(valueOr(timetableColors["data"]), defaultDataColor);
    timetableTimeColor = parseHexColorOr(valueOr(timetableColors["time"]), defaultDataColor);
    timetableNewTimeColor = parseHexColorOr(valueOr(timetableColors["newTime"]), defaultHeaderColor);
    timetableCanceledColor = parseHexColorOr(valueOr(timetableColors["canceled"]), defaultCanceledColor);
    timetableGateGoToGateColor = parseHexColorOr(valueOr(timetableColors["gateGoToGate"]), panelColor(0x00, 0xF9, 0x00));
    timetableGateBoardingColor = parseHexColorOr(valueOr(timetableColors["gateBoarding"]), panelColor(0x00, 0xF9, 0x00));
    timetableGateClosingColor = parseHexColorOr(valueOr(timetableColors["gateClosing"]), panelColor(0xFF, 0x93, 0x00));
    timetableGateClosedColor = parseHexColorOr(valueOr(timetableColors["gateClosed"]), panelColor(0xFF, 0x26, 0x00));
    timetableLandedColor = parseHexColorOr(valueOr(timetableColors["landed"]), panelColor(0x00, 0xF9, 0x00));

    JsonObject lineColors = device["lineColors"];
    lineAirlineColor = parseHexColorOr(valueOr(lineColors["airline"]), defaultDataColor);
    lineRouteColor = parseHexColorOr(valueOr(lineColors["route"]), defaultDataColor);
    lineAircraftColor = parseHexColorOr(valueOr(lineColors["aircraft"]), defaultDataColor);
    lineContextColor = parseHexColorOr(valueOr(lineColors["context"]), defaultDataColor);
    lineProgressColor = parseHexColorOr(valueOr(lineColors["progress"]), defaultHeaderColor);
    lineRouteProgressColor = parseHexColorOr(valueOr(lineColors["routeProgress"]), panelColor(0x00, 0xD4, 0x6A));
    lineLandColor = parseHexColorOr(valueOr(lineColors["land"]), panelColor(0, 0, 0));
    lineIconColor = parseHexColorOr(valueOr(lineColors["icon"]), panelColor(0xFF, 0xC7, 0x77));
    const String nextClockTopColor = valueOr(device["clockTopColor"], "#ffffff");
    const String nextClockColor = valueOr(device["clockColor"], "#081b6b");
    parseHexRgb(nextClockTopColor, clockGradientTopR, clockGradientTopG, clockGradientTopB);
    parseHexRgb(nextClockColor, clockGradientBottomR, clockGradientBottomG, clockGradientBottomB);

    JsonObject audio = doc["audio"];
    const uint8_t nextAudioVolumePercent = constrain(audio["volumePercent"] | AudioVolumePercentDefault, 0, 100);
    const uint32_t remoteSoundTestNonce = audio["testNonce"] | 0;

    const bool timezoneChanged = nextTimeZonePosix != deviceTimeZonePosix;
    deviceTimeZone = nextTimeZone;
    deviceTimeZonePosix = nextTimeZonePosix;
    if (timezoneChanged)
    {
        initLocalTime();
    }

    effectiveBrightness = requestedBrightness;
    applySafeBrightness(effectiveBrightness);
    handleRemoteSoundState(remoteSoundTestNonce, nextAudioVolumePercent);

    if (!screenActive && previousScreenActive)
    {
        screenInactiveSince = millis();
        drawBlackScreen();
    }
    else if (screenActive && !previousScreenActive)
    {
        screenInactiveSince = 0;
    }
    else if (!screenActive && screenInactiveSince == 0)
    {
        screenInactiveSince = millis();
    }
    lastConfigOk = true;

    Serial.print("Device config OK. airport=");
    Serial.print(airport);
    Serial.print(" airspace=");
    Serial.print(monitor ? "true" : "false");
    Serial.print(" brightness=");
    Serial.print(effectiveBrightness);
    Serial.print(" brightnessMode=");
    Serial.print(brightnessMode);
    Serial.print(" screenActive=");
    Serial.print(screenActive ? "true" : "false");
    Serial.print(" pollSeconds=");
    Serial.print(displayPollSeconds);
    Serial.print(" configRefreshSeconds=");
    Serial.print(configRefreshSeconds);
    Serial.print(" displayCycleSeconds=");
    Serial.print(displayCycleSeconds);
    Serial.print(" timetableCycleSeconds=");
    Serial.print(timetableCycleSeconds);
    Serial.print(" scrollPixelsPerSecond=");
    Serial.print(liveScrollPixelsPerSecond);
    Serial.print(" timetableScrollPixelsPerSecond=");
    Serial.print(timetableScrollPixelsPerSecond);
    Serial.print(" timezone=");
    Serial.println(deviceTimeZone);

    configFetchActive = false;
    if (!screenActive)
    {
        drawBlackScreen();
    }
    else if (hadActiveLayout)
    {
        redrawActiveContent();
    }
    else
    {
        drawBlackScreen();
    }
    return true;
}

void drawIdleRow(const IdleScreen &screen, const IdleRow &row, int16_t y)
{
    if (y <= TimetableRowsTopY - 8 || y >= TimetableRowsBottomY) return;

    const uint16_t yellow = colorHeader();
    const uint16_t white = colorData();
    if (row.status == "empty" || row.message.length())
    {
        String message = row.message.length() ? row.message : row.flightId;
        int separator = message.indexOf('|');
        String line1 = separator >= 0 ? message.substring(0, separator) : message;
        String line2 = separator >= 0 ? message.substring(separator + 1) : "";
        line1.toUpperCase();
        line2.toUpperCase();
        drawTextFitClipped(line1, 3, y, white, 122);
        if (line2.length()) drawTextFitClipped(line2, 3, y + 11, white, 122);
        return;
    }

    const uint16_t timeDefault = timetableTimeColor ? timetableTimeColor : white;
    const uint16_t newTimeColor = timetableNewTimeColor ? timetableNewTimeColor : yellow;
    const uint16_t red = colorCanceled();
    const bool canceled = row.status == "canceled";
    const bool newTime = row.status == "newTime";
    const uint16_t rowColor = canceled ? red : white;
    const uint16_t timeColor = canceled ? red : (newTime ? newTimeColor : timeDefault);

    drawIdleTimeClipped(row.time, 3, y, timeColor);
    drawIdleDestinationTicker(row.airport, 31, y, rowColor, 60);
    drawTextFitClipped(idleFlightFieldText(screen.kind, row), 97, y, rowColor, 18);
    drawIdleRowSymbol(screen.kind, row, 116, y);
    if (canceled && y + 3 >= TimetableRowsTopY && y + 3 < TimetableRowsBottomY)
    {
        display->drawFastHLine(3, y + 3, 122, red);
    }
}

void drawIdleRows(uint8_t index, int16_t baseY)
{
    if (index >= idleScreenCount) return;
    const IdleScreen &screen = idleScreens[index];
    for (uint8_t i = 0; i < screen.rowCount; ++i)
    {
        drawIdleRow(screen, screen.rows[i], baseY + i * 11);
    }
}

void drawIdleScreen(uint8_t index)
{
    idleLayoutActive = false;
    liveLayoutActive = false;
    clockLayoutActive = false;
    if (idleScreenCount == 0 || index >= idleScreenCount)
    {
        drawBlackScreen();
        return;
    }

    const IdleScreen &screen = idleScreens[index];
    const uint16_t yellow = colorHeader();
    const uint16_t white = colorData();
    const uint16_t clockColor = timetableTimeColor ? timetableTimeColor : white;
    const int16_t offset = idleScrollOffset();
    const uint8_t nextIndex = nextIdleScreenIndex();
    const bool showNext = idleScreenCount > 1 && screen.kind == idleScreens[nextIndex].kind && offset > 0 && !idleKindIntroActive;

    display->fillScreen(panelColor(0, 0, 0));
    display->setTextSize(1);
    display->setTextWrap(false);
    drawIdleRows(index, idleRowsBaseY());
    if (showNext) drawIdleRows(nextIndex, 64 - offset);
    drawTextFit(idleAnimatedHeader(screen.title), 3, 3, yellow, 86);
    drawClockRight(125, 3, clockColor);
    display->drawFastHLine(3, 14, 122, yellow);
    drawFetchIndicator();

    idleLayoutActive = true;
    presentFrame();
}

bool incomingIdleScreensMatch(JsonArray screens)
{
    const uint8_t incomingCount = min(static_cast<size_t>(MaxIdleScreens), screens.size());
    if (incomingCount != idleScreenCount) return false;

    for (uint8_t i = 0; i < incomingCount; ++i)
    {
        JsonObject source = screens[i];
        const IdleScreen &current = idleScreens[i];
        if (current.title != String(source["title"] | source["kind"] | "IDLE")) return false;
        if (current.kind != String(source["kind"] | "")) return false;

        JsonArray rows = source["rows"].as<JsonArray>();
        const uint8_t incomingRows = min(static_cast<size_t>(MaxIdleRows), rows.size());
        if (incomingRows != current.rowCount) return false;

        for (uint8_t rowIndex = 0; rowIndex < incomingRows; ++rowIndex)
        {
            JsonObject row = rows[rowIndex];
            const IdleRow &currentRow = current.rows[rowIndex];
            if (currentRow.flightId != String(row["flightId"] | "")) return false;
            if (currentRow.airport != String(row["airport"] | "")) return false;
            if (currentRow.time != String(row["time"] | "")) return false;
            if (currentRow.status != String(row["status"] | "")) return false;
            if (currentRow.gate != String(row["gate"] | "")) return false;
            if (currentRow.gateMessage != String(row["gateMessage"] | "")) return false;
            if (currentRow.message != String(row["message"] | "")) return false;
        }
    }
    return true;
}

void storeIdleScreens(JsonArray screens)
{
    const bool sameScreens = incomingIdleScreensMatch(screens);
    if (sameScreens)
    {
        return;
    }

    idleScreenCount = min(static_cast<size_t>(MaxIdleScreens), screens.size());
    currentIdleScreen = 0;
    idleKindIntroActive = false;
    idleOutroActive = false;
    idleOutroStartedAt = 0;

    for (uint8_t i = 0; i < idleScreenCount; ++i)
    {
        JsonObject source = screens[i];
        IdleScreen &target = idleScreens[i];
        target.title = source["title"] | source["kind"] | "IDLE";
        target.kind = source["kind"] | "";
        JsonArray rows = source["rows"].as<JsonArray>();
        target.rowCount = min(static_cast<size_t>(MaxIdleRows), rows.size());

        for (uint8_t rowIndex = 0; rowIndex < target.rowCount; ++rowIndex)
        {
            JsonObject row = rows[rowIndex];
            target.rows[rowIndex].flightId = row["flightId"] | "";
            target.rows[rowIndex].airport = row["airport"] | "";
            target.rows[rowIndex].time = row["time"] | "";
            target.rows[rowIndex].status = row["status"] | "";
            target.rows[rowIndex].gate = row["gate"] | "";
            target.rows[rowIndex].gateMessage = row["gateMessage"] | "";
            target.rows[rowIndex].message = row["message"] | "";
        }
    }

    idleCycleStartedAt = millis();
    nextIdleCycleAt = idleCycleStartedAt + static_cast<uint32_t>(timetableCycleSeconds) * 1000UL;
}

float jsonFloat(JsonVariantConst value, float fallback = 0.0f)
{
    if (value.is<float>()) return value.as<float>();
    if (value.is<int>()) return static_cast<float>(value.as<int>());
    if (value.is<const char *>())
    {
        const String text = value.as<const char *>();
        if (text.length()) return text.toFloat();
    }
    return fallback;
}

int16_t clampPixel(float value, int16_t minValue, int16_t maxValue, int16_t fallback)
{
    if (isnan(value) || isinf(value)) return fallback;
    return constrain(static_cast<int16_t>(roundf(value)), minValue, maxValue);
}

void drawMarineVesselMarker(int16_t x, int16_t y, float headingDeg, uint16_t color, bool active)
{
    const int16_t directions[8][2] = {
        {0, -1}, {1, -1}, {1, 0}, {1, 1},
        {0, 1}, {-1, 1}, {-1, 0}, {-1, -1}
    };
    int index = static_cast<int>(roundf(fmodf(headingDeg + 360.0f, 360.0f) / 45.0f)) % 8;
    const int16_t dx = directions[index][0];
    const int16_t dy = directions[index][1];
    const int16_t backX = -dx;
    const int16_t backY = -dy;
    const int16_t perpX = -dy;
    const int16_t perpY = dx;

    display->drawPixel(x + backX, y + backY, color);
    if (active)
    {
        display->drawPixel(x + backX * 2 + perpX, y + backY * 2 + perpY, color);
        display->drawPixel(x + backX * 2 - perpX, y + backY * 2 - perpY, color);
    }
    if (!active || ((millis() / 450) % 2 == 0)) display->drawPixel(x, y, color);
}

int8_t base64Value(char c)
{
    if (c >= 'A' && c <= 'Z') return c - 'A';
    if (c >= 'a' && c <= 'z') return c - 'a' + 26;
    if (c >= '0' && c <= '9') return c - '0' + 52;
    if (c == '+') return 62;
    if (c == '/') return 63;
    return -1;
}

void drawMarineLandMask(int16_t boxX, int16_t boxY, int16_t boxW, int16_t boxH)
{
    JsonObject radar = currentDisplayDoc["radar"];
    JsonObject mask = radar["landMask"];
    if (mask.isNull()) return;
    const int width = mask["width"] | 0;
    const int height = mask["height"] | 0;
    const char *encoding = mask["encoding"] | "";
    const char *data = mask["data"] | "";
    if (width <= 0 || height <= 0 || width > boxW || height > boxH) return;
    if (strcmp(encoding, "base64-land-bits-v1") != 0 || !data[0]) return;

    const uint16_t landColor = lineLandColor ? lineLandColor : panelColor(0, 0, 0);
    uint32_t buffer = 0;
    uint8_t bits = 0;
    uint16_t byteIndex = 0;
    const uint16_t totalBits = width * height;

    for (const char *p = data; *p; p++)
    {
        if (*p == '=') break;
        const int8_t value = base64Value(*p);
        if (value < 0) continue;
        buffer = (buffer << 6) | static_cast<uint8_t>(value);
        bits += 6;
        while (bits >= 8)
        {
            bits -= 8;
            const uint8_t decoded = static_cast<uint8_t>((buffer >> bits) & 0xFF);
            for (uint8_t bit = 0; bit < 8; bit++)
            {
                const uint16_t bitIndex = byteIndex * 8 + bit;
                if (bitIndex >= totalBits) return;
                if (decoded & (1 << bit))
                {
                    const int16_t x = bitIndex % width;
                    const int16_t y = bitIndex / width;
                    display->drawPixel(boxX + x, boxY + y, landColor);
                }
            }
            byteIndex++;
        }
    }
}

void drawMarineRadar(JsonObject activeItem)
{
    constexpr int16_t boxX = 1;
    constexpr int16_t boxY = 1;
    constexpr int16_t boxW = 126;
    constexpr int16_t boxH = 46;
    const uint16_t sea = lineRouteProgressColor ? lineRouteProgressColor : panelColor(0x17, 0x26, 0x5D);
    const uint16_t otherColor = lineProgressColor ? lineProgressColor : panelColor(0xA6, 0xA6, 0xA6);
    const uint16_t activeColor = lineAirlineColor ? lineAirlineColor : panelColor(0xFF, 0xC7, 0x77);

    display->fillRect(boxX, boxY, boxW, boxH, sea);
    drawMarineLandMask(boxX, boxY, boxW, boxH);

    const String activeId = valueOr(activeItem["cs"], valueOr(activeItem["flt"]));
    JsonArray vessels = currentDisplayDoc["vessels"].as<JsonArray>();
    uint8_t drawn = 0;
    for (JsonObject vessel : vessels)
    {
        if (drawn >= 12) break;
        const String vesselId = valueOr(vessel["mmsi"], valueOr(vessel["imo"], valueOr(vessel["vesselName"])));
        if (vesselId.length() && vesselId == activeId) continue;
        const float radarX = jsonFloat(vessel["radarX"], -1.0f);
        const float radarY = jsonFloat(vessel["radarY"], -1.0f);
        if (radarX < 0.0f || radarX > 1.0f || radarY < 0.0f || radarY > 1.0f) continue;
        const int16_t x = clampPixel(boxX + radarX * (boxW - 1), boxX + 3, boxX + boxW - 4, boxX + boxW / 2);
        const int16_t y = clampPixel(boxY + radarY * (boxH - 1), boxY + 3, boxY + boxH - 4, boxY + boxH / 2);
        const float headingDeg = jsonFloat(vessel["radarHeadingDeg"], jsonFloat(vessel["headingDeg"], jsonFloat(vessel["courseDeg"], jsonFloat(vessel["bearingDeg"], 0.0f))));
        drawMarineVesselMarker(x, y, headingDeg, otherColor, false);
        drawn++;
    }

    const bool hasActiveVessel = !activeItem.isNull()
        && (valueOr(activeItem["cs"]).length()
            || valueOr(activeItem["flt"]).length()
            || !activeItem["radarX"].isNull()
            || !activeItem["radarY"].isNull());
    if (hasActiveVessel)
    {
        const float activeRadarX = jsonFloat(activeItem["radarX"], 0.5f);
        const float activeRadarY = jsonFloat(activeItem["radarY"], 0.5f);
        const float activeBearingDeg = jsonFloat(activeItem["b"], 0.0f);
        const int16_t activeX = clampPixel(boxX + activeRadarX * (boxW - 1), boxX + 4, boxX + boxW - 5, boxX + boxW / 2);
        const int16_t activeY = clampPixel(boxY + activeRadarY * (boxH - 1), boxY + 4, boxY + boxH - 5, boxY + boxH / 2);
        drawMarineVesselMarker(activeX, activeY, jsonFloat(activeItem["radarHeadingDeg"], jsonFloat(activeItem["trk"], activeBearingDeg)), activeColor, true);
    }
}

void drawMarinePayload(JsonObject flight, size_t itemCount)
{
    idleLayoutActive = false;
    liveLayoutActive = false;
    clockLayoutActive = false;
    display->fillScreen(panelColor(0, 0, 0));
    display->setTextSize(1);
    display->setTextWrap(false);

    drawMarineRadar(flight);
    if (flight.isNull())
    {
        presentFrame();
        return;
    }

    JsonObject lines = flight["lines"];
    const String name = valueOr(lines["airline"], valueOr(flight["air"], valueOr(flight["cs"], "VESSEL")));
    String details = valueOr(lines["aircraft"]);
    if (!details.length())
    {
        const String destination = valueOr(flight["to"]);
        const String speed = flight["spd"].isNull() ? "-- KN" : String(jsonFloat(flight["spd"], 0.0f), 1) + " KN";
        details = speed;
        if (destination.length())
        {
            if (details.length()) details += " - ";
            details += destination;
        }
    }

    const uint16_t textColor = lineRouteColor ? lineRouteColor : panelColor(0xFF, 0xC7, 0x77);
    const String marineIcon = valueOr(flight["marineIcon"]);
    const uint8_t iconWidth = marineTypeIconWidth(marineIcon);
    if (iconWidth)
    {
        constexpr uint8_t gap = 4;
        const uint8_t maxNameWidth = max<int16_t>(1, 126 - gap - iconWidth);
        const uint8_t nameFieldWidth = min<uint16_t>(textPixelWidth(normalizeLedText(name)), maxNameWidth);
        drawTickerTextBoxedClipped(name, 1, 48, textColor, nameFieldWidth, liveCycleStartedAt, liveScrollPixelsPerSecond);
        drawMarineTypeIcon(marineIcon, 1 + nameFieldWidth + gap, 48, lineIconColor ? lineIconColor : panelColor(0xFF, 0xC7, 0x77));
    }
    else
    {
        drawTickerTextBoxedClipped(name, 1, 48, textColor, 126, liveCycleStartedAt, liveScrollPixelsPerSecond);
    }
    drawTickerTextBoxedClipped(details, 1, 56, textColor, 126, liveCycleStartedAt, liveScrollPixelsPerSecond);
    presentFrame();
}

void drawFlightPayload(JsonObject flight, const char *mode, size_t flightCount, size_t flightIndex)
{
    idleLayoutActive = false;
    liveLayoutActive = false;
    clockLayoutActive = false;
    display->fillScreen(panelColor(0, 0, 0));
    display->setTextSize(1);
    display->setTextWrap(false);
    const String logoRgb565Url = valueOr(flight["logoRgb565Url"]);
    if (fetchLogoRgb565(logoRgb565Url))
    {
        drawLogoRgb565(3, 3);
    }
    else
    {
        drawPlaceholderLogo(3, 3, 42);
    }

    JsonObject lines = flight["lines"];
    const String flightId = valueOr(flight["flt"], valueOr(flight["cs"]));
    const String callsign = valueOr(flight["cs"], flightId);
    const String airline = valueOr(lines["airline"], valueOr(flight["air"], valueOr(flight["airCode"])));
    const String route = valueOr(lines["route"], joinNonEmpty(valueOr(flight["from"]), "-", valueOr(flight["to"])));
    const String aircraft = valueOr(lines["aircraft"], valueOr(flight["ac"], valueOr(flight["reg"])));
    const String context = valueOr(lines["context"], joinNonEmpty(valueOr(flight["ctxLabel"]), " ", valueOr(flight["ctxValue"])));
    const String layout = valueOr(flight["layout"]);
    const bool showRouteProgress = (layout == "follow_cycle" || String(mode) == "follow") && flight["followStatus"].isNull();

    if (showRouteProgress)
    {
        drawRouteProgressBar(flight, 0);
    }

    if (layout == "follow_cycle" || layout == "follow_status" || String(mode) == "follow")
    {
        const uint32_t phaseElapsed = millis() >= liveCycleStartedAt ? millis() - liveCycleStartedAt : 0;
        const uint32_t phaseMs = max<uint32_t>(1000UL, (static_cast<uint32_t>(displayCycleSeconds) * 1000UL) / 2UL);
        const uint32_t phaseIndex = phaseElapsed / phaseMs;
        const bool locationPhase = (phaseIndex % 2UL) == 1UL;
        const uint32_t phaseStart = liveCycleStartedAt + phaseIndex * phaseMs;
        JsonObject followStatus = flight["followStatus"];
        const String etaLine = valueOr(flight["arrTime"]);
        const String topLine = locationPhase && airline.length() ? airline : (flightId.length() ? flightId : callsign);
        const String secondLine = locationPhase && etaLine.length() ? "ETA:" + etaLine : (route.length() ? route : airline);
        const String thirdLine = aircraft;

        drawTickerTextBoxed(topLine, 50, 5, lineAirlineColor ? lineAirlineColor : colorData(), 75, phaseStart);
        drawTickerTextBoxed(secondLine, 50, 19, lineRouteColor ? lineRouteColor : colorData(), 75, phaseStart);
        drawTickerTextBoxed(thirdLine, 50, 33, lineAircraftColor ? lineAircraftColor : colorData(), 75, phaseStart);

        if (!followStatus.isNull())
        {
            const String statusText = valueOr(followStatus["text"]);
            const String detail = valueOr(followStatus["detail"]);
            const uint16_t statusColor = valueOr(followStatus["color"]) == "landed" ? colorSuccess() : colorHeader();
            drawTickerText(statusText, 3, 47, statusColor, 122);
            drawTickerText(detail, 3, 56, statusColor, 122);
        }
        else if (locationPhase)
        {
            drawTextFit(valueOr(flight["locationLabel"], "Flying over"), 3, 47, lineContextColor ? lineContextColor : colorData(), 122);
            drawTickerText(valueOr(flight["locationValue"], "Unknown area"), 3, 56, lineContextColor ? lineContextColor : colorData(), 122);
        }
        else
        {
            drawTickerText(flightMetricLine(flight, false), 3, 47, lineContextColor ? lineContextColor : colorData(), 122);
            drawTickerText(flightMetricLine(flight, true), 3, 56, lineContextColor ? lineContextColor : colorData(), 122);
        }
    }
    else
    {
        drawDisplayText(airline, route.length() ? route : (flightId.length() ? flightId : callsign), aircraft, context);
    }

    if (flightCount > 1)
    {
        drawCycleProgressBar(63);
    }

    drawFetchIndicator();
    presentFrame();
}

void drawCurrentLiveFlight()
{
    const char *mode = currentDisplayDoc["mode"] | "";
    JsonArray flights = currentDisplayDoc["flights"].as<JsonArray>();
    const size_t flightCount = flights.size();
    if (flightCount == 0)
    {
        if (String(mode) == "marine")
        {
            JsonObject emptyFlight;
            drawMarinePayload(emptyFlight, 0);
            liveLayoutActive = true;
            return;
        }
        liveLayoutActive = false;
        return;
    }

    if (currentLiveFlight >= flightCount) currentLiveFlight = 0;
    JsonObject flight = flights[currentLiveFlight];
    if (String(mode) == "marine")
    {
        drawMarinePayload(flight, flightCount);
    }
    else
    {
        drawFlightPayload(flight, mode, flightCount, currentLiveFlight);
    }
    liveLayoutActive = true;
}

void drawDisplayPayload(JsonDocument &doc)
{
    const char *mode = doc["mode"] | "";
    const bool suspended = doc["suspended"] | false;
    screenActive = doc["screenActive"] | screenActive;
    JsonArray flights = doc["flights"].as<JsonArray>();
    JsonArray idleScreens = doc["idleScreens"].as<JsonArray>();
    const size_t flightCount = flights.size();
    const size_t idleCount = idleScreens.size();
    lastDisplayMode = mode;
    lastDisplayOk = true;

    if (suspended)
    {
        liveFlightsPreviouslyVisible = false;
        drawBlackScreen();
        Serial.print("Display suspended. mode=");
        Serial.println(mode);
        return;
    }

    if (String(mode) == "clock")
    {
        liveFlightsPreviouslyVisible = false;
        drawClockMode();
        Serial.println("Display OK. mode=clock");
        return;
    }

    if (String(mode) == "marine")
    {
        liveFlightsPreviouslyVisible = flightCount > 0;
        if (currentLiveFlight >= flightCount) currentLiveFlight = 0;
        liveCycleStartedAt = millis();
        JsonObject flight = flightCount > 0 ? flights[currentLiveFlight].as<JsonObject>() : JsonObject();
        drawMarinePayload(flight, flightCount);
        liveLayoutActive = true;
        nextLiveCycleAt = flightCount > 0 ? millis() + static_cast<uint32_t>(displayCycleSeconds) * 1000UL : 0;
        lastLiveRenderAt = millis();
        Serial.print("Display OK. mode=marine flights=");
        Serial.println(flightCount);
        return;
    }

    if (flightCount > 0)
    {
        if (!liveFlightsPreviouslyVisible)
        {
            queuePaSound("idle-to-live");
        }
        liveFlightsPreviouslyVisible = true;
        if (currentLiveFlight >= flightCount) currentLiveFlight = 0;
        JsonObject flight = flights[currentLiveFlight];
        const char *route = flight["lines"]["route"] | "";
        const char *flightId = flight["flt"] | flight["cs"] | "";
        liveCycleStartedAt = millis();
        drawCurrentLiveFlight();
        nextLiveCycleAt = millis() + static_cast<uint32_t>(displayCycleSeconds) * 1000UL;
        lastLiveRenderAt = millis();

        Serial.print("Display OK. mode=");
        Serial.print(mode);
        Serial.print(" flights=");
        Serial.print(flightCount);
        Serial.print(" first=");
        Serial.print(flightId);
        Serial.print(" route=");
        Serial.println(route);
        return;
    }

    if (idleCount > 0)
    {
        liveFlightsPreviouslyVisible = false;
        liveLayoutActive = false;
        storeIdleScreens(idleScreens);
        drawIdleScreen(currentIdleScreen);
    }
    else
    {
        liveFlightsPreviouslyVisible = false;
        drawBlackScreen();
    }

    Serial.print("Display OK. mode=");
    Serial.print(mode);
    Serial.print(" flights=");
    Serial.print(flightCount);
    Serial.print(" idleScreens=");
    Serial.println(idleCount);
}

bool applyDisplayPayload(const String &body, int httpCode, bool httpOk)
{
    const bool hadActiveLayout = hasActiveContentLayout();
    displayFetchActive = true;
    if (hadActiveLayout)
    {
        redrawActiveContent();
    }

    if (!httpOk)
    {
        displayFetchActive = false;
        lastHttpCode = httpCode;
        lastDisplayOk = false;
        Serial.print("Display failed, HTTP ");
        Serial.println(httpCode);
        if (httpCode < 0 && hadActiveLayout)
        {
            redrawActiveContent();
            return false;
        }
        if (!hadActiveLayout)
        {
            drawBlackScreen();
        }
        return false;
    }

    currentDisplayDoc.clear();
    const DeserializationError error = deserializeJson(currentDisplayDoc, body);
    if (error)
    {
        displayFetchActive = false;
        lastDisplayOk = false;
        Serial.print("Display JSON failed: ");
        Serial.println(error.c_str());
        if (!hadActiveLayout)
        {
            drawBlackScreen();
        }
        return false;
    }

    displayFetchActive = false;
    startupSplashActive = false;
    drawDisplayPayload(currentDisplayDoc);
    return true;
}

void loadDeviceProvisioning()
{
    devicePreferences.begin("sky_device", true);
    deviceAuthToken = devicePreferences.getString("token", "");
    provisionScreenId = devicePreferences.getString("screen", "");
    provisionDeviceId = devicePreferences.getString("device", "");
    lastDeviceCommandNonce = devicePreferences.getUInt("cmd_nonce", 0);
    devicePreferences.end();
}

bool hasDeviceToken()
{
    return !deviceAuthToken.isEmpty();
}

String hardwareId()
{
    char value[32] = {};
    const uint64_t efuseMac = ESP.getEfuseMac();
    snprintf(value, sizeof(value), "esp32-%012llx", static_cast<unsigned long long>(efuseMac));
    return String(value);
}

void saveDeviceToken(const String &token, const String &screenId, const String &deviceId)
{
    if (token.isEmpty()) return;
    devicePreferences.begin("sky_device", false);
    devicePreferences.putString("token", token);
    devicePreferences.putString("screen", screenId);
    devicePreferences.putString("device", deviceId);
    devicePreferences.remove("cmd_nonce");
    devicePreferences.end();
    deviceAuthToken = token;
    provisionScreenId = screenId;
    provisionDeviceId = deviceId;
    lastDeviceCommandNonce = 0;
    realtimeConfigured = false;
}

void rememberDeviceCommandNonce(uint32_t nonce)
{
    if (nonce == 0 || nonce <= lastDeviceCommandNonce) return;
    lastDeviceCommandNonce = nonce;
    devicePreferences.begin("sky_device", false);
    devicePreferences.putUInt("cmd_nonce", nonce);
    devicePreferences.end();
}

void setOtaState(const String &status, const String &error = "")
{
    otaStatus = status;
    lastOtaError = error;
    lastDeviceStatusPostedAt = 0;
    lastDeviceStatusSentAt = 0;
}

void requestOtaUpdate()
{
    otaUpdateRequested = true;
}

int parseVersionPart(const String &version, int &index)
{
    while (index < static_cast<int>(version.length()) && !isDigit(version[index])) ++index;
    int value = 0;
    while (index < static_cast<int>(version.length()) && isDigit(version[index]))
    {
        value = value * 10 + (version[index] - '0');
        ++index;
    }
    return value;
}

bool isVersionNewer(const String &latest, const String &current)
{
    int latestIndex = 0;
    int currentIndex = 0;
    for (uint8_t part = 0; part < 4; ++part)
    {
        const int latestPart = parseVersionPart(latest, latestIndex);
        const int currentPart = parseVersionPart(current, currentIndex);
        if (latestPart > currentPart) return true;
        if (latestPart < currentPart) return false;
    }
    return latest != current && latest.length() > current.length();
}

bool isValidSha256Hex(const String &value)
{
    if (value.length() != 64) return false;
    for (size_t i = 0; i < value.length(); ++i)
    {
        const char c = value[i];
        if (!isHexadecimalDigit(c)) return false;
    }
    return true;
}

String sha256ToHex(const uint8_t *digest)
{
    static const char *hex = "0123456789abcdef";
    String value;
    value.reserve(64);
    for (uint8_t i = 0; i < 32; ++i)
    {
        value += hex[(digest[i] >> 4) & 0x0F];
        value += hex[digest[i] & 0x0F];
    }
    return value;
}

bool parseFirmwareManifest(const String &body, FirmwareManifest &manifest)
{
    JsonDocument doc;
    const DeserializationError error = deserializeJson(doc, body);
    if (error)
    {
        setOtaState("error", String("manifest_json: ") + error.c_str());
        return false;
    }

    manifest.version = valueOr(doc["version"]);
    manifest.url = absoluteUrl(valueOr(doc["url"]));
    manifest.sha256 = valueOr(doc["sha256"]);
    manifest.sha256.toLowerCase();
    manifest.size = doc["size"] | 0;

    if (manifest.version.isEmpty())
    {
        setOtaState("error", "manifest_missing_version");
        return false;
    }
    return true;
}

bool performOtaUpdate(const FirmwareManifest &manifest)
{
    bool locked = false;
    if (networkMutex)
    {
        setOtaState("waiting_for_network", "");
        if (xSemaphoreTake(networkMutex, pdMS_TO_TICKS(OtaNetworkLockWaitMs)) != pdTRUE)
        {
            setOtaState("error", "network_busy");
            return false;
        }
        locked = true;
    }

    pauseRealtimeForHttp();
    WiFiClientSecure client;
    client.setCACert(WorkerTlsRootCa);

    HTTPClient http;
    http.setTimeout(30000);
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

    if (!http.begin(client, manifest.url))
    {
        setOtaState("error", "download_begin_failed");
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }
    if (deviceAuthToken.length() > 0)
    {
        http.addHeader("X-Flight-Device-Token", deviceAuthToken);
    }

    const int httpCode = http.GET();
    const int contentLength = http.getSize();
    if (httpCode < 200 || httpCode >= 300)
    {
        setOtaState("error", String("download_http_") + httpCode);
        http.end();
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }
    if (contentLength <= 0 || static_cast<size_t>(contentLength) != manifest.size)
    {
        setOtaState("error", "download_size_mismatch");
        http.end();
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }
    if (!Update.begin(manifest.size, U_FLASH))
    {
        setOtaState("error", String("update_begin_") + Update.errorString());
        http.end();
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }

    mbedtls_sha256_context shaContext;
    mbedtls_sha256_init(&shaContext);
    mbedtls_sha256_starts_ret(&shaContext, 0);

    WiFiClient *stream = http.getStreamPtr();
    uint8_t buffer[4096];
    size_t written = 0;
    uint32_t lastDataAt = millis();
    bool failed = false;
    String failReason;

    while (written < manifest.size && millis() - otaStartedAt < OtaDownloadTimeoutMs)
    {
        const int available = stream->available();
        if (available > 0)
        {
            const size_t chunk = min(static_cast<size_t>(available), min(sizeof(buffer), manifest.size - written));
            const size_t read = stream->readBytes(buffer, chunk);
            if (read == 0) continue;
            mbedtls_sha256_update_ret(&shaContext, buffer, read);
            const size_t updateWritten = Update.write(buffer, read);
            if (updateWritten != read)
            {
                failed = true;
                failReason = String("update_write_") + Update.errorString();
                break;
            }
            written += read;
            lastDataAt = millis();
        }
        else
        {
            if (millis() - lastDataAt > 10000UL)
            {
                failed = true;
                failReason = "download_timeout";
                break;
            }
            delay(2);
        }
    }

    uint8_t digest[32] = {};
    mbedtls_sha256_finish_ret(&shaContext, digest);
    mbedtls_sha256_free(&shaContext);
    http.end();

    if (!failed && written != manifest.size)
    {
        failed = true;
        failReason = "download_incomplete";
    }
    if (!failed)
    {
        const String actualSha = sha256ToHex(digest);
        if (!actualSha.equalsIgnoreCase(manifest.sha256))
        {
            failed = true;
            failReason = "sha256_mismatch";
        }
    }
    if (failed)
    {
        Update.abort();
        setOtaState("error", failReason);
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }
    if (!Update.end(true))
    {
        setOtaState("error", String("update_end_") + Update.errorString());
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }
    if (!Update.isFinished())
    {
        setOtaState("error", "update_not_finished");
        resumeRealtimeAfterHttp();
        if (locked) xSemaphoreGive(networkMutex);
        return false;
    }

    lastOtaVersion = manifest.version;
    setOtaState("success", "");
    resumeRealtimeAfterHttp();
    if (locked) xSemaphoreGive(networkMutex);
    return true;
}

void checkFirmwareUpdate(bool forced)
{
    if (WiFi.status() != WL_CONNECTED || !hasDeviceToken()) return;
    if (wifiSetupManager.isSetupModeActive()) return;

    const uint32_t now = millis();
    if (!forced && lastOtaCheckedAt != 0 && now - lastOtaCheckedAt < OtaPollIntervalMs) return;
    lastOtaCheckedAt = now;
    otaStartedAt = now;
    setOtaState(forced ? "checking_forced" : "checking", "");

    String body;
    int httpCode = 0;
    if (!fetchText(FirmwareLatestUrl, body, httpCode, pdMS_TO_TICKS(OtaNetworkLockWaitMs)))
    {
        setOtaState("error", httpCode == -2 ? "network_busy" : String("manifest_http_") + httpCode);
        lastOtaCheckedAt = millis() - (OtaPollIntervalMs - OtaRetryIntervalMs);
        return;
    }

    FirmwareManifest manifest;
    if (!parseFirmwareManifest(body, manifest))
    {
        lastOtaCheckedAt = millis() - (OtaPollIntervalMs - OtaRetryIntervalMs);
        return;
    }

    lastOtaVersion = manifest.version;
    if (!isVersionNewer(manifest.version, SKYFRAME_FW_VERSION))
    {
        setOtaState("up_to_date", "");
        return;
    }
    if (manifest.url.isEmpty() || !manifest.url.startsWith("https://"))
    {
        setOtaState("error", "manifest_missing_https_url");
        return;
    }
    if (!isValidSha256Hex(manifest.sha256))
    {
        setOtaState("error", "manifest_invalid_sha256");
        return;
    }
    if (manifest.size == 0)
    {
        setOtaState("error", "manifest_missing_size");
        return;
    }
    if (!forced)
    {
        setOtaState("update_available", "");
        return;
    }

    setOtaState("downloading", "");
    drawBrandedStatusLines("UPDATE", manifest.version.c_str(), "Downloading", "", colorHeader());
    if (performOtaUpdate(manifest))
    {
        drawBrandedStatusLines("UPDATE OK", manifest.version.c_str(), "Restarting", "", colorSuccess());
        postDeviceStatusIfDue();
        delay(900);
        ESP.restart();
    }
}

bool startProvisioning()
{
    JsonDocument doc;
    doc["hardwareId"] = hardwareId();
    doc["firmware"] = "firmware-hub75";

    String payload;
    serializeJson(doc, payload);

    String body;
    int httpCode = 0;
    if (!postJson(ProvisionStartUrl, payload, body, httpCode))
    {
        Serial.print("Provision start failed, HTTP ");
        Serial.println(httpCode);
        drawBrandedStatusLines("PAIR FAIL", "Could not start", "Try restart", "", colorCanceled());
        return false;
    }

    JsonDocument response;
    const DeserializationError error = deserializeJson(response, body);
    if (error)
    {
        Serial.print("Provision start JSON failed: ");
        Serial.println(error.c_str());
        return false;
    }

    provisionPairingCode = valueOr(response["code"]);
    provisionScreenId = valueOr(response["screenId"]);
    provisionDeviceId = valueOr(response["deviceId"]);
    if (provisionPairingCode.isEmpty())
    {
        drawBrandedStatusLines("PAIR FAIL", "No pairing code", "Try restart", "", colorCanceled());
        return false;
    }

    Serial.print("Pairing code: ");
    Serial.println(provisionPairingCode);
    provisioningDisplayStartedAt = millis();
    drawProvisioningStatus();
    return true;
}

bool pollProvisioningStatus(bool drawStatus)
{
    JsonDocument doc;
    doc["hardwareId"] = hardwareId();
    if (!provisionPairingCode.isEmpty())
    {
        doc["code"] = provisionPairingCode;
    }

    String payload;
    serializeJson(doc, payload);

    String body;
    int httpCode = 0;
    if (!postJson(ProvisionStatusUrl, payload, body, httpCode))
    {
        if (httpCode != -2)
        {
            Serial.print("Provision status failed, HTTP ");
            Serial.println(httpCode);
        }
        return false;
    }

    JsonDocument response;
    const DeserializationError error = deserializeJson(response, body);
    if (error)
    {
        Serial.print("Provision status JSON failed: ");
        Serial.println(error.c_str());
        return false;
    }

    const String status = valueOr(response["status"]);
    if (status == "claimed")
    {
        const String token = valueOr(response["deviceToken"]);
        if (token.isEmpty())
        {
            Serial.println("Provision claimed without token");
            return false;
        }
        saveDeviceToken(token, valueOr(response["screenId"]), valueOr(response["deviceId"]));
        drawBrandedStatusLines("PAIR OK", "Screen linked", "Starting", "", colorSuccess());
        delay(900);
        return true;
    }

    if (drawStatus && !provisionPairingCode.isEmpty())
    {
        drawProvisioningStatus();
    }
    return false;
}

bool ensureProvisioned()
{
    if (hasDeviceToken()) return true;
    if (!startProvisioning()) return false;

    nextProvisionPollAt = 0;
    while (WiFi.status() == WL_CONNECTED && !hasDeviceToken())
    {
        const uint32_t now = millis();
        if (nextProvisionPollAt == 0 || now >= nextProvisionPollAt)
        {
            if (pollProvisioningStatus(true)) return true;
            nextProvisionPollAt = now + 5000UL;
        }
        updateProvisioningStatusDisplay();
        delay(100);
    }
    return hasDeviceToken();
}

bool connectWiFi()
{
    String ssid;
    String password;
    if (!wifiSetupManager.loadStoredCredentials(ssid, password))
    {
        Serial.println("No stored Wi-Fi credentials found");
        return false;
    }

    Serial.print("Connecting to saved Wi-Fi SSID: ");
    Serial.println(ssid);

    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    applyStationHostname();
    WiFi.disconnect(false, true);
    delay(100);
    WiFi.begin(ssid.c_str(), password.c_str());

    if (screenActive)
    {
        drawWifiStatus("WIFI...", ssid.c_str(), "Connecting", colorHeader());
    }
    else
    {
        drawBlackScreen();
    }

    const uint32_t startedAt = millis();
    uint8_t dotCount = 0;
    wl_status_t status = WL_IDLE_STATUS;

    while (millis() - startedAt < WifiConnectTimeoutMs)
    {
        delay(250);
        status = WiFi.status();
        if (status == WL_CONNECTED)
        {
            break;
        }

        Serial.print(".");
        if (screenActive)
        {
            if (startupSplashActive)
            {
                String dots;
                for (uint8_t i = 0; i < dotCount; ++i)
                {
                    dots += ".";
                }
                drawStartupSplashStatus("WIFI...", ssid.c_str(), dots.c_str());
            }
            else
            {
                display->fillRect(4, 50, PanelWidth - 8, 8, panelColor(0, 0, 0));
                display->setCursor(4, 50);
                display->setTextColor(colorHeader());
                for (uint8_t i = 0; i < dotCount; ++i)
                {
                    display->print(".");
                }
                presentFrame();
            }
        }
        dotCount = (dotCount + 1) % 18;
    }

    Serial.println();

    if (WiFi.status() == WL_CONNECTED)
    {
        const String ip = WiFi.localIP().toString();
        Serial.print("Wi-Fi connected. IP: ");
        Serial.println(ip);
        Serial.print("RSSI: ");
        Serial.println(WiFi.RSSI());
        initLocalTime();

        if (screenActive)
        {
            const String connectedLine = String(SKYFRAME_FW_VERSION) + " " + ip;
            drawWifiStatus("WIFI OK", ssid.c_str(), connectedLine.c_str(), colorSuccess());
        }
        else
        {
            drawBlackScreen();
        }
        wifiOfflineNotified = false;
        return true;
    }

    Serial.print("Wi-Fi failed for stored SSID ");
    Serial.print(ssid);
    Serial.print(", status=");
    Serial.println(static_cast<int>(WiFi.status()));

    if (screenActive)
    {
        drawWifiStatus("WIFI FAIL", ssid.c_str(), "Open setup", colorCanceled());
    }
    else
    {
        drawBlackScreen();
    }
    wifiOfflineNotified = true;
    return false;
}

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

void scheduleWifiReconnect(uint32_t now)
{
    nextWifiReconnectAt = now + static_cast<uint32_t>(WifiReconnectSeconds) * 1000UL;
}

void resumeNetworkPollingAfterReconnect()
{
    requestConfigFetch();
    nextConfigFetchAt = UINT32_MAX;
    nextDisplayFetchAt = 0;
}

void enterSetupMode(const char *reason)
{
    Serial.print("Entering setup mode: ");
    Serial.println(reason);
    wifiOfflineNotified = true;
    nextWifiReconnectAt = 0;
    if (!wifiSetupManager.startSetupMode())
    {
        Serial.println("Setup mode failed to start");
        if (screenActive)
        {
            drawBrandedStatusLines("SETUP FAIL", "SKYFRAME AP failed", "Restart device", "", colorCanceled());
        }
    }
}

void handleSetupManagerEvent(WifiSetupManager::Event event, const String &primary, const String &secondary)
{
    switch (event)
    {
        case WifiSetupManager::Event::SetupModeStarted:
            drawBrandedStatusLines("SETUP MODE", "CONNECT TO WIFI", primary.c_str(), "", colorHeader());
            break;
        case WifiSetupManager::Event::SetupConnectAttempt:
            drawBrandedStatusLines("CONNECTING", primary.c_str(), "Joining network", "", colorHeader());
            break;
        case WifiSetupManager::Event::SetupConnectSuccess:
            drawBrandedStatusLines("SETUP OK", primary.c_str(), "SkyFrame online", "", colorSuccess());
            break;
        case WifiSetupManager::Event::SetupConnectFailed:
            drawBrandedStatusLines("SETUP FAIL", primary.c_str(), "Wrong password?", "Try again", colorCanceled());
            break;
        case WifiSetupManager::Event::CredentialsCleared:
            drawBrandedStatusLines("SETUP MODE", "Saved Wi-Fi", "was removed", "", colorHeader());
            break;
    }
}
}

void setup()
{
    Serial.begin(115200);
    delay(1200);

    Serial.println();
    Serial.println("TheFlightWall HUB75 Wi-Fi test");
    Serial.println("Board: Waveshare ESP32-S3-RGB-Matrix target");

    HUB75_I2S_CFG::i2s_pins pins = {
        4, 5, 6,
        7, 15, 16,
        18, 8, 3, 42, 9,
        40, 2, 41};

    HUB75_I2S_CFG config(PanelWidth, PanelHeight, 1, pins);
    config.clkphase = false;
    config.driver = HUB75_I2S_CFG::SHIFTREG;
    config.double_buff = true;
    config.setPixelColorDepthBits(LogoColorDepthBits);

    display = new MatrixPanel_I2S_DMA(config);
    display->setBrightness8(Brightness);

    if (!display->begin())
    {
        Serial.println("HUB75 init failed");
        return;
    }

    display->clearScreen();
    Serial.println("HUB75 initialized");
    loadDeviceProvisioning();
    const String startupLine = provisionScreenId.isEmpty() ? "Starting up" : "Screen " + provisionScreenId;
    const String firmwareLine = String("Firmware ") + SKYFRAME_FW_VERSION;
    drawStartupSplashStatus(BrandName, startupLine.c_str(), firmwareLine.c_str());
    wifiSetupManager.begin(SetupAccessPointName, SetupButtonPin);
    wifiSetupManager.setEventCallback(handleSetupManagerEvent);
    ensureAudioReady();
    networkMutex = xSemaphoreCreateMutex();
    pendingPayloadMutex = xSemaphoreCreateMutex();
    if (networkPollTaskHandle == nullptr)
    {
        xTaskCreatePinnedToCore(
            networkPollTask,
            "network_poll",
            NetworkPollTaskStackBytes,
            nullptr,
            1,
            &networkPollTaskHandle,
            0);
    }
    if (soundPollTaskHandle == nullptr)
    {
        xTaskCreatePinnedToCore(
            soundPollTask,
            "sound_poll",
            SoundPollTaskStackBytes,
            nullptr,
            1,
            &soundPollTaskHandle,
            0);
    }

    if (wifiSetupManager.shouldForceSetupOnBoot())
    {
        Serial.println("BOOT held during startup, forcing setup mode");
        enterSetupMode("boot-button");
    }
    else if (connectWiFi() && ensureProvisioned())
    {
        resumeNetworkPollingAfterReconnect();
    }
    else
    {
        enterSetupMode("connect-failed");
    }
}

void loop()
{
    static uint32_t tick = 0;
    const uint32_t now = millis();

    wifiSetupManager.loop();

    if (wifiSetupManager.shouldReboot())
    {
        wifiSetupManager.clearRebootRequest();
        delay(250);
        ESP.restart();
    }

    if (now - lastHeartbeatAt >= 1000)
    {
        lastHeartbeatAt = now;
        Serial.print("alive ");
        Serial.print(tick++);
        Serial.print(" uptime_ms=");
        Serial.print(now);
        Serial.print(" wifi_status=");
        Serial.print(static_cast<int>(WiFi.status()));
        if (WiFi.status() == WL_CONNECTED)
        {
            Serial.print(" ssid=");
            Serial.print(WiFi.SSID());
            Serial.print(" ip=");
            Serial.print(WiFi.localIP());
            Serial.print(" rssi=");
            Serial.print(WiFi.RSSI());
        }
        else if (wifiSetupManager.isSetupModeActive())
        {
            Serial.print(" setup_ap=");
            Serial.print(wifiSetupManager.accessPointName());
            Serial.print(" setup_ip=");
            Serial.print(wifiSetupManager.accessPointIp());
        }
        Serial.print(" config_ok=");
        Serial.print(lastConfigOk ? "1" : "0");
        Serial.print(" display_ok=");
        Serial.print(lastDisplayOk ? "1" : "0");
        Serial.print(" mode=");
        Serial.print(lastDisplayMode);
        Serial.print(" clock=");
        Serial.print(localClockText());
        Serial.println();
    }

    if (wifiSetupManager.isSetupModeActive())
    {
        delay(MainLoopDelayMs);
        return;
    }

    if (WiFi.status() != WL_CONNECTED)
    {
        if (!wifiOfflineNotified)
        {
            Serial.print("Wi-Fi disconnected, status=");
            Serial.println(static_cast<int>(WiFi.status()));
            if (screenActive)
            {
                drawWifiStatus("WIFI LOST", "Saved network", "Open setup", colorCanceled());
            }
            else
            {
                drawBlackScreen();
            }
            wifiOfflineNotified = true;
        }

        if (nextWifiReconnectAt == 0 || now >= nextWifiReconnectAt)
        {
            Serial.println("Retrying saved Wi-Fi connection");
            WiFi.disconnect(true);
            delay(100);
            if (connectWiFi())
            {
                nextWifiReconnectAt = 0;
                if (ensureProvisioned())
                {
                    resumeNetworkPollingAfterReconnect();
                }
            }
            else
            {
                enterSetupMode("runtime-disconnect");
                delay(MainLoopDelayMs);
                return;
            }
        }
    }

    if (WiFi.status() == WL_CONNECTED && !hasDeviceToken())
    {
        if (provisionPairingCode.isEmpty())
        {
            startProvisioning();
            nextProvisionPollAt = millis() + 5000UL;
        }
        else if (nextProvisionPollAt == 0 || now >= nextProvisionPollAt)
        {
            pollProvisioningStatus(true);
            nextProvisionPollAt = millis() + 5000UL;
        }
        updateProvisioningStatusDisplay();
        delay(MainLoopDelayMs);
        return;
    }

    String pendingBody;
    int pendingHttpCode = 0;
    bool pendingOk = false;
    if (takePendingConfig(pendingBody, pendingHttpCode, pendingOk))
    {
        const bool wasScreenActive = screenActive;
        applyDeviceConfigPayload(pendingBody, pendingHttpCode, pendingOk);
        if (!wasScreenActive && screenActive)
        {
            if (requestDisplayFetch())
            {
                nextDisplayFetchAt = UINT32_MAX;
            }
        }
        else if (!screenActive)
        {
            nextDisplayFetchAt = 0;
            startRealtimeTaskIfNeeded();
        }
        else if (nextDisplayFetchAt == 0)
        {
            if (requestDisplayFetch())
            {
                nextDisplayFetchAt = UINT32_MAX;
            }
        }
        nextConfigFetchAt = millis() + inactiveConfigPollSeconds() * 1000UL;
    }

    if (takePendingDisplay(pendingBody, pendingHttpCode, pendingOk))
    {
        applyDisplayPayload(pendingBody, pendingHttpCode, pendingOk);
        startRealtimeTaskIfNeeded();
        nextDisplayFetchAt = screenActive
            ? millis() + static_cast<uint32_t>(displayPollSeconds) * 1000UL
            : 0;
    }

    if (WiFi.status() == WL_CONNECTED && now >= nextConfigFetchAt)
    {
        if (requestConfigFetch())
        {
            nextConfigFetchAt = UINT32_MAX;
        }
    }

    updateOffFetchIndicator();

    if (screenActive && WiFi.status() == WL_CONNECTED && nextDisplayFetchAt != 0 && now >= nextDisplayFetchAt)
    {
        if (requestDisplayFetch())
        {
            nextDisplayFetchAt = UINT32_MAX;
        }
    }

    if (idleScreenCount > 1 && !idleOutroActive && millis() >= nextIdleCycleAt)
    {
        idleOutroActive = true;
        idleOutroStartedAt = millis();
        lastIdleRenderAt = 0;
    }

    if (idleKindIntroActive && millis() - idleCycleStartedAt >= timetableTransitionMs)
    {
        idleKindIntroActive = false;
        lastIdleRenderAt = 0;
    }

    const uint16_t rowTravel = idleKindChangingToNext() ? 64 : 44;
    const uint32_t activeIdleTransitionMs = idleKindChangingToNext() ? timetableTransitionMs : idleTransitionMs(rowTravel);
    if (idleScreenCount > 1 && idleOutroActive && millis() - idleOutroStartedAt >= activeIdleTransitionMs)
    {
        const String previousKind = idleScreens[currentIdleScreen].kind;
        currentIdleScreen = (currentIdleScreen + 1) % idleScreenCount;
        idleKindIntroActive = previousKind != idleScreens[currentIdleScreen].kind;
        idleOutroActive = false;
        idleOutroStartedAt = 0;
        idleCycleStartedAt = millis();
        nextIdleCycleAt = idleCycleStartedAt + static_cast<uint32_t>(timetableCycleSeconds) * 1000UL;
        lastIdleRenderAt = 0;
    }

    if (idleLayoutActive)
    {
        const bool introScrolling = idleKindIntroActive && millis() - idleCycleStartedAt < timetableTransitionMs;
        const bool outroScrolling = idleOutroActive;
        const bool scrolling = idleScrollOffset() > 0 || introScrolling || outroScrolling;
        const uint16_t renderIntervalMs = scrolling
            ? 20
            : 250;
        if (now - lastIdleRenderAt >= renderIntervalMs)
        {
            lastIdleRenderAt = now;
            drawIdleScreen(currentIdleScreen);
        }
    }

    if (liveLayoutActive)
    {
        JsonArray flights = currentDisplayDoc["flights"].as<JsonArray>();
        const size_t flightCount = flights.size();
        if (flightCount == 0)
        {
            liveLayoutActive = false;
        }
        else if (flightCount > 1 && now >= nextLiveCycleAt)
        {
            currentLiveFlight = (currentLiveFlight + 1) % flightCount;
            liveCycleStartedAt = now;
            nextLiveCycleAt = now + static_cast<uint32_t>(displayCycleSeconds) * 1000UL;
            lastLiveRenderAt = now;
            drawCurrentLiveFlight();
        }
        else if (now - lastLiveRenderAt >= max<uint16_t>(30, min<uint16_t>(120, 1000 / max<uint16_t>(1, liveScrollPixelsPerSecond))))
        {
            lastLiveRenderAt = now;
            drawCurrentLiveFlight();
        }
    }

    if (clockLayoutActive && now - lastClockRenderAt >= ClockRenderIntervalMs)
    {
        lastClockRenderAt = now;
        drawClockMode();
    }

    delay(MainLoopDelayMs);
}
