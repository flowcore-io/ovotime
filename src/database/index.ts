import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

/**
 * Database connection configuration
 */
const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/ovotime"

// Create the connection
const client = postgres(connectionString)

// Create the database instance
export const db = drizzle(client)

/**
 * Close the database connection
 */
export const closeConnection = async () => {
  await client.end()
}

/**
 * Test the database connection
 */
export const testConnection = async () => {
  try {
    await client`SELECT 1`
    console.log("✅ Database connection successful")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
} 