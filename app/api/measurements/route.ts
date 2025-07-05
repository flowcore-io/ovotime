import { calculateSkuaTBH } from "@/src/lib/calculations/skua-formulas"
import { generateId, sleep } from "@/src/lib/utils"
import { validateEggMeasurement } from "@/src/lib/validation"
import { pathways } from "@/src/pathways/pathways"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/measurements
 * Process new measurement data and generate predictions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const measurementId = body.measurementId || generateId()
    
    // Validate measurement data
    const validationResult = validateEggMeasurement(body)
    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: validationResult.errors
      }, { status: 400 })
    }

    // Extract measurement data
    const { measurements, speciesType, location, researcherNotes, sessionId } = body
    
    // Calculate prediction
    const predictionInput = {
      length: measurements.length,
      breadth: measurements.breadth,
      mass: measurements.mass,
      kv: measurements.kv,
      speciesType
    }

    const prediction = calculateSkuaTBH(predictionInput)

    // Create measurement event data
    const measurementData = {
      measurementId,
      sessionId,
      speciesType,
      measurements,
      location,
      researcherNotes,
      prediction,
      recordedAt: new Date()
    }

    // Publish measurement event
    await pathways.write("measurement.recorded.0", measurementData)

    // Brief delay for transformer processing
    await sleep(100)

    return NextResponse.json({
      success: true,
      data: {
        measurementId,
        measurement: measurementData,
        prediction
      },
      message: "Measurement processed successfully"
    })

  } catch (error) {
    console.error("Measurement processing error:", error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Validation error",
        details: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: "Failed to process measurement",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * GET /api/measurements
 * Retrieve measurements with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')
    const speciesType = searchParams.get('speciesType')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // TODO: Implement database query to retrieve measurements
    // This would use the db instance to query the measurements table
    // with appropriate filters and pagination

    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      data: {
        measurements: [],
        pagination: {
          limit,
          offset,
          total: 0,
          hasMore: false
        }
      },
      message: "Measurements retrieved successfully"
    })

  } catch (error) {
    console.error("Failed to retrieve measurements:", error)

    return NextResponse.json({
      success: false,
      error: "Failed to retrieve measurements",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 