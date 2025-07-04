/**
 * Scientific calculation formulas for Skua egg hatching time prediction
 * Based on the research paper "Seabird 32-84"
 */

export interface SkuaCalculationInput {
  length: number // mm
  breadth: number // mm
  mass: number // g
  kv: number // egg-shape constant (default: 0.507)
  speciesType: 'arctic' | 'great'
}

export interface SkuaCalculationResult {
  tbh: number // days until hatching
  eggDensity: number // DE in g/cm³
  eggVolume: number // VE in cm³
  confidence: number
  speciesType: 'arctic' | 'great'
  formula: {
    name: string
    version: string
    coefficients: Record<string, number>
  }
}

/**
 * Formula coefficients from the research paper
 */
const FORMULA_COEFFICIENTS = {
  A: -0.2412,
  B: 0.05818,
  C: 0.3175,
  D: 0.8746,
  E: -0.1588
}

/**
 * Species-specific confidence ranges
 */
const SPECIES_RANGES = {
  arctic: {
    density: { min: 0.80, max: 1.05 },
    tbh: { min: 0, max: 35 }
  },
  great: {
    density: { min: 0.85, max: 1.10 },
    tbh: { min: 0, max: 35 }
  }
}

/**
 * Calculate egg volume using the formula: VE = KV × l × b²
 * Returns volume in cm³ (converts from mm³ to cm³)
 */
export function calculateEggVolume(length: number, breadth: number, kv: number): number {
  if (length <= 0 || breadth <= 0 || kv <= 0) {
    throw new Error("All measurements must be positive numbers")
  }
  
  // Calculate volume in mm³ first
  const volumeMm3 = kv * length * Math.pow(breadth, 2)
  
  // Convert mm³ to cm³ (1 cm³ = 1000 mm³)
  return volumeMm3 / 1000
}

/**
 * Calculate egg density using the formula: DE = m / VE
 * Returns density in g/cm³ (mass in grams, volume in cm³)
 */
export function calculateEggDensity(mass: number, eggVolume: number): number {
  if (mass <= 0 || eggVolume <= 0) {
    throw new Error("Mass and egg volume must be positive numbers")
  }
  
  return mass / eggVolume
}

/**
 * Calculate Time Before Hatching (TBH) using the quadratic formula:
 * TBH_skuas = (-0.2412 + √(0.05818 + 0.3175(0.8746 - DE))) / -0.1588
 */
export function calculateTBH(eggDensity: number): number {
  const { A, B, C, D, E } = FORMULA_COEFFICIENTS
  
  // Validate egg density is within reasonable range (should be positive and typically 0.5-1.5)
  if (eggDensity <= 0) {
    throw new Error(`Invalid egg density: ${eggDensity} (must be positive)`)
  }
  
  if (eggDensity > 2.0) {
    throw new Error(`Egg density ${eggDensity} is unusually high (>2.0 g/ml). Please verify measurements.`)
  }
  
  // Calculate discriminant: B + C(D - DE)
  const discriminant = B + C * (D - eggDensity)
  
  if (discriminant < 0) {
    throw new Error(`Invalid calculation: discriminant is negative (${discriminant.toFixed(6)}). Egg density (${eggDensity}) is outside the valid range for this formula. Expected range: 0.5-1.5 g/ml`)
  }
  
  // Calculate TBH: (A + √discriminant) / E
  const tbh = (A + Math.sqrt(discriminant)) / E
  
  if (tbh < 0) {
    throw new Error(`Invalid result: TBH cannot be negative (${tbh.toFixed(3)} days). Input parameters: DE=${eggDensity}, discriminant=${discriminant.toFixed(6)}`)
  }
  
  if (tbh > 100) {
    throw new Error(`TBH result ${tbh.toFixed(1)} days is unusually high. Please verify measurements.`)
  }
  
  return tbh
}

/**
 * Calculate confidence score based on species type and value ranges
 */
