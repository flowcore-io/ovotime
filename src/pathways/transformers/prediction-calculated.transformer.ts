import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { pool } from "../../database"
import { PredictionCalculatedSchema } from "../contracts/prediction.events"

/**
 * Transformer for prediction calculated events
 */
export async function predictionCalculatedTransformer(
  event: FlowcoreEvent<z.infer<typeof PredictionCalculatedSchema>>
) {
  const { 
    predictionId, 
    measurementId, 
    results, 
    formula,
    calculatedAt 
  } = event.payload

  const client = await pool.connect()

  try {
    // Insert prediction record
    await client.query(`
      INSERT INTO predictions (
        id, 
        measurement_id, 
        tbh, 
        egg_density, 
        egg_volume, 
        confidence, 
        species_type, 
        formula_name, 
        formula_version, 
        formula_coefficients, 
        calculated_at, 
        created_at, 
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::species_type, $8, $9, $10, $11, NOW(), NOW()
      )
    `, [
      predictionId,
      measurementId,
      results.tbh,
      results.eggDensity,
      results.eggVolume,
      results.confidence,
      results.speciesType,
      formula.name,
      formula.version,
      JSON.stringify(formula.coefficients),
      results.calculationTimestamp
    ])

    console.log(`✅ Prediction ${predictionId} calculated successfully - TBH: ${results.tbh} days`)

  } catch (error) {
    console.error(`❌ Failed to process prediction calculation for ${predictionId}:`, error)
    throw error
  } finally {
    client.release()
  }
} 