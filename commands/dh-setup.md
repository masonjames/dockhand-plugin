---
name: dh:setup
description: Interactive setup wizard for Dockhand configuration
allowed-tools:
  - mcp__dockhand__op_validate_vault
  - mcp__dockhand__ssh_exec
  - mcp__dockhand__traefik_status
  - mcp__dockhand__monitoring_health
  - AskUserQuestion
  - Read
  - Write
---

# Dockhand Setup Wizard

Interactive setup for configuring Dockhand.

## Prerequisites

- Hetzner Cloud account with API token
- Cloudflare account with API token
- 1Password CLI (`op`) installed
- SSH access to hosts via Tailscale

## Setup Steps

### 1. Configuration File

Check for existing config:
```
~/.config/dockhand/config.json
```

If missing, guide user through creating:
- Platform domain
- Host inventory
- Service endpoints

### 2. Credential Validation

Validate each integration:
```
op_validate_vault scope="minimal"  # 1Password
traefik_status                      # Traefik access
monitoring_health                   # Monitoring stack
```

### 3. Host Connectivity

Test SSH to each configured host:
```
ssh_exec "hostname" host="platform-core"
ssh_exec "hostname" host="prod"
```

### 4. MCP Server

Verify `.mcp.json` configuration:
- Command path
- Environment variables
- Credential injection

## Config Template

```json
{
  "platform_domain": "masonjames.com",
  "hosts": [
    {"name": "platform-core", "ssh_target": "root@platform-core", "role": "manager"},
    {"name": "prod", "ssh_target": "root@prod", "role": "worker"}
  ],
  "dokploy": {"url": "https://platform-core.masonjames.com"},
  "cloudflare": {"zone_id": "..."},
  "onepassword": {"vault_id": "..."}
}
```

## Verification

After setup, run `/dh:status` to confirm everything works.
