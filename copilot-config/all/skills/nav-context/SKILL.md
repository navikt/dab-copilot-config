---
name: nav-context
description: >
  Lager eller oppdaterer en nav-copilot-context.md fil i gjeldende katalog. Filen gir
  domenekunnskap om systemet som nav-etterlevelse og nav-pvk skills bruker som kontekst.
  Henter data fra behandlingskatalog, GitHub-repoer og eventuelt Navet (NAVs intranett).
  Bruk denne når nav-etterlevelse eller nav-pvk etterlyser kontekstfil, eller når du vil
  opprette/oppdatere konteksten for et system som skal vurderes.
---

# NAV Kontekst-wizard

Denne skillen lager `nav-copilot-context.md` i gjeldende katalog — en strukturert beskrivelsesfil
med domenekunnskap om systemet som skal etterlevelse- eller PVK-vurderes.

Filen brukes av **nav-etterlevelse** og **nav-pvk** for å forstå systemets formål, rettslig
grunnlag, personopplysningsbehandling og faglige retningslinjer — informasjon som ikke alltid
fremgår av koden alene.

## Hva er nav-copilot-context.md?

En Markdown-fil med:
- Systembeskrivelse og bruksområde (fra brukerens perspektiv, ikke teknisk)
- Rettslig grunnlag og GDPR-hjemmel
- Kategorier av registrerte og personopplysninger (fra behandlingskatalog)
- Behandlingens livsløp (oppstart, avslutning, lagringstid)
- Faglige restriksjoner og retningslinjer (fra Navet)
- Tilgangsstyring og databehandlerforhold
- Referanser (Navet, Lovdata, behandlingskatalog)

Filen er ment å holdes oppdatert av teamet ved endringer i fagfeltet eller systemet.

---

## Arbeidsflyt

### Steg 1: Sjekk om filen allerede finnes

```bash
ls -la ./nav-copilot-context.md 2>/dev/null && echo "FIL FINNES" || echo "FIL MANGLER"
```

Hvis filen finnes: Spør bruker om de vil **oppdatere** den, eller **overskrive** den fra scratch.
Vis gjeldende innhold og la brukeren bestemme hvilke seksjoner som skal oppdateres.

### Steg 2: Innhent grunnleggende info fra bruker

Spør om:
- **Systemnavn**: Hva heter systemet? (f.eks. «Arbeidsrettet dialog», «Aktivitetsplanen»)
- **Beskrivelse**: Hva gjør systemet? Hvem bruker det? (1-2 setninger)
- **GitHub-repoer**: `navikt/{repo}` — ett eller flere repoer (valgfritt, for dypere analyse)
- **Behandlings-ID(er)**: Format `B123`, `B456` — fra behandlingskatalog (valgfritt, men anbefalt)
- **Etterlevelsesdokumentasjon-ID**: UUID — fra etterlevelse.ansatt.nav.no (valgfritt)

### Steg 3: Hent data fra Behandlingskatalog

For hver behandlings-ID (f.eks. `B580`):

```bash
# Slå opp behandlingsnummeret for å finne UUID
curl -s "https://behandlingskatalog.ansatt.nav.no/api/process?number=B580" | python3 -m json.tool | head -50
```

Deretter hent full behandlingsinfo:
```bash
curl -s "https://behandlingskatalog.ansatt.nav.no/api/process/{behandling-uuid}" | python3 -m json.tool
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
# For databehandlerdetaljer:
curl -s "https://behandlingskatalog.ansatt.nav.no/api/processor/{processor-id}" | python3 -m json.tool
```

> **Merk:** Behandlingskatalogen er åpent tilgjengelig — ingen SSO kreves.

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

### Steg 6: Generer nav-copilot-context.md

Skriv filen til CWD. Bruk malen under. Fyll ut alle seksjoner basert på innsamlet informasjon.
Der informasjon mangler, skriv `[Teamet må fylle inn: ...]` som placeholder.

```bash
cat > ./nav-copilot-context.md << 'EOF'
{GENERERT INNHOLD}
EOF
```

**Fortell brukeren:**
- Hvilke seksjoner som er automatisk utfylt (fra behandlingskatalog/Navet/kode)
- Hvilke placeholders som trenger manuell utfylling
- At filen bør committes til repoet og oppdateres ved endringer

---

## Mal for nav-copilot-context.md

