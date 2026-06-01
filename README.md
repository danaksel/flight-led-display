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
  - Public device-surface via /public/*
  - Ferdig device-payload via /public/display

ESP32-S3 + HUB75
  - Henter /public/device-config
  - Henter /public/sound-state for rask lydtest uten å hente flydata
  - Henter /public/display etter polling-intervall
  - Henter RGB565-logoer fra /public/logos-rgb565/{CODE}.rgb565
  - Tegner payloaden uten egen API-logikk mot FR24/OpenSky/Avinor
  - Spiller PA-lyd via ES8311/NS4150 når idle avbrytes av fly
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

Fungerende ende-til-ende på Waveshare ESP32-S3-RGB-Matrix og 128 x 64 HUB75-panel:

- Cloudflare Worker deployet som `flight-display-server.dan-aksel.workers.dev`
- Adminside med kart, posisjon, radius, flyplass, display-oppsett og lydvolum
- Ekstern skjermstyring via Homey-endepunkter for skjerm av/på og dag-/natt-lysstyrke
- Tydelig bryter for `Overvåk luftrommet`, som styrer om Worker får lov til å bruke live flydata
- Valgbar livekilde: `Flightradar24` eller `OpenSky Network`
- 128 x 64 emulator med runde LED-piksler og 42 x 42 logo-felt
- Live flyvisning for fly i valgt radius
- Follow mode for flightnummer/callsign
- Follow-visning alternerer automatisk mellom live-målinger og `Flying over`
- Topprad som progressbar ved follow-flight, med grønn fremdrift og grå rest
- Idle-visning med Avinor departures/arrivals når live flydata er av eller ingen fly vises
- Rullende tidstabell med lokal klokke i header
- Tom tidstabell viser `No departures/arrivals the next X hours`, der X kommer fra Avinor-vinduet
- Gate-status på departures: `To gate`, `Boarding`, `Closing`, `Closed`
- Arrival-status kan vise `Landed`
- R2-basert logooppslag via `/logos/{CODE}.png` og ferdig RGB565-format til firmware
- Fallback til `UNKNOWN.png` når logo mangler
- Firmware matcher emulator-layouten for idle og live-visning
- Firmware bruker config-styrt brightness, farger, polling, timezone og tidstabellinnstillinger
- Når skjermen er av, er panelet svart og firmware henter ikke flydata, bare config/status
- Lydtest og PA-varsel styres fra webpanelets lydvolum
- PA-lyden spilles bare når skjermen går fra idle/ingen fly til live flyvisning, ikke for hvert fly i samme live-periode
- KV-cache for config, airline-navn, airport-navn, Avinor-data, live flydata og geokoding

## Viktige endepunkter

- `/`
  Adminside, kart, data-preview og LED-emulator.

- `/api/config`
  Leser og lagrer full konfigurasjon fra webpanelet.

- `/api/device-config`
  Lett konfigurasjon for ESP32-firmware. Inneholder blant annet brightness, polling, timezone, farger, skjermstatus og lydvolum.

- `/api/sound-state`
  Lett status for lydtest. ESP32 poller dette raskt slik at `Test lyd nå` ikke må vente på neste full config-henting.

- `/api/sound-test`
  POST-endepunkt som øker lydtest-`nonce`. ESP32 spiller testlyd når den ser en ny `nonce`. Testen bruker lydvolumet som er lagret i config.

- `/api/screen-state`
  GET/POST for skjerm av/på fra eksterne systemer. Når skjermen er av, skal ESP32 holde panelet svart og ikke hente live flydata.

- `/api/screen-state/activate`
  POST-endepunkt for Homey: slå skjermen på.

- `/api/screen-state/deactivate`
  POST-endepunkt for Homey: slå skjermen av.

- `/api/brightness-mode`
  GET/POST for aktiv lysmodus, `day` eller `night`.

- `/api/brightness-mode/day`
  POST-endepunkt for Homey: bruk vanlig/dag-brightness.

- `/api/brightness-mode/night`
  POST-endepunkt for Homey: bruk natt-brightness.

- `/api/display`
  Payload som emulatoren bruker, og som ESP32 skal bruke senere. Dette endepunktet kan bruke valgt livekilde dersom skjerm og luftromsovervåking er aktiv.

- `/public/device-config`
  Public/device alias for `/api/device-config`. Denne er ment for ESP32 og skal ligge under samme Cloudflare Access-regel som `/public/*`.

- `/public/sound-state`
  Public/device alias for `/api/sound-state`. ESP32 bruker denne for rask testlyd uten å hente flydata.

- `/public/display`
  Public/device alias for `/api/display`. Denne er ment for ESP32 og skal ligge under samme Cloudflare Access-regel som `/public/*`.

- `/api/avinor-board`
  Rutedata fra Avinor for valgt flyplass. Dette er gratis datakilde og brukes også til raw preview i web.

- `/logos/{CODE}.png`
  Server logo fra R2 for flyselskap. Faller tilbake til Worker assets og deretter eventuell ekstern logo-base hvis konfigurert.

- `/logos-rgb565/{CODE}.rgb565`
  Fremtidig ESP32-vennlig logoformat. Server ferdig genererte 42 x 42 RGB565 little-endian bytes fra R2. ESP32 skal kunne laste ned filen, cache den og tegne pikslene direkte uten PNG-dekoding.

- `/public/logos-rgb565/{CODE}.rgb565`
  Public/device alias for RGB565-logoer. ESP32 skal bruke denne URL-en.

## Cloudflare Access

Admin/web skal beskyttes med Cloudflare Access og Google-login.

ESP32 kan ikke bruke Google-login. All firmware-trafikk skal derfor gå via én device-rot:

```text
/public/*
```

Sett Cloudflare Access-regelen på `/public/*`, enten som:

- midlertidig bypass under utvikling
- helst Service Auth / service token når dette skal stå mer permanent

ESP32 skal ikke bruke admin-URL-ene direkte. Den skal bruke:

```text
/public/device-config
/public/sound-state
/public/display
/public/logos-rgb565/{CODE}.rgb565
```

## Homey-styring

Skjermen styres eksternt fra Homey med POST-kall til Worker:

```text
POST /api/screen-state/activate
POST /api/screen-state/deactivate
POST /api/brightness-mode/day
POST /api/brightness-mode/night
```

Alternativt kan generiske endepunkter brukes:

```text
POST /api/screen-state       {"active": true}
POST /api/brightness-mode    {"brightnessMode": "night"}
```

Webpanelet viser siste aktivering/deaktivering og siste bytte mellom dag/natt. Når skjermen er deaktivert skal ESP32 vise svart skjerm, ikke hente `/public/display`, og bare hente config/status for å oppdage at skjermen skal på igjen.

## Livekilder og kredittkontroll

Prosjektet støtter to livekilder:

- `Flightradar24` - dagens mest komplette kilde for rute, aircraft, callsign og posisjon.
- `OpenSky Network` - samme posisjonskilde som originalprosjektet bruker for `states/all`.

OpenSky gir primært state vectors: callsign, posisjon, høyde, fart, track, vertical rate, origin country og on-ground. Den gir ikke like komplett rute-/airline-info alene. Derfor bruker vi fortsatt Avinor og egne R2-logoer som gratis berikelse rundt dette.

Originalprosjektet bruker OpenSky for live posisjon og AeroAPI/FlightAware for ekstra flightinfo. Vi har foreløpig ikke lagt inn AeroAPI, fordi målet nå er å teste billigere liveposisjon uten å introdusere en ny betalt kilde.

FR24 er betalt datakilde, så dette prosjektet er lagt opp for å ikke brenne credits unødvendig.

Når skjermen viser fly i valgt radius bruker Worker FR24 `full`, fordi den visningen trenger rute, flytype, operator og metadata for ukjente fly i området. Når du følger et konkret flightnummer bruker Worker FR24 `full` kun for å hente statiske felt som flytype, registrering, rute og operator første gang den aktuelle flygningen lastes. Disse feltene caches for dagen. Etterpå bruker follow-visningen FR24 `light`, som holder for live-posisjon, høyde, fart, track og vertical rate.

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

Hvis OpenSky OAuth er midlertidig utilgjengelig, prøver Worker anonym OpenSky-henting i stedet for å feile hele displayet. Det gir lavere kvote, men er bedre enn at skjermen stopper.

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

Hvis Avinor ikke returnerer avganger eller ankomster i valgt tidsvindu, sender Worker en egen tomrad til firmware:

```text
No departures
the next X hours
```

eller:

```text
No arrivals
the next X hours
```

`X` er `avinorWindowHours` fra webpanelet.

## Logoer

Logoer skal ligge i Cloudflare R2-bucket, og R2 er source of truth for logoene:

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

For ESP32-firmware skal logoene ikke dekodes fra PNG på kortet i første versjon. Worker/API-et har derfor et eget planlagt binærformat:

```text
/logos-rgb565/{CODE}.rgb565
```

Filene skal forhåndsgenereres fra PNG-logoene i R2 og legges tilbake i R2, for eksempel som:

```text
rgb565/SAS.rgb565
rgb565/NOZ.rgb565
rgb565/UNKNOWN.rgb565
```

Format:

- 42 x 42 piksler
- RGB565
- little-endian byteorden
- rå bytes uten header
- transparens i PNG skal konverteres til svart
- forventet størrelse: 42 * 42 * 2 = 3528 bytes

Generer lokale RGB565-filer fra en eksport av R2-logoene med:

```bash
cd cloudflare-worker
npm run logos:rgb565
```

Kommandoen leser som standard `assets/airline-logos/r2-source/*.png` og skriver ferdige filer til `assets/airline-logos/rgb565/`.

Viktig: `cloudflare-worker/public/logos/` er bare fallback/dev-fixtures og skal ikke behandles som fasit. Hvis den brukes til testkonvertering, må det gjøres eksplisitt:

```bash
cd cloudflare-worker
npm run logos:rgb565 -- --input cloudflare-worker/public/logos
```

Dette skal være et arkiv av ferdig genererte filer, ikke PNG-konvertering på hver forespørsel. Grunnen er at ESP32 da slipper PNG-dekoder, og Worker slipper tung bildebehandling i request-pathen.

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
AVIATIONSTACK_API_KEY=din_aviationstack_nokkel_her
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

Aviationstack-nøkkelen brukes som fallback for fulgte fremtidige flights når FR24 mangler avgangstid/gate:

```bash
npx wrangler secret put AVIATIONSTACK_API_KEY
```

OpenSky-credentials skal ligge som Worker secrets hvis OpenSky brukes:

```bash
npx wrangler secret put OPENSKY_CLIENT_ID
npx wrangler secret put OPENSKY_CLIENT_SECRET
```

## Git- og deployflyt

Fast arbeidsflyt for alle Worker-/serverendringer:

1. Gjør endring lokalt.
2. Kjør typecheck.
3. Commit til Git.
4. Push til GitHub.
5. Deploy til Cloudflare.

Dette er en stående regel: GitHub skal oppdateres før Cloudflare deployes. Cloudflare skal ikke være eneste sted siste fungerende versjon finnes.

Unntak er bare hvis brukeren eksplisitt ber om en direkte hotfix-deploy. Da skal endringen fortsatt commit'es og pushes til GitHub rett etterpå.

## KV

KV brukes som liten database/cache.

Nøkler som skal beholdes:

- `config:v1` - gjeldende konfigurasjon
- `screen-state:v1` - ekstern skjermstatus, lysmodus og siste Homey/API-endringer
- `sound-state:v1` - testlyd-`nonce` og siste lydtest
- `airline:v1:*` - airline-navn bygget opp over tid
- `airlines:avinor:v1` - Avinor airline-register
- `airport:v4:*` - gjeldende airport display-navn
- `airport:avinor:v2:*` - gjeldende Avinor airport-navn
- `airport-coords:v1:*` - koordinater for flyplasser til route progress
- `geocode:v2:*` - reverse geocode for `Flying over`
- `avinor:raw:v2:*` og `avinor:board:v3:*` - kortlevd Avinor-cache
- `flights:fr24:v1:*`, `flights:opensky:v1:*`, `follow:fr24:v4:*` og `follow:opensky:v1:*` - kortlevd live-cache
- `follow:fr24:static:v1:*` - statiske FR24 follow-felt som flytype, registrering, rute og operator, cachet per dag
- `opensky:token:v1` - kortlevd OAuth-token for OpenSky
- `follow:landed:v1:*` - landed-status for fulgte fly, beholdes i to timer etter landing

Gamle versjoner som `airport:v1:*`, `airport:v2:*`, `airport:avinor:v1:*` og `geocode:v1:*` er ryddet bort.

Ikke slett hele KV uten grunn. Det vil ikke ødelegge systemet permanent, men vi mister nyttige navn/cache og Worker må bygge opp alt på nytt.

## Firmware

`firmware-hub75/` inneholder PlatformIO/Arduino-firmware for Waveshare ESP32-S3-RGB-Matrix. Kortet er verifisert med USB upload, serial monitor, Wi-Fi, HUB75-panel, Worker-config, display-payload, R2-logoer og lyd.

Gjennomført rekkefølge:

1. Kortet lever: minimal serial/uptime-test.
2. Skjermen lyser: HUB75 viser testmønster.
3. Wi-Fi virker: ESP32 kobler seg til `jacobsen-iot`.
4. Device config virker: ESP32 henter `/public/device-config`.
5. Display payload virker: ESP32 henter og parser `/public/display`.
6. Layout virker: ESP32 matcher 128 x 64-emulatoren for live- og idle-visning.
7. Logo virker: ESP32 henter og tegner `/public/logos-rgb565/{CODE}.rgb565`.
8. Skjermstyring virker: Homey/API kan sette skjerm av/på og dag/natt-brightness.
9. Lyd virker: testlyd og PA-varsel spiller via ES8311/NS4150.

Firmware gjør dette:

- koble til Wi-Fi
- hente `/public/device-config`
- hente `/public/sound-state` for rask testlyd uten flydatahenting
- respektere skjerm av/på, brightness, dag/natt-modus, farger, timezone og polling-intervall
- hente `/public/display`
- laste logo fra `/public/logos-rgb565/{CODE}.rgb565`
- tegne 128 x 64 layout lokalt på HUB75-panelet
- rotere mellom fly basert på payload og Worker-innstillinger
- vise gul blinkende pixel øverst til høyre når den henter config/status mens skjermen er av
- la panelet være helt svart når skjermen er deaktivert
- spille PA-lyd når idle avbrytes av et fly
- ikke kalle FR24, Avinor eller geokoding direkte

Skjermen skal altså ikke ha egen forretningslogikk. Den skal bare presentere Workerens ferdige svar.

## Hardware

Planlagt hardware:

- Waveshare ESP32-S3-RGB-Matrix
- HUB75 P2.5 RGB LED-panel
- Paneloppløsning: 128 x 64 piksler
- Fysisk størrelse: ca. 320 x 160 mm
- Pikselpitch: 2.5 mm

Strøm og første oppkobling:

- Ikke driv HUB75-panelet fra Mac/USB.
- Bruk dimensjonert 5V strømforsyning inn på kortets Type-C power supply port.
- Kortets 5V power output kan brukes videre til LED-panelet slik Waveshare beskriver.
- USB Type-C-porten brukes samtidig til programmering/debugging fra Mac.
- Første paneltest skal kjøres med lav brightness og enkelt testmønster, ikke full hvit skjerm.

### Lydpinout

Waveshare-schematic og BSP er fasit for lyd. ES8311/NS4150-lydveien bruker:

```text
I2C_SDA    IO47
I2C_SCL    IO48
I2S_MCLK   IO12
I2S_SCLK   IO43
I2S_LRCK   IO38
I2S_DSDOUT IO21
I2S_DSDIN  IO39
PA_CTRL    IO11
```

Viktig: Arduino `I2S`-wrapperen setter ikke MCLK på dette oppsettet. Firmware bruker derfor ESP-IDF I2S-driveren direkte for lyd, med I2S0 og eksplisitt `mck_io_num = 12`. HUB75-biblioteket bruker I2S1.

Testlyd ved 5 % var praktisk talt uhørbar på denne lydveien. Første bekreftede hørbare nivå var 35 %, og lydvolumet styres nå fra webpanelet.

## Referanse

`firmware-original/` er beholdt som referanse til TheFlightWall OSS. Dette prosjektet bruker samme overordnede ide, men annen arkitektur: Cloudflare Worker som datalag, Avinor som gratis rutekilde, FR24/OpenSky som kontrollerte livekilder, R2 for logoer og ESP32 som enkel displayklient.
