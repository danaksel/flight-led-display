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
const inputDir = path.resolve(repoDir, args.input || "assets/airline-logos/r2-source");
const outputDir = path.resolve(repoDir, args.output || "assets/airline-logos/rgb565");

await fs.mkdir(outputDir, { recursive: true });

const entries = await fs.readdir(inputDir, { withFileTypes: true });
const pngFiles = entries
  .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

if (!pngFiles.length) {
  console.error(`No PNG logos found in ${inputDir}`);
  process.exit(1);
}

let converted = 0;

for (const filename of pngFiles) {
  const inputPath = path.join(inputDir, filename);
  const code = path.basename(filename, path.extname(filename)).toUpperCase();
  const outputPath = path.join(outputDir, `${code}.rgb565`);

  const { data, info } = await sharp(inputPath)
    .resize(WIDTH, HEIGHT, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    // Transparent pixels must become black on the LED panel.
    .flatten({ background: "#000000" })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== WIDTH || info.height !== HEIGHT || info.channels !== 3) {
    throw new Error(`${filename}: expected ${WIDTH}x${HEIGHT} RGB, got ${info.width}x${info.height} with ${info.channels} channels`);
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

  if (out.length !== EXPECTED_BYTES) {
    throw new Error(`${filename}: expected ${EXPECTED_BYTES} bytes, got ${out.length}`);
  }

  await fs.writeFile(outputPath, out);
  converted += 1;
  console.log(`${filename} -> ${path.relative(repoDir, outputPath)} (${out.length} bytes)`);
}

console.log(`Converted ${converted} logos to ${WIDTH}x${HEIGHT} RGB565 little-endian.`);

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input" || arg === "-i") {
      parsed.input = argv[i + 1];
      i += 1;
    } else if (arg === "--output" || arg === "-o") {
      parsed.output = argv[i + 1];
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/convert-logos-rgb565.mjs --input <png-dir> --output <rgb565-dir>");
      console.log("Defaults: --input assets/airline-logos/r2-source --output assets/airline-logos/rgb565");
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return parsed;
}
