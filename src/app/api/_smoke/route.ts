import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  const checks = {
    timestamp: new Date().toISOString(),
    runtime: process.version,
    env_bug_reporter_url_set: Boolean(
      process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_URL
    ),
    elapsed_ms: Date.now() - start,
  }
  return NextResponse.json({ ok: true, ...checks })
}
