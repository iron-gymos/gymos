# Phase 3: Customer OS

Phase 3 adds the first real operating module for Iron Gym OS V2.

## Included

- Customer OS navigation inside `/app`
- Customer summary cards
- Customer list and search
- New customer form
- Health profile fields
- Primary trainer assignment
- Customer detail panel
- Body composition records
- Body measurement records

## Supabase RPCs

Migration `006_customer_os_rpc` was applied to Supabase and adds:

- `get_customer_os_summary()`
- `list_customers_for_app(...)`
- `create_customer_for_app(...)`
- `get_customer_detail_for_app(...)`
- `add_customer_body_composition_for_app(...)`
- `add_customer_body_measurement_for_app(...)`

## Test flow

1. Sign in as OWNER.
2. Open `/app`.
3. Click Customers in the sidebar.
4. Create a customer with health notes.
5. Open the customer from the list.
6. Add body composition and body measurement records.
7. Confirm dashboard counters update.
