import type { ReactNode } from 'react';

/** A titled panel. The title is a real heading so the page keeps a navigable outline. */
export function Card({ title, headingLevel = 2, children }: { title: string; headingLevel?: 2 | 3; children: ReactNode }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className="rounded-control border border-line bg-surface-raised p-5">
      <Heading className="mb-3 text-lg font-semibold">{title}</Heading>
      {children}
    </section>
  );
}
