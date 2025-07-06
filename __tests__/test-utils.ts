import { createClient } from '@supabase/supabase-js';

export const testSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function cleanupDatabase() {
  await testSupabase.from('score_distributions').delete().neq('puzzle_date', '');
  await testSupabase.from('user_scores').delete().neq('id', -1);
  await testSupabase.from('daily_puzzles').delete().neq('id', -1);
  await testSupabase.from('articles').delete().neq('id', -1);
}

export async function insertTestArticles() {
  const testArticles = [
    { title: 'Test Article 1', wikipedia_url: 'https://en.wikipedia.org/wiki/Test_Article_1' },
    { title: 'Test Article 2', wikipedia_url: 'https://en.wikipedia.org/wiki/Test_Article_2' },
    { title: 'Test Article 3', wikipedia_url: 'https://en.wikipedia.org/wiki/Test_Article_3' },
  ];

  const { data, error } = await testSupabase
    .from('articles')
    .insert(testArticles)
    .select();

  if (error) throw error;
  return data;
}

export const mockPuzzleArticles = [
  {
    article_id: 1,
    title: 'Test Article 1',
    categories: ['Category:Test', 'Category:Science'],
    aliases: ['Test 1', 'First Test']
  },
  {
    article_id: 2,
    title: 'Test Article 2',
    categories: ['Category:Test', 'Category:History'],
    aliases: ['Test 2', 'Second Test']
  }
];

export const mockAnswers = [
  { guess: 'Test Article 1', correct: true, article_title: 'Test Article 1' },
  { guess: 'Wrong Answer', correct: false, article_title: 'Test Article 2' }
];