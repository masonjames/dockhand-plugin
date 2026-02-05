---
name: dh:dns
description: DNS record management via Cloudflare
allowed-tools:
  - mcp__dockhand__dns_list_records
  - mcp__dockhand__dns_get_record
  - mcp__dockhand__dns_create_record
  - mcp__dockhand__dns_update_record
  - mcp__dockhand__dns_delete_record
  - mcp__dockhand__dns_check_propagation
  - AskUserQuestion
argument-hint: "[list|create|update|delete|check] [domain]"
---

# DNS Management

Manage Cloudflare DNS records.

## Subcommands

### List Records
```
/dh:dns list
/dh:dns list CNAME
/dh:dns list A
```
Run `dns_list_records type="<type>"`.

### Check Propagation
```
/dh:dns check example.com
```
Run `dns_check_propagation domain="<domain>"`.

### Create Record
```
/dh:dns create
```
Ask user for:
- Record type (A, CNAME, TXT, etc.)
- Name (subdomain)
- Content (IP or target)
- Proxied (true/false)

Run `dns_create_record ... confirmed=true`.

### Update Record
```
/dh:dns update <record-id>
```
Get current record, ask for new values, run `dns_update_record ... confirmed=true`.

### Delete Record
```
/dh:dns delete <record-id>
```
Confirm deletion, run `dns_delete_record record_id=<id> confirmed=true`.

## Common Patterns

### Add App Domain
```
dns_create_record type="CNAME" name="app" content="platform-core.masonjames.com" proxied=true confirmed=true
```

### DNS Cutover
```
dns_update_record record_id="<id>" content="new-target" confirmed=true
dns_check_propagation domain="<domain>"
```
