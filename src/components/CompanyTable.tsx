'use client'

import { useState, useMemo } from 'react'
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
} from '@tanstack/react-table'
import { Company, DealStageEnum } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button, Input, Select, Modal, Textarea } from '@/components/ui'
import { EditIcon, DeleteIcon, PlusIcon, SearchIcon } from '@/components/ui/Icons'

interface CompanyTableProps {
  companies: Company[]
  onCompanyUpdate: (company: Company) => void
  onCompanyDelete: (id: string) => void
  onCompanyCreate: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => void
}

const columnHelper = createColumnHelper<Company>()

const dealStageOptions = [
  { value: 'Prospect', label: 'Prospect' },
  { value: 'Qualification', label: 'Qualification' },
  { value: 'Proposal', label: 'Proposal' },
  { value: 'Negotiation', label: 'Negotiation' },
  { value: 'Closed Won', label: 'Closed Won' },
  { value: 'Closed Lost', label: 'Closed Lost' },
]

export default function CompanyTable({ 
  companies, 
  onCompanyUpdate, 
  onCompanyDelete, 
  onCompanyCreate 
}: CompanyTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | null>(null)

  const columns = useMemo(() => [
    columnHelper.accessor('companyName', {
      header: 'Company Name',
      cell: ({ getValue }) => (
        <div className="font-medium text-gray-900">{getValue()}</div>
      ),
    }),
    columnHelper.accessor('dealStage', {
      header: 'Deal Stage',
      cell: ({ getValue }) => {
        const stage = getValue()
        const colors = {
          'Prospect': 'bg-gray-100 text-gray-800',
          'Qualification': 'bg-blue-100 text-blue-800',
          'Proposal': 'bg-yellow-100 text-yellow-800',
          'Negotiation': 'bg-orange-100 text-orange-800',
          'Closed Won': 'bg-green-100 text-green-800',
          'Closed Lost': 'bg-red-100 text-red-800',
        }
        return (
          // @ts-expect-error - stage is a string
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[stage]}`}>
            {stage}
          </span>
        )
      },
    }),
    columnHelper.accessor('contactPerson', {
      header: 'Contact Person',
      cell: ({ getValue }) => getValue() || '-',
    }),
    columnHelper.accessor('contactEmail', {
      header: 'Contact Email',
      cell: ({ getValue }) => getValue() || '-',
    }),
    columnHelper.accessor('dealValue', {
      header: 'Deal Value',
      cell: ({ getValue }) => formatCurrency(getValue()),
    }),
    columnHelper.accessor('lastUpdated', {
      header: 'Last Updated',
      cell: ({ getValue }) => formatDateTime(getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingCompany(row.original)}
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
    }),
  ], [])

  const table = useReactTable({
    data: companies,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
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

  const handleCreateCompany = (formData: FormData) => {
    const company = {
      companyName: formData.get('companyName') as string,
      dealStage: formData.get('dealStage') as DealStageEnum,
      contactPerson: formData.get('contactPerson') as string,
      contactEmail: formData.get('contactEmail') as string,
      dealValue: parseFloat(formData.get('dealValue') as string) || 0,
      notes: formData.get('notes') as string,
    }
    onCompanyCreate(company)
    setIsCreateModalOpen(false)
  }

  const handleUpdateCompany = (formData: FormData) => {
    if (!editingCompany) return
    
    const updatedCompany = {
      ...editingCompany,
      companyName: formData.get('companyName') as string,
      dealStage: formData.get('dealStage') as DealStageEnum,
      contactPerson: formData.get('contactPerson') as string,
      contactEmail: formData.get('contactEmail') as string,
      dealValue: parseFloat(formData.get('dealValue') as string) || 0,
      notes: formData.get('notes') as string,
    }
    onCompanyUpdate(updatedCompany)
    setEditingCompany(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search companies..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon size={16} className="mr-2" />
          Add Company
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} results
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
        isOpen={isCreateModalOpen || !!editingCompany}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingCompany(null)
        }}
        title={editingCompany ? 'Edit Company' : 'Add New Company'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            if (editingCompany) {
              handleUpdateCompany(formData)
            } else {
              handleCreateCompany(formData)
            }
          }}
          className="space-y-4"
        >
          <Input
            name="companyName"
            label="Company Name"
            defaultValue={editingCompany?.companyName}
            required
          />
          <Select
            name="dealStage"
            label="Deal Stage"
            options={dealStageOptions}
            defaultValue={editingCompany?.dealStage}
            required
          />
          <Input
            name="contactPerson"
            label="Contact Person"
            defaultValue={editingCompany?.contactPerson}
          />
          <Input
            name="contactEmail"
            label="Contact Email"
            type="email"
            defaultValue={editingCompany?.contactEmail}
          />
          <Input
            name="dealValue"
            label="Deal Value"
            type="number"
            step="0.01"
            defaultValue={editingCompany?.dealValue?.toString()}
          />
          <Textarea
            name="notes"
            label="Notes"
            defaultValue={editingCompany?.notes}
          />
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false)
                setEditingCompany(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingCompany ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(null)}
        title="Delete Company"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this company? This action cannot be undone.
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
                  onCompanyDelete(isDeleteModalOpen)
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