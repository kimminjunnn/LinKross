-- 자동 검수 atom 어휘 갭 로그 (설계 §21.3, §21.5)
--
-- "확인 필요(manual)"로 떨어진 DoD 원문을 누적해, 반복되는 갭 유형을 사람이
-- 검토하고 새 atom을 설계할 근거 데이터를 모은다. 판정에는 관여하지 않는다.
--
-- 이 테이블은 2026-08-19 이전에 SQL Editor에서 직접 생성되어 저장소에 파일이
-- 없었다. 아래 문장은 기존 배포에 다시 적용해도 안전하도록 작성했다.

create table if not exists public.verification_atom_gap_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  dod_text text not null,
  created_at timestamptz not null default now()
);

-- 자동화 실패 사유. 어휘 부족(llm_declined)과 조합 오류(schema_rejected),
-- 외부 호출 실패(llm_failed, no_api_key)를 구분해 §21.3 클러스터링의 입력으로 쓴다.
alter table public.verification_atom_gap_log
  add column if not exists reason text;

create index if not exists verification_atom_gap_log_project_id_idx
  on public.verification_atom_gap_log (project_id);

create index if not exists verification_atom_gap_log_created_at_idx
  on public.verification_atom_gap_log (created_at desc);

-- 갭 로그는 서버(서비스 롤)만 기록하고 읽는다. 사용자 API로는 노출하지 않는다.
alter table public.verification_atom_gap_log enable row level security;
