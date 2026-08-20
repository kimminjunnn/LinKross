-- Supabase SQL Editor에서 실행.
-- 간편장부 내보내기용: 공급가액(amount)과 부가세를 분리해서 기록할 수 있게
-- invoices.vat_amount 컬럼을 추가한다. 기존 인보이스는 0으로 채워진다
-- (제출 당시 부가세를 별도로 안 받았던 것들이라 안전한 기본값).

begin;

alter table public.invoices
  add column if not exists vat_amount numeric not null default 0 check (vat_amount >= 0);

commit;
