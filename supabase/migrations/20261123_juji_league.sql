-- Applied to project ppntnfpiqsynzenwiiha on 2026-11-23 (migration "juji_league").
create table public.juji_players (
  key text primary key, code text unique not null,
  nick text not null check (char_length(nick) between 2 and 16),
  tier smallint not null default 0 check (tier between 0 and 9),
  streak int not null default 0, course text not null default 'kmr', seen_week text,
  last_result smallint not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.juji_week (
  key text not null references public.juji_players(key) on delete cascade,
  week text not null, tier smallint not null, grp int not null,
  xp int not null default 0 check (xp between 0 and 20000),
  updated_at timestamptz not null default now(), primary key (key, week)
);
create index juji_week_grp on public.juji_week (week, grp);
create table public.juji_friends (
  a text not null references public.juji_players(key) on delete cascade,
  b text not null references public.juji_players(key) on delete cascade,
  primary key (a, b), check (a <> b)
);
create index juji_friends_b on public.juji_friends (b);
alter table public.juji_players enable row level security;
alter table public.juji_week enable row level security;
alter table public.juji_friends enable row level security;
revoke all on public.juji_players, public.juji_week, public.juji_friends from anon, authenticated;
