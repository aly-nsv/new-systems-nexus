import { supabase, supabaseAdmin } from './supabase'
import { 
  Pipeline, 
  PipelineWithRelations, 
  Todo, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  InvestorCRM, 
  User, 
  SLRCategory, 
  SourceCategory, 
  DealLeadCategory, 
  ThemeCategory,
  PipelineAttachment,
  CreatePipelineData,
  UpdatePipelineData,
  PipelineFilter,
  PipelineSort,
  StatusEnum,
  RoundStageEnum,
  RoundTimingEnum,
  PriorityEnum,
  FundTypeEnum,
  AdvisorPriorityEnum,
  NewCompanyView,
  ActionItemView,
  InvestmentPipelineView,
  PortfolioView,
  PipelineListResponse,
  // Legacy types for backward compatibility
  Company, 
  View, 
  Permission, 
  DealStageEnum, 
  UserRole 
} from '@/types'

export class DatabaseService {
  // ===== PIPELINE MANAGEMENT =====
  
  // Helper to map camelCase field names to snake_case database columns
  private static mapSortFieldToDbColumn(field: keyof Pipeline): string {
    const fieldMap: Record<string, string> = {
      'companyName': 'company_name',
      'descriptionShort': 'description_short',
      'companyContact': 'company_contact',
      'finalStatus': 'final_status',
      'toReview': 'to_review',
      'roundStage': 'round_stage',
      'roundTiming': 'round_timing',
      'roundSize': 'round_size',
      'preMoneyValuation': 'pre_money_valuation',
      'totalRaised': 'total_raised',
      'checkSizeAllocation': 'check_size_allocation',
      'mostRecentValuation': 'most_recent_valuation',
      'investmentDate': 'investment_date',
      'passDate': 'pass_date',
      'signedNda': 'signed_nda',
      'decisionOverview': 'decision_overview',
      'productAnalysis': 'product_analysis',
      'valueProposition': 'value_proposition',
      'marketAnalysis': 'market_analysis',
      'teamAnalysis': 'team_analysis',
      'whatToBelieve': 'what_to_believe',
      'dealTeamNextStep': 'deal_team_next_step',
      'advisorRecommendation': 'advisor_recommendation',
      'completedTasks': 'completed_tasks',
      'notesLinks': 'notes_links',
      'reviewMaterialLink': 'review_material_link',
      'deckUrl': 'deck_url',
      'investmentsDriveFolder': 'investments_drive_folder',
      'dataRoomUrl': 'data_room_url',
      'notissiaDeckLink': 'notissia_deck_link',
      'twoPagerReady': 'two_pager_ready',
      'fundType': 'fund_type',
      'advisorPriority': 'advisor_priority',
      'investorCrm': 'investor_crm',
      'createdAt': 'created_at',
      'createdBy': 'created_by',
      'updatedAt': 'updated_at',
      'airtableRecordId': 'airtable_record_id',
      'migratedAt': 'migrated_at'
    }
    
    return fieldMap[field as string] || field as string
  }

  static async getPipeline(
    filters?: PipelineFilter, 
    pagination = { page: 1, limit: 50 },
    sort?: PipelineSort
  ): Promise<PipelineListResponse> {
    let query = supabase
      .from('pipeline')
      .select(`
        *,
        slr_categories:pipeline_slr(slr_categories(*)),
        source_categories:pipeline_source(source_categories(*)),
        deal_lead_categories:pipeline_deal_lead(deal_lead_categories(*)),
        theme_categories:pipeline_theme(theme_categories(*)),
        assignees:pipeline_assignees(users(*)),
        pass_communicator:pipeline_pass_communicator(users(*)),
        attachments:pipeline_attachments(*),
        created_by_user:users!pipeline_created_by_fkey(*)
      `)

    // Apply filters
    if (filters) {
      if (filters.status?.length) {
        query = query.in('status', filters.status)
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority)
      }
      if (filters.roundStage?.length) {
        query = query.in('round_stage', filters.roundStage)
      }
      if (filters.roundTiming?.length) {
        query = query.in('round_timing', filters.roundTiming)
      }
      if (filters.toReview !== undefined) {
        query = query.eq('to_review', filters.toReview)
      }
      if (filters.search) {
        query = query.or(`company_name.ilike.%${filters.search}%,description_short.ilike.%${filters.search}%`)
      }
      if (filters.dateRange) {
        query = query
          .gte(filters.dateRange.field, filters.dateRange.start.toISOString())
          .lte(filters.dateRange.field, filters.dateRange.end.toISOString())
      }
    }

