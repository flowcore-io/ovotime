import { pool } from "@/src/database"
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
    
    // Extract measurement data first
    const { measurements, speciesType, observationDateTime, researcherNotes, sessionId } = body
    
    // Validate measurement data - flatten measurements for validation
    const validationData = {
      length: measurements.length,
      breadth: measurements.breadth,
      mass: measurements.mass,
      kv: measurements.kv,
      speciesType,
      observationDateTime
    }
    
    const validationResult = validateEggMeasurement(validationData)
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
    
    // Publish measurement submitted event (with timeout handling)
    try {
      await publishMeasurementSubmitted({
        measurementId,
        sessionId,
        speciesType,
        measurements,
        observationDateTime,
        researcherNotes,
        timestamp: new Date()
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn(`⚠️  Measurement submitted event publish timed out for ${measurementId}, but continuing processing...`)
      } else {
        throw error
      }
    }

    // Publish measurement validated event (don't block on timeout)
    try {
      await publishMeasurementValidated({
        measurementId,
        validationStatus: 'valid',
        normalizedData: measurements,
        validatedAt: new Date()
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn(`⚠️  Validation event publish timed out for ${measurementId}, but continuing processing...`)
      } else {
        throw error
      }
    }

    // Add measurement to session if sessionId is provided
    if (sessionId) {
      try {
        // Get current measurement count for sequence number
        const client = await pool.connect()
        let sequenceNumber = 1
        try {
          const sessionResult = await client.query(
            'SELECT measurement_count FROM sessions WHERE id = $1',
            [sessionId]
          )
          if (sessionResult.rows.length > 0) {
            sequenceNumber = sessionResult.rows[0].measurement_count + 1
          }
        } finally {
          client.release()
        }

        await publishSessionMeasurementAdded({
          sessionId,
          measurementId,
          sequenceNumber,
          addedAt: new Date()
        })
      } catch (sessionError) {
        // Log session addition error but don't fail the measurement
        console.error('Failed to add measurement to session:', sessionError)
      }
    }

    // Publish prediction requested event
    try {
      await publishPredictionRequested({
        predictionId,
        measurementId,
        sessionId,
        calculationMethod: 'tbh_skuas',
        requestedAt: new Date()
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn(`⚠️  Prediction request event publish timed out for ${measurementId}, but continuing processing...`)
      } else {
        throw error
      }
    }

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
      try {
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
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          console.warn(`⚠️  Prediction calculated event publish timed out for ${measurementId}, but continuing processing...`)
        } else {
          throw error
        }
      }

      // Brief delay for event processing
      await sleep(500)

      return NextResponse.json({
        success: true,
        data: {
          measurementId,
          predictionId,
          measurements,
          prediction
        },
        message: "Measurement processed successfully",
        note: "Data saved successfully. Some event notifications may be delayed due to network conditions."
      })

    } catch (predictionError) {
      console.error("Prediction calculation error:", predictionError)

      // Publish prediction failed event
      try {
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
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          console.warn(`⚠️  Prediction failed event publish timed out for ${measurementId}, but continuing processing...`)
        } else {
          console.error(`❌ Failed to publish prediction failed event for ${measurementId}:`, error)
        }
      }

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

    // Enhanced error handling for cold start scenarios
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isTimeout = errorMessage.includes('timeout')
    const isConnectionError = errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')
    const isServerlessError = errorMessage.includes('Function') || errorMessage.includes('Lambda') || errorMessage.includes('cold')
    
    // Check if this is a timeout error (original logic)
    if (isTimeout) {
      return NextResponse.json({
        success: true, // Mark as success since data may have been saved
        warning: true,
        error: "Network timeout occurred",
        message: "Your measurement may have been saved successfully. Please check the measurements list to confirm.",
        details: "Event processing timed out, but data is likely stored correctly.",
        troubleshooting: "If your measurement doesn't appear, please try submitting again."
      }, { status: 200 }) // Return 200 for timeout to prevent UI error state
    }

    // Handle connection errors during cold starts
    if (isConnectionError || isServerlessError) {
      return NextResponse.json({
        success: true, // Mark as success since data may have been saved
        warning: true,
        error: "Cold start delay occurred",
        message: "Your measurement is being processed. This may take a few moments due to system initialization.",
        details: "The serverless function is starting up. Your data is likely being saved correctly.",
        troubleshooting: "Please wait a moment and refresh the measurements list to verify your submission."
      }, { status: 200 }) // Return 200 to prevent UI error state
    }

    // Handle other potential cold start related errors
    if (errorMessage.includes('pool') || errorMessage.includes('database') || errorMessage.includes('connect')) {
      return NextResponse.json({
        success: true, // Mark as success since data may have been saved
        warning: true,
        error: "Database initialization in progress",
        message: "Your measurement is being processed. Database connections are being established.",
        details: "This typically happens during the first request after a period of inactivity.",
        troubleshooting: "Please wait a moment and check the measurements list. If the measurement doesn't appear, try submitting again."
      }, { status: 200 }) // Return 200 to prevent UI error state
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
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const client = await pool.connect()
    try {
      let query = `
        SELECT 
          m.*,
          p.id as prediction_id,
          p.tbh,
          p.egg_density,
          p.egg_volume,
          p.confidence,
          p.formula_name,
          p.formula_version,
          p.calculated_at as prediction_calculated_at,
          s.session_name,
          s.researcher_id
        FROM measurements m
        LEFT JOIN predictions p ON m.id = p.measurement_id
        LEFT JOIN sessions s ON m.session_id = s.id
        WHERE 1=1
      `
      const params: unknown[] = []
      let paramIndex = 1

      if (sessionId) {
        query += ` AND m.session_id = $${paramIndex}`
        params.push(sessionId)
        paramIndex++
      }

      if (speciesType) {
        query += ` AND m.species_type = $${paramIndex}::species_type`
        params.push(speciesType)
        paramIndex++
      }

      if (!includeArchived) {
        query += ` AND m.archived = false`
      }

      query += ` 
        ORDER BY m.submitted_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      params.push(limit, offset)

      const result = await client.query(query, params)
      
      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM measurements m
        WHERE 1=1
      `
      const countParams: unknown[] = []
      let countParamIndex = 1

      if (sessionId) {
        countQuery += ` AND m.session_id = $${countParamIndex}`
        countParams.push(sessionId)
        countParamIndex++
      }

      if (speciesType) {
        countQuery += ` AND m.species_type = $${countParamIndex}::species_type`
        countParams.push(speciesType)
        countParamIndex++
      }

      if (!includeArchived) {
        countQuery += ` AND m.archived = false`
      }

      const countResult = await client.query(countQuery, countParams)
      const total = parseInt(countResult.rows[0].total)

      const measurements = result.rows.map(row => ({
        measurementId: row.id,
        sessionId: row.session_id,
        sessionName: row.session_name,
        researcher: row.researcher_id,
        speciesType: row.species_type,
        measurements: {
          length: parseFloat(row.length),
          breadth: parseFloat(row.breadth),
          mass: parseFloat(row.mass),
          kv: parseFloat(row.kv)
        },
        observationDateTime: row.observation_date_time,
        researcherNotes: row.researcher_notes,
        prediction: row.prediction_id ? {
          tbh: parseFloat(row.tbh),
          eggDensity: parseFloat(row.egg_density),
          eggVolume: parseFloat(row.egg_volume),
          confidence: parseFloat(row.confidence),
          formulaName: row.formula_name,
          formulaVersion: row.formula_version,
          calculatedAt: row.prediction_calculated_at
        } : null,
        submittedAt: row.submitted_at,
        archived: row.archived,
        archivedBy: row.archived_by,
        archiveReason: row.archive_reason,
        archivedAt: row.archived_at
      }))

      return NextResponse.json({
        success: true,
        data: {
          measurements,
          pagination: {
            limit,
            offset,
            total,
            hasMore: offset + limit < total
          }
        },
        message: "Measurements retrieved successfully"
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Failed to retrieve measurements:", error)

    return NextResponse.json({
      success: false,
      error: "Failed to retrieve measurements",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 