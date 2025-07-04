'use client'

import { calculateSkuaTBH, SkuaCalculationInput, SkuaCalculationResult, validateCalculationInput } from '@/src/lib/calculations/skua-formulas'
import { generateId } from '@/src/lib/utils'
import { validateEggMeasurement } from '@/src/lib/validation'
import type { SpeciesType } from '@/src/types'
import { useEffect, useState } from 'react'

interface MeasurementFormProps {
  onSubmit?: (measurement: MeasurementFormData) => void
  onCalculationUpdate?: (result: SkuaCalculationResult | null) => void
  sessionId?: string
  className?: string
}

interface MeasurementFormData {
  measurementId: string
  sessionId?: string
  speciesType: SpeciesType
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

interface FormErrors {
  length?: string
  breadth?: string
  mass?: string
  kv?: string
  speciesType?: string
  latitude?: string
  longitude?: string
  siteName?: string
  general?: string
}

export default function MeasurementForm({ 
  onSubmit, 
  onCalculationUpdate, 
  sessionId, 
  className = '' 
}: MeasurementFormProps) {
  // Form state
  const [formData, setFormData] = useState<MeasurementFormData>({
    measurementId: generateId(),
    sessionId,
    speciesType: 'arctic',
    measurements: {
      length: 0,
      breadth: 0,
      mass: 0,
      kv: 0.507
    },
    location: {},
    researcherNotes: ''
  })

  // Validation and calculation state
  const [errors, setErrors] = useState<FormErrors>({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculation, setCalculation] = useState<SkuaCalculationResult | null>(null)
  const [isValid, setIsValid] = useState(false)

  // Real-time calculation when form data changes
  useEffect(() => {
    const performCalculation = async () => {
      const { measurements, speciesType } = formData
      
      // Skip calculation if essential fields are missing or zero
      if (measurements.length <= 0 || measurements.breadth <= 0 || measurements.mass <= 0 || measurements.kv <= 0) {
        setCalculation(null)
        onCalculationUpdate?.(null)
        return
      }

      setIsCalculating(true)
      
      try {
        const input: SkuaCalculationInput = {
          length: measurements.length,
          breadth: measurements.breadth,
          mass: measurements.mass,
          kv: measurements.kv,
          speciesType
        }

        // Validate input
        const validation = validateCalculationInput(input)
        if (!validation.isValid) {
          setCalculation(null)
          onCalculationUpdate?.(null)
          return
        }

        // Perform calculation
        const result = calculateSkuaTBH(input)
        setCalculation(result)
        onCalculationUpdate?.(result)

      } catch (error) {
        console.error('Calculation error:', error)
        setCalculation(null)
        onCalculationUpdate?.(null)
      } finally {
        setIsCalculating(false)
      }
    }

    performCalculation()
  }, [formData.measurements, formData.speciesType, onCalculationUpdate])

  // Form validation
  useEffect(() => {
    const validateForm = () => {
      const newErrors: FormErrors = {}

      // Validate measurements
      const measurementValidation = validateEggMeasurement({
        length: formData.measurements.length,
        breadth: formData.measurements.breadth,
        mass: formData.measurements.mass,
        kv: formData.measurements.kv,
        speciesType: formData.speciesType,
        location: formData.location
      })

      if (!measurementValidation.isValid) {
        measurementValidation.errors.forEach(error => {
          if (error.includes('length')) newErrors.length = error
          else if (error.includes('breadth')) newErrors.breadth = error
          else if (error.includes('mass')) newErrors.mass = error
          else if (error.includes('Kv')) newErrors.kv = error
          else if (error.includes('Species')) newErrors.speciesType = error
          else if (error.includes('Latitude')) newErrors.latitude = error
          else if (error.includes('Longitude')) newErrors.longitude = error
          else if (error.includes('Site')) newErrors.siteName = error
          else newErrors.general = error
        })
      }

      setErrors(newErrors)
      setIsValid(Object.keys(newErrors).length === 0 && calculation !== null)
    }

    validateForm()
  }, [formData, calculation])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      if (field.startsWith('measurements.')) {
        const measurementField = field.split('.')[1]
        return {
          ...prev,
          measurements: {
            ...prev.measurements,
            [measurementField]: value
          }
        }
      } else if (field.startsWith('location.')) {
        const locationField = field.split('.')[1]
        return {
          ...prev,
          location: {
            ...prev.location,
            [locationField]: value
          }
        }
      } else {
        return {
          ...prev,
          [field]: value
        }
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid) {
      return
    }

    // Generate new measurement ID for next submission
    const submissionData = { ...formData }
    setFormData(prev => ({ ...prev, measurementId: generateId() }))
    
    onSubmit?.(submissionData)
  }

  const resetForm = () => {
    setFormData({
      measurementId: generateId(),
      sessionId,
      speciesType: 'arctic',
      measurements: {
        length: 0,
        breadth: 0,
        mass: 0,
        kv: 0.507
      },
      location: {},
      researcherNotes: ''
    })
    setErrors({})
    setCalculation(null)
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Egg Measurement Form</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Species Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Species Type *
          </label>
          <select
            value={formData.speciesType}
            onChange={(e) => handleInputChange('speciesType', e.target.value as SpeciesType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="arctic">Arctic Skua</option>
            <option value="great">Great Skua</option>
          </select>
          {errors.speciesType && (
            <p className="mt-1 text-sm text-red-600">{errors.speciesType}</p>
          )}
        </div>

        {/* Measurement Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Egg Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Egg Length (mm) *
            </label>
            <input
              type="number"
              step="0.1"
              min="60"
              max="85"
              value={formData.measurements.length || ''}
              onChange={(e) => handleInputChange('measurements.length', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.length ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g. 72.3 (typical: 67-79)"
            />
            {errors.length && (
              <p className="mt-1 text-sm text-red-600">{errors.length}</p>
            )}
          </div>

          {/* Egg Breadth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Egg Breadth (mm) *
            </label>
            <input
              type="number"
              step="0.1"
              min="40"
              max="60"
              value={formData.measurements.breadth || ''}
              onChange={(e) => handleInputChange('measurements.breadth', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.breadth ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g. 50.2 (typical: 47-53)"
            />
            {errors.breadth && (
              <p className="mt-1 text-sm text-red-600">{errors.breadth}</p>
            )}
          </div>

          {/* Egg Mass */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Egg Mass (g) *
            </label>
            <input
              type="number"
              step="0.001"
              min="70"
              max="120"
              value={formData.measurements.mass || ''}
              onChange={(e) => handleInputChange('measurements.mass', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.mass ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g. 91.89 (typical: 80-105)"
            />
            {errors.mass && (
              <p className="mt-1 text-sm text-red-600">{errors.mass}</p>
            )}
          </div>

          {/* Kv Constant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kv Constant *
            </label>
            <input
              type="number"
              step="0.001"
              min="0.1"
              max="1.0"
              value={formData.measurements.kv || ''}
              onChange={(e) => handleInputChange('measurements.kv', parseFloat(e.target.value) || 0.507)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.kv ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.507"
            />
            {errors.kv && (
              <p className="mt-1 text-sm text-red-600">{errors.kv}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Default: 0.507 (egg-shape constant from research)
            </p>
          </div>
        </div>

        {/* Measurement Guide */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">📏 Typical Skua Egg Measurements</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
            <div>
              <span className="font-medium">Length:</span> 67-79mm
            </div>
            <div>
              <span className="font-medium">Breadth:</span> 47-53mm
            </div>
            <div>
              <span className="font-medium">Mass:</span> 80-105g
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Values outside these ranges are accepted but may affect prediction accuracy.
          </p>
        </div>

        {/* Location Fields (Optional) */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                value={formData.location?.latitude || ''}
                onChange={(e) => handleInputChange('location.latitude', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 62.017"
              />
              {errors.latitude && (
                <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                value={formData.location?.longitude || ''}
                onChange={(e) => handleInputChange('location.longitude', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. -6.767"
              />
              {errors.longitude && (
                <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                maxLength={255}
                value={formData.location?.siteName || ''}
                onChange={(e) => handleInputChange('location.siteName', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Fugløy Island"
              />
              {errors.siteName && (
                <p className="mt-1 text-sm text-red-600">{errors.siteName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Researcher Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Researcher Notes (Optional)
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={formData.researcherNotes || ''}
            onChange={(e) => handleInputChange('researcherNotes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Additional observations or notes..."
          />
        </div>

        {/* Real-time Calculation Preview */}
        {(calculation || isCalculating) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Prediction Preview</h3>
            
            {isCalculating ? (
              <div className="flex items-center text-blue-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                Calculating...
              </div>
            ) : calculation ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-900">Time to Hatch</p>
                  <p className="text-xl font-bold text-blue-700">{calculation.tbh} days</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Egg Density</p>
                  <p className="text-lg text-blue-700">{calculation.eggDensity}</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Egg Volume</p>
                  <p className="text-lg text-blue-700">{calculation.eggVolume} mm³</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Confidence</p>
                  <p className="text-lg text-blue-700">{Math.round(calculation.confidence * 100)}%</p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            type="submit"
            disabled={!isValid}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Submit Measurement
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Reset Form
          </button>
        </div>

        {/* General Errors */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}
      </form>
    </div>
  )
} 