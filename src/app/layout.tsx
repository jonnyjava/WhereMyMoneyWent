import type { ReactNode } from 'react';
import './globals.css';

export const metadata = { title: 'DDD Next.js starter' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
