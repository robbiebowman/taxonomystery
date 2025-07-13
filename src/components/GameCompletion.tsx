import Link from 'next/link'
import type { ArticleState } from '@/lib/game/types'
import { formatDateForDisplay } from '@/lib/game/api'

interface GameCompletionProps {
  articleStates: ArticleState[]
  totalArticles: number
  score: number
  puzzleDate: string
  isArchive?: boolean
  isReplayMode?: boolean
  onPlayAgain?: () => void
}

export default function GameCompletion({ 
  articleStates, 
  totalArticles, 
  score, 
  puzzleDate,
  isArchive = false,
  isReplayMode = false,
  onPlayAgain
}: GameCompletionProps) {
  const shareText = isArchive 
    ? `I scored ${score}/${totalArticles} on the ${formatDateForDisplay(puzzleDate)} Taxonomy Mystery archive edition!`
    : `I scored ${score}/${totalArticles} on today's Taxonomystery puzzle!`

  return (
    <section className="newspaper-section">
      <div className="newspaper-header" style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '2.2rem',
          margin: '0 0 1rem 0',
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          {isArchive ? 'Archive Edition Complete!' : 'Edition Complete!'}
        </h2>
        <div style={{ 
          fontSize: '1.4rem',
          fontWeight: 'bold',
          color: 'var(--gold-highlight)'
        }}>
          Final Score: {score} out of {totalArticles} correct
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
            text: shareText 
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
        
        {isReplayMode && onPlayAgain && (
          <button 
            onClick={onPlayAgain}
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
        
        {isArchive && (
          <Link href="/archive" className="button" style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            ← Return to Archive
          </Link>
        )}
      </div>
    </section>
  )
}