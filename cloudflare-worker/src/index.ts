export interface Env {
  FLIGHT_DISPLAY_KV: KVNamespace;
  REALTIME_HUB?: DurableObjectNamespace;
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
  ADMIN_API_TOKEN?: string;
  DEVICE_API_TOKEN?: string;
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
  displayMode: "flight" | "clock";
  airspaceMonitoringEnabled: boolean;
  allowedAircraftCategories: AircraftCategoryCode[];
  brightness: number;
  audioVolumePercent: number;
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
    routeProgress: string;
  };
  clockColor: string;
  timetableColors: {
    header: string;
    data: string;
    time: string;
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

type ScreenState = {
  active: boolean;
  brightnessMode: "day" | "night";
  lastActivatedAt: string | null;
  lastDeactivatedAt: string | null;
  lastBrightnessModeChangedAt: string | null;
  updatedAt: string | null;
  source: string | null;
};

type SoundState = {
  testNonce: number;
  lastTriggeredAt: string | null;
  source: string | null;
};

type AircraftCategoryCode = "P" | "C" | "M" | "J" | "T" | "H" | "B" | "G" | "D" | "V" | "O" | "N";

type RealtimeEvent = {
  type: "hello" | "config_changed" | "display_changed" | "sound_test";
  updatedAt: string;
  source?: string;
  testNonce?: number;
  volumePercent?: number;
};

type DisplayFlight = {
  fr24Id?: string;
  callsign?: string;
  flight?: string;
  airline?: string;
  airlineCode?: string;
  aircraft?: string;
  category?: AircraftCategoryCode;
  categoryName?: string;
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
  source?: "fr24" | "avinor" | "aviationstack";
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
  source: "fr24";
  ok: boolean;
  error?: string;
};

type ClockPayload = {
  style: "gorgy";
  timezone: string;
  color: string;
  width: number;
  height: number;
  centered: boolean;
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

type AviationstackRawResponse = {
  request: {
    url: string;
    flight: string;
    flightParam: "flight_iata" | "flight_icao";
    limit: string;
  };
  status: number;
  ok: boolean;
  contentType: string;
  body: unknown;
};

type IdleRow = {
  flightId: string;
  airport: string;
  time: string;
  status: "scheduled" | "newTime" | "canceled" | "done" | "empty";
  gate?: string;
  gateMessage?: string;
  message?: string;
};

type IdleScreen = {
  title: "DEPARTURES" | "ARRIVALS";
  kind: "departures" | "arrivals";
  rows: IdleRow[];
};

const CONFIG_KEY = "config:v1";
const SCREEN_STATE_KEY = "screen-state:v1";
const SOUND_STATE_KEY = "sound-state:v1";
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

const AIRCRAFT_CATEGORY_LABELS: Record<AircraftCategoryCode, string> = {
  P: "PASSENGER",
  C: "CARGO",
  M: "MILITARY_AND_GOVERNMENT",
  J: "BUSINESS_JETS",
  T: "GENERAL_AVIATION",
  H: "HELICOPTERS",
  B: "LIGHTER_THAN_AIR",
  G: "GLIDERS",
  D: "DRONES",
  V: "GROUND_VEHICLES",
  O: "OTHER",
  N: "NON_CATEGORIZED"
};

const DEFAULT_ALLOWED_AIRCRAFT_CATEGORIES: AircraftCategoryCode[] = ["P", "C", "M", "J", "H", "B", "G", "D", "V", "O", "N"];

export class RealtimeHub implements DurableObject {
  constructor(private state: DurableObjectState, private env: Env) {
    void this.env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === "/broadcast" && request.method === "POST") {
      const event = await request.json<RealtimeEvent>();
      this.broadcast(event);
      return jsonResponse({ ok: true, sessions: this.state.getWebSockets().length }, 200, { "Cache-Control": "no-store" });
    }

    return jsonResponse({ error: "Not found" }, 404);
  }

  async webSocketMessage(socket: WebSocket, message: ArrayBuffer | string): Promise<void> {
    void socket;
    void message;
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    socket.close();
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    socket.close();
  }

  private broadcast(event: RealtimeEvent): void {
    for (const socket of this.state.getWebSockets()) {
      this.send(socket, event);
    }
  }

  private send(socket: WebSocket, event: RealtimeEvent): void {
    try {
      socket.send(JSON.stringify(event));
    } catch {
      try {
        socket.close();
      } catch {
        // Already closed.
      }
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      const authFailure = authorizeRequest(request, env, url.pathname);
      if (authFailure) return authFailure;

      if (url.pathname === "/") return htmlResponse(renderIndexHtml());
      if (url.pathname === "/pixel-editor") return htmlResponse(renderPixelEditorHtml());
      if (url.pathname === "/public/realtime") return realtimeResponse(request, env);
      if (url.pathname === "/public/realtime-state" && request.method === "GET") return realtimeStateResponse(env);
      if (url.pathname === "/public/device-config" && request.method === "GET") return deviceConfigResponse(env);
      if (url.pathname === "/public/sound-state" && request.method === "GET") return soundStateResponse(env);
      if (url.pathname === "/public/display" && request.method === "GET") return flightsResponse(env, true);
      if (url.pathname.startsWith("/public/logos-rgb565/")) return logoRgb565Response(request, env);
      if (url.pathname.startsWith("/public/logos/")) return logoAssetResponse(request, env);
      if (url.pathname.startsWith("/logos-rgb565/")) return logoRgb565Response(request, env);
      if (url.pathname.startsWith("/logos/")) return logoAssetResponse(request, env);
      if (url.pathname === "/api/config" && request.method === "GET") return configResponse(env);
      if (url.pathname === "/api/config" && request.method === "POST") return saveConfig(request, env);
      if (url.pathname === "/api/device-config" && request.method === "GET") return deviceConfigResponse(env);
      if (url.pathname === "/api/realtime-state" && request.method === "GET") return realtimeStateResponse(env);
      if (url.pathname === "/api/sound-state" && request.method === "GET") return soundStateResponse(env);
      if (url.pathname === "/api/logo-status" && request.method === "GET") return logoStatusResponse(env);
      if (url.pathname === "/api/admin/screen-state/toggle" && request.method === "POST") return toggleScreenState(env);
      if (url.pathname === "/api/screen-state" && request.method === "GET") return screenStateResponse(env);
      if (url.pathname === "/api/screen-state" && request.method === "POST") return saveScreenState(request, env);
      if (url.pathname === "/api/screen-state/activate" && request.method === "POST") return writeScreenState(env, { active: true }, "homey-api");
      if (url.pathname === "/api/screen-state/deactivate" && request.method === "POST") return writeScreenState(env, { active: false }, "homey-api");
      if (url.pathname === "/api/display-mode" && request.method === "GET") return displayModeResponse(env);
      if (url.pathname === "/api/display-mode" && request.method === "POST") return saveDisplayMode(request, env);
      if (url.pathname === "/api/display-mode/flight" && request.method === "POST") return writeDisplayMode(env, "flight", "homey-api");
      if (url.pathname === "/api/display-mode/clock" && request.method === "POST") return writeDisplayMode(env, "clock", "homey-api");
      if (url.pathname === "/api/brightness-mode" && request.method === "GET") return brightnessModeResponse(env);
      if (url.pathname === "/api/brightness-mode" && request.method === "POST") return saveBrightnessMode(request, env);
      if (url.pathname === "/api/brightness-mode/day" && request.method === "POST") return writeScreenState(env, { brightnessMode: "day" }, "homey-api");
      if (url.pathname === "/api/brightness-mode/night" && request.method === "POST") return writeScreenState(env, { brightnessMode: "night" }, "homey-api");
      if (url.pathname === "/api/sound-test" && request.method === "POST") return triggerSoundTest(request, env);
      if (url.pathname === "/api/flights" && request.method === "GET") return flightsResponse(env, false);
      if (url.pathname === "/api/display" && request.method === "GET") return flightsResponse(env, true);
      if (url.pathname === "/api/avinor-board" && request.method === "GET") return avinorBoardResponse(env);
      if (url.pathname === "/api/aviationstack" && request.method === "GET") return aviationstackDebugResponse(request, env);
      if (url.pathname === "/api/health") return jsonResponse({ ok: true });

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return jsonResponse({ error: message }, 500);
    }
  }
};

function authorizeRequest(request: Request, env: Env, pathname: string): Response | undefined {
  const adminToken = normalizeSecretString(env.ADMIN_API_TOKEN);
  const deviceToken = normalizeSecretString(env.DEVICE_API_TOKEN);

  if (pathname === "/api/health") return undefined;

  if (adminToken && isAutomationApiPath(pathname) && !requestHasToken(request, adminToken, "X-Flight-Admin-Token")) {
    return jsonResponse({ error: "Unauthorized" }, 401, {
      "Cache-Control": "no-store",
      "WWW-Authenticate": "Bearer"
    });
  }

  if (deviceToken && pathname.startsWith("/public/") && !requestHasToken(request, deviceToken, "X-Flight-Device-Token")) {
    return jsonResponse({ error: "Unauthorized" }, 401, {
      "Cache-Control": "no-store",
      "WWW-Authenticate": "Bearer"
    });
  }

  return undefined;
}

function realtimeResponse(request: Request, env: Env): Response | Promise<Response> {
  if (!env.REALTIME_HUB) {
    return jsonResponse({ error: "REALTIME_HUB is not configured" }, 500, { "Cache-Control": "no-store" });
  }
  const id = env.REALTIME_HUB.idFromName("flight-display-main-v2");
  return env.REALTIME_HUB.get(id).fetch(request);
}

async function broadcastRealtime(env: Env, event: RealtimeEvent): Promise<void> {
  if (!env.REALTIME_HUB) return;
  const id = env.REALTIME_HUB.idFromName("flight-display-main-v2");
  const stub = env.REALTIME_HUB.get(id);
  await stub.fetch("https://realtime.internal/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
}

function isAutomationApiPath(pathname: string): boolean {
  return pathname === "/api/screen-state"
    || pathname.startsWith("/api/screen-state/")
    || pathname === "/api/display-mode"
    || pathname.startsWith("/api/display-mode/")
    || pathname === "/api/brightness-mode"
    || pathname.startsWith("/api/brightness-mode/");
}

function requestHasToken(request: Request, expectedToken: string, headerName: string): boolean {
  const directToken = normalizeSecretString(request.headers.get(headerName) || undefined);
  if (constantTimeEquals(directToken, expectedToken)) return true;

  const authorization = request.headers.get("Authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  return constantTimeEquals(normalizeSecretString(bearer), expectedToken);
}

function constantTimeEquals(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  let diff = a.length ^ b.length;
  const maxLength = Math.max(a.length, b.length);
  for (let i = 0; i < maxLength; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

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

function defaultScreenState(): ScreenState {
  return {
    active: true,
    brightnessMode: "day",
    lastActivatedAt: null,
    lastDeactivatedAt: null,
    lastBrightnessModeChangedAt: null,
    updatedAt: null,
    source: null
  };
}

function normalizeScreenState(value: unknown): ScreenState {
  const v = value && typeof value === "object" ? value as Partial<ScreenState> : {};
  return {
    active: typeof v.active === "boolean" ? v.active : true,
    brightnessMode: v.brightnessMode === "night" ? "night" : "day",
    lastActivatedAt: typeof v.lastActivatedAt === "string" && v.lastActivatedAt ? v.lastActivatedAt : null,
    lastDeactivatedAt: typeof v.lastDeactivatedAt === "string" && v.lastDeactivatedAt ? v.lastDeactivatedAt : null,
    lastBrightnessModeChangedAt: typeof v.lastBrightnessModeChangedAt === "string" && v.lastBrightnessModeChangedAt ? v.lastBrightnessModeChangedAt : null,
    updatedAt: typeof v.updatedAt === "string" && v.updatedAt ? v.updatedAt : null,
    source: typeof v.source === "string" && v.source ? v.source.slice(0, 80) : null
  };
}

function defaultSoundState(): SoundState {
  return {
    testNonce: 0,
    lastTriggeredAt: null,
    source: null
  };
}

function normalizeSoundState(value: unknown): SoundState {
  const v = value && typeof value === "object" ? value as Partial<SoundState> : {};
  return {
    testNonce: typeof v.testNonce === "number" && Number.isFinite(v.testNonce) ? Math.max(0, Math.floor(v.testNonce)) : 0,
    lastTriggeredAt: typeof v.lastTriggeredAt === "string" && v.lastTriggeredAt ? v.lastTriggeredAt : null,
    source: typeof v.source === "string" && v.source ? v.source.slice(0, 80) : null
  };
}

async function getScreenState(env: Env): Promise<ScreenState> {
  const stored = await env.FLIGHT_DISPLAY_KV.get(SCREEN_STATE_KEY, "json");
  return normalizeScreenState(stored);
}

async function getSoundState(env: Env): Promise<SoundState> {
  const stored = await env.FLIGHT_DISPLAY_KV.get(SOUND_STATE_KEY, "json");
  if (!stored) return defaultSoundState();
  return normalizeSoundState(stored);
}

async function triggerSoundTestState(env: Env, source = "api"): Promise<SoundState> {
  const previous = await getSoundState(env);
  const next: SoundState = {
    testNonce: previous.testNonce + 1,
    lastTriggeredAt: new Date().toISOString(),
    source: source.slice(0, 80)
  };
  await env.FLIGHT_DISPLAY_KV.put(SOUND_STATE_KEY, JSON.stringify(next));
  return next;
}

async function writeScreenState(
  env: Env,
  patch: Partial<Pick<ScreenState, "active" | "brightnessMode">>,
  source = "api"
): Promise<Response> {
  const previous = await getScreenState(env);
  const now = new Date().toISOString();
  const active = typeof patch.active === "boolean" ? patch.active : previous.active;
  const brightnessMode = patch.brightnessMode === "night" ? "night" : patch.brightnessMode === "day" ? "day" : previous.brightnessMode;
  const next: ScreenState = {
    active,
    brightnessMode,
    lastActivatedAt: active && !previous.active ? now : previous.lastActivatedAt,
    lastDeactivatedAt: !active && previous.active ? now : previous.lastDeactivatedAt,
    lastBrightnessModeChangedAt: brightnessMode !== previous.brightnessMode ? now : previous.lastBrightnessModeChangedAt,
    updatedAt: now,
    source: source.slice(0, 80)
  };
  await env.FLIGHT_DISPLAY_KV.put(SCREEN_STATE_KEY, JSON.stringify(next));
  await broadcastRealtime(env, {
    type: "config_changed",
    updatedAt: now,
    source: next.source || source
  });
  return jsonResponse(next, 200, { "Cache-Control": "no-store" });
}

async function toggleScreenState(env: Env): Promise<Response> {
  const previous = await getScreenState(env);
  return writeScreenState(env, { active: !previous.active }, "web-admin");
}

async function configResponse(env: Env): Promise<Response> {
  const [config, aviationstackApiKey, screenState, soundState] = await Promise.all([
    getConfig(env),
    getAviationstackApiKey(env),
    getScreenState(env),
    getSoundState(env)
  ]);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  return jsonResponse({
    ...config,
    screenState,
    soundState: {
      ...soundState,
      volumePercent: normalizedDevice.audioVolumePercent
    },
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

  const configUpdatedAt = config.updatedAt || new Date().toISOString();
  await env.FLIGHT_DISPLAY_KV.put(CONFIG_KEY, JSON.stringify(config));
  await broadcastRealtime(env, {
    type: "config_changed",
    updatedAt: configUpdatedAt,
    source: "web-config"
  });
  await broadcastRealtime(env, {
    type: "display_changed",
    updatedAt: configUpdatedAt,
    source: "web-config"
  });
  return configResponse(env);
}

async function deviceConfigResponse(env: Env): Promise<Response> {
  const [config, screenState, soundState] = await Promise.all([getConfig(env), getScreenState(env), getSoundState(env)]);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  const effectiveBrightness = screenState.brightnessMode === "night"
    ? normalizedDevice.nightMode.brightness
    : normalizedDevice.brightness;
  return jsonResponse({
    updatedAt: config.updatedAt || null,
    homeAirportIata: config.homeAirportIata,
    follow: config.follow,
    device: {
      ...normalizedDevice,
      effectiveBrightness,
      effectiveBrightness8: scalePercentTo8Bit(effectiveBrightness),
      brightnessMode: screenState.brightnessMode,
      timezonePosix: timezonePosixForFirmware(config.device?.timezone || "Europe/Oslo")
    },
    screenState,
    audio: {
      testNonce: soundState.testNonce,
      volumePercent: normalizedDevice.audioVolumePercent
    }
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function soundStateResponse(env: Env): Promise<Response> {
  const [soundState, config] = await Promise.all([getSoundState(env), getConfig(env)]);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  return jsonResponse({
    ...soundState,
    volumePercent: normalizedDevice.audioVolumePercent
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function realtimeStateResponse(env: Env): Promise<Response> {
  const [config, screenState, soundState] = await Promise.all([getConfig(env), getScreenState(env), getSoundState(env)]);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  return jsonResponse({
    updatedAt: new Date().toISOString(),
    configVersion: config.updatedAt || "",
    screenVersion: screenState.updatedAt || "",
    soundTestNonce: soundState.testNonce,
    volumePercent: normalizedDevice.audioVolumePercent
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function screenStateResponse(env: Env): Promise<Response> {
  const screenState = await getScreenState(env);
  return jsonResponse(screenState, 200, {
    "Cache-Control": "no-store"
  });
}

async function brightnessModeResponse(env: Env): Promise<Response> {
  const screenState = await getScreenState(env);
  return jsonResponse({
    brightnessMode: screenState.brightnessMode,
    lastBrightnessModeChangedAt: screenState.lastBrightnessModeChangedAt,
    updatedAt: screenState.updatedAt,
    source: screenState.source
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function displayModeResponse(env: Env): Promise<Response> {
  const config = await getConfig(env);
  const device = normalizeDeviceSettings(config.device);
  return jsonResponse({
    displayMode: device.displayMode,
    updatedAt: config.updatedAt || null
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function writeDisplayMode(env: Env, displayMode: DeviceSettings["displayMode"], source = "api"): Promise<Response> {
  const config = await getConfig(env);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  const updatedAt = new Date().toISOString();
  const next: Config = {
    ...config,
    device: {
      ...normalizedDevice,
      displayMode
    },
    updatedAt
  };

  await env.FLIGHT_DISPLAY_KV.put(CONFIG_KEY, JSON.stringify(next));
  await broadcastRealtime(env, {
    type: "config_changed",
    updatedAt,
    source: source.slice(0, 80)
  });
  await broadcastRealtime(env, {
    type: "display_changed",
    updatedAt,
    source: source.slice(0, 80)
  });
  return jsonResponse({
    displayMode,
    updatedAt,
    source: source.slice(0, 80)
  }, 200, { "Cache-Control": "no-store" });
}

async function logoStatusResponse(env: Env): Promise<Response> {
  if (!env.AIRLINE_LOGOS) {
    return jsonResponse({ error: "AIRLINE_LOGOS bucket is not configured" }, 500, {
      "Cache-Control": "no-store"
    });
  }

  const [pngKeys, rgb565Keys] = await Promise.all([
    listR2Keys(env.AIRLINE_LOGOS, ["", "logos/", "airline-logos/"], ".png"),
    listR2Keys(env.AIRLINE_LOGOS, ["rgb565/", "logos-rgb565/", "airline-logos-rgb565/", ""], ".rgb565")
  ]);
  const pngCodes = Array.from(new Set(pngKeys.map(codeFromKey).filter(Boolean))).sort();
  const rgb565Codes = Array.from(new Set(rgb565Keys.map(codeFromKey).filter(Boolean))).sort();
  const rgb565Set = new Set(rgb565Codes);
  const missingRgb565Codes = pngCodes.filter((code) => !rgb565Set.has(code));

  return jsonResponse({
    updatedAt: new Date().toISOString(),
    pngCount: pngCodes.length,
    rgb565Count: rgb565Codes.length,
    missingRgb565Count: missingRgb565Codes.length,
    missingRgb565Codes,
    pngCodes,
    rgb565Codes
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function listR2Keys(bucket: R2Bucket, prefixes: string[], suffix: string): Promise<string[]> {
  const keys = new Set<string>();
  for (const prefix of prefixes) {
    let cursor: string | undefined;
    do {
      const listed = await bucket.list({ prefix, cursor });
      for (const object of listed.objects) {
        if (object.key.toLowerCase().endsWith(suffix.toLowerCase())) keys.add(object.key);
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
  }
  return Array.from(keys);
}

function codeFromKey(key: string): string | undefined {
  const filename = key.split("/").pop() || "";
  const dotIndex = filename.lastIndexOf(".");
  const code = (dotIndex >= 0 ? filename.slice(0, dotIndex) : filename).trim().toUpperCase();
  return /^[A-Z0-9_-]+$/.test(code) ? code : undefined;
}

async function saveScreenState(request: Request, env: Env): Promise<Response> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Expected JSON body" }, 400, { "Cache-Control": "no-store" });
  }

  const active = firstBoolean(body && typeof body === "object" ? body as Record<string, unknown> : {}, ["active", "enabled", "on"]);
  if (active === undefined) {
    return jsonResponse({ error: "Expected boolean field active" }, 400, { "Cache-Control": "no-store" });
  }

  const source = firstString(body && typeof body === "object" ? body as Record<string, unknown> : {}, ["source"]) || "api";
  return writeScreenState(env, { active }, source);
}

async function saveBrightnessMode(request: Request, env: Env): Promise<Response> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Expected JSON body" }, 400, { "Cache-Control": "no-store" });
  }

  const mode = firstString(body && typeof body === "object" ? body as Record<string, unknown> : {}, ["brightnessMode", "mode"]);
  if (mode !== "day" && mode !== "night") {
    return jsonResponse({ error: "Expected brightnessMode or mode to be 'day' or 'night'" }, 400, { "Cache-Control": "no-store" });
  }

  const source = firstString(body && typeof body === "object" ? body as Record<string, unknown> : {}, ["source"]) || "api";
  return writeScreenState(env, { brightnessMode: mode }, source);
}

async function saveDisplayMode(request: Request, env: Env): Promise<Response> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Expected JSON body" }, 400, { "Cache-Control": "no-store" });
  }

  const mode = firstString(body && typeof body === "object" ? body as Record<string, unknown> : {}, ["displayMode", "mode"]);
  if (mode !== "flight" && mode !== "clock") {
    return jsonResponse({ error: "Expected displayMode or mode to be 'flight' or 'clock'" }, 400, { "Cache-Control": "no-store" });
  }

  const source = firstString(body && typeof body === "object" ? body as Record<string, unknown> : {}, ["source"]) || "api";
  return writeDisplayMode(env, mode, source);
}

async function triggerSoundTest(request: Request, env: Env): Promise<Response> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const source = firstString(body && typeof body === "object" ? body as Record<string, unknown> : {}, ["source"]) || "api";
  const [soundState, config] = await Promise.all([triggerSoundTestState(env, source), getConfig(env)]);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  await broadcastRealtime(env, {
    type: "sound_test",
    updatedAt: soundState.lastTriggeredAt || new Date().toISOString(),
    source,
    testNonce: soundState.testNonce,
    volumePercent: normalizedDevice.audioVolumePercent
  });
  return jsonResponse({
    ...soundState,
    volumePercent: normalizedDevice.audioVolumePercent
  }, 200, { "Cache-Control": "no-store" });
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

async function aviationstackDebugResponse(request: Request, env: Env): Promise<Response> {
  const apiKey = getAviationstackApiKey(env);
  if (!apiKey) return jsonResponse({ error: "AVIATIONSTACK_API_KEY secret is not configured" }, 500, { "Cache-Control": "no-store" });

  const url = new URL(request.url);
  const token = normalizeFollowToken(url.searchParams.get("flight") || url.searchParams.get("flight_iata") || url.searchParams.get("flight_icao") || "");
  if (!token) {
    return jsonResponse({
      error: "Missing flight query parameter",
      example: "/api/aviationstack?flight=TP764"
    }, 400, { "Cache-Control": "no-store" });
  }

  const raw = await fetchAviationstackRaw(env, apiKey, token);
  return jsonResponse({
    fetchedAt: new Date().toISOString(),
    ...raw
  }, 200, { "Cache-Control": "no-store" });
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

async function logoRgb565Response(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const filename = url.pathname.split("/").pop() || "";
  if (!/^[A-Za-z0-9_-]+\.rgb565$/.test(filename)) {
    return jsonResponse({ error: "Expected /logos-rgb565/{CODE}.rgb565" }, 400, {
      "Cache-Control": "no-store"
    });
  }

  if (!env.AIRLINE_LOGOS) {
    return jsonResponse({ error: "AIRLINE_LOGOS bucket is not configured" }, 500, {
      "Cache-Control": "no-store"
    });
  }

  const logoObject = await getRgb565LogoObject(env.AIRLINE_LOGOS, filename)
    || (filename.toUpperCase() === "UNKNOWN.RGB565" ? undefined : await getRgb565LogoObject(env.AIRLINE_LOGOS, "UNKNOWN.rgb565"));
  if (!logoObject) {
    return jsonResponse({ error: "RGB565 logo not found" }, 404, {
      "Cache-Control": "no-store"
    });
  }

  const { key, object } = logoObject;
  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
      "X-Logo-Source": "r2",
      "X-Logo-Key": key,
      "X-Logo-Format": "rgb565-le",
      "X-Logo-Width": object.customMetadata?.width || "42",
      "X-Logo-Height": object.customMetadata?.height || "42"
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

async function getRgb565LogoObject(bucket: R2Bucket, filename: string): Promise<{ key: string; object: R2ObjectBody } | undefined> {
  const dotIndex = filename.lastIndexOf(".");
  const code = (dotIndex >= 0 ? filename.slice(0, dotIndex) : filename).trim();
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return undefined;

  const upper = code.toUpperCase();
  const variants = [
    `${upper}.rgb565`,
    `${upper}.RGB565`,
    `${code}.rgb565`,
    `${code}.RGB565`,
    `${code.toLowerCase()}.rgb565`,
    `rgb565/${upper}.rgb565`,
    `rgb565/${code}.rgb565`,
    `logos-rgb565/${upper}.rgb565`,
    `logos-rgb565/${code}.rgb565`,
    `airline-logos-rgb565/${upper}.rgb565`,
    `airline-logos-rgb565/${code}.rgb565`
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
    displayMode: v.displayMode === "clock" ? "clock" : "flight",
    airspaceMonitoringEnabled: typeof (v as { airspaceMonitoringEnabled?: unknown }).airspaceMonitoringEnabled === "boolean"
      ? Boolean((v as { airspaceMonitoringEnabled?: unknown }).airspaceMonitoringEnabled)
      : true,
    allowedAircraftCategories: normalizeAircraftCategoryFilter((v as { allowedAircraftCategories?: unknown }).allowedAircraftCategories),
    brightness: clampNumber(v.brightness, 1, 100, 80),
    audioVolumePercent: clampNumber((v as { audioVolumePercent?: unknown }).audioVolumePercent, 0, 100, 35),
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
    clockColor: normalizeHexColor((v as { clockColor?: unknown }).clockColor, "#ff2a23"),
    timetableColors: normalizeTimetableColors((v as { timetableColors?: unknown }).timetableColors),
    nightMode: {
      enabled: typeof night.enabled === "boolean" ? night.enabled : true,
      start: normalizeTimeString(night.start, "23:00"),
      end: normalizeTimeString(night.end, "07:00"),
      brightness: clampNumber(night.brightness, 0, 100, 0)
    }
  };
}

function normalizeAircraftCategoryFilter(value: unknown): AircraftCategoryCode[] {
  if (!Array.isArray(value)) return [...DEFAULT_ALLOWED_AIRCRAFT_CATEGORIES];
  const allowed = new Set<AircraftCategoryCode>();
  value.forEach((item) => {
    const code = normalizeAircraftCategoryCode(item);
    if (code) allowed.add(code);
  });
  return Array.from(allowed);
}

function normalizeAircraftCategoryCode(value: unknown): AircraftCategoryCode | undefined {
  if (typeof value !== "string") return undefined;
  const raw = value.trim().toUpperCase();
  if ((Object.keys(AIRCRAFT_CATEGORY_LABELS) as AircraftCategoryCode[]).includes(raw as AircraftCategoryCode)) return raw as AircraftCategoryCode;
  const match = (Object.entries(AIRCRAFT_CATEGORY_LABELS) as Array<[AircraftCategoryCode, string]>)
    .find(([, label]) => label === raw);
  return match?.[0];
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
    time: normalizeHexColor(v.time, "#f4f7ff"),
    newTime: normalizeHexColor(v.newTime, "#f7b500"),
    canceled: normalizeHexColor(v.canceled, "#ff3b30")
  };
}

function timezonePosixForFirmware(timezone: string): string {
  const raw = (timezone || "").trim();
  if (!raw) return "CET-1CEST,M3.5.0/2,M10.5.0/3";
  if (/^[A-Z]{2,6}[+-]\d/.test(raw) || raw.includes(",")) return raw.slice(0, 64);

  const known: Record<string, string> = {
    "Etc/UTC": "UTC0",
    "UTC": "UTC0",
    "Europe/Oslo": "CET-1CEST,M3.5.0/2,M10.5.0/3",
    "Europe/Stockholm": "CET-1CEST,M3.5.0/2,M10.5.0/3",
    "Europe/Copenhagen": "CET-1CEST,M3.5.0/2,M10.5.0/3",
    "Europe/Berlin": "CET-1CEST,M3.5.0/2,M10.5.0/3",
    "Europe/Amsterdam": "CET-1CEST,M3.5.0/2,M10.5.0/3",
    "Europe/Paris": "CET-1CEST,M3.5.0/2,M10.5.0/3",
    "Europe/London": "GMT0BST,M3.5.0/1,M10.5.0/2",
    "America/New_York": "EST5EDT,M3.2.0/2,M11.1.0/2",
    "America/Chicago": "CST6CDT,M3.2.0/2,M11.1.0/2",
    "America/Denver": "MST7MDT,M3.2.0/2,M11.1.0/2",
    "America/Los_Angeles": "PST8PDT,M3.2.0/2,M11.1.0/2"
  };

  return known[raw] || known["Europe/Oslo"];
}

function normalizeLineColors(value: unknown): DeviceSettings["lineColors"] {
  const v = value && typeof value === "object" ? value as Partial<DeviceSettings["lineColors"]> : {};
  return {
    airline: normalizeHexColor(v.airline, "#f4f7ff"),
    route: normalizeHexColor(v.route, "#f4f7ff"),
    aircraft: normalizeHexColor(v.aircraft, "#f4f7ff"),
    context: normalizeHexColor(v.context, "#f4f7ff"),
    progress: normalizeHexColor(v.progress, "#f7b500"),
    routeProgress: normalizeHexColor(v.routeProgress, "#00d46a")
  };
}

function normalizeHexColor(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : fallback;
}

function scalePercentTo8Bit(value: number): number {
  const clamped = clamp(value, 0, 100);
  return Math.round((clamped / 100) * 255);
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
  const avinorWindowHours = normalizeDeviceSettings(config.device).avinorWindowHours;
  const [departures, arrivals] = await Promise.all([
    getAvinorFlights(env, airport, "D", config),
    getAvinorFlights(env, airport, "A", config)
  ]);

  return [
    ...toIdleScreens("DEPARTURES", "departures", departures.slice(0, limit), avinorWindowHours),
    ...toIdleScreens("ARRIVALS", "arrivals", arrivals.slice(0, limit), avinorWindowHours)
  ];
}

function toIdleScreens(title: IdleScreen["title"], kind: IdleScreen["kind"], flights: AvinorFlight[], avinorWindowHours: number): IdleScreen[] {
  const rows = flights.map(toIdleRow);
  if (!rows.length) {
    const noun = kind === "departures" ? "departures" : "arrivals";
    const hours = Math.max(1, Math.round(avinorWindowHours));
    return [{
      title,
      kind,
      rows: [{
        flightId: "",
        airport: "",
        time: "",
        status: "empty",
        message: `No ${noun}|the next ${hours} hours`
      }]
    }];
  }

  const pages: IdleRow[][] = [];
  for (let index = 0; index < rows.length; index += 4) {
    pages.push(rows.slice(index, index + 4));
  }
  return pages.map((pageRows) => ({
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
  if (["gotogate", "togate", "go", "g"].includes(normalized) || normalized.includes("gotogate")) return "Go to gate";
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
  const [config, screenState] = await Promise.all([getConfig(env), getScreenState(env)]);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  const suspendedReason = displaySuspendedReason(config, screenState);
  const liveSourceStatus: LiveSourceStatus = {
    source: "fr24",
    ok: true
  };
  if (suspendedReason) {
    return jsonResponse(await displayPayload(env, config, screenState, compact, suspendedReason, [], [], [], [], liveSourceStatus), 200, {
      "Cache-Control": "no-store"
    });
  }

  if (normalizedDevice.displayMode === "clock") {
    return jsonResponse(await displayPayload(env, config, screenState, compact, "clock", [], [], [], [], liveSourceStatus), 200, {
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
  if (mode === "follow" || mode === "nearby") {
    enrichFollowEtaTimes(config, displayFlights);
    await enrichFollowLocation(env, displayFlights);
  }
  const idleScreens = displayFlights.length ? [] : await getIdleScreens(env, config);
  const payload = displayPayload(env, config, screenState, compact, mode, followFlights, nearbyFlights, displayFlights, idleScreens, liveSourceStatus);

  return jsonResponse(await payload, 200, {
    "Cache-Control": "public, max-age=15"
  });
}

async function displayPayload(
  env: Env,
  config: Config,
  screenState: ScreenState,
  compact: boolean,
  mode: string,
  followFlights: DisplayFlight[],
  nearbyFlights: DisplayFlight[],
  displayFlights: DisplayFlight[],
  idleScreens: IdleScreen[],
  liveSourceStatus: LiveSourceStatus
): Promise<Record<string, unknown>> {
  const normalizedDevice = normalizeDeviceSettings(config.device);
  const clock = buildClockPayload(normalizedDevice);
  return compact
    ? {
        updatedAt: new Date().toISOString(),
        mode,
        suspended: mode === "disabled" || mode === "night" || mode === "remote_disabled",
        airspaceMonitoring: config.device?.airspaceMonitoringEnabled !== false,
        screenActive: screenState.active,
        screenState,
        lat: config.lat,
        lon: config.lon,
        radiusKm: config.radiusKm,
        follow: config.follow,
        device: normalizedDevice,
        clock,
        liveSourceStatus,
        idleScreens,
        flights: await Promise.all(displayFlights.map((flight) => toCompactDisplayFlight(env, flight, config)))
      }
    : {
        updatedAt: new Date().toISOString(),
        mode,
        airspaceMonitoring: config.device?.airspaceMonitoringEnabled !== false,
        screenActive: screenState.active,
        screenState,
        config,
        clock,
        liveSourceStatus,
        followFlights,
        nearbyFlights,
        flights: displayFlights,
        idleScreens
      };
}

function displaySuspendedReason(config: Config, screenState: ScreenState): "disabled" | "night" | "remote_disabled" | undefined {
  if (!screenState.active) return "remote_disabled";
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

function buildClockPayload(device: DeviceSettings): ClockPayload {
  return {
    style: "gorgy",
    timezone: device.timezone || "Europe/Oslo",
    color: device.clockColor || "#ff2a23",
    width: 63,
    height: 63,
    centered: true
  };
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
    logoRgb565Url: logoRgb565UrlFor(logoCode),
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

function logoRgb565UrlFor(airlineCode: string | undefined): string {
  const code = normalizeLogoCode(airlineCode);
  return code ? `/public/logos-rgb565/${code}.rgb565` : "/public/logos-rgb565/UNKNOWN.rgb565";
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
  const cacheTtl = Math.max(60, parseNumber(env.CACHE_TTL_SECONDS, 60));
  const cacheKey = `flights:fr24:v1:${config.lat.toFixed(3)}:${config.lon.toFixed(3)}:${Math.round(config.radiusKm)}`;
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
    .filter((flight) => aircraftCategoryAllowed(flight, config.device?.allowedAircraftCategories))
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
  const [departures, arrivals] = await Promise.all([
    getAvinorRawFlights(env, airport, "D", timezone),
    getAvinorRawFlights(env, airport, "A", timezone)
  ]);
  const scheduled = [...departures, ...arrivals];
  const targetedLiveFlights = await getTargetedFollowFlights(env, config, follow.flights);
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
  const normalizedTokens = tokens
    .map(normalizeFollowToken)
    .filter((token): token is string => Boolean(token));
  if (!normalizedTokens.length) return [];

  const cacheTtl = Math.max(30, Math.min(300, parseNumber(env.CACHE_TTL_SECONDS, 60)));
  const cacheKey = `follow:fr24:v4:${normalizedTokens.slice().sort().join(",")}`;
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (Array.isArray(cached)) return cached as DisplayFlight[];

  const [records, staticFlights] = await Promise.all([
    fetchFr24(env, undefined, { flights: normalizedTokens }, env.FR24_FOLLOW_ENDPOINT || "/live/flight-positions/light"),
    getFr24FollowStaticFlights(env, config, normalizedTokens)
  ]);
  const fallbackFlight = normalizedTokens.length === 1 ? normalizedTokens[0] : undefined;
  const liveFlights = records
    .map((record) => normalizeFlight(record, config, fallbackFlight))
    .filter((flight): flight is DisplayFlight => Boolean(flight));
  const flights = mergeFollowStaticFlights(liveFlights, staticFlights);

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
  return value?.toUpperCase().replace(/[\s-]+/g, "") || "";
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
  const cacheKey = `follow:aviationstack:v3:${cacheDate}:${normalized}`;
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
  const raw = await fetchAviationstackRaw(env, apiKey, flightToken);
  if (!raw.ok) {
    throw new Error(`Aviationstack request failed (${raw.status}): ${safeJsonSnippet(raw.body)}`);
  }

  const json = raw.body && typeof raw.body === "object" && !Array.isArray(raw.body) ? raw.body as Record<string, unknown> : {};
  if (json.error && typeof json.error === "object") {
    const error = json.error as Record<string, unknown>;
    const message = firstString(error, ["message", "info", "type"]) || "unknown error";
    throw new Error(`Aviationstack request failed: ${message}`);
  }
  const records = Array.isArray(json.data) ? json.data : Array.isArray(json.results) ? json.results : [];
  return records.filter((record): record is AviationstackFlight => Boolean(record && typeof record === "object"));
}

async function fetchAviationstackRaw(env: Env, apiKey: string, flightToken: string): Promise<AviationstackRawResponse> {
  const baseUrl = env.AVIATIONSTACK_API_BASE_URL || "https://api.aviationstack.com/v1";
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/flights`);
  url.searchParams.set("access_key", apiKey);
  const flightParam = /^[A-Z]{3}\d/.test(flightToken) ? "flight_icao" : "flight_iata";
  url.searchParams.set(flightParam, flightToken);
  url.searchParams.set("limit", "10");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  let body: unknown = text;
  if (/json/i.test(contentType)) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  const safeUrl = new URL(url.toString());
  safeUrl.searchParams.set("access_key", "REDACTED");
  return {
    request: {
      url: safeUrl.toString(),
      flight: flightToken,
      flightParam,
      limit: "10"
    },
    status: response.status,
    ok: response.ok,
    contentType,
    body
  };
}

function normalizeAviationstackFlight(record: AviationstackFlight, config: Config): DisplayFlight | undefined {
  const departure = record.departure || {};
  const arrival = record.arrival || {};
  const flight = record.flight || {};
  const airline = record.airline || {};
  const displayTimezone = config.device?.timezone || "Europe/Oslo";
  const departureScheduledTime = parseAviationstackZonedDateTime(departure.scheduled, departure.timezone)
    || parseAviationstackZonedDateTime(departure.estimated, departure.timezone)
    || parseDateValue(departure.scheduled)
    || parseDateValue(departure.estimated)
    || undefined;
  const arrivalScheduledTime = parseAviationstackZonedDateTime(arrival.scheduled, arrival.timezone)
    || parseAviationstackZonedDateTime(arrival.estimated, arrival.timezone)
    || parseDateValue(arrival.scheduled)
    || parseDateValue(arrival.estimated)
    || undefined;
  const departureLocalTime = formatAviationstackLocalTime(departure.scheduled) || formatAviationstackLocalTime(departure.estimated);
  const departureDisplayTime = formatAviationstackDisplayTime(departureScheduledTime, departureLocalTime, displayTimezone);
  const arrivalDisplayTime = formatAviationstackLocalTime(arrival.scheduled) || formatAviationstackLocalTime(arrival.estimated) || formatLocalTime(arrivalScheduledTime || "", config.device?.timezone || "Europe/Oslo");
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
    displayTime: departureDisplayTime,
    direction: "D",
    departureScheduledTime,
    departureDisplayTime,
    arrivalScheduledTime,
    arrivalDisplayTime
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

function formatAviationstackLocalTime(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  const match = value.match(/[T ](\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function formatAviationstackDisplayTime(value: string | undefined, localTime: string, timezone: string): string {
  const displayTime = formatLocalTime(value || "", timezone);
  if (displayTime && localTime) return `${displayTime} (${localTime})`;
  return displayTime || localTime;
}

function parseAviationstackZonedDateTime(value: string | null | undefined, timezone: string | null | undefined): string | undefined {
  const parts = parseLocalDateTimeParts(value);
  const normalizedTimezone = cleanNullableString(timezone);
  if (!parts || !normalizedTimezone) return undefined;
  try {
    return new Date(zonedLocalTimeToUtcMillis(parts, normalizedTimezone)).toISOString();
  } catch {
    return undefined;
  }
}

function parseLocalDateTimeParts(value: string | null | undefined): { year: number; month: number; day: number; hour: number; minute: number; second: number } | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return undefined;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || 0)
  };
}

function zonedLocalTimeToUtcMillis(parts: { year: number; month: number; day: number; hour: number; minute: number; second: number }, timezone: string): number {
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let utc = localAsUtc;
  for (let index = 0; index < 3; index += 1) {
    utc = localAsUtc - timeZoneOffsetMillis(new Date(utc), timezone);
  }
  return utc;
}

function timeZoneOffsetMillis(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
  const zonedAsUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
  return zonedAsUtc - date.getTime();
}

function normalizeSecretString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new Response("timeout", { status: 504 });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonSnippet(value: unknown): string {
  try {
    return JSON.stringify(value).slice(0, 240);
  } catch {
    return String(value).slice(0, 240);
  }
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
    try {
      const location = await getFlightLocation(env, flight.lat, flight.lon);
      flight.locationLabel = "Flying over";
      flight.locationValue = location;
      flight.routeProgress = await calculateRouteProgress(env, flight);
    } catch {
      flight.locationLabel = "Flying over";
      flight.locationValue = inferSeaName(flight.lat, flight.lon) || "";
      flight.routeProgress = undefined;
    }
  }));
}

function enrichFollowEtaTimes(config: Config, flights: DisplayFlight[]): void {
  const displayTimezone = config.device?.timezone || "Europe/Oslo";
  flights.forEach((flight) => {
    if (!flight.arrivalScheduledTime) return;
    flight.arrivalDisplayTime = formatLocalTime(flight.arrivalScheduledTime, displayTimezone) || flight.arrivalDisplayTime;
  });
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

  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "flight-display-server/0.1"
    }
  }, 3000);
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

  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "flight-display-server/0.1"
    }
  }, 3000);
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
  const candidates = followTokenVariants(normalized);
  return [flight.flight, flight.callsign, flight.registration]
    .map(normalizedIdentityValue)
    .some((value) => candidates.includes(value));
}

function followTokenVariants(token: string): string[] {
  const normalized = normalizedIdentityValue(token);
  const variants = new Set<string>([normalized]);
  const match = normalized.match(/^([A-Z0-9]{2})(\d[A-Z0-9]*)$/);
  if (match) {
    const icao = airlineIataToLogoCode(match[1]);
    if (icao && /^[A-Z]{3}$/.test(icao)) variants.add(`${icao}${match[2]}`);
  }
  return Array.from(variants);
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

function aircraftCategoryAllowed(flight: DisplayFlight, allowedCategories: AircraftCategoryCode[] | undefined): boolean {
  if (!flight.category) return true;
  const allowed = allowedCategories?.length ? allowedCategories : DEFAULT_ALLOWED_AIRCRAFT_CATEGORIES;
  return allowed.includes(flight.category);
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
  const category = firstAircraftCategory(r);
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
    category,
    categoryName: category ? AIRCRAFT_CATEGORY_LABELS[category] : undefined,
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

function firstAircraftCategory(record: Record<string, unknown>): AircraftCategoryCode | undefined {
  return normalizeAircraftCategoryCode(firstString(record, [
    "category",
    "aircraft_category",
    "aircraftCategory",
    "aircraft_class",
    "aircraftClass",
    "fr24_category",
    "fr24Category"
  ]));
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

function renderPixelEditorHtml(): string {
  return `<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pixel Editor 128 x 64</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; --ink:#f4f7ff; --muted:#9aa7b8; --line:#2c3849; --panel:#101720; --field:#070b10; --accent:#f6b800; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #05080d; color: var(--ink); }
    main { min-height: 100vh; }
    aside { padding: 14px 18px; border-bottom: 1px solid var(--line); background: #0b1118; display: grid; grid-template-columns: minmax(230px, 340px) minmax(420px, 1fr) minmax(300px, 420px); gap: 14px; align-items: start; }
    h1 { margin: 0; font-size: 24px; line-height: 1.1; letter-spacing: 0; }
    p { margin: 8px 0 0; color: var(--muted); font-size: 13px; line-height: 1.4; }
    label { display: block; margin: 13px 0 5px; color: #dce4ee; font-size: 12px; font-weight: 800; }
    input, select, textarea { width: 100%; border: 1px solid #344257; border-radius: 7px; background: var(--field); color: var(--ink); font: inherit; }
    input, select { padding: 9px 10px; }
    textarea { min-height: 132px; padding: 10px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.35; }
    button { width: 100%; margin-top: 9px; border: 1px solid #3b4859; border-radius: 7px; padding: 10px 12px; background: #182232; color: var(--ink); font: inherit; font-weight: 850; cursor: pointer; }
    button.primary, button.active { background: var(--accent); color: #111; border-color: var(--accent); }
    button.danger { background: #321923; color: #ffd8d1; border-color: #6c3141; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
    .meta { margin-top: 9px; color: var(--muted); font-size: 12px; }
    .tools { display: grid; grid-template-columns: 1fr 1fr 150px; gap: 9px; align-items: end; }
    .output-panel { min-width: 0; }
    .stage { padding: 12px 18px 18px; overflow: auto; background: #070a0e; }
    .editor-grid { display: grid; grid-template-columns: 44px minmax(0, 1fr); grid-template-rows: 28px auto; gap: 6px; width: 100%; }
    .coord-box { display: grid; place-items: center; border: 1px solid #263345; border-radius: 6px; background: #0b1118; color: #f4f7ff; font: 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    #topAxis, #leftAxis { display: block; width: 100%; height: 100%; background: #090d13; border: 1px solid #263345; border-radius: 6px; }
    .canvas-wrap { width: 100%; aspect-ratio: 2 / 1; background: #000; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
    #pixelCanvas { width: 100%; height: 100%; display: block; background: #000; image-rendering: pixelated; cursor: crosshair; touch-action: none; }
    .mini { margin-top: 12px; margin-left: 50px; width: min(100%, 512px); aspect-ratio: 2 / 1; border: 1px solid var(--line); background: #000; }
    #miniCanvas { width: 100%; height: 100%; display: block; image-rendering: pixelated; }
    a { color: #6aa7ff; text-decoration: none; }
    @media (max-width: 860px) {
      aside { display: block; }
      .tools { display: block; }
      .stage { padding: 12px; }
      .editor-grid { grid-template-columns: 34px minmax(0, 1fr); grid-template-rows: 24px auto; gap: 4px; }
      .mini { margin-left: 38px; }
    }
  </style>
</head>
<body>
  <main>
    <aside>
      <h1>Pixel editor</h1>
      <p>128 x 64 LED-grid med samme pitch og runde prikker som emulatoren. Ruler og peker viser x 1-128 og y 1-64; outputen er fortsatt kodeklar 0-basert.</p>
      <div id="meta" class="meta">128 x 64 · ruler x 1-128 · y 1-64 · 0 pixels tent · x:- y:-</div>
      <p><a href="/">Tilbake til kontrollpanel</a></p>
      <div class="tools">
        <div>
          <label for="format">Output</label>
          <select id="format">
            <option value="json">JSON coordinates</option>
            <option value="cpp">C++ points</option>
            <option value="bitmap">64 row bitmap</option>
          </select>
        </div>
        <div class="row">
          <button id="copy" class="primary" type="button">Kopier output</button>
          <button id="clear" class="danger" type="button">Tøm grid</button>
        </div>
        <button id="invert" type="button">Inverter pixels</button>
      </div>
      <div class="output-panel">
        <label for="output">Kode</label>
        <textarea id="output" spellcheck="false"></textarea>
        <button id="load" type="button">Last JSON fra feltet</button>
      </div>
    </aside>
    <section class="stage">
      <div class="editor-grid">
        <div id="coordBox" class="coord-box">x:-<br>y:-</div>
        <canvas id="topAxis" width="1024" height="28"></canvas>
        <canvas id="leftAxis" width="44" height="512"></canvas>
        <div class="canvas-wrap">
          <canvas id="pixelCanvas" width="1024" height="512"></canvas>
        </div>
      </div>
      <div class="mini">
        <canvas id="miniCanvas" width="128" height="64"></canvas>
      </div>
    </section>
  </main>
  <script>
    const cols = 128;
    const rows = 64;
    const canvas = document.querySelector("#pixelCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const topAxis = document.querySelector("#topAxis");
    const topAxisCtx = topAxis.getContext("2d", { willReadFrequently: true });
    const leftAxis = document.querySelector("#leftAxis");
    const leftAxisCtx = leftAxis.getContext("2d", { willReadFrequently: true });
    const coordBox = document.querySelector("#coordBox");
    const miniCanvas = document.querySelector("#miniCanvas");
    const miniCtx = miniCanvas.getContext("2d", { willReadFrequently: true });
    const output = document.querySelector("#output");
    const meta = document.querySelector("#meta");
    const format = document.querySelector("#format");
    const pixels = new Set();
    let strokeMode = "draw";
    let pointerDown = false;
    let activePointerId = null;
    let hoverPoint = null;

    function key(x, y) { return x + "," + y; }
    function parseKey(value) {
      const parts = value.split(",");
      return { x: Number(parts[0]), y: Number(parts[1]) };
    }
    function pixelFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((event.clientX - rect.left) / rect.width) * cols);
      const y = Math.floor(((event.clientY - rect.top) / rect.height) * rows);
      if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
      return { x, y };
    }
    function setPixelState(point, nextOn) {
      if (!point) return;
      if (nextOn) {
        pixels.add(key(point.x, point.y));
      } else {
        pixels.delete(key(point.x, point.y));
      }
    }
    function applyPixel(event) {
      const point = pixelFromEvent(event);
      if (!point) return;
      setPixelState(point, strokeMode === "draw");
      render();
    }
    function render() {
      drawLedPanel();
      drawAxes();
      drawMini();
      updateOutput();
    }
    function drawLedPanel() {
      const panelW = canvas.width;
      const panelH = canvas.height;
      const pitchX = panelW / cols;
      const pitchY = panelH / rows;
      const radius = Math.min(pitchX, pitchY) * 0.27;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, panelW, panelH);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const cx = x * pitchX + pitchX / 2;
          const cy = y * pitchY + pitchY / 2;
          ctx.fillStyle = "#242a33";
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          if (pixels.has(key(x, y))) {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      drawBoardCrosshair();
    }
    function drawBoardCrosshair() {
      if (!hoverPoint) return;
      const pitchX = canvas.width / cols;
      const pitchY = canvas.height / rows;
      const x = hoverPoint.x * pitchX + pitchX / 2;
      const y = hoverPoint.y * pitchY + pitchY / 2;
      ctx.save();
      ctx.strokeStyle = "rgba(246,184,0,.95)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(246,184,0,.95)";
      ctx.beginPath();
      ctx.arc(x, y, Math.min(pitchX, pitchY) * 0.33, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    function drawAxes() {
      const pitchX = topAxis.width / cols;
      const pitchY = leftAxis.height / rows;
      topAxisCtx.fillStyle = "#090d13";
      topAxisCtx.fillRect(0, 0, topAxis.width, topAxis.height);
      leftAxisCtx.fillStyle = "#090d13";
      leftAxisCtx.fillRect(0, 0, leftAxis.width, leftAxis.height);
      topAxisCtx.font = "10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      topAxisCtx.textAlign = "center";
      topAxisCtx.textBaseline = "top";
      leftAxisCtx.font = "10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      leftAxisCtx.textAlign = "right";
      leftAxisCtx.textBaseline = "middle";
      for (let x = 0; x < cols; x += 1) {
        const px = x * pitchX + pitchX / 2;
        const major = x % 16 === 0;
        const minor = x % 8 === 0;
        if (!major && !minor) continue;
        topAxisCtx.strokeStyle = major ? "#6f7f92" : "#394657";
        topAxisCtx.beginPath();
        topAxisCtx.moveTo(px, topAxis.height);
        topAxisCtx.lineTo(px, major ? 12 : 19);
        topAxisCtx.stroke();
        if (major) {
          topAxisCtx.fillStyle = "#dce4ee";
          topAxisCtx.fillText(String(x + 1), px, 2);
        }
      }
      topAxisCtx.fillStyle = "#dce4ee";
      topAxisCtx.fillText("128", topAxis.width - pitchX / 2, 2);
      for (let y = 0; y < rows; y += 1) {
        const py = y * pitchY + pitchY / 2;
        const major = y % 8 === 0;
        const minor = y % 4 === 0;
        if (!major && !minor) continue;
        leftAxisCtx.strokeStyle = major ? "#6f7f92" : "#394657";
        leftAxisCtx.beginPath();
        leftAxisCtx.moveTo(leftAxis.width, py);
        leftAxisCtx.lineTo(major ? 20 : 31, py);
        leftAxisCtx.stroke();
        if (major) {
          leftAxisCtx.fillStyle = "#dce4ee";
          leftAxisCtx.fillText(String(y + 1), 18, py);
        }
      }
      leftAxisCtx.fillStyle = "#dce4ee";
      leftAxisCtx.fillText("64", 18, leftAxis.height - pitchY / 2);
      if (hoverPoint) {
        const hx = hoverPoint.x * pitchX + pitchX / 2;
        const hy = hoverPoint.y * pitchY + pitchY / 2;
        topAxisCtx.fillStyle = "#f6b800";
        topAxisCtx.fillRect(Math.max(0, hx - 1), 0, 2, topAxis.height);
        topAxisCtx.fillStyle = "#111";
        topAxisCtx.fillRect(Math.max(0, hx - 14), 2, 28, 12);
        topAxisCtx.fillStyle = "#f6b800";
        topAxisCtx.fillText(String(hoverPoint.x + 1), hx, 3);
        leftAxisCtx.fillStyle = "#f6b800";
        leftAxisCtx.fillRect(0, Math.max(0, hy - 1), leftAxis.width, 2);
        leftAxisCtx.fillStyle = "#111";
        leftAxisCtx.fillRect(2, Math.max(0, hy - 7), 24, 14);
        leftAxisCtx.fillStyle = "#f6b800";
        leftAxisCtx.fillText(String(hoverPoint.y + 1), 22, hy);
        coordBox.innerHTML = "x:" + (hoverPoint.x + 1) + "<br>y:" + (hoverPoint.y + 1);
      } else {
        coordBox.innerHTML = "x:-<br>y:-";
      }
    }
    function drawMini() {
      miniCtx.fillStyle = "#000";
      miniCtx.fillRect(0, 0, cols, rows);
      miniCtx.fillStyle = "#ffffff";
      pixels.forEach((value) => {
        const point = parseKey(value);
        miniCtx.fillRect(point.x, point.y, 1, 1);
      });
    }
    function sortedPixels() {
      return Array.from(pixels)
        .map(parseKey)
        .sort((a, b) => a.y - b.y || a.x - b.x);
    }
    function updateOutput() {
      const list = sortedPixels();
      if (format.value === "cpp") {
        const lines = list.map((point) => "  {" + point.x + ", " + point.y + "}");
        output.value = "const uint8_t CLOCK_TEMPLATE[][2] = {\\n" + lines.join(",\\n") + "\\n};\\nconst size_t CLOCK_TEMPLATE_COUNT = " + list.length + ";";
      } else if (format.value === "bitmap") {
        output.value = JSON.stringify({
          width: cols,
          height: rows,
          rows: Array.from({ length: rows }, (_, y) => {
            let line = "";
            for (let x = 0; x < cols; x += 1) line += pixels.has(key(x, y)) ? "1" : "0";
            return line;
          })
        }, null, 2);
      } else {
        output.value = JSON.stringify({
          width: cols,
          height: rows,
          pixels: list.map((point) => [point.x, point.y])
        }, null, 2);
      }
      const cursor = hoverPoint ? " · x:" + (hoverPoint.x + 1) + " y:" + (hoverPoint.y + 1) : " · x:- y:-";
      meta.textContent = "128 x 64 · ruler x 1-128 · y 1-64 · " + list.length + " pixels tent" + cursor;
    }
    function loadJson() {
      const parsed = JSON.parse(output.value);
      pixels.clear();
      if (Array.isArray(parsed.pixels)) {
        parsed.pixels.forEach((point) => {
          const x = Number(point[0]);
          const y = Number(point[1]);
          if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < cols && y < rows) pixels.add(key(x, y));
        });
      } else if (Array.isArray(parsed.rows)) {
        parsed.rows.slice(0, rows).forEach((line, y) => {
          String(line).slice(0, cols).split("").forEach((char, x) => {
            if (char === "1") pixels.add(key(x, y));
          });
        });
      }
      render();
    }

    format.addEventListener("change", updateOutput);
    document.querySelector("#clear").addEventListener("click", () => {
      pixels.clear();
      render();
    });
    document.querySelector("#invert").addEventListener("click", () => {
      const next = new Set();
      for (let y = 0; y < rows; y += 1) for (let x = 0; x < cols; x += 1) {
        if (!pixels.has(key(x, y))) next.add(key(x, y));
      }
      pixels.clear();
      next.forEach((value) => pixels.add(value));
      render();
    });
    document.querySelector("#copy").addEventListener("click", async () => {
      await navigator.clipboard.writeText(output.value);
      meta.textContent = sortedPixels().length + " pixels tent · kopiert";
    });
    document.querySelector("#load").addEventListener("click", () => {
      try {
        loadJson();
      } catch (error) {
        meta.textContent = "Kunne ikke lese JSON";
      }
    });
    canvas.addEventListener("pointerdown", (event) => {
      pointerDown = true;
      activePointerId = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      hoverPoint = pixelFromEvent(event);
      strokeMode = hoverPoint && pixels.has(key(hoverPoint.x, hoverPoint.y)) ? "erase" : "draw";
      setPixelState(hoverPoint, strokeMode === "draw");
      render();
    });
    canvas.addEventListener("pointermove", (event) => {
      hoverPoint = pixelFromEvent(event);
      if (!pointerDown || event.pointerId !== activePointerId) {
        render();
        return;
      }
      applyPixel(event);
    });
    canvas.addEventListener("pointerup", (event) => {
      pointerDown = false;
      activePointerId = null;
      canvas.releasePointerCapture(event.pointerId);
      hoverPoint = pixelFromEvent(event);
      render();
    });
    canvas.addEventListener("pointercancel", () => {
      pointerDown = false;
      activePointerId = null;
      hoverPoint = null;
      render();
    });
    canvas.addEventListener("pointerleave", () => {
      if (pointerDown) return;
      hoverPoint = null;
      render();
    });
    render();
  </script>
</body>
</html>`;
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
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; --ink:#f5f0df; --muted:#9fa8b8; --line:#273345; --panel:#101720; --panel2:#151f2b; --field:#0b1118; --amber:#f6b800; --amber2:#ffd761; --blue:#2f7fdd; --blue2:#172942; --danger:#ff6d4a; --ok:#78d98f; --soft:#101720; }
    body { margin: 0; min-height: 100vh; background: #05080d; color: var(--ink); }
    .shell { min-height: 100vh; display: grid; grid-template-columns: minmax(410px, 470px) minmax(0, 1fr); align-items: stretch; background: linear-gradient(135deg, #05080d 0%, #0d141e 54%, #161205 100%); }
    aside { padding: 18px; background: linear-gradient(180deg, rgba(9,14,20,.98), rgba(13,19,28,.96)); border-right: 1px solid #2c3542; box-shadow: 12px 0 30px rgba(0,0,0,.24); box-sizing: border-box; display: flex; flex-direction: column; }
    .brand { margin: 0 0 14px; padding: 16px; background: #05070a; border: 1px solid #293241; border-left: 5px solid var(--amber); border-radius: 8px; }
    .eyebrow { margin: 0 0 7px; color: var(--amber2); font-size: 11px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 28px; line-height: 1.05; letter-spacing: 0; }
    p { margin: 7px 0 0; color: var(--muted); line-height: 1.45; font-size: 13px; }
    .card { margin-top: 12px; padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: rgba(16,23,32,.88); box-shadow: 0 14px 36px rgba(0,0,0,.22); }
    .brand { order: 0; }
    .savebar { order: 1; }
    .place-card { order: 2; }
    .screen-card { order: 3; }
    .flight-card { order: 4; }
    .timetable-card { order: 5; }
    .links-wrap { order: 6; }
    .preview { order: 7; }
    .card h2 { margin: 0; color: var(--amber2); font-size: 13px; letter-spacing: .12em; text-transform: uppercase; }
    .section-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 12px; }
    .section-note { margin: -4px 0 10px; color: var(--muted); font-size: 12px; line-height: 1.4; }
    .hint { position: relative; display: inline-grid; place-items: center; flex: 0 0 auto; width: 21px; height: 21px; border: 1px solid #405066; border-radius: 50%; color: #f8fafc; background: #182232; font-size: 12px; font-weight: 900; cursor: help; }
    .hint::after { content: attr(data-tip); position: absolute; right: 0; top: 27px; z-index: 20; width: min(280px, 74vw); padding: 9px 10px; border: 1px solid #405066; border-radius: 8px; background: #05080d; color: #edf2f8; box-shadow: 0 10px 30px rgba(0,0,0,.35); font-size: 12px; font-weight: 650; line-height: 1.35; letter-spacing: 0; text-transform: none; opacity: 0; pointer-events: none; transform: translateY(-4px); transition: opacity .12s ease, transform .12s ease; }
    .hint:hover::after, .hint:focus::after { opacity: 1; transform: translateY(0); }
    .subhead { margin: 14px 0 8px; color: #f4f7ff; font-size: 12px; font-weight: 850; letter-spacing: .06em; text-transform: uppercase; }
    label { display: block; margin: 11px 0 5px; color: #d7deea; font-weight: 750; font-size: 12px; }
    .field-help { margin: 4px 0 0; color: var(--muted); font-size: 11px; line-height: 1.35; }
    input, select { width: 100%; box-sizing: border-box; border: 1px solid #334154; border-radius: 8px; padding: 9px 10px; font: inherit; background: var(--field); color: var(--ink); }
    input[type="checkbox"] { width: auto; }
    input:focus, select:focus { outline: 2px solid rgba(246,184,0,.35); border-color: var(--amber); }
    input[type="color"] { height: 38px; padding: 3px; cursor: pointer; background: var(--field); }
    input[type="range"] { padding: 0; height: 28px; border: 0; background: transparent; accent-color: var(--amber); }
    .range-field { margin-top: 10px; }
    .range-label { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 2px; }
    .range-value { min-width: 58px; padding: 4px 8px; border-radius: 999px; background: #182232; color: var(--amber2); text-align: center; font-size: 12px; font-weight: 850; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .color-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
    .color-grid label { margin-top: 10px; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 4px; }
    .toggle-row label { margin: 0; }
    .category-grid { display: grid; grid-template-columns: 1fr; gap: 6px; margin: 7px 0 10px; }
    .category-option { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 8px; padding: 7px 8px; border: 1px solid #263345; border-radius: 8px; background: rgba(5,8,13,.32); }
    .category-option input { margin-top: 2px; }
    .category-option label { margin: 0; color: #eef3fb; font-size: 12px; line-height: 1.25; }
    .category-option span { display: block; color: var(--muted); font-size: 11px; line-height: 1.25; }
    button { margin-top: 14px; width: 100%; border: 0; border-radius: 8px; padding: 10px 13px; background: var(--amber); color: #111; font: inherit; font-weight: 850; cursor: pointer; }
    button.secondary { background: #1d2938; color: #f3f6fb; border: 1px solid #354457; margin-top: 9px; }
    button.danger { background: #321923; color: #ffd8d1; border: 1px solid #6c3141; }
    button:hover { filter: brightness(1.03); transform: translateY(-1px); }
    .savebar { position: sticky; top: 0; z-index: 12; margin-top: 12px; padding: 12px; border: 1px solid #3c4a5e; border-radius: 8px; background: linear-gradient(180deg, rgba(24,34,48,.98), rgba(9,14,20,.98)); box-shadow: 0 10px 22px rgba(0,0,0,.34); }
    .savebar button { margin: 0; }
    .status { min-height: 18px; margin-top: 9px; font-size: 12px; color: var(--ok); }
    .status.dirty { color: var(--amber2); }
    .error { color: var(--danger); }
    .links { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
    .links a { padding: 7px 8px; background: #0b1118; border: 1px solid #263345; border-radius: 7px; }
    details.links-wrap { margin-top: 12px; border: 1px solid #263345; border-radius: 8px; background: #0b1118; }
    details.links-wrap summary { cursor: pointer; padding: 9px 10px; color: var(--muted); font-size: 12px; font-weight: 800; }
    details.links-wrap .links { margin: 0; padding: 0 10px 10px; }
    details.settings-group { margin-top: 12px; border: 1px solid #263345; border-radius: 8px; background: rgba(11,17,24,.76); }
    details.settings-group summary { cursor: pointer; padding: 9px 10px; color: #f4f7ff; font-size: 12px; font-weight: 850; letter-spacing: .06em; text-transform: uppercase; }
    details.settings-group .settings-body { padding: 0 10px 10px; border-top: 1px solid #263345; }
    .preview { margin-top: 16px; }
    .preview-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .preview-head h2 { margin: 0; font-size: 13px; }
    .preview-actions { display: flex; gap: 8px; }
    .preview-head button { width: auto; margin: 0; padding: 8px 10px; font-size: 12px; background: #1d2938; color: #f3f6fb; border: 1px solid #354457; }
    .meta { margin: 8px 0 10px; color: var(--muted); font-size: 12px; }
    .flight-list { display: grid; gap: 8px; }
    .flight { border: 1px solid #2e3a4c; border-radius: 8px; padding: 9px 10px; background: #0b1118; }
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
    a { color: #6aa7ff; text-decoration: none; }
    details.card { padding: 0; overflow: hidden; }
    details.card > summary.section-head { margin: 0; padding: 14px; list-style: none; cursor: pointer; }
    details.card > summary.section-head::-webkit-details-marker { display: none; }
    details.card > summary.section-head::after { content: "›"; color: var(--muted); font-size: 24px; line-height: 1; transform: rotate(90deg); transition: transform .14s ease; }
    details.card:not([open]) > summary.section-head::after { transform: rotate(0deg); }
    details.card > .section-content { padding: 0 14px 14px; }
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
      <div class="savebar">
        <button id="save">Lagre alle innstillinger</button>
        <div id="status" class="status"></div>
      </div>
      <details class="card place-card" open>
        <summary class="section-head">
          <h2>Sted og flyplass</h2>
        </summary>
        <div class="section-content">
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
        <div class="range-field">
          <div class="range-label">
            <label for="radius">Søkeområde</label>
            <span class="range-value"><span id="radiusValue">10</span> km</span>
          </div>
          <input id="radius" type="range" min="1" max="250" step="1">
        </div>
        <button id="locate" class="secondary">Bruk min posisjon</button>
        <section id="map" aria-label="Kart"></section>
        </div>
      </details>
      <details class="card screen-card">
        <summary class="section-head">
          <h2>Skjerm</h2>
        </summary>
        <div class="section-content">
        <p class="section-note">De viktigste displayvalgene. Sjeldnere tidsvalg ligger under avansert.</p>
        <div class="field-help">Skjermen styres eksternt fra Homey. Her ser du bare status og lagrer nivåene for dag og natt.</div>
        <div class="field-help" id="screenStateSummary">Skjermstatus: aktiv · lysmodus: dag</div>
        <div class="field-help" id="screenStateTimestamps">Sist aktivert: aldri · sist deaktivert: aldri · sist byttet lysmodus: aldri</div>
        <div class="row">
          <div>
            <label for="displayMode">Displaymodus</label>
            <select id="displayMode">
              <option value="flight">Flight display</option>
              <option value="clock">Klokke</option>
            </select>
            <div class="field-help">Kan også styres eksternt fra Homey med eget POST-endepunkt.</div>
          </div>
          <div>
            <label for="clockColor">Klokkefarge</label>
            <input id="clockColor" type="color">
            <div class="field-help">Global farge for alle klokkeelementer.</div>
          </div>
        </div>
        <button id="screenToggle" class="secondary" type="button">Slå av skjerm</button>
        <div class="field-help" id="soundTestStatus">Lydtest: aldri</div>
        <button id="soundTest" class="secondary" type="button">Test lyd nå</button>
        <div class="range-label">
          <label for="audioVolumePercent">Lydvolum</label>
          <span class="range-value"><span id="audioVolumeValue">35</span>%</span>
        </div>
        <input id="audioVolumePercent" type="range" min="0" max="100" step="1">
        <div class="field-help">Gjelder testlyd og PA-varsel.</div>
        <div class="range-field">
          <div class="range-label">
            <label for="deviceBrightness">Lysstyrke dag</label>
            <span class="range-value"><span id="deviceBrightnessValue">80</span>%</span>
          </div>
          <input id="deviceBrightness" type="range" min="1" max="100" step="1">
        </div>
        <div class="range-field">
          <div class="range-label">
            <label for="pollSeconds">Hent nye flydata</label>
            <span class="range-value"><span id="pollSecondsValue">90</span> s</span>
          </div>
          <input id="pollSeconds" type="range" min="30" max="900" step="5">
          <div class="field-help">Sekunder mellom hver henting når skjermen er aktiv.</div>
        </div>
        <details class="settings-group">
          <summary>Avansert skjerm</summary>
          <div class="settings-body">
            <div class="row">
              <div>
                <div class="range-label">
                  <label for="configRefreshSeconds">Sjekk innstillinger</label>
                  <span class="range-value"><span id="configRefreshSecondsValue">300</span> s</span>
                </div>
                <input id="configRefreshSeconds" type="range" min="60" max="3600" step="30">
                <div class="field-help">Hvor ofte skjermen spør Worker om nye innstillinger.</div>
              </div>
              <div>
                <div class="range-label">
                  <label for="nightBrightness">Lysstyrke natt</label>
                  <span class="range-value"><span id="nightBrightnessValue">0</span>%</span>
                </div>
                <input id="nightBrightness" type="range" min="0" max="100" step="1">
                <div class="field-help">Brukes når Homey setter lysmodus til natt.</div>
              </div>
            </div>
          </div>
        </details>
        </div>
      </details>
      <details class="card flight-card">
        <summary class="section-head">
          <h2>Fly</h2>
        </summary>
        <div class="section-content">
        <p class="section-note">Live flyvisning alternerer mellom målinger i 10 sekunder og Flying over i 5 sekunder. Follow-flight viser i tillegg status før avgang og Landed når flyet har landet.</p>
        <div class="toggle-row">
          <div>
            <label for="airspaceMonitoringEnabled">Overvåk luftrommet</label>
            <div class="field-help">Når denne er av, henter Worker ikke live flydata. Tidstabell fra Avinor vises fortsatt.</div>
          </div>
          <input id="airspaceMonitoringEnabled" type="checkbox">
        </div>
        <details class="settings-group">
          <summary>Flytyper i overvåkning</summary>
          <div class="settings-body">
            <div class="field-help">Gjelder bare automatisk fly-i-radius. Follow-flight viser fortsatt flighten du eksplisitt følger.</div>
            <div class="category-grid" id="aircraftCategoryGrid">
              <div class="category-option">
                <input id="catP" type="checkbox" data-aircraft-category="P">
                <label for="catP">P Passenger<span>Kommersielle passasjerfly</span></label>
              </div>
              <div class="category-option">
                <input id="catC" type="checkbox" data-aircraft-category="C">
                <label for="catC">C Cargo<span>Rene fraktfly</span></label>
              </div>
              <div class="category-option">
                <input id="catM" type="checkbox" data-aircraft-category="M">
                <label for="catM">M Military and government<span>Militaer eller offentlig operator</span></label>
              </div>
              <div class="category-option">
                <input id="catJ" type="checkbox" data-aircraft-category="J">
                <label for="catJ">J Business jets<span>Store private jetfly</span></label>
              </div>
              <div class="category-option">
                <input id="catT" type="checkbox" data-aircraft-category="T">
                <label for="catT">T General aviation<span>Privat, ambulanse, skole, survey og kalibrering</span></label>
              </div>
              <div class="category-option">
                <input id="catH" type="checkbox" data-aircraft-category="H">
                <label for="catH">H Helicopters<span>Helikoptre</span></label>
              </div>
              <div class="category-option">
                <input id="catB" type="checkbox" data-aircraft-category="B">
                <label for="catB">B Lighter than air<span>Luftskip og lignende</span></label>
              </div>
              <div class="category-option">
                <input id="catG" type="checkbox" data-aircraft-category="G">
                <label for="catG">G Gliders<span>Seilfly</span></label>
              </div>
              <div class="category-option">
                <input id="catD" type="checkbox" data-aircraft-category="D">
                <label for="catD">D Drones<span>UAV og droner</span></label>
              </div>
              <div class="category-option">
                <input id="catV" type="checkbox" data-aircraft-category="V">
                <label for="catV">V Ground vehicles<span>Kjoeretoy med transponder</span></label>
              </div>
              <div class="category-option">
                <input id="catO" type="checkbox" data-aircraft-category="O">
                <label for="catO">O Other<span>Alt som ikke passer andre steder</span></label>
              </div>
              <div class="category-option">
                <input id="catN" type="checkbox" data-aircraft-category="N">
                <label for="catN">N Non categorized<span>Ikke kategorisert i FR24-databasen</span></label>
              </div>
            </div>
          </div>
        </details>
        <div class="toggle-row">
          <label for="followEnabled">Følg flightnummer</label>
          <input id="followEnabled" type="checkbox">
        </div>
        <label for="followFlights" id="followFlightsLabel">Flightnummer</label>
        <input id="followFlights" autocomplete="off" placeholder="SK4673, DY1304, DOC45">
        <div class="field-help" id="followFlightsHelp">La stå av for å vise fly i området. Skru på for å følge bestemte fly.</div>
        <details class="settings-group">
          <summary>Avansert flyvisning</summary>
          <div class="settings-body">
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
                <div class="range-label">
                  <label for="cycleSeconds">Bytt fly</label>
                  <span class="range-value"><span id="cycleSecondsValue">5</span> s</span>
                </div>
                <input id="cycleSeconds" type="range" min="2" max="30" step="1">
                <div class="field-help">Gjelder når flere fly vises samtidig.</div>
              </div>
              <div>
                <div class="range-label">
                  <label for="scrollSpeed">Scrollhastighet</label>
                  <span class="range-value"><span id="scrollSpeedValue">9</span> px/s</span>
                </div>
                <input id="scrollSpeed" type="range" min="2" max="30" step="1">
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
              <div>
                <label for="routeProgressColor">Flyprogress</label>
                <input id="routeProgressColor" type="color">
              </div>
            </div>
          </div>
        </details>
        </div>
      </details>
      <details class="card timetable-card">
        <summary class="section-head">
          <h2>Tidstabell</h2>
        </summary>
        <div class="section-content">
        <p class="section-note">Viser avganger og ankomster fra valgt flyplass. Tavlen ruller automatisk hvis det er mer enn fire rader.</p>
        <div class="row">
          <div>
            <div class="range-label">
              <label for="timetableCycleSeconds">Hold hver tavleside</label>
              <span class="range-value"><span id="timetableCycleSecondsValue">7</span> s</span>
            </div>
            <input id="timetableCycleSeconds" type="range" min="2" max="60" step="1">
          </div>
          <div>
            <div class="range-label">
              <label for="timetableScrollSpeed">Rullehastighet</label>
              <span class="range-value"><span id="timetableScrollSpeedValue">18</span> px/s</span>
            </div>
            <input id="timetableScrollSpeed" type="range" min="4" max="40" step="1">
          </div>
        </div>
        <div class="row">
          <div>
            <div class="range-label">
              <label for="timetableItemCount">Antall fly på tavlen</label>
              <span class="range-value"><span id="timetableItemCountValue">8</span></span>
            </div>
            <input id="timetableItemCount" type="range" min="4" max="40" step="4">
            <div class="field-help">Skjermen viser fire rader om gangen.</div>
          </div>
          <div>
            <div class="range-label">
              <label for="avinorWindowHours">Se fremover</label>
              <span class="range-value"><span id="avinorWindowHoursValue">4</span> t</span>
            </div>
            <input id="avinorWindowHours" type="range" min="1" max="24" step="1">
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
            <label for="timetableTimeColor">Klokkeslett</label>
            <input id="timetableTimeColor" type="color">
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
        </div>
      </details>
      <details class="links-wrap">
        <summary>Avansert: API-lenker</summary>
        <div class="links">
          <a href="/api/config" target="_blank">Config</a>
          <a href="/api/device-config" target="_blank">Device config</a>
          <a href="/api/logo-status" target="_blank">Logo status</a>
          <a href="/api/screen-state" target="_blank">Screen state</a>
          <a href="/api/display-mode" target="_blank">Display mode</a>
          <a href="/api/brightness-mode" target="_blank">Brightness mode</a>
          <a href="/api/sound-test" target="_blank">Sound test</a>
          <a href="/api/flights" target="_blank">Flights</a>
          <a href="/api/display" target="_blank">Display</a>
          <a href="/pixel-editor" target="_blank">Pixel editor</a>
          <a href="/api/avinor-board" target="_blank">Avinor board</a>
          <a href="/api/aviationstack?flight=TP764" target="_blank">Aviationstack raw</a>
        </div>
      </details>
      <details class="preview card" aria-label="Display preview">
        <summary class="preview-head section-head">
          <h2>Display-data</h2>
          <div class="preview-actions">
            <button id="refreshAvinor" type="button">Hent Avinor</button>
            <button id="refresh" type="button">Hent data</button>
          </div>
        </summary>
        <div class="section-content">
          <div id="previewMeta" class="meta"></div>
          <div id="flightList" class="flight-list"></div>
          <div id="avinorRaw" class="raw-board"></div>
        </div>
      </details>
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
	      radiusValue: document.querySelector("#radiusValue"),
	      homeAirport: document.querySelector("#homeAirport"),
	      airspaceMonitoringEnabled: document.querySelector("#airspaceMonitoringEnabled"),
	      aircraftCategoryInputs: Array.from(document.querySelectorAll("[data-aircraft-category]")),
	      followEnabled: document.querySelector("#followEnabled"),
      followFlights: document.querySelector("#followFlights"),
      followFlightsLabel: document.querySelector("#followFlightsLabel"),
      followFlightsHelp: document.querySelector("#followFlightsHelp"),
      aviationstackStatus: document.querySelector("#aviationstackStatus"),
      altitudeUnit: document.querySelector("#altitudeUnit"),
      speedUnit: document.querySelector("#speedUnit"),
      trackUnit: document.querySelector("#trackUnit"),
      verticalRateUnit: document.querySelector("#verticalRateUnit"),
      screenStateSummary: document.querySelector("#screenStateSummary"),
      screenStateTimestamps: document.querySelector("#screenStateTimestamps"),
      screenToggle: document.querySelector("#screenToggle"),
      displayMode: document.querySelector("#displayMode"),
      clockColor: document.querySelector("#clockColor"),
      soundTestStatus: document.querySelector("#soundTestStatus"),
      soundTest: document.querySelector("#soundTest"),
      audioVolumePercent: document.querySelector("#audioVolumePercent"),
      audioVolumeValue: document.querySelector("#audioVolumeValue"),
      deviceBrightness: document.querySelector("#deviceBrightness"),
      deviceBrightnessValue: document.querySelector("#deviceBrightnessValue"),
      nightBrightness: document.querySelector("#nightBrightness"),
      nightBrightnessValue: document.querySelector("#nightBrightnessValue"),
      pollSeconds: document.querySelector("#pollSeconds"),
      pollSecondsValue: document.querySelector("#pollSecondsValue"),
      cycleSeconds: document.querySelector("#cycleSeconds"),
      cycleSecondsValue: document.querySelector("#cycleSecondsValue"),
      timetableCycleSeconds: document.querySelector("#timetableCycleSeconds"),
      timetableCycleSecondsValue: document.querySelector("#timetableCycleSecondsValue"),
      timetableItemCount: document.querySelector("#timetableItemCount"),
      timetableItemCountValue: document.querySelector("#timetableItemCountValue"),
      avinorWindowHours: document.querySelector("#avinorWindowHours"),
      avinorWindowHoursValue: document.querySelector("#avinorWindowHoursValue"),
      timetableScrollSpeed: document.querySelector("#timetableScrollSpeed"),
      timetableScrollSpeedValue: document.querySelector("#timetableScrollSpeedValue"),
      scrollSpeed: document.querySelector("#scrollSpeed"),
      scrollSpeedValue: document.querySelector("#scrollSpeedValue"),
      configRefreshSeconds: document.querySelector("#configRefreshSeconds"),
      configRefreshSecondsValue: document.querySelector("#configRefreshSecondsValue"),
      airlineColor: document.querySelector("#airlineColor"),
      routeColor: document.querySelector("#routeColor"),
      aircraftColor: document.querySelector("#aircraftColor"),
      contextColor: document.querySelector("#contextColor"),
      progressColor: document.querySelector("#progressColor"),
      routeProgressColor: document.querySelector("#routeProgressColor"),
      timetableHeaderColor: document.querySelector("#timetableHeaderColor"),
      timetableDataColor: document.querySelector("#timetableDataColor"),
      timetableTimeColor: document.querySelector("#timetableTimeColor"),
      timetableNewTimeColor: document.querySelector("#timetableNewTimeColor"),
      timetableCanceledColor: document.querySelector("#timetableCanceledColor"),
      timezone: document.querySelector("#timezone"),
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
    let clockAnimationTimer = null;
    let emulatorPollTimer = null;
    let emulatorPolling = false;
    let emulatorPollInFlight = false;
    let formIsDirty = false;
	    let screenState = { active: true, brightnessMode: "day", lastActivatedAt: null, lastDeactivatedAt: null, lastBrightnessModeChangedAt: null, updatedAt: null, source: null };
	    let soundState = { testNonce: 0, lastTriggeredAt: null, source: null };
	    const logoCache = new Map();
	    const adminTokenStorageKey = "flightDisplayAdminToken";
	    const defaultAircraftCategories = ["P", "C", "M", "J", "H", "B", "G", "D", "V", "O", "N"];

    init();

    function adminToken() {
      return localStorage.getItem(adminTokenStorageKey) || "";
    }

    function adminHeaders(headers) {
      const merged = Object.assign({}, headers || {});
      const token = adminToken();
      if (token) merged["X-Flight-Admin-Token"] = token;
      return merged;
    }

    async function apiFetch(url, options) {
      const nextOptions = Object.assign({}, options || {});
      nextOptions.headers = adminHeaders(nextOptions.headers);
      let res = await fetch(url, nextOptions);
      if (res.status !== 401) return res;

      const token = prompt("Admin-token kreves for API-kall:");
      if (!token) return res;
      localStorage.setItem(adminTokenStorageKey, token.trim());
      nextOptions.headers = adminHeaders(options && options.headers);
      res = await fetch(url, nextOptions);
      if (res.status === 401) localStorage.removeItem(adminTokenStorageKey);
      return res;
    }

    async function init() {
      const res = await apiFetch("/api/config");
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
      els.audioVolumePercent.addEventListener("input", updateAudioVolumeUi);
      bindRangeValues();
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
      screenState = config.screenState || screenState;
      soundState = config.soundState || soundState;
      els.label.value = config.label || "";
      els.lat.value = Number(config.lat).toFixed(6);
      els.lon.value = Number(config.lon).toFixed(6);
      els.radius.value = config.radiusKm || 10;
      els.homeAirport.value = config.homeAirportIata || "OSL";
	      const follow = config.follow || {};
	      els.airspaceMonitoringEnabled.checked = device.airspaceMonitoringEnabled !== false;
	      const allowedCategories = Array.isArray(device.allowedAircraftCategories) ? device.allowedAircraftCategories : defaultAircraftCategories;
	      els.aircraftCategoryInputs.forEach((input) => {
	        input.checked = allowedCategories.includes(input.dataset.aircraftCategory);
	      });
	      els.followEnabled.checked = follow.enabled === true;
      els.followFlights.value = Array.isArray(follow.flights) ? follow.flights.join(", ") : "";
      updateFollowInputUi();
      els.aviationstackStatus.textContent = config.aviationstackApiKeyConfigured
        ? "Aviationstack: Worker secret AVIATIONSTACK_API_KEY er satt"
        : "Aviationstack: legg inn AVIATIONSTACK_API_KEY under Cloudflare Worker Secrets";
      const followUnits = device.followUnits || {};
      els.altitudeUnit.value = followUnits.altitude || "ft";
      els.speedUnit.value = followUnits.speed || "kn";
      els.trackUnit.value = followUnits.track || "deg";
      els.verticalRateUnit.value = followUnits.verticalRate || "fpm";
      els.deviceBrightness.value = device.brightness ?? 80;
      els.displayMode.value = device.displayMode || "flight";
      displayMode = device.displayMode || displayMode;
      els.clockColor.value = device.clockColor || "#ff2a23";
      els.audioVolumePercent.value = device.audioVolumePercent ?? 35;
      updateAudioVolumeUi();
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
      els.routeProgressColor.value = colors.routeProgress || "#00d46a";
      const timetableColors = device.timetableColors || {};
      els.timetableHeaderColor.value = timetableColors.header || "#f7b500";
      els.timetableDataColor.value = timetableColors.data || "#f4f7ff";
      els.timetableTimeColor.value = timetableColors.time || "#f4f7ff";
      els.timetableNewTimeColor.value = timetableColors.newTime || "#f7b500";
      els.timetableCanceledColor.value = timetableColors.canceled || "#ff3b30";
      els.timezone.value = device.timezone || "Europe/Oslo";
      syncRangeValues();
      updateScreenStateUi();
      updateSoundTestUi();
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
	          enabled: true,
          displayMode: els.displayMode.value,
	          airspaceMonitoringEnabled: els.airspaceMonitoringEnabled.checked,
	          allowedAircraftCategories: els.aircraftCategoryInputs
	            .filter((input) => input.checked)
	            .map((input) => input.dataset.aircraftCategory),
	          brightness: Number(els.deviceBrightness.value),
          audioVolumePercent: Number(els.audioVolumePercent.value),
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
            progress: els.progressColor.value,
            routeProgress: els.routeProgressColor.value
          },
          clockColor: els.clockColor.value,
          timetableColors: {
            header: els.timetableHeaderColor.value,
            data: els.timetableDataColor.value,
            time: els.timetableTimeColor.value,
            newTime: els.timetableNewTimeColor.value,
            canceled: els.timetableCanceledColor.value
          },
          nightMode: {
            enabled: true,
            start: "23:00",
            end: "07:00",
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
      const res = await apiFetch("/api/config", {
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

    els.soundTest.addEventListener("click", async () => {
      els.soundTest.disabled = true;
      els.soundTestStatus.textContent = "Lydtest: sender...";
      try {
        const res = await apiFetch("/api/sound-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "web" })
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json && json.error ? json.error : "Kunne ikke trigge lydtest");
        }
        soundState = json;
        updateSoundTestUi();
      } catch (error) {
        els.soundTestStatus.textContent = "Lydtest feilet";
      } finally {
        els.soundTest.disabled = false;
      }
    });

    els.screenToggle.addEventListener("click", async () => {
      const nextActive = !(screenState && screenState.active !== false);
      els.screenToggle.disabled = true;
      els.screenToggle.textContent = nextActive ? "Slår på..." : "Slår av...";
      try {
        const res = await apiFetch("/api/admin/screen-state/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json && json.error ? json.error : "Kunne ikke endre skjermstatus");
        }
        screenState = json;
        updateScreenStateUi();
        renderEmulator();
      } catch (error) {
        els.screenStateSummary.textContent = "Skjermstatus kunne ikke endres";
      } finally {
        els.screenToggle.disabled = false;
      }
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

    els.refresh.addEventListener("click", (event) => {
      event.stopPropagation();
      loadPreview();
    });
    els.refreshAvinor.addEventListener("click", (event) => {
      event.stopPropagation();
      loadAvinorRawOnly();
    });
    els.emuPolling.addEventListener("click", () => setEmulatorPolling(!emulatorPolling));
    els.emuSource.addEventListener("change", () => {
      resetFlightCycle();
      renderEmulator();
    });
    els.displayMode.addEventListener("change", () => {
      updateScreenStateUi();
      resetFlightCycle();
      renderEmulator();
    });
    els.imageUpload.addEventListener("change", handleImageUpload);
    [
      els.deviceBrightness,
      els.clockColor,
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
      els.routeProgressColor,
      els.displayMode,
      els.timetableHeaderColor,
      els.timetableDataColor,
      els.timetableTimeColor,
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
        const res = await apiFetch("/api/display?ts=" + Date.now());
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Kunne ikke hente display-data");
        const flights = Array.isArray(data.flights) ? data.flights : [];
        displayMode = data.mode || (flights.length ? "nearby" : "idle");
        screenState = data.screenState || screenState;
        updateScreenStateUi();
        idleScreens = Array.isArray(data.idleScreens) ? data.idleScreens : [];
        displayFlights = flights;
        currentFlightIndex = 0;
        currentIdleScreenIndex = 0;
        resetFlightCycle();
        renderEmulator();
        const liveSource = "FR24";
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
        if (displayMode === "clock") {
          const timezone = data.clock && data.clock.timezone ? data.clock.timezone : (els.timezone.value || "Europe/Oslo");
          els.flightList.innerHTML = '<div class="empty">Klokkemodus aktiv. Emulatoren viser Gorgy-inspirert klokke i 63 x 63 px med farge ' + escapeHtml(els.clockColor.value) + ' og tidssone ' + escapeHtml(timezone) + '.</div>';
          return;
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
        void loadAvinorPreview();
      } catch (error) {
        els.previewMeta.textContent = "";
        els.flightList.innerHTML = '<div class="empty error">' + escapeHtml(error.message || "Ukjent feil") + '</div>';
      }
    }

    async function loadAvinorPreview() {
      try {
        const avinorRes = await apiFetch("/api/avinor-board?ts=" + Date.now());
        const avinorData = await avinorRes.json();
        if (avinorRes.ok) {
          renderAvinorRaw(avinorData);
        }
      } catch {
        els.avinorRaw.innerHTML = "";
      }
    }

    async function loadAvinorRawOnly() {
      els.previewMeta.textContent = "Henter Avinor...";
      els.flightList.innerHTML = "";
      els.avinorRaw.innerHTML = "";
      try {
        const avinorRes = await apiFetch("/api/avinor-board?ts=" + Date.now());
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
      if (row.status === "empty" || row.message) return String(row.message || "").replace("|", " / ");
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

      if (screenState && screenState.active === false) {
        applyDisplayBrightness(sourceCtx);
        drawLedPanel(ctx, source);
        els.emuMeta.textContent = "Skjermen er deaktivert eksternt og skal være svart.";
        return;
      }

      if (els.emuSource.value === "live") {
        if (els.displayMode.value === "clock" || displayMode === "clock") {
          drawClockLayout(sourceCtx);
          applyDisplayBrightness(sourceCtx);
          drawLedPanel(ctx, source);
          return;
        }
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
      if (flight.layout === "follow_cycle" || flight.layout === "follow_status" || displayMode === "follow") {
        drawFollowFlightText(ctx, flight);
        els.emuMeta.textContent = "Live cycle layout: " + (flight.flt || flight.cs || "flight") + " · live metrics og Flying over.";
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
      const detailPhase = getFollowDetailPhase();
      const detailPhaseStartedAt = getFollowDetailPhaseStartedAt();
      const etaLine = flight.arrTime ? "ETA:" + flight.arrTime : "";
      const airlineLine = (flight.lines && flight.lines.airline) || flight.air || flight.airCode || "";
      const topLine = detailPhase === "location" && airlineLine ? airlineLine : flight.flt || flight.cs || "";
      const secondLine = detailPhase === "location" && etaLine ? etaLine : route || airlineLine || "";
      const thirdLine = flight.ac || flight.reg || "";
      drawTickerLineBoxed(ctx, topLine, 50, 5, colors.airline, 75, detailPhaseStartedAt);
      drawTickerLineBoxed(ctx, secondLine, 50, 19, colors.route, 75, detailPhaseStartedAt);
      drawTickerLineBoxed(ctx, thirdLine, 50, 33, colors.aircraft, 75, detailPhaseStartedAt);
      if (flight.followStatus) {
        const statusColor = flight.followStatus.color === "landed" ? "#00d46a" : getTimetableColors().header;
        drawTickerLine(ctx, flight.followStatus.text || "", 3, 47, statusColor, 122);
        drawTickerLine(ctx, flight.followStatus.detail || "", 3, 56, statusColor, 122);
        return;
      }
      if (detailPhase === "location") {
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

    function drawClockLayout(ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 128, 64);

      const clockX = 32;
      const clockY = 0;
      const clockSize = 63;
      const centerX = clockX + Math.floor(clockSize / 2);
      const centerY = clockY + Math.floor(clockSize / 2);
      const color = getClockColor();
      const time = getClockTimeParts();
      const outerDots = buildClockCirclePoints(centerX, centerY, 31, 12);
      const secondDots = buildClockSecondPoints(centerX, centerY, 27);
      const activeSecondDots = time.second === 0 ? 0 : time.second === 59 ? secondDots.length : time.second;

      ensureClockAnimation();
      ctx.fillStyle = color;
      outerDots.forEach((point) => ctx.fillRect(point.x, point.y, 1, 1));
      secondDots.slice(0, activeSecondDots).forEach((point) => ctx.fillRect(point.x, point.y, 1, 1));

      drawClockTimeText(ctx, time.hour + ":" + time.minute, Math.round(centerX), Math.round(centerY), color);
      els.emuMeta.textContent = "Clock layout: 63 x 63 px Gorgy-inspirert klokke, sentrert i 128 x 64 · sekund " + time.second + ".";
    }

    function getClockColor() {
      return els.clockColor.value || "#ff2a23";
    }

    function getClockTimeParts() {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: els.timezone.value || "Europe/Oslo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).formatToParts(now);
      return {
        hour: parts.find((part) => part.type === "hour")?.value || "00",
        minute: parts.find((part) => part.type === "minute")?.value || "00",
        second: Number(parts.find((part) => part.type === "second")?.value || "0")
      };
    }

    function ensureClockAnimation() {
      if (clockAnimationTimer) return;
      const tick = () => {
        clockAnimationTimer = null;
        if (els.emuSource.value !== "live" || (els.displayMode.value !== "clock" && displayMode !== "clock")) return;
        renderEmulator();
        ensureClockAnimation();
      };
      clockAnimationTimer = setTimeout(tick, millisecondsUntilNextSecond());
    }

    function millisecondsUntilNextSecond() {
      const now = new Date();
      return Math.max(50, 1000 - now.getMilliseconds() + 20);
    }

    function buildClockCirclePoints(centerX, centerY, radius, count) {
      const points = [];
      const seen = new Set();
      for (let index = 0; index < count; index += 1) {
        const angle = (-Math.PI / 2) + (index / count) * Math.PI * 2;
        const x = Math.round(centerX + Math.cos(angle) * radius);
        const y = Math.round(centerY + Math.sin(angle) * radius);
        const key = x + ":" + y;
        if (seen.has(key)) continue;
        seen.add(key);
        points.push({ x, y });
      }
      return points;
    }

    function buildClockSecondPoints(centerX, centerY, radius) {
      const outline = buildMidpointCircleOutline(centerX, centerY, radius)
        .sort((a, b) => a.angle - b.angle);
      const points = [];
      const offset = outline.findIndex((point) => point.x === centerX && point.y === centerY - radius);
      const ordered = offset > 0 ? outline.slice(offset).concat(outline.slice(0, offset)) : outline;
      const step = ordered.length / 60;
      for (let index = 0; index < 60; index += 1) {
        const point = ordered[Math.round(index * step) % ordered.length];
        points.push({ x: point.x, y: point.y });
      }
      return points;
    }

    function buildMidpointCircleOutline(centerX, centerY, radius) {
      const points = new Map();
      let x = radius;
      let y = 0;
      let decision = 1 - x;
      while (y <= x) {
        [
          [x, y], [y, x], [-y, x], [-x, y],
          [-x, -y], [-y, -x], [y, -x], [x, -y]
        ].forEach(([dx, dy]) => {
          const px = centerX + dx;
          const py = centerY + dy;
          const angle = (Math.atan2(py - centerY, px - centerX) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
          const key = px + ":" + py;
          points.set(key, { x: px, y: py, angle, key });
        });
        y += 1;
        if (decision <= 0) {
          decision += 2 * y + 1;
        } else {
          x -= 1;
          decision += 2 * (y - x) + 1;
        }
      }
      return Array.from(points.values());
    }

    function drawClockTimeText(ctx, text, centerX, centerY, color) {
      const value = normalizeLedText(text).toUpperCase();
      const width = measureDotText(value);
      const startX = centerX - Math.floor(width / 2);
      const startY = centerY - 3;
      drawDotText(ctx, value, startX, startY, color, { maxWidth: 63 });
    }

    function getFollowDetailPhase() {
      const elapsed = Math.max(0, performance.now() - flightCycleStartedAt);
      return elapsed % 15000 < 10000 ? "metrics" : "location";
    }

    function getFollowDetailPhaseStartedAt() {
      const elapsed = Math.max(0, performance.now() - flightCycleStartedAt);
      const cycleIndex = Math.floor(elapsed / 15000);
      return flightCycleStartedAt + cycleIndex * 15000 + (elapsed % 15000 < 10000 ? 0 : 10000);
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
      drawLocalClock(ctx, 125, 3, colors.time);
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
      if (status === "empty" || row.message) {
        const parts = String(row.message || row.flightId || "").split("|");
        drawDotText(ctx, (parts[0] || "").toUpperCase(), x, y, colors.data, { maxWidth: 122 });
        if (parts[1]) drawDotText(ctx, parts[1].toUpperCase(), x, y + 11, colors.data, { maxWidth: 122 });
        return;
      }
      const gateBlinkOn = Math.floor(performance.now() / 1200) % 2 === 0;
      const gateStatusText = kind === "departures" ? normalizeGateStatusForDisplay(row.gateMessage) : "";
      const arrivalStatusText = kind === "arrivals" && status === "done" ? "Landed" : "";
      const gateText = kind === "departures" && row.gate ? row.gate : "";
      const airportText = kind === "departures" && gateText && !gateBlinkOn ? gateText : row.airport || "";
      const timeColor = status === "canceled" ? colors.canceled : status === "newTime" ? colors.newTime : colors.time;
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
      if (raw.includes("gotogate") || raw.includes("togate")) return "Go to gate";
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
      const textWidth = measureDotText("00:00");
      const x = rightX - textWidth;
      drawDotText(ctx, hour, x, y, color, { maxWidth: 12 });
      if (second % 2 === 0) drawDotText(ctx, ":", x + measureDotText("00"), y, color, { maxWidth: 5 });
      drawDotText(ctx, minute, x + measureDotText("00:"), y, color, { maxWidth: 12 });
    }

    function getTimetableColors() {
      return {
        header: els.timetableHeaderColor.value || "#f7b500",
        data: els.timetableDataColor.value || "#f4f7ff",
        time: els.timetableTimeColor.value || "#f4f7ff",
        newTime: els.timetableNewTimeColor.value || "#f7b500",
        canceled: els.timetableCanceledColor.value || "#ff3b30"
      };
    }

    function formatScreenTimestamp(value) {
      if (!value) return "aldri";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "aldri";
      return new Intl.DateTimeFormat("nb-NO", {
        dateStyle: "short",
        timeStyle: "medium"
      }).format(date);
    }

    function updateScreenStateUi() {
      const active = screenState && screenState.active !== false;
      const brightnessMode = screenState && screenState.brightnessMode === "night" ? "natt" : "dag";
      const displayModeLabel = els.displayMode.value === "clock" ? "klokke" : "fly";
      const source = screenState && screenState.source ? " via " + screenState.source : "";
      els.screenStateSummary.textContent = "Skjermstatus: " + (active ? "på" : "av") + " · modus: " + displayModeLabel + " · lysmodus: " + brightnessMode + source;
      els.screenToggle.textContent = active ? "Slå av skjerm" : "Slå på skjerm";
      els.screenToggle.classList.toggle("danger", active);
      els.screenStateTimestamps.textContent =
        "Sist aktivert: " + formatScreenTimestamp(screenState && screenState.lastActivatedAt)
        + " · sist deaktivert: " + formatScreenTimestamp(screenState && screenState.lastDeactivatedAt)
        + " · sist byttet lysmodus: " + formatScreenTimestamp(screenState && screenState.lastBrightnessModeChangedAt);
    }

    function updateSoundTestUi() {
      const source = soundState && soundState.source ? " via " + soundState.source : "";
      const volume = soundState && Number.isFinite(Number(soundState.volumePercent)) ? " · volum " + Number(soundState.volumePercent) + "%" : "";
      els.soundTestStatus.textContent = "Lydtest: " + formatScreenTimestamp(soundState && soundState.lastTriggeredAt) + source + volume;
    }

    function updateAudioVolumeUi() {
      els.audioVolumeValue.textContent = String(Math.round(Number(els.audioVolumePercent.value || 0)));
    }

    function updateFollowInputUi() {
      els.followFlightsLabel.textContent = "Flightnummer";
      els.followFlights.placeholder = "SK4673, DY1304, DOC45";
      els.followFlightsHelp.textContent = "La stå av for å vise fly i området. Skru på for å følge bestemte fly.";
    }

    function bindRangeValues() {
      [
        els.radius,
        els.audioVolumePercent,
        els.deviceBrightness,
        els.nightBrightness,
        els.pollSeconds,
        els.configRefreshSeconds,
        els.cycleSeconds,
        els.scrollSpeed,
        els.timetableCycleSeconds,
        els.timetableScrollSpeed,
        els.timetableItemCount,
        els.avinorWindowHours
      ].forEach((input) => {
        input.addEventListener("input", syncRangeValues);
      });
      syncRangeValues();
    }

    function syncRangeValues() {
      const pairs = [
        [els.radius, els.radiusValue],
        [els.audioVolumePercent, els.audioVolumeValue],
        [els.deviceBrightness, els.deviceBrightnessValue],
        [els.nightBrightness, els.nightBrightnessValue],
        [els.pollSeconds, els.pollSecondsValue],
        [els.configRefreshSeconds, els.configRefreshSecondsValue],
        [els.cycleSeconds, els.cycleSecondsValue],
        [els.scrollSpeed, els.scrollSpeedValue],
        [els.timetableCycleSeconds, els.timetableCycleSecondsValue],
        [els.timetableScrollSpeed, els.timetableScrollSpeedValue],
        [els.timetableItemCount, els.timetableItemCountValue],
        [els.avinorWindowHours, els.avinorWindowHoursValue]
      ];
      pairs.forEach(([input, output]) => {
        if (input && output) output.textContent = String(Math.round(Number(input.value || 0)));
      });
    }

    function getLineColors() {
      return {
        airline: els.airlineColor.value || "#f4f7ff",
        route: els.routeColor.value || "#f4f7ff",
        aircraft: els.aircraftColor.value || "#f4f7ff",
        context: els.contextColor.value || "#f4f7ff",
        progress: els.progressColor.value || "#f7b500",
        routeProgress: els.routeProgressColor.value || "#00d46a"
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
      if ((flight.layout === "follow_cycle" || displayMode === "follow") && flight && !flight.followStatus && typeof flight.routeProgress === "number") {
        drawRouteProgressValue(ctx, flight.routeProgress, 0);
      }
      if (displayFlights.length <= 1) return;
      const cycleMs = Math.max(2000, Number(els.cycleSeconds.value || 5) * 1000);
      drawCycleProgress(ctx, cycleMs, 63);
    }

    function drawCycleProgress(ctx, cycleMs, y = 0) {
      const elapsed = Math.max(0, performance.now() - flightCycleStartedAt);
      const progress = Math.min(1, elapsed / cycleMs);
      drawProgressValue(ctx, progress, y);
    }

    function drawProgressValue(ctx, progress, y = 0) {
      const width = Math.max(0, Math.min(128, Math.floor(128 * progress)));
      ctx.fillStyle = "#07101c";
      ctx.fillRect(0, y, 128, 1);
      ctx.fillStyle = getLineColors().progress;
      ctx.fillRect(0, y, width, 1);
    }

    function drawRouteProgressValue(ctx, progress, y = 0) {
      const width = Math.max(0, Math.min(128, Math.floor(128 * progress)));
      ctx.fillStyle = "#3c3c3c";
      ctx.fillRect(0, y, 128, 1);
      ctx.fillStyle = getLineColors().routeProgress;
      ctx.fillRect(0, y, width, 1);
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
      const fitsRestingWidth = textWidth <= width;
      const fitsFullWidth = textWidth + Math.max(0, x) <= 128;
      const overflow = fitsRestingWidth || fitsFullWidth ? 0 : Math.max(1, textWidth + Math.max(0, x) - 128);
      const offset = overflow > 0 ? getTickerOffset(overflow) : 0;
      ctx.save();
      ctx.beginPath();
      if (overflow > 0) {
        ctx.rect(0, y, 128, 8);
      } else {
        ctx.rect(x, y, fitsFullWidth ? 128 - Math.max(0, x) : width, 8);
      }
      ctx.clip();
      drawDotText(ctx, text, x - offset, y, color, { maxWidth: textWidth });
      ctx.restore();
    }

    function drawTickerLineBoxed(ctx, text, x, y, color, width, startedAt) {
      if (!text) return;
      ensureTickerAnimation();
      const textWidth = measureDotText(text);
      const overflow = textWidth <= width ? 0 : Math.max(1, textWidth - width);
      const offset = overflow > 0 ? getTickerForwardOffset(overflow, startedAt) : 0;
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

    function getTickerForwardOffset(overflow, startedAt) {
      const holdMs = 900;
      const pxPerSecond = Math.max(2, Number(els.scrollSpeed.value || 9));
      const travelMs = Math.max(1200, (overflow / pxPerSecond) * 1000);
      const cycleMs = holdMs + travelMs + holdMs;
      const t = (performance.now() - startedAt) % cycleMs;
      if (t < holdMs) return 0;
      if (t < holdMs + travelMs) return Math.round(((t - holdMs) / travelMs) * overflow);
      return overflow;
    }

    function measureDotText(text) {
      return Array.from(normalizeLedText(text)).reduce((width, char) => width + dotCharAdvance(char), 0);
    }

    function dotCharAdvance(char) {
      if (char === " ") return 4;
      if (char === ":") return 5;
      return 6;
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
        "(": ["00010","00100","01000","01000","01000","00100","00010"],
        ")": ["01000","00100","00010","00010","00010","00100","01000"],
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
        cursor += dotCharAdvance(char);
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
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Flight-Admin-Token,X-Flight-Device-Token"
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
