# UI

> Read this before: you write or change a page, a component, a form or a style.
> Enforced by `pnpm check:ui`, dependency-cruiser, ESLint (jsx-a11y) and an accessibility scan in the e2e tests,
> all inside `pnpm verify`. Where each rule appears in code: `docs/guides/reference-slice.md`.
> Part of the reusable `ddd-nextjs` conventions profile. Keep project-specific facts out of this file.

## The shape of the UI

The UI is a thin delivery layer. It shows what the application layer returns and sends what people type. It holds
**no business rules**: a rule that is checked in a component must also be a rule in the domain.

Server first. A page is a server component: it reads through the composition root and renders. Browser code is a
small **island** that exists only for interactivity (a pending state, an error message).

| Kind | Where | File name | May import |
|---|---|---|---|
| Page, layout, route handler | `src/app/**` | `page.tsx`, `layout.tsx`, `route.ts` | the UI kit, `src/composition/`, a context's public `index.ts`, `src/shared/` |
| Server action | `src/app/**` | `actions.ts`, starts with `'use server'` | the same, plus the route's `messages.ts` |
| Client island | `src/app/**` | `*.client.tsx`, starts with `'use client'` | the UI kit, server actions, and `import type` from a context's `index.ts` |
| Shared kit | `src/ui/` | kebab-case, no suffix | React, Next.js, and other files in `src/ui/` only |

Where does it go? Needs state or an event handler: a client island, as small as you can make it. Shows data: a
server component. Changes data: a server action. Used on more than one page and has no data: the kit.

## Reading and changing data

- **Read** in a server component: `getContainer().<query>.execute(...)`. Handle the `Result`: `ok` renders, an error
  becomes a message. Never call your own API routes from a server component.
- **Change** only through a server action. It reads the form (shape only: is it a number, is it empty), calls
  **one** command handler, and turns the `Result` into a `FormState`. On success it redirects or revalidates.
- **Keep what people typed.** React resets uncontrolled form fields after every action. An action that returns an
  error must also return the submitted `values`, and the form must use them as `defaultValue`. Otherwise a mistake
  in one field wipes all the others.
- A client island never imports the composition root, a context's internals or a database library. It calls a
  server action. From a context it may use `import type` only.

## Messages

Each route has a `messages.ts` that turns every error kind into a sentence, with an exhaustive `switch` and
`assertNever` (a new error kind then fails the typechecker until its message is written). A message says what
happened and what to do next, in plain words and sentence case. It never shows an id, an object, a stack trace or
an error kind. A `messages.test.ts` proves each message exists and leaks nothing. Where the error type has only one
possible kind, write a plain function: there is no union to be exhaustive over.

## Styling (Tailwind CSS)

- **Tokens only.** Use `bg-surface`, `bg-surface-raised`, `text-ink`, `text-muted`, `border-line` (decorative), `border-field` (control boundaries), `bg-accent` with
  `text-accent-ink`, `danger`, `success`, `info-soft`, `rounded-control`. Tailwind's default palette is removed, so
  `bg-red-500` builds to nothing; `pnpm check:ui` also fails on raw palette classes, hard-coded values such as
  `w-[13px]` or `bg-[#fff]`, and inline `style`.
- **Adding or changing a token is a person's decision.** `src/app/globals.css` is a protected path: stop and ask.
- Spacing and type use Tailwind's standard scale. Dark mode comes from the tokens; never write `dark:` variants.
- **Class names are complete literals.** Tailwind finds classes by scanning the text, so never build one with
  `bg-${tone}`. Map variants to full strings, as `Button` does.
- Add a component to `src/ui/` only for a pattern that appears in two places. A `className` prop is for layout
  (margin, width), never for color.

## Accessibility

Enforced by the lint rules of jsx-a11y and by an axe scan of every page in the e2e tests.
- Every input has a visible label and its hint and error tied to it: use `TextField`.
- A button is a `<button>`, a link is a `<a>` or `Link`. Never a clickable `div`.
- Errors use `<Alert tone="error">` (it interrupts assistive technology); other messages use the other tones (polite).
- One `h1` per page (`PageShell`), and headings in order (`Card` gives an `h2`).
- Color is never the only signal. The tokens keep text at 4.5:1 contrast or better. The boundary of a control
  (an input, a secondary button) uses `border-field`, which meets the 3:1 that WCAG asks for; `border-line` is
  decorative only. The axe scan cannot measure this, so it is a review item.

## States

A screen that loads or changes data answers four questions: what shows when there is nothing yet, what shows when it
fails and what the person should do, how it shows that it is working (a pending button), and how it shows success.
A task's criteria say which of these apply.

## Testing

| What | Tool | Where |
|---|---|---|
| Kit components and pure UI logic | Vitest and Testing Library in jsdom | `*.test.tsx` next to the file |
| Error messages | Vitest | `messages.test.ts` |
| User flows, including server actions | Playwright, plus one axe scan per page | `e2e/` |

- A component test starts with `// @vitest-environment jsdom`, imports `@testing-library/jest-dom/vitest`, and
  calls `afterEach(cleanup)`.
- Find elements by role or label, as a person would. Never by class, tag or test id.
- **Select alerts by their text.** Next.js adds its own empty `role="alert"` (the route announcer), so a bare
  `getByRole('alert')` finds two elements.
- No snapshot tests. Do not mock your own modules.

## What is enforced by what

| Rule | Enforced by |
|---|---|
| Tokens only, no inline style, no `dangerouslySetInnerHTML` | `pnpm check:ui` |
| `'use client'` only in `*.client.tsx` and always there; `'use server'` only in `actions.ts` | `pnpm check:ui` |
| The kit imports only itself, React and Next.js | dependency-cruiser: `ui-kit-is-presentational` |
| Client islands do not reach the backend, and import contexts as types only | dependency-cruiser: `client-islands-*` |
| Contexts, shared and composition never import the UI | dependency-cruiser: `backend-never-imports-ui` |
| Labels, alt text, keyboard access | ESLint jsx-a11y, and the axe scan in e2e |
| File names | `scripts/checks/check-names.mjs` |

## Stop and ask

Do not guess. Label the task `needs-human` if it needs a new design token, a shared pattern that does not fit the
kit, a client component that needs a backend call no server action covers, or a change to any rule above.
