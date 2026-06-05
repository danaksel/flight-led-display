# Flight LED Display

Egen flight-display-løsning for et 128 x 64 HUB75 RGB LED-panel styrt av Waveshare ESP32-S3-RGB-Matrix.

Prosjektet er bygget rundt ett hovedprinsipp: Cloudflare Worker skal gjøre mest mulig arbeid, mens ESP32-skjermen etter hvert skal være en enkel klient som henter ferdig renderbare data, innstillinger og logo-referanser.

## Arkitektur

```text
Cloudflare Worker
  - React-basert mobil webapp og 128 x 64 emulator
  - Legacy adminside på /legacy-admin
  - Konfigurasjon i KV
  - Realtime-hub via Durable Object/WebSocket
  - FR24 livekilde for fly i luftrommet
  - Avinor-oppslag for gratis avgangs-/ankomsttavle
  - R2-logoer via /logos/{CODE}.png
  - Public device-surface via /public/*
  - Ferdig device-payload via /public/display

ESP32-S3 + HUB75
  - Henter /public/device-config
  - Lytter på /public/realtime og poller /public/realtime-state som fallback
  - Henter /public/sound-state for lydstatus/test uten å hente flydata
  - Henter /public/display etter polling-intervall
  - Sender device-status til /public/device-status og via realtime
  - Henter RGB565-logoer fra /public/logos-rgb565/{CODE}.rgb565
  - Tegner payloaden uten egen API-logikk mot FR24/Avinor
  - Spiller PA-lyd og klokketick via ES8311/NS4150
```

## Prosjektstruktur

```text
cloudflare-worker/   Worker API, React-webapp, emulator og Cloudflare config
firmware-hub75/      PlatformIO-firmware for Waveshare ESP32-S3-RGB-Matrix + HUB75
firmware-original/   Original TheFlightWall OSS-firmware som referanse
assets/              Genererte logo-/eksportmapper. Ignorert i Git; R2 er fasit for logoer
hardware/            Notater om skjerm, kort og hardwarevalg
```

## Dagens status

Fungerende ende-til-ende på Waveshare ESP32-S3-RGB-Matrix og 128 x 64 HUB75-panel:

- Cloudflare Worker deployet som `flight-display-server.dan-aksel.workers.dev`
- React mobil-webapp med kart, posisjon, radius, flyplass, display-oppsett, emulator og lydvolum
- Gammel adminside finnes fortsatt på `/legacy-admin` som referanse/debug
- Ekstern skjermstyring via Homey-endepunkter for skjerm av/på og dag-/natt-lysstyrke
- Realtime-varsling via Durable Object/WebSocket, med HTTP polling som fallback
- Tydelig bryter for `Overvåk luftrommet`, som styrer om Worker får lov til å bruke live flydata
- FR24 som eneste aktive livekilde
- 128 x 64 emulator med runde LED-piksler og 42 x 42 logo-felt
- Live flyvisning for fly i valgt radius
- Kategorifilter for FR24-overvåkning, med `T GENERAL_AVIATION` av som standard
- Follow mode for flightnummer/callsign
- Follow-visning alternerer automatisk mellom live-målinger og `Flying over`
- Topprad som progressbar ved follow-flight, med grønn fremdrift og grå rest
- Idle-visning med Avinor departures/arrivals når live flydata er av eller ingen fly vises
- Rullende tidstabell med lokal klokke i header
- Tidstabellrader viser tid, bynavn, flyselskap/gate-felt og statusikon med 3 px ytter-margin
- Bynavn scroller inni eget felt ved lange navn uten å lekke over i andre felt
- Departures/arrivals kan ha separate antall og separate timer fremover
- Bytte mellom departures og arrivals har justerbar outro/intro fra 0,2 til 1,0 s: header slettes/skrives bokstavvis, rutene ruller ut/inn, og klokken står hele tiden
- Vanlig sidebytte innen samme type bruker normal rullehastighet
- Timetabellscroll bruker maskering ved separatorlinjen slik at rader forsvinner gradvis under headeren
- Tom tidstabell viser `No departures/arrivals the next X hours`, der X kommer fra Avinor-vinduet
- Gate-status på departures vises som statusikon: go to gate, boarding, gate closing og gate closed
- Arrival-status `Landed` vises som check-ikon
- R2-basert logooppslag via `/logos/{CODE}.png` og ferdig RGB565-format til firmware
- Fallback til `UNKNOWN.png` når logo mangler
- Lokal oppstartsskjerm fra firmware med statusfelt over splash-bilde frem til første displaydata er hentet
- Firmware matcher emulator-layouten for idle og live-visning
- Firmware bruker config-styrt brightness, farger, polling, timezone og tidstabellinnstillinger
- Firmware sender heartbeat/status ca. hvert 2. minutt med Wi-Fi SSID, RSSI, IP, uptime, skjermstatus, config OK og display OK
- Webpanelet poller `/api/device-status` ca. hvert 15. sekund og viser firmware/Wi-Fi-status i display-seksjonen
- Når skjermen er av, er panelet svart og firmware henter ikke flydata, bare config/status
- Lydtest og PA-varsel styres fra webpanelets lydvolum
- Klokketick har egen enable/volume og bruker separat tic-volum i firmware
- PA-lyden spilles bare når skjermen går fra idle/ingen fly til live flyvisning, ikke for hvert fly i samme live-periode
- KV-cache for config, screen/sound state, airline-navn, airport-navn, Avinor-data, live flydata og geokoding

