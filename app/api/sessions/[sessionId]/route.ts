import { pool } from "@/src/database"
import { NextRequest, NextResponse } from "next/server"

/**
 * PATCH /api/sessions/[sessionId]
 * Update session status and metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const body = await request.json()
    
    const client = await pool.connect()
    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (body.status) {
        updateFields.push(`status = $${paramIndex}::session_status`)
        values.push(body.status)
        paramIndex++
      }

      if (body.endedAt || body.completedAt) {
        updateFields.push(`completed_at = $${paramIndex}`)
        values.push(body.endedAt || body.completedAt)
        paramIndex++
      }

      if (body.researchGoals !== undefined) {
        updateFields.push(`research_goals = $${paramIndex}`)
        values.push(body.researchGoals)
        paramIndex++
      }

      if (updateFields.length === 0) {
        return NextResponse.json({
          success: false,
          error: "No valid fields to update"
        }, { status: 400 })
      }

      updateFields.push(`updated_at = NOW()`)
      values.push(sessionId)

      const updateQuery = `
        UPDATE sessions 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `

      const result = await client.query(updateQuery, values)
      
      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Session not found"
        }, { status: 404 })
      }

      const session = result.rows[0]

      return NextResponse.json({
        success: true,
        data: {
          sessionId: session.id,
          title: session.session_name,
          researcher: session.researcher_id,
          location: session.start_location,
          notes: session.research_goals,
          measurementCount: session.measurement_count,
          status: session.status,
          startedAt: session.started_at,
          completedAt: session.completed_at,
          archived: session.archived,
          updatedAt: session.updated_at
        },
        message: "Session updated successfully"
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Session update error:", error)

    return NextResponse.json({
      success: false,
      error: "Failed to update session",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * GET /api/sessions/[sessionId]
 * Get session details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    
    const client = await pool.connect()
    try {
      const result = await client.query(`
        SELECT s.*, 
               COUNT(m.id) as measurement_count_actual
        FROM sessions s
        LEFT JOIN measurements m ON s.id = m.session_id AND m.archived = false
        WHERE s.id = $1
        GROUP BY s.id
      `, [sessionId])
      
      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Session not found"
        }, { status: 404 })
      }

      const session = result.rows[0]

      return NextResponse.json({
        success: true,
        data: {
          sessionId: session.id,
          title: session.session_name,
          researcher: session.researcher_id,
          location: session.start_location,
          notes: session.research_goals,
          measurementCount: parseInt(session.measurement_count_actual) || 0,
          status: session.status,
          startedAt: session.started_at,
          completedAt: session.completed_at,
          archived: session.archived,
          archivedBy: session.archived_by,
          archiveReason: session.archive_reason,
          archivedAt: session.archived_at
        },
        message: "Session retrieved successfully"
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Session retrieval error:", error)

    return NextResponse.json({
      success: false,
      error: "Failed to retrieve session",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 