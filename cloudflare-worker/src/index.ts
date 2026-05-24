export interface Env {
  FLIGHT_DISPLAY_KV: KVNamespace;
  AIRLINE_LOGOS?: R2Bucket;
  ASSETS: Fetcher;
  FR24_API_KEY: string;
  FR24_API_BASE_URL?: string;
  FR24_LIVE_ENDPOINT?: string;
  FR24_FOLLOW_ENDPOINT?: string;
  FR24_AIRLINE_ENDPOINT_TEMPLATE?: string;
  FR24_AIRPORT_ENDPOINT_TEMPLATE?: string;
  AVIATIONSTACK_API_KEY?: string;
  AVIATIONSTACK_API_BASE_URL?: string;
  OPENSKY_CLIENT_ID?: string;
  OPENSKY_CLIENT_SECRET?: string;
  OPENSKY_TOKEN_URL?: string;
  OPENSKY_BASE_URL?: string;
  HOME_AIRPORT_IATA?: string;
  DEFAULT_LAT?: string;
  DEFAULT_LON?: string;
  DEFAULT_RADIUS_KM?: string;
  CACHE_TTL_SECONDS?: string;
  DISPLAY_LIMIT?: string;
  AVINOR_XML_BASE_URL?: string;
  AVINOR_FLIGHTS_BASE_URL?: string;
  AVINOR_AIRPORT_NAMES_BASE_URL?: string;
  AVINOR_AIRLINE_NAMES_BASE_URL?: string;
  LOGO_BASE_URL?: string;
  GEOCODER_REVERSE_URL?: string;
  GEOCODER_SEARCH_URL?: string;
}

type Config = {
  lat: number;
  lon: number;
  radiusKm: number;
  homeAirportIata?: string;
  follow?: FollowSettings;
  label?: string;
  device?: DeviceSettings;
  updatedAt?: string;
};

type FollowSettings = {
  enabled: boolean;
  flights: string[];
};

type DeviceSettings = {
  enabled: boolean;
  airspaceMonitoringEnabled: boolean;
  liveDataSource: "fr24" | "opensky";
  brightness: number;
  pollSeconds: number;
  displayCycleSeconds: number;
  timetableCycleSeconds: number;
  timetableItemCount: number;
  avinorWindowHours: number;
  timetableScrollPixelsPerSecond: number;
  scrollPixelsPerSecond: number;
  configRefreshSeconds: number;
  timezone: string;
  followUnits: {
    altitude: "ft" | "fl" | "m" | "km" | "nmi";
    speed: "kn" | "mph" | "kmh" | "ms" | "mach";
    track: "deg" | "cardinal";
    verticalRate: "fpm" | "fts" | "ms" | "mph" | "kmh";
  };
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
  verticalRateFpm?: number;
  onGround?: boolean;
  distanceKm: number;
  bearingDeg: number;
  source?: "fr24" | "opensky" | "avinor" | "aviationstack";
  status?: string;
  gate?: string;
  gateMessage?: string;
  scheduledTime?: string;
  displayTime?: string;
  direction?: "A" | "D";
  departureScheduledTime?: string;
  departureDisplayTime?: string;
  arrivalScheduledTime?: string;
  arrivalDisplayTime?: string;
  locationLabel?: string;
  locationValue?: string;
  routeProgress?: number;
};

type LiveSourceStatus = {
  source: DeviceSettings["liveDataSource"];
  ok: boolean;
  error?: string;
};

