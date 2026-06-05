import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import frameImage from "./assets/led-frame.png";
import { IconApi, IconClock, IconDisplay, IconMapPin, IconPlane, IconTimetable, SkyframeLogo } from "./components/Icons";

type AircraftCategoryCode = "P" | "C" | "M" | "J" | "T" | "H" | "B" | "G" | "D" | "V" | "O" | "N";

type Config = {
  lat: number;
  lon: number;
  radiusKm: number;
  homeAirportIata: string;
  label: string;
  updatedAt?: string;
  follow: {
    enabled: boolean;
    flights: string[];
  };
  device: {
    enabled: boolean;
    displayMode: DisplayBehaviorMode;
    airspaceMonitoringEnabled: boolean;
    allowedAircraftCategories: AircraftCategoryCode[];
    brightness: number;
    audioVolumePercent: number;
    clockTickEnabled: boolean;
    clockTickVolumePercent: number;
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
    nightMode: {
      enabled: boolean;
      start: string;
      end: string;
      brightness: number;
    };
  };
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
  volumePercent?: number;
};

type DisplayFlight = {
  flight?: string;
  callsign?: string;
  airline?: string;
  airlineCode?: string;
  aircraft?: string;
  air?: string;
  airCode?: string;
  ac?: string;
  arrTime?: string;
  cs?: string;
  ctxLabel?: string;
  ctxValue?: string;
  flt?: string;
  from?: string;
  layout?: "follow_cycle" | "follow_status" | string;
  lines?: {
    airline?: string;
    aircraft?: string;
    context?: string;
    route?: string;
  };
  locationLabel?: string;
  locationValue?: string;
  logoUrl?: string;
  metrics?: {
    altitude?: string;
    speed?: string;
    track?: string;
    verticalRate?: string;
  };
  origin?: string;
  reg?: string;
  routeProgress?: number;
  to?: string;
  destination?: string;
  displayTime?: string;
  contextLabel?: string;
  contextValue?: string;
  followStatus?: {
    color?: "landed" | string;
    detail?: string;
    text?: string;
  };
  gateMessage?: string;
  status?: string;
  alt?: number;
  spd?: number;
  trk?: number;
  vr?: number;
};

type IdleRow = {
  flightId?: string;
  airport?: string;
  gate?: string;
  gateMessage?: string;
  message?: string;
  status?: "scheduled" | "newTime" | "canceled" | "done" | "empty" | string;
  time?: string;
};

type IdleScreen = {
  kind?: "departures" | "arrivals" | string;
  title?: string;
  rows?: IdleRow[];
};

type DisplayPayload = {
  updatedAt?: string;
  mode?: string;
  flights?: DisplayFlight[];
  idleScreens?: IdleScreen[];
  screenState?: ScreenState;
  airspaceMonitoring?: boolean;
  liveSourceStatus?: LiveSourceStatus;
  deviceStatus?: DeviceStatus | null;
};

type AvinorRawFlight = {
  direction?: "A" | "D";
  resolved?: {
    flightId?: string;
    airportName?: string;
    displayTime?: string;
    status?: string;
  };
};

type LiveSourceStatus = {
  source?: string;
  ok?: boolean;
  error?: string;
};

type DeviceStatus = {
  ok: boolean;
  connected: boolean;
  updatedAt: string;
  deviceId?: string | null;
  uptimeMs?: number | null;
  wifi?: {
    connected?: boolean;
    ssid?: string | null;
    rssi?: number | null;
    ip?: string | null;
  };
  screenActive?: boolean | null;
  configOk?: boolean | null;
  displayOk?: boolean | null;
  displayMode?: string | null;
  source?: string | null;
};

type PreviewState = {
  meta: string;
  flights: DisplayFlight[];
  idleScreens: IdleScreen[];
  avinorRows: AvinorRawFlight[];
  mode: string;
  updatedAt: string | null;
  error: string | null;
  liveSourceStatus: LiveSourceStatus | null;
  deviceStatus: DeviceStatus | null;
};

type SectionId = "location" | "display" | "clock" | "aircraft" | "timetable" | "api";

type Section = {
  id: SectionId;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
};

const sections: Section[] = [
  { id: "display", label: "GENERAL", icon: IconDisplay },
  { id: "aircraft", label: "AIRSPACE", icon: IconPlane },
  { id: "timetable", label: "AIRPORT BOARD", icon: IconTimetable },
  { id: "clock", label: "CLOCK", icon: IconClock },
  { id: "location", label: "LOCATION", icon: IconMapPin },
  { id: "api", label: "API DATA", icon: IconApi }
];

const slideOrder: SectionId[] = ["display", "aircraft", "timetable", "clock", "location", "api"];

function slideIndexForSection(sectionIndex: number): number {
  const section = sections[clamp(sectionIndex, 0, sections.length - 1)];
  return Math.max(0, slideOrder.indexOf(section.id));
}

function sectionIndexForSlide(slideIndex: number): number {
  const sectionId = slideOrder[clamp(slideIndex, 0, slideOrder.length - 1)];
  return Math.max(0, sections.findIndex((section) => section.id === sectionId));
}

function slideStyle(sectionId: SectionId) {
  return {
    ...appStyles.slide,
    order: slideOrder.indexOf(sectionId)
  };
}

const defaultAircraftCategories: AircraftCategoryCode[] = ["P", "C", "M", "J", "H", "B", "G", "D", "V", "O", "N"];

const categoryLabels: Record<AircraftCategoryCode, { title: string; description: string }> = {
  P: { title: "Passenger", description: "Commercial passenger aircraft" },
  C: { title: "Cargo", description: "Cargo aircraft" },
  M: { title: "Military", description: "Military or public service aircraft" },
  J: { title: "Business jets", description: "Private and corporate jets" },
  T: { title: "General aviation", description: "Private, training, ambulance, and survey aircraft" },
  H: { title: "Helicopters", description: "Helicopters" },
  B: { title: "Lighter than air", description: "Airships and similar aircraft" },
  G: { title: "Gliders", description: "Gliders" },
  D: { title: "Drones", description: "UAVs and drones" },
  V: { title: "Ground vehicles", description: "Vehicles with transponders" },
  O: { title: "Other", description: "Everything else" },
  N: { title: "Uncategorized", description: "Aircraft without a category" }
};

const lineColorLabels: Record<keyof Config["device"]["lineColors"], string> = {
  airline: "Airline",
  route: "Route",
  aircraft: "Aircraft",
  context: "Details",
  progress: "Page progress",
  routeProgress: "Route progress"
};

const timetableColorLabels: Record<keyof Config["device"]["timetableColors"], string> = {
  header: "Header",
  data: "Text",
  time: "Time",
  newTime: "New time",
  canceled: "Canceled",
  gateGoToGate: "Go to gate",
  gateBoarding: "Boarding",
  gateClosing: "Gate closing",
  gateClosed: "Gate closed",
  landed: "Landed"
};

const displayModeOptions: Array<{ value: DisplayBehaviorMode; title: string; description: string }> = [
  { value: "airspace", title: "Airspace", description: "Show nearby aircraft only." },
  { value: "hybrid", title: "Airspace + Airport Board", description: "Show airport information until aircraft appear." },
  { value: "airport_board", title: "Airport Board", description: "Show arrivals and departures only." },
  { value: "clock", title: "Clock", description: "Show a full-screen clock." }
];

const defaultConfig: Config = {
  lat: 59.9139,
  lon: 10.7522,
  radiusKm: 10,
  homeAirportIata: "OSL",
  label: "",
  follow: { enabled: false, flights: [] },
  device: {
    enabled: true,
    displayMode: "hybrid",
    airspaceMonitoringEnabled: true,
    allowedAircraftCategories: defaultAircraftCategories,
    brightness: 80,
    audioVolumePercent: 35,
    clockTickEnabled: false,
    clockTickVolumePercent: 20,
    pollSeconds: 90,
    displayCycleSeconds: 5,
    timetableCycleSeconds: 7,
    timetableItemCount: 8,
    departureTimetableItemCount: 8,
    arrivalTimetableItemCount: 8,
    avinorWindowHours: 4,
    departureAvinorWindowHours: 4,
    arrivalAvinorWindowHours: 4,
    timetableScrollPixelsPerSecond: 40,
    timetableTransitionMs: 400,
    scrollPixelsPerSecond: 9,
    configRefreshSeconds: 300,
    timezone: "Europe/Oslo",
    followUnits: {
      altitude: "ft",
      speed: "kn",
      track: "deg",
      verticalRate: "fpm"
    },
    lineColors: {
      airline: "#f4f7ff",
      route: "#f4f7ff",
      aircraft: "#f4f7ff",
      context: "#f4f7ff",
      progress: "#f7b500",
      routeProgress: "#00d46a"
    },
    clockColor: "#081b6b",
    clockTopColor: "#ffffff",
    timetableColors: {
      header: "#f7b500",
      data: "#f4f7ff",
      time: "#f4f7ff",
      newTime: "#f7b500",
      canceled: "#ff3b30",
      gateGoToGate: "#00f900",
      gateBoarding: "#00f900",
      gateClosing: "#ff9300",
      gateClosed: "#ff2600",
      landed: "#00f900"
    },
    nightMode: {
      enabled: true,
      start: "23:00",
      end: "07:00",
      brightness: 0
    }
  }
};

const defaultScreenState: ScreenState = {
  active: true,
  brightnessMode: "day",
  lastActivatedAt: null,
  lastDeactivatedAt: null,
  lastBrightnessModeChangedAt: null,
  updatedAt: null,
  source: null
};

const defaultSoundState: SoundState = {
  testNonce: 0,
  lastTriggeredAt: null,
  source: null
};

const adminTokenStorageKey = "flightDisplayAdminToken";
const emulatorTickPcmBase64 = "sf+x/08A2P93ADr/xgAS/58AAABPAJv+FgFPABL/7gCb/hYBif8oALH/KACJ/ygAKACJ/58AEv/GAIn/TwAAAAAAsf93AGH/dwCJ/40Bl/xFBWj4sgpY8FIW3OJQH+fo+gZNCSns9RiU5uMZD+nQD2kDQeQGLAzTGiJm7Uv+uxkrxFlh0Ir5bFeyhycc+orrKiqsv3pJMb3UMOXx+edVLKfRYTKzw+NMWJ6wZVmpEz041ecbp/CYB4X9LAL8/RoDEv8WAU8A2P86/wAAxgC1AQAAS/49AU8AOv/GAGH/nwBPAMP+AADuAOr+7gCx/4n/xgA6/xYBEv/GAIn/2P8WAXP+PQES/58Asf+x/58AEv9PAE8Asf8oAAAATwA6/8YAsf/Y/ygA2P+fAIn/TwAoANj/KACx/08Aif93AAAAsf/GAGH/KAAoALH/AABPALH/TwAoANj/AAAoAAAAif+fAGH/TwAAANj/KAAAAAAAAAAoALH/TwCx/ygAAADY/ygAAAAAAAAAKADY/ygA2P8oANj/AAAAAAAAAAAAANj/KADY/ygAAADY/ygAAAAAAAAAAAAAAAAA2P8oANj/KAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const appStyles = {
  shell: {
    position: "relative",
    margin: "0 auto",
    display: "flex",
    minHeight: "100dvh",
    height: "100dvh",
    width: "100vw",
    maxWidth: "480px",
    flexDirection: "column" as const,
    overflow: "hidden",
    background: "var(--background)",
    color: "var(--foreground)",
    boxShadow: "var(--shadow)",
    isolation: "isolate" as const
  },
  header: {
    flexShrink: 0,
    background: "var(--secondary)",
    padding: "max(16px, env(safe-area-inset-top)) 20px 16px"
  },
  navScroller: {
    flexShrink: 0,
    overflowX: "auto" as const,
    padding: "0 20px 12px",
    scrollbarWidth: "none" as const
  },
  navTrack: {
    display: "flex",
    width: "max-content",
    gap: "12px"
  },
  slides: {
    display: "flex",
    height: "100%",
    overflowX: "hidden" as const,
    scrollbarWidth: "none" as const,
    scrollBehavior: "auto" as const,
    touchAction: "pan-y" as const
  },
  slide: {
    minWidth: "100%",
    flex: "0 0 100%",
    overflowY: "auto" as const,
    touchAction: "pan-y" as const,
    padding: "0 20px 168px"
  },
  saveDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    minHeight: "150px",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "flex-end",
    padding: "0 20px max(16px, env(safe-area-inset-bottom))",
    background: "linear-gradient(180deg, rgba(223, 218, 215, 0) 0%, rgba(223, 218, 215, 0.86) 42%, var(--background) 72%)",
    pointerEvents: "auto" as const,
    transform: "translateZ(0)"
  }
};

