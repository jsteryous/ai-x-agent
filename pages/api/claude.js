export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  
    const { system, message, maxTokens = 400 } = req.body
  
    if (!system || !message) {
      return res.status(400).json({ error: 'Missing system or message' })
    }
  
    const apiKey = req.headers['x-api-key']
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing API key' })
    }
  
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: message }],
        }),
      })
  
      const data = await response.json()
  
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || 'API error' })
      }
  
      const text = data.content?.[0]?.text?.trim()
      return res.status(200).json({ text })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }