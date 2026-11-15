import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Next.js adds its own empty role="alert" (the route announcer), so select alerts by their text.
const alert = (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text });

// The lists have accessible names, so a category name is never confused with the same words in the target select.
const categoryList = (page: Page) => page.getByRole('list', { name: 'Expense categories' });
const subcategoryList = (page: Page, categoryName: string) =>
  page.getByRole('list', { name: `Expense-subcategories of ${categoryName}` });
const expenseList = (page: Page) => page.getByRole('list', { name: 'Expenses' });

test('the expenses page has no automatically detectable accessibility violations', async ({ page }) => {
  await page.goto('/expenses');
  await expect(page.getByRole('heading', { name: 'Expenses', level: 1 })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});

test('a person can create, rename and delete an expense-category, and sees plain-language errors', async ({ page }) => {
  const userEmail = `ada-${Date.now()}@example.com`;

  // Without an email address the page asks for one.
  await page.goto('/expenses');
  await page.getByLabel('Your email').fill(userEmail);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('No categories yet. Create the first one above.')).toBeVisible();

  // Creating a category lists it under the form.
  await page.getByLabel('Category name').fill('Food');
  await page.getByRole('button', { name: 'Create category' }).click();
  await expect(categoryList(page).getByText('Food', { exact: true })).toBeVisible();

  // A name the same person already uses is refused, and the form keeps what was typed.
  await page.getByLabel('Category name').fill('Food');
  await page.getByRole('button', { name: 'Create category' }).click();
  await expect(alert(page, 'already have a category with that name')).toBeVisible();
  await expect(page.getByLabel('Category name')).toHaveValue('Food');

  // The page with a category has no automatically detectable accessibility violations.
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  // Renaming shows the new name.
  await page.getByLabel('New name for Food').fill('Groceries');
  await page.getByRole('button', { name: 'Rename' }).click();
  await expect(categoryList(page).getByText('Groceries', { exact: true })).toBeVisible();

  // Deleting removes it from the list.
  await page.getByRole('button', { name: 'Delete Groceries' }).click();
  await expect(page.getByText('No categories yet. Create the first one above.')).toBeVisible();
});

test('a person never sees the expense-categories of another user', async ({ page }) => {
  const ownerEmail = `grace-${Date.now()}@example.com`;
  const otherEmail = `lin-${Date.now()}@example.com`;

  await page.goto(`/expenses?email=${encodeURIComponent(ownerEmail)}`);
  await page.getByLabel('Category name').fill('Books');
  await page.getByRole('button', { name: 'Create category' }).click();
  await expect(categoryList(page).getByText('Books', { exact: true })).toBeVisible();

  await page.goto(`/expenses?email=${encodeURIComponent(otherEmail)}`);

  await expect(page.getByText('No categories yet. Create the first one above.')).toBeVisible();
  await expect(categoryList(page).getByText('Books', { exact: true })).toHaveCount(0);
});

test('a person can add, rename and delete the expense-subcategories of a category', async ({ page }) => {
  const userEmail = `ada-${Date.now()}@example.com`;
  await page.goto(`/expenses?email=${encodeURIComponent(userEmail)}`);

  await page.getByLabel('Category name').fill('Food');
  await page.getByRole('button', { name: 'Create category' }).click();
  await expect(categoryList(page).getByText('Food', { exact: true })).toBeVisible();
  await expect(page.getByText('No subcategories yet.')).toBeVisible();

  // A subcategory shows up under its category.
  await page.getByLabel('New subcategory under Food').fill('Groceries');
  await page.getByRole('button', { name: 'Add subcategory to Food' }).click();
  await expect(subcategoryList(page, 'Food').getByText('Groceries', { exact: true })).toBeVisible();

  // A name another subcategory of the same category already uses is refused, and the form keeps what was typed.
  await page.getByLabel('New subcategory under Food').fill('Groceries');
  await page.getByRole('button', { name: 'Add subcategory to Food' }).click();
  await expect(alert(page, 'already has a subcategory with that name')).toBeVisible();
  await expect(page.getByLabel('New subcategory under Food')).toHaveValue('Groceries');

  // The page with a subcategory has no automatically detectable accessibility violations.
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  // Renaming shows the new name.
  await page.getByLabel('New name for Groceries in Food').fill('Fresh food');
  await page.getByRole('button', { name: 'Rename Groceries in Food' }).click();
  await expect(subcategoryList(page, 'Food').getByText('Fresh food', { exact: true })).toBeVisible();

  // Deleting removes it from the category.
  await page.getByRole('button', { name: 'Delete Fresh food in Food' }).click();
  await expect(page.getByText('No subcategories yet.')).toBeVisible();
});