## Viktige endepunkter

- `/`
  React mobil-webapp med seksjonsmeny, kart, data-preview, konfigurasjon og LED-emulator i skjermramme.

- `/legacy-admin`
  Gammel Worker-renderet adminside. Beholdes som referanse/debug for emulator og eldre kontroller.

- `/api/config`
  Leser og lagrer full konfigurasjon fra webpanelet.

- `/api/device-config`
  Lett konfigurasjon for ESP32-firmware. Inneholder blant annet brightness, polling, timezone, farger, skjermstatus og lydvolum.

- `/api/realtime-state`
  Lett state for firmware fallback-polling. Inneholder config-/screen-versjoner, lydtest-`nonce` og clock tick-/lydstatus.

- `/api/sound-state`
  Lett status for lydtest. ESP32 poller dette raskt slik at `Test lyd nå` ikke må vente på neste full config-henting.

- `/api/sound-test`
  POST-endepunkt som øker lydtest-`nonce`. ESP32 spiller testlyd når den ser en ny `nonce`. Testen bruker lydvolumet som er lagret i config.

- `/api/clock-tick`
  GET/POST for klokketick aktivert/deaktivert og eget klokketick-volum.

- `/api/screen-state`
  GET/POST for skjerm av/på fra eksterne systemer. Når skjermen er av, skal ESP32 holde panelet svart og ikke hente live flydata.

- `/api/device-status`
  Siste statusrapport fra ESP32. Brukes av webpanelet for å vise om firmware nylig har meldt seg, Wi-Fi-navn, signalstyrke, IP, uptime og om siste config/display-henting var OK.

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

- `/api/display-mode`
  GET/POST for aktiv displaymodus, `flight` eller `clock`.

- `/api/display-mode/flight`
  POST-endepunkt for Homey: bruk flight-display.

- `/api/display-mode/clock`
  POST-endepunkt for Homey: bruk klokke-display.

- `/api/display`
  Payload som emulatoren bruker, og som ESP32 skal bruke senere. Dette endepunktet kan bruke valgt livekilde dersom skjerm og luftromsovervåking er aktiv.

- `/pixel-editor`
  Lokal tegneside for 128 x 64 pixelmaler. Brukes til å tegne klokke- og layoutreferanser med samme LED-spacing som emulatoren.

- `/public/device-config`
  Public/device alias for `/api/device-config`. Denne er ment for ESP32 og skal ligge under samme Cloudflare Access-regel som `/public/*`.

- `/public/realtime`
  WebSocket-endepunkt for ESP32. Brukes for raske `config_changed`, `display_changed` og `sound_test`-hendelser.

- `/public/realtime-state`
  Public/device alias for `/api/realtime-state`. Firmware poller dette som fallback ved siden av WebSocket.

- `/public/sound-state`
  Public/device alias for `/api/sound-state`. ESP32 bruker denne for rask testlyd uten å hente flydata.

- `/public/device-status`
  POST-endepunkt for ESP32 heartbeat/status. Firmware sender samme status også over WebSocket, men HTTP POST brukes som robust fallback slik at webpanelets statusfelt ikke er avhengig av realtime-lagring alene.

- `/public/display`
  Public/device alias for `/api/display`. Denne er ment for ESP32 og skal ligge under samme Cloudflare Access-regel som `/public/*`.

