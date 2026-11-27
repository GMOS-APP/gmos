-- enforce_free_campaign_limit() is a trigger function and must not be callable
-- as an RPC. It still fires on its trigger (runs as the table owner).
-- (Applied to prod via MCP; recorded here.)
revoke execute on function public.enforce_free_campaign_limit() from public;
