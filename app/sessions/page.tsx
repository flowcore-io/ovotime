'use client'

import { formatDateInternational } from '@/src/lib/utils'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import SessionManager from '../components/session-manager'

interface SessionData {
  sessionId: string
  title: string
  researcher: string
  location: string | { latitude?: number; longitude?: number; siteName?: string }
  startedAt: Date
  endedAt?: Date
  notes?: string
  measurementCount: number
  status: 'active' | 'completed' | 'paused'
}

// Helper function to format location for display
const formatLocation = (location: string | { latitude?: number; longitude?: number; siteName?: string } | null | undefined): string => {
  if (!location) return 'Unknown location'
  
  if (typeof location === 'string') {
    return location
  }
  
  if (typeof location === 'object') {
    if (location.siteName) {
      return location.siteName
    }
    if (location.latitude !== undefined && location.longitude !== undefined) {
      return `${location.latitude}, ${location.longitude}`
    }
    return 'Coordinates provided'
  }
  
  return 'Unknown location'
}

export default function SessionsPage() {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load existing sessions on component mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch('/api/sessions')
        const result = await response.json()
        
        if (result.success && result.data.sessions) {
          setSessionHistory(result.data.sessions)
          // Find active session
          const activeSession = result.data.sessions.find((s: SessionData) => s.status === 'active')
          if (activeSession) {
            setCurrentSession(activeSession)
          }
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSessions()
  }, [])

  const handleSessionCreate = (session: SessionData) => {
    setCurrentSession(session)
    setSessionHistory(prev => [session, ...prev])
  }

  const handleSessionEnd = (sessionId: string) => {
    setCurrentSession(null)
    setSessionHistory(prev => 
      prev.map(session => 
        session.sessionId === sessionId 
          ? { ...session, status: 'completed' as const, endedAt: new Date() }
          : session
      )
    )
  }

  const handleExportData = (sessionId: string, format: 'csv' | 'json') => {
    console.log(`Exporting session ${sessionId} in ${format} format`)
    // Export handling is done in the component
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Research Sessions</h1>
              <p className="text-lg text-gray-600 mt-2">
                Manage your field research sessions and export data
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Measurements
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Session Manager */}
          <SessionManager
            currentSession={currentSession}
            sessionHistory={sessionHistory}
            onSessionCreate={handleSessionCreate}
            onSessionEnd={handleSessionEnd}
            onExportData={handleExportData}
          />

          {/* Session Statistics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Session Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {sessionHistory.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Total Sessions
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {sessionHistory.filter(s => s.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Active Sessions
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">
                  {sessionHistory.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Completed Sessions
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {sessionHistory.reduce((total, session) => total + session.measurementCount, 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Total Measurements
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {sessionHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {sessionHistory.slice(0, 5).map((session) => (
                  <div
                    key={session.sessionId}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        session.status === 'active' 
                          ? 'bg-green-500' 
                          : session.status === 'completed'
                          ? 'bg-gray-500'
                          : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{session.title}</h4>
                        <p className="text-sm text-gray-600">
                          {session.researcher} • {formatLocation(session.location)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">
                        {session.measurementCount} measurements
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateInternational(new Date(session.startedAt))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              How to Use Sessions
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>Start a Session:</strong> Create a new research session with title, researcher name, and location</p>
              <p>• <strong>Record Measurements:</strong> Go back to the main page to record egg measurements within your session</p>
              <p>• <strong>Export Data:</strong> Export your session data in CSV or JSON format for analysis</p>
              <p>• <strong>End Session:</strong> Complete your session when fieldwork is done</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 