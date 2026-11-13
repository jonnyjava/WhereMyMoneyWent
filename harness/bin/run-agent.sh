#!/usr/bin/env bash
# Run one agent role headlessly and print its final answer to stdout.
#
# Usage: bash harness/bin/run-agent.sh <role> <context-file>
#
# This is the ONLY place that knows which agent tool runs a role. To move a
# role to another tool (e.g. Codex), change the invocation at the bottom.
# AGENTS.md is picked up by the tool itself (Codex reads AGENTS.md natively;
# Claude Code reads CLAUDE.md, which imports AGENTS.md).
#
# NOTE: verify the CLI flags below against the tool's current documentation
# before first use. They were written from memory of the Claude Code CLI.
set -euo pipefail

ROLE="${1:?usage: run-agent.sh <role> <context-file>}"
CONTEXT="${2:?usage: run-agent.sh <role> <context-file>}"
ROLE_FILE="harness/roles/${ROLE}.md"
[ -f "$ROLE_FILE" ] || { echo "Unknown role: $ROLE" >&2; exit 2; }

# Per-role tool policy. Reviewers get no Edit/Write tools and only narrow gh access.
case "$ROLE" in
  architecture-reviewer|qa-gate)
    TOOLS='Read,Grep,Glob,Bash(git:*),Bash(pnpm:*),Bash(gh pr view:*),Bash(gh issue view:*)'
    MAX_TURNS=40
    TIMEOUT=30m
    ;;
  planner)
    # Read-only: the planner answers with a plan; a script extracts and validates it.
    TOOLS='Read,Grep,Glob'
    MAX_TURNS=40
    TIMEOUT=30m
    ;;
  coding-agent)
    TOOLS='Read,Grep,Glob,Edit,Write,Bash'
    MAX_TURNS=150
    TIMEOUT=60m
    ;;
  *)
    echo "No tool policy for role: $ROLE" >&2
    exit 2
    ;;
esac

# The prompt goes through stdin: diffs can exceed the command-line length limit.
{
  cat harness/pipeline.md
  printf '\n\n---\n\n'
  cat "$ROLE_FILE"
  printf '\n\n---\n\n# Context for this run\n\n'
  cat "$CONTEXT"
} | timeout "$TIMEOUT" claude -p --allowedTools "$TOOLS" --max-turns "$MAX_TURNS"
