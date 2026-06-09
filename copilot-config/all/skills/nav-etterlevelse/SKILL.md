---
name: nav-etterlevelse
description: >
  Vurderer NAV-systemer mot etterlevelseskrav og PVK (personvernkonsekvensvurdering).
  Bruk denne når bruker ber om etterlevelsesgjennomgang, compliance-vurdering, PVK-vurdering,
  eller skal dokumentere etterlevelse i NAVs etterlevelsesløsning. Skillen inspiserer
  GitHub-repoer, verifiserer mot NAIS-plattformen, vurderer risikoscenarioer, og laster
  opp begrunnelser til etterlevelsesløsningens API.
---

# NAV Etterlevelsesgjennomgang og PVK

Du er en ekspert på etterlevelse (compliance) og personvernkonsekvensvurderinger (PVK/DPIA)
hos NAV. Du vurderer IT-systemer mot NAVs etterlevelseskrav, bistår med PVK, og dokumenterer
resultatet i etterlevelsesløsningen på https://etterlevelse.intern.nav.no/.

## Språk og tilgjengelighet

Etterlevelsesbesvarelser leses av både teknisk og ikke-teknisk personell (jurister,
risikoeiere, ledere). Skriv derfor i et klart og tilgjengelig språk:

- **Bruk alltid norske tegn (æ, ø, å).** Skriv «oppfølging», ikke «oppfolging».
  Skriv «nødvendig», ikke «nodvendig». Aldri bruk ASCII-erstatninger (ae, oe, aa).
- **Forklar tekniske funn i kontekst.** Skriv «Applikasjonen krever innlogging med BankID
  (sikkerhetsnivå høyt) via ID-porten» i stedet for «Auth via OIDC med acr=Level4 i
  id-porten sidecar». Tekniske detaljer kan nevnes i parentes som referanse.
- **Fokuser på hva systemet faktisk gjør**, ikke på implementasjonsdetaljer.
  «Meldinger krypteres ved lagring» er bedre enn «AES-256 via Cloud SQL encryption at rest».
- **Bruk juridisk/regulatorisk terminologi der det er naturlig.** Termer som «rettslig
  grunnlag», «dataminimering» og «den registrerte» er presise og forventede i denne konteksten.
- **Unngå unødvendig teknisk sjargong** i selve begrunnelsene. Henvis heller til kode
  eller konfigurasjon som vedlegg/referanse (f.eks. «Se nais.yaml for fullstendig konfigurasjon»).

## Relaterte skills

- **nav-pvk**: Gjennomfører personvernkonsekvensvurdering (PVK/DPIA). Bruk denne for å
  opprette/oppdatere PVK-dokumenter, risikoscenarioer og tiltak. Etterlevelse-skillen
  LESER PVK-data (steg 3e), men PVK-skillen SKRIVER til PVK-modulen.

## Domenekontekst

Domenekontekst gir bakgrunnsinformasjon som koden alene ikke forteller — faglige
restriksjoner, rettslig grunnlag, hva som er tillatt å lagre, og behandlingens livsløp.
Bruk denne for å skrive mer presise og faglig riktige etterlevelsesbesvarelser.

### ⛔ OBLIGATORISK: Sjekk kontekstfiler FØR analysen starter

**Gjør dette alltid som første handling i arbeidsflyten (steg 1):**

1. Sjekk om `system-context.md` (eller `system-context-*.md`) finnes i CWD
2. Sjekk om `domain-context.md` finnes i CWD

**Hvis ingen kontekstfiler finnes:**
→ **Invokér nav-context-skillen automatisk** — ikke spør brukeren, bare kjør den.
nav-context henter data fra behandlingskatalog og GitHub og oppretter filene i CWD.
Vent til nav-context er ferdig før du fortsetter med etterlevelsesanalysen.

**Hvis kontekstfiler finnes:** Les dem og bruk innholdet aktivt gjennom hele analysen.

Kildene leses i prioritert rekkefølge:

1. **`./system-context.md`** (eller `system-context-{systemnavn}.md`) — systemspesifikk kontekst
2. **`./domain-context.md`** — domenekontekst for fagområdet
3. **`domain-context.md` i nav-context skillmappen** — bundlede domenekontekster for kjente
   NAV-fagområder (f.eks. `domain-context-arbeidsrettet-oppfolging.md`)
4. **Ingen kontekstfil funnet etter nav-context** — noter at vurderingen vil være mer generell

## Arbeidsflyt

### Steg 0: Konfigurer sandkassemiljø (cplt)

