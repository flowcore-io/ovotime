'use client'

import type { SkuaCalculationResult } from '@/src/lib/calculations/skua-formulas'
import { formatNumber } from '@/src/lib/utils'
import type { SpeciesType } from '@/src/types'

interface PredictionDisplayProps {
  prediction: SkuaCalculationResult | null
  isLoading?: boolean
  className?: string
  showDetails?: boolean
}

interface SpeciesInfo {
  name: string
  scientificName: string
  description: string
  color: string
  bgColor: string
}

const SPECIES_INFO: Record<SpeciesType, SpeciesInfo> = {
  arctic: {
    name: 'Arctic Skua',
    scientificName: 'Stercorarius parasiticus',
    description: 'A seabird that breeds in the tundra and migrates to warmer waters',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  great: {
    name: 'Great Skua',
    scientificName: 'Stercorarius skua',
    description: 'The largest skua species, known for its aggressive territorial behavior',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200'
  }
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100)
  
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'text-green-700 bg-green-100'
    if (conf >= 0.7) return 'text-yellow-700 bg-yellow-100'
    return 'text-red-700 bg-red-100'
  }

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.9) return 'High Confidence'
    if (conf >= 0.7) return 'Medium Confidence'
    return 'Low Confidence'
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}>
        {getConfidenceText(confidence)}
      </div>
      <span className="text-sm text-gray-600">{percentage}%</span>
    </div>
  )
}

function CalculationBreakdown({ prediction }: { prediction: SkuaCalculationResult }) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Calculation Breakdown</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Egg Volume (VE):</span>
            <span className="font-mono">{formatNumber(prediction.eggVolume, 2)} mm³</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Egg Density (DE):</span>
            <span className="font-mono">{formatNumber(prediction.eggDensity, 4)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Formula Used:</span>
            <span className="font-mono text-xs">{prediction.formula.name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Formula Version:</span>
            <span className="font-mono">{prediction.formula.version}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-xs text-gray-600 mb-2">Formula:</p>
        <code className="text-xs font-mono text-gray-800 break-all">
          TBH = (-0.2412 + √(0.05818 + 0.3175(0.8746 - DE))) / -0.1588
        </code>
      </div>
    </div>
  )
}

function PredictionCard({ prediction }: { prediction: SkuaCalculationResult }) {
  const speciesInfo = SPECIES_INFO[prediction.speciesType]
  
  return (
    <div className={`rounded-lg border-2 p-6 ${speciesInfo.bgColor}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={`text-xl font-bold ${speciesInfo.color}`}>
            {speciesInfo.name}
          </h3>
          <p className="text-sm text-gray-600 italic">{speciesInfo.scientificName}</p>
        </div>
        
        <ConfidenceIndicator confidence={prediction.confidence} />
      </div>
      
      {/* Main Result */}
      <div className="text-center mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Estimated Time to Hatch</p>
          <p className={`text-4xl font-bold ${speciesInfo.color}`}>
            {formatNumber(prediction.tbh, 1)}
            <span className="text-lg ml-2">days</span>
          </p>
        </div>
      </div>
      
      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Egg Density</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatNumber(prediction.eggDensity, 4)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Egg Volume</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatNumber(prediction.eggVolume, 1)} mm³
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PredictionDisplay({ 
  prediction, 
  isLoading = false, 
  className = '',
  showDetails = true 
}: PredictionDisplayProps) {
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-600">Calculating prediction...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!prediction) {
    return (
      <div className={`bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 ${className}`}>
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Prediction Available
          </h3>
          
          <p className="text-gray-600 mb-4">
            Enter valid egg measurements to see the hatching time prediction.
          </p>
          
          <div className="text-sm text-gray-500">
            <p>Required measurements:</p>
            <ul className="mt-2 space-y-1">
              <li>• Egg length (mm)</li>
              <li>• Egg breadth (mm)</li>
              <li>• Egg mass (g)</li>
              <li>• Kv constant (default: 0.507)</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Prediction Card */}
      <PredictionCard prediction={prediction} />
      
      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <CalculationBreakdown prediction={prediction} />
        </div>
      )}
      
      {/* Research Context */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-3">Research Context</h4>
        
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            This prediction is based on the scientific research from <em>Seabird 32-84</em>, 
            which studied the relationship between egg density and incubation progression 
            for Arctic and Great Skuas in the Faroe Islands.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-900 mb-1">Study Period:</p>
              <p>June - July 2016</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-900 mb-1">Study Location:</p>
              <p>Fugløy and Skúvoy, Faroe Islands</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Predictions are most accurate for measurements within 
              the ranges observed in the original research. Very high or low confidence 
              scores may indicate measurements outside normal parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 