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
  ADMIN_EMAILS?: string;
  DEVICE_API_TOKEN?: string;
  CREDENTIAL_ENCRYPTION_KEY?: string;
  ACCESS_TEAM_DOMAIN?: string;
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

type RequestContext = {
  screenId?: string;
  deviceId?: string;
  tokenHash?: string;
  userEmail?: string;
};

type DeviceRecord = {
  deviceId: string;
  screenId: string;
  tokenHash: string;
  pairedAt: string;
  ownerEmail?: string;
  lastSeenAt?: string;
  firmwareVersion?: string;
  deletedAt?: string;
};

type HomeyTokenRecord = {
  token: string;
  createdAt: string;
  rotatedAt?: string | null;
};

type HomeyAuthResult = {
  ok: boolean;
  screenId?: string;
  detectedHeader: "X-SkyFrame-Homey-Token" | "X-Homey-Token" | "Authorization" | "none";
  screenLookupSucceeded: boolean;
  tokenRecordFound: boolean;
  failureReason?: "missing-screen-id" | "default-screen-not-supported" | "screen-owner-not-found" | "homey-token-not-found" | "token-mismatch";
};

type ProvisionRecord = {
  code: string;
  hardwareId: string;
  screenId: string;
  deviceId: string;
  status: "pending" | "claimed";
  createdAt: string;
  claimedAt?: string;
  ownerEmail?: string;
  token?: string;
  tokenHash?: string;
};

type FollowSettings = {
  enabled: boolean;
  flights: string[];
};

type DeviceSettings = {
  enabled: boolean;
  displayMode: DisplayBehaviorMode;
  airspaceMonitoringEnabled: boolean;
  allowedAircraftCategories: AircraftCategoryCode[];
  brightness: number;
  audioVolumePercent: number;
  pollSeconds: number;
  displayCycleSeconds: number;
  timetableCycleSeconds: number;
  timetableItemCount: number;
  departureTimetableItemCount: number;
  arrivalTimetableItemCount: number;
  avinorWindowHours: number;
  departureAvinorWindowHours: number;
  arrivalAvinorWindowHours: number;
  timetableScrollPixelsPerSecond: number;
  timetableTransitionMs: number;
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
  clockTopColor: string;
  timetableColors: {
    header: string;
    data: string;
    time: string;
    newTime: string;
    canceled: string;
    gateGoToGate: string;
    gateBoarding: string;
    gateClosing: string;
    gateClosed: string;
    landed: string;
  };
  colorPresets: ColorCustomSets;
  nightMode: {
    enabled: boolean;
    start: string;
    end: string;
    brightness: number;
  };
};

type AirspaceColors = DeviceSettings["lineColors"];
type AirportBoardColors = DeviceSettings["timetableColors"];
type ClockColors = {
  clockTopColor: string;
  clockColor: string;
};

type ColorCustomSets = {
  airspace?: AirspaceColors;
  airportBoard?: AirportBoardColors;
  clock?: ClockColors;
};

type DisplayBehaviorMode = "airspace" | "hybrid" | "airport_board" | "clock";

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

type DeviceStatus = {
  ok: boolean;
  connected: boolean;
  updatedAt: string;
  deviceId: string | null;
  uptimeMs: number | null;
  wifi: {
    connected: boolean;
    ssid: string | null;
    rssi: number | null;
    ip: string | null;
  };
  screenActive: boolean | null;
  configOk: boolean | null;
  displayOk: boolean | null;
  displayMode: string | null;
  firmwareVersion: string | null;
  ota: {
    status: string | null;
    lastError: string | null;
    latestVersion: string | null;
    lastCheckedMs: number | null;
  };
  source: string | null;
};

type DeviceCommand = {
  command: "restart" | "unpair" | "forget_wifi" | "factory_reset" | "ota_update";
  commandNonce: number;
  issuedAt: string;
  source: string;
};

type FirmwareManifest = {
  version: string;
  url: string;
  sha256: string;
  size: number;
};

type AircraftCategoryCode = "P" | "C" | "M" | "J" | "T" | "H" | "B" | "G" | "D" | "V" | "O" | "N";

type RealtimeEvent = {
  type: "hello" | "config_changed" | "display_changed" | "sound_test" | "device_status" | "device_command";
  updatedAt: string;
  source?: string;
  testNonce?: number;
  volumePercent?: number;
  command?: DeviceCommand["command"];
  commandNonce?: number;
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
  topColor: string;
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

type TimetableSymbolState =
  | "goToGate"
  | "boarding"
  | "gateClosing"
  | "gateClosed"
  | "landed";

type IdleScreen = {
  title: "DEPARTURES" | "ARRIVALS";
  kind: "departures" | "arrivals";
  rows: IdleRow[];
};

const CONFIG_KEY = "config:v1";
const SCREEN_STATE_KEY = "screen-state:v1";
const HOMEY_TOKEN_KEY = "homey-token:v1";
const ACCOUNT_FR24_SECRET_KEY = "secret:fr24-api-key:v1";
const SOUND_STATE_KEY = "sound-state:v1";
const DEVICE_STATUS_KEY = "device-status:v1";
const DEVICE_COMMAND_KEY = "device-command:v1";
const DEFAULT_SCREEN_ID = "main";
const PROVISION_TTL_SECONDS = 15 * 60;
const DEVICE_TOKEN_BYTES = 32;
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

const DEFAULT_AIRSPACE_COLORS: AirspaceColors = {
  airline: "#ffc777",
  route: "#ffc777",
  aircraft: "#ffc777",
  context: "#ffaa00",
  progress: "#aaaaaa",
  routeProgress: "#00f900"
};

const DEFAULT_CLOCK_COLORS: ClockColors = {
  clockTopColor: "#ffc777",
  clockColor: "#f8ff00"
};

const DEFAULT_AIRPORT_BOARD_COLORS: AirportBoardColors = {
  header: "#ff8f00",
  data: "#ffc777",
  time: "#ff8f00",
  newTime: "#ff8f00",
  canceled: "#444444",
  gateGoToGate: "#ffc777",
  gateBoarding: "#dbf93a",
  gateClosing: "#ff6a00",
  gateClosed: "#ff2600",
  landed: "#dbf93a"
};

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
    if (typeof message !== "string") return;
    try {
      const event = JSON.parse(message) as RealtimeEvent & Record<string, unknown>;
      if (event.type === "device_status") {
        const status = normalizeDeviceStatus(event, new Date().toISOString());
        await this.env.FLIGHT_DISPLAY_KV.put(DEVICE_STATUS_KEY, JSON.stringify(status));
      }
    } catch {
      // Ignore malformed device telemetry; realtime control messages should keep flowing.
    }
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
      const context = await resolveRequestContext(request, env, url.pathname);
      const authFailure = await authorizeRequest(request, env, url.pathname, context);
      if (authFailure) return authFailure;

      if (url.pathname === "/") return serveAppShell(request, env);
      if (url.pathname === "/admin" || url.pathname === "/admin/") return adminPageResponse(request, env, context);
      if (url.pathname === "/start") return htmlResponse(renderStartHtml());
      if (url.pathname === "/screen-setup") return htmlResponse(context.userEmail ? renderScreenSetupHtml(context.userEmail) : renderLoginRequiredHtml());
      if (url.pathname === "/public/provision/start" && request.method === "POST") return startProvisioning(request, env);
      if (url.pathname === "/public/provision/status" && request.method === "POST") return provisioningStatus(request, env);
      if (url.pathname === "/public/realtime") return realtimeResponse(request, env, context);
      if (url.pathname === "/public/realtime-state" && request.method === "GET") return realtimeStateResponse(env, context);
      if (url.pathname === "/public/device-status" && request.method === "POST") return saveDeviceStatus(request, env, context);
      if (url.pathname === "/public/firmware/latest.json" && request.method === "GET") return firmwareAssetResponse(request, env, "/firmware/latest.json", "application/json; charset=utf-8");
      if (url.pathname.match(/^\/public\/firmware\/[^/]+\.bin$/) && request.method === "GET") return firmwareAssetResponse(request, env, url.pathname.replace(/^\/public/, ""), "application/octet-stream");
      if (url.pathname === "/public/device-config" && request.method === "GET") return deviceConfigResponse(env, context);
      if (url.pathname === "/public/sound-state" && request.method === "GET") return soundStateResponse(env, context);
      if (url.pathname === "/public/display" && request.method === "GET") return flightsResponse(env, true, context);
      if (url.pathname.match(/^\/public\/homey\/screens\/[^/]+\/screen-state\/activate$/) && isAutomationRequestMethod(request)) return writeScreenState(env, { active: true }, "homey-api", context);
      if (url.pathname.match(/^\/public\/homey\/screens\/[^/]+\/screen-state\/deactivate$/) && isAutomationRequestMethod(request)) return writeScreenState(env, { active: false }, "homey-api", context);
      if (url.pathname.match(/^\/public\/homey\/screens\/[^/]+\/brightness-mode\/day$/) && isAutomationRequestMethod(request)) return writeScreenState(env, { brightnessMode: "day" }, "homey-api", context);
      if (url.pathname.match(/^\/public\/homey\/screens\/[^/]+\/brightness-mode\/night$/) && isAutomationRequestMethod(request)) return writeScreenState(env, { brightnessMode: "night" }, "homey-api", context);
      if (url.pathname.startsWith("/public/logos-rgb565/")) return logoRgb565Response(request, env);
      if (url.pathname.startsWith("/public/logos/")) return logoAssetResponse(request, env);
      if (url.pathname.startsWith("/logos-rgb565/")) return logoRgb565Response(request, env);
      if (url.pathname.startsWith("/logos/")) return logoAssetResponse(request, env);
      if (url.pathname === "/api/provision/claim" && request.method === "POST") return claimProvisioning(request, env, context);
      if (url.pathname.match(/^\/api\/screens\/[^/]+\/config$/) && request.method === "GET") return configResponse(env, context);
      if (url.pathname.match(/^\/api\/screens\/[^/]+\/config$/) && request.method === "POST") return saveConfig(request, env, context);
      if (url.pathname.match(/^\/api\/screens\/[^/]+\/fr24-key$/) && request.method === "GET") return fr24KeyStatusResponse(env, context);
      if (url.pathname.match(/^\/api\/screens\/[^/]+\/fr24-key$/) && request.method === "POST") return saveFr24Key(request, env, context);
      if (url.pathname === "/api/account/fr24-key" && request.method === "GET") return fr24KeyStatusResponse(env, context);
      if (url.pathname === "/api/account/fr24-key" && request.method === "POST") return saveFr24Key(request, env, context);
      if (url.pathname === "/api/account/homey-token/rotate" && request.method === "POST") return rotateHomeyToken(request, env, context);
      if (url.pathname.match(/^\/api\/screens\/[^/]+\/display$/) && request.method === "GET") return flightsResponse(env, true, context);
      if (url.pathname.match(/^\/api\/screens\/[^/]+\/device-status$/) && request.method === "GET") return deviceStatusResponse(env, context);
      if (url.pathname.match(/^\/api\/screens\/[^/]+\/screen-state\/activate$/) && isAutomationRequestMethod(request)) return writeScreenState(env, { active: true }, "homey-api", context);
      if (url.pathname.match(/^\/api\/screens\/[^/]+\/screen-state\/deactivate$/) && isAutomationRequestMethod(request)) return writeScreenState(env, { active: false }, "homey-api", context);
      if (url.pathname.match(/^\/api\/screens\/[^/]+\/brightness-mode\/day$/) && isAutomationRequestMethod(request)) return writeScreenState(env, { brightnessMode: "day" }, "homey-api", context);
      if (url.pathname.match(/^\/api\/screens\/[^/]+\/brightness-mode\/night$/) && isAutomationRequestMethod(request)) return writeScreenState(env, { brightnessMode: "night" }, "homey-api", context);
      if (url.pathname === "/api/config" && request.method === "GET") return configResponse(env, context);
      if (url.pathname === "/api/config" && request.method === "POST") return saveConfig(request, env, context);
      if (url.pathname === "/api/device-config" && request.method === "GET") return deviceConfigResponse(env, context);
      if (url.pathname === "/api/realtime-state" && request.method === "GET") return realtimeStateResponse(env, context);
      if (url.pathname === "/api/device-status" && request.method === "GET") return deviceStatusResponse(env, context);
      if (url.pathname === "/api/firmware/latest" && request.method === "GET") return firmwareLatestResponse(request, env);
      if (url.pathname === "/api/sound-state" && request.method === "GET") return soundStateResponse(env, context);
      if (url.pathname === "/api/logo-status" && request.method === "GET") return logoStatusResponse(env);
      if (url.pathname === "/api/admin/screens" && request.method === "GET") return adminScreensResponse(request, env, context);
      if (url.pathname.match(/^\/api\/admin\/screens\/[^/]+$/) && request.method === "DELETE") return deleteAdminScreen(request, env, context, url.pathname);
      if (url.pathname.match(/^\/api\/admin\/screens\/[^/]+\/command$/) && request.method === "POST") return adminDeviceCommand(request, env, context, url.pathname);
      if (url.pathname === "/api/admin/screen-state/toggle" && request.method === "POST") return toggleScreenState(env, context);
      if (url.pathname === "/api/device-command" && request.method === "POST") return sendDeviceCommand(request, env, context);
      if (url.pathname === "/api/screen-state" && request.method === "GET") return screenStateResponse(env, context);
      if (url.pathname === "/api/screen-state" && request.method === "POST") return saveScreenState(request, env, context);
      if (url.pathname === "/api/screen-state/activate" && request.method === "POST") return writeScreenState(env, { active: true }, "homey-api", context);
      if (url.pathname === "/api/screen-state/deactivate" && request.method === "POST") return writeScreenState(env, { active: false }, "homey-api", context);
      if (url.pathname === "/api/display-mode" && request.method === "GET") return displayModeResponse(env, context);
      if (url.pathname === "/api/display-mode" && request.method === "POST") return saveDisplayMode(request, env, context);
      if (url.pathname === "/api/display-mode/flight" && request.method === "POST") return writeDisplayMode(env, "hybrid", "homey-api", context);
      if (url.pathname === "/api/display-mode/clock" && request.method === "POST") return writeDisplayMode(env, "clock", "homey-api", context);
      if (url.pathname === "/api/brightness-mode" && request.method === "GET") return brightnessModeResponse(env, context);
      if (url.pathname === "/api/brightness-mode" && request.method === "POST") return saveBrightnessMode(request, env, context);
      if (url.pathname === "/api/brightness-mode/day" && request.method === "POST") return writeScreenState(env, { brightnessMode: "day" }, "homey-api", context);
      if (url.pathname === "/api/brightness-mode/night" && request.method === "POST") return writeScreenState(env, { brightnessMode: "night" }, "homey-api", context);
      if (url.pathname === "/api/sound-test" && request.method === "POST") return triggerSoundTest(request, env, context);
      if (url.pathname === "/api/flights" && request.method === "GET") return flightsResponse(env, false, context);
      if (url.pathname === "/api/display" && request.method === "GET") return flightsResponse(env, true, context);
      if (url.pathname === "/api/avinor-board" && request.method === "GET") return avinorBoardResponse(env, context);
      if (url.pathname === "/api/aviationstack" && request.method === "GET") return aviationstackDebugResponse(request, env, context);
      if (url.pathname === "/api/health") return jsonResponse({ ok: true });

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return jsonResponse({ error: message }, 500);
    }
  }
};

