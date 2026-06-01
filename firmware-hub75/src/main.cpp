#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP32-HUB75-MatrixPanel-I2S-DMA.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <driver/i2s.h>
#include "WiFiSecrets.h"
#include "pa_audio.h"

namespace
{
constexpr uint16_t PanelWidth = 128;
constexpr uint16_t PanelHeight = 64;
constexpr uint8_t Brightness = 8;
constexpr const char *DeviceConfigUrl = "https://flight-display-server.dan-aksel.workers.dev/public/device-config";
constexpr const char *SoundStateUrl = "https://flight-display-server.dan-aksel.workers.dev/public/sound-state";
constexpr const char *DisplayUrl = "https://flight-display-server.dan-aksel.workers.dev/public/display";
constexpr const char *ServerBaseUrl = "https://flight-display-server.dan-aksel.workers.dev";
constexpr const char *OsloTimeZone = "CET-1CEST,M3.5.0/2,M10.5.0/3";
constexpr uint8_t MaxIdleScreens = 6;
constexpr uint8_t MaxIdleRows = 4;
constexpr uint8_t LogoWidth = 42;
constexpr uint8_t LogoHeight = 42;
constexpr size_t LogoBytes = LogoWidth * LogoHeight * 2;
constexpr uint8_t LogoColorDepthBits = 8;
constexpr uint16_t TickerHoldMs = 900;
constexpr uint32_t AudioSampleRate = 16000;
constexpr uint8_t AudioVolumePercentDefault = 5;
constexpr uint8_t SoundPollSeconds = 2;
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

MatrixPanel_I2S_DMA *display = nullptr;
uint32_t nextConfigFetchAt = 0;
uint32_t nextSoundFetchAt = 0;
uint32_t nextDisplayFetchAt = 0;
uint32_t nextIdleCycleAt = 0;
uint32_t nextLiveCycleAt = 0;
uint32_t idleCycleStartedAt = 0;
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
IdleScreen idleScreens[MaxIdleScreens];
uint8_t idleScreenCount = 0;
uint8_t currentIdleScreen = 0;
uint8_t currentLiveFlight = 0;
bool lastConfigOk = false;
bool lastDisplayOk = false;
String lastDisplayMode;
int lastHttpCode = 0;
bool idleLayoutActive = false;
bool liveLayoutActive = false;
bool configFetchActive = false;
bool displayFetchActive = false;
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
int8_t audioI2cSdaPin = -1;
int8_t audioI2cSclPin = -1;
uint32_t lastSoundTestNonce = 0;
size_t audioPlaybackOffset = 0;
int16_t audioChunkBuffer[AudioChunkFrames * 2] = {};

void drawIdleScreen(uint8_t index);
void drawCurrentLiveFlight();
void fetchSoundState();
void queuePaSound(const char *reason);
bool ensureAudioReady();

uint16_t panelColor(uint8_t r, uint8_t g, uint8_t b)
{
    return display->color565(r, g, b);
}

uint16_t timetableHeaderColor = 0;
uint16_t timetableDataColor = 0;
uint16_t timetableTimeColor = 0;
uint16_t timetableNewTimeColor = 0;
uint16_t timetableCanceledColor = 0;
uint16_t lineAirlineColor = 0;
uint16_t lineRouteColor = 0;
uint16_t lineAircraftColor = 0;
uint16_t lineContextColor = 0;
uint16_t lineProgressColor = 0;
String deviceTimeZone = "Europe/Oslo";
String deviceTimeZonePosix = OsloTimeZone;
bool screenActive = true;
String brightnessMode = "day";
uint8_t effectiveBrightness = Brightness;
uint32_t screenInactiveSince = 0;
uint32_t lastOffIndicatorAt = 0;
bool lastOffIndicatorVisible = false;

uint16_t colorHeader()
{
    return timetableHeaderColor ? timetableHeaderColor : panelColor(0xF7, 0xB5, 0x00);
}

uint16_t colorData()
{
    return timetableDataColor ? timetableDataColor : panelColor(0xF4, 0xF7, 0xFF);
}

uint16_t colorCanceled()
{
    return timetableCanceledColor ? timetableCanceledColor : panelColor(0xFF, 0x3B, 0x30);
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
    if (!audioReady) return;
    audioWriteRegisterChecked(0x32, percentToEs8311Volume(audioVolumePercent));
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

void playPaSoundBlocking()
{
    audioPlaybackOffset = 0;
    uint16_t zeroWriteCount = 0;

    while (audioReady && audioPlaybackOffset < pa_audio_mono_16k_raw_len)
    {
        const size_t remainingFrames = (pa_audio_mono_16k_raw_len - audioPlaybackOffset) / 2;
        const size_t framesToWrite = min(remainingFrames, AudioChunkFrames);

        for (size_t i = 0; i < framesToWrite; ++i)
        {
            const size_t byteIndex = audioPlaybackOffset + i * 2;
            const int16_t monoSample = static_cast<int16_t>(
                static_cast<uint16_t>(pa_audio_mono_16k_raw[byteIndex]) |
                (static_cast<uint16_t>(pa_audio_mono_16k_raw[byteIndex + 1]) << 8));
            audioChunkBuffer[i * 2] = monoSample;
            audioChunkBuffer[i * 2 + 1] = monoSample;
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

uint8_t textCapacity(uint8_t maxWidth)
{
    return max<uint8_t>(1, maxWidth / 6);
}

String fitText(const String &text, uint8_t maxWidth)
{
    const String normalized = normalizeLedText(text);
    const uint8_t capacity = textCapacity(maxWidth);
    if (normalized.length() <= capacity) return normalized;
    return normalized.substring(0, capacity);
}

void drawTextFit(const String &text, int16_t x, int16_t y, uint16_t color, uint8_t maxWidth)
{
    display->setTextColor(color);
    display->setCursor(x, y);
    display->print(fitText(text, maxWidth));
}

void drawTextRight(const String &text, int16_t rightX, int16_t y, uint16_t color, uint8_t maxWidth)
{
    const String fitted = fitText(text, maxWidth);
    const int16_t x = max<int16_t>(0, rightX - static_cast<int16_t>(fitted.length() * 6));
    drawTextFit(fitted, x, y, color, maxWidth);
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

void drawTickerText(const String &text, int16_t x, int16_t y, uint16_t color, uint8_t width)
{
    const String normalized = normalizeLedText(text);
    if (!normalized.length()) return;

    const uint8_t visibleChars = textCapacity(width);
    if (normalized.length() <= visibleChars)
    {
        drawTextFit(normalized, x, y, color, width);
        return;
    }

    const uint16_t overflow = (normalized.length() - visibleChars) * 6;
    const uint8_t charOffset = overflow ? static_cast<uint8_t>(tickerOffset(overflow) / 6) : 0;
    const String window = normalized.substring(charOffset, min<size_t>(normalized.length(), charOffset + visibleChars));
    drawTextFit(window, x, y, color, width);
}

void drawProgressValue(float progress, int16_t y, uint16_t backgroundColor, uint16_t fillColor)
{
    const float clamped = min(1.0f, max(0.0f, progress));
    const uint16_t width = min<uint16_t>(122, static_cast<uint16_t>(floorf(122.0f * clamped)));
    display->drawFastHLine(3, y, 122, backgroundColor);
    for (uint16_t i = 0; i < width; ++i)
    {
        display->drawPixel(3 + i, y, fillColor);
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
    drawProgressValue(progress, y, colorRouteProgressDim(), colorSuccess());
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
    if (raw.indexOf("gotogate") >= 0 || raw.indexOf("togate") >= 0) return "To gate";
    if (raw.indexOf("boarding") >= 0) return "Boarding";
    if (raw.indexOf("closing") >= 0) return "Closing";
    if (raw.indexOf("closed") >= 0) return "Closed";
    return "";
}

String localClockText()
{
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 20)) return "--:--";

    char buffer[6] = {};
    snprintf(buffer, sizeof(buffer), "%02d%c%02d", timeinfo.tm_hour, timeinfo.tm_sec % 2 == 0 ? ':' : ' ', timeinfo.tm_min);
    return String(buffer);
}

void initLocalTime()
{
    const String tz = deviceTimeZonePosix.length() ? deviceTimeZonePosix : String(OsloTimeZone);
    configTzTime(tz.c_str(), "pool.ntp.org", "time.cloudflare.com");
}

void drawBlackScreen()
{
    idleLayoutActive = false;
    liveLayoutActive = false;
    display->fillScreen(panelColor(0, 0, 0));
    presentFrame();
}

void updateOffFetchIndicator()
{
    if (screenActive) return;

    const uint32_t now = millis();
    if (now - lastOffIndicatorAt < 120) return;
    lastOffIndicatorAt = now;

    const bool visible = configFetchActive && ((now / 300UL) % 2 == 0);
    if (visible == lastOffIndicatorVisible) return;

    display->drawPixel(PanelWidth - 1, 0, visible ? colorHeader() : panelColor(0, 0, 0));
    presentFrame();
    lastOffIndicatorVisible = visible;
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
    return idleLayoutActive || liveLayoutActive;
}

void drawFetchIndicator()
{
    if (!(configFetchActive || displayFetchActive)) return;
    if ((millis() / 300UL) % 2 != 0) return;

    display->drawPixel(PanelWidth - 1, 0, colorHeader());
}

void redrawActiveContent()
{
    if (idleLayoutActive)
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

float easeInOut(float t)
{
    return t < 0.5f ? 2.0f * t * t : 1.0f - powf(-2.0f * t + 2.0f, 2.0f) / 2.0f;
}

uint8_t nextIdleScreenIndex()
{
    return idleScreenCount ? (currentIdleScreen + 1) % idleScreenCount : 0;
}

int16_t idleScrollOffset()
{
    if (idleScreenCount <= 1) return 0;

    const IdleScreen &current = idleScreens[currentIdleScreen];
    const IdleScreen &next = idleScreens[nextIdleScreenIndex()];
    if (current.kind != next.kind) return 0;

    constexpr uint16_t RowTravel = 44;
    const uint32_t cycleMs = max<uint32_t>(2000, static_cast<uint32_t>(timetableCycleSeconds) * 1000UL);
    const uint16_t speed = max<uint16_t>(4, timetableScrollPixelsPerSecond);
    const uint32_t transitionMs = min<uint32_t>(cycleMs * 3 / 4, max<uint32_t>(400, (RowTravel * 1000UL) / speed));
    const uint32_t elapsed = millis() - idleCycleStartedAt;
    const uint32_t transitionStart = cycleMs > transitionMs ? cycleMs - transitionMs : 0;
    if (elapsed < transitionStart) return 0;

    const float progress = min(1.0f, static_cast<float>(elapsed - transitionStart) / static_cast<float>(transitionMs));
    return static_cast<int16_t>(roundf(RowTravel * easeInOut(progress)));
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

bool fetchText(const char *url, String &body, int &httpCode)
{
    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;
    http.setTimeout(12000);
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

    if (!http.begin(client, url))
    {
        httpCode = -1;
        return false;
    }

    httpCode = http.GET();
    if (httpCode > 0)
    {
        body = http.getString();
    }
    http.end();

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

void fetchSoundState()
{
    String body;
    int httpCode = 0;
    if (!fetchText(SoundStateUrl, body, httpCode))
    {
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

    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;
    http.setTimeout(12000);
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

    if (!http.begin(client, resolvedUrl))
    {
        Serial.println("Logo begin failed");
        return false;
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

bool fetchDeviceConfig()
{
    Serial.println("Fetching device config");
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
    else
    {
        drawStatusLines("CONFIG...", "GET device-config", "Waiting", "", colorHeader());
    }

    String body;
    int httpCode = 0;
    if (!fetchText(DeviceConfigUrl, body, httpCode))
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
            drawError("CONFIG FAIL", "HTTP " + String(httpCode));
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
            drawError("CONFIG JSON", error.c_str());
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
    configRefreshSeconds = constrain(device["configRefreshSeconds"] | 300, 60, 3600);
    displayCycleSeconds = constrain(device["displayCycleSeconds"] | 5, 2, 30);
    timetableCycleSeconds = constrain(device["timetableCycleSeconds"] | 10, 3, 120);
    liveScrollPixelsPerSecond = constrain(device["scrollPixelsPerSecond"] | 9, 2, 30);
    timetableScrollPixelsPerSecond = constrain(device["timetableScrollPixelsPerSecond"] | 18, 4, 40);
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

    JsonObject lineColors = device["lineColors"];
    lineAirlineColor = parseHexColorOr(valueOr(lineColors["airline"]), defaultDataColor);
    lineRouteColor = parseHexColorOr(valueOr(lineColors["route"]), defaultDataColor);
    lineAircraftColor = parseHexColorOr(valueOr(lineColors["aircraft"]), defaultDataColor);
    lineContextColor = parseHexColorOr(valueOr(lineColors["context"]), defaultDataColor);
    lineProgressColor = parseHexColorOr(valueOr(lineColors["progress"]), defaultHeaderColor);

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
    const String line1 = String("Airport ") + airport;
    const String line2 = String(screenActive ? "Screen ON" : "Screen OFF") + " / " + String("Mode ") + brightnessMode;
    const String line3 = String("Cfg ") + configRefreshSeconds + "s Fly " + displayPollSeconds + "s";
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
        drawStatusLines("CONFIG OK", line1.c_str(), line2.c_str(), line3.c_str(), colorSuccess());
        delay(1200);
    }
    return true;
}

void drawIdleRow(const IdleScreen &screen, const IdleRow &row, int16_t y)
{
    if (y < 15 || y > 63) return;

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
        drawTextFit(line1, 3, y, white, 122);
        if (line2.length()) drawTextFit(line2, 3, y + 11, white, 122);
        return;
    }

    const uint16_t timeDefault = timetableTimeColor ? timetableTimeColor : white;
    const uint16_t newTimeColor = timetableNewTimeColor ? timetableNewTimeColor : yellow;
    const uint16_t red = colorCanceled();
    const bool blinkOn = (millis() / 1200) % 2 == 0;
    const bool canceled = row.status == "canceled";
    const bool newTime = row.status == "newTime";
    const bool departures = screen.kind == "departures";
    const bool arrivals = screen.kind == "arrivals";
    const String gateStatus = departures ? normalizeGateStatusForDisplay(row.gateMessage) : "";
    const String arrivalStatus = arrivals && row.status == "done" ? "Landed" : "";
    const String alternateTime = gateStatus.length() ? gateStatus : arrivalStatus;
    const String airportText = departures && row.gate.length() && !blinkOn ? row.gate : row.airport;
    const String timeText = alternateTime.length() && !blinkOn ? alternateTime : row.time;
    const uint16_t rowColor = canceled ? red : white;
    const uint16_t timeColor = canceled ? red : (alternateTime.length() && !blinkOn ? white : (newTime ? newTimeColor : timeDefault));

    drawTextFit(row.flightId, 3, y, rowColor, 43);
    drawTextFit(airportText, 51, y, rowColor, 24);
    drawTextRight(timeText, 125, y, timeColor, 60);
    if (canceled)
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
    if (idleScreenCount == 0 || index >= idleScreenCount)
    {
        drawStatusLines("IDLE", "No rows", "", "", colorHeader());
        return;
    }

    const IdleScreen &screen = idleScreens[index];
    const uint16_t yellow = colorHeader();
    const uint16_t white = colorData();
    const uint16_t clockColor = timetableTimeColor ? timetableTimeColor : white;
    const int16_t offset = idleScrollOffset();
    const uint8_t nextIndex = nextIdleScreenIndex();
    const bool showNext = idleScreenCount > 1 && screen.kind == idleScreens[nextIndex].kind && offset > 0;

    display->fillScreen(panelColor(0, 0, 0));
    display->setTextSize(1);
    display->setTextWrap(false);
    drawTextFit(screen.title, 3, 3, yellow, 86);
    drawTextRight(localClockText(), 125, 3, clockColor, 32);
    display->drawFastHLine(3, 14, 122, yellow);
    drawIdleRows(index, 20 - offset);
    if (showNext) drawIdleRows(nextIndex, 64 - offset);
    drawFetchIndicator();

    idleLayoutActive = true;
    presentFrame();
}

void storeIdleScreens(JsonArray screens)
{
    idleScreenCount = min(static_cast<size_t>(MaxIdleScreens), screens.size());
    currentIdleScreen = 0;

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

void drawFlightPayload(JsonObject flight, const char *mode, size_t flightCount, size_t flightIndex)
{
    idleLayoutActive = false;
    liveLayoutActive = false;
    display->fillScreen(panelColor(0, 0, 0));
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
        const bool locationPhase = (millis() % 15000UL) >= 10000UL;
        JsonObject followStatus = flight["followStatus"];
        const String etaLine = valueOr(flight["arrTime"]);
        const String topLine = locationPhase && etaLine.length() ? "ETA:" + etaLine : (flightId.length() ? flightId : callsign);
        const String secondLine = route.length() ? route : airline;
        const String thirdLine = aircraft;

        drawTextFit(topLine, 50, 5, lineAirlineColor ? lineAirlineColor : colorData(), 75);
        drawTextFit(secondLine, 50, 19, lineRouteColor ? lineRouteColor : colorData(), 75);
        drawTextFit(thirdLine, 50, 33, lineAircraftColor ? lineAircraftColor : colorData(), 75);

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
    JsonArray flights = currentDisplayDoc["flights"].as<JsonArray>();
    const size_t flightCount = flights.size();
    if (flightCount == 0)
    {
        liveLayoutActive = false;
        return;
    }

    if (currentLiveFlight >= flightCount) currentLiveFlight = 0;
    JsonObject flight = flights[currentLiveFlight];
    const char *mode = currentDisplayDoc["mode"] | "";
    drawFlightPayload(flight, mode, flightCount, currentLiveFlight);
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
        drawCurrentLiveFlight();
        liveCycleStartedAt = millis();
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
        drawStatusLines("DISPLAY OK", mode, "No flights/idle", "", colorHeader());
    }

    Serial.print("Display OK. mode=");
    Serial.print(mode);
    Serial.print(" flights=");
    Serial.print(flightCount);
    Serial.print(" idleScreens=");
    Serial.println(idleCount);
}

bool fetchDisplayPayload()
{
    Serial.println("Fetching display payload");
    const bool hadActiveLayout = hasActiveContentLayout();
    displayFetchActive = true;
    if (hadActiveLayout)
    {
        redrawActiveContent();
    }
    else
    {
        drawStatusLines("DISPLAY...", "GET display", "Waiting", "", colorHeader());
    }

    String body;
    int httpCode = 0;
    if (!fetchText(DisplayUrl, body, httpCode))
    {
        displayFetchActive = false;
        lastHttpCode = httpCode;
        lastDisplayOk = false;
        Serial.print("Display failed, HTTP ");
        Serial.println(httpCode);
        drawError("DISPLAY FAIL", "HTTP " + String(httpCode));
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
        drawError("DISPLAY JSON", error.c_str());
        return false;
    }

    displayFetchActive = false;
    drawDisplayPayload(currentDisplayDoc);
    return true;
}

bool connectWiFi()
{
    Serial.print("Connecting to Wi-Fi SSID: ");
    Serial.println(WifiSsid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WifiSsid, WifiPassword);

    drawWifiStatus("WIFI...", WifiSsid, "Connecting", colorHeader());

    constexpr uint32_t TimeoutMs = 20000;
    const uint32_t startedAt = millis();
    uint8_t dotCount = 0;

    while (WiFi.status() != WL_CONNECTED && millis() - startedAt < TimeoutMs)
    {
        delay(500);
        Serial.print(".");

        display->fillRect(4, 50, PanelWidth - 8, 8, panelColor(0, 0, 0));
        display->setCursor(4, 50);
        display->setTextColor(colorHeader());
        for (uint8_t i = 0; i < dotCount; ++i)
        {
            display->print(".");
        }
        presentFrame();
        dotCount = (dotCount + 1) % 18;
    }

    Serial.println();

    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.print("Wi-Fi failed, status=");
        Serial.println(static_cast<int>(WiFi.status()));
        drawWifiStatus("WIFI FAIL", WifiSsid, "Check serial", colorCanceled());
        return false;
    }

    const String ip = WiFi.localIP().toString();
    Serial.print("Wi-Fi connected. IP: ");
    Serial.println(ip);
    Serial.print("RSSI: ");
    Serial.println(WiFi.RSSI());
    initLocalTime();

    drawWifiStatus("WIFI OK", WifiSsid, ip.c_str(), colorSuccess());
    return true;
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
    ensureAudioReady();
    if (connectWiFi())
    {
        fetchDeviceConfig();
        if (screenActive)
        {
            fetchDisplayPayload();
            nextDisplayFetchAt = millis() + static_cast<uint32_t>(displayPollSeconds) * 1000UL;
        }
        else
        {
            drawBlackScreen();
            nextDisplayFetchAt = 0;
        }
        nextConfigFetchAt = millis() + inactiveConfigPollSeconds() * 1000UL;
        nextSoundFetchAt = millis() + static_cast<uint32_t>(SoundPollSeconds) * 1000UL;
    }
}

void loop()
{
    static uint32_t tick = 0;
    const uint32_t now = millis();

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
            Serial.print(" ip=");
            Serial.print(WiFi.localIP());
            Serial.print(" rssi=");
            Serial.print(WiFi.RSSI());
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

    if (WiFi.status() == WL_CONNECTED && now >= nextConfigFetchAt)
    {
        const bool wasScreenActive = screenActive;
        fetchDeviceConfig();
        if (!wasScreenActive && screenActive)
        {
            fetchDisplayPayload();
            nextDisplayFetchAt = millis() + static_cast<uint32_t>(displayPollSeconds) * 1000UL;
        }
        else if (!screenActive)
        {
            nextDisplayFetchAt = 0;
        }
        nextConfigFetchAt = millis() + inactiveConfigPollSeconds() * 1000UL;
    }

    if (WiFi.status() == WL_CONNECTED && now >= nextSoundFetchAt)
    {
        fetchSoundState();
        nextSoundFetchAt = millis() + static_cast<uint32_t>(SoundPollSeconds) * 1000UL;
    }

    updateOffFetchIndicator();

    if (screenActive && WiFi.status() == WL_CONNECTED && nextDisplayFetchAt != 0 && now >= nextDisplayFetchAt)
    {
        fetchDisplayPayload();
        nextDisplayFetchAt = millis() + static_cast<uint32_t>(displayPollSeconds) * 1000UL;
    }

    if (idleScreenCount > 1 && millis() >= nextIdleCycleAt)
    {
        currentIdleScreen = (currentIdleScreen + 1) % idleScreenCount;
        idleCycleStartedAt = millis();
        nextIdleCycleAt = idleCycleStartedAt + static_cast<uint32_t>(timetableCycleSeconds) * 1000UL;
        lastIdleRenderAt = 0;
    }

    if (idleLayoutActive)
    {
        const bool scrolling = idleScrollOffset() > 0;
        const uint16_t renderIntervalMs = scrolling ? 80 : 500;
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
        else if (now - lastLiveRenderAt >= 1000)
        {
            lastLiveRenderAt = now;
            drawCurrentLiveFlight();
        }
    }

    delay(100);
}
