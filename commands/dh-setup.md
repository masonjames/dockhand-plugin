---
name: dh-setup
description: Interactive setup wizard for Dockhand configuration
allowed-tools:
  - Bash
  - AskUserQuestion
  - Read
  - Write
  - Glob
argument-hint: "[--reconfigure]"
---

# Dockhand Setup Wizard

Interactive first-run setup for configuring Dockhand. Guides users through platform configuration and credential management.

## Trigger Conditions

Run this wizard when:
- User explicitly runs `/dh-setup`
- Config file doesn't exist at `~/.config/dockhand/config.json`
- User wants to reconfigure (`/dh-setup --reconfigure`)

## Setup Flow

### Step 0: Check Existing Configuration

```bash
# Check if config exists
ls ~/.config/dockhand/config.json 2>/dev/null && echo "CONFIG_EXISTS" || echo "CONFIG_NOT_FOUND"
```

```bash
# Check if MCP is configured
grep -l '"dockhand"' ~/.mcp.json .mcp.json 2>/dev/null && echo "MCP_CONFIGURED" || echo "MCP_NOT_CONFIGURED"
```

If config exists and user didn't pass `--reconfigure`:
- Ask if they want to reconfigure or validate existing setup
- If validate only, skip to Step 6

### Step 1: Choose Setup Mode

Use `AskUserQuestion`:

```
How will you be using Dockhand?
- Client Portal (Recommended) - I have an API token from a Client Portal (e.g., portal.masonjames.com)
- Admin (1Password) - I manage infrastructure directly and use 1Password for secrets
- Admin (Environment File) - I manage infrastructure directly using env vars for secrets
```

**If "Client Portal"** → go to Step 1A (Client Portal Setup)
**If "Admin"** → go to Step 2 (Admin Setup, existing flow)

---

### Step 1A: Client Portal Setup

This is the simplest path. Users already have a token and MCP server URL from their portal.

Use `AskUserQuestion`:

```
question: "Do you already have your API token and MCP server URL from the Client Portal?"
options:
  - "Yes, I have them ready"
  - "No, I need to generate one"
```

**If "No":**
```
To get your API token:

1. Go to your Client Portal settings page (e.g., https://portal.masonjames.com/settings)
2. Click "Create API Key"
3. Give it a name (e.g., "Claude Code")
4. Copy both the API Token and MCP Server URL

IMPORTANT: The token is only shown once. Copy it before closing the dialog.

Run /dh-setup again once you have your token.
```
Stop here.

**If "Yes":**

Ask for their token:
```
question: "Paste your API token (starts with mcp_):"
```

Ask for their MCP server URL:
```
question: "Paste your MCP Server URL:"
```

#### Generate Configuration

Create config directory:
```bash
mkdir -p ~/.config/dockhand
```

**Generate `~/.config/dockhand/config.json`:**
```json
{
  "mode": "client",
  "mcp_server_url": "<collected_url>",
  "token_configured": true
}
```

**Ask where to create `.mcp.json`:**

Use `AskUserQuestion`:
```
Where should I create the MCP server configuration?
- ~/.mcp.json (Global - works in all projects) [Recommended]
- ./.mcp.json (Project-local - only this project)
```

**Generate `.mcp.json` for Client Portal mode:**

Check if the target `.mcp.json` file already exists. If it does, read it and merge the new `dockhand` server entry into the existing `mcpServers` object. If it doesn't exist, create it fresh.

```json
{
  "mcpServers": {
    "dockhand": {
      "url": "<collected_mcp_server_url>",
      "headers": {
        "Authorization": "Bearer <collected_token>"
      }
    }
  }
}
```

**IMPORTANT:** The token is stored directly in the MCP config headers. Remind the user:
```
Your token has been saved to the MCP configuration.

SECURITY NOTES:
- Never commit .mcp.json to git (add it to .gitignore)
- Your token scopes access to only your portal resources
- You can revoke this token anytime from the Client Portal settings
```

Skip to Step 6 (Validate).

---

### Step 2: Detect Credential Management Method (Admin Mode)

Check if 1Password CLI is available and signed in:

```bash
op --version 2>/dev/null && echo "1PASSWORD_AVAILABLE" || echo "1PASSWORD_NOT_AVAILABLE"
```

```bash
op account get 2>/dev/null && echo "1PASSWORD_SIGNED_IN" || echo "1PASSWORD_NOT_SIGNED_IN"
```

If user chose Admin (1Password) but 1Password is not available, inform them and offer to switch to env file.

### Step 3: Gather Platform Information (Admin Mode Only)

Use `AskUserQuestion` for each:

