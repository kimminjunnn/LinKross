-- LinKross MVP 전체 도메인 스키마 마이그레이션
-- 기준: 2026-08-13 실제 Supabase 인벤토리
-- 실행 위치: Supabase Dashboard > SQL Editor > New query
--
-- 이 파일은 organizations / organization_members를 만들지 않는다.
-- MVP에서는 projects.company_id가 발주자 profiles.id를 직접 참조한다.
-- 기존 profiles, user_roles, company_profiles, freelancer_profiles,
-- projects, proposals, selections, payments 데이터는 보존한다.

begin;

do $$
begin
  if to_regclass('public.profiles') is null
    or to_regclass('public.user_roles') is null
    or to_regclass('public.company_profiles') is null
    or to_regclass('public.freelancer_profiles') is null
    or to_regclass('public.projects') is null
    or to_regclass('public.proposals') is null
    or to_regclass('public.selections') is null
    or to_regclass('public.payments') is null then
    raise exception 'REQUIRED_BASE_TABLE_IS_MISSING';
  end if;

  if exists (
    select 1
    from public.selections s
    join public.proposals pr on pr.id = s.proposal_id
    where s.project_id <> pr.project_id
  ) then
    raise exception 'EXISTING_SELECTION_REFERENCES_WRONG_PROJECT';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 0. 공통 enum
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.project_lifecycle_stage as enum (
    'preparing',
    'in_progress',
    'completed',
    'cancelled',
    'archived'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.proposal_status as enum (
    'submitted',
    'withdrawn'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.sow_status as enum (
    'draft',
    'in_review',
    'approved',
    'superseded'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.criterion_kind as enum (
    'acceptance',
    'definition_of_done'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_method as enum (
    'automated_e2e',
    'build',
    'manual',
    'document'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.milestone_status as enum (
    'scheduled',
    'submission_required',
    'verification_ready',
    'verification_running',
    'revision_required',
    'approved',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.submission_status as enum (
    'submitted',
    'superseded',
    'withdrawn'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_scope as enum (
    'criterion',
    'milestone'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_run_status as enum (
    'queued',
    'provisioning',
    'installing',
    'building',
    'running',
    'passed',
    'failed',
    'needs_review',
    'timed_out',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.criterion_result_status as enum (
    'queued',
    'running',
    'passed',
    'failed',
    'needs_review',
    'not_run'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.evidence_artifact_type as enum (
    'screenshot',
    'video',
    'trace',
    'log',
    'preview',
    'document'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.milestone_decision_type as enum (
    'revision_required',
    'approved'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.invoice_status as enum (
    'submitted',
    'approved',
    'rejected',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_record_status as enum (
    'requested',
    'processing',
    'completed',
    'failed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.evidence_bundle_status as enum (
    'generating',
    'ready',
    'failed'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 1. 기존 프로젝트·제안서 확장
-- ---------------------------------------------------------------------------

alter table public.company_profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.freelancer_profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.projects
  add column if not exists project_type text,
  add column if not exists technology text,
  add column if not exists deliverables text,
  add column if not exists out_of_scope text,
  add column if not exists budget_type text not null default 'fixed',
  add column if not exists budget_max_amount numeric,
  add column if not exists applicant_guidance text,
  add column if not exists company_contact_name_snapshot text,
  add column if not exists lifecycle_stage public.project_lifecycle_stage not null default 'preparing',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz;

do $$ begin
  alter table public.projects
    add constraint projects_budget_amount_nonnegative
    check (budget_amount >= 0);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.projects
    add constraint projects_budget_max_amount_valid
    check (
      budget_max_amount is null
      or budget_max_amount >= budget_amount
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.projects
    add constraint projects_budget_type_valid
    check (budget_type in ('fixed', 'range'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.projects
    add constraint projects_project_type_valid
    check (
      project_type is null
      or project_type in ('web', 'mobile', 'saas', 'backend', 'other')
    );
exception when duplicate_object then null;
end $$;

alter table public.proposals
  add column if not exists status public.proposal_status not null default 'submitted',
  add column if not exists optional_notes text,
  add column if not exists freelancer_display_name_snapshot text,
  add column if not exists freelancer_headline_snapshot text,
  add column if not exists freelancer_skills_snapshot text,
  add column if not exists freelancer_portfolio_urls_snapshot text[] not null default '{}'::text[],
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists withdrawn_at timestamptz;

update public.proposals pr
set freelancer_display_name_snapshot = coalesce(
      pr.freelancer_display_name_snapshot,
      fp.display_name
    ),
    freelancer_headline_snapshot = coalesce(
      pr.freelancer_headline_snapshot,
      fp.headline
    ),
    freelancer_skills_snapshot = coalesce(
      pr.freelancer_skills_snapshot,
      fp.skills
    ),
    freelancer_portfolio_urls_snapshot = case
      when cardinality(pr.freelancer_portfolio_urls_snapshot) = 0
        then fp.portfolio_urls
      else pr.freelancer_portfolio_urls_snapshot
    end
from public.freelancer_profiles fp
where fp.id = pr.freelancer_id;

alter table public.selections
  add column if not exists selected_by_name_snapshot text;

-- 제출·선정·승인 기록이 사용자 삭제와 함께 연쇄 삭제되지 않도록 핵심 FK를 제한한다.
alter table public.projects
  drop constraint if exists projects_company_id_fkey;
alter table public.projects
  add constraint projects_company_id_fkey
  foreign key (company_id) references public.profiles(id) on delete restrict;

alter table public.proposals
  drop constraint if exists proposals_project_id_fkey,
  drop constraint if exists proposals_freelancer_id_fkey;
alter table public.proposals
  add constraint proposals_project_id_fkey
    foreign key (project_id) references public.projects(id) on delete restrict,
  add constraint proposals_freelancer_id_fkey
    foreign key (freelancer_id) references public.profiles(id) on delete restrict;

alter table public.selections
  drop constraint if exists selections_project_id_fkey;
alter table public.selections
  add constraint selections_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete restrict;

create index if not exists projects_company_id_idx
  on public.projects (company_id);
create index if not exists projects_public_recruitment_idx
  on public.projects (status, recruitment_start_at, recruitment_end_at);
create index if not exists projects_lifecycle_stage_idx
  on public.projects (lifecycle_stage);
create index if not exists proposals_freelancer_id_idx
  on public.proposals (freelancer_id);
create index if not exists proposals_project_submitted_at_idx
  on public.proposals (project_id, submitted_at desc);

-- ---------------------------------------------------------------------------
-- 2. 요구사항 버전과 프로젝트 파일
-- ---------------------------------------------------------------------------

create table if not exists public.project_requirement_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  title text not null,
  project_type text,
  technology text,
  goal text not null,
  requirements text not null,
  deliverables text,
  out_of_scope text,
  reference_notes text,
  applicant_guidance text,
  budget_amount numeric not null check (budget_amount >= 0),
  budget_max_amount numeric,
  budget_type text not null default 'fixed' check (budget_type in ('fixed', 'range')),
  currency text not null,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  recruitment_start_at timestamptz not null,
  recruitment_end_at timestamptz not null check (recruitment_end_at > recruitment_start_at),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, version_number),
  unique (id, project_id)
);

alter table public.projects
  add column if not exists current_requirement_version_id uuid;

do $$ begin
  alter table public.projects
    add constraint projects_current_requirement_version_id_fkey
    foreign key (current_requirement_version_id, id)
    references public.project_requirement_versions(id, project_id)
    on delete restrict;
exception when duplicate_object then null;
end $$;

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
  created_by,
  created_at
)
select
  p.id,
  1,
  p.title,
  p.project_type,
  p.technology,
  p.goal,
  p.requirements,
  p.deliverables,
  p.out_of_scope,
  p.reference_notes,
  p.applicant_guidance,
  p.budget_amount,
  p.budget_max_amount,
  p.budget_type,
  p.currency,
  p.start_date,
  p.end_date,
  p.recruitment_start_at,
  p.recruitment_end_at,
  p.company_id,
  p.created_at
from public.projects p
where not exists (
  select 1
  from public.project_requirement_versions rv
  where rv.project_id = p.id
);

update public.projects p
set current_requirement_version_id = rv.id
from public.project_requirement_versions rv
where rv.project_id = p.id
  and rv.version_number = (
    select max(rv2.version_number)
    from public.project_requirement_versions rv2
    where rv2.project_id = p.id
  )
  and p.current_requirement_version_id is null;

alter table public.proposals
  add column if not exists requirement_version_id uuid;

update public.proposals pr
set requirement_version_id = p.current_requirement_version_id
from public.projects p
where p.id = pr.project_id
  and pr.requirement_version_id is null;

do $$ begin
  alter table public.proposals
    add constraint proposals_requirement_version_id_fkey
    foreign key (requirement_version_id, project_id)
    references public.project_requirement_versions(id, project_id)
    on delete restrict;
exception when duplicate_object then null;
end $$;

do $$ begin
  if not exists (
    select 1
    from public.proposals
    where requirement_version_id is null
  ) then
    alter table public.proposals
      alter column requirement_version_id set not null;
  end if;
end $$;

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  requirement_version_id uuid references public.project_requirement_versions(id) on delete restrict,
  bucket_id text not null default 'linkross-project-files',
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  visibility text not null default 'participants'
    check (visibility in ('public', 'participants')),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint project_files_requirement_project_fkey
    foreign key (requirement_version_id, project_id)
    references public.project_requirement_versions(id, project_id)
    on delete restrict
);

create index if not exists requirement_versions_project_idx
  on public.project_requirement_versions (project_id, version_number desc);
create index if not exists project_files_project_idx
  on public.project_files (project_id);

-- 같은 제안서 ID를 다른 project_id와 조합할 수 없도록 DB에서 차단한다.
create unique index if not exists proposals_id_project_id_uidx
  on public.proposals (id, project_id);

alter table public.selections
  drop constraint if exists selections_proposal_id_fkey;

do $$ begin
  alter table public.selections
    add constraint selections_proposal_project_fkey
    foreign key (proposal_id, project_id)
    references public.proposals(id, project_id)
    on delete restrict;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 3. SOW 버전·마일스톤·완료조건·양측 승인
-- ---------------------------------------------------------------------------

create table if not exists public.sow_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  source_requirement_version_id uuid not null,
  source_proposal_id uuid,
  status public.sow_status not null default 'draft',
  content jsonb not null default '{}'::jsonb,
  print_text text,
  pdf_file_name text,
  content_hash text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_for_review_at timestamptz,
  approved_at timestamptz,
  superseded_at timestamptz,
  unique (project_id, version_number),
  unique (id, project_id),
  constraint sow_versions_requirement_project_fkey
    foreign key (source_requirement_version_id, project_id)
    references public.project_requirement_versions(id, project_id)
    on delete restrict,
  constraint sow_versions_proposal_project_fkey
    foreign key (source_proposal_id, project_id)
    references public.proposals(id, project_id)
    on delete restrict
);

create unique index if not exists sow_versions_one_approved_per_project_idx
  on public.sow_versions (project_id)
  where status = 'approved';

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  sow_version_id uuid not null,
  code text not null,
  title text not null,
  description text,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  amount numeric not null check (amount >= 0),
  currency text not null,
  position integer not null check (position > 0),
  status public.milestone_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sow_version_id, code),
  unique (sow_version_id, position),
  unique (id, project_id),
  unique (id, sow_version_id, project_id),
  constraint milestones_sow_project_fkey
    foreign key (sow_version_id, project_id)
    references public.sow_versions(id, project_id)
    on delete restrict
);

create table if not exists public.completion_criteria (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  sow_version_id uuid not null,
  milestone_id uuid,
  kind public.criterion_kind not null,
  description text not null,
  verification_method public.verification_method not null,
  is_required boolean not null default true,
  position integer not null check (position > 0),
  test_spec jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (id, milestone_id),
  constraint completion_criteria_sow_project_fkey
    foreign key (sow_version_id, project_id)
    references public.sow_versions(id, project_id)
    on delete restrict,
  constraint completion_criteria_milestone_project_fkey
    foreign key (milestone_id, sow_version_id, project_id)
    references public.milestones(id, sow_version_id, project_id)
    on delete restrict
);

create unique index if not exists completion_criteria_global_position_uidx
  on public.completion_criteria (sow_version_id, kind, position)
  where milestone_id is null;

create unique index if not exists completion_criteria_milestone_position_uidx
  on public.completion_criteria (milestone_id, kind, position)
  where milestone_id is not null;

create table if not exists public.sow_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  sow_version_id uuid not null,
  approver_id uuid references auth.users(id) on delete set null,
  approver_role public.user_role not null,
  approver_name_snapshot text,
  content_hash text not null,
  approved_at timestamptz not null default now(),
  unique (sow_version_id, approver_role),
  constraint sow_approvals_sow_project_fkey
    foreign key (sow_version_id, project_id)
    references public.sow_versions(id, project_id)
    on delete restrict
);

create index if not exists sow_versions_project_idx
  on public.sow_versions (project_id, version_number desc);
create index if not exists milestones_project_idx
  on public.milestones (project_id, position);
create index if not exists completion_criteria_milestone_idx
  on public.completion_criteria (milestone_id, position);
create index if not exists sow_approvals_project_idx
  on public.sow_approvals (project_id, approved_at desc);

-- ---------------------------------------------------------------------------
-- 4. GitHub 저장소·제출·검수·증거·사람의 결정
-- ---------------------------------------------------------------------------

create table if not exists public.project_repositories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete restrict,
  provider text not null default 'github' check (provider = 'github'),
  owner_name text not null,
  repository_name text not null,
  repository_url text not null,
  default_branch text,
  github_repository_id bigint,
  github_installation_id bigint,
  is_private boolean not null default false,
  connected_by uuid references auth.users(id) on delete set null,
  company_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id)
);

create table if not exists public.milestone_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  milestone_id uuid not null,
  repository_id uuid not null,
  attempt_number integer not null check (attempt_number > 0),
  pull_request_number integer not null check (pull_request_number > 0),
  pull_request_title text not null,
  pull_request_url text not null,
  head_branch text not null,
  head_commit_sha text not null check (head_commit_sha ~ '^[0-9a-fA-F]{40}$'),
  implementation_note text,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  previous_submission_id uuid references public.milestone_submissions(id) on delete restrict,
  status public.submission_status not null default 'submitted',
  unique (milestone_id, attempt_number),
  unique (milestone_id, head_commit_sha),
  unique (id, milestone_id),
  unique (id, milestone_id, project_id),
  constraint milestone_submissions_milestone_project_fkey
    foreign key (milestone_id, project_id)
    references public.milestones(id, project_id)
    on delete restrict,
  constraint milestone_submissions_repository_project_fkey
    foreign key (repository_id, project_id)
    references public.project_repositories(id, project_id)
    on delete restrict,
  constraint milestone_submissions_previous_scope_fkey
    foreign key (previous_submission_id, milestone_id)
    references public.milestone_submissions(id, milestone_id)
    on delete restrict
);

create table if not exists public.milestone_submission_criteria (
  submission_id uuid not null references public.milestone_submissions(id) on delete restrict,
  milestone_id uuid not null references public.milestones(id) on delete restrict,
  criterion_id uuid not null,
  supporting_commit_sha text check (
    supporting_commit_sha is null
    or supporting_commit_sha ~ '^[0-9a-fA-F]{7,40}$'
  ),
  claimed_at timestamptz not null default now(),
  primary key (submission_id, criterion_id),
  constraint submission_criteria_submission_milestone_fkey
    foreign key (submission_id, milestone_id)
    references public.milestone_submissions(id, milestone_id)
    on delete restrict,
  constraint submission_criteria_criterion_milestone_fkey
    foreign key (criterion_id, milestone_id)
    references public.completion_criteria(id, milestone_id)
    on delete restrict
);

create table if not exists public.verification_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  milestone_id uuid not null,
  submission_id uuid not null,
  scope public.verification_scope not null,
  requested_criterion_id uuid,
  attempt_number integer not null check (attempt_number > 0),
  idempotency_key text not null unique,
  status public.verification_run_status not null default 'queued',
  requested_by uuid references auth.users(id) on delete set null,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  environment_provider text,
  environment_reference text,
  preview_url text,
  preview_expires_at timestamptz,
  error_summary text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default now(),
  unique (submission_id, attempt_number),
  unique (id, project_id),
  unique (id, milestone_id, project_id),
  constraint verification_runs_submission_scope_fkey
    foreign key (submission_id, milestone_id, project_id)
    references public.milestone_submissions(id, milestone_id, project_id)
    on delete restrict,
  constraint verification_runs_requested_criterion_fkey
    foreign key (requested_criterion_id, milestone_id)
    references public.completion_criteria(id, milestone_id)
    on delete restrict,
  check (
    (scope = 'criterion' and requested_criterion_id is not null)
    or (scope = 'milestone' and requested_criterion_id is null)
  )
);

create table if not exists public.criterion_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  milestone_id uuid not null references public.milestones(id) on delete restrict,
  run_id uuid not null,
  criterion_id uuid not null,
  status public.criterion_result_status not null,
  observed_result text,
  error_message text,
  supporting_commit_sha text check (
    supporting_commit_sha is null
    or supporting_commit_sha ~ '^[0-9a-fA-F]{7,40}$'
  ),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default now(),
  unique (run_id, criterion_id),
  unique (id, run_id, project_id),
  constraint criterion_results_run_scope_fkey
    foreign key (run_id, milestone_id, project_id)
    references public.verification_runs(id, milestone_id, project_id)
    on delete restrict,
  constraint criterion_results_criterion_milestone_fkey
    foreign key (criterion_id, milestone_id)
    references public.completion_criteria(id, milestone_id)
    on delete restrict
);

create table if not exists public.evidence_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  run_id uuid not null,
  criterion_result_id uuid,
  artifact_type public.evidence_artifact_type not null,
  bucket_id text,
  storage_path text,
  external_url text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  sha256 text,
  is_redacted boolean not null default false,
  created_at timestamptz not null default now(),
  check (storage_path is not null or external_url is not null),
  constraint evidence_artifacts_run_project_fkey
    foreign key (run_id, project_id)
    references public.verification_runs(id, project_id)
    on delete restrict,
  constraint evidence_artifacts_result_run_project_fkey
    foreign key (criterion_result_id, run_id, project_id)
    references public.criterion_results(id, run_id, project_id)
    on delete restrict
);

create table if not exists public.milestone_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  milestone_id uuid not null,
  submission_id uuid not null,
  verification_run_id uuid,
  decision public.milestone_decision_type not null,
  reason text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  constraint milestone_decisions_milestone_project_fkey
    foreign key (milestone_id, project_id)
    references public.milestones(id, project_id)
    on delete restrict,
  constraint milestone_decisions_submission_scope_fkey
    foreign key (submission_id, milestone_id, project_id)
    references public.milestone_submissions(id, milestone_id, project_id)
    on delete restrict,
  constraint milestone_decisions_run_scope_fkey
    foreign key (verification_run_id, milestone_id, project_id)
    references public.verification_runs(id, milestone_id, project_id)
    on delete restrict
);

create unique index if not exists milestone_one_final_approval_idx
  on public.milestone_decisions (milestone_id)
  where decision = 'approved';
create index if not exists milestone_submissions_project_idx
  on public.milestone_submissions (project_id, submitted_at desc);
create index if not exists verification_runs_project_idx
  on public.verification_runs (project_id, created_at desc);
create index if not exists verification_runs_status_idx
  on public.verification_runs (status, queued_at);
create index if not exists criterion_results_run_idx
  on public.criterion_results (run_id);
create index if not exists evidence_artifacts_run_idx
  on public.evidence_artifacts (run_id);
create index if not exists milestone_decisions_project_idx
  on public.milestone_decisions (project_id, decided_at desc);

-- ---------------------------------------------------------------------------
-- 5. 인보이스·지급·통합 증빙·감사 이벤트
-- ---------------------------------------------------------------------------

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  milestone_id uuid not null,
  invoice_number text not null,
  status public.invoice_status not null default 'submitted',
  amount numeric not null check (amount >= 0),
  currency text not null,
  bucket_id text,
  storage_path text,
  external_reference text,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  unique (project_id, invoice_number),
  unique (id, project_id, milestone_id),
  constraint invoices_milestone_project_fkey
    foreign key (milestone_id, project_id)
    references public.milestones(id, project_id)
    on delete restrict
);

alter table public.payments
  add column if not exists project_id uuid references public.projects(id) on delete restrict,
  add column if not exists milestone_record_id uuid references public.milestones(id) on delete restrict,
  add column if not exists invoice_id uuid references public.invoices(id) on delete restrict,
  add column if not exists status public.payment_record_status not null default 'completed',
  add column if not exists currency text not null default 'USDC',
  add column if not exists requested_at timestamptz,
  add column if not exists processing_at timestamptz,
  add column if not exists completed_at timestamptz;

do $$ begin
  alter table public.payments
    add constraint payments_milestone_project_fkey
    foreign key (milestone_record_id, project_id)
    references public.milestones(id, project_id)
    on delete restrict;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.payments
    add constraint payments_invoice_scope_fkey
    foreign key (invoice_id, project_id, milestone_record_id)
    references public.invoices(id, project_id, milestone_id)
    on delete restrict;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.payments
    add constraint payments_invoice_link_complete
    check (
      invoice_id is null
      or (project_id is not null and milestone_record_id is not null)
    );
exception when duplicate_object then null;
end $$;

update public.payments
set completed_at = verified_at
where status = 'completed'
  and completed_at is null;

create table if not exists public.evidence_bundles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  status public.evidence_bundle_status not null default 'generating',
  bucket_id text,
  storage_path text,
  sha256 text,
  generated_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text,
  unique (project_id, version_number)
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  project_id uuid references public.projects(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role public.user_role,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.github_webhook_deliveries (
  delivery_id text primary key check (char_length(delivery_id) between 1 and 100),
  event_type text not null check (char_length(event_type) between 1 and 100),
  action text check (action is null or char_length(action) between 1 and 100),
  installation_id bigint check (installation_id is null or installation_id > 0),
  repository_ids bigint[] not null default '{}',
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists invoices_project_idx
  on public.invoices (project_id, submitted_at desc);
create index if not exists payments_project_idx
  on public.payments (project_id, verified_at desc);
create index if not exists payments_milestone_record_idx
  on public.payments (milestone_record_id, verified_at desc);
create index if not exists evidence_bundles_project_idx
  on public.evidence_bundles (project_id, version_number desc);
create index if not exists audit_events_project_idx
  on public.audit_events (project_id, created_at desc);
create index if not exists github_webhook_deliveries_installation_idx
  on public.github_webhook_deliveries (installation_id, received_at desc);

-- ---------------------------------------------------------------------------
-- 6. RLS에서 재사용할 비공개 권한 함수
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.set_verification_preview_expiry()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.preview_url is null then
    new.preview_expires_at := null;
  elsif new.preview_url is distinct from old.preview_url
    or new.completed_at is distinct from old.completed_at then
    new.preview_expires_at := coalesce(new.completed_at, now()) + interval '10 minutes';
  end if;
  return new;
end;
$$;

drop trigger if exists set_verification_preview_expiry on public.verification_runs;
create trigger set_verification_preview_expiry
before update of preview_url, completed_at on public.verification_runs
for each row execute function private.set_verification_preview_expiry();

create or replace function private.has_role(expected_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = expected_role
  );
$$;

create or replace function private.is_project_owner(target_project_id uuid)
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
      and p.company_id = (select auth.uid())
  );
$$;

create or replace function private.is_selected_freelancer(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.selections s
    join public.proposals pr on pr.id = s.proposal_id
    where s.project_id = target_project_id
      and pr.project_id = target_project_id
      and pr.freelancer_id = (select auth.uid())
  );
$$;

create or replace function private.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_project_owner(target_project_id)
    or private.is_selected_freelancer(target_project_id);
$$;

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
    where p.id = target_project_id
      and p.status = 'recruiting'::public.project_status
      and now() >= p.recruitment_start_at
      and now() <= p.recruitment_end_at
  );
$$;

create or replace function private.storage_project_id(object_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return ((storage.foldername(object_name))[1])::uuid;
exception when others then
  return null;
end;
$$;

grant usage on schema private to anon, authenticated;
revoke execute on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. 무결성·버전 고정·상태 전이 함수
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_initial_requirement_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_version_id uuid;
begin
  insert into public.project_requirement_versions (
    project_id, version_number, title, project_type, technology,
    goal, requirements, deliverables, out_of_scope, reference_notes,
    applicant_guidance, budget_amount, budget_max_amount, budget_type,
    currency, start_date, end_date, recruitment_start_at,
    recruitment_end_at, created_by, created_at
  ) values (
    new.id, 1, new.title, new.project_type, new.technology,
    new.goal, new.requirements, new.deliverables, new.out_of_scope,
    new.reference_notes, new.applicant_guidance, new.budget_amount,
    new.budget_max_amount, new.budget_type, new.currency, new.start_date,
    new.end_date, new.recruitment_start_at, new.recruitment_end_at,
    new.company_id, new.created_at
  ) returning id into new_version_id;

  update public.projects
  set current_requirement_version_id = new_version_id
  where id = new.id;

  return new;
end;
$$;

create or replace function public.publish_project_requirements(target_project_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
  next_version integer;
  new_version_id uuid;
begin
  select * into project_row
  from public.projects
  where id = target_project_id;

  if project_row.id is null then
    raise exception 'PROJECT_NOT_FOUND';
  end if;

  if project_row.company_id <> (select auth.uid()) then
    raise exception 'PROJECT_OWNER_REQUIRED';
  end if;

  if project_row.status <> 'recruiting'::public.project_status then
    raise exception 'PROJECT_REQUIREMENTS_LOCKED';
  end if;

  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.project_requirement_versions
  where project_id = target_project_id;

  insert into public.project_requirement_versions (
    project_id, version_number, title, project_type, technology,
    goal, requirements, deliverables, out_of_scope, reference_notes,
    applicant_guidance, budget_amount, budget_max_amount, budget_type,
    currency, start_date, end_date, recruitment_start_at,
    recruitment_end_at, created_by
  ) values (
    project_row.id, next_version, project_row.title,
    project_row.project_type, project_row.technology, project_row.goal,
    project_row.requirements, project_row.deliverables,
    project_row.out_of_scope, project_row.reference_notes,
    project_row.applicant_guidance, project_row.budget_amount,
    project_row.budget_max_amount, project_row.budget_type,
    project_row.currency, project_row.start_date, project_row.end_date,
    project_row.recruitment_start_at, project_row.recruitment_end_at,
    (select auth.uid())
  ) returning id into new_version_id;

  update public.projects
  set current_requirement_version_id = new_version_id
  where id = target_project_id;

  return new_version_id;
end;
$$;

revoke all on function public.publish_project_requirements(uuid) from public;
grant execute on function public.publish_project_requirements(uuid) to authenticated;

create or replace function public.lock_requirement_versions()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'REQUIREMENT_VERSION_IS_IMMUTABLE';
end;
$$;

create or replace function public.prepare_proposal_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
begin
  select * into project_row
  from public.projects
  where id = new.project_id;

  if project_row.id is null then
    raise exception 'PROJECT_NOT_FOUND';
  end if;

  if new.freelancer_id <> (select auth.uid()) then
    raise exception 'FREELANCER_ID_MISMATCH';
  end if;

  if not private.has_role('freelancer'::public.user_role) then
    raise exception 'FREELANCER_ROLE_REQUIRED';
  end if;

  if project_row.status <> 'recruiting'::public.project_status
    or now() < project_row.recruitment_start_at
    or now() > project_row.recruitment_end_at then
    raise exception 'RECRUITMENT_NOT_OPEN';
  end if;

  if length(trim(new.content)) = 0 then
    raise exception 'PROPOSAL_CONTENT_REQUIRED';
  end if;

  new.requirement_version_id = project_row.current_requirement_version_id;
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

create or replace function public.protect_submitted_proposal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'SUBMITTED_PROPOSAL_CANNOT_BE_DELETED';
  end if;

  if new.project_id <> old.project_id
    or new.freelancer_id <> old.freelancer_id
    or new.requirement_version_id <> old.requirement_version_id
    or new.content <> old.content
    or new.optional_notes is distinct from old.optional_notes
    or new.freelancer_display_name_snapshot is distinct from old.freelancer_display_name_snapshot
    or new.freelancer_headline_snapshot is distinct from old.freelancer_headline_snapshot
    or new.freelancer_skills_snapshot is distinct from old.freelancer_skills_snapshot
    or new.freelancer_portfolio_urls_snapshot is distinct from old.freelancer_portfolio_urls_snapshot
    or new.submitted_at <> old.submitted_at then
    raise exception 'SUBMITTED_PROPOSAL_CONTENT_IS_IMMUTABLE';
  end if;

  if old.status = 'withdrawn'::public.proposal_status then
    raise exception 'WITHDRAWN_PROPOSAL_IS_IMMUTABLE';
  end if;

  if new.status <> 'withdrawn'::public.proposal_status then
    raise exception 'ONLY_PROPOSAL_WITHDRAWAL_IS_ALLOWED';
  end if;

  new.withdrawn_at = coalesce(new.withdrawn_at, now());
  return new;
end;
$$;

create or replace function public.close_project_on_selection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.proposals pr
    where pr.id = new.proposal_id
      and pr.project_id = new.project_id
      and pr.status = 'submitted'::public.proposal_status
  ) then
    raise exception 'INVALID_PROPOSAL_FOR_PROJECT';
  end if;

  update public.projects
  set status = 'closed'::public.project_status,
      lifecycle_stage = 'preparing'::public.project_lifecycle_stage,
      updated_at = now()
  where id = new.project_id;

  return new;
end;
$$;

create or replace function public.prepare_selection_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_project_owner(new.project_id) then
    raise exception 'PROJECT_OWNER_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.projects p
    where p.id = new.project_id
      and p.status = 'recruiting'::public.project_status
  ) then
    raise exception 'PROJECT_ALREADY_CLOSED';
  end if;

  new.selected_by = (select auth.uid());
  select cp.contact_name
  into new.selected_by_name_snapshot
  from public.company_profiles cp
  where cp.id = (select auth.uid());
  return new;
end;
$$;

create or replace function public.validate_sow_approval()
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

  if sow_row.id is null or sow_row.status <> 'in_review'::public.sow_status then
    raise exception 'SOW_NOT_READY_FOR_APPROVAL';
  end if;

  if new.content_hash <> sow_row.content_hash then
    raise exception 'SOW_CONTENT_HASH_MISMATCH';
  end if;

  new.approver_id = (select auth.uid());

  if new.approver_role = 'company'::public.user_role then
    if not private.is_project_owner(new.project_id) then
      raise exception 'PROJECT_OWNER_REQUIRED';
    end if;
  elsif new.approver_role = 'freelancer'::public.user_role then
    if not private.is_selected_freelancer(new.project_id) then
      raise exception 'SELECTED_FREELANCER_REQUIRED';
    end if;
  else
    raise exception 'PROJECT_PARTICIPANT_REQUIRED';
  end if;

  return new;
end;
$$;

create or replace function public.protect_sow_version_content()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'draft'::public.sow_status
    and (
      new.project_id is distinct from old.project_id
      or new.version_number is distinct from old.version_number
      or new.source_requirement_version_id is distinct from old.source_requirement_version_id
      or new.source_proposal_id is distinct from old.source_proposal_id
      or new.content is distinct from old.content
      or new.print_text is distinct from old.print_text
      or new.pdf_file_name is distinct from old.pdf_file_name
      or new.content_hash is distinct from old.content_hash
    ) then
    raise exception 'SOW_VERSION_CONTENT_IS_IMMUTABLE';
  end if;

  return new;
end;
$$;

create or replace function public.protect_sow_children()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_sow_id uuid;
  target_status public.sow_status;
begin
  if tg_op = 'DELETE' then
    target_sow_id := old.sow_version_id;
  else
    target_sow_id := new.sow_version_id;
  end if;

  select status into target_status
  from public.sow_versions
  where id = target_sow_id;

  if target_status is null then
    raise exception 'SOW_VERSION_NOT_FOUND';
  end if;

  if target_status <> 'draft'::public.sow_status then
    -- 승인 이후 마일스톤은 상태만 전이할 수 있고, 일정·금액·완료조건은 고정한다.
    if tg_op = 'UPDATE'
      and tg_table_name = 'milestones'
      and (
        to_jsonb(new) - array['status', 'updated_at']::text[]
        = to_jsonb(old) - array['status', 'updated_at']::text[]
      ) then
      return new;
    end if;

    raise exception 'SOW_CHILDREN_ARE_IMMUTABLE';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.finalize_sow_when_both_approved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.sow_approvals
    where sow_version_id = new.sow_version_id
      and approver_role = 'company'::public.user_role
  ) and exists (
    select 1 from public.sow_approvals
    where sow_version_id = new.sow_version_id
      and approver_role = 'freelancer'::public.user_role
  ) then
    update public.sow_versions
    set status = 'superseded'::public.sow_status,
        superseded_at = now(),
        updated_at = now()
    where project_id = new.project_id
      and id <> new.sow_version_id
      and status = 'approved'::public.sow_status;

    update public.sow_versions
    set status = 'approved'::public.sow_status,
        approved_at = now(),
        updated_at = now()
    where id = new.sow_version_id;

    update public.milestones
    set status = 'submission_required'::public.milestone_status,
        updated_at = now()
    where sow_version_id = new.sow_version_id;

    update public.projects
    set lifecycle_stage = 'in_progress'::public.project_lifecycle_stage,
        updated_at = now()
    where id = new.project_id;
  end if;

  return new;
