import { pool } from "@/src/database"
import { sleep } from "@/src/lib/utils"
import { publishSessionArchived } from "@/src/pathways/pathways"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/sessions/[sessionId]/archive
 * Archive a session with secret word authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const body = await request.json()
    const { secretWord, archivedBy, archiveReason } = body

    // Simple secret word validation (in production, use proper authentication)
    if (secretWord !== 'archive') {
      return NextResponse.json({
        success: false,
        error: "Invalid secret word"
      }, { status: 401 })
    }

    if (!archivedBy) {
      return NextResponse.json({
        success: false,
        error: "archivedBy is required"
      }, { status: 400 })
    }

    // Check if session exists and is not already archived
    const client = await pool.connect()
    try {
      const checkResult = await client.query(
        'SELECT id, archived FROM sessions WHERE id = $1',
        [sessionId]
      )

      if (checkResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Session not found"
        }, { status: 404 })
      }

      if (checkResult.rows[0].archived) {
        return NextResponse.json({
          success: false,
          error: "Session is already archived"
        }, { status: 400 })
      }

    } finally {
      client.release()
    }

    // Publish session archived event
    await publishSessionArchived({
      sessionId,
      archivedBy,
      archiveReason,
      archivedAt: new Date()
    })

    // Wait for transformer processing
    await sleep(300)

    return NextResponse.json({
      success: true,
      message: "Session archived successfully"
    })

  } catch (error) {
    console.error("Session archive error:", error)

    return NextResponse.json({
      success: false,
      error: "Failed to archive session",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 