import { z } from "zod"

/**
 * Schema for session started event
 */
export const SessionStartedSchema = z.object({
  sessionId: z.string(),
  sessionName: z.string().min(1).max(255),
  researcherId: z.string().min(1).max(255),
  startLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    siteName: z.string().min(1).max(255)
  }).optional(),
  expectedDuration: z.number().min(1).max(480).optional(), // hours (max 20 days)
  researchGoals: z.string().max(1000).optional(),
  startedAt: z.date().default(() => new Date())
})

/**
 * Schema for session measurement added event
 */
export const SessionMeasurementAddedSchema = z.object({
  sessionId: z.string(),
  measurementId: z.string(),
  sequenceNumber: z.number().min(1),
  addedAt: z.date().default(() => new Date())
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
  completedAt: z.date().default(() => new Date())
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
  exportedAt: z.date().default(() => new Date())
})

/**
 * Type definitions for session events
 */
export type SessionStartedEvent = z.infer<typeof SessionStartedSchema>
export type SessionMeasurementAddedEvent = z.infer<typeof SessionMeasurementAddedSchema>
export type SessionCompletedEvent = z.infer<typeof SessionCompletedSchema>
export type SessionExportedEvent = z.infer<typeof SessionExportedSchema> 