end;
$$;

create or replace function public.apply_milestone_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_project_owner(new.project_id) then
    raise exception 'PROJECT_OWNER_REQUIRED';
  end if;

  new.decided_by = (select auth.uid());

  update public.milestones
  set status = case
        when new.decision = 'approved'::public.milestone_decision_type
          then 'approved'::public.milestone_status
        else 'revision_required'::public.milestone_status
      end,
      updated_at = now()
  where id = new.milestone_id
    and project_id = new.project_id;

  return new;
end;
$$;

drop trigger if exists company_profiles_set_updated_at on public.company_profiles;
create trigger company_profiles_set_updated_at
before update on public.company_profiles
for each row execute function public.set_updated_at();

drop trigger if exists freelancer_profiles_set_updated_at on public.freelancer_profiles;
create trigger freelancer_profiles_set_updated_at
before update on public.freelancer_profiles
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists projects_create_initial_requirement_version on public.projects;
create trigger projects_create_initial_requirement_version
after insert on public.projects
for each row execute function public.create_initial_requirement_version();

drop trigger if exists requirement_versions_immutable on public.project_requirement_versions;
create trigger requirement_versions_immutable
before update or delete on public.project_requirement_versions
for each row execute function public.lock_requirement_versions();

drop trigger if exists proposals_prepare_insert on public.proposals;
create trigger proposals_prepare_insert
before insert on public.proposals
for each row execute function public.prepare_proposal_insert();

