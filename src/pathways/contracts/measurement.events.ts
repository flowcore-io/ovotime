import { z } from "zod"

/**
 * Schema for measurement submitted event
 */
export const MeasurementSubmittedSchema = z.object({
  measurementId: z.string(),
  sessionId: z.string().optional(),
  speciesType: z.enum(['arctic', 'great']),
  measurements: z.object({
    length: z.number().min(10).max(100), // mm
    breadth: z.number().min(10).max(80), // mm
    mass: z.number().min(1).max(200), // g
    kv: z.number().min(0.1).max(1.0).default(0.507) // egg-shape constant
  }),
  location: z.object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    siteName: z.string().min(1).max(255).optional()
  }).optional(),
  researcherNotes: z.string().max(1000).optional(),
  timestamp: z.date().default(() => new Date())
})

/**
 * Schema for measurement validated event
 */
export const MeasurementValidatedSchema = z.object({
  measurementId: z.string(),
  validationStatus: z.enum(['valid', 'invalid']),
  validationErrors: z.array(z.string()).optional(),
  normalizedData: z.object({
    length: z.number(),
    breadth: z.number(),
    mass: z.number(),
    kv: z.number()
  }).optional(),
  validatedAt: z.date().default(() => new Date())
})

/**
 * Schema for measurement rejected event
 */
export const MeasurementRejectedSchema = z.object({
  measurementId: z.string(),
  rejectionReason: z.string(),
  validationErrors: z.array(z.string()),
  rejectedAt: z.date().default(() => new Date())
})

/**
 * Type definitions for measurement events
 */
export type MeasurementSubmittedEvent = z.infer<typeof MeasurementSubmittedSchema>
export type MeasurementValidatedEvent = z.infer<typeof MeasurementValidatedSchema>
export type MeasurementRejectedEvent = z.infer<typeof MeasurementRejectedSchema> 