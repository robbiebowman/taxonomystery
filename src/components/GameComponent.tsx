'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { formatDateForDisplay } from '@/lib/game/api'
import { useGameLogic } from '@/lib/game/useGameLogic'
import NewspaperHeader from '@/components/NewspaperHeader'
import GameProgress from '@/components/GameProgress'
import ArticleCategories from '@/components/ArticleCategories'
import ArticleResult from '@/components/ArticleResult'
import ArticleDetails from '@/components/ArticleDetails'
import GuessInput from '@/components/GuessInput'
import GameCompletion from '@/components/GameCompletion'
import LoadingState from '@/components/LoadingState'

interface GameComponentProps {
  puzzleDate: string
  isArchive?: boolean
}

export default function GameComponent({ puzzleDate, isArchive = false }: GameComponentProps) {
  const [error, setError] = useState<string | null>(null)
  
  const onError = useCallback((errorMessage: string) => {
    if (isArchive) {
      setError(`No puzzle available for ${formatDateForDisplay(puzzleDate)}. This puzzle may not have been created yet.`)
    } else {
      setError(errorMessage)
    }
  }, [puzzleDate, isArchive])
  
  const {
    puzzle,
    loading,
    currentGuess,
    setCurrentGuess,
    currentArticleIndex,
    articleStates,
    gameCompleted,
    isReplayMode,
    storedScore,
    guessInputRef,
    calculateScore,
    handleNextArticle,
    handleSubmitGuess,
    resetGame
  } = useGameLogic({ 
    puzzleDate, 
    onError 
  })

  // Loading state
  if (loading) {
    return <LoadingState isArchive={isArchive} date={puzzleDate} />
  }

  // Error state
  if (error) {
    return (
      <div className="newspaper-section" style={{ margin: '2rem auto', maxWidth: '800px' }}>
        <h1>📰 {isArchive ? 'Archive Issue!' : 'News Flash!'}</h1>
        <p>{error}</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {isArchive ? (
            <>
              <Link href="/archive" className="button">
                ← Return to Archive
              </Link>
              <button onClick={() => window.location.reload()} className="button">
                Refresh Edition
              </button>
            </>
          ) : (
            <button onClick={() => window.location.reload()} className="button">
              Refresh Edition
            </button>
          )}
        </div>
      </div>
    )
  }

  // No puzzle found
  if (!puzzle) {
    return (
      <div className="newspaper-section" style={{ margin: '2rem auto', maxWidth: '800px' }}>
        <h1>{isArchive ? 'Edition Not Found' : 'No Edition Available'}</h1>
        <p>
          {isArchive 
            ? `No edition found for ${formatDateForDisplay(puzzleDate)}.`
            : "Please check back later for today's puzzle!"
          }
        </p>
        {isArchive && (
          <Link href="/archive" className="button" style={{ marginTop: '1rem' }}>
            ← Return to Archive
          </Link>
        )}
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
      <NewspaperHeader 
        date={puzzle.date}
        currentArticleIndex={currentArticleIndex}
        totalArticles={puzzle.articles.length}
        showArchiveLink={!isArchive}
        showBackToArchive={isArchive}
        subtitle={isArchive ? "archive" : undefined}
        replayInfo={isReplayMode && storedScore ? {
          isReplayMode: true,
          score: storedScore.score,
          totalQuestions: storedScore.totalQuestions
        } : undefined}
        resumeInfo={!isReplayMode && storedScore && !storedScore.isCompleted ? {
          answeredCount: storedScore.answers.filter(a => a.guess && a.guess.trim() !== '').length,
          totalQuestions: storedScore.totalQuestions
        } : undefined}
      />

      {!gameCompleted && currentArticle && (
        <>
          {/* Current Article */}
          <section className="newspaper-section">
            {!currentArticle.isRevealed ? (
              <div style={{ 
                padding: 'clamp(1rem, 4vw, 2rem)'
              }}>
                <h3 style={{ 
                  textAlign: 'center',
                  fontSize: '1.4rem',
                  marginBottom: '1.5rem',
                  fontStyle: 'italic',
                  color: 'var(--text-gray)'
                }}>
                  Identify the article:
                </h3>
                <div style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  justifyContent: 'center',
                  marginBottom: '2rem'
                }}>
                  {currentArticle.article.categories.map((category, idx) => (
                    <div key={idx} style={{ 
                      display: 'inline-block',
                      backgroundColor: '#f8f8f8',
                      border: '1px solid #888',
                      borderRadius: '0.25rem',
                      padding: '0.75rem 1.25rem',
                      fontSize: '1.2rem',
                      fontWeight: '500',
                      textAlign: 'center',
                      boxShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {category}
                    </div>
                  ))}
                </div>
                
                {/* Guess Input */}
                <form onSubmit={(e) => {
                  e.preventDefault()
                  if (!currentGuess.trim() || gameCompleted) return
                  handleSubmitGuess()
                }} style={{ textAlign: 'center' }}>
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
                    disabled={gameCompleted}
                    autoComplete="off"
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
                      disabled={!currentGuess.trim() || gameCompleted}
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
              </div>
            ) : (
              <>
                {/* Article snippet and image */}
                <ArticleDetails 
                  title={currentArticle.article.title}
                  snippet={currentArticle.article.snippet}
                  imageUrl={currentArticle.article.image_url}
                />
                
                {/* Result after article details */}
                <ArticleResult 
                  wasCorrect={currentArticle.wasCorrect}
                  userGuess={currentArticle.userGuess}
                />
                
                {/* Next Article Button */}
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
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
                </div>
              </>
            )}
          </section>

          <GameProgress 
            articleStates={articleStates}
            currentArticleIndex={currentArticleIndex}
          />
        </>
      )}

      {/* Game Completed */}
      {gameCompleted && (
        <GameCompletion 
          articleStates={articleStates}
          totalArticles={puzzle.articles.length}
          score={calculateScore()}
          puzzleDate={puzzle.date}
          isArchive={isArchive}
          isReplayMode={isReplayMode}
          onPlayAgain={resetGame}
        />
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