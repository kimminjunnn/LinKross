-- 사내 비품 대여 관리 프로젝트 — 프리랜서 선정 직전 상태까지만 만드는 시드.
--
-- Supabase SQL Editor에서 한 번 실행한다. 전체가 하나의 트랜잭션이라 중간에
-- 실패하면 통째로 롤백된다.
--
-- 어디까지 만드는가
--   프로젝트 등록 -> 요구사항 등록(모집 중) -> 수행 제안서 제출까지.
--   선정(프리랜서 매칭)과 저장소 연결은 하지 않는다. 그 뒤부터는 화면에서 직접
--   한다. 확정 시연본(`seed_asset_rental_project.sql`)은 선정과 저장소 연결까지
--   끝난 상태로 만들어져 선정 화면을 다시 볼 수 없어서, 그 앞 단계를 보여줄
--   프로젝트를 따로 만든다.
--
-- 참여자 (확정 시연본과 동일)
--   발주자   sesac2024ai11    97ef85c7-dea9-41ed-9907-17a7815633ca (새싹컴퍼니)
--   지원자   onemore990109    0a93c5d0-2d40-40af-90a5-8ed34179f0de (Messi)
--
--   지원자를 여러 명 세우려면 계정마다 실제 auth 사용자와 프리랜서 프로필이
--   있어야 한다. 제안서 insert 트리거가 freelancer 역할과 프로필 스냅샷을
--   요구하기 때문이다. 지금 시드에 있는 계정은 위 한 명뿐이다.
--
-- 요구사항 원문은 `eval/presets/asset-rental.txt`를 그대로 넣는다. SOW 작성
-- 화면의 업무 상세에 붙여넣는 텍스트가 이 원문과 같아야 완료조건이 확정된
-- 문장으로 나온다. 요구사항에 다른 글이 들어 있으면 그것을 붙여넣게 되고,
-- 그때는 평소의 LLM 분석 경로로 간다.
--
-- 모집 기간은 지금부터 7일 뒤까지로 잡는다. 제안서 제출 트리거가 프로젝트가
-- 모집 중인지, 지금이 모집 기간 안인지 확인한다. 시드를 만든 지 일주일이 지나면
-- 새 제안서를 받을 수 없으니 그때는 다시 실행한다.

do $seed$
declare
  v_company    uuid := '97ef85c7-dea9-41ed-9907-17a7815633ca';
  v_freelancer uuid := '0a93c5d0-2d40-40af-90a5-8ed34179f0de';
  v_base_title text := '사내 비품 대여 관리';
  v_title      text := v_base_title;
  v_title_no   integer := 1;

  -- 지원자 제안서까지 넣을지 정한다. false로 두면 모집 중 공고만 만들어지고,
  -- 제안서 제출부터 화면에서 직접 보여줄 수 있다.
  v_submit_proposal boolean := true;

  v_project    uuid := gen_random_uuid();
  v_req        uuid := gen_random_uuid();
  v_proposal   uuid := gen_random_uuid();
begin
  -- 같은 회사에 같은 제목이 있으면 비어 있는 다음 번호를 붙인다.
  -- 예: 사내 비품 대여 관리 -> 사내 비품 대여 관리 2 -> 3 -> 4
  while exists (
    select 1
    from public.projects
    where company_id = v_company
      and title = v_title
  ) loop
    v_title_no := v_title_no + 1;
    v_title := v_base_title || ' ' || v_title_no;
  end loop;

  -- ── 발주자로 행동 ────────────────────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', v_company)::text, true);

  insert into public.projects (id, company_id, title, status, lifecycle_stage)
  values (v_project, v_company, v_title, 'recruiting', 'preparing');

  -- 모집 기간은 프로젝트가 아니라 요구사항 버전에 있다.
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
    $txt$저희는 직원 20명 정도 되는 회사인데, 공용으로 쓰는 노트북과 모니터, 촬영용 카메라,
