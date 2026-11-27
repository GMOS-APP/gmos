# Automated pipeline and agent missions

GM/OS ships continuously. Every change goes from a PR, through CI and a risk gate, to `main`, and merging deploys it automatically. Agent missions plug into the same path. Agents write code on a branch, and the pipeline decides what ships.

```
 mission (Agents-GMOS hub)
   │  bridge: git switch -c agent/<id> origin/main
   ▼
 PLAN → STEP (owner → gmos-docs → gmos-qa → commit) … → WRAPUP (npm run verify)
   │  bridge: git push, gh pr create
   ▼
 PR ── CI: verify, functions ── risk-gate ──┬─ safe  → auto-merge (squash)
                                            └─ risky → needs-approval label → owner adds owner-approved → merge
   ▼
 main ── Vercel production deploy ── smoke.yml (gmos.app, sitemap, rss → prod-incident issue on failure)
      └─ deploy-supabase.yml: new migrations → changed edge functions → changelog/ entries
```

## Required checks
| Check | Workflow | What it runs |
| --- | --- | --- |
| `verify` | `ci.yml` | `npm run verify`: lint, typecheck ratchet, vitest, `check:repo` (migration names, changelog files), build |
| `functions` | `ci.yml` | `deno check` on all edge functions, ratcheted against `.deno-check-baseline` |
| `risk-gate` | `automerge.yml` | `scripts/risk-check.mjs`, run from the **base** branch so a PR can't weaken it |

**Typecheck ratchets.** The app had 729 JSDoc type errors and the functions had 13 before the gate existed. CI fails only if those counts go up. When you fix errors, lower the baseline (`npm run typecheck:baseline`). Never raise it.

## Risk gate
These are risky (see `scripts/risk-check.mjs` for the exact rules):
- migrations and `supabase/config.toml`
- billing functions (`stripeWebhook`, `createCheckout`, `createBillingPortal`)
- account-data and admin functions
- auth and plan code (`AuthContext`, `plans.js`, `AuthPanel`, `Upgrade`, `AccountSettings`)
- `vercel.json` (the CSP)
- `.github/`, `.claude/` and the pipeline scripts
- the typecheck baselines
- the lockfile, and dependency or script changes in `package.json`

A risky PR fails `risk-gate` and gets the `needs-approval` label plus a comment listing why. To approve it, review the PR and add the **`owner-approved`** label. A new push removes the label, so the approval always matches the code you reviewed. The gate applies to every PR, including your own. Only `agent/*` branches auto-merge.

Approval is a label rather than a review because agents push as your GitHub account, and GitHub doesn't let a PR's author approve it.

## Deploys on merge
- **Web app:** the Vercel Git integration builds `main`, and builds previews for PRs.
- **Migrations:** only new files in `supabase/migrations/` named `YYYYMMDDHHMMSS_snake_case.sql`. The workflow runs `supabase db push --dry-run` first. It **fails closed** if anything other than this push's new files would be applied (history drift). The files in `supabase/migrations-history/` document hand-applied changes and are never run.
- **Edge functions:** `scripts/deploy-functions.mjs` deploys only the changed files, using the slug map in `scripts/functions.map.json`. Each function keeps its **live** `verify_jwt` setting. A slug that doesn't exist yet is refused unless it's listed in `allowCreate`. To redeploy everything, run the workflow manually with `all_functions`.
- **Changelog:** `changelog/<YYYY-MM-DD>-<slug>.json` files are merged into that day's row in the `changelog` table.
- **Rollback:** use Vercel's Instant Rollback for the app. For a bad migration, ship a new migration that reverts it. The pipeline never rolls back the database on its own.

## One-time setup (owner)
1. **Secrets.** Create the GitHub Environment `production` (Settings → Environments) with:
   - `SUPABASE_ACCESS_TOKEN`: a personal access token from Supabase → Account → Access Tokens, for the account that owns project `suofaewpbrzbixplwzvs`.
   - `SUPABASE_DB_PASSWORD`: the project's database password.
   - `SUPABASE_SERVICE_ROLE_KEY`: used to publish changelog rows.
2. **Repository secrets:**
   - `AUTOMERGE_TOKEN`: a fine-grained PAT on `GMOS-APP/gmos` with Contents and Pull requests set to read/write. Auto-merge uses it so the merge triggers `deploy-supabase.yml`; a `GITHUB_TOKEN` merge wouldn't trigger it.
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` should already exist.
3. **Branch protection on `main`:**
   - require a PR
   - require the status checks `verify`, `functions` and `risk-gate`
   - require branches to be up to date
   - allow auto-merge
   - allow squash merging only
4. **Reconcile the migration history once.** Production's `supabase_migrations.schema_migrations` holds versions created by MCP that have no matching files here, so the first `db push` would stop on history drift. Run `supabase migration list` and mark the remote-only versions with `supabase migration repair --status reverted <version>`. Repair edits only the history table, never the schema. Then `supabase db push --dry-run` should report nothing to push.
5. **Confirm the edge-function slugs.** Run `supabase functions list` and check that every slug in `scripts/functions.map.json` exists. Older docs list `export-campaign`, `import-campaign` and `delete-account`, but the app calls `exportCampaign`, `importCampaign` and `deleteAccount`.
6. **Check the Vercel project.** Make sure it's Git-linked to `GMOS-APP/gmos` (the repo moved from `trisdenc/GM-OS`) and that PRs get Preview deployments.
7. **Retire GitHub Pages.** Turn it off under Settings → Pages. The old copy at `trisdenc.github.io/GM-OS` is otherwise left up, stale.
8. **Log in on the PC that runs Agents-GMOS:** `gh auth login` as an account with write access, so the bridge can push branches and open PRs.

## Agent missions
- **Mission control:** `E:\Code\Agents-GMOS` (start it with `pnpm dev:hub`). The hub is on <http://localhost:5184> and the bridge on port 4101, so it can run alongside the HiROM hub.
- **Agents:** defined in `.claude/agents/`.
  - `gmos-ui` (frontend)
  - `gmos-data` (Supabase, functions, API)
  - `gmos-platform` (tooling, CI)
  - `gmos-docs` (docs, changelog)
  - `gmos-qa` (read-only audit)
- **Lead protocol:** `.gmos/lead.md`. Missions are saved in `.gmos/missions/<id>.json`, and the tracker is `.gmos/tasks.json`.
- **Permissions:** `.claude/settings.json` allows local npm, node and git. It denies `git push`, `gh`, `supabase`, `vercel`, `stripe`, reading `.env*`, and the production MCP tools.
- **Who does what:** the agents only commit. The bridge pushes and opens the PR, and GitHub merges it.
- **CI failures:** when CI fails on a mission PR, the bridge runs one **FIX** iteration with the failing log, then pushes again. If CI still fails, the mission ends as `needs_user`, with the PR left open.
