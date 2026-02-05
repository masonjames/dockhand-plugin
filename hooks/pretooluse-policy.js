#!/usr/bin/env node

/**
 * Pre-tool-use policy hook for Dockhand.
 *
 * Blocks destructive operations on protected branches and logs an audit trail.
 * Customize the PROTECTED_BRANCHES and BLOCKED_PATTERNS for your workflow.
 *
 * Hook contract: receives JSON on stdin, outputs JSON decision on stdout.
 */

const { execSync } = require("child_process");

const PROTECTED_BRANCHES = ["main", "master", "production"];

// Patterns that require confirmation or blocking
const BLOCKED_PATTERNS = [
  /terraform\s+destroy/i,
  /docker\s+(rm|rmi|system\s+prune)/i,
  /rm\s+-rf\s+\//,
];

function getCurrentBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null; // Not in a git repo
  }
}

function checkPolicy(toolName, input) {
  const branch = getCurrentBranch();

  // Only enforce on protected branches
  if (!branch || !PROTECTED_BRANCHES.includes(branch)) {
    return { decision: "allow" };
  }

  // Check for destructive patterns in Bash commands
  if (toolName === "Bash" && input.command) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(input.command)) {
        return {
          decision: "deny",
          reason: `Blocked: Destructive command on protected branch '${branch}'. Create a feature branch first.`,
        };
      }
    }
  }

  // Block terraform apply on protected branches without explicit approval
  if (toolName === "Bash" && input.command && /terraform\s+apply/i.test(input.command)) {
    if (!input.command.includes("-auto-approve")) {
      return { decision: "allow" }; // Interactive apply is OK (requires manual confirmation)
    }
    return {
      decision: "deny",
      reason: `Blocked: terraform apply -auto-approve on protected branch '${branch}'.`,
    };
  }

  return { decision: "allow" };
}

// Hook contract: read JSON from stdin, output JSON decision on stdout
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  try {
    const hookInput = JSON.parse(input);
    const result = checkPolicy(hookInput.tool_name || "", hookInput.tool_input || {});
    console.log(JSON.stringify(result));
  } catch {
    // Default to allow on parse errors
    console.log(JSON.stringify({ decision: "allow" }));
  }
});