function buildEmulatorTickBuffer(audioContext: AudioContext): AudioBuffer {
  const binary = atob(emulatorTickPcmBase64);
  const frameCount = Math.floor(binary.length / 2);
  const audioBuffer = audioContext.createBuffer(1, frameCount, 16000);
  const channel = audioBuffer.getChannelData(0);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const low = binary.charCodeAt(frame * 2);
    const high = binary.charCodeAt(frame * 2 + 1);
    const sample = low | (high << 8);
    const signed = sample > 0x7fff ? sample - 0x10000 : sample;
    channel[frame] = signed / 32768;
  }

  return audioBuffer;
}

function normalizeConfig(input: Partial<Config> & Record<string, unknown>): Config {
  const device = (input.device as Partial<Config["device"]>) ?? {};
  const follow = (input.follow as Partial<Config["follow"]>) ?? {};
  const nightMode = (device.nightMode as Partial<Config["device"]["nightMode"]>) ?? {};
  const lineColors = (device.lineColors as Partial<Config["device"]["lineColors"]>) ?? {};
  const timetableColors = (device.timetableColors as Partial<Config["device"]["timetableColors"]>) ?? {};
  const followUnits = (device.followUnits as Partial<Config["device"]["followUnits"]>) ?? {};

  return {
    lat: Number(input.lat ?? defaultConfig.lat),
    lon: Number(input.lon ?? defaultConfig.lon),
    radiusKm: Number(input.radiusKm ?? defaultConfig.radiusKm),
    homeAirportIata: String(input.homeAirportIata ?? defaultConfig.homeAirportIata),
    label: String(input.label ?? ""),
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : undefined,
    follow: {
      enabled: Boolean(follow.enabled),
      flights: Array.isArray(follow.flights) ? follow.flights.map(String) : []
    },
    device: {
      enabled: device.enabled !== false,
      displayMode: normalizeDisplayBehaviorMode(device.displayMode),
      airspaceMonitoringEnabled: airspaceMonitoringForMode(normalizeDisplayBehaviorMode(device.displayMode)),
      allowedAircraftCategories: Array.isArray(device.allowedAircraftCategories)
        ? (device.allowedAircraftCategories as AircraftCategoryCode[])
        : defaultAircraftCategories,
      brightness: Number(device.brightness ?? defaultConfig.device.brightness),
      audioVolumePercent: Number(device.audioVolumePercent ?? defaultConfig.device.audioVolumePercent),
      clockTickEnabled: Boolean(device.clockTickEnabled),
      clockTickVolumePercent: Number(device.clockTickVolumePercent ?? defaultConfig.device.clockTickVolumePercent),
      pollSeconds: Number(device.pollSeconds ?? defaultConfig.device.pollSeconds),
      displayCycleSeconds: Number(device.displayCycleSeconds ?? defaultConfig.device.displayCycleSeconds),
      timetableCycleSeconds: Number(device.timetableCycleSeconds ?? defaultConfig.device.timetableCycleSeconds),
      timetableItemCount: Number(device.timetableItemCount ?? defaultConfig.device.timetableItemCount),
      departureTimetableItemCount: Number(device.departureTimetableItemCount ?? device.timetableItemCount ?? defaultConfig.device.departureTimetableItemCount),
      arrivalTimetableItemCount: Number(device.arrivalTimetableItemCount ?? device.timetableItemCount ?? defaultConfig.device.arrivalTimetableItemCount),
      avinorWindowHours: Number(device.avinorWindowHours ?? defaultConfig.device.avinorWindowHours),
      departureAvinorWindowHours: Number(device.departureAvinorWindowHours ?? device.avinorWindowHours ?? defaultConfig.device.departureAvinorWindowHours),
      arrivalAvinorWindowHours: Number(device.arrivalAvinorWindowHours ?? device.avinorWindowHours ?? defaultConfig.device.arrivalAvinorWindowHours),
      timetableScrollPixelsPerSecond: Number(device.timetableScrollPixelsPerSecond ?? defaultConfig.device.timetableScrollPixelsPerSecond),
      timetableTransitionMs: Number(device.timetableTransitionMs ?? defaultConfig.device.timetableTransitionMs),
      scrollPixelsPerSecond: Number(device.scrollPixelsPerSecond ?? defaultConfig.device.scrollPixelsPerSecond),
      configRefreshSeconds: Number(device.configRefreshSeconds ?? defaultConfig.device.configRefreshSeconds),
      timezone: String(device.timezone ?? defaultConfig.device.timezone),
      followUnits: {
        altitude: followUnits.altitude ?? defaultConfig.device.followUnits.altitude,
        speed: followUnits.speed ?? defaultConfig.device.followUnits.speed,
        track: followUnits.track ?? defaultConfig.device.followUnits.track,
        verticalRate: followUnits.verticalRate ?? defaultConfig.device.followUnits.verticalRate
      },
      lineColors: {
        airline: lineColors.airline ?? defaultConfig.device.lineColors.airline,
        route: lineColors.route ?? defaultConfig.device.lineColors.route,
        aircraft: lineColors.aircraft ?? defaultConfig.device.lineColors.aircraft,
        context: lineColors.context ?? defaultConfig.device.lineColors.context,
        progress: lineColors.progress ?? defaultConfig.device.lineColors.progress,
        routeProgress: lineColors.routeProgress ?? defaultConfig.device.lineColors.routeProgress
      },
      clockColor: String(device.clockColor ?? defaultConfig.device.clockColor),
      clockTopColor: String(device.clockTopColor ?? defaultConfig.device.clockTopColor),
      timetableColors: {
        header: timetableColors.header ?? defaultConfig.device.timetableColors.header,
        data: timetableColors.data ?? defaultConfig.device.timetableColors.data,
        time: timetableColors.time ?? defaultConfig.device.timetableColors.time,
        newTime: timetableColors.newTime ?? defaultConfig.device.timetableColors.newTime,
        canceled: timetableColors.canceled ?? defaultConfig.device.timetableColors.canceled,
        gateGoToGate: timetableColors.gateGoToGate ?? defaultConfig.device.timetableColors.gateGoToGate,
        gateBoarding: timetableColors.gateBoarding ?? defaultConfig.device.timetableColors.gateBoarding,
        gateClosing: timetableColors.gateClosing ?? defaultConfig.device.timetableColors.gateClosing,
        gateClosed: timetableColors.gateClosed ?? defaultConfig.device.timetableColors.gateClosed,
        landed: timetableColors.landed ?? defaultConfig.device.timetableColors.landed
      },
      nightMode: {
        enabled: nightMode.enabled !== false,
        start: String(nightMode.start ?? defaultConfig.device.nightMode.start),
        end: String(nightMode.end ?? defaultConfig.device.nightMode.end),
        brightness: Number(nightMode.brightness ?? defaultConfig.device.nightMode.brightness)
      }
    }
  };
}

function normalizeDisplayBehaviorMode(value: unknown): DisplayBehaviorMode {
  if (value === "airspace" || value === "hybrid" || value === "airport_board" || value === "clock") return value;
  if (value === "flight") return "hybrid";
  return defaultConfig.device.displayMode;
}

function airspaceMonitoringForMode(mode: DisplayBehaviorMode): boolean {
  return mode === "airspace" || mode === "hybrid";
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const nextOptions = { ...(options ?? {}) };
  nextOptions.headers = adminHeaders(options?.headers);
  let response = await fetch(url, nextOptions);

  if (response.status === 401) {
    const token = window.prompt("Admin-token kreves for API-kall:");
    if (token) {
      localStorage.setItem(adminTokenStorageKey, token.trim());
      nextOptions.headers = adminHeaders(options?.headers);
      response = await fetch(url, nextOptions);
      if (response.status === 401) {
        localStorage.removeItem(adminTokenStorageKey);
      }
    }
  }

  const json = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(typeof json === "object" && json && "error" in json ? String(json.error) : "API error");
  }
  return json;
}

function adminToken(): string {
  return localStorage.getItem(adminTokenStorageKey) || "";
}

function adminHeaders(headers?: HeadersInit): HeadersInit {
  const merged = new Headers(headers);
  const token = adminToken();
  if (token) merged.set("X-Flight-Admin-Token", token);
  return merged;
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "aldri";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "aldri";
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "short", timeStyle: "medium" }).format(date);
}

function configSignature(config: Config): string {
  return JSON.stringify(normalizeConfig(config));
}

function shortTime(value: string | null | undefined): string {
  if (!value) return "aldri";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "aldri";
  return new Intl.DateTimeFormat("nb-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date);
}

function isRecentTimestamp(value: string | null | undefined, maxAgeMs: number): boolean {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && Date.now() - time <= maxAgeMs;
}

function wifiSignalLabel(rssi: number | null | undefined): string {
  if (typeof rssi !== "number" || !Number.isFinite(rssi)) return "Unknown";
  if (rssi >= -55) return `${rssi} dBm · sterkt`;
  if (rssi >= -67) return `${rssi} dBm · bra`;
  if (rssi >= -75) return `${rssi} dBm · svakt`;
  return `${rssi} dBm · kritisk`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function asUpper(value: unknown): string {
  return String(value ?? "").toUpperCase();
}

function formatIdleRow(row: unknown): string {
  if (typeof row === "string") return row;
  if (Array.isArray(row)) return row.map((value) => String(value ?? "")).join(" ");
  if (row && typeof row === "object") return Object.values(row as Record<string, unknown>).map((value) => String(value ?? "")).join(" ");
  return String(row ?? "");
}

function formatIdleRowForPreview(row: IdleRow): string {
  if (row.status === "empty" || row.message) return String(row.message || "").replace("|", " / ");
  const gate = row.gate ? `Gate ${row.gate}` : "";
  const status = row.gateMessage || (row.status && row.status !== "scheduled" ? row.status : "");
  return [row.flightId, row.airport, gate, row.time, status].filter(Boolean).join(" · ");
}

function normalizeLedText(value: string): string {
  return value
    .replace(/[æÆåÅäÄáÁàÀâÂ]/g, "A")
    .replace(/[øØöÖóÓòÒôÔ]/g, "O")
    .replace(/[üÜúÚùÙûÛ]/g, "U")
    .replace(/[éÉèÈêÊëË]/g, "E")
    .replace(/[íÍìÌîÎïÏ]/g, "I")
    .replace(/[çÇ]/g, "C")
    .replace(/[ñÑ]/g, "N")
    .toUpperCase();
}

const ledGlyphs: Record<string, string[]> = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ":": ["00000", "00100", "00000", "00000", "00100", "00000", "00000"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"]
};

function ledCharAdvance(char: string): number {
  if (char === " ") return 4;
  if (char === ":" || char === ".") return 5;
  return 6;
}

function measureLedText(text: string): number {
  return Array.from(normalizeLedText(text)).reduce((width, char) => width + ledCharAdvance(char), 0);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = String(hex || "").replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((value) => value + value).join("")
    : normalized.padStart(6, "0").slice(0, 6);
  const value = Number.parseInt(expanded, 16);
  if (!Number.isFinite(value)) return [255, 255, 255];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function interpolateHexColor(from: string, to: string, step: number, steps: number) {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);
  const ratio = steps <= 0 ? 1 : clamp(step / steps, 0, 1);
  const r = Math.round(fromRgb[0] + (toRgb[0] - fromRgb[0]) * ratio);
  const g = Math.round(fromRgb[1] + (toRgb[1] - fromRgb[1]) * ratio);
  const b = Math.round(fromRgb[2] + (toRgb[2] - fromRgb[2]) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawLedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, maxWidth = 999) {
  let cursor = x;
  for (const rawChar of normalizeLedText(text)) {
    const glyph = ledGlyphs[rawChar] ?? ledGlyphs[" "];
    const advance = ledCharAdvance(rawChar);
    if (cursor + glyph[0].length > x + maxWidth) break;
    ctx.fillStyle = color;
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === "1") ctx.fillRect(cursor + col, y + row, 1, 1);
      }
    }
    cursor += advance;
  }
}

function drawLedTextRight(ctx: CanvasRenderingContext2D, text: string, rightX: number, y: number, color: string, maxWidth: number) {
  const value = normalizeLedText(text);
  const width = Math.min(measureLedText(value), maxWidth);
  drawLedText(ctx, value, rightX - width, y, color, maxWidth);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function getTickerOffset(overflow: number, pxPerSecond: number, startedAt: number, now: number) {
  const holdMs = 900;
  const travelMs = Math.max(1200, (overflow / Math.max(2, pxPerSecond)) * 1000);
  const cycleMs = holdMs + travelMs + holdMs + travelMs;
  const t = (now - startedAt) % cycleMs;
  if (t < holdMs) return 0;
  if (t < holdMs + travelMs) return Math.round(((t - holdMs) / travelMs) * overflow);
  if (t < holdMs + travelMs + holdMs) return overflow;
  return Math.round((1 - ((t - holdMs - travelMs - holdMs) / travelMs)) * overflow);
}

function getTickerForwardOffset(overflow: number, pxPerSecond: number, startedAt: number, now: number) {
  const holdMs = 900;
  const travelMs = Math.max(1200, (overflow / Math.max(2, pxPerSecond)) * 1000);
  const cycleMs = holdMs + travelMs + holdMs;
  const t = (now - startedAt) % cycleMs;
  if (t < holdMs) return 0;
  if (t < holdMs + travelMs) return Math.round(((t - holdMs) / travelMs) * overflow);
  return overflow;
}

function drawTickerLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, width: number, config: Config, startedAt: number, now: number) {
  if (!text) return;
  const textWidth = measureLedText(text);
  const fitsRestingWidth = textWidth <= width;
  const fitsFullWidth = textWidth + Math.max(0, x) <= 128;
  const overflow = fitsRestingWidth || fitsFullWidth ? 0 : Math.max(1, textWidth + Math.max(0, x) - 128);
  const offset = overflow > 0 ? getTickerOffset(overflow, config.device.scrollPixelsPerSecond, startedAt, now) : 0;
  ctx.save();
  ctx.beginPath();
  if (overflow > 0) {
    ctx.rect(0, y, 128, 8);
  } else {
    ctx.rect(x, y, fitsFullWidth ? 128 - Math.max(0, x) : width, 8);
  }
  ctx.clip();
  drawLedText(ctx, text, x - offset, y, color, textWidth);
  ctx.restore();
}

