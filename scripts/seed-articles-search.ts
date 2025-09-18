#!/usr/bin/env tsx

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { resolveWikipediaArticle } from '../lib/wikiSearch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedArticlesFromSearch() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    console.error('Make sure you have a .env.local file with your production Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🌱 Starting GPT article seeding using Wikipedia search...');

  const articlesFile = path.join(__dirname, '../articles/gpt-generated.txt');
  const fileContent = await fs.readFile(articlesFile, 'utf8').catch((error) => {
    console.error('❌ Failed to read articles/gpt-generated.txt:', error.message);
    process.exit(1);
  });

  const requestedTitles = fileContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  if (requestedTitles.length === 0) {
    console.log('ℹ️ No articles found in articles/gpt-generated.txt');
    return;
  }

  console.log(`📖 Found ${requestedTitles.length} requested articles`);

  const resolved: Array<NonNullable<Awaited<ReturnType<typeof resolveWikipediaArticle>>>> = [];

  for (const title of requestedTitles) {
    try {
      const result = await resolveWikipediaArticle(title);

      if (!result) {
        console.warn(`⚠️ Could not resolve "${title}" via Wikipedia search`);
        continue;
      }

      if (result.status !== 200) {
        console.warn(`⚠️ Wikipedia summary check for "${result.resolvedTitle}" returned status ${result.status}`);
        continue;
      }

      resolved.push(result);
      if (result.originalTitle !== result.resolvedTitle) {
        console.log(`🔍 Matched "${result.originalTitle}" → "${result.resolvedTitle}"`);
      } else {
        console.log(`✅ Verified "${result.resolvedTitle}"`);
      }
    } catch (error) {
      console.error(`❌ Failed to resolve "${title}":`, (error as Error).message);
    }
  }

  if (resolved.length === 0) {
    console.log('⚠️ No articles resolved successfully');
    return;
  }

  const uniqueByTitle = new Map<string, typeof resolved[number]>();
  for (const article of resolved) {
    if (!uniqueByTitle.has(article.resolvedTitle)) {
      uniqueByTitle.set(article.resolvedTitle, article);
    }
  }

  const uniqueArticles = Array.from(uniqueByTitle.values());

  const { data: existingArticles, error: existingError } = await supabase
    .from('articles')
    .select('title');

  if (existingError) {
    console.error('❌ Failed to fetch existing articles:', existingError.message);
    process.exit(1);
  }

  const existingTitles = new Set((existingArticles ?? []).map((article) => article.title));

  const newRecords = uniqueArticles
    .filter((article) => !existingTitles.has(article.resolvedTitle))
    .map((article) => ({
      title: article.resolvedTitle,
      wikipedia_url: article.wikipediaUrl,
    }));

  if (newRecords.length === 0) {
    console.log('✅ All resolved articles already exist in the database');
    return;
  }

  console.log(`➕ Inserting ${newRecords.length} new articles (${uniqueArticles.length - newRecords.length} already exist)`);

  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < newRecords.length; i += batchSize) {
    const batch = newRecords.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('articles')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      process.exit(1);
    }

    inserted += data?.length ?? 0;
    console.log(`📝 Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newRecords.length / batchSize)} (${inserted}/${newRecords.length} articles)`);
  }

  console.log(`✅ Successfully seeded ${inserted} articles!`);
}

seedArticlesFromSearch();