회의실 프로젝터 같은 비품을 총무팀 한 명이 엑셀로 관리하고 있습니다.

지금은 슬랙에 "이번 주에 카메라 쓸 수 있나요?" 하고 물어보면 총무 담당자가 엑셀을
열어보고 답해주는 식입니다. 담당자가 외근이면 아무도 모르고, 빌려주고 나서 엑셀에
적는 걸 깜빡하면 같은 장비를 두 사람이 빌려간 걸로 되어 있는 일이 한 달에 두세 번은
생깁니다. 그때마다 누가 먼저 말했느냐로 얼굴을 붉히게 됩니다.

거창한 자산관리 시스템을 원하는 게 아닙니다. 직원이 스스로 "이거 지금 빌릴 수 있나,
누가 갖고 있나"를 확인하고 신청까지 넣고, 총무팀은 들어온 신청을 승인하거나 반려하기만
하면 되는 화면 몇 개면 충분합니다.

전체 흐름은 이렇게 생각하고 있습니다. 사원이 로그인해서 비품 목록을 보고, 필요한 걸
골라 사유를 적어 신청하면, 총무팀이 승인 화면에서 승인하거나 반려합니다. 승인된 비품은
목록에서 대여중으로 남고, 반려된 비품은 다시 대여 가능으로 풀립니다.

저희 쪽에 개발을 아는 사람이 없어서, 한 번에 다 만들어서 주시면 무엇이 되고 무엇이
안 되는지 저희가 확인할 방법이 없습니다. 그래서 아래처럼 세 단계로 나눠서 단계마다
Pull Request 하나씩 올려주시고, 저희가 그 단계만 확인한 뒤 다음으로 넘어가는 방식으로
진행하고 싶습니다.


[1단계] 로그인과 비품 목록 화면

회원가입은 필요 없습니다. 직원 계정은 저희가 미리 만들어 드릴 테니 이메일과 비밀번호로
로그인만 되면 됩니다. 로그인에 성공하면 곧바로 비품 목록 화면이 열렸으면 합니다.

비밀번호를 잘못 입력했는데 화면에 아무 반응이 없으면 저희에게 문의가 옵니다. 왜 로그인이
안 되는지 오류 메시지가 화면에 보여야 합니다. 이메일을 아예 비워둔 채로 로그인을 눌렀을
때도 그냥 넘어가지 않고, 마찬가지로 오류 메시지를 보여주면서 막아 주세요.

그리고 이건 꼭 지켜졌으면 하는 부분인데, 로그인하지 않은 사람이 주소를 알아내서 비품
목록 화면으로 바로 들어오는 일이 없어야 합니다. 사내 장비 현황이라 외부에 보이면
곤란합니다. 그런 경우에는 로그인 화면으로 돌려보내 주세요.

목록 화면에는 비품을 표로 보여주시면 됩니다. 컬럼은 '비품명', '분류', '상태' 세 개면
충분하고, 상태는 '대여 가능'과 '대여중' 두 가지로만 보여주세요.

목록 위에는 '전체', '대여 가능', '대여중' 버튼을 두어 걸러 볼 수 있으면 좋겠습니다.
'대여 가능'을 누르면 빌릴 수 있는 비품만, '대여중'을 누르면 이미 나가 있는 비품만,
'전체'를 누르면 모든 비품이 보이는 식입니다. 직원들이 가장 많이 쓸 기능이 "지금 빌릴
수 있는 것만 보기"라서 이건 꼭 있어야 합니다.


[2단계] 비품 신청과 내 신청 내역 화면

목록 화면에 '비품 신청' 버튼을 두고, 누르면 신청 창이 뜨는 형태를 생각하고 있습니다.
신청 창에서는 '비품'을 고르고 '신청 사유'를 적게 해주세요. 이미 나가 있는 장비를 고를
수 있으면 의미가 없으니, 비품을 고르는 목록에는 '대여 가능'인 것만 나오고 '대여중'인
비품은 아예 보이지 않아야 합니다.