1. **Platform Domain**
   ```
   What is your primary platform domain?
   (e.g., mycompany.com - used for DNS and app routing)
   ```

2. **Dokploy URL**
   ```
   What is your Dokploy panel URL?
   (e.g., https://dokploy.mycompany.com)
   ```

3. **Cloudflare Zone ID**
   ```
   What is your Cloudflare Zone ID for the platform domain?
   (Found in Cloudflare dashboard > Domain > Overview > Zone ID)
   ```

### Step 4: Configure Hosts (Admin Mode Only)

Use `AskUserQuestion`:

```
How many infrastructure hosts do you have?
- 1 (single server)
- 2 (manager + worker)
- 3+ (specify number)
```

For each host, ask:
1. **Host name** (e.g., `platform-core`, `prod`)
2. **SSH target** (e.g., `root@platform-core` - typically via Tailscale)
3. **Role** (`manager` or `worker`)

### Step 5: Configure Credentials (Admin Mode Only)

**If using 1Password:**

First, list available vaults and help user find the right one:

```bash
op vault list --format=json 2>/dev/null | python3 -c "import json,sys; vaults=json.load(sys.stdin); [print(f\"{v['name']} (ID: {v['id']})\") for v in vaults]" 2>/dev/null || echo "Could not list vaults"
```

Ask for vault:
```
Which 1Password vault contains your platform secrets?
(Listed above, or type the vault name/ID)
```

Then **auto-discover** items that might be Cloudflare or Dokploy credentials:

```bash
# Search for Cloudflare-related items in the selected vault
op item list --vault "<vault>" --format=json 2>/dev/null | python3 -c "
import json,sys
items=json.load(sys.stdin)
cf_items = [i for i in items if 'cloudflare' in i.get('title','').lower() or 'cf' in i.get('title','').lower()]
print('Cloudflare candidates:')
for i in cf_items:
    print(f\"  - {i['title']} (ID: {i['id']})\")
if not cf_items:
    print('  (none found - you may need to create one)')
" 2>/dev/null
```

```bash
# Search for Dokploy-related items
op item list --vault "<vault>" --format=json 2>/dev/null | python3 -c "
import json,sys
items=json.load(sys.stdin)
dok_items = [i for i in items if 'dokploy' in i.get('title','').lower() or 'dok' in i.get('title','').lower()]
print('Dokploy candidates:')
for i in dok_items:
    print(f\"  - {i['title']} (ID: {i['id']})\")
if not dok_items:
    print('  (none found - you may need to create one)')
" 2>/dev/null
```

Then for each credential, show available fields and ask which field contains the token.

**Verify tokens are accessible:**
```bash
op item get "<cf_item>" --vault "<vault>" --fields "<cf_field>" --reveal 2>&1 | head -c 10 && echo "...[OK]" || echo "FAILED"
```

**If using environment file:**

Generate `~/.config/dockhand/.env.dockhand` template:
```bash
cat > ~/.config/dockhand/.env.dockhand << 'EOF'
# Dockhand Credentials
# Fill in your actual tokens below

# Cloudflare API Token (with DNS edit permissions for your zone)
CLOUDFLARE_API_TOKEN=

# Dokploy API Key
DOKPLOY_TOKEN=
EOF
chmod 600 ~/.config/dockhand/.env.dockhand
```

### Step 5A: Generate Admin Configuration Files

Create the config directory:
```bash
mkdir -p ~/.config/dockhand
```

**Generate `~/.config/dockhand/config.json`:**

```json
{
  "mode": "admin",
  "platform_domain": "<collected_domain>",
  "hosts": [
    {"name": "<host_name>", "ssh_target": "<ssh_target>", "role": "<role>"}
  ],
  "dokploy": {
    "url": "<collected_url>",
    "token_env": "DOKPLOY_TOKEN"
  },
  "cloudflare": {
    "zone_id": "<collected_zone_id>",
    "token_env": "CLOUDFLARE_API_TOKEN"
  },
  "onepassword": {
    "vault_name": "<collected_vault>",
    "cloudflare_item": "<cf_item>",
    "cloudflare_field": "<cf_field>",
    "dokploy_item": "<dok_item>",
    "dokploy_field": "<dok_field>"
  },
  "infra_repo_path": null
}
```

**Ask where to create `.mcp.json`:**

Use `AskUserQuestion`:
```
Where should I create the MCP server configuration?
- ~/.mcp.json (Global - works in all projects) [Recommended]
- ./.mcp.json (Project-local - only this project)
```

Check if the target `.mcp.json` file already exists. If it does, read it and merge the new `dockhand` server entry. If it doesn't exist, create it fresh.

