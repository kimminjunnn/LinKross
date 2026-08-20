-- Supabase SQL Editor에서 실행 (fix_add_commission_and_subscription.sql 이후 아무 때나).
-- 구독을 프로젝트 개수 기준 티어제로 바꾸면서, 실제로 구독 중인 플랜을
-- 스냅샷으로 저장한다. 가격 자체는 src/config/subscription-plan.ts가
-- 기준이고, 이 컬럼은 "그때 어떤 플랜을 선택했는지"만 기록한다.

begin;

alter table public.subscriptions
  add column if not exists plan_id text not null default 'starter'
    check (plan_id in ('starter', 'growth', 'scale'));

commit;
