-- LinKross MVP schema fix v2
-- 목적:
--   1) project_requirement_versions를 프로젝트 등록 내용의 단일 진실 소스로 만든다.
--   2) projects에는 소유권, 상태, 현재 요구사항 버전 포인터만 남긴다.
--   3) 프로젝트 생성/요구사항 수정은 원자적인 RPC로만 수행한다.
-- 실행 위치: Supabase Dashboard > SQL Editor > New query
-- 선행 조건: supabase/mvp_domain_schema.sql 실행 완료

begin;

-- ---------------------------------------------------------------------------
-- 0. 사전 검사
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.projects') is null
    or to_regclass('public.project_requirement_versions') is null then
    raise exception 'V2_REQUIRED_TABLE_IS_MISSING';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'goal'
  ) then
    raise exception 'V2_ALREADY_APPLIED_OR_PROJECTS_GOAL_IS_MISSING';
  end if;

  if exists (
    select 1
    from public.projects p
    where not exists (
      select 1
      from public.project_requirement_versions rv
      where rv.project_id = p.id
    )
  ) then
    raise exception 'V2_PROJECT_WITHOUT_REQUIREMENT_VERSION';
  end if;
end;
$$;

-- current pointer가 비어 있는 예외 데이터는 가장 최신 버전으로 복구한다.
update public.projects p
set current_requirement_version_id = (
  select rv.id
  from public.project_requirement_versions rv
  where rv.project_id = p.id
  order by rv.version_number desc
  limit 1
)
where p.current_requirement_version_id is null;

-- v1 적용 후 projects만 수정된 적이 있다면, 컬럼 삭제 전에 새 immutable 버전으로 보존한다.
do $$
declare
  project_row record;
  next_version integer;
  new_version_id uuid;
begin
  for project_row in
    select p.*
    from public.projects p
    join public.project_requirement_versions rv
      on rv.id = p.current_requirement_version_id
     and rv.project_id = p.id
    where p.title is distinct from rv.title
       or p.project_type is distinct from rv.project_type
       or p.technology is distinct from rv.technology
       or p.goal is distinct from rv.goal
       or p.requirements is distinct from rv.requirements
       or p.deliverables is distinct from rv.deliverables
       or p.out_of_scope is distinct from rv.out_of_scope
       or p.reference_notes is distinct from rv.reference_notes
       or p.applicant_guidance is distinct from rv.applicant_guidance
       or p.budget_amount is distinct from rv.budget_amount
       or p.budget_max_amount is distinct from rv.budget_max_amount
       or p.budget_type is distinct from rv.budget_type
       or p.currency is distinct from rv.currency
       or p.start_date is distinct from rv.start_date
       or p.end_date is distinct from rv.end_date
       or p.recruitment_start_at is distinct from rv.recruitment_start_at
       or p.recruitment_end_at is distinct from rv.recruitment_end_at
  loop
    select coalesce(max(rv.version_number), 0) + 1
    into next_version
    from public.project_requirement_versions rv
    where rv.project_id = project_row.id;

    insert into public.project_requirement_versions (
      project_id,
      version_number,
      title,
      project_type,
      technology,
      goal,
      requirements,
      deliverables,
      out_of_scope,
      reference_notes,
      applicant_guidance,
      budget_amount,
      budget_max_amount,
      budget_type,
      currency,
      start_date,
      end_date,
      recruitment_start_at,
      recruitment_end_at,
      created_by
    ) values (
      project_row.id,
      next_version,
      project_row.title,
      project_row.project_type,
      project_row.technology,
      project_row.goal,
      project_row.requirements,
      project_row.deliverables,
      project_row.out_of_scope,
      project_row.reference_notes,
      project_row.applicant_guidance,
      project_row.budget_amount,
      project_row.budget_max_amount,
      project_row.budget_type,
      project_row.currency,
      project_row.start_date,
      project_row.end_date,
      project_row.recruitment_start_at,
      project_row.recruitment_end_at,
      project_row.company_id
    )
    returning id into new_version_id;

    update public.projects
    set current_requirement_version_id = new_version_id
    where id = project_row.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. budget_type 중앙 타입
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.budget_type as enum ('fixed', 'range');
exception when duplicate_object then null;
end $$;

