const path = require('path')
const Loki = require('lokijs')

// 为了避免 Next.js 模块缓存导致的单例问题，以及多进程锁问题，
// 这里每次请求都新建一个只读的 DB 实例来加载文件。
// 虽然效率稍低，但对于几十 KB 的 JSON 文件来说，这是最稳妥的“无状态”读取方式。
async function getNewsCol() {
  return new Promise((resolve, reject) => {
    const dbFile = path.join(process.cwd(), 'data.loki')
    const tempDB = new Loki(dbFile, {
      autoload: true,
      autoloadCallback: () => {
        let col = tempDB.getCollection('news')
        if (!col) {
          col = tempDB.addCollection('news', { unique: ['id'], indices: ['source', 'published_at'] })
        }
        // 挂载一个 save 方法，方便调用者手动持久化
        col.save = () => {
          return new Promise((res, rej) => {
            tempDB.saveDatabase((err) => {
              if (err) rej(err)
              else res()
            })
          })
        }
        resolve(col)
      }
    })
  })
}

module.exports = { getNewsCol }
