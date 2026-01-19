const endpoint = 'https://api.deepseek.com/v1/chat/completions'

async function generateNote(item) {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) return null
  const content = `标题：${item.title || ''}\n摘要：${item.brief || ''}\n内容：${item.content || ''}`
  const body = {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: '你是财经快讯点评助手。用不超过40字中文给出客观、具体的一句话评注。避免套话。' },
      { role: 'user', content }
    ],
    temperature: 0.2,
    max_tokens: 80
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    return null
  }
  const json = await res.json()
  const text = json?.choices?.[0]?.message?.content?.trim()
  return text || null
}

module.exports = { generateNote }
