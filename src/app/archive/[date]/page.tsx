'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { saveScore, savePartialProgress, getStoredScore, type StoredScore, type StoredAnswer } from '../../../../lib/localStorage'

interface PuzzleArticle {
  article_id: number
  title: string
  categories: string[]
  aliases: string[]
  snippet?: string
  image_url?: string
}

interface Puzzle {
  id: number
  date: string
  articles: PuzzleArticle[]
  created_at: string
}

// Function to fetch puzzle data
async function fetchPuzzle(date: string): Promise<Puzzle | null> {
  try {
    const response = await fetch(`/api/puzzle/${date}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        // Puzzle doesn't exist for this date
        return null
      }
      throw new Error(`Failed to fetch puzzle: ${response.status}`)
    }
    
    const data = await response.json()
    return data.puzzle
  } catch (error) {
    console.error('Error fetching puzzle:', error)
    throw error
  }
}

// Function to format date for display
function formatDateForDisplay(dateStr: string): string {
  try {
    // Parse as local date to display the same calendar date everywhere
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch {
    return dateStr
  }
}

interface ArticleState {
  article: PuzzleArticle
  userGuess: string
  isRevealed: boolean
  wasCorrect: boolean
}

interface ArchiveGamePageProps {
  params: Promise<{ date: string }>
}

export default function ArchiveGamePage({ params }: ArchiveGamePageProps) {
  const [date, setDate] = useState<string>('')
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentGuess, setCurrentGuess] = useState('')
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0)
  const [articleStates, setArticleStates] = useState<ArticleState[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [isReplayMode, setIsReplayMode] = useState(false)
  const [storedScore, setStoredScore] = useState<StoredScore | null>(null)
  const guessInputRef = useRef<HTMLInputElement>(null)
  
  // Load date from params and puzzle on component mount
  useEffect(() => {
    async function loadPuzzle() {
      try {
        setLoading(true)
        setError(null)
        
        // Get date from params
        const resolvedParams = await params
        const puzzleDate = resolvedParams.date
        setDate(puzzleDate)
        
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(puzzleDate)) {
          setError('Invalid date format. Please use YYYY-MM-DD.')
          return
        }
        
        const puzzleData = await fetchPuzzle(puzzleDate)
        
        if (!puzzleData) {
          setError(`No puzzle available for ${formatDateForDisplay(puzzleDate)}. This puzzle may not have been created yet.`)
        } else {
          setPuzzle(puzzleData)
          
          // Check for existing stored score
          const existingScore = getStoredScore(puzzleDate)
          setStoredScore(existingScore)
          
          if (existingScore) {
            if (existingScore.isCompleted) {
              // Replay mode: restore completed game state
              setIsReplayMode(true)
              const restoredStates: ArticleState[] = puzzleData.articles.map((article, index) => {
                const storedAnswer = existingScore.answers[index]
                return {
                  article,
                  userGuess: storedAnswer?.guess || '',
                  isRevealed: !!storedAnswer,
                  wasCorrect: storedAnswer?.correct || false
                }
              })
              setArticleStates(restoredStates)
              setGameCompleted(true)
            } else {
              // Resume mode: restore partial progress
              const restoredStates: ArticleState[] = puzzleData.articles.map((article, index) => {
                const storedAnswer = existingScore.answers[index]
                // Only mark as revealed if there's actually a guess (not just empty answer object)
                const hasGuess = !!(storedAnswer && storedAnswer.guess && storedAnswer.guess.trim() !== '')
                return {
                  article,
                  userGuess: storedAnswer?.guess || '',
                  isRevealed: hasGuess,
                  wasCorrect: storedAnswer?.correct || false
                }
              })
              setArticleStates(restoredStates)
              setCurrentArticleIndex(existingScore.currentQuestionIndex)
            }
          } else {
            // First time playing: initialize fresh game state
            const initialStates: ArticleState[] = puzzleData.articles.map(article => ({
              article,
              userGuess: '',
              isRevealed: false,
              wasCorrect: false
            }))
            setArticleStates(initialStates)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load puzzle')
      } finally {
        setLoading(false)
      }
    }
    
    loadPuzzle()
  }, [params])

  const calculateScore = useCallback(() => {
    return articleStates.filter(state => state.wasCorrect).length
  }, [articleStates])

  const saveGameScore = useCallback(() => {
    if (!puzzle || isReplayMode) return // Don't save scores for replays
    
    const score = calculateScore()
    const storedAnswers: StoredAnswer[] = articleStates.map(state => ({
      guess: state.userGuess,
      correct: state.wasCorrect,
      article_title: state.article.title
    }))
    
    const scoreData: StoredScore = {
      date: puzzle.date,
      score,
      totalQuestions: puzzle.articles.length,
      completedAt: new Date().toISOString(),
      answers: storedAnswers,
      isCompleted: true,
      currentQuestionIndex: puzzle.articles.length - 1
    }
    
    const saved = saveScore(scoreData)
    if (saved) {
      setStoredScore(scoreData)
    }
  }, [puzzle, articleStates, isReplayMode, calculateScore])

  const handleNextArticle = useCallback(() => {
    if (currentArticleIndex < articleStates.length - 1) {
      setCurrentArticleIndex(currentArticleIndex + 1)
    } else {
      setGameCompleted(true)
      // Save score when game completes (only for first-time plays)
      if (!isReplayMode) {
        saveGameScore()
      }
    }
  }, [currentArticleIndex, articleStates.length, isReplayMode, saveGameScore])

  // Auto-focus input when user starts typing and handle Enter key for navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't interfere if user is already focused on an input or if game is completed
      if (document.activeElement?.tagName === 'INPUT' || gameCompleted) return
      
      const currentArticle = articleStates[currentArticleIndex]
      
      // Handle Enter key to advance to next article when answer is revealed
      if (e.key === 'Enter' && currentArticle && currentArticle.isRevealed) {
        e.preventDefault()
        handleNextArticle()
        return
      }
      
      // Only focus on printable characters (letters, numbers, space, etc.)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (currentArticle && !currentArticle.isRevealed && guessInputRef.current) {
          guessInputRef.current.focus()
          // Append the typed character to existing input
          setCurrentGuess(prev => prev + e.key)
        }
      }
    }

    document.addEventListener('keypress', handleKeyPress)
    return () => document.removeEventListener('keypress', handleKeyPress)
  }, [gameCompleted, articleStates, currentArticleIndex, handleNextArticle])

  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentGuess.trim() || !puzzle || gameCompleted) return

    const currentArticle = articleStates[currentArticleIndex]
    if (!currentArticle || currentArticle.isRevealed) return

    const guess = currentGuess.trim()
    
    // Normalize text by removing articles and extra whitespace
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/\b(the|a|an)\b/g, '') // Remove articles
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
    }
    
    // Levenshtein distance function
    const levenshteinDistance = (str1: string, str2: string): number => {
      const matrix = []
      
      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i]
      }
      
      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j
      }
      
      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1]
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // substitution
              matrix[i][j - 1] + 1,     // insertion
              matrix[i - 1][j] + 1      // deletion
            )
          }
        }
      }
      
      return matrix[str2.length][str1.length]
    }
    
    // Check if guess is close enough to target
    const isCloseMatch = (guess: string, target: string): boolean => {
      const normalizedGuess = normalizeText(guess)
      const normalizedTarget = normalizeText(target)
      
      // Exact match after normalization
      if (normalizedGuess === normalizedTarget) return true
      
      // Levenshtein distance within 20% of target length
      const distance = levenshteinDistance(normalizedGuess, normalizedTarget)
      const maxDistance = Math.floor(normalizedTarget.length * 0.2)
      
      return distance <= maxDistance
    }
    
    // Check against title and all aliases
    const correctTitle = currentArticle.article.title
    const aliases = currentArticle.article.aliases
    const targets = [correctTitle, ...aliases]
    
    const isCorrect = targets.some(target => isCloseMatch(guess, target))
    
    // Update the article state with the guess and result
    const newArticleStates = [...articleStates]
    newArticleStates[currentArticleIndex] = {
      ...currentArticle,
      userGuess: guess,
      isRevealed: true,
      wasCorrect: isCorrect
    }
    setArticleStates(newArticleStates)
    setCurrentGuess('')
    
    // Save partial progress immediately with the new state
    if (!isReplayMode && puzzle) {
      const score = newArticleStates.filter(state => state.wasCorrect).length
      const storedAnswers: StoredAnswer[] = newArticleStates.map(state => ({
        guess: state.isRevealed ? state.userGuess : '', // Only save guess if revealed
        correct: state.wasCorrect,
        article_title: state.article.title
      }))
      
      const scoreData: StoredScore = {
        date: puzzle.date,
        score,
        totalQuestions: puzzle.articles.length,
        completedAt: new Date().toISOString(),
        answers: storedAnswers,
        isCompleted: false,
        currentQuestionIndex: currentArticleIndex
      }
      
      const saved = savePartialProgress(scoreData)
      if (saved) {
        setStoredScore(scoreData)
      }
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="newspaper-section" style={{ margin: '2rem auto', maxWidth: '800px' }}>
        <h1>Loading Archive Edition...</h1>
        <p>Please wait while we retrieve this historical edition.</p>
      </div>
    )
  }

  // Error state
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

  // No puzzle found
  if (!puzzle) {
    return (
      <div className="newspaper-section" style={{ margin: '2rem auto', maxWidth: '800px' }}>
        <h1>Edition Not Found</h1>
        <p>No edition found for {date ? formatDateForDisplay(date) : 'this date'}.</p>
        <Link href="/archive" className="button" style={{ marginTop: '1rem' }}>
          ← Return to Archive
        </Link>
      </div>
    )
  }

  const currentArticle = articleStates[currentArticleIndex]

  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: 'clamp(1rem, 4vw, 2rem)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Newspaper Header */}
      <header className="newspaper-header" style={{ marginBottom: '2rem' }}>
        <Link href="/archive" className="button" style={{ 
          fontSize: '0.9rem',
          marginBottom: '1rem',
          display: 'inline-block'
        }}>
          ← Return to Archive
        </Link>
        <h1 style={{ 
          fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
          margin: '0 0 0.5rem 0',
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          wordBreak: 'break-word',
          hyphens: 'auto'
        }}>
          The Daily Taxonomystery
        </h1>
        <div style={{
          fontSize: '1.2rem',
          fontStyle: 'italic',
          color: 'var(--text-gray)',
          margin: '0 0 1rem 0'
        }}>
          ARCHIVE EDITION: {formatDateForDisplay(puzzle.date).toUpperCase()}
        </div>
        <div style={{ 
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: 'var(--text-gray)',
          fontFamily: 'var(--font-mono)'
        }}>
          {puzzle.date} • ARTICLE {currentArticleIndex + 1} OF {puzzle.articles.length}
        </div>
        {isReplayMode && storedScore && (
          <div style={{ 
            color: 'var(--text-gray)', 
            fontStyle: 'italic',
            fontSize: '0.9rem',
            marginTop: '0.5rem'
          }}>
            🔄 REPLAY EDITION - Previous score: {storedScore.score}/{storedScore.totalQuestions}
          </div>
        )}
        {!isReplayMode && storedScore && !storedScore.isCompleted && (
          <div style={{ 
            color: 'var(--accent-red)', 
            fontStyle: 'italic',
            fontSize: '0.9rem',
            marginTop: '0.5rem',
            fontWeight: 'bold'
          }}>
            ▶️ CONTINUING EDITION - {storedScore.answers.filter(a => a.guess && a.guess.trim() !== '').length}/{storedScore.totalQuestions} answered
          </div>
        )}
      </header>

      {/* Game Progress */}
      <section className="newspaper-section">
        <h3 style={{ 
          fontSize: '1.3rem',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Edition Progress
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {articleStates.map((state, index) => (
            <div 
              key={state.article.article_id}
              style={{
                padding: '0.5rem 1rem',
                border: '2px solid var(--border-gray)',
                backgroundColor: 
                  state.wasCorrect ? 'var(--pastel-green)' : 
                  state.isRevealed && !state.wasCorrect ? 'var(--pastel-red)' : 
                  index === currentArticleIndex ? 'var(--pastel-yellow)' : 'var(--newsprint-gray)',
                borderColor:
                  state.wasCorrect ? 'var(--pastel-green-border)' :
                  state.isRevealed && !state.wasCorrect ? 'var(--pastel-red-border)' :
                  index === currentArticleIndex ? 'var(--pastel-yellow-border)' : 'var(--border-gray)',
                fontWeight: index === currentArticleIndex ? 'bold' : 'normal',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {index + 1}
              {state.wasCorrect && ' ✓'}
              {state.isRevealed && !state.wasCorrect && ' ✗'}
            </div>
          ))}
        </div>
      </section>

      {!gameCompleted && currentArticle && (
        <>
          {/* Current Article */}
          <section className="newspaper-section">
            <h2 style={{ 
              textAlign: 'center',
              fontSize: '1.8rem',
              marginBottom: '1.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}>
              Featured Article Classification
            </h2>
            <div style={{ 
              padding: '2rem', 
              border: '3px solid var(--ink-black)', 
              backgroundColor: 'var(--paper-white)',
              borderStyle: 'double'
            }}>
              {!currentArticle.isRevealed ? (
                <>
                  <h3 style={{ 
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    marginBottom: '1.5rem',
                    fontStyle: 'italic',
                    color: 'var(--text-gray)'
                  }}>
                    What Wikipedia article belongs to these categories?
                  </h3>
                  <div style={{ 
                    columns: currentArticle.article.categories.length > 6 ? '2' : '1',
                    columnGap: '2rem'
                  }}>
                    {currentArticle.article.categories.map((category, idx) => (
                      <div key={idx} style={{ 
                        marginBottom: '0.75rem',
                        breakInside: 'avoid',
                        fontSize: '1.1rem',
                        borderBottom: '1px dotted var(--border-gray)',
                        paddingBottom: '0.25rem'
                      }}>
                        <strong>• {category}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ 
                    marginBottom: '1.5rem', 
                    padding: '1.5rem', 
                    backgroundColor: currentArticle.wasCorrect ? 'var(--pastel-green)' : 'var(--pastel-red)', 
                    border: `3px solid ${currentArticle.wasCorrect ? 'var(--pastel-green-border)' : 'var(--pastel-red-border)'}`,
                    textAlign: 'center'
                  }}>
                    {currentArticle.wasCorrect ? (
                      <div>
                        <h3 style={{ 
                          fontSize: 'clamp(1rem, 4vw, 1.5rem)',
                          margin: '0 0 1rem 0',
                          color: 'var(--ink-black)',
                          textTransform: 'uppercase',
                          letterSpacing: 'clamp(0.02em, 0.5vw, 0.1em)',
                          wordBreak: 'break-word',
                          hyphens: 'auto'
                        }}>
                          ✓ CORRECT IDENTIFICATION
                        </h3>
                        <p style={{ 
                          fontSize: '1.1rem',
                          fontStyle: 'italic',
                          margin: 0
                        }}>
                          Your answer: &quot;<strong>{currentArticle.userGuess}</strong>&quot;
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h3 style={{ 
                          fontSize: 'clamp(1rem, 4vw, 1.5rem)',
                          margin: '0 0 1rem 0',
                          color: 'var(--text-gray)',
                          textTransform: 'uppercase',
                          letterSpacing: 'clamp(0.02em, 0.5vw, 0.1em)',
                          wordBreak: 'break-word',
                          hyphens: 'auto'
                        }}>
                          ✗ MISIDEN&shy;TIFICATION
                        </h3>
                        <p style={{ 
                          fontSize: '1.1rem',
                          fontStyle: 'italic',
                          margin: 0
                        }}>
                          Your answer: &quot;<strong>{currentArticle.userGuess}</strong>&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Article snippet and image */}
                  {(currentArticle.article.snippet || currentArticle.article.image_url) && (
                    <div style={{ 
                      marginTop: '1.5rem', 
                      padding: 'clamp(0.75rem, 2.5vw, 1.5rem)', 
                      backgroundColor: 'var(--paper-white)', 
                      border: '2px solid var(--border-gray)',
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: 'clamp(0.5rem, 2vw, 1.5rem)', 
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        width: '100%',
                        maxWidth: '100%'
                      }}>
                        {currentArticle.article.image_url && (
                          <div style={{ flexShrink: 0 }}>
                            <img 
                              src={currentArticle.article.image_url} 
                              alt={currentArticle.article.title}
                              style={{ 
                                maxWidth: '200px', 
                                maxHeight: '200px', 
                                border: '2px solid var(--border-gray)',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div style={{ 
                          flex: 1, 
                          minWidth: '200px',
                          maxWidth: '100%'
                        }}>
                          {currentArticle.article.snippet && (
                            <div>
                              <h4 style={{ 
                                marginTop: 0, 
                                marginBottom: '1rem', 
                                color: 'var(--ink-black)', 
                                fontSize: '1.4rem', 
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em'
                              }}>
                                {currentArticle.article.title}
                              </h4>
                              <p style={{ 
                                lineHeight: '1.6', 
                                color: 'var(--text-gray)',
                                margin: '0 0 1rem 0',
                                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                                textAlign: 'left',
                                wordWrap: 'break-word',
                                hyphens: 'auto'
                              }}>
                                {currentArticle.article.snippet}
                              </p>
                            </div>
                          )}
                          <a 
                            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(currentArticle.article.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'inline-block',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}
                          >
                            📖 Read Full Article →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {!currentArticle.isRevealed ? (
            /* Guess Input */
            <section className="newspaper-section">
              <form onSubmit={handleSubmitGuess} style={{ textAlign: 'center' }}>
                <label htmlFor="guess" style={{ 
                  display: 'block',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Your Identification:
                </label>
                <input
                  ref={guessInputRef}
                  id="guess"
                  type="text"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  placeholder="Enter the Wikipedia article name..."
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    marginBottom: '1.5rem',
                    fontSize: '1.1rem',
                    textAlign: 'center'
                  }}
                />
                <div>
                  <button 
                    type="submit" 
                    disabled={!currentGuess.trim()}
                    className="button"
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      minWidth: '200px'
                    }}
                  >
                    Submit Answer
                  </button>
                </div>
              </form>
              <p style={{ 
                textAlign: 'center',
                fontStyle: 'italic',
                color: 'var(--text-gray)',
                marginTop: '1rem'
              }}>
                <small>Try the exact article name or a close variant!</small>
              </p>
            </section>
          ) : (
            /* Next Article Button */
            <section className="newspaper-section" style={{ textAlign: 'center' }}>
              <button 
                onClick={handleNextArticle} 
                className="button"
                style={{ 
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  minWidth: '250px'
                }}
              >
                {currentArticleIndex < puzzle.articles.length - 1 ? 'Next Article →' : 'Complete Edition'}
              </button>
            </section>
          )}
        </>
      )}

      {/* Game Completed */}
      {gameCompleted && (
        <section className="newspaper-section">
          <div className="newspaper-header" style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '2.2rem',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}>
              Archive Edition Complete!
            </h2>
            <div style={{ 
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: 'var(--gold-highlight)'
            }}>
              Final Score: {calculateScore()} out of {puzzle.articles.length} correct
            </div>
          </div>
          
          {/* Show all results */}
          <h3 style={{ 
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: 'center'
          }}>
            Complete Results Summary
          </h3>
          <div>
            {articleStates.map((state, index) => (
              <div key={state.article.article_id} style={{ 
                marginBottom: '1.5rem', 
                padding: '1.5rem', 
                border: `2px solid ${state.wasCorrect ? 'var(--pastel-green-border)' : 'var(--pastel-red-border)'}`,
                backgroundColor: state.wasCorrect ? 'var(--pastel-green)' : 'var(--pastel-red)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <strong style={{ fontSize: '1.2rem' }}>{index + 1}. {state.article.title}</strong>
                  <span style={{ fontSize: '1.5rem' }}>
                    {state.wasCorrect ? '✓' : '✗'}
                  </span>
                </div>
                
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Your identification:</strong> &quot;{state.userGuess}&quot;
                </div>
                
                {!state.wasCorrect && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--paper-white)',
                    border: '1px solid var(--border-gray)'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Categories were:</strong> {state.article.categories.join(', ')}
                    </div>
                    {state.article.aliases.length > 0 && (
                      <div><strong>Also known as:</strong> {state.article.aliases.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: '2rem'
          }}>
            <button 
              onClick={() => navigator.share?.({ 
                title: 'The Daily Taxonomystery', 
                text: `I scored ${calculateScore()}/${puzzle.articles.length} on the ${formatDateForDisplay(puzzle.date)} Taxonomy Mystery archive edition!` 
              })}
              className="button"
              style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'var(--ink-black)',
                color: 'var(--paper-white)',
                borderColor: 'var(--ink-black)'
              }}
            >
              📰 Share Results
            </button>
            
            {isReplayMode && (
              <button 
                onClick={() => {
                  // Reset to play again
                  setIsReplayMode(false)
                  setGameCompleted(false)
                  setCurrentArticleIndex(0)
                  const freshStates: ArticleState[] = puzzle.articles.map(article => ({
                    article,
                    userGuess: '',
                    isRevealed: false,
                    wasCorrect: false
                  }))
                  setArticleStates(freshStates)
                }}
                className="button"
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                🔄 Play Again
              </button>
            )}
            
            <Link href="/archive" className="button" style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              ← Return to Archive
            </Link>
          </div>
        </section>
      )}

      {/* Debug Info (remove later) */}
      <details>
        <summary>Debug Info (Dev Only)</summary>
        <h4>All Categories in Puzzle:</h4>
        <ul>
          {Array.from(new Set(puzzle.articles.flatMap(a => a.categories))).map(cat => (
            <li key={cat}>{cat}</li>
          ))}
        </ul>
        <h4>All Aliases:</h4>
        <ul>
          {Array.from(new Set(puzzle.articles.flatMap(a => a.aliases))).map(alias => (
            <li key={alias}>{alias}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}