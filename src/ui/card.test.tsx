// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Card } from './card';
import { PageShell } from './page-shell';

afterEach(cleanup);

describe('Card and PageShell', () => {
  it('a card title is a real heading, level 2 by default', () => {
    render(<Card title="Open a loan">content</Card>);
    expect(screen.getByRole('heading', { name: 'Open a loan', level: 2 })).toBeInTheDocument();
  });

  it('a card can be nested one level deeper', () => {
    render(<Card title="Details" headingLevel={3}>content</Card>);
    expect(screen.getByRole('heading', { name: 'Details', level: 3 })).toBeInTheDocument();
  });

  it('a page has one main landmark and one h1', () => {
    render(<PageShell title="Loans">body</PageShell>);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
