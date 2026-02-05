---
name: dh:deploy
description: Deploy applications via templates or traditional patterns
allowed-tools:
  - mcp__dockhand__dokploy_list_templates
  - mcp__dockhand__dokploy_deploy_template
  - mcp__dockhand__dokploy_redeploy
  - mcp__dockhand__dokploy_app_status
  - mcp__dockhand__dns_create_record
  - mcp__dockhand__dns_check_propagation
  - mcp__dockhand__traefik_check_certs
  - AskUserQuestion
argument-hint: "[template-name] or [app-id] for redeploy"
---

# Deploy Application

Guide the user through deployment. Load the `dh-deploy` skill for comprehensive deployment patterns.

## Workflow

1. **Determine deployment type:**
   - If user specifies template name → Template deployment
   - If user specifies app-id → Redeploy existing app
   - If unclear → Ask user what they want to deploy

2. **For template deployment:**
   - If no template specified, browse with `dokploy_list_templates`
   - Gather required environment variables
   - Ask for app name and domain
   - Deploy with `dokploy_deploy_template`
   - Create DNS record if custom domain
   - Verify deployment

3. **For redeploy:**
   - Confirm the app to redeploy
   - Run `dokploy_redeploy app_id=<id> confirmed=true`
   - Monitor status with `dokploy_app_status`

4. **Post-deployment:**
   - Check DNS propagation
   - Verify HTTPS certificate
   - Confirm app is healthy

Always follow `dh-guardrails` policies for confirmation requirements.