비품을 고르지 않은 상태에서는 '신청하기' 버튼을 누를 수 없게 해주세요. 마찬가지로
'신청 사유'를 적지 않은 상태에서도 '신청하기'를 누를 수 없어야 합니다. 사유가 빈 신청이
올라오면 총무팀이 판단할 근거가 없습니다. 반대로 사유를 너무 길게 쓰는 것도 곤란해서,
100자를 넘겨서 '신청하기'를 누르면 신청을 받지 말고 오류 문구를 보여주세요.

신청을 넣고 나서 접수가 된 건지 아닌지 몰라 같은 신청을 또 하는 일이 없도록,
"신청이 접수되었습니다" 처럼 접수됐다는 문구를 보여주세요. 화면을 옮길 필요는 없고
비품 목록 화면에 그대로 보이면 됩니다. 그리고 신청이 들어간 비품은 목록에서 곧바로
'대여중'으로 바뀌어야 합니다. 그래야 다른 직원이 같은 장비를 중복으로 신청하지 않습니다.

내가 넣은 신청을 확인하는 화면도 필요합니다. 컬럼은 '비품명', '신청 사유', '상태'로
하고, 상태는 '승인 대기', '승인 완료', '반려됨' 세 가지로 구분해 주세요. 여기는 본인이
낸 신청만 보여야 하고, 다른 직원이 무엇을 신청했는지는 보이면 안 됩니다.

마음이 바뀌는 경우도 있어서, 아직 총무팀이 처리하지 않은 '승인 대기' 상태의 신청에는
'취소' 버튼이 있어서 본인이 무를 수 있으면 합니다. 취소한 비품은 비품 목록에서 다시
'대여 가능'으로 돌아가야 합니다.

아직 아무것도 신청하지 않은 직원이 이 화면에 들어오면 빈 표만 덩그러니 보일 텐데,
고장 난 줄 알 것 같습니다. "아직 신청한 비품이 없습니다" 같은 문구를 보여주세요.

이 화면도 로그인하지 않은 상태로 주소를 직접 입력해서 들어올 수 없어야 하고, 그런
경우에는 로그인 화면으로 돌려보내 주세요.


[3단계] 총무팀 승인 화면

총무 담당자가 쓸 화면입니다. 직원들이 넣은 신청을 전부 보여주는데, '신청자', '비품명',
'신청 사유', '상태'가 한 줄에 다 보여야 합니다. 아직 아무 신청도 들어오지 않았다면
"아직 들어온 신청이 없습니다" 같은 문구를 보여주세요.

'승인 대기'인 건에는 '승인'과 '반려' 버튼을 두고, 이미 처리한 건에는 두 버튼 다 없어야
합니다. 버튼이 그대로 남아 있으면 담당자가 실수로 또 누르게 됩니다. '승인'을 누르면 그
건의 상태가 '승인 완료'로 바뀌고, '반려'를 누르면 '반려됨'으로 바뀝니다.

반려한 비품은 비품 목록에서 다시 '대여 가능'으로 풀려서 다른 직원이 신청할 수 있어야
하고, 승인한 비품은 '대여중'으로 남아 있어야 합니다.

총무팀이 처리를 끝낸 뒤에는 사원이 그 신청을 무를 수 없어야 합니다. 내 신청 내역에서
'승인 완료'나 '반려됨'이 된 건에는 '취소' 버튼이 없어야 합니다. 총무팀이 승인했는데
뒤에서 사라지면 관리가 안 됩니다.