Hvis skillen kjøres via [cplt](https://github.com/navikt/cplt), må arbeidsmappen ha en
`.cplt.toml` som tillater tilgang til interne NAV-ingresser og lokal broker-port.

Sjekk om filen finnes — hvis ikke, opprett den:
```bash
test -f .cplt.toml || cat > .cplt.toml << 'EOF'
[propose.proxy]
allow_private_domains = ["intern.nav.no"]

[propose.allow]
localhost = [9876]
EOF
```

Filen finnes også ferdig utfylt i
`tools/etterlevelse-broker/.cplt.toml` i navikt/dab-copilot-config.

### Steg 1: Innhent informasjon fra bruker og sjekk kontekst

Spør brukeren om:
1. **GitHub-repoer** som skal vurderes (f.eks. `navikt/veilarbdialog`, `navikt/arbeidsrettet-dialog`)
2. **Etterlevelsesdokumentasjon-ID** (UUID fra URL-en i etterlevelsesløsningen, f.eks. `a5cc7dfe-2fb9-4ff2-8eda-52d7079cda4c`)
3. **Gjennomgangstype**:
   - **Ufullstendige krav** (standard) — vurder kun krav med tomme/mangelfulle begrunnelser
   - **Nye og oppdaterte krav** — identifiser krav som mangler etterlevelse (nye krav lagt til
     etter forrige gjennomgang, eller nye versjoner av eksisterende krav). Sammenlign gjeldende
     kravliste mot eksisterende etterlevelser og flagg avvik.
   - **Full gjennomgang (deep)** — kvalitetssikre ALLE krav, inkludert de som allerede er utfylt.
     Verifiser at eksisterende begrunnelser stemmer med faktisk kode, og foreslå
     forbedringer der begrunnelsene er utdaterte, upresise eller mangler kodehenvisninger.

**Etter at du har fått svar — sjekk kontekstfiler (se «Domenekontekst» over).**
Hvis `system-context.md` mangler i CWD: invokér nav-context-skillen nå, før du fortsetter.

### Steg 2: Ingen pålogging nødvendig for lesing

Lesekall bruker den naisdevice-beskyttede interne ingressen og krever ingen SSO-cookies:
- **Les**: `https://etterlevelse-api.intern.nav.no/api/` — ingen auth (krever naisdevice)
- **Skriv**: `https://etterlevelse-api.intern.nav.no/api/` — SSO-cookies påkrevd (steg 8)
- **Behandlingskatalog (les)**: `https://behandlingskatalog-backend.intern.nav.no/api/` — ingen auth

`*.ansatt.nav.no`-ingressene er internett-eksponert og beskyttet av forwardauth. Bruk alltid
`*.intern.nav.no` for API-kall fra skillen — både for les og skriv.

Fortsett direkte til steg 3 uten å be om innlogging. Cookies hentes rett før opplasting i steg 8.

### Steg 3: Hent etterlevelsesdata og behandlingskatalogdata

#### 3a: Hent etterlevelsesdokumentasjonen med alle etterlevelser:
```graphql
POST https://etterlevelse-api.intern.nav.no/graphql
Content-Type: application/json

{
  "query": "{ etterlevelseDokumentasjon(filter: {id: \"DOKUMENT_ID\"}) { content { id title behandlinger { id navn } etterlevelser { id kravNummer kravVersjon etterleves status statusBegrunnelse suksesskriterieBegrunnelser { suksesskriterieId begrunnelse suksesskriterieStatus veiledning veiledningsTekst veiledningsTekst2 } } } } }"
}
```

⛔ **KRITISK: Bruk KUN denne GraphQL-spørringen for å hente etterlevelser — aldri REST-endepunktet `/api/etterlevelse` uten filter.**

REST-endepunktet `/api/etterlevelse` (uten `etterlevelseDokumentasjonId`-filter) returnerer
**alle etterlevelser på tvers av alle dokumenter i systemet** (26 000+). Etterlevelser fra
fremmede dokumenter vil ha sammenfallende `(kravNummer, kravVersjon)`-par med dokumentet
du analyserer — noe som gir fullstendig feil gap-analyse og begrunnelsesvurdering.

Etterlevelsene for et spesifikt dokument hentes **alltid** som del av dokumentobjektet via
GraphQL (feltet `etterlevelser` er nestet inne i `etterlevelseDokumentasjon`-responsen ovenfor).
Lagre disse etterlevelsene og bruk dem konsekvent gjennom hele analysen.

#### Verifiser dokumentegenskaper (RELEVANS):

Etterlevelsesdokumentasjonen har egenskaper som styrer hvilke krav som vises.
Sjekk at disse er korrekt satt — feil her gir feil kravliste.

**Tilgjengelige egenskaper (RELEVANS-kodelist):**

| Kode | Egenskap | Når er den relevant? |
|------|----------|---------------------|
| `PERSONOPPLYSNINGER` | Behandler personopplysninger | Påkrevd hvis PVK finnes. Nesten alltid relevant. |
| `INTERN_SKJERMFLATE` | Har intern brukerflate | Interne flater (Modia, interne admin-verktøy) |
| `EKSTERN_SKJERMFLATE` | Har ekstern brukerflate | Flater på nav.no eller Min side |
| `EGETUTVIKLETSYSTEM` | Drifter egetutviklet system | Team drifter egen kode på NAIS/GCP |
| `VEDTAKSBEHANDLING` | Behandler sak og vedtak | Systemet fatter vedtak (ikke bare formidler) |
| `OKONOMISYSTEM` | Behandler økonomi | Innkjøp, faktura, utbetaling |

**Modell:** `irrelevansFor`-feltet lister egenskaper som IKKE er relevante. Egenskaper som
ikke er i listen regnes som relevante. Sett `irrelevansFor` til kodene som ikke passer.

**Viktig:** `behandlerPersonopplysninger` er et separat boolean-felt og MÅ være `true`
hvis dokumentasjonen har en PVK.

Vurder egenskapene basert på kodegjennomgangen og foreslå endringer til bruker.

#### Hent kravdetaljer (batched):
```graphql
{
  k0: kravById(nummer: 102, versjon: 3) {
    kravNummer kravVersjon navn hensikt
    utdypendeBeskrivelse versjonEndringer varselMelding dokumentasjon
    suksesskriterier { id navn beskrivelse behovForBegrunnelse }
    relevansFor { code shortName }
    regelverk { lov { code shortName } }
    rettskilder
    begreper { navn beskrivelse }
    status
  }
  k1: kravById(nummer: 107, versjon: 2) { ... }
}
```

NB: `beskrivelse` på krav-nivå er nesten alltid `null` — hent den ikke. Bruk `hensikt` i stedet.

---

### ⛔ OBLIGATORISK: Forstå hva hvert suksesskriterium spør om FØR du svarer

**Denne regelen gjelder UTEN UNNTAK for:**
- Alle nye begrunnelser du skriver
- Alle eksisterende begrunnelser du vurderer som korrekte, ufullstendige eller feil
- Alle IKKE_RELEVANT-vurderinger du skal bekrefte eller korrigere
- Alle OPPFYLT-vurderinger du skal kvalitetssikre

**Du MÅ alltid hente og lese SK-beskrivelsene fra API-et før du vurderer.** Ikke stol på
kravnavn, SK-navn, eller din egen hukommelse om hva et SK pleier å handle om.
En begrunnelse som svarer på feil spørsmål er verre enn ingen begrunnelse.

**For hvert suksesskriterium du skal vurdere, gjør dette alltid i rekkefølge:**

**Steg A — Forstå kravets intensjon og kontekst:**
1. Les `hensikt` — dette er kravets overordnede formål og den primære kilden til hva kravet handler om
2. Sjekk `utdypendeBeskrivelse` — hvis den finnes (ikke null), les den nøye. Den kan innsnevre
   eller utvide omfanget vesentlig sammenlignet med `hensikt`-teksten alene
3. Sjekk `versjonEndringer` — kritisk for å forstå hva som er nytt fra forrige versjon (K{nr}.1 → K{nr}.2)
4. Sjekk `varselMelding` — hvis den finnes, inneholder den viktige presiseringer eller unntak
5. Les `relevansFor` — viser hvilke systemeigenskaper som utløser kravet (f.eks. `EKSTERN_SKJERMFLATE`,
   `PERSONOPPLYSNINGER`). Bruk dette til å bekrefte at kravet faktisk er relevant for systemet —
   hvis systemets egenskaper ikke matcher, er kravet muligens ikke-relevant.
6. Les `regelverk` og `rettskilder` — lovgrunnlaget (f.eks. Personvernforordningen art. 5, WCAG-forskriften).
   Når begrunnelsen refererer til lovkrav, bruk `regelverk[].lov.shortName` og eventuelt
   `rettskilder`-lenker som juridisk forankring.
7. Les `begreper` — definisjoner av nøkkelbegreper brukt i kravet. Hvis kravet bruker termer
   som «kassere», «formålsbegrensning» eller «den registrerte», finn definisjonene her og bruk
   dem korrekt i begrunnelsen.

**Steg B — Forstå hva suksesskriteriet spesifikt spør om:**
- Les `suksesskriterier[i].beskrivelse` — dette er den detaljerte veiledningen for kriteriet.
  Den inneholder definisjoner, eksempler og avgrensninger som er **avgjørende** for riktig vurdering.
- Formuler spørsmålet eksplisitt for deg selv: *«Dette kriteriet spør: [...]»*
- Eksempel: K212.1 SK1 spør om arkivering. `beskrivelse` forklarer at «verdi som dokumentasjon»
  betyr informasjonen kan brukes som bevis i etterkant, og at «saksbehandling» krever svært lite
  overveielse for å utløses — uten denne konteksten ville vurderingen bli feil.

**Steg C — Svar på akkurat det spørsmålet:**
- Begrunnelsen skal svare direkte på det suksesskriteriet faktisk spør om
- Ikke skriv generelt om systemet — svar på det konkrete spørsmålet fra `beskrivelse`
- Hvis `beskrivelse` lister opp spesifikke punkter (f.eks. en sjekkliste), adresser hvert punkt
- Bruk funn fra kodegjennomgangen som bevis

**Strukturmal for begrunnelse:**
```
[Svar direkte på spørsmålet fra SK beskrivelse, 1-2 setninger]

[Konkrete funn fra kode/konfigurasjon som underbygger vurderingen]
Ref: [filnavn, linje/funksjon eller nais.yaml-felt]

[Eventuelle forbehold eller punkter teamet må bekrefte]
```

Et krav som virker irrelevant basert på kravnavnet alene kan bli svært relevant når
`utdypendeBeskrivelse` og suksesskriterienenes `beskrivelse` leses (eksempel: K205.1
gjaldt bare enkeltvedtak, men K205.2 utvidet til forhåndsvarsel og meldinger — dette
fremgikk av `versjonEndringer`).

#### ⛔ OBLIGATORISK: Vurdering av IKKE_RELEVANT-statuser

**Alle eksisterende IKKE_RELEVANT-vurderinger MÅ kvalitetssjekkes ved full gjennomgang.**

Fremgangsmåte:

1. **Hent SK-beskrivelsen** for hvert SK som er satt til IKKE_RELEVANT (via GraphQL `kravById`)
2. **Formuler spørsmålet** SK-et stiller: *«Dette kriteriet spør: [...]»*
3. **Vurder om grunnlaget er gyldig.** Gyldige grunner for IKKE_RELEVANT:
   - Systemets egenskaper (`relevansFor`) matcher ikke SK-ets forutsetning (f.eks. SK gjelder
     kun `EKSTERN_SKJERMFLATE` og systemet bare har intern flate)
   - SK-et eksplisitt unntar systemets situasjon (les `beskrivelse` — ikke forutsett grunnlag)
   - Et overordnet unntak er formelt dokumentert (f.eks. dispensasjon fra språkloven)
4. **Avvis disse som grunnlag for IKKE_RELEVANT:**
   - «Det er åpenbart / ikke tolkningstvil» — åpenbare tilfeller skal OPPFYLLES, ikke hoppes over
   - «Dette gjøres i et annet system» — hvert system gjør sin egen vurdering
   - «Det er lite hensiktsmessig» — personvernsrettighetene gjelder uavhengig av hensiktsmessighet
   - Tom begrunnelse — alltid feil
   - Begrunnelse som svarer på et annet spørsmål enn det SK-et stiller
5. **Konkluder:** Korrekt IKKE_RELEVANT ✅ / Bør være OPPFYLT ⚠️ / Bør være IKKE_OPPFYLT 🔴

**Eksempel på vanlig feil:**
SK spør «Har dere dokumentert valget av behandlingsgrunnlag?»
Eksisterende begrunnelse: «Grunnlaget er åpenbart — hjemmel i lov.»
→ Feil: begrunnelsen svarer på «er grunnlaget klart?», ikke «er det dokumentert?»
→ Korrekt status: OPPFYLT med B-nummer-referanse


Hvert krav har et `status`-felt. Sjekk dette ALLTID før oppdatering:
- `AKTIV` → kravet er gjeldende, kan oppdateres
- `UTGAATT` → kravet er erstattet av ny versjon, **IKKE oppdater etterlevelse på denne versjonen**

**Versjonsmodellen:** Når et krav får ny versjon (f.eks. K205.1 → K205.2):
- Gammel versjon settes til `status: UTGAATT` i API-et
- UI-et viser IKKE gammel versjon som «utgått» — den eksisterende etterlevelsen forblir synlig
- I stedet vises «Ny versjon {dato}» på det nye kravet i UI-et
- Etterlevelsen må opprettes/oppdateres for ny versjon manuelt

Sjekk via GraphQL:
```graphql
kravById(nummer: 114, versjon: 1) { status beskrivelse }
```
Hvis `status: "UTGAATT"`, finn den AKTIVE versjonen av samme kravNummer og jobb med den.

#### Identifiser krav som skal vurderes:

**REGEL: Bruk KUN gjeldende kravliste som sannhetskilde.**
Dokumentet kan ha etterlevelse-records for utgåtte krav-versjoner (f.eks. K102.2 når K102.3
er gjeldende, eller K114.1 som er UTGAATT). Disse skal IGNORERES — ikke telles, ikke
oppdateres, ikke inkluderes i rapporter eller statistikk. Tallet som UI-et viser (f.eks.
«56 krav, 55 utfylt») er antall *gjeldende* krav, ikke antall etterlevelse-records.

**VIKTIG: Gjør ALLTID en gap-analyse mot kravlisten — uansett modus.**
Ufullstendige krav fanges ikke av å bare se på eksisterende etterlevelser. Krav som mangler
etterlevelse-record helt vil ikke dukke opp i dokumentets etterlevelser-liste. Du MÅ
sammenligne gjeldende kravliste (steg 1 under) mot eksisterende etterlevelser for å finne
manglende oppføringer.

**Steg 1 (alltid): Hent gjeldende kravliste:**
```graphql
{ krav(filter: {gjeldendeKrav: true, etterlevelseDokumentasjonId: "DOK_ID"}) {
    content { kravNummer kravVersjon navn status }
} }
```

**Steg 2 (alltid): Sammenlign mot eksisterende etterlevelser:**
Bruk etterlevelsene du hentet fra GraphQL-spørringen i steg 3a (feltet `etterlevelser`
nestet inne i dokumentobjektet). **Ikke** hent etterlevelser på nytt fra REST-endepunktet
`/api/etterlevelse` — det returnerer etterlevelser på tvers av alle dokumenter i systemet.
Bygg et set av `(kravNummer, kravVersjon)`-par fra disse etterlevelsene.
Finn krav i gjeldende liste som IKKE har en etterlevelse-record. Disse er helt ubesvarte.

**Ved «Ufullstendige krav»-modus (i tillegg til gap-analysen):**
- Tom `begrunnelse` på suksesskriterier der `behovForBegrunnelse = true` = trenger utfylling
- Suksesskriterier der `behovForBegrunnelse = false` trenger IKKE begrunnelse — disse skal
  IKKE flagges som ufullstendige selv om `begrunnelse`-feltet er tomt
- Sjekk `behovForBegrunnelse` på kravets suksesskriterier for å vite HVOR teksten skal

**Ved «Nye og oppdaterte krav»-modus:**
Sammenlign gjeldende kravliste mot eksisterende etterlevelser for å finne avvik:

1. **Hent gjeldende kravliste** for dokumentets relevans (GraphQL `krav`-query med `gjeldendeKrav: true`
   og `etterlevelseDokumentasjonId`). Denne listen inneholder alle AKTIVE krav.
2. **Hent eksisterende etterlevelser** fra dokumentasjonen (kravNummer + kravVersjon).
3. **Finn avvik:**
   - *Helt nye krav*: kravNummer finnes i gjeldende kravliste men har INGEN etterlevelse-record
   - *Ny versjon av eksisterende krav*: etterlevelse finnes på versjon X, men gjeldende krav er
     versjon Y > X. Det gamle kravet er `status: UTGAATT` i API-et, men UI-et viser det ikke
     eksplisitt som utgått — i stedet vises «Ny versjon {dato}» på det nye kravet. Etterlevelsen
     forblir på gammel versjon inntil teamet oppdaterer.
4. **For nye krav:** Generer forslag til begrunnelser basert på kodegjennomgangen.
   **For ny versjon:** Les gammel begrunnelse som utgangspunkt. Sammenlign suksesskriteriene
   mellom gammel og ny versjon for å identifisere hva som er endret, og oppdater begrunnelsen
   deretter.

**Ved «Full gjennomgang (deep)»-modus:**
- ALLE krav vurderes, også de med utfylt begrunnelse
- For utfylte krav: verifiser at begrunnelsen stemmer med faktisk kode
- Flagg begrunnelser som er utdaterte (f.eks. refererer til kode som er endret)
- Flagg begrunnelser som er vage (mangler konkrete kode/config-referanser)
- Foreslå forbedringer med spesifikke kodehenvisninger
- Sjekk at status (OPPFYLT/UNDER_ARBEID etc.) reflekterer virkeligheten
- Inkluderer automatisk logikken fra «Nye og oppdaterte krav»-modus

#### 3b: Hent data fra Behandlingskatalogen

Behandlingskatalogen inneholder strukturerte data om behandlingen som er svært verdifulle
for etterlevelsesgjennomgangen. Bruk den interne ingressen — ingen cookies nødvendig:

Hent behandlings-ID fra etterlevelsesdokumentasjonen (`behandlinger[].id`), og slå opp:
```
GET https://behandlingskatalog-backend.intern.nav.no/api/process/{behandling-id}
```

**Hvis behandlingslisten er tom eller mangelfull:** Etterlevelsesdokumentasjonen kan mangle
kobling til behandlinger i Behandlingskatalogen. Søk da etter relevante behandlinger:
```
GET https://behandlingskatalog-backend.intern.nav.no/api/process/search/{søkeord}
```
Søk på systemnavn, teamnavn eller formål. Foreslå relevante behandlinger til bruker slik at
de kan koble dem i etterlevelsesdokumentasjonen.

**Viktig: Vurder også sekundærbehandlinger.** Et system kan ha flere behandlinger med ulike
formål. Eksempel: Et dialogsystem kan ha én behandling for selve dialogen (primær),
én for analyse/innsikt (sekundær), og én for kontroll av aktivitetsplikt (sekundær).
Sjekk koden for dataflyter til analytics (DVH, BigQuery, NADA), kontroll-/rapporteringsformål,
eller andre sekundære bruksområder som kan ha egne behandlinger.

**Behandlingsnummer:** Hver behandling har et nummer Bxxx (f.eks. B580). Bruk feltet `number`
fra API-responsen. Referer alltid til behandlinger med dette nummeret, ikke UUID-en.

Typiske søkekriterier:
- Systemnavnet eller formålet (sjekk `purpose`, `name`, `description`)
- Teamets navn (sjekk `affiliation.products[].teams[]`)
- Personopplysningstyper som finnes i koden (sjekk `policies[]`)

Responsen inneholder:

| Felt | Innhold | Relevant for krav |
|------|---------|-------------------|
| `purpose` / `purposes` | Overordnet formål (f.eks. "Oppfølging mot arbeid") | K102 Formål |
| `description` | Beskrivelse av behandlingen | K102 Formål |
| `legalBases[]` | Rettslige grunnlag med GDPR-artikkel og nasjonal lov | K107 Lovlig behandling |
| `policies[]` | Personopplysningstyper med sensitivitet (POL/SAERLIGE) | K102, K107 |
| `retention` | Lagringstid (måneder), starttidspunkt, beskrivelse, Confluence-lenker | K191 Lagringstid |
| `dpia` | PVK-behov, referanse til PVK-dokument, om den er gjennomført | K114 PVK |
| `dataProcessing.processors[]` | Databehandler-IDer | K190 Databehandler |

Hent databehandlerdetaljer:
```
GET https://behandlingskatalog-backend.intern.nav.no/api/processor/{processor-id}
```
Returnerer: navn, land, om de er utenfor EU, overføringsgrunnlag.

**Bruk denne dataen til å:**
- Berike begrunnelsene med eksakte lovhenvisninger fra `legalBases`
- Verifisere at personopplysningstyper i koden matcher det som er registrert
- Referere til PVK-dokumentet fra `dpia.refToDpia` (løser K114!)
- Bruke lagringstiden fra `retention` som autoritativ kilde for K191
- Sammenligne registrerte databehandlere mot det som finnes i koden/NAIS-config

#### 3c: Koble til risikovurderinger (TryggNok)

NAV bruker TryggNok (PowerApps) for risikovurderinger (ROS). Spør bruker om det finnes
en ROS for systemet, og hent ROS-ID. TryggNok-lenker har formatet:
```
https://apps.powerapps.com/play/f8517640-ea01-46e2-9c09-be6b05013566?app=567&ID={ROS-ID}
```

For å finne ROS-er for et team, bruk team-filtrert URL:
```
https://apps.powerapps.com/play/e/default-62366534-1ec3-4962-8869-9b5535279d0b/a/f8517640-ea01-46e2-9c09-be6b05013566?app=567&Teamkatalogen_TeamID={TEAM-ID}&tenantId=62366534-1ec3-4962-8869-9b5535279d0b
```
Team-ID finnes i etterlevelsesdokumentasjonen (`teams[]`).

TryggNok er en client-side app og kan ikke leses programmatisk. Men ROS-data er
relevant for:
- **K245** (risikovurdering) — referanse til gjennomført ROS
- **K114** (PVK) — ROS og PVK henger sammen
- **K253** (oppslagslogg) — risikoer knyttet til tilgang

Legg ROS-lenken i etterlevelsesdokumentasjonens `risikovurderinger`-felt (array av
markdown-lenker):
```json
["[Systemnavn (ROS)](https://apps.powerapps.com/play/f8517640-ea01-46e2-9c09-be6b05013566?app=567&ID=1720)"]
```

Be bruker om å oppsummere viktige funn fra ROS-en som kan berike begrunnelsene,
spesielt: identifiserte risikoer, iverksatte tiltak, og restrisikoer.

**Avgrensning TryggNok vs PVK:** TryggNok dekker teknisk ROS. Funn som berører
personvern hører i PVK (se nav-pvk skill). Ikke dupliser — referer til ROS-ID
for tekniske tiltak, og beskriv personvernkonsekvensen i PVK.

#### 3d: Sett innledende prioritert kravliste

Basert på data fra steg 3a, 3b og 3c, sett en **innledende prioritert kravliste** FØR
kodegjennomgangen. Vurder systemets natur:

- **Behandler personopplysninger?** → K102 (formål), K107 (grunnlag), K191 (lagringstid)
- **Art. 9-opplysninger (helse, etc.)?** → K114 (PVK), K253 (oppslagslogg)
- **Eksternt tilgjengelig (borger-facing)?** → K196 (WCAG), K231/K232 (språk)
- **Databehandlere/tredjeparter?** → K190 (databehandleravtaler)
- **Arkivverdig innhold?** → K128 (arkivrutiner), K230 (avlevering/sletting)

Foreslå listen for bruker og oppdater `prioritertKravNummer` på
etterlevelsesdokumentasjonen (se API-seksjon under). Listen justeres eventuelt
etter kodegjennomgangen i steg 6 hvis alvorlige mangler avdekkes.

#### 3e: Hent PVK-data (personvernkonsekvensvurdering)

PVK er integrert i etterlevelsesløsningen. Sjekk om det finnes en PVK for dokumentasjonen:
```
GET /api/pvkdokument?pageSize=100
```
Filtrer responsen client-side på `etterlevelseDokumentId == {dok-id}`.

Hvis PVK finnes, hent:

**PVK-dokument:**
```
GET /api/pvkdokument/{pvk-id}
```
Viktige felter:
- `pvkVurdering`: `SKAL_UTFORE` / `SKAL_IKKE_UTFORE` / `ALLEREDE_UTFORT`
- `status`: `UNDERARBEID` → `SENDT_TIL_PVO` → `VURDERT_AV_PVO` → `GODKJENT_AV_RISIKOEIER`
- `ytterligereEgenskaper[]` — DPIA-triggende egenskaper (stor skala, sårbare, art.9 etc.)
- `harInvolvertRepresentant` / `representantInvolveringsBeskrivelse`
- `harDatabehandlerRepresentantInvolvering` / `dataBehandlerRepresentantInvolveringBeskrivelse`
- `meldingerTilPvo[]` — innsendinger til personvernombudet med dato og merknad

**Risikoscenarioer:**
```
GET /api/risikoscenario?pvkDokumentId={pvk-id}
```
Hvert scenario har:
- `navn`, `beskrivelse` — beskrivelse av risikoen
- `konsekvensNivaa` / `sannsynlighetsNivaa` — risikonivå (1-5) FØR tiltak
- `konsekvensNivaaEtterTiltak` / `sannsynlighetsNivaaEtterTiltak` — ETTER tiltak
- `relevanteKravNummer[]` — **kobler risikoen direkte til etterlevelseskrav!**
- `tiltakIds[]` — lenke til tiltak

**Tiltak:**
```
GET /api/tiltak?pvkDokumentId={pvk-id}
```
Hvert tiltak har:
- `navn`, `beskrivelse` — hva tiltaket er
- `iverksatt` (bool), `iverksattDato` — om tiltaket er gjennomført
- `ansvarlig`, `ansvarligTeam` — hvem som er ansvarlig
- `risikoscenarioIds[]` — kobling tilbake til scenarioer

**Bruk PVK-data til å:**
- Svare på K114-suksesskriteriene (PVK gjennomført? Sendt til PVO? Godkjent?)
- Berike begrunnelser med risikoscenarioer som er knyttet til kravene via `relevanteKravNummer`
- Verifisere at tiltak i PVK-en stemmer med det som er implementert i kode
- Identifisere risikoer som bør adresseres i handlingspunkter

Hvis PVK IKKE finnes, og behandlingen inneholder art. 9-opplysninger eller andre
DPIA-triggende egenskaper (fra Behandlingskatalogen), noter dette som et handlingspunkt.

### Steg 4: Inspiser kildekode

#### ⛔ Feilhåndtering ved delsteg og agenter

**Stopp og informer bruker hvis et viktig delsteg mislykkes.** Ikke fortsett arbeidsflyten
som om steget var fullført.

Klassifiser feil etter konsekvens:

| Situasjon | Handling |
|---|---|
| Kodegjennomgang av ett repo feilet (agent fant ikke repo, nettverksfeil, ingen tilgang) | **Stopp.** Informer bruker om hvilke repo som mangler. Ikke skriv begrunnelser for krav som avhenger av det manglende repoet. |
| API-kall til etterlevelsesløsningen eller behandlingskatalogen feilet | **Stopp.** Informer om feilen. Be om nye cookies hvis 302/401, eller vent og prøv igjen ved nettverksfeil. |
| Delsteg returnerte tomme eller mistenkelig mangelfulle resultater | **Verifiser** før du går videre. Eksempel: en agent som bare fant auditlogging i én kontroller der det forventes mange — sjekk om agenten faktisk leste alle filer. |
| Ikke-kritisk informasjon mangler (f.eks. ROS-ID, lagringstid ikke funnet i koden) | Fortsett, men **merk tydelig** i rapporten: `[Teamet må bekrefte: ...]` |

**Prøv alternativ tilnærming før du gir opp.** Hvis en explore-agent feiler, forsøk
direkte GitHub MCP-oppslag eller bash-kommandoer. Hvis det fremdeles feiler, dokumenter
hva som manglet og hvilken påvirkning det har på vurderingskvaliteten.

**Ikke stol på at «noen resultater» betyr «fullstendige resultater».** En agent som
returnerer noen funn kan ha feilet stille på resten. Vurder om omfanget er rimelig —
f.eks. bør en kodegjennomgang av sikkerhet i et backend-repo gi funn fra mer enn én fil.

Bruk explore-agenter parallelt for å analysere repoene. Fokusér på:

**Sikkerhet og tilgangskontroll:**
- Autentisering (ID-porten, Azure AD, TokenX)
- Autorisasjon (poao-tilgang, roller, tilgangstyper)
- Kontorsperre / beskyttede brukere
- Auditlogging: Identifiser ALLE inngangspunkter (HTTP-endepunkter, GraphQL-resolvere,
  meldingskonsumenter, bakgrunnsjobber) som eksponerer persondata til en bruker eller
  system. Verifiser at hvert enkelt punkt logger oppslaget til NAVs oppslagslogg
  (Arcsight/CEF). Mekanismen varierer etter rammeverk og språk — Spring: `@AuthorizeFnr`
  (logback-naudit), Node.js: tilsvarende middleware, osv. Bekreft eksisterende
  begrunnelse mot faktisk kode — ikke stol på at «noen kontrollere er dekket» betyr at
  alle er det.

**Personvern:**
- Hvilke personopplysninger lagres (database-skjema)
- Lagringstid og slettemekanismer
- Kassering/pseudonymisering
- Informasjon til bruker om personvern

**Tredjeparter:**
- NAIS-konfig (nais-prod*.yaml) for database, Kafka, tilgangspolicyer
- CSP-policy for tredjepartsdomener
- Databehandlere (Sentry, Amplitude, Hotjar, etc.)

**Språk og UU:**
- i18n-rammeverk (finnes det?)
- NAV Designsystem-bruk
- WCAG-støtte (aria-labels, semantisk HTML)

### Steg 5: Verifiser mot NAIS-plattformen

Hent NAIS-dokumentasjon for å verifisere plattformkrav:
- https://docs.nais.io/auth/idporten/ (ID-porten)
- https://docs.nais.io/auth/tokenx/ (TokenX)
- https://docs.nais.io/persistence/cloudsql/ (Cloud SQL sikkerhet)
- https://docs.nais.io/observability/logging/ (Logging)
- https://sikkerhet.nav.no/docs/sikker-utvikling/oppslagslogg (Arcsight/CEF)

### Steg 6: Skriv begrunnelser og generer rapport

**⛔ ALDRI SKRIV TIL API UTEN BRUKERENS EKSPLISITTE GODKJENNING.**
Generer ALLTID rapporten først. Vis den til brukeren. Vent på at brukeren bekrefter
at rapporten er gjennomgått og godkjent av teamet. Gå DERETTER til steg 8 for
opplasting — og KUN etter at bruker har gitt eksplisitt klarsignal (f.eks. «last opp»,
«oppdater etterlevelsesløsningen», «godkjent»). Denne regelen gjelder uansett om
bruker sier «full gjennomgang» eller annet — «gjennomgang» betyr IKKE «last opp».

Generer en komplett rapport (`rapport-E{nr}-{teamnavn}.md`, f.eks.
`rapport-E240-team-dab.md`) med:

1. **Sammendrag** – antall krav, status oversikt
2. **Handlingspunkter** – prioritert tabell (høy/medium/lav)
3. **Risikofunn** – fra kodegjennomgang med alvorlighet
4. **Positive funn** – verifiserte sikkerhetstiltak
5. **Foreslåtte begrunnelser** – komplett tekst for ufullstendige krav, og forbedringsforslag for eksisterende (ved full gjennomgang)
6. **Prioritert kravliste** – forslag til krav teamet bør fokusere på
7. **Systemarkitektur** – ASCII-diagram

**Ved full gjennomgang (deep)**, inkluder også i rapporten:
8. **Kvalitetsvurdering av eksisterende begrunnelser** — for hvert utfylt krav:
   - ✅ **OK** — begrunnelsen er korrekt og godt underbygget
   - ⚠️ **Forbedringsforslag** — begrunnelsen er riktig men kan styrkes (f.eks. mangler koderef)
   - 🔴 **Utdatert/feil** — begrunnelsen stemmer ikke med nåværende kode
   
   Eksempel:
   ```
   K245.2 SK1 – Risikovurdering er gjennomført
   Status: ✅ OK
   Eksisterende begrunnelse stemmer. Bekreftet i kode: TryggNok ROS ID 1720.
   
   K196.6 SK3 – UU-testing
   Status: ⚠️ Forbedringsforslag
   Begrunnelsen nevner "NAV Designsystem" generelt. Forslag: legg til spesifikke
   versjoner (@navikt/ds-react v8.6.0) og konkrete WCAG-tiltak (aria-labels i
   DialogHeader.tsx, fokusadministrasjon i NyDialogForm.tsx).
   ```

#### Revider prioritert kravliste

Sammenlign den innledende prioriteringen (steg 3c) med faktiske funn. Juster listen hvis:
- Alvorlige mangler er avdekket som ikke var forutsett (legg til)
- Krav som var antatt problematiske viser seg å være godt ivaretatt (fjern/nedprioriter)
- Nye risikoer er identifisert (f.eks. CSP-policy, tredjeparter uten avtale)

Prioriteringskriterier:

1. **Kritisk**: Krav med suksesskriterier som er IKKE_OPPFYLT og gjelder sikkerhet/personvern
   (f.eks. K253 oppslagslogg, K191 lagringstid)
2. **Høy**: Krav med UNDER_ARBEID som krever teamets oppfølging
   (f.eks. K190 databehandler, K230 avlevering)
3. **Medium**: Krav med mangler som ikke er sikkerhetskritiske
   (f.eks. K128 arkivrutiner, K196 WCAG)
4. **Lav**: Krav som er OPPFYLT men kan forbedres

Filtrer ut utgåtte krav (status=UTGAATT). Listen skal kun inneholde AKTIVE krav.

Begrunnelsene i rapporten skal:
- Være konkrete og referere til faktisk kode (filnavn, klassenavn, metoder)
- Referere til NAIS-konfigurasjon der relevant
- Referere til Behandlingskatalogen (B-nummer)
- Inkludere sitater fra kode som bevis
- Være skrevet på norsk (bokmål)
- Skille mellom vurdering og praktisk veiledning
- Marker `[Teamet må dokumentere: ...]` der koden ikke gir svar

Kopier rapporten til arbeidskataloget slik at bruker enkelt kan dele den med teamet.

### Steg 7: Kvalitetssikring med teamet

**⛔ STOPP — OBLIGATORISK GODKJENNINGSPUNKT.**

Du har NÅ laget en rapport. Du skal IKKE kalle API-er for å opprette eller oppdatere
etterlevelser. Du skal IKKE gå videre til steg 8 med mindre bruker eksplisitt ber
om det (f.eks. «last opp», «oppdater API-et», «godkjent, publiser»).

**Spør bruker om gjennomgangsmetode:**

> Rapporten er klar. Hvordan vil du kvalitetssikre begrunnelsene før opplasting?
>
> **A) Interaktiv SK-gjennomgang** (anbefalt) — Gå gjennom én SK om gangen i terminalen.
>    For hver SK vises suksesskriteriet og diff av hva som endres. Du godkjenner, hopper
>    over eller redigerer én etter én. Effektivt fordi du ser krav og endring side om side.
>
> **B) Rapportgjennomgang** — Gå gjennom rapporten i Markdown-filen, evt. med teamet,
>    og gi klarsignal når du er klar.

