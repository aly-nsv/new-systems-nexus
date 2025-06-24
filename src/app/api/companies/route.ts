import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'
import { z } from 'zod'
import { DealStageEnum } from '@/types'

const createCompanySchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  dealStage: z.enum(['Prospect', 'Qualification', 'Proposal', 'Negotiation', 'Closed-Won', 'Closed-Lost', 'In-Progress', 'On-Hold', 'Cancelled', 'Other']),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  dealValue: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    await requireAuth()
    const companies = await DatabaseService.getCompanies()
    return NextResponse.json(companies)
  } catch (error) {
    console.error('GET /api/companies error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const validatedData = createCompanySchema.parse(body)
    
    const company = await DatabaseService.createCompany(
      {
        companyName: validatedData.companyName,
        dealStage: validatedData.dealStage as DealStageEnum,
        contactPerson: validatedData.contactPerson || '',
        contactEmail: validatedData.contactEmail || '',
        dealValue: validatedData.dealValue || 0,
        notes: validatedData.notes || '',
        lastUpdated: new Date(),
      },
      user.id
    )
    
    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('POST /api/companies error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    )
  }
}