import puppeteer, { Browser } from 'puppeteer'

let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (browser) return browser
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
  return browser
}

export async function scrapeWebsite(url: string): Promise<string> {
  const browser = await getBrowser()
  let page = await browser.newPage()
  try {
    await page.setDefaultNavigationTimeout(15000)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const text = await page.evaluate(() => {
      document.querySelectorAll('script, style, noscript').forEach(el => el.remove())
      const selectors = ['main', 'article', '.content', '.main-content', '#content', '.contact', '.about', '.team', '.footer']
      let combined = ''
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach(el => { combined += el.textContent + '\n' })
      }
      if (!combined.trim()) combined = document.body.textContent || ''
      return combined
    })
    return text || ''
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return ''
  } finally {
    await page.close()
  }
}

export async function scrapeWebsites(urls: string[], concurrency: number = 5): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  const queue = [...urls]
  const workers: Promise<void>[] = []
  const worker = async () => {
    while (queue.length > 0) {
      const url = queue.shift()
      if (!url) break
      const content = await scrapeWebsite(url)
      results.set(url, content)
    }
  }
  for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
    workers.push(worker())
  }
  await Promise.all(workers)
  return results
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
  }
}
