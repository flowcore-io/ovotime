import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
import { MeasurementArchivedSchema } from "../contracts/measurement.events"

/**
 * Transformer for measurement archived events
 */
export async function measurementArchivedTransformer(
  event: FlowcoreEvent<z.infer<typeof MeasurementArchivedSchema>>
) {
  const { 
    measurementId, 
    archivedBy, 
    archiveReason,
    archivedAt 
  } = event.payload

  const client = await pool.connect()

  try {
    // Update measurement with archive status
    await client.query(`
      UPDATE measurements 
      SET 
        archived = true,
        archived_by = $1,
        archive_reason = $2,
        archived_at = $3,
        updated_at = NOW()
      WHERE id = $4
    `, [archivedBy, archiveReason, archivedAt, measurementId])

    console.log(`📦 Measurement ${measurementId} archived by ${archivedBy}`)

  } catch (error) {
    console.error(`❌ Failed to process measurement archiving for ${measurementId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 