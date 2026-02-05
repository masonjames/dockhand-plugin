---
name: dh-status
type: on-demand
trigger:
  - /dh:status
  - /dh:report
description: Generate infrastructure status reports and health checks. Use when user asks for platform status, health check, system overview, service status, or says "what's running", "check health", "show status".
---

# Dockhand Status Reporter

Generate comprehensive status reports for your infrastructure. Provides quick health overviews and detailed reports across all managed hosts and services.

## Configuration Context

**IMPORTANT**: When displaying domains in reports, use actual domains from the user's infrastructure, NOT example placeholders. Discover domains by:
1. Checking apps via `dokploy_list_apps` - returns actual configured domains
2. Checking DNS via `dns_list_records` - shows the user's zone
3. Checking certs via `traefik_check_certs` - reveals active domains

The user's `platform_domain` config determines their primary domain.

## Quick Status (`/dh:status`)

Perform a rapid health check:

1. **Host connectivity** - SSH to each configured host
2. **Critical services** - Traefik, Dokploy, monitoring stack
3. **Active alerts** - Any warning/critical thresholds breached

Use MCP tools:
- `check_resource_thresholds` - Disk/memory on all hosts
- `traefik_status` - Edge router health
- `monitoring_health` - Prometheus/Grafana/Loki status

Output format:
```
=== Quick Status ===
Hosts: 2/2 healthy
Services: 8/8 running
Alerts: 1 warning (disk usage platform-core 72%)
```

## Full Report (`/dh:report`)

Comprehensive infrastructure report:

### Data Collection Sequence

1. `ssh_exec` on each host for system metrics
2. `docker_state` for container/service inventory
3. `dokploy_list_apps` for application registry
4. `traefik_status` for routing configuration
5. `traefik_check_certs` for TLS certificate status
6. `dns_list_records` for DNS configuration
7. `monitoring_health` for observability stack
8. `updates_tracker action=status` for pending updates

### Report Sections

```
=== Platform Status Report ===
Generated: <timestamp>

## Hosts
| Host          | Status  | CPU | Memory | Disk |
|---------------|---------|-----|--------|------|
| platform-core | healthy | 15% | 45%    | 62%  |
| prod          | healthy | 8%  | 32%    | 41%  |

## Applications
| App           | Status  | Replicas | Domain                   |
|---------------|---------|----------|--------------------------|
| ghost         | running | 1/1      | <platform_domain>        |
| client-portal | running | 1/1      | portal.<platform_domain> |

## Certificates
| Domain                   | Expires    | Days Left |
|--------------------------|------------|-----------|
| <platform_domain>        | 2024-06-15 | 45        |
| portal.<platform_domain> | 2024-06-15 | 45        |

## DNS Records (summary)
- A records: 12
- CNAME records: 8
- Total managed: 20

## Alerts
- [WARN] Disk usage on platform-core above 60%
- [INFO] 2 certificates expiring within 60 days
- [INFO] 3 software updates available
```

## Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Disk | 80% | 90% |
| Memory | 85% | 95% |
| Cert expiry | 30 days | 7 days |
| Updates | 7 days old | 30 days old |

## When to Use

- Start of work session - quick status check
- Before deployments - verify infrastructure health
- After incidents - confirm recovery
- Weekly reviews - full report for documentation