drop trigger if exists proposals_protect_submitted on public.proposals;
create trigger proposals_protect_submitted
before update or delete on public.proposals
for each row execute function public.protect_submitted_proposal();

drop trigger if exists selections_close_project on public.selections;
create trigger selections_close_project
after insert on public.selections
for each row execute function public.close_project_on_selection();

drop trigger if exists selections_prepare_insert on public.selections;
create trigger selections_prepare_insert
before insert on public.selections
for each row execute function public.prepare_selection_insert();

drop trigger if exists sow_versions_set_updated_at on public.sow_versions;
create trigger sow_versions_set_updated_at
before update on public.sow_versions
for each row execute function public.set_updated_at();

drop trigger if exists sow_versions_protect_content on public.sow_versions;
create trigger sow_versions_protect_content
before update on public.sow_versions
for each row execute function public.protect_sow_version_content();

drop trigger if exists milestones_protect_sow on public.milestones;
create trigger milestones_protect_sow
before insert or update or delete on public.milestones
for each row execute function public.protect_sow_children();

drop trigger if exists completion_criteria_protect_sow on public.completion_criteria;
create trigger completion_criteria_protect_sow
before insert or update or delete on public.completion_criteria
for each row execute function public.protect_sow_children();

drop trigger if exists sow_approvals_validate on public.sow_approvals;
create trigger sow_approvals_validate
before insert on public.sow_approvals
for each row execute function public.validate_sow_approval();

