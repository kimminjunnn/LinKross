-- LinKross verification Runner 제어 계층
-- 실행 위치: Supabase Dashboard > SQL Editor > New query
-- 선행 조건: supabase/mvp_domain_schema.sql 적용

begin;

create table if not exists private.verification_run_leases (
  run_id uuid primary key references public.verification_runs(id) on delete cascade,
  worker_id text not null check (worker_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$'),
  lease_token_hash text not null check (lease_token_hash ~ '^[0-9a-f]{64}$'),
  lease_expires_at timestamptz not null,
  heartbeat_at timestamptz not null default now(),
  claimed_at timestamptz not null default now()
);

revoke all on private.verification_run_leases from public, anon, authenticated;

create index if not exists verification_run_leases_expiry_idx
  on private.verification_run_leases (lease_expires_at);

create or replace function public.claim_verification_run(
  p_worker_id text,
  p_lease_token_hash text,
  p_lease_seconds integer default 300
)
returns table (
  id uuid,
  project_id uuid,
  milestone_id uuid,
  submission_id uuid,
  scope public.verification_scope,
  requested_criterion_id uuid,
  attempt_number integer,
  status public.verification_run_status,
  lease_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_id uuid;
  claimed_project_id uuid;
begin
  if p_worker_id !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$'
    or p_lease_token_hash !~ '^[0-9a-f]{64}$'
    or p_lease_seconds not between 60 and 900 then
    raise exception 'LEASE_INPUT_INVALID';
  end if;

  select vr.id, vr.project_id
  into claimed_id, claimed_project_id
  from public.verification_runs vr
  left join private.verification_run_leases vrl on vrl.run_id = vr.id
  where vr.status = 'queued'::public.verification_run_status
     or (
       vr.status in (
         'provisioning'::public.verification_run_status,
         'installing'::public.verification_run_status,
         'building'::public.verification_run_status,
         'running'::public.verification_run_status
       )
       and (vrl.run_id is null or vrl.lease_expires_at < now())
     )
  order by vr.queued_at, vr.created_at
  for update of vr skip locked
  limit 1;

  if claimed_id is null then
    return;
  end if;

  update public.verification_runs vr
  set status = 'provisioning'::public.verification_run_status,
      started_at = coalesce(started_at, now()),
      completed_at = null,
      error_summary = null
  where vr.id = claimed_id;

  insert into private.verification_run_leases (
    run_id, worker_id, lease_token_hash, lease_expires_at, heartbeat_at, claimed_at
  ) values (
    claimed_id,
    p_worker_id,
    p_lease_token_hash,
    now() + make_interval(secs => p_lease_seconds),
    now(),
    now()
  )
  on conflict (run_id) do update
  set worker_id = excluded.worker_id,
      lease_token_hash = excluded.lease_token_hash,
      lease_expires_at = excluded.lease_expires_at,
      heartbeat_at = excluded.heartbeat_at,
      claimed_at = excluded.claimed_at;

  insert into public.audit_events (
    project_id, event_type, entity_type, entity_id, metadata
  ) values (
    claimed_project_id,
    'verification_run_claimed',
    'verification_run',
    claimed_id::text,
    jsonb_build_object('worker_id', p_worker_id)
  );

  return query
  select
    vr.id, vr.project_id, vr.milestone_id, vr.submission_id, vr.scope,
    vr.requested_criterion_id, vr.attempt_number, vr.status, vrl.lease_expires_at
  from public.verification_runs vr
  join private.verification_run_leases vrl on vrl.run_id = vr.id
  where vr.id = claimed_id;
end;
$$;

create or replace function public.heartbeat_verification_run(
  p_run_id uuid,
  p_worker_id text,
  p_lease_token_hash text,
  p_lease_seconds integer default 300
)
returns table (lease_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_lease_seconds not between 60 and 900 then
    raise exception 'LEASE_INPUT_INVALID';
  end if;

  return query
  update private.verification_run_leases vrl
  set heartbeat_at = now(),
      lease_expires_at = now() + make_interval(secs => p_lease_seconds)
  where vrl.run_id = p_run_id
    and vrl.worker_id = p_worker_id
    and vrl.lease_token_hash = p_lease_token_hash
    and vrl.lease_expires_at > now()
    and exists (
      select 1 from public.verification_runs vr
      where vr.id = vrl.run_id
        and vr.status in (
          'provisioning'::public.verification_run_status,
          'installing'::public.verification_run_status,
          'building'::public.verification_run_status,
          'running'::public.verification_run_status
        )
    )
  returning vrl.lease_expires_at;
end;
$$;

create or replace function public.transition_verification_run(
  p_run_id uuid,
  p_worker_id text,
  p_lease_token_hash text,
  p_expected_status public.verification_run_status,
  p_next_status public.verification_run_status,
  p_environment_provider text default null,
  p_environment_reference text default null,
  p_error_summary text default null,
  p_lease_seconds integer default 300
)
returns table (status public.verification_run_status, lease_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_row public.verification_runs%rowtype;
  lease_row private.verification_run_leases%rowtype;
  transition_allowed boolean;
  is_terminal boolean;
begin
  if p_lease_seconds not between 60 and 900 then
    raise exception 'LEASE_INPUT_INVALID';
  end if;

  select * into run_row
  from public.verification_runs vr
  where vr.id = p_run_id
  for update;

  if run_row.id is null then raise exception 'RUN_NOT_FOUND'; end if;

  select * into lease_row
  from private.verification_run_leases vrl
  where vrl.run_id = p_run_id
  for update;

  if lease_row.run_id is null
    or lease_row.worker_id <> p_worker_id
    or lease_row.lease_token_hash <> p_lease_token_hash then
    raise exception 'LEASE_INVALID';
  end if;
  if lease_row.lease_expires_at <= now() then
    raise exception 'LEASE_EXPIRED';
  end if;
  if run_row.status <> p_expected_status then raise exception 'INVALID_TRANSITION'; end if;

  transition_allowed :=
    (p_expected_status = 'provisioning' and p_next_status = 'installing')
    or (p_expected_status = 'installing' and p_next_status = 'building')
    or (p_expected_status = 'building' and p_next_status = 'running')
    or (
      p_expected_status in ('provisioning', 'installing', 'building', 'running')
      and p_next_status in ('failed', 'timed_out', 'cancelled')
    );
  if not transition_allowed then raise exception 'INVALID_TRANSITION'; end if;

  is_terminal := p_next_status in ('failed', 'timed_out', 'cancelled');

  update public.verification_runs vr
  set status = p_next_status,
      environment_provider = coalesce(p_environment_provider, environment_provider),
      environment_reference = coalesce(p_environment_reference, environment_reference),
      error_summary = coalesce(p_error_summary, error_summary),
      completed_at = case when is_terminal then now() else completed_at end
  where vr.id = p_run_id;

  if is_terminal then
    delete from private.verification_run_leases vrl where vrl.run_id = p_run_id;
  else
    update private.verification_run_leases vrl
    set heartbeat_at = now(),
        lease_expires_at = now() + make_interval(secs => p_lease_seconds)
    where vrl.run_id = p_run_id;
  end if;

  insert into public.audit_events (
    project_id, event_type, entity_type, entity_id, metadata
  ) values (
    run_row.project_id,
    'verification_run_status_changed',
    'verification_run',
    p_run_id::text,
    jsonb_build_object(
      'worker_id', p_worker_id,
      'from', p_expected_status,
      'to', p_next_status
    )
  );

  return query
  select vr.status, vrl.lease_expires_at
  from public.verification_runs vr
  left join private.verification_run_leases vrl on vrl.run_id = vr.id
  where vr.id = p_run_id;
end;
$$;

create or replace function public.complete_verification_run(
  p_run_id uuid,
  p_worker_id text,
  p_lease_token_hash text,
  p_status public.verification_run_status,
  p_results jsonb,
  p_preview_url text default null,
  p_error_summary text default null,
  p_duration_ms integer default null
)
returns table (status public.verification_run_status, completed_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_row public.verification_runs%rowtype;
  lease_row private.verification_run_leases%rowtype;
  result_json jsonb;
  evidence_json jsonb;
  criterion_uuid uuid;
  criterion_status public.criterion_result_status;
  criterion_result_id uuid;
  expected_count integer;
  failed_count integer;
  review_count integer;
begin
  select * into run_row
  from public.verification_runs vr
  where vr.id = p_run_id
  for update;

  if run_row.id is null then raise exception 'RUN_NOT_FOUND'; end if;

  select * into lease_row
  from private.verification_run_leases vrl
  where vrl.run_id = p_run_id
  for update;

  if lease_row.run_id is null
    or lease_row.worker_id <> p_worker_id
    or lease_row.lease_token_hash <> p_lease_token_hash then
    raise exception 'LEASE_INVALID';
  end if;
  if lease_row.lease_expires_at <= now() then
    raise exception 'LEASE_EXPIRED';
  end if;
  if run_row.status <> 'running'::public.verification_run_status
    or p_status not in ('passed', 'failed', 'needs_review') then
    raise exception 'INVALID_TRANSITION';
  end if;
  if jsonb_typeof(p_results) <> 'array'
    or jsonb_array_length(p_results) not between 1 and 50 then
    raise exception 'RESULT_SET_INVALID';
  end if;
  if p_preview_url is not null and left(p_preview_url, 8) <> 'https://' then
    raise exception 'RESULT_PREVIEW_URL_INVALID';
  end if;

  select count(*) into expected_count
  from public.milestone_submission_criteria msc
  where msc.submission_id = run_row.submission_id
    and (
      run_row.scope = 'milestone'::public.verification_scope
      or msc.criterion_id = run_row.requested_criterion_id
    );

  if expected_count <> jsonb_array_length(p_results)
    or expected_count <> (
      select count(distinct value->>'criterionId')
      from jsonb_array_elements(p_results)
    ) then
    raise exception 'RESULT_SET_INCOMPLETE';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_results) supplied
    where not exists (
      select 1
      from public.milestone_submission_criteria msc
      where msc.submission_id = run_row.submission_id
        and msc.criterion_id = (supplied.value->>'criterionId')::uuid
        and (
          run_row.scope = 'milestone'::public.verification_scope
          or msc.criterion_id = run_row.requested_criterion_id
        )
    )
  ) then
    raise exception 'RESULT_CRITERION_INVALID';
  end if;

  select
    count(*) filter (where value->>'status' = 'failed'),
    count(*) filter (where value->>'status' = 'needs_review')
  into failed_count, review_count
  from jsonb_array_elements(p_results);

  if (p_status = 'passed' and exists (
      select 1 from jsonb_array_elements(p_results) where value->>'status' <> 'passed'
    ))
    or (p_status = 'failed' and failed_count = 0)
    or (p_status = 'needs_review' and (review_count = 0 or failed_count > 0)) then
    raise exception 'RESULT_STATUS_CONFLICT';
  end if;

  for result_json in select value from jsonb_array_elements(p_results)
  loop
    criterion_uuid := (result_json->>'criterionId')::uuid;
    criterion_status := (result_json->>'status')::public.criterion_result_status;

    insert into public.criterion_results (
      project_id, milestone_id, run_id, criterion_id, status,
      observed_result, error_message, supporting_commit_sha, duration_ms
    ) values (
      run_row.project_id,
      run_row.milestone_id,
      run_row.id,
      criterion_uuid,
      criterion_status,
      nullif(result_json->>'observedResult', ''),
      nullif(result_json->>'errorMessage', ''),
      (select head_commit_sha from public.milestone_submissions where id = run_row.submission_id),
      nullif(result_json->>'durationMs', '')::integer
    ) returning id into criterion_result_id;

    for evidence_json in
      select value from jsonb_array_elements(coalesce(result_json->'evidence', '[]'::jsonb))
    loop
      if nullif(evidence_json->>'externalUrl', '') is not null
        and left(evidence_json->>'externalUrl', 8) <> 'https://' then
        raise exception 'RESULT_EVIDENCE_URL_INVALID';
      end if;
      if nullif(evidence_json->>'storagePath', '') is not null
        and position(
          run_row.project_id::text || '/' || run_row.id::text || '/'
          in evidence_json->>'storagePath'
        ) <> 1 then
        raise exception 'RESULT_EVIDENCE_PATH_INVALID';
      end if;
      if evidence_json->>'type' <> 'preview'
        and nullif(evidence_json->>'storagePath', '') is null then
        raise exception 'RESULT_EVIDENCE_STORAGE_REQUIRED';
      end if;

      insert into public.evidence_artifacts (
        project_id, run_id, criterion_result_id, artifact_type,
        bucket_id, storage_path, external_url, mime_type, size_bytes, sha256, is_redacted
      ) values (
        run_row.project_id,
        run_row.id,
        criterion_result_id,
        (evidence_json->>'type')::public.evidence_artifact_type,
        case when nullif(evidence_json->>'storagePath', '') is null then null else 'linkross-evidence' end,
        nullif(evidence_json->>'storagePath', ''),
        nullif(evidence_json->>'externalUrl', ''),
        nullif(evidence_json->>'mimeType', ''),
        nullif(evidence_json->>'sizeBytes', '')::bigint,
        nullif(evidence_json->>'sha256', ''),
        coalesce((evidence_json->>'isRedacted')::boolean, false)
      );
    end loop;
  end loop;

  update public.verification_runs vr
  set status = p_status,
      completed_at = now(),
      preview_url = p_preview_url,
      error_summary = p_error_summary,
      duration_ms = p_duration_ms
  where vr.id = p_run_id;

  delete from private.verification_run_leases vrl where vrl.run_id = p_run_id;

  insert into public.audit_events (
    project_id, event_type, entity_type, entity_id, metadata
  ) values (
    run_row.project_id,
    'verification_run_completed',
    'verification_run',
    p_run_id::text,
    jsonb_build_object(
      'worker_id', p_worker_id,
      'status', p_status,
      'result_count', jsonb_array_length(p_results)
    )
  );

  return query
  select vr.status, vr.completed_at
  from public.verification_runs vr
  where vr.id = p_run_id;
end;
$$;

revoke all on function public.claim_verification_run(text, text, integer) from public, anon, authenticated;
revoke all on function public.heartbeat_verification_run(uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.transition_verification_run(uuid, text, text, public.verification_run_status, public.verification_run_status, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.complete_verification_run(uuid, text, text, public.verification_run_status, jsonb, text, text, integer) from public, anon, authenticated;

grant execute on function public.claim_verification_run(text, text, integer) to service_role;
grant execute on function public.heartbeat_verification_run(uuid, text, text, integer) to service_role;
grant execute on function public.transition_verification_run(uuid, text, text, public.verification_run_status, public.verification_run_status, text, text, text, integer) to service_role;
grant execute on function public.complete_verification_run(uuid, text, text, public.verification_run_status, jsonb, text, text, integer) to service_role;

commit;
