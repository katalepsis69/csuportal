-- 0005: drop the superseded 7-param rpc_submit_evaluation overload.
-- 0004 used create or replace with an ADDED parameter (p_payload_hash), which
-- creates a new overload instead of replacing — PostgREST then cannot resolve
-- calls that omit p_payload_hash (PGRST203 ambiguous candidate).
-- The 8-param version (with default) is the only one the app needs.

drop function if exists public.rpc_submit_evaluation(
  uuid, boolean, text, public.sentiment_label, numeric, jsonb, jsonb
);