test('the same subcategory name is allowed under two categories, and a deleted category takes its subcategories', async ({
  page,
}) => {
  const userEmail = `grace-${Date.now()}@example.com`;
  await page.goto(`/expenses?email=${encodeURIComponent(userEmail)}`);

  for (const categoryName of ['Food', 'Transport']) {
    await page.getByLabel('Category name').fill(categoryName);
    await page.getByRole('button', { name: 'Create category' }).click();
    await expect(categoryList(page).getByText(categoryName, { exact: true })).toBeVisible();
  }

  await page.getByLabel('New subcategory under Food').fill('Monthly');
  await page.getByRole('button', { name: 'Add subcategory to Food' }).click();
  await page.getByLabel('New subcategory under Transport').fill('Monthly');
  await page.getByRole('button', { name: 'Add subcategory to Transport' }).click();
  await expect(page.getByText('Monthly', { exact: true })).toHaveCount(2);

  // Deleting a category destroys its expense-subcategories with it.
  await page.getByRole('button', { name: 'Delete Food' }).click();
  await expect(categoryList(page).getByText('Food', { exact: true })).toHaveCount(0);
  await expect(subcategoryList(page, 'Transport').getByText('Monthly', { exact: true })).toBeVisible();
});

test('a person can register, edit and delete an expense', async ({ page }) => {
  const userEmail = `ada-${Date.now()}@example.com`;
  await page.goto(`/expenses?email=${encodeURIComponent(userEmail)}`);

  await page.getByLabel('Category name').fill('Food');
  await page.getByRole('button', { name: 'Create category' }).click();
  await page.getByLabel('New subcategory under Food').fill('Groceries');
  await page.getByRole('button', { name: 'Add subcategory to Food' }).click();
  await expect(subcategoryList(page, 'Food').getByText('Groceries', { exact: true })).toBeVisible();

  // A category that still has expense-subcategories is not offered as a target.
  await expect(page.getByLabel('Category or subcategory').first().locator('option')).toHaveText([
    'Food › Groceries',
  ]);

  // An amount of 0 or less is refused, and the form keeps what was typed.
  await page.getByLabel('Amount', { exact: true }).first().fill('0');
  await page.getByLabel('Date', { exact: true }).first().fill('2026-01-10');
  await page.getByRole('button', { name: 'Register expense' }).click();
  await expect(alert(page, 'amount greater than 0')).toBeVisible();
  await expect(page.getByLabel('Amount', { exact: true }).first()).toHaveValue('0');

  // A real expense is listed with its amount, its date and its target.
  await page.getByLabel('Amount', { exact: true }).first().fill('12.50');
  await page.getByRole('button', { name: 'Register expense' }).click();
  const row = expenseList(page).getByRole('listitem');
  await expect(row).toContainText('2026-01-10');
  await expect(row).toContainText('12.50');
  await expect(row).toContainText('Food › Groceries');

  // The page with an expense has no automatically detectable accessibility violations.
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  // Editing changes the amount.
  await page.getByLabel('Amount', { exact: true }).last().fill('20.00');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('button', { name: 'Delete 20.00 on 2026-01-10' })).toBeVisible();

  // Deleting removes it from the list.
  await page.getByRole('button', { name: 'Delete 20.00 on 2026-01-10' }).click();
  await expect(page.getByText('No expenses yet.')).toBeVisible();
});

test('expenses are listed by date, then by time of creation, and never another users', async ({ page }) => {
  const userEmail = `grace-${Date.now()}@example.com`;
  await page.goto(`/expenses?email=${encodeURIComponent(userEmail)}`);

  await page.getByLabel('Category name').fill('Food');
  await page.getByRole('button', { name: 'Create category' }).click();
  await expect(categoryList(page).getByText('Food', { exact: true })).toBeVisible();

  const register = async (amount: string, date: string) => {
    await page.getByLabel('Amount', { exact: true }).first().fill(amount);
    await page.getByLabel('Date', { exact: true }).first().fill(date);
    await page.getByRole('button', { name: 'Register expense' }).click();
    // Wait for the new row, not for the message: the message of the previous action is still on screen.
    await expect(page.getByRole('button', { name: `Delete ${amount} on ${date}` })).toBeVisible();
  };

  await register('5.00', '2026-01-05');
  await register('10.00', '2026-01-10');
  await register('12.00', '2026-01-10');

  await expect(page.getByRole('button', { name: /^Delete \d/ })).toHaveText([
    'Delete 5.00 on 2026-01-05',
    'Delete 10.00 on 2026-01-10',
    'Delete 12.00 on 2026-01-10',
  ]);

  await page.goto(`/expenses?email=${encodeURIComponent(`lin-${Date.now()}@example.com`)}`);
  await expect(page.getByText('No categories yet. Create the first one above.')).toBeVisible();
  await expect(page.getByText('No expenses yet.')).toBeVisible();
});