- `/api/avinor-board`
  Rutedata fra Avinor for valgt flyplass. Dette er gratis datakilde og brukes også til raw preview i web.

- `/logos/{CODE}.png`
  Server logo fra R2 for flyselskap. Faller tilbake til Worker assets og deretter eventuell ekstern logo-base hvis konfigurert.

- `/logos-rgb565/{CODE}.rgb565`
  ESP32-vennlig logoformat. Server ferdig genererte 42 x 42 RGB565 little-endian bytes fra R2. ESP32 laster ned filen, cacher den og tegner pikslene direkte uten PNG-dekoding.

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
- bypass kombinert med `DEVICE_API_TOKEN`
- eller Service Auth / service token hvis firmware senere settes opp med Cloudflare Access service headers

I tillegg støtter Worker en enkel token-sperre som ekstra sikkerhetsnett hvis en Access-regel mangler eller endres feil:

```bash
cd cloudflare-worker
npx wrangler secret put ADMIN_API_TOKEN
npx wrangler secret put DEVICE_API_TOKEN
```

Når `ADMIN_API_TOKEN` er satt, må eksterne automasjoner sende token på styringsendepunktene under `/api/screen-state*` og `/api/brightness-mode*`. Adminpanelet er ment å beskyttes av Cloudflare Access/Google-login, ikke av dette tokenet.

Når `DEVICE_API_TOKEN` er satt, må ESP32 sende samme verdi som headeren `X-Flight-Device-Token` på alle `/public/*`-kall. Legg token i `firmware-hub75/include/WiFiSecrets.h`:

```cpp
#define FLIGHT_DEVICE_TOKEN "samme-verdi-som-DEVICE_API_TOKEN"
```

Viktig: Cloudflare Access kjører før Worker. Hvis `/public/*` beskyttes med Google-login i Access, vil ESP32 stoppes før Worker får validert `DEVICE_API_TOKEN`. Bruk derfor enten Access-bypass for `/public/*` sammen med `DEVICE_API_TOKEN`, eller en egen Service Auth-regel og firmware-støtte for Cloudflare Access service-token.

ESP32 skal ikke bruke admin-URL-ene direkte. Den skal bruke:

```text
/public/realtime
/public/realtime-state
/public/device-config
/public/sound-state
/public/device-status
/public/display
/public/logos-rgb565/{CODE}.rgb565
```

Firmware bruker WebSocket på `/public/realtime` for raske endringer. Hvis realtime faller ut, poller den `/public/realtime-state` hvert 5. sekund og henter full config/display når versjoner endrer seg. `configRefreshSeconds` i webpanelet er derfor normal/fallback-refresh, ikke eneste mekanisme for å oppdage endringer. Firmware rapporterer device-status omtrent hvert 2. minutt til `/public/device-status`; webpanelet poller `/api/device-status` omtrent hvert 15. sekund. Når skjermen er av, poller firmware config/status hyppigere en periode for rask reaktivering, men henter ikke `/public/display`.

## Homey-styring

Skjermen styres eksternt fra Homey med POST-kall til Worker:

```text
POST /api/screen-state/activate
POST /api/screen-state/deactivate
POST /api/display-mode/flight
POST /api/display-mode/clock
POST /api/brightness-mode/day
POST /api/brightness-mode/night
```

Når `ADMIN_API_TOKEN` er satt, må Homey sende samme token som header på disse kallene:

```text
X-Flight-Admin-Token: samme-verdi-som-ADMIN_API_TOKEN
```

Alternativt kan Homey sende:

```text
Authorization: Bearer samme-verdi-som-ADMIN_API_TOKEN
```

Hvis `/api/*` er beskyttet av Cloudflare Access med Google-login, vil Homey bli stoppet før Worker ser tokenet. For Homey må du da enten:

- bruke Cloudflare Access Service Auth og konfigurere Homey til å sende `CF-Access-Client-Id` og `CF-Access-Client-Secret` i tillegg til `X-Flight-Admin-Token`
- eller lage en mer spesifikk Access-bypass for Homey-endepunktene og la Workerens `ADMIN_API_TOKEN` være beskyttelsen der

Alternativt kan generiske endepunkter brukes:

```text
POST /api/screen-state       {"active": true}
POST /api/display-mode       {"displayMode": "clock"}
POST /api/brightness-mode    {"brightnessMode": "night"}
```

