import { NextResponse } from 'next/server'

/**
 * Health check endpoint for the application frontend
 * Used by the dashboard to verify the app is operational
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'app-frontend',
    version: '0.1.0',
  })
}

