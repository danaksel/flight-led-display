# Flight LED Display

Egen flight-display-løsning for et 128 x 64 HUB75 RGB LED-panel styrt av Waveshare ESP32-S3-RGB-Matrix.

Prosjektet er bygget rundt ett hovedprinsipp: Cloudflare Worker skal gjøre mest mulig arbeid, mens ESP32-skjermen etter hvert skal være en enkel klient som henter ferdig renderbare data, innstillinger og logo-referanser.

## Arkitektur

```text
Cloudflare Worker
  - Adminside og 128 x 64 emulator
  - Konfigurasjon i KV
  - Valgbar livekilde: FR24 eller OpenSky Network
  - Avinor-oppslag for gratis avgangs-/ankomsttavle
  - R2-logoer via /logos/{CODE}.png
  - Ferdig device-payload via /api/display

ESP32-S3 + HUB75
  - Henter /api/device-config
  - Henter /api/display etter polling-intervall
  - Henter logoer fra /logos/{CODE}.png
  - Tegner payloaden uten egen API-logikk mot FR24/OpenSky/Avinor
```

## Prosjektstruktur

```text
cloudflare-worker/   Worker API, webinterface, emulator og Cloudflare config
firmware-hub75/      Kommende firmware for Waveshare ESP32-S3-RGB-Matrix + HUB75
firmware-original/   Original TheFlightWall OSS-firmware som referanse
assets/              Lokale logo-kilder, eksportfiler og kandidatmapper
hardware/            Notater om skjerm, kort og hardwarevalg
```

## Dagens status

Ferdig nok for web/server-delen frem til fysisk skjerm kommer:

- Cloudflare Worker deployet som `flight-display-server.dan-aksel.workers.dev`
- Adminside med kart, posisjon, radius, flyplass, nattmodus og display-oppsett
- Tydelig bryter for `Overvåk luftrommet`, som styrer om Worker får lov til å bruke live flydata
- Valgbar livekilde: `Flightradar24` eller `OpenSky Network`
- 128 x 64 emulator med runde LED-piksler og 42 x 42 logo-felt
- Live flyvisning for fly i valgt radius
- Follow mode for flightnummer/callsign
- Follow-visning alternerer automatisk mellom live-målinger og `Flying over`
- Topprad som progressbar ved follow-flight, med grønn fremdrift og grå rest
- Idle-visning med Avinor departures/arrivals når live flydata er av eller ingen fly vises
- Rullende tidstabell med lokal klokke i header
- Gate-status på departures: `To gate`, `Boarding`, `Closing`, `Closed`
- Arrival-status kan vise `Landed`
- R2-basert logooppslag via `/logos/{CODE}.png`
- Fallback til `UNKNOWN.png` når logo mangler
- KV-cache for config, airline-navn, airport-navn, Avinor-data, live flydata og geokoding

## Viktige endepunkter

- `/`
  Adminside, kart, data-preview og LED-emulator.

- `/api/config`
  Leser og lagrer full konfigurasjon fra webpanelet.

- `/api/device-config`
  Lett konfigurasjon for fremtidig ESP32-firmware.

- `/api/display`
  Payload som emulatoren bruker, og som ESP32 skal bruke senere. Dette endepunktet kan bruke valgt livekilde dersom skjerm og luftromsovervåking er aktiv.

- `/api/avinor-board`
  Rutedata fra Avinor for valgt flyplass. Dette er gratis datakilde og brukes også til raw preview i web.

- `/logos/{CODE}.png`
  Server logo fra R2 for flyselskap. Faller tilbake til Worker assets og deretter eventuell ekstern logo-base hvis konfigurert.

## Livekilder og kredittkontroll

Prosjektet støtter to livekilder:

- `Flightradar24` - dagens mest komplette kilde for rute, aircraft, callsign og posisjon.
- `OpenSky Network` - samme posisjonskilde som originalprosjektet bruker for `states/all`.

OpenSky gir primært state vectors: callsign, posisjon, høyde, fart, track, vertical rate, origin country og on-ground. Den gir ikke like komplett rute-/airline-info alene. Derfor bruker vi fortsatt Avinor og egne R2-logoer som gratis berikelse rundt dette.

Originalprosjektet bruker OpenSky for live posisjon og AeroAPI/FlightAware for ekstra flightinfo. Vi har foreløpig ikke lagt inn AeroAPI, fordi målet nå er å teste billigere liveposisjon uten å introdusere en ny betalt kilde.

FR24 er betalt datakilde, så dette prosjektet er lagt opp for å ikke brenne credits unødvendig.

Worker skal ikke hente FR24-data bare fordi adminwebben åpnes. FR24 brukes bare når:

1. `/api/display` eller `/api/flights` kalles.
2. `Skjermen er på` er aktiv.
3. Det ikke er aktiv nattmodus med natt-lysstyrke `0`.
4. `Overvåk luftrommet` er aktiv.

Hvis `Overvåk luftrommet` er av, kan polling fortsatt skje, men Worker hopper over livekilden og viser Avinor-tavle/idle-data i stedet.

Anbefalt bruk:

- La Avinor-data hente fritt.
- Bruk `Overvåk luftrommet` aktivt når skjermen faktisk skal vise live fly.
- Bruk nattmodus med `0` natt-lysstyrke for å stoppe FR24-kall om natten.
- Ikke sett polling lavere enn nødvendig. 60-120 sekunder er fornuftig for vanlig bruk.

