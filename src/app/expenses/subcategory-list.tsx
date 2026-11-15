import type { ExpenseCategoryDto, ExpenseSubcategoryDto } from '@/contexts/expenses';
import { Card } from '@/ui/card';
import { CreateSubcategoryForm } from './create-subcategory-form.client';
import { DeleteSubcategoryForm } from './delete-subcategory-form.client';
import { RenameSubcategoryForm } from './rename-subcategory-form.client';

/** The expense-subcategories of one expense-category, with their create, rename and delete forms. */
export function SubcategoryList({
  category,
  subcategories,
  userEmail,
}: {
  category: ExpenseCategoryDto;
  subcategories: readonly ExpenseSubcategoryDto[];
  userEmail: string;
}) {
  return (
    <Card title="Subcategories" headingLevel={3}>
      <CreateSubcategoryForm categoryId={category.id} categoryName={category.name} userEmail={userEmail} />
      {subcategories.length === 0 ? (
        <p className="mt-3 text-muted">No subcategories yet.</p>
      ) : (
        <ul aria-label={`Expense-subcategories of ${category.name}`} className="mt-3 flex flex-col gap-4">
          {subcategories.map((subcategory) => (
            <li key={subcategory.id} className="rounded-control border border-line p-4">
              <p className="font-medium text-ink">{subcategory.name}</p>
              <div className="mt-3 flex flex-col gap-4">
                <RenameSubcategoryForm
                  categoryId={category.id}
                  categoryName={category.name}
                  subcategoryId={subcategory.id}
                  name={subcategory.name}
                  userEmail={userEmail}
                />
                <DeleteSubcategoryForm
                  categoryId={category.id}
                  categoryName={category.name}
                  subcategoryId={subcategory.id}
                  name={subcategory.name}
                  userEmail={userEmail}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}