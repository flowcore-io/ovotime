'use client'

import type { SkuaCalculationResult } from '@/src/lib/calculations/skua-formulas'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import MeasurementForm from './components/measurement-form'
import PredictionDisplay from './components/prediction-display'
import TBHScatterChart from './components/tbh-scatter-chart'

interface MeasurementFormData {
  measurementId: string
  sessionId?: string
  speciesType: 'arctic' | 'great'
  measurements: {
    length: number
    breadth: number
    mass: number
    kv: number
  }
  location?: {
    latitude?: number
    longitude?: number
    siteName?: string
  }
  researcherNotes?: string
}

interface PersistedMeasurement {
  measurementId: string
  sessionId?: string
  sessionName?: string
  researcher?: string
  speciesType: 'arctic' | 'great'
  measurements: {
    length: number
    breadth: number
    mass: number
    kv: number
  }
  location?: {
    latitude?: number
    longitude?: number
    siteName?: string
  }
  researcherNotes?: string
  prediction?: SkuaCalculationResult & {
    formulaName?: string
    formulaVersion?: string
    calculatedAt?: Date
  }
  submittedAt: Date
  archived: boolean
  archivedBy?: string
  archiveReason?: string
  archivedAt?: Date
}

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

export default function HomePage() {
  const [currentPrediction, setCurrentPrediction] = useState<SkuaCalculationResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [submissionHistory, setSubmissionHistory] = useState<Array<{
    measurement: MeasurementFormData
    prediction: SkuaCalculationResult
    submittedAt: Date
  }>>([])
  const [persistedMeasurements, setPersistedMeasurements] = useState<PersistedMeasurement[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)

  // Load measurements and current session from API on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Load measurements
        const measurementsResponse = await fetch(`/api/measurements?includeArchived=${showArchived}&limit=100`)
        const measurementsResult = await measurementsResponse.json()
        
        if (measurementsResult.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPersistedMeasurements(measurementsResult.data.measurements.map((m: any) => ({
            ...m,
            submittedAt: new Date(m.submittedAt),
            archivedAt: m.archivedAt ? new Date(m.archivedAt) : undefined
          })))
        } else {
          console.error('Failed to load measurements:', measurementsResult.error)
        }

        // Load current active session
        const sessionsResponse = await fetch('/api/sessions')
        const sessionsResult = await sessionsResponse.json()
        
        if (sessionsResult.success && sessionsResult.data.sessions) {
          const activeSession = sessionsResult.data.sessions.find((s: SessionData) => s.status === 'active')
          if (activeSession) {
            setCurrentSession({
              ...activeSession,
              startedAt: new Date(activeSession.startedAt),
              endedAt: activeSession.endedAt ? new Date(activeSession.endedAt) : undefined
            })
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [showArchived])

  const handleMeasurementSubmit = useCallback(async (measurementData: MeasurementFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(measurementData)
      })

      const result = await response.json()

      if (result.success) {
        // Handle successful submission (including timeouts with warnings)
        if (result.warning) {
          // Warning case - show helpful message with better formatting
          console.warn('⚠️ Submission completed with warning:', result.message)
          
          // Show more user-friendly notification
          const notificationMessage = `
🔄 ${result.message}

ℹ️ ${result.details}

💡 ${result.troubleshooting}

The measurement has been submitted successfully. It may take a few moments to appear in the list due to system initialization.
          `.trim()
          
          alert(notificationMessage)
          
          // Add a slight delay before reloading to give event processing time
          setTimeout(async () => {
            // Reload measurements after delay
            const measurementsResponse = await fetch(`/api/measurements?includeArchived=${showArchived}&limit=100`)
            const measurementsResult = await measurementsResponse.json()
            
            if (measurementsResult.success) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setPersistedMeasurements(measurementsResult.data.measurements.map((m: any) => ({
                ...m,
                submittedAt: new Date(m.submittedAt),
                archivedAt: m.archivedAt ? new Date(m.archivedAt) : undefined
              })))
            }
          }, 2000) // 2 second delay for event processing
          
        } else if (result.data?.prediction) {
          // Normal success case with prediction
          const newEntry = {
            measurement: measurementData,
            prediction: result.data.prediction,
            submittedAt: new Date()
          }
          
          setSubmissionHistory(prev => [newEntry, ...prev])
          setCurrentPrediction(result.data.prediction)
        }
        
        // Always reload measurements for both success and timeout cases (unless it's a warning case with delayed reload)
        if (!result.warning) {
          const measurementsResponse = await fetch(`/api/measurements?includeArchived=${showArchived}&limit=100`)
          const measurementsResult = await measurementsResponse.json()
          
          if (measurementsResult.success) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPersistedMeasurements(measurementsResult.data.measurements.map((m: any) => ({
              ...m,
              submittedAt: new Date(m.submittedAt),
              archivedAt: m.archivedAt ? new Date(m.archivedAt) : undefined
            })))
          }
        }

        // Reload current session to update measurement count
        if (currentSession) {
          const sessionsResponse = await fetch('/api/sessions')
          const sessionsResult = await sessionsResponse.json()
          
          if (sessionsResult.success && sessionsResult.data.sessions) {
            const activeSession = sessionsResult.data.sessions.find((s: SessionData) => s.status === 'active')
            if (activeSession) {
              setCurrentSession({
                ...activeSession,
                startedAt: new Date(activeSession.startedAt),
                endedAt: activeSession.endedAt ? new Date(activeSession.endedAt) : undefined
              })
            }
          }
        }
      } else {
        console.error('Submission failed:', result.error)
        alert(`❌ Submission failed: ${result.message || result.error}`)
      }

    } catch (error) {
      console.error('Failed to submit measurement:', error)
      // TODO: Show error toast/notification
    } finally {
      setIsSubmitting(false)
    }
  }, [showArchived, currentSession])

  const handleCalculationUpdate = useCallback((prediction: SkuaCalculationResult | null) => {
    setCurrentPrediction(prediction)
  }, [])

  const handleArchiveMeasurement = useCallback(async (measurementId: string) => {
    const secretWord = prompt('Enter secret word to archive this measurement:')
    if (!secretWord) return

    const archivedBy = prompt('Enter your name:')
    if (!archivedBy) return

    const archiveReason = prompt('Reason for archiving (optional):') || undefined

    try {
      const response = await fetch(`/api/measurements/${measurementId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secretWord,
          archivedBy,
          archiveReason
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('Measurement archived successfully!')
        // Reload measurements to get updated data
        const measurementsResponse = await fetch(`/api/measurements?includeArchived=${showArchived}&limit=100`)
        const measurementsResult = await measurementsResponse.json()
        
        if (measurementsResult.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPersistedMeasurements(measurementsResult.data.measurements.map((m: any) => ({
            ...m,
            submittedAt: new Date(m.submittedAt),
            archivedAt: m.archivedAt ? new Date(m.archivedAt) : undefined
          })))
        }
      } else {
        alert(`Failed to archive measurement: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to archive measurement:', error)
      alert('Failed to archive measurement')
    }
  }, [showArchived])

  // Combine local submissions with persisted measurements for display
  const allMeasurements = [
    ...submissionHistory.map(entry => ({
      measurementId: entry.measurement.measurementId,
      speciesType: entry.measurement.speciesType,
      measurements: entry.measurement.measurements,
      prediction: entry.prediction,
      submittedAt: entry.submittedAt,
      archived: false,
      location: entry.measurement.location,
      researcherNotes: entry.measurement.researcherNotes,
      sessionName: entry.measurement.sessionId && currentSession ? `${currentSession.title} (${formatLocation(currentSession.location)})` : undefined,
      archivedBy: undefined,
      archiveReason: undefined,
      archivedAt: undefined
    })),
    ...persistedMeasurements.filter(m => 
      !submissionHistory.some(s => s.measurement.measurementId === m.measurementId)
    ).map(m => ({
      measurementId: m.measurementId,
      speciesType: m.speciesType,
      measurements: m.measurements,
      prediction: m.prediction ? {
        tbh: m.prediction.tbh,
        eggDensity: m.prediction.eggDensity,
        eggVolume: m.prediction.eggVolume,
        confidence: m.prediction.confidence,
        speciesType: m.speciesType,
        formula: m.prediction.formulaName ? {
          name: m.prediction.formulaName,
          version: m.prediction.formulaVersion || '1.0',
          coefficients: {}
        } : {
          name: 'skua_tbh',
          version: '1.0',
          coefficients: {}
        }
      } : null,
      submittedAt: m.submittedAt,
      archived: m.archived,
      location: m.location,
      researcherNotes: m.researcherNotes,
      sessionName: m.sessionName,
      archivedBy: m.archivedBy,
      archiveReason: m.archiveReason,
      archivedAt: m.archivedAt
    }))
  ].filter(m => showArchived || !m.archived)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ovotime</h1>
              <p className="text-gray-600 mt-1">Arctic & Great Skua Egg Hatching Prediction</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  showArchived 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
              <Link
                href="/sessions"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Manage Sessions
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Measurement Form */}
          <div className="space-y-6">
            {currentSession && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">📝 Active Session</h4>
                    <p className="text-sm text-blue-700">
                      {currentSession.title} • {currentSession.researcher}
                    </p>
                    <p className="text-xs text-blue-600">
                      📍 {formatLocation(currentSession.location)}
                    </p>
                    <p className="text-xs text-blue-600">
                      {currentSession.measurementCount} measurements recorded
                    </p>
                  </div>
                  <Link
                    href="/sessions"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            )}
            <MeasurementForm
              onSubmit={handleMeasurementSubmit}
              onCalculationUpdate={handleCalculationUpdate}
              sessionId={currentSession?.sessionId}
              className="sticky top-8"
            />
          </div>

          {/* Right Column - Prediction Display */}
          <div className="space-y-6">
            <PredictionDisplay
              prediction={currentPrediction}
              isLoading={isSubmitting}
              showDetails={true}
            />

            {/* Measurement History */}
            {(isLoading || allMeasurements.length > 0) && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Measurements ({allMeasurements.length})
                    {isLoading && <span className="text-sm text-gray-500 ml-2">Loading...</span>}
                  </h3>
                  <button
                    onClick={async () => {
                      setIsLoading(true)
                      try {
                        const measurementsResponse = await fetch(`/api/measurements?includeArchived=${showArchived}&limit=100`)
                        const measurementsResult = await measurementsResponse.json()
                        
                        if (measurementsResult.success) {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          setPersistedMeasurements(measurementsResult.data.measurements.map((m: any) => ({
                            ...m,
                            submittedAt: new Date(m.submittedAt),
                            archivedAt: m.archivedAt ? new Date(m.archivedAt) : undefined
                          })))
                        }
                      } catch (error) {
                        console.error('Failed to refresh measurements:', error)
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading measurements...</span>
                    </div>
                  ) : allMeasurements.map((entry) => (
                    <div
                      key={entry.measurementId}
                      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                        entry.archived 
                          ? 'border-gray-300 bg-gray-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => entry.prediction && setCurrentPrediction(entry.prediction)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            entry.speciesType === 'arctic' 
                              ? 'bg-blue-500' 
                              : 'bg-purple-500'
                          }`}></div>
                          <span className={`font-medium ${
                            entry.archived ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {entry.speciesType === 'arctic' ? 'Arctic Skua' : 'Great Skua'}
                          </span>
                          {entry.archived && (
                            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {entry.submittedAt.toLocaleTimeString()}
                          </span>
                          {!entry.archived && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleArchiveMeasurement(entry.measurementId)
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Measurements:</p>
                          <p className="font-mono text-xs">
                            L: {entry.measurements.length}mm, 
                            B: {entry.measurements.breadth}mm, 
                            M: {entry.measurements.mass}g
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Prediction:</p>
                          <p className={`font-semibold ${
                            entry.archived ? 'text-gray-600' : 'text-blue-700'
                          }`}>
                            {entry.prediction ? `${entry.prediction.tbh} days` : 'No prediction'}
                          </p>
                        </div>
                      </div>
                      
                      {entry.sessionName && (
                        <p className="text-xs text-gray-500 mt-2">
                          �� {entry.sessionName}
                        </p>
                      )}
                      
                      {entry.location?.siteName && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {entry.location.siteName}
                        </p>
                      )}

                      {entry.archived && entry.archivedBy && (
                        <p className="text-xs text-gray-500 mt-1">
                          🗃️ Archived by {entry.archivedBy} {entry.archivedAt && `on ${entry.archivedAt.toLocaleDateString()}`}
                          {entry.archiveReason && ` - ${entry.archiveReason}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart Section - Full Width */}
        {allMeasurements.filter(m => m.prediction && !m.archived).length > 0 && (
          <div className="mt-8">
            <TBHScatterChart
              data={allMeasurements
                .filter(m => m.prediction && !m.archived)
                .map(entry => ({
                  measurementId: entry.measurementId,
                  speciesType: entry.speciesType,
                  measurements: entry.measurements,
                  prediction: entry.prediction!,
                  submittedAt: entry.submittedAt
                }))
              }
              height={500}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 Ovotime - Scientific Skua Egg Research Tool</p>
            <p className="text-sm mt-2">
              Accurate hatching time predictions for Arctic and Great Skua species
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
