#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');
  
  // Check daily_puzzles structure
  console.log('📅 daily_puzzles columns:');
  const { data: puzzlesData, error: puzzlesError } = await supabase
    .from('daily_puzzles')
    .select('*')
    .limit(1);
  
  if (puzzlesError) {
    console.log('❌ Error:', puzzlesError.message);
  } else if (puzzlesData.length > 0) {
    console.log('Columns:', Object.keys(puzzlesData[0]));
  } else {
    console.log('No data, but table exists');
  }
  
  // Check puzzle_articles structure
  console.log('\n🧩 puzzle_articles columns:');
  const { data: articlesData, error: articlesError } = await supabase
    .from('puzzle_articles')
    .select('*')
    .limit(1);
  
  if (articlesError) {
    console.log('❌ Error:', articlesError.message);
  } else if (articlesData.length > 0) {
    console.log('Columns:', Object.keys(articlesData[0]));
  } else {
    console.log('No data, but table exists');
  }
}

checkSchema().catch(console.error);