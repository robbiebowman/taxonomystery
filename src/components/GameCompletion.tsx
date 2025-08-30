import { useState } from 'react'
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
  const [buttonText, setButtonText] = useState('📋 Copy Results')

  const createShareText = () => {
    // Create emoji grid showing right/wrong answers
    const emojiGrid = articleStates.map(state => state.wasCorrect ? '🟢' : '🔴').join('')
    
    // Create dynamic archive URL based on current host
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const archiveUrl = `${currentUrl}/archive/${puzzleDate}`
    
    // Build the share text
    const dateText = isArchive ? formatDateForDisplay(puzzleDate) : 'Today'
    const header = `📰 The Daily Taxonomystery - ${dateText}`
    const scoreText = `Score: ${score}/${totalArticles}`
    const gridText = emojiGrid
    const linkText = `🔗 ${archiveUrl}`
    
    return `${header}\n${scoreText}\n${gridText}\n\n${linkText}`
  }

  const handleShare = async () => {
    const shareText = createShareText()
    
    // Try to copy to clipboard first
    try {
      await navigator.clipboard.writeText(shareText)
      setButtonText('✅ Copied!')
      
      // Reset button text after 2 seconds
      setTimeout(() => {
        setButtonText('📋 Copy Results')
      }, 2000)
    } catch {
      console.log('Clipboard failed, trying native share')
      
      // Fallback to native share if available
      if (navigator.share) {
        try {
          await navigator.share({ 
            title: 'The Daily Taxonomystery', 
            text: shareText 
          })
        } catch {
          console.log('Native share cancelled or failed')
        }
      }
    }
  }

  return (
    <section className="newspaper-section">
      <div className="newspaper-header" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <h2 style={{ 
            fontSize: '2.2rem',
            margin: '0 0 1rem 0',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            {isArchive ? 'Archive Edition Complete!' : 'Edition Complete!'}
          </h2>
        </div>
        
        <div style={{ 
          fontSize: '1.4rem',
          fontWeight: 'bold'
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
              <strong style={{ fontSize: '1.2rem' }}>
                {index + 1}. 
                <a 
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(state.article.title.replace(/ /g, '_'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--newspaper-blue)',
                    textDecoration: 'underline',
                    marginLeft: '0.25rem'
                  }}
                >
                  {state.article.title}
                </a>
              </strong>
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
          onClick={handleShare}
          className="button"
          style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: 'var(--action-bg)',
            color: 'var(--action-fg)',
            borderColor: 'var(--action-bg)'
          }}
        >
          {buttonText}
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
      </div>
    </section>
  )
}
