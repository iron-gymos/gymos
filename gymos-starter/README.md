# Iron Gym OS V2

Gym management system built with Next.js and Supabase.

## Current status

- Phase 1: Login + OWNER bootstrap ✅
- Phase 2: App Shell + Real Dashboard ✅

## URLs

- Public landing page: `/`
- OWNER login: `/login`
- Back-office workspace: `/app`

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not put a `service_role` key in frontend or Vercel public environment variables.

## Local development

```bash
npm install
npm run dev
```


## Phase 3

Customer OS is available inside `/app` for OWNER users. It supports creating customer profiles, health notes, trainer assignment, and body tracking records.


## Phase 4

Package + Sale OS is active. Products are split into `packagemembership_products` and `packagept_products`, and Sales can create multi-item invoices that activate customer packages.