function drawTickerLineBoxed(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, width: number, config: Config, startedAt: number, now: number) {
  if (!text) return;
  const textWidth = measureLedText(text);
  const overflow = textWidth <= width ? 0 : Math.max(1, textWidth - width);
  const offset = overflow > 0 ? getTickerForwardOffset(overflow, config.device.scrollPixelsPerSecond, startedAt, now) : 0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, 8);
  ctx.clip();
  drawLedText(ctx, text, x - offset, y, color, textWidth);
  ctx.restore();
}

function normalizeGateStatusForDisplay(value?: string): string {
  const raw = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!raw) return "";
  if (raw.includes("gotogate") || raw.includes("togate")) return "Go to gate";
  if (raw.includes("boarding")) return "Boarding";
  if (raw.includes("closing")) return "Closing";
  if (raw.includes("closed")) return "Closed";
  return value || "";
}

function drawLocalClock(ctx: CanvasRenderingContext2D, rightX: number, y: number, color: string, timezone: string) {
  const value = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone || "Europe/Oslo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());
  drawLedTextRight(ctx, value, rightX, y, color, 30);
}

function getClockTimeParts(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone || "Europe/Oslo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(new Date());
  return {
    hour: parts.find((part) => part.type === "hour")?.value || "00",
    minute: parts.find((part) => part.type === "minute")?.value || "00",
    second: Number(parts.find((part) => part.type === "second")?.value || "0")
  };
}

function getClockMinuteRowColor(depth: number, topColor: string, bottomColor: string) {
  const step = Math.max(1, Math.min(60, depth));
  return interpolateHexColor(topColor, bottomColor, step, 60);
}

function getClockTextRowColor(centerY: number, topColor: string, bottomColor: string) {
  const step = Math.max(0, Math.min(58, centerY - 3));
  return interpolateHexColor(topColor, bottomColor, step, 58);
}

function drawThinClockSegment(ctx: CanvasRenderingContext2D, segment: string, x: number, y: number) {
  if (segment === "a") ctx.fillRect(x + 1, y, 5, 1);
  if (segment === "b") ctx.fillRect(x + 6, y + 1, 1, 7);
  if (segment === "c") ctx.fillRect(x + 6, y + 9, 1, 7);
  if (segment === "d") ctx.fillRect(x + 1, y + 16, 5, 1);
  if (segment === "e") ctx.fillRect(x, y + 9, 1, 7);
  if (segment === "f") ctx.fillRect(x, y + 1, 1, 7);
  if (segment === "g") ctx.fillRect(x + 1, y + 8, 5, 1);
}

function drawThinClockChar(ctx: CanvasRenderingContext2D, char: string, x: number, y: number, color: string) {
  const segmentsByDigit: Record<string, string[]> = {
    "0": ["a", "b", "c", "d", "e", "f"],
    "1": ["b", "c"],
    "2": ["a", "b", "g", "e", "d"],
    "3": ["a", "b", "g", "c", "d"],
    "4": ["f", "g", "b", "c"],
    "5": ["a", "f", "g", "c", "d"],
    "6": ["a", "f", "g", "e", "c", "d"],
    "7": ["a", "b", "c"],
    "8": ["a", "b", "c", "d", "e", "f", "g"],
    "9": ["a", "b", "c", "d", "f", "g"],
    "-": ["g"]
  };
  ctx.fillStyle = color;
  (segmentsByDigit[char] || []).forEach((segment) => drawThinClockSegment(ctx, segment, x, y));
}

function drawThinClockPair(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  const value = String(text || "--").padStart(2, "-").slice(0, 2);
  drawThinClockChar(ctx, value[0], x, y, color);
  drawThinClockChar(ctx, value[1], x + 9, y, color);
}

function drawClockTimeStack(ctx: CanvasRenderingContext2D, x: number, time: ReturnType<typeof getClockTimeParts>, topColor: string, bottomColor: string) {
  drawThinClockPair(ctx, time.hour, x, 3, getClockTextRowColor(11, topColor, bottomColor));
  drawThinClockPair(ctx, time.minute, x, 24, getClockTextRowColor(32, topColor, bottomColor));
  drawThinClockPair(ctx, time.second.toString().padStart(2, "0"), x, 45, getClockTextRowColor(53, topColor, bottomColor));
}

function drawClockLayoutExact(ctx: CanvasRenderingContext2D, config: Config, fallingMinuteIndex: number | null, fallingStartedAt: number, now: number) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 128, 64);

  const time = getClockTimeParts(config.device.timezone);
  const completedMinutes = Math.max(0, Math.min(59, Number(time.minute)));
  const activeSeconds = Math.max(0, Math.min(60, time.second + 1));
  const topColor = config.device.clockTopColor || "#ffffff";
  const bottomColor = config.device.clockColor || "#081b6b";
  const falling = fallingMinuteIndex !== null && now - fallingStartedAt < 400;

  for (let index = 0; index < completedMinutes; index += 1) {
    if (falling && index === fallingMinuteIndex) continue;
    const y = 62 - index;
    ctx.fillStyle = getClockMinuteRowColor(completedMinutes - index, topColor, bottomColor);
    ctx.fillRect(4, y, 60, 1);
  }

  if (falling && fallingMinuteIndex !== null) {
    const targetY = 62 - fallingMinuteIndex;
    const elapsed = Math.min(400, now - fallingStartedAt);
    const y = Math.round(3 + ((targetY - 3) * elapsed) / 400);
    ctx.fillStyle = getClockMinuteRowColor(1, topColor, bottomColor);
    ctx.fillRect(4, y, 60, 1);
  }

  if (activeSeconds > 0) {
    ctx.fillStyle = topColor;
    ctx.fillRect(4, 3, activeSeconds, 1);
  }

  drawClockTimeStack(ctx, 70, time, topColor, bottomColor);
}

function drawIdleRowExact(
  ctx: CanvasRenderingContext2D,
  kind: string | undefined,
  row: IdleRow,
  x: number,
  y: number,
  config: Config,
  startedAt: number,
  now: number
) {
  const colors = config.device.timetableColors;
  const status = row.status || "scheduled";
  if (status === "empty" || row.message) {
    const parts = String(row.message || row.flightId || "").split("|");
    drawLedText(ctx, parts[0] || "", x, y, colors.data, 122);
    if (parts[1]) drawLedText(ctx, parts[1], x, y + 11, colors.data, 122);
    return;
  }

  const timeColor = status === "canceled" ? colors.canceled : status === "newTime" ? colors.newTime : colors.time;
  const rowColor = status === "canceled" ? colors.canceled : colors.data;
  drawIdleTimeExact(ctx, row.time || "", x, y, timeColor);
  drawIdleDestinationExact(ctx, row.airport || "", x + 28, y, rowColor, 60, config, startedAt, now);
  drawLedText(ctx, idleFlightFieldTextExact(kind, row, now), x + 94, y, rowColor, 18);
  drawIdleSymbolExact(ctx, kind, row, x + 113, y, status, colors);

  if (status === "canceled") {
    ctx.fillStyle = colors.canceled;
    ctx.fillRect(x, y + 3, 122, 1);
  }
}

function drawIdleTimeExact(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  const value = normalizeLedText(text || "").padEnd(5, " ");
  drawLedText(ctx, value.slice(0, 2), x, y, color, 12);
  if (value.slice(2, 3) === ":") drawIdleColonExact(ctx, x + 12, y, color);
  drawLedText(ctx, value.slice(3, 5), x + 14, y, color, 12);
}

function drawIdleColonExact(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 1, 1, 1);
  ctx.fillRect(x, y + 4, 1, 1);
}

const departureCircleSymbolExact = [
  ".##.",
  "####",
  "####",
  ".##."
];

const landedCheckSymbolExact = [
  "....#",
  "...#.",
  "#.#..",
  ".#..."
];

const gateArrowSymbolExact = [
  "#.",
  "##",
  "##",
  "#."
];

const gateDoorSymbolExact = [
  ".##",
  "#..",
  "#.#",
  ".##"
];

function airlinePrefixExact(flightId?: string) {
  return String(flightId || "").trim().toUpperCase().slice(0, 2);
}

function idleFlightFieldTextExact(kind: string | undefined, row: IdleRow, now: number) {
  const airline = airlinePrefixExact(row.flightId);
  const gate = String(row.gate || "").trim().toUpperCase().slice(0, 3);
  if (kind === "departures" && gate && Math.floor(now / 1200) % 2 === 1) return gate;
  return airline;
}

function idleSymbolStateExact(kind: string | undefined, row: IdleRow, status: string) {
  if (status === "canceled") return null;
  if (kind === "arrivals") return status === "done" ? "landed" : null;
  const gateStatus = normalizeGateStatusForDisplay(row.gateMessage);
  if (gateStatus === "Go to gate") return "goToGate";
  if (gateStatus === "Boarding") return "boarding";
  if (gateStatus === "Closing") return "gateClosing";
  if (gateStatus === "Closed") return "gateClosed";
  return null;
}

function idleSymbolColorExact(state: string | null, colors: Config["device"]["timetableColors"]) {
  if (state === "goToGate") return colors.gateGoToGate;
  if (state === "boarding") return colors.gateBoarding;
  if (state === "gateClosing") return colors.gateClosing;
  if (state === "gateClosed") return colors.gateClosed;
  if (state === "landed") return colors.landed;
  return colors.data;
}

function drawSymbolBitmapExact(ctx: CanvasRenderingContext2D, bitmap: string[], x: number, y: number, color: string) {
  ctx.fillStyle = color;
  bitmap.forEach((line, rowIndex) => {
    Array.from(line).forEach((pixel, columnIndex) => {
      if (pixel === "#") ctx.fillRect(x + columnIndex, y + rowIndex, 1, 1);
    });
  });
}

function drawSymbolBitmapBoxedExact(ctx: CanvasRenderingContext2D, bitmap: string[], x: number, y: number, color: string, clipX: number, clipY: number, clipWidth: number, clipHeight: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(clipX, clipY, clipWidth, clipHeight);
  ctx.clip();
  drawSymbolBitmapExact(ctx, bitmap, x, y, color);
  ctx.restore();
}

function animatedGateArrowX(startX: number, stopX: number, now: number) {
  const speed = 6;
  const distance = Math.abs(stopX - startX);
  const travelMs = Math.max(1, (distance / speed) * 1000);
  const phase = now % travelMs;
  const progress = phase / travelMs;
  return Math.round(startX + (stopX - startX) * progress);
}

function drawGateMotionSymbolExact(ctx: CanvasRenderingContext2D, state: string, x: number, y: number, color: string, now: number) {
  const fieldWidth = 9;
  const fieldHeight = 8;
  const arrowWidth = gateArrowSymbolExact[0].length;
  const doorWidth = gateDoorSymbolExact[0].length;
  const drawY = y + 1;
  const doorX = x + Math.floor((fieldWidth - doorWidth) / 2);

  if (state === "gateClosed") {
    drawSymbolBitmapExact(ctx, gateDoorSymbolExact, doorX, drawY, color);
    return;
  }

  if (state === "goToGate") {
    const arrowX = doorX - arrowWidth - 1;
    drawSymbolBitmapExact(ctx, gateDoorSymbolExact, doorX, drawY, color);
    if (Math.floor(now / 850) % 2 === 0) {
      drawSymbolBitmapBoxedExact(ctx, gateArrowSymbolExact, arrowX, drawY, color, x, y, fieldWidth, fieldHeight);
    }
    return;
  }

  const arrowX = animatedGateArrowX(doorX + doorWidth + 1, 130, now);
  drawSymbolBitmapExact(ctx, gateDoorSymbolExact, doorX, drawY, color);
  drawSymbolBitmapBoxedExact(ctx, gateArrowSymbolExact, arrowX, drawY, color, x, y, 128 - x, fieldHeight);
}

