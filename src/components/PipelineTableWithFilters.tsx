'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  Column,
} from '@tanstack/react-table'
import { 
  Pipeline, 
  CreatePipelineData, 
  User, 
  SLRCategory, 
  SourceCategory, 
  DealLeadCategory, 
  ThemeCategory,
  StatusEnum,
  RoundStageEnum,
  PriorityEnum
} from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button, Input, Select, Modal, Textarea } from '@/components/ui'
import { EditIcon, DeleteIcon, PlusIcon, SearchIcon, FilterIcon } from '@/components/ui/Icons'

interface PipelineTableProps {
  pipeline: Pipeline[]
  users: User[]
  categories: {
    slrCategories: SLRCategory[]
    sourceCategories: SourceCategory[]
    dealLeadCategories: DealLeadCategory[]
    themeCategories: ThemeCategory[]
  }
  onPipelineCreate: (pipeline: CreatePipelineData) => void
  onPipelineUpdate: (pipeline: Pipeline) => void
  onPipelineDelete: (id: string) => void
  // Add filter props
  externalFilters?: ColumnFiltersState
  onFiltersChange?: (filters: ColumnFiltersState) => void
}

const columnHelper = createColumnHelper<Pipeline>()

const statusOptions = [
  { value: 'Invested', label: 'Invested' },
  { value: 'Diligence 3 (IC Memo)', label: 'Diligence 3 (IC Memo)' },
  { value: 'Diligence 2 (Screening Memo)', label: 'Diligence 2 (Screening Memo)' },
  { value: 'Diligence 1', label: 'Diligence 1' },
  { value: 'Debrief', label: 'Debrief' },
  { value: 'New Company', label: 'New Company' },
  { value: 'Meeting Booked', label: 'Meeting Booked' },
  { value: 'To Be Scheduled', label: 'To Be Scheduled' },
  { value: 'To Pass', label: 'To Pass' },
  { value: 'Waiting for Lead', label: 'Waiting for Lead' },
  { value: 'Follow Up', label: 'Follow Up' },
  { value: 'Actively Monitor', label: 'Actively Monitor' },
  { value: 'Passively Monitor', label: 'Passively Monitor' },
  { value: 'Out of Scope', label: 'Out of Scope' },
  { value: 'Pass', label: 'Pass' },
  { value: 'Newlab Syndicate Investment', label: 'Newlab Syndicate Investment' },
]

const priorityOptions = [
  { value: '1 - Highest', label: '1 - Highest' },
  { value: '2 - High', label: '2 - High' },
  { value: '3 - Medium', label: '3 - Medium' },
  { value: '4 - Low', label: '4 - Low' },
  { value: '0 - On Hold', label: '0 - On Hold' },
]

const roundStageOptions = [
  { value: 'Pre-Seed', label: 'Pre-Seed' },
  { value: 'Seed', label: 'Seed' },
  { value: 'Series A', label: 'Series A' },
  { value: 'Series B', label: 'Series B' },
  { value: 'Series C', label: 'Series C' },
  { value: 'Series D', label: 'Series D' },
  { value: 'Series E', label: 'Series E' },
  { value: 'Bridge', label: 'Bridge' },
  { value: 'Convertible Note', label: 'Convertible Note' },
  { value: 'Angel', label: 'Angel' },
  { value: 'Other', label: 'Other' },
]

// Column filter component
function ColumnFilter({ column }: { column: Column<Pipeline, unknown> }) {
  const columnFilterValue = column.getFilterValue()
  const { id } = column

  if (id === 'status') {
    return (
      <Select
        value={columnFilterValue as string || ''}
        onChange={(value) => column.setFilterValue(value || undefined)}
        options={[{ value: '', label: 'All Status' }, ...statusOptions]}
        className="w-40 text-xs"
      />
    )
  }

  if (id === 'priority') {
    return (
      <Select
        value={columnFilterValue as string || ''}
        onChange={(value) => column.setFilterValue(value || undefined)}
        options={[{ value: '', label: 'All Priority' }, ...priorityOptions]}
        className="w-40 text-xs"
      />
    )
  }

  if (id === 'roundStage') {
    return (
      <Select
        value={columnFilterValue as string || ''}
        onChange={(value) => column.setFilterValue(value || undefined)}
        options={[{ value: '', label: 'All Stages' }, ...roundStageOptions]}
        className="w-40 text-xs"
      />
    )
  }

  if (id === 'toReview') {
    return (
      <Select
        value={columnFilterValue as string || ''}
        onChange={(value) => {
          if (value === '') column.setFilterValue(undefined)
          else column.setFilterValue(value === 'true')
        }}
        options={[
          { value: '', label: 'All' },
          { value: 'true', label: 'To Review' },
          { value: 'false', label: 'Reviewed' }
        ]}
        className="w-32 text-xs"
      />
    )
  }

  // Default text filter for other columns
  return (
    <Input
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      placeholder={`Filter ${id}...`}
      className="w-32 text-xs"
    />
  )
}

