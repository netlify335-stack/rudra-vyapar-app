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
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('button.rounded-full.bg-gradient-to-r');
  await page.click('button.rounded-full.bg-gradient-to-r');
  
  await page.waitForSelector('input[placeholder="Message Rudra AI..."]');
  await page.type('input[placeholder="Message Rudra AI..."]', 'Hello, reply with exactly the word "BANANA"');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 6000));
  
  // Extract all chat messages text
  const fullText = await page.evaluate(() => {
    const container = document.querySelector('.flex-1.overflow-y-auto');
    return container ? container.innerText : "CONTAINER NOT FOUND";
  });
  
  console.log("CHAT WINDOW TEXT:", fullText);
  
  await browser.close();
  process.exit(0);
})();
