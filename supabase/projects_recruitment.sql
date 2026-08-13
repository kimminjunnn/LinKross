-- Supabase SQL Editor에서 실행 (onboarding_profiles.sql 이후 아무 때나, payments.sql과는 독립적).
-- 프로젝트 등록 -> 모집 -> 자유형식 수행 제안서 제출 -> 발주자 선정까지의 스키마.
-- SOW/마일스톤/완료조건, GitHub 검수, 결제는 각 기능 착수 시 별도 스키마 파일로 분리한다.
-- talent-assessment(필수 응답 항목·평가 가중치를 강제하는 별도 프로토타입)와는 무관하다.

create type public.project_status as enum ('recruiting', 'closed');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  goal text not null,
  requirements text not null,
  reference_notes text,
  budget_amount numeric not null,
  currency text not null default 'USD',
  start_date date not null,
  end_date date not null,
  recruitment_start_at timestamptz not null,
  recruitment_end_at timestamptz not null,
  status public.project_status not null default 'recruiting',
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (recruitment_end_at > recruitment_start_at)
);

alter table public.projects enable row level security;

-- 발주자 본인 명의로만, company 역할일 때만 생성 가능
create policy "projects_insert_own_company" on public.projects
  for insert to authenticated
  with check (
    auth.uid() = company_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'company'
    )
  );

-- 발주자는 자기 프로젝트를 항상 조회. 그 외 로그인 사용자는 모집 중인 프로젝트만 조회(지원자가 둘러보기 위함)
create policy "projects_select_own_or_recruiting" on public.projects
  for select to authenticated
  using (auth.uid() = company_id or status = 'recruiting');

-- 발주자 본인만 수정 가능(모집 마감 등 상태 전환). requirements 버전 이력이 필요해지면 SOW 작업 시 별도 테이블로 분리한다.
create policy "projects_update_own" on public.projects
  for update to authenticated
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

-- delete 정책 없음: 등록된 프로젝트는 삭제 대신 상태로 관리한다.

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  submitted_at timestamptz not null default now(),
  unique (project_id, freelancer_id)
);

alter table public.proposals enable row level security;

-- 지원자 본인 명의로만, 모집 중이고 마감 전인 프로젝트에만 제출 가능. 프로젝트당 1인 1제출(중복 제출 방지)은 위 unique 제약으로 처리.
create policy "proposals_insert_own_while_recruiting" on public.proposals
  for insert to authenticated
  with check (
    auth.uid() = freelancer_id
    and exists (
      select 1 from public.projects
      where id = project_id
        and status = 'recruiting'
        and now() <= recruitment_end_at
    )
  );

-- 지원자는 자기 제안서만, 발주자는 자기 프로젝트에 들어온 모든 제안서 원문을 목록/상세에서 조회 가능
create policy "proposals_select_own_or_project_owner" on public.proposals
  for select to authenticated
  using (
    auth.uid() = freelancer_id
    or exists (
      select 1 from public.projects
      where id = project_id and company_id = auth.uid()
    )
  );

-- update/delete 정책 없음: 제출된 제안서 원문은 조용히 덮어쓰지 않는다(기획 6장 원칙). 수정이 필요하면 새 지원이 아니라 발주자와 별도 협의 사항이다.

create table public.selections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete restrict,
  selected_by uuid references auth.users(id) on delete set null,
  selected_at timestamptz not null default now()
);

alter table public.selections enable row level security;

-- 프로젝트 소유 발주자만, 자기 프로젝트 + 그 프로젝트에 실제로 제출된 제안서에 대해서만 선정 기록 생성 가능.
-- project_id에 unique 제약을 걸어 프로젝트당 선정 1건으로 제한한다(MVP 단일 개발자 원칙).
create policy "selections_insert_by_project_owner" on public.selections
  for insert to authenticated
  with check (
    auth.uid() = selected_by
    and exists (
      select 1 from public.projects
      where id = project_id and company_id = auth.uid()
    )
    and exists (
      select 1 from public.proposals p
      where p.id = proposal_id and p.project_id = project_id
    )
  );

-- 발주자 본인과 선정된 지원자 본인만 조회 가능(제안서 테이블을 통해 지원자를 식별)
create policy "selections_select_owner_or_selected" on public.selections
  for select to authenticated
  using (
    exists (
      select 1 from public.proposals
      where id = proposal_id and freelancer_id = auth.uid()
    )
    or exists (
      select 1 from public.projects
      where id = project_id and company_id = auth.uid()
    )
  );

-- update/delete 정책 없음: 선정 기록은 불변 감사 이력이다. 재선정이 필요하면 팀 협의 후 SQL 콘솔에서 직접 처리한다.

-- 선정이 확정되면 프로젝트를 자동으로 모집 마감 처리한다(선정 후 추가 제안서 제출을 서버 측에서 차단).
create or replace function public.close_project_on_selection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects set status = 'closed' where id = new.project_id;
  return new;
end;
$$;

create trigger selections_close_project
  after insert on public.selections
  for each row
  execute function public.close_project_on_selection();
