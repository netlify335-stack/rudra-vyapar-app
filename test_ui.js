const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  page.on('requestfailed', request => {
    console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log("Navigating to production site...");
  await page.goto('https://rudra-vyapar.vercel.app/dashboard', { waitUntil: 'networkidle2' });
  
  // Wait for the floating AI button to appear and click it
  await page.waitForSelector('button.rounded-full.bg-gradient-to-r');
  await page.click('button.rounded-full.bg-gradient-to-r');
  
  // Wait for chat window
  await page.waitForSelector('input[placeholder="Message Rudra AI..."]');
  
  console.log("Sending message...");
  await page.type('input[placeholder="Message Rudra AI..."]', 'Hello');
  
  // Find send button (it's the button inside the form that has type="submit")
  await page.click('button[type="submit"]');
  
  console.log("Waiting for response...");
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
  console.log("Done");
})();