function drawIdleSymbolExact(
  ctx: CanvasRenderingContext2D,
  kind: string | undefined,
  row: IdleRow,
  x: number,
  y: number,
  status: string,
  colors: Config["device"]["timetableColors"]
) {
  const state = idleSymbolStateExact(kind, row, status);
  if (!state) return;
  const fieldWidth = 9;

  if (state === "goToGate" || state === "boarding" || state === "gateClosing" || state === "gateClosed") {
    drawGateMotionSymbolExact(ctx, state, x, y, idleSymbolColorExact(state, colors), performance.now());
    return;
  }

  const bitmap = state === "landed" ? landedCheckSymbolExact : departureCircleSymbolExact;
  const drawX = x + Math.max(0, fieldWidth - bitmap[0].length);
  const drawY = state === "landed" ? y + 2 : y + 1;
  drawSymbolBitmapExact(ctx, bitmap, drawX, drawY, idleSymbolColorExact(state, colors));
}

function drawIdleDestinationExact(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  width: number,
  config: Config,
  startedAt: number,
  now: number
) {
  const normalized = normalizeLedText(text);
  const textWidth = measureLedText(normalized);
  if (textWidth <= width) {
    drawLedText(ctx, normalized, x, y, color, width);
    return;
  }
  drawTickerLineBoxed(
    ctx,
    normalized,
    x,
    y,
    color,
    width,
    { ...config, device: { ...config.device, scrollPixelsPerSecond: config.device.timetableScrollPixelsPerSecond } },
    startedAt,
    now
  );
}

function drawIdleRowsClipped(
  ctx: CanvasRenderingContext2D,
  kind: string | undefined,
  rows: IdleRow[],
  y: number,
  config: Config,
  startedAt: number,
  now: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 15, 128, 49);
  ctx.clip();
  rows.slice(0, 4).forEach((row, index) => drawIdleRowExact(ctx, kind, row, 3, y + index * 11, config, startedAt, now));
  ctx.restore();
}

type IdleTransition = {
  currentBaseY: number;
  headerText: string;
  nextBaseY: number | null;
  nextScreen: IdleScreen | null;
};

function drawIdleLayoutExact(
  ctx: CanvasRenderingContext2D,
  screen: IdleScreen | undefined,
  config: Config,
  startedAt: number,
  now: number,
  transitionOffset = 0,
  nextScreen?: IdleScreen | null,
  transition?: IdleTransition
) {
  const colors = config.device.timetableColors;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 128, 64);

  if (!screen) {
    drawLedText(ctx, "No flights", 3, 9, colors.header, 122);
    drawLedText(ctx, "No airport data", 3, 23, colors.data, 122);
    return;
  }

  const rows = Array.isArray(screen.rows) ? screen.rows.slice(0, 4) : [];
  if (!rows.length) {
    drawLedText(ctx, screen.title || "AIRPORT", 3, 3, colors.header, 86);
    drawLocalClock(ctx, 125, 3, colors.time, config.device.timezone);
    ctx.fillStyle = colors.header;
    ctx.fillRect(3, 14, 122, 1);
    drawLedText(ctx, "No airport data", 3, 28, colors.data, 122);
    return;
  }

  const activeTransition = transition ?? {
    currentBaseY: 20 - transitionOffset,
    headerText: screen.title || "AIRPORT",
    nextBaseY: nextScreen ? 64 - transitionOffset : null,
    nextScreen: nextScreen ?? null
  };
  drawIdleRowsClipped(ctx, screen.kind, rows, activeTransition.currentBaseY, config, startedAt, now);
  if (activeTransition.nextScreen && activeTransition.nextBaseY !== null) {
    drawIdleRowsClipped(ctx, activeTransition.nextScreen.kind, Array.isArray(activeTransition.nextScreen.rows) ? activeTransition.nextScreen.rows : [], activeTransition.nextBaseY, config, startedAt, now);
  }
  drawLedText(ctx, activeTransition.headerText, 3, 3, colors.header, 86);
  drawLocalClock(ctx, 125, 3, colors.time, config.device.timezone);
  ctx.fillStyle = colors.header;
  ctx.fillRect(3, 14, 122, 1);
}

function idleTransitionMs(config: Config, rowTravel: number) {
  const speed = Math.max(4, config.device.timetableScrollPixelsPerSecond);
  return Math.max(400, (rowTravel / speed) * 1000);
}

function idleKindTransitionMs(config: Config) {
  return clamp(config.device.timetableTransitionMs || defaultConfig.device.timetableTransitionMs, 200, 1000);
}

function idleScreenTransitionMs(screens: IdleScreen[], index: number, config: Config) {
  if (screens.length <= 1) return 0;
  const screen = screens[index];
  const nextScreen = screens[(index + 1) % screens.length];
  if (!screen || !nextScreen) return 0;
  return screen.kind !== nextScreen.kind ? idleKindTransitionMs(config) : idleTransitionMs(config, 44);
}

function getActiveIdleCycle(screens: IdleScreen[], config: Config, startedAt: number, now: number) {
  const holdMs = Math.max(2000, config.device.timetableCycleSeconds * 1000);
  if (!screens.length) return { index: 0, cycleStartedAt: startedAt };
  const durations = screens.map((_, index) => holdMs + idleScreenTransitionMs(screens, index, config));
  const totalMs = durations.reduce((sum, duration) => sum + duration, 0);
  let elapsed = totalMs > 0 ? (Math.max(0, now - startedAt) % totalMs) : 0;
  let cycleStartedAt = now - elapsed;
  for (let index = 0; index < durations.length; index += 1) {
    if (elapsed < durations[index]) return { index, cycleStartedAt };
    elapsed -= durations[index];
    cycleStartedAt += durations[index];
  }
  return { index: 0, cycleStartedAt: startedAt };
}

function animatedHeaderText(title: string, progress: number, intro: boolean) {
  const length = title.length;
  if (!length) return title;
  const visible = intro ? Math.ceil(length * progress) : Math.floor(length * (1 - progress));
  return title.slice(0, Math.max(0, Math.min(length, visible)));
}

function getIdleTransition(screens: IdleScreen[], currentIndex: number, config: Config, cycleStartedAt: number, now: number): IdleTransition {
  const screen = screens[currentIndex];
  const title = screen?.title || "AIRPORT";
  if (screens.length <= 1 || !screen) return { currentBaseY: 20, headerText: title, nextBaseY: null, nextScreen: null };
  const nextScreen = screens[(currentIndex + 1) % screens.length];
  const cycleMs = Math.max(2000, config.device.timetableCycleSeconds * 1000);
  const elapsed = Math.max(0, now - cycleStartedAt);
  const previousScreen = screens[(currentIndex - 1 + screens.length) % screens.length];

  if (previousScreen && previousScreen.kind !== screen.kind) {
    const transitionMs = idleKindTransitionMs(config);
    if (elapsed < transitionMs) {
      const progress = easeInOut(Math.min(1, elapsed / transitionMs));
      return {
        currentBaseY: Math.round(64 - 44 * progress),
        headerText: animatedHeaderText(title, progress, true),
        nextBaseY: null,
        nextScreen: null
      };
    }
  }

  if (!nextScreen) return { currentBaseY: 20, headerText: title, nextBaseY: null, nextScreen: null };

  const kindChanges = screen.kind !== nextScreen.kind;
  const rowTravel = kindChanges ? 64 : 44;
  const transitionMs = kindChanges ? idleKindTransitionMs(config) : idleTransitionMs(config, rowTravel);
  const transitionStart = cycleMs;
  if (elapsed < transitionStart) return { currentBaseY: 20, headerText: title, nextBaseY: null, nextScreen: null };

  const progress = Math.min(1, (elapsed - transitionStart) / transitionMs);
  const offset = Math.floor(rowTravel * progress);
  return {
    currentBaseY: 20 - offset,
    headerText: kindChanges ? animatedHeaderText(title, progress, false) : title,
    nextBaseY: kindChanges ? null : 64 - offset,
    nextScreen: kindChanges ? null : nextScreen
  };
}

function drawPlaceholderLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
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

function getFlightLineColors(config: Config) {
  return config.device.lineColors;
}

function drawFlightTextColumn(ctx: CanvasRenderingContext2D, lines: { airline?: string; aircraft?: string; context?: string; route?: string }, config: Config, tickerStartedAt: number, now: number) {
  const colors = getFlightLineColors(config);
  drawLedText(ctx, lines.airline || "", 50, 5, colors.airline, 75);
  drawLedText(ctx, lines.route || "", 50, 19, colors.route, 75);
  drawLedText(ctx, lines.aircraft || "", 50, 33, colors.aircraft, 75);
  drawTickerLine(ctx, lines.context || "", 3, 52, colors.context, 122, config, tickerStartedAt, now);
}

function formatCompactMetrics(flight: DisplayFlight) {
  const metrics = flight.metrics || {};
  return {
    altitude: metrics.altitude || (Number.isFinite(flight.alt) ? `${Math.round(Number(flight.alt))}ft` : ""),
    speed: metrics.speed || (Number.isFinite(flight.spd) ? `${Math.round(Number(flight.spd))}kn` : ""),
    track: metrics.track || (Number.isFinite(flight.trk) ? `${Math.round(Number(flight.trk))}deg` : ""),
    verticalRate: metrics.verticalRate || (Number.isFinite(flight.vr) ? `${Math.round(Number(flight.vr))}fpm` : "")
  };
}

function drawFollowFlightTextExact(ctx: CanvasRenderingContext2D, flight: DisplayFlight, config: Config, cycleStartedAt: number, tickerStartedAt: number, now: number) {
  const colors = getFlightLineColors(config);
  const route = flight.lines?.route || [flight.from || flight.origin, flight.to || flight.destination].filter(Boolean).join("-");
  const elapsed = Math.max(0, now - cycleStartedAt);
  const detailPhase = elapsed % 15000 < 10000 ? "metrics" : "location";
  const phaseStartedAt = cycleStartedAt + Math.floor(elapsed / 15000) * 15000 + (detailPhase === "metrics" ? 0 : 10000);
  const etaLine = flight.arrTime ? `ETA:${flight.arrTime}` : "";
  const airlineLine = flight.lines?.airline || flight.air || flight.airCode || flight.airline || "";
  const topLine = detailPhase === "location" && airlineLine ? airlineLine : flight.flt || flight.flight || flight.cs || flight.callsign || "";
  const secondLine = detailPhase === "location" && etaLine ? etaLine : route || airlineLine || "";
  const thirdLine = flight.ac || flight.aircraft || flight.reg || "";

  drawTickerLineBoxed(ctx, topLine, 50, 5, colors.airline, 75, config, phaseStartedAt, now);
  drawTickerLineBoxed(ctx, secondLine, 50, 19, colors.route, 75, config, phaseStartedAt, now);
  drawTickerLineBoxed(ctx, thirdLine, 50, 33, colors.aircraft, 75, config, phaseStartedAt, now);

  if (flight.followStatus) {
    const statusColor = flight.followStatus.color === "landed" ? "#00d46a" : config.device.timetableColors.header;
    drawTickerLine(ctx, flight.followStatus.text || "", 3, 47, statusColor, 122, config, tickerStartedAt, now);
    drawTickerLine(ctx, flight.followStatus.detail || "", 3, 56, statusColor, 122, config, tickerStartedAt, now);
    return;
  }

  if (detailPhase === "location") {
    drawLedText(ctx, flight.locationLabel || "Flying over", 3, 47, colors.context, 122);
    drawTickerLine(ctx, flight.locationValue || "Unknown area", 3, 56, colors.context, 122, config, tickerStartedAt, now);
    return;
  }

  const metrics = formatCompactMetrics(flight);
  const firstMetricLine = [
    metrics.altitude ? `ALT:${metrics.altitude}` : "",
    metrics.speed ? `SPD:${metrics.speed}` : ""
  ].filter(Boolean).join(" ");
  const secondMetricLine = [
    metrics.track ? `TRK:${metrics.track}` : "",
    metrics.verticalRate ? `VR:${metrics.verticalRate}` : ""
  ].filter(Boolean).join(" ");

  drawTickerLine(ctx, firstMetricLine || "NO LIVE METRICS", 3, 47, colors.context, 122, config, tickerStartedAt, now);
  drawTickerLine(ctx, secondMetricLine, 3, 56, colors.context, 122, config, tickerStartedAt, now);
}

function drawProgressValue(ctx: CanvasRenderingContext2D, progress: number, y: number, color: string, background: string) {
  const width = Math.max(0, Math.min(128, Math.floor(128 * progress)));
  ctx.fillStyle = background;
  ctx.fillRect(0, y, 128, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, y, width, 1);
}