Webpanelet viser siste aktivering/deaktivering og siste bytte mellom dag/natt. Når skjermen er deaktivert skal ESP32 vise svart skjerm, ikke hente `/public/display`, og bare hente config/status for å oppdage at skjermen skal på igjen.

Natt-tidspunkt styres utenfor webpanelet, typisk via Homey og `brightness-mode`. Webpanelet eksponerer fortsatt `Night brightness`, men ikke start-/sluttid for nattmodus.

## Pixel-editor for klokke- og layoutmaler

`/pixel-editor` er en egen tegneside for manuelle 128 x 64 pixelmaler. Den bruker samme LED-spacing, runde piksler og 128 x 64-panelstørrelse som emulatoren, slik at en tegnet mal kan brukes som presis referanse for klokke- eller displaylayout.

Slik brukes den:

- Åpne `/pixel-editor` i nettleseren.
- Klikk på en mørk pixel for å tenne den hvit.
- Klikk på en tent pixel for å slukke den.
- Dra etter første klikk for å tegne eller slette flere pixler med samme handling.
- Bruk de gule krysslinjene og rulerne for å se visuell rad/kolonne.
- Ruler og hover-visning er 1-basert for enklere tegning: `x 1-128`, `y 1-64`.
- Output-feltet er 0-basert og kodeklart: `x 0-127`, `y 0-63`.

Når en ny klokkemal skal implementeres, send outputen fra `JSON coordinates`-formatet tilbake til Codex. Formatet ser slik ut:

```json
{
  "width": 128,
  "height": 64,
  "pixels": [
    [62, 0],
    [63, 0]
  ]
}
```

Codex skal tolke disse koordinatene som 0-baserte panelkoordinater og bruke dem direkte som pixelmal. Ikke konverter til 1-basert før implementering, selv om editoren viser 1-baserte koordinater visuelt.

## Livekilder og kredittkontroll

Prosjektet bruker `Flightradar24` som livekilde for fly i luftrommet.

FR24 er betalt datakilde, så dette prosjektet er lagt opp for å ikke brenne credits unødvendig. Avinor brukes fortsatt gratis til avgangs-/ankomsttavle, status og berikelse rundt fulgte flights.

Når skjermen viser fly i valgt radius bruker Worker FR24 `full`, fordi den visningen trenger rute, flytype, operator og metadata for ukjente fly i området. Når du følger et konkret flightnummer bruker Worker FR24 `full` kun for å hente statiske felt som flytype, registrering, rute og operator første gang den aktuelle flygningen lastes. Disse feltene caches for dagen. Etterpå bruker follow-visningen FR24 `light`, som holder for live-posisjon, høyde, fart, track og vertical rate.

FR24-kategorier kan filtreres i kontrollpanelet under `Flytyper i overvåkning`. Filteret gjelder automatisk fly-i-radius, ikke eksplisitt follow-flight. Standard er alle kategorier på unntatt `T GENERAL_AVIATION`, slik at private småfly, ambulanse-/survey-/treningsfly og kalibreringsfly ikke avbryter idle-visningen.

Worker skal ikke hente FR24-data bare fordi adminwebben åpnes. FR24 brukes bare når:

1. `/api/display` eller `/api/flights` kalles.
2. `Skjermen er på` er aktiv.
3. `Overvåk luftrommet` er aktiv.

Hvis `Overvåk luftrommet` er av, kan polling fortsatt skje, men Worker hopper over livekilden og viser Avinor-tavle/idle-data i stedet.

Dag-/natt-brightness styrer bare lysstyrken på panelet. Den skal ikke stoppe datainnhenting. Bruk skjermstatus `inactive` for å stoppe firmware fra å hente `/public/display` og for å stoppe livekilden.

Anbefalt bruk:

- La Avinor-data hente fritt.
- Bruk `Overvåk luftrommet` aktivt når skjermen faktisk skal vise live fly.
- Slå skjermen inaktiv når live-datahenting skal stoppes helt.
- Ikke sett polling lavere enn nødvendig. 60-120 sekunder er fornuftig for vanlig bruk.

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

For ESP32-firmware dekodes ikke PNG på kortet. Worker/API-et server derfor et ferdig binærformat:

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

