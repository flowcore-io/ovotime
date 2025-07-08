import { isInRange } from '../utils';

/**
 * Validation rules for egg measurements based on actual Skua research data
 */
export const VALIDATION_RULES = {
  EGG_LENGTH: { 
    min: 60, max: 85,           // mm - typical range 67-79mm from research data
    typical: { min: 67, max: 79 }
  }, 
  EGG_BREADTH: { 
    min: 40, max: 60,           // mm - typical range 47-53mm from research data  
    typical: { min: 47, max: 53 }
  },
  EGG_MASS: { 
    min: 70, max: 120,          // g - typical range 80-105g from research data
    typical: { min: 80, max: 105 }
  },
  KV_CONSTANT: { min: 0.1, max: 1.0 }, // egg-shape constant
  LATITUDE: { min: -90, max: 90 }, // degrees
  LONGITUDE: { min: -180, max: 180 }, // degrees
  SITE_NAME: { minLength: 1, maxLength: 255 },
  SESSION_NAME: { minLength: 1, maxLength: 255 },
  RESEARCHER_NOTES: { maxLength: 1000 }
}

/**
 * Validate egg length measurement
 */
export function validateEggLength(length: number): { isValid: boolean; error?: string; warning?: string } {
  if (typeof length !== 'number' || isNaN(length)) {
    return { isValid: false, error: 'Egg length must be a valid number' }
  }
  
  if (!isInRange(length, VALIDATION_RULES.EGG_LENGTH.min, VALIDATION_RULES.EGG_LENGTH.max)) {
    return { 
      isValid: false, 
      error: `Egg length must be between ${VALIDATION_RULES.EGG_LENGTH.min}-${VALIDATION_RULES.EGG_LENGTH.max}mm (typical Skua range: ${VALIDATION_RULES.EGG_LENGTH.typical.min}-${VALIDATION_RULES.EGG_LENGTH.typical.max}mm)` 
    }
  }
  
  // Warning for values outside typical range but within bounds
  if (!isInRange(length, VALIDATION_RULES.EGG_LENGTH.typical.min, VALIDATION_RULES.EGG_LENGTH.typical.max)) {
    return { 
      isValid: true, 
      warning: `Length ${length}mm is outside typical Skua range (${VALIDATION_RULES.EGG_LENGTH.typical.min}-${VALIDATION_RULES.EGG_LENGTH.typical.max}mm). Please verify measurement.`
    }
  }
  
  return { isValid: true }
}

/**
 * Validate egg breadth measurement
 */
export function validateEggBreadth(breadth: number): { isValid: boolean; error?: string; warning?: string } {
  if (typeof breadth !== 'number' || isNaN(breadth)) {
    return { isValid: false, error: 'Egg breadth must be a valid number' }
  }
  
  if (!isInRange(breadth, VALIDATION_RULES.EGG_BREADTH.min, VALIDATION_RULES.EGG_BREADTH.max)) {
    return { 
      isValid: false, 
      error: `Egg breadth must be between ${VALIDATION_RULES.EGG_BREADTH.min}-${VALIDATION_RULES.EGG_BREADTH.max}mm (typical Skua range: ${VALIDATION_RULES.EGG_BREADTH.typical.min}-${VALIDATION_RULES.EGG_BREADTH.typical.max}mm)` 
    }
  }
  
  // Warning for values outside typical range but within bounds
  if (!isInRange(breadth, VALIDATION_RULES.EGG_BREADTH.typical.min, VALIDATION_RULES.EGG_BREADTH.typical.max)) {
    return { 
      isValid: true, 
      warning: `Breadth ${breadth}mm is outside typical Skua range (${VALIDATION_RULES.EGG_BREADTH.typical.min}-${VALIDATION_RULES.EGG_BREADTH.typical.max}mm). Please verify measurement.`
    }
  }
  
  return { isValid: true }
}

/**
 * Validate egg mass measurement
 */
export function validateEggMass(mass: number): { isValid: boolean; error?: string; warning?: string } {
  if (typeof mass !== 'number' || isNaN(mass)) {
    return { isValid: false, error: 'Egg mass must be a valid number' }
  }
  
  if (!isInRange(mass, VALIDATION_RULES.EGG_MASS.min, VALIDATION_RULES.EGG_MASS.max)) {
    return { 
      isValid: false, 
      error: `Egg mass must be between ${VALIDATION_RULES.EGG_MASS.min}-${VALIDATION_RULES.EGG_MASS.max}g (typical Skua range: ${VALIDATION_RULES.EGG_MASS.typical.min}-${VALIDATION_RULES.EGG_MASS.typical.max}g)` 
    }
  }
  
  // Warning for values outside typical range but within bounds
  if (!isInRange(mass, VALIDATION_RULES.EGG_MASS.typical.min, VALIDATION_RULES.EGG_MASS.typical.max)) {
    return { 
      isValid: true, 
      warning: `Mass ${mass}g is outside typical Skua range (${VALIDATION_RULES.EGG_MASS.typical.min}-${VALIDATION_RULES.EGG_MASS.typical.max}g). Please verify measurement.`
    }
  }
  
  return { isValid: true }
}

