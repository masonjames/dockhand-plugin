# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Repository Purpose

This is the **Claude Code plugin** for Dockhand infrastructure management. It provides slash commands, skills, hooks, and agents for interactive infrastructure operations.

**This repository contains:**
- Plugin metadata (`.claude-plugin/`)
- Slash commands (`commands/`)
- Skills (`skills/`)
- Hooks (`hooks/`)
- Agents (`agents/`)
- Thin server wrapper (`src/dockhand_plugin/`)

**Dependencies:**
- [dockhand](https://github.com/masonjames/dockhand) - Tools library and MCP server implementation

## Project Structure

```
.claude-plugin/
  plugin.json         # Plugin metadata
  marketplace.json    # Marketplace listing

commands/             # Slash commands (markdown with YAML frontmatter)
  dh-apps.md
  dh-deploy.md
  dh-status.md
  dh-troubleshoot.md
  ...

skills/               # Always-on and on-demand skills
  dh-apps/
  dh-deploy/
  dh-guardrails/
  dh-status/
  dh-troubleshoot/

hooks/
  hooks.json          # Pre-tool-use policy enforcement

agents/
  dh-deploy-validator.md
  dh-incident-responder.md

src/dockhand_plugin/
  __init__.py
  server.py           # Entry point (imports from dockhand package)
```

## Development

```bash
# Install in development mode
pip install -e .

# Run the MCP server
dockhand-plugin
```

## Adding New Commands

1. Create `commands/dh-newcommand.md` with YAML frontmatter:
   ```markdown
   ---
   name: dh-newcommand
   description: Short description
   ---

   # Command instructions here
   ```

2. Optionally create a corresponding skill in `skills/dh-newcommand/`

## Testing Changes

The server imports from the `dockhand` package. To test tool changes:
1. Make changes in the main dockhand repository
2. Reinstall: `pip install -e /path/to/dockhand`
3. Restart the MCP server

## Publishing

1. Update version in `pyproject.toml` and `.claude-plugin/plugin.json`
2. Tag release: `git tag v0.x.0`
3. Push to GitHub
4. Publish to PyPI: `python -m build && twine upload dist/*`
