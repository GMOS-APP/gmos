-- GM-OS Initial Schema
-- Run this in your Supabase SQL editor or via `supabase db push`

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- CAMPAIGNS
-- =====================
create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  setting text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  current_session_number integer default 0,
  active_mode text default 'session' check (active_mode in ('session', 'debrief')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- =====================
-- WORLD ENTITIES
-- =====================
create table if not exists world_entities (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  entity_type text not null check (entity_type in (
    'npc','creature','location','faction','thread','item',
    'player_character','event','lore','deity','encounter','shop'
  )),
  summary text,
  description text,
  status text default 'active' check (status in ('active','inactive','dead','destroyed','resolved','unknown')),
  visibility text default 'gm_only' check (visibility in ('gm_only','players_know','players_suspect','false_info')),
  tags text[] default '{}',
  key_facts text[] default '{}',
  last_seen_session integer,
  image_url text,
  npc_data jsonb default '{}',
  extra_data jsonb default '{}',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- =====================
-- SESSIONS
-- =====================
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_number integer not null,
  title text,
  date timestamptz,
  status text not null default 'planned' check (status in ('planned','in_progress','completed','debriefed')),
  previous_session_recap text,
  strong_start text,
  npc_notes text,
  monster_notes text,
  location_notes text,
  rumors text,
  treasure_notes text,
  raw_notes text,
  planned_encounters text[] default '{}',
  creature_ids text[] default '{}',
  planned_locations text[] default '{}',
  npc_ids text[] default '{}',
  start_time timestamptz,
  end_time timestamptz,
  linked_entities jsonb default '[]',
  session_goals jsonb default '[]',
  summary text,
  next_session_primer text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- =====================
-- RELATIONSHIPS
-- =====================
create table if not exists relationships (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  source_entity_id uuid references world_entities(id) on delete cascade,
  source_name text,
  target_entity_id uuid references world_entities(id) on delete cascade,
  target_name text,
  relationship_type text not null check (relationship_type in (
    'allied_with','enemy_of','located_in','member_of','owns','seeks','knows',
    'loves','hates','fears','owes','employed_by','rivals','mentors',
    'parent_of','sibling_of','married_to','betrayed_by'
  )),
  description text,
  notes text,
  status text default 'active' check (status in ('active','broken','secret','suspected','historical')),
  strength integer default 5 check (strength between 1 and 10),
  session_established integer,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- =====================
-- QUICK NOTES
-- =====================
create table if not exists quick_notes (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  content text not null,
  processed boolean default false,
  extracted_entities text[] default '{}',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- =====================
-- CAMPAIGN MAPS
-- =====================
create table if not exists campaign_maps (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text,
  image_url text,
  pins jsonb default '[]',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- =====================
-- AUTO-UPDATE updated_date
-- =====================
create or replace function update_updated_date()
returns trigger as $$
begin
  new.updated_date = now();
  return new;
end;
$$ language plpgsql;

create trigger campaigns_updated_date before update on campaigns
  for each row execute function update_updated_date();

create trigger world_entities_updated_date before update on world_entities
  for each row execute function update_updated_date();

create trigger sessions_updated_date before update on sessions
  for each row execute function update_updated_date();

create trigger relationships_updated_date before update on relationships
  for each row execute function update_updated_date();

create trigger quick_notes_updated_date before update on quick_notes
  for each row execute function update_updated_date();

create trigger campaign_maps_updated_date before update on campaign_maps
  for each row execute function update_updated_date();

-- =====================
-- ROW LEVEL SECURITY
-- =====================
alter table campaigns enable row level security;
alter table world_entities enable row level security;
alter table sessions enable row level security;
alter table relationships enable row level security;
alter table quick_notes enable row level security;
alter table campaign_maps enable row level security;

-- Users can only access their own data
create policy "campaigns_owner" on campaigns
  for all using (auth.uid() = created_by);

create policy "world_entities_owner" on world_entities
  for all using (
    campaign_id in (select id from campaigns where created_by = auth.uid())
  );

create policy "sessions_owner" on sessions
  for all using (
    campaign_id in (select id from campaigns where created_by = auth.uid())
  );

create policy "relationships_owner" on relationships
  for all using (
    campaign_id in (select id from campaigns where created_by = auth.uid())
  );

create policy "quick_notes_owner" on quick_notes
  for all using (
    campaign_id in (select id from campaigns where created_by = auth.uid())
  );

create policy "campaign_maps_owner" on campaign_maps
  for all using (
    campaign_id in (select id from campaigns where created_by = auth.uid())
  );

-- =====================
-- STORAGE BUCKET FOR MAPS
-- =====================
insert into storage.buckets (id, name, public)
values ('maps', 'maps', true)
on conflict do nothing;

create policy "maps_upload" on storage.objects
  for insert with check (bucket_id = 'maps' and auth.role() = 'authenticated');

create policy "maps_read" on storage.objects
  for select using (bucket_id = 'maps');

create policy "maps_delete" on storage.objects
  for delete using (bucket_id = 'maps' and auth.uid()::text = (storage.foldername(name))[1]);
