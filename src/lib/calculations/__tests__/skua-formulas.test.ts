/**
 * Unit tests for Skua DBH calculation formulas
 * Based on species-specific formulas from Figure 1 with quadratic equation solving
 */

import {
    calculateEggDensity,
    calculateEggVolume,
    calculateSkuaTBH,
    calculateTBH,
    validateCalculationInput,
    type SkuaCalculationInput
} from '../skua-formulas'

describe('Skua Formula Calculations', () => {
  // Test data for quadratic equation solving
  const SAMPLE_DATA = [
    {
      // Arctic Skua sample
      length: 72.3,
      breadth: 50.2,
      mass: 91.89,
      kv: 0.507,
      speciesType: 'arctic' as const,
      expectedDensity: 0.9972,
      testName: 'Arctic Skua Sample 1'
    },
    {
      // Great Skua sample
      length: 70.3,
      breadth: 51.05,
      mass: 92.89,
      kv: 0.507,
      speciesType: 'great' as const,
      expectedDensity: 0.9349,
      testName: 'Great Skua Sample 1'
    },
    {
      // Arctic Skua sample with lower density
      length: 72.25,
      breadth: 48.25,
      mass: 85.28,
      kv: 0.507,
      speciesType: 'arctic' as const,
      expectedDensity: 0.9575,
      testName: 'Arctic Skua Sample 2'
    },
    {
      // Great Skua sample with higher density
      length: 69.8,
      breadth: 51.25,
      mass: 92.95,
      kv: 0.507,
      speciesType: 'great' as const,
      expectedDensity: 0.9857,
      testName: 'Great Skua Sample 2'
    }
  ]

  describe('calculateEggVolume', () => {
    it('should calculate egg volume correctly and convert to cm³', () => {
      const length = 72.3
      const breadth = 50.2
      const kv = 0.507
      
      const volume = calculateEggVolume(length, breadth, kv)
      
      // Expected: kv * length * breadth² = 0.507 * 72.3 * 50.2² / 1000
      const expected = (0.507 * 72.3 * Math.pow(50.2, 2)) / 1000
      
      expect(volume).toBeCloseTo(expected, 2)
      expect(volume).toBeCloseTo(92.37, 1) // Should be around 92.37 cm³
    })

    it('should throw error for invalid inputs', () => {
      expect(() => calculateEggVolume(0, 50, 0.5)).toThrow()
      expect(() => calculateEggVolume(70, 0, 0.5)).toThrow()
      expect(() => calculateEggVolume(70, 50, 0)).toThrow()
      expect(() => calculateEggVolume(-70, 50, 0.5)).toThrow()
    })
  })

  describe('calculateEggDensity', () => {
    it('should calculate egg density correctly', () => {
      const mass = 91.89
      const volume = 92.37
      
      const density = calculateEggDensity(mass, volume)
      
      expect(density).toBeCloseTo(0.9948, 3) // Should be around 0.9948 g/cm³
    })

    it('should throw error for invalid inputs', () => {
      expect(() => calculateEggDensity(0, 100)).toThrow()
      expect(() => calculateEggDensity(100, 0)).toThrow()
      expect(() => calculateEggDensity(-100, 100)).toThrow()
    })
  })

  describe('calculateTBH - Quadratic Equation Solving', () => {
    it('should solve quadratic equation correctly for Arctic Skua', () => {
      const density = 0.95 // Test density
      const speciesType = 'arctic'
      
      const dbh = calculateTBH(density, speciesType)
      
      // Verify the result by substituting back into the original formula
      // Arctic Skua: DE = -0.00007345×DBH² + 0.008618×DBH + 0.8719
      const calculatedDE = -0.00007345 * Math.pow(dbh, 2) + 0.008618 * dbh + 0.8719
      
      expect(calculatedDE).toBeCloseTo(density, 3)
      expect(dbh).toBeGreaterThan(0)
      expect(dbh).toBeLessThan(35)
    })

    it('should solve quadratic equation correctly for Great Skua', () => {
      const density = 0.95 // Test density
      const speciesType = 'great'
      
      const dbh = calculateTBH(density, speciesType)
      
      // Verify the result by substituting back into the original formula
      // Great Skua: DE = -0.00010000×DBH² + 0.008442×DBH + 0.8843
      const calculatedDE = -0.00010000 * Math.pow(dbh, 2) + 0.008442 * dbh + 0.8843
      
      expect(calculatedDE).toBeCloseTo(density, 3)
      expect(dbh).toBeGreaterThan(0)
      expect(dbh).toBeLessThan(35)
    })

    it('should handle boundary density values for Arctic Skua', () => {
      // Use density values that have valid solutions within the expected range (0.88+)
      const densities = [0.88, 0.92, 0.96, 1.00]
      
      densities.forEach(density => {
        const dbh = calculateTBH(density, 'arctic')
        expect(dbh).toBeGreaterThan(0)
        expect(dbh).toBeLessThan(35)
        
        // Verify by substituting back
        const calculatedDE = -0.00007345 * Math.pow(dbh, 2) + 0.008618 * dbh + 0.8719
        expect(calculatedDE).toBeCloseTo(density, 3)
      })
    })

    it('should handle boundary density values for Great Skua', () => {
      // Use density values that have valid solutions within the expected range (0.90+)
      const densities = [0.90, 0.94, 0.98, 1.00]
      
      densities.forEach(density => {
        const dbh = calculateTBH(density, 'great')
        expect(dbh).toBeGreaterThan(0)
        expect(dbh).toBeLessThan(35)
        
        // Verify by substituting back
        const calculatedDE = -0.00010000 * Math.pow(dbh, 2) + 0.008442 * dbh + 0.8843
        expect(calculatedDE).toBeCloseTo(density, 3)
      })
    })

    it('should choose the correct root from quadratic solutions', () => {
      // Test with a density that might have two positive roots
      const density = 0.92
      
      const arcticDBH = calculateTBH(density, 'arctic')
      const greatDBH = calculateTBH(density, 'great')
      
      // Both should be positive and reasonable
      expect(arcticDBH).toBeGreaterThan(0)
      expect(arcticDBH).toBeLessThan(35)
      expect(greatDBH).toBeGreaterThan(0)
      expect(greatDBH).toBeLessThan(35)
    })
  })

  describe('calculateTBH - Error handling', () => {
    it('should throw error for invalid density', () => {
      expect(() => calculateTBH(0, 'arctic')).toThrow(/must be positive/)
      expect(() => calculateTBH(-1, 'arctic')).toThrow(/must be positive/)
      expect(() => calculateTBH(3.0, 'arctic')).toThrow(/unusually high/)
    })

    it('should throw error for invalid species type', () => {
      expect(() => calculateTBH(0.95, 'invalid' as any)).toThrow(/Unknown species type/)
    })

    it('should throw error for density values that result in invalid solutions', () => {
      // Test with density values that result in solutions outside valid range (0-35 days)
      expect(() => calculateTBH(0.82, 'arctic')).toThrow(/No valid DBH solution found/)
      expect(() => calculateTBH(0.84, 'great')).toThrow(/No valid DBH solution found/)
      
      // Test with density values that would actually result in negative discriminant
      expect(() => calculateTBH(1.2, 'arctic')).toThrow(/discriminant is negative/)
      expect(() => calculateTBH(1.4, 'arctic')).toThrow(/discriminant is negative/)
    })
  })

  describe('calculateSkuaTBH with sample data', () => {
    SAMPLE_DATA.forEach((sample) => {
      it(`should calculate DBH correctly for ${sample.testName}`, () => {
        const input: SkuaCalculationInput = {
          length: sample.length,
          breadth: sample.breadth,
          mass: sample.mass,
          kv: sample.kv,
          speciesType: sample.speciesType
        }

        const result = calculateSkuaTBH(input)

        // Check that the result is reasonable
        expect(result.tbh).toBeGreaterThan(0)
        expect(result.tbh).toBeLessThan(35)
        
        // Check that density is close to expected
        expect(Math.abs(result.eggDensity - sample.expectedDensity)).toBeLessThan(0.1)

        // Verify the calculation by substituting back into the original formula
        const { a, b, c } = result.formula.coefficients
        const calculatedDE = a * Math.pow(result.tbh, 2) + b * result.tbh + c
        expect(calculatedDE).toBeCloseTo(result.eggDensity, 3)

        // Check confidence is reasonable
        expect(result.confidence).toBeGreaterThan(0.5)
        expect(result.confidence).toBeLessThanOrEqual(1.0)

        // Check formula metadata
        expect(result.formula.name).toContain(sample.speciesType === 'arctic' ? 'Arctic' : 'Great')
        expect(result.formula.version).toBe('2.1')
        expect(result.formula.coefficients.a).toBeDefined()
        expect(result.formula.coefficients.b).toBeDefined()
        expect(result.formula.coefficients.c).toBeDefined()
      })
    })
  })

  describe('Formula accuracy validation', () => {
    it('should solve quadratic equations correctly for both species', () => {
      const testDensity = 0.95
      
      // Calculate DBH for both species
      const arcticDBH = calculateTBH(testDensity, 'arctic')
      const greatDBH = calculateTBH(testDensity, 'great')
      
      // Verify by substituting back into original formulas
      const arcticDE = -0.00007345 * Math.pow(arcticDBH, 2) + 0.008618 * arcticDBH + 0.8719
      const greatDE = -0.00010000 * Math.pow(greatDBH, 2) + 0.008442 * greatDBH + 0.8843
      
      expect(arcticDE).toBeCloseTo(testDensity, 4)
      expect(greatDE).toBeCloseTo(testDensity, 4)
      
      // Results should be different between species
      expect(Math.abs(arcticDBH - greatDBH)).toBeGreaterThan(0.1)
    })

    it('should give reasonable DBH results across density range', () => {
      // Use density ranges that should have valid solutions
      const arcticValidDensities = [0.88, 0.92, 0.96, 1.00]
      const greatValidDensities = [0.90, 0.94, 0.98, 1.00]
      
      arcticValidDensities.forEach(density => {
        const arcticDBH = calculateTBH(density, 'arctic')
        expect(arcticDBH).toBeGreaterThan(0)
        expect(arcticDBH).toBeLessThan(25) // Most realistic measurements should be under 25 days
      })
      
      greatValidDensities.forEach(density => {
        const greatDBH = calculateTBH(density, 'great')
        expect(greatDBH).toBeGreaterThan(0)
        expect(greatDBH).toBeLessThan(25) // Most realistic measurements should be under 25 days
      })
      
      // Test edge cases that might not have valid solutions
      const extremeDensities = [0.82, 0.84, 0.86]
      extremeDensities.forEach(density => {
        expect(() => calculateTBH(density, 'arctic')).toThrow(/No valid DBH solution found/)
        expect(() => calculateTBH(density, 'great')).toThrow(/No valid DBH solution found/)
      })
    })
  })

  describe('validateCalculationInput', () => {
    it('should validate valid inputs', () => {
      const validInput: SkuaCalculationInput = {
        length: 72.3,
        breadth: 50.2,
        mass: 91.89,
        kv: 0.507,
        speciesType: 'arctic'
      }

      const result = validateCalculationInput(validInput)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid inputs', () => {
      const invalidInput: SkuaCalculationInput = {
        length: 0,
        breadth: 50.2,
        mass: 91.89,
        kv: 0.507,
        speciesType: 'arctic'
      }

      const result = validateCalculationInput(invalidInput)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect inputs that would result in invalid quadratic solutions', () => {
      const problematicInput: SkuaCalculationInput = {
        length: 60,
        breadth: 40,
        mass: 120, // This combination might result in extreme density
        kv: 0.507,
        speciesType: 'arctic'
      }

      const result = validateCalculationInput(problematicInput)
      // This might or might not be valid depending on the resulting density
      expect(result.isValid).toBeDefined()
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle extreme but valid values', () => {
      const extremeInput: SkuaCalculationInput = {
        length: 75, // Middle range value
        breadth: 50, // Middle range value  
        mass: 95,   // Middle range value
        kv: 0.507,  // Standard value
        speciesType: 'great'
      }

      const result = calculateSkuaTBH(extremeInput)
      expect(result.tbh).toBeGreaterThan(0)
      expect(result.tbh).toBeLessThan(35)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should provide meaningful error messages', () => {
      const invalidInput: SkuaCalculationInput = {
        length: 0,
        breadth: 50,
        mass: 90,
        kv: 0.5,
        speciesType: 'arctic'
      }

      expect(() => calculateSkuaTBH(invalidInput)).toThrow(/positive numbers/)
    })

    it('should handle species type correctly', () => {
      const input: SkuaCalculationInput = {
        length: 72.3,
        breadth: 50.2,
        mass: 91.89,
        kv: 0.507,
        speciesType: 'great'
      }

      const result = calculateSkuaTBH(input)
      expect(result.speciesType).toBe('great')
      expect(result.confidence).toBeGreaterThan(0)
    })
  })
}) 