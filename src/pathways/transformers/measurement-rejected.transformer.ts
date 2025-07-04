import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { db } from "../../database"
import { tableValidationErrors } from "../../database/schema"
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

  try {
    // Log rejection and validation errors
    for (const error of validationErrors) {
      await db.insert(tableValidationErrors).values({
        id: generateId(),
        measurementId,
        errorType: 'rejection_error',
        errorMessage: error,
        createdAt: new Date()
      })
    }

    console.log(`❌ Measurement ${measurementId} rejected: ${rejectionReason}`)

  } catch (error) {
    console.error(`❌ Failed to process measurement rejection for ${measurementId}:`, error)
    throw error
  }
} 