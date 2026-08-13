-- LinKross MVP schema fix v3
-- 목적:
--   1) SOW 검토 중 revision_requested 결정과 사유를 append-only로 보존한다.
--   2) 수정 요청된 SOW 원문은 고정하고 다음 변경은 새 SOW 버전에서만 수행한다.
--   3) 모든 completion_criteria가 반드시 하나의 milestone에 속하도록 고정한다.
-- 실행 위치: Supabase Dashboard > SQL Editor > New query
-- 선행 조건: mvp_domain_schema.sql + mvp_schema_fix_v2.sql 실행 완료

-- PostgreSQL enum 값 추가는 이후 트랜잭션에서 안전하게 사용하도록 먼저 확정한다.
begin;

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'sow_status'
      and e.enumlabel = 'revision_requested'
  ) then
    alter type public.sow_status add value 'revision_requested' after 'in_review';
  end if;
end;
$$;

commit;

begin;

do $$
begin
  if to_regclass('public.sow_versions') is null
    or to_regclass('public.sow_approvals') is null
    or to_regclass('public.milestones') is null
    or to_regclass('public.completion_criteria') is null
    or to_regclass('public.projects') is null then
    raise exception 'V3_REQUIRED_TABLE_IS_MISSING';
  end if;

  if exists (
    select 1
    from public.completion_criteria cc
    where cc.milestone_id is null
      and not exists (
        select 1
        from public.milestones m
        where m.sow_version_id = cc.sow_version_id
          and m.project_id = cc.project_id
      )
  ) then
    raise exception 'V3_GLOBAL_CRITERION_HAS_NO_TARGET_MILESTONE';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. 모든 완료조건을 마일스톤 소속으로 정규화
-- ---------------------------------------------------------------------------

-- 승인된 과거 SOW의 NULL 조건도 데이터 교정할 수 있도록 보호 트리거를 트랜잭션 안에서
-- 잠시 제거한다. 실패 시 DROP과 데이터 변경은 함께 롤백된다.
drop trigger if exists completion_criteria_protect_sow
on public.completion_criteria;

with global_targets as (
  select
    cc.id as criterion_id,
    cc.kind,
    last_milestone.id as milestone_id,
    row_number() over (
      partition by last_milestone.id, cc.kind
      order by cc.position, cc.id
    ) as append_order
  from public.completion_criteria cc
  join lateral (
    select m.id
    from public.milestones m
    where m.sow_version_id = cc.sow_version_id
      and m.project_id = cc.project_id
    order by m.position desc, m.id desc
    limit 1
  ) last_milestone on true
  where cc.milestone_id is null
), target_positions as (
  select
    gt.criterion_id,
    gt.milestone_id,
    coalesce((
      select max(existing.position)
      from public.completion_criteria existing
      where existing.milestone_id = gt.milestone_id
        and existing.kind = gt.kind
    ), 0) + gt.append_order as new_position
  from global_targets gt
)
update public.completion_criteria cc
set milestone_id = tp.milestone_id,
    position = tp.new_position
from target_positions tp
where cc.id = tp.criterion_id;

do $$
begin
  if exists (
    select 1
    from public.completion_criteria
    where milestone_id is null
  ) then
    raise exception 'V3_CRITERION_MILESTONE_BACKFILL_FAILED';
  end if;
end;
$$;

drop index if exists public.completion_criteria_global_position_uidx;

alter table public.completion_criteria
  alter column milestone_id set not null;

create trigger completion_criteria_protect_sow
before insert or update or delete on public.completion_criteria
for each row execute function public.protect_sow_children();

comment on column public.completion_criteria.milestone_id is
  'Required milestone ownership. Project-wide criteria are assigned to the final milestone.';

-- ---------------------------------------------------------------------------
-- 2. SOW 수정 요청 append-only 이력
-- ---------------------------------------------------------------------------

create table if not exists public.sow_revision_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  sow_version_id uuid not null,
  decision text not null default 'revision_requested'
    check (decision = 'revision_requested'),
  reason text not null check (length(trim(reason)) > 0),
  content_hash text not null,
  requested_by uuid references auth.users(id) on delete set null,
  requester_role public.user_role not null,
  requester_name_snapshot text,
  requested_at timestamptz not null default now(),
  unique (sow_version_id, requester_role),
  constraint sow_revision_requests_sow_project_fkey
    foreign key (sow_version_id, project_id)
    references public.sow_versions(id, project_id)
    on delete restrict
);

create index if not exists sow_revision_requests_project_idx
  on public.sow_revision_requests (project_id, requested_at desc);

comment on table public.sow_revision_requests is
  'Append-only SOW revision decisions. The reviewed SOW version remains immutable.';

