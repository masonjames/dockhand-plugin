---
name: dh:maintenance
description: Run maintenance tasks
allowed-tools:
  - mcp__dockhand__ssh_exec
  - mcp__dockhand__docker_state
  - mcp__dockhand__check_resource_thresholds
  - mcp__dockhand__updates_tracker
  - AskUserQuestion
argument-hint: "[status|run] [task-name]"
---

# Maintenance Operations

Run platform maintenance tasks.

## Subcommands

### Status
```
/dh:maintenance status
```
Show maintenance state:
- Last maintenance run
- Pending tasks
- Resource usage trends

### Run Task
```
/dh:maintenance run cleanup
/dh:maintenance run prune
/dh:maintenance run optimize
```

## Available Tasks

### cleanup
Clean unused Docker resources:
```
ssh_exec "docker system prune -f" host="platform-core"
ssh_exec "docker system prune -f" host="prod"
```

### prune
Remove old images and volumes:
```
ssh_exec "docker image prune -a --filter 'until=168h' -f"
ssh_exec "docker volume prune -f"
```

### optimize
Run optimization tasks:
- Clear temp files
- Rotate logs
- Compact databases

## Scheduled Maintenance

Suggest running maintenance:
- Weekly: cleanup, prune
- Monthly: full optimization
- Before major deployments: resource check
