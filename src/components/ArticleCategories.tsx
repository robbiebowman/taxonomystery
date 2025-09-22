interface ArticleCategoriesProps {
  categories: string[]
}

export default function ArticleCategories({ categories }: ArticleCategoriesProps) {
  return (
    <div style={{ 
      padding: 'clamp(0.75rem, 3vw, 1.5rem)', 
      border: '1px solid var(--border-gray)', 
      backgroundColor: 'var(--paper-white)'
    }}>
      <h3 style={{ 
        textAlign: 'center',
        fontSize: '1.35rem',
        marginBottom: '1rem',
        fontStyle: 'italic',
        color: 'var(--text-gray)'
      }}>
        Identify the article:
      </h3>
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'center'
      }}>
        {categories.map((category, idx) => (
          <div key={idx} style={{ 
            display: 'inline-block',
            backgroundColor: 'var(--newsprint-gray)',
            border: '1px solid var(--border-gray)',
            borderRadius: '0.25rem',
            padding: '0.5rem 1rem',
            fontSize: '1.1rem',
            fontWeight: '500',
            textAlign: 'center',
            color: 'var(--foreground)',
            boxShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            {category}
          </div>
        ))}
      </div>
    </div>
  )
}
