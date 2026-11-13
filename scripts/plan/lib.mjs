// Shared code for the planning layer: parse a feature file (Markdown or JSON),
// validate features and plans, and order tasks by dependency.
// Everything here is pure (no network, no GitHub) so it can be tested directly.
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const readSchema = (name) => JSON.parse(readFileSync(new URL(`../../harness/schemas/${name}`, import.meta.url), 'utf8'));
const Ajv = Ajv2020.default ?? Ajv2020;
const ajv = new Ajv({ allErrors: true, strict: true });
const featureSchema = ajv.compile(readSchema('feature-spec.schema.json'));
const planSchema = ajv.compile(readSchema('plan.schema.json'));

function schemaErrors(validate, label) {
  return (validate.errors ?? []).map((e) => {
    const extra = e.params && e.params.additionalProperty ? ` (${e.params.additionalProperty})` : '';
    return `${label}${e.instancePath || ''}: ${e.message}${extra}`;
  });
}

/** Orders items so dependencies come first and independent items keep their given order. */
export function topoOrder(items, idOf, depsOf) {
  const byId = new Map(items.map((item) => [idOf(item), item]));
  const state = new Map(); // 1 = visiting, 2 = done
  const order = [];
  const stack = [];
  function visit(id) {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      const cycle = stack.slice(stack.indexOf(id)).concat(id);
      throw new Error(`dependency cycle: ${cycle.join(' -> ')}`);
    }
    state.set(id, 1);
    stack.push(id);
    for (const dep of depsOf(byId.get(id))) if (byId.has(dep)) visit(dep);
    stack.pop();
    state.set(id, 2);
    order.push(byId.get(id));
  }
  for (const item of items) visit(idOf(item));
  return order;
}

// ---------------------------------------------------------------- feature files

/** Parses the Markdown feature format. Returns { model, errors }. */
export function parseFeaturesMarkdown(text) {
  const errors = [];
  const model = { project: '', summary: '', constraints: [], features: [] };
  const summary = [];
  let section = 'head';
  let feature = null;
  let list = null; // the list field being filled: criteria | out_of_scope
  let inNotes = false;
  const FIELD = /^(Goal|Priority|Depends on|Context|Criteria|Out of scope|Notes):\s*(.*)$/i;

  text.split(/\r?\n/).forEach((raw, index) => {
    const n = index + 1;
    const line = raw.trimEnd();
    let m = /^#\s+(?:Project:\s*)?(.+)$/.exec(line);
    if (m) {
      if (model.project) errors.push(`line ${n}: a second top-level heading; only the project name uses "# "`);
      else model.project = m[1].trim();
      section = 'head';
      return;
    }
    m = /^##\s+(F-\d{3})\s+(.+)$/.exec(line);
    if (m) {
      feature = { id: m[1], title: m[2].trim() };
      model.features.push(feature);
      section = 'feature';
      list = null;
      inNotes = false;
      return;
    }
    if (/^##\s+Constraints\s*$/i.test(line)) {
      section = 'constraints';
      feature = null;
      return;
    }
    if (/^##\s+/.test(line)) {
      errors.push(`line ${n}: unexpected heading "${line}"; a feature heading looks like "## F-001 Title"`);
      section = 'other';
      feature = null;
      return;
    }
    if (section === 'head') {
      if (line.trim()) summary.push(line.trim());
      return;
    }
    if (section === 'constraints') {
      m = /^[-*]\s+(.+)$/.exec(line);
      if (m) model.constraints.push(m[1].trim());
      else if (line.trim()) errors.push(`line ${n}: constraints must be bullet points`);
      return;
    }
    if (section !== 'feature' || !line.trim()) return;

    m = FIELD.exec(line);
    if (m) {
      const key = m[1].toLowerCase();
      const value = m[2].trim();
      list = null;
      inNotes = false;
      if (key === 'goal') feature.goal = value;
      else if (key === 'priority') feature.priority = value.toLowerCase();
      else if (key === 'context') feature.context = value;
      else if (key === 'depends on') feature.depends_on = value ? value.split(/\s*,\s*/) : [];
      else if (key === 'notes') {
        feature.notes = value;
        inNotes = true;
      } else {
        const field = key === 'criteria' ? 'criteria' : 'out_of_scope';
        feature[field] = [];
        list = field;
        if (value) errors.push(`line ${n}: put each item of "${m[1]}" on its own "- " bullet line`);
      }
      return;
    }
    m = /^[-*]\s+(.+)$/.exec(line);
    if (m && list) {
      feature[list].push(m[1].trim());
      return;
    }
    if (inNotes) {
      feature.notes = `${feature.notes} ${line.trim()}`.trim();
      return;
    }
    errors.push(`line ${n}: cannot read "${line.trim().slice(0, 60)}" under ${feature.id}; use a field such as "Goal:" or a "- " bullet`);
  });

  if (!model.project) errors.push('missing the project name: start the file with "# <project name>"');
  model.summary = summary.join(' ');
  if (!model.summary) delete model.summary;
  if (model.constraints.length === 0) delete model.constraints;
  return { model, errors };
}