    // Apply sorting
    if (sort) {
      const dbField = DatabaseService.mapSortFieldToDbColumn(sort.field)
      query = query.order(dbField, { ascending: sort.direction === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Get total count
    const { count } = await supabase
      .from('pipeline')
      .select('*', { count: 'exact', head: true })

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit
    query = query.range(offset, offset + pagination.limit - 1)

    const { data, error } = await query

    if (error) throw error

    return {
      data: (data || []).map(DatabaseService.mapPipelineFromDb),
      count: count || 0
    }
  }

  static async getPipelineById(id: string): Promise<PipelineWithRelations | null> {
    const { data, error } = await supabase
      .from('pipeline')
      .select(`
        *,
        slr_categories:pipeline_slr(slr_categories(*)),
        source_categories:pipeline_source(source_categories(*)),
        deal_lead_categories:pipeline_deal_lead(deal_lead_categories(*)),
        theme_categories:pipeline_theme(theme_categories(*)),
        assignees:pipeline_assignees(users(*)),
        pass_communicator:pipeline_pass_communicator(users(*)),
        attachments:pipeline_attachments(*),
        created_by_user:users!pipeline_created_by_fkey(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data ? DatabaseService.mapPipelineFromDb(data) as PipelineWithRelations : null
  }

  static async createPipeline(pipelineData: CreatePipelineData, userId: string): Promise<Pipeline> {
    const { data, error } = await supabase.rpc('create_pipeline_with_relations', {
      pipeline_data: {
        company_name: pipelineData.companyName,
        description_short: pipelineData.descriptionShort,
        website: pipelineData.website,
        geography: pipelineData.geography,
        company_contact: pipelineData.companyContact,
        status: pipelineData.status,
        // final_status: pipelineData.finalStatus,
        priority: pipelineData.priority,
        // to_review: pipelineData.toReview || false,
        round_stage: pipelineData.roundStage,
        round_timing: pipelineData.roundTiming,
        round_size: pipelineData.roundSize,
        pre_money_valuation: pipelineData.preMoneyValuation,
        total_raised: pipelineData.totalRaised,
        check_size_allocation: pipelineData.checkSizeAllocation,
        most_recent_valuation: pipelineData.mostRecentValuation,
        investment_date: pipelineData.investmentDate?.toISOString(),
        pass_date: pipelineData.passDate?.toISOString(),
        signed_nda: pipelineData.signedNda?.toISOString(),
        decision_overview: pipelineData.decisionOverview,
        product_analysis: pipelineData.productAnalysis,
        value_proposition: pipelineData.valueProposition,
        market_analysis: pipelineData.marketAnalysis,
        team_analysis: pipelineData.teamAnalysis,
        what_to_believe: pipelineData.whatToBelieve,
        deal_team_next_step: pipelineData.dealTeamNextStep,
        advisor_recommendation: pipelineData.advisorRecommendation,
        completed_tasks: pipelineData.completedTasks,
        notes_links: pipelineData.notesLinks,
        review_material_link: pipelineData.reviewMaterialLink,
        deck_url: pipelineData.deckUrl,
        investments_drive_folder: pipelineData.investmentsDriveFolder,
        data_room_url: pipelineData.dataRoomUrl,
        notissia_deck_link: pipelineData.notissiaDeckLink,
        two_pager_ready: pipelineData.twoPagerReady || false,
        fund_type: pipelineData.fundType,
        advisor_priority: pipelineData.advisorPriority,
        investor_crm: pipelineData.investorCrm,
        created_by: userId
      },
      slr_category_ids: pipelineData.slrCategoryIds || [],
      source_category_ids: pipelineData.sourceCategoryIds || [],
      deal_lead_category_ids: pipelineData.dealLeadCategoryIds || [],
      theme_category_ids: pipelineData.themeCategoryIds || [],
      assignee_ids: pipelineData.assigneeIds || [],
      pass_communicator_id: pipelineData.passCommunicatorId
    })

    if (error) throw error
    return DatabaseService.mapPipelineFromDb(data)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async updatePipeline(id: string, updates: UpdatePipelineData, _userId: string): Promise<Pipeline | null> {
    const { data, error } = await supabase.rpc('update_pipeline_with_relations', {
      pipeline_id: id,
      pipeline_updates: {
        company_name: updates.companyName,
        description_short: updates.descriptionShort,
        website: updates.website,
        geography: updates.geography,
        company_contact: updates.companyContact,
        status: updates.status,
        // final_status: updates.finalStatus,
        priority: updates.priority,
        // to_review: updates.toReview,
        round_stage: updates.roundStage,
        round_timing: updates.roundTiming,
        round_size: updates.roundSize,
        pre_money_valuation: updates.preMoneyValuation,
        total_raised: updates.totalRaised,
        check_size_allocation: updates.checkSizeAllocation,
        most_recent_valuation: updates.mostRecentValuation,
        investment_date: updates.investmentDate?.toISOString(),
        pass_date: updates.passDate?.toISOString(),
        signed_nda: updates.signedNda?.toISOString(),
        decision_overview: updates.decisionOverview,
        product_analysis: updates.productAnalysis,
        value_proposition: updates.valueProposition,
        market_analysis: updates.marketAnalysis,
        team_analysis: updates.teamAnalysis,
        what_to_believe: updates.whatToBelieve,
        deal_team_next_step: updates.dealTeamNextStep,
        advisor_recommendation: updates.advisorRecommendation,
        completed_tasks: updates.completedTasks,
        notes_links: updates.notesLinks,
        review_material_link: updates.reviewMaterialLink,
        deck_url: updates.deckUrl,
        investments_drive_folder: updates.investmentsDriveFolder,
        data_room_url: updates.dataRoomUrl,
        notissia_deck_link: updates.notissiaDeckLink,
        two_pager_ready: updates.twoPagerReady,
        fund_type: updates.fundType,
        advisor_priority: updates.advisorPriority,
        investor_crm: updates.investorCrm
      },
      slr_category_ids: updates.slrCategoryIds,
      source_category_ids: updates.sourceCategoryIds,
      deal_lead_category_ids: updates.dealLeadCategoryIds,
      theme_category_ids: updates.themeCategoryIds,
      assignee_ids: updates.assigneeIds,
      pass_communicator_id: updates.passCommunicatorId
    })

    if (error) throw error
    return data ? DatabaseService.mapPipelineFromDb(data) : null
  }

  static async deletePipeline(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('pipeline')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  // ===== CATEGORIES =====
  
  static async getSLRCategories(): Promise<SLRCategory[]> {
    const { data, error } = await supabase
      .from('slr_categories')
      .select('*')
      .order('name')

    if (error) throw error
    return (data || []).map(DatabaseService.mapSLRCategoryFromDb).filter((category): category is SLRCategory => category !== null)
  }

  static async getSourceCategories(): Promise<SourceCategory[]> {
    const { data, error } = await supabase
      .from('source_categories')
      .select('*')
      .order('name')

    if (error) throw error
    return (data || []).map(DatabaseService.mapSourceCategoryFromDb).filter((category): category is SourceCategory => category !== null)
  }

  static async getDealLeadCategories(): Promise<DealLeadCategory[]> {
    const { data, error } = await supabase
      .from('deal_lead_categories')
      .select('*')
      .order('name')

    if (error) throw error
    return (data || []).map(DatabaseService.mapDealLeadCategoryFromDb).filter((category): category is DealLeadCategory => category !== null)
  }

  static async getThemeCategories(): Promise<ThemeCategory[]> {
    const { data, error } = await supabase
      .from('theme_categories')
      .select('*')
      .order('name')

    if (error) throw error
    return (data || []).map(DatabaseService.mapThemeCategoryFromDb).filter((category): category is ThemeCategory => category !== null)
  }

  // ===== USERS =====
  
  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')

    if (error) throw error
    return (data || []).map(DatabaseService.mapUserFromDb).filter((user): user is User => user !== null)
  }

  // ===== TODOS =====
  
  static async getTodos(
    filters?: { assigneeId?: string; pipelineId?: string; done?: boolean; priority?: PriorityEnum[] },
    pagination = { page: 1, limit: 50 }
  ): Promise<{ data: Todo[]; count: number }> {
    let query = supabase
      .from('todos')
      .select(`
        *,
        assignee:users(*),
        pipeline:pipeline(*)
      `)

    if (filters) {
      if (filters.assigneeId) {
        query = query.eq('assignee_id', filters.assigneeId)
      }
      if (filters.pipelineId) {
        query = query.eq('pipeline_id', filters.pipelineId)
      }
      if (filters.done !== undefined) {
        query = query.eq('done', filters.done)
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority)
      }
    }

    const { count } = await supabase
      .from('todos')
      .select('*', { count: 'exact', head: true })

    const offset = (pagination.page - 1) * pagination.limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    const { data, error } = await query

    if (error) throw error

    return {
      data: (data || []).map(DatabaseService.mapTodoFromDb),
      count: count || 0
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  static async createTodo(todoData: any, _userId: string): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .insert({
        task: todoData.task,
        priority: todoData.priority,
        assignee_id: todoData.assigneeId,
        pipeline_id: todoData.pipelineId,
        date_assigned: todoData.dateAssigned?.toISOString(),
        date_completed: todoData.dateCompleted?.toISOString(),
        done: todoData.done || false,
        notes: todoData.notes
      })
      .select(`
        *,
        assignee:users(*),
        pipeline:pipeline(*)
      `)
      .single()

    if (error) throw error
    return DatabaseService.mapTodoFromDb(data)
  }

  // ===== LEGACY VIEWS =====
  // ===== PREDEFINED VIEWS ===== 
  
  static async getNewCompaniesView(): Promise<NewCompanyView[]> {
    const { data, error } = await supabase
      .from('new_companies')
      .select('*')

    if (error) throw error
    return (data || []).map(DatabaseService.mapNewCompanyViewFromDb).filter((view): view is NewCompanyView => view !== null)
  }

  static async getActionItemsView(): Promise<ActionItemView[]> {
    const { data, error } = await supabase
      .from('action_items_by_user')
      .select('*')

    if (error) throw error
    return (data || []).map(DatabaseService.mapActionItemViewFromDb)
  }

  static async getInvestmentPipelineView(): Promise<InvestmentPipelineView[]> {
    const { data, error } = await supabase
      .from('investment_pipeline')
      .select('*')

    if (error) throw error
    return (data || []).map(DatabaseService.mapInvestmentPipelineViewFromDb)
  }

  static async getPortfolioView(): Promise<PortfolioView[]> {
    const { data, error } = await supabase
      .from('portfolio')
      .select('*')

    if (error) throw error
    return (data || []).map(DatabaseService.mapPortfolioViewFromDb)
  }

  // ===== LEGACY COMPANY METHODS (for backward compatibility) =====
  
  static async getCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return (data || []).map(DatabaseService.mapCompanyFromDb)
  }

  static async getCompany(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data ? DatabaseService.mapCompanyFromDb(data) : null
  }

  static async createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        company_name: company.companyName,
        deal_stage: company.dealStage,
        contact_person: company.contactPerson,
        contact_email: company.contactEmail,
        deal_value: company.dealValue,
        notes: company.notes,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (error) throw error
    return DatabaseService.mapCompanyFromDb(data)
  }

  static async updateCompany(id: string, updates: Partial<Company>, userId: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update({
        ...(updates.companyName && { company_name: updates.companyName }),
        ...(updates.dealStage && { deal_stage: updates.dealStage }),
        ...(updates.contactPerson && { contact_person: updates.contactPerson }),
        ...(updates.contactEmail && { contact_email: updates.contactEmail }),
        ...(updates.dealValue !== undefined && { deal_value: updates.dealValue }),
        ...(updates.notes && { notes: updates.notes }),
        updated_by: userId
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return DatabaseService.mapCompanyFromDb(data)
  }

  static async deleteCompany(id: string): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Views
  static async getViews(userId: string): Promise<View[]> {
    const { data, error } = await supabase
      .from('views')
      .select('*')
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map(DatabaseService.mapViewFromDb)
  }

  static async createView(view: Omit<View, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<View> {
    const { data, error } = await supabase
      .from('views')
      .insert({
        name: view.name,
        filters: JSON.stringify(view.filters),
        user_id: userId,
        is_default: false
      })
      .select()
      .single()

    if (error) throw error
    return DatabaseService.mapViewFromDb(data)
  }

  static async updateView(id: string, updates: Partial<View>, userId: string): Promise<View> {
    const { data, error } = await supabase
      .from('views')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.filters && { filters: JSON.stringify(updates.filters) })
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return DatabaseService.mapViewFromDb(data)
  }

  static async deleteView(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('views')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Permissions
  static async getPermissions(): Promise<Permission[]> {
    const { data, error } = await supabaseAdmin
      .from('permissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(DatabaseService.mapPermissionFromDb)
  }

  static async addPermission(email: string, role: UserRole, addedBy: string): Promise<Permission> {
    const { data, error } = await supabaseAdmin
      .from('permissions')
      .insert({
        email,
        role,
        added_by: addedBy
      })
      .select()
      .single()

    if (error) throw error
    return DatabaseService.mapPermissionFromDb(data)
  }

  static async updatePermission(id: string, role: UserRole): Promise<Permission> {
    const { data, error } = await supabaseAdmin
      .from('permissions')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return DatabaseService.mapPermissionFromDb(data)
  }

  static async deletePermission(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('permissions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async checkPermission(email: string): Promise<Permission | null> {
    const { data, error } = await supabaseAdmin
      .from('permissions')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ? DatabaseService.mapPermissionFromDb(data) : null
  }

  // ===== MAPPING METHODS =====
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapPipelineFromDb(data: any): Pipeline {
    return {
      id: data.id,
      companyName: data.company_name,
      descriptionShort: data.description_short,
      website: data.website,
      geography: data.geography,
      companyContact: data.company_contact,
      status: data.status as StatusEnum,
      finalStatus: data.final_status as StatusEnum,
      priority: data.priority as PriorityEnum,
      toReview: data.to_review || false,
      roundStage: data.round_stage as RoundStageEnum,
      roundTiming: data.round_timing as RoundTimingEnum,
      roundSize: data.round_size,
      preMoneyValuation: data.pre_money_valuation,
      totalRaised: data.total_raised,
      checkSizeAllocation: data.check_size_allocation,
      mostRecentValuation: data.most_recent_valuation,
      investmentDate: data.investment_date ? new Date(data.investment_date) : null,
      passDate: data.pass_date ? new Date(data.pass_date) : null,
      signedNda: data.signed_nda ? new Date(data.signed_nda) : null,
      decisionOverview: data.decision_overview,
      productAnalysis: data.product_analysis,
      valueProposition: data.value_proposition,
      marketAnalysis: data.market_analysis,
      teamAnalysis: data.team_analysis,
      whatToBelieve: data.what_to_believe,
      dealTeamNextStep: data.deal_team_next_step,
      advisorRecommendation: data.advisor_recommendation,
      completedTasks: data.completed_tasks,
      notesLinks: data.notes_links,
      reviewMaterialLink: data.review_material_link,
      deckUrl: data.deck_url,
      investmentsDriveFolder: data.investments_drive_folder,
      dataRoomUrl: data.data_room_url,
      notissiaDeckLink: data.notissia_deck_link,
      twoPagerReady: data.two_pager_ready || false,
      fundType: data.fund_type as FundTypeEnum,
      advisorPriority: data.advisor_priority as AdvisorPriorityEnum,
      investorCrm: data.investor_crm,
      createdAt: new Date(data.created_at),
      createdBy: data.created_by,
      updatedAt: new Date(data.updated_at),
      airtableRecordId: data.airtable_record_id,
      migratedAt: data.migrated_at ? new Date(data.migrated_at) : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slrCategories: data.slr_categories?.map((rel: any) => DatabaseService.mapSLRCategoryFromDb(rel.slr_categories)).filter(Boolean) || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sourceCategories: data.source_categories?.map((rel: any) => DatabaseService.mapSourceCategoryFromDb(rel.source_categories)).filter(Boolean) || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dealLeadCategories: data.deal_lead_categories?.map((rel: any) => DatabaseService.mapDealLeadCategoryFromDb(rel.deal_lead_categories)).filter(Boolean) || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      themeCategories: data.theme_categories?.map((rel: any) => DatabaseService.mapThemeCategoryFromDb(rel.theme_categories)).filter(Boolean) || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assignees: data.assignees?.map((rel: any) => DatabaseService.mapUserFromDb(rel.users)).filter(Boolean) || [],
      passCommunicator: data.pass_communicator?.users ? DatabaseService.mapUserFromDb(data.pass_communicator.users) as User : undefined,
      attachments: data.attachments?.map(DatabaseService.mapAttachmentFromDb) || []
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapSLRCategoryFromDb(data: any): SLRCategory | null {
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      color: data.color,
      createdAt: new Date(data.created_at)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapSourceCategoryFromDb(data: any): SourceCategory | null {
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      color: data.color,
      createdAt: new Date(data.created_at)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapDealLeadCategoryFromDb(data: any): DealLeadCategory | null {
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      color: data.color,
      createdAt: new Date(data.created_at)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapThemeCategoryFromDb(data: any): ThemeCategory | null {
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      color: data.color,
      createdAt: new Date(data.created_at)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapUserFromDb(data: any): User | null {
    if (!data) return null
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      airtableUserId: data.airtable_user_id,
      createdAt: new Date(data.created_at)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapTodoFromDb(data: any): Todo {
    return {
      id: data.id,
      task: data.task,
      priority: data.priority as PriorityEnum,
      assigneeId: data.assignee_id,
      pipelineId: data.pipeline_id,
      dateAssigned: data.date_assigned ? new Date(data.date_assigned) : null,
      dateCompleted: data.date_completed ? new Date(data.date_completed) : null,
      done: data.done || false,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      airtableRecordId: data.airtable_record_id,
      assignee: data.assignee ? DatabaseService.mapUserFromDb(data.assignee) as User : undefined,
      pipeline: data.pipeline ? DatabaseService.mapPipelineFromDb(data.pipeline) : undefined
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapAttachmentFromDb(data: any): PipelineAttachment {
    return {
      id: data.id,
      pipelineId: data.pipeline_id,
      fileType: data.file_type,
      fileName: data.file_name,
      fileUrl: data.file_url,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      airtableAttachmentId: data.airtable_attachment_id,
      createdAt: new Date(data.created_at)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapNewCompanyViewFromDb(data: any): NewCompanyView {
    return {
      ...DatabaseService.mapPipelineFromDb(data),
      slrCategories: data.slr_categories || [],
      assignees: data.assignees || []
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapActionItemViewFromDb(data: any): ActionItemView {
    return {
      ...DatabaseService.mapPipelineFromDb(data),
      assigneeName: data.assignee_name,
      assigneeEmail: data.assignee_email,
      slrCategories: data.slr_categories || []
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapInvestmentPipelineViewFromDb(data: any): InvestmentPipelineView {
    return {
      ...DatabaseService.mapPipelineFromDb(data),
      slrCategories: data.slr_categories || [],
      assignees: data.assignees || []
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapPortfolioViewFromDb(data: any): PortfolioView {
    return {
      ...DatabaseService.mapPipelineFromDb(data),
      slrCategories: data.slr_categories || [],
      ownershipPercentage: data.ownership_percentage,
      valuationStepUp: data.valuation_step_up
    }
  }

  // Legacy mapping methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapCompanyFromDb(data: any): Company {
    return {
      id: data.id,
      companyName: data.company_name,
      dealStage: data.deal_stage as DealStageEnum,
      contactPerson: data.contact_person || '',
      contactEmail: data.contact_email || '',
      dealValue: parseFloat(data.deal_value) || 0,
      notes: data.notes || '',
      lastUpdated: new Date(data.updated_at),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapViewFromDb(data: any): View {
    return {
      id: data.id,
      name: data.name,
      filters: typeof data.filters === 'string' ? JSON.parse(data.filters) : data.filters,
      userId: data.user_id,
      isDefault: data.is_default,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapPermissionFromDb(data: any): Permission {
    return {
      id: data.id,
      email: data.email,
      role: data.role as UserRole,
      addedBy: data.added_by,
      createdAt: new Date(data.created_at)
    }
  }
}