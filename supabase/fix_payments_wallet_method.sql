-- Supabase SQL Editor에서 실행.
-- 테스트넷 지갑 송금(자동 검증) 복원 + 다른 결제수단(목업) 지원을 위한 컬럼 추가.
--
-- 1) payments.payment_method: 요청 단계에서 발주자가 고른 결제수단.
--    'wallet_testnet'만 온체인 자동 검증 대상이고, 나머지는 기존 수동 상태 변경 흐름 그대로 사용(목업).
--    기존 row는 전부 수동으로 처리됐던 것들이라 'bank_transfer' 기본값으로 채운다.
-- 2) freelancer_profiles.wallet_address: 프리랜서가 지급받을 Base 지갑 주소(선택 입력).

begin;

alter table public.payments
  add column if not exists payment_method text not null default 'bank_transfer'
    check (payment_method in ('wallet_testnet', 'bank_transfer', 'card', 'other'));

alter table public.freelancer_profiles
  add column if not exists wallet_address text;

commit;
