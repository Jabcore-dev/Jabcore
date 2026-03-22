'use client'

import { CSSProperties, useEffect, useState } from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
    
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
