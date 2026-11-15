import type { ExpenseCategoryDto, ExpenseDto } from '@/contexts/expenses';
import { DeleteExpenseForm } from './delete-expense-form.client';
import { EditExpenseForm } from './edit-expense-form.client';
import { formatAmount, targetLabel, targetValue, type ExpenseTargetOption, type SubcategoriesByCategory } from './format';

/** The user's expenses, newest last, each with an edit and a delete form. */
export function ExpenseList({
  expenses,
  categories,
  subcategories,
  options,
  userEmail,
}: {
  expenses: readonly ExpenseDto[];
  categories: readonly ExpenseCategoryDto[];
  subcategories: SubcategoriesByCategory;
  options: readonly ExpenseTargetOption[];
  userEmail: string;
}) {
  if (expenses.length === 0) {
    return <p className="mt-4 text-muted">No expenses yet.</p>;
  }
  return (
    <ul aria-label="Expenses" className="mt-4 flex flex-col gap-4">
      {expenses.map((expense) => {
        const amount = formatAmount(expense.amountCents);
        return (
          <li key={expense.id} className="rounded-control border border-line p-4">
            <p className="font-medium text-ink">
              <time dateTime={expense.spentOn}>{expense.spentOn}</time> — {amount} —{' '}
              {targetLabel(expense, categories, subcategories)}
            </p>
            <div className="mt-3 flex flex-col gap-4">
              <EditExpenseForm
                expenseId={expense.id}
                amount={amount}
                spentOn={expense.spentOn}
                target={targetValue(expense)}
                options={options}
                userEmail={userEmail}
              />
              <DeleteExpenseForm expenseId={expense.id} label={`${amount} on ${expense.spentOn}`} userEmail={userEmail} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}