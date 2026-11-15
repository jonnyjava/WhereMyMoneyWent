import { getContainer } from '@/composition/container';
import type { ExpenseSubcategoryDto } from '@/contexts/expenses';
import { Alert } from '@/ui/alert';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { PageShell } from '@/ui/page-shell';
import { TextField } from '@/ui/text-field';
import { CategoryList } from './category-list';
import { CreateCategoryForm } from './create-category-form.client';
import { ExpenseList } from './expense-list';
import { expenseTargetOptions } from './format';
import { invalidEmailMessage, listSubcategoriesMessage } from './messages';
import { RegisterExpenseForm } from './register-expense-form.client';

export const dynamic = 'force-dynamic';

// A server component: it reads through the composition root and renders. No state, no business rules.
// There is no registration or login, so the person's email address identifies their expenses.
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

  const container = getContainer();
  const listedCategories = await container.listExpenseCategories.execute({ userEmail });
  if (!listedCategories.ok) {
    return (
      <PageShell title="Expenses">
        <Alert tone="error">{invalidEmailMessage()}</Alert>
      </PageShell>
    );
  }

  const categories = listedCategories.value;
  const subcategories = new Map<string, ExpenseSubcategoryDto[]>();
  for (const category of categories) {
    const listed = await container.listExpenseSubcategories.execute({ categoryId: category.id, userEmail });
    if (!listed.ok) {
      return (
        <PageShell title="Expenses">
          <Alert tone="error">{listSubcategoriesMessage(listed.error)}</Alert>
        </PageShell>
      );
    }
    subcategories.set(category.id, listed.value);
  }

  const listedExpenses = await container.listExpenses.execute({ userEmail });
  if (!listedExpenses.ok) {
    return (
      <PageShell title="Expenses">
        <Alert tone="error">{invalidEmailMessage()}</Alert>
      </PageShell>
    );
  }

  const options = expenseTargetOptions(categories, subcategories);

  return (
    <PageShell title="Expenses">
      <p className="text-muted">
        Expense categories for <strong>{userEmail}</strong>.
      </p>
      <Card title="Expense categories">
        <CreateCategoryForm userEmail={userEmail} />
        <CategoryList categories={categories} subcategories={subcategories} userEmail={userEmail} />
      </Card>
      <Card title="Expenses">
        <RegisterExpenseForm userEmail={userEmail} today={new Date().toISOString().slice(0, 10)} options={options} />
        <ExpenseList
          expenses={listedExpenses.value}
          categories={categories}
          subcategories={subcategories}
          options={options}
          userEmail={userEmail}
        />
      </Card>
    </PageShell>
  );
}