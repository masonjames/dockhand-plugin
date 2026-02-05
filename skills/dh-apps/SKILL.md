---
name: dh-apps
type: on-demand
trigger:
  - /dh:apps
description: Day-to-day application lifecycle management. Use when user wants to manage apps, check app status, list applications, manage domains, start/stop/restart apps, or says "apps", "applications", "services", "my apps".
---

# Dockhand Apps

Manage day-to-day application lifecycle operations. List apps, check status, manage domains, and perform lifecycle actions.

## Configuration Context

**IMPORTANT**: When working with domains, always use the user's configured `platform_domain` from their dockhand config, NOT example placeholders. To discover the user's domain:
1. Check existing DNS records via `dns_list_records` - domains will show the actual configured zone
2. Check existing apps via `dokploy_list_apps` - app domains reveal the platform domain
3. The user's config at `~/.config/dockhand/config.json` contains `platform_domain`

Replace `<platform_domain>` in examples below with the user's actual domain (e.g., `mycompany.com`).

## Application Overview

List all managed applications:

```
dokploy_list_apps
  → Returns all projects and applications
  → Includes status, domains, deployment info
```

Output format:
```
## Applications

| App           | Status  | Type      | Domain                    |
|---------------|---------|-----------|---------------------------|
| ghost         | running | stack     | <platform_domain>         |
| client-portal | running | compose   | portal.<platform_domain>  |
| wordpress     | running | stack     | client-site.com           |
| cal-com       | stopped | compose   | cal.<platform_domain>     |
```

## Application Status

Get detailed status for specific app:

```
dokploy_app_status app_id="<app_id>"
  → Container state, replicas, health
  → Environment variables (names only)
  → Domains and routing
  → Recent deployment history
```

## Lifecycle Operations

### Start/Stop/Restart

Control app state via Dokploy:

```
# Restart (most common for applying changes)
dokploy_redeploy app_id="<id>" confirmed=true

# Stop (via Dokploy UI - not directly exposed)
# Start (via Dokploy UI - not directly exposed)
```

**Note:** Direct start/stop requires Dokploy UI. Redeploy handles most restart scenarios.

### Scale Replicas

For stack-mode apps, adjust replicas:
1. Update compose file in Dokploy
2. Redeploy to apply changes

## Domain Management

### List Domains

```
dns_list_records type="CNAME"
  → All CNAME records (app domains)

dns_list_records type="A"
  → A records (root domains)
```

### Add Domain to App

1. Create DNS record:
   ```
   dns_create_record type="CNAME" name="new-app" content="platform-core.<your_domain>" confirmed=true
   ```

2. Add domain in Dokploy UI

3. Verify propagation:
   ```
   dns_check_propagation domain="new-app.<your_domain>"
   ```

4. Check certificate:
   ```
   traefik_check_certs domain="new-app.<your_domain>"
   ```

### Update Domain

```
dns_update_record record_id="<id>" content="new-target.<your_domain>" confirmed=true
```

### Remove Domain

```
dns_delete_record record_id="<id>" confirmed=true
```

## Update Tracking

Track software updates across applications:

### Check Update Status
```
updates_tracker action="status"
  → Last check time per app
  → Available updates
```

### View Update Report
```
updates_tracker action="report"
  → Formatted update report
  → Prioritized by age/severity
```

### Record Update Check
```
updates_tracker action="record" app_name="ghost" current_version="5.82.0" latest_version="5.87.0"
```

## State Synchronization

Keep git documentation in sync with live state:

```
dokploy_sync_state
  → Exports current Dokploy state
  → Writes to state-snapshots/
  → Ready for git commit
```

Run after:
- New deployments
- Configuration changes
- Domain updates
- Before/after maintenance

## Common Workflows

### Daily Operations

1. Check status: `/dh:status`
2. Review apps: `dokploy_list_apps`
3. Check updates: `updates_tracker action="status"`

### After Deployment

1. Verify app: `dokploy_app_status app_id="<id>"`
2. Check routing: `traefik_status`
3. Test HTTPS: `traefik_check_certs domain="<domain>"`
4. Sync state: `dokploy_sync_state`

### Troubleshooting App Issues

1. Check status: `dokploy_app_status`
2. If unhealthy → `/dh:troubleshoot`
3. If needs restart → `dokploy_redeploy confirmed=true`
4. Verify recovery

## Integration with Client Portal

For apps deployed via client-portal:
- Same tools apply (dokploy_app_status, etc.)
- MCP tokens scope to user's apps
- Billing tracked separately in portal
