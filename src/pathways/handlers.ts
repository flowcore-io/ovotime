/**
 * Flowcore Event Handlers
 * 
 * This file will register event handlers when Flowcore is properly configured.
 * Follow the Flowcore documentation to set up proper event handling.
 * 
 * @see https://docs.flowcore.io/guides/5-minute-tutorial/5-min-tutorial/#understanding-flowcore-concepts
 */

import { pathways } from "./pathways"

// Import transformers for when handlers are implemented
import { measurementArchivedTransformer } from "./transformers/measurement-archived.transformer"
import { measurementRejectedTransformer } from "./transformers/measurement-rejected.transformer"
import { measurementSubmittedTransformer } from "./transformers/measurement-submitted.transformer"
import { measurementValidatedTransformer } from "./transformers/measurement-validated.transformer"
import { predictionCalculatedTransformer } from "./transformers/prediction-calculated.transformer"
import { predictionFailedTransformer } from "./transformers/prediction-failed.transformer"
import { predictionRequestedTransformer } from "./transformers/prediction-requested.transformer"
import { sessionArchivedTransformer } from "./transformers/session-archived.transformer"
import { sessionCompletedTransformer } from "./transformers/session-completed.transformer"
import { sessionExportedTransformer } from "./transformers/session-exported.transformer"
import { sessionMeasurementAddedTransformer } from "./transformers/session-measurement-added.transformer"
import { sessionStartedTransformer } from "./transformers/session-started.transformer"

/**
 * Register event handlers for Flowcore events
 */
if (pathways) {
  console.log("✅ Pathways available - registering event handlers")
  
  // Measurement events
  pathways.handle("measurements.0/measurement.submitted.0", async (event: any) => {
    console.log("🔄 Processing measurement submitted event", event.eventId)
    await measurementSubmittedTransformer(event)
  })
  
  pathways.handle("measurements.0/measurement.validated.0", async (event: any) => {
    console.log("🔄 Processing measurement validated event", event.eventId)
    await measurementValidatedTransformer(event)
  })
  
  pathways.handle("measurements.0/measurement.rejected.0", async (event: any) => {
    console.log("🔄 Processing measurement rejected event", event.eventId)
    await measurementRejectedTransformer(event)
  })
  
  pathways.handle("measurements.0/measurement.archived.0", async (event: any) => {
    console.log("🔄 Processing measurement archived event", event.eventId)
    await measurementArchivedTransformer(event)
  })
  
  // Prediction events
  pathways.handle("predictions.0/prediction.requested.0", async (event: any) => {
    console.log("🔄 Processing prediction requested event", event.eventId)
    await predictionRequestedTransformer(event)
  })
  
  pathways.handle("predictions.0/prediction.calculated.0", async (event: any) => {
    console.log("🔄 Processing prediction calculated event", event.eventId)
    await predictionCalculatedTransformer(event)
  })
  
  pathways.handle("predictions.0/prediction.failed.0", async (event: any) => {
    console.log("🔄 Processing prediction failed event", event.eventId)
    await predictionFailedTransformer(event)
  })
  
  // Session events
  pathways.handle("sessions.0/session.started.0", async (event: any) => {
    console.log("🔄 Processing session started event", event.eventId)
    await sessionStartedTransformer(event)
  })
  
  pathways.handle("sessions.0/session.measurement-added.0", async (event: any) => {
    console.log("🔄 Processing session measurement added event", event.eventId)
    await sessionMeasurementAddedTransformer(event)
  })
  
  pathways.handle("sessions.0/session.completed.0", async (event: any) => {
    console.log("🔄 Processing session completed event", event.eventId)
    await sessionCompletedTransformer(event)
  })
  
  pathways.handle("sessions.0/session.exported.0", async (event: any) => {
    console.log("🔄 Processing session exported event", event.eventId)
    await sessionExportedTransformer(event)
  })
  
  pathways.handle("sessions.0/session.archived.0", async (event: any) => {
    console.log("🔄 Processing session archived event", event.eventId)
    await sessionArchivedTransformer(event)
  })
  
  console.log("✅ Event handlers registered successfully")
} else {
  console.log("⚠️  Pathways not configured - event handlers not registered")
}

export {
    measurementArchivedTransformer,
    measurementRejectedTransformer, measurementSubmittedTransformer,
    measurementValidatedTransformer, predictionCalculatedTransformer,
    predictionFailedTransformer, predictionRequestedTransformer,
    sessionArchivedTransformer,
    sessionCompletedTransformer,
    sessionExportedTransformer, sessionMeasurementAddedTransformer, sessionStartedTransformer
}
