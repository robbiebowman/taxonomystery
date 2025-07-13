import type { Puzzle } from './types'

export async function fetchPuzzle(date: string): Promise<Puzzle | null> {
  try {
    const response = await fetch(`/api/puzzle/${date}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        // Puzzle doesn't exist for this date
        return null
      }
      throw new Error(`Failed to fetch puzzle: ${response.status}`)
    }
    
    const data = await response.json()
    return data.puzzle
  } catch (error) {
    console.error('Error fetching puzzle:', error)
    throw error
  }
}

export function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateForDisplay(dateStr: string): string {
  try {
    // Parse as local date to display the same calendar date everywhere
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch {
    return dateStr
  }
}