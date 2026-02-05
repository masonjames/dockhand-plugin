---
name: dh:updates
description: Track software updates across applications
allowed-tools:
  - mcp__dockhand__updates_tracker
  - AskUserQuestion
argument-hint: "[status|report|record] [app-name]"
---

# Update Tracking

Track software updates across managed applications.

## Subcommands

### Status
```
/dh:updates status
```
Run `updates_tracker action="status"` - shows last check time and pending updates.

### Report
```
/dh:updates report
```
Run `updates_tracker action="report"` - formatted update report.

### Record
```
/dh:updates record ghost 5.82.0 5.87.0
```
Run `updates_tracker action="record" app_name="ghost" current_version="5.82.0" latest_version="5.87.0"`.

### Initialize
```
/dh:updates init
```
Run `updates_tracker action="init"` - set up tracking database.

## Update Report Format

```
=== Update Report ===
Generated: <timestamp>

## Pending Updates

| App       | Current | Latest  | Age    |
|-----------|---------|---------|--------|
| ghost     | 5.82.0  | 5.87.0  | 7 days |
| wordpress | 6.4.2   | 6.5.0   | 14 days|

## Recently Updated
- traefik: 3.0.0 → 3.0.1 (2 days ago)
```

## Thresholds

- **Warning**: Update available > 7 days
- **Critical**: Update available > 30 days