**For 1Password admin users:**
```json
{
  "mcpServers": {
    "dockhand": {
      "command": "bash",
      "args": [
        "-c",
        "set -e; if ! command -v op &>/dev/null; then echo 'ERROR: 1Password CLI not found' >&2; exit 1; fi; if ! op account get &>/dev/null; then echo 'ERROR: Not signed into 1Password. Run: eval $(op signin)' >&2; exit 1; fi; export CLOUDFLARE_API_TOKEN=$(op item get '<cf_item>' --vault '<vault>' --fields '<cf_field>' --reveal); export DOKPLOY_TOKEN=$(op item get '<dok_item>' --vault '<vault>' --fields '<dok_field>' --reveal); <path-to-dockhand-mcp>"
      ],
      "env": {
        "DOCKHAND_CONFIG": "${HOME}/.config/dockhand/config.json"
      }
    }
  }
}
```

**For environment file admin users:**
```json
{
  "mcpServers": {
    "dockhand": {
      "command": "bash",
      "args": [
        "-c",
        "set -e; set -a; source ~/.config/dockhand/.env.dockhand; set +a; <path-to-dockhand-mcp>"
      ],
      "env": {
        "DOCKHAND_CONFIG": "${HOME}/.config/dockhand/config.json"
      }
    }
  }
}
```

**Detect dockhand-mcp path:**
```bash
which dockhand-mcp 2>/dev/null || \
  (pip show dockhand 2>/dev/null | grep Location | sed 's/Location: //' | xargs -I{} echo "{}/../../../bin/dockhand-mcp") || \
  echo "dockhand-mcp"
```

### Step 6: Validate Setup

**For Client Portal mode:**

1. **Check `.mcp.json` is valid JSON:**
   ```bash
   python3 -c "import json; json.load(open('<mcp_json_path>'))" && echo "MCP config: OK" || echo "MCP config: INVALID"
   ```

2. **Test token connectivity:**
   ```bash
   # Quick health check against the MCP server URL (strip /mcp, check /health)
   curl -sf -H "Authorization: Bearer <token>" "<mcp_server_url_base>/health" 2>&1 | head -c 200 || echo "Could not reach server (this is OK if you're not on the network)"
   ```

3. **Inform user of next steps:**
   ```
   Setup complete!

   Next steps:
   1. Restart Claude Code to load the new MCP configuration
   2. Try /dh-status to verify connectivity
   3. Use /dh-apps to manage your applications
   4. Use /dh-deploy to deploy new apps

   Available tools are scoped to your portal permissions.
   To manage your API keys, visit your Client Portal settings.
   ```

**For Admin mode:**

1. **Check config file is valid JSON:**
   ```bash
   python3 -c "import json; json.load(open('$HOME/.config/dockhand/config.json'))" && echo "Config: OK" || echo "Config: INVALID"
   ```

2. **Test MCP startup (quick check):**
   ```bash
   timeout 2 bash -c "<startup_command>" 2>&1 || true
   ```

3. **Test connectivity (if using 1Password):**
   ```bash
   CF_TOKEN=$(op item get '<cf_item>' --vault '<vault>' --fields '<cf_field>' --reveal)
   curl -s -H "Authorization: Bearer $CF_TOKEN" "https://api.cloudflare.com/client/v4/user/tokens/verify" | python3 -c "import json,sys; r=json.load(sys.stdin); print('Cloudflare:', 'OK' if r.get('success') else 'FAILED')"
   ```

   ```bash
   ssh -o ConnectTimeout=5 -o BatchMode=yes <first_host> "echo 'SSH: OK'" 2>&1 || echo "SSH: FAILED"
   ```

4. **Inform user of next steps:**
   ```
   Setup complete!

   Next steps:
   1. Restart Claude Code to load the new MCP configuration
   2. Run /dh-status to verify full connectivity

   The dockhand tools (ssh_exec, dokploy_*, dns_*, etc.) will be available after restart.
   ```

## Error Handling

- If user cancels mid-setup, inform them they can resume with `/dh-setup`
- If file write fails, show the content and ask user to create manually
- If 1Password validation fails, offer to switch to environment file method
- If `dockhand-mcp` command not found, prompt user to install: `pip install dockhand`
- If Client Portal token test fails, suggest checking token validity in the portal

## Security Reminders

Always remind users:
- Never commit `.mcp.json` or credentials to git
- Use 1Password when possible for admin setups
- Client Portal tokens can be revoked from the portal settings
- The `.env.dockhand` file should have restricted permissions (chmod 600)
