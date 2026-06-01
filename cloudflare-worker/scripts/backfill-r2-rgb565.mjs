import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const WIDTH = 42;
const HEIGHT = 42;
const EXPECTED_BYTES = WIDTH * HEIGHT * 2;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.resolve(scriptDir, "..");
const repoDir = path.resolve(workerDir, "..");

const args = parseArgs(process.argv.slice(2));
const baseUrl = (args.baseUrl || "https://flight-display-server.dan-aksel.workers.dev").replace(/\/+$/, "");
const outputRoot = path.resolve(workerDir, args.output || "tmp/r2-rgb565-backfill");
const pngDir = path.join(outputRoot, "png");
const rgb565Dir = path.join(outputRoot, "rgb565");

await fs.mkdir(pngDir, { recursive: true });
await fs.mkdir(rgb565Dir, { recursive: true });

const statusResponse = await fetch(`${baseUrl}/api/logo-status`);
if (!statusResponse.ok) {
  throw new Error(`Failed to fetch logo status: HTTP ${statusResponse.status}`);
}

const status = await statusResponse.json();
const missingCodes = Array.isArray(status.missingRgb565Codes)
  ? status.missingRgb565Codes.filter((code) => typeof code === "string" && code.trim())
  : [];

if (!missingCodes.length) {
  console.log("No missing RGB565 logos reported by R2.");
  process.exit(0);
}

const generated = [];

for (const code of missingCodes) {
  const normalizedCode = code.trim().toUpperCase();
  const pngUrl = `${baseUrl}/public/logos/${encodeURIComponent(normalizedCode)}.png`;
  const pngPath = path.join(pngDir, `${normalizedCode}.png`);
  const rgb565Path = path.join(rgb565Dir, `${normalizedCode}.rgb565`);

  const pngResponse = await fetch(pngUrl);
  if (!pngResponse.ok) {
    throw new Error(`Failed to fetch ${normalizedCode}.png from R2: HTTP ${pngResponse.status}`);
  }

  const pngBuffer = Buffer.from(await pngResponse.arrayBuffer());
  await fs.writeFile(pngPath, pngBuffer);

  const { data, info } = await sharp(pngBuffer)
    .resize(WIDTH, HEIGHT, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .flatten({ background: "#000000" })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== WIDTH || info.height !== HEIGHT || info.channels !== 3) {
    throw new Error(`${normalizedCode}.png: expected ${WIDTH}x${HEIGHT} RGB, got ${info.width}x${info.height} with ${info.channels} channels`);
  }

  const out = Buffer.alloc(EXPECTED_BYTES);
  for (let src = 0, dst = 0; src < data.length; src += 3, dst += 2) {
    const r = data[src];
    const g = data[src + 1];
    const b = data[src + 2];
    const rgb565 = ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3);
    out[dst] = rgb565 & 0xff;
    out[dst + 1] = (rgb565 >> 8) & 0xff;
  }

  await fs.writeFile(rgb565Path, out);
  generated.push(normalizedCode);
  console.log(`${normalizedCode}: fetched from R2 and wrote ${path.relative(repoDir, rgb565Path)}`);
}

await fs.writeFile(path.join(outputRoot, "manifest.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  baseUrl,
  count: generated.length,
  codes: generated
}, null, 2));

console.log(`Generated ${generated.length} RGB565 logos from R2 into ${path.relative(repoDir, rgb565Dir)}.`);

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base-url") {
      parsed.baseUrl = argv[i + 1];
      i += 1;
    } else if (arg === "--output" || arg === "-o") {
      parsed.output = argv[i + 1];
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/backfill-r2-rgb565.mjs [--base-url https://...] [--output tmp/r2-rgb565-backfill]");
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return parsed;
}
