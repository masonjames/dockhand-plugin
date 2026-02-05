---
name: dh:logs
description: View application and service logs
allowed-tools:
  - mcp__dockhand__ssh_exec
  - mcp__dockhand__dokploy_app_status
  - AskUserQuestion
argument-hint: "[app-name] [--lines N] [--follow]"
---

# View Logs

View logs for applications and services.

## Usage

```
/dh:logs ghost
/dh:logs traefik --lines 100
/dh:logs dokploy
```

## Implementation

1. Get container name from `dokploy_app_status` or known service name
2. Run `ssh_exec` with `docker logs <container> --tail <lines>`
3. Present formatted output

## Common Services

| Service | Container |
|---------|-----------|
| traefik | traefik |
| dokploy | dokploy |
| prometheus | prometheus |
| grafana | grafana |
| loki | loki |

## Log Filtering

For specific patterns:
```
ssh_exec "docker logs ghost --tail 500 | grep ERROR"
```

## Loki Integration

For historical logs, suggest Grafana/Loki:
- URL: grafana.<platform_domain> (configured in your dockhand config)
- Dashboard: real-time-logs