drop trigger if exists sow_approvals_finalize on public.sow_approvals;
create trigger sow_approvals_finalize
after insert on public.sow_approvals
for each row execute function public.finalize_sow_when_both_approved();

drop trigger if exists milestone_decisions_apply on public.milestone_decisions;
create trigger milestone_decisions_apply
before insert on public.milestone_decisions
for each row execute function public.apply_milestone_decision();

-- ---------------------------------------------------------------------------
-- 8. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_requirement_versions enable row level security;
alter table public.project_files enable row level security;
alter table public.proposals enable row level security;
alter table public.selections enable row level security;
alter table public.sow_versions enable row level security;
alter table public.milestones enable row level security;
alter table public.completion_criteria enable row level security;
alter table public.sow_approvals enable row level security;
alter table public.project_repositories enable row level security;
alter table public.milestone_submissions enable row level security;
alter table public.milestone_submission_criteria enable row level security;
alter table public.verification_runs enable row level security;
alter table public.criterion_results enable row level security;
alter table public.evidence_artifacts enable row level security;
alter table public.milestone_decisions enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.evidence_bundles enable row level security;
alter table public.audit_events enable row level security;
alter table public.github_webhook_deliveries enable row level security;

drop policy if exists projects_public_recruiting_select on public.projects;
drop policy if exists projects_participant_select on public.projects;
drop policy if exists projects_company_insert on public.projects;
drop policy if exists projects_owner_update on public.projects;
drop policy if exists requirement_versions_recruiting_or_participant_select on public.project_requirement_versions;
drop policy if exists project_files_visible_select on public.project_files;
drop policy if exists project_files_owner_insert on public.project_files;
drop policy if exists proposals_participant_select on public.proposals;
drop policy if exists proposals_freelancer_insert on public.proposals;
drop policy if exists proposals_freelancer_withdraw on public.proposals;
drop policy if exists selections_participant_select on public.selections;
drop policy if exists selections_owner_insert on public.selections;
drop policy if exists sow_versions_participant_select on public.sow_versions;
drop policy if exists sow_versions_owner_insert on public.sow_versions;
drop policy if exists sow_versions_owner_update_draft on public.sow_versions;
drop policy if exists milestones_participant_select on public.milestones;
drop policy if exists milestones_owner_insert on public.milestones;
drop policy if exists milestones_owner_update on public.milestones;
drop policy if exists criteria_participant_select on public.completion_criteria;
drop policy if exists criteria_owner_insert on public.completion_criteria;
drop policy if exists criteria_owner_update on public.completion_criteria;
drop policy if exists sow_approvals_participant_select on public.sow_approvals;
drop policy if exists sow_approvals_participant_insert on public.sow_approvals;
drop policy if exists repositories_participant_select on public.project_repositories;
drop policy if exists repositories_participant_insert on public.project_repositories;
drop policy if exists repositories_owner_update on public.project_repositories;
drop policy if exists submissions_participant_select on public.milestone_submissions;
drop policy if exists submissions_freelancer_insert on public.milestone_submissions;
drop policy if exists submission_criteria_participant_select on public.milestone_submission_criteria;
drop policy if exists submission_criteria_freelancer_insert on public.milestone_submission_criteria;
drop policy if exists verification_runs_participant_select on public.verification_runs;
drop policy if exists verification_runs_participant_insert on public.verification_runs;
drop policy if exists criterion_results_participant_select on public.criterion_results;
drop policy if exists evidence_artifacts_participant_select on public.evidence_artifacts;
drop policy if exists milestone_decisions_participant_select on public.milestone_decisions;
drop policy if exists milestone_decisions_owner_insert on public.milestone_decisions;
drop policy if exists invoices_participant_select on public.invoices;
drop policy if exists invoices_freelancer_insert on public.invoices;
drop policy if exists invoices_owner_update on public.invoices;
drop policy if exists payments_project_participant_select on public.payments;
drop policy if exists payments_company_insert on public.payments;
drop policy if exists evidence_bundles_participant_select on public.evidence_bundles;
drop policy if exists evidence_bundles_owner_insert on public.evidence_bundles;
drop policy if exists audit_events_participant_select on public.audit_events;