Kommandoen leser som standard `assets/airline-logos/r2-source/*.png` og skriver ferdige filer til `assets/airline-logos/rgb565/`. Hele `assets/airline-logos/` er ignorert i Git fordi dette er genererte/eksporterte artefakter. R2-bucketen er source of truth.

Viktig: `cloudflare-worker/public/logos/` er bare fallback/dev-fixtures og skal ikke behandles som fasit. Hvis den brukes til testkonvertering, må det gjøres eksplisitt:

```bash
cd cloudflare-worker
npm run logos:rgb565 -- --input cloudflare-worker/public/logos
```

Dette skal være et arkiv av ferdig genererte filer, ikke PNG-konvertering på hver forespørsel. Grunnen er at ESP32 slipper PNG-dekoder, og Worker slipper tung bildebehandling i request-pathen.

## Lokal utvikling

```bash
cd cloudflare-worker
npm install
npm run dev -- --port 8788
```

Legg lokale secrets i `cloudflare-worker/.dev.vars`. Den filen er ignorert av Git og skal ikke committes.

Eksempel:

```text
FR24_API_KEY=din_nokkel_her
AVIATIONSTACK_API_KEY=din_aviationstack_nokkel_her
```

Typecheck:

```bash
cd cloudflare-worker
npm run typecheck
```

Bygg React-webappen inn i Worker assets:

```bash
cd cloudflare-worker
npm run build:web
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

## Git- og deployflyt

Fast arbeidsflyt for Worker-/serverendringer:

1. Gjør endring lokalt.
2. Kjør `npm run typecheck` og `npm run build:web`.
3. Commit til Git.
4. Push til GitHub.
5. Deploy til Cloudflare.

Dette er en stående regel: GitHub skal oppdateres før Cloudflare deployes. Cloudflare skal ikke være eneste sted siste fungerende versjon finnes.

Unntak er bare hvis brukeren eksplisitt ber om en direkte hotfix-deploy. Da skal endringen fortsatt commit'es og pushes til GitHub rett etterpå.

For firmwareendringer:

```bash
pio run -d firmware-hub75
pio run -d firmware-hub75 -t upload
```

Per nå er verifisert upload-/monitor-port:

```text
/dev/cu.usbmodem101
```

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
- `flights:fr24:v1:*` og `follow:fr24:v4:*` - kortlevd live-cache
- `follow:fr24:static:v1:*` - statiske FR24 follow-felt som flytype, registrering, rute og operator, cachet per dag
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
10. Realtime virker: firmware får config/display/sound-hendelser via WebSocket og fallback-polling.
11. Klokkemodus virker: firmware tegner samme sekundlinje/minuttstack/7-segment-layout som emulatoren og kan spille tic-lyd.

Firmware gjør dette:

- koble til Wi-Fi
- vise lokal boot-splash fra `firmware-hub75/src/splash_image.h`
- hente `/public/device-config`
- koble til `/public/realtime` og bruke `/public/realtime-state` som fallback
- hente `/public/sound-state` for rask testlyd uten flydatahenting
- respektere skjerm av/på, brightness, dag/natt-modus, farger, timezone og polling-intervall
- hente `/public/display`
- laste logo fra `/public/logos-rgb565/{CODE}.rgb565`
- tegne 128 x 64 layout lokalt på HUB75-panelet
- rotere mellom fly basert på payload og Worker-innstillinger
- alternere follow-flight mellom live-målinger og `Flying over`
- tegne klokkemodus lokalt med config-styrt gradient
- vise gul blinkende pixel øverst til høyre når den henter config/status mens skjermen er av
- la panelet være helt svart når skjermen er deaktivert
- spille PA-lyd når idle avbrytes av et fly
- spille klokketick med eget tic-volum, uavhengig av PA-/flightlydvolum
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

Testlyd ved 5 % var praktisk talt uhørbar på denne lydveien. Første bekreftede hørbare nivå var 35 %. PA-/testlydvolum styres med `Audio volume` i webpanelet. Klokketick styres separat med `Clock tick enabled` og `Clock tick volume`; firmware skalerer tic-samplene uavhengig av PA-volumet.

## Referanse

`firmware-original/` er beholdt som referanse til TheFlightWall OSS. Dette prosjektet bruker samme overordnede ide, men annen arkitektur: Cloudflare Worker som datalag, Avinor som gratis rutekilde, FR24 som kontrollert livekilde, R2 for logoer og ESP32 som enkel displayklient.
