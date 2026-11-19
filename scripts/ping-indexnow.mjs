#!/usr/bin/env node
// Ping IndexNow and Bing with the live sitemap after a production deploy.
// The key file must already be reachable at https://www.kalki-intelligence.in/<key>.txt

const KEY = '7f3a9c2e1b84d056a1c8e4b27d90f6ab'
const HOST = 'www.kalki-intelligence.in'
const SITE = `https://${HOST}`
const SITEMAP = `${SITE}/sitemap.xml`

async function main() {
  const keyRes = await fetch(`${SITE}/${KEY}.txt`)
  const keyBody = (await keyRes.text()).trim()
  if (!keyRes.ok || keyBody !== KEY) {
    console.error(`IndexNow key file check failed: HTTP ${keyRes.status}`)
    process.exit(1)
  }

  const sitemapRes = await fetch(SITEMAP)
  if (!sitemapRes.ok) {
    console.error(`Sitemap fetch failed: HTTP ${sitemapRes.status}`)
    process.exit(1)
  }
  const xml = await sitemapRes.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim())
  if (urls.length === 0) {
    console.error('Sitemap contained no URLs')
    process.exit(1)
  }

  const indexNow = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList: urls,
    }),
  })
  console.log(`IndexNow ${indexNow.status} for ${urls.length} URLs`)
  const indexBody = await indexNow.text()
  if (indexBody) console.log(indexBody.slice(0, 500))

  const bing = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`)
  console.log(`Bing sitemap ping ${bing.status}`)

  if (indexNow.status !== 200 && indexNow.status !== 202) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
