import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index";

const CONFIG_KEY = "config:v1";
const SCREEN_STATE_KEY = "screen-state:v1";
const HOMEY_TOKEN_KEY = "homey-token:v1";
const ACCOUNT_FR24_SECRET_KEY = "secret:fr24-api-key:v1";
const TEST_USER_EMAIL = "test@example.com";

class MemoryKv {
  private values = new Map<string, string>();

  constructor(initial: Record<string, unknown> = {}) {
    for (const [key, value] of Object.entries(initial)) {
      this.values.set(key, typeof value === "string" ? value : JSON.stringify(value));
    }
  }

  async get(key: string, type?: "json" | "text"): Promise<unknown> {
    const value = this.values.get(key);
    if (value === undefined) return null;
    return type === "json" ? JSON.parse(value) : value;
  }

  async put(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }

  async list(options?: { prefix?: string; cursor?: string }): Promise<{ keys: Array<{ name: string }>; list_complete: boolean; cursor?: string }> {
    const prefix = options?.prefix || "";
    return {
      keys: Array.from(this.values.keys()).filter((name) => name.startsWith(prefix)).map((name) => ({ name })),
      list_complete: true
    };
  }
}

function baseConfig(): Record<string, unknown> {
  return {
    lat: 59.9139,
    lon: 10.7522,
    radiusKm: 10,
    homeAirportIata: "OSL",
    label: "Home",
    device: {
      enabled: true,
      displayMode: "flight",
      airspaceMonitoringEnabled: true,
      brightness: 80,
      clockColor: "#ff2a23",
      nightMode: {
        enabled: true,
        start: "23:00",
        end: "07:00",
        brightness: 0
      }
    }
  };
}

function makeEnv(overrides: Partial<Env> = {}, kvValues: Record<string, unknown> = {}): Env {
  return {
    FLIGHT_DISPLAY_KV: new MemoryKv(kvValues) as unknown as KVNamespace,
    ASSETS: {
      fetch: vi.fn(async () => new Response(null, { status: 404 }))
    } as unknown as Fetcher,
    HOME_AIRPORT_IATA: "OSL",
    DEFAULT_LAT: "59.9139",
    DEFAULT_LON: "10.7522",
    DEFAULT_RADIUS_KM: "10",
    CACHE_TTL_SECONDS: "60",
    DISPLAY_LIMIT: "8",
    ...overrides
  };
}

async function request(path: string, env: Env, init: RequestInit = {}): Promise<Response> {
  return worker.fetch(new Request(`https://example.test${path}`, init), env);
}

async function userRequest(path: string, env: Env, init: RequestInit = {}): Promise<Response> {
  return request(path, env, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "X-SkyFrame-User-Email": TEST_USER_EMAIL
    }
  });
}