type AvinorFlight = {
  flightId: string;
  airport: string;
  time: string;
  sortTime: number;
  status: "scheduled" | "newTime" | "canceled" | "done";
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

type AvinorApiResponse = {
  lastUpdated?: string;
  flightLegs?: AvinorApiFlightLeg[];
};

type AvinorApiFlightLeg = {
  id?: string;
  flightIds?: Array<{
    flightId?: string;
    unformattedFlightId?: string;
    airlineIata?: string;
    airlineName?: string;
  }>;
  departure?: {
    gate?: {
      gate?: string | null;
      status?: string | null;
      statusDescription?: string | null;
    };
    checkInZones?: string[];
    flightDepartureDate?: string;
    flightDepartureDateLocal?: string;
    isDepartured?: boolean;
    airportIata?: string;
    airportName?: string;
    statusCode?: string | null;
    statusCodeDescription?: string | null;
    statusTime?: string | null;
    statusTimeLocal?: string | null;
    isDelayed?: boolean;
  };
  arrival?: {
    belt?: {
      belt?: string | null;
      status?: string | null;
      statusDescription?: string | null;
      start?: string | null;
      startLocal?: string | null;
      stop?: string | null;
      stopLocal?: string | null;
    };
    flightArrivalDate?: string;
    flightArrivalDateLocal?: string;
    isArrived?: boolean;
    airportIata?: string;
    airportName?: string;
    statusCode?: string | null;
    statusCodeDescription?: string | null;
    statusTime?: string | null;
    statusTimeLocal?: string | null;
    isDelayed?: boolean;
  };
  flightStatus?: string;
  flightStatusTime?: string | null;
  flightStatusTimeLocal?: string | null;
  isDelayed?: boolean;
  isDomestic?: boolean;
};

type AviationstackFlight = {
  flight_date?: string;
  flight_status?: string;
  departure?: {
    airport?: string | null;
    timezone?: string | null;
    iata?: string | null;
    icao?: string | null;
    terminal?: string | null;
    gate?: string | null;
    scheduled?: string | null;
    estimated?: string | null;
    actual?: string | null;
  };
  arrival?: {
    airport?: string | null;
    timezone?: string | null;
    iata?: string | null;
    icao?: string | null;
    terminal?: string | null;
    gate?: string | null;
    scheduled?: string | null;
    estimated?: string | null;
    actual?: string | null;
  };
  airline?: {
    name?: string | null;
    iata?: string | null;
    icao?: string | null;
  };
  flight?: {
    number?: string | null;
    iata?: string | null;
    icao?: string | null;
  };
};

type IdleRow = {
  flightId: string;
  airport: string;
  time: string;
  status: "scheduled" | "newTime" | "canceled" | "done";
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
  AAL: "Aalborg",
  AAR: "Aarhus",
  AES: "Alesund",
  AGP: "Malaga",
  ALC: "Alicante",
  AMS: "Amsterdam",
  ARN: "Stockholm",
  BCN: "Barcelona",
  BGY: "Milan",
  BGO: "Bergen",
  BER: "Berlin",
  BLL: "Billund",
  BOO: "Bodo",
  BRS: "Bristol",
  BRU: "Brussels",
  CDG: "Paris",
  CIA: "Rome",
  CPH: "Copenhagen",
  DUB: "Dublin",
  DUS: "Dusseldorf",
  EDI: "Edinburgh",
  FCO: "Rome",
  FLL: "Fort Lauderdale",
  FRA: "Frankfurt",
  GDN: "Gdansk",
  GLA: "Glasgow",
  HEL: "Helsinki",
  HND: "Tokyo",
  JFK: "New York",
  KEF: "Reykjavik",
  LGA: "New York",
  LGW: "London",
  LHR: "London",
  LIS: "Lisbon",
  LTN: "London",
  MAN: "Manchester",
  MXP: "Milan",
  MUC: "Munich",
  NCE: "Nice",
  NRT: "Tokyo",
  OSL: "Oslo",
  ORY: "Paris",
  RRS: "Roros",
  STN: "London",
  SWF: "New York",
  SVG: "Stavanger",
  TRD: "Trondheim",
  TRF: "Oslo",
  VIE: "Vienna",
  WAW: "Warsaw"
};

const KNOWN_AIRPORT_COORDS: Record<string, { lat: number; lon: number }> = {
  AGP: { lat: 36.6749, lon: -4.4991 },
  AMS: { lat: 52.3105, lon: 4.7683 },
  ARN: { lat: 59.6498, lon: 17.9238 },
  BGO: { lat: 60.2934, lon: 5.2181 },
  CPH: { lat: 55.6181, lon: 12.6561 },
  CDG: { lat: 49.0097, lon: 2.5479 },
  DUB: { lat: 53.4213, lon: -6.2701 },
  FRA: { lat: 50.0379, lon: 8.5622 },
  LGW: { lat: 51.1537, lon: -0.1821 },
  LHR: { lat: 51.4700, lon: -0.4543 },
  LIS: { lat: 38.7742, lon: -9.1342 },
  OSL: { lat: 60.1976, lon: 11.1004 },
  TRD: { lat: 63.4578, lon: 10.9240 },
  SVG: { lat: 58.8768, lon: 5.6379 }
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
      if (url.pathname === "/api/config" && request.method === "GET") return configResponse(env);
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

async function configResponse(env: Env): Promise<Response> {
  const [config, aviationstackApiKey] = await Promise.all([
    getConfig(env),
    getAviationstackApiKey(env)
  ]);
  return jsonResponse({
    ...config,
    aviationstackApiKeyConfigured: Boolean(aviationstackApiKey)
  }, 200, { "Cache-Control": "no-store" });
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
    follow: normalizeFollowSettings((body as { follow?: unknown }).follow),
    label: typeof body.label === "string" ? body.label.slice(0, 80) : undefined,
    device: normalizeDeviceSettings(body.device),
    updatedAt: new Date().toISOString()
  };

  await env.FLIGHT_DISPLAY_KV.put(CONFIG_KEY, JSON.stringify(config));
  return configResponse(env);
}

async function deviceConfigResponse(env: Env): Promise<Response> {
  const config = await getConfig(env);
  return jsonResponse({
    updatedAt: config.updatedAt || null,
    homeAirportIata: config.homeAirportIata,
    follow: config.follow,
    device: config.device
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function avinorBoardResponse(env: Env): Promise<Response> {
  const config = await getConfig(env);
  const airport = normalizeAirportCode(config.homeAirportIata, env.HOME_AIRPORT_IATA || "OSL");
  const timezone = config.device?.timezone || "Europe/Oslo";
  const [rawDepartures, rawArrivals] = await Promise.all([
    getAvinorRawFlights(env, airport, "D", timezone),
    getAvinorRawFlights(env, airport, "A", timezone)
  ]);
  const departures = filterAvinorRawFlights(rawDepartures, "D", config);
  const arrivals = filterAvinorRawFlights(rawArrivals, "A", config);

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

function filterAvinorRawFlights(flights: AvinorRawFlight[], direction: "A" | "D", config: Config): AvinorRawFlight[] {
  const now = Date.now();
  const windowHours = config.device?.avinorWindowHours || 4;
  const limit = config.device?.timetableItemCount || 8;
  const doneStatus = direction === "D" ? "D" : "A";
  return flights
    .filter((flight) => {
      const bestTime = avinorRelevantTime(flight);
      const timestamp = Date.parse(bestTime || "");
      if (!Number.isFinite(timestamp)) return false;
      if (direction === "D" && (flight.status?.code === doneStatus || flight.resolved.status === "done")) return false;
      if (timestamp < now - 10 * 60 * 1000) return false;
      if (timestamp > now + windowHours * 60 * 60 * 1000) return false;
      return true;
    })
    .sort((a, b) => Date.parse(avinorRelevantTime(a) || "") - Date.parse(avinorRelevantTime(b) || ""))
    .slice(0, limit);
}

function avinorRelevantTime(flight: AvinorRawFlight): string {
  const code = flight.status?.code || "";
  if (["A", "D", "E"].includes(code) && flight.status?.time) return flight.status.time;
  return flight.fields.schedule_time || flight.resolved.scheduledTime || "";
}

async function logoAssetResponse(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const filename = url.pathname.split("/").pop() || "";
  if (!/^[A-Za-z0-9_-]+\.png$/.test(filename)) {
    return env.ASSETS.fetch(request);
  }

  if (env.AIRLINE_LOGOS) {
    const logoObject = await getLogoObject(env.AIRLINE_LOGOS, filename);
    if (logoObject) {
      const { key, object } = logoObject;
      return new Response(object.body, {
        status: 200,
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "image/png",
          "Cache-Control": "public, max-age=3600",
          "X-Logo-Source": "r2",
          "X-Logo-Key": key
        }
      });
    }
  }

  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.status !== 404 || !env.LOGO_BASE_URL) return assetResponse;

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

async function getLogoObject(bucket: R2Bucket, filename: string): Promise<{ key: string; object: R2ObjectBody } | undefined> {
  const dotIndex = filename.lastIndexOf(".");
  const code = (dotIndex >= 0 ? filename.slice(0, dotIndex) : filename).trim();
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return undefined;

  const variants = [
    `${code.toUpperCase()}.PNG`,
    `${code.toUpperCase()}.png`,
    `${code}.png`,
    `${code}.PNG`,
    `${code.toLowerCase()}.png`,
    `logos/${code.toUpperCase()}.PNG`,
    `logos/${code.toUpperCase()}.png`,
    `logos/${code}.png`,
    `airline-logos/${code.toUpperCase()}.PNG`,
    `airline-logos/${code.toUpperCase()}.png`,
    `airline-logos/${code}.png`
  ];

  for (const key of Array.from(new Set(variants))) {
    const object = await bucket.get(key);
    if (object) return { key, object };
  }
  return undefined;
}

function withConfigDefaults(config: Config, env: Env): Config {
  return {
    ...config,
    homeAirportIata: normalizeAirportCode(config.homeAirportIata, env.HOME_AIRPORT_IATA || "OSL"),
    follow: normalizeFollowSettings(config.follow),
    device: normalizeDeviceSettings(config.device)
  };
}

function normalizeFollowSettings(value: unknown): FollowSettings {
  const v = value && typeof value === "object" ? value as Partial<FollowSettings> : {};
  const flights = Array.isArray(v.flights)
    ? v.flights
        .map(normalizeFollowToken)
        .filter((token): token is string => Boolean(token))
        .slice(0, 3)
    : [];
  return {
    enabled: typeof v.enabled === "boolean" ? v.enabled : false,
    flights
  };
}

function normalizeFollowToken(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const token = value.trim().toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9-]{2,12}$/.test(token) ? token : undefined;
}

function normalizeDeviceSettings(value: unknown): DeviceSettings {
  const v = value && typeof value === "object" ? value as Partial<DeviceSettings> : {};
  const night = v.nightMode && typeof v.nightMode === "object" ? v.nightMode as Partial<DeviceSettings["nightMode"]> : {};
  return {
    enabled: typeof v.enabled === "boolean" ? v.enabled : true,
    airspaceMonitoringEnabled: typeof (v as { airspaceMonitoringEnabled?: unknown }).airspaceMonitoringEnabled === "boolean"
      ? Boolean((v as { airspaceMonitoringEnabled?: unknown }).airspaceMonitoringEnabled)
      : true,
    liveDataSource: oneOf((v as { liveDataSource?: unknown }).liveDataSource, ["fr24", "opensky"], "fr24"),
    brightness: clampNumber(v.brightness, 1, 100, 80),
    pollSeconds: clampNumber(v.pollSeconds, 30, 900, 90),
    displayCycleSeconds: clampNumber(v.displayCycleSeconds, 2, 30, 5),
    timetableCycleSeconds: clampNumber((v as { timetableCycleSeconds?: unknown }).timetableCycleSeconds, 2, 60, 7),
    timetableItemCount: clampNumber((v as { timetableItemCount?: unknown }).timetableItemCount, 4, 40, 8),
    avinorWindowHours: clampNumber((v as { avinorWindowHours?: unknown }).avinorWindowHours, 1, 24, 4),
    timetableScrollPixelsPerSecond: clampNumber((v as { timetableScrollPixelsPerSecond?: unknown }).timetableScrollPixelsPerSecond, 4, 40, 18),
    scrollPixelsPerSecond: clampNumber(v.scrollPixelsPerSecond, 2, 30, 9),
    configRefreshSeconds: clampNumber(v.configRefreshSeconds, 60, 3600, 300),
    timezone: typeof v.timezone === "string" && v.timezone.trim() ? v.timezone.slice(0, 64) : "Europe/Oslo",
    followUnits: normalizeFollowUnits((v as { followUnits?: unknown }).followUnits),
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

function normalizeFollowUnits(value: unknown): DeviceSettings["followUnits"] {
  const v = value && typeof value === "object" ? value as Partial<DeviceSettings["followUnits"]> : {};
  return {
    altitude: oneOf(v.altitude, ["ft", "fl", "m", "km", "nmi"], "ft"),
    speed: oneOf(v.speed, ["kn", "mph", "kmh", "ms", "mach"], "kn"),
    track: oneOf(v.track, ["deg", "cardinal"], "deg"),
    verticalRate: oneOf(v.verticalRate, ["fpm", "fts", "ms", "mph", "kmh"], "fpm")
  };
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? value as T : fallback;
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
  const limit = config.device?.timetableItemCount || 8;
  const [departures, arrivals] = await Promise.all([
    getAvinorFlights(env, airport, "D", config),
    getAvinorFlights(env, airport, "A", config)
  ]);

  return [
    ...toIdleScreens("DEPARTURES", "departures", departures.slice(0, limit)),
    ...toIdleScreens("ARRIVALS", "arrivals", arrivals.slice(0, limit))
  ];
}

function toIdleScreens(title: IdleScreen["title"], kind: IdleScreen["kind"], flights: AvinorFlight[]): IdleScreen[] {
  const rows = flights.map(toIdleRow);
  const pages: IdleRow[][] = [];
  for (let index = 0; index < rows.length; index += 4) {
    pages.push(rows.slice(index, index + 4));
  }
  return (pages.length ? pages : [[]]).map((pageRows) => ({
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

async function getAvinorFlights(env: Env, airport: string, direction: "A" | "D", config: Config): Promise<AvinorFlight[]> {
  const timezone = config.device?.timezone || "Europe/Oslo";
  const windowHours = config.device?.avinorWindowHours || 4;
  const itemCount = config.device?.timetableItemCount || 8;
  const cacheKey = `avinor:board:v3:${airport}:${direction}:${windowHours}:${itemCount}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (Array.isArray(cached)) return cached as AvinorFlight[];

  const rawFlights = await getAvinorRawFlights(env, airport, direction, timezone);
  const doneStatus = direction === "D" ? "D" : "A";
  const now = Date.now();
  const flights = rawFlights
    .map((raw): AvinorFlight | null => {
      const flightId = raw.resolved.flightId;
      const airportCode = raw.resolved.airportCode || "";
      const bestTime = avinorRelevantTime(raw);
      const timestamp = Date.parse(bestTime || "");
      if (!flightId || !airportCode || !Number.isFinite(timestamp)) return null;
      if (direction === "D" && raw.status?.code === doneStatus) return null;
      if (timestamp < now - 10 * 60 * 1000) return null;
      if (timestamp > now + windowHours * 60 * 60 * 1000) return null;
      return {
        flightId,
        airport: airportCode,
        time: formatLocalTime(bestTime || raw.fields.schedule_time || "", timezone),
        sortTime: timestamp,
        status: raw.resolved.status === "canceled" ? "canceled" : raw.resolved.status === "newTime" ? "newTime" : raw.resolved.status === "done" ? "done" : "scheduled",
        ...(raw.resolved.gate ? { gate: raw.resolved.gate } : {}),
        ...(raw.resolved.gateMessage ? { gateMessage: raw.resolved.gateMessage } : {})
      };
    })
    .filter((flight): flight is AvinorFlight => Boolean(flight))
    .sort((a, b) => a.sortTime - b.sortTime)
    .slice(0, itemCount);

  await env.FLIGHT_DISPLAY_KV.put(cacheKey, JSON.stringify(flights), { expirationTtl: 180 });
  return flights;
}

async function getAvinorRawFlights(env: Env, airport: string, direction: "A" | "D", timezone: string): Promise<AvinorRawFlight[]> {
  const cacheKey = `avinor:raw:v2:${airport}:${direction}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (Array.isArray(cached)) return cached as AvinorRawFlight[];

  const directionPath = direction === "D" ? "departure" : "arrival";
  const baseUrl = env.AVINOR_FLIGHTS_BASE_URL || "https://www.avinor.no/api/v1/flights";
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/${directionPath}/${airport}`);
  url.searchParams.set("dateTime", localDateString(new Date(), timezone));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
  });
  if (!response.ok) return [];

  const json = await response.json() as AvinorApiResponse;
  const flights = parseAvinorApiFlights(json, direction);
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

function parseAvinorApiFlights(json: AvinorApiResponse, direction: "A" | "D"): AvinorRawFlight[] {
  const legs = Array.isArray(json.flightLegs) ? json.flightLegs : [];
  return legs.map((leg): AvinorRawFlight => {
    const primaryFlight = Array.isArray(leg.flightIds) ? leg.flightIds[0] : undefined;
    const flightId = primaryFlight?.flightId || primaryFlight?.unformattedFlightId || "";
    const airlineCode = (primaryFlight?.airlineIata || airlineIataFromFlightNumber(flightId) || "").toUpperCase();
    const otherSide = direction === "D" ? leg.arrival : leg.departure;
    const ownSide = direction === "D" ? leg.departure : leg.arrival;
    const statusCode = ownSide?.statusCode || "";
    const statusTime = ownSide?.statusTime || "";
    const statusTimeLocal = ownSide?.statusTimeLocal || "";
    const scheduledTime = direction === "D" ? leg.departure?.flightDepartureDate : leg.arrival?.flightArrivalDate;
    const scheduledTimeLocal = direction === "D" ? leg.departure?.flightDepartureDateLocal : leg.arrival?.flightArrivalDateLocal;
    const airportCode = otherSide?.airportIata?.toUpperCase() || "";
    const airportName = otherSide?.airportName || "";
    const gate = leg.departure?.gate?.gate || "";
    const gateStatus = leg.departure?.gate?.status || "";
    const gateStatusDescription = normalizeGateMessage(leg.departure?.gate?.statusDescription || leg.departure?.gate?.status || "") || "";
    const belt = leg.arrival?.belt?.belt || "";
    const beltStatus = leg.arrival?.belt?.status || "";
    const beltStatusDescription = leg.arrival?.belt?.statusDescription || "";
    const flightStatusText = leg.flightStatus || "";
    const isCanceled = statusCode === "C" || /kansell|cancel/i.test(flightStatusText);
    const isDone = statusCode === "A" || statusCode === "D" || /avreist|landet|departed|arrived/i.test(flightStatusText);
    const isNewTime = statusCode === "E" || leg.isDelayed || ownSide?.isDelayed || /ny .*tid|new .*time/i.test(flightStatusText);
    const bestTime = ["A", "D", "E"].includes(statusCode) && statusTime ? statusTime : scheduledTime || "";
    const displayTime = ["A", "D", "E"].includes(statusCode) && statusTimeLocal
      ? formatLocalTimeFromLocal(statusTimeLocal)
      : formatLocalTimeFromLocal(scheduledTimeLocal || "") || formatLocalTime(bestTime, "Europe/Oslo");
    const resolvedGateMessage = direction === "D"
      ? gateStatusDescription
      : isDone
        ? "Landed"
        : "";
    const fields: Record<string, string> = {
      source: "avinor-json",
      airline: airlineCode,
      airline_name: primaryFlight?.airlineName || "",
      flight_id: flightId,
      dom_int: leg.isDomestic ? "D" : "I",
      schedule_time: scheduledTime || "",
      schedule_time_local: scheduledTimeLocal || "",
      arr_dep: direction,
      airport: airportCode,
      airport_name: airportName,
      check_in: (leg.departure?.checkInZones || []).join(","),
      gate,
      gate_status: gateStatus,
      gate_status_description: gateStatusDescription,
      belt,
      belt_status: beltStatus,
      belt_status_description: beltStatusDescription,
      flight_status: flightStatusText,
      delayed: leg.isDelayed || ownSide?.isDelayed ? "Y" : ""
    };
    const status: Record<string, string> | undefined = statusCode ? {
      code: statusCode,
      description: ownSide?.statusCodeDescription || "",
      time: statusTime,
      timeLocal: statusTimeLocal
    } : undefined;

    return {
      direction,
      fields: stripEmptyValues(fields),
      ...(status ? { status } : {}),
      resolved: {
        flightId,
        ...(airlineCode ? { airlineCode } : {}),
        ...(primaryFlight?.airlineName ? { airlineName: primaryFlight.airlineName } : {}),
        ...(airportCode ? { airportCode } : {}),
        ...(airportName ? { airportName } : {}),
        scheduledTime: scheduledTime || "",
        displayTime,
        ...(gate ? { gate } : {}),
        ...(resolvedGateMessage ? { gateMessage: resolvedGateMessage } : {}),
        status: isCanceled ? "canceled" : isNewTime ? "newTime" : isDone ? "done" : "scheduled"
      }
    };
  });
}

function stripEmptyValues(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
}

function normalizeGateMessage(value: string): string | undefined {
  const raw = value.trim();
  if (!raw) return undefined;
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (["boarding", "board"].includes(normalized) || normalized.includes("boarding")) return "Boarding";
  if (["gotogate", "togate", "go", "g"].includes(normalized) || normalized.includes("gotogate")) return "To gate";
  if (["gateclosing", "closing", "close", "gc"].includes(normalized) || normalized.includes("closing")) return "Closing";
  if (["gateclosed", "closed", "cl"].includes(normalized) || normalized.includes("closed")) return "Closed";
  return undefined;
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
    const statusCode = status?.code || "";
    const bestTime = ["A", "D", "E"].includes(statusCode) && status?.time ? status.time : fields.schedule_time;
    const gateMessage = direction === "D"
      ? extractGateMessage(block, status?.text || status?.status || "")
      : statusCode === "A"
        ? "Landed"
        : undefined;

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

  return normalizeGateMessage(raw);
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
    return decodeLatin1(buffer);
  }
  return new TextDecoder("utf-8").decode(buffer);
}

function decodeLatin1(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  for (let index = 0; index < bytes.length; index += 8192) {
    chunks.push(String.fromCharCode(...bytes.slice(index, index + 8192)));
  }
  return chunks.join("");
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

function formatLocalTimeFromLocal(value: string): string {
  const match = value.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function localDateString(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || "1970";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
}

async function flightsResponse(env: Env, compact: boolean): Promise<Response> {
  const config = await getConfig(env);
  const suspendedReason = displaySuspendedReason(config);
  const liveSourceStatus: LiveSourceStatus = {
    source: normalizeDeviceSettings(config.device).liveDataSource,
    ok: true
  };
  if (suspendedReason) {
    return jsonResponse(await displayPayload(env, config, compact, suspendedReason, [], [], [], [], liveSourceStatus), 200, {
      "Cache-Control": "no-store"
    });
  }

  const limit = Math.max(1, Math.min(50, parseNumber(env.DISPLAY_LIMIT, 8)));
  const follow = normalizeFollowSettings(config.follow);
  let nearbyFlights: DisplayFlight[] = [];
  let followFlights: DisplayFlight[] = [];

  const airspaceMonitoringEnabled = config.device?.airspaceMonitoringEnabled !== false;
  if (airspaceMonitoringEnabled) {
    try {
      if (follow.enabled && follow.flights.length) {
        followFlights = await getFollowFlights(env, config);
      } else {
        nearbyFlights = await getFlights(env, config);
      }
    } catch (error) {
      liveSourceStatus.ok = false;
      liveSourceStatus.error = error instanceof Error ? error.message : "Live source request failed";
      console.warn(liveSourceStatus.error);
    }
  }

  const mode = followFlights.length ? "follow" : nearbyFlights.length ? "nearby" : "idle";
  const displayFlights = (followFlights.length ? followFlights : nearbyFlights).slice(0, limit);
  if (mode === "follow") {
    await enrichFollowLocation(env, displayFlights);
  }
  const idleScreens = displayFlights.length ? [] : await getIdleScreens(env, config);
  const payload = displayPayload(env, config, compact, mode, followFlights, nearbyFlights, displayFlights, idleScreens, liveSourceStatus);

  return jsonResponse(await payload, 200, {
    "Cache-Control": "public, max-age=15"
  });
}

async function displayPayload(
  env: Env,
  config: Config,
  compact: boolean,
  mode: string,
  followFlights: DisplayFlight[],
  nearbyFlights: DisplayFlight[],
  displayFlights: DisplayFlight[],
  idleScreens: IdleScreen[],
  liveSourceStatus: LiveSourceStatus
): Promise<Record<string, unknown>> {
  return compact
    ? {
        updatedAt: new Date().toISOString(),
        mode,
        suspended: mode === "disabled" || mode === "night",
        airspaceMonitoring: config.device?.airspaceMonitoringEnabled !== false,
        lat: config.lat,
        lon: config.lon,
        radiusKm: config.radiusKm,
        follow: config.follow,
        device: config.device,
        liveSourceStatus,
        idleScreens,
        flights: await Promise.all(displayFlights.map((flight) => toCompactDisplayFlight(env, flight, config)))
      }
    : {
        updatedAt: new Date().toISOString(),
        mode,
        airspaceMonitoring: config.device?.airspaceMonitoringEnabled !== false,
        config,
        liveSourceStatus,
        followFlights,
        nearbyFlights,
        flights: displayFlights,
        idleScreens
      };
}

function displaySuspendedReason(config: Config): "disabled" | "night" | undefined {
  const device = normalizeDeviceSettings(config.device);
  if (!device.enabled) return "disabled";
  if (isNightModeActive(device)) return "night";
  return undefined;
}

function isNightModeActive(device: DeviceSettings, now = new Date()): boolean {
  const night = device.nightMode;
  if (!night.enabled || night.brightness > 0) return false;
  const current = localMinutes(now, device.timezone);
  const start = minutesFromTime(night.start);
  const end = minutesFromTime(night.end);
  if (start === end) return false;
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function localMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone || "Europe/Oslo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return hour * 60 + minute;
}

function minutesFromTime(value: string): number {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

async function toCompactDisplayFlight(env: Env, f: DisplayFlight, config: Config): Promise<Record<string, unknown>> {
  const route = [f.origin, f.destination].filter(Boolean).join("-");
  const context = [f.contextLabel, f.contextValue].filter(Boolean).join(" ");
  const metrics = formatFollowMetrics(f, config.device?.followUnits);
  const logoCode = await displayLogoCodeFor(env, f);
  const followStatus = followStatusFor(f);
  return {
    cs: f.callsign || f.flight || "",
    flt: f.flight || "",
    air: f.airline || "",
    airCode: f.airlineCode || "",
    logoUrl: logoUrlFor(logoCode),
    ac: f.aircraft || "",
    reg: f.registration || "",
    from: f.origin || "",
    to: f.destination || "",
    ctxLabel: f.contextLabel || "",
    ctxValue: f.contextValue || "",
    status: f.status || "",
    displayTime: f.displayTime || "",
    scheduledTime: f.scheduledTime || "",
    dir: f.direction || "",
    depTime: f.departureDisplayTime || "",
    depScheduledTime: f.departureScheduledTime || "",
    arrTime: f.arrivalDisplayTime || "",
    arrScheduledTime: f.arrivalScheduledTime || "",
    gate: f.gate || "",
    gateMessage: f.gateMessage || "",
    source: f.source || "",
    layout: followStatus ? "follow_status" : "follow_cycle",
    followStatus,
    locationLabel: f.locationLabel || "",
    locationValue: f.locationValue || "",
    routeProgress: typeof f.routeProgress === "number" ? f.routeProgress : null,
    lines: {
      airline: f.airline || f.airlineCode || "",
      route,
      aircraft: f.aircraft || f.registration || "",
      context
    },
    b: f.source === "avinor" ? null : Math.round(f.bearingDeg),
    alt: f.altitudeFt ?? null,
    spd: f.speedKts ?? null,
    trk: f.headingDeg ?? null,
    vr: f.verticalRateFpm ?? null,
    metrics
  };
}

function followStatusFor(f: DisplayFlight): Record<string, string> | null {
  if (f.status === "done" && f.gateMessage === "Landed") {
    return {
      kind: "landed",
      text: `Landed${f.displayTime ? ` ${f.displayTime}` : ""}`,
      color: "landed"
    };
  }
  if (f.source === "avinor" || f.source === "aviationstack" || (f.onGround && (f.status === "scheduled" || f.status === "departed"))) {
    if (f.status === "scheduled" && isFutureScheduledFlight(f.scheduledTime)) {
      return {
        kind: "scheduled",
        text: "Scheduled",
        detail: formatFollowScheduleDetail(f),
        color: "preflight"
      };
    }
    const detail = formatFollowEventTime(f);
    return {
      kind: f.status === "departed" ? "departed" : "not_departed",
      text: f.status === "departed" ? "Departed gate" : f.gateMessage || "Not departed",
      detail,
      color: "preflight"
    };
  }
  return null;
}

function formatFollowScheduleDetail(f: DisplayFlight): string {
  const departureTime = f.departureDisplayTime || formatLocalTime(f.departureScheduledTime || "", "Europe/Oslo");
  if (departureTime) return `Dep ${departureTime}`;
  if (f.direction === "A") return f.displayTime ? `Arr ${f.displayTime}` : formatScheduleDetail(f.scheduledTime, f.displayTime);
  return f.displayTime ? `Dep ${f.displayTime}` : formatScheduleDetail(f.scheduledTime, f.displayTime);
}

function formatFollowEventTime(f: DisplayFlight): string {
  const departureTime = f.departureDisplayTime || formatLocalTime(f.departureScheduledTime || "", "Europe/Oslo");
  if (departureTime) return `Dep ${departureTime}`;
  const arrivalTime = f.arrivalDisplayTime || formatLocalTime(f.arrivalScheduledTime || "", "Europe/Oslo");
  if (f.direction === "A" && arrivalTime) return `Arr ${arrivalTime}`;
  if (f.displayTime) return `${f.direction === "A" ? "Arr" : "Dep"} ${f.displayTime}`;
  return "";
}

function isFutureScheduledFlight(value: string | undefined): boolean {
  const timestamp = Date.parse(value || "");
  if (!Number.isFinite(timestamp)) return false;
  return timestamp - Date.now() > 2 * 60 * 60 * 1000;
}

function formatScheduleDetail(value: string | undefined, displayTime: string | undefined): string {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return displayTime || "";
  const datePart = new Intl.DateTimeFormat("nb-NO", {
    timeZone: "Europe/Oslo",
    day: "2-digit",
    month: "2-digit"
  }).format(date);
  const timePart = displayTime || formatLocalTime(value || "", "Europe/Oslo");
  return [datePart, timePart].filter(Boolean).join(" ");
}

function formatFollowMetrics(f: DisplayFlight, units: DeviceSettings["followUnits"] | undefined): Record<string, string> {
  const u = units || normalizeFollowUnits(undefined);
  return {
    altitude: formatAltitude(f.altitudeFt, u.altitude),
    speed: formatSpeed(f.speedKts, u.speed),
    track: formatTrack(f.headingDeg, u.track),
    verticalRate: formatVerticalRate(f.verticalRateFpm, u.verticalRate)
  };
}

function formatAltitude(value: number | undefined, unit: DeviceSettings["followUnits"]["altitude"]): string {
  if (value === undefined) return "";
  if (unit === "fl") return `FL${Math.round(value / 100)}`;
  if (unit === "m") return `${Math.round(value * 0.3048)}m`;
  if (unit === "km") return `${round1(value * 0.0003048)}km`;
  if (unit === "nmi") return `${round1(value / 6076.12)}nmi`;
  return `${Math.round(value)}ft`;
}

function formatSpeed(value: number | undefined, unit: DeviceSettings["followUnits"]["speed"]): string {
  if (value === undefined) return "";
  if (unit === "mph") return `${Math.round(value * 1.15078)}mph`;
  if (unit === "kmh") return `${Math.round(value * 1.852)}kmh`;
  if (unit === "ms") return `${Math.round(value * 0.514444)}m/s`;
  if (unit === "mach") return `M${round2(value / 661.47)}`;
  return `${Math.round(value)}kn`;
}

function formatTrack(value: number | undefined, unit: DeviceSettings["followUnits"]["track"]): string {
  if (value === undefined) return "";
  const heading = ((Math.round(value) % 360) + 360) % 360;
  if (unit === "cardinal") return headingToCardinal(heading);
  return `${heading}deg`;
}

function formatVerticalRate(value: number | undefined, unit: DeviceSettings["followUnits"]["verticalRate"]): string {
  if (value === undefined) return "";
  if (unit === "fts") return `${round1(value / 60)}ft/s`;
  if (unit === "ms") return `${round1(value * 0.00508)}m/s`;
  if (unit === "mph") return `${round1(value * 0.0113636)}mph`;
  if (unit === "kmh") return `${round1(value * 0.018288)}kmh`;
  return `${Math.round(value)}fpm`;
}

function headingToCardinal(heading: number): string {
  const points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return points[Math.round(heading / 22.5) % 16];
}

function round1(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}

function round2(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function logoUrlFor(airlineCode: string | undefined): string {
  const code = normalizeLogoCode(airlineCode);
  return code ? `/logos/${code}.png` : "/logos/UNKNOWN.png";
}

async function displayLogoCodeFor(env: Env, flight: DisplayFlight): Promise<string> {
  const docCode = logoCodeFromCallsign(flight.callsign) || logoCodeFromCallsign(flight.flight) || logoCodeFromCallsign(flight.airline) || logoCodeFromCallsign(flight.airlineCode);
  if (docCode) return docCode;
  const primary = normalizeLogoCode(flight.airlineCode);
  if (primary && await logoExists(env, primary)) return primary;
  const iataFallback = airlineIataToLogoCode(airlineIataFromFlightNumber(flight.flight || flight.callsign));
  if (iataFallback && await logoExists(env, iataFallback)) return iataFallback;
  return primary || normalizeLogoCode(iataFallback);
}

async function logoExists(env: Env, code: string): Promise<boolean> {
  const normalized = normalizeLogoCode(code);
  if (!normalized) return false;
  if (env.AIRLINE_LOGOS && await getLogoObject(env.AIRLINE_LOGOS, `${normalized}.png`)) return true;
  const assetResponse = await env.ASSETS.fetch(`https://assets.local/logos/${normalized}.png`, { method: "HEAD" });
  return assetResponse.ok;
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
    TVS: "TRA",
    NOA: "DOC",
    FDX: "FDX",
    UPS: "UPS",
    BCS: "DHK",
    DHA: "DHK",
    DHK: "DHK",
    DHV: "DHV",
    DHX: "DHX",
    DAE: "DAE",
    GEC: "DLH",
    UAE: "UAE",
    QTR: "QTR",
    THY: "THY"
  };

  return aliases[code] || code;
}

async function getFlights(env: Env, config: Config): Promise<DisplayFlight[]> {
  const liveDataSource = normalizeDeviceSettings(config.device).liveDataSource;
  const cacheTtl = Math.max(60, parseNumber(env.CACHE_TTL_SECONDS, 60));
  const cacheKey = `flights:${liveDataSource}:v1:${config.lat.toFixed(3)}:${config.lon.toFixed(3)}:${Math.round(config.radiusKm)}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (Array.isArray(cached)) {
    const flights = cached as DisplayFlight[];
    await enrichAirlineNames(env, flights);
    return flights;
  }

  const bounds = boundsFromRadius(config.lat, config.lon, config.radiusKm);
  const records = liveDataSource === "opensky"
    ? await fetchOpenSky(env, config)
    : await fetchFr24(env, bounds);
  const flights = records
    .map((record) => liveDataSource === "opensky" ? normalizeOpenSkyFlight(record, config) : normalizeFlight(record, config))
    .filter((flight): flight is DisplayFlight => Boolean(flight))
    .filter(isAirborneFlight)
    .filter((flight) => flight.distanceKm <= config.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  await enrichAirlineNames(env, flights);
  await enrichAirportContext(env, config, flights);
  await env.FLIGHT_DISPLAY_KV.put(cacheKey, JSON.stringify(flights), { expirationTtl: cacheTtl });
  return flights;
}

async function getFollowFlights(env: Env, config: Config, liveFlights: DisplayFlight[] = []): Promise<DisplayFlight[]> {
  const follow = normalizeFollowSettings(config.follow);
  if (!follow.enabled || !follow.flights.length) return [];

  const airport = normalizeAirportCode(config.homeAirportIata, env.HOME_AIRPORT_IATA || "OSL");
  const timezone = config.device?.timezone || "Europe/Oslo";
  const [departures, arrivals, targetedLiveFlights] = await Promise.all([
    getAvinorRawFlights(env, airport, "D", timezone),
    getAvinorRawFlights(env, airport, "A", timezone),
    getTargetedFollowFlights(env, config, follow.flights)
  ]);
  const scheduled = [...departures, ...arrivals];
  const liveCandidates = mergeFlightsByIdentity([...targetedLiveFlights, ...liveFlights]);

  const flights = await Promise.all(follow.flights
    .map(async (token) => {
      const live = liveCandidates.find((flight) => flightMatchesFollowToken(flight, token));
      const raw = scheduled.find((flight) => avinorFlightMatchesFollowToken(flight, token));
      const cachedLanded = live ? undefined : await getCachedFollowLanded(env, token, raw, config);
      if (cachedLanded) return cachedLanded;
      const aviationstack = await getAviationstackFollowFlight(env, token, config);
      if (live) {
        const merged = mergeFollowLiveFlight(live, raw, config, aviationstack);
        if (await shouldTreatFollowAsLanded(env, merged, raw, config)) {
          const landed = {
            ...merged,
            status: "done",
            gateMessage: "Landed",
            displayTime: merged.displayTime || formatLocalTime(new Date().toISOString(), timezone)
          };
          await cacheFollowLanded(env, token, landed);
          return landed;
        }
        return merged;
      }
      return raw ? mergeScheduledFollowFlight(displayFlightFromAvinor(raw, config), aviationstack) : aviationstack;
    }));
  return flights.filter((flight): flight is DisplayFlight => Boolean(flight));
}

async function getTargetedFollowFlights(env: Env, config: Config, tokens: string[]): Promise<DisplayFlight[]> {
  const liveDataSource = normalizeDeviceSettings(config.device).liveDataSource;
  const normalizedTokens = tokens
    .map(normalizeFollowToken)
    .filter((token): token is string => Boolean(token));
  if (!normalizedTokens.length) return [];

  const cacheTtl = Math.max(30, Math.min(300, parseNumber(env.CACHE_TTL_SECONDS, 60)));
  const sourceVersion = liveDataSource === "fr24" ? "v4" : "v1";
  const areaPart = liveDataSource === "opensky" ? `:${config.lat.toFixed(3)}:${config.lon.toFixed(3)}:${Math.round(config.radiusKm)}` : "";
  const cacheKey = `follow:${liveDataSource}:${sourceVersion}:${normalizedTokens.slice().sort().join(",")}${areaPart}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (Array.isArray(cached)) return cached as DisplayFlight[];

  const [records, staticFlights] = liveDataSource === "opensky"
    ? [await fetchOpenSky(env, config), [] as DisplayFlight[]]
    : await Promise.all([
        fetchFr24(env, undefined, { flights: normalizedTokens }, env.FR24_FOLLOW_ENDPOINT || "/live/flight-positions/light"),
        getFr24FollowStaticFlights(env, config, normalizedTokens)
      ]);
  const fallbackFlight = liveDataSource === "fr24" && normalizedTokens.length === 1 ? normalizedTokens[0] : undefined;
  const liveFlights = records
    .map((record) => liveDataSource === "opensky" ? normalizeOpenSkyFlight(record, config) : normalizeFlight(record, config, fallbackFlight))
    .filter((flight): flight is DisplayFlight => Boolean(flight))
    .filter((flight) => liveDataSource === "opensky" ? normalizedTokens.some((token) => flightMatchesFollowToken(flight, token)) : true);
  const flights = liveDataSource === "fr24" ? mergeFollowStaticFlights(liveFlights, staticFlights) : liveFlights;

  await enrichAirlineNames(env, flights);
  await enrichAirportContext(env, config, flights);
  await env.FLIGHT_DISPLAY_KV.put(cacheKey, JSON.stringify(flights), { expirationTtl: cacheTtl });
  return flights;
}

async function getFr24FollowStaticFlights(env: Env, config: Config, tokens: string[]): Promise<DisplayFlight[]> {
  const timezone = config.device?.timezone || "Europe/Oslo";
  const cacheDate = localDateString(new Date(), timezone);
  const cacheTtl = 18 * 60 * 60;
  const resultByToken = new Map<string, DisplayFlight>();
  const missingTokens: string[] = [];

  await Promise.all(tokens.map(async (token) => {
    const cacheKey = fr24FollowStaticCacheKey(cacheDate, token);
    const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
    if (cached && typeof cached === "object" && !Array.isArray(cached)) {
      resultByToken.set(token, cached as DisplayFlight);
    } else {
      missingTokens.push(token);
    }
  }));

  if (missingTokens.length) {
    try {
      const records = await fetchFr24(env, undefined, { flights: missingTokens }, env.FR24_LIVE_ENDPOINT || "/live/flight-positions/full");
      const fullFlights = records
        .map((record) => normalizeFlight(record, config))
        .filter((flight): flight is DisplayFlight => Boolean(flight));

      await Promise.all(missingTokens.map(async (token) => {
        const fullFlight = fullFlights.find((flight) => flightMatchesFollowToken(flight, token));
        if (!fullFlight) return;
        resultByToken.set(token, fullFlight);
        await env.FLIGHT_DISPLAY_KV.put(fr24FollowStaticCacheKey(cacheDate, token), JSON.stringify(fullFlight), { expirationTtl: cacheTtl });
      }));
    } catch (error) {
      console.warn(error instanceof Error ? error.message : "FR24 follow static fetch failed");
    }
  }

  return Array.from(resultByToken.values());
}

function fr24FollowStaticCacheKey(cacheDate: string, token: string): string {
  return `follow:fr24:static:v2:${cacheDate}:${token}`;
}

function mergeFollowStaticFlights(liveFlights: DisplayFlight[], staticFlights: DisplayFlight[]): DisplayFlight[] {
  return liveFlights.map((live) => {
    const staticFlight = staticFlights.find((candidate) => sameFlightIdentity(live, candidate));
    if (!staticFlight) return live;
    return {
      ...live,
      flight: live.flight || staticFlight.flight,
      callsign: live.callsign || staticFlight.callsign,
      airline: live.airline || staticFlight.airline,
      airlineCode: live.airlineCode || staticFlight.airlineCode,
      aircraft: live.aircraft || staticFlight.aircraft,
      registration: live.registration || staticFlight.registration,
      origin: live.origin || staticFlight.origin,
      destination: live.destination || staticFlight.destination,
      contextLabel: live.contextLabel || staticFlight.contextLabel,
      contextValue: live.contextValue || staticFlight.contextValue,
      departureScheduledTime: live.departureScheduledTime || staticFlight.departureScheduledTime,
      departureDisplayTime: live.departureDisplayTime || staticFlight.departureDisplayTime,
      arrivalScheduledTime: live.arrivalScheduledTime || staticFlight.arrivalScheduledTime,
      arrivalDisplayTime: live.arrivalDisplayTime || staticFlight.arrivalDisplayTime
    };
  });
}

function sameFlightIdentity(a: DisplayFlight, b: DisplayFlight): boolean {
  const aValues = [a.flight, a.callsign, a.registration, a.fr24Id].map(normalizedIdentityValue).filter(Boolean);
  const bValues = [b.flight, b.callsign, b.registration, b.fr24Id].map(normalizedIdentityValue).filter(Boolean);
  return aValues.some((value) => bValues.includes(value));
}

function normalizedIdentityValue(value: string | undefined): string {
  return value?.toUpperCase().replace(/\s+/g, "") || "";
}

async function shouldTreatFollowAsLanded(env: Env, flight: DisplayFlight, raw: AvinorRawFlight | undefined, config: Config): Promise<boolean> {
  if (!flight.onGround) return false;
  if (raw?.resolved.status === "done" && raw.direction === "A") return true;
  if (typeof flight.lat !== "number" || typeof flight.lon !== "number" || !flight.destination) return false;
  const destination = await getAirportCoordinates(env, flight.destination);
  if (!destination) return false;
  const distanceToDestinationKm = haversineKm(flight.lat, flight.lon, destination.lat, destination.lon);
  if (distanceToDestinationKm <= 40) return true;
  const progress = await calculateRouteProgress(env, flight);
  return typeof progress === "number" && progress >= 0.9;
}

async function cacheFollowLanded(env: Env, token: string, flight: DisplayFlight): Promise<void> {
  const normalized = normalizeFollowToken(token);
  if (!normalized) return;
  const cacheKey = `follow:landed:v1:${normalized}`;
  await env.FLIGHT_DISPLAY_KV.put(cacheKey, JSON.stringify({
    ...flight,
    status: "done",
    gateMessage: "Landed",
    landedAt: new Date().toISOString()
  }), { expirationTtl: 2 * 60 * 60 });
}

async function getCachedFollowLanded(env: Env, token: string, raw: AvinorRawFlight | undefined, config: Config): Promise<DisplayFlight | undefined> {
  const normalized = normalizeFollowToken(token);
  if (!normalized) return undefined;
  const cacheKey = `follow:landed:v1:${normalized}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (!cached || typeof cached !== "object" || Array.isArray(cached)) return undefined;
  const landed = cached as DisplayFlight;
  const avinor = raw ? displayFlightFromAvinor(raw, config) : undefined;
  return {
    ...(avinor || {}),
    ...landed,
    source: landed.source || "fr24",
    status: "done",
    gateMessage: "Landed",
    displayTime: landed.displayTime || avinor?.displayTime || ""
  };
}

async function getAviationstackFollowFlight(env: Env, token: string, config: Config): Promise<DisplayFlight | undefined> {
  const normalized = normalizeFollowToken(token);
  const apiKey = getAviationstackApiKey(env);
  if (!normalized || !apiKey) return undefined;

  const timezone = config.device?.timezone || "Europe/Oslo";
  const cacheDate = localDateString(new Date(), timezone);
  const cacheKey = `follow:aviationstack:v1:${cacheDate}:${normalized}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (cached && typeof cached === "object" && !Array.isArray(cached)) {
    const record = cached as { missing?: unknown };
    return record.missing === true ? undefined : record as DisplayFlight;
  }

  try {
    const records = await fetchAviationstackFlights(env, apiKey, normalized);
    const flight = records
      .map((record) => normalizeAviationstackFlight(record, config))
      .find((candidate): candidate is DisplayFlight => Boolean(candidate && flightMatchesFollowToken(candidate, normalized)));
    await env.FLIGHT_DISPLAY_KV.put(
      cacheKey,
      JSON.stringify(flight || { missing: true }),
      { expirationTtl: flight ? 30 * 60 : 10 * 60 }
    );
    return flight;
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "Aviationstack follow fetch failed");
    return undefined;
  }
}

function getAviationstackApiKey(env: Env): string | undefined {
  return normalizeSecretString(env.AVIATIONSTACK_API_KEY);
}

async function fetchAviationstackFlights(env: Env, apiKey: string, flightToken: string): Promise<AviationstackFlight[]> {
  const baseUrl = env.AVIATIONSTACK_API_BASE_URL || "https://api.aviationstack.com/v1";
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/flights`);
  url.searchParams.set("access_key", apiKey);
  if (/^[A-Z]{3}\d/.test(flightToken)) {
    url.searchParams.set("flight_icao", flightToken);
  } else {
    url.searchParams.set("flight_iata", flightToken);
  }
  url.searchParams.set("limit", "10");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Aviationstack request failed (${response.status}): ${text.slice(0, 240)}`);
  }

  const json = await response.json() as Record<string, unknown>;
  if (json.error && typeof json.error === "object") {
    const error = json.error as Record<string, unknown>;
    const message = firstString(error, ["message", "info", "type"]) || "unknown error";
    throw new Error(`Aviationstack request failed: ${message}`);
  }
  const records = Array.isArray(json.data) ? json.data : Array.isArray(json.results) ? json.results : [];
  return records.filter((record): record is AviationstackFlight => Boolean(record && typeof record === "object"));
}

function normalizeAviationstackFlight(record: AviationstackFlight, config: Config): DisplayFlight | undefined {
  const departure = record.departure || {};
  const arrival = record.arrival || {};
  const flight = record.flight || {};
  const airline = record.airline || {};
  const departureScheduledTime = parseDateValue(departure.scheduled) || parseDateValue(departure.estimated) || undefined;
  const arrivalScheduledTime = parseDateValue(arrival.scheduled) || parseDateValue(arrival.estimated) || undefined;
  const flightId = cleanNullableString(flight.iata) || [
    cleanNullableString(airline.iata),
    cleanNullableString(flight.number)
  ].filter(Boolean).join("");
  if (!flightId) return undefined;

  const origin = cleanNullableString(departure.iata) || cleanNullableString(departure.icao);
  const destination = cleanNullableString(arrival.iata) || cleanNullableString(arrival.icao);
  const status = normalizeAviationstackStatus(record.flight_status);
  const gate = cleanNullableString(departure.gate);

  return {
    callsign: cleanNullableString(flight.icao) || flightId,
    flight: flightId.toUpperCase(),
    airline: cleanNullableString(airline.name) || cleanNullableString(airline.iata) || undefined,
    airlineCode: airlineIataToLogoCode(cleanNullableString(airline.iata)) || normalizeLogoCode(cleanNullableString(airline.icao)),
    origin,
    destination,
    contextLabel: "Departing to",
    contextValue: cleanNullableString(arrival.airport) || destination || "",
    distanceKm: config.radiusKm,
    bearingDeg: 0,
    source: "aviationstack",
    status,
    gate,
    scheduledTime: departureScheduledTime,
    displayTime: formatLocalTime(departureScheduledTime || "", config.device?.timezone || "Europe/Oslo"),
    direction: "D",
    departureScheduledTime,
    departureDisplayTime: formatLocalTime(departureScheduledTime || "", config.device?.timezone || "Europe/Oslo"),
    arrivalScheduledTime,
    arrivalDisplayTime: formatLocalTime(arrivalScheduledTime || "", config.device?.timezone || "Europe/Oslo")
  };
}

function normalizeAviationstackStatus(value: string | null | undefined): string {
  const normalized = (value || "").toLowerCase();
  if (normalized === "landed") return "done";
  if (normalized === "active") return "departed";
  if (normalized === "cancelled" || normalized === "canceled") return "canceled";
  return "scheduled";
}

function cleanNullableString(value: string | null | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeSecretString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function mergeFlightsByIdentity(flights: DisplayFlight[]): DisplayFlight[] {
  const seen = new Set<string>();
  return flights.filter((flight) => {
    const key = [flight.flight, flight.callsign, flight.registration, flight.fr24Id]
      .filter(Boolean)
      .join("|")
      .toUpperCase();
    if (key && seen.has(key)) return false;
    if (key) seen.add(key);
    return true;
  });
}

async function enrichFollowLocation(env: Env, flights: DisplayFlight[]): Promise<void> {
  await Promise.all(flights.map(async (flight) => {
    if (typeof flight.lat !== "number" || typeof flight.lon !== "number") return;
    const location = await getFlightLocation(env, flight.lat, flight.lon);
    flight.locationLabel = "Flying over";
    flight.locationValue = location;
    flight.routeProgress = await calculateRouteProgress(env, flight);
  }));
}

async function getFlightLocation(env: Env, lat: number, lon: number): Promise<string> {
  const cellLat = Math.round(lat * 10) / 10;
  const cellLon = Math.round(lon * 10) / 10;
  const cacheKey = `geocode:v2:${cellLat.toFixed(1)}:${cellLon.toFixed(1)}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey);
  if (cached) return cached;

  const baseUrl = env.GEOCODER_REVERSE_URL || "https://nominatim.openstreetmap.org/reverse";
  const url = new URL(baseUrl);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(cellLat));
  url.searchParams.set("lon", String(cellLon));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "flight-display-server/0.1"
    }
  });
  if (!response.ok) return inferSeaName(lat, lon) || "Unknown area";

  const data = await response.json() as Record<string, unknown>;
  const value = extractGeocodeDisplayName(data) || inferSeaName(lat, lon) || "Open water";
  await env.FLIGHT_DISPLAY_KV.put(cacheKey, value, { expirationTtl: 30 * 24 * 60 * 60 });
  return value;
}

function extractGeocodeDisplayName(data: Record<string, unknown>): string | undefined {
  const address = data.address && typeof data.address === "object" ? data.address as Record<string, unknown> : {};
  const place = firstString(address, ["city", "town", "village", "municipality", "county", "state"]);
  const country = firstString(address, ["country"]);
  if (place && country) return `${place} - ${country}`;
  if (country) return country;
  return undefined;
}

function inferSeaName(lat: number, lon: number): string | undefined {
  if (lat >= 53 && lat <= 62.5 && lon >= -4.5 && lon <= 9.5) return "North Sea";
  if (lat >= 56 && lat <= 59.5 && lon >= 6 && lon <= 12.5) return "Skagerrak";
  if (lat >= 55 && lat <= 58.5 && lon >= 10 && lon <= 13.5) return "Kattegat";
  if (lat >= 54 && lat <= 66 && lon >= 13 && lon <= 31) return "Baltic Sea";
  if (lat >= 62 && lat <= 75 && lon >= -15 && lon <= 20) return "Norwegian Sea";
  if (lat >= 48 && lat <= 52 && lon >= -6 && lon <= 3) return "English Channel";
  if (lat >= 35 && lat <= 46 && lon >= -6 && lon <= 37) return "Mediterranean Sea";
  if (lat >= 35 && lat <= 72 && lon >= -65 && lon <= -6) return "Atlantic Ocean";
  return undefined;
}

async function calculateRouteProgress(env: Env, flight: DisplayFlight): Promise<number | undefined> {
  if (typeof flight.lat !== "number" || typeof flight.lon !== "number" || !flight.origin || !flight.destination) return undefined;
  const [origin, destination] = await Promise.all([
    getAirportCoordinates(env, flight.origin),
    getAirportCoordinates(env, flight.destination)
  ]);
  if (!origin || !destination) return undefined;

  const total = haversineKm(origin.lat, origin.lon, destination.lat, destination.lon);
  const remaining = haversineKm(flight.lat, flight.lon, destination.lat, destination.lon);
  if (!Number.isFinite(total) || total <= 0) return undefined;
  return clamp(1 - remaining / total, 0, 1);
}

async function getAirportCoordinates(env: Env, code: string): Promise<{ lat: number; lon: number } | undefined> {
  const normalized = code.toUpperCase();
  const known = KNOWN_AIRPORT_COORDS[normalized];
  if (known) return known;

  const cacheKey = `airport-coords:v1:${normalized}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (cached && typeof cached === "object" && !Array.isArray(cached)) {
    const record = cached as { lat?: unknown; lon?: unknown };
    if (typeof record.lat === "number" && typeof record.lon === "number") return { lat: record.lat, lon: record.lon };
  }

  const baseUrl = env.GEOCODER_SEARCH_URL || "https://nominatim.openstreetmap.org/search";
  const url = new URL(baseUrl);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", `${normalized} airport`);
  url.searchParams.set("limit", "1");
  url.searchParams.set("accept-language", "en");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "flight-display-server/0.1"
    }
  });
  if (!response.ok) return undefined;

  const results = await response.json() as Array<Record<string, unknown>>;
  const first = Array.isArray(results) ? results[0] : undefined;
  const lat = first ? Number(first.lat) : NaN;
  const lon = first ? Number(first.lon) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  const coords = { lat, lon };
  await env.FLIGHT_DISPLAY_KV.put(cacheKey, JSON.stringify(coords));
  return coords;
}

function flightMatchesFollowToken(flight: DisplayFlight, token: string): boolean {
  const normalized = normalizeFollowToken(token);
  if (!normalized) return false;
  return [flight.flight, flight.callsign, flight.registration]
    .map((value) => value?.toUpperCase().replace(/\s+/g, ""))
    .some((value) => value === normalized);
}

function avinorFlightMatchesFollowToken(flight: AvinorRawFlight, token: string): boolean {
  const normalized = normalizeFollowToken(token);
  if (!normalized) return false;
  const flightIds = [
    flight.resolved.flightId,
    flight.fields.flight_id
  ].map((value) => value?.toUpperCase().replace(/\s+/g, ""));
  return flightIds.includes(normalized);
}

function mergeFollowLiveFlight(live: DisplayFlight, raw: AvinorRawFlight | undefined, config: Config, aviationstack?: DisplayFlight): DisplayFlight {
  if (!raw) return mergeScheduledFollowFlight({ ...live, source: live.source || "fr24" }, aviationstack);
  const avinor = displayFlightFromAvinor(raw, config);
  return mergeScheduledFollowFlight({
    ...avinor,
    ...live,
    source: live.source || "fr24",
    airline: avinor.airline || live.airline,
    airlineCode: avinor.airlineCode || normalizeLogoCode(live.airlineCode),
    origin: avinor.origin || live.origin,
    destination: avinor.destination || live.destination,
    contextLabel: avinor.contextLabel,
    contextValue: avinor.contextValue,
    status: avinor.status,
    gate: avinor.gate,
    gateMessage: avinor.gateMessage,
    scheduledTime: avinor.scheduledTime,
    displayTime: avinor.displayTime,
    direction: avinor.direction,
    departureScheduledTime: live.departureScheduledTime || avinor.departureScheduledTime,
    departureDisplayTime: live.departureDisplayTime || avinor.departureDisplayTime,
    arrivalScheduledTime: live.arrivalScheduledTime || avinor.arrivalScheduledTime,
    arrivalDisplayTime: live.arrivalDisplayTime || avinor.arrivalDisplayTime
  }, aviationstack);
}

function mergeScheduledFollowFlight(primary: DisplayFlight, aviationstack: DisplayFlight | undefined): DisplayFlight {
  if (!aviationstack) return primary;
  return {
    ...primary,
    flight: primary.flight || aviationstack.flight,
    callsign: primary.callsign || aviationstack.callsign,
    airline: primary.airline || aviationstack.airline,
    airlineCode: primary.airlineCode || aviationstack.airlineCode,
    origin: primary.origin || aviationstack.origin,
    destination: primary.destination || aviationstack.destination,
    contextLabel: primary.contextLabel || aviationstack.contextLabel,
    contextValue: primary.contextValue || aviationstack.contextValue,
    status: primary.status || aviationstack.status,
    gate: primary.gate || aviationstack.gate,
    gateMessage: primary.gateMessage || aviationstack.gateMessage,
    scheduledTime: primary.scheduledTime || aviationstack.scheduledTime,
    displayTime: primary.displayTime || aviationstack.displayTime,
    direction: primary.direction || aviationstack.direction,
    departureScheduledTime: primary.departureScheduledTime || aviationstack.departureScheduledTime,
    departureDisplayTime: primary.departureDisplayTime || aviationstack.departureDisplayTime,
    arrivalScheduledTime: primary.arrivalScheduledTime || aviationstack.arrivalScheduledTime,
    arrivalDisplayTime: primary.arrivalDisplayTime || aviationstack.arrivalDisplayTime
  };
}

function displayFlightFromAvinor(raw: AvinorRawFlight, config: Pick<Config, "lat" | "lon" | "radiusKm" | "homeAirportIata">): DisplayFlight {
  const isDeparture = raw.direction === "D";
  const home = config.homeAirportIata || "OSL";
  const origin = isDeparture ? home : raw.resolved.airportCode;
  const destination = isDeparture ? raw.resolved.airportCode : home;
  const status = isDeparture && raw.resolved.status === "done" ? "departed" : raw.resolved.status;
  return {
    flight: raw.resolved.flightId,
    callsign: raw.resolved.flightId,
    airline: raw.resolved.airlineName || raw.resolved.airlineCode,
    airlineCode: airlineIataToLogoCode(raw.resolved.airlineCode),
    origin,
    destination,
    contextLabel: isDeparture ? "Departing to" : "Arriving from",
    contextValue: raw.resolved.airportName || raw.resolved.airportCode || "",
    distanceKm: config.radiusKm,
    bearingDeg: 0,
    source: "avinor",
    status,
    gate: raw.resolved.gate,
    gateMessage: raw.resolved.gateMessage,
    scheduledTime: raw.resolved.scheduledTime,
    displayTime: raw.resolved.displayTime,
    direction: raw.direction,
    departureScheduledTime: isDeparture ? raw.resolved.scheduledTime : undefined,
    departureDisplayTime: isDeparture ? raw.resolved.displayTime : undefined,
    arrivalScheduledTime: isDeparture ? undefined : raw.resolved.scheduledTime,
    arrivalDisplayTime: isDeparture ? undefined : raw.resolved.displayTime
  };
}

function airlineIataToLogoCode(iata: string | undefined): string | undefined {
  if (!iata) return undefined;
  const aliases: Record<string, string> = {
    DY: "NOZ",
    D8: "NOZ",
    SK: "SAS",
    WF: "WIF",
    KL: "KLM",
    LH: "DLH",
    AF: "AFR",
    BA: "BAW",
    FR: "RYR",
    AY: "FIN",
    BT: "BTI",
    LX: "SWR",
    QR: "QTR",
    EK: "UAE",
    TK: "THY",
    TP: "TAP",
    TG: "THA",
    LO: "LOT",
    FX: "FDX",
    "5X": "UPS",
    D0: "DHK",
    QY: "DHK",
    ES: "DHX",
    D5: "DAE"
  };
  return aliases[iata.toUpperCase()] || iata.toUpperCase();
}

function isAirborneFlight(flight: DisplayFlight): boolean {
  return typeof flight.altitudeFt === "number" && flight.altitudeFt > 0;
}

async function fetchOpenSky(env: Env, config: Config): Promise<unknown[]> {
  const token = await getOptionalOpenSkyAccessToken(env);
  const bbox = boundingBoxFromRadius(config.lat, config.lon, config.radiusKm);
  const baseUrl = env.OPENSKY_BASE_URL || "https://opensky-network.org";
  const url = new URL(`${baseUrl}/api/states/all`);
  url.searchParams.set("lamin", bbox.south.toFixed(6));
  url.searchParams.set("lamax", bbox.north.toFixed(6));
  url.searchParams.set("lomin", bbox.west.toFixed(6));
  url.searchParams.set("lomax", bbox.east.toFixed(6));
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "flight-display-server/1.0"
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response = await fetch(url, { headers });
  if (!response.ok && token && (response.status === 401 || response.status === 403)) {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "flight-display-server/1.0"
      }
    });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenSky request failed (${response.status}): ${text.slice(0, 240)}`);
  }

  const json = await response.json();
  if (json && typeof json === "object" && Array.isArray((json as { states?: unknown[] }).states)) {
    return (json as { states: unknown[] }).states;
  }
  return [];
}

async function getOptionalOpenSkyAccessToken(env: Env): Promise<string | undefined> {
  try {
    return await getOpenSkyAccessToken(env);
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "OpenSky token request failed");
    return undefined;
  }
}

async function getOpenSkyAccessToken(env: Env): Promise<string> {
  if (!env.OPENSKY_CLIENT_ID || !env.OPENSKY_CLIENT_SECRET) {
    throw new Error("OpenSky OAuth credentials are not configured; using anonymous OpenSky request");
  }

  const cacheKey = "opensky:token:v1";
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey);
  if (cached) return cached;

  const tokenUrl = env.OPENSKY_TOKEN_URL || "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.OPENSKY_CLIENT_ID,
    client_secret: env.OPENSKY_CLIENT_SECRET
  });
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "flight-display-server/1.0"
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenSky token request failed (${response.status}): ${text.slice(0, 240)}`);
  }

  const json = await response.json() as { access_token?: unknown; expires_in?: unknown };
  if (typeof json.access_token !== "string" || !json.access_token) {
    throw new Error("OpenSky token response did not contain access_token");
  }
  const ttl = Math.max(60, Math.min(3600, Number(json.expires_in || 1800) - 60));
  await env.FLIGHT_DISPLAY_KV.put(cacheKey, json.access_token, { expirationTtl: ttl });
  return json.access_token;
}

