'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PuzzleListItem {
  date: string
  article_count: number
  created_at: string
}

interface PuzzlesResponse {
  success: boolean
  puzzles?: PuzzleListItem[]
  error?: string
}

// Function to format date for display
function formatDate(dateString: string): string {
  // Parse as local date to display the same calendar date everywhere
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month is 0-indexed
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Function to get relative time
function getRelativeTime(dateString: string): string {
  // Parse as local date for consistent calendar date comparison
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month is 0-indexed
  const now = new Date()
  
  // Compare dates at midnight to avoid time-of-day issues
  const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const nowAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const diffTime = nowAtMidnight.getTime() - dateAtMidnight.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

export default function ArchivePage() {
  const [puzzles, setPuzzles] = useState<PuzzleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch available puzzles on component mount
  useEffect(() => {
    async function fetchPuzzles() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/puzzles/list')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch puzzles: ${response.status}`)
        }
        
        const data: PuzzlesResponse = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch puzzles')
        }
        
        setPuzzles(data.puzzles || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load puzzles')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPuzzles()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div>
        <h1>Loading puzzle archive...</h1>
        <p>Please wait while we fetch all available puzzles.</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div>
        <h1>Oops!</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
        <br /><br />
        <Link href="/game">← Back to Today&apos;s Puzzle</Link>
      </div>
    )
  }

  // No puzzles available
  if (puzzles.length === 0) {
    return (
      <div>
        <h1>Puzzle Archive</h1>
        <p>No puzzles are available yet. Check back after some puzzles have been created!</p>
        <Link href="/game">← Back to Today&apos;s Puzzle</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <header>
        <h1>Puzzle Archive</h1>
        <p>Browse and play previous Taxonomy Mystery puzzles</p>
        <Link href="/game" style={{ 
          display: 'inline-block', 
          marginBottom: '20px',
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          ← Back to Today&apos;s Puzzle
        </Link>
      </header>

      {/* Puzzle Grid */}
      <section>
        <h2>Available Puzzles ({puzzles.length})</h2>
        <div style={{ 
          display: 'grid', 
          gap: '15px', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          marginTop: '20px'
        }}>
          {puzzles.map((puzzle) => (
            <Link 
              key={puzzle.date}
              href={`/archive/${puzzle.date}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef'
                e.currentTarget.style.borderColor = '#007bff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
                e.currentTarget.style.borderColor = '#ccc'
              }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '10px'
                }}>
                  <h3 style={{ margin: 0, color: '#007bff' }}>
                    {formatDate(puzzle.date)}
                  </h3>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#6c757d',
                    fontWeight: 'normal'
                  }}>
                    {getRelativeTime(puzzle.date)}
                  </span>
                </div>
                
                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Articles:</strong> {puzzle.article_count}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Date:</strong> {puzzle.date}
                  </p>
                </div>
                
                <div style={{ 
                  marginTop: '15px', 
                  padding: '8px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  Play Puzzle →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Alternative List View for smaller screens */}
      <section style={{ marginTop: '40px' }}>
        <h3>Quick List View</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {puzzles.map((puzzle) => (
            <Link 
              key={`list-${puzzle.date}`}
              href={`/archive/${puzzle.date}`}
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'block',
                padding: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                backgroundColor: '#ffffff'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div>
                  <strong>{formatDate(puzzle.date)}</strong>
                  <span style={{ marginLeft: '10px', color: '#6c757d' }}>
                    ({puzzle.article_count} articles)
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {getRelativeTime(puzzle.date)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}