function accountFr24KeyValues(kvValues: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    [`account:${TEST_USER_EMAIL}:${ACCOUNT_FR24_SECRET_KEY}`]: "test-fr24-key",
    ...kvValues
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auth gates", () => {
  it("does not require ADMIN_API_TOKEN for regular admin API routes", async () => {
    const env = makeEnv({ ADMIN_API_TOKEN: "admin-secret" });

    const response = await request("/api/config", env);
    expect(response.status).toBe(200);
  });

  it("requires ADMIN_API_TOKEN for automation API routes when configured", async () => {
    const env = makeEnv({ ADMIN_API_TOKEN: "admin-secret" });

    const unauthorized = await request("/api/screen-state/activate", env, { method: "POST" });
    expect(unauthorized.status).toBe(401);

    const authorized = await request("/api/screen-state/activate", env, {
      method: "POST",
      headers: { "X-Flight-Admin-Token": "admin-secret" }
    });
    expect(authorized.status).toBe(200);
  });

  it("requires ADMIN_API_TOKEN for display mode automation routes when configured", async () => {
    const env = makeEnv({ ADMIN_API_TOKEN: "admin-secret" }, {
      [CONFIG_KEY]: baseConfig()
    });

    const unauthorized = await request("/api/display-mode/clock", env, { method: "POST" });
    expect(unauthorized.status).toBe(401);

    const authorized = await request("/api/display-mode/clock", env, {
      method: "POST",
      headers: { "X-Flight-Admin-Token": "admin-secret" }
    });
    expect(authorized.status).toBe(200);
  });

  it("supports screen-specific Homey aliases", async () => {
    const env = makeEnv({ DEVICE_API_TOKEN: "device-secret" }, {
      "device:v1:dev_test": {
        deviceId: "dev_test",
        screenId: "93975",
        tokenHash: "a".repeat(64),
        pairedAt: "2026-06-07T08:30:00.000Z",
        ownerEmail: "owner@example.com"
      },
      [`account:owner@example.com:${HOMEY_TOKEN_KEY}`]: {
        token: "homey-secret",
        createdAt: "2026-06-07T09:00:00.000Z",
        rotatedAt: null
      }
    });

    const missingToken = await request("/api/screens/93975/brightness-mode/night", env, { method: "POST" });
    expect(missingToken.status).toBe(401);

    const getRequest = await request("/api/screens/93975/brightness-mode/night", env, {
      headers: { "X-SkyFrame-Homey-Token": "homey-secret" }
    });
    expect(getRequest.status).toBe(404);

    const night = await request("/api/screens/93975/brightness-mode/night", env, {
      method: "POST",
      headers: { "X-SkyFrame-Homey-Token": "homey-secret" }
    });
    const nightJson = await night.json() as Record<string, unknown>;
    expect(night.status).toBe(200);
    expect(nightJson.brightnessMode).toBe("night");

    const dayWithCompatHeader = await request("/api/screens/93975/brightness-mode/day", env, {
      method: "POST",
      headers: { "X-Homey-Token": "homey-secret" }
    });
    const dayWithCompatHeaderJson = await dayWithCompatHeader.json() as Record<string, unknown>;
    expect(dayWithCompatHeader.status).toBe(200);
    expect(dayWithCompatHeaderJson.brightnessMode).toBe("day");

    const off = await request("/api/screens/93975/screen-state/deactivate", env, {
      method: "POST",
      headers: { Authorization: "Bearer homey-secret" }
    });
    const offJson = await off.json() as Record<string, unknown>;
    expect(off.status).toBe(200);
    expect(offJson.active).toBe(false);

    const publicOn = await request("/public/homey/screens/93975/screen-state/activate", env, {
      method: "POST",
      headers: { "X-SkyFrame-Homey-Token": "homey-secret" }
    });
    const publicOnJson = await publicOn.json() as Record<string, unknown>;
    expect(publicOn.status).toBe(200);
    expect(publicOnJson.active).toBe(true);

    const publicNightWithBearer = await request("/public/homey/screens/93975/brightness-mode/night", env, {
      method: "POST",
      headers: { Authorization: "Bearer homey-secret" }
    });
    const publicNightWithBearerJson = await publicNightWithBearer.json() as Record<string, unknown>;
    expect(publicNightWithBearer.status).toBe(200);
    expect(publicNightWithBearerJson.brightnessMode).toBe("night");

    const publicDayWithCompatHeader = await request("/public/homey/screens/93975/brightness-mode/day", env, {
      method: "POST",
      headers: { "X-Homey-Token": "homey-secret" }
    });
    const publicDayWithCompatHeaderJson = await publicDayWithCompatHeader.json() as Record<string, unknown>;
    expect(publicDayWithCompatHeader.status).toBe(200);
    expect(publicDayWithCompatHeaderJson.brightnessMode).toBe("day");

    const apiClock = await request("/api/screens/93975/display-mode/clock", env, {
      method: "POST",
      headers: { "X-SkyFrame-Homey-Token": "homey-secret" }
    });
    const apiClockJson = await apiClock.json() as Record<string, unknown>;
    expect(apiClock.status).toBe(200);
    expect(apiClockJson.displayMode).toBe("clock");

    const publicAirportBoard = await request("/public/homey/screens/93975/display-mode/airport-board", env, {
      method: "POST",
      headers: { Authorization: "Bearer homey-secret" }
    });
    const publicAirportBoardJson = await publicAirportBoard.json() as Record<string, unknown>;
    expect(publicAirportBoard.status).toBe(200);
    expect(publicAirportBoardJson.displayMode).toBe("airport_board");
  });

  it("queues ota_update for realtime-state", async () => {
    const env = makeEnv({}, {
      "device:v1:dev_test": {
        deviceId: "dev_test",
        screenId: "93975",
        tokenHash: "a".repeat(64),
        pairedAt: "2026-06-07T08:30:00.000Z",
        ownerEmail: "owner@example.com"
      }
    });

    const command = await request("/api/device-command?screenId=93975", env, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SkyFrame-User-Email": "owner@example.com"
      },
      body: JSON.stringify({ command: "ota_update" })
    });
    expect(command.status).toBe(200);

    const realtime = await request("/api/realtime-state?screenId=93975", env);
    const realtimeJson = await realtime.json() as { deviceCommand?: Record<string, unknown> };
    expect(realtime.status).toBe(200);
    expect(realtimeJson.deviceCommand).toMatchObject({ command: "ota_update" });
  });

  it("requires DEVICE_API_TOKEN for /public routes when configured", async () => {
    const env = makeEnv({ DEVICE_API_TOKEN: "device-secret" });

    const unauthorized = await request("/public/device-config", env);
    expect(unauthorized.status).toBe(401);

    const authorized = await request("/public/device-config", env, {
      headers: { "X-Flight-Device-Token": "device-secret" }
    });
    expect(authorized.status).toBe(200);

    const publicFirmware = await request("/public/firmware/latest.json", env);
    expect(publicFirmware.status).not.toBe(401);
  });

  it("preserves firmware release notes through the API manifest route", async () => {
    const env = makeEnv({
      ASSETS: {
        fetch: vi.fn(async () => new Response(JSON.stringify({
          version: "V1.3",
          url: "https://skyframe.test/public/firmware/skyframe-v1.3.bin",
          sha256: "a".repeat(64),
          size: 1109696,
          releaseNotes: [
            "Splits followed-flight info 50/50 within the selected flight display duration."
          ]
        }), { headers: { "Content-Type": "application/json" } }))
      } as unknown as Fetcher
    });

    const response = await request("/api/firmware/latest", env);
    const json = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(json.releaseNotes).toEqual([
      "Splits followed-flight info 50/50 within the selected flight display duration."
    ]);
  });

  it("only exposes newer public firmware manifest to devices after ota_update command", async () => {
    const env = makeEnv({
      ASSETS: {
        fetch: vi.fn(async () => new Response(JSON.stringify({
          version: "V1.4",
          url: "https://skyframe.test/public/firmware/skyframe-v1.4.bin",
          sha256: "b".repeat(64),
          size: 1109792,
          releaseNotes: [
            "Makes OTA firmware installation manual from the control panel."
          ]
        }), { headers: { "Content-Type": "application/json" } }))
      } as unknown as Fetcher
    }, {
      "screen:93975:device-status:v1": {
        firmwareVersion: "V1.2",
        ota: { status: "up_to_date" }
      }
    });

    const automatic = await request("/public/firmware/latest.json?screenId=93975", env);
    const automaticJson = await automatic.json() as Record<string, unknown>;
    expect(automatic.status).toBe(200);
    expect(automaticJson.version).toBe("V1.2");

    const command = await request("/api/device-command?screenId=93975", env, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SkyFrame-User-Email": TEST_USER_EMAIL
      },
      body: JSON.stringify({ command: "ota_update" })
    });
    expect(command.status).toBe(200);

    const manual = await request("/public/firmware/latest.json?screenId=93975", env);
    const manualJson = await manual.json() as Record<string, unknown>;
    expect(manual.status).toBe(200);
    expect(manualJson.version).toBe("V1.4");
  });

  it("uses the admin global config refresh interval for device config", async () => {
    const env = makeEnv({}, {
      [CONFIG_KEY]: {
        ...baseConfig(),
        device: {
          ...(baseConfig().device as Record<string, unknown>),
          configRefreshSeconds: 60
        }
      },
      "admin:ui:v1": {
        showEmulator: false,
        configRefreshSeconds: 420
      }
    });

    const response = await request("/public/device-config", env);
    const json = await response.json() as { device?: { configRefreshSeconds?: number } };

    expect(response.status).toBe(200);
    expect(json.device?.configRefreshSeconds).toBe(420);
  });
});

