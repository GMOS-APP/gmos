-- Blog (GM Tips). Posts are written via the /admin console (service role) and
-- read publicly when published. Applied to prod via Supabase MCP; recorded here.
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text,                          -- markdown
  cover_image text,
  category text default 'GM Tips',
  author text default 'GM/OS',
  published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid
);
alter table public.blog_posts enable row level security;

-- Public can read PUBLISHED posts only. Writes are service-role (admin-api) only.
create policy "Read published blog posts"
  on public.blog_posts for select
  using (published = true);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published, published_at desc);