이 화면은 총무팀만 쓰는 화면입니다. 일반 직원 계정으로는 상단 메뉴에 '승인 관리'가 아예
보이지 않아야 합니다. 메뉴에 없다고 끝이 아니라, 주소를 직접 입력해서 들어오려고 해도
막고 비품 목록 화면으로 돌려보내면서 왜 막혔는지 안내 문구를 보여주세요. 직원 인사 관련
사유가 적힌 신청도 있을 수 있어서 이 부분은 꼭 확인하고 싶습니다.


[이번 범위에서 빼는 것]

회원가입과 비밀번호 재설정은 필요 없습니다. 계정은 저희가 직접 넣겠습니다. 비품을 새로
등록하거나 수정, 삭제하는 화면도 이번에는 만들지 않습니다. 비품 종류가 자주 바뀌지 않아서
당분간은 저희가 데이터를 직접 넣어도 됩니다. 반납 처리와 대여 기간, 연체 관리도 이번에는
빼겠습니다. 알림이나 사진 첨부도 지금은 필요 없습니다.


[화면 주소]

개발하시면서 물어보실 것 같아 화면 주소를 미리 정해뒀습니다. 이대로 만들어 주세요.

- /login : 로그인 화면
- /items : 비품 목록 화면
- /requests : 내 신청 내역 화면
- /admin : 총무팀 승인 화면$txt$,
    '배포 가능한 웹앱, 소스 코드',
    '회원가입, 비밀번호 재설정, 비품 등록·수정·삭제, 반납 처리, 대여 기간과 연체 관리, 알림, 사진 첨부',
    'github.com/kimminjunnn/linkross-github-app-test (마일스톤별 PR #5, #6, #7)',
    '구현 순서와 각 화면을 브라우저에서 확인하는 방법을 제안서에 포함해 주세요.',
    -- 세 개의 마일스톤을 각각 1 USDC로 구성한다.
    3, 'fixed', 'USDC',
    current_date, current_date + 21,
    now() - interval '1 hour', now() + interval '7 days',
    v_company
  );

  update public.projects set current_requirement_version_id = v_req where id = v_project;

  -- ── 지원자로 전환해 수행 제안서 제출 ─────────────────────────────────────
  -- status·submitted_at·프로필 스냅샷은 트리거가 채운다. 여기서 넣지 않는다.
  if v_submit_proposal then
    perform set_config('request.jwt.claims', json_build_object('sub', v_freelancer)::text, true);

    insert into public.proposals (id, project_id, freelancer_id, content)
    values (v_proposal, v_project, v_freelancer, $prop$화면 단위로 세 번에 나눠 올리겠습니다.

먼저 로그인과 비품 목록을 만듭니다. 로그인하지 않은 상태로 주소를 직접 쳐도 목록이 열리지 않도록 서버에서 막고, 목록은 비품명·분류·상태를 표로 보여주면서 상태 필터를 답니다.

다음으로 대여 신청과 내 신청 내역을 붙입니다. 목록 화면에서 신청 창을 열어 비품과 사유를 받고, 신청이 접수되면 그 비품은 바로 대여중으로 바뀌어 다른 사원이 같은 비품을 중복으로 신청하지 못하게 합니다. 신청 취소는 아직 총무팀이 처리하지 않은 건에만 열어 둡니다.

마지막으로 총무팀 승인 화면을 만듭니다. 승인과 반려를 처리하고, 반려한 비품은 다시 대여 가능으로 돌려 다른 사원이 신청할 수 있게 합니다. 일반 사원은 메뉴에서 승인 화면이 보이지 않을 뿐 아니라 주소를 직접 쳐도 들어가지 못하도록 서버에서 막겠습니다.

화면에 보이는 버튼과 상태 이름은 요구사항에 적힌 그대로 사용하겠습니다. 각 단계를 별도 PR로 올려 마일스톤별로 따로 검수하실 수 있게 하겠습니다.$prop$);
  end if;

  -- 여기서 멈춘다. 선정(selections)과 저장소 연결(project_repositories)은
  -- 화면에서 직접 한다. 선정을 넣으면 트리거가 프로젝트를 바로 진행 중으로
  -- 바꿔 모집·선정 화면을 다시 볼 수 없다.

  perform set_config('request.jwt.claims', '', true);

  raise notice '생성된 프로젝트 ID: %', v_project;
  raise notice '발주자 화면: /company/projects/%', v_project;
  raise notice '제안서 제출: %', case when v_submit_proposal then '1건' else '없음 (화면에서 직접 제출)' end;