/** Semantic checks on a parsed feature file. Returns a list of errors. */
export function validateFeatureSpec(model) {
  featureSchema(model); // run the validator first: it records its errors on itself
  const errors = schemaErrors(featureSchema, 'features');
  if (errors.length > 0) return errors;
  const ids = new Set();
  for (const f of model.features) {
    if (ids.has(f.id)) errors.push(`${f.id}: duplicate feature id`);
    ids.add(f.id);
  }
  for (const f of model.features) {
    for (const dep of f.depends_on ?? []) {
      if (dep === f.id) errors.push(`${f.id}: depends on itself`);
      else if (!ids.has(dep)) errors.push(`${f.id}: depends on ${dep}, which is not in the file`);
    }
  }
  if (errors.length === 0) {
    try {
      topoOrder(model.features, (f) => f.id, (f) => f.depends_on ?? []);
    } catch (e) {
      errors.push(`features: ${e.message}`);
    }
  }
  return errors;
}

/** Reads a feature file (.md or .json). Returns { model, errors }. */
export function readFeatureFile(path) {
  const text = readFileSync(path, 'utf8');
  let parsed;
  if (path.endsWith('.json')) {
    try {
      parsed = { model: JSON.parse(text), errors: [] };
    } catch (e) {
      return { model: null, errors: [`${path}: not valid JSON (${e.message})`] };
    }
  } else if (path.endsWith('.md')) {
    parsed = parseFeaturesMarkdown(text);
  } else {
    return { model: null, errors: [`${path}: use a .md or .json feature file`] };
  }
  const errors = [...parsed.errors, ...(parsed.errors.length === 0 ? validateFeatureSpec(parsed.model) : [])];
  return { model: parsed.model, errors };
}

// ---------------------------------------------------------------- plans

