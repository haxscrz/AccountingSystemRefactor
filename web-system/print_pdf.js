import puppeteer from 'puppeteer';
import path from 'path';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Navigate to local HTML file
  const filePath = `file:///${path.resolve('month_end_manual.html').replace(/\\/g, '/')}`;
  console.log("Opening " + filePath);
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Generate PDF
  const pdfPath = path.resolve('month_end_manual.pdf');
  console.log("Saving PDF to " + pdfPath);
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '20px',
      bottom: '20px',
      left: '20px',
      right: '20px'
    }
  });

  await browser.close();
  console.log("PDF Created Successfully!");
}

run().catch(console.error);
