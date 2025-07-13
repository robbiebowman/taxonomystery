import { forwardRef } from 'react'

interface GuessInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

const GuessInput = forwardRef<HTMLInputElement, GuessInputProps>(({ 
  value, 
  onChange, 
  onSubmit, 
  disabled = false 
}, ref) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSubmit()
  }

  return (
    <section className="newspaper-section">
      <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
        <label htmlFor="guess" style={{ 
          display: 'block',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Your Identification:
        </label>
        <input
          ref={ref}
          id="guess"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter the Wikipedia article name..."
          disabled={disabled}
          autoComplete="off"
          style={{
            width: '100%',
            maxWidth: '500px',
            marginBottom: '1.5rem',
            fontSize: '1.1rem',
            textAlign: 'center'
          }}
        />
        <div>
          <button 
            type="submit" 
            disabled={!value.trim() || disabled}
            className="button"
            style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minWidth: '200px'
            }}
          >
            Submit Answer
          </button>
        </div>
      </form>
      <p style={{ 
        textAlign: 'center',
        fontStyle: 'italic',
        color: 'var(--text-gray)',
        marginTop: '1rem'
      }}>
        <small>Try the exact article name or a close variant!</small>
      </p>
    </section>
  )
})

GuessInput.displayName = 'GuessInput'

export default GuessInput