/**
 * Validate Kv constant
 */
export function validateKvConstant(kv: number): { isValid: boolean; error?: string } {
  if (typeof kv !== 'number' || isNaN(kv)) {
    return { isValid: false, error: 'Kv constant must be a valid number' }
  }
  
  if (!isInRange(kv, VALIDATION_RULES.KV_CONSTANT.min, VALIDATION_RULES.KV_CONSTANT.max)) {
    return { 
      isValid: false, 
      error: `Kv constant must be between ${VALIDATION_RULES.KV_CONSTANT.min} and ${VALIDATION_RULES.KV_CONSTANT.max}` 
    }
  }
  
  return { isValid: true }
}

/**
 * Validate species type
 */
export function validateSpeciesType(species: string): { isValid: boolean; error?: string } {
  const validSpecies = ['arctic', 'great']
  
  if (!validSpecies.includes(species)) {
    return { 
      isValid: false, 
      error: `Species must be one of: ${validSpecies.join(', ')}` 
    }
  }
  
  return { isValid: true }
}

/**
 * Validate GPS coordinates
 */
export function validateCoordinates(latitude?: number, longitude?: number): { isValid: boolean; error?: string } {
  if (latitude !== undefined) {
    if (typeof latitude !== 'number' || isNaN(latitude)) {
      return { isValid: false, error: 'Latitude must be a valid number' }
    }
    
    if (!isInRange(latitude, VALIDATION_RULES.LATITUDE.min, VALIDATION_RULES.LATITUDE.max)) {
      return { 
        isValid: false, 
        error: `Latitude must be between ${VALIDATION_RULES.LATITUDE.min} and ${VALIDATION_RULES.LATITUDE.max} degrees` 
      }
    }
  }
  
  if (longitude !== undefined) {
    if (typeof longitude !== 'number' || isNaN(longitude)) {
      return { isValid: false, error: 'Longitude must be a valid number' }
    }
    
    if (!isInRange(longitude, VALIDATION_RULES.LONGITUDE.min, VALIDATION_RULES.LONGITUDE.max)) {
      return { 
        isValid: false, 
        error: `Longitude must be between ${VALIDATION_RULES.LONGITUDE.min} and ${VALIDATION_RULES.LONGITUDE.max} degrees` 
      }
    }
  }
  
  return { isValid: true }
}

/**
 * Validate site name
 */
export function validateSiteName(siteName: string): { isValid: boolean; error?: string } {
  if (siteName.length < VALIDATION_RULES.SITE_NAME.minLength) {
    return { isValid: false, error: 'Site name cannot be empty' }
  }
  
  if (siteName.length > VALIDATION_RULES.SITE_NAME.maxLength) {
    return { 
      isValid: false, 
      error: `Site name must be less than ${VALIDATION_RULES.SITE_NAME.maxLength} characters` 
    }
  }
  
  return { isValid: true }
}

/**
 * Validate complete egg measurement data
 */
export function validateEggMeasurement(data: {
  length: number
  breadth: number
  mass: number
  kv: number
  speciesType: string
  observationDateTime?: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate measurements
  const lengthResult = validateEggLength(data.length)
  if (!lengthResult.isValid && lengthResult.error) {
    errors.push(lengthResult.error)
  }
  
  const breadthResult = validateEggBreadth(data.breadth)
  if (!breadthResult.isValid && breadthResult.error) {
    errors.push(breadthResult.error)
  }
  
  const massResult = validateEggMass(data.mass)
  if (!massResult.isValid && massResult.error) {
    errors.push(massResult.error)
  }
  
  const kvResult = validateKvConstant(data.kv)
  if (!kvResult.isValid && kvResult.error) {
    errors.push(kvResult.error)
  }
  
  const speciesResult = validateSpeciesType(data.speciesType)
  if (!speciesResult.isValid && speciesResult.error) {
    errors.push(speciesResult.error)
  }
  
  // Note: observationDateTime validation could be added here if needed
  // Currently we accept any valid ISO datetime string or undefined
  
  return {
    isValid: errors.length === 0,
    errors
  }
} 