import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const BRAIN_DIR = 'C:\\Users\\hans\\.gemini\\antigravity\\brain\\0d631ef8-0881-44fc-b979-6c30159195f0';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Viewport for nice screenshots
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to login...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Login
  console.log("Logging in...");
  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', 'superadmin');
  await page.type('input[type="password"]', 'SUPERadmin!234');
  await page.click('button[type="submit"]');

  // Wait for company selection
  console.log("Waiting for company selection...");
  await page.waitForSelector('text/Superadmin Mode', { timeout: 10000 }).catch(() => {});
  // Alternatively just click the first button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.innerText.includes('Superadmin') || b.innerText.includes('Select') || b.innerText.includes('Enter'));
    if (loginBtn) loginBtn.click();
  });

  // Wait for Dashboard to load
  console.log("Waiting for Dashboard...");
  await page.waitForSelector('text/FS System', { timeout: 10000 });
  
  // Click FS System
  const [fsLink] = await page.$x("//button[contains(., 'FS System')] | //a[contains(., 'FS System')] | //*[contains(text(), 'FS System')]");
  if (fsLink) await fsLink.click();

  console.log("Waiting for Administration -> Month-End Processing...");
  // Now we need to click Month-End Processing in the sidebar
  await page.waitForXPath("//div[contains(text(), 'Administration')] | //*[contains(text(), 'Administration')]");
  
  // Try clicking it if it's an accordion
  const [adminSpan] = await page.$x("//span[contains(text(), 'Administration')] | //div[contains(text(), 'Administration')]");
  if (adminSpan) await adminSpan.click();

  await new Promise(r => setTimeout(r, 1000)); // wait for animation
  const [monthEnd] = await page.$x("//*[contains(text(), 'Month-End Processing')]");
  if (monthEnd) await monthEnd.click();

  await new Promise(r => setTimeout(r, 1000));
  await page.waitForSelector('text/Confirm Period', { timeout: 10000 });
  
  // Take first screenshot
  console.log("Taking screenshot 1...");
  await page.screenshot({ path: path.join(BRAIN_DIR, 'step1.png') });

  // Find the required text
  // The system info might be loading, let's wait a bit
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'step1.png') }); // retake after loading

  // type the period into the input
  // E.g. looking for placeholder
  const input = await page.$('input[placeholder]');
  if (input) {
      const placeholder = await page.evaluate(el => el.getAttribute('placeholder'), input);
      console.log("Typing: " + placeholder);
      await input.type(placeholder);
      
      const [confirmBtn] = await page.$x("//button[contains(text(), 'Confirm')]");
      if (confirmBtn) await confirmBtn.click();
      
      await new Promise(r => setTimeout(r, 1000));
      console.log("Taking screenshot 2...");
      await page.screenshot({ path: path.join(BRAIN_DIR, 'step2.png') });
  }

  await browser.close();
  console.log("Done!");
}

run().catch(console.error);
