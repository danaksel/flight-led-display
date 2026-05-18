export interface Env {
  FLIGHT_DISPLAY_KV: KVNamespace;
  ASSETS: Fetcher;
  FR24_API_KEY: string;
  FR24_API_BASE_URL?: string;
  FR24_LIVE_ENDPOINT?: string;
  FR24_AIRLINE_ENDPOINT_TEMPLATE?: string;
  FR24_AIRPORT_ENDPOINT_TEMPLATE?: string;
  HOME_AIRPORT_IATA?: string;
  DEFAULT_LAT?: string;
  DEFAULT_LON?: string;
  DEFAULT_RADIUS_KM?: string;
  CACHE_TTL_SECONDS?: string;
  DISPLAY_LIMIT?: string;
  AVINOR_XML_BASE_URL?: string;
  AVINOR_AIRPORT_NAMES_BASE_URL?: string;
  AVINOR_AIRLINE_NAMES_BASE_URL?: string;
  LOGO_BASE_URL?: string;
}

type Config = {
  lat: number;
  lon: number;
  radiusKm: number;
  homeAirportIata?: string;
  label?: string;
  device?: DeviceSettings;
  updatedAt?: string;
};

type DeviceSettings = {
  enabled: boolean;
  brightness: number;
  pollSeconds: number;
  displayCycleSeconds: number;
  timetableCycleSeconds: number;
  timetableScrollPixelsPerSecond: number;
  scrollPixelsPerSecond: number;
  configRefreshSeconds: number;
  timezone: string;
  lineColors: {
    airline: string;
    route: string;
    aircraft: string;
    context: string;
    progress: string;
  };
  timetableColors: {
    header: string;
    data: string;
    newTime: string;
    canceled: string;
  };
  nightMode: {
    enabled: boolean;
    start: string;
    end: string;
    brightness: number;
  };
};

type DisplayFlight = {
  fr24Id?: string;
  callsign?: string;
  flight?: string;
  airline?: string;
  airlineCode?: string;
  aircraft?: string;
  registration?: string;
  origin?: string;
  destination?: string;
  contextLabel?: string;
  contextValue?: string;
  lat?: number;
  lon?: number;
  altitudeFt?: number;
  speedKts?: number;
  headingDeg?: number;
  distanceKm: number;
  bearingDeg: number;
};

type AvinorFlight = {
  flightId: string;
  airport: string;
  time: string;
  sortTime: number;
  status: "scheduled" | "newTime" | "canceled";
  gate?: string;
  gateMessage?: string;
};

type AvinorRawFlight = {
  direction: "A" | "D";
  fields: Record<string, string>;
  status?: Record<string, string>;
  resolved: {
    flightId: string;
    airlineCode?: string;
    airlineName?: string;
    airportCode?: string;
    airportName?: string;
    scheduledTime?: string;
    displayTime?: string;
    gate?: string;
    gateMessage?: string;
    status: "scheduled" | "newTime" | "canceled" | "done";
  };
};

type IdleRow = {
  flightId: string;
  airport: string;
  time: string;
  status: "scheduled" | "newTime" | "canceled";
  gate?: string;
  gateMessage?: string;
};

type IdleScreen = {
  title: "DEPARTURES" | "ARRIVALS";
  kind: "departures" | "arrivals";
  rows: IdleRow[];
};

const CONFIG_KEY = "config:v1";
const AIRPORT_CITY_OVERRIDES: Record<string, string> = {
  ARN: "Stockholm",
  BGY: "Milan",
  CDG: "Paris",
  CIA: "Rome",
  CPH: "Copenhagen",
  FCO: "Rome",
  FLL: "Fort Lauderdale",
  HND: "Tokyo",
  JFK: "New York",
  LGA: "New York",
  LGW: "London",
  LTN: "London",
  MXP: "Milan",
  NRT: "Tokyo",
  OSL: "Oslo",
  ORY: "Paris",
  STN: "London",
  SWF: "New York",
  TRF: "Oslo",
  WAW: "Warsaw"
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      if (url.pathname === "/") return htmlResponse(renderIndexHtml());
      if (url.pathname.startsWith("/logos/")) return logoAssetResponse(request, env);
      if (url.pathname === "/api/config" && request.method === "GET") return jsonResponse(await getConfig(env), 200, { "Cache-Control": "no-store" });
      if (url.pathname === "/api/config" && request.method === "POST") return saveConfig(request, env);
      if (url.pathname === "/api/device-config" && request.method === "GET") return deviceConfigResponse(env);
      if (url.pathname === "/api/flights" && request.method === "GET") return flightsResponse(env, false);
      if (url.pathname === "/api/display" && request.method === "GET") return flightsResponse(env, true);
      if (url.pathname === "/api/avinor-board" && request.method === "GET") return avinorBoardResponse(env);
      if (url.pathname === "/api/health") return jsonResponse({ ok: true });

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return jsonResponse({ error: message }, 500);
    }
  }
};

async function getConfig(env: Env): Promise<Config> {
  const stored = await env.FLIGHT_DISPLAY_KV.get(CONFIG_KEY, "json");
  if (stored && isConfig(stored)) return withConfigDefaults(stored, env);

  return withConfigDefaults({
    lat: parseNumber(env.DEFAULT_LAT, 59.9139),
    lon: parseNumber(env.DEFAULT_LON, 10.7522),
    radiusKm: parseNumber(env.DEFAULT_RADIUS_KM, 10),
    label: "Home"
  }, env);
}

async function saveConfig(request: Request, env: Env): Promise<Response> {
  const body = await request.json();
  if (!isConfig(body)) {
    return jsonResponse({ error: "Expected lat, lon and radiusKm numbers" }, 400);
  }

  const config: Config = {
    lat: clamp(body.lat, -90, 90),
    lon: clamp(body.lon, -180, 180),
    radiusKm: clamp(body.radiusKm, 1, 250),
    homeAirportIata: normalizeAirportCode(body.homeAirportIata, env.HOME_AIRPORT_IATA || "OSL"),
    label: typeof body.label === "string" ? body.label.slice(0, 80) : undefined,
    device: normalizeDeviceSettings(body.device),
    updatedAt: new Date().toISOString()
  };

  await env.FLIGHT_DISPLAY_KV.put(CONFIG_KEY, JSON.stringify(config));
  return jsonResponse(config, 200, { "Cache-Control": "no-store" });
}

async function deviceConfigResponse(env: Env): Promise<Response> {
  const config = await getConfig(env);
  return jsonResponse({
    updatedAt: config.updatedAt || null,
    homeAirportIata: config.homeAirportIata,
    device: config.device
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function avinorBoardResponse(env: Env): Promise<Response> {
  const config = await getConfig(env);
  const airport = normalizeAirportCode(config.homeAirportIata, env.HOME_AIRPORT_IATA || "OSL");
  const timezone = config.device?.timezone || "Europe/Oslo";
  const [departures, arrivals] = await Promise.all([
    getAvinorRawFlights(env, airport, "D", timezone),
    getAvinorRawFlights(env, airport, "A", timezone)
  ]);

  return jsonResponse({
    updatedAt: new Date().toISOString(),
    airport,
    timezone,
    departures,
    arrivals
  }, 200, {
    "Cache-Control": "public, max-age=15"
  });
}

async function logoAssetResponse(request: Request, env: Env): Promise<Response> {
  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.status !== 404 || !env.LOGO_BASE_URL) return assetResponse;

  const url = new URL(request.url);
  const filename = url.pathname.split("/").pop() || "";
  if (!/^[A-Za-z0-9_-]+\.png$/.test(filename)) return assetResponse;

  const logoUrl = new URL(env.LOGO_BASE_URL.replace(/\/+$/, "") + "/" + filename);
  const response = await fetch(logoUrl.toString(), {
    headers: {
      Accept: "image/png,image/*"
    }
  });
  if (!response.ok) return assetResponse;

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/png",
      "Cache-Control": "public, max-age=86400"
    }
  });
}

function withConfigDefaults(config: Config, env: Env): Config {
  return {
    ...config,
    homeAirportIata: normalizeAirportCode(config.homeAirportIata, env.HOME_AIRPORT_IATA || "OSL"),
    device: normalizeDeviceSettings(config.device)
  };
}

function normalizeDeviceSettings(value: unknown): DeviceSettings {
  const v = value && typeof value === "object" ? value as Partial<DeviceSettings> : {};
  const night = v.nightMode && typeof v.nightMode === "object" ? v.nightMode as Partial<DeviceSettings["nightMode"]> : {};
  return {
    enabled: typeof v.enabled === "boolean" ? v.enabled : true,
    brightness: clampNumber(v.brightness, 1, 100, 80),
    pollSeconds: clampNumber(v.pollSeconds, 30, 900, 90),
    displayCycleSeconds: clampNumber(v.displayCycleSeconds, 2, 30, 5),
    timetableCycleSeconds: clampNumber((v as { timetableCycleSeconds?: unknown }).timetableCycleSeconds, 2, 60, 7),
    timetableScrollPixelsPerSecond: clampNumber((v as { timetableScrollPixelsPerSecond?: unknown }).timetableScrollPixelsPerSecond, 4, 40, 18),
    scrollPixelsPerSecond: clampNumber(v.scrollPixelsPerSecond, 2, 30, 9),
    configRefreshSeconds: clampNumber(v.configRefreshSeconds, 60, 3600, 300),
    timezone: typeof v.timezone === "string" && v.timezone.trim() ? v.timezone.slice(0, 64) : "Europe/Oslo",
    lineColors: normalizeLineColors((v as { lineColors?: unknown }).lineColors),
    timetableColors: normalizeTimetableColors((v as { timetableColors?: unknown }).timetableColors),
    nightMode: {
      enabled: typeof night.enabled === "boolean" ? night.enabled : true,
      start: normalizeTimeString(night.start, "23:00"),
      end: normalizeTimeString(night.end, "07:00"),
      brightness: clampNumber(night.brightness, 0, 100, 0)
    }
  };
}

function normalizeTimetableColors(value: unknown): DeviceSettings["timetableColors"] {
  const v = value && typeof value === "object" ? value as Partial<DeviceSettings["timetableColors"]> : {};
  return {
    header: normalizeHexColor(v.header, "#f7b500"),
    data: normalizeHexColor(v.data, "#f4f7ff"),
    newTime: normalizeHexColor(v.newTime, "#f7b500"),
    canceled: normalizeHexColor(v.canceled, "#ff3b30")
  };
}

function normalizeLineColors(value: unknown): DeviceSettings["lineColors"] {
  const v = value && typeof value === "object" ? value as Partial<DeviceSettings["lineColors"]> : {};
  return {
    airline: normalizeHexColor(v.airline, "#f4f7ff"),
    route: normalizeHexColor(v.route, "#f4f7ff"),
    aircraft: normalizeHexColor(v.aircraft, "#f4f7ff"),
    context: normalizeHexColor(v.context, "#f4f7ff"),
    progress: normalizeHexColor(v.progress, "#f7b500")
  };
}

