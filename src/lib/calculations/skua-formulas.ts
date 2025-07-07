/**
 * Scientific calculation formulas for Skua egg hatching time prediction
 * Based on the research paper "Seabird 32-84" and Figure 1 species-specific formulas
 */

export interface SkuaCalculationInput {
  length: number // mm
  breadth: number // mm
  mass: number // g
  kv: number // egg-shape constant (default: 0.507)
  speciesType: 'arctic' | 'great'
}

export interface SkuaCalculationResult {
  tbh: number // days until hatching (DBH)
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
 * Species-specific quadratic formula coefficients from Figure 1
 * These formulas give DE as a function of DBH:
 * Arctic Skua: DE = -0.00007345×DBH² + 0.008618×DBH + 0.8719
 * Great Skua: DE = -0.00010000×DBH² + 0.008442×DBH + 0.8843
 * 
 * To find DBH from DE, we solve: a×DBH² + b×DBH + (c - DE) = 0
 */
const SPECIES_FORMULAS = {
  arctic: {
    name: 'Arctic Skua DE Formula',
    a: -0.00007345,  // quadratic coefficient
    b: 0.008618,     // linear coefficient  
    c: 0.8719        // constant term
  },
  great: {
    name: 'Great Skua DE Formula',
    a: -0.00010000,  // quadratic coefficient
    b: 0.008442,     // linear coefficient
    c: 0.8843        // constant term
  }
}

/**
 * Species-specific confidence ranges
 */
const SPECIES_RANGES = {
  arctic: {
    density: { min: 0.80, max: 1.05 },
    dbh: { min: 0, max: 35 }
  },
  great: {
    density: { min: 0.85, max: 1.10 },
    dbh: { min: 0, max: 35 }
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
 * Solve quadratic equation for DBH given DE using species-specific formulas.
 * 
 * Original formulas from Figure 1:
 * Arctic Skua: DE = -0.00007345×DBH² + 0.008618×DBH + 0.8719
 * Great Skua: DE = -0.00010000×DBH² + 0.008442×DBH + 0.8843
 * 
 * Rearranged to solve for DBH:
 * a×DBH² + b×DBH + (c - DE) = 0
 * 
 * Using quadratic formula: DBH = (-b ± √(b² - 4a(c - DE))) / (2a)
 */
export function calculateTBH(eggDensity: number, speciesType: 'arctic' | 'great'): number {
  // Validate egg density is within reasonable range
  if (eggDensity <= 0) {
    throw new Error(`Invalid egg density: ${eggDensity} (must be positive)`)
  }
  
  if (eggDensity > 2.0) {
    throw new Error(`Egg density ${eggDensity} is unusually high (>2.0 g/ml). Please verify measurements.`)
  }
  
  // Get species-specific formula coefficients
  const formula = SPECIES_FORMULAS[speciesType]
  if (!formula) {
    throw new Error(`Unknown species type: ${speciesType}`)
  }
  
  const { a, b, c } = formula
  
  // Solve quadratic equation: a×DBH² + b×DBH + (c - DE) = 0
  const discriminant = Math.pow(b, 2) - 4 * a * (c - eggDensity)
  
  if (discriminant < 0) {
    throw new Error(`Invalid calculation: discriminant is negative (${discriminant.toFixed(6)}). Egg density (${eggDensity}) is outside the valid range for this formula.`)
  }
  
  // Calculate both roots using quadratic formula
  const sqrtDiscriminant = Math.sqrt(discriminant)
  const root1 = (-b + sqrtDiscriminant) / (2 * a)
  const root2 = (-b - sqrtDiscriminant) / (2 * a)
  
  // Choose the positive root that falls within the expected range (0-35 days)
  const validRoots = [root1, root2].filter(root => root >= 0 && root <= 35)
  
  if (validRoots.length === 0) {
    throw new Error(`No valid DBH solution found. Roots: ${root1.toFixed(3)}, ${root2.toFixed(3)}. Expected range: 0-35 days.`)
  }
  
  // If multiple valid roots, choose the smaller one (more likely to be correct for typical measurements)
  const dbh = Math.min(...validRoots)
  
  if (dbh < 0) {
    throw new Error(`Invalid result: DBH cannot be negative (${dbh.toFixed(3)} days). Input parameters: DE=${eggDensity}, species=${speciesType}`)
  }
  
  if (dbh > 100) {
    throw new Error(`DBH result ${dbh.toFixed(1)} days is unusually high. Please verify measurements.`)
  }
  
  return dbh
}

/**
 * Calculate confidence score based on species type and value ranges
 */
export function calculateConfidence(eggDensity: number, dbh: number, speciesType: 'arctic' | 'great'): number {
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
  
  // Reduce confidence for extreme DBH values
  if (dbh < ranges.dbh.min || dbh > ranges.dbh.max) {
    confidence *= 0.7 // Lower confidence for extreme DBH values
  } else if (dbh > 30) {
    confidence *= 0.8 // Slightly lower confidence for very long incubation times
  }
  
  // Ensure confidence is between 0 and 1
  return Math.max(0.1, Math.min(1.0, confidence))
}

/**
 * Main calculation function that performs complete DBH calculation
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
    
    // Step 3: Calculate DBH by solving quadratic equation
    const dbh = calculateTBH(eggDensity, speciesType)
    
    // Step 4: Calculate confidence
    const confidence = calculateConfidence(eggDensity, dbh, speciesType)
    
    // Get formula info for the species
    const formula = SPECIES_FORMULAS[speciesType]
    
    return {
      tbh: Math.round(dbh * 100) / 100, // Round to 2 decimal places
      eggDensity: Math.round(eggDensity * 10000) / 10000, // Round to 4 decimal places
      eggVolume: Math.round(eggVolume * 100) / 100, // Round to 2 decimal places
      confidence: Math.round(confidence * 1000) / 1000, // Round to 3 decimal places
      speciesType,
      formula: {
        name: formula.name,
        version: '2.1', // Updated version for corrected quadratic solving
        coefficients: {
          a: formula.a,
          b: formula.b,
          c: formula.c
        }
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
  
  // Check for positive numbers and finite values
  if (!Number.isFinite(input.length) || input.length <= 0) errors.push('Egg length must be a positive number')
  if (!Number.isFinite(input.breadth) || input.breadth <= 0) errors.push('Egg breadth must be a positive number')
  if (!Number.isFinite(input.mass) || input.mass <= 0) errors.push('Egg mass must be a positive number')
  if (!Number.isFinite(input.kv) || input.kv <= 0) errors.push('Kv constant must be a positive number')
  
  // Check acceptable ranges for Skua eggs
  if (input.length < 60 || input.length > 85) errors.push('Egg length must be between 60-85mm (typical Skua range)')
  if (input.breadth < 40 || input.breadth > 60) errors.push('Egg breadth must be between 40-60mm (typical Skua range)')
  if (input.mass < 70 || input.mass > 120) errors.push('Egg mass must be between 70-120g (typical Skua range)')
  if (input.kv < 0.1 || input.kv > 1.0) errors.push('Kv constant must be between 0.1-1.0')
  
  // Check species type
  if (!['arctic', 'great'].includes(input.speciesType)) {
    errors.push('Species type must be either "arctic" or "great"')
  }
  
  // Pre-calculate density to check if it will work with the formula
  if (errors.length === 0) {
    try {
      const volumeMm3 = input.kv * input.length * Math.pow(input.breadth, 2)
      const volumeCm3 = volumeMm3 / 1000
      const density = input.mass / volumeCm3
      
      // Check if density is in reasonable range
      if (density < 0.5 || density > 1.5) {
        errors.push('Calculated egg density is outside reasonable range (0.5-1.5 g/cm³)')
      }
      
      // Check if quadratic equation will have valid solutions
      const formula = SPECIES_FORMULAS[input.speciesType]
      const { a, b, c } = formula
      const discriminant = Math.pow(b, 2) - 4 * a * (c - density)
      if (discriminant < 0) {
        errors.push('Input parameters would result in invalid calculation (negative discriminant)')
      }
    } catch {
      errors.push('Input parameters are invalid for calculation')
    }
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
 * Get formula coefficients for debugging/testing
 */
export function getFormulaCoefficients() {
  return { ...SPECIES_FORMULAS }
} 