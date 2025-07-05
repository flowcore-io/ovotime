import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
import { generateId } from "../../lib/utils"
import { MeasurementRejectedSchema } from "../contracts/measurement.events"

/**
 * Transformer for measurement rejected events
 */
export async function measurementRejectedTransformer(
  event: FlowcoreEvent<z.infer<typeof MeasurementRejectedSchema>>
) {
  const { 
    measurementId, 
    rejectionReason, 
    validationErrors,
    rejectedAt 
  } = event.payload

  const client = await pool.connect()

  try {
    // Log rejection and validation errors
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
        'rejection_error',
        error
      ])
    }

    console.log(`❌ Measurement ${measurementId} rejected: ${rejectionReason}`)

  } catch (error) {
    console.error(`❌ Failed to process measurement rejection for ${measurementId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 