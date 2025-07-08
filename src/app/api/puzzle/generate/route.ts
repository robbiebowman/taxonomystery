import { NextRequest, NextResponse } from 'next/server';
import { PuzzleGenerator } from '../../../../../lib/puzzleGenerator';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { date } = body;

    // Validate date parameter
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    console.log(`🎯 Puzzle generation request for date: ${date}`);

    // Generate puzzle
    const generator = new PuzzleGenerator();
    const result = await generator.generateDailyPuzzle(date);

    // Return result
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        date: date,
        articleCount: result.articleCount
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          date: date
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Puzzle generation endpoint error:', error);
    
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

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with a date parameter.' },
    { status: 405 }
  );
}