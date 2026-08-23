-- 사내 비품 대여 관리 프로젝트 — 중복 2건 삭제 후 1건 재생성.
--
-- Supabase SQL Editor에서 한 번 실행한다. 전체가 하나의 트랜잭션으로 돌아가므로
-- 중간에 실패하면 트리거 해제까지 통째로 롤백된다.
--
-- 참여자
--   발주자   sesac2024ai11   97ef85c7-dea9-41ed-9907-17a7815633ca (새싹컴퍼니)
--   프리랜서 onemore990109   0a93c5d0-2d40-40af-90a5-8ed34179f0de (Messi)
--   저장소   kimminjunnn/linkross-github-app-test
--
-- 검수 대상 PR (마일스톤 3개를 브랜치별로 나눠 올렸다)
--   PR #5  feat/m1-auth    -> main             a5466b9  로그인과 비품 목록
--   PR #6  feat/m2-rental  -> feat/m1-auth     7f10d0f  대여 신청과 내 신청 내역
--   PR #7  feat/m3-admin   -> feat/m2-rental   8a5f838  총무팀 승인과 접근 제한
--
--   base를 앞 마일스톤 브랜치로 잡아 PR diff에는 해당 마일스톤 변경분만 남긴다.
--   검수는 diff가 아니라 head SHA 시점의 트리 전체를 받아 실행하므로, M2 검수도
--   M1의 로그인부터 정상 동작한다.
--
-- 원문은 저장소의 실제 화면을 읽고 작성했다. 화면에 보이는 이름은 따옴표로
-- 감싼다. 검수 계약의 `target` 후보를 원문에서 뽑기 때문이다
-- (`targetSuggestionsFrom`). 따옴표가 없으면 뽑을 이름이 없어 발주자가 직접
-- 적어야 한다.
--
-- 요구사항을 3단계로 묶은 이유는 PR 3개와 마일스톤을 1:1로 맞추기 위해서다.
-- 화면 단위로 5개 절을 두면 SOW가 마일스톤 5개로 갈라져 PR과 어긋난다.
--
-- 실제 화면
--   /login    이메일·비밀번호 입력 → 성공 시 /items 로 이동
--             오류는 role="alert" data-error 로 표시
--   /items    비품명·분류·상태 표 · 필터 "전체" "대여 가능" "대여중"
--             "비품 신청" 버튼 → 모달("비품" 선택, "신청 사유" 입력, "신청하기")
--   /requests 비품명·신청 사유·상태·"취소" 버튼
--             빈 상태 "아직 신청한 비품이 없습니다."
--   /admin    신청자·비품명·신청 사유·상태·"승인" "반려" 버튼
--             빈 상태 "아직 들어온 신청이 없습니다."
--   상태 배지 "승인 대기" "승인 완료" "반려됨"
--
-- 로그인 계정은 검수 실행기가 LINKROSS_TEST_EMAIL / LINKROSS_TEST_PASSWORD 로
-- 주입한다. 저장소는 이 두 환경변수를 읽어 일반 사원 계정으로 쓴다. 관리자
-- 계정은 admin@example.com 고정값이다.

-- ===========================================================================
-- 1부. 잘못 만든 프로젝트 2건 삭제
-- ===========================================================================
--
-- 프로젝트에 딸린 FK는 전부 on delete restrict 이고, 제출된 제안서와 요구사항
-- 버전에는 삭제 금지 트리거가 걸려 있다. 감사 이력을 지키려고 일부러 그렇게
-- 만든 것이므로, 여기서만 잠깐 풀고 바로 되돌린다.
--
-- 지우는 대상 (2026-08-22 시드 두 번 실행으로 생긴 중복)
--   f0ff0289-c885-4ebc-b498-71b1468351ef  "사내 비품 대여 관리 (신청부터 총무팀 승인까지)"
--   db586293-c828-44af-b84b-6417520a1021  "사내 비품 대여 관리"
--
-- 두 건 모두 SOW·마일스톤·검수 이력이 없다. 딸린 행은 요구사항 버전, 제안서,
-- 선정, 저장소 연결 각 1건씩뿐이다.

