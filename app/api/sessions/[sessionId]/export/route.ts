import { pool } from "@/src/database";
import { NextRequest, NextResponse } from "next/server";

// Helper function to format location for display
const formatLocation = (location: { latitude?: number | null; longitude?: number | null; siteName?: string | null } | null | undefined): string => {
  if (!location) return 'Unknown location'
  
  if (location.siteName) {
    return location.siteName
  }
  
  if (location.latitude !== undefined && location.latitude !== null && 
      location.longitude !== undefined && location.longitude !== null) {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
  }
  
  return 'Unknown location'
}

/**
 * GET /api/sessions/[sessionId]/export
 * Export session data in CSV or JSON format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    
    const client = await pool.connect()
    
    try {
      // Get session data
      const sessionResult = await client.query(`
        SELECT 
          id as session_id,
          session_name as title,
          researcher_id as researcher,
          start_location,
          research_goals,
          started_at,
          completed_at,
          measurement_count,
          status
        FROM sessions 
        WHERE id = $1
      `, [sessionId])
      
      if (sessionResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Session not found"
        }, { status: 404 })
      }
      
      const session = sessionResult.rows[0]
      
      // Get measurements for this session with predictions
      const measurementsResult = await client.query(`
        SELECT 
          m.id as measurement_id,
          m.session_id,
          m.species_type,
          m.length,
          m.breadth,
          m.mass,
          m.kv,
          m.latitude,
          m.longitude,
          m.site_name,
          m.observation_date_time,
          m.researcher_notes,
          m.submitted_at,
          p.id as prediction_id,
          p.egg_density,
          p.egg_volume,
          p.tbh,
          p.confidence as confidence_score,
          p.formula_name,
          p.formula_version,
          p.calculated_at
        FROM measurements m
        LEFT JOIN predictions p ON m.id = p.measurement_id
        WHERE m.session_id = $1
        ORDER BY m.submitted_at ASC
      `, [sessionId])
      
      const sessionData = {
        sessionId: session.session_id,
        title: session.title,
        researcher: session.researcher,
        location: formatLocation(session.start_location),
        researchGoals: session.research_goals,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        measurementCount: session.measurement_count,
        status: session.status,
        measurements: measurementsResult.rows.map(row => ({
          measurementId: row.measurement_id,
          sessionId: row.session_id,
          timestamp: row.submitted_at,
          speciesType: row.species_type,
          length: row.length,
          breadth: row.breadth,
          mass: row.mass,
          kv: row.kv,
          location: formatLocation({
            latitude: row.latitude,
            longitude: row.longitude,
            siteName: row.site_name
          }),
          observationDateTime: row.observation_date_time,
          researcherNotes: row.researcher_notes,
          // Prediction data (may be null if no prediction calculated)
          predictionId: row.prediction_id,
          eggDensity: row.egg_density,
          eggVolume: row.egg_volume,
          tbh: row.tbh,
          confidence: row.confidence_score,
          formulaName: row.formula_name,
          formulaVersion: row.formula_version,
          calculatedAt: row.calculated_at
        }))
      }

      if (format === 'csv') {
        // Generate CSV content
        const csvHeaders = [
          'Session ID',
          'Session Title',
          'Researcher',
          'Location',
          'Measurement ID',
          'Timestamp',
          'Observation Date/Time',
          'Species Type',
          'Length (mm)',
          'Breadth (mm)',
          'Mass (g)',
          'Kv',
          'Egg Density (g/cm³)',
          'Egg Volume (cm³)',
          'TBH (days)',
          'Confidence',
          'Measurement Location',
          'Researcher Notes'
        ]
        
        // Helper function to escape CSV values
        const escapeCsvValue = (value: unknown): string => {
          if (value === null || value === undefined) return ''
          const str = String(value)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }
        
        const csvRows = sessionData.measurements.map(measurement => [
          escapeCsvValue(sessionData.sessionId),
          escapeCsvValue(sessionData.title),
          escapeCsvValue(sessionData.researcher),
          escapeCsvValue(sessionData.location),
          escapeCsvValue(measurement.measurementId),
          escapeCsvValue(measurement.timestamp.toISOString()),
          escapeCsvValue(measurement.observationDateTime ? new Date(measurement.observationDateTime).toISOString() : ''),
          escapeCsvValue(measurement.speciesType),
          escapeCsvValue(measurement.length),
          escapeCsvValue(measurement.breadth),
          escapeCsvValue(measurement.mass),
          escapeCsvValue(measurement.kv),
          escapeCsvValue(measurement.eggDensity),
          escapeCsvValue(measurement.eggVolume),
          escapeCsvValue(measurement.tbh),
          escapeCsvValue(measurement.confidence),
          escapeCsvValue(measurement.location),
          escapeCsvValue(measurement.researcherNotes)
        ])
        
        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.join(','))
        ].join('\n')
        
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="session_${sessionId}_${new Date().toISOString().split('T')[0]}.csv"`
          }
        })
        
      } else if (format === 'json') {
        // Generate JSON content
        const jsonContent = JSON.stringify({
          sessionInfo: {
            sessionId: sessionData.sessionId,
            title: sessionData.title,
            researcher: sessionData.researcher,
            location: sessionData.location,
            startedAt: sessionData.startedAt,
            exportedAt: new Date(),
            measurementCount: sessionData.measurements.length
          },
          measurements: sessionData.measurements.map(measurement => ({
            measurementId: measurement.measurementId,
            timestamp: measurement.timestamp,
            observationDateTime: measurement.observationDateTime,
            speciesType: measurement.speciesType,
            measurements: {
              length: measurement.length,
              breadth: measurement.breadth,
              mass: measurement.mass,
              kv: measurement.kv
            },
            predictions: {
              eggDensity: measurement.eggDensity,
              eggVolume: measurement.eggVolume,
              tbh: measurement.tbh,
              confidence: measurement.confidence
            },
            location: measurement.location,
            researcherNotes: measurement.researcherNotes
          }))
        }, null, 2)
        
        return new NextResponse(jsonContent, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="session_${sessionId}_${new Date().toISOString().split('T')[0]}.json"`
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: "Invalid format",
          message: "Format must be 'csv' or 'json'"
        }, { status: 400 })
      }

    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Export error:", error)

    return NextResponse.json({
      success: false,
      error: "Failed to export data",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 