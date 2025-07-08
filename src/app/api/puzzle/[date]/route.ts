import { NextRequest, NextResponse } from 'next/server';
import { PuzzlesRepository } from '../../../../../lib/db/puzzles';

interface RouteParams {
  params: {
    date: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { date } = params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    console.log(`📖 Fetching puzzle for date: ${date}`);

    // Fetch puzzle from database
    const puzzlesRepo = new PuzzlesRepository();
    const puzzle = await puzzlesRepo.getByDate(date);

    if (!puzzle) {
      return NextResponse.json(
        { 
          error: 'Puzzle not found for the specified date',
          date: date,
          suggestion: 'Use the /api/puzzle/generate endpoint to create a puzzle for this date'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      puzzle: {
        id: puzzle.id,
        date: puzzle.date,
        articles: puzzle.articles,
        created_at: puzzle.created_at
      }
    });

  } catch (error) {
    console.error('Puzzle retrieval error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}