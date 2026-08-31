-- Voidworks v13 production schema / migration
-- Run this entire file once in Supabase -> SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email_verified_at timestamptz;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
-- Profile writes are server-side only to prevent clients from changing verification state.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, email_verified_at)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email_confirmed_at)
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email, raw_user_meta_data on auth.users for each row execute procedure public.handle_new_user();

-- Existing users remain valid after this migration.
insert into public.profiles (id, email, full_name, email_verified_at)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', ''), email_confirmed_at from auth.users
on conflict (id) do update set
  email = excluded.email,
  email_verified_at = coalesce(public.profiles.email_verified_at, excluded.email_verified_at),
  updated_at = now();

create table if not exists public.client_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  status text not null default 'In behandeling' check (char_length(status) between 1 and 60),
  description text check (description is null or char_length(description) <= 2000),
  live_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists client_projects_client_id_idx on public.client_projects(client_id);
alter table public.client_projects enable row level security;
drop policy if exists "client_projects_select_own" on public.client_projects;
create policy "client_projects_select_own" on public.client_projects for select to authenticated using (auth.uid() = client_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.email_verified_at is not null));

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 160),
  request_type text not null check (char_length(request_type) <= 80),
  message text not null check (char_length(message) between 10 and 3000),
  status text not null default 'new',
  created_at timestamptz not null default now()
);
alter table public.contact_requests enable row level security;

-- Server-only verification codes. The raw 6-digit code is never stored.
create table if not exists public.email_verification_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  consumed_at timestamptz,
  last_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.email_verification_codes enable row level security;

create or replace function public.verify_email_code(p_user_id uuid, p_code_hash text)
returns text language plpgsql security definer set search_path = public as $$
declare rec public.email_verification_codes%rowtype;
begin
  select * into rec from public.email_verification_codes where user_id = p_user_id for update;
  if not found or rec.consumed_at is not null then return 'invalid'; end if;
  if rec.expires_at <= now() then return 'expired'; end if;
  if rec.attempts >= 6 then return 'locked'; end if;
  if rec.code_hash <> p_code_hash then
    update public.email_verification_codes set attempts = attempts + 1 where user_id = p_user_id;
    return 'invalid';
  end if;
  update public.email_verification_codes set consumed_at = now() where user_id = p_user_id;
  update public.profiles set email_verified_at = now(), updated_at = now() where id = p_user_id;
  return 'ok';
end;
$$;
revoke all on function public.verify_email_code(uuid,text) from public, anon, authenticated;
grant execute on function public.verify_email_code(uuid,text) to service_role;

-- One-time password-reset tokens; raw tokens are never stored.
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_reset_tokens_user_idx on public.password_reset_tokens(user_id);
create index if not exists password_reset_tokens_expiry_idx on public.password_reset_tokens(expires_at);
alter table public.password_reset_tokens enable row level security;

