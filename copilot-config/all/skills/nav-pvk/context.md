# Domenekontekst: Arbeidsrettet oppfølging og dialog

Denne filen gir domenekunnskap om behandlingen av personopplysninger i arbeidsrettet oppfølging, 
med fokus på systemene aktivitetsplanen og dialogen (arbeidsrettet-dialog / veilarbdialog).

Kilden er primært NAVs interne Navet-sider for fagfeltet, sist oppdatert januar–mars 2025.

---

## Systemet – hva er arbeidsrettet dialog?

Arbeidsrettet dialog er en digital kommunikasjonskanal mellom NAV-veileder og bruker, 
tilgjengelig via aktivitetsplanen. Systemet består av:

- **Aktivitetsplanen**: En felles plan for brukerens mål og aktiviteter (jobbsøk, møter med 
  NAV, medisinsk behandling, samtalereferater m.m.)
- **Dialogen**: Skriftlig meldingsutveksling mellom veileder og bruker, knyttet til aktiviteter
- **Samtalereferater**: Notater fra møter, lagt inn som aktivitetstype av veileder

Systemet brukes av veiledere i NAV (Modia arbeidsrettet oppfølging) og av brukere (via nav.no).

---

## Rettslig grunnlag for behandlingen

### Primær hjemmel
**NAV-loven § 14 a**: Alle som henvender seg til NAV og ønsker eller trenger bistand for å 
komme i arbeid, har rett til å få vurdert sitt bistandsbehov. Denne bestemmelsen er det primære 
rettslige grunnlaget for behandling av personopplysninger i arbeidsrettet oppfølging.

### GDPR-grunnlag
**Artikkel 6(1)(e)** – behandling er nødvendig for å utføre en oppgave i allmennhetens interesse 
eller utøve offentlig myndighet som den behandlingsansvarlige er pålagt.

### Hva loven tillater å skrive
Veileder har lov til å skrive personopplysninger som er **nødvendige** for å gjøre 
arbeidsevnevurderinger og arbeidsrettet oppfølging – inkludert:
- Personens muligheter for å komme i arbeid
- Behovet for bistand
- Statlige ytelser regulert av **folketrygdloven** (når nødvendig for oppfølgingen)
- Informasjon om kvalifiseringsprogrammet (KVP) der kommunen og NAV har databehandleravtale

### Hva er IKKE tillatt å skrive
Opplysninger etter **sosialtjenesteloven** skal **ikke** registreres i statlige systemer som Modia:
- Vedtak etter sosialtjenesteloven
- Utbetalinger fra sosialtjenesten
- At personen har relasjon til sosialtjenesten
- Andre detaljer om personens kontakt med sosialtjenesten

Unntak: Det er tillatt å skrive at generell informasjon om sosialhjelp er gitt (del av veiledningsplikten), 
og en veileder for sosiale tjenesters navn i et samtalereferat (uten å angi rollen).

**Tredjepersoner**: Som hovedregel skal opplysninger om tredjepersoner ikke skrives i fagsystemene.

---

## Behandlingens livsløp

### Oppstart av behandling
Behandlingen starter når bruker:
1. Registrerer seg som arbeidssøker på nav.no (alle registrerte arbeidssøkere)
2. Får oppfølgingsvedtak etter NAV-loven § 14 a (med innsatsgruppe: standard innsats, 
   situasjonsbestemt innsats, spesielt tilpasset innsats, eller varig tilpasset innsats)
3. Er sykmeldt uten arbeidsgiver fra 4 uker sykmelding
4. Er sykmeldt med arbeidsgiver og har behov for arbeidsrettet oppfølging

### Avslutning av behandling
Behandlingen avsluttes ved avsluttet oppfølgingsperiode. Historikk i aktivitetsplanen og 
dialogen bevares i henhold til arkiv- og sletteregler.

---

## Kategorier av registrerte (de registrerte)

1. **Arbeidssøkere**: Alle som registrerer seg som arbeidssøker på nav.no
2. **Brukere med oppfølgingsvedtak**: De med formidlingsgruppekode "arbeidssøker" eller 
   "ikke arbeidssøker" i Arena, med § 14a-vedtak
3. **Sykmeldte**: Fra 4 uker sykmelding (uten arbeidsgiver) eller ved behov for arbeidsrettet oppfølging
4. **Veiledere**: NAV-ansatte som utfører arbeidsrettet oppfølging (indirekte registrerte – 
   deres handlinger loggføres)

---

