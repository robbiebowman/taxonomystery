"use client"

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('theme') as Theme | null)
      const current: Theme = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      document.documentElement.dataset.theme = current
      setTheme(current)
    } catch {
      setTheme('light')
    }
  }, [])

  const toggle = () => {
    const next: Theme = (theme === 'dark') ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch {}
    setTheme(next)
  }

  // Render nothing until hydrated to avoid mismatch
  if (!theme) return null

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="button"
      style={{
        fontSize: '0.8rem',
        padding: '0.4rem 0.8rem',
        background: 'var(--newsprint-gray)',
        color: 'var(--text-gray)',
        borderColor: 'var(--border-gray)'
      }}
    >
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  )
}

