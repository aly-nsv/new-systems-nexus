// Pipeline Management Types - NSV Airtable to Supabase Migration

// Enum types matching Supabase schema
export type StatusEnum = 
  | 'Invested'
  | 'Diligence 3 (IC Memo)'
  | 'Diligence 2 (Screening Memo)'
  | 'Diligence 1'
  | 'Debrief'
  | 'New Company'
  | 'Meeting Booked'
  | 'To Be Scheduled'
  | 'To Pass'
  | 'Waiting for Lead'
  | 'Follow Up'
  | 'Actively Monitor'
  | 'Passively Monitor'
  | 'Out of Scope'
  | 'Pass'
  | 'Newlab Syndicate Investment'

export type RoundStageEnum = 
  | 'Pre-Seed'
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'Series C'
  | 'Series D'
  | 'Series E'
  | 'Series A Bridge'
  | 'Govt Funded'
  | 'Seed Extension'
  | 'Bridge'
  | 'Series B Bridge'
  | 'Convertible Note'
  | 'IPO'
  | 'Series A-1'
  | 'Series A-2'
  | 'Series B-2'
  | 'Other'
  | 'Series A-3'
  | 'Series C Bridge'
  | 'Dev Cap'
  | 'Angel'
  | 'Late Stage'

export type RoundTimingEnum = 
  | 'Q4 2023'
  | 'Q1 2024'
  | 'Q2 2024'
  | 'Q3 2024'
  | 'Q2 2023'
  | 'Q1 2023'
  | 'Q3 2023'
  | 'Q4 2024'
  | 'Q1 2025'
  | 'Q2 2025'
  | 'Q3 2025'
  | 'Q4 2025'

export type PriorityEnum = 
  | '1 - Highest'
  | '2 - High'
  | '3 - Medium'
  | '4 - Low'
  | '0 - On Hold'

export type FundTypeEnum = 
  | 'SPV'
  | 'Fund'

export type AdvisorPriorityEnum = 
  | '1 - Highest'
  | '2 - High'
  | '3 - Medium'
  | '4 - Low'
  | '5 - Lowest'
  | 'Hold'

// Category interfaces
export interface SLRCategory {
  id: string
  name: string
  color: string
  createdAt: Date
}

export interface SourceCategory {
  id: string
  name: string
  color: string
  createdAt: Date
}

export interface DealLeadCategory {
  id: string
  name: string
  color: string
  createdAt: Date
}

export interface ThemeCategory {
  id: string
  name: string
  color: string
  createdAt: Date
}

// User interface
export interface User {
  id: string
  email: string
  name: string | null
  airtableUserId: string | null
  createdAt: Date
}

// Main Pipeline interface
export interface Pipeline {
  id: string
  
  // Basic Company Information
  companyName: string
  descriptionShort: string | null
  website: string | null
  geography: string | null
  companyContact: string | null
  
  // Pipeline Status
  status: StatusEnum | null
  finalStatus: StatusEnum | null
  priority: PriorityEnum | null
  toReview: boolean
  
  // Deal Information
  roundStage: RoundStageEnum | null
  roundTiming: RoundTimingEnum | null
  roundSize: number | null // in cents
  preMoneyValuation: number | null // in cents
  totalRaised: number | null
  checkSizeAllocation: number | null
  mostRecentValuation: number | null
  
  // Dates
  investmentDate: Date | null
  passDate: Date | null
  signedNda: Date | null
  
  // Analysis Fields
  decisionOverview: string | null
  productAnalysis: string | null
  valueProposition: string | null
  marketAnalysis: string | null
  teamAnalysis: string | null
  whatToBelieve: string | null
  
  // Process Fields
  dealTeamNextStep: string | null
  advisorRecommendation: string | null
  completedTasks: string | null
  notesLinks: string | null
  
  // URLs and Links
  reviewMaterialLink: string | null
  deckUrl: string | null
  investmentsDriveFolder: string | null
  dataRoomUrl: string | null
  notissiaDeckLink: string | null
  
  // Checkboxes
  twoPagerReady: boolean
  
  // Other
  fundType: FundTypeEnum | null
  advisorPriority: AdvisorPriorityEnum | null
  investorCrm: string | null
  
  // Metadata
  createdAt: Date
  createdBy: string | null
  updatedAt: Date
  
  // Airtable migration fields
  airtableRecordId: string | null
  migratedAt: Date | null
  
  // Related data (populated via joins)
  slrCategories?: SLRCategory[]
  sourceCategories?: SourceCategory[]
  dealLeadCategories?: DealLeadCategory[]
  themeCategories?: ThemeCategory[]
  assignees?: User[]
  passCommunicator?: User
  attachments?: PipelineAttachment[]
}

// Pipeline with populated relations for views
export interface PipelineWithRelations extends Pipeline {
  slrCategories: SLRCategory[]
  sourceCategories: SourceCategory[]
  dealLeadCategories: DealLeadCategory[]
  themeCategories: ThemeCategory[]
  assignees: User[]
  passCommunicator?: User
  attachments: PipelineAttachment[]
}

