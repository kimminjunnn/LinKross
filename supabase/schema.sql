-- Supabase SQL Editor에서 한 번 실행한다.
-- 기업/프리랜서 역할을 저장하는 최소 프로필 테이블.

create type public.user_role as enum ('company', 'freelancer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 본인 프로필만 조회 가능
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- 본인 명의로만 최초 1회 생성 가능 (역할 변경은 이 정책으로 막혀 있음 — 업데이트 정책 없음)
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
