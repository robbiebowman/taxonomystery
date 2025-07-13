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
              <ArticleCategories categories={currentArticle.article.categories} />
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
              </>
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