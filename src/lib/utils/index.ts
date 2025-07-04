import shortUuid from 'short-uuid'
import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a standard UUID
 */
export function generateId(): string {
  return uuidv4()
}

/**
 * Generate a short UUID for user-friendly IDs
 */
export function generateShortId(): string {
  return shortUuid.generate()
}

/**
 * Validate if a string is a valid UUID
 */
export function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Format a number to a specific number of decimal places
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals)
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Check if a value is within a valid range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Format a date to ISO string
 */
export function formatDateISO(date: Date): string {
  return date.toISOString()
}

/**
 * Parse a date from ISO string
 */
export function parseDateISO(dateString: string): Date {
  return new Date(dateString)
} 