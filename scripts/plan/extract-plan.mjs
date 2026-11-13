// Pulls the plan out of the planner's answer: the last ```json block that holds an object with a "tasks" array.
// Usage: node scripts/plan/extract-plan.mjs <planner-output-file>   (prints the plan as JSON)
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/plan/extract-plan.mjs <planner output file>');
  process.exit(2);
}
const text = readFileSync(file, 'utf8');
const candidates = [...text.matchAll(/```json[^\S\n]*\n([\s\S]*?)```/g)].map((m) => m[1]).reverse();
candidates.push(text);

let plan = null;
for (const candidate of candidates) {
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && Array.isArray(parsed.tasks)) {
      plan = parsed;
      break;
    }
  } catch {
    // not JSON: try the next candidate
  }
}
if (!plan) {
  console.error('No plan found. The planner must answer with one JSON object in a ```json block.');
  process.exit(1);
}
process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
