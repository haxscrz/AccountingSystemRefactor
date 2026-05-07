// pdf_from_html.js — Headless PDF generation via Puppeteer (no browser interaction needed)
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, 'advance_cdv_report.html');
const pdfPath  = path.resolve(__dirname, 'Advance_CDV_Report.pdf');

console.log('Launching headless browser…');
const browser = await puppeteer.launch({ headless: true });
const page    = await browser.newPage();

// Load the local HTML file (allows local fonts/styles to resolve)
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle2', timeout: 30000 });

// Small pause to let Google Fonts finish (fallback: inline fonts are already embedded in the HTML)
await new Promise(r => setTimeout(r, 1500));

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,       // preserve all background colours/gradients
  margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  displayHeaderFooter: false,
});

await browser.close();
console.log(`✅ PDF saved to: ${pdfPath}`);
