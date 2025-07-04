import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { db } from "../../database"
import { tableSessionExports } from "../../database/schema"
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

  try {
    // Insert session export record
    await db.insert(tableSessionExports).values({
      id: generateId(),
      sessionId,
      exportFormat,
      exportedBy,
      exportOptions: JSON.stringify(exportOptions),
      fileSize,
      downloadUrl,
      exportedAt,
      createdAt: new Date()
    })

    console.log(`✅ Session ${sessionId} exported in ${exportFormat} format by ${exportedBy}`)

  } catch (error) {
    console.error(`❌ Failed to process session export for ${sessionId}:`, error)
    throw error
  }
} 