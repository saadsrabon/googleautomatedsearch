import puppeteer from "puppeteer";

const query =
  'site:instagram.com "dentist" "@gmail.com" OR "@yahoo.com" OR "@hotmail.com"';

const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`;

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
await page.setUserAgent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
);
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

const info = await page.evaluate(() => ({
  title: document.title,
  bodySample: document.body.innerText.slice(0, 800),
  gCount: document.querySelectorAll("div.g").length,
  h3Count: document.querySelectorAll("h3").length,
  links: [...document.querySelectorAll("a[href^='http']")]
    .slice(0, 8)
    .map((a) => ({ text: a.textContent?.trim().slice(0, 40), href: a.href })),
}));

console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "debug-google.png", fullPage: false });
await browser.close();
console.log("Screenshot: debug-google.png");
