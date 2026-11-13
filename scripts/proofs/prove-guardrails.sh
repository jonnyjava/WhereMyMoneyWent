#!/usr/bin/env bash
# Proves that every guardrail bites.
#
# For each case, a deliberate violation is applied to a scratch copy of the
# repo and the relevant check must FAIL with the expected message. Controls
# must still PASS, so a check that fails for every input is caught too.
# Run it after any change to lint, architecture, naming or migration tooling,
# and after upgrading TypeScript, ESLint or dependency-cruiser.
#
# Usage: pnpm prove:guardrails
set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"
REPO="$WORK/repo"
trap 'rm -rf "$WORK"' EXIT

export DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/where_my_money_went}"
PASS=0
FAIL=0

prepare_copy() {
  rm -rf "$REPO"
  mkdir -p "$REPO"
  (cd "$ROOT" && tar --exclude=node_modules --exclude=.next --exclude=.git \
    --exclude=test-results --exclude=playwright-report --exclude='*.tsbuildinfo' -cf - .) |
    tar -xf - -C "$REPO"
  ln -s "$ROOT/node_modules" "$REPO/node_modules"
}

# expect_fail <name> <command> <regex the output must match> <mutation function>
expect_fail() {
  local name="$1" cmd="$2" pattern="$3" mutate="$4" out code
  prepare_copy
  (cd "$REPO" && "$mutate")
  out="$(cd "$REPO" && eval "$cmd" 2>&1)"
  code=$?
  if [ "$code" -ne 0 ] && printf '%s' "$out" | grep -Eq "$pattern"; then
    printf 'PASS  %-52s caught by: %s\n' "$name" "$pattern"
    PASS=$((PASS + 1))
  else
    printf 'FAIL  %-52s (exit %s, expected a failure matching: %s)\n' "$name" "$code" "$pattern"
    printf '%s\n' "$out" | tail -8 | sed 's/^/        /'
    FAIL=$((FAIL + 1))
  fi
}

# expect_ok <name> <command> <mutation function>   (a control: must still pass)
expect_ok() {
  local name="$1" cmd="$2" mutate="$3" out code
  prepare_copy
  (cd "$REPO" && "$mutate")
  out="$(cd "$REPO" && eval "$cmd" 2>&1)"
  code=$?
  if [ "$code" -eq 0 ]; then
    printf 'PASS  %-52s (control: still passes)\n' "$name"
    PASS=$((PASS + 1))
  else
    printf 'FAIL  %-52s (control failed, exit %s)\n' "$name" "$code"
    printf '%s\n' "$out" | tail -8 | sed 's/^/        /'
    FAIL=$((FAIL + 1))
  fi
}

LEND=src/contexts/reference-lending
STATS=src/contexts/reference-stats