drop policy if exists projects_insert_own_company on public.projects;
drop policy if exists projects_select_own_or_recruiting on public.projects;
drop policy if exists projects_update_own on public.projects;

create policy projects_public_recruiting_select
on public.projects for select
to anon, authenticated
using (
  status = 'recruiting'::public.project_status
  and now() >= recruitment_start_at
  and now() <= recruitment_end_at
);

create policy projects_participant_select
on public.projects for select
to authenticated
using ((select private.can_access_project(id)));

create policy projects_company_insert
on public.projects for insert
to authenticated
with check (
  company_id = (select auth.uid())
  and (select private.has_role('company'::public.user_role))
);

create policy projects_owner_update
on public.projects for update
to authenticated
using ((select private.is_project_owner(id)))
with check (
  company_id = (select auth.uid())
  and (select private.has_role('company'::public.user_role))
);

create policy requirement_versions_recruiting_or_participant_select
on public.project_requirement_versions for select
to anon, authenticated
using (
  (select private.is_project_recruiting(project_id))
  or (select private.can_access_project(project_id))
);

create policy project_files_visible_select
on public.project_files for select
to anon, authenticated
using (
  (
    visibility = 'public'
    and (select private.is_project_recruiting(project_id))
  )
  or (select private.can_access_project(project_id))
);

