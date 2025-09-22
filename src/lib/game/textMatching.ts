import { decideAnswer, FuzzyDecision } from './fuzzyScoring'

export function scoreGuess(guess: string, title: string, aliases: string[]): FuzzyDecision {
  return decideAnswer(title, guess, aliases)
}

export function validateGuess(guess: string, title: string, aliases: string[]): boolean {
  return scoreGuess(guess, title, aliases).accepted
}

