# Dockhand Plugin

Claude Code plugin for managing self-hosted infrastructure on Hetzner, Dokploy, and Traefik.

## Features

- **Application Management**: Deploy, manage, and monitor applications via Dokploy
- **DNS Management**: Create, update, and verify DNS records via Cloudflare
- **Infrastructure Operations**: SSH execution, Terraform plans, Docker management
- **Troubleshooting**: Systematic debugging with health checks and log analysis
- **Security**: 1Password integration for secrets management

## Installation

### Prerequisites

1. **Python 3.12+**
2. **1Password CLI** ([install guide](https://1password.com/downloads/command-line/))
3. **SSH access** to your infrastructure hosts (via Tailscale recommended)

### Install the Plugin

```bash
# Install from PyPI
pip install dockhand-plugin

# Or install from GitHub
pip install git+https://github.com/masonjames/dockhand-plugin.git
```

### Configure

1. **Create configuration directory:**
   ```bash
   mkdir -p ~/.config/dockhand
   ```

2. **Create config file** at `~/.config/dockhand/config.json`:
   ```json
   {
     "platform_domain": "yourdomain.com",
     "hosts": [
       {
         "name": "platform-core",
         "ssh_target": "root@platform-core",
         "role": "manager"
       },
       {
         "name": "prod",
         "ssh_target": "root@prod",
         "role": "worker"
       }
     ],
     "dokploy": {
       "url": "https://dokploy.yourdomain.com",
       "token_env": "DOKPLOY_TOKEN"
     },
     "cloudflare": {
       "zone_id": "your-zone-id",
       "token_env": "CLOUDFLARE_API_TOKEN"
     },
     "onepassword": {
       "vault_name": "Platform Infra"
     },
     "infra_repo_path": "/path/to/your/infrastructure/repo"
   }
   ```

3. **Configure Claude Code MCP** - copy `.mcp.json.example` to your project and update:
   ```json
   {
     "mcpServers": {
       "dockhand": {
         "command": "bash",
         "args": [
           "-c",
           "set -e; export CLOUDFLARE_API_TOKEN=$(op item get your-cloudflare-item --vault 'Platform Infra' --fields api_token --reveal); export DOKPLOY_TOKEN=$(op item get your-dokploy-item --vault 'Platform Infra' --fields 'API Key' --reveal); dockhand-plugin"
         ],
         "env": {
           "DOCKHAND_CONFIG": "${HOME}/.config/dockhand/config.json"
         }
       }
     }
   }
   ```

## Available Commands

| Command | Description |
|---------|-------------|
| `/dh-status` | Quick infrastructure health check |
| `/dh-apps` | List and manage applications |
| `/dh-deploy` | Deploy applications via templates |
| `/dh-dns` | DNS record management |
| `/dh-troubleshoot` | Start debugging session |
| `/dh-logs` | View application logs |
| `/dh-backup` | Backup operations |
| `/dh-cleanup` | Clean up unused Docker resources |
| `/dh-terraform` | Infrastructure-as-code operations |
| `/dh-updates` | Track software updates |
| `/dh-report` | Generate infrastructure report |

## Skills

The plugin includes several always-on and on-demand skills:

- **dh-status**: Infrastructure status and health monitoring
- **dh-deploy**: Guided deployment workflows
- **dh-troubleshoot**: Systematic debugging
- **dh-guardrails**: Policy enforcement for safe operations
- **dh-apps**: Application lifecycle management
- **dh-infra**: Infrastructure-as-code operations

## Security

- All SSH output is automatically scanned and secrets are redacted
- Destructive commands require explicit confirmation (`confirmed=true`)
- 1Password integration keeps API tokens secure
- Shell injection prevention on all command inputs

## Development

To develop locally:

```bash
# Clone the repo
git clone https://github.com/masonjames/dockhand-plugin.git
cd dockhand-plugin

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install in development mode (also installs dockhand)
pip install -e .

# Run the server directly
dockhand-plugin
```

## Related Projects

- [dockhand](https://github.com/masonjames/dockhand) - Infrastructure tools library and autonomous agent
- [dockyard](https://github.com/masonjames/dockyard) - Infrastructure templates and Terraform modules

## License

MIT License - see [LICENSE](LICENSE) for details.
