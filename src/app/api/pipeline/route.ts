import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'
import { z } from 'zod'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { StatusEnum, RoundStageEnum, RoundTimingEnum, PriorityEnum, FundTypeEnum, AdvisorPriorityEnum, Pipeline } from '@/types'

const createPipelineSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  descriptionShort: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  geography: z.string().optional(),
  companyContact: z.string().email().optional().or(z.literal('')),
  status: z.enum([
    'Invested',
    'Diligence 3 (IC Memo)',
    'Diligence 2 (Screening Memo)',
    'Diligence 1',
    'Debrief',
    'New Company',
    'Meeting Booked',
    'To Be Scheduled',
    'To Pass',
    'Waiting for Lead',
    'Follow Up',
    'Actively Monitor',
    'Passively Monitor',
    'Out of Scope',
    'Pass',
    'Newlab Syndicate Investment'
  ]).optional(),
  finalStatus: z.enum([
    'Invested',
    'Diligence 3 (IC Memo)',
    'Diligence 2 (Screening Memo)',
    'Diligence 1',
    'Debrief',
    'New Company',
    'Meeting Booked',
    'To Be Scheduled',
    'To Pass',
    'Waiting for Lead',
    'Follow Up',
    'Actively Monitor',
    'Passively Monitor',
    'Out of Scope',
    'Pass',
    'Newlab Syndicate Investment'
  ]).optional(),
  priority: z.enum(['1 - Highest', '2 - High', '3 - Medium', '4 - Low', '0 - On Hold']).optional(),
  toReview: z.boolean().default(false),
  roundStage: z.enum([
    'Pre-Seed',
    'Seed',
    'Series A',
    'Series B',
    'Series C',
    'Series D',
    'Series E',
    'Series A Bridge',
    'Govt Funded',
    'Seed Extension',
    'Bridge',
    'Series B Bridge',
    'Convertible Note',
    'IPO',
    'Series A-1',
    'Series A-2',
    'Series B-2',
    'Other',
    'Series A-3',
    'Series C Bridge',
    'Dev Cap',
    'Angel',
    'Late Stage'
  ]).optional(),
  roundTiming: z.enum([
    'Q4 2023',
    'Q1 2024',
    'Q2 2024', 
    'Q3 2024',
    'Q2 2023',
    'Q1 2023',
    'Q3 2023',
    'Q4 2024',
    'Q1 2025',
    'Q2 2025',
    'Q3 2025',
    'Q4 2025'
  ]).optional(),
  roundSize: z.number().min(0).optional(),
  preMoneyValuation: z.number().min(0).optional(),
  totalRaised: z.number().min(0).optional(),
  checkSizeAllocation: z.number().min(0).optional(),
  mostRecentValuation: z.number().min(0).optional(),
  investmentDate: z.string().pipe(z.coerce.date()).optional(),
  passDate: z.string().pipe(z.coerce.date()).optional(),
  signedNda: z.string().pipe(z.coerce.date()).optional(),
  decisionOverview: z.string().optional(),
  productAnalysis: z.string().optional(),
  valueProposition: z.string().optional(),
  marketAnalysis: z.string().optional(),
  teamAnalysis: z.string().optional(),
  whatToBelieve: z.string().optional(),
  dealTeamNextStep: z.string().optional(),
  advisorRecommendation: z.string().optional(),
  completedTasks: z.string().optional(),
  notesLinks: z.string().optional(),
  reviewMaterialLink: z.string().url().optional().or(z.literal('')),
  deckUrl: z.string().url().optional().or(z.literal('')),
  investmentsDriveFolder: z.string().url().optional().or(z.literal('')),
  dataRoomUrl: z.string().url().optional().or(z.literal('')),
  notissiaDeckLink: z.string().url().optional().or(z.literal('')),
  twoPagerReady: z.boolean().default(false),
  fundType: z.enum(['SPV', 'Fund']).optional(),
  advisorPriority: z.enum(['1 - Highest', '2 - High', '3 - Medium', '4 - Low', '5 - Lowest', 'Hold']).optional(),
  investorCrm: z.string().optional(),
  slrCategoryIds: z.array(z.string().uuid()).optional(),
  sourceCategoryIds: z.array(z.string().uuid()).optional(),
  dealLeadCategoryIds: z.array(z.string().uuid()).optional(),
  themeCategoryIds: z.array(z.string().uuid()).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  passCommunicatorId: z.string().uuid().optional(),
})

const pipelineQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  roundStage: z.string().optional(),
  slrCategories: z.string().optional(),
  assignees: z.string().optional(),
  toReview: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const query = pipelineQuerySchema.parse(Object.fromEntries(searchParams))
    
    const filters = {
      status: query.status ? query.status.split(',') as StatusEnum[] : undefined,
      priority: query.priority ? query.priority.split(',') as PriorityEnum[] : undefined,
      roundStage: query.roundStage ? query.roundStage.split(',') as RoundStageEnum[] : undefined,
      slrCategories: query.slrCategories ? query.slrCategories.split(',') : undefined,
      assignees: query.assignees ? query.assignees.split(',') : undefined,
      toReview: query.toReview ? query.toReview === 'true' : undefined,
      search: query.search,
    }
    
    const pagination = {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    }
    
    const sort = {
      field: (query.sortBy || 'createdAt') as keyof Pipeline,
      direction: query.sortOrder || 'desc',
    } as const
    
    const result = await DatabaseService.getPipeline(filters, pagination, sort)
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/pipeline error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const validatedData = createPipelineSchema.parse(body)
    
    const pipeline = await DatabaseService.createPipeline(validatedData, user.id)
    
    return NextResponse.json(pipeline, { status: 201 })
  } catch (error) {
    console.error('POST /api/pipeline error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create pipeline entry' },
      { status: 500 }
    )
  }
}