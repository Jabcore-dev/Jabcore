'use client'

import { useEffect, memo } from 'react'
import { usePathname } from 'next/navigation'

const ScrollToTop = memo(function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Use requestAnimationFrame for smoother scroll
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
  }, [pathname])

  return null
})

export default ScrollToTop
