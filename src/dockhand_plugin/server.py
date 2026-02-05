"""Dockhand Plugin MCP Server - Entry point for Claude Code integration.

This module provides a thin wrapper around the dockhand package's MCP server,
making it easy to install and run as a standalone Claude Code plugin.
"""

import asyncio
import sys

from dockhand.config import load_config
from dockhand.server import DockhandServer


def main():
    """Entry point for the dockhand-plugin command.

    Loads configuration and starts the MCP server for Claude Code integration.

    Configuration is loaded from (in priority order):
    1. DOCKHAND_CONFIG environment variable
    2. ./dockhand.config.json in current directory
    3. ~/.config/dockhand/config.json

    Required environment variables for full functionality:
    - CLOUDFLARE_API_TOKEN: For DNS management
    - DOKPLOY_TOKEN: For Dokploy API access

    Use 1Password CLI to populate these:
        export CLOUDFLARE_API_TOKEN=$(op item get cloudflare-dns-api --vault 'Platform Infra' --fields api_token --reveal)
        export DOKPLOY_TOKEN=$(op item get your-dokploy-item --vault 'Platform Infra' --fields 'API Key' --reveal)
    """
    try:
        config = load_config()
    except FileNotFoundError as e:
        print(f"Configuration error:\n{e}", file=sys.stderr)
        print("\nCreate a config file at ~/.config/dockhand/config.json", file=sys.stderr)
        print("See dockhand.config.example.json for the required format.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Failed to load config: {e}", file=sys.stderr)
        sys.exit(1)

    server = DockhandServer(config)
    asyncio.run(server.run())


if __name__ == "__main__":
    main()
