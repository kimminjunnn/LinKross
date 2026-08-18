-- Supabase SQL Editor에서 실행 (schema.sql 이후 아무 때나).
-- 온보딩 폼에서 입력한 역할별 상세 프로필을 저장한다.
-- user_roles와 분리된 테이블이라 update 정책을 열어도 역할 위조 위험이 없다.

create table public.company_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  organization_name text not null,
  contact_name text not null,
  contact_role text not null,
  team_size text not null,
  website text,
  created_at timestamptz not null default now()
);

alter table public.company_profiles enable row level security;

create policy "company_profiles_select_public" on public.company_profiles
  for select to anon, authenticated using (true);

create policy "company_profiles_insert_own" on public.company_profiles
  for insert with check (auth.uid() = id);

create policy "company_profiles_update_own" on public.company_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create table public.freelancer_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  timezone text not null,
  headline text not null,
  skills text not null,
  portfolio_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.freelancer_profiles enable row level security;

create policy "freelancer_profiles_select_public" on public.freelancer_profiles
  for select to anon, authenticated using (true);

create policy "freelancer_profiles_insert_own" on public.freelancer_profiles
  for insert with check (auth.uid() = id);

create policy "freelancer_profiles_update_own" on public.freelancer_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
