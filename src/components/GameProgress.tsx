import type { ArticleState } from '@/lib/game/types'

interface GameProgressProps {
  articleStates: ArticleState[]
  currentArticleIndex: number
}

export default function GameProgress({ articleStates, currentArticleIndex }: GameProgressProps) {
  return (
    <section className="newspaper-section">
      <h3 style={{ 
        fontSize: '1.3rem',
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Edition Progress
      </h3>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {articleStates.map((state, index) => (
          <div 
            key={state.article.article_id}
            style={{
              padding: '0.5rem 1rem',
              border: '2px solid var(--border-gray)',
              backgroundColor: 
                state.wasCorrect ? 'var(--pastel-green)' : 
                state.isRevealed && !state.wasCorrect ? 'var(--pastel-red)' : 
                index === currentArticleIndex ? 'var(--pastel-yellow)' : 'var(--newsprint-gray)',
              borderColor:
                state.wasCorrect ? 'var(--pastel-green-border)' :
                state.isRevealed && !state.wasCorrect ? 'var(--pastel-red-border)' :
                index === currentArticleIndex ? 'var(--pastel-yellow-border)' : 'var(--border-gray)',
              fontWeight: index === currentArticleIndex ? 'bold' : 'normal',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {index + 1}
            {state.wasCorrect && ' ✓'}
            {state.isRevealed && !state.wasCorrect && ' ✗'}
          </div>
        ))}
      </div>
    </section>
  )
}