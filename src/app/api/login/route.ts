import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, authCookieValue } from '@/lib/auth'

const PASSWORD = process.env.SALARY_TRACKER_PASSWORD

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  if (password === PASSWORD) {
    const response = NextResponse.json({ success: true })
    response.cookies.set(AUTH_COOKIE_NAME, authCookieValue(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })
    return response
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
