import Link from "next/link";

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '2rem',
      background: 'var(--background)'
    }}>
      <main style={{ 
        textAlign: 'center',
        maxWidth: '1000px',
        width: '100%'
      }}>
        <div className="newspaper-header">
          <h1 style={{ 
            fontSize: 'clamp(2rem, 8vw, 3.5rem)', 
            fontWeight: 'bold',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            wordBreak: 'break-word',
            hyphens: 'auto'
          }}>
            The Daily Taxonomystery
          </h1>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--newspaper-blue)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            fontWeight: 'bold'
          }}>
            ESTABLISHED 2025 • DAILY EDITION
          </div>
        </div>

        <div className="newspaper-section" style={{ 
          textAlign: 'center',
          margin: '2rem 0'
        }}>
          <h2 style={{ 
            fontSize: '1.8rem',
            marginBottom: '1rem',
            fontStyle: 'italic'
          }}>
            Daily Wikipedia Category Puzzle
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.7',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem auto'
          }}>
            Test your knowledge with today&apos;s challenge. Given a set of Wikipedia categories, can you identify which article they belong to? Each puzzle features 10 carefully selected articles for you to guess.
          </p>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link
              className="button"
              href="/game"
              style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                minWidth: '200px'
              }}
            >
              📰 Today&apos;s Puzzle
            </Link>
            <Link
              className="button"
              href="/archive"
              style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                minWidth: '200px',
                background: 'var(--newsprint-gray)',
                borderColor: 'var(--border-gray)',
                color: 'var(--text-gray)'
              }}
            >
              ← Archive
            </Link>
          </div>
        </div>

        <div style={{
          fontSize: '0.9rem',
          color: 'var(--text-gray)',
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '1rem 0',
          borderTop: '1px solid var(--border-gray)'
        }}>
          &quot;All the news that&apos;s fit to categorize&quot;
        </div>
      </main>
    </div>
  );
}
