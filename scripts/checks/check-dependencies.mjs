// Dependency supply-chain policy, checked offline (see docs/conventions/dependencies.md).
//   1. pnpm-workspace.yaml keeps pnpm's own protections on, and only the listed exceptions exist
//   2. package.json declares no dependency from git, a URL, a path, or an alias, and no "latest" or "*"
//   3. pnpm-lock.yaml resolves every package from the registry with an integrity hash
//   4. .github/CODEOWNERS lists every path from the protected and the human-approval lists
// Refuses to pass when the lockfile holds almost nothing.
import { existsSync, readFileSync } from 'node:fs';
import YAML from 'yaml';

const MIN_LOCKED = 50;
const MIN_RELEASE_AGE = 1440; // minutes; the file sets 10080 (7 days), this is the floor
// Reviewed exceptions. Changing this list is a person's decision, made in the same change as pnpm-workspace.yaml.
const ALLOWED = {
  trustPolicyExclude: ['vercel', '@vercel/*'], // see the comment in pnpm-workspace.yaml
  minimumReleaseAgeExclude: [],
};
const EXOTIC = /^(git\+|git:|github:|gitlab:|bitbucket:|gist:|https?:|file:|link:|portal:|npm:|\.{1,2}\/|\/|~\/|[\w.-]+\/[\w.-]+$)/;
const UNPINNED = /^(latest|next|\*|x|)$/i;

const problems = [];

// 1. pnpm settings
let ws = {};
if (existsSync('pnpm-workspace.yaml')) ws = YAML.parse(readFileSync('pnpm-workspace.yaml', 'utf8')) ?? {};
else problems.push('pnpm-workspace.yaml is missing: pnpm\'s supply-chain settings live there');
if (!(Number(ws.minimumReleaseAge) >= MIN_RELEASE_AGE)) {
  problems.push(`pnpm-workspace.yaml: minimumReleaseAge must be at least ${MIN_RELEASE_AGE} minutes (1 day), so a freshly published version is never installed at once; it is ${ws.minimumReleaseAge ?? 'not set'}`);
}
if (ws.blockExoticSubdeps !== true) problems.push('pnpm-workspace.yaml: blockExoticSubdeps must be true, so a transitive dependency cannot come from git or a tarball URL');
if (ws.trustPolicy !== 'no-downgrade') problems.push('pnpm-workspace.yaml: trustPolicy must be no-downgrade, so a package whose publisher evidence got weaker is refused');
for (const key of Object.keys(ALLOWED)) {
  for (const entry of ws[key] ?? []) {
    if (!ALLOWED[key].includes(entry)) problems.push(`pnpm-workspace.yaml: "${entry}" in ${key} is not a reviewed exception; add it to ALLOWED in scripts/checks/check-dependencies.mjs in the same change, with the reason`);
  }
}

for (const id of ws.auditConfig?.ignoreGhsas ?? []) {
  if (!/^GHSA(-[2-9cfghjmpqrvwx]{4}){3}$/.test(String(id))) problems.push(`pnpm-workspace.yaml: auditConfig.ignoreGhsas entry "${id}" is not an advisory id (GHSA-xxxx-xxxx-xxxx)`);
}

// 2. direct dependencies
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const specs = [];
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const [name, spec] of Object.entries(pkg[section] ?? {})) specs.push([`${section}.${name}`, String(spec)]);
}
for (const [name, spec] of Object.entries({ ...(pkg.overrides ?? {}), ...(pkg.pnpm?.overrides ?? {}) })) specs.push([`overrides.${name}`, String(spec)]);
for (const [where, spec] of specs) {
  if (EXOTIC.test(spec)) problems.push(`package.json: ${where} is "${spec}", which does not come from the registry by name and version: use a published version`);
  else if (UNPINNED.test(spec)) problems.push(`package.json: ${where} is "${spec}", which accepts any version: use a version range`);
}

// 3. the lockfile (pnpm 12 writes more than one YAML document)
let locked = 0;
if (existsSync('pnpm-lock.yaml')) {
  for (const doc of YAML.parseAllDocuments(readFileSync('pnpm-lock.yaml', 'utf8'))) {
    const packages = doc.toJS()?.packages ?? {};
    for (const [id, entry] of Object.entries(packages)) {
      locked += 1;
      const r = entry?.resolution ?? {};
      if (!r.integrity) problems.push(`pnpm-lock.yaml: ${id} has no integrity hash`);
      if (r.tarball || r.repo || r.commit || r.path || r.type) problems.push(`pnpm-lock.yaml: ${id} is resolved from outside the registry (${r.tarball ?? r.repo ?? r.path ?? r.type})`);
    }
  }
} else problems.push('pnpm-lock.yaml is missing');

// 4. CODEOWNERS is generated from the two path lists; if it drifts, a protected path loses its binding review
const listed = (file) => (existsSync(file) ? readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : []);
if (existsSync('.github/CODEOWNERS')) {
  const owned = new Set(readFileSync('.github/CODEOWNERS', 'utf8').split('\n').map((l) => l.trim().split(/\s+/)[0]));
  for (const list of ['harness/protected-paths.txt', 'harness/human-approval-paths.txt']) {
    for (const pattern of listed(list)) {
      if (!owned.has(pattern)) problems.push(`.github/CODEOWNERS: "${pattern}" from ${list} is missing; regenerate it (the command is in harness/protected-paths.txt)`);
    }
  }
} else problems.push('.github/CODEOWNERS is missing: generate it from the two path lists (the command is in harness/protected-paths.txt)');

if (locked < MIN_LOCKED) {
  console.error(`The lockfile lists ${locked} package(s): the dependency check would pass while checking almost nothing.`);
  process.exit(1);
}
if (problems.length > 0) {
  console.error('Dependency problems (see docs/conventions/dependencies.md):');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`dependencies ok (${specs.length} direct, ${locked} locked packages)`);
