---
name: dh:terraform
description: Infrastructure-as-code operations
allowed-tools:
  - mcp__dockhand__terraform_plan
  - mcp__dockhand__terraform_apply
  - mcp__dockhand__terraform_show
  - mcp__dockhand__collect_state
  - AskUserQuestion
argument-hint: "[plan|apply|show] [environment]"
---

# Terraform Operations

Manage infrastructure with Terraform. Load the `dh-infra` skill for complete IaC workflows.

## Subcommands

### Plan
```
/dh:terraform plan prod
/dh:terraform plan test
/dh:terraform plan global
```
Run `terraform_plan environment="<env>"`.

### Apply
```
/dh:terraform apply test
```
**Note:** Production requires PR workflow per `dh-guardrails`.

For test: `terraform_apply environment="test" confirmed=true`

### Show
```
/dh:terraform show prod
```
Run `terraform_show environment="<env>"` to view current state.

## Environment Safety

| Environment | Plan | Apply |
|-------------|------|-------|
| prod | Allowed | PR required |
| test | Allowed | Direct with confirm |
| global | Allowed | PR required |

## Plan All Environments

To plan all:
```
terraform_plan environment="global"
terraform_plan environment="prod"
terraform_plan environment="test"
```

Present combined summary of changes.
