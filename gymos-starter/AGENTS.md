# Agent Instructions for Iron Gym OS V2

## Product direction
Iron Gym OS V2 is a gym management system built with Next.js, Vercel and Supabase.
Supabase is the source of truth. Apps Script will be used later as an automation layer for Google Calendar, LINE reports, PDF and exports.

## Development rules
- Do not hardcode Supabase keys.
- Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only for frontend Supabase access.
- Never expose or commit a Supabase service role key.
- Keep UI mobile-friendly and simple for gym staff.
- Build one usable flow at a time.

## Current priority
Phase 1: email/password login and first OWNER bootstrap.

## Commands
- `npm install`
- `npm run typecheck`
- `npm run build`
