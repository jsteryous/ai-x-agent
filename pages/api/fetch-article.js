import { Readability } from '@mozilla/readability'
import { parse } from 'node-html-parser'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'Missing url' })

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)

    const html = await response.text()
    const root = parse(html)

    // Remove noise
    root.querySelectorAll('script, style, nav, footer, header, aside, .ad, .advertisement, .cookie-banner').forEach(el => el.remove())

    const cleanHtml = root.toString()

    // Use Readability to extract main content
    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM(cleanHtml, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article?.textContent) {
      throw new Error('Could not extract article content')
    }

    // Trim to ~2000 chars to keep token cost low
    const text = article.textContent
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000)

    return res.status(200).json({
      title: article.title,
      text,
      excerpt: article.excerpt,
    })

    
  } catch (err) {
    return res.status(200).json({ text: null, error: err.message })
  }
}

export async function fetchArticle(url) {
    try {
      const res = await fetch('/api/fetch-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      return data.text || null
    } catch {
      return null
    }
  }