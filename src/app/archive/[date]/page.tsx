'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GameComponent from '@/components/GameComponent'

interface ArchiveGamePageProps {
  params: Promise<{ date: string }>
}

export default function ArchiveGamePage({ params }: ArchiveGamePageProps) {
  const [date, setDate] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  
  // Load date from params
  useEffect(() => {
    async function loadDate() {
      try {
        const resolvedParams = await params
        const puzzleDate = resolvedParams.date
        setDate(puzzleDate)
        
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(puzzleDate)) {
          setError('Invalid date format. Please use YYYY-MM-DD.')
        }
      } catch {
        setError('Failed to load date parameter')
      }
    }
    
    loadDate()
  }, [params])

  // Handle validation errors
  if (error) {
    return (
      <div className="newspaper-section" style={{ margin: '2rem auto', maxWidth: '800px' }}>
        <h1>📰 Archive Issue!</h1>
        <p>{error}</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/archive" className="button">
            ← Return to Archive
          </Link>
          <button onClick={() => window.location.reload()} className="button">
            Refresh Edition
          </button>
        </div>
      </div>
    )
  }

  // Wait for date to be loaded
  if (!date) {
    return <div>Loading...</div>
  }

  return <GameComponent puzzleDate={date} isArchive={true} />
}