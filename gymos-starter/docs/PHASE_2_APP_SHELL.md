# Phase 2: App Shell + Real Dashboard

Phase 2 turns `/app` into the first real back-office workspace for Iron Gym OS V2.

## Added

- Auth-protected app shell at `/app`
- Sidebar navigation placeholders:
  - Dashboard
  - Customers
  - Packages
  - Sales
  - Training
  - Admin
- Live dashboard summary from Supabase RPC `get_app_dashboard_summary`
- OWNER profile card and sign out flow
- Branch scope panel
- Package breakdown panel
- Phase roadmap modules for Customer OS, Sales OS, and Training OS

## Supabase

Migration 005 adds:

```sql
public.get_app_dashboard_summary()
```

The RPC is role-aware and reads branch scope from `app_users` and `branch_staff`.