function normalizeHexColor(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : fallback;
}

function normalizeAirportCode(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : fallback;
  return /^[A-Z0-9]{3,4}$/.test(raw) ? raw : fallback;
}

function normalizeTimeString(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
}

async function getIdleScreens(env: Env, config: Config): Promise<IdleScreen[]> {
  const airport = normalizeAirportCode(config.homeAirportIata, env.HOME_AIRPORT_IATA || "OSL");
  const [departures, arrivals] = await Promise.all([
    getAvinorFlights(env, airport, "D", config.device?.timezone || "Europe/Oslo"),
    getAvinorFlights(env, airport, "A", config.device?.timezone || "Europe/Oslo")
  ]);

  return [
    ...toIdleScreens("DEPARTURES", "departures", departures),
    ...toIdleScreens("ARRIVALS", "arrivals", arrivals)
  ];
}

function toIdleScreens(title: IdleScreen["title"], kind: IdleScreen["kind"], flights: AvinorFlight[]): IdleScreen[] {
  const rows = flights.map(toIdleRow);
  const firstPage = rows.slice(0, 4);
  const secondPage = rows.slice(4, 8);
  return [firstPage, secondPage].map((pageRows) => ({
    title,
    kind,
    rows: pageRows
  }));
}

function toIdleRow(flight: AvinorFlight): IdleRow {
  return {
    flightId: flight.flightId,
    airport: flight.airport,
    time: flight.time,
    status: flight.status,
    ...(flight.gate ? { gate: flight.gate } : {}),
    ...(flight.gateMessage ? { gateMessage: flight.gateMessage } : {})
  };
}

async function getAvinorFlights(env: Env, airport: string, direction: "A" | "D", timezone: string): Promise<AvinorFlight[]> {
  const cacheKey = `avinor:board:v1:${airport}:${direction}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (Array.isArray(cached)) return cached as AvinorFlight[];

  const rawFlights = await getAvinorRawFlights(env, airport, direction, timezone);
  const doneStatus = direction === "D" ? "D" : "A";
  const now = Date.now();
  const flights = rawFlights
    .map((raw): AvinorFlight | null => {
      const flightId = raw.resolved.flightId;
      const airportName = raw.resolved.airportName || raw.resolved.airportCode || "";
      const bestTime = raw.status?.code === "E" && raw.status?.time ? raw.status.time : raw.fields.schedule_time;
      const timestamp = Date.parse(bestTime || "");
      if (!flightId || !airportName || !Number.isFinite(timestamp)) return null;
      if (raw.status?.code === doneStatus) return null;
      if (timestamp < now - 10 * 60 * 1000) return null;
      return {
        flightId,
        airport: airportName,
        time: formatLocalTime(bestTime || raw.fields.schedule_time || "", timezone),
        sortTime: timestamp,
        status: raw.resolved.status === "canceled" ? "canceled" : raw.resolved.status === "newTime" ? "newTime" : "scheduled",
        ...(raw.resolved.gate ? { gate: raw.resolved.gate } : {}),
        ...(raw.resolved.gateMessage ? { gateMessage: raw.resolved.gateMessage } : {})
      };
    })
    .filter((flight): flight is AvinorFlight => Boolean(flight))
    .sort((a, b) => a.sortTime - b.sortTime)
    .slice(0, 8);

  await env.FLIGHT_DISPLAY_KV.put(cacheKey, JSON.stringify(flights), { expirationTtl: 180 });
  return flights;
}

async function getAvinorRawFlights(env: Env, airport: string, direction: "A" | "D", timezone: string): Promise<AvinorRawFlight[]> {
  const cacheKey = `avinor:raw:v1:${airport}:${direction}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (Array.isArray(cached)) return cached as AvinorRawFlight[];

  const baseUrl = env.AVINOR_XML_BASE_URL || "https://asrv.avinor.no/XmlFeed/v1.0";
  const url = new URL(baseUrl);
  url.searchParams.set("airport", airport);
  url.searchParams.set("TimeFrom", "0");
  url.searchParams.set("TimeTo", "12");
  url.searchParams.set("direction", direction);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/xml,text/xml"
    }
  });
  if (!response.ok) return [];

  const xml = await responseText(response);
  const flights = await parseAvinorRawFlights(env, xml, direction, timezone);
  await env.FLIGHT_DISPLAY_KV.put(cacheKey, JSON.stringify(flights), { expirationTtl: 180 });
  return flights;
}

function parseAvinorFlights(xml: string, direction: "A" | "D", timezone: string): AvinorFlight[] {
  const now = Date.now();
  const doneStatus = direction === "D" ? "D" : "A";
  return Array.from(xml.matchAll(/<flight\b[^>]*>([\s\S]*?)<\/flight>/g))
    .map((match): AvinorFlight | null => {
      const block = match[1];
      const flightId = xmlText(block, "flight_id");
      const airport = xmlText(block, "airport");
      const scheduleTime = xmlText(block, "schedule_time");
      const gate = xmlText(block, "gate");
      const status = block.match(/<status\b([^>]*)\/>/);
      const statusCode = status ? xmlAttribute(status[1], "code") : "";
      const statusTime = status ? xmlAttribute(status[1], "time") : "";
      const statusText = status ? xmlAttribute(status[1], "text") || xmlAttribute(status[1], "status") : "";
      const bestTime = statusCode === "E" && statusTime ? statusTime : scheduleTime;
      const timestamp = Date.parse(bestTime || "");
      if (!flightId || !airport || !Number.isFinite(timestamp)) return null;
      if (statusCode === doneStatus) return null;
      if (timestamp < now - 10 * 60 * 1000) return null;
      const gateMessage = direction === "D" ? extractGateMessage(block, statusText) : undefined;
      return {
        flightId,
        airport,
        time: formatLocalTime(bestTime || scheduleTime || "", timezone),
        sortTime: timestamp,
        status: statusCode === "C" ? "canceled" : (statusCode === "E" || xmlText(block, "delayed") === "Y" ? "newTime" : "scheduled"),
        ...(gate ? { gate } : {}),
        ...(gateMessage ? { gateMessage } : {})
      };
    })
    .filter((flight): flight is AvinorFlight => Boolean(flight))
    .sort((a, b) => a.sortTime - b.sortTime)
    .slice(0, 8);
}

async function parseAvinorRawFlights(env: Env, xml: string, direction: "A" | "D", timezone: string): Promise<AvinorRawFlight[]> {
  const blocks = Array.from(xml.matchAll(/<flight\b[^>]*>([\s\S]*?)<\/flight>/g)).map((match) => match[1]);
  const rows = blocks.map((block): AvinorRawFlight => {
    const fields = xmlFields(block);
    const statusMatch = block.match(/<status\b([^>]*)\/>/);
    const status = statusMatch ? xmlAttributes(statusMatch[1]) : undefined;
    const flightId = fields.flight_id || "";
    const airlineCode = (fields.airline || airlineIataFromFlightNumber(flightId) || "").toUpperCase();
    const airportCode = (fields.airport || "").toUpperCase();
    const bestTime = status?.code === "E" && status?.time ? status.time : fields.schedule_time;
    const gateMessage = direction === "D" ? extractGateMessage(block, status?.text || status?.status || "") : undefined;
    const statusCode = status?.code || "";

    return {
      direction,
      fields,
      ...(status ? { status } : {}),
      resolved: {
        flightId,
        ...(airlineCode ? { airlineCode } : {}),
        ...(airportCode ? { airportCode } : {}),
        scheduledTime: fields.schedule_time || "",
        displayTime: formatLocalTime(bestTime || fields.schedule_time || "", timezone),
        ...(fields.gate ? { gate: fields.gate } : {}),
        ...(gateMessage ? { gateMessage } : {}),
        status: statusCode === "C" ? "canceled" : statusCode === "E" || fields.delayed === "Y" ? "newTime" : statusCode === "A" || statusCode === "D" ? "done" : "scheduled"
      }
    };
  });

  const airportCodes = Array.from(new Set(rows.map((row) => row.resolved.airportCode).filter((code): code is string => Boolean(code))));
  const airlineCodes = Array.from(new Set(rows.map((row) => row.resolved.airlineCode).filter((code): code is string => Boolean(code))));
  const [airportNames, airlineNames] = await Promise.all([
    Promise.all(airportCodes.map((code) => getAvinorAirportName(env, code))),
    Promise.all(airlineCodes.map((code) => getAvinorAirlineName(env, code)))
  ]);
  const airportNameByCode = new Map<string, string>();
  const airlineNameByCode = new Map<string, string>();
  airportCodes.forEach((code, index) => {
    if (airportNames[index]) airportNameByCode.set(code, airportNames[index]);
  });
  airlineCodes.forEach((code, index) => {
    if (airlineNames[index]) airlineNameByCode.set(code, airlineNames[index]);
  });

  for (const row of rows) {
    const airportName = row.resolved.airportCode ? airportNameByCode.get(row.resolved.airportCode) : undefined;
    const airlineName = row.resolved.airlineCode ? airlineNameByCode.get(row.resolved.airlineCode) : undefined;
    if (airportName) row.resolved.airportName = airportName;
    if (airlineName) row.resolved.airlineName = airlineName;
  }

  return rows;
}

function xmlFields(xml: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const match of xml.matchAll(/<([a-zA-Z0-9_:-]+)>([\s\S]*?)<\/\1>/g)) {
    const key = match[1];
    if (key === "status") continue;
    fields[key] = decodeXml(match[2].trim());
  }
  return fields;
}

function xmlAttributes(attributes: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const match of attributes.matchAll(/([a-zA-Z0-9_:-]+)="([^"]*)"/g)) {
    values[match[1]] = decodeXml(match[2].trim());
  }
  return values;
}

function extractGateMessage(xml: string, statusText: string): string | undefined {
  const raw = [
    xmlText(xml, "gate_status"),
    xmlText(xml, "gateStatus"),
    xmlText(xml, "gate_action"),
    xmlText(xml, "gateAction"),
    xmlText(xml, "gate_info"),
    xmlText(xml, "gateInfo"),
    statusText
  ].find(Boolean);
  if (!raw) return undefined;

  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (["gotogate", "togate", "go", "g"].includes(normalized)) return "Go to gate";
  if (["gateclosing", "closing", "close", "gc"].includes(normalized)) return "Gate closing";
  if (["gateclosed", "closed", "cl"].includes(normalized)) return "Gate closed";
  if (normalized.includes("gotogate")) return "Go to gate";
  if (normalized.includes("closing")) return "Gate closing";
  if (normalized.includes("closed")) return "Gate closed";
  return undefined;
}

function xmlText(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeXml(match[1].trim()) : "";
}

function xmlAttribute(attributes: string, name: string): string {
  const match = attributes.match(new RegExp(`${name}="([^"]*)"`));
  return match ? decodeXml(match[1].trim()) : "";
}

