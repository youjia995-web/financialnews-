import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // 1. 如果访问登录页面，且已登录，重定向到首页
  if (pathname.startsWith('/login')) {
    if (token) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // 2. 如果未登录，且不是 API 或静态资源，重定向到登录页
  // 这里我们保护首页 '/' 和其他页面，除了 api/auth, login, _next, public files
  if (!token) {
    if (pathname.startsWith('/api/auth') || 
        pathname.startsWith('/_next') || 
        pathname.includes('.')) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 3. 如果访问 /admin 路由，必须是 ADMIN 角色
  if (pathname.startsWith('/admin')) {
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
