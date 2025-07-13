import { useState, useEffect, useRef, useCallback } from 'react'
import { saveScore, savePartialProgress, getStoredScore, type StoredScore, type StoredAnswer } from '../../../lib/localStorage'
import { fetchPuzzle } from './api'
import { validateGuess } from './textMatching'
import type { Puzzle, ArticleState } from './types'

interface UseGameLogicProps {
  puzzleDate: string
  onError: (error: string) => void
}

export function useGameLogic({ puzzleDate, onError }: UseGameLogicProps) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentGuess, setCurrentGuess] = useState('')
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0)
  const [articleStates, setArticleStates] = useState<ArticleState[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [isReplayMode, setIsReplayMode] = useState(false)
  const [storedScore, setStoredScore] = useState<StoredScore | null>(null)
  const guessInputRef = useRef<HTMLInputElement>(null)

  // Load puzzle on component mount
  useEffect(() => {
    if (!puzzleDate) return // Don't load if no date provided
    
    async function loadPuzzle() {
      try {
        setLoading(true)
        
        const puzzleData = await fetchPuzzle(puzzleDate)
        
        if (!puzzleData) {
          onError(`No puzzle available for this date. Check back later!`)
        } else {
          setPuzzle(puzzleData)
          
          // Check for existing stored score
          const existingScore = getStoredScore(puzzleDate)
          setStoredScore(existingScore)
          
          if (existingScore) {
            if (existingScore.isCompleted) {
              // Replay mode: restore completed game state
              setIsReplayMode(true)
              const restoredStates: ArticleState[] = puzzleData.articles.map((article, index) => {
                const storedAnswer = existingScore.answers[index]
                return {
                  article,
                  userGuess: storedAnswer?.guess || '',
                  isRevealed: !!storedAnswer,
                  wasCorrect: storedAnswer?.correct || false
                }
              })
              setArticleStates(restoredStates)
              setGameCompleted(true)
            } else {
              // Resume mode: restore partial progress
              const restoredStates: ArticleState[] = puzzleData.articles.map((article, index) => {
                const storedAnswer = existingScore.answers[index]
                // Only mark as revealed if there's actually a guess (not just empty answer object)
                const hasGuess = !!(storedAnswer && storedAnswer.guess && storedAnswer.guess.trim() !== '')
                return {
                  article,
                  userGuess: storedAnswer?.guess || '',
                  isRevealed: hasGuess,
                  wasCorrect: storedAnswer?.correct || false
                }
              })
              setArticleStates(restoredStates)
              setCurrentArticleIndex(existingScore.currentQuestionIndex)
            }
          } else {
            // First time playing: initialize fresh game state
            const initialStates: ArticleState[] = puzzleData.articles.map(article => ({
              article,
              userGuess: '',
              isRevealed: false,
              wasCorrect: false
            }))
            setArticleStates(initialStates)
          }
        }
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to load puzzle')
      } finally {
        setLoading(false)
      }
    }
    
    loadPuzzle()
  }, [puzzleDate, onError])

  const calculateScore = useCallback(() => {
    return articleStates.filter(state => state.wasCorrect).length
  }, [articleStates])

  const saveGameScore = useCallback(() => {
    if (!puzzle || isReplayMode) return // Don't save scores for replays
    
    const score = calculateScore()
    const storedAnswers: StoredAnswer[] = articleStates.map(state => ({
      guess: state.userGuess,
      correct: state.wasCorrect,
      article_title: state.article.title
    }))
    
    const scoreData: StoredScore = {
      date: puzzle.date,
      score,
      totalQuestions: puzzle.articles.length,
      completedAt: new Date().toISOString(),
      answers: storedAnswers,
      isCompleted: true,
      currentQuestionIndex: puzzle.articles.length - 1
    }
    
    const saved = saveScore(scoreData)
    if (saved) {
      setStoredScore(scoreData)
    }
  }, [puzzle, articleStates, isReplayMode, calculateScore])

  const handleNextArticle = useCallback(() => {
    if (currentArticleIndex < articleStates.length - 1) {
      setCurrentArticleIndex(currentArticleIndex + 1)
    } else {
      setGameCompleted(true)
      // Save score when game completes (only for first-time plays)
      if (!isReplayMode) {
        saveGameScore()
      }
    }
  }, [currentArticleIndex, articleStates.length, isReplayMode, saveGameScore])

  const handleSubmitGuess = useCallback(() => {
    if (!currentGuess.trim() || !puzzle || gameCompleted) return

    const currentArticle = articleStates[currentArticleIndex]
    if (!currentArticle || currentArticle.isRevealed) return

    const guess = currentGuess.trim()
    const isCorrect = validateGuess(guess, currentArticle.article.title, currentArticle.article.aliases)
    
    // Update the article state with the guess and result
    const newArticleStates = [...articleStates]
    newArticleStates[currentArticleIndex] = {
      ...currentArticle,
      userGuess: guess,
      isRevealed: true,
      wasCorrect: isCorrect
    }
    setArticleStates(newArticleStates)
    setCurrentGuess('')
    
    // Save partial progress immediately with the new state
    if (!isReplayMode && puzzle) {
      const score = newArticleStates.filter(state => state.wasCorrect).length
      const storedAnswers: StoredAnswer[] = newArticleStates.map(state => ({
        guess: state.isRevealed ? state.userGuess : '', // Only save guess if revealed
        correct: state.wasCorrect,
        article_title: state.article.title
      }))
      
      const scoreData: StoredScore = {
        date: puzzle.date,
        score,
        totalQuestions: puzzle.articles.length,
        completedAt: new Date().toISOString(),
        answers: storedAnswers,
        isCompleted: false,
        currentQuestionIndex: currentArticleIndex
      }
      
      const saved = savePartialProgress(scoreData)
      if (saved) {
        setStoredScore(scoreData)
      }
    }
  }, [currentGuess, puzzle, gameCompleted, articleStates, currentArticleIndex, isReplayMode])

  const resetGame = useCallback(() => {
    if (!puzzle) return
    
    setIsReplayMode(false)
    setGameCompleted(false)
    setCurrentArticleIndex(0)
    setCurrentGuess('')
    const freshStates: ArticleState[] = puzzle.articles.map(article => ({
      article,
      userGuess: '',
      isRevealed: false,
      wasCorrect: false
    }))
    setArticleStates(freshStates)
  }, [puzzle])

  // Auto-focus input when user starts typing and handle Enter key for navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't interfere if user is already focused on an input or if game is completed
      if (document.activeElement?.tagName === 'INPUT' || gameCompleted) return
      
      const currentArticle = articleStates[currentArticleIndex]
      
      // Handle Enter key to advance to next article when answer is revealed
      if (e.key === 'Enter' && currentArticle && currentArticle.isRevealed) {
        e.preventDefault()
        handleNextArticle()
        return
      }
      
      // Only focus on printable characters (letters, numbers, space, etc.)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (currentArticle && !currentArticle.isRevealed && guessInputRef.current) {
          guessInputRef.current.focus()
          // Append the typed character to existing input
          setCurrentGuess(prev => prev + e.key)
        }
      }
    }

    document.addEventListener('keypress', handleKeyPress)
    return () => document.removeEventListener('keypress', handleKeyPress)
  }, [gameCompleted, articleStates, currentArticleIndex, handleNextArticle])

  return {
    puzzle,
    loading,
    currentGuess,
    setCurrentGuess,
    currentArticleIndex,
    articleStates,
    gameCompleted,
    isReplayMode,
    storedScore,
    guessInputRef,
    calculateScore,
    handleNextArticle,
    handleSubmitGuess,
    resetGame
  }
}