OpenSky krever egne credentials:

```bash
npx wrangler secret put OPENSKY_CLIENT_ID
npx wrangler secret put OPENSKY_CLIENT_SECRET
```

## Avinor-data

Avinor brukes til gratis rutetabell for valgt flyplass. Worker henter:

- avganger
- ankomster
- flightnummer
- flyselskap
- flyplasskode
- by/flyplassnavn der vi har det
- gate
- status og oppdatert tid

Tidstabellen viser fire rader om gangen på 128 x 64-skjermen. Antall totale rader og rullehastighet styres fra webpanelet.

## Logoer

Logoer skal ligge i Cloudflare R2-bucket:

```text
flight-display-airline-logos
```

Worker leter blant annet etter:

```text
CODE.png
CODE.PNG
logos/CODE.png
airline-logos/CODE.png
```

Der `CODE` normalt er ICAO-kode eller mappet logo-kode, for eksempel:

```text
SAS.png
NOZ.png
EZY.png
RYR.png
UNKNOWN.png
```

For fly som mangler tydelig airline-kode, faller Worker tilbake til flightnummer-prefix der det er mulig.

Viktig: samme logo kan brukes av flere koder gjennom mapping i Worker, for eksempel cargo-operasjoner som skal bruke moderselskapets logo.

## Lokal utvikling

```bash
cd cloudflare-worker
npm install
npm run dev
```

Legg lokale secrets i `cloudflare-worker/.dev.vars`. Den filen er ignorert av Git og skal ikke committes.

Eksempel:

```text
FR24_API_KEY=din_nokkel_her
OPENSKY_CLIENT_ID=din_opensky_client_id
OPENSKY_CLIENT_SECRET=din_opensky_client_secret
```

Typecheck:

```bash
cd cloudflare-worker
npm run typecheck
```

Deploy:

```bash
cd cloudflare-worker
npm run deploy
```

FR24-nøkkelen skal ligge som Worker secret i Cloudflare:

```bash
npx wrangler secret put FR24_API_KEY
```

OpenSky-credentials skal ligge som Worker secrets hvis OpenSky brukes:

```bash
npx wrangler secret put OPENSKY_CLIENT_ID
npx wrangler secret put OPENSKY_CLIENT_SECRET
```

## Git- og deployflyt

Fast arbeidsflyt:

1. Gjør endring lokalt.
2. Kjør typecheck.
3. Commit til Git.
4. Push til GitHub.
5. Deploy til Cloudflare.

Dette er viktig fordi Cloudflare ikke skal være eneste sted siste fungerende versjon finnes.

## KV

KV brukes som liten database/cache.

Nøkler som skal beholdes:

- `config:v1` - gjeldende konfigurasjon
- `airline:v1:*` - airline-navn bygget opp over tid
- `airlines:avinor:v1` - Avinor airline-register
- `airport:v4:*` - gjeldende airport display-navn
- `airport:avinor:v2:*` - gjeldende Avinor airport-navn
- `airport-coords:v1:*` - koordinater for flyplasser til route progress
- `geocode:v2:*` - reverse geocode for `Flying over`
- `avinor:raw:v2:*` og `avinor:board:v3:*` - kortlevd Avinor-cache
- `flights:fr24:v1:*`, `flights:opensky:v1:*`, `follow:fr24:v2:*` og `follow:opensky:v1:*` - kortlevd live-cache
- `opensky:token:v1` - kortlevd OAuth-token for OpenSky
- `follow:landed:v1:*` - landed-status for fulgte fly, beholdes i to timer etter landing

Gamle versjoner som `airport:v1:*`, `airport:v2:*`, `airport:avinor:v1:*` og `geocode:v1:*` er ryddet bort.

Ikke slett hele KV uten grunn. Det vil ikke ødelegge systemet permanent, men vi mister nyttige navn/cache og Worker må bygge opp alt på nytt.

## Kommende firmware

Når komponentene kommer skal `firmware-hub75/` inneholde koden som flashes til Waveshare ESP32-S3-RGB-Matrix.

Plan for firmware:

- koble til Wi-Fi
- hente `/api/device-config`
- respektere `enabled`, brightness, nattmodus og polling-intervall
- hente `/api/display`
- laste logo fra `/logos/{CODE}.png`
- tegne 128 x 64 layout lokalt på HUB75-panelet
- rotere mellom fly basert på payload og Worker-innstillinger
- ikke kalle FR24, Avinor eller geokoding direkte

Skjermen skal altså ikke ha egen forretningslogikk. Den skal bare presentere Workerens ferdige svar.

## Hardware

Planlagt hardware:

- Waveshare ESP32-S3-RGB-Matrix
- HUB75 P2.5 RGB LED-panel
- Paneloppløsning: 128 x 64 piksler
- Fysisk størrelse: ca. 320 x 160 mm
- Pikselpitch: 2.5 mm

## Referanse

`firmware-original/` er beholdt som referanse til TheFlightWall OSS. Dette prosjektet bruker samme overordnede ide, men annen arkitektur: Cloudflare Worker som datalag, Avinor som gratis rutekilde, FR24/OpenSky som kontrollerte livekilder, R2 for logoer og ESP32 som enkel displayklient.