async function resolveRequestContext(request: Request, env: Env, pathname: string): Promise<RequestContext> {
  const screenId = screenIdFromApiPath(pathname) || screenIdFromQuery(request);
  const userEmail = authenticatedUserEmail(request);
  const deviceToken = requestDeviceToken(request);
  if (!deviceToken) {
    if (screenId) return { screenId, userEmail };
    if (userEmail && !pathname.startsWith("/api/provision/")) {
      const screens = await listUserScreens(env, userEmail);
      const firstScreen = screens[0];
      if (firstScreen) return { screenId: firstScreen.screenId, userEmail };
    }
    return { userEmail };
  }

  const tokenHash = await sha256Hex(deviceToken);
  const device = await env.FLIGHT_DISPLAY_KV.get(deviceTokenKey(tokenHash), "json") as DeviceRecord | null;
  if (device && isDeviceRecord(device)) {
    return {
      screenId: device.screenId,
      deviceId: device.deviceId,
      tokenHash,
      userEmail
    };
  }

  return screenId ? { screenId, tokenHash, userEmail } : { tokenHash, userEmail };
}

async function listUserScreens(env: Env, userEmail: string): Promise<DeviceRecord[]> {
  const email = normalizeEmail(userEmail);
  if (!email) return [];
  const records = await listDeviceRecords(env);
  return records
    .filter((record) => normalizeEmail(record.ownerEmail) === email)
    .sort((a, b) => String(a.pairedAt || "").localeCompare(String(b.pairedAt || "")))
    .reverse();
}

async function authorizeRequest(request: Request, env: Env, pathname: string, context: RequestContext): Promise<Response | undefined> {
  const adminToken = normalizeSecretString(env.ADMIN_API_TOKEN);
  const deviceToken = normalizeSecretString(env.DEVICE_API_TOKEN);
  const isPublicHomeyPath = isPublicHomeyAutomationPath(pathname);

  if (pathname === "/api/health") return undefined;
  if (pathname.startsWith("/public/provision/")) return undefined;
  if (pathname.startsWith("/public/logos-rgb565/") || pathname.startsWith("/public/logos/")) return undefined;

  if (isScreenAutomationApiPath(pathname) || isPublicHomeyPath) {
    const homeyAuth = await requestHomeyAuthResult(request, env, context);
    const hasAdminToken = adminToken ? requestHasToken(request, adminToken, "X-Flight-Admin-Token") : false;
    if (!homeyAuth.ok && !hasAdminToken) {
      return jsonResponse({ error: "Unauthorized" }, 401, {
        "Cache-Control": "no-store",
        "WWW-Authenticate": "Bearer"
      });
    }
    if (isPublicHomeyPath) return undefined;
  }

  if (adminToken && isLegacyAutomationApiPath(pathname) && !requestHasToken(request, adminToken, "X-Flight-Admin-Token")) {
    return jsonResponse({ error: "Unauthorized" }, 401, {
      "Cache-Control": "no-store",
      "WWW-Authenticate": "Bearer"
    });
  }

  if (pathname.startsWith("/public/") && context.deviceId) return undefined;

  if (deviceToken && pathname.startsWith("/public/") && !requestHasToken(request, deviceToken, "X-Flight-Device-Token")) {
    return jsonResponse({ error: "Unauthorized" }, 401, {
      "Cache-Control": "no-store",
      "WWW-Authenticate": "Bearer"
    });
  }

  return undefined;
}

function requestDeviceToken(request: Request): string | undefined {
  return normalizeSecretString(request.headers.get("X-Flight-Device-Token") || undefined)
    || normalizeSecretString(request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]);
}

function authenticatedUserEmail(request: Request): string | undefined {
  const direct = normalizeEmail(request.headers.get("CF-Access-Authenticated-User-Email"));
  if (direct) return direct;
  return normalizeEmail(request.headers.get("X-SkyFrame-User-Email"));
}

function normalizeEmail(value: unknown): string | undefined {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : undefined;
}

function requireAuthenticatedUser(context?: RequestContext): Response | undefined {
  if (context?.userEmail) return undefined;
  return jsonResponse({ error: "Login required" }, 401, {
    "Cache-Control": "no-store",
    "WWW-Authenticate": "Bearer"
  });
}

function requireAdminUser(request: Request, env: Env, context?: RequestContext): Response | undefined {
  if (isLocalDevRequest(request)) return undefined;
  const email = normalizeEmail(context?.userEmail);
  const admins = (env.ADMIN_EMAILS || "dan.aksel@gmail.com")
    .split(/[,\s]+/)
    .map(normalizeEmail)
    .filter((value): value is string => Boolean(value));
  if (email && admins.includes(email)) return undefined;
  const acceptsHtml = request.headers.get("Accept")?.includes("text/html");
  if (acceptsHtml) {
    return htmlResponse(renderAdminAccessDeniedHtml(request, email), email ? 403 : 401);
  }
  return jsonResponse({ error: "Admin access required", signedInAs: email || null }, email ? 403 : 401, { "Cache-Control": "no-store" });
}

function isLocalDevRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function screenIdFromQuery(request: Request): string | undefined {
  const value = new URL(request.url).searchParams.get("screenId");
  return normalizeId(value || undefined);
}

function screenIdFromApiPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/(?:api\/screens|public\/homey\/screens)\/([^/]+)/);
  return normalizeId(match?.[1]);
}

function scopedKey(baseKey: string, context?: RequestContext): string {
  const screenId = normalizeId(context?.screenId);
  return screenId && screenId !== DEFAULT_SCREEN_ID ? `screen:${screenId}:${baseKey}` : baseKey;
}

function deviceScreenConfigKey(screenId: string): string {
  return `screen:${screenId}:${CONFIG_KEY}`;
}

function provisionCodeKey(code: string): string {
  return `provision:code:v1:${code.toUpperCase()}`;
}

function provisionDeviceKey(hardwareId: string): string {
  return `provision:hardware:v1:${hardwareId}`;
}

function deviceTokenKey(tokenHash: string): string {
  return `device-token:v1:${tokenHash}`;
}

function deviceRecordKey(deviceId: string): string {
  return `device:v1:${deviceId}`;
}

function fr24ScreenSecretKey(screenId: string): string {
  return `screen:${screenId}:secret:fr24-api-key:v1`;
}

function accountScopedKey(baseKey: string, email: string): string {
  return `account:${email}:${baseKey}`;
}

function normalizeId(value: unknown): string | undefined {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!raw || !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(raw)) return undefined;
  return raw;
}

function isDeviceRecord(value: unknown): value is DeviceRecord {
  const v = value && typeof value === "object" ? value as Partial<DeviceRecord> : {};
  return Boolean(normalizeId(v.deviceId) && normalizeId(v.screenId) && typeof v.tokenHash === "string" && v.tokenHash.length === 64);
}

function normalizeDeviceCommand(value: unknown): DeviceCommand["command"] | undefined {
  return value === "restart" || value === "unpair" || value === "forget_wifi" || value === "factory_reset" || value === "ota_update" ? value : undefined;
}

async function firmwareAssetResponse(request: Request, env: Env, assetPath: string, contentType: string): Promise<Response> {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = assetPath;
  assetUrl.search = "";
  const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
  if (response.status === 404) {
    return jsonResponse({ error: "Firmware asset not found" }, 404, { "Cache-Control": "no-store" });
  }
  const headers = new Headers(response.headers);
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", assetPath.endsWith("latest.json") ? "no-store" : "public, max-age=31536000, immutable");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function normalizeFirmwareManifest(value: unknown): FirmwareManifest | null {
  const v = value && typeof value === "object" ? value as Partial<FirmwareManifest> : {};
  if (typeof v.version !== "string" || !v.version.trim()) return null;
  if (typeof v.url !== "string" || !v.url.trim()) return null;
  if (typeof v.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(v.sha256)) return null;
  if (typeof v.size !== "number" || !Number.isFinite(v.size) || v.size <= 0) return null;
  return {
    version: v.version.trim().slice(0, 40),
    url: v.url.trim(),
    sha256: v.sha256.trim().toLowerCase(),
    size: Math.floor(v.size)
  };
}

async function loadFirmwareManifest(request: Request, env: Env): Promise<FirmwareManifest | null> {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = "/firmware/latest.json";
  assetUrl.search = "";
  const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
  if (!response.ok) return null;
  return normalizeFirmwareManifest(await response.json().catch(() => null));
}

async function firmwareLatestResponse(request: Request, env: Env): Promise<Response> {
  const manifest = await loadFirmwareManifest(request, env);
  if (!manifest) return jsonResponse({ error: "Firmware manifest unavailable" }, 503, { "Cache-Control": "no-store" });
  return jsonResponse(manifest, 200, { "Cache-Control": "no-store" });
}

function realtimeResponse(request: Request, env: Env, context?: RequestContext): Response | Promise<Response> {
  if (!env.REALTIME_HUB) {
    return jsonResponse({ error: "REALTIME_HUB is not configured" }, 500, { "Cache-Control": "no-store" });
  }
  const id = env.REALTIME_HUB.idFromName(realtimeRoomName(context));
  return env.REALTIME_HUB.get(id).fetch(request);
}

