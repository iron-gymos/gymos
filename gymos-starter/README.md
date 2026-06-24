# gymos

Iron Gym OS V2 - Gym management system built with Next.js and Supabase.

## Current version
Phase 1 starter with:

- Vercel-ready Next.js app
- Supabase environment variable checks
- Login page
- First OWNER bootstrap flow using `bootstrap_current_user_as_owner`
- Starter dashboard / system status page

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://wqclubzthcjbrbptbldh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

Do not use the Supabase service role key in the frontend.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Vercel

Root Directory:

```text
gymos-starter
```
