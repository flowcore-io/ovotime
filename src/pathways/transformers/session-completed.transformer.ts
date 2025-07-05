import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
import { SessionCompletedSchema } from "../contracts/session.events"

/**
 * Transformer for session completed events
 */
export async function sessionCompletedTransformer(
  event: FlowcoreEvent<z.infer<typeof SessionCompletedSchema>>
) {
  const { 
    sessionId, 
    totalMeasurements,
    totalPredictions,
    sessionSummary,
    completionNotes,
    completedAt 
  } = event.payload

  const client = await pool.connect()
  
  try {
    // Update session with completion data
    await client.query(`
      UPDATE sessions 
      SET 
        status = 'completed'::session_status,
        completed_at = $1,
        measurement_count = $2,
        updated_at = NOW()
      WHERE id = $3
    `, [completedAt, totalMeasurements, sessionId])

    console.log(`✅ Session ${sessionId} completed with ${totalMeasurements} measurements and ${totalPredictions} predictions`)

  } catch (error) {
    console.error(`❌ Failed to process session completion for ${sessionId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 