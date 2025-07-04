// import { db } from "../database" // Disabled for demo to avoid SQLite build issues

// Import event schemas

// Import transformers
// Temporarily disabled for demo to avoid database dependency issues
// import { measurementRejectedTransformer } from "./transformers/measurement-rejected.transformer"
// import { measurementSubmittedTransformer } from "./transformers/measurement-submitted.transformer"
// import { measurementValidatedTransformer } from "./transformers/measurement-validated.transformer"
// import { predictionCalculatedTransformer } from "./transformers/prediction-calculated.transformer"
// import { predictionFailedTransformer } from "./transformers/prediction-failed.transformer"
// import { predictionRequestedTransformer } from "./transformers/prediction-requested.transformer"
// import { sessionCompletedTransformer } from "./transformers/session-completed.transformer"
// import { sessionExportedTransformer } from "./transformers/session-exported.transformer"
// import { sessionMeasurementAddedTransformer } from "./transformers/session-measurement-added.transformer"
// import { sessionStartedTransformer } from "./transformers/session-started.transformer"

/**
 * Mock pathways implementation for demo
 * This provides the interface without full Flowcore infrastructure
 */
export const pathways = {
  async write(eventType: string, data: any) {
    console.log(`[DEMO] Event published: ${eventType}`, data)
    // For demo purposes, just log the event
    // In production, this would use the full Flowcore pathways implementation
    return Promise.resolve()
  },
  
  async initialize() {
    console.log("[DEMO] Pathways initialized (mock)")
    return Promise.resolve()
  },
  
  async close() {
    console.log("[DEMO] Pathways closed (mock)")
    return Promise.resolve()
  }
}

/**
 * Initialize pathways
 */
export const initializePathways = async () => {
  try {
    await pathways.initialize()
    console.log("✅ Flowcore pathways initialized successfully")
    return true
  } catch (error) {
    console.error("❌ Failed to initialize pathways:", error)
    return false
  }
}

/**
 * Close pathways
 */
export const closePathways = async () => {
  try {
    await pathways.close()
    console.log("✅ Flowcore pathways closed successfully")
    return true
  } catch (error) {
    console.error("❌ Failed to close pathways:", error)
    return false
  }
} 