#!/usr/bin/env node

import { PuzzleGenerator } from '../lib/puzzleGenerator';
import { PuzzlesRepository } from '../lib/db/puzzles';

async function testPuzzleGeneration() {
  const generator = new PuzzleGenerator();
  const puzzlesRepo = new PuzzlesRepository();
  const testDate = '2024-02-04'; // Use a new test date for normalized structure

  console.log('🧪 Testing puzzle generation...\n');

  try {
    // Test puzzle generation
    console.log('1. Testing puzzle generation...');
    const result = await generator.generateDailyPuzzle(testDate);
    
    if (result.success) {
      console.log(`✅ Puzzle generation successful: ${result.message}`);
      console.log(`📊 Article count: ${result.articleCount}\n`);
    } else {
      console.log(`❌ Puzzle generation failed: ${result.message}\n`);
      return;
    }

    // Test idempotency
    console.log('2. Testing idempotency (should not create duplicate)...');
    const result2 = await generator.generateDailyPuzzle(testDate);
    
    if (result2.success && result2.message.includes('already exists')) {
      console.log(`✅ Idempotency test passed: ${result2.message}\n`);
    } else {
      console.log(`❌ Idempotency test failed: ${result2.message}\n`);
    }

    // Verify puzzle was stored correctly
    console.log('3. Verifying puzzle storage...');
    const puzzle = await puzzlesRepo.getByDate(testDate);
    
    if (puzzle) {
      console.log(`✅ Puzzle stored successfully`);
      console.log(`📅 Date: ${puzzle.date}`);
      console.log(`🆔 ID: ${puzzle.id}`);
      console.log(`📝 Articles: ${puzzle.articles.length}`);
      
      // Show sample article data
      if (puzzle.articles.length > 0) {
        const sampleArticle = puzzle.articles[0];
        console.log(`\n📄 Sample article: "${sampleArticle.title}"`);
        console.log(`   📂 Categories (${sampleArticle.categories.length}): ${sampleArticle.categories.slice(0, 3).join(', ')}${sampleArticle.categories.length > 3 ? '...' : ''}`);
        console.log(`   🏷️  Aliases (${sampleArticle.aliases.length}): ${sampleArticle.aliases.slice(0, 3).join(', ')}${sampleArticle.aliases.length > 3 ? '...' : ''}`);
      }
      
      console.log('\n🎉 All tests passed!');
      
    } else {
      console.log(`❌ Puzzle not found in database`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPuzzleGeneration();