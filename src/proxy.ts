import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'ALLOWALL')
  response.headers.set('Content-Security-Policy', 'frame-ancestors *')

  return response
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
