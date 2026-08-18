-- 기존 단일 profiles.role 구조를 다중 역할 구조로 이전한다.
-- 배포 코드보다 먼저 Supabase SQL Editor에서 한 번 실행한다.

begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'active_role'
  ) then
    alter table public.profiles rename column role to active_role;
  end if;
end
$$;

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- 기존 사용자는 이전 역할을 그대로 보유하며 기본 진입 영역도 유지한다.
insert into public.user_roles (user_id, role)
select id, active_role
from public.profiles
on conflict (user_id, role) do nothing;

alter table public.user_roles enable row level security;

drop policy if exists "profiles_update_active_role_own" on public.profiles;
create policy "profiles_update_active_role_own" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and exists (
      select 1
      from public.user_roles
      where user_roles.user_id = id
        and user_roles.role = active_role
    )
  );

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own" on public.user_roles
  for select using (auth.uid() = user_id);

drop policy if exists "user_roles_insert_own" on public.user_roles;
create policy "user_roles_insert_own" on public.user_roles
  for insert with check (auth.uid() = user_id);

commit;
