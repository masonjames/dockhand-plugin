---
name: dh:apps
description: List and manage applications
allowed-tools:
  - mcp__dockhand__dokploy_list_apps
  - mcp__dockhand__dokploy_app_status
  - mcp__dockhand__dokploy_redeploy
  - mcp__dockhand__dokploy_sync_state
  - mcp__dockhand__dns_list_records
  - mcp__dockhand__updates_tracker
  - AskUserQuestion
argument-hint: "[list|status|sync] [app-name]"
---

# Application Management

Manage application lifecycle. Load the `dh-apps` skill for comprehensive app management.

## Subcommands

### List (default)
```
/dh:apps
/dh:apps list
```
Run `dokploy_list_apps` and present formatted table.

### Status
```
/dh:apps status <app-name>
```
Run `dokploy_app_status` for detailed app info.

### Sync
```
/dh:apps sync
```
Run `dokploy_sync_state` to export current state to git.

## Application Table Format

```
| App           | Status  | Type    | Domain                  |
|---------------|---------|---------|-------------------------|
| ghost         | running | stack   | masonjames.com          |
| client-portal | running | compose | portal.masonjames.com   |
```

## Quick Actions

After listing, offer quick actions:
- View status: `dokploy_app_status app_id=<id>`
- Redeploy: `dokploy_redeploy app_id=<id> confirmed=true`
- Check domains: `dns_list_records`
- Check updates: `updates_tracker action="status"`