#### Alternativ A: Interaktiv SK-gjennomgang

For **hvert krav** med endringer, skriv til konsollet:

```
══════════════════════════════════════════════════════════════
K{nr}.{v} – {kravnavn}
══════════════════════════════════════════════════════════════
```

For **hvert suksesskriterium** med endring under kravet:

```
─────────────────────────────────────────
SK{id} – {suksesskriterienavn}
─────────────────────────────────────────
Beskrivelse:
  {suksesskriterier[i].beskrivelse}

ENDRING:
  Status:     {gammel_status} → {ny_status}
  Begrunnelse (før):
    {eksisterende begrunnelse, eller "(tom)"}
  Begrunnelse (etter):
    {foreslått begrunnelse}

[G]odkjenn  [H]opp over  [R]ediger
> _
```

**Regler for interaktiv gjennomgang:**
- **G (Godkjenn):** SK markeres for opplasting. Gå til neste SK.
- **H (Hopp over):** SK hoppes over — eksisterende data i etterlevelsesløsningen beholdes uendret.
- **R (Rediger):** Vis foreslått begrunnelse og be bruker skrive ny tekst. Etter redigering
  vises den oppdaterte diff-en på nytt med G/H-valg.
- Etter alle SK-er for ett krav: vis oppsummering «{n} godkjent, {m} hoppet over».
- Etter alle krav: vis total oppsummering og spør om bekreftelse før opplasting starter.