none() { :; }
m_renamed_doc()            { mv docs/conventions/errors.md docs/conventions/err.md; }  # refs:ignore (a violation created on the fly)
m_stale_workflow_ref()     { sed -i 's|harness/bin/protected-paths.sh|harness/bin/gone.sh|' .github/workflows/pr-pipeline.yml; }  # refs:ignore (a violation created on the fly)
m_stale_local_action()     { sed -i 's|./.github/actions/setup|./.github/actions/setup2|' .github/workflows/ci.yml; }  # refs:ignore (a violation created on the fly)
m_refs_check_blind()       { sed -i 's|^const SCANNED = .*|const SCANNED = /\\.nomatch$/;|' scripts/checks/check-references.mjs; }  # refs:ignore (simulates a scan that finds nothing)
m_domain_imports_infra()   { printf "\nimport '../infrastructure/loan.mapper';\n" >> $LEND/domain/loan.aggregate.ts; }  # refs:ignore (a violation created on the fly)
m_domain_imports_library() { printf "\nimport 'drizzle-orm';\n" >> $LEND/domain/loan.aggregate.ts; }  # refs:ignore (a violation created on the fly)
m_app_imports_infra()      { printf "\nimport '../../../infrastructure/loan.model';\n" >> $LEND/application/commands/open-loan/open-loan.handler.ts; }  # refs:ignore (a violation created on the fly)
m_cross_context_deep()     { printf "\nimport '@/contexts/reference-lending/domain/loan.aggregate';\n" >> $STATS/application/commands/record-return/record-return.handler.ts; }  # refs:ignore (a violation created on the fly)
m_delivery_imports_domain(){ printf "\nimport '@/contexts/reference-lending/domain/loan.aggregate';\n" >> src/app/api/reference/stats/route.ts; }  # refs:ignore (a violation created on the fly)
m_prod_imports_fake()      { printf "\nimport '@/contexts/reference-lending/testing/in-memory-loan.repository';\n" >> src/composition/create-container.ts; }  # refs:ignore (a violation created on the fly)
m_orm_in_delivery()        { printf "\nimport 'drizzle-orm';\n" >> src/app/api/health/route.ts; }  # refs:ignore (a violation created on the fly)
m_shared_imports_context() { printf "\nimport '@/contexts/reference-lending';\n" >> src/shared/result.ts; }  # refs:ignore (a violation created on the fly)
# Simulates the unsupported-TypeScript failure: the tool runs but examines nothing.
m_arch_vacuous()           { sed -i "s|options: {|options: { exclude: { path: '^src/contexts' },|" .dependency-cruiser.cjs; }  # refs:ignore (a violation created on the fly)
m_product_imports_reference() { mkdir -p src/contexts/billing; printf "import '@/contexts/reference-lending';\nexport {};\n" > src/contexts/billing/index.ts; }  # refs:ignore (a violation created on the fly)
m_ui_raw_color()           { printf '%s\n' 'export const A = () => <p className="text-red-500">x</p>;' > src/app/bad-color.tsx; }  # refs:ignore (a violation created on the fly)
m_ui_arbitrary_value()     { printf '%s\n' 'export const A = () => <p className="w-[13px]">x</p>;' > src/ui/bad-value.tsx; }  # refs:ignore (a violation created on the fly)
m_ui_inline_style()        { printf '%s\n' 'export const A = () => <p style={{ margin: 0 }}>x</p>;' > src/app/bad-style.tsx; }  # refs:ignore (a violation created on the fly)
m_ui_dangerous_html()      { printf '%s\n' 'export const A = () => <p dangerouslySetInnerHTML={{ __html: "x" }} />;' > src/app/bad-html.tsx; }  # refs:ignore (a violation created on the fly)
m_ui_use_client_misnamed() { printf '%s\n' "'use client';" 'export const A = () => <p>x</p>;' > src/app/not-client.tsx; }  # refs:ignore (a violation created on the fly)
m_ui_client_no_directive() { printf '%s\n' 'export const A = () => <p>x</p>;' > src/app/missing.client.tsx; }  # refs:ignore (a violation created on the fly)
m_ui_use_server_misnamed() { printf '%s\n' "'use server';" 'export async function a() { return 1; }' > src/app/server-stuff.ts; }  # refs:ignore (a violation created on the fly)
m_ui_kit_imports_context() { printf '%s\n' "import type { LoanDto } from '@/contexts/reference-lending';" 'export type A = LoanDto;' > src/ui/leaky.tsx; }  # refs:ignore (a violation created on the fly)
m_ui_kit_uses_test_lib()   { printf '%s\n' "import { render } from '@testing-library/react';" 'export const A = render;' > src/ui/bad-test-lib.tsx; }  # refs:ignore (a violation created on the fly)
m_client_imports_backend() { printf '%s\n' "'use client';" "import { getContainer } from '@/composition/container';" 'export const A = getContainer;' > src/app/bad.client.tsx; }  # refs:ignore (a violation created on the fly)
m_client_value_import()    { printf '%s\n' "'use client';" "import { LoanReturned } from '@/contexts/reference-lending';" 'export const A = LoanReturned;' > src/app/value.client.tsx; }  # refs:ignore (a violation created on the fly)
m_client_type_import()     { printf '%s\n' "'use client';" "import type { LoanDto } from '@/contexts/reference-lending';" 'export type A = LoanDto;' > src/app/type.client.tsx; }  # refs:ignore (a violation created on the fly)
m_backend_imports_ui()     { printf "\nimport '@/ui/button';\n" >> src/shared/result.ts; }  # refs:ignore (a violation created on the fly)
m_ui_img_without_alt()     { printf '%s\n' 'export const A = () => <img src="/x.png" />;' > src/app/bad-img.tsx; }  # refs:ignore (a violation created on the fly)
m_ui_clickable_div()       { printf '%s\n' 'export const A = () => <div onClick={() => undefined}>x</div>;' > src/app/bad-click.tsx; }  # refs:ignore (a violation created on the fly)
m_ui_not_kebab()           { printf '%s\n' 'export const A = () => <p>x</p>;' > src/ui/MyThing.tsx; }  # refs:ignore (a violation created on the fly)
m_ui_check_blind()         { sed -i "s|^const ROOTS = .*|const ROOTS = ['nowhere'];|" scripts/checks/check-ui.mjs; }  # refs:ignore (a violation created on the fly)
m_circular()               { printf "import './pong';\nexport const ping = 1;\n" > src/shared/ping.ts; printf "import './ping';\nexport const pong = 2;\n" > src/shared/pong.ts; }  # refs:ignore (a violation created on the fly)
m_eslint_disable()         { printf "\n// eslint-disable-next-line no-console\nconsole.log('x');\n" >> src/shared/clock.ts; }  # refs:ignore (a violation created on the fly)
m_ts_ignore()              { printf "\n// @ts-ignore\nexport const a: number = 'x';\n" >> src/shared/clock.ts; }  # refs:ignore (a violation created on the fly)
m_any()                    { printf "\nexport const anything = (x: any) => x;\n" >> src/shared/clock.ts; }  # refs:ignore (a violation created on the fly)
m_it_skip()                { printf "import { it } from 'vitest';\nit.skip('x', () => {});\n" > src/shared/skipped.test.ts; }  # refs:ignore (a violation created on the fly)
m_it_only()                { printf "import { it } from 'vitest';\nit.only('x', () => {});\n" > src/shared/focused.test.ts; }  # refs:ignore (a violation created on the fly)
m_no_suffix()              { printf "export const x = 1;\n" > $LEND/domain/helpers.ts; }  # refs:ignore (a violation created on the fly)
m_not_kebab()              { printf "export const x = 1;\n" > $LEND/domain/OrderThing.aggregate.ts; }  # refs:ignore (a violation created on the fly)
m_wrong_layer_suffix()     { printf "export const x = 1;\n" > $LEND/domain/foo.handler.ts; }  # refs:ignore (a violation created on the fly)
m_type_error()             { printf "\nexport const wrong: number = 'text';\n" >> src/shared/clock.ts; }  # refs:ignore (a violation created on the fly)
m_drop_column()            { printf 'ALTER TABLE "reference"."loans" DROP COLUMN "book_id";\n' > drizzle/20300101000000_bad.sql; }  # refs:ignore (a violation created on the fly)
m_not_null_no_default()    { printf 'ALTER TABLE "reference"."loans" ADD COLUMN "owner" text NOT NULL;\n' > drizzle/20300101000000_bad.sql; }  # refs:ignore (a violation created on the fly)
m_rename_column()          { printf 'ALTER TABLE "reference"."loans" RENAME COLUMN "book_id" TO "isbn";\n' > drizzle/20300101000000_bad.sql; }  # refs:ignore (a violation created on the fly)
m_additive_nullable()      { printf 'ALTER TABLE "reference"."loans" ADD COLUMN "note" text;\n' > drizzle/20300101000000_ok.sql; }  # refs:ignore (a violation created on the fly)
m_additive_with_default()  { printf 'ALTER TABLE "reference"."loans" ADD COLUMN "kind" text DEFAULT %s NOT NULL;\n' "'book'" > drizzle/20300101000000_ok.sql; }  # refs:ignore (a violation created on the fly)

