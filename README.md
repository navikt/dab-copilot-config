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

# Copilot CLI — kjøres inne i en agentsesjon:
# /mcp add  →  name: nav-etterlevelse-mcp, servertype: HTTP,
#              remote server: https://nav-etterlevelse-mcp.intern.nav.no
```

### OpenCode i cplt-sandbox

OpenCode-konfigurasjonen i `~/.config/opencode/` er tilgjengelig i cplt-sandboxen,
men symlinker som peker til kataloger utenfor allowlisten følges ikke. Skills-mappene
er symlinker til `~/dab-copilot-config/...` som ikke er tillatt som standard.

Legg til en global `allow_read`-regel i cplt-konfigurasjonen, der
`<path-to-dab-copilot-config>` er stien der du klonet dette repoet:

```bash
cplt config set allow.read <path-to-dab-copilot-config>/copilot-config/all/skills
```

Dette gjelder for alle prosjekter og lagres i `~/.config/cplt/config.toml`.

### Oppdatering

```bash
cd <path-to-dab-copilot-config> && git pull
```

Siden skillmappene er symlinker inn i repoet, er oppdateringen umiddelbart tilgjengelig
i neste agentsesjon — ingen kopiering eller re-linking nødvendig.
