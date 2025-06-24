import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    await requireAuth()
    
    const [slrCategories, sourceCategories, dealLeadCategories, themeCategories] = await Promise.all([
      DatabaseService.getSLRCategories(),
      DatabaseService.getSourceCategories(),
      DatabaseService.getDealLeadCategories(),
      DatabaseService.getThemeCategories(),
    ])
    
    return NextResponse.json({
      slrCategories,
      sourceCategories,
      dealLeadCategories,
      themeCategories,
    })
  } catch (error) {
    console.error('GET /api/categories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}