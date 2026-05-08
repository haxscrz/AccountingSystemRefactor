# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fs-agent.spec.ts >> QA Agent: Financial System Audit >> End-to-End FS Dashboard and Modules Verification
- Location: tests/fs-agent.spec.ts:5:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="text"]')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('QA Agent: Financial System Audit', () => {
  4  | 
  5  |   test('End-to-End FS Dashboard and Modules Verification', async ({ page }) => {
  6  |     // 1. Agent logs into the system
  7  |     await page.goto('/login');
> 8  |     await page.fill('input[type="text"]', 'superadmin');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  9  |     await page.fill('input[type="password"]', 'SUPERadmin!234');
  10 |     await page.click('button[type="submit"]');
  11 | 
  12 |     // 2. Wait for successful login and navigation to system options
  13 |     await expect(page).toHaveURL(/.*\/system-options/);
  14 |     
  15 |     // 3. Select a company (e.g. JEMT)
  16 |     // Assuming there's a button or link with the company name on the system options page
  17 |     await page.click('text=JEMT');
  18 |     
  19 |     // 4. Verify routing to FS Dashboard
  20 |     await expect(page).toHaveURL(/.*\/fs/);
  21 |     await expect(page.locator('text=Financial System')).toBeVisible({ timeout: 10000 });
  22 | 
  23 |     // 5. Verify Chart of Accounts Rendering
  24 |     await page.goto('/fs/chart-of-accounts');
  25 |     // Check if the Chart of Accounts title/header loads
  26 |     await expect(page.locator('text=Chart of Accounts').first()).toBeVisible({ timeout: 10000 });
  27 | 
  28 |     // 6. Verify CDV Register Rendering
  29 |     await page.goto('/fs/check-disbursement-register');
  30 |     // Check if the Check Disbursement Register loads (look for an identifying element or title)
  31 |     await expect(page.locator('text=Check Disbursement Register').first()).toBeVisible({ timeout: 10000 });
  32 |   });
  33 | 
  34 | });
  35 | 
```