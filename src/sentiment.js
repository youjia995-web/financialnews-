const POSITIVE = ['涨停', '增持', '上调', '突破', '获批', '签约', '盈利', '扭亏', '创历史新高', '强势']
const NEGATIVE = ['停牌', '处罚', '下调', '亏损', '爆雷', '被调查', '违约', '跌停', '裁员', '风险']

function score(text) {
  if (!text) return 0
  const t = String(text)
  let s = 0
  for (const k of POSITIVE) if (t.includes(k)) s += 1
  for (const k of NEGATIVE) if (t.includes(k)) s -= 1
  return s
}

function derive(item) {
  const s = score(`${item.title || ''} ${item.brief || ''} ${item.content || ''}`)
  return { score: s }
}

module.exports = { derive }