async function responseText(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  const buffer = await response.arrayBuffer();
  const prefix = String.fromCharCode(...new Uint8Array(buffer.slice(0, 160)));
  if (/iso-8859-1|latin-?1/i.test(`${contentType} ${prefix}`)) {
    return new TextDecoder("iso-8859-1").decode(buffer);
  }
  return new TextDecoder("utf-8").decode(buffer);
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function formatLocalTime(value: string, timezone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("nb-NO", {
    timeZone: timezone || "Europe/Oslo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

async function flightsResponse(env: Env, compact: boolean): Promise<Response> {
  const config = await getConfig(env);
  const flights = await getFlights(env, config);
  const limit = Math.max(1, Math.min(50, parseNumber(env.DISPLAY_LIMIT, 8)));
  const displayFlights = flights.slice(0, limit);
  const idleScreens = displayFlights.length ? [] : await getIdleScreens(env, config);

  const payload = compact
    ? {
        updatedAt: new Date().toISOString(),
        lat: config.lat,
        lon: config.lon,
        radiusKm: config.radiusKm,
        device: config.device,
        idleScreens,
        flights: displayFlights.map((f) => {
          const route = [f.origin, f.destination].filter(Boolean).join("-");
          const context = [f.contextLabel, f.contextValue].filter(Boolean).join(" ");
          return {
            cs: f.callsign || f.flight || "",
            flt: f.flight || "",
            air: f.airline || "",
            airCode: f.airlineCode || "",
            logoUrl: logoUrlFor(displayLogoCodeFor(f)),
            ac: f.aircraft || "",
            reg: f.registration || "",
            from: f.origin || "",
            to: f.destination || "",
            ctxLabel: f.contextLabel || "",
            ctxValue: f.contextValue || "",
            lines: {
              airline: f.airline || f.airlineCode || "",
              route,
              aircraft: f.aircraft || f.registration || "",
              context
            },
            b: Math.round(f.bearingDeg),
            alt: f.altitudeFt ?? null,
            spd: f.speedKts ?? null
          };
        })
      }
    : {
        updatedAt: new Date().toISOString(),
        config,
        flights: displayFlights,
        idleScreens
      };

  return jsonResponse(payload, 200, {
    "Cache-Control": "public, max-age=15"
  });
}

function logoUrlFor(airlineCode: string | undefined): string {
  const code = normalizeLogoCode(airlineCode);
  return code ? `/logos/${code}.png` : "/logos/UNKNOWN.png";
}

function displayLogoCodeFor(flight: DisplayFlight): string {
  const docCode = logoCodeFromCallsign(flight.callsign) || logoCodeFromCallsign(flight.flight) || logoCodeFromCallsign(flight.airline) || logoCodeFromCallsign(flight.airlineCode);
  if (docCode) return docCode;
  return normalizeLogoCode(flight.airlineCode);
}

function logoCodeFromCallsign(value: string | undefined): string {
  if (!value) return "";
  return /^DOC(?:\d+)?$/i.test(value.trim()) ? "DOC" : "";
}

function normalizeLogoCode(airlineCode: string | undefined): string {
  if (!airlineCode) return "";
  const code = airlineCode.toUpperCase();
  if (!/^[A-Z0-9]{2,4}$/.test(code)) return "";

  const aliases: Record<string, string> = {
    NAX: "NOZ",
    IBK: "NOZ",
    NSZ: "NOZ",
    NAI: "NOZ",
    NRS: "NOZ",
    EJU: "EZY",
    EZS: "EZY",
    EZY: "EZY",
    EWG: "EWG",
    EWE: "EWG",
    EWG1: "EWG",
    SAS: "SAS",
    SZS: "SAS",
    SZN: "SAS",
    TRA: "TRA",
    TVF: "TRA",
    NOA: "DOC"
  };

  return aliases[code] || code;
}

async function getFlights(env: Env, config: Config): Promise<DisplayFlight[]> {
  const cacheTtl = Math.max(60, parseNumber(env.CACHE_TTL_SECONDS, 60));
  const cacheKey = `flights:v1:${config.lat.toFixed(3)}:${config.lon.toFixed(3)}:${Math.round(config.radiusKm)}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (Array.isArray(cached)) {
    const flights = cached as DisplayFlight[];
    await enrichAirlineNames(env, flights);
    return flights;
  }

  const bounds = boundsFromRadius(config.lat, config.lon, config.radiusKm);
  const records = await fetchFr24(env, bounds);
  const flights = records
    .map((record) => normalizeFlight(record, config))
    .filter((flight): flight is DisplayFlight => Boolean(flight))
    .filter(isAirborneFlight)
    .filter((flight) => flight.distanceKm <= config.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  await enrichAirlineNames(env, flights);
  await enrichAirportContext(env, config, flights);
  await env.FLIGHT_DISPLAY_KV.put(cacheKey, JSON.stringify(flights), { expirationTtl: cacheTtl });
  return flights;
}

function isAirborneFlight(flight: DisplayFlight): boolean {
  return typeof flight.altitudeFt === "number" && flight.altitudeFt > 0;
}

async function fetchFr24(env: Env, bounds: string): Promise<unknown[]> {
  if (!env.FR24_API_KEY) throw new Error("FR24_API_KEY secret is not configured");

  const baseUrl = env.FR24_API_BASE_URL || "https://fr24api.flightradar24.com/api";
  const endpoint = env.FR24_LIVE_ENDPOINT || "/live/flight-positions/full";
  const url = new URL(`${baseUrl}${endpoint}`);
  url.searchParams.set("bounds", bounds);
  url.searchParams.set("limit", "300");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Version": "v1",
      Authorization: `Bearer ${env.FR24_API_KEY}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`FR24 request failed (${response.status}): ${text.slice(0, 240)}`);
  }

  const json = await response.json();
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object" && Array.isArray((json as { data?: unknown[] }).data)) {
    return (json as { data: unknown[] }).data;
  }
  return [];
}

function normalizeFlight(record: unknown, config: Config): DisplayFlight | null {
  if (!record || typeof record !== "object") return null;
  const r = record as Record<string, unknown>;
  const lat = firstNumber(r, ["lat", "latitude"]);
  const lon = firstNumber(r, ["lon", "lng", "longitude"]);
  if (lat === undefined || lon === undefined) return null;

  const distanceKm = haversineKm(config.lat, config.lon, lat, lon);
  const bearingDeg = bearing(config.lat, config.lon, lat, lon);

  return {
    fr24Id: firstString(r, ["fr24_id", "id"]),
    callsign: firstString(r, ["callsign"]),
    flight: firstString(r, ["flight", "flight_number"]),
    airline: firstString(r, ["airline_name", "airline_full_name", "name"]),
    airlineCode: firstString(r, ["painted_as", "operated_as", "airline_icao", "airline"]),
    aircraft: firstString(r, ["type", "aircraft_code", "aircraft"]),
    registration: firstString(r, ["reg", "registration"]),
    origin: firstString(r, ["orig_iata", "origin_iata", "origin_icao"]),
    destination: firstString(r, ["dest_iata", "destination_iata", "destination_icao"]),
    lat,
    lon,
    altitudeFt: firstNumber(r, ["alt", "altitude", "altitude_ft"]),
    speedKts: firstNumber(r, ["gspeed", "ground_speed", "speed"]),
    headingDeg: firstNumber(r, ["track", "heading"]),
    distanceKm,
    bearingDeg
  };
}

async function enrichAirlineNames(env: Env, flights: DisplayFlight[]): Promise<void> {
  const iataCodes = Array.from(
    new Set(
      flights
        .map((flight) => airlineIataFromFlightNumber(flight.flight))
        .filter((code): code is string => Boolean(code))
    )
  );
  const avinorNames = await Promise.all(iataCodes.map((code) => getAvinorAirlineName(env, code)));
  const avinorNameByIata = new Map<string, string>();
  iataCodes.forEach((code, index) => {
    if (avinorNames[index]) avinorNameByIata.set(code, avinorNames[index]);
  });

  const codes = Array.from(
    new Set(
      flights
        .map((flight) => flight.airlineCode)
        .filter((code): code is string => Boolean(code && /^[A-Z0-9]{2,4}$/.test(code)))
    )
  );

  const names = await Promise.all(codes.map((code) => getAirlineName(env, code)));
  const nameByCode = new Map<string, string>();
  codes.forEach((code, index) => {
    if (names[index]) nameByCode.set(code, names[index]);
  });

  for (const flight of flights) {
    const iata = airlineIataFromFlightNumber(flight.flight);
    if (iata && avinorNameByIata.has(iata)) {
      flight.airline = avinorNameByIata.get(iata);
      continue;
    }
    if (flight.airlineCode && nameByCode.has(flight.airlineCode)) {
      flight.airline = nameByCode.get(flight.airlineCode);
    }
    if (!flight.airline) {
      flight.airline = flight.airlineCode;
    }
  }
}

function airlineIataFromFlightNumber(flightNumber: string | undefined): string | undefined {
  const raw = flightNumber?.trim().toUpperCase();
  if (!raw) return undefined;
  const match = raw.match(/^([A-Z0-9]{2})(?:\s|-)?\d/);
  return match ? match[1] : undefined;
}

async function getAvinorAirlineName(env: Env, code: string): Promise<string | undefined> {
  const normalized = code.toUpperCase();
  const names = await getAvinorAirlineNames(env);
  return names[normalized];
}

async function getAvinorAirlineNames(env: Env): Promise<Record<string, string>> {
  const cacheKey = "airlines:avinor:v1";
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (cached && typeof cached === "object" && !Array.isArray(cached)) {
    return cached as Record<string, string>;
  }

  const baseUrl = env.AVINOR_AIRLINE_NAMES_BASE_URL || "https://asrv.avinor.no/airlineNames/v1.0";
  const response = await fetch(baseUrl, {
    headers: {
      Accept: "application/xml,text/xml"
    }
  });
  if (!response.ok) return {};

  const xml = await responseText(response);
  const names: Record<string, string> = {};
  for (const match of xml.matchAll(/<airlineName\b([^>]*)\/>/g)) {
    const code = xmlAttribute(match[1], "code").toUpperCase();
    const name = xmlAttribute(match[1], "name");
    if (/^[A-Z0-9]{2,4}$/.test(code) && name) {
      names[code] = name;
    }
  }

  await env.FLIGHT_DISPLAY_KV.put(cacheKey, JSON.stringify(names), { expirationTtl: 86400 });
  return names;
}

async function getAirlineName(env: Env, icao: string): Promise<string | undefined> {
  const code = icao.toUpperCase();
  const cacheKey = `airline:v1:${code}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey);
  if (cached) return cached;

  const baseUrl = env.FR24_API_BASE_URL || "https://fr24api.flightradar24.com/api";
  const template = env.FR24_AIRLINE_ENDPOINT_TEMPLATE || "/static/airlines/{icao}/light";
  const path = template.replace("{icao}", encodeURIComponent(code));
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      "Accept-Version": "v1",
      Authorization: `Bearer ${env.FR24_API_KEY}`
    }
  });

  if (!response.ok) return undefined;

  const json = await response.json();
  const data = json && typeof json === "object" && "data" in json ? (json as { data: unknown }).data : json;
  const name = extractAirlineName(data);
  if (name) {
    await env.FLIGHT_DISPLAY_KV.put(cacheKey, name);
  }
  return name;
}

function extractAirlineName(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const name = extractAirlineName(item);
      if (name) return name;
    }
    return undefined;
  }

  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return firstString(record, ["name", "full_name", "airline_name", "display_name", "legal_name"]);
}

async function enrichAirportContext(env: Env, config: Config, flights: DisplayFlight[]): Promise<void> {
  const home = (config.homeAirportIata || env.HOME_AIRPORT_IATA || "OSL").toUpperCase();
  const neededCodes = new Set<string>();

  for (const flight of flights) {
    const origin = flight.origin?.toUpperCase();
    const destination = flight.destination?.toUpperCase();
    if (destination === home && origin) {
      flight.contextLabel = "Arriving from";
      neededCodes.add(origin);
    } else if (origin === home && destination) {
      flight.contextLabel = "Departing to";
      neededCodes.add(destination);
    }
  }

  const codes = Array.from(neededCodes);
  const names = await Promise.all(codes.map((code) => getAirportDisplayName(env, code)));
  const nameByCode = new Map<string, string>();
  codes.forEach((code, index) => {
    if (names[index]) nameByCode.set(code, names[index]);
  });

  for (const flight of flights) {
    if (!flight.contextLabel) continue;
    const code = flight.contextLabel === "Arriving from" ? flight.origin?.toUpperCase() : flight.destination?.toUpperCase();
    flight.contextValue = (code && nameByCode.get(code)) || code || "";
  }
}

async function getAirportDisplayName(env: Env, code: string): Promise<string | undefined> {
  const normalized = code.toUpperCase();
  const cacheKey = `airport:v2:${normalized}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey);
  if (cached) return cached;

  const avinorName = await getAvinorAirportName(env, normalized);
  if (avinorName) {
    await env.FLIGHT_DISPLAY_KV.put(cacheKey, avinorName);
    return avinorName;
  }

  const override = AIRPORT_CITY_OVERRIDES[normalized];
  if (override) {
    await env.FLIGHT_DISPLAY_KV.put(cacheKey, override);
    return override;
  }

  const baseUrl = env.FR24_API_BASE_URL || "https://fr24api.flightradar24.com/api";
  const template = env.FR24_AIRPORT_ENDPOINT_TEMPLATE || "/static/airports/{code}/light";
  const path = template.replace("{code}", encodeURIComponent(normalized));
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      "Accept-Version": "v1",
      Authorization: `Bearer ${env.FR24_API_KEY}`
    }
  });

  if (!response.ok) return undefined;

  const json = await response.json();
  const data = json && typeof json === "object" && "data" in json ? (json as { data: unknown }).data : json;
  const displayName = extractAirportCity(data) || cleanAirportName(extractAirportName(data));
  if (displayName) {
    await env.FLIGHT_DISPLAY_KV.put(cacheKey, displayName);
  }
  return displayName;
}