async function broadcastRealtime(env: Env, event: RealtimeEvent, context?: RequestContext): Promise<void> {
  if (!env.REALTIME_HUB) return;
  const id = env.REALTIME_HUB.idFromName(realtimeRoomName(context));
  const stub = env.REALTIME_HUB.get(id);
  await stub.fetch("https://realtime.internal/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
}

function realtimeRoomName(context?: RequestContext): string {
  const screenId = normalizeId(context?.screenId);
  return screenId && screenId !== DEFAULT_SCREEN_ID ? `flight-display-screen-${screenId}` : "flight-display-main-v2";
}

function isAutomationApiPath(pathname: string): boolean {
  return isLegacyAutomationApiPath(pathname) || isScreenAutomationApiPath(pathname) || isPublicHomeyAutomationPath(pathname);
}

function isLegacyAutomationApiPath(pathname: string): boolean {
  return pathname === "/api/screen-state"
    || pathname.startsWith("/api/screen-state/")
    || pathname === "/api/display-mode"
    || pathname.startsWith("/api/display-mode/")
    || pathname === "/api/brightness-mode"
    || pathname.startsWith("/api/brightness-mode/");
}

function isScreenAutomationApiPath(pathname: string): boolean {
  return /^\/api\/screens\/[^/]+\/(?:screen-state\/(?:activate|deactivate)|brightness-mode\/(?:day|night))$/.test(pathname);
}

function isPublicHomeyAutomationPath(pathname: string): boolean {
  return /^\/public\/homey\/screens\/[^/]+\/(?:screen-state\/(?:activate|deactivate)|brightness-mode\/(?:day|night))$/.test(pathname);
}

function isAutomationRequestMethod(request: Request): boolean {
  return request.method === "POST";
}

function requestBearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("Authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  return normalizeSecretString(bearer);
}

function requestHasToken(request: Request, expectedToken: string, headerName: string): boolean {
  const directToken = normalizeSecretString(request.headers.get(headerName) || undefined);
  if (constantTimeEquals(directToken, expectedToken)) return true;

  return constantTimeEquals(requestBearerToken(request), expectedToken);
}

async function requestHasHomeyToken(request: Request, env: Env, context?: RequestContext): Promise<boolean> {
  return (await requestHomeyAuthResult(request, env, context)).ok;
}

async function requestHomeyAuthResult(request: Request, env: Env, context?: RequestContext): Promise<HomeyAuthResult> {
  const screenId = normalizeId(context?.screenId);
  const detectedHeader = detectedHomeyAuthHeader(request);
  if (!screenId) {
    return { ok: false, detectedHeader, screenLookupSucceeded: false, tokenRecordFound: false, failureReason: "missing-screen-id" };
  }
  if (screenId === DEFAULT_SCREEN_ID) {
    return { ok: false, screenId, detectedHeader, screenLookupSucceeded: false, tokenRecordFound: false, failureReason: "default-screen-not-supported" };
  }
  const ownerEmail = await ownerEmailForScreen(env, screenId);
  if (!ownerEmail) {
    return { ok: false, screenId, detectedHeader, screenLookupSucceeded: false, tokenRecordFound: false, failureReason: "screen-owner-not-found" };
  }
  const record = await getHomeyTokenRecord(env, ownerEmail, false);
  if (!record) {
    return { ok: false, screenId, detectedHeader, screenLookupSucceeded: true, tokenRecordFound: false, failureReason: "homey-token-not-found" };
  }

  const ok = constantTimeEquals(normalizeSecretString(request.headers.get("X-SkyFrame-Homey-Token") || undefined), record.token)
    || constantTimeEquals(normalizeSecretString(request.headers.get("X-Homey-Token") || undefined), record.token)
    || constantTimeEquals(requestBearerToken(request), record.token);
  return {
    ok,
    screenId,
    detectedHeader,
    screenLookupSucceeded: true,
    tokenRecordFound: true,
    failureReason: ok ? undefined : "token-mismatch"
  };
}

function detectedHomeyAuthHeader(request: Request): HomeyAuthResult["detectedHeader"] {
  if (normalizeSecretString(request.headers.get("X-SkyFrame-Homey-Token") || undefined)) return "X-SkyFrame-Homey-Token";
  if (normalizeSecretString(request.headers.get("X-Homey-Token") || undefined)) return "X-Homey-Token";
  if (requestBearerToken(request)) return "Authorization";
  return "none";
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

async function getConfig(env: Env, context?: RequestContext): Promise<Config> {
  const stored = await env.FLIGHT_DISPLAY_KV.get(scopedKey(CONFIG_KEY, context), "json");
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

function normalizeDeviceStatus(value: unknown, fallbackUpdatedAt: string | null = null): DeviceStatus {
  const v = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const wifi = v.wifi && typeof v.wifi === "object" ? v.wifi as Record<string, unknown> : {};
  const ota = v.ota && typeof v.ota === "object" ? v.ota as Record<string, unknown> : {};
  const updatedAt = typeof v.updatedAt === "string" && v.updatedAt ? v.updatedAt : fallbackUpdatedAt || new Date().toISOString();
  const updatedAtTime = Date.parse(updatedAt);
  const isFresh = Number.isFinite(updatedAtTime) && Date.now() - updatedAtTime < 4 * 60 * 1000;
  const wifiConnected = typeof wifi.connected === "boolean" ? wifi.connected : Boolean(wifi.ssid);
  const connected = isFresh && (typeof v.connected === "boolean" ? v.connected : wifiConnected);
  const displayOk = typeof v.displayOk === "boolean" ? v.displayOk : null;
  return {
    ok: connected && displayOk !== false,
    connected,
    updatedAt,
    deviceId: typeof v.deviceId === "string" && v.deviceId ? v.deviceId.slice(0, 80) : null,
    uptimeMs: typeof v.uptimeMs === "number" && Number.isFinite(v.uptimeMs) ? Math.max(0, Math.floor(v.uptimeMs)) : null,
    wifi: {
      connected: connected && wifiConnected,
      ssid: typeof wifi.ssid === "string" && wifi.ssid ? wifi.ssid.slice(0, 80) : null,
      rssi: typeof wifi.rssi === "number" && Number.isFinite(wifi.rssi) ? Math.round(wifi.rssi) : null,
      ip: typeof wifi.ip === "string" && wifi.ip ? wifi.ip.slice(0, 64) : null
    },
    screenActive: typeof v.screenActive === "boolean" ? v.screenActive : null,
    configOk: typeof v.configOk === "boolean" ? v.configOk : null,
    displayOk,
    displayMode: typeof v.displayMode === "string" && v.displayMode ? v.displayMode.slice(0, 40) : null,
    firmwareVersion: typeof v.firmwareVersion === "string" && v.firmwareVersion ? v.firmwareVersion.slice(0, 40) : null,
    ota: {
      status: typeof ota.status === "string" && ota.status ? ota.status.slice(0, 40) : null,
      lastError: typeof ota.lastError === "string" && ota.lastError ? ota.lastError.slice(0, 120) : null,
      latestVersion: typeof ota.latestVersion === "string" && ota.latestVersion ? ota.latestVersion.slice(0, 40) : null,
      lastCheckedMs: typeof ota.lastCheckedMs === "number" && Number.isFinite(ota.lastCheckedMs) ? Math.max(0, Math.floor(ota.lastCheckedMs)) : null
    },
    source: typeof v.source === "string" && v.source ? v.source.slice(0, 80) : null
  };
}

async function getScreenState(env: Env, context?: RequestContext): Promise<ScreenState> {
  const stored = await env.FLIGHT_DISPLAY_KV.get(scopedKey(SCREEN_STATE_KEY, context), "json");
  return normalizeScreenState(stored);
}

async function getSoundState(env: Env, context?: RequestContext): Promise<SoundState> {
  const stored = await env.FLIGHT_DISPLAY_KV.get(scopedKey(SOUND_STATE_KEY, context), "json");
  if (!stored) return defaultSoundState();
  return normalizeSoundState(stored);
}

async function getDeviceStatus(env: Env, context?: RequestContext): Promise<DeviceStatus | null> {
  const stored = await env.FLIGHT_DISPLAY_KV.get(scopedKey(DEVICE_STATUS_KEY, context), "json");
  return stored ? normalizeDeviceStatus(stored) : null;
}

async function getDeviceCommand(env: Env, context?: RequestContext): Promise<DeviceCommand | null> {
  const stored = await env.FLIGHT_DISPLAY_KV.get(scopedKey(DEVICE_COMMAND_KEY, context), "json") as Partial<DeviceCommand> | null;
  const command = normalizeDeviceCommand(stored?.command);
  if (!stored || !command) return null;
  return {
    command,
    commandNonce: typeof stored.commandNonce === "number" && Number.isFinite(stored.commandNonce) ? Math.max(0, Math.floor(stored.commandNonce)) : 0,
    issuedAt: typeof stored.issuedAt === "string" && stored.issuedAt ? stored.issuedAt : new Date().toISOString(),
    source: typeof stored.source === "string" && stored.source ? stored.source.slice(0, 80) : "api"
  };
}

async function writeDeviceCommand(
  env: Env,
  context: RequestContext,
  command: DeviceCommand["command"],
  source = "api"
): Promise<DeviceCommand> {
  const now = new Date().toISOString();
  const previous = await getDeviceCommand(env, context);
  const unixSecondsNonce = Math.floor(Date.now() / 1000);
  const next: DeviceCommand = {
    command,
    commandNonce: Math.max((previous?.commandNonce || 0) + 1, unixSecondsNonce),
    issuedAt: now,
    source: source.slice(0, 80)
  };
  const expirationTtl = command === "restart" ? 2 * 60 : command === "ota_update" ? 30 * 60 : 60 * 60;
  await env.FLIGHT_DISPLAY_KV.put(scopedKey(DEVICE_COMMAND_KEY, context), JSON.stringify(next), { expirationTtl });
  await broadcastRealtime(env, {
    type: "device_command",
    updatedAt: now,
    source: next.source,
    command: next.command,
    commandNonce: next.commandNonce
  }, context);
  return next;
}

async function triggerSoundTestState(env: Env, source = "api", context?: RequestContext): Promise<SoundState> {
  const previous = await getSoundState(env, context);
  const next: SoundState = {
    testNonce: previous.testNonce + 1,
    lastTriggeredAt: new Date().toISOString(),
    source: source.slice(0, 80)
  };
  await env.FLIGHT_DISPLAY_KV.put(scopedKey(SOUND_STATE_KEY, context), JSON.stringify(next));
  return next;
}

async function writeScreenState(
  env: Env,
  patch: Partial<Pick<ScreenState, "active" | "brightnessMode">>,
  source = "api",
  context?: RequestContext
): Promise<Response> {
  const previous = await getScreenState(env, context);
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
  await env.FLIGHT_DISPLAY_KV.put(scopedKey(SCREEN_STATE_KEY, context), JSON.stringify(next));
  await broadcastRealtime(env, {
    type: "config_changed",
    updatedAt: now,
    source: next.source || source
  }, context);
  return jsonResponse(next, 200, { "Cache-Control": "no-store" });
}

async function toggleScreenState(env: Env, context?: RequestContext): Promise<Response> {
  const previous = await getScreenState(env, context);
  return writeScreenState(env, { active: !previous.active }, "web-admin", context);
}

async function configResponse(env: Env, context?: RequestContext): Promise<Response> {
  const screenId = normalizeId(context?.screenId);
  const userEmail = normalizeEmail(context?.userEmail);
  const [config, aviationstackApiKey, screenState, soundState, deviceStatus, fr24Key, accountScreens, homeyToken] = await Promise.all([
    getConfig(env, context),
    getAviationstackApiKey(env),
    getScreenState(env, context),
    getSoundState(env, context),
    getDeviceStatus(env, context),
    fr24KeyStatus(env, context),
    userEmail ? listUserScreens(env, userEmail) : Promise.resolve([]),
    userEmail ? getHomeyTokenRecord(env, userEmail, true) : Promise.resolve(null)
  ]);
  const normalizedDevice = enforceFr24DeviceSettings(normalizeDeviceSettings(config.device), fr24Key.screenConfigured);
  const normalizedFollow = fr24Key.screenConfigured ? normalizeFollowSettings(config.follow) : { ...normalizeFollowSettings(config.follow), enabled: false };
  return jsonResponse({
    ...config,
    follow: normalizedFollow,
    device: normalizedDevice,
    screenId: screenId || DEFAULT_SCREEN_ID,
    account: {
      email: userEmail || null,
      screens: await Promise.all(accountScreens.map(async (screen) => {
        const screenConfig = await getConfig(env, { screenId: screen.screenId });
        return {
          screenId: screen.screenId,
          deviceId: screen.deviceId,
          label: screenConfig.label || "SkyFrame",
          pairedAt: screen.pairedAt
        };
      }))
    },
    fr24Key,
    homeyToken: homeyToken ? publicHomeyTokenRecord(homeyToken) : null,
    screenState,
    deviceStatus,
    soundState: {
      ...soundState,
      volumePercent: normalizedDevice.audioVolumePercent
    },
    aviationstackApiKeyConfigured: Boolean(aviationstackApiKey)
  }, 200, { "Cache-Control": "no-store" });
}

async function getHomeyTokenRecord(env: Env, userEmail: string, createIfMissing: boolean): Promise<HomeyTokenRecord | null> {
  const email = normalizeEmail(userEmail);
  if (!email) return null;
  const stored = await env.FLIGHT_DISPLAY_KV.get(accountScopedKey(HOMEY_TOKEN_KEY, email), "json") as HomeyTokenRecord | null;
  if (stored && typeof stored.token === "string" && stored.token.trim()) {
    return {
      token: stored.token,
      createdAt: typeof stored.createdAt === "string" ? stored.createdAt : new Date().toISOString(),
      rotatedAt: typeof stored.rotatedAt === "string" ? stored.rotatedAt : null
    };
  }
  if (!createIfMissing) return null;

  const record: HomeyTokenRecord = {
    token: `sky_${randomToken(24)}`,
    createdAt: new Date().toISOString(),
    rotatedAt: null
  };
  await env.FLIGHT_DISPLAY_KV.put(accountScopedKey(HOMEY_TOKEN_KEY, email), JSON.stringify(record));
  return record;
}

function publicHomeyTokenRecord(record: HomeyTokenRecord): Record<string, unknown> {
  return {
    configured: true,
    token: record.token,
    createdAt: record.createdAt,
    rotatedAt: record.rotatedAt || null
  };
}

async function rotateHomeyToken(request: Request, env: Env, context?: RequestContext): Promise<Response> {
  const authFailure = requireAuthenticatedUser(context);
  if (authFailure) return authFailure;
  const email = normalizeEmail(context?.userEmail);
  if (!email) return jsonResponse({ error: "Login required" }, 401, { "Cache-Control": "no-store" });

  const previous = await getHomeyTokenRecord(env, email, false);
  const now = new Date().toISOString();
  const record: HomeyTokenRecord = {
    token: `sky_${randomToken(24)}`,
    createdAt: previous?.createdAt || now,
    rotatedAt: now
  };
  await env.FLIGHT_DISPLAY_KV.put(accountScopedKey(HOMEY_TOKEN_KEY, email), JSON.stringify(record));
  return jsonResponse(publicHomeyTokenRecord(record), 200, { "Cache-Control": "no-store" });
}

async function adminPageResponse(request: Request, env: Env, context?: RequestContext): Promise<Response> {
  const authFailure = requireAdminUser(request, env, context);
  if (authFailure) return authFailure;
  return htmlResponse(renderAdminHtml(request, context?.userEmail || ""));
}

async function adminScreensResponse(request: Request, env: Env, context?: RequestContext): Promise<Response> {
  const authFailure = requireAdminUser(request, env, context);
  if (authFailure) return authFailure;

  const devices = await listDeviceRecords(env);
  const screens = await Promise.all(devices.map(async (device) => {
    const screenContext: RequestContext = { screenId: device.screenId };
    const [config, screenState, soundState, deviceStatus, fr24] = await Promise.all([
      getConfig(env, screenContext),
      getScreenState(env, screenContext),
      getSoundState(env, screenContext),
      getDeviceStatus(env, screenContext),
      fr24KeyStatus(env, screenContext)
    ]);
    return {
      screenId: device.screenId,
      deviceId: device.deviceId,
      ownerEmail: device.ownerEmail || null,
      pairedAt: device.pairedAt,
      label: config.label || "SkyFrame",
      displayMode: normalizeDeviceSettings(config.device).displayMode,
      fr24,
      screenState,
      soundState,
      deviceStatus
    };
  }));

  return jsonResponse({
    updatedAt: new Date().toISOString(),
    count: screens.length,
    screens: screens.sort((a, b) => String(a.pairedAt || "").localeCompare(String(b.pairedAt || ""))).reverse()
  }, 200, { "Cache-Control": "no-store" });
}

async function sendDeviceCommand(request: Request, env: Env, context?: RequestContext): Promise<Response> {
  const authFailure = requireAuthenticatedUser(context);
  if (authFailure) return authFailure;
  const screenId = normalizeId(context?.screenId);
  if (!screenId) return jsonResponse({ error: "Screen ID required" }, 400, { "Cache-Control": "no-store" });

  const body = await readJsonObject(request);
  const command = normalizeDeviceCommand(firstString(body, ["command", "action"]));
  if (!command) return jsonResponse({ error: "Expected restart, ota_update, unpair, forget_wifi or factory_reset" }, 400, { "Cache-Control": "no-store" });

  const device = await findActiveDeviceRecordByScreen(env, screenId);
  if (device?.ownerEmail && context?.userEmail && normalizeEmail(device.ownerEmail) !== normalizeEmail(context.userEmail)) {
    return jsonResponse({ error: "Screen owner required" }, 403, { "Cache-Control": "no-store" });
  }

  const written = await writeDeviceCommand(env, { ...context, screenId }, command, "control-panel");
  if (command === "unpair" || command === "factory_reset") {
    await removePairedScreen(env, screenId, device);
  }
  return jsonResponse({
    ok: true,
    deviceCommand: written,
    redirectTo: command === "unpair" || command === "factory_reset" ? "/start" : null
  }, 200, { "Cache-Control": "no-store" });
}

async function adminDeviceCommand(request: Request, env: Env, context: RequestContext | undefined, pathname: string): Promise<Response> {
  const authFailure = requireAdminUser(request, env, context);
  if (authFailure) return authFailure;
  const match = pathname.match(/^\/api\/admin\/screens\/([^/]+)\/command$/);
  const screenId = normalizeId(match?.[1]);
  if (!screenId) return jsonResponse({ error: "Screen ID required" }, 400, { "Cache-Control": "no-store" });

  const body = await readJsonObject(request);
  const command = normalizeDeviceCommand(firstString(body, ["command", "action"]));
  if (!command) return jsonResponse({ error: "Expected restart, ota_update, unpair, forget_wifi or factory_reset" }, 400, { "Cache-Control": "no-store" });

  const written = await writeDeviceCommand(env, { screenId }, command, "admin");
  return jsonResponse({ ok: true, deviceCommand: written }, 200, { "Cache-Control": "no-store" });
}

async function deleteAdminScreen(request: Request, env: Env, context: RequestContext | undefined, pathname: string): Promise<Response> {
  const authFailure = requireAdminUser(request, env, context);
  if (authFailure) return authFailure;
  const match = pathname.match(/^\/api\/admin\/screens\/([^/]+)$/);
  const screenId = normalizeId(match?.[1]);
  if (!screenId) return jsonResponse({ error: "Screen ID required" }, 400, { "Cache-Control": "no-store" });

  const device = await findActiveDeviceRecordByScreen(env, screenId);
  await writeDeviceCommand(env, { screenId }, "unpair", "admin-delete");
  const deletedAt = await removePairedScreen(env, screenId, device);

  return jsonResponse({ ok: true, screenId, deletedAt }, 200, { "Cache-Control": "no-store" });
}

async function listDeviceRecords(env: Env): Promise<DeviceRecord[]> {
  const records: DeviceRecord[] = [];
  let cursor: string | undefined;
  do {
    const listed = await env.FLIGHT_DISPLAY_KV.list({ prefix: "device:v1:", cursor });
    await Promise.all(listed.keys.map(async (key) => {
      const record = await env.FLIGHT_DISPLAY_KV.get(key.name, "json") as DeviceRecord | null;
      if (record && isDeviceRecord(record) && !record.deletedAt) records.push(record);
    }));
    cursor = listed.list_complete ? undefined : listed.cursor;
  } while (cursor);
  return records;
}

async function findActiveDeviceRecordByScreen(env: Env, screenId: string): Promise<DeviceRecord | undefined> {
  const devices = await listDeviceRecords(env);
  return devices.find((record) => record.screenId === screenId);
}

async function ownerEmailForScreen(env: Env, screenId: string): Promise<string | undefined> {
  const device = await findActiveDeviceRecordByScreen(env, screenId);
  return normalizeEmail(device?.ownerEmail);
}

async function removePairedScreen(env: Env, screenId: string, device?: DeviceRecord): Promise<string> {
  const deletedAt = new Date().toISOString();
  const deleteKeys = [
    scopedKey(CONFIG_KEY, { screenId }),
    scopedKey(SCREEN_STATE_KEY, { screenId }),
    scopedKey(SOUND_STATE_KEY, { screenId }),
    scopedKey(DEVICE_STATUS_KEY, { screenId })
  ];
  await Promise.all(deleteKeys.map((key) => env.FLIGHT_DISPLAY_KV.delete(key)));

  if (device) {
    const tombstone: DeviceRecord = { ...device, deletedAt };
    await Promise.all([
      env.FLIGHT_DISPLAY_KV.put(deviceRecordKey(device.deviceId), JSON.stringify(tombstone)),
      env.FLIGHT_DISPLAY_KV.put(deviceTokenKey(device.tokenHash), JSON.stringify(tombstone), { expirationTtl: 60 * 60 })
    ]);
  }
  return deletedAt;
}

async function saveConfig(request: Request, env: Env, context?: RequestContext): Promise<Response> {
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
  const fr24 = await fr24KeyStatus(env, context);
  if (!fr24.screenConfigured && (modeRequiresFr24(config.device?.displayMode) || config.follow?.enabled)) {
    config.follow = { ...(config.follow || { flights: [] }), enabled: false };
    config.device = {
      ...normalizeDeviceSettings(config.device),
      displayMode: "airport_board",
      airspaceMonitoringEnabled: false
    };
  }

  const configUpdatedAt = config.updatedAt || new Date().toISOString();
  await env.FLIGHT_DISPLAY_KV.put(scopedKey(CONFIG_KEY, context), JSON.stringify(config));
  await broadcastRealtime(env, {
    type: "config_changed",
    updatedAt: configUpdatedAt,
    source: "web-config"
  }, context);
  await broadcastRealtime(env, {
    type: "display_changed",
    updatedAt: configUpdatedAt,
    source: "web-config"
  }, context);
  return configResponse(env, context);
}

async function deviceConfigResponse(env: Env, context?: RequestContext): Promise<Response> {
  const [config, screenState, soundState, fr24] = await Promise.all([getConfig(env, context), getScreenState(env, context), getSoundState(env, context), fr24KeyStatus(env, context)]);
  const normalizedDevice = enforceFr24DeviceSettings(normalizeDeviceSettings(config.device), fr24.screenConfigured);
  const effectiveBrightness = screenState.brightnessMode === "night"
    ? normalizedDevice.nightMode.brightness
    : normalizedDevice.brightness;
  return jsonResponse({
    updatedAt: config.updatedAt || null,
    homeAirportIata: config.homeAirportIata,
    follow: fr24.screenConfigured ? config.follow : { ...normalizeFollowSettings(config.follow), enabled: false },
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

async function soundStateResponse(env: Env, context?: RequestContext): Promise<Response> {
  const [soundState, config] = await Promise.all([getSoundState(env, context), getConfig(env, context)]);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  return jsonResponse({
    ...soundState,
    volumePercent: normalizedDevice.audioVolumePercent
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function realtimeStateResponse(env: Env, context?: RequestContext): Promise<Response> {
  const [config, screenState, soundState, deviceCommand] = await Promise.all([
    getConfig(env, context),
    getScreenState(env, context),
    getSoundState(env, context),
    getDeviceCommand(env, context)
  ]);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  return jsonResponse({
    updatedAt: new Date().toISOString(),
    configVersion: config.updatedAt || "",
    screenVersion: screenState.updatedAt || "",
    soundTestNonce: soundState.testNonce,
    volumePercent: normalizedDevice.audioVolumePercent,
    deviceCommand
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function deviceStatusResponse(env: Env, context?: RequestContext): Promise<Response> {
  return jsonResponse(await getDeviceStatus(env, context), 200, {
    "Cache-Control": "no-store"
  });
}

async function saveDeviceStatus(request: Request, env: Env, context?: RequestContext): Promise<Response> {
  const body = await request.json();
  const status = normalizeDeviceStatus(body, new Date().toISOString());
  await env.FLIGHT_DISPLAY_KV.put(scopedKey(DEVICE_STATUS_KEY, context), JSON.stringify(status));
  return jsonResponse(status, 200, {
    "Cache-Control": "no-store"
  });
}

async function screenStateResponse(env: Env, context?: RequestContext): Promise<Response> {
  const screenState = await getScreenState(env, context);
  return jsonResponse(screenState, 200, {
    "Cache-Control": "no-store"
  });
}

async function brightnessModeResponse(env: Env, context?: RequestContext): Promise<Response> {
  const screenState = await getScreenState(env, context);
  return jsonResponse({
    brightnessMode: screenState.brightnessMode,
    lastBrightnessModeChangedAt: screenState.lastBrightnessModeChangedAt,
    updatedAt: screenState.updatedAt,
    source: screenState.source
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function displayModeResponse(env: Env, context?: RequestContext): Promise<Response> {
  const config = await getConfig(env, context);
  const device = normalizeDeviceSettings(config.device);
  return jsonResponse({
    displayMode: device.displayMode,
    updatedAt: config.updatedAt || null
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function writeDisplayMode(env: Env, displayMode: DeviceSettings["displayMode"], source = "api", context?: RequestContext): Promise<Response> {
  const config = await getConfig(env, context);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  const requestedDisplayMode = normalizeDisplayBehaviorMode(displayMode);
  const fr24 = await fr24KeyStatus(env, context);
  const normalizedDisplayMode = !fr24.screenConfigured && modeRequiresFr24(requestedDisplayMode) ? "airport_board" : requestedDisplayMode;
  const updatedAt = new Date().toISOString();
  const next: Config = {
    ...config,
    device: {
      ...normalizedDevice,
      displayMode: normalizedDisplayMode,
      airspaceMonitoringEnabled: airspaceMonitoringForMode(normalizedDisplayMode)
    },
    updatedAt
  };

  await env.FLIGHT_DISPLAY_KV.put(scopedKey(CONFIG_KEY, context), JSON.stringify(next));
  await broadcastRealtime(env, {
    type: "config_changed",
    updatedAt,
    source: source.slice(0, 80)
  }, context);
  await broadcastRealtime(env, {
    type: "display_changed",
    updatedAt,
    source: source.slice(0, 80)
  }, context);
  return jsonResponse({
    displayMode: normalizedDisplayMode,
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

async function startProvisioning(request: Request, env: Env): Promise<Response> {
  const body = await readJsonObject(request);
  const hardwareId = normalizeHardwareId(firstString(body, ["hardwareId", "deviceId", "chipId", "mac"]));
  if (!hardwareId) {
    return jsonResponse({ error: "Expected hardwareId" }, 400, { "Cache-Control": "no-store" });
  }

  const existing = await env.FLIGHT_DISPLAY_KV.get(provisionDeviceKey(hardwareId), "json") as ProvisionRecord | null;
  if (existing && existing.status === "pending") {
    return jsonResponse(publicProvisionRecord(existing), 200, { "Cache-Control": "no-store" });
  }

  let code = randomPairingCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const collision = await env.FLIGHT_DISPLAY_KV.get(provisionCodeKey(code));
    if (!collision) break;
    code = randomPairingCode();
  }

  let screenId = randomScreenId();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const collision = await env.FLIGHT_DISPLAY_KV.get(deviceScreenConfigKey(screenId));
    if (!collision) break;
    screenId = randomScreenId();
  }

  const record: ProvisionRecord = {
    code,
    hardwareId,
    screenId,
    deviceId: randomDeviceId(),
    status: "pending",
    createdAt: new Date().toISOString()
  };

  await Promise.all([
    env.FLIGHT_DISPLAY_KV.put(provisionCodeKey(code), JSON.stringify(record), { expirationTtl: PROVISION_TTL_SECONDS }),
    env.FLIGHT_DISPLAY_KV.put(provisionDeviceKey(hardwareId), JSON.stringify(record), { expirationTtl: PROVISION_TTL_SECONDS })
  ]);

  return jsonResponse(publicProvisionRecord(record), 200, { "Cache-Control": "no-store" });
}

async function claimProvisioning(request: Request, env: Env, context?: RequestContext): Promise<Response> {
  const authFailure = requireAuthenticatedUser(context);
  if (authFailure) return authFailure;

  const body = await readJsonObject(request);
  const code = normalizePairingCode(firstString(body, ["code", "pairingCode"]));
  if (!code) {
    return jsonResponse({ error: "Expected pairing code" }, 400, { "Cache-Control": "no-store" });
  }

  const record = await env.FLIGHT_DISPLAY_KV.get(provisionCodeKey(code), "json") as ProvisionRecord | null;
  if (!record || record.status !== "pending") {
    return jsonResponse({ error: "Pairing code was not found or has expired" }, 404, { "Cache-Control": "no-store" });
  }

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const ownerEmail = context?.userEmail;
  const claimed: ProvisionRecord = {
    ...record,
    status: "claimed",
    claimedAt: new Date().toISOString(),
    ownerEmail,
    token,
    tokenHash
  };
  const device: DeviceRecord = {
    deviceId: record.deviceId,
    screenId: record.screenId,
    tokenHash,
    pairedAt: claimed.claimedAt || new Date().toISOString(),
    ownerEmail
  };
  const defaultConfig = await getConfig(env);

  await Promise.all([
    env.FLIGHT_DISPLAY_KV.put(provisionCodeKey(code), JSON.stringify(claimed), { expirationTtl: PROVISION_TTL_SECONDS }),
    env.FLIGHT_DISPLAY_KV.delete(provisionDeviceKey(record.hardwareId)),
    env.FLIGHT_DISPLAY_KV.put(deviceTokenKey(tokenHash), JSON.stringify(device)),
    env.FLIGHT_DISPLAY_KV.put(deviceRecordKey(record.deviceId), JSON.stringify(device)),
    env.FLIGHT_DISPLAY_KV.put(scopedKey(CONFIG_KEY, { screenId: record.screenId }), JSON.stringify({
      ...defaultConfig,
      label: firstString(body, ["label"]) || defaultConfig.label || "SkyFrame",
      device: {
        ...normalizeDeviceSettings(defaultConfig.device),
        displayMode: "airport_board",
        airspaceMonitoringEnabled: false
      },
      follow: {
        ...normalizeFollowSettings(defaultConfig.follow),
        enabled: false
      },
      updatedAt: new Date().toISOString()
    }))
  ]);

  return jsonResponse({
    ok: true,
    screenId: record.screenId,
    deviceId: record.deviceId,
    deviceToken: token
  }, 200, { "Cache-Control": "no-store" });
}

async function provisioningStatus(request: Request, env: Env): Promise<Response> {
  const body = await readJsonObject(request);
  const hardwareId = normalizeHardwareId(firstString(body, ["hardwareId", "deviceId", "chipId", "mac"]));
  const code = normalizePairingCode(firstString(body, ["code", "pairingCode"]));
  const record = code
    ? await env.FLIGHT_DISPLAY_KV.get(provisionCodeKey(code), "json") as ProvisionRecord | null
    : hardwareId
      ? await env.FLIGHT_DISPLAY_KV.get(provisionDeviceKey(hardwareId), "json") as ProvisionRecord | null
      : null;

  if (!record) {
    return jsonResponse({ status: "missing" }, 404, { "Cache-Control": "no-store" });
  }

  if (record.status !== "claimed") {
    return jsonResponse(publicProvisionRecord(record), 200, { "Cache-Control": "no-store" });
  }

  return jsonResponse({
    status: "claimed",
    screenId: record.screenId,
    deviceId: record.deviceId,
    deviceToken: record.token
  }, 200, { "Cache-Control": "no-store" });
}

async function fr24KeyStatusResponse(env: Env, context?: RequestContext): Promise<Response> {
  return jsonResponse(await fr24KeyStatus(env, context), 200, { "Cache-Control": "no-store" });
}

async function fr24KeyStatus(env: Env, context?: RequestContext): Promise<{ configured: boolean; screenConfigured: boolean; source: string; screenId?: string }> {
  const screenId = normalizeId(context?.screenId);
  const userEmail = normalizeEmail(context?.userEmail) || (screenId ? await ownerEmailForScreen(env, screenId) : undefined);
  if (userEmail) {
    const accountStored = await env.FLIGHT_DISPLAY_KV.get(accountScopedKey(ACCOUNT_FR24_SECRET_KEY, userEmail));
    if (accountStored) {
      return {
        configured: true,
        screenConfigured: true,
        source: "account",
        ...(screenId ? { screenId } : {})
      };
    }
  }

  if (!screenId || screenId === DEFAULT_SCREEN_ID) {
    const configured = Boolean(normalizeSecretString(env.FR24_API_KEY));
    return {
      configured,
      screenConfigured: configured,
      source: configured ? "worker-secret" : "missing"
    };
  }

  const stored = await env.FLIGHT_DISPLAY_KV.get(fr24ScreenSecretKey(screenId));
  return {
    configured: Boolean(stored),
    screenConfigured: Boolean(stored),
    source: stored ? "legacy-screen" : "missing",
    screenId
  };
}

async function saveFr24Key(request: Request, env: Env, context?: RequestContext): Promise<Response> {
  const authFailure = requireAuthenticatedUser(context);
  if (authFailure) return authFailure;

  const userEmail = normalizeEmail(context?.userEmail);
  if (!userEmail) return jsonResponse({ error: "Login required" }, 401, { "Cache-Control": "no-store" });

  const body = await readJsonObject(request);
  const apiKey = normalizeSecretString(firstString(body, ["apiKey", "fr24ApiKey", "key"]));
  if (!apiKey) {
    return jsonResponse({ error: "Expected apiKey" }, 400, { "Cache-Control": "no-store" });
  }

  const encrypted = await encryptSecret(env, apiKey);
  await env.FLIGHT_DISPLAY_KV.put(accountScopedKey(ACCOUNT_FR24_SECRET_KEY, userEmail), encrypted);
  return jsonResponse({
    ok: true,
    configured: true,
    screenConfigured: true,
    source: "account"
  }, 200, { "Cache-Control": "no-store" });
}

function publicProvisionRecord(record: ProvisionRecord): Record<string, unknown> {
  return {
    status: record.status,
    code: record.code,
    screenId: record.screenId,
    deviceId: record.deviceId,
    createdAt: record.createdAt,
    claimedAt: record.claimedAt
  };
}

async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function normalizeHardwareId(value: unknown): string | undefined {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!raw || !/^[a-z0-9:._-]{4,80}$/.test(raw)) return undefined;
  return raw.replace(/[^a-z0-9._-]/g, "");
}

function normalizePairingCode(value: unknown): string | undefined {
  const raw = typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
  const normalized = raw.startsWith("SKY-") ? raw : raw.match(/^\d{6}$/) ? `SKY-${raw}` : raw;
  return /^SKY-\d{6}$/.test(normalized) ? normalized : undefined;
}

async function saveScreenState(request: Request, env: Env, context?: RequestContext): Promise<Response> {
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
  return writeScreenState(env, { active }, source, context);
}

async function saveBrightnessMode(request: Request, env: Env, context?: RequestContext): Promise<Response> {
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
  return writeScreenState(env, { brightnessMode: mode }, source, context);
}

async function saveDisplayMode(request: Request, env: Env, context?: RequestContext): Promise<Response> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Expected JSON body" }, 400, { "Cache-Control": "no-store" });
  }

  const mode = firstString(body && typeof body === "object" ? body as Record<string, unknown> : {}, ["displayMode", "mode"]);
  const normalizedMode = normalizeDisplayBehaviorMode(mode);
  if (!mode || !["airspace", "hybrid", "airport_board", "clock", "flight"].includes(mode)) {
    return jsonResponse({ error: "Choose airspace, hybrid, airport_board, or clock." }, 400, { "Cache-Control": "no-store" });
  }

  const source = firstString(body && typeof body === "object" ? body as Record<string, unknown> : {}, ["source"]) || "api";
  return writeDisplayMode(env, normalizedMode, source, context);
}

async function triggerSoundTest(request: Request, env: Env, context?: RequestContext): Promise<Response> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const source = firstString(body && typeof body === "object" ? body as Record<string, unknown> : {}, ["source"]) || "api";
  const [soundState, config] = await Promise.all([triggerSoundTestState(env, source, context), getConfig(env, context)]);
  const normalizedDevice = normalizeDeviceSettings(config.device);
  await broadcastRealtime(env, {
    type: "sound_test",
    updatedAt: soundState.lastTriggeredAt || new Date().toISOString(),
    source,
    testNonce: soundState.testNonce,
    volumePercent: normalizedDevice.audioVolumePercent
  }, context);
  return jsonResponse({
    ...soundState,
    volumePercent: normalizedDevice.audioVolumePercent
  }, 200, { "Cache-Control": "no-store" });
}

async function avinorBoardResponse(env: Env, context?: RequestContext): Promise<Response> {
  const config = await getConfig(env, context);
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

async function aviationstackDebugResponse(request: Request, env: Env, _context?: RequestContext): Promise<Response> {
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
  const device = normalizeDeviceSettings(config.device);
  const windowHours = avinorWindowHoursForDirection(device, direction);
  const limit = timetableItemCountForDirection(device, direction);
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
    displayMode: normalizeDisplayBehaviorMode(v.displayMode),
    airspaceMonitoringEnabled: airspaceMonitoringForMode(normalizeDisplayBehaviorMode(v.displayMode)),
    allowedAircraftCategories: normalizeAircraftCategoryFilter((v as { allowedAircraftCategories?: unknown }).allowedAircraftCategories),
    brightness: clampNumber(v.brightness, 1, 100, 80),
    audioVolumePercent: clampNumber((v as { audioVolumePercent?: unknown }).audioVolumePercent, 0, 100, 35),
    pollSeconds: clampNumber(v.pollSeconds, 30, 900, 90),
    displayCycleSeconds: clampNumber(v.displayCycleSeconds, 2, 30, 5),
    timetableCycleSeconds: clampNumber((v as { timetableCycleSeconds?: unknown }).timetableCycleSeconds, 2, 60, 7),
    timetableItemCount: clampNumber((v as { timetableItemCount?: unknown }).timetableItemCount, 0, 40, 8),
    departureTimetableItemCount: clampNumber((v as { departureTimetableItemCount?: unknown }).departureTimetableItemCount, 0, 40, clampNumber((v as { timetableItemCount?: unknown }).timetableItemCount, 0, 40, 8)),
    arrivalTimetableItemCount: clampNumber((v as { arrivalTimetableItemCount?: unknown }).arrivalTimetableItemCount, 0, 40, clampNumber((v as { timetableItemCount?: unknown }).timetableItemCount, 0, 40, 8)),
    avinorWindowHours: clampNumber((v as { avinorWindowHours?: unknown }).avinorWindowHours, 1, 24, 4),
    departureAvinorWindowHours: clampNumber((v as { departureAvinorWindowHours?: unknown }).departureAvinorWindowHours, 1, 24, clampNumber((v as { avinorWindowHours?: unknown }).avinorWindowHours, 1, 24, 4)),
    arrivalAvinorWindowHours: clampNumber((v as { arrivalAvinorWindowHours?: unknown }).arrivalAvinorWindowHours, 1, 24, clampNumber((v as { avinorWindowHours?: unknown }).avinorWindowHours, 1, 24, 4)),
    timetableScrollPixelsPerSecond: clampNumber((v as { timetableScrollPixelsPerSecond?: unknown }).timetableScrollPixelsPerSecond, 4, 100, 40),
    timetableTransitionMs: clampNumber((v as { timetableTransitionMs?: unknown }).timetableTransitionMs, 200, 1000, 400),
    scrollPixelsPerSecond: clampNumber(v.scrollPixelsPerSecond, 2, 30, 9),
    configRefreshSeconds: clampNumber(v.configRefreshSeconds, 60, 3600, 300),
    timezone: typeof v.timezone === "string" && v.timezone.trim() ? v.timezone.slice(0, 64) : "Europe/Oslo",
    followUnits: normalizeFollowUnits((v as { followUnits?: unknown }).followUnits),
    lineColors: normalizeLineColors((v as { lineColors?: unknown }).lineColors),
    clockColor: normalizeHexColor((v as { clockColor?: unknown }).clockColor, DEFAULT_CLOCK_COLORS.clockColor),
    clockTopColor: normalizeHexColor((v as { clockTopColor?: unknown }).clockTopColor, DEFAULT_CLOCK_COLORS.clockTopColor),
    timetableColors: normalizeTimetableColors((v as { timetableColors?: unknown }).timetableColors),
    colorPresets: normalizeColorCustomSets((v as { colorPresets?: unknown }).colorPresets),
    nightMode: {
      enabled: typeof night.enabled === "boolean" ? night.enabled : true,
      start: normalizeTimeString(night.start, "23:00"),
      end: normalizeTimeString(night.end, "07:00"),
      brightness: clampNumber(night.brightness, 0, 100, 0)
    }
  };
}

function normalizeDisplayBehaviorMode(value: unknown): DisplayBehaviorMode {
  if (value === "airspace" || value === "hybrid" || value === "airport_board" || value === "clock") return value;
  if (value === "flight") return "hybrid";
  return "hybrid";
}

function airspaceMonitoringForMode(mode: DisplayBehaviorMode): boolean {
  return mode === "airspace" || mode === "hybrid";
}

function modeRequiresFr24(mode: unknown): boolean {
  return mode === "airspace" || mode === "hybrid";
}

function enforceFr24DeviceSettings(device: DeviceSettings, hasScreenFr24Key: boolean): DeviceSettings {
  if (hasScreenFr24Key || !modeRequiresFr24(device.displayMode)) return device;
  return {
    ...device,
    displayMode: "airport_board",
    airspaceMonitoringEnabled: false
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
    header: normalizeHexColor(v.header, DEFAULT_AIRPORT_BOARD_COLORS.header),
    data: normalizeHexColor(v.data, DEFAULT_AIRPORT_BOARD_COLORS.data),
    time: normalizeHexColor(v.time, DEFAULT_AIRPORT_BOARD_COLORS.time),
    newTime: normalizeHexColor(v.newTime, DEFAULT_AIRPORT_BOARD_COLORS.newTime),
    canceled: normalizeHexColor(v.canceled, DEFAULT_AIRPORT_BOARD_COLORS.canceled),
    gateGoToGate: normalizeHexColor(v.gateGoToGate, DEFAULT_AIRPORT_BOARD_COLORS.gateGoToGate),
    gateBoarding: normalizeHexColor(v.gateBoarding, DEFAULT_AIRPORT_BOARD_COLORS.gateBoarding),
    gateClosing: normalizeHexColor(v.gateClosing, DEFAULT_AIRPORT_BOARD_COLORS.gateClosing),
    gateClosed: normalizeHexColor(v.gateClosed, DEFAULT_AIRPORT_BOARD_COLORS.gateClosed),
    landed: normalizeHexColor(v.landed, DEFAULT_AIRPORT_BOARD_COLORS.landed)
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
    airline: normalizeHexColor(v.airline, DEFAULT_AIRSPACE_COLORS.airline),
    route: normalizeHexColor(v.route, DEFAULT_AIRSPACE_COLORS.route),
    aircraft: normalizeHexColor(v.aircraft, DEFAULT_AIRSPACE_COLORS.aircraft),
    context: normalizeHexColor(v.context, DEFAULT_AIRSPACE_COLORS.context),
    progress: normalizeHexColor(v.progress, DEFAULT_AIRSPACE_COLORS.progress),
    routeProgress: normalizeHexColor(v.routeProgress, DEFAULT_AIRSPACE_COLORS.routeProgress)
  };
}

function normalizeClockColors(value: unknown): ClockColors {
  const v = value && typeof value === "object" ? value as Partial<ClockColors> : {};
  return {
    clockTopColor: normalizeHexColor(v.clockTopColor, DEFAULT_CLOCK_COLORS.clockTopColor),
    clockColor: normalizeHexColor(v.clockColor, DEFAULT_CLOCK_COLORS.clockColor)
  };
}

function firstCustomPresetValue(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  const custom = value.find((item) => item && typeof item === "object" && (item as { id?: unknown }).id !== "default" && (item as { values?: unknown }).values);
  return custom && typeof custom === "object" ? (custom as { values?: unknown }).values : undefined;
}

function normalizeColorCustomSets(value: unknown): ColorCustomSets {
  const v = value && typeof value === "object" ? value as Partial<Record<keyof ColorCustomSets, unknown>> : {};
  const airspace = firstCustomPresetValue(v.airspace);
  const airportBoard = firstCustomPresetValue(v.airportBoard);
  const clock = firstCustomPresetValue(v.clock);
  return {
    ...(airspace ? { airspace: normalizeLineColors(airspace) } : {}),
    ...(airportBoard ? { airportBoard: normalizeTimetableColors(airportBoard) } : {}),
    ...(clock ? { clock: normalizeClockColors(clock) } : {})
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

function timetableItemCountForDirection(device: DeviceSettings, direction: "A" | "D"): number {
  return direction === "D" ? device.departureTimetableItemCount : device.arrivalTimetableItemCount;
}

function avinorWindowHoursForDirection(device: DeviceSettings, direction: "A" | "D"): number {
  return direction === "D" ? device.departureAvinorWindowHours : device.arrivalAvinorWindowHours;
}

async function getIdleScreens(env: Env, config: Config): Promise<IdleScreen[]> {
  const airport = normalizeAirportCode(config.homeAirportIata, env.HOME_AIRPORT_IATA || "OSL");
  const device = normalizeDeviceSettings(config.device);
  if (device.departureTimetableItemCount === 0 && device.arrivalTimetableItemCount === 0) {
    return [{
      title: "DEPARTURES",
      kind: "departures",
      rows: [{
        flightId: "",
        airport: "",
        time: "",
        status: "empty",
        message: "You said zero.|Zero to show."
      }]
    }];
  }
  const [departures, arrivals] = await Promise.all([
    device.departureTimetableItemCount > 0 ? getAvinorFlights(env, airport, "D", config) : Promise.resolve([]),
    device.arrivalTimetableItemCount > 0 ? getAvinorFlights(env, airport, "A", config) : Promise.resolve([])
  ]);

  return [
    ...(device.departureTimetableItemCount > 0 ? toIdleScreens("DEPARTURES", "departures", departures, avinorWindowHoursForDirection(device, "D")) : []),
    ...(device.arrivalTimetableItemCount > 0 ? toIdleScreens("ARRIVALS", "arrivals", arrivals, avinorWindowHoursForDirection(device, "A")) : [])
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
  const device = normalizeDeviceSettings(config.device);
  const windowHours = avinorWindowHoursForDirection(device, direction);
  const itemCount = timetableItemCountForDirection(device, direction);
  if (itemCount <= 0) return [];
  const cacheKey = `avinor:board:v5:${airport}:${direction}:${windowHours}:${itemCount}`;
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

  await enrichAvinorAirportNames(env, flights);
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

async function flightsResponse(env: Env, compact: boolean, context?: RequestContext): Promise<Response> {
  const [rawConfig, screenState, fr24] = await Promise.all([getConfig(env, context), getScreenState(env, context), fr24KeyStatus(env, context)]);
  const normalizedDevice = enforceFr24DeviceSettings(normalizeDeviceSettings(rawConfig.device), fr24.screenConfigured);
  const config: Config = {
    ...rawConfig,
    follow: fr24.screenConfigured ? rawConfig.follow : { ...normalizeFollowSettings(rawConfig.follow), enabled: false },
    device: normalizedDevice
  };
  const suspendedReason = displaySuspendedReason(config, screenState);
  const liveSourceStatus: LiveSourceStatus = {
    source: "fr24",
    ok: true
  };
  if (suspendedReason) {
    return jsonResponse(await displayPayload(env, config, screenState, compact, suspendedReason, [], [], [], [], liveSourceStatus, context), 200, {
      "Cache-Control": "no-store"
    });
  }

  if (normalizedDevice.displayMode === "clock") {
    return jsonResponse(await displayPayload(env, config, screenState, compact, "clock", [], [], [], [], liveSourceStatus, context), 200, {
      "Cache-Control": "no-store"
    });
  }

  if (normalizedDevice.displayMode === "airport_board") {
    const idleScreens = await getIdleScreens(env, config);
    return jsonResponse(await displayPayload(env, config, screenState, compact, "idle", [], [], [], idleScreens, liveSourceStatus, context), 200, {
      "Cache-Control": "public, max-age=15"
    });
  }

  const limit = Math.max(1, Math.min(50, parseNumber(env.DISPLAY_LIMIT, 8)));
  const follow = normalizeFollowSettings(config.follow);
  let nearbyFlights: DisplayFlight[] = [];
  let followFlights: DisplayFlight[] = [];

  const airspaceMonitoringEnabled = airspaceMonitoringForMode(normalizedDevice.displayMode);
  if (airspaceMonitoringEnabled) {
    try {
      if (follow.enabled && follow.flights.length) {
        followFlights = await getFollowFlights(env, config, [], context);
      } else {
        nearbyFlights = await getFlights(env, config, context);
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
  const idleScreens = displayFlights.length || normalizedDevice.displayMode === "airspace" ? [] : await getIdleScreens(env, config);
  const payloadMode = normalizedDevice.displayMode === "airspace" && !displayFlights.length ? "airspace_waiting" : mode;
  const payload = displayPayload(env, config, screenState, compact, payloadMode, followFlights, nearbyFlights, displayFlights, idleScreens, liveSourceStatus, context);

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
  liveSourceStatus: LiveSourceStatus,
  context?: RequestContext
): Promise<Record<string, unknown>> {
  const normalizedDevice = normalizeDeviceSettings(config.device);
  const clock = buildClockPayload(normalizedDevice);
  const deviceStatus = await getDeviceStatus(env, context);
  return compact
    ? {
        updatedAt: new Date().toISOString(),
        mode,
        suspended: mode === "disabled" || mode === "night" || mode === "remote_disabled" || mode === "airspace_waiting",
        airspaceMonitoring: airspaceMonitoringForMode(normalizedDevice.displayMode),
        screenActive: screenState.active,
        screenState,
        deviceStatus,
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
        airspaceMonitoring: airspaceMonitoringForMode(normalizedDevice.displayMode),
        screenActive: screenState.active,
        screenState,
        deviceStatus,
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
    color: device.clockColor || "#081b6b",
    topColor: device.clockTopColor || "#ffffff",
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

async function getFlights(env: Env, config: Config, context?: RequestContext): Promise<DisplayFlight[]> {
  const cacheTtl = Math.max(60, parseNumber(env.CACHE_TTL_SECONDS, 60));
  const cacheKey = fr24ScopedCacheKey(`flights:fr24:v1:${config.lat.toFixed(3)}:${config.lon.toFixed(3)}:${Math.round(config.radiusKm)}`, context);
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (Array.isArray(cached)) {
    const flights = cached as DisplayFlight[];
    await enrichAirlineNames(env, flights);
    return flights;
  }

  const bounds = boundsFromRadius(config.lat, config.lon, config.radiusKm);
  const records = await fetchFr24(env, bounds, {}, undefined, context);
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

async function getFollowFlights(env: Env, config: Config, liveFlights: DisplayFlight[] = [], context?: RequestContext): Promise<DisplayFlight[]> {
  const follow = normalizeFollowSettings(config.follow);
  if (!follow.enabled || !follow.flights.length) return [];

  const airport = normalizeAirportCode(config.homeAirportIata, env.HOME_AIRPORT_IATA || "OSL");
  const timezone = config.device?.timezone || "Europe/Oslo";
  const [departures, arrivals] = await Promise.all([
    getAvinorRawFlights(env, airport, "D", timezone),
    getAvinorRawFlights(env, airport, "A", timezone)
  ]);
  const scheduled = [...departures, ...arrivals];
  const targetedLiveFlights = await getTargetedFollowFlights(env, config, follow.flights, context);
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

async function getTargetedFollowFlights(env: Env, config: Config, tokens: string[], context?: RequestContext): Promise<DisplayFlight[]> {
  const normalizedTokens = tokens
    .map(normalizeFollowToken)
    .filter((token): token is string => Boolean(token));
  if (!normalizedTokens.length) return [];

  const cacheTtl = Math.max(30, Math.min(300, parseNumber(env.CACHE_TTL_SECONDS, 60)));
  const cacheKey = fr24ScopedCacheKey(`follow:fr24:v4:${normalizedTokens.slice().sort().join(",")}`, context);
  const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
  if (Array.isArray(cached)) return cached as DisplayFlight[];

  const [records, staticFlights] = await Promise.all([
    fetchFr24(env, undefined, { flights: normalizedTokens }, env.FR24_FOLLOW_ENDPOINT || "/live/flight-positions/light", context),
    getFr24FollowStaticFlights(env, config, normalizedTokens, context)
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

async function getFr24FollowStaticFlights(env: Env, config: Config, tokens: string[], context?: RequestContext): Promise<DisplayFlight[]> {
  const timezone = config.device?.timezone || "Europe/Oslo";
  const cacheDate = localDateString(new Date(), timezone);
  const cacheTtl = 18 * 60 * 60;
  const resultByToken = new Map<string, DisplayFlight>();
  const missingTokens: string[] = [];

  await Promise.all(tokens.map(async (token) => {
    const cacheKey = fr24FollowStaticCacheKey(cacheDate, token, context);
    const cached = await env.FLIGHT_DISPLAY_KV.get(cacheKey, "json");
    if (cached && typeof cached === "object" && !Array.isArray(cached)) {
      resultByToken.set(token, cached as DisplayFlight);
    } else {
      missingTokens.push(token);
    }
  }));

  if (missingTokens.length) {
    try {
      const records = await fetchFr24(env, undefined, { flights: missingTokens }, env.FR24_LIVE_ENDPOINT || "/live/flight-positions/full", context);
      const fullFlights = records
        .map((record) => normalizeFlight(record, config))
        .filter((flight): flight is DisplayFlight => Boolean(flight));

      await Promise.all(missingTokens.map(async (token) => {
        const fullFlight = fullFlights.find((flight) => flightMatchesFollowToken(flight, token));
        if (!fullFlight) return;
        resultByToken.set(token, fullFlight);
        await env.FLIGHT_DISPLAY_KV.put(fr24FollowStaticCacheKey(cacheDate, token, context), JSON.stringify(fullFlight), { expirationTtl: cacheTtl });
      }));
    } catch (error) {
      console.warn(error instanceof Error ? error.message : "FR24 follow static fetch failed");
    }
  }

  return Array.from(resultByToken.values());
}

function fr24FollowStaticCacheKey(cacheDate: string, token: string, context?: RequestContext): string {
  return fr24ScopedCacheKey(`follow:fr24:static:v2:${cacheDate}:${token}`, context);
}

function fr24ScopedCacheKey(key: string, context?: RequestContext): string {
  const screenId = normalizeId(context?.screenId);
  return screenId && screenId !== DEFAULT_SCREEN_ID ? `screen:${screenId}:${key}` : key;
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

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken(bytes = DEVICE_TOKEN_BYTES): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return base64Url(values);
}

function randomScreenId(): string {
  const values = new Uint8Array(3);
  crypto.getRandomValues(values);
  const number = ((values[0] << 16) | (values[1] << 8) | values[2]) % 100000;
  return String(number).padStart(5, "0");
}

function randomDeviceId(): string {
  return `dev_${randomToken(12).toLowerCase()}`;
}

function randomPairingCode(): string {
  const values = new Uint8Array(4);
  crypto.getRandomValues(values);
  const number = ((values[0] << 24) | (values[1] << 16) | (values[2] << 8) | values[3]) >>> 0;
  return `SKY-${String(number % 1000000).padStart(6, "0")}`;
}

function base64Url(values: Uint8Array): string {
  let binary = "";
  for (const value of values) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function secretCryptoKey(env: Env): Promise<CryptoKey> {
  const secret = normalizeSecretString(env.CREDENTIAL_ENCRYPTION_KEY);
  if (!secret) throw new Error("CREDENTIAL_ENCRYPTION_KEY secret is not configured");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptSecret(env: Env, value: string): Promise<string> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const key = await secretCryptoKey(env);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return JSON.stringify({
    v: 1,
    alg: "AES-GCM",
    iv: base64Url(iv),
    data: base64Url(new Uint8Array(cipher))
  });
}

async function decryptSecret(env: Env, stored: string): Promise<string | undefined> {
  const trimmed = stored.trim();
  if (!trimmed.startsWith("{")) return trimmed;
  const parsed = JSON.parse(trimmed) as { v?: number; iv?: string; data?: string };
  if (parsed.v !== 1 || !parsed.iv || !parsed.data) return undefined;
  const key = await secretCryptoKey(env);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(parsed.iv) },
    key,
    base64UrlToBytes(parsed.data)
  );
  return new TextDecoder().decode(plain);
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

async function fetchFr24(env: Env, bounds?: string, filters: { flights?: string[]; callsigns?: string[] } = {}, endpointOverride?: string, context?: RequestContext): Promise<unknown[]> {
  const apiKey = await getFr24ApiKey(env, context);
  if (!apiKey) throw new Error("FR24 API key is not configured for this account");

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
      Authorization: `Bearer ${apiKey}`
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

async function getFr24ApiKey(env: Env, context?: RequestContext): Promise<string | undefined> {
  const screenId = normalizeId(context?.screenId);
  const userEmail = normalizeEmail(context?.userEmail) || (screenId ? await ownerEmailForScreen(env, screenId) : undefined);
  if (userEmail) {
    const accountStored = await env.FLIGHT_DISPLAY_KV.get(accountScopedKey(ACCOUNT_FR24_SECRET_KEY, userEmail));
    if (accountStored) return decryptSecret(env, accountStored);
  }
  if (screenId && screenId !== DEFAULT_SCREEN_ID) {
    const stored = await env.FLIGHT_DISPLAY_KV.get(fr24ScreenSecretKey(screenId));
    if (stored) return decryptSecret(env, stored);
    return undefined;
  }
  return normalizeSecretString(env.FR24_API_KEY);
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
  const names = await Promise.all(codes.map((code) => getAirportDisplayName(env, code)));
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

function renderAdminHtml(request: Request, userEmail: string): string {
  const logoutUrl = accessLogoutUrl(request, "/admin");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SkyFrame admin</title>
  <style>
    :root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--bg:#f2ece8;--ink:#3c2415;--muted:#6b5d52;--line:rgba(60,36,21,.16);--panel:#fffaf5;--accent:#3478f6;--ok:#008f5a;--warn:#b36b00;--danger:#b42318}
    *{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,#f8f4ef,#ddd7d2);color:var(--ink)}main{width:min(1180px,100%);margin:0 auto;padding:28px 20px 48px}.top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:22px}.skyframe-logo{width:245px;max-width:70vw;height:auto}h1{margin:10px 0 0;font-size:42px;line-height:1}.lead{margin:8px 0 0;color:var(--muted);font-size:15px}.user{display:grid;justify-items:end;gap:4px;border:1px solid var(--line);border-radius:8px;padding:9px 12px;background:rgba(255,255,255,.6);color:var(--muted);font-size:13px}.user a{font-size:12px}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0}.status{color:var(--muted);font-size:13px}button{border:0;border-radius:8px;background:var(--ink);color:white;font:inherit;font-weight:800;padding:10px 14px;cursor:pointer}.danger{background:rgba(180,35,24,.1);color:var(--danger);border:1px solid rgba(180,35,24,.22)}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:8px;background:rgba(255,250,245,.86);box-shadow:0 24px 64px rgba(34,20,12,.12)}table{width:100%;border-collapse:collapse;min-width:1040px}th,td{padding:12px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;font-size:13px}th{background:#c1b4ac;color:var(--ink);font-size:12px;text-transform:uppercase;letter-spacing:.06em}tr:last-child td{border-bottom:0}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;overflow-wrap:anywhere}.muted{color:var(--muted)}.pill{display:inline-flex;align-items:center;border-radius:999px;padding:3px 8px;font-weight:800;font-size:11px;background:#eee;color:var(--muted)}.pill.ok{background:rgba(0,143,90,.12);color:var(--ok)}.pill.warn{background:rgba(179,107,0,.12);color:var(--warn)}.pill.danger{background:rgba(180,35,24,.1);color:var(--danger);border:0}a{color:var(--accent);font-weight:800;text-decoration:none}.vitals{display:grid;gap:4px;color:var(--muted)}@media(max-width:700px){.top{display:grid}.skyframe-logo{width:210px}h1{font-size:32px}}
  </style>
</head>
<body>
  <main>
    <div class="top"><div>${skyFrameLogoMarkup()}<h1>Admin</h1><p class="lead">Screens, owners, FR24 status and device vitals.</p></div><div class="user"><span>${escapeHtml(userEmail)}</span><a href="${logoutUrl}">Log out</a></div></div>
    <div class="toolbar"><div id="status" class="status">Loading screens...</div><button id="refresh" type="button">Refresh</button></div>
    <div class="table-wrap"><table><thead><tr><th>Screen</th><th>Owner</th><th>Mode</th><th>FR24</th><th>Screen state</th><th>Vitals</th><th>Actions</th></tr></thead><tbody id="rows"></tbody></table></div>
  </main>
  <script>
    const rows = document.querySelector("#rows");
    const status = document.querySelector("#status");
    document.querySelector("#refresh").addEventListener("click", load);
    function esc(value){return String(value ?? "").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
    function date(value){if(!value)return "never";const d=new Date(value);return Number.isNaN(d.getTime())?"never":d.toLocaleString();}
    function mode(value){return ({airspace:"AirSpace",hybrid:"AirSpace + Airport Board",airport_board:"Airport Board",clock:"Clock"}[value]||"Not set");}
    function stateLabel(value){return value===false?"Screen off":"Screen on";}
    function source(value){return ({screen:"Personal key",missing:"No key",["worker-secret"]:"Shared Worker key"}[value]||value||"No key");}
    function freshness(value){if(!value)return ["No heartbeat","warn"];const t=Date.parse(value);if(!Number.isFinite(t))return ["Unknown","warn"];const mins=Math.round((Date.now()-t)/60000);if(mins<=4)return ["Online","ok"];return ["Last seen "+mins+" min ago","warn"];}
    function vitalLine(label,value){return "<span><strong>"+esc(label)+":</strong> "+esc(value ?? "-")+"</span>";}
    rows.addEventListener("click", async (event)=>{
      const deleteButton=event.target.closest("[data-delete-screen]");
      const commandButton=event.target.closest("[data-command-screen]");
      if(deleteButton){
        const screenId=deleteButton.getAttribute("data-delete-screen");
        const label=deleteButton.getAttribute("data-label")||screenId;
        if(!confirm("Delete "+label+"? The screen will be sent back to pairing mode."))return;
        deleteButton.disabled=true;
        const res=await fetch("/api/admin/screens/"+encodeURIComponent(screenId),{method:"DELETE"});
        const data=await res.json().catch(()=>({}));
        if(!res.ok){alert(data.error||"Could not delete screen");deleteButton.disabled=false;return;}
        await load();
        return;
      }
      if(commandButton){
        const screenId=commandButton.getAttribute("data-command-screen");
        const command=commandButton.getAttribute("data-command");
        commandButton.disabled=true;
        const res=await fetch("/api/admin/screens/"+encodeURIComponent(screenId)+"/command",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({command})});
        const data=await res.json().catch(()=>({}));
        if(!res.ok){alert(data.error||"Could not send command");commandButton.disabled=false;return;}
        await load();
      }
    });
    async function load(){
      status.textContent="Loading screens...";
      const res=await fetch("/api/admin/screens");
      const data=await res.json().catch(()=>({}));
      if(!res.ok){status.textContent=data.error||"Could not load";return;}
      status.textContent=data.count+" screens · updated "+date(data.updatedAt);
      rows.innerHTML=(data.screens||[]).map((screen)=>{
        const state=screen.screenState||{};
        const vitals=screen.deviceStatus||{};
        const fr24=screen.fr24&&screen.fr24.screenConfigured;
        const fresh=freshness(vitals.updatedAt);
        return "<tr>"
          +"<td><div class='mono'>"+esc(screen.screenId)+"</div><div>"+esc(screen.label)+"</div><div class='mono'>"+esc(screen.deviceId)+"</div></td>"
          +"<td>"+esc(screen.ownerEmail||"-")+"<div class='mono'>paired "+esc(date(screen.pairedAt))+"</div></td>"
          +"<td>"+esc(mode(screen.displayMode))+"</td>"
          +"<td><span class='pill "+(fr24?"ok":"warn")+"'>"+esc(source(screen.fr24&&screen.fr24.source))+"</span></td>"
          +"<td>"+esc(stateLabel(state.active))+" · "+esc(state.brightnessMode==="night"?"Night brightness":"Day brightness")+"<div class='mono'>"+esc(date(state.updatedAt))+"</div></td>"
          +"<td><div class='vitals'><span class='pill "+fresh[1]+"'>"+esc(fresh[0])+"</span>"+vitalLine("IP address",vitals.wifi&&vitals.wifi.ip)+vitalLine("Wi-Fi",vitals.wifi&&vitals.wifi.ssid)+vitalLine("Signal",vitals.wifi&&typeof vitals.wifi.rssi==="number"?vitals.wifi.rssi+" dBm":null)+vitalLine("Uptime",vitals.uptimeMs?Math.round(vitals.uptimeMs/1000)+" s":null)+vitalLine("Firmware",vitals.firmwareVersion)+vitalLine("OTA",vitals.ota&&[vitals.ota.status,vitals.ota.latestVersion,vitals.ota.lastError].filter(Boolean).join(" · "))+vitalLine("Firmware mode",mode(vitals.displayMode))+"</div></td>"
          +"<td><div class='vitals'><button type='button' data-command-screen='"+esc(screen.screenId)+"' data-command='ota_update'>Update firmware</button><button class='danger' type='button' data-delete-screen='"+esc(screen.screenId)+"' data-label='"+esc(screen.label)+"'>Delete</button></div></td>"
          +"</tr>";
      }).join("")||"<tr><td colspan='7'>No paired screens yet.</td></tr>";
    }
    load();
  </script>
</body>
</html>`;
}

function accessLogoutUrl(request: Request, path = "/screen-setup"): string {
  const url = new URL(request.url);
  const returnTo = `${url.origin}${path}`;
  return `/cdn-cgi/access/logout?returnTo=${encodeURIComponent(returnTo)}`;
}

function renderAdminAccessDeniedHtml(request: Request, email?: string): string {
  const logoutUrl = accessLogoutUrl(request, "/admin");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SkyFrame admin access</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  ${skyFrameSetupStyles()}
</head>
<body>
  <main class="page start-page setup-page">
    <section class="hero">
      ${skyFrameLogoMarkup()}
      <div><h1>Admin access required.</h1><p class="lead">This Google account is signed in, but it is not allowed to open the SkyFrame admin area.</p></div>
      <div class="panel"><div class="panel-header"><div><p class="panel-title">Wrong account?</p><p class="panel-subtitle">${email ? `Signed in as ${escapeHtml(email)}.` : "No admin session was found."}</p></div></div><div class="panel-body">
        <div class="step"><div class="step-number">1</div><div><h2>Use another Google account</h2><p>Sign out of Cloudflare Access, then choose the admin account when you return.</p></div></div>
        <div class="actions"><a class="button secondary" href="${logoutUrl}">Sign in with another account</a><a class="button" href="/">Open control panel</a></div>
      </div></div>
    </section>
  </main>
</body>
</html>`;
}

function renderStartHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Start SkyFrame</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  ${skyFrameSetupStyles()}
</head>
<body>
  <main class="page start-page setup-page">
    <section class="hero">
      ${skyFrameLogoMarkup()}
      <div><h1>Pair your SkyFrame.</h1><p class="lead">Sign in with Google and enter the code shown on your display. FR24 can be added later from the control panel.</p></div>
      <div class="panel"><div class="panel-header"><div><p class="panel-title">Connect this display</p><p class="panel-subtitle">The screen is already online and waiting for a pairing code.</p></div></div><div class="panel-body">
        <div class="step"><div class="step-number">1</div><div><h2>Sign in and pair the code</h2><p>Use Google to create your SkyFrame account, then enter the code shown on the display to attach it to your account.</p></div></div>
        <div class="actions single"><a class="button secondary" href="/screen-setup">Continue with Google</a></div>
      </div></div>
    </section>
  </main>
</body>
</html>`;
}

function renderLoginRequiredHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in to SkyFrame</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  ${skyFrameSetupStyles()}
</head>
<body>
  <main class="page start-page setup-page">
    <section class="hero">
      ${skyFrameLogoMarkup()}
      <div><h1>Sign in first.</h1><p class="lead">Screen pairing is tied to your Google account, so the setup form only opens after Cloudflare Access has verified you.</p></div>
      <div class="panel"><div class="panel-header"><div><p class="panel-title">Google login required</p><p class="panel-subtitle">If this page still appears after login, the Access policy for /screen-setup is not active yet.</p></div></div><div class="panel-body">
        <div class="step"><div class="step-number">1</div><div><h2>Create or use your Google account</h2><p>SkyFrame uses Google for account creation and password recovery.</p></div></div>
        <div class="step"><div class="step-number">2</div><div><h2>Return to screen setup</h2><p>After login, you can enter the code shown on your display.</p></div></div>
        <div class="actions"><a class="button secondary" href="/screen-setup">Continue with Google</a><a class="button" href="/start">Back to start</a></div>
      </div></div>
    </section>
  </main>
</body>
</html>`;
}

function renderScreenSetupHtml(userEmail: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SkyFrame screen setup</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  ${skyFrameSetupStyles()}
</head>
<body>
  <main class="page setup-page">
    <section class="hero">
      <div class="brand">${skyFrameLogoMarkup()}<div class="status-pill"><span class="status-dot"></span><span id="connectionLabel">Signed in as ${escapeHtml(userEmail)}</span></div></div>
      <div><h1>Pair your screen.</h1><p class="lead">Enter the code shown on the display. FR24 and Homey are managed from your account after pairing.</p></div>
      <div class="panel"><div class="panel-header"><div><p class="panel-title">Screen setup</p><p class="panel-subtitle">Use the code currently shown on the LED panel.</p></div></div><div class="panel-body">
        <div class="step"><div class="step-number">1</div><div><h2>Pair the display</h2><p>The screen waits here until this code is claimed.</p></div></div>
        <div class="form"><label>Pairing code<input id="pairingCode" class="pair-code" placeholder="SKY-123456" autocomplete="one-time-code" inputmode="numeric"></label><label>Screen name<input id="screenLabel" placeholder="Kitchen, office, cabin"></label><button id="claimButton">Pair screen</button></div>
        <div id="afterPairing" class="after-pairing" hidden>
          <div class="success-card"><strong>Screen paired</strong><span id="pairedScreenId">Ready for the control panel</span></div>
          <div class="actions"><button id="openConfigButton" type="button">Open control panel</button></div>
        </div>
        <pre id="output" class="result">Ready.</pre>
      </div></div>
    </section>
  </main>
  <script>
    const output = document.querySelector("#output");
    let pairedScreenId = "";
    const afterPairing = document.querySelector("#afterPairing");
    const pairedScreenIdLabel = document.querySelector("#pairedScreenId");
    const pairingCodeInput = document.querySelector("#pairingCode");
    const screenLabelInput = document.querySelector("#screenLabel");
    const connectionLabel = document.querySelector("#connectionLabel");
    function show(value) { output.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2); }
    function setStatus(text, tone) { connectionLabel.textContent = text; const dot = document.querySelector(".status-dot"); dot.style.background = tone === "ok" ? "var(--green)" : tone === "error" ? "#ff3b30" : "var(--amber)"; dot.style.boxShadow = tone === "ok" ? "0 0 0 4px rgba(0, 184, 112, 0.14)" : tone === "error" ? "0 0 0 4px rgba(255, 59, 48, 0.14)" : "0 0 0 4px rgba(255, 147, 0, 0.14)"; }
    async function api(path, body) { const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const json = await response.json().catch(() => ({})); if (!response.ok) throw json; return json; }
    function controlUrl() { return pairedScreenId ? "/?screenId=" + encodeURIComponent(pairedScreenId) + "&paired=1" : "/?paired=1"; }
    pairingCodeInput.addEventListener("input", () => { pairingCodeInput.value = pairingCodeInput.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""); });
    document.querySelector("#claimButton").addEventListener("click", async () => { setStatus("Pairing screen", "pending"); try { const json = await api("/api/provision/claim", { code: pairingCodeInput.value, label: screenLabelInput.value }); pairedScreenId = json.screenId || ""; pairedScreenIdLabel.textContent = "Ready for the control panel"; afterPairing.hidden = false; pairingCodeInput.disabled = true; screenLabelInput.disabled = true; document.querySelector("#claimButton").disabled = true; setStatus("Screen paired", "ok"); show("Paired. Open the control panel to manage FR24, Homey and screen settings."); } catch (error) { setStatus("Pairing failed", "error"); show(error); } });
    document.querySelector("#openConfigButton").addEventListener("click", () => { window.location.href = controlUrl(); });
  </script>
</body>
</html>`;
}

function skyFrameLogoMarkup(): string {
  return `<svg class="skyframe-logo" fill="none" viewBox="0 0 244 29" aria-label="SkyFrame"><path d="M7.78885 16.5497C2.50763 15.7526 0.379944 12.716 0.379944 8.92016C0.379944 1.89791 7.25693 0 16.0716 0C28.1538 0 33.0931 3.15052 33.5111 8.8822H21.0489C21.0489 7.78141 20.441 7.13613 19.4151 6.71859C18.4653 6.30105 17.2495 6.14921 16.0716 6.14921C12.8801 6.14921 11.7783 6.90838 11.7783 8.08508C11.7783 8.84424 12.1202 9.3377 13.1841 9.48953L25.9882 11.3874C31.4214 12.1846 34.7269 14.6898 34.7269 19.2827C34.7269 25.9254 29.3317 29 17.2874 29C9.08066 29 0 27.8613 0 19.8901H12.9181C12.9561 20.7631 13.336 21.4084 14.0579 21.8259C14.8558 22.2055 16.0716 22.3953 17.7054 22.3953C21.0489 22.3953 21.9608 21.5223 21.9608 20.1937C21.9608 19.3966 21.5048 18.6374 20.023 18.3717L7.78885 16.5497Z" fill="currentColor"/><path d="M51.5584 17.6505L48.0249 20.7631V28.051H37.3105V0.948953H48.0249V10.5144L57.9794 0.948953H72.1893L60.0691 11.4254L73.2152 28.051H58.9673L51.5584 17.6505Z" fill="currentColor"/><path d="M81.46 20.4215L69.4158 0.948953H81.6499L86.8172 11.5772L91.9844 0.948953H104.219L92.1744 20.4215V28.051H81.46V20.4215Z" fill="currentColor"/><path d="M104.599 0.948953H125.609V4.4411H108.626V12.4503H124.812V15.9424H108.626V28.051H104.599V0.948953Z" fill="currentColor"/><path d="M128.421 0.948953H145.215C150.648 0.948953 152.623 4.70681 152.623 8.16099C152.623 11.6152 151.066 13.8927 148.064 14.8416V14.9175C150.496 15.2592 151.864 17.4987 152.016 20.6872C152.206 25.6976 152.434 27.0641 153.307 28.051H149.052C148.406 27.2919 148.406 26.1152 148.216 22.8887C147.912 18.0301 146.316 16.5497 142.973 16.5497H132.448V28.051H128.421V0.948953ZM143.695 13.0576C147.646 13.0576 148.596 10.7042 148.596 8.76832C148.596 6.18717 147.038 4.4411 143.809 4.4411H132.448V13.0576H143.695Z" fill="currentColor"/><path d="M174.166 20.1558H160.868L157.411 28.051H153.079L165.352 0.948953H169.949L182.221 28.051H177.624L174.166 20.1558ZM167.479 4.66885L162.388 16.6636H172.685L167.479 4.66885Z" fill="currentColor"/><path d="M211.325 0.948953H216.91V28.051H212.883V5.57984H212.807L202.244 28.051H198.673L188.148 6.03534H188.072V28.051H184.045V0.948953H189.706L200.458 23.4202L211.325 0.948953Z" fill="currentColor"/><path d="M221.807 0.948953H243.616V4.4411H225.835V12.2984H243.084V15.7906H225.835V24.5589H243.996V28.051H221.807V0.948953Z" fill="currentColor"/></svg>`;
}

function skyFramePreviewMarkup(): string {
  return `<aside class="preview" aria-label="SkyFrame preview"><div class="device"><div class="led-screen"><div class="plane-mark"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 16.2 13.5 13l-3.8 5.1-1.7-.7 1.8-6.2L4 8.4V6.7l6.6 1.2L14 3.5c.4-.6 1.2-.8 1.8-.5.6.3.9 1 .7 1.7l-1.5 5.1 6.1 2.8c.5.2.8.8.6 1.4-.2.5-.7.8-1.2.8h-.5Z" fill="currentColor"/></svg></div><div class="led-copy"><strong id="previewName">SKYFRAME</strong><span id="previewRoute">PAIRING MODE</span><small id="previewCode">WAITING FOR CODE</small></div></div></div><div class="signal"><div><strong>Firmware</strong><span>One image</span></div><div><strong>Owner</strong><span>Verified here</span></div><div><strong>FR24</strong><span>Per screen</span></div></div></aside>`;
}

function skyFrameSetupStyles(): string {
  return `<style>
    :root { color-scheme: light; font-family: "Outfit", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; --background:#dfdad7; --foreground:#3c2415; --primary:#3c2415; --secondary:#c1b4ac; --card:#fffaf5; --muted:#efe9e4; --muted-foreground:#6b5d52; --border-soft:rgba(60,36,21,.15); --border-mid:rgba(60,36,21,.28); --sky:#3478f6; --green:#00b870; --amber:#ff9300; --shadow:0 24px 64px rgba(34,20,12,.14); }
    *{box-sizing:border-box} html{min-height:100%;background:var(--secondary);color:var(--foreground)} body{margin:0;min-height:100vh;background:radial-gradient(circle at 18% 0%,rgba(255,255,255,.9),transparent 28%),linear-gradient(180deg,#f2ece8 0%,var(--background) 42%,#d8d1cd 100%);color:var(--foreground)} button,input{font:inherit}.page{width:min(1100px,100%);margin:0 auto;padding:24px;min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:28px;align-items:center}.setup-page{width:min(760px,100%);grid-template-columns:1fr;align-items:start;padding-top:30px;padding-bottom:40px}.hero{min-width:0;display:grid;gap:26px}.brand{display:flex;align-items:center;justify-content:space-between;gap:16px}.skyframe-logo{width:min(244px,68vw);height:auto;color:var(--primary)}.status-pill{min-height:34px;display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border-soft);border-radius:999px;padding:0 12px;background:rgba(255,255,255,.52);color:var(--muted-foreground);font-size:13px;white-space:nowrap}.status-dot{width:8px;height:8px;border-radius:999px;background:var(--amber);box-shadow:0 0 0 4px rgba(255,147,0,.14)}h1{max-width:740px;margin:0;font-size:clamp(36px,6vw,68px);line-height:.94;letter-spacing:0;font-weight:700}.lead{max-width:620px;margin:0;color:var(--muted-foreground);font-size:18px;line-height:1.45}.panel{border:1px solid var(--border-soft);border-radius:8px;background:rgba(255,250,245,.78);box-shadow:var(--shadow);backdrop-filter:blur(18px);overflow:hidden}.panel-header{padding:18px;background:var(--secondary);display:flex;align-items:center;justify-content:space-between;gap:12px}.panel-title{margin:0;font-size:17px;font-weight:700}.panel-subtitle{margin:4px 0 0;color:rgba(60,36,21,.7);font-size:13px}.panel-body{padding:18px;display:grid;gap:14px}.step{display:grid;grid-template-columns:32px minmax(0,1fr);gap:12px;align-items:start;border:1px solid var(--border-soft);border-radius:8px;background:rgba(255,255,255,.62);padding:14px}.step-number{width:32px;height:32px;border-radius:999px;background:var(--primary);color:#fff;display:grid;place-items:center;font-weight:700;font-size:14px}.step h2{margin:0;font-size:15px}.step p{margin:5px 0 0;color:var(--muted-foreground);font-size:13px;line-height:1.4}.form{display:grid;gap:12px}.after-pairing{display:grid;gap:14px}.after-pairing[hidden]{display:none}.success-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;align-items:center;border:1px solid rgba(0,184,112,.3);border-radius:8px;background:rgba(0,184,112,.08);padding:14px}.success-card strong{font-size:15px}.success-card span{grid-column:1/-1;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:var(--muted-foreground);overflow-wrap:anywhere}.success-card button{grid-column:2;grid-row:1 / span 2;width:auto;min-width:138px;margin:0}label{display:grid;gap:7px;color:var(--foreground);font-size:13px;font-weight:700}input{width:100%;height:46px;border-radius:8px;border:1px solid var(--border-mid);padding:0 13px;background:#fff;color:var(--foreground);outline:none;transition:border-color 160ms ease,box-shadow 160ms ease}input:disabled{opacity:.7;background:rgba(255,255,255,.54)}input:focus{border-color:var(--sky);box-shadow:0 0 0 4px rgba(52,120,246,.14)}.pair-code{font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700;letter-spacing:0;text-transform:uppercase}.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.actions.single{grid-template-columns:1fr}button,.button{height:48px;border:0;border-radius:8px;background:var(--primary);color:#fff;font-weight:700;cursor:pointer;transition:transform 140ms ease,opacity 140ms ease;display:grid;place-items:center;text-decoration:none;text-align:center}button:disabled{cursor:not-allowed;opacity:.58}button:hover,.button:hover{transform:translateY(-1px)}button:active,.button:active{transform:translateY(0);opacity:.82}button.secondary,.button.secondary{background:var(--sky)}.result{min-height:58px;white-space:pre-wrap;word-break:break-word;margin:0;border-radius:8px;border:1px solid var(--border-soft);background:rgba(60,36,21,.06);padding:12px;color:var(--muted-foreground);font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.45}@media(max-width:860px){.page{grid-template-columns:1fr;padding:18px;align-items:start}.setup-page{padding-top:18px}.hero{gap:20px}h1{font-size:42px}.actions{grid-template-columns:1fr}}@media(max-width:520px){.brand{align-items:flex-start;flex-direction:column}.status-pill{white-space:normal}.success-card{grid-template-columns:1fr}.success-card button{grid-column:1;grid-row:auto;width:100%}}
  </style>`;
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

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function serveAppShell(request: Request, env: Env): Promise<Response> {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = "/index.html";
  return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Flight-Admin-Token,X-Flight-Device-Token,X-SkyFrame-Homey-Token,X-Homey-Token"
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
