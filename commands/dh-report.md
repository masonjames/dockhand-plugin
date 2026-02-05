---
name: dh:report
description: Generate comprehensive infrastructure report
allowed-tools:
  - mcp__dockhand__check_resource_thresholds
  - mcp__dockhand__traefik_status
  - mcp__dockhand__traefik_check_certs
  - mcp__dockhand__monitoring_health
  - mcp__dockhand__dokploy_list_apps
  - mcp__dockhand__dns_list_records
  - mcp__dockhand__docker_state
  - mcp__dockhand__updates_tracker
  - mcp__dockhand__ssh_exec
---

# Full Infrastructure Report

Generate comprehensive status report. Load the `dh-status` skill for report format details.

## Data Collection Sequence

Run these tools to gather complete state:

1. `check_resource_thresholds` - All host metrics
2. `docker_state host="platform-core"` - Control plane containers
3. `docker_state host="prod"` - Production containers
4. `dokploy_list_apps` - Application registry
5. `traefik_status` - Routing configuration
6. `traefik_check_certs` - TLS certificates (check each domain)
7. `dns_list_records` - DNS summary
8. `monitoring_health` - Observability stack
9. `updates_tracker action="status"` - Pending updates

## Report Sections

Generate formatted markdown report with:
- Host health table
- Application status table
- Certificate expiry table
- DNS summary
- Alerts and warnings

## Output

Present as formatted markdown suitable for documentation or sharing.
