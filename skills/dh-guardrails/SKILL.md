---
name: dh-guardrails
type: always-on
description: Policy enforcement for safe infrastructure operations. Automatically active to prevent destructive actions, enforce PR workflows, and ensure backup-before-modify patterns.
---

# Dockhand Guardrails

Enforce safety policies for infrastructure operations, preventing common mistakes and ensuring best practices across all Dockhand workflows.

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

## Integration with MCP Tools

These Dockhand tools enforce guardrails server-side:
- `terraform_apply` - Requires `confirmed=true`
- `dokploy_redeploy` - Requires `confirmed=true`
- `dns_create_record`, `dns_update_record`, `dns_delete_record` - Require `confirmed=true`
- `ssh_exec` - Blocks destructive commands without confirmation

This skill provides the policy layer; MCP tools provide enforcement.
