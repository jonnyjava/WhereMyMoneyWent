// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TextField } from './text-field';

afterEach(cleanup);

describe('TextField', () => {
  it('ties the label to the input', () => {
    render(<TextField label="Email" name="email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email');
  });

  it('describes the input with its hint', () => {
    render(<TextField label="Email" hint="We never share it." />);
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('We never share it.');
  });

  it('marks the input invalid and describes it with the error', () => {
    render(<TextField label="Email" hint="We never share it." error="Enter a valid address." />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('We never share it. Enter a valid address.');
  });

  it('is not marked invalid when there is no error', () => {
    render(<TextField label="Email" />);
    expect(screen.getByLabelText('Email')).toBeValid();
  });

  it('gives two fields on one page two different ids', () => {
    render(
      <>
        <TextField label="First" />
        <TextField label="Second" />
      </>,
    );
    expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id);
  });
});
