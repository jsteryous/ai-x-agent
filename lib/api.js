export async function callClaude(apiKey, system, userMessage, maxTokens = 400) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ system, message: userMessage, maxTokens }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `API error: ${res.status}`)
  }
  const data = await res.json()
  return data.text
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