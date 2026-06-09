# dab-copilot-config

Team-spesifikke Copilot-tilpasninger for DAB.

## Struktur

```text
copilot-config/
  all/
    instructions/
    prompts/
  backend/
    instructions/
    prompts/
  frontend/
    instructions/
    prompts/
  repos/
    <repo-navn>/
      instructions/
  agents/
```

## Bruk med ccli

Sett `team_config.repo` til `navikt/dab-copilot-config` og `team_config.path` til `copilot-config` i `~/.config/copilot-cli/team.yml`.

## Etterlevelse-skills (nav-etterlevelse, nav-pvk, nav-behandlingskatalog, nav-context)

### Steg 1: Klon repoet

```bash
git clone https://github.com/navikt/dab-copilot-config ~/dab-copilot-config
```

### Steg 2: Symlink skills inn i Copilot-skills-mappen

```bash
mkdir -p ~/.copilot/skills
ln -s ~/dab-copilot-config/copilot-config/all/skills/nav-etterlevelse     ~/.copilot/skills/nav-etterlevelse
ln -s ~/dab-copilot-config/copilot-config/all/skills/nav-pvk              ~/.copilot/skills/nav-pvk
ln -s ~/dab-copilot-config/copilot-config/all/skills/nav-behandlingskatalog ~/.copilot/skills/nav-behandlingskatalog
ln -s ~/dab-copilot-config/copilot-config/all/skills/nav-context          ~/.copilot/skills/nav-context
```

### Steg 3: Autentisering

**Status per juni 2026:** Verken brokeren eller MCP-serveren er operativ enda — begge venter på godkjenning fra team datajegerne (inbound access policy). Inntil videre autentiserer skills ved at du limer inn SSO-cookies manuelt når skillen ber om det:

- **etterlevelse/PVK:** `forwardauth`-cookie fra `etterlevelse.ansatt.nav.no`
- **Behandlingskatalog:** `forwardauth`-cookie fra `behandlingskatalog.ansatt.nav.no`

Åpne nettstedet i nettleseren → DevTools (F12) → Application → Cookies → kopier verdien.

**Når brokeren er klar** (krever at datajegerne har lagt app-ID inn i inbound access policy):

```bash
cd ~/dab-copilot-config/tools/etterlevelse-broker
npm install
npm start
```

Kopier `.cplt.toml` til arbeidsmappen din:

```bash
cp ~/dab-copilot-config/tools/etterlevelse-broker/.cplt.toml .
```

Se [tools/etterlevelse-broker/README.md](tools/etterlevelse-broker/README.md) for detaljer.

### Oppdatering

Skills og broker oppdateres med en vanlig `git pull` i `~/dab-copilot-config`.
