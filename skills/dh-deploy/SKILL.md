---
name: dh-deploy
type: on-demand
trigger:
  - /dh:deploy
  - /dh:templates
description: Guide deployment workflows for applications. Use when user wants to deploy an app, deploy a template, redeploy a service, browse templates, or says "deploy", "launch", "spin up", "install app".
---

# Dockhand Deploy

Guide users through deployment workflows for self-hosted applications. Supports template-based deployments (364+ open-source apps) and traditional WordPress/Ghost deployments.

## Configuration Context

**IMPORTANT**: When creating DNS records or referencing domains, use the user's configured `platform_domain`, NOT example placeholders. Discover it by:
1. Checking existing DNS records via `dns_list_records`
2. Checking existing apps via `dokploy_list_apps`
3. The user's config contains `platform_domain` (e.g., `mycompany.com`)

Replace `<platform_domain>` in examples below with the user's actual domain.

## Deployment Patterns

### 1. Template Deployment (Recommended)

Deploy from Dokploy's catalog of 364+ open-source applications.

**Workflow:**
1. Browse templates: `dokploy_list_templates` (filterable by category/tag)
2. Select template and review requirements
3. Configure environment variables
4. Deploy: `dokploy_deploy_template`
5. Create DNS record: `dns_create_record` (if custom domain)
6. Verify deployment with `dh-deploy-validator` agent

**MCP Tool Sequence:**
```
dokploy_list_templates category="databases"
  → User selects "postgresql"
dokploy_deploy_template template_id="postgresql" app_name="my-postgres" env_vars={...}
  → Returns app_id
dns_create_record type="CNAME" name="db" content="platform-core.<your_domain>"
  → Traefik auto-routes
```

### 2. Traditional Deployment (WordPress/Ghost)

Deploy WordPress or Ghost with full configuration.

**Workflow:**
1. Gather requirements: domain, admin email, site name
2. Deploy via `dokploy_deploy_template` with CMS-specific template
3. Configure DNS: `dns_create_record`
4. Wait for provisioning (check `dokploy_app_status`)
5. Run CMS setup (admin account creation)

### 3. Redeployment

Redeploy existing application (after code changes or config updates).

**Workflow:**
1. Check current status: `dokploy_app_status app_id=<id>`
2. Trigger redeploy: `dokploy_redeploy app_id=<id> confirmed=true`
3. Monitor progress via status checks
4. Verify health post-deploy

## Template Categories

Common categories available:
- **CMS**: WordPress, Ghost, Strapi, Directus
- **Databases**: PostgreSQL, MySQL, Redis, MongoDB
- **Dev Tools**: Gitea, GitLab, n8n, Minio
- **Analytics**: Plausible, Umami, Matomo
- **Communication**: Mattermost, Rocket.Chat
- **Productivity**: Nextcloud, Outline, BookStack

Browse with: `dokploy_list_templates category="<category>"`

## Pre-Deployment Checklist

Before any deployment:
- [ ] Verify host capacity (`check_resource_thresholds`)
- [ ] Check domain availability (not already routed)
- [ ] Prepare environment variables
- [ ] Ensure backup strategy for stateful apps

## Post-Deployment Verification

After deployment:
1. Check app status: `dokploy_app_status`
2. Verify DNS propagation: `dns_check_propagation`
3. Test HTTPS access: `traefik_check_certs`
4. Run health endpoint if available
5. Sync state to git: suggest `/dh:apps sync`

## Error Handling

| Error | Resolution |
|-------|------------|
| DNS propagation slow | Wait 5-10 min, check with `dns_check_propagation` |
| Container failing | Check logs via `ssh_exec`, verify env vars |
| Certificate not issued | Verify DNS points to Traefik, check ACME logs |
| Port conflict | Check existing services, choose different port |

## Integration with Client Portal

For client-portal deployments:
- Templates deploy via same `dokploy_deploy_template` tool
- MCP tokens scope access to user's apps only
- Billing/credits handled by portal, not Dockhand
