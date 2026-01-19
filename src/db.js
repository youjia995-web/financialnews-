const path = require('path')
const fs = require('fs')
const Loki = require('lokijs')

const dbFile = path.join(process.cwd(), 'data.loki')
const db = new Loki(dbFile, {
  autoload: true,
  autoloadCallback: init,
  autosave: false, // Next.js 中不仅读，还会写？暂时关掉 autosave，避免冲突，由操作者手动 save
  autosaveInterval: 5000
})

function init() {
  let news = db.getCollection('news')
  if (!news) {
    news = db.addCollection('news', { unique: ['id'], indices: ['source', 'published_at'] })
  }
}

function getDB() {
  if (!db.getCollection('news')) init()
  return db
}

module.exports = getDB()
