import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
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

  const client = await pool.connect()
  
  try {
    // Insert measurement record
    await client.query(`
      INSERT INTO measurements (
        id, 
        session_id, 
        species_type, 
        length, 
        breadth, 
        mass, 
        kv, 
        latitude, 
        longitude, 
        site_name, 
        researcher_notes, 
        submitted_at, 
        created_at, 
        updated_at
      ) VALUES (
        $1, $2, $3::species_type, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
      )
    `, [
      measurementId,
      sessionId || null,
      speciesType,
      measurements.length,
      measurements.breadth,
      measurements.mass,
      measurements.kv,
      location?.latitude || null,
      location?.longitude || null,
      location?.siteName || null,
      researcherNotes || null,
      timestamp
    ])

    console.log(`✅ Measurement ${measurementId} submitted successfully`)

  } catch (error) {
    console.error(`❌ Failed to process measurement submission for ${measurementId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 