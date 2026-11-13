import type { ReactNode } from 'react';

/** The frame of a page: one main landmark and one h1. */
export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-10">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </main>
  );
}