create or replace function public.consume_password_reset_token(p_token_hash text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_user_id uuid;
begin
  update public.password_reset_tokens
  set used_at = now()
  where token_hash = p_token_hash and used_at is null and expires_at > now()
  returning user_id into v_user_id;
  return v_user_id;
end;
$$;
revoke all on function public.consume_password_reset_token(text) from public, anon, authenticated;
grant execute on function public.consume_password_reset_token(text) to service_role;

-- Seven-day application sessions. Raw session tokens only exist in Secure HttpOnly cookies.
create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists app_sessions_user_idx on public.app_sessions(user_id);
create index if not exists app_sessions_expiry_idx on public.app_sessions(expires_at);
alter table public.app_sessions enable row level security;

-- Atomic, database-backed rate limiting. Only hashes are stored, never raw IPs.
create table if not exists public.security_rate_limits (
  key_hash text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0 check (hits >= 0)
);
alter table public.security_rate_limits enable row level security;

create or replace function public.consume_rate_limit(p_key_hash text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_hits integer;
begin
  insert into public.security_rate_limits(key_hash, window_start, hits)
  values (p_key_hash, now(), 1)
  on conflict (key_hash) do update set
    hits = case when public.security_rate_limits.window_start <= now() - make_interval(secs => p_window_seconds) then 1 else public.security_rate_limits.hits + 1 end,
    window_start = case when public.security_rate_limits.window_start <= now() - make_interval(secs => p_window_seconds) then now() else public.security_rate_limits.window_start end
  returning hits into v_hits;
  return v_hits <= p_limit;
end;
$$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;

-- Cleanup helpers. Safe to run from scheduled jobs if desired.
create or replace function public.cleanup_security_data()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.security_rate_limits where window_start < now() - interval '2 days';
  delete from public.password_reset_tokens where created_at < now() - interval '2 days';
  delete from public.email_verification_codes where created_at < now() - interval '2 days';
  delete from public.app_sessions where expires_at < now() - interval '1 day' or revoked_at < now() - interval '1 day';
end;
$$;
revoke all on function public.cleanup_security_data() from public, anon, authenticated;
grant execute on function public.cleanup_security_data() to service_role;

-- Private SQL backup bucket. No public RLS policy is created.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('database-backups', 'database-backups', false, 524288000, array['application/sql','text/plain','application/octet-stream'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Voidworks v13 project portal, account settings and email conversation data
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null and username <> '';

create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  requester_name text not null check (char_length(requester_name) between 2 and 80),
  requester_email text not null check (char_length(requester_email) <= 160),
  company_name text not null check (char_length(company_name) between 2 and 120),
  company_description text not null check (char_length(company_description) between 10 and 4000),
  package_id text not null check (package_id in ('landing','website','shop','platform')),
  site_type text not null check (char_length(site_type) between 2 and 160),
  site_requirements text not null check (char_length(site_requirements) between 10 and 8000),
  style_reference text check (style_reference is null or char_length(style_reference) <= 3000),
  selected_addons jsonb not null default '[]'::jsonb,
  base_price integer not null default 0 check (base_price >= 0),
  one_time_total integer not null default 0 check (one_time_total >= 0),
  monthly_total integer not null default 0 check (monthly_total >= 0),
  locale text not null default 'en' check (locale in ('nl','en','de')),
  status text not null default 'requested' check (char_length(status) between 1 and 60),
  live_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_requests_user_idx on public.project_requests(user_id);
create index if not exists project_requests_email_idx on public.project_requests(lower(requester_email));
create index if not exists project_requests_created_idx on public.project_requests(created_at desc);
alter table public.project_requests enable row level security;
drop policy if exists "project_requests_select_own" on public.project_requests;
create policy "project_requests_select_own" on public.project_requests for select to authenticated
  using (auth.uid() = user_id);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests(id) on delete cascade,
  sender_role text not null check (sender_role in ('client','admin','system')),
  sender_email text not null check (char_length(sender_email) <= 160),
  body text not null check (char_length(body) between 1 and 12000),
  source text not null default 'dashboard' check (source in ('dashboard','email','system')),
  external_message_id text unique,
  created_at timestamptz not null default now()
);
create index if not exists project_messages_project_idx on public.project_messages(project_id,created_at);
alter table public.project_messages enable row level security;
drop policy if exists "project_messages_select_own" on public.project_messages;
create policy "project_messages_select_own" on public.project_messages for select to authenticated
  using (exists (select 1 from public.project_requests p where p.id = project_id and p.user_id = auth.uid()));

-- Generic one-time six-digit codes for sensitive actions. Raw codes are never stored.
create table if not exists public.account_action_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('delete_account','change_password','change_profile','password_reset')),
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  consumed_at timestamptz,
  last_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, action)
);
create index if not exists account_action_codes_expiry_idx on public.account_action_codes(expires_at);
alter table public.account_action_codes enable row level security;

create or replace function public.consume_account_action_code(p_user_id uuid, p_action text, p_code_hash text)
returns text language plpgsql security definer set search_path = public as $$
declare rec public.account_action_codes%rowtype;
begin
  select * into rec from public.account_action_codes where user_id = p_user_id and action = p_action for update;
  if not found or rec.consumed_at is not null then return 'invalid'; end if;
  if rec.expires_at <= now() then return 'expired'; end if;
  if rec.attempts >= 6 then return 'locked'; end if;
  if rec.code_hash <> p_code_hash then
    update public.account_action_codes set attempts = attempts + 1 where id = rec.id;
    return 'invalid';
  end if;
  update public.account_action_codes set consumed_at = now() where id = rec.id;
  return 'ok';
end;
$$;
revoke all on function public.consume_account_action_code(uuid,text,text) from public, anon, authenticated;
grant execute on function public.consume_account_action_code(uuid,text,text) to service_role;

-- Deduplicate signed Resend webhooks. Failed handlers remove their row so Resend can retry.
create table if not exists public.resend_webhook_events (
  id text primary key,
  created_at timestamptz not null default now()
);
alter table public.resend_webhook_events enable row level security;

-- Link requests created before registration to the matching account.
create or replace function public.link_project_requests_to_user(p_user_id uuid, p_email text)
returns integer language plpgsql security definer set search_path = public as $$
declare affected integer;
begin
  update public.project_requests
  set user_id = p_user_id, updated_at = now()
  where user_id is null and lower(requester_email) = lower(p_email);
  get diagnostics affected = row_count;
  return affected;
end;
$$;
revoke all on function public.link_project_requests_to_user(uuid,text) from public, anon, authenticated;
grant execute on function public.link_project_requests_to_user(uuid,text) to service_role;

create or replace function public.cleanup_security_data()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.security_rate_limits where window_start < now() - interval '2 days';
  delete from public.password_reset_tokens where created_at < now() - interval '2 days';
  delete from public.email_verification_codes where created_at < now() - interval '2 days';
  delete from public.account_action_codes where created_at < now() - interval '2 days';
  delete from public.app_sessions where expires_at < now() - interval '1 day' or revoked_at < now() - interval '1 day';
  delete from public.resend_webhook_events where created_at < now() - interval '14 days';
end;
$$;
revoke all on function public.cleanup_security_data() from public, anon, authenticated;
grant execute on function public.cleanup_security_data() to service_role;
