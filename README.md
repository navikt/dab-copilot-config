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

### Steg 3: Kopier .cplt.toml til arbeidsmappen din

cplt krever en `.cplt.toml` i arbeidsmappen for å tillate kall mot `intern.nav.no`. Kopier den fra broker-mappen:

```bash
cp ~/dab-copilot-config/tools/etterlevelse-broker/.cplt.toml .
```

### Oppdatering

Skills og broker oppdateres med en vanlig `git pull` i `~/dab-copilot-config`.
