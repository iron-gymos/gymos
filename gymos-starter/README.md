# GymOS / Iron Gym OS V2

Gym management system built with Next.js and Supabase.

## Stack

- Frontend: Next.js + React + TypeScript
- Database/Auth: Supabase
- Deployment: Vercel
- Automation layer later: Google Apps Script, LINE reports, PDF/export, Google Calendar

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://wqclubzthcjbrbptbldh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Do not put the Supabase `service_role` key in the frontend or Vercel public environment variables.
