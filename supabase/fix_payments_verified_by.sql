-- Supabase SQL Editor에서 실행.
-- payments.verified_by가 auth.users를 cascade 없이 참조하고 있어서,
-- 그 계정으로 지급 검증을 한 적이 있으면 계정 삭제가 막히는 문제를 고친다.
-- 계정이 삭제돼도 지급 증빙(tx 해시·금액 등)은 남기고 "검증한 사람"만 null로 비운다.

alter table public.payments
  drop constraint payments_verified_by_fkey;

alter table public.payments
  alter column verified_by drop not null;

alter table public.payments
  add constraint payments_verified_by_fkey
  foreign key (verified_by) references auth.users(id) on delete set null;
