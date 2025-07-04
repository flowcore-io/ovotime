import { z } from "zod"

/**
 * Schema for prediction requested event
 */
export const PredictionRequestedSchema = z.object({
  predictionId: z.string(),
  measurementId: z.string(),
  sessionId: z.string().optional(),
  calculationMethod: z.enum(['tbh_skuas']).default('tbh_skuas'),
  requestedAt: z.date().default(() => new Date())
})

/**
 * Schema for prediction calculated event
 */
export const PredictionCalculatedSchema = z.object({
  predictionId: z.string(),
  measurementId: z.string(),
  results: z.object({
    tbh: z.number(), // days until hatching
    eggDensity: z.number(), // DE
    eggVolume: z.number(), // VE
    confidence: z.number().min(0).max(1),
    speciesType: z.enum(['arctic', 'great']),
    calculationTimestamp: z.date().default(() => new Date())
  }),
  formula: z.object({
    name: z.string(),
    version: z.string(),
    coefficients: z.record(z.number())
  }),
  calculatedAt: z.date().default(() => new Date())
})

/**
 * Schema for prediction failed event
 */
export const PredictionFailedSchema = z.object({
  predictionId: z.string(),
  measurementId: z.string(),
  errorType: z.enum(['validation_error', 'calculation_error', 'system_error']),
  errorMessage: z.string(),
  errorDetails: z.record(z.any()).optional(),
  failedAt: z.date().default(() => new Date())
})

/**
 * Type definitions for prediction events
 */
export type PredictionRequestedEvent = z.infer<typeof PredictionRequestedSchema>
export type PredictionCalculatedEvent = z.infer<typeof PredictionCalculatedSchema>
export type PredictionFailedEvent = z.infer<typeof PredictionFailedSchema> 