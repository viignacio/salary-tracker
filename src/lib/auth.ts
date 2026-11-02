import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

export const AUTH_COOKIE_NAME = 'salary_auth'

// shortcut: the token is a fixed HMAC of the shared password, not a rotating
// per-login session. Fine for one household password with no user accounts;
// upgrade to random per-session tokens if accounts are ever added.
function expectedToken() {
  return createHmac('sha256', process.env.SALARY_TRACKER_PASSWORD ?? '')
    .update(AUTH_COOKIE_NAME)
    .digest('hex')
}

export function authCookieValue() {
  return expectedToken()
}

export async function isAuthenticated() {
  const cookie = (await cookies()).get(AUTH_COOKIE_NAME)
  if (!cookie) return false
  const expected = Buffer.from(expectedToken())
  const actual = Buffer.from(cookie.value)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
