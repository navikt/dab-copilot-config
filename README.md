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
git clone https://github.com/navikt/dab-copilot-config <path-to-dab-copilot-config>
```

### Steg 2: Symlink skills inn i skill-konfigurasjonsmappene

Skills må symlinkes inn i de mappene som GitHub Copilot CLI og OpenCode leser fra.
Fordi symlinker peker direkte inn i repoet, vil en vanlig `git pull` oppdatere skillene
automatisk uten å gjøre noe mer.

**GitHub Copilot CLI** leser fra `~/.copilot/skills/`:

```bash
mkdir -p ~/.copilot/skills
ln -s <path-to-dab-copilot-config>/copilot-config/all/skills/nav-etterlevelse      ~/.copilot/skills/nav-etterlevelse
ln -s <path-to-dab-copilot-config>/copilot-config/all/skills/nav-pvk               ~/.copilot/skills/nav-pvk
ln -s <path-to-dab-copilot-config>/copilot-config/all/skills/nav-behandlingskatalog ~/.copilot/skills/nav-behandlingskatalog
ln -s <path-to-dab-copilot-config>/copilot-config/all/skills/nav-context            ~/.copilot/skills/nav-context
```

**OpenCode** leser fra `~/.config/opencode/skills/`. Enkleste løsning er å symlinke
OpenCode-mappen til Copilot-mappen, slik at begge peker på samme sted:

```bash
mkdir -p ~/.config/opencode/skills
ln -s ~/.copilot/skills/nav-etterlevelse      ~/.config/opencode/skills/nav-etterlevelse
ln -s ~/.copilot/skills/nav-pvk               ~/.config/opencode/skills/nav-pvk
ln -s ~/.copilot/skills/nav-behandlingskatalog ~/.config/opencode/skills/nav-behandlingskatalog
ln -s ~/.copilot/skills/nav-context            ~/.config/opencode/skills/nav-context
```

### Steg 3: Koble til nav-etterlevelse-mcp

Skillene bruker [nav-etterlevelse-mcp](https://github.com/navikt/nav-etterlevelse-mcp) for
all kommunikasjon med etterlevelsesløsningen og behandlingskatalogen. Legg til serveren i
Copilot CLI eller OpenCode og autentiser deg:

```bash
# OpenCode
opencode mcp add  # velg remote, URL: https://nav-etterlevelse-mcp.intern.nav.no
opencode mcp auth nav-etterlevelse-mcp

# Copilot CLI — autentiserer automatisk inne i agentsesjonen
```

### Kjøring i cplt-sandbox

Fra august 2026 er Nav-ansatte pålagt å kjøre AI-agenter i sandkasse-miljø (cplt).
Legg til følgende i `~/.config/cplt/config.toml`:

```toml
[sandbox]
allow_browser = true      # Påkrevd for MCP OAuth-flows med nettleser
pass_env = ["GH_TOKEN"]   # Påkrevd for git clone av private repoer

[allow]
read = ["<path-to-dab-copilot-config>/copilot-config/all/skills"]

[proxy]
allow_private_domains = ["intern.nav.no"]  # Prod. Bruk ["intern.dev.nav.no"] for dev.
timeout = 180                              # Forhindrer timeout på tunge verktøykall
```

`GH_TOKEN` hentes fra GitHub CLI og settes i shell-miljøet (f.eks. `~/.zshrc`):

```bash
export GH_TOKEN=$(gh auth token)
```

**OAuth-autentisering:**
- **Copilot CLI:** Skjer automatisk inne i sandkassen med `allow_browser = true`
- **OpenCode:** Kjør `opencode mcp auth nav-etterlevelse-mcp` inne i sandkassen
  (med `allow_browser = true`) eller i et separat terminalvindu utenfor cplt

### Oppdatering

```bash
cd <path-to-dab-copilot-config> && git pull
```

Siden skillmappene er symlinker inn i repoet, er oppdateringen umiddelbart tilgjengelig
i neste agentsesjon — ingen kopiering eller re-linking nødvendig.