**Kun godkjente SK-er lastes opp** i steg 8. Hoppede-over SK-er røres ikke.

#### Alternativ B: Rapportgjennomgang

Be bruker om å:
1. Gjennomgå rapporten sammen med teamet
2. Korrigere eventuelle feil eller misforståelser
3. Fylle inn plassholdere merket `[Teamet må dokumentere: ...]`
4. Bekrefte at begrunnelsene er klare for opplasting

**Ikke gå videre til opplasting før bruker eksplisitt bekrefter at rapporten er
kvalitetssikret og godkjent av teamet.**

### Steg 8: Last opp begrunnelser (KUN etter eksplisitt godkjenning fra bruker)

**Forutsetning:** Bruker har gjennomgått rapporten fra steg 6, evt. i samarbeid med
teamet, og har gitt eksplisitt klarsignal for opplasting. Hvis bruker bare har sagt
«full gjennomgang», «vurder kravene» eller lignende — STOPP og vis rapporten først.

**🔐 Autentisering for skriveoperasjoner — velg ett alternativ:**

#### Alternativ A: Lokal broker (anbefalt)

Sjekk om brokeren kjører:
```bash
curl -s http://localhost:9876/health
```
`{"status":"ok"}` = broker er oppe. Send da alle skriveoperasjoner via brokeren:

