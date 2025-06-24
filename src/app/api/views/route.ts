import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'
import { z } from 'zod'

const viewFilterSchema = z.object({
  column: z.enum(['companyName', 'dealStage', 'contactPerson', 'contactEmail', 'dealValue', 'lastUpdated']),
  operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'gt', 'gte', 'lt', 'lte']),
  value: z.union([z.string(), z.number(), z.date()]),
})

const createViewSchema = z.object({
  name: z.string().min(1, 'View name is required'),
  filters: z.array(viewFilterSchema),
})

export async function GET() {
  try {
    const user = await requireAuth()
    const views = await DatabaseService.getViews(user.id)
    return NextResponse.json(views)
  } catch (error) {
    console.error('GET /api/views error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch views' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const validatedData = createViewSchema.parse(body)
    
    const view = await DatabaseService.createView(
      {
        name: validatedData.name,
        filters: validatedData.filters,
        userId: user.id,
        isDefault: false,
      },
      user.id
    )
    
    return NextResponse.json(view, { status: 201 })
  } catch (error) {
    console.error('POST /api/views error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create view' },
      { status: 500 }
    )
  }
}