'use client'

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
}

export default function ViewsSidebar({
  activeView,
  onViewSelect,
  filters, // eslint-disable-line @typescript-eslint/no-unused-vars
  onFiltersChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  categories, // eslint-disable-line @typescript-eslint/no-unused-vars
  users, // eslint-disable-line @typescript-eslint/no-unused-vars
}: ViewsSidebarProps) {
  // Define the available views
  const defaultViews = [
    { id: 'all', name: 'All Pipeline' },
    { id: 'new-companies', name: 'New Companies' },
    { id: 'action-items', name: 'Action Items' },
    { id: 'investment-pipeline', name: 'Investment Pipeline' },
    { id: 'portfolio', name: 'Portfolio' },
  ]

  return (
    <Sidebar>
      <SidebarSection title="Views">
        {defaultViews.map((view) => (
          <SidebarItem
            key={view.id}
            icon={<ViewIcon size={16} />}
            active={activeView === view.id}
            onClick={() => onViewSelect(view.id)}
          >
            {view.name}
          </SidebarItem>
        ))}
      </SidebarSection>
    </Sidebar>
  )
}