'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui'
import { SettingsIcon } from '@/components/ui/Icons'
import Link from 'next/link'

export default function Header() {
  const { user } = useUser()
  const userEmail = user?.emailAddresses[0]?.emailAddress || ''
  const allowedDomain = 'newsystemventures.com'
  const isAdmin = userEmail.endsWith(`@${allowedDomain}`)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            New Systems Nexus
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <SettingsIcon size={16} className="mr-2" />
                Admin
              </Button>
            </Link>
          )}
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500">
                {userEmail}
              </div>
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}