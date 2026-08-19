-- Supabase SQL Editor에서 실행.
-- payment_status_and_evidence_bundle.sql이 tx_hash/to_address/block_number만
-- nullable로 완화했는데, 같은 온체인 전용 레거시 컬럼인 milestone_id(text, not null)를
-- 놓쳐서 새 지급 요청 흐름(requestPayment)의 insert가 NOT NULL 위반으로 실패했다.
-- milestone_id는 새 FK 컬럼 milestone_record_id로 대체됐으므로 nullable로 완화한다.

begin;

alter table public.payments
  alter column milestone_id drop not null;

commit;
