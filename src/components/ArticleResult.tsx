interface ArticleResultProps {
  wasCorrect: boolean
  userGuess: string
}

export default function ArticleResult({ wasCorrect, userGuess }: ArticleResultProps) {
  return (
    <div style={{ 
      padding: 'clamp(1rem, 3vw, 1.5rem)', 
      backgroundColor: wasCorrect ? 'var(--pastel-green)' : 'var(--pastel-red)',
      backgroundImage: wasCorrect
        ? 'linear-gradient(140deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 60%)'
        : 'none',
      border: `3px solid ${wasCorrect ? 'var(--pastel-green-border)' : 'var(--pastel-red-border)'}`,
      textAlign: 'center',
      borderLeft: `6px solid ${wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)'}`,
      position: 'relative',
      boxShadow: wasCorrect ? '0 0.6rem 1.6rem rgba(34, 139, 84, 0.18)' : 'none'
    }}>
      {wasCorrect ? (
        <div>
          <h3 style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
            margin: '0 0 1rem 0',
            color: 'var(--newspaper-blue)',
            textTransform: 'uppercase',
            letterSpacing: 'clamp(0.02em, 0.5vw, 0.1em)',
            wordBreak: 'break-word',
            hyphens: 'auto'
          }}>
            ✓ CORRECT IDENTIFICATION
          </h3>
          <p style={{ 
            fontSize: '1.1rem',
            fontStyle: 'italic',
            margin: 0
          }}>
            Your answer: &quot;<strong>{userGuess}</strong>&quot;
          </p>
        </div>
      ) : (
        <div>
          <h3 style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
            margin: '0 0 1rem 0',
            color: 'var(--text-gray)',
            textTransform: 'uppercase',
            letterSpacing: 'clamp(0.02em, 0.5vw, 0.1em)',
            wordBreak: 'break-word',
            hyphens: 'auto'
          }}>
            ✗ MISIDEN&shy;TIFICATION
          </h3>
          <p style={{ 
            fontSize: '1.1rem',
            fontStyle: 'italic',
            margin: 0
          }}>
            Your answer: &quot;<strong>{userGuess}</strong>&quot;
          </p>
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          right: '0.75rem',
          bottom: '0.65rem',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          opacity: 0.6
        }}
      >
        {wasCorrect ? 'Verified' : 'Correction Issued'}
      </div>
    </div>
  )
}
