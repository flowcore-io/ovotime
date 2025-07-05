import {
    PathwayRouter,
    PathwaysBuilder,
    createPostgresPathwayState,
} from "@flowcore/pathways"
import crypto from "crypto"
import postgres from "postgres"

// Import event schemas  
import {
    MeasurementRejectedSchema,
    MeasurementSubmittedSchema,
    MeasurementValidatedSchema
} from "./contracts/measurement.events"
import {
    PredictionCalculatedSchema,
    PredictionFailedSchema,
    PredictionRequestedSchema
} from "./contracts/prediction.events"
import {
    SessionCompletedSchema,
    SessionExportedSchema,
    SessionMeasurementAddedSchema,
    SessionStartedSchema
} from "./contracts/session.events"

/**
 * Flowcore pathways configuration
 */
const pathwaysConfig = {
  tenant: process.env.FLOWCORE_TENANT || 'ovotime',
  apiKey: process.env.FLOWCORE_API_KEY,
  dataCore: 'ovotime-research-data',
  baseUrl: process.env.FLOWCORE_API_URL || 'https://webhook.api.flowcore.io',
  postgresUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ovotime"
}

// Initialize postgres connection for pathways state
const sql = postgres(pathwaysConfig.postgresUrl)

/**
 * Initialize Flowcore pathways using the PathwaysBuilder
 * Only initialize if API key is available
 */
let pathways: any = null

if (pathwaysConfig.apiKey) {
  pathways = new PathwaysBuilder({
    baseUrl: pathwaysConfig.baseUrl,
    tenant: pathwaysConfig.tenant,
    dataCore: pathwaysConfig.dataCore,
    apiKey: pathwaysConfig.apiKey,
  })
    .withPathwayState(
      createPostgresPathwayState({ connectionString: pathwaysConfig.postgresUrl })
    )
    // Register measurement events
    .register({
      flowType: "measurements.0",
      eventType: "measurement.submitted.0", 
      schema: MeasurementSubmittedSchema,
    })
    .register({
      flowType: "measurements.0",
      eventType: "measurement.validated.0",
      schema: MeasurementValidatedSchema,
    })
    .register({
      flowType: "measurements.0", 
      eventType: "measurement.rejected.0",
      schema: MeasurementRejectedSchema,
    })
    // Register prediction events
    .register({
      flowType: "predictions.0",
      eventType: "prediction.requested.0",
      schema: PredictionRequestedSchema,
    })
    .register({
      flowType: "predictions.0",
      eventType: "prediction.calculated.0", 
      schema: PredictionCalculatedSchema,
    })
    .register({
      flowType: "predictions.0",
      eventType: "prediction.failed.0",
      schema: PredictionFailedSchema,
    })
    // Register session events
    .register({
      flowType: "sessions.0",
      eventType: "session.started.0",
      schema: SessionStartedSchema,
    })
    .register({
      flowType: "sessions.0", 
      eventType: "session.measurement-added.0",
      schema: SessionMeasurementAddedSchema,
    })
    .register({
      flowType: "sessions.0",
      eventType: "session.completed.0",
      schema: SessionCompletedSchema,
    })
    .register({
      flowType: "sessions.0",
      eventType: "session.exported.0", 
      schema: SessionExportedSchema,
    })
}

export { pathways }

/**
 * Create pathway router with secret for webhook authentication
 */
export const pathwaysRouter = pathways 
  ? new PathwayRouter(pathways, process.env.OVOTIME_API_KEY || "1234")
  : null

/**
 * Initialize pathways 
 */
export const initializePathways = async () => {
  try {
    if (!pathwaysConfig.apiKey) {
      console.warn("⚠️  Flowcore API key not configured - running in local mode")
      return false
    }
    
    console.log("✅ Flowcore pathways initialized successfully")
    return true
    
  } catch (error) {
    console.error("❌ Failed to initialize pathways:", error)
    return false
  }
}

/**
 * Close pathways connection
 */
export const closePathways = async () => {
  try {
    await sql.end()
    console.log("✅ Flowcore pathways closed successfully")
    return true
  } catch (error) {
    console.error("❌ Failed to close pathways:", error)
    return false
  }
}

/**
 * Helper function to safely write events
 */
const safeWrite = async (eventPath: string, payload: any) => {
  if (!pathways) {
    console.warn(`⚠️  Flowcore not configured - would have published: ${eventPath}`)
    return Promise.resolve({ eventId: crypto.randomUUID(), local: true })
  }
  
  try {
    return await pathways.write(eventPath, { data: payload })
  } catch (error) {
    console.error(`❌ Failed to write event ${eventPath}:`, error)
    throw error
  }
}

/**
 * Helper functions for publishing specific events
 */
export const publishMeasurementSubmitted = async (payload: any) => {
  return safeWrite("measurements.0/measurement.submitted.0", payload)
}

export const publishMeasurementValidated = async (payload: any) => {
  return safeWrite("measurements.0/measurement.validated.0", payload)
}

export const publishMeasurementRejected = async (payload: any) => {
  return safeWrite("measurements.0/measurement.rejected.0", payload)
}

export const publishPredictionRequested = async (payload: any) => {
  return safeWrite("predictions.0/prediction.requested.0", payload)
}

export const publishPredictionCalculated = async (payload: any) => {
  return safeWrite("predictions.0/prediction.calculated.0", payload)
}

export const publishPredictionFailed = async (payload: any) => {
  return safeWrite("predictions.0/prediction.failed.0", payload)
}

export const publishSessionStarted = async (payload: any) => {
  return safeWrite("sessions.0/session.started.0", payload)
}

export const publishSessionMeasurementAdded = async (payload: any) => {
  return safeWrite("sessions.0/session.measurement-added.0", payload)
}

export const publishSessionCompleted = async (payload: any) => {
  return safeWrite("sessions.0/session.completed.0", payload)
}

export const publishSessionExported = async (payload: any) => {
  return safeWrite("sessions.0/session.exported.0", payload)
} 