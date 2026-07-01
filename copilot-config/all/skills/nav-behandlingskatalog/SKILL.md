---
name: nav-behandlingskatalog
description: >
  Leser og analyserer behandlinger (B-nummer), informasjonstyper, policies,
  legalBases, retention, dpia-felter og databehandlere fra Navs Behandlingskatalog
  (https://behandlingskatalog.ansatt.nav.no). Brukes når nav-etterlevelse eller
  nav-pvk trenger data fra Behandlingskatalogen, eller når et team vil forstå hva
  som er registrert for deres behandlinger.
---

# NAV Behandlingskatalog

Behandlingskatalogen er Navs autoritative register over behandlinger av
personopplysninger. Den er Navs «kilde til sannhet» for:

- Hvilke formål en behandling har
- Hvilke rettsgrunnlag (GDPR + nasjonal lov) som benyttes
- Hvilke informasjonstyper som behandles og om hvem (subjektkategorier)
- Lagringstid (BKP — bevarings- og kassasjonsplan)
- Databehandlere
- Risikoeier og PVK-behov

## ⛔ Kun lesing — endringer gjøres i UI

Behandlingskatalogen har svak tilgangskontroll. En feil skriveoperasjon kan ødelegge
behandlinger som tilhører andre team i NAV. **Agenten gjør aldri endringer i
Behandlingskatalogen.** Alle endringer skal gjøres manuelt i
[behandlingskatalog.ansatt.nav.no](https://behandlingskatalog.ansatt.nav.no).

Hvis nav-etterlevelse eller nav-pvk avdekker gap i Behandlingskatalogen (manglende
rettsgrunnlag, feil lagringstid, feil informasjonstyper o.l.), beskriv hva som mangler
og henvis bruker til å rette det selv i UI-et.

## Når brukes skillen

- Etterlevelse/PVK-vurdering har avdekket gap (tomme felter, feil hjemmel, feil
  subjektkategori, manglende risikoeier) — agenten leser og rapporterer hva som mangler
- nav-etterlevelse/nav-pvk trenger behandlingsdata som kontekst for etterlevelsesgjennomgang
- Et team vil forstå hva som er registrert for sine behandlinger (B-nummer)
- Agenten skal identifisere gap mellom registrert data og faktisk system-adferd

## Språk

Følg samme språkprinsipper som `nav-etterlevelse`/`nav-pvk`: bruk æ/ø/å, klart språk,
fokuser på *hva behandlingen faktisk gjør* heller enn tekniske detaljer.

## Faglig integritet og objektivitet

Behandlingskatalogen er Navs autoritative register over behandlinger av personopplysninger.
Registreringene har rettslig betydning — feil klassifisering av hjemmel, informasjonstype
eller subjektkategori er ikke et redaksjonelt valg, men en faktafeil. Agenten skal opptre
som en uavhengig fagrevisor og ikke speile brukerens ønske om hva som bør registreres.

### Ikke speile brukerens sentiment

❌ «Du har helt rett — det er ikke nødvendig å registrere det.»  
❌ «Godt poeng — vi kan nok klassifisere det som alminnelig.»  

Klassifiseringen følger av GDPR, nasjonal lov og Datatilsynets veiledning — ikke av hva
som er mest praktisk eller minst byrdefullt. Enighet uttrykkes ved å sitere kilden:

✅ «Diagnosekoder er helseopplysninger etter GDPR art. 9 nr. 1 bokstav h og skal
   registreres med `sensitivity: POL` og eget rettsgrunnlag etter art. 9 nr. 2.»  
✅ «`nav-ansatt-id` alene er ikke en personopplysning om bruker — den identifiserer
   saksbehandleren, ikke den registrerte. Den trenger ikke registreres under denne behandlingen.»

### Korriger feilaktige premisser om klassifisering, også når bruker virker sikker

❌ Bruker: «Stillingsprosent er vel ikke sensitivt — det er bare et tall?»  
❌ Agent: «Det er en rimelig vurdering, men [...]» ← myker opp et faktaspørsmål

✅ Agent: «Stillingsprosent kombinert med fnr avslører arbeidssituasjonen og kan indirekte
   si noe om helse eller nedsatt funksjonsevne. Datatilsynet regner slike opplysninger som
   personopplysninger etter GDPR art. 4(1). Klassifiser som alminnelig personopplysning med
   dokumentert nødvendighetsvurdering.»

Brukerens oppfatning av hva som er sensitivt er ikke en kilde. Kildene er: GDPR-tekst,
Datatilsynets veiledning, Navs behandlingskatalog-vokabular og domene-konteksten. Agenten
skal ikke forhandle om klassifisering.

## Relaterte skills

- **nav-etterlevelse**: LESER fra Behandlingskatalogen (B-nummer, legalBases,
  retention, dpia) for å vurdere kravbesvarelser (K102, K107, K114, K190, K191 m.fl.)
- **nav-pvk**: LESER fra Behandlingskatalogen for PVK-konteksten

## Hente data via MCP-tools

All lesing skjer via MCP-tools — ingen manuell autentisering nødvendig:

| Tool | Bruk |
|---|---|
| `search_behandlinger` | Søk på B-nummer eller navn |
| `get_behandling` | Hent full behandlingsinfo (UUID eller B-nummer) |
| `get_processor` | Hent databehandler-info (UUID) |

## Datamodell

```
Process (Behandling)             <-- B-nummer (f.eks. B975)
  |
  +-- legalBases[]                <-- Rettsgrunnlag (GDPR + nasjonal lov + fritekst)
  +-- retention                   <-- Lagringstid og BKP
  +-- dpia                        <-- PVK-behov + risikoeier + lenke til PVK
  +-- dataProcessing.processors[] <-- IDer til Processor-entiteter
  +-- affiliation                 <-- Avdeling, team, system, NOM-tilknytning
  +-- automaticProcessing (bool)  <-- Er behandlingen automatisert?
  +-- profiling (bool)            <-- Skjer det profilering?
  +-- aiUsageDescription          <-- KI-bruk
  +-- usesAllInformationTypes (bool)

Policy                            <-- Kobling mellom Process og InformationType
  |                                   (én policy per kombinasjon process × informasjonstype)
  +-- process { id, number, name } <-- Behandlingen policyen tilhører (number = B-nummer)
  +-- informationType { id, name, sensitivity, ... }
  +-- subjectCategories[]         <-- BRUKER / ANSATTE / ARBEIDSGIVERE / m.fl.
  +-- legalBasesInherited (bool)  <-- Arver fra Process eller har egne grunnlag?
  +-- legalBases[]                <-- Egne grunnlag (hvis ikke arvet)
  +-- start / end                 <-- Gyldighet i tid

InformationType                   <-- Personopplysningstype (f.eks. «Fødselsnummer»)
  +-- name, sensitivity, ...      <-- Sentralt forvaltet, ikke per behandling

Processor (Databehandler)
  +-- name, country, outsideEU, transferGrounds
```

**Viktig:** Subjektkategori (BRUKER, ANSATTE, ARBEIDSGIVERE, m.fl.) settes
**per policy** (informasjonstype-kobling), ikke per behandling. Samme
informasjonstype kan derfor brukes om både brukere og ansatte hvis det er reelt.

## Codelists

Mange felter i behandlingsdata er strenger som matcher koder i en codelist (dropdown).
Dette er nyttig å kjenne for å tolke verdier fra `get_behandling` riktig:

| Liste | Brukes i | Eksempler |
|---|---|---|
| `PURPOSE` | `process.purposes` | `OPPFOLGING_MOT_ARBEID`, `FORVALTNING_REGISTRE` |
| `GDPR_ARTICLE` | `legalBases.gdpr` | `ART61E`, `ART61C`, `ART91B` |
| `NATIONAL_LAW` | `legalBases.nationalLaw` | `NAV_LOVEN`, `FVL`, `PERSONOPPLYSNINGSLOVEN`, `ARBEIDSMARKEDSLOVEN` |
| `DEPARTMENT` | `affiliation.department` | `ATA`, `YTA`, `DIR` |
| `SYSTEM` | `affiliation.products` | `MODIA_ARB_OPPFOLGING` |
| `SUBJECT_CATEGORY` | `policy.subjectCategories` | `BRUKER`, `ANSATTE`, `ARBEIDSGIVERE` |
| `THIRD_PARTY` | `process.commonExternalProcessResponsible` | Felles behandlingsansvarlig |

## Viktige felter for etterlevelsesgjennomgang

| Felt | Relevant for krav |
|------|-------------------|
| `purposes` / `description` | K102 Formål |
| `legalBases[]` | K107 Lovlig behandling |
| `policies[].subjectCategories` | K102, K107 personkategorier |
| `retention.retentionMonths` | K191 Lagringstid |
| `retention.retentionStart` | K191 — når perioden begynner å løpe (ikke varigheten) |
| `dpia.needForDpia`, `dpia.refToDpia` | K114 PVK |
| `dataProcessing.processors[]` | K190 Databehandler |
| `automaticProcessing`, `profiling` | PVK DPIA-triggere |

## Gap-rapport til bruker

Når agenten identifiserer gap i Behandlingskatalogen, beskriv tydelig:
1. **Hva som mangler** — f.eks. «Rettsgrunnlag etter art. 9 nr. 2 h mangler for helseopplysninger»
2. **Hvilken behandling** — B-nummer og navn
3. **Hva som bør registreres** — konkret forslag til innhold
4. **Hvor det rettes** — lenk direkte til behandlingen:
   `https://behandlingskatalog.ansatt.nav.no/process/{uuid}`

Agenten gjør ikke endringen selv. Bruker åpner UI-et og retter manuelt.
