-- Supabase SQL Editor에서 실행 (일회성 데이터 보정).
-- 구독 플랜 가격을 49,000 / 99,000 / 199,000원에서
-- 49,000 / 79,000 / 129,000원으로 조정했다. 기존에 저장된 amount
-- 스냅샷을 새 요금표로 다시 맞춘다. fix_backfill_subscription_amount.sql을
-- 이미 돌렸는지 여부와 상관없이 안전하게 반복 실행 가능하다.

begin;

update public.subscriptions
set amount = case plan_id
  when 'starter' then 49000
  when 'growth' then 79000
  when 'scale' then 129000
  else amount
end,
updated_at = now()
where amount <> case plan_id
  when 'starter' then 49000
  when 'growth' then 79000
  when 'scale' then 129000
  else amount
end;

commit;