create or replace function public.validate_sow_revision_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sow_row public.sow_versions%rowtype;
begin
  select * into sow_row
  from public.sow_versions
  where id = new.sow_version_id
    and project_id = new.project_id;

  if sow_row.id is null then
    raise exception 'SOW_VERSION_NOT_FOUND';
  end if;

  if sow_row.status <> 'in_review'::public.sow_status then
    raise exception 'SOW_NOT_READY_FOR_REVISION_REQUEST';
  end if;

  if new.content_hash <> sow_row.content_hash then
    raise exception 'SOW_CONTENT_HASH_MISMATCH';
  end if;

  if length(trim(new.reason)) = 0 then
    raise exception 'SOW_REVISION_REASON_REQUIRED';
  end if;

  new.decision = 'revision_requested';
  new.reason = trim(new.reason);
  new.requested_by = (select auth.uid());

  if private.is_project_owner(new.project_id) then
    new.requester_role = 'company'::public.user_role;

    select cp.contact_name
    into new.requester_name_snapshot
    from public.company_profiles cp
    where cp.id = (select auth.uid());
  elsif private.is_selected_freelancer(new.project_id) then
    new.requester_role = 'freelancer'::public.user_role;

    select fp.display_name
    into new.requester_name_snapshot
    from public.freelancer_profiles fp
    where fp.id = (select auth.uid());
  else
    raise exception 'PROJECT_PARTICIPANT_REQUIRED';
  end if;

  if exists (
    select 1
    from public.sow_approvals sa
    where sa.sow_version_id = new.sow_version_id
      and sa.approver_role = new.requester_role
  ) then
    raise exception 'SOW_REVIEW_DECISION_ALREADY_RECORDED';
  end if;

  return new;
end;
$$;

create or replace function public.apply_sow_revision_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.sow_versions
  set status = 'revision_requested'::public.sow_status,
      updated_at = now()
  where id = new.sow_version_id
    and project_id = new.project_id
    and status = 'in_review'::public.sow_status;

  if not found then
    raise exception 'SOW_REVISION_STATE_TRANSITION_FAILED';
  end if;

  insert into public.audit_events (
    project_id,
    actor_user_id,
    actor_role,
    event_type,
    entity_type,
    entity_id,
    metadata
  ) values (
    new.project_id,
    new.requested_by,
    new.requester_role,
    'sow.revision_requested',
    'sow_revision_request',
    new.id::text,
    jsonb_build_object(
      'sow_version_id', new.sow_version_id,
      'content_hash', new.content_hash
    )
  );

  return new;
end;
$$;

create or replace function public.protect_sow_revision_request()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'SOW_REVISION_REQUEST_IS_APPEND_ONLY';
end;
$$;

drop trigger if exists sow_revision_requests_validate
on public.sow_revision_requests;
create trigger sow_revision_requests_validate
before insert on public.sow_revision_requests
for each row execute function public.validate_sow_revision_request();

drop trigger if exists sow_revision_requests_apply
on public.sow_revision_requests;
create trigger sow_revision_requests_apply
after insert on public.sow_revision_requests
for each row execute function public.apply_sow_revision_request();

drop trigger if exists sow_revision_requests_append_only
on public.sow_revision_requests;
create trigger sow_revision_requests_append_only
before update or delete on public.sow_revision_requests
for each row execute function public.protect_sow_revision_request();

alter table public.sow_revision_requests enable row level security;

drop policy if exists sow_revision_requests_participant_select
on public.sow_revision_requests;
create policy sow_revision_requests_participant_select
on public.sow_revision_requests for select
to authenticated
using ((select private.can_access_project(project_id)));

drop policy if exists sow_revision_requests_participant_insert
on public.sow_revision_requests;
create policy sow_revision_requests_participant_insert
on public.sow_revision_requests for insert
to authenticated
with check (
  requested_by = (select auth.uid())
  and (select private.can_access_project(project_id))
);

grant select, insert on public.sow_revision_requests to authenticated;
revoke update, delete on public.sow_revision_requests from authenticated;

notify pgrst, 'reload schema';

commit;

-- 실행 후 검증:
-- row_security=true, update/delete 권한=false,
-- revision_status_exists=true, criteria_without_milestone=0이어야 한다.
select
  c.relrowsecurity as row_security,
  has_table_privilege('authenticated', 'public.sow_revision_requests', 'UPDATE')
    as authenticated_can_update,
  has_table_privilege('authenticated', 'public.sow_revision_requests', 'DELETE')
    as authenticated_can_delete,
  exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'sow_status'
      and e.enumlabel = 'revision_requested'
  ) as revision_status_exists,
  (
    select count(*)
    from public.completion_criteria
    where milestone_id is null
  ) as criteria_without_milestone
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'sow_revision_requests';
