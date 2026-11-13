import Link from 'next/link';
import { PageShell } from '@/ui/page-shell';

export default function HomePage() {
  return (
    <PageShell title="DDD Next.js starter">
      <p className="text-muted">The reference contexts are pattern examples. See docs/guides/reference-slice.md.</p>
      <p>
        <Link href="/reference/loans" className="text-accent underline">
          Open the reference UI example
        </Link>
      </p>
    </PageShell>
  );
}
