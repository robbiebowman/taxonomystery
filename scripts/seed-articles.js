#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables for production
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('Make sure you have a .env.local file with your production Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedArticles() {
  try {
    console.log('🌱 Starting article seeding...');
    
    // Read the articles file
    const articlesFile = path.join(__dirname, '../articles/vital_L1-L4.txt');
    const content = fs.readFileSync(articlesFile, 'utf8');
    const articleTitles = content.split('\n').filter(line => line.trim());
    
    console.log(`📖 Found ${articleTitles.length} articles to import`);
    
    // Transform titles to article objects
    const articles = articleTitles.map(title => ({
      title: title.trim(),
      wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.trim().replace(/ /g, '_'))}`
    }));
    
    // Check for existing articles to avoid duplicates
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('title');
    
    const existingTitles = new Set(existingArticles?.map(a => a.title) || []);
    const newArticles = articles.filter(article => !existingTitles.has(article.title));
    
    if (newArticles.length === 0) {
      console.log('✅ All articles already exist in the database');
      return;
    }
    
    console.log(`➕ Inserting ${newArticles.length} new articles (${articles.length - newArticles.length} already exist)`);
    
    // Insert in batches to avoid timeout
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < newArticles.length; i += batchSize) {
      const batch = newArticles.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('articles')
        .insert(batch)
        .select('id, title');
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        throw error;
      }
      
      inserted += data?.length || 0;
      console.log(`📝 Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(newArticles.length/batchSize)} (${inserted}/${newArticles.length} articles)`);
    }
    
    console.log(`✅ Successfully seeded ${inserted} articles!`);
    
    // Show final count
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total articles in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedArticles();