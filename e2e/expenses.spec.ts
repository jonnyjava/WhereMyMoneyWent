import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Next.js adds its own empty role="alert" (the route announcer), so select alerts by their text.
const alert = (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text });

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
  await expect(page.getByText('Food', { exact: true })).toBeVisible();

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
  await expect(page.getByText('Groceries', { exact: true })).toBeVisible();

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
  await expect(page.getByText('Books', { exact: true })).toBeVisible();

  await page.goto(`/expenses?email=${encodeURIComponent(otherEmail)}`);

  await expect(page.getByText('No categories yet. Create the first one above.')).toBeVisible();
  await expect(page.getByText('Books', { exact: true })).toHaveCount(0);
});