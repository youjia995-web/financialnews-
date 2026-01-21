const endpoint = 'https://api.deepseek.com/v1/chat/completions'

async function chat(messages, options = {}) {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) return null

  const body = {
    model: 'deepseek-chat',
    messages,
    temperature: options.temperature || 0.5,
    max_tokens: options.max_tokens || 2000
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const errorText = await res.text()
      console.error('[deepseek] API error:', res.status, errorText)
      throw new Error(`DeepSeek API Error: ${res.status} - ${errorText}`)
    }
    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('DeepSeek returned empty content')
    }
    return content
  } catch (e) {
    console.error('[deepseek] fetch error:', e.message)
    throw e // Re-throw to let caller handle it
  }
}

async function generateNote(input) {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) return null
  
  let content = ''
  if (typeof input === 'string') {
    content = input
  } else if (input && typeof input === 'object') {
    content = `标题：${input.title || ''}\n摘要：${input.brief || ''}\n内容：${input.content || ''}`
  } else {
    return null
  }

  const messages = [
    { role: 'system', content: '你是财经快讯点评助手。用不超过40字中文给出客观、具体的一句话评注。避免套话。' },
    { role: 'user', content }
  ]
  
  return await chat(messages, { temperature: 0.2, max_tokens: 80 })
}

module.exports = { generateNote, chat }
