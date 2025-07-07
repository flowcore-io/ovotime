'use client'

import { formatDateInternational, formatDateTimeInternational, generateId } from '@/src/lib/utils'
import { useCallback, useState } from 'react'

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

interface SessionManagerProps {
  onSessionCreate?: (session: SessionData) => void
  onSessionEnd?: (sessionId: string) => void
  onExportData?: (sessionId: string, format: 'csv' | 'json') => void
  currentSession?: SessionData | null
  sessionHistory?: SessionData[]
  className?: string
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

export default function SessionManager({
  onSessionCreate,
  onSessionEnd,
  onExportData,
  currentSession,
  sessionHistory = [],
  className = ''
}: SessionManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [newSession, setNewSession] = useState({
    title: '',
    researcher: '',
    location: '',
    notes: ''
  })

  const handleCreateSession = useCallback(async () => {
    if (!newSession.title || !newSession.researcher) {
      alert('Please fill in required fields (Title and Researcher)')
      return
    }

    setIsCreating(true)
    
    try {
      const sessionData: SessionData = {
        sessionId: generateId(),
        title: newSession.title,
        researcher: newSession.researcher,
        location: newSession.location,
        startedAt: new Date(),
        notes: newSession.notes,
        measurementCount: 0,
        status: 'active'
      }

      // Call API to create session
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      })

      const result = await response.json()

      if (result.success) {
        onSessionCreate?.(sessionData)
        setNewSession({ title: '', researcher: '', location: '', notes: '' })
        alert('Session created successfully!')
      } else {
        alert('Failed to create session: ' + result.error)
      }

    } catch (error) {
      console.error('Failed to create session:', error)
      alert('Failed to create session. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }, [newSession, onSessionCreate])

  const handleEndSession = useCallback(async (sessionId: string) => {
    if (!confirm('Are you sure you want to end this session?')) return

    try {
      // Update session status
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'completed',
          endedAt: new Date()
        })
      })

      const result = await response.json()

      if (result.success) {
        onSessionEnd?.(sessionId)
        alert('Session ended successfully!')
      } else {
        alert('Failed to end session: ' + result.error)
      }

    } catch (error) {
      console.error('Failed to end session:', error)
      alert('Failed to end session. Please try again.')
    }
  }, [onSessionEnd])

  const handleExportData = useCallback(async (sessionId: string, format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/export?format=${format}`)
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `session_${sessionId}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      onExportData?.(sessionId, format)
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data. Please try again.')
    }
  }, [onExportData])

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Research Session Manager</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage your field research sessions and export data
        </p>
      </div>

      {/* Current Session Display */}
      {currentSession && (
        <div className="border-b border-gray-200 px-6 py-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{currentSession.title}</h4>
              <p className="text-sm text-gray-600">
                {currentSession.researcher} • {formatLocation(currentSession.location)}
              </p>
              <p className="text-sm text-gray-500">
                Started: {formatDateTimeInternational(new Date(currentSession.startedAt))}
              </p>
              <p className="text-sm text-gray-500">
                Measurements: {currentSession.measurementCount}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                currentSession.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentSession.status}
              </span>
              <button
                onClick={() => handleEndSession(currentSession.sessionId)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                End Session
              </button>
              <button
                onClick={() => handleExportData(currentSession.sessionId, 'csv')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExportData(currentSession.sessionId, 'json')}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Session */}
      {!currentSession && (
        <div className="px-6 py-4">
          <h4 className="font-medium text-gray-900 mb-4">Start New Research Session</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Faroe Islands Study 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Researcher Name *
                </label>
                <input
                  type="text"
                  value={newSession.researcher}
                  onChange={(e) => setNewSession(prev => ({ ...prev, researcher: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={newSession.location}
                onChange={(e) => setNewSession(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Sandoy, Faroe Islands"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={newSession.notes}
                onChange={(e) => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes about this research session..."
              />
            </div>
            
            <button
              onClick={handleCreateSession}
              disabled={isCreating || !newSession.title || !newSession.researcher}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Creating Session...' : 'Start New Session'}
            </button>
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Session History</h4>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showHistory ? 'Hide' : 'Show'} History ({sessionHistory.length})
          </button>
        </div>
        
        {showHistory && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sessionHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No previous sessions found
              </p>
            ) : (
              sessionHistory.map((session) => (
                <div
                  key={session.sessionId}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{session.title}</h5>
                      <p className="text-sm text-gray-600">
                        {session.researcher} • {formatLocation(session.location)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateInternational(new Date(session.startedAt))} • {session.measurementCount} measurements
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        session.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : session.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                      <button
                        onClick={() => handleExportData(session.sessionId, 'csv')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
} 