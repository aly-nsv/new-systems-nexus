'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Permission, UserRole } from '@/types'
import { Button, Input, Select, Modal, Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui'
import { PlusIcon, EditIcon, DeleteIcon } from '@/components/ui/Icons'
import Header from '@/components/Header'
import Link from 'next/link'

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]

export default function AdminPage() {
  const { user, isLoaded } = useUser()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | null>(null)

  const userEmail = user?.emailAddresses[0]?.emailAddress || ''
  const allowedDomain = 'newsystemventures.com'
  const isAdmin = userEmail.endsWith(`@${allowedDomain}`)

  useEffect(() => {
    if (isLoaded && user && isAdmin) {
      fetchPermissions()
    }
  }, [isLoaded, user, isAdmin])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/permissions')

      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.')
          return
        }
        throw new Error('Failed to fetch permissions')
      }

      const data = await response.json()
      setPermissions(data)
    } catch (err) {
      setError('Failed to load permissions')
      console.error('Error fetching permissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePermission = async (formData: FormData) => {
    try {
      const email = formData.get('email') as string
      const role = formData.get('role') as UserRole

      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      })

      if (!response.ok) {
        throw new Error('Failed to create permission')
      }

      const newPermission = await response.json()
      setPermissions(prev => [newPermission, ...prev])
      setIsCreateModalOpen(false)
    } catch (err) {
      console.error('Error creating permission:', err)
      setError('Failed to create permission')
    }
  }

  const handleUpdatePermission = async (formData: FormData) => {
    if (!editingPermission) return

    try {
      const role = formData.get('role') as UserRole

      const response = await fetch(`/api/permissions/${editingPermission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        throw new Error('Failed to update permission')
      }

      const updated = await response.json()
      setPermissions(prev => prev.map(permission => 
        permission.id === updated.id ? updated : permission
      ))
      setEditingPermission(null)
    } catch (err) {
      console.error('Error updating permission:', err)
      setError('Failed to update permission')
    }
  }

  const handleDeletePermission = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete permission')
      }

      setPermissions(prev => prev.filter(permission => permission.id !== permissionId))
      setIsDeleteModalOpen(null)
    } catch (err) {
      console.error('Error deleting permission:', err)
      setError('Failed to delete permission')
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (error && error.includes('Access denied')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 overflow-auto p-1 pt-2 px-2">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Permissions</h1>
                <p className="text-gray-600">Manage user access and roles</p>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <PlusIcon size={16} className="mr-2" />
                Add User
              </Button>
            </div>
          </div>

          {error && !error.includes('Access denied') && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Email</TableCell>
                  <TableCell header>Role</TableCell>
                  <TableCell header>Added By</TableCell>
                  <TableCell header>Created</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>{permission.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        permission.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {permission.role}
                      </span>
                    </TableCell>
                    <TableCell>{permission.addedBy}</TableCell>
                    <TableCell>
                      {new Date(permission.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPermission(permission)}
                        >
                          <EditIcon size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsDeleteModalOpen(permission.id)}
                        >
                          <DeleteIcon size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {permissions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No permissions found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create/Edit Permission Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingPermission}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingPermission(null)
        }}
        title={editingPermission ? 'Edit Permission' : 'Add User Permission'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            if (editingPermission) {
              handleUpdatePermission(formData)
            } else {
              handleCreatePermission(formData)
            }
          }}
          className="space-y-4"
        >
          <Input
            name="email"
            label="Email Address"
            type="email"
            defaultValue={editingPermission?.email}
            disabled={!!editingPermission}
            required
          />
          <Select
            name="role"
            label="Role"
            options={roleOptions}
            defaultValue={editingPermission?.role}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false)
                setEditingPermission(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingPermission ? 'Update' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(null)}
        title="Delete Permission"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to remove this user&apos;s permission? They will no longer be able to access the application.
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
                  handleDeletePermission(isDeleteModalOpen)
                }
              }}
            >
              Remove Permission
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}