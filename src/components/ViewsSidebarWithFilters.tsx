'use client'

import { ColumnFiltersState } from '@tanstack/react-table'
import { PipelineFilter, User, SLRCategory, SourceCategory, DealLeadCategory, ThemeCategory } from '@/types'
import { Sidebar, SidebarSection, SidebarItem } from '@/components/ui'
import { ViewIcon } from '@/components/ui/Icons'

interface ViewsSidebarProps {
  activeView: string
  onViewSelect: (view: string) => void
  filters: PipelineFilter
  onFiltersChange: (filters: PipelineFilter) => void
  categories: {
    slrCategories: SLRCategory[]
    sourceCategories: SourceCategory[]
    dealLeadCategories: DealLeadCategory[]
    themeCategories: ThemeCategory[]
  }
  users: User[]
  // New props for client-side filtering
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
}

// Define view filter presets
const VIEW_PRESETS: Record<string, ColumnFiltersState> = {
  'all': [],
  'new-companies': [
    { id: 'status', value: 'New Company' }
  ],
  'action-items': [
    { id: 'toReview', value: true }
  ],
  'investment-pipeline': [
    { id: 'status', value: 'Invested' }
  ],
  'portfolio': [
    { id: 'status', value: 'Invested' }
  ],
  'diligence': [
    { id: 'status', value: 'Diligence 1' }
  ],
  'meetings-scheduled': [
    { id: 'status', value: 'Meeting Booked' }
  ],
  'to-pass': [
    { id: 'status', value: 'To Pass' }
  ],
  'high-priority': [
    { id: 'priority', value: '1 - Highest' }
  ],
  'seed-stage': [
    { id: 'roundStage', value: 'Seed' }
  ],
  'series-a': [
    { id: 'roundStage', value: 'Series A' }
  ]
}

export default function ViewsSidebarWithFilters({
  activeView,
  onViewSelect,
  filters, // eslint-disable-line @typescript-eslint/no-unused-vars
  onFiltersChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  categories, // eslint-disable-line @typescript-eslint/no-unused-vars
  users, // eslint-disable-line @typescript-eslint/no-unused-vars
  columnFilters, // eslint-disable-line @typescript-eslint/no-unused-vars
  onColumnFiltersChange,
}: ViewsSidebarProps) {
  // Define the available views with their filter presets
  const defaultViews = [
    { id: 'all', name: 'All Pipeline', icon: ViewIcon },
    { id: 'new-companies', name: 'New Companies', icon: ViewIcon },
    { id: 'action-items', name: 'Action Items', icon: ViewIcon },
    { id: 'investment-pipeline', name: 'Investment Pipeline', icon: ViewIcon },
    { id: 'portfolio', name: 'Portfolio', icon: ViewIcon },
  ]

  const additionalViews = [
    { id: 'diligence', name: 'In Diligence', icon: ViewIcon },
    { id: 'meetings-scheduled', name: 'Meetings Scheduled', icon: ViewIcon },
    { id: 'to-pass', name: 'To Pass', icon: ViewIcon },
    { id: 'high-priority', name: 'High Priority', icon: ViewIcon },
    { id: 'seed-stage', name: 'Seed Stage', icon: ViewIcon },
    { id: 'series-a', name: 'Series A', icon: ViewIcon },
  ]

  const handleViewSelect = (viewId: string) => {
    // Update the active view
    onViewSelect(viewId)
    
    // Apply the predefined filters for this view
    const preset = VIEW_PRESETS[viewId] || []
    onColumnFiltersChange(preset)
  }

  return (
    <Sidebar>
      <SidebarSection title="Views">
        {defaultViews.map((view) => (
          <SidebarItem
            key={view.id}
            icon={<view.icon size={16} />}
            active={activeView === view.id}
            onClick={() => handleViewSelect(view.id)}
          >
            {view.name}
          </SidebarItem>
        ))}
      </SidebarSection>
      
      <SidebarSection title="Quick Filters">
        {additionalViews.map((view) => (
          <SidebarItem
            key={view.id}
            icon={<view.icon size={16} />}
            active={activeView === view.id}
            onClick={() => handleViewSelect(view.id)}
          >
            {view.name}
          </SidebarItem>
        ))}
      </SidebarSection>
    </Sidebar>
  )
}