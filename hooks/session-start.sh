#!/bin/bash
# Dockhand SessionStart hook
# Checks MCP server configuration and adds context for Claude

set -euo pipefail

# Output context as JSON for Claude
output_context() {
    local mcp_configured="$1"
    local config_exists="$2"
    local op_available="$3"
    local message="$4"

    cat <<EOF
{
    "continue": true,
    "systemMessage": "$message"
}
EOF
}

# Check if MCP server is configured
MCP_CONFIGURED="false"
if [ -f "$HOME/.mcp.json" ]; then
    if grep -q '"dockhand"' "$HOME/.mcp.json" 2>/dev/null; then
        MCP_CONFIGURED="true"
    fi
fi

# Also check project-level .mcp.json
if [ -f ".mcp.json" ]; then
    if grep -q '"dockhand"' ".mcp.json" 2>/dev/null; then
        MCP_CONFIGURED="true"
    fi
fi

# Check if dockhand config exists
CONFIG_EXISTS="false"
if [ -f "$HOME/.config/dockhand/config.json" ]; then
    CONFIG_EXISTS="true"
fi

# Check if 1Password CLI is available
OP_AVAILABLE="false"
if command -v op &>/dev/null; then
    OP_AVAILABLE="true"
fi

# Build the context message
if [ "$MCP_CONFIGURED" = "false" ]; then
    if [ "$CONFIG_EXISTS" = "false" ]; then
        output_context "$MCP_CONFIGURED" "$CONFIG_EXISTS" "$OP_AVAILABLE" \
            "Dockhand plugin loaded but NOT CONFIGURED. User should run /dh:setup to configure both the infrastructure settings and MCP server. No dockhand tools are available until setup is complete."
    else
        output_context "$MCP_CONFIGURED" "$CONFIG_EXISTS" "$OP_AVAILABLE" \
            "Dockhand plugin loaded. Infrastructure config exists at ~/.config/dockhand/config.json but MCP server is not configured. User should run /dh:setup and select 'Create .mcp.json' to enable dockhand tools."
    fi
else
    # MCP is configured, just provide minimal context
    output_context "$MCP_CONFIGURED" "$CONFIG_EXISTS" "$OP_AVAILABLE" ""
fi
