import { cookies } from 'next/headers'

export async function isAuthenticated() {
  const cookie = (await cookies()).get('salary_auth')
  return cookie?.value === 'authenticated'
}
