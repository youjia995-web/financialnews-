const API_URL = 'https://api.tavily.com/search'

async function search(query, options = {}) {
  const key = process.env.TAVILY_API_KEY
  if (!key) {
    throw new Error('TAVILY_API_KEY is missing')
  }

  const body = {
    api_key: key,
    query: query,
    search_depth: 'basic',
    include_answer: true,
    max_results: options.max_results || 5,
    ...options
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (!res.ok) {
      throw new Error(`Tavily API error: ${res.status} ${await res.text()}`)
    }

    const json = await res.json()
    return json
  } catch (e) {
    console.error('[tavily] search failed:', e.message)
    return null
  }
}

module.exports = { search }
