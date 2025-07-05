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
    const { measurements, speciesType, location, researcherNotes, sessionId } = body
    
    // Validate measurement data - flatten measurements for validation
    const validationData = {
      length: measurements.length,
      breadth: measurements.breadth,
      mass: measurements.mass,
      kv: measurements.kv,
      speciesType,
      location
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
        location,
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
        await publishSessionMeasurementAdded({
          sessionId,
          measurementId,
          sequenceNumber: 1, // This should be calculated from session
          addedAt: new Date()
        })
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          console.warn(`⚠️  Session measurement event publish timed out for ${measurementId}, but continuing processing...`)
        } else {
          throw error
        }
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
      const params: any[] = []
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
      const countParams: any[] = []
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
        location: {
          latitude: row.latitude ? parseFloat(row.latitude) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude) : undefined,
          siteName: row.site_name
        },
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