-- Supabase SQL Editor에서 실행.
-- 지급 상태(요청/처리 중/완료)를 실제로 기록하는 쓰기 경로와,
-- 통합 증빙 번들을 생성해 저장하는 경로를 추가한다.
--
-- 1) payments: 원래 온체인 검증 전용 스키마(tx_hash/to_address/block_number NOT NULL)라
--    "지급 요청" 단계처럼 아직 온체인 정보가 없는 상태를 저장할 수 없었다. 세 컬럼을
--    nullable로 완화하고, 발주자가 상태를 갱신할 수 있는 update 정책을 추가한다.
-- 2) evidence_bundles: PDF/파일 생성 Worker 없이도 통합 증빙을 제공할 수 있도록
--    번들 내용을 jsonb로 직접 저장하는 payload 컬럼을 추가한다.

begin;

alter table public.payments
  alter column tx_hash drop not null,
  alter column to_address drop not null,
  alter column block_number drop not null;

do $$ begin
  alter table public.payments
    add constraint payments_invoice_id_unique unique (invoice_id);
exception when duplicate_object then null;
end $$;

drop policy if exists payments_owner_update on public.payments;

create policy payments_owner_update
on public.payments for update
to authenticated
using ((select private.is_project_owner(project_id)))
with check ((select private.is_project_owner(project_id)));

alter table public.evidence_bundles
  add column if not exists payload jsonb;

commit;
