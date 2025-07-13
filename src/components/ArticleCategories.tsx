interface ArticleCategoriesProps {
  categories: string[]
}

export default function ArticleCategories({ categories }: ArticleCategoriesProps) {
  return (
    <div style={{ 
      padding: 'clamp(1rem, 4vw, 2rem)', 
      border: '1px solid #ccc', 
      backgroundColor: 'var(--paper-white)'
    }}>
      <h3 style={{ 
        textAlign: 'center',
        fontSize: '1.4rem',
        marginBottom: '1.5rem',
        fontStyle: 'italic',
        color: 'var(--text-gray)'
      }}>
        Identify the article:
      </h3>
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        justifyContent: 'center'
      }}>
        {categories.map((category, idx) => (
          <div key={idx} style={{ 
            display: 'inline-block',
            backgroundColor: '#f8f8f8',
            border: '1px solid #888',
            borderRadius: '0.25rem',
            padding: '0.75rem 1.25rem',
            fontSize: '1.2rem',
            fontWeight: '500',
            textAlign: 'center',
            boxShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            {category}
          </div>
        ))}
      </div>
    </div>
  )
}