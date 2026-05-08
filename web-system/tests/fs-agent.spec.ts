import { test, expect } from '@playwright/test';

test.describe('QA Agent: Financial System Audit', () => {

  test('End-to-End FS Dashboard and Modules Verification', async ({ page }) => {
    // 1. Agent logs into the system
    await page.goto('/login');
    await page.fill('input[type="text"]', 'superadmin');
    await page.fill('input[type="password"]', 'SUPERadmin!234');
    await page.click('button[type="submit"]');

    // 2. Wait for successful login and navigation to system options
    await expect(page).toHaveURL(/.*\/system-options/);
    
    // 3. Select a company (e.g. JEMT)
    // Assuming there's a button or link with the company name on the system options page
    await page.click('text=JEMT');
    
    // 4. Verify routing to FS Dashboard
    await expect(page).toHaveURL(/.*\/fs/);
    await expect(page.locator('text=Financial System')).toBeVisible({ timeout: 10000 });

    // 5. Verify Chart of Accounts Rendering
    await page.goto('/fs/chart-of-accounts');
    // Check if the Chart of Accounts title/header loads
    await expect(page.locator('text=Chart of Accounts').first()).toBeVisible({ timeout: 10000 });

    // 6. Verify CDV Register Rendering
    await page.goto('/fs/check-disbursement-register');
    // Check if the Check Disbursement Register loads (look for an identifying element or title)
    await expect(page.locator('text=Check Disbursement Register').first()).toBeVisible({ timeout: 10000 });
  });

});
