-- Supabase SQL Editor에서 실행 (fix_add_commission_vat.sql 이후 아무 때나).
-- 수수료 자진신고를 발주자→프리랜서 지급 화면과 동일하게 카드/계좌이체/지갑
-- 4가지 방식으로 받을 수 있도록 컬럼을 추가한다. 카드/계좌이체/기타는 기존과
-- 동일하게 자진신고(참조값 텍스트)로 처리하고, 지갑은 payments 테이블과 같은
-- 방식으로 온체인 USDC 전송을 서버가 직접 조회해 자동 검증한다.

begin;

alter table public.commission_charges
  add column if not exists payment_method text not null default 'bank_transfer'
    check (payment_method in ('wallet_testnet', 'bank_transfer', 'card', 'other')),
  add column if not exists tx_hash text,
  add column if not exists to_address text,
  add column if not exists block_number bigint;

create unique index if not exists commission_charges_tx_hash_key
  on public.commission_charges (tx_hash)
  where tx_hash is not null;

commit;
