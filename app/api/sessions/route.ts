import { pool } from "@/src/database"
import { generateId, sleep } from "@/src/lib/utils"
import { publishSessionStarted } from "@/src/pathways/pathways"
// Temporarily using mock validation for demo
// import { SessionStartedSchema } from "@/src/pathways/contracts/session.events"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/sessions
 * Create a new research session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sessionId = generateId()
    
    // Validate required fields
    const sessionName = body.title || body.sessionName
    const researcherId = body.researcher || body.researcherId

    if (!sessionName || sessionName.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: "Validation error",
        message: "Session title is required"
      }, { status: 400 })
    }

    if (!researcherId || researcherId.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: "Validation error", 
        message: "Researcher name is required"
      }, { status: 400 })
    }

    // Validate and prepare location data
    let startLocation = undefined
    if (body.location) {
      if (typeof body.location === 'string') {
        // Simple string location - create default coordinates
        startLocation = {
          latitude: 0,
          longitude: 0,
          siteName: body.location.trim()
        }
      } else if (body.location.latitude !== undefined && body.location.longitude !== undefined) {
        // Full location object with coordinates
        const lat = Number(body.location.latitude)
        const lng = Number(body.location.longitude)
        const siteName = body.location.siteName || body.location.toString()

        if (isNaN(lat) || lat < -90 || lat > 90) {
          return NextResponse.json({
            success: false,
            error: "Validation error",
            message: "Invalid latitude: must be a number between -90 and 90"
          }, { status: 400 })
        }

        if (isNaN(lng) || lng < -180 || lng > 180) {
          return NextResponse.json({
            success: false,
            error: "Validation error",
            message: "Invalid longitude: must be a number between -180 and 180"
          }, { status: 400 })
        }

        startLocation = {
          latitude: lat,
          longitude: lng,
          siteName: typeof siteName === 'string' ? siteName.trim() : siteName.toString()
        }
      }
    }

    // Create session data with proper field mapping
    const sessionData = {
      sessionId,
      sessionName: sessionName.trim(),
      researcherId: researcherId.trim(),
      startLocation,
      researchGoals: body.notes || body.researchGoals,
      startedAt: new Date()
    }

    // Publish session started event
    await publishSessionStarted(sessionData)

    // Wait for transformer processing
    await sleep(500)

    // Retrieve the created session from database
    const client = await pool.connect()
    try {
      const result = await client.query(
        'SELECT * FROM sessions WHERE id = $1',
        [sessionId]
      )
      
      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Session creation failed",
          message: "Session not found in database after creation"
        }, { status: 500 })
      }

      const session = result.rows[0]
      
      return NextResponse.json({
        success: true,
        data: {
          sessionId: session.id,
          session: {
            sessionId: session.id,
            title: session.session_name,
            researcher: session.researcher_id,
            location: session.start_location,
            notes: session.research_goals,
            measurementCount: session.measurement_count,
            status: session.status,
            startedAt: session.started_at,
            completedAt: session.completed_at,
            archived: session.archived
          }
        },
        message: "Research session started successfully"
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Session creation error:", error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Validation error",
        details: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: "Failed to create session",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * GET /api/sessions
 * Retrieve research sessions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const researcherId = searchParams.get('researcherId')
    const status = searchParams.get('status')
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const client = await pool.connect()
    try {
      let query = `
        SELECT s.*, 
               COUNT(m.id) as measurement_count_actual
        FROM sessions s
        LEFT JOIN measurements m ON s.id = m.session_id AND m.archived = false
        WHERE 1=1
      `
      const params: unknown[] = []
      let paramIndex = 1

      if (researcherId) {
        query += ` AND s.researcher_id = $${paramIndex}`
        params.push(researcherId)
        paramIndex++
      }

      if (status) {
        query += ` AND s.status = $${paramIndex}::session_status`
        params.push(status)
        paramIndex++
      }

      if (!includeArchived) {
        query += ` AND s.archived = false`
      }

      query += ` 
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      params.push(limit, offset)

      const result = await client.query(query, params)
      
      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(DISTINCT s.id) as total 
        FROM sessions s
        WHERE 1=1
      `
      const countParams: unknown[] = []
      let countParamIndex = 1

      if (researcherId) {
        countQuery += ` AND s.researcher_id = $${countParamIndex}`
        countParams.push(researcherId)
        countParamIndex++
      }

      if (status) {
        countQuery += ` AND s.status = $${countParamIndex}::session_status`
        countParams.push(status)
        countParamIndex++
      }

      if (!includeArchived) {
        countQuery += ` AND s.archived = false`
      }

      const countResult = await client.query(countQuery, countParams)
      const total = parseInt(countResult.rows[0].total)

      const sessions = result.rows.map(row => ({
        sessionId: row.id,
        title: row.session_name,
        researcher: row.researcher_id,
        location: row.start_location,
        notes: row.research_goals,
        measurementCount: parseInt(row.measurement_count_actual) || 0,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        archived: row.archived,
        archivedBy: row.archived_by,
        archiveReason: row.archive_reason,
        archivedAt: row.archived_at
      }))

      return NextResponse.json({
        success: true,
        data: {
          sessions,
          pagination: {
            limit,
            offset,
            total,
            hasMore: offset + limit < total
          }
        },
        message: "Sessions retrieved successfully"
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Failed to retrieve sessions:", error)

    return NextResponse.json({
      success: false,
      error: "Failed to retrieve sessions",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 