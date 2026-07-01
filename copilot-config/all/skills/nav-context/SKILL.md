---
name: nav-context
description: >
  Lager eller oppdaterer domain-context.md og/eller system-context.md i gjeldende katalog.
  Filene gir domenekunnskap og systemspesifikk kunnskap som nav-etterlevelse og nav-pvk
  bruker som kontekst. Henter data fra behandlingskatalog, GitHub-repoer og eventuelt Navet.
  Bruk denne når nav-etterlevelse eller nav-pvk etterlyser kontekstfil, eller når du vil
  opprette/oppdatere konteksten for et system som skal vurderes.
---

# NAV Kontekst-wizard

Denne skillen lager kontekstfiler i gjeldende katalog som brukes av **nav-etterlevelse**
og **nav-pvk** for å forstå systemets formål, rettslig grunnlag, personopplysningsbehandling
og faglige retningslinjer — informasjon som ikke alltid fremgår av koden alene.

## To kontekstnivåer

### `domain-context.md` — Domenekontekst (deles på tvers av systemer)
Felles kunnskap for alle systemer innenfor et fagområde (f.eks. «Arbeidsrettet oppfølging»):
- Rettslig grunnlag og GDPR-hjemmel (felles for fagområdet)
- Hva som er/ikke er lovlig å registrere (faglige restriksjoner)
- Faglige retningslinjer fra Navet
- Aktuelle lover og forordninger

Lages én gang per fagområde. Kan legges i et felles repo eller kopieres til hvert system-repo.

### `system-context.md` — Systemkontekst (system-spesifikk, committert i repoet)
Kunnskap spesifikk for ett system:
- Systembeskrivelse og brukere
- Kategorier av personopplysninger (fra behandlingskatalog)
- Behandlingens livsløp (oppstart, avslutning, lagringstid)
- Tilgangsstyring og databehandlerforhold
- Referanser til behandlingskatalog, Navet, etterlevelse

---

## Arbeidsflyt

### Steg 1: Sjekk om filene allerede finnes

```bash
ls -la ./domain-context.md ./system-context*.md 2>/dev/null || echo "Ingen kontekstfiler funnet"
```

**Beslutningsregel:**

| Situasjon | Handling |
|-----------|----------|
| `system-context.md` mangler i CWD | **Opprett alltid** — dette er hovedleveransen |
| `domain-context.md` finnes i CWD og matcher systemets domene | Bruk eksisterende |
| `domain-context.md` finnes i CWD men tilhører et annet domene | **Opprett ny** for riktig domene |
| `domain-context.md` mangler i CWD, skillmappens bundlede fil matcher domenet | Bruk/kopier den bundlede filen |
| `domain-context.md` mangler i CWD, og bundlet fil matcher ikke | **Opprett ny** for riktig domene |
| Begge finnes og matcher | Spør bruker om oppdatering er ønsket; avslutt ellers |

**`system-context.md` skal alltid opprettes hvis den mangler** — selv om `domain-context.md`
finnes fra før. Domenekonteksten er generell; systemkonteksten er unik per system og er
det nav-etterlevelse og nav-pvk trenger for presise vurderinger.

**Domain-match-sjekk:** Les første linje/tittel i eksisterende `domain-context.md` og
sammenlign med systemets fagområde (f.eks. «Arbeidsrettet oppfølging» vs. «Sosiale tjenester»).
Hvis domenet ikke stemmer, opprett ny `domain-context-{domene}.md` i CWD.

Spør bruker om nødvendig informasjon (steg 2) og fortsett direkte til å opprette filene
uten å spørre om «hvilke filer» — det avgjøres av tabellen over.

### Steg 2: Innhent grunnleggende info fra bruker

Spør om:
- **Systemnavn**: Hva heter systemet? (f.eks. «Arbeidsrettet dialog», «Aktivitetsplanen»)
- **Beskrivelse**: Hva gjør systemet? Hvem bruker det? (1-2 setninger)
- **GitHub-repoer**: `navikt/{repo}` — ett eller flere repoer (valgfritt, for dypere analyse)
- **Behandlings-ID(er)**: Format `B123`, `B456` — fra behandlingskatalog (valgfritt, men anbefalt)
- **Etterlevelsesdokumentasjon-ID**: UUID — fra etterlevelse.ansatt.nav.no (valgfritt)

### Steg 3: Hent data fra Behandlingskatalog

Bruk MCP-tools — ingen manuell autentisering nødvendig:

- `search_behandlinger` — søk på B-nummer eller systemnavn
- `get_behandling` — hent full behandlingsinfo (UUID eller B-nummer)
- `get_processor` — hent databehandlerdetaljer

