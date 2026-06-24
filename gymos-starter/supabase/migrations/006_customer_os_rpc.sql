-- Iron Gym OS V2 - Migration 006: Customer OS RPC
-- Applied to Supabase project datagymos on Phase 3.
-- This repository note records the RPC layer added for the Customer OS module.
-- Full SQL source lives in the applied Supabase migration history.

-- Added RPC functions:
-- public.customer_display_name(text, text, text)
-- public.get_customer_os_summary()
-- public.list_customers_for_app(text, public.customer_status, integer, integer)
-- public.create_customer_for_app(uuid, text, text, text, text, text, public.gender_type, date, text, text, text, text, text, uuid, text, text, text, text, text)
-- public.get_customer_detail_for_app(uuid)
-- public.add_customer_body_composition_for_app(uuid, numeric, numeric, numeric, numeric, numeric, text)
-- public.add_customer_body_measurement_for_app(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text)

-- The functions are SECURITY DEFINER and use the existing Iron Gym OS V2 helpers:
-- current_app_user_id(), is_global_admin(), can_write_branch(), can_view_customer(), can_work_with_customer().
-- Execute grants were added for authenticated and service_role.
