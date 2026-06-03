import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index";

const CONFIG_KEY = "config:v1";
const SCREEN_STATE_KEY = "screen-state:v1";

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
    FR24_API_KEY: "test-fr24-key",
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

  it("requires DEVICE_API_TOKEN for /public routes when configured", async () => {
    const env = makeEnv({ DEVICE_API_TOKEN: "device-secret" });

    const unauthorized = await request("/public/device-config", env);
    expect(unauthorized.status).toBe(401);

    const authorized = await request("/public/device-config", env, {
      headers: { "X-Flight-Device-Token": "device-secret" }
    });
    expect(authorized.status).toBe(200);
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
    }, {
      [CONFIG_KEY]: config
    });

    const firstResponse = await request("/api/display", env);
    expect(firstResponse.status).toBe(200);
    expect(fetchedUrls.filter((url) => url.includes("/live/flight-positions/full"))).toHaveLength(1);
    expect(fetchedUrls.filter((url) => url.includes("/live/flight-positions/light"))).toHaveLength(1);

    await (env.FLIGHT_DISPLAY_KV as unknown as MemoryKv).delete("follow:fr24:v4:SK123");
    fetchedUrls.length = 0;

    const secondResponse = await request("/api/display", env);
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

    const env = makeEnv({}, {
      [CONFIG_KEY]: baseConfig()
    });

    const response = await request("/api/display", env);
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
    const env = makeEnv({}, {
      [CONFIG_KEY]: config
    });

    const response = await request("/api/display", env);
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
