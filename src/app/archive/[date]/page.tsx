'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const onError = useCallback((err: string) => {
    if (date) {
      setError(`No puzzle available for ${formatDateForDisplay(date)}. This puzzle may not have been created yet.`)
    } else {
      setError(err)
    }
  }, [date])

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
    puzzleDate: date, 
    onError: onError
  })

  // Loading state
  if (loading || !date) {
    return <LoadingState isArchive={true} date={date} />
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
      <NewspaperHeader 
        date={puzzle.date}
        currentArticleIndex={currentArticleIndex}
        totalArticles={puzzle.articles.length}
        showBackToArchive={true}
        subtitle={`ARCHIVE EDITION: ${formatDateForDisplay(puzzle.date).toUpperCase()}`}
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

      <GameProgress 
        articleStates={articleStates}
        currentArticleIndex={currentArticleIndex}
      />

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
            
            {!currentArticle.isRevealed ? (
              <ArticleCategories categories={currentArticle.article.categories} />
            ) : (
              <ArticleResult 
                wasCorrect={currentArticle.wasCorrect}
                userGuess={currentArticle.userGuess}
              />
            )}

            {/* Article snippet and image */}
            {currentArticle.isRevealed && (
              <ArticleDetails 
                title={currentArticle.article.title}
                snippet={currentArticle.article.snippet}
                imageUrl={currentArticle.article.image_url}
              />
            )}
          </section>

          {!currentArticle.isRevealed ? (
            <GuessInput
              ref={guessInputRef}
              value={currentGuess}
              onChange={setCurrentGuess}
              onSubmit={handleSubmitGuess}
              disabled={gameCompleted}
            />
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
        <GameCompletion 
          articleStates={articleStates}
          totalArticles={puzzle.articles.length}
          score={calculateScore()}
          puzzleDate={puzzle.date}
          isArchive={true}
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