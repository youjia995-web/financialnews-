import Providers from './components/Providers'

export const metadata = {
  title: '财经新闻汇总',
  description: '实时财经电报聚合'
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
