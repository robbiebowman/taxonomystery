'use client'

import { getTodayDate } from '@/lib/game/api'
import GameComponent from '@/components/GameComponent'

export default function GamePage() {
  const todayDate = getTodayDate()
  
  return <GameComponent puzzleDate={todayDate} />
}