describe("device provisioning", () => {
  it("opens setup for signed-in accounts without paired screens", async () => {
    const env = makeEnv();

    const response = await userRequest("/screen-setup", env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Pair your screen");
  });

  it("redirects signed-in accounts with paired screens from setup to the control panel", async () => {
    const env = makeEnv({}, {
      "device:v1:dev_test": {
        deviceId: "dev_test",
        screenId: "12988",
        tokenHash: "a".repeat(64),
        pairedAt: "2026-06-07T08:30:00.000Z",
        ownerEmail: TEST_USER_EMAIL
      }
    });

    const response = await userRequest("/screen-setup", env, { redirect: "manual" });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://example.test/?screenId=12988");
  });

  it("pairs a generic device and lets its token read scoped config", async () => {
    const env = makeEnv({}, {
      [CONFIG_KEY]: baseConfig()
    });

    const start = await request("/public/provision/start", env, {
      method: "POST",
      body: JSON.stringify({ hardwareId: "esp32-test-001" })
    });
    const started = await start.json() as Record<string, string>;

    expect(start.status).toBe(200);
    expect(started.code).toMatch(/^SKY-\d{6}$/);

    const claim = await request("/api/provision/claim", env, {
      method: "POST",
      headers: { "CF-Access-Authenticated-User-Email": "owner@example.com" },
      body: JSON.stringify({ code: started.code, label: "Kitchen" })
    });
    const claimed = await claim.json() as Record<string, string>;

    expect(claim.status).toBe(200);
    expect(claimed.deviceToken).toBeTruthy();
    expect(claimed.screenId).toBeTruthy();

    const scopedConfig = await request("/public/device-config", env, {
      headers: { "X-Flight-Device-Token": claimed.deviceToken }
    });
    const json = await scopedConfig.json() as Record<string, unknown>;

    expect(scopedConfig.status).toBe(200);
    expect(json).toMatchObject({
      homeAirportIata: "OSL"
    });
  });
});

describe("display polling contract", () => {
  it("suspends display and avoids live source calls only when screen is inactive", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const env = makeEnv({}, {
      [CONFIG_KEY]: baseConfig(),
      [SCREEN_STATE_KEY]: {
        active: false,
        brightnessMode: "night",
        lastActivatedAt: null,
        lastDeactivatedAt: "2026-06-02T10:00:00.000Z",
        lastBrightnessModeChangedAt: null,
        updatedAt: "2026-06-02T10:00:00.000Z",
        source: "test"
      }
    });

    const response = await request("/public/display", env);
    const json = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(json.mode).toBe("remote_disabled");
    expect(json.suspended).toBe(true);
    expect(json.screenActive).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns clock payload and avoids live source calls when display mode is clock", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const config = baseConfig();
    config.device = {
      ...(config.device as Record<string, unknown>),
      displayMode: "clock",
      clockColor: "#ff4400"
    };
    const env = makeEnv({}, {
      [CONFIG_KEY]: config
    });

    const response = await request("/public/display", env);
    const json = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(json.mode).toBe("clock");
    expect(json.flights).toEqual([]);
    expect(json.clock).toMatchObject({
      style: "gorgy",
      color: "#ff4400",
      width: 63,
      height: 63,
      centered: true
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("updates display mode through the automation endpoint", async () => {
    const env = makeEnv({}, {
      [CONFIG_KEY]: baseConfig()
    });

    const response = await request("/api/display-mode/clock", env, { method: "POST" });
    const json = await response.json() as Record<string, unknown>;
    const stored = await (env.FLIGHT_DISPLAY_KV as unknown as MemoryKv).get(CONFIG_KEY, "json") as Record<string, unknown>;
    const device = stored.device as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(json.displayMode).toBe("clock");
    expect(device.displayMode).toBe("clock");
  });

  it("uses FR24 full only to populate follow static cache, then refreshes follow with light", async () => {
    const fetchedUrls: string[] = [];
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      fetchedUrls.push(url);

      if (url.includes("/live/flight-positions/full")) {
        return new Response(JSON.stringify({
          data: [
            {
              id: "fr24-sas123",
              callsign: "SAS123",
              flight: "SK123",
              lat: 59.92,
              lon: 10.76,
              alt: 32000,
              gspeed: 430,
              track: 180,
              painted_as: "SAS",
              type: "A320",
              reg: "LN-TST",
              orig_iata: "OSL",
              dest_iata: "LHR",
              scheduled_arrival: "2026-06-02T12:00:00Z"
            }
          ]
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (url.includes("/live/flight-positions/light")) {
        return new Response(JSON.stringify({
          data: [
            {
              id: "fr24-sas123",
              callsign: "SAS123",
              flight: "SK123",
              lat: 59.93,
              lon: 10.77,
              alt: 33000,
              gspeed: 440,
              track: 181
            }
          ]
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (url.includes("/api/v1/flights/")) {
        return new Response(JSON.stringify({ flightLegs: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (url.includes("/static/airports/LHR/light")) {
        return new Response(JSON.stringify({ data: { city: "London", timezone: "Europe/London" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (url.includes("nominatim.openstreetmap.org/reverse")) {
        return new Response(JSON.stringify({ address: { city: "Oslo", country: "Norway" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    const config = baseConfig();
    config.follow = {
      enabled: true,
      flights: ["SK123"]
    };
    const env = makeEnv({
      FR24_LIVE_ENDPOINT: "/live/flight-positions/full",
      FR24_FOLLOW_ENDPOINT: "/live/flight-positions/light"
    }, accountFr24KeyValues({
      [CONFIG_KEY]: config
    }));

    const firstResponse = await userRequest("/api/display", env);
    expect(firstResponse.status).toBe(200);
    expect(fetchedUrls.filter((url) => url.includes("/live/flight-positions/full"))).toHaveLength(1);
    expect(fetchedUrls.filter((url) => url.includes("/live/flight-positions/light"))).toHaveLength(1);

    await (env.FLIGHT_DISPLAY_KV as unknown as MemoryKv).delete("follow:fr24:v4:SK123");
    fetchedUrls.length = 0;

    const secondResponse = await userRequest("/api/display", env);
    const secondJson = await secondResponse.json() as { flights?: Array<Record<string, unknown>> };

    expect(secondResponse.status).toBe(200);
    expect(fetchedUrls.filter((url) => url.includes("/live/flight-positions/full"))).toHaveLength(0);
    expect(fetchedUrls.filter((url) => url.includes("/live/flight-positions/light"))).toHaveLength(1);
    expect(secondJson.flights?.[0]).toMatchObject({
      ac: "A320",
      reg: "LN-TST",
      from: "OSL",
      to: "LHR",
      arrTime: "14:00",
      alt: 33000,
      spd: 440
    });
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("filters general aviation from automatic FR24 airspace monitoring by default", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = input instanceof Request ? input.url : String(input);

      if (url.includes("/live/flight-positions/full")) {
        return new Response(JSON.stringify({
          data: [
            {
              id: "fr24-passenger",
              callsign: "SAS123",
              flight: "SK123",
              category: "P",
              lat: 59.92,
              lon: 10.76,
              alt: 32000,
              gspeed: 430,
              track: 180,
              painted_as: "SAS",
              orig_iata: "OSL",
              dest_iata: "LHR",
              scheduled_arrival: "2026-06-02T12:00:00Z"
            },
            {
              id: "fr24-general",
              callsign: "LNABC",
              flight: "LNABC",
              category: "T",
              lat: 59.93,
              lon: 10.77,
              alt: 2500,
              gspeed: 120,
              track: 90
            }
          ]
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (url.includes("nominatim.openstreetmap.org/reverse")) {
        return new Response(JSON.stringify({ address: { city: "Oslo", country: "Norway" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (url.includes("/static/airports/LHR/light")) {
        return new Response(JSON.stringify({ data: { city: "London", timezone: "Europe/London" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ flightLegs: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    const env = makeEnv({}, accountFr24KeyValues({
      [CONFIG_KEY]: baseConfig()
    }));

    const response = await userRequest("/api/display", env);
    const json = await response.json() as { flights?: Array<Record<string, unknown>> };

    expect(response.status).toBe(200);
    expect(json.flights).toEqual([
      expect.objectContaining({
        cs: "SAS123",
        flt: "SK123",
        layout: "follow_cycle",
        arrTime: "14:00"
      })
    ]);
  });

  it("allows general aviation when the category is enabled in config", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = input instanceof Request ? input.url : String(input);

      if (url.includes("/live/flight-positions/full")) {
        return new Response(JSON.stringify({
          data: [
            {
              id: "fr24-general",
              callsign: "LNABC",
              flight: "LNABC",
              category: "GENERAL_AVIATION",
              lat: 59.93,
              lon: 10.77,
              alt: 2500,
              gspeed: 120,
              track: 90
            }
          ]
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (url.includes("nominatim.openstreetmap.org/reverse")) {
        return new Response(JSON.stringify({ address: { city: "Oslo", country: "Norway" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ flightLegs: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    const config = baseConfig();
    config.device = {
      ...(config.device as Record<string, unknown>),
      allowedAircraftCategories: ["P", "T"]
    };
    const env = makeEnv({}, accountFr24KeyValues({
      [CONFIG_KEY]: config
    }));

    const response = await userRequest("/api/display", env);
    const json = await response.json() as { flights?: Array<Record<string, unknown>> };

    expect(response.status).toBe(200);
    expect(json.flights).toEqual([
      expect.objectContaining({
        cs: "LNABC",
        flt: "LNABC"
      })
    ]);
  });

});
