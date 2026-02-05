---
name: dh-first-run
type: always-on
description: Detects first-run state and prompts user to configure Dockhand. Active when config is missing or incomplete.
---

# Dockhand First-Run Detection

Automatically detect when Dockhand is unconfigured and guide users to setup.

## Detection Logic

When ANY Dockhand command or skill is invoked, first check configuration state:

```bash
# Check if config exists and read mode
ls ~/.config/dockhand/config.json 2>/dev/null
```

## First-Run Response

**If config file does not exist**, respond with:

```
Dockhand is not yet configured. Let me help you set it up.

Would you like to run the setup wizard now? This will:
1. Choose your setup mode (Client Portal or Admin)
2. Configure credentials and connectivity
3. Generate the necessary configuration files

Run `/dh-setup` to begin, or I can start the wizard for you now.
```

Then use `AskUserQuestion`:
```
question: "Would you like to run the Dockhand setup wizard?"
options:
  - "Yes, start setup now"
  - "No, I'll configure manually"
```

If user chooses "Yes", invoke the `/dh-setup` command flow.

If user chooses "No", provide manual setup instructions:
```
To configure Dockhand manually:

For Client Portal users:
1. Get your API token from your Client Portal settings
2. Create ~/.mcp.json with the MCP configuration shown in the portal
3. Create ~/.config/dockhand/config.json with: {"mode": "client"}

For Admin users:
1. Create config directory: mkdir -p ~/.config/dockhand
2. Create config file at ~/.config/dockhand/config.json
   (See dockhand.config.example.json in the plugin directory)
3. Create .mcp.json with MCP server config
4. Set up credentials via 1Password or .env.dockhand file

Run /dh-setup anytime to use the interactive wizard.
```

## Partial Configuration Detection

Also check for incomplete configuration:

**Missing required fields** - If config exists but is missing critical fields:
- `mode` (must be "client" or "admin")
- For admin mode: `platform_domain`, `hosts`, `dokploy.url`, `cloudflare.zone_id`
- For client mode: `mcp_server_url`

Respond with:
```
Your Dockhand configuration appears incomplete. Missing: <list fields>

Would you like to run /dh-setup to complete the configuration?
```

## Skip Conditions

Do NOT show first-run prompts when:
- User is already running `/dh-setup`
- Config file exists and has all required fields for its mode
- User has explicitly dismissed setup (tracked in session)

## Integration with Other Skills

This skill runs BEFORE other Dockhand skills. If config is missing:
1. Show first-run prompt
2. Do NOT proceed with the requested operation
3. After setup completes, remind user to retry their original request
