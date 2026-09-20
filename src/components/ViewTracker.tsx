'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Reports one page view.
 *
 * sendBeacon rather than fetch: it survives the visitor navigating away
 * immediately, and it never delays the page. Failures are ignored on purpose -
 * a counter must not be able to break a page.
 */
export default function ViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const payload = JSON.stringify({ path: pathname })

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/view', new Blob([payload], { type: 'application/json' }))
      } else {
        // Safari below 15 and a few embedded browsers.
        void fetch('/api/view', {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // Blocked by an extension, or a browser that does neither.
    }
  }, [pathname])

  return null
}
