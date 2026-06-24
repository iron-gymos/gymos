# Phase 4.2 Package Management

Adds create and edit workflows for the two product master tables:

- `packagemembership_products`
- `packagept_products`

The Package OS now supports:

- Add Membership product
- Edit Membership product
- Add PT / PL / KF / SM / KID product
- Edit PT / PL / KF / SM / KID product
- Set default price
- Set membership duration days
- Set PT/service session count
- Toggle active/inactive status

Supabase RPCs added:

- `create_membership_product_for_app`
- `update_membership_product_for_app`
- `create_pt_product_for_app`
- `update_pt_product_for_app`
