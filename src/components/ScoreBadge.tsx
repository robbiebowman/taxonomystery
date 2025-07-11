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
        padding: '4px 8px',
        borderRadius: '12px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        fontSize: '12px',
        fontWeight: '500',
        color: '#6c757d',
        ...style
      }}>
        ⭕ Not attempted
      </div>
    )
  }

  // Show partial progress if not completed
  if (isAttempted && isCompleted === false && answeredCount !== undefined && totalQuestions !== undefined) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '12px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        fontSize: '12px',
        fontWeight: '600',
        color: '#856404',
        ...style
      }}>
        <span>⏸️</span>
        <span>{answeredCount}/{totalQuestions} answered</span>
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
  let emoji: string

  if (percentage >= 80) {
    backgroundColor = '#d4edda'
    textColor = '#155724'
    emoji = '🏆'
  } else if (percentage >= 60) {
    backgroundColor = '#d1ecf1'
    textColor = '#0c5460'
    emoji = '👍'
  } else if (percentage >= 40) {
    backgroundColor = '#fff3cd'
    textColor = '#856404'
    emoji = '👌'
  } else {
    backgroundColor = '#f8d7da'
    textColor = '#721c24'
    emoji = '💪'
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '12px',
      backgroundColor,
      fontSize: '12px',
      fontWeight: '600',
      color: textColor,
      ...style
    }}>
      <span>{emoji}</span>
      <span>{score}/{totalQuestions}</span>
    </div>
  )
}