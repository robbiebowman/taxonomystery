import { NextRequest, NextResponse } from 'next/server';
import { PuzzleGenerator } from '../../../../../lib/puzzleGenerator';

export async function GET(request: NextRequest) {
  try {
    // Verify this is actually a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const date = today.toISOString().split('T')[0];

    console.log(`🕒 [CRON] Daily puzzle generation triggered for date: ${date}`);

    // Generate puzzle for today
    const generator = new PuzzleGenerator();
    const result = await generator.generateDailyPuzzle(date);

    // Return result
    if (result.success) {
      console.log(`✅ [CRON] Puzzle generated successfully for ${date}: ${result.message}`);
      
      return NextResponse.json({
        success: true,
        message: result.message,
        date: date,
        articleCount: result.articleCount,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`❌ [CRON] Puzzle generation failed for ${date}: ${result.message}`);
      
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          date: date,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [CRON] Daily puzzle cron error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}