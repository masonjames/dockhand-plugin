---
name: dh:status
description: Quick infrastructure health check
allowed-tools:
  - mcp__dockhand__check_resource_thresholds
  - mcp__dockhand__traefik_status
  - mcp__dockhand__monitoring_health
  - mcp__dockhand__dokploy_list_apps
---

# Quick Status Check

Perform rapid health assessment of the platform. Load the `dh-status` skill for full reporting capabilities.

## Checks to Run

1. **Resource thresholds:** `check_resource_thresholds`
   - Disk, memory across all hosts
   - Report warnings (>80%) and criticals (>90%)

2. **Edge router:** `traefik_status`
   - Verify Traefik is healthy
   - Count active routers

3. **Monitoring stack:** `monitoring_health`
   - Prometheus, Grafana, Loki status

4. **Applications:** `dokploy_list_apps`
   - Count running vs stopped apps
   - Note any unhealthy apps

## Output Format

```
=== Quick Status ===
Hosts: X/Y healthy
Services: X/Y running
Alerts: X warnings, Y critical
```

If any alerts, suggest `/dh:report` for full details or `/dh:troubleshoot` for investigation.
