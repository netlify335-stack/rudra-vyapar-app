const puppeteer = require('puppeteer-core');
const fs = require('fs');

const paths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];
let executablePath = paths.find(p => fs.existsSync(p));

(async () => {
  const browser = await puppeteer.launch({ executablePath, headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  page.on('requestfailed', request => {
    console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log("Navigating to localhost...");
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('button.rounded-full.bg-gradient-to-r');
  await page.click('button.rounded-full.bg-gradient-to-r');
  
  await page.waitForSelector('input[placeholder="Message Rudra AI..."]');
  console.log("Sending message...");
  await page.type('input[placeholder="Message Rudra AI..."]', 'Hello, reply with 1 word');
  await page.click('button[type="submit"]');
  
  console.log("Waiting for response...");
  await new Promise(r => setTimeout(r, 8000));
  
  await browser.close();
  console.log("Done");
  process.exit(0);
})();