function normalizeOpenSkyFlight(record: unknown, config: Config): DisplayFlight | null {
  if (!Array.isArray(record) || record.length < 17) return null;
  const callsign = typeof record[1] === "string" ? record[1].trim().toUpperCase() : "";
  const originCountry = typeof record[2] === "string" ? record[2].trim() : "";
  const lon = numberFromUnknown(record[5]);
  const lat = numberFromUnknown(record[6]);
  if (lat === undefined || lon === undefined) return null;

  const baroAltitudeM = numberFromUnknown(record[7]);
  const geoAltitudeM = numberFromUnknown(record[13]);
  const velocityMs = numberFromUnknown(record[9]);
  const trueTrack = numberFromUnknown(record[10]);
  const verticalRateMs = numberFromUnknown(record[11]);
  const onGround = typeof record[8] === "boolean" ? record[8] : undefined;
  const distanceKm = haversineKm(config.lat, config.lon, lat, lon);
  const bearingDeg = bearing(config.lat, config.lon, lat, lon);
  const icaoPrefix = callsign.match(/^([A-Z]{3})\d/)?.[1];

  return {
    callsign,
    flight: callsign,
    airline: icaoPrefix || originCountry || undefined,
    airlineCode: icaoPrefix,
    lat,
    lon,
    altitudeFt: metersToFeet(baroAltitudeM ?? geoAltitudeM),
    speedKts: velocityMs === undefined ? undefined : velocityMs * 1.94384,
    headingDeg: trueTrack,
    verticalRateFpm: verticalRateMs === undefined ? undefined : verticalRateMs * 196.850394,
    onGround,
    distanceKm,
    bearingDeg,
    source: "opensky"
  };
}