```bash
# I stedet for direkte PUT til API-et, POST til broker:
curl -s -X POST http://localhost:9876/write \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://etterlevelse-api.intern.nav.no/api/etterlevelse/{id}",
    "method": "PUT",
    "body": { ...etterlevelse-objektet... }
  }'
```

Brokeren viser diff og ber om godkjenning (G/H/R) i terminalen. Token hentes
automatisk via device-code ved første skriving.

Start broker: `cd tools/etterlevelse-broker && BROKER_CLIENT_ID=<id> node broker.js`
(se `tools/etterlevelse-broker/README.md` i navikt/dab-copilot-config)

#### Alternativ B: SSO-cookies (fallback hvis broker ikke er tilgjengelig)

Be brukeren om:

1. Åpne https://etterlevelse.intern.nav.no/ i nettleseren og logg inn
2. Åpne DevTools → Application → Cookies for `etterlevelse.intern.nav.no`
3. Kopier verdiene for:
   - `etterlevsession` (påkrevd for skriving)
   - `sso-nav.no` (kan trenges for skriving)

Test at sesjonen er gyldig:
```bash
curl -s -o /dev/null -w "%{http_code}" \
  'https://etterlevelse-api.intern.nav.no/api/etterlevelsedokumentasjon/{DOKUMENT_ID}' \
  -H 'Cookie: etterlevsession=...; sso-nav.no=...'
```
200 = OK, 302/401 = sesjonen har utløpt (be om nye cookies).

