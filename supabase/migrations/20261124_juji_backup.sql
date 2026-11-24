-- Applied to project ppntnfpiqsynzenwiiha on 2026-11-24 (migration "juji_backup").
create table public.juji_backup (
  key text primary key, data jsonb not null, bytes int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.juji_backup enable row level security;
revoke all on public.juji_backup from anon, authenticated;
