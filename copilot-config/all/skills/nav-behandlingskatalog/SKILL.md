---
name: nav-behandlingskatalog
description: >
  Oppretter og oppdaterer behandlinger (B-nummer), informasjonstyper, policies,
  legalBases, retention, dpia-felter og databehandlere i Navs Behandlingskatalog
  (https://behandlingskatalog.ansatt.nav.no). Brukes når nav-etterlevelse eller
  nav-pvk avdekker gap i Behandlingskatalogen (manglende rettsgrunnlag, feil
  lagringstid, manglende risikoeier, feil registrerte informasjonstyper o.l.),
  eller når et team skal opprette en ny behandling.
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

`nav-etterlevelse` og `nav-pvk` LESER fra Behandlingskatalogen, men ENDRINGER skal
gjøres med denne skillen.

## Når brukes skillen

- Etterlevelse/PVK-vurdering har avdekket gap (tomme felter, feil hjemmel, feil
  subjektkategori, manglende risikoeier)
- Et team skal opprette en helt ny behandling
- Endring av eksisterende behandling (utvidet formål, nye informasjonstyper,
  ny databehandler, oppdatert lagringstid)
- Behandling skal endelig settes til COMPLETED etter at PVK er godkjent

## Språk

Følg samme språkprinsipper som `nav-etterlevelse`/`nav-pvk`: bruk æ/ø/å, klart språk,
fokuser på *hva behandlingen faktisk gjør* heller enn tekniske detaljer.

## Relaterte skills

- **nav-etterlevelse**: LESER fra Behandlingskatalogen (B-nummer, legalBases,
  retention, dpia) for å vurdere kravbesvarelser (K102, K107, K114, K190, K191 m.fl.)
- **nav-pvk**: LESER fra Behandlingskatalogen for PVK-konteksten og oppretter
  PVK-dokument (`dpia.refToDpia` peker inn dit)

## Autentisering

- **Les** (GET): `https://behandlingskatalog-backend.intern.nav.no/api/` — ingen auth (krever naisdevice)
- **Skriv** (POST/PUT): `https://behandlingskatalog-backend.intern.nav.no/api/` — SSO-cookies påkrevd

`behandlingskatalog.ansatt.nav.no` er internett-eksponert og beskyttet av forwardauth.
Bruk alltid `behandlingskatalog-backend.intern.nav.no` for API-kall fra skillen.

Test at skrivesesjonen er gyldig (etter innlogging):
```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  'https://behandlingskatalog-backend.intern.nav.no/api/process/{behandling-id}' \
  -H "Cookie: etterlevsession=...; sso-nav.no=..."
```
200 = OK, 302 = sesjonen har utløpt.

## Base URL og swagger

```
Base URL:  https://behandlingskatalog-backend.intern.nav.no/api
Swagger:   https://behandlingskatalog-backend.intern.nav.no/api/swagger-ui/index.html
OpenAPI:   https://behandlingskatalog-backend.intern.nav.no/api/v3/api-docs
```


OpenAPI-spec'en er den autoritative kilden for feltnavn og typer.

## Datamodell

```
Process (Behandling)             <-- B-nummer (f.eks. B975)
  |
  +-- legalBases[]                <-- Rettsgrunnlag (GDPR + nasjonal lov + fritekst)
  +-- retention                   <-- Lagringstid og BKP
  +-- dpia                        <-- PVK-behov + risikoeier + lenke til PVK
  +-- dataProcessing.processors[] <-- IDer til Processor-entiteter
  +-- affiliation                 <-- Avdeling, team, system, NOM-tilknytning
  +-- aiUsageDescription          <-- KI-bruk
  +-- automaticProcessing (bool)  <-- Er behandlingen automatisert?
  +-- profiling (bool)            <-- Skjer det profilering?
  +-- usesAllInformationTypes (bool)

Policy                            <-- Kobling mellom Process og InformationType
  |                                   (én policy per kombinasjon process × informasjonstype)
  +-- process { id, number, name }
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

Mange felter er strenger som må matche koder i en codelist (dropdown). Hent listen:

```
GET /api/codelist                       # Alle codelists
GET /api/codelist/{LIST_NAME}           # Én liste
GET /api/codelist/{LIST_NAME}/{CODE}    # Verifiser én kode
```

Vanlige codelists:

| Liste | Brukes i | Eksempler |
|---|---|---|
| `PURPOSE` | `process.purposes` | `OPPFOLGING_MOT_ARBEID`, `FORVALTNING_REGISTRE` |
| `GDPR_ARTICLE` | `legalBases.gdpr` | `ART61E`, `ART61C`, `ART91B` |
| `NATIONAL_LAW` | `legalBases.nationalLaw` | `NAV_LOVEN`, `FVL`, `PERSONOPPLYSNINGSLOVEN`, `ARBEIDSMARKEDSLOVEN` |
| `DEPARTMENT` | `affiliation.department` | `ATA`, `YTA`, `DIR` |
| `SUB_DEPARTMENT` | `affiliation.subDepartments` | Avdelingsavhengig |
| `SYSTEM` | `affiliation.products` | `MODIA_ARB_OPPFOLGING` |
| `SUBJECT_CATEGORY` | `policy.subjectCategories` | `BRUKER`, `ANSATTE`, `ARBEIDSGIVERE` |
| `THIRD_PARTY` | `process.commonExternalProcessResponsible` | Felles behandlingsansvarlig |

## Process-API

```
GET    /api/process                    # List (pagination)
GET    /api/process/{id}               # Hent én
GET    /api/process/search/{Bxxx}      # Søk på B-nummer eller tekst
POST   /api/process                    # Opprett (ProcessRequest)
PUT    /api/process/{id}               # Oppdater (ProcessRequest)
DELETE /api/process/{id}               # Slett
```

### ⛔ KRITISK: ProcessRequest vs Process-respons

GET-responsen er rik — codelist-verdier er nestede objekter (`{code, list, shortName, description}`).
**PUT krever derimot kun strenger** for alle codelist-felter. Du må flate ut.

**Hjelpere:**
```python
def code(o): return o.get('code') if isinstance(o, dict) else o
def codes(l): return [code(x) for x in (l or [])]
```

**ProcessRequest-skjelett (alle codelist-felter som strenger):**
```python
{
    "id": "<uuid>",
    "name": "...",
    "description": "...",                        # fritekst (formål med behandlingen)
    "additionalDescription": "...",              # fritekst, valgfri
    "purposes": ["OPPFOLGING_MOT_ARBEID"],       # kode-strenger
    "commonExternalProcessResponsible": None,    # kode eller None
    "affiliation": {
        "department": "ATA",
        "nomDepartmentId": "...",
        "nomDepartmentName": "...",
        "seksjoner": [{"nomSeksjonId": "...", "nomSeksjonName": "..."}],
        "fylker": [], "navKontorer": [],
        "subDepartments": [],
        "productTeams": ["<team-uuid>"],
        "products": ["MODIA_ARB_OPPFOLGING"],
        "disclosureDispatchers": []
    },
    "start": "0001-01-01", "end": "9999-12-31",
    "legalBases": [{"gdpr": "ART61E", "nationalLaw": "NAV_LOVEN", "description": "§14a"}],
    "usesAllInformationTypes": False,
    "automaticProcessing": True,
    "profiling": False,
    "aiUsageDescription": {"aiUsage": False, "description": None,
                           "reusingPersonalInformation": False,
                           "startDate": None, "endDate": None, "registryNumber": None},
    "dataProcessing": {"dataProcessor": True, "processors": ["<processor-uuid>"]},
    "retention": {"retentionPlan": True, "retentionMonths": 120,
                  "retentionStart": "Ved avslutning av oppfølgingsperiode",
                  "retentionDescription": "..."},
    "dpia": {"needForDpia": True, "refToDpia": "<URL til PVK>",
             "grounds": None, "noDpiaReasons": [],
             "processImplemented": False,
             "riskOwner": "K114452",
             "riskOwnerFunction": "Avdelingsleder, Seksjon for arbeidsoppfølging"},
    "status": "IN_PROGRESS"   # IN_PROGRESS | NEEDS_REVISION | COMPLETED
}
```

### Vanlige feilkilder

| Symptom | Årsak | Løsning |
|---|---|---|
| 400 «Cannot deserialize ... String from Object» | Sendte codelist-objekt der streng forventes | Flat ut med `code()`-hjelperen |
| 400 om ukjent kode | Codelist-kode finnes ikke | Sjekk `/api/codelist/{LIST}` for gyldige verdier |
| 200 men ingen endring | Du sendte tilbake GET-data uten å endre | Verifiser request-body før PUT |

### `legalBases` — hva som kan endres

- `gdpr` og `nationalLaw` er codelist-verdier (dropdown) — **kun fra disse listene**
- `description` er **fritekst** og kan endres fritt (f.eks. paragrafhenvisning)
- For å fjerne en hjemmel: utelat den fra `legalBases`-arrayen i PUT
- For å legge til: legg til ny `{gdpr, nationalLaw, description}`-entry

### `retention` — semantikk

- `retentionMonths`: **antall måneder** (int). 10 år = 120
- `retentionStart`: **når perioden begynner å løpe** (fritekst, f.eks. «Ved
  avslutning av oppfølgingsperiode»). IKKE selve varigheten — det er en vanlig feil
- `retentionDescription`: fritekst med begrunnelse + lenker til BKP/Confluence

### `dpia` — felter

- `needForDpia`: bool — om behandlingen krever PVK
- `refToDpia`: URL til PVK i etterlevelsesløsningen
- `noDpiaReasons[]`: kodeliste over begrunnelser for å ikke utføre PVK
  (f.eks. `NO_SPECIAL_CATEGORY_PI`, `SMALL_SCALE`, `NO_NEW_TECH`)
- `processImplemented`: bool — settes `true` når PVK er godkjent og behandlingen iverksatt
- `riskOwner`: NAV-ident (f.eks. `K114452`)
- `riskOwnerFunction`: fritekst (f.eks. «Avdelingsleder, Seksjon for arbeidsoppfølging»)

### Statusflyt

```
IN_PROGRESS  -->  NEEDS_REVISION  -->  IN_PROGRESS  -->  COMPLETED
```

Sett `COMPLETED` først når:
- Alle obligatoriske felter er fylt ut
- PVK (hvis krevd) er godkjent av risikoeier
- Risikoeier + funksjon er satt
- `processImplemented = true`

## Policy-API

Policy kobler en behandling (Process) til en informasjonstype (InformationType) med
subjektkategori og evt. egne rettsgrunnlag.

```
GET    /api/policy?processId={pid}&pageSize=50   # Listning per behandling
GET    /api/policy?informationTypeId={itid}      # Listning per informasjonstype
GET    /api/policy/{id}                          # Hent en
POST   /api/policy                               # Opprett — body er ARRAY av PolicyRequest
PUT    /api/policy/{id}                          # Oppdater én
PUT    /api/policy                               # Oppdater flere (array)
DELETE /api/policy/{id}                          # Slett én
DELETE /api/policy/process/{processId}           # Slett alle for en behandling
```

### PolicyRequest

```python
{
    "id": "<uuid>",                    # kun ved PUT
    "processId": "<uuid>",             # behandlingen som eier policyen
    "informationTypeId": "<uuid>",     # informasjonstypen som behandles
    "purposes": ["OPPFOLGING_MOT_ARBEID"],   # codelist PURPOSE, ofte arvet fra process
    "subjectCategories": ["BRUKER"],         # codelist SUBJECT_CATEGORY (kan være flere)
    "legalBasesUse": "INHERITED_FROM_PROCESS",  # se under
    "legalBasesInherited": True,             # arver fra process eller har egne?
    "legalBases": [],                        # egne grunnlag hvis legalBasesUse=DEDICATED_LEGAL_BASES
    "documentIds": []
}
```

**`legalBasesUse`-verdier:**
- `INHERITED_FROM_PROCESS` — bruker process'ens legalBases (vanligst)
- `DEDICATED_LEGAL_BASES` — egne legalBases på policyen
- `EXCESS_INFO` — overskuddsinformasjon
- `UNRESOLVED` — ikke avklart

### Typiske oppgaver

**Rett feil subjektkategori:**
```
PUT /api/policy/{policyId}
body: {...existing fields, "subjectCategories": ["BRUKER"]}
```

**Legg til ny subjektkategori for samme informasjonstype:**
To tilnærminger:
1. **Utvid eksisterende policy:** PUT med `subjectCategories: ["ANSATTE", "BRUKER"]` (én policy med flere kategorier)
2. **Opprett ny policy:** POST en helt ny policy med samme `informationTypeId` men annen subjektkategori. *(Bruk denne hvis kategoriene representerer reelt ulike behandlingsspor.)*

NB: Behandlingskatalog-modellen tillater **én policy per (process, informationType)-kombinasjon**.
Praktisk vil tilnærming 1 (utvide subjectCategories på eksisterende policy) være riktig
i de fleste tilfeller.

**Legg til ny informasjonstype:**
1. Finn ID via `GET /api/informationtype/search?name=<søk>`
2. POST en ny policy med `processId`, `informationTypeId`, `subjectCategories`
3. La `legalBasesUse: INHERITED_FROM_PROCESS` med mindre du har gode grunner til noe annet

**Fjern feilregistrert informasjonstype:**
- `DELETE /api/policy/{policyId}`

### ⚠️ POST tar et ARRAY

`POST /api/policy` forventer en **array av PolicyRequest**, ikke et enkelt objekt.
Også når du oppretter én policy må du wrappe i `[...]`. Returnerer **HTTP 201**
ved suksess.

## InformationType-API

```
GET    /api/informationtype?pageSize=...           # List
GET    /api/informationtype/{id}                   # Hent en
GET    /api/informationtype/search?name={søk}      # Søk på navn (query param!)
GET    /api/informationtype/short                  # Kort listing
GET    /api/informationtype/count                  # Antall
POST   /api/informationtype                        # Opprett (sjelden)
PUT    /api/informationtype/{id}                   # Oppdater (sjelden)
DELETE /api/informationtype/{id}                   # Slett (sjelden)
```

Informasjonstyper er sentralt forvaltet. Som regel skal man **finne eksisterende**
informasjonstype og bruke den i en policy, ikke opprette ny. Eksempler på relevante
typer for arbeidsrettet oppfølging:

| ID | Navn | Bruk |
|---|---|---|
| `dfee7781` | Fødsels- og personnummer | Bruker-ID |
| `02260f22` | Folkeregisteridentifikator | Bruker-ID (FREG-versjon) |
| `de7a09df` | NAVs personidentifikator | Som regel ansatt-ident |

Søk med query param: `?name=<søk>` (ikke path segment).

## Processor-API (Databehandler)

```
GET    /api/processor                  # List
GET    /api/processor/{id}             # Hent en
GET    /api/processor/search/{søkeord} # Søk
POST   /api/processor                  # Opprett
PUT    /api/processor/{id}             # Oppdater
```

Standard databehandlere som GCP, Aiven og Microsoft (Entra ID) er allerede registrert
sentralt. Bruk dem ved `dataProcessing.processors = [<uuid1>, <uuid2>]`.

## Andre nyttige endepunkter

```
GET /api/codelist                                  # Alle codelists
GET /api/codelist/{LIST}                           # Én liste
GET /api/process/search/{søkeord}                  # Søk behandlinger
GET /api/process/number/{number}                   # Hent på B-nummer (hvis støttet)
```

## Sandkassemiljø (cplt)

Hvis skillen kjøres via [cplt](https://github.com/navikt/cplt), må arbeidsmappen ha en
`.cplt.toml` som tillater tilgang til interne NAV-ingresser.

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

## Arbeidsflyt for typiske oppgaver

### Oppgave A: Rett feil i eksisterende behandling

1. Hent `/api/process/{id}`
2. Flat ut codelist-objekter til kodestrenger
3. Endre kun de feltene som skal endres
4. PUT tilbake
5. Verifiser respons

### Oppgave B: Legg til ny rettsgrunnlag

1. Hent codelist-koder hvis usikker (`GET /api/codelist/NATIONAL_LAW`)
2. Hent behandlingen, flat ut
3. Legg ny entry til `legalBases`: `{"gdpr": "ART61E", "nationalLaw": "<KODE>", "description": "<paragraf>"}`
4. PUT

### Oppgave C: Rett feil subjektkategori eller legg til ny

1. List policies for behandlingen: `GET /api/policy?processId={pid}`
   *(verifiser path og parametre under utforskning)*
2. Finn relevant policy (informasjonstype-kobling)
3. Enten oppdater eksisterende policy (PUT), eller opprett ny policy for samme
   informasjonstype med annen subjektkategori (POST)
4. Verifiser ved å hente behandlingen på nytt og se på `policies`-listen

### Oppgave D: Sett behandling til COMPLETED

1. Verifiser at PVK er godkjent
2. Hent behandlingen, sett `dpia.processImplemented = true` og `status = "COMPLETED"`
3. PUT

## ⛔ Regler

- **Endrer aldri uten brukerens godkjenning.** Behandlingskatalogen er Navs autoritative
  personvern-register. Foreslå endringen først, vis diff, og oppdater først etter klarsignal.
- **Tar ikke initiativ til å slette behandlinger.** Bare brukeren kan be om det.
- **Setter ikke `status = COMPLETED`** uten at PVK er godkjent og risikoeier er satt.
- **Oppretter ikke nye InformationTypes** uten samråd med personvernombud.

## TBD / Videre utforskning

- [ ] DpProcess-API (`/api/dpprocess`) — databehandler-prosesser
- [ ] Disclosure-API (`/api/disclosure`) — utleveringer
- [ ] Document-API (`/api/document`) — dokumentkatalog
- [ ] System-API — systemer (codelist SYSTEM)
- [ ] Codelist-administrasjon — hvis koder mangler
