-- Supabase SQL Editor에서 실행 (fix_add_commission_and_subscription.sql 이후 아무 때나 실행 가능).
-- 팀이 아직 직접 검수/QA하는 단계라, 미납 수수료 때문에 실수로 지원이나 마일스톤 제출이
-- 막히면 오히려 방해가 된다. 그래서 DB 레벨의 실제 차단(prepare_proposal_insert 트리거,
-- proposals_freelancer_insert RLS)을 커밋 이전 상태로 되돌린다.
-- 앱 레벨 체크(src/lib/backend/proposals.ts, verification.ts)도 src/config/commission-status.ts의
-- COMMISSION_ENFORCEMENT_ENABLED = false로 이미 꺼놨다.
-- 미납 표시·자진신고·VAT 표시 등 추적용 UI/데이터는 이 파일과 무관하게 계속 그대로 동작한다.
-- 나중에 실제로 차단을 켜고 싶으면: 이 파일 대신 fix_add_commission_and_subscription.sql의
-- prepare_proposal_insert()/proposals_freelancer_insert 정의를 다시 실행하고,
-- COMMISSION_ENFORCEMENT_ENABLED를 true로 바꾸면 된다.

begin;

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
);

commit;