function drawLiveFlightLayoutExact(ctx: CanvasRenderingContext2D, flight: DisplayFlight, config: Config, logo: HTMLImageElement | null | undefined, cycleStartedAt: number, tickerStartedAt: number, now: number, flightCount: number) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 128, 64);

  if (logo) {
    ctx.drawImage(logo, 3, 3, 42, 42);
  } else {
    drawPlaceholderLogo(ctx, 3, 3, 42);
  }

  if (flight.layout === "follow_cycle" || flight.layout === "follow_status") {
    if (!flight.followStatus && typeof flight.routeProgress === "number") {
      drawProgressValue(ctx, flight.routeProgress, 0, config.device.lineColors.routeProgress, "#3c3c3c");
    }
    drawFollowFlightTextExact(ctx, flight, config, cycleStartedAt, tickerStartedAt, now);
    return;
  }

  const airline = flight.lines?.airline || flight.air || flight.airCode || flight.airline || "";
  const route = flight.lines?.route || [flight.from || flight.origin, flight.to || flight.destination].filter(Boolean).join("-");
  const aircraft = flight.lines?.aircraft || flight.ac || flight.aircraft || flight.reg || "";
  const context = flight.lines?.context || [flight.ctxLabel || flight.contextLabel, flight.ctxValue || flight.contextValue].filter(Boolean).join(" ");
  drawFlightTextColumn(ctx, {
    airline,
    route: route || flight.flt || flight.flight || flight.cs || flight.callsign || "",
    aircraft,
    context
  }, config, tickerStartedAt, now);

  if (flightCount > 1) {
    const cycleMs = Math.max(2000, config.device.displayCycleSeconds * 1000);
    drawProgressValue(ctx, Math.min(1, Math.max(0, now - cycleStartedAt) / cycleMs), 63, config.device.lineColors.progress, "#07101c");
  }
}

function applyDisplayBrightness(ctx: CanvasRenderingContext2D, config: Config) {
  const calibratedPercent = 11 + (clamp(config.device.brightness, 1, 100) - 1) * (89 / 99);
  const brightnessPercent = calibratedPercent / 100;
  const brightness = 0.1 + 0.9 * Math.pow(brightnessPercent, 0.45);
  if (brightness >= 0.995) return;
  const imageData = ctx.getImageData(0, 0, 128, 64);
  const data = imageData.data;
  for (let index = 0; index < data.length; index += 4) {
    data[index] = Math.round(data[index] * brightness);
    data[index + 1] = Math.round(data[index + 1] * brightness);
    data[index + 2] = Math.round(data[index + 2] * brightness);
  }
  ctx.putImageData(imageData, 0, 0);
}

function makeFlightSignature(flight: DisplayFlight | undefined) {
  if (!flight) return "";
  return [
    flight.flight,
    flight.callsign,
    flight.cs,
    flight.flt,
    flight.logoUrl,
    flight.layout,
    flight.lines?.airline,
    flight.lines?.route,
    flight.lines?.aircraft,
    flight.followStatus?.text,
    flight.followStatus?.detail
  ].filter(Boolean).join("|");
}

function slideButton(active: boolean) {
  return {
    display: "flex",
    height: "36px",
    alignItems: "center",
    gap: "5px",
    whiteSpace: "nowrap" as const,
    borderRadius: "8px",
    border: active ? "1px solid var(--primary)" : "1px solid var(--primary)",
    background: active ? "var(--primary)" : "transparent",
    color: active ? "var(--primary-foreground)" : "var(--primary)",
    padding: "0 12px",
    fontSize: "14px",
    fontWeight: 500,
    textTransform: "uppercase" as const
  };
}

function cardStyle(padding = "14px") {
  return {
    borderRadius: "16px",
    border: "1px solid var(--border-soft)",
    background: "var(--card)",
    padding
  };
}

function panelLabelStyle() {
  return {
    display: "block",
    marginBottom: "8px",
    fontSize: "12px",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const
  };
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <label style={panelLabelStyle()}>{props.label}</label>
      {props.children}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        height: "42px",
        width: "100%",
        borderRadius: "8px",
        border: "1px solid var(--border-mid)",
        background: props.disabled ? "rgba(255, 255, 255, 0.48)" : "var(--card)",
        padding: "0 12px",
        fontSize: "16px",
        color: props.disabled ? "var(--muted-foreground)" : "var(--foreground)",
        opacity: props.disabled ? 0.72 : 1
      }}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        height: "42px",
        width: "100%",
        borderRadius: "8px",
        border: "1px solid var(--border-mid)",
        background: "var(--card)",
        padding: "0 12px",
        fontSize: "16px",
        color: "var(--foreground)"
      }}
    />
  );
}

function ToggleRow(props: { label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label style={{ ...cardStyle("12px 14px"), display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer" }}>
      <span style={{ minWidth: 0, flex: "1 1 auto" }}>
        <span style={{ display: "block", fontSize: "14px" }}>{props.label}</span>
        {props.hint ? <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.4 }}>{props.hint}</span> : null}
      </span>
      <span style={{ position: "relative", width: "46px", minWidth: "46px", flex: "0 0 46px", height: "28px", borderRadius: "999px", background: props.checked ? "var(--primary)" : "var(--secondary)", transition: "background 160ms ease" }}>
        <input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} style={{ position: "absolute", inset: 0, opacity: 0 }} />
        <span style={{ position: "absolute", top: "3px", left: props.checked ? "21px" : "3px", width: "22px", height: "22px", borderRadius: "999px", background: "#fff", transition: "left 160ms ease" }} />
      </span>
    </label>
  );
}

function SliderField(props: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; formatValue?: (value: number) => string; onChange: (value: number) => void }) {
  const range = props.max - props.min;
  const progress = range > 0 ? clamp(((props.value - props.min) / range) * 100, 0, 100) : 0;
  return (
    <div style={{ ...cardStyle("12px 14px"), display: "grid", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <label style={panelLabelStyle()}>{props.label}</label>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "13px" }}>
          {props.formatValue ? props.formatValue(props.value) : Math.round(props.value)}
          {props.suffix ?? ""}
        </span>
      </div>
      <input
        className="skyframe-range"
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
        style={{ background: `linear-gradient(90deg, var(--primary) 0%, var(--primary) ${progress}%, rgba(60, 36, 21, 0.18) ${progress}%, rgba(60, 36, 21, 0.18) 100%)` }}
      />
    </div>
  );
}

function Advanced(props: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={props.defaultOpen === true} style={cardStyle("0")}>
      <summary style={{ padding: "14px", cursor: "pointer", fontSize: "12px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>{props.title}</summary>
      <div style={{ display: "grid", gap: "12px", borderTop: "1px solid rgba(60, 36, 21, 0.1)", padding: "15px 14px 14px" }}>{props.children}</div>
    </details>
  );
}

function ColorPicker(props: { label: string; value: string; onChange: (value: string) => void }) {
  const value = props.value || "#ffffff";
  return (
    <label
      style={{
        ...cardStyle("10px 12px"),
        minHeight: "54px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "10px",
        alignItems: "center",
        cursor: "pointer"
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "13px", fontWeight: 650, letterSpacing: "-0.01em" }}>{props.label}</span>
        <span style={{ display: "block", marginTop: "4px", fontFamily: '"JetBrains Mono", monospace', fontSize: "11px", color: "var(--muted-foreground)" }}>
          {value.toUpperCase()}
        </span>
      </span>
      <span
        style={{
          position: "relative",
          width: "32px",
          height: "32px",
          borderRadius: "999px",
          background: value,
          border: "1px solid rgba(60, 36, 21, 0.2)",
          overflow: "hidden"
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(event) => props.onChange(event.target.value)}
          aria-label={props.label}
          style={{ position: "absolute", inset: "-8px", width: "48px", height: "48px", opacity: 0, cursor: "pointer" }}
        />
      </span>
    </label>
  );
}

function StatusPill(props: { label: string; tone: "good" | "idle" | "warn" | "error" }) {
  const palette = {
    good: { background: "rgba(0, 249, 0, 0.13)", color: "#145f1b", dot: "#00c92e" },
    idle: { background: "rgba(60, 36, 21, 0.08)", color: "var(--muted-foreground)", dot: "rgba(60, 36, 21, 0.34)" },
    warn: { background: "rgba(255, 147, 0, 0.14)", color: "#7a3f00", dot: "#ff9300" },
    error: { background: "rgba(255, 38, 0, 0.12)", color: "#8b1f12", dot: "#ff2600" }
  }[props.tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        minWidth: 0,
        borderRadius: "999px",
        background: palette.background,
        color: palette.color,
        padding: "7px 10px",
        fontSize: "12px",
        fontWeight: 650,
        whiteSpace: "nowrap"
      }}
    >
      <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: palette.dot, boxShadow: `0 0 0 3px ${palette.background}` }} />
      {props.label}
    </span>
  );
}

