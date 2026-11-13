#!/usr/bin/env bash
# Print the verdict found in an agent's output file.
#
# Usage: bash harness/bin/parse-verdict.sh <agent-output-file>
# Prints one of: APPROVE | REQUEST_CHANGES | NEEDS_HUMAN
#
# Fails closed: a missing file, a missing verdict line, or a malformed one all
# count as NEEDS_HUMAN. The FIRST matching line wins, because the role files
# put the real verdict on the first line, and later lines may quote diff content.
set -uo pipefail

verdict="$(
  grep -E '^VERDICT: (APPROVE|REQUEST_CHANGES|NEEDS_HUMAN)[[:space:]]*$' "${1:-/dev/null}" 2>/dev/null \
    | head -n 1 \
    | sed -E 's/^VERDICT: //; s/[[:space:]]+$//'
)"

echo "${verdict:-NEEDS_HUMAN}"
