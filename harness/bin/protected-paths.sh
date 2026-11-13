#!/usr/bin/env bash
# Work with harness/protected-paths.txt, the single list of protected paths.
#
# Usage:
#   bash harness/bin/protected-paths.sh match <list-file>  < files    # prints the files that match
#   bash harness/bin/protected-paths.sh codeowners <list-file> <owner>  # prints CODEOWNERS lines
#
# List syntax (subset of CODEOWNERS), one pattern per line, '#' starts a comment:
#   /dir/         everything under dir
#   /file.ext     exactly that file
#   /name*.ext    '*' matches anything except '/'
set -euo pipefail

mode="${1:?usage: protected-paths.sh match|codeowners <list-file> [owner]}"
list="${2:?list file}"

patterns() { grep -vE '^[[:space:]]*(#|$)' "$list" || true; }

# CODEOWNERS-style pattern -> anchored extended regex.
to_regex() {
  local re
  re="$(printf '%s' "${1#/}" | sed -E 's|[.]|\\.|g; s|\*|[^/]*|g')"
  case "$1" in
    */) printf '^%s' "$re" ;;
    *)  printf '^%s$' "$re" ;;
  esac
}

case "$mode" in
  match)
    regexes=()
    while IFS= read -r p; do
      regexes+=("$(to_regex "$p")")
    done < <(patterns)
    # Fail closed: an empty list would protect nothing.
    [ "${#regexes[@]}" -gt 0 ] || { echo "no patterns in $list" >&2; exit 2; }
    combined="$(IFS='|'; echo "${regexes[*]}")"
    grep -E "$combined" || true
    ;;
  codeowners)
    owner="${3:?owner, e.g. @your-username}"
    echo "# Generated from harness/protected-paths.txt. Do not edit by hand."
    while IFS= read -r p; do
      printf '%-34s %s\n' "$p" "$owner"
    done < <(patterns)
    ;;
  *)
    echo "unknown mode: $mode" >&2
    exit 2
    ;;
esac
