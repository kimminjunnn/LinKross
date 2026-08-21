-- Supabase SQL Editor에서 실행.
-- 플랫폼 자체 매출 모델(기업 구독료 + 프리랜서 수수료) 추가.
--
-- 1) commission_charges: payments.status가 completed로 바뀔 때 트리거가 자동으로 생성하는
--    프리랜서 수수료 청구(마일스톤 지급액의 7%). LinKross는 에스크로를 쥐지 않으므로
--    실제 납부는 프리랜서가 자진신고(status: pending -> paid)한다. reviewed_by/reviewed_at은
--    지금은 아무도 안 쓰지만, 나중에 회사/관리자 확인 단계를 추가할 때 마이그레이션 없이
--    확장할 수 있도록 컬럼만 미리 만들어둔다.
-- 2) subscriptions: 기업당 구독 상태/금액을 추적만 한다. 이번 스코프에서는 아무것도
--    강제하지 않는 의도적인 no-op — 향후 확장 지점.
-- 3) 미납 수수료 제재: 연체 즉시 새 지원(proposals insert) 차단(prepare_proposal_insert
--    트리거 확장 + RLS), 14일 유예 후에는 앱 레벨에서 기존 프로젝트 마일스톤 제출도 차단
--    (src/lib/backend/verification.ts, 이 SQL이 아니라 앱 코드에서 처리).

begin;