create policy project_files_owner_insert
on public.project_files for insert
to authenticated
with check (
  (select private.is_project_owner(project_id))
  and uploaded_by = (select auth.uid())
);

drop policy if exists proposals_insert_own_while_recruiting on public.proposals;
drop policy if exists proposals_select_own_or_project_owner on public.proposals;

create policy proposals_participant_select
on public.proposals for select
to authenticated
using (
  freelancer_id = (select auth.uid())
  or (select private.is_project_owner(project_id))
);

create policy proposals_freelancer_insert
on public.proposals for insert
to authenticated
with check (
  freelancer_id = (select auth.uid())
  and (select private.has_role('freelancer'::public.user_role))
  and (select private.is_project_recruiting(project_id))
);

create policy proposals_freelancer_withdraw
on public.proposals for update
to authenticated
using (freelancer_id = (select auth.uid()))
with check (
  freelancer_id = (select auth.uid())
  and status = 'withdrawn'::public.proposal_status
);

drop policy if exists selections_insert_by_project_owner on public.selections;
drop policy if exists selections_select_owner_or_selected on public.selections;

create policy selections_participant_select
on public.selections for select
to authenticated
using (
  (select private.is_project_owner(project_id))
  or (select private.is_selected_freelancer(project_id))
);

create policy selections_owner_insert
on public.selections for insert
to authenticated
with check (
  selected_by = (select auth.uid())
  and (select private.is_project_owner(project_id))
  and exists (
    select 1
    from public.proposals pr
    where pr.id = proposal_id
      and pr.project_id = project_id
      and pr.status = 'submitted'::public.proposal_status
  )
);

