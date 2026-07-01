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

### Steg 3: Koble til nav-etterlevelse-mcp

Skillene bruker [nav-etterlevelse-mcp](https://github.com/navikt/nav-etterlevelse-mcp) for
all kommunikasjon med etterlevelsesløsningen og behandlingskatalogen. Legg til serveren i
Copilot CLI eller OpenCode og autentiser deg:

```bash
# OpenCode
opencode mcp add  # velg remote, URL: https://nav-etterlevelse-mcp.intern.nav.no
opencode mcp auth nav-etterlevelse-mcp
```

### Oppdatering

Skills oppdateres med en vanlig `git pull` i `~/dab-copilot-config`.
