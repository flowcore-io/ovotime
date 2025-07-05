import '@/src/pathways/handlers'; // Import to register handlers
import { pathwaysRouter } from '@/src/pathways/pathways';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/flowcore/transformer
 * Webhook endpoint for Flowcore events following the official documentation pattern
 * 
 * @see https://docs.flowcore.io/guides/5-minute-tutorial/5-min-tutorial/#step-2-create-an-http-server
 */
export async function POST(request: NextRequest) {
  try {
    if (!pathwaysRouter) {
      console.error('❌ Flowcore not configured')
      return new Response('Flowcore not configured', { status: 503 })
    }

    // Get the event from request body
    const event = await request.json()
    
    // Get the secret from headers (following Flowcore documentation)
    const headerSecret = request.headers.get('x-secret')
    const expectedSecret = process.env.OVOTIME_API_KEY || "development-key-123"
    
    // For local development, be more flexible with secret validation
    const isLocalDev = process.env.NODE_ENV === 'development'
    const secret = isLocalDev ? expectedSecret : (headerSecret ?? '')

    console.log('📦 Received Flowcore event:', {
      eventType: event.eventType || 'unknown',
      eventId: event.eventId || 'unknown',
      secretProvided: !!headerSecret,
      isLocalDev
    })

    // Process the event using pathways router
    await pathwaysRouter.processEvent(event, secret)

    console.log('✅ Event processed successfully')
    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })

  } catch (error) {
    console.error('❌ Error processing Flowcore event:', error)
    
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * GET /api/flowcore/transformer
 * Health check for the transformer endpoint
 */
export async function GET() {
  try {
    const status = {
      status: 'healthy',
      pathwaysConfigured: !!pathwaysRouter,
      tenant: process.env.FLOWCORE_TENANT,
      timestamp: new Date().toISOString(),
      endpoint: 'POST /api/flowcore/transformer',
      environment: process.env.NODE_ENV,
      secretConfigured: !!process.env.OVOTIME_API_KEY
    }

    return NextResponse.json(status)

  } catch (error) {
    console.error('❌ Transformer health check error:', error)
    
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 