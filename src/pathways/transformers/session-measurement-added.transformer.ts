import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
import { SessionMeasurementAddedSchema } from "../contracts/session.events"

/**
 * Transformer for session measurement added events
 */
export async function sessionMeasurementAddedTransformer(
  event: FlowcoreEvent<z.infer<typeof SessionMeasurementAddedSchema>>
) {
  const { 
    sessionId, 
    measurementId, 
    sequenceNumber,
    addedAt 
  } = event.payload

  const client = await pool.connect()
  
  try {
    // Increment measurement count for the session
    await client.query(`
      UPDATE sessions 
      SET 
        measurement_count = measurement_count + 1,
        updated_at = NOW()
      WHERE id = $1
    `, [sessionId])

    console.log(`✅ Measurement ${measurementId} added to session ${sessionId} (sequence: ${sequenceNumber})`)

  } catch (error) {
    console.error(`❌ Failed to process measurement addition for session ${sessionId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 