**Standard opplastingsmodus er UNDER_ARBEID.** Suksesskriterier agenten har vurdert som
oppfylt lastes opp med status `UNDER_ARBEID` slik at teamet selv kan kvittere ut hvert
enkelt i etterlevelsesløsningen. Bare dersom bruker eksplisitt ber om det (f.eks. «sett
til oppfylt», «merk som ferdig») brukes `OPPFYLT` for besvarte suksesskriterier.

Suksesskriterier vurdert som `IKKE_OPPFYLT` eller `IKKE_RELEVANT` settes alltid til
disse statusene uavhengig av modus.

## KRITISK: Feltmapping for opplasting

Etterlevelsesløsningen har et `behovForBegrunnelse`-felt per suksesskriterium i kravdefinisjonen.
Dette bestemmer HVOR teksten skal plasseres:

### Når `behovForBegrunnelse = true`:
Bruk `begrunnelse`-feltet direkte:
```json
{
  "suksesskriterieId": 1,
  "suksesskriterieStatus": "OPPFYLT",
  "begrunnelse": "Teksten her...",
  "veiledning": false,
  "veiledningsTekst": null,
  "veiledningsTekst2": null
}
```

### Når `behovForBegrunnelse = false`:
UI-et viser IKKE begrunnelse-feltet. Du trenger normalt IKKE skrive veiledning her —
sett bare riktig `suksesskriterieStatus` og la begrunnelse/veiledning stå tom.

Skriv kun veiledning (`veiledning: true` + `veiledningsTekst`) hvis det er spesielt
relevante momenter som bør dokumenteres (f.eks. funn fra kodegjennomgang, kjente risikoer,
eller avvik som teamet bør følge opp). Eksempel:
```json
{
  "suksesskriterieId": 1,
  "suksesskriterieStatus": "OPPFYLT",
  "begrunnelse": "",
  "veiledning": true,
  "veiledningsTekst": "Viktig funn: ...",
  "veiledningsTekst2": null
}
```

### Feltet `veiledningsTekst2` (praktisk veiledning):
Brukes for handlingspunkter når kravet IKKE er fullt oppfylt. Eksempel:
```json
{
  "suksesskriterieStatus": "UNDER_ARBEID",
  "veiledningsTekst": "Fra kodegjennomgangen kan det bekreftes at...",
  "veiledningsTekst2": "Ta kontakt med Team X for å bekrefte at..."
}
```

### Gyldige verdier for `suksesskriterieStatus`:
- `OPPFYLT` – kravet er oppfylt, ingen åpne punkter
- `IKKE_OPPFYLT` – en klar mangel er identifisert som teamet må fikse
- `UNDER_ARBEID` – arbeid gjenstår (f.eks. organisatorisk bekreftelse trengs)
- `IKKE_RELEVANT` – kravet er ikke relevant for denne løsningen

### Gyldige verdier for etterlevelse `status`:
**VIKTIG:** Etterlevelsens `status`-felt har ANDRE verdier enn suksesskriterieStatus:
- `UNDER_REDIGERING` – etterlevelsen er under arbeid
- `FERDIG_DOKUMENTERT` – alle suksesskriterier er vurdert
- `FERDIG` – ferdigstilt
- `OPPFYLLES_SENERE` – kravet vil oppfylles senere
- `IKKE_RELEVANT` – kravet er ikke relevant
- `IKKE_RELEVANT_FERDIG_DOKUMENTERT` – ikke relevant, ferdig dokumentert

Bruk `UNDER_REDIGERING` ved opprettelse/oppdatering. IKKE bruk `UNDER_ARBEID` her — det
er kun gyldig for suksesskriterieStatus.

