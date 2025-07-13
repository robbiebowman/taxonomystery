import { getTodayDate } from '@/lib/game/api'

import NewspaperTitle from '@/components/NewspaperTitle'

interface LoadingStateProps {
  isArchive?: boolean
  date?: string
}

export default function LoadingState({ isArchive = false, date }: LoadingStateProps) {
  const displayDate = date || getTodayDate()
  
  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: 'clamp(1rem, 4vw, 2rem)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Newspaper Header - matches the main layout */}
      <header className="newspaper-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
          margin: '0 0 0.5rem 0'
        }}>
          <NewspaperTitle />
        </h1>
        <div style={{ 
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: 'var(--text-gray)',
          fontFamily: 'var(--font-mono)'
        }}>
          {displayDate} • PREPARING {isArchive ? 'ARCHIVE' : 'TODAY\'S'} EDITION
        </div>
      </header>

      {/* Loading content that matches the game layout */}
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
          padding: 'clamp(1rem, 4vw, 2rem)', 
          border: '3px solid var(--border-gray)', 
          backgroundColor: 'var(--newsprint-gray)',
          borderStyle: 'double',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: '1.4rem',
            marginBottom: '1.5rem',
            fontStyle: 'italic',
            color: 'var(--text-gray)'
          }}>
            {isArchive ? 'Retrieving archive edition...' : 'Preparing today\'s puzzle...'}
          </h3>
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'var(--border-gray)',
                  borderRadius: '50%',
                  animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite alternate`
                }}
              />
            ))}
          </div>
          <p style={{ 
            fontSize: '1rem',
            color: 'var(--text-gray)',
            fontStyle: 'italic',
            margin: 0
          }}>
            Fetching articles and categories from Wikipedia...
          </p>
        </div>
      </section>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}