import { decimal, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

/**
 * Enum for species types
 */
export const speciesTypeEnum = pgEnum('species_type', ['arctic', 'great'])

/**
 * Enum for session status
 */
export const sessionStatusEnum = pgEnum('session_status', ['active', 'completed', 'cancelled'])

/**
 * Enum for export format
 */
export const exportFormatEnum = pgEnum('export_format', ['csv', 'json', 'xlsx'])

/**
 * Measurements table
 */
export const tableMeasurements = pgTable("measurements", {
  id: uuid("id").primaryKey(),
  sessionId: uuid("session_id").references(() => tableSessions.id),
  speciesType: speciesTypeEnum("species_type").notNull(),
  length: decimal("length", { precision: 6, scale: 2 }).notNull(), // mm
  breadth: decimal("breadth", { precision: 6, scale: 2 }).notNull(), // mm
  mass: decimal("mass", { precision: 8, scale: 3 }).notNull(), // g
  kv: decimal("kv", { precision: 4, scale: 3 }).notNull(), // egg-shape constant
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // GPS coordinates
  longitude: decimal("longitude", { precision: 11, scale: 7 }), // GPS coordinates
  siteName: varchar("site_name", { length: 255 }),
  researcherNotes: text("researcher_notes"),
  submittedAt: timestamp("submitted_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

/**
 * Predictions table
 */
export const tablePredictions = pgTable("predictions", {
  id: uuid("id").primaryKey(),
  measurementId: uuid("measurement_id").notNull().references(() => tableMeasurements.id),
  tbh: decimal("tbh", { precision: 6, scale: 2 }).notNull(), // days until hatching
  eggDensity: decimal("egg_density", { precision: 8, scale: 4 }).notNull(), // DE
  eggVolume: decimal("egg_volume", { precision: 8, scale: 4 }).notNull(), // VE
  confidence: decimal("confidence", { precision: 4, scale: 3 }).notNull(), // 0-1
  speciesType: speciesTypeEnum("species_type").notNull(),
  formulaName: varchar("formula_name", { length: 50 }).notNull(),
  formulaVersion: varchar("formula_version", { length: 10 }).notNull(),
  formulaCoefficients: jsonb("formula_coefficients"), // Store formula coefficients
  calculatedAt: timestamp("calculated_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

/**
 * Sessions table
 */
export const tableSessions = pgTable("sessions", {
  id: uuid("id").primaryKey(),
  sessionName: varchar("session_name", { length: 255 }).notNull(),
  researcherId: varchar("researcher_id", { length: 255 }).notNull(),
  startLocation: jsonb("start_location"), // Store location data as JSON
  expectedDuration: integer("expected_duration"), // hours
  researchGoals: text("research_goals"),
  measurementCount: integer("measurement_count").notNull().default(0),
  status: sessionStatusEnum("status").notNull().default('active'),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
})

/**
 * Session exports table
 */
export const tableSessionExports = pgTable("session_exports", {
  id: uuid("id").primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => tableSessions.id),
  exportFormat: exportFormatEnum("export_format").notNull(),
  exportedBy: varchar("exported_by", { length: 255 }).notNull(),
  exportOptions: jsonb("export_options"), // Store export options as JSON
  fileSize: integer("file_size"), // bytes
  downloadUrl: varchar("download_url", { length: 500 }),
  exportedAt: timestamp("exported_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
})

/**
 * Validation errors table (for tracking validation issues)
 */
export const tableValidationErrors = pgTable("validation_errors", {
  id: uuid("id").primaryKey(),
  measurementId: uuid("measurement_id").references(() => tableMeasurements.id),
  errorType: varchar("error_type", { length: 50 }).notNull(),
  errorMessage: text("error_message").notNull(),
  fieldName: varchar("field_name", { length: 50 }),
  fieldValue: text("field_value"),
  createdAt: timestamp("created_at").notNull().defaultNow()
})

/**
 * Event log table (for audit trail)
 */
export const tableEventLog = pgTable("event_log", {
  id: uuid("id").primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  aggregateId: uuid("aggregate_id").notNull(),
  eventData: jsonb("event_data"), // Store event payload as JSON
  metadata: jsonb("metadata"), // Store metadata as JSON
  createdAt: timestamp("created_at").notNull().defaultNow()
})

/**
 * Type definitions for database tables
 */
export type Measurement = typeof tableMeasurements.$inferSelect
export type NewMeasurement = typeof tableMeasurements.$inferInsert
export type Prediction = typeof tablePredictions.$inferSelect
export type NewPrediction = typeof tablePredictions.$inferInsert
export type Session = typeof tableSessions.$inferSelect
export type NewSession = typeof tableSessions.$inferInsert
export type SessionExport = typeof tableSessionExports.$inferSelect
export type NewSessionExport = typeof tableSessionExports.$inferInsert
export type ValidationError = typeof tableValidationErrors.$inferSelect
export type NewValidationError = typeof tableValidationErrors.$inferInsert
export type EventLog = typeof tableEventLog.$inferSelect
export type NewEventLog = typeof tableEventLog.$inferInsert 