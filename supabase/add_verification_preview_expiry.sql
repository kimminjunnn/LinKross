-- 검수 완료 후 동일 Sandbox Preview를 10분 동안 제공한다.
-- 실행 위치: Supabase Dashboard > SQL Editor > New query
-- 선행 조건: supabase/mvp_domain_schema.sql 및 verification_runner_control_plane.sql 적용

begin;

alter table public.verification_runs
  add column if not exists preview_expires_at timestamptz;

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

update public.verification_runs
set preview_expires_at = completed_at + interval '10 minutes'
where preview_url is not null
  and completed_at is not null;

commit;
