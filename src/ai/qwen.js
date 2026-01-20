const endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

/**
 * 调用通义千问 API 生成内容
 * @param {string | object[]} input - 提示词字符串或消息数组
 * @param {object} options - 额外参数
 * @returns {Promise<string | null>} 生成的文本
 */
async function generate(input, options = {}) {
  const key = process.env.QWEN_API_KEY
  if (!key) {
    console.error('[qwen] API key missing')
    return null
  }

  let messages = []
  if (typeof input === 'string') {
    messages = [
      { role: 'system', content: '你是专业的AI财经情报官，擅长分析市场脉络、宏观情绪和板块轮动。' },
      { role: 'user', content: input }
    ]
  } else if (Array.isArray(input)) {
    messages = input
  }

  const body = {
    model: 'qwen-max',
    messages,
    temperature: options.temperature || 0.5,
    max_tokens: options.max_tokens || 2000,
    ...options
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
      console.error('[qwen] API error:', res.status, await res.text())
      return null
    }

    const json = await res.json()
    return json?.choices?.[0]?.message?.content?.trim() || null
  } catch (e) {
    console.error('[qwen] fetch error:', e.message)
    return null
  }
}

module.exports = { generate }