export function calculateConfidence(eggDensity: number, tbh: number, speciesType: 'arctic' | 'great'): number {
  const ranges = SPECIES_RANGES[speciesType]
  
  let confidence = 1.0
  
  // Reduce confidence for out-of-range egg density
  if (eggDensity < ranges.density.min || eggDensity > ranges.density.max) {
    confidence *= 0.6 // Low confidence for out-of-range density
  } else {
    // High confidence for density within normal range
    const densityRange = ranges.density.max - ranges.density.min
    const distanceFromCenter = Math.abs(eggDensity - (ranges.density.min + densityRange / 2))
    const maxDistance = densityRange / 2
    confidence *= 0.9 + 0.1 * (1 - distanceFromCenter / maxDistance)
  }
  
  // Reduce confidence for extreme TBH values
  if (tbh < ranges.tbh.min || tbh > ranges.tbh.max) {
    confidence *= 0.7 // Lower confidence for extreme TBH values
  } else if (tbh > 30) {
    confidence *= 0.8 // Slightly lower confidence for very long incubation times
  }
  
  // Ensure confidence is between 0 and 1
  return Math.max(0.1, Math.min(1.0, confidence))
}

/**
 * Main calculation function that performs complete TBH calculation
 */
export function calculateSkuaTBH(input: SkuaCalculationInput): SkuaCalculationResult {
  const { length, breadth, mass, kv, speciesType } = input
  
  // Validate inputs
  if (length <= 0 || breadth <= 0 || mass <= 0 || kv <= 0) {
    throw new Error("All measurements must be positive numbers")
  }
  
  if (!['arctic', 'great'].includes(speciesType)) {
    throw new Error("Species type must be 'arctic' or 'great'")
  }
  
  try {
    // Step 1: Calculate egg volume
    const eggVolume = calculateEggVolume(length, breadth, kv)
    
    // Step 2: Calculate egg density
    const eggDensity = calculateEggDensity(mass, eggVolume)
    
    // Step 3: Calculate TBH
    const tbh = calculateTBH(eggDensity)
    
    // Step 4: Calculate confidence
    const confidence = calculateConfidence(eggDensity, tbh, speciesType)
    
    return {
      tbh: Math.round(tbh * 100) / 100, // Round to 2 decimal places
      eggDensity: Math.round(eggDensity * 10000) / 10000, // Round to 4 decimal places
      eggVolume: Math.round(eggVolume * 100) / 100, // Round to 2 decimal places
      confidence: Math.round(confidence * 1000) / 1000, // Round to 3 decimal places
      speciesType,
      formula: {
        name: 'TBH_skuas',
        version: '1.0',
        coefficients: FORMULA_COEFFICIENTS
      }
    }
  } catch (error) {
    throw new Error(`Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Batch calculation for multiple measurements
 */
export function calculateBatchTBH(inputs: SkuaCalculationInput[]): SkuaCalculationResult[] {
  return inputs.map((input, index) => {
    try {
      return calculateSkuaTBH(input)
    } catch (error) {
      throw new Error(`Calculation failed for input ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
}

/**
 * Validate input parameters against acceptable ranges
 */
export function validateCalculationInput(input: SkuaCalculationInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check for positive numbers
  if (input.length <= 0) errors.push('Egg length must be greater than 0')
  if (input.breadth <= 0) errors.push('Egg breadth must be greater than 0')
  if (input.mass <= 0) errors.push('Egg mass must be greater than 0')
  if (input.kv <= 0) errors.push('Kv constant must be greater than 0')
  
  // Check reasonable ranges
  if (input.length > 100) errors.push('Egg length seems unusually large (>100mm)')
  if (input.breadth > 80) errors.push('Egg breadth seems unusually large (>80mm)')
  if (input.mass > 200) errors.push('Egg mass seems unusually large (>200g)')
  if (input.kv > 1.0) errors.push('Kv constant should typically be less than 1.0')
  
  // Check species type
  if (!['arctic', 'great'].includes(input.speciesType)) {
    errors.push('Species type must be either "arctic" or "great"')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get expected ranges for a species
 */
export function getSpeciesRanges(speciesType: 'arctic' | 'great') {
  return SPECIES_RANGES[speciesType]
}

/**
 * Export formula coefficients for reference
 */
export function getFormulaCoefficients() {
  return { ...FORMULA_COEFFICIENTS }
} 