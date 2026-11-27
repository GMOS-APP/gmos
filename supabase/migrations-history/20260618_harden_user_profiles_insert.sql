-- Close a privilege-escalation gap on self-insert: the policy only checked
-- id = auth.uid(), so a new user creating their own profile row could set
-- is_admin=true or a paid plan. Restrict self-inserts to a plain free, non-admin
-- profile. is_admin/plan are changed only by the service role (admin-api / Stripe
-- webhook), which bypasses RLS. (Applied to prod via MCP; recorded here.)
drop policy if exists "Users insert own profile" on public.user_profiles;
create policy "Users insert own profile"
  on public.user_profiles for insert
  with check (
    (select auth.uid()) = id
    and coalesce(is_admin, false) = false
    and coalesce(plan, 'free') = 'free'
  );
