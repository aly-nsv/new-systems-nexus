import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  children: ReactNode
  className?: string
}

interface SidebarItemProps {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
  icon?: ReactNode
}

interface SidebarSectionProps {
  title: string
  children: ReactNode
}

const Sidebar = ({ children, className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      'flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64',
      className
    )}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold text-gray-900">New Systems Nexus</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg 
            className={cn('w-5 h-5 text-gray-500 transition-transform', isCollapsed && 'rotate-180')}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {children}
      </nav>
    </div>
  )
}

const SidebarSection = ({ title, children }: SidebarSectionProps) => (
  <div className="space-y-2">
    <h3 className="pr-1 text-xs font-size-6 font-semibold text-gray-500 uppercase tracking-wider">
      {title}
    </h3>
    <div className="space-y-1">
      {children}
    </div>
  </div>
)

const SidebarItem = ({ children, active = false, onClick, className, icon }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left',
      active 
        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500' 
        : 'text-gray-700 hover:bg-gray-100',
      className
    )}
  >
    {icon && (
      <span className="mr-3 flex-shrink-0">
        {icon}
      </span>
    )}
    <span className="truncate">{children}</span>
  </button>
)

export { Sidebar, SidebarSection, SidebarItem }