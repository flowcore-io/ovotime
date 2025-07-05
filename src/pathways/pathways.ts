import {
    PathwayRouter,
    PathwaysBuilder,
    createPostgresPathwayState,
} from "@flowcore/pathways"
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
      flowType: "measurements",
      eventType: "measurement.submitted.v0", 
      schema: MeasurementSubmittedSchema,
    })
    .register({
      flowType: "measurements",
      eventType: "measurement.validated.v0",
      schema: MeasurementValidatedSchema,
    })
    .register({
      flowType: "measurements", 
      eventType: "measurement.rejected.v0",
      schema: MeasurementRejectedSchema,
    })
    // Register prediction events
    .register({
      flowType: "predictions",
      eventType: "prediction.requested.v0",
      schema: PredictionRequestedSchema,
    })
    .register({
      flowType: "predictions",
      eventType: "prediction.calculated.v0", 
      schema: PredictionCalculatedSchema,
    })
    .register({
      flowType: "predictions",
      eventType: "prediction.failed.v0",
      schema: PredictionFailedSchema,
    })
    // Register session events
    .register({
      flowType: "sessions",
      eventType: "session.started.v0",
      schema: SessionStartedSchema,
    })
    .register({
      flowType: "sessions", 
      eventType: "session.measurement-added.v0",
      schema: SessionMeasurementAddedSchema,
    })
    .register({
      flowType: "sessions",
      eventType: "session.completed.v0",
      schema: SessionCompletedSchema,
    })
    .register({
      flowType: "sessions",
      eventType: "session.exported.v0", 
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
  return safeWrite("measurements/measurement.submitted.v0", payload)
}

export const publishMeasurementValidated = async (payload: any) => {
  return safeWrite("measurements/measurement.validated.v0", payload)
}

export const publishMeasurementRejected = async (payload: any) => {
  return safeWrite("measurements/measurement.rejected.v0", payload)
}

export const publishPredictionRequested = async (payload: any) => {
  return safeWrite("predictions/prediction.requested.v0", payload)
}

export const publishPredictionCalculated = async (payload: any) => {
  return safeWrite("predictions/prediction.calculated.v0", payload)
}

export const publishPredictionFailed = async (payload: any) => {
  return safeWrite("predictions/prediction.failed.v0", payload)
}

export const publishSessionStarted = async (payload: any) => {
  return safeWrite("sessions/session.started.v0", payload)
}

export const publishSessionMeasurementAdded = async (payload: any) => {
  return safeWrite("sessions/session.measurement-added.v0", payload)
}

export const publishSessionCompleted = async (payload: any) => {
  return safeWrite("sessions/session.completed.v0", payload)
}

export const publishSessionExported = async (payload: any) => {
  return safeWrite("sessions/session.exported.v0", payload)
} 