import type { FlowcoreEvent } from "@flowcore/pathways"
import { eq, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../../database"
import { tableSessions } from "../../database/schema"
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

  try {
    // Increment measurement count for the session
    await db.update(tableSessions)
      .set({ 
        measurementCount: sql`measurement_count + 1`,
        updatedAt: new Date() 
      })
      .where(eq(tableSessions.id, sessionId))

    console.log(`✅ Measurement ${measurementId} added to session ${sessionId} (sequence: ${sequenceNumber})`)

  } catch (error) {
    console.error(`❌ Failed to process measurement addition for session ${sessionId}:`, error)
    throw error
  }
} 