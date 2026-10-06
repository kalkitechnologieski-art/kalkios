// == KALKI B6 LEAD GENERATION ==
// Web scraper with puppeteer (optional) and fetch fallback
// Puppeteer is only available in Node.js environments, not during build
// -----------------------------------------------------------------------------

let puppeteer: any = null;
let puppeteerChecked = false;

// Load puppeteer lazily via runtime require so bundlers (Turbopack/webpack)
// never attempt to resolve it at build time
function loadPuppeteer(): any {
  if (puppeteerChecked) return puppeteer;
  puppeteerChecked = true;
  if (typeof window !== 'undefined') return null;
  try {
    const req = eval('require');
    puppeteer = req('puppeteer');
  } catch {
    console.warn('[Scraper] Puppeteer not available, using fetch fallback');
    puppeteer = null;
  }
  return puppeteer;
}

let browser: any = null;

async function getBrowser(): Promise<any> {
  const pptr = loadPuppeteer();
  if (!pptr) {
    throw new Error('Puppeteer not available');
  }

  if (browser) return browser;
  browser = await pptr.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  return browser;
}

/**
 * Scrape a website using puppeteer or fetch fallback
 */
export async function scrapeWebsite(url: string): Promise<string> {
  // Try puppeteer first
  if (loadPuppeteer()) {
    try {
      const browser = await getBrowser();
      let page = await browser.newPage();
      try {
        await page.setDefaultNavigationTimeout(15000);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const text = await page.evaluate(() => {
          document.querySelectorAll('script, style, noscript').forEach(el => el.remove());
          const selectors = ['main', 'article', '.content', '.main-content', '#content', '.contact', '.about', '.team', '.footer'];
          let combined = '';
          for (const selector of selectors) {
            document.querySelectorAll(selector).forEach(el => { combined += el.textContent + '\n'; });
          }
          if (!combined.trim()) combined = document.body.textContent || '';
          return combined;
        });
        return text || '';
      } finally {
        await page.close();
      }
    } catch (error) {
      console.error(`[Scraper] Puppeteer failed for ${url}, trying fetch:`, error);
      // Fall through to fetch method
    }
  }

  // Fallback: Use fetch API
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KALKI Bot/1.0)',
      },
    });
    
    if (!response.ok) {
      console.warn(`[Scraper] Fetch failed for ${url}: ${response.status}`);
      return '';
    }
    
    const html = await response.text();
    
    // Simple HTML parsing (extract text content)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text.slice(0, 10000); // Limit to 10KB
  } catch (error) {
    console.error(`[Scraper] All methods failed for ${url}:`, error);
    return '';
  }
}

/**
 * Scrape multiple websites with concurrency control
 */
export async function scrapeWebsites(urls: string[], concurrency: number = 5): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const queue = [...urls];
  const workers: Promise<void>[] = [];

  const worker = async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;
      const content = await scrapeWebsite(url);
      results.set(url, content);
    }
  };

  for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

/**
 * Close the browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    try {
      await browser.close();
    } catch {
      // Ignore errors during cleanup
    }
    browser = null;
  }
}
