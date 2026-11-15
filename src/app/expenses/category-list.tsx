import type { ExpenseCategoryDto } from '@/contexts/expenses';
import { DeleteCategoryForm } from './delete-category-form.client';
import { RenameCategoryForm } from './rename-category-form.client';
import { SubcategoryList } from './subcategory-list';

/** The user's expense-categories, each with its expense-subcategories. A server component. */
export function CategoryList({
  categories,
  userEmail,
}: {
  categories: readonly ExpenseCategoryDto[];
  userEmail: string;
}) {
  if (categories.length === 0) {
    return <p className="text-muted">No categories yet. Create the first one above.</p>;
  }
  return (
    <ul className="mt-4 flex flex-col gap-4">
      {categories.map((category) => (
        <li key={category.id} className="rounded-control border border-line p-4">
          <p className="font-medium text-ink">{category.name}</p>
          <div className="mt-3 flex flex-col gap-4">
            <RenameCategoryForm categoryId={category.id} name={category.name} userEmail={userEmail} />
            <DeleteCategoryForm categoryId={category.id} name={category.name} userEmail={userEmail} />
            <SubcategoryList category={category} userEmail={userEmail} />
          </div>
        </li>
      ))}
    </ul>
  );
}