import { NextResponse } from 'next/server'

// Never cached: the point of this route is to report what is running right now.
export const dynamic = 'force-dynamic'

/**
 * Health endpoint, used by the Docker HEALTHCHECK and by build.sh to decide
 * whether a deploy succeeded. Reports the build identity so a deploy can be
 * verified from outside instead of assumed.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: process.env.APP_VERSION ?? 'unknown',
    commit: process.env.BUILD_COMMIT ?? 'unknown',
    buildTime: process.env.BUILD_TIME ?? 'unknown',
    environment: process.env.NEXT_PUBLIC_SITE_ENV ?? 'unknown',
    timestamp: new Date().toISOString(),
  })
}
