#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFunctions() {
  console.log('🔧 Creating missing database functions...');

  try {
    // Create increment_usage_count function
    const incrementUsageFunction = `
      CREATE OR REPLACE FUNCTION increment_usage_count(article_ids INTEGER[])
      RETURNS VOID AS $$
      BEGIN
        UPDATE articles 
        SET used_count = used_count + 1 
        WHERE id = ANY(article_ids);
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: incrementError } = await supabase.rpc('exec', { 
      sql: incrementUsageFunction 
    });

    if (incrementError) {
      console.log('⚠️  increment_usage_count function creation failed, trying direct SQL...');
      
      // Try using direct SQL execution
      const { error: directError } = await supabase.from('_sql').select('*').limit(0);
      
      if (directError) {
        console.log('❌ Cannot execute SQL functions. Trying alternative approach...');
        
        // Alternative: Use the direct SQL via REST
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({ sql: incrementUsageFunction })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
    }

    console.log('✅ increment_usage_count function created');

    // Create upsert_score_distribution function
    const upsertScoreFunction = `
      CREATE OR REPLACE FUNCTION upsert_score_distribution(p_date DATE, p_score INTEGER)
      RETURNS VOID AS $$
      BEGIN
        INSERT INTO score_distributions (puzzle_date, score, count)
        VALUES (p_date, p_score, 1)
        ON CONFLICT (puzzle_date, score)
        DO UPDATE SET count = score_distributions.count + 1;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: upsertError } = await supabase.rpc('exec', { 
      sql: upsertScoreFunction 
    });

    if (upsertError) {
      console.log('⚠️  upsert_score_distribution function creation failed, function may already exist');
    } else {
      console.log('✅ upsert_score_distribution function created');
    }

    console.log('🎉 Database functions setup complete!');

  } catch (error) {
    console.error('❌ Failed to create functions:', error.message);
    
    // Provide manual SQL for user to run
    console.log('\n📝 Manual SQL to run in Supabase SQL Editor:');
    console.log('----------------------------------------');
    console.log(`
CREATE OR REPLACE FUNCTION increment_usage_count(article_ids INTEGER[])
RETURNS VOID AS $$
BEGIN
  UPDATE articles 
  SET used_count = used_count + 1 
  WHERE id = ANY(article_ids);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION upsert_score_distribution(p_date DATE, p_score INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO score_distributions (puzzle_date, score, count)
  VALUES (p_date, p_score, 1)
  ON CONFLICT (puzzle_date, score)
  DO UPDATE SET count = score_distributions.count + 1;
END;
$$ LANGUAGE plpgsql;
    `);
    console.log('----------------------------------------');
  }
}

createFunctions();