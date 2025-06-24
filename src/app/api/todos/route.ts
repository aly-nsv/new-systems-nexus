import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'
import { z } from 'zod'
import { PriorityEnum } from '@/types'

const createTodoSchema = z.object({
  task: z.string().min(1, 'Task is required'),
  priority: z.enum(['1 - Highest', '2 - High', '3 - Medium', '4 - Low', '0 - On Hold']).optional(),
  assigneeId: z.string().uuid().optional(),
  pipelineId: z.string().uuid().optional(),
  dateAssigned: z.string().pipe(z.coerce.date()).optional(),
  dateCompleted: z.string().pipe(z.coerce.date()).optional(),
  done: z.boolean().default(false),
  notes: z.string().optional(),
})

const todoQuerySchema = z.object({
  assigneeId: z.string().optional(),
  pipelineId: z.string().optional(),
  done: z.string().optional(),
  priority: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const query = todoQuerySchema.parse(Object.fromEntries(searchParams))
    
    const filters = {
      assigneeId: query.assigneeId,
      pipelineId: query.pipelineId,
      done: query.done ? query.done === 'true' : undefined,
      priority: query.priority ? query.priority.split(',') as PriorityEnum[] : undefined,
    }
    
    const pagination = {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    }
    
    const result = await DatabaseService.getTodos(filters, pagination)
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/todos error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const validatedData = createTodoSchema.parse(body)
    
    const todo = await DatabaseService.createTodo(validatedData, user.id)
    
    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    console.error('POST /api/todos error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    )
  }
}