Hvis behandlings-ID er oppgitt (f.eks. `B123`), hent direkte med `get_behandling`.
Ellers søk med `search_behandlinger` på systemnavn eller formål og velg riktig treff.

**Nøkkelfelter å hente ut:**
- `name` — behandlingens navn
- `purposes[]` — formål med behandlingen
- `legalBases[]` — rettslig grunnlag (art. 6, art. 9 + nasjonal hjemmel)
- `policies[]` — personkategorier og personopplysningstyper (med sensitivitet)
- `retention.retentionMonths` — lagringstid
- `dataProcessing.processors[]` — databehandlere (hent detaljer med `get_processor`)
- `automaticProcessing`, `profiling` — automatisert behandling/profilering
- `dpia.needForDpia`, `dpia.refToDpia` — DPIA-vurdering

### Steg 4: Faglig kontekst fra Navet (valgfritt, anbefalt)

Navet er NAVs interne SharePoint-baserte intranett med fagområdespesifikke sider om
lover, retningslinjer og hva veiledere har lov/ikke lov til å registrere. Denne
informasjonen er verdifull for domenekonteksten, men kan ikke hentes automatisk.

**⛔ Ikke bruk SSO-cookies for å hente Navet-innhold.** SharePoint-tokens (`rtFa`,
`FedAuth`) gir tilgang til all brukerens SharePoint-data og skal ikke sendes til
eksterne modeller.

**Kjente fagområder og Navet-URL-er:**

| Fagområde | Navet-URL |
|-----------|-----------|
| Arbeidsrettet oppfølging og veiledning | `https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-arbeidsrettet-brukeroppfolging` |
| Arbeidsavklaringspenger (AAP) | `https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-arbeidsavklaringspenger` |
| Dagpenger | `https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-dagpenger` |
| Sykefraværsoppfølging og sykepenger | `https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-sykefravarsoppfolging-og-sykepenger` |
| Sosiale tjenester | `https://navno.sharepoint.com/sites/fag-og-ytelser-sosiale-tjenester` |
| Tiltak og virkemidler | `https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-tiltak-og-virkemidler` |
| Alderspensjon | `https://navno.sharepoint.com/sites/fag-og-ytelser-pensjon-alderspensjon` |
| Markedsarbeid | `https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-markedsarbeid` |

Spør bruker om å åpne den relevante Navet-siden og lime inn eller oppsummere innhold fra:
- Sider med «Personvern» i tittelen → rettslig grunnlag og formålsbegrensninger
- Sider med «Rutiner» eller «Retningslinjer» → operative restriksjoner
- Sider med «Lover og regler» → primær hjemmel

Oppsummer funnene kondensert i domenekonteksten — ikke inkluder rå sideinnhold.

### Steg 5: Inspiser kildekode (valgfritt)

Bruk explore-agenter parallelt for å finne personvernrelevante funn i repoene:

```
task explore: "Søk i navikt/{repo} etter: database-skjemaer (entities, SQL), personopplysningstyper 
som lagres, tilgangsmekanismer (auth), Kafka-topics med persondata, og slettelogikk. 
Gi en kompakt oppsummering (maks 300 ord)."
```

Fokuser på:
- Hvilke personidentifikatorer brukes? (fnr, aktørId, aktorId)
- Hva lagres i database? (entity-klasser, SQL migrations)
- Hvem sender/mottar data? (Kafka-topics, REST-klienter)
- Når slettes data? (slettejobber, retention-mekanismer)

### Steg 6: Generer kontekstfiler

Skriv filene til CWD. Bruk malene under. Fyll ut alle seksjoner basert på innsamlet informasjon.
Der informasjon mangler, skriv `[Teamet må fylle inn: ...]` som placeholder.

```bash
cat > ./domain-context.md << 'EOF'
{DOMENE-INNHOLD}
EOF

cat > ./system-context.md << 'EOF'
{SYSTEM-INNHOLD}
EOF
```

**Fortell brukeren:**
- Hvilke seksjoner som er automatisk utfylt (fra behandlingskatalog/Navet/kode)
- Hvilke placeholders som trenger manuell utfylling
- At `system-context.md` bør committes til repoet og oppdateres ved endringer
- At `domain-context.md` kan deles på tvers av systemer i samme fagområde

---

## Mal for domain-context.md

