import type { FlowcoreEvent } from "@flowcore/pathways"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../../database"
import { tableSessions } from "../../database/schema"
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

  try {
    // Update session with completion data
    await db.update(tableSessions)
      .set({ 
        status: 'completed',
        completedAt,
        measurementCount: totalMeasurements,
        updatedAt: new Date() 
      })
      .where(eq(tableSessions.id, sessionId))

    console.log(`✅ Session ${sessionId} completed with ${totalMeasurements} measurements and ${totalPredictions} predictions`)

  } catch (error) {
    console.error(`❌ Failed to process session completion for ${sessionId}:`, error)
    throw error
  }
} 