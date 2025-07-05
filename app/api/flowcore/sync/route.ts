import '@/src/pathways/handlers'; // Import to register handlers
import { pathwaysRouter } from '@/src/pathways/pathways'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/flowcore/sync  
 * Webhook endpoint for Flowcore events using PathwaysRouter
 */
export async function POST(request: NextRequest) {
  try {
    if (!pathwaysRouter) {
      return NextResponse.json(
        { error: 'Flowcore not configured' },
        { status: 503 }
      )
    }

    // Get the secret from headers
    const secret = request.headers.get('x-secret') || ''

    // Parse the event from request body
    const event = await request.json()
    
    console.log('📦 Received Flowcore event:', { 
      eventType: event.eventType || 'unknown',
      eventId: event.eventId || 'unknown'
    })

    // Process the event through pathways router
    await pathwaysRouter.processEvent(event, secret)

    console.log(`✅ Event processed successfully`)
    return NextResponse.json({ 
      success: true,
      message: 'Event processed successfully' 
    })

  } catch (error) {
    console.error('❌ Sync endpoint error:', error)

    return NextResponse.json(
      { error: 'Failed to process event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/flowcore/sync
 * Health check endpoint
 */
export async function GET() {
  try {
    const config = {
      tenant: process.env.FLOWCORE_TENANT,
      pathwaysConfigured: !!pathwaysRouter,
      databaseConfigured: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      status: 'healthy',
      config,
      message: 'Flowcore sync endpoint is running'
    })

  } catch (error) {
    console.error('❌ Health check error:', error)
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    )
  }
} 