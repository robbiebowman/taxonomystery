interface ArticleDetailsProps {
  title: string
  snippet?: string
  imageUrl?: string
}

export default function ArticleDetails({ title, snippet, imageUrl }: ArticleDetailsProps) {
  if (!snippet && !imageUrl) return null

  return (
    <div style={{ 
      padding: 'clamp(0.75rem, 2.5vw, 1.5rem)', 
      backgroundColor: 'var(--paper-white)', 
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        gap: 'clamp(0.5rem, 2vw, 1.5rem)', 
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        width: '100%',
        maxWidth: '100%'
      }}>
        {imageUrl && (
          <div style={{ 
            flexShrink: 0,
            maxWidth: 'clamp(120px, 30vw, 200px)'
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageUrl} 
              alt={title}
              className="color-image"
              style={{ 
                width: '100%',
                height: 'auto',
                maxWidth: '100%',
                border: '2px solid var(--border-gray)',
                objectFit: 'cover'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div style={{ 
          flex: 1, 
          minWidth: '200px',
          maxWidth: '100%'
        }}>
          {snippet && (
            <div>
              <h4 style={{ 
                marginTop: 0, 
                marginBottom: '0.5rem', 
                color: 'var(--ink-black)', 
                fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', 
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                wordBreak: 'break-word',
                hyphens: 'auto'
              }}>
                Article Summary: {title}
              </h4>
              <p style={{ 
                lineHeight: '1.6', 
                color: 'var(--text-gray)',
                margin: '0 0 1rem 0',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                textAlign: 'justify',
                wordWrap: 'break-word',
                hyphens: 'auto'
              }}>
                {snippet}
              </p>
            </div>
          )}
          <a 
            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-block',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            📖 Read Full Article →
          </a>
        </div>
      </div>
    </div>
  )
}
