#!/usr/bin/env node

/**
 * Pre-tool-use policy hook for Dockhand.
 *
 * Security posture: FAIL-CLOSED
 * - Parse errors → deny
 * - Unknown errors → deny
 * - Only explicitly allowed operations pass
 *
 * Enforces:
 * - Blocks destructive Bash commands on protected branches
 * - Requires `confirmed=true` for destructive MCP operations on protected branches
 *
 * Hook contract:
 * - Receives JSON on stdin with tool_name and tool_input
 * - Outputs JSON with hookSpecificOutput.permissionDecision ("allow", "deny", "ask")
 * - Exit 0 for allow, Exit 2 for deny (with output to stderr)
 */

const { execSync } = require("child_process");

const PROTECTED_BRANCHES = ["main", "master", "production"];

// Bash patterns that are always blocked on protected branches
const BLOCKED_BASH_PATTERNS = [
  /terraform\s+destroy/i,
  /docker\s+(rm|rmi|system\s+prune)/i,
  /rm\s+-rf\s+\//,
  /git\s+push\s+.*--force/i,
  /git\s+reset\s+--hard/i,
];

// MCP tools that require confirmed=true on protected branches
const DESTRUCTIVE_MCP_TOOLS = [
  "mcp__dockhand__ssh_exec",
  "mcp__dockhand__ssh_script",
  "mcp__dockhand__terraform_apply",
  "mcp__dockhand__dokploy_redeploy",
  "mcp__dockhand__dns_create_record",
  "mcp__dockhand__dns_update_record",
  "mcp__dockhand__dns_delete_record",
];

// Commands in ssh_exec that are considered destructive
const DESTRUCTIVE_SSH_PATTERNS = [
  /docker\s+(rm|rmi|system\s+prune|stack\s+rm)/i,
  /systemctl\s+(stop|disable|restart)/i,
  /rm\s+-rf/i,
];

/**
 * Create an allow response
 */
function allow() {
  return {
    hookSpecificOutput: { permissionDecision: "allow" },
  };
}

/**
 * Create a deny response with reason
 */
function deny(reason) {
  return {
    hookSpecificOutput: { permissionDecision: "deny" },
    systemMessage: reason,
  };
}

function getCurrentBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 3000,
    }).trim();
  } catch {
    return null; // Not in a git repo or git not available
  }
}

function isOnProtectedBranch() {
  const branch = getCurrentBranch();
  return branch && PROTECTED_BRANCHES.includes(branch);
}

function checkBashPolicy(command) {
  if (!isOnProtectedBranch()) {
    return allow();
  }

  // Check for always-blocked patterns
  for (const pattern of BLOCKED_BASH_PATTERNS) {
    if (pattern.test(command)) {
      return deny(
        `Blocked: Destructive command pattern detected on protected branch. Create a feature branch first.`
      );
    }
  }

  // Block terraform apply -auto-approve on protected branches
  if (/terraform\s+apply/i.test(command) && command.includes("-auto-approve")) {
    return deny(
      `Blocked: terraform apply -auto-approve on protected branch. Use interactive mode or create a feature branch.`
    );
  }

  return allow();
}

function checkMcpPolicy(toolName, toolInput) {
  if (!isOnProtectedBranch()) {
    return allow();
  }

  // Only check tools in our destructive list
  if (!DESTRUCTIVE_MCP_TOOLS.includes(toolName)) {
    return allow();
  }

  // For SSH tools, check if the command itself is destructive
  if (toolName === "mcp__dockhand__ssh_exec" || toolName === "mcp__dockhand__ssh_script") {
    const command = toolInput.command || toolInput.script || "";
    const isDestructive = DESTRUCTIVE_SSH_PATTERNS.some((p) => p.test(command));

    if (isDestructive && toolInput.confirmed !== true) {
      return deny(`Blocked: Destructive SSH command on protected branch requires confirmed=true.`);
    }
    return allow();
  }

  // For other destructive MCP tools, require confirmed=true
  if (toolInput.confirmed !== true) {
    return deny(`Blocked: ${toolName} on protected branch requires confirmed=true.`);
  }

  return allow();
}

function checkPolicy(toolName, toolInput) {
  // Bash tool
  if (toolName === "Bash") {
    return checkBashPolicy(toolInput.command || "");
  }

  // MCP dockhand tools
  if (toolName.startsWith("mcp__dockhand__")) {
    return checkMcpPolicy(toolName, toolInput);
  }

  // Unknown tools pass through (server-side will enforce its own policies)
  return allow();
}

// Hook contract: read JSON from stdin, output JSON decision
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});

process.stdin.on("end", () => {
  try {
    const hookInput = JSON.parse(input);

    if (!hookInput || typeof hookInput !== "object") {
      // Invalid input structure - fail closed
      const result = deny("Hook error: Invalid input structure. Blocking for safety.");
      console.error(JSON.stringify(result));
      process.exit(2);
      return;
    }

    const toolName = hookInput.tool_name || "";
    const toolInput = hookInput.tool_input || {};

    const result = checkPolicy(toolName, toolInput);

    // Allow: exit 0 with stdout
    // Deny: exit 2 with stderr
    if (result.hookSpecificOutput.permissionDecision === "allow") {
      console.log(JSON.stringify(result));
      process.exit(0);
    } else {
      console.error(JSON.stringify(result));
      process.exit(2);
    }
  } catch (err) {
    // Parse error - fail closed
    const result = deny(`Hook error: ${err.message || "Unknown error"}. Blocking for safety.`);
    console.error(JSON.stringify(result));
    process.exit(2);
  }
});

// Handle stdin errors
process.stdin.on("error", (err) => {
  const result = deny(`Hook stdin error: ${err.message}. Blocking for safety.`);
  console.error(JSON.stringify(result));
  process.exit(2);
});
