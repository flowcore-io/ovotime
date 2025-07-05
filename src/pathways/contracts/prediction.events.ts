import { z } from "zod"

/**
 * Helper schema for date fields that handles both Date objects and ISO strings
 */
const dateSchema = z.union([
  z.date(),
  z.string().datetime()
]).transform((val) => {
  if (typeof val === 'string') {
    return new Date(val)
  }
  return val
}).default(() => new Date())

/**
 * Schema for prediction requested event
 */
export const PredictionRequestedSchema = z.object({
  predictionId: z.string(),
  measurementId: z.string(),
  sessionId: z.string().optional(),
  calculationMethod: z.enum(['tbh_skuas']).default('tbh_skuas'),
  requestedAt: dateSchema
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
    calculationTimestamp: dateSchema
  }),
  formula: z.object({
    name: z.string(),
    version: z.string(),
    coefficients: z.record(z.number())
  }),
  calculatedAt: dateSchema
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
  failedAt: dateSchema
})

/**
 * Type definitions for prediction events
 */
export type PredictionRequestedEvent = z.infer<typeof PredictionRequestedSchema>
export type PredictionCalculatedEvent = z.infer<typeof PredictionCalculatedSchema>
export type PredictionFailedEvent = z.infer<typeof PredictionFailedSchema> 