import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
import { SessionStartedSchema } from "../contracts/session.events"

/**
 * Transformer for session started events
 */
export async function sessionStartedTransformer(
  event: FlowcoreEvent<z.infer<typeof SessionStartedSchema>>
) {
  const { 
    sessionId, 
    sessionName, 
    researcherId,
    startLocation,
    expectedDuration,
    researchGoals,
    startedAt 
  } = event.payload

  const client = await pool.connect()

  try {
    // Insert session record
    await client.query(`
      INSERT INTO sessions (
        id, 
        session_name, 
        researcher_id, 
        start_location, 
        expected_duration, 
        research_goals, 
        measurement_count, 
        status, 
        started_at, 
        created_at, 
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 0, 'active'::session_status, $7, NOW(), NOW()
      )
    `, [
      sessionId,
      sessionName,
      researcherId,
      startLocation ? JSON.stringify(startLocation) : null,
      expectedDuration,
      researchGoals,
      startedAt
    ])

    console.log(`✅ Session ${sessionId} started: ${sessionName}`)

  } catch (error) {
    console.error(`❌ Failed to process session start for ${sessionId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 