---
name: dh:troubleshoot
description: Start debugging session for infrastructure issues
allowed-tools:
  - mcp__dockhand__traefik_status
  - mcp__dockhand__traefik_check_certs
  - mcp__dockhand__dokploy_app_status
  - mcp__dockhand__dokploy_list_apps
  - mcp__dockhand__docker_state
  - mcp__dockhand__monitoring_health
  - mcp__dockhand__check_resource_thresholds
  - mcp__dockhand__dns_get_record
  - mcp__dockhand__dns_check_propagation
  - mcp__dockhand__ssh_exec
  - AskUserQuestion
argument-hint: "[error-description] or [app-name]"
---

# Troubleshoot Infrastructure Issues

Systematic debugging for infrastructure problems. Load the `dh-troubleshoot` skill for complete diagnostic chains.

## Initial Assessment

1. **Ask user:** What's the symptom?
   - HTTP error codes (502, 504, 521)
   - Certificate errors
   - App not starting
   - Performance issues
   - Other

2. **Identify scope:**
   - Specific app or whole platform?
   - When did it start?
   - Any recent changes?

## Quick Triage

Based on symptom, run targeted diagnostics:

### HTTP 502/504
```
traefik_status → dokploy_app_status → ssh_exec "docker logs"
```

### Certificate Errors
```
traefik_check_certs → dns_get_record → check ACME logs
```

### Cloudflare 521
```
ssh_exec "curl localhost" → traefik_status → docker health
```

### App Not Starting
```
dokploy_app_status → ssh_exec "docker logs" → check env vars
```

## Deep Dive

If quick triage doesn't resolve, run full diagnostic chain (see `dh-troubleshoot` skill).

## Output

Present findings as structured troubleshooting report with:
- Issue summary
- Diagnostics run
- Root cause (if identified)
- Recommended fix
- Commands to execute
