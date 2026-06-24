# Phase 4: Package + Sale OS

Phase 4 introduces the sales flow using the separated product tables:

- `packagemembership_products` for Membership products.
- `packagept_products` for PT / PL / KF / SM / KID products.

The web app can now:

- Show Membership product master data.
- Show PT product master data.
- Create a multi-item invoice.
- Mix MB + PT products in one invoice.
- Auto-create `customer_packages` when a sale is created.
- Track invoice status and initial payment.

Core RPCs:

- `list_package_products_for_sale()`
- `get_sale_os_summary()`
- `list_sales_invoices_for_app(limit, offset)`
- `create_sale_invoice_for_app(...)`
