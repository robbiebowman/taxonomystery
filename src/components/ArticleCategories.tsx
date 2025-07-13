interface ArticleCategoriesProps {
  categories: string[]
}

export default function ArticleCategories({ categories }: ArticleCategoriesProps) {
  return (
    <div style={{ 
      padding: 'clamp(1rem, 4vw, 2rem)', 
      border: '3px solid var(--ink-black)', 
      backgroundColor: 'var(--paper-white)',
      borderStyle: 'double'
    }}>
      <h3 style={{ 
        textAlign: 'center',
        fontSize: '1.4rem',
        marginBottom: '1.5rem',
        fontStyle: 'italic',
        color: 'var(--text-gray)'
      }}>
        What Wikipedia article belongs to these categories?
      </h3>
      <div style={{ 
        columns: categories.length > 6 ? '2' : '1',
        columnGap: '2rem'
      }}>
        {categories.map((category, idx) => (
          <div key={idx} style={{ 
            marginBottom: '0.75rem',
            breakInside: 'avoid',
            fontSize: '1.1rem',
            borderBottom: '1px dotted var(--border-gray)',
            paddingBottom: '0.25rem'
          }}>
            <strong>• {category}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}