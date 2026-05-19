import { NextResponse } from 'next/server'
import pkg from '../../../../package.json'

export async function GET() {
  const start = Date.now()

  return NextResponse.json({
    status: 'ok',
    app: 'postpilot',
    version: pkg.version,
    latency: Date.now() - start,
    timestamp: new Date().toISOString(),
    node: process.version,
  })
}
