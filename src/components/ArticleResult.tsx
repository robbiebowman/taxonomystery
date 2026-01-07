interface ArticleResultProps {
  wasCorrect: boolean
  userGuess: string
}

export default function ArticleResult({ wasCorrect, userGuess }: ArticleResultProps) {
  return (
    <div className="article-result" style={{
      padding: 'clamp(1rem, 3vw, 1.5rem)', 
      backgroundColor: wasCorrect ? 'var(--pastel-green)' : 'var(--pastel-red)',
      border: `1px solid ${wasCorrect ? 'var(--pastel-green-border)' : 'var(--pastel-red-border)'}`,
      textAlign: 'left',
      position: 'relative',
      marginTop: '1.5rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    }}>
      <style>{`
        @keyframes spinSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .sunburst {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 200vmax;
          height: 200vmax;
          background: repeating-conic-gradient(
            from 0deg,
            #90EE90 0deg 15deg,
            #98FB98 15deg 30deg
          );
          opacity: 0.15;
          animation: spinSlow 60s linear infinite;
          pointer-events: none;
          z-index: -1;
        }
      `}</style>

      {wasCorrect && <div className="sunburst" aria-hidden="true" />}

      {/* Newspaper Header Style for the Result */}
      <div style={{
        borderBottom: `2px solid ${wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)'}`,
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <h3 style={{
          margin: 0,
          fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
          fontWeight: 800,
          color: wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          lineHeight: 1.1,
          fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
          borderBottom: 'none',
          paddingBottom: 0
        }}>
          {wasCorrect ? 'MYSTERY SOLVED!' : 'IDENTITY MISTAKEN'}
        </h3>
        <span style={{
          fontSize: '0.9rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color: 'var(--text-gray)',
          border: '1px solid var(--border-gray)',
          padding: '0.25rem 0.5rem',
          backgroundColor: 'var(--paper-white)'
        }}>
          {wasCorrect ? 'BREAKING NEWS' : 'UPDATE'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
             {/* Dateline */}
            <p style={{
              fontSize: '1rem',
              lineHeight: 1.5,
              marginBottom: '0.5rem',
              fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
              margin: 0
            }}>
              <strong style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-gray)' }}>WIKIPEDIA CITY — </strong>
              {wasCorrect ? (
                <>
                  In a stunning display of knowledge, the mystery article has been identified as <strong>{userGuess}</strong>. Experts confirm the finding is accurate.
                </>
              ) : (
                <>
                  Reports that the article was <strong>{userGuess}</strong> have been proven false. The search for the truth continues as investigators review the evidence.
                </>
              )}
            </p>
        </div>

        {/* Stamp / Badge */}
        <div style={{
          flexShrink: 0,
          transform: 'rotate(-10deg)',
          border: `3px double ${wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)'}`,
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          color: wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)',
          fontWeight: 900,
          textTransform: 'uppercase',
          fontSize: '1.2rem',
          letterSpacing: '0.1em',
          opacity: 0.8,
          alignSelf: 'center',
          mixBlendMode: 'multiply',
          backgroundColor: wasCorrect ? 'rgba(255,255,255,0.8)' : 'transparent', // Ensure legibility over sunburst
          boxShadow: wasCorrect ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
        }}>
          {wasCorrect ? 'VERIFIED' : 'REJECTED'}
        </div>
      </div>
    </div>
  )
}