```markdown
# NAV Domenekontekst: {Fagområde}

Generert: {YYYY-MM-DD}  
Fagområde: {Navn og Navet-URL}  
Gjelder systemer: {Liste over systemer som deler denne konteksten}

> Deles av alle systemer innenfor fagområdet. Oppdater ved regelverksendringer
> eller endringer i faglige retningslinjer. Ikke system-spesifikk informasjon her.

---

## 1. Rettslig grunnlag (felles for fagområdet)

### Primær nasjonal hjemmel
{Lov og paragraf}

### GDPR-grunnlag
**Artikkel 6(1){x}** — {begrunnelse}

### Særlig om sensitive personopplysninger (art. 9)
{Hvis aktuelt, ellers «Ikke aktuelt»}

### Hva er lovlig å registrere
{Konkrete eksempler}

### Hva er IKKE lovlig å registrere
{Konkrete eksempler — særlig viktig for fritekstfelt}

---

## 2. Faglige retningslinjer og restriksjoner

{Fra Navet: operative krav til veiledere/systemene. «Du skal/skal ikke»-regler.}

---

## 3. Kategorier av registrerte (felles)

{Hvem behandles i dette fagområdet?}

---

## 4. Referanser

- **Navet**: {URL til fagområdespesifikke sider}
- **Lovdata**: {URL til hjemmel}
```

## Mal for system-context.md

```markdown
# NAV Systemkontekst: {Systemnavn}

Generert: {YYYY-MM-DD}  
Behandlings-ID(er): {B123, B456}  
Behandlingskatalog: {URL}  
DPIA/PVK: {URL}  
Domenekontekst: Se domain-context.md  
Primær kodebase: navikt/{repo}

> Committert i repoet. Oppdater ved endringer i systemet eller nye integrasjoner.

---

## 1. Systembeskrivelse

### Hva er systemet?
{Brukers perspektiv, ikke teknisk. Hva gjør det? Hvem bruker det?}

### Komponenter
{Hvis systemet består av flere repoer/tjenester — list dem opp}

### Hvem bruker systemet?
- **De registrerte (brukere/borgere)**: {Hvem? Størrelse?}
- **Interne brukere**: {Veiledere/saksbehandlere}

---

## 2. Kategorier av personopplysninger

### Fra behandlingskatalog
| Opplysningstype | Sensitivitet | Registrerte |
|-----------------|-------------|-------------|
| {Navn} | {POL/SAERLIG} | {Bruker/Ansatt} |

### Systemspesifikt (fra kodegjennomgang)
{DB-tabeller og felter med persondata, Kafka-nøkler etc.}

---

## 3. Behandlingens livsløp

### Oppstart
{Hva utløser behandlingen?}

### Avslutning og sletting
{Hva avslutter? Lagringstid?}

**Lagringstid:** {X måneder — fra behandlingskatalog}

---

## 4. Tilgangsstyring

### Bruker/borger
{Autentisering: ID-porten, sikkerhetsnivå}

### Intern (veiledere)
{Azure AD, poao-tilgang, annotasjoner}

### Særskilte begrensninger
{Kontorsperre, adressebeskyttelse}

---

## 5. Databehandlere og integrasjoner

| Aktør | Rolle | Hva deles |
|-------|-------|-----------|
| {Navn} | Databehandler | {Hva} |

---

## 6. Referanser

- **Behandlingskatalog**: {URL}
- **Etterlevelse**: {URL}
- **GitHub**: {URL}
```

---

## Vanlige spørsmål

**Må alle seksjoner fylles ut?**
Nei, men jo mer som er utfylt, jo bedre vurderinger kan nav-pvk og nav-etterlevelse gi.
Prioriter seksjonene 2 (rettslig grunnlag), 4 (personopplysninger) og 6 (restriksjoner).

**Hvor ofte bør filen oppdateres?**
Ved vesentlige endringer i systemet (nye datatyper, nye integrasjoner), ved regelverksendringer,
eller minst én gang per år i forbindelse med PVK-revisjon.

**Kan filen committes i repoet?**
Ja, det anbefales. Filen inneholder ingen hemmeligheter og bør versjoneres med koden.

**Hva hvis behandlingskatalog ikke har info om systemet?**
Fyll ut manuelt basert på teamets kunnskap. Behandlingskatalogen bør uansett oppdateres —
alle behandlinger av personopplysninger i NAV skal være registrert der.

## Modellvalg for deloppgaver

nav-context er primært en datahentings- og skrivoppgave uten tung juridisk analyse.
Bruk billige/raske modeller for nesten alt.

| Oppgave | Anbefalt modell | Begrunnelse |
|---|---|---|
| Hente data fra Behandlingskatalog via MCP-tools (steg 3) | `claude-haiku-4.5` | Strukturert datahenting |
| Strukturere Navet-innhold fra brukerens oppsummering (steg 4) | `claude-haiku-4.5` | Strukturering av oppgitt tekst |
| Kodegjennomgang for personvernrelevante funn (steg 5) | `claude-haiku-4.5` | Explore-agenter bruker allerede Haiku som standard |
| Skrive domain-context.md og system-context.md (steg 6) | `claude-sonnet-4.6` | Fri tekst som skal være presis og lesbar for jurister og teknikere |
