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
 * Schema for session started event
 */
export const SessionStartedSchema = z.object({
  sessionId: z.string(),
  sessionName: z.string().min(1).max(255),
  researcherId: z.string().min(1).max(255),

  expectedDuration: z.number().min(1).max(480).optional(), // hours (max 20 days)
  researchGoals: z.string().max(1000).optional(),
  startedAt: dateSchema
})

/**
 * Schema for session measurement added event
 */
export const SessionMeasurementAddedSchema = z.object({
  sessionId: z.string(),
  measurementId: z.string(),
  sequenceNumber: z.number().min(1),
  addedAt: dateSchema
})

/**
 * Schema for session completed event
 */
export const SessionCompletedSchema = z.object({
  sessionId: z.string(),
  totalMeasurements: z.number().min(0),
  totalPredictions: z.number().min(0),
  sessionSummary: z.object({
    averageTbh: z.number().optional(),
    speciesBreakdown: z.record(z.number()),
    locationsCovered: z.number().min(0),
    durationHours: z.number().min(0)
  }),
  completionNotes: z.string().max(1000).optional(),
  completedAt: dateSchema
})

/**
 * Schema for session exported event
 */
export const SessionExportedSchema = z.object({
  sessionId: z.string(),
  exportFormat: z.enum(['csv', 'json', 'xlsx']),
  exportedBy: z.string(),
  exportOptions: z.object({
    includeMeasurements: z.boolean().default(true),
    includePredictions: z.boolean().default(true),
    includeCharts: z.boolean().default(false),
    includeMetadata: z.boolean().default(true)
  }),
  fileSize: z.number().min(0).optional(),
  downloadUrl: z.string().optional(),
  exportedAt: dateSchema
})

/**
 * Schema for session archived event
 */
export const SessionArchivedSchema = z.object({
  sessionId: z.string(),
  archivedBy: z.string().min(1).max(255),
  archiveReason: z.string().max(500).optional(),
  archivedAt: dateSchema
})

/**
 * Type definitions for session events
 */
export type SessionStartedEvent = z.infer<typeof SessionStartedSchema>
export type SessionMeasurementAddedEvent = z.infer<typeof SessionMeasurementAddedSchema>
export type SessionCompletedEvent = z.infer<typeof SessionCompletedSchema>
export type SessionExportedEvent = z.infer<typeof SessionExportedSchema>
export type SessionArchivedEvent = z.infer<typeof SessionArchivedSchema> 