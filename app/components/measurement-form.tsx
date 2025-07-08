'use client'

import { calculateSkuaTBH, SkuaCalculationInput, SkuaCalculationResult, validateCalculationInput } from '@/src/lib/calculations/skua-formulas'
import { generateId } from '@/src/lib/utils'
import { validateEggMeasurement } from '@/src/lib/validation'
import type { SpeciesType } from '@/src/types'
import { useEffect, useState } from 'react'
import MeasurementSlider from './measurement-slider'

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
  observationDateTime?: string // ISO string format
  researcherNotes?: string
}

interface FormErrors {
  length?: string
  breadth?: string
  mass?: string
  kv?: string
  speciesType?: string
  general?: string
}

// Species-specific default values (medians from actual species data)
const getSpeciesDefaults = (speciesType: SpeciesType) => {
  const defaults = {
    arctic: {
      length: 58.5,  // Middle of Arctic Skua range (55-62mm)
      breadth: 41.0, // Middle of Arctic Skua range (39-43mm)
      mass: 47.0,    // Middle of Arctic Skua range (42-52g) - with 0.1g accuracy
      kv: 0.507      // Standard egg-shape constant
    },
    great: {
      length: 71.1,  // Median from updated Great Skua data (60.6-79.8mm)
      breadth: 49.5, // Median from updated Great Skua data (45.2-54.6mm)
      mass: 92.5,    // Middle of updated Great Skua range (75-110g)
      kv: 0.507      // Standard egg-shape constant
    }
  }
  return defaults[speciesType]
}

// Species-specific typical ranges for display and validation
const getSpeciesRanges = (speciesType: SpeciesType) => {
  const ranges = {
    arctic: {
      length: { min: 55, max: 62 },    // Arctic Skua: 5.5–6.2 cm
      breadth: { min: 39, max: 43 },   // Arctic Skua: 3.9–4.3 cm
      mass: { min: 42, max: 52 }       // Arctic Skua: 42–52g
    },
    great: {
      length: { min: 60.6, max: 79.8 },    // Great Skua: updated from chart data
      breadth: { min: 45.2, max: 54.6 },   // Great Skua: updated from chart data (54.55 rounded)
      mass: { min: 75, max: 110 }       // Great Skua: updated range 75-110g
    }
  }
  return ranges[speciesType]
}