create policy sow_versions_participant_select
on public.sow_versions for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy sow_versions_owner_insert
on public.sow_versions for insert
to authenticated
with check (
  (select private.is_project_owner(project_id))
  and created_by = (select auth.uid())
);

create policy sow_versions_owner_update_draft
on public.sow_versions for update
to authenticated
using (
  (select private.is_project_owner(project_id))
  and status = 'draft'::public.sow_status
)
with check ((select private.is_project_owner(project_id)));

create policy milestones_participant_select
on public.milestones for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy milestones_owner_insert
on public.milestones for insert
to authenticated
with check ((select private.is_project_owner(project_id)));

create policy milestones_owner_update
on public.milestones for update
to authenticated
using ((select private.is_project_owner(project_id)))
with check ((select private.is_project_owner(project_id)));

create policy criteria_participant_select
on public.completion_criteria for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy criteria_owner_insert
on public.completion_criteria for insert
to authenticated
with check ((select private.is_project_owner(project_id)));

create policy criteria_owner_update
on public.completion_criteria for update
to authenticated
using ((select private.is_project_owner(project_id)))
with check ((select private.is_project_owner(project_id)));

create policy sow_approvals_participant_select
on public.sow_approvals for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy sow_approvals_participant_insert
on public.sow_approvals for insert
to authenticated
with check (
  approver_id = (select auth.uid())
  and (select private.can_access_project(project_id))
);

create policy repositories_participant_select
on public.project_repositories for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy repositories_participant_insert
on public.project_repositories for insert
to authenticated
with check (
  (select private.can_access_project(project_id))
  and connected_by = (select auth.uid())
);

create policy repositories_owner_update
on public.project_repositories for update
to authenticated
using ((select private.is_project_owner(project_id)))
with check ((select private.is_project_owner(project_id)));

create policy submissions_participant_select
on public.milestone_submissions for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy submissions_freelancer_insert
on public.milestone_submissions for insert
to authenticated
with check (
  (select private.is_selected_freelancer(project_id))
  and submitted_by = (select auth.uid())
);

create policy submission_criteria_participant_select
on public.milestone_submission_criteria for select
to authenticated
using (
  exists (
    select 1
    from public.milestone_submissions ms
    where ms.id = submission_id
      and (select private.can_access_project(ms.project_id))
  )
);

create policy submission_criteria_freelancer_insert
on public.milestone_submission_criteria for insert
to authenticated
with check (
  exists (
    select 1
    from public.milestone_submissions ms
    where ms.id = submission_id
      and ms.submitted_by = (select auth.uid())
      and (select private.is_selected_freelancer(ms.project_id))
  )
);

