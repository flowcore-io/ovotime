// Export all event types
export * from '../pathways/contracts/measurement.events'
export * from '../pathways/contracts/prediction.events'
export * from '../pathways/contracts/session.events'

/**
 * Species types for Skua birds
 */
export type SpeciesType = 'arctic' | 'great'

/**
 * Calculation method types
 */
export type CalculationMethod = 'tbh_skuas'

/**
 * Validation status types
 */
export type ValidationStatus = 'valid' | 'invalid'

/**
 * Session status types
 */
export type SessionStatus = 'active' | 'completed' | 'cancelled'

/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx'

/**
 * Error types for predictions
 */
export type PredictionErrorType = 'validation_error' | 'calculation_error' | 'system_error'

/**
 * Egg measurement data interface
 */
export interface EggMeasurement {
  id: string
  sessionId?: string
  speciesType: SpeciesType
  length: number // mm
  breadth: number // mm
  mass: number // g
  kv: number // egg-shape constant
  latitude?: number
  longitude?: number
  siteName?: string
  researcherNotes?: string
  submittedAt: Date
  createdAt: Date
}

/**
 * Prediction result interface
 */
export interface PredictionResult {
  id: string
  measurementId: string
  tbh: number // days until hatching
  eggDensity: number // DE
  eggVolume: number // VE
  confidence: number
  speciesType: SpeciesType
  formulaName: string
  formulaVersion: string
  calculatedAt: Date
  createdAt: Date
}

/**
 * Research session interface
 */
export interface ResearchSession {
  id: string
  sessionName: string
  researcherId: string
  startLocation?: {
    latitude: number
    longitude: number
    siteName: string
  }
  expectedDuration?: number // hours
  researchGoals?: string
  measurementCount: number
  status: SessionStatus
  startedAt: Date
  completedAt?: Date
  createdAt: Date
}

/**
 * Location interface
 */
export interface Location {
  latitude?: number
  longitude?: number
  siteName?: string
}

/**
 * Formula interface
 */
export interface Formula {
  name: string
  version: string
  coefficients: Record<string, number>
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Chart data point interface
 */
export interface ChartDataPoint {
  x: number // Days Before Hatching (DBH)
  y: number // Egg Density (DE)
  speciesType: SpeciesType
  measurementId: string
  label?: string
}

/**
 * Session summary interface
 */
export interface SessionSummary {
  averageTbh?: number
  speciesBreakdown: Record<string, number>
  locationsCovered: number
  durationHours: number
}

/**
 * Export options interface
 */
export interface ExportOptions {
  includeMeasurements: boolean
  includePredictions: boolean
  includeCharts: boolean
  includeMetadata: boolean
}

/**
 * API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Form field error interface
 */
export interface FieldError {
  field: string
  message: string
}

/**
 * Calculation input interface
 */
export interface CalculationInput {
  length: number
  breadth: number
  mass: number
  kv: number
  speciesType: SpeciesType
}

/**
 * Calculation result interface
 */
export interface CalculationResult {
  tbh: number
  eggDensity: number
  eggVolume: number
  confidence: number
  speciesType: SpeciesType
} 