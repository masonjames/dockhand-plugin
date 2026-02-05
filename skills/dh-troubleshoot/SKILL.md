---
name: dh-troubleshoot
type: on-demand
trigger:
  - /dh:troubleshoot
description: Systematic debugging for infrastructure issues. Use when user reports errors, app not working, 502/504 errors, certificate problems, DNS issues, or says "debug", "not working", "help", "broken", "error".
---

# Dockhand Troubleshoot

Systematic debugging guide for infrastructure issues. Supports quick triage for common problems and deep diagnostic chains for complex issues.

## Quick Triage Mode

For common errors, run targeted diagnostics:

### HTTP 502/504 (Bad Gateway)
```
1. traefik_status → Check if router exists for domain
2. dokploy_app_status → Verify app is running
3. ssh_exec "docker logs <container> --tail 50" → Check app logs
```
**Common fixes:**
- Container crashed → `dokploy_redeploy`
- Wrong port → Update Traefik config
- App startup failure → Check env vars

### Certificate Errors (HTTPS)
```
1. traefik_check_certs domain="<domain>" → Check cert status
2. dns_get_record name="<domain>" → Verify DNS points to Traefik
3. ssh_exec "docker logs traefik --tail 100 | grep acme" → ACME logs
```
**Common fixes:**
- DNS not propagated → Wait, check `dns_check_propagation`
- Rate limited → Wait 1 hour, use staging CA
- Wrong challenge type → Verify HTTP-01 port 80 open

### Cloudflare 521 (Origin Down)
```
1. ssh_exec "curl -I localhost:<port>" on platform-core → Test local
2. traefik_status → Verify Traefik running
3. ssh_exec "docker ps | grep traefik" → Container status
```
**Common fixes:**
- Traefik not running → Restart via Dokploy
- Firewall blocking → Check Hetzner firewall rules
- Network misconfiguration → Verify dokploy-network

### App Not Starting
```
1. dokploy_app_status → Get deployment status
2. ssh_exec "docker logs <container> --tail 100" → Startup logs
3. ssh_exec "docker inspect <container>" → Check config
```
**Common fixes:**
- Missing env var → Add via Dokploy UI
- Volume permission → Fix ownership
- Resource exhaustion → Check `check_resource_thresholds`

## Deep Diagnostic Chain

For complex issues, run full diagnostic sequence:

### Step 1: Infrastructure Health
```
check_resource_thresholds → All hosts CPU/memory/disk
monitoring_health → Prometheus/Grafana/Loki status
```

### Step 2: Edge Layer (Traefik)
```
traefik_status → All routers and services
traefik_check_certs → All certificate status
ssh_exec "docker logs traefik --tail 200" → Recent logs
```

### Step 3: Orchestration Layer (Dokploy)
```
dokploy_list_apps → All managed applications
dokploy_app_status app_id=<id> → Specific app details
```

### Step 4: Container Layer (Docker)
```
docker_state host="<host>" → Full container inventory
ssh_exec "docker ps -a" → Include stopped containers
ssh_exec "docker logs <container>" → Application logs
```

### Step 5: Network Layer
```
ssh_exec "docker network ls" → Network inventory
ssh_exec "docker network inspect dokploy-network" → Connectivity
dns_list_records → DNS configuration
dns_check_propagation domain="<domain>" → External resolution
```

### Step 6: Application Layer
```
ssh_exec "curl -I http://localhost:<port>" → Local health
ssh_exec "curl -I https://<domain>" → External health
```

## Diagnostic Output Format

Present findings in structured format:

```
=== Troubleshooting Report ===
Issue: <user-reported problem>
Timestamp: <when started>

## Quick Checks
- [ ] Host connectivity: OK
- [ ] Traefik status: OK
- [ ] App status: FAILED - container restarting
- [ ] DNS resolution: OK
- [ ] Certificate: OK

## Root Cause
Container `ghost` in restart loop due to missing DATABASE_URL

## Recommended Fix
1. Add DATABASE_URL to Dokploy environment variables
2. Redeploy application
3. Verify health post-deploy

## Commands to Execute
dokploy_redeploy app_id="xxx" confirmed=true
```

## Escalation Path

If quick triage doesn't resolve:
1. Run full diagnostic chain
2. Check Grafana dashboards for historical data
3. Review Loki logs for patterns
4. Check recent changes (git log, Dokploy activity)
5. Escalate to manual SSH investigation

## Integration with dh-deploy-validator

After fixing issues, trigger `dh-deploy-validator` agent to confirm resolution and prevent regression.