function numberFromUnknown(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function metersToFeet(value: number | undefined): number | undefined {
  return value === undefined ? undefined : value * 3.28084;
}

function boundingBoxFromRadius(lat: number, lon: number, radiusKm: number): { north: number; south: number; west: number; east: number } {
  const latDelta = radiusKm / 111.32;
  const lonDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return {
    north: clamp(lat + latDelta, -90, 90),
    south: clamp(lat - latDelta, -90, 90),
    west: clamp(lon - lonDelta, -180, 180),
    east: clamp(lon + lonDelta, -180, 180)
  };
}

async function fetchFr24(env: Env, bounds?: string, filters: { flights?: string[]; callsigns?: string[] } = {}, endpointOverride?: string): Promise<unknown[]> {
  if (!env.FR24_API_KEY) throw new Error("FR24_API_KEY secret is not configured");

  const baseUrl = env.FR24_API_BASE_URL || "https://fr24api.flightradar24.com/api";
  const endpoint = endpointOverride || env.FR24_LIVE_ENDPOINT || "/live/flight-positions/full";
  const url = new URL(`${baseUrl}${endpoint}`);
  if (bounds) url.searchParams.set("bounds", bounds);
  if (filters.flights?.length) url.searchParams.set("flights", filters.flights.join(","));
  if (filters.callsigns?.length) url.searchParams.set("callsigns", filters.callsigns.join(","));
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

function normalizeFlight(record: unknown, config: Config, fallbackFlight?: string): DisplayFlight | null {
  if (!record || typeof record !== "object") return null;
  const r = record as Record<string, unknown>;
  const lat = firstNumber(r, ["lat", "latitude"]);
  const lon = firstNumber(r, ["lon", "lng", "longitude"]);
  if (lat === undefined || lon === undefined) return null;

  const distanceKm = haversineKm(config.lat, config.lon, lat, lon);
  const bearingDeg = bearing(config.lat, config.lon, lat, lon);

  const altitudeFt = firstNumber(r, ["alt", "altitude", "altitude_ft"]);
  const explicitOnGround = firstBoolean(r, ["on_ground", "onground", "ground", "is_ground", "is_on_ground"]);
  const departureScheduledTime = firstDateString(r, [
    "scheduled_departure",
    "departure_scheduled",
    "dep_scheduled",
    "dep_schd",
    "scheduled_departure_time",
    "std",
    "etd",
    "estimated_departure"
  ], [
    ["time", "scheduled", "departure"],
    ["time", "estimated", "departure"],
    ["time", "real", "departure"],
    ["departure", "scheduled"],
    ["departure", "scheduled_time"],
    ["departure", "estimated"],
    ["departure", "time", "scheduled"],
    ["schedule", "departure"]
  ]);
  const arrivalScheduledTime = firstDateString(r, [
    "scheduled_arrival",
    "arrival_scheduled",
    "arr_scheduled",
    "arr_schd",
    "scheduled_arrival_time",
    "sta",
    "eta",
    "estimated_arrival"
  ], [
    ["time", "scheduled", "arrival"],
    ["time", "estimated", "arrival"],
    ["time", "real", "arrival"],
    ["arrival", "scheduled"],
    ["arrival", "scheduled_time"],
    ["arrival", "estimated"],
    ["arrival", "time", "scheduled"],
    ["schedule", "arrival"]
  ]);

  return {
    fr24Id: firstString(r, ["fr24_id", "id"]),
    callsign: firstString(r, ["callsign"]),
    flight: firstString(r, ["flight", "flight_number"]) || fallbackFlight,
    airline: firstString(r, ["airline_name", "airline_full_name", "name"]),
    airlineCode: firstString(r, ["painted_as", "operated_as", "airline_icao", "airline"]),
    aircraft: firstString(r, ["type", "aircraft_code", "aircraft"]),
    registration: firstString(r, ["reg", "registration"]),
    origin: firstString(r, ["orig_iata", "origin_iata", "origin_icao"]),
    destination: firstString(r, ["dest_iata", "destination_iata", "destination_icao"]),
    lat,
    lon,
    altitudeFt,
    speedKts: firstNumber(r, ["gspeed", "ground_speed", "speed"]),
    headingDeg: firstNumber(r, ["track", "heading"]),
    verticalRateFpm: firstNumber(r, ["vspeed", "vertical_speed", "vertical_rate", "vertical_speed_fpm"]),
    onGround: explicitOnGround ?? (altitudeFt !== undefined ? altitudeFt <= 0 : undefined),
    departureScheduledTime,
    departureDisplayTime: formatLocalTime(departureScheduledTime || "", config.device?.timezone || "Europe/Oslo"),
    arrivalScheduledTime,
    arrivalDisplayTime: formatLocalTime(arrivalScheduledTime || "", config.device?.timezone || "Europe/Oslo"),
    distanceKm,
    bearingDeg,
    source: "fr24"
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
        .filter((flight) => flight.source !== "opensky")
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
  const cacheKey = `airport:v4:${normalized}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey);
  if (cached) return cached;

  const override = AIRPORT_CITY_OVERRIDES[normalized];
  if (override) {
    await env.FLIGHT_DISPLAY_KV.put(cacheKey, override);
    return override;
  }

  const avinorName = await getAvinorAirportName(env, normalized);
  if (avinorName) {
    const displayName = cleanAirportName(avinorName);
    if (displayName) {
      await env.FLIGHT_DISPLAY_KV.put(cacheKey, displayName);
      return displayName;
    }
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
  const cacheKey = `airport:avinor:v2:${normalized}`;
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
  return normalizeDisplayText(withoutDecorators || name);
}

function normalizeDisplayText(value: string): string {
  return value
    .replace(/[æÆåÅ]/g, "a")
    .replace(/[øØöÖóÓòÒôÔ]/g, "o")
    .replace(/[üÜúÚùÙûÛ]/g, "u")
    .replace(/[äÄáÁàÀâÂ]/g, "a")
    .replace(/[éÉèÈêÊëË]/g, "e")
    .replace(/[íÍìÌîÎïÏ]/g, "i")
    .replace(/[çÇ]/g, "c")
    .replace(/[ñÑ]/g, "n");
}

function renderIndexHtml(): string {
  return `<!doctype html>
<html lang="no">
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
    .card h2 { margin: 0; color: var(--amber2); font-size: 13px; letter-spacing: .12em; text-transform: uppercase; }
    .section-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 12px; }
    .section-note { margin: -4px 0 10px; color: var(--muted); font-size: 12px; line-height: 1.4; }
    .hint { position: relative; display: inline-grid; place-items: center; flex: 0 0 auto; width: 19px; height: 19px; border: 1px solid #405066; border-radius: 50%; color: #f8fafc; background: #182232; font-size: 12px; font-weight: 900; cursor: help; }
    .hint::after { content: attr(data-tip); position: absolute; right: 0; top: 25px; z-index: 20; width: min(280px, 74vw); padding: 9px 10px; border: 1px solid #405066; border-radius: 6px; background: #05080d; color: #edf2f8; box-shadow: 0 10px 30px rgba(0,0,0,.35); font-size: 12px; font-weight: 650; line-height: 1.35; letter-spacing: 0; text-transform: none; opacity: 0; pointer-events: none; transform: translateY(-4px); transition: opacity .12s ease, transform .12s ease; }
    .hint:hover::after, .hint:focus::after { opacity: 1; transform: translateY(0); }
    .subhead { margin: 14px 0 8px; color: #f4f7ff; font-size: 12px; font-weight: 850; letter-spacing: .06em; text-transform: uppercase; }
    label { display: block; margin: 11px 0 5px; color: #d7deea; font-weight: 700; font-size: 12px; }
    .field-help { margin: 4px 0 0; color: var(--muted); font-size: 11px; line-height: 1.35; }
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
    details.links-wrap { margin-top: 12px; border: 1px solid #263345; border-radius: 6px; background: #0b1118; }
    details.links-wrap summary { cursor: pointer; padding: 9px 10px; color: var(--muted); font-size: 12px; font-weight: 800; }
    details.links-wrap .links { margin: 0; padding: 0 10px 10px; }
    .preview { margin-top: 16px; }
    .preview-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .preview-head h2 { margin: 0; font-size: 13px; }
    .preview-actions { display: flex; gap: 8px; }
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
    .workbench { min-height: 100vh; align-self: stretch; }
    .emulator { padding: 18px 22px 22px; background: #0c121a; color: #e8edf4; border-top: 1px solid #263242; }
    .emulator h2 { margin: 0 0 6px; font-size: 18px; }
    .emulator p { color: #aeb8c5; margin-bottom: 14px; }
    .emu-controls { display: grid; grid-template-columns: 170px minmax(220px, 420px) 150px; gap: 12px; align-items: end; margin-bottom: 14px; }
    .emu-controls label { color: #dce4ee; margin-top: 0; }
    .emu-controls input, .emu-controls select { width: 100%; box-sizing: border-box; border: 1px solid #3b4859; border-radius: 6px; padding: 9px 10px; background: #182232; color: #f8fafc; font: inherit; }
    .emu-controls button { width: 100%; margin: 0; padding: 10px; font-size: 12px; background: #1d2938; color: #f3f6fb; border: 1px solid #354457; }
    .emu-controls button.active { background: var(--amber); color: #111; border-color: var(--amber); }
    .emu-stage { overflow: auto; padding: 12px; background: #070a0e; border: 1px solid #2c3849; border-radius: 8px; }
    .emu-wrap { position: relative; width: min(100%, 1024px); aspect-ratio: 2 / 1; background: #000; }
    #ledCanvas { width: 100%; height: 100%; display: block; background: #000; }
    .emu-meta { margin-top: 10px; color: #aeb8c5; font-size: 12px; }
    a { color: #2f6fbd; text-decoration: none; }
    a:hover { text-decoration: underline; }
    #map { height: 330px; min-height: 330px; margin-top: 12px; border: 1px solid #2c3849; border-radius: 8px; overflow: hidden; filter: saturate(.78) contrast(1.05); }
    @media (max-width: 820px) {
      .shell { display: block; min-height: 100vh; }
      aside { max-height: none; overflow: visible; border-right: 0; border-bottom: 1px solid #273345; box-shadow: none; }
      .workbench { min-height: 0; }
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
        <div class="eyebrow">Display control</div>
        <h1>Flight Display</h1>
        <p>Velg område, lysstyrke og hvordan skjermen skal oppføre seg. Live-data hentes bare når du trykker på en hent-knapp eller starter display-test.</p>
      </header>
      <section class="card">
        <div class="section-head">
          <h2>Sted og flyplass</h2>
          <span class="hint" tabindex="0" data-tip="Dette bestemmer hvor skjermen leter etter fly, og hvilken flyplass som brukes til avgangs- og ankomsttavlen.">i</span>
        </div>
        <p class="section-note">Sett nålen på kartet, velg radius rundt hjemmet ditt og hvilken flyplass tidstabellen skal vise.</p>
        <label for="label">Navn på stedet</label>
        <input id="label" autocomplete="off" placeholder="Home">
        <div class="row">
          <div>
            <label for="homeAirport">Flyplass for tavle</label>
            <input id="homeAirport" maxlength="4" placeholder="OSL">
            <div class="field-help">Bruk IATA-kode, for eksempel OSL.</div>
          </div>
          <div>
            <label for="timezone">Lokal tid</label>
            <input id="timezone" placeholder="Europe/Oslo">
            <div class="field-help">Brukes til klokke, nattmodus og rutetider.</div>
          </div>
        </div>
        <div class="row">
          <div>
            <label for="lat">Breddegrad</label>
            <input id="lat" inputmode="decimal">
          </div>
          <div>
            <label for="lon">Lengdegrad</label>
            <input id="lon" inputmode="decimal">
          </div>
        </div>
        <div class="row">
          <div>
            <label for="radius">Søkeområde i km</label>
            <input id="radius" type="number" min="1" max="250" step="1">
          </div>
        </div>
        <button id="locate" class="secondary">Bruk min posisjon</button>
        <section id="map" aria-label="Kart"></section>
      </section>
      <section class="card">
        <div class="section-head">
          <h2>Skjerm</h2>
          <span class="hint" tabindex="0" data-tip="Dette styrer selve panelet: om det er på, hvor sterkt det lyser, hvor ofte skjermen henter data, og når nattmodus stopper betalte FR24-kall.">i</span>
        </div>
        <p class="section-note">Nattmodus med 0% natt-lysstyrke stopper henting fra FR24, slik at displayet ikke bruker credits mens ingen ser på.</p>
        <div class="toggle-row">
          <label for="deviceEnabled">Skjermen er på</label>
          <input id="deviceEnabled" type="checkbox">
        </div>
        <div class="row">
          <div>
            <label for="deviceBrightness">Lysstyrke</label>
            <input id="deviceBrightness" type="number" min="1" max="100" step="1">
          </div>
          <div>
            <label for="pollSeconds">Hent nye flydata hvert</label>
            <input id="pollSeconds" type="number" min="30" max="900" step="5">
            <div class="field-help">Sekunder mellom hver henting når skjermen er aktiv.</div>
          </div>
        </div>
        <div class="row">
          <div>
            <label for="configRefreshSeconds">Sjekk innstillinger hvert</label>
            <input id="configRefreshSeconds" type="number" min="60" max="3600" step="30">
            <div class="field-help">Hvor ofte skjermen spør Worker om nye innstillinger.</div>
          </div>
          <div>
            <label for="nightBrightness">Lysstyrke om natten</label>
            <input id="nightBrightness" type="number" min="0" max="100" step="1">
            <div class="field-help">Sett 0 for å stoppe visning og FR24-henting om natten.</div>
          </div>
        </div>
        <div class="toggle-row">
          <label for="nightEnabled">Bruk nattmodus</label>
          <input id="nightEnabled" type="checkbox">
        </div>
        <div class="row">
          <div>
            <label for="nightStart">Natt starter</label>
            <input id="nightStart" type="time">
          </div>
          <div>
            <label for="nightEnd">Natt slutter</label>
            <input id="nightEnd" type="time">
          </div>
        </div>
      </section>
      <section class="card">
        <div class="section-head">
          <h2>Fly</h2>
          <span class="hint" tabindex="0" data-tip="Dette gjelder skjermen som viser fly i nærheten eller et flightnummer du følger. Follow-visningen bytter automatisk mellom live tall og Flying over.">i</span>
        </div>
        <p class="section-note">Når du følger et flightnummer, viser skjermen status før avgang, live-målinger i 10 sekunder, Flying over i 5 sekunder, og Landed når flyet har landet.</p>
        <div class="toggle-row">
          <div>
            <label for="airspaceMonitoringEnabled">Overvåk luftrommet</label>
            <div class="field-help">Når denne er av, henter Worker ikke live flydata. Tidstabell fra Avinor vises fortsatt.</div>
          </div>
          <input id="airspaceMonitoringEnabled" type="checkbox">
        </div>
        <label for="liveDataSource">Kilde for live flydata</label>
        <select id="liveDataSource">
          <option value="fr24">Flightradar24</option>
          <option value="opensky">OpenSky Network</option>
        </select>
        <div class="field-help">OpenSky er samme posisjonskilde som originalprosjektet. Den gir færre rute-/navnedata, men bruker ikke FR24-credits.</div>
        <div class="toggle-row">
          <label for="followEnabled">Følg flightnummer</label>
          <input id="followEnabled" type="checkbox">
        </div>
        <label for="followFlights">Flightnummer</label>
        <input id="followFlights" autocomplete="off" placeholder="SK4673, DY1304, DOC45">
        <div class="field-help">La stå av for å vise fly i området. Skru på for å følge bestemte fly.</div>
        <div class="subhead">Integrasjoner</div>
        <div class="field-help" id="aviationstackStatus">Aviationstack: sjekker secret...</div>
        <div class="subhead">Live-målinger</div>
        <div class="row">
          <div>
            <label for="altitudeUnit">Høyde vises som</label>
            <select id="altitudeUnit">
              <option value="ft">ft</option>
              <option value="fl">FL</option>
              <option value="m">m</option>
              <option value="km">km</option>
              <option value="nmi">nmi</option>
            </select>
          </div>
          <div>
            <label for="speedUnit">Fart vises som</label>
            <select id="speedUnit">
              <option value="kn">kn</option>
              <option value="mph">mph</option>
              <option value="kmh">km/h</option>
              <option value="ms">m/s</option>
              <option value="mach">mach</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div>
            <label for="trackUnit">Retning vises som</label>
            <select id="trackUnit">
              <option value="deg">degrees</option>
              <option value="cardinal">cardinal</option>
            </select>
          </div>
          <div>
            <label for="verticalRateUnit">Stigning/synk vises som</label>
            <select id="verticalRateUnit">
              <option value="fpm">fpm</option>
              <option value="fts">ft/s</option>
              <option value="ms">m/s</option>
              <option value="mph">mph</option>
              <option value="kmh">km/h</option>
            </select>
          </div>
        </div>
        <div class="subhead">Oppførsel</div>
        <div class="row">
          <div>
            <label for="cycleSeconds">Bytt fly etter sekunder</label>
            <input id="cycleSeconds" type="number" min="2" max="30" step="1">
            <div class="field-help">Gjelder når flere fly vises samtidig.</div>
          </div>
          <div>
            <label for="scrollSpeed">Scrollhastighet</label>
            <input id="scrollSpeed" type="number" min="2" max="30" step="1">
            <div class="field-help">Hvor fort lang tekst beveger seg.</div>
          </div>
        </div>
        <div class="subhead">Farger for flyvisning</div>
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
            <label for="progressColor">Bytte-linje</label>
            <input id="progressColor" type="color">
          </div>
        </div>
      </section>
      <section class="card">
        <div class="section-head">
          <h2>Tidstabell</h2>
          <span class="hint" tabindex="0" data-tip="Dette gjelder skjermen som vises når det ikke er fly i området. Data kommer fra Avinor og bruker ikke FR24-credits.">i</span>
        </div>
        <p class="section-note">Viser avganger og ankomster fra valgt flyplass. Tavlen ruller automatisk hvis det er mer enn fire rader.</p>
        <div class="row">
          <div>
            <label for="timetableCycleSeconds">Hold hver tavleside i sekunder</label>
            <input id="timetableCycleSeconds" type="number" min="2" max="60" step="1">
          </div>
          <div>
            <label for="timetableScrollSpeed">Rullehastighet</label>
            <input id="timetableScrollSpeed" type="number" min="4" max="40" step="1">
          </div>
        </div>
        <div class="row">
          <div>
            <label for="timetableItemCount">Antall fly på tavlen</label>
            <input id="timetableItemCount" type="number" min="4" max="40" step="4">
            <div class="field-help">Skjermen viser fire rader om gangen.</div>
          </div>
          <div>
            <label for="avinorWindowHours">Se så mange timer frem</label>
            <input id="avinorWindowHours" type="number" min="1" max="24" step="1">
          </div>
        </div>
        <div class="subhead">Farger for tidstabell</div>
        <div class="color-grid">
          <div>
            <label for="timetableHeaderColor">Overskrift</label>
            <input id="timetableHeaderColor" type="color">
          </div>
          <div>
            <label for="timetableDataColor">Vanlig tekst</label>
            <input id="timetableDataColor" type="color">
          </div>
          <div>
            <label for="timetableNewTimeColor">Ny tid</label>
            <input id="timetableNewTimeColor" type="color">
          </div>
          <div>
            <label for="timetableCanceledColor">Kansellert</label>
            <input id="timetableCanceledColor" type="color">
          </div>
        </div>
      </section>
      <div class="savebar">
        <button id="save">Lagre alle innstillinger</button>
        <div id="status" class="status"></div>
      </div>
      <details class="links-wrap">
        <summary>Avansert: API-lenker</summary>
        <div class="links">
          <a href="/api/config" target="_blank">Config</a>
          <a href="/api/device-config" target="_blank">Device config</a>
          <a href="/api/flights" target="_blank">Flights</a>
          <a href="/api/display" target="_blank">Display</a>
          <a href="/api/avinor-board" target="_blank">Avinor board</a>
        </div>
      </details>
      <section class="preview card" aria-label="Display preview">
        <div class="preview-head">
          <h2>Display-data</h2>
          <div class="preview-actions">
            <button id="refreshAvinor" type="button">Hent Avinor</button>
            <button id="refresh" type="button">Hent data</button>
          </div>
        </div>
        <div id="previewMeta" class="meta"></div>
        <div id="flightList" class="flight-list"></div>
        <div id="avinorRaw" class="raw-board"></div>
      </section>
    </aside>
    <div class="workbench">
      <section class="emulator" aria-label="LED matrix emulator">
        <h2>128 x 64 emulator</h2>
        <p>Forhåndsvis nøyaktig 128 x 64 LED-layout. Lysstyrke, farger, rotasjon og scroll styres fra innstillingene til venstre.</p>
        <div class="emu-controls">
          <div>
            <label for="emuSource">Preview-kilde</label>
            <select id="emuSource">
              <option value="live">Live data</option>
              <option value="upload">Logo test</option>
            </select>
          </div>
          <div>
            <label for="imageUpload">Logo 42 x 42 PNG</label>
            <input id="imageUpload" type="file" accept="image/*">
          </div>
          <div>
            <label for="emuPolling">Display-test</label>
            <button id="emuPolling" type="button">Start test</button>
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
      airspaceMonitoringEnabled: document.querySelector("#airspaceMonitoringEnabled"),
      liveDataSource: document.querySelector("#liveDataSource"),
      followEnabled: document.querySelector("#followEnabled"),
      followFlights: document.querySelector("#followFlights"),
      aviationstackStatus: document.querySelector("#aviationstackStatus"),
      altitudeUnit: document.querySelector("#altitudeUnit"),
      speedUnit: document.querySelector("#speedUnit"),
      trackUnit: document.querySelector("#trackUnit"),
      verticalRateUnit: document.querySelector("#verticalRateUnit"),
      deviceEnabled: document.querySelector("#deviceEnabled"),
      deviceBrightness: document.querySelector("#deviceBrightness"),
      nightBrightness: document.querySelector("#nightBrightness"),
      pollSeconds: document.querySelector("#pollSeconds"),
      cycleSeconds: document.querySelector("#cycleSeconds"),
      timetableCycleSeconds: document.querySelector("#timetableCycleSeconds"),
      timetableItemCount: document.querySelector("#timetableItemCount"),
      avinorWindowHours: document.querySelector("#avinorWindowHours"),
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
      refreshAvinor: document.querySelector("#refreshAvinor"),
      previewMeta: document.querySelector("#previewMeta"),
      flightList: document.querySelector("#flightList"),
      avinorRaw: document.querySelector("#avinorRaw"),
      emuSource: document.querySelector("#emuSource"),
      emuPolling: document.querySelector("#emuPolling"),
      imageUpload: document.querySelector("#imageUpload"),
      ledCanvas: document.querySelector("#ledCanvas"),
      emuMeta: document.querySelector("#emuMeta")
    };

    let map;
    let marker;
    let circle;
    let uploadedImage = null;
    let displayFlights = [];
    let displayMode = "idle";
    let idleScreens = [];
    let currentFlightIndex = 0;
    let currentIdleScreenIndex = 0;
    let flightCycleTimer = null;
    let flightCycleStartedAt = performance.now();
    let tickerAnimationFrame = null;
    let tickerStartedAt = performance.now();
    let emulatorPollTimer = null;
    let emulatorPolling = false;
    let emulatorPollInFlight = false;
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
      setTimeout(() => map.invalidateSize(), 0);
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
      document.querySelectorAll("aside input, aside select").forEach((input) => {
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
      const follow = config.follow || {};
      els.airspaceMonitoringEnabled.checked = device.airspaceMonitoringEnabled !== false;
      els.liveDataSource.value = device.liveDataSource || "fr24";
      els.followEnabled.checked = follow.enabled === true;
      els.followFlights.value = Array.isArray(follow.flights) ? follow.flights.join(", ") : "";
      els.aviationstackStatus.textContent = config.aviationstackApiKeyConfigured
        ? "Aviationstack: Worker secret AVIATIONSTACK_API_KEY er satt"
        : "Aviationstack: legg inn AVIATIONSTACK_API_KEY under Cloudflare Worker Secrets";
      const followUnits = device.followUnits || {};
      els.altitudeUnit.value = followUnits.altitude || "ft";
      els.speedUnit.value = followUnits.speed || "kn";
      els.trackUnit.value = followUnits.track || "deg";
      els.verticalRateUnit.value = followUnits.verticalRate || "fpm";
      els.deviceEnabled.checked = device.enabled !== false;
      els.deviceBrightness.value = device.brightness ?? 80;
      els.nightBrightness.value = night.brightness ?? 0;
      els.pollSeconds.value = device.pollSeconds ?? 90;
      els.cycleSeconds.value = device.displayCycleSeconds ?? 5;
      els.timetableCycleSeconds.value = device.timetableCycleSeconds ?? 7;
      els.timetableItemCount.value = device.timetableItemCount ?? 8;
      els.avinorWindowHours.value = device.avinorWindowHours ?? 4;
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
        follow: {
          enabled: els.followEnabled.checked,
          flights: els.followFlights.value
            .split(/[,\s]+/)
            .map((value) => value.trim().toUpperCase())
            .filter(Boolean)
            .slice(0, 3)
        },
        device: {
          enabled: els.deviceEnabled.checked,
          airspaceMonitoringEnabled: els.airspaceMonitoringEnabled.checked,
          liveDataSource: els.liveDataSource.value,
          brightness: Number(els.deviceBrightness.value),
          pollSeconds: Number(els.pollSeconds.value),
          displayCycleSeconds: Number(els.cycleSeconds.value),
          timetableCycleSeconds: Number(els.timetableCycleSeconds.value),
          timetableItemCount: Number(els.timetableItemCount.value),
          avinorWindowHours: Number(els.avinorWindowHours.value),
          timetableScrollPixelsPerSecond: Number(els.timetableScrollSpeed.value),
          scrollPixelsPerSecond: Number(els.scrollSpeed.value),
          configRefreshSeconds: Number(els.configRefreshSeconds.value),
          timezone: els.timezone.value.trim(),
          followUnits: {
            altitude: els.altitudeUnit.value,
            speed: els.speedUnit.value,
            track: els.trackUnit.value,
            verticalRate: els.verticalRateUnit.value
          },
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
    els.refreshAvinor.addEventListener("click", loadAvinorRawOnly);
    els.emuPolling.addEventListener("click", () => setEmulatorPolling(!emulatorPolling));
    els.emuSource.addEventListener("change", () => {
      resetFlightCycle();
      renderEmulator();
    });
    els.imageUpload.addEventListener("change", handleImageUpload);
    [
      els.deviceBrightness,
      els.scrollSpeed,
      els.timetableScrollSpeed,
      els.altitudeUnit,
      els.speedUnit,
      els.trackUnit,
      els.verticalRateUnit,
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

    function setEmulatorPolling(enabled) {
      emulatorPolling = enabled;
      if (emulatorPollTimer) {
        clearTimeout(emulatorPollTimer);
        emulatorPollTimer = null;
      }
      els.emuPolling.classList.toggle("active", enabled);
      els.emuPolling.textContent = enabled ? "Stopp test" : "Start test";
      if (enabled) {
        els.emuSource.value = "live";
        runEmulatorPoll();
      }
    }

    async function runEmulatorPoll() {
      if (!emulatorPolling || emulatorPollInFlight) return;
      emulatorPollInFlight = true;
      els.emuPolling.textContent = "Henter...";
      try {
        await loadPreview();
      } finally {
        emulatorPollInFlight = false;
        if (!emulatorPolling) return;
        els.emuPolling.textContent = "Stopp test";
        const seconds = Math.max(30, Number(els.pollSeconds.value || 90));
        emulatorPollTimer = setTimeout(runEmulatorPoll, seconds * 1000);
      }
    }

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
        displayMode = data.mode || (flights.length ? "nearby" : "idle");
        idleScreens = Array.isArray(data.idleScreens) ? data.idleScreens : [];
        displayFlights = flights;
        currentFlightIndex = 0;
        currentIdleScreenIndex = 0;
        resetFlightCycle();
        renderEmulator();
        const liveSource = data.device?.liveDataSource === "opensky" ? "OpenSky" : "FR24";
        const sourceError = data.liveSourceStatus && data.liveSourceStatus.ok === false ? data.liveSourceStatus.error : "";
        const liveState = data.airspaceMonitoring === false
          ? "live av"
          : sourceError
            ? liveSource + " feilet"
            : liveSource + " på";
        els.previewMeta.textContent = "Oppdatert " + new Date(data.updatedAt).toLocaleTimeString() + " · " + flights.length + " treff · " + displayMode + " · " + liveState;
        if (sourceError) {
          els.previewMeta.textContent += " · " + sourceError;
        }
        if (!flights.length) {
          if (idleScreens.length) {
            els.flightList.innerHTML = idleScreens.map((screen) => {
              const rows = Array.isArray(screen.rows) ? screen.rows : [];
              return '<article class="flight"><strong>' + escapeHtml(screen.title || "Airport") + '</strong><span>' + rows.map(formatIdleRow).map(escapeHtml).join("<br>") + '</span></article>';
            }).join("");
          } else {
            els.flightList.innerHTML = '<div class="empty">Ingen fly i valgt radius akkurat nå, eller live-kilde/Avinor svarte uten matchende data.</div>';
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
            flight.gate ? "Gate " + flight.gate : "",
            flight.gateMessage || "",
            flight.status && flight.status !== "scheduled" ? flight.status : "",
            flight.source || "",
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

    async function loadAvinorRawOnly() {
      els.previewMeta.textContent = "Henter Avinor...";
      els.flightList.innerHTML = "";
      els.avinorRaw.innerHTML = "";
      try {
        const avinorRes = await fetch("/api/avinor-board?ts=" + Date.now());
        const avinorData = await avinorRes.json();
        if (!avinorRes.ok) throw new Error(avinorData.error || "Kunne ikke hente Avinor-data");
        renderAvinorRaw(avinorData);
        const count = (Array.isArray(avinorData.departures) ? avinorData.departures.length : 0) + (Array.isArray(avinorData.arrivals) ? avinorData.arrivals.length : 0);
        els.previewMeta.textContent = "Avinor oppdatert " + new Date(avinorData.updatedAt).toLocaleTimeString() + " · " + count + " rader";
        els.flightList.innerHTML = '<div class="empty">Kun Avinor-data hentet. Dette bruker ikke FR24.</div>';
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
          drawFlightProgress(sourceCtx, flight);
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
      if (displayMode === "follow") {
        drawFollowFlightText(ctx, flight);
        els.emuMeta.textContent = "Follow layout: " + (flight.flt || flight.cs || "flight") + " · live metrics når FR24 har posisjon.";
        return;
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

    function drawFollowFlightText(ctx, flight) {
      const colors = getLineColors();
      const route = (flight.lines && flight.lines.route) || [flight.from, flight.to].filter(Boolean).join("-");
      const topLine = flight.flt || flight.cs || "";
      const secondLine = route || flight.air || flight.airCode || "";
      const thirdLine = flight.ac || flight.reg || "";
      drawDotText(ctx, topLine, 50, 5, colors.airline, { maxWidth: 75 });
      drawDotText(ctx, secondLine, 50, 19, colors.route, { maxWidth: 75 });
      drawDotText(ctx, thirdLine, 50, 33, colors.aircraft, { maxWidth: 75 });
      if (flight.followStatus) {
        const statusColor = flight.followStatus.color === "landed" ? "#00d46a" : getTimetableColors().header;
        drawTickerLine(ctx, flight.followStatus.text || "", 3, 47, statusColor, 122);
        drawTickerLine(ctx, flight.followStatus.detail || "", 3, 56, statusColor, 122);
        return;
      }
      if (getFollowDetailPhase() === "location") {
        drawDotText(ctx, flight.locationLabel || "Flying over", 3, 47, colors.context, { maxWidth: 122 });
        drawTickerLine(ctx, flight.locationValue || "Unknown area", 3, 56, colors.context, 122);
        return;
      }
      const metrics = formatMetricsForEmulator(flight);
      const firstMetricLine = [
        metrics.altitude ? "ALT:" + metrics.altitude : "",
        metrics.speed ? "SPD:" + metrics.speed : ""
      ].filter(Boolean).join(" ");
      const secondMetricLine = [
        metrics.track ? "TRK:" + metrics.track : "",
        metrics.verticalRate ? "VR:" + metrics.verticalRate : ""
      ].filter(Boolean).join(" ");
      drawTickerLine(ctx, firstMetricLine || "NO LIVE METRICS", 3, 47, colors.context, 122);
      drawTickerLine(ctx, secondMetricLine, 3, 56, colors.context, 122);
    }

    function getFollowDetailPhase() {
      const elapsed = Math.max(0, performance.now() - flightCycleStartedAt);
      return elapsed % 15000 < 10000 ? "metrics" : "location";
    }

    function formatMetricsForEmulator(flight) {
      return {
        altitude: formatAltitudeForEmulator(flight.alt, els.altitudeUnit.value),
        speed: formatSpeedForEmulator(flight.spd, els.speedUnit.value),
        track: formatTrackForEmulator(flight.trk, els.trackUnit.value),
        verticalRate: formatVerticalRateForEmulator(flight.vr, els.verticalRateUnit.value)
      };
    }

    function formatAltitudeForEmulator(value, unit) {
      if (value === null || value === undefined || value === "") return "";
      if (unit === "fl") return "FL" + Math.round(value / 100);
      if (unit === "m") return Math.round(value * 0.3048) + "m";
      if (unit === "km") return roundOne(value * 0.0003048) + "km";
      if (unit === "nmi") return roundOne(value / 6076.12) + "nmi";
      return Math.round(value) + "ft";
    }

    function formatSpeedForEmulator(value, unit) {
      if (value === null || value === undefined || value === "") return "";
      if (unit === "mph") return Math.round(value * 1.15078) + "mph";
      if (unit === "kmh") return Math.round(value * 1.852) + "kmh";
      if (unit === "ms") return Math.round(value * 0.514444) + "m/s";
      if (unit === "mach") return "M" + (Math.round((value / 661.47) * 100) / 100).toFixed(2);
      return Math.round(value) + "kn";
    }

    function formatTrackForEmulator(value, unit) {
      if (value === null || value === undefined || value === "") return "";
      const heading = ((Math.round(value) % 360) + 360) % 360;
      if (unit === "cardinal") return headingToCardinalForEmulator(heading);
      return heading + "deg";
    }

    function formatVerticalRateForEmulator(value, unit) {
      if (value === null || value === undefined || value === "") return "";
      if (unit === "fts") return roundOne(value / 60) + "ft/s";
      if (unit === "ms") return roundOne(value * 0.00508) + "m/s";
      if (unit === "mph") return roundOne(value * 0.0113636) + "mph";
      if (unit === "kmh") return roundOne(value * 0.018288) + "kmh";
      return Math.round(value) + "fpm";
    }

    function headingToCardinalForEmulator(heading) {
      const points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
      return points[Math.round(heading / 22.5) % 16];
    }

    function roundOne(value) {
      return (Math.round(value * 10) / 10).toString();
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
      drawDotText(ctx, title, 3, 3, colors.header, { maxWidth: 86 });
      drawLocalClock(ctx, 125, 3, colors.data);
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
      const gateStatusText = kind === "departures" ? normalizeGateStatusForDisplay(row.gateMessage) : "";
      const arrivalStatusText = kind === "arrivals" && status === "done" ? "Landed" : "";
      const gateText = kind === "departures" && row.gate ? row.gate : "";
      const airportText = kind === "departures" && gateText && !gateBlinkOn ? gateText : row.airport || "";
      const timeColor = status === "canceled" ? colors.canceled : status === "newTime" ? colors.newTime : colors.data;
      const rowColor = status === "canceled" ? colors.canceled : colors.data;
      const alternateTimeText = gateStatusText || arrivalStatusText;
      const timeText = alternateTimeText && !gateBlinkOn ? alternateTimeText : row.time || "";
      const activeTimeColor = alternateTimeText && !gateBlinkOn ? colors.data : timeColor;
      drawDotText(ctx, row.flightId || "", x, y, rowColor, { maxWidth: 43 });
      drawDotText(ctx, airportText, x + 48, y, rowColor, { maxWidth: 24 });
      drawDotTextRight(ctx, timeText, 125, y, activeTimeColor, 60);
      if (status === "canceled") {
        ctx.fillStyle = colors.canceled;
        ctx.fillRect(x, y + 3, 122, 1);
      }
    }

    function normalizeGateStatusForDisplay(value) {
      const raw = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (!raw) return "";
      if (raw.includes("gotogate")) return "To gate";
      if (raw.includes("boarding")) return "Boarding";
      if (raw.includes("closing")) return "Closing";
      if (raw.includes("closed")) return "Closed";
      return "";
    }

    function drawLocalClock(ctx, rightX, y, color) {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: els.timezone.value || "Europe/Oslo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).formatToParts(now);
      const hour = parts.find((part) => part.type === "hour")?.value || "00";
      const minute = parts.find((part) => part.type === "minute")?.value || "00";
      const second = Number(parts.find((part) => part.type === "second")?.value || "0");
      drawDotTextRight(ctx, hour + (second % 2 === 0 ? ":" : " ") + minute, rightX, y, color, 32);
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

    function drawFlightProgress(ctx, flight) {
      if (els.emuSource.value !== "live") return;
      ensureTickerAnimation();
      if (displayMode === "follow" && flight && !flight.followStatus && typeof flight.routeProgress === "number") {
        drawRouteProgressValue(ctx, flight.routeProgress);
        return;
      }
      if (displayFlights.length <= 1) return;
      const cycleMs = Math.max(2000, Number(els.cycleSeconds.value || 5) * 1000);
      drawCycleProgress(ctx, cycleMs);
    }

    function drawCycleProgress(ctx, cycleMs) {
      const elapsed = Math.max(0, performance.now() - flightCycleStartedAt);
      const progress = Math.min(1, elapsed / cycleMs);
      drawProgressValue(ctx, progress);
    }

    function drawProgressValue(ctx, progress) {
      const width = Math.max(1, Math.min(122, Math.round(122 * progress)));
      ctx.fillStyle = "#07101c";
      ctx.fillRect(3, 0, 122, 1);
      ctx.fillStyle = getLineColors().progress;
      ctx.fillRect(3, 0, width, 1);
    }

    function drawRouteProgressValue(ctx, progress) {
      const width = Math.max(1, Math.min(122, Math.round(122 * progress)));
      ctx.fillStyle = "#3c3c3c";
      ctx.fillRect(3, 0, 122, 1);
      ctx.fillStyle = "#00d46a";
      ctx.fillRect(3, 0, width, 1);
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
      return normalizeLedText(text).length * 6;
    }

    function drawDotTextRight(ctx, text, rightX, y, color, maxWidth) {
      const value = normalizeLedText(text);
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
      for (const char of normalizeLedText(text).toUpperCase().slice(0, maxChars)) {
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

    function normalizeLedText(value) {
      return String(value || "")
        .replace(/[æÆåÅ]/g, "a")
        .replace(/[øØöÖóÓòÒôÔ]/g, "o")
        .replace(/[üÜúÚùÙûÛ]/g, "u")
        .replace(/[äÄáÁàÀâÂ]/g, "a")
        .replace(/[éÉèÈêÊëË]/g, "e")
        .replace(/[íÍìÌîÎïÏ]/g, "i")
        .replace(/[çÇ]/g, "c")
        .replace(/[ñÑ]/g, "n");
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

function firstBoolean(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value !== 0;
    if (typeof value === "string" && value.trim()) {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "y", "1"].includes(normalized)) return true;
      if (["false", "no", "n", "0"].includes(normalized)) return false;
    }
  }
  return undefined;
}

function firstDateString(record: Record<string, unknown>, keys: string[], paths: string[][] = []): string | undefined {
  for (const key of keys) {
    const parsed = parseDateValue(record[key]);
    if (parsed) return parsed;
  }
  for (const path of paths) {
    const parsed = parseDateValue(nestedValue(record, path));
    if (parsed) return parsed;
  }
  return undefined;
}

function nestedValue(record: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = record;
  for (const part of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function parseDateValue(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d+$/.test(trimmed)) return parseDateValue(Number(trimmed));
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
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
