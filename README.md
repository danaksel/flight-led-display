# Flight Display

Dette prosjektet bygger en egen flight-display-løsning for en 128x64 HUB75 RGB LED-matrise styrt av et Waveshare ESP32-S3-RGB-Matrix-kort.

Målet er at selve skjermen skal være enkel: den henter ferdig tilrettelagte data, innstillinger og logoer fra en Cloudflare Worker. Worker-delen håndterer FR24 API, caching, konfigurasjon, webinterface, logo-mapping og en emulator som viser hvordan innholdet vil se ut på den fysiske LED-skjermen.

## Status

- Cloudflare Worker med FR24-integrasjon
- Webinterface for posisjon, radius og skjerminnstillinger
- 128x64 LED-emulator med runde piksler og 42x42 logo-felt
- Fargekontroll per displaylinje, progressbar-farge, scrollhastighet og rotasjonstid per fly
- Nederste LED-rad som progressbar når flere fly roterer på skjermen
- Airline-logoer som lokale assets
- Permanent KV-cache for airline- og airport-oppslag
- Grunnstruktur for kommende ESP32-S3 HUB75-firmware

## Prosjektstruktur

```text
cloudflare-worker/   Worker API, webinterface, emulator og logo-assets
firmware-hub75/      Kommende firmware for Waveshare ESP32-S3-RGB-Matrix + HUB75
firmware-original/   Original TheFlightWall OSS-firmware som referanse
assets/              Logo-kilder og eksporterte 42x42 PNG-logoer
hardware/            Notater om skjerm, kort og hardwarevalg
```

## Cloudflare Worker

Worker-prosjektet ligger i `cloudflare-worker/`.

Viktige endepunkter:

- `/` - webinterface med kart, innstillinger, preview og LED-emulator
- `/api/config` - lagrer og henter posisjon/radius/skjerminnstillinger fra KV
- `/api/display` - kompakt payload til web-preview og etter hvert ESP32
- `/api/flights` - mer detaljert normalisert flight-respons
- `/logos/{CODE}.png` - lokale airline-logoer

Worker skal ikke hente FR24-data automatisk når nettsiden åpnes. Live-data hentes først når brukeren trykker "Hent data", slik at vi ikke brenner API-kreditter unødvendig.

## Lokal utvikling

```bash
cd cloudflare-worker
npm install
npm run dev
```

Legg lokal FR24-nøkkel i `cloudflare-worker/.dev.vars`. Den filen er ignorert av Git og skal ikke committes.

Eksempel:

```text
FR24_API_KEY=din_nokkel_her
```

## Deploy

```bash
cd cloudflare-worker
npm run deploy
```

FR24-nøkkelen bør ligge som Worker secret i Cloudflare:

```bash
npx wrangler secret put FR24_API_KEY
```

## Logoer

Arbeidsflyt for airline-logoer:

1. Legg råfiler i `assets/airline-logos/raw/`.
2. Eksporter ferdige logoer som 42x42 PNG til `assets/airline-logos/png-42/`.
3. Kopier/legg samme eksport i `cloudflare-worker/public/logos/` for web og device-payload.
4. Oppdater mapping i Worker-koden dersom flere airline-koder skal bruke samme logo.

Ukjente flyselskaper skal falle tilbake til `UNKNOWN.png`.

## Firmware

Ny firmware skal ligge i `firmware-hub75/`. Den skal etter hvert:

- hente `/api/device-config` for nattmodus, lysstyrke og polling
- hente `/api/display` for flydata og logo-referanser
- vise logoer og tekst på 128x64 HUB75-panelet
- rotere mellom flere fly uten ekstra API-kall
- bruke Worker-styrt rotasjonstid, scrollhastighet og tekstfarger

`firmware-original/` er beholdt som referanse til det opprinnelige TheFlightWall OSS-prosjektet, men dette prosjektet bruker en annen hardware- og dataarkitektur.

## Kreditering

Dette prosjektet er inspirert av og bygger videre på ideer fra TheFlightWall OSS, men repoet her er omstrukturert for Cloudflare Worker, FR24-data, HUB75-panel og egen logo-/display-pipeline.
