import { Pool } from 'pg'

/**
 * Test Neon database connection with detailed diagnostics
 * Usage: npx tsx scripts/test-neon-connection.ts
 */

async function testNeonConnection() {
  console.log('🔍 Testing Neon Database Connection...\n')

  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable not set')
    console.log('💡 Set your Neon connection string:')
    console.log('   export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"')
    process.exit(1)
  }

  // Parse connection string for diagnostics
  try {
    const url = new URL(connectionString)
    console.log('🔗 Connection Details:')
    console.log(`   Host: ${url.hostname}`)
    console.log(`   Database: ${url.pathname.slice(1)}`)
    console.log(`   User: ${url.username}`)
    console.log(`   SSL: ${url.searchParams.get('sslmode') || 'not specified'}`)
    console.log()
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format')
    console.log('💡 Expected format: postgresql://user:pass@host/db?sslmode=require')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString,
    max: 1, // Single connection for testing
    connectionTimeoutMillis: 10000, // 10 second timeout
  })

  try {
    console.log('⏳ Connecting to Neon...')
    const client = await pool.connect()
    
    // Test basic query
    console.log('✅ Connected! Testing basic query...')
    const result = await client.query('SELECT NOW() as current_time, version() as db_version')
    console.log(`   Time: ${result.rows[0].current_time}`)
    console.log(`   Version: ${result.rows[0].db_version.split(' ').slice(0, 2).join(' ')}`)
    
    // Test schema access
    console.log('\n🗃️  Testing schema access...')
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    if (tablesResult.rows.length > 0) {
      console.log('   Existing tables:')
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`)
      })
    } else {
      console.log('   No tables found (empty database)')
    }

    // Test write permissions
    console.log('\n✍️  Testing write permissions...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS neon_test_table (
        id SERIAL PRIMARY KEY,
        test_data TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    await client.query(`
      INSERT INTO neon_test_table (test_data) 
      VALUES ('Connection test successful')
    `)
    
    const testResult = await client.query(
      'SELECT COUNT(*) as count FROM neon_test_table'
    )
    console.log(`   Test records: ${testResult.rows[0].count}`)
    
    // Cleanup test table
    await client.query('DROP TABLE IF EXISTS neon_test_table')
    
    client.release()
    
    console.log('\n🎉 Neon connection test passed!')
    console.log('💡 Your database is ready for deployment to Vercel')
    
  } catch (error) {
    console.error('\n❌ Connection test failed:')
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.error('   Connection timeout - check your network or Neon status')
      } else if (error.message.includes('authentication')) {
        console.error('   Authentication failed - check username/password')
      } else if (error.message.includes('ENOTFOUND')) {
        console.error('   Host not found - check hostname in connection string')
      } else if (error.message.includes('ssl')) {
        console.error('   SSL connection issue - ensure ?sslmode=require is in URL')
      } else {
        console.error(`   ${error.message}`)
      }
    }
    
    console.log('\n🔧 Troubleshooting tips:')
    console.log('   1. Verify your Neon project is active (not paused)')
    console.log('   2. Check connection string format and credentials')
    console.log('   3. Ensure ?sslmode=require is included in URL')
    console.log('   4. Try connecting from Neon console first')
    
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the test
testNeonConnection().catch(console.error) 