-- Supabase SQL Editor에서 실행 (schema.sql 다음에 실행하는 두 번째 스크립트).
-- 온체인 검증에 성공한 지급 기록을 저장하는 테이블.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  milestone_id text not null,
  tx_hash text not null unique,
  to_address text not null,
  amount_usdc numeric not null,
  block_number bigint not null,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- MVP: 프로젝트/조직 구분이 아직 없어 로그인한 사용자는 누구나 지급 기록을 조회할 수 있다.
create policy "payments_select_authenticated" on public.payments
  for select to authenticated using (true);

-- 검증을 트리거한 로그인 사용자 본인 명의로만 생성 가능. update/delete 정책 없음 — 증빙은 불변.
create policy "payments_insert_own" on public.payments
  for insert to authenticated with check (auth.uid() = verified_by);
