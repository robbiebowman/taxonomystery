This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Adding New Wikipedia Articles

We keep the playable pool in `articles/gpt-generated.txt`. When you want to propose more titles:

1. Open up ChatGPT/Claude. Upload `articles/gpt-articles.txt`
2. Ask GPT to extend the list using the following prompt:

```
Take a look at my list of interesting/fun wikipedia articles. Can you suggest an addition 100 articles? There should be a mix of subjects and a mix of obscurity levels. Don't be afraid to add the occasional low brow/funny topics.
```

3. Append the titles to `articles/gpt-generated.txt` (one title per line).
4. Seed the new records into production Supabase:

```
npm run seed:articles:gpt
```

   This command runs `scripts/seed-articles-search.ts`, resolves each title against Wikipedia, and inserts anything that isn’t already in the `articles` table.
5. Check the terminal output for any “Could not resolve” warnings and either adjust those titles manually or drop them before the next run.

Tip: after seeding, spot-check a couple of entries in Supabase to confirm titles and URLs look right.
