import { expect, test } from '@playwright/test';

test('qr feedback submit works', async ({ page }) => {
  await page.goto('http://localhost:3000/1d80c4');
  await expect(page.getByText('How was your visit?')).toBeVisible({ timeout: 15000 });

  const stars = page.locator('div.flex.justify-center.space-x-2 button');
  await expect(stars).toHaveCount(5, { timeout: 10000 });
  await stars.nth(4).click();

  await page.fill('textarea[name="comment"]', 'Automation feedback submit');
  await page.fill('input[name="contact"]', 'qa@example.com');
  await page.getByRole('button', { name: 'Send Feedback' }).click();

  await expect(page.getByText('Thank you!')).toBeVisible({ timeout: 15000 });
});
