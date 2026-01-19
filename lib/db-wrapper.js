const path = require('path')
const Loki = require('lokijs')

// 为了避免 Next.js 模块缓存导致的单例问题，以及多进程锁问题，
// 这里每次请求都新建一个只读的 DB 实例来加载文件。
// 虽然效率稍低，但对于几十 KB 的 JSON 文件来说，这是最稳妥的“无状态”读取方式。
async function getNewsCol() {
  return new Promise((resolve, reject) => {
    // 优先使用环境变量指定的路径（适配 Zeabur 挂载卷），否则回退到当前目录
    const dbFile = process.env.LOKI_FILE_PATH || path.join(process.cwd(), 'data.loki')
    
    // 显式配置，不使用 autoload，手动控制加载过程
    const tempDB = new Loki(dbFile, {})

    tempDB.loadDatabase({}, (err) => {
      if (err) {
        // 如果是文件不存在导致的错误，通常 Loki 会自动处理为空库，
        // 但如果文件损坏，这里会报错。
        console.error('[db-wrapper] loadDatabase error:', err)
        // 尝试删除损坏文件并重建（可选，或者直接 reject）
        // 这里为了健壮性，我们 reject，让上层处理或重试
        // 但考虑到生产环境，如果文件坏了，重建一个空的可能更好？
        // 暂时 reject
        return reject(err)
      }

      let col = tempDB.getCollection('news')
      if (!col) {
        col = tempDB.addCollection('news', { unique: ['id'], indices: ['source', 'published_at'] })
      }

      // 挂载 save 方法
      col.save = () => {
        return new Promise((res, rej) => {
          tempDB.saveDatabase((saveErr) => {
            if (saveErr) rej(saveErr)
            else res()
          })
        })
      }
      
      resolve(col)
    })
  })
}

module.exports = { getNewsCol }
