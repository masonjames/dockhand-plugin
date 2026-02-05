---
name: dh:setup
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
- User explicitly runs `/dh:setup`
- Config file doesn't exist at `~/.config/dockhand/config.json`
- User wants to reconfigure (`/dh:setup --reconfigure`)

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

### Step 1: Detect Credential Management Method

Check if 1Password CLI is available and signed in:

```bash
op --version 2>/dev/null && echo "1PASSWORD_AVAILABLE" || echo "1PASSWORD_NOT_AVAILABLE"
```

```bash
op account get 2>/dev/null && echo "1PASSWORD_SIGNED_IN" || echo "1PASSWORD_NOT_SIGNED_IN"
```

Use `AskUserQuestion` to ask:

**If 1Password available and signed in:**
```
How would you like to manage secrets?
- 1Password (Recommended) - Secrets fetched securely at runtime
- Environment file - Manual .env.dockhand file with credentials
```

**If 1Password not available:**
```
1Password CLI not detected. You can either:
- Install 1Password CLI - Then re-run /dh:setup (recommended for security)
- Use environment file - Create .env.dockhand with credentials manually
```

### Step 2: Gather Platform Information

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
   (Found in Cloudflare dashboard → Domain → Overview → Zone ID)
   ```

### Step 3: Configure Hosts

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

### Step 4: Configure Credentials

**If using 1Password:**

First, list available vaults and help user find the right one:

```bash
# List vaults the user has access to
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

Then for each credential, show available fields:

**Cloudflare API Token:**
```bash
# Show fields in the selected Cloudflare item
op item get "<cf_item>" --vault "<vault>" --format=json 2>/dev/null | python3 -c "
import json,sys
item=json.load(sys.stdin)
print('Available fields:')
for f in item.get('fields',[]):
    label = f.get('label','(unlabeled)')
    ftype = f.get('type','')
    print(f\"  - {label} ({ftype})\")
" 2>/dev/null
```

Ask:
```
Which field contains your Cloudflare API token?
(Usually: api_token, credential, or password)
```

**Dokploy API Token:**
```bash
# Show fields in the selected Dokploy item
op item get "<dok_item>" --vault "<vault>" --format=json 2>/dev/null | python3 -c "
import json,sys
item=json.load(sys.stdin)
print('Available fields:')
for f in item.get('fields',[]):
    label = f.get('label','(unlabeled)')
    ftype = f.get('type','')
    print(f\"  - {label} ({ftype})\")
" 2>/dev/null
```

Ask:
```
Which field contains your Dokploy API key?
(Usually: API Key, token, credential, or password)
```

**Verify tokens are accessible:**
```bash
# Verify Cloudflare token can be retrieved (don't show value, just verify)
op item get "<cf_item>" --vault "<vault>" --fields "<cf_field>" --reveal 2>&1 | head -c 10 && echo "...[OK]" || echo "FAILED"
```

```bash
# Verify Dokploy token can be retrieved
op item get "<dok_item>" --vault "<vault>" --fields "<dok_field>" --reveal 2>&1 | head -c 10 && echo "...[OK]" || echo "FAILED"
```

**If using environment file:**

Inform user they'll need to create `~/.config/dockhand/.env.dockhand`:
```
You'll need to create ~/.config/dockhand/.env.dockhand with:

CLOUDFLARE_API_TOKEN=your-cloudflare-token
DOKPLOY_TOKEN=your-dokploy-api-key

I'll generate a template file for you to fill in.
```

### Step 5: Generate Configuration Files

Create the config directory:
```bash
mkdir -p ~/.config/dockhand
```

**Generate `~/.config/dockhand/config.json`:**

```json
{
  "platform_domain": "<collected_domain>",
  "hosts": [
    // ... collected hosts
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

**Generate `.mcp.json`:**

**For 1Password users:**
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

**For environment file users:**
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
# Find dockhand-mcp command
which dockhand-mcp 2>/dev/null || \
  (pip show dockhand 2>/dev/null | grep Location | sed 's/Location: //' | xargs -I{} echo "{}/../../../bin/dockhand-mcp") || \
  echo "dockhand-mcp"
```

**Generate `.env.dockhand` template (if not using 1Password):**
```bash
cat > ~/.config/dockhand/.env.dockhand << 'EOF'
# Dockhand Credentials
# Fill in your actual tokens below

# Cloudflare API Token (with DNS edit permissions for your zone)
# Get from: https://dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_API_TOKEN=

# Dokploy API Key
# Get from: Dokploy panel → Settings → API
DOKPLOY_TOKEN=
EOF
chmod 600 ~/.config/dockhand/.env.dockhand
```

### Step 6: Validate Setup

After generating files, validate the configuration:

1. **Check config file is valid JSON:**
   ```bash
   python3 -c "import json; json.load(open('$HOME/.config/dockhand/config.json'))" && echo "Config: OK" || echo "Config: INVALID"
   ```

2. **Test MCP startup (quick check):**
   ```bash
   # Test the startup command (timeout after 2 seconds)
   timeout 2 bash -c "<startup_command>" 2>&1 || true
   ```

3. **Test connectivity (if using 1Password):**
   ```bash
   # Test Cloudflare API
   CF_TOKEN=$(op item get '<cf_item>' --vault '<vault>' --fields '<cf_field>' --reveal)
   curl -s -H "Authorization: Bearer $CF_TOKEN" "https://api.cloudflare.com/client/v4/user/tokens/verify" | python3 -c "import json,sys; r=json.load(sys.stdin); print('Cloudflare:', 'OK' if r.get('success') else 'FAILED')"
   ```

   ```bash
   # Test SSH to first host
   ssh -o ConnectTimeout=5 -o BatchMode=yes <first_host> "echo 'SSH: OK'" 2>&1 || echo "SSH: FAILED"
   ```

4. **Inform user of next steps:**

   **If all tests pass:**
   ```
   ✅ Setup complete!

   Next steps:
   1. Restart Claude Code to load the new MCP configuration
   2. Run /dh:status to verify full connectivity

   The dockhand tools (ssh_exec, dokploy_*, dns_*, etc.) will be available after restart.
   ```

   **If using environment file:**
   ```
   Setup complete! Next steps:
   1. Edit ~/.config/dockhand/.env.dockhand and add your API tokens
   2. Restart Claude Code to load the new MCP configuration
   3. Run /dh:status to verify connectivity

   IMPORTANT: Never commit .env.dockhand to git!
   ```

## Error Handling

- If user cancels mid-setup, inform them they can resume with `/dh:setup`
- If file write fails, show the content and ask user to create manually
- If 1Password validation fails, offer to switch to environment file method
- If `dockhand-mcp` command not found, prompt user to install: `pip install dockhand`

## Security Reminders

Always remind users:
- Never commit credentials to git
- Use 1Password when possible for better security
- Rotate API tokens periodically
- The `.env.dockhand` file should have restricted permissions (chmod 600)
