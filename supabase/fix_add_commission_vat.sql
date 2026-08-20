-- Supabase SQL Editor에서 실행 (fix_add_commission_and_subscription.sql 이후에 실행).
-- LinKross는 아직 사업자등록을 하지 않아 실제로 부가세를 징수할 근거가 없다.
-- 다만 프로젝트 데모/포트폴리오 목적으로 "실제 서비스처럼" VAT 표시가 보이길 원해서,
-- 일반과세자를 가정한 가안(假案) 시나리오로 수수료 공급가액의 10%를 VAT로 계산해 보여준다.
-- 실제 사업자등록 여부가 정해지면 이 컬럼의 의미(가안 vs 실제 과세)를 문서/문구에서 다시 정리해야 한다.

begin;

alter table public.commission_charges
  add column if not exists vat_amount numeric not null default 0 check (vat_amount >= 0);

create or replace function public.create_commission_charge_on_payment_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  freelancer_id_value uuid;
  commission_rate_value numeric := 0.07; -- src/config/commission-status.ts의 COMMISSION_RATE와 반드시 동일하게 유지
  commission_vat_rate_value numeric := 0.10; -- src/config/commission-status.ts의 COMMISSION_VAT_RATE와 반드시 동일하게 유지 (가안)
  commission_amount_value numeric;
begin
  if new.status <> 'completed'::public.payment_record_status
     or old.status = 'completed'::public.payment_record_status then
    return new;
  end if;

  select pr.freelancer_id into freelancer_id_value
  from public.selections s
  join public.proposals pr on pr.id = s.proposal_id
  where s.project_id = new.project_id;

  if freelancer_id_value is null then
    raise exception 'COMMISSION_FREELANCER_NOT_FOUND';
  end if;

  commission_amount_value := round(new.amount_usdc * commission_rate_value, 2);

  insert into public.commission_charges (
    project_id, milestone_record_id, payment_id, freelancer_id,
    base_amount, commission_rate, commission_amount, vat_amount, currency, due_at
  ) values (
    new.project_id, new.milestone_record_id, new.id, freelancer_id_value,
    new.amount_usdc, commission_rate_value, commission_amount_value,
    round(commission_amount_value * commission_vat_rate_value, 2),
    new.currency, now()
  )
  on conflict (payment_id) do nothing;

  return new;
end;
$$;

commit;
