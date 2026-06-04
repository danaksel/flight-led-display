import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import frameImage from "./assets/led-frame.png";
import { IconApi, IconDisplay, IconMapPin, IconPlane, IconTimetable, SkyframeLogo } from "./components/Icons";

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
    displayMode: "flight" | "clock";
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
    clockTopColor: string;
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
  volumePercent?: number;
};

type DisplayFlight = {
  flight?: string;
  callsign?: string;
  airline?: string;
  airlineCode?: string;
  aircraft?: string;
  origin?: string;
  destination?: string;
  displayTime?: string;
  contextLabel?: string;
  contextValue?: string;
  locationLabel?: string;
  locationValue?: string;
  gateMessage?: string;
  status?: string;
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

type PreviewState = {
  meta: string;
  flights: DisplayFlight[];
  idleScreens: IdleScreen[];
  avinorRows: AvinorRawFlight[];
  mode: string;
};

type SectionId = "location" | "display" | "aircraft" | "timetable" | "api";

type Section = {
  id: SectionId;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
};

const sections: Section[] = [
  { id: "location", label: "LOCATION", icon: IconMapPin },
  { id: "display", label: "DISPLAY", icon: IconDisplay },
  { id: "aircraft", label: "AIRCRAFT", icon: IconPlane },
  { id: "timetable", label: "TIME TABLE", icon: IconTimetable },
  { id: "api", label: "API DATA", icon: IconApi }
];

const defaultAircraftCategories: AircraftCategoryCode[] = ["P", "C", "M", "J", "H", "B", "G", "D", "V", "O", "N"];

const categoryLabels: Record<AircraftCategoryCode, { title: string; description: string }> = {
  P: { title: "Passenger", description: "Kommersielle passasjerfly" },
  C: { title: "Cargo", description: "Rene fraktfly" },
  M: { title: "Military", description: "Militaer eller offentlig operator" },
  J: { title: "Business jets", description: "Store private jetfly" },
  T: { title: "General aviation", description: "Privat, ambulanse, skole og survey" },
  H: { title: "Helicopters", description: "Helikoptre" },
  B: { title: "Lighter than air", description: "Luftskip og lignende" },
  G: { title: "Gliders", description: "Seilfly" },
  D: { title: "Drones", description: "UAV og droner" },
  V: { title: "Ground vehicles", description: "Kjoeretoey med transponder" },
  O: { title: "Other", description: "Alt som ikke passer andre steder" },
  N: { title: "Non categorized", description: "Ikke kategorisert i FR24" }
};

const defaultConfig: Config = {
  lat: 59.9139,
  lon: 10.7522,
  radiusKm: 10,
  homeAirportIata: "OSL",
  label: "",
  follow: { enabled: false, flights: [] },
  device: {
    enabled: true,
    displayMode: "flight",
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
    avinorWindowHours: 4,
    timetableScrollPixelsPerSecond: 18,
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
      canceled: "#ff3b30"
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

const appStyles = {
  shell: {
    position: "relative",
    margin: "0 auto",
    display: "flex",
    height: "100vh",
    width: "100%",
    maxWidth: "393px",
    flexDirection: "column" as const,
    overflow: "hidden",
    background: "var(--background)",
    color: "var(--foreground)",
    boxShadow: "var(--shadow)"
  },
  header: {
    flexShrink: 0,
    background: "var(--secondary)",
    padding: "16px 20px"
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
    overflowX: "auto" as const,
    scrollSnapType: "x mandatory" as const,
    scrollbarWidth: "none" as const,
    scrollBehavior: "smooth" as const
  },
  slide: {
    minWidth: "100%",
    flex: "0 0 100%",
    overflowY: "auto" as const,
    padding: "0 20px 112px"
  }
};

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
      displayMode: device.displayMode === "clock" ? "clock" : "flight",
      airspaceMonitoringEnabled: device.airspaceMonitoringEnabled !== false,
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
      avinorWindowHours: Number(device.avinorWindowHours ?? defaultConfig.device.avinorWindowHours),
      timetableScrollPixelsPerSecond: Number(device.timetableScrollPixelsPerSecond ?? defaultConfig.device.timetableScrollPixelsPerSecond),
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
        canceled: timetableColors.canceled ?? defaultConfig.device.timetableColors.canceled
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
    throw new Error(typeof json === "object" && json && "error" in json ? String(json.error) : "API-feil");
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
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
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
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3 ? normalized.split("").map((value) => value + value).join("") : normalized;
  const value = Number.parseInt(expanded, 16);
  if (!Number.isFinite(value)) return [255, 255, 255];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
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

function drawIdleRowExact(ctx: CanvasRenderingContext2D, kind: string | undefined, row: IdleRow, x: number, y: number, colors: Config["device"]["timetableColors"]) {
  const status = row.status || "scheduled";
  if (status === "empty" || row.message) {
    const parts = String(row.message || row.flightId || "").split("|");
    drawLedText(ctx, parts[0] || "", x, y, colors.data, 122);
    if (parts[1]) drawLedText(ctx, parts[1], x, y + 11, colors.data, 122);
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

  drawLedText(ctx, row.flightId || "", x, y, rowColor, 43);
  drawLedText(ctx, airportText, x + 48, y, rowColor, 24);
  drawLedTextRight(ctx, timeText, 125, y, activeTimeColor, 60);

  if (status === "canceled") {
    ctx.fillStyle = colors.canceled;
    ctx.fillRect(x, y + 3, 122, 1);
  }
}

function drawIdleLayoutExact(ctx: CanvasRenderingContext2D, screen: IdleScreen | undefined, config: Config) {
  const colors = config.device.timetableColors;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 128, 64);

  if (!screen) {
    drawLedText(ctx, "No flights", 3, 9, colors.header, 122);
    drawLedText(ctx, "No airport data", 3, 23, colors.data, 122);
    return;
  }

  drawLedText(ctx, screen.title || "AIRPORT", 3, 3, colors.header, 86);
  drawLocalClock(ctx, 125, 3, colors.time, config.device.timezone);
  ctx.fillStyle = colors.header;
  ctx.fillRect(3, 14, 122, 1);

  const rows = Array.isArray(screen.rows) ? screen.rows.slice(0, 4) : [];
  if (!rows.length) {
    drawLedText(ctx, "No airport data", 3, 28, colors.data, 122);
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 15, 128, 49);
  ctx.clip();
  rows.forEach((row, index) => drawIdleRowExact(ctx, screen.kind, row, 3, 20 + index * 11, colors));
  ctx.restore();
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
        background: "var(--card)",
        padding: "0 12px",
        fontSize: "16px",
        color: "var(--foreground)"
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

function SliderField(props: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <div style={{ ...cardStyle("12px 14px"), display: "grid", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <label style={panelLabelStyle()}>{props.label}</label>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "13px" }}>
          {Math.round(props.value)}
          {props.suffix ?? ""}
        </span>
      </div>
      <input type="range" min={props.min} max={props.max} step={props.step ?? 1} value={props.value} onChange={(event) => props.onChange(Number(event.target.value))} />
    </div>
  );
}

function Advanced(props: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={props.defaultOpen === true} style={cardStyle("0")}>
      <summary style={{ padding: "14px", cursor: "pointer", fontSize: "12px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>{props.title}</summary>
      <div style={{ display: "grid", gap: "12px", borderTop: "1px solid rgba(60, 36, 21, 0.1)", padding: "0 14px 14px" }}>{props.children}</div>
    </details>
  );
}

function ColorInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="color" style={{ width: "100%", height: "42px", borderRadius: "8px", border: "1px solid var(--border-mid)", background: "var(--card)", padding: "4px" }} />;
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

function EmulatorPreview(props: { config: Config; preview: PreviewState; screenState: ScreenState }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeFlight = props.preview.flights[0];
  const timeNow = new Intl.DateTimeFormat("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: props.config.device.timezone || "Europe/Oslo"
  }).format(new Date());

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
      if (props.config.device.displayMode === "clock") {
        const top = props.config.device.clockTopColor;
        const bottom = props.config.device.clockColor;
        drawLedText(renderCtx, "CLOCK MODE", 23, 10, top, 82);
        drawLedText(renderCtx, timeNow, 34, 30, bottom, 60);
      } else if (activeFlight) {
        drawLedText(renderCtx, `${activeFlight.flight || activeFlight.callsign || "FLIGHT"} ${activeFlight.destination || ""} ${activeFlight.displayTime || ""}`, 3, 6, props.config.device.lineColors.route, 122);
        drawLedText(renderCtx, `${activeFlight.airline || "LIVE"} ${activeFlight.aircraft || ""}`, 3, 21, props.config.device.lineColors.aircraft, 122);
        drawLedText(renderCtx, `${activeFlight.contextLabel ? `${activeFlight.contextLabel} ` : ""}${activeFlight.contextValue || activeFlight.locationValue || activeFlight.status || "MONITORING ACTIVE"}`, 3, 36, props.config.device.lineColors.context, 122);
      } else if (props.preview.idleScreens[0]?.rows?.length) {
        drawIdleLayoutExact(renderCtx, props.preview.idleScreens[0], props.config);
      } else {
        drawLedText(renderCtx, "NO DISPLAY DATA", 20, 27, "#f6b800", 88);
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imageData = renderCtx.getImageData(0, 0, panelWidth, panelHeight).data;
    const pitchX = canvas.width / panelWidth;
    const pitchY = canvas.height / panelHeight;
    const radius = Math.min(pitchX, pitchY) * 0.24;

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
  }, [activeFlight, props.config, props.preview.idleScreens, props.screenState.active, timeNow]);

  return (
    <div style={{ flexShrink: 0, marginBottom: "20px" }}>
      <div style={{ position: "relative", aspectRatio: "1536 / 1024", width: "100%", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: "22.92%",
            top: "27.83%",
            width: "55.79%",
            height: "43.85%",
            zIndex: 0,
            display: "flex",
            alignItems: "center",
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

export default function App() {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [screenState, setScreenState] = useState<ScreenState>(defaultScreenState);
  const [soundState, setSoundState] = useState<SoundState>(defaultSoundState);
  const [preview, setPreview] = useState<PreviewState>({ meta: "", flights: [], idleScreens: [], avinorRows: [], mode: "idle" });
  const [status, setStatus] = useState("Laster innstillinger...");
  const [statusTone, setStatusTone] = useState<"idle" | "dirty" | "error" | "success">("idle");
  const [activeSection, setActiveSection] = useState(0);
  const [busy, setBusy] = useState(false);
  const slidesRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const navDragRef = useRef({ active: false, pointerId: -1, x: 0, left: 0, moved: false, pressedIndex: -1 });

  useEffect(() => {
    void loadConfig();
    void loadPreview();
    void loadAvinor();
  }, []);

  useEffect(() => {
    const node = slidesRef.current;
    if (!node) return;
    const handleScroll = () => {
      const index = Math.round(node.scrollLeft / node.clientWidth);
      setActiveSection(clamp(index, 0, sections.length - 1));
    };
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, []);

  function markDirty(message = "Endringer ikke lagret") {
    setStatus(message);
    setStatusTone("dirty");
  }

  async function loadConfig() {
    try {
      const response = await apiFetch<(Partial<Config> & { screenState?: ScreenState; soundState?: SoundState })>("/api/config");
      const nextConfig = normalizeConfig(response);
      setConfig(nextConfig);
      if (response.screenState) setScreenState(response.screenState);
      if (response.soundState) setSoundState(response.soundState);
      setStatus("Innstillinger lastet");
      setStatusTone("idle");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kunne ikke hente config");
      setStatusTone("error");
    }
  }

  async function loadPreview() {
    try {
      const data = await apiFetch<DisplayPayload>(`/api/display?ts=${Date.now()}`);
      setPreview({
        meta: data.updatedAt ? `Oppdatert ${new Date(data.updatedAt).toLocaleTimeString("nb-NO")}` : "Display-data lastet",
        flights: Array.isArray(data.flights) ? data.flights : [],
        idleScreens: Array.isArray(data.idleScreens) ? data.idleScreens : [],
        avinorRows: preview.avinorRows,
        mode: data.mode || "idle"
      });
      if (data.screenState) setScreenState(data.screenState);
    } catch (error) {
      setPreview((current) => ({ ...current, meta: error instanceof Error ? error.message : "Kunne ikke hente display-data" }));
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

  async function saveConfig() {
    setBusy(true);
    try {
      const saved = await apiFetch<Partial<Config> & { screenState?: ScreenState; soundState?: SoundState }>("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      setConfig(normalizeConfig(saved));
      if (saved.screenState) setScreenState(saved.screenState);
      if (saved.soundState) setSoundState(saved.soundState);
      setStatus(`Lagret ${new Date().toLocaleTimeString("nb-NO")}`);
      setStatusTone("success");
      await loadPreview();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kunne ikke lagre");
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
      setStatus(`Skjerm ${next.active ? "aktivert" : "deaktivert"}`);
      setStatusTone("success");
      await loadPreview();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kunne ikke endre skjermstatus");
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
      setStatus("Lydtest trigget");
      setStatusTone("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Lydtest feilet");
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
    slidesRef.current?.scrollTo({ left: index * (slidesRef.current?.clientWidth ?? 0), behavior: "smooth" });
    setActiveSection(index);
  }

  const screenSummary = useMemo(() => {
    const brightnessMode = screenState.brightnessMode === "night" ? "natt" : "dag";
    const active = screenState.active ? "på" : "av";
    return `Skjermstatus: ${active} · modus: ${config.device.displayMode} · lysmodus: ${brightnessMode}`;
  }, [config.device.displayMode, screenState]);

  return (
    <div style={appStyles.shell}>
      <header style={appStyles.header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <SkyframeLogo className="skyframe-logo" />
          <button
            type="button"
            onClick={() => void toggleScreen()}
            disabled={busy}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              border: "0",
              background: screenState.active ? "var(--primary)" : "var(--muted)",
              color: screenState.active ? "#fff" : "var(--muted-foreground)"
            }}
          >
            ⏻
          </button>
        </div>
      </header>

      <EmulatorPreview config={config} preview={preview} screenState={screenState} />

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
        <div ref={slidesRef} style={appStyles.slides}>
          <section style={appStyles.slide}>
            <div style={{ display: "grid", gap: "14px" }}>
              <Field label="Name of location">
                <TextInput value={config.label} onChange={(event) => updateConfig((current) => ({ ...current, label: event.target.value }))} />
              </Field>
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
              <Advanced title="Location settings">
                <Field label="Airport for timetable">
                  <TextInput value={config.homeAirportIata} maxLength={4} onChange={(event) => updateConfig((current) => ({ ...current, homeAirportIata: event.target.value.toUpperCase() }))} />
                </Field>
                <Field label="Timezone">
                  <TextInput value={config.device.timezone} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, timezone: event.target.value } }))} />
                </Field>
                <SliderField label="Radius" value={config.radiusKm} min={1} max={250} suffix=" km" onChange={(value) => updateConfig((current) => ({ ...current, radiusKm: value }))} />
              </Advanced>
            </div>
          </section>

          <section style={appStyles.slide}>
            <div style={{ display: "grid", gap: "14px" }}>
              <div style={cardStyle()}>
                <div style={{ fontSize: "14px", lineHeight: 1.45 }}>{screenSummary}</div>
                <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.45 }}>
                  Sist aktivert: {formatTimestamp(screenState.lastActivatedAt)}
                  <br />
                  Sist deaktivert: {formatTimestamp(screenState.lastDeactivatedAt)}
                  <br />
                  Sist byttet lysmodus: {formatTimestamp(screenState.lastBrightnessModeChangedAt)}
                </div>
              </div>
              <Field label="Display mode">
                <SelectInput value={config.device.displayMode} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, displayMode: event.target.value as "flight" | "clock" } }))}>
                  <option value="flight">Flight display</option>
                  <option value="clock">Clock</option>
                </SelectInput>
              </Field>
              <SliderField label="Audio volume" value={config.device.audioVolumePercent} min={0} max={100} suffix="%" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, audioVolumePercent: value } }))} />
              <button type="button" onClick={() => void triggerSoundTest()} style={{ height: "42px", borderRadius: "8px", border: "1px solid var(--border-mid)", background: "var(--card)", color: "var(--foreground)" }}>
                Test lyd nå
              </button>
              <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Lydtest: {formatTimestamp(soundState.lastTriggeredAt)}</div>
              <SliderField label="Brightness day" value={config.device.brightness} min={1} max={100} suffix="%" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, brightness: value } }))} />
              <SliderField label="Fetch interval" value={config.device.pollSeconds} min={30} max={900} step={5} suffix=" s" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, pollSeconds: value } }))} />
              <Advanced title="Clock and night mode">
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Clock top">
                    <ColorInput value={config.device.clockTopColor} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, clockTopColor: event.target.value } }))} />
                  </Field>
                  <Field label="Clock bottom">
                    <ColorInput value={config.device.clockColor} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, clockColor: event.target.value } }))} />
                  </Field>
                </div>
                <ToggleRow label="Clock tick enabled" checked={config.device.clockTickEnabled} onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, clockTickEnabled: value } }))} />
                <SliderField label="Clock tick volume" value={config.device.clockTickVolumePercent} min={0} max={100} suffix="%" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, clockTickVolumePercent: value } }))} />
                <SliderField label="Night brightness" value={config.device.nightMode.brightness} min={0} max={100} suffix="%" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, nightMode: { ...current.device.nightMode, brightness: value } } }))} />
                <SliderField label="Config refresh" value={config.device.configRefreshSeconds} min={60} max={3600} step={30} suffix=" s" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, configRefreshSeconds: value } }))} />
              </Advanced>
            </div>
          </section>

          <section style={appStyles.slide}>
            <div style={{ display: "grid", gap: "14px" }}>
              <ToggleRow
                label="Overvåk luftrommet"
                hint="Når denne er av, henter Worker ikke live flydata. Tidstabell fra Avinor vises fortsatt."
                checked={config.device.airspaceMonitoringEnabled}
                onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, airspaceMonitoringEnabled: value } }))}
              />
              <ToggleRow label="Følg flightnummer" checked={config.follow.enabled} onChange={(value) => updateConfig((current) => ({ ...current, follow: { ...current.follow, enabled: value } }))} />
              <Field label="Flight numbers">
                <TextInput
                  value={config.follow.flights.join(", ")}
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
              <Advanced title="Flight filters">
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
                    <Field key={key} label={key}>
                      <ColorInput value={value} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, lineColors: { ...current.device.lineColors, [key]: event.target.value } } }))} />
                    </Field>
                  ))}
                </div>
              </Advanced>
            </div>
          </section>

          <section style={appStyles.slide}>
            <div style={{ display: "grid", gap: "14px" }}>
              <SliderField label="Hold each timetable page" value={config.device.timetableCycleSeconds} min={2} max={60} suffix=" s" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, timetableCycleSeconds: value } }))} />
              <SliderField label="Rullehastighet" value={config.device.timetableScrollPixelsPerSecond} min={4} max={40} suffix=" px/s" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, timetableScrollPixelsPerSecond: value } }))} />
              <SliderField label="Antall fly" value={config.device.timetableItemCount} min={4} max={40} step={4} onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, timetableItemCount: value } }))} />
              <SliderField label="Se fremover" value={config.device.avinorWindowHours} min={1} max={24} suffix=" t" onChange={(value) => updateConfig((current) => ({ ...current, device: { ...current.device, avinorWindowHours: value } }))} />
              <Advanced title="Timetable colors">
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
                  {Object.entries(config.device.timetableColors).map(([key, value]) => (
                    <Field key={key} label={key}>
                      <ColorInput value={value} onChange={(event) => updateConfig((current) => ({ ...current, device: { ...current.device, timetableColors: { ...current.device.timetableColors, [key]: event.target.value } } }))} />
                    </Field>
                  ))}
                </div>
              </Advanced>
            </div>
          </section>

          <section style={appStyles.slide}>
            <div style={{ display: "grid", gap: "14px" }}>
              <div style={cardStyle()}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>Display preview</div>
                <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--muted-foreground)" }}>{preview.meta || "Ingen data lastet"}</div>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button type="button" onClick={() => void loadPreview()} style={{ flex: 1, height: "40px", borderRadius: "8px", border: 0, background: "var(--primary)", color: "#fff" }}>
                    Hent data
                  </button>
                  <button type="button" onClick={() => void loadAvinor()} style={{ flex: 1, height: "40px", borderRadius: "8px", border: "1px solid var(--border-mid)", background: "var(--card)", color: "var(--foreground)" }}>
                    Hent Avinor
                  </button>
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
                <div style={{ ...cardStyle(), color: "var(--muted-foreground)", fontSize: "13px" }}>Ingen fly i valgt radius akkurat nå.</div>
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
                <Advanced title="Avinor raw preview">
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
      </main>

      <div style={{ position: "absolute", left: "20px", right: "20px", bottom: "20px", zIndex: 20 }}>
        <button
          type="button"
          onClick={() => void saveConfig()}
          disabled={busy}
          style={{
            width: "100%",
            height: "52px",
            borderRadius: "16px",
            border: 0,
            background: "var(--primary)",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            boxShadow: "0 18px 30px rgba(60, 36, 21, 0.22)"
          }}
        >
          {busy ? "Lagrer..." : "Save settings"}
        </button>
        <div
          style={{
            marginTop: "10px",
            textAlign: "center",
            fontSize: "12px",
            color: statusTone === "error" ? "#9d3a23" : statusTone === "success" ? "#214b25" : "var(--muted-foreground)"
          }}
        >
          {status}
        </div>
      </div>
    </div>
  );
}
