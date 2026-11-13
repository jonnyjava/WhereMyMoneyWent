// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Alert } from './alert';

afterEach(cleanup);

describe('Alert', () => {
  it('interrupts assistive technology for an error', () => {
    render(<Alert tone="error">Something failed.</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something failed.');
  });

  it('is polite for success and info messages', () => {
    render(
      <>
        <Alert tone="success">Saved.</Alert>
        <Alert tone="info">Note.</Alert>
      </>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
