#!/usr/bin/env bash
# Tests the pipeline's decision logic WITHOUT GitHub.
#
# The guard and gate scripts are extracted verbatim from
# .github/workflows/pr-pipeline.yml and run against stubbed inputs, under the
# same shell flags GitHub uses (`bash -eo pipefail`). Run it after any edit to
# that workflow or to harness/protected-paths.txt.
#
# Usage: pnpm test:pipeline      (needs python3 with PyYAML)
set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

ROOT="$ROOT" T="$T" python3 - <<'PY'
import os, pathlib, yaml
root, t = os.environ["ROOT"], os.environ["T"]
wf = yaml.safe_load(open(f"{root}/.github/workflows/pr-pipeline.yml"))
guard = next(s for s in wf["jobs"]["guard"]["steps"] if s.get("id") == "g")
decide = next(s for s in wf["jobs"]["gate"]["steps"] if s.get("id") == "d")
pathlib.Path(f"{t}/guard.sh").write_text(guard["run"])
pathlib.Path(f"{t}/decide.sh").write_text(decide["run"])
PY

# Fixture: the guard reads the protected list and package.json from "base" and "head" checkouts.
mkdir -p "$T/bin" "$T/work/base" "$T/work/head"
cp -r "$ROOT/harness" "$T/work/base/harness"
echo '{"scripts":{"verify:fast":"tsc && eslint ."},"dependencies":{"a":"1"}}' > "$T/work/base/package.json"
cat > "$T/bin/gh" <<'EOF'
#!/usr/bin/env bash
# Stub for: gh pr diff <n> --name-only
if [ "${GH_FAIL:-0}" = 1 ]; then echo "gh: network error" >&2; exit 1; fi
printf '%s\n' "$FILES"
EOF
chmod +x "$T/bin/gh"
export PATH="$T/bin:$PATH"
cd "$T/work" || exit 1

PASS=0
FAILN=0
ok()  { printf 'PASS  %s\n' "$1"; PASS=$((PASS + 1)); }
bad() { printf 'FAIL  %s  (%s)\n' "$1" "$2"; FAILN=$((FAILN + 1)); }

env_base() {
  export HEAD_REF=agent/issue-7 DRAFT=false SAME_REPO=true KILL=true LABELS=ready \
         PR=1 GH_REPO=x/y GH_TOKEN=t GH_FAIL=0
  export FILES='src/contexts/a/domain/x.aggregate.ts' # refs:ignore (a fixture, not a real file)
  cp base/package.json head/package.json
}

guard() { # name, expected run, expected reason fragment ("" = any)
  : > "$T/out"
  GITHUB_OUTPUT="$T/out" bash --noprofile --norc -eo pipefail "$T/guard.sh" >/dev/null 2>&1
  local code=$? run reason
  run="$(grep '^run=' "$T/out" | cut -d= -f2)"
  reason="$(grep '^reason=' "$T/out" | cut -d= -f2-)"
  if [ "$code" -eq 0 ] && [ "$run" = "$2" ] && { [ -z "$3" ] || printf '%s' "$reason" | grep -q "$3"; }; then
    ok "$1"
  else
    bad "$1" "exit=$code run=$run reason=$reason"
  fi
}

decide() { # name, expected state
  : > "$T/out"
  GITHUB_OUTPUT="$T/out" bash --noprofile --norc -eo pipefail "$T/decide.sh" >/dev/null 2>&1
  local state
  state="$(grep '^state=' "$T/out" | cut -d= -f2)"
  if [ "$state" = "$2" ]; then ok "$1 -> $2"; else bad "$1" "got state=$state, want $2"; fi
}

dec_env() {
  export R_GUARD=success IS_AGENT=true RUN=true REASON='' \
         R_STYLE=success R_ARCH=success R_QA=success R_E2E=success
}

echo "== guard =="
env_base;                                     guard "agent PR with ordinary files runs the gates" true ""
env_base; HEAD_REF=feature/docs;              guard "human branch is not an agent PR"             false "not an agent"
env_base; SAME_REPO=false;                    guard "fork PR is refused"                          false "fork"
env_base; KILL=false;                         guard "kill switch stops the gates"                 false "kill switch"
env_base; DRAFT=true;                         guard "draft PR is skipped"                         false "draft"
env_base; LABELS="ready,needs-human";         guard "needs-human label stops the gates"           false "needs-human"
for path in AGENTS.md harness/roles/qa-gate.md harness/protected-paths.txt docs/conventions/errors.md \
            .github/workflows/deploy.yml .github/actions/setup/action.yml .dependency-cruiser.cjs \
            eslint.config.mjs tsconfig.json vitest.config.ts playwright.config.ts \
            pnpm-workspace.yaml scripts/checks/check-names.mjs; do
  env_base; FILES="src/a.ts"$'\n'"$path";     guard "protected path is blocked: $path"           false "protected paths"  # refs:ignore
done
env_base; echo '{"scripts":{"verify:fast":"tsc"},"dependencies":{"a":"1"}}' > head/package.json
                                              guard "weakened package.json script is blocked"     false "package.json scripts"
env_base; echo '{"scripts":{"verify:fast":"tsc && eslint ."},"dependencies":{"a":"1","b":"2"}}' > head/package.json
                                              guard "adding a dependency is allowed"              true ""

echo
echo "== guard fails CLOSED when gh errors =="
env_base; export GH_FAIL=1
: > "$T/out"
GITHUB_OUTPUT="$T/out" bash --noprofile --norc -eo pipefail "$T/guard.sh" >/dev/null 2>&1
code=$?
if [ "$code" -ne 0 ] && ! grep -q '^run=true' "$T/out"; then
  ok "gh error makes the step fail (exit $code) and never reports run=true"
else
  bad "gh error" "exit=$code out=$(cat "$T/out")"
fi

echo
echo "== gate decision =="
dec_env;                                              decide "all gates succeeded"                       green
dec_env; R_ARCH=failure R_QA=skipped R_E2E=skipped;   decide "architecture review failed"                red
dec_env; R_STYLE=failure R_ARCH=skipped R_QA=skipped R_E2E=skipped; decide "style gate failed"           red
dec_env; R_E2E=failure;                               decide "e2e failed"                                red
dec_env; R_GUARD=failure IS_AGENT='' RUN='';              decide "guard job failed (not mistaken for a human PR)" blocked
dec_env; IS_AGENT=false RUN=false REASON="not an agent branch";   decide "human PR"                      skip
dec_env; RUN=false REASON=draft;                      decide "draft agent PR"                            skip
dec_env; RUN=false REASON="kill switch is on";        decide "kill switch"                               blocked
dec_env; RUN=false REASON="touches protected paths";  decide "protected path"                            blocked
dec_env; RUN=false REASON="labeled needs-human";      decide "needs-human label"                         blocked

echo
echo "Result: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
