-- Scale/perf hardening ahead of user growth (Supabase advisor lints).
-- Applied to prod 2026-07-13 via MCP; captured here to keep the repo in sync.

-- linter 0003 (auth_rls_initplan): wrap auth.uid() in a scalar subselect so it
-- is evaluated once per query instead of once per row. Logic is unchanged.
ALTER POLICY "Users read own feedback" ON public.feedback
  USING ((select auth.uid()) = created_by);
ALTER POLICY "Users submit feedback" ON public.feedback
  WITH CHECK ((select auth.uid()) = created_by);
ALTER POLICY "Owners manage party inventory" ON public.party_inventory
  USING (EXISTS (SELECT 1 FROM campaigns c WHERE c.id = party_inventory.campaign_id AND c.created_by = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM campaigns c WHERE c.id = party_inventory.campaign_id AND c.created_by = (select auth.uid())));
ALTER POLICY "Owners manage player notes" ON public.player_notes
  USING (EXISTS (SELECT 1 FROM campaigns c WHERE c.id = player_notes.campaign_id AND c.created_by = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM campaigns c WHERE c.id = player_notes.campaign_id AND c.created_by = (select auth.uid())));

-- linter 0001 (unindexed_foreign_keys): cover the FK for joins/deletes.
CREATE INDEX IF NOT EXISTS idx_campaign_maps_linked_entity_id
  ON public.campaign_maps (linked_entity_id);

-- linter 0009 (duplicate_index): drop the duplicate on campaigns.created_by,
-- keeping campaigns_created_by_idx.
DROP INDEX IF EXISTS public.idx_campaigns_created_by;
