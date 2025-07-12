'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { saveScore, savePartialProgress, getStoredScore, type StoredScore, type StoredAnswer } from '../../../lib/localStorage'

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

// Function to get today's date in YYYY-MM-DD format (local time for user experience)
function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

interface ArticleState {
  article: PuzzleArticle
  userGuess: string
  isRevealed: boolean
  wasCorrect: boolean
}

export default function GamePage() {
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
  
  // Load puzzle on component mount
  useEffect(() => {
    async function loadPuzzle() {
      try {
        setLoading(true)
        setError(null)
        
        const todayDate = getTodayDate()
        const puzzleData = await fetchPuzzle(todayDate)
        
        if (!puzzleData) {
          setError(`No puzzle available for ${todayDate}. Check back later!`)
        } else {
          setPuzzle(puzzleData)
          
          // Check for existing stored score
          const existingScore = getStoredScore(todayDate)
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
  }, [])

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
      <div>
        <h1>Loading today&apos;s puzzle...</h1>
        <p>Please wait while we fetch the latest puzzle.</p>
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
      </div>
    )
  }

  // No puzzle found
  if (!puzzle) {
    return (
      <div>
        <h1>No puzzle available</h1>
        <p>Please check back later for today&apos;s puzzle!</p>
      </div>
    )
  }

  const currentArticle = articleStates[currentArticleIndex]

  return (
    <div>
      {/* Header */}
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h1>Today&apos;s Puzzle</h1>
            <p>Date: {puzzle.date}</p>
            <p>Article {currentArticleIndex + 1} of {puzzle.articles.length}</p>
            {isReplayMode && storedScore && (
              <p style={{ 
                color: '#6c757d', 
                fontStyle: 'italic',
                fontSize: '14px',
                marginTop: '5px'
              }}>
                🔄 Replay Mode - Previous score: {storedScore.score}/{storedScore.totalQuestions}
              </p>
            )}
            {!isReplayMode && storedScore && !storedScore.isCompleted && (
              <p style={{ 
                color: '#007bff', 
                fontStyle: 'italic',
                fontSize: '14px',
                marginTop: '5px'
              }}>
                ▶️ Resuming puzzle - {storedScore.answers.filter(a => a.guess && a.guess.trim() !== '').length}/{storedScore.totalQuestions} answered
              </p>
            )}
          </div>
          <Link href="/archive" style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            View Archive
          </Link>
        </div>
      </header>

      {/* Game Progress */}
      <section>
        <h3>Progress:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {articleStates.map((state, index) => (
            <div 
              key={state.article.article_id}
              style={{
                padding: '5px 10px',
                border: '1px solid #ccc',
                backgroundColor: 
                  state.wasCorrect ? '#d4edda' : 
                  state.isRevealed && !state.wasCorrect ? '#f8d7da' : 
                  index === currentArticleIndex ? '#fff3cd' : '#f8f9fa'
              }}
            >
              {index + 1}
              {state.wasCorrect && ' ✅'}
              {state.isRevealed && !state.wasCorrect && ' ❌'}
            </div>
          ))}
        </div>
      </section>

      {!gameCompleted && currentArticle && (
        <>
          {/* Current Article */}
          <section>
            <h2>What Wikipedia article has these categories?</h2>
            <div style={{ 
              padding: '20px', 
              border: '2px solid #007bff', 
              borderRadius: '8px',
              backgroundColor: '#f8f9fa'
            }}>
              {!currentArticle.isRevealed ? (
                <>
                  <h3>Categories:</h3>
                  <ul>
                    {currentArticle.article.categories.map((category, idx) => (
                      <li key={idx}><strong>{category}</strong></li>
                    ))}
                  </ul>
                </>
              ) : (
                <div>
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    backgroundColor: currentArticle.wasCorrect ? '#d4edda' : '#f8d7da', 
                    borderRadius: '4px' 
                  }}>
                    {currentArticle.wasCorrect ? (
                      <div>
                        <strong>✅ Correct!</strong>
                        <p>Your guess: <em>&quot;{currentArticle.userGuess}&quot;</em></p>
                      </div>
                    ) : (
                      <div>
                        <strong>❌ Incorrect</strong>
                        <p>Your guess: <em>&quot;{currentArticle.userGuess}&quot;</em></p>
                      </div>
                    )}
                  </div>

                  {/* Article snippet and image */}
                  {(currentArticle.article.snippet || currentArticle.article.image_url) && (
                    <div style={{ 
                      marginTop: '20px', 
                      padding: '15px', 
                      backgroundColor: '#ffffff', 
                      borderRadius: '8px',
                      border: '1px solid #dee2e6'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: '15px', 
                        alignItems: 'flex-start',
                        flexWrap: 'wrap'
                      }}>
                        {currentArticle.article.image_url && (
                          <div style={{ flexShrink: 0 }}>
                            <img 
                              src={currentArticle.article.image_url} 
                              alt={currentArticle.article.title}
                              style={{ 
                                maxWidth: '200px', 
                                maxHeight: '200px', 
                                borderRadius: '4px',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: '250px' }}>
                          {currentArticle.article.snippet && (
                            <div>
                              <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
                                {currentArticle.article.title}
                              </h4>
                              <p style={{ 
                                lineHeight: '1.5', 
                                color: '#555',
                                margin: '0 0 10px 0',
                                fontSize: '16px'
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
                              color: '#007bff', 
                              textDecoration: 'none',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            📖 Read more on Wikipedia →
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
            <section>
              <form onSubmit={handleSubmitGuess}>
                <label htmlFor="guess">Your guess:</label>
                <input
                  ref={guessInputRef}
                  id="guess"
                  type="text"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  placeholder="Enter the Wikipedia article name..."
                />
                <button type="submit" disabled={!currentGuess.trim()}>
                  Submit Guess
                </button>
              </form>
              <p><small>Tip: Try the exact article name or a close variant!</small></p>
            </section>
          ) : (
            /* Next Article Button */
            <section>
              <button onClick={handleNextArticle} style={{ padding: '10px 20px', fontSize: '16px' }}>
                {currentArticleIndex < puzzle.articles.length - 1 ? 'Next Article →' : 'Finish Puzzle'}
              </button>
            </section>
          )}
        </>
      )}

      {/* Game Completed */}
      {gameCompleted && (
        <section>
          <h2>Puzzle Complete!</h2>
          <p>Final Score: {calculateScore()} out of {puzzle.articles.length} correct</p>
          
          {/* Show all results */}
          <h3>Results Summary:</h3>
          <div>
            {articleStates.map((state, index) => (
              <div key={state.article.article_id} style={{ 
                marginBottom: '15px', 
                padding: '15px', 
                border: '1px solid #ccc',
                borderRadius: '8px',
                backgroundColor: state.wasCorrect ? '#d4edda' : '#f8d7da'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong>{index + 1}. {state.article.title}</strong>
                  <span style={{ fontSize: '24px' }}>
                    {state.wasCorrect ? '✅' : '❌'}
                  </span>
                </div>
                
                <div><strong>Your guess:</strong> &quot;{state.userGuess}&quot;</div>
                
                {!state.wasCorrect && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Categories were:</strong> {state.article.categories.join(', ')}
                    {state.article.aliases.length > 0 && (
                      <div><strong>Also known as:</strong> {state.article.aliases.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigator.share?.({ 
                title: 'Taxonomy Mystery', 
                text: `I scored ${calculateScore()}/${puzzle.articles.length} on today's Taxonomy Mystery puzzle!` 
              })}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Share Results
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
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Play Again
              </button>
            )}
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