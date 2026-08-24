create extension if not exists pgcrypto;

create type public.rsvp_response as enum ('yes', 'maybe', 'no');

-- Master guest list structures preserved for future wedding management
create table public.households (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete set null,
  guest_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Universal public Save-the-Date anonymous sessions
create table public.anonymous_sessions (
  id uuid primary key default gen_random_uuid(),
  session_hmac text not null unique,
  created_at timestamptz not null default now(),
  interaction_started_at timestamptz,
  expires_at timestamptz not null,
  check (char_length(session_hmac) = 64),
  check (expires_at > created_at)
);

-- Guest-submitted RSVP records (one current record per session)
create table public.rsvp (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.anonymous_sessions(id) on delete cascade,
  response public.rsvp_response not null,
  submitted_name text not null,
  attendance_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (response = 'no' and attendance_count is null) or
    (response in ('yes', 'maybe') and attendance_count is not null and attendance_count >= 1)
  )
);

-- Audit history for any changes made to an RSVP
create table public.rsvp_history (
  id uuid primary key default gen_random_uuid(),
  rsvp_id uuid not null references public.rsvp(id) on delete cascade,
  session_id uuid references public.anonymous_sessions(id) on delete set null,
  previous_response public.rsvp_response,
  new_response public.rsvp_response not null,
  previous_submitted_name text,
  new_submitted_name text not null,
  previous_attendance_count integer,
  new_attendance_count integer,
  changed_at timestamptz not null default now()
);

-- Idempotency keys to prevent duplicate submission requests
create table public.rsvp_idempotency_keys (
  session_id uuid not null references public.anonymous_sessions(id) on delete cascade,
  idempotency_key uuid not null,
  response public.rsvp_response not null,
  submitted_name text not null,
  attendance_count integer,
  result_response public.rsvp_response not null,
  created_at timestamptz not null default now(),
  primary key (session_id, idempotency_key)
);

-- Analytics events tracking the guest narrative progression
create table public.experience_events (
  id bigint generated always as identity primary key,
  session_id uuid references public.anonymous_sessions(id) on delete set null,
  event_type text not null check (event_type in (
    'invitation_link_opened',
    'anonymous_session_started',
    'guest_interaction_started',
    'screen_viewed',
    'system_scan_started',
    'match_found',
    'reveal_reached',
    'installation_started',
    'installation_reached',
    'warning_viewed',
    'rsvp_selected',
    'name_submitted',
    'attendance_count_selected',
    'rsvp_completed',
    'rsvp_changed',
    'easter_egg_triggered',
    'returning_visit'
  )),
  milestone text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now()
);

-- Admin authentication and audit logs
create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (display_name in ('Janhvi', 'Krish')),
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index anonymous_sessions_lookup_idx on public.anonymous_sessions (session_hmac, expires_at);
create index rsvp_session_idx on public.rsvp (session_id);
create index rsvp_history_rsvp_idx on public.rsvp_history (rsvp_id, changed_at desc);
create index experience_events_session_idx on public.experience_events (session_id, occurred_at desc);
create index experience_events_type_idx on public.experience_events (event_type, occurred_at desc);
create index invitations_household_idx on public.invitations (household_id);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger households_set_updated_at before update on public.households
for each row execute function public.set_updated_at();
create trigger invitations_set_updated_at before update on public.invitations
for each row execute function public.set_updated_at();
create trigger rsvp_set_updated_at before update on public.rsvp
for each row execute function public.set_updated_at();

-- Append-only prevention triggers
create or replace function public.prevent_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'This table is append-only';
end;
$$;

create trigger rsvp_history_append_only before update or delete on public.rsvp_history
for each row execute function public.prevent_mutation();
create trigger experience_events_append_only before update or delete on public.experience_events
for each row execute function public.prevent_mutation();
create trigger admin_audit_log_append_only before update or delete on public.admin_audit_log
for each row execute function public.prevent_mutation();

-- Admin verification helper
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- Admin audit trigger
create or replace function public.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and public.is_admin() then
    insert into public.admin_audit_log (
      actor_user_id, action, target_table, target_id, before_data, after_data
    ) values (
      auth.uid(), tg_op, tg_table_name,
      coalesce(new.id::text, old.id::text),
      case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
      case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
    );
  end if;
  return coalesce(new, old);
end;
$$;

create trigger households_admin_audit after insert or update or delete on public.households
for each row execute function public.audit_admin_change();
create trigger invitations_admin_audit after insert or update or delete on public.invitations
for each row execute function public.audit_admin_change();

-- Enable Row Level Security
alter table public.households enable row level security;
alter table public.invitations enable row level security;
alter table public.anonymous_sessions enable row level security;
alter table public.rsvp enable row level security;
alter table public.rsvp_history enable row level security;
alter table public.rsvp_idempotency_keys enable row level security;
alter table public.experience_events enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.admin_audit_log enable row level security;

-- Admin RLS Policies
create policy "admins can read households" on public.households for select to authenticated using (public.is_admin());
create policy "admins can read invitations" on public.invitations for select to authenticated using (public.is_admin());
create policy "admins can read rsvps" on public.rsvp for select to authenticated using (public.is_admin());
create policy "admins can read rsvp history" on public.rsvp_history for select to authenticated using (public.is_admin());
create policy "admins can read experience events" on public.experience_events for select to authenticated using (public.is_admin());
create policy "admins can read audit log" on public.admin_audit_log for select to authenticated using (public.is_admin());
create policy "admins can read profiles" on public.admin_profiles for select to authenticated using (public.is_admin());
