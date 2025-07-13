import SubtleNavLink from '@/components/SubtleNavLink'

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
  // Format date more compactly (e.g., "Jul 8, 2025" instead of full format)
  const formatCompactDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // Create a single status line combining article progress and game state
  const getStatusLine = () => {
    const articleInfo = currentArticleIndex !== undefined && totalArticles 
      ? `Article ${currentArticleIndex + 1}/${totalArticles}`
      : 'Loading...'

    if (replayInfo?.isReplayMode) {
      return `${articleInfo} • Replay Mode (${replayInfo.score}/${replayInfo.totalQuestions})`
    }
    
    if (resumeInfo && resumeInfo.answeredCount > 0) {
      return `${articleInfo} • Resuming (${resumeInfo.answeredCount}/${resumeInfo.totalQuestions} answered)`
    }
    
    return articleInfo
  }

  return (
    <header className="newspaper-header" style={{ marginBottom: '1.5rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'relative' }}>
            <h1 style={{ 
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              margin: '0 0 0.25rem 0',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              wordBreak: 'break-word',
              hyphens: 'auto',
              lineHeight: 1.1
            }}>
              The Daily Taxonomystery
            </h1>
            
            {/* Archive link positioned next to title */}
            {(showBackToArchive || showArchiveLink) && (
              <SubtleNavLink href="/archive">
                ← Archive
              </SubtleNavLink>
            )}
          </div>
          
          <div style={{ 
            fontSize: '0.95rem',
            color: 'var(--text-gray)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold'
          }}>
            {subtitle ? (
              <>
                <span style={{ fontStyle: 'italic' }}>Archive:</span> {formatCompactDate(date)} • {getStatusLine()}
              </>
            ) : (
              <>
                {formatCompactDate(date)} • {getStatusLine()}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}