import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Next.js adds its own empty role="alert" (the route announcer), so select alerts by their text.
const alert = (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text });

test('the loans page has no automatically detectable accessibility violations', async ({ page }) => {
  await page.goto('/reference/loans');
  await expect(page.getByRole('heading', { name: 'Library loans', level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('a person can open, extend and return a loan, and sees plain-language errors', async ({ page }) => {
  await page.goto('/reference/loans');
  const counter = page.getByText(/Books returned so far/);
  const before = Number((await counter.textContent())?.replace(/\D/g, ''));

  // Opening a loan with an email the domain rejects shows a message, and stays on the page.
  await page.getByLabel('Book', { exact: true }).fill('Dune');
  await page.getByLabel('Borrower email').fill('ada@example');
  await page.getByRole('button', { name: 'Open loan' }).click();
  await expect(alert(page, 'email address does not look right')).toBeVisible();

  // The form keeps what the person typed (React resets uncontrolled fields after an action).
  await expect(page.getByLabel('Book', { exact: true })).toHaveValue('Dune');
  await expect(page.getByLabel('Borrower email')).toHaveValue('ada@example');
  await expect(page.getByLabel('Loan length in days')).toHaveValue('14');

  // Fixing only the email is enough: a valid loan opens and shows its details.
  await page.getByLabel('Borrower email').fill('ada@example.com');
  await page.getByRole('button', { name: 'Open loan' }).click();
  await expect(page).toHaveURL(/\/reference\/loans\?id=/);
  await expect(page.getByRole('heading', { name: 'Loan', exact: true })).toBeVisible();
  await expect(page.getByText('Dune', { exact: true })).toBeVisible();
  await expect(page.getByText('ada@example.com', { exact: true })).toBeVisible();
  await expect(page.getByText('Not returned', { exact: true })).toBeVisible();

  // The first extension works, the second hits the limit.
  await page.getByRole('button', { name: 'Extend loan by 7 days' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Loan extended by 7 days' })).toBeVisible();
  await page.getByRole('button', { name: 'Extend loan by 7 days' }).click();
  await expect(alert(page, 'already been extended once')).toBeVisible();

  // Returning shows the new status and updates the counter, and a returned loan cannot be extended.
  await page.getByRole('button', { name: 'Return book' }).click();
  await expect(page.getByText('Returned', { exact: true })).toBeVisible();
  await expect(counter).toContainText(`Books returned so far: ${before + 1}`);
  await page.getByRole('button', { name: 'Extend loan by 7 days' }).click();
  await expect(alert(page, 'already been returned')).toBeVisible();
});

test('looking up an unknown loan explains that nothing was found', async ({ page }) => {
  await page.goto('/reference/loans');
  await page.getByLabel('Loan id').fill('does-not-exist');
  await page.getByRole('button', { name: 'Find loan' }).click();
  await expect(alert(page, 'No loan found with that id')).toBeVisible();
});
