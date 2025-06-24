import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'
import { z } from 'zod'

const updatePermissionSchema = z.object({
  role: z.enum(['admin', 'member']),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await requireAdmin()
    const body = await request.json()
    
    const validatedData = updatePermissionSchema.parse(body)
    
    const permission = await DatabaseService.updatePermission(
      id,
      validatedData.role
    )
    
    return NextResponse.json(permission)
  } catch (error) {
    console.error('PUT /api/permissions/[id] error:', error)
    
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
      { error: 'Failed to update permission' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await requireAdmin()
    await DatabaseService.deletePermission(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/permissions/[id] error:', error)
    
    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    )
  }
}