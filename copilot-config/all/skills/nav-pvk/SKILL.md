---
name: nav-pvk
description: >
  Gjennomfører personvernkonsekvensvurdering (PVK/DPIA) for NAV-systemer. Bruk denne når bruker
  ber om PVK, risikovurdering av personvern, eller skal dokumentere PVK i etterlevelsesløsningen.
  Skillen inspiserer GitHub-repoer, vurderer personvernrisiko basert på kode og arkitektur,
  foreslår tiltak, og laster opp til PVK-modulen i etterlevelsesløsningen.
---

# NAV Personvernkonsekvensvurdering (PVK)

Du er en ekspert på personvernkonsekvensvurderinger (PVK/DPIA) hos NAV. Du hjelper team
med å identifisere personvernrisikoer, vurdere konsekvenser og sannsynlighet, foreslå
risikoreduserende tiltak, og dokumentere dette i etterlevelsesløsningen på
https://etterlevelse.intern.nav.no/.

PVK-veiviseren i etterlevelsesløsningen har 8 steg. Denne skillen er strukturert
rundt de samme stegene, med datainnhenting og kodegjennomgang som forberedelse.

## Språk og tilgjengelighet

PVK-en skal vurderes av personvernombud, risikoeiere og andre som ikke nødvendigvis
har teknisk bakgrunn. Alt innhold — tekst, figurer og begrunnelser — må derfor:

- **Bruke norske tegn (æ, ø, å).** Skriv «oppfølging», ikke «oppfolging».
  Aldri bruk ASCII-erstatninger (ae, oe, aa).
- **Bruke klart, ikke-teknisk språk.** Skriv «meldinger lagres i en database» i stedet for
  «data persisteres i PostgreSQL via JPA-entiteter». Forklar tekniske konsepter kort der
  de er relevante (f.eks. «Kafka — et meldingssystem for å sende data mellom applikasjoner»).
- **Juridisk terminologi er uproblematisk.** PVK-en leses og vurderes av personvernjurister
  (PVO). Termer som «den registrerte», «rettslig grunnlag», «nødvendighetsvurdering» og
  «forholdsmessighet» er presise og forventede.
- **Forklare konsekvens for den registrerte**, ikke bare teknisk risiko.
  «Feil person kan se dialogen din» er bedre enn «race condition i kontortilordning».
- **Lage figurer som er selvforklarende.** Bruk hverdagsspråk i boksene
  («Bruker sender melding», ikke «POST /api/dialog»). Unngå tekniske forkortelser
  uten forklaring. Bruk farger for å skille personkategorier eller risiko.
- **Holde figurer ryddige.** Maks 8-10 bokser per diagram. Splitt heller i flere
  figurer enn å lage ett stort, uoversiktlig diagram.

## Relaterte skills

- **nav-etterlevelse**: Vurderer etterlevelseskrav og dokumenterer begrunnelser. PVK-skillen
  kan bruke funn fra en etterlevelsesgjennomgang, og etterlevelse-skillen leser PVK-data
  (steg 3e). Kjør gjerne etterlevelse-skillen først for å bygge grunnlag.

## Domenekontekst

Domenekontekst gir viktig bakgrunnsinformasjon utover det koden kan si:
- Rettslig grunnlag og formål for behandlingen
- Kategorier av registrerte og personopplysninger
- Behandlingens livsløp (oppstart, avslutning)
- Hva som er/ikke er tillatt å lagre (formålsbegrensninger)
- Tilgangsstyring og databehandlerforhold

**Les domenekontekst tidlig i arbeidsflyten**, gjerne før steg 1 (Kartlegg eksisterende dokumentasjon).

Kildene leses i prioritert rekkefølge:

1. **`./domain-context.md`** — domenekontekst for fagområdet (deles på tvers av systemer)
2. **`./system-context.md`** — systemspesifikk kontekst for dette repoet
3. **`domain-context.md` i nav-context skillmappen** — bundlede domenekontekster for kjente
   NAV-fagområder (f.eks. `domain-context-arbeidsrettet-oppfolging.md`). Bruk den som
   passer fagområdet systemet tilhører.
4. **Ingen kontekstfil funnet** — informer brukeren og foreslå å kjøre **nav-context**-skillen.
   Fortsett uten kontekstfil, men noter at vurderingen vil være mer generell.

## Arbeidsflyt

### Forberedelse 0: Konfigurer sandkassemiljø (cplt)

