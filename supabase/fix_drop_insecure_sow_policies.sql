-- Supabase SQL Editor에서 실행.
--
-- 배경: PR #53("Fix sow 2.0", 커밋 be79c0d)이 추가한 supabase/sow_schema.sql은
--   라이브 스키마(mvp_domain_schema.sql)를 확인하지 않고 작성된 중복 정의 파일이었다.
--   해당 파일은 아래 4개 테이블에 무제한 접근 정책을 생성한다.
--
--     create policy "Allow all on sow_versions"       ... for all using (true);
--     create policy "Allow all on sow_approvals"      ... for all using (true);
--     create policy "Allow all on milestones"         ... for all using (true);
--     create policy "Allow all on completion_criteria"... for all using (true);
--
-- 위험: Postgres RLS는 permissive 정책을 OR로 결합한다. 이 정책이 하나라도 남아 있으면
--   private.is_project_owner / private.can_access_project 기반 접근 제어가 무력화되어
--   다른 조직의 SOW, 마일스톤, 완료조건을 열람하고 수정할 수 있다.
--   또한 이 정책들에는 `to authenticated` 절이 없어 기본값인 PUBLIC에 적용된다.
--   Supabase에서는 anon과 authenticated가 모두 PUBLIC에 포함되므로
--   정책 계층에서의 역할 구분이 사라진다. 다만 실제 노출이 성립하려면
--   해당 테이블을 읽는 API 경로가 함께 있어야 한다.
--   `for all`이면서 `with check`가 없으므로 using 식이 쓰기 검사에도 그대로 사용되어
--   읽기뿐 아니라 insert/update/delete까지 전부 허용된다.
--
-- 2026-08-18 확인 결과: 라이브 DB에 해당 정책이 존재하지 않는다(아래 1번 쿼리 0행).
--   이 파일은 실행된 적이 없으며 실제 데이터 노출은 발생하지 않았다.
--   이 스크립트는 재발 시 점검 및 복구 용도로 남긴다.
--
-- 이 스크립트는 멱등하다. sow_schema.sql을 실행한 적이 없으면 아무 것도 바꾸지 않는다.
-- 관련 조치: supabase/sow_schema.sql 파일은 저장소에서 삭제했다.
--   SOW 관련 테이블과 정책의 기준 정의는 supabase/mvp_domain_schema.sql이다.

-- 1) 조치 전 현재 상태 확인. 아래 4행이 나오면 라이브 DB가 영향을 받은 것이다.
select schemaname, tablename, policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('sow_versions', 'sow_approvals', 'milestones', 'completion_criteria')
  and policyname like 'Allow all on %'
order by tablename;

-- 2) 무제한 접근 정책 제거.
drop policy if exists "Allow all on sow_versions" on public.sow_versions;
drop policy if exists "Allow all on sow_approvals" on public.sow_approvals;
drop policy if exists "Allow all on milestones" on public.milestones;
drop policy if exists "Allow all on completion_criteria" on public.completion_criteria;

-- 3) RLS가 켜져 있는지 확인. rowsecurity가 4행 모두 true여야 한다.
select relname as table_name, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('sow_versions', 'sow_approvals', 'milestones', 'completion_criteria')
order by relname;

-- 4) 기준 정책이 남아 있는지 확인.
--    mvp_domain_schema.sql 기준으로 아래 11개 정책이 모두 있어야 한다.
--      sow_versions:        sow_versions_participant_select,
--                           sow_versions_owner_insert,
--                           sow_versions_owner_update_draft
--      milestones:          milestones_participant_select,
--                           milestones_owner_insert,
--                           milestones_owner_update
--      completion_criteria: criteria_participant_select,
--                           criteria_owner_insert,
--                           criteria_owner_update
--      sow_approvals:       sow_approvals_participant_select,
--                           sow_approvals_participant_insert
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('sow_versions', 'sow_approvals', 'milestones', 'completion_criteria')
order by tablename, policyname;

-- 5) 남아 있는 무제한 정책이 없는지 최종 확인.
--    이 쿼리가 0행을 반환해야 조치가 끝난 것이다.
--    (sow_schema.sql이 만든 정책 외에 다른 경로로 생긴 전체 허용 정책도 함께 잡는다.)
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('sow_versions', 'sow_approvals', 'milestones', 'completion_criteria')
  and (
    coalesce(btrim(qual), '') = 'true'
    or coalesce(btrim(with_check), '') = 'true'
  )
order by tablename, policyname;
