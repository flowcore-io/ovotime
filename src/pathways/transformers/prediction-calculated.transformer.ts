import type { FlowcoreEvent } from "@flowcore/pathways"
import { z } from "zod"
import { db } from "../../database"
import { tablePredictions } from "../../database/schema"
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

  try {
    // Insert prediction record
    await db.insert(tablePredictions).values({
      id: predictionId,
      measurementId,
      tbh: results.tbh.toString(),
      eggDensity: results.eggDensity.toString(),
      eggVolume: results.eggVolume.toString(),
      confidence: results.confidence.toString(),
      speciesType: results.speciesType,
      formulaName: formula.name,
      formulaVersion: formula.version,
      formulaCoefficients: formula.coefficients,
      calculatedAt: results.calculationTimestamp,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log(`✅ Prediction ${predictionId} calculated successfully - TBH: ${results.tbh} days`)

  } catch (error) {
    console.error(`❌ Failed to process prediction calculation for ${predictionId}:`, error)
    throw error
  }
} 