**VIKTIG: Sett suksesskriterieStatus basert på standard UNDER_ARBEID-modus, med mindre bruker eksplisitt ber om OPPFYLT:**
- **Standard (UNDER_ARBEID-modus):**
  - Suksesskriterier agenten har vurdert som oppfylt → sett til `UNDER_ARBEID`
  - Suksesskriterier med klar mangel → `IKKE_OPPFYLT`
  - Suksesskriterier som ikke er relevant → `IKKE_RELEVANT`
  - Suksesskriterier med `[Teamet må dokumentere: ...]` → `UNDER_ARBEID`
- **Kun hvis bruker eksplisitt ber om OPPFYLT-modus:**
  - Suksesskriterier agenten har vurdert som oppfylt uten forbehold → `OPPFYLT`
  - Suksesskriterier med klar mangel → `IKKE_OPPFYLT`
  - Suksesskriterier som ikke er relevant → `IKKE_RELEVANT`
  - Suksesskriterier med `[Teamet må dokumentere: ...]` → ALDRI `OPPFYLT`, bruk `UNDER_ARBEID`
- Bruk `veiledningsTekst2` for handlingspunkter når status er `UNDER_ARBEID` eller `IKKE_OPPFYLT`

⛔ **KRITISK: Etterlevelse-status MÅ gjenspeile suksesskriteriene.**
- Standard er alltid `UNDER_REDIGERING` ved opplasting — siden SK-ene holdes som `UNDER_ARBEID`
  for manuell kvittering av teamet.
- Sett etterlevelse `status` til `FERDIG_DOKUMENTERT` KUN dersom bruker eksplisitt ber om
  OPPFYLT-modus OG ALLE suksesskriterier har endelig status (OPPFYLT eller IKKE_RELEVANT).
- Hvis EN ELLER FLERE SK har status `UNDER_ARBEID` eller `IKKE_OPPFYLT`, MÅ etterlevelsens
  status settes til `UNDER_REDIGERING`, IKKE `FERDIG_DOKUMENTERT`.
- Denne regelen gjelder alltid — også ved batch-oppdateringer.

## API for oppdatering

### Les (GET):
```
GET /api/etterlevelse/{etterlevelse-id}
```
Returnerer hele etterlevelse-objektet med alle felter.

### Oppdater (PUT):
```
PUT /api/etterlevelse/{etterlevelse-id}
Content-Type: application/json
Cookie: etterlevsession=...; sso-nav.no=...

{hele objektet fra GET, med oppdaterte felter}
```

**VIKTIG: Optimistisk låsing.** API-et bruker `version`-feltet for concurrency control.
Du MÅ gjøre en fersk GET rett før PUT for å få riktig versjon. Ellers får du 403 Forbidden.

### Oppdateringsprosedyre (per etterlevelse):
1. `GET /api/etterlevelse/{id}` – hent fersk data
2. Modifiser `suksesskriterieBegrunnelser`-arrayen i minnet
3. **BEVAR eksisterende begrunnelser** som ikke skal endres
4. `PUT /api/etterlevelse/{id}` med hele det oppdaterte objektet
5. Verifiser at responsen inneholder oppdatert `version`

### Feilhåndtering:
- **403 Forbidden**: Utløpt sesjon ELLER stale version. Prøv fersk GET + PUT.
- **400 Bad Request**: Manglende `id` i body, eller mismatch mellom URL og body ID.
- **302 Redirect**: Sesjonen har utløpt. Be bruker om nye cookies.

## API for etterlevelsesdokumentasjon (prioritert kravliste m.m.)

### Opprett ny (POST):
```
POST /api/etterlevelsedokumentasjon
Content-Type: application/json
```
**VIKTIG:**
- Feltet `etterlevelseNummer` MÅ inkluderes med verdi `0` i POST-body.
  Backend auto-genererer det faktiske nummeret (f.eks. E718). Uten dette feltet får du NPE.
- Feltet `etterlevelseDokumentVersjon` MÅ settes til `1` (første versjon).
  Uten dette vises dokumentet som "E718.null" i stedet for "E718.1" i søk og UI.

Minimalt POST-body:
```json
{
  "title": "Oppfølging mot arbeid: <undertema>",
  "etterlevelseNummer": 0,
  "etterlevelseDokumentVersjon": 1,
  "beskrivelse": "<OBLIGATORISK: Beskriv løsningen, målgruppe og kontekst>",
  "behandlingIds": ["<uuid fra behandlingskatalogen>"],
  "dpBehandlingIds": [],
  "behandlerPersonopplysninger": true,
  "teams": ["<team-uuid>"],
  "resources": [],
  "nomAvdelingId": "<NOM-id for avdeling, f.eks. dy639w>",
  "avdelingNavn": "<Avdelingsnavn, f.eks. Arbeidsavdelingen>",
  "risikoeiere": ["<NAVident for seksjonsleder/risikoeier>"],
  "irrelevansFor": ["VEDTAKSBEHANDLING", "OKONOMISYSTEM"],
  "seksjoner": [{"nomSeksjonId": "xxx", "nomSeksjonName": "Seksjonsnavn"}],
  "varslingsadresser": [{"adresse": "SLACK_CHANNEL_ID", "type": "SLACK"}],
  "gjenbrukBeskrivelse": "",
  "tilgjengeligForGjenbruk": false,
  "forGjenbruk": false,
  "prioritertKravNummer": [],
  "knpivotenhetIds": [],
  "knpivotenhetNavn": [],
  "status": "UNDER_ARBEID"
}
```

**Behandlingssøk:**
```
GET /api/behandling/search/{Bxxx-nummer}
```
Returnerer `{content: [{id, navn, nummer, overordnetFormaal, formaal, ...}]}`.

### Les:
```
GET /api/etterlevelsedokumentasjon/{dok-id}
```

### Oppdater (PUT):
```
PUT /api/etterlevelsedokumentasjon/{dok-id}
```

**VIKTIG: Fjern enriched/read-only felter** fra GET-responsen før PUT:
Fjern: `changeStamp`, `teamsData`, `risikoeiereData`, `behandlinger`, `dpBehandlinger`,
`produktOmradetData`, `resourcesData`, `hasCurrentUserAccess`,
`versjonHistorikk`, `stats`, `sistEndretEtterlevelse`,
`sistEndretDokumentasjon`, `sistEndretEtterlevelseAvMeg`, `sistEndretDokumentasjonAvMeg`,
`hasCurrentUser`, `irrepirsibleFields`, `prioritertKravNummer`, `resources`.
Fjern ALLE felter som inneholder nestede objekter — API-et aksepterer kun primitive typer
og lister av strenger/UUIDs. Spesielt: `irrelevansFor` returneres som objekter fra GET
(`[{code: "X", ...}]`) men MÅ sendes som kode-strenger ved PUT (`["X"]`).

**Felter som KAN sendes som objekter:**
- `seksjoner`: `[{"nomSeksjonId": "abc123", "nomSeksjonName": "Seksjonsnavn"}]`
- `varslingsadresser`: `[{"adresse": "SLACK_CHANNEL_ID", "type": "SLACK"}]`
  (type: SLACK, SLACK_USER, eller EPOST)

### Dokumentegenskaper — API-endepunkter for oppslag

**Seksjoner per avdeling:**
```
GET /api/nom/seksjon/avdeling/{nomAvdelingId}
```
Returnerer `[{id, navn}]`. Bruk `id` som `nomSeksjonId`.

**Slack-kanaler (for varslingsadresser):**
```
GET /api/team/slack/channel/search/{søkeord}
```
Returnerer `{content: [{id, name, numMembers}]}`. Bruk `id` som `adresse`.

**Dokumentegenskaper agenten ALLTID skal fylle ut:**

1. **`beskrivelse`** (OBLIGATORISK) — Beskriv etterlevelsens kontekst: hvilken løsning/funksjon,
   målgruppe, applikasjoner og arbeid som omfattes. Eksempel: "Start oppfolgingsperiode er 
   funksjonen som registrerer at en bruker starter arbeidsrettet oppfolging hos NAV..."

2. **`nomAvdelingId` + `avdelingNavn`** — Avdeling i NAV-organisasjonen.
3. **`seksjoner`** — Seksjon(er) som eier løsningen.
4. **`risikoeiere`** — NAVident til risikoeier (normalt seksjonsleder).