end $seed$;

-- ===========================================================================
-- 결과 확인
-- ===========================================================================
--
-- 방금 만든 프로젝트가 status='recruiting', selected_freelancer=null 로 나와야
-- 한다. selected_freelancer에 이름이 찍혀 있으면 선정까지 진행된 것이다.

select p.id                                   as project_id,
       p.title,
       p.status,
       p.lifecycle_stage,
       (select count(*) from public.proposals pr where pr.project_id = p.id) as proposal_count,
       f.freelancer_display_name_snapshot     as selected_freelancer,
       rv.recruitment_end_at                  as recruitment_ends,
       '/company/projects/' || p.id           as project_url
from public.projects p
left join public.project_requirement_versions rv on rv.id = p.current_requirement_version_id
left join public.selections s on s.project_id = p.id
left join public.proposals f on f.id = s.proposal_id
where p.company_id = '97ef85c7-dea9-41ed-9907-17a7815633ca'
  and p.title like '사내 비품 대여%'
order by p.created_at desc;

-- ===========================================================================
-- 정리하고 다시 만들 때 (필요할 때만 주석을 푼다)
-- ===========================================================================
--
-- 위 시드로 만든 프로젝트를 지운다. 프로젝트에 딸린 FK는 전부 on delete restrict
-- 이고, 제출된 제안서와 요구사항 버전에는 삭제 금지 트리거가 걸려 있다. 감사
-- 이력을 지키려고 일부러 그렇게 만든 것이므로 여기서만 잠깐 풀고 바로 되돌린다.
--
-- v_targets 에 위 select로 확인한 project_id를 넣고 실행한다. SOW·검수·정산
-- 이력이 붙은 프로젝트는 블록이 스스로 멈춘다.
--
-- do $cleanup$
-- declare
--   v_targets uuid[] := array[
--     '00000000-0000-0000-0000-000000000000'::uuid  -- 지울 project_id
--   ];
--   v_blocking int;
-- begin
--   select count(*) into v_blocking
--   from (
--     select 1 from public.sow_versions       where project_id = any(v_targets)
--     union all
--     select 1 from public.milestones         where project_id = any(v_targets)
--     union all
--     select 1 from public.verification_runs   where project_id = any(v_targets)
--     union all
--     select 1 from public.audit_events        where project_id = any(v_targets)
--     union all
--     select 1 from public.invoices            where project_id = any(v_targets)
--     union all
--     select 1 from public.payments            where project_id = any(v_targets)
--   ) blocking;
--
--   if v_blocking > 0 then
--     raise exception 'SOW·검수·정산 이력이 %건 남아 있어 삭제를 중단합니다.', v_blocking;
--   end if;
--
--   alter table public.proposals disable trigger proposals_protect_submitted;
--   alter table public.project_requirement_versions disable trigger requirement_versions_immutable;
--
--   update public.projects
--   set current_requirement_version_id = null
--   where id = any(v_targets);
--
--   delete from public.selections                   where project_id = any(v_targets);
--   delete from public.proposals                    where project_id = any(v_targets);
--   delete from public.project_repositories         where project_id = any(v_targets);
--   delete from public.project_requirement_versions where project_id = any(v_targets);
--   delete from public.projects                     where id = any(v_targets);
--
--   alter table public.proposals enable trigger proposals_protect_submitted;
--   alter table public.project_requirement_versions enable trigger requirement_versions_immutable;
--
--   raise notice '삭제 완료';
-- end $cleanup$;
