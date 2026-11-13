import type { ReactNode } from 'react';

type Tone = 'error' | 'success' | 'info';

const TONES: Record<Tone, string> = {
  error: 'border-danger bg-danger-soft text-danger',
  success: 'border-success bg-success-soft text-success',
  info: 'border-line bg-info-soft text-ink',
};

/** A message. Errors interrupt assistive technology (role alert); other tones wait politely (role status). */
export function Alert({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-control border px-4 py-3 text-sm ${TONES[tone]}`}>
      {children}
    </div>
  );
}