**Fremgangsmåte for å finne avdeling, seksjon og risikoeier:**

a) **Beste kilde: Eksisterende dokumentasjon for samme team.**
   Hent en annen etterlevelsesdokumentasjon for teamet og kopier organisasjonsfeltene:
   ```
   GET /api/etterlevelsedokumentasjon/{annen-dok-id}
   → nomAvdelingId, avdelingNavn, seksjoner, risikoeiere
   ```
   Finn andre dokumentasjoner via GraphQL:
   ```graphql
   { etterlevelseDokumentasjon(filter: {teams: ["<team-uuid>"]}) {
       content { id etterlevelseNummer title nomAvdelingId avdelingNavn 
                 seksjoner { nomSeksjonId nomSeksjonName }
                 risikoeiere } } }
   ```

b) **Alternativ: teamsData fra etterlevelse-API.**
   `teamsData` i GET-responsen inneholder `productAreaId` og `members`.
   Teamkatalogen (teamkatalog.nav.no) har mer detaljer men krever separat autentisering.

c) **Spør bruker** om informasjonen ikke finnes i eksisterende dokumentasjoner.

Agenten kan utlede: `irrelevansFor` (fra kodeanalyse), `behandlerPersonopplysninger`,
`gjenbrukBeskrivelse`, `behandlingIds` (fra Behandlingskatalogen).

### Prioritert kravliste (`prioritertKravNummer`):
Array med kravnumre som strenger, sortert etter prioritet:
```json
{
  "prioritertKravNummer": ["253", "191", "190", "230", "128", "196"]
}
```
Kun kravnummer (ikke versjon). Rekkefølgen er prioriteringsrekkefølgen.

## Vanlige krav og hva man ser etter i koden

| Krav | Hva man undersøker i kode |
|------|---------------------------|
| K102 Formål | Behandlingskatalog-referanse, personverninfo til bruker, formålsbegrensning i UI |
| K107 Lovlig behandling | GDPR-grunnlag i Behandlingskatalogen, tilgangskontroll-implementasjon |
| K114 PVK/DPIA | PVK-dokument i etterlevelsesløsningen (steg 3e), risikoscenarioer, tiltak, PVO-status. Behandlingskatalogen (dpia-felt). Kode: sikkerhetstiltak som matcher PVK-tiltak |
| K190 Databehandler | Tredjeparter i NAIS-config, CSP-policy, Kafka/DB-leverandører |
| K191 Lagringstid | @Scheduled-jobber, soft delete, kassering, arkivlov-referanser |
| K231 Klarspråk | Tekstkvalitet, NAV DS-bruk. SK om kontakt med klarspråk = organisatorisk |
| K232 Bokmål/nynorsk | i18n-rammeverk, språkvalg-UI, hardkodet tekst |
| K245 Risikovurdering | CSP-policy, sårbarheter, sikkerhetstiltak |
| K253 Oppslagslogg | Identifiser ALLE inngangspunkter som eksponerer persondata (HTTP-endepunkter, GraphQL-resolvere, meldingskonsumenter, bakgrunnsjobber). Verifiser systematisk at hvert enkelt logger til Arcsight/CEF (NAVs oppslagslogg). Mekanisme varierer: Spring = logback-naudit + dedikert annotering, Node.js = middleware, osv. |

## Rapport

Rapporten genereres i steg 6 og er den primære leveransen. Den skal alltid kvalitetssikres
av bruker og teamet før eventuell opplasting til etterlevelsesløsningen (steg 8).

## Modellvalg for deloppgaver

Bruk dyrere modeller for tunge analytiske oppgaver og billigere modeller for enkle
strukturerte deloppgaver. Skillen kjøres normalt av en kraftig modell (f.eks. Claude Opus
4.7), men subagenter kan bruke rimeligere modeller der det holder.

| Oppgave | Anbefalt modell | Begrunnelse |
|---|---|---|
| Full kodegjennomgang med juridisk vurdering (steg 4) | `claude-opus-4.8` | Krever dyp forståelse av kode OG lovkrav |
| Skrive etterlevelsebegrunnelser (steg 6) | `claude-opus-4.8` | Presisjon og juridisk kontekst er kritisk |
| Hente og parse API-responser (behandlingskatalog, etterlevelsesløsning) | `claude-haiku-4.5` | Enkel datahenting og JSON-transformasjon |
| Søke etter spesifikke mønstre i kode (grep-lignende) | `claude-haiku-4.5` | Strukturert søk, ingen tolkning nødvendig |
| Hente kravdetaljer via GraphQL | `claude-haiku-4.5` | Forutsigbar datastruktur |
| Sammenligne kravliste mot etterlevelser (gap-analyse) | `claude-haiku-4.5` | Enkel set-differanse-operasjon |
| Laste opp begrunnelser via PUT-kall (steg 8) | `claude-haiku-4.5` | Mekanisk opplasting etter ferdig rapport |
| Sammensatt analyse: kode + behandlingskatalog + PVK | `claude-sonnet-4.6` | Moderat kompleksitet, balanse mellom kostnad og kvalitet |

**Praktisk bruk med task-verktøyet:**
```
task(..., model: "claude-haiku-4.5")   # enkle API-kall og søk
task(..., model: "claude-sonnet-4.6")  # mellomtunge analyser
task(..., model: "claude-opus-4.8")    # tunge juridiske vurderinger
```

## Viktige huskeregler

- Alltid inspiser FAKTISK kode, ikke bare dokumentasjon
- Verifiser plattformkrav mot docs.nais.io
- **⛔ Les ALLTID SK-beskrivelsen fra API-et før du vurderer status eller begrunnelse.**
  Hverken kravnavn, SK-navn, din hukommelse eller andres begrunnelse er tilstrekkelig grunnlag.
  En begrunnelse som svarer på feil spørsmål er verre enn ingen begrunnelse.
  Dette gjelder for: nye begrunnelser, kvalitetssjekk av eksisterende, og IKKE_RELEVANT-vurderinger.
- **⛔ IKKE_RELEVANT krever gyldig grunnlag.** Gyldige grunner: systemets egenskaper matcher ikke
  SK-ets `relevansFor`, eller SK-ets `beskrivelse` eksplisitt unntar situasjonen. Ugyldige grunner:
  «åpenbart», «gjøres i annet system», «lite hensiktsmessig», tom begrunnelse, eller begrunnelse
  som svarer på et annet spørsmål enn det SK-et faktisk stiller.
- **Verifiser lovreferanser mot lovdata før du «retter» dem.** Eksempel: Nav-loven § 4 a
  (Behandling av personopplysninger) er en reell paragraf tilføyd i 2020 — ikke en feilskrivning
  av § 4. Når du er usikker på om en henvisning er korrekt, slå opp på
  `https://lovdata.no/lov/{lov-dato-nr}/§{paragraf}` før du foreslår endring.
- **Tilordninger og koblinger ER personopplysninger.** En kobling mellom en identifiserbar
  person og noe (kontor, sak, rolle, status) er en personopplysning etter GDPR art. 4(1) —
  selv om det enkelte attributtet kan virke organisatorisk. Behandle slike som
  personopplysninger ved vurdering av K102, K103, K107, K113, K191 mv.
- **SK-IDer er ikke i numerisk rekkefølge.** Les `suksesskriterier[i].beskrivelse` for å
  forstå hva hvert SK spør om. Begrunnelsen MÅ svare på akkurat det spørsmålet — det er en
  vanlig feil å besvare nabo-SK-et fordi man leste i feil rekkefølge.
- Skill mellom det som kan verifiseres i kode og det som krever teamets input
- Marker `[Teamet må dokumentere: ...]` der koden ikke gir svar
- Bevar ALLTID eksisterende begrunnelser ved oppdatering
- Bruk interaktiv SK-gjennomgang (steg 7A) for effektiv kvalitetssikring — teamet ser SK-beskrivelse og diff side om side
- Sesjoner utløper – vær forberedt på å be om nye cookies
- Rapporten er ALLTID hovedleveransen – opplasting er et valgfritt tilleggssteg
- ALDRI last opp til etterlevelsesløsningen uten eksplisitt godkjenning fra bruker etter teamgjennomgang

