import { NextResponse } from 'next/server'

/**
 * Health check endpoint for the frontend
 * Used by the backend to verify frontend is operational
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'frontend',
    version: '0.1.0',
  })
}