echo "== Controls: the untouched repo must pass every check =="
expect_ok "typecheck on the clean repo"              "pnpm -s typecheck"                    none
expect_ok "lint on the clean repo"                   "pnpm -s lint"                         none
expect_ok "architecture on the clean repo"           "pnpm -s arch"                         none
expect_ok "migration check on the clean repo"        "node scripts/checks/check-migrations.mjs --all" none
expect_ok "reference check on the clean repo"        "node scripts/checks/check-references.mjs" none
expect_ok "ui check on the clean repo"               "pnpm -s check:ui" none

echo
echo "== Architecture rules (dependency-cruiser) =="
expect_fail "domain imports infrastructure"          "pnpm -s arch" "domain-is-pure"                              m_domain_imports_infra
expect_fail "domain imports a library"               "pnpm -s arch" "domain-is-pure"                              m_domain_imports_library
expect_fail "application imports infrastructure"     "pnpm -s arch" "application-depends-on-domain-only|only-composition-imports-infrastructure" m_app_imports_infra
expect_fail "context deep-imports another context"   "pnpm -s arch" "contexts-use-each-others-public-api-only"    m_cross_context_deep
expect_fail "delivery layer imports a domain class"  "pnpm -s arch" "delivery-uses-public-api-only"               m_delivery_imports_domain
expect_fail "production code imports a test fake"    "pnpm -s arch" "production-never-imports-testing"            m_prod_imports_fake
expect_fail "ORM imported outside infrastructure"    "pnpm -s arch" "orm-only-in-infrastructure-and-composition"  m_orm_in_delivery
expect_fail "shared kernel imports a context"        "pnpm -s arch" "shared-kernel-is-independent"                m_shared_imports_context
expect_fail "product context imports a reference one" "pnpm -s arch" "product-contexts-do-not-depend-on-reference-contexts" m_product_imports_reference
expect_fail "circular dependency"                    "pnpm -s arch" "no-circular"                                 m_circular
expect_fail "architecture check examining nothing"     "pnpm -s arch" "while checking nothing"                      m_arch_vacuous