do $$
declare
  v_targets uuid[] := array[
    'f0ff0289-c885-4ebc-b498-71b1468351ef'::uuid,
    'db586293-c828-44af-b84b-6417520a1021'::uuid
  ];
  v_blocking int;
begin
  -- 지우면 안 되는 것이 딸려 있으면 여기서 멈춘다. SOW를 이미 만들었거나 검수를
  -- 돌린 프로젝트를 실수로 지우는 일을 막는다.
  select count(*) into v_blocking
  from (
    select 1 from public.sow_versions   where project_id = any(v_targets)
    union all
    select 1 from public.milestones     where project_id = any(v_targets)
    union all
    select 1 from public.verification_runs where project_id = any(v_targets)
    union all
    select 1 from public.audit_events   where project_id = any(v_targets)
    union all
    select 1 from public.invoices       where project_id = any(v_targets)
    union all
    select 1 from public.payments       where project_id = any(v_targets)
  ) blocking;

  if v_blocking > 0 then
    raise exception 'SOW·검수·정산 이력이 %건 남아 있어 삭제를 중단합니다.', v_blocking;
  end if;

  -- 감사 보호 트리거를 잠시 해제한다. 실패하면 트랜잭션째로 롤백되므로 해제된
  -- 상태가 남지 않는다.
  alter table public.proposals disable trigger proposals_protect_submitted;
  alter table public.project_requirement_versions disable trigger requirement_versions_immutable;

  -- projects -> requirement_versions FK를 먼저 끊는다.
  update public.projects
  set current_requirement_version_id = null
  where id = any(v_targets);

  delete from public.selections                 where project_id = any(v_targets);
  delete from public.proposals                  where project_id = any(v_targets);
  delete from public.project_repositories       where project_id = any(v_targets);
  delete from public.project_requirement_versions where project_id = any(v_targets);
  delete from public.projects                   where id = any(v_targets);

  -- 보호 트리거 복구.
  alter table public.proposals enable trigger proposals_protect_submitted;
  alter table public.project_requirement_versions enable trigger requirement_versions_immutable;

  raise notice '중복 프로젝트 2건 삭제 완료';
end $$;

-- ===========================================================================
-- 2부. '사내 비품 대여 관리 프로젝트' 1건 생성
-- ===========================================================================

do $$
declare
  v_company    uuid := '97ef85c7-dea9-41ed-9907-17a7815633ca';
  v_freelancer uuid := '0a93c5d0-2d40-40af-90a5-8ed34179f0de';
  v_title      text := '사내 비품 대여 관리 프로젝트';
  v_project    uuid := gen_random_uuid();
  v_req        uuid := gen_random_uuid();
  v_proposal   uuid := gen_random_uuid();
