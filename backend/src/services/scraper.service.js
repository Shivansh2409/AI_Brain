const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Tell Puppeteer to use the Stealth plugin to bypass bot-blockers
puppeteer.use(StealthPlugin());

const scrapeWebpage = async (url) => {
  let browser;
  try {
    console.log(`[Scraper] Firing up headless Chrome for: ${url}`);

    // 1. Launch the hidden browser
    browser = await puppeteer.launch({
      headless: true, // true means it runs invisibly. Set to false if you want to watch it work!
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Prevents crashes on servers
    });

    const page = await browser.newPage();

    // Set a normal looking window size
    await page.setViewport({ width: 1280, height: 800 });

    // 2. Go to the URL and WAIT until the network is quiet (meaning JS finished loading)
    console.log(`[Scraper] Navigating and waiting for React/JS to load...`);
    try {
      // dom content loaded is much faster than network idle2
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

      // Wait just 1.5 extra seconds for React/Angular apps to paint their text
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (navError) {
      console.log(
        `[Scraper] Page is taking too long to fully load. Scraping what we have so far!`,
      );
      // We DO NOT throw the error here. We just let the code continue to step 3!
    }

    // 3. Extract the title
    const title = await page.title();

    // 4. Extract the visible text directly from the browser's DOM
    const content = await page.evaluate(() => {
      // Clean up the page before grabbing text to avoid garbage data
      const elementsToRemove = document.querySelectorAll(
        "script, style, noscript, nav, footer, iframe",
      );
      elementsToRemove.forEach((el) => el.remove());

      // Grab all the human-readable text left on the screen
      return document.body.innerText;
    });

    // We can give Gemini up to ~10,000 characters safely for a good summary
    const trimmedContent = content.substring(0, 10000);

    return { title, content: trimmedContent };
  } catch (error) {
    console.error(`[Scraper] Failed to scrape ${url}:`, error.message);
    return { title: "Unknown Title", content: "Could not extract content." };
  } finally {
    // CRITICAL: You MUST close the browser, even if an error happens.
    // Otherwise, you will have 50 invisible Chrome windows open and your computer will crash!
    if (browser) {
      await browser.close();
      console.log(`[Scraper] Closed browser.`);
    }
  }
};

module.exports = { scrapeWebpage };
