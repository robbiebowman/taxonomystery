'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllStoredScores, getUserStats, hasAttemptedPuzzle, hasPartialAttempt, hasCompletedPuzzle, type StoredScore } from '../../../lib/localStorage'
import ScoreBadge from '../../components/ScoreBadge'

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

type FilterType = 'all' | 'completed' | 'partial' | 'not-attempted'

export default function ArchivePage() {
  const [puzzles, setPuzzles] = useState<PuzzleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [userScores, setUserScores] = useState<Record<string, StoredScore>>({})
  const [userStats, setUserStats] = useState(getUserStats())

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
        
        // Load user scores
        const scores = getAllStoredScores()
        setUserScores(scores)
        setUserStats(getUserStats())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load puzzles')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPuzzles()
  }, [])

  // Filter puzzles based on completion status
  const filteredPuzzles = puzzles.filter(puzzle => {
    const isAttempted = hasAttemptedPuzzle(puzzle.date)
    const isCompleted = hasCompletedPuzzle(puzzle.date)
    const isPartial = hasPartialAttempt(puzzle.date)
    
    switch (filter) {
      case 'completed':
        return isCompleted
      case 'partial':
        return isPartial
      case 'not-attempted':
        return !isAttempted
      default:
        return true
    }
  })

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

      {/* User Statistics */}
      {userStats.totalPuzzlesCompleted > 0 && (
        <section style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px',
          border: '1px solid #dee2e6'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '15px' }}>Your Progress</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {userStats.totalPuzzlesCompleted}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Puzzles Completed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {userStats.averageScore}%
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Average Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {userStats.bestScore}/10
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Best Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6c757d' }}>
                {userStats.totalScore}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Correct</div>
            </div>
          </div>
        </section>
      )}

      {/* Filter Controls */}
      <section style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          marginBottom: '10px' 
        }}>
          <span style={{ fontWeight: '500', marginRight: '10px' }}>Filter:</span>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: filter === 'all' ? '#007bff' : 'white',
              color: filter === 'all' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            All ({puzzles.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: filter === 'completed' ? '#007bff' : 'white',
              color: filter === 'completed' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Completed ({puzzles.filter(p => hasCompletedPuzzle(p.date)).length})
          </button>
          <button
            onClick={() => setFilter('partial')}
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: filter === 'partial' ? '#007bff' : 'white',
              color: filter === 'partial' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Partial ({puzzles.filter(p => hasPartialAttempt(p.date)).length})
          </button>
          <button
            onClick={() => setFilter('not-attempted')}
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: filter === 'not-attempted' ? '#007bff' : 'white',
              color: filter === 'not-attempted' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Not Attempted ({puzzles.filter(p => !hasAttemptedPuzzle(p.date)).length})
          </button>
        </div>
      </section>

      {/* Puzzle Grid */}
      <section>
        <h2>
          {filter === 'all' ? 'Available Puzzles' : 
           filter === 'completed' ? 'Completed Puzzles' : 
           filter === 'partial' ? 'Partially Completed Puzzles' :
           'Not Attempted Puzzles'} 
          ({filteredPuzzles.length})
        </h2>
        <div style={{ 
          display: 'grid', 
          gap: '15px', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          marginTop: '20px'
        }}>
          {filteredPuzzles.map((puzzle) => {
            const userScore = userScores[puzzle.date]
            const isAttempted = hasAttemptedPuzzle(puzzle.date)
            const isCompleted = hasCompletedPuzzle(puzzle.date)
            const isPartial = hasPartialAttempt(puzzle.date)
            
            return (
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
                  cursor: 'pointer',
                  position: 'relative'
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
                  
                  {/* Score Badge */}
                  <div style={{ marginBottom: '15px' }}>
                    <ScoreBadge
                      score={userScore?.score}
                      totalQuestions={userScore?.totalQuestions}
                      isAttempted={isAttempted}
                      isCompleted={userScore?.isCompleted}
                      answeredCount={userScore?.answers.filter(a => a.guess && a.guess.trim() !== '').length}
                    />
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
                    backgroundColor: isCompleted ? '#6c757d' : isPartial ? '#ffc107' : '#007bff',
                    color: 'white',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {isCompleted ? '🔄 Replay Puzzle' : 
                     isPartial ? '▶️ Resume Puzzle' : 
                     'Play Puzzle →'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>


      {/* Empty State */}
      {filteredPuzzles.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          color: '#6c757d' 
        }}>
          <h3>No puzzles found</h3>
          <p>
            {filter === 'completed' && 'You haven\'t completed any puzzles yet. Start with today\'s puzzle!'}
            {filter === 'partial' && 'No partially completed puzzles. Start a puzzle and you can resume it later if needed!'}
            {filter === 'not-attempted' && 'You\'ve attempted all available puzzles. Great job!'}
            {filter === 'all' && 'No puzzles are available yet.'}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Show All Puzzles
            </button>
          )}
        </div>
      )}
    </div>
  )
}