begin
  -- ── 발주자로 행동 ────────────────────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', v_company)::text, true);

  -- 모집 중 상태로 만든다. 제안서 트리거가 모집 기간을 확인하기 때문이다.
  insert into public.projects (id, company_id, title, status, lifecycle_stage)
  values (v_project, v_company, v_title, 'recruiting', 'preparing');

  -- 모집 기간은 요구사항 버전에 있다. 지금이 그 안에 들도록 잡는다.
  insert into public.project_requirement_versions (
    id, project_id, version_number, title, project_type, technology,
    goal, requirements, deliverables, out_of_scope, reference_notes,
    applicant_guidance, budget_amount, budget_type, currency,
    start_date, end_date, recruitment_start_at, recruitment_end_at, created_by
  ) values (
    v_req, v_project, 1,
    v_title,
    'web', 'Next.js, TypeScript',
    '사원이 사내 공용 비품을 신청하고 총무팀이 승인하면, 누가 무엇을 빌려 갔는지 한 화면에서 파악한다.',
    '아래 세 단계로 나눠 진행하고, 각 단계를 Pull Request 하나로 올려 단계별로 검수받는다.

[1단계 - 로그인과 비품 목록 화면]
- /login 에서 이메일과 비밀번호를 입력한다.
- /login 에서 로그인에 성공하면 /items 로 이동한다.
- /login 에서 비밀번호를 틀리게 입력하면 오류 메시지를 보여준다.
- /login 에서 이메일을 입력하지 않으면 로그인이 되지 않는다.
- 로그아웃 상태로 /items 에 직접 접근하면 /login 으로 보낸다.
- /items 에서 비품명, 분류, 대여 상태를 표로 보여준다.
- /items 에서 ''대여 가능'' 필터를 누르면 빌릴 수 있는 비품만 보인다.
- /items 에서 ''대여중'' 필터를 누르면 이미 나간 비품만 보인다.
- /items 에서 ''전체'' 필터를 누르면 모든 비품이 보인다.

[2단계 - 비품 신청과 내 신청 내역 화면]
- /items 에서 ''비품 신청'' 버튼을 누르면 신청 창이 열린다.
- 신청 창의 ''비품'' 선택 목록에는 대여 가능한 비품만 나온다.
- 신청 창에서 비품을 고르지 않거나 ''신청 사유''를 적지 않으면 ''신청하기'' 버튼을 누를 수 없다.
- 신청 창에서 ''신청 사유''를 100자를 넘겨 적으면 신청되지 않고 오류 메시지를 보여준다.
- 신청이 접수되면 접수되었다는 안내 문구를 보여준다.
- 신청한 비품은 /items 에서 ''대여중'' 상태가 된다.
- /requests 에서 내가 신청한 비품명, 신청 사유, 상태를 표로 보여준다.
- /requests 에서는 내가 낸 신청만 보이고 다른 사원의 신청은 보이지 않는다.
- /requests 에서 ''승인 대기'' 상태인 신청은 ''취소'' 버튼으로 취소할 수 있다.
- /requests 에서 취소한 비품은 /items 에서 다시 ''대여 가능'' 상태가 된다.
- /requests 에서 이미 처리된 신청은 취소할 수 없다.
- /requests 에 신청이 하나도 없으면 ''아직 신청한 비품이 없습니다'' 안내 문구를 보여준다.
- 로그아웃 상태로 /requests 에 직접 접근하면 /login 으로 보낸다.

[3단계 - 총무팀 승인 화면]
- /admin 에서 사원 전체의 신청을 신청자, 비품명, 신청 사유, 상태로 보여준다.
- /admin 에서 ''승인 대기'' 상태인 신청에만 ''승인''과 ''반려'' 버튼이 보인다.
- /admin 에서 ''승인'' 버튼을 누르면 상태가 ''승인 완료''로 바뀐다.
- /admin 에서 ''반려'' 버튼을 누르면 상태가 ''반려됨''으로 바뀐다.
- /admin 에서 처리가 끝난 신청에는 ''승인''과 ''반려'' 버튼이 보이지 않는다.
- /admin 에서 반려한 비품은 /items 에서 다시 ''대여 가능'' 상태가 된다.
- /admin 에서 승인한 비품은 /items 에서 ''대여중'' 상태로 남는다.
- 일반 사원 계정으로 /admin 에 직접 접근하면 /items 로 보내고 안내 문구를 보여준다.
- 일반 사원 계정에는 상단 메뉴에 ''승인 관리''가 보이지 않는다.',
    '배포 가능한 웹앱, 소스 코드',
    '회원가입, 비밀번호 재설정, 비품 등록·수정·삭제, 반납 처리, 대여 기간과 연체 관리, 알림, 사진 첨부',
    'github.com/kimminjunnn/linkross-github-app-test (마일스톤별 PR #5, #6, #7)',
    '구현 순서와 각 화면을 브라우저에서 확인하는 방법을 제안서에 포함해 주세요.',
    9000, 'fixed', 'USD',
    current_date, current_date + 21,
    now() - interval '1 hour', now() + interval '7 days',
    v_company
  );

  update public.projects set current_requirement_version_id = v_req where id = v_project;

  -- ── 프리랜서로 전환해 수행 제안서 제출 ───────────────────────────────────
  -- status·submitted_at·프로필 스냅샷은 트리거가 채운다. 여기서 넣지 않는다.
  perform set_config('request.jwt.claims', json_build_object('sub', v_freelancer)::text, true);

  insert into public.proposals (id, project_id, freelancer_id, content)
  values (
    v_proposal, v_project, v_freelancer,
    '화면 단위로 세 번에 나눠 올리겠습니다.

먼저 로그인과 비품 목록을 만듭니다. 로그인하지 않은 상태로 주소를 직접 쳐도 목록이 열리지 않도록 서버에서 막고, 목록은 비품명·분류·상태를 표로 보여주면서 상태 필터를 답니다.

다음으로 대여 신청과 내 신청 내역을 붙입니다. 목록 화면에서 신청 창을 열어 비품과 사유를 받고, 신청이 접수되면 그 비품은 바로 대여중으로 바뀌어 다른 사원이 같은 비품을 중복으로 신청하지 못하게 합니다. 신청 취소는 아직 총무팀이 처리하지 않은 건에만 열어 둡니다.

마지막으로 총무팀 승인 화면을 만듭니다. 승인과 반려를 처리하고, 반려한 비품은 다시 대여 가능으로 돌려 다른 사원이 신청할 수 있게 합니다. 일반 사원은 메뉴에서 승인 화면이 보이지 않을 뿐 아니라 주소를 직접 쳐도 들어가지 못하도록 서버에서 막겠습니다.

화면에 보이는 버튼과 상태 이름은 요구사항에 적힌 그대로 사용하겠습니다. 각 단계를 별도 PR로 올려 마일스톤별로 따로 검수하실 수 있게 하겠습니다.'
  );

  -- ── 다시 발주자로 전환해 선정 ────────────────────────────────────────────
  -- selected_by 와 이름 스냅샷은 트리거가 채우고, 프로젝트는 자동으로 닫힌다.
  perform set_config('request.jwt.claims', json_build_object('sub', v_company)::text, true);

  insert into public.selections (project_id, proposal_id)
  values (v_project, v_proposal);

  -- ── 공식 저장소 연결 ─────────────────────────────────────────────────────
  insert into public.project_repositories (
    project_id, provider, owner_name, repository_name, repository_url,
    default_branch, github_repository_id, github_installation_id, is_private,
    connected_by, company_confirmed_at
  ) values (
    v_project, 'github', 'kimminjunnn', 'linkross-github-app-test',
    'https://github.com/kimminjunnn/linkross-github-app-test',
    'main', 1337884986, 154539003, true,
    v_company, now()
  );

  perform set_config('request.jwt.claims', '', true);

  raise notice '생성된 프로젝트 ID: %', v_project;
  raise notice 'SOW 작성 화면: /company/projects/%/sow', v_project;
end $$;

-- ===========================================================================
-- 3부. 결과 확인
-- ===========================================================================
--
-- 아래 select는 1행만 나와야 한다. 여러 행이 나오면 이전 중복이 남아 있는 것이다.

select p.id                                        as project_id,
       p.title,
       p.status,
       p.lifecycle_stage,
       r.owner_name || '/' || r.repository_name    as repository,
       f.freelancer_display_name_snapshot          as selected_freelancer,
       '/company/projects/' || p.id || '/sow'      as sow_url
from public.projects p
left join public.project_repositories r on r.project_id = p.id
left join public.selections s on s.project_id = p.id
left join public.proposals f on f.id = s.proposal_id
where p.company_id = '97ef85c7-dea9-41ed-9907-17a7815633ca'
  and p.title like '사내 비품 대여%'
order by p.created_at desc;