export default function PipelineTableWithFilters({ 
  pipeline, 
  users: _users, // eslint-disable-line @typescript-eslint/no-unused-vars
  categories: _categories, // eslint-disable-line @typescript-eslint/no-unused-vars
  onPipelineCreate, 
  onPipelineUpdate, 
  onPipelineDelete,
  externalFilters = [],
  onFiltersChange
}: PipelineTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Use external filters directly, with callback for changes
  const handleColumnFiltersChange = (updater: any) => {
    const newFilters = typeof updater === 'function' ? updater(externalFilters) : updater
    onFiltersChange?.(newFilters)
  }

  const columns = useMemo(() => [
    columnHelper.accessor('companyName', {
      header: 'Company Name',
      cell: ({ getValue }) => (
        <div className="font-medium text-gray-900">{getValue()}</div>
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (!value || typeof value !== 'string') return true
        const companyName = row.getValue(id) as string
        return companyName?.toLowerCase().includes(value.toLowerCase()) || false
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue()
        if (!status) return '-'
        
        const colors: Record<string, string> = {
          'Invested': 'bg-green-100 text-green-800',
          'Diligence 3 (IC Memo)': 'bg-purple-100 text-purple-800',
          'Diligence 2 (Screening Memo)': 'bg-blue-100 text-blue-800',
          'Diligence 1': 'bg-cyan-100 text-cyan-800',
          'New Company': 'bg-gray-100 text-gray-800',
          'Meeting Booked': 'bg-yellow-100 text-yellow-800',
          'To Be Scheduled': 'bg-orange-100 text-orange-800',
          'Pass': 'bg-red-100 text-red-800',
          'To Pass': 'bg-red-100 text-red-800',
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
        )
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (!value || typeof value !== 'string') return true
        const status = row.getValue(id) as string
        return status === value
      },
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: ({ getValue }) => {
        const priority = getValue()
        if (!priority) return '-'
        
        const colors: Record<string, string> = {
          '1 - Highest': 'bg-red-100 text-red-800',
          '2 - High': 'bg-orange-100 text-orange-800',
          '3 - Medium': 'bg-yellow-100 text-yellow-800',
          '4 - Low': 'bg-green-100 text-green-800',
          '0 - On Hold': 'bg-gray-100 text-gray-800',
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority] || 'bg-gray-100 text-gray-800'}`}>
            {priority}
          </span>
        )
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (!value || typeof value !== 'string') return true
        const priority = row.getValue(id) as string
        return priority === value
      },
    }),
    columnHelper.accessor('roundStage', {
      header: 'Round Stage',
      cell: ({ getValue }) => getValue() || '-',
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (!value || typeof value !== 'string') return true
        const roundStage = row.getValue(id) as string
        return roundStage === value
      },
    }),
    columnHelper.accessor('geography', {
      header: 'Geography',
      cell: ({ getValue }) => getValue() || '-',
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (!value || typeof value !== 'string') return true
        const geography = row.getValue(id) as string | null
        return geography?.toLowerCase().includes(value.toLowerCase()) || false
      },
    }),
    columnHelper.accessor('toReview', {
      header: 'To Review',
      cell: ({ getValue }) => (
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          getValue() ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {getValue() ? 'Yes' : 'No'}
        </span>
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (value === undefined || value === null) return true
        return row.getValue(id) === value
      },
    }),
    columnHelper.accessor('roundSize', {
      header: 'Round Size',
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? formatCurrency(value / 100) : '-' // Convert from cents
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (!value || typeof value !== 'string') return true
        const roundSize = row.getValue(id) as number | null
        if (!roundSize) return false
        // Filter by formatted currency string
        const formattedValue = formatCurrency(roundSize / 100)
        return formattedValue.toLowerCase().includes(value.toLowerCase())
      },
    }),
    columnHelper.accessor('slrCategories', {
      header: 'SLR Categories',
      cell: ({ getValue }) => {
        const categories = getValue()
        if (!categories || categories.length === 0) return '-'
        
        return (
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 2).map((cat, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
              >
                {cat.name}
              </span>
            ))}
            {categories.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                +{categories.length - 2} more
              </span>
            )}
          </div>
        )
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (!value || typeof value !== 'string') return true
        const categories = row.getValue(id) as SLRCategory[]
        return categories?.some(cat => cat.name.toLowerCase().includes(value.toLowerCase())) || false
      },
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Last Updated',
      cell: ({ getValue }) => formatDateTime(getValue()),
      enableColumnFilter: false,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingPipeline(row.original)}
          >
            <EditIcon size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDeleteModalOpen(row.original.id)}
          >
            <DeleteIcon size={16} />
          </Button>
        </div>
      ),
      enableColumnFilter: false,
    }),
  ], [])

  const table = useReactTable({
    data: pipeline,
    columns,
    state: {
      sorting,
      columnFilters: externalFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue || typeof filterValue !== 'string') return true
      
      const value = row.getValue(columnId)
      // Only search in string values
      if (typeof value === 'string') {
        return value.toLowerCase().includes(filterValue.toLowerCase())
      }
      return false
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  })

  const handleCreatePipeline = (formData: FormData) => {
    const pipeline = {
      companyName: formData.get('companyName') as string,
      descriptionShort: formData.get('descriptionShort') as string,
      website: formData.get('website') as string,
      geography: formData.get('geography') as string,
      status: formData.get('status') as StatusEnum,
      priority: formData.get('priority') as PriorityEnum,
      roundStage: formData.get('roundStage') as RoundStageEnum,
      roundSize: formData.get('roundSize') ? parseFloat(formData.get('roundSize') as string) * 100 : null, // Convert to cents
      toReview: formData.get('toReview') === 'on',
      twoPagerReady: formData.get('twoPagerReady') === 'on',
    }
    onPipelineCreate(pipeline)
    setIsCreateModalOpen(false)
  }

  const handleUpdatePipeline = (formData: FormData) => {
    if (!editingPipeline) return
    
    const updatedPipeline = {
      ...editingPipeline,
      companyName: formData.get('companyName') as string,
      descriptionShort: formData.get('descriptionShort') as string,
      website: formData.get('website') as string,
      geography: formData.get('geography') as string,
      status: formData.get('status') as StatusEnum,
      priority: formData.get('priority') as PriorityEnum,
      roundStage: formData.get('roundStage') as RoundStageEnum,
      roundSize: formData.get('roundSize') ? parseFloat(formData.get('roundSize') as string) * 100 : null,
      toReview: formData.get('toReview') === 'on',
      twoPagerReady: formData.get('twoPagerReady') === 'on',
    }
    onPipelineUpdate(updatedPipeline)
    setEditingPipeline(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search pipeline..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon size={16} className="mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon size={16} className="mr-2" />
          Add Pipeline Entry
        </Button>
      </div>

      {/* Column Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Column Filters</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {table.getHeaderGroups()[0].headers
              .filter(header => header.column.getCanFilter())
              .map(header => (
                <div key={header.id} className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">
                    {header.column.columnDef.header as string}
                  </label>
                  <ColumnFilter column={header.column} />
                </div>
              ))
            }
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.resetColumnFilters()}
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className="text-gray-400">
                            {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} results
          {table.getFilteredRowModel().rows.length !== pipeline.length && (
            <span className="text-gray-500"> (filtered from {pipeline.length} total)</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingPipeline}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingPipeline(null)
        }}
        title={editingPipeline ? 'Edit Pipeline Entry' : 'Add New Pipeline Entry'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            if (editingPipeline) {
              handleUpdatePipeline(formData)
            } else {
              handleCreatePipeline(formData)
            }
          }}
          className="space-y-4"
        >
          <Input
            name="companyName"
            label="Company Name"
            defaultValue={editingPipeline?.companyName}
            required
          />
          <Textarea
            name="descriptionShort"
            label="Short Description"
            defaultValue={editingPipeline?.descriptionShort || ''}
          />
          <Input
            name="website"
            label="Website"
            type="url"
            defaultValue={editingPipeline?.website || ''}
          />
          <Input
            name="geography"
            label="Geography"
            defaultValue={editingPipeline?.geography || ''}
          />
          <Select
            name="status"
            label="Status"
            options={statusOptions}
            defaultValue={editingPipeline?.status || ''}
          />
          <Select
            name="priority"
            label="Priority"
            options={priorityOptions}
            defaultValue={editingPipeline?.priority || ''}
          />
          <Select
            name="roundStage"
            label="Round Stage"
            options={roundStageOptions}
            defaultValue={editingPipeline?.roundStage || ''}
          />
          <Input
            name="roundSize"
            label="Round Size ($)"
            type="number"
            step="0.01"
            defaultValue={editingPipeline?.roundSize ? (editingPipeline.roundSize / 100).toString() : ''}
          />
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="toReview"
                defaultChecked={editingPipeline?.toReview}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">To Review</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="twoPagerReady"
                defaultChecked={editingPipeline?.twoPagerReady}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">2-Pager Ready</span>
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false)
                setEditingPipeline(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingPipeline ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(null)}
        title="Delete Pipeline Entry"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this pipeline entry? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (isDeleteModalOpen) {
                  onPipelineDelete(isDeleteModalOpen)
                  setIsDeleteModalOpen(null)
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}