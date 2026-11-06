const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Tell Puppeteer to use the Stealth plugin to bypass bot-blockers
puppeteer.use(StealthPlugin());

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

// Bot-protection / error pages we should never save as "content"
const BLOCKED_PAGE =
  /just a moment|attention required|access denied|verify you are human|are you a robot|captcha|enable javascript and cookies|request blocked/i;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** True when a scrape produced nothing worth summarising. */
const isEmpty = (r) =>
  !r || (!r.title && !r.description && !r.image && r.content.trim().length < 50);

/** One attempt with headless Chrome. */
async function loadWithBrowser(browser, url, { waitUntil, timeout, settleMs }) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 800 });
    let status = null;
    try {
      const response = await page.goto(url, { waitUntil, timeout });
      status = response?.status() ?? null;
      // Give React/Angular apps a moment to paint their text
      await wait(settleMs);
    } catch {
      console.log(`[Scraper] Page is slow to load; scraping what we have so far.`);
    }

    const data = await page.evaluate(() => {
      const meta = (selector) =>
        document.querySelector(selector)?.getAttribute("content")?.trim() || "";
      const absolute = (src) => {
        try {
          return src ? new URL(src, location.href).href : "";
        } catch {
          return "";
        }
      };

      const result = {
        docTitle: document.title?.trim() || "",
        ogTitle: meta('meta[property="og:title"]') || meta('meta[name="twitter:title"]'),
        description:
          meta('meta[property="og:description"]') ||
          meta('meta[name="description"]') ||
          meta('meta[name="twitter:description"]'),
        image: absolute(meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]')),
      };

      // Remove page chrome before grabbing the readable text
      document
        .querySelectorAll(
          'script, style, noscript, nav, footer, iframe, svg, body > header, [role="banner"], [role="navigation"], [aria-modal="true"]',
        )
        .forEach((el) => el.remove());
      result.text = document.body?.innerText || "";
      return result;
    });

    const blocked =
      (status !== null && status >= 400) ||
      BLOCKED_PAGE.test(`${data.docTitle} ${data.text.slice(0, 400)}`);

    return {
      title: data.ogTitle || data.docTitle,
      description: data.description,
      image: data.image,
      content: data.text.replace(/\n{3,}/g, "\n\n").substring(0, 10000),
      status,
      blocked,
    };
  } finally {
    await page.close().catch(() => {});
  }
}

/** Last resort: plain HTTP request, read the link-preview (Open Graph) tags. */
async function loadMetadataOnly(url) {
  try {
    const { data: html, status } = await axios.get(url, {
      timeout: 15000,
      maxContentLength: 5 * 1024 * 1024,
      headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
      validateStatus: () => true,
    });
    if (typeof html !== "string") return null;
    const $ = cheerio.load(html);
    const meta = (selector) => $(selector).attr("content")?.trim() || "";
    const image = meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]');
    const result = {
      title:
        meta('meta[property="og:title"]') ||
        meta('meta[name="twitter:title"]') ||
        $("title").first().text().trim(),
      description:
        meta('meta[property="og:description"]') || meta('meta[name="description"]'),
      image: image ? new URL(image, url).href : "",
      content: "",
      status,
      blocked: status >= 400 || BLOCKED_PAGE.test($("title").first().text()),
    };
    return result.blocked ? null : result;
  } catch (error) {
    console.log(`[Scraper] Metadata fetch failed: ${error.message}`);
    return null;
  }
}

/**
 * Returns { title, description, image, content } for a web page.
 * Throws if nothing usable could be read, so the job is retried instead of
 * saving an empty item.
 */
const scrapeWebpage = async (url) => {
  let browser;
  let result = null;
  try {
    console.log(`[Scraper] Firing up headless Chrome for: ${url}`);
    browser = await puppeteer.launch({
      headless: true,
      // --no-sandbox: Chromium's sandbox needs privileges a container doesn't have.
      // --disable-dev-shm-usage: write shared memory to /tmp if /dev/shm is small.
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });

    // Attempt 1: fast. Attempt 2: wait for the network to go quiet (slow / JS-heavy sites).
    const attempts = [
      { waitUntil: "domcontentloaded", timeout: 15000, settleMs: 1500 },
      { waitUntil: "networkidle2", timeout: 30000, settleMs: 2500 },
    ];
    for (const [i, options] of attempts.entries()) {
      console.log(`[Scraper] Attempt ${i + 1}: loading page (${options.waitUntil})…`);
      const attempt = await loadWithBrowser(browser, url, options);
      if (!attempt.blocked && !isEmpty(attempt)) {
        result = attempt;
        break;
      }
      console.log(
        `[Scraper] Attempt ${i + 1} got ${attempt.blocked ? "a blocked/error page" : "an empty page"} (status ${attempt.status ?? "?"}).`,
      );
      if (i < attempts.length - 1) await wait(2000);
    }
  } catch (error) {
    console.error(`[Scraper] Browser error for ${url}:`, error.message);
  } finally {
    // CRITICAL: always close the browser, even if an error happens.
    if (browser) {
      await browser.close().catch(() => {});
      console.log(`[Scraper] Closed browser.`);
    }
  }

  if (!result) {
    console.log(`[Scraper] Falling back to the page's link-preview tags…`);
    result = await loadMetadataOnly(url);
  }

  if (isEmpty(result)) {
    let host = url;
    try {
      host = new URL(url).hostname;
    } catch {
      // keep the raw url
    }
    throw new Error(
      `Couldn't read ${host}: the page was empty, blocked, or needs a login.`,
    );
  }

  return {
    title: result.title || "",
    description: result.description || "",
    image: result.image || "",
    content: result.content || "",
  };
};

module.exports = { scrapeWebpage };