## Kategorier av personopplysninger

### I aktivitetsplanen og dialogen behandles:
- **Identifikasjon**: Fødselsnummer / aktør-ID
- **Fritekstmeldinger**: Meldinger mellom veileder og bruker (potensielt sensitive)
- **Aktivitetsdata**: Jobbsøk, planlagte aktiviteter, møtereferater, mål
- **Arbeidsdata**: Jobbønsker, CV-lenker, stilling personen søker på / har nå
- **Oppfølgingsdata**: Innsatsgruppe, formidlingsgruppe, oppfølgingsvedtak
- **Ytelsesinformasjon**: Referanser til statlige ytelser fra folketrygdloven
- **Kommunikasjonsdata**: Varsler (SMS/e-post) sendt til brukeren

### Særlig om fritekstfelt
Fritekstfeltene i meldinger, aktivitetsbeskrivelser og samtalereferater kan inneholde
sensitive personopplysninger. Det er veilederens ansvar å følge personvernprinsippene om 
dataminimering (kun nødvendige opplysninger) og formålsbegrensning (kun for arbeidsrettet oppfølging).

---

## Tilgangsstyring

### Brukertilgang
- Brukere må logge inn med **sikkerhetsnivå 4** (BankID, Commfides eller Buypass) for å 
  bruke aktivitetsplanen og dialogen

### Veiledertilgang  
- Autentisering via **Azure AD / Microsoft Entra ID**
- Autorisasjon via **poao-tilgang** (felles tilgangstjeneste)
- **Kontorsperre** for særlig beskyttede brukere
- **TokenX** (on-behalf-of) for systemkommunikasjon

### Rolleoppdeling
- Veiledere kan legge til alle aktivitetstyper, inkludert samtalereferater og forhåndsvarsler
- Brukere kan legge til: "Stilling jeg vil søke på", "Jobb jeg har nå", 
  "Jobbrettet egenaktivitet", "Medisinsk behandling"

---

## Personvernprinsipper for arbeidsrettet oppfølging

Navet beskriver en trinnvis prosess for personvernvurderinger:

1. **Har du lov?** (Lovlighet, rettferdighet, gjennomsiktighet)
   - Er det hjemmel i NAV-loven § 14a for å behandle disse opplysningene?
   
2. **Er det nødvendig?** (Dataminimering og formålsbegrensning)
   - Begrens mengden opplysninger til det som er nødvendig for oppfølgingen
   - Opplysningene skal kun brukes til arbeidsrettet oppfølging

---

## Databehandlere og integrasjoner

- **veilarboppfolging**: Perioder, innsatsgruppe, § 14a-vedtak
- **veilarbaktivitet**: Aktiviteter i aktivitetsplanen
- **poao-tilgang**: Tilgangskontroll og autoriseringsbeslutninger
- **PDL (Personregister)**: Henting av navn og identifikasjon
- **Brukernotifikasjon**: Varsler til bruker (SMS/e-post via nav.no)
- **Arena**: Kildesystem for formidlingsgruppe og innsatsgruppe
- **Kafka**: Hendelsesstrøm for integrasjon med andre systemer

---

## Tilgjengelighet og forhåndsorientering

- Brukers aktivitetsplan og dialog er tilgjengelig via nav.no
- Veiledere har tilgang via Modia arbeidsrettet oppfølging
- Forhåndsvarsel og forhåndsorientering gjøres i Modia som aktivitetstype
- Standardtekster for forhåndsvarsel er tilgjengelig på Navet

---

## Kilder (Navet)

- [Personvern i arbeidsrettet oppfølging](https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-arbeidsrettet-brukeroppfolging/SitePages/Personvern-i-arbeidsrettet-oppf%C3%B8lging.aspx) (2025-01-06)
- [Slik bruker du aktivitetsplanen, samtalereferatene og dialogen](https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-arbeidsrettet-brukeroppfolging/SitePages/Slik-bruker-du-funksjonaktivitetsplanen,-samtalereferatene-og-dialogen.aspx) (2025-03-11)
- [Rutiner for arbeidsrettet oppfølging](https://navno.sharepoint.com/sites/fag-og-ytelser-arbeid-arbeidsrettet-brukeroppfolging/SitePages/Rutiner-for-arbeidsrettet-oppf%C3%B8lging.aspx) (2025-12-12)
- [Lover og regler: NAV-loven § 14 a](https://lovdata.no/pro/#document/NL/lov/2006-06-16-20/%C2%A714a) (Lovdata)
