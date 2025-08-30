# Repository Guidelines

## Project Overview
- Taxonomystery is a Wikipedia guessing game: each puzzle shows the categories of a mystery article and players guess the article title.
- Ten new puzzles publish daily; players can also replay past days.
- Article metadata and puzzle records live in Supabase; the seed list originated from Wikipedia’s “Vital articles”.
- Next.js (App Router) serves the UI and API routes that generate/list puzzles and record scores.

## Project Structure & Module Organization
- Source: `src/app` (Next.js App Router, API in `src/app/api`), UI in `src/components`, client helpers in `src/lib`.
- Shared server utilities and DB access: `lib/` and `lib/db/*`.
- Tests: `__tests__/` (`*.test.ts`).
- Assets: `public/` and global styles in `src/app/globals.css`.
- Database & local dev: `supabase/` (config, migrations) and `scripts/` (DB/admin helpers).

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js locally (Turbopack) at `http://localhost:3000`.
- `npm run build` / `npm start`: Production build and serve.
- `npm run lint`: ESLint (Next core-web-vitals + TS).
- `npm test`: Boots local Supabase (`npx supabase start`), runs Jest, then stops it.
- `npm run test:watch`: Jest in watch mode (leaves Supabase running).
- Utilities: `npm run seed:articles`, `npm run test:puzzle`, `npm run test:api`.

Environment: copy `.env.local.example` to `.env.local`; tests load `.env.test` via `jest.setup.js`.

## Coding Style & Naming Conventions
- Language: TypeScript (`strict: true`), path alias `@/*` → `src/*`.
- Linting: ESLint flat config extending Next defaults. Fix issues before PRs.
- Components: React 19 + Next 15. Use PascalCase for components (`NewspaperHeader.tsx`), kebab-case for route folders, and camelCase for variables/functions.
- Indentation: 2 spaces; prefer explicit types on public APIs.

## Testing Guidelines
- Framework: Jest + ts-jest; Node environment.
- Location/pattern: `__tests__/**/*.test.ts`.
- Local DB: tests require Supabase running; the `test`/`test:watch` scripts manage it.
- Useful helpers: see `__tests__/test-utils.ts` (cleanup, inserts).

## Commit & Pull Request Guidelines
- Commits: short, imperative present tense (e.g., "Fix build", "Add favicons"). Group related changes.
- PRs: clear description, link issues (`#123`), include screenshots for UI changes, list test coverage or steps to validate. Ensure `npm run lint && npm test` pass.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` and `.env.test`.
- Cron endpoints expect `CRON_SECRET` header (see `src/app/api/cron/daily-puzzle/route.ts`).
- Apply DB changes via `supabase/migrations` and verify with scripts in `scripts/`.
