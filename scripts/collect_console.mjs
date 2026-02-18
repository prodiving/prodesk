import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    try {
      console.log(`[PAGE CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    } catch (e) {
      console.log('[PAGE CONSOLE] (unable to read message)');
    }
  });

  page.on('pageerror', (err) => {
    console.log('[PAGE ERROR]', err && err.stack ? err.stack : String(err));
  });

  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  } catch (err) {
    console.log('[NAV ERROR]', err);
  }

  await browser.close();
})();
