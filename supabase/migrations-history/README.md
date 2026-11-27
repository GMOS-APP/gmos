# Migration history (reference only)

These files record schema changes that were applied to production **by hand**
(Supabase MCP) before the automated pipeline existed. They are *not* run by
`supabase db push` and may differ from production, which is the source of truth
(the campaign-limit trigger from `20260616_billing_and_campaign_gate.sql`, for
example, was dropped and later re-enabled by `enable_free_campaign_limit_trigger_golive`;
`trg_enforce_free_campaign_limit` is on in prod as of 2026-11-27). Do not move them back into `supabase/migrations/`. Their versions are covered there by
`-- baseline:` stubs that match the production history table.

New migrations go in `supabase/migrations/` named `YYYYMMDDHHMMSS_snake_case.sql`
and are applied automatically on merge to `main` by
`.github/workflows/deploy-supabase.yml`.
