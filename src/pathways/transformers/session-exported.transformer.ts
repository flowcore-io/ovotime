import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
import { generateId } from "../../lib/utils"
import { SessionExportedSchema } from "../contracts/session.events"

/**
 * Transformer for session exported events
 */
export async function sessionExportedTransformer(
  event: FlowcoreEvent<z.infer<typeof SessionExportedSchema>>
) {
  const { 
    sessionId, 
    exportFormat,
    exportedBy,
    exportOptions,
    fileSize,
    downloadUrl,
    exportedAt 
  } = event.payload

  const client = await pool.connect()

  try {
    // Insert session export record
    await client.query(`
      INSERT INTO session_exports (
        id, 
        session_id, 
        export_format, 
        exported_by, 
        export_options, 
        file_size, 
        download_url, 
        exported_at, 
        created_at
      ) VALUES (
        $1, $2, $3::export_format, $4, $5, $6, $7, $8, NOW()
      )
    `, [
      generateId(),
      sessionId,
      exportFormat,
      exportedBy,
      JSON.stringify(exportOptions),
      fileSize,
      downloadUrl,
      exportedAt
    ])

    console.log(`✅ Session ${sessionId} exported in ${exportFormat} format by ${exportedBy}`)

  } catch (error) {
    console.error(`❌ Failed to process session export for ${sessionId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 