import { testConnection } from "@/src/database"
import "@/src/pathways/handlers"; // Import to register event handlers
import { initializePathways } from "@/src/pathways/pathways"

/**
 * Initialize application services
 */
export async function initializeApplication() {
  console.log("🚀 Initializing Ovotime application...")
  
  try {
    // Test database connection
    console.log("📊 Testing database connection...")
    const dbConnected = await testConnection()
    
    if (!dbConnected) {
      console.warn("⚠️  Database connection failed - some features may not work")
    }
    
    // Initialize Flowcore pathways
    console.log("🔄 Initializing Flowcore pathways...")
    const pathwaysInitialized = await initializePathways()
    
    if (pathwaysInitialized) {
      console.log("✅ Application initialized successfully with Flowcore")
    } else {
      console.log("⚠️  Application initialized in local mode (without Flowcore)")
    }
    
    return {
      database: dbConnected,
      pathways: pathwaysInitialized,
      success: true
    }
    
  } catch (error) {
    console.error("❌ Failed to initialize application:", error)
    return {
      database: false,
      pathways: false,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
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
      await initializeApplication()
      initialized = true
    }
  }
  
  // Initialize immediately
  ensureInitialized().catch(console.error)
} 