alter table public.project_requirement_versions
  drop constraint if exists project_requirement_versions_budget_type_check;

alter table public.project_requirement_versions
  alter column budget_type drop default;

alter table public.project_requirement_versions
  alter column budget_type type public.budget_type
  using budget_type::public.budget_type;

alter table public.project_requirement_versions
  alter column budget_type set default 'fixed'::public.budget_type;

do $$ begin
  alter table public.project_requirement_versions
    add constraint project_requirement_versions_project_type_valid
    check (
      project_type is null
      or project_type in ('web', 'mobile', 'saas', 'backend', 'other')
    );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. 중복 컬럼 제거를 막는 의존 객체 정리
-- ---------------------------------------------------------------------------

drop view if exists public.public_opportunities;

drop policy if exists projects_public_recruiting_select on public.projects;
drop policy if exists projects_company_insert on public.projects;

drop trigger if exists projects_create_initial_requirement_version on public.projects;
drop function if exists public.create_initial_requirement_version();

drop function if exists public.publish_project_requirements(uuid);

-- 기존 함수가 곧 삭제할 projects 모집기간 컬럼을 참조하므로 먼저 교체한다.
create or replace function private.is_project_recruiting(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    join public.project_requirement_versions rv
      on rv.id = p.current_requirement_version_id
     and rv.project_id = p.id
    where p.id = target_project_id
      and p.status = 'recruiting'::public.project_status
      and now() >= rv.recruitment_start_at
      and now() <= rv.recruitment_end_at
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. projects를 identity/state 테이블로 정규화
-- ---------------------------------------------------------------------------

alter table public.projects
  drop column title,
  drop column project_type,
  drop column technology,
  drop column goal,
  drop column requirements,
  drop column deliverables,
  drop column out_of_scope,
  drop column reference_notes,
  drop column applicant_guidance,
  drop column budget_amount,
  drop column budget_max_amount,
  drop column budget_type,
  drop column currency,
  drop column start_date,
  drop column end_date,
  drop column recruitment_start_at,
  drop column recruitment_end_at;

alter table public.projects
  add column if not exists company_contact_name_snapshot text;

comment on table public.projects is
  'Project identity, ownership and state. Registration content lives only in project_requirement_versions.';

comment on column public.projects.current_requirement_version_id is
  'Authoritative current registration/requirements version for this project.';

-- ---------------------------------------------------------------------------
-- 4. 제안서 제출 검증을 version 기준으로 교체
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

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. 프로젝트 생성/요구사항 수정 RPC
-- ---------------------------------------------------------------------------

create or replace function public.create_project_with_requirements(
  p_title text,
  p_goal text,
  p_requirements text,
  p_budget_amount numeric,
  p_start_date date,
  p_end_date date,
  p_recruitment_start_at timestamptz,
  p_recruitment_end_at timestamptz,
  p_currency text default 'USD',
  p_project_type text default null,
  p_technology text default null,
  p_deliverables text default null,
  p_out_of_scope text default null,
  p_reference_notes text default null,
  p_applicant_guidance text default null,
  p_budget_max_amount numeric default null,
  p_budget_type public.budget_type default 'fixed'::public.budget_type
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  company_contact_name text;
  new_project_id uuid;
  new_version_id uuid;
begin
  if actor_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not private.has_role('company'::public.user_role) then
    raise exception 'COMPANY_ROLE_REQUIRED';
  end if;

  select nullif(trim(cp.contact_name), '')
  into company_contact_name
  from public.company_profiles cp
  where cp.id = actor_id;

  if company_contact_name is null then
    raise exception 'COMPANY_PROFILE_REQUIRED';
  end if;

  if length(trim(p_title)) = 0
    or length(trim(p_goal)) = 0
    or length(trim(p_requirements)) = 0 then
    raise exception 'TITLE_GOAL_REQUIREMENTS_REQUIRED';
  end if;

  insert into public.projects (
    company_id,
    company_contact_name_snapshot,
    status,
    lifecycle_stage
  ) values (
    actor_id,
    company_contact_name,
    'recruiting'::public.project_status,
    'preparing'::public.project_lifecycle_stage
  )
  returning id into new_project_id;

  insert into public.project_requirement_versions (
    project_id,
    version_number,
    title,
    project_type,
    technology,
    goal,
    requirements,
    deliverables,
    out_of_scope,
    reference_notes,
    applicant_guidance,
    budget_amount,
    budget_max_amount,
    budget_type,
    currency,
    start_date,
    end_date,
    recruitment_start_at,
    recruitment_end_at,
    created_by
  ) values (
    new_project_id,
    1,
    trim(p_title),
    p_project_type,
    p_technology,
    trim(p_goal),
    trim(p_requirements),
    p_deliverables,
    p_out_of_scope,
    p_reference_notes,
    p_applicant_guidance,
    p_budget_amount,
    p_budget_max_amount,
    p_budget_type,
    upper(p_currency),
    p_start_date,
    p_end_date,
    p_recruitment_start_at,
    p_recruitment_end_at,
    actor_id
  )
  returning id into new_version_id;

  update public.projects
  set current_requirement_version_id = new_version_id
  where id = new_project_id;

  return new_project_id;
end;
$$;

create or replace function public.update_project_requirements(
  p_project_id uuid,
  p_title text,
  p_goal text,
  p_requirements text,
  p_budget_amount numeric,
  p_start_date date,
  p_end_date date,
  p_recruitment_start_at timestamptz,
  p_recruitment_end_at timestamptz,
  p_currency text default 'USD',
  p_project_type text default null,
  p_technology text default null,
  p_deliverables text default null,
  p_out_of_scope text default null,
  p_reference_notes text default null,
  p_applicant_guidance text default null,
  p_budget_max_amount numeric default null,
  p_budget_type public.budget_type default 'fixed'::public.budget_type
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  project_status_value public.project_status;
  next_version integer;
  new_version_id uuid;
begin
  if actor_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  select p.status
  into project_status_value
  from public.projects p
  where p.id = p_project_id
    and p.company_id = actor_id
  for update;

  if project_status_value is null then
    raise exception 'PROJECT_OWNER_REQUIRED';
  end if;

  if project_status_value <> 'recruiting'::public.project_status then
    raise exception 'PROJECT_REQUIREMENTS_LOCKED';
  end if;

  if length(trim(p_title)) = 0
    or length(trim(p_goal)) = 0
    or length(trim(p_requirements)) = 0 then
    raise exception 'TITLE_GOAL_REQUIREMENTS_REQUIRED';
  end if;

  select coalesce(max(rv.version_number), 0) + 1
  into next_version
  from public.project_requirement_versions rv
  where rv.project_id = p_project_id;

  insert into public.project_requirement_versions (
    project_id,
    version_number,
    title,
    project_type,
    technology,
    goal,
    requirements,
    deliverables,
    out_of_scope,
    reference_notes,
    applicant_guidance,
    budget_amount,
    budget_max_amount,
    budget_type,
    currency,
    start_date,
    end_date,
    recruitment_start_at,
    recruitment_end_at,
    created_by
  ) values (
    p_project_id,
    next_version,
    trim(p_title),
    p_project_type,
    p_technology,
    trim(p_goal),
    trim(p_requirements),
    p_deliverables,
    p_out_of_scope,
    p_reference_notes,
    p_applicant_guidance,
    p_budget_amount,
    p_budget_max_amount,
    p_budget_type,
    upper(p_currency),
    p_start_date,
    p_end_date,
    p_recruitment_start_at,
    p_recruitment_end_at,
    actor_id
  )
  returning id into new_version_id;

  update public.projects
  set current_requirement_version_id = new_version_id
  where id = p_project_id;

  return new_version_id;
end;
$$;

revoke all on function public.create_project_with_requirements(
  text, text, text, numeric, date, date, timestamptz, timestamptz,
  text, text, text, text, text, text, text, numeric, public.budget_type
) from public;

grant execute on function public.create_project_with_requirements(
  text, text, text, numeric, date, date, timestamptz, timestamptz,
  text, text, text, text, text, text, text, numeric, public.budget_type
) to authenticated;

revoke all on function public.update_project_requirements(
  uuid, text, text, text, numeric, date, date, timestamptz, timestamptz,
  text, text, text, text, text, text, text, numeric, public.budget_type
) from public;

grant execute on function public.update_project_requirements(
  uuid, text, text, text, numeric, date, date, timestamptz, timestamptz,
  text, text, text, text, text, text, text, numeric, public.budget_type
) to authenticated;

-- direct INSERT를 막아 project와 requirement version이 따로 생성되는 것을 방지한다.
revoke insert on public.projects from authenticated;

-- 요구사항 포인터는 RPC만 바꾸고, 사용자는 상태 컬럼만 직접 갱신할 수 있다.
revoke update on public.projects from authenticated;
grant update (status, lifecycle_stage, archived_at) on public.projects to authenticated;

-- ---------------------------------------------------------------------------
-- 6. 공개 조회와 RLS를 current version 기준으로 재구성
-- ---------------------------------------------------------------------------

create or replace function private.is_current_requirement_version(
  target_version_id uuid,
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and p.current_requirement_version_id = target_version_id
  );
$$;

revoke execute on function private.is_current_requirement_version(uuid, uuid)
from public;
grant execute on function private.is_current_requirement_version(uuid, uuid)
to anon, authenticated;

create policy projects_public_recruiting_select
on public.projects for select
to anon, authenticated
using ((select private.is_project_recruiting(id)));

drop policy if exists requirement_versions_recruiting_or_participant_select
on public.project_requirement_versions;

create policy requirement_versions_recruiting_or_participant_select
on public.project_requirement_versions for select
to anon, authenticated
using (
  (
    (select private.is_project_recruiting(project_id))
    and (select private.is_current_requirement_version(id, project_id))
  )
  or (select private.can_access_project(project_id))
);

create or replace view public.public_opportunities
with (security_barrier = true)
as
select
  p.id,
  rv.title,
  rv.project_type,
  rv.technology,
  rv.goal,
  rv.requirements,
  rv.deliverables,
  rv.out_of_scope,
  rv.applicant_guidance,
  rv.budget_amount,
  rv.budget_max_amount,
  rv.budget_type,
  rv.currency,
  rv.start_date,
  rv.end_date,
  rv.recruitment_start_at,
  rv.recruitment_end_at,
  cp.organization_name,
  p.current_requirement_version_id,
  p.created_at
from public.projects p
join public.project_requirement_versions rv
  on rv.id = p.current_requirement_version_id
 and rv.project_id = p.id
join public.company_profiles cp on cp.id = p.company_id
where p.status = 'recruiting'::public.project_status
  and now() >= rv.recruitment_start_at
  and now() <= rv.recruitment_end_at;

revoke all on public.public_opportunities from public;
grant select on public.public_opportunities to anon, authenticated;

notify pgrst, 'reload schema';

commit;

-- ---------------------------------------------------------------------------
-- 7. 실행 후 검증: 아래 세 값이 모두 true/0이어야 한다.
-- ---------------------------------------------------------------------------

select
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name in (
        'goal', 'requirements', 'deliverables', 'out_of_scope',
        'budget_amount', 'recruitment_start_at'
      )
  ) as duplicate_columns_removed,
  not exists (
    select 1
    from public.projects
    where current_requirement_version_id is null
  ) as all_projects_have_current_version,
  (
    select count(*)
    from public.projects p
    left join public.project_requirement_versions rv
      on rv.id = p.current_requirement_version_id
     and rv.project_id = p.id
    where rv.id is null
  ) as broken_current_version_links;
