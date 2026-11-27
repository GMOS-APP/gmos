# Migration history (reference only)

These files record schema changes that were applied to production **by hand**
(Supabase MCP) before the automated pipeline existed. They are *not* run by
`supabase db push` — some intentionally differ from production (for example the
campaign-limit trigger in `20260616_billing_and_campaign_gate.sql` is dropped in
prod until launch). Do not move them back into `supabase/migrations/`.

New migrations go in `supabase/migrations/` named `YYYYMMDDHHMMSS_snake_case.sql`
and are applied automatically on merge to `main` by
`.github/workflows/deploy-supabase.yml`.
