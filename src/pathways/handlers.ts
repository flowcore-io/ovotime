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
import { measurementRejectedTransformer } from "./transformers/measurement-rejected.transformer"
import { measurementSubmittedTransformer } from "./transformers/measurement-submitted.transformer"
import { measurementValidatedTransformer } from "./transformers/measurement-validated.transformer"
import { predictionCalculatedTransformer } from "./transformers/prediction-calculated.transformer"
import { predictionFailedTransformer } from "./transformers/prediction-failed.transformer"
import { predictionRequestedTransformer } from "./transformers/prediction-requested.transformer"
import { sessionCompletedTransformer } from "./transformers/session-completed.transformer"
import { sessionExportedTransformer } from "./transformers/session-exported.transformer"
import { sessionMeasurementAddedTransformer } from "./transformers/session-measurement-added.transformer"
import { sessionStartedTransformer } from "./transformers/session-started.transformer"

/**
 * TODO: Implement event handlers following Flowcore documentation pattern
 * 
 * Example:
 * 
 * if (pathways) {
 *   pathways.handle("measurements/measurement.submitted.v0", async ({ payload }) => {
 *     console.log("Processing measurement submitted event", payload)
 *     // Transform event to database update
 *     await measurementSubmittedTransformer(event)
 *   })
 * }
 */

if (pathways) {
  console.log("✅ Pathways available - ready to register event handlers")
  // TODO: Add pathways.handle() calls here
} else {
  console.log("⚠️  Pathways not configured - event handlers not registered")
}

export {
    measurementRejectedTransformer, measurementSubmittedTransformer,
    measurementValidatedTransformer, predictionCalculatedTransformer,
    predictionFailedTransformer, predictionRequestedTransformer, sessionCompletedTransformer,
    sessionExportedTransformer, sessionMeasurementAddedTransformer, sessionStartedTransformer
}
