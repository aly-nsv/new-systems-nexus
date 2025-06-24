import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view')
    
    let result
    
    switch (view) {
      case 'new-companies':
        result = await DatabaseService.getNewCompaniesView()
        break
      case 'action-items':
        result = await DatabaseService.getActionItemsView()
        break
      case 'investment-pipeline':
        result = await DatabaseService.getInvestmentPipelineView()
        break
      case 'portfolio':
        result = await DatabaseService.getPortfolioView()
        break
      default:
        return NextResponse.json(
          { error: 'Invalid view specified' },
          { status: 400 }
        )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/views/pipeline error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline view' },
      { status: 500 }
    )
  }
}