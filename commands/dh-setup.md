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
ls ~/.config/dockhand/config.json
```

If config exists and user didn't pass `--reconfigure`:
- Ask if they want to reconfigure or validate existing setup
- If validate only, skip to Step 6

### Step 1: Detect Credential Management Method

Check if 1Password CLI is available:

```bash
op --version 2>/dev/null && echo "1PASSWORD_AVAILABLE" || echo "1PASSWORD_NOT_AVAILABLE"
```

Use `AskUserQuestion` to ask:

**If 1Password available:**
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

Ask for vault information:
```
What is your 1Password vault name for platform secrets?
(e.g., "Platform Infra" or "DevOps")
```

Then for each secret, ask for the 1Password item details:

1. **Cloudflare API Token**
   ```
   What is the 1Password item name for your Cloudflare API token?
   And what field contains the token? (default: "api_token")
   ```

2. **Dokploy API Token**
   ```
   What is the 1Password item name for your Dokploy API key?
   And what field contains the key? (default: "API Key")
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
    "vault_name": "<collected_vault>"  // Only if using 1Password
  },
  "infra_repo_path": null
}
```

**Generate `.mcp.json` in current project:**

**For 1Password users:**
```json
{
  "mcpServers": {
    "dockhand": {
      "command": "bash",
      "args": [
        "-c",
        "set -e; if ! command -v op &>/dev/null; then echo 'ERROR: 1Password CLI not found' >&2; exit 1; fi; if ! op account get &>/dev/null; then echo 'ERROR: Run: eval $(op signin)' >&2; exit 1; fi; export CLOUDFLARE_API_TOKEN=$(op item get '<cf_item>' --vault '<vault>' --fields '<cf_field>' --reveal); export DOKPLOY_TOKEN=$(op item get '<dok_item>' --vault '<vault>' --fields '<dok_field>' --reveal); dockhand-plugin"
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
        "set -e; set -a; source ~/.config/dockhand/.env.dockhand; set +a; dockhand-plugin"
      ],
      "env": {
        "DOCKHAND_CONFIG": "${HOME}/.config/dockhand/config.json"
      }
    }
  }
}
```

**Generate `.env.dockhand` template (if not using 1Password):**
```bash
# Write to ~/.config/dockhand/.env.dockhand
```
```
# Dockhand Credentials
# Fill in your actual tokens below

# Cloudflare API Token (with DNS edit permissions for your zone)
# Get from: https://dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_API_TOKEN=

# Dokploy API Key
# Get from: Dokploy panel → Settings → API
DOKPLOY_TOKEN=
```

### Step 6: Validate Setup

After generating files, validate the configuration:

1. **Check config file is valid JSON:**
   ```bash
   python3 -c "import json; json.load(open('$HOME/.config/dockhand/config.json'))"
   ```

2. **Inform user of next steps:**

   **If using 1Password:**
   ```
   Setup complete! Next steps:
   1. Ensure you're signed into 1Password: eval $(op signin)
   2. Restart Claude Code to load the new MCP configuration
   3. Run /dh:status to verify connectivity
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

## Security Reminders

Always remind users:
- Never commit credentials to git
- Use 1Password when possible for better security
- Rotate API tokens periodically
- The `.env.dockhand` file should have restricted permissions (chmod 600)
