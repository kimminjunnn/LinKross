-- 검수 어휘 v3(선택 상태·개수·목록 내용) 검증용 테스트 프로젝트 시드.
--
-- Supabase SQL Editor에서 한 번 실행한다. 앱 UI의 프로젝트 등록 → 모집 →
-- 제안 → 선정 → 저장소 연결까지를 대신 만들어, SOW 작성부터 바로 시작한다.
--
-- 참여자
--   발주자   alswns8495     019ef72a-23ec-4096-bacf-ca72ac12afbd
--   프리랜서 onemore990109  0a93c5d0-2d40-40af-90a5-8ed34179f0de
--   저장소   kimminjunnn/linkross-github-app-test (기존 프로젝트와 같은 설치)
--
-- 트리거를 끄지 않는다. request.jwt.claims 로 각 단계의 행위자를 지정해
-- 앱과 같은 규칙(역할 확인, 모집 기간, 프로필 스냅샷)을 그대로 통과시킨다.
-- 따라서 여기서 만들어진 데이터는 실제 사용자 흐름으로 만든 것과 같은 모양이다.

do $$
declare
  v_company    uuid := '019ef72a-23ec-4096-bacf-ca72ac12afbd';
  v_freelancer uuid := '0a93c5d0-2d40-40af-90a5-8ed34179f0de';
  v_project    uuid := gen_random_uuid();
  v_req        uuid := gen_random_uuid();
  v_proposal   uuid := gen_random_uuid();
begin
  -- ── 발주자로 행동 ────────────────────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', v_company)::text, true);

  -- 모집 중 상태로 만든다. 제안서 트리거가 모집 기간을 확인하기 때문이다.
  insert into public.projects (id, company_id, title, status, lifecycle_stage)
  values (v_project, v_company, '할 일 관리 MVP (검수 어휘 v3 검증)', 'recruiting', 'preparing');

  -- 모집 기간은 요구사항 버전에 있다. 지금이 그 안에 들도록 잡는다.
  insert into public.project_requirement_versions (
    id, project_id, version_number, title, project_type, technology,
    goal, requirements, deliverables, out_of_scope, reference_notes,
    applicant_guidance, budget_amount, budget_type, currency,
    start_date, end_date, recruitment_start_at, recruitment_end_at, created_by
  ) values (
    v_req, v_project, 1,
    '할 일 관리 MVP (검수 어휘 v3 검증)',
    'web', 'Next.js, TypeScript',
    '로그인한 사용자가 자신의 할 일을 등록하고 완료 여부를 관리한다.',
    '- /login 에서 이메일과 비밀번호로 로그인한다.
- 로그인에 성공하면 /dashboard 로 이동한다.
- 비밀번호가 틀리면 오류 메시지를 보여준다.
- 로그인한 사용자만 /todos 에 접근할 수 있다.
- 입력란에 할 일 내용을 적고 추가 버튼을 누르면 목록에 한 건이 추가된다.
- 입력란이 비어 있으면 추가 버튼을 누를 수 없다.
- 할 일 내용은 100자까지만 허용한다. 100자를 넘기면 추가되지 않고 오류를 보여준다.
- 각 할 일 옆의 체크박스를 누르면 완료 상태가 된다.
- 완료된 할 일의 체크박스를 다시 누르면 진행중 상태로 돌아간다.
- /todos 에서 진행중 필터를 선택하면 완료되지 않은 할 일만 보인다.
- 완료 필터를 선택하면 완료된 할 일만 보인다.
- 각 할 일의 삭제 버튼을 누르면 목록에서 사라진다.
- 할 일이 하나도 없으면 안내 문구를 보여준다.',
    '배포 가능한 웹앱, 소스 코드',
    '공유, 마감일, 알림, 카테고리, 회원가입, 비밀번호 재설정',
    'github.com/kimminjunnn/linkross-github-app-test',
    '구현 순서와 각 기능의 확인 방법을 제안서에 포함해 주세요.',
    12000, 'fixed', 'USD',
    current_date, current_date + 14,
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
    '로그인부터 구현한 뒤 할 일 등록·완료 처리·필터·삭제 순으로 진행하겠습니다. 각 화면은 브라우저에서 직접 확인할 수 있게 만들겠습니다.'
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

-- 방금 만든 프로젝트 확인
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
where p.title = '할 일 관리 MVP (검수 어휘 v3 검증)'
order by p.created_at desc
limit 1;
