# etterlevelse-broker

Lokal credential-broker for GitHub Copilot CLI med nav-etterlevelse-, nav-pvk- og
nav-behandlingskatalog-skillen.

Agenten foreslår endringer. Brokeren viser diff i terminalen og ber om godkjenning.
Kun godkjente endringer sendes til NAV-APIet — med ditt eget Bearer-token.
Token holdes kun i minnet, aldri på disk.

## Forutsetninger

- Node.js ≥ 18
- naisdevice tilkoblet
- Klient-ID fra team etterlevelse — se [Åpne avhengigheter](#åpne-avhengigheter)

## Oppsett

```bash
npm install
```

## Start

```bash
BROKER_CLIENT_ID=<klient-id> node broker.js
```

Brokeren starter og lytter på `http://localhost:9876`. Første gang agenten forsøker
å skrive, åpnes en device-code-flyt: du logger inn i nettleseren med din NAV-identitet.

## Slik fungerer det

1. Copilot CLI sender et skriveforslag til `POST http://localhost:9876/write`
2. Brokeren henter gjeldende tilstand fra APIet og viser en diff:
   ```
   ─────────────────────────────────────────────────────────────
   📝 PUT https://etterlevelse-api.intern.nav.no/api/etterlevelse/abc123

   Endringer:
     SK 1:
       Status:  (tom) → OPPFYLT
       Begrunnelse:
       - (tom)
       + Applikasjonen bruker ID-porten med sikkerhetsnivå høyt…
   ```
3. Du velger:
   - **[G]odkjenn** — endringen sendes til APIet med ditt Bearer-token
   - **[H]opp over** — endringen ignoreres
   - **[R]ediger** — skriv inn ny begrunnelsetekst, se ny diff, velg på nytt
4. Kun godkjente endringer lastes opp. Endringslogg skrives til
   `~/.copilot/etterlevelse-broker.jsonl`.

## Portkonfigurasjon

Standard port er 9876. Overstyr med miljøvariabelen `BROKER_PORT`:

```bash
BROKER_CLIENT_ID=<id> BROKER_PORT=8765 node broker.js
```

## Åpne avhengigheter

Klient-ID er ikke tilgjengelig før team etterlevelse (datajegerne) har:

1. Opprettet NAIS-appen `nav-etterlevelse-broker` i `navikt/nav-etterlevelse`-repoet
2. Lagt til inbound-regel i `etterlevelse-backend`s `nais.yaml`
3. Aktivert «allow public client flows» i app-registreringen

Se [`team-request-etterlevelse.md`](../../copilot-config/all/skills/nav-etterlevelse/)
for detaljer om hva som skal bestilles.

Frem til klient-ID er tilgjengelig: brokeren starter fint, men skriveoperasjoner
feiler. Les-operasjoner og rapportgenerering fungerer som normalt (de går ikke via
brokeren).
