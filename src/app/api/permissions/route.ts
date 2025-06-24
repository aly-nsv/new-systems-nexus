import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'
import { z } from 'zod'

const createPermissionSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']),
})

export async function GET() {
  try {
    await requireAdmin()
    const permissions = await DatabaseService.getPermissions()
    return NextResponse.json(permissions)
  } catch (error) {
    console.error('GET /api/permissions error:', error)
    
    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    
    const validatedData = createPermissionSchema.parse(body)
    
    const permission = await DatabaseService.addPermission(
      validatedData.email,
      validatedData.role,
      user.id
    )
    
    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    console.error('POST /api/permissions error:', error)
    
    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    )
  }
}