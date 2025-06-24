import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'
import { z } from 'zod'

const viewFilterSchema = z.object({
  column: z.enum(['companyName', 'dealStage', 'contactPerson', 'contactEmail', 'dealValue', 'lastUpdated']),
  operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'gt', 'gte', 'lt', 'lte']),
  value: z.union([z.string(), z.number(), z.date()]),
})

const updateViewSchema = z.object({
  name: z.string().min(1, 'View name is required').optional(),
  filters: z.array(viewFilterSchema).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const validatedData = updateViewSchema.parse(body)
    
    const view = await DatabaseService.updateView(
      id,
      validatedData,
      user.id
    )
    
    return NextResponse.json(view)
  } catch (error) {
    console.error('PUT /api/views/[id] error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update view' },
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
    const user = await requireAuth()
    await DatabaseService.deleteView(id, user.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/views/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete view' },
      { status: 500 }
    )
  }
}