// Species-specific slider ranges (typical values + small margin for extreme cases)
const getSpeciesSliderRanges = (speciesType: SpeciesType) => {
  const ranges = {
    arctic: {
      length: { min: 53, max: 64 },    // Arctic: 55-62 typical + 2mm margin
      breadth: { min: 37, max: 45 },   // Arctic: 39-43 typical + 2mm margin
      mass: { min: 40, max: 54 }       // Arctic: 42-52 typical + 2g margin
    },
    great: {
      length: { min: 59, max: 82 },    // Great: 60.6-79.8 typical + small margin
      breadth: { min: 44, max: 56 },   // Great: 45.2-54.6 typical + small margin
      mass: { min: 72, max: 115 }      // Great: 75-110 typical + small margin
    }
  }
  return ranges[speciesType]
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
    speciesType: 'great',
    measurements: getSpeciesDefaults('great'),
    observationDateTime: '',
    researcherNotes: ''
  })

  // Validation and calculation state
  const [errors, setErrors] = useState<FormErrors>({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculation, setCalculation] = useState<SkuaCalculationResult | null>(null)
  const [isValid, setIsValid] = useState(false)

  // Real-time calculation when form data changes
  useEffect(() => {
    // Debounce calculations to avoid intermediate invalid states
    const timeoutId = setTimeout(() => {
      const performCalculation = async () => {
        const { measurements, speciesType } = formData
        
        // Skip calculation if essential fields are missing or zero
        if (measurements.length <= 0 || measurements.breadth <= 0 || measurements.mass <= 0 || measurements.kv <= 0) {
          setCalculation(null)
          onCalculationUpdate?.(null)
          return
        }

        // Additional range checks before attempting calculation - use validation rules
        const validationRules = {
          length: { min: 53, max: 82 },
          breadth: { min: 37, max: 57 }, 
          mass: { min: 38, max: 115 }
        }
        
        if (measurements.length < validationRules.length.min || measurements.length > validationRules.length.max ||
            measurements.breadth < validationRules.breadth.min || measurements.breadth > validationRules.breadth.max ||
            measurements.mass < validationRules.mass.min || measurements.mass > validationRules.mass.max) {
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
          // Only log errors in development, not production
          if (process.env.NODE_ENV === 'development') {
            console.warn('Calculation warning:', error instanceof Error ? error.message : 'Unknown error')
          }
          setCalculation(null)
          onCalculationUpdate?.(null)
        } finally {
          setIsCalculating(false)
        }
      }

      performCalculation()
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [formData.measurements, formData.speciesType, onCalculationUpdate, formData])

  // Auto-apply species defaults when species type changes
  useEffect(() => {
    const newDefaults = getSpeciesDefaults(formData.speciesType)
    setFormData(prevData => ({
      ...prevData,
      measurements: {
        ...prevData.measurements,
        length: newDefaults.length,
        breadth: newDefaults.breadth,
        mass: newDefaults.mass,
        kv: newDefaults.kv
      }
    }))
  }, [formData.speciesType])

  // Update sessionId in formData when prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      sessionId
    }))
  }, [sessionId])

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
        observationDateTime: formData.observationDateTime
      })

      if (!measurementValidation.isValid) {
        measurementValidation.errors.forEach(error => {
          if (error.includes('length')) newErrors.length = error
          else if (error.includes('breadth')) newErrors.breadth = error
          else if (error.includes('mass')) newErrors.mass = error
          else if (error.includes('Kv')) newErrors.kv = error
          else if (error.includes('Species')) newErrors.speciesType = error
          else newErrors.general = error
        })
      }

      setErrors(newErrors)
      setIsValid(Object.keys(newErrors).length === 0 && calculation !== null)
    }

    validateForm()
  }, [formData, calculation])

  const handleInputChange = (field: string, value: unknown) => {
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
      speciesType: formData.speciesType,
      measurements: getSpeciesDefaults(formData.speciesType),
      observationDateTime: '',
      researcherNotes: ''
    })
    setErrors({})
    setCalculation(null)
  }

  const resetToDefaults = () => {
    setFormData(prev => ({
      ...prev,
      measurements: getSpeciesDefaults(prev.speciesType)
    }))
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
            <option value="great">Great Skua</option>
            <option value="arctic">Arctic Skua</option>
          </select>
          {errors.speciesType && (
            <p className="mt-1 text-sm text-red-600">{errors.speciesType}</p>
          )}
        </div>

        {/* Measurement Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Egg Length */}
          <div>
            <MeasurementSlider
              label="Egg Length"
              value={formData.measurements.length}
              onChange={(value) => handleInputChange('measurements.length', value)}
              min={getSpeciesSliderRanges(formData.speciesType).length.min}
              max={getSpeciesSliderRanges(formData.speciesType).length.max}
              step={0.1}
              error={errors.length}
              unit="mm"
              placeholder="e.g. 58.5 (Arctic) or 74.5 (Great)"
              typicalRange={getSpeciesRanges(formData.speciesType).length}
              helperText={`${formData.speciesType === 'arctic' ? 'Arctic' : 'Great'} Skua typical: ${getSpeciesRanges(formData.speciesType).length.min}-${getSpeciesRanges(formData.speciesType).length.max}mm`}
            />
          </div>

          {/* Egg Breadth */}
          <div>
            <MeasurementSlider
              label="Egg Breadth"
              value={formData.measurements.breadth}
              onChange={(value) => handleInputChange('measurements.breadth', value)}
              min={getSpeciesSliderRanges(formData.speciesType).breadth.min}
              max={getSpeciesSliderRanges(formData.speciesType).breadth.max}
              step={0.1}
              error={errors.breadth}
              unit="mm"
              placeholder="e.g. 41.0 (Arctic) or 53.0 (Great)"
              typicalRange={getSpeciesRanges(formData.speciesType).breadth}
              helperText={`${formData.speciesType === 'arctic' ? 'Arctic' : 'Great'} Skua typical: ${getSpeciesRanges(formData.speciesType).breadth.min}-${getSpeciesRanges(formData.speciesType).breadth.max}mm`}
            />
          </div>

          {/* Egg Mass */}
          <div>
            <MeasurementSlider
              label="Egg Mass"
              value={formData.measurements.mass}
              onChange={(value) => handleInputChange('measurements.mass', value)}
              min={getSpeciesSliderRanges(formData.speciesType).mass.min}
              max={getSpeciesSliderRanges(formData.speciesType).mass.max}
              step={0.1}
              error={errors.mass}
              unit="g"
              placeholder="e.g. 47.0 (Arctic) or 88.5 (Great)"
              typicalRange={getSpeciesRanges(formData.speciesType).mass}
              helperText={`${formData.speciesType === 'arctic' ? 'Arctic' : 'Great'} Skua typical: ${getSpeciesRanges(formData.speciesType).mass.min}-${getSpeciesRanges(formData.speciesType).mass.max}g`}
            />
          </div>

          {/* Kv Constant */}
          <div>
            <MeasurementSlider
              label="Kv Constant"
              value={formData.measurements.kv}
              onChange={(value) => handleInputChange('measurements.kv', value)}
              min={0.1}
              max={1.0}
              step={0.001}
              error={errors.kv}
              unit=""
              placeholder="0.507"
              helperText="Default: 0.507 (egg-shape constant from research)"
            />
          </div>
        </div>

        {/* Measurement Guide */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">📏 {formData.speciesType === 'arctic' ? 'Arctic' : 'Great'} Skua Egg Measurements</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 mb-3">
            <div>
              <span className="font-medium">Length:</span> {getSpeciesRanges(formData.speciesType).length.min}-{getSpeciesRanges(formData.speciesType).length.max}mm typical
            </div>
            <div>
              <span className="font-medium">Breadth:</span> {getSpeciesRanges(formData.speciesType).breadth.min}-{getSpeciesRanges(formData.speciesType).breadth.max}mm typical
            </div>
            <div>
              <span className="font-medium">Mass:</span> {getSpeciesRanges(formData.speciesType).mass.min}-{getSpeciesRanges(formData.speciesType).mass.max}g typical
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-600 mb-3">
            <div>
              <span className="font-medium">Slider:</span> {getSpeciesSliderRanges(formData.speciesType).length.min}-{getSpeciesSliderRanges(formData.speciesType).length.max}mm
            </div>
            <div>
              <span className="font-medium">Slider:</span> {getSpeciesSliderRanges(formData.speciesType).breadth.min}-{getSpeciesSliderRanges(formData.speciesType).breadth.max}mm
            </div>
            <div>
              <span className="font-medium">Slider:</span> {getSpeciesSliderRanges(formData.speciesType).mass.min}-{getSpeciesSliderRanges(formData.speciesType).mass.max}g
            </div>
          </div>

          <div className="pt-3 border-t border-gray-300">
            <h5 className="text-xs font-medium text-blue-900 mb-2">
              Current Defaults ({formData.speciesType === 'arctic' ? 'Arctic' : 'Great'} Skua):
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-700">
              <div>
                <span className="font-medium">Length:</span> {getSpeciesDefaults(formData.speciesType).length}mm
              </div>
              <div>
                <span className="font-medium">Breadth:</span> {getSpeciesDefaults(formData.speciesType).breadth}mm
              </div>
              <div>
                <span className="font-medium">Mass:</span> {getSpeciesDefaults(formData.speciesType).mass}g
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Sliders are optimized for each species. You can type values outside slider ranges if needed, but they may trigger validation warnings.
          </p>
        </div>

        {/* Observation Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Observation Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observation Date and Time
              </label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={formData.observationDateTime || ''}
                  onChange={(e) => handleInputChange('observationDateTime', e.target.value || '')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date()
                    // Format as YYYY-MM-DDTHH:MM for datetime-local input
                    const formattedNow = now.toISOString().slice(0, 16)
                    handleInputChange('observationDateTime', formattedNow)
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors whitespace-nowrap"
                  title="Set current date and time"
                >
                  Now
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                When the observation was made
              </p>
            </div>
            
            {/* Placeholder for future nest/clutch fields */}
            <div className="text-sm text-gray-500 italic">
              <p>Nest ID and clutch information fields will be added here in future updates.</p>
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
                  <p className="text-lg text-blue-700">{calculation.eggDensity.toFixed(3)} g/cm³</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Egg Volume</p>
                  <p className="text-lg text-blue-700">{calculation.eggVolume.toFixed(2)} cm³</p>
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
            onClick={resetToDefaults}
            className="sm:flex-initial bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
            title="Reset measurements to species defaults"
          >
            Use Defaults
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="sm:flex-initial bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
          >
            Reset All
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