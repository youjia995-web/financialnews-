const prisma = require('./lib/prisma');
const eastmoney = require('./src/fetchers/eastmoney');

const { runOnce } = eastmoney;

const { deleteMany } = prisma.news

const { news } = prisma

const testTime = async () => {
  console.log('当前时间:', new Date().toLocaleString());
  
  // 删除旧数据
  const result = await news.deleteMany({ where: { source: 'eastmoney' } });
  console.log('已删除', result.count, '条旧数据');
  
  // 重新抓取
  const count = await runOnce();
  console.log('重新抓取', count, '条数据');
  
  // 验证时间
  const items = await news.findMany({
    where: { source: 'eastmoney' },
    orderBy: { published_at: 'desc' },
    take: 3
  });
  
  console.log('');
  console.log('当前时间:', new Date().toLocaleString());
  items.forEach(item => {
    const diff = Math.floor((Date.now() - Number(item.published_at)) / 60000);
    console.log('时间差:', diff, '分钟前 | 标题:', item.title.substring(0, 30));
  }
  
  await prisma.$disconnect();
})();

testTime();
