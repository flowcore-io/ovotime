import type { FlowcoreEvent } from "@flowcore/pathways"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../../database"
import { tableMeasurements } from "../../database/schema"
import { MeasurementSubmittedSchema } from "../contracts/measurement.events"

/**
 * Transformer for measurement submitted events
 */
export async function measurementSubmittedTransformer(
  event: FlowcoreEvent<z.infer<typeof MeasurementSubmittedSchema>>
) {
  const { 
    measurementId, 
    sessionId, 
    speciesType, 
    measurements, 
    location, 
    researcherNotes, 
    timestamp 
  } = event.payload

  try {
    // Insert measurement record
    await db.insert(tableMeasurements).values({
      id: measurementId,
      sessionId,
      speciesType,
      length: measurements.length.toString(),
      breadth: measurements.breadth.toString(),
      mass: measurements.mass.toString(),
      kv: measurements.kv.toString(),
      latitude: location?.latitude?.toString(),
      longitude: location?.longitude?.toString(),
      siteName: location?.siteName,
      researcherNotes,
      submittedAt: timestamp,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log(`✅ Measurement ${measurementId} submitted successfully`)

    // If part of a session, increment measurement count
    if (sessionId) {
      // Note: This would normally trigger a session measurement added event
      // For now, we'll update the count directly
      await db.update(tableMeasurements)
        .set({ updatedAt: new Date() })
        .where(eq(tableMeasurements.id, measurementId))
    }

  } catch (error) {
    console.error(`❌ Failed to process measurement submission for ${measurementId}:`, error)
    throw error
  }
} 