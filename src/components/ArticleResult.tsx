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
      padding: 'clamp(0.75rem, 2vw, 1.25rem) 0',
      borderBottom: '1px solid var(--border-gray)',
      marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)'
    }}>
      <div style={{ textAlign: 'left' }}>
        <h2 style={{ 
          fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
          margin: '0 0 0.35rem 0',
          color: 'var(--ink-black)',
          textTransform: 'uppercase',
          letterSpacing: 'clamp(0.02em, 0.5vw, 0.1em)',
          wordBreak: 'break-word',
          hyphens: 'auto'
        }}>
          {headline}
        </h2>
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
          fontStyle: 'italic',
          margin: '0 0 0.75rem 0',
          color: 'var(--text-gray)'
        }}>
          {subheadline}
        </p>
        <p style={{ 
          fontSize: '0.95rem',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-gray)'
        }}>
          Your answer: <strong style={{ color: 'var(--ink-black)' }}>&quot;{userGuess}&quot;</strong>
        </p>
      </div>
    </div>
  )
}
