import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
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
    errorDetails
  } = event.payload

  const client = await pool.connect()

  try {
    // Log the prediction failure
    await client.query(`
      INSERT INTO validation_errors (
        id, 
        measurement_id, 
        error_type, 
        error_message, 
        field_name, 
        field_value, 
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW()
      )
    `, [
      generateId(),
      measurementId,
      errorType,
      errorMessage,
      'prediction_calculation',
      JSON.stringify(errorDetails)
    ])

    console.log(`❌ Prediction ${predictionId} failed: ${errorMessage}`)

  } catch (error) {
    console.error(`❌ Failed to process prediction failure for ${predictionId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 