/**
 * Architecture rules. Protected path: agents must never edit this file.
 * Layers inside a context: domain <- application <- infrastructure.
 * "$1" in a `to` rule refers to the context captured in the `from` path.
 */
const TEST_LIBS = 'node_modules/(vitest|@playwright|@testing-library|@axe-core|jsdom)(/|$)';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies hide layering mistakes.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment: 'domain/ imports only its own domain and src/shared. No frameworks, ORMs or libraries.',
      from: { path: '^src/contexts/([^/]+)/domain/' },
      to: { pathNot: ['^src/contexts/$1/domain/', '^src/shared/', TEST_LIBS] },
    },
    {
      name: 'application-depends-on-domain-only',
      severity: 'error',
      comment: 'application/ imports its own application and domain, src/shared, and other contexts\' public index.ts.',
      from: { path: '^src/contexts/([^/]+)/application/', pathNot: '\\.test\\.ts$' },
      to: {
        pathNot: [
          '^src/contexts/$1/(application|domain)/',
          '^src/shared/',
          '^src/contexts/[^/]+/index\\.ts$',
          TEST_LIBS,
        ],
      },
    },
    {
      name: 'application-tests-use-fakes',
      severity: 'error',
      comment: 'Application tests may additionally import their own context\'s in-memory fakes from testing/.',
      from: { path: '^src/contexts/([^/]+)/application/.*\\.test\\.ts$' },
      to: {
        pathNot: [
          '^src/contexts/$1/(application|domain|testing)/',
          '^src/shared/',
          '^src/contexts/[^/]+/index\\.ts$',
          TEST_LIBS,
        ],
      },
    },
    {
      name: 'infrastructure-implements-ports',
      severity: 'error',
      comment: 'infrastructure/ imports its own layers, src/shared, other contexts\' public index.ts, and libraries.',
      from: { path: '^src/contexts/([^/]+)/infrastructure/' },
      to: {
        pathNot: [
          '^src/contexts/$1/(infrastructure|application|domain)/',
          '^src/shared/',
          '^src/contexts/[^/]+/index\\.ts$',
        ],
        dependencyTypesNot: ['npm', 'npm-dev', 'core'],
      },
    },
    {
      name: 'testing-fakes-depend-on-inner-layers',
      severity: 'error',
      comment: 'testing/ (in-memory fakes) imports its own domain, application, testing, and src/shared.',
      from: { path: '^src/contexts/([^/]+)/testing/' },
      to: {
        pathNot: [
          '^src/contexts/$1/(testing|application|domain)/',
          '^src/shared/',
          '^src/contexts/[^/]+/index\\.ts$',
          TEST_LIBS,
        ],
      },
    },
    {
      name: 'contexts-use-each-others-public-api-only',
      severity: 'error',
      comment: 'A context may import another context only through its public index.ts.',
      from: { path: '^src/contexts/([^/]+)/' },
      to: {
        path: '^src/contexts/[^/]+/(domain|application|infrastructure|testing)/',
        pathNot: '^src/contexts/$1/',
      },
    },
    {
      name: 'product-contexts-do-not-depend-on-reference-contexts',
      severity: 'error',
      comment: 'reference-* contexts are pattern examples. Product contexts copy their structure; they never import them.',
      from: { path: '^src/contexts/(?!reference-)[^/]+/' },
      to: { path: '^src/contexts/reference-' },
    },
    {
      name: 'shared-kernel-is-independent',
      severity: 'error',
      comment: 'src/shared must not import any context, the app, or the composition root.',
      from: { path: '^src/shared/' },
      to: { path: '^src/(contexts|app|composition)/' },
    },
    {
      name: 'delivery-uses-public-api-only',
      severity: 'error',
      comment: 'src/app imports contexts only through their public index.ts, and handlers through src/composition.',
      from: { path: '^src/app/' },
      to: { path: '^src/contexts/[^/]+/(domain|application|infrastructure|testing)/' },
    },
    {
      name: 'only-composition-imports-infrastructure',
      severity: 'error',
      comment: 'Only src/composition (and infrastructure itself) may import infrastructure/.',
      from: { pathNot: ['^src/composition/', '^src/contexts/[^/]+/infrastructure/'] },
      to: { path: '^src/contexts/[^/]+/infrastructure/' },
    },
    {
      name: 'production-never-imports-testing',
      severity: 'error',
      comment: 'Fakes in testing/ are for tests only.',
      from: { pathNot: ['\\.test\\.tsx?$', '^src/contexts/[^/]+/testing/'] },
      to: { path: '^src/contexts/[^/]+/testing/' },
    },
    {
      name: 'orm-only-in-infrastructure-and-composition',
      severity: 'error',
      comment: 'Drizzle and the database driver are imported only in infrastructure/ and src/composition.',
      from: { pathNot: ['^src/contexts/[^/]+/infrastructure/', '^src/composition/'] },
      to: { path: 'node_modules/(drizzle-orm|postgres)(/|$)' },
    },
    {
      name: 'framework-only-in-app-and-composition',
      severity: 'error',
      comment: 'Next.js, React and server-only are imported only in src/app and src/composition.',
      from: { pathNot: ['^src/app/', '^src/composition/', '^src/ui/'] },
      to: { path: 'node_modules/(next|react|react-dom|server-only)(/|$)' },
    },
    {
      name: 'ui-kit-is-presentational',
      severity: 'error',
      comment: 'src/ui holds presentational components: they import only each other, React and Next.js. No contexts, no composition root, no data access.',
      from: { path: '^src/ui/' },
      to: { pathNot: ['^src/ui/', 'node_modules/(react|react-dom|next)(/|$)', TEST_LIBS] },
    },
    {
      name: 'client-islands-do-not-reach-the-backend',
      severity: 'error',
      comment: 'A *.client.tsx file runs in the browser. It must not import the composition root, a context\'s internals, or server-only libraries; it calls a server action instead.',
      from: { path: '\\.client\\.tsx$' },
      to: {
        path: [
          '^src/composition/',
          '^src/contexts/[^/]+/(domain|application|infrastructure|testing)/',
          'node_modules/(server-only|drizzle-orm|postgres)(/|$)',
        ],
      },
    },
    {
      name: 'client-islands-import-contexts-as-types-only',
      severity: 'error',
      comment: 'A context\'s index.ts also exports event classes. A browser bundle may use only its types: write "import type".',
      from: { path: '\\.client\\.tsx$' },
      to: { path: '^src/contexts/[^/]+/index\\.ts$', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'backend-never-imports-ui',
      severity: 'error',
      comment: 'Contexts, the shared kernel and the composition root know nothing about the UI.',
      from: { path: '^src/(contexts|shared|composition)/' },
      to: { path: '^src/ui/' },
    },
    {
      name: 'no-test-libraries-in-production',
      severity: 'error',
      comment: 'Test libraries are imported only by test files and fakes.',
      from: { pathNot: ['\\.test\\.tsx?$', '^src/contexts/[^/]+/testing/'] },
      to: { path: TEST_LIBS },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
};
