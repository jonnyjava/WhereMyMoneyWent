import { getContainer } from '@/composition/container';
import type { ExpenseCategoryDto } from '@/contexts/expenses';
import { Alert } from '@/ui/alert';
import { Card } from '@/ui/card';
import { CreateSubcategoryForm } from './create-subcategory-form.client';
import { DeleteSubcategoryForm } from './delete-subcategory-form.client';
import { listSubcategoriesMessage } from './messages';
import { RenameSubcategoryForm } from './rename-subcategory-form.client';

/** The expense-subcategories of one expense-category. A server component: it reads them and renders. */
export async function SubcategoryList({
  category,
  userEmail,
}: {
  category: ExpenseCategoryDto;
  userEmail: string;
}) {
  const listed = await getContainer().listExpenseSubcategories.execute({
    categoryId: category.id,
    userEmail,
  });
  if (!listed.ok) return <Alert tone="error">{listSubcategoriesMessage(listed.error)}</Alert>;

  return (
    <Card title="Subcategories" headingLevel={3}>
      <CreateSubcategoryForm categoryId={category.id} categoryName={category.name} userEmail={userEmail} />
      {listed.value.length === 0 ? (
        <p className="mt-3 text-muted">No subcategories yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-4">
          {listed.value.map((subcategory) => (
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