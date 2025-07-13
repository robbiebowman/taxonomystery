import Link from 'next/link'

interface SubtleNavLinkProps {
  href: string
  children: React.ReactNode
  position?: 'absolute' | 'static'
}

export default function SubtleNavLink({ href, children, position = 'absolute' }: SubtleNavLinkProps) {
  const baseStyles = {
    fontSize: '0.7rem',
    padding: '0.4rem 0.8rem',
    opacity: '0.6',
    background: 'var(--newsprint-gray)',
    color: 'var(--text-gray)',
    borderColor: 'var(--border-gray)',
    transition: 'opacity 0.2s ease'
  }

  const positionStyles = position === 'absolute' ? {
    position: 'absolute' as const,
    right: '0',
    top: '35%',
    transform: 'translateY(-50%)'
  } : {}

  return (
    <Link 
      href={href} 
      className="button" 
      style={{ 
        ...baseStyles,
        ...positionStyles
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.6'
      }}
    >
      {children}
    </Link>
  )
}