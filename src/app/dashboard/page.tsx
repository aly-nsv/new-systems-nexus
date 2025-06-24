'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { ColumnFiltersState } from '@tanstack/react-table'
import { Pipeline, CreatePipelineData, PipelineFilter, User, SLRCategory, SourceCategory, DealLeadCategory, ThemeCategory } from '@/types'
import PipelineTableWithFilters from '@/components/PipelineTableWithFilters'
import ViewsSidebarWithFilters from '@/components/ViewsSidebarWithFilters'
import Header from '@/components/Header'

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const [pipeline, setPipeline] = useState<Pipeline[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState({
    slrCategories: [] as SLRCategory[],
    sourceCategories: [] as SourceCategory[],
    dealLeadCategories: [] as DealLeadCategory[],
    themeCategories: [] as ThemeCategory[]
  })
  const [activeView, setActiveView] = useState<string>('all')
  const [filters, setFilters] = useState<PipelineFilter>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      fetchData()
    }
  }, [isLoaded, user])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('fetching pipeline data')
      
      const [pipelineRes, usersRes, categoriesRes] = await Promise.all([
        fetch('/api/pipeline'),
        fetch('/api/users'),
        fetch('/api/categories')
      ])

      if (!pipelineRes.ok || !usersRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [pipelineData, usersData, categoriesData] = await Promise.all([
        pipelineRes.json(),
        usersRes.json(),
        categoriesRes.json()
      ])

      setPipeline(pipelineData.data || pipelineData)
      setUsers(usersData)
      setCategories(categoriesData)
    } catch (err) {
      setError('Failed to load data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Deprecated: Server-side view filtering - now handled by client-side filters
  // const fetchPipelineView = async (viewName: string) => { ... }
  // const applyFilters = useCallback(() => { ... })
  
  // Client-side filtering is now handled by the PipelineTableWithFilters component
  // and coordinated through the ViewsSidebarWithFilters component

  const handlePipelineCreate = async (pipelineData: CreatePipelineData) => {
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pipelineData),
      })

      if (!response.ok) {
        throw new Error('Failed to create pipeline entry')
      }

      const newPipeline = await response.json()
      setPipeline(prev => [newPipeline, ...prev])
    } catch (err) {
      console.error('Error creating pipeline entry:', err)
      setError('Failed to create pipeline entry')
    }
  }

  const handlePipelineUpdate = async (updatedPipeline: Pipeline) => {
    try {
      const response = await fetch(`/api/pipeline/${updatedPipeline.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPipeline),
      })

      if (!response.ok) {
        throw new Error('Failed to update pipeline entry')
      }

      const updated = await response.json()
      setPipeline(prev => prev.map(item => 
        item.id === updated.id ? updated : item
      ))
    } catch (err) {
      console.error('Error updating pipeline entry:', err)
      setError('Failed to update pipeline entry')
    }
  }

  const handlePipelineDelete = async (pipelineId: string) => {
    try {
      const response = await fetch(`/api/pipeline/${pipelineId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete pipeline entry')
      }

      setPipeline(prev => prev.filter(item => item.id !== pipelineId))
    } catch (err) {
      console.error('Error deleting pipeline entry:', err)
      setError('Failed to delete pipeline entry')
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const getViewTitle = () => {
    switch (activeView) {
      case 'new-companies':
        return 'New Companies'
      case 'action-items':
        return 'Action Items'
      case 'investment-pipeline':
        return 'Investment Pipeline'
      case 'portfolio':
        return 'Portfolio'
      case 'diligence':
        return 'In Diligence'
      case 'meetings-scheduled':
        return 'Meetings Scheduled'
      case 'to-pass':
        return 'To Pass'
      case 'high-priority':
        return 'High Priority'
      case 'seed-stage':
        return 'Seed Stage'
      case 'series-a':
        return 'Series A'
      default:
        return 'All Pipeline'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ViewsSidebarWithFilters
        activeView={activeView}
        onViewSelect={setActiveView}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        users={users}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {getViewTitle()}
              </h1>
              <p className="text-gray-600">
                {activeView !== 'all' && columnFilters.length > 0 ? 'Filtered view' : `${pipeline.length} entries`}
              </p>
            </div>
            
            <PipelineTableWithFilters
              pipeline={pipeline}
              users={users}
              categories={categories}
              onPipelineCreate={handlePipelineCreate}
              onPipelineUpdate={handlePipelineUpdate}
              onPipelineDelete={handlePipelineDelete}
              externalFilters={columnFilters}
              onFiltersChange={setColumnFilters}
            />
          </div>
        </main>
      </div>
    </div>
  )
}