'use client'

import type { SkuaCalculationResult } from '@/src/lib/calculations/skua-formulas'
import { useCallback, useState } from 'react'
import MeasurementForm from './components/measurement-form'
import PredictionDisplay from './components/prediction-display'

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

export default function HomePage() {
  const [currentPrediction, setCurrentPrediction] = useState<SkuaCalculationResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionHistory, setSubmissionHistory] = useState<Array<{
    measurement: MeasurementFormData
    prediction: SkuaCalculationResult
    submittedAt: Date
  }>>([])

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

      if (result.success && result.data.prediction) {
        const newEntry = {
          measurement: measurementData,
          prediction: result.data.prediction,
          submittedAt: new Date()
        }
        
        setSubmissionHistory(prev => [newEntry, ...prev])
        setCurrentPrediction(result.data.prediction)
      } else {
        console.error('Submission failed:', result.error)
        // TODO: Show error toast/notification
      }

    } catch (error) {
      console.error('Failed to submit measurement:', error)
      // TODO: Show error toast/notification
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const handleCalculationUpdate = useCallback((prediction: SkuaCalculationResult | null) => {
    setCurrentPrediction(prediction)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ovotime</h1>
            <p className="text-lg text-gray-600 mt-2">
              Skua Egg Hatching Time Prediction Tool
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Based on research from <em>Seabird 32-84</em> - Arctic and Great Skua studies in the Faroe Islands
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Measurement Form */}
          <div className="space-y-6">
            <MeasurementForm
              onSubmit={handleMeasurementSubmit}
              onCalculationUpdate={handleCalculationUpdate}
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

            {/* Submission History */}
            {submissionHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Submissions ({submissionHistory.length})
                </h3>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {submissionHistory.map((entry, index) => (
                    <div
                      key={entry.measurement.measurementId}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setCurrentPrediction(entry.prediction)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            entry.measurement.speciesType === 'arctic' 
                              ? 'bg-blue-500' 
                              : 'bg-purple-500'
                          }`}></div>
                          <span className="font-medium text-gray-900">
                            {entry.measurement.speciesType === 'arctic' ? 'Arctic Skua' : 'Great Skua'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {entry.submittedAt.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Measurements:</p>
                          <p className="font-mono text-xs">
                            L: {entry.measurement.measurements.length}mm, 
                            B: {entry.measurement.measurements.breadth}mm, 
                            M: {entry.measurement.measurements.mass}g
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Prediction:</p>
                          <p className="font-semibold text-blue-700">
                            {entry.prediction.tbh} days
                          </p>
                        </div>
                      </div>
                      
                      {entry.measurement.location?.siteName && (
                        <p className="text-xs text-gray-500 mt-2">
                          📍 {entry.measurement.location.siteName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              Scientific calculations based on <em>"Seabird 32-84"</em> research paper.
            </p>
            <p className="mt-1">
              Developed for Arctic and Great Skua field research in the Faroe Islands.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