Bruk denne strukturen. Tilpass innhold, men behold seksjonsnummerering og -overskrifter
slik at nav-pvk og nav-etterlevelse skills kan orientere seg.

```markdown
# NAV Copilot Kontekst: {Systemnavn}

Generert: {YYYY-MM-DD}  
Behandlings-ID(er): {B123, B456}  
Etterlevelsesdokumentasjon: {URL eller ID}  
Navet-fagområde: {Fagområdets tittel og URL}

> Denne filen vedlikeholdes av teamet og brukes av nav-etterlevelse og nav-pvk skills
> som bakgrunnskunnskap. Oppdater ved vesentlige endringer i systemet eller regelverket.

---

## 1. Systembeskrivelse

### Hva er systemet?
{Beskriv systemet med brukerens perspektiv, ikke teknisk. Hva gjør det? Hvem bruker det?}

### Hvem bruker systemet?
- **De registrerte (brukere/borgere)**: {Hvem er de? Antall/størrelsesorden?}
- **Interne brukere (veiledere/saksbehandlere)**: {Hvem? Hvilken rolle?}
- **Andre aktører**: {Arbeidsgivere, samhandlere, etc. — om relevant}

---

## 2. Rettslig grunnlag

### Primær nasjonal hjemmel
{Lov og paragraf, f.eks. «NAV-loven § 14 a»}

Kort beskrivelse av hva bestemmelsen sier og hvorfor den begrunner behandlingen.

### GDPR-grunnlag
**Artikkel 6(1){x}** — {begrunn valg av bokstav}

### Særlig om sensitive personopplysninger (art. 9)
{Hvis behandlingen inkluderer helsedata, fagforeningsmedlemskap el. — beskriv hjemmel}
{Skriv «Ikke aktuelt» hvis art. 9-data ikke behandles}

### Hva er lovlig å registrere
{Konkrete eksempler på hva veiledere/systemet har lov til å lagre}

### Hva er IKKE lovlig å registrere
{Konkrete eksempler på hva som IKKE skal lagres — særlig viktig for fritekstfelt}

---

## 3. Kategorier av registrerte

{Liste over hvem som er registrerte i systemet}

1. **{Kategori}**: {Beskrivelse og antall/størrelse}
2. ...

---

## 4. Kategorier av personopplysninger

### Ordinære personopplysninger
{Liste}

### Sensitive/særlige kategorier (art. 9)
{Liste, eller «Ingen» hvis ikke aktuelt}

### Fritekstfelt — særskilt risiko
{Beskriv fritekstfelt i systemet og risikoen for at sensitive opplysninger skrives inn}

---

## 5. Behandlingens livsløp

### Oppstart av behandling
{Hva utløser at behandlingen begynner? Hvilken hendelse/handling?}

### Under behandlingen
{Kort om hva som skjer med dataene mens behandlingen pågår}

### Avslutning og sletting
{Hva avslutter behandlingen? Hva skjer med data? Lagringstid?}

**Lagringstid:** {X måneder / år — fra behandlingskatalog eller policy}

---

## 6. Faglige retningslinjer og restriksjoner

{Oppsummer relevante retningslinjer fra Navet eller interne rutiner.
Beskriv kjente begrensninger, «du skal/skal ikke»-regler for veiledere, etc.}

---

## 7. Tilgangsstyring

### Bruker/borger-tilgang
{Autentiseringsmekanisme, f.eks. sikkerhetsnivå 4 / BankID}

### Intern tilgang (veiledere/saksbehandlere)
{Autentisering og autorisasjon, f.eks. Azure AD + poao-tilgang}

### Særskilte tilgangsbegrensninger
{Kontorsperre, skjerming, fortrolig adresse, etc. — om aktuelt}

---

## 8. Databehandlere og tredjeparter

| Aktør | Rolle | Hva deles |
|-------|-------|-----------|
| {Navn} | Databehandler / Behandlingsansvarlig / Mottaker | {Hva} |

---

## 9. Referanser

- **Behandlingskatalog**: {URL til behandlingen, f.eks. https://behandlingskatalog.ansatt.nav.no/process/{uuid}}
- **Navet**: {URL til fagområdespesifikke sider}
- **Lovdata**: {URL til aktuell lovhjemmel}
- **Etterlevelse**: {URL til etterlevelsesdokumentasjonen}
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
