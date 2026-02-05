---
name: dh:templates
description: Browse and manage deployment templates
allowed-tools:
  - mcp__dockhand__dokploy_list_templates
  - mcp__dockhand__dokploy_deploy_template
  - AskUserQuestion
argument-hint: "[category] or [search-term]"
---

# Template Catalog

Browse Dokploy's catalog of 364+ deployment templates.

## Browse Templates

### By Category
```
/dh:templates databases
/dh:templates cms
/dh:templates analytics
```

Run `dokploy_list_templates category="<category>"`.

### Search
```
/dh:templates postgres
/dh:templates wordpress
```

Run `dokploy_list_templates` and filter results.

### List All Categories
```
/dh:templates
```

Show available categories:
- cms, databases, dev-tools, analytics, communication, productivity, etc.

## Template Info

When user selects a template, show:
- Description
- Required environment variables
- Resource requirements
- Default ports

## Deploy from Template

Offer to deploy selected template:
```
Would you like to deploy this template?
→ App name:
→ Domain:
→ Environment variables:
```

Then run `dokploy_deploy_template`.
