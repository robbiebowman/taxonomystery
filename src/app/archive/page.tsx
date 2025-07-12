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
      <div className="newspaper-section" style={{ margin: '2rem auto', maxWidth: '800px' }}>
        <h1>Loading Archive Editions...</h1>
        <p>Please wait while we retrieve all available editions.</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="newspaper-section" style={{ margin: '2rem auto', maxWidth: '800px' }}>
        <h1>📰 Archive Unavailable!</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="button" style={{ marginTop: '1rem' }}>
          Refresh Archive
        </button>
        <br /><br />
        <Link href="/game" className="button">← Return to Today&apos;s Edition</Link>
      </div>
    )
  }

  // No puzzles available
  if (puzzles.length === 0) {
    return (
      <div className="newspaper-section" style={{ margin: '2rem auto', maxWidth: '800px' }}>
        <h1>Archive Vault</h1>
        <p>No editions are available yet. Check back after some puzzles have been published!</p>
        <Link href="/game" className="button">← Return to Today&apos;s Edition</Link>
      </div>
    )
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: 'clamp(1rem, 4vw, 2rem)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Newspaper Header */}
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 6vw, 2.8rem)',
            margin: '0',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            wordBreak: 'break-word',
            hyphens: 'auto'
          }}>
            The Daily Taxonomystery
          </h1>
          <Link 
            href="/game" 
            className="button" 
            style={{ 
              fontSize: '0.7rem',
              padding: '0.4rem 0.8rem',
              position: 'absolute',
              right: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: '0.6',
              background: 'var(--newsprint-gray)',
              color: 'var(--text-gray)',
              borderColor: 'var(--border-gray)',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6'
            }}
          >
            ← Today
          </Link>
        </div>
      </header>


      {/* Filter Controls */}
      <section className="newspaper-section">
        <h3 style={{ 
          fontSize: '1.2rem',
          margin: '0 0 1rem 0',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Filter Editions:
        </h3>
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          alignItems: 'center', 
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setFilter('all')}
            className="button"
            style={{
              fontSize: '0.85rem',
              background: filter === 'all' ? 'var(--ink-black)' : 'var(--paper-white)',
              color: filter === 'all' ? 'var(--paper-white)' : 'var(--ink-black)',
              borderColor: 'var(--ink-black)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            All ({puzzles.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className="button"
            style={{
              fontSize: '0.85rem',
              background: filter === 'completed' ? 'var(--ink-black)' : 'var(--paper-white)',
              color: filter === 'completed' ? 'var(--paper-white)' : 'var(--ink-black)',
              borderColor: 'var(--ink-black)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Completed ({puzzles.filter(p => hasCompletedPuzzle(p.date)).length})
          </button>
          <button
            onClick={() => setFilter('partial')}
            className="button"
            style={{
              fontSize: '0.85rem',
              background: filter === 'partial' ? 'var(--ink-black)' : 'var(--paper-white)',
              color: filter === 'partial' ? 'var(--paper-white)' : 'var(--ink-black)',
              borderColor: 'var(--ink-black)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Partial ({puzzles.filter(p => hasPartialAttempt(p.date)).length})
          </button>
          <button
            onClick={() => setFilter('not-attempted')}
            className="button"
            style={{
              fontSize: '0.85rem',
              background: filter === 'not-attempted' ? 'var(--ink-black)' : 'var(--paper-white)',
              color: filter === 'not-attempted' ? 'var(--paper-white)' : 'var(--ink-black)',
              borderColor: 'var(--ink-black)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Not Attempted ({puzzles.filter(p => !hasAttemptedPuzzle(p.date)).length})
          </button>
        </div>
      </section>

      {/* Puzzle Grid */}
      <section className="newspaper-section">
        <h2 style={{ 
          fontSize: '1.6rem',
          margin: '0 0 1.5rem 0',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: 'center'
        }}>
          {filter === 'all' ? 'Available Editions' : 
           filter === 'completed' ? 'Completed Editions' : 
           filter === 'partial' ? 'Partially Completed Editions' :
           'Not Attempted Editions'} 
           ({filteredPuzzles.length})
        </h2>
        <div style={{ 
          display: 'grid', 
          gap: '1.5rem', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
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
                <article style={{
                  border: `2px solid ${
                    isCompleted ? 'var(--pastel-green-border)' :
                    isPartial ? 'var(--pastel-yellow-border)' :
                    'var(--border-gray)'
                  }`,
                  padding: 'clamp(1rem, 3vw, 1.5rem)',
                  backgroundColor: 
                    isCompleted ? 'var(--pastel-green)' :
                    isPartial ? 'var(--pastel-yellow)' :
                    'var(--paper-white)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  const hoverBg = isCompleted ? 'var(--pastel-green)' :
                                 isPartial ? 'var(--pastel-yellow)' :
                                 'var(--newsprint-gray)';
                  e.currentTarget.style.backgroundColor = hoverBg;
                  e.currentTarget.style.borderColor = 'var(--ink-black)';
                }}
                onMouseLeave={(e) => {
                  const defaultBg = isCompleted ? 'var(--pastel-green)' :
                                   isPartial ? 'var(--pastel-yellow)' :
                                   'var(--paper-white)';
                  const defaultBorder = isCompleted ? 'var(--pastel-green-border)' :
                                       isPartial ? 'var(--pastel-yellow-border)' :
                                       'var(--border-gray)';
                  e.currentTarget.style.backgroundColor = defaultBg;
                  e.currentTarget.style.borderColor = defaultBorder;
                }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--border-gray)',
                    paddingBottom: '0.75rem'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      color: 'var(--ink-black)',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {formatDate(puzzle.date)}
                    </h3>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-gray)',
                      fontWeight: 'normal',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase'
                    }}>
                      {getRelativeTime(puzzle.date)}
                    </span>
                  </div>
                  
                  {/* Score Badge */}
                  <div style={{ marginBottom: '1rem' }}>
                    <ScoreBadge
                      score={userScore?.score}
                      totalQuestions={userScore?.totalQuestions}
                      isAttempted={isAttempted}
                      isCompleted={userScore?.isCompleted}
                      answeredCount={userScore?.answers.filter(a => a.guess && a.guess.trim() !== '').length}
                    />
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--text-gray)',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Classification Count:</strong> {puzzle.article_count}
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Publication Date:</strong> {puzzle.date}
                    </p>
                  </div>
                  
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem',
                    backgroundColor: 'var(--ink-black)',
                    color: 'var(--paper-white)',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {isCompleted ? '🔄 Replay Edition' : 
                     isPartial ? '▶️ Resume Edition' : 
                     'Read Edition →'}
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      </section>


      {/* Empty State */}
      {filteredPuzzles.length === 0 && (
        <section className="newspaper-section" style={{ textAlign: 'center' }}>
          <h3 style={{ 
            fontSize: '1.4rem',
            margin: '0 0 1rem 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-gray)'
          }}>
            No Editions Found
          </h3>
          <p style={{ 
            fontSize: '1rem',
            color: 'var(--text-gray)',
            marginBottom: '1.5rem'
          }}>
            {filter === 'completed' && 'You haven\'t completed any editions yet. Start with today\'s edition!'}
            {filter === 'partial' && 'No partially completed editions. Start an edition and you can resume it later if needed!'}
            {filter === 'not-attempted' && 'You\'ve attempted all available editions. Excellent work!'}
            {filter === 'all' && 'No editions are available yet.'}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="button"
              style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Show All Editions
            </button>
          )}
        </section>
      )}

      {/* User Statistics */}
      {userStats.totalPuzzlesCompleted > 0 && (
        <section className="newspaper-section">
          <h2 style={{ 
            fontSize: '1.6rem',
            margin: '0 0 1.5rem 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: 'center'
          }}>
            Reader Statistics
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ 
              padding: '1rem',
              border: '2px solid var(--border-gray)',
              backgroundColor: 'var(--paper-white)'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: 'var(--ink-black)',
                fontFamily: 'var(--font-mono)'
              }}>
                {userStats.totalPuzzlesCompleted}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-gray)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 'bold'
              }}>
                Editions Completed
              </div>
            </div>
            <div style={{ 
              padding: '1rem',
              border: '2px solid var(--border-gray)',
              backgroundColor: 'var(--paper-white)'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: 'var(--ink-black)',
                fontFamily: 'var(--font-mono)'
              }}>
                {userStats.averageScore}%
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-gray)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 'bold'
              }}>
                Average Score
              </div>
            </div>
            <div style={{ 
              padding: '1rem',
              border: '2px solid var(--border-gray)',
              backgroundColor: 'var(--paper-white)'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: 'var(--ink-black)',
                fontFamily: 'var(--font-mono)'
              }}>
                {userStats.bestScore}/10
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-gray)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 'bold'
              }}>
                Best Score
              </div>
            </div>
            <div style={{ 
              padding: '1rem',
              border: '2px solid var(--border-gray)',
              backgroundColor: 'var(--paper-white)'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: 'var(--ink-black)',
                fontFamily: 'var(--font-mono)'
              }}>
                {userStats.totalScore}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-gray)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 'bold'
              }}>
                Total Correct
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}