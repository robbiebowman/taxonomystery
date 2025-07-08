#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixIndexIssue() {
  console.log('🔧 Fixing problematic JSONB index...');

  try {
    // Try to drop the problematic index
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'DROP INDEX IF EXISTS idx_daily_puzzles_articles;'
    });

    if (error) {
      console.log('⚠️  Could not drop index automatically. Manual action needed.');
      console.log('\n📝 Run this SQL in your Supabase SQL Editor:');
      console.log('DROP INDEX IF EXISTS idx_daily_puzzles_articles;');
    } else {
      console.log('✅ Problematic index removed successfully');
    }

  } catch (error) {
    console.log('⚠️  Automatic index removal failed. Manual action needed.');
    console.log('\n📝 Run this SQL in your Supabase SQL Editor:');
    console.log('DROP INDEX IF EXISTS idx_daily_puzzles_articles;');
  }
}

fixIndexIssue();