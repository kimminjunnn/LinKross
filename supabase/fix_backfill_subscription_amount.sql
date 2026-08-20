-- Supabase SQL Editor에서 실행 (일회성 데이터 보정).
-- 구독 플랜 티어제(fix_add_subscription_plan.sql) 도입 전에 이미 존재하던
-- subscriptions row는 plan_id가 기본값 'starter'로만 채워지고, amount는
-- 예전에 수동 입력했던 값(예: 79,000원)이 그대로 남아있어 플랜명과 금액이
-- 안 맞는 경우가 있었다. 플랜별 고정가로 다시 맞춘다.

begin;

update public.subscriptions
set amount = case plan_id
  when 'starter' then 49000
  when 'growth' then 99000
  when 'scale' then 199000
  else amount
end,
updated_at = now()
where amount <> case plan_id
  when 'starter' then 49000
  when 'growth' then 99000
  when 'scale' then 199000
  else amount
end;

commit;
