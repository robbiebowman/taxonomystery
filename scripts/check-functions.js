#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunctions() {
  console.log('🔍 Checking if SQL functions exist...\n');
  
  // Test if create_puzzle_with_articles function exists
  console.log('Testing create_puzzle_with_articles...');
  const { data: createResult, error: createError } = await supabase.rpc('create_puzzle_with_articles', {
    puzzle_date: '2024-01-01',
    puzzle_articles_data: []
  });
  
  if (createError) {
    console.log('❌ create_puzzle_with_articles ERROR:', createError.message);
  } else {
    console.log('✅ create_puzzle_with_articles EXISTS');
  }
  
  // Test if get_puzzle_with_articles function exists  
  console.log('\nTesting get_puzzle_with_articles...');
  const { data: getResult, error: getError } = await supabase.rpc('get_puzzle_with_articles', {
    puzzle_date: '2024-01-01'
  });
  
  if (getError) {
    console.log('❌ get_puzzle_with_articles ERROR:', getError.message);
  } else {
    console.log('✅ get_puzzle_with_articles EXISTS');
  }
}

checkFunctions().catch(console.error);