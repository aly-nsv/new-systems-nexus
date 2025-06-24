import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TableProps {
  children: ReactNode
  className?: string
}

interface TableHeaderProps {
  children: ReactNode
  className?: string
}

interface TableBodyProps {
  children: ReactNode
  className?: string
}

interface TableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

interface TableCellProps {
  children: ReactNode
  className?: string
  header?: boolean
}

const Table = ({ children, className }: TableProps) => (
  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
    <table className={cn('min-w-full divide-y divide-gray-300', className)}>
      {children}
    </table>
  </div>
)

const TableHeader = ({ children, className }: TableHeaderProps) => (
  <thead className={cn('bg-gray-50', className)}>
    {children}
  </thead>
)

const TableBody = ({ children, className }: TableBodyProps) => (
  <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
    {children}
  </tbody>
)

const TableRow = ({ children, className, onClick }: TableRowProps) => (
  <tr 
    className={cn(
      onClick && 'hover:bg-gray-50 cursor-pointer',
      className
    )}
    onClick={onClick}
  >
    {children}
  </tr>
)

const TableCell = ({ children, className, header = false }: TableCellProps) => (
  header ? (
    <th className={cn(
      'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      className
    )}>
      {children}
    </th>
  ) : (
    <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)}>
      {children}
    </td>
  )
)

export { Table, TableHeader, TableBody, TableRow, TableCell }