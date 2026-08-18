-- Supabase SQL Editor에서 한 번 실행한다.
-- 사용자 기본 진입 영역과 보유 역할을 분리해 저장한다.

create type public.user_role as enum ('company', 'freelancer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  active_role public.user_role not null,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- 본인 프로필만 조회 가능
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- 본인 명의로만 프로필을 생성할 수 있다.
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- active_role은 실제 보유한 역할 중에서만 변경할 수 있다.
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

create policy "user_roles_select_own" on public.user_roles
  for select using (auth.uid() = user_id);

-- 기업/프리랜서 참여는 사용자가 직접 선택할 수 있으므로 본인의 역할만 추가 가능하다.
create policy "user_roles_insert_own" on public.user_roles
  for insert with check (auth.uid() = user_id);
