#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectCreation() {
  console.log('🧪 Testing direct puzzle creation with normalized structure...\n');
  
  const testDate = '2024-02-05';
  const testArticles = [
    {
      article_id: 1001,
      title: "Test Article 1",
      categories: ["Science", "Technology"],
      aliases: ["TA1", "Test1"]
    },
    {
      article_id: 1002, 
      title: "Test Article 2",
      categories: ["History", "Culture", "Ancient History"],
      aliases: ["TA2", "Test2", "Historical Test"]
    }
  ];
  
  console.log('1. Testing create_puzzle_with_articles function...');
  const { data: createResult, error: createError } = await supabase.rpc('create_puzzle_with_articles', {
    puzzle_date: testDate,
    puzzle_articles_data: testArticles
  });
  
  if (createError) {
    console.log('❌ Create failed:', createError.message);
    return;
  }
  
  console.log('✅ Puzzle created with ID:', createResult);
  
  console.log('\n2. Checking puzzle_articles table directly...');
  const { data: articlesData, error: articlesError } = await supabase
    .from('puzzle_articles')
    .select('*')
    .eq('puzzle_id', createResult);
    
  if (articlesError) {
    console.log('❌ Articles query failed:', articlesError.message);
  } else {
    console.log('✅ Articles in puzzle_articles:', articlesData.length);
    articlesData.forEach((article, i) => {
      console.log(`   ${i+1}. ${article.title} (ID: ${article.article_id})`);
      console.log(`      Categories: ${JSON.stringify(article.categories)}`);
      console.log(`      Aliases: ${JSON.stringify(article.aliases)}`);
    });
  }
  
  console.log('\n3. Checking daily_puzzles table...');
  const { data: puzzleData, error: puzzleError } = await supabase
    .from('daily_puzzles')
    .select('*')
    .eq('date', testDate)
    .single();
    
  if (puzzleError) {
    console.log('❌ Puzzle query failed:', puzzleError.message);
  } else {
    console.log('✅ Puzzle in daily_puzzles:');
    console.log(`   ID: ${puzzleData.id}`);
    console.log(`   Date: ${puzzleData.date}`);
    console.log(`   Article Count: ${puzzleData.article_count}`);
    console.log(`   Created At: ${puzzleData.created_at}`);
  }
  
  console.log('\n4. Testing get_puzzle_with_articles function...');
  const { data: getResult, error: getError } = await supabase.rpc('get_puzzle_with_articles', {
    puzzle_date: testDate
  });
  
  if (getError) {
    console.log('❌ Get failed:', getError.message);
  } else {
    console.log('✅ Get function works! Result:', JSON.stringify(getResult, null, 2));
  }
}

testDirectCreation().catch(console.error);