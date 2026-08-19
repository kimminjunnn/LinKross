-- Respect the approver_role requested by the app, then verify that role.
-- This keeps PO and Freelancer approvals separate even for multi-role MVP users.

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
