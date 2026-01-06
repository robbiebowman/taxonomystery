interface ArticleResultProps {
  wasCorrect: boolean
  userGuess: string
}

export default function ArticleResult({ wasCorrect, userGuess }: ArticleResultProps) {
  const headline = wasCorrect
    ? 'Local Hero Correctly Identifies Article'
    : 'Local Hero Misidentifies Article'
  const subheadline = wasCorrect
    ? 'Witnesses report a confident guess and a triumphant finish.'
    : 'Sources confirm the guess fell short, prompting a prompt correction.'

  return (
    <div style={{ 
      padding: 'clamp(1rem, 3vw, 1.5rem)', 
      backgroundColor: wasCorrect ? 'var(--pastel-green)' : 'var(--pastel-red)',
      border: `3px solid ${wasCorrect ? 'var(--pastel-green-border)' : 'var(--pastel-red-border)'}`,
      borderTop: wasCorrect ? '3px double var(--newspaper-blue)' : undefined,
      borderBottom: wasCorrect ? '3px double var(--newspaper-blue)' : undefined,
      borderLeft: `6px solid ${wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)'}`,
      position: 'relative',
      boxShadow: wasCorrect ? 'inset 0 0 0 1px var(--newspaper-blue)' : 'none'
    }}>
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ 
          fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
          margin: '0 0 0.4rem 0',
          color: wasCorrect ? 'var(--newspaper-blue)' : 'var(--text-gray)',
          textTransform: 'uppercase',
          letterSpacing: 'clamp(0.02em, 0.5vw, 0.08em)',
          wordBreak: 'break-word',
          hyphens: 'auto'
        }}>
          {headline}
        </h3>
        <p style={{
          fontSize: '1rem',
          fontStyle: 'italic',
          margin: '0 0 0.75rem 0',
          color: 'var(--text-gray)'
        }}>
          {subheadline}
        </p>
        <p style={{ 
          fontSize: '1.05rem',
          margin: 0
        }}>
          Your answer: &quot;<strong>{userGuess}</strong>&quot;
        </p>
      </div>
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
