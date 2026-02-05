#!/bin/bash
# Dockhand SessionStart hook
# Checks configuration state and provides context to Claude

set -euo pipefail

# Check if MCP server is configured
MCP_CONFIGURED="false"
if [ -f "$HOME/.mcp.json" ]; then
    if grep -q '"dockhand"' "$HOME/.mcp.json" 2>/dev/null; then
        MCP_CONFIGURED="true"
    fi
fi
if [ -f ".mcp.json" ]; then
    if grep -q '"dockhand"' ".mcp.json" 2>/dev/null; then
        MCP_CONFIGURED="true"
    fi
fi

# Check if dockhand config exists and detect mode
CONFIG_EXISTS="false"
MODE="unknown"
if [ -f "$HOME/.config/dockhand/config.json" ]; then
    CONFIG_EXISTS="true"
    MODE=$(python3 -c "import json; print(json.load(open('$HOME/.config/dockhand/config.json')).get('mode', 'admin'))" 2>/dev/null || echo "admin")
fi

# Build the context message
MESSAGE=""
if [ "$MCP_CONFIGURED" = "false" ]; then
    if [ "$CONFIG_EXISTS" = "false" ]; then
        MESSAGE="Dockhand plugin loaded but NOT CONFIGURED. User should run /dh-setup to configure. No dockhand tools are available until setup is complete."
    else
        MESSAGE="Dockhand plugin loaded. Config exists (mode: $MODE) but MCP server is not configured. User should run /dh-setup to complete setup."
    fi
elif [ "$MODE" = "client" ]; then
    MESSAGE="Dockhand plugin loaded in Client Portal mode. Tools are scoped to portal permissions."
fi

# Output structured JSON
cat <<EOF
{
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": "$MESSAGE"
    }
}
EOF
