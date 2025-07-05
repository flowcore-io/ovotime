import { Pool } from 'pg'

/**
 * Database connection configuration
 */
const connectionString = process.env.DATABASE_URL || "postgresql://ovotime:ovotime_dev@localhost:5432/ovotime"

// Create the connection pool
export const pool = new Pool({
  connectionString,
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 20000, // Close idle connections after 20 seconds
  connectionTimeoutMillis: 30000, // Connection timeout
})

/**
 * Close the database connection
 */
export const closeConnection = async () => {
  await pool.end()
}

/**
 * Test the database connection
 */
export const testConnection = async () => {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1 as test')
    client.release()
    console.log("✅ Database connection successful")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

/**
 * Helper function to create enum if it doesn't exist
 */
async function createEnumIfNotExists(client: any, enumName: string, values: string[]) {
  try {
    const result = await client.query(
      "SELECT 1 FROM pg_type WHERE typname = $1",
      [enumName]
    )
    
    if (result.rows.length === 0) {
      const valuesStr = values.map(v => `'${v}'`).join(', ')
      await client.query(`CREATE TYPE ${enumName} AS ENUM (${valuesStr})`)
      console.log(`✅ Created enum type: ${enumName}`)
    } else {
      console.log(`ℹ️  Enum type ${enumName} already exists`)
    }
  } catch (error) {
    console.error(`❌ Failed to create enum ${enumName}:`, error)
    throw error
  }
}

/**
 * Initialize database tables if they don't exist
 */
export const initializeDatabase = async () => {
  const client = await pool.connect()
  
  try {
    console.log("📊 Creating database enums...")
    
    // Create enums
    await createEnumIfNotExists(client, 'species_type', ['arctic', 'great'])
    await createEnumIfNotExists(client, 'session_status', ['active', 'completed', 'cancelled', 'archived'])
    await createEnumIfNotExists(client, 'export_format', ['csv', 'json', 'xlsx'])

    console.log("📊 Creating database tables...")

    // Create sessions table first (referenced by other tables)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_name VARCHAR(255) NOT NULL,
        researcher_id VARCHAR(255) NOT NULL,
        start_location JSONB,
        expected_duration INTEGER,
        research_goals TEXT,
        measurement_count INTEGER NOT NULL DEFAULT 0,
        status session_status NOT NULL DEFAULT 'active',
        archived BOOLEAN NOT NULL DEFAULT false,
        archived_by VARCHAR(255),
        archive_reason TEXT,
        archived_at TIMESTAMP,
        started_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Create measurements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS measurements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id),
        species_type species_type NOT NULL,
        length DECIMAL(6,2) NOT NULL,
        breadth DECIMAL(6,2) NOT NULL,
        mass DECIMAL(8,3) NOT NULL,
        kv DECIMAL(4,3) NOT NULL,
        latitude DECIMAL(10,7),
        longitude DECIMAL(11,7),
        site_name VARCHAR(255),
        researcher_notes TEXT,
        archived BOOLEAN NOT NULL DEFAULT false,
        archived_by VARCHAR(255),
        archive_reason TEXT,
        archived_at TIMESTAMP,
        submitted_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Create predictions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        measurement_id UUID NOT NULL REFERENCES measurements(id),
        tbh DECIMAL(6,2) NOT NULL,
        egg_density DECIMAL(8,4) NOT NULL,
        egg_volume DECIMAL(8,4) NOT NULL,
        confidence DECIMAL(4,3) NOT NULL,
        species_type species_type NOT NULL,
        formula_name VARCHAR(50) NOT NULL,
        formula_version VARCHAR(10) NOT NULL,
        formula_coefficients JSONB,
        calculated_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Create session exports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_exports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES sessions(id),
        export_format export_format NOT NULL,
        exported_by VARCHAR(255) NOT NULL,
        export_options JSONB,
        file_size INTEGER,
        download_url VARCHAR(500),
        exported_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Create validation errors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS validation_errors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        measurement_id UUID REFERENCES measurements(id),
        error_type VARCHAR(50) NOT NULL,
        error_message TEXT NOT NULL,
        field_name VARCHAR(50),
        field_value TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Create event log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(100) NOT NULL,
        aggregate_id UUID NOT NULL,
        event_data JSONB,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    console.log("📊 Creating database indexes...")

    // Create indexes for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_measurements_session_id ON measurements(session_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_predictions_measurement_id ON predictions(measurement_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_session_exports_session_id ON session_exports(session_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_validation_errors_measurement_id ON validation_errors(measurement_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_event_log_aggregate_id ON event_log(aggregate_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_event_log_event_type ON event_log(event_type);')

    console.log("✅ Database initialized successfully")
    return true
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    return false
  } finally {
    client.release()
  }
} 