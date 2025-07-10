'use client'

import { useState, useEffect } from 'react'

interface PuzzleArticle {
  article_id: number
  title: string
  categories: string[]
  aliases: string[]
}

interface Puzzle {
  id: number
  date: string
  articles: PuzzleArticle[]
  created_at: string
}

// Function to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
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
          // Initialize article states
          const initialStates: ArticleState[] = puzzleData.articles.map(article => ({
            article,
            userGuess: '',
            isRevealed: false,
            wasCorrect: false
          }))
          setArticleStates(initialStates)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load puzzle')
      } finally {
        setLoading(false)
      }
    }
    
    loadPuzzle()
  }, [])

  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentGuess.trim() || !puzzle || gameCompleted) return

    const currentArticle = articleStates[currentArticleIndex]
    if (!currentArticle || currentArticle.isRevealed) return

    const guess = currentGuess.trim()
    
    // Check if guess matches the article title or any of its aliases
    const correctTitle = currentArticle.article.title.toLowerCase()
    const aliases = currentArticle.article.aliases.map(alias => alias.toLowerCase())
    const guessLower = guess.toLowerCase()
    
    const isCorrect = guessLower === correctTitle || 
                     aliases.some(alias => alias === guessLower) ||
                     // More flexible matching - contains check
                     correctTitle.includes(guessLower) || 
                     aliases.some(alias => alias.includes(guessLower))
    
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
  }

  const handleNextArticle = () => {
    if (currentArticleIndex < articleStates.length - 1) {
      setCurrentArticleIndex(currentArticleIndex + 1)
    } else {
      setGameCompleted(true)
    }
  }

  const handleResetGame = () => {
    setCurrentGuess('')
    setCurrentArticleIndex(0)
    setGameCompleted(false)
    if (puzzle) {
      const initialStates: ArticleState[] = puzzle.articles.map(article => ({
        article,
        userGuess: '',
        isRevealed: false,
        wasCorrect: false
      }))
      setArticleStates(initialStates)
    }
  }

  const calculateScore = () => {
    return articleStates.filter(state => state.wasCorrect).length
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
        <h1>Today&apos;s Puzzle</h1>
        <p>Date: {puzzle.date}</p>
        <p>Article {currentArticleIndex + 1} of {puzzle.articles.length}</p>
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
                  <h3>Answer: 
                    <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(currentArticle.article.title)}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       style={{ marginLeft: '10px' }}>
                      {currentArticle.article.title}
                    </a>
                  </h3>
                  
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
                        <p>Correct answer: <strong>{currentArticle.article.title}</strong></p>
                      </div>
                    )}
                  </div>
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

          <button onClick={() => navigator.share?.({ 
            title: 'Taxonomy Mystery', 
            text: `I scored ${calculateScore()}/${puzzle.articles.length} on today's Taxonomy Mystery puzzle!` 
          })}>
            Share Results
          </button>
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