async function enrichAvinorAirportNames(env: Env, flights: AvinorFlight[]): Promise<void> {
  const codes = Array.from(new Set(flights.map((flight) => flight.airport).filter(Boolean)));
  const names = await Promise.all(codes.map((code) => getAvinorAirportName(env, code)));
  const nameByCode = new Map<string, string>();
  codes.forEach((code, index) => {
    if (names[index]) nameByCode.set(code, names[index]);
  });

  for (const flight of flights) {
    const name = nameByCode.get(flight.airport);
    if (name) flight.airport = name;
  }
}

async function getAvinorAirportName(env: Env, code: string): Promise<string | undefined> {
  const normalized = code.toUpperCase();
  if (!/^[A-Z0-9]{3,4}$/.test(normalized)) return undefined;
  const cacheKey = `airport:avinor:v1:${normalized}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey);
  if (cached) return cached;

  const baseUrl = env.AVINOR_AIRPORT_NAMES_BASE_URL || "https://asrv.avinor.no/airportNames/v1.0";
  const url = new URL(baseUrl);
  url.searchParams.set("airport", normalized);
  url.searchParams.set("shortname", "Y");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/xml,text/xml"
    }
  });
  if (!response.ok) return undefined;

  const xml = await responseText(response);
  const match = xml.match(/<airportName\b([^>]*)\/>/);
  if (!match) return undefined;

  const attributes = match[1];
  const name =
    xmlAttribute(attributes, "shortname8") ||
    xmlAttribute(attributes, "shortname15") ||
    xmlAttribute(attributes, "name");
  if (!name) return undefined;

  await env.FLIGHT_DISPLAY_KV.put(cacheKey, name, { expirationTtl: 86400 });
  return name;
}

function extractAirportCity(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const city = extractAirportCity(item);
      if (city) return city;
    }
    return undefined;
  }

  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return firstString(record, ["city", "city_name", "municipality", "place", "location"]);
}

function extractAirportName(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const name = extractAirportName(item);
      if (name) return name;
    }
    return undefined;
  }

  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return firstString(record, ["name", "full_name", "airport_name", "display_name"]);
}

function cleanAirportName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const withoutDecorators = name
    .replace(/\b(international|intl\.?|airport|aeropuerto|aeroport|aeroporto|lufthavn|flyplass)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s*[-–—]\s*$/g, "")
    .trim();
  return withoutDecorators || name;
}

function renderIndexHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Flight Display Server</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; --ink:#f5f0df; --muted:#9fa8b8; --line:#273345; --panel:#101720; --panel2:#151f2b; --field:#0b1118; --amber:#f6b800; --amber2:#ffd761; --blue:#2f7fdd; --danger:#ff6d4a; --ok:#78d98f; }
    body { margin: 0; min-height: 100vh; background: #05080d; color: var(--ink); }
    .shell { min-height: 100vh; display: grid; grid-template-columns: minmax(390px, 450px) minmax(0, 1fr); align-items: stretch; background: linear-gradient(135deg, #05080d 0%, #0d141e 54%, #161205 100%); }
    aside { padding: 18px; background: linear-gradient(180deg, rgba(9,14,20,.98), rgba(13,19,28,.96)); border-right: 1px solid #2c3542; box-shadow: 12px 0 30px rgba(0,0,0,.24); box-sizing: border-box; }
    .brand { margin: 0 0 14px; padding: 14px 14px 12px; background: #05070a; border: 1px solid #293241; border-left: 5px solid var(--amber); border-radius: 6px; }
    .eyebrow { margin: 0 0 7px; color: var(--amber2); font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 25px; line-height: 1.05; letter-spacing: .02em; }
    p { margin: 7px 0 0; color: var(--muted); line-height: 1.45; font-size: 13px; }
    .card { margin-top: 12px; padding: 13px; border: 1px solid var(--line); border-radius: 6px; background: rgba(16,23,32,.88); box-shadow: 0 14px 36px rgba(0,0,0,.22); }
    .card h2 { margin: 0 0 12px; color: var(--amber2); font-size: 13px; letter-spacing: .12em; text-transform: uppercase; }
    label { display: block; margin: 11px 0 5px; color: #d7deea; font-weight: 700; font-size: 12px; }
    input, select { width: 100%; box-sizing: border-box; border: 1px solid #334154; border-radius: 5px; padding: 9px 10px; font: inherit; background: var(--field); color: var(--ink); }
    input[type="checkbox"] { width: auto; }
    input:focus, select:focus { outline: 2px solid rgba(246,184,0,.35); border-color: var(--amber); }
    input[type="color"] { height: 38px; padding: 3px; cursor: pointer; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .color-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
    .color-grid label { margin-top: 10px; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 4px; }
    .toggle-row label { margin: 0; }
    button { margin-top: 14px; width: 100%; border: 0; border-radius: 5px; padding: 10px 13px; background: var(--amber); color: #111; font: inherit; font-weight: 850; cursor: pointer; }
    button.secondary { background: #1d2938; color: #f3f6fb; border: 1px solid #354457; margin-top: 9px; }
    button:hover { filter: brightness(1.05); }
    .savebar { margin-top: 12px; padding: 12px; border: 1px solid #2e3a4c; border-radius: 6px; background: linear-gradient(180deg, #111a25, #0b1118); }
    .savebar button { margin: 0; }
    .status { min-height: 18px; margin-top: 9px; font-size: 12px; color: var(--ok); }
    .status.dirty { color: var(--amber2); }
    .error { color: var(--danger); }
    .links { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
    .links a { padding: 7px 8px; background: #0b1118; border: 1px solid #263345; border-radius: 5px; }
    .preview { margin-top: 16px; }
    .preview-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .preview-head h2 { margin: 0; font-size: 13px; }
    .preview-head button { width: auto; margin: 0; padding: 8px 10px; font-size: 12px; background: #1d2938; color: #f3f6fb; border: 1px solid #354457; }
    .meta { margin: 8px 0 10px; color: var(--muted); font-size: 12px; }
    .flight-list { display: grid; gap: 8px; }
    .flight { border: 1px solid #2e3a4c; border-radius: 6px; padding: 9px 10px; background: #0b1118; }
    .flight-row { display: grid; grid-template-columns: 42px 1fr; gap: 10px; align-items: center; }
    .flight-logo { width: 42px; height: 42px; object-fit: contain; background: #000; border-radius: 4px; }
    .flight-logo.missing { display: grid; place-items: center; color: #7b8797; font-size: 10px; border: 1px solid #2e3a4c; background: #111923; }
    .flight strong { display: block; font-size: 15px; }
    .flight span { display: block; margin-top: 3px; color: var(--muted); font-size: 12px; line-height: 1.35; }
    .empty { color: var(--muted); font-size: 13px; line-height: 1.4; }
    .raw-board { margin-top: 10px; border-top: 1px solid #263345; padding-top: 10px; }
    .raw-board h3 { margin: 12px 0 8px; color: var(--amber2); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
    .raw-card { margin-top: 8px; border: 1px solid #2e3a4c; border-radius: 6px; background: #070d13; overflow: hidden; }
    .raw-card summary { cursor: pointer; padding: 9px 10px; color: #f4f7ff; font-weight: 800; }
    .raw-card summary span { display: block; margin-top: 3px; color: var(--muted); font-size: 11px; font-weight: 600; }
    .field-grid { display: grid; grid-template-columns: 138px minmax(0, 1fr); gap: 1px; padding: 0 10px 10px; font-size: 11px; }
    .field-grid dt, .field-grid dd { margin: 0; padding: 5px 6px; background: #0b1118; min-width: 0; overflow-wrap: anywhere; }
    .field-grid dt { color: var(--amber2); font-weight: 800; }
    .field-grid dd { color: #dce4ee; }
    .workbench { display: grid; grid-template-rows: minmax(330px, 42vh) auto; min-height: 100vh; align-self: stretch; }
    .emulator { padding: 18px 22px 22px; background: #0c121a; color: #e8edf4; border-top: 1px solid #263242; }
    .emulator h2 { margin: 0 0 6px; font-size: 18px; }
    .emulator p { color: #aeb8c5; margin-bottom: 14px; }
    .emu-controls { display: grid; grid-template-columns: 170px minmax(220px, 420px); gap: 12px; align-items: end; margin-bottom: 14px; }
    .emu-controls label { color: #dce4ee; margin-top: 0; }
    .emu-controls input, .emu-controls select { width: 100%; box-sizing: border-box; border: 1px solid #3b4859; border-radius: 6px; padding: 9px 10px; background: #182232; color: #f8fafc; font: inherit; }
    .emu-stage { overflow: auto; padding: 12px; background: #070a0e; border: 1px solid #2c3849; border-radius: 8px; }
    .emu-wrap { position: relative; width: min(100%, 1024px); aspect-ratio: 2 / 1; background: #000; }
    #ledCanvas { width: 100%; height: 100%; display: block; background: #000; }
    .emu-meta { margin-top: 10px; color: #aeb8c5; font-size: 12px; }
    a { color: #2f6fbd; text-decoration: none; }
    a:hover { text-decoration: underline; }
    #map { min-height: 330px; border-bottom: 1px solid #263242; filter: saturate(.78) contrast(1.05); }
    @media (max-width: 820px) {
      .shell { display: block; min-height: 100vh; }
      aside { max-height: none; overflow: visible; border-right: 0; border-bottom: 1px solid #273345; box-shadow: none; }
      .workbench { display: block; min-height: 0; }
      #map { height: 340px; min-height: 340px; }
      .emulator { padding: 16px 12px 18px; }
      .emu-controls { grid-template-columns: 1fr; }
      .color-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .row { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <aside>
      <header class="brand">
        <div class="eyebrow">OSL local display control</div>
        <h1>Flight Display</h1>
        <p>Styr posisjon, skjermatferd, farger og preview fra Worker. Live-data hentes bare når du ber om det.</p>
      </header>
      <section class="card">
        <h2>Område</h2>
        <label for="label">Navn</label>
        <input id="label" autocomplete="off" placeholder="Home">
        <div class="row">
          <div>
            <label for="lat">Latitude</label>
            <input id="lat" inputmode="decimal">
          </div>
          <div>
            <label for="lon">Longitude</label>
            <input id="lon" inputmode="decimal">
          </div>
        </div>
        <div class="row">
          <div>
            <label for="radius">Radius km</label>
            <input id="radius" type="number" min="1" max="250" step="1">
          </div>
          <div>
            <label for="homeAirport">Home airport</label>
            <input id="homeAirport" maxlength="4" placeholder="OSL">
          </div>
        </div>
        <button id="locate" class="secondary">Bruk min posisjon</button>
      </section>
      <section class="card">
        <h2>Skjermstyring</h2>
        <div class="toggle-row">
          <label for="deviceEnabled">Display aktiv</label>
          <input id="deviceEnabled" type="checkbox">
        </div>
        <div class="row">
          <div>
            <label for="deviceBrightness">Brightness %</label>
            <input id="deviceBrightness" type="number" min="1" max="100" step="1">
          </div>
          <div>
            <label for="nightBrightness">Natt-brightness %</label>
            <input id="nightBrightness" type="number" min="0" max="100" step="1">
          </div>
        </div>
        <div class="row">
          <div>
            <label for="pollSeconds">Poll sek</label>
            <input id="pollSeconds" type="number" min="30" max="900" step="5">
          </div>
          <div>
            <label for="configRefreshSeconds">Config sek</label>
            <input id="configRefreshSeconds" type="number" min="60" max="3600" step="30">
          </div>
        </div>
        <div class="row">
          <div>
            <label for="timezone">Timezone</label>
            <input id="timezone" placeholder="Europe/Oslo">
          </div>
        </div>
        <div class="toggle-row">
          <label for="nightEnabled">Nattmodus</label>
          <input id="nightEnabled" type="checkbox">
        </div>
        <div class="row">
          <div>
            <label for="nightStart">Natt start</label>
            <input id="nightStart" type="time">
          </div>
          <div>
            <label for="nightEnd">Natt slutt</label>
            <input id="nightEnd" type="time">
          </div>
        </div>
        <h2 style="margin-top:16px">Fly</h2>
        <div class="row">
          <div>
            <label for="cycleSeconds">Flight sek</label>
            <input id="cycleSeconds" type="number" min="2" max="30" step="1">
          </div>
          <div>
            <label for="scrollSpeed">Scroll px/s</label>
            <input id="scrollSpeed" type="number" min="2" max="30" step="1">
          </div>
        </div>
        <div class="color-grid">
          <div>
            <label for="airlineColor">Flyselskap</label>
            <input id="airlineColor" type="color">
          </div>
          <div>
            <label for="routeColor">Rute</label>
            <input id="routeColor" type="color">
          </div>
          <div>
            <label for="aircraftColor">Flytype</label>
            <input id="aircraftColor" type="color">
          </div>
          <div>
            <label for="contextColor">Tekstscroll</label>
            <input id="contextColor" type="color">
          </div>
          <div>
            <label for="progressColor">Progress</label>
            <input id="progressColor" type="color">
          </div>
        </div>
        <h2 style="margin-top:16px">Tidstabell</h2>
        <div class="row">
          <div>
            <label for="timetableCycleSeconds">Tavle sek</label>
            <input id="timetableCycleSeconds" type="number" min="2" max="60" step="1">
          </div>
          <div>
            <label for="timetableScrollSpeed">Tavle scroll px/s</label>
            <input id="timetableScrollSpeed" type="number" min="4" max="40" step="1">
          </div>
        </div>
        <div class="color-grid">
          <div>
            <label for="timetableHeaderColor">Overskrift</label>
            <input id="timetableHeaderColor" type="color">
          </div>
          <div>
            <label for="timetableDataColor">Data</label>
            <input id="timetableDataColor" type="color">
          </div>
          <div>
            <label for="timetableNewTimeColor">New time</label>
            <input id="timetableNewTimeColor" type="color">
          </div>
          <div>
            <label for="timetableCanceledColor">Canceled</label>
            <input id="timetableCanceledColor" type="color">
          </div>
        </div>
      </section>
      <div class="savebar">
        <button id="save">Lagre alle innstillinger</button>
        <div id="status" class="status"></div>
      </div>
      <div class="links">
        <a href="/api/config" target="_blank">/api/config</a>
        <a href="/api/device-config" target="_blank">/api/device-config</a>
        <a href="/api/flights" target="_blank">/api/flights</a>
        <a href="/api/display" target="_blank">/api/display</a>
        <a href="/api/avinor-board" target="_blank">/api/avinor-board</a>
      </div>
      <section class="preview card" aria-label="Display preview">
        <div class="preview-head">
          <h2>Display-data</h2>
          <button id="refresh" type="button">Hent data</button>
        </div>
        <div id="previewMeta" class="meta"></div>
        <div id="flightList" class="flight-list"></div>
        <div id="avinorRaw" class="raw-board"></div>
      </section>
    </aside>
    <div class="workbench">
      <section id="map" aria-label="Map"></section>
      <section class="emulator" aria-label="LED matrix emulator">
        <h2>128 x 64 emulator</h2>
        <p>Forhåndsvis nøyaktig 128 x 64 LED-layout. Brightness, farger, rotasjon og scroll styres fra innstillingene til venstre.</p>
        <div class="emu-controls">
          <div>
            <label for="emuSource">Source</label>
            <select id="emuSource">
              <option value="live">Live data</option>
              <option value="upload">Logo test</option>
            </select>
          </div>
          <div>
            <label for="imageUpload">Logo 42 x 42 PNG</label>
            <input id="imageUpload" type="file" accept="image/*">
          </div>
        </div>
        <div class="emu-stage">
          <div class="emu-wrap">
            <canvas id="ledCanvas" width="1024" height="512"></canvas>
          </div>
        </div>
        <div id="emuMeta" class="emu-meta">Ingen bilde lastet opp.</div>
      </section>
    </div>
  </main>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const els = {
      label: document.querySelector("#label"),
      lat: document.querySelector("#lat"),
      lon: document.querySelector("#lon"),
      radius: document.querySelector("#radius"),
      homeAirport: document.querySelector("#homeAirport"),
      deviceEnabled: document.querySelector("#deviceEnabled"),
      deviceBrightness: document.querySelector("#deviceBrightness"),
      nightBrightness: document.querySelector("#nightBrightness"),
      pollSeconds: document.querySelector("#pollSeconds"),
      cycleSeconds: document.querySelector("#cycleSeconds"),
      timetableCycleSeconds: document.querySelector("#timetableCycleSeconds"),
      timetableScrollSpeed: document.querySelector("#timetableScrollSpeed"),
      scrollSpeed: document.querySelector("#scrollSpeed"),
      configRefreshSeconds: document.querySelector("#configRefreshSeconds"),
      airlineColor: document.querySelector("#airlineColor"),
      routeColor: document.querySelector("#routeColor"),
      aircraftColor: document.querySelector("#aircraftColor"),
      contextColor: document.querySelector("#contextColor"),
      progressColor: document.querySelector("#progressColor"),
      timetableHeaderColor: document.querySelector("#timetableHeaderColor"),
      timetableDataColor: document.querySelector("#timetableDataColor"),
      timetableNewTimeColor: document.querySelector("#timetableNewTimeColor"),
      timetableCanceledColor: document.querySelector("#timetableCanceledColor"),
      timezone: document.querySelector("#timezone"),
      nightEnabled: document.querySelector("#nightEnabled"),
      nightStart: document.querySelector("#nightStart"),
      nightEnd: document.querySelector("#nightEnd"),
      save: document.querySelector("#save"),
      locate: document.querySelector("#locate"),
      status: document.querySelector("#status"),
      refresh: document.querySelector("#refresh"),
      previewMeta: document.querySelector("#previewMeta"),
      flightList: document.querySelector("#flightList"),
      avinorRaw: document.querySelector("#avinorRaw"),
      emuSource: document.querySelector("#emuSource"),
      imageUpload: document.querySelector("#imageUpload"),
      ledCanvas: document.querySelector("#ledCanvas"),
      emuMeta: document.querySelector("#emuMeta")
    };

    let map;
    let marker;
    let circle;
    let uploadedImage = null;
    let displayFlights = [];
    let idleScreens = [];
    let currentFlightIndex = 0;
    let currentIdleScreenIndex = 0;
    let flightCycleTimer = null;
    let flightCycleStartedAt = performance.now();
    let tickerAnimationFrame = null;
    let tickerStartedAt = performance.now();
    let formIsDirty = false;
    const logoCache = new Map();

    init();

    async function init() {
      const res = await fetch("/api/config");
      const config = await res.json();
      setForm(config);
      map = L.map("map").setView([config.lat, config.lon], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);
      marker = L.marker([config.lat, config.lon], { draggable: true }).addTo(map);
      circle = L.circle([config.lat, config.lon], { radius: config.radiusKm * 1000 }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        els.lat.value = pos.lat.toFixed(6);
        els.lon.value = pos.lng.toFixed(6);
        markDirty();
        redraw();
      });
      map.on("click", (event) => {
        els.lat.value = event.latlng.lat.toFixed(6);
        els.lon.value = event.latlng.lng.toFixed(6);
        markDirty();
        redraw();
      });
      ["lat", "lon", "radius"].forEach((id) => els[id].addEventListener("input", redraw));
      document.querySelectorAll("aside input").forEach((input) => {
        input.addEventListener("input", markDirty);
        input.addEventListener("change", markDirty);
      });
      renderEmulator();
    }

    function markDirty() {
      formIsDirty = true;
      els.status.className = "status dirty";
      els.status.textContent = "Endringer ikke lagret";
    }

    function setForm(config) {
      const device = config.device || {};
      const night = device.nightMode || {};
      els.label.value = config.label || "";
      els.lat.value = Number(config.lat).toFixed(6);
      els.lon.value = Number(config.lon).toFixed(6);
      els.radius.value = config.radiusKm || 10;
      els.homeAirport.value = config.homeAirportIata || "OSL";
      els.deviceEnabled.checked = device.enabled !== false;
      els.deviceBrightness.value = device.brightness ?? 80;
      els.nightBrightness.value = night.brightness ?? 0;
      els.pollSeconds.value = device.pollSeconds ?? 90;
      els.cycleSeconds.value = device.displayCycleSeconds ?? 5;
      els.timetableCycleSeconds.value = device.timetableCycleSeconds ?? 7;
      els.timetableScrollSpeed.value = device.timetableScrollPixelsPerSecond ?? 18;
      els.scrollSpeed.value = device.scrollPixelsPerSecond ?? 9;
      els.configRefreshSeconds.value = device.configRefreshSeconds ?? 300;
      const colors = device.lineColors || {};
      els.airlineColor.value = colors.airline || "#f4f7ff";
      els.routeColor.value = colors.route || "#f4f7ff";
      els.aircraftColor.value = colors.aircraft || "#f4f7ff";
      els.contextColor.value = colors.context || "#f4f7ff";
      els.progressColor.value = colors.progress || "#f7b500";
      const timetableColors = device.timetableColors || {};
      els.timetableHeaderColor.value = timetableColors.header || "#f7b500";
      els.timetableDataColor.value = timetableColors.data || "#f4f7ff";
      els.timetableNewTimeColor.value = timetableColors.newTime || "#f7b500";
      els.timetableCanceledColor.value = timetableColors.canceled || "#ff3b30";
      els.timezone.value = device.timezone || "Europe/Oslo";
      els.nightEnabled.checked = night.enabled !== false;
      els.nightStart.value = night.start || "23:00";
      els.nightEnd.value = night.end || "07:00";
    }

    function readForm() {
      return {
        label: els.label.value.trim(),
        lat: Number(els.lat.value),
        lon: Number(els.lon.value),
        radiusKm: Number(els.radius.value),
        homeAirportIata: els.homeAirport.value.trim().toUpperCase(),
        device: {
          enabled: els.deviceEnabled.checked,
          brightness: Number(els.deviceBrightness.value),
          pollSeconds: Number(els.pollSeconds.value),
          displayCycleSeconds: Number(els.cycleSeconds.value),
          timetableCycleSeconds: Number(els.timetableCycleSeconds.value),
          timetableScrollPixelsPerSecond: Number(els.timetableScrollSpeed.value),
          scrollPixelsPerSecond: Number(els.scrollSpeed.value),
          configRefreshSeconds: Number(els.configRefreshSeconds.value),
          timezone: els.timezone.value.trim(),
          lineColors: {
            airline: els.airlineColor.value,
            route: els.routeColor.value,
            aircraft: els.aircraftColor.value,
            context: els.contextColor.value,
            progress: els.progressColor.value
          },
          timetableColors: {
            header: els.timetableHeaderColor.value,
            data: els.timetableDataColor.value,
            newTime: els.timetableNewTimeColor.value,
            canceled: els.timetableCanceledColor.value
          },
          nightMode: {
            enabled: els.nightEnabled.checked,
            start: els.nightStart.value,
            end: els.nightEnd.value,
            brightness: Number(els.nightBrightness.value)
          }
        }
      };
    }

    function redraw() {
      const config = readForm();
      if (!Number.isFinite(config.lat) || !Number.isFinite(config.lon) || !Number.isFinite(config.radiusKm)) return;
      const latlng = [config.lat, config.lon];
      marker.setLatLng(latlng);
      circle.setLatLng(latlng);
      circle.setRadius(config.radiusKm * 1000);
    }

    els.save.addEventListener("click", async () => {
      els.status.className = "status";
      els.status.textContent = "Lagrer...";
      const headers = { "Content-Type": "application/json" };
      const res = await fetch("/api/config", {
        method: "POST",
        headers,
        body: JSON.stringify(readForm())
      });
      const json = await res.json();
      if (!res.ok) {
        els.status.className = "status error";
        els.status.textContent = json.error || "Kunne ikke lagre";
        return;
      }
      setForm(json);
      redraw();
      formIsDirty = false;
      els.status.className = "status";
      els.status.textContent = "Lagret " + new Date().toLocaleTimeString();
      renderEmulator();
    });

    els.locate.addEventListener("click", () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((position) => {
        els.lat.value = position.coords.latitude.toFixed(6);
        els.lon.value = position.coords.longitude.toFixed(6);
        markDirty();
        redraw();
        map.setView([Number(els.lat.value), Number(els.lon.value)], 12);
      });
    });

    els.refresh.addEventListener("click", loadPreview);
    els.emuSource.addEventListener("change", () => {
      resetFlightCycle();
      renderEmulator();
    });
    els.imageUpload.addEventListener("change", handleImageUpload);
    [
      els.deviceBrightness,
      els.scrollSpeed,
      els.timetableScrollSpeed,
      els.airlineColor,
      els.routeColor,
      els.aircraftColor,
      els.contextColor,
      els.progressColor,
      els.timetableHeaderColor,
      els.timetableDataColor,
      els.timetableNewTimeColor,
      els.timetableCanceledColor
    ].forEach((input) => input.addEventListener("input", () => {
      renderEmulator();
    }));
    els.cycleSeconds.addEventListener("input", () => {
      resetFlightCycle();
      renderEmulator();
    });
    els.timetableCycleSeconds.addEventListener("input", () => {
      resetFlightCycle();
      renderEmulator();
    });

    async function loadPreview() {
      els.previewMeta.textContent = "Henter...";
      els.flightList.innerHTML = "";
      els.avinorRaw.innerHTML = "";
      try {
        const [res, avinorRes] = await Promise.all([
          fetch("/api/display?ts=" + Date.now()),
          fetch("/api/avinor-board?ts=" + Date.now())
        ]);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Kunne ikke hente display-data");
        const avinorData = await avinorRes.json();
        if (avinorRes.ok) {
          renderAvinorRaw(avinorData);
        }
        const flights = Array.isArray(data.flights) ? data.flights : [];
        idleScreens = Array.isArray(data.idleScreens) ? data.idleScreens : [];
        displayFlights = flights;
        currentFlightIndex = 0;
        currentIdleScreenIndex = 0;
        resetFlightCycle();
        renderEmulator();
        els.previewMeta.textContent = "Oppdatert " + new Date(data.updatedAt).toLocaleTimeString() + " · " + flights.length + " treff";
        if (!flights.length) {
          if (idleScreens.length) {
            els.flightList.innerHTML = idleScreens.map((screen) => {
              const rows = Array.isArray(screen.rows) ? screen.rows : [];
              return '<article class="flight"><strong>' + escapeHtml(screen.title || "Airport") + '</strong><span>' + rows.map(formatIdleRow).map(escapeHtml).join("<br>") + '</span></article>';
            }).join("");
          } else {
            els.flightList.innerHTML = '<div class="empty">Ingen fly i valgt radius akkurat nå, eller FR24/Avinor svarte uten matchende data.</div>';
          }
          return;
        }
        els.flightList.innerHTML = flights.map((flight) => {
          const title = escapeHtml(flight.flt || flight.cs || flight.reg || "Flight");
          const route = [flight.from, flight.to].filter(Boolean).join(" → ");
          const line = [
            flight.air,
            flight.ac,
            route,
            [flight.ctxLabel, flight.ctxValue].filter(Boolean).join(" "),
            flight.alt ? flight.alt + " ft" : ""
          ].filter(Boolean).join(" · ");
        const logo = flight.logoUrl
            ? '<img class="flight-logo" src="' + escapeHtml(flight.logoUrl) + '" alt="" onerror="this.onerror=null;this.src=\\'/logos/UNKNOWN.png\\'">'
            : '<div class="flight-logo missing"></div>';
          return '<article class="flight"><div class="flight-row">' + logo + '<div><strong>' + title + '</strong><span>' + escapeHtml(line) + '</span></div></div></article>';
        }).join("");
      } catch (error) {
        els.previewMeta.textContent = "";
        els.flightList.innerHTML = '<div class="empty error">' + escapeHtml(error.message || "Ukjent feil") + '</div>';
      }
    }

    function renderAvinorRaw(data) {
      const departures = Array.isArray(data.departures) ? data.departures : [];
      const arrivals = Array.isArray(data.arrivals) ? data.arrivals : [];
      const parts = [
        renderRawGroup("Avinor departures raw", departures),
        renderRawGroup("Avinor arrivals raw", arrivals)
      ].filter(Boolean);
      els.avinorRaw.innerHTML = parts.join("");
    }

    function renderRawGroup(title, rows) {
      if (!rows.length) return "";
      return '<h3>' + escapeHtml(title) + '</h3>' + rows.slice(0, 8).map(renderRawFlight).join("");
    }

    function renderRawFlight(row, index) {
      const resolved = row && row.resolved ? row.resolved : {};
      const fields = row && row.fields ? row.fields : {};
      const status = row && row.status ? row.status : {};
      const title = [
        resolved.flightId || fields.flight_id || "Flight " + (index + 1),
        resolved.airportName || fields.airport,
        resolved.displayTime || fields.schedule_time
      ].filter(Boolean).join(" · ");
      const subtitle = [
        resolved.airlineName || resolved.airlineCode,
        resolved.status,
        resolved.gate ? "Gate " + resolved.gate : "",
        resolved.gateMessage || ""
      ].filter(Boolean).join(" · ");
      const values = {
        direction: row.direction || "",
        ...prefixObject("resolved.", resolved),
        ...prefixObject("status.", status),
        ...prefixObject("xml.", fields)
      };
      const fieldsHtml = Object.entries(values)
        .filter((entry) => entry[1] !== undefined && entry[1] !== null && entry[1] !== "")
        .map(([key, value]) => '<dt>' + escapeHtml(key) + '</dt><dd>' + escapeHtml(value) + '</dd>')
        .join("");
      return '<details class="raw-card"><summary>' + escapeHtml(title) + '<span>' + escapeHtml(subtitle || "Raw Avinor fields") + '</span></summary><dl class="field-grid">' + fieldsHtml + '</dl></details>';
    }

    function prefixObject(prefix, value) {
      const output = {};
      if (!value || typeof value !== "object") return output;
      Object.entries(value).forEach(([key, val]) => {
        output[prefix + key] = val;
      });
      return output;
    }

    function formatIdleRow(row) {
      if (!row || typeof row !== "object") return "";
      const gate = row.gate ? "Gate " + row.gate : "";
      const status = row.gateMessage || (row.status && row.status !== "scheduled" ? row.status : "");
      return [row.flightId, row.airport, gate, row.time, status].filter(Boolean).join(" · ");
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char]));
    }

    function handleImageUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        uploadedImage = image;
        els.emuSource.value = "upload";
        resetFlightCycle();
        renderEmulator();
      };
      image.src = url;
    }

    function renderEmulator() {
      const canvas = els.ledCanvas;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const source = document.createElement("canvas");
      source.width = 128;
      source.height = 64;
      const sourceCtx = source.getContext("2d", { willReadFrequently: true });
      sourceCtx.imageSmoothingEnabled = false;
      sourceCtx.fillStyle = "#000";
      sourceCtx.fillRect(0, 0, source.width, source.height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (els.emuSource.value === "live") {
        const flight = displayFlights[currentFlightIndex] || displayFlights[0];
        if (flight) {
          drawLiveFlightLayout(sourceCtx, flight);
          drawFlightProgress(sourceCtx);
        } else {
          drawIdleLayout(sourceCtx, idleScreens[currentIdleScreenIndex] || idleScreens[0]);
        }
        applyDisplayBrightness(sourceCtx);
        drawLedPanel(ctx, source);
        if (flight && flight.logoUrl) loadLogoForFlight(flight);
        return;
      }

      if (!uploadedImage) {
        drawPlaceholder(sourceCtx);
        applyDisplayBrightness(sourceCtx);
        drawLedPanel(ctx, source);
        return;
      }

      const logoCanvas = document.createElement("canvas");
      logoCanvas.width = 42;
      logoCanvas.height = 42;
      const logoCtx = logoCanvas.getContext("2d", { willReadFrequently: true });
      logoCtx.imageSmoothingEnabled = false;
      logoCtx.fillStyle = "#000";
      logoCtx.fillRect(0, 0, logoCanvas.width, logoCanvas.height);
      logoCtx.drawImage(uploadedImage, 0, 0, uploadedImage.naturalWidth, uploadedImage.naturalHeight, 0, 0, 42, 42);
      sourceCtx.fillStyle = "#000";
      sourceCtx.fillRect(0, 0, 128, 64);
      sourceCtx.drawImage(logoCanvas, 3, 3);
      drawDisplayText(sourceCtx, {
        airline: "Alaska",
        route: "PDX-LAX",
        aircraft: "737 MAX 9",
        context: "Arriving from Portland Intl"
      });
      applyDisplayBrightness(sourceCtx);
      drawLedPanel(ctx, source);
      els.emuMeta.textContent = uploadedImage.naturalWidth + " x " + uploadedImage.naturalHeight + " px → 42 x 42 logo field · 128 x 64 LEDs · brightness " + Math.round(getDisplayBrightnessFactor() * 100) + "%";
    }

    function getDisplayBrightnessFactor() {
      return Math.max(0, Math.min(1, Number(els.deviceBrightness.value || 80) / 100));
    }

    function applyDisplayBrightness(ctx) {
      const brightness = getDisplayBrightnessFactor();
      const imageData = ctx.getImageData(0, 0, 128, 64);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.round(data[i] * brightness);
        data[i + 1] = Math.round(data[i + 1] * brightness);
        data[i + 2] = Math.round(data[i + 2] * brightness);
      }
      ctx.putImageData(imageData, 0, 0);
    }

    function resetFlightCycle() {
      if (flightCycleTimer) {
        clearInterval(flightCycleTimer);
        flightCycleTimer = null;
      }
      tickerStartedAt = performance.now();
      flightCycleStartedAt = performance.now();
      if (els.emuSource.value !== "live") return;
      const flightCycleMs = Math.max(2000, Number(els.cycleSeconds.value || 5) * 1000);
      const timetableCycleMs = getTimetableCycleMs();
      if (displayFlights.length <= 1 && (displayFlights.length || idleScreens.length <= 1)) return;
      flightCycleTimer = setInterval(() => {
        if (els.emuSource.value !== "live") return;
        if (displayFlights.length > 1) {
          currentFlightIndex = (currentFlightIndex + 1) % displayFlights.length;
        } else if (!displayFlights.length && idleScreens.length > 1) {
          currentIdleScreenIndex = (currentIdleScreenIndex + 1) % idleScreens.length;
        }
        flightCycleStartedAt = performance.now();
        tickerStartedAt = performance.now();
        renderEmulator();
      }, displayFlights.length ? flightCycleMs : timetableCycleMs);
    }

    function drawPlaceholder(ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 128, 64);
      drawPlaceholderLogo(ctx, 3, 3, 42);
      drawDisplayText(ctx, {
        airline: "Alaska",
        route: "PDX-LAX",
        aircraft: "737 MAX 9",
        context: "Arriving from Portland Intl"
      });
      els.emuMeta.textContent = "Ingen bilde lastet opp. Viser 128 x 64 runde LEDs med P2.5 pitch.";
    }

    function drawLiveFlightLayout(ctx, flight) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 128, 64);

      if (!flight) {
        drawIdleLayout(ctx, idleScreens[currentIdleScreenIndex] || idleScreens[0]);
        return;
      }

      const logo = flight.logoUrl ? logoCache.get(flight.logoUrl) : null;
      if (logo) {
        ctx.drawImage(logo, 3, 3, 42, 42);
      } else {
        drawPlaceholderLogo(ctx, 3, 3, 42);
      }
      const airline = (flight.lines && flight.lines.airline) || flight.air || flight.airCode || "";
      const route = (flight.lines && flight.lines.route) || [flight.from, flight.to].filter(Boolean).join("-");
      const aircraft = (flight.lines && flight.lines.aircraft) || flight.ac || flight.reg || "";
      const context = (flight.lines && flight.lines.context) || [flight.ctxLabel, flight.ctxValue].filter(Boolean).join(" ");

      drawDisplayText(ctx, {
        airline,
        route: route || flight.flt || flight.cs || "",
        aircraft,
        context
      });
      els.emuMeta.textContent = "Live layout: " + (flight.flt || flight.cs || route || "flight") + " · 128 x 64 LEDs · 320 x 160 mm · P2.5 pitch.";
    }

    function drawIdleLayout(ctx, screen) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 128, 64);
      const colors = getTimetableColors();
      if (!screen) {
        drawDotText(ctx, "No flights", 3, 9, colors.header, { maxWidth: 122 });
        drawDotText(ctx, "No airport data", 3, 23, colors.data, { maxWidth: 122 });
        els.emuMeta.textContent = "Idle layout: ingen flydata tilgjengelig.";
        return;
      }
      ensureTickerAnimation();
      const title = screen.title || "AIRPORT";
      drawAirportBoardIcon(ctx, screen.kind, 3, 3, colors.header);
      drawDotText(ctx, title, 23, 3, colors.header, { maxWidth: 102 });
      ctx.fillStyle = colors.header;
      ctx.fillRect(3, 14, 122, 1);
      const transition = getTimetableTransition(screen);
      drawIdleRowsClipped(ctx, screen.kind, Array.isArray(screen.rows) ? screen.rows : [], 20 - transition.offset);
      if (transition.nextScreen) {
        drawIdleRowsClipped(ctx, transition.nextScreen.kind, Array.isArray(transition.nextScreen.rows) ? transition.nextScreen.rows : [], 64 - transition.offset);
      }
      const rows = Array.isArray(screen.rows) ? screen.rows.slice(0, 4) : [];
      if (!rows.length) drawDotText(ctx, "No airport data", 3, 28, colors.data, { maxWidth: 122 });
      els.emuMeta.textContent = "Idle layout: " + title + " · airport board.";
    }

    function drawIdleRowsClipped(ctx, kind, rows, y) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 15, 128, 49);
      ctx.clip();
      rows.slice(0, 4).forEach((row, index) => drawIdleRow(ctx, kind, row, 3, y + index * 11));
      ctx.restore();
    }

    function getTimetableTransition(screen) {
      if (els.emuSource.value !== "live" || displayFlights.length || idleScreens.length <= 1) return { offset: 0, nextScreen: null };
      const nextScreen = idleScreens[(currentIdleScreenIndex + 1) % idleScreens.length];
      if (!screen || !nextScreen || screen.kind !== nextScreen.kind) return { offset: 0, nextScreen: null };
      const rowTravel = 44;
      const cycleMs = getTimetableCycleMs();
      const speed = Math.max(4, Number(els.timetableScrollSpeed.value || 18));
      const transitionMs = Math.min(cycleMs * 0.75, Math.max(400, (rowTravel / speed) * 1000));
      const elapsed = Math.max(0, performance.now() - flightCycleStartedAt);
      const transitionStart = Math.max(0, cycleMs - transitionMs);
      if (elapsed < transitionStart) return { offset: 0, nextScreen: null };
      const progress = Math.min(1, (elapsed - transitionStart) / transitionMs);
      return { offset: Math.round(rowTravel * easeInOut(progress)), nextScreen };
    }

    function getTimetableCycleMs() {
      return Math.max(2000, Number(els.timetableCycleSeconds.value || 7) * 1000);
    }

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function drawIdleRow(ctx, kind, row, x, y) {
      const colors = getTimetableColors();
      const status = row && row.status ? row.status : "scheduled";
      const gateBlinkOn = Math.floor(performance.now() / 1200) % 2 === 0;
      const gateText = kind === "departures" && row.gate ? row.gate : "";
      const airportText = kind === "departures" && gateText && !gateBlinkOn ? gateText : row.airport || "";
      const timeColor = status === "canceled" ? colors.canceled : status === "newTime" ? colors.newTime : colors.data;
      const rowColor = status === "canceled" ? colors.canceled : colors.data;
      drawDotText(ctx, row.flightId || "", x, y, rowColor, { maxWidth: 43 });
      drawDotText(ctx, airportText, x + 48, y, rowColor, { maxWidth: 24 });
      drawDotTextRight(ctx, row.time || "", 125, y, timeColor, 48);
      if (status === "canceled") {
        ctx.fillStyle = colors.canceled;
        ctx.fillRect(x, y + 3, 122, 1);
      }
    }

    function drawAirportBoardIcon(ctx, kind, x, y, color) {
      const pattern = kind === "arrivals"
        ? [
            "00000011000000000",
            "00000011100000000",
            "00000010110000000",
            "00000010011000000",
            "11111111111110000",
            "00111111111111000",
            "00000010011000000",
            "00000011001100000",
            "00000000000110000"
          ]
        : [
            "00000000000110000",
            "00000011001100000",
            "00000010011000000",
            "00111111111111000",
            "11111111111110000",
            "00000010011000000",
            "00000010110000000",
            "00000011100000000",
            "00000011000000000"
          ];
      ctx.fillStyle = color;
      for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
          if (pattern[row][col] === "1") ctx.fillRect(x + col, y + row, 1, 1);
        }
      }
    }

    function getTimetableColors() {
      return {
        header: els.timetableHeaderColor.value || "#f7b500",
        data: els.timetableDataColor.value || "#f4f7ff",
        newTime: els.timetableNewTimeColor.value || "#f7b500",
        canceled: els.timetableCanceledColor.value || "#ff3b30"
      };
    }

    function getLineColors() {
      return {
        airline: els.airlineColor.value || "#f4f7ff",
        route: els.routeColor.value || "#f4f7ff",
        aircraft: els.aircraftColor.value || "#f4f7ff",
        context: els.contextColor.value || "#f4f7ff",
        progress: els.progressColor.value || "#f7b500"
      };
    }

    function drawDisplayText(ctx, lines) {
      const colors = getLineColors();
      drawDotText(ctx, lines.airline || "", 50, 5, colors.airline, { maxWidth: 75 });
      drawDotText(ctx, lines.route || "", 50, 19, colors.route, { maxWidth: 75 });
      drawDotText(ctx, lines.aircraft || "", 50, 33, colors.aircraft, { maxWidth: 75 });
      drawTickerLine(ctx, lines.context || "", 3, 52, colors.context, 122);
    }

    function drawFlightProgress(ctx) {
      if (els.emuSource.value !== "live" || displayFlights.length <= 1) return;
      ensureTickerAnimation();
      const cycleMs = Math.max(2000, Number(els.cycleSeconds.value || 5) * 1000);
      drawCycleProgress(ctx, cycleMs);
    }

    function drawCycleProgress(ctx, cycleMs) {
      const elapsed = Math.max(0, performance.now() - flightCycleStartedAt);
      const progress = Math.min(1, elapsed / cycleMs);
      const width = Math.max(1, Math.min(128, Math.round(128 * progress)));
      ctx.fillStyle = "#07101c";
      ctx.fillRect(0, 63, 128, 1);
      ctx.fillStyle = getLineColors().progress;
      ctx.fillRect(0, 63, width, 1);
    }

    function loadLogoForFlight(flight) {
      if (!flight.logoUrl || logoCache.has(flight.logoUrl)) return;
      const image = new Image();
      image.onload = () => {
        logoCache.set(flight.logoUrl, image);
        if (els.emuSource.value === "live") renderEmulator();
      };
      image.onerror = () => {
        if (image.src.endsWith("/logos/UNKNOWN.png")) {
          logoCache.set(flight.logoUrl, null);
          if (els.emuSource.value === "live") renderEmulator();
          return;
        }
        image.src = "/logos/UNKNOWN.png";
        image.onload = () => {
          logoCache.set(flight.logoUrl, image);
          if (els.emuSource.value === "live") renderEmulator();
        };
        image.onerror = () => {
          logoCache.set(flight.logoUrl, null);
          if (els.emuSource.value === "live") renderEmulator();
        };
      };
      image.src = flight.logoUrl;
    }

    function drawPlaceholderLogo(ctx, x, y, size) {
      const cx = x + Math.floor(size / 2);
      const cy = y + Math.floor(size / 2);
      const radius = Math.floor(size / 2);
      ctx.fillStyle = "#105ab7";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0d4a96";
      ctx.beginPath();
      ctx.arc(cx + 4, cy + 2, radius - 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f4f7ff";
      ctx.fillRect(x + 15, y + 13, 13, 2);
      ctx.fillRect(x + 12, y + 16, 18, 2);
      ctx.fillRect(x + 10, y + 19, 22, 2);
      ctx.fillRect(x + 13, y + 22, 16, 2);
      ctx.fillRect(x + 16, y + 25, 10, 2);
      ctx.fillStyle = "#8fc2ff";
      ctx.fillRect(x + 8, y + 31, 26, 2);
    }

    function drawLedPanel(ctx, sourceCanvas) {
      const panelW = ctx.canvas.width;
      const panelH = ctx.canvas.height;
      const cols = 128;
      const rows = 64;
      const pitchX = panelW / cols;
      const pitchY = panelH / rows;
      const radius = Math.min(pitchX, pitchY) * 0.27;
      const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
      const imageData = sourceCtx.getImageData(0, 0, cols, rows).data;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, panelW, panelH);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const index = (y * cols + x) * 4;
          const r = imageData[index];
          const g = imageData[index + 1];
          const b = imageData[index + 2];
          const a = imageData[index + 3] / 255;
          const cx = x * pitchX + pitchX / 2;
          const cy = y * pitchY + pitchY / 2;

          ctx.fillStyle = "#050607";
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          if (a > 0 && (r > 1 || g > 1 || b > 1)) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
            ctx.fill();
          }
        }
      }
    }

    function drawTickerLine(ctx, text, x, y, color, width) {
      if (!text) return;
      ensureTickerAnimation();
      const textWidth = measureDotText(text);
      const overflow = Math.max(0, textWidth - width);
      const offset = overflow > 0 ? getTickerOffset(overflow) : 0;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, 8);
      ctx.clip();
      drawDotText(ctx, text, x - offset, y, color, { maxWidth: textWidth });
      ctx.restore();
    }

    function ensureTickerAnimation() {
      if (tickerAnimationFrame) return;
      const tick = () => {
        tickerAnimationFrame = requestAnimationFrame(tick);
        if (els.emuSource.value === "live" || els.emuSource.value === "upload") {
          renderEmulator();
        }
      };
      tickerAnimationFrame = requestAnimationFrame(tick);
    }

    function getTickerOffset(overflow) {
      const holdMs = 900;
      const pxPerSecond = Math.max(2, Number(els.scrollSpeed.value || 9));
      const travelMs = Math.max(1200, (overflow / pxPerSecond) * 1000);
      const cycleMs = holdMs + travelMs + holdMs + travelMs;
      const t = (performance.now() - tickerStartedAt) % cycleMs;
      if (t < holdMs) return 0;
      if (t < holdMs + travelMs) return Math.round(((t - holdMs) / travelMs) * overflow);
      if (t < holdMs + travelMs + holdMs) return overflow;
      return Math.round((1 - ((t - holdMs - travelMs - holdMs) / travelMs)) * overflow);
    }

    function measureDotText(text) {
      return String(text || "").length * 6;
    }

    function drawDotTextRight(ctx, text, rightX, y, color, maxWidth) {
      const value = String(text || "");
      const width = Math.min(measureDotText(value), maxWidth);
      drawDotText(ctx, value, rightX - width, y, color, { maxWidth });
    }

    function drawDotText(ctx, text, x, y, color, options = {}) {
      const glyphs = {
        " ": ["00000","00000","00000","00000","00000","00000","00000"],
        "-": ["00000","00000","00000","11111","00000","00000","00000"],
        ".": ["00000","00000","00000","00000","00000","01100","01100"],
        ":": ["00000","01100","01100","00000","01100","01100","00000"],
        "0": ["01110","10001","10011","10101","11001","10001","01110"],
        "1": ["00100","01100","00100","00100","00100","00100","01110"],
        "2": ["01110","10001","00001","00010","00100","01000","11111"],
        "3": ["11110","00001","00001","01110","00001","00001","11110"],
        "4": ["00010","00110","01010","10010","11111","00010","00010"],
        "5": ["11111","10000","10000","11110","00001","00001","11110"],
        "6": ["01110","10000","10000","11110","10001","10001","01110"],
        "7": ["11111","00001","00010","00100","01000","01000","01000"],
        "8": ["01110","10001","10001","01110","10001","10001","01110"],
        "9": ["01110","10001","10001","01111","00001","00001","01110"],
        "A": ["01110","10001","10001","11111","10001","10001","10001"],
        "B": ["11110","10001","10001","11110","10001","10001","11110"],
        "C": ["01111","10000","10000","10000","10000","10000","01111"],
        "D": ["11110","10001","10001","10001","10001","10001","11110"],
        "E": ["11111","10000","10000","11110","10000","10000","11111"],
        "F": ["11111","10000","10000","11110","10000","10000","10000"],
        "G": ["01111","10000","10000","10011","10001","10001","01111"],
        "H": ["10001","10001","10001","11111","10001","10001","10001"],
        "I": ["11111","00100","00100","00100","00100","00100","11111"],
        "J": ["00111","00010","00010","00010","00010","10010","01100"],
        "K": ["10001","10010","10100","11000","10100","10010","10001"],
        "L": ["10000","10000","10000","10000","10000","10000","11111"],
        "M": ["10001","11011","10101","10101","10001","10001","10001"],
        "N": ["10001","11001","10101","10011","10001","10001","10001"],
        "O": ["01110","10001","10001","10001","10001","10001","01110"],
        "P": ["11110","10001","10001","11110","10000","10000","10000"],
        "Q": ["01110","10001","10001","10001","10101","10010","01101"],
        "R": ["11110","10001","10001","11110","10100","10010","10001"],
        "S": ["01111","10000","10000","01110","00001","00001","11110"],
        "T": ["11111","00100","00100","00100","00100","00100","00100"],
        "U": ["10001","10001","10001","10001","10001","10001","01110"],
        "V": ["10001","10001","10001","10001","10001","01010","00100"],
        "W": ["10001","10001","10001","10101","10101","10101","01010"],
        "X": ["10001","10001","01010","00100","01010","10001","10001"],
        "Y": ["10001","10001","01010","00100","00100","00100","00100"],
        "Z": ["11111","00001","00010","00100","01000","10000","11111"]
      };
      let cursor = x;
      const maxChars = typeof options === "number" ? options : options.maxChars || 999;
      const maxWidth = typeof options === "object" ? options.maxWidth || 999 : 999;
      ctx.fillStyle = color;
      for (const char of String(text || "").toUpperCase().slice(0, maxChars)) {
        const rows = glyphs[char] || glyphs[" "];
        if (cursor + rows[0].length > x + maxWidth) break;
        for (let row = 0; row < rows.length; row++) {
          for (let col = 0; col < rows[row].length; col++) {
            if (rows[row][col] === "1") ctx.fillRect(cursor + col, y + row, 1, 1);
          }
        }
        cursor += 6;
      }
    }

    renderEmulator();
  </script>
</body>
</html>`;
}

function isConfig(value: unknown): value is Config {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Config>;
  return Number.isFinite(v.lat) && Number.isFinite(v.lon) && Number.isFinite(v.radiusKm);
}

function boundsFromRadius(lat: number, lon: number, radiusKm: number): string {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(toRad(lat)));
  const north = clamp(lat + latDelta, -90, 90);
  const south = clamp(lat - latDelta, -90, 90);
  const west = clamp(lon - lonDelta, -180, 180);
  const east = clamp(lon + lonDelta, -180, 180);
  return `${round(north, 6)},${round(south, 6)},${round(west, 6)},${round(east, 6)}`;
}

function firstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function firstNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.asin(Math.sqrt(a));
}

function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...headers
    }
  });
}

function htmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
