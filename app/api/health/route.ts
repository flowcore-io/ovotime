import { healthCheck } from '@/src/lib/startup'
import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * Application health check endpoint
 */
export async function GET() {
  try {
    const health = await healthCheck()
    
    const statusCode = health.status === 'healthy' ? 200 : 503
    
    return NextResponse.json(health, { status: statusCode })
    
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 