// File attachment interface
export interface PipelineAttachment {
  id: string
  pipelineId: string
  fileType: 'review_material' | 'deck'
  fileName: string
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
  airtableAttachmentId: string | null
  createdAt: Date
}

// Todo interface
export interface Todo {
  id: string
  task: string
  priority: PriorityEnum | null
  assigneeId: string | null
  pipelineId: string | null
  dateAssigned: Date | null
  dateCompleted: Date | null
  done: boolean
  notes: string | null
  createdAt: Date
  airtableRecordId: string | null
  
  // Related data
  assignee?: User
  pipeline?: Pipeline
}

// Investor CRM interface
export interface InvestorCRM {
  id: string
  name: string
  title: string | null
  firm: string | null
  email: string | null
  linkedin: string | null
  location: string | null
  relationshipOwnerId: string | null
  focusAreas: string | null
  investorType: string | null
  stage: string | null
  typicalCheckSize: string | null
  notableInvestments: string | null
  description: string | null
  createdAt: Date
  airtableRecordId: string | null
  
  // Related data
  relationshipOwner?: User
}

// View interfaces (for predefined views)
export interface NewCompanyView extends Pipeline {
  slrCategories: SLRCategory[]
  assignees: User[]
}

export interface ActionItemView extends Pipeline {
  assigneeName: string
  assigneeEmail: string
  slrCategories: SLRCategory[]
}

export interface InvestmentPipelineView extends Pipeline {
  slrCategories: SLRCategory[]
  assignees: User[]
}

export interface PortfolioView extends Pipeline {
  slrCategories: SLRCategory[]
  ownershipPercentage: number | null
  valuationStepUp: number | null
}

// API Response types
export interface PipelineListResponse {
  data: Pipeline[]
  count: number
  error?: string
}

export interface PipelineResponse {
  data: Pipeline | null
  error?: string
}

// Form types for creating/updating records
export interface CreatePipelineData {
  companyName: string
  descriptionShort?: string
  website?: string
  geography?: string
  companyContact?: string
  status?: StatusEnum
  priority?: PriorityEnum
  roundStage?: RoundStageEnum
  roundTiming?: RoundTimingEnum
  roundSize?: number
  preMoneyValuation?: number
  totalRaised?: number
  checkSizeAllocation?: number
  mostRecentValuation?: number
  investmentDate?: Date
  passDate?: Date
  signedNda?: Date
  decisionOverview?: string
  productAnalysis?: string
  valueProposition?: string
  marketAnalysis?: string
  teamAnalysis?: string
  whatToBelieve?: string
  dealTeamNextStep?: string
  advisorRecommendation?: string
  completedTasks?: string
  notesLinks?: string
  reviewMaterialLink?: string
  deckUrl?: string
  investmentsDriveFolder?: string
  dataRoomUrl?: string
  notissiaDeckLink?: string
  twoPagerReady?: boolean
  fundType?: FundTypeEnum
  advisorPriority?: AdvisorPriorityEnum
  investorCrm?: string
  slrCategoryIds?: string[]
  sourceCategoryIds?: string[]
  dealLeadCategoryIds?: string[]
  themeCategoryIds?: string[]
  assigneeIds?: string[]
  passCommunicatorId?: string
}

export interface UpdatePipelineData extends Partial<CreatePipelineData> {
  id: string
}

// Filter types for views and search
export interface PipelineFilter {
  status?: StatusEnum[]
  priority?: PriorityEnum[]
  roundStage?: RoundStageEnum[]
  roundTiming?: RoundTimingEnum[]
  slrCategories?: string[]
  dealLeads?: string[]
  assignees?: string[]
  toReview?: boolean
  dateRange?: {
    start: Date
    end: Date
    field: 'createdAt' | 'updatedAt' | 'investmentDate' | 'passDate'
  }
  search?: string
}

// Sort options
export interface PipelineSort {
  field: keyof Pipeline
  direction: 'asc' | 'desc'
}

// Legacy types for backward compatibility (if needed during migration)
export interface Company {
  id: string
  companyName: string
  dealStage: DealStageEnum
  contactPerson: string
  contactEmail: string
  dealValue: number
  lastUpdated: Date
  notes: string
  createdAt: Date
  updatedAt: Date
}

export type DealStageEnum = 
  | 'Prospect'
  | 'Qualification'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed-Won'
  | 'Closed-Lost'
  | 'In-Progress'
  | 'On-Hold'
  | 'Cancelled'
  | 'Other'

  

export interface View {
  id: string
  name: string
  filters: ViewFilter[]
  userId: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ViewFilter {
  column: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte'
  value: string | number | Date
}

export type UserRole = 'admin' | 'member'

export interface Permission {
  id: string
  email: string
  role: UserRole
  addedBy: string
  createdAt: Date
}