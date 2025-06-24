import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'
import { z } from 'zod'

const updateCompanySchema = z.object({
  companyName: z.string().min(1, 'Company name is required').optional(),
  dealStage: z.enum(['Prospect', 'Qualification', 'Proposal', 'Negotiation', 'Closed-Won', 'Closed-Lost', 'In-Progress', 'On-Hold', 'Cancelled', 'Other']).optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  dealValue: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await requireAuth()
    const company = await DatabaseService.getCompany(id)
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(company)
  } catch (error) {
    console.error('GET /api/companies/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const validatedData = updateCompanySchema.parse(body)
    
    const company = await DatabaseService.updateCompany(
      id,
      validatedData,
      user.id
    )
    
    return NextResponse.json(company)
  } catch (error) {
    console.error('PUT /api/companies/[id] error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update company' },
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
    await requireAuth()
    await DatabaseService.deleteCompany(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/companies/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    )
  }
}