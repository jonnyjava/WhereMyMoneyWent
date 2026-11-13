// Looks for secrets that were committed by mistake: private keys, cloud and API tokens, database URLs with
// credentials, and env files. It prints WHERE a secret is and what kind, never the secret itself.
// Put "secrets:ignore" on a line to skip it (for a documented fake). Refuses to pass when it scans almost nothing.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MIN_FILES = 20;
const MAX_BYTES = 1_000_000;
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.vercel', '.pnpm-store', 'coverage', 'test-results', 'playwright-report', 'drizzle/meta']);
const SKIP_FILES = new Set(['pnpm-lock.yaml']);

const RULES = [
  ['a private key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/],
  ['an AWS access key id', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['a GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/],
  ['an Anthropic API key', /\bsk-ant-[A-Za-z0-9_-]{20,}\b/],
  ['an OpenAI API key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/],
  ['a Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['a Stripe live key', /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/],
  ['a Neon API key', /\bnapi_[a-z0-9]{40,}\b/],
];
const DB_URL = /postgres(?:ql)?:\/\/[^\s:@/'"]+:[^\s@/'"]+@([^\s/:'"]+)/g;
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$|(^|\.)(example|invalid|test|local|localhost)$|^host$|^hostname$|^db$|^postgres$/;

function trackedFiles() {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return out.split('\0').filter((f) => f && existsSync(f));
  } catch {
    const out = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const p = dir === '.' ? name : join(dir, name);
        if (SKIP_DIRS.has(name) || SKIP_DIRS.has(p)) continue;
        if (statSync(p).isDirectory()) walk(p);
        else out.push(p);
      }
    };
    walk('.');
    // Outside git, mirror .gitignore for env files so a developer's own .env.local is not reported.
    return out.filter((f) => !/(^|\/)\.env(\.[^/]*\.local|\.local)?$/.test(f) || /\.env\.example$/.test(f));
  }
}

const mask = (s) => `${s.slice(0, 4)}… (${s.length} characters)`;
const files = trackedFiles().filter((f) => !SKIP_FILES.has(f.split('/').pop()) && ![...SKIP_DIRS].some((d) => f.startsWith(`${d}/`)));
const problems = [];
let scanned = 0;
for (const file of files) {
  const base = file.split('/').pop();
  if (/^\.env(\..+)?$/.test(base) && base !== '.env.example') {
    problems.push(`${file}: an env file must never be committed; keep secrets in the host's settings and a template in .env.example`);
    continue;
  }
  let buf;
  try {
    if (statSync(file).size > MAX_BYTES) continue;
    buf = readFileSync(file);
  } catch {
    continue;
  }
  if (buf.subarray(0, 8000).includes(0)) continue; // binary
  scanned += 1;
  buf.toString('utf8').split('\n').forEach((line, i) => {
    if (line.includes('secrets:ignore')) return;
    for (const [kind, re] of RULES) {
      const m = re.exec(line);
      if (m) problems.push(`${file}:${i + 1}: looks like ${kind} (${mask(m[0])})`);
    }
    for (const m of line.matchAll(DB_URL)) {
      if (!LOCAL_HOST.test(m[1])) problems.push(`${file}:${i + 1}: looks like a database URL with credentials for ${m[1]}`);
    }
  });
}

if (scanned < MIN_FILES) {
  console.error(`Scanned ${scanned} file(s): the secret check would pass while checking almost nothing.`);
  process.exit(1);
}
if (problems.length > 0) {
  console.error('Possible secrets (rotate anything real; it stays in git history):');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`secrets ok (${scanned} files scanned)`);
