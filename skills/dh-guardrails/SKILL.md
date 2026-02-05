---
name: dh-guardrails
type: always-on
description: Policy enforcement for safe infrastructure operations. Automatically active to prevent destructive actions, enforce PR workflows, and ensure backup-before-modify patterns.
---

# Dockhand Guardrails

Enforce safety policies for infrastructure operations, preventing common mistakes and ensuring best practices across all Dockhand workflows.

## Platform Domain Context

**IMPORTANT**: When working with domains in ANY Dockhand operation, you MUST use the user's actual configured domain, never example placeholders.

**How to discover the user's domain:**
1. **Primary method**: Call `dns_list_records` - the zone shows their `platform_domain`
2. **From apps**: Call `dokploy_list_apps` - app domains reveal the platform domain
3. **From certs**: Call `traefik_check_certs` - shows active domains
4. **Config location**: `~/.config/dockhand/config.json` contains `"platform_domain": "actual-domain.com"`

Always substitute `<platform_domain>` placeholders with the discovered domain before executing DNS or domain-related operations.

## Core Rules

1. **No secrets in git** - Never commit `.env` files, passwords, tokens, or API keys. Warn immediately if user attempts to stage sensitive files.

2. **Environment-based Terraform workflow**:
   - **Production**: All changes require PR to main branch. Block direct `terraform apply` on prod.
   - **Test environments**: Direct apply allowed with `confirmed=true`.

3. **Destructive operation gating** - Block dangerous commands without explicit confirmation:
   - `terraform destroy`
   - `docker rm`, `docker volume rm`
   - `rm -rf` on infrastructure paths
   - Database drops or truncates

4. **Backup before modify** - Require backup verification before:
   - Database migrations
   - Volume modifications
   - Service downgrades

5. **State sync after deploy** - Prompt to run state collection after Dokploy deployments to maintain git documentation.

## Intervention Triggers

Intervene when user requests:

| Action | Response |
|--------|----------|
| Commit `.env` or credentials | Refuse, explain risks, suggest 1Password |
| `terraform apply` on prod without PR | Block, explain PR workflow, offer to create branch |
| Delete volumes or services | Require confirmation, suggest backup first |
| Modify production directly | Suggest test environment first |
| Deploy without health check | Recommend running `/dh:status` after |

## Enforcement Behavior

- Monitor all tool calls passively
- Block destructive operations on protected branches (main, master, production)
- Require `confirmed=true` for state-changing MCP tools
- Log audit trail for infrastructure changes via `notify_send` if configured

## Mode-Aware Enforcement

### Admin Mode
Full guardrail enforcement via both plugin hooks and MCP server:
- `terraform_apply` - Requires `confirmed=true`
- `dokploy_redeploy` - Requires `confirmed=true`
- `dns_create_record`, `dns_update_record`, `dns_delete_record` - Require `confirmed=true`
- `ssh_exec` - Blocks destructive commands without confirmation

### Client Portal Mode
Server-side enforcement only. The remote MCP server scopes access based on the user's portal token:
- Users can only access apps assigned to their account
- Destructive operations require server-side approval
- No direct SSH, Terraform, or raw infrastructure access
- The plugin hooks allow all `dockyard_*` tool calls through (server enforces permissions)

This skill provides the policy layer; MCP tools provide enforcement.