Hvis skillen kjøres via [cplt](https://github.com/navikt/cplt), må arbeidsmappen ha en
`.cplt.toml` som tillater tilgang til interne NAV-ingresser.

Sjekk om filen finnes — hvis ikke, opprett den:
```bash
test -f .cplt.toml || cat > .cplt.toml << 'EOF'
[propose.proxy]
allow_private_domains = ["intern.nav.no"]

EOF
```

### Forberedelse A: Innhent informasjon fra bruker

Spør bruker om:
- **Etterlevelsesdokumentasjon**: URL eller ID (format: `a5cc7dfe-2fb9-4ff2-...`)
- **GitHub-repoer**: navikt/{repo} — ett eller flere repoer som utgjør systemet
- **Gjennomgangstype**: Ny PVK eller oppdatering av eksisterende?

Hent NAIS-dokumentasjonen som kontekst:
```
web_fetch https://docs.nais.io
```

### Forberedelse B: Ingen pålogging nødvendig for lesing

Lesekall bruker den naisdevice-beskyttede interne ingressen og krever ingen SSO-cookies:
- **Les**: `https://etterlevelse-api.intern.nav.no/api/` — ingen auth (krever naisdevice)
- **Skriv**: `https://etterlevelse-api.intern.nav.no/api/` — SSO-cookies påkrevd
- **Behandlingskatalog (les)**: `https://behandlingskatalog-backend.intern.nav.no/api/` — ingen auth

`*.ansatt.nav.no`-ingressene er internett-eksponert og beskyttet av forwardauth. Bruk alltid
`*.intern.nav.no` for API-kall fra skillen.

Fortsett direkte til Forberedelse C uten å be om innlogging. Cookies hentes rett før
opplasting (se API-seksjonens «Viktige regler»).

### Forberedelse C: Hent eksisterende data

#### C1: Hent etterlevelsesdokumentasjonen
```
GET /api/etterlevelsedokumentasjon/{dok-id}
```
Viktige felter: `title`, `behandlingIds[]`, `teams[]`, `behandlerPersonopplysninger`,
`risikovurderinger[]` (TryggNok ROS-lenker), `risikoeiere[]`, `nomAvdelingId`.

#### C2: Sjekk om PVK allerede finnes
```
GET /api/pvkdokument?pageSize=100
```
Filtrer responsen client-side: `item.etterlevelseDokumentId == {dok-id}`.

**VIKTIG:** Query-parametere filtrerer IKKE — endepunktet returnerer ALLE PVK-dokumenter
globalt. Du må filtrere manuelt. Paginer med `pageNumber=0,1,...` ved behov.

Hvis PVK finnes, hent også:
```
GET /api/risikoscenario/pvkdokument/{pvk-id}/ALL
GET /api/tiltak/pvkdokument/{pvk-id}
GET /api/behandlingenslivslop?pageSize=100  (filtrer client-side på etterlevelseDokumentasjonId)
```

#### C3: Hent data fra Behandlingskatalogen

For hver `behandlingId` fra etterlevelsesdokumentasjonen:
```
GET https://behandlingskatalog-backend.intern.nav.no/api/process/{behandling-id}
```

**Behandlingsnummer:** Hver behandling har et nummer Bxxx (f.eks. B580). Bruk feltet `number`
fra API-responsen. Referer alltid til behandlinger med dette nummeret, ikke UUID-en.

Viktige felter for PVK:
- `policies[]` — personopplysningstyper, personkategorier, sensitivitet
- `legalBases[]` — rettslig grunnlag (art. 6, art. 9)
- `retention.retentionMonths` — lagringstid
- `dpia.needForDpia`, `dpia.refToDpia` — DPIA-vurdering
- `dataProcessing.processors[]` — databehandlere (bruk `/api/processor/{id}` for detaljer)
- `automaticProcessing`, `profiling` — automatisert behandling/profilering

#### C4: Hent TryggNok ROS (hvis tilgjengelig)

Se `risikovurderinger`-feltet på etterlevelsesdokumentasjonen for lenker.
TryggNok er en PowerApps-app som ikke kan scrapes — be bruker oppsummere
nøkkelfunn (identifiserte risikoer, tiltak, restrisikoer).

### Forberedelse D: Inspiser kildekode

Bruk explore-agenter parallelt for å analysere repoene. Fokusér på personvernrelevante funn:

**Dataflyter og personopplysninger:**
- Hvilke personopplysninger lagres? (database-skjema, entities, DTOs)
- Sensitive kategorier? (helse, straffedom, art. 9-data)
- Hvor flyter data? (inngang → prosessering → lagring → utlevering)
- Dataminimering — lagres mer enn nødvendig?

**Tilgangskontroll:**
- Autentisering (ID-porten, Azure AD, TokenX)
- Autorisasjon (roller, tilgangsbegrensninger, kontorsperre)
- Auditlogging (hvem har tilgang til hva)

**Databehandlere og tredjeparter:**
- Kafka-integrasjoner (hvilke topics, hvilke data, retention)
- API-kall til eksterne tjenester
- Cloudleverandører (GCP, Aiven)

**Lagringstid og sletting:**
- Retention-mekanismer i kode og Kafka topic config (retentionHours)
- Kassering/pseudonymisering

### Forberedelse E: Verifiser mot NAIS-plattformen

Sjekk `nais.yaml`-filer i repoene mot NAIS-docs:
```
web_fetch https://docs.nais.io
```
Relevante NAIS-features: Cloud SQL (private IP, kryptering), ID-porten sidecar,
Azure AD, TokenX, Network policies, Kafka (Aiven).

---

## PVK-veiviseren (8 steg)

Etter forberedelsene, generer en rapport strukturert etter veiviserens 8 steg.
Rapporten skal inneholde forslag til innhold for hvert steg, slik at teamet kan
kvalitetssikre før opplasting.

### PVK Steg 1: Oversikt og status

**Formål:** Vise status og helhetsbilde for PVK-en.

**Hva agenten gjør:** Oppsummerer status basert på innhentet data:
- PVK-status (UNDERARBEID / SENDT_TIL_PVO / etc.)
- Antall risikoscenarioer (generelle vs krav-spesifikke)
- Antall tiltak (iverksatt vs ikke-iverksatt)
- Kompletthetssjekk: er alle veivisersteg fylt ut?

**API-felter (kun lesing):** `status`, `stemmerPersonkategorier`,
`personkategoriAntallBeskrivelse`, `tilgangsBeskrivelsePersonopplysningene`,
`lagringsBeskrivelsePersonopplysningene`, `harInvolvertRepresentant`,
`representantInvolveringsBeskrivelse`, `harDatabehandlerRepresentantInvolvering`,
`dataBehandlerRepresentantInvolveringBeskrivelse`

**Steg 1 er read-only i UI — ingen skriveoperasjoner.**

### PVK Steg 2: Behandlingens livsløp

**Formål:** Beskrive hvordan personopplysninger flyter gjennom systemet.

**Hva agenten gjør:** Basert på kodegjennomgang (forberedelse D), generer en
beskrivelse av behandlingens livsløp:
- Hvilke personopplysninger samles inn og fra hvem
- Hvordan de prosesseres (automatisk/manuelt)
- Hvor de lagres og sendes videre (Kafka, API-er, databaser)
- Dataflytdiagram (mermaid/ascii)

#### Figurer og diagrammer

Livsløp-steget støtter opplasting av inntil 4 filer (PDF, PNG, JPG/JPEG, maks 5 MB per fil).
Gode figurer gjør PVK-en langt mer tilgjengelig.

**Spør alltid bruker først:**
- Har du eksisterende figurer, arkitekturdiagrammer eller skjermbilder du vil ha med?
- Finnes det lenker til intern dokumentasjon (Confluence, Miro, Figma) med relevante diagrammer?
- Finnes det en gammel PVK (Word/PDF) med figurer som kan gjenbrukes?

**Lag egne diagrammer ved behov:** Agenten kan generere diagrammer basert på kodeanalysen:
- **Livsløpsdiagram:** Tilstandene personopplysninger går gjennom (innsamling → behandling → lagring → sletting)
- **Dataflytdiagram:** Hvem bruker systemet, hva lagres, hvor sendes data videre
- **Arkitekturdiagram:** Komponenter og sammenhenger

**Tilgjengelighet i figurer (VIKTIG):** PVK-lesere (PVO, risikoeiere) har ikke nødvendigvis
teknisk bakgrunn. Figurer må derfor:
- Bruke hverdagsspråk i bokser og piler («Bruker sender melding», IKKE «POST /api/dialog»)
- Unngå tekniske forkortelser uten forklaring
- Ha maks 8-10 bokser per diagram — splitt heller i flere figurer
- Bruke farger for å skille kategorier (brukerflater, lagring, tilknyttede systemer)
- Inkludere forklaring/legend

For å generere PNG-bilder kan du bruke:
- Python med `matplotlib`, `graphviz`, eller `PIL/Pillow` for å tegne diagrammer
- Mermaid CLI (`mmdc`) hvis tilgjengelig, eller konvertering via nettjeneste
- Enkel ASCII-art i beskrivelsen (rendres som rik tekst i dette feltet)

**Prioritering av 4 filplasser:**
1. Livsløps-/tilstandsdiagram (hvordan data oppstår, lever og dør)
2. Dataflyt-/arkitekturdiagram (systemer og integrasjoner)
3. Skjermbilder som viser behandlingen fra brukers perspektiv
4. Eventuelt eldre diagrammer fra eksisterende PVK/dokumentasjon

#### API: Separat entitet `behandlingenslivslop`

```
GET  /api/behandlingenslivslop?pageSize=100  -> filtrer på etterlevelseDokumentasjonId
GET  /api/behandlingenslivslop/{id}          -> hent en
PUT  /api/behandlingenslivslop/{id}          -> oppdater (multipart/form-data)
POST /api/behandlingenslivslop               -> opprett ny (multipart/form-data)
```

**Felter (R/W):**
- `etterlevelseDokumentasjonId` (UUID, påkrevd ved opprettelse)
- `beskrivelse` (string, markdown — hovedinnholdet, eneste felt som støtter rik tekst)
- `filer` (fil-array, multipart — PDF/PNG/JPG/JPEG, maks 4 filer, maks 5 MB per fil)
- `fpiPrinsipper` (string)

**Filopplasting via multipart/form-data:**
```bash
# Opprett med filer:
curl -X POST /api/behandlingenslivslop \
  -F "request=@request.json;type=application/json" \
  -F "filer=@diagram1.png;type=image/png" \
  -F "filer=@diagram2.png;type=image/png"

# Oppdater med nye filer (legges til eksisterende):
curl -X PUT /api/behandlingenslivslop/{id} \
  -F "request=@request.json;type=application/json" \
  -F "filer=@ny-figur.png;type=image/png"
```

`request`-delen er en JSON-blob med feltene `id`, `etterlevelseDokumentasjonId`, `beskrivelse`, `update: true` (for PUT).

**VIKTIG:** Denne entiteten bruker `multipart/form-data`, IKKE JSON.

### PVK Steg 3: Behandlingens art og omfang

**Formål:** Beskrive omfanget av personopplysningsbehandlingen og DPIA-triggere.

**Hva agenten gjør:** Basert på Behandlingskatalogen (C3) og kodegjennomgang:
- Verifiser personkategorier fra Behandlingskatalogen mot kode
- Beskriv antall berørte personer
- Beskriv hvem som har tilgang til personopplysningene
- Beskriv hvordan/hvor personopplysninger lagres
- Sett ytterligereEgenskaper (DPIA-triggere) på PvkDokument

**VIKTIG: Steg 3 lagres i en SEPARAT entitet `BehandlingensArtOgOmfang`, IKKE i PvkDokument!**
Kun `ytterligereEgenskaper` ligger på PvkDokument.

**API: BehandlingensArtOgOmfang (separat entitet)**
```
GET  /api/behandlingens-art-og-omfang/etterlevelsedokument/{dok-id}  -> hent per dok
GET  /api/behandlingens-art-og-omfang/{id}                          -> hent en
POST /api/behandlingens-art-og-omfang                               -> opprett (JSON)
PUT  /api/behandlingens-art-og-omfang/{id}                          -> oppdater (JSON, krever version)
```

**BehandlingensArtOgOmfang-felter (R/W):**
- `etterlevelseDokumentasjonId` (UUID, påkrevd ved opprettelse)
- `stemmerPersonkategorier` (bool — bekrefter personkategorier fra Behandlingskatalogen)
- `personkategoriAntallBeskrivelse` (string — antall registrerte per kategori)
- `tilgangsBeskrivelsePersonopplysningene` (string — roller, tilgangsnivåer, antall)
- `lagringsBeskrivelsePersonopplysningene` (string — lagringssted, varighet, kryptering)

**PvkDokument-felter for steg 3 (R/W):**
- `ytterligereEgenskaper` (string[] — DPIA-trigger-koder, lagres på PvkDokument)

**ytterligereEgenskaper-koder:**

| Kode | Beskrivelse |
|------|-------------|
| `PERSONOPPLYSNINGER_BEHANDLES` | Personopplysninger behandles i stor skala |
| `TILGANGER_TIL_TJENESTE` | Behandlingen tillater/endrer/nekter tilgang til tjeneste/avtale |
| `MATCHING_ELLER_SAMMENSTILLING` | Matching eller sammenstilling av datasett |
| `SAARBARE_PERSONOPPLYSNING` | Personopplysninger om sårbare registrerte (barn, etc.) |
| `SYSTEMATISK_OVERVAAKNING` | Systematisk overvåkning/monitorering i stor skala |
| `BRUK_AV_TEKNOLOGI` | Bruk av ny teknologi (fingeravtrykk, ansiktsgjenkjenning mv.) |

### PVK Steg 4: Tilhørende dokumentasjon

**Formål:** Verifisere at nødvendig dokumentasjon er på plass.

**Hva agenten gjør:** Sjekk at følgende er komplett:
- Behandling(er) er koblet i Behandlingskatalogen (`behandlingIds.length > 0`)
- Risikovurdering(er) er koblet (`risikovurderinger.length > 0`)
- PVK-relaterte etterlevelseskrav er besvart (krav tagget med "Personvernkonsekvensvurdering")

**For å hente PVK-krav (listen over 19 krav):** Bruk GraphQL:
```graphql
POST https://etterlevelse-api.intern.nav.no/graphql
Content-Type: application/json

{
  krav(filter: { gjeldendeKrav: true, tagger: ["Personvernkonsekvensvurdering"],
    etterlevelseDokumentasjonId: "{dok-id}" }) {
    content { kravNummer kravVersjon navn status }
  }
}
```

**For å sjekke etterlevelse-status per krav:**

**VIKTIG:** REST-endepunktet `/api/etterlevelse` filtrerer IKKE på `etterlevelseDokumentasjonId` —
det returnerer alle etterlevelser globalt. Bruk i stedet GraphQL via etterlevelseDokumentasjon:
```graphql
POST https://etterlevelse-api.intern.nav.no/graphql
Content-Type: application/json

{
  etterlevelseDokumentasjon(filter: { id: "{dok-id}" }) {
    content { etterlevelser { kravNummer kravVersjon status } }
  }
}
```
Kryss-referer kravNummer fra de to spørringene for å finne status per PVK-krav.

**Steg 4 er primært lesing/validering — ingen skriveoperasjoner mot PVK.**

### PVK Steg 5: Involvering av eksterne

**Formål:** Dokumentere om representanter for registrerte og databehandlere er involvert.

**Hva agenten gjør:** Basert på Behandlingskatalogen:
- List personkategorier (fra policies[].subjectCategories)
- List databehandlere (fra dataProcessing.processors[])
- Foreslå beskrivelser for involvering/manglende involvering

**PvkDokument-felter (R/W):**
- `harInvolvertRepresentant` (bool)
- `representantInvolveringsBeskrivelse` (string)
- `harDatabehandlerRepresentantInvolvering` (bool)
- `dataBehandlerRepresentantInvolveringBeskrivelse` (string)

### PVK Steg 6: Identifisering av risikoscenarioer og tiltak

**Formål:** Identifisere personvernrisikoer og foreslå tiltak.

**Hva agenten gjør:** Basert på kodegjennomgang (D) og NAIS-verifisering (E):
- Identifiser risikoscenarioer med personvernkonsekvens
- Vurder sannsynlighet og konsekvens FØR tiltak (1-5)
- Foreslå tiltak med ansvarlig team og frist

#### Generelle vs krav-spesifikke scenarioer

Risikoscenarioer har to typer basert på `generelScenario`-feltet:

| Type | `generelScenario` | Kravkobling | Når brukes det |
|------|-------------------|-------------|----------------|
| **Krav-spesifikt** | `false` | Ja (`relevanteKravNummer`) | Risiko knyttet direkte til et etterlevelseskrav |
| **Øvrig/generelt** | `true` | Nei (tom liste) | Helhetlig personvernrisiko som ikke hører under ett krav |

**Øvrige scenarioer** er bevisst UTEN kravkobling — de beskriver risikoer som
angår behandlingen som helhet (f.eks. «bruker havner på feil kontor»). Ikke forsøk
å koble disse til krav med mindre teamet eksplisitt ønsker det.

**Kryssreferanser i rapport:** Selv om generelle scenarioer ikke kobles formelt,
bør rapporten notere hvilke krav de *tangerer*. Teamet kan da vurdere om referansen
bør nevnes i etterlevelseskravenes begrunnelser
(f.eks. «Se PVK for risikovurdering av automatisk kontortilordning» i K107).

#### Avgrensning mot TryggNok ROS

NAV bruker TryggNok (PowerApps) for teknisk risikovurdering (ROS). PVK skal fokusere
på **personvernkonsekvenser**, ikke generell IT-sikkerhet:

| Funn | Hører hjemme i | Eksempel |
|------|---------------|----------|
| Konsekvens for de registrerte | **PVK** | Feil kontortilordning, data på avveie |
| Teknisk sårbarhet uten personvernkonsekvens | **TryggNok ROS** | CSP-headere, DoS |
| Teknisk funn MED personvernkonsekvens | **Begge** | Kafka retention med FNR |

#### API for risikoscenarioer

**Risikoscenario-felter:** `pvkDokumentId`, `navn`, `beskrivelse`,
`sannsynlighetsNivaa` (1-5), `sannsynlighetsNivaaBegrunnelse`,
`konsekvensNivaa` (1-5), `konsekvensNivaaBegrunnelse`,
`generelScenario` (bool), `ingenTiltak` (bool)

**Hent scenarioer for en PVK:**
```
GET /api/risikoscenario/pvkdokument/{pvk-id}/ALL
```
Returnerer alle scenarioer (generelle + krav-spesifikke) for den gitte PVK-en.
Typene er `ALL`, `GENERAL` (kun generelle) og `KRAV` (kun krav-spesifikke).

⛔ **Bruk IKKE** `GET /api/risikoscenario?pvkDokumentId=X` — denne parameteren
filtrerer IKKE server-side og returnerer alle 650+ scenarioer på tvers av alle PVK-er.

**Opprett scenario:** `POST /api/risikoscenario`
```json
{
  "pvkDokumentId": "...", "navn": "...", "beskrivelse": "...",
  "sannsynlighetsNivaa": 2, "sannsynlighetsNivaaBegrunnelse": "...",
  "konsekvensNivaa": 2, "konsekvensNivaaBegrunnelse": "...",
  "generelScenario": false, "ingenTiltak": false,
  "sannsynlighetsNivaaEtterTiltak": 0, "konsekvensNivaaEtterTiltak": 0,
  "nivaaBegrunnelseEtterTiltak": "", "tiltakOppdatert": false
}
```
⛔ **IKKE inkluder `relevanteKravNummer` i POST-body** — feltet strippes av backend
(og av `tiltakIds`) og ignoreres fullstendig. Kravkoblinger MÅ settes via eget endepunkt.

**Kravkobling — ENESTE fungerende metode:**
```
PUT /api/risikoscenario/update/addRelevantKrav
Body: { "kravnummer": 113, "risikoscenarioIder": ["uuid1", "uuid2"] }
```
- Kall én gang per krav, med alle scenarioer som skal knyttes i `risikoscenarioIder`
- Scenarioet kan knyttes til flere krav: kall endepunktet én gang per krav
- Alternativt: `POST /api/risikoscenario/krav/{kravnummer}` for å opprette OG
  koble i én operasjon (for scenarioer med kun ett krav)

**Fjern kravkobling:**
`PUT /api/risikoscenario/{id}/removeKrav/{kravnummer}`

#### API for tiltak

**Tiltak opprettes ALLTID under et risikoscenario:**
`POST /api/tiltak/risikoscenario/{scenario-id}`

**⛔ KRITISK DTO-FORSKJELL ved POST/PUT:** Backend forventer `ansvarlig` og `ansvarligTeam`
som **strenger** (henholdsvis NAV-ident og team-UUID), IKKE som objekter slik GET returnerer:

```json
{
  "pvkDokumentId": "...",
  "navn": "...",
  "beskrivelse": "...",
  "ansvarlig": "E102227",
  "ansvarligTeam": "1ad2c9ea-3221-4666-93f3-fe6f7cae94ef",
  "frist": "2026-08-01",
  "iverksatt": false,
  "iverksattDato": null
}
```

Sender du objekter (slik GET-responsen ser ut) får du `400 Bad Request`.
Fjern også `changeStamp`, `version`, og `risikoscenarioIds` fra body — disse settes av backend
(koblingen til scenario kommer fra URL-en).

**Andre endepunkter:**
- `GET /api/tiltak/{id}` — hent enkelt-tiltak (returnerer ansvarlig/ansvarligTeam som objekter)
- `GET /api/tiltak/pvkdokument/{pvk-id}` — alle tiltak for en PVK
- `PUT /api/tiltak/{id}` — oppdater (samme DTO-konvensjon: strenger)
- `DELETE /api/tiltak/{id}` — slett tiltak
- `/api/tiltak` (collection) støtter KUN GET — POST gir 405.
- `/api/tiltak/{id}` med id=`new` gir 400 (UUID-validering). Ikke gjør dette.

**Slå opp NAV-ident:** `GET /api/team/resource/search/{søkeord}` returnerer
`{content: [{navIdent, fullName, email, ...}]}`.

**Frist:** Påkrevd for tiltak som ikke er iverksatt. For iverksatte tiltak (`iverksatt: true`)
er frist valgfri — `iverksattDato` settes automatisk.

### PVK Steg 7: Risikobildet etter tiltak

**Formål:** Vurdere restrisiko etter at tiltak er identifisert.

**Hva agenten gjør:** For hvert risikoscenario fra steg 6:
- Vurder sannsynlighet og konsekvens ETTER tiltak (1-5)
- Begrunn endringen
- Generer risikomatrise (oppsummering)

**Risikoscenario tilleggsfelter (via PUT):**
- `sannsynlighetsNivaaEtterTiltak` (int 1-5)
- `konsekvensNivaaEtterTiltak` (int 1-5)
- `nivaaBegrunnelseEtterTiltak` (string)

**Risikomatrise (5x5):**
```
            Konsekvensnivå
S.nivå   1    2    3    4    5
  1      LAV  LAV  LAV  MOD  MOD
  2      LAV  LAV  MOD  MOD  HØY
  3      LAV  MOD  MOD  HØY  HØY
  4      MOD  MOD  HØY  HØY  KRIT
  5      MOD  HØY  HØY  KRIT KRIT
```

### PVK Steg 8: Les og send inn

**Formål:** Sammenstille alt, validere, og evt. sende til PVO.

**Valideringssjekker (samme som UI):**
1. BehandlingensLivslop har innhold (beskrivelse eller filer)
2. Minst 1 risikoscenario opprettet
3. Alle risikoscenarioer er ferdig vurdert (nivåer satt)
4. Alle tiltak har: navn, beskrivelse, ansvarlig/team, frist
5. Nivåer etter tiltak er satt for alle scenarioer
6. Alle PVK-krav er besvart i etterlevelsen
7. Risikoeier er satt på etterlevelsesdokumentasjonen
8. Team/ressurser er satt
9. Behandling(er) er koblet

**Agenten setter ALDRI status til SENDT_TIL_PVO.** Teamet beslutter selv.

---

### Tilbakemelding til PVO (meldingerTilPvo)

Når en PVK sendes til PVO, eller returneres til PVO etter PVOs vurdering
(`VURDERT_AV_PVO` → `SENDT_TIL_PVO_FOR_REVURDERING`), legges en melding på PVK-dokumentet
i `meldingerTilPvo`-arrayen. Hver melding har **to separate tekstfelter** som UI-et viser
som hver sin tekstboks:

| Felt | UI-label | Innhold |
|---|---|---|
| `merknadTilPvo` | «Forklar hvorfor dere ønsker å sende inn til ny vurdering» | Bakgrunn, oppfølgingsspørsmål til PVO, avklaringer |
| `endringsNotat` | «Oppsummer hvilke endringer som er gjort siden siste tilbakemelding fra PVO» | Konkret diff/changelog over endrede scenarioer, tiltak og kravbesvarelser |

**Ikke putt alt i `merknadTilPvo` — splitt riktig.** PVO leser feltene i hvert sitt
visningspanel.

**Melding-objekt:**
```json
{
  "innsendingId": 2,
  "merknadTilPvo": "...",
  "endringsNotat": "...",
  "sendtTilPvoDato": "",          // tom = utkast
  "sendtTilPvoAv": "",            // tom = utkast
  "etterlevelseDokumentVersjon": 1
}
```

**innsendingId-konvensjon:**
- Første melding har `innsendingId: 1`
- Hver ny melding får `pvkDokument.antallInnsendingTilPvo + 1`
- `antallInnsendingTilPvo` økes **kun** når meldingen faktisk sendes (sendt-feltene fylles)
- Et utkast (tomme sendt-felter) påvirker ikke `antallInnsendingTilPvo`

**Utkast vs sendt:**
- **Utkast (lagre, ikke send):** sett `sendtTilPvoDato = ""` og `sendtTilPvoAv = ""`. PVK-status forblir uendret.
- **Sendt:** sett `sendtTilPvoDato = "2026-05-21T10:00:00"` og `sendtTilPvoAv = "EXXXXXX - Navn"`.
  PVK-status oppdateres separat (f.eks. til `SENDT_TIL_PVO_FOR_REVURDERING`).

**Lagre melding:** Det finnes ikke et dedikert melding-endpoint. Du lagrer ved å gjøre
en PUT på hele PvkDokument:
```
PUT /api/pvkdokument/{pvk-id}
```
med den oppdaterte `meldingerTilPvo`-arrayen (eksisterende meldinger + ny entry).

**KRITISK DTO-transform før PUT (gir 400 ellers):**
1. **`ytterligereEgenskaper`** returneres som `[{code, ...}]` fra GET, men MÅ sendes som
   `["KODE1", "KODE2"]` (array av strenger). Map: `e.code if isinstance(e, dict) else e`
2. **Fjern** `changeStamp`, `version`, `currentEtterlevelseDokumentVersjon` fra body
3. Behold alle andre felter (inkl. `meldingerTilPvo` med ny entry tilføyd)

Feilen `"JSON parse error: Cannot deserialize value of type 'java.lang.String' from Object value (token 'JsonToken.START_OBJECT')"` betyr nesten alltid at `ytterligereEgenskaper` ble sendt som objekter.

**Agenten sender ALDRI selv (setter ikke sendt-felter).** Lagre alltid som utkast og la
teamet trykke «Send inn» i UI-et, eller bekrefte eksplisitt at de vil sende.

---

### Tilbakemelding til risikoeier (merknadTilRisikoeier)

Når PVK skal sendes til **risikoeier** for godkjenning (alternativ flyt når PVO har
godkjent under forutsetninger og teamet ikke skal sende ny PVO-runde), bruker man feltet
`merknadTilRisikoeier` direkte på PVK-dokumentet:

| Felt | UI-label | Innhold |
|---|---|---|
| `merknadTilRisikoeier` | «Oppsummer for risikoeieren eventuelle endringer gjort som følge av PVOs tilbakemelding» | Lederrettet oppsummering av behandlingen, vurderingen, PVOs tilbakemelding og hvordan den er adressert, samt gjenstående arbeid |
| `merknadFraRisikoeier` | «Risikoeiers begrunnelse for godkjenning av restrisiko» | Fylles av risikoeier i UI — ikke av agenten |
| `godkjentAvRisikoeierDato` / `godkjentAvRisikoeier` | (settes ved godkjenning) | Settes av UI når risikoeier godkjenner |

Lagring: PUT på hele PvkDokument (samme DTO-transform som beskrevet over).

**Tonen i `merknadTilRisikoeier`** bør være lederrettet og ikke-teknisk: forklar
hva behandlingen er, hovedkonklusjon, hvordan PVOs bemerkninger er håndtert, og hva
som gjenstår — nok til at risikoeier kan ta en informert beslutning uten å lese hele PVK-en.

Feltet rendres som **markdown** (jf. punkt 9 i Datamodell-avsnittet). Bruk `**fet**` for
viktige tall/hjemler, `## ` for seksjoner, `- ` for lister.

**Agenten setter ALDRI status til TRENGER_GODKJENNING** (sender til risikoeier) eller
til GODKJENT_AV_RISIKOEIER — disse overgangene må gjøres i UI-et.

---

## PVK-statusmaskin

```
UNDERARBEID
  -> SENDT_TIL_PVO            (team sender til personvernombud)
    -> PVO_UNDERARBEID         (PVO jobber med vurdering)
      -> VURDERT_AV_PVO        (PVO ferdig, godkjent)
      -> VURDERT_AV_PVO_TRENGER_MER_ARBEID  (PVO krever endringer)
        -> SENDT_TIL_PVO_FOR_REVURDERING    (team sender på nytt)
    -> TRENGER_GODKJENNING     (venter på risikoeier)
      -> GODKJENT_AV_RISIKOEIER (risikoeier godkjent)
    -> AKTIV                   (PVK er aktiv og gjeldende)
```

---

## API-referanse

Base URL (les): `https://etterlevelse-api.intern.nav.no/api/`
Base URL (skriv): `https://etterlevelse-api.intern.nav.no/api/` (krever SSO-cookies fra `etterlevelse.intern.nav.no`)

### PvkDokument
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/pvkdokument?pageSize=100` | List alle (filtrer client-side) |
| GET | `/pvkdokument/{id}` | Hent en |
| POST | `/pvkdokument` | Opprett ny |
| PUT | `/pvkdokument/{id}` | Oppdater (krever `version`) |
| DELETE | `/pvkdokument/{id}` | Slett |

**VIKTIG feltnavn:** PvkDokument bruker `etterlevelseDokumentId` (IKKE `etterlevelseDokumentasjonId`).
BehandlingensLivslop og BehandlingensArtOgOmfang bruker `etterlevelseDokumentasjonId`.

**URL i nettleseren:**
`https://etterlevelse.intern.nav.no/dokumentasjon/{dok-id}/pvkdokument/{pvk-id}?steg=1`

### BehandlingensLivslop (Steg 2)
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/behandlingenslivslop?pageSize=100` | List alle (filtrer client-side) |
| POST | `/behandlingenslivslop` | Opprett (multipart/form-data) |
| PUT | `/behandlingenslivslop/{id}` | Oppdater (multipart/form-data) |

### BehandlingensArtOgOmfang (Steg 3 — separat entitet!)
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/behandlingens-art-og-omfang/etterlevelsedokument/{dok-id}` | Hent per dok |
| GET | `/behandlingens-art-og-omfang/{id}` | Hent en |
| POST | `/behandlingens-art-og-omfang` | Opprett (JSON) |
| PUT | `/behandlingens-art-og-omfang/{id}` | Oppdater (JSON, krever `version`) |

**Felter:** `etterlevelseDokumentasjonId`, `stemmerPersonkategorier` (bool),
`personkategoriAntallBeskrivelse`, `tilgangsBeskrivelsePersonopplysningene`,
`lagringsBeskrivelsePersonopplysningene`

### Risikoscenario
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/risikoscenario/pvkdokument/{pvkId}/{type}` | List (ALL/GENERAL/KRAV) |
| GET | `/risikoscenario/{id}` | Hent en |
| GET | `/risikoscenario/kravnummer/{nr}` | List per krav |
| POST | `/risikoscenario` | Opprett |
| POST | `/risikoscenario/krav/{kravnr}` | Opprett med kravkobling |
| PUT | `/risikoscenario/{id}` | Oppdater |
| PUT | `/risikoscenario/update/addRelevantKrav` | Koble krav |
| PUT | `/risikoscenario/{id}/removeKrav/{nr}` | Fjern kravkobling |
| PUT | `/risikoscenario/update/addRelevanteTiltak` | Koble tiltak |
| PUT | `/risikoscenario/{id}/removeTiltak/{tiltakId}` | Fjern tiltakskobling |
| DELETE | `/risikoscenario/{id}` | Slett |

### Tiltak
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/tiltak/pvkdokument/{pvkId}` | List per PVK |
| GET | `/tiltak/{id}` | Hent en |
| POST | `/tiltak/risikoscenario/{scenarioId}` | Opprett under scenario |
| PUT | `/tiltak/{id}` | Oppdater (krever `id` i body) |
| DELETE | `/tiltak/{id}` | Slett |

### Viktige regler

1. **Optimistisk låsing**: PUT krever fersk `version`-felt
2. **SSO-cookies for skriving**: Hent disse rett før første PUT/POST-kall. Be bruker om:
   - Åpne https://etterlevelse.intern.nav.no/ og logg inn
   - DevTools → Application → Cookies → kopier `etterlevsession` og `sso-nav.no`
   - Bekreft med: `curl -s -o /dev/null -w "%{http_code}" https://etterlevelse-api.intern.nav.no/api/pvkdokument?pageSize=1 -H "Cookie: etterlevsession=...; sso-nav.no=..."`
   - 200 = OK, 302/401 = utløpt
3. **relevanteKravNummer**: Styres via `PUT /risikoscenario/update/addRelevantKrav` med body
   `{ "kravnummer": <int>, "risikoscenarioIder": ["uuid1","uuid2",...] }`.
   Merk: feltnavn er `kravnummer` (lowercase!) og `risikoscenarioIder` (liste av UUIDs).
   Scenarioer bør kobles til krav (generelScenario: false) når mulig — bare bruk generelScenario: true
   for risikoer som genuint ikke har en kravkobling.
4. **Tiltak opprettes under scenario**: POST til `/tiltak/risikoscenario/{id}`, IKKE til `/tiltak`
5. **Status**: Agenten setter UNDERARBEID — teamet bestemmer SENDT_TIL_PVO
6. **BehandlingensLivslop**: Multipart/form-data med JSON-blob i `request`-del, IKKE ren JSON.
   Bruk: `-F "request=@file.json;type=application/json"` eller tilsvarende FormData.
6b. **BehandlingensLivslop JSON MÅ inneholde `"filer": []`** selv uten vedlegg.
   Backend krasjer med NullPointerException (`Cannot invoke "java.util.List.stream()"`) hvis `filer` er null.
7. **Steg 3-data**: Lagres i `BehandlingensArtOgOmfang`, IKKE i PvkDokument (kun ytterligereEgenskaper på PvkDokument)
8. **antallInnsendingTilPvo**: MÅ settes til `0` (ikke null) ved opprettelse/oppdatering.
   Hvis null, feiler frontenden med "Denne tilstanden finnes ikke" fordi `null === 0` er `false` i JS.
8b. **pvkVurdering**: MÅ settes ved opprettelse — bruk `"SKAL_UTFORE"` for nye PVK-er.
   Hvis null, viser frontenden «Denne tilstanden finnes ikke» i stedet for PVK-knappen.
   Gyldige verdier: `SKAL_UTFORE`, `ALLEREDE_UTFORT`, `SKAL_IKKE_UTFORE`, `UNDEFINED`.
8c. **PUT overskriver alle felter** — send ALLTID komplett objekt ved oppdatering.
   Felter som utelates settes til null/tom. Hent GET først, modifiser, fjern `changeStamp`, send PUT.
9. **Markdown-støtte er felt-spesifikk** (verifisert i frontend-koden):
   - **Markdown-rendret** (kan bruke `**fet**`, `*kursiv*`, `## overskrift`, `- liste`):
     - `BehandlingensLivslop.beskrivelse`
     - `meldingerTilPvo[].merknadTilPvo` og `meldingerTilPvo[].endringsNotat`
     - `merknadTilRisikoeier` og `merknadFraRisikoeier`
     - PVO-tilbakemeldingsfelter rendret med samme `<Markdown source={...}>`-komponent
   - **Ren tekst** (HTML/markdown vises som tegn): Art-og-omfang-felter, scenarioer (`navn`/`beskrivelse`),
     tiltak (`navn`/`beskrivelse`), involveringsbeskrivelser.
   - **Aldri bruk HTML** — feltene som rendrer markdown bruker `escapeHtml=true` i read-only-visning.
   - Når du er usikker: sjekk komponenten i `navikt/etterlevelse` (typisk `*ReadOnly.tsx`) — hvis verdien
     pakkes i `<Markdown source={...}>`, er det markdown.
10. **Tiltak-felter**: `ansvarligTeam` er en string (team-UUID), IKKE et objekt. `ansvarlig` er en string (NAV-ident), IKKE et objekt.
11. **Livsløp-filer**: Maks 4 filer, maks 5 MB per fil, tillatte formater: PDF, PNG, JPG, JPEG.
    Filer legges til via `filer`-parts i multipart-requesten. PUT ERSTATTER alle filer — du må laste opp
    alle filer du vil beholde på nytt, ikke bare de nye.
    Spør alltid bruker om de har egne figurer/diagrammer FØR du genererer nye.
    Generer egne diagrammer med Python (matplotlib/graphviz/PIL) når bruker ikke har egne,
    basert på funn fra kodegjennomgangen. Bruk klart, ikke-teknisk språk i figurene.

## Datamodell

```
EtterlevelseDokumentasjon (dok-id)
  |-- Etterlevelse[] (krav-begrunnelser)
  |-- BehandlingensLivslop (beskrivelse + filer) [steg 2]
  |-- BehandlingensArtOgOmfang [steg 3] ← SEPARAT entitet!
  |     (stemmerPersonkategorier, antall, tilgang, lagring)
  +-- PvkDokument (pvk-id) [steg 1,5,8 + ytterligereEgenskaper fra steg 3]
       |-- Risikoscenario[] [steg 6,7]
       |    |-- relevanteKravNummer -> krav
       |    +-- tiltakIds -> Tiltak[]
       +-- Tiltak[] [steg 6,7]
            +-- risikoscenarioIds -> scenarioer
```

## Modellvalg for deloppgaver

| Oppgave | Anbefalt modell | Begrunnelse |
|---|---|---|
| Kodegjennomgang med personvernvurdering (Forberedelse D) | `claude-opus-4.8` | Krever forståelse av kode OG personvernlovgivning |
| Identifisere og formulere risikoscenarioer (steg 6) | `claude-opus-4.8` | Kreativ risikovurdering med juridisk presisjon |
| Formulere tiltaksbeskrivelser (steg 6) | `claude-opus-4.8` | Konkrete tiltak må speile faktisk risiko |
| Hente data fra behandlingskatalog og etterlevelsesløsning | `claude-haiku-4.5` | Enkel datahenting og JSON-parsing |
| Steg 1–5: Oversikt, livsløp, art og omfang, dokumentasjon, involvering | `claude-haiku-4.5` | Strukturert utfylling av kjente felter |
| Steg 7: Oppdatere risikostatus etter tiltak (tallverdier) | `claude-haiku-4.5` | Mekanisk oppdatering av kjente API-felt |
| Steg 8: Sende inn PVK til PVO | `claude-haiku-4.5` | API-kall uten analytisk innhold |
