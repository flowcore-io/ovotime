import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { db } from "../../database"
import { tableValidationErrors } from "../../database/schema"
import { generateId } from "../../lib/utils"
import { PredictionFailedSchema } from "../contracts/prediction.events"

/**
 * Transformer for prediction failed events
 */
export async function predictionFailedTransformer(
  event: FlowcoreEvent<z.infer<typeof PredictionFailedSchema>>
) {
  const { 
    predictionId, 
    measurementId, 
    errorType,
    errorMessage,
    errorDetails,
    failedAt 
  } = event.payload

  try {
    // Log the prediction failure
    await db.insert(tableValidationErrors).values({
      id: generateId(),
      measurementId,
      errorType: errorType,
      errorMessage: errorMessage,
      fieldName: 'prediction_calculation',
      fieldValue: JSON.stringify(errorDetails),
      createdAt: new Date()
    })

    console.log(`❌ Prediction ${predictionId} failed: ${errorMessage}`)

  } catch (error) {
    console.error(`❌ Failed to process prediction failure for ${predictionId}:`, error)
    throw error
  }
} 