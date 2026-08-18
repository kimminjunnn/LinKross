begin;

create table if not exists public.sow_revision_request_reads (
  project_id uuid not null references public.projects(id) on delete restrict,
  sow_revision_request_id uuid not null references public.sow_revision_requests(id) on delete cascade,
  read_by uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (sow_revision_request_id, read_by)
);

create index if not exists sow_revision_request_reads_project_idx
  on public.sow_revision_request_reads (project_id, read_by, read_at desc);

comment on table public.sow_revision_request_reads is
  'Tracks company-side read state for append-only SOW revision requests.';

create or replace function public.validate_sow_revision_request_read()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_project_id uuid;
begin
  select project_id
    into request_project_id
  from public.sow_revision_requests
  where id = new.sow_revision_request_id;

  if request_project_id is null then
    raise exception 'SOW_REVISION_REQUEST_NOT_FOUND';
  end if;

  if not private.is_project_owner(request_project_id) then
    raise exception 'PROJECT_OWNER_REQUIRED';
  end if;

  new.project_id = request_project_id;
  new.read_by = (select auth.uid());
  new.read_at = coalesce(new.read_at, now());

  return new;
end;
$$;

drop trigger if exists sow_revision_request_reads_validate
on public.sow_revision_request_reads;
create trigger sow_revision_request_reads_validate
before insert on public.sow_revision_request_reads
for each row execute function public.validate_sow_revision_request_read();

alter table public.sow_revision_request_reads enable row level security;

drop policy if exists sow_revision_request_reads_project_owner_select
on public.sow_revision_request_reads;
create policy sow_revision_request_reads_project_owner_select
on public.sow_revision_request_reads for select
to authenticated
using ((select private.is_project_owner(project_id)));

drop policy if exists sow_revision_request_reads_project_owner_insert
on public.sow_revision_request_reads;
create policy sow_revision_request_reads_project_owner_insert
on public.sow_revision_request_reads for insert
to authenticated
with check (
  read_by = (select auth.uid())
  and (select private.is_project_owner(project_id))
);

grant select, insert on public.sow_revision_request_reads to authenticated;
revoke update, delete on public.sow_revision_request_reads from authenticated;

notify pgrst, 'reload schema';

commit;