const VAGUE = [
  [/\bwork(s|ing)?\s+(well|correctly|properly|as expected|fine)\b/i, 'says it "works" instead of what can be observed'],
  [/\b(properly|appropriately|correctly|adequately)\b/i, 'uses an unmeasurable adverb; state the observable result'],
  [/\b(user[- ]friendly|intuitive|seamless(ly)?|robust|elegant|easy to use|easily)\b/i, 'is a quality claim, not a behavior'],
  [/\b(etc\.?|and so on|and more|and similar)\b/i, 'is open-ended; list exactly what is covered'],
  [/\bas (needed|appropriate|necessary|required)\b/i, 'defers the decision; say when'],
];
const SLOW_WORDS = /\b(fast|quick|quickly|performant|snappy|responsive)\b/i;
const BUILD_VERB = /^(create|add|implement|build|write|refactor|set up|introduce)\b/i;
const BUILD_NOUN = /\b(class|function|service|module|component|table|endpoint|handler|repository|aggregate|migration|schema|interface)\b/i;
const FAILURE = /\b(reject\w*|refus\w*|invalid|fail\w*|error|cannot|can't|not allowed|denied|unauthori[sz]ed|forbidden|missing|already|exceed\w*|limit\w*|unknown|not found|without)\b/i;

function checkCriterion(taskId, index, text, errors, warnings) {
  const where = `${taskId} criteria[${index}]`;
  const words = text.trim().split(/\s+/).length;
  if (words < 3) errors.push(`${where}: "${text}" is too short to be a behavior`);
  if (words > 40) errors.push(`${where}: ${words} words; split it into one behavior per item`);
  if (/\n/.test(text)) errors.push(`${where}: contains a line break; one behavior per item`);
  for (const [pattern, why] of VAGUE) {
    const m = pattern.exec(text);
    if (m) errors.push(`${where}: "${m[0]}" ${why}`);
  }
  if (SLOW_WORDS.test(text) && !/\d/.test(text)) {
    errors.push(`${where}: a speed claim needs a number (for example "within 2 seconds")`);
  }
  if (BUILD_VERB.test(text.trim()) && BUILD_NOUN.test(text)) {
    errors.push(`${where}: describes how it is built, not what is observable`);
  }
  if (text.includes(';') || (text.match(/ and /g) ?? []).length >= 3) {
    warnings.push(`${where}: may hold more than one behavior; consider splitting it`);
  }
}

/**
 * Validates a plan. opts.features is a parsed feature model (optional cross-check).
 * opts.contextExists(name) tells whether src/contexts/<name> exists.
 * Returns { errors, warnings }.
 */
export function validatePlan(plan, opts = {}) {
  const contextExists = opts.contextExists ?? (() => false);
  planSchema(plan); // run the validator first: it records its errors on itself
  const errors = schemaErrors(planSchema, 'plan');
  const warnings = [];
  if (errors.length > 0) return { errors, warnings };

  const contexts = new Map();
  for (const c of plan.contexts) {
    if (contexts.has(c.name)) errors.push(`context ${c.name}: declared twice`);
    contexts.set(c.name, c);
    if (c.name.startsWith('reference-')) errors.push(`context ${c.name}: "reference-" contexts are pattern examples, never product contexts`);
    if (c.status === 'existing' && !contextExists(c.name)) {
      errors.push(`context ${c.name}: marked existing, but src/contexts/${c.name} does not exist`);
    }
  }

  const taskIds = new Set();
  for (const t of plan.tasks) {
    if (taskIds.has(t.id)) errors.push(`${t.id}: duplicate task id`);
    taskIds.add(t.id);
  }
  for (const t of plan.tasks) {
    if (!contexts.has(t.context)) errors.push(`${t.id}: context "${t.context}" is not declared in plan.contexts`);
    for (const dep of t.depends_on) {
      if (dep === t.id) errors.push(`${t.id}: depends on itself`);
      else if (!taskIds.has(dep)) errors.push(`${t.id}: depends on ${dep}, which is not in the plan`);
    }
    t.criteria.forEach((text, i) => checkCriterion(t.id, i, text, errors, warnings));
    if (!t.criteria.some((c) => FAILURE.test(c))) {
      warnings.push(`${t.id}: no criterion describes a failure case (invalid input, not allowed, already exists, ...)`);
    }
    if (t.open_questions.length > 0) {
      warnings.push(`${t.id}: has ${t.open_questions.length} open question(s), so it will not be released until they are answered`);
    }
  }
  if (errors.length === 0) {
    try {
      topoOrder(plan.tasks, (t) => t.id, (t) => t.depends_on);
    } catch (e) {
      errors.push(`tasks: ${e.message}`);
    }
  }

  if (opts.features) {
    const featureIds = new Set(opts.features.features.map((f) => f.id));
    const covered = new Set(plan.tasks.map((t) => t.feature));
    for (const t of plan.tasks) {
      if (!featureIds.has(t.feature)) errors.push(`${t.id}: feature ${t.feature} is not in the feature file`);
    }
    for (const id of featureIds) {
      if (!covered.has(id)) errors.push(`${id}: no task covers this feature`);
    }
  }
  return { errors, warnings };
}
