/**
 * Vercel Serverless Function: News
 * Fetches and aggregates crypto news from multiple RSS feeds.
 * No API key required — uses public RSS feeds from CoinDesk, CoinTelegraph, etc.
 */

interface NewsItem {
  title: string
  source: string
  publishedAt: number
  url: string
  body: string
  imageUrl?: string
  categories: string[]
}

const FEEDS = [
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml', source: 'CoinDesk' },
  { url: 'https://cointelegraph.com/rss', source: 'CoinTelegraph' },
  { url: 'https://decrypt.co/feed', source: 'Decrypt' },
  { url: 'https://www.theblock.co/rss.xml', source: 'The Block' },
]

function parseRSS(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = []
  const itemRegex = /<item[\s\S]*?<\/item>/g
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[0]
    const title = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
                 || block.match(/<title>([\s\S]*?)<\/title>/)?.[1]
                 || ''
    const link = block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/)?.[1]
               || block.match(/<link>([\s\S]*?)<\/link>/)?.[1]
               || ''
    const desc = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
                || block.match(/<description>([\s\S]*?)<\/description>/)?.[1]
                || ''
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]
    const categories: string[] = []
    const catRegex = /<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/g
    let catMatch: RegExpExecArray | null
    while ((catMatch = catRegex.exec(block)) !== null) {
      categories.push(catMatch[1].trim())
    }

    // Try to extract image from media:content or enclosure
    const imageUrl = block.match(/<media:content[^>]*url="([^"]+)"/)?.[1]
                   || block.match(/<enclosure[^>]*url="([^"]+)"/)?.[1]
                   || block.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1]

    let publishedAt = Date.now()
    if (pubDate) {
      const d = new Date(pubDate.trim())
      if (!isNaN(d.getTime())) publishedAt = d.getTime()
    }

    // Clean HTML from description
    const body = desc.replace(/<[^>]+>/g, '').trim().slice(0, 300)

    if (title && link) {
      items.push({
        title: title.trim(),
        source,
        publishedAt,
        url: link.trim(),
        body,
        imageUrl: imageUrl || undefined,
        categories: categories.length ? categories : [source],
      })
    }
  }

  return items
}

export const config = {
  maxDuration: 20,
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '30')

  try {
    const results = await Promise.all(
      FEEDS.map(async (feed) => {
        try {
          const ctrl = new AbortController()
          const t = setTimeout(() => ctrl.abort(), 8000)
          const res = await fetch(feed.url, {
            signal: ctrl.signal,
            headers: { 'User-Agent': 'TradeX/3.0 (+https://tradingview-web.vercel.app)' },
          })
          clearTimeout(t)
          if (!res.ok) return []
          const xml = await res.text()
          return parseRSS(xml, feed.source)
        } catch {
          return []
        }
      })
    )

    const allNews = results
      .flat()
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, limit)

    // Cache for 5 minutes
    return new Response(JSON.stringify(allNews), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (e: any) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