echo
echo "== Lint rules: no way to silence a check =="
expect_fail "eslint-disable comment"                 "pnpm -s lint" "eslint-comments/no-use"                      m_eslint_disable
expect_fail "@ts-ignore comment"                     "pnpm -s lint" "ban-ts-comment"                              m_ts_ignore
expect_fail "explicit any"                           "pnpm -s lint" "no-explicit-any"                             m_any
expect_fail "skipped test (it.skip)"                 "pnpm -s lint" "Do not skip, focus or stub tests"            m_it_skip
expect_fail "focused test (it.only)"                 "pnpm -s lint" "Do not skip, focus or stub tests"            m_it_only

echo
echo "== Naming rules =="
expect_fail "file without a role suffix"             "node scripts/checks/check-names.mjs" "needs a role suffix"         m_no_suffix
expect_fail "file name not kebab-case"               "node scripts/checks/check-names.mjs" "must be kebab-case"          m_not_kebab
expect_fail "suffix not allowed in this layer"       "node scripts/checks/check-names.mjs" "is not allowed in domain"    m_wrong_layer_suffix

echo
echo "== Reference check: a moved file cannot break paths silently =="
expect_fail "renamed convention doc"                 "node scripts/checks/check-references.mjs" "does not exist"  m_renamed_doc
expect_fail "workflow points at a missing script"    "node scripts/checks/check-references.mjs" "does not exist"  m_stale_workflow_ref
expect_fail "workflow points at a missing local action" "node scripts/checks/check-references.mjs" "does not exist" m_stale_local_action
expect_fail "reference check examining nothing"      "node scripts/checks/check-references.mjs" "checking almost nothing" m_refs_check_blind