create policy verification_runs_participant_select
on public.verification_runs for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy verification_runs_participant_insert
on public.verification_runs for insert
to authenticated
with check (
  (select private.can_access_project(project_id))
  and requested_by = (select auth.uid())
);

create policy criterion_results_participant_select
on public.criterion_results for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy evidence_artifacts_participant_select
on public.evidence_artifacts for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy milestone_decisions_participant_select
on public.milestone_decisions for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy milestone_decisions_owner_insert
on public.milestone_decisions for insert
to authenticated
with check (
  (select private.is_project_owner(project_id))
  and decided_by = (select auth.uid())
);

create policy invoices_participant_select
on public.invoices for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy invoices_freelancer_insert
on public.invoices for insert
to authenticated
with check (
  (select private.is_selected_freelancer(project_id))
  and submitted_by = (select auth.uid())
);

create policy invoices_owner_update
on public.invoices for update
to authenticated
using ((select private.is_project_owner(project_id)))
with check ((select private.is_project_owner(project_id)));

drop policy if exists payments_select_authenticated on public.payments;
drop policy if exists payments_insert_own on public.payments;

create policy payments_project_participant_select
on public.payments for select
to authenticated
using (
  verified_by = (select auth.uid())
  or (
    project_id is not null
    and (select private.can_access_project(project_id))
  )
);

-- 현재 지급 API와 호환하면서, 새 코드에서는 project_id와 milestone_record_id를 함께 저장한다.
create policy payments_company_insert
on public.payments for insert
to authenticated
with check (
  verified_by = (select auth.uid())
  and (select private.has_role('company'::public.user_role))
  and (
    project_id is null
    or (select private.is_project_owner(project_id))
  )
);

create policy evidence_bundles_participant_select
on public.evidence_bundles for select
to authenticated
using ((select private.can_access_project(project_id)));

create policy evidence_bundles_owner_insert
on public.evidence_bundles for insert
to authenticated
with check (
  (select private.is_project_owner(project_id))
  and generated_by = (select auth.uid())
);

create policy audit_events_participant_select
on public.audit_events for select
to authenticated
using (
  project_id is not null
  and (select private.can_access_project(project_id))
);

-- ---------------------------------------------------------------------------
-- 9. 공개 모집용 안전한 View
-- ---------------------------------------------------------------------------

create or replace view public.public_opportunities
with (security_barrier = true)
as
select
  p.id,
  p.title,
  p.project_type,
  p.technology,
  p.goal,
  p.requirements,
  p.deliverables,
  p.out_of_scope,
  p.applicant_guidance,
  p.budget_amount,
  p.budget_max_amount,
  p.budget_type,
  p.currency,
  p.start_date,
  p.end_date,
  p.recruitment_start_at,
  p.recruitment_end_at,
  cp.organization_name,
  p.current_requirement_version_id,
  p.created_at
from public.projects p
join public.company_profiles cp on cp.id = p.company_id
where p.status = 'recruiting'::public.project_status
  and now() >= p.recruitment_start_at
  and now() <= p.recruitment_end_at;

revoke all on public.public_opportunities from public;
grant select on public.public_opportunities to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10. Storage bucket과 파일 접근 정책
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('linkross-project-files', 'linkross-project-files', false, 20971520),
  ('linkross-evidence', 'linkross-evidence', false, 104857600),
  ('linkross-invoices', 'linkross-invoices', false, 20971520)
on conflict (id) do nothing;

drop policy if exists project_files_storage_select on storage.objects;
create policy project_files_storage_select
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'linkross-project-files'
  and exists (
    select 1
    from public.project_files pf
    where pf.bucket_id = storage.objects.bucket_id
      and pf.storage_path = storage.objects.name
      and (
        (
          pf.visibility = 'public'
          and (select private.is_project_recruiting(pf.project_id))
        )
        or (select private.can_access_project(pf.project_id))
      )
  )
);

drop policy if exists project_files_storage_insert on storage.objects;
create policy project_files_storage_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'linkross-project-files'
  and (select private.is_project_owner(private.storage_project_id(name)))
);

drop policy if exists evidence_storage_select on storage.objects;
create policy evidence_storage_select
on storage.objects for select
to authenticated
using (
  bucket_id = 'linkross-evidence'
  and (select private.can_access_project(private.storage_project_id(name)))
);

drop policy if exists invoice_storage_select on storage.objects;
create policy invoice_storage_select
on storage.objects for select
to authenticated
using (
  bucket_id = 'linkross-invoices'
  and (select private.can_access_project(private.storage_project_id(name)))
);

drop policy if exists invoice_storage_insert on storage.objects;
create policy invoice_storage_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'linkross-invoices'
  and (select private.is_selected_freelancer(private.storage_project_id(name)))
);

-- ---------------------------------------------------------------------------
-- 11. 권한 부여
-- ---------------------------------------------------------------------------

grant select on public.projects to anon, authenticated;
grant insert, update on public.projects to authenticated;

grant select on public.project_requirement_versions to anon, authenticated;
grant select on public.project_files to anon, authenticated;
grant insert on public.project_files to authenticated;

grant select, insert, update on public.proposals to authenticated;
grant select, insert on public.selections to authenticated;

grant select, insert, update on public.sow_versions to authenticated;
grant select, insert, update on public.milestones to authenticated;
grant select, insert, update on public.completion_criteria to authenticated;
grant select, insert on public.sow_approvals to authenticated;

grant select, insert, update on public.project_repositories to authenticated;
grant select, insert on public.milestone_submissions to authenticated;
grant select, insert on public.milestone_submission_criteria to authenticated;
grant select, insert on public.verification_runs to authenticated;
grant select on public.criterion_results to authenticated;
grant select on public.evidence_artifacts to authenticated;
grant select, insert on public.milestone_decisions to authenticated;

grant select, insert, update on public.invoices to authenticated;
grant select, insert on public.payments to authenticated;
grant select, insert on public.evidence_bundles to authenticated;
grant select on public.audit_events to authenticated;
revoke all on public.github_webhook_deliveries from anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- 12. 실행 후 최소 검증
-- ---------------------------------------------------------------------------

select
  t.table_name,
  c.relrowsecurity as row_security
from information_schema.tables t
join pg_class c on c.relname = t.table_name
join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.table_schema
where t.table_schema = 'public'
  and t.table_name in (
    'projects',
    'project_requirement_versions',
    'project_files',
    'proposals',
    'selections',
    'sow_versions',
    'milestones',
    'completion_criteria',
    'sow_approvals',
    'project_repositories',
    'milestone_submissions',
    'verification_runs',
    'criterion_results',
    'evidence_artifacts',
    'milestone_decisions',
    'invoices',
    'payments',
    'evidence_bundles',
    'audit_events',
    'github_webhook_deliveries'
  )
order by table_name;
