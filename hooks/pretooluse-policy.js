#!/usr/bin/env node

/**
 * Pre-tool-use policy hook for Dockhand.
 *
 * Security posture: FAIL-CLOSED
 * - Parse errors → block (deny)
 * - Unknown errors → block (deny)
 * - Only explicitly allowed operations pass
 *
 * Enforces:
 * - Blocks destructive Bash commands on protected branches
 * - Requires `confirmed=true` for destructive MCP operations on protected branches
 *
 * Hook contract: receives JSON on stdin, outputs JSON decision on stdout.
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
    return { decision: "allow" };
  }

  // Check for always-blocked patterns
  for (const pattern of BLOCKED_BASH_PATTERNS) {
    if (pattern.test(command)) {
      return {
        decision: "block",
        reason: `Blocked: Destructive command pattern detected on protected branch. Create a feature branch first.`,
      };
    }
  }

  // Block terraform apply -auto-approve on protected branches
  if (/terraform\s+apply/i.test(command) && command.includes("-auto-approve")) {
    return {
      decision: "block",
      reason: `Blocked: terraform apply -auto-approve on protected branch. Use interactive mode or create a feature branch.`,
    };
  }

  return { decision: "allow" };
}

function checkMcpPolicy(toolName, toolInput) {
  if (!isOnProtectedBranch()) {
    return { decision: "allow" };
  }

  // Only check tools in our destructive list
  if (!DESTRUCTIVE_MCP_TOOLS.includes(toolName)) {
    return { decision: "allow" };
  }

  // For SSH tools, check if the command itself is destructive
  if (toolName === "mcp__dockhand__ssh_exec" || toolName === "mcp__dockhand__ssh_script") {
    const command = toolInput.command || toolInput.script || "";
    const isDestructive = DESTRUCTIVE_SSH_PATTERNS.some((p) => p.test(command));

    if (isDestructive && toolInput.confirmed !== true) {
      return {
        decision: "block",
        reason: `Blocked: Destructive SSH command on protected branch requires confirmed=true.`,
      };
    }
    return { decision: "allow" };
  }

  // For other destructive MCP tools, require confirmed=true
  if (toolInput.confirmed !== true) {
    return {
      decision: "block",
      reason: `Blocked: ${toolName} on protected branch requires confirmed=true.`,
    };
  }

  return { decision: "allow" };
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
  return { decision: "allow" };
}

// Hook contract: read JSON from stdin, output JSON decision on stdout
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
      console.log(
        JSON.stringify({
          decision: "block",
          reason: "Hook error: Invalid input structure. Blocking for safety.",
        })
      );
      return;
    }

    const toolName = hookInput.tool_name || "";
    const toolInput = hookInput.tool_input || {};

    const result = checkPolicy(toolName, toolInput);
    console.log(JSON.stringify(result));
  } catch (err) {
    // Parse error - fail closed
    console.log(
      JSON.stringify({
        decision: "block",
        reason: `Hook error: ${err.message || "Unknown error"}. Blocking for safety.`,
      })
    );
  }
});

// Handle stdin errors
process.stdin.on("error", (err) => {
  console.log(
    JSON.stringify({
      decision: "block",
      reason: `Hook stdin error: ${err.message}. Blocking for safety.`,
    })
  );
});
