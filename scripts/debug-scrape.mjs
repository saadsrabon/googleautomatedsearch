import puppeteer from "puppeteer";
import path from "node:path";

const query =
  'site:instagram.com "dentist" "@gmail.com" OR "@yahoo.com"';
const userDataDir = path.resolve(".puppeteer-profile");

const browser = await puppeteer.launch({
  headless: false,
  userDataDir,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
await page.goto(
  `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`,
  { waitUntil: "networkidle2", timeout: 120000 }
);

const info = await page.evaluate(() => {
  const body = document.body.innerText.slice(0, 500);
  const blocked =
    body.toLowerCase().includes("unusual traffic") ||
    body.toLowerCase().includes("not a robot");
  const selectors = {
    "div.g": document.querySelectorAll("div.g").length,
    "#rso h3": document.querySelectorAll("#rso h3").length,
    "h3": document.querySelectorAll("h3").length,
    "a h3": document.querySelectorAll("a h3").length,
  };
  const samples = [...document.querySelectorAll("a h3")]
    .slice(0, 5)
    .map((h) => {
      const a = h.closest("a");
      return { title: h.textContent?.trim(), href: a?.href };
    });
  return { url: location.href, blocked, selectors, samples, bodyStart: body };
});

console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "debug-scrape.png" });
await browser.close();
