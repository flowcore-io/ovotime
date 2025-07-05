import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/sessions/[sessionId]/export
 * Export session data in CSV or JSON format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    
    // TODO: Implement database query to get session and measurement data
    // This would retrieve all measurements for the session from the database
    
    // Mock data for now
    const sessionData = {
      sessionId,
      title: "Sample Session",
      researcher: "Test Researcher",
      location: "Test Location",
      startedAt: new Date(),
      measurements: [
        {
          measurementId: "m1",
          timestamp: new Date(),
          speciesType: "arctic",
          length: 72.3,
          breadth: 50.2,
          mass: 91.89,
          kv: 0.507,
          eggDensity: 0.995,
          eggVolume: 18.64,
          tbh: 6.45,
          confidence: 0.95,
          location: "Site A"
        }
      ]
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
        'Species Type',
        'Length (mm)',
        'Breadth (mm)',
        'Mass (g)',
        'Kv',
        'Egg Density (g/cm³)',
        'Egg Volume (cm³)',
        'TBH (days)',
        'Confidence',
        'Measurement Location'
      ]
      
      const csvRows = sessionData.measurements.map(measurement => [
        sessionData.sessionId,
        sessionData.title,
        sessionData.researcher,
        sessionData.location,
        measurement.measurementId,
        measurement.timestamp.toISOString(),
        measurement.speciesType,
        measurement.length,
        measurement.breadth,
        measurement.mass,
        measurement.kv,
        measurement.eggDensity,
        measurement.eggVolume,
        measurement.tbh,
        measurement.confidence,
        measurement.location
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
          location: measurement.location
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

  } catch (error) {
    console.error("Export error:", error)

    return NextResponse.json({
      success: false,
      error: "Failed to export data",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 