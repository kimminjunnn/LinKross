-- 완료조건 자동 판정에 대한 발주자의 수동 판정.
--
-- 자동 검수가 실패하거나 판단을 보류(확인 필요)했을 때, 발주자가 Preview를 직접
-- 보고 통과 또는 실패로 확정할 수 있어야 한다. 최종 승인은 사람이 한다는 원칙
-- (CLAUDE.md 5장)을 완료조건 단위로 내린 것이다.
--
-- criterion_results를 덮어쓰지 않는다. 자동 판정 원문은 그대로 두고 사람의 결정을
-- 별도 행으로 쌓는다. 같은 완료조건을 여러 번 뒤집어도 모든 결정이 남고, 화면과
-- 통합 증빙은 최신 행을 현재 상태로 쓰되 이전 결정도 추적할 수 있다.

do $$
begin
  create type public.criterion_manual_decision_type as enum ('passed', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.criterion_manual_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  milestone_id uuid not null,
  run_id uuid not null,
  criterion_id uuid not null,
  decision public.criterion_manual_decision_type not null,
  -- 뒤집기 직전의 자동 판정. 나중에 자동 판정이 재검수로 바뀌어도 "무엇을 보고
  -- 뒤집었는지"가 남아야 근거가 된다.
  automated_status public.criterion_result_status,
  reason text not null check (length(btrim(reason)) between 1 and 2000),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  constraint criterion_manual_decisions_run_scope_fkey
    foreign key (run_id, milestone_id, project_id)
    references public.verification_runs(id, milestone_id, project_id)
    on delete restrict,
  constraint criterion_manual_decisions_criterion_milestone_fkey
    foreign key (criterion_id, milestone_id)
    references public.completion_criteria(id, milestone_id)
    on delete restrict
);

-- 화면은 실행별로 "이 완료조건의 최신 사람 판정"을 찾는다.
create index if not exists criterion_manual_decisions_run_idx
  on public.criterion_manual_decisions (run_id, criterion_id, decided_at desc);
create index if not exists criterion_manual_decisions_project_idx
  on public.criterion_manual_decisions (project_id, decided_at desc);

alter table public.criterion_manual_decisions enable row level security;

drop policy if exists criterion_manual_decisions_participant_select
  on public.criterion_manual_decisions;
drop policy if exists criterion_manual_decisions_owner_insert
  on public.criterion_manual_decisions;

-- 프리랜서도 자기 결과가 어떻게 판정됐는지 봐야 하므로 열람은 참여자 전체에 연다.
create policy criterion_manual_decisions_participant_select
on public.criterion_manual_decisions for select
to authenticated
using ((select private.can_access_project(project_id)));

-- 판정은 발주자만, 그리고 자기 이름으로만 남긴다.
create policy criterion_manual_decisions_owner_insert
on public.criterion_manual_decisions for insert
to authenticated
with check (
  (select private.is_project_owner(project_id))
  and decided_by = (select auth.uid())
);

-- 한번 남긴 결정은 이력이다. 수정·삭제 정책을 두지 않아 뒤집기는 새 행으로만 한다.
grant select, insert on public.criterion_manual_decisions to authenticated;
