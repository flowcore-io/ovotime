import { closeConnection, initializeDatabase, testConnection } from '../src/database'

async function main() {
  console.log('🚀 Initializing database...')
  
  try {
    // Test connection first
    const connected = await testConnection()
    if (!connected) {
      console.error('❌ Database connection failed!')
      process.exit(1)
    }

    // Initialize tables
    const initialized = await initializeDatabase()
    if (initialized) {
      console.log('✅ Database initialization completed successfully!')
      process.exit(0)
    } else {
      console.error('❌ Database initialization failed!')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    process.exit(1)
  } finally {
    await closeConnection()
  }
}

main() 