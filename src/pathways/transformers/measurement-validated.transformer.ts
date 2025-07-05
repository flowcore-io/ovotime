import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
import { generateId } from "../../lib/utils"
import { MeasurementValidatedSchema } from "../contracts/measurement.events"

/**
 * Transformer for measurement validated events
 */
export async function measurementValidatedTransformer(
  event: FlowcoreEvent<z.infer<typeof MeasurementValidatedSchema>>
) {
  const { 
    measurementId, 
    validationStatus, 
    validationErrors
  } = event.payload

  const client = await pool.connect()

  try {
    // Log validation errors if any
    if (validationStatus === 'invalid' && validationErrors) {
      for (const error of validationErrors) {
        await client.query(`
          INSERT INTO validation_errors (
            id, 
            measurement_id, 
            error_type, 
            error_message, 
            created_at
          ) VALUES (
            $1, $2, $3, $4, NOW()
          )
        `, [
          generateId(),
          measurementId,
          'validation_error',
          error
        ])
      }
    }

    console.log(`✅ Measurement ${measurementId} validation: ${validationStatus}`)

  } catch (error) {
    console.error(`❌ Failed to process measurement validation for ${measurementId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 