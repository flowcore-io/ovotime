import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
import { SessionArchivedSchema } from "../contracts/session.events"

/**
 * Transformer for session archived events
 */
export async function sessionArchivedTransformer(
  event: FlowcoreEvent<z.infer<typeof SessionArchivedSchema>>
) {
  const { 
    sessionId, 
    archivedBy, 
    archiveReason,
    archivedAt 
  } = event.payload

  const client = await pool.connect()

  try {
    // Update session with archive status
    await client.query(`
      UPDATE sessions 
      SET 
        archived = true,
        archived_by = $1,
        archive_reason = $2,
        archived_at = $3,
        status = 'archived'::session_status,
        updated_at = NOW()
      WHERE id = $4
    `, [archivedBy, archiveReason, archivedAt, sessionId])

    console.log(`📦 Session ${sessionId} archived by ${archivedBy}`)

  } catch (error) {
    console.error(`❌ Failed to process session archiving for ${sessionId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 