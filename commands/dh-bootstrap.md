---
name: dh:bootstrap
description: Bootstrap a new server into the platform
allowed-tools:
  - mcp__dockhand__ssh_exec
  - mcp__dockhand__ssh_script
  - mcp__dockhand__terraform_show
  - mcp__dockhand__check_resource_thresholds
  - AskUserQuestion
argument-hint: "[host-name]"
---

# Bootstrap New Host

Initialize a newly provisioned server and add it to the platform.

## Prerequisites

- Server provisioned via Terraform
- SSH access configured via Tailscale
- Host added to dockhand config

## Security Note

This bootstrap process uses `curl | sh` patterns for Docker and Tailscale installation. While these are official installation methods from trusted vendors, this approach has inherent supply-chain risks. For production environments, consider:
- Downloading and verifying scripts before execution
- Using package managers where available
- Implementing your own verified installation scripts

## Bootstrap Sequence

### 1. Verify Connectivity
```
ssh_exec "hostname && uname -a" host="<new-host>"
```

### 2. Install Docker
```
ssh_script host="<new-host>" script="
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
"
```

### 3. Join Docker Swarm

For manager:
```
ssh_exec "docker swarm init" host="<new-host>"
```

For worker:
```
# Get join token from existing manager
ssh_exec "docker swarm join-token worker -q" host="platform-core"
# Join on new host
ssh_exec "docker swarm join --token <token> <manager-ip>:2377" host="<new-host>"
```

### 4. Install Tailscale
```
ssh_script host="<new-host>" script="
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up --authkey=<key>
"
```

### 5. Configure Monitoring Agent
```
ssh_script host="<new-host>" script="
# Install Alloy for log collection
# Configure to send to Loki
"
```

### 6. Verify Integration
```
ssh_exec "docker node ls" host="platform-core"
check_resource_thresholds
```

## Post-Bootstrap

- Add host to Prometheus scrape targets
- Update Grafana dashboards
- Document in platform-infra repo
