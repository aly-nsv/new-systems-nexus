import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    await requireAuth()
    
    const users = await DatabaseService.getUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}