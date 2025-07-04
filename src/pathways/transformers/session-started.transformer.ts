import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { db } from "../../database"
import { tableSessions } from "../../database/schema"
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

  try {
    // Insert session record
    await db.insert(tableSessions).values({
      id: sessionId,
      sessionName,
      researcherId,
      startLocation: startLocation ? JSON.stringify(startLocation) : null,
      expectedDuration,
      researchGoals,
      measurementCount: 0,
      status: 'active',
      startedAt,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log(`✅ Session ${sessionId} started: ${sessionName}`)

  } catch (error) {
    console.error(`❌ Failed to process session start for ${sessionId}:`, error)
    throw error
  }
} 