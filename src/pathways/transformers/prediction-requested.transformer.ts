import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { PredictionRequestedSchema } from "../contracts/prediction.events"

/**
 * Transformer for prediction requested events
 */
export async function predictionRequestedTransformer(
  event: FlowcoreEvent<z.infer<typeof PredictionRequestedSchema>>
) {
  const { 
    predictionId, 
    measurementId, 
    sessionId,
    calculationMethod,
    requestedAt 
  } = event.payload

  try {
    // Log the prediction request
    console.log(`📊 Prediction ${predictionId} requested for measurement ${measurementId}`)

    // This transformer primarily logs the request
    // The actual calculation will be triggered by the prediction calculated event

  } catch (error) {
    console.error(`❌ Failed to process prediction request for ${predictionId}:`, error)
    throw error
  }
} 