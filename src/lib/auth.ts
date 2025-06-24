import { auth } from '@clerk/nextjs/server'

export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  return {
    id: userId,
    email: '', // Will be populated from Clerk client
    firstName: '',
    lastName: '',
  }
}

export function isAllowedEmail(email: string): boolean {
  const allowedDomain = process.env.ALLOWED_DOMAIN || 'newsystemventures.com'
  return email.endsWith(`@${allowedDomain}`)
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  
  if (!isAllowedEmail(user.email)) {
    throw new Error('Forbidden: Admin access required')
  }

  return user
}