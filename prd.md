# Taxonomystery - Product Requirements Document

## Overview
Taxonomystery is a daily guessing game where players identify Wikipedia articles using only their category tags as clues. Players get one guess per article and receive a score out of 10 at the end.

## Core Gameplay

### Daily Format
- **10 articles per day**: Each day presents a new set of 10 Wikipedia articles
- **One guess per article**: Players have a single attempt to identify each article
- **Category-based clues**: Only Wikipedia categories are shown as hints
- **Scoring**: Final score out of 10 based on correct guesses

### Guessing Mechanics
- **Fuzzy matching**: Accept misspellings and typos (e.g. "Loid Goerge" for "Lloyd George")
- **Alternate names**: Accept different valid names for the same entity (e.g. "Jimmy McGill" for "Saul Goodman")
- **Self-referential filtering**: Hide categories that mention the article's own name (e.g. don't show "Eiffel Tower Construction" for Eiffel Tower article)

## Features

### Game History
- **Past games**: Allow players to play previous days' puzzles
- **Score tracking**: Remember and display scores from all previously played days
- **Completion status**: Show which days have been attempted vs. not attempted
- **Progress visualization**: Clear indication of player's historical performance

### Results & Analytics
- **Personal scoring**: Display individual score for completed games
- **Score distribution**: Show how the player's score compares to all other players that day
- **Statistics**: Aggregate performance data across all games

## Technical Requirements

### Data Sources
- Wikipedia articles and their category data
- Daily puzzle generation system
- Score aggregation and distribution tracking

### Matching Algorithm
- Fuzzy string matching for typos and misspellings
- Alias/alternate name database for entities
- Category filtering to remove self-referential categories

### Persistence
- User score history storage
- Daily puzzle state management
- Global score distribution data
