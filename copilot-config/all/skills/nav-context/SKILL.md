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
ls -la ./domain-context.md ./system-context.md 2>/dev/null || echo "Ingen kontekstfiler funnet"
```

Spør bruker hvilke filer som skal opprettes/oppdateres:
- **Ny `domain-context.md`** — kun hvis det ikke finnes én for fagområdet fra før
- **Ny `system-context.md`** — for systemet som skal vurderes
- **Oppdatere eksisterende** — vis gjeldende innhold og la brukeren bestemme seksjoner

### Steg 2: Innhent grunnleggende info fra bruker

Spør om:
- **Systemnavn**: Hva heter systemet? (f.eks. «Arbeidsrettet dialog», «Aktivitetsplanen»)
- **Beskrivelse**: Hva gjør systemet? Hvem bruker det? (1-2 setninger)
- **GitHub-repoer**: `navikt/{repo}` — ett eller flere repoer (valgfritt, for dypere analyse)
- **Behandlings-ID(er)**: Format `B123`, `B456` — fra behandlingskatalog (valgfritt, men anbefalt)
- **Etterlevelsesdokumentasjon-ID**: UUID — fra etterlevelse.ansatt.nav.no (valgfritt)

### Steg 3: Hent data fra Behandlingskatalog

Behandlingskatalog krever autentisering med `forwardauth`-cookie fra ansatt.nav.no.

**Sjekk først om cookien allerede er tilgjengelig i samtalen** — hvis nav-etterlevelse eller
nav-pvk ble kjørt i samme sesjon har brukeren sannsynligvis allerede oppgitt den. Hvis ikke,
be bruker om den:
> Åpne behandlingskatalog.ansatt.nav.no → DevTools → Application → Cookies → kopier `forwardauth`

```bash
cat > /tmp/bk_cookies.txt << 'COOKIEOF'
forwardauth=<lim inn verdi her>
COOKIEOF
```

**⚠️ Viktig: `searchText`-parameteren i `/api/process` filtrerer IKKE resultater** — den
returnerer alle behandlinger ufiltrert. Bruk paginering og filtrer lokalt:

```bash
# Finn behandling ved å søke gjennom alle sider
BK_COOKIES=$(cat /tmp/bk_cookies.txt | tr -d '\n')

python3 << 'PYEOF'
import subprocess, json

cookies_val = open('/tmp/bk_cookies.txt').read().strip()
page = 0
while True:
    r = subprocess.run([
        "curl", "-sL",
        f"https://behandlingskatalog.ansatt.nav.no/api/process?pageSize=50&pageNumber={page}",
        "-H", f"Cookie: {cookies_val}",
        "-H", "Accept: application/json"
    ], capture_output=True, text=True)
    data = json.loads(r.stdout)
    total_pages = data.get('pages', 1)
    for p in data.get('content', []):
        name = (p.get('name') or '').lower()
        # Tilpass søkestrengen etter det du leter etter:
        if 'oppfølging' in name or 'dialog' in name or 'aktivitet' in name:
            print(f"{p['number']} | {p['id']} | {p['name']}")
    page += 1
    if page >= total_pages:
        break
PYEOF
```

Hent deretter full behandlingsinfo med UUID:

```bash
BK_COOKIES=$(cat /tmp/bk_cookies.txt | tr -d '\n')
curl -sL "https://behandlingskatalog.ansatt.nav.no/api/process/{behandling-uuid}" \
  -H "Cookie: $BK_COOKIES" -H "Accept: application/json" | python3 -m json.tool
```

**Nøkkelfelter å hente ut:**
- `name` — behandlingens navn
- `purposes[]` — formål med behandlingen
- `legalBases[]` — rettslig grunnlag (art. 6, art. 9 + nasjonal hjemmel)
- `policies[]` — personkategorier og personopplysningstyper (med sensitivitet)
- `retention.retentionMonths` — lagringstid
- `dataProcessing.processors[]` — databehandlere
- `automaticProcessing`, `profiling` — automatisert behandling/profilering
- `dpia.needForDpia`, `dpia.refToDpia` — DPIA-vurdering

```bash
# For databehandlerdetaljer (processor-ID-er fås fra behandlingens dataProcessing.processors[]):
BK_COOKIES=$(cat /tmp/bk_cookies.txt | tr -d '\n')
curl -sL "https://behandlingskatalog.ansatt.nav.no/api/processor/{processor-id}" \
  -H "Cookie: $BK_COOKIES" -H "Accept: application/json" | python3 -m json.tool
