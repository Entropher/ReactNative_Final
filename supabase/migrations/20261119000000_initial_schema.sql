-- GiftMaster mobile app: initial database schema.
--
-- Tables
--   profiles          one row per user: credits and the free-search counter
--   user_preferences  theme and default budget
--   gift_searches     each questionnaire the user submitted
--   gift_suggestions  the AI gift ideas for a search
--   saved_gifts       gifts the user hearted
--
-- Every table has row level security (RLS) turned on, so the app can only
-- reach the signed-in user's own rows. Searches and suggestions are written
-- only by the Edge Functions (which use the service role), never by the app.

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

-- How many free searches every account gets per calendar month (UTC).
create or replace function public.free_searches_per_month()
returns integer
language sql
immutable
set search_path = ''
as $$ select 3 $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Paid credits (1 credit = 1 search). Filled by in-app purchases later.
  credits integer not null default 0 check (credits >= 0),
  -- Free searches used in `free_period` (a 'YYYY-MM' month).
  free_searches_used integer not null default 0 check (free_searches_used >= 0),
  free_period text,
  created_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  -- One of the budget presets shown in Settings, or null for no default.
  default_budget text
);

create table public.gift_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  recipient_age text not null,
  recipient_gender text,
  interests text not null,
  relationship text not null,
  occasion text not null,
  budget text not null,
  favorite_color text,
  additional_notes text,
  living_situation text,
  life_milestone text,
  aesthetic text,
  gift_type text,
  avoid_gifts text,
  dislikes text,
  funny_gift_acceptable text,
  occasion_tone text,
  -- How many times "More Like This" was used on this search (capped).
  similar_requests integer not null default 0,
  created_at timestamptz not null default now()
);

create index gift_searches_user_id_created_at_idx
  on public.gift_searches (user_id, created_at desc);

create table public.gift_suggestions (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references public.gift_searches (id) on delete cascade,
  title text not null,
  description text not null,
  budget_range text not null,
  category text,
  shopping_source text not null default 'amazon'
    check (shopping_source in ('amazon', 'etsy', 'uncommongood')),
  image_url text,
  created_at timestamptz not null default now()
);

create index gift_suggestions_search_id_idx on public.gift_suggestions (search_id);

create table public.saved_gifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  suggestion_id uuid not null references public.gift_suggestions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, suggestion_id)
);

create index saved_gifts_suggestion_id_idx on public.saved_gifts (suggestion_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.gift_searches enable row level security;
alter table public.gift_suggestions enable row level security;
alter table public.saved_gifts enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can read their own preferences"
  on public.user_preferences for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can read their own searches"
  on public.gift_searches for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can delete their own searches"
  on public.gift_searches for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read suggestions from their own searches"
  on public.gift_suggestions for select to authenticated
  using (
    exists (
      select 1 from public.gift_searches s
      where s.id = search_id and s.user_id = (select auth.uid())
    )
  );

create policy "Users can read their saved gifts"
  on public.saved_gifts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save gifts from their own searches"
  on public.saved_gifts for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.gift_suggestions g
      join public.gift_searches s on s.id = g.search_id
      where g.id = suggestion_id and s.user_id = (select auth.uid())
    )
  );

create policy "Users can remove their saved gifts"
  on public.saved_gifts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Table privileges. RLS above still decides which rows are visible.
grant select on public.profiles to authenticated;
grant select, update on public.user_preferences to authenticated;
grant select, delete on public.gift_searches to authenticated;
grant select on public.gift_suggestions to authenticated;
grant select, insert, delete on public.saved_gifts to authenticated;

grant all on public.profiles, public.user_preferences, public.gift_searches,
  public.gift_suggestions, public.saved_gifts to service_role;

-- ---------------------------------------------------------------------------
-- New users get a profile and default preferences automatically
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Search allowance (free searches + credits)
-- ---------------------------------------------------------------------------

-- What the signed-in user has left. Called by the app.
create or replace function public.get_my_allowance()
returns table (
  free_remaining integer,
  free_limit integer,
  credits integer,
  resets_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    case
      when p.free_period = to_char(now() at time zone 'utc', 'YYYY-MM')
        then greatest(public.free_searches_per_month() - p.free_searches_used, 0)
      else public.free_searches_per_month()
    end,
    public.free_searches_per_month(),
    p.credits,
    (date_trunc('month', now() at time zone 'utc') + interval '1 month') at time zone 'utc'
  from public.profiles p
  where p.id = (select auth.uid());
$$;

-- Uses one free search, or one credit when the free ones are gone.
-- Returns 'free' or 'credit'; raises NO_CREDITS when nothing is left.
-- Each UPDATE re-checks its condition under a row lock, so two searches
-- started at the same moment can't both use the last free search.
create or replace function public.consume_search_allowance(p_user_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_period text := to_char(now() at time zone 'utc', 'YYYY-MM');
begin
  -- A new month starts a fresh free counter.
  update public.profiles
     set free_period = v_period, free_searches_used = 0
   where id = p_user_id and free_period is distinct from v_period;

  update public.profiles
     set free_searches_used = free_searches_used + 1
   where id = p_user_id and free_searches_used < public.free_searches_per_month();
  if found then
    return 'free';
  end if;

  update public.profiles
     set credits = credits - 1
   where id = p_user_id and credits > 0;
  if found then
    return 'credit';
  end if;

  raise exception 'NO_CREDITS';
end;
$$;

-- Gives back what consume_search_allowance took, when the AI call fails.
create or replace function public.refund_search_allowance(p_user_id uuid, p_kind text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_kind = 'free' then
    update public.profiles
       set free_searches_used = greatest(free_searches_used - 1, 0)
     where id = p_user_id;
  elsif p_kind = 'credit' then
    update public.profiles set credits = credits + 1 where id = p_user_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- "More Like This" cap: 5 uses per search, to keep AI costs predictable
-- ---------------------------------------------------------------------------

create or replace function public.claim_similar_request(p_search_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.gift_searches
     set similar_requests = similar_requests + 1
   where id = p_search_id and user_id = p_user_id and similar_requests < 5;
  return found;
end;
$$;

create or replace function public.release_similar_request(p_search_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.gift_searches
     set similar_requests = greatest(similar_requests - 1, 0)
   where id = p_search_id;
end;
$$;

-- Only the Edge Functions (service role) may change allowances or caps.
-- Supabase grants function access to app users by default, so take it away.
revoke execute on function public.consume_search_allowance(uuid) from public, anon, authenticated;
revoke execute on function public.refund_search_allowance(uuid, text) from public, anon, authenticated;
revoke execute on function public.claim_similar_request(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.release_similar_request(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.consume_search_allowance(uuid) to service_role;
grant execute on function public.refund_search_allowance(uuid, text) to service_role;
grant execute on function public.claim_similar_request(uuid, uuid) to service_role;
grant execute on function public.release_similar_request(uuid) to service_role;

revoke execute on function public.get_my_allowance() from public, anon;
grant execute on function public.get_my_allowance() to authenticated;
