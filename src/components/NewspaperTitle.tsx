import Link from 'next/link'

interface NewspaperTitleProps {
  style?: React.CSSProperties
  href?: string
}

export default function NewspaperTitle({ style = {}, href = "/" }: NewspaperTitleProps) {
  const defaultStyle = {
    textTransform: 'uppercase' as const,
    letterSpacing: '-0.01em',
    wordBreak: 'break-word' as const,
    hyphens: 'auto' as const,
    textDecoration: 'none',
    color: 'inherit',
    display: 'block'
  }

  const combinedStyle = { ...defaultStyle, ...style }

  return (
    <Link href={href} style={combinedStyle}>
      The Daily Taxonomystery
    </Link>
  )
}