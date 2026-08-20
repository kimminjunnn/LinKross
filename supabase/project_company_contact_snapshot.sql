-- Store the PO display name used when a project is created.
-- This mirrors proposal freelancer_display_name_snapshot for MVP approval history.

alter table public.projects
  add column if not exists company_contact_name_snapshot text;

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

revoke all on function public.create_project_with_requirements(
  text, text, text, numeric, date, date, timestamptz, timestamptz,
  text, text, text, text, text, text, text, numeric, public.budget_type
) from public;

grant execute on function public.create_project_with_requirements(
  text, text, text, numeric, date, date, timestamptz, timestamptz,
  text, text, text, text, text, text, text, numeric, public.budget_type
) to authenticated;