echo
echo "== UI rules: tokens, accessibility, client and server code =="
expect_fail "raw Tailwind color in a page"           "pnpm -s check:ui" "raw Tailwind color"                       m_ui_raw_color
expect_fail "arbitrary Tailwind value in the kit"    "pnpm -s check:ui" "arbitrary Tailwind value"                m_ui_arbitrary_value
expect_fail "inline style"                           "pnpm -s check:ui" "inline style"                            m_ui_inline_style
expect_fail "dangerouslySetInnerHTML"                "pnpm -s check:ui" "dangerouslySetInnerHTML is not allowed"  m_ui_dangerous_html
expect_fail "use client in a file not named .client" "pnpm -s check:ui" "has \"use client\" but is not named"      m_ui_use_client_misnamed
expect_fail ".client file without use client"        "pnpm -s check:ui" "must start with the \"use client\""     m_ui_client_no_directive
expect_fail "use server outside actions.ts"          "pnpm -s check:ui" "belongs only in a file named actions.ts" m_ui_use_server_misnamed
expect_fail "UI check examining nothing"             "pnpm -s check:ui" "while checking nothing"                  m_ui_check_blind
expect_fail "UI kit imports a context"               "pnpm -s arch" "ui-kit-is-presentational"                    m_ui_kit_imports_context
expect_fail "test library in UI production code"     "pnpm -s arch" "no-test-libraries-in-production"             m_ui_kit_uses_test_lib
expect_fail "client island imports the composition root" "pnpm -s arch" "client-islands-do-not-reach-the-backend"  m_client_imports_backend
expect_fail "client island value-imports a context"  "pnpm -s arch" "client-islands-import-contexts-as-types-only" m_client_value_import
expect_ok   "client island may import a context's types" "pnpm -s arch"                                            m_client_type_import
expect_fail "backend imports the UI kit"             "pnpm -s arch" "backend-never-imports-ui"                    m_backend_imports_ui
expect_fail "image without alt text"                 "pnpm -s lint" "alt-text"                                    m_ui_img_without_alt
expect_fail "clickable div (not keyboard accessible)" "pnpm -s lint" "click-events-have-key-events|no-static-element-interactions" m_ui_clickable_div
expect_fail "UI file not kebab-case"                 "node scripts/checks/check-names.mjs" "must be kebab-case"   m_ui_not_kebab

echo
echo "== Typecheck =="
expect_fail "type error"                             "pnpm -s typecheck" "error TS"                               m_type_error

echo
echo "== Migration safety (escalates to a human) =="
expect_fail "DROP COLUMN"                            "node scripts/checks/check-migrations.mjs --all" "NEEDS_HUMAN"      m_drop_column
expect_fail "ADD COLUMN NOT NULL without default"    "node scripts/checks/check-migrations.mjs --all" "NEEDS_HUMAN"      m_not_null_no_default
expect_fail "RENAME COLUMN"                          "node scripts/checks/check-migrations.mjs --all" "NEEDS_HUMAN"      m_rename_column
expect_ok   "additive nullable column is allowed"    "node scripts/checks/check-migrations.mjs --all"                    m_additive_nullable
expect_ok   "additive NOT NULL with default is allowed" "node scripts/checks/check-migrations.mjs --all"                 m_additive_with_default

echo
echo "== Integration tests fail loudly without a database (never skip) =="
expect_fail "database unreachable"                   "DATABASE_URL=postgres://postgres:postgres@localhost:1/none pnpm -s exec vitest run src/contexts/reference-stats/infrastructure" "ECONNREFUSED|connect" none

echo
echo "Result: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