-- ---------------------------------------------------------------------------
-- 1. enum + 테이블
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.commission_charge_status as enum ('pending', 'paid', 'waived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_status as enum ('active', 'past_due', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.commission_charges (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  milestone_record_id uuid not null references public.milestones(id) on delete restrict,
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  freelancer_id uuid not null references auth.users(id) on delete restrict,
  base_amount numeric not null check (base_amount >= 0),
  commission_rate numeric not null default 0.07 check (commission_rate >= 0 and commission_rate <= 1),
  commission_amount numeric not null check (commission_amount >= 0),
  currency text not null default 'USDC',
  status public.commission_charge_status not null default 'pending',
  due_at timestamptz not null default now(),
  paid_at timestamptz,
  paid_reference text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists commission_charges_freelancer_idx
  on public.commission_charges (freelancer_id, status);
create index if not exists commission_charges_project_idx
  on public.commission_charges (project_id, created_at desc);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.profiles(id) on delete restrict,
  status public.subscription_status not null default 'active',
  amount numeric not null default 0 check (amount >= 0),
  currency text not null default 'KRW',
  period_start_at timestamptz not null default now(),
  period_end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. 트리거: payments가 completed로 바뀌면 수수료 청구 자동 생성
--    advancePaymentStatus/verifyWalletPayment 두 진입점 모두 여기로 모인다.
-- ---------------------------------------------------------------------------

create or replace function public.create_commission_charge_on_payment_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  freelancer_id_value uuid;
  commission_rate_value numeric := 0.07; -- src/config/commission-status.ts의 COMMISSION_RATE와 반드시 동일하게 유지
begin
  if new.status <> 'completed'::public.payment_record_status
     or old.status = 'completed'::public.payment_record_status then
    return new;
  end if;

  select pr.freelancer_id into freelancer_id_value
  from public.selections s
  join public.proposals pr on pr.id = s.proposal_id
  where s.project_id = new.project_id;

  if freelancer_id_value is null then
    raise exception 'COMMISSION_FREELANCER_NOT_FOUND';
  end if;

  insert into public.commission_charges (
    project_id, milestone_record_id, payment_id, freelancer_id,
    base_amount, commission_rate, commission_amount, currency, due_at
  ) values (
    new.project_id, new.milestone_record_id, new.id, freelancer_id_value,
    new.amount_usdc, commission_rate_value, round(new.amount_usdc * commission_rate_value, 2),
    new.currency, now()
  )
  on conflict (payment_id) do nothing;

  return new;
end;
$$;

drop trigger if exists payments_create_commission_charge on public.payments;
create trigger payments_create_commission_charge
  after update on public.payments
  for each row
  execute function public.create_commission_charge_on_payment_completion();

-- ---------------------------------------------------------------------------
-- 3. RLS + 헬퍼 함수
-- ---------------------------------------------------------------------------

alter table public.commission_charges enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists commission_charges_freelancer_select on public.commission_charges;
create policy commission_charges_freelancer_select
on public.commission_charges for select
to authenticated
using (freelancer_id = (select auth.uid()));

drop policy if exists commission_charges_company_select on public.commission_charges;
create policy commission_charges_company_select
on public.commission_charges for select
to authenticated
using ((select private.is_project_owner(project_id)));

drop policy if exists commission_charges_freelancer_mark_paid on public.commission_charges;
create policy commission_charges_freelancer_mark_paid
on public.commission_charges for update
to authenticated
using (freelancer_id = (select auth.uid()) and status = 'pending'::public.commission_charge_status)
with check (freelancer_id = (select auth.uid()));

drop policy if exists subscriptions_company_select on public.subscriptions;
create policy subscriptions_company_select
on public.subscriptions for select
to authenticated
using (company_id = (select auth.uid()));

drop policy if exists subscriptions_company_upsert on public.subscriptions;
create policy subscriptions_company_upsert
on public.subscriptions for insert
to authenticated
with check (company_id = (select auth.uid()) and (select private.has_role('company'::public.user_role)));

drop policy if exists subscriptions_company_update on public.subscriptions;
create policy subscriptions_company_update
on public.subscriptions for update
to authenticated
using (company_id = (select auth.uid()))
with check (company_id = (select auth.uid()));

grant select, update on public.commission_charges to authenticated;
grant select, insert, update on public.subscriptions to authenticated;

create or replace function private.has_overdue_commission(target_freelancer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.commission_charges c
    where c.freelancer_id = target_freelancer_id
      and c.status = 'pending'::public.commission_charge_status
      and c.due_at < now()
  );
$$;

create or replace function private.has_grace_expired_commission(target_freelancer_id uuid, grace_days int)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.commission_charges c
    where c.freelancer_id = target_freelancer_id
      and c.status = 'pending'::public.commission_charge_status
      and c.due_at < now() - make_interval(days => grace_days)
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. prepare_proposal_insert() 확장 — 미납 수수료가 있으면 새 지원 즉시 차단.
--    fix_prepare_proposal_insert_require_profile.sql의 최신 본문을 기준으로,
--    FREELANCER_PROFILE_REQUIRED 체크 앞에 COMMISSION_OVERDUE 체크만 추가한다.
-- ---------------------------------------------------------------------------

create or replace function public.prepare_proposal_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_status_value public.project_status;
  requirement_version_id_value uuid;
  recruitment_start_value timestamptz;
  recruitment_end_value timestamptz;
begin
  select
    p.status,
    p.current_requirement_version_id,
    rv.recruitment_start_at,
    rv.recruitment_end_at
  into
    project_status_value,
    requirement_version_id_value,
    recruitment_start_value,
    recruitment_end_value
  from public.projects p
  join public.project_requirement_versions rv
    on rv.id = p.current_requirement_version_id
   and rv.project_id = p.id
  where p.id = new.project_id;

  if requirement_version_id_value is null then
    raise exception 'PROJECT_OR_CURRENT_REQUIREMENT_VERSION_NOT_FOUND';
  end if;

  if new.freelancer_id <> (select auth.uid()) then
    raise exception 'FREELANCER_ID_MISMATCH';
  end if;

  if not private.has_role('freelancer'::public.user_role) then
    raise exception 'FREELANCER_ROLE_REQUIRED';
  end if;

  if project_status_value <> 'recruiting'::public.project_status
    or now() < recruitment_start_value
    or now() > recruitment_end_value then
    raise exception 'RECRUITMENT_NOT_OPEN';
  end if;

  if length(trim(new.content)) = 0 then
    raise exception 'PROPOSAL_CONTENT_REQUIRED';
  end if;

  if private.has_overdue_commission(new.freelancer_id) then
    raise exception 'COMMISSION_OVERDUE';
  end if;

  new.requirement_version_id = requirement_version_id_value;
  new.status = 'submitted'::public.proposal_status;
  new.submitted_at = coalesce(new.submitted_at, now());

  select
    fp.display_name,
    fp.headline,
    fp.skills,
    fp.portfolio_urls
  into
    new.freelancer_display_name_snapshot,
    new.freelancer_headline_snapshot,
    new.freelancer_skills_snapshot,
    new.freelancer_portfolio_urls_snapshot
  from public.freelancer_profiles fp
  where fp.id = new.freelancer_id;

  if not found then
    raise exception 'FREELANCER_PROFILE_REQUIRED';
  end if;

  return new;
end;
$$;

drop policy if exists proposals_freelancer_insert on public.proposals;
create policy proposals_freelancer_insert
on public.proposals for insert
to authenticated
with check (
  freelancer_id = (select auth.uid())
  and (select private.has_role('freelancer'::public.user_role))
  and (select private.is_project_recruiting(project_id))
  and not (select private.has_overdue_commission(freelancer_id))
);

commit;
