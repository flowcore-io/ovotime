import { initializeDatabase, testConnection } from '@/src/database';
import "@/src/pathways/handlers"; // Import to register event handlers
import { initializePathways } from '@/src/pathways/pathways';

/**
 * Initialize the application
 * Run database initialization and pathways setup
 */
export const initializeApp = async () => {
  console.log('🚀 Initializing Ovotime application...')

  try {
    // Test database connection first
    const dbConnected = await testConnection()
    if (!dbConnected) {
      throw new Error('Database connection failed')
    }

    // Initialize database tables
    console.log('📊 Initializing database tables...')
    const dbInitialized = await initializeDatabase()
    if (!dbInitialized) {
      throw new Error('Database initialization failed')
    }

    // Initialize Flowcore pathways
    console.log('🔄 Initializing Flowcore pathways...')
    const pathwaysInitialized = await initializePathways()
    if (!pathwaysInitialized) {
      console.warn('⚠️  Flowcore pathways not fully initialized - running in local mode')
    }

    console.log('✅ Ovotime application initialized successfully!')
    return true

  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    return false
  }
}

/**
 * Health check for application services
 */
export async function healthCheck() {
  try {
    const dbHealth = await testConnection()
    
    return {
      status: "healthy",
      services: {
        database: dbHealth ? "connected" : "disconnected",
        pathways: "initialized", // Always true after startup
        environment: process.env.NODE_ENV || "development"
      },
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    }
    
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }
  }
}

// Initialize on import for serverless environments
if (typeof window === 'undefined') {
  // Only run on server side
  let initialized = false
  
  const ensureInitialized = async () => {
    if (!initialized) {
      await initializeApp()
      initialized = true
    }
  }
  
  // Initialize immediately
  ensureInitialized().catch(console.error)
} 