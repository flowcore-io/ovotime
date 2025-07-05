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
  timestamp: dateSchema
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
  validatedAt: dateSchema
})

/**
 * Schema for measurement rejected event
 */
export const MeasurementRejectedSchema = z.object({
  measurementId: z.string(),
  rejectionReason: z.string(),
  validationErrors: z.array(z.string()),
  rejectedAt: dateSchema
})

/**
 * Schema for measurement archived event
 */
export const MeasurementArchivedSchema = z.object({
  measurementId: z.string(),
  archivedBy: z.string().min(1).max(255),
  archiveReason: z.string().max(500).optional(),
  archivedAt: dateSchema
})

/**
 * Type definitions for measurement events
 */
export type MeasurementSubmittedEvent = z.infer<typeof MeasurementSubmittedSchema>
export type MeasurementValidatedEvent = z.infer<typeof MeasurementValidatedSchema>
export type MeasurementRejectedEvent = z.infer<typeof MeasurementRejectedSchema>
export type MeasurementArchivedEvent = z.infer<typeof MeasurementArchivedSchema> 