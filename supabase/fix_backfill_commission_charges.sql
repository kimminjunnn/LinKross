-- Supabase SQL Editor에서 실행 (일회성 데이터 백필, fix_add_commission_vat.sql 이후 아무 때나).
-- payments_create_commission_charge 트리거는 AFTER UPDATE라서 설치 이후에 일어나는
-- 상태 변경에만 반응한다. 트리거를 달기 전에 이미 completed였던 기존 결제 건에는
-- commission_charges가 생기지 않는다. 이 스크립트로 그 누락분을 채운다.
-- 트리거(create_commission_charge_on_payment_completion)와 완전히 동일한 계산 로직이다.

begin;

insert into public.commission_charges (
  project_id, milestone_record_id, payment_id, freelancer_id,
  base_amount, commission_rate, commission_amount, vat_amount, currency, due_at
)
select
  p.project_id,
  p.milestone_record_id,
  p.id,
  pr.freelancer_id,
  p.amount_usdc,
  0.07,
  round(p.amount_usdc * 0.07, 2),
  round(p.amount_usdc * 0.07 * 0.10, 2),
  p.currency,
  now()
from public.payments p
join public.selections s on s.project_id = p.project_id
join public.proposals pr on pr.id = s.proposal_id
where p.status = 'completed'::public.payment_record_status
  and not exists (
    select 1 from public.commission_charges c where c.payment_id = p.id
  )
on conflict (payment_id) do nothing;

commit;
