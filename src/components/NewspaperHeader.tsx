import Link from 'next/link'

interface NewspaperHeaderProps {
  date: string
  currentArticleIndex?: number
  totalArticles?: number
  showArchiveLink?: boolean
  showBackToArchive?: boolean
  replayInfo?: {
    isReplayMode: boolean
    score?: number
    totalQuestions?: number
  }
  resumeInfo?: {
    answeredCount: number
    totalQuestions: number
  }
  subtitle?: string
}

export default function NewspaperHeader({ 
  date, 
  currentArticleIndex, 
  totalArticles, 
  showArchiveLink = false,
  showBackToArchive = false,
  replayInfo,
  resumeInfo,
  subtitle
}: NewspaperHeaderProps) {
  return (
    <header className="newspaper-header" style={{ marginBottom: '2rem' }}>
      {showBackToArchive && (
        <Link href="/archive" className="button" style={{ 
          fontSize: '0.9rem',
          marginBottom: '1rem',
          display: 'inline-block'
        }}>
          ← Return to Archive
        </Link>
      )}
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
      
      {subtitle && (
        <div style={{
          fontSize: '1.2rem',
          fontStyle: 'italic',
          color: 'var(--text-gray)',
          margin: '0 0 1rem 0'
        }}>
          {subtitle}
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ 
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: 'var(--text-gray)',
            fontFamily: 'var(--font-mono)'
          }}>
            {currentArticleIndex !== undefined && totalArticles ? 
              `${date} • ARTICLE ${currentArticleIndex + 1} OF ${totalArticles}` :
              `${date} • PREPARING TODAY'S EDITION`
            }
          </div>
          
          {replayInfo?.isReplayMode && (
            <div style={{ 
              color: 'var(--text-gray)', 
              fontStyle: 'italic',
              fontSize: '0.9rem',
              marginTop: '0.5rem'
            }}>
              REPLAY EDITION - Previous score: {replayInfo.score}/{replayInfo.totalQuestions}
            </div>
          )}
          
          {resumeInfo && (
            <div style={{ 
              color: 'var(--accent-red)', 
              fontStyle: 'italic',
              fontSize: '0.9rem',
              marginTop: '0.5rem',
              fontWeight: 'bold'
            }}>
              CONTINUING EDITION - {resumeInfo.answeredCount}/{resumeInfo.totalQuestions} answered
            </div>
          )}
        </div>
        
        {showArchiveLink && (
          <Link href="/archive" className="button" style={{ fontSize: '0.9rem' }}>
            📚 Archive
          </Link>
        )}
      </div>
    </header>
  )
}