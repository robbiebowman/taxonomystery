import React from 'react'

interface ScoreBadgeProps {
  score?: number
  totalQuestions?: number
  isAttempted: boolean
  isCompleted?: boolean
  answeredCount?: number
  style?: React.CSSProperties
}

export default function ScoreBadge({ score, totalQuestions, isAttempted, isCompleted, answeredCount, style }: ScoreBadgeProps) {
  if (!isAttempted) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.5rem',
        backgroundColor: 'var(--newsprint-gray)',
        border: '1px solid var(--border-gray)',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        color: 'var(--text-gray)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...style
      }}>
        ○ Not Attempted
      </div>
    )
  }

  // Show partial progress if not completed
  if (isAttempted && isCompleted === false && answeredCount !== undefined && totalQuestions !== undefined) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        backgroundColor: 'var(--pastel-yellow)',
        border: '2px solid var(--pastel-yellow-border)',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        color: 'var(--ink-black)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...style
      }}>
        <span>▶</span>
        <span>{answeredCount}/{totalQuestions} Done</span>
      </div>
    )
  }

  if (score === undefined || totalQuestions === undefined) {
    return null
  }

  // Calculate percentage for color coding
  const percentage = (score / totalQuestions) * 100
  
  // Determine colors based on performance
  let backgroundColor: string
  let textColor: string
  let borderColor: string
  let symbol: string

  if (percentage >= 80) {
    backgroundColor = 'var(--newsprint-gray)'
    textColor = 'var(--gold-highlight)'
    borderColor = 'var(--gold-highlight)'
    symbol = '★'
  } else if (percentage >= 60) {
    backgroundColor = 'var(--paper-white)'
    textColor = 'var(--newspaper-blue)'
    borderColor = 'var(--newspaper-blue)'
    symbol = '✓'
  } else if (percentage >= 40) {
    backgroundColor = 'var(--paper-white)'
    textColor = 'var(--text-gray)'
    borderColor = 'var(--text-gray)'
    symbol = '△'
  } else {
    backgroundColor = 'var(--paper-white)'
    textColor = 'var(--text-gray)'
    borderColor = 'var(--border-gray)'
    symbol = '○'
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.25rem 0.5rem',
      backgroundColor,
      border: `2px solid ${borderColor}`,
      fontSize: '0.75rem',
      fontWeight: 'bold',
      color: textColor,
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      ...style
    }}>
      <span>{symbol}</span>
      <span>{score}/{totalQuestions}</span>
    </div>
  )
}