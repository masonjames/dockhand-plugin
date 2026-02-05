---
name: dh:backup
description: Backup operations for applications and data
allowed-tools:
  - mcp__dockhand__ssh_exec
  - mcp__dockhand__ssh_copy
  - mcp__dockhand__dokploy_app_status
  - AskUserQuestion
argument-hint: "[run|verify|list] [app-name]"
---

# Backup Operations

Manage backups for applications and data.

## Subcommands

### Run Backup
```
/dh:backup run ghost
/dh:backup run wordpress
```
Execute backup script for specified application.

### Verify Backup
```
/dh:backup verify ghost
```
Check backup integrity and recency.

### List Backups
```
/dh:backup list
/dh:backup list ghost
```
Show available backups in R2 storage.

## Backup Targets

- **Databases**: MySQL, PostgreSQL dumps
- **Volumes**: Docker volume snapshots
- **Configs**: Application configuration files

## Backup Storage

Backups stored in Cloudflare R2:
- Bucket: configured in dockhand.config.json
- Retention: per-app policy
- Encryption: at-rest via R2

## Pre-Modification Backups

Per `dh-guardrails`, always backup before:
- Database migrations
- Volume modifications
- Service downgrades

Prompt user to run backup if not recently completed.