function DisplayModePicker(props: { value: DisplayBehaviorMode; onChange: (value: DisplayBehaviorMode) => void }) {
  return (
    <div style={{ display: "grid", gap: "10px" }}>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 750 }}>Display Mode</div>
        <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--muted-foreground)" }}>Choose how the display behaves.</div>
      </div>
      <div style={{ display: "grid", gap: "10px" }}>
        {displayModeOptions.map((option) => {
          const selected = props.value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => props.onChange(option.value)}
              style={{
                ...cardStyle("13px 14px"),
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "12px",
                alignItems: "start",
                textAlign: "left",
                border: selected ? "1px solid var(--primary)" : "1px solid var(--border-soft)",
                background: selected ? "rgba(247, 181, 0, 0.12)" : "var(--card)",
                color: "var(--foreground)",
                cursor: "pointer"
              }}
            >
              <span style={{ width: "18px", height: "18px", borderRadius: "999px", border: `2px solid ${selected ? "var(--primary)" : "rgba(60, 36, 21, 0.28)"}`, display: "grid", placeItems: "center", marginTop: "1px" }}>
                {selected ? <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "var(--primary)" }} /> : null}
              </span>
              <span>
                <span style={{ display: "block", fontSize: "14px", fontWeight: 750 }}>{option.title}</span>
                <span style={{ display: "block", marginTop: "4px", fontSize: "12px", lineHeight: 1.4, color: "var(--muted-foreground)" }}>{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DisplayStatusCard(props: { config: Config; screenState: ScreenState; preview: PreviewState; statusTone: "idle" | "dirty" | "error" | "success" }) {
  const mode = props.config.device.displayMode;
  const aircraftActive = props.preview.mode === "nearby" || props.preview.mode === "follow" || props.preview.flights.length > 0;
  const boardActive = mode === "airport_board" || (mode === "hybrid" && !aircraftActive);
  const statusTitle = !props.screenState.active
    ? "Screen Off"
    : mode === "clock"
      ? "Clock Active"
      : mode === "airspace"
        ? aircraftActive ? "Aircraft Nearby" : "Waiting for Aircraft"
        : mode === "hybrid"
          ? aircraftActive ? "Airspace Temporarily Active" : "Airport Board Active"
          : "Airport Board Active";
  const statusSubtext = props.screenState.active ? "Ready to display content." : "The display is currently turned off.";
  const signalTone = props.statusTone === "error" || props.preview.error ? "error" : props.preview.updatedAt ? "good" : "warn";
  const powerTone = props.screenState.active ? "good" : "idle";
  const liveSource = props.preview.liveSourceStatus;
  const liveSourceTone = liveSource?.ok === false ? "error" : liveSource ? "good" : "idle";
  const deviceStatus = props.preview.deviceStatus;
  const deviceFresh = isRecentTimestamp(deviceStatus?.updatedAt, 4 * 60 * 1000);
  const deviceTone = deviceStatus && deviceFresh ? deviceStatus.ok ? "good" : "error" : deviceStatus ? "warn" : "idle";
  const monitoringActive = airspaceMonitoringForMode(mode);
  return (
    <div style={{ ...cardStyle("16px"), display: "grid", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 750, letterSpacing: "-0.01em" }}>Screen Status</div>
          <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.45 }}>
            {statusSubtext}
          </div>
        </div>
        <StatusPill label={props.screenState.active ? "On" : "Off"} tone={powerTone} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <StatusPill label={statusTitle} tone={props.screenState.active ? "good" : "idle"} />
        <StatusPill label={monitoringActive ? "Monitoring Active" : "Airspace Monitoring Disabled"} tone={monitoringActive ? "good" : "idle"} />
        {boardActive ? <StatusPill label="Airport Board Active" tone="good" /> : null}
        {mode === "clock" ? <StatusPill label="Airport Board Disabled" tone="idle" /> : null}
        <StatusPill label={props.screenState.brightnessMode === "night" ? "Night Mode Active" : "Day Mode Active"} tone="good" />
        <StatusPill label={liveSource?.ok === false ? "Flight Data Unavailable" : "Flight Data Available"} tone={liveSourceTone} />
        <StatusPill label={deviceStatus && deviceFresh ? "Screen Connected" : "Screen Not Seen"} tone={deviceTone} />
        <StatusPill label={props.preview.updatedAt ? "Display Service Online" : "Display Service Waiting"} tone={signalTone} />
      </div>

      {props.preview.error ? <div style={{ borderRadius: "12px", background: "rgba(255, 38, 0, 0.08)", color: "#8b1f12", padding: "10px 12px", fontSize: "12px", lineHeight: 1.45 }}>{props.preview.error}</div> : null}
      {liveSource?.ok === false && liveSource.error ? <div style={{ borderRadius: "12px", background: "rgba(255, 38, 0, 0.08)", color: "#8b1f12", padding: "10px 12px", fontSize: "12px", lineHeight: 1.45 }}>{liveSource.error}</div> : null}

      <details style={{ ...cardStyle("0"), background: "rgba(255, 255, 255, 0.46)" }}>
        <summary style={{ padding: "12px 13px", cursor: "pointer", fontSize: "12px", fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase" }}>Advanced Diagnostics</summary>
        <div style={{ display: "grid", gap: "8px", borderTop: "1px solid rgba(60, 36, 21, 0.1)", padding: "12px 13px", fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.45 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span>Last payload</span>
          <span style={{ color: "var(--foreground)", fontFamily: '"JetBrains Mono", monospace' }}>{shortTime(props.preview.updatedAt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span>Last display heartbeat</span>
          <span style={{ color: "var(--foreground)", fontFamily: '"JetBrains Mono", monospace' }}>{shortTime(deviceStatus?.updatedAt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span>Wi-Fi</span>
          <span style={{ color: "var(--foreground)", textAlign: "right" }}>{deviceStatus?.wifi?.ssid || "Unknown"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span>Signal</span>
          <span style={{ color: "var(--foreground)", textAlign: "right" }}>{wifiSignalLabel(deviceStatus?.wifi?.rssi)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span>Last turned on</span>
          <span style={{ color: "var(--foreground)", fontFamily: '"JetBrains Mono", monospace' }}>{shortTime(props.screenState.lastActivatedAt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span>Last turned off</span>
          <span style={{ color: "var(--foreground)", fontFamily: '"JetBrains Mono", monospace' }}>{shortTime(props.screenState.lastDeactivatedAt)}</span>
        </div>
        </div>
      </details>
    </div>
  );
}

function MapPicker(props: { lat: number; lon: number; radiusKm: number; onChange: (lat: number, lon: number) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false }).setView([props.lat, props.lon], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);
    markerRef.current = L.circleMarker([props.lat, props.lon], {
      radius: 8,
      weight: 3,
      color: "#3c2415",
      fillColor: "#ffffff",
      fillOpacity: 1
    }).addTo(map);
    circleRef.current = L.circle([props.lat, props.lon], {
      radius: props.radiusKm * 1000,
      color: "#3c2415",
      weight: 1,
      fillColor: "#c1b4ac",
      fillOpacity: 0.22
    }).addTo(map);
    map.on("click", (event) => {
      props.onChange(event.latlng.lat, event.latlng.lng);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [props]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !circleRef.current) return;
    markerRef.current.setLatLng([props.lat, props.lon]);
    circleRef.current.setLatLng([props.lat, props.lon]);
    circleRef.current.setRadius(props.radiusKm * 1000);
  }, [props.lat, props.lon, props.radiusKm]);

  return <div ref={containerRef} style={{ height: "220px", overflow: "hidden", borderRadius: "15px", border: "1px solid rgba(60, 36, 21, 0.2)" }} />;
}

function EmulatorPreview(props: { config: Config; preview: PreviewState; screenState: ScreenState; soundEnabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoCacheRef = useRef<Map<string, HTMLImageElement | null>>(new Map());
  const [logoVersion, setLogoVersion] = useState(0);
  const [animationFrame, setAnimationFrame] = useState(0);
  const cycleStartedAtRef = useRef(0);
  const followPhaseStartedAtRef = useRef(0);
  const tickerStartedAtRef = useRef(0);
  const clockLastMinuteRef = useRef<number | null>(null);
  const clockFallingMinuteIndexRef = useRef<number | null>(null);
  const clockFallingStartedAtRef = useRef(0);
  const lastFlightSignatureRef = useRef("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const tickBufferRef = useRef<AudioBuffer | null>(null);
  const audioUnlockedRef = useRef(false);
  const runtimeSignature = useMemo(() => JSON.stringify({
    displayMode: props.config.device.displayMode,
    flights: props.preview.flights.map((flight) => makeFlightSignature(flight)),
    idleScreens: props.preview.idleScreens.map((screen) => `${screen.kind || ""}:${screen.title || ""}:${screen.rows?.map((row) => `${row.flightId || ""}/${row.airport || ""}/${row.time || ""}/${row.status || ""}/${row.gateMessage || ""}`).join(",") || ""}`)
  }), [props.config.device.displayMode, props.preview.flights, props.preview.idleScreens]);

  useEffect(() => {
    const now = performance.now();
    cycleStartedAtRef.current = now;
    followPhaseStartedAtRef.current = now;
    tickerStartedAtRef.current = now;
    clockLastMinuteRef.current = null;
    clockFallingMinuteIndexRef.current = null;
    clockFallingStartedAtRef.current = 0;
    lastFlightSignatureRef.current = "";
  }, [runtimeSignature]);

  async function ensureEmulatorAudioReady() {
    try {
      if (!audioContextRef.current) {
        const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
        const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
        if (!AudioContextCtor) return null;
        audioContextRef.current = new AudioContextCtor();
      }
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      if (!tickBufferRef.current) {
        tickBufferRef.current = buildEmulatorTickBuffer(audioContextRef.current);
      }
      audioUnlockedRef.current = true;
      return audioContextRef.current;
    } catch {
      return null;
    }
  }

  async function playEmulatorClockTick() {
    if (!audioUnlockedRef.current) return;
    const audioContext = await ensureEmulatorAudioReady();
    const tickBuffer = tickBufferRef.current;
    if (!audioContext || !tickBuffer) return;

    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    source.buffer = tickBuffer;
    gain.gain.value = clamp(props.config.device.clockTickVolumePercent, 0, 100) / 100;
    source.connect(gain);
    gain.connect(audioContext.destination);
    source.start();
  }

  useEffect(() => {
    const unlockAudio = () => {
      void ensureEmulatorAudioReady();
    };
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!props.screenState.active || !props.soundEnabled) return;
    if (props.config.device.displayMode !== "clock") return;
    if (!props.config.device.clockTickEnabled || props.config.device.clockTickVolumePercent <= 0) return;

    let timer = 0;
    const scheduleNextTick = () => {
      const now = Date.now();
      const delay = Math.max(20, 1000 - (now % 1000));
      timer = window.setTimeout(() => {
        void playEmulatorClockTick();
        scheduleNextTick();
      }, delay);
    };

    scheduleNextTick();
    return () => window.clearTimeout(timer);
  }, [props.config.device.clockTickEnabled, props.config.device.clockTickVolumePercent, props.config.device.displayMode, props.screenState.active, props.soundEnabled]);

  useEffect(() => {
    if (!props.screenState.active) return;
    let frame = 0;
    const tick = () => {
      setAnimationFrame((value) => (value + 1) % 1000000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [props.screenState.active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const panelWidth = 128;
    const panelHeight = 64;
    const renderCanvas = document.createElement("canvas");
    renderCanvas.width = panelWidth;
    renderCanvas.height = panelHeight;
    const renderCtx = renderCanvas.getContext("2d");
    if (!renderCtx) return;

    renderCtx.clearRect(0, 0, panelWidth, panelHeight);
    renderCtx.fillStyle = props.screenState.active ? "#000000" : "#111111";
    renderCtx.fillRect(0, 0, panelWidth, panelHeight);

    if (props.screenState.active) {
      const now = performance.now();
      if (!cycleStartedAtRef.current) cycleStartedAtRef.current = now;
      if (!followPhaseStartedAtRef.current) followPhaseStartedAtRef.current = now;
      if (!tickerStartedAtRef.current) tickerStartedAtRef.current = now;

      const flights = props.preview.flights;
      const flightCycleMs = Math.max(2000, props.config.device.displayCycleSeconds * 1000);
      const flightElapsed = Math.max(0, now - cycleStartedAtRef.current);
      const flightCycleNumber = Math.floor(flightElapsed / flightCycleMs);
      const activeFlight = flights.length ? flights[flightCycleNumber % flights.length] : undefined;
      const currentFlightCycleStartedAt = cycleStartedAtRef.current + flightCycleNumber * flightCycleMs;
      const flightSignature = makeFlightSignature(activeFlight);
      if (flightSignature !== lastFlightSignatureRef.current) {
        lastFlightSignatureRef.current = flightSignature;
        followPhaseStartedAtRef.current = now;
        tickerStartedAtRef.current = now;
      }

      const logoUrl = activeFlight?.logoUrl;
      const cachedLogo = logoUrl ? logoCacheRef.current.get(logoUrl) : undefined;
      if (logoUrl && cachedLogo === undefined) {
        const image = new Image();
        image.onload = () => {
          logoCacheRef.current.set(logoUrl, image);
          setLogoVersion((value) => value + 1);
        };
        image.onerror = () => {
          logoCacheRef.current.set(logoUrl, null);
          setLogoVersion((value) => value + 1);
        };
        image.src = logoUrl;
        logoCacheRef.current.set(logoUrl, null);
      }

      if (props.config.device.displayMode === "clock") {
        const time = getClockTimeParts(props.config.device.timezone);
        const completedMinutes = Math.max(0, Math.min(59, Number(time.minute)));
        if (clockLastMinuteRef.current === null) {
          clockLastMinuteRef.current = completedMinutes;
        } else if (completedMinutes !== clockLastMinuteRef.current) {
          if (completedMinutes > 0) {
            clockFallingMinuteIndexRef.current = completedMinutes - 1;
            clockFallingStartedAtRef.current = now;
          } else {
            clockFallingMinuteIndexRef.current = null;
            clockFallingStartedAtRef.current = 0;
          }
          clockLastMinuteRef.current = completedMinutes;
        }
        drawClockLayoutExact(renderCtx, props.config, clockFallingMinuteIndexRef.current, clockFallingStartedAtRef.current, now);
      } else if (activeFlight) {
        const isFollowLayout = activeFlight.layout === "follow_cycle" || activeFlight.layout === "follow_status";
        const detailCycleStartedAt = isFollowLayout ? followPhaseStartedAtRef.current : currentFlightCycleStartedAt;
        drawLiveFlightLayoutExact(renderCtx, activeFlight, props.config, logoUrl ? logoCacheRef.current.get(logoUrl) : undefined, detailCycleStartedAt, tickerStartedAtRef.current, now, flights.length);
      } else if (props.config.device.displayMode === "airspace") {
        drawLedText(renderCtx, "WAITING", 43, 23, "#f6b800", 48);
        drawLedText(renderCtx, "FOR AIRCRAFT", 27, 36, "#f4f7ff", 74);
      } else if (props.preview.idleScreens[0]?.rows?.length) {
        const idleScreens = props.preview.idleScreens;
        const { index: idleIndex, cycleStartedAt: idleCycleStartedAt } = getActiveIdleCycle(idleScreens, props.config, cycleStartedAtRef.current, now);
        const transition = getIdleTransition(idleScreens, idleIndex, props.config, idleCycleStartedAt, now);
        drawIdleLayoutExact(renderCtx, idleScreens[idleIndex], props.config, idleCycleStartedAt, now, 0, null, transition);
      } else {
        drawLedText(renderCtx, "NO DISPLAY DATA", 20, 27, "#f6b800", 88);
      }

      applyDisplayBrightness(renderCtx, props.config);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imageData = renderCtx.getImageData(0, 0, panelWidth, panelHeight).data;
    const pitchX = canvas.width / panelWidth;
    const pitchY = canvas.height / panelHeight;
    const radius = Math.min(pitchX, pitchY) * 0.27;

    for (let y = 0; y < panelHeight; y += 1) {
      for (let x = 0; x < panelWidth; x += 1) {
        const index = (y * panelWidth + x) * 4;
        const r = imageData[index];
        const g = imageData[index + 1];
        const b = imageData[index + 2];
        const a = imageData[index + 3] / 255;
        const cx = x * pitchX + pitchX / 2;
        const cy = y * pitchY + pitchY / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#070707";
        ctx.fill();

        if (a > 0 && (r > 0 || g > 0 || b > 0)) {
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [animationFrame, logoVersion, props.config, props.preview.flights, props.preview.idleScreens, props.screenState.active]);

  return (
    <div style={{ flexShrink: 0, marginBottom: "20px" }}>
      <div style={{ position: "relative", aspectRatio: "1209 / 686", width: "100%", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: "14.31%",
            top: "17.06%",
            width: "70.89%",
            height: "65.45%",
            zIndex: 0,
            display: "flex",
            alignItems: "center",
            background: "#000000",
            justifyContent: "center",
            overflow: "hidden"
          }}
        >
          <canvas
            ref={canvasRef}
            width={1280}
            height={640}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              aspectRatio: "2 / 1",
              background: "#000000"
            }}
          />
        </div>
        <img src={frameImage} alt="SKYFRAME LED frame" style={{ position: "absolute", inset: 0, zIndex: 1, width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    </div>
  );
}

function SkeletonBlock(props: { height: number; width?: string }) {
  return <div className="skeleton-block" style={{ height: `${props.height}px`, width: props.width ?? "100%" }} />;
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: "0 20px 168px", display: "grid", gap: "14px" }}>
      <SkeletonBlock height={16} width="44%" />
      <SkeletonBlock height={42} />
      <SkeletonBlock height={82} />
      <SkeletonBlock height={82} />
      <SkeletonBlock height={112} />
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [savedConfigSignature, setSavedConfigSignature] = useState(() => configSignature(defaultConfig));
  const [screenState, setScreenState] = useState<ScreenState>(defaultScreenState);
  const [soundState, setSoundState] = useState<SoundState>(defaultSoundState);
  const [preview, setPreview] = useState<PreviewState>({ meta: "", flights: [], idleScreens: [], avinorRows: [], mode: "idle", updatedAt: null, error: null, liveSourceStatus: null, deviceStatus: null });
  const [status, setStatus] = useState("Laster innstillinger...");
  const [statusTone, setStatusTone] = useState<"idle" | "dirty" | "error" | "success">("idle");
  const [activeSection, setActiveSection] = useState(0);
  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [emulatorSoundEnabled, setEmulatorSoundEnabled] = useState(true);
  const slidesRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const navDragRef = useRef({ active: false, pointerId: -1, x: 0, left: 0, moved: false, pressedIndex: -1 });
  const isDirty = configSignature(config) !== savedConfigSignature;

  useEffect(() => {
    let mounted = true;
    void Promise.allSettled([loadConfig(), loadPreview(), loadAvinor(), loadDeviceStatus()]).finally(() => {
      if (mounted) setInitialLoading(false);
    });
    const deviceStatusTimer = window.setInterval(() => {
      void loadDeviceStatus();
    }, 15000);
    return () => {
      mounted = false;
      window.clearInterval(deviceStatusTimer);
    };
  }, []);

  useEffect(() => {
    const node = slidesRef.current;
    if (!node) return;
    const handleScroll = () => {
      const slideIndex = Math.round(node.scrollLeft / node.clientWidth);
      setActiveSection(sectionIndexForSlide(slideIndex));
    };
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [initialLoading]);

  useEffect(() => {
    const node = slidesRef.current;
    if (!node) return;
    node.scrollLeft = slideIndexForSection(0) * node.clientWidth;
  }, [initialLoading]);

  function markDirty(message = "Endringer ikke lagret") {
    setStatus(message);
    setStatusTone("dirty");
  }

  async function loadConfig() {
    try {
      const response = await apiFetch<(Partial<Config> & { screenState?: ScreenState; soundState?: SoundState; deviceStatus?: DeviceStatus | null })>("/api/config");
      const nextConfig = normalizeConfig(response);
      setConfig(nextConfig);
      setSavedConfigSignature(configSignature(nextConfig));
      if (response.screenState) setScreenState(response.screenState);
      if (response.soundState) setSoundState(response.soundState);
      setPreview((current) => ({ ...current, deviceStatus: response.deviceStatus ?? current.deviceStatus }));
      setStatus("Settings loaded");
      setStatusTone("idle");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load settings");
      setStatusTone("error");
    }
  }

  async function loadPreview() {
    try {
      const data = await apiFetch<DisplayPayload>(`/api/display?ts=${Date.now()}`);
      setPreview({
        meta: data.updatedAt ? `Updated ${new Date(data.updatedAt).toLocaleTimeString("en-GB")}` : "Display data loaded",
        flights: Array.isArray(data.flights) ? data.flights : [],
        idleScreens: Array.isArray(data.idleScreens) ? data.idleScreens : [],
        avinorRows: preview.avinorRows,
        mode: data.mode || "idle",
        updatedAt: data.updatedAt ?? new Date().toISOString(),
        error: null,
        liveSourceStatus: data.liveSourceStatus ?? null,
        deviceStatus: data.deviceStatus ?? null
      });
      if (data.screenState) setScreenState(data.screenState);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load display data";
      setPreview((current) => ({ ...current, meta: message, error: message }));
    }
  }

  async function loadAvinor() {
    try {
      const data = await apiFetch<{ flights?: AvinorRawFlight[] }>(`/api/avinor-board?ts=${Date.now()}`);
      setPreview((current) => ({ ...current, avinorRows: Array.isArray(data.flights) ? data.flights : [] }));
    } catch {
      setPreview((current) => ({ ...current, avinorRows: [] }));
    }
  }

  async function loadDeviceStatus() {
    try {
      const data = await apiFetch<DeviceStatus | null>(`/api/device-status?ts=${Date.now()}`);
      setPreview((current) => ({ ...current, deviceStatus: data ?? null }));
    } catch {
      setPreview((current) => ({ ...current, deviceStatus: current.deviceStatus }));
    }
  }

  async function saveConfig() {
    setBusy(true);
    try {
      const saved = await apiFetch<Partial<Config> & { screenState?: ScreenState; soundState?: SoundState }>("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const nextConfig = normalizeConfig(saved);
      setConfig(nextConfig);
      setSavedConfigSignature(configSignature(nextConfig));
      if (saved.screenState) setScreenState(saved.screenState);
      if (saved.soundState) setSoundState(saved.soundState);
      setStatus(`Lagret ${new Date().toLocaleTimeString("nb-NO")}`);
      setStatusTone("success");
      await loadPreview();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save settings");
      setStatusTone("error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleScreen() {
    setBusy(true);
    try {
      const next = await apiFetch<ScreenState>("/api/admin/screen-state/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      setScreenState(next);
      setStatus(`Screen ${next.active ? "turned on" : "turned off"}`);
      setStatusTone("success");
      await loadPreview();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not change screen state");
      setStatusTone("error");
    } finally {
      setBusy(false);
    }
  }

  async function triggerSoundTest() {
    setBusy(true);
    try {
      const next = await apiFetch<SoundState>("/api/sound-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "mobile-react" })
      });
      setSoundState(next);
      setStatus("Sound test started");
      setStatusTone("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sound test failed");
      setStatusTone("error");
    } finally {
      setBusy(false);
    }
  }

  function updateConfig(recipe: (current: Config) => Config) {
    setConfig((current) => {
      const next = recipe(current);
      return next;
    });
    markDirty();
  }

  function activateSection(index: number) {
    slidesRef.current?.scrollTo({ left: slideIndexForSection(index) * (slidesRef.current?.clientWidth ?? 0), behavior: "auto" });
    setActiveSection(index);
  }

  const firmwareFresh = isRecentTimestamp(preview.deviceStatus?.updatedAt, 4 * 60 * 1000);
  const firmwareDotColor = preview.deviceStatus && firmwareFresh
    ? preview.deviceStatus.ok ? "#00f900" : "#ff2600"
    : preview.deviceStatus ? "#ff9300" : "rgba(60, 36, 21, 0.34)";

  return (
    <div style={appStyles.shell}>
      <header style={appStyles.header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <SkyframeLogo className="skyframe-logo" />
          <div style={{ position: "relative", paddingLeft: "13px" }}>
            <span
              title={preview.deviceStatus && firmwareFresh ? (preview.deviceStatus.ok ? "Screen connected" : "Screen error") : "Waiting for screen"}
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: firmwareDotColor,
                boxShadow: firmwareDotColor === "#00f900" ? "0 0 0 4px rgba(0, 249, 0, 0.14)" : "0 0 0 4px rgba(60, 36, 21, 0.08)",
                transform: "translateY(-50%)"
              }}
            />
          <button
            type="button"
            onClick={() => void toggleScreen()}
            disabled={busy}
            aria-label={screenState.active ? "Turn screen off" : "Turn screen on"}
            title={screenState.active ? "Screen is on" : "Screen is off"}
            style={{
              position: "relative",
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              border: "1px solid var(--primary)",
              background: screenState.active ? "var(--primary)" : "transparent",
              color: screenState.active ? "#fff" : "var(--primary)",
              boxShadow: screenState.active ? "0 10px 22px rgba(60, 36, 21, 0.18)" : "none",
              opacity: busy ? 0.64 : 1,
              transition: "background 160ms ease, box-shadow 160ms ease, opacity 160ms ease"
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1 }}>⏻</span>
          </button>
          </div>
        </div>
      </header>

      <EmulatorPreview config={config} preview={preview} screenState={screenState} soundEnabled={emulatorSoundEnabled} />

      <div
        ref={navRef}
        style={{ ...appStyles.navScroller, cursor: "grab", userSelect: "none" }}
        onPointerDown={(event) => {
          const container = navRef.current;
          if (!container) return;
          const button = (event.target as HTMLElement).closest("[data-section-index]");
          const pressedIndex = button ? Number((button as HTMLElement).dataset.sectionIndex ?? -1) : -1;
          navDragRef.current = { active: true, pointerId: event.pointerId, x: event.clientX, left: container.scrollLeft, moved: false, pressedIndex };
          container.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const container = navRef.current;
          const drag = navDragRef.current;
          if (!container || !drag.active) return;
          const dx = event.clientX - drag.x;
          if (Math.abs(dx) > 4) {
            drag.moved = true;
            container.scrollLeft = drag.left - dx;
          }
        }}
        onPointerUp={(event) => {
          const container = navRef.current;
          const drag = navDragRef.current;
          if (container && drag.pointerId === event.pointerId && container.hasPointerCapture(event.pointerId)) {
            container.releasePointerCapture(event.pointerId);
          }
          if (!drag.moved && drag.pressedIndex >= 0) {
            activateSection(drag.pressedIndex);
          }
          navDragRef.current = { active: false, pointerId: -1, x: 0, left: 0, moved: false, pressedIndex: -1 };
        }}
        onPointerCancel={() => {
          navDragRef.current = { active: false, pointerId: -1, x: 0, left: 0, moved: false, pressedIndex: -1 };
        }}
      >
        <div style={appStyles.navTrack}>
          {sections.map((section, index) => (
            <button
              data-section-index={index}
              key={section.id}
              type="button"
              onClick={() => {
                if (navDragRef.current.moved) return;
                activateSection(index);
              }}
              style={slideButton(index === activeSection)}
            >
              <section.icon className="section-icon" />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ minHeight: 0, flex: 1, overflow: "hidden" }}>
        {initialLoading ? (
          <LoadingSkeleton />
        ) : (
        <div ref={slidesRef} style={appStyles.slides}>
          <section style={slideStyle("location")}>
            <div style={{ display: "grid", gap: "14px" }}>
              <MapPicker
                lat={config.lat}
                lon={config.lon}
                radiusKm={config.radiusKm}
                onChange={(lat, lon) => updateConfig((current) => ({ ...current, lat: Number(lat.toFixed(6)), lon: Number(lon.toFixed(6)) }))}
              />
              <button
                type="button"
                onClick={() => navigator.geolocation?.getCurrentPosition((position) => updateConfig((current) => ({ ...current, lat: Number(position.coords.latitude.toFixed(6)), lon: Number(position.coords.longitude.toFixed(6)) })))}
                style={{ height: "42px", borderRadius: "8px", border: 0, background: "var(--primary)", color: "#fff", fontSize: "16px", textTransform: "uppercase" }}
              >
                Use my location
              </button>
              <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr" }}>
                <Field label="Latitude">
                  <TextInput value={config.lat} inputMode="decimal" onChange={(event) => updateConfig((current) => ({ ...current, lat: Number(event.target.value) || 0 }))} />
                </Field>
                <Field label="Longitude">
                  <TextInput value={config.lon} inputMode="decimal" onChange={(event) => updateConfig((current) => ({ ...current, lon: Number(event.target.value) || 0 }))} />
                </Field>
              </div>
              <Field label="Airport for timetable">
                <TextInput value={config.homeAirportIata} maxLength={4} onChange={(event) => updateConfig((current) => ({ ...current, homeAirportIata: event.target.value.toUpperCase() }))} />
              </Field>
              <Field label="Timezone">
                <TextInput value={config.device.timezone} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, timezone: event.target.value } }))} />
              </Field>
              <SliderField label="Radius" value={config.radiusKm} min={1} max={250} suffix=" km" onChange={(value) => updateConfig((current) => ({ ...current, radiusKm: value }))} />
            </div>
          </section>

          <section style={slideStyle("display")}>
            <div style={{ display: "grid", gap: "14px" }}>
              <DisplayModePicker
                value={config.device.displayMode}
                onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, displayMode: value, airspaceMonitoringEnabled: airspaceMonitoringForMode(value) } }))}
              />
              <SliderField label="Day brightness" value={config.device.brightness} min={1} max={100} suffix="%" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, brightness: value } }))} />
              <SliderField label="Night brightness" value={config.device.nightMode.brightness} min={0} max={100} suffix="%" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, nightMode: { ...current.device.nightMode, brightness: value } } }))} />
              <SliderField label="Config refresh" value={config.device.configRefreshSeconds} min={60} max={3600} step={30} suffix=" s" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, configRefreshSeconds: value } }))} />
              <DisplayStatusCard config={config} screenState={screenState} preview={preview} statusTone={statusTone} />
            </div>
          </section>

          <section style={slideStyle("clock")}>
            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
                <ColorPicker label="Clock top" value={config.device.clockTopColor} onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, clockTopColor: value } }))} />
                <ColorPicker label="Clock bottom" value={config.device.clockColor} onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, clockColor: value } }))} />
              </div>
              <ToggleRow label="Clock tick enabled" checked={config.device.clockTickEnabled} onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, clockTickEnabled: value } }))} />
              <SliderField label="Clock tick volume" value={config.device.clockTickVolumePercent} min={0} max={100} suffix="%" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, clockTickVolumePercent: value } }))} />
            </div>
          </section>

          <section style={slideStyle("aircraft")}>
            <div style={{ display: "grid", gap: "14px" }}>
              <SliderField label="Fetch interval" value={config.device.pollSeconds} min={30} max={900} step={5} suffix=" s" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, pollSeconds: value } }))} />
              <SliderField label="Audio volume" value={config.device.audioVolumePercent} min={0} max={100} suffix="%" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, audioVolumePercent: value } }))} />
              <button type="button" onClick={() => void triggerSoundTest()} style={{ height: "42px", borderRadius: "8px", border: "1px solid var(--border-mid)", background: "var(--card)", color: "var(--foreground)" }}>
                Test flight sound
              </button>
              <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Last sound test: {formatTimestamp(soundState.lastTriggeredAt)}</div>
              <div style={{ ...cardStyle(), display: "grid", gap: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer" }}>
                  <span style={{ minWidth: 0, flex: "1 1 auto" }}>
                    <span style={{ display: "block", fontSize: "14px" }}>Track flight numbers</span>
                    <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.4 }}>Tracked flights can activate Airspace mode.</span>
                  </span>
                  <span style={{ position: "relative", width: "46px", minWidth: "46px", flex: "0 0 46px", height: "28px", borderRadius: "999px", background: config.follow.enabled ? "var(--primary)" : "var(--secondary)", transition: "background 160ms ease" }}>
                    <input type="checkbox" checked={config.follow.enabled} onChange={(event) => updateConfig((current) => ({ ...current, follow: { ...current.follow, enabled: event.target.checked } }))} style={{ position: "absolute", inset: 0, opacity: 0 }} />
                    <span style={{ position: "absolute", top: "3px", left: config.follow.enabled ? "21px" : "3px", width: "22px", height: "22px", borderRadius: "999px", background: "#fff", transition: "left 160ms ease" }} />
                  </span>
                </label>
                <Field label="Flight numbers">
                  <TextInput
                    value={config.follow.flights.join(", ")}
                    disabled={!config.follow.enabled}
                    placeholder="SK4673, DY1304, DOC45"
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        follow: {
                          ...current.follow,
                          flights: event.target.value
                            .split(/[,\s]+/)
                            .map((value) => value.trim().toUpperCase())
                            .filter(Boolean)
                            .slice(0, 3)
                        }
                      }))
                    }
                  />
                </Field>
              </div>
              <Advanced title="Aircraft filters">
                <div style={{ display: "grid", gap: "10px" }}>
                  {Object.entries(categoryLabels).map(([code, info]) => {
                    const typedCode = code as AircraftCategoryCode;
                    const checked = config.device.allowedAircraftCategories.includes(typedCode);
                    return (
                      <label key={code} style={{ ...cardStyle("12px 14px"), display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px", alignItems: "start" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            updateConfig((current) => ({
                              ...current,
                              device: {
                                ...current.device,
                                allowedAircraftCategories: event.target.checked
                                  ? [...current.device.allowedAircraftCategories, typedCode]
                                  : current.device.allowedAircraftCategories.filter((value) => value !== typedCode)
                              }
                            }))
                          }
                        />
                        <span>
                          <span style={{ display: "block", fontSize: "14px" }}>
                            {code} {info.title}
                          </span>
                          <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--muted-foreground)" }}>{info.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Advanced>
              <Advanced title="Flight units and colors">
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Altitude">
                    <SelectInput value={config.device.followUnits.altitude} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, followUnits: { ...current.device.followUnits, altitude: event.target.value as Config["device"]["followUnits"]["altitude"] } } }))}>
                      <option value="ft">ft</option>
                      <option value="fl">FL</option>
                      <option value="m">m</option>
                      <option value="km">km</option>
                      <option value="nmi">nmi</option>
                    </SelectInput>
                  </Field>
                  <Field label="Speed">
                    <SelectInput value={config.device.followUnits.speed} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, followUnits: { ...current.device.followUnits, speed: event.target.value as Config["device"]["followUnits"]["speed"] } } }))}>
                      <option value="kn">kn</option>
                      <option value="mph">mph</option>
                      <option value="kmh">km/h</option>
                      <option value="ms">m/s</option>
                      <option value="mach">mach</option>
                    </SelectInput>
                  </Field>
                  <Field label="Track">
                    <SelectInput value={config.device.followUnits.track} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, followUnits: { ...current.device.followUnits, track: event.target.value as Config["device"]["followUnits"]["track"] } } }))}>
                      <option value="deg">degrees</option>
                      <option value="cardinal">cardinal</option>
                    </SelectInput>
                  </Field>
                  <Field label="Vertical rate">
                    <SelectInput value={config.device.followUnits.verticalRate} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, followUnits: { ...current.device.followUnits, verticalRate: event.target.value as Config["device"]["followUnits"]["verticalRate"] } } }))}>
                      <option value="fpm">fpm</option>
                      <option value="fts">ft/s</option>
                      <option value="ms">m/s</option>
                      <option value="mph">mph</option>
                      <option value="kmh">km/h</option>
                    </SelectInput>
                  </Field>
                </div>
                <SliderField label="Cycle seconds" value={config.device.displayCycleSeconds} min={2} max={30} suffix=" s" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, displayCycleSeconds: value } }))} />
                <SliderField label="Scroll speed" value={config.device.scrollPixelsPerSecond} min={2} max={30} suffix=" px/s" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, scrollPixelsPerSecond: value } }))} />
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
                  {Object.entries(config.device.lineColors).map(([key, value]) => (
                    <ColorPicker
                      key={key}
                      label={lineColorLabels[key as keyof Config["device"]["lineColors"]] ?? key}
                      value={value}
                      onChange={(nextValue) => updateConfig((current) => ({ ...current, device: { ...current.device, lineColors: { ...current.device.lineColors, [key]: nextValue } } }))}
                    />
                  ))}
                </div>
              </Advanced>
            </div>
          </section>

          <section style={slideStyle("timetable")}>
            <div style={{ display: "grid", gap: "14px" }}>
              <SliderField label="Hold each board page" value={config.device.timetableCycleSeconds} min={2} max={60} suffix=" s" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, timetableCycleSeconds: value } }))} />
              <SliderField label="Scroll speed" value={config.device.timetableScrollPixelsPerSecond} min={4} max={100} suffix=" px/s" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, timetableScrollPixelsPerSecond: value } }))} />
              <SliderField label="Page transition" value={config.device.timetableTransitionMs / 1000} min={0.2} max={1} step={0.1} suffix=" s" formatValue={(value) => value.toFixed(1)} onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, timetableTransitionMs: Math.round(value * 1000) } }))} />
              <SliderField label="Departures" value={config.device.departureTimetableItemCount} min={0} max={40} step={1} onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, departureTimetableItemCount: value, timetableItemCount: value } }))} />
              <SliderField label="Arrivals" value={config.device.arrivalTimetableItemCount} min={0} max={40} step={1} onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, arrivalTimetableItemCount: value } }))} />
              <SliderField label="Departures lookahead" value={config.device.departureAvinorWindowHours} min={1} max={24} suffix=" h" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, departureAvinorWindowHours: value, avinorWindowHours: value } }))} />
              <SliderField label="Arrivals lookahead" value={config.device.arrivalAvinorWindowHours} min={1} max={24} suffix=" h" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, arrivalAvinorWindowHours: value } }))} />
              <Advanced title="Airport Board colors">
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
                  {Object.entries(config.device.timetableColors).map(([key, value]) => (
                    <ColorPicker
                      key={key}
                      label={timetableColorLabels[key as keyof Config["device"]["timetableColors"]] ?? key}
                      value={value}
                      onChange={(nextValue) => updateConfig((current) => ({ ...current, device: { ...current.device, timetableColors: { ...current.device.timetableColors, [key]: nextValue } } }))}
                    />
                  ))}
                </div>
              </Advanced>
            </div>
          </section>

          <section style={slideStyle("api")}>
            <div style={{ display: "grid", gap: "14px" }}>
              <div style={cardStyle()}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>Display preview</div>
                <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--muted-foreground)" }}>{preview.meta || "No data loaded"}</div>
                <div style={{ marginTop: "12px" }}>
                  <ToggleRow label="Emulator sound" hint="Only controls sound in the browser preview." checked={emulatorSoundEnabled} onChange={setEmulatorSoundEnabled} />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button type="button" onClick={() => void loadPreview()} style={{ flex: 1, height: "40px", borderRadius: "8px", border: 0, background: "var(--primary)", color: "#fff" }}>
                    Refresh display
                  </button>
                  <button type="button" onClick={() => void loadAvinor()} style={{ flex: 1, height: "40px", borderRadius: "8px", border: "1px solid var(--border-mid)", background: "var(--card)", color: "var(--foreground)" }}>
                    Refresh airport data
                  </button>
                </div>
                <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.45 }}>
                  The preview uses the same content feed as the physical display.
                </div>
              </div>
              {preview.flights.length ? (
                preview.flights.slice(0, 4).map((flight, index) => (
                  <article key={`${flight.flight ?? flight.callsign ?? "flight"}-${index}`} style={cardStyle()}>
                    <div style={{ fontSize: "15px", fontWeight: 600 }}>{flight.flight || flight.callsign || "Flight"}</div>
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--muted-foreground)" }}>
                      {[flight.origin, flight.destination].filter(Boolean).join(" → ")}
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted-foreground)" }}>
                      {[flight.airline, flight.aircraft, flight.displayTime].filter(Boolean).join(" · ")}
                    </div>
                  </article>
                ))
              ) : preview.idleScreens.length ? (
                preview.idleScreens.map((screen, index) => (
                  <article key={`${screen.title ?? "idle"}-${index}`} style={cardStyle()}>
                    <div style={{ fontSize: "15px", fontWeight: 600 }}>{screen.title || "Idle board"}</div>
                    <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                      {(screen.rows ?? []).slice(0, 4).map(formatIdleRowForPreview).join("\n")}
                    </div>
                  </article>
                ))
              ) : (
                <div style={{ ...cardStyle(), color: "var(--muted-foreground)", fontSize: "13px" }}>No aircraft nearby right now.</div>
              )}

              <Advanced title="API links">
                <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" }}>
                  {[
                    "/api/config",
                    "/api/device-config",
                    "/api/logo-status",
                    "/api/screen-state",
                    "/api/display-mode",
                    "/api/brightness-mode",
                    "/api/sound-test",
                    "/api/flights",
                    "/api/display",
                    "/pixel-editor",
                    "/api/avinor-board"
                  ].map((href) => (
                    <a key={href} href={href} target="_blank" rel="noreferrer" style={{ ...cardStyle("10px 12px"), textDecoration: "none", fontSize: "12px" }}>
                      {href.replace("/api/", "")}
                    </a>
                  ))}
                </div>
              </Advanced>

              {preview.avinorRows.length ? (
                <Advanced title="Airport data preview">
                  <div style={{ display: "grid", gap: "10px" }}>
                    {preview.avinorRows.slice(0, 6).map((row, index) => (
                      <div key={`${row.resolved?.flightId ?? "row"}-${index}`} style={cardStyle("10px 12px")}>
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>{row.resolved?.flightId || "Flight"}</div>
                        <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--muted-foreground)" }}>
                          {[row.direction === "A" ? "Arrival" : "Departure", row.resolved?.airportName, row.resolved?.displayTime, row.resolved?.status].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </Advanced>
              ) : null}
            </div>
          </section>
        </div>
        )}
      </main>

      <div style={appStyles.saveDock}>
        <button
          type="button"
          onClick={() => void saveConfig()}
          disabled={busy || !isDirty}
          style={{
            width: "100%",
            height: "52px",
            borderRadius: "16px",
            border: 0,
            background: isDirty ? "var(--primary)" : "rgba(60, 36, 21, 0.12)",
            color: isDirty ? "#fff" : "rgba(60, 36, 21, 0.44)",
            fontSize: "16px",
            fontWeight: 600,
            boxShadow: isDirty ? "0 18px 30px rgba(60, 36, 21, 0.22)" : "none",
            pointerEvents: "auto",
            position: "relative" as const,
            zIndex: 1,
            cursor: busy || !isDirty ? "not-allowed" : "pointer",
            transition: "background 160ms ease, color 160ms ease, box-shadow 160ms ease"
          }}
        >
          {busy ? "Saving..." : "Save settings"}
        </button>
        <div
          style={{
            marginTop: "10px",
            textAlign: "center",
            fontSize: "12px",
            color: statusTone === "error" ? "#9d3a23" : statusTone === "success" ? "#214b25" : "var(--muted-foreground)",
            pointerEvents: "auto",
            position: "relative" as const,
            zIndex: 1
          }}
        >
          {status}
        </div>
      </div>
    </div>
  );
}
