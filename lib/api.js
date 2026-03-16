import { CLAUDE_MODEL } from './constants'

export async function callClaude(apiKey, system, userMessage, maxTokens = 400) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text?.trim()
}

export function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

export function storage() {
  const isClient = typeof window !== 'undefined'
  return {
    get: (key) => {
      if (!isClient) return null
      try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
    },
    set: (key, val) => {
      if (!isClient) return
      localStorage.setItem(key, JSON.stringify(val))
    },
  }
}
