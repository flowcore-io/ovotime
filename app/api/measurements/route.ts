import { calculateSkuaTBH } from "@/src/lib/calculations/skua-formulas"
import { generateId, sleep } from "@/src/lib/utils"
import { validateEggMeasurement } from "@/src/lib/validation"
import {
    publishMeasurementRejected,
    publishMeasurementSubmitted,
    publishMeasurementValidated,
    publishPredictionCalculated,
    publishPredictionFailed,
    publishPredictionRequested,
    publishSessionMeasurementAdded
} from "@/src/pathways/pathways"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/measurements
 * Process new measurement data and generate predictions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const measurementId = body.measurementId || generateId()
    const predictionId = generateId()
    
    // Validate measurement data
    const validationResult = validateEggMeasurement(body)
    if (!validationResult.isValid) {
      // Publish measurement rejected event
      await publishMeasurementRejected({
        measurementId,
        rejectionReason: "Validation failed",
        validationErrors: validationResult.errors,
        rejectedAt: new Date()
      })

      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: validationResult.errors
      }, { status: 400 })
    }

    // Extract measurement data
    const { measurements, speciesType, location, researcherNotes, sessionId } = body
    
    // Publish measurement submitted event
    await publishMeasurementSubmitted({
      measurementId,
      sessionId,
      speciesType,
      measurements,
      location,
      researcherNotes,
      timestamp: new Date()
    })

    // Publish measurement validated event
    await publishMeasurementValidated({
      measurementId,
      validationStatus: 'valid',
      normalizedData: measurements,
      validatedAt: new Date()
    })

    // Add measurement to session if sessionId is provided
    if (sessionId) {
      await publishSessionMeasurementAdded({
        sessionId,
        measurementId,
        sequenceNumber: 1, // This should be calculated from session
        addedAt: new Date()
      })
    }

    // Publish prediction requested event
    await publishPredictionRequested({
      predictionId,
      measurementId,
      sessionId,
      calculationMethod: 'tbh_skuas',
      requestedAt: new Date()
    })

    try {
      // Calculate prediction
      const predictionInput = {
        length: measurements.length,
        breadth: measurements.breadth,
        mass: measurements.mass,
        kv: measurements.kv,
        speciesType
      }

      const prediction = calculateSkuaTBH(predictionInput)

      // Publish prediction calculated event
      await publishPredictionCalculated({
        predictionId,
        measurementId,
        results: {
          tbh: prediction.tbh,
          eggDensity: prediction.eggDensity,
          eggVolume: prediction.eggVolume,
          confidence: prediction.confidence,
          speciesType: prediction.speciesType,
          calculationTimestamp: new Date()
        },
        formula: {
          name: prediction.formula.name,
          version: prediction.formula.version,
          coefficients: prediction.formula.coefficients
        },
        calculatedAt: new Date()
      })

      // Brief delay for event processing
      await sleep(100)

      return NextResponse.json({
        success: true,
        data: {
          measurementId,
          predictionId,
          measurements,
          prediction
        },
        message: "Measurement processed successfully"
      })

    } catch (predictionError) {
      console.error("Prediction calculation error:", predictionError)

      // Publish prediction failed event
      await publishPredictionFailed({
        predictionId,
        measurementId,
        errorType: 'calculation_error',
        errorMessage: predictionError instanceof Error ? predictionError.message : 'Unknown calculation error',
        errorDetails: {
          input: { measurements, speciesType },
          error: predictionError
        },
        failedAt: new Date()
      })

      return NextResponse.json({
        success: false,
        error: "Prediction calculation failed",
        message: predictionError instanceof Error ? predictionError.message : "Unknown error"
      }, { status: 500 })
    }

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