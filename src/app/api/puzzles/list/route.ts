import { NextResponse } from 'next/server';
import { PuzzlesRepository } from '../../../../../lib/db/puzzles';

export async function GET() {
  try {
    console.log('📋 Fetching all available puzzle dates');

    // Fetch all puzzles from database
    const puzzlesRepo = new PuzzlesRepository();
    const puzzles = await puzzlesRepo.list();

    console.log(`✅ Found ${puzzles.length} available puzzles`);

    return NextResponse.json({
      success: true,
      puzzles: puzzles
    });

  } catch (error) {
    console.error('Puzzle list retrieval error:', error);
    
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