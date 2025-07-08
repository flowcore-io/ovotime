'use client'

import { useCallback, useEffect, useState } from 'react'

interface MeasurementSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  placeholder?: string
  helperText?: string
  typicalRange?: { min: number; max: number }
  onChange: (value: number) => void
  error?: string
  className?: string
  disabled?: boolean
}

export default function MeasurementSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  placeholder,
  helperText,
  typicalRange,
  onChange,
  error,
  className = '',
  disabled = false
}: MeasurementSliderProps) {
  // Helper function to format values for display
  const getFormattedValue = (val: number, stepSize: number) => {
    if (val === 0) return ''
    
    // Determine decimal places based on step size
    let decimalPlaces = 0
    if (stepSize >= 1) {
      decimalPlaces = 0
    } else if (stepSize >= 0.1) {
      decimalPlaces = 1  // For mass measurements (step 0.1), always show 1 decimal
    } else if (stepSize >= 0.01) {
      decimalPlaces = 2
    } else {
      decimalPlaces = 3  // For Kv constant (step 0.001)
    }
    
    return val.toFixed(decimalPlaces)
  }

  // Format value for display with appropriate decimal places
  const formatDisplayValue = useCallback((val: number) => {
    return getFormattedValue(val, step)
  }, [step])

  const [displayValue, setDisplayValue] = useState(() => getFormattedValue(value, step))
  const [isFocused, setIsFocused] = useState(false)

  // Update display value when prop value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDisplayValue(value))
    }
  }, [value, isFocused, formatDisplayValue])

  // Handle slider change
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onChange(newValue)
    setDisplayValue(formatDisplayValue(newValue))
  }, [onChange, formatDisplayValue])

  // Handle text input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    // Only update the parent value if it's a valid number
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue)
    } else if (inputValue === '') {
      onChange(0)
    }
  }, [onChange, min, max])

  // Handle input blur to validate and correct value
  const handleInputBlur = useCallback(() => {
    setIsFocused(false)
    const numValue = parseFloat(displayValue)
    
    if (isNaN(numValue) || displayValue === '') {
      setDisplayValue(formatDisplayValue(value))
    } else if (numValue < min) {
      onChange(min)
      setDisplayValue(formatDisplayValue(min))
    } else if (numValue > max) {
      onChange(max)
      setDisplayValue(formatDisplayValue(max))
    } else {
      onChange(numValue)
      setDisplayValue(formatDisplayValue(numValue))
    }
  }, [displayValue, value, min, max, onChange, formatDisplayValue])

  // Calculate position for typical range indicator
  const getPositionPercentage = (val: number) => {
    return ((val - min) / (max - min)) * 100
  }

  const isValueInTypicalRange = typicalRange && value >= typicalRange.min && value <= typicalRange.max

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {label} *
        </label>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>

      {/* Slider Container */}
      <div className="relative py-2">
        {/* Typical Range Background */}
        {typicalRange && (
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 h-2 bg-green-200 rounded-full pointer-events-none z-10"
            style={{
              left: `${getPositionPercentage(typicalRange.min)}%`,
              width: `${getPositionPercentage(typicalRange.max) - getPositionPercentage(typicalRange.min)}%`
            }}
          />
        )}

        {/* Range Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          className={`
            w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer relative z-20
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'error' : ''}
          `}
        />
      </div>

      {/* Range Labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        {typicalRange && (
          <span className="text-green-600 font-medium">
            Typical: {typicalRange.min}–{typicalRange.max}
          </span>
        )}
        <span>{max}</span>
      </div>

      {/* Text Input */}
      <div className="flex items-center space-x-2">
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleInputBlur}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
          `}
          placeholder={placeholder}
        />
        
        {/* Value Status Indicator */}
        <div className="flex items-center space-x-1">
          {value > 0 && (
            <div 
              className={`w-3 h-3 rounded-full ${
                isValueInTypicalRange 
                  ? 'bg-green-500' 
                  : 'bg-yellow-500'
              }`} 
              title={
                isValueInTypicalRange 
                  ? 'Value is within typical range' 
                  : 'Value is outside typical range'
              } 
            />
          )}
          <span className="text-sm text-gray-600 min-w-[60px] text-right font-mono">
            {value > 0 ? value.toFixed(step < 1 ? 1 : 0) : '—'}
          </span>
        </div>
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
} 