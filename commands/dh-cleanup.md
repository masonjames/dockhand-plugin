---
name: dh:cleanup
description: Clean up unused Docker resources
allowed-tools:
  - mcp__dockhand__ssh_exec
  - mcp__dockhand__docker_state
  - mcp__dockhand__check_resource_thresholds
  - AskUserQuestion
argument-hint: "[host] [--dry-run]"
---

# Docker Cleanup

Clean unused Docker resources to reclaim disk space.

## Usage

```
/dh:cleanup              # All hosts
/dh:cleanup platform-core
/dh:cleanup prod
/dh:cleanup --dry-run    # Preview only
```

## Cleanup Sequence

1. **Check current usage:**
   ```
   check_resource_thresholds
   docker_state host="<host>"
   ```

2. **Preview cleanup (dry-run):**
   ```
   ssh_exec "docker system df" host="<host>"
   ```

3. **Execute cleanup:**
   ```
   ssh_exec "docker system prune -f" host="<host>"
   ssh_exec "docker image prune -a --filter 'until=168h' -f" host="<host>"
   ```

4. **Verify results:**
   ```
   check_resource_thresholds
   ```

## What Gets Cleaned

- Stopped containers
- Unused networks
- Dangling images
- Build cache

## What's Preserved

- Running containers
- Named volumes (data)
- Images in use
