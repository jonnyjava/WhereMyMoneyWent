import { getContainer } from '@/composition/container';
import { Alert } from '@/ui/alert';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { PageShell } from '@/ui/page-shell';
import { TextField } from '@/ui/text-field';
import { CategoryList } from './category-list';
import { CreateCategoryForm } from './create-category-form.client';
import { invalidEmailMessage } from './messages';

export const dynamic = 'force-dynamic';

// A server component: it reads through the composition root and renders. No state, no business rules.
// There is no registration or login, so the person's email address identifies their categories.
export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const { email } = await searchParams;
  const userEmail = typeof email === 'string' ? email.trim() : '';

  if (userEmail === '') {
    return (
      <PageShell title="Expenses">
        <Card title="Your email">
          <form method="get" className="flex flex-col gap-4">
            <TextField
              name="email"
              label="Your email"
              type="email"
              required
              hint="Your expense categories belong to this address."
            />
            <div>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </Card>
      </PageShell>
    );
  }

  const listed = await getContainer().listExpenseCategories.execute({ userEmail });

  return (
    <PageShell title="Expenses">
      <p className="text-muted">
        Expense categories for <strong>{userEmail}</strong>.
      </p>
      {listed.ok ? (
        <Card title="Expense categories">
          <CreateCategoryForm userEmail={userEmail} />
          <CategoryList categories={listed.value} userEmail={userEmail} />
        </Card>
      ) : (
        <Alert tone="error">{invalidEmailMessage()}</Alert>
      )}
    </PageShell>
  );
}