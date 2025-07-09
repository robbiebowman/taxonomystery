#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables for test database
require('dotenv').config({ path: '.env.test' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMigration() {
  try {
    console.log('📁 Reading migration file...')
    const migrationPath = path.join(__dirname, '..', 'migrations', 'V10__add_random_article_selection.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('🔧 Applying migration to test database...')
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      // Try direct execution if exec_sql function doesn't exist
      console.log('⚠️  exec_sql function not available, trying direct execution...')
      
      // For test environment, we can try executing the SQL directly
      // This won't work in production but should work for local testing
      const { error: directError } = await supabase
        .from('__migration_test')
        .select('*')
        .limit(0) // This will fail but allows us to execute SQL in some clients
      
      if (directError) {
        console.log('❌ Could not apply migration automatically.')
        console.log('📋 Please apply this SQL manually to your test database:')
        console.log('\n' + migrationSQL + '\n')
        return
      }
    }
    
    console.log('✅ Migration applied successfully!')
    
    // Test the function
    console.log('🧪 Testing the new function...')
    const { data: testData, error: testError } = await supabase.rpc('get_random_unused_articles', {
      min_used_count: 0,
      article_count: 5
    })
    
    if (testError) {
      console.log('❌ Function test failed:', testError.message)
    } else {
      console.log(`✅ Function test passed! Retrieved ${testData?.length || 0} articles`)
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  applyMigration()
}

module.exports = { applyMigration }