# Dockhand Plugin

Claude Code plugin for managing self-hosted infrastructure on Hetzner, Dokploy, and Traefik.

## Features

- **Application Management**: Deploy, manage, and monitor applications via Dokploy
- **DNS Management**: Create, update, and verify DNS records via Cloudflare
- **Infrastructure Operations**: SSH execution, Terraform plans, Docker management
- **Troubleshooting**: Systematic debugging with health checks and log analysis
- **Security**: 1Password integration for secrets management
- **Interactive Setup**: First-run wizard guides you through configuration

## Quick Start

### Prerequisites

1. **Python 3.12+**
2. **Node.js** (required for policy hooks)
3. **SSH access** to your infrastructure hosts (via Tailscale recommended)
4. **Optional but recommended**: [1Password CLI](https://1password.com/downloads/command-line/) for secure credential management

### Install

```bash
# Clone the repository to your Claude Code plugins directory
git clone https://github.com/masonjames/dockhand-plugin.git

# Install the dockhand package (required dependency)
pip install dockhand
```

### First-Run Setup

After installing, simply start using any Dockhand command in Claude Code. The plugin will detect that it's not configured and offer to run the setup wizard:

```
/dh:setup
```

The setup wizard will:
1. **Detect your environment** - Check for 1Password CLI availability
2. **Gather configuration** - Ask for your platform domain, hosts, and service URLs
3. **Configure credentials** - Set up either 1Password integration or a secure `.env` file
4. **Generate config files** - Create `config.json` and `.mcp.json` automatically
5. **Validate setup** - Confirm everything is working

### Credential Management Options

**Option 1: 1Password (Recommended)**
- Secrets are fetched securely at runtime
- Never stored in plain text
- Automatic rotation support

**Option 2: Environment File**
- For users without 1Password
- Creates `~/.config/dockhand/.env.dockhand`
- You fill in your API tokens manually

## Available Commands

| Command | Description |
|---------|-------------|
| `/dh:setup` | Interactive configuration wizard |
| `/dh:status` | Quick infrastructure health check |
| `/dh:apps` | List and manage applications |
| `/dh:deploy` | Deploy applications via templates |
| `/dh:dns` | DNS record management |
| `/dh:troubleshoot` | Start debugging session |
| `/dh:logs` | View application logs |
| `/dh:backup` | Backup operations |
| `/dh:cleanup` | Clean up unused Docker resources |
| `/dh:terraform` | Infrastructure-as-code operations |
| `/dh:updates` | Track software updates |
| `/dh:report` | Generate infrastructure report |
| `/dh:bootstrap` | Bootstrap new server into platform |
| `/dh:templates` | Browse deployment templates |
| `/dh:maintenance` | Run maintenance tasks |

## Skills

The plugin includes several always-on and on-demand skills:

- **dh-first-run**: Detects unconfigured state and prompts for setup
- **dh-guardrails**: Policy enforcement for safe operations (always active)
- **dh-status**: Infrastructure status and health monitoring
- **dh-deploy**: Guided deployment workflows
- **dh-troubleshoot**: Systematic debugging
- **dh-apps**: Application lifecycle management
- **dh-infra**: Infrastructure-as-code operations

## Manual Configuration

If you prefer to configure manually instead of using the setup wizard:

### 1. Create Config File

```bash
mkdir -p ~/.config/dockhand
```

Create `~/.config/dockhand/config.json`:
```json
{
  "platform_domain": "yourdomain.com",
  "hosts": [
    {"name": "platform-core", "ssh_target": "root@platform-core", "role": "manager"},
    {"name": "prod", "ssh_target": "root@prod", "role": "worker"}
  ],
  "dokploy": {
    "url": "https://dokploy.yourdomain.com",
    "token_env": "DOKPLOY_TOKEN"
  },
  "cloudflare": {
    "zone_id": "your-zone-id",
    "token_env": "CLOUDFLARE_API_TOKEN"
  }
}
```

See `dockhand.config.example.json` for all available options.

### 2. Configure MCP Server

Copy `.mcp.json.example` to your project as `.mcp.json` and update with your 1Password item names or environment file path.

### 3. Set Up Credentials

**With 1Password:**
```bash
# Ensure you're signed in
eval $(op signin)
```

**With Environment File:**
```bash
# Create and edit the credentials file
touch ~/.config/dockhand/.env.dockhand
chmod 600 ~/.config/dockhand/.env.dockhand
# Add: CLOUDFLARE_API_TOKEN=xxx and DOKPLOY_TOKEN=xxx
```

## Security

This plugin implements defense-in-depth with guardrails at multiple layers:

- **Plugin-side hooks**: PreToolUse policy blocks destructive commands on protected branches
- **Server-side enforcement**: The `dockhand` package enforces `confirmed=true` for destructive operations
- **Secret redaction**: SSH output is scanned and secrets are redacted
- **Injection prevention**: Shell injection patterns are blocked
- **Credential security**: API tokens managed via 1Password or secured env file (never in config)

## Development

```bash
# Clone and set up
git clone https://github.com/masonjames/dockhand-plugin.git
cd dockhand-plugin

python3 -m venv .venv
source .venv/bin/activate
pip install -e /path/to/dockhand  # Install dockhand in dev mode

# Run the server directly
python -m dockhand_plugin.server
```

### Hook Development

Policy hooks require Node.js. The hooks enforce branch protection and require confirmation for destructive operations.

## Related Projects

- [dockhand](https://github.com/masonjames/dockhand) - Infrastructure tools library and autonomous agent
- [dockyard](https://github.com/masonjames/dockyard) - Infrastructure templates and Terraform modules

## License

MIT License - see [LICENSE](LICENSE) for details.