```

### Steg 4: Faglig kontekst fra Navet (valgfritt, anbefalt)

Navet er NAVs interne SharePoint-baserte intranett. Relevante fagområdespesifikke sider
gir kunnskap om lover, retningslinjer og hva veiledere har lov/ikke lov til å registrere.

**Kjente fagområder og Navet-URL-er:**

| Fagområde | Navet-URL |
|-----------|-----------|
| Arbeidsrettet oppfølging og veiledning | `https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-arbeidsrettet-brukeroppfolging` |
| Sykefraværsoppfølging og sykepenger | `https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-sykefravarsoppfolging-og-sykepenger` |
| Sosiale tjenester | `https://navno.sharepoint.com/sites/fag-og-ytelser-sosiale-tjenester` |
| Tiltak og virkemidler | `https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-tiltak-og-virkemidler` |
| Markedsarbeid | `https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-markedsarbeid` |

Spør bruker:
1. Hvilke(t) fagområde(r) tilhører systemet? (bruker kan oppgi URL direkte hvis listen er ufullstendig)
2. Kan du oppgi SharePoint SSO-cookies? (åpne navno.sharepoint.com → DevTools → Application → Cookies → kopier `rtFa` og `FedAuth`)

#### Navet-henting via SharePoint REST API

```bash
NAVET_BASE="https://navno.sharepoint.com/sites/{fagomrade}"
COOKIES="rtFa=...; FedAuth=..."

# 1. Bekreft tilgang
curl -sL "$NAVET_BASE/_api/web?\$select=Title" -H "Cookie: $COOKIES" -H "Accept: application/json;odata=nometadata" | python3 -c "import json,sys; d=json.load(sys.stdin); print('Site:', d.get('Title'))"

# 2. Finn relevante sider (Personvern, Rutiner, Lover og regler)
curl -sL "$NAVET_BASE/_api/web/lists?\$select=Title,Id,ItemCount&\$top=30" \
  -H "Cookie: $COOKIES" -H "Accept: application/json;odata=nometadata" | python3 -c "
import json,sys
data = json.load(sys.stdin)
for l in sorted(data.get('value',[]), key=lambda x: -x.get('ItemCount',0)):
    if l.get('ItemCount',0) > 0:
        print(f'{l[\"Id\"]} | [{l[\"ItemCount\"]:4}] {l[\"Title\"]}')
"

# 3. Hent Site Pages - søk etter relevante titler
PAGES_LIST_ID="<ID for Site Pages-listen>"
curl -sL "$NAVET_BASE/_api/web/lists(guid'$PAGES_LIST_ID')/items?\$top=200" \
  -H "Cookie: $COOKIES" -H "Accept: application/json;odata=nometadata" | python3 -c "
import json,sys
data = json.load(sys.stdin)
relevant = ['personvern', 'rutiner', 'retningslinje', 'lover', 'regler', 'oppfolging', 'oppfølging']
for r in data.get('value',[]):
    title = r.get('Title','') or ''
    if any(k in title.lower() for k in relevant):
        print(f'ID={r[\"Id\"]} Modified={r.get(\"Modified\",\"\")[:10]} | {title}')
"

# 4. Hent innhold fra en bestemt side (ID fra listen over)
PAGE_ID="<side-ID>"
curl -sL "$NAVET_BASE/_api/web/lists(guid'$PAGES_LIST_ID')/items($PAGE_ID)" \
  -H "Cookie: $COOKIES" -H "Accept: application/json;odata=nometadata" > /tmp/navet_page.json

python3 << 'PYEOF'
import json, html, re
with open('/tmp/navet_page.json') as f:
    data = json.load(f)
canvas = html.unescape(data.get('CanvasContent1', ''))
# Fjern HTML-tagger, behold tekst
for tag in ['<br>', '<br/>', '<br />']:
    canvas = canvas.replace(tag, '\n')
canvas = re.sub(r'<(p|div|li)[^>]*>', '\n', canvas, flags=re.IGNORECASE)
canvas = re.sub(r'<[^>]+>', '', canvas)
canvas = re.sub(r'\n{3,}', '\n\n', canvas)
print(canvas[:5000])
PYEOF
```

**Prioriterte sider å hente:**
- Sider med «Personvern» i tittelen → rettslig grunnlag og formålsbegrensninger
- Sider med «Rutiner» eller «Retningslinjer» → operative restriksjoner
- Sider med «Lover og regler» → primær hjemmel

Oppsummer funnene kondensert — ikke dump rå sideinnhold i context.md.

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
