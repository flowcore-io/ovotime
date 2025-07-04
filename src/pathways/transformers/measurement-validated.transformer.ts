import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { db } from "../../database"
import { tableValidationErrors } from "../../database/schema"
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
    validationErrors,
    validatedAt 
  } = event.payload

  try {
    // Log validation errors if any
    if (validationStatus === 'invalid' && validationErrors) {
      for (const error of validationErrors) {
        await db.insert(tableValidationErrors).values({
          id: generateId(),
          measurementId,
          errorType: 'validation_error',
          errorMessage: error,
          createdAt: new Date()
        })
      }
    }

    console.log(`✅ Measurement ${measurementId} validation: ${validationStatus}`)

  } catch (error) {
    console.error(`❌ Failed to process measurement validation for ${measurementId}:`